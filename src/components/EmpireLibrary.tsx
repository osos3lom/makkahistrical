import { memo, useRef } from "react";
import type { Empire } from "@/types/empire";
import { empireImages } from "@/data";
import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";
import { ArrowRightIcon, MapPinIcon } from "./icons";

interface Props {
  empires: Empire[];
  activeId: string;
  onSelect: (id: string) => void;
  /** returns to the valley map */
  onViewAll: () => void;
  /** called on hover/focus so the model is already in memory when clicked */
  onPrefetch?: (id: string) => void;
  lang: Language;
}

/** The four sites as a list, numbered to match the map pins. */
export const EmpireLibrary = memo(function EmpireLibrary({ empires, activeId, onSelect, onViewAll, onPrefetch, lang }: Props) {
  const t = useTranslation(lang);
  const listRef = useRef<HTMLDivElement>(null);

  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (idx + (e.key === "ArrowDown" ? 1 : -1) + empires.length) % empires.length;
      onSelect(empires[next].id);
      listRef.current?.querySelectorAll<HTMLElement>("[data-empire]")[next]?.focus();
    }
  };

  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-hidden" aria-label={t.library.title}>
      <div className="flex flex-none items-center justify-between px-1 pt-1">
        <span className="kicker !text-[0.78rem]">{t.library.title}</span>
        <MapPinIcon className="h-[18px] w-[18px] text-slateblue" aria-hidden />
      </div>

      <div ref={listRef} className="atlas-scroll -mx-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 pb-2" role="listbox" aria-label={t.library.title}>
        {empires.map((e, i) => {
          const active = e.id === activeId;
          return (
            <button
              key={e.id}
              data-empire
              role="option"
              aria-selected={active}
              tabIndex={active || (!activeId && i === 0) ? 0 : -1}
              onKeyDown={(ev) => onKey(ev, i)}
              onMouseEnter={() => onPrefetch?.(e.id)}
              onFocus={() => onPrefetch?.(e.id)}
              onClick={() => onSelect(e.id)}
              className={`empire-card ${active ? "is-active" : ""}`}
            >
              <img className="thumb" src={empireImages(e).thumbnail} alt="" loading="lazy" draggable={false} />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="flex items-center gap-1.5">
                  <span className="site-num !h-5 !w-5 !text-[0.66rem]">{i + 1}</span>
                  <span className="font-display block truncate text-[0.98rem] font-bold leading-[1.1] text-ink">{e.name}</span>
                </span>
                <span className="mt-1 block truncate text-[0.74rem] text-ink-muted">{e.period}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button onClick={onViewAll} className="btn-outline flex-none !justify-between px-4">
        <span className="font-display !text-[0.95rem] font-semibold">{t.library.viewAll}</span>
        <ArrowRightIcon className="h-4 w-4 rtl:rotate-180" />
      </button>
    </aside>
  );
});
