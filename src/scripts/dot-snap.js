/* ============================================================
   Dot snap — a block's top on a row of its field's dots
   ------------------------------------------------------------
   The 12-Column Grid places blocks across, and the dot fields are
   fitted to it (pitch and columns). Down the page nothing places a
   block, so its top falls wherever the content above leaves it, off
   the dots' rows. data-dot-snap="<the field's .dot-grid selector>"
   moves the block down (less than a pitch) so its top sits half its
   gap below a row of dots (--wall-gap, else nothing): a gap above it
   has the row down its middle, as the gaps across do.

   The move is --dot-snap-y, which the block's CSS applies as a
   translate, so it changes no layout. Measured on mount and on every
   ScrollTrigger refresh (the field's pitch is set then), never on
   scroll: the block and its field move together.
   ============================================================ */
export function mountDotSnap(el) {
  const field = el.closest("section, [data-barba='container']")?.querySelector(el.dataset.dotSnap);
  if (!field) return { destroy() {} };

  function snap() {
    const probe = field.querySelector(":scope > span");
    if (!probe) return;
    const p = getComputedStyle(probe);
    const pitch = parseFloat(p.width) / 64; // the probe is 64 pitches wide (dot-field.js)
    if (!(pitch > 1)) return;
    const shift = parseFloat(el.style.getPropertyValue("--dot-snap-y")) || 0;
    const half = (parseFloat(getComputedStyle(el).getPropertyValue("--wall-gap")) || 0) / 2;
    // the middle of a row of dots (--dot-y, the probe's top: dot-field.js)
    const row = field.getBoundingClientRect().top + parseFloat(p.top);
    const top = el.getBoundingClientRect().top - shift;
    const move = (((row + half - top) % pitch) + pitch) % pitch;
    el.style.setProperty("--dot-snap-y", `${move.toFixed(3)}px`);
  }

  snap();
  ScrollTrigger.addEventListener("refresh", snap);
  return {
    destroy() {
      ScrollTrigger.removeEventListener("refresh", snap);
      el.style.removeProperty("--dot-snap-y");
    },
  };
}
