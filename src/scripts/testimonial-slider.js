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
   other change until it has; the controls wrap round. Everything that
   changes with the quote changes the same way, in the same run: the
   count's number and the attribution split into masked lines that rise
   a beat behind the quote's, and the logo rising in a mask of its own
   as a line does.

   The first quote rises the first time the slider comes well up the
   screen, once the page has been uncovered, as the headings do. The
   lines are split again whenever a quote's width changes or the
   webfont arrives (autoSplit); a change caught by that is finished at
   once, every quote set where it would have ended.

   The controls: a press of either, or an arrow key while focus is on
   one. Pointed at with a mouse, or focused from the keyboard, a
   control fills with the ink from the edge its arrow points
   away from, and a white arrow slides in after it the way it points;
   left, the fill drains out of the far edge and the arrow carries on
   out. Turned round part-way, it runs back from where it is.

   With reduced motion, or in the Studio's preview (where the Visual
   editor writes into the quotes), nothing is split: a change fades
   (the count, the attribution and the logo by the stylesheet's own)
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
// The quotes' room, eased to the next quote's height as it comes in: a
// little past it and back, once (elastic, with a long period: about 9% of
// the change over, then a last hair under, and still), so the section
// stretches and gathers to each quote rather than snapping.
const SIZE = { duration: 1.1, ease: "elastic.out(1, 0.7)" };

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

  // what changes with quote i: the count's number, the attribution and
  // the logo
  const swapsOf = (i) => swaps.filter((el) => Number(el.dataset.testimonialSwap) === i);

  // one quote showing, or not: to the eye, to the pointer and to a reader;
  // split, its swaps with it (their own fades are the plain change's)
  function show(i, on) {
    const quote = quotes[i];
    quote.classList.toggle("is--active", on);
    quote.style.visibility = on ? "visible" : "hidden";
    if (on) quote.removeAttribute("aria-hidden");
    else quote.setAttribute("aria-hidden", "true");
    if (!plain) swapsOf(i).forEach((el) => { el.style.visibility = on ? "visible" : "hidden"; });
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
    root.classList.add("is--split");
    // Each quote's run takes everything that changes with it, line by
    // line: the quote's lines, then, a beat behind them, the count's
    // number and the attribution's lines, and with the first of them the
    // logo, rising in its own mask as a line does. Every part is split
    // (or, the logo, masked) on its own, and the run is built again from
    // whatever lines each part has whenever any of them is split again.
    const lines = new Map();
    const parts = quotes.map((quote, i) => {
      const own = swapsOf(i);
      return {
        quote,
        side: own.flatMap((el) => (el.matches(".testimonial-slider__credit") ? [...el.children] : el.closest(".testimonial-slider__count") ? [el] : [])),
        logo: own.map((el) => el.querySelector("[data-testimonial-logo]")).find(Boolean),
      };
    });
    const build = (i) => {
      const { quote, side, logo } = parts[i];
      const from = { yPercent: LINES.from, opacity: 0 };
      const to = { yPercent: 0, opacity: 1, duration: LINES.duration, stagger: LINES.stagger, ease: LINES.ease };
      runs[i]?.kill();
      runs[i] = gsap.timeline({ paused: true }).fromTo(lines.get(quote) ?? [], from, to, 0);
      const sideLines = side.flatMap((el) => lines.get(el) ?? []);
      if (sideLines.length) runs[i].fromTo(sideLines, from, to, LINES.stagger * 2);
      if (logo) runs[i].fromTo(logo, from, { ...to, duration: LINES.duration * 1.5 }, 0);
      // a re-split mid-change finishes it
      if (change) settle();
      else runs[i].progress(i === current && revealed ? 1 : 0);
    };
    parts.forEach(({ quote, side }, i) => {
      [quote, ...side].forEach((el) => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "line",
          // real text, read whole, rather than a label readers may pass over
          aria: "none",
          autoSplit: true,
          onSplit(self) {
            lines.set(el, self.lines);
            build(i);
          },
        });
        cleanups.push(() => split.revert());
      });
      build(i);
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

  // The quotes' room is the height of the quote showing, not of the
  // longest: the count, the attribution, the controls, the rule and the
  // section's foot follow it. Set outright at rest and whenever a quote's
  // height changes (the width, the webfont, a split), eased on a change;
  // once a change has settled, the page below has moved, so every scroll
  // position is measured again.
  // Only from 992px, where the controls stand in the side column, fixed
  // under the logo, clear of the quotes' room. Below it they sit under
  // the quote, so a room that changed would move them under the finger:
  // there the room stays the longest quote's, as every stack is.
  const box = root.querySelector(".testimonial-slider__quotes");
  const wide = window.matchMedia("(min-width: 992px)");
  let sizing = null;
  let measured = 0;
  const remeasure = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  function fit(i, { ease = false } = {}) {
    if (!box) return;
    if (!wide.matches) {
      sizing?.kill();
      measured = 0;
      gsap.set(box, { clearProps: "height" });
      return;
    }
    const h = quotes[i].offsetHeight;
    if (h === measured && !ease) return;
    // (the first setting is the page's own: measured with it as it loads)
    const first = !measured;
    measured = h;
    sizing?.kill();
    if (!ease || reducedMotion) {
      gsap.set(box, { height: h });
      if (!first) remeasure.restart(true);
      return;
    }
    sizing = gsap.to(box, { height: h, ...SIZE, onComplete: () => ScrollTrigger.refresh() });
  }
  fit(current);
  const resized = new ResizeObserver(() => {
    if (!sizing?.isActive()) fit(current);
  });
  quotes.forEach((quote) => resized.observe(quote));
  const onWide = () => fit(current);
  wide.addEventListener("change", onWide);
  cleanups.push(() => {
    wide.removeEventListener("change", onWide);
    resized.disconnect();
    remeasure.kill();
    sizing?.kill();
    if (box) gsap.set(box, { clearProps: "height" });
  });

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
          fit(next, { ease: true });
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
    // the room stretches or gathers to the next quote as its lines rise
    change.add(() => {
      show(from, false);
      show(next, true);
      fit(next, { ease: true });
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
    // comes in from (its offset as a share of itself, the stylesheet's
    // own translate taken off: read as pixels, it held the arrow outside)
    const rest = () => {
      run?.kill();
      run = null;
      lit = false;
      gsap.set(fill, { scale: 0 });
      gsap.set(over, { x: 0, y: 0, xPercent: 0, yPercent: 0, [axis()]: -100 * way });
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
        gsap.set(over, { x: 0, y: 0, xPercent: 0, yPercent: 0, [axis()]: -100 * way });
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
      swaps.forEach((el) => el.style.removeProperty("visibility"));
      gsap.set(root.querySelectorAll("[data-testimonial-logo]"), { clearProps: "transform,opacity" });
      root.classList.remove("is--split");
    },
  };
}
