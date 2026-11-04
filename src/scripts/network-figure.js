/* ============================================================
   The Technology Blueprint hero's figure (BlueprintHero.astro,
   blueprint-hero.js): GENERATED from source-assets/hairline/blueprint/
   network.js by gen-site.mjs there. Edit that file, then run it again.
   ------------------------------------------------------------
  Network: a practice's systems as five keys on the ground, each a rounded
  box on a plinth with a coin on its lid carrying a practice's mark, joined
  by routes that run on the ground's lines and turn on rounded corners. A
  signal runs along one route at a time into EPR's key, which takes it with
  a small lift. The key under the pointer rises on its plinth, its routes
  take the bright stroke and the signal runs on them. The slider is the lift.
  (After the reference of 2026-11-04, for the Technology Blueprint's hero.)
  
  Second pass (2026-11-04): each key a cell of the hero's lattice (a side
  of S, the lattice's module, set out from the figure's origin), centred in
  its cell, so its sides run on the lattice's lines and the routes along
  the lines through the cells' middles; the box a third lower; the signal
  one stroke; the two upright tags on the routes taken out.
  
  Third pass (2026-11-04): a little taller than wide. A sixth key, Ackroyd
  Lowrie's, stands two cells under SHH's, in the column SHH and Orms already
  share across the screen, so the drawing grows down and not out; its route
  runs up the hub's right-hand line, the one SHH's takes, into EPR's key.
  
  Fourth pass (2026-11-04): taller again, and stirred by the scroll. A
  seventh key, Architecture PLB's, stands two cells under Ackroyd Lowrie's
  in the same column, its route straight up into that key, so the drawing
  grows down the screen and no wider. And stir(amount) lifts every key a
  little, as the pointer lifts one, by an amount that decays on its own:
  the page calls it as it scrolls (blueprint-hero.js), each key following
  at its own pace, the upper ones first, so the lift runs down the network
  and settles once the scroll stops.

   A Hairline figure (the hairline-create skill, .claude/skills/) on the
   vendored kernel, after the reference's composition rather than every
   rule of the skill: the coins carry the practices' marks and the tags
   their words, as the reference's do, and the signal has a soft glow
   under its stroke. Colours: pages.css ("Technology Blueprint hero").
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, circ, facing, fit, open, poly, prism, proj, rings, ringAt, rrect, unproj,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer, reducedMotion,
} = HL;

const LOGOS = "/assets/logos/SVGs/";
// a key's side (world units, one a viewBox unit at the site's isometric),
// and its parts in sides: the plinth's margin, height and corner, the box's
// corner and lid, the lid's plate, the coin, the routes' bends, the signal
const S = 36, BASE_M = 0.07, BASE_H = 0.11, BASE_R = 0.17, BODY_R = 0.14, TOP = 0.35, LID = 0.1;
const COIN_R = 0.25, COIN_H = 0.075, BEND = 0.22, SPEED = 3.1, PULSE = 0.8, GAP = 650, KICK = 0.09, LIFT_MAX = 9;
// the scroll's stir: the most it lifts a key (a share of the pointer's
// lift), how fast it dies away once the scroll stops (per second), and how
// fast the keys follow it, the uppermost quickest, the lowest slowest
const STIR = 0.7, STIR_DECAY = 3.2, STIR_FAST = 9, STIR_SLOW = 4;
// each key's middle, in cells: every one the middle of a cell (a half), so
// its sides lie on the lattice's lines
const NODES = [
  { name: "Orms", logo: "Ormsss-Logo.svg", ar: 866 / 300, at: [-2.5, -1.5] },
  { name: "ADAM", logo: "ADAM-Logo.svg", ar: 1225 / 300, at: [0.5, -3.5] },
  { name: "DMWR", logo: "dmwr-architects-logo.svg", ar: 540 / 300, at: [-1.5, 2.5] },
  { name: "EPR", logo: "epr-architects-logo.svg", ar: 524 / 300, at: [2.5, -0.5] },
  { name: "SHH", logo: "SHH-logo.svg", ar: 234 / 300, at: [1.5, 2.5] },
  { name: "Ackroyd Lowrie", logo: "ackroyd-lowrie-logo.svg", ar: 300 / 300, at: [3.5, 4.5] },
  { name: "Architecture PLB", logo: "Architecture-PLB-Logo.svg", ar: 889 / 300, at: [3.5, 6.5] },
];
const HUB = 3;
// each route from a key to another through its turns, in cells, every turn
// on the middle line of a row or column of cells
const ROUTES = [
  { from: 0, to: 3, pts: [[-2.5, -1.5], [0.5, -1.5], [0.5, -0.5], [2.5, -0.5]] },
  { from: 4, to: 3, pts: [[1.5, 2.5], [3.5, 2.5], [3.5, -0.5], [2.5, -0.5]] },
  { from: 1, to: 3, pts: [[0.5, -3.5], [3.5, -3.5], [3.5, -0.5], [2.5, -0.5]] },
  { from: 2, to: 0, pts: [[-1.5, 2.5], [-1.5, 0.5], [-2.5, 0.5], [-2.5, -1.5]] },
  { from: 2, to: 3, pts: [[-1.5, 2.5], [-0.5, 2.5], [-0.5, 1.5], [2.5, 1.5], [2.5, -0.5]] },
  { from: 5, to: 3, pts: [[3.5, 4.5], [3.5, -0.5], [2.5, -0.5]] },
  { from: 6, to: 5, pts: [[3.5, 6.5], [3.5, 4.5]] },
];

/** A polyline (in sides) with its inner corners rounded by BEND: points in world units, and the length to each. */
function bendRoute(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const toward = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + ((q[0] - p[0]) / l) * BEND, p[1] + ((q[1] - p[1]) / l) * BEND]; };
    const p1 = toward(b, a), p2 = toward(b, c);
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, m = 1 - t;
      out.push([m * m * p1[0] + 2 * m * t * b[0] + t * t * p2[0], m * m * p1[1] + 2 * m * t * b[1] + t * t * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  const w = out.map(([x, y]) => [x * S, y * S]), len = [0];
  for (let i = 1; i < w.length; i++) len.push(len[i - 1] + Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1]));
  return { w, len, L: len[len.length - 1] };
}

