/** The document-level chrome every route needs: direction, language, reduced
 *  motion, and a language toggle that keeps you where you are.
 *
 *  `EmpireAtlasApp` has always done this inline. Extracting it here rather than
 *  refactoring that component means the new corpus routes get identical
 *  behaviour without touching the working exhibit — the exhibit keeps its own
 *  copy until there is a reason to unify them.
 *
 *  One real change over the exhibit's version: `toggleLang` rewrites only the
 *  locale segment of the current path instead of navigating to `/${lang}`. On
 *  the exhibit that made no difference, because there was nothing below the
 *  locale. Now there is — switching language on
 *  `/en/characters/coastal-hijazi` has to land on
 *  `/ar/characters/coastal-hijazi`, not back at the home villa. */

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Language } from "@/types/i18n";

const LANGUAGES: Language[] = ["en", "ar"];

export const isLanguage = (value: string | undefined): value is Language =>
  !!value && (LANGUAGES as string[]).includes(value);

/** Last choice, then the browser's preference, then English — the same order
 *  the app has always used. Reads are guarded because Safari private mode
 *  throws on localStorage access. */
export function preferredLanguage(): Language {
  try {
    const stored = localStorage.getItem("atlas-lang");
    if (isLanguage(stored ?? undefined)) return stored as Language;
  } catch {
    /* no stored preference available; fall through */
  }
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar")) {
    return "ar";
  }
  return "en";
}

/** Swap the locale segment of a path, preserving everything after it along with
 *  any search string and hash. */
export function withLanguage(pathname: string, lang: Language): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${lang}`;
  if (isLanguage(parts[0])) parts[0] = lang;
  else parts.unshift(lang);
  return `/${parts.join("/")}`;
}

export function useLocaleChrome(lang: Language) {
  const navigate = useNavigate();
  const location = useLocation();
  /** Read once during the initial render rather than setting state from an
   *  effect, so the first paint already honours the preference and there is no
   *  motion flash before the effect runs. */
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(q.matches);
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("rm", reducedMotion);
  }, [reducedMotion]);

  const toggleLang = useCallback(() => {
    const next: Language = lang === "en" ? "ar" : "en";
    try {
      localStorage.setItem("atlas-lang", next);
    } catch {
      /* preference simply is not remembered */
    }
    navigate(withLanguage(location.pathname, next) + location.search + location.hash);
  }, [lang, navigate, location.pathname, location.search, location.hash]);

  return { reducedMotion, toggleLang };
}

/** Set the document title, restoring the previous one on unmount so a route
 *  that navigates away does not leave its title behind. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
