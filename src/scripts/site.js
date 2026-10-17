// -----------------------------------------
// ADDD — site behaviour
// -----------------------------------------
//
// The site's entry: how a document load opens, the wipe between pages, and
// the page lifecycle every component is mounted and torn down by. barba,
// Lenis, gsap and the GSAP plugins are globals, loaded from the CDN by
// classic scripts ahead of this module (see src/layouts/BaseLayout.astro),
// so they are always there when it runs.
//
//   ARRIVAL            how a document load opens: the intro or the wipe's reveal
//   PAGE TRANSITIONS   the wipe between pages, and a service card opening
//                      into its page (service-sheet.js)
//   PAGE LIFECYCLE     per-page init and teardown, wired to Barba's hooks
//   COMPONENTS         the registry: every component inside the Barba
//                      container, bound again on each page
//
// Around it: gsap-setup.js (the plugins and defaults), scroll.js (Lenis and
// how ScrollTrigger follows it), page.js (what the components share: motion,
// cleanups, when the page is in view), nav.js (the persistent nav), and one
// module per component.

import "./gsap-setup.js";
import { motion, coverPage, showPage, pageShown, registerPageCleanup, runPageCleanups, isSamePage } from "./page.js";
import { lenis, resetScroll, glideTo, anchorY } from "./scroll.js";
import { initNav } from "./nav.js";
import { initTextScramble } from "./text-scramble.js";
import { initHeroParallax, initDepthTransitions, initGlobalParallax, initProblemParallax, initBandSteps } from "./parallax.js";
import { initLineReveal, initHeroRise, initStackCards, LINE_REVEAL } from "./reveals.js";
import { initInsightSlider } from "./insight-slider.js";
import { initApproachSlides, initShutterScrollTransition } from "./approach-slides.js";
import { initFilterGroups } from "./filter-groups.js";
import { initColumnGrid } from "./column-grid.js";
import { initScrollbar } from "./scrollbar.js";
import { initLogoMorphLoader } from "./logo-morph-loader.js";
import { mountSlashField } from "./slash-field.js";
import { mountApproachStack } from "./approach-stack.js";
import { mountStickyTitle } from "./sticky-title.js";
import { mountWordCycle } from "./word-cycle.js";
import { mountFloatMarks } from "./float-marks.js";
import { mountIsoField, mountDotGrid } from "./dot-field.js";
import { mountServiceDiagram } from "./service-diagram.js";
import { mountCoinStack } from "./coin-stack.js";
import { mountTestimonialSlider } from "./testimonial-slider.js";
import { mountServiceTabs } from "./service-tabs.js";
import { mountLogoWallCycle } from "./logo-wall-cycle.js";
import { mountDotSnap } from "./dot-snap.js";
import { mountDotFit } from "./dot-fit.js";
import { mountDotLift } from "./dot-lift.js";
import { mountCellGrid } from "./cell-grid.js";
import { initServiceSheets, opensSheet, openSheet, sheetOpen, closeSheet, markSheetArrival } from "./service-sheet.js";


// The wipe panel lives outside the Barba container, so it is looked up once.
const wipe = {
  panel: document.querySelector("[data-transition-panel]"),
  logo: document.querySelector("[data-transition-logo]"),
  forms: [...document.querySelectorAll("[data-transition-logo-form]")],
  glyphs: [...document.querySelectorAll("[data-transition-logo-glyph]")],
};


// -----------------------------------------
// ARRIVAL
// -----------------------------------------
//
// Two animation systems, one rule: the logo intro opens the homepage when it
// is genuinely loaded — opened from outside the site, or reloaded — and
// every other arrival uses the wipe. The intro is built around the
// homepage's hero, which it plays out in, so it never opens any other page.
// Moving round the site, the way home by the nav's logo included, is
// Barba's wipe, and a link to the page already open scrolls it back to the
// top instead (isSamePage, page.js; the nav's handler, nav.js).
//
// The intro cannot simply belong to Barba's once(), because once() runs on
// every document load — and a visit has more of those than its first.
// Barba itself falls back to window.location.assign() when an internal
// navigation fails (a request error or timeout, an exception inside the
// transition, a history step taken mid-transition), and a back/forward can
// miss the bfcache. Any of those would replay the intro on what was, to the
// user, a move within the site.
//
// So each document load is classified before its first paint, by the inline
// script in the layout's <head>, which writes data-arrival on <html>:
//
//   "intro"   the homepage, reloaded or opened from outside the site — always
//             from the top
//   "reveal"  any other load: another page, a history step, a load from one
//             of the site's own pages, a reload of any page but the homepage
//
// The stylesheets act on it straight away — on a "reveal" the loader is never
// painted and the wipe panel starts out covering the page — and once() below
// plays whichever of the two the document was given.

function runArrival(next) {
  const root = document.documentElement;
  const arrival = root.dataset.arrival === "reveal" ? runReveal(next) : runIntro(next);
  return Promise.resolve(arrival).then(() => {
    showPage();
    delete root.dataset.arrival;
    reloadScroll = 0;
    warmFonts();
  });
}

