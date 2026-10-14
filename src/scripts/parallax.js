// -----------------------------------------
// ADDD — the scroll-scrubbed moves
// -----------------------------------------
//
// Every parallax on the site is the one scrubbed tween (scrubTween): the
// hero's exit and the footer's reveal (initParallaxCover), the global
// [data-parallax] blocks, and the cost cards' stair. Mounted per page from
// the registry in site.js. gsap and ScrollTrigger are the site's globals.

import { registerPageCleanup } from "./page.js";

/* ============================================================
   Problem parallax — the cost cards set out by the scroll
   ============================================================
   The three cards under the cost heading are never hidden; from 992px,
   where they stand in one row, the scroll sets them out like three blocks
   slotting together. As the row comes up the screen they stand as a
   stair, each a step (PROBLEM_STAIR.step) lower than the one before it,
   and close up into one level row as they rise, the last, lowest one
   seating last; level by the time the row is a little short of the
   screen's middle, they hold there, exactly on the grid (no offset at
   all), for a good stretch of scroll either side of it (hold); and as
   the row goes on up and out they part again into the stair reversed,
   the last card in now the first to lift, each a step higher than the
   one before it. Scrubbed with the scroll directly (no lag), so it runs
   back exactly on the way up. A transform only. Not under reduced
   motion, nor below 992px, where the cards stand one under another.
   ============================================================ */
// the step between two cards (rem), and the shares of the row's way
// across the screen spent closing up, held level, and parting
const PROBLEM_STAIR = { step: 2.25, close: 0.36, hold: 0.28, part: 0.36 };

export function initProblemParallax(container) {
  container.querySelectorAll("[data-problem-parallax]").forEach((grid) => {
    const cards = [...grid.children];
    const mm = gsap.matchMedia();
    mm.add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", () => {
      const step = () => PROBLEM_STAIR.step * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: grid,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(cards, { y: (i) => i * step() }, { y: 0, ease: "power2.out", duration: PROBLEM_STAIR.close })
        .to({}, { duration: PROBLEM_STAIR.hold })
        .to(cards, { y: (i) => -i * step(), ease: "power2.in", duration: PROBLEM_STAIR.part });
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(cards, { clearProps: "transform" });
      };
    });
    registerPageCleanup(() => mm.revert());
  });
}

/* ============================================================
   Global parallax — Osmo Supply's Global Parallax Setup
   ============================================================
   Its data attributes and tween as supplied: [data-parallax="trigger"]
   (and an optional [data-parallax="target"] child to move), -start and
   -end in percent, -direction, -scrub, -scroll-start, -scroll-end and
   -disable ("mobile", "mobileLandscape", "tablet"). Adapted only to run
   here: on the page's GSAP, ScrollTrigger and Lenis (wired up at the
   top), per Barba container, reverted with the page, and with a
   reduced-motion condition so the blocks stay put when asked.

   Used by the homepage's approach steps: each card moves as one
   piece, a few percent of its own height, at its own rate, so the
   staggered layout keeps its shape; a wrapper takes the transform,
   so the card's own entrance stays its own.
   ============================================================ */
export function initGlobalParallax(container) {
  const mm = gsap.matchMedia();

  mm.add({
    isMobile: "(max-width: 479px)",
    isMobileLandscape: "(max-width: 767px)",
    isTablet: "(max-width: 991px)",
    isDesktop: "(min-width: 992px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  }, (context) => {
    const { isMobile, isMobileLandscape, isTablet, reduceMotion } = context.conditions;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      container.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
        const disable = trigger.getAttribute("data-parallax-disable");

        if (
          (disable === "mobile" && isMobile) ||
          (disable === "mobileLandscape" && isMobileLandscape) ||
          (disable === "tablet" && isTablet)
        ) return;

        const target = trigger.querySelector('[data-parallax="target"]') || trigger;
        const direction = trigger.getAttribute("data-parallax-direction") || "vertical";
        const prop = direction === "horizontal" ? "xPercent" : "yPercent";

        const scrubAttr = trigger.getAttribute("data-parallax-scrub");
        const startAttr = trigger.getAttribute("data-parallax-start");
        const endAttr = trigger.getAttribute("data-parallax-end");

        const scrub = scrubAttr !== null ? parseFloat(scrubAttr) : true;
        const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
        const endVal = endAttr !== null ? parseFloat(endAttr) : -20;

        const scrollStart = `clamp(${trigger.getAttribute("data-parallax-scroll-start") || "top bottom"})`;
        const scrollEnd = `clamp(${trigger.getAttribute("data-parallax-scroll-end") || "bottom top"})`;

        scrubTween(target, { [prop]: startVal }, { [prop]: endVal }, {
          trigger,
          start: scrollStart,
          end: scrollEnd,
          scrub,
        });
      });
    });

    return () => ctx.revert();
  });

  registerPageCleanup(() => mm.revert());
}

