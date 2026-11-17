/* ============================================================
   A stack's sheet — what a stack opens on the Free Tech Stacks page
   (stack-diagnostic.astro, the dialog [data-stack-sheet]; styles:
   stack-space.css, "The stack's sheet"; opened by stack-space.js)
   ------------------------------------------------------------
   After the Workflow Workshop's folder documents (folder-docs.js): a
   native modal dialog, so the browser keeps the keyboard in it, closes it
   on Escape (handled here, to animate it) and gives the focus back after;
   the page behind dims a little and softens (a scrim with a fixed blur,
   only its opacity changed). Not one sheet of paper but a column of
   containers: the stack's title and what it is for; then its stages in
   order, each an open tool (the tool, its stage, what it does there and
   its alternatives) or a locked one (the stage's name and a lock: nothing
   else of it is on the page); the stack's note, where it has one; and the
   way into the ADDD app, where the whole stack is (the app's sign-up: the
   app enforces the access). The column scrolls in the whole window.

   The flight (2026-11-16, rebuilt). A stage's card becomes its container:
   one thing all the way from the row to the column and back.
   - What flies is a stand-in for each container, in a layer over the
     column (.sd-sheet__flight). The containers themselves are never
     moved, faded or restyled: they wait in the column, out of sight, and
     each is uncovered once its stand-in stands still exactly over it, the
     stand-in fading off it. (Animating the containers themselves made the
     browser draw their words one way while they moved and another once
     they stopped: every word in the sheet changed in a single frame as it
     settled. Measured 2026-11-16.)
   - Every stand-in has a playhead, 0 in the row and 1 in the column,
     moved by a critically damped spring towards whichever end it is sent
     to: quick to answer, long to settle, and it turns round smoothly if
     the sheet is closed while it opens. The pressed card's goes first, the
     others after it by how far they stand from it; going back, the
     farthest card first, so each lands in front of the one before.
   - Everything a stand-in shows is worked out from its playhead alone
     (place()), each frame, on the GSAP ticker, the same frame the row is
     drawn in: no timers, no keyframes to cut short, nothing handed from
     one clock to another.
       0 to P_LIFT    it rises out of the row (leaving, the whole stack
                      rises with the pressed card, as one piece);
       0 to P_FRONT   the stack comes to the front: its stand-ins, as one
                      picture, fade in over its cards, exactly where the
                      row draws them, so the card in front of the stack
                      gives way without a jump (most of the time the rise
                      alone has cleared it), and no card of the stack is
                      ever seen through another;
       P_GO to 1      it is carried to its place in the column;
       P_FRONT to 1   it turns to face the window, then takes the
                      container's size, corner and colour; the card's own
                      mark, name and role give way to the container's
                      words, the mark over the mark.
     Going back is the same read the other way: carried home, turned back
     into the card, set down behind the cards in front.
   - Where it comes from is a "source" (stack-space.js: the row's cards,
     or the list's rows): where each item stands, its size and plane, what
     it looks like, and a way to tell it how far each has gone.
   The nearer stand-ins stay over the farther all the way, as the cards
   are in the row. The title, the note and the way in have no card: their
   stand-ins come up where they stand, on playheads of their own. Under
   reduced motion it opens and closes at once.
   ============================================================ */
import { lenis } from "./scroll.js";
import { motion } from "./page.js";

