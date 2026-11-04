/* ============================================================
   The deck figures — the homepage service deck's four drawings
   (ServiceDeck.astro, ServiceDiagram.astro with deck), Hairline figures
   on Hairline's kernel (vendor/hairline-kernel.js), on the 2:1 view of
   the approach's Understand figure, which they follow
   ------------------------------------------------------------
     0  Workflow Workshop     "Handover": a live project's six stages,
                              brief to issue, each holding its work as
                              sheets; coordination holds the same model
                              three times over, re-entered where the work
                              loops back from modelling. A stage picked
                              opens its sheets, its neighbours a little.
     1  Before Revit          "Resolution": RIBA stages 0 to 3, the
                              building resolving on each (the site, a
                              Rhino massing, its floors, a gridded model
                              with storeys: the Revit end); one red thread
                              carries the design through all four. A stage
                              picked lifts, the thread lit up to it.
     2  Technology Blueprint  "Exploded": the practice as an exploded
                              axonometric (infrastructure, data, software,
                              and the roadmap's three phases on top) on one
                              column grid. A layer picked opens the stack
                              above it.
     3  Ongoing Advisory      "Course": twelve monthly stones along a route
                              that drifts round a dashed strategic line,
                              the ADDD logo beside it. A month picked is
                              tethered to the logo, and the route beyond it
                              eases back onto the line.

   Generated, do not edit: source-assets/hairline/deck/ holds the sources
   (common.js and one file a figure) and gen-deck.mjs, which also writes
   their bench copies for the hairline-create skill. Each is drawn in the
   kernel's 400 × 320 frame; the deck shows its middle 300 × 225 (fr), so a
   real pointer is mapped into it, and the tour's stops are in the frame.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, circ, facing, fit, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  tween, tset, tval, tdone, flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const R2 = Math.SQRT2;
// a ground point by (s, t): s along the screen's level, t towards the viewer
const W = (s, t) => [(s + t) / R2, (t - s) / R2];
// a rounded square tile about (s, t), half side h, turned a degrees
function tile(s, t, h, r = 1.6, b = 1, a = 0) {
  const [x, y] = W(s, t), c = Math.cos(rad(a)), n = Math.sin(rad(a));
  const at = (q) => ({ u: x + q.u * c - q.v * n, v: y + q.u * n + q.v * c, nu: q.nu * c - q.nv * n, nv: q.nu * n + q.nv * c });
  return [rrect(-h, -h, h, h, r, 6).map(at), rrect(-h + b, -h + b, h - b, h - b, Math.max(0.3, r - b), 6).map(at)];
}
// a mark of an n-unit box laid flat at height z, size wide, read along the screen's level
function flat(P, n, size, s, t, z) {
  const at = (lx, ly) => { const [x, y] = W(s + (lx / n - 0.5) * size, t + (ly / n - 0.5) * size); return P(x, y, z); };
  const o = at(0, 0), ex = at(n, 0), ey = at(0, n);
  return `matrix(${[(ex[0] - o[0]) / n, (ex[1] - o[1]) / n, (ey[0] - o[0]) / n, (ey[1] - o[1]) / n, o[0], o[1]].map((v) => v.toFixed(4)).join(" ")})`;
}
// Rhino's mark (public/assets/logos/software/rhino.svg, its body), in the ink
const RHINO = "M450.8,714.0c-6.9-21.5-19.1-49.1-27.6-65.8-2.7-5.4-3.0-14.3-.29-21.0,1.4-3.5,3.4-7.9,11.4-12.6,8.1-4.8,23.7-8.8,39.3-14.9,15.6-6.1,49.4-21.4,62.6-27.8,55.5-27.1,95.1-59.3,102.2-67.7,14.2-16.8,1.3-52.6-2.7-64.9-8.1-24.5-19.3-54.7-45.3-95.0-21.9-34.7-60.5-77.9-84.6-94.0-6.0-4.0-7.8-4.7-9.4-5.0-3.1-.63-5.2.31-7.0,2.3-.91,1-1.7,2.2-1.7,9.9.13,30.5-5.7,76.2-11.8,102.4-6.6,30.5-12.2,45.7-16.3,56.7-3.1,8.0-6.2,16.1-9.4,24.1-4.4,9.9-8.8,19.8-13.2,29.8-12.0,24.7-28.0,46.9-40.3,63.5-12.3,16.5-21.8,32.5-36.9,33.7-15.0,1.1-27.8-10.3-33.2-20.1-5.4-9.8-1.2-21.2,15.0-44.4,16.2-23.1,50.7-85.0,62.6-144.2,8.9-44.4,9.8-74.4,7.9-98.8-2.9-24.0-6.8-42.6-15.9-51.5-9.1-8.8-32.8-13.6-96.5,2.5-15.9,4.0-34.3,9.4-58.8,18.1-24.5,8.6-36.4,12.8-40.1,17.5-3.6,4.6.84,9.7,7.7,19.0,16.8,25.2,65.6,80.9,24.8,238.4-15.5-5.1-43.0-12.7-77.5-16.7-11.5-1.3-23.8-2.3-37.1-2.0-15.1-.09-24.4.47-33.0,9.1-8.5,8.6-16.4,25.1-20.6,53.6-4.2,29.3-2.4,53.7,2.2,64.3,4.8,11.0,13.0,7.4,28.6,3.6,15.8-3.8,40.2-8.2,66.2-8.8,25.9-.58,53.5,2.6,82.1,12.7,28.5,10.0,58.1,26.9,85.2,49.0,27.0,22.1,51.6,49.5,69.4,72.2,26.4,33.7,37.8,56.7,44.4,76.4,2.3,6.5,7.9,7.5,11.1,4.5,3.2-3.0,4.0-10.0,6.5-31.6.85-7.2,1.6-43.6-9.7-76.4h0ZM1131.1,562.5c-10.6-8.6-77.3,51.0-132.8,92.0-55.4,41.0-99.6,63.3-128.0,72.4-28.3,9.1-40.9,5.1-49.8.07-8.9-5.0-14.1-11.1-9.1-17.9,5.0-6.8,20.2-14.5,34.3-33.0,14.1-18.5,28-47.7,20.9-53.9-7.1-6.2-35.2,10.5-58.9,17.6-23.7,7.0-44.2,4.5-57.4.56-34.6-10.2-54.5-52.5-61.5-66.2-9.5-18.9-23.4-46.4-26.0-51.6-.79-1.6-2.5-2.9-4.3-3.3-1.7-.43-3.8.04-5.3,1.1-72.8,57.5-109.5,67.9-135.7,80.6-25.8,12.5-34.9,22.4-38.3,34.9-2.1,7.9-1.8,15.1-.28,20.9,3,11.9,7.5,14.3,14.1,16.6,4.8,1.1,20.0,2.2,27.8,2.5,15.6.55,21.6.4,32.7,2.2,5.5.92,12.3,2.3,12.4,4.6.1,3.0-11.7-.03-17.2,6.6-5.4,6.6-11.8,16.6-3.6,23.6,8.1,7,30.0,20.2,33.2,22.4,19.0,13.1,32.7,27.3,46.3,21.2,4.5-2.0,13.6-14.5,8.8-20.9-4.7-6.4-3.7-9.1-1.7-10.4,2.0-1.2,3.5-.68,5.0-.27,4.4,1.2,9.0,1.1,10.3,1.0,5.3-.67,13.2-5.9,18.5-7.7,10.7-3.6,39.9-9.0,68.1-4.5,43.4,7.7,91.5,42.1,121.6,90.9,24.6,42.2,17.5,58.0,31.6,39.3,28.9-38.1,99.4-82.0,149.3-133.8,59.9-62.0,105.4-139.2,94.7-147.9ZM866.0,863.6c9.6,47.8-13.2,77.1-27.4,90.8-10.4,10.1-25.3,20.8-34.5,23.6-8.1,2.4-11.9-1.2-17.4-8.2-5.9-7.4-24.5-31.6-59.2-58.3-4.3-3.3-8.9-6.7-12.9-9.3-4-2.6-7.3-4.4-8.2-3.9-1.6,1.0-1.9,1.9-1.4,3.0.82,2.1,4.1,5.2,11.9,11.5,15.7,13.8,32.8,29.8,43.5,43.6,10.7,13.8,18.1,28.9,8.3,39.6-8.4,9.1-22.1-2.0-36.0-14.6-13.8-12.5-27.8-26.4-46.3-41.7-18.5-15.3-41.5-32.2-65.7-48.0-24.2-15.7-49.8-30.3-72.3-42.9-22.5-12.5-42.2-22.9-53.2-32.1-11-9.2-13.3-17.2-12.0-31.9,1.7-22.4,10.9-44.3,9.7-86.9-.12-4.2-.34-8.7,2.7-11.0,3.0-2.3,5.9-1.3,8.1.34,6.5,4.9,6.5,15.5,6.6,24.1.07,8.5.23,15.1-2.9,50.9-1.2,10.4-2.3,18.9,7.8,27.9,10.1,8.9,31.5,18.2,56.0,28.8,2.6,1.1,5.3,2.3,8.0,3.5,11.5,5.0,18.3,7.3,25.7,6.4,7.2-.82,17.1-5.3,22.7-12.8,5.6-7.5,7.1-18.1,11.0-30.0,13.3-35.8,32.0-60.9,66.4-64.4,16.4-1.6,51.8.39,92.3,31.5,55.0,43.6,65.2,91.9,68.9,110.7ZM798.6,960.9c1.8.15,3.8-.54,5.1-1.8,8.8-8,12.5-18.1,12.6-28.7.07-12.3-6.9-23.8-17.2-29.3-10.1-5.7-22.7-5.0-28.0,3.2-5.4,8.0-4.3,20.9,1.9,29.2,6.2,8.3,13.7,16.5,20.6,24.8,1.1,1.4,3.0,2.3,4.8,2.4Z";
const rhino = (g) => mk("path", { d: RHINO, class: "dot m" }, g);
// The ADDD logo (public/assets/logo.svg): a thin disc in the accent, its four
// triangles on its top
const LOGO = { cx: 51, cy: 50.3, r: 40.2 };
const MARKS = [[[18.4, 58.7], [34.7, 58.7], [26.5, 42.7]], [[34.7, 42.7], [49.7, 50.7], [34.7, 58.7]], [[50.7, 42.7], [66.4, 50.7], [50.7, 58.7]], [[66.8, 42.7], [82.4, 50.7], [66.8, 58.7]]];
function logo(g, P, front, s, t, R, T) {
  const grp = mk("g", { class: "logo" }, g), [x, y] = W(s, t), el = solid(grp), k = (R - 3) / LOGO.r;
  put(el, prism(P, front, circ(R, 64).map((q) => ({ ...q, u: q.u + x, v: q.v + y })), null, 0, T));
  el.sil.classList.add("hi");
  mk("path", { d: MARKS.map((m) => poly(m.map(([lx, ly]) => P(...W(s + (lx - LOGO.cx) * k, t + (ly - LOGO.cy) * k), T)))).join(""), class: "fo" }, grp);
  return grp;
}
// (s, t) of a ground point
const ST = (x, y) => [(x - y) / R2, (x + y) / R2];
// the pointer: a real one mapped into the part of the frame shown (fr)
function listen(stage, fr, on) {
  const map = (p) => [fr.x + (p[0] * fr.w) / 400, fr.y + (p[1] * fr.h) / 320];
  return pointer(stage, { move: (p, e) => on.move(e instanceof Event ? map(p) : p), leave: () => on.leave() });
}
// the item whose rest point is nearest the pointer, within reach; or -1
function closest(pts, p, reach) {
  let best = -1, d = reach;
  pts.forEach((q, i) => { const r = Math.hypot(q[0] - p[0], q[1] - p[1]); if (r < d) { d = r; best = i; } });
  return best;
}

/* --- Handover: the Workflow Workshop ----------------------------- */
// A live project's six stages, brief to issue, snaking through a three by
// two grid, each on a plinth as tall as the time it takes and holding its
// work as sheets: coordination, the tallest, holds the same model three
// times over, re-entered where the work loops back from modelling to it.
const HO = [
  { x: -44, y: -32, h: 3, n: 1, name: "brief", mark: "lines" },
  { x: 0, y: -32, h: 6, n: 1, name: "design", mark: "sketch" },
  { x: 44, y: -32, h: 8, n: 1, name: "model", mark: "rhino" },
  { x: 44, y: 32, h: 16, n: 3, name: "coord", mark: "" },
  { x: 0, y: 32, h: 9, n: 2, name: "docs", mark: "fold" },
  { x: -44, y: 32, h: 4, n: 1, name: "issue", mark: "lines" },
].map((h) => { const [s, t] = ST(h.x, h.y); return { ...h, s, t }; });
const HO_STUCK = 3, HO_HALF = 15, HO_SH = 10, HO_ST = 1.2, HO_LIFT = 6, HO_REACH = [1, 0.32, 0.1], HO_IDLE = 0.55;

