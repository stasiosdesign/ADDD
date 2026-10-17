/* ============================================================
   Service tabs — the four routes in one panel, moved through by the
   scroll (src/components/ServiceTabs.astro, styles.css "service tabs")
   ------------------------------------------------------------
   Where the screen is tall and wide enough (STICKY, as the stylesheet
   has it) the panel sticks under the nav for a stretch of scroll
   (position: sticky), and the scroll takes it through the four routes:
   each has an equal share of that stretch. Once the last share is done
   the panel lets go and the page scrolls on. Pressing a number scrolls
   to the middle of its share (the caller's scrollTo, on Lenis). On a
   smaller screen the panel sits in the flow and a number is pressed to
   change the route.

   One number, s, says where the drawings are: 0 on the first route, 1
   on the second, and between two, part-way. It follows the scroll, a
   moment behind it (SMOOTH), so the strip glides rather than steps:

     - the drawings, one under another in a strip, are carried up the
       panel s drawings' heights (one lattice stands still behind them:
       dot-field.js), with the scroll, wherever it stops;
     - the words are not. They change only once the strip is well past
       the middle of a hand-over (SWITCH: a tolerance either way, so a
       scroll that stops near the middle, or turns there, never flickers
       between two routes), and then as a change of their own, timed
       rather than scrolled: the route's words (its name, its line and
       its button, as one block) fade out, and once they have gone the
       next route's fade in, the same way forwards and back, nothing
       moving and the two never over each other. A change caught by the
       next is taken up from where it is; the scroll may skip several
       routes, and the words go straight to the one it lands on;
     - the route in front is the one whose words show: its number's
       state, and the one a reader and the keyboard reach.

   s runs on an even pace with a sine wave on it (curve), slowest with
   each route in the middle of the panel and quickest at the hand-over,
   and holds at either end of the stretch, as the panel sticks and lets
   go. The number of the route in front fills white across its route's
   share of the scroll, from the left, a small loading bar of its own,
   its numeral in the ink where the white has reached it; every other
   number stays grey.

   In the flow, a pressed number eases s to its route (SLIDE), and fills
   only its own square. With reduced motion the route changes at once.
   ============================================================ */

// where the panel sticks (the stylesheet's own query)
const STICKY = "(min-width: 768px) and (min-height: 540px)";
// how slow the strip runs with a route in the middle, as a share of its
// even pace (the rest goes into the hand-over): slow enough to read by,
// never quite still
const DWELL = 0.12;
// how far behind the scroll the strip follows (s), so it glides
const SMOOTH = { duration: 0.6, ease: "power3.out" };
// how far past the route shown the strip must go (in routes) before the
// words change: past the hand-over's middle by a margin either way
const SWITCH = 0.6;
// the words' change: the shown route's words fading out, then, once they
// have gone (at: the out's length, so the two never overlap), the next
// route's fading in, a little slower
const WORDS = {
  out: { duration: 0.28, ease: "power1.in" },
  in: { duration: 0.5, ease: "power1.out" },
  at: 0.28,
};
// a pressed route's move, in the flow
const SLIDE = { duration: 0.9, ease: "power3.inOut" };

