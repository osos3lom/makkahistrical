# Wadi Nakhla Atlas · أطلس وادي نخلة

Four historic sites in **Wadi Nakhla**, about 40 km north-east of Makkah, on a map and in 3D.
Pick a pin on the valley map to open a site: turn its model, read the pins on it, browse photos, and
follow its history, plan, route and sources. English and Arabic (RTL).

Ported from [dream3d](https://github.com/osos3lom/dream3d) (Heritage Villa Studio): the WebGPU viewer,
hotspot layer, lessons, quiz and timeline are carried over unchanged; the map, gallery and site data
are new. Research and the porting plan are in [PLAN.md](PLAN.md).

| # | Site | Lat, Lng | What it is |
|---|---|---|---|
| 1 | المضيق Al-Madiq | 21.6604, 40.1211 | Village where the valley narrows; Wadi Nakhla al-Shamiya |
| 2 | بركة المتوكل Birkat al-Mutawakkil | 21.6518, 40.1039 | Abbasid cistern on Darb Zubayda |
| 3 | أم الضيمران Umm al-Dumayran | 21.6387, 40.0918 | Pool and old structures in Sawla |
| 4 | الزيمة Al-Zaymah | 21.6162, 40.1069 | Hilltop Abbasid fort, spring, caravan stage |

> **The 3D models are placeholders.** They are simple massing on shaped terrain, interpretive, not
> surveys, and the app says so on every page. Real survey data and photographs will replace them.

## Running it

```bash
npm install
npm run dev                  # http://localhost:5173/makkahistrical/
npm run build                # typecheck + production build to dist/
npm run models:placeholder   # rebuild GLBs, card images and hotspot anchors
```

`models:placeholder` rasterises its renders through the system's Microsoft Edge via Playwright
(`PW_CHANNEL=chrome` to use Chrome). The outputs are committed, so CI never runs it.

## How it fits together

```
/:lang                  valley map (MapLibre), site list
/:lang/site/:siteId     the site: 3D | Photos, mini-map, info panel, cards
```

- [`src/components/AtlasApp.tsx`](src/components/AtlasApp.tsx): the shell for both views; one instance
  survives moving between the map and sites, so the 3D engine is not rebuilt.
- [`src/components/SiteMap.tsx`](src/components/SiteMap.tsx): MapLibre with free base layers, no API
<<<<<<< Updated upstream
  key. Esri World Imagery is drawn over EOX Sentinel-2 cloudless 2024 (CC BY-NC-SA 4.0), so the map
  is never blank where Esri is blocked. OpenStreetMap as the third option. The landing map is tilted
  over Mapterhorn 3D terrain and turns slowly until touched (off under reduced motion).
=======
  key. Esri World Imagery first; if it can't be reached, it falls back to EOX Sentinel-2 cloudless
  (CC BY 4.0) on its own. OpenStreetMap as the third option.
>>>>>>> Stashed changes
- [`src/components/PhotoGallery.tsx`](src/components/PhotoGallery.tsx): curated photos from the site
  data, live Wikimedia Commons geosearch within 10 km (with author and licence on every image), the
  model renders, and links out to Google Maps photos and Mapillary.
- [`src/data/sites/`](src/data/sites): one file per site, EN + AR, with sources and a confidence level
  for each. Hotspot anchors come from `generated.json`, written by the model script, so pins always
  match the model.
- [`scripts/make_placeholder_models.mjs`](scripts/make_placeholder_models.mjs) +
  [`scripts/placeholder/`](scripts/placeholder): builds each site in metres, exports GLB through
  glTF-Transform, and draws the hero, plan, location and route images from the same triangles.
- [`src/three/engine.ts`](src/three/engine.ts): the dream3d viewer, unchanged.

## Adding photos

Put the files in `public/img/<siteId>/gallery/` and list them in the site's `gallery` array with
`caption`, `author`, `licence` and `sourceUrl`. They appear first in the Photos tab.

## Deployment

GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`,
served from `/makkahistrical/`. One-time setup: *Settings → Pages → Source: GitHub Actions*.
`VITE_BASE=/ npm run build` for a custom domain.
