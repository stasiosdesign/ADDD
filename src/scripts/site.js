// -----------------------------------------
// ADDD — site behaviour
// -----------------------------------------
//
// One module for the whole site. barba, Lenis, gsap and the GSAP plugins are
// globals, loaded from the CDN by classic scripts ahead of this module (see
// src/layouts/BaseLayout.astro), so they are always there when it runs.
//
//   ARRIVAL            how a document load opens: the intro or the wipe's reveal
//   PAGE TRANSITIONS   the wipe between pages
//   PAGE LIFECYCLE     per-page init and teardown, wired to Barba's hooks
//   COMPONENTS         the persistent nav and Contact button, then everything
//                      that lives inside the Barba container

import { initWavyMarquee } from "./wavy-marquee.js";
import { initColumnGrid } from "./column-grid.js";
import { initLogoMorphLoader } from "./logo-morph-loader.js";
import { LETTER_COUNT, morphPath, getMorphEase } from "./logo-morph.js";
import { mountSlashField } from "./slash-field.js";
import { mountApproachStack } from "./approach-stack.js";
import { mountStickyTitle } from "./sticky-title.js";
import { mountWordCycle } from "./word-cycle.js";
import { mountIsoField, mountDotGrid } from "./dot-field.js";
import { mountServiceDiagram } from "./service-diagram.js";
import { mountCoinStack } from "./coin-stack.js";
import { mountTestimonialSlider } from "./testimonial-slider.js";
import { mountServiceTabs } from "./service-tabs.js";

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, Draggable, InertiaPlugin, ScrambleTextPlugin);

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
// the nav's change between its light and dark states (initNavTheme)
CustomEase.create("navTheme", "0.45, 0, 0.25, 1");
gsap.defaults({ ease: "osmo", duration: 0.6 });

// The site places the scroll itself (resetScroll), so the browser must never
// restore it. Set through ScrollTrigger, which reads the mode as its script
// loads, ahead of this module, and writes what it read back at the end of
// every refresh: set on history directly, the first refresh put it back to
// "auto", and the browser's own restoration moved a reloaded page under the
// wipe.
ScrollTrigger.clearScrollMemory("manual");

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener("change", e => (reducedMotion = e.matches));

// When the current page is in view. Each page is built while it is still
// covered (beforeEnter), so anything that should play as it is seen — the
// line reveal of a heading already on screen — waits on this: a promise
// made as a page starts to arrive and kept once the arrival or the wipe
// has uncovered it.
let showPage = () => {};
let pageShown = Promise.resolve();
function coverPage() {
  pageShown = new Promise(resolve => (showPage = resolve));
}

// Smooth scroll, driven by the GSAP ticker rather than its own rAF so the
// transition can stop and restart it around a navigation. The lerp sets the
// glide: at 0.1 a wheel step settles in about half a second — a slower,
// calmer scroll — and a wheel tick moves the page its native distance.
const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

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
// Two animation systems, one rule: the logo intro opens the homepage — the
// session's first visit to it, every visit made by clicking the nav's
// logo, and every reload of it — and every other arrival, a reload of any
// other page included, uses the wipe. The
// intro is built around the homepage's hero, which it plays out in, so it
// never opens any other page.
//
// The intro cannot simply belong to Barba's once(), because once() runs on
// every document load — and a session has more of those than the first
// visit. Barba itself falls back to window.location.assign() when an internal
// navigation fails (a request error or timeout, an exception inside the
// transition, a history step taken mid-transition), a back/forward can miss
// the bfcache, and a typed URL loads a fresh document. Any of those used to
// replay the intro on what was, to the user, a move within the site.
//
// So each document load is classified before its first paint, by the inline
// script in the layout's <head>, which writes data-arrival on <html>:
//
//   "intro"   the homepage, on the session's first load, by the nav's logo,
//             or reloaded — always from the top
//   "reveal"  any other load: another page, a later visit, a reload of any
//             page but the homepage
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
  });
}

