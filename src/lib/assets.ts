/** GitHub Pages serves the app from a repository subpath (`/dream3d/`), so a
 *  root-absolute `/models/najdi.glb` would resolve against the domain root and
 *  404. Every runtime reference to a file in `public/` goes through here, which
 *  re-bases it onto Vite's `BASE_URL`.
 *
 *  Assets imported by the bundler (`import url from "./x.png"`) are rewritten
 *  by Vite itself and must NOT be passed through this helper; it is only for
 *  the paths held as plain strings in the dataset. */
const BASE = import.meta.env.BASE_URL;

export function asset(path: string): string {
  // Already absolute (http(s):, data:, blob:) — hand back untouched.
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) return path;
  return `${BASE}${path.replace(/^\/+/, "")}`;
}
