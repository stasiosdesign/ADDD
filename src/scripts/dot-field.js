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
   every crossing is a dot. A field marked data-iso-line="dash" (the AEC
   Tech Partners hero) draws its lines as dash-dot lines instead, a dot
   on every crossing and evenly between (drawDashed). A field marked
   data-iso-field="grid" draws
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
   so the canvas never costs a field's whole height. A band of a field
   can be drawn as a grid of cells instead (zone: the homepage
   statement's, cell-grid.js), the dots between its lines gone, with two
   layers of its own so the grid can come and go by opacity alone.

   ============================================================ */
// the ground's cell, in the drawing's own units, and its dotted lines:
// about this far apart on the screen, this big, in this white
const MODULE = 54;
const LINE_STEP = 6;
const LINE_DOT = 1.5;
const LINE = "rgba(255, 255, 255, 0.11)";
// the square grid's dots: the size of the site's .dot-grid (styles.css)
const GRID_DOT = 2;
// A ground drawn as a draughtsman's dash-dot line instead
// (data-iso-line="dash", the AEC Tech Partners hero): each line a run of
// units, a dash and a dot, a gap either side of the dot, about DASH_UNIT
// long on the screen and a whole number to a cell, so the dots fall on
// every crossing of two lines and evenly between them; the dashes this
// thick, the gaps this share of a unit, the dots this big, and a
// crossing's this big.
const DASH_UNIT = 30;
const DASH_WIDTH = 0.8;
const DASH_GAP = 0.14;
const DASH_DOT = 1.25;
const CROSS_DOT = 1.75;
// isometric paper's lines (data-iso-line="paper"): this fine
const PAPER_WIDTH = 0.75;

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
  // lattice, or a square grid. A field with a cell of its own on the
  // screen (data-iso-cell, in px: the Technology Blueprint's ground) takes
  // the whole number of the drawing's cells nearest it, at the drawing's
  // scale (layout), so its lines run through the drawing's own wherever
  // the drawing is drawn, at any size.
  const own = Number(el.dataset.isoModule) || MODULE;
  const cell = Number(el.dataset.isoCell) || 0;
  let module = own;
  const mode = el.dataset.isoField;
  const dashed = el.dataset.isoLine === "dash";
  // or drawn as isometric paper (data-iso-line="paper", the Ongoing
  // Advisory's ground): the lattice's lines whole and fine, and an upright
  // line through every crossing, which halves each cell into two
  // equilateral triangles (drawPaper)
  const paper = el.dataset.isoLine === "paper";
  // The ground seen from above rather than at an angle (data-iso-plan=
  // "flat", the Workflow Workshop's): its two axes level and upright, so
  // its lattice is a plain square grid, a cell the same length on the
  // screen either way.
  const flat = el.dataset.isoPlan === "flat";
  // the lattice's angle to the level (degrees): the drawings' isometric
  // 30°, or the field's own (data-iso-angle: the AEC Tech Partners hero's
  // flatter 2:1, about 26.57°, after its reference); each axis a unit
  // long on the screen either way
  const angle = ((Number(el.dataset.isoAngle) || 30) * Math.PI) / 180;
  const AX = Math.cos(angle);
  const AY = Math.sin(angle);

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
      if (flat) return [(X - ox) / scale, (Y - oy) / scale];
      const u = (X - ox) / scale / AX;
      const v = (Y - oy) / scale / AY;
      return [(u + v) / 2, (v - u) / 2];
    });
    const lo = (i) => Math.min(...ground.map((g) => g[i]));
    const hi = (i) => Math.max(...ground.map((g) => g[i]));
    // (one ground unit is one screen unit long along either axis)
    const step = stepOf(scale);
    const at = flat
      ? (x, y) => [ox + x * scale, oy + y * scale]
      : (x, y) => [ox + (x - y) * AX * scale, oy + (x + y) * AY * scale];
    if (paper) {
      drawPaper(lo, hi, at, x0, x1);
      return;
    }
    if (dashed) {
      drawDashed(lo, hi, at, x0, x1, y0, y1);
      return;
    }
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

  // The ground's lines as dash-dot lines (dashed, DASH_UNIT): along each
  // line, from crossing to crossing, a dot, a gap, a dash, a gap, and
  // again, a whole number of units to a cell, so every crossing is a dot
  // (drawn a little larger, CROSS_DOT: it holds the two lines that meet
  // there) and the dots between stand level across the lattice. The
  // dashes are one path stroked once, the dots one path filled once (one
  // dot per place, so a crossing is never drawn twice over itself).
  function drawDashed(lo, hi, at, x0, x1, y0, y1) {
    const { scale } = field;
    const unit = module / Math.max(1, Math.round((module * scale) / DASH_UNIT));
    const perCell = Math.round(module / unit);
    // a dash's ends, in ground units from the dot before it: past the dot
    // and its gap, and as far short of the next
    const trim = (DASH_DOT / 2 + DASH_GAP * unit * scale) / scale;
    const dashes = new Path2D();
    const dots = new Path2D();
    const crossings = new Path2D();
    const seen = new Set();
    const inside = (X, Y, pad) => X >= x0 - pad && X <= x1 + pad && Y >= y0 - pad && Y <= y1 + pad;
    const run = (fixed, along, swap) => {
      const point = (k, u) => (swap ? at(u, k * module) : at(k * module, u));
      for (let k = Math.ceil(lo(fixed) / module); k <= Math.floor(hi(fixed) / module); k++) {
        for (let m = Math.floor(lo(along) / unit) - 1; m <= Math.ceil(hi(along) / unit); m++) {
          const [X, Y] = point(k, m * unit);
          // the dot: at a crossing on both lines' runs, so once
          if (inside(X, Y, 2)) {
            const cross = ((m % perCell) + perCell) % perCell === 0;
            const key = cross ? `${swap ? m / perCell : k},${swap ? k : m / perCell}` : null;
            if (!cross) dots.rect(snap(X - DASH_DOT / 2), snap(Y - DASH_DOT / 2), DASH_DOT, DASH_DOT);
            else if (!seen.has(key)) {
              seen.add(key);
              crossings.rect(snap(X - CROSS_DOT / 2), snap(Y - CROSS_DOT / 2), CROSS_DOT, CROSS_DOT);
            }
          }
          // the dash to the next dot
          const [ax, ay] = point(k, m * unit + trim);
          const [bx, by] = point(k, (m + 1) * unit - trim);
          if (!inside(ax, ay, unit * scale) && !inside(bx, by, unit * scale)) continue;
          dashes.moveTo(ax, ay);
          dashes.lineTo(bx, by);
        }
      }
    };
    run(0, 1, false);
    run(1, 0, true);
    ctx.lineWidth = DASH_WIDTH;
    ctx.lineCap = "butt";
    ctx.stroke(dashes);
    ctx.fill(dots);
    ctx.fill(crossings);
  }

  // Isometric paper: each of the lattice's lines drawn whole, from edge to
  // edge (the canvas crops them), and an upright line through every
  // crossing: the crossings stand in columns a cell's width apart across
  // (AX of a cell, as every crossing is a whole number of cells along x
  // less a whole number along y). All one path, stroked once, a hairline
  // snapped to the device pixel where it stands upright.
  function drawPaper(lo, hi, at, x0, x1) {
    const { ox, scale, dpr, height } = field;
    const lines = new Path2D();
    const run = (fixed, swap) => {
      for (let k = Math.ceil(lo(fixed) / module); k <= Math.floor(hi(fixed) / module); k++) {
        const a = swap ? at(lo(0), k * module) : at(k * module, lo(1));
        const b = swap ? at(hi(0), k * module) : at(k * module, hi(1));
        lines.moveTo(a[0], a[1]);
        lines.lineTo(b[0], b[1]);
      }
    };
    run(0, false);
    run(1, true);
    const across = AX * module * scale;
    for (let X = ox - Math.floor((ox - x0) / across) * across; X <= x1 + 0.5; X += across) {
      const x = (Math.round(X * dpr) + 0.5) / dpr;
      lines.moveTo(x, 0);
      lines.lineTo(x, height);
    }
    ctx.lineWidth = PAPER_WIDTH;
    ctx.stroke(lines);
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
    ctx.fillStyle = ctx.strokeStyle = getComputedStyle(canvas).color;
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
    if (cell) module = own * Math.max(1, Math.round(cell / (own * scale)));
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
// a place on a lattice as a number in 0–1, always the same for the same place
export function hash01(k, r) {
  let h = Math.imul(k | 0, 374761393) + Math.imul(r | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function grain(k, r) {
  const v = hash01(k, r);
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
// the lift round a region, in this many steps from none to the whole
const LIFT_STEPS = 7;

// A mounted grid's lattice, read off its probe as draw() reads it: the pitch,
// a dot's size and the first dot's centre (x, y) from the grid's own top
// left corner, in CSS px; null until the grid is mounted. For whatever
// sets itself out by the grid's dots (the statement's hold, sticky-title.js).
export function latticeOf(el) {
  const probe = el.querySelector(":scope > [data-dot-probe]");
  if (!probe) return null;
  const p = getComputedStyle(probe);
  const pitch = parseFloat(p.width) / PROBE_SPAN;
  if (!(pitch > 1)) return null;
  return { pitch, size: parseFloat(p.height) || 2, x: parseFloat(p.left) || 0, y: parseFloat(p.top) || 0 };
}

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
  probe.setAttribute("data-dot-probe", "");
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
  // Held with a frame (sticky-title.js): the canvas moved down the layer by
  // shift, so the dots stand still on the screen while the page scrolls under
  // a held frame, with reserve more of the layer drawn above its top for the
  // canvas to bring down. Both in CSS px.
  let shift = 0;
  let reserve = 0;
  // the size it was last drawn at (CSS px), for the observer to compare
  let drawnSize = [NaN, NaN];
  // Lifted round some regions of the layer (dot-lift.js: the logos, the
  // statement's button): each dot's own brightness, grain and all, raised
  // by up to a lift's amount, in full inside one of its regions and
  // falling away over its reach beyond the edge, each dot a little more
  // or less than its neighbours so the edge of the lift is a soft, uneven
  // halo and never a shape. Each source keeps a lift of its own (by key),
  // with its own reach and amount; where two meet, the higher lift shows.
  const lifts = new Map();
  // Glows (dot-lift.js: the statement's button): each a small layer of
  // its own over the field, holding only the extra brightness of the dots
  // round one box, so it can be faded in and out without the field being
  // drawn again. Drawn once from the lattice, on the same dots, with the
  // same grain, and moved down the layer with the canvas when held.
  const glows = new Map();
  // A zone drawn as a grid of cells (cell-grid.js: the homepage
  // statement's): across a band of the layer, the dots that stand on the
  // cells' lines (every n-th column and row of the lattice) are kept and
  // brightened a little, and the dots between them thin out and are gone,
  // each at its own depth into the zone (a share of its own, so the field
  // dissolves unevenly rather than in rows), the zone's top and foot eased
  // over fadeTop and fadeBottom. Drawn into the field itself, and into two
  // layers of its own over the field, for the zone to come and go without
  // the field being drawn again: "restore", the dots the zone took away,
  // and "boost", the extra brightness of the dots on its lines; at amount
  // 1 the first is hidden and the second shown, at 0 the other way round
  // (the field as it would be without the zone). { x0, y0 } is a point on
  // a line each way, top, bottom, left and right the zone's extent, all in
  // the layer's own box, CSS px; still, a zone that never comes and goes,
  // drawn into the field alone, with no layers; null for none.
  let zone = null;
  let zoneAmount = 1;
  const zoneLayers = {};
  const place = () => {
    const y = from + shift;
    canvas.style.transform = y ? `translateY(${y.toFixed(2)}px)` : "";
    const held = shift ? `translateY(${shift.toFixed(2)}px)` : "";
    glows.forEach((g) => { g.el.style.transform = held; });
    Object.values(zoneLayers).forEach((layer) => { layer.style.transform = held; });
  };
  let span = 0;
  let height = 0;
  let top = 0;
  let tall = false;

  // whether the view still lies well inside the stretch drawn, at scroll y
  const covered = (y) => {
    // (the layer's stretch the view shows, with the canvas moved down by shift)
    const at = y - top - shift;
    const view = window.innerHeight;
    return from <= Math.max(0, at - view / 2) && from + span >= Math.min(height, at + 1.5 * view);
  };

  // the lattice as the probe sets it out: the pitch, a dot's size, and the
  // middle of one column (x) and one row (y), in the layer's own box
  const setOut = () => {
    const p = getComputedStyle(probe);
    return { pitch: parseFloat(p.width) / PROBE_SPAN, size: parseFloat(p.height) || 2, x: parseFloat(p.left) || 0, y: parseFloat(p.top) || 0 };
  };

  // The lifts at a dot (lifts, above): one of LIFT_STEPS up to the highest
  // amount any source asks, as a multiple of the dot's own brightness;
  // nothing beyond a lift's own extent and reach is looked at. Null
  // without lifts.
  function liftField() {
    if (!lifts.size) return null;
    const lift = [...lifts.values()];
    const amount = Math.max(...lift.map((l) => l.amount));
    const extents = lift.map((l) => l.regions.reduce((e, g) => ({
      x0: Math.min(e.x0, g.x - l.reach), y0: Math.min(e.y0, g.y - l.reach),
      x1: Math.max(e.x1, g.x + g.w + l.reach), y1: Math.max(e.y1, g.y + g.h + l.reach),
    }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }));
    return (cx, cy, k, r) => {
      let up = 0;
      lift.forEach((l, i) => {
        const e = extents[i];
        if (cx < e.x0 || cx > e.x1 || cy < e.y0 || cy > e.y1) return;
        let d = Infinity;
        for (const g of l.regions) {
          const ex = Math.max(g.x - cx, 0, cx - g.x - g.w);
          const ey = Math.max(g.y - cy, 0, cy - g.y - g.h);
          d = Math.min(d, Math.hypot(ex, ey));
          if (d === 0) break;
        }
        if (d >= l.reach) return;
        const f = Math.min(1, (1 - d / l.reach) * (0.85 + 0.3 * hash01(r, k)));
        up = Math.max(up, (f * l.amount) / amount);
      });
      return 1 + (amount * Math.round(up * (LIFT_STEPS - 1))) / (LIFT_STEPS - 1);
    };
  }

  // The zone at a dot (zone, above), for a lattice of this pitch: how deep
  // into it a row is (0 outside, 1 in full, eased at either edge), which
  // lines a dot is on (0 none, 1 a line, 2 a crossing), and whether a dot
  // between them has gone at its depth. Null without a zone.
  function zoneField(pitch) {
    if (!zone) return null;
    const { x0, y0, n, top, bottom, fadeTop = 0, fadeBottom = 0, left = -Infinity, right = Infinity } = zone;
    const onLine = (v, v0) => {
      const m = Math.round((v - v0) / pitch);
      return ((m % n) + n) % n === 0;
    };
    const ease = (t) => t * t * (3 - 2 * t);
    const depth = (cx, cy) => {
      if (cy <= top || cy >= bottom || cx <= left || cx >= right) return 0;
      const a = fadeTop > 0 ? Math.min(1, (cy - top) / fadeTop) : 1;
      const b = fadeBottom > 0 ? Math.min(1, (bottom - cy) / fadeBottom) : 1;
      return ease(Math.min(a, b));
    };
    const lines = (cx, cy) => (onLine(cx, x0) ? 1 : 0) + (onLine(cy, y0) ? 1 : 0);
    return {
      depth,
      lines,
      gone: (k, r, cx, cy) => {
        const w = depth(cx, cy);
        return w > 0 && !lines(cx, cy) && hash01(k * 5 + 17, r * 3 + 29) < w;
      },
      // a dot on a line raised by the zone's boost (a crossing by its own)
      // at its depth: the field's own drawing of it, for a still zone
      up: (cx, cy) => {
        const on = lines(cx, cy);
        const w = on && depth(cx, cy);
        return w ? 1 + (on > 1 ? zone.cross : zone.boost) * w : 1;
      },
    };
  }

  // Dots onto a canvas c whose top stands at y = from in the layer's own
  // box, the rows from there to y = to: each dot whose alpha (alphaAt) is
  // more than nothing, its own whole device pixels, its top left the
  // nearest to where its centre less half a dot falls, gathered by
  // alpha, one path to each, so the canvas is filled once per brightness
  // (the field's four grains, times its lifts) rather than once per dot.
  function paint(c, lattice, width, dpr, from, to, ink, alphaAt) {
    const { pitch, size, x, y } = lattice;
    const side = Math.max(1, Math.round(size * dpr));
    const half = size / 2;
    const top0 = Math.round(from * dpr);
    const columns = [];
    for (let k = Math.ceil((-size - x) / pitch); x + k * pitch - size <= width; k++) {
      columns.push([k, x + k * pitch, Math.round((x + k * pitch - half) * dpr)]);
    }
    const paths = new Map();
    for (let r = Math.ceil((from - size - y) / pitch); y + r * pitch - size <= to; r++) {
      const cy = y + r * pitch;
      const dy = Math.round((cy - half) * dpr) - top0;
      for (const [k, cx, dx] of columns) {
        const a = Math.round(Math.min(1, alphaAt(k, r, cx, cy)) * 10000);
        if (a < 20) continue;
        let path = paths.get(a);
        if (!path) paths.set(a, (path = new Path2D()));
        path.rect(dx, dy, side, side);
      }
    }
    paths.forEach((path, a) => {
      c.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${(a / 10000).toFixed(4)})`;
      c.fill(path);
    });
  }

  // The zone's two layers (zone, above), drawn whole over the zone's
  // extent within what the field holds (its height, and the reserve above
  // its top when held), on the field's own lattice and device pixels, so
  // each dot falls on the field's own exactly.
  function paintZone(lattice, width, dpr, ink, lifted, z) {
    const y0 = zone ? Math.max(-reserve, zone.top) : 0;
    const y1 = zone ? Math.min(height, zone.bottom) : 0;
    // a still zone is drawn into the field itself (draw), with no layers
    if (!z || zone.still || y1 - y0 < 1) {
      Object.values(zoneLayers).forEach((layer) => layer.remove());
      Object.keys(zoneLayers).forEach((key) => delete zoneLayers[key]);
      return;
    }
    const top0 = Math.round(y0 * dpr);
    const w = Math.round(width * dpr);
    const h = Math.round(y1 * dpr) - top0;
    const { boost, cross } = zone;
    const alphas = {
      // the dots the zone took away, as the field had them
      restore: (k, r, cx, cy) => (z.gone(k, r, cx, cy) ? ink.a * GRAIN[grain(k, r)].level * lifted(cx, cy, k, r) : 0),
      // over each dot on a line, what brings it up by the zone's boost (a
      // crossing by its own) at its depth, eighths of the way in: over a
      // dot of alpha a, an alpha o makes a + o(1 - a)
      boost: (k, r, cx, cy) => {
        const on = z.lines(cx, cy);
        const d = on && Math.round(z.depth(cx, cy) * 8) / 8;
        if (!d) return 0;
        const a = Math.min(0.95, ink.a * GRAIN[grain(k, r)].level * lifted(cx, cy, k, r));
        return (a * (on > 1 ? cross : boost) * d) / (1 - a);
      },
    };
    Object.entries(alphas).forEach(([key, alphaAt]) => {
      let layer = zoneLayers[key];
      if (!layer) {
        layer = document.createElement("canvas");
        layer.setAttribute("aria-hidden", "true");
        Object.assign(layer.style, { position: "absolute", left: "0", display: "block", pointerEvents: "none" });
        el.append(layer);
        zoneLayers[key] = layer;
      }
      if (layer.width !== w || layer.height !== h) {
        layer.width = w;
        layer.height = h;
        layer.style.width = `${w / dpr}px`;
        layer.style.height = `${h / dpr}px`;
      }
      const c = layer.getContext("2d");
      c.clearRect(0, 0, w, h);
      layer.style.top = `${top0 / dpr}px`;
      paint(c, lattice, width, dpr, top0 / dpr, (top0 + h) / dpr, ink, alphaAt);
    });
    showZone();
    place();
  }
  // the zone's layers at its amount: hidden outright at none
  const showZone = () => {
    const set = (layer, o) => {
      if (!layer) return;
      layer.style.opacity = o.toFixed(3);
      layer.style.visibility = o > 0.001 ? "" : "hidden";
    };
    set(zoneLayers.restore, 1 - zoneAmount);
    set(zoneLayers.boost, zoneAmount);
  };

  // A glow's layer (glow, below) drawn where its box now is: the dots round
  // it raised on a soft ellipse, none the zone has taken away.
  function paintGlow(g) {
    const { box, reach, amount } = g;
    const { pitch, size, x, y } = setOut();
    if (!(pitch > 1)) return;
    const dpr = window.devicePixelRatio || 1;
    // the layer: the box and its reach, on whole pixels
    const x0 = Math.floor(box.x - reach);
    const y0 = Math.floor(box.y - reach);
    const w = Math.ceil(box.w + 2 * reach) + 1;
    const h = Math.ceil(box.h + 2 * reach) + 1;
    g.el.width = Math.round(w * dpr);
    g.el.height = Math.round(h * dpr);
    g.el.style.width = `${w}px`;
    g.el.style.height = `${h}px`;
    g.el.style.left = `${x0}px`;
    g.el.style.top = `${y0}px`;
    const c = g.el.getContext("2d");
    c.clearRect(0, 0, g.el.width, g.el.height);
    const ink = rgba(getComputedStyle(el).color);
    const side = Math.max(1, Math.round(size * dpr));
    const half = size / 2;
    const z = zoneField(pitch);
    // the halo: an ellipse through the box's sides plus the reach, the
    // rise from its edge to the box eased both ends (smoothstep), so it
    // neither starts nor ends on a line
    const mx = box.x + box.w / 2;
    const my = box.y + box.h / 2;
    const rx = box.w / 2 + reach;
    const ry = box.h / 2 + reach * 0.85;
    const ix = box.w / 2;
    const iy = box.h / 2;
    for (let r = Math.ceil((y0 - size - y) / pitch); y + r * pitch - size <= y0 + h; r++) {
      const cy = y + r * pitch;
      for (let k = Math.ceil((x0 - size - x) / pitch); x + k * pitch - size <= x0 + w; k++) {
        const cx = x + k * pitch;
        if (z?.gone(k, r, cx, cy)) continue;
        // along the dot's own direction from the middle: 1 inside the
        // inner ellipse (through the box's sides), 0 at the outer, eased
        // between
        const dx = cx - mx;
        const dy = cy - my;
        const rho = Math.hypot(dx, dy);
        const cos = rho ? dx / rho : 1;
        const sin = rho ? dy / rho : 0;
        const rIn = 1 / Math.hypot(cos / ix, sin / iy);
        const rOut = 1 / Math.hypot(cos / rx, sin / ry);
        if (rho >= rOut) continue;
        let f = rho <= rIn ? 1 : 1 - (rho - rIn) / (rOut - rIn);
        f = f * f * (3 - 2 * f);
        // the grain of the glow: each dot its own share, a few left out
        const n = hash01(r * 7 + 3, k * 11 + 5);
        if (n < 0.08 * (1 - f)) continue;
        const up = f * amount * (0.6 + 0.8 * n);
        const a = Math.min(1, ink.a * GRAIN[grain(k, r)].level * up);
        if (a <= 0.002) continue;
        c.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${a.toFixed(4)})`;
        c.fillRect(Math.round((cx - half - x0) * dpr), Math.round((cy - half - y0) * dpr), side, side);
      }
    }
    place();
  }

  function draw(force) {
    const box = el.getBoundingClientRect();
    const lattice = setOut();
    const { pitch } = lattice;
    if (!box.width || !box.height || !(pitch > 1)) return;
    drawnSize = [box.width, box.height];
    const view = window.innerHeight;
    height = box.height;
    top = box.top + window.scrollY;
    // a tall layer holds three screens round the view, until the view
    // comes within half a screen of either end
    let start = -reserve;
    let shown = height + reserve;
    tall = height > 3 * view;
    if (tall) {
      if (!force && span && covered(window.scrollY)) return;
      shown = 3 * view;
      start = gsap.utils.clamp(-reserve, height - shown, -box.top - shift - view);
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
    from = top0 / dpr;
    place();
    span = h / dpr;

    // each dot at its grain's share of the field's colour, raised by its
    // lift, and left out where the zone has taken it away
    const ink = rgba(getComputedStyle(el).color);
    const liftAt = liftField();
    const lifted = liftAt ?? (() => 1);
    const z = zoneField(pitch);
    const still = z && zone.still;
    paint(ctx, lattice, box.width, dpr, from, from + span, ink, (k, r, cx, cy) =>
      z?.gone(k, r, cx, cy) ? 0 : ink.a * GRAIN[grain(k, r)].level * lifted(cx, cy, k, r) * (still ? z.up(cx, cy) : 1));
    // the zone's own layers, drawn whole, whenever the field is drawn afresh
    if (force) paintZone(lattice, box.width, dpr, ink, lifted, z);
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
  // drawn again when its size changes — not on the observer's first call,
  // which only reports the size it was just drawn at
  let sized = null;
  const resized = new ResizeObserver(([entry]) => {
    const box = entry.borderBoxSize?.[0];
    const now = box ? [box.inlineSize, box.blockSize] : [NaN, NaN];
    const before = sized ?? drawnSize;
    sized = now;
    if (Math.abs(now[0] - before[0]) < 0.01 && Math.abs(now[1] - before[1]) < 0.01) return;
    draw(true);
  });
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

  const api = {
    draw: () => draw(true),
    // held with a frame: this far down the layer (0 to let go), and this much
    // of the layer kept drawn above its top for it
    shift(y) {
      if (y === shift) return;
      shift = y;
      place();
      if (tall && !covered(window.scrollY)) draw(false);
    },
    reserve(h) {
      if (h === reserve) return;
      reserve = h;
      draw(true);
    },
    // lifted round these regions ({ x, y, w, h } in the layer's own box, CSS
    // px, as drawn: a held layer's canvas is moved down by reserve, so a
    // region meant for the dots as they stand once held is given reserve
    // higher) by up to amount (a share of the dots' own brightness),
    // falling away over reach px beyond each; null for none. One lift per
    // source (key), so two sources never undo each other's.
    lift(regions, reach, amount, key = "") {
      if (regions?.length) lifts.set(key, { regions, reach, amount });
      else if (!lifts.delete(key)) return;
      draw(true);
    },
    // how far the canvas is moved down the layer once held (reserve, CSS
    // px), for whatever sets a lift out against the held dots
    get held() {
      return reserve;
    },
    // A glow round a box ({ x, y, w, h } in the layer's own box, CSS px,
    // as the lift's regions are): the dots inside it and round it raised
    // by up to amount (a share of their own brightness), in full under the
    // box and falling away softly over reach px beyond its sides, on an
    // elliptical curve rather than the box's own edges, each dot a little
    // more or less than its neighbours and a few left out, so the glow is
    // a loose, grainy halo and never a shape. Its own layer (a canvas, in
    // the field, at opacity 0 until its owner fades it), drawn once here;
    // called again for the same key, drawn again where the box now is;
    // null for none.
    glow(key, box, reach, amount) {
      let g = glows.get(key);
      if (!box) {
        g?.el.remove();
        glows.delete(key);
        return null;
      }
      if (!g) {
        const layer = document.createElement("canvas");
        layer.setAttribute("aria-hidden", "true");
        Object.assign(layer.style, { position: "absolute", left: "0", top: "0", display: "block", pointerEvents: "none", opacity: "0" });
        el.append(layer);
        g = { el: layer };
        glows.set(key, g);
      }
      Object.assign(g, { box, reach, amount });
      paintGlow(g);
      return g.el;
    },
    // A zone drawn as a grid of cells ({ x0, y0, n, top, bottom, fadeTop,
    // fadeBottom, boost, cross }: zone, above), or null for none; the
    // field, its zone's layers and its glows drawn again for it.
    zone(spec) {
      if (!spec && !zone) return;
      zone = spec;
      draw(true);
      glows.forEach(paintGlow);
    },
    // how much of the zone shows: 1 the grid, 0 the field as it would be
    // without it; opacity alone, nothing drawn again
    zoneAmount(amount) {
      zoneAmount = amount;
      showZone();
    },
    destroy() {
      resized.disconnect();
      restyled.disconnect();
      along.kill();
      density?.removeEventListener("change", onDensity);
      delete el.dotGrid;
      glows.forEach((g) => g.el.remove());
      glows.clear();
      Object.values(zoneLayers).forEach((layer) => layer.remove());
      canvas.remove();
      probe.remove();
    },
  };
  el.dotGrid = api;
  return api;
}
