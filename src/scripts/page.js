// -----------------------------------------
// ADDD — the page's shared state
// -----------------------------------------
//
// What every page-level component may need to know or do, kept apart from
// the lifecycle that drives it (site.js) so the components can import it
// without importing the lifecycle:
//
//   motion.reduced       whether the visitor prefers reduced motion, live
//   registerPageCleanup  an undo for anything a component leaves running
//   pageShown()          a promise kept once the current page is in view
//
// The lifecycle owns the rest: it covers and shows each page (coverPage,
// showPage) and runs the cleanups as a page leaves (runPageCleanups).

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/** The visitor's motion preference; `reduced` is kept current. */
export const motion = { reduced: reducedMotionQuery.matches };
reducedMotionQuery.addEventListener("change", (e) => (motion.reduced = e.matches));

// When the current page is in view. Each page is built while it is still
// covered (beforeEnter), so anything that should play as it is seen — the
// line reveal of a heading already on screen — waits on this: a promise
// made as a page starts to arrive and kept once the arrival or the wipe
// has uncovered it.
let show = () => {};
let shown = Promise.resolve();

/** A new page is on its way: pageShown() waits until it is uncovered. */
export function coverPage() {
  shown = new Promise((resolve) => (show = resolve));
}

/** The current page is in view. */
export function showPage() {
  show();
}

/** A promise kept once the current page is in view. */
export function pageShown() {
  return shown;
}

// Page-scoped teardown. Anything a page-level init leaves behind that would
// outlive the DOM it was built from — GSAP tweens, ScrollTriggers, listeners
// on window/document, timers, observers — registers an undo here, and it is
// run against the outgoing page in afterLeave, once the panel covers it and
// before the next page inits.
let pageCleanups = [];

export function registerPageCleanup(fn) {
  pageCleanups.push(fn);
}

export function runPageCleanups() {
  const cleanups = pageCleanups;
  pageCleanups = [];
  cleanups.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("page cleanup failed", err);
    }
  });
}

// Whether a link goes to the page already open: the same address, the
// homepage's "/" and "/index.html" taken as one, with no #fragment (a
// fragment is a place on the page, the browser's to go to). Such a link
// takes no navigation at all: Barba leaves it (site.js, prevent) and the
// nav scrolls the page back to its top (nav.js).
const pagePath = (url) => url.pathname.replace(/\/index\.html$/, "/");

export function isSamePage(href) {
  let url;
  try {
    url = new URL(href, location.href);
  } catch (err) {
    return false;
  }
  return url.origin === location.origin && !url.hash && url.search === location.search && pagePath(url) === pagePath(location);
}