// The nav's logo is the way home, and clicking it opens the homepage on the
// intro every time. So it goes by a document load rather than Barba's wipe:
// Barba leaves the link to the browser (data-barba-prevent, Nav.astro), and
// the click marks the session so the <head> script gives that load the
// intro. A click that opens the page elsewhere — a new tab or window — is
// not marked.
function initHomeLink() {
  const link = document.querySelector("[data-menu-logo]");
  if (!link) return;

  link.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    try {
      sessionStorage.setItem("addd:intro", "requested");
    } catch (err) {}
  });
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
const WIPE_HANDOFF = { start: 0.3, stagger: 0.08, press: 0.3, rise: 0.45, overlap: 0.15 };
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

  const tl = gsap.timeline({
    onComplete: () => current.remove()
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(wipe.panel, { autoAlpha: 1 }, 0);
  tl.fromTo(wipe.panel, { yPercent: 0 }, { yPercent: -100, duration: 0.75 }, 0);
  // the name rides in on the rising panel and is handed over to the forms as
  // the panel settles over the page
  playWipeHandoff();
  tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: 0.75 }, 0);

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

  if (reducedMotion) {
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

  // Barba no longer runs leave and enter together, so the wait before the
  // panel leaves is measured from the moment the screen is covered, not from
  // the start of the wipe: a short beat, while the last forms are still rising.
  tl.add("startEnter", 0.2);

  // The homepage's field takes its words out now, while the page is still
  // covered, and brings them back in from the foot of the band up as the
  // wipe uncovers it — the band's lower edge is clear about a quarter of a
  // second in, its top by about three quarters — so the hero is rebuilt as
  // it arrives rather than showing empty slots until its words turn up
  // (enter() in slash-field.js).
  next.querySelectorAll("[data-slash-field]").forEach((el) => {
    el.slashField?.enter({ delay: tl.labels.startEnter + 0.3, time: 0.45 });
  });

  tl.set(next, { autoAlpha: 1 }, "startEnter");
  // the panel a third of the way off: the page counts as seen
  tl.call(() => showPage(), null, "startEnter+=0.3");

  tl.fromTo(wipe.panel, {
    yPercent: -100,
  }, {
    yPercent: -200,
    duration: 0.95,
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

  tl.from(next, { y: "15vh", duration: 0.95 }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

// Scroll to the top — or to y, on a reload — in a way Lenis agrees with.
// Setting window.scrollY behind its back leaves its internal position stale,
// and it snaps back to the old offset the moment it is started again.
function resetScroll(y = 0) {
  lenis.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
}

/* The enter animation tweens the container's y, and GSAP leaves the
   transform on the element when it finishes.
   Two things follow from that, and both are why the pinned sections
   were unreliable:

     - a transformed ancestor is the containing block for anything
       fixed inside it. The transform clears here, but transition.css
       also declares will-change: transform on the container, which
       does the same thing on its own — so pins stay transform pins;
     - every measurement taken while the container is still mid-tween
       is out by however far it has left to travel — up to 15vh. The
       lifecycle's refresh runs in beforeEnter, before the animation,
       so trigger positions were being recorded against a page 100+px
       below where it settles. Whether that mattered came down to how
       far the tween had got, which is why it worked some loads and
       not others.

   Clearing the transform here and refreshing afterwards makes the
   measurement deterministic: it happens once, on the settled page. */
function resetPage(container) {
  gsap.set(container, { clearProps: "position,top,left,right,transform" });

  // Lenis is measured first, so a reload's position is inside its limit.
  lenis.resize();
  resetScroll(reloadScroll);
  lenis.start();
  ScrollTrigger.refresh();
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
  ["[data-stack-cards]", initStackCards],
  ["[data-service-tabs]", initServiceTabs],
  ["[data-iso-field]", initIsoFields],
  [".dot-grid", initDotGrids],
  ["[data-service-diagram]", initServiceDiagrams],
  ["[data-enquiry-offer]", initEnquiryOffer],
  ["[data-slash-field]", initSlashField],
  ["[data-word-cycle]", initWordCycle],
  ["[data-filter-group]", initFilterGroups],
  ["[data-hero-parallax]", initHeroParallax],
  ["[data-footer-parallax]", initFooterParallax],
  ["[data-wavy-marquee-init]", initLogoMarquee],
  [".nav-link", initNavLinks],
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

// Page-scoped teardown. Anything a page-level init leaves behind that would
// outlive the DOM it was built from — GSAP tweens, ScrollTriggers, listeners
// on window/document, timers, observers — registers an undo here, and it is
// run against the outgoing page in afterLeave, once the panel covers it and
// before the next page inits.
let pageCleanups = [];

function registerPageCleanup(fn) {
  pageCleanups.push(fn);
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

function runPageCleanups() {
  const cleanups = pageCleanups;
  pageCleanups = [];
  cleanups.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error("page cleanup failed", err);
    }
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
barba.hooks.beforeEnter(data => {
  coverPage();
  lenis.stop();
  resetScroll();

  // The incoming container is in normal flow — the outgoing one is already
  // gone by this point — so the height hold has done its job and can be
  // released here rather than at the reveal.
  document.documentElement.style.minHeight = "";

  initPage(data.next.container);

  lenis.resize();
  ScrollTrigger.refresh();
  watchPageHeight(data.next.container);

  // A reload goes back to where the reader was (see ARRIVAL), once the page
  // has been built and measured from the top.
  if (reloadScroll) resetScroll(reloadScroll);
});

// The outgoing page is torn down only once the panel has covered it — leave()
// has resolved and removed the container — and still before beforeEnter, so
// it is gone before the incoming page builds anything of its own. Teardown
// is not invisible: killing a pin drops its spacer, a revert puts split text
// and the shutter's rows back, the slider's cards return to the start. Run on
// the click, it all landed a frame before the wipe, as a jump in the page.
//
// Then the safety net for anything the cleanups missed. Only triggers whose
// element has left the document are stale — never a blanket kill, which would
// take the incoming page's triggers with it the moment anything (a slow fetch,
// a future sync transition) puts beforeEnter ahead of this hook.
barba.hooks.afterLeave(() => {
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

// The nav, the Contact button and the layout grid live outside the Barba
// container, so they survive every navigation and are wired up once per
// document load.
initMegaNav();
initNavReveal();
initNavLogo();
initHomeLink();
initColumnGrid();
initNavLinks(document.querySelector("[data-menu-wrap]"));
// The width measurement waits on the webfont so the label is not measured
// against the fallback face.
document.fonts.ready.then(initContactButton);

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
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
    }
  ],
});



// -----------------------------------------
// COMPONENTS
// -----------------------------------------

function initLogoMarquee(container) {
  container.querySelectorAll("[data-wavy-marquee-init]").forEach((el) => {
    const marquee = initWavyMarquee(el);
    if (marquee) registerPageCleanup(marquee.destroy);
  });
}

/* ============================================================
   INSIGHT SLIDER
   ------------------------------------------------------------
   A dragged deck of insight cards. The list translates under the
   pointer; every card that reaches the left edge stops there and is
   scaled and tipped back a few degrees, so what has been read piles
   up as a stack instead of scrolling away.

   The motion is deliberately flat: Draggable snaps to whole cards,
   overshootTolerance is 0 so the throw cannot spring past a bound,
   and every programmatic move runs on power3.out. Nothing elastic,
   nothing that bounces back.

   Structure (see src/components/InsightSlider.astro):
     [data-slider]                    the root, carries the tuning
       [data-slider-viewport]         clipped frame
         [data-slider-list]           the element Draggable moves
           [data-slider-item] ...     one card each
       [data-slider-controls]         optional .dots + .arrows

   Tuning attributes on the root: data-scale (rest scale of a stacked
   card) and data-rotate (its rotation in degrees).
   ============================================================ */
function initInsightSlider(container) {
  container.querySelectorAll("[data-slider]").forEach(root => {
    const viewport = root.querySelector("[data-slider-viewport]");
    const list = root.querySelector("[data-slider-list]");
    const slides = Array.from(root.querySelectorAll("[data-slider-item]"));
    if (!viewport || !list || !slides.length) return;

    const minScale = Number(root.dataset.scale ?? 0.72);
    const maxRotation = Number(root.dataset.rotate ?? -5);

    const controls = root.querySelector("[data-slider-controls]");
    const prevBtn = controls && controls.querySelector("[data-slider-prev]");
    const nextBtn = controls && controls.querySelector("[data-slider-next]");
    const dots = controls ? Array.from(controls.querySelectorAll("[data-slider-dot]")) : [];

    // Vertical panning has to stay with the page — the deck only ever
    // wants the horizontal axis.
    viewport.style.touchAction = "pan-y";

    let spacing = 0;
    let maxDrag = 0;
    let dragX = 0;
    let index = 0;
    let draggable = null;
    let moveTween = null;

    const clamp = v => (maxDrag <= 0 ? 0 : Math.min(Math.max(v, 0), maxDrag));

    function paint() {
      gsap.set(list, { x: -dragX });

      slides.forEach((slide, i) => {
        const local = Math.max(0, dragX - i * spacing);
        const t = spacing > 0 ? Math.min(local / spacing, 1) : 0;

        gsap.set(slide, {
          x: local,
          scale: 1 - (1 - minScale) * t,
          rotation: maxRotation * t,
          transformOrigin: "75% center"
        });
      });

      const at = spacing > 0 ? Math.round(dragX / spacing) : 0;
      if (at !== index) {
        index = at;
        syncControls();
      }
    }

    function syncControls() {
      dots.forEach((d, i) => d.classList.toggle("is--active", i === index));
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= slides.length - 1;
    }

    function goTo(i) {
      const target = clamp(Math.max(0, Math.min(i, slides.length - 1)) * spacing);
      if (moveTween) moveTween.kill();
      if (draggable) draggable.endDrag?.();

      const state = { value: dragX };
      moveTween = gsap.to(state, {
        value: target,
        duration: 0.5,
        ease: "power3.out",
        onUpdate() {
          dragX = state.value;
          paint();
        }
      });

      viewport.setAttribute("aria-label", `Slide ${Math.round(target / (spacing || 1)) + 1} of ${slides.length}`);
    }

    function measure() {
      const gapRight = parseFloat(getComputedStyle(slides[0]).marginRight) || 0;
      spacing = slides[0].offsetWidth + gapRight;
      maxDrag = spacing * (slides.length - 1);

      dragX = clamp(dragX);
      paint();
      syncControls();

      if (draggable) draggable.applyBounds({ minX: -maxDrag, maxX: 0 });
    }

    draggable = Draggable.create(list, {
      type: "x",
      bounds: { minX: -maxDrag, maxX: 0 },
      inertia: true,
      // A throw settles inside a beat and cannot spring past the
      // ends — the restraint the deck is asked for.
      maxDuration: 0.8,
      overshootTolerance: 0,
      edgeResistance: 0.9,
      allowContextMenu: true,
      snap: raw => {
        const d = clamp(-raw);
        return -(spacing > 0 ? Math.round(d / spacing) : 0) * spacing;
      },
      onPress() {
        if (moveTween) moveTween.kill();
      },
      onDragStart() {
        root.classList.add("is--dragging");
      },
      onDrag() {
        dragX = clamp(-this.x);
        paint();
      },
      onThrowUpdate() {
        dragX = clamp(-this.x);
        paint();
      },
      onDragEnd() {
        // Released after a real drag the card under the pointer must
        // not also follow its link; a tap that never moved still
        // should, so the class only comes off once the click that
        // ends the gesture has been and gone.
        requestAnimationFrame(() => root.classList.remove("is--dragging"));
      },
      onClick() {
        root.classList.remove("is--dragging");
      }
    })[0];

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));
    dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));

    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-roledescription", "carousel");

    // Arrow keys drive the deck only while it is the thing on screen.
    let inView = false;
    const io = new IntersectionObserver(
      entries => { inView = entries[0].isIntersecting; },
      { threshold: 0.25 }
    );
    io.observe(root);

    function onKey(e) {
      if (!inView) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    }
    window.addEventListener("keydown", onKey);

    const ro = new ResizeObserver(() => measure());
    ro.observe(root);

    measure();
    // The card width is set in em against the webfont's metrics on the
    // body; re-measure once it has actually loaded.
    document.fonts.ready.then(measure);

    registerPageCleanup(() => {
      if (moveTween) moveTween.kill();
      if (draggable) draggable.kill();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("keydown", onKey);
      gsap.set([list, ...slides], { clearProps: "transform" });
    });
  });
}

/* ============================================================
   Mega nav — directional hover dropdowns, mobile slide-over panels.
   Lives outside the Barba container, so this runs once per document.
   ============================================================ */
