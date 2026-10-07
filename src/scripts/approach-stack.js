/* ============================================================
   Approach stack — the homepage's three steps on a scroll-driven
   timeline (src/components/ApproachStack.astro)
   ------------------------------------------------------------
   Built on the supplied Scroll-driven Stack Timeline spec, adapted
   to three cards and to this site. The cards are always open, each
   with its step drawn as a live schematic, and the scroll drives
   the rest:

     - each card rises into place as it comes up the screen, and its
       schematic draws in the first time the card is properly in
       view, then loops while the card is on screen and pauses while
       it is not;
     - the rail's dotted line shows only through a window held at
       the middle of the viewport. The dots are drawn inside the
       window and moved against the scroll, which reads exactly as
       the full-length line seen through it, without a clip-path on
       a full-height SVG;
     - a solid trail grows out of the cube with the scroll's speed,
       behind it either way, and fades over the end of the rail.

   gsap.matchMedia sets up one of three states and tears it down
   again when the viewport crosses a breakpoint: the rail and the
   trail from 768px, cards only below it, and under reduced motion
   every schematic at rest, with no trail or entrance. GSAP and
   ScrollTrigger are the site's globals; Lenis, when given,
   supplies the trail's speed.
   ============================================================ */

// The velocity trail, as the spec sets it: lengths are shares (%) of the
// window's half, and the line fades out over the last 15% of the rail.
const TRAIL = { gain: 2, max: 50, minSpeed: 0.5, fadeFrom: 0.85, idle: 150 };

export function mountApproachStack(root, { lenis } = {}) {
  const rail = root.querySelector("[data-approach-stack-rail]");
  const win = root.querySelector("[data-approach-stack-window]");
  const dots = root.querySelector("[data-approach-stack-dots]");
  const trailEls = {
    top: root.querySelector('[data-approach-stack-trail="top"]'),
    bottom: root.querySelector('[data-approach-stack-trail="bottom"]'),
  };
  const intro = [root.querySelector(".approach-stack__h"), root.querySelector(".approach-stack__lede")].filter(Boolean);

  const cards = [...root.querySelectorAll("[data-approach-stack-slot]")].map((slot) => {
    const el = slot.querySelector("[data-step-card]");
    return { slot, el, schematic: mountSchematic(el.querySelector("[data-schematic]")), started: false };
  });

  const mm = gsap.matchMedia();

  // rail and phone between them always match, so the setup always runs (GSAP
  // only calls it while at least one condition does).
  mm.add(
    {
      rail: "(min-width: 768px)",
      phone: "(max-width: 767px)",
      reduce: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { phone, reduce } = context.conditions;
      const cleanups = [];

      if (reduce) {
        cards.forEach((card) => card.schematic?.rest());
      } else {
        cards.forEach((card) => {
          // Drawn in the first time the card is well in view; after that it
          // runs while the card is on screen and holds while it is not.
          ScrollTrigger.create({
            trigger: card.slot,
            start: "top 85%",
            end: "bottom 15%",
            onToggle: (self) => {
              if (!card.schematic) return;
              if (self.isActive && !card.started) {
                card.started = true;
                card.schematic.start();
              } else {
                card.schematic.hold(!self.isActive);
              }
            },
          });

          // Entrance: each card rises into place as it comes up the screen.
          gsap.fromTo(card.el, { y: 48, opacity: 0 }, {
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: card.slot, start: "top bottom", end: "top 80%", scrub: true },
          });
        });

        intro.forEach((el) => {
          gsap.fromTo(el, { y: 48, opacity: 0 }, {
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top 72%", scrub: true },
          });
        });

        if (!phone) cleanups.push(setUpRail());
      }

      return () => {
        cleanups.forEach((fn) => fn());
        cards.forEach((card) => {
          card.started = false;
          card.schematic?.stop();
        });
      };
    }
  );

  // The rail: the dots moved against the scroll inside the window, and the
  // velocity trail out of the cube. Returns its teardown.
  function setUpRail() {
    if (!rail || !win) return () => {};

    // Where the window sits down the rail, worked out from the scroll rather
    // than read off the layout: the rail's top on the page, the window's
    // sticky top in the viewport and the room it has to travel, measured on
    // each refresh. Reading the two boxes every frame forced a layout each
    // time, straight after the trail had resized.
    let geo = null;
    const syncDots = (self) => {
      if (!geo) return;
      const offset = gsap.utils.clamp(0, geo.room, geo.sticky - (geo.top - self.scroll()));
      dots.style.backgroundPositionY = `${-offset}px`;
    };
    ScrollTrigger.create({
      trigger: rail,
      start: "top bottom",
      end: "bottom top",
      onUpdate: syncDots,
      onRefresh(self) {
        const box = rail.getBoundingClientRect();
        geo = {
          top: box.top + window.scrollY,
          sticky: parseFloat(getComputedStyle(win).top) || 0,
          room: Math.max(0, box.height - win.getBoundingClientRect().height),
        };
        syncDots(self);
      },
    });

    gsap.fromTo(rail, { opacity: 0 }, {
      opacity: 1,
      ease: "none",
      scrollTrigger: { trigger: rail, start: "top 80%", end: "top 50%", scrub: true },
    });

    const trail = { top: 0, bottom: 0 };
    // Scaled rather than resized (approach-stack.css), so the trail never
    // costs a layout: each line stands half the window tall at full scale.
    const apply = () => {
      trailEls.top.style.transform = `scaleY(${trail.top / 100})`;
      trailEls.bottom.style.transform = `scaleY(${trail.bottom / 100})`;
    };
    let idle = 0;
    const resetTrail = (smooth) => {
      clearTimeout(idle);
      gsap.killTweensOf(trail);
      gsap.to(trail, { top: 0, bottom: 0, duration: smooth ? 0.6 : 0, ease: "none", onUpdate: apply });
    };

    // From the moment the window settles at the middle of the viewport to
    // the moment it leaves the bottom of the rail. Measured off the rail:
    // the window is sticky, so where it sits depends on the scroll.
    const half = () => win.offsetHeight / 2;
    ScrollTrigger.create({
      trigger: rail,
      start: () => `top center-=${half()}`,
      end: () => `bottom center+=${half()}`,
      invalidateOnRefresh: true,
      onUpdate(self) {
        // Lenis reports px per frame; ScrollTrigger px per second.
        const velocity = lenis ? lenis.velocity : self.getVelocity() / 60;
        const speed = Math.abs(velocity);
        const damp = self.progress > TRAIL.fadeFrom
          ? gsap.utils.mapRange(TRAIL.fadeFrom, 1, 1, 0, self.progress)
          : 1;
        const length = speed > TRAIL.minSpeed ? Math.min(TRAIL.gain * speed * damp, TRAIL.max * damp) : 0;
        // Scrolling down, the line trails above the cube; up, below it.
        gsap.to(trail, {
          top: velocity > 0 ? length : 0,
          bottom: velocity > 0 ? 0 : length,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
          onUpdate: apply,
        });
        clearTimeout(idle);
        idle = setTimeout(() => resetTrail(true), TRAIL.idle);
      },
      onToggle(self) {
        if (!self.isActive) resetTrail(true);
      },
    });

    return () => {
      clearTimeout(idle);
      gsap.killTweensOf(trail);
      trailEls.top.style.transform = trailEls.bottom.style.transform = "";
      dots.style.backgroundPositionY = "";
    };
  }

  return {
    destroy() {
      mm.revert();
      cards.forEach((card) => card.schematic?.destroy());
    },
  };
}


