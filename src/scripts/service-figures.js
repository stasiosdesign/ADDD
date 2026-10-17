/* ============================================================
   The service figures — the four services' drawings, Hairline figures
   on Hairline's kernel (vendor/hairline-kernel.js), as the approach
   cards' are (approach-figures.js), each grown from the drawing it
   replaces (ServiceDiagram.astro) and from what the service is:

     0  Workflow Workshop     "Friction": a live project's floor, the work
                              looping round four stations, and the written
                              report held over it. The pointer picks a
                              station: it lifts in red and a line rises to
                              its mark on the report. At rest the front
                              one, where the work sticks.
     1  Before Revit          "Register": the early stages as three loose,
                              crooked sheets with the model over them. As
                              the pointer nears, the sheets come into
                              register and the model rises out of them.
                              At rest the sheet furthest out, what is lost
                              on the way, is red.
     2  Technology Blueprint  "Roadmap": four systems on the practice's
                              slab and the blueprint held over them. The
                              pointer picks a system: the roadmap is drawn
                              to its milestone a step at a time, and it
                              lights.
     3  Ongoing Advisory      "Calendar": the practice's floors, ringed by
                              twelve monthly sessions. The pointer's way
                              round picks a month: its session rises in
                              red, its neighbours a little, out from it.

   All four on the site's true isometric (src/scripts/iso.js), one world
   unit a frame unit, so the panel's 30° lattice (dot-field.js, a cell of
   54) is their ground, and each is set out on it: floors two cells
   square on its lines, parts one to a cell. Their frame is the old
   diagrams' 400 × 256 (fh); the kernel measures a pointer over a
   400 × 320 stage, so a real pointer is scaled to it, and the unseen
   pointer's stops are already in the frame's units. Built and checked
   with the hairline-create skill (.claude/skills/; working copies in
   source-assets/hairline/), whose rules they keep.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, circ, clamp, facing, fit, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, unproj,
  spring, stepS, tween, tset, tval, tdone,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

// the panel's lattice cell, and half of it
const CELL = 54, H = CELL / 2;

// the site's isometric, its ground's origin at (200, oy) of the frame
function camera(oy) {
  const C = Cam(45, Math.sqrt(1 / 3), Math.sqrt(1.5));
  fit(C, [[0, 0, 0]], 200, oy);
  return C;
}
// the dashed cross of setting-out on the ground, a dot at each end
function settingOut(g, C, P, reach) {
  mk("path", { d: seg(P(-reach, 0, 0), P(reach, 0, 0)) + seg(P(0, -reach, 0), P(0, reach, 0)), class: "nf dash lo" }, g);
  [[-reach, 0], [reach, 0], [0, -reach], [0, reach]].forEach(([x, y]) => place(flatDot(g, C, 1.1, "dot m"), P(x, y, 0)));
}
// a floor sunk into the ground, its top at the ground's level and left
// open, so the lattice runs across it
function sunk(g, P, front, half, depth) {
  const [ring] = rings(-half, -half, half, half, 3, 2);
  const side = run(ring, front);
  mk("path", { d: poly(ringAt(P, side, 0).concat(ringAt(P, side, -depth).reverse())), class: "fo" }, g);
  const el = solid(g);
  el.sil.classList.add("nf");
  put(el, prism(P, front, ring, null, -depth, 0));
}
// level lines across a solid's front every step up, none at its top
function storeys(P, face, z0, h, step) {
  let d = "";
  for (let z = z0 + step; z < z0 + h - step / 3; z += step) d += open(ringAt(P, face, z));
  return d;
}
// a rounded square of half side h, turned by a degrees, about (cx, cy)
function turned(cx, cy, h, r, a) {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return rrect(-h, -h, h, h, r, 6).map((q) => ({
    u: cx + q.u * c - q.v * s, v: cy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c,
  }));
}
// the pointer, a real one scaled from the kernel's 400 × 320 to the frame
function listen(stage, fh, on) {
  return pointer(stage, {
    move: (p, e) => on.move(e instanceof Event ? [p[0], (p[1] * fh) / 320] : p),
    leave: () => on.leave(),
  });
}
// the quarter of a two-by-two floor a ground point is over, or null
function quarter(q) {
  if (Math.abs(q[0]) > CELL || Math.abs(q[1]) > CELL) return null;
  return [q[0] < 0 ? -H : H, q[1] < 0 ? -H : H];
}

/* --- 0 Friction ------------------------------------------------- */
// the four stations, back to front; the front one is where the work sticks
const W_ST = [
  { x: -H, y: -H, h: 16, name: "brief" },
  { x: H, y: -H, h: 12, name: "design" },
  { x: -H, y: H, h: 20, name: "docs" },
  { x: H, y: H, h: 14, name: "site" },
];
const W_STUCK = 3, W_SIZE = 9, W_SHEET = 36, W_Z = 92, W_T = 2.5;

