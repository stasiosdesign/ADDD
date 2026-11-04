/* ============================================================
   The Resources dropdown's Free Tech Stacks preview (Nav.astro; the
   figure: stack-figure.js; styles: nav.css, "Resources tiles")
   ------------------------------------------------------------
   The Stack Diagnostic's row of tool cards in miniature, a Hairline figure
   drawn into the svg in the Free Tech Stacks box. Hovering anywhere over
   the box riffles the row: the card nearest the pointer, across the box,
   stands up and lifts and the rest lean away from it in turn; leaving the
   box lets them settle back. The kernel measures the pointer against the
   figure's own frame (the drawing's 400 × 320 units, wherever they fall on
   the screen: the svg is larger than the box, which crops the row as the
   page's screen crops its own, nav.css), while the box itself
   takes the pointer, so nothing in the box has to sit over the drawing to
   reach it. Clicks go through untouched: the box is the link to the Stack
   Diagnostic page.

   Mounted once, as the nav outlives every page. The kernel's one frame
   loop wakes only for the pointer and sleeps once the row has settled, and
   while the dropdown is closed (off screen) it does nothing at all. Under
   reduced motion the cards land at once.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";
import { STACK } from "./stack-figure.js";

// how far the row riffles: a little under the figure's own middle (its
// range runs 0.3 to 1), so the box answers without anything leaping
const AMOUNT = 0.45;
// the figure's frame, in its own units
const FRAME = [400, 320];

export function mountStackPreview(box) {
  const svg = box.querySelector("[data-stack-preview] > svg");
  const stage = svg?.parentElement;
  if (!svg || box.stackPreview) return null;
  box.stackPreview = true;
  HL.inject(document);

  // the pointer's surface: the whole box takes it; the kernel reads it
  // against where the figure's frame stands on the screen now (the svg's
  // own transform, the dropdown's drop-in included)
  const hover = {
    getBoundingClientRect() {
      const m = svg.getScreenCTM();
      if (!m) return box.getBoundingClientRect();
      return { left: m.e, top: m.f, width: FRAME[0] * m.a, height: FRAME[1] * m.d };
    },
    addEventListener: (...args) => box.addEventListener(...args),
    removeEventListener: (...args) => box.removeEventListener(...args),
    releasePointerCapture: (id) => box.releasePointerCapture?.(id),
  };
  const figure = STACK.mount({ stage, svg, read: { textContent: "" }, hover }, AMOUNT);
  return {
    destroy() {
      figure.destroy();
      box.stackPreview = false;
    },
  };
}
