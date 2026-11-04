/* ============================================================
   Stack space — the Free Tech Stacks page's one screen
   (stack-diagnostic.astro; styles: stack-space.css; the data:
   src/data/stack-ecosystem.ts and the Studio's tech stacks; the sheet a
   stack opens: stack-sheet.js)
   ------------------------------------------------------------
   Every card is one piece of software, standing upright in one long row
   seen from above at an angle with no perspective (an isometric view),
   the row running up across the screen from off its bottom-left corner
   to off its top-right; the card at the reading position stands alone in
   the middle, its neighbours fanned into the two runs either side. The
   row has no ends: it goes round (each card at its slot less the reading
   position, wrapped round the number of cards), so moving through it
   never meets a last card. (Third pass, 2026-11-04: back to this one
   continuous row, after a pass that set each stack apart as a deck.)

   Stacks in the row: a curated stack's cards stand together, one after
   another at the row's own spacing, in a tone of their own (the stacks
   alternate between two, the software in no stack a third), with a
   dotted bracket on the ground beside them, the stack's name at its near
   end. A stack's named tools carry their names; the rest of it, held back
   until the visitor is in the ADDD app, are cards with a lock and no
   name: the row shows how big each stack is without saying what is in it
   (the site never has more than its preview).

   Choosing: any card of a stack (or the stack's name in the list) chooses
   the stack: the row glides to it, its cards open out from one another
   and lift, one after the next, the rest of the row paling, and the
   stack's sheet opens over the page (stack-sheet.js: its title, its named
   tools each in a container of its own, the rest locked, and the way into
   the app); closed, the cards settle back into the row. A card in no
   stack only answers the pointer.

   How it is built, for speed:
   - One canvas draws the whole row, back to front, each card on its own
     plane (an affine transform per card): one layer and one pass.
   - Every face (a tool's, a locked card's, in its tone, with its soft
     shadow round it: the cards have no outlines) is painted once into an
     atlas whenever the cards change size or the fonts come; each frame
     places it with one image drawn. The stacks' names, likewise, from an
     atlas of their own.
   - Everything moves from a few numbers eased each frame on the GSAP
     ticker: the reading position, the fan, the stack opening out, and per
     card its paling and the hover's lift, lean and parting. The loop
     sleeps as soon as nothing is moving and wakes on input; while the
     sheet is open it is asleep.
   - The pointer is tested against each card's resting shape, front to
     back, in plain arithmetic: no layout is read while it moves.
   Under reduced motion everything still works, without the fan, the lean
   or the sheet's motion. Listeners, the loop and the observer go with the
   page.
   ============================================================ */
import { motion, registerPageCleanup } from "./page.js";
import { mountStackSheet } from "./stack-sheet.js";