// Every face the site's stylesheets declare, fetched in an idle moment once
// the first page is up. A browser fetches a face only when a page first sets
// text in it, so a page reached by the wipe could ask for faces the last one
// never used — and the panel would then wait for them (pageFontsLoaded), or
// the page split its headings again as they landed. Only the faces for the
// Latin script are fetched; the others' subsets stay for a page that needs
// them.
function warmFonts() {
  if (!document.fonts) return;
  // a range from U+0: the Latin subset's U+0000-00FF, or a face for every
  // script, U+0-10FFFF
  const latin = (face) => /(^|,\s*)U\+0+(-|,|$)/i.test(face.unicodeRange);
  const load = () => document.fonts.forEach((face) => {
    if (face.status === "unloaded" && latin(face)) face.load().catch(() => {});
  });
  if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 4000 });
  else setTimeout(load, 2000);
}

// A reload reveals the page where the reader left it, however far down —
// any page but the homepage, whose reload replays the intro from the top
// (readReloadScroll only answers a "reveal"). The scroll is noted as each document goes, against the
// page it belongs to — mid-navigation that is still the page being left, so
// a reload under the wipe opens the new page at its top — and only a reload
// of that same page reads it back. beforeEnter and resetPage then put the
// page there rather than at the top, while the panel still covers it.
const SCROLL_KEY = "addd:scroll";
let scrollPage = location.href;
let reloadScroll = readReloadScroll();

window.addEventListener("pagehide", () => {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ href: scrollPage, y: window.scrollY }));
  } catch (err) {}
});

// A step back or forward through the history comes back to where the
// reader left that page, as a reload does: each page's scroll is noted as
// it is left (beforeLeave), by its address, and a history step to it puts
// the page there (backScroll) once it is built, under the wipe. Any other
// navigation opens a page at its top. So a card opened from the
// homepage's deck, and Back, finds the deck where it was.
const leftAt = new Map();
let backScroll = 0;
// where the page now arriving is to open: a reload's place, a history
// step's, or its top
const arrivalScroll = () => reloadScroll || backScroll;

function readReloadScroll() {
  const nav = performance.getEntriesByType?.("navigation")[0];
  if (document.documentElement.dataset.arrival !== "reveal" || nav?.type !== "reload") return 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY));
    return saved && saved.href === location.href ? saved.y : 0;
  } catch (err) {
    return 0;
  }
}

// The second half of the internal wipe: the panel the stylesheet put over the
// page carries on up and off, and the page rises in behind it.
function runReveal(next) {
  removeLoader();
  // Take the covered state over from the stylesheet in GSAP's own terms.
  // Left to itself, GSAP reads the stylesheet's translateY(-100%) as a
  // fixed pixel offset and carries it into every later wipe.
  gsap.set(wipe.panel, { y: 0, yPercent: -100 });
  return runPageEnterAnimation(next);
}

// First-load logo intro: the Logo Morph Loader. The page
// is set up underneath it from the first frame, so the loader's background
// clears straight onto the settled page. Nested in this timeline so once()
// waits for all of it, which keeps Barba from starting a navigation while the
// intro is playing.
function runIntro(next) {
  const tl = gsap.timeline();

  tl.call(resetPage, [next], 0);

  // On the homepage the loader plays out in the hero's own field, so it is
  // handed the hero's band.
  const loader = initLogoMorphLoader(undefined, { hero: next.querySelector(".hero__media[data-slash-field]") });
  if (loader) tl.add(loader, 0);

  // The loader holds the page still under it — a wheel turned during the
  // intro would otherwise scroll the page it is about to reveal — and hands
  // scrolling back as its ground starts to lift, or once the hero has
  // settled.
  if (loader && "reveal" in loader.labels) {
    tl.call(() => lenis.stop(), null, 0);
    tl.call(() => lenis.start(), null, loader.labels.reveal);
  }

  // The homepage's intro decodes the name in the site's face, in a field
  // whose words are set out by their width in theirs: it waits a moment for
  // the webfonts, so neither is seen in the fallback first. The first paint
  // is already the field, so the wait is the field at rest.
  if (loader && "handover" in loader.labels) {
    tl.pause();
    const wait = new Promise(resolve => setTimeout(resolve, 900));
    Promise.race([document.fonts.ready, wait]).then(() => tl.play());
  }

  // Once it has played, the loader leaves the document for good. It sits
  // outside the Barba container, so anything that touched its styles later —
  // a clearProps, a stray tween — could otherwise bring it back at z-index 300.
  tl.call(removeLoader);

  return tl;
}

// The intro goes, whether it played or not. Tweens are killed first so
// nothing still queued can write style back onto a detached node.
function removeLoader() {
  document.querySelectorAll("[data-morph-loader]").forEach(loader => {
    gsap.killTweensOf([loader, ...loader.querySelectorAll("*")]);
    loader.remove();
  });
}


// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

