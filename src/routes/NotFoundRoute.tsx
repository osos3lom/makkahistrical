/** A real 404 rather than a silent redirect: a mistyped or stale site link
 *  should say so, not land the visitor on some other site. */

import { Link, useLocation, useParams } from "react-router";
import { useDocumentTitle, useLocaleChrome, preferredLanguage, isLanguage } from "@/hooks/use-locale-chrome";
import { useTranslation } from "@/i18n/translations";
import type { Language } from "@/types/i18n";

export default function NotFoundRoute() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  // Reached from inside a locale route (param set) or from the catch-all
  // (param unset); read the locale off the path before falling back.
  const fromPath = location.pathname.split("/").filter(Boolean)[0];
  const language: Language = isLanguage(lang) ? lang : isLanguage(fromPath) ? fromPath : preferredLanguage();
  const t = useTranslation(language);
  useLocaleChrome(language);
  useDocumentTitle(`${t.notFound.title} — ${t.siteTitle}`);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="max-w-[46ch] text-center">
        <h1 className="font-display text-[1.8rem] font-bold text-ink">{t.notFound.title}</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{t.notFound.body}</p>
        <Link to={`/${language}`} className="btn-primary mt-6 inline-flex">
          {t.notFound.goHome}
        </Link>
      </div>
    </main>
  );
}