/** The route's points between lengths a and b (world units), projected. */
function slice(P, r, a, b) {
  const at = (d) => {
    let i = 1;
    while (i < r.len.length - 1 && r.len[i] < d) i++;
    const t = (d - r.len[i - 1]) / (r.len[i] - r.len[i - 1] || 1), p = r.w[i - 1], q = r.w[i];
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  a = Math.max(0, a); b = Math.min(r.L, b);
  if (b <= a) return [];
  const pts = [at(a)];
  r.len.forEach((d, i) => { if (d > a && d < b) pts.push(r.w[i]); });
  pts.push(at(b));
  return pts.map(([x, y]) => P(x, y, 0));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  // a little closer in than the first passes (their sqrt(1.5)), so the
  // seventh key's extra height stays in the frame
  const C = Cam(45, Math.sqrt(1 / 3), 1.16);
  const ext = [];
  NODES.forEach(({ at }) => [-0.6, 0.6].forEach((dx) => [-0.6, 0.6].forEach((dy) => ext.push([(at[0] + dx) * S, (at[1] + dy) * S, (TOP + COIN_H) * S + LIFT_MAX]))));
  ROUTES.forEach(({ pts }) => pts.forEach(([x, y]) => ext.push([x * S, y * S, 0])));
  fit(C, ext, 200, 150);
  const P = proj(C), front = facing(C);
  const ground = mk("g", {}, svg), signal = mk("g", {}, svg), items = mk("g", {}, svg);

  // the routes, on the ground; the signal, one stroke, over them
  const routes = ROUTES.map((rt) => {
    const r = bendRoute(rt.pts);
    const el = mk("path", { d: open(r.w.map(([x, y]) => P(x, y, 0))), class: "nf route" }, ground);
    return { ...rt, r, el };
  });
  const pulse = mk("path", { class: "nf hi pulse" }, signal);

  // the keys, back to front
  const nodes = NODES.map((n, i) => ({ ...n, i, lift: tween(0), kick: tween(0), stir: 0, drawn: null }));
  // each key's pace in following the stir: by how far down the screen it stands
  const depth = nodes.map((n) => n.at[0] + n.at[1]);
  const [d0, d1] = [Math.min(...depth), Math.max(...depth)];
  nodes.forEach((n, i) => (n.pace = STIR_FAST + (STIR_SLOW - STIR_FAST) * ((depth[i] - d0) / (d1 - d0 || 1))));
  let energy = 0;
  // a lift of one unit up the world, on the screen (straight up)
  const rise = P(0, 0, 1)[1] - P(0, 0, 0)[1];
  nodes
    .slice()
    .sort((p, q) => p.at[0] + p.at[1] - (q.at[0] + q.at[1]))
    .forEach((n) => build(mk("g", {}, items), n));

  /** A key: its plinth (which stays), its box, lid and coin (which rise), and the practice's mark printed on the coin. */
  function build(g, n) {
    const [x, y] = n.at.map((v) => v * S), h = S / 2, m = BASE_M * S;
    const [bo, bi] = rings(x - h - m, y - h - m, x + h + m, y + h + m, BASE_R * S, 0.03 * S);
    put(solid(g), prism(P, front, bo, bi, 0, BASE_H * S));
    // the parts that rise, in a group of their own: the scroll's stir moves
    // the group (a lift is straight up the screen in this view), so the
    // stir never redraws their shapes
    const up = (n.up = mk("g", {}, g));
    n.box = solid(up); n.lid = mk("path", { class: "nf lo" }, up); n.trace = mk("path", { class: "nf lo" }, up);
    n.coin = solid(up); n.coin.g.setAttribute("class", "coin"); n.face = mk("path", { class: "coin-top" }, up); n.ring = mk("path", { class: "nf coin-ring" }, up);
    const lw = Math.min(1.16 * COIN_R, 0.86 * COIN_R * n.ar) * S, lh = lw / n.ar;
    n.mark = mk("image", { href: LOGOS + n.logo, x: -lw / 2, y: -lh / 2, width: lw, height: lh, preserveAspectRatio: "xMidYMid meet" }, up);
    n.rings = rings(x - h, y - h, x + h, y + h, BODY_R * S, 0.03 * S);
    n.plate = rrect(x - h + LID * S, y - h + LID * S, x + h - LID * S, y + h - LID * S, (BODY_R - LID * 0.6) * S, 6);
    n.disc = circ(COIN_R * S, 40).map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
    n.bevel = circ(COIN_R * 0.8 * S, 40).map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
    const e1 = P(Math.SQRT1_2, -Math.SQRT1_2, 0), e2 = P(Math.SQRT1_2, Math.SQRT1_2, 0), o = P(0, 0, 0);
    n.basis = [e1[0] - o[0], e1[1] - o[1], e2[0] - o[0], e2[1] - o[1]];
    if (n.i === HUB) n.ring.classList.add("hi");
  }

  /** Draws a key's moving parts at its lift (world units), if it changed. */
  function draw(n, dz) {
    if (n.drawn === dz) return;
    n.drawn = dz;
    const z0 = BASE_H * S + dz, z1 = TOP * S + dz, z2 = z1 + COIN_H * S, [x, y] = n.at.map((v) => v * S);
    put(n.box, prism(P, front, n.rings[0], n.rings[1], z0, z1));
    n.lid.setAttribute("d", poly(ringAt(P, n.plate, z1)));
    const tr = [[-0.5 + LID, 0.12], [-0.34, 0.12], [-0.26, 0.04], [-COIN_R, 0.04]].map(([u, v]) => P(x + u * S, y + v * S, z1));
    n.trace.setAttribute("d", open(tr));
    put(n.coin, prism(P, front, n.disc, null, z1, z2));
    n.face.setAttribute("d", poly(ringAt(P, n.disc, z2)));
    n.ring.setAttribute("d", poly(ringAt(P, n.bevel, z2)));
    const c = P(x, y, z2);
    n.mark.setAttribute("transform", `matrix(${n.basis.join(" ")} ${c[0]} ${c[1]})`);
  }
  nodes.forEach((n) => draw(n, 0));

  // the signal: one route at a time, from its first key to its last, which
  // takes it with a small lift; the routes of the key under the pointer, or all
  let act = -1, queue = 0, run = null, nextAt = performance.now() + 900;
  const mine = () => routes.filter((rt) => act < 0 || act === HUB || rt.from === act || rt.to === act);
  const B = register(stage, (dt, now) => {
    let moving = false;
    // (the kernel gives dt in seconds)
    const sec = Math.min(dt, 0.064);
    energy = energy < 0.002 ? 0 : energy * Math.exp(-STIR_DECAY * sec);
    nodes.forEach((n) => {
      if (tdone(n.kick, now) && n.kick.to > 0) tset(n.kick, 0, now, 0);
      const to = energy * STIR * lift;
      n.stir += (to - n.stir) * (1 - Math.exp(-n.pace * sec));
      if (Math.abs(n.stir - to) < 0.01) n.stir = to;
      draw(n, tval(n.lift, now) + tval(n.kick, now));
      const dy = Math.round(n.stir * rise * 100) / 100;
      if (dy !== n.shown) {
        n.shown = dy;
        n.up.setAttribute("transform", dy ? `translate(0 ${dy})` : "");
      }
      if (!tdone(n.lift, now) || !tdone(n.kick, now) || n.stir > 0) moving = true;
    });
    if (reducedMotion()) return moving;
    if (!run && now >= nextAt) {
      const list = mine();
      run = { rt: list[queue++ % list.length], t0: now };
    }
    if (run) {
      const d = ((now - run.t0) / 1000) * SPEED * S, r = run.rt.r;
      const pts = slice(P, r, d - PULSE * S, d);
      pulse.setAttribute("d", pts.length ? open(pts) : "");
      if (d - PULSE * S >= r.L) {
        tset(nodes[run.rt.to].kick, KICK * S, now, 0);
        run = null;
        nextAt = now + GAP;
      }
    }
    return true;
  });
  bag.add(B.unregister);

  /** The key under the point, tested against each key's resting lid. */
  function hit([sx, sy]) {
    let best = -1, bd = 0.62;
    nodes.forEach((n, i) => {
      const [wx, wy] = unproj(C, sx, sy, TOP * S), d = Math.hypot(wx / S - n.at[0], wy / S - n.at[1]);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function setActive(a) {
    if (a === act) return;
    const now = performance.now();
    act = a;
    queue = 0;
    nodes.forEach((n, i) => {
      tset(n.lift, i === a ? lift : 0, now, 0);
      n.ring.classList.toggle("hi", a < 0 ? i === HUB : i === a);
    });
    routes.forEach((rt) => {
      const on = a >= 0 && a !== HUB && (rt.from === a || rt.to === a);
      rt.el.classList.toggle("hi", on);
    });
    read.textContent = a < 0 ? "rest" : nodes[a].name;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  // origin and cell: where the hero's lattice is set out from, and its module
  /** The scroll's stir (0 to 1): every key lifts a little, and settles once it stops coming. */
  const stir = (a) => {
    if (reducedMotion() || !(a > energy)) return;
    energy = Math.min(1, a);
    B.wake();
  };
  return { set: (v) => { const a = act; lift = v; act = -2; setActive(a); }, stir, destroy: bag.dispose, origin: P(0, 0, 0), cell: S, axis: [P(1, 0, 0)[0] - P(0, 0, 0)[0], P(1, 0, 0)[1] - P(0, 0, 0)[1]] };
}

export const NETWORK = {
  name: "network",
  means: "Seven practices' systems as keys joined by routes: a signal runs to the hub, and the key you point at rises and lights its routes.",
  rules: [1, 5, 6, 9],
  range: [3, 6, 9],
  tour: [[118, 118], [270, 230], [196, 92], null],
  mount,
};
