/* ============================================================
   Dot fields — the homepage's grids of small dots
   ------------------------------------------------------------
   Two:

   mountDotField: the backdrop of each service's diagram on the
   service stack (index.astro, styles.css "service stack"). A square
   grid set out on the field it fills rather than cut from a
   wallpaper: a dot in each corner, the same margin on all four
   sides, and the spacing worked out so the rows and columns divide
   the field exactly, each axis as near the target pitch as a whole
   number of steps allows. The corners carry small solid triangles,
   after the logo's, each with its right angle on the corner and its
   long side facing in, so the grid reads as drawn to its box. Drawn on one
   canvas per field, at the screen's pixel density, when the field is
   laid out and again whenever it changes size. It is still: a card
   coming onto the stack shows its field as it is, with nothing
   flickering in it.

   mountDotFlicker: the flicker, over a grid drawn by CSS (the
   approach band's, approach-stack.css), its dots placed by the
   caller, each a small square of its own while it is lit.

   The flicker: now and then one dot lights up red, switched rather
   than faded, on and off in a short burst like a status light, held
   a moment, then a last blink out. Never more than a few at once, and
   only while the field is on the screen; with reduced motion, none.
   ============================================================ */
// the target distance between dots, and the margin round the grid (CSS px)
const PITCH = 18;
const INSET = 18;
const DOT = 2;
// the corner marks: right-angled triangles, after the logo's, their legs
// this long (CSS px)
const CORNER = 7;
const BASE = "rgba(255, 255, 255, 0.14)";
const MARK = "rgba(255, 255, 255, 0.6)";
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

export function mountDotField(el) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let grid = null;

  // the dots' positions along one side: a whole number of equal steps
  // from the margin at one end to the margin at the other
  const axis = (length) => {
    const span = length - 2 * INSET;
    const count = Math.max(2, Math.floor(span / PITCH) + 1);
    const step = span / (count - 1);
    return Array.from({ length: count }, (_, k) => INSET + k * step);
  };
  const snap = (v) => Math.round(v * grid.dpr) / grid.dpr;
  const isCorner = (i, j) => (i === 0 || i === grid.xs.length - 1) && (j === 0 || j === grid.ys.length - 1);

  function dot(x, y, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(snap(x - DOT / 2), snap(y - DOT / 2), DOT, DOT);
  }

  // a corner's mark: a small solid triangle, its right angle on the grid's
  // corner and its long side facing in, towards the middle of the field
  // (sx, sy: which way is in, across and down)
  function corner(x, y, sx, sy) {
    ctx.fillStyle = MARK;
    ctx.beginPath();
    ctx.moveTo(snap(x), snap(y));
    ctx.lineTo(snap(x + sx * CORNER), snap(y));
    ctx.lineTo(snap(x), snap(y + sy * CORNER));
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, grid.width, grid.height);
    grid.ys.forEach((y, j) => grid.xs.forEach((x, i) => (isCorner(i, j) ? corner(x, y, i === 0 ? 1 : -1, j === 0 ? 1 : -1) : dot(x, y, BASE))));
  }

  function layout() {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grid = { width, height, dpr, xs: axis(width), ys: axis(height) };
    draw();
  }

  layout();

  let pending = 0;
  const resizer = new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(layout);
  });
  resizer.observe(el);

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