/* ============================================================
   FOOTER PARALLAX
   ------------------------------------------------------------
   The footer sits in a clipping wrap and is revealed at a
   different rate to the page above it: the panel starts a
   quarter of its own height high inside the wrap and is scrubbed
   down to rest as the wrap travels from the bottom of the
   viewport to the top of it. A black scrim over the panel clears
   off on the same scrub, so the footer lifts out of shadow
   rather than simply sliding in.

   clamp() on the ScrollTrigger bounds keeps the reveal honest on
   a page short enough that the footer is already on screen at
   load — the start is pinned to the current scroll position
   instead of a point above it, so the panel is never caught
   mid-animation with nowhere left to scroll.

   The travel is a quarter of the panel, which on desktop — where
   the panel stands a viewport tall — is a quarter of the screen.
   Stacked on a phone or tablet the panel runs to two viewports or
   more, and a quarter of it would drag the newsletter several
   hundred pixels behind the scroll; there it travels the same
   quarter of the screen instead.
   ============================================================ */
export function initFooterParallax(container) {
  initParallaxCover(container, "footer");
}

/* ============================================================
   HERO PARALLAX — the footer's effect in reverse, on the way out
   ------------------------------------------------------------
   The homepage hero sits in a clipping wrap of its own
   ([data-hero-parallax], index.astro) and leaves at a different
   rate to the page below it: as the wrap travels from the top of
   the viewport until its bottom has left it, the hero is scrubbed
   down a quarter of its height inside the wrap and a black scrim
   over it comes on. The logos section keeps the scroll's own
   speed, so it closes over the hero, which falls back into shadow
   underneath it. The same travel and the same rules for a stacked
   layout as the footer, run backwards. The scrim stops at 25%
   rather than the footer's 50%: over the ink panel 50% black
   barely registers, but over the white hero it would end mid-grey.
   ============================================================ */
export function initHeroParallax(container) {
  initParallaxCover(container, "hero", { leaving: true, shade: 0.25 });
}

// The footer's reveal, and with leaving its reverse. name picks the
// attributes: [data-<name>-parallax] on the clipping wrap, -inner on the
// panel that travels inside it and -dark on the scrim over it; shade is the
// scrim's opacity at the far end from rest.
// How far a parallax panel travels inside its wrap, in percent of its own
// height: a quarter of it, or, stacked on a phone or tablet, where the
// panel runs to two screens or more, the same quarter of the screen. The
// nav reads it too, to leave the homepage at the hero's pace
// (initNavReveal). Read on each refresh, never per frame.
export function parallaxTravel(inner) {
  const stacked = window.matchMedia("(max-width: 991px)").matches;
  return stacked && inner.offsetHeight ? 25 * window.innerHeight / inner.offsetHeight : 25;
}

function initParallaxCover(container, name, { leaving = false, shade = 0.5 } = {}) {
  const wraps = container.querySelectorAll(`[data-${name}-parallax]`);

  const tweens = [];

  wraps.forEach(wrap => {
    const inner = wrap.querySelector(`[data-${name}-parallax-inner]`);
    const scrim = wrap.querySelector(`[data-${name}-parallax-dark]`);
    if (!inner && !scrim) return;

    const scroll = {
      trigger: wrap,
      // coming in, while the wrap rises from the foot of the viewport to
      // its top; going out, while it carries on until it has left
      start: leaving ? "clamp(top top)" : "clamp(top bottom)",
      end: leaving ? "clamp(bottom top)" : "clamp(top top)",
      scrub: true,
      // re-reads the travel below when the layout changes; both ends of
      // each tween are explicit, so re-recording them is always safe
      invalidateOnRefresh: true
    };

    // the panel's offset from rest: above it coming in, below it going out
    const travel = () => parallaxTravel(inner) * (leaving ? 1 : -1);

    // coming in, the panel settles out of its offset and its shadow; going
    // out, it runs the same way backwards, from rest into both
    const offset = [{ yPercent: travel }, { yPercent: 0 }];
    const fade = [{ opacity: shade }, { opacity: 0 }];
    if (leaving) {
      offset.reverse();
      fade.reverse();
    }

    // the panel and its scrim on the same scroll, so they move as one
    if (inner) tweens.push(scrubTween(inner, offset[0], offset[1], scroll));
    if (scrim) tweens.push(scrubTween(scrim, fade[0], fade[1], scroll));
  });

  registerPageCleanup(() => {
    tweens.forEach(tween => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  });
}

// The one scroll-scrubbed tween every parallax on the site is made of —
// the footer's reveal, the hero's exit and the global [data-parallax]
// blocks: from one set of values to another, linear, over a ScrollTrigger.
export function scrubTween(target, from, to, scrollTrigger) {
  return gsap.fromTo(target, from, { ...to, ease: "none", scrollTrigger });
}
