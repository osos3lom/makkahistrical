/** Build the placeholder site models and the card images drawn from them.
 *
 *    npm run models:placeholder
 *
 *  Writes, per site:
 *    public/models/<id>.glb          one mesh per material, metres, y-up
 *    public/img/<id>/hero.webp       aerial three-quarter view
 *    public/img/<id>/aerial-2.webp   the opposite three-quarter view
 *    public/img/<id>/plan.webp       top-down plan with north arrow and scale
 *    public/img/<id>/location.svg    the four sites in the valley, this one marked
 *    public/img/<id>/route.svg       the pilgrim roads through the valley
 *  and src/data/sites/generated.json with hotspot anchors in the viewer's
 *  normalised box space, so the data files never carry hand-typed anchors.
 *
 *  The images are rendered from the same triangles as the GLB, so a card never
 *  shows a building the 3D stage does not have. The renders are drawn as SVG
 *  (thousands of facets, ~1 MB each) and rasterised to WebP through the
 *  system's Edge via Playwright, so no browser download is needed on Windows.
 *  Set PW_CHANNEL=chrome to use Chrome instead. */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Document, NodeIO } from "@gltf-transform/core";
import { SITES } from "./placeholder/sites.mjs";
import { norm } from "./placeholder/builder.mjs";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Site positions, from the shared Google Maps links (PLAN.md §1). */
const GEO = {
  madiq: { lat: 21.660371, lng: 40.121055, en: "Al-Madiq", ar: "المضيق" },
  "birkat-mutawakkil": { lat: 21.651829, lng: 40.103928, en: "Birkat al-Mutawakkil", ar: "بركة المتوكل" },
  "umm-dumayran": { lat: 21.638662, lng: 40.091818, en: "Umm al-Dumayran", ar: "أم الضيمران" },
  zaymah: { lat: 21.616236, lng: 40.106867, en: "Al-Zaymah", ar: "الزيمة" },
};
const ORDER = ["madiq", "birkat-mutawakkil", "umm-dumayran", "zaymah"];

const PAPER = "#f3ebdd";
const INK = "#3b2f25";
const MUTED = "#8a7a66";
const ACCENT = "#a55338";
const W = 960, H = 640;

/* ───────────────────────────── GLB ───────────────────────────── */

async function writeGlb(b, file) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("site");
  for (const [name, M] of b.mats) {
    if (!M.idx.length) continue;
    const mat = doc
      .createMaterial(name)
      .setBaseColorFactor([...M.rgb, 1])
      .setRoughnessFactor(M.rough)
      .setMetallicFactor(0);
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(M.pos)).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(M.nrm)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(M.idx)).setBuffer(buffer))
      .setMaterial(mat);
    scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  }
  mkdirSync(dirname(file), { recursive: true });
  await new NodeIO().write(file, doc);
}

/* ─────────────────────── SVG software render ─────────────────────── */

const LIGHT = norm([-0.45, 0.8, -0.4]);

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Orthographic render of every triangle, painter-sorted. `el` 90 is a plan. */
function render(b, { az, el, margin = 40, footer }) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const c = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const r = [Math.cos(a), 0, -Math.sin(a)];
  const u = [-Math.sin(e) * Math.sin(a), Math.cos(e), -Math.sin(e) * Math.cos(a)];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

  const tris = [];
  for (const [name, M] of b.mats) {
    // Ground is pushed back in the sort: a painter's algorithm has no depth
    // buffer, and slabs lying a few centimetres above the terrain would
    // otherwise lose to the facets they sit on.
    const bias = name === "ground" ? -4 : 0;
    for (let i = 0; i < M.idx.length; i += 3) {
      const vi = M.idx[i] * 3;
      const n = [M.nrm[vi], M.nrm[vi + 1], M.nrm[vi + 2]];
      if (dot(n, c) <= 1e-4) continue;
      const pts = [0, 1, 2].map((k) => {
        const j = M.idx[i + k] * 3;
        return [M.pos[j], M.pos[j + 1], M.pos[j + 2]];
      });
      const k = 0.52 + 0.48 * Math.max(0, dot(n, LIGHT));
      tris.push({
        s: pts.map((p) => [dot(p, r), -dot(p, u)]),
        d: (dot(pts[0], c) + dot(pts[1], c) + dot(pts[2], c)) / 3 + bias,
        fill: shade(M.hex, k),
      });
    }
  }
  tris.sort((p, q) => p.d - q.d);

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const t of tris) for (const [x, y] of t.s) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const s = Math.min((W - margin * 2) / (x1 - x0), (H - margin * 2 - 24) / (y1 - y0));
  const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - 24 - (y1 - y0) * s) / 2 - y0 * s;
  const f = (v) => Math.round(v * 10) / 10;
  const polys = tris
    .map((t) => `<path d="M${t.s.map(([x, y]) => `${f(x * s + ox)} ${f(y * s + oy)}`).join("L")}Z" fill="${t.fill}" stroke="${t.fill}" stroke-width=".6" stroke-linejoin="round"/>`)
    .join("");
  return { body: polys, scale: s, footer };
}

