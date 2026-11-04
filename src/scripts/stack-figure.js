/* ============================================================
   The Resources dropdown's Free Tech Stacks preview (Nav.astro,
   stack-preview.js): GENERATED from source-assets/hairline/stack/stack.js
   by gen-site.mjs there. Edit that file, then run it again.
   ------------------------------------------------------------
  Stack: a row of plain cards standing upright on a guide, the Stack
  Diagnostic page's endless row in miniature. The card in the middle stands
  alone, the two stacks either side fanned a little away from it, each long
  enough to run on out of a box the figure is cropped by (2026-11-04: the
  cards carry no marks at all, and the row is thirteen long, not seven). The card
  nearest the pointer stands up and lifts; the ones behind it lean back and
  the ones in front lean forward, staggered outwards from it on the 700ms lift
  curve: a riffle through the row. The slider is how far they move.
  
  The pattern: discrete items, after the package's Riffle. Tweens, a stagger
  by distance, and a hit test on each card's resting centre along the row,
  so a card moving out from under the pointer cannot flip the choice.

   A Hairline figure (the hairline-create skill, .claude/skills/) on the
   vendored kernel, made after the package's Riffle (MIT, Lucas Marques).
   Colours: nav.css ("Resources tiles").
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";

const {
  Cam, clamp, fillet, fit, open, poly, proj, rad,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

// the cards: width, height, thickness, corner; where each stands along the
// row (two stacks of three, and the one in the middle with a gap either side)
const N = 13, W = 74, H = 47, TK = 1.5, R = 3.4;
const Y = [0, 13, 26, 39, 52, 65, 95, 125, 138, 151, 164, 177, 190], MID = 6;
// the rest lean of each card (degrees: negative leans back), the pulled
// card's lift, and how far the others lean away, at amount 1
const REST = [-13, -11.5, -10, -8.5, -7, -5.5, 0, 4, 5.5, 7, 8.5, 10, 11.5];
const LIFT = 9, BACK = -20, FWD = 15, STAG = 45;
// the guide the row stands on: from before the first card to past the last
const G0 = -24, G1 = 214;

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

  // fitted to the row in its widest poses, so nothing leaves the frame
  const C = Cam(45, 0.5, 1.2);
  const lean = (y, th, v, z = 0) => [0, y + v * Math.sin(rad(th)), v * Math.cos(rad(th)) + z];
  fit(C, [[0, G0, 0], [W, G1, 0], [W, Y[0], 0], lean(Y[0], BACK, H), lean(Y[N - 1], FWD, H), [W / 2, Y[MID], H + LIFT], [W, G0, 0]], 200, 160);
  const P = proj(C);
  const shape = fillet([[0, 0], [W, 0], [W, H], [0, H]], [R, R, R, R]);

  const g = mk("g", {}, svg);
  // the guide on the ground, under the row, running on past both ends
  mk("path", { d: open([P(W / 2, G0, 0), P(W / 2, G1, 0)]), class: "nf dash" }, g);

  const cards = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    cards.push({ back, face, a: tween(REST[i]), z: tween(0), drawn: "" });
  }
  // at rest, the card in the middle carries the one bright stroke
  cards[MID].face.classList.add("hi");

  function draw(i, th, lift) {
    const cd = cards[i], key = th.toFixed(3) + "," + lift.toFixed(3);
    if (cd.drawn === key) return;
    cd.drawn = key;
    const q = pose(P, i, shape, th, lift);
    cd.back.setAttribute("d", q.back);
    cd.face.setAttribute("d", q.face);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd, i) => {
      draw(i, tval(cd.a, now), tval(cd.z, now));
      if (!tdone(cd.a, now) || !tdone(cd.z, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  // the pick: the card whose RESTING middle is nearest the pointer across the
  // screen. The rest never moves, so a card riffling away cannot change it;
  // a point past either end picks the end card.
  const mids = Y.map((y, i) => P(W / 2, y + (H / 2) * Math.sin(rad(REST[i])), (H / 2) * Math.cos(rad(REST[i])))[0]);
  const hit = ([x]) => {
    let best = 0;
    mids.forEach((m, i) => { if (Math.abs(m - x) < Math.abs(mids[best] - x)) best = i; });
    return best;
  };

  let act = -1;
  /** Pulls card a (-1 lets them all go back); the stagger runs outwards from the card pulled, or the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    cards.forEach((cd, i) => {
      const delay = Math.abs(i - from) * STAG;
      const th = a < 0 ? REST[i] : i < a ? REST[i] + BACK * amt : i > a ? REST[i] + FWD * amt : 0;
      tset(cd.a, clamp(th, -32, 26), now, delay);
      tset(cd.z, a === i ? LIFT * amt : 0, now, delay);
      cd.face.classList.toggle("hi", a < 0 ? i === MID : i === a);
    });
    read.textContent = a < 0 ? "rest" : String(a + 1).padStart(2, "0");
    B.wake();
  }

  bag.add(pointer(hover || stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return {
    set: (v) => {
      amt = v;
      if (act < 0) return;
      const a = act;
      act = -1;
      setActive(a);
    },
    destroy: bag.dispose,
  };
}

export const STACK = {
  name: "stack",
  means: "A row of plain cards: the one nearest the pointer stands up, and the rest riffle away from it in turn.",
  rules: [1, 2, 5, 8],
  range: [0.3, 0.6, 1],
  tour: [[150, 210], [205, 150], [270, 110], null],
  mount,
};