// The wipe's logo: the name, A D D D, in the accent face, handed over letter
// by letter to the logo's forms, left to right — each letter pressed down
// onto its foot as its form rises out of the same spot, the next one
// starting before the last has settled. It runs on its own timeline rather
// than in leave(), which Barba waits on, so it never holds up the navigation.
// (settle: how long before the hand-over ends its last form is as good as at
// rest — power3.out has it within a hundredth of its rise by then — so the
// page can be built from there: see wipeSettled. Timed so it is still about
// as the panel arrives (WIPE.cover), and the page is built straight away:
// the covered window was the panel's 0.75s and then a third of a second
// more waiting on the logo, with nothing on screen to show for it.)
const WIPE_HANDOFF = { start: 0.12, stagger: 0.06, press: 0.25, rise: 0.38, overlap: 0.13, settle: 0.1 };
// The panel: up over the page (cover), and on up off the new one (uncover),
// from the moment it is built and settled (beat: none; it was a fifth of a
// second for every page: see pageSettled).
const WIPE = { cover: 0.65, beat: 0, uncover: 0.85, shown: 0.25 };
let wipeHandoff = null;

function playWipeHandoff() {
  wipeHandoff?.kill();
  gsap.killTweensOf([wipe.logo, ...wipe.forms, ...wipe.glyphs]);
  gsap.set(wipe.logo, { autoAlpha: 1 });
  wipeHandoff = gsap.timeline();
  wipe.glyphs.forEach((glyph, i) => {
    const form = wipe.forms[i];
    const foot = `${glyph.getAttribute("x")} ${glyph.getAttribute("y")}`;
    const at = WIPE_HANDOFF.start + i * WIPE_HANDOFF.stagger;
    gsap.set(glyph, { svgOrigin: foot, scaleY: 1, autoAlpha: 1 });
    gsap.set(form, { svgOrigin: foot, scaleY: 0, y: 0, autoAlpha: 1 });
    wipeHandoff.to(glyph, {
      scaleY: 0,
      autoAlpha: 0,
      duration: WIPE_HANDOFF.press,
      ease: "power2.in",
    }, at);
    wipeHandoff.to(form, {
      scaleY: 1,
      duration: WIPE_HANDOFF.rise,
      ease: "power3.out",
    }, at + WIPE_HANDOFF.press - WIPE_HANDOFF.overlap);
  });
}

// When the covered window is still: the wipe's logo has handed over to its
// forms and they are at rest, to the eye (or there is no hand-over under way).
function wipeSettled() {
  if (!wipeHandoff?.isActive()) return Promise.resolve();
  const still = wipeHandoff.duration() - WIPE_HANDOFF.settle;
  const left = still - wipeHandoff.time();
  if (left <= 0) return Promise.resolve();
  return new Promise(resolve => {
    wipeHandoff.call(resolve, null, still);
    // and in any case once its time is up, should it be cut short
    setTimeout(resolve, left * 1000 + 50);
  });
}

// When the webfonts the page has just asked for have arrived: at once if it
// asked for none, and never more than a second, so a slow font can only hold
// the panel up so long (the page then splits again when it lands, as before).
function pageFontsLoaded() {
  if (!document.fonts || document.fonts.status !== "loading") return Promise.resolve();
  return Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1000))]);
}

// The Tech Firms page is set in blue, and the panel that takes you there is
// blue too; every other page's is red.
function wipeTone(href) {
  try {
    return /\/tech-firms(\.html)?$/.test(new URL(href, location.href).pathname) ? "blue" : "red";
  } catch (err) {
    return "red";
  }
}

function runPageLeaveAnimation(current, nextHref) {
  // A navigation that starts while the panel is still settling from the last
  // one would otherwise fight the tweens already on it.
  gsap.killTweensOf(wipe.panel);
  wipe.panel.dataset.tone = wipeTone(nextHref);

  // (the page is taken out once the covered window is still: afterLeave)
  const tl = gsap.timeline();

  if (motion.reduced) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(wipe.panel, { autoAlpha: 1 }, 0);
  tl.fromTo(wipe.panel, { yPercent: 0 }, { yPercent: -100, duration: WIPE.cover }, 0);
  // the name rides in on the rising panel and is handed over to the forms as
  // the panel settles over the page
  playWipeHandoff();
  tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: WIPE.cover }, 0);

  // Barba awaits whatever leave() hands back, and a GSAP timeline is
  // thenable. Returning it is what holds the rest of the lifecycle — the
  // swap, the enter animation — until the panel has actually covered the
  // viewport. Without it Barba reads undefined and races straight on.
  return tl;
}

