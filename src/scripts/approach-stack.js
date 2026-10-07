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
   Small flat drawings, each one paused
   GSAP timeline: a draw-in, then a light loop with no end. start()
   plays it from the top, stop() takes it back to the undrawn state
   (when a breakpoint change sets the stack up again), rest() shows
   a representative frame and holds it (reduced motion), hold()
   pauses and resumes it while it runs. Every element starts from
   a state set here, so seeking back to 0 always returns the
   drawing to blank. The loops are slow and few: one signal at a
   time, in the site's red, on hairlines that otherwise hold still.
   ============================================================ */
function mountSchematic(svg) {
  const build = svg && SCHEMATICS[svg.dataset.schematic];
  if (!build) return null;

  const css = getComputedStyle(svg);
  const colors = {
    red: css.getPropertyValue("--c-red").trim() || "#c40000",
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

// The stylesheet's own fill or stroke for a face, so a tween can hand it
// back exactly.
const paint = (el, prop) => getComputedStyle(el)[prop];

const SCHEMATICS = {
  // Understand — four nodes: work, tools, information, decisions. They
  // appear and the route draws in between them; then a red signal runs the
  // zig-zag, each node catching it as it passes, while the dashed line
  // straight across shows the way it was meant to go.
  map(parts, colors) {
    const [intended] = parts("intended");
    const [route] = parts("route");
    const [pulse] = parts("pulse");
    const nodes = parts("node");
    const fill = paint(nodes[0], "fill");
    const stroke = paint(nodes[0], "stroke");

    gsap.set([intended, ...nodes], { opacity: 0 });
    gsap.set(nodes, { scale: 0.6, transformOrigin: "50% 50%" });
    gsap.set(route, { strokeDasharray: "1 1", strokeDashoffset: 1 });

    const tl = gsap.timeline({ paused: true });
    tl.to(nodes, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out", stagger: 0.1 }, 0.15)
      .to(route, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, 0.5)
      .to(intended, { opacity: 1, duration: 0.5, ease: "none" }, 1.3);
    tl.add("rest", 1.8);

    // The pulse's head runs 0 → 1.08 of the route as its offset runs from
    // the dash's length to -1, so a node at share s of the route is reached
    // at s / 1.08 of the run.
    const travel = 3.2;
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    loop.fromTo(pulse, { strokeDashoffset: 0.08 }, { strokeDashoffset: -1, duration: travel, ease: "none", immediateRender: false }, 0);
    nodes.forEach((node) => {
      const at = (parseFloat(node.dataset.at) / 1.08) * travel;
      loop.to(node, { fill: colors.red, stroke: colors.red, duration: 0.12, ease: "none" }, at)
        .to(node, { fill, stroke, duration: 0.9, ease: "power1.in" }, at + 0.3);
    });
    tl.add(loop, "rest");
    return tl;
  },

  // Diagnose — the practice as a stack of layers. A scan runs down through
  // them one by one until it reaches the layer the trouble starts in, which
  // holds in red with a marker on it while the layers above draw back to
  // open it up; then it all settles for the next pass.
  trace(parts, colors, svg) {
    const cause = Number(svg.dataset.cause);
    const layers = parts("layer");
    const [marker] = parts("marker");
    const [ping] = parts("ping");
    const above = layers.slice(0, cause);
    const line = paint(layers[0], "stroke");
    const bright = "rgba(255, 255, 255, 0.95)";

    gsap.set(layers, { opacity: 0, y: 8 });
    gsap.set(marker, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });
    gsap.set(ping, { opacity: 0, transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ paused: true });
    tl.to(layers, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, 0.1);
    const introEnd = 0.9;

    const loop = gsap.timeline({ repeat: -1 });
    // the scan, top down: each layer it passes brightens and lets go, until
    // the cause, which turns red and holds
    for (let i = 0; i < cause; i++) {
      loop.to(layers[i], { stroke: bright, duration: 0.12, ease: "none" }, i * 0.22)
        .to(layers[i], { stroke: line, duration: 0.5, ease: "power1.in" }, i * 0.22 + 0.2);
    }
    const found = cause * 0.22;
    loop.to(layers[cause], { stroke: colors.red, duration: 0.15, ease: "none" }, found);
    // the layers above draw back, opening a gap over it
    const open = found + 0.3;
    loop.to(above, { y: -10, duration: 0.8, ease: "power3.inOut", stagger: 0.05 }, open);
    const shown = open + 0.4;
    loop.to(marker, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, shown)
      .fromTo(ping, { scale: 1, opacity: 0.9 }, { scale: 2.8, opacity: 0, duration: 1, ease: "power2.out", immediateRender: false }, shown + 0.15);
    // a beat to read it, then everything settles back
    const close = shown + 1.8;
    loop.to(marker, { opacity: 0, scale: 0.6, duration: 0.35, ease: "power1.in" }, close)
      .to(above, { y: 0, duration: 0.8, ease: "power3.inOut", stagger: { each: 0.05, from: "end" } }, close + 0.15)
      .to(layers[cause], { stroke: line, duration: 0.6, ease: "none" }, close + 0.6);
    loop.set({}, {}, close + 2);

    tl.add(loop, introEnd);
    // found and opened, the marker on it
    tl.add("rest", introEnd + shown + 0.5);
    return tl;
  },

  // Prioritise — four findings as bars of impact on one baseline. They rise
  // into a ranking and the tallest, what should change first, turns red;
  // then the figures move, the bars find their new heights and the red
  // passes to whichever now leads.
  rank(parts, colors, svg) {
    const [base] = parts("base");
    const bars = parts("bar");
    const floor = Number(svg.dataset.base);
    // the stylesheet marks the resting leader; from here the script does
    bars.forEach((bar) => bar.classList.remove("is--first"));
    const fill = paint(bars[0], "fill");
    const stroke = paint(bars[0], "stroke");
    // impact per finding, figure set by figure set; the loop runs back round
    // to the first, so it never jumps
    const sets = [
      [96, 152, 64, 120],
      [136, 76, 108, 52],
      [72, 112, 160, 88],
      [104, 60, 84, 144],
    ];
    const lead = (values) => values.indexOf(Math.max(...values));
    const height = (h) => ({ attr: { y: floor - h, height: h } });

    gsap.set(base, { opacity: 0 });
    gsap.set(bars, { opacity: 0, ...height(0) });

    const tl = gsap.timeline({ paused: true });
    tl.to(base, { opacity: 1, duration: 0.5, ease: "none" }, 0.1)
      .to(bars, { opacity: 1, duration: 0.2, ease: "none", stagger: 0.08 }, 0.35);
    bars.forEach((bar, i) => {
      tl.to(bar, { ...height(sets[0][i]), duration: 0.9, ease: "power3.out" }, 0.4 + i * 0.1);
    });
    tl.to(bars[lead(sets[0])], { fill: colors.red, stroke: colors.red, duration: 0.3, ease: "none" }, 1.5);
    tl.add("rest", 1.9);

    const cycle = 3.6;
    const loop = gsap.timeline({ repeat: -1 });
    sets.forEach((values, k) => {
      const next = sets[(k + 1) % sets.length];
      const t = k * cycle;
      loop.to(bars[lead(values)], { fill, stroke, duration: 0.4, ease: "none" }, t + 2);
      bars.forEach((bar, i) => {
        loop.to(bar, { ...height(next[i]), duration: 1, ease: "power3.inOut" }, t + 2);
      });
      loop.to(bars[lead(next)], { fill: colors.red, stroke: colors.red, duration: 0.3, ease: "none" }, t + 3);
    });
    loop.set({}, {}, sets.length * cycle);
    tl.add(loop, "rest");
    return tl;
  },
};
