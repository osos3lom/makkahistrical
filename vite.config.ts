import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";

/** GitHub Pages serves a project site from `/<repo>/`, so the bundle is built
 *  against that prefix. `VITE_BASE` overrides it for a custom domain or a
 *  differently named fork (`VITE_BASE=/ npm run build`).
 *
 *  The base is applied unconditionally: `vite preview` reports `command:
 *  "serve"` just like `vite dev`, so branching on `command` would serve the
 *  production bundle from `/` while its own HTML pointed at `/makkahistrical/`. Dev
 *  therefore also runs under the subpath, which is what we want — it is the
 *  same shape the deployment has. */
const base = process.env.VITE_BASE ?? "/makkahistrical/";

/** GitHub Pages is a plain file server with no rewrite rules, so a direct hit
 *  on `/makkahistrical/ar` — a deep link, or simply a refresh — finds no file and is
 *  answered with `404.html`. Serving a copy of the app there hands the URL to
 *  React Router, which renders the right route. The status line is still 404,
 *  which is invisible to the visitor and keeps crawlers from indexing routes
 *  that do not exist.
 *
 *  `.nojekyll` stops Pages running the uploaded output through Jekyll, which
 *  would drop any file or directory whose name begins with an underscore. */
/** The dev and preview servers mount the app under `base`, so opening the
 *  origin root gets a blank page — which is exactly what a preview pane does
 *  when it opens `http://localhost:<port>`. Send `/` on to the base path
 *  instead. Dev-time only; it never ships. */
function redirectRootToBase(): Plugin {
  const redirect = (server: { middlewares: { use: (fn: (req: { url?: string }, res: { writeHead: (c: number, h: Record<string, string>) => void; end: () => void }, next: () => void) => void) => void } }) => {
    server.middlewares.use((req, res, next) => {
      if (req.url === "/" && base !== "/") {
        res.writeHead(302, { Location: base });
        res.end();
        return;
      }
      next();
    });
  };
  return {
    name: "redirect-root-to-base",
    configureServer: redirect,
    configurePreviewServer: redirect,
  };
}

function githubPagesStaticFallback(): Plugin {
  return {
    name: "github-pages-static-fallback",
    apply: "build",
    writeBundle(options) {
      const dir = options.dir ?? "dist";
      copyFileSync(join(dir, "index.html"), join(dir, "404.html"));
      writeFileSync(join(dir, ".nojekyll"), "");
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), redirectRootToBase(), githubPagesStaticFallback()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // three.js is the bulk of the bundle and loads in its own chunk; the
    // default 500 kB warning is noise here.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/webgpu", "three/tsl", "three-mesh-bvh"],
          maplibre: ["maplibre-gl"],
        },
      },
    },
  },
  // Vite does not read PORT on its own. Honouring it lets the launcher hand
  // the server a free port instead of failing when the default is taken.
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
  },
});
