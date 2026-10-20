import { memo } from "react";
import type { Empire } from "@/types/empire";
import { empireImages, googleMapsUrl } from "@/data";
import {
  LaurelIcon,
  PeriodIcon,
  MapPinIcon,
  MaterialsIcon,
  FeatureIcon,
  OccupantsIcon,
  ArrowRightIcon,
  PlayIcon,
  VaseIcon,
  QuizIcon,
} from "./icons";

import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";

const FACT_ICONS = { period: PeriodIcon, region: MapPinIcon, materials: MaterialsIcon, feature: FeatureIcon, occupants: OccupantsIcon };

interface Props {
  empire: Empire;
  /** Laid out in the page flow rather than in the fixed-height desktop rail:
   *  the panel takes whatever height its content needs and scrolls with the
   *  page instead of inside itself. */
  flow?: boolean;
  animating: boolean;
  onLesson: () => void;
  onToggleAnimate: () => void;
  onArtifacts: () => void;
  onQuiz: () => void;
  lang: Language;
}

export const InfoPanel = memo(function InfoPanel({ empire, flow = false, animating, onLesson, onToggleAnimate, onArtifacts, onQuiz, lang }: Props) {
  const t = useTranslation(lang);
  return (
    <div
      className={`atlas-card flex w-full flex-col overflow-hidden ${flow ? "" : "h-full"}`}
      data-panel="info"
    >
      <div className={flow ? "px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5" : "atlas-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5"}>
        {/* header */}
        <div className="flex items-center justify-between">
          <span className="kicker flex items-center gap-2">
            <LaurelIcon className="h-5 w-5 text-gold" aria-hidden />
            {t.infoPanel.tabs.facts}
          </span>
          <span className="rounded-full border border-[#e7c3ad] bg-[#fdf1e7] px-2 py-0.5 text-[0.66rem] font-semibold text-terracotta-deep">
            {t.infoPanel.reconstruction}
          </span>
        </div>

        <h2 className="font-display mt-2 text-[1.6rem] font-bold leading-tight text-ink sm:text-[1.9rem] sm:leading-none">{empire.name}</h2>
        <p className="font-display mt-1.5 text-[1.02rem] font-medium italic text-terracotta">{empire.subtitle}</p>

        {/* Stacked in the narrow desktop rail */}
        <div className={flow ? "sm:flex sm:items-start sm:gap-6" : ""}>
          <div
            className={`mt-4 overflow-hidden rounded-xl border border-line-warm bg-paper-deep ${
              flow ? "sm:w-[44%] sm:flex-none" : ""
            }`}
          >
            {/* The photoreal render is ~850KB against the massing image's 41KB,
                so it is served only where the screen is big enough to do it
                justice. A phone never downloads it: the `media` query is
                evaluated before the request is made. A style without an
                `ultraHero` (or any browser without <picture>) falls through
                to the flat render, which is the element's own `src`. */}
            <picture>
              {empire.ultraHero && (
                <source media="(min-width: 768px)" srcSet={empire.ultraHero} />
              )}
              <img
                src={empireImages(empire).hero}
                alt={empire.dwelling}
                className="block h-auto w-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </picture>
          </div>

          <div className={flow ? "min-w-0 sm:flex-1" : ""}>
            <p className="font-display mt-4 text-[1.06rem] leading-[1.45] text-ink-soft">{empire.description}</p>

            {/* key facts */}
            <h3 className="kicker mt-5">{t.infoPanel.tabs.facts}</h3>
            <dl className="mt-2 divide-y divide-line-warm/70">
              {empire.facts.map((f) => {
                const Icon = FACT_ICONS[f.icon];
                return (
                  <div key={f.label} className="flex items-center justify-between gap-3 py-[9px]">
                    <dt className="flex flex-none items-center gap-2.5 text-[0.86rem] font-medium text-ink-soft">
                      <Icon className="h-[17px] w-[17px] flex-none text-terracotta" aria-hidden />
                      {f.label}
                    </dt>
                    <dd className="min-w-0 max-w-[52%] text-right text-[0.85rem] leading-snug text-ink rtl:text-left">{f.value}</dd>
                  </div>
                );
              })}
            </dl>

            <a
              href={googleMapsUrl(empire)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line-warm bg-paper-deep px-3 py-2 text-[0.8rem] text-ink-soft transition-colors hover:text-ink"
            >
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 flex-none text-terracotta" aria-hidden />
                <span dir="ltr">
                  {empire.geo.lat.toFixed(4)}, {empire.geo.lng.toFixed(4)}
                </span>
              </span>
              <span className="font-medium text-terracotta">{t.infoPanel.openInMaps}</span>
            </a>

            <h3 className="kicker mt-5">{t.infoPanel.sources}</h3>
            <ul className="mt-2 space-y-1.5">
              {empire.sources.map((s) => (
                <li key={s.url} className="text-[0.78rem] leading-snug">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-ink" dir="auto">
                    {s.title}
                  </a>{" "}
                  <span className={`whitespace-nowrap text-[0.68rem] font-medium ${s.confidence === "low" ? "text-terracotta" : "text-ink-muted"}`}>
                    · {t.infoPanel.confidence[s.confidence]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex-none space-y-2 border-t border-line-warm/70 px-4 pb-4 pt-3">
        <button className="btn-primary w-full !justify-between !py-2.5" onClick={onLesson}>
          <span className="px-1">{t.bottomCards.interior.cta}</span>
          <ArrowRightIcon className="h-4 w-4 rtl:rotate-180" />
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className={`btn-outline !py-2.5 ${animating ? "!border-terracotta-soft !text-terracotta-deep !bg-[#fdf1e7]" : ""}`} onClick={onToggleAnimate} aria-pressed={animating}>
            <PlayIcon className="h-4 w-4" />
            {animating ? t.infoPanel.stop : t.infoPanel.animate}
          </button>
          <button className="btn-outline !py-2.5" onClick={onArtifacts}>
            <VaseIcon className="h-4 w-4" />
            {t.bottomCards.artifacts.kicker}
          </button>
        </div>
        <button className="btn-outline w-full !py-2.5" onClick={onQuiz}>
          <QuizIcon className="h-4 w-4" />
          {t.modals.quiz.kicker}
        </button>
      </div>
    </div>
  );
});
