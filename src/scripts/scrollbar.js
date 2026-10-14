/* ============================================================
   Scrollbar — the page's own (ScrollBar.astro, scrollbar.css)
   ------------------------------------------------------------
   The thumb runs down the track with the page's progress, from Lenis's
   own scroll event (the site's one scroll pipeline, scroll.js), as a
   transform; the track's length is read on resize, never on the scroll.
   It shows once someone scrolls, and goes a moment after they stop; and
   while it is hovered or dragged.

   Dragged, the thumb takes the page with it, a thumb's travel for the
   page's whole length; a press on the track sends the page to that
   point, smoothly. Both go through Lenis, so they stop when it is
   stopped (a page change, the open menu).
   ============================================================ */
import { lenis } from "./scroll.js";

// how long it stays after the page has stopped (ms)
const LINGER = 1200;

export function initScrollbar() {
  const bar = document.querySelector("[data-scrollbar]");
  const thumb = bar?.querySelector("[data-scrollbar-thumb]");
  if (!bar || !thumb) return;

  let travel = 0;
  let thumbH = 0;
  let idle = 0;
  let hovered = false;
  let drag = null;

  const measure = () => {
    thumbH = thumb.offsetHeight;
    travel = bar.offsetHeight - thumbH;
    place();
  };
  function place() {
    const progress = lenis.limit > 0 ? gsap.utils.clamp(0, 1, lenis.scroll / lenis.limit) : 0;
    thumb.style.transform = `translate3d(0, ${(progress * travel).toFixed(2)}px, 0)`;
  }
  const show = () => {
    bar.classList.add("is--shown");
    clearTimeout(idle);
    idle = setTimeout(() => {
      if (!hovered && !drag) bar.classList.remove("is--shown");
    }, LINGER);
  };

  // shown only when someone scrolls (Lenis moving the page, smoothly or by
  // the browser's own scroll), not when the page is set in place without
  // moving (a page arriving, a reload going back to where it was)
  lenis.on("scroll", () => {
    place();
    if (lenis.isScrolling && !lenis.isStopped) show();
  });
  window.addEventListener("resize", measure);

  bar.addEventListener("pointerenter", () => {
    hovered = true;
    bar.classList.add("is--shown");
  });
  bar.addEventListener("pointerleave", () => {
    hovered = false;
    show();
  });

  // the thumb dragged: the page follows it, straight away
  thumb.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    thumb.setPointerCapture(event.pointerId);
    drag = { y: event.clientY, scroll: lenis.scroll };
    bar.classList.add("is--dragging", "is--shown");
  });
  thumb.addEventListener("pointermove", (event) => {
    if (!drag || !travel) return;
    const to = drag.scroll + ((event.clientY - drag.y) / travel) * lenis.limit;
    lenis.scrollTo(gsap.utils.clamp(0, lenis.limit, to), { immediate: true });
  });
  const release = (event) => {
    if (!drag) return;
    drag = null;
    if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
    bar.classList.remove("is--dragging");
    show();
  };
  thumb.addEventListener("pointerup", release);
  thumb.addEventListener("pointercancel", release);

  // a press on the track: the page there, the thumb's middle under the
  // pointer
  bar.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !travel) return;
    const box = bar.getBoundingClientRect();
    const at = gsap.utils.clamp(0, 1, (event.clientY - box.top - thumbH / 2) / travel);
    lenis.scrollTo(at * lenis.limit);
  });

  measure();
}