function initMegaNav() {
  // On desktop both panels open item by item: the open panel stands in
  // the dropdown's flow, so the dropdown is its height without being
  // measured or animated, and each of its columns (Services' cards,
  // Resources' blocks) drops in from under the bar on its own, clipped by
  // the dropdown's top edge, one after the next, left to right, while the
  // dimmed page comes up behind them; closing, they lift back up under
  // it, the last first. Going from one panel to the other, the open
  // panel's columns lift out while the other's drop in over them, the
  // dimmed page staying as it is. Only transforms and opacity move.
  const DUR = {
    // the mobile drawer's panels, item by item
    stagger: 0.06,
    backdropIn: 0.35,
    backdropOut: 0.25,
    dropIn: 0.55,
    dropStagger: 0.07,
    liftOut: 0.3,
    liftStagger: 0.04,
  };

  const HOVER_ENTER = 120;
  const HOVER_LEAVE = 150;

  // DOM references
  const menuWrap = document.querySelector("[data-menu-wrap]");
  const navList = document.querySelector("[data-nav-list]");
  const dropWrapper = document.querySelector("[data-dropdown-wrapper]");
  const dropContainer = document.querySelector("[data-dropdown-container]");
  const backdrop = document.querySelector("[data-menu-backdrop]");
  const toggles = [...document.querySelectorAll("[data-dropdown-toggle]")];
  const panels = [...document.querySelectorAll("[data-nav-content]")];
  const burger = document.querySelector("[data-burger-toggle]");
  const backBtn = document.querySelector("[data-mobile-back]");
  const logo = document.querySelector("[data-menu-logo]");
  // The menu's four triangles, each with the turn it rests at (Nav.astro)
  const burgerMarks = [...document.querySelectorAll("[data-burger-mark]")];
  const markTurn = (_, el) => Number(el.dataset.burgerMark);

  if (!menuWrap || !navList || !dropWrapper) return;

  // The Services cards' dotted patterns (ServiceCard.astro, dot-field.js):
  // mounted once, as the nav outlives every page, and redrawn by their own
  // observer as they resize. Their ink is the nav's state, so they are
  // drawn again in it each time it reaches the dropdown (initNavTheme).
  const cardFields = [...menuWrap.querySelectorAll("[data-iso-field]")].map((el) => mountIsoField(el));
  menuWrap.addEventListener("navthemechange", () => cardFields.forEach((f) => f.redraw()));
  // The Workshop card's turning ending, the homepage hero's word cycle
  // (word-cycle.js): mounted once too. It holds while the dropdown is
  // closed (clipped out of sight, so its observer counts it off screen),
  // and each time the dropdown opens the word stands a while before it
  // turns.
  menuWrap.querySelectorAll("[data-word-cycle]").forEach((el) => mountWordCycle(el));

  // State
  const state = {
    isOpen: false,
    // the close is playing: still open until it ends, but not to be kept
    closing: false,
    activePanel: null,
    isMobile: window.innerWidth <= 991,
    mobileMenuOpen: false,
    mobilePanelActive: null,
    hoverTimer: null,
    leaveTimer: null,
    tl: null,
    mobileTl: null,
    mobilePanelTl: null,
    // from a navigation's click until the page wipe covers the screen
    navigating: false,
  };

  // Lookups — the nav is never replaced, so every list is collected once.
  const panelByName = new Map(panels.map((p) => [p.dataset.navContent, p]));
  const toggleByName = new Map(toggles.map((t) => [t.dataset.dropdownToggle, t]));
  const fadeByPanel = new Map(panels.map((p) => [p, p.querySelectorAll("[data-menu-fade]")]));
  const navItems = navList.querySelectorAll("[data-nav-list-item]");
  const getPanel = (name) => panelByName.get(name);
  const getToggle = (name) => toggleByName.get(name);
  const getFade = (el) => fadeByPanel.get(el);
  // the drawer's items one after the next, as the desktop's columns drop in
  const stagger = (n) => (n <= 1 ? 0 : { each: DUR.stagger });

  function clearTimers() {
    clearTimeout(state.hoverTimer);
    clearTimeout(state.leaveTimer);
    state.hoverTimer = state.leaveTimer = null;
  }

  function killTl(key) {
    if (state[key]) { state[key].kill(); state[key] = null; }
  }

  function killDropdown() {
    killTl("tl");
    gsap.killTweensOf(backdrop);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function killMobile() {
    killTl("mobileTl");
    gsap.killTweensOf([navList, ...burgerMarks]);
  }

  function killMobilePanel() {
    killTl("mobilePanelTl");
    gsap.killTweensOf(navItems);
    gsap.killTweensOf([backBtn, logo]);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function resetToggles() {
    toggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  // A desktop panel put away: hidden, out of the dropdown's flow, its
  // blocks back to rest.
  function hidePanel(p) {
    gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", x: 0, y: 0, xPercent: 0, clearProps: "position,zIndex" });
    gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0, xPercent: 0, yPercent: 0 });
  }

  // The panel being opened: in the dropdown's flow, so the dropdown is its
  // height, and over any panel still leaving; its blocks are the caller's.
  function showPanel(p) {
    gsap.set(p, { position: "relative", zIndex: 1, visibility: "visible", opacity: 1, pointerEvents: "auto" });
  }

  function resetDesktop() {
    panels.forEach(hidePanel);

    gsap.set(dropContainer, { clearProps: "height,transform" });
    gsap.set(backdrop, { autoAlpha: 0 });

    menuWrap.setAttribute("data-menu-open", "false");
    resetToggles();
  }

  function setupMobile() {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: "visible", pointerEvents: "none", clearProps: "position,zIndex" });
      gsap.set(getFade(p), { xPercent: 20, yPercent: 0, autoAlpha: 0 });
    });
    gsap.set(navItems, { xPercent: 0, y: 0, autoAlpha: 1 });
    gsap.set(navList, { autoAlpha: 0, x: 0 });
    gsap.set(backBtn, { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 1 });
    gsap.set(dropContainer, { clearProps: "height" });
    gsap.set(backdrop, { autoAlpha: 0 });
  }

  // DESKTOP — a panel's blocks dropping in from under the bar, one after
  // the next, from wherever they are (so a panel caught leaving comes
  // straight back rather than starting over)
  function dropIn(tl, blocks, at = 0) {
    if (!blocks.length) return;
    gsap.set(blocks, { autoAlpha: 1 });
    tl.to(blocks, { yPercent: 0, duration: DUR.dropIn, stagger: DUR.dropStagger, ease: "osmo" }, at);
  }

  // DESKTOP — and lifting back up under it, the last first
  function liftOut(tl, blocks, at = 0) {
    if (!blocks.length) return;
    tl.to(blocks, { yPercent: -100, duration: DUR.liftOut, stagger: { each: DUR.liftStagger, from: "end" }, ease: "power2.in" }, at);
  }

  // DESKTOP — open dropdown (first open)
  function openDropdown(panelName) {
    if (state.navigating) return;
    if (state.isOpen && !state.closing && state.activePanel === panelName) return;
    if (state.isOpen && !state.closing) return switchPanel(state.activePanel, panelName);

    const el = getPanel(panelName);
    if (!el) return;
    const blocks = getFade(el);
    const toggle = getToggle(panelName);
    // back over the panel that is shutting: its blocks come back down from
    // where they are; anything else opens from rest, blocks above the edge
    const reopening = state.closing && state.activePanel === panelName;

    killDropdown();
    if (!reopening) {
      resetDesktop();
      gsap.set(blocks, { yPercent: -100 });
    }

    state.isOpen = true;
    state.closing = false;
    state.activePanel = panelName;
    menuWrap.setAttribute("data-menu-open", "true");
    resetToggles();
    if (toggle) toggle.setAttribute("aria-expanded", "true");

    showPanel(el);
    const tl = gsap.timeline();
    state.tl = tl;
    tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: "power2.out" }, 0);
    dropIn(tl, blocks);
  }

  // DESKTOP — close dropdown
  function closeDropdown() {
    if (!state.isOpen || state.closing || state.navigating) return;
    const el = getPanel(state.activePanel);

    killDropdown();
    state.closing = true;

    const tl = gsap.timeline({
      onComplete() {
        state.isOpen = false;
        state.closing = false;
        state.activePanel = null;
        state.tl = null;
        resetDesktop();
      },
    });
    state.tl = tl;
    if (el) {
      gsap.set(el, { pointerEvents: "none" });
      liftOut(tl, getFade(el));
    }
    tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: "power2.out" }, 0.05);
  }

  // DESKTOP — switch panel: the open panel's blocks lift out while the
  // other's drop in over them, over the dimmed page, which stays as it is
  function switchPanel(fromName, toName) {
    const fromEl = getPanel(fromName), toEl = getPanel(toName);
    if (!fromEl || !toEl) return;
    const fromBlocks = getFade(fromEl), toBlocks = getFade(toEl);

    killDropdown();
    panels.forEach((p) => { if (p !== fromEl) hidePanel(p); });
    // the panel leaving: out of the flow, under the one arriving, still
    // drawn where it was while its blocks go
    gsap.set(fromEl, { position: "absolute", zIndex: 0, pointerEvents: "none" });
    gsap.set(toBlocks, { yPercent: -100 });
    showPanel(toEl);
    gsap.set(backdrop, { autoAlpha: 1 });

    const toToggle = getToggle(toName);
    state.activePanel = toName;
    resetToggles();
    if (toToggle) toToggle.setAttribute("aria-expanded", "true");

    const tl = gsap.timeline();
    state.tl = tl;
    liftOut(tl, fromBlocks);
    tl.add(() => hidePanel(fromEl));
    dropIn(tl, toBlocks, 0.1);
  }

  // DESKTOP — hover intent, for a mouse or a pen. A tap on a touch screen
  // fires its own mouseenter and mouseleave around the click, which would
  // open the dropdown and shut it again; a tap is the click's to handle
  // (handleToggleClick), so the hover handlers stand aside for it.
  let lastPointer = "mouse";
  const byTouch = () => lastPointer === "touch";

  function handleToggleEnter(e) {
    if (state.isMobile || byTouch()) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
  }

  // one pending close at a time: a new one replaces any already waiting
  function scheduleClose() {
    clearTimeout(state.leaveTimer);
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  function handleToggleLeave() {
    if (state.isMobile || byTouch()) return;
    clearTimeout(state.hoverTimer); state.hoverTimer = null;
    scheduleClose();
  }

  function handleWrapperEnter() {
    if (state.isMobile || byTouch()) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
    // back over the dropdown while it is shutting: open it again
    if (state.closing && state.activePanel) openDropdown(state.activePanel);
  }

  function handleWrapperLeave() {
    if (state.isMobile || byTouch()) return;
    scheduleClose();
  }

  // DESKTOP — close behaviours
  function handleEscape(e) {
    if (e.key !== "Escape") return;
    if (state.isMobile) {
      state.mobilePanelActive ? closeMobilePanel() : state.mobileMenuOpen && closeMobileMenu();
      return;
    }
    if (state.isOpen) {
      const t = getToggle(state.activePanel);
      closeDropdown();
      if (t) t.focus();
    }
  }

  function handleDocClick(e) {
    if (state.isMobile || !state.isOpen) return;
    if (!e.target.closest("[data-menu-wrap]")) closeDropdown();
  }

  // DESKTOP — keyboard navigation
  function focusFirstLink(panelName) {
    setTimeout(() => {
      const el = getPanel(panelName);
      if (!el) return;
      const link = el.querySelector("a");
      if (!link) return;
      gsap.set(link, { visibility: "visible" });
      link.focus();
    }, 80);
  }

  function handleKeydownOnToggle(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (state.isOpen && state.activePanel === name) closeDropdown();
      else { openDropdown(name); focusFirstLink(name); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!state.isOpen || state.activePanel !== name) openDropdown(name);
      focusFirstLink(name);
    }
    if (e.key === "Tab" && !e.shiftKey && state.isOpen && state.activePanel === name) {
      e.preventDefault();
      const link = getPanel(name)?.querySelector("a");
      if (link) link.focus();
    }
  }

  function handleKeydownInPanel(e) {
    if (state.isMobile || !state.isOpen) return;
    const el = getPanel(state.activePanel);
    if (!el) return;

    const links = [...el.querySelectorAll("a")];
    const idx = links.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      links[(idx + 1) % links.length].focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx <= 0) { const t = getToggle(state.activePanel); if (t) t.focus(); }
      else links[idx - 1].focus();
    }
    if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
      e.preventDefault();
      const curIdx = toggles.indexOf(getToggle(state.activePanel));
      const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
      closeDropdown();
      if (next) next.focus();
    }
    if (e.key === "Tab" && e.shiftKey && idx === 0) {
      e.preventDefault();
      const t = getToggle(state.activePanel);
      if (t) t.focus();
    }
  }

  // MOBILE — burger animation: open, each triangle turns an eighth on, so
  // the four that chase each other round the square all point at its
  // middle (the close); shut, they turn back to chasing.
  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to(burgerMarks, { rotation: (i, el) => markTurn(i, el) + (toX ? 45 : 0), duration: 0.3 }, 0);
    return tl;
  }

  // MOBILE — page scroll lock
  // The page scrolls on <html>, not <body>, so body's overflow cannot hold
  // it still under the open drawer. Stopped, Lenis blocks wheel and touch
  // scrolling everywhere except inside an element marked data-lenis-prevent
  // — which the drawer and the panels are given only while they are taller
  // than the screen, so they still scroll then, and a swipe on one that fits
  // is blocked like the rest of the page.
  const scrollAreas = [navList, ...panels];
  let pageScrollLocked = false;

  function lockPageScroll() {
    pageScrollLocked = true;
    lenis.stop();
    scrollAreas.forEach((el) => el.toggleAttribute("data-lenis-prevent", el.scrollHeight > el.clientHeight));
  }

  function unlockPageScroll() {
    if (!pageScrollLocked) return;
    pageScrollLocked = false;
    scrollAreas.forEach((el) => el.removeAttribute("data-lenis-prevent"));
    lenis.start();
  }

  // MOBILE — open/close menu
  function openMobileMenu() {
    killMobile();
    state.mobileMenuOpen = true;
    menuWrap.setAttribute("data-menu-open", "true");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    lockPageScroll();

    const tl = gsap.timeline();
    state.mobileTl = tl;
    tl.add(animateBurger(true), 0);
    tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0);
    if (navItems.length) {
      tl.fromTo(navItems,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power3.out" },
        0.15
      );
    }
  }

  function closeMobileMenu() {
    const hadPanel = state.mobilePanelActive;
    const panelEl = hadPanel ? getPanel(hadPanel) : null;

    killMobile();
    killMobilePanel();

    menuWrap.setAttribute("data-menu-open", "false");
    state.mobileMenuOpen = false;
    state.mobilePanelActive = null;
    burger.setAttribute("aria-expanded", "false");

    const tl = gsap.timeline({
      onComplete() {
        document.body.style.overflow = "";
        unlockPageScroll();
        state.mobileTl = null;
        setupMobile();
      },
    });
    state.mobileTl = tl;

    tl.add(animateBurger(false), 0);

    if (hadPanel && panelEl) {
      tl.to(panelEl, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
    }

    tl.to(navList, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
  }

  // MOBILE — slide-over panels
  function openMobilePanel(panelName) {
    const el = getPanel(panelName);
    if (!el) return;
    killMobilePanel();
    state.mobilePanelActive = panelName;

    const panelFade = getFade(el);

    const tl = gsap.timeline();
    state.mobilePanelTl = tl;

    if (navItems.length) {
      tl.to(navItems, {
        xPercent: -10, autoAlpha: 0,
        duration: 0.35, stagger: 0.03, ease: "power2.in",
      }, 0);
    }

    tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(backBtn, { autoAlpha: 1, duration: 0.25, ease: "power2.inOut" }, 0.15);

    tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: "auto" }, 0.2);
    if (panelFade.length) {
      tl.fromTo(panelFade,
        { xPercent: 8, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.3, stagger: stagger(panelFade.length), ease: "power3.out" },
        0.25
      );
    }
  }

  function closeMobilePanel() {
    if (!state.mobilePanelActive) return;
    const el = getPanel(state.mobilePanelActive);
    if (!el) return;
    killMobilePanel();

    const panelFade = getFade(el);

    const tl = gsap.timeline({
      onComplete() { state.mobilePanelActive = null; state.mobilePanelTl = null; },
    });
    state.mobilePanelTl = tl;

    if (panelFade.length) {
      tl.to(el, {
        xPercent: 20, autoAlpha: 0,
        duration: 0.3, stagger: 0.02, ease: "power2.in",
      }, 0);
    }

    tl.set(el, { autoAlpha: 0, pointerEvents: "none" }, 0.25);

    tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0.15);

    if (navItems.length) {
      tl.fromTo(navItems,
        { xPercent: -20, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: "power3.out" },
        0.25
      );
    }
  }

  function handleToggleClick(e) {
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    // desktop, from a tap: the tap opens the dropdown and a second tap on
    // the same toggle shuts it (a tap anywhere else shuts it too,
    // handleDocClick)
    if (!state.isMobile) {
      if (!byTouch()) return;
      e.preventDefault();
      if (state.isOpen && !state.closing && state.activePanel === name) closeDropdown();
      else openDropdown(name);
      return;
    }
    if (!state.mobileMenuOpen) return;
    e.preventDefault();
    openMobilePanel(name);
  }

  // A navigation leaves the menu exactly as it is while the page wipe rises
  // over it: closing it on the click played its whole closing move — the
  // dropdown springing up, the drawer fading — ahead of the panel. Held
  // still, it cannot be opened or closed under the wipe either (the panel
  // takes no pointer events, so hover intent would otherwise go on acting
  // as the panel slides under the pointer). Once the panel covers the
  // screen the menu is put back to rest in a single frame, unseen, so the
  // next page starts with it closed.
  function holdForNavigation() {
    state.navigating = true;
    clearTimers();
  }

  function resetForNewPage() {
    if (state.isMobile) {
      if (state.mobileMenuOpen) {
        killMobile();
        killMobilePanel();
        gsap.set(burgerMarks, { rotation: markTurn });
        burger.setAttribute("aria-expanded", "false");
        menuWrap.setAttribute("data-menu-open", "false");
        state.mobileMenuOpen = false;
        state.mobilePanelActive = null;
        document.body.style.overflow = "";
        unlockPageScroll();
        setupMobile();
      }
    } else if (state.isOpen) {
      killDropdown();
      state.isOpen = false; state.closing = false;
      state.activePanel = null;
      resetDesktop();
    }
    state.navigating = false;
  }

  // RESIZE
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  function handleResize() {
    const w = window.innerWidth;
    if (w === lastWidth) return;
    lastWidth = w;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const was = state.isMobile;
      state.isMobile = window.innerWidth <= 991;

      if (was && !state.isMobile) {
        killMobile(); killMobilePanel();
        gsap.set(navList, { clearProps: "all" });
        gsap.set(navItems, { clearProps: "all" });
        gsap.set(backBtn, { autoAlpha: 0 });
        gsap.set(logo, { clearProps: "all" });
        gsap.set(burgerMarks, { rotation: markTurn });

        panels.forEach((p) => {
          gsap.set(p, { clearProps: "all" });
          gsap.set(getFade(p), { clearProps: "all" });
        });

        burger.setAttribute("aria-expanded", "false");
        // also covers a close that was still animating when it was killed
        unlockPageScroll();
        state.mobileMenuOpen = false;
        state.mobilePanelActive = null;
        document.body.style.overflow = "";
        resetDesktop();
      }

      if (!was && state.isMobile) {
        killDropdown();
        state.isOpen = false; state.closing = false; state.activePanel = null;
        clearTimers();
        menuWrap.setAttribute("data-menu-open", "false");
        resetToggles();
        setupMobile();
      }

    }, 150);
  }

  // EVENT BINDING
  // which kind of pointer was last used, so a tap is told from a click
  // (the hover handlers above), and a mouse moved again after a tap, on a
  // device with both, hovers again
  const notePointer = (e) => { lastPointer = e.pointerType || "mouse"; };
  document.addEventListener("pointerdown", notePointer, { capture: true, passive: true });
  document.addEventListener("pointermove", notePointer, { capture: true, passive: true });

  toggles.forEach((btn) => {
    btn.addEventListener("mouseenter", handleToggleEnter);
    btn.addEventListener("mouseleave", handleToggleLeave);
    btn.addEventListener("keydown", handleKeydownOnToggle);
    btn.addEventListener("click", handleToggleClick);
  });

  dropWrapper.addEventListener("mouseenter", handleWrapperEnter);
  dropWrapper.addEventListener("mouseleave", handleWrapperLeave);

  panels.forEach((p) => p.addEventListener("keydown", handleKeydownInPanel));

  backdrop.addEventListener("click", closeDropdown);

  document.addEventListener("keydown", handleEscape);
  document.addEventListener("click", handleDocClick);

  burger.addEventListener("click", () => state.mobileMenuOpen ? closeMobileMenu() : openMobileMenu());

  backBtn.addEventListener("click", closeMobilePanel);

  window.addEventListener("resize", handleResize);

  barba.hooks.beforeLeave(holdForNavigation);
  barba.hooks.afterLeave(resetForNewPage);

  // INIT
  state.isMobile ? setupMobile() : resetDesktop();
}

