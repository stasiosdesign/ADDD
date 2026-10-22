/* ============================================================
   The Diagnose and Prioritise figures — the second and third steps'
   drawings in the homepage's approach stack (ApproachStack.astro),
   Hairline figures drawn on Hairline's kernel (vendor/hairline-kernel.js),
   as Understand's is (understand-figure.js)
   ------------------------------------------------------------
   Strata (Diagnose): the practice taken down through its layers. Five
   thin rounded slabs, each two by two cells of the card's lattice, stand
   apart over its lines, guides rising from its nodes: work, tools,
   data, infrastructure, people. The pointer's height picks a layer; the
   slabs above it lift off, the nearest first, opening it up, and it takes
   the bright edge. At rest the fourth, where the trouble starts, is open
   and bright.

   Massing (Prioritise): the findings as a massing model, nine rounded
   towers on a three by three grid on a plinth sunk into the ground, one
   to a cell of the card's lattice, whose lines run between them as the
   streets, across the plinth's open top; storeys on their fronts,
   their heights the impact each would have. The pointer is where the
   effort goes: the towers near it rise, the farther the less, the rest
   settle back, and whichever now stands tallest, what should change
   first, takes the bright edge. At rest the heights mirror about the
   middle, the tallest in the centre.

   Both keep the site's true isometric (src/scripts/iso.js) rather than
   Hairline's 2:1: Cam(45, 1/√3, √1.5) is iso.js's projection exactly, one
   world unit a viewBox unit, so the card's 30° lattice (dot-field.js)
   keeps its 54-unit cell and its origin. Their frame is Hairline's
   400 × 320; the card shows the middle 400 × 256, so each origin is the
   old schematic's, 32 lower. Built and checked with the hairline-create
   skill (.claude/skills/; working copies in source-assets/hairline/,
   strata.js and massing.js), whose rules they keep.

   While the card is on screen an unseen pointer walks each figure's tour,
   and a real one takes over from it. The card's start/hold/stop/rest/
   destroy, as mountUnderstandFigure's.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, clamp, facing, fit, prism, proj, rings, ringAt, run, open, poly, seg, unproj,
  spring, stepS, tween, tset, tval, tdone,
  flatDot, mk, place, pointer, put, register, disposer, solid, inject, tour,
} = HL;

// the site's isometric, centred on a ground origin of the frame
function camera(oy) {
  const C = Cam(45, Math.sqrt(1 / 3), Math.sqrt(1.5));
  fit(C, [[0, 0, 0]], 200, oy);
  return C;
}

// the dashed cross of setting-out on the ground, a dot at each end
function settingOut(g, C, P, reach) {
  mk("path", { d: seg(P(-reach, 0, 0), P(reach, 0, 0)) + seg(P(0, -reach, 0), P(0, reach, 0)), class: "dash" }, g);
  [[-reach, 0], [reach, 0], [0, -reach], [0, reach]].forEach(([x, y]) => place(flatDot(g, C, 1.1, "dot m"), P(x, y, 0)));
}

/* --- Strata ---------------------------------------------------- */
// the card's lattice cell (dot-field.js's 54): each slab is two by two of
// them, its edges on the lattice's lines, the stack standing on its nodes
const CELL = 54;
const S_HALF = CELL, S_T = 4, S_GAP = 21, S_N = 5, S_CAUSE = 3, S_LIFT = 18;
/** A slab's foot at rest, listed top first. */
const sFoot = (i) => (S_N - 1 - i) * S_GAP;

function strata({ stage, svg }) {
  const bag = disposer();
  const C = camera(216);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  settingOut(g, C, P, 2 * CELL);
  // the guides up from the two side corners' nodes of the lattice, behind
  // every slab
  const guides = mk("path", { class: "dash" }, g);
  const [ring, inner] = rings(-S_HALF, -S_HALF, S_HALF, S_HALF, 2.5, 1.6);

  // bottom first, so each slab covers what is under it
  const slabs = [];
  for (let i = S_N - 1; i >= 0; i--) slabs[i] = { i, tw: tween(i < S_CAUSE ? S_LIFT : 0), el: solid(g), drawn: NaN };

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const s of slabs) {
      const z = sFoot(s.i) + tval(s.tw, now);
      if (!tdone(s.tw, now)) moving = true;
      if (z === s.drawn) continue;
      s.drawn = z;
      put(s.el, prism(P, front, ring, inner, z, z + S_T));
    }
    const top = slabs[0].drawn + S_T;
    guides.setAttribute("d", seg(P(-S_HALF, S_HALF, 0), P(-S_HALF, S_HALF, top)) + seg(P(S_HALF, -S_HALF, 0), P(S_HALF, -S_HALF, top)));
    return moving;
  });
  bag.add(B.unregister);

  // The layer under the pointer, judged on each slab's resting top: the
  // one that puts the pointer nearest its middle, if any is near enough.
  function pickAt(p) {
    let best = null, d = S_HALF * 1.15;
    for (let i = 0; i < S_N; i++) {
      const [x, y] = unproj(C, p[0], p[1], sFoot(i) + S_T), e = Math.hypot(x, y);
      if (e < d) { d = e; best = i; }
    }
    return best;
  }
  // the slabs above the pick lift off it, staggered out from it
  function choose(i) {
    const now = performance.now(), at = i ?? S_CAUSE;
    for (const s of slabs) {
      tset(s.tw, s.i < at ? S_LIFT : 0, now, Math.abs(s.i - at) * 45);
      s.el.sil.classList.toggle("hi", s.i === at);
    }
    B.wake();
  }
  choose(null);

  bag.add(pointer(stage, { move: (p) => choose(pickAt(p)), leave: () => choose(null) }));
  bag.add(() => svg.replaceChildren());
  return bag.dispose;
}

