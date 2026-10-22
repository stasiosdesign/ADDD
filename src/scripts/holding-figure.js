// -----------------------------------------
// ADDD — the holding page's figure
// -----------------------------------------
//
// The tray of cards over the holding page's message (HoldingPage.astro):
// Hairline's riffle (@lucasmarkes/hairline), on the page's black, the card
// under the pointer standing up. Mounted for the page it is on, and taken
// down with it (registerPageCleanup), so a figure never outlives its page.

import { riffle } from "@lucasmarkes/hairline";
import { registerPageCleanup } from "./page.js";

export function initHoldingFigure(container) {
  container.querySelectorAll("[data-holding-figure]").forEach((el) => {
    const figure = riffle(el, { theme: "dark" });
    figure.update({ intensity: 0.8 });
    registerPageCleanup(() => figure.destroy());
  });
}
