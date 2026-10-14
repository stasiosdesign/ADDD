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
   every crossing is a dot. A field marked data-iso-field="grid" draws
   a plain square grid instead, in the site's dots (.dot-grid's 2px
   squares), a cell apart both ways, fitted to the field's height so
   its rows stand evenly between its top and foot, and centred on the
   drawing's origin across (Before Revit's card). Held
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

   ============================================================ */
// the ground's cell, in the drawing's own units, and its dotted lines:
// about this far apart on the screen, this big, in this white
const MODULE = 54;
const LINE_STEP = 6;
const LINE_DOT = 1.5;
const LINE = "rgba(255, 255, 255, 0.11)";
// the square grid's dots: the size of the site's .dot-grid (styles.css)
const GRID_DOT = 2;
const ISO = Math.cos(Math.PI / 6);

export function mountIsoField(el) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // the dots' colour, resolved on the canvas itself, so --iso-line can be
  // any colour (a mix, currentColor) and the canvas is given plain values
  canvas.style.color = `var(--iso-line, ${LINE})`;
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  // the drawing the field stands behind, which names its ground's origin
  // in its own units (data-ground: "x y" in its viewBox): its sibling, or
  // the one data-iso-ground names among its siblings' (a field shared by
  // several drawings, the service tabs'). Such a drawing is set out within
  // its own frame ([data-iso-frame], the field's size), so the field
  // takes its place in the frame however far the frame has moved.
  const drawing = el.dataset.isoGround
    ? el.parentElement?.querySelector(`${el.dataset.isoGround}[data-ground]`)
    : el.parentElement?.querySelector(":scope > svg[data-ground]");
  const frame = el.dataset.isoGround ? drawing?.closest("[data-iso-frame]") : null;
  // the cell, in the drawing's units, and what is drawn: the ground's
  // lattice, or a square grid
  const module = Number(el.dataset.isoModule) || MODULE;
  const mode = el.dataset.isoField;

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

  // A square grid of dots a cell apart both ways, the cell fitted to the
  // field's height so the first and last rows stand half a cell in from
  // its top and foot, never against its edges, and its columns set out from
  // the drawing's origin, so the grid is centred on it across. Each dot
  // the site's 2px square, snapped to the device pixel.
  function drawGrid() {
    const { width, height, ox, scale } = field;
    const gap = height / Math.max(1, Math.round(height / (module * scale)));
    const half = GRID_DOT / 2;
    const first = ox - Math.floor(ox / gap) * gap;
    for (let Y = gap / 2; Y < height; Y += gap) {
      for (let X = first; X <= width + 0.5; X += gap) ctx.fillRect(snap(X - half), snap(Y - half), GRID_DOT, GRID_DOT);
    }
  }

  function draw() {
    if (!field) return;
    ctx.clearRect(0, 0, field.width, field.height);
    ctx.fillStyle = getComputedStyle(canvas).color;
    (mode === "grid" ? drawGrid : drawGround)();
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
      const base = frame ? frame.getBoundingClientRect() : box;
      const slice = drawing.preserveAspectRatio?.baseVal?.meetOrSlice === SVGPreserveAspectRatio.SVG_MEETORSLICE_SLICE;
      scale = (slice ? Math.max : Math.min)(d.width / view.width, d.height / view.height);
      const [gx, gy] = drawing.dataset.ground.split(/[ ,]+/).map(Number);
      ox = d.left - base.left + (d.width - view.width * scale) / 2 + (gx - view.x) * scale;
      oy = d.top - base.top + (d.height - view.height * scale) / 2 + (gy - view.y) * scale;
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

// The grain: no two neighbouring dots quite alike. Each dot of a grid is
// one of four brightnesses (a share of the grid's own colour, the four
// averaging about the colour itself), picked by a hash of its place on the
// grid's lattice, so a dot is always as bright as it was, through every
// redraw and wherever the drawn stretch has moved.
const GRAIN = [
  { at: 0.2, level: 1.2 },
  { at: 0.5, level: 1.05 },
  { at: 0.8, level: 0.9 },
  { at: 1, level: 0.7 },
];
export function grain(k, r) {
  let h = Math.imul(k | 0, 374761393) + Math.imul(r | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  const v = (h >>> 0) / 4294967296;
  return GRAIN.findIndex((g) => v < g.at);
}
// a colour, any CSS colour, as its red, green, blue and alpha (0–1)
const rgba = (() => {
  const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  return (color) => {
    c.clearRect(0, 0, 1, 1);
    c.fillStyle = color;
    c.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };
})();

const PROBE_SPAN = 64;

export function mountDotGrid(el) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "absolute", left: "0", top: "0", display: "block", pointerEvents: "none" });
  // the grid's lengths, resolved where they are set (cqw, %, px alike):
  // a hidden box at --dot-x, --dot-y, as wide as the pitch and as tall
  // as a dot. It is PROBE_SPAN pitches wide, as layout rounds a box to
  // 1/64px: one pitch measured alone drifts off a CSS-placed block by that
  // rounding at every step (0.2px a card across the logo wall).
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  Object.assign(probe.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    left: "var(--dot-x, 1px)",
    top: "var(--dot-y, 1px)",
    width: `calc(var(--dot-pitch, 18px) * ${PROBE_SPAN})`,
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
    const pitch = parseFloat(p.width) / PROBE_SPAN;
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

    // each dot its own whole device pixels, its top left the nearest to
    // where its centre less half a dot falls; gathered by its grain, one
    // path to each brightness, so the canvas is filled four times
    const side = Math.max(1, Math.round(size * dpr));
    const half = size / 2;
    const columns = [];
    for (let k = Math.ceil((-size - x) / pitch); x + k * pitch - size <= box.width; k++) {
      columns.push([k, Math.round((x + k * pitch - half) * dpr)]);
    }
    const paths = GRAIN.map(() => new Path2D());
    for (let r = Math.ceil((from - size - y) / pitch); y + r * pitch - size <= from + span; r++) {
      const dy = Math.round((y + r * pitch - half) * dpr) - top0;
      for (const [k, dx] of columns) paths[grain(k, r)].rect(dx, dy, side, side);
    }
    const ink = rgba(getComputedStyle(el).color);
    paths.forEach((path, i) => {
      ctx.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${Math.min(1, ink.a * GRAIN[i].level).toFixed(4)})`;
      ctx.fill(path);
    });
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
