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
import { initLogoStackLoader } from "./logo-stack-loader.js";
import { initLogoMorphLoader } from "./logo-morph-loader.js";
import { LETTER_COUNT, morphPath, getMorphEase } from "./logo-morph.js";
import { mountSlashField, DECODE } from "./slash-field.js";
import { mountApproachStack } from "./approach-stack.js";

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, Draggable, InertiaPlugin, ScrambleTextPlugin);

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
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

// Smooth scroll, driven by the GSAP ticker rather than its own rAF so the
// transition can stop and restart it around a navigation. The lerp sets the
// glide: at 0.14 a wheel step settles in about a third of a second — a touch
// smoother than 0.165, still quick enough not to trail the hand.
const lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1.25 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// The wipe panel lives outside the Barba container, so it is looked up once.
const wipe = {
  panel: document.querySelector("[data-transition-panel]"),
  label: document.querySelector("[data-transition-label]"),
  labelText: document.querySelector("[data-transition-label-text]"),
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

// First-load logo intro: the Logo Morph Loader, or the Logo Stack Loader it
// iterates on, whichever the layout's <head> marked this load for. The page
// is set up underneath it from the first frame, so the loader's background
// clears straight onto the settled page. Nested in this timeline so once()
// waits for all of it, which keeps Barba from starting a navigation while the
// intro is playing.
function runIntro(next) {
  const tl = gsap.timeline();

  tl.call(resetPage, [next], 0);

  // On the homepage the morph loader plays out in the hero's own field, so
  // it is handed the hero's band.
  const loader = document.documentElement.dataset.loader === "stack"
    ? initLogoStackLoader()
    : initLogoMorphLoader(undefined, { hero: next.querySelector(".hero__media[data-slash-field]") });
  if (loader) tl.add(loader, 0);

  // The morph loader holds the page still under it — a wheel turned during
  // the intro would otherwise scroll the page it is about to reveal — and
  // hands scrolling back as its ground starts to lift, or once the hero has
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

// Both intros go, the one that played and the one that did not. Tweens are
// killed first so nothing still queued can write style back onto a detached
// node.
function removeLoader() {
  document.querySelectorAll("[data-logo-loader-init], [data-morph-loader]").forEach(loader => {
    gsap.killTweensOf([loader, ...loader.querySelectorAll("*")]);
    loader.remove();
  });
}



// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

// The leave animation runs before the destination page has been fetched, so
// there is no container to read data-page-name off yet. Derive the label from
// the URL instead: title-casing the slug covers most of the site, and these
// are the pages whose name is not simply their slug (mirrors the pageName each
// page in src/pages passes to its layout).
const PAGE_NAMES = {
  "index": "Home",
  "workshops-audits": "Workshops & Audits",
  "software-licensing-audit": "Software & Licensing Audit",
  "report-template": "BIM 2.0 Report",
  "newsletter-template": "AI in Architecture",
};

function pageNameFromUrl(href) {
  let slug = "index";

  try {
    const path = new URL(href, location.href).pathname;
    slug = path.split("/").pop().replace(/\.html$/, "") || "index";
  } catch (err) {
    return "Hi there";
  }

  return PAGE_NAMES[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// The label's brief scramble, in the hero field's hex (DECODE in
// slash-field.js) through GSAP's ScrambleTextPlugin, word by word: the
// plugin fills spaces too, so a label scrambled whole could break onto
// different lines while it decodes. Each word keeps its own length in the
// mono face, so nothing moves.
const LABEL_SCRAMBLE = { chars: DECODE.chars, speed: DECODE.speed };

function setLabel(name) {
  wipe.labelText.replaceChildren(...name.split(" ").flatMap((word, i) => {
    const span = document.createElement("span");
    span.textContent = word;
    return i ? [" ", span] : [span];
  }));
}

function labelWords() {
  // a "reveal" arrival opens on the name as the page was built with it
  if (!wipe.labelText.children.length) setLabel(wipe.labelText.textContent.trim());
  return [...wipe.labelText.children];
}

function runPageLeaveAnimation(current, nextHref) {
  // A navigation that starts while the panel is still settling from the last
  // one would otherwise fight the tweens already on it.
  gsap.killTweensOf([wipe.panel, wipe.label, ...wipe.labelText.children]);

  setLabel(pageNameFromUrl(nextHref));

  const tl = gsap.timeline({
    onComplete: () => current.remove()
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(wipe.panel, { autoAlpha: 1 }, 0);
  tl.fromTo(wipe.panel, { yPercent: 0 }, { yPercent: -100, duration: 0.8 }, 0);
  tl.fromTo(wipe.label, { autoAlpha: 0 }, { autoAlpha: 1 }, "<+=0.2");
  // the name decodes as it fades in, resolved well before the panel covers
  tl.to(labelWords(), {
    duration: 0.4,
    ease: "none",
    scrambleText: { text: "{original}", ...LABEL_SCRAMBLE, revealDelay: 0.12 },
  }, "<");
  tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: 0.8 }, 0);

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
    gsap.set(wipe.panel, { autoAlpha: 0 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  // Barba no longer runs leave and enter together, so the wait before the
  // panel leaves is measured from the moment the screen is covered, not from
  // the start of the wipe. Same pause on screen as before.
  tl.add("startEnter", 0.45);

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

  tl.fromTo(wipe.panel, {
    yPercent: -100,
  }, {
    yPercent: -200,
    duration: 1,
    overwrite: "auto",
    immediateRender: false
  }, "startEnter");

  tl.set(wipe.panel, { autoAlpha: 0 }, ">");

  tl.fromTo(wipe.label, {
    autoAlpha: 1
  }, {
    autoAlpha: 0,
    duration: 0.4,
    overwrite: "auto",
    immediateRender: false
  }, "startEnter+=0.1");

  // and scrambles again as it goes, never resolving before it has faded
  tl.to(labelWords(), {
    duration: 0.4,
    ease: "none",
    scrambleText: { text: "{original}", ...LABEL_SCRAMBLE, revealDelay: 0.4 },
  }, "startEnter+=0.1");

  tl.from(next, { y: "15vh", duration: 1 }, "startEnter");

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
  ["[data-approach-stack]", initApproachStack],
  ["[data-problem-grid-init]", initProblemGrid],
  ["[data-testimonial-wrap]", initLineRevealTestimonials],
  ["[data-shutter-scroll-transition]", initShutterScrollTransition],
  ["[data-accordion-init]", initAccordions],
  ["[data-dots-canvas-init]", initInteractiveDotsGrid],
  ["[data-slash-field]", initSlashField],
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
  lenis.stop();
  resetScroll();

  // The incoming container is in normal flow — the outgoing one is already
  // gone by this point — so the height hold has done its job and can be
  // released here rather than at the reveal.
  document.documentElement.style.minHeight = "";

  initPage(data.next.container);

  lenis.resize();
  ScrollTrigger.refresh();

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
  // The panel opens as one considered move: the container heights out on the
  // site's own osmo ease while the content settles in behind it. The stagger
  // is deliberately near-nothing — enough to stop the items landing on a
  // single hard frame, not enough to read as a cascade.
  const DUR = {
    bgMorph: 0.45,
    contentIn: 0.35,
    contentOut: 0.2,
    stagger: 0.06,
    backdropIn: 0.35,
    backdropOut: 0.25,
    openScale: 0.45,
    closeScale: 0.3,
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
  const [lineTop, lineMid, lineBot] = ["top", "mid", "bot"].map(
    (id) => document.querySelector(`[data-burger-line='${id}']`)
  );

  if (!menuWrap || !navList || !dropWrapper) return;

  // State
  const state = {
    isOpen: false,
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
  const getIndex = (name) => toggles.indexOf(getToggle(name));
  const stagger = (n) => (n <= 1 ? 0 : { amount: DUR.stagger });

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
    gsap.killTweensOf(dropContainer);
    gsap.killTweensOf(backdrop);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function killMobile() {
    killTl("mobileTl");
    gsap.killTweensOf([navList, lineTop, lineMid, lineBot]);
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

  function resetDesktop() {
    panels.forEach((p) => {
      gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", x: 0, y: 0, xPercent: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0, xPercent: 0 });
    });

    gsap.set(dropContainer, { height: 0, clearProps: "transform" });
    gsap.set(backdrop, { autoAlpha: 0 });

    menuWrap.setAttribute("data-menu-open", "false");
    resetToggles();
  }

  function setupMobile() {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: "visible", pointerEvents: "none" });
      gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 });
    });
    gsap.set(navItems, { xPercent: 0, y: 0, autoAlpha: 1 });
    gsap.set(navList, { autoAlpha: 0, x: 0 });
    gsap.set(backBtn, { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 1 });
    gsap.set(dropContainer, { clearProps: "height" });
    gsap.set(backdrop, { autoAlpha: 0 });
  }

  function measurePanel(name) {
    const el = getPanel(name);
    if (!el) return 0;
    const s = el.style;
    const prev = [s.visibility, s.opacity, s.pointerEvents];
    Object.assign(s, { visibility: "visible", opacity: "0", pointerEvents: "none" });
    const h = el.getBoundingClientRect().height;
    [s.visibility, s.opacity, s.pointerEvents] = prev;
    return h;
  }

  // DESKTOP — open dropdown (first open)
  function openDropdown(panelName) {
    if (state.navigating) return;
    if (state.isOpen && state.activePanel === panelName) return;
    if (state.isOpen) return switchPanel(state.activePanel, panelName);

    const height = measurePanel(panelName);
    if (!height) return;

    killDropdown();
    resetDesktop();

    const el = getPanel(panelName);
    const fade = getFade(el);
    const toggle = getToggle(panelName);

    state.isOpen = true;
    state.activePanel = panelName;
    menuWrap.setAttribute("data-menu-open", "true");
    if (toggle) toggle.setAttribute("aria-expanded", "true");

    gsap.set(dropContainer, { height: 0 });

    const tl = gsap.timeline();
    state.tl = tl;
    tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: "power2.out" }, 0);
    tl.to(dropContainer, { height, duration: DUR.openScale, ease: "osmo" }, 0);
    tl.set(el, { visibility: "visible", opacity: 1, pointerEvents: "auto" }, 0.05);
    if (fade.length) {
      tl.fromTo(fade,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: DUR.contentIn, stagger: stagger(fade.length), ease: "power2.out" },
        0.12
      );
    }
  }

  // DESKTOP — close dropdown
  function closeDropdown() {
    if (!state.isOpen || state.navigating) return;
    const el = getPanel(state.activePanel);
    const fade = el ? getFade(el) : [];

    killDropdown();

    const tl = gsap.timeline({
      onComplete() {
        state.isOpen = false;
        state.activePanel = null;
        state.tl = null;
        resetDesktop();
      },
    });
    state.tl = tl;
    if (fade.length) tl.to(fade, { autoAlpha: 0, y: -4, duration: DUR.contentOut * 0.7, ease: "power2.in" }, 0);
    tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: "osmo" }, 0.05);
    tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: "power2.out" }, 0);
    if (el) tl.set(el, { visibility: "hidden", opacity: 0, pointerEvents: "none" });
  }

  // DESKTOP — switch panel (directional)
  function switchPanel(fromName, toName) {
    const dir = getIndex(toName) > getIndex(fromName) ? 1 : -1;
    const fromEl = getPanel(fromName), toEl = getPanel(toName);
    if (!fromEl || !toEl) return;

    const fromFade = getFade(fromEl), toFade = getFade(toEl);
    const toHeight = measurePanel(toName);
    if (!toHeight) return;

    killDropdown();

    panels.forEach((p) => {
      gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
    });
    gsap.set(fromEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", x: 0 });
    if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
    gsap.set(backdrop, { autoAlpha: 1 });

    const toToggle = getToggle(toName);
    state.activePanel = toName;
    resetToggles();
    if (toToggle) toToggle.setAttribute("aria-expanded", "true");

    const xOut = dir * -30, xIn = dir * 30;
    const tl = gsap.timeline();
    state.tl = tl;

    if (fromFade.length) tl.to(fromFade, { autoAlpha: 0, x: xOut, duration: DUR.contentOut, ease: "power2.in" }, 0);
    tl.set(fromEl, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 }, DUR.contentOut);
    if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut);
    tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: "osmo" }, 0.05);
    tl.set(toEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", xPercent: 0 }, DUR.contentOut * 0.5);
    if (toFade.length) {
      tl.fromTo(toFade,
        { autoAlpha: 0, x: xIn },
        { autoAlpha: 1, x: 0, duration: DUR.contentIn, stagger: stagger(toFade.length), ease: "power3.out" },
        DUR.contentOut * 0.6
      );
    }
  }

  // DESKTOP — hover intent
  function handleToggleEnter(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
  }

  function handleToggleLeave() {
    if (state.isMobile) return;
    clearTimeout(state.hoverTimer); state.hoverTimer = null;
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  function handleWrapperEnter() {
    if (state.isMobile) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
  }

  function handleWrapperLeave() {
    if (state.isMobile) return;
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
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

  // MOBILE — burger animation
  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    if (toX) {
      tl.to(lineTop, { y: "0.3125em", duration: 0.15 }, 0);
      tl.to(lineBot, { y: "-0.3125em", duration: 0.15 }, 0);
      tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
      tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
      tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
    } else {
      tl.to(lineTop, { rotation: 0, duration: 0.2 }, 0);
      tl.to(lineBot, { rotation: 0, duration: 0.2 }, 0);
      tl.to(lineTop, { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineBot, { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
    }
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
    if (!state.isMobile || !state.mobileMenuOpen) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (name) { e.preventDefault(); openMobilePanel(name); }
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
        gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 });
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
      state.isOpen = false;
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
        gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 });

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
        state.isOpen = false; state.activePanel = null;
        clearTimers();
        menuWrap.setAttribute("data-menu-open", "false");
        resetToggles();
        setupMobile();
      }

    }, 150);
  }

  // EVENT BINDING
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
   Nav reveal — the bar steps out of the way on the way down
   ============================================================
   Scrolling down, the nav slides up out of view; the moment the
   page moves back up, it slides back in. It is always there within
   its own height of the top of the page, while a menu or dropdown
   is open, whenever focus is inside it, and on every new page.

   Read off window scroll, which Lenis drives for the wheel and a
   trackpad and the browser does natively for touch, so all three
   behave the same. A few pixels of travel in one direction count
   before it turns, so a jittery trackpad or a scroll bouncing off
   the end of the page never flickers it. The slide is a GSAP tween
   of the nav's own y; once it is back, the transform is cleared,
   because a transformed nav would become the containing block for
   the fixed drawer and backdrop inside it.
   ============================================================ */
