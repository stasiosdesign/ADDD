// -----------------------------------------
// ADDD — the smooth scroll
// -----------------------------------------
//
// Lenis, driving the page's scroll, and how ScrollTrigger follows it. Lenis,
// gsap and ScrollTrigger are globals, loaded from the CDN ahead of the
// site's module (src/layouts/BaseLayout.astro).

// Smooth scroll, driven by the GSAP ticker rather than its own rAF so the
// transition can stop and restart it around a navigation. The lerp sets the
// glide: at 0.1 a wheel step settles in about half a second — a slower,
// calmer scroll — and a wheel tick moves the page its native distance.
export const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
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
