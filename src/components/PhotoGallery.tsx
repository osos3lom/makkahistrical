import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { GalleryImage, Site } from "@/types/empire";
import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";
import { empireImages, googleMapsUrl } from "@/data";
import { ArrowRightIcon, CloseIcon } from "./icons";

type Photo = GalleryImage & { group: "curated" | "renders" | "commons"; distanceM?: number };

/** Commons answers are cached for the session: switching back to a site
 *  should not refetch, and the API asks clients not to hammer it. */
const commonsCache = new Map<string, Promise<Photo[]>>();

/** Geotags that are not photos of the ground: astronaut photography is tagged
 *  with the point beneath the station, so it turns up in every geosearch. */
const NOT_GROUND = /^File:(ISS\d|STS-?\d)|astronaut|from space|view of earth/i;

const stripHtml = (s: string | undefined) => (s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

function fetchCommons(site: Site): Promise<Photo[]> {
  const key = site.id;
  const hit = commonsCache.get(key);
  if (hit) return hit;
  const params = new URLSearchParams({
    action: "query",
    generator: "geosearch",
    ggscoord: `${site.geo.lat}|${site.geo.lng}`,
    ggsradius: "10000",
    ggsnamespace: "6",
    ggslimit: "40",
    prop: "imageinfo|coordinates",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "1280",
    iiextmetadatafilter: "Artist|LicenseShortName|ImageDescription|ObjectName",
    format: "json",
    origin: "*",
  });
  const p = fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((json) => {
      type Page = {
        title: string;
        index?: number;
        coordinates?: Array<{ lat: number; lon: number }>;
        imageinfo?: Array<{
          thumburl?: string;
          url: string;
          descriptionurl: string;
          mime?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      };
      const pages: Page[] = Object.values(json?.query?.pages ?? {});
      return pages
        .filter((pg) => !NOT_GROUND.test(pg.title) && pg.imageinfo?.[0]?.mime?.startsWith("image/"))
        .map((pg): Photo => {
          const ii = pg.imageinfo![0];
          const md = ii.extmetadata ?? {};
          const c = pg.coordinates?.[0];
          const d = c ? Math.hypot((c.lat - site.geo.lat) * 110540, (c.lon - site.geo.lng) * 103400) : undefined;
          return {
            group: "commons",
            src: ii.thumburl ?? ii.url,
            caption: stripHtml(md.ObjectName?.value) || pg.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""),
            author: stripHtml(md.Artist?.value) || "Unknown",
            licence: stripHtml(md.LicenseShortName?.value) || "See source",
            sourceUrl: ii.descriptionurl,
            distanceM: d,
          };
        })
        .sort((a, b) => (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9));
    });
  p.catch(() => commonsCache.delete(key));
  commonsCache.set(key, p);
  return p;
}

interface Props {
  site: Site;
  lang: Language;
}

export const PhotoGallery = memo(function PhotoGallery({ site, lang }: Props) {
  const t = useTranslation(lang);
  const [commons, setCommons] = useState<Photo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    // Keyed by site in the parent, so this runs once per site with fresh state.
    let live = true;
    fetchCommons(site)
      .then((p) => live && setCommons(p))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [site]);

  const renders = useMemo<Photo[]>(() => {
    const imgs = empireImages(site);
    const note = lang === "ar" ? "نموذج مبدئي" : "Placeholder model";
    return [
      { src: imgs.hero, caption: site.interior.title },
      { src: imgs.artifacts, caption: site.artifacts.title },
      { src: imgs.floorPlan, caption: site.floorPlan.title },
    ].map((r) => ({ ...r, group: "renders", author: note, licence: "—", sourceUrl: "" }));
  }, [site, lang]);

  const curated = useMemo<Photo[]>(() => site.gallery.map((g) => ({ ...g, group: "curated" })), [site]);
  const all = useMemo(() => [...curated, ...(commons ?? []), ...renders], [curated, commons, renders]);

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + all.length) % all.length)),
    [all.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") step(lang === "ar" ? -1 : 1);
      else if (e.key === "ArrowLeft") step(lang === "ar" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, lang]);

  const indexOf = (p: Photo) => all.indexOf(p);
  const grid = (items: Photo[]) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <button
          key={p.src}
          onClick={() => setOpen(indexOf(p))}
          className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line-warm bg-paper-deep"
          aria-label={p.caption}
        >
          <img src={p.thumb ?? p.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          {p.group === "commons" && p.distanceM !== undefined && (
            <span className="absolute bottom-1 rounded bg-[rgba(30,24,20,0.7)] px-1.5 py-0.5 text-[0.62rem] text-white ltr:left-1 rtl:right-1">
              {p.distanceM < 1000 ? `${Math.round(p.distanceM)} m` : `${(p.distanceM / 1000).toFixed(1)} km`}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  const current = open === null ? null : all[open];

  return (
    <div className="atlas-scroll absolute inset-0 overflow-y-auto bg-paper px-4 pb-6 pt-16 sm:px-6">
      {curated.length > 0 && (
        <section className="mb-6">
          <h3 className="kicker mb-2">{t.gallery.curated}</h3>
          {grid(curated)}
        </section>
      )}

      <section className="mb-6">
        <h3 className="kicker mb-1">{t.gallery.commons}</h3>
        <p className="mb-2 text-[0.78rem] text-ink-muted">{t.gallery.commonsNote}</p>
        {commons === null && !failed && <p className="py-4 text-[0.85rem] italic text-ink-muted" aria-live="polite">{t.gallery.loading}</p>}
        {failed && <p className="py-4 text-[0.85rem] italic text-ink-muted">{t.gallery.failed}</p>}
        {commons && commons.length === 0 && <p className="py-4 text-[0.85rem] italic text-ink-muted">{t.gallery.none}</p>}
        {commons && commons.length > 0 && grid(commons)}
      </section>

      <section className="mb-6">
        <h3 className="kicker mb-2">{t.gallery.renders}</h3>
        {grid(renders)}
      </section>

      <section className="rounded-xl border border-line-warm bg-surface p-4">
        <h3 className="kicker mb-2">{t.gallery.more}</h3>
        <div className="flex flex-wrap gap-2">
          <a className="btn-outline !py-2 text-[0.82rem]" href={googleMapsUrl(site)} target="_blank" rel="noopener noreferrer">
            {t.gallery.googlePhotos}
            <ArrowRightIcon className="h-3.5 w-3.5 rtl:rotate-180" />
          </a>
          <a
            className="btn-outline !py-2 text-[0.82rem]"
            href={`https://www.mapillary.com/app/?lat=${site.geo.lat}&lng=${site.geo.lng}&z=15`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.gallery.streetLevel}
            <ArrowRightIcon className="h-3.5 w-3.5 rtl:rotate-180" />
          </a>
        </div>
        <p className="mt-3 text-[0.78rem] italic text-ink-muted">{t.gallery.contribute}</p>
      </section>

      {current && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[rgba(30,24,20,0.92)] p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={current.caption} onClick={() => setOpen(null)}>
          <div className="flex flex-none justify-end">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen(null)} aria-label={t.gallery.close}>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button className="absolute z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ltr:left-0 rtl:right-0" onClick={() => step(-1)} aria-label={t.gallery.prev}>
              <ArrowRightIcon className="h-5 w-5 rotate-180 rtl:rotate-0" />
            </button>
            <img src={current.src} alt={current.caption} className="max-h-full max-w-full rounded-lg object-contain" />
            <button className="absolute z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ltr:right-0 rtl:left-0" onClick={() => step(1)} aria-label={t.gallery.next}>
              <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
            </button>
          </div>
          <div className="mx-auto mt-3 max-w-[70ch] flex-none text-center text-white" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-[1.05rem]">{current.caption}</p>
            <p className="mt-1 text-[0.78rem] text-white/75">
              {current.group === "renders" ? (
                current.author
              ) : (
                <>
                  {t.gallery.by} {current.author} · {current.licence} ·{" "}
                  <a className="underline" href={current.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {current.group === "commons" ? "Wikimedia Commons" : "source"}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