/* ============================================================
   Nav reveal — the bar steps out of the way where a section asks
   ============================================================
   The bar is in place over the page's main content whichever way
   the page scrolls, and out of view only where a section holds it
   out:

     - the homepage's hero ([data-hero-parallax]): as the page leaves
       it, the bar goes up with the hero, at the hero's own pace. The
       hero is scrubbed down a share of its height as its wrap scrolls
       away (initHeroParallax), so it rises slower than the scroll, and
       the bar, which sits on it, rises with it until it is out of
       view; scrolled back up, it comes back down with it;
     - a section marked data-nav-hold (the homepage's logo strip and
       its held statements): from where the hero lets the bar go (on a
       page without one, the section's top coming up the screen) to the
       moment the section's foot has passed the bar's, so its
       statements play out with nothing over them and the bar comes
       back as the next section takes the screen;
     - the closing call to action (.cta), from the moment its top
       reaches the bar's foot to the end of the page, the footer under
       it included.

   It is always in place while a menu is open or keyboard focus is in
   it. Scroll direction plays no part.

   One writer, so nothing else ever moves the bar: how far out of view
   it is, 0 to 1, a single number drawn as the bar's y. In the hero it
   follows the scroll exactly; everywhere else it eases between 0 and
   1 on the site's curve as a boundary is crossed, and a change of mind
   part-way turns round from where it is. Where the hero takes over
   from a change still under way, the bar catches up with the hero in
   a moment rather than jumping, and every change takes the time its
   share of the way calls for. The boundaries are page positions,
   measured on each ScrollTrigger refresh (load, resize, the webfont),
   so nothing is read while the page scrolls. A page opens with the
   bar where its scroll puts it, at once: in place at the top, out of
   view on a reload into a held section.

   It goes up by its height rounded up to whole device pixels: the
   bar's height is fluid (3.9em on the scaling system's size), so it is
   rarely a whole number of device pixels — 68.79px is 103.19 of them
   at 1.5x — and moved by exactly that, its last, partly covered row of
   pixels would show on the screen's top edge once the compositor snaps
   the layer to the pixel grid. In place, its transform is cleared,
   because a transformed nav would become the containing block for the
   fixed drawer and backdrop inside it.
   ============================================================ */
