/* ============================================================
   Stack space — the Free Tech Stacks page's one screen
   (stack-diagnostic.astro; styles: stack-space.css; the data:
   src/data/stack-ecosystem.ts and the Studio's tech stacks; the sheet a
   stack opens: stack-sheet.js)
   ------------------------------------------------------------
   Fourth pass (2026-11-04), after the user's brief and a reference of CD
   cases standing in a row: every card is one piece of software, and every
   card belongs to a curated stack. The cards stand upright, close
   together, in one long row seen from above at 45° across with no
   perspective (fifth pass: back to the row's first angle, the cards flat,
   with no thickness, at the user's word), the row climbing from off the
   screen's bottom-left to off its top-right. The row has no ends: it goes round (each card at
   its slot less the reading position, wrapped round the number of
   cards), so moving through it never meets a last card.

   Stacks in the row: a stack's cards stand together at the row's own
   spacing, with no gap between stacks, every card in the one colour
   (sixth pass, 2026-11-04: before, a colour or a grey of each stack's
   own). The stack being read tells them apart: the one at the row's
   middle, or the one under the pointer, at full strength, and the others
   a little faded, each with a dotted bracket on the ground beside it and
   its name at the bracket's near end. The pointer on a stack also brings
   up its name and what it is for beside the row, over the Free Stack. A card is
   laid out as a business card: its mark (the product's own, or its
   initials in a plain square) and its name at the top, its role under
   them, its number in the stack at the top right, a hairline, and at its
   foot a band with the stack's name. The tools a stack holds back until
   the visitor is in the ADDD app are cards with the SVG Collection's lock
   and no name.

   The pointer: the card under it lifts, smoothly and clearly, and settles
   back when the pointer moves on (fifth pass: back to lifting, not
   sliding out); its neighbours stay where they are. Pressing any card
   of a stack opens the stack's sheet out of its cards, from wherever they
   stand on the screen: they rise out of the row, come to the front and
   turn into the sheet's containers; closing brings them back and sets
   them down (stack-sheet.js moves them; rowSource() here is the row's
   side of it).

   The wheel and a finger move through the row on Lenis, the site's own
   smooth scroll (fifth pass): a Lenis of its own on a scroller over the
   canvas, endless, at the site's lerp; the arrow keys move it a card at a
   time. The page's own Lenis leaves the stage to it (data-lenis-prevent);
   the list and a stack's sheet each scroll on a Lenis of their own.

   The flat view (the switch under the title): the same stacks as a list
   of blocks (stack-diagnostic.astro renders it from the same data); this
   script switches between the two, sleeps the row while the list shows,
   and opens a block's stack out of the block's own rows.

   How it is built, for speed:
   - One canvas draws the whole row, back to front, each card on its own
     plane (an affine transform per card): one layer and one pass. The
     cards part from one another by a hairline round each, with no
     shadows.
   - Every face is painted once into an atlas whenever the cards change
     size, a mark arrives or the fonts come; each frame places it with one
     image drawn. The stacks' names, likewise, from an atlas of their own.
   - Everything moves from a few numbers on the GSAP ticker: the reading
     position (Lenis's), and per card its lift. The drawing loop sleeps as
     soon as nothing is moving and wakes on input; it is asleep while the
     sheet or the list is up.
   - The pointer is tested against each card's resting shape, front to
     back (the card already up first, where it is), in plain arithmetic:
     no layout is read while it moves.
   Under reduced motion everything still works, without the glides. The
   listeners, the loop and the observer go with the page.
   ============================================================ */
import { motion, registerPageCleanup } from "./page.js";
import { mountStackSheet, initialsOf } from "./stack-sheet.js";

// the view (fifth pass, 2026-11-04: back to the row's first angle, at the
// user's word): seen from above at 45° across, the elevation from the
// screen's shape, so the row runs from CORNER_IN in from the bottom-left
// corner to CORNER_IN in from the top-right, through the middle
const R2 = Math.SQRT1_2;
const CORNER_IN = 0.07;
// the cards: width as a share of the screen's (held between a least and a
// most, px), height to width, corner radius (card widths). Flat cards, no
// thickness (fifth pass)
const CARD_SHARE = 0.19;
const CARD_SHARE_SMALL = 0.36;
const CARD_MIN = 150;
const CARD_MAX = 360;
const CARD_RATIO = 0.62;
const RADIUS = 0.022;
// the row: each card this far behind the one before (card widths)
const SPACING = 0.3;
// the hover (fifth pass: back to lifting): the card under the pointer
// rises (share of its height) on its own rate; its neighbours stay put
const LIFT = 0.26;
const RATE_LIFT = 9;
// the rest of its stack a little with it (2026-11-04), each a touch later
// the farther it stands from the card under the pointer (its rate divided
// by 1 + KIN_LAG a card away), so the stack answers as one piece
const LIFT_KIN = 0.07;
const KIN_LAG = 0.22;
// the stack being read (sixth pass, 2026-11-04): every card the one colour,
// the stack read at full strength and the others faded to FADED (a veil of
// the ground over each card, so the cards behind never show through, as
// they would through a card made see-through), each stack easing between
// the two at RATE_READ. It is the stack at the row's middle, which holds
// until the middle is HOLD of a card past its end (no flicker at a join),
// or, over it, the stack under the pointer, which stays the one read for
// HOVER_HOLD s after the pointer leaves its cards (no dip across a gap)
const FADED = 0.55;
const RATE_READ = 7;
const HOLD = 0.3;
const HOVER_HOLD = 0.18;
// the scroll: the row is moved by Lenis (fifth pass), the site's own smooth
// scroll and lerp, on a scroller of its own over the canvas (endless:
// infinite), this many px of it to a card
const STEP = 80;
const LERP = 0.08;
// the face, in card widths: its margin, the mark's square, the gap to the
// name, the name's size, the small type's, the band's height (card heights)
const FACE_M = 0.055;
const FACE_LOGO = 0.105;
const FACE_GAP = 0.04;
const FACE_NAME = 0.062;
const FACE_SMALL = 0.03;
const FACE_BAND = 0.26;
// the bracket beside a stack: how far out from the cards' edge it runs and
// how long its ends turn in (card widths), its dots' spacing (px)
const BRACKET_X = 0.1;
const BRACKET_END = 0.05;
const BRACKET_DOT = 5;
// software in no stack (production, while no stack is published)
const TONE_FREE = { ground: "#ffffff", ink: "#0a0a0a" };
// the SVG Collection's lock (no. 026, dash-type-btn__locked, 18 × 18)
const LOCK = [
  "M12.75 15.75H5.25C4.42125 15.75 3.75 15.0787 3.75 14.25V9C3.75 8.17125 4.42125 7.5 5.25 7.5H12.75C13.5788 7.5 14.25 8.17125 14.25 9V14.25C14.25 15.0787 13.5788 15.75 12.75 15.75Z",
  "M6 7.5V5.25C6 3.59325 7.34325 2.25 9 2.25C10.6567 2.25 12 3.59325 12 5.25V7.5",
];