function frame(inner, footer, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
${inner}${extra}
<text x="20" y="${H - 16}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="13" fill="${MUTED}">${footer}</text>
</svg>`;
}

const NOTE = "Placeholder massing · interpretive, not a survey · نموذج مبدئي تفسيري";

function northArrow(x, y) {
  return `<g transform="translate(${x} ${y})" font-family="Inter,Arial,sans-serif">
<circle r="22" fill="none" stroke="${INK}" stroke-opacity=".35"/>
<path d="M0 -18 L6 6 L0 2 L-6 6Z" fill="${INK}"/>
<text y="-26" text-anchor="middle" font-size="13" font-weight="700" fill="${INK}">N</text></g>`;
}

function scaleBar(x, y, pxPerM, metres) {
  const w = pxPerM * metres;
  return `<g transform="translate(${x} ${y})" font-family="Inter,Arial,sans-serif" font-size="12" fill="${INK}">
<rect width="${w / 2}" height="6" fill="${INK}"/><rect x="${w / 2}" width="${w / 2}" height="6" fill="none" stroke="${INK}"/>
<text y="-6">0</text><text x="${w}" y="-6" text-anchor="end">${metres >= 1000 ? `${metres / 1000} km` : `${metres} m`}</text></g>`;
}

const niceMetres = (pxPerM, target = 140) => {
  const raw = target / pxPerM;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((k) => k * p).find((v) => v >= raw * 0.6) ?? raw;
};

/* ─────────────────────── geographic schematics ─────────────────────── */

const project = (lat0, lng0) => (lat, lng) => [
  (lng - lng0) * 111320 * Math.cos((lat0 * Math.PI) / 180),
  -(lat - lat0) * 110540,
];

function locationSvg(activeId) {
  const lat0 = 21.64, lng0 = 40.106;
  const P = project(lat0, lng0);
  const pts = ORDER.map((id) => ({ id, ...GEO[id], xy: P(GEO[id].lat, GEO[id].lng) }));
  const span = 6200; // metres across the drawing
  const k = (W - 120) / span;
  const X = (m) => W / 2 + m * k, Y = (m) => (H - 24) / 2 + m * k;
  let g = "";
  // graticule every 0.01°
  for (let lat = 21.59; lat <= 21.69; lat += 0.01) {
    const y = Y(P(lat, lng0)[1]);
    if (y > 10 && y < H - 40) g += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${INK}" stroke-opacity=".07"/>`;
  }
  for (let lng = 40.06; lng <= 40.16; lng += 0.01) {
    const x = X(P(lat0, lng)[0]);
    if (x > 0 && x < W) g += `<line y1="0" y2="${H - 30}" x1="${x}" x2="${x}" stroke="${INK}" stroke-opacity=".07"/>`;
  }
  // a dashed thread joining the four sites in valley order — schematic only
  g += `<path d="M${pts.map((p) => `${X(p.xy[0]).toFixed(1)} ${Y(p.xy[1]).toFixed(1)}`).join("L")}" fill="none" stroke="${MUTED}" stroke-width="2" stroke-dasharray="6 6"/>`;
  pts.forEach((p, i) => {
    const on = p.id === activeId;
    const x = X(p.xy[0]), y = Y(p.xy[1]);
    g += `<g font-family="Inter,Segoe UI,Arial,sans-serif">
<circle cx="${x}" cy="${y}" r="${on ? 17 : 12}" fill="${on ? ACCENT : "#fff"}" stroke="${on ? ACCENT : INK}" stroke-width="2"/>
<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="${on ? 15 : 12}" font-weight="700" fill="${on ? "#fff" : INK}">${i + 1}</text>
<text x="${x + 24}" y="${y - 2}" font-size="${on ? 19 : 15}" font-weight="${on ? 700 : 500}" fill="${INK}">${p.en}</text>
<text x="${x + 24}" y="${y + 18}" font-size="${on ? 17 : 14}" fill="${on ? ACCENT : MUTED}" font-family="Tajawal,Segoe UI,Arial,sans-serif">${p.ar}</text></g>`;
  });
  return frame(g, `Wadi Nakhla · وادي نخلة — schematic, not for navigation`, northArrow(W - 50, 60) + scaleBar(40, 50, k, 1000));
}

