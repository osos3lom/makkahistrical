import { memo, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Site } from "@/types/empire";
import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";

/** Free base layers, no API key.
 *
 *  - Esri World Imagery is the sharpest free satellite layer, but its servers
<<<<<<< Updated upstream
 *    are not reachable from every network. It is drawn over the Sentinel-2
 *    layer, so where it fails the map is never blank, and after a few failed
 *    tiles the switch moves to Sentinel-2 by itself and says so.
 *  - EOX Sentinel-2 cloudless 2024 is a 10 m mosaic: soft at site scale, but
 *    clean (no cloud, no haze, consistent colour) and it always loads. Its
 *    licence is CC BY-NC-SA 4.0: fine for this non-commercial atlas, and the
 *    thing to revisit if that ever changes.
 *  - OpenStreetMap for roads and place names.
 *
 *  Google and Bing tiles load here too, but their terms forbid using the tile
 *  servers directly, so they are deliberately not offered. */
=======
 *    are not reachable from every network. If its tiles fail before any has
 *    loaded, the map drops to Sentinel-2 by itself and says so.
 *  - EOX Sentinel-2 cloudless (2016 release, CC BY 4.0) is 10 m imagery:
 *    soft at site scale, but it always loads.
 *  - OpenStreetMap for roads and place names. */
>>>>>>> Stashed changes
const BASEMAPS = {
  satellite: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 19,
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    short: "© Esri, Maxar",
  },
  sentinel: {
<<<<<<< Updated upstream
    tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg"],
    maxzoom: 15,
    attribution:
      '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless 2024</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2024), CC BY-NC-SA 4.0',
    short: "Sentinel-2 cloudless 2024 © EOX, Copernicus",
=======
    tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"],
    maxzoom: 15,
    attribution:
      '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016)',
    short: "Sentinel-2 cloudless © EOX, Copernicus 2016",
>>>>>>> Stashed changes
  },
  streets: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    short: "© OpenStreetMap contributors",
  },
} as const;
export type BasemapId = keyof typeof BASEMAPS;

<<<<<<< Updated upstream
/** Sentinel-2 stays on under Esri as its safety net; otherwise one layer. */
function showBasemap(map: maplibregl.Map, which: BasemapId) {
  const on = (id: BasemapId) => id === which || (which === "satellite" && id === "sentinel");
  for (const id of Object.keys(BASEMAPS) as BasemapId[]) map.setLayoutProperty(id, "visibility", on(id) ? "visible" : "none");
}

/** Open terrain (Mapterhorn, 30 m here) so the tilted, turning map shows the
 *  valley as a valley. */
const TERRAIN = {
  tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"],
  attribution: '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">© Mapterhorn</a>',
};

/** Degrees per millisecond: one full turn every two minutes. */
const SPIN_RATE = 0.003;
/** The resting tilt of the landing map. */
const PITCH = 55;

=======
function showBasemap(map: maplibregl.Map, which: BasemapId) {
  for (const id of Object.keys(BASEMAPS)) map.setLayoutProperty(id, "visibility", id === which ? "visible" : "none");
}

>>>>>>> Stashed changes
/** Bounds that hold all four sites with room for their labels. */
const VALLEY_BOUNDS: [[number, number], [number, number]] = [
  [40.078, 21.606],
  [40.136, 21.671],
];

interface Props {
  sites: Site[];
  activeId?: string;
  hoverId?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** "full" is the landing map; "mini" sits in the site view's side rail. */
  variant: "full" | "mini";
  reducedMotion: boolean;
  lang: Language;
}

