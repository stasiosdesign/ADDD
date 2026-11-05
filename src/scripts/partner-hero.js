// -----------------------------------------
// ADDD — the AEC Tech Partners hero, held (2026-11-05)
// -----------------------------------------
//
// The hero (Hero.astro, "centred") is two screens: its words, then the
// positioning statement, over a hold (CSS sticky, styles.css) with the
// lattice and the plates. The page scrolls them itself, so nothing is held
// back or hurried; this adds, tied to the same scroll and nothing else:
//
//   the plates   settling a little lower on one another (each plate down
//                towards the bottom one by a share of its height, the
//                dotted guides shortening with them), from the first pixel
//                of scroll to the moment the hold lets go: never flat
//   the stacks   drawing a touch closer together (a slight scale), as the
//                statement arrives
//   the words    going out of focus as they go up (fading, a little
//                smaller)
//   the statement coming in as it rises (from faint to full)
//
// One ScrollTrigger over the hero (scrub: the timeline is wherever the
// scroll is, forwards or back, however fast). Transforms and opacity
// only, no layout read per frame. With reduced motion the plates stay as
// drawn and only the fades run.

import { motion, registerPageCleanup } from "./page.js";

// how far the plates settle: a share of each plate's height over the bottom
// one (0: as drawn, 1: flat), on a wide screen and on a phone
const SETTLE = 0.58;
const SETTLE_PHONE = 0.32;

export function initPartnerHero(container) {
  container.querySelectorAll("[data-partner-hero].has--statement").forEach((hero) => {
    if (hero.partnerHero) return;
    hero.partnerHero = true;
    const copy = hero.querySelector("[data-hero-copy]");
    const statement = hero.querySelector("[data-hero-statement]");
    const stacks = hero.querySelector(".iso-stacks");
    const plates = [...hero.querySelectorAll("[data-iso-rise]")].filter((p) => Number(p.dataset.isoRise) > 0);
    const guides = [...hero.querySelectorAll("[data-iso-guide]")];
    if (!copy || !statement) return;

    const settle = window.matchMedia("(max-width: 767px)").matches ? SETTLE_PHONE : SETTLE;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    if (!motion.reduced) {
      // each plate down by its share of its height (the drawing's units: an
      // svg element's transform is in its own units)
      plates.forEach((p) => tl.to(p, { y: Number(p.dataset.isoRise) * settle, duration: 1 }, 0));
      // the guides run from the bottom plate up: shortened from the bottom
      guides.forEach((g) => tl.to(g, { scaleY: 1 - settle, transformOrigin: "50% 100%", duration: 1 }, 0));
      if (stacks) tl.fromTo(stacks, { scale: 1 }, { scale: 0.965, duration: 0.6 }, 0.4);
    }
    tl.fromTo(copy, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.96, duration: 0.42, ease: "power1.in" }, 0);
    tl.fromTo(statement, { autoAlpha: 0.08 }, { autoAlpha: 1, duration: 0.45, ease: "power1.out" }, 0.22);

    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom bottom",
      animation: tl,
      scrub: true,
    });

    registerPageCleanup(() => {
      trigger.kill();
      tl.kill();
      hero.partnerHero = false;
    });
  });
}