// Also the whole of a "reveal" arrival (see ARRIVAL), which starts from the
// covered state the stylesheet sets up rather than the one leave() ends on.
function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (motion.reduced) {
    // Immediate swap behavior if user prefers reduced motion. Set outside the
    // timeline so the container comes back in the same frame nextAdded hid it,
    // rather than a frame later. The panel is only ever up here on a reveal.
    gsap.set(next, { autoAlpha: 1 });
    showPage();
    gsap.set(wipe.panel, { autoAlpha: 0 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  // Barba no longer runs leave and enter together, so the panel leaves from
  // the moment the page is built under it (WIPE.beat: no further wait; the
  // forms are at rest by then, wipeSettled).
  tl.add("startEnter", WIPE.beat);

  // (a document load's reveal: the fields take their words out here; a
  // navigation has had them do it while its page was built: fieldsOut)
  if (!fieldsOut) fieldsEnter(next, tl.labels.startEnter);
  fieldsOut = false;

  tl.set(next, { autoAlpha: 1 }, "startEnter");
  // the panel a third of the way off: the page counts as seen
  tl.call(() => showPage(), null, `startEnter+=${WIPE.shown}`);

  tl.fromTo(wipe.panel, {
    yPercent: -100,
  }, {
    yPercent: -200,
    duration: WIPE.uncover,
    overwrite: "auto",
    immediateRender: false
  }, "startEnter");

  tl.set(wipe.panel, { autoAlpha: 0 }, ">");

  // The forms lift off ahead of the panel, left to right, as the name came
  // in, and are gone before the panel's edge has cleared the middle.
  tl.to(wipe.forms, {
    y: -6,
    duration: 0.35,
    ease: "power1.in",
    stagger: 0.04,
  }, "startEnter+=0.15");
  tl.to(wipe.logo, {
    autoAlpha: 0,
    duration: 0.3,
    ease: "power1.in",
  }, "startEnter+=0.22");

  tl.from(next, { y: "15vh", duration: WIPE.uncover }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// The homepage's field takes its words out while the page is still
// covered, and brings them back in from the foot of the band up as the wipe
// uncovers it — the band's lower edge is clear about a quarter of a second
// in, its top by about three quarters — so the hero is rebuilt as it
// arrives rather than showing empty slots until its words turn up (enter()
// in slash-field.js). Taking them out lays the field out again, a long
// frame, so a navigation does it while its page is built under the still
// panel (beforeEnter), not on the panel's first frame off it, where it was
// a visible hitch; start is when the panel starts to lift, from now.
let fieldsOut = false;
function fieldsEnter(next, start) {
  next.querySelectorAll("[data-slash-field]").forEach((el) => {
    el.slashField?.enter({ delay: start + 0.3, time: 0.45 });
  });
}

/* The enter animation tweens the container's y, and GSAP leaves the
   transform on the element when it finishes.
   Two things follow from that, and both are why the pinned sections
   were unreliable:

     - a transformed ancestor is the containing block for anything
       fixed inside it, so the transform clears here;
     - every measurement taken while the container is still mid-tween
       is out by however far it has left to travel — up to 15vh.

   So the page is measured before the enter animation moves it: on a
   navigation, in beforeEnter, under the still panel and once its fonts
   are in, which is final, and the page is not measured again as it
   appears (a whole page's measuring, landing just as it comes into
   view). The document's first page is measured before its fonts are
   sure to be in, so it is measured once more here, on the settled
   page. */
let pageMeasured = false;
function resetPage(container) {
  gsap.set(container, { clearProps: "position,top,left,right,transform" });

  // Lenis is measured first, so a reload's position is inside its limit.
  lenis.resize();
  resetScroll(arrivalScroll());
  lenis.start();
  if (!pageMeasured) ScrollTrigger.refresh();
  pageMeasured = false;
}


// -----------------------------------------
// PAGE LIFECYCLE
// -----------------------------------------

// Page-level components, in init order. Each is handed the Barba container it
// was found in, and is bound again on every navigation because that container
// is replaced.
const PAGE_COMPONENTS = [
  ["[data-slider]", initInsightSlider],
  ["[data-approach-slides-init]", initApproachSlides],
  ["[data-sticky-title=\"wrap\"]", initStickyTitle],
  ["[data-approach-stack]", initApproachStack],
  ["[data-coin-stack]", initCoinStack],
  ["[data-problem-parallax]", initProblemParallax],
  ['[data-parallax="trigger"]', initGlobalParallax],
  ["[data-testimonial-slider]", initTestimonialSlider],
  ["[data-shutter-scroll-transition]", initShutterScrollTransition],
  ["[data-accordion-init]", initAccordions],
  ["[data-split=\"heading\"]", initLineReveal],
  ["[data-hero-rise]", initHeroRise],
  ["[data-service-deck]", initServiceSheets],
  ["[data-stack-cards]", initStackCards],
  ["[data-service-tabs]", initServiceTabs],
  ["[data-iso-field]", initIsoFields],
  [".dot-grid", initDotGrids],
  ["[data-service-diagram]", initServiceDiagrams],
  ["[data-enquiry-offer]", initEnquiryOffer],
  ["[data-slash-field]", initSlashField],
  ["[data-word-cycle]", initWordCycle],
  ["[data-float-marks]", initFloatMarks],
  ["[data-logo-wall-cycle-init]", initLogoWallCycle],
  ["[data-dot-snap]", initDotSnap],
  ["[data-dot-fit]", initDotFit],
  ["[data-dot-lift]", initDotLift],
  ["[data-cell-grid]", initCellGrid],
  ["[data-filter-group]", initFilterGroups],
  ["[data-hero-parallax]", initHeroParallax],
  ["[data-depth]", initDepthTransitions],
  ["[data-band-steps]", initBandSteps],
  [".nav-link", initTextScramble],
];

function initPage(container) {
  PAGE_COMPONENTS.forEach(([selector, init]) => {
    if (!container.querySelector(selector)) return;

    // One broken component must not take the rest of the page down with it.
    // This runs inside a Barba hook, where the error would otherwise be
    // swallowed by Barba's muted logger and skip everything after it.
    try {
      init(container);
    } catch (err) {
      console.error(`${init.name} failed`, err);
    }
  });
}

// The page's name and theme, carried on <html> for the stylesheets (the
// homepage's frame in page-grid.css, a dark page's bar in nav.css). The
// layout renders them for the document's first page; a navigation swaps
// the container alone, so each new page sets them again here, before it is
// measured. They were read with :root:has(…) and body:has(…), which the
// browser evaluates again on every change to the document — and the hero's
// decoding words change it a dozen times a second.
function markPage(container) {
  const root = document.documentElement;
  const name = container.dataset.pageName;
  if (name) root.dataset.page = name.toLowerCase().replace(/\s+/g, "-");
  else delete root.dataset.page;
  root.dataset.theme = container.querySelector(".page--dark") ? "dark" : "light";
}


// Every scroll position a page's components work from (where a sticky
// panel takes up each of its routes, where a pin starts, where a click
// scrolls to) is measured on a ScrollTrigger refresh, and ScrollTrigger refreshes
// on its own only for a load or a resize. Anything that changes the page's
// height after that, without a resize, left every position below it wrong
// by the difference: the Studio's Visual editor rewriting a heading, an
// accordion opening, a late picture, a filter emptying a grid, the
// stylesheet hot-reloaded in development. A sticky section then changed
// its card or its route before the scroll had reached it. So the page's
// height is watched, and once a change in it has settled the page is
// measured again. A change of width is a resize, which ScrollTrigger
// already answers.
function watchPageHeight(container) {
  let width = container.offsetWidth;
  let height = container.offsetHeight;
  let timer = 0;
  const observer = new ResizeObserver(() => {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    if (w !== width) {
      width = w;
      height = h;
      return;
    }
    if (Math.abs(h - height) < 1) return;
    height = h;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!container.isConnected) return;
      lenis.resize();
      ScrollTrigger.refresh();
      // a refresh puts its pins back as they were, so this is the settled
      // height, and does not set the watch off again
      height = container.offsetHeight;
    }, 150);
  });
  observer.observe(container);
  registerPageCleanup(() => {
    observer.disconnect();
    clearTimeout(timer);
  });
}


// Hide the incoming container the instant Barba puts it in the DOM, so it is
// invisible for the whole covered stretch until enter reveals it. A bare
// gsap.set applies synchronously; a timeline's set() is a zero-duration tween
// that would not render until the ticker's next frame, leaving the browser a
// frame in which to paint the new page.
barba.hooks.nextAdded(data => {
  gsap.set(data.next.container, { autoAlpha: 0 });
});

// Everything expensive or jarring happens here, in the covered window between
// the panel arriving and the enter animation revealing anything: the scroll
// reset, page init and the one ScrollTrigger refresh. None of it is on screen,
// so none of it can read as a jump. On a document load Barba runs this ahead
// of once(), so the first page is set up the same way.
//
// Building a page is one long piece of main-thread work (the homepage's runs
// to a few hundred milliseconds: its splits, its fields drawn, its triggers
// measured), and no frame is drawn until it is done. So on a navigation it
// waits for the covered window to be still — the wipe's logo settled
// (playWipeHandoff runs on past the panel's own arrival) — and the build
// freezes nothing anyone can see. Then, still covered, it waits for any
// webfont the new page has just asked for, so its headings are split and
// its triggers measured once, in their own face, rather than split again
// and measured again as the panel leaves.
barba.hooks.beforeEnter(async data => {
  coverPage();
  lenis.stop();
  resetScroll();
  markPage(data.next.container);

  // The incoming container is in normal flow — the outgoing one is already
  // gone by this point — so the height hold has done its job and can be
  // released here rather than at the reveal.
  document.documentElement.style.minHeight = "";

  const navigating = data.trigger !== "barba";
  // a history step (Barba names it by a string; a click, by its link)
  backScroll = navigating && typeof data.trigger === "string" ? leftAt.get(data.next.url.href) || 0 : 0;
  if (navigating) await wipeSettled();

  // a card opening into this page has brought its hero's words in already
  markSheetArrival(data.next.container);
  initPage(data.next.container);

  if (navigating) await pageFontsLoaded();

  lenis.resize();
  ScrollTrigger.refresh();
  // a link to a place on this page (page.html#…), followed or loaded: the
  // page opens there, under the cover, as a history step's does. (Barba
  // drops the #fragment from its own address for the page, so it is read
  // off the link clicked, or the document's address on a load.)
  const hash = data.trigger instanceof Element && data.trigger.href ? new URL(data.trigger.href, location.href).hash : navigating ? "" : location.hash;
  if (!arrivalScroll() && hash) backScroll = anchorY(data.next.container, hash) || 0;
  pageMeasured = navigating;
  watchPageHeight(data.next.container);

  // A reload, or a step back or forward, goes back to where the reader was
  // (see ARRIVAL; leftAt), once the page has been built and measured from
  // the top.
  if (arrivalScroll()) resetScroll(arrivalScroll());

  // Shown under the still panel, so the browser paints it for the first
  // time here, where nothing moves, rather than on the panel's first frame
  // off it (a few hundred milliseconds for the homepage).
  if (navigating && !motion.reduced) {
    // (two frames from here to the panel lifting, and the settling)
    fieldsEnter(data.next.container, WIPE.beat + 0.03);
    fieldsOut = true;
    gsap.set(data.next.container, { autoAlpha: 1 });
    await framesDrawn(2);
    await pageSettled();
  }
});

// Once what a page's build set going has run its course: the main thread
// idle, or a quarter of a second at most. A light page is idle at once; the
// homepage has a few hundred milliseconds of its own still to come after
// it is built (pictures decoded, its observers answering their first
// changes), which, run as the cover lifts, were dropped frames in its
// first stretch. A fixed fifth of a second before every lift used to cover
// that, and held every page up for it.
function pageSettled() {
  if (!("requestIdleCallback" in window)) return new Promise((resolve) => setTimeout(resolve, 120));
  return new Promise((resolve) => requestIdleCallback(resolve, { timeout: 250 }));
}

// Once the browser has drawn n more frames.
function framesDrawn(n) {
  return new Promise(resolve => {
    const step = () => (--n > 0 ? requestAnimationFrame(step) : resolve());
    requestAnimationFrame(step);
  });
}

// The outgoing page is taken out and torn down only once the panel has
// covered it — leave() has resolved — and the covered window is still (the
// wipe's logo settled: see beforeEnter), and still before beforeEnter, so
// it is gone before the incoming page builds anything of its own. Teardown
// is not invisible: killing a pin drops its spacer, a revert puts split text
// and the shutter's rows back, the slider's cards return to the start. Run on
// the click, it all landed a frame before the wipe, as a jump in the page;
// run as the panel arrived, it held up the logo's hand-over.
//
// Then the safety net for anything the cleanups missed. Only triggers whose
// element has left the document are stale — never a blanket kill, which would
// take the incoming page's triggers with it the moment anything (a slow fetch,
// a future sync transition) puts beforeEnter ahead of this hook.
barba.hooks.afterLeave(async data => {
  await wipeSettled();
  data.current.container?.remove();
  runPageCleanups();

  ScrollTrigger.getAll().forEach(trigger => {
    const el = trigger.trigger || trigger.vars.trigger;
    if (!el || !document.contains(el)) trigger.kill();
  });
});

// The transition takes the page over as it is, the moment a link is clicked:
// the smooth scroll stops where it is rather than gliding on under the wipe,
// and the document height is held for the length of the transition. Without
// the hold the page briefly has no in-flow content — the outgoing container
// is removed and the incoming one is position:fixed — so the scrollbar drops
// out and returns, shifting the layout by its width twice.
barba.hooks.beforeLeave(() => {
  lenis.stop();
  leftAt.set(scrollPage, window.scrollY);

  const height = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  document.documentElement.style.minHeight = `${height}px`;
});

// Everything else already settled while the panel was covering; all that is
// left is handing scrolling back to the user. From here the scroll is this
// page's, for a reload to come back to.
barba.hooks.afterEnter(() => {
  scrollPage = location.href;
  backScroll = 0;
  lenis.start();
});

// A history step taken while a transition is still running — Back pressed
// twice, a trackpad swipe mid-wipe — is something Barba answers with
// window.location.assign(): a full document load in place of the wipe. Hold
// the step instead and replay it through Barba once the running transition
// has finished. Registered ahead of barba.init(), so it runs before Barba's
// own popstate listener and can stop it.
let heldHistoryStep = null;

window.addEventListener("popstate", event => {
  if (!barba.transitions.isRunning) return;
  event.stopImmediatePropagation();
  heldHistoryStep = event;
});

function replayHeldHistoryStep() {
  if (!heldHistoryStep) return;
  const event = heldHistoryStep;
  heldHistoryStep = null;
  // Barba only clears its running flag once the last hook has resolved.
  setTimeout(() => barba.go(location.href, "popstate", event));
}

barba.hooks.after(replayHeldHistoryStep);
barba.hooks.afterOnce(replayHeldHistoryStep);

// The nav, the Contact button, the layout grid and the scrollbar live
// outside the Barba container, so they survive every navigation and are
// wired up once per document load.
initNav();
initColumnGrid();
initScrollbar();

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
  // a link to the page already open is no navigation: the nav scrolls the
  // page back to its top instead (isSamePage, page.js)
  prevent: ({ href }) => isSamePage(href),
  // Not sync: leave runs to completion — the panel wipes up and covers the
  // viewport — before Barba removes the current container, adds the next one
  // and runs enter. The destination page is therefore never in the document
  // while any of it is visible, which is what makes the flash impossible
  // rather than merely hidden.
  transitions: [
    {
      name: "default",

      // Every document load — see ARRIVAL
      async once(data) {
        return runArrival(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.url.href);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    },
    {
      // A service card on the homepage's deck, clicked: the card opens into
      // its page in place of the wipe (service-sheet.js). leave() opens it
      // until it covers the screen; the page is then built under it as
      // under the wipe (the hooks above), and enter() hands over to the
      // page's own hero. Should the page not be there to open into, the
      // wipe goes as for any link. Not with reduced motion (opensSheet),
      // where the default's plain swap goes.
      name: "service-sheet",
      custom: ({ trigger }) => opensSheet(trigger),

      async leave(data) {
        if (await openSheet(data.trigger, data.next.url.href)) return;
        return runPageLeaveAnimation(data.current.container, data.next.url.href);
      },

      async enter(data) {
        if (!sheetOpen()) return runPageEnterAnimation(data.next.container);
        // the page's hero is under the sheet now, part for part, at the
        // top, its words as the sheet has them: the page is seen, the nav
        // comes back, and once the words are in scrolling is the reader's
        // again and the sheet goes
        gsap.set(data.next.container, { autoAlpha: 1 });
        showPage();
        return closeSheet(() => resetPage(data.next.container));
      }
    }
  ],
});


