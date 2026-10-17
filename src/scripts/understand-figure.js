/* ============================================================
   The Understand figure — the first step's drawing in the homepage's
   approach stack (ApproachStack.astro): Hairline's "settle", brought
   in from the package (@lucasmarkes/hairline 0.5.1, src/figures/
   settle.ts, MIT, Lucas Marques) and drawn on its kernel
   (vendor/hairline-kernel.js), so it can carry the ADDD mark
   ------------------------------------------------------------
   Twelve tiles lie crooked round a hub; as the pointer nears it they
   slide into a tree and the links draw in. The hub is the ADDD logo: a
   thin disc in solid red, its four white triangles on its top as the
   logo has them, the one red mark (the card's
   --hairline-hi, approach-stack.css). Changed from the package's: the
   round hub and its mark, and tighter corners on the tiles (the site's
   figures keep their rounding small).

   While the card is on screen an unseen pointer walks settle's own
   lap (the kernel's tour), and a real one takes over from it; the
   kernel's one frame loop sleeps off screen and under reduced motion.
   Its frame is Hairline's 400 × 320; the card shows the middle
   400 × 256 of it. The card's start/hold/stop/rest/destroy, as
   mountApproachFigure's.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, clamp, circ, facing, fit, hull, lerp, open, poly, proj, rad, ringAt, rrect, run, seg, unproj,
  spring, stepS, tween, tset, tval, tdone, reducedMotion,
  mk, pointer, put, register, disposer, solid, inject, tour,
} = HL;

// settle's own measures: tile thickness, half size and corner, the hub's
// radius and height, the ring the setting-out reaches
const TH = 3.2, HALF = 9, TILE_R = 1.6, HUB = 19, HUBT = 3.2, GR = 86;
// each tile: seated x, y, parent (−1 the hub), crooked x, y, angle, height
const T = [
  [50, 0, -1, 51, -19, 14, 0],
  [88, 0, 0, 93, 23, -22, 0],
  [50, 34, 0, 58, 50, 26, 0],
  [0, 50, -1, -21, 59, -16, 0],
  [0, 88, 3, 20, 84, 28, 0],
  [-34, 50, 3, -59, 64, -20, 0],
  [-50, 0, -1, -67, -20, -12, 0],
  [-88, 0, 6, -91, 26, 20, 0],
  [-50, -34, 6, -47, -57, -28, 0],
  [0, -50, -1, 22, -46, 18, 0],
  [0, -88, 9, -15, -95, -14, 0],
  [34, -50, 9, 62, -60, 22, 0],
];
// how far the pointer draws the tree together (settle's intensity 0.8)
const REACH = 138;
// settle's lap, in the frame's units, ending with a leave
const TOUR = [[360, 40], [320, 120], [203, 155], null];
// The logo (public/assets/logo.svg): its disc's centre and radius, and its
// four triangles, in its own 100-unit box.
const LOGO = { cx: 51, cy: 50.3, r: 40.2 };
const MARKS = [
  [[18.4, 58.7], [34.7, 58.7], [26.5, 42.7]],
  [[34.7, 42.7], [49.7, 50.7], [34.7, 58.7]],
  [[50.7, 42.7], [66.4, 50.7], [50.7, 58.7]],
  [[66.8, 42.7], [82.4, 50.7], [66.8, 58.7]],
];
// One tile carries a tool's mark, flat on its top: Rhino's
// (public/assets/logos/software/rhino.svg, a 1200-unit box), on the first
// tile, the one just past the hub on the right. The others stay blank.
const BADGE = { tile: 0, src: "/assets/logos/software/rhino.svg", box: 1200, size: 13 };

/** A solid from two rings: its silhouette with its top's front edge, and its top's inner ring (settle's slab). */
function slab(P, front, ring, inner, z0, z1) {
  return {
    sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))) + open(ringAt(P, run(ring, front), z1)),
    crease: inner ? poly(ringAt(P, inner, z1)) : "",
  };
}
/** A rounded square of half side h and corner r, turned by a degrees about (cx, cy). */
function turned(cx, cy, h, r, a) {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return rrect(-h, -h, h, h, r, 8).map((q) => ({
    u: cx + q.u * c - q.v * s, v: cy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c,
  }));
}