const NAV_REVEAL = { duration: 0.6, ease: "osmo", catchUp: 0.2 };

function initNavReveal() {
  const nav = document.querySelector("[data-menu-wrap]");
  if (!nav) return;

  const state = { out: 0 };
  let distance = 0;
  let drawn = 0;
  let zones = null;
  let watcher = null;
  let easing = null;
  let goal = 0;

  const outOfView = () => {
    const dpr = window.devicePixelRatio || 1;
    return Math.ceil(nav.getBoundingClientRect().height * dpr) / dpr;
  };

  function draw() {
    const y = state.out > 0 ? -state.out * distance : 0;
    if (y === drawn) return;
    drawn = y;
    if (y) gsap.set(nav, { y });
    else gsap.set(nav, { clearProps: "transform" });
  }

  // Where the sections hold the bar, as page positions, for the page in
  // container: the hero's run, if it has one, and the held stretches.
  function measure(container) {
    const page = (el) => el.getBoundingClientRect().top + window.scrollY;
    const bar = nav.offsetHeight;
    distance = outOfView();
    let hero = null;
    const wrap = container.querySelector("[data-hero-parallax]");
    const inner = wrap?.querySelector("[data-hero-parallax-inner]");
    if (wrap && inner) {
      // the hero's pace: the scroll less what the parallax takes back
      const start = Math.max(0, page(wrap));
      const pace = 1 - (parallaxTravel(inner) / 100) * inner.offsetHeight / wrap.offsetHeight;
      hero = { start, end: start + distance / Math.max(pace, 0.1), foot: page(wrap) + wrap.offsetHeight };
    }
    // A held section straight after the hero takes the bar over exactly
    // where the hero lets it go, however tall the hero is beside the
    // screen; any other from its top coming up the screen.
    const holds = [...container.querySelectorAll("[data-nav-hold]")].map((section) => {
      const top = page(section);
      const afterHero = hero && top <= hero.foot + 1;
      return [afterHero ? hero.end : top - window.innerHeight, top + section.offsetHeight - bar];
    });
    const cta = container.querySelector(".cta");
    if (cta) holds.push([page(cta) - bar, Infinity]);
    zones = { hero, holds };
  }

  // Where the bar should be at scroll y: how far out, and whether it
  // follows the scroll (the hero) or eases there.
  function wanted(y) {
    if (nav.getAttribute("data-menu-open") === "true" || nav.querySelector(":focus-visible")) return [0, false];
    if (!zones) return [0, false];
    const { hero, holds } = zones;
    if (hero && y > hero.start && y < hero.end) return [(y - hero.start) / (hero.end - hero.start), true];
    return [holds.some(([from, to]) => y >= from && y < to) ? 1 : 0, false];
  }

  function update(immediate = false) {
    const [out, follows] = wanted(window.scrollY);
    if (immediate || (follows && !easing?.isActive())) {
      easing?.kill();
      easing = null;
      goal = out;
      state.out = out;
      draw();
      return;
    }
    if (out === goal && (easing?.isActive() || state.out === out)) return;
    goal = out;
    easing?.kill();
    // the time in proportion to the way left to go, so the last of the
    // hero's run, or a turn part-way, is not drawn out over the whole
    const share = NAV_REVEAL.duration * Math.abs(out - state.out);
    easing = gsap.to(state, {
      out,
      duration: reducedMotion ? 0 : follows ? NAV_REVEAL.catchUp : Math.max(NAV_REVEAL.catchUp, share),
      ease: NAV_REVEAL.ease,
      onUpdate: draw,
    });
  }

  // A page's own watcher: its boundaries on every refresh, the bar on
  // every scroll. Bound to the container, so it goes with the page.
  function bind(container) {
    watcher?.kill();
    watcher = null;
    zones = null;
    if (!container) return;
    watcher = ScrollTrigger.create({
      trigger: container,
      start: 0,
      end: "max",
      onUpdate: () => update(),
      onRefresh: () => {
        measure(container);
        update(true);
      },
    });
    measure(container);
    update(true);
  }

  // Opening or closing a menu, and keyboard focus coming into the bar or
  // leaving it, settle it again where it is.
  new MutationObserver(() => update()).observe(nav, { attributes: true, attributeFilter: ["data-menu-open"] });
  nav.addEventListener("focusin", () => update());
  nav.addEventListener("focusout", () => gsap.delayedCall(0, () => update()));

  barba.hooks.beforeEnter((data) => bind(data?.next?.container));
  barba.hooks.afterLeave(() => bind(null));

  initNavTheme(nav);
}

/* ============================================================
   Nav theme — light or dark from the section under the bar
   ============================================================
   The bar takes the dark state over a dark section and the light
   state over a light one, wherever they are on the page, not per page.

   Each page's grounds are found once, as it arrives: every element in
   it with an opaque background at least half the screen wide — so the
   cards and tiles a section holds never count against the section they
   sit in — dark or light by its colour's luminance. Anything that
   should decide for itself, a dark photograph with no background
   colour behind it, sets data-nav-theme="dark" or "light". Scrims and
   other overlays the pointer passes through (pointer-events: none)
   are not grounds.

   An IntersectionObserver then watches them against one line across
   the screen at the middle of the bar, where the bar rests, so the
   state follows the page while the reveal has the bar out of view.
   The browser says when a ground crosses the line, and of those on it
   the last in the document — the innermost, or the one painted over
   the other — decides. Nothing is read while the page scrolls or sits
   still; this was five hit-tests and a run of style reads on every
   frame of a scroll, and a poll four times a second besides. The
   grounds are found again for each new page, under the wipe, and when
   the window changes size.

   While a menu is open the state holds, and the change is made as it
   closes.

   The change itself is one tween of one number, --nav-dark on the
   nav's own style (0% light, 100% dark), which every colour in nav.css
   is mixed by — so nothing in the nav can run ahead of or behind
   anything else. It is a script tween rather than a CSS transition
   because Chrome paints visited links' text with the page's ink while
   a CSS animation moves a custom property (see nav.css). A soft ease in
   and out, slow enough to feel like the bar settling onto the new
   ground; a change of mind mid-way turns round from where it is, in
   the share of the time that is left to cover. The first state of a
   document is set at once, as is every state with reduced motion.
   ============================================================ */
function initNavTheme(nav) {
  const bar = nav.querySelector(".mega-nav__bar") || nav;
  // whole subtrees that can never be a section's ground
  const SKIP = new Set(["svg", "SCRIPT", "STYLE", "CANVAS", "IMG", "PICTURE", "VIDEO", "IFRAME", "BR", "INPUT", "TEXTAREA", "SELECT"]);
  const grounds = new Map(); // element → "dark" | "light"
  const onLine = new Set(); // the grounds crossing the line now
  let observer = null;
  let theme = null; // the state the bar shows
  let wanted = null; // the state the ground asks for

  // a computed background colour as [r, g, b, a], each 0–1: rgb()/rgba(),
  // and color(srgb …), which is how a color-mix() comes back
  function parseColor(value) {
    const m = value.match(/^(rgba?|color)\((.*)\)$/);
    if (!m) return null;
    const parts = m[2].replace(/^srgb\s+/, "").split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    const [r, g, b, a = 1] = parts;
    return m[1] === "color" ? [r, g, b, a] : [r / 255, g / 255, b / 255, a];
  }

  function groundOf(el, minWidth) {
    const set = el.getAttribute("data-nav-theme");
    if (set === "dark" || set === "light") return set;
    const style = getComputedStyle(el);
    if (style.pointerEvents === "none") return null;
    const c = parseColor(style.backgroundColor);
    if (!c || c[3] < 0.5) return null;
    if (el.getBoundingClientRect().width < minWidth) return null;
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 0.5 ? "dark" : "light";
  }

  const DURATION = 0.7;
  const state = { dark: 0 }; // how far into the dark state, 0–1
  const amount = () => `${(state.dark * 100).toFixed(2)}%`;
  // Each frame of the change is written to the bar alone, the part of the
  // nav that is in view, so the browser recalculates the bar's styles and
  // not the closed dropdown's as well — twice the bar's elements, and most
  // of each frame's cost (nav.css mixes the colours per part). The nav's
  // own value, which the dropdown takes, is set as the change settles. A
  // dropdown opened mid-change follows the bar frame by frame until then.
  // Each time the dropdown's value is set, the nav says so ("navthemechange"),
  // for what in the dropdown is drawn rather than styled: the Services
  // cards' dots (initMegaNav).
  const settle = () => {
    nav.style.setProperty("--nav-dark", amount());
    nav.dispatchEvent(new Event("navthemechange"));
  };
  const draw = () => {
    bar.style.setProperty("--nav-dark", amount());
    if (nav.getAttribute("data-menu-open") === "true") settle();
  };

  function apply(next) {
    wanted = next;
    if (next === theme || nav.getAttribute("data-menu-open") === "true") return;
    const first = theme === null;
    theme = next;
    nav.setAttribute("data-nav-theme", next);
    const target = next === "dark" ? 1 : 0;
    gsap.killTweensOf(state);
    if (first || reducedMotion) {
      state.dark = target;
      draw();
      settle();
      return;
    }
    gsap.to(state, {
      dark: target,
      duration: DURATION * Math.abs(target - state.dark),
      ease: "navTheme",
      onUpdate: draw,
      onComplete: settle,
    });
  }

  function decide() {
    let top = null;
    onLine.forEach((el) => {
      if (!top || top.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) top = el;
    });
    apply(top ? grounds.get(top) : "light");
  }

  function watch() {
    observer?.disconnect();
    grounds.clear();
    onLine.clear();
    const container = document.querySelector('[data-barba="container"]');
    if (!container) return;

    const minWidth = document.documentElement.clientWidth / 2;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (el) => (SKIP.has(el.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let el = container; el; el = walker.nextNode()) {
      const ground = groundOf(el, minWidth);
      if (ground) grounds.set(el, ground);
    }

    // the line: one pixel tall, at the middle of the bar
    const y = Math.round(bar.offsetHeight / 2);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? onLine.add(e.target) : onLine.delete(e.target)));
      decide();
    }, { rootMargin: `${-y}px 0px ${-(window.innerHeight - y - 1)}px 0px` });
    grounds.forEach((_, el) => observer.observe(el));
    // with nothing to watch the observer never reports: the body's ground
    if (!grounds.size) decide();
  }

  watch();
  // each new page, once its components are built and before the wipe
  // uncovers it (the lifecycle's own beforeEnter runs first)
  barba.hooks.beforeEnter(watch);
  let resizing = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizing);
    resizing = setTimeout(watch, 150);
  });
  // a change held while a menu was open goes through as it closes
  new MutationObserver(() => wanted && apply(wanted)).observe(nav, {
    attributes: true,
    attributeFilter: ["data-menu-open"],
  });
}