// -----------------------------------------
// COMPONENTS
// -----------------------------------------


/* ============================================================
   Approach stack — the homepage's steps (approach-stack.js)
   ============================================================
   Mounted per page from the registry and torn down with it, like
   the Slash Field. Lenis is handed in for the rail's velocity
   trail, which reads its speed.
   ============================================================ */
// The coins closing up into the logo after the approach (coin-stack.js).
function initCoinStack(container) {
  container.querySelectorAll("[data-coin-stack]").forEach((el) => {
    const stack = mountCoinStack(el, { still: document.documentElement.hasAttribute("data-draft") });
    registerPageCleanup(() => stack.destroy());
  });
}

function initApproachStack(container) {
  container.querySelectorAll("[data-approach-stack]").forEach((el) => {
    const stack = mountApproachStack(el, { lenis });
    registerPageCleanup(() => stack.destroy());
  });
}

/* ============================================================
   Word cycle — the homepage hero's cycling word (word-cycle.js)
   ============================================================
   Mounted per page from the registry and torn down with it.
   ============================================================ */
function initLogoWallCycle(container) {
  container.querySelectorAll("[data-logo-wall-cycle-init]").forEach((root) => {
    const wall = mountLogoWallCycle(root);
    registerPageCleanup(() => wall.destroy());
  });
}

