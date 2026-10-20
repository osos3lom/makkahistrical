# Wadi Nakhla Heritage Atlas — research & porting plan

Port of [`dream3d`](../dream3d) (Heritage Villa Studio) into an atlas of four historical sites in
**وادي نخلة**, north-east of Makkah: a map with pins → pick a site → see it in 3D and in photos.

---

## 1. The four sites

All four sit inside a ~5 km stretch of the valley, on the old Makkah–Taif / Makkah–Iraq pilgrim roads,
about 40 km north-east of Makkah. Coordinates resolved from the shared Google Maps links.

| # | Site | Arabic | Lat, Lng | Google place id (ftid) |
|---|------|--------|----------|------------------------|
| 1 | Al-Madiq (village) | المضيق | 21.660371, 40.121055 | `0x15ea0e6fb61aa851:0xad5864aaf920cc24` |
| 2 | Birkat al-Mutawakkil — Darb Zubayda | بركة المتوكل - درب زبيدة | 21.651829, 40.103928 | `0x15ea0fa7aea9bec9:0x8abdc73e157f4023` |
| 3 | Umm al-Dumayran | أم الضيمران | 21.638662, 40.091818 | `0x15ea0f1a5eccdcd7:0xfd1bcc79e1f89b8a` |
| 4 | Al-Zaymah (village, spring, fort) | الزيمة | 21.616236, 40.106867 | `0x15ea0fa5dce401c7:0x16315783c02fbeeb` |

Map bounds that fit all four with padding: SW `21.605, 40.080` → NE `21.670, 40.135`.

### 1.1 Al-Madiq — المضيق
- Village and administrative centre ~42 km NE of Makkah (Taif governorate). Name means "the narrows":
  the valley pinches between mountains here.
- Arabic Wikipedia identifies it with **Wadi Nakhla al-Shamiya** (the northern Nakhla), also called
  *Wadi al-Laymun* for its lemon groves. Tradition places the idol **al-‘Uzza** in the upper valley,
  and **Dhat ‘Irq** (miqat for Iraq/Najd pilgrims) at its head.
- Shown as: a **valley-village scene** — terrain narrows, palm/lemon orchards, mud-brick and stone
  farmhouses, irrigation channels.

### 1.2 Birkat al-Mutawakkil on Darb Zubayda — بركة المتوكل
- A water cistern on **Darb Zubayda**, the Abbasid Kufa→Makkah pilgrim road (~1,400 km in Saudi
  Arabia), whose pools, wells and stations were built from the reign of Harun al-Rashid and his wife
  Zubayda (late 8th c.) onward. The last stage ran through Wadi Nakhla → **Bustan Ibn ‘Amir** → Makkah.
- The name links it to caliph **al-Mutawakkil** (r. 232–247 AH / 847–861 CE), who also funded works on
  the road. Field reports (Al-Sahra team) describe a pool in the middle of the valley of which mostly a
  ruined wall survives.
- ⚠ No published survey dimensions were found. The 3D model must be labelled an **interpretive
  reconstruction** based on documented Darb Zubayda pools (square/rectangular, dry-stone walls,
  internal steps, settling tank and inflow channel — e.g. al-‘Ashar ≈ 65 × 51 m × 5 m deep).
- Do not confuse with the *Birkat al-Mutawakkil* of al-Buhturi's poem (Samarra, Iraq) or the pool of
  the same name at al-‘Ashar near Linah.

### 1.3 Umm al-Dumayran — أم الضيمران
- In the **Sawla / Sulah (سولة)** district of al-Zaymah. Arabic Wikipedia lists it among al-Zaymah's
  landmarks: *"a pool and old architectural structures"*. Sawla also has *Birkat Umm al-Salam*.
- Sawla appears in a verse quoted by Yaqut: *"مرتعي من بلاد نخلة في الصيف بأكناف سولة والزيمة"*.
- Shown as: a **cistern with ruined ancillary buildings** (walls, rooms) — reconstruction, same caveat.

### 1.4 Al-Zaymah — الزيمة
- First caravan stage out of Makkah on the Nakhla road; the old Makkah–Taif routes forked here. The
  Prophet ﷺ is reported to have passed through it on the way to Taif. Origins traced to the early
  Abbasid period. Name explained as "the land that drinks from itself" (self-sufficient water).
- Landmarks:
  - **‘Ayn al-Zaymah** — one of the best-known springs of Wadi Nakhla / Wadi Fatima; flow comes and
    goes with the water table.
  - **Al-Zaymah castle** — ruins on a high hill ~35 km from Makkah on the Makkah–al-Sayl road,
    attributed to caliph **al-Muqtadir** (r. 295–320 AH / 908–932 CE); rectangular, with columns and
    rooms. Al-Hamdani: the estate of ‘Abdallah b. ‘Ubaydallah al-Hashimi earned 5,000 dinars a year
    under al-Muqtadir and had *"a fort for fighters built of rock"*.
  - **Qasr / Hisn Al Sa‘ud** — stone-and-gypsum fort, 1804 (First Saudi State), at the foot of the wadi.
  - **Madraj** — paved stretch of the old caravan road.
