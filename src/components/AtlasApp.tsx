import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { SITES, empireById, getLocalizedEmpire, siteById, empireImages } from "@/data";
import type { Empire } from "@/types/empire";
import type { Language } from "@/types/i18n";
import { Banner } from "@/components/Banner";
import { Header } from "@/components/Header";
import { EmpireLibrary } from "@/components/EmpireLibrary";
import { InfoPanel } from "@/components/InfoPanel";
import { BottomCards } from "@/components/BottomCards";
import { SiteMap } from "@/components/SiteMap";
import { PhotoGallery } from "@/components/PhotoGallery";
import { LessonModal, QuizModal, ArtifactsModal, TimelineModal, SectionModal, SearchOverlay } from "@/components/modals";
import { ArrowRightIcon, CloseIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/translations";
import { useLocaleChrome } from "@/hooks/use-locale-chrome";
import { useScrollLock } from "@/hooks/use-scroll-lock";

/** three.js is by far the heaviest dependency; keeping the viewer in its own
 *  chunk lets the map paint before it arrives — and a visitor who only looks
 *  at the map never downloads it. */
const Viewer = lazy(() => import("@/components/Viewer").then((mod) => ({ default: mod.Viewer })));

/** The site view places its mini-map in the side rail at xl and under the
 *  stage below it. Only one is mounted: each map is a WebGL context. */
const WIDE = "(min-width: 1280px)";
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const q = window.matchMedia(WIDE);
      q.addEventListener("change", cb);
      return () => q.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE).matches,
  );
}

type ModalId = "lesson" | "quiz" | "artifacts" | "timeline" | "interior" | "floorPlan" | "dailyLife" | "geography" | null;

/** The whole atlas. With no `siteId` it is the valley map; with one, it is
 *  that site in 3D, with the map shrunk into the side rail. One component
 *  serves both so moving between them keeps the viewer engine alive. */
