/* ============================================================
   Service diagrams — the four services drawn in the homepage's
   service tabs, moving (src/components/ServiceDiagram.astro)
   ------------------------------------------------------------
   Each drawing is its own idea, and each moves by it, one thing at a
   time, slowly, with a rest between:

     0  Workflow Workshop     a signal runs the loop and stops where the
                              work sticks; the red rises from there to
                              the report, whose lines are written in
     1  Before Revit          the loose sheets come into register at the
                              review, and the model is built over them;
                              then the sheets loosen for the next project
     2  Technology Blueprint  the roadmap is drawn one leg at a time,
                              each milestone lighting the system under it
     3  Ongoing Advisory      a session runs round the ring, each regular
                              point on it answering as it passes

   A part changes colour by a class (is--lit, or the accent's own), which
   the stylesheet eases ("service diagrams", styles.css): its colours are
   mixes of the field's ink, which only the stylesheet can work out. The
   markup is the drawing at rest, and every loop comes back to it. It
   runs only while the drawing is on screen, and never under reduced
   motion, where the drawing simply stands at rest. GSAP and
   ScrollTrigger are the site's globals.
   ============================================================ */

// The dashes run along a path a fraction of its length at a time
// (pathLength="1"), so the offsets are tweened unrounded (autoRound:
// false): rounded to whole pixels, a dash would only ever jump from one
// end of its path to the other.

// an element's transform origin, from the point the markup names
const origin = (el) => el.dataset.origin;

// How far along a path (0–1) the point nearest (x, y) is, and how far it
// is from it.
function along(path, x, y) {
  const length = path.getTotalLength();
  let best = [0, Infinity];
  for (let s = 0; s <= 120; s++) {
    const p = path.getPointAtLength((length * s) / 120);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best[1]) best = [s / 120, d];
  }
  return best;
}

// A class switched on or off at a point in the timeline, every time the
// playhead passes it.
const toggle = (tl, els, name, on, at) =>
  tl.call(() => [].concat(els).forEach((el) => el.classList.toggle(name, on)), null, at);