const R2 = Math.SQRT1_2;
// the cards: width as a share of the screen's (held between a least and a
// most, px), height to width, and the corners' radius (card widths)
const CARD_SHARE = 0.2;
// under 992px wide (a tablet, a phone) a larger share, so the faces read
const CARD_SHARE_SMALL = 0.25;
const CARD_MIN = 140;
const CARD_MAX = 400;
const CARD_RATIO = 0.64;
const RADIUS = 0.018;
// the row: about this many cards across the screen's diagonal at rest,
// never closer than SPACING_MIN card widths; the gap either side of the
// card in the middle; how much the fan widens the row at speed
const VISIBLE = 18;
const SPACING_MIN = 0.22;
const GAP = 0.6;
const FAN = 0.9;
const FAN_SPEED = 16; // cards per second for the full fan
// a stack chosen: its cards this far apart (card widths), how near the
// middle it must be (slots past its ends) before it opens out, how high
// its cards lift (share of their height), one after the next (ms apart),
// and how long after the choice the sheet opens (ms)
const GROUP_SP = 0.5;
const GROUP_REACH = 3;
const SEL_LIFT = 0.1;
const SEL_STAGGER = 45;
const SHEET_AFTER = 430;
// where the row leaves the screen: this share of the width in from the
// bottom-left and the top-right corners
const CORNER_IN = 0.07;
// the hover: the card lifts (share of its height), its neighbours lean
// away (deg) and part (card widths), the nearest most
const LIFT = 0.16;
const LEAN = 7;
const PART = 0.07;
const REACH = 2;
// the wheel: px to a card; after a pause, the row settles on a card (ms)
const WHEEL_STEP = 90;
const SETTLE_MS = 140;
// easing rates, per second
const RATE_POS = 12;
const RATE_FAN = 5;
const RATE_HOVER = 12;
const RATE_PALE = 7;
const RATE_GROUP = 6;
// the face: its margin, the logo's square, the gap to the name, the name's
// size (card widths); the shadow round a card (its reach and blur, card
// widths, and its ink)
const FACE_M = 0.055;
const FACE_LOGO = 0.13;
const FACE_GAP = 0.045;
const FACE_NAME = 0.068;
const SHADOW = 0.09;
const SHADOW_BLUR = 0.045;
const SHADOW_INK = "rgba(20, 20, 16, 0.16)";
// the bracket beside a stack: how far out from the cards' edge it runs and
// how long its ends turn in (card widths), its dots' spacing (px)
const BRACKET_X = 0.11;
const BRACKET_END = 0.06;
const BRACKET_DOT = 5;
// colours: the stacks' two tones and the third for software in no stack,
// the ground (a paled card takes it on: stack-space.css's --sd-ground)
const TONES = ["#ffffff", "#e8e8e4"];
const TONE_FREE = "#f2f2ef";
const GROUND = [220, 220, 216];
const PALE_COVER = 0.72;
const LOGO_GROUND = "rgba(10, 10, 10, 0.06)";
const INK = "10, 10, 10";
// the SVG Collection's lock (no. 026, dash-type-btn__locked, 18 × 18)
const LOCK = [
  "M12.75 15.75H5.25C4.42125 15.75 3.75 15.0787 3.75 14.25V9C3.75 8.17125 4.42125 7.5 5.25 7.5H12.75C13.5788 7.5 14.25 8.17125 14.25 9V14.25C14.25 15.0787 13.5788 15.75 12.75 15.75Z",
  "M6 7.5V5.25C6 3.59325 7.34325 2.25 9 2.25C10.6567 2.25 12 3.59325 12 5.25V7.5",
];