- Shown as: the **hilltop Abbasid fort** (primary model) with the spring and orchards below.

### 1.5 Source confidence
| Claim | Confidence |
|---|---|
| Coordinates, names | High (Google Maps) |
| Al-Zaymah history, castle, spring, Umm al-Dumayran listing | Medium (Arabic Wikipedia, citing Makkah Emirate & Ministry of Culture) |
| Al-Madiq = Nakhla al-Shamiya, al-‘Uzza | Medium-low (one Wikipedia stub, traditional accounts) |
| Birkat al-Mutawakkil attribution and form | Low — needs Heritage Commission / Darb Zubayda survey reports |

Every claim in the app carries a `provenance` entry (dream3d already has `src/types/provenance.ts`), and
every model is typed `typology: "reconstruction"`, never presented as a survey.

Sources: [ar.wikipedia — الزيمة](https://ar.wikipedia.org/wiki/الزيمة) ·
[ar.wikipedia — المضيق (مكة المكرمة)](https://ar.wikipedia.org/wiki/المضيق_(مكة_المكرمة)) ·
[Saudipedia — Az-Zaymah Center](https://saudipedia.com/en/article/3688/geography/provinces-and-cities/az-zaymah-center) ·
[Al-Sahra team — Darb Zubayda (21): Wadi Nakhla → Bustan Ibn ‘Amir](https://alsahra.org/2016/11/%D8%AF%D8%B1%D8%A8-%D8%A7%D9%84%D8%AD%D8%AC-%D8%A7%D9%84%D9%83%D9%88%D9%81%D9%8A-%D8%AF%D8%B1%D8%A8-%D8%B2%D8%A8%D9%8A%D8%AF%D8%A9-21-%D9%86%D9%87%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%B1%D8%AD) ·
[SPA — al-‘Ashar pool](https://www.spa.gov.sa/N2040396) ·
[Wikipedia — Zubaydah Trail](https://en.wikipedia.org/wiki/Zubaydah_Trail)

---

## 2. What dream3d gives us

| Keep as-is | Adapt | Drop |
|---|---|---|
| `src/three/engine.ts` (WebGPU viewer, turntable switch, hotspot snapping, model cache) | `types/empire.ts` → `types/site.ts` (add `geo`, `gallery`, `period`) | `data/styles/*` (5 villas) |
| `HotspotLayer`, `Viewer` | `EmpireLibrary` → site list | `routes/StudioRoute`, `lib/studio/*`, `three/parametric/*`, `data/catalog` |
| i18n EN/AR + RTL, `use-locale-chrome` | `InfoPanel` facts → history/period/coords | `data/characters`, `data/corpus` (elements) — unless we reuse the reference layer later |
| Design tokens in `index.css`, shadcn/ui | `BottomCards` → Photos / History / Getting there / Timeline / Quiz | Villa-specific `scripts/blender/*` |
| `lib/assets.ts`, GitHub Pages workflow, 404 fallback | `modals.tsx` (lesson/quiz/timeline reused, artefacts → "finds") | |
| `scripts/compose_images.py` | `Banner` attribution text | |

The engine is already data-driven (one GLB + camera preset + hotspots per exhibit), so the port is
mostly new data, one new layout state, and two new components.

---

## 3. UX — map first, then site

```
/:lang                 Map view (default)
/:lang/site/:siteId    Site view (3D + photos), map collapses to a mini-map
```

**Map view**
- Full-bleed map of the valley, terrain/satellite base layer, the four pins numbered 1–4 and labelled
  in the active language; the Darb Zubayda alignment and the old Makkah–Taif road drawn as dashed lines.
- Hover / focus a pin → preview card (thumbnail, name, one-line summary, period chip). This also starts
  prefetching the GLB (engine already supports warm residency).
- Click → fly-to, then route to `/site/:id`.
- Side list (desktop) / bottom sheet (phone) mirrors the pins for keyboard and screen-reader users.

**Site view**
- Desktop ≥1280px: left = mini-map (pins still clickable, switches site with the existing turntable
  spin), centre = 3D stage, right = info panel. Below: cards.
- Tabs on the stage: **3D** | **Photos**. Photos is a lightbox gallery with photographer + licence on
  every image.
- Phone: map → sheet; 3D stage full width; tool rail docked at bottom (as dream3d already does).

**Map tech:** **MapLibre GL JS** (no API key, WebGL, RTL text plugin for Arabic labels) with Esri World
Imagery or OSM tiles; optional terrain via a public DEM tile source. Avoids Google Maps billing/keys.
Each site still links out to its Google Maps place (the ftids above) for directions.

---

## 4. 3D content

Four procedurally generated GLBs, same pipeline as dream3d (Blender + Python, merged per-material,
Draco, 0.5–2 MB each), each on a terrain plinth cut from a real DEM so the valley shape is right.

| Site | Model | Hotspots (5 each) |
|---|---|---|
| Al-Madiq | Valley narrows: terrain + orchard + 3–4 farmhouses + falaj channel | the narrows, lemon groves, farmhouse, irrigation, route to Dhat ‘Irq |
| Birkat al-Mutawakkil | Square stone cistern, steps, settling tank, inflow channel, ruined wall (as found) + ghosted full form | walls, steps, settling tank, inflow, road alignment |
| Umm al-Dumayran | Cistern + ruined rooms | pool, rooms, wall courses, Sawla wadi, water source |
| Al-Zaymah | Hilltop rectangular Abbasid fort ruin + spring and orchards below | fort walls, columns/rooms, ‘Ayn al-Zaymah, caravan madraj, Hisn Al Sa‘ud |

Viewer additions:
- **"As found / reconstructed" toggle** (ruin mesh vs ghosted full volume) — reuses the existing x-ray
  layer material.
- A **north arrow + scale bar** on the stage, since these are real places.

---

## 5. Images "from the web"

Hot-linking random search results is unreliable and a copyright problem, so:

1. **Build-time curation script** `scripts/fetch_images.py`: queries Wikimedia Commons (geosearch
   around each coordinate + keyword search), Mapillary (street-level, CC-BY-SA), and Flickr CC-licensed
   photos; writes `public/img/<site>/gallery/*.webp` plus `gallery.json` with author, licence, source URL.
   A human approves the list before commit.
2. **User-supplied photos** (yours or the heritage team's) go in the same folder with the same metadata.
3. **Runtime fallback** when a site has fewer than 3 images: a "More photos" button opening Google Maps
   photos for that ftid, and a Mapillary street-level embed.
4. Rendered views of our own 3D model fill hero/thumbnail slots (as dream3d does).

Commons coverage for this valley is thin (checked: Darb Zubayda has photos of other stations, little for
al-Zaymah/al-Madiq), so step 2 will matter.

---

## 6. Data contract

```ts
interface Site {
  id: "madiq" | "birkat-mutawakkil" | "umm-dumayran" | "zaymah";
  name: string; nameAr: string;
  kind: "village" | "cistern" | "fort" | "spring";
  geo: { lat: number; lng: number; googleFtid: string };
  period: { label: string; from?: number; to?: number };   // CE years
  summary: string; description: string;
  modelPath: string; camera: CameraPreset; tint: string;
  hotspots: Hotspot[];                     // unchanged from dream3d
  gallery: Array<{ src: string; author: string; licence: string; sourceUrl: string; caption?: string }>;
  sections: { history; water; route; gettingThere };      // EmpireSection-shaped cards
  timeline: TimelineEntry[]; quiz: QuizQuestion[];
  typology: "reconstruction";
  provenance: Provenance; ar?: SiteArabicData;
}
```

---

## 7. Steps

1. **Scaffold** — copy dream3d into this repo (no `node_modules`, `dist`, `.git`), rename package,
   set Vite `base` to `/makkahistrical/`, delete Studio/parametric/characters/corpus, confirm build.
2. **Data** — `types/site.ts`, `data/sites/*.ts` for the four sites (EN + AR) from §1, with provenance.
3. **Map view** — MapLibre component, pins, preview cards, list/sheet, routes `/:lang` and
   `/:lang/site/:id`.
4. **Site view** — rewire `EmpireAtlasApp` → `SiteApp`, mini-map, 3D|Photos tabs, gallery lightbox
   with attribution.
5. **Placeholder GLBs** — simple massing models so the full flow works end to end.
6. **Final GLBs** — Blender scripts per site on DEM terrain; renders for hero/thumbnail.
7. **Images** — run `fetch_images.py`, review, commit galleries.
8. **QA** — keyboard/RTL/mobile pass, reduced motion, Lighthouse, GitHub Pages deploy.

Steps 3 and 4 can run in parallel once step 2's types exist; 6 and 7 are independent of the UI.

---

## 8. Decisions needed

- **Map base layer:** MapLibre + free imagery (recommended) vs Google Maps JS API (needs a billed key).
- **3D production:** Blender pipeline via the 3D Jutsu MCP, as dream3d was made (recommended) vs
  in-browser procedural geometry only.
- **Photos:** do you or a heritage contact have site photos we can use? Commons alone will not fill four
  galleries.
- **Deploy target:** GitHub Pages under `/makkahistrical/` like dream3d?