const LOOPS = {
  // Workflow Workshop
  0(parts) {
    const [pulse] = parts("pulse");
    const [stuck] = parts("stuck");
    const [rise] = parts("rise");
    const [mark] = parts("mark");
    const lines = parts("line");

    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "none" } });
    // from the drawing at rest to the start: the report blank, the
    // sticking point not yet found
    toggle(tl, stuck, "is--accent", false, 0);
    tl.set(rise, { scale: 0, svgOrigin: origin(rise) }, 0)
      .set(mark, { opacity: 0 }, 0)
      .set(lines, { scale: 0, svgOrigin: (_, el) => origin(el) }, 0)
      .set(pulse, { opacity: 1, strokeDashoffset: 0.06, autoRound: false }, 0);
    // the work round its loop, and stuck where it started
    tl.to(pulse, { strokeDashoffset: -0.94, duration: 2.8, ease: "power1.inOut", autoRound: false }, 0.4)
      .to(pulse, { opacity: 0, duration: 0.3 }, 3.15);
    toggle(tl, stuck, "is--accent", true, 3.1);
    // the red up to the report, and the report written
    tl.to(rise, { scale: 1, duration: 0.7, ease: "power2.inOut" }, 3.4)
      .to(mark, { opacity: 1, duration: 0.3 }, 4.0)
      .to(lines, { scale: 1, duration: 0.45, ease: "power2.out", stagger: 0.18 }, 4.15);
    // held, then round again
    tl.to({}, { duration: 2.4 }, 4.95);
    return tl;
  },

  // Before Revit
  1(parts) {
    const sheets = parts("sheet");
    const [review] = parts("review");
    const [model] = parts("model");
    const guides = parts("guide");
    // each sheet's resting offset from register, as the markup sets it
    const loose = sheets.map((sheet) => ({ x: gsap.getProperty(sheet, "x"), y: gsap.getProperty(sheet, "y") }));

    const tl = gsap.timeline({ repeat: -1, paused: true });
    // the model not yet there, the review faint
    tl.set(model, { opacity: 0, y: 10 }, 0)
      .set(guides, { opacity: 0 }, 0)
      .set(review, { opacity: 0.4 }, 0);
    // the review comes up, and the sheets into its register, the lowest first
    tl.to(review, { opacity: 1, duration: 0.5, ease: "none" }, 0.6)
      .to(sheets, { x: 0, y: 0, duration: 1.1, ease: "power3.inOut", stagger: 0.18 }, 0.9)
      // the model, built over them
      .to(guides, { opacity: 1, duration: 0.4, ease: "none" }, 2.3)
      .to(model, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 2.45);
    // held; then the sheets loosen again, as the next project's are, and
    // the model goes
    tl.to(sheets, { x: (i) => loose[i].x, y: (i) => loose[i].y, duration: 1.2, ease: "power2.inOut", stagger: 0.12 }, 6.2)
      .to(model, { opacity: 0, duration: 0.6, ease: "none" }, 6.4)
      .to(guides, { opacity: 0, duration: 0.4, ease: "none" }, 6.4)
      .to(review, { opacity: 0.4, duration: 0.6, ease: "none" }, 6.6);
    tl.to({}, { duration: 0.6 }, 7.6);
    return tl;
  },

  // Technology Blueprint
  2(parts) {
    const legs = parts("leg");
    const milestones = parts("milestone");
    const systems = Object.fromEntries(parts("part").map((el) => [el.dataset.k, el]));

    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.set([...legs, ...milestones], { opacity: 0 }, 0);
    // the roadmap in order: a milestone, the system under it answering,
    // then the leg on to the next
    milestones.forEach((milestone, i) => {
      const at = 0.6 + i * 0.9;
      const system = systems[milestone.dataset.k];
      tl.to(milestone, { opacity: 1, duration: 0.25, ease: "none" }, at);
      toggle(tl, system, "is--lit", true, at);
      toggle(tl, system, "is--lit", false, at + 0.45);
      if (legs[i]) tl.to(legs[i], { opacity: 1, duration: 0.45, ease: "none" }, at + 0.35);
    });
    // held, the roadmap complete, then cleared for the next pass
    tl.to([...legs, ...milestones], { opacity: 0, duration: 0.6, ease: "none" }, 6.6);
    tl.to({}, { duration: 0.6 }, 7.2);
    return tl;
  },

  // Ongoing Advisory
  3(parts) {
    // the ring's back half (left to right over the top), then its front
    const [back, front] = parts("orbit");
    // in the order the run passes them
    const sessions = parts("session");

    const lap = 7.2;
    const half = lap / 2;
    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "none" } });
    tl.set([back, front], { opacity: 1, strokeDashoffset: 0.06, autoRound: false }, 0);
    tl.fromTo(back, { strokeDashoffset: 0.06 }, { strokeDashoffset: -1, duration: half, immediateRender: false, autoRound: false }, 0)
      .fromTo(front, { strokeDashoffset: 0.06 }, { strokeDashoffset: -1, duration: half, immediateRender: false, autoRound: false }, half);
    // each session as the run passes it: where it falls along its half
    // of the ring, found on the path itself (the ring is an ellipse, so
    // a quarter of the way round is not a quarter of the way along)
    sessions.forEach((session) => {
      const [k, share] = [back, front]
        .map((half, k) => [k, ...along(half, +session.getAttribute("cx"), +session.getAttribute("cy"))])
        .sort((a, b) => a[2] - b[2])[0];
      const at = (k + share) * half;
      toggle(tl, session, "is--lit", true, at);
      toggle(tl, session, "is--lit", false, at + 0.4);
    });
    return tl;
  },
};

export function mountServiceDiagram(svg) {
  const build = LOOPS[svg.dataset.serviceDiagram];
  if (!build) return { destroy() {} };
  const parts = (name) => [...svg.querySelectorAll(`[data-s="${name}"]`)];
  // every moving part as the markup has it, to hand back on teardown
  const moving = [...svg.querySelectorAll("[data-s]")].map((el) => ({
    el,
    transform: el.getAttribute("transform"),
    classes: el.getAttribute("class"),
  }));

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const tl = build(parts);
    // runs while the drawing is on screen, and holds where it is otherwise
    const trigger = ScrollTrigger.create({
      trigger: svg,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => tl.paused(!self.isActive),
    });
    if (trigger.isActive) tl.play();
    return () => {
      trigger.kill();
      tl.kill();
      // back to the drawing at rest
      moving.forEach(({ el, transform, classes }) => {
        gsap.set(el, { clearProps: "all" });
        if (transform) el.setAttribute("transform", transform);
        else el.removeAttribute("transform");
        el.setAttribute("class", classes);
      });
    };
  });

  return {
    destroy() {
      mm.revert();
    },
  };
}
