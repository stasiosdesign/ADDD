/* ============================================================
   Fields — the grounds the homepage's drawings stand on, and the
   grids of small dots
   ------------------------------------------------------------
   Two:

   mountIsoField: the field behind a drawing — each service's diagram
   in the service tabs (ServiceTabs.astro), each step's schematic in
   its card (ApproachStack.astro), and the Technology Blueprint's card
   in the nav (ServiceCard.astro) — as the drawing's own ground plane:
   an axonometric lattice of dotted lines on the drawing's two plan
   axes, at 30° either way, a cell every MODULE of the drawing's units
   (or the field's own data-iso-module), projected from the drawing's
   origin at the drawing's scale (data-ground on its <svg>,
   src/scripts/iso.js), so the lattice runs through the drawing's
   setting-out cross and the forms stand on it, their faces hiding it
   under them. The dots along a line are a whole number to a cell, so
   every crossing is a dot. A field marked data-iso-field="levels"
   draws the drawing's levels instead, as a section sets them out:
   dotted lines straight across, about a cell apart, fitted to the
   field's height so they stand evenly between its top and foot, in the
   same dots (Before Revit's card). Held
   back to a faint white (or the field's own --iso-line, any colour,
   where a light field draws it dark), and run out to every edge of
   the field, which simply crops it: no margin, no frame, nothing at
   its corners. Drawn on one canvas per field, at the screen's pixel
   density, when the field is laid out and again whenever it or its
   drawing changes size, or its user asks (redraw: the nav's cards
   when the nav's theme changes their ink). It is still: nothing in it
   moves or flickers.

   mountDotGrid: the site's field of small square dots (.dot-grid,
   styles.css), set out by --dot-pitch, --dot-x and --dot-y (any
   fractional length) and drawn on a canvas, each dot placed on its own
   and snapped to the screen's pixels: every dot the same whole number
   of device pixels square (2px at the screen's density), however its
   position falls. Drawn by CSS gradients, as it was, a dot whose stripe
   began between two device pixels was smeared across three, so the
   dots came out square, oblong and near double by turns. A short field
   is drawn whole; a tall one (the approach band's) three screens of it
   round the view, moved on and drawn again as the view nears its ends,
   so the canvas never costs a field's whole height.

   mountDotFlicker: the flicker, over the approach band's grid (approach-
   stack.css), its dots placed by the caller and snapped as the grid's
   are, each a small square of its own while it is lit.

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
  // the dots' colour, resolved on the canvas itself, so --iso-line can be
  // any colour (a mix, currentColor) and the canvas is given plain values
  canvas.style.color = `var(--iso-line, ${LINE})`;
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  // the drawing the field stands behind, which names its ground's origin
  // in its own units (data-ground: "x y" in its viewBox)
  const drawing = el.parentElement?.querySelector(":scope > svg[data-ground]");
  // the cell, in the drawing's units, and what is drawn: the ground's
  // lattice, or the levels
  const module = Number(el.dataset.isoModule) || MODULE;
  const levels = el.dataset.isoField === "levels";

  let field = null;
  const snap = (v) => Math.round(v * field.dpr) / field.dpr;
  const dot = (X, Y) => ctx.fillRect(snap(X - LINE_DOT / 2), snap(Y - LINE_DOT / 2), LINE_DOT, LINE_DOT);
  // dots a little under LINE_STEP apart on the screen, a whole number to
  // a module
  const stepOf = (scale) => module / Math.max(2, Math.round((module * scale) / LINE_STEP));

  // The drawing's ground plane: its lines x = k·module and y = k·module,
  // projected as the drawing is (src/scripts/iso.js) from its own origin
  // at its own scale, each a run of dots a whole number to a module, so
  // where two lines cross there is always a dot. To every edge of the
  // field, which crops it.
  function drawGround() {
    const { width, height, ox, oy, scale } = field;
    const x0 = 0, x1 = width, y0 = 0, y1 = height;
    // the field's corners on the ground, for the lines that cross it
    const ground = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([X, Y]) => {
      const u = (X - ox) / scale / ISO;
      const v = (2 * (Y - oy)) / scale;
      return [(u + v) / 2, (v - u) / 2];
    });
    const lo = (i) => Math.min(...ground.map((g) => g[i]));
    const hi = (i) => Math.max(...ground.map((g) => g[i]));
    // (one ground unit is one screen unit long along either axis)
    const step = stepOf(scale);
    const at = (x, y) => [ox + (x - y) * ISO * scale, oy + ((x + y) / 2) * scale];
    const run = (fixed, along, swap) => {
      for (let k = Math.ceil(lo(fixed) / module); k <= Math.floor(hi(fixed) / module); k++) {
        for (let m = Math.ceil(lo(along) / step); m <= Math.floor(hi(along) / step); m++) {
          const [X, Y] = swap ? at(m * step, k * module) : at(k * module, m * step);
          if (X < x0 - 0.5 || X > x1 + 0.5 || Y < y0 - 0.5 || Y > y1 + 0.5) continue;
          dot(X, Y);
        }
      }
    };
    // the lines along y (x fixed), then along x (y fixed); where they
    // cross the dot is drawn twice, which the second simply covers
    run(0, 1, false);
    run(1, 0, true);
  }

  // The drawing's levels: dotted lines straight across, as many as fit the
  // field's height about a module apart, fitted to it, each in the middle
  // of its share, so the first and last stand half a gap in from the
  // field's top and foot, never against its edges, and the lines lie
  // evenly about its middle; their dots in columns from the origin, a
  // whole number to a gap.
  function drawLevels() {
    const { width, height, ox, scale } = field;
    const gap = height / Math.max(1, Math.round(height / (module * scale)));
    const step = gap / Math.max(2, Math.round(gap / LINE_STEP));
    for (let Y = gap / 2; Y < height; Y += gap) {
      for (let m = Math.ceil(-ox / step); ox + m * step <= width + 0.5; m++) dot(ox + m * step, Y);
    }
  }

  function draw() {
    if (!field) return;
    ctx.clearRect(0, 0, field.width, field.height);
    ctx.fillStyle = getComputedStyle(canvas).color;
    (levels ? drawLevels : drawGround)();
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
    // its box, centred — whole inside it (the default preserveAspectRatio)
    // or covering it, cropped ("slice", the nav's cards); without a
    // drawing, the field's middle at the screen's own scale
    let ox = width / 2, oy = height / 2, scale = 1;
    const view = drawing?.viewBox?.baseVal;
    if (drawing && view?.width) {
      const d = drawing.getBoundingClientRect();
      const slice = drawing.preserveAspectRatio?.baseVal?.meetOrSlice === SVGPreserveAspectRatio.SVG_MEETORSLICE_SLICE;
      scale = (slice ? Math.max : Math.min)(d.width / view.width, d.height / view.height);
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
    // drawn again as it stands, in the colour it now has
    redraw: draw,
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
export function mountDotGrid(el) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "absolute", left: "0", top: "0", display: "block", pointerEvents: "none" });
  // the grid's lengths, resolved where they are set (cqw, %, px alike):
  // a hidden box at --dot-x, --dot-y, as wide as the pitch and as tall
  // as a dot
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  Object.assign(probe.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    left: "var(--dot-x, 1px)",
    top: "var(--dot-y, 1px)",
    width: "var(--dot-pitch, 18px)",
    height: "var(--dot-size, 2px)",
  });
  el.append(probe, canvas);
  const ctx = canvas.getContext("2d");
  // the stretch the canvas holds, in the layer's own box (CSS px); the
  // layer's height and its top on the page as last drawn, so the scroll
  // can tell whether the view is still inside that stretch without
  // measuring the layout; and whether the layer is tall enough to need one
  let from = 0;
  let span = 0;
  let height = 0;
  let top = 0;
  let tall = false;

  // whether the view still lies well inside the stretch drawn, at scroll y
  const covered = (y) => {
    const at = y - top;
    const view = window.innerHeight;
    return from <= Math.max(0, at - view / 2) && from + span >= Math.min(height, at + 1.5 * view);
  };

  function draw(force) {
    const box = el.getBoundingClientRect();
    const p = getComputedStyle(probe);
    const pitch = parseFloat(p.width);
    const size = parseFloat(p.height) || 2;
    const x = parseFloat(p.left) || 0;
    const y = parseFloat(p.top) || 0;
    if (!box.width || !box.height || !(pitch > 1)) return;
    const view = window.innerHeight;
    height = box.height;
    top = box.top + window.scrollY;
    // a tall layer holds three screens round the view, until the view
    // comes within half a screen of either end
    let start = 0;
    let shown = height;
    tall = height > 3 * view;
    if (tall) {
      if (!force && span && covered(window.scrollY)) return;
      shown = 3 * view;
      start = gsap.utils.clamp(0, height - shown, -box.top - view);
    }
    const dpr = window.devicePixelRatio || 1;
    const top0 = Math.round(start * dpr);
    const w = Math.round(box.width * dpr);
    const h = Math.round(shown * dpr);
    // sized only when its size has changed: setting a canvas's size throws
    // its backing store away and makes a new one, which the GPU then has to
    // take in again; cleared, it keeps the one it has
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w / dpr}px`;
      canvas.style.height = `${h / dpr}px`;
    } else {
      ctx.clearRect(0, 0, w, h);
    }
    canvas.style.transform = top0 ? `translateY(${top0 / dpr}px)` : "";
    from = top0 / dpr;
    span = h / dpr;

    ctx.fillStyle = getComputedStyle(el).color;
    // each dot its own whole device pixels, its top left the nearest to
    // where its centre less half a dot falls
    const side = Math.max(1, Math.round(size * dpr));
    const half = size / 2;
    const columns = [];
    for (let k = Math.ceil((-size - x) / pitch); x + k * pitch - size <= box.width; k++) {
      columns.push(Math.round((x + k * pitch - half) * dpr));
    }
    for (let r = Math.ceil((from - size - y) / pitch); y + r * pitch - size <= from + span; r++) {
      const dy = Math.round((y + r * pitch - half) * dpr) - top0;
      for (const dx of columns) ctx.fillRect(dx, dy, side, side);
    }
  }

  // drawn again when the layer changes size, when its grid is set out
  // afresh (the style the approach band's script writes on it), when
  // the screen's density changes, and, tall, as the view moves along it.
  // A short layer is drawn whole, so the scroll never redraws it; a tall
  // one only while it is on the screen, and only when the view has left
  // the stretch drawn — told from the scroll position and what was
  // measured last, so a scroll frame reads nothing off the layout. (Every
  // scroll frame used to size and redraw every grid on the page, on
  // screen or not, and read the layout after the frame's other writes.)
  const resized = new ResizeObserver(() => draw(true));
  resized.observe(el);
  const restyled = new MutationObserver(() => draw(true));
  restyled.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
  let density = null;
  const watchDensity = () => {
    density?.removeEventListener("change", onDensity);
    density = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    density.addEventListener("change", onDensity);
  };
  const onDensity = () => {
    watchDensity();
    draw(true);
  };
  watchDensity();
  // The scroll, as the page's ScrollTrigger has it, while the layer is on
  // the screen: the stretch moved on once the view has left it. Nothing
  // is read off the layout to decide.
  const along = ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      if (tall && !covered(self.scroll())) draw(false);
    },
  });
  draw(true);

  return {
    draw: () => draw(true),
    destroy() {
      resized.disconnect();
      restyled.disconnect();
      along.kill();
      density?.removeEventListener("change", onDensity);
      canvas.remove();
      probe.remove();
    },
  };
}

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