const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
// A stack opened (stack-sheet.js flies its cards; rowSource() below): they
// rise this far out of the row (a share of their height) as they leave it,
// which is what takes the nearest of them clear of the card in front; less
// where the screen has little room over them (never less than LIFT_MIN),
// keeping ROOM_PX over the highest
const LIFT_OUT = 0.44;
const LIFT_MIN = 0.2;
const ROOM_PX = 12;
const pad2 = (n) => String(n).padStart(2, "0");

// a colour as [r, g, b], and one mixed towards another by t
const rgbOf = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const isDark = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b < 140;

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
    const flat = root.querySelector("[data-stack-flat]");
    const viewButtons = [...root.querySelectorAll("[data-view-set]")];
    const flatGoes = [...root.querySelectorAll("[data-flat-go]")];
    const css = getComputedStyle(root);
    const fonts = {
      display: css.getPropertyValue("--font-display").trim() || "sans-serif",
      mono: css.getPropertyValue("--font-mono").trim() || "monospace",
    };
    // the page's ground, for the veil over the stacks not being read
    const sdGround = css.getPropertyValue("--sd-ground").trim() || "#dcdcd8";

    // ---- the data: the stacks' cards (or, with none, the software) ------
    // Each stack's cards stand together in the row, its named tools first
    // and then one locked card for each tool held back. A tool named by two
    // stacks stands in each: a card belongs to the stack it stands in,
    // which is the one it opens. Software stands on its own only where no
    // stack is published (production, for now).
    const data = JSON.parse(dataEl.textContent);
    // "Locked" on a locked card: the page document's word (sheet.locked)
    const LOCKED_WORD = data.words?.locked || "Locked";
    const groups = (data.stacks ?? []).map((s, i) => ({ ...s, index: i, read: 0, rgb: rgbOf(s.tone.ground), toolCount: s.stages.length }));
    const cards = [];
    // a card for each of a stack's stages, in its order: an open stage's
    // tool (its name, its stage as its role), or a locked stage (its name
    // and a lock; nothing of its tool is on the page)
    groups.forEach((g) => {
      g.a = cards.length;
      g.stages.forEach((s, k) => cards.push(s.locked
        ? { kind: "locked", stage: s.stage, group: g, n: k + 1 }
        : { kind: "tool", name: s.tool, category: s.stage, logo: s.logo, group: g, n: k + 1 }));
      g.b = cards.length - 1;
    });
    const N = cards.length;
    if (!N) return;
    root.stackSpace = true;
    cards.forEach((c, i) => {
      c.slot = i;
      c.initials = c.name ? initialsOf(c.name) : "";
      c.tone = c.group ? c.group.tone : TONE_FREE;
      c.rgb = rgbOf(c.tone.ground);
      c.dark = isDark(c.rgb);
      // its lift (share of its height), and how far it is carried off its
      // place on the screen (px: only while its stack opens or closes)
      c.lift = 0;
      c.dx = c.dy = 0;
      Object.assign(c, { nameScale: 1, image: null });
    });
    // the marks: drawn on their cards once they have come
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
    let hover = null;
    // the stack open (its sheet up, or on its way), and the view shown
    let chosen = null;
    let viewing = "3d";
    // the stack being read: the one at the row's middle, and the pointer's
    // (held a moment after the pointer leaves its cards)
    let centre = null;
    let held = null;
    let heldFor = 0;
    // The stack at the row's middle: the stack of the card there, the one
    // already read holding until the middle is HOLD of a card past either
    // of its ends. Plain arithmetic on the reading position: nothing laid
    // out, nothing measured.
    function centreOf() {
      if (!groups.length) return null;
      if (centre) {
        const lo = wrap(centre.a - 0.5 - pos);
        const hi = lo + centre.b - centre.a + 1;
        if (lo <= HOLD && hi >= -HOLD) return centre;
      }
      return cards[((Math.round(pos) % N) + N) % N].group ?? null;
    }

    // ---- the view: the screen's size, the card, the row --------------------
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
      view.sp = view.cw * SPACING;
      // a card's outline on its own plane, for its veil
      view.cardPath = new Path2D();
      view.cardPath.roundRect(0, 0, view.cw, view.ch, view.cw * RADIUS);
      // how far along the row (its own units) the screen reaches from the
      // middle, a card's size past it
      view.along = R2 * Math.sqrt(1 + tan * tan);
      view.limit = Math.hypot(r.width, r.height) / 2 / view.along + view.cw * 1.4;
      // each name's size, shrunk where a long one would run off its card
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = `400 ${view.cw * FACE_NAME}px ${fonts.display}`;
      const room = view.cw * (1 - 2 * FACE_M - FACE_LOGO - FACE_GAP);
      cards.forEach((c) => (c.nameScale = c.name ? Math.min(1, room / Math.max(1, ctx.measureText(c.name).width)) : 1));
      paintFaces();
      paintLabels();
    }
    const P = (x, y, z) => [view.cx + (x - y) * R2, view.cy + (x + y) * R2 * view.sinE - z * view.cosE];

    // a card's four corners on the screen (top-left, top-right, bottom-right,
    // bottom-left): standing at s along the row, lifted by lift (a share of
    // its height)
    function corners(s, lift = 0) {
      const { cw, ch } = view;
      const y = -s;
      const z = lift * ch;
      return [P(-cw / 2, y, ch / 2 + z), P(cw / 2, y, ch / 2 + z), P(cw / 2, y, -ch / 2 + z), P(-cw / 2, y, -ch / 2 + z)];
    }
    // a card's corners as it is drawn now: where it stands, lifted, and
    // carried off its place as far as it is
    function shown(c, s) {
      const q = corners(s, c.lift);
      return c.dx || c.dy ? q.map(([x, y]) => [x + c.dx, y + c.dy]) : q;
    }
    // every place a card shows: its slot less the reading position, wrapped,
    // and once more round either way where that is on the screen too
    function placesOf(c) {
      const d0 = wrap(c.slot - pos);
      const out = [];
      for (const d of [d0, d0 - N, d0 + N]) {
        const s = d * view.sp;
        if (Math.abs(s) <= view.limit) out.push({ c, d, s });
      }
      return out;
    }

    // ---- the pointer: which card is drawn under it ----------------------
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
    // What is drawn at a point: the front-most card (the nearer the
    // bottom-left, the nearer the eye: draw() paints them back to front by
    // s) whose quad, as drawn now (at its lift), holds the point, with the
    // place it stands in. (2026-11-16: until now cards were tested at their
    // resting shape while drawn lifted, so the strip a lifted card leaves
    // showed one card and opened another, the cause of a stack opening
    // that was not the one clicked.)
    function pick(x, y) {
      if (x < 0) return null;
      let best = null;
      for (const c of cards) {
        if (c.away) continue;
        for (const p of placesOf(c)) {
          if ((!best || p.s < best.s) && inside(shown(c, p.s), x, y)) best = p;
        }
      }
      return best;
    }
    // The card the pointer is over, for its lift: what is drawn there,
    // except that the card already up keeps the pointer over the whole of
    // its footprint (where it stands and where it is lifted to), unless a
    // card in front of it is drawn there; so it does not drop as soon as it
    // rises from under the pointer. A click never uses this: it opens what
    // is drawn (pick).
    function hit(x, y) {
      const top = pick(x, y);
      if (hover && !hover.away && top?.c !== hover) {
        for (const p of placesOf(hover)) {
          const over = inside(corners(p.s, 0), x, y) || inside(corners(p.s, hover.lift), x, y);
          if (over && (!top || top.s > p.s)) return hover;
        }
      }
      return top?.c ?? null;
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
    // unit of the card, whenever the cards change size, a mark comes or the
    // fonts come; each frame then places it on its card's plane with one
    // image drawn. Each card its own face (a locked card names its stage).
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");
    const ATLAS_COLS = 6;
    const lockPaths = LOCK.map((d) => new Path2D(d));
    // a line cut to the room it has, in a context's current font
    const fit = (x, text, most) => {
      let s = text;
      while (s.length > 4 && x.measureText(s).width > most) s = s.slice(0, -2).trimEnd() + "…";
      return s;
    };
    function paintFaces() {
      const { cw, ch } = view;
      const k = Math.min(1.5, view.dpr || 1);
      const pad = 2;
      const w = Math.ceil((cw + 2 * pad) * k) + 2;
      const h = Math.ceil((ch + 2 * pad) * k) + 2;
      atlas.width = w * ATLAS_COLS;
      atlas.height = h * Math.ceil(cards.length / ATLAS_COLS);
      view.face = { k, pad };
      cards.forEach((c, i) => {
        c.sx = (i % ATLAS_COLS) * w + 1 + pad * k;
        c.sy = Math.floor(i / ATLAS_COLS) * h + 1 + pad * k;
        actx.setTransform(k, 0, 0, k, c.sx, c.sy);
        actx.clearRect(-pad - 1, -pad - 1, cw + 2 * pad + 2, ch + 2 * pad + 2);
        faceGround(actx, c);
        faceFoot(actx, c);
        faceTop(actx, c);
      });
    }
    // A face is painted in three parts, in a context set to the card's own
    // units with its top-left corner at the origin: its ground (the card
    // itself), its foot (its number in the stack) and its top (its mark, its
    // name, its role). The atlas has all three; a card in flight
    // (rowSource().face()) has its top and its foot as pictures of their
    // own, over a ground that changes shape under them.
    const inkOf = (c) => {
      const rgb = rgbOf(c.tone.ink).join(", ");
      return (a) => `rgba(${rgb}, ${a})`;
    };
    // the ground's own colours, for the atlas and for a card in flight
    const faceLook = (c) => ({
      band: mix(c.rgb, c.dark ? [255, 255, 255] : [0, 0, 0], c.dark ? 0.07 : 0.045),
      line: inkOf(c)(c.dark ? 0.14 : 0.1),
      edge: c.dark ? "rgba(255, 255, 255, 0.08)" : "rgba(10, 10, 10, 0.1)",
    });
    function faceGround(x, c) {
      const { cw, ch } = view;
      const look = faceLook(c);
      const r = cw * RADIUS;
      const m = cw * FACE_M;
      // the card, a solid block of its stack's colour, a hairline round it
      // where it would otherwise melt into the one behind
      x.save();
      x.beginPath();
      x.roundRect(0, 0, cw, ch, r);
      // (a locked card is the same white in the row: it says "Locked", and is
      // greyed only in the sheet, 2026-11-16, at the user's word)
      x.fillStyle = c.tone.ground;
      x.fill();
      x.clip();
      // the band at its foot, a step of the colour, and the hairline over it
      const bandY = ch * (1 - FACE_BAND);
      x.fillStyle = look.band;
      x.fillRect(0, bandY, cw, ch - bandY);
      x.fillStyle = look.line;
      x.fillRect(m, bandY - 1, cw - 2 * m, 1);
      x.restore();
      x.beginPath();
      x.roundRect(0.5, 0.5, cw - 1, ch - 1, r);
      x.strokeStyle = look.edge;
      x.lineWidth = 1;
      x.stroke();
    }
    // in the band, on the right: its number in the stack (2026-11-16: no
    // stack name there any more: the card in front covers its left, and the
    // bracket beside the row names the stack)
    function faceFoot(x, c) {
      if (!c.n) return;
      const { cw, ch } = view;
      const bandY = ch * (1 - FACE_BAND);
      x.fillStyle = inkOf(c)(0.5);
      x.font = `400 ${cw * FACE_SMALL}px ${fonts.mono}`;
      x.textAlign = "right";
      x.textBaseline = "middle";
      x.fillText(`${pad2(c.n)}/${pad2(c.group.toolCount)}`, cw - cw * FACE_M, bandY + (ch - bandY) / 2);
    }
    function faceTop(x, c) {
      const { cw } = view;
      const shade = inkOf(c);
      const m = cw * FACE_M;
      const l = cw * FACE_LOGO;
      const small = cw * FACE_SMALL;
      const nx = m + l + cw * FACE_GAP;
      // the mark's square: the product's own mark on white, or its
      // initials (or the lock) in a quiet square of the card's own ink
      x.beginPath();
      x.roundRect(m, m, l, l, l * 0.16);
      if (c.kind === "locked") {
        x.fillStyle = shade(0.07);
        x.fill();
        const s = (l * 0.62) / 18;
        x.save();
        x.translate(m + l * 0.19, m + l * 0.19);
        x.scale(s, s);
        x.strokeStyle = shade(0.6);
        x.lineWidth = 1.4;
        x.lineCap = x.lineJoin = "round";
        lockPaths.forEach((p) => x.stroke(p));
        x.restore();
        // "Locked" where an open card's tool name is, and the stage it
        // fills where its stage is: the same two lines, the same places
        x.fillStyle = shade(0.46);
        x.font = `400 ${cw * FACE_NAME}px ${fonts.display}`;
        x.textAlign = "left";
        x.textBaseline = "middle";
        x.fillText(LOCKED_WORD, nx, m + l * 0.34);
        x.fillStyle = shade(0.52);
        x.font = `400 ${small}px ${fonts.mono}`;
        x.fillText(fit(x, c.stage.toUpperCase(), cw - nx - m), nx, m + l * 0.82);
        return;
      }
      if (c.image) {
        x.fillStyle = "#ffffff";
        x.fill();
        if (!c.dark) {
          x.strokeStyle = "rgba(10, 10, 10, 0.1)";
          x.lineWidth = 1;
          x.stroke();
        }
        // the mark in its own proportions, inside the square's margin
        const room = l * 0.68;
        const iw = c.image.naturalWidth || 1;
        const ih = c.image.naturalHeight || 1;
        const f = room / Math.max(iw, ih);
        x.drawImage(c.image, m + (l - iw * f) / 2, m + (l - ih * f) / 2, iw * f, ih * f);
      } else {
        x.fillStyle = shade(0.08);
        x.fill();
        x.fillStyle = shade(0.66);
        x.font = `500 ${l * 0.34}px ${fonts.mono}`;
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(c.initials, m + l / 2, m + l / 2 + l * 0.02);
      }
      // its name, beside the mark, and its role under the name
      x.fillStyle = c.tone.ink;
      x.font = `400 ${cw * FACE_NAME * c.nameScale}px ${fonts.display}`;
      x.textAlign = "left";
      x.textBaseline = "middle";
      x.fillText(c.name, nx, m + l * 0.34);
      if (c.category) {
        x.fillStyle = shade(0.52);
        x.font = `400 ${small}px ${fonts.mono}`;
        x.fillText(fit(x, c.category.toUpperCase(), cw - nx - m), nx, m + l * 0.82);
      }
    }
    // Each stack's name, for the near end of its bracket: painted once,
    // upright, at the screen's pixels, quiet and in the ink (the stack under
    // the pointer), and placed with one image each frame.
    const labels = document.createElement("canvas");
    const lctx = labels.getContext("2d");
    // (2026-11-16: its number small in the mono, then its name as written,
    // in the display face, rather than all of it in mono capitals)
    function paintLabels() {
      if (!groups.length) return;
      const { dpr, rem } = view;
      const size = 0.875 * rem;
      const small = 0.625 * rem;
      const name = `400 ${size}px ${fonts.display}`;
      const num = `400 ${small}px ${fonts.mono}`;
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.font = num;
      const lead = lctx.measureText("00").width + 0.5 * rem;
      lctx.font = name;
      const widths = groups.map((g) => lead + lctx.measureText(g.name).width);
      const w = Math.ceil((Math.max(...widths) + 4) * dpr);
      const cell = Math.ceil(size * 1.6 * dpr);
      labels.width = w;
      labels.height = cell * groups.length * 2;
      groups.forEach((g, i) => {
        [0.5, 0.92].forEach((a, j) => {
          lctx.setTransform(dpr, 0, 0, dpr, 0, (i * 2 + j) * cell);
          lctx.textBaseline = "middle";
          lctx.font = num;
          lctx.fillStyle = `rgba(10, 10, 10, ${a * 0.55})`;
          lctx.fillText(pad2(i + 1), 2, (size * 1.6) / 2 + 0.5);
          lctx.font = name;
          lctx.fillStyle = `rgba(10, 10, 10, ${a})`;
          lctx.fillText(g.name, 2 + lead, (size * 1.6) / 2);
        });
        g.label = { sy: i * 2 * cell, w: Math.ceil((widths[i] + 4) * dpr), h: cell };
      });
    }
    // a card on the screen: its face from the atlas on its own plane, flat
    // (fifth pass: no thickness), lifted (and carried) as far as it is
    function drawCard(c, s) {
      const { cw, ch } = view;
      const { k, pad } = view.face;
      plane(shown(c, s));
      ctx.drawImage(atlas, c.sx - pad * k, c.sy - pad * k, (cw + 2 * pad) * k, (ch + 2 * pad) * k, -pad, -pad, cw + 2 * pad, ch + 2 * pad);
      // a stack not being read, a little faded into the ground
      const veil = c.group ? (1 - c.group.read) * (1 - FADED) : 0;
      if (veil > 0.002) {
        ctx.globalAlpha = veil;
        ctx.fillStyle = sdGround;
        ctx.fill(view.cardPath);
        ctx.globalAlpha = 1;
      }
    }
    // A stack's bracket: a dotted line on the ground beside its cards' right
    // edges, from its first card to its last, its ends turned in towards
    // them, and its name at the near end. On the ground beside the row, it
    // is never under a card at rest.
    function drawBracket(g, da, db) {
      const { cw, ch, dpr } = view;
      const s0 = da * view.sp - cw * 0.02;
      const s1 = db * view.sp + cw * 0.02;
      const z = -ch / 2;
      const xo = cw / 2 + cw * BRACKET_X;
      const xi = xo - cw * BRACKET_END;
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
      ctx.fillStyle = `rgba(10, 10, 10, ${(0.28 + 0.42 * g.read).toFixed(3)})`;
      ctx.fill(dots);
      if (g.label) {
        const { sy, w, h } = g.label;
        const x = near[0] + 0.5 * view.rem;
        const y = near[1] + 0.25 * view.rem;
        // the name in the ink, as strong as its stack is read
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = (0.5 + 0.42 * g.read) / 0.92;
        ctx.drawImage(labels, 0, sy + h, w, h, Math.round(x * dpr), Math.round(y * dpr), w, h);
        ctx.globalAlpha = 1;
      }
    }
    function draw() {
      const { dpr, w, h } = view;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // the brackets, on the ground, first
      for (const grp of groups) {
        const da0 = wrap(grp.a - pos);
        for (const da of [da0, da0 - N, da0 + N]) {
          const db = da + (grp.b - grp.a);
          if (db * view.sp < -view.limit || da * view.sp > view.limit) continue;
          drawBracket(grp, da, db);
        }
      }
      const places = [];
      for (const c of cards) places.push(...placesOf(c));
      // back to front: the farthest up the row first
      places.sort((p, q) => q.s - p.s);
      for (const p of places) if (!p.c.away) drawCard(p.c, p.s);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---- the scroll: Lenis -----------------------------------------------
    // Fifth pass (2026-11-04): the row is moved by Lenis, the site's own
    // smooth scroll, as every other page is: a scroller of its own over the
    // canvas (stack-diagnostic.astro: .sd__scroll, its room the stage's
    // height and four rounds of the row, set here), with a Lenis of its own
    // on it, endless (infinite), at the site's lerp, its touch synced; the
    // reading position is how far it has scrolled, a card to every STEP px.
    // Its frames come from the GSAP ticker, as the page's own Lenis's do.
    // (The page's Lenis leaves the stage alone: data-lenis-prevent.) The
    // list and the sheet each scroll on a Lenis of their own too.
    const scroller = stage.querySelector("[data-stack-scroll]");
    const scrollRoom = scroller?.firstElementChild;
    const fitRoom = () => {
      if (scrollRoom) scrollRoom.style.height = `${Math.ceil(stage.clientHeight + N * STEP * 4)}px`;
    };
    fitRoom();
    // the reading position at the scroll's start: the first stack's middle
    const startAt = groups.length ? Math.round((groups[0].a + groups[0].b) / 2) : 0;
    pos = startAt;
    // the stack at the middle read from the start, without a fade
    centre = centreOf();
    if (centre) centre.read = 1;    const rowLenis = scroller && scrollRoom
      ? new Lenis({ wrapper: scroller, content: scrollRoom, lerp: reduced ? 1 : LERP, infinite: true, syncTouch: true, gestureOrientation: "both", touchMultiplier: 1.4 })
      : null;
    const onRowScroll = () => {
      pos = startAt + rowLenis.animatedScroll / STEP;
      wake();
    };
    rowLenis?.on("scroll", onRowScroll);
    // the list's, made the first time it shows
    let listLenis = null;
    const rafLenis = (time) => {
      rowLenis?.raf(time * 1000);
      listLenis?.raf(time * 1000);
    };
    gsap.ticker.add(rafLenis);

    // ---- a stack opened ------------------------------------------------
    const sheetEl = root.querySelector("[data-stack-sheet]");
    const sheet = sheetEl ? mountStackSheet(sheetEl, data) : null;
    // the sheet drawn once, unseen, while the page is idle (stack-sheet.js,
    // warm()), so the first stack opened moves as smoothly as the rest
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    idle(() => document.fonts?.ready.then(() => {
      if (alive && !chosen && groups[0]) sheet?.warm(groups[0], rowSource(groups[0], cards[groups[0].a]));
    }), { timeout: 3000 });
    // at: the place pressed (pick()), when a card was pressed
    function choose(g, from, at) {
      if (!g || chosen || !sheet) return;
      chosen = g;
      // the row (and the list) stay where they are: the sheet comes
      // straight out of the cards (or the list's rows) as they stand
      rowLenis?.stop();
      listLenis?.stop();
      showInfo(null);
      say(`${g.name}: ${g.toolCount} stages`);
      // the card pressed (or, from the keys, the one read), and where it
      // stands, for the sheet to start from
      const pressed = at?.c.group === g ? at.c : hover?.group === g ? hover : cardAt(Math.round(pos));
      sheet.open(g, release, from ?? rowSource(g, pressed, at?.c === pressed ? at.d : null));
    }
    // The row's side of a stack opening and closing. stack-sheet.js flies
    // the stack's containers between the cards and the column, each on a
    // playhead of its own; this is what it flies them from and back to (a
    // "source": the list has one too, flatSource()). It says where each
    // card stands and what it looks like, and each frame it is told how far
    // each card has risen and been carried, and whether its container now
    // covers it: the row then draws the card there, in its own place among
    // the others (so the cards in front still cover it as it rises), or
    // leaves it out. Drawn in the same frame the containers move in, so a
    // card and its container are never apart.
    //
    // Every card of the stack is placed from the one pressed, at the place
    // it was pressed in: a stack's cards stand in consecutive slots, so each
    // is that place plus its distance from the pressed one, on the screen
    // or not. All in the row's own units, so it holds if the window is
    // resized while the sheet is up.
    let flying = false;
    function rowSource(g, pressed, pressedAt) {
      const mine = cards.filter((c) => c.group === g);
      const pi = Math.max(0, mine.indexOf(pressed));
      // Where the pressed card stands NOW (the row is stopped from here on).
      // Of its places round the loop, the one nearest where it was pressed,
      // or else the one nearest the middle. (Until 2026-11-16, second fix:
      // the place recorded at the press itself, and the row can still glide
      // between the press and the click, so a stack pressed mid-glide flew
      // from where a neighbouring card had come to stand.)
      const d0 = wrap(mine[pi].slot - pos);
      const aim = pressedAt ?? 0;
      const base = [d0, d0 - N, d0 + N].reduce((a, b) => (Math.abs(b - aim) < Math.abs(a - aim) ? b : a));
      const sOf = (k) => (base + (k - pi)) * view.sp;
      // the stage's place in the window; how far the cards rise; the lift
      // each starts from (under the pointer, some already stand a little up)
      let left = 0;
      let top = 0;
      let out = LIFT_OUT;
      let from = mine.map(() => 0);
      let changed = false;
      const liftOf = (i, rise) => from[i] + (out - from[i]) * rise;
      return {
        count: mine.length,
        origin: pi,
        // the cards' plane on the screen: a unit across a card, and down it
        get basis() {
          return [R2, R2 * view.sinE, 0, view.cosE];
        },
        // a flight begins (opening, or closing from the open sheet)
        begin(opening) {
          const r = stage.getBoundingClientRect();
          left = r.left;
          top = r.top;
          // They rise as far as the screen has room over those of them on
          // it: all by the same, so the stack leaves as one piece.
          let room = Infinity;
          mine.forEach((_, k) => {
            const y = corners(sOf(k), 0)[0][1];
            if (y > 0 && y < view.h) room = Math.min(room, (y - ROOM_PX) / (view.ch * view.cosE));
          });
          out = Math.max(LIFT_MIN, Math.min(LIFT_OUT, room));
          from = mine.map((c) => (opening ? c.lift : 0));
        },
        // a card's size on its plane, its corner, its colour
        box(i) {
          return { w: view.cw, h: view.ch, r: view.cw * RADIUS, ground: mine[i].rgb };
        },
        // its top-left corner in the window, risen by a share of its rise
        at(i, rise) {
          const [x, y] = corners(sOf(i), liftOf(i, rise))[0];
          return [x + left, y + top];
        },
        // What its container wears as it leaves: the card's own top (its
        // mark, its name, its role) and its number as pictures, painted as
        // the atlas's are, and the look of the band at its foot and of its
        // edge, which the container draws itself, as its ground changes
        // shape. mark: where the mark's square is on the card.
        face(i) {
          const c = mine[i];
          const { cw, ch } = view;
          const { k } = view.face;
          const bandY = ch * (1 - FACE_BAND);
          const picture = (h, dy, paint) => {
            const pic = document.createElement("canvas");
            pic.width = Math.round(cw * k);
            pic.height = Math.round(h * k);
            pic.style.width = `${cw}px`;
            pic.style.height = `${h}px`;
            const x = pic.getContext("2d");
            x.setTransform(k, 0, 0, k, 0, -dy * k);
            paint(x, c);
            return pic;
          };
          const look = faceLook(c);
          return {
            top: picture(bandY, 0, faceTop),
            foot: picture(ch - bandY, bandY, faceFoot),
            band: { h: ch - bandY, colour: look.band, line: look.line, inset: cw * FACE_M },
            edge: look.edge,
            mark: { x: cw * FACE_M, y: cw * FACE_M, size: cw * FACE_LOGO },
          };
        },
        // how far the stack is faded into the ground now (while it is not
        // yet the one read), and into what
        veil() {
          return (1 - g.read) * (1 - FADED);
        },
        veilColour: sdGround,
        // each frame: a card risen and carried this far, or covered by its
        // container (and so not drawn in the row)
        hold(i, rise, dx, dy, covered) {
          const c = mine[i];
          const lift = liftOf(i, rise);
          flying = true;
          if (covered !== Boolean(c.away) || (!covered && (lift !== c.lift || dx !== c.dx || dy !== c.dy))) changed = true;
          c.away = covered;
          c.lift = lift;
          c.dx = dx;
          c.dy = dy;
          // once it is out and fully up, it will come back to rest, not to
          // where the pointer had it
          if (covered && rise >= 1) from[i] = 0;
        },
        // the row drawn, if any of that changed it (or it is moving anyway)
        commit() {
          if (changed || running) draw();
          changed = false;
        },
        // the flight over: the sheet open (the cards out of the row), or
        // closed (back in it, any lift left to settle on its own)
        end(opened) {
          flying = false;
          mine.forEach((c) => {
            c.away = opened;
            c.dx = c.dy = 0;
          });
          if (!opened && hover?.group === g) hover = null;
          draw();
          wake();
        },
      };
    }
    // The same from the list: a stack's block opens out of its stage rows
    // (the block's head and foot stay where they are; the sheet's title and
    // way in come up in the column on their own). The rows are flat on the
    // screen, so there is no rise and no coming to the front: a row is
    // hidden the moment its container, wearing a copy of it, takes its
    // place.
    function flatSource(button) {
      const rows = [...button.querySelectorAll("[data-flat-part]")].slice(1, -1);
      const look = getComputedStyle(button);
      const ground = (look.backgroundColor.match(/[\d.]+/g) ?? [255, 255, 255]).slice(0, 3).map(Number);
      let rects = [];
      return {
        count: rows.length,
        origin: 0,
        solid: true,
        basis: [1, 0, 0, 1],
        begin() {
          rects = rows.map((row) => row.getBoundingClientRect());
        },
        box(i) {
          return { w: rects[i].width, h: rects[i].height, r: 0, ground };
        },
        at(i) {
          return [rects[i].left, rects[i].top];
        },
        face(i) {
          const top = rows[i].cloneNode(true);
          top.removeAttribute("data-flat-part");
          Object.assign(top.style, { width: `${rects[i].width}px`, height: `${rects[i].height}px`, boxSizing: "border-box", color: look.color });
          for (const name of ["--tone-ink", "--line"]) top.style.setProperty(name, look.getPropertyValue(name));
          const mark = rows[i].querySelector(".sd-flat__mark")?.getBoundingClientRect();
          return { top, mark: mark ? { x: mark.left - rects[i].left, y: mark.top - rects[i].top, size: mark.width } : null };
        },
        veil: () => 0,
        hold(i, _rise, _dx, _dy, covered) {
          rows[i].style.visibility = covered ? "hidden" : "";
        },
        commit() {},
        end(opened) {
          rows.forEach((row) => (row.style.visibility = opened ? "hidden" : ""));
        },
      };
    }
    // the sheet closed: the row (or the list) as it was, scrolling again
    function release() {
      if (!chosen) return;
      chosen = null;
      if (viewing === "3d") {
        rowLenis?.start();
        stage.focus({ preventScroll: true });
      } else listLenis?.start();
      wake();
    }

    // ---- the two views -------------------------------------------------
    let viewTimer = 0;
    function setView(v) {
      if (!flat || v === viewing || chosen) return;
      viewing = v;
      clearTimeout(viewTimer);
      viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewSet === v)));
      if (v === "flat") {
        setHover(null);
        showInfo(null);
        flat.hidden = false;
        stage.setAttribute("aria-hidden", "true");
        stage.tabIndex = -1;
        rowLenis?.stop();
        listLenis ??= new Lenis({ wrapper: flat, content: flat.firstElementChild, lerp: reduced ? 1 : LERP });
        listLenis.resize();
        listLenis.start();
        // shown in the next frame, so its fade runs from nothing
        requestAnimationFrame(() => (root.dataset.view = "flat"));
        stop();
        say(`The stacks as a list: ${groups.length} stacks`);
      } else {
        root.dataset.view = "3d";
        stage.removeAttribute("aria-hidden");
        stage.tabIndex = 0;
        listLenis?.stop();
        rowLenis?.start();
        viewTimer = setTimeout(() => (flat.hidden = true), reduced ? 0 : 420);
        wake();
        say("The stacks as a row of cards");
      }
    }

    // ---- input ---------------------------------------------------------
    // The wheel and a finger are Lenis's (above); the keys move it a card
    // (or five) at a time, on the same lerp.
    const cardAt = (slot) => cards.find((c) => Math.abs(wrap(c.slot - slot)) < 0.5);
    const onKey = (e) => {
      if (chosen || !rowLenis) return;
      const step = { ArrowRight: 1, ArrowDown: 1, PageDown: 5, ArrowLeft: -1, ArrowUp: -1, PageUp: -5 }[e.key];
      const at = rowLenis.targetScroll;
      if (step) {
        e.preventDefault();
        rowLenis.scrollTo(Math.round(at / STEP + step) * STEP);
      } else if (e.key === "Home") {
        e.preventDefault();
        rowLenis.scrollTo(N * STEP * Math.round(at / (N * STEP)));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const c = cardAt(Math.round(pos));
        if (c?.group) choose(c.group);
        else if (c) say(`${c.name} is not in a curated stack yet`);
      }
    };
    // a pointer: hover with a mouse; a tap or a click opens
    const local = (e) => {
      if (e.target === canvas) return [e.offsetX, e.offsetY];
      const r = stage.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      [px, py] = local(e);
      if (e.pointerType === "mouse" && !chosen) setHover(hit(px, py));
    };
    const onLeave = () => {
      px = py = -1;
      setHover(null);
    };
    // A click opens what was drawn under the pointer when it was pressed:
    // the row can still be gliding (Lenis) between the press and the
    // release, and the card then under the pointer is not the one aimed at.
    // A press that moved (a drag on a touch screen) is tested where it ends.
    let down = null;
    const onDown = (e) => {
      if (chosen) return;
      const [x, y] = local(e);
      down = { at: pick(x, y), x, y };
    };
    const onClick = (e) => {
      const pressed = down;
      down = null;
      if (chosen) return;
      const [x, y] = local(e);
      const at = pressed && Math.hypot(x - pressed.x, y - pressed.y) < 8 ? pressed.at : pick(x, y);
      if (at?.c.group) choose(at.c.group, null, at);
    };
    const onFlatGo = (e) => {
      const button = e.currentTarget;
      choose(groups[Number(button.dataset.flatGo)], flatSource(button));
    };
    const onViewSet = (e) => setView(e.currentTarget.dataset.viewSet);

    // ---- the stack under the pointer, in a few words -------------------
    // Its name and what it is for (its summary: the Studio's words, or the
    // sample's), in a small box on the ground over the Free Stack, out of
    // the row's way (stack-space.css: .sd__info): up while the pointer is on
    // one of its cards (and the moment after), its words changed in place
    // when the pointer moves on to another stack. Written only when the
    // stack changes, never in a frame that merely moves.
    const info = root.querySelector("[data-stack-info]");
    const infoBody = info?.querySelector("[data-info-body]");
    const infoName = info?.querySelector("[data-info-name]");
    const infoText = info?.querySelector("[data-info-text]");
    let infoFor = null;
    function showInfo(g) {
      if (!info || g === infoFor) return;
      const was = infoFor;
      infoFor = g;
      info.classList.toggle("is--shown", Boolean(g));
      if (!g) return;
      infoName.textContent = g.name;
      infoText.textContent = g.short || g.summary || "";
      // from one stack to the next: its words come in where the last were
      if (was && !reduced) infoBody.animate([{ opacity: 0, transform: "translateY(0.25rem)" }, { opacity: 1, transform: "none" }], { duration: 280, easing: "cubic-bezier(0.2, 0.9, 0.24, 1)" });
    }

    // ---- the loop ------------------------------------------------------
    let running = false;
    let lastSaid = null;
    function say(text) {
      if (live) live.textContent = text;
    }
    function tick(_time, deltaMs) {
      const dt = Math.min(deltaMs, 50) / 1000;
      // the reading position, where Lenis has the row now
      let moving = Boolean(rowLenis?.isScrolling);
      // what the pointer is over, as the row moves under it
      if (moving && px >= 0 && !chosen) {
        const c = hit(px, py);
        if (c !== hover) {
          hover = c;
          stage.style.cursor = c?.group ? "pointer" : "";
        }
      }
      // the stack read: the pointer's (held a moment once it leaves its
      // cards), else the one at the row's middle; each stack easing to full
      // strength or to faded
      const pointed = hover?.group ?? null;
      if (pointed) {
        held = pointed;
        heldFor = HOVER_HOLD;
      } else if (held) {
        heldFor -= dt;
        if (heldFor <= 0) held = null;
        else moving = true;
      }
      centre = centreOf();
      const lead = chosen ?? held ?? centre;
      for (const g of groups) {
        const to = g === lead ? 1 : 0;
        if (g.read !== to) {
          g.read += (to - g.read) * (reduced ? 1 : ease(g === chosen ? RATE_READ * 3 : RATE_READ, dt));
          if (Math.abs(to - g.read) < 0.004) g.read = to;
          else moving = true;
        }
      }
      showInfo(chosen ? null : held);
      // per card: its lift, up under the pointer, and its stack's others a
      // little up with it, the farther ones a touch behind
      for (const c of cards) {
        // a chosen stack's cards are the flight's (rowSource().hold())
        if (chosen && c.group === chosen) continue;
        const kin = hover && c !== hover && hover.group && c.group === hover.group;
        const to = c === hover ? LIFT : kin ? LIFT_KIN : 0;
        const away = kin ? Math.abs(wrap(c.slot - hover.slot)) : 0;
        if (c.lift === to) continue;
        const nv = c.lift + (to - c.lift) * (reduced ? 1 : ease(RATE_LIFT / (1 + KIN_LAG * away), dt));
        c.lift = Math.abs(to - nv) < 0.0005 ? to : nv;
        if (c.lift !== to) moving = true;
      }
      // (a flight draws the row itself, once it has placed its cards:
      // rowSource().commit())
      if (!flying) draw();
      // the card now read, said once the row has settled on it
      if (!moving && !chosen) {
        const c = cardAt(Math.round(pos));
        if (c && c !== lastSaid) {
          lastSaid = c;
          say(c.kind === "locked" ? `${c.stage}, a locked stage in ${c.group.name}` : `${c.name}, ${c.category}${c.group ? `, in ${c.group.name}` : ""}`);
        }
      }
      if (!moving) stop();
    }
    function wake() {
      if (running || viewing !== "3d") return;
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
      fitRoom();
      draw();
      wake();
    });
    sized.observe(stage);
    measure();
    draw();
    wake();
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      measure();
      draw();
      wake();
    });

    stage.addEventListener("keydown", onKey);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("click", onClick);
    flatGoes.forEach((b) => b.addEventListener("click", onFlatGo));
    viewButtons.forEach((b) => b.addEventListener("click", onViewSet));

    // For tests in development only (never in a build): what is drawn at a
    // point, found from a redraw of the row in flat colours, one to a stack,
    // in draw()'s own order and shapes (independent of pick()); and the
    // cards' state, to catch any left out of the row or lifted.
    if (import.meta.env.DEV) {
      const buf = document.createElement("canvas");
      root.__sd = {
        drawn(x, y) {
          buf.width = Math.max(1, Math.round(view.w));
          buf.height = Math.max(1, Math.round(view.h));
          const b = buf.getContext("2d", { willReadFrequently: true });
          const places = [];
          for (const c of cards) if (!c.away) places.push(...placesOf(c));
          places.sort((p, q) => q.s - p.s);
          for (const p of places) {
            const [tl, tr, , bl] = shown(p.c, p.s);
            b.setTransform((tr[0] - tl[0]) / view.cw, (tr[1] - tl[1]) / view.cw, (bl[0] - tl[0]) / view.ch, (bl[1] - tl[1]) / view.ch, tl[0], tl[1]);
            b.fillStyle = `rgb(${(p.c.group?.index ?? -1) + 1}, 0, 0)`;
            b.fill(view.cardPath);
          }
          const [r, , , a] = b.getImageData(Math.round(x), Math.round(y), 1, 1).data;
          return { stack: r ? groups[r - 1].name : null, edge: a > 0 && a < 255 };
        },
        // a stack's k-th card as drawn now: its four corners on the page
        // (at the place nearest the middle), and whether it is out of the row
        // (near: a point on the page, for the place nearest it rather than
        // the one nearest the middle)
        card(name, k, near) {
          const c = cards.filter((x) => x.group?.name === name)[k];
          const r = stage.getBoundingClientRect();
          const far = (p) => {
            if (!near) return Math.abs(p.s);
            const [x, y] = shown(c, p.s)[0];
            return Math.hypot(x + r.left - near[0], y + r.top - near[1]);
          };
          const p = c && placesOf(c).sort((a, b) => far(a) - far(b))[0];
          if (!p) return null;
          return { away: Boolean(c.away), q: shown(c, p.s).map(([x, y]) => [x + r.left, y + r.top]) };
        },
        state() {
          return {
            chosen: chosen?.name ?? null,
            away: cards.filter((c) => c.away).length,
            flying,
            carried: cards.filter((c) => c.dx || c.dy).length,
            lifted: cards.filter((c) => c.lift > 0.001 && !(hover && (c === hover || c.group === hover.group))).length,
            pos,
          };
        },
      };
    }

    registerPageCleanup(() => {
      alive = false;
      stop();
      clearTimeout(viewTimer);
      gsap.ticker.remove(rafLenis);
      rowLenis?.destroy();
      listLenis?.destroy();
      sheet?.destroy();
      sized.disconnect();
      stage.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("click", onClick);
      flatGoes.forEach((b) => b.removeEventListener("click", onFlatGo));
      viewButtons.forEach((b) => b.removeEventListener("click", onViewSet));
      root.stackSpace = false;
    });
  });
}