/* ============================================================
   Nav logo — the forms drawn back into the name on hover
   ============================================================
   The intro's own morph (logo-morph.js), run backwards while the
   pointer is on the logo — the four forms open back out into
   A D D D — and forwards again as it leaves. Each letter tweens its
   own progress (1 the form, 0 the glyph) from wherever it is, so
   leaving halfway turns the change round mid-shape rather than
   jumping, and the wave runs left to right both ways. A little
   quicker than the intro, being a hover.

   A pointer only: on a touch screen a tap is a click, and it goes
   home. Keyboard focus shows the name too. With reduced motion the
   name and the forms swap without the change between them.
   ============================================================ */
function initNavLogo() {
  const link = document.querySelector("[data-menu-logo]");
  const paths = link ? [...link.querySelectorAll("[data-logo-morph-letter]")] : [];
  if (paths.length !== LETTER_COUNT) return;

  const DURATION = 0.75; // one letter, all the way from form to glyph
  const STAGGER = 0.07;
  // The name a touch heavier than the type it is drawn from: a stroke of the
  // mark's own colour round each letter, this wide (in the mark's viewBox)
  // once the letter is fully the glyph, and nothing on the forms, so the
  // weight comes and goes with the change itself.
  const WEIGHT = 0.4;
  const ease = getMorphEase();
  const states = paths.map(() => ({ t: 1 }));
  const draw = (i) => {
    paths[i].setAttribute("d", morphPath(i, states[i].t, ease));
    paths[i].setAttribute("stroke-width", (WEIGHT * (1 - states[i].t)).toFixed(3));
  };

  function morphTo(target) {
    states.forEach((state, i) => {
      gsap.killTweensOf(state);
      const distance = Math.abs(target - state.t);
      if (!distance) return;
      if (reducedMotion) {
        state.t = target;
        draw(i);
        return;
      }
      gsap.to(state, {
        t: target,
        duration: DURATION * distance,
        // a letter already part of the way there waits less for its turn
        delay: i * STAGGER * distance,
        // Going back to the name, the morph runs from its own long settle,
        // which played straight would leave a hover a third of a second with
        // nothing to show; the run is hurried through it instead. Back to the
        // forms it plays at the intro's own pace. Either way the shape is the
        // same function of t, so turning round mid-change never jumps.
        ease: target === 0 ? "power2.out" : "none",
        onUpdate: () => draw(i),
      });
    });
  }

  link.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") morphTo(0);
  });
  link.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !link.matches(":focus-visible")) morphTo(1);
  });
  link.addEventListener("focus", () => {
    if (link.matches(":focus-visible")) morphTo(0);
  });
  link.addEventListener("blur", () => {
    if (!link.matches(":hover")) morphTo(1);
  });
}

/* ============================================================
   Contact button — the nav's block-swap button. Each label is
   measured so the two halves can trade widths on hover; the CSS
   reads the measurement back from --contact-button-width.
   ============================================================ */
function initContactButton() {
  const elements = document.querySelectorAll("[data-contact-button-element]");
  if (!elements.length) return;

  const measure = () => elements.forEach((el) => {
    const text = el.querySelector("[data-contact-button-text]");
    el.style.setProperty("--contact-button-width", `${text.offsetWidth}px`);
  });

  measure();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 60);
  });
}

/* ============================================================
   Sliding-box links — the nav's and the footer's links
   ============================================================
   nav-link.css slides the block in from below and out the same way.
   For a mouse, this makes it follow the pointer: in through the edge
   it came in by, out through the edge it leaves by, judged against
   the link's vertical midpoint. As supplied, the move is set inline —
   the transition taken off, the block put at the entry edge, a
   reflow, the transition back, and the block brought to rest, its
   copy of the label moved the opposite way with it each time — and
   once the block is out it is handed back to the stylesheet, so a
   link that takes keyboard focus shows its block at once. A link
   already showing its block for keyboard focus is left as it is. Only
   hover and focus ever show it: the link to the page being viewed
   rests like any other. On touch there is no hover to follow, and the
   stylesheet's states are all there is.

   The nav's links are bound once, since the nav outlives every page,
   and the footer's with each page through the registry; a link is
   never bound twice. Their listeners live on the links themselves, so
   they leave with the footer.
   ============================================================ */
function initNavLinks(root) {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  // where the block waits off each edge, and its copy of the label the
  // same distance the other way, so the copy never moves off the label
  const out = {
    top: ["translateY(calc(-100% - 1px))", "translateY(calc(100% + 1px))"],
    bottom: ["translateY(calc(100% + 1px))", "translateY(calc(-100% - 1px))"],
    in: ["translateY(0)", "translateY(0)"],
    rest: ["", ""],
  };

  root.querySelectorAll(".nav-link").forEach((link) => {
    const bg = link.querySelector(".nav-link__bg");
    const ink = link.querySelector(".nav-link__ink");
    if (!bg || !ink || link.navLinkBound) return;
    link.navLinkBound = true;

    // The block and its copy always move together, in one style change,
    // so their transitions start on the same frame. The copy inherits the
    // block's transition, so taking the block off it takes both.
    const place = (where) => {
      [bg.style.transform, ink.style.transform] = out[where];
    };
    const jump = (where) => {
      bg.style.transition = "none";
      place(where);
      void bg.offsetWidth;
      bg.style.transition = "";
    };

    let leaving = 0;
    const edge = (event) => {
      const box = link.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2 ? "top" : "bottom";
    };
    const held = () => link.matches(":focus-visible");
    // back to the stylesheet's own state, without a move
    const handBack = () => {
      clearTimeout(leaving);
      leaving = 0;
      jump("rest");
    };

    link.addEventListener("mouseenter", (event) => {
      if (!finePointer.matches) return;
      if (held()) return handBack();
      if (leaving) {
        // caught on its way out: it turns round from where it is
        clearTimeout(leaving);
        leaving = 0;
      } else {
        jump(edge(event));
      }
      place("in");
    });

    link.addEventListener("mouseleave", (event) => {
      if (!finePointer.matches) return;
      if (held()) return handBack();
      place(edge(event));
      clearTimeout(leaving);
      leaving = setTimeout(handBack, 650);
    });

    // keyboard focus brings the block in from wherever it is
    link.addEventListener("focus", () => {
      clearTimeout(leaving);
      leaving = 0;
      place("rest");
    });
  });
}

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
   Approach slides — each step pinned, tipped back and faded
   ============================================================
   The homepage's original approach cards, kept on the Tech Firms
   page since the homepage moved to the approach stack above.

   The reference effect is kept as shipped: the slide's wrapper is
   pinned for one viewport while the card inside it rotates back on
   X, twists a few degrees on Z and shrinks, then a second scrubbed
   tween fades it out once it has travelled far enough. Three things
   are adapted so it lives in this codebase rather than beside it:

     - it is queried against the Barba container, not document, and
       is called from the page registry instead of DOMContentLoaded,
       so it rebinds on every navigation to the page;
     - its ScrollTriggers are killed through registerPageCleanup,
       which is what unpins the wrappers when the container goes;
     - Lenis and ScrollTrigger are already wired up by the page
       lifecycle, so nothing here starts either.
   ============================================================ */