// the springs (2026-11-16: a third slower, at the user's word): how fast a playhead goes (its natural frequency, per
// second), opening, closing, and the title's, the note's and the way in's
const RATE_OPEN = 6.8;
const RATE_CLOSE = 8.6;
const RATE_WORDS = 9;
// a stack far from the column takes a little longer than one beside it:
// the rate is divided by this, from the mean distance its cards go (px)
const paceOf = (far) => Math.min(1.25, Math.max(0.9, 0.7 + far / 2000));
// how long after the card before it each card starts (s): leaving, by how
// far it stands from the pressed one; going back, from the farthest
const STAGGER = 0.034;
const STAGGER_BACK = 0.026;
// a spring never quite arrives: this much of each end of a playhead is left
// out, so a stand-in is at rest in a known time (it is eased to a stop
// there, not cut off)
const TAIL = 0.012;
// along a playhead (see the head of the file)
const P_LIFT = 0.3;
const P_FRONT = 0.2;
const P_GO = 0.05;
// of the stretch from P_FRONT on: turned to face the window by P_TURN of
// it, growing from P_GROW of it
const P_TURN = 0.6;
const P_GROW = 0.12;
// a stand-in at rest over its container fades off it in SEAT_OUT s; before
// it leaves again, it fades back on in SEAT_IN s
const SEAT_OUT = 0.18;
const SEAT_IN = 0.045;
// the title and the close button come up this long after the press, the
// note and the way in this long after the last card has left (s); they
// rise this far (px)
const HEAD_AFTER = 0.4;
const FOOT_AFTER = 0.4;
const WORDS_RISE = 18;

