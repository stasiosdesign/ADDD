/* ============================================================
   Fields — the grounds the homepage's drawings stand on, and the
   grids of small dots
   ------------------------------------------------------------
   Two:

   mountIsoField: the field behind a drawing — each service's diagram
   on the service stack (index.astro), and each step's schematic in
   its card (ApproachStack.astro) — as the drawing's own ground plane:
   an axonometric lattice of dotted lines on the drawing's two plan
   axes, at 30° either way, a cell every MODULE of the drawing's units,
   projected from the drawing's origin at the drawing's scale
   (data-ground on its <svg>, src/scripts/iso.js), so the lattice runs
   through the drawing's setting-out cross and the forms stand on it,
   their faces hiding it under them. The dots along a line are a whole
   number to a cell, so every crossing is a dot. Held back to a faint
   white (or the field's own --iso-line: the nav's Services cards draw
   it dark, nav.css), and run out to every edge of the field, which
   simply crops it: no margin, no frame, nothing at its corners. Drawn
   on one canvas per field, at the screen's pixel density, when the
   field is laid out and again
   whenever it or its drawing changes size. It is still: nothing in it
   moves or flickers.

   mountDotFlicker: the flicker, over a grid drawn by CSS (the
   approach band's, approach-stack.css), its dots placed by the
   caller, each a small square of its own while it is lit.

   The flicker: now and then one dot lights up red, switched rather
   than faded, on and off in a short burst like a status light, held
   a moment, then a last blink out. Never more than a few at once, and
   only while the field is on the screen; with reduced motion, none.
   ============================================================ */
// the ground's cell, in the drawing's own units, and its dotted lines:
// about this far apart on the screen, this big, in this white
const MODULE = 54;
const LINE_STEP = 6;
const LINE_DOT = 1.5;
const LINE = "rgba(255, 255, 255, 0.11)";
const ISO = Math.cos(Math.PI / 6);
// how often a dot lights (s, at random within), and how many at once
const FLICKER = { min: 0.4, max: 1, most: 3 };
// the burst: on or off, and for how long (s), in turn
const BLINK = [[1, 0.08], [0, 0.06], [1, 0.06], [0, 0.12], [1, 0.5], [0, 0.07], [1, 0.05], [0, 0]];

// One burst, as a timeline that calls set(on) at each switch.
function blink(set, done) {
  const tl = gsap.timeline({ onComplete: done });
  let at = 0;
  BLINK.forEach(([on, hold]) => {
    tl.call(set, [on === 1], at);
    at += hold;
  });
  return tl;
}

// A light now and then while the field is on the screen: light() is
// called at random intervals and starts a burst, or declines (returns
// nothing). Returns start, stop and the set of bursts running.
function scheduler(el, light, reducedMotion) {
  const bursts = new Set();
  let next = null;
  const schedule = () => {
    next = gsap.delayedCall(gsap.utils.random(FLICKER.min, FLICKER.max), () => {
      if (bursts.size < FLICKER.most) {
        const tl = light(() => bursts.delete(tl));
        if (tl) bursts.add(tl);
      }
      schedule();
    });
  };
  const start = () => {
    if (!reducedMotion && !next) schedule();
  };
  const stop = () => {
    next?.kill();
    next = null;
  };
  const watcher = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
  watcher.observe(el);
  return {
    bursts,
    destroy() {
      stop();
      watcher.disconnect();
      bursts.forEach((tl) => tl.progress(1).kill());
      bursts.clear();
    },
  };
}

