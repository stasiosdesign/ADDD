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
   where they stand in one row, the scroll sets them at three depths, as
   if each moved at its own rate. As the row comes up the screen it is a
   stair, the white card leading, the black a step (PROBLEM_STAIR.step)
   behind it and the grey two; as the row rises the stair turns over in
   one continuous movement into its reverse, so as it goes up and out
   the grey card leads, the black follows and the white comes last. The
   turn has no rest: each card's offset runs from +i steps to -i on a
   sine curve, easing at either end of the row's way and fastest in the
   middle, so the row only passes through level on its way through.
   Scrubbed with the scroll directly (no lag; Lenis smooths the scroll
   itself), so it runs back exactly on the way up. One tween, a
   transform only. Not under reduced motion, nor below 992px, where the
   cards stand one under another.
   ============================================================ */
// the step between two cards (rem)
const PROBLEM_STAIR = { step: 4.5 };

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
      tl.fromTo(cards, { y: (i) => i * step() }, { y: (i) => -i * step(), ease: "sine.inOut" });
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

/* ============================================================
   BAND STEPS — the band after the hero, its top edge in pieces
   ------------------------------------------------------------
   The homepage's ink band comes up over the hero as ever (the hero
   falling back into its shadow: initHeroParallax), but its top edge in
   pieces, one per two Grid Columns ([data-band-steps], index.astro;
   styles.css "band steps"). At rest, with the page at the top, the edge
   is one line and nothing shows. From the first of the scroll each piece
   comes up faster than the band, on a curve of its own (BAND_STEPS: the
   left quick to start, the right late), so each column moves at its own
   rate and the steps keep changing shape, staying stepped the whole way
   and never closing up again; the set follows the scroll a moment
   behind, so it settles softly. Scrolled back, all of it runs back. One
   scrubbed timeline on one ScrollTrigger, a linear transform each,
   nothing measured per frame. Below 992px the grid has fewer
   columns, so fewer pieces (the stylesheet hides the rest; only the
   shown are moved). Not under reduced motion.
   ============================================================ */
// Per piece, left to right: how far it has gained on the band by the end
// of the way (a share of the screen's height; the way runs from the
// band's edge at the foot of the screen, the page at its top, to the
// edge at the top), and the curve it gains it on: the left pieces quick
// off the mark and easing in, the right ones slow to start and catching
// up late, so each column moves at a rate of its own and the steps keep
// changing shape as the scroll goes, rather than one shape growing.
// The first five step down from the left, both in what they gain and in
// how early they gain it, so none ever passes the one to its left; the
// last is left free to break the staircase.
const BAND_STEPS = {
  lead: [0.22, 0.18, 0.14, 0.085, 0.05, 0.1],
  ease: ["power1.out", "sine.out", "none", "power1.inOut", "power1.in", "sine.inOut"],
  // how far behind the scroll the whole set follows (s): one lag for all,
  // so the pieces settle softly and still never pass one another
  lag: 0.6,
};
export function initBandSteps(container) {
  container.querySelectorAll("[data-band-steps]").forEach((steps) => {
    const host = steps.parentElement;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const segs = [...steps.children].filter((el) => el.offsetWidth > 0);
      // A piece is as tall as the largest lead and waits below its own box
      // (yPercent 100: flush with the band). Raised by lead, it is at
      // 100 - lead / tallest of its height. (y: 0 takes off the
      // stylesheet's own resting translate, which GSAP would otherwise read
      // as pixels and keep under its yPercent.)
      const tallest = Math.max(...BAND_STEPS.lead);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: host, start: "top bottom", end: "top top", scrub: BAND_STEPS.lag, invalidateOnRefresh: true },
      });
      segs.forEach((seg, i) => {
        const k = i % BAND_STEPS.lead.length;
        const raised = 100 * (1 - BAND_STEPS.lead[k] / tallest);
        const ease = BAND_STEPS.ease[k] ?? "none";
        tl.fromTo(seg, { y: 0, yPercent: 100 }, { y: 0, yPercent: raised, duration: 1, ease }, 0);
        // its dots the other way, so they stay put on the band
        const dots = seg.firstElementChild;
        if (dots) tl.fromTo(dots, { yPercent: -100 }, { yPercent: -raised, duration: 1, ease }, 0);
      });
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(segs, { clearProps: "transform" });
        gsap.set(segs.map((seg) => seg.firstElementChild).filter(Boolean), { clearProps: "transform" });
      };
    });
    registerPageCleanup(() => mm.revert());
  });
}

/* ============================================================
   REVEAL PARALLAX — the footer's effect between two sections
   ------------------------------------------------------------
   The homepage's testimonials ([data-reveal-parallax], index.astro)
   come out from under the service tabs' band as the footer comes out
   from under the page: in a clipping wrap, from higher up and in
   shadow, settling as the wrap rises from the foot of the screen to
   its top. Plainer to see than the footer's: the section travels
   0.9 of a quarter of the screen (REVEAL.reach) and the scrim
   starts darker for the light ground it is over than the hero's.
   ============================================================ */
// (its travel measured off the screen, not the section: the testimonials
// change height as their quotes change, and a share of their own height
// would move them, controls and all, with every change)
const REVEAL = { reach: 0.9, shade: 0.24, screen: true };
export function initRevealParallax(container) {
  initParallaxCover(container, "reveal", REVEAL);
}

// The footer's reveal, and with leaving its reverse. name picks the
// attributes: [data-<name>-parallax] on the clipping wrap, -inner on the
// panel that travels inside it and -dark on the scrim over it; shade is the
// scrim's opacity at the far end from rest, and reach how many times the
// usual travel the panel goes; screen measures it in screen heights (a
// quarter of the screen, times reach) rather than the panel's own.
// How far a parallax panel travels inside its wrap, in percent of its own
// height: a quarter of it, or, stacked on a phone or tablet, where the
// panel runs to two screens or more, the same quarter of the screen. The
// nav reads it too, to leave the homepage at the hero's pace
// (initNavReveal). Read on each refresh, never per frame.
export function parallaxTravel(inner) {
  const stacked = window.matchMedia("(max-width: 991px)").matches;
  return stacked && inner.offsetHeight ? 25 * window.innerHeight / inner.offsetHeight : 25;
}

function initParallaxCover(container, name, { leaving = false, shade = 0.5, reach = 1, screen = false } = {}) {
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
    const travel = () => parallaxTravel(inner) * reach * (leaving ? 1 : -1);

    // coming in, the panel settles out of its offset and its shadow; going
    // out, it runs the same way backwards, from rest into both
    const offset = screen
      ? [{ y: () => (window.innerHeight / 4) * reach * (leaving ? 1 : -1) }, { y: 0 }]
      : [{ yPercent: travel }, { yPercent: 0 }];
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
