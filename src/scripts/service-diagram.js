/* ============================================================
   Service diagrams — the four services' drawings wherever they show:
   the homepage's service deck, each service page's hero and the
   service tabs (src/components/ServiceDiagram.astro)
   ------------------------------------------------------------
   Each is a Hairline figure (service-figures.js), drawn into the svg
   the markup gives it, the svg its own stage: it answers a pointer
   over it, and while it is on screen an unseen pointer walks its lap,
   which a real one takes over. The kernel's one frame loop sleeps off
   screen, and under reduced motion the figure rests.

   The homepage's deck draws its own four (deck-figures.js, marked
   data-figure-set="deck"), shown on its cards' light ground; its card's
   link lies over the drawing, so there the lap alone moves it.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";
import { SERVICE_FIGURES } from "./service-figures.js";
import { DECK_FIGURES, DECK_FRAME } from "./deck-figures.js";

const FRAME_H = 256;

export function mountServiceDiagram(svg) {
  const deck = svg.dataset.figureSet === "deck";
  const figure = (deck ? DECK_FIGURES : SERVICE_FIGURES)[svg.dataset.serviceDiagram];
  if (!figure) return { destroy() {} };
  svg.replaceChildren();
  const read = { textContent: "" };
  const drawn = deck
    ? figure.draw({ stage: svg, svg, read }, figure.value, DECK_FRAME)
    : figure.draw({ stage: svg, svg, read }, figure.value, { oy: figure.oy, fh: FRAME_H });
  const walk = HL.tour(svg, figure.tour, null, { delay: 1500 });

  return {
    destroy() {
      walk.stop();
      drawn.destroy();
    },
  };
}
