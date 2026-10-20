import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { CloseIcon } from "./icons";

interface ShellProps {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Shared parchment modal with backdrop blur, Esc-to-close and focus trap. */
export function ModalShell({ title, kicker, onClose, children, wide }: ShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>("button, [href], input, [tabindex]");
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="overlay-backdrop flex items-end justify-center p-2 pb-[max(0.5rem,var(--safe-bottom))] pt-[max(0.5rem,var(--safe-top))] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-panel atlas-scroll relative max-h-[92dvh] w-full overflow-y-auto sm:max-h-[88dvh] ${wide ? "max-w-[860px]" : "max-w-[620px]"} p-4 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-line-warm pb-3 sm:gap-4 sm:pb-4">
          <div className="min-w-0">
            {kicker && <div className="kicker">{kicker}</div>}
            <h2 className="font-display mt-1 text-[1.35rem] font-bold leading-tight text-ink sm:text-[1.7rem] sm:leading-none">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-line-warm bg-surface text-ink-muted transition-colors hover:border-line-strong hover:text-ink sm:h-9 sm:w-9"
            aria-label="Close"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
