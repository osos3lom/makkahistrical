/** Placeholder massing for the four Wadi Nakhla sites.
 *
 *  These are NOT surveys. Dimensions follow the published descriptions where
 *  there are any (see PLAN.md §1) and documented Darb Zubayda pools where there
 *  are not. Axes: x east, y up, z south — so north is -z.
 *
 *  Each site returns its builder, its hotspot anchors in metres, and the
 *  azimuths used for the two aerial card renders. */

import { Builder, noise2 } from "./builder.mjs";

const PALETTE = {
  ground: "#c9a77c",
  rock: "#9c7a5a",
  stone: "#b49a7a",
  stoneDark: "#8a7158",
  mud: "#c08a5c",
  plaster: "#e3d3b8",
  water: "#5f8f97",
  green: "#6f8f4e",
  greenDark: "#55733c",
  trunk: "#7a5a3c",
};

function kit() {
  const b = new Builder();
  for (const [k, v] of Object.entries(PALETTE)) b.mat(k, v, k === "water" ? 0.25 : 0.92);
  return b;
}

/** A straight wall. With `ruin`, it is broken into short courses of uneven
 *  height with the odd gap, which is how these walls actually survive. */
function wall(b, m, x0, z0, x1, z1, t, y0, h, ruin = null) {
  const L = Math.hypot(x1 - x0, z1 - z0);
  const rot = -Math.atan2(z1 - z0, x1 - x0);
  if (!ruin) {
    b.box(m, (x0 + x1) / 2, y0, (z0 + z1) / 2, L, h, t, rot);
    return;
  }
  const n = Math.max(1, Math.round(L / 2.4));
  for (let i = 0; i < n; i++) {
    const k = ruin.noise(i * 0.73 + ruin.seed, ruin.seed * 1.3);
    if (k < ruin.gap) continue;
    const f = (i + 0.5) / n;
    const hh = h * (ruin.min + (1 - ruin.min) * k);
    b.box(m, x0 + (x1 - x0) * f, y0, z0 + (z1 - z0) * f, L / n + 0.02, hh, t, rot);
  }
}

/** A track laid as short slabs, each turned to follow the line. */
function track(b, m, pts, width) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, z1 - z0);
    b.boxOn(m, (x0 + x1) / 2, (z0 + z1) / 2, L + 0.4, 0.12, width, -Math.atan2(z1 - z0, x1 - x0), 0.06);
  }
}

function rectWalls(b, m, cx, cz, w, d, t, y0, h, ruin = null) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const r = (s) => (ruin ? { ...ruin, seed: ruin.seed + s } : null);
  wall(b, m, x0, z0, x1, z0, t, y0, h, r(1));
  wall(b, m, x0, z1, x1, z1, t, y0, h, r(2));
  wall(b, m, x0, z0 + t / 2, x0, z1 - t / 2, t, y0, h, r(3));
  wall(b, m, x1, z0 + t / 2, x1, z1 - t / 2, t, y0, h, r(4));
}

/* ─────────────────────────── Al-Madiq — the narrows ─────────────────────────── */
export function madiq() {
  const b = kit();
  const nz = noise2(3);
  const S = 220;
  // Valley runs east–west; the floor pinches at x ≈ 0, which is the "madiq".
  const halfWidth = (x) => 24 + 46 * Math.min(1, (x / 110) ** 2);
  const height = (x, z) => {
    const over = Math.max(0, Math.abs(z) - halfWidth(x));
    return Math.min(46, over ** 1.25 * 0.55) + nz(x / 18, z / 18) * 2.2 - x * 0.015;
  };
  b.terrain("ground", S, 56, height);

  // orchards and palms on the valley floor, both sides of the pinch
  for (const [x, z, w, d] of [[-62, -8, 34, 22], [-60, 20, 26, 14], [58, -12, 30, 24], [64, 18, 28, 14]]) {
    b.boxOn("green", x, z, w, 0.6, d, 0, 0.5);
    for (let i = 0; i < 6; i++) b.palm("trunk", "greenDark", x - w / 2 + 3 + ((i * 7.3) % (w - 6)), z - d / 2 + 3 + ((i * 5.1) % (d - 6)), 6 + (i % 3));
  }
  // farmhouses — mud-brick blocks with parapets
  const houses = [[-40, -14, 12, 9], [-36, 4, 9, 9], [34, -16, 11, 8], [40, 6, 10, 10]];
  houses.forEach(([x, z, w, d], i) => {
    b.boxOn("mud", x, z, w, 3.6 + (i % 2) * 2.4, d);
    const top = b.heightAt(x, z) + 3.6 + (i % 2) * 2.4;
    rectWalls(b, "plaster", x, z, w, d, 0.3, top, 0.7);
  });
  // irrigation channel (falaj) threading the narrows
  for (let x = -100; x < 100; x += 8) b.boxOn("water", x + 4, 2 * Math.sin(x / 30), 8.2, 0.25, 1.1, 0, 0.1);

  const hs = {
    narrows: { at: [0, b.heightAt(0, -halfWidth(0) - 6) + 4, -halfWidth(0) - 6], snap: "wall" },
    orchards: { at: [-62, b.heightAt(-62, -8) + 1, -8], snap: "court" },
    farmhouse: { at: [-40, b.heightAt(-40, -14) + 5, -14], snap: "roof" },
    channel: { at: [20, b.heightAt(20, 2) + 0.5, 2], snap: "court" },
    "upper-valley": { at: [96, b.heightAt(96, -40) + 4, -40], snap: "roof" },
  };
  return { b, hs, views: [-38, 140] };
}

