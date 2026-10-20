import { memo } from "react";
import type { Language } from "@/types/i18n";
import type { Empire, EmpireSection } from "@/types/empire";
import { ArrowRightIcon } from "./icons";

interface Props {
  empire: Empire;
  onOpen: (section: "interior" | "floorPlan" | "artifacts" | "dailyLife" | "geography") => void;
  lang: Language;
}

const CompassRose = () => (
  <svg viewBox="0 0 48 48" className="pointer-events-none absolute right-2.5 top-2.5 h-9 w-9 text-ink-soft/70 rtl:left-2.5 rtl:right-auto" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="24" cy="24" r="17" opacity="0.5" />
      <path d="M24 6v6M24 36v6M6 24h6M36 24h6" />
      <path d="M24 11l3 13-3 13-3-13 3-13z" fill="currentColor" stroke="none" opacity="0.75" />
      <path d="M11 24l13-3 13 3-13 3-13-3z" fill="currentColor" stroke="none" opacity="0.35" />
    </g>
  </svg>
);

export const BottomCards = memo(function BottomCards({ empire, onOpen, lang: _lang }: Props) {
  const cards: { key: "interior" | "floorPlan" | "artifacts" | "dailyLife" | "geography"; data: EmpireSection; compass?: boolean }[] = [
    { key: "interior", data: empire.interior },
    { key: "floorPlan", data: empire.floorPlan },
    { key: "artifacts", data: empire.artifacts },
    { key: "dailyLife", data: empire.dailyLife },
    { key: "geography", data: empire.geography, compass: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" data-panel="bottom">
      {cards.map(({ key, data, compass }) => (
        <article key={key} className="bottom-card atlas-card flex min-w-0 flex-col p-3">
          <div className="flex-none">
            <span className="kicker !text-[0.66rem]">{data.kicker}</span>
            <h3 className="font-display mt-0.5 truncate text-[1.02rem] font-bold leading-tight text-ink">{data.title}</h3>
          </div>
          <div className="relative mt-2 aspect-[16/9] w-full overflow-hidden rounded-lg border border-line-warm bg-paper-deep sm:aspect-[3/2]">
            <img
              src={data.image}
              alt={data.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
            {compass && <CompassRose />}
          </div>
          <button
            className="btn-outline w-full flex-none !mt-2.5 !justify-between !rounded-lg !border-line-warm !py-2.5 px-3 !text-[0.8rem]"
            onClick={() => onOpen(key)}
          >
            {data.cta}
            <ArrowRightIcon className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </article>
      ))}
    </div>
  );
});