function friction({ stage, svg, read }, lift, { oy, fh }) {
  const bag = disposer();
  const C = camera(oy), P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  let pick = W_STUCK;

  settingOut(g, C, P, 2 * CELL);
  sunk(g, P, front, CELL, 5);
  // the way the work goes round, on the floor, station to station
  mk("path", { d: poly(W_ST.slice().sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x)).map((s) => P(s.x, s.y, 0))), class: "nf dash" }, g);

  const sts = W_ST.map((s, i) => {
    const grp = mk("g", {}, g);
    const [ring, inner] = rings(s.x - W_SIZE, s.y - W_SIZE, s.x + W_SIZE, s.y + W_SIZE, 1.5, 1);
    // each its own rise to the report, so the stations nearer cover it
    return { ...s, i, ring, inner, el: solid(grp), rise: mk("path", { class: "nf dash hi" }, grp), tw: tween(i === W_STUCK ? lift : 0), drawn: NaN };
  });
  // the report, held over the floor: a sheet, its lines of writing, and a
  // mark for each station, over it
  const [sr, si] = rings(-W_SHEET, -W_SHEET, W_SHEET, W_SHEET, 2, 1.2);
  put(solid(g), prism(P, front, sr, si, W_Z, W_Z + W_T));
  const top = W_Z + W_T;
  mk("path", { d: [[-24, 24], [-12, 24], [0, 6]].map(([y, x1]) => seg(P(-24, y, top), P(x1, y, top))).join(""), class: "nf lo" }, g);
  const marks = sts.map((s) => mk("path", { d: poly(ringAt(P, rrect(s.x - 5, s.y - 5, s.x + 5, s.y + 5, 1.2), top)), class: "nf lo" }, g));

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const s of sts) {
      const h = s.h + tval(s.tw, now);
      if (!tdone(s.tw, now)) moving = true;
      if (h === s.drawn) continue;
      s.drawn = h;
      put(s.el, prism(P, front, s.ring, s.inner, 0, h));
      s.rise.setAttribute("d", s.i === pick ? seg(P(s.x, s.y, h), P(s.x, s.y, W_Z)) : "");
    }
    return moving;
  });
  bag.add(B.unregister);

  function choose(at) {
    const now = performance.now();
    pick = at ?? W_STUCK;
    for (const s of sts) {
      tset(s.tw, s.i === pick ? lift : 0, now, 0);
      s.el.sil.classList.toggle("hi", s.i === pick);
      marks[s.i].setAttribute("class", s.i === pick ? "nf hi" : "nf lo");
      s.drawn = NaN;
    }
    read.textContent = at == null ? "rest" : sts[at].name;
    B.wake();
  }
  choose(null);

  bag.add(listen(stage, fh, {
    move: (p) => {
      const c = quarter(unproj(C, p[0], p[1], 0));
      choose(c ? sts.findIndex((s) => s.x === c[0] && s.y === c[1]) : null);
    },
    leave: () => choose(null),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { lift = v; choose(read.textContent === "rest" ? null : pick); }, destroy: bag.dispose };
}

/* --- 1 Register ------------------------------------------------- */
// the sheets, bottom first: how far each lies off true, its height loose
// and in register, and how soon it comes in
const R_SHEETS = [
  { dx: -9, dy: 7, a: -7, z: 0, zr: 0, th: 0.05 },
  { dx: 11, dy: -6, a: 10, z: 12, zr: 5, th: 0.2 },
  { dx: -4, dy: -10, a: -4, z: 24, zr: 10, th: 0.35 },
];
const R_LOST = 1, R_T = 2;

function register3({ stage, svg, read }, reach, { oy, fh }) {
  const bag = disposer();
  const C = camera(oy), P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  let q = 0;

  settingOut(g, C, P, 2 * CELL);
  const sheets = R_SHEETS.map((s) => ({ ...s, el: solid(g), sp: spring(0, { eps: 2e-3 }), key: "" }));
  // the model: a block one cell square, its storeys on its front
  const model = { el: solid(g), sp: spring(0, { eps: 2e-3 }), key: "" };
  model.floors = mk("path", { class: "lo nf" }, model.el.g);
  const [mr, mi] = rings(-H, -H, H, H, 2, 1.4);
  const mFace = run(mr, front);

  function drawAll() {
    for (const s of sheets) {
      const k = clamp(s.sp.x, 0, 1), key = k.toFixed(4);
      if (key === s.key) continue;
      s.key = key;
      const x = lerp(s.dx, 0, k), y = lerp(s.dy, 0, k), a = lerp(s.a, 0, k), z = lerp(s.z, s.zr, k);
      put(s.el, prism(P, front, turned(x, y, CELL, 2.5, a), turned(x, y, CELL - 1.4, 1.1, a), z, z + R_T));
    }
    const k = clamp(model.sp.x, 0, 1), key = k.toFixed(4) + sheets[2].key;
    if (key === model.key) return;
    model.key = key;
    const s = sheets[2], base = lerp(s.z, s.zr, clamp(s.sp.x, 0, 1)) + R_T + lerp(14, 4, k), h = lerp(8, 44, k);
    put(model.el, prism(P, front, mr, mi, base, base + h));
    model.floors.setAttribute("d", storeys(P, mFace, base, h, 11));
  }
  const B = register(stage, (dt) => {
    let moving = false;
    for (const s of sheets) if (stepS(s.sp, dt)) moving = true;
    if (stepS(model.sp, dt)) moving = true;
    drawAll();
    return moving;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const s of sheets) s.sp.t = clamp((q - s.th) / 0.45, 0, 1);
    model.sp.t = clamp((q - 0.4) / 0.5, 0, 1);
    // the bright edge by the targets: the lost sheet until the model is mostly up
    const built = model.sp.t >= 0.6;
    sheets.forEach((s, i) => s.el.sil.classList.toggle("hi", !built && i === R_LOST));
    model.el.sil.classList.toggle("hi", built);
    read.textContent = q <= 0 ? "rest" : `fit ${sheets.filter((s) => s.sp.t > 0.5).length}·3`;
    B.wake();
  }
  retarget();
  drawAll();

  // how far into register, from the pointer's distance to the middle
  const resolve = (d) => { const u = clamp((reach - d) / (reach - 20), 0, 1); return u * u * (3 - 2 * u); };
  bag.add(listen(stage, fh, {
    move: (p) => { const [x, y] = unproj(C, p[0], p[1], 0); q = resolve(Math.hypot(x, y)); retarget(); },
    leave: () => { q = 0; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

/* --- 2 Roadmap -------------------------------------------------- */
// the four systems, back to front, and the order the roadmap takes them
const B_SYS = [
  { x: -H, y: -H, h: 22 },
  { x: H, y: -H, h: 18 },
  { x: -H, y: H, h: 14 },
  { x: H, y: H, h: 10 },
];
const B_ROUTE = [2, 3, 1, 0];
const B_REST = 1, B_SIZE = 11, B_SHEET = 48, B_Z = 112, B_T = 3;

function roadmap({ stage, svg, read }, step, { oy, fh }) {
  const bag = disposer();
  const C = camera(oy), P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  let at = B_REST;

  settingOut(g, C, P, 2 * CELL);
  sunk(g, P, front, CELL, 5);
  const sys = B_SYS.map((s) => {
    const grp = mk("g", {}, g);
    const [ring, inner] = rings(s.x - B_SIZE, s.y - B_SIZE, s.x + B_SIZE, s.y + B_SIZE, 1.6, 1.1);
    const el = solid(grp);
    put(el, prism(P, front, ring, inner, 0, s.h));
    mk("path", { d: storeys(P, run(ring, front), 0, s.h, 7), class: "lo nf" }, grp);
    // each mapped up into the plan
    mk("path", { d: seg(P(s.x, s.y, s.h), P(s.x, s.y, B_Z)), class: "nf dash lo" }, grp);
    return { ...s, el };
  });
  // the blueprint: a sheet in four quarters, a milestone over each system
  const [sr, si] = rings(-B_SHEET, -B_SHEET, B_SHEET, B_SHEET, 2.5, 1.4);
  put(solid(g), prism(P, front, sr, si, B_Z, B_Z + B_T));
  const top = B_Z + B_T;
  mk("path", { d: seg(P(0, -B_SHEET + 4, top), P(0, B_SHEET - 4, top)) + seg(P(-B_SHEET + 4, 0, top), P(B_SHEET - 4, 0, top)), class: "nf dash lo" }, g);
  const legs = B_ROUTE.slice(1).map((k, j) => {
    const a = B_SYS[B_ROUTE[j]], b = B_SYS[k];
    return { a: [a.x, a.y], b: [b.x, b.y], tw: tween(j < B_REST ? 1 : 0), el: mk("path", { class: "nf hi" }, g), drawn: NaN };
  });
  const marks = B_SYS.map((s) => mk("path", { d: poly(ringAt(P, rrect(s.x - 5, s.y - 5, s.x + 5, s.y + 5, 1.2), top)), class: "lo" }, g));

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const l of legs) {
      const u = tval(l.tw, now);
      if (!tdone(l.tw, now)) moving = true;
      if (u === l.drawn) continue;
      l.drawn = u;
      const pa = P(l.a[0] + (l.b[0] - l.a[0]) * 0.16, l.a[1] + (l.b[1] - l.a[1]) * 0.16, top);
      const pb = P(l.a[0] + (l.b[0] - l.a[0]) * lerp(0.16, 0.84, u), l.a[1] + (l.b[1] - l.a[1]) * lerp(0.16, 0.84, u), top);
      l.el.setAttribute("d", u > 0.01 ? seg(pa, pb) : "");
    }
    return moving;
  });
  bag.add(B.unregister);

  // the roadmap drawn to the milestone a step at a time, and taken back
  // from the far end first
  function choose(k) {
    const now = performance.now();
    at = k ?? B_REST;
    legs.forEach((l, j) => tset(l.tw, j < at ? 1 : 0, now, (j < at ? j : legs.length - 1 - j) * step));
    B_ROUTE.forEach((s, j) => {
      sys[s].el.sil.classList.toggle("hi", j === at);
      marks[s].setAttribute("class", j === at ? "hi" : "lo");
    });
    read.textContent = k == null ? "rest" : `step ${at + 1}·4`;
    B.wake();
  }
  choose(null);

  bag.add(listen(stage, fh, {
    move: (p) => {
      const c = quarter(unproj(C, p[0], p[1], 0));
      choose(c ? B_ROUTE.indexOf(B_SYS.findIndex((s) => s.x === c[0] && s.y === c[1])) : null);
    },
    leave: () => choose(null),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

/* --- 3 Calendar ------------------------------------------------- */
// twelve sessions round the practice, a month apart, the first just past
// the right of the front; the practice three floors stood apart
const A_R = 1.5 * CELL, A_N = 12, A_FROM = 15, A_TILE = 7, A_T = 3;
const A_FLOORS = [0, 26, 52], A_FLOOR_H = 18;
const A_REST = 1;
const A_REACH = [1, 0.4, 0.12];

function calendar({ stage, svg, read }, lift, { oy, fh }) {
  const bag = disposer();
  const C = camera(oy), P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  let pick = A_REST;

  mk("path", { d: poly(ringAt(P, circ(A_R, 96), 0)), class: "nf dash lo" }, g);
  const months = Array.from({ length: A_N }, (_, i) => {
    const a = rad(A_FROM + (360 / A_N) * i), x = A_R * Math.cos(a), y = A_R * Math.sin(a);
    const [ring, inner] = rings(x - A_TILE, y - A_TILE, x + A_TILE, y + A_TILE, 1.5, 1);
    return { i, x, y, ring, inner, tw: tween(0), drawn: NaN };
  });
  // back to front: the months behind the practice, its floors, the rest
  const floors = mk("g", {}, g);
  const [fr, fi] = rings(-H, -H, H, H, 2, 1.4);
  A_FLOORS.forEach((z) => put(solid(floors), prism(P, front, fr, fi, z, z + A_FLOOR_H)));
  [...months].sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((m) => {
    m.el = solid(g);
    if (m.x + m.y < 0) floors.before(m.el.g);
  });

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const m of months) {
      const z = tval(m.tw, now);
      if (!tdone(m.tw, now)) moving = true;
      if (z === m.drawn) continue;
      m.drawn = z;
      put(m.el, prism(P, front, m.ring, m.inner, z, z + A_T));
    }
    return moving;
  });
  bag.add(B.unregister);

  // the month and its neighbours rise, out from it
  function choose(k) {
    const now = performance.now();
    pick = k ?? A_REST;
    for (const m of months) {
      const d = Math.min(Math.abs(m.i - pick), A_N - Math.abs(m.i - pick));
      tset(m.tw, d < A_REACH.length ? lift * A_REACH[d] : 0, now, d * 45);
      m.el.sil.classList.toggle("hi", m.i === pick);
    }
    read.textContent = k == null ? "rest" : `month ${pick + 1}`;
    B.wake();
  }
  choose(null);

  bag.add(listen(stage, fh, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], 0), r = Math.hypot(x, y);
      if (r < 0.45 * A_R || r > 1.45 * A_R) return choose(null);
      const deg = (Math.atan2(y, x) * 180) / Math.PI - A_FROM;
      choose(((Math.round(deg / (360 / A_N)) % A_N) + A_N) % A_N);
    },
    leave: () => choose(null),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { lift = v; choose(read.textContent === "rest" ? null : pick); }, destroy: bag.dispose };
}

/* --- The four ------------------------------------------------------ */
// by the services' order: the drawing, its value, its ground's origin in
// the 256-high frame, and its unseen pointer's lap in the frame's units
export const SERVICE_FIGURES = [
  { name: "friction", draw: friction, value: 10, oy: 168, tour: [[200, 141], [153, 168], [247, 168], null] },
  { name: "register", draw: register3, value: 120, oy: 182, tour: [[260, 150], [205, 165], [120, 200], null] },
  { name: "roadmap", draw: roadmap, value: 140, oy: 186, tour: [[247, 186], [200, 159], [153, 186], null] },
  { name: "calendar", draw: calendar, value: 14, oy: 150, tour: [[299, 150], [101, 150], [200, 93], null] },
];