/* ============================================================
   Schematics — the step drawn in each card's panel
   ============================================================
   Each is one paused GSAP timeline: a draw-in, then a loop with no
   end. start() plays it from the top, stop() takes it back to the
   undrawn state (when a breakpoint change sets the stack up again),
   rest() shows a representative frame and holds it (reduced
   motion), hold() pauses and resumes it while it runs.
   Every element starts from a state set here, so seeking back to 0
   always returns the drawing to blank.
   ============================================================ */
const DIM = "rgba(255, 255, 255, 0.6)";
const BRIGHT = "rgba(255, 255, 255, 0.8)";

function mountSchematic(svg) {
  const build = svg && SCHEMATICS[svg.dataset.schematic];
  if (!build) return null;

  const css = getComputedStyle(svg);
  const colors = {
    red: css.getPropertyValue("--c-red").trim() || "#c40000",
    ground: css.getPropertyValue("--c-dark-bg").trim() || "#252525",
  };
  const parts = (name) => [...svg.querySelectorAll(`[data-s="${name}"]`)];
  const tl = build(parts, colors, svg);
  let running = false;

  return {
    start() {
      running = true;
      tl.restart();
    },
    stop() {
      running = false;
      tl.pause(0);
    },
    rest() {
      running = false;
      tl.pause("rest");
    },
    hold(paused) {
      if (running) tl.paused(paused);
    },
    destroy() {
      tl.kill();
    },
  };
}