const pad = (n) => String(n).padStart(2, "0");
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
// from a to b along x, 0 before and 1 after
const ramp = (x, a, b) => clamp01((x - a) / (b - a));
// a playhead as it is shown: its tails left out
const shownOf = (u) => clamp01((u - TAIL) / (1 - 2 * TAIL));
const rgbOf = (colour) => (colour.match(/[\d.]+/g) ?? [255, 255, 255]).slice(0, 3).map(Number);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
// a tool's initials, for the square kept for its mark
export function initialsOf(name) {
  const words = name.split(/[\s.]+/).filter(Boolean);
  if (words.length > 1 && !/^tech$/i.test(words[1])) return (words[0][0] + words[1][0]).toUpperCase();
  const caps = name.slice(1).match(/[A-Z]/);
  if (caps && /[a-z]/.test(name)) return (name[0] + caps[0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// A stand-in's state: its playhead (where it is, how fast it is going,
// where it is sent, and, while it waits its turn, where it will be sent
// and in how long), and how much of it covers its container when it
// stands over it.
const flier = (at) => ({ u: at, v: 0, goal: at, next: at, wait: null, cover: at ? 0 : 1 });
function send(p, goal, after) {
  p.next = goal;
  p.wait = after;
}
// One frame of it: a critically damped spring's own motion, exact for any
// frame length. In the column it stands still: it fades off its container
// once it has arrived, and back on before it leaves. False once it has
// nothing left to do.
function advance(p, rate, dt) {
  if (p.wait != null) {
    p.wait -= dt;
    if (p.wait > 0) return true;
    p.goal = p.next;
    p.wait = null;
  }
  if (p.u === 1) {
    if (p.goal === 1) {
      p.cover = Math.max(0, p.cover - dt / SEAT_OUT);
      return p.cover > 0;
    }
    p.cover = Math.min(1, p.cover + dt / SEAT_IN);
    if (p.cover < 1) return true;
  }
  p.cover = 1;
  if (p.u === p.goal) return false;
  const y = p.u - p.goal;
  const k = (p.v + rate * y) * dt;
  const e = Math.exp(-rate * dt);
  p.u = p.goal + (y + k) * e;
  p.v = (p.v - rate * k) * e;
  if (p.goal ? p.u >= 1 - TAIL : p.u <= TAIL) {
    p.u = p.goal;
    p.v = 0;
    return p.goal === 1;
  }
  return true;
}

export function mountStackSheet(dialog, data) {
  // the sheet's words, from the page document in Sanity (sheet.*, passed
  // with the data), each falling back to the words it was built with; in
  // a sentence {n} is a number, {stage} "stage" or "stages" to go with it,
  // and {stack} the stack's name
  const WORDS = {
    kicker: "Stack · {n} stages",
    lockedCount: "{n} locked",
    allOpen: "All open",
    locked: "Locked",
    lockedLink: "Access the Free Tech Stack",
    alternatives: "Alternatives:",
    noteLabel: "Note",
    unlockTitle: "Unlock the full stack",
    unlockText: "The {n} locked {stage} of {stack}, with each tool, what it does and its alternatives, are in the ADDD app. Sign up, or sign in, to see the whole stack.",
    openTitle: "See it in the ADDD app",
    openText: "The whole of {stack} is in the ADDD app. Sign up, or sign in, to see it.",
  };
  const say = (key, values = {}) =>
    (data.words?.[key] || WORDS[key]).replace(/[{]([a-zA-Z]+)[}]/g, (all, name) => (name in values ? String(values[name]) : all));
  const scrim = dialog.querySelector(".sd-sheet__scrim");
  const frameEl = dialog.querySelector(".sd-sheet__frame");
  const scroller = dialog.querySelector("[data-sheet-scroll]");
  const column = dialog.querySelector("[data-sheet-column]");
  const closer = dialog.querySelector(".sd-sheet__close");
  const ctaTemplate = dialog.querySelector("template[data-sheet-cta]");
  const lockTemplate = dialog.querySelector("template[data-sheet-lock]");
  // "closed", "opening", "open" or "closing"
  let state = "closed";
  // what the stack came out of, and what to call once it is back in it
  let source = null;
  let done = null;
  // the stand-ins in the air (null while the sheet is closed or at rest)
  let flight = null;
  // the column's own Lenis while the sheet is open and at rest
  let own = null;
  const rafOwn = (time) => own?.raf(time * 1000);

  // ---- the containers ------------------------------------------------
  // one for each part of a stack, each marked with what it is: "head", a
  // stage's index, "note" or "cta"
  function build(g) {
    column.replaceChildren();
    const total = g.stages.length;
    const held = g.stages.filter((s) => s.locked).length;
    const head = el("section", "sd-sheet__card is--head");
    head.dataset.slot = "head";
    if (g.tone) {
      head.style.setProperty("--sheet-tone", g.tone.ground);
      head.style.setProperty("--sheet-tone-ink", g.tone.ink);
    }
    const kicker = el("p", "sd-sheet__kicker");
    kicker.append(el("span", null, say("kicker", { n: total })), el("span", null, held ? say("lockedCount", { n: held }) : say("allOpen")));
    const title = el("h2", "sd-sheet__title", g.name);
    title.id = "sd-sheet-title";
    head.append(kicker, title);
    if (g.summary) head.append(el("p", "sd-sheet__summary", g.summary));
    column.append(head);

    g.stages.forEach((s, i) => {
      const card = el("section", `sd-sheet__card ${s.locked ? "is--locked" : "is--tool"}`);
      card.dataset.slot = String(i);
      const top = el("div", "sd-sheet__tool-head");
      const mark = el("span", "sd-sheet__mark");
      mark.setAttribute("aria-hidden", "true");
      const names = el("div", "sd-sheet__names");
      const n = el("span", "sd-sheet__n", `${pad(i + 1)}/${pad(total)}`);
      top.append(mark, names, n);
      card.append(top);
      column.append(card);
      if (s.locked) {
        // a stage held back: its name, a lock, and nothing of its tool;
        // "Locked", and the way in as a link (the same place the Free
        // Stack and the way in at the foot lead to)
        mark.classList.add("is--lock");
        if (lockTemplate) mark.append(lockTemplate.content.cloneNode(true));
        const line = el("p", "sd-sheet__locked");
        const link = el("a", "sd-sheet__locked-link", say("lockedLink"));
        link.href = g.url || data.signUp;
        link.target = "_blank";
        link.rel = "noopener";
        line.append(el("span", "sd-sheet__locked-word", say("locked")), link);
        names.append(el("p", "sd-sheet__role", s.stage), line);
        return;
      }
      if (s.logo) {
        const img = document.createElement("img");
        img.src = s.logo;
        img.alt = "";
        mark.append(img);
        mark.classList.add("is--logo");
      } else mark.textContent = initialsOf(s.tool);
      names.append(el("p", "sd-sheet__role", s.stage), el("h3", "sd-sheet__name", s.tool));
      card.append(el("p", "sd-sheet__desc", s.does));
      // its alternatives in one quiet line under what it does
      if (s.alternatives?.length) card.append(el("p", "sd-sheet__alt", `${say("alternatives")} ${s.alternatives.join(", ")}`));
    });

    if (g.note) {
      const note = el("section", "sd-sheet__card is--note");
      note.dataset.slot = "note";
      note.append(el("p", "sd-sheet__note-label", say("noteLabel")), el("p", "sd-sheet__note", g.note));
      column.append(note);
    }

    // the way in
    const cta = el("section", "sd-sheet__card is--cta");
    cta.dataset.slot = "cta";
    cta.append(el("h3", "sd-sheet__cta-title", held ? say("unlockTitle") : say("openTitle")));
    cta.append(el("p", "sd-sheet__cta-text", held > 0
      ? say("unlockText", { n: held, stage: held === 1 ? "stage" : "stages", stack: g.name })
      : say("openText", { stack: g.name })));
    if (ctaTemplate) {
      const button = ctaTemplate.content.cloneNode(true);
      const link = button.querySelector("a");
      if (link) link.href = g.url || data.signUp;
      cta.append(button);
    }
    column.append(cta);
  }
  const stageOf = (card) => (/^\d+$/.test(card.dataset.slot ?? "") ? Number(card.dataset.slot) : null);

  // ---- the flight ----------------------------------------------------
  // Into the air: every container measured where it stands in the column
  // (all read first, then all written) and given a stand-in, a copy of
  // itself in the layer over the column, at the end it starts from. A
  // stage's stand-in is a surface holding that copy and what the source
  // has it wear as a card. Nothing is sent anywhere yet (depart()).
  function takeoff(opening) {
    const src = source;
    src.begin(opening);
    const at = opening ? 0 : 1;
    const read = [...column.children].map((card) => {
      const i = stageOf(card);
      const look = getComputedStyle(card);
      return {
        card,
        i: i != null && i < src.count ? i : null,
        R: card.getBoundingClientRect(),
        look: { ground: rgbOf(look.backgroundColor), r: parseFloat(look.borderTopLeftRadius) || 0 },
        mark: card.querySelector(".sd-sheet__mark")?.getBoundingClientRect(),
      };
    });
    const layer = el("div", "sd-sheet__flight");
    layer.inert = true;
    layer.setAttribute("aria-hidden", "true");
    // the stages' stand-ins together, over the others: one picture, to
    // come to the front as one (render())
    const deck = el("div", "sd-sheet__deck");
    const veiled = src.veil() > 0.002;
    const items = [];
    const words = [];
    for (const { card, i, R, look, mark } of read) {
      if (!R.width || !R.height) continue;
      const ghost = card.cloneNode(true);
      ghost.removeAttribute("data-slot");
      ghost.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      ghost.style.width = `${R.width}px`;
      const fly = el("div", "sd-sheet__fly");
      const one = { card, fly, R, p: flier(at), shown: -1, alpha: -1, away: null, under: -1 };
      (i == null ? layer : deck).append(fly);
      if (i == null) {
        // the title, the note, the way in: the copy as it is
        fly.append(ghost);
        words.push(Object.assign(one, { foot: card.dataset.slot !== "head" }));
        continue;
      }
      const surface = el("div", "sd-sheet__fly-surface");
      const face = src.face(i);
      const it = Object.assign(one, { i, surface, ghost, look, box: src.box(i), shape: -1, up: -1, covered: null, scrolled: 0, shade: 0, face: null, band: null, edge: null, veil: null, grow: 1, ox: 0, oy: 0 });
      // the nearer over the farther
      fly.style.zIndex = String(100 - i);
      surface.append(ghost);
      if (face?.top) {
        it.face = face.top;
        face.top.classList.add("sd-sheet__face");
        surface.append(face.top);
        // its mark ends over the container's own
        if (face.mark && mark) {
          it.grow = mark.width / face.mark.size;
          it.ox = mark.left - R.left - face.mark.x * it.grow;
          it.oy = mark.top - R.top - face.mark.y * it.grow;
        }
      }
      if (face?.band) {
        it.band = el("span", "sd-sheet__band");
        it.band.style.height = `${face.band.h}px`;
        it.band.style.background = face.band.colour;
        const line = el("i");
        Object.assign(line.style, { left: `${face.band.inset}px`, right: `${face.band.inset}px`, background: face.band.line });
        it.band.append(line);
        if (face.foot) it.band.append(face.foot);
        surface.append(it.band);
      }
      if (face?.edge) {
        it.edge = el("i", "sd-sheet__edge");
        it.edge.style.boxShadow = `inset 0 0 0 1px ${face.edge}`;
        surface.append(it.edge);
      }
      if (veiled) {
        it.veil = el("i", "sd-sheet__veil");
        it.veil.style.background = src.veilColour;
        surface.append(it.veil);
      }
      fly.append(surface);
      items.push(it);
    }
    // how far its cards go, for its pace
    const B = src.basis;
    const far = items.reduce((sum, it) => {
      const [x, y] = src.at(it.i, 0);
      return sum + Math.hypot(it.R.left + it.R.width / 2 - x - (B[0] * it.box.w + B[2] * it.box.h) / 2, it.R.top + it.R.height / 2 - y - (B[1] * it.box.w + B[3] * it.box.h) / 2);
    }, 0) / Math.max(1, items.length);
    layer.append(deck);
    // (scrolled: how far the column has been scrolled since, each frame)
    flight = { layer, deck, items, words, closer: flier(at), lift: flier(at), pace: paceOf(far), veil: -1, front: -1, from: scroller.scrollTop, scrolled: 0 };
    // going back, the column is held where it is
    dialog.classList.toggle("is--leaving", !opening);
    render();
    frameEl.append(layer);
    gsap.ticker.add(frame);
    window.addEventListener("resize", arrive);
  }
  // Sent: to the column (the pressed card's first), or back to the row
  // (the farthest first). From wherever each playhead is.
  function depart(opening) {
    const { items, words } = flight;
    const last = Math.max(0, ...items.map((it) => it.i));
    const origin = source.origin ?? 0;
    let latest = 0;
    for (const it of items) {
      const after = opening ? Math.abs(it.i - origin) * STAGGER : (last - it.i) * STAGGER_BACK;
      latest = Math.max(latest, after);
      send(it.p, opening ? 1 : 0, after);
    }
    for (const w of words) send(w.p, opening ? 1 : 0, opening ? (w.foot ? latest + FOOT_AFTER : HEAD_AFTER) : 0);
    send(flight.closer, opening ? 1 : 0, opening ? HEAD_AFTER : 0);
    // the stack's rise as one piece: with the first card to leave, and out
    // of the way at once when it is sent back (each card is then set down
    // on its own)
    send(flight.lift, opening ? 1 : 0, 0);
  }

  // A stand-in and its container, as far as the stand-in's playhead has
  // it: the stand-in as strong as `alpha` (and, once it stands over its
  // container, no more than still covers it), the container out of sight
  // until then, with `shadow` of its shadow under it.
  function show(one, alpha, shadow) {
    const a = alpha * one.p.cover;
    if (a !== one.alpha) {
      one.alpha = a;
      one.fly.style.opacity = a.toFixed(3);
    }
    const away = one.shown < 1;
    if (away !== one.away) {
      one.away = away;
      one.card.classList.toggle("is--away", away);
    }
    if (shadow !== one.under) {
      one.under = shadow;
      one.card.style.setProperty("--k", shadow.toFixed(3));
    }
  }
  // A stage's stand-in where its playhead has it: between its card (the
  // source's: where it stands, risen, on the row's plane, at the card's
  // size) and its container's place in the column (flat on the window, at
  // the container's size). Its plane, its size and its middle each go from
  // the one to the other; its top-left corner follows from them.
  function place(it, covered, lead, scrolled) {
    const u = shownOf(it.p.u);
    // risen with the stack as it leaves, if that is further than its own
    const up = Math.max(u, lead);
    if (u === it.shown && up === it.up && covered === it.covered && scrolled === it.scrolled) return show(it, 1, it.shade);
    it.shown = u;
    it.up = up;
    it.covered = covered;
    it.scrolled = scrolled;
    const src = source;
    const { R, box } = it;
    const rise = smooth(up / P_LIFT);
    const carry = smooth((u - P_GO) / (1 - P_GO));
    // it turns to face the window first, and grows into the container's
    // size as it finishes turning: a wide container is never seen aslant
    const changing = (u - P_FRONT) / (1 - P_FRONT);
    const turn = smooth(changing / P_TURN);
    const shape = smooth((changing - P_GROW) / (1 - P_GROW));
    const B = src.basis;
    const [x0, y0] = src.at(it.i, rise);
    const ax = mix(B[0], 1, turn);
    const ay = mix(B[1], 0, turn);
    const bx = mix(B[2], 0, turn);
    const by = mix(B[3], 1, turn);
    const w = mix(box.w, R.width, shape);
    const h = mix(box.h, R.height, shape);
    // the card's middle, and how far towards the container's it is carried
    const mx = x0 + (B[0] * box.w + B[2] * box.h) / 2;
    const my = y0 + (B[1] * box.w + B[3] * box.h) / 2;
    const dx = (R.left + R.width / 2 - mx) * carry;
    const dy = (R.top - scrolled + R.height / 2 - my) * carry;
    const tx = mx + dx - (ax * w + bx * h) / 2;
    const ty = my + dy - (ay * w + by * h) / 2;
    // the row's own card: there, risen and carried as far, until the
    // stack's stand-ins are fully over its cards
    src.hold(it.i, rise, dx, dy, covered);
    it.fly.style.transform = `matrix(${ax.toFixed(5)},${ay.toFixed(5)},${bx.toFixed(5)},${by.toFixed(5)},${tx.toFixed(2)},${ty.toFixed(2)})`;
    it.shade = smooth(ramp(shape, 0.7, 1));
    show(it, 1, it.shade);
    if (shape === it.shape) return;
    it.shape = shape;
    // its ground: the card's size, corner and colour to the container's
    const g = it.surface.style;
    g.width = `${w.toFixed(2)}px`;
    g.height = `${h.toFixed(2)}px`;
    g.borderRadius = `${mix(box.r, it.look.r, shape).toFixed(2)}px`;
    g.backgroundColor = `rgb(${box.ground.map((v, k) => Math.round(mix(v, it.look.ground[k], shape))).join(",")})`;
    // the card's face gives way to the container's words, its mark going
    // to where theirs is; its band goes first, its edge last (the cards
    // have no shadows: the edge is what parts them while they overlap)
    it.ghost.style.opacity = ramp(shape, 0.5, 0.85).toFixed(3);
    if (it.face) {
      it.face.style.opacity = (1 - ramp(shape, 0.25, 0.6)).toFixed(3);
      it.face.style.transform = `translate(${(it.ox * shape).toFixed(2)}px,${(it.oy * shape).toFixed(2)}px) scale(${mix(1, it.grow, shape).toFixed(4)})`;
    }
    if (it.band) it.band.style.opacity = (1 - ramp(shape, 0.04, 0.4)).toFixed(3);
    if (it.edge) it.edge.style.opacity = (1 - ramp(shape, 0.6, 1)).toFixed(3);
  }
  // everything in the air, where its playhead has it
  function render() {
    const { items, words } = flight;
    let low = 1;
    let high = 0;
    for (const it of items) {
      const u = shownOf(it.p.u);
      low = Math.min(low, u);
      high = Math.max(high, u);
    }
    // The stack at the front: its stand-ins fade in together, as one
    // picture, over the row's own drawing of the same cards in the same
    // places, while the furthest gone is still only rising and being
    // carried (none has begun to change shape before P_FRONT). Coming
    // back, the same once the last of them is that near home.
    const front = source.solid ? Math.ceil(high) : clamp01(high / P_FRONT);
    const lead = shownOf(flight.lift.u);
    // the column can be scrolled while they arrive: its places move, the
    // row's do not
    const scrolled = scroller.scrollTop - flight.from;
    const moved = scrolled !== flight.scrolled;
    flight.scrolled = scrolled;
    for (const it of items) place(it, front >= 1, lead, scrolled);
    if (front !== flight.front) {
      flight.front = front;
      flight.deck.style.opacity = front >= 1 ? "" : front.toFixed(3);
    }
    // the row, with its cards where the stand-ins have them
    source.commit();
    // a stack not yet the one read brightens as it does in the row
    const veil = source.veil();
    if (veil !== flight.veil) {
      flight.veil = veil;
      for (const it of items) if (it.veil) it.veil.style.opacity = veil.toFixed(3);
    }
    // the title, the note, the way in: up into their places
    for (const w of words) {
      const u = shownOf(w.p.u);
      if (u !== w.shown || moved) {
        w.shown = u;
        w.fly.style.transform = `translate(${w.R.left.toFixed(2)}px,${(w.R.top - scrolled + (1 - u) * WORDS_RISE).toFixed(2)}px)`;
      }
      show(w, u, u);
    }
    closer.style.opacity = shownOf(flight.closer.u).toFixed(3);
    // The page behind dims and softens once the last card is out of the
    // row, and is clear again before the first is back in it: the scrim's
    // blur then lies over a row that is not changing, and is worked out
    // once (over cards still moving it was worked out again every frame:
    // measured, frames of 200ms and more).
    scrim.style.opacity = smooth((low - P_LIFT) / 0.5).toFixed(3);
  }
  // one frame: the playheads moved on, everything put where they have it,
  // and, once all are at rest, the flight over. A frame that came late
  // counts as a short one, so nothing jumps to catch up.
  function frame(_time, deltaMs) {
    if (!flight) return;
    const dt = Math.min(deltaMs, 34) / 1000;
    const back = state === "closing";
    const rate = (back ? RATE_CLOSE : RATE_OPEN) / flight.pace;
    const wordsRate = back ? RATE_WORDS * 2 : RATE_WORDS;
    let moving = false;
    for (const it of flight.items) moving = advance(it.p, rate, dt) || moving;
    for (const w of flight.words) moving = advance(w.p, wordsRate, dt) || moving;
    moving = advance(flight.closer, wordsRate, dt) || moving;
    advance(flight.lift, back ? rate * 2 : rate, dt);
    render();
    if (!moving) land();
  }
  // straight to where everything is going (the window resized mid-flight:
  // the places measured at take-off no longer hold)
  function arrive() {
    if (!flight) return;
    for (const p of [...flight.items, ...flight.words].map((x) => x.p).concat(flight.closer, flight.lift)) {
      p.u = p.goal = p.wait != null ? p.next : p.goal;
      p.v = 0;
      p.wait = null;
      p.cover = 0;
    }
    render();
    land();
  }
  // out of the air: the stand-ins gone, the containers as they always were
  function land() {
    const f = flight;
    flight = null;
    gsap.ticker.remove(frame);
    window.removeEventListener("resize", arrive);
    f.layer.remove();
    for (const one of [...f.items, ...f.words]) {
      one.card.classList.remove("is--away");
      one.card.style.removeProperty("--k");
    }
    closer.style.removeProperty("opacity");
    scrim.style.removeProperty("opacity");
    dialog.classList.remove("is--leaving");
    if (state === "opening") rest();
    else if (state === "closing") finish();
  }

  // ---- open and closed -------------------------------------------------
  // open and at rest: its cards out of the row
  function rest() {
    state = "open";
    source.end(true);
  }
  // the column scrolls on a Lenis of its own, as the page does, its frames
  // from the GSAP ticker: from the moment the sheet opens (the stand-ins
  // follow it: render()) until it is sent back
  function scrolls() {
    own = new Lenis({ wrapper: scroller, content: column, lerp: motion.reduced ? 1 : 0.08 });
    gsap.ticker.add(rafOwn);
  }
  function still() {
    gsap.ticker.remove(rafOwn);
    own?.destroy();
    own = null;
  }
  // closed: the cards back in the row, the dialog gone, the page as it
  // was, the row told
  function finish() {
    if (flight) {
      state = "closed";
      land();
    }
    state = "closed";
    still();
    if (dialog.open) dialog.close();
    column.replaceChildren();
    source?.end(false);
    source = null;
    lenis?.start();
    const then = done;
    done = null;
    then?.();
  }

  function open(g, onClosed, from) {
    if (state !== "closed" || !from) return;
    cool();
    done = onClosed;
    source = from;
    build(g);
    lenis?.stop();
    dialog.showModal();
    scroller.scrollTop = 0;
    scroller.focus({ preventScroll: true });
    scrolls();
    if (motion.reduced) {
      source.begin(true);
      for (let i = 0; i < source.count; i++) source.hold(i, 1, 0, 0, true);
      rest();
      return;
    }
    state = "opening";
    takeoff(true);
    depart(true);
  }
  function close() {
    if (state === "closed" || state === "closing") return;
    if (motion.reduced) return finish();
    // from rest, into the air again; mid-opening, round from where it is
    still();
    if (state === "open") takeoff(false);
    else dialog.classList.add("is--leaving");
    state = "closing";
    depart(false);
  }

  // ---- the warm-up -----------------------------------------------------
  // The first opening after the page came held two or three frames (the
  // GPU drawing the dialog, its blur, the containers' words and the cards'
  // faces for the first time). So once the page is idle, the real dialog
  // is opened once with a stack's sheet in it, part-way through its
  // flight, all but invisible and untouchable, for a few frames, then
  // closed, the focus back where it was. Nothing of the row is touched.
  let warmed = false;
  let cool = () => {};
  function warm(g, from) {
    if (warmed || motion.reduced || state !== "closed" || !g || !from) return;
    warmed = true;
    const back = document.activeElement;
    build(g);
    dialog.classList.add("is--warming");
    try {
      dialog.showModal();
    } catch {
      dialog.classList.remove("is--warming");
      column.replaceChildren();
      return;
    }
    from.begin(true);
    source = { count: from.count, basis: from.basis, box: (i) => from.box(i), at: (i, rise) => from.at(i, rise), face: (i) => from.face(i), veil: () => 0, begin() {}, hold() {}, commit() {}, end() {} };
    takeoff(true);
    gsap.ticker.remove(frame);
    window.removeEventListener("resize", arrive);
    for (const p of [...flight.items, ...flight.words].map((x) => x.p)) p.u = 0.6;
    render();
    let frames = 0;
    let timer = 0;
    cool = () => {
      cancelAnimationFrame(timer);
      cool = () => {};
      flight.layer.remove();
      flight = null;
      source = null;
      dialog.close();
      column.replaceChildren();
      for (const node of [closer, scrim]) node.removeAttribute("style");
      dialog.classList.remove("is--warming", "is--leaving");
      back?.focus?.({ preventScroll: true });
    };
    const step = () => {
      if (++frames < 4) timer = requestAnimationFrame(step);
      else cool();
    };
    timer = requestAnimationFrame(step);
  }

  const onClose = () => close();
  const onCancel = (e) => {
    e.preventDefault();
    close();
  };
  const onClosedByBrowser = () => {
    if (state !== "closed") finish();
  };
  const closers = [...dialog.querySelectorAll("[data-sheet-close]")];
  closers.forEach((b) => b.addEventListener("click", onClose));
  // a click on the blurred page behind the column closes it too: the
  // column's scroller covers the whole window, and over the scrim it is
  // what a click there lands on; only a click on no container counts
  // (only once it is open: a second click, or a double-click, on the stack
  // while it was still opening landed here and sent it straight back)
  const onBackdrop = (e) => {
    if (state === "open" && (e.target === scroller || e.target === column)) close();
  };
  scroller.addEventListener("click", onBackdrop);
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("close", onClosedByBrowser);

  return {
    open,
    close,
    warm,
    destroy() {
      cool();
      if (state !== "closed") finish();
      closers.forEach((b) => b.removeEventListener("click", onClose));
      scroller.removeEventListener("click", onBackdrop);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClosedByBrowser);
    },
  };
}
