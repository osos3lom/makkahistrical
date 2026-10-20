/** A tiny mesh kit for placeholder massing models.
 *
 *  Geometry is collected per material, in metres, y-up (glTF convention), so
 *  every exported mesh carries one flat PBR material — the same shape of GLB
 *  the dream3d Blender pipeline produced, which is what the viewer expects.
 *  The same triangles feed the SVG renderer, so card images always match the
 *  model on stage. */

export class Builder {
  constructor() {
    /** @type {Map<string, {rgb:[number,number,number], rough:number, pos:number[], nrm:number[], idx:number[]}>} */
    this.mats = new Map();
    this.heightAt = () => 0;
  }

  mat(name, hex, rough = 0.9) {
    const n = parseInt(hex.slice(1), 16);
    const rgb = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    this.mats.set(name, { rgb, hex, rough, pos: [], nrm: [], idx: [] });
    return name;
  }

  /** One flat-shaded triangle. */
  tri(m, a, b, c) {
    const M = this.mats.get(m);
    const u = sub(b, a), v = sub(c, a);
    const n = norm(cross(u, v));
    const base = M.pos.length / 3;
    for (const p of [a, b, c]) {
      M.pos.push(...p);
      M.nrm.push(...n);
    }
    M.idx.push(base, base + 1, base + 2);
  }

  quad(m, a, b, c, d) {
    this.tri(m, a, b, c);
    this.tri(m, a, c, d);
  }

  /** Axis-aligned box (optionally turned about Y), base at y0. */
  box(m, cx, y0, cz, w, h, d, rotY = 0) {
    const hw = w / 2, hd = d / 2;
    const cs = Math.cos(rotY), sn = Math.sin(rotY);
    const P = (x, y, z) => [cx + x * cs + z * sn, y0 + y, cz - x * sn + z * cs];
    const v = [
      P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd),
      P(-hw, h, -hd), P(hw, h, -hd), P(hw, h, hd), P(-hw, h, hd),
    ];
    this.quad(m, v[4], v[7], v[6], v[5]); // top
    this.quad(m, v[0], v[1], v[2], v[3]); // bottom
    this.quad(m, v[3], v[2], v[6], v[7]); // +z
    this.quad(m, v[1], v[0], v[4], v[5]); // -z
    this.quad(m, v[2], v[1], v[5], v[6]); // +x
    this.quad(m, v[0], v[3], v[7], v[4]); // -x
  }

  /** Box whose base sits on the terrain at its centre. */
  boxOn(m, cx, cz, w, h, d, rotY = 0, sink = 0.3) {
    this.box(m, cx, this.heightAt(cx, cz) - sink, cz, w, h + sink, d, rotY);
  }

  /** Frustum / cone (r1 = 0) with flat side facets. */
  cyl(m, cx, y0, cz, r0, r1, h, seg = 10) {
    const ring = (r, y) =>
      Array.from({ length: seg }, (_, i) => {
        const a = (i / seg) * Math.PI * 2;
        return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      });
    const lo = ring(r0, y0), hi = ring(r1, y0 + h);
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      if (r1 > 0) this.quad(m, lo[i], hi[i], hi[j], lo[j]);
      else this.tri(m, lo[i], [cx, y0 + h, cz], lo[j]);
    }
    if (r1 > 0) for (let i = 1; i < seg - 1; i++) this.tri(m, hi[0], hi[i + 1], hi[i]);
  }

  palm(trunk, frond, x, z, h = 7) {
    const y = this.heightAt(x, z) - 0.2;
    this.cyl(trunk, x, y, z, 0.3, 0.22, h, 6);
    this.cyl(frond, x, y + h - 1.4, z, 2.6, 0, 1.0, 7);
    this.cyl(frond, x, y + h - 0.6, z, 1.6, 0, 1.6, 7);
  }

  /** Square-grid heightfield of side `size` centred on the origin.
   *  `hole(x, z)` drops cells — used to cut cisterns into the ground. */
  terrain(m, size, n, height, hole = () => false) {
    this.heightAt = height;
    const step = size / n, h0 = -size / 2;
    const at = (i, j) => {
      const x = h0 + i * step, z = h0 + j * step;
      return [x, height(x, z), z];
    };
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const cx = h0 + (i + 0.5) * step, cz = h0 + (j + 0.5) * step;
        if (hole(cx, cz)) continue;
        const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        this.tri(m, a, d, c);
        this.tri(m, a, c, b);
      }
    // skirt down to a plinth so the model reads as a cut block of ground
    const base = Math.min(...[...Array(n + 1).keys()].flatMap((i) => [height(h0 + i * step, h0), height(h0, h0 + i * step)])) - 4;
    for (let i = 0; i < n; i++) {
      for (const [p, q] of [
        [[h0 + i * step, h0], [h0 + (i + 1) * step, h0]],
        [[h0 + (i + 1) * step, -h0], [h0 + i * step, -h0]],
        [[-h0, h0 + i * step], [-h0, h0 + (i + 1) * step]],
        [[h0, h0 + (i + 1) * step], [h0, h0 + i * step]],
      ]) {
        const A = [p[0], height(p[0], p[1]), p[1]], B = [q[0], height(q[0], q[1]), q[1]];
        this.quad(m, [A[0], base, A[2]], [B[0], base, B[2]], B, A);
      }
    }
  }

  bounds() {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const M of this.mats.values())
      for (let i = 0; i < M.pos.length; i += 3)
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], M.pos[i + k]);
          max[k] = Math.max(max[k], M.pos[i + k]);
        }
    return { min, max };
  }

  /** Metres → the viewer's normalised box space (x/z across the footprint,
   *  y across the height), exactly as `Hotspot.anchor` documents it. */
  normalise([x, y, z]) {
    const { min, max } = this.bounds();
    const f = (v, k) => +((v - min[k]) / (max[k] - min[k])).toFixed(3);
    return [f(x, 0), f(y, 1), f(z, 2)];
  }

  triangleCount() {
    let n = 0;
    for (const M of this.mats.values()) n += M.idx.length / 3;
    return n;
  }
}

/** Deterministic value noise so rebuilding a model never shifts its hotspots. */
export function noise2(seed) {
  const r = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, z) => {
    const i = Math.floor(x), j = Math.floor(z);
    const fx = smooth(x - i), fz = smooth(z - j);
    const a = r(i, j), b = r(i + 1, j), c = r(i, j + 1), d = r(i + 1, j + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  };
}

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