/* ─────────────── Birkat al-Mutawakkil — a Darb Zubayda cistern ─────────────── */
export function birkatMutawakkil() {
  const b = kit();
  const nz = noise2(11);
  const S = 110;
  const P = 32; // pool side, inside the walls
  const depth = 4.2;
  const inPool = (x, z) => Math.abs(x) < P / 2 + 0.8 && Math.abs(z) < P / 2 + 0.8;
  const inTank = (x, z) => Math.abs(x + 27) < 5 && Math.abs(z + 2) < 4;
  const height = (x, z) => nz(x / 22, z / 22) * 0.8 - 0.5 + z * 0.012 + Math.max(0, -z - 40) * 0.4;
  b.terrain("ground", S, 44, height, (x, z) => inPool(x, z) || inTank(x, z));

  const ruin = { noise: noise2(5), seed: 1, min: 0.35, gap: 0.12 };
  // pool floor and walls, sunk below the valley floor; the walls stand a little proud
  b.box("stoneDark", 0, -depth - 0.4, 0, P + 2, 0.4, P + 2);
  rectWalls(b, "stone", 0, 0, P + 1.6, P + 1.6, 1.6, -depth, depth + 1.6, ruin);
  b.box("water", 0, -depth, 0, P - 0.2, 1.1, P - 0.2);
  // stair down the north wall
  for (let i = 0; i < 9; i++) b.box("stone", -8, -depth + i * 0.48, -P / 2 + 0.8 + i * 0.55, 2.4, 0.48, 1.1);
  // settling tank (masfat) west of the pool, joined by a sluice
  b.box("stoneDark", -27, -2.4, -2, 10, 0.3, 8);
  rectWalls(b, "stone", -27, -2, 10, 8, 0.9, -2.2, 3.0, { ...ruin, seed: 9, gap: 0.05 });
  wall(b, "stone", -22, -3.2, -P / 2 - 1, -3.2, 0.7, -1.0, 1.4);
  wall(b, "stone", -22, -0.8, -P / 2 - 1, -0.8, 0.7, -1.0, 1.4);
  // inflow channel from the wadi to the north-west
  for (const off of [-1.4, 1.4]) wall(b, "stoneDark", -32 - off, -6, -50 - off, -36, 0.7, height(-40, -20) - 0.4, 1.2, { ...ruin, seed: 20 + off, gap: 0.2 });
  // the road itself — a cleared track passing the pool on the east
  track(b, "plaster", Array.from({ length: 19 }, (_, i) => [26 + Math.sin((i * 6 - 54) / 20) * 3, i * 6 - 54]), 5);

  const hs = {
    walls: { at: [P / 2 + 0.8, 0.6, 6], snap: "wall" },
    steps: { at: [-8, -2, -P / 2 + 3], snap: "court" },
    tank: { at: [-27, -1, -2], snap: "court" },
    inflow: { at: [-41, height(-41, -21), -21], snap: "roof" },
    road: { at: [27, height(27, 30) + 0.2, 30], snap: "court" },
  };
  return { b, hs, views: [-40, 130] };
}

/* ─────────────── Umm al-Dumayran — cistern and ruined rooms ─────────────── */
export function ummDumayran() {
  const b = kit();
  const nz = noise2(23);
  const S = 90;
  const W = 18, D = 14, depth = 3.2;
  const inPool = (x, z) => Math.abs(x - 10) < W / 2 + 0.6 && Math.abs(z - 6) < D / 2 + 0.6;
  const height = (x, z) => nz(x / 16, z / 16) * 0.9 - 0.5 - x * 0.02 + Math.max(0, -z - 25) * 0.5;
  b.terrain("ground", S, 40, height, inPool);

  const ruin = { noise: noise2(29), seed: 3, min: 0.3, gap: 0.18 };
  b.box("stoneDark", 10, -depth - 0.3, 6, W + 1.4, 0.3, D + 1.4);
  rectWalls(b, "stone", 10, 6, W + 1.2, D + 1.2, 1.2, -depth, depth + 1.4, ruin);
  b.box("water", 10, -depth, 6, W - 0.2, 0.6, D - 0.2);

  // a cluster of rooms west of the pool, surviving as low wall stubs
  const rooms = [[-18, -4, 9, 7], [-9, -4, 7, 7], [-18, 5, 9, 8], [-24, 14, 6, 6]];
  rooms.forEach(([x, z, w, d], i) =>
    rectWalls(b, "mud", x, z, w, d, 0.7, height(x, z) - 0.3, 2.2, { ...ruin, seed: 40 + i * 7, min: 0.25, gap: 0.22 }),
  );
  // courtyard enclosure tying rooms to the pool
  rectWalls(b, "stoneDark", -8, 6, 46, 34, 0.6, height(-8, 6) - 0.3, 1.2, { ...ruin, seed: 70, gap: 0.3 });
  // scattered tumble
  for (let i = 0; i < 18; i++) {
    const x = -30 + ((i * 17.3) % 60), z = -14 + ((i * 11.7) % 34);
    if (!inPool(x, z)) b.boxOn("stoneDark", x, z, 0.8, 0.5, 0.6, i);
  }
  for (const [x, z] of [[30, -18], [34, -10], [-34, 22]]) b.palm("trunk", "greenDark", x, z, 6);

  const hs = {
    pool: { at: [10, -1.5, 6], snap: "court" },
    rooms: { at: [-18, height(-18, -4) + 1.6, -4], snap: "roof" },
    enclosure: { at: [-31, height(-31, -4) + 0.8, -4], snap: "wall" },
    "pool-wall": { at: [10 + W / 2 + 0.6, 0.4, 2], snap: "wall" },
    sawla: { at: [0, height(0, -38) + 2, -38], snap: "roof" },
  };
  return { b, hs, views: [-36, 150] };
}