export const SiteMap = memo(function SiteMap({ sites, activeId, hoverId, onSelect, onHover, variant, reducedMotion, lang }: Props) {
  const t = useTranslation(lang);
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  /** Set once the style has parsed. `isStyleLoaded()` is no use here: it also
   *  waits for tiles, so it reads false for as long as a layer is downloading. */
  const styleReady = useRef(false);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const [basemap, setBasemap] = useState<BasemapId>(() => {
    try {
      const v = sessionStorage.getItem("atlas-basemap");
      if (v && v in BASEMAPS) return v as BasemapId;
    } catch {
      /* storage unavailable */
    }
    return "satellite";
  });
  const [fellBack, setFellBack] = useState(false);
  const basemapRef = useRef<BasemapId>(basemap);
<<<<<<< Updated upstream
  /** The landing map turns slowly until someone takes hold of it. Off for the
   *  rail map, which is for finding your way, and under reduced motion. */
  const [spinning, setSpinning] = useState(variant === "full" && !reducedMotion);
=======
>>>>>>> Stashed changes

  // Handlers change identity on every parent render; the map is built once.
  const handlers = useRef({ onSelect, onHover });
  handlers.current = { onSelect, onHover };

  /* ── build the map once ── */
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const map = new maplibregl.Map({
      container: box,
      style: {
        version: 8,
        sources: Object.fromEntries(
          Object.entries(BASEMAPS).map(([id, b]) => [
            id,
            { type: "raster", tiles: [...b.tiles], tileSize: 256, maxzoom: b.maxzoom, attribution: b.attribution },
          ]),
        ),
<<<<<<< Updated upstream
        // Sentinel first, so Esri draws over it when both are on.
        layers: (["sentinel", "satellite", "streets"] as BasemapId[]).map((id) => ({
          id,
          type: "raster" as const,
          source: id,
          layout: { visibility: "none" as const },
          // A touch of contrast lifts the haze that desert imagery carries.
          paint: id === "streets" ? {} : { "raster-contrast": 0.1, "raster-saturation": 0.05, "raster-brightness-min": 0.05, "raster-fade-duration": 200 },
        })),
        sky: {
          "sky-color": "#c9dbe6",
          "horizon-color": "#efe5d3",
          "fog-color": "#efe5d3",
          "sky-horizon-blend": 0.5,
          "horizon-fog-blend": 0.6,
          "fog-ground-blend": 0.9,
        },
=======
        layers: (Object.keys(BASEMAPS) as BasemapId[]).map((id) => ({
          id,
          type: "raster" as const,
          source: id,
          layout: { visibility: id === basemap ? ("visible" as const) : ("none" as const) },
        })),
>>>>>>> Stashed changes
      },
      bounds: VALLEY_BOUNDS,
      fitBoundsOptions: { padding: variant === "mini" ? 12 : 48 },
      maxZoom: 18,
      minZoom: 8,
<<<<<<< Updated upstream
      maxPitch: 75,
      // The rail map is too small for MapLibre's attribution box; it carries
      // a one-line credit of its own instead (rendered below).
      attributionControl: variant === "mini" ? false : { compact: true },
      // The landing map can be turned and tilted; the rail map stays a flat,
      // north-up map for finding your way.
      dragRotate: variant === "full",
      pitchWithRotate: variant === "full",
      cooperativeGestures: variant === "mini",
    });
    if (variant === "mini") map.touchZoomRotate.disableRotation();
=======
      // The rail map is too small for MapLibre's attribution box; it carries
      // a one-line credit of its own instead (rendered below).
      attributionControl: variant === "mini" ? false : { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: variant === "mini",
    });
    map.touchZoomRotate.disableRotation();
>>>>>>> Stashed changes
    styleReady.current = false;
    map.once("style.load", () => {
      styleReady.current = true;
      showBasemap(map, basemapRef.current);
<<<<<<< Updated upstream
      if (variant === "full") {
        map.addSource("terrain", {
          type: "raster-dem",
          tiles: TERRAIN.tiles,
          tileSize: 512,
          encoding: "terrarium",
          maxzoom: 12,
          attribution: TERRAIN.attribution,
        });
        map.setTerrain({ source: "terrain", exaggeration: 1.4 });
      }
    });
    if (variant === "full") {
      map.once("load", () =>
        map.easeTo({ pitch: PITCH, bearing: -20, zoom: map.getZoom() + 0.7, duration: reducedMotion ? 0 : 1800 }),
      );
      // Any hand on the map stops the turntable; the button starts it again.
      const stop = (e: { originalEvent?: Event }) => {
        if (e.originalEvent) setSpinning(false);
      };
      map.on("mousedown", stop);
      map.on("touchstart", stop);
      map.on("wheel", stop);
    }
    // The compact attribution starts expanded and covers the bottom of the
    // map on a phone; collapse it to its (i) button once the map is up.
    map.once("load", () => box.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
    if (variant === "full") map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
=======
    });
    // The compact attribution starts expanded and covers the bottom of the
    // map on a phone; collapse it to its (i) button once the map is up.
    map.once("load", () => box.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
    if (variant === "full") map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
>>>>>>> Stashed changes
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    // Satellite fallback: if Esri errors before a single tile arrives, the
    // network cannot reach it — switch rather than leave a grey map.
    let esriOk = false;
    let esriErrors = 0;
    map.on("sourcedata", (e) => {
      if (e.sourceId === "satellite" && e.tile) esriOk = true;
    });
    map.on("error", (e) => {
      const src = (e as unknown as { sourceId?: string }).sourceId;
      if (src === "satellite" && !esriOk && ++esriErrors >= 3) {
        esriErrors = -Infinity;
        setFellBack(true);
        setBasemap((cur) => (cur === "satellite" ? "sentinel" : cur));
      }
    });
    // A tile that never answers raises no error; give it a few seconds.
    const watchdog = window.setTimeout(() => {
      if (!esriOk && basemapRef.current === "satellite") {
        setFellBack(true);
        setBasemap("sentinel");
      }
    }, 6000);

    pinRefs.current.clear();
    sites.forEach((s, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `site-pin site-pin--${variant}`;
      el.dataset.site = s.id;
      el.innerHTML = `<span class="site-pin__num" aria-hidden="true">${i + 1}</span><span class="site-pin__label"></span>`;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        handlers.current.onSelect(s.id);
      });
      el.addEventListener("mouseenter", () => handlers.current.onHover?.(s.id));
      el.addEventListener("mouseleave", () => handlers.current.onHover?.(null));
      el.addEventListener("focus", () => handlers.current.onHover?.(s.id));
      el.addEventListener("blur", () => handlers.current.onHover?.(null));
<<<<<<< Updated upstream
      // Pins stay solid when a ridge passes in front of them: on a turning map
      // MapLibre's default (fading covered markers) makes them flicker.
      new maplibregl.Marker({ element: el, anchor: "center", opacity: "1", opacityWhenCovered: "1" }).setLngLat([s.geo.lng, s.geo.lat]).addTo(map);
=======
      new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.geo.lng, s.geo.lat]).addTo(map);
