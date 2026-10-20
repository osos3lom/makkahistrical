import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router";
import type { Language } from "@/types/i18n";
import { isLanguage, preferredLanguage } from "@/hooks/use-locale-chrome";
import { SITES } from "@/data";

const AtlasApp = lazy(() => import("@/components/AtlasApp"));
const NotFoundRoute = lazy(() => import("@/routes/NotFoundRoute"));

/** Everything lives under the repository subpath on GitHub Pages, so the
 *  router's basename comes from Vite's `base` rather than being hard-coded. */
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Guards the locale segment for every route beneath it. An unknown locale
 *  redirects once, rather than each child having to re-check. */
function LocaleGate({ render }: { render: (lang: Language) => React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  if (!isLanguage(lang)) return <Navigate to={`/${preferredLanguage()}`} replace />;
  return <>{render(lang)}</>;
}

/** Shown only for the moment a route chunk is in flight; painted in the
 *  page's own parchment so it never flashes white on a phone. */
function RouteFallback() {
  return <div className="min-h-dvh bg-paper" aria-busy="true" />;
}

/** `/:lang` is the valley map and `/:lang/site/:siteId` a site. Both render
 *  the same `AtlasApp` from a single splat route, so moving between the map
 *  and a site — or between sites — keeps one component instance alive. */
function AtlasRoute({ lang }: { lang: Language }) {
  const { "*": rest = "" } = useParams();
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 0) return <AtlasApp lang={lang} />;
  if (parts.length === 2 && parts[0] === "site" && SITES.some((s) => s.id === parts[1]))
    return <AtlasApp lang={lang} siteId={parts[1]} />;
  return <NotFoundRoute />;
}

export function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${preferredLanguage()}`} replace />} />
          <Route path="/:lang/*" element={<LocaleGate render={(l) => <AtlasRoute lang={l} />} />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
