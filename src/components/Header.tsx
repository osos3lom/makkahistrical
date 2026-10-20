import { memo } from "react";
import { Link } from "react-router";
import {
  TempleIcon,
  CompassIcon,
  EmpiresIcon,
  LessonsIcon,
  NotesIcon,
  SearchIcon,
  MenuIcon,
} from "./icons";

import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";

interface HeaderProps {
  onSearchOpen: () => void;
  /** opens the drawer that carries the site list on small screens */
  onMenuOpen: () => void;
  onNav: (id: string) => void;
  activeNav: string;
  lang: Language;
  onToggleLang: () => void;
}

export const Header = memo(function Header({ onSearchOpen, onMenuOpen, onNav, activeNav, lang, onToggleLang }: HeaderProps) {
  const t = useTranslation(lang);

  const NAV = [
    { id: "map", label: t.nav.map, icon: CompassIcon },
    { id: "sites", label: t.nav.sites, icon: EmpiresIcon },
    { id: "lessons", label: t.nav.lessons, icon: LessonsIcon },
    { id: "timeline", label: t.nav.timeline, icon: NotesIcon },
  ];

  return (
    <header className="relative z-40 flex h-[58px] flex-none items-center gap-2 border-b border-line-warm bg-paper px-2.5 sm:h-[68px] sm:gap-4 sm:px-5">
      {/* the nav and the empire library live in a drawer below lg */}
      <button
        onClick={onMenuOpen}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-line-warm bg-surface text-slateblue transition-colors hover:border-line-strong sm:h-10 sm:w-10 xl:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Logo */}
      <Link to={`/${lang}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg sm:gap-2.5 xl:flex-initial">
        <TempleIcon className="h-7 w-7 flex-none text-terracotta sm:h-8 sm:w-8" aria-hidden />
        <div className="min-w-0 leading-none">
          <div className="font-display truncate text-[1.05rem] font-bold tracking-[0.01em] text-ink sm:text-[1.45rem]">{t.siteTitle}</div>
          <div className="font-display mt-1 hidden text-[0.82rem] font-medium italic text-terracotta sm:block">{t.siteSubtitle}</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="mx-4 hidden flex-none items-center gap-1 xl:flex" aria-label="Primary">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${activeNav === n.id ? "is-active" : ""}`}
            onClick={() => onNav(n.id)}
            aria-current={activeNav === n.id ? "page" : undefined}
          >
            <n.icon />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="hidden flex-1 xl:block" />

      {/* Language Switcher */}
      <button
        onClick={onToggleLang}
        className="flex h-11 flex-none items-center gap-1.5 rounded-full border border-terracotta/40 bg-surface px-2.5 py-1 text-[0.78rem] font-bold text-terracotta shadow-sm transition-all hover:border-terracotta hover:bg-paper sm:h-10 sm:px-3 sm:text-[0.82rem]"
        title={t.switchLang}
        aria-label={t.switchLang}
      >
        <span className="hidden text-sm sm:inline sm:text-base" aria-hidden>🌐</span>
        <span>{t.langName}</span>
      </button>

      {/* Search */}
      <button
        onClick={onSearchOpen}
        className="group hidden h-10 w-[min(260px,22vw)] items-center gap-2.5 rounded-full border border-line-warm bg-surface px-4 text-left transition-colors hover:border-line-strong md:flex rtl:text-right"
        aria-label={t.header.searchPlaceholder}
      >
        <SearchIcon className="h-4 w-4 flex-none text-ink-muted" />
        <span className="flex-1 truncate text-[0.84rem] italic text-ink-muted">{t.header.searchPlaceholder}</span>
        <kbd className="hidden rounded border border-line-warm bg-paper px-1.5 py-0.5 text-[0.62rem] font-medium text-ink-muted xl:block">{t.header.searchShortcut}</kbd>
      </button>
      {/* compact search (mobile) */}
      <button
        onClick={onSearchOpen}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line-warm bg-surface text-ink-muted transition-colors hover:border-line-strong sm:h-10 sm:w-10 md:hidden"
        aria-label={t.header.searchPlaceholder}
      >
        <SearchIcon className="h-4 w-4" />
      </button>

    </header>
  );
});