const SCHEMATICS = {
  // Understand — the route work actually takes, against the one it is meant
  // to. A pulse runs the straight, intended line in a moment; the red signal
  // takes the long way round past the tools and the information, lighting
  // each node it reaches.
  map(parts, colors) {
    const [grid] = parts("grid");
    const [intended] = parts("intended");
    const [actual] = parts("actual");
    const [ghostPulse] = parts("intended-pulse");
    const [pulse] = parts("actual-pulse");
    const routes = parts("route");
    const nodes = parts("node");
    const boxes = nodes.map((node) => node.querySelector("rect"));
    const labels = nodes.map((node) => node.querySelector("text"));

    gsap.set([grid, intended, ...routes, ...labels], { opacity: 0 });
    gsap.set(actual, { strokeDasharray: "1 1", strokeDashoffset: 1 });
    gsap.set(boxes, { scale: 0, transformOrigin: "50% 50%" });

    const draw = 1.3;
    const tl = gsap.timeline({ paused: true });
    tl.to(grid, { opacity: 1, duration: 0.5, ease: "none" }, 0.15)
      .to(intended, { opacity: 1, duration: 0.4, ease: "none" }, 0.25)
      .to(actual, { strokeDashoffset: 0, duration: draw, ease: "none" }, 0.35);
    nodes.forEach((node, i) => {
      const at = 0.35 + parseFloat(node.dataset.at) * draw;
      tl.to(boxes[i], { scale: 1, duration: 0.35, ease: "back.out(2.5)" }, at - 0.05)
        .to(labels[i], { opacity: 1, duration: 0.3, ease: "none" }, at);
    });
    tl.to(routes, { opacity: 1, duration: 0.4, stagger: 0.12, ease: "none" }, 0.35 + draw);
    tl.add("rest");

    // The pulse's head runs 0 → 1.08 of the path as its offset runs from the
    // dash's length to -1, so a node at share s of the path is reached at
    // s / 1.08 of the run.
    const travel = 2.6;
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
    loop.fromTo(ghostPulse, { strokeDashoffset: 0.12 }, { strokeDashoffset: -1, duration: 1, ease: "none", immediateRender: false }, 0)
      .fromTo(pulse, { strokeDashoffset: 0.08 }, { strokeDashoffset: -1, duration: travel, ease: "none", immediateRender: false }, 0);
    nodes.forEach((node, i) => {
      const at = (parseFloat(node.dataset.at) / 1.08) * travel;
      loop.to(boxes[i], { fill: colors.red, stroke: colors.red, duration: 0.1, ease: "none" }, at)
        .to(boxes[i], { fill: colors.ground, stroke: DIM, duration: 0.7, ease: "power1.in" }, at + 0.35);
    });
    tl.add(loop, "rest+=0.3");
    return tl;
  },

  // Diagnose — the eight areas the copy names, around one shared cause. A
  // few at a time light up as symptoms and are traced back into the centre,
  // which answers in red; then it clears and another set is traced.
  trace(parts, colors) {
    const [grid] = parts("grid");
    const guides = parts("guide");
    const traces = parts("trace");
    const areas = parts("area");
    const [cause] = parts("cause");
    const [ping] = parts("ping");
    const [causeLabel] = parts("cause-label");
    const boxes = areas.map((area) => area.querySelector("rect"));
    const labels = areas.map((area) => area.querySelector("text"));

    gsap.set([grid, ...guides, ...labels], { opacity: 0 });
    gsap.set([cause, ...boxes], { scale: 0, transformOrigin: "50% 50%" });
    gsap.set(ping, { transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ paused: true });
    tl.to(grid, { opacity: 1, duration: 0.5, ease: "none" }, 0.15)
      .to(cause, { scale: 1, duration: 0.4, ease: "back.out(2.5)" }, 0.25)
      .to(boxes, { scale: 1, duration: 0.35, ease: "back.out(2.5)", stagger: 0.06 }, 0.35)
      .to(labels, { opacity: 1, duration: 0.3, ease: "none", stagger: 0.06 }, 0.45)
      .to(guides, { opacity: 1, duration: 0.4, ease: "none", stagger: 0.04 }, 0.7);
    const introEnd = 1.2;

    // Which areas show up as symptoms, cycle by cycle (indexes into the ring,
    // clockwise from the top) — always from more than one side.
    const cycles = [[1, 5, 0], [2, 6, 4], [7, 3, 0], [5, 1, 4]];
    const cycle = 3.4;
    const loop = gsap.timeline({ repeat: -1 });
    cycles.forEach((set, c) => {
      const t = c * cycle;
      set.forEach((k, j) => {
        loop.to(boxes[k], { stroke: colors.red, duration: 0.15, ease: "none" }, t + j * 0.18)
          .fromTo(traces[k], { strokeDashoffset: 1, opacity: 1 }, {
            strokeDashoffset: 0, duration: 0.7, ease: "power2.in", immediateRender: false,
          }, t + 0.35 + j * 0.22);
      });
      const hit = t + 1.05;
      loop.to(cause, { fill: colors.red, stroke: colors.red, duration: 0.12, ease: "none" }, hit)
        .fromTo(ping, { scale: 1, opacity: 0.9 }, { scale: 2.8, opacity: 0, duration: 0.9, ease: "power2.out", immediateRender: false }, hit)
        .to(causeLabel, { opacity: 1, duration: 0.25, ease: "none" }, hit + 0.05);
      const out = t + 2.6;
      loop.to(set.map((k) => traces[k]), { opacity: 0, duration: 0.5, ease: "none" }, out)
        .to(set.map((k) => boxes[k]), { stroke: DIM, duration: 0.5, ease: "none" }, out)
        .to(cause, { fill: colors.ground, stroke: BRIGHT, duration: 0.5, ease: "none" }, out)
        .to(causeLabel, { opacity: 0, duration: 0.4, ease: "none" }, out);
    });
    loop.set({}, {}, cycles.length * cycle);
    tl.add(loop, introEnd);
    // all three of the first set traced home, the cause in red
    tl.add("rest", introEnd + 1.95);
    return tl;
  },

  // Prioritise — four findings ranked by impact, each with its owner. The
  // bars grow, the rows sort themselves into rank and the first turns red;
  // then the figures move and they sort again.
  rank(parts, colors, svg) {
    const [grid] = parts("grid");
    const [head] = parts("head");
    const slotRows = parts("slot");
    const rows = parts("row");
    const bars = parts("bar");
    const slots = svg.dataset.slots.split(",").map(Number);
    const full = 220;
    // impact per finding, figure set by figure set; the loop runs back round
    // to the first, so it never jumps
    const sets = [
      [0.62, 0.95, 0.38, 0.78],
      [0.9, 0.55, 0.72, 0.3],
      [0.42, 0.68, 0.96, 0.58],
      [0.75, 0.35, 0.5, 0.88],
    ];
    const ranked = (values) => values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
    const slotOf = (values) => {
      const at = [];
      ranked(values).forEach((row, place) => (at[row] = slots[place]));
      return at;
    };

    bars.forEach((bar) => bar.classList.remove("is--first"));
    gsap.set([grid, head, ...slotRows, ...rows], { opacity: 0 });
    gsap.set(rows, { y: (i) => slots[i] });
    gsap.set(bars, { fill: DIM, attr: { width: 0 } });

    const tl = gsap.timeline({ paused: true });
    tl.to(grid, { opacity: 1, duration: 0.5, ease: "none" }, 0.15)
      .to(head, { opacity: 1, duration: 0.4, ease: "none" }, 0.25)
      .to(slotRows, { opacity: 1, duration: 0.3, ease: "none", stagger: 0.07 }, 0.3)
      .to(rows, { opacity: 1, duration: 0.3, ease: "none", stagger: 0.07 }, 0.4);
    bars.forEach((bar, i) => {
      tl.to(bar, { attr: { width: sets[0][i] * full }, duration: 0.6, ease: "power2.out" }, 0.45 + i * 0.08);
    });
    const first = slotOf(sets[0]);
    tl.to(rows, { y: (i) => first[i], duration: 0.8, ease: "power3.inOut" }, 1.5)
      .to(bars[ranked(sets[0])[0]], { fill: colors.red, duration: 0.3, ease: "none" }, 2.2);
    tl.add("rest", 2.5);

    const cycle = 3.5;
    const loop = gsap.timeline({ repeat: -1 });
    sets.forEach((values, k) => {
      const next = sets[(k + 1) % sets.length];
      const t = k * cycle;
      const at = slotOf(next);
      loop.to(bars[ranked(values)[0]], { fill: DIM, duration: 0.3, ease: "none" }, t + 1.6);
      bars.forEach((bar, i) => {
        loop.to(bar, { attr: { width: next[i] * full }, duration: 0.6, ease: "power2.inOut" }, t + 1.6);
      });
      loop.to(rows, { y: (i) => at[i], duration: 0.8, ease: "power3.inOut" }, t + 2.4)
        .to(bars[ranked(next)[0]], { fill: colors.red, duration: 0.3, ease: "none" }, t + 3.1);
    });
    loop.set({}, {}, sets.length * cycle);
    tl.add(loop, "rest");
    return tl;
  },
};
