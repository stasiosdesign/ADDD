/* ============================================================
   Testimonial slider — the homepage's quotes, changed line by line
   (src/components/TestimonialSlider.astro, styles.css "testimonial
   slider")
   ------------------------------------------------------------
   After the Outsource Consultants slider, whose timings these are
   (read off its own component): every quote is mounted, stacked in
   one cell, and split into its lines, each line in a mask (SplitText,
   as the headings' line reveal splits them, the masks opened by the
   face's overhang: styles.css). A quote shows as its lines rise into
   their masks one after another, each from a line's depth below and
   from nothing, and goes as the same runs backwards, last line first.
   A change runs the one quote out and then the next in, and takes no
   other change until it has; the controls wrap round. The count's
   number, the attribution and the logo swap with it, the one going
   fading as the quote leaves and the one coming as the next arrives (a
   class: the stylesheet's fades are timed to the lines).

   The first quote rises the first time the slider comes well up the
   screen, once the page has been uncovered, as the headings do. The
   lines are split again whenever a quote's width changes or the
   webfont arrives (autoSplit); a change caught by that is finished at
   once, every quote set where it would have ended.

   The controls: a press of either, or an arrow key while focus is on
   one. Pointed at with a mouse, or focused from the keyboard, a
   control fills with the site's red from the edge its arrow points
   away from, and a white arrow slides in after it the way it points;
   left, the fill drains out of the far edge and the arrow carries on
   out. Turned round part-way, it runs back from where it is.

   With reduced motion, or in the Studio's preview (where the Visual
   editor writes into the quotes), nothing is split: a change fades
   the one quote out and the next in. With reduced motion the controls
   fill at once.
   ============================================================ */

// a quote's lines (from the reference): each 0.3s, 0.05s after the last,
// from its own height below
const LINES = { from: 100, duration: 0.3, stagger: 0.05, ease: "power2.out" };
// a control's fill and arrow (from the reference)
const CONTROL = { duration: 0.5, ease: "power4.out" };
// the plain change's fades (s), the stylesheet's swap fade
const FADE = 0.3;

