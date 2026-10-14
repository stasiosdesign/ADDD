/* ============================================================
   Service tabs — the four routes in one panel that changes in place
   (src/components/ServiceTabs.astro, styles.css "service tabs")
   ------------------------------------------------------------
   After Osmo's Sticky Features, whose transitions these are. Where the
   screen is tall and wide enough (STICKY, as the stylesheet has it) the
   panel sticks under the nav for a stretch of scroll (position:
   sticky), and the scroll takes it through the four
   routes: each has an equal share of that stretch, the route in front
   is the share the scroll is in, and the bar of its position fills as
   the scroll crosses its share. Once the last share is done the panel
   lets go and the page scrolls on. Pressing a position scrolls to the
   start of its share (the caller's scrollTo, on Lenis). On a smaller
   screen the panel sits in the flow and a position is pressed to change
   the route.

   A change: the words of the route going leave the way the scroll runs
   (each of its title, line and button 30px up as it fades, scrolling
   down; down, scrolling back up), and the next route's come in after
   them from the other side, one after another. A drawing after the one
   shown opens over it from the middle (a clip-path inset); one before it
   is shown as the drawing over it closes back to the middle, so the
   panels stack in their order whichever way the scroll runs, and every
   panel over the one shown is closed once it settles. A change caught
   part-way by the next is taken up from where it is; the scroll may skip
   several routes at once, and goes straight to the one it lands on. A
   route found by a refresh (a reload part-way, a resize) is set at once.

   With reduced motion the words and the drawing change at once.
   ============================================================ */

// Osmo's: the drawing's opening and closing; the words going and coming
const REVEAL = { duration: 0.75, ease: "power4.inOut" };
const WORDS = { shift: 30, out: 0.4, in: 0.75, stagger: 0.1, ease: "power4.out" };
// where the panel sticks (the stylesheet's own query)
const STICKY = "(min-width: 768px) and (min-height: 540px)";

const OPEN = "inset(0% 0% 0% 0%)";
const SHUT = "inset(50% 50% 50% 50%)";