function initDotSnap(container) {
  container.querySelectorAll("[data-dot-snap]").forEach((el) => {
    const snap = mountDotSnap(el);
    registerPageCleanup(() => snap.destroy());
  });
}

// A button sized and set on a field's dots: the approach statement's
// (dot-fit.js).
function initDotFit(container) {
  container.querySelectorAll("[data-dot-fit]").forEach((el) => {
    const fit = mountDotFit(el);
    registerPageCleanup(() => fit.destroy());
  });
}

// A field's dots lifted a little round what stands on it: the logo wall's
// logos (dot-lift.js).
// The approach statement's dots drawn as a grid of cells, and its
// photographs lit in them (cell-grid.js). After the dot grids, fits and
// lifts, so its zone is drawn over fields that are already set out.
function initCellGrid(container) {
  container.querySelectorAll("[data-cell-grid]").forEach((el) => {
    const grid = mountCellGrid(el);
    registerPageCleanup(() => grid.destroy());
  });
}

function initDotLift(container) {
  container.querySelectorAll("[data-dot-lift]").forEach((el) => {
    const lift = mountDotLift(el);
    registerPageCleanup(() => lift.destroy());
  });
}

// Small things drifting where a screen is empty: the software marks round
// the homepage's approach statement (float-marks.js).
function initFloatMarks(container) {
  container.querySelectorAll("[data-float-marks]").forEach((el) => {
    const marks = mountFloatMarks(el);
    registerPageCleanup(() => marks.destroy());
  });
}

