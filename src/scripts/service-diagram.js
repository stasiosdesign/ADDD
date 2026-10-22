/* ============================================================
   Service diagrams — the four services' drawings wherever they show:
   the homepage's service deck, each service page's hero and the
   service tabs (src/components/ServiceDiagram.astro)
   ------------------------------------------------------------
   Each is a Hairline figure (service-figures.js), drawn into the svg
   the markup gives it, the svg its own stage: it answers a pointer
   over it, and while it is on screen an unseen pointer walks its lap,
   which a real one takes over. On the deck the card's link lies over
   the drawing, so there the lap alone moves it. The kernel's one frame
   loop sleeps off screen, and under reduced motion the figure rests.

   A card opening into its page (service-sheet.js) hands the page a
   copy of its drawing as it stands; the page's own figure is drawn
   afresh over it.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";
import { SERVICE_FIGURES } from "./service-figures.js";

const FRAME_H = 256;

export function mountServiceDiagram(svg) {
  const figure = SERVICE_FIGURES[svg.dataset.serviceDiagram];
  if (!figure) return { destroy() {} };
  svg.replaceChildren();
  const read = { textContent: "" };
  const drawn = figure.draw({ stage: svg, svg, read }, figure.value, { oy: figure.oy, fh: FRAME_H });
  const walk = HL.tour(svg, figure.tour, null, { delay: 1500 });

  return {
    destroy() {
      walk.stop();
      drawn.destroy();
    },
  };
}