export function mountTestimonialSlider(root, { reducedMotion = false, still = false, shown = () => Promise.resolve(), start = "clamp(top 72%)" } = {}) {
  const quotes = [...root.querySelectorAll("[data-testimonial-quote]")];
  const swaps = [...root.querySelectorAll("[data-testimonial-swap]")];
  const buttons = [...root.querySelectorAll("[data-testimonial-button]")];
  const total = quotes.length;
  if (!total) return { destroy() {} };

  const plain = reducedMotion || still;
  let current = 0;
  let revealed = plain;
  let change = null;
  const runs = new Array(total).fill(null);
  const cleanups = [];

  // one quote showing, or not: to the eye, to the pointer and to a reader
  function show(i, on) {
    const quote = quotes[i];
    quote.classList.toggle("is--active", on);
    quote.style.visibility = on ? "visible" : "hidden";
    if (on) quote.removeAttribute("aria-hidden");
    else quote.setAttribute("aria-hidden", "true");
  }
  // the count's number, the attribution and the logo for quote i
  function swap(i) {
    swaps.forEach((el) => {
      const on = Number(el.dataset.testimonialSwap) === i;
      el.classList.toggle("is--active", on);
      if (on) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });
  }

  // where everything stands at rest: the current quote in (once it has
  // been revealed), every other out
  function settle() {
    change?.kill();
    change = null;
    quotes.forEach((_, i) => show(i, i === current));
    if (plain) gsap.set(quotes, { clearProps: "opacity" });
    runs.forEach((run, i) => run?.progress(i === current && revealed ? 1 : 0));
  }

  if (!plain) {
    quotes.forEach((quote, i) => {
      const split = SplitText.create(quote, {
        type: "lines",
        mask: "lines",
        linesClass: "line",
        // the quote stays real text, read whole, rather than a label on a
        // blockquote that readers may pass over
        aria: "none",
        autoSplit: true,
        onSplit(self) {
          runs[i]?.kill();
          runs[i] = gsap.timeline({ paused: true }).fromTo(
            self.lines,
            { yPercent: LINES.from, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: LINES.duration, stagger: LINES.stagger, ease: LINES.ease },
          );
          // a re-split mid-change finishes it
          if (change) settle();
          else runs[i].progress(i === current && revealed ? 1 : 0);
        },
      });
      cleanups.push(() => split.revert());
    });

    // the first quote rises as the slider comes well up the screen
    const reveal = ScrollTrigger.create({
      trigger: root,
      start,
      once: true,
      onEnter: () =>
        shown().then(() => {
          if (revealed) return;
          revealed = true;
          if (!change) runs[current]?.play(0);
        }),
    });
    cleanups.push(() => reveal.kill());
  }
  quotes.forEach((_, i) => show(i, i === current));

  function goTo(next) {
    if (change || total < 2) return;
    next = (next + total) % total;
    if (next === current) return;
    const from = current;
    current = next;
    swap(next);
    change = gsap.timeline({ onComplete: settle });
    if (plain) {
      change
        .to(quotes[from], { opacity: 0, duration: FADE, ease: "power1.inOut" })
        .add(() => {
          show(from, false);
          show(next, true);
        })
        .fromTo(quotes[next], { opacity: 0 }, { opacity: 1, duration: FADE, ease: "power1.inOut" });
      return;
    }
    const out = runs[from];
    const into = runs[next];
    // out: the shown quote's run backwards, last line first (none to run
    // if it never came in); then the next quote's run
    if (revealed && out && out.time() > 0) change.add(out.tweenTo(0, { ease: "none" }));
    revealed = true;
    change.add(() => {
      show(from, false);
      show(next, true);
    });
    if (into) change.add(into.tweenFromTo(0, into.duration(), { ease: "none" }));
  }

  // the controls
  const upright = window.matchMedia("(min-width: 992px)");
  buttons.forEach((button) => {
    const fill = button.querySelector("[data-testimonial-fill]");
    const over = button.querySelector("[data-testimonial-over]");
    // the way the arrow points along its axis: the next down (or right),
    // the previous up (or left)
    const way = button.dataset.testimonialButton === "prev" ? -1 : 1;
    const axis = () => (upright.matches ? "yPercent" : "xPercent");
    const edge = (side) => (upright.matches ? (side > 0 ? "bottom center" : "top center") : side > 0 ? "right center" : "left center");
    const length = () => (reducedMotion ? 0 : CONTROL.duration);
    let run = null;
    let lit = false;

    // waiting: the fill drained, the white arrow outside on the side it
    // comes in from
    const rest = () => {
      run?.kill();
      run = null;
      lit = false;
      gsap.set(fill, { scale: 0 });
      gsap.set(over, { xPercent: 0, yPercent: 0, [axis()]: -100 * way });
    };
    function light() {
      if (lit) return;
      lit = true;
      let d = length();
      if (run && run.progress() > 0 && run.progress() < 0.5) {
        // caught early on its way out: back from where it is
        d *= run.progress();
      } else {
        gsap.set([fill, over], { transformOrigin: edge(-way) });
        gsap.set(over, { xPercent: 0, yPercent: 0, [axis()]: -100 * way });
      }
      run?.kill();
      run = gsap.timeline({ defaults: { ease: CONTROL.ease } })
        .to(fill, { scale: 1, duration: d })
        .to(over, { xPercent: 0, yPercent: 0, duration: d * 0.8 }, d * 0.2);
    }
    function dim() {
      if (!lit) return;
      lit = false;
      let d = length();
      if (run && run.progress() > 0 && run.progress() < 0.5) d *= run.progress();
      else gsap.set([fill, over], { transformOrigin: edge(way) });
      run?.kill();
      run = gsap.timeline({ defaults: { ease: CONTROL.ease } })
        .to(fill, { scale: 0, duration: d })
        .to(over, { [axis()]: 100 * way, duration: d * 0.8 }, 0);
    }
    rest();

    const onEnter = (e) => e.pointerType === "mouse" && light();
    const onLeave = (e) => e.pointerType === "mouse" && dim();
    const onFocus = () => button.matches(":focus-visible") && light();
    const onBlur = () => dim();
    const onClick = () => goTo(current + way);
    const onKey = (e) => {
      const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
      if (!step) return;
      e.preventDefault();
      goTo(current + step);
    };
    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointerleave", onLeave);
    button.addEventListener("focus", onFocus);
    button.addEventListener("blur", onBlur);
    button.addEventListener("click", onClick);
    button.addEventListener("keydown", onKey);
    upright.addEventListener("change", rest);
    cleanups.push(() => {
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("pointerleave", onLeave);
      button.removeEventListener("focus", onFocus);
      button.removeEventListener("blur", onBlur);
      button.removeEventListener("click", onClick);
      button.removeEventListener("keydown", onKey);
      upright.removeEventListener("change", rest);
      run?.kill();
      gsap.set([fill, over], { clearProps: "all" });
    });
  });

  return {
    destroy() {
      change?.kill();
      change = null;
      runs.forEach((run) => run?.kill());
      cleanups.forEach((fn) => fn());
      gsap.set(quotes, { clearProps: "opacity,visibility" });
    },
  };
}