export function mountIsoField(el) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  // the drawing the field stands behind, which names its ground's origin
  // in its own units (data-ground: "x y" in its viewBox)
  const drawing = el.parentElement?.querySelector(":scope > svg[data-ground]");

  let field = null;
  const snap = (v) => Math.round(v * field.dpr) / field.dpr;

  // The drawing's ground plane: its lines x = k·MODULE and y = k·MODULE,
  // projected as the drawing is (src/scripts/iso.js) from its own origin
  // at its own scale, each a run of dots a whole number to a module, so
  // where two lines cross there is always a dot. To every edge of the
  // field, which crops it.
  function draw() {
    const { width, height, ox, oy, scale } = field;
    ctx.clearRect(0, 0, width, height);
    const x0 = 0, x1 = width, y0 = 0, y1 = height;
    // the field's corners on the ground, for the lines that cross it
    const ground = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([X, Y]) => {
      const u = (X - ox) / scale / ISO;
      const v = (2 * (Y - oy)) / scale;
      return [(u + v) / 2, (v - u) / 2];
    });
    const lo = (i) => Math.min(...ground.map((g) => g[i]));
    const hi = (i) => Math.max(...ground.map((g) => g[i]));
    // dots a little under LINE_STEP apart on the screen, a whole number to
    // a module (one ground unit is one screen unit long along either axis)
    const per = Math.max(2, Math.round((MODULE * scale) / LINE_STEP));
    const step = MODULE / per;
    const at = (x, y) => [ox + (x - y) * ISO * scale, oy + ((x + y) / 2) * scale];
    ctx.fillStyle = getComputedStyle(el).getPropertyValue("--iso-line").trim() || LINE;
    const run = (fixed, along, swap) => {
      for (let k = Math.ceil(lo(fixed) / MODULE); k <= Math.floor(hi(fixed) / MODULE); k++) {
        for (let m = Math.ceil(lo(along) / step); m <= Math.floor(hi(along) / step); m++) {
          const [X, Y] = swap ? at(m * step, k * MODULE) : at(k * MODULE, m * step);
          if (X < x0 - 0.5 || X > x1 + 0.5 || Y < y0 - 0.5 || Y > y1 + 0.5) continue;
          ctx.fillRect(snap(X - LINE_DOT / 2), snap(Y - LINE_DOT / 2), LINE_DOT, LINE_DOT);
        }
      }
    };
    // the lines along y (x fixed), then along x (y fixed); where they
    // cross the dot is drawn twice, which the second simply covers
    run(0, 1, false);
    run(1, 0, true);
  }

  function layout() {
    const box = el.getBoundingClientRect();
    const { width, height } = box;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the drawing's origin and scale in the field: its viewBox fitted into
    // its box, centred (the default preserveAspectRatio); without a drawing,
    // the field's middle at the screen's own scale
    let ox = width / 2, oy = height / 2, scale = 1;
    const view = drawing?.viewBox?.baseVal;
    if (drawing && view?.width) {
      const d = drawing.getBoundingClientRect();
      scale = Math.min(d.width / view.width, d.height / view.height);
      const [gx, gy] = drawing.dataset.ground.split(/[ ,]+/).map(Number);
      ox = d.left - box.left + (d.width - view.width * scale) / 2 + (gx - view.x) * scale;
      oy = d.top - box.top + (d.height - view.height * scale) / 2 + (gy - view.y) * scale;
    }
    field = { width, height, dpr, ox, oy, scale };
    draw();
  }

  layout();

  // laid out again whenever the field or its drawing changes size
  let pending = 0;
  const resizer = new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(layout);
  });
  resizer.observe(el);
  if (drawing) resizer.observe(drawing);

  return {
    destroy() {
      cancelAnimationFrame(pending);
      resizer.disconnect();
      canvas.remove();
    },
  };
}

// The flicker over a grid drawn elsewhere: pick() names a dot to light,
// as the top-left corner of its 2px square in the layer's own
// coordinates, or nothing when there is none to light just now.
export function mountDotFlicker(layer, { pick, reducedMotion = false } = {}) {
  const flicker = scheduler(layer, (done) => {
    const at = pick();
    if (!at) return null;
    const el = document.createElement("span");
    el.className = "dot-flicker";
    el.style.transform = `translate(${at.x}px, ${at.y}px)`;
    layer.appendChild(el);
    return blink(
      (on) => {
        el.style.opacity = on ? "1" : "0";
      },
      () => {
        el.remove();
        done();
      },
    );
  }, reducedMotion);

  return {
    destroy() {
      flicker.destroy();
      layer.querySelectorAll(".dot-flicker").forEach((el) => el.remove());
    },
  };
}
