import { useEffect } from "react";

/** Freezes the page behind an open overlay.
 *
 *  Without this, iOS Safari happily scrolls the document under a dialog once
 *  the dialog's own content reaches its end — the modal appears to drift, and
 *  closing it leaves the visitor somewhere else on the page. The class also
 *  reserves the scrollbar's width so desktop layouts do not jump.
 *
 *  Counted rather than toggled: a modal can open on top of the search overlay,
 *  and the page must stay locked until the last one closes. */
let depth = 0;

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const scrollY = window.scrollY;
    depth += 1;
    body.classList.add("overlay-open");
    return () => {
      depth -= 1;
      if (depth === 0) {
        body.classList.remove("overlay-open");
        // `overflow: hidden` on the body does not move the scroll position on
        // its own, but restoring it defensively keeps the behaviour identical
        // across the browsers that do.
        window.scrollTo(0, scrollY);
      }
    };
  }, [active]);
}
