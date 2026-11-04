/* ============================================================
   The Resources dropdown's Free Tech Stacks preview (Nav.astro,
   stack-preview.js): GENERATED from source-assets/hairline/stack/stack.js
   by gen-site.mjs there. Edit that file, then run it again.
   ------------------------------------------------------------
  Stack: a row of plain cards standing upright on a guide, the Stack
  Diagnostic page's endless row in miniature. Since 2026-11-04 (second
  pass) a quiet illustration rather than a toy: every card alike and
  evenly spaced, each leaning back a touch, no card standing apart and
  none in the red; the row thirty-five long, framed by its middle
  twenty-one, so it runs on out of the box the figure is cropped by at
  both ends. The pointer anywhere over the box sends one soft wave along
  the row, from its front to its back, each card rising a little and
  settling as the wave passes, and the row leans back a degree or two
  while the pointer stays; leaving lets it stand up again. No card
  answers the pointer on its own. The slider is how far they move.
  
  The pattern: discrete items, after the package's Riffle, its stagger
  run along the row as a wave; tweens for the lean, the wave a function of
  time, both on the kernel's one loop.

   A Hairline figure (the hairline-create skill, .claude/skills/) on the
   vendored kernel, made after the package's Riffle (MIT, Lucas Marques).
   Colours: nav.css ("Resources tiles").
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, clamp, fillet, fit, open, poly, proj, rad,
  tdone, tset, tval, tween, disposer, mk, pointer, register, reducedMotion,
} = HL;

// the cards: width, height, thickness, corner; how many, how far apart
const W = 74, H = 47, TK = 1.5, R = 3.4;
const N = 35, STEP = 16;
const Y = Array.from({ length: N }, (_, i) => i * STEP);
const MID = Math.floor(N / 2);
// the cards the frame is fitted to: the middle twenty-one (the rest run
// on past the frame, and past the box that crops it)
const FRAMED = 10;
// every card's lean at rest (degrees: negative leans back), the extra lean
// back while the pointer is over the box, at amount 1, and its stagger
const REST = -6, LEAN = -5, LEAN_STAG = 14;
// the wave: how high a card rises as it passes (at amount 1), how long a
// card takes to rise and settle (ms), and how far behind the one before it
const WAVE = 4.5, WAVE_MS = 560, WAVE_STAG = 26;
// the guide the row stands on: from before the first card to past the last
const G0 = -24, G1 = Y[N - 1] + 24;

/** Card i leaning th degrees and lifted by `lift`: its paths. */
function pose(P, i, shape, th, lift) {
  const yb = Y[i], s = Math.sin(rad(th)), c = Math.cos(rad(th));
  const w = (u, v) => P(u, yb + v * s, v * c + lift);
  const wb = (u, v) => P(u, yb + v * s - TK * c, v * c + TK * s + lift);
  return {
    back: poly(shape.map((p) => wb(p[0], p[1]))),
    face: poly(shape.map((p) => w(p[0], p[1]))),
  };
}

function mount({ stage, svg, read, hover }, value) {
  const bag = disposer();
  let amt = value;

  // fitted to the middle of the row in its widest pose, so the framed part
  // fills the frame as the twenty-five-card row did, the rest beyond it
  const C = Cam(45, 0.5, 0.78);
  const lean = (y, th, v, z = 0) => [0, y + v * Math.sin(rad(th)), v * Math.cos(rad(th)) + z];
  const y0 = Y[MID - FRAMED], y1 = Y[MID + FRAMED];
  fit(C, [[0, y0 - 24, 0], [W, y1 + 24, 0], [W, y0, 0], lean(y0, REST + LEAN, H), lean(y1, REST, H, WAVE), [W, y0 - 24, 0]], 200, 160);
  const P = proj(C);
  const shape = fillet([[0, 0], [W, 0], [W, H], [0, H]], [R, R, R, R]);

  const g = mk("g", {}, svg);
  // the guide on the ground, under the row, running on past both ends
  mk("path", { d: open([P(W / 2, G0, 0), P(W / 2, G1, 0)]), class: "nf dash" }, g);

  // the row's front: the end nearer the foot of the frame, where the wave
  // starts
  const front = P(0, Y[0], 0)[1] > P(0, Y[N - 1], 0)[1] ? 0 : N - 1;

  const cards = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    cards.push({ back, face, a: tween(REST), drawn: "" });
  }

  function draw(i, th, lift) {
    const cd = cards[i], key = th.toFixed(3) + "," + lift.toFixed(3);
    if (cd.drawn === key) return;
    cd.drawn = key;
    const q = pose(P, i, shape, th, lift);
    cd.back.setAttribute("d", q.back);
    cd.face.setAttribute("d", q.face);
  }

  // the wave: started at t0, card i rising and settling as it passes (a
  // half sine over WAVE_MS, its start WAVE_STAG later per card from the
  // front); none while t0 is null
  let t0 = null;
  const rise = (i, now) => {
    if (t0 === null) return 0;
    const u = (now - t0 - Math.abs(i - front) * WAVE_STAG) / WAVE_MS;
    return u > 0 && u < 1 ? WAVE * amt * Math.sin(Math.PI * u) : 0;
  };
  const waveEnd = () => t0 + (N - 1) * WAVE_STAG + WAVE_MS;

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd, i) => {
      draw(i, tval(cd.a, now), rise(i, now));
      if (!tdone(cd.a, now)) moving = true;
    });
    if (t0 !== null) {
      if (now < waveEnd()) moving = true;
      else t0 = null;
    }
    return moving;
  });
  bag.add(B.unregister);

  let over = false;
  /** The pointer over the box (true) or gone (false): the lean, and on the way in the wave. */
  function feel(on) {
    if (on === over) return;
    over = on;
    const now = performance.now();
    cards.forEach((cd, i) => tset(cd.a, clamp(REST + (on ? LEAN * amt : 0), -20, 0), now, Math.abs(i - front) * LEAN_STAG));
    if (on && !reducedMotion() && (t0 === null || now > waveEnd() - WAVE_MS)) t0 = now;
    read.textContent = on ? "over" : "rest";
    B.wake();
  }

  bag.add(pointer(hover || stage, { move: () => feel(true), leave: () => feel(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return {
    set: (v) => {
      amt = v;
      if (!over) return;
      over = false;
      feel(true);
    },
    destroy: bag.dispose,
  };
}

export const STACK = {
  name: "stack",
  means: "A row of plain cards: the pointer sends one soft wave along it, and the row leans back a little while it stays.",
  rules: [1, 2, 5, 8],
  range: [0.3, 0.6, 1],
  tour: [[150, 210], [270, 110], null],
  mount,
};
