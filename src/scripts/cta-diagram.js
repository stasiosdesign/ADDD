/* ============================================================
   The closing call's diagram (ClosingCta.astro): held to the dots
   ------------------------------------------------------------
   Held to the dots: the drawing is set out on the section's field of dots,
   its bus along a row. After a light FAQ the field carries on that
   section's lattice (dot-field.js, data-dot-follow), so where its rows fall
   depends on how tall the FAQ is; each time the field is drawn it says
   where its lattice fell (dotgrid:set), and the drawing is moved up or
   down by at most half a step to put its bus on the nearest row
   (--cta-snap; styles.css). The first time at once; after that (an answer
   opening above, the window resized) once the field has settled, gliding.

   Not drawn in (2026-11-04, at the user's word): it used to settle its
   mark, draw its lines and bring up its rings over about two seconds once
   the call was well up the screen, and a fast scroll went past it before
   anything had appeared. Now everything in the call is simply there, as
   soon as it is on the screen; only the snap to the dots glides.
   ============================================================ */
import { registerPageCleanup } from "./page.js";

// how long the field must be still before the drawing glides to its row
const SETTLE_MS = 140;

export function initCtaDiagram(container) {
  container.querySelectorAll("[data-cta-diagram]").forEach((svg) => {
    if (svg.ctaDiagram) return;
    svg.ctaDiagram = true;
    const dots = svg.closest("section")?.querySelector(":scope > .dot-grid");
    const bus = Number(svg.dataset.ctaBus) || 0;
    const viewHeight = svg.viewBox.baseVal.height;

    // ---- held to the dots ------------------------------------------------
    let snapped = false;
    let settle = 0;
    const snapTo = ({ pitch, y }) => {
      if (!(pitch > 0) || !viewHeight) return;
      // a unit on the screen, and the bus's place in the field's box (the
      // section's: the field covers it), unmoved
      const u = (svg.clientHeight || svg.getBoundingClientRect().height) / viewHeight;
      let d = (((y - bus * u) % pitch) + pitch) % pitch;
      if (d > pitch / 2) d -= pitch;
      svg.style.setProperty("--cta-snap", `${d.toFixed(2)}px`);
    };
    const onSet = (e) => {
      clearTimeout(settle);
      if (!snapped) {
        snapped = true;
        snapTo(e.detail);
        return;
      }
      settle = setTimeout(() => {
        svg.classList.add("is--snapping");
        snapTo(e.detail);
      }, SETTLE_MS);
    };
    dots?.addEventListener("dotgrid:set", onSet);
    if (dots?.dotGrid?.lattice) onSet({ detail: dots.dotGrid.lattice });

    registerPageCleanup(() => {
      clearTimeout(settle);
      dots?.removeEventListener("dotgrid:set", onSet);
      svg.ctaDiagram = false;
    });
  });
}