function initWordCycle(container) {
  container.querySelectorAll("[data-word-cycle]").forEach((el) => {
    const cycle = mountWordCycle(el);
    registerPageCleanup(() => cycle.destroy());
  });
}

/* ============================================================
   Sticky title — the homepage's statement (sticky-title.js)
   ============================================================
   Mounted per page from the registry and torn down with it, like
   the approach stack after it.
   ============================================================ */
function initStickyTitle(container) {
  container.querySelectorAll('[data-sticky-title="wrap"]').forEach((el) => {
    const title = mountStickyTitle(el);
    registerPageCleanup(() => title.destroy());
  });
}


/* ============================================================
   Testimonial slider — the homepage's quotes (testimonial-slider.js)
   ============================================================
   Mounted per page from the registry and torn down with it; its
   first quote waits for the page to be uncovered, as the headings'
   line reveal does, and in the Studio's preview it is left unsplit.
   ============================================================ */
function initTestimonialSlider(container) {
  container.querySelectorAll("[data-testimonial-slider]").forEach((el) => {
    const slider = mountTestimonialSlider(el, {
      reducedMotion: motion.reduced,
      still: document.documentElement.hasAttribute("data-draft"),
      shown: pageShown,
      start: LINE_REVEAL.start,
    });
    registerPageCleanup(() => slider.destroy());
  });
}

