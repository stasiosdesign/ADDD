/* ============================================================
   Float marks — small things drifting where a screen is empty
   ------------------------------------------------------------
   The homepage's software marks round the approach statement
   (StickyTitle's "around" layer, index.astro): each stands where its
   --x and --y put it (sticky-title.css) and drifts a little about that
   place, slowly and on its own, so the band round the statement reads
   as lived in rather than bare, and nothing draws the eye from the
   words.

   Each mark's drift is its own: a few pixels either way, there and back
   over several seconds, each mark's reach and pace drawn once from a
   range and each started partway through, so no two move together; no
   turn, which read as play. Transforms only (the site's rule: nothing
   scroll-linked reads layout, nothing runs off screen): the tweens are
   paused while the layer is off the screen and killed with the page.
   Nothing moves under reduced motion; the marks simply stand.

   data-float-marks on the layer; each mark [data-float-mark].
   ============================================================ */
// a mark's drift: this far either way (px), over this long there and
// back (s), each drawn from its range
const REACH = [5, 10];
const PERIOD = [6, 10];

const between = (a, b) => a + Math.random() * (b - a);
const sign = () => (Math.random() < 0.5 ? -1 : 1);

export function mountFloatMarks(el) {
  const marks = [...el.querySelectorAll("[data-float-mark]")];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const tweens = marks.map((mark) =>
      gsap.to(mark, {
        x: sign() * between(...REACH),
        y: sign() * between(...REACH),
        duration: between(...PERIOD),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
      }).progress(Math.random()),
    );
    // only while the layer is on the screen
    const onScreen = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => tweens.forEach((t) => (self.isActive ? t.play() : t.pause())),
    });
    if (onScreen.isActive) tweens.forEach((t) => t.play());
    return () => {
      onScreen.kill();
      tweens.forEach((t) => t.kill());
      gsap.set(marks, { clearProps: "transform" });
    };
  });

  return { destroy: () => mm.revert() };
}
