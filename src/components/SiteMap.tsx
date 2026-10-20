import { memo, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Site } from "@/types/empire";
import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";

/** Free base layers, no API key.
 *
 *  - Esri World Imagery is the sharpest free satellite layer, but its servers
 *    are not reachable from every network. If its tiles fail before any has
 *    loaded, the map drops to Sentinel-2 by itself and says so.
 *  - EOX Sentinel-2 cloudless (2016 release, CC BY 4.0) is 10 m imagery:
 *    soft at site scale, but it always loads.
 *  - OpenStreetMap for roads and place names. */
const BASEMAPS = {
  satellite: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 19,
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    short: "© Esri, Maxar",
  },
  sentinel: {
    tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"],
    maxzoom: 15,
    attribution:
      '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016)',
    short: "Sentinel-2 cloudless © EOX, Copernicus 2016",
  },
  streets: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    short: "© OpenStreetMap contributors",
  },
} as const;
export type BasemapId = keyof typeof BASEMAPS;

function showBasemap(map: maplibregl.Map, which: BasemapId) {
  for (const id of Object.keys(BASEMAPS)) map.setLayoutProperty(id, "visibility", id === which ? "visible" : "none");
}

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
        layers: (Object.keys(BASEMAPS) as BasemapId[]).map((id) => ({
          id,
          type: "raster" as const,
          source: id,
          layout: { visibility: id === basemap ? ("visible" as const) : ("none" as const) },
        })),
      },
      bounds: VALLEY_BOUNDS,
      fitBoundsOptions: { padding: variant === "mini" ? 12 : 48 },
      maxZoom: 18,
      minZoom: 8,
      // The rail map is too small for MapLibre's attribution box; it carries
      // a one-line credit of its own instead (rendered below).
      attributionControl: variant === "mini" ? false : { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: variant === "mini",
    });
    map.touchZoomRotate.disableRotation();
    styleReady.current = false;
    map.once("style.load", () => {
      styleReady.current = true;
      showBasemap(map, basemapRef.current);
    });
    // The compact attribution starts expanded and covers the bottom of the
    // map on a phone; collapse it to its (i) button once the map is up.
    map.once("load", () => box.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
    if (variant === "full") map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
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
      new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.geo.lng, s.geo.lat]).addTo(map);
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

  /* The fallback note explains the switch, then gets out of the way: left up,
     it sits over the southern pins. */
  useEffect(() => {
    if (!fellBack) return;
    const id = window.setTimeout(() => setFellBack(false), 7000);
    return () => window.clearTimeout(id);
  }, [fellBack]);

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