>>>>>>> Stashed changes
      pinRefs.current.set(s.id, el);
    });

    mapRef.current = map;
    return () => {
      window.clearTimeout(watchdog);
      map.remove();
      mapRef.current = null;
    };
    // Built once per variant; sites and basemap are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  /* ── labels follow the language ── */
  useEffect(() => {
    sites.forEach((s, i) => {
      const el = pinRefs.current.get(s.id);
      if (!el) return;
      el.setAttribute("aria-label", `${i + 1}. ${s.name} — ${s.period}`);
      const label = el.querySelector(".site-pin__label");
      if (label) label.textContent = s.name;
    });
  }, [sites]);

  /* ── active / hover state on the pins ── */
  useEffect(() => {
    for (const [id, el] of pinRefs.current) {
      el.classList.toggle("is-active", id === activeId);
      el.classList.toggle("is-hover", id === hoverId);
      if (id === activeId) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
      // keep the active pin above its neighbours
      (el.parentElement ?? el).style.zIndex = id === activeId ? "3" : id === hoverId ? "2" : "1";
    }
  }, [activeId, hoverId]);

  /* ── follow the selected site ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const s = sites.find((x) => x.id === activeId);
    if (!s) {
      map.fitBounds(VALLEY_BOUNDS, { padding: variant === "mini" ? 12 : 48, animate: !reducedMotion });
      return;
    }
    const target = { center: [s.geo.lng, s.geo.lat] as [number, number], zoom: variant === "mini" ? 13.2 : 15.5 };
    if (reducedMotion) map.jumpTo(target);
    else map.flyTo({ ...target, duration: 1400, essential: false });
    // sites is stable per language; only the selection should move the camera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, variant, reducedMotion]);

<<<<<<< Updated upstream
  /* ── slow turntable ── */
  useEffect(() => {
    const map = mapRef.current;
    // Reduced motion, even switched on mid-visit, holds it still.
    if (!map || !spinning || reducedMotion || variant !== "full") return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      // Leave the camera alone while it is flying somewhere or being dragged.
      if (!map.isEasing() && !map.isMoving()) map.setBearing(map.getBearing() + dt * SPIN_RATE);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spinning, reducedMotion, variant]);

  /* The fallback note explains the switch, then gets out of the way: left up,
     it sits over the southern pins. */
  useEffect(() => {
    if (!fellBack) return;
    const id = window.setTimeout(() => setFellBack(false), 7000);
    return () => window.clearTimeout(id);
  }, [fellBack]);

