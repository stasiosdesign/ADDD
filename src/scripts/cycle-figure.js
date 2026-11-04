/* ============================================================
   The Ongoing Advisory hero's figure (BeforeRevitHero.astro, figure
   "cycle"; before-revit-hero.js): GENERATED from source-assets/hairline/
   advisory/cycle.js by gen-site.mjs there. Edit that file, then run it
   again.
   ------------------------------------------------------------
  Cycle: ongoing advisory as a practice's technology seen as one system,
  and the regular session that goes round it. In the middle the practice,
  a low platform; round it four smaller platforms, the parts it keeps
  deciding about (the page names them), each linked to the middle and all
  on one loop on the ground: the cycle. Over the loop floats a thin frame,
  the session, a dashed plumb line dropping from it. The pointer sends the
  frame to the nearest part, which steps up under it. The slider is how
  high the frame floats. The page drives it instead (progress): the frame
  goes once round the loop as the page scrolls, each part stepping up as it
  is reached and staying up, the loop lit behind, and as it comes home the
  middle steps up too: sessions that compound. Made for the Ongoing
  Advisory hero (2026-11-04), in the Before Revit figure's family: its
  camera, platforms, frame, drops and lattice (origin, module, axis).

   A Hairline figure (the hairline-create skill, .claude/skills/) on the
   vendored kernel. On the page it carries the page's words in its planes
   and its red light (before-revit-hero.js; pages.css, "Before Revit
   hero"), which the skill's rules keep out of a bench figure.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, fit, open, poly, proj, facing, rings, ringAt, prism,
  spring, stepS, disposer, mk, solid, put, flatDot, place, pointer, register, unproj,
} = HL;

// the lattice's module; the ground; the middle and a part (side, height);
// the loop (half side: the parts sit mid-side; corner); the frame; a
// part's step once reached; the pointer's lift
const MOD = 20, G = 12 * MOD, HB = 3 * MOD, HT = 12, SB = 2 * MOD, ST = 8;
const L = 4 * MOD, LR = 0.8 * MOD, F = 1.4 * MOD, FT = 1.4, RISE = 6, HOVER = 5;
// the parts round the loop in its order: the back one, then clockwise
const PARTS = [[0, -L], [L, 0], [0, L], [-L, 0]];
const half = (s) => s / 2;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const ease = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

// the loop from the back part round, its corners rounded, with the length
// to each point
const LOOP = (() => {
  const arc = (cx, cy, a0) => Array.from({ length: 9 }, (_, k) => [cx + LR * Math.cos(a0 + (k / 8) * (Math.PI / 2)), cy + LR * Math.sin(a0 + (k / 8) * (Math.PI / 2))]);
  const pts = [[0, -L], ...arc(L - LR, -L + LR, -Math.PI / 2), [L, 0], ...arc(L - LR, L - LR, 0), [0, L], ...arc(-L + LR, L - LR, Math.PI / 2), [-L, 0], ...arc(-L + LR, -L + LR, Math.PI), [0, -L]];
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
})();
// the point at share s of the way round (wrapping)
function along(s) {
  const d = (((s % 1) + 1) % 1) * LOOP.total;
  let i = 1;
  while (i < LOOP.len.length - 1 && LOOP.len[i] < d) i++;
  const t = (d - LOOP.len[i - 1]) / (LOOP.len[i] - LOOP.len[i - 1] || 1), a = LOOP.pts[i - 1], b = LOOP.pts[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
// the loop's points from the start to share b
function stretch(b) {
  const db = clamp01(b) * LOOP.total;
  if (db < 0.01) return [];
  const pts = [LOOP.pts[0]];
  LOOP.len.forEach((d, i) => { if (d > 0 && d < db) pts.push(LOOP.pts[i]); });
  pts.push(along(Math.min(b, 0.9999)));
  return pts;
}

function mount({ stage, svg, read, labels }, value) {
  const bag = disposer();
  let float = value;
  const C = Cam(45, 0.56, 0.95);
  fit(C, [[-half(G), -half(G), 0], [half(G), half(G), 0], [half(G), -half(G), 0], [-half(G), half(G), 0], [0, -L, 72 + FT]], 200, 170);
  const P = proj(C), front = facing(C);
  const sq = (s, z) => [[-half(s), -half(s), z], [half(s), -half(s), z], [half(s), half(s), z], [-half(s), half(s), z]];

  // the ground: its square, lines running on from two corners and two dots;
  // the links from the middle to the parts; the loop; the stretch of it the
  // session has been round (the one bright stroke); the frame's plumb line
  const ground = mk("g", {}, svg);
  mk("path", { d: poly(sq(G, 0).map((p) => P(...p))), class: "nf lo" }, ground);
  mk("path", { d: open([P(-half(G), half(G), 0), P(-half(G) - 2 * MOD, half(G), 0)]), class: "nf lo" }, ground);
  mk("path", { d: open([P(half(G), -half(G), 0), P(half(G), -half(G) - 2 * MOD, 0)]), class: "nf lo" }, ground);
  [[-half(G), L, 0], [L, -half(G), 0]].forEach((p) => place(flatDot(ground, C, 1.5, "dot m"), P(...p)));
  PARTS.forEach(([x, y]) => {
    const ux = Math.sign(x), uy = Math.sign(y);
    mk("path", { d: open([P(ux * half(HB), uy * half(HB), 0), P(x - ux * half(SB), y - uy * half(SB), 0)]), class: "nf lo" }, ground);
  });
  mk("path", { d: poly(LOOP.pts.map(([x, y]) => P(x, y, 0))), class: "nf mid" }, ground);
  const trail = mk("path", { class: "nf hi" }, ground);
  const drop = mk("path", { class: "nf dash" }, ground);

  // the middle and the parts, back to front (the larger x + y, the nearer),
  // each a rounded solid, its top a plate with a dot on it
  const blocks = [{ hub: true, x: 0, y: 0 }, ...PARTS.map(([x, y], i) => ({ i, x, y }))].sort((a, b) => a.x + a.y - (b.x + b.y));
  const solids = mk("g", {}, svg);
  blocks.forEach((b) => {
    const s = b.hub ? HB : SB;
    b.s = solid(solids);
    b.s.g.setAttribute("class", b.hub ? "plinth is--hub" : "plinth");
    b.top = mk("path", { class: "nf top" }, solids);
    b.dot = flatDot(solids, C, b.hub ? 1.6 : 1.3, "dot");
    [b.ring, b.inner] = rings(b.x - half(s), b.y - half(s), b.x + half(s), b.y + half(s), b.hub ? 1.8 : 1.4, b.hub ? 1.2 : 1);
  });
  const hub = blocks.find((b) => b.hub);
  const parts = PARTS.map((_, i) => blocks.find((b) => b.i === i));

    const frame = solid(svg);
  [frame.sil, frame.cr].forEach((el) => el.classList.add("nf"));
  const ftop = mk("path", { class: "nf lo" }, svg);
  // the page's words, where it gives them: it may hand back what follows
  // the frame and the middle
  const follow = labels?.(ground, P, { PARTS, SB, ST, HB, HT, F, FT, G, MOD, RISE }) || null;

  function drawBlock(b, z) {
    if (b.drawn === z) return;
    b.drawn = z;
    const h = (b.hub ? HT : ST) + z;
    put(b.s, prism(P, front, b.ring, b.inner, 0, h));
    b.top.setAttribute("d", poly(ringAt(P, b.inner, h)));
    place(b.dot, P(b.x, b.y, h));
    if (b.hub) follow?.hub?.(h);
  }
  let shown = "";
  // the frame at share s of the way round and height z, the parts' and the
  // middle's steps, the loop lit to share lit
  function show(s, z, steps, hubStep, lit) {
    const key = [s, z, ...steps, hubStep, lit].map((v) => v.toFixed(3)).join();
    if (key === shown) return;
    shown = key;
    const [x, y] = along(s);
    const [fring, finner] = rings(x - half(F), y - half(F), x + half(F), y + half(F), 1.2, 0.9);
    put(frame, prism(P, front, fring, finner, z, z + FT));
    ftop.setAttribute("d", poly(ringAt(P, finner, z + FT)));
    drop.setAttribute("d", open([P(x, y, 0), P(x, y, z)]));
    follow?.frame?.(x, y, z + FT);
    parts.forEach((b, i) => drawBlock(b, Math.round(steps[i] * 100) / 100));
    drawBlock(hub, Math.round(hubStep * 100) / 100);
    const pts = stretch(lit);
    trail.setAttribute("d", pts.length ? open(pts.map(([px, py]) => P(px, py, 0))) : "");
  }

  // the bench's (and the page's at rest): the frame on a spring along the
  // loop, sent to the part nearest the pointer, which lifts under it
  const at = spring(0, { k: 60, c: 14 });
  const lifts = PARTS.map(() => spring(0));
  const height = spring(float);
  let near = -1;
  let forced = false;
  const loop = register(stage, (dt) => {
    if (forced) return false;
    let moving = stepS(at, dt);
    lifts.forEach((sp) => { if (stepS(sp, dt)) moving = true; });
    if (stepS(height, dt)) moving = true;
    show(at.x, height.x, lifts.map((sp) => sp.x), 0, 0);
    return moving;
  });
  bag.add(loop.unregister);

  function setNear(i) {
    if (i === near) return;
    near = i;
    lifts.forEach((sp, k) => (sp.t = k === i ? HOVER : 0));
    // the short way round to the part
    if (i >= 0) at.t += ((((i / 4 - at.t) % 1) + 1.5) % 1) - 0.5;
    parts.forEach((b, k) => b.s.sil.classList.toggle("hi", k === i));
    read.textContent = i < 0 ? "rest" : `part ${i + 1}`;
    loop.wake();
  }
  bag.add(pointer(stage, {
    move: ([sx, sy]) => {
      const [x, y] = unproj(C, sx, sy, 0);
      if (Math.abs(x) > half(G) || Math.abs(y) > half(G)) return setNear(-1);
      const dist = (k) => Math.hypot(PARTS[k][0] - x, PARTS[k][1] - y);
      setNear([0, 1, 2, 3].reduce((best, k) => (dist(k) < dist(best) ? k : best), 0));
    },
    leave: () => setNear(-1),
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  show(0, float, [0, 0, 0, 0], 0, 0);

  return {
    set: (v) => { float = v; height.t = v; loop.wake(); },
    // the page's: the session's way round at p (0 to 1, from the back part
    // round to it again), or null to give the pointer the frame again; each
    // part steps up as the frame reaches it (the back one as it comes
    // home), the middle in the last stretch, the loop lit behind the frame
    progress: (p) => {
      if (p === null) { forced = false; at.x = at.t = 0; loop.wake(); return; }
      forced = true;
      const steps = [0.97, 0.25, 0.5, 0.75].map((a) => RISE * ease((p - (a - 0.07)) / 0.1));
      show(p, float, steps, RISE * ease((p - 0.9) / 0.1), p);
    },
    destroy: bag.dispose,
    origin: P(0, 0, 0),
    cell: MOD,
    module: MOD,
    axis: [P(1, 0, 0)[0] - P(0, 0, 0)[0], P(1, 0, 0)[1] - P(0, 0, 0)[1]],
  };
}

export const CYCLE = {
  name: "cycle",
  means: "A practice's parts on one loop round it, and a session that goes round the loop, each part stepping up as it is reached.",
  rules: [1, 5, 6, 9],
  range: [52, 62, 72],
  tour: [[150, 110], [255, 170], [190, 230], null],
  mount,
};