export function mountServiceTabs(root, { reducedMotion = false, scrollTo = (y) => window.scrollTo(0, y) } = {}) {
  const panel = root.querySelector("[data-service-tabs-panel]");
  const items = [...root.querySelectorAll("[data-service-tabs-item]")];
  const track = root.querySelector("[data-service-tabs-track]");
  const visuals = [...root.querySelectorAll("[data-service-tabs-visual]")];
  const buttons = [...root.querySelectorAll("[data-service-tabs-button]")];
  const fills = buttons.map((button) => button.querySelector("[data-service-tabs-fill]"));
  const count = Math.min(items.length, visuals.length, buttons.length);
  if (!panel || !track || count < 1) return { destroy() {} };

  const clamp = gsap.utils.clamp;
  const state = { s: 0 };
  // the route whose words show, and their change under way
  let shown = 0;
  let words = null;
  let slide = null;
  // what pressing a number does, by the mode the screen is in, and how
  // the numbers are filled again when the route in front changes
  let press = () => {};
  let refill = () => {};

  // the route in front: its number, and the one a reader and the
  // keyboard reach
  function select(i) {
    buttons.forEach((button, k) => {
      const on = k === i;
      button.classList.toggle("is--active", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
      button.tabIndex = on ? 0 : -1;
    });
    items.forEach((item, k) => {
      item.classList.toggle("is--active", k === i);
      item.inert = k !== i;
    });
  }

  // The words to route next: the shown route's fade out, then the next
  // route's fade in, the same whichever way the change runs. Every other
  // route's put away, out of sight. A change caught part-way is killed
  // where it is, so the going route is faded on from wherever it was.
  function showWords(next, { instant = false } = {}) {
    const from = shown;
    shown = next;
    select(next);
    refill();
    words?.kill();
    words = null;
    items.forEach((item, i) => {
      if (i === next || (i === from && !instant)) return;
      item.style.visibility = "hidden";
      item.style.opacity = "0";
    });
    if (instant || reducedMotion || from === next) {
      items[from].style.visibility = from === next ? "visible" : "hidden";
      if (from !== next) items[from].style.opacity = "0";
      items[next].style.visibility = "visible";
      items[next].style.opacity = "1";
      return;
    }
    words = gsap.timeline();
    words.to(items[from], { opacity: 0, ...WORDS.out }, 0);
    words.set(items[from], { visibility: "hidden" });
    words.set(items[next], { visibility: "visible" }, WORDS.at);
    words.fromTo(items[next], { opacity: 0 }, { opacity: 1, ...WORDS.in }, WORDS.at);
  }

  // The numbers' fills: the route in front's, amount (0–1) of its block
  // from the left; every other faded out where it stands (the stylesheet
  // eases the fade), rather than cut, so a hand-over between two numbers
  // is a soft one.
  function fillTo(active, amount) {
    fills.forEach((el, k) => {
      const on = k === active;
      el.style.opacity = on ? "1" : "0";
      if (on) el.style.clipPath = `inset(0 ${((1 - clamp(0, 1, amount)) * 100).toFixed(2)}% 0 0)`;
    });
  }

  // The strip at s, and the words changed once it is far enough past the
  // route they show.
  function draw(s) {
    state.s = s;
    track.style.transform = `translate3d(0, ${(-100 * s).toFixed(3)}%, 0)`;
    if (Math.abs(s - shown) > SWITCH) showWords(clamp(0, count - 1, Math.round(s)));
  }

  // the scroll's way through the stretch, u routes (0–count), as s: an
  // even run with a sine wave on it, slowest at each route's middle
  // (u = i + 0.5, s = i), held at either end
  const k = 1 - DWELL;
  const curve = (u) => {
    const x = u - 0.5;
    return clamp(0, count - 1, x - (k * Math.sin(2 * Math.PI * x)) / (2 * Math.PI));
  };

  // at rest: the first route
  showWords(0, { instant: true });
  draw(0);
  fillTo(0, 1);

  const mm = gsap.matchMedia();
  // stuck: the scroll through the panel's stretch moves the strip, a
  // moment behind it, and fills the numbers
  mm.add(STICKY, () => {
    const stickAt = () => parseFloat(getComputedStyle(panel).top) || 0;
    const glide = reducedMotion ? null : gsap.quickTo(state, "s", { ...SMOOTH, onUpdate: () => draw(state.s) });
    // only the route in front fills, across its own share; the rest grey
    let u = 0;
    refill = () => fillTo(shown, u - shown);
    const target = (progress) => {
      u = progress * count;
      refill();
      return reducedMotion ? clamp(0, count - 1, Math.floor(u)) : curve(u);
    };
    const range = ScrollTrigger.create({
      trigger: root,
      // from the panel sticking, to its letting go
      start: () => `top ${stickAt()}px`,
      end: () => `+=${Math.max(1, root.offsetHeight - panel.offsetHeight)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const s = target(self.progress);
        if (glide) glide(s);
        else draw(s);
      },
      // found by a refresh (a reload part-way, a resize): set at once
      onRefresh: (self) => {
        const s = target(self.progress);
        if (glide) glide(s, s);
        draw(s);
        showWords(clamp(0, count - 1, Math.round(s)), { instant: true });
      },
    });
    // a number takes the scroll to the middle of its share, where its
    // route stands in the middle of the panel
    press = (i) => scrollTo(range.start + ((i + 0.5) / count) * (range.end - range.start));
    return () => {
      range.kill();
      gsap.killTweensOf(state);
      refill = () => {};
    };
  });
  // in the flow: a number eases the strip to its route, the words
  // changing as it passes
  mm.add(`not all and ${STICKY}`, () => {
    const to = (i) => {
      slide?.kill();
      fillTo(i, 1);
      if (reducedMotion) {
        draw(i);
        return showWords(i, { instant: true });
      }
      slide = gsap.to(state, {
        s: i,
        duration: SLIDE.duration,
        ease: SLIDE.ease,
        onUpdate: () => draw(state.s),
        // a route only a step away may stop inside the tolerance
        onComplete: () => shown !== i && showWords(i),
      });
    };
    to(clamp(0, count - 1, Math.round(state.s)));
    press = to;
    return () => slide?.kill();
  });

  // pressing a number, or moving along them from the keyboard
  const onClick = (e) => {
    const i = buttons.indexOf(e.target.closest("[data-service-tabs-button]"));
    if (i >= 0) press(i);
  };
  const onKey = (e) => {
    const i = buttons.indexOf(e.target.closest("[data-service-tabs-button]"));
    if (i < 0) return;
    const to = { ArrowLeft: i - 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowDown: i + 1, Home: 0, End: count - 1 }[e.key];
    if (to === undefined || to < 0 || to >= count) return;
    e.preventDefault();
    press(to);
    buttons[to].focus();
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      mm.revert();
      slide?.kill();
      words?.kill();
      items.forEach((item) => {
        item.inert = false;
        item.style.removeProperty("visibility");
        item.style.removeProperty("opacity");
      });
      fills.forEach((el) => {
        el.style.removeProperty("clip-path");
        el.style.removeProperty("opacity");
      });
      track.style.removeProperty("transform");
    },
  };
}