export function mountServiceTabs(root, { reducedMotion = false, scrollTo = (y) => window.scrollTo(0, y) } = {}) {
  const panel = root.querySelector("[data-service-tabs-panel]");
  const items = [...root.querySelectorAll("[data-service-tabs-item]")];
  const visuals = [...root.querySelectorAll("[data-service-tabs-visual]")];
  const buttons = [...root.querySelectorAll("[data-service-tabs-button]")];
  const fills = buttons.map((button) => button.querySelector("[data-service-tabs-progress]"));
  const count = Math.min(items.length, visuals.length, buttons.length);
  if (!panel || count < 1) return { destroy() {} };

  const texts = items.map((item) => [...item.querySelectorAll("[data-service-tabs-text]")]);
  const wordRuns = new Array(count).fill(null);
  const visualRuns = new Array(count).fill(null);
  let current = 0;
  // what pressing a position does, by the mode the screen is in
  let press = (i) => goTo(i);

  // at rest: the first route's words and drawing, every other's out of sight
  items.forEach((item, i) => {
    gsap.set(item, { autoAlpha: i === 0 ? 1 : 0 });
    item.inert = i !== 0;
  });
  visuals.forEach((visual, i) => gsap.set(visual, { clipPath: i === 0 ? OPEN : SHUT }));
  gsap.set(fills, { scaleX: 0, transformOrigin: "0% 50%" });

  // the words of route i going, or coming, the way the change runs
  // (dir 1, on down the page; -1, back up it)
  function wordsOut(i, dir) {
    wordRuns[i]?.kill();
    if (reducedMotion) {
      gsap.set(texts[i], { autoAlpha: 0, y: 0 });
      gsap.set(items[i], { autoAlpha: 0 });
      return;
    }
    wordRuns[i] = gsap.timeline()
      .to(texts[i], { autoAlpha: 0, y: -dir * WORDS.shift, duration: WORDS.out, ease: WORDS.ease })
      .set(items[i], { autoAlpha: 0 });
  }
  function wordsIn(i, dir) {
    wordRuns[i]?.kill();
    gsap.set(items[i], { autoAlpha: 1 });
    if (reducedMotion) {
      gsap.set(texts[i], { autoAlpha: 1, y: 0 });
      return;
    }
    wordRuns[i] = gsap.timeline().fromTo(
      texts[i],
      { autoAlpha: 0, y: dir * WORDS.shift },
      { autoAlpha: 1, y: 0, duration: WORDS.in, ease: WORDS.ease, stagger: WORDS.stagger },
    );
  }

  // the drawings stack in their order, so a later one opens over the shown
  // one and an earlier one is uncovered by closing the ones over it
  function clip(i, to) {
    visualRuns[i]?.kill();
    if (reducedMotion) {
      gsap.set(visuals[i], { clipPath: to });
      return;
    }
    visualRuns[i] = gsap.to(visuals[i], { clipPath: to, duration: REVEAL.duration, ease: REVEAL.ease });
  }
  function showVisual(from, to) {
    if (to > from) {
      clip(to, OPEN);
      return;
    }
    // the one to show waits open under the others; those between it and
    // the one going are shut at once, out of sight under it
    visualRuns[to]?.kill();
    gsap.set(visuals[to], { clipPath: OPEN });
    for (let k = to + 1; k < from; k++) {
      visualRuns[k]?.kill();
      gsap.set(visuals[k], { clipPath: SHUT });
    }
    // and any above the one going, unless still closing from a change
    for (let k = from + 1; k < count; k++) {
      if (visualRuns[k]?.isActive()) continue;
      gsap.set(visuals[k], { clipPath: SHUT });
    }
    clip(from, SHUT);
  }

  // the positions: which is in front, to the eye and to a reader
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
  // the bar in front, filled by this much; the others empty
  function fill(i, amount) {
    fills.forEach((el, k) => gsap.set(el, { scaleX: k === i ? amount : 0 }));
  }

  function goTo(next, { instant = false } = {}) {
    if (next < 0 || next >= count || next === current) return;
    const from = current;
    const dir = next > from ? 1 : -1;
    current = next;
    select(next);
    if (instant) {
      wordRuns.forEach((run) => run?.kill());
      visualRuns.forEach((run) => run?.kill());
      items.forEach((item, k) => gsap.set(item, { autoAlpha: k === next ? 1 : 0 }));
      gsap.set(texts.flat(), { autoAlpha: 1, y: 0 });
      visuals.forEach((visual, k) => gsap.set(visual, { clipPath: k <= next ? OPEN : SHUT }));
      return;
    }
    wordsOut(from, dir);
    wordsIn(next, dir);
    showVisual(from, next);
  }

  const mm = gsap.matchMedia();
  // stuck: the scroll through the panel's stretch takes it through the routes
  mm.add(STICKY, () => {
    const stickAt = () => parseFloat(getComputedStyle(panel).top) || 0;
    // the share of the stretch the scroll is in, and how far across it
    const follow = (progress, instant) => {
      const i = Math.min(count - 1, Math.floor(progress * count));
      goTo(i, { instant });
      fill(i, progress >= 1 ? 1 : progress * count - i);
    };
    const range = ScrollTrigger.create({
      trigger: root,
      // from the panel sticking, to its letting go
      start: () => `top ${stickAt()}px`,
      end: () => `+=${Math.max(1, root.offsetHeight - panel.offsetHeight)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => follow(self.progress, false),
      onRefresh: (self) => follow(self.progress, true),
    });
    // a position takes the scroll to just inside the start of its share
    press = (i) => scrollTo(range.start + ((i + 0.02) / count) * (range.end - range.start));
    return () => {
      range.kill();
      press = (i) => goTo(i);
    };
  });
  // in the flow: a position changes the route, its bar full
  mm.add(`not all and ${STICKY}`, () => {
    fill(current, 1);
    press = (i) => {
      goTo(i);
      fill(current, 1);
    };
  });

  // pressing a position, or moving along them from the keyboard
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
      wordRuns.forEach((run) => run?.kill());
      visualRuns.forEach((run) => run?.kill());
      items.forEach((item) => { item.inert = false; });
      gsap.set([...items, ...texts.flat(), ...visuals, ...fills], { clearProps: "all" });
    },
  };
}
