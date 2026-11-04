/* ============================================================
   The Before Revit hero's figure (BeforeRevitHero.astro,
   before-revit-hero.js): GENERATED from source-assets/hairline/
   beforerevit/press.js by gen-site.mjs there. Edit that file, then run it
   again.
   ------------------------------------------------------------
  Press: the early stages of a project as a broad, low platform on a wider
  ground, with the model held over it, exploded: a thin square frame
  floating above the platform, dashed lines dropping from its corners to
  the dashed square it will land on. The pointer over the drawing lifts the
  frame a little further and lights it; leaving lets it settle back. The
  slider is how high the frame floats. (After the reference of 2026-11-04
  for the Before Revit hero, whose page lands the frame on the platform as
  it scrolls: lift() and pulse are the page's, not the bench's.)
  
  The pattern: one moving part, a spring on its height (where), a pick on
  the ground plane (which never moves), and the platform's own construction
  (its ground, its guides, its footprint) as the composed rest.
  
  Second pass (2026-11-04): the drawing stands on the page's lattice (the
  Technology Blueprint's dash-dot ground, in the hero's red), a cell CELL
  on a side: the ground square six cells, the platform four, the ground's
  lines running on along the lattice's own lines a whole number of cells.
  mount returns where the lattice is set out from (origin), its cell, and
  the screen's step for one unit along the ground (axis), for the page.

   A Hairline figure (the hairline-create skill, .claude/skills/) on the
   vendored kernel. On the page it carries the reference's words in its
   planes and its red light (before-revit-hero.js; pages.css, "Before
   Revit hero"), which the skill's rules keep out of a bench figure.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, fit, open, poly, proj, facing, rings, ringAt, prism,
  spring, stepS, disposer, mk, solid, put, flatDot, place, pointer, register, unproj,
} = HL;

// the platform (a side, its height, its corners), the ground round it, the
// frame (a side, its thickness), and how much the pointer lifts it
const B = 100, T = 13, BR = 1.6, G = 150, F = 78, FT = 1.6, HOVER = 9, CELL = 25;
const half = (s) => s / 2;

function mount({ stage, svg, read, labels }, value) {
  const bag = disposer();
  let float = value;
  const C = Cam(45, 0.56, 1.32);
  fit(C, [[-half(G), -half(G), 0], [half(G), half(G), 0], [half(G), -half(G), 0], [-half(G), half(G), 0], [0, 0, T + 96 + HOVER + FT]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the ground: a wider square, its lines running on from two corners, and
  // two dots where they cross the platform's own lines
  const sq = (s, z) => [[-half(s), -half(s), z], [half(s), -half(s), z], [half(s), half(s), z], [-half(s), half(s), z]];
  mk("path", { d: poly(sq(G, 0).map((p) => P(...p))), class: "nf lo" }, g);
  mk("path", { d: open([P(-half(G), half(G), 0), P(-half(G) - 2 * CELL, half(G), 0)]), class: "nf lo" }, g);
  mk("path", { d: open([P(half(G), -half(G), 0), P(half(G), -half(G) - 2 * CELL, 0)]), class: "nf lo" }, g);
  mk("path", { d: open([P(half(B), half(G), 0), P(half(B), half(G) + CELL, 0)]), class: "nf lo" }, g);
  [[-half(G), half(B), 0], [half(G), -half(B) + CELL, 0]].forEach((p) => place(flatDot(g, C, 1.6, "dot m"), P(...p)));

  // the platform: a broad low solid, its top a plate, and on it the
  // footprint the frame will land on and the line of an early sketch
  const [ring, inner] = rings(-half(B), -half(B), half(B), half(B), BR, 1.2);
  const base = solid(g);
  base.g.setAttribute("class", "plinth");
  put(base, prism(P, front, ring, inner, 0, T));
  mk("path", { d: poly(ringAt(P, ring, T)), class: "nf top" }, g);
  mk("path", { d: poly(sq(F, T).map((p) => P(...p))), class: "nf dash" }, g);
  const sketch = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, x = -half(F) + 8 + t * (F - 16);
    sketch.push(P(x, 10 * Math.sin(t * Math.PI * 1.6) - 4 + 14 * t, T));
  }
  mk("path", { d: open(sketch), class: "nf lo" }, g);
  const corners = sq(F, T).map((p) => {
    const d = flatDot(g, C, 1.3, "dot off");
    place(d, P(...p));
    return d;
  });

  // the drops from the frame's corners to the footprint, and the frame: a
  // thin square plate, held over the platform
  const drops = mk("path", { class: "nf dash" }, g);
  const [fring, finner] = rings(-half(F), -half(F), half(F), half(F), 1.2, 0.9);
  const frame = solid(g);
  frame.sil.classList.add("nf");
  frame.cr.classList.add("nf");
  const ftop = mk("path", { class: "nf lo" }, g);
  // the page's words and marks, where it gives them (the bench has none):
  // it may hand back what follows the frame, given the frame's height
  const follow = labels?.(g, P, { B, T, G, F, FT }) || null;

  const h = spring(float);
  let forced = null;
  let drawn = null;
  let over = false;
  function draw(z) {
    if (drawn === z) return;
    drawn = z;
    put(frame, prism(P, front, fring, finner, z, z + FT));
    ftop.setAttribute("d", poly(ringAt(P, finner, z + FT)));
    follow?.(z);
    const far = z - T > 1.5;
    drops.setAttribute("d", far ? sq(F, 0).map(([x, y]) => open([P(x, y, T), P(x, y, z)])).join("") : "");
    paintCorners();
  }
  // at rest the footprint's corners are the bright mark, where the frame
  // will land; the pointer hands the bright to the frame; landed, they dim
  function paintCorners() {
    const far = drawn - T > 1.5;
    corners.forEach((d) => d.setAttribute("class", !far ? "dot m" : over ? "dot off" : "dot"));
  }
  const L = register(stage, (dt) => {
    if (forced !== null) {
      draw(forced);
      return false;
    }
    const moving = stepS(h, dt);
    draw(T + h.x);
    return moving;
  });
  bag.add(L.unregister);

  // the pick: the pointer on the ground, over the wider square, never what moves
  function setOver(on) {
    if (on === over) return;
    over = on;
    h.t = float + (on ? HOVER : 0);
    frame.sil.classList.toggle("hi", on);
    paintCorners();
    read.textContent = on ? "frame" : "rest";
    L.wake();
  }
  bag.add(pointer(stage, {
    move: ([sx, sy]) => {
      const [x, y] = unproj(C, sx, sy, 0);
      setOver(Math.abs(x) < half(G) && Math.abs(y) < half(G));
    },
    leave: () => setOver(false),
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return {
    set: (v) => {
      float = v;
      h.t = float + (over ? HOVER : 0);
      L.wake();
    },
    // the page's: the frame's height over the platform held at z (null to
    // let the spring have it again), and the platform's own height (T)
    lift: (z) => {
      forced = z === null ? null : T + z;
      if (forced === null) h.x = h.t = float;
      L.wake();
    },
    destroy: bag.dispose,
    // the lattice the page sets out under it: from the platform's middle on
    // the ground, a cell CELL, one unit along the ground's x this far on
    // the screen (in the drawing's units)
    origin: P(0, 0, 0),
    cell: CELL,
    axis: [P(1, 0, 0)[0] - P(0, 0, 0)[0], P(1, 0, 0)[1] - P(0, 0, 0)[1]],
  };
}

export const PRESS = {
  name: "press",
  means: "The early stages as a low platform, and the model held over it as a frame that will land on the square marked for it.",
  rules: [1, 5, 6, 9],
  range: [56, 76, 96],
  tour: [[200, 120], [150, 210], null],
  mount,
};
