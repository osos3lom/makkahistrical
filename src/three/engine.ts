/**
 * ViewerEngine — the museum-quality 3D stage for the Empire Atlas.
 *
 * Renderer: three.js WebGPURenderer (WebGPU where available, WebGL2 fallback),
 * with TSL node materials for atmosphere, contact shadow, rim light and the
 * selection glow. Models are normalized into a consistent museum frame and
 * occluded markers use BVH-accelerated raycasts.
 */
import * as THREE from "three/webgpu";
import {
  color,
  float,
  normalView,
  positionLocal,
  positionViewDirection,
  smoothstep,
  uniform,
} from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";
import gsap from "gsap";
import type { CameraPreset, Empire, Hotspot, Vec3 } from "@/types/empire";

/** What the engine needs in order to frame and annotate a model.
 *
 *  It reads exactly four things off an exhibit — its id, its tint, its camera
 *  preset and its hotspots — and nothing else. Naming that slice means a
 *  procedurally built design can be framed by the same code without pretending
 *  to be an `Empire`. `Empire` satisfies this structurally, so every existing
 *  call site keeps compiling unchanged. */
export interface Framing {
  id: string;
  tint: string;
  camera: CameraPreset;
  hotspots: Hotspot[];
}
import { asset } from "@/lib/assets";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;

/** dwellings kept parsed in memory at once (~2MB of source geometry each) */
const MAX_RESIDENT = 6;
const TARGET_SIZE = 2.0; // normalized model footprint, world units
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

export interface AnchorProjection {
  x: number;
  y: number;
  /** distance from camera to the anchor, world units (drives depth scaling) */
  distance: number;
  behindCamera: boolean;
  occluded: boolean;
}

export interface LoadedModel {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  size: THREE.Vector3;
  /** Identifies this parsed model in the residency and snap caches. For a
   *  loaded exhibit it is the exhibit id; for a generated design it is a hash
   *  of the spec. Deliberately not called `empireId` any more — it stopped
   *  being one the moment geometry could come from somewhere other than a GLB,
   *  and a cache keyed on a lie is a bug waiting to be written. */
  modelKey: string;
}

type FrameCallback = () => void;

/** Top-surface heights over a model's footprint, in model-local units. */
interface HeightField {
  n: number;
  y: Float32Array;
  min: number;
  max: number;
}

export class ViewerEngine {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGPURenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private loader: GLTFLoader;
  private manager: THREE.LoadingManager;