function routeSvg(activeId) {
  const lat0 = 21.5, lng0 = 40.12;
  const P = project(lat0, lng0);
  const places = [
    { en: "Makkah", ar: "مكة المكرمة", lat: 21.4225, lng: 39.8262, big: true },
    { en: "Wadi Nakhla", ar: "وادي نخلة", lat: GEO[activeId].lat, lng: GEO[activeId].lng, here: true },
    { en: "As-Sayl al-Kabir (Qarn al-Manazil)", ar: "السيل الكبير (قرن المنازل)", lat: 21.635, lng: 40.425 },
    { en: "Taif", ar: "الطائف", lat: 21.2703, lng: 40.4158, big: true },
  ];
  const span = 78000;
  const k = (W - 160) / span;
  const X = (m) => W / 2 + m * k, Y = (m) => (H - 24) / 2 + m * k;
  const xy = places.map((p) => P(p.lat, p.lng)).map(([x, y]) => [X(x), Y(y)]);
  let g = `<path d="M${xy[0].join(" ")}L${xy[1].join(" ")}L${xy[2].join(" ")}L${xy[3].join(" ")}" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-dasharray="10 7"/>`;
  // Darb Zubayda arriving from the north-east
  g += `<path d="M${W - 70} 40 Q ${xy[1][0] + 160} ${xy[1][1] - 120} ${xy[1][0] + 12} ${xy[1][1] - 10}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="3 6"/>
<text x="${W - 70}" y="30" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="14" fill="${INK}">Darb Zubayda from Kufa · درب زبيدة من الكوفة</text>`;
  places.forEach((p, i) => {
    const [x, y] = xy[i];
    g += `<g font-family="Inter,Segoe UI,Arial,sans-serif">
<circle cx="${x}" cy="${y}" r="${p.here ? 13 : p.big ? 9 : 6}" fill="${p.here ? ACCENT : INK}"/>
<text x="${x + (i === 0 ? -16 : 18)}" y="${y - 2}" text-anchor="${i === 0 ? "end" : "start"}" font-size="${p.here ? 18 : 15}" font-weight="${p.here ? 700 : 500}" fill="${INK}">${p.en}</text>
<text x="${x + (i === 0 ? -16 : 18)}" y="${y + 17}" text-anchor="${i === 0 ? "end" : "start"}" font-size="14" fill="${p.here ? ACCENT : MUTED}" font-family="Tajawal,Segoe UI,Arial,sans-serif">${p.ar}</text></g>`;
  });
  return frame(g, `Old Makkah–Taif road through Nakhla · schematic, not for navigation`, northArrow(W - 50, H - 90) + scaleBar(40, 50, k, 10000));
}

/* ───────────────────────────── main ───────────────────────────── */

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" });
const page = await browser.newPage();
async function writeWebp(file, svg) {
  const dataUrl = await page.evaluate(
    async ({ svg, w, h }) => {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      return c.toDataURL("image/webp", 0.86);
    },
    { svg, w: W, h: H },
  );
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
}

const generated = {};
for (const id of ORDER) {
  const { b, hs, views } = SITES[id]();
  await writeGlb(b, join(ROOT, "public/models", `${id}.glb`));

  const dir = join(ROOT, "public/img", id);
  mkdirSync(dir, { recursive: true });
  const hero = render(b, { az: views[0], el: 32 });
  await writeWebp(join(dir, "hero.webp"), frame(hero.body, NOTE));
  const alt = render(b, { az: views[1], el: 28 });
  await writeWebp(join(dir, "aerial-2.webp"), frame(alt.body, NOTE));
  const plan = render(b, { az: 0, el: 90 });
  await writeWebp(
    join(dir, "plan.webp"),
    frame(plan.body, NOTE, northArrow(W - 50, 60) + scaleBar(40, 50, plan.scale, niceMetres(plan.scale))),
  );
  writeFileSync(join(dir, "location.svg"), locationSvg(id));
  writeFileSync(join(dir, "route.svg"), routeSvg(id));

  generated[id] = {
    triangles: b.triangleCount(),
    anchors: Object.fromEntries(Object.entries(hs).map(([k, v]) => [k, { anchor: b.normalise(v.at), snap: v.snap }])),
  };
  console.log(`${id.padEnd(18)} ${String(b.triangleCount()).padStart(6)} tris`);
}
await browser.close();
mkdirSync(join(ROOT, "src/data/sites"), { recursive: true });
writeFileSync(join(ROOT, "src/data/sites/generated.json"), JSON.stringify(generated, null, 2) + "\n");
