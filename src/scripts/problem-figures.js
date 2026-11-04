// -----------------------------------------
// ADDD — the problem cards' figures
// -----------------------------------------
//
// The Workflow Workshop page's three problem cards (ProblemCard.astro) each
// draw a Hairline figure on their field of dots (@lucasmarkes/hairline),
// named by the host's data-problem-figure: turntable, format or plug. Each
// is mounted with the page and taken down with it (registerPageCleanup), so
// a figure never outlives its page, as the holding page's is
// (holding-figure.js). Their colours are the card's own field (styles.css,
// "Problem figures": the --hairline-* palette), so a figure's plates are
// the field it stands on.

import { turntable, format, plug } from "@lucasmarkes/hairline";
import { registerPageCleanup } from "./page.js";

const FIGURES = { turntable, format, plug };
// how strongly the figures answer the pointer (0 subtle, 1 strong)
const INTENSITY = 0.8;

export function initProblemFigures(container) {
  container.querySelectorAll("[data-problem-figure]").forEach((el) => {
    const draw = FIGURES[el.dataset.problemFigure];
    if (!draw || el.problemFigure) return;
    // the palette is the card's (CSS), so the theme only stops the
    // figure guessing one from the page
    const figure = draw(el, { intensity: INTENSITY, theme: "light", label: el.dataset.label || undefined });
    el.problemFigure = figure;
    registerPageCleanup(() => {
      figure.destroy();
      el.problemFigure = null;
    });
  });
}
