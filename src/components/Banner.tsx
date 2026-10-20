import { memo } from "react";
import type { Language } from "@/types/i18n";
import { useTranslation } from "@/i18n/translations";
import { CloseIcon } from "./icons";

interface Props {
  onDismiss: () => void;
  lang: Language;
}

/** One line above the header saying what the models are, dismissible for good. */
export const Banner = memo(function Banner({ onDismiss, lang }: Props) {
  const t = useTranslation(lang);
  return (
    <div
      className="credits-bar relative z-50 flex flex-none items-center justify-center gap-x-3 gap-y-1 border-b border-line-strong bg-cream px-12 text-center xl:h-10"
      role="region"
      aria-label={t.banner.tag}
    >
      <p className="line-clamp-2 text-[0.72rem] leading-snug text-ink-soft sm:line-clamp-none sm:text-[0.82rem]">
        <span className="font-semibold text-terracotta">{t.banner.tag} — </span>
        <span>{t.banner.text}</span>
      </p>

      <button
        onClick={onDismiss}
        className="touch-target absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink rtl:left-2.5 rtl:right-auto"
        aria-label={t.gallery.close}
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