function initApproachSlides(container) {
  const root = container.querySelector("[data-approach-slides-init]");

  const slides = [...root.querySelectorAll(".approach__slide")];
  if (!slides.length) return;

  // The bar is fixed over the page, so a card has to stack beneath it
  // rather than at the very top of the viewport.
  //
  // Two sources, whichever is larger, because either can read zero at
  // the moment a refresh happens: the bar itself if it is mid-intro,
  // and --nav-h if a stylesheet has not landed. The value is written
  // back onto the section as data-nav-offset, so what the trigger is
  // actually using can be read straight off the DOM.
  const navBar = document.querySelector(".mega-nav__bar");
  const cssNavHeight = () => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;height:var(--nav-h)";
    document.body.appendChild(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  };
  const navOffset = () => {
    const measured = navBar ? navBar.getBoundingClientRect().height : 0;
    const offset = Math.round(Math.max(measured, cssNavHeight()));
    root.dataset.navOffset = offset;
    return offset;
  };

  const tweens = [];

  slides.forEach((slide, index) => {
    const wrapper = slide.querySelector(".approach__slide-wrapper");
    const card = slide.querySelector(".approach__card");
    if (!wrapper || !card) return;

    // The last step is where the sequence ends, so it is left alone:
    // no pin, no tip, no fade. It arrives like any other block on the
    // page and scrolls on into the section below it.
    if (index === slides.length - 1) return;

    tweens.push(gsap.to(card, {
      rotationZ: (Math.random() - 0.5) * 10, // between -5 and 5 degrees
      scale: 0.7,
      rotationX: 40,
      ease: "power1.in",
      scrollTrigger: {
        pin: wrapper, // held while the card tips away
        // The wipe moves the Barba container with a transform, which
        // makes it the containing block for anything fixed while it
        // runs — a default (fixed) pin would drop the pinned card to
        // the top of the container mid-wipe instead of holding it in
        // the viewport.
        pinType: "transform",
        // start and end are re-measured on every refresh, and the
        // trigger is invalidated with them, so a start computed while
        // the page was still settling cannot stick around
        invalidateOnRefresh: true,
        trigger: slide,
        start: () => "top " + navOffset() + "px",
        end: () => "+=" + window.innerHeight, // one viewport later
        scrub: true,
      },
    }));

    tweens.push(gsap.to(card, {
      autoAlpha: 0,
      ease: "power1.in",
      scrollTrigger: {
        trigger: card,
        start: "top -80%",
        end: "+=" + 0.2 * window.innerHeight,
        scrub: true,
      },
    }));
  });

  // resetPage refreshes once the page has settled, which is the
  // measurement that matters. These two cover the reflows that can
  // still land after it: a late font swap and the images finishing.
  const refreshIfLive = () => {
    if (root.isConnected) ScrollTrigger.refresh();
  };
  document.fonts?.ready.then(refreshIfLive);
  if (document.readyState !== "complete") {
    window.addEventListener("load", refreshIfLive, { once: true });
    registerPageCleanup(() => window.removeEventListener("load", refreshIfLive));
  }

  registerPageCleanup(() => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
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
      reducedMotion,
      still: document.documentElement.hasAttribute("data-draft"),
      shown: () => pageShown,
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
      reducedMotion,
      scrollTo: (target) => {
        if (reducedMotion) return lenis.scrollTo(target, { immediate: true });
        const distance = Math.abs(target - window.scrollY);
        lenis.scrollTo(target, {
          duration: gsap.utils.clamp(1.2, 2.4, 0.9 + distance / 1800),
          easing: STACK_EASE,
        });
      },
    });
    registerPageCleanup(() => tabs.destroy());
  });
}


/* ============================================================
   Shutter scroll transition — rows closing over a section
   ============================================================
   The reference component as shipped: its defaults, breakpoints,
   matchMedia tiers, row building and the two modes (cover, where
   the rows grow from the bottom as a section leaves; reveal, where
   they retract as one arrives) are unchanged.

   Three adaptations so it lives in this codebase:

     - it is queried against the Barba container, not document, and
       is called from the page registry rather than DOMContentLoaded,
       so it rebinds on every navigation;
     - the trigger is the nearest [data-shutter-scroll-section] when
       there is one, falling back to the reference's closest section.
       Here the shutter belongs to the last of the approach slides
       (Tech Firms), not to the whole section it sits in;
     - the matchMedia context is reverted through registerPageCleanup,
       which tears the rows and their triggers down with it, and GSAP
       and ScrollTrigger are the ones the page has already loaded.
   ============================================================ */
function initShutterScrollTransition(container) {
  // Defaults — edit these to change fallbacks if no data-attribute is added
  const defaultRows = 6;
  const defaultMode = "cover";
  const defaultScrollStart = { cover: "bottom bottom", reveal: "top bottom" };
  const defaultScrollEnd = { cover: "bottom top", reveal: "top center" };
  // Raised from the reference's 0.3: at that value the rows sit almost
  // directly on the scroll position, so a quick flick of the wheel puts
  // the shutter through its whole range in a frame or two and it reads
  // as a cut. Just under a second of catch-up keeps the rows moving
  // after the scroll stops, which is what makes the move legible at
  // speed. Only the approach step's shutter runs on the site.
  const defaultScrub = 0.9;
  const defaultShutterDuration = 0.1;
  const defaultStaggerAmount = 0.01;

  // Class names applied to generated elements
  const panelClass = "shutter-scroll-transition__panel";
  const rowClass = "shutter-scroll-transition__row";

  // Breakpoints
  const breakpoints = {
    mobile: "(max-width: 478px)",
    landscape: "(max-width: 767px)",
    tablet: "(max-width: 991px)",
  };

  const instances = [];

  function getMode(wrapper) {
    return wrapper.dataset.mode === "reveal" ? "reveal" : defaultMode;
  }

  function getRows(wrapper) {
    const base = parseInt(wrapper.dataset.rows, 10) || defaultRows;

    if (window.matchMedia(breakpoints.mobile).matches) {
      return parseInt(wrapper.dataset.rowsMobile, 10) || base;
    }
    if (window.matchMedia(breakpoints.landscape).matches) {
      return parseInt(wrapper.dataset.rowsLandscape, 10) || base;
    }
    if (window.matchMedia(breakpoints.tablet).matches) {
      return parseInt(wrapper.dataset.rowsTablet, 10) || base;
    }
    return base;
  }

  function getScrollStart(wrapper, mode) {
    return wrapper.dataset.scrollStart || defaultScrollStart[mode];
  }

  function getScrollEnd(wrapper, mode) {
    return wrapper.dataset.scrollEnd || defaultScrollEnd[mode];
  }

  function createRow() {
    const row = document.createElement("div");
    row.classList.add(rowClass);
    return row;
  }

  function buildRows(wrapper, rows) {
    const panel = document.createElement("div");
    panel.classList.add(panelClass);

    const fragment = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) {
      fragment.appendChild(createRow());
    }
    panel.appendChild(fragment);
    wrapper.appendChild(panel);

    return { panel };
  }

  function collectRows(panel) {
    return Array.from(panel.children);
  }

  function createAnimation(wrapper, rows, section, mode) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: getScrollStart(wrapper, mode),
        end: getScrollEnd(wrapper, mode),
        scrub: defaultScrub,
        invalidateOnRefresh: true,
      },
    });

    const fromScale = mode === "cover" ? 0 : 1;
    const toScale = mode === "cover" ? 1 : 0;
    const origin = mode === "cover" ? "bottom center" : "top center";

    gsap.set(rows, {
      scaleY: fromScale,
      transformOrigin: origin,
    });

    tl.to(rows, {
      scaleY: toScale,
      duration: defaultShutterDuration,
      stagger: { each: defaultStaggerAmount, from: "end" },
      ease: "none",
    });

    return tl;
  }

  function setupInstance(wrapper) {
    const section =
      wrapper.closest("[data-shutter-scroll-section]") ||
      wrapper.closest("section") ||
      wrapper.parentElement;
    const rows = getRows(wrapper);
    const mode = getMode(wrapper);

    const { panel } = buildRows(wrapper, rows);
    const rowList = collectRows(panel);
    const tl = createAnimation(wrapper, rowList, section, mode);

    return { panel, tl };
  }

  function destroyInstance(instance) {
    if (instance.tl) {
      instance.tl.scrollTrigger?.kill();
      instance.tl.kill();
    }
    instance.panel.remove();
  }

  function buildAll(wrappers) {
    wrappers.forEach((wrapper) => {
      instances.push(setupInstance(wrapper));
    });
    ScrollTrigger.refresh();
  }

  function destroyAll() {
    instances.forEach(destroyInstance);
    instances.length = 0;
  }

  const wrappers = [...container.querySelectorAll("[data-shutter-scroll-transition]")];

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 992px)",
      isTablet: "(min-width: 768px) and (max-width: 991px)",
      isLandscape: "(min-width: 479px) and (max-width: 767px)",
      isMobile: "(max-width: 478px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      if (context.conditions.reduceMotion) return;

      buildAll(wrappers);

      return () => {
        destroyAll();
      };
    }
  );

  registerPageCleanup(() => mm.revert());
}


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

function initProblemParallax(container) {
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
function initGlobalParallax(container) {
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
   Line reveal — the marked headings rising line by line
   ============================================================
   After the Osmo Masked Text Reveal: every [data-split="heading"]
   is split into its lines, each wrapped in a mask, and the lines rise
   into it one after another the first time the heading comes up the
   screen. Lines only, never words or letters, a short stagger and an
   ease that settles, so a heading reads as set rather than performed.

   Adapted to the site:
     - mounted per page from the registry and reverted with it;
     - a heading already on screen when its page arrives waits for the
       page to be uncovered (pageShown), so it rises as it is seen and
       not under the wipe;
     - autoSplit re-splits a heading whenever its width changes or the
       webfont arrives, so its lines are always its real lines; the
       tween handed back to SplitText is carried over to the new lines
       at the progress it had reached, so a resize never replays it;
     - SplitText's own aria handling keeps each heading read whole;
     - with reduced motion, or in the Studio's preview, headings are
       left as they are (and styles.css never hides them);
     - each line's mask is opened by the face's overhang past its line
       box (styles.css), so no glyph is cut, and a line starts far
       enough down to be wholly out of it.

   When: once the heading's top is well up the screen (28% of it up
   from the foot), so it is being looked at, not still at the edge; and
   on an ease that keeps moving long enough to be seen, rather than one
   that has done nearly all of its travel in the first quarter-second.
   ============================================================ */
const LINE_REVEAL = { yPercent: 125, duration: 0.9, stagger: 0.09, ease: "power3.out", start: "clamp(top 72%)" };

function initLineReveal(container) {
  if (reducedMotion || document.documentElement.hasAttribute("data-draft")) return;

  container.querySelectorAll('[data-split="heading"]').forEach((heading) => {
    let trigger = null;
    const split = SplitText.create(heading, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      linesClass: "line",
      onSplit(self) {
        trigger?.kill();
        gsap.set(heading, { visibility: "visible" });
        const reveal = gsap.from(self.lines, {
          yPercent: LINE_REVEAL.yPercent,
          duration: LINE_REVEAL.duration,
          stagger: LINE_REVEAL.stagger,
          ease: LINE_REVEAL.ease,
          paused: true,
        });
        trigger = ScrollTrigger.create({
          trigger: heading,
          start: LINE_REVEAL.start,
          once: true,
          onEnter: () => pageShown.then(() => reveal.play()),
        });
        // A heading near the top of its page has its start clamped to the
        // top, which a page arriving at the top sits exactly on and
        // ScrollTrigger does not count as entered; once the page is seen,
        // any heading the scroll has already reached rises too.
        const own = trigger;
        pageShown.then(() => {
          if (own === trigger && own.scroll() >= own.start) reveal.play();
        });
        return reveal;
      },
    });

    registerPageCleanup(() => {
      trigger?.kill();
      split.revert();
      gsap.set(heading, { clearProps: "visibility" });
    });
  });
}