/* --- Massing --------------------------------------------------- */
// The towers stand in the card's lattice: each in one 54 cell, with the
// lattice's lines running between them as the streets. The lattice is set
// out from M_GROUND (half a cell off the figure's middle, so the middle
// tower stands in a cell, not on a crossing), and the plinth is three by
// three cells, its edges on the lines. Its top is the ground itself, left
// open, so the card's own lattice runs across it.
const M_SIZE = 32, M_PB = 6, M_FLOOR = CELL / 4, M_HALF = 1.5 * CELL, M_HMAX = 92, M_REACH = 64, M_OY = 196;
// heights by row (x) then column (y): the tallest in the middle
const M_REST = [36, 52, 28, 52, 84, 44, 28, 44, 20];

/** The share of full height at u reaches from the pointer: 1 → .31 at 42% → .09 at the edge and beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

// A plinth sunk into the ground, its top at the ground's level: its sides
// filled, its top open, so whatever is drawn on the ground shows on it.
function sunkPlinth(g, P, front, ring, depth) {
  const side = run(ring, front);
  mk("path", { d: poly(ringAt(P, side, 0).concat(ringAt(P, side, -depth).reverse())), class: "fo" }, g);
  const el = solid(g);
  el.sil.classList.add("nf");
  put(el, prism(P, front, ring, null, -depth, 0));
}

function massing({ stage, svg }) {
  const bag = disposer();
  const C = camera(M_OY);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  let over = null, lead = null;

  // no crease: the lattice's line runs along its top edge
  const [pr] = rings(-M_HALF, -M_HALF, M_HALF, M_HALF, 3, 2);
  sunkPlinth(g, P, front, pr, M_PB);

  // back to front, by x + y, so each tower covers the ones behind it
  const towers = M_REST.map((h0, k) => {
    const cx = (Math.floor(k / 3) - 1) * CELL, cy = ((k % 3) - 1) * CELL;
    const x0 = cx - M_SIZE / 2, y0 = cy - M_SIZE / 2;
    // no taller than keeps its top inside the card's 256 high window
    const cap = Math.min(M_HMAX, M_OY - 40 + (x0 + y0) / 2);
    const [ring, inner] = rings(x0, y0, x0 + M_SIZE, y0 + M_SIZE, 1.6, 1.2);
    return { cx, cy, h0, cap, ring, inner, sp: spring(h0, { eps: 0.04 }), drawn: NaN };
  }).sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
  for (const t of towers) {
    t.el = solid(g);
    t.floors = mk("path", { class: "lo nf" }, t.el.g);
    t.face = run(t.ring, front);
  }

  // a tower whose spring has not moved keeps its paths
  function draw(t) {
    const h = Math.max(1, t.sp.x);
    if (h === t.drawn) return;
    t.drawn = h;
    put(t.el, prism(P, front, t.ring, t.inner, 0, h));
    let d = "";
    for (let z = M_FLOOR; z < h - M_FLOOR / 3; z += M_FLOOR) d += open(ringAt(P, t.face, z));
    t.floors.setAttribute("d", d);
  }

  const B = register(stage, (dt) => {
    let moving = false;
    for (const t of towers) { if (stepS(t.sp, dt)) moving = true; draw(t); }
    return moving;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const t of towers) {
      t.sp.t = over
        ? clamp(Math.max(t.h0 * 0.45, t.cap * falloff(Math.hypot(t.cx - over[0], t.cy - over[1]) / M_REACH)), 8, t.cap)
        : t.h0;
    }
    // the bright edge goes to the tallest target, never to what is tallest mid-way
    const top = towers.reduce((a, b) => (b.sp.t > a.sp.t ? b : a));
    if (top !== lead) { lead?.el.sil.classList.remove("hi"); lead = top; lead.el.sil.classList.add("hi"); }
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => {
      const q = unproj(C, p[0], p[1], 0);
      over = Math.abs(q[0]) <= M_HALF && Math.abs(q[1]) <= M_HALF ? q : null;
      retarget();
    },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  return bag.dispose;
}

/* --- Mounting -------------------------------------------------- */
// each figure, and its unseen pointer's walk in the frame's units, ending
// with a leave so the lap returns to rest
const FIGURES = {
  strata: { draw: strata, tour: [[200, 149], [200, 212], [200, 170], null] },
  massing: { draw: massing, tour: [[294, 196], [106, 196], [200, 250], null] },
};

export function mountApproachFigure(stage) {
  const figure = FIGURES[stage?.dataset.approachFigure];
  const svg = stage?.querySelector("svg");
  if (!figure || !svg) return null;
  inject(document);
  const undraw = figure.draw({ stage, svg });

  let walk = null;
  const walkOn = () => { if (!walk) walk = tour(stage, figure.tour, null, { delay: 1500 }); };
  const walkOff = () => { walk?.stop(); walk = null; };

  return {
    start: walkOn,
    stop: walkOff,
    rest: walkOff,
    hold: (paused) => (paused ? walkOff() : walkOn()),
    destroy() {
      walkOff();
      undraw();
    },
  };
}
