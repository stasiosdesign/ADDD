// -----------------------------------------
// ADDD — the scroll-scrubbed moves
// -----------------------------------------
//
// Every parallax on the site is scrubbed straight off the scroll: the
// hero's exit (initParallaxCover), the two depth transitions — the
// testimonials over the routes, the footer from under the page
// (initDepthTransitions) — the global [data-parallax] blocks, the band's
// steps and the cost cards' stair. Mounted per page from the registry in
// site.js. gsap and ScrollTrigger are the site's globals.

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
   HERO PARALLAX — the page's way out of the hero
   ------------------------------------------------------------
   The homepage hero sits in a clipping wrap of its own
   ([data-hero-parallax], index.astro) and leaves at a different
   rate to the page below it: as the wrap travels from the top of
   the viewport until its bottom has left it, the hero is scrubbed
   down a quarter of its height inside the wrap (parallaxTravel)
   and a black scrim over it comes on. The logos section keeps the
   scroll's own speed, so it closes over the hero, which falls back
   into shadow underneath it. The scrim stops at 25%: over the
   white hero more would end mid-grey.
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
   comes up a little faster than the band, on a curve of its own
   (BAND_STEPS), so each column moves at its own rate and the steps keep
   changing shape the whole way up the screen, staying stepped and never
   closing up again; the set follows the scroll a moment behind, so it
   settles softly. Scrolled back, all of it runs back. One scrubbed
   timeline on one ScrollTrigger, a linear transform each, nothing
   measured per frame. Below 992px the grid has fewer columns, so fewer
   pieces (the stylesheet hides the rest; only the shown are moved). Not
   under reduced motion.
   ============================================================ */
// Per piece, left to right: how far it has gained on the band by the end
// of the way (a share of the screen's height; the way runs from the
// band's edge at the foot of the screen, the page at its top, to the
// edge at the top), and the curve it gains it on. The leads are small
// (a seventh of the screen at most) and step down gently from the left,
// and the curves are near even — the left pieces a little quicker to
// start, the right a little later — so no piece shoots up and then
// stands still while the rest catch up: every column is still moving as
// the band reaches the top, and the silhouette develops across the whole
// of the way rather than forming in the first part of it. The first five
// step down from the left, both in what they gain and in how early they
// gain it, so none ever passes the one to its left; the last rises again
// a little, to break the staircase.
const BAND_STEPS = {
  lead: [0.14, 0.12, 0.1, 0.075, 0.05, 0.07],
  ease: ["sine.out", "sine.out", "sine.inOut", "none", "sine.in", "sine.inOut"],
  // how far behind the scroll the whole set follows (s): one lag for all,
  // so the pieces settle softly and still never pass one another
  lag: 0.7,
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
   DEPTH TRANSITIONS — one section over another
   ------------------------------------------------------------
   Two meetings between sections share one language: every surface
   stays the screen's full width, edge to edge, at every point of
   the way, and the depth is in how things move — what stands on a
   section follows its edge a little behind, what lies underneath
   falls back and into shadow, and the layers inside a section part
   and meet again. The relationship is one of two:

     over   ([data-depth="over"]: none at present; the homepage's
            testimonials used it until 2026-10-16) the
            section comes up over the one before it. The section
            before ([data-depth-recede]) is held back as the edge
            climbs over it, its contents ([data-depth-recede-body])
            sinking a little smaller and all of it darkening, its
            ground staying whole; the testimonials' quotes follow
            their edge up from lower down.
     under  ([data-depth="under"]: the footer, and the homepage's
            testimonials under the service deck) the section is
            revealed from under the page. The page above keeps the
            scroll's own speed and uncovers it; the footer's contents
            settle out of a higher offset, the mark across its foot
            ([data-depth-layer]) from higher still, so it seems
            further down, and the shadow over it clears.

   The parts: the content ([data-depth-content]), which moves inside
   its section's clipping wrap, so the section's ground and edge stay
   put while what stands on them lags; any layer inside the content
   with a lag of its own ([data-depth-layer="<share of the screen>"]);
   and a shadow ([data-depth-shade]), over the footer, or over the
   section the testimonials come up over. How far the quotes lag is
   the wrap's --depth-lag (a share of the screen's height), which the
   stylesheet reads too: the testimonials' dotted rule runs up past
   the section's top by as much, into the wrap's clip, so it meets
   the section's edge at every point of the lag.

   One timeline on one ScrollTrigger per meeting, scrubbed straight off
   the scroll (Lenis smooths the scroll itself, so nothing lags in time
   and everything runs back exactly on the way up): from the wrap's top
   at the foot of the screen to its top at the top. Transforms and
   opacity only, every distance a share of the screen read on refresh
   and never per frame. The moving parts get a layer of their own only
   while the meeting is near (a second, bare ScrollTrigger a screen
   either side), not for the life of the page. A refresh measures the
   page with the section underneath at rest (refreshInit), so the
   routes' own triggers inside it are measured where they are, and the
   meeting is put back where the scroll has it once it is done. Not
   under reduced motion: everything stays at rest.
   ============================================================ */