// The routes as one panel that sticks while the scroll takes it through
// them (service-tabs.js). A position scrolls to its route on Lenis.
function initServiceTabs(container) {
  container.querySelectorAll("[data-service-tabs]").forEach((el) => {
    const tabs = mountServiceTabs(el, {
      reducedMotion: motion.reduced,
      // the site's one glide (scroll.js)
      scrollTo: (target) => glideTo(target),
    });
    registerPageCleanup(() => tabs.destroy());
  });
}


/* ============================================================
   Accordion — one delegated handler per accordion
   ============================================================
   A click on a toggle flips its item's data-accordion-status, and
   when the accordion carries data-accordion-close-siblings="true"
   every other open item in it is closed. The CSS does the
   expansion; aria-expanded is kept in step with the status.

   Each toggle is a real <button> inside the item's heading (see
   src/components/Accordion.astro), so Enter, Space and focus come
   from the browser, and the listener sits on an element inside the
   Barba container, so it goes with it and needs no cleanup.
   ============================================================ */
function initAccordions(container) {
  container.querySelectorAll("[data-accordion-init]").forEach((accordion) => {
    const closeSiblings = accordion.dataset.accordionCloseSiblings === "true";

    function setOpen(item, open) {
      item.dataset.accordionStatus = open ? "active" : "not-active";
      item.querySelector("[data-accordion-toggle]").setAttribute("aria-expanded", String(open));
    }

    accordion.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-accordion-toggle]");
      const item = toggle && toggle.closest("[data-accordion-status]");
      if (!item) return;

      const open = item.dataset.accordionStatus !== "active";
      setOpen(item, open);

      if (open && closeSiblings) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== item) setOpen(sibling, false);
        });
      }
    });
  });
}


/* ============================================================
   Service drawings — the routes' drawings in the service tabs
   ============================================================
   The drawings' two parts, mounted per page and torn down with it. */

// The grounds behind the drawings, the service tabs' diagrams and the
// approach cards' schematics: each a dotted axonometric lattice on the
// drawing's own axes (dot-field.js), mounted per page and torn down with it.
function initIsoFields(container) {
  container.querySelectorAll("[data-iso-field]").forEach((el) => {
    const field = mountIsoField(el);
    registerPageCleanup(() => field.destroy());
  });
}

// The site's fields of small square dots (.dot-grid: the approach band's,
// the cost cards'), each drawn on a canvas, every dot snapped to the
// screen's pixels (dot-field.js).
function initDotGrids(container) {
  container.querySelectorAll(".dot-grid").forEach((el) => {
    const grid = mountDotGrid(el);
    registerPageCleanup(() => grid.destroy());
  });
}

// The service tabs' diagrams, each moving by its own idea
// (service-diagram.js).
function initServiceDiagrams(container) {
  container.querySelectorAll("[data-service-diagram]").forEach((el) => {
    const diagram = mountServiceDiagram(el);
    registerPageCleanup(() => diagram.destroy());
  });
}

// The enquiry form, reached from an AEC Tech Partners button
// (contact.html?offer=…): the topic set to AEC Tech Partners and the
// message opened with the partnership the visitor chose.
function initEnquiryOffer(container) {
  const form = container.querySelector("[data-enquiry-offer]");
  const offer = new URLSearchParams(window.location.search).get("offer");
  if (!form || !offer) return;
  const topic = form.querySelector("#topic");
  if (topic) topic.value = "AEC Tech Partners";
  const message = form.querySelector("#msg");
  if (message && !message.value) {
    message.value = offer === "partnership"
      ? "I’d like to discuss a partnership with ADDD.\n\n"
      : `I’m interested in: ${offer}.\n\n`;
  }
}

/* ============================================================
   Slash field — the homepage hero's pattern (slash-field.js)
   ============================================================
   Mounted per page, like everything in the registry, and torn
   down with it. The page is built on its settled layout, under the
   still panel (beforeEnter), so the field is laid out once, as it
   mounts; a later change of its size is the field's own to answer
   (its ResizeObserver).
   ============================================================ */
function initSlashField(container) {
  container.querySelectorAll("[data-slash-field]").forEach((el) => {
    const field = mountSlashField(el);
    registerPageCleanup(() => field.destroy());
  });
}