  private stage = new THREE.Group(); // holds the model group
  private current: LoadedModel | null = null;
  private cache = new Map<string, Promise<LoadedModel>>();
  private frameCbs = new Set<FrameCallback>();
  private raycaster = new THREE.Raycaster();
  private glowShell: THREE.Mesh | null = null;
  private glowPulse = uniform(0.6);
  private rimColor = uniform(new THREE.Color(0xffe8c8));
  private rimIntensity = uniform(0.14);
  private wireOverlays: THREE.Mesh[] = [];
  /** surfaces swapped to plaster for the wireframe view, and their originals */
  private wireSwapped: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];
  private wireOn = false;
  private xrayOn = false;
  private grid: THREE.PolarGridHelper | null = null;
  /* lighting rig — kept as fields so an framing swap can re-tint it */
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private bounceLight!: THREE.DirectionalLight;
  private envTex: THREE.Texture | null = null;
  private contact: THREE.Mesh | null = null;
  private contactOpacity = uniform(0.46);
  private occlusionTimer = 0;
  private occlusionCache = new Map<string, boolean>();
  /** anchors resolved onto the mesh surface, keyed empireId:anchor */
  private snapped = new Map<string, THREE.Vector3>();
  /** per-model top-surface height fields, built once on first use */
  private fields = new Map<string, HeightField>();
  /** framing ids by recency; the tail is evicted once past MAX_RESIDENT */
  private lru: string[] = [];
  /** the swap currently playing, so a new request can interrupt it */
  private activeTl: gsap.core.Timeline | null = null;
  private activeResolve: (() => void) | null = null;
  /** waiting beneath the parchment, attached but not yet handed over */
  private staged: LoadedModel | null = null;
  private lastTime = typeof performance !== "undefined" ? performance.now() : 0;
  private disposed = false;
  /** frames of shadow-map refresh still owed (see renderer.shadowMap.autoUpdate) */
  private shadowDirty = 2;
  /** models retired mid-transition; freed once the animation is over */
  private retired: LoadedModel[] = [];
  /** Procedurally built models, kept separate from `cache`.
   *  Loaded exhibits are expensive to fetch and parse, so they are worth
   *  holding; generated designs are cheap to rebuild and arrive by the dozen
   *  during a scrub, so they get their own smaller, eagerly-trimmed pool. */
  private generated = new Map<string, LoadedModel>();
  private resizeObs: ResizeObserver | null = null;
  /** throwaway target used to warm a model's pipelines off-screen */
  private warmTarget: THREE.RenderTarget | null = null;
  private projScratch = new THREE.Vector3();
  private occScratch = new THREE.Vector3();
  private camState = { az: -38, el: 34, dist: 2.6, tx: 0, ty: 0.4, tz: 0 };
  private reducedMotion = false;
  private ready = false;

  onLoadProgress: ((pct: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = (_u, loaded, total) => {
      if (this.onLoadProgress && total > 0) this.onLoadProgress(Math.round((loaded / total) * 100));
    };
    const draco = new DRACOLoader(this.manager).setDecoderPath(asset("/draco/gltf/"));
    this.loader = new GLTFLoader(this.manager);
    this.loader.setDRACOLoader(draco);
  }

  async init() {
    const renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      forceWebGL: true,
    });
    // the stage backdrop is painted in CSS, not in the scene: filmic tone
    // mapping would drain the warmth out of a rendered parchment gradient
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    await renderer.init();
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    scene.fog = new THREE.Fog(0xf3ead9, 9, 26);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    this.camera.position.set(-1.7, 1.6, 2.4);

    // ── Image-based light: a warm gallery dome so PBR surfaces pick up
    //    sky above / parchment floor bounce instead of flat directional light ──
    this.envTex = this.buildEnvironment();
    if (this.envTex) {
      scene.environment = this.envTex;
      // enough ambient to fill shadow, not so much that everything goes flat
      scene.environmentIntensity = 0.4;
    }

    // ── Lighting: hard sun over soft ambient. The ambient terms stay low so
    //    that form reads through shadow rather than washing out. ──
    const hemi = new THREE.HemisphereLight(0xfff6e8, 0xc9b092, 0.18);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff4e6, 3.1);
    key.position.set(3.0, 4.4, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -2.2;
    key.shadow.camera.right = 2.2;
    key.shadow.camera.top = 2.2;
    key.shadow.camera.bottom = -2.2;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.bias = -0.00016;
    key.shadow.normalBias = 0.018;
    // tight penumbra — architecture wants crisp eaves, not a haze
    key.shadow.radius = 2.6;
    // Orbiting moves the camera, not the building, so the shadow map is only
    // redrawn when the geometry actually changes — the biggest per-frame win.
    key.shadow.autoUpdate = false;
    key.shadow.needsUpdate = true;
    scene.add(key);
    this.keyLight = key;

    // cool sky fill opposite the key — keeps shadow sides from going muddy
    const fill = new THREE.DirectionalLight(0xd6e2f2, 0.22);
    fill.position.set(-3.6, 2.1, -1.7);
    scene.add(fill);

    // warm back rim — separates the silhouette from the parchment backdrop
    const rim = new THREE.DirectionalLight(0xffd39a, 0.72);
    rim.position.set(-2.1, 2.7, -3.7);
    scene.add(rim);
    this.rimLight = rim;

    // floor bounce — a soft upward warmth under eaves and colonnades
    const bounce = new THREE.DirectionalLight(0xffe3c2, 0.16);
    bounce.position.set(0.5, -2.0, 2.4);
    scene.add(bounce);
    this.bounceLight = bounce;

    // ── Ground: a parchment disc that dissolves into the backdrop, so the
    //    dwelling reads as resting on paper rather than on a visible slab ──
    let ground: THREE.Mesh;
    try {
      const gm = new THREE.MeshStandardNodeMaterial({ roughness: 1, metalness: 0, transparent: true });
      gm.colorNode = color(0xfaf3e6);
      gm.opacityNode = smoothstep(0.62, 0.98, positionLocal.xy.length().div(4.2)).oneMinus();
      ground = new THREE.Mesh(new THREE.CircleGeometry(4.2, 96), gm);
    } catch {
      ground = new THREE.Mesh(
        new THREE.CircleGeometry(9, 72),
        new THREE.MeshStandardMaterial({ color: 0xf6eddc, roughness: 1, metalness: 0 }),
      );
    }
    ground.rotation.x = -Math.PI / 2;
    // a hair below the dwellings, whose own base slab sits at y=0: coplanar
    // surfaces z-fight, and the shimmer shows up whenever the camera moves
    ground.position.y = -0.014;
    ground.receiveShadow = true;
    scene.add(ground);

    try {
      const shadowMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
      const d = positionLocal.xy.length().div(1.35);
      shadowMat.colorNode = color(0x2b1f14);
      shadowMat.opacityNode = smoothstep(0.05, 0.88, d).oneMinus().mul(this.contactOpacity);
      const contact = new THREE.Mesh(new THREE.CircleGeometry(1.35, 64), shadowMat);
      contact.rotation.x = -Math.PI / 2;
      contact.position.y = -0.007;
      contact.renderOrder = 1;
      this.contact = contact;
      this.stage.add(contact);
    } catch {
      /* standard shadow map remains as fallback */
    }

    // ── Selection glow shell (TSL fresnel, additive) ──
    try {
      const glowMat = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const fres = float(1.0).sub(normalView.dot(positionViewDirection).clamp(0, 1)).pow(1.8);
      glowMat.colorNode = color(0xd98a4a);
      glowMat.opacityNode = fres.mul(this.glowPulse).mul(0.85);
      this.glowShell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), glowMat);
      this.glowShell.visible = false;
      this.glowShell.renderOrder = 3;
      this.stage.add(this.glowShell);
    } catch {
      this.glowShell = null;
    }

    // ── Polar grid (museum turntable reference) ──
    this.grid = new THREE.PolarGridHelper(1.6, 12, 6, 48, 0xc9b797, 0xdccdb2);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.35;
    this.grid.visible = false;
    this.stage.add(this.grid);

    // ── Controls ──
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.1;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.autoRotateSpeed = 0.9;
    this.controls = controls;

    this.scene.add(this.stage);
    this.resize();
    window.addEventListener("resize", this.resize);
    // the stage can also change height without a window resize (page layout,
    // panel growth), so watch the canvas host directly
    if (typeof ResizeObserver !== "undefined" && this.canvas.parentElement) {
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(this.canvas.parentElement);
    }
    this.ready = true;
    this.loop();
  }

  /** A hand-painted equirectangular gallery dome: warm ivory sky, a soft
   *  key-side glow, and a parchment floor that bounces back into the model.
   *  Cheap to build (64×32 canvas) and gives node materials real IBL. */
  private buildEnvironment(): THREE.Texture | null {
    try {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      const sky = ctx.createLinearGradient(0, 0, 0, 32);
      sky.addColorStop(0.0, "#fffdf6"); // zenith
      sky.addColorStop(0.42, "#f7eedd");
      sky.addColorStop(0.52, "#ead9be"); // horizon
      sky.addColorStop(1.0, "#b6a184"); // floor bounce
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 64, 32);
      // warm sun patch on the key side
      const sun = ctx.createRadialGradient(46, 5, 0, 46, 5, 22);
      sun.addColorStop(0, "rgba(255,240,212,0.95)");
      sun.addColorStop(1, "rgba(255,240,212,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, 64, 32);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    } catch {
      return null;
    }
  }

  /** Warm the rig toward an framing's accent colour — Byzantine gold reads
   *  differently from Inca stone, and the light should say so. */
  setTint(hex: string, dur = 1.1) {
    const tint = new THREE.Color(hex);
    const targets: [THREE.Color | undefined, THREE.Color][] = [
      [this.rimLight?.color, new THREE.Color(0xffd9a4).lerp(tint, 0.45)],
      [this.keyLight?.color, new THREE.Color(0xfff2e2).lerp(tint, 0.16)],
      [this.bounceLight?.color, new THREE.Color(0xffe7cb).lerp(tint, 0.35)],
      [this.rimColor.value as THREE.Color, new THREE.Color(0xffe8c8).lerp(tint, 0.4)],
    ];
    targets.forEach(([src, to]) => {
      if (!src) return;
      if (this.reducedMotion || dur <= 0.01) src.copy(to);
      else gsap.to(src, { r: to.r, g: to.g, b: to.b, duration: dur, ease: "power2.inOut" });
    });
  }

  /**
   * Tip a dwelling about the hinge line running along the rear edge of its
   * base — the edge furthest from the camera — so it falls backwards away
   * from the room rather than toward it.
   *
   * Rotating about that edge rather than the model's own origin is what keeps
   * every part of it above the floor for the whole arc: at -90° the building
   * lies flat *behind* the hinge, so it never dips through the ground plane
   * and never throws the shadow acne a floor intersection causes.
   */
  /** Ask for the shadow map to be redrawn over the next few frames. */
  private markShadowDirty(frames = 2) {
    this.shadowDirty = Math.max(this.shadowDirty, frames);
  }

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent || !this.renderer) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 2 || h < 2) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // Resolution budget: full DPR on modest canvases, scaled back on large
    // ones so a retina 2× never asks for more fragments than it can afford.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const MAX_PIXELS = 3_500_000;
    const wanted = w * h * dpr * dpr;
    const ratio = wanted > MAX_PIXELS ? Math.max(1, dpr * Math.sqrt(MAX_PIXELS / wanted)) : dpr;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    this.markShadowDirty(2);
  };

  private loop = () => {
    if (this.disposed) return;
    requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0.016;
    this.lastTime = now;
    this.controls?.update();
    // idle glow pulse — only worth computing while something is highlighted
    if (this.glowShell?.visible) {
      this.glowPulse.value = 0.55 + Math.sin(performance.now() * 0.0024) * 0.25;
    }
    // throttled occlusion refresh
    this.occlusionTimer += dt;
    if (this.occlusionTimer > 0.14) {
      this.occlusionTimer = 0;
      this.refreshOcclusion();
    }
    this.frameCbs.forEach((cb) => cb());
    if (this.shadowDirty > 0) {
      this.shadowDirty--;
      if (this.keyLight) this.keyLight.shadow.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  };

  /* ── model loading & normalization ─────────────────────────────── */
  load(empire: Empire): Promise<LoadedModel> {
    const cached = this.cache.get(empire.id);
    if (cached) return cached;
    const p = new Promise<LoadedModel>((resolve, reject) => {
      this.loader.load(
        empire.modelPath,
        (gltf) => {
          try {
            const model = this.normalize(gltf.scene, empire.id);
            // resolve the pins here, while nothing is animating: the height
            // field costs several hundred raycasts and would otherwise hitch
            // the very first frames of the swap
            this.snapAnchors(model, empire);
            // and warm the GPU before the dwelling is ever shown — compiling
            // its pipelines and uploading its textures is what made the first
            // frame of a cold swap drop
            this.warm(model).then(() => resolve(model));
          } catch (e) {
            reject(e);
          }
        },
        undefined,
        reject,
      );
    });
    this.cache.set(empire.id, p);
    return p;
  }

  /** Compile a model's shaders and upload its textures while it is still
   *  off-stage, so its first visible frame costs nothing extra. */
  private async warm(model: LoadedModel) {
    if (!this.renderer) return;
    try {
      // Compile against the live scene for lighting context, but WITHOUT
      // putting the model in it: this await spans many frames, and a model
      // sitting in the scene graph across it would be drawn on top of the
      // dwelling currently on stage — which is what flashed on hover.
      await this.renderer.compileAsync(model.group, this.camera, this.scene);

      // The shadow-depth pipeline needs a real render with the model casting.
      // Everything from here to the removal is synchronous — no await — so no
      // visible frame can ever catch the model in the scene.
      this.warmTarget ??= new THREE.RenderTarget(16, 16);
      model.group.position.set(0, 0, 0);
      this.renderer.setRenderTarget(this.warmTarget);
      this.scene.add(model.group);
      if (this.keyLight) this.keyLight.shadow.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
      this.scene.remove(model.group);
      // and redraw the shadow map for the real scene, so the warm pass leaves
      // no trace of itself for the next on-screen frame to pick up
      if (this.keyLight) this.keyLight.shadow.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
    } catch {
      /* warming is an optimisation; a failure just means the first frame pays */
    } finally {
      this.renderer?.setRenderTarget(null);
      this.scene.remove(model.group);
      model.group.position.set(0, 0, 0);
      this.markShadowDirty(2);
    }
  }

  preload(empire: Empire) {
    if (!this.cache.has(empire.id)) this.load(empire).catch(() => undefined);
  }

  /** Take geometry this engine did not load and put it through exactly the
   *  same pipeline as a GLB: normalisation, footprint scaling, BVH, the rim
   *  node material, anchor snapping and the warm pass.
   *
   *  This is the single entry point for procedurally built scenes. Nothing in
   *  `normalize` is GLTF-specific, which is why the seam is this small — the
   *  alternative, a parallel path for generated geometry, would drift from the
   *  loaded one within a release.
   *
   *  `bvh` and `warm` exist because the studio rebuilds on every slider tick:
   *  `computeBoundsTree` blocks the main thread for tens of milliseconds and
   *  `warm` renders the group off-screen, neither of which is acceptable at
   *  scrub rate. Drop both while dragging, then do one full pass on release so
   *  pins and occlusion come back. */
  async adopt(
    root: THREE.Object3D,
    modelKey: string,
    opts: { bvh?: boolean; warm?: boolean; framing?: Framing } = {},
  ): Promise<LoadedModel> {
    const existing = this.generated.get(modelKey);
    if (existing) return existing;

    const model = this.normalize(root, modelKey, opts.bvh !== false);
    if (opts.framing) this.snapAnchors(model, opts.framing);
    if (opts.warm !== false) await this.warm(model);

    this.generated.set(modelKey, model);
    this.trimGenerated(modelKey);
    return model;
  }

  /** Swap geometry in place: no turntable spin, no fly-to, camera untouched.
   *  `transition` plays a 1.5s 720-degree handover, which is right for changing
   *  exhibit and absurd for nudging a parapet. */
  swapInPlace(model: LoadedModel) {
    const old = this.current;
    this.activeTl?.kill();
    this.activeTl = null;
    if (old && old !== model) this.stage.remove(old.group);
    model.group.rotation.set(0, 0, 0);
    model.group.position.set(0, 0, 0);
    model.group.scale.setScalar(1);
    this.present(model);
    this.markShadowDirty(3);
  }

  /** Free a generated model and everything keyed to it.
   *
   *  `touchResidency` only evicts from `this.cache`, which `adopt` never fills,
   *  so generated models need their own disposal. The height field and the
   *  snapped anchors are both keyed by model key and would otherwise leak one
   *  entry per rebuild — invisible per tick, and fatal across a ten-minute
   *  design session. */
  disposeGenerated(modelKey: string) {
    const m = this.generated.get(modelKey);
    if (!m || m === this.current) return;
    this.generated.delete(modelKey);
    this.fields.delete(modelKey);
    for (const key of [...this.snapped.keys()]) {
      if (key.startsWith(modelKey + ":")) this.snapped.delete(key);
    }
    this.stage.remove(m.group);
    this.disposeModel(m);
  }

  /** Keep the current design and the two most recent variants; drop the rest.
   *  Generated models are cheap to rebuild and a scrub session produces a lot
   *  of them. */
  private trimGenerated(keep: string) {
    const keys = [...this.generated.keys()].filter((k) => k !== keep);
    while (keys.length > 2) {
      const drop = keys.shift();
      if (drop) this.disposeGenerated(drop);
    }
  }

  private normalize(sceneObj: THREE.Object3D, modelKey: string, buildBvh = true): LoadedModel {
    const group = new THREE.Group();
    const inner = sceneObj;
    group.add(inner);

    // Blender exports carry their own sun lamps and delivery camera; the
    // stage has its own rig, so only the geometry is kept
    const strays: THREE.Object3D[] = [];
    inner.traverse((o) => {
      if ((o as THREE.Light).isLight || (o as THREE.Camera).isCamera) strays.push(o);
    });
    strays.forEach((o) => o.removeFromParent());

    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxXZ = Math.max(size.x, size.z) || 1;
    const s = TARGET_SIZE / maxXZ;
    inner.scale.setScalar(s);
    // recenter: footprint center to origin, base to y=0
    inner.position.set(-center.x * s, -box.min.y * s, -center.z * s);

    const meshes: THREE.Mesh[] = [];
    inner.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        const geo = m.geometry as THREE.BufferGeometry;
        if (!(geo as any).boundsTree) {
          // indirect keeps the index buffer as authored instead of reordering
          // it, and fatter leaves mean far less tree to build — this runs on
          // the main thread during load, and our query load is tiny (one snap
          // pass plus four occlusion rays a few times a second)
          // Skipped while the studio is scrubbing: this blocks the main thread
          // and nothing queries it until the drag ends.
          if (buildBvh) (geo as any).computeBoundsTree({ indirect: true, targetLeafSize: 24 });
        }
        this.applyRim(m);
        meshes.push(m);
      }
    });

    const nsize = size.clone().multiplyScalar(s);
    return { group, meshes, size: nsize, modelKey };
  }

  /** TSL rim-light: a soft warm fresnel edge so the architecture reads
   *  against the parchment backdrop. Falls back silently to the
   *  original material if node patching fails. */
  private applyRim(mesh: THREE.Mesh) {
    try {
      const src = mesh.material as THREE.MeshStandardMaterial;
      const nm = new THREE.MeshStandardNodeMaterial();
      nm.color = src.color ? src.color.clone() : new THREE.Color(0xffffff);
      nm.map = src.map ?? null;
      nm.normalMap = src.normalMap ?? null;
      nm.roughnessMap = (src as any).roughnessMap ?? null;
      nm.metalnessMap = (src as any).metalnessMap ?? null;
      nm.aoMap = (src as any).aoMap ?? null;
      nm.roughness = Math.min(1, (src.roughness ?? 0.9) * 1.02);
      nm.metalness = Math.min(0.25, src.metalness ?? 0);
      const fres = float(1.0).sub(normalView.dot(positionViewDirection).clamp(0, 1)).pow(2.6);
      nm.emissiveNode = fres.mul(this.rimColor).mul(this.rimIntensity);
      mesh.material = nm;
    } catch {
      /* keep original material */
    }
  }

  /** Present a loaded model (assumes transition choreography is driven by caller). */
  /** Put a model on the turntable. The outgoing one is retired separately,
   *  so both can be on stage together while they pass each other under the
   *  floor. */
  attach(model: LoadedModel) {
    if (!model.group.parent) this.stage.add(model.group);
    // the contact shadow hugs whatever footprint is on the turntable
    if (this.contact) {
      const spread = Math.max(model.size.x, model.size.z) / 2;
      this.contact.scale.setScalar(Math.max(0.4, spread * 0.92));
    }
    this.markShadowDirty(1);
  }

  /** Hand the stage over: `model` becomes the current dwelling. Recently
   *  seen dwellings stay parsed and resident, so switching back to one is
   *  instant instead of a fresh download, re-parse and re-snap. */
  present(model: LoadedModel) {
    const old = this.current;
    // Identity, not key. Two different LoadedModels could never share an id
    // while every model came from a GLB, so comparing keys was accidentally
    // correct. The studio rebuilds a design under a stable key on every slider
    // tick, and the old group would never be removed — two buildings stacked
    // on the turntable. Comparing the objects is both correct and simpler.
    if (old && old !== model) this.stage.remove(old.group);
    this.current = model;
    this.occlusionCache.clear();
    this.attach(model);
    this.touchResidency(model.modelKey);
    // carry the active layers onto the dwelling that just arrived
    this.buildWireframe();
    if (this.xrayOn) this.setXray(true);
  }

  /** Mark a model as most-recently-used and evict past the residency cap.
   *  Evicted models are queued, never freed mid-animation. */
  private touchResidency(id: string) {
    this.lru = [id, ...this.lru.filter((x) => x !== id)];
    while (this.lru.length > MAX_RESIDENT) {
      const drop = this.lru.pop();
      if (!drop || drop === this.current?.modelKey) continue;
      const p = this.cache.get(drop);
      this.cache.delete(drop);
      this.fields.delete(drop);
      p?.then((m) => {
        if (m !== this.current) {
          this.stage.remove(m.group);
          this.retired.push(m);
        }
      }).catch(() => undefined);
    }
  }

  /** Free everything retired by the last swap. Called once the stage is still. */
  private flushRetired() {
    const list = this.retired;
    this.retired = [];
    list.forEach((m) => {
      if (m !== this.current) this.disposeModel(m);
    });
  }

  /**
   * The exhibit exchange. The outgoing dwelling descends straight through the
   * stage floor and the new one rises out of the same spot — no dissolve.
   * Fading the materials meant turning off depth writes, which let you see
   * clean through the building into its own interior and read as a corrupted
   * model; sinking behind an opaque floor keeps the geometry solid the whole
   * way. `onMidpoint` fires at the handover, when the panels should flip.
   */
  /**
   * The exchange, played as a turntable spin. The dwelling on stage spins up
   * about its own axis, and at the point where it is turning fastest — where
   * the eye cannot resolve which building it is looking at — the next one
   * takes over the same rotation and carries it, decelerating, round to rest.
   *
   * Nothing leaves the ground, so there is no floor plane to cut a colonnade
   * or an open courtyard in half, no surface to withdraw, and no moment where
   * the stage is empty. The dwelling casts its shadow throughout, and the
   * shadow turns with it.
   */
  transition(next: LoadedModel, framing: Framing, opts: { instant?: boolean; onMidpoint?: () => void } = {}): Promise<void> {
    const { onMidpoint } = opts;
    const instant = opts.instant || this.reducedMotion;

    // ── interrupt whatever is in flight, wherever it happens to be ──
    this.activeTl?.kill();
    this.activeTl = null;
    this.activeResolve?.();
    this.activeResolve = null;
    if (this.staged && this.staged !== next && this.staged !== this.current) {
      this.stage.remove(this.staged.group);
    }
    this.staged = null;

    const old = this.current !== next ? this.current : null;

    /** where the baton passes, and where the spin comes to rest — a whole
     *  number of turns, so the dwelling lands back on its own bearing */
    const HANDOVER = 210;
    const REST = 720;

    const stand = () => {
      next.group.scale.setScalar(1);
      next.group.rotation.set(0, 0, 0);
      next.group.position.set(0, 0, 0);
    };

    const handover = () => {
      this.present(next);
      onMidpoint?.();
      this.setTint(framing.tint, 1.0);
      this.frameEmpire(framing, !instant);
    };

    if (instant) {
      stand();
      this.contactOpacity.value = 0.46;
      handover();
      return Promise.resolve();
    }

    // one shared state, so the rotation the outgoing dwelling built up is the
    // rotation the incoming one continues — the spin never breaks stride
    const spin = { deg: old ? THREE.MathUtils.radToDeg(old.group.rotation.y) : HANDOVER, hop: 0 };
    const applyTo = (m: LoadedModel) => {
      m.group.rotation.set(0, THREE.MathUtils.degToRad(spin.deg), 0);
      m.group.position.set(0, spin.hop, 0);
      // it lightens on its footing as it comes up to speed
      this.contactOpacity.value = 0.46 * Math.max(0.35, 1 - spin.hop / (m.size.y * 0.09));
    };

    const tl = gsap.timeline();
    this.activeTl = tl;

    // ── winding up ──
    if (old) {
      tl.to(spin, {
        deg: HANDOVER,
        hop: old.size.y * 0.06,
        duration: 0.44,
        ease: "power2.in",
        onUpdate: () => applyTo(old),
      }, 0);
    }

    // ── the baton passes at full speed ──
    const at = old ? 0.44 : 0;
    tl.add(() => {
      stand();
      applyTo(next);
      handover();
    }, at);

    // ── and unwinds to rest on its own bearing ──
    tl.to(spin, {
      deg: REST,
      hop: 0,
      duration: 1.05,
      ease: "power3.out",
      onUpdate: () => applyTo(next),
    }, at);

    // the dwelling is turning, so the shadow keeps pace for the length of it
    tl.eventCallback("onUpdate", () => this.markShadowDirty(1));

    return new Promise<void>((resolve) => {
      this.activeResolve = resolve;
      tl.eventCallback("onComplete", () => {
        this.activeTl = null;
        this.activeResolve = null;
        this.staged = null;
        stand();
        this.contactOpacity.value = 0.46;
        this.flushRetired();
        this.markShadowDirty(2);
        resolve();
      });
    });
  }

  get currentModel() {
    return this.current;
  }

  private disposeModel(m: LoadedModel) {
    m.meshes.forEach((mesh) => {
      (mesh.geometry as any).disposeBoundsTree?.();
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mm: any) => {
        ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap"].forEach((k) => mm[k]?.dispose?.());
        mm.dispose?.();
      });
    });
  }

  private disposeCached(id: string) {
    const p = this.cache.get(id);
    if (!p) return;
    this.cache.delete(id);
    p.then((m) => {
      if (m !== this.current) this.disposeModel(m);
    }).catch(() => undefined);
  }

  /* ── anchor projection & occlusion ─────────────────────────────── */

  /** Raw anchor position: normalised box space → model-local units. */
  private boxAnchor(anchor: Vec3, model: LoadedModel, out = new THREE.Vector3(), bias = true) {
    const { size } = model;
    out.set((anchor[0] - 0.5) * size.x, anchor[1] * size.y, (anchor[2] - 0.5) * size.z);
    if (!bias) return out;
    // sit the pin *on* the skin: a hair off the surface, pushed away from the
    // model core so it never z-fights, but close enough to read as attached
    const off = out.clone().sub(new THREE.Vector3(0, size.y * 0.45, 0));
    if (off.lengthSq() > 1e-6) out.add(off.normalize().multiplyScalar(0.022));
    return out;
  }

  /**
   * Land on the topmost surface at the anchor's footprint position, dropping
   * in from above the whole model. Starting above rather than at the anchor's
   * own height is what makes this reliable: over open sky it finds the
   * courtyard floor, over built mass it finds the roof, and it can never
   * start underneath the surface it was meant to land on. A few nearby
   * samples cover holes in the geometry — a basin, a light well.
   */
  /**
   * Top-surface height field over the model's footprint, sampled once by
   * dropping rays from above. It is what lets a pin find "the roof" or "the
   * courtyard" on a dwelling whose shape the data knows nothing about.
   */
  private heightField(model: LoadedModel, ray: THREE.Raycaster): HeightField {
    const cached = this.fields.get(model.modelKey);
    if (cached) return cached;
    const n = 20;
    const y = new Float32Array(n * n).fill(NaN);
    let min = Infinity;
    let max = -Infinity;
    const top = model.size.y + 0.15;
    const probe = new THREE.Vector3();
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        probe.set(((i + 0.5) / n - 0.5) * model.size.x, top, ((j + 0.5) / n - 0.5) * model.size.z);
        ray.set(model.group.localToWorld(probe), DOWN);
        ray.far = model.size.y + 0.6;
        const hit = ray.intersectObjects(model.meshes, false)[0];
        if (!hit) continue;
        const h = model.group.worldToLocal(hit.point.clone()).y;
        y[j * n + i] = h;
        if (h < min) min = h;
        if (h > max) max = h;
      }
    }
    const field: HeightField = { n, y, min, max };
    this.fields.set(model.modelKey, field);
    return field;
  }

  /**
   * Choose the cell of the height field that best answers "roof" or "court",
   * breaking ties by nearness to the authored anchor so the data still says
   * *which* roof or *which* corner of the court is meant.
   */
  private pickCell(model: LoadedModel, field: HeightField, anchor: Vec3, kind: "roof" | "court", eye: THREE.Vector3, ray: THREE.Raycaster) {
    const { n, y, min, max } = field;
    const range = Math.max(1e-4, max - min);
    const roof = kind === "roof";
    // a roof must be near the top of the mass; a court near the bottom
    const limit = roof ? max - range * 0.2 : min + range * 0.32;
    const cellAt = (idx: number) =>
      new THREE.Vector3(
        ((idx % n) + 0.5) / n - 0.5,
        0,
        (Math.floor(idx / n) + 0.5) / n - 0.5,
      ).multiply(new THREE.Vector3(model.size.x, 0, model.size.z)).setY(y[idx] + 0.024);

    for (const central of roof ? [false] : [true, false]) {
      const cands: { idx: number; d: number }[] = [];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const h = y[j * n + i];
          if (Number.isNaN(h)) continue;
          if (roof ? h < limit : h > limit) continue;
          const cx = (i + 0.5) / n;
          const cz = (j + 0.5) / n;
          // an enclosed court sits inside the footprint, never on its lip
          if (central && (cx < 0.24 || cx > 0.76 || cz < 0.24 || cz > 0.76)) continue;
          cands.push({ idx: j * n + i, d: (cx - anchor[0]) ** 2 + (cz - anchor[2]) ** 2 });
        }
      }
      if (!cands.length) continue;
      cands.sort((p, q) => p.d - q.d);
      // walk out from the anchor and take the first candidate in clear view,
      // so a pin never lands correctly but out of sight behind a roofline
      for (const c of cands.slice(0, 40)) {
        const local = cellAt(c.idx);
        if (this.isVisibleFrom(eye, model.group.localToWorld(local.clone()), model, ray)) return local;
      }
      return cellAt(cands[0].idx);
    }
    return null;
  }

  /**
   * Come in horizontally from outside and stop on the outer skin. Sampling
   * matters more here: a single ray aimed at an arch or window opening sails
   * straight through the building and lands on a far interior wall, so the
   * bundle keeps whichever hit is nearest the outside.
   */
  private castIn(model: LoadedModel, local: THREE.Vector3, ray: THREE.Raycaster, eye: THREE.Vector3) {
    const outward = local.clone().setY(0);
    if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);
    outward.normalize();
    const reach = Math.max(model.size.x, model.size.z) + 0.8;
    const side = new THREE.Vector3().crossVectors(outward, UP).normalize();
    const step = Math.max(model.size.x, model.size.z) * 0.05;
    const ring = [[0, 0], [step, 0], [-step, 0], [0, step], [0, -step], [step * 2, 0]];
    let best: THREE.Intersection | undefined;
    let bestSeen = false;
    // every hit, not just the first — the nearest surface is often the top of
    // a low garden wall or podium, and a pin named for a facade belongs on an
    // upright face, so flat-topped hits are skipped
    ray.firstHitOnly = false;
    for (const [du, ds] of ring) {
      const at = local.clone().addScaledVector(UP, du).addScaledVector(side, ds);
      const target = model.group.localToWorld(at.clone());
      const start = model.group.localToWorld(at.addScaledVector(outward, reach));
      ray.set(start, target.sub(start).normalize());
      ray.far = reach * 2.2;
      for (const hit of ray.intersectObjects(model.meshes, false)) {
        if (!hit.face) continue;
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        if (Math.abs(n.y) > 0.6) continue; // a floor or a coping, not a wall
        if (n.dot(ray.ray.direction) > 0) continue; // back face of a far wall
        const seen = this.isVisibleFrom(eye, hit.point, model, ray);
        ray.firstHitOnly = false;
        if (!best || (seen && !bestSeen) || (seen === bestSeen && hit.distance < best.distance)) {
          best = hit;
          bestSeen = seen;
        }
        break;
      }
    }
    ray.firstHitOnly = true;
    return best;
  }

  /**
   * Anchors are authored against the bounding box, so one placed at the top
   * of the box can hang in the air over a lower roofline. Drop each pin onto
   * the first surface below it — within a short search, so anchors that are
   * already on stone (or deliberately inside a courtyard) are left alone.
   */
  /** Where the camera comes to rest for this framing, computed before the
   *  fly-to has run — used to prefer pins the visitor can actually see. */
  private restingCamera(framing: Framing, model: LoadedModel) {
    const h = model.size.y;
    const dist = this.fitDistance(framing, 1.3, model);
    const a = THREE.MathUtils.degToRad(framing.camera.azimuth);
    const e = THREE.MathUtils.degToRad(framing.camera.elevation);
    const r = dist * Math.cos(e);
    return new THREE.Vector3(r * Math.sin(a), framing.camera.targetY * h + 0.05 + dist * Math.sin(e), r * Math.cos(a));
  }

  /** Is this world point in clear view from `from`, or is the building in the way? */
  private isVisibleFrom(from: THREE.Vector3, point: THREE.Vector3, model: LoadedModel, ray: THREE.Raycaster) {
    const dir = point.clone().sub(from);
    const dist = dir.length();
    ray.set(from, dir.normalize());
    ray.far = Math.max(0.01, dist - 0.06);
    ray.firstHitOnly = true;
    return ray.intersectObjects(model.meshes, false).length === 0;
  }

  private snapAnchors(model: LoadedModel, framing: Framing) {
    // Snapping happens at the handover, when the dwelling is still lowered and
    // scaled down mid-dissolve. Every ray here — height field, wall probes,
    // visibility — has to describe where things will *come to rest*, so the
    // group is put in its final pose for the duration.
    const g = model.group;
    const pose = { p: g.position.clone(), s: g.scale.clone(), r: g.rotation.clone() };
    g.position.set(0, 0, 0);
    g.scale.setScalar(1);
    g.rotation.set(0, 0, 0);
    g.updateMatrixWorld(true);

    const ray = new THREE.Raycaster();
    ray.firstHitOnly = true;
    const eye = this.restingCamera(framing, model);
    framing.hotspots.forEach((hs) => {
      const key = `${framing.id}:${hs.anchor.join(",")}`;
      if (this.snapped.has(key)) return;
      const local = this.boxAnchor(hs.anchor, model, new THREE.Vector3(), false);

      if (hs.snap === "roof" || hs.snap === "court") {
        const cell = this.pickCell(model, this.heightField(model, ray), hs.anchor, hs.snap, eye, ray);
        this.snapped.set(key, cell ?? this.boxAnchor(hs.anchor, model));
        return;
      }

      const hit = this.castIn(model, local, ray, eye);
      if (!hit) {
        // nothing to attach to — fall back to the authored position
        this.snapped.set(key, this.boxAnchor(hs.anchor, model));
        return;
      }
      // lift the pin just clear of the wall it landed on
      const normal = hit.face
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : UP.clone();
      const p = hit.point.clone().addScaledVector(normal, 0.024);
      this.snapped.set(key, model.group.worldToLocal(p));
    });

    g.position.copy(pose.p);
    g.scale.copy(pose.s);
    g.rotation.copy(pose.r);
    g.updateMatrixWorld(true);
  }

  anchorToWorld(anchor: Vec3, out = new THREE.Vector3()): THREE.Vector3 {
    if (!this.current) return out.set(0, 0, 0);
    const cached = this.snapped.get(`${this.current.modelKey}:${anchor.join(",")}`);
    if (cached) out.copy(cached);
    else this.boxAnchor(anchor, this.current, out);
    return this.current.group.localToWorld(out);
  }

  project(world: THREE.Vector3, w: number, h: number): AnchorProjection {
    const v = this.projScratch.copy(world);
    const distance = v.distanceTo(this.camera.position);
    v.project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
      distance,
      behindCamera: v.z > 1,
      occluded: false,
    };
  }

  /** camera→target distance; the reference depth for pin scaling */
  get cameraDistance() {
    return this.camState.dist;
  }

  private refreshOcclusion() {
    this.occlusionCache.clear();
    if (!this.current) return;
    const camPos = this.camera.position;
    this.raycaster.firstHitOnly = true;
    this._pendingOcclusion?.forEach(({ id, world }) => {
      const dir = this.occScratch.copy(world).sub(camPos);
      const dist = dir.length();
      this.raycaster.set(camPos, dir.normalize());
      // pins rest on the mesh skin, so stop just short of the surface —
      // anything the ray still hits is genuinely in front of the pin
      this.raycaster.far = Math.max(0.01, dist - 0.05);
      const hits = this.raycaster.intersectObjects(this.current!.meshes, false);
      this.occlusionCache.set(id, hits.length > 0);
    });
  }

  private _pendingOcclusion: { id: string; world: THREE.Vector3 }[] | null = null;
  queueOcclusion(list: { id: string; world: THREE.Vector3 }[]) {
    this._pendingOcclusion = list;
  }
  isOccluded(id: string) {
    return this.occlusionCache.get(id) ?? false;
  }

  /* ── camera system ─────────────────────────────────────────────── */
  private applyCam() {
    if (!this.controls || !this.camera) return;
    const { az, el, dist, tx, ty, tz } = this.camState;
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(el);
    const r = dist * Math.cos(e);
    this.camera.position.set(tx + r * Math.sin(a), ty + dist * Math.sin(e), tz + r * Math.cos(a));
    this.controls.target.set(tx, ty, tz);
    this.controls.update();
  }

  flyTo(az: number, el: number, dist: number, ty: number, dur = 1.4, onDone?: () => void) {
    const target = {
      az,
      el,
      dist,
      tx: 0,
      ty,
      tz: 0,
    };
    if (this.reducedMotion || dur <= 0.01) {
      Object.assign(this.camState, target);
      this.applyCam();
      onDone?.();
      return;
    }
    gsap.to(this.camState, {
      ...target,
      duration: dur,
      ease: "power3.inOut",
      onUpdate: () => this.applyCam(),
      onComplete: onDone,
    });
  }

  /** Distance at which the dwelling sits inside the frame with museum
   *  breathing room on every side, whatever the viewport aspect. Uses the
   *  footprint half-diagonal so the framing survives a full orbit. */
  private fitDistance(framing: Framing, margin = 1.3, model = this.current) {
    if (!model) return 3.6;
    const { size } = model;
    const radius = Math.hypot(size.x, size.z) * 0.5;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const tan = Math.tan(vFov / 2);
    const aspect = this.camera.aspect || 1;
    const forHeight = size.y * 0.5 / tan;
    const forWidth = radius / (tan * aspect);
    return Math.max(forHeight, forWidth, radius) * margin * framing.camera.dist;
  }

  frameEmpire(framing: Framing, animate = true, onDone?: () => void) {
    if (!this.current) return;
    const h = this.current.size.y;
    this.flyTo(
      framing.camera.azimuth,
      framing.camera.elevation,
      this.fitDistance(framing),
      framing.camera.targetY * h + 0.05,
      animate ? 1.5 : 0,
      onDone,
    );
  }

  focusAnchor(anchor: Vec3, framing: Framing, dur = 1.2) {
    if (!this.current) return;
    const world = this.anchorToWorld(anchor);
    const az = this.camState.az;
    gsap.to(this.camState, {
      dist: this.fitDistance(framing, 0.62),
      tx: world.x * 0.72,
      ty: world.y * 0.72 + 0.06,
      tz: world.z * 0.72,
      az,
      duration: this.reducedMotion ? 0 : dur,
      ease: "power3.inOut",
      onUpdate: () => this.applyCam(),
    });
  }

  /* ── modes ─────────────────────────────────────────────────────── */
  setPanMode(on: boolean) {
    if (!this.controls) return;
    this.controls.mouseButtons = {
      LEFT: on ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.touches = on
      ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }
      : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  }

  setAutoRotate(on: boolean) {
    if (!this.controls) return;
    this.controls.autoRotate = on;
  }

  setGrid(on: boolean) {
    if (this.grid) this.grid.visible = on;
  }

  /** Anything that changes what casts or receives shadow must say so. */
  private afterMaterialChange() {
    this.markShadowDirty(3);
  }

  /**
   * Rebuild the wireframe overlay against whatever is on stage.
   *
   * Each overlay is parented to the mesh it traces, carrying no transform of
   * its own, so it inherits the entire chain the model was normalised through.
   * Copying only the mesh's own local transform onto the model group — as this
   * used to — skips the normalising scale and the recentre that live on the
   * intermediate node, which drew the overlay far too small and sunk inside
   * the building.
   */
  private buildWireframe() {
    this.clearWireframe();
    if (!this.wireOn || !this.current) return;
    this.current.meshes.forEach((src) => {
      // The building's own textured surface is swapped for pale plaster while
      // the wireframe is up. Drawn over a fully rendered dwelling the lines
      // read as surface detail rather than as structure; over a flat, lit
      // plaster form they read as a drawing. The surface is still there, so
      // edges on the far side stay hidden and the form is legible.
      this.wireSwapped.push({ mesh: src, material: src.material });
      src.material = new THREE.MeshStandardMaterial({
        color: 0xf2ebdd,
        roughness: 0.96,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      const mat = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x8c452c,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        // lift the lines off the surface they trace, or they z-fight with it
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const overlay = new THREE.Mesh(src.geometry, mat);
      overlay.renderOrder = 2;
      overlay.castShadow = false;
      overlay.receiveShadow = false;
      src.add(overlay);
      this.wireOverlays.push(overlay);
    });
    this.markShadowDirty(2);
  }

  private clearWireframe() {
    this.wireOverlays.forEach((o) => {
      o.parent?.remove(o);
      // the geometry is the source mesh's own and is not ours to dispose
      (o.material as THREE.Material).dispose();
    });
    this.wireOverlays = [];
    // restore from the record rather than from `current`, so a swap that
    // happens while the layer is up still puts the old dwelling back
    this.wireSwapped.forEach(({ mesh, material }) => {
      const plaster = mesh.material;
      mesh.material = material;
      if (Array.isArray(plaster)) plaster.forEach((m) => m.dispose());
      else plaster.dispose();
    });
    this.wireSwapped = [];
  }

  setWireframe(on: boolean) {
    this.wireOn = on;
    this.buildWireframe();
    this.afterMaterialChange();
  }

  setXray(on: boolean) {
    this.xrayOn = on;
    if (!this.current) return;
    this.current.meshes.forEach((m) => {
      const mat = m.material as any;
      mat.transparent = on;
      mat.opacity = on ? 0.42 : 1;
      mat.depthWrite = !on;
      mat.needsUpdate = true;
    });
    this.afterMaterialChange();
  }

  zoomBy(factor: number) {
    const d = THREE.MathUtils.clamp(this.camState.dist * factor, this.controls.minDistance, this.controls.maxDistance);
    gsap.to(this.camState, { dist: d, duration: 0.4, ease: "power2.out", onUpdate: () => this.applyCam() });
  }

  /** keyboard orbit support */
  nudge(dAz: number, dEl: number) {
    this.camState.az += dAz;
    this.camState.el = THREE.MathUtils.clamp(this.camState.el + dEl, 10, 82);
    this.applyCam();
  }

  setHighlight(anchor: Vec3 | null) {
    if (!this.glowShell) return;
    if (anchor === null) {
      this.glowShell.visible = false;
      return;
    }
    const world = this.anchorToWorld(anchor);
    this.glowShell.position.copy(this.stage.worldToLocal(world.clone()));
    this.glowShell.visible = true;
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  onFrame(cb: FrameCallback) {
    this.frameCbs.add(cb);
    return () => this.frameCbs.delete(cb);
  }

  get readyState() {
    return this.ready;
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.resize);
    this.resizeObs?.disconnect();
    this.flushRetired();
    if (this.current) this.disposeModel(this.current);
    this.cache.forEach((_v, id) => this.disposeCached(id));
    // Generated models live in their own pool, so the loaded-model teardown
    // above never reaches them.
    this.generated.forEach((m) => {
      if (m !== this.current) this.disposeModel(m);
    });
    this.generated.clear();
    this.fields.clear();
    this.snapped.clear();
    this.envTex?.dispose();
    this.warmTarget?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();
  }
}