function initNavReveal() {
  const nav = document.querySelector("[data-menu-wrap]");
  if (!nav) return;

  const TRAVEL = 6;
  let hidden = false;
  let lastY = window.scrollY;
  let travel = 0;

  const duration = () => (reducedMotionQuery.matches ? 0 : 0.45);

  // How far up it goes: its own height, rounded up to whole device pixels.
  // The bar's height is fluid (4.3em on the scaling system's size), so it is
  // rarely a whole number of device pixels — 68.79px is 103.19 of them at
  // 1.5x. Moved up by exactly that, its last, partly covered row of pixels
  // ends on the screen's top edge, and once the compositor snaps the layer
  // to the pixel grid that row shows as a sliver of the bar. Rounding the
  // distance up to the next whole device pixel takes that row with it.
  const outOfView = () => {
    const dpr = window.devicePixelRatio || 1;
    return -Math.ceil(nav.getBoundingClientRect().height * dpr) / dpr;
  };

  function show(immediate) {
    if (!hidden && !immediate) return;
    hidden = false;
    gsap.to(nav, {
      y: 0,
      duration: immediate ? 0 : duration(),
      ease: "power3.out",
      overwrite: true,
      onComplete: () => gsap.set(nav, { clearProps: "transform" }),
    });
  }

  function hide() {
    if (hidden) return;
    // Nothing that is open, or being used from the keyboard, goes out of
    // view. Keyboard focus only: a link clicked in the bar keeps focus
    // after Barba has moved on to its page, and holding the bar for that
    // left it pinned on every page reached from the nav.
    if (nav.getAttribute("data-menu-open") === "true" || nav.querySelector(":focus-visible")) return;
    hidden = true;
    gsap.to(nav, { y: outOfView(), duration: duration(), ease: "power3.out", overwrite: true });
  }

  // the bar's height and the pixel ratio both change with the window (and
  // with the browser's zoom), so a hidden bar is put back out of view
  window.addEventListener("resize", () => {
    if (hidden) gsap.set(nav, { y: outOfView(), overwrite: true });
  });

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    // overscroll at either end of the page is not a change of direction
    const y = Math.min(Math.max(window.scrollY, 0), Math.max(max, 0));
    const dy = y - lastY;
    lastY = y;

    if (y <= nav.offsetHeight) {
      travel = 0;
      show();
      return;
    }
    if (!dy) return;
    travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
    if (travel > TRAVEL) hide();
    else if (travel < -TRAVEL) show();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  nav.addEventListener("focusin", () => show());
  // a new page always opens with the nav in place — at the top, or where a
  // reload put it back (an earlier beforeEnter), which is no scroll down
  barba.hooks.beforeEnter(() => {
    lastY = window.scrollY;
    travel = 0;
    show(true);
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
   reflow, the transition back, and the block brought to rest — and
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
  const out = {
    top: "translateY(calc(-100% - 1px))",
    bottom: "translateY(calc(100% + 1px))",
  };

  root.querySelectorAll(".nav-link").forEach((link) => {
    const bg = link.querySelector(".nav-link__bg");
    if (!bg || link.navLinkBound) return;
    link.navLinkBound = true;

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
      bg.style.transition = "none";
      bg.style.transform = "";
      void bg.offsetWidth;
      bg.style.transition = "";
    };

    link.addEventListener("mouseenter", (event) => {
      if (!finePointer.matches) return;
      if (held()) return handBack();
      if (leaving) {
        // caught on its way out: it turns round from where it is
        clearTimeout(leaving);
        leaving = 0;
      } else {
        bg.style.transition = "none";
        bg.style.transform = out[edge(event)];
        void bg.offsetWidth;
        bg.style.transition = "";
      }
      bg.style.transform = "translateY(0)";
    });

    link.addEventListener("mouseleave", (event) => {
      if (!finePointer.matches) return;
      if (held()) return handBack();
      bg.style.transform = out[edge(event)];
      clearTimeout(leaving);
      leaving = setTimeout(handBack, 650);
    });

    // keyboard focus brings the block in from wherever it is
    link.addEventListener("focus", () => {
      clearTimeout(leaving);
      leaving = 0;
      bg.style.transform = "";
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
function initApproachStack(container) {
  container.querySelectorAll("[data-approach-stack]").forEach((el) => {
    const stack = mountApproachStack(el, { lenis });
    registerPageCleanup(() => stack.destroy());
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
        // The Barba container carries a transform and will-change,
        // which makes it the containing block for anything fixed —
        // the default pinType would drop the pinned card at the top
        // of the container instead of holding it in the viewport.
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
   Line reveal testimonials — masked lines, one slide at a time
   ============================================================
   The reference component's logic is kept as shipped: the slides
   stack in one grid cell, SplitText masks each slide's lines, and
   a change wipes the outgoing lines up and the incoming lines in
   behind them, with the same durations, eases and staggers. Its
   counter, autoplay, arrow buttons, arrow-key handling and the
   in-view ScrollTrigger are all unchanged.

   Three adaptations so it lives in this codebase:

     - it is queried against the Barba container, not document, and
       runs from the page registry rather than DOMContentLoaded;
     - its listeners, ScrollTrigger, autoplay call and splits are
       torn down through registerPageCleanup, so nothing outlives
       the DOM it measured;
     - the portrait's circular clip becomes a straight fade, since
       what sits there is a logo on a square tile, not a face.
   ============================================================ */
function initLineRevealTestimonials(container) {
  container.querySelectorAll("[data-testimonial-wrap]").forEach((wrap) => {
    const list = wrap.querySelector("[data-testimonial-list]");
    if (!list) return;

    const items = Array.from(list.querySelectorAll("[data-testimonial-item]"));
    if (!items.length) return;

    const btnPrev = wrap.querySelector("[data-prev]");
    const btnNext = wrap.querySelector("[data-next]");
    const elCurrent = wrap.querySelector("[data-current]");
    const elTotal = wrap.querySelector("[data-total]");

    if (elTotal) elTotal.textContent = String(items.length);

    let activeIndex = items.findIndex((el) => el.classList.contains("is--active"));
    if (activeIndex < 0) activeIndex = 0;

    let isAnimating = false;
    const reduceMotion = reducedMotion;

    const autoplayEnabled = wrap.getAttribute("data-autoplay") === "true";
    const autoplayDuration = parseInt(wrap.getAttribute("data-autoplay-duration"), 10) || 4000;

    let autoplayCall = null;
    let isInView = true;

    const slides = items.map((item) => ({
      item,
      image: item.querySelector("[data-testimonial-img]"),

      splitTargets: [
        item.querySelector("[data-testimonial-text]"),
        ...item.querySelectorAll("[data-testimonial-split]"),
      ].filter(Boolean),

      splitInstances: [],

      getLines() {
        return this.splitInstances.flatMap((instance) => instance.lines);
      },
    }));

    function setSlideState(slideIndex, isActive) {
      const { item } = slides[slideIndex];
      item.classList.toggle("is--active", isActive);
      item.setAttribute("aria-hidden", String(!isActive));
      gsap.set(item, {
        autoAlpha: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
      });
    }

    function updateCounter() {
      if (elCurrent) elCurrent.textContent = String(activeIndex + 1);
    }

    function startAutoplay() {
      if (!autoplayEnabled || slides.length < 2) return;
      if (autoplayCall) autoplayCall.kill();

      autoplayCall = gsap.delayedCall(autoplayDuration / 1000, () => {
        if (!isInView || isAnimating) {
          startAutoplay();
          return;
        }
        goTo((activeIndex + 1) % slides.length);
        startAutoplay();
      });
    }

    function pauseAutoplay() {
      if (autoplayCall) autoplayCall.pause();
    }

    function resumeAutoplay() {
      if (!autoplayEnabled) return;
      if (!autoplayCall) startAutoplay();
      else autoplayCall.resume();
    }

    function resetAutoplay() {
      if (!autoplayEnabled) return;
      startAutoplay();
    }

    // Set initial state
    slides.forEach((_, i) => setSlideState(i, i === activeIndex));
    updateCounter();

    // Create SplitText instances
    slides.forEach((slide, slideIndex) => {
      slide.splitInstances = slide.splitTargets.map((el) =>
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "text-line",
          autoSplit: true,
          onSplit(self) {
            if (reduceMotion) return;

            const isActive = slideIndex === activeIndex;
            gsap.set(self.lines, { yPercent: isActive ? 0 : 110 });

            if (slide.image) {
              gsap.set(slide.image, { autoAlpha: isActive ? 1 : 0 });
            }
          },
        })
      );
    });

    function goTo(nextIndex) {
      if (isAnimating || nextIndex === activeIndex) return;
      isAnimating = true;

      const outgoingSlide = slides[activeIndex];
      const incomingSlide = slides[nextIndex];

      const tl = gsap.timeline({
        onComplete: () => {
          setSlideState(activeIndex, false);
          setSlideState(nextIndex, true);
          activeIndex = nextIndex;
          updateCounter();
          isAnimating = false;
        },
      });

      if (reduceMotion) {
        tl.to(outgoingSlide.item, {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2"
          }, 0)
          .fromTo(incomingSlide.item, {
            autoAlpha: 0
          }, {
            autoAlpha: 1,
            duration: 0.4,
            ease: "power2"
          }, 0);

        return;
      }

      const outgoingLines = outgoingSlide.getLines();
      const incomingLines = incomingSlide.getLines();

      gsap.set(incomingSlide.item, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(incomingLines, { yPercent: 110 });

      if (outgoingSlide.image) gsap.set(outgoingSlide.image, { autoAlpha: 1 });

      tl.to(outgoingLines, {
        yPercent: -110,
        duration: 0.6,
        ease: "power4.inOut",
        stagger: { amount: 0.25 },
      }, 0);

      if (outgoingSlide.image) {
        tl.to(outgoingSlide.image, {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power2.inOut",
        }, 0);
      }

      tl.to(incomingLines, {
        yPercent: 0,
        duration: 0.7,
        ease: "power4.inOut",
        stagger: { amount: 0.4 },
      }, ">-=0.3");

      if (incomingSlide.image) {
        tl.fromTo(incomingSlide.image, {
          autoAlpha: 0,
        }, {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.inOut",
        }, "<");
      }

      tl.set(outgoingSlide.item, { autoAlpha: 0 }, ">");
    }

    // Start autoplay on the wrap (only works if autoplay is set to 'true')
    startAutoplay();

    const onNext = () => {
      resetAutoplay();
      goTo((activeIndex + 1) % slides.length);
    };
    const onPrev = () => {
      resetAutoplay();
      goTo((activeIndex - 1 + slides.length) % slides.length);
    };

    if (btnNext) btnNext.addEventListener("click", onNext);
    if (btnPrev) btnPrev.addEventListener("click", onPrev);

    function onKeyDown(e) {
      if (!isInView) return;

      // Don't hijack arrow keys while user is typing.
      const t = e.target;
      const isTypingTarget =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);

      if (isTypingTarget) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      }
    }

    // Listen for left/right arrows
    window.addEventListener("keydown", onKeyDown);

    // Enable/disable keyboard + autoplay depending on scroll position
    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        isInView = true;
        resumeAutoplay();
      },
      onEnterBack: () => {
        isInView = true;
        resumeAutoplay();
      },
      onLeave: () => {
        isInView = false;
        pauseAutoplay();
      },
      onLeaveBack: () => {
        isInView = false;
        pauseAutoplay();
      },
    });

    registerPageCleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
      if (btnNext) btnNext.removeEventListener("click", onNext);
      if (btnPrev) btnPrev.removeEventListener("click", onPrev);
      if (autoplayCall) autoplayCall.kill();
      trigger.kill();
      slides.forEach((slide) => slide.splitInstances.forEach((instance) => instance.revert()));
    });
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
   Problem grid — three columns released as the row arrives
   ============================================================
   The columns are held down by CSS until the row is properly in
   view; this only flips the status attribute that releases them,
   once, and then stops observing. Scoped to the Barba container
   and disconnected on leave.
   ============================================================ */
function initProblemGrid(container) {
  const grids = container.querySelectorAll("[data-problem-grid-init]");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute("data-problem-grid-status", "in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  grids.forEach((grid) => observer.observe(grid));
  registerPageCleanup(() => observer.disconnect());
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
   Slash field — the homepage hero's pattern (slash-field.js)
   ============================================================
   Mounted per page, like everything in the registry, and torn
   down with it. The page registry runs while the transition panel
   still covers the viewport and the container is mid-flight, so,
   as with the dots grid below, one more layout is taken on the far
   side of the next paint, once the hero has its settled size.
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
   Interactive dots grid — canvas background behind the hero
   ============================================================
   The reference component as supplied, with the adaptations this
   codebase needs: it is scoped to the Barba container and called
   from the page registry rather than DOMContentLoaded, and every
   listener, observer and rAF it opens is handed to
   registerPageCleanup, so navigating away cannot leave a frame
   loop running against a canvas that has left the document.

   The pointer work is already gated behind (hover: hover) and
   (pointer: fine), so on touch the grid paints once per resize
   and never starts a loop.
   ============================================================ */
function initInteractiveDotsGrid(container) {
  const elements = container.querySelectorAll("[data-dots-canvas-init]");

  const gap = "1em";
  const dotSize = "0.125em";
  const shape = "circle";
  const dotColorInactive = "rgba(0, 0, 0, 0.2)";
  const dotColorActive = "rgba(0, 0, 0, 0.75)";
  const dotMaxScale = 1.75;
  const pressScale = 1.5;
  const hoverRadius = 12;
  const easeDuration = 0.5;

  const hasPointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const pointer = { x: 0, y: 0, cx: 0, cy: 0, active: false };
  const hover = { value: 0, from: 0, to: 0, start: 0 };
  const press = { value: 0, from: 0, to: 0, start: 0 };
  const canvases = [];

  let dpr, size, spacing, radius, raf, lastTime = performance.now();

  function toPx(value, element) {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;width:" + value + ";";
    element.appendChild(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  }

  function parseColor(color, element) {
    const probe = document.createElement("span");
    probe.style.color = color;
    element.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = resolved;
    ctx.fillRect(0, 0, 1, 1);

    const data = [...ctx.getImageData(0, 0, 1, 1).data];
    data[3] /= 255;
    return data;
  }

  function mixColor(a, b, p) {
    return "rgba(" + a.map((v, i) => v + (b[i] - v) * p).join(",") + ")";
  }

  function setEase(state, to) {
    Object.assign(state, { from: state.value, to, start: performance.now() });
  }

  function updateEase(state, time) {
    if (!easeDuration) return (state.value = state.to);
    const p = Math.min(Math.max((time - state.start) / (easeDuration * 1000), 0), 1);
    state.value = state.from + (state.to - state.from) * (1 - Math.pow(1 - p, 4));
  }

  elements.forEach((element) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    });

    if (getComputedStyle(element).position === "static") element.style.position = "relative";

    element.prepend(canvas);
    canvases.push({
      element, canvas, ctx, width: 0, height: 0, visible: false,
      inactive: parseColor(element.getAttribute("data-dots-color-inactive") || dotColorInactive, element),
      active: parseColor(element.getAttribute("data-dots-color-active") || dotColorActive, element)
    });
  });

  function pointerInside() {
    return canvases.some(({ element }) => {
      const r = element.getBoundingClientRect();
      return pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
    });
  }

  function render(state, origin) {
    const rect = state.element.getBoundingClientRect();
    const left = rect.left - origin.left;
    const top = rect.top - origin.top;
    const px = pointer.cx - origin.left;
    const py = pointer.cy - origin.top;
    const maxScale = dotMaxScale * (1 + (pressScale - 1) * press.value);

    state.ctx.clearRect(0, 0, state.width, state.height);

    const colStart = Math.floor(left / spacing);
    const colEnd = Math.ceil((left + state.width) / spacing);
    const rowStart = Math.floor(top / spacing);
    const rowEnd = Math.ceil((top + state.height) / spacing);

    for (let row = rowStart; row <= rowEnd; row++) {
      const gy = row * spacing;
      const y = gy - top;

      for (let col = colStart; col <= colEnd; col++) {
        const gx = col * spacing;
        const x = gx - left;
        const influence = hasPointer && hover.value
          ? Math.max(0, 1 - Math.hypot(gx - px, gy - py) / radius) * hover.value
          : 0;
        const currentSize = size * (1 + (maxScale - 1) * influence);

        state.ctx.fillStyle = mixColor(state.inactive, state.active, influence);

        if (shape === "square") {
          state.ctx.fillRect(x - currentSize / 2, y - currentSize / 2, currentSize, currentSize);
        } else {
          state.ctx.beginPath();
          state.ctx.arc(x, y, currentSize / 2, 0, Math.PI * 2);
          state.ctx.fill();
        }
      }
    }
  }

  function renderAll(visibleOnly = false) {
    const origin = elements[0].getBoundingClientRect();
    canvases.forEach(state => (!visibleOnly || state.visible) && render(state, origin));
  }

  function tick(time) {
    raf = null;
    if (!canvases.some(state => state.visible)) return;

    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    updateEase(hover, time);
    updateEase(press, time);

    if (!easeDuration) {
      pointer.cx = pointer.x;
      pointer.cy = pointer.y;
    } else {
      const strength = 1 - Math.exp(-delta * 6 / easeDuration);
      pointer.cx += (pointer.x - pointer.cx) * strength;
      pointer.cy += (pointer.y - pointer.cy) * strength;
    }

    renderAll(true);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (hasPointer && !raf && canvases.some(state => state.visible)) {
      lastTime = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = toPx(dotSize, elements[0]);
    spacing = size + toPx(gap, elements[0]);
    radius = spacing * hoverRadius;

    canvases.forEach(state => {
      const rect = state.element.getBoundingClientRect();
      state.width = rect.width;
      state.height = rect.height;
      state.canvas.width = Math.round(rect.width * dpr);
      state.canvas.height = Math.round(rect.height * dpr);
      state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    renderAll();
    start();
  }

  const onPointerMove = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;

    const inside = pointerInside();

    if (inside !== pointer.active) {
      pointer.active = inside;
      setEase(hover, +inside);

      if (inside) {
        pointer.cx = pointer.x;
        pointer.cy = pointer.y;
      } else {
        setEase(press, 0);
      }
    }

    start();
  };
  const onPointerDown = () => pointer.active && setEase(press, 1);
  const onPointerUp = () => setEase(press, 0);

  if (hasPointer) {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
  }

  const intersectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = canvases.find(state => state.element === entry.target);
      if (state) state.visible = entry.isIntersecting;
    });

    hasPointer ? start() : renderAll(true);
  });

  const resizeObserver = new ResizeObserver(resize);

  elements.forEach(element => {
    intersectionObserver.observe(element);
    resizeObserver.observe(element);
  });

  window.addEventListener("resize", resize);
  resize();

  // The page registry runs this while the transition panel still covers the
  // viewport and the container is mid-flight, so the first measurement can
  // land before the hero has its real size — leaving the canvas backing
  // store at whatever it read then, since the observer has nothing new to
  // report once the element settles at a size it was already given. Take one
  // more measurement on the far side of the next paint.
  requestAnimationFrame(() => requestAnimationFrame(resize));

  registerPageCleanup(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    canvases.forEach(state => state.canvas.remove());
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
function initParallaxCover(container, name, { leaving = false, shade = 0.5 } = {}) {
  const wraps = container.querySelectorAll(`[data-${name}-parallax]`);
  const stacked = window.matchMedia("(max-width: 991px)");

  const timelines = [];

  wraps.forEach(wrap => {
    const inner = wrap.querySelector(`[data-${name}-parallax-inner]`);
    const scrim = wrap.querySelector(`[data-${name}-parallax-dark]`);
    if (!inner && !scrim) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        // coming in, while the wrap rises from the foot of the viewport to
        // its top; going out, while it carries on until it has left
        start: leaving ? "clamp(top top)" : "clamp(top bottom)",
        end: leaving ? "clamp(bottom top)" : "clamp(top top)",
        scrub: true,
        // re-reads the travel below when the layout changes; both ends of
        // each tween are explicit, so re-recording them is always safe
        invalidateOnRefresh: true
      }
    });

    // the panel's offset from rest: above it coming in, below it going out
    const travel = () => (stacked.matches && inner.offsetHeight
      ? 25 * window.innerHeight / inner.offsetHeight
      : 25) * (leaving ? 1 : -1);

    // coming in, the panel settles out of its offset and its shadow; going
    // out, it runs the same way backwards, from rest into both
    const offset = [{ yPercent: travel }, { yPercent: 0 }];
    const fade = [{ opacity: shade }, { opacity: 0 }];
    if (leaving) {
      offset.reverse();
      fade.reverse();
    }

    if (inner) tl.fromTo(inner, offset[0], { ...offset[1], ease: "none" });
    if (scrim) tl.fromTo(scrim, fade[0], { ...fade[1], ease: "none" }, "<");

    timelines.push(tl);
  });

  registerPageCleanup(() => {
    timelines.forEach(tl => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    });
  });
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
