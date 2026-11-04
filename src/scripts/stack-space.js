/* ============================================================
   Stack space — the Free Tech Stacks page's one screen
   (stack-diagnostic.astro; styles: stack-space.css; the data:
   src/data/stack-ecosystem.ts and the Studio's tech stacks; the sheet a
   stack opens: stack-sheet.js)
   ------------------------------------------------------------
   Fourth pass (2026-11-04), after the user's brief and a reference of CD
   cases standing in a row: every card is one piece of software, and every
   card belongs to a curated stack. The cards stand upright, close
   together, in one long row seen from a little above and to the right
   with no perspective, their faces turned nearly to the viewer (as the
   cases' covers are), the row climbing from off the screen's bottom-left
   to off its top-right. The row has no ends: it goes round (each card at
   its slot less the reading position, wrapped round the number of
   cards), so moving through it never meets a last card.

   Stacks in the row: a stack's cards stand together at the row's own
   spacing (no gap between stacks: the colour tells them apart), each in
   the stack's own colour (a solid block, by the stack's place: white,
   black, the greys, a muted blue…; STACK_TONES), with a dotted bracket on
   the ground beside them and the stack's name at its near end. A card is
   laid out as a business card: its mark (the product's own, or its
   initials in a plain square) and its name at the top, its role under
   them, its number in the stack at the top right, a hairline, and at its
   foot a band with the stack's name. The tools a stack holds back until
   the visitor is in the ADDD app are cards with the SVG Collection's lock
   and no name.

   The pointer: the card under it slides out of the row to the right,
   along its own face, as a card pulled from a stack does (a spring, a
   little resistance, no overshoot to speak of), and slides back when the
   pointer moves on; its neighbours stay where they are. Pressing any card
   of a stack opens the stack's sheet straight out of its cards, from
   wherever they stand on the screen (stack-sheet.js: each container grows
   from its card), with no glide to the middle first; closing sends them
   back into the row.

   The wheel (and a finger, and the arrow keys) move through the row: the
   reading position eases after where the input has taken it, with a
   little momentum carried on as the input stops, then settles on a card.
   The stage takes the wheel itself (data-lenis-prevent: Lenis leaves it
   alone, and the page does not scroll), so there is one scroll system
   here and one loop.

   The flat view (the switch under the title): the same stacks as a list
   of blocks (stack-diagnostic.astro renders it from the same data); this
   script switches between the two, sleeps the row while the list shows,
   and opens a block's stack out of the block's own rows.

   How it is built, for speed:
   - One canvas draws the whole row, back to front, each card on its own
     plane (an affine transform per card): one layer and one pass. Each
     card's thickness is two thin faces (its top and right edges) drawn
     under its face: the cards part from one another by their edges, with
     no shadows.
   - Every face is painted once into an atlas whenever the cards change
     size, a mark arrives or the fonts come; each frame places it with one
     image drawn. The stacks' names, likewise, from an atlas of their own.
   - Everything moves from a few numbers on the GSAP ticker: the reading
     position, and per card its slide (a spring). The loop sleeps as soon
     as nothing is moving and wakes on input; it is asleep while the sheet
     or the list is up.
   - The pointer is tested against each card's resting shape, front to
     back (the card already out first), in plain arithmetic: no layout is
     read while it moves.
   Under reduced motion everything still works, without the glides. The
   listeners, the loop and the observer go with the page.
   ============================================================ */
import { motion, registerPageCleanup } from "./page.js";
import { mountStackSheet } from "./stack-sheet.js";