function draw({ stage, svg }) {
  const bag = disposer();
  let q = 0;
  const C = Cam(45, 0.5, 1.9);
  const pts = [[0, 0, HUBT], [GR, 0, 0], [-GR, 0, 0], [0, GR, 0], [0, -GR, 0]];
  for (const t of T) for (const [x, y] of [[t[0], t[1]], [t[3], t[4]]]) pts.push([x - 11, y - 11, 0], [x + 11, y + 11, 0], [x + 11, y - 11, 0], [x - 11, y + 11, 0]);
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const links = T.map((t, i) => {
    const a = t[2] < 0 ? [0, 0] : [T[t[2]][0], T[t[2]][1]], b = [t[0], t[1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const ha = t[2] < 0 ? HUB : HALF;
    return {
      i, p: t[2], tw: tween(0), el: mk("path", { class: "nf" }, g), drawn: NaN,
      from: [a[0] + u[0] * (ha + 2), a[1] + u[1] * (ha + 2)], to: [b[0] - u[0] * (HALF + 2), b[1] - u[1] * (HALF + 2)],
    };
  });

  // The hub: the logo itself, a thin disc as thick as a tile, solid red
  // (.logo, approach-stack.css) with its top's edge drawn in, and its
  // triangles on its top,
  // read along the screen's level (the logo's x down the ground's x − y).
  const hub = mk("g", { class: "logo" }, g);
  const hs = solid(hub);
  put(hs, slab(P, front, circ(HUB, 64), null, 0, HUBT));
  hs.sil.classList.add("hi");
  mk("path", { d: poly(ringAt(P, circ(HUB, 64), HUBT)), class: "rim" }, hub);
  const k = (HUB - 3) / LOGO.r;
  const onTop = ([lx, ly]) => {
    const u = (lx - LOGO.cx) * k, v = (ly - LOGO.cy) * k;
    return P((u + v) / Math.SQRT2, (v - u) / Math.SQRT2, HUBT);
  };
  mk("path", { d: MARKS.map((m) => poly(m.map(onTop))).join(""), class: "mark" }, hub);

  const tiles = T.map((t, i) => ({
    i, t, el: solid(mk("g", {}, g)), key: "", k: 0,
    // the inner tiles seat first and a little more briskly; the outer ones follow, out of step
    th: [0.05, 0.3, 0.4][i % 3],
    sp: spring(0, { k: i % 3 === 0 ? 120 : 90 - (i % 3) * 8, c: i % 3 === 0 ? 14 : 12, eps: 2e-3 }),
    // arrival and return keep their own springs: the return is softer, near-critical, no bounce
    rise: { k: i % 3 === 0 ? 120 : 90 - (i % 3) * 8, c: i % 3 === 0 ? 14 : 12 },
    fall: { k: [38, 44, 50][i % 3], c: 2 * Math.sqrt([38, 44, 50][i % 3]) },
    // outermost let go first: the leaves, then the middles, then the stems
    lag: [0.3, 0.2, 0.12][i % 3] * 1e3,
    want: 0, wait: 0, falling: false,
  }));
  function pose(tl) {
    const s = tl.sp.x, [sx, sy, , x0, y0, a0, z0] = tl.t;
    const w = clamp(s, 0, 1), hop = 6.5 * w * (1 - w);
    return { x: lerp(x0, sx, s), y: lerp(y0, sy, s), a: lerp(a0, 0, s), z: Math.max(0, lerp(z0, 0, w) + hop) };
  }
  function drawTile(tl) {
    const p = pose(tl), key = [p.x, p.y, p.a, p.z].map((v) => v.toFixed(2)).join();
    tl.k = p.x + p.y + 6 * p.z;
    if (key === tl.key) return;
    tl.key = key;
    put(tl.el, slab(P, front, turned(p.x, p.y, HALF, TILE_R, p.a), turned(p.x, p.y, HALF - 1, Math.max(0.3, TILE_R - 1), p.a), p.z, p.z + TH));
    if (tl.badge) tl.badge.setAttribute("transform", onTile(p));
  }
  // The mark laid on a tile's top as it stands: the logo's box mapped
  // onto the ground (read along the screen's level, as the hub's is),
  // turned with the tile, then projected, which is affine, so one matrix.
  function onTile(p) {
    const c = Math.cos(rad(p.a)), s = Math.sin(rad(p.a)), z = p.z + TH;
    const at = (lx, ly) => {
      const u = (lx / BADGE.box - 0.5) * BADGE.size, v = (ly / BADGE.box - 0.5) * BADGE.size;
      const x = (u + v) / Math.SQRT2, y = (v - u) / Math.SQRT2;
      return P(p.x + x * c - y * s, p.y + x * s + y * c, z);
    };
    const o = at(0, 0), ex = at(BADGE.box, 0), ey = at(0, BADGE.box), n = BADGE.box;
    return `matrix(${[(ex[0] - o[0]) / n, (ex[1] - o[1]) / n, (ey[0] - o[0]) / n, (ey[1] - o[1]) / n, o[0], o[1]].map((v) => v.toFixed(4)).join(" ")})`;
  }
  const badged = tiles[BADGE.tile];
  badged.badge = mk("image", { href: BADGE.src, width: BADGE.box, height: BADGE.box }, badged.el.g);
  // back to front: the tiles by depth, the hub among them where it stands
  let order = "";
  function paintOrder() {
    const list = tiles.slice().sort((a, b) => a.k - b.k);
    const at = list.findIndex((t) => t.k > 0);
    const seq = at < 0 ? list.map((t) => t.el.g).concat(hub) : list.slice(0, at).map((t) => t.el.g).concat(hub, list.slice(at).map((t) => t.el.g));
    const id = seq.map((e) => (e === hub ? "h" : tiles.findIndex((t) => t.el.g === e))).join();
    if (id === order) return;
    order = id;
    for (const e of seq) g.appendChild(e);
  }
  function drawLink(l, now) {
    const A = l.p < 0 ? null : tiles[l.p], B = tiles[l.i];
    const want = Math.min(A ? A.sp.x : 1, B.sp.x) > 0.96 && B.want >= 1 && (!A || A.want >= 1) ? 1 : 0;
    if (l.tw.to !== want) { tset(l.tw, want, now, 0); l.tw.dur = want ? 700 : 900; }
    const u = tval(l.tw, now);
    if (u === l.drawn) return;
    l.drawn = u;
    const pa = P(l.from[0], l.from[1], 0), pb = P(l.to[0], l.to[1], 0), n = Math.max(2, Math.round(Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 9));
    let d = "";
    for (let j = 0; j < n; j++) {
      const f0 = (j + 0.1) / n, f1 = Math.min((j + 0.6) / n, u);
      if (f1 > f0) d += seg([lerp(pa[0], pb[0], f0), lerp(pa[1], pb[1], f0)], [lerp(pa[0], pb[0], f1), lerp(pa[1], pb[1], f1)]);
    }
    l.el.setAttribute("d", d);
  }

  const B = register(stage, (dt, now) => {
    let m = false;
    for (const tl of tiles) {
      if (tl.wait > 0) { tl.wait -= dt * 1e3; m = true; if (tl.wait <= 0) tl.sp.t = tl.want; }
      if (stepS(tl.sp, dt)) m = true;
      drawTile(tl);
    }
    for (const l of links) { drawLink(l, now); if (!tdone(l.tw, now)) m = true; }
    paintOrder();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const tl of tiles) {
      const s = clamp((q - tl.th) / 0.22, 0, 1);
      if (s > tl.want) {
        tl.falling = false; tl.wait = 0; tl.want = s;
        Object.assign(tl.sp, tl.rise);
        tl.sp.t = s;
      } else if (s < tl.want) {
        if (!tl.falling) { tl.falling = true; tl.wait = reducedMotion() ? 0 : tl.lag; Object.assign(tl.sp, tl.fall); }
        tl.want = s;
        if (tl.wait <= 0) tl.sp.t = s;
      }
    }
    B.wake();
  }
  // how far the tree has drawn together, from the pointer's distance to the hub
  const resolve = (d) => { const u = clamp((REACH - d) / (REACH - 18), 0, 1); return u * u * (3 - 2 * u); };

  bag.add(pointer(stage, {
    move: (p) => { const [x, y] = unproj(C, p[0], p[1], 0); q = resolve(Math.hypot(x, y)); retarget(); },
    leave: () => { q = 0; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  for (const tl of tiles) drawTile(tl);
  paintOrder();
  return bag.dispose;
}

export function mountUnderstandFigure(stage) {
  const svg = stage?.querySelector("svg");
  if (!svg) return null;
  inject(document);
  const undraw = draw({ stage, svg });

  let walk = null;
  const walkOn = () => { if (!walk) walk = tour(stage, TOUR); };
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
