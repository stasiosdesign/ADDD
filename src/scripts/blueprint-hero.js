/* ============================================================
   The Technology Blueprint hero (BlueprintHero.astro): its figure and
   the ground it stands on
   ------------------------------------------------------------
   The figure (network-figure.js, a Hairline figure on the vendored
   kernel) is drawn into the svg in its stage, the stage its own pointer
   surface: the key under the pointer rises and lights its routes, and
   while the figure is on screen a signal runs along the routes into the
   hub (the kernel's one frame loop, asleep off screen; at rest under
   reduced motion).

   The hero's ground is the Technology Blueprint's own dash-dot lattice
   (dot-field.js, mountIsoField, data-iso-line="dash"), set out from the
   figure's ground origin at the figure's scale, a key's side to a cell,
   so the routes run along its lines wherever the figure is drawn. The
   origin is the figure's own (fitted when it mounts), so the lattice is
   mounted here, after it, not by the page's iso fields.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";
import { NETWORK } from "./network-figure.js";
import { mountIsoField } from "./dot-field.js";
import { registerPageCleanup } from "./page.js";

export function initBlueprintHero(container) {
  container.querySelectorAll("[data-blueprint-hero]").forEach((hero) => {
    const stage = hero.querySelector("[data-hairline]");
    const svg = stage?.querySelector(":scope > svg");
    const ground = hero.querySelector("[data-blueprint-ground]");
    if (!svg || hero.blueprintHero) return;
    hero.blueprintHero = true;

    HL.inject(document);
    svg.replaceChildren();
    const read = hero.querySelector("[data-hairline-live]") || { textContent: "" };
    const figure = NETWORK.mount({ stage, svg, read }, NETWORK.range[1]);
    svg.dataset.ground = figure.origin.map((v) => v.toFixed(2)).join(" ");
    const field = ground ? mountIsoField(ground) : null;

    registerPageCleanup(() => {
      field?.destroy();
      figure.destroy();
      hero.blueprintHero = false;
    });
  });
}