export default function AtlasApp({ lang, siteId }: { lang: Language; siteId?: string }) {
  const navigate = useNavigate();
  const t = useTranslation(lang);
  const wide = useWide();
  const { reducedMotion, toggleLang } = useLocaleChrome(lang);
  const site = siteById(siteId);

  const [rawViewerEmpire, setRawViewerEmpire] = useState<Empire>(() => site ?? empireById(""));
  const [rawPanelEmpire, setRawPanelEmpire] = useState<Empire>(() => site ?? empireById(""));
  const viewerEmpire = getLocalizedEmpire(rawViewerEmpire, lang);
  const panelEmpire = getLocalizedEmpire(rawPanelEmpire, lang);
  const sites = useMemo(() => SITES.map((s) => getLocalizedEmpire(s, lang)), [lang]);

  const [modal, setModal] = useState<ModalId>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(() => {
    try {
      return localStorage.getItem("atlas-credits") !== "dismissed";
    } catch {
      return true;
    }
  });
  const [focusHotspot, setFocusHotspot] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tab, setTab] = useState<"model" | "photos">("model");

  useScrollLock(menuOpen);

  /* The URL is the source of truth for which site is open. Between sites the
     viewer runs its turntable swap and reports back through onSwap for the
     panel. Arriving from the map there is no viewer yet, so both take the new
     site in the same render — adjusted during render rather than in an effect,
     so the viewer never mounts on the previous site first. */
  const [prevSiteId, setPrevSiteId] = useState(siteId);
  if (siteId !== prevSiteId) {
    setPrevSiteId(siteId);
    if (site) {
      setAnimating(false);
      setRawViewerEmpire(site);
      if (!prevSiteId) setRawPanelEmpire(site);
    }
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.title = site ? `${panelEmpire.name} — ${t.siteTitle}` : `${t.siteTitle} — ${t.map.title}`;
  }, [site, panelEmpire.name, t]);

  const openSite = useCallback(
    (id: string) => {
      setMenuOpen(false);
      // From the map, opening a site is a step forward the back button should
      // undo; switching between sites is not.
      navigate(`/${lang}/site/${id}`, { replace: !!siteId });
    },
    [navigate, lang, siteId],
  );
  const openMap = useCallback(() => {
    setMenuOpen(false);
    navigate(`/${lang}`);
  }, [navigate, lang]);

  const onSwap = useCallback((e: Empire) => setRawPanelEmpire(e), []);

  const dismissCredits = useCallback(() => {
    setCreditsOpen(false);
    try {
      localStorage.setItem("atlas-credits", "dismissed");
    } catch {
      /* not remembered */
    }
  }, []);

  /* Warm the model before the click: in the site view through the engine,
     on the map through the HTTP cache. */
  const prefetchRef = useRef<((e: Empire) => void) | null>(null);
  const warmed = useRef(new Set<string>());
  const prefetch = useCallback((id: string) => {
    const e = empireById(id);
    if (prefetchRef.current) prefetchRef.current(e);
    else if (!warmed.current.has(id)) {
      warmed.current.add(id);
      fetch(e.modelPath).catch(() => warmed.current.delete(id));
    }
  }, []);
  const onHover = useCallback(
    (id: string | null) => {
      setHoverId(id);
      if (id) prefetch(id);
    },
    [prefetch],
  );

  const onNav = useCallback(
    (nav: string) => {
      if (nav === "map") openMap();
      else if (nav === "sites") setSearchOpen(true);
      else if (nav === "lessons" || nav === "timeline") {
        // Lessons and timelines belong to a site; from the map, open one first.
        if (site) setModal(nav === "lessons" ? "lesson" : "timeline");
        else openSite(sites[sites.length - 1].id);
      }
    },
    [openMap, openSite, site, sites],
  );

  const onSearchPick = useCallback(
    (id: string, hotspotId?: string) => {
      setSearchOpen(false);
      if (!id) return;
      const switching = id !== siteId;
      if (switching) openSite(id);
      setTab("model");
      if (hotspotId) window.setTimeout(() => setFocusHotspot(hotspotId), switching ? 1800 : 50);
    },
    [openSite, siteId],
  );

  const preview = sites.find((s) => s.id === hoverId) ?? null;

  return (
    <div
      className="flex min-h-dvh flex-col bg-paper"
      data-credits={creditsOpen ? "open" : "closed"}
      style={{ "--banner-h": creditsOpen ? "40px" : "0px" } as React.CSSProperties}
    >
      {creditsOpen && <Banner onDismiss={dismissCredits} lang={lang} />}
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onMenuOpen={() => setMenuOpen(true)}
        onNav={onNav}
        activeNav={site ? "" : "map"}
        lang={lang}
        onToggleLang={toggleLang}
      />

      {!site ? (
        /* ═══ Map view ═══ */
        <div className="map-row flex flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 xl:flex-row xl:gap-4 xl:px-5">
          <aside className="order-2 flex min-w-0 flex-col gap-3 xl:order-1 xl:w-[360px] xl:flex-none">
            <div className="atlas-card p-4">
              <h1 className="font-display text-[1.7rem] font-bold leading-tight text-ink">{t.map.title}</h1>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{t.map.lead}</p>
            </div>
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1" aria-label={t.map.list}>
              {sites.map((s, i) => (
                <li key={s.id} className="min-w-0">
                  <button
                    className={`site-card w-full ${hoverId === s.id ? "is-hover" : ""}`}
                    onMouseEnter={() => onHover(s.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(s.id)}
                    onBlur={() => onHover(null)}
                    onClick={() => openSite(s.id)}
                  >
                    <img src={empireImages(s).thumbnail} alt="" className="h-[72px] w-[96px] flex-none rounded-lg border border-line-warm object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1 text-start">
                      <span className="flex items-center gap-2">
                        <span className="site-num">{i + 1}</span>
                        <span className="font-display truncate text-[1.08rem] font-bold text-ink">{s.name}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[0.78rem] text-ink-muted">{s.subtitle}</span>
                      <span className="mt-1 inline-block rounded-full border border-line-warm bg-paper-deep px-2 py-0.5 text-[0.66rem] font-medium text-terracotta-deep">{s.period}</span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 flex-none text-ink-muted rtl:rotate-180" />
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <main className="map-stage atlas-card relative order-1 min-h-[60dvh] flex-1 overflow-hidden xl:order-2 xl:min-h-0">
            <SiteMap
              sites={sites}
              hoverId={hoverId}
              onSelect={openSite}
              onHover={onHover}
              variant="full"
              reducedMotion={reducedMotion}
              lang={lang}
            />
            {preview && (
              <div className="pointer-events-none absolute bottom-3 z-10 hidden w-[300px] rounded-xl border border-line-warm bg-surface p-3 shadow-lift sm:block ltr:left-3 rtl:right-3" aria-hidden>
                <img src={empireImages(preview).hero} alt="" className="aspect-[3/2] w-full rounded-lg object-cover" />
                <p className="font-display mt-2 text-[1.1rem] font-bold text-ink">{preview.name}</p>
                <p className="text-[0.8rem] leading-snug text-ink-soft">{preview.subtitle}</p>
                <p className="mt-1.5 text-[0.72rem] font-semibold text-terracotta">{t.map.open} →</p>
              </div>
            )}
          </main>
        </div>
      ) : (
        /* ═══ Site view ═══ */
        <>
          <div className="stage-row flex gap-4 px-3 pb-3 pt-3 sm:px-4 xl:px-5">
            <aside className="hidden w-[268px] flex-none flex-col gap-3 xl:flex">
              <div className="atlas-card relative h-[230px] flex-none overflow-hidden">
                {wide && <SiteMap sites={sites} activeId={site.id} hoverId={hoverId} onSelect={openSite} onHover={onHover} variant="mini" reducedMotion={reducedMotion} lang={lang} />}
              </div>
              <div className="min-h-0 flex-1">
                <EmpireLibrary empires={sites} activeId={viewerEmpire.id} onSelect={openSite} onViewAll={openMap} onPrefetch={prefetch} lang={lang} />
              </div>
            </aside>

            <main className="relative flex min-w-0 flex-1">
              <Suspense fallback={<div className="atlas-card viewer-stage h-full w-full" aria-busy="true" />}>
                <Viewer
                  empire={viewerEmpire}
                  onSwap={onSwap}
                  reducedMotion={reducedMotion}
                  animating={animating}
                  focusHotspot={focusHotspot}
                  onFocusHandled={() => setFocusHotspot(null)}
                  onArtifacts={() => setModal("artifacts")}
                  onTimeline={() => setModal("timeline")}
                  onPrefetchReady={(fn) => {
                    prefetchRef.current = fn;
                  }}
                  lang={lang}
                />
              </Suspense>
              {tab === "photos" && (
                <div className="absolute inset-0 z-[45] overflow-hidden rounded-[18px] border border-line-warm">
                  <PhotoGallery key={panelEmpire.id} site={panelEmpire} lang={lang} />
                </div>
              )}
              <div className="absolute left-1/2 top-3 z-[50] flex -translate-x-1/2 rounded-full border border-line-warm bg-surface p-1 shadow-sm" role="tablist" aria-label={panelEmpire.name}>
                {(["model", "photos"] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={tab === k}
                    onClick={() => setTab(k)}
                    className={`rounded-full px-4 py-1.5 text-[0.8rem] font-semibold transition-colors ${tab === k ? "bg-terracotta text-white" : "text-ink-soft hover:text-ink"}`}
                  >
                    {t.tabs[k]}
                  </button>
                ))}
              </div>
            </main>

            <aside className="hidden w-[330px] flex-none xl:flex">
              <InfoPanel
                empire={panelEmpire}
                animating={animating}
                onLesson={() => setModal("lesson")}
                onToggleAnimate={() => setAnimating((v) => !v)}
                onArtifacts={() => setModal("artifacts")}
                onQuiz={() => setModal("quiz")}
                lang={lang}
              />
            </aside>
          </div>

          {/* Below xl the mini-map moves under the stage, with the panel. */}
          <section className="grid gap-3 px-3 pb-3 pt-1 sm:px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] xl:hidden" aria-label={panelEmpire.name}>
            <div className="atlas-card relative h-[260px] overflow-hidden md:sticky md:top-3 md:h-[340px] md:self-start">
              {!wide && <SiteMap sites={sites} activeId={site.id} hoverId={hoverId} onSelect={openSite} onHover={onHover} variant="mini" reducedMotion={reducedMotion} lang={lang} />}
            </div>
            <InfoPanel
              empire={panelEmpire}
              flow
              animating={animating}
              onLesson={() => setModal("lesson")}
              onToggleAnimate={() => setAnimating((v) => !v)}
              onArtifacts={() => setModal("artifacts")}
              onQuiz={() => setModal("quiz")}
              lang={lang}
            />
          </section>

          <section className="px-3 pb-[max(1.5rem,calc(var(--safe-bottom)+0.75rem))] pt-1 sm:px-4 xl:px-5" aria-label={panelEmpire.name}>
            <BottomCards empire={panelEmpire} onOpen={(s) => setModal(s)} lang={lang} />
          </section>
        </>
      )}

      {menuOpen && (
        <div className="overlay-backdrop xl:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="pad-safe-top pad-safe-bottom flex h-full w-[min(320px,86vw)] flex-col bg-paper shadow-lift"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex flex-none items-center justify-between border-b border-line-warm px-4 py-3">
              <span className="font-display text-[1.15rem] font-bold text-ink">{t.siteTitle}</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-line-warm text-ink-muted transition-colors hover:text-ink"
                aria-label={t.gallery.close}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 px-3 py-3">
              <EmpireLibrary empires={sites} activeId={site?.id ?? ""} onSelect={openSite} onViewAll={openMap} onPrefetch={prefetch} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {site && modal === "lesson" && <LessonModal empire={panelEmpire} onClose={() => setModal(null)} onQuiz={() => setModal("quiz")} lang={lang} />}
      {site && modal === "quiz" && <QuizModal key={panelEmpire.id} empire={panelEmpire} onClose={() => setModal(null)} lang={lang} />}
      {site && modal === "artifacts" && <ArtifactsModal empire={panelEmpire} onClose={() => setModal(null)} lang={lang} />}
      {site && modal === "timeline" && <TimelineModal empire={panelEmpire} onClose={() => setModal(null)} lang={lang} />}
      {site && (modal === "interior" || modal === "floorPlan" || modal === "dailyLife" || modal === "geography") && (
        <SectionModal empire={panelEmpire} section={modal} onClose={() => setModal(null)} lang={lang} />
      )}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onPick={onSearchPick} lang={lang} />}
    </div>
  );
}