// over: how far the section underneath is held back by the time it is
// covered (a share of the screen's height), what its contents shrink to,
// and how dark its shadow ends. under: the footer's shadow at the start;
// its contents start a quarter of the panel high (parallaxTravel), as the
// hero leaves.
const DEPTH = {
  over: { recede: 0.22, scale: 0.955, shade: 0.6 },
  under: { shade: 0.5 },
};

export function initDepthTransitions(container) {
  container.querySelectorAll("[data-depth]").forEach((wrap) => {
    const over = wrap.dataset.depth === "over";
    const content = wrap.querySelector(":scope > [data-depth-content]");
    const layers = content ? [...content.querySelectorAll("[data-depth-layer]")] : [];
    const below = over ? wrap.previousElementSibling : null;
    const under = below?.hasAttribute("data-depth-recede") ? below : null;
    // what sinks: the section's contents, its ground left whole behind
    // them (each body it names, the homepage deck's front card's; or the
    // section itself)
    const bodies = under ? [...under.querySelectorAll("[data-depth-recede-body]")] : [];
    const sinking = under ? (bodies.length ? bodies : [under]) : [];
    const shade = (over ? under : wrap)?.querySelector(":scope > [data-depth-shade]");
    const moving = [content, ...layers, ...sinking].filter(Boolean);

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const screen = () => window.innerHeight;
      const lag = () => parseFloat(getComputedStyle(wrap).getPropertyValue("--depth-lag")) || 0;
      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: wrap,
          // clamped, so on a page short enough to show the footer at load
          // the reveal starts where the page is, never part-way through
          start: over ? "top bottom" : "clamp(top bottom)",
          end: over ? "top top" : "clamp(top top)",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      if (over) {
        if (content) tl.fromTo(content, { y: () => lag() * screen() }, { y: 0 }, 0);
        if (sinking.length) tl.fromTo(sinking, { y: 0, scale: 1 }, { y: () => DEPTH.over.recede * screen(), scale: DEPTH.over.scale }, 0);
        if (shade) tl.fromTo(shade, { opacity: 0 }, { opacity: DEPTH.over.shade }, 0);
      } else {
        if (content) tl.fromTo(content, { yPercent: () => -parallaxTravel(content) }, { yPercent: 0 }, 0);
        if (shade) tl.fromTo(shade, { opacity: DEPTH.under.shade }, { opacity: 0 }, 0);
      }
      // each deeper layer from further back, the way its section moves
      layers.forEach((layer) => {
        const share = parseFloat(layer.dataset.depthLayer) || 0;
        tl.fromTo(layer, { y: () => share * screen() * (over ? 1 : -1) }, { y: 0 }, 0);
      });

      // a layer of its own for each moving part only while the meeting is
      // near; released (and the transforms' own layers with it) after
      const layered = (on) => {
        gsap.set(moving, { willChange: on ? "transform" : "auto" });
        if (shade) gsap.set(shade, { willChange: on ? "opacity" : "auto" });
      };
      const near = ScrollTrigger.create({
        trigger: wrap,
        start: over ? "top 200%" : "clamp(top 200%)",
        end: over ? "top -100%" : "clamp(top -100%)",
        onToggle: (self) => layered(self.isActive),
      });

      // measured at rest, put back after
      const rest = () => tl.progress(0);
      const resume = () => tl.progress(tl.scrollTrigger?.progress ?? 0);
      ScrollTrigger.addEventListener("refreshInit", rest);
      ScrollTrigger.addEventListener("refresh", resume);

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", rest);
        ScrollTrigger.removeEventListener("refresh", resume);
        near.kill();
        tl.scrollTrigger?.kill();
        tl.kill();
        layered(false);
        gsap.set([...moving, shade].filter(Boolean), { clearProps: "transform,opacity,willChange" });
      };
    });
    registerPageCleanup(() => mm.revert());
  });
}

// How far a parallax panel travels inside its wrap, in percent of its own
// height: a quarter of it, or, stacked on a phone or tablet, where the
// panel runs to two screens or more, the same quarter of the screen. The
// hero and the footer's contents travel it; the nav reads it too, to
// leave the homepage at the hero's pace (initNavReveal). Read on each
// refresh, never per frame.
export function parallaxTravel(inner) {
  const stacked = window.matchMedia("(max-width: 991px)").matches;
  return stacked && inner.offsetHeight ? 25 * window.innerHeight / inner.offsetHeight : 25;
}

// The hero's exit. name picks the attributes: [data-<name>-parallax] on the
// clipping wrap, -inner on the panel that travels inside it and -dark on
// the scrim over it; shade is the scrim's opacity at the far end from
// rest, and reach how many times the usual travel the panel goes; screen
// measures it in screen heights (a quarter of the screen, times reach)
// rather than the panel's own.
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

// A scroll-scrubbed tween — the hero's exit and the global [data-parallax]
// blocks: from one set of values to another, linear, over a ScrollTrigger.
export function scrubTween(target, from, to, scrollTrigger) {
  return gsap.fromTo(target, from, { ...to, ease: "none", scrollTrigger });
}