const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
const softplus = (x, k = 6) => (x > 6 ? x : Math.log1p(Math.exp(k * x)) / k);
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// a tool's initials, for the square reserved for its logo
export function initialsOf(name) {
  const words = name.split(/[\s.]+/).filter(Boolean);
  if (words.length > 1 && !/^tech$/i.test(words[1])) return (words[0][0] + words[1][0]).toUpperCase();
  const caps = name.slice(1).match(/[A-Z]/);
  if (caps && /[a-z]/.test(name)) return (name[0] + caps[0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function initStackSpace(container) {
  container.querySelectorAll("[data-stack-space]").forEach((root) => {
    if (root.stackSpace) return;
    const stage = root.querySelector("[data-stack-stage]");
    const canvas = stage?.querySelector("canvas");
    const dataEl = root.querySelector("[data-stack-data]");
    if (!stage || !canvas || !dataEl) return;
    const ctx = canvas.getContext("2d");
    const reduced = motion.reduced;
    const live = root.querySelector("[data-stack-live]");
    const goes = [...root.querySelectorAll("[data-stack-go]")];
    const css = getComputedStyle(root);
    const fonts = {
      display: css.getPropertyValue("--font-display").trim() || "sans-serif",
      mono: css.getPropertyValue("--font-mono").trim() || "monospace",
    };

    // ---- the data: the stacks, then the software in none ------------------
    // Each stack's cards stand together in the row, its named tools first
    // and then one locked card for each tool held back; then every tool of
    // the inventory that no stack names, in the inventory's order. A tool
    // named by two stacks stands in each: a card belongs to the stack it
    // stands in, which is the one it opens.
    const data = JSON.parse(dataEl.textContent);
    const groups = (data.stacks ?? []).map((s, i) => ({ ...s, index: i, tone: TONES[i % TONES.length], hov: 0, sel: 0 }));
    const cards = [];
    groups.forEach((g) => {
      g.a = cards.length;
      g.preview.forEach((t) => cards.push({ kind: "tool", name: t.name, category: t.category, logo: t.logo, group: g }));
      for (let k = g.preview.length; k < g.toolCount; k++) cards.push({ kind: "locked", group: g });
      g.b = cards.length - 1;
    });
    const named = new Set(groups.flatMap((g) => g.preview.map((t) => t.name.toLowerCase())));
    data.tools.filter((t) => !named.has(t.name.toLowerCase())).forEach((t) => cards.push({ kind: "tool", name: t.name, category: t.category, logo: t.logo, group: null }));
    const N = cards.length;
    if (!N) return;
    root.stackSpace = true;
    cards.forEach((c, i) => {
      c.slot = i;
      c.initials = c.name ? initialsOf(c.name) : "";
      c.tone = c.group ? c.group.tone : TONE_FREE;
      Object.assign(c, { pale: 0, paleT: 0, lift: 0, lean: 0, part: 0, nameScale: 1, image: null, liftAt: 0 });
    });
    cards.forEach((c) => {
      if (!c.logo) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        c.image = img;
        if (view.face) paintFaces();
        wake();
      };
      img.src = c.logo;
    });
    const wrap = (d) => d - N * Math.round(d / N);

    let pos = 0;
    let target = 0;
    let fan = 0;
    let hover = null;
    // the stack chosen (its sheet open, or opening), and its cards' slots
    // opened out from one another (0 to 1)
    let chosen = null;
    const gather = { start: 0, end: 0, amount: 0, to: 0 };
    let sheetTimer = 0;

    // ---- the view: the screen's size, the angle, the card, the row -------
    const view = {};
    function measure() {
      const r = { width: stage.clientWidth, height: stage.clientHeight };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.w = r.width;
      view.h = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      view.dpr = dpr;
      view.rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      // the row's angle: through the middle, from CORNER_IN in from the
      // bottom-left to CORNER_IN in from the top-right
      const tan = Math.min(Math.tan((40 * Math.PI) / 180), Math.max(Math.tan((24 * Math.PI) / 180), r.height / (r.width * (1 - 2 * CORNER_IN))));
      view.sinE = tan;
      view.cosE = Math.sqrt(1 - tan * tan);
      view.cw = Math.min(CARD_MAX, Math.max(CARD_MIN, r.width * (r.width < 992 ? CARD_SHARE_SMALL : CARD_SHARE)));
      view.ch = view.cw * CARD_RATIO;
      view.cx = r.width / 2;
      view.cy = r.height / 2;
      view.along = R2 * Math.sqrt(1 + tan * tan);
      view.half = Math.hypot(r.width, r.height) / 2;
      // the spacing that puts VISIBLE cards across the diagonal, the end
      // ones at the corners, so the row always runs on past both
      const reach = view.half / view.along - view.cw * GAP;
      view.sp = Math.max(view.cw * SPACING_MIN, (2 * reach) / (VISIBLE - 1));
      // each name's size, shrunk where a long one would run off its card
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = `400 ${view.cw * FACE_NAME}px ${fonts.display}`;
      const room = view.cw * (1 - 2 * FACE_M - FACE_LOGO - FACE_GAP);
      cards.forEach((c) => (c.nameScale = c.name ? Math.min(1, room / Math.max(1, ctx.measureText(c.name).width)) : 1));
      paintFaces();
      paintLabels();
    }
    const P = (x, y, z) => [view.cx + (x - y) * R2, view.cy + (x + y) * R2 * view.sinE - z * view.cosE];

    // how near the middle the chosen stack stands (0 to 1), and its ends
    // and middle relative to the reading position
    function groupAt() {
      if (!gather.amount) return null;
      const a = wrap(gather.start - pos);
      const b = a + (gather.end - gather.start);
      const c = (a + b) / 2;
      const off = Math.max(0, Math.abs(c) - (b - a) / 2 - 1);
      return { a, b, c, near: gather.amount * smooth(1 - off / GROUP_REACH) };
    }
    // where a card at d (its slot less the reading position) stands along
    // the row: the runs either side, a gap round the middle (or round the
    // chosen stack, its cards opened out, when it is there), widened by the
    // fan
    function along(d, g = groupAt()) {
      const sp = view.sp * (1 + FAN * fan);
      const gap = view.cw * GAP;
      const near = g ? g.near : 0;
      let s = d * sp + gap * Math.tanh(2.6 * d) * (1 - near);
      if (near > 0) {
        const { a, b, c } = g;
        const inside = a + softplus(d - a) - softplus(d - b);
        const ends = (Math.tanh(2.6 * (d - b - 0.5)) + Math.tanh(2.6 * (d - a + 0.5))) / 2;
        s += near * ((view.cw * GROUP_SP - sp) * (inside - c) + gap * ends);
      }
      return s;
    }
    // a card's four corners on the screen (top-left, top-right, bottom-right,
    // bottom-left): standing at s along the row, lifted, leaning
    function corners(s, lift = 0, lean = 0) {
      const { cw, ch } = view;
      const y = -s;
      const z0 = -ch / 2 + lift * ch;
      const sy = -Math.sin(lean) * ch;
      const sz = Math.cos(lean) * ch;
      return [P(-cw / 2, y + sy, z0 + sz), P(cw / 2, y + sy, z0 + sz), P(cw / 2, y, z0), P(-cw / 2, y, z0)];
    }
    // every place a card shows: its slot less the reading position, wrapped,
    // and once more round either way where that is on the screen too
    const limit = () => view.half / view.along + view.cw * 1.2;
    function placesOf(c, g) {
      const d0 = wrap(c.slot - pos);
      const out = [];
      for (const d of [d0, d0 - N, d0 + N]) {
        const s = along(d, g) + c.part;
        if (Math.abs(s) <= limit()) out.push({ c, d, s });
      }
      return out;
    }

    // ---- the pointer: which card, tested against its resting shape -----
    let px = -1;
    let py = -1;
    function inside(q, x, y) {
      const [tl, tr, , bl] = q;
      const ux = tr[0] - tl[0], uy = tr[1] - tl[1], vx = bl[0] - tl[0], vy = bl[1] - tl[1];
      const det = ux * vy - uy * vx;
      if (!det) return false;
      const qx = x - tl[0], qy = y - tl[1];
      const a = (qx * vy - qy * vx) / det;
      const b = (ux * qy - uy * qx) / det;
      return a >= 0 && a <= 1 && b >= 0 && b <= 1;
    }
    function hit(x, y) {
      if (x < 0) return null;
      // front to back: the nearer the bottom-left, the nearer the eye
      const g = groupAt();
      let best = null;
      let bestS = Infinity;
      for (const c of cards) {
        for (const p of placesOf(c, g)) {
          if (p.s < bestS && inside(corners(p.s - c.part), x, y)) {
            best = c;
            bestS = p.s;
          }
        }
      }
      return best;
    }
    function setHover(c) {
      if (c === hover) return;
      hover = c;
      stage.style.cursor = c?.group ? "pointer" : "";
      wake();
    }

    // ---- drawing -----------------------------------------------------
    // a card's own plane: its top-left corner, and a unit across and down it
    function plane(q) {
      const { cw, ch, dpr } = view;
      const [tl, tr, , bl] = q;
      ctx.setTransform(((tr[0] - tl[0]) / cw) * dpr, ((tr[1] - tl[1]) / cw) * dpr, ((bl[0] - tl[0]) / ch) * dpr, ((bl[1] - tl[1]) / ch) * dpr, tl[0] * dpr, tl[1] * dpr);
    }
    // Every face painted once into one atlas, at up to 1.5 pixels to a
    // unit of the card, its shadow round it (the cards have no outlines:
    // the shadow parts each from the one behind), whenever the cards change
    // size or the fonts come; each frame then places it on its card's plane
    // with one image drawn. Faces drawn afresh every frame (text under a
    // slanted transform, a dozen cards) cost a frame in eight on a slow
    // machine while the pointer moved over the row; one image each costs
    // next to nothing. The locked cards share a face for each tone.
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");
    const ATLAS_COLS = 6;
    const lockPaths = LOCK.map((d) => new Path2D(d));
    function paintFaces() {
      const { cw, ch } = view;
      const k = Math.min(1.5, view.dpr || 1);
      const pad = cw * SHADOW;
      const w = Math.ceil((cw + 2 * pad) * k) + 2;
      const h = Math.ceil((ch + 2 * pad) * k) + 2;
      const faces = [];
      const lockedByTone = new Map();
      cards.forEach((c) => {
        if (c.kind !== "locked") return faces.push(c);
        if (!lockedByTone.has(c.tone)) {
          const face = { kind: "locked", tone: c.tone };
          lockedByTone.set(c.tone, face);
          faces.push(face);
        }
        c.face = lockedByTone.get(c.tone);
      });
      atlas.width = w * ATLAS_COLS;
      atlas.height = h * Math.ceil(faces.length / ATLAS_COLS);
      view.face = { k, pad };
      faces.forEach((f, i) => {
        // where the card's own top-left falls in the atlas
        f.sx = (i % ATLAS_COLS) * w + 1 + pad * k;
        f.sy = Math.floor(i / ATLAS_COLS) * h + 1 + pad * k;
        paintFace(f);
      });
    }
    function paintFace(c) {
      const { cw, ch } = view;
      const { k, pad } = view.face;
      const x = actx;
      x.setTransform(k, 0, 0, k, c.sx, c.sy);
      x.clearRect(-pad - 1, -pad - 1, cw + 2 * pad + 2, ch + 2 * pad + 2);
      // the card, its shadow round it
      x.save();
      x.shadowColor = SHADOW_INK;
      x.shadowBlur = cw * SHADOW_BLUR * k;
      x.shadowOffsetY = cw * 0.008 * k;
      x.beginPath();
      x.roundRect(0, 0, cw, ch, cw * RADIUS);
      x.fillStyle = c.tone;
      x.fill();
      x.restore();
      // a breath of light along its top
      const lit = x.createLinearGradient(0, 0, 0, ch);
      lit.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      lit.addColorStop(0.35, "rgba(255, 255, 255, 0)");
      x.beginPath();
      x.roundRect(0, 0, cw, ch, cw * RADIUS);
      x.fillStyle = lit;
      x.fill();
      const m = cw * FACE_M;
      const l = cw * FACE_LOGO;
      x.beginPath();
      x.roundRect(m, m, l, l, l * 0.09);
      x.fillStyle = LOGO_GROUND;
      if (c.kind === "locked") {
        // the square kept for its mark, with a lock in it; quiet bars
        // where its name would be; nothing that says what it is
        x.fill();
        const s = l / 18;
        x.save();
        x.translate(m, m);
        x.scale(s, s);
        x.strokeStyle = `rgba(${INK}, 0.5)`;
        x.lineWidth = 1.25;
        x.lineCap = x.lineJoin = "round";
        lockPaths.forEach((p) => x.stroke(p));
        x.restore();
        const nx = m + l + cw * FACE_GAP;
        x.fillStyle = `rgba(${INK}, 0.08)`;
        x.beginPath();
        x.roundRect(nx, m + l * 0.28, cw * 0.36, l * 0.18, l * 0.04);
        x.roundRect(nx, m + l * 0.58, cw * 0.22, l * 0.14, l * 0.04);
        x.fill();
        x.fillStyle = `rgba(${INK}, 0.4)`;
        x.font = `400 ${cw * 0.036}px ${fonts.mono}`;
        x.textAlign = "left";
        x.textBaseline = "alphabetic";
        x.fillText("IN THE FULL STACK", m, ch - m);
        return;
      }
      if (c.image) {
        x.drawImage(c.image, m, m, l, l);
      } else {
        x.fill();
        x.fillStyle = `rgba(${INK}, 0.55)`;
        x.font = `500 ${l * 0.34}px ${fonts.mono}`;
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(c.initials, m + l / 2, m + l / 2 + l * 0.02);
      }
      x.fillStyle = `rgb(${INK})`;
      x.font = `400 ${cw * FACE_NAME * c.nameScale}px ${fonts.display}`;
      x.textAlign = "left";
      x.textBaseline = "middle";
      x.fillText(c.name, m + l + cw * FACE_GAP, m + l / 2);
      if (c.category) {
        x.fillStyle = `rgba(${INK}, 0.45)`;
        x.font = `400 ${cw * 0.036}px ${fonts.mono}`;
        x.textBaseline = "alphabetic";
        x.fillText(c.category.toUpperCase(), m, ch - m);
      }
    }
    // Each stack's name, for the near end of its bracket: painted once,
    // upright, at the screen's pixels, quiet and in the ink (the stack under
    // the pointer, or chosen), and placed with one image each frame.
    const labels = document.createElement("canvas");
    const lctx = labels.getContext("2d");
    function paintLabels() {
      if (!groups.length) return;
      const { dpr, rem } = view;
      const size = 0.625 * rem;
      const font = `400 ${size}px ${fonts.mono}`;
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.font = font;
      const widths = groups.map((g) => lctx.measureText(g.name.toUpperCase()).width);
      const w = Math.ceil((Math.max(...widths) + 4) * dpr);
      const cell = Math.ceil(size * 1.6 * dpr);
      labels.width = w;
      labels.height = cell * groups.length * 2;
      groups.forEach((g, i) => {
        [0.5, 0.92].forEach((a, j) => {
          lctx.setTransform(dpr, 0, 0, dpr, 0, (i * 2 + j) * cell);
          lctx.font = font;
          lctx.textBaseline = "middle";
          lctx.fillStyle = `rgba(${INK}, ${a})`;
          lctx.fillText(g.name.toUpperCase(), 2, (size * 1.6) / 2);
        });
        g.label = { sy: i * 2 * cell, w: Math.ceil((widths[i] + 4) * dpr), h: cell };
      });
    }
    // a card on the screen: its face (and its shadow) from the atlas on its
    // own plane, paled towards the ground where another stack is chosen
    function drawCard(c, q) {
      const { cw, ch } = view;
      const f = c.face ?? c;
      const { k, pad } = view.face;
      plane(q);
      ctx.drawImage(atlas, f.sx - pad * k, f.sy - pad * k, (cw + 2 * pad) * k, (ch + 2 * pad) * k, -pad, -pad, cw + 2 * pad, ch + 2 * pad);
      if (c.pale > 0.004) {
        ctx.beginPath();
        ctx.roundRect(0, 0, cw, ch, cw * RADIUS);
        ctx.fillStyle = `rgba(${GROUND.join(",")}, ${(PALE_COVER * c.pale).toFixed(3)})`;
        ctx.fill();
      }
    }
    // A stack's bracket: a dotted line on the ground beside its cards' right
    // edges, from its first card to its last, its ends turned in towards
    // them, and its name at the near end. On the ground beside the row, it
    // is never under a card.
    function drawBracket(g, da, db, gAt) {
      const { cw, ch, dpr } = view;
      const s0 = along(da, gAt) - cw * 0.03;
      const s1 = along(db, gAt) + cw * 0.03;
      const z = -ch / 2;
      const xo = cw / 2 + cw * BRACKET_X;
      const xi = xo - cw * BRACKET_END;
      const lit = Math.max(g.hov, g.sel);
      const dots = new Path2D();
      const run = (a, b) => {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.round(len / BRACKET_DOT));
        for (let i = 0; i <= n; i++) {
          const x = a[0] + ((b[0] - a[0]) * i) / n;
          const y = a[1] + ((b[1] - a[1]) * i) / n;
          dots.rect(Math.round((x - 0.6) * dpr) / dpr, Math.round((y - 0.6) * dpr) / dpr, 1.2, 1.2);
        }
      };
      const near = P(xo, -s0, z);
      run(P(xi, -s0, z), near);
      run(near, P(xo, -s1, z));
      run(P(xo, -s1, z), P(xi, -s1, z));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${INK}, ${(0.32 + 0.4 * lit).toFixed(3)})`;
      ctx.fill(dots);
      // the name, a step out from the near end
      if (g.label) {
        const { sy, w, h } = g.label;
        const x = near[0] + 0.5 * view.rem;
        const y = near[1] + 0.35 * view.rem;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(labels, 0, sy + (lit > 0.5 ? h : 0), w, h, Math.round(x * dpr), Math.round(y * dpr), w, h);
      }
    }
    function draw() {
      const { dpr, w, h } = view;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const g = groupAt();
      // the brackets, on the ground, first
      for (const grp of groups) {
        const da0 = wrap(grp.a - pos);
        for (const da of [da0, da0 - N, da0 + N]) {
          const db = da + (grp.b - grp.a);
          if (along(db, g) < -limit() || along(da, g) > limit()) continue;
          drawBracket(grp, da, db, g);
        }
      }
      const places = [];
      for (const c of cards) places.push(...placesOf(c, g));
      // back to front: the farthest up the row first
      places.sort((p, q) => q.s - p.s);
      for (const p of places) drawCard(p.c, corners(p.s, p.c.lift, p.c.lean));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---- a stack chosen ----------------------------------------------
    const sheetEl = root.querySelector("[data-stack-sheet]");
    const sheet = sheetEl ? mountStackSheet(sheetEl, data) : null;
    function choose(g) {
      if (!g || chosen) return;
      chosen = g;
      clearTimeout(settling);
      setHover(null);
      // the row to the stack: its middle, the short way round
      const mid = (g.a + g.b) / 2;
      target = mid + N * Math.round((target - mid) / N);
      gather.start = g.a;
      gather.end = g.b;
      gather.to = 1;
      const now = performance.now();
      cards.forEach((c) => {
        const mine = c.group === g;
        c.paleT = mine ? 0 : 1;
        c.liftAt = mine ? now + (c.slot - g.a) * SEL_STAGGER : 0;
      });
      g.sel = 1;
      say(`${g.name}: ${g.toolCount} tools`);
      wake();
      clearTimeout(sheetTimer);
      sheetTimer = setTimeout(() => (sheet ? sheet.open(g, release) : release()), reduced ? 0 : SHEET_AFTER);
    }
    // the sheet closed: the stack settles back into the row
    function release() {
      if (!chosen) return;
      chosen.sel = 0;
      chosen = null;
      gather.to = 0;
      cards.forEach((c) => {
        c.paleT = 0;
        c.liftAt = 0;
      });
      stage.focus({ preventScroll: true });
      wake();
    }

    // ---- input ---------------------------------------------------------
    let settling = 0;
    function nudge(by) {
      if (chosen) return;
      target += by;
      clearTimeout(settling);
      settling = setTimeout(() => {
        target = Math.round(target);
        wake();
      }, SETTLE_MS);
      wake();
    }
    const onWheel = (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? view.h : 1;
      // across or down, whichever the gesture mostly is
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
      nudge(delta / WHEEL_STEP);
    };
    const cardAt = (slot) => cards.find((c) => Math.abs(wrap(c.slot - slot)) < 0.5);
    const onKey = (e) => {
      if (chosen) return;
      const step = { ArrowRight: 1, ArrowDown: 1, PageDown: 5, ArrowLeft: -1, ArrowUp: -1, PageUp: -5 }[e.key];
      if (step) {
        e.preventDefault();
        target = Math.round(target) + step;
        wake();
      } else if (e.key === "Home") {
        e.preventDefault();
        target = N * Math.round(target / N);
        wake();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const c = cardAt(Math.round(pos));
        if (c?.group) choose(c.group);
        else if (c) say(`${c.name} is not in a curated stack yet`);
      }
    };
    // a pointer: hover with a mouse; a finger drags through the row, a tap chooses
    let drag = null;
    const local = (e) => {
      if (e.target === canvas) return [e.offsetX, e.offsetY];
      const r = stage.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      [px, py] = local(e);
      if (drag) {
        const dy = drag.y - e.clientY;
        if (Math.abs(e.clientY - drag.y0) > 6) drag.moved = true;
        drag.y = e.clientY;
        nudge((dy / WHEEL_STEP) * 1.4);
        return;
      }
      if (e.pointerType === "mouse" && !chosen) setHover(hit(px, py));
    };
    const onDown = (e) => {
      if (e.pointerType !== "mouse") drag = { y: e.clientY, y0: e.clientY, moved: false };
    };
    const onUp = () => {
      if (drag?.moved) setTimeout(() => (drag = null), 0);
      else drag = null;
    };
    const onLeave = () => {
      px = py = -1;
      setHover(null);
    };
    const onClick = (e) => {
      if (drag?.moved || chosen) return;
      const [x, y] = local(e);
      const c = hit(x, y);
      if (c?.group) choose(c.group);
    };
    const onGo = (e) => choose(groups[Number(e.currentTarget.dataset.stackGo)]);

    // ---- the loop ------------------------------------------------------
    let running = false;
    let lastSaid = null;
    function say(text) {
      if (live) live.textContent = text;
    }
    function tick(_time, deltaMs) {
      const dt = Math.min(deltaMs, 50) / 1000;
      const k = (rate) => (reduced ? 1 : ease(rate, dt));
      const now = performance.now();
      let moving = false;
      // the reading position, and the fan with its speed
      const was = pos;
      pos += (target - pos) * k(RATE_POS);
      if (Math.abs(target - pos) < 0.0005) pos = target;
      const speed = dt ? Math.abs(pos - was) / dt : 0;
      const fanT = reduced || chosen ? 0 : Math.min(1, speed / FAN_SPEED);
      fan += (fanT - fan) * k(RATE_FAN);
      if (fan < 0.0005) fan = 0;
      if (pos !== target || fan > 0) moving = true;
      // the chosen stack opening out, or closing up
      if (gather.amount !== gather.to) {
        gather.amount += (gather.to - gather.amount) * k(RATE_GROUP);
        if (Math.abs(gather.to - gather.amount) < 0.002) gather.amount = gather.to;
        else moving = true;
      }
      // what the pointer is over, as the row moves under it
      if (moving && px >= 0 && !chosen) {
        const c = hit(px, py);
        if (c !== hover) {
          hover = c;
          stage.style.cursor = c?.group ? "pointer" : "";
        }
      }
      // per stack: lit while the pointer is on one of its cards
      for (const g of groups) {
        const to = hover?.group === g ? 1 : 0;
        if (g.hov !== to) {
          g.hov += (to - g.hov) * k(RATE_HOVER);
          if (Math.abs(to - g.hov) < 0.01) g.hov = to;
          else moving = true;
        }
      }
      // per card: its paling, and its lift: the chosen stack's, one after
      // the next, or the hover's, with its neighbours' lean and parting
      const hoverSlot = hover ? hover.slot : 0;
      for (const c of cards) {
        const dp = c.paleT - c.pale;
        if (dp) {
          c.pale += dp * k(RATE_PALE);
          if (Math.abs(dp) < 0.004) c.pale = c.paleT;
          else moving = true;
        }
        let lift = 0, lean = 0, part = 0;
        if (chosen) {
          if (c.liftAt && now >= c.liftAt) lift = SEL_LIFT;
          else if (c.liftAt) moving = true;
        } else if (hover) {
          const gap = Math.round(wrap(c.slot - hoverSlot));
          if (c === hover) lift = LIFT;
          else if (Math.abs(gap) <= REACH && !reduced) {
            const near = 1 - (Math.abs(gap) - 1) / REACH;
            lean = Math.sign(gap) * ((LEAN * Math.PI) / 180) * near;
            part = Math.sign(gap) * PART * view.cw * near;
          }
        }
        const rate = k(RATE_HOVER);
        for (const [key, to] of [["lift", lift], ["lean", lean], ["part", part]]) {
          const v = c[key];
          if (v !== to) {
            const nv = v + (to - v) * rate;
            c[key] = Math.abs(to - nv) < 0.0005 ? to : nv;
            if (c[key] !== to) moving = true;
          }
        }
      }
      draw();
      // the card now read, said once the row has settled on it
      if (!moving && !chosen) {
        const c = cardAt(Math.round(pos));
        if (c && c !== lastSaid) {
          lastSaid = c;
          say(c.kind === "locked" ? `A locked tool in ${c.group.name}` : `${c.name}${c.group ? `, in ${c.group.name}` : ""}`);
        }
      }
      if (!moving) stop();
    }
    function wake() {
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
    }
    function stop() {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    }

    // laid out again whenever the stage changes size, and drawn again once
    // the faces' fonts have come
    const sized = new ResizeObserver(() => {
      measure();
      wake();
    });
    sized.observe(stage);
    measure();
    // the row starts on the first stack, so a stack and its bracket are
    // the first thing in the middle
    if (groups.length) pos = target = Math.round((groups[0].a + groups[0].b) / 2);
    wake();
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      measure();
      wake();
    });

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKey);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("click", onClick);
    goes.forEach((b) => b.addEventListener("click", onGo));

    registerPageCleanup(() => {
      alive = false;
      stop();
      clearTimeout(settling);
      clearTimeout(sheetTimer);
      sheet?.destroy();
      sized.disconnect();
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("click", onClick);
      goes.forEach((b) => b.removeEventListener("click", onGo));
      root.stackSpace = false;
    });
  });
}