function mountHandover({ stage, svg, read }, value, fr = { x: 0, y: 0, w: 400, h: 320 }) {
  const bag = disposer();
  let gap = value, act = -1;
  const C = Cam(45, 0.5, 1.55);
  fit(C, [[-66, -54, 0], [66, 54, 0], [66, -54, 0], [-66, 54, 0], [44, 32, 64], [44, -32, 50]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const G = (s, t, z) => P(...W(s, t), z);

  // on the ground, the way the work goes, stage to stage, set out from
  // before the brief to past the issue
  mk("path", { d: open(HO.map((h) => P(h.x, h.y, 0))), class: "nf dash lo" }, g);
  [HO[0], HO[HO.length - 1]].forEach((h) => place(flatDot(g, C, 1.2, "dot m"), P(h.x - 26, h.y, 0)));

  // back to front, so a nearer stage covers a farther one
  const groups = [];
  HO.map((h, i) => [h.t, i]).sort((a, b) => a[0] - b[0]).forEach(([, i]) => { groups[i] = mk("g", {}, g); });
  const st = HO.map((h, i) => {
    const grp = groups[i];
    const [pr, pi] = tile(h.s, h.t, HO_HALF, 2, 1.2);
    const plate = solid(grp), sheets = Array.from({ length: h.n }, () => solid(grp));
    const mark = h.mark === "rhino" ? rhino(grp) : h.mark ? mk("path", { class: "nf lo" }, grp) : null;
    return { ...h, kind: h.mark, i, pr, pi, plate, sheets, top: sheets[h.n - 1], mark, tw: tween(i === HO_STUCK ? HO_IDLE : 0), drawn: NaN };
  });
  st[HO_STUCK].top.sil.classList.add("hi");
  // over them, the loop back from coordination to modelling, where the
  // model is made again
  const loop = [];
  for (let k = 0; k <= 20; k++) { const f = k / 20; loop.push(P(44, lerp(32, -32, f), lerp(38, 14, f) + 16 * Math.sin(Math.PI * f))); }
  mk("path", { d: open(loop), class: "nf dash" }, g);

  // a stage at openness u: its plate lifted, its sheets apart by the gap,
  // each copy a little off the one under it, as work entered again is
  function draw(s, u) {
    const lift = HO_LIFT * u;
    put(s.plate, prism(P, front, s.pr, s.pi, lift, lift + s.h));
    let z = lift + s.h + 1.4, c = null;
    s.sheets.forEach((el, k) => {
      const at = { s: s.s + k * 2, t: s.t - k * 1.5, a: s.n > 2 ? k * 5 : 0 };
      const [r, ri] = tile(at.s, at.t, HO_SH, 1.2, 0.8, at.a);
      put(el, prism(P, front, r, ri, z, z + HO_ST));
      c = { ...at, z: z + HO_ST };
      z += HO_ST + 1.4 + u * gap;
    });
    if (s.mark) mark(s, c);
  }
  // what is on the top sheet: a brief's lines, a sketch, Rhino's mark, a
  // drawing set's turned-down corner
  function mark(s, c) {
    if (s.kind === "rhino") return s.mark.setAttribute("transform", flat(P, 1200, 13, c.s, c.t, c.z));
    let d = "";
    if (s.kind === "lines") d = [-4, 0, 4].map((v, k) => seg(G(c.s - 6, c.t + v, c.z), G(c.s + 6 - k * 3, c.t + v, c.z))).join("");
    if (s.kind === "sketch") { const p = []; for (let k = 0; k <= 10; k++) p.push(G(c.s - 7 + k * 1.4, c.t - 1 + 3 * Math.sin(k * 0.9), c.z)); d = open(p); }
    if (s.kind === "fold") {
      const [x, y] = W(c.s, c.t), h = HO_SH;
      d = seg(P(x + h - 5, y - h, c.z), P(x + h, y - h + 5, c.z)) + open([P(x + h - 5, y - h, c.z), P(x + h - 5, y - h + 5, c.z), P(x + h, y - h + 5, c.z)]);
    }
    s.mark.setAttribute("d", d);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const s of st) {
      const u = tval(s.tw, now);
      if (!tdone(s.tw, now)) moving = true;
      if (u === s.drawn) continue;
      s.drawn = u;
      draw(s, u);
    }
    return moving;
  });
  bag.add(B.unregister);

  // the stage picked opens most, its neighbours less, out from it
  const rest = st.map((s) => G(s.s, s.t, s.h));
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act, on = a >= 0 ? a : HO_STUCK;
    act = a;
    st.forEach((s, i) => {
      const d = Math.abs(i - on);
      const to = a < 0 ? (i === HO_STUCK ? HO_IDLE : 0) : d < HO_REACH.length ? HO_REACH[d] : 0;
      tset(s.tw, to, now, Math.abs(i - from) * 45);
      s.top.sil.classList.toggle("hi", i === on);
    });
    read.textContent = a < 0 ? "rest" : `${st[a].name} ×${st[a].n}`;
    B.wake();
  }
  read.textContent = "rest";

  bag.add(listen(stage, fr, { move: (p) => choose(closest(rest, p, 30)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gap = v; st.forEach((s) => { s.drawn = NaN; }); B.wake(); }, destroy: bag.dispose };
}

/* --- Resolution: Before Revit ------------------------------------ */
// RIBA stages 0 to 3 stepping forward, down the page and a little up, the building on each at a
// higher resolution: the site's boundary, a massing in Rhino, its floors,
// and the model, storeys and grid, where Revit takes it on. One thread
// along the plates' near side carries the design through all four.
const RE_X = [-78, -26, 26, 78], RE_Y0 = [-24, -8, 8, 24], RE_RISE = 4, RE_HALF = 20, RE_PT = 3, RE_BH = 22, RE_FX = 11, RE_FY = 7, RE_Y = 16;
const RE_REACH = [1, 0.3, 0.08];
const RE_SITE = [[-17, -10], [-2, -16], [15, -11], [18, 6], [4, 15], [-14, 12]];

function mountResolution({ stage, svg, read }, value, fr = { x: 0, y: 0, w: 400, h: 320 }) {
  const bag = disposer();
  let lift = value, act = -1;
  const C = Cam(45, 0.5, 1.45);
  fit(C, [[-98, -44, 0], [98, 44, 3 * RE_RISE], [98, 4, 3 * RE_RISE], [-98, -4, 0], [-46, -44, 0], [46, 44, 3 * RE_RISE], [-26, -8, RE_RISE + RE_PT + RE_BH + 18], [78, 24, 3 * RE_RISE + RE_PT + RE_BH + 18]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const st = RE_X.map((cx, i) => {
    const grp = mk("g", {}, g), cy = RE_Y0[i];
    const [pr, pi] = rings(cx - RE_HALF, cy - RE_HALF, cx + RE_HALF, cy + RE_HALF, 2.2, 1.3);
    const [fr0, fi0] = rings(cx - RE_FX, cy - RE_FY, cx + RE_FX, cy + RE_FY, 1.2, 0.8);
    const el = { plate: solid(grp), lines: mk("path", { class: "nf dash lo" }, grp) };
    if (i === 1) el.rhino = rhino(grp);
    if (i === 2) el.floors = [0, 1, 2, 3].map(() => solid(grp));
    if (i === 1 || i === 3) el.mass = solid(grp);
    if (i === 3) el.storeys = mk("path", { class: "nf lo" }, grp);
    if (i === 0) el.outline = mk("path", { class: "nf lo" }, grp);
    return { i, cx, cy, base: i * RE_RISE, pr, pi, fr: fr0, fi: fi0, el, tw: tween(0), drawn: NaN };
  });
  // the thread: lit from the first stage to the one reached, the rest of
  // it on, in the plain line
  const lit = mk("path", { class: "nf hi" }, g), beyond = mk("path", { class: "nf" }, g);
  const zOf = (p, u) => p.base + lift * u;

  function draw(p, u) {
    const z0 = zOf(p, u), z = z0 + RE_PT, { el, cx, cy } = p;
    put(el.plate, prism(P, front, p.pr, p.pi, z0, z));
    let d = "";
    if (p.i === 0) {
      d = poly(RE_SITE.map(([x, y]) => P(cx + x, cy + y, z)));
      el.outline.setAttribute("d", poly(ringAt(P, p.fr, z)));
    }
    if (p.i === 3) {
      // the grid: three lines across the building and two along it, each
      // ending in its bubble beyond the plan
      for (const x of [-RE_FX, 0, RE_FX]) d += seg(P(cx + x, cy - 17, z), P(cx + x, cy + 15, z));
      for (const y of [-RE_FY, RE_FY]) d += seg(P(cx - 19, cy + y, z), P(cx + 17, cy + y, z));
    }
    el.lines.setAttribute("d", d);
    if (el.dots) el.dots.forEach(([dot, x, y]) => place(dot, P(cx + x, cy + y, z)));
    if (el.mass) put(el.mass, prism(P, front, p.fr, p.fi, z, z + RE_BH));
    if (el.floors) el.floors.forEach((f, k) => put(f, prism(P, front, p.fr, p.fi, z + k * 6.8, z + k * 6.8 + 1.6)));
    if (el.storeys) {
      const face = run(p.fr, front);
      let sd = "";
      for (let h = 5.5; h < RE_BH - 1; h += 5.5) sd += open(ringAt(P, face, z + h));
      el.storeys.setAttribute("d", sd);
    }
    if (el.rhino) el.rhino.setAttribute("transform", flat(P, 1200, 8, ...ST(cx - 14.5, cy + 11), z));
  }
  // the grid's bubbles, on stage 3, before its model
  const g3 = st[3];
  g3.el.dots = [[-RE_FX, -19], [0, -19], [RE_FX, -19], [-21, -RE_FY], [-21, RE_FY]].map(([x, y]) => [flatDot(g3.el.lines.parentNode, C, 1.3, "dot off"), x, y]);
  g3.el.dots.forEach(([dot]) => g3.el.mass.g.before(dot));

  function thread(now) {
    const reach = act < 0 ? st.length - 1 : act, a = [], b = [];
    st.forEach((p, i) => {
      const z = zOf(p, tval(p.tw, now)) + RE_PT;
      const pts = [P(p.cx - 15, p.cy + RE_Y, z), P(p.cx + 15, p.cy + RE_Y, z)];
      if (i <= reach) a.push(...pts);
      if (i >= reach) b.push(...(i === reach ? [pts[1]] : pts));
    });
    lit.setAttribute("d", open(a));
    beyond.setAttribute("d", b.length > 1 ? open(b) : "");
  }

  const B = register(stage, (_dt, now) => {
    let moving = false, changed = false;
    for (const p of st) {
      const u = tval(p.tw, now);
      if (!tdone(p.tw, now)) moving = true;
      if (u === p.drawn) continue;
      p.drawn = u;
      changed = true;
      draw(p, u);
    }
    if (changed) thread(now);
    return moving;
  });
  bag.add(B.unregister);

  const rest = st.map((p) => P(p.cx, p.cy, p.base + RE_PT));
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    st.forEach((p, i) => {
      const d = Math.abs(i - a);
      tset(p.tw, a < 0 ? 0 : d < RE_REACH.length ? RE_REACH[d] : 0, now, Math.abs(i - from) * 45);
    });
    read.textContent = a < 0 ? "rest" : `stage ${a}`;
    thread(now);
    B.wake();
  }
  read.textContent = "rest";

  bag.add(listen(stage, fr, { move: (p) => choose(closest(rest, p, 44)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { lift = v; st.forEach((p) => { p.drawn = NaN; }); B.wake(); }, destroy: bag.dispose };
}

/* --- Exploded: the Technology Blueprint -------------------------- */
// The practice as an exploded axonometric, four layers on one column grid:
// its infrastructure (racks), its data (a store and its records), its
// software (applications, Rhino among them) and, on top, the roadmap, three
// phases rising. A layer picked opens the stack above it.
const EX_H = 46, EX_T = 2.5, EX_Z = [0, 30, 60, 92], EX_C = 40;
const EX_NAME = ["infra", "data", "software", "roadmap"];
const EX_RACKS = [[-22, -12], [0, -12], [22, -12], [-22, 12], [0, 12], [22, 12]];
const EX_DOTS = [];
for (const x of [10, 20, 30]) for (const y of [-20, -10, 0, 10, 20]) EX_DOTS.push([x, y]);
const EX_APPS = [[-20, -10], [0, -10], [20, -10], [-20, 10], [0, 10], [20, 10]], EX_RHINO = 4;
const EX_STEPS = [[-24, 3], [0, 6.5], [24, 11]];

function mountExploded({ stage, svg, read }, value, fr = { x: 0, y: 0, w: 400, h: 320 }) {
  const bag = disposer();
  let gap = value, act = -1;
  const C = Cam(45, 0.5, 1.22);
  fit(C, [[-EX_H, -EX_H, 0], [EX_H, EX_H, 0], [EX_H, -EX_H, 0], [-EX_H, EX_H, 0], [0, 0, EX_Z[3] + 22 + 14]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-EX_H, -EX_H, EX_H, EX_H, 3, 1.6);
  const byDepth = (a, b) => a[0] + a[1] - (b[0] + b[1]);

  // each layer back to front: its plate, the grid's back and side lines
  // in the gap over it, what it holds, then the grid's front line
  const L = EX_Z.map((z, j) => {
    const grp = mk("g", {}, g), el = { plate: solid(grp), back: mk("path", { class: "nf dash lo" }, grp), parts: [] };
    if (j === 0) el.parts = EX_RACKS.slice().sort(byDepth).map(([x, y]) => ({ x, y, el: solid(grp), lines: mk("path", { class: "nf lo" }, grp) }));
    if (j === 1) {
      el.discs = [0, 1, 2].map(() => solid(grp));
      el.dots = EX_DOTS.map(([x, y]) => [flatDot(grp, C, 1.1, "dot off"), x, y]);
    }
    if (j === 2) el.parts = EX_APPS.map(([x, y], k) => ({ x, y, k, el: solid(grp) })).sort((a, b) => a.x + a.y - (b.x + b.y));
    if (j === 2) el.rhino = rhino(grp);
    if (j === 3) { el.path = mk("path", { class: "nf dash" }, grp); el.parts = EX_STEPS.map(([s, h]) => ({ s, h, el: solid(grp) })); }
    el.front = mk("path", { class: "nf dash lo" }, grp);
    return { j, el, tw: tween(0), z };
  });
  const goal = L[3].el.parts[2].el;
  goal.sil.classList.add("hi");

  let drawn = "";
  function draw(zs) {
    L.forEach(({ j, el }) => {
      const z0 = zs[j], top = z0 + EX_T, next = j < 3 ? zs[j + 1] : null;
      put(el.plate, prism(P, front, pr, pi, z0, top));
      const up = (x, y) => (next === null ? "" : seg(P(x, y, top), P(x, y, next)));
      el.back.setAttribute("d", up(-EX_C, -EX_C) + up(-EX_C, EX_C) + up(EX_C, -EX_C));
      el.front.setAttribute("d", up(EX_C, EX_C));
      if (j === 0) for (const r of el.parts) {
        const [ring, inner] = rings(r.x - 7, r.y - 5, r.x + 7, r.y + 5, 1, 0.7), face = run(ring, front);
        put(r.el, prism(P, front, ring, inner, top, top + 11));
        let d = "";
        for (let h = 2.6; h < 10; h += 2.6) d += open(ringAt(P, face, top + h));
        r.lines.setAttribute("d", d);
      }
      if (j === 1) {
        const disc = circ(9, 48).map((q) => ({ ...q, u: q.u - 18, v: q.v + 4 }));
        el.discs.forEach((s, k) => put(s, prism(P, front, disc, null, top + k * 3.8, top + k * 3.8 + 3)));
        el.dots.forEach(([dot, x, y]) => place(dot, P(x, y, top)));
      }
      if (j === 2) for (const a of el.parts) {
        const [ring, inner] = rings(a.x - 6.5, a.y - 6.5, a.x + 6.5, a.y + 6.5, 1.4, 0.9);
        put(a.el, prism(P, front, ring, inner, top, top + 1.6));
        if (a.k === EX_RHINO) el.rhino.setAttribute("transform", flat(P, 1200, 9, ...ST(a.x, a.y), top + 1.6));
      }
      if (j === 3) {
        el.path.setAttribute("d", open([[-38, 4], [-24, 2], [0, 1], [24, -1], [38, -2]].map(([s, t]) => P(...W(s, t), top))));
        for (const p of el.parts) {
          const [ring, inner] = tile(p.s, 0, 6.5, 1.4, 0.9);
          put(p.el, prism(P, front, ring, inner, top, top + p.h));
        }
      }
    });
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    const zs = L.map((l) => l.z + gap * tval(l.tw, now));
    L.forEach((l) => { if (!tdone(l.tw, now)) moving = true; });
    const key = zs.map((z) => z.toFixed(2)).join();
    if (key !== drawn) { drawn = key; draw(zs); }
    return moving;
  });
  bag.add(B.unregister);

  // the layer picked opens the stack above it, the nearer layers first
  const mid = P(0, 0, 0)[0], rest = L.map((l) => P(0, 0, l.z + EX_T)[1]);
  // the layer whose rest top is nearest the pointer's height, over the stack
  function layer(p) {
    if (Math.abs(p[0] - mid) > 100) return -1;
    let best = -1, d = 20;
    rest.forEach((y, i) => { const r = Math.abs(y - p[1]); if (r < d) { d = r; best = i; } });
    return best;
  }
  function choose(a) {
    if (a === act) return;
    const now = performance.now();
    act = a;
    L.forEach((l) => {
      tset(l.tw, a >= 0 && l.j > a ? 1 : 0, now, a >= 0 ? Math.abs(l.j - a) * 45 : (3 - l.j) * 45);
      l.el.plate.sil.classList.toggle("hi", l.j === a);
    });
    goal.sil.classList.toggle("hi", a < 0);
    read.textContent = a < 0 ? "rest" : EX_NAME[a];
    B.wake();
  }
  read.textContent = "rest";

  bag.add(listen(stage, fr, { move: (p) => choose(layer(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gap = v; drawn = ""; B.wake(); }, destroy: bag.dispose };
}

/* --- Course: Ongoing Advisory ------------------------------------ */
// A year of monthly stones climbing a ring round the ADDD logo, each a
// little higher than the last, drifting in and out of the dashed course
// the strategy set. A month picked is tethered to the logo: its stone
// lifts, and the months after it ease back onto the course.
const CO_N = 12, CO_R = 62, CO_RISE = 3.6, CO_HALF = 6.4, CO_T = 2.4, CO_REACH = [1, 0.4, 0.12], CO_FROM = 120;
const CO_HUB = { r: 19, h: 3.6 };
const CO_DRIFT = Array.from({ length: CO_N }, (_, i) => 9 * Math.sin(i * 1.7 + 0.4) + 4 * Math.sin(i * 0.9));
// month i's place: its angle round the ring and its height
const CO_A = (i) => rad(CO_FROM - i * (360 / CO_N));
const CO_AT = (i, r) => [r * Math.cos(CO_A(i)), r * Math.sin(CO_A(i)), i * CO_RISE];

function mountCourse({ stage, svg, read }, value, fr = { x: 0, y: 0, w: 400, h: 320 }) {
  const bag = disposer();
  let lift = value, act = -1;
  const C = Cam(45, 0.5, 1.55);
  const R1 = CO_R + 16, Z1 = (CO_N - 1) * CO_RISE + 18;
  fit(C, [[-R1, -R1, 0], [R1, R1, 0], [R1, -R1, 0], [-R1, R1, 0], [-R1 * 0.7, -R1 * 0.7, Z1], [R1 * 0.7, R1 * 0.7, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the course the strategy set, a dashed rising ring, and the way the
  // months actually go
  const course = [];
  for (let k = 0; k <= (CO_N - 1) * 6; k++) { const i = k / 6; course.push(P(...CO_AT(i, CO_R))); }
  mk("path", { d: open(course), class: "nf dash lo" }, g);
  [0, CO_N - 1].forEach((i) => place(flatDot(g, C, 1.2, "dot m"), P(...CO_AT(i, CO_R))));
  const route = mk("path", { class: "nf dash" }, g);

  const stones = CO_DRIFT.map((d, i) => ({ i, r: CO_R + d, a: 8 * Math.sin(i * 1.3), up: tween(0), back: tween(0), drawn: "" }));
  // back to front round the ring, the logo among them where it stands
  const depth = (m) => { const [x, y] = CO_AT(m.i, CO_R); return x + y; };
  let hub = null;
  stones.slice().sort((a, b) => depth(a) - depth(b)).forEach((m) => {
    if (!hub && depth(m) > 0) hub = logo(g, P, front, 0, 0, CO_HUB.r, CO_HUB.h);
    m.el = solid(mk("g", {}, g));
  });
  if (!hub) hub = logo(g, P, front, 0, 0, CO_HUB.r, CO_HUB.h);
  const tether = mk("path", { class: "nf dash hi" }, g);
  hub.after(tether);

  const pose = (m, now) => {
    const [x, y, z] = CO_AT(m.i, lerp(m.r, CO_R, tval(m.back, now)));
    return { x, y, z: z + lift * tval(m.up, now) };
  };

  const B = register(stage, (_dt, now) => {
    let moving = false, changed = false;
    for (const m of stones) {
      if (!tdone(m.up, now) || !tdone(m.back, now)) moving = true;
      const p = pose(m, now), key = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
      if (key === m.drawn) continue;
      m.drawn = key;
      changed = true;
      const [ring, inner] = tile(...ST(p.x, p.y), CO_HALF, 1.6, 1, m.a * (1 - tval(m.back, now)));
      put(m.el, prism(P, front, ring, inner, p.z, p.z + CO_T));
    }
    if (changed) {
      route.setAttribute("d", open(stones.map((m) => { const p = pose(m, now); return P(p.x, p.y, m.i * CO_RISE); })));
      if (act >= 0) {
        const p = pose(stones[act], now), L = Math.hypot(p.x, p.y);
        tether.setAttribute("d", seg(P((p.x / L) * (CO_HUB.r + 2), (p.y / L) * (CO_HUB.r + 2), CO_HUB.h), P(p.x, p.y, p.z)));
      } else tether.setAttribute("d", "");
    }
    return moving;
  });
  bag.add(B.unregister);

  // the month picked rises, its neighbours a little; the months after it
  // come back onto the course, out from it
  const rest = stones.map((m) => P(...CO_AT(m.i, m.r)));
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    stones.forEach((m) => {
      const d = Math.abs(m.i - a), delay = Math.abs(m.i - from) * 45;
      tset(m.up, a >= 0 && d < CO_REACH.length ? CO_REACH[d] : 0, now, delay);
      tset(m.back, a >= 0 && m.i > a ? 1 : 0, now, delay);
      m.el.sil.classList.toggle("hi", m.i === a);
      m.drawn = "";
    });
    read.textContent = a < 0 ? "rest" : `month ${String(a + 1).padStart(2, "0")}`;
    B.wake();
  }
  read.textContent = "rest";

  bag.add(listen(stage, fr, { move: (p) => choose(closest(rest, p, 18)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { lift = v; stones.forEach((m) => { m.drawn = ""; }); B.wake(); }, destroy: bag.dispose };
}

/* --- The four ------------------------------------------------------ */
// by the services' order: the drawing, its value, its unseen pointer's lap
export const DECK_FIGURES = [
  { name: "handover", draw: mountHandover, value: 8, tour: [[213,186],[235,140],[165,171],null] },
  { name: "resolution", draw: mountResolution, value: 12, tour: [[182,149],[255,209],[218,179],null] },
  { name: "exploded", draw: mountExploded, value: 16, tour: [[200,211],[200,148],[200,179],null] },
  { name: "course", draw: mountCourse, value: 10, tour: [[176,227],[265,125],[140,114],null] },
];
// the frame the deck shows of the kernel's 400 × 320
export const DECK_FRAME = { x: 50, y: 54, w: 300, h: 225 };