/* ───────────── Al-Zaymah — hilltop fort above the spring ───────────── */
export function zaymah() {
  const b = kit();
  const nz = noise2(37);
  const S = 200;
  const top = 34;
  const hill = (x, z) => {
    const r = Math.hypot((x + 20) / 1.15, z + 6);
    return r < 30 ? top : top * Math.exp(-(((r - 30) / 34) ** 2));
  };
  const height = (x, z) => Math.max(hill(x, z), 0) + nz(x / 14, z / 14) * (hill(x, z) < top - 0.5 ? 2.4 : 0.3) - x * 0.02;
  b.terrain("ground", S, 60, height);

  const fx = -20, fz = -6, FW = 44, FD = 28;
  const base = top - 0.6;
  const ruin = { noise: noise2(41), seed: 2, min: 0.3, gap: 0.1 };
  rectWalls(b, "stone", fx, fz, FW, FD, 1.6, base, 5.0, ruin);
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
    b.cyl("stone", fx + (dx * FW) / 2, base, fz + (dz * FD) / 2, 3.4, 3.0, 4 + (dx + 2) * 0.6, 12);
  // half-round buttress towers mid-wall
  for (const dx of [-1, 1]) b.cyl("stone", fx + dx * (FW / 2), base, fz, 2.4, 2.2, 3.4, 10);
  // interior: a row of rooms on the north side and column stubs in the court
  for (let i = 0; i < 4; i++) rectWalls(b, "stoneDark", fx - FW / 2 + 6 + i * 10.5, fz - FD / 2 + 5, 10, 8, 0.8, base, 3.0, { ...ruin, seed: 50 + i * 5, gap: 0.2 });
  for (let i = 0; i < 5; i++) for (const zz of [3, 8]) b.cyl("plaster", fx - 14 + i * 7, base, fz + zz, 0.55, 0.5, 1.2 + ((i * 3 + zz) % 4) * 0.6, 8);
  // gate on the south wall
  b.box("stoneDark", fx, base, fz + FD / 2 + 1.4, 4.4, 4.2, 1.6);

  // the spring and its gardens on the valley floor to the east
  b.boxOn("water", 62, 30, 9, 0.4, 6, 0.2, 0.2);
  rectWalls(b, "stone", 62, 30, 10, 7, 0.6, height(62, 30) - 0.4, 1.0);
  for (const [x, z, w, d] of [[70, 52, 34, 22], [44, 58, 22, 16], [78, 14, 18, 20]]) {
    b.boxOn("green", x, z, w, 0.6, d, 0, 0.5);
    for (let i = 0; i < 5; i++) b.palm("trunk", "greenDark", x - w / 2 + 3 + ((i * 6.7) % (w - 6)), z - d / 2 + 3 + ((i * 4.9) % (d - 6)), 6 + (i % 3));
  }
  // the old caravan track (madraj) climbing past the hill
  track(b, "plaster", Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    return [-90 + t * 150, 70 - t * 40 + Math.sin(t * 8) * 6];
  }), 4.5);

  const hs = {
    "fort-walls": { at: [fx + FW / 2 + 0.8, base + 2.5, fz + 4], snap: "wall" },
    towers: { at: [fx - FW / 2, base + 4, fz - FD / 2], snap: "roof" },
    columns: { at: [fx, base + 0.5, fz + 5.5], snap: "court" },
    spring: { at: [62, height(62, 30), 30], snap: "court" },
    madraj: { at: [-30, height(-30, 54) + 0.2, 54], snap: "court" },
  };
  return { b, hs, views: [-30, 145] };
}

export const SITES = {
  madiq,
  "birkat-mutawakkil": birkatMutawakkil,
  "umm-dumayran": ummDumayran,
  zaymah,
};