/* ============================================================
   Stack cards — the Stack Diagnostic hero's card wall rising in
   ============================================================
   The cards (StackCard.astro, stack-cards.css) rise a little and fade
   into place as they come up the screen, a row at a time, each row left
   to right: those in the first screen as the page is uncovered
   (pageShown), the row peeking at its foot among them, and the rest as
   each one's top edge comes up over the screen's foot. Each card once,
   on the line reveal's ease and length. Only
   their transform and opacity move, cleared once a card has arrived,
   so its hover is its own; held by opacity alone, never visibility, so
   the keyboard still reaches a card not yet risen (and scrolls it up,
   which raises it). With reduced motion, or in the Studio's preview,
   the cards are simply there.
   ============================================================ */
const CARD_REVEAL = { rise: 1.5, duration: 0.9, stagger: 0.08, ease: "power3.out", start: "top bottom" };

function initStackCards(container) {
  if (reducedMotion || document.documentElement.hasAttribute("data-draft")) return;

  container.querySelectorAll("[data-stack-cards]").forEach((wall) => {
    // Each card's cell is what is watched, so where a card is waiting
    // (lowered) never moves where it counts as having come up the screen.
    const cells = [...wall.children].filter((cell) => cell.querySelector(".stack-card"));
    const cards = cells.map((cell) => cell.querySelector(".stack-card"));
    if (!cards.length) return;
    // the rise, in rem, so it scales with the page (scaling.css)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    gsap.set(cards, { opacity: 0, y: CARD_REVEAL.rise * rem });
    // set to rise: the stylesheet's hold on them lets go
    wall.setAttribute("data-stack-cards-ready", "");

    const triggers = ScrollTrigger.batch(cells, {
      start: CARD_REVEAL.start,
      once: true,
      onEnter: (batch) => pageShown.then(() => gsap.to(batch.map((cell) => cell.querySelector(".stack-card")), {
        opacity: 1,
        y: 0,
        duration: CARD_REVEAL.duration,
        stagger: CARD_REVEAL.stagger,
        ease: CARD_REVEAL.ease,
        clearProps: "transform,opacity",
      })),
    });

    registerPageCleanup(() => {
      triggers.forEach((t) => t.kill());
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: "transform,opacity" });
      wall.removeAttribute("data-stack-cards-ready");
    });
  });
}

/* ============================================================
   Service drawings — the routes' drawings in the service tabs
   ============================================================
   The easing of a scroll to one of the service tabs' routes (initServiceTabs),
   and the drawings' two parts, mounted per page and torn down with it. */
// a scroll taken to a route: ease in and out (cubic)
const STACK_EASE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
   down with it. The page registry runs while the transition panel
   still covers the viewport and the container is mid-flight, so one
   more layout is taken on the far side of the next paint, once the
   hero has its settled size.
   ============================================================ */
function initSlashField(container) {
  container.querySelectorAll("[data-slash-field]").forEach((el) => {
    const field = mountSlashField(el);
    const settle = requestAnimationFrame(() => requestAnimationFrame(() => field.refresh()));
    registerPageCleanup(() => {
      cancelAnimationFrame(settle);
      field.destroy();
    });
  });
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
function initFooterParallax(container) {
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
function initHeroParallax(container) {
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
function parallaxTravel(inner) {
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
function scrubTween(target, from, to, scrollTrigger) {
  return gsap.fromTo(target, from, { ...to, ease: "none", scrollTrigger });
}

/* ============================================================
   filter groups — the archive filters on Reports and Newsletter
   ============================================================ */
/* A group is any element holding both the buttons ([data-filter-target])
   and the things they filter ([data-filter-name]).

   Two axes, both read off the group:
     data-filter-target-match  single | multi  — one button at a time, or
                                                 several selected together
     data-filter-name-match    single | multi  — with several selected, AND
                                                 across them, or OR

   An item's tokens can be written on it directly, or collected from
   whichever children carry [data-filter-name-collect] — which is how both
   archives do it, so the token comes off the category chip already on the
   card rather than being repeated in a second attribute.

   Bound from the page registry (initPage) rather than DOMContentLoaded: Barba
   replaces the container on every navigation, so a one-shot listener on
   the document would only ever wire up the first page loaded. */
function initFilterGroups(container) {
  // Matches the out transition in the stylesheet — the item is faded before
  // its state flips, so a row never re-flows under a visible card.
  const transitionDelay = reducedMotion ? 0 : 300;
  const groups = [...container.querySelectorAll('[data-filter-group]')];

  groups.forEach(group => {
    const targetMatch = (group.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
    const nameMatch   = (group.getAttribute('data-filter-name-match')   || 'multi').trim().toLowerCase();

    const buttons = [...group.querySelectorAll('[data-filter-target]')];
    const items   = [...group.querySelectorAll('[data-filter-name]')];

    // Collect tokens from children if present
    items.forEach(item => {
      const collectors = item.querySelectorAll('[data-filter-name-collect]');
      if (!collectors.length) return;
      const seen = new Set(), tokens = [];
      collectors.forEach(c => {
        const v = (c.getAttribute('data-filter-name-collect') || '').trim().toLowerCase();
        if (v && !seen.has(v)) {
          seen.add(v);
          tokens.push(v);
        }
      });
      if (tokens.length) item.setAttribute('data-filter-name', tokens.join(' '));
    });

    // Cache item tokens
    const itemTokens = new Map();
    items.forEach(el => {
      const raw = (el.getAttribute('data-filter-name') || '').trim().toLowerCase();
      const tokens = raw ? raw.split(/\s+/).filter(Boolean) : [];
      itemTokens.set(el, new Set(tokens));
    });

    const setItemState = (el, on) => {
      const next = on ? 'active' : 'not-active';
      if (el.getAttribute('data-filter-status') !== next) {
        el.setAttribute('data-filter-status', next);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      }
    };

    const setButtonState = (btn, on) => {
      const next = on ? 'active' : 'not-active';
      if (btn.getAttribute('data-filter-status') !== next) {
        btn.setAttribute('data-filter-status', next);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    };

    // Active tags model
    let activeTags = targetMatch === 'single' ? null : new Set(['all']);

    const hasRealActive = () => {
      if (targetMatch === 'single') return activeTags !== null;
      return activeTags.size > 0 && !activeTags.has('all');
    };

    const resetAll = () => {
      if (targetMatch === 'single') {
        activeTags = null;
      } else {
        activeTags.clear();
        activeTags.add('all');
      }
    };

    // Matching logic
    const itemMatches = (el) => {
      if (!hasRealActive()) return true;
      const tokens = itemTokens.get(el);

      if (targetMatch === 'single') {
        return tokens.has(activeTags);
      } else {
        const selected = [...activeTags];
        if (nameMatch === 'single') {
          // AND logic: must contain all selected
          for (let i = 0; i < selected.length; i++) {
            if (!tokens.has(selected[i])) return false;
          }
          return true;
        } else {
          // OR logic: must contain any selected
          for (let i = 0; i < selected.length; i++) {
            if (tokens.has(selected[i])) return true;
          }
          return false;
        }
      }
    };

    // `force` is the one addition to the reference: its guard makes the
    // opening paint('all') a no-op, since nothing is selected yet, and the
    // group would render with no state written at all — no active pill and
    // no aria on any card. It still guards every user click.
    const paint = (rawTarget, force) => {
      const target = (rawTarget || '').trim().toLowerCase();
      if (!force && (target === 'all' || target === 'reset') && !hasRealActive()) return;

      if (target === 'all' || target === 'reset') {
        resetAll();
      } else if (targetMatch === 'single') {
        activeTags = target;
      } else {
        if (activeTags.has('all')) activeTags.delete('all');
        if (activeTags.has(target)) activeTags.delete(target);
        else activeTags.add(target);
        if (activeTags.size === 0) resetAll();
      }

      // Update items
      items.forEach(el => {
        if (el._ft) clearTimeout(el._ft);
        const next = itemMatches(el);
        const cur = el.getAttribute('data-filter-status');
        if (cur === 'active' && transitionDelay > 0) {
          el.setAttribute('data-filter-status', 'transition-out');
          el._ft = setTimeout(() => { setItemState(el, next); el._ft = null; }, transitionDelay);
        } else if (transitionDelay > 0) {
          el._ft = setTimeout(() => { setItemState(el, next); el._ft = null; }, transitionDelay);
        } else {
          setItemState(el, next);
        }
      });

      // Update buttons
      buttons.forEach(btn => {
        const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
        let on = false;
        if (t === 'all') on = !hasRealActive();
        else if (t === 'reset') on = hasRealActive();
        else on = targetMatch === 'single' ? activeTags === t : activeTags.has(t);
        setButtonState(btn, on);
      });
    };

    group.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter-target]');
      if (btn && group.contains(btn)) paint(btn.getAttribute('data-filter-target'));
    });

    // The pending state flips are the only thing that outlives the page —
    // the listener goes with the container Barba removes.
    registerPageCleanup(() => {
      items.forEach(el => { if (el._ft) { clearTimeout(el._ft); el._ft = null; } });
    });

    paint('all', true);
  });
}
