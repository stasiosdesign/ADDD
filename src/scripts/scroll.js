// -----------------------------------------
// ADDD — the smooth scroll
// -----------------------------------------
//
// Lenis, driving the page's scroll, and how ScrollTrigger follows it. Lenis,
// gsap and ScrollTrigger are globals, loaded from the CDN ahead of the
// site's module (src/layouts/BaseLayout.astro).

import { motion, isSamePage } from "./page.js";

// Smooth scroll, driven by the GSAP ticker rather than its own rAF so the
// transition can stop and restart it around a navigation. The lerp sets the
// glide: at 0.08 a wheel step settles in a little over half a second — a
// slow, calm scroll (0.1 was a touch quicker) — and a wheel tick moves the
// page its native distance.
export const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1 });
lenis.on("scroll", ScrollTrigger.update);
// First in the tick (prioritised), ahead of GSAP's own render of its
// tweens: Lenis moves the page (window.scrollTo, which has the browser
// settle any style already changed this frame), ScrollTrigger follows it,
// and only then do the tweens write — so nothing written this frame is
// settled twice. Run after the render, as it was, the smoothed scrubs'
// writes were brought up to date by force on every frame of a scroll.
gsap.ticker.add((time) => lenis.raf(time * 1000), false, true);
gsap.ticker.lagSmoothing(0);

// ScrollTrigger is updated once a frame, from Lenis, just after Lenis has
// moved the page. It also listens for the browser's own scroll event and
// updates on that too, and the browser sends one for every move Lenis
// makes — at the start of the next frame, before Lenis's. So every
// scroll-linked tween was run twice a frame, and the first run's writes
// were brought up to date by force when Lenis then moved the page. The
// browser's event is held back from the listeners after this one while
// Lenis is the one scrolling; Lenis itself ignores it then, and any other
// scroll — the scrollbar dragged, a key, a link to an anchor — still
// reaches them all.
window.addEventListener("scroll", (event) => {
  if (lenis.isScrolling === "smooth") event.stopImmediatePropagation();
}, { capture: true, passive: true });

// Scroll to the top — or to y — in a way Lenis agrees with. Setting
// window.scrollY behind its back leaves its internal position stale, and it
// snaps back to the old offset the moment it is started again.
export function resetScroll(y = 0) {
  lenis.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
}

// -----------------------------------------
// The glide: one way the page is taken to a place
// -----------------------------------------
//
// Every scroll the site makes to a place, rather than the reader's own: a
// link to a section (#…) on the page, or arriving on another page at one;
// the service tabs taking a route; the nav taking the page back to its
// top. All on Lenis, on one curve that starts and lands softly (ease in and
// out, cubic), a little slower over a longer way (0.9s, plus a second for
// every two thousand pixels, to 2.2s), so a jump of a screen and a run down
// a whole page both read as a glide rather than a snap or a rush. The
// reader's own wheel, key or touch takes over at once (Lenis drops a
// programmatic scroll for the reader's). With reduced motion, the page is
// simply there. A section is placed clear of the nav: its top that far
// under the bar's foot (anchorY).

const GLIDE = { min: 0.9, max: 2.2, base: 0.8, per: 2000 };
const glideEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Take the page to y, gliding (or at once, with reduced motion). */
export function glideTo(y, { force = false } = {}) {
  const to = Math.max(0, Math.min(y, lenis.limit || y));
  if (motion.reduced) return lenis.scrollTo(to, { immediate: true, force });
  const distance = Math.abs(to - window.scrollY);
  lenis.scrollTo(to, {
    duration: Math.min(GLIDE.max, Math.max(GLIDE.min, GLIDE.base + distance / GLIDE.per)),
    easing: glideEase,
    force,
  });
}

// the room a section keeps under the nav: the bar's foot as it stands
// (full or floating), at least its own height, and a little air
function navRoom() {
  const bar = document.querySelector(".mega-nav__bar");
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const r = bar?.getBoundingClientRect();
  return (r ? Math.max(r.bottom, r.height) : 0) + 1.5 * rem;
}

/** Where the page goes for a #fragment in root (a page or a container): null if there is no such place. */
export function anchorY(root, hash) {
  let id = "";
  try {
    id = decodeURIComponent(hash.replace(/^#/, ""));
  } catch (err) {
    return null;
  }
  if (!id) return null;
  const target = root.querySelector(`[id="${CSS.escape(id)}"]`);
  if (!target) return null;
  return Math.max(0, target.getBoundingClientRect().top + window.scrollY - navRoom());
}

// Every link to a place on the page it is on glides there: one listener,
// ahead of the browser's jump and of Barba (which leaves such links alone).
// The address is left as it is, so the history has no step of its own for
// a place on a page.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.("a[href*='#']");
  if (!link || (link.target && link.target !== "_self")) return;
  const url = new URL(link.href, location.href);
  if (!url.hash || !isSamePage(url.origin + url.pathname + url.search)) return;
  const y = anchorY(document, url.hash);
  if (y === null) return;
  event.preventDefault();
  event.stopPropagation();
  glideTo(y);
}, true);