// the view: the row's azimuth (degrees: 0 would face the cards square on)
// and the view's elevation (its sine): the cards' faces nearly to the
// viewer, their tops a little seen, the row climbing at about 42°
const THETA = (27 * Math.PI) / 180;
const SIN_E = 0.455;
const COS_E = Math.sqrt(1 - SIN_E * SIN_E);
const SIN_T = Math.sin(THETA);
const COS_T = Math.cos(THETA);
// where the row passes the screen's middle (shares of its width and height)
const ORIGIN = [0.56, 0.56];
// the cards: width as a share of the screen's (held between a least and a
// most, px), height to width, corner radius and thickness (card widths)
const CARD_SHARE = 0.17;
const CARD_SHARE_SMALL = 0.36;
const CARD_MIN = 150;
const CARD_MAX = 330;
const CARD_RATIO = 0.62;
const RADIUS = 0.022;
const THICK = 0.014;
// the row: each card this far behind the one before (card widths)
const SPACING = 0.3;
// the hover: how far the card under the pointer slides out (card widths),
// and its spring (stiffness, damping: a touch under critical, for weight)
const SLIDE = 0.4;
const SPRING_K = 230;
const SPRING_C = 29;
// the wheel: px to a card; how long after the last input the row settles
// on a card (ms), how far the input's own speed carries it on (seconds of
// it, up to MOMENTUM_MAX cards), and how fast the row follows (per second)
const WHEEL_STEP = 70;
const SETTLE_MS = 170;
const MOMENTUM = 0.16;
const MOMENTUM_MAX = 5;
const RATE_POS = 7.5;
const RATE_HOVER = 12;
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
const TONE_FREE = { ground: "#f2f2ef", ink: "#0a0a0a" };
// the SVG Collection's lock (no. 026, dash-type-btn__locked, 18 × 18)
const LOCK = [
  "M12.75 15.75H5.25C4.42125 15.75 3.75 15.0787 3.75 14.25V9C3.75 8.17125 4.42125 7.5 5.25 7.5H12.75C13.5788 7.5 14.25 8.17125 14.25 9V14.25C14.25 15.0787 13.5788 15.75 12.75 15.75Z",
  "M6 7.5V5.25C6 3.59325 7.34325 2.25 9 2.25C10.6567 2.25 12 3.59325 12 5.25V7.5",
];

const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
const pad2 = (n) => String(n).padStart(2, "0");

// a colour as [r, g, b], and one mixed towards another by t
const rgbOf = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const isDark = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b < 140;