=======
>>>>>>> Stashed changes
  /* ── base layer switch ── */
  useEffect(() => {
    basemapRef.current = basemap;
    const map = mapRef.current;
    if (map && styleReady.current) showBasemap(map, basemap);
    try {
      sessionStorage.setItem("atlas-basemap", basemap);
    } catch {
      /* not remembered */
    }
  }, [basemap]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
      {/* MapLibre's stylesheet sets the container to position: relative, so it
          fills its absolutely placed parent rather than being placed itself. */}
      <div ref={boxRef} className="site-map h-full w-full" />
      <div
        className={`absolute top-2 z-10 flex rounded-lg border border-line-warm bg-[rgba(255,252,246,0.94)] p-0.5 shadow-sm backdrop-blur ltr:right-2 rtl:left-2 ${variant === "mini" ? "text-[0.68rem]" : "text-[0.76rem]"}`}
        role="radiogroup"
        aria-label={t.map.basemap}
      >
        {(["satellite", "sentinel", "streets"] as BasemapId[]).map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={basemap === id}
            onClick={() => setBasemap(id)}
            className={`rounded-md px-2 py-1 font-medium transition-colors ${basemap === id ? "bg-terracotta text-white" : "text-ink-soft hover:text-ink"}`}
          >
            {t.map[id]}
          </button>
        ))}
      </div>
<<<<<<< Updated upstream
      {variant === "full" && (
        <button
          type="button"
          onClick={() => setSpinning((v) => !v)}
          aria-pressed={spinning}
          className="absolute top-2 z-10 flex items-center gap-1.5 rounded-lg border border-line-warm bg-[rgba(255,252,246,0.94)] px-2.5 py-1 text-[0.76rem] font-medium text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-ink ltr:left-2 rtl:right-2"
        >
          <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${spinning && !reducedMotion ? "bg-terracotta" : "bg-[#c9b89c]"}`} />
          {spinning && !reducedMotion ? t.map.pause : t.map.rotate}
        </button>
      )}
=======
>>>>>>> Stashed changes
      {variant === "mini" && (
        <p className="pointer-events-none absolute bottom-0 z-10 max-w-full truncate rounded-tl-md bg-[rgba(255,252,246,0.85)] px-1.5 py-0.5 text-[0.6rem] text-ink-muted ltr:right-0 rtl:left-0 rtl:rounded-tl-none rtl:rounded-tr-md" dir="ltr">
          {BASEMAPS[basemap].short}
        </p>
      )}
      {fellBack && variant === "full" && (
        <p className="absolute bottom-10 left-1/2 z-10 max-w-[90%] -translate-x-1/2 rounded-lg bg-[rgba(30,24,20,0.8)] px-3 py-1.5 text-center text-[0.74rem] text-white" role="status">
          {t.map.fallbackNote}
        </p>
      )}
    </div>
  );
});