// a tool's initials, for the square kept for its mark
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
    const flat = root.querySelector("[data-stack-flat]");
    const viewButtons = [...root.querySelectorAll("[data-view-set]")];
    const flatGoes = [...root.querySelectorAll("[data-flat-go]")];
    const css = getComputedStyle(root);
    const fonts = {
      display: css.getPropertyValue("--font-display").trim() || "sans-serif",
      mono: css.getPropertyValue("--font-mono").trim() || "monospace",
    };

    // ---- the data: the stacks' cards (or, with none, the software) ------
    // Each stack's cards stand together in the row, its named tools first
    // and then one locked card for each tool held back. A tool named by two
    // stacks stands in each: a card belongs to the stack it stands in,
    // which is the one it opens. Software stands on its own only where no
    // stack is published (production, for now).
    const data = JSON.parse(dataEl.textContent);
    const groups = (data.stacks ?? []).map((s, i) => ({ ...s, index: i, hov: 0, rgb: rgbOf(s.tone.ground) }));
    const cards = [];
    groups.forEach((g) => {
      g.a = cards.length;
      g.preview.forEach((t, k) => cards.push({ kind: "tool", name: t.name, category: t.category, logo: t.logo, group: g, n: k + 1 }));
      for (let k = g.preview.length; k < g.toolCount; k++) cards.push({ kind: "locked", group: g, n: k + 1 });
      g.b = cards.length - 1;
    });
    (data.tools ?? []).forEach((t) => cards.push({ kind: "tool", name: t.name, category: t.category, logo: t.logo, group: null, n: 0 }));
    const N = cards.length;
    if (!N) return;
    root.stackSpace = true;
    cards.forEach((c, i) => {
      c.slot = i;
      c.initials = c.name ? initialsOf(c.name) : "";
      c.tone = c.group ? c.group.tone : TONE_FREE;
      c.rgb = rgbOf(c.tone.ground);
      c.dark = isDark(c.rgb);
      // the slide (px along its face) and its speed; the edges' colours
      c.x = 0;
      c.v = 0;
      c.edgeTop = mix(c.rgb, c.dark ? [255, 255, 255] : [0, 0, 0], c.dark ? 0.16 : 0.07);
      c.edgeSide = mix(c.rgb, c.dark ? [255, 255, 255] : [0, 0, 0], c.dark ? 0.08 : 0.15);
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
    let target = 0;
    let hover = null;
    // the stack open (its sheet up, or on its way), and the view shown
    let chosen = null;
    let viewing = "3d";

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
      view.cw = Math.min(CARD_MAX, Math.max(CARD_MIN, r.width * (r.width < 992 ? CARD_SHARE_SMALL : CARD_SHARE)));
      view.ch = view.cw * CARD_RATIO;
      view.cx = r.width * ORIGIN[0];
      view.cy = r.height * ORIGIN[1];
      view.sp = view.cw * SPACING;
      // how far along the row (its own units) the screen reaches from the
      // middle, a card's size past it
      view.along = Math.hypot(SIN_T, COS_T * SIN_E);
      view.limit = (Math.hypot(r.width, r.height) * 0.6 + view.cw * 1.4) / view.along;
      // each name's size, shrunk where a long one would run off its card
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = `400 ${view.cw * FACE_NAME}px ${fonts.display}`;
      const room = view.cw * (1 - 2 * FACE_M - FACE_LOGO - FACE_GAP);
      cards.forEach((c) => (c.nameScale = c.name ? Math.min(1, room / Math.max(1, ctx.measureText(c.name).width)) : 1));
      paintFaces();
      paintLabels();
    }
    const P = (x, y, z) => [view.cx + x * COS_T - y * SIN_T, view.cy + (x * SIN_T + y * COS_T) * SIN_E - z * COS_E];

    // a card's four corners on the screen (top-left, top-right, bottom-right,
    // bottom-left): standing at s along the row, slid out by x, its face at
    // depth y less back
    function corners(s, x = 0, back = 0) {
      const { cw, ch } = view;
      const y = -s - back;
      return [P(x - cw / 2, y, ch / 2), P(x + cw / 2, y, ch / 2), P(x + cw / 2, y, -ch / 2), P(x - cw / 2, y, -ch / 2)];
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
      // the card already out, where it is now (so the pointer following it
      // out keeps it), then front to back: the nearer the bottom-left, the
      // nearer the eye
      if (hover) {
        const near = placesOf(hover).sort((p, q) => Math.abs(p.s) - Math.abs(q.s));
        for (const p of near) {
          // in front of it, only the cards nearer the eye could cover it
          const front = cards.some((c) => c !== hover && placesOf(c).some((o) => o.s < p.s && inside(corners(o.s), x, y)));
          if (!front && inside(corners(p.s, hover.x), x, y)) return hover;
        }
      }
      let best = null;
      let bestS = Infinity;
      for (const c of cards) {
        for (const p of placesOf(c)) {
          if (p.s < bestS && inside(corners(p.s), x, y)) {
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
    // unit of the card, whenever the cards change size, a mark comes or the
    // fonts come; each frame then places it on its card's plane with one
    // image drawn. The locked cards share a face for each stack.
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");
    const ATLAS_COLS = 6;
    const lockPaths = LOCK.map((d) => new Path2D(d));
    function paintFaces() {
      const { cw, ch } = view;
      const k = Math.min(1.5, view.dpr || 1);
      const pad = 2;
      const w = Math.ceil((cw + 2 * pad) * k) + 2;
      const h = Math.ceil((ch + 2 * pad) * k) + 2;
      const faces = [];
      const lockedBy = new Map();
      cards.forEach((c) => {
        if (c.kind !== "locked") return faces.push(c);
        // one face for each stack's locked cards (the number aside)
        const key = c.group.index;
        if (!lockedBy.has(key)) {
          const face = { kind: "locked", group: c.group, tone: c.tone, rgb: c.rgb, dark: c.dark };
          lockedBy.set(key, face);
          faces.push(face);
        }
        c.face = lockedBy.get(key);
      });
      atlas.width = w * ATLAS_COLS;
      atlas.height = h * Math.ceil(faces.length / ATLAS_COLS);
      view.face = { k, pad };
      faces.forEach((f, i) => {
        f.sx = (i % ATLAS_COLS) * w + 1 + pad * k;
        f.sy = Math.floor(i / ATLAS_COLS) * h + 1 + pad * k;
        paintFace(f);
      });
    }
    function paintFace(c) {
      const { cw, ch } = view;
      const { k, pad } = view.face;
      const x = actx;
      const ink = c.tone.ink;
      const inkRgb = rgbOf(ink).join(", ");
      const shade = (a) => `rgba(${inkRgb}, ${a})`;
      x.setTransform(k, 0, 0, k, c.sx, c.sy);
      x.clearRect(-pad - 1, -pad - 1, cw + 2 * pad + 2, ch + 2 * pad + 2);
      const r = cw * RADIUS;
      // the card, a solid block of its stack's colour, a hairline round it
      // where it would otherwise melt into the one behind
      x.save();
      x.beginPath();
      x.roundRect(0, 0, cw, ch, r);
      x.fillStyle = c.tone.ground;
      x.fill();
      x.clip();
      // the band at its foot: the stack's name on a step of the colour
      const bandY = ch * (1 - FACE_BAND);
      x.fillStyle = mix(c.rgb, c.dark ? [255, 255, 255] : [0, 0, 0], c.dark ? 0.07 : 0.045);
      x.fillRect(0, bandY, cw, ch - bandY);
      x.restore();
      x.beginPath();
      x.roundRect(0.5, 0.5, cw - 1, ch - 1, r);
      x.strokeStyle = c.dark ? "rgba(255, 255, 255, 0.08)" : "rgba(10, 10, 10, 0.1)";
      x.lineWidth = 1;
      x.stroke();

      const m = cw * FACE_M;
      const l = cw * FACE_LOGO;
      const small = cw * FACE_SMALL;
      // the hairline over the band
      x.fillStyle = shade(c.dark ? 0.14 : 0.1);
      x.fillRect(m, bandY - 1, cw - 2 * m, 1);
      // in the band, the stack's name, and the card's number in it
      if (c.group) {
        x.fillStyle = shade(0.62);
        x.font = `400 ${small}px ${fonts.mono}`;
        x.textBaseline = "middle";
        x.textAlign = "left";
        x.fillText(c.group.name.toUpperCase(), m, bandY + (ch - bandY) / 2);
      }
      // in the band, on the right: its number in the stack (a locked
      // card's is drawn over its shared face: drawCard)
      if (c.n) {
        x.fillStyle = shade(0.5);
        x.font = `400 ${small}px ${fonts.mono}`;
        x.textAlign = "right";
        x.textBaseline = "middle";
        x.fillText(`${pad2(c.n)}/${pad2(c.group.toolCount)}`, cw - m, bandY + (ch - bandY) / 2);
      }
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
        // quiet bars where its name and role would be; nothing that says
        // what it is
        const nx = m + l + cw * FACE_GAP;
        x.fillStyle = shade(0.12);
        x.beginPath();
        x.roundRect(nx, m + l * 0.12, cw * 0.32, l * 0.26, l * 0.06);
        x.fill();
        x.fillStyle = shade(0.07);
        x.beginPath();
        x.roundRect(nx, m + l * 0.6, cw * 0.2, l * 0.18, l * 0.05);
        x.fill();
        x.fillStyle = shade(0.4);
        x.font = `400 ${small}px ${fonts.mono}`;
        x.textAlign = "left";
        x.textBaseline = "alphabetic";
        x.fillText("IN THE FULL STACK", m, bandY - m * 0.7);
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
      const nx = m + l + cw * FACE_GAP;
      x.fillStyle = ink;
      x.font = `400 ${cw * FACE_NAME * c.nameScale}px ${fonts.display}`;
      x.textAlign = "left";
      x.textBaseline = "middle";
      x.fillText(c.name, nx, m + l * 0.34);
      if (c.category) {
        x.fillStyle = shade(0.52);
        x.font = `400 ${small}px ${fonts.mono}`;
        x.textBaseline = "middle";
        let role = c.category.toUpperCase();
        const most = cw - nx - m;
        while (role.length > 4 && x.measureText(role).width > most) role = role.slice(0, -2) + "…";
        x.fillText(role, nx, m + l * 0.82);
      }
    }
    // Each stack's name, for the near end of its bracket: painted once,
    // upright, at the screen's pixels, quiet and in the ink (the stack under
    // the pointer), and placed with one image each frame.
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
          lctx.fillStyle = `rgba(10, 10, 10, ${a})`;
          lctx.fillText(g.name.toUpperCase(), 2, (size * 1.6) / 2);
        });
        g.label = { sy: i * 2 * cell, w: Math.ceil((widths[i] + 4) * dpr), h: cell };
      });
    }
    // a card on the screen: its two edges (top and right, its thickness),
    // then its face from the atlas on its own plane
    function drawCard(c, s) {
      const { cw, ch, dpr } = view;
      const q = corners(s, c.x);
      const b = corners(s, c.x, cw * THICK);
      const inset = cw * RADIUS * 0.7;
      const along = (p, o, t) => [p[0] + (o[0] - p[0]) * t, p[1] + (o[1] - p[1]) * t];
      const ti = inset / cw;
      const si = inset / ch;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // its top edge, from just in from either corner
      ctx.beginPath();
      [along(q[0], q[1], ti), along(q[1], q[0], ti), along(b[1], b[0], ti), along(b[0], b[1], ti)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.fillStyle = c.edgeTop;
      ctx.fill();
      // its right edge
      ctx.beginPath();
      [along(q[1], q[2], si), along(q[2], q[1], si), along(b[2], b[1], si), along(b[1], b[2], si)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.fillStyle = c.edgeSide;
      ctx.fill();
      const f = c.face ?? c;
      const { k, pad } = view.face;
      plane(q);
      ctx.drawImage(atlas, f.sx - pad * k, f.sy - pad * k, (cw + 2 * pad) * k, (ch + 2 * pad) * k, -pad, -pad, cw + 2 * pad, ch + 2 * pad);
      // a locked card's number, which its shared face leaves out
      if (c.kind === "locked") {
        ctx.fillStyle = c.dark ? "rgba(255, 255, 255, 0.45)" : "rgba(10, 10, 10, 0.45)";
        ctx.font = `400 ${cw * FACE_SMALL}px ${fonts.mono}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const m = cw * FACE_M;
        ctx.fillText(`${pad2(c.n)}/${pad2(c.group.toolCount)}`, cw - m, ch * (1 - FACE_BAND / 2));
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
      ctx.fillStyle = `rgba(10, 10, 10, ${(0.3 + 0.4 * g.hov).toFixed(3)})`;
      ctx.fill(dots);
      if (g.label) {
        const { sy, w, h } = g.label;
        const x = near[0] + 0.5 * view.rem;
        const y = near[1] + 0.25 * view.rem;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(labels, 0, sy + (g.hov > 0.5 ? h : 0), w, h, Math.round(x * dpr), Math.round(y * dpr), w, h);
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
      for (const p of places) if (!p.c.group?.hidden) drawCard(p.c, p.s);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---- a stack opened ------------------------------------------------
    const sheetEl = root.querySelector("[data-stack-sheet]");
    const sheet = sheetEl ? mountStackSheet(sheetEl, data) : null;
    function choose(g, from) {
      if (!g || chosen || !sheet) return;
      chosen = g;
      clearTimeout(settling);
      // the row stays where it is: the sheet comes straight out of the
      // cards (or the list's rows) as they stand
      target = pos;
      say(`${g.name}: ${g.toolCount} tools`);
      sheet.open(g, release, from ?? rowMorph(g));
      // the card under the pointer stays out while its container leaves it
      stop();
    }
    // What the sheet needs to grow out of the stack's cards and go back into
    // them (stack-sheet.js): where its head, each tool's container (named,
    // then locked) and its way in come from, as four corners on the screen
    // (the head from the stack's middle card, each tool from its own, the
    // way in from its last), and a way to take the cards out of the row
    // while their containers are out.
    function rowMorph(g) {
      return {
        quads() {
          const r = stage.getBoundingClientRect();
          const items = cards.filter((c) => c.group === g).map((c) => {
            const p = placesOf(c).sort((x, y) => Math.abs(x.s) - Math.abs(y.s))[0];
            const q = p ? corners(p.s, c.x) : corners(0);
            return q.map(([x, y]) => [x + r.left, y + r.top]);
          });
          return { head: items[Math.floor((items.length - 1) / 2)], items, cta: items[items.length - 1], tone: g.tone };
        },
        // drawn at once, so the row and the sheet change in the same frame
        hide(on) {
          g.hidden = on;
          draw();
        },
      };
    }
    // the same from the list: each part of a stack's block (its head, its
    // rows, its way in) the corners of its own box
    function flatMorph(button) {
      const parts = [...button.querySelectorAll("[data-flat-part]")];
      const quad = (el) => {
        const b = el.getBoundingClientRect();
        return [[b.left, b.top], [b.right, b.top], [b.right, b.bottom], [b.left, b.bottom]];
      };
      return {
        quads() {
          const qs = parts.map(quad);
          return { head: qs[0], items: qs.slice(1, -1), cta: qs[qs.length - 1], tone: null };
        },
        hide(on) {
          button.style.visibility = on ? "hidden" : "";
        },
      };
    }
    // the sheet closed: the row (or the list) as it was
    function release() {
      if (!chosen) return;
      chosen = null;
      if (viewing === "3d") stage.focus({ preventScroll: true });
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
        flat.hidden = false;
        stage.setAttribute("aria-hidden", "true");
        stage.tabIndex = -1;
        // shown in the next frame, so its fade runs from nothing
        requestAnimationFrame(() => (root.dataset.view = "flat"));
        stop();
        say(`The stacks as a list: ${groups.length} stacks`);
      } else {
        root.dataset.view = "3d";
        stage.removeAttribute("aria-hidden");
        stage.tabIndex = 0;
        viewTimer = setTimeout(() => (flat.hidden = true), reduced ? 0 : 420);
        wake();
        say("The stacks as a row of cards");
      }
    }

    // ---- input ---------------------------------------------------------
    let settling = 0;
    // the input's own speed (cards a second), for the momentum it leaves
    let velocity = 0;
    let lastInput = 0;
    function nudge(by) {
      if (chosen || viewing !== "3d") return;
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastInput) / 1000);
      lastInput = now;
      const v = by / dt;
      velocity = dt > 0.2 ? v : velocity * 0.6 + v * 0.4;
      target += by;
      clearTimeout(settling);
      settling = setTimeout(() => {
        // carried on a little by how fast the input was going, then onto
        // the nearest card
        const carry = Math.max(-MOMENTUM_MAX, Math.min(MOMENTUM_MAX, velocity * MOMENTUM));
        target = Math.round(target + (reduced ? 0 : carry));
        velocity = 0;
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
    // a pointer: hover with a mouse; a finger drags through the row, a tap opens
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
    const onFlatGo = (e) => {
      const button = e.currentTarget;
      choose(groups[Number(button.dataset.flatGo)], flatMorph(button));
    };
    const onViewSet = (e) => setView(e.currentTarget.dataset.viewSet);

    // ---- the loop ------------------------------------------------------
    let running = false;
    let lastSaid = null;
    function say(text) {
      if (live) live.textContent = text;
    }
    function tick(_time, deltaMs) {
      const dt = Math.min(deltaMs, 50) / 1000;
      let moving = false;
      // the reading position after the input
      pos += (target - pos) * (reduced ? 1 : ease(RATE_POS, dt));
      if (Math.abs(target - pos) < 0.0005) pos = target;
      if (pos !== target) moving = true;
      // what the pointer is over, as the row moves under it
      if (moving && px >= 0 && !chosen) {
        const c = hit(px, py);
        if (c !== hover) {
          hover = c;
          stage.style.cursor = c?.group ? "pointer" : "";
        }
      }
      // per stack: its bracket lit while the pointer is on one of its cards
      for (const g of groups) {
        const to = hover?.group === g ? 1 : 0;
        if (g.hov !== to) {
          g.hov += (to - g.hov) * (reduced ? 1 : ease(RATE_HOVER, dt));
          if (Math.abs(to - g.hov) < 0.01) g.hov = to;
          else moving = true;
        }
      }
      // per card: its slide, on its spring, out under the pointer
      const out = SLIDE * view.cw;
      for (const c of cards) {
        const to = c === hover && c.group ? out : c === hover ? out * 0.35 : 0;
        if (c.x === to && !c.v) continue;
        if (reduced) {
          c.x = to;
          c.v = 0;
          continue;
        }
        // in small steps, so the spring is steady whatever the frame rate
        const steps = Math.max(1, Math.ceil(dt / 0.008));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          c.v += (SPRING_K * (to - c.x) - SPRING_C * c.v) * h;
          c.x += c.v * h;
        }
        if (Math.abs(to - c.x) < 0.05 && Math.abs(c.v) < 0.5) {
          c.x = to;
          c.v = 0;
        } else moving = true;
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
      draw();
      wake();
    });
    sized.observe(stage);
    measure();
    // the row starts on the first stack, so a stack and its bracket are
    // the first thing in the middle
    if (groups.length) pos = target = Math.round((groups[0].a + groups[0].b) / 2);
    draw();
    wake();
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      measure();
      draw();
      wake();
    });

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKey);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("click", onClick);
    flatGoes.forEach((b) => b.addEventListener("click", onFlatGo));
    viewButtons.forEach((b) => b.addEventListener("click", onViewSet));

    registerPageCleanup(() => {
      alive = false;
      stop();
      clearTimeout(settling);
      clearTimeout(viewTimer);
      sheet?.destroy();
      sized.disconnect();
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("click", onClick);
      flatGoes.forEach((b) => b.removeEventListener("click", onFlatGo));
      viewButtons.forEach((b) => b.removeEventListener("click", onViewSet));
      root.stackSpace = false;
    });
  });
}
