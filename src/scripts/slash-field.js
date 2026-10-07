/* ============================================================
   Slash Field — a grid of / | \ strokes, and the words set in it
   ------------------------------------------------------------
   Built to the supplied Slash Field spec: a static, stable grid of
   thin canvas strokes filling a container (deterministic per cell,
   batched into one path per colour, scaled for the device pixel
   ratio, resized by a ResizeObserver). The strokes never move; only
   their tint does.

   Where it departs from the spec:

     - it is mounted per element by the page registry in site.js
       (initSlashField), not on DOMContentLoaded: Barba replaces the
       page, so each mount hands back destroy() for registerPageCleanup;
       the window.SlashField global is left out;
     - the pattern runs on past the container's edges, which crop it:
       the canvas is a couple of cells larger than the container on
       every side and sits under it, the container's overflow clipping
       it, so the strokes carry on behind each edge rather than the
       pattern ending on a seam of its own. The cells keep the spec's
       size exactly, and the grid is shifted so each edge cuts through
       its strokes part-way, never along the gap between two cells or
       down a straight stroke, where it would read as a border;
     - the hover is a small, clear-cut cluster rather than a glow: of
       the cells close to the pointer, a scattered selection (all of them
       at its centre, fewer towards the edge, chosen per cell by the same
       hash as the pattern) switches to the highlight colour, and fades
       back once the pointer has moved on;
     - words sit in the field. Every [data-slash-label] inside the
       container is real text placed on the grid at its spot,
       data-slash-spot="fx,fy" (its centre, as fractions of the
       container): on a cell boundary and the middle of a row, whole
       inside the container, clear of the other words and on a row of its own
       where there is one. The pattern stops around it — its cells and one
       either side are left empty — so the strokes run up to the word and
       on after it, never through the letters. A word
       with data-slash-from="N" only appears where the container is at
       least N px wide; one that will not fit is hidden;
     - the field is a network, and its words are the systems on it,
       coming online and talking to one another. It runs as one chain:
       a signal runs in to a first word along its row, the word comes
       online, and partway through it sends a signal on to a neighbour —
       routed through the strokes the way a trace is, out along its row,
       down or up a column and along the next word's row into it, never
       through a word — which comes online in turn and hands on again,
       word to word, now and then after a breath. When the chain has to
       stop (the pointer, the field leaving the screen) it picks up
       again from the last word, so activity never jumps across the
       field.

       Each word is a node, and the signal reaching it is an event. The
       word starts to decode (ScrambleTextPlugin, set up the way the Osmo
       Text Scramble resource does it: split into words and characters,
       scrambled to its own text, the split reverted once it resolves) as
       the signal is about to reach it, and as it lands the node bursts:
       the strokes framing the word flare to full ink at once, a few of
       them holding the signal's red a moment, short traces fly out of it
       on every side, each with a red head that turns to ink, and a ring
       of light runs out through the strokes around it, reaching further
       towards the word the chain goes to next. Then one front
       resolves the word from the side the signal came in by, the strokes
       above and below following it across, and the light settles back.
       Held forward a moment (data-slash-active), the word settles back
       slowly, so the last is still fading as the next comes online. Now
       and then a word also pings a second, nearer one with a fainter
       signal, which answers with a smaller burst and a short decode of
       its own (data-slash-active="minor"). Under all of it packets of
       traffic run out from one word towards a neighbour, so the field is
       never still.

       Three tones: the field's own tint, ink (two steps of it — the
       hover's, and a near-black the system reaches at its most active),
       and red. Red is the signal and the heart of each burst, nothing
       else: the head of a signal on its way, the frame and the traces'
       heads as it lands, the characters of a word still decoding (the
       one at the front full red), a few strokes sparking in the ring, and
       the strokes at the front of a decode. The wider answer is ink, so
       the red has something to stand against. It never stays where it
       lands — every red stroke turns to ink and then back to the field's
       own tint, and a word resolves to ink.

       Which words, in what order, from which side, how fast the signals
       travel and when the chain takes a breath all vary: each next word
       is drawn from the few nearest the last, by weight — the nearer the
       likelier, onward the way its signal was going a little likelier —
       and never one of the last few, so the route wanders through
       neighbours rather than repeating. Only one word ever comes fully
       online at a time;
     - the pointer is the same system. Resting on a word for a moment
       brings that word online the same way, the pointer standing in for
       the signal, and the chain carries on from it; while the pointer is
       moving in the field the chain stops handing on, so the two never
       compete.

   Nothing runs under prefers-reduced-motion beyond a quick hover, and
   the sequence runs only while the field is on screen and the page has
   arrived. It all runs on GSAP's ticker — the frame loop as well as the
   scramble, so both keep one clock — and only while something is lit;
   GSAP, SplitText and ScrambleTextPlugin are the site's own globals.

   Options are read from a data-* attribute on the container, then a
   --slash-* custom property, then the default below, and re-read on
   refresh().
   ============================================================ */
const DEFAULTS = {
  base: "#ceccbd",
  hot: "#4a6e3a",
  ink: "#141414",
  signal: "#c40000",
  "cell-w": 10,
  "cell-h": 22,
  stroke: 1.25,
  radius: 80,
  stretch: 1.4,
  fade: 700,
  straight: 0.5,
  blank: 0.06,
};
// Tints between the base and the highlight, the same again from the
// highlight on to the ink, and steps towards the signal red. A stroke's
// light runs 0–1 to the highlight (all the pointer ever reaches) and on to 2
// at the ink, which only the system's bursts and signals reach.
const LEVELS = 12;
const SIGNAL_LEVELS = 8;
// The share of the cells at the very edge of the hover's reach that are
// picked; every cell at its centre is.
const EDGE_PICK = 0.35;
// How far the pattern runs on past the container's edges, in whole cells
// (the grid is then shifted up to one more, so each edge crops it well).
const OVERSCAN = 2;
// How long the system's light takes to die away (s): the ink a signal leaves
// in the strokes, and the red, which goes well before it, so a stroke the
// signal crosses turns from red to ink before it settles back to the base.
// Red can be held a moment first, where a burst lands.
const GLOW_FADE = 1.5;
const SIGNAL_FADE = 0.2;

// The sequence. Every range is [least, most], drawn afresh each time.
const SEQUENCE = {
  // the chain's first word, once the field is up (s), and how long after
  // the page has finished arriving, if it was still arriving then
  first: 1.1,
  settle: 0.6,
  // the signal in to the chain's first word, which has no word before it to
  // come from: its length in cells, its time per cell (s), and how often it
  // turns in from a column, from how many rows off
  approach: [8, 18],
  approachPace: [0.045, 0.065],
  jog: 0.35,
  jogRows: [2, 4],
  // a word hands on to the next while it is still resolving: at this share
  // of its decode, give or take a moment (s), and now and then (breath) after
  // a short rest (s), so the rhythm varies; then the pace of the signal to
  // the next (cells/s)
  handOffAt: 0.65,
  handOff: [0.1, 0.35],
  breath: 0.22,
  breathFor: [0.5, 1.1],
  handOffSpeed: [30, 44],
  // the next word: one of the nearest few still free (near) within reach (a
  // share of the field's width; the nearest of all if none is), the nearer
  // the likelier, onward the way the signal was going a little likelier, and
  // the word this one handed on to last time much less likely (again)
  near: 3,
  reach: 0.42,
  onward: 1.4,
  again: 0.25,
  // how often a word pings a second, nearer one as well, and that fainter
  // signal's pace
  branch: 0.3,
  branchSpeed: [44, 64],
  // the word held forward after it has resolved (s)
  hold: [0.75, 1.25],
  // the traffic under it all: how often a packet sets off from one word
  // towards one of its neighbours (s), how much of the way it gets, its pace
  // (cells/s), and how often its head carries a touch of red
  traffic: [0.4, 1.1],
  trafficReach: [0.35, 0.9],
  trafficSpeed: [40, 64],
  trafficRed: 0.5,
  // the pointer: how long it rests on a word to bring it online, how soon
  // that word can come online again, and how long after the pointer last
  // moved the field holds its own sequence back (s)
  dwell: 0.35,
  cooldown: 4,
  busy: 1.4,
};
// The decode: a moment fully scrambled — the signal's last stretch in, then
// the burst — and resolving across the whole label in the direction the
// signal came in by, one front running through it word after word; longer
// labels take a little longer. A word answering a ping decodes more briefly.
// The characters are hexadecimal — data rather than decoration — redrawn
// about a dozen times a second.
const DECODE = {
  chars: "0123456789ABCDEF",
  speed: 0.62,
  major: { hold: 0.3, base: 0.6, perChar: 0.044, min: 0.85, max: 1.55 },
  minor: { hold: 0.14, base: 0.36, perChar: 0.022, min: 0.46, max: 0.8 },
};
// The burst as a signal lands on a word. The frame — the strokes over and
// under the word and beyond its ends: the share lit, the light they keep and
// the flash they give (light past 1 is on the way to the ink), and the share
// that take the signal's red and hold it (s); outer is the share of the ring
// of strokes one further out that answer it, a step fainter and never red.
// The traces flung out of it: on
// along its row past the far end (row), now and then back out of the near
// one (back, rowBack), up and down the columns over it from a few spots
// (columns, rise) and out across the diagonals from its corners (diag), all
// lengths in cells; their pace (s per cell) and the light they flash and
// leave. The one on along the row is the signal going through, red at its
// head for redReach of the way; of the rest only a share (hot) carry red, so
// the burst is mostly ink with the red at its heart. A ping's answer is the
// same, smaller and fainter.
const BURST = {
  major: {
    frame: 0.92, outer: 0.5, ink: 1.7, flash: 2, red: 0.26, hold: 0.45,
    row: [7, 12], back: 0.6, rowBack: [3, 5], columns: 3, rise: [3, 5], diag: [3, 5],
    pace: [0.028, 0.042], traceFlash: 2, traceInk: 1.2, redReach: 0.7, hot: 0.28,
  },
  minor: {
    frame: 0.6, outer: 0, ink: 0.95, flash: 1.35, red: 0.1, hold: 0.16,
    row: [3, 5], back: 0, rowBack: [0, 0], columns: 1, rise: [1, 2], diag: [0, 0],
    pace: [0.032, 0.046], traceFlash: 1.3, traceInk: 0.6, redReach: 0.45, hot: 0,
  },
};
// The strokes' answer after the burst. The ring: how far it reaches around
// the word (in cells across, rows up and down), how long it takes to spread,
// how sparse it is, how strongly it flashes (past 1 towards the ink, at its
// inside), how much of that stays behind it, the share of its inner strokes
// that spark red, and how much further it runs (lean) on the side of the word
// the chain hands on to next, so the ring already leans the way the signal
// will go. The scan: the strokes above and below the word, following the
// decode's front across, a share of them (red) touched with the signal's red
// as the front passes and held there a beat (hold, s).
const RIPPLE = {
  major: { reach: 19, rows: 6, time: 1.3, pick: 0.78, ink: 2, after: 0.85, spark: 0.1, lean: 1.4 },
  minor: { reach: 9, rows: 3, time: 0.55, pick: 0.5, ink: 1.3, after: 0.5, spark: 0.05, lean: 1 },
};
const SCAN = { pick: 0.65, ink: 0.8, flash: 1.6, signal: 1, red: 0.3, hold: 0.1 };
// A word comes forward under the pointer once the strokes under it are lit
// to WORD_LIT, and goes back only when its own glow, fading over WORD_FADE
// (s), has dropped to WORD_DIM — so a cluster flickering over it never makes
// it flicker too.
const WORD_LIT = 0.38;
const WORD_DIM = 0.18;
const WORD_FADE = 2.2;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Deterministic 0..1 per (col, row, seed), so the pattern never reshuffles.
function hash(col, row, seed) {
  let h = col * 374761393 + row * 668265263 + seed * 2246822519;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const between = ([least, most]) => least + Math.random() * (most - least);
const clamp = (value, least, most) => Math.min(Math.max(value, least), most);

function readOption(el, name) {
  const attr = el.getAttribute("data-" + name);
  if (attr != null && attr !== "") return attr;
  const prop = getComputedStyle(el).getPropertyValue("--slash-" + name).trim();
  if (prop) return prop;
  return DEFAULTS[name];
}

// Any CSS colour to [r, g, b, a], through the canvas's own parser.
function toRGBA(color, ctx) {
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  const value = ctx.fillStyle;
  if (value[0] === "#") {
    return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).concat(1);
  }
  const [r, g, b, a = 1] = value.match(/[\d.]+/g).map(Number);
  return [r, g, b, a];
}

const mix = (from, to, t) => from.map((v, i) => v + (to[i] - v) * t);
const rgba = ([r, g, b, a]) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`;

export function mountSlashField(el) {
  if (el.slashField) return el.slashField;

  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.style.touchAction = "pan-y";

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;max-width:none;pointer-events:none;display:block;";
  el.prepend(canvas);
  const ctx = canvas.getContext("2d");

  // the words decode only where the site's GSAP plugins are there to do it
  const canDecode = !!(window.SplitText && window.ScrambleTextPlugin);

  // the container's size, and how far the canvas runs on past its top-left
  // corner (ox, oy); per cell: its glyph, the pointer's heat, the system's
  // ink, its red, and how long that red is held before it fades
  let opts, colors, width, height, ox, oy, cols, rows, cellW, cellH;
  let glyph, taken, heat, glow, signal, keep;
  let words = [];
  let ticking = false;
  const pointer = { x: 0, y: 0, inside: false, moved: -Infinity, word: null, dwell: 0 };

  // the sequence: what is lighting the strokes, the words online (each with
  // its timeline and split) and those a signal is on its way to, the call
  // that starts (or restarts) the chain and the one that sends the next
  // packet, and the last few words to come online
  let runs = [];
  let ripples = [];
  let scans = [];
  const live = new Map();
  const pending = new Set();
  let next = null;
  let traffic = null;
  let previous = null;
  let recent = [];
  let held = false;
  let onScreen = true;

  const now = () => gsap.ticker.time;

  function readOptions() {
    const num = (name) => parseFloat(readOption(el, name));
    opts = {
      cellW: num("cell-w"),
      cellH: num("cell-h"),
      stroke: num("stroke"),
      radius: num("radius"),
      stretch: num("stretch"),
      fade: num("fade"),
      straight: num("straight"),
      blank: num("blank"),
    };
    const base = toRGBA(readOption(el, "base"), ctx);
    const hot = toRGBA(readOption(el, "hot"), ctx);
    const deep = toRGBA(readOption(el, "ink"), ctx);
    const red = toRGBA(readOption(el, "signal"), ctx);
    // A colour per (red step, ink step), indexed red * (2 * LEVELS + 1) +
    // ink: the ink steps run from the base to the highlight and on to the
    // ink. A stroke takes the red's hue within the first steps and its
    // strength only in proportion, so a fading signal reads as a fainter red
    // rather than passing through a muddy mix of red and grey.
    colors = [];
    for (let s = 0; s <= SIGNAL_LEVELS; s++) {
      const t = s / SIGNAL_LEVELS;
      for (let level = 0; level <= 2 * LEVELS; level++) {
        const ink = level <= LEVELS ? mix(base, hot, level / LEVELS) : mix(hot, deep, level / LEVELS - 1);
        const [r, g, b] = mix(ink, red, Math.min(1, t * 4));
        colors.push(rgba([r, g, b, ink[3] + (red[3] - ink[3]) * t]));
      }
    }
  }

  // How well a container edge crops the strokes, at a fraction f of the way
  // through a cell: across, it should cut the slanted strokes part-way and
  // keep clear of the straight one at the middle, which an edge running down
  // it would turn into a border; down, it should cut through the strokes
  // rather than the gap between two rows.
  const cropAcross = (f) => Math.min(f - 0.18, 0.82 - f, Math.abs(f - 0.5) - 0.04);
  const cropDown = (f) => Math.min(f - 0.16, 0.84 - f);

  // The overscan before the container's first cell edge (px): OVERSCAN cells,
  // and the shift into the next cell that crops both edges best.
  function overscan(size, cell, crop) {
    let best = 0;
    let score = -Infinity;
    for (let px = 0; px < cell; px++) {
      const s = Math.min(crop(px / cell), crop(((px + size) % cell) / cell));
      if (s > score) {
        score = s;
        best = px;
      }
    }
    return OVERSCAN * cell + best;
  }

  function layout() {
    stopSequence();
    readOptions();
    width = el.clientWidth;
    height = el.clientHeight;

    // The pattern is larger than the container and sits under it, which
    // crops it: OVERSCAN cells and a little more past each edge, at the
    // spec's own cell size, shifted so every edge cuts through the strokes
    // part-way. So it carries on behind the container's edges rather than
    // having been made to fit inside them.
    cellW = opts.cellW;
    cellH = opts.cellH;
    const empty = width < cellW || height < cellH;
    ox = empty ? 0 : overscan(width, cellW, cropAcross);
    oy = empty ? 0 : overscan(height, cellH, cropDown);
    cols = empty ? 0 : Math.ceil((ox + width) / cellW) + OVERSCAN;
    rows = empty ? 0 : Math.ceil((oy + height) / cellH) + OVERSCAN;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.left = `${-ox}px`;
    canvas.style.top = `${-oy}px`;
    canvas.style.width = `${cols * cellW}px`;
    canvas.style.height = `${rows * cellH}px`;
    canvas.width = Math.round(cols * cellW * dpr);
    canvas.height = Math.round(rows * cellH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    glyph = new Uint8Array(cols * rows);
    taken = new Uint8Array(cols * rows);
    heat = new Float32Array(cols * rows);
    glow = new Float32Array(cols * rows);
    signal = new Float32Array(cols * rows);
    keep = new Float32Array(cols * rows);
    const slant = opts.straight + (1 - opts.straight) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (hash(c, r, 1) < opts.blank) continue;
        const m = hash(c, r, 2);
        glyph[r * cols + c] = m < opts.straight ? 2 : m < slant ? 1 : 3;
      }
    }

    placeWords();
    plan(SEQUENCE.first);
    planTraffic(SEQUENCE.first + between(SEQUENCE.traffic));
    draw();
  }

  /* ---------- words: real text set on the grid ---------- */
  function placeWords() {
    // new words, so the chain starts afresh
    words = [];
    previous = null;
    recent = [];
    const labels = [...el.querySelectorAll("[data-slash-label]")];
    if (!labels.length || !cols || !rows) return;

    // the cells wholly inside the container: the first and last of them
    const left = Math.ceil(ox / cellW);
    const right = Math.floor((ox + width) / cellW) - 1;
    const top = Math.ceil(oy / cellH);
    const bottom = Math.floor((oy + height) / cellH) - 1;

    labels.forEach((label) => {
      label.removeAttribute("data-slash-lit");
      label.removeAttribute("data-slash-active");
      const from = parseFloat(label.dataset.slashFrom) || 0;
      const w = label.offsetWidth;
      const n = Math.max(1, Math.ceil(w / cellW));

      // c is the word's first cell and r its row, with an empty cell either
      // side; the word stays wholly inside the container, never on or
      // beside another word's row where the two would crowd, and — while
      // there is a row for it (apart) — on a row no other word is on, so no
      // two read as a line of them
      const fits = (c, r, apart) => {
        if (c - 1 < left || c + n > right || r < top || r > bottom) return false;
        return words.every((p) => {
          if (apart && r === p.r) return false;
          return Math.abs(r - p.r) > 1 || c - 4 > p.c + p.n || c + n + 3 < p.c - 1;
        });
      };

      let spot = null;
      if (width >= from) {
        const [fx = 0.5, fy = 0.5] = (label.dataset.slashSpot || "").split(",").map(Number);
        const c = Math.min(Math.max(Math.round((ox + fx * width - (n * cellW) / 2) / cellW), left + 1), right - n);
        const r = Math.min(Math.max(Math.floor((oy + fy * height) / cellH), top), bottom);
        // its own spot, or the nearest free one to it
        for (const apart of [true, false]) {
          for (const dr of [0, -1, 1, -2, 2, -3, 3]) {
            for (const dc of [0, -3, 3, -6, 6, -10, 10, -16, 16]) {
              if (!spot && fits(c + dc, r + dr, apart)) spot = [c + dc, r + dr];
            }
          }
        }
      }
      label.style.visibility = spot ? "" : "hidden";
      if (!spot) return;

      const [c, r] = spot;
      // centred in its run of cells, on the row's middle
      label.style.left = `${c * cellW - ox + (n * cellW - w) / 2}px`;
      label.style.top = `${r * cellH - oy + cellH / 2}px`;
      words.push({
        label,
        c,
        n,
        r,
        x: (c + n / 2) * cellW,
        y: (r + 0.5) * cellH,
        glow: 0,
        lit: false,
        last: -Infinity,
        travel: 1,
      });
    });

    // The pattern stops around each word: its cells, and one either side,
    // are left empty, so the strokes run up to the word and on after it
    // but never through or behind the letters. A signal never runs through
    // them either.
    words.forEach(({ c, n, r }) => {
      for (let cc = c - 1; cc <= c + n; cc++) {
        glyph[r * cols + cc] = 0;
        taken[r * cols + cc] = 1;
      }
    });
  }

  /* ---------- drawing: one path per colour ---------- */
  function draw() {
    ctx.clearRect(0, 0, cols * cellW, rows * cellH);
    if (!cols || !rows) return;
    const paths = [];

    for (let r = 0; r < rows; r++) {
      const y = r * cellH;
      const top = y + cellH * 0.16;
      const bottom = y + cellH * 0.84;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const g = glyph[i];
        if (!g) continue;
        const level = Math.min(2 * LEVELS, Math.ceil(Math.max(heat[i], glow[i]) * LEVELS));
        const red = signal[i] ? Math.ceil(Math.min(1, signal[i]) * SIGNAL_LEVELS) : 0;
        const k = red * (2 * LEVELS + 1) + level;
        const path = paths[k] || (paths[k] = new Path2D());
        const x = c * cellW;
        if (g === 2) {
          const mid = x + cellW / 2;
          path.moveTo(mid, top);
          path.lineTo(mid, bottom);
        } else {
          const left = x + cellW * 0.18;
          const right = x + cellW * 0.82;
          if (g === 1) {
            path.moveTo(left, bottom);
            path.lineTo(right, top);
          } else {
            path.moveTo(left, top);
            path.lineTo(right, bottom);
          }
        }
      }
    }

    ctx.lineWidth = opts.stroke;
    ctx.lineCap = "butt";
    paths.forEach((path, k) => {
      ctx.strokeStyle = colors[k];
      ctx.stroke(path);
    });
  }

  /* ---------- the hover: a small cluster by the pointer ---------- */
  function hover() {
    const { radius, stretch } = opts;
    const ry = radius * stretch;
    const c0 = Math.max(0, Math.floor((pointer.x - radius) / cellW));
    const c1 = Math.min(cols - 1, Math.ceil((pointer.x + radius) / cellW));
    const r0 = Math.max(0, Math.floor((pointer.y - ry) / cellH));
    const r1 = Math.min(rows - 1, Math.ceil((pointer.y + ry) / cellH));
    for (let r = r0; r <= r1; r++) {
      const dy = (r * cellH + cellH / 2 - pointer.y) / ry;
      for (let c = c0; c <= c1; c++) {
        const dx = (c * cellW + cellW / 2 - pointer.x) / radius;
        const d = Math.sqrt(dx * dx + dy * dy);
        // picked or not, and a picked stroke is fully lit
        if (d >= 1 || hash(c, r, 3) > 1 - (1 - EDGE_PICK) * d) continue;
        heat[r * cols + c] = 1;
      }
    }
  }

  /* ---------- the system's light in the strokes ---------- */
  // Lights a stroke with ink and red, never dimming what is already lit;
  // flash is a brief light on the pointer's own quick fade, so it passes,
  // and hold keeps the red where it is that long (s) before it fades.
  function light(i, ink, red = 0, flash = 0, hold = 0) {
    if (!glyph[i]) return;
    if (ink > glow[i]) glow[i] = ink;
    if (red && red >= signal[i]) {
      signal[i] = red;
      if (hold > keep[i]) keep[i] = hold;
    }
    if (flash > heat[i]) heat[i] = flash;
  }

  // The cells a signal runs through into a word: along the word's row up to
  // the empty cell before it, from the side it travels from (travel 1 runs
  // rightwards), and now and then turning into the row from a column a few
  // rows off. Built outwards from the word, stopping short of another word or
  // the edge, then turned round so it runs inwards.
  function routeIn(word, travel, length) {
    const { c, n, r } = word;
    const route = [];
    for (let cc = travel > 0 ? c - 2 : c + n + 1; route.length < length; cc -= travel) {
      if (cc < 0 || cc >= cols || taken[r * cols + cc]) break;
      route.push(r * cols + cc);
    }
    if (route.length >= 5 && Math.random() < SEQUENCE.jog) {
      const corner = route[route.length - 1] % cols;
      const way = Math.random() < 0.5 ? -1 : 1;
      const column = [];
      for (let k = 1, rise = Math.round(between(SEQUENCE.jogRows)); k <= rise; k++) {
        const rr = r + way * k;
        if (rr < 0 || rr >= rows || taken[rr * cols + corner]) break;
        column.push(rr * cols + corner);
      }
      if (column.length >= 2) route.push(...column);
    }
    return route.reverse();
  }

  // Room along the row for a signal in from one side of a word, in cells.
  function room({ c, n, r }, travel) {
    let free = 0;
    for (let cc = travel > 0 ? c - 2 : c + n + 1; cc >= 0 && cc < cols && !taken[r * cols + cc]; cc -= travel) free++;
    return free;
  }

  // The cells a signal runs through from one word to another, routed the
  // way a trace is: out of the first along its row, on the side facing the
  // second, down or up a column, and along the second's row into it — round
  // its far side when the two overlap across. Never through a word. Which
  // column it turns down varies; null when there is no clear way. travel is
  // the way it enters the second word (1 rightwards).
  function routeBetween(a, b) {
    const right = b.x > a.x;
    const exit = right ? a.c + a.n + 1 : a.c - 2;
    let enter = right ? b.c - 2 : b.c + b.n + 1;
    let turns;
    if (right ? enter >= exit : enter <= exit) {
      // a gap between them: turn somewhere in it, around a point drawn in it
      const lo = Math.min(exit, enter);
      const hi = Math.max(exit, enter);
      const aim = lo + (hi - lo) * between([0.2, 0.8]);
      turns = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).sort((p, q) => Math.abs(p - aim) - Math.abs(q - aim));
    } else {
      // they overlap across: out and in on the same side, turning beyond both
      enter = right ? b.c + b.n + 1 : b.c - 2;
      const beyond = right ? Math.max(exit, enter) : Math.min(exit, enter);
      turns = [1, 2, 3, 4, 5, 6].map((k) => beyond + (right ? k : -k));
    }
    for (const turn of turns) {
      const route = trace(a.r, exit, turn, b.r, enter);
      if (route) return { route, travel: enter === b.c - 2 ? 1 : -1 };
    }
    return null;
  }

  // along row r0 from x0 to x1, down or up column x1 to row r1, along row r1
  // to x2 — or null if any cell of it is outside the field or a word's
  function trace(r0, x0, x1, r1, x2) {
    const route = [];
    const add = (c, r) => {
      if (c < 0 || c >= cols || r < 0 || r >= rows || taken[r * cols + c]) return false;
      route.push(r * cols + c);
      return true;
    };
    for (let c = x0; ; c += Math.sign(x1 - x0)) {
      if (!add(c, r0)) return null;
      if (c === x1) break;
    }
    for (let r = r0 + Math.sign(r1 - r0); r0 !== r1; r += Math.sign(r1 - r0)) {
      if (!add(x1, r)) return null;
      if (r === r1) break;
    }
    for (let c = x1 + Math.sign(x2 - x1); x1 !== x2; c += Math.sign(x2 - x1)) {
      if (!add(c, r1)) return null;
      if (c === x2) break;
    }
    return route;
  }

  // A signal: a head running the route over its duration on the ease, after
  // a delay, lighting each stroke as it reaches it with the shade for that
  // point along it (0 at its start, 1 at its end) — [ink, red, flash] — and a
  // scattered few left dark. side flashes the strokes either side of the head
  // as it passes, so a signal reads as a trace with some weight to it. arrive
  // is called early seconds before the head gets there, so a word can start
  // answering as the signal comes in.
  function run(route, { duration, ease, shade, pick, side = 0, delay = 0, arrive = null, early = 0 }) {
    runs.push({ route, duration, ease: gsap.parseEase(ease), shade, pick, side, t: -delay, done: 0, arrive, early });
    wake();
  }

  function advanceRuns(dt) {
    runs = runs.filter((s) => {
      s.t += dt;
      if (s.t < 0) return true;
      const p = s.t >= s.duration ? 1 : s.ease(s.t / s.duration);
      const reach = Math.min(s.route.length, Math.ceil(p * s.route.length));
      for (; s.done < reach; s.done++) {
        const i = s.route[s.done];
        const u = s.route.length > 1 ? s.done / (s.route.length - 1) : 1;
        if (s.side) {
          // across the way it is heading: the rows over and under a run
          // along a row, the cells either side of one up or down a column
          const step = Math.abs(i - (s.route[s.done + 1] ?? s.route[s.done - 1] ?? i));
          const [a, b] = step === 1 ? [i - cols, i + cols] : [i - 1, i + 1];
          if (a >= 0 && hash(a % cols, (a / cols) | 0, 11) < 0.55) light(a, 0, 0, s.side * (0.4 + 0.6 * u));
          if (b < glyph.length && hash(b % cols, (b / cols) | 0, 11) < 0.55) light(b, 0, 0, s.side * (0.4 + 0.6 * u));
        }
        if (hash(i % cols, (i / cols) | 0, 5) > s.pick) continue;
        const [ink, red, flash = 0] = s.shade(u);
        light(i, ink, red, flash);
      }
      if (s.arrive && s.t >= s.duration - s.early) {
        s.arrive();
        s.arrive = null;
      }
      return p < 1;
    });
  }

  // The strokes around a word answering it: a sparse ripple spreading from
  // it, fewer and fainter the further out, each stroke flaring briefly as it
  // passes and leaving a little light behind, so it reads as a ring going out
  // rather than a patch coming up; a few close in spark red. Given the word
  // the chain goes to next (toward), it runs further on that side — at the
  // same speed, so it simply carries on longer that way.
  function ripple(word, spec, toward = null) {
    const { c, n, r } = word;
    const sx = toward ? Math.sign(toward.x - word.x) : 0;
    const sy = toward ? Math.sign(toward.r - r) : 0;
    const left = spec.reach * (sx < 0 ? spec.lean : 1);
    const right = spec.reach * (sx > 0 ? spec.lean : 1);
    const up = spec.rows * (sy < 0 ? spec.lean : 1);
    const down = spec.rows * (sy > 0 ? spec.lean : 1);
    const cells = [];
    for (let rr = Math.max(0, r - Math.ceil(up)); rr <= Math.min(rows - 1, r + Math.ceil(down)); rr++) {
      const ay = Math.abs(rr - r);
      for (let cc = Math.max(0, c - 1 - Math.ceil(left)); cc <= Math.min(cols - 1, c + n + Math.ceil(right)); cc++) {
        const i = rr * cols + cc;
        if (!glyph[i]) continue;
        // cells out from the word's ends, and how far that is to the edge of
        // the ring on this side (d) and in the ring's own measure (out)
        const ax = Math.max(c - 1 - cc, cc - (c + n), 0);
        const d = Math.hypot(ax / ((cc < c ? left : right) + 0.5), ay / ((rr < r ? up : down) + 0.5));
        if (d >= 1 || hash(cc, rr, 6) > spec.pick * (1 - 0.45 * d)) continue;
        const out = Math.hypot(ax / (spec.reach + 0.5), ay / (spec.rows + 0.5));
        const spark = d < 0.55 && Math.random() < spec.spark;
        cells.push({ i, at: out * spec.time, ink: spec.ink * (1 - 0.45 * d), red: spark ? 0.8 : 0, after: spec.after });
      }
    }
    cells.sort((a, b) => a.at - b.at);
    ripples.push({ cells, t: 0, done: 0 });
    wake();
  }

  function advanceRipples(dt) {
    ripples = ripples.filter((rp) => {
      rp.t += dt;
      for (; rp.done < rp.cells.length && rp.cells[rp.done].at <= rp.t; rp.done++) {
        const { i, ink, red, after } = rp.cells[rp.done];
        light(i, ink * after, red, ink, red ? 0.08 : 0);
      }
      return rp.done < rp.cells.length;
    });
  }

  // The burst as the signal lands on a word: the frame round it flares at
  // once — the rows over and under it and the cells beyond its ends — a share
  // of it holding the signal's red a moment, and part of the ring one further
  // out answering in ink; short traces fly out of it on every side, red at
  // the head and ink behind; and the ring runs out after them, leaning
  // towards the word the chain goes to next (toward). A ping's is the same,
  // smaller.
  function burst(word, travel, kind, toward = null) {
    const spec = BURST[kind];
    const { c, n, r } = word;
    for (let rr = Math.max(0, r - 2); rr <= Math.min(rows - 1, r + 2); rr++) {
      for (let cc = Math.max(0, c - 3); cc <= Math.min(cols - 1, c + n + 2); cc++) {
        const outer = Math.abs(rr - r) > 1 || cc < c - 2 || cc > c + n + 1;
        if (hash(cc, rr, 9) > (outer ? spec.outer : spec.frame)) continue;
        const red = !outer && hash(cc, rr, 10) < spec.red;
        light(rr * cols + cc, spec.ink * (outer ? 0.75 : 1), red ? 1 : 0, spec.flash * (outer ? 0.8 : 1), red ? spec.hold : 0);
      }
    }

    // a straight trace from (cc, rr), a step of (dc, dr) at a time, stopping
    // short of a word or the edge of the pattern; hot if it carries red
    const traces = [];
    const trace = (cc, rr, dc, dr, [least, most], hot = Math.random() < spec.hot) => {
      const route = [];
      for (let k = Math.round(between([least, most])); k > 0; k--, cc += dc, rr += dr) {
        if (cc < 0 || cc >= cols || rr < 0 || rr >= rows || taken[rr * cols + cc]) break;
        route.push(rr * cols + cc);
      }
      if (route.length >= 2) traces.push({ route, hot });
    };
    const far = travel > 0 ? c + n + 1 : c - 2;
    const near = travel > 0 ? c - 2 : c + n + 1;
    // on along the row out of the far end, the way the signal was going,
    // and now and then back out of the near one
    trace(far, r, travel, 0, spec.row, true);
    if (Math.random() < spec.back) trace(near, r, -travel, 0, spec.rowBack);
    // up and down the columns over the word, from spots spread across it
    for (const dr of [-1, 1]) {
      for (let k = 0; k < spec.columns; k++) {
        const cc = c + Math.round(((k + 0.15 + 0.7 * Math.random()) / spec.columns) * (n - 1));
        trace(cc, r + dr, 0, dr, spec.rise);
      }
    }
    // out across the diagonals from its four corners
    for (const dr of [-1, 1]) {
      trace(c - 2, r + dr, -1, dr, spec.diag);
      trace(c + n + 1, r + dr, 1, dr, spec.diag);
    }
    traces.forEach(({ route, hot }) =>
      run(route, {
        duration: route.length * between(spec.pace),
        ease: "power2.out",
        shade: (u) => [spec.traceInk * (1 - 0.5 * u), hot && u <= spec.redReach ? 1 - 0.45 * u : 0, spec.traceFlash * (1 - 0.4 * u)],
        pick: 0.95,
        delay: Math.random() * 0.06,
      }));

    ripple(word, RIPPLE[kind], toward);
  }

  // The strokes on the rows above and below a word, lit in step with its
  // decode, now and then one at the front in the signal's red, held a beat.
  function advanceScans() {
    scans.forEach((scan) => {
      const { word, travel, state } = scan;
      const { c, n, r } = word;
      const span = n + 2;
      const reach = Math.min(span, Math.ceil(state.p * span));
      for (; scan.done < reach; scan.done++) {
        const cc = c - 1 + (travel > 0 ? scan.done : span - 1 - scan.done);
        for (const rr of [r - 1, r + 1]) {
          if (rr < 0 || rr >= rows || hash(cc, rr, 7) > SCAN.pick) continue;
          const red = hash(cc, rr, 8) < SCAN.red;
          light(rr * cols + cc, SCAN.ink, red ? SCAN.signal : 0, SCAN.flash, red ? SCAN.hold : 0);
        }
      }
    });
  }

  /* ---------- the sequence: a chain of words coming online ---------- */
  const running = () => canDecode && !reducedMotion.matches && onScreen && words.length > 0 && cols > 0 && rows > 0;
  const busy = () => now() - pointer.moved < SEQUENCE.busy;
  // a word fully online, or about to be: only one at a time
  const majorLive = () => [...live.values()].some((entry) => entry.kind === "major") || pending.size > 0;

  function plan(seconds) {
    next?.kill();
    next = null;
    if (!running()) return;
    next = gsap.delayedCall(seconds, begin);
  }

  function begin() {
    next = null;
    if (!running()) return;
    // hold off while the page is still arriving, and a moment after, while
    // someone is using the field, and while a word is still coming online
    if (document.documentElement.dataset.arrival) {
      held = true;
      plan(0.5);
      return;
    }
    if (held) {
      held = false;
      plan(SEQUENCE.settle);
      return;
    }
    if (busy() || majorLive()) {
      plan(0.6);
      return;
    }
    // The chain picks up again from the last word to come online, so it
    // never jumps; only with no word before it does a signal run in to a
    // first word along its row.
    if (previous && send(previous, "major", previous.ahead)) return;
    const word = choose(null);
    if (!word) {
      plan(0.6);
      return;
    }
    let travel = Math.random() < 0.5 ? 1 : -1;
    if (room(word, travel) < 5) travel = -travel;
    const route = routeIn(word, travel, Math.round(between(SEQUENCE.approach)));
    if (route.length < 4) {
      arrive(word, travel, "major");
      return;
    }
    pending.add(word);
    // faint where it sets off and strongest at the word, red towards its head
    run(route, {
      duration: route.length * between(SEQUENCE.approachPace),
      ease: "sine.in",
      shade: (u) => [0.35 + 0.55 * u, u < 0.3 ? 0 : 0.3 + 0.7 * u, 0.5 + 0.9 * u],
      pick: 0.94,
      side: 0.8,
      arrive: () => arrive(word, travel, "major"),
      early: DECODE.major.hold,
    });
  }

  // The next word: one of the few nearest the given one — the nearer, the
  // likelier, and onward the way its signal was going a little likelier
  // still — so the chain always moves to a neighbour but not always the same
  // one. Never one online or about to be, nor the last word or the few
  // before it, nor, for a ping, the word the chain is heading for. With no
  // word to go from, any.
  function choose(from, ping = false) {
    // the last few to skip: three in a full field, fewer where there are only
    // a handful of words, so the chain still has a choice and never settles
    // into a loop
    const back = Math.max(0, Math.min(3, words.length - 4));
    const skip = back ? recent.slice(-back) : [];
    const open = (w) => w !== from && !live.has(w) && !pending.has(w) && !(ping && w === from?.ahead);
    let pool = words.filter((w) => open(w) && !skip.includes(w));
    if (!pool.length) pool = words.filter(open);
    if (!pool.length) return null;
    if (!from) return pool[Math.floor(Math.random() * pool.length)];
    const away = (w) => Math.hypot(w.x - from.x, (w.y - from.y) * 1.4);
    pool.sort((a, b) => away(a) - away(b));
    pool = pool.slice(0, SEQUENCE.near).filter((w, k) => k === 0 || away(w) <= width * SEQUENCE.reach);
    // the way this word went last time is a long shot, so the chain does not
    // keep taking the same route
    const weights = pool.map((w) => {
      const near = 1 / (0.35 + away(w) / (width * 0.2)) ** 1.5;
      const onward = !ping && Math.sign(w.x - from.x) === from.travel ? SEQUENCE.onward : 1;
      return near * onward * (w === from.went ? SEQUENCE.again : 1);
    });
    let left = Math.random() * weights.reduce((a, b) => a + b, 0);
    return pool.find((_, k) => (left -= weights[k]) < 0) || pool[pool.length - 1];
  }

  // A signal from one word to the next it brings online — prefer, if it is
  // still free, or another near it; a fainter one, and a shorter answer, for
  // a ping. False when there is no word or no way.
  function send(from, kind, prefer = null) {
    const major = kind === "major";
    const free = (w) => w && words.includes(w) && !live.has(w) && !pending.has(w);
    for (let tries = 0; tries < 4; tries++) {
      const to = tries === 0 && free(prefer) ? prefer : choose(from, !major);
      if (!to) return false;
      const way = routeBetween(from, to);
      if (!way) continue;
      pending.add(to);
      if (major) from.went = to;
      const speed = between(major ? SEQUENCE.handOffSpeed : SEQUENCE.branchSpeed);
      run(way.route, {
        duration: clamp(way.route.length / speed, 0.45, 2.6),
        ease: "sine.inOut",
        shade: major ? (u) => [0.65 + 0.35 * u, 1, 1.45] : (u) => [0.45, u < 0.6 ? 0.6 : 0.8, 0.9],
        pick: major ? 0.97 : 0.82,
        side: major ? 1 : 0,
        arrive: () => arrive(to, way.travel, kind),
        early: DECODE[kind].hold,
      });
      return true;
    }
    return false;
  }

  // A word comes online: it starts to decode as the signal comes in, bursts
  // as it lands — its ring leaning towards the word it will hand on to — and
  // resolves, and partway through hands on to that word, so the signal leaves
  // while its ring is still spreading and the chain runs on from word to
  // word.
  function arrive(word, travel, kind) {
    pending.delete(word);
    if (live.has(word)) return;
    const major = kind === "major";
    const { label } = word;
    if (major) {
      word.last = now();
      word.travel = travel;
      previous = word;
      recent = recent.filter((w) => w !== word).concat(word).slice(-4);
      word.ahead = choose(word);
    }
    label.setAttribute("data-slash-active", kind);

    // The Osmo scramble: split into words and characters, scramble each word
    // to its own text, revert the split once it has resolved. Every word
    // scrambles at once, and each resolves in its turn — its revealDelay
    // runs to the moment the front reaches it — so one front runs through
    // the label at an even pace, word after word, the way the signal goes.
    const spec = DECODE[kind];
    const split = new SplitText(label, { type: "words, chars", wordsClass: "word", charsClass: "char" });
    const text = label.textContent;
    const decoded = clamp(spec.base + text.length * spec.perChar, spec.min, spec.max);
    const pace = decoded / text.length;
    const order = travel > 0 ? split.words : [...split.words].reverse();
    const scan = { word, travel, state: { p: 0 }, done: 0 };
    scans.push(scan);

    const timeline = gsap.timeline({ onComplete: () => live.delete(word) });
    live.set(word, { kind, timeline, split });
    let before = 0;
    order.forEach((part, k) => {
      const length = part.textContent.length;
      timeline.to(part, {
        duration: spec.hold + (before + length) * pace,
        ease: "none",
        scrambleText: {
          text: "{original}",
          chars: DECODE.chars,
          speed: DECODE.speed,
          revealDelay: spec.hold + before * pace,
          // the characters still to resolve, and the one at the front —
          // the next to resolve, or on a right-to-left run the last to
          oldClass: travel > 0 ? "is--decoding is--front" : "is--decoding",
          newClass: travel > 0 ? undefined : "is--front",
          rightToLeft: travel < 0,
        },
        // A word that has resolved is left as plain text, so the front's
        // class does not linger on it while the rest decodes; once the label
        // has resolved, revert the split to reduce DOM size
        onComplete: k === order.length - 1 ? () => split.revert() : () => (part.textContent = part.textContent),
      }, 0);
      before += length + 1;
    });
    timeline.to(scan.state, { p: 1, duration: decoded, ease: "none" }, spec.hold);
    const resolved = spec.hold + decoded;

    // the burst, as the signal lands and the word starts to resolve
    timeline.call(() => burst(word, travel, kind, major ? word.ahead : null), null, spec.hold);

    // now and then a word coming online pings a second one as well
    if (major && words.length > 2 && Math.random() < SEQUENCE.branch) {
      timeline.call(() => send(word, "minor"), null, between([0.15, 0.55]));
    }
    // the hand-on: partway through the decode, now and then after a breath
    if (major) {
      const rest = Math.random() < SEQUENCE.breath ? between(SEQUENCE.breathFor) : 0;
      timeline.call(() => handOn(word), null, spec.hold + decoded * SEQUENCE.handOffAt + between(SEQUENCE.handOff) + rest);
    }
    timeline.call(() => (scans = scans.filter((s) => s !== scan)), null, resolved);
    timeline.call(() => label.removeAttribute("data-slash-active"), null, resolved + (major ? between(SEQUENCE.hold) : 0.35));
    wake();
  }

  // The chain runs on from a word to the one its ring leaned towards, or
  // another near it if that one has been taken. While someone is using the
  // field, or with no way on, it waits, and begin() picks it up again from
  // this word.
  function handOn(word) {
    if (!running()) return;
    if (busy() || !send(word, "major", word.ahead)) plan(0.6);
  }

  // The traffic under it all: a packet setting off from one word towards one
  // of its neighbours with a blink of ink as it leaves, getting some of the
  // way and fading, now and then with a touch of red at its head.
  function planTraffic(seconds) {
    traffic?.kill();
    traffic = running() ? gsap.delayedCall(seconds, sendTraffic) : null;
  }

  function sendTraffic() {
    traffic = null;
    if (!running()) return;
    const idle = words.filter((w) => !live.has(w) && !pending.has(w));
    if (!document.documentElement.dataset.arrival && idle.length > 1) {
      const from = idle[Math.floor(Math.random() * idle.length)];
      const away = (w) => Math.hypot(w.x - from.x, (w.y - from.y) * 1.4);
      const near = idle.filter((w) => w !== from).sort((a, b) => away(a) - away(b)).slice(0, SEQUENCE.near);
      const to = near[Math.floor(Math.random() * near.length)];
      const way = routeBetween(from, to);
      if (way) {
        const route = way.route.slice(0, Math.max(5, Math.round(way.route.length * between(SEQUENCE.trafficReach))));
        const red = Math.random() < SEQUENCE.trafficRed ? 0.7 : 0;
        run(route, {
          duration: clamp(route.length / between(SEQUENCE.trafficSpeed), 0.3, 2.2),
          ease: "sine.out",
          shade: (u) => [0.95 * (1 - 0.45 * u), u < 0.45 ? red : 0, u < 0.12 ? 1.45 : 1.1 * (1 - u)],
          pick: 0.82,
        });
      }
    }
    planTraffic(between(SEQUENCE.traffic));
  }

  // Stops whatever is under way and puts every word back as it was.
  function stopSequence() {
    next?.kill();
    next = null;
    traffic?.kill();
    traffic = null;
    live.forEach(({ timeline, split }, word) => {
      timeline.kill();
      split.revert();
      word.label.removeAttribute("data-slash-active");
    });
    live.clear();
    pending.clear();
    runs = [];
    ripples = [];
    scans = [];
  }

  // The pointer resting on a word brings it online, unless one already is
  // coming online.
  function dwell(dt) {
    if (!pointer.inside || majorLive() || !running()) {
      pointer.word = null;
      return;
    }
    const word = words.find(({ c, n, r }) =>
      pointer.x >= (c - 1) * cellW && pointer.x <= (c + n + 1) * cellW &&
      pointer.y >= (r - 0.5) * cellH && pointer.y <= (r + 1.5) * cellH);
    if (word !== pointer.word) {
      pointer.word = word;
      pointer.dwell = 0;
      return;
    }
    if (!word || live.has(word)) return;
    pointer.dwell += dt;
    if (pointer.dwell >= SEQUENCE.dwell && now() - word.last > SEQUENCE.cooldown) {
      arrive(word, pointer.x < word.x ? 1 : -1, "major");
    }
  }

  /* ---------- the frame loop: runs only while something is lit ---------- */
  function frame(time, deltaTime) {
    const dt = Math.min(deltaTime / 1000, 0.1);

    const fade = (reducedMotion.matches ? 120 : opts.fade) / 1000;
    const cool = Math.exp((-dt * 3) / fade);
    const dim = Math.exp((-dt * 3) / GLOW_FADE);
    const settle = Math.exp((-dt * 3) / SIGNAL_FADE);
    let warm = false;
    for (let i = 0; i < heat.length; i++) {
      if (heat[i]) {
        heat[i] *= cool;
        if (heat[i] < 0.02) heat[i] = 0;
        else warm = true;
      }
      if (glow[i]) {
        glow[i] *= dim;
        if (glow[i] < 0.02) glow[i] = 0;
        else warm = true;
      }
      if (signal[i]) {
        if (keep[i] > 0) keep[i] -= dt;
        else signal[i] *= settle;
        if (signal[i] < 0.05) signal[i] = keep[i] = 0;
        else warm = true;
      }
    }

    if (cols && rows) {
      advanceRuns(dt);
      advanceRipples(dt);
      advanceScans();
      if (pointer.inside) hover();
      dwell(dt);
    }

    // a word comes forward while the pointer lights the strokes under it,
    // and lingers
    const linger = Math.exp((-dt * 3) / (reducedMotion.matches ? 0.12 : WORD_FADE));
    words.forEach((word) => {
      let under = 0;
      for (let cc = word.c; cc < word.c + word.n; cc++) under = Math.max(under, heat[word.r * cols + cc]);
      word.glow = Math.max(word.glow * linger, under);
      if (word.glow < 0.02) word.glow = 0;
      else warm = true;
      const lit = word.glow >= (word.lit ? WORD_DIM : WORD_LIT);
      if (lit !== word.lit) {
        word.lit = lit;
        word.label.toggleAttribute("data-slash-lit", lit);
      }
    });

    draw();

    if (!pointer.inside && !warm && !runs.length && !ripples.length && !scans.length) sleep();
  }

  function wake() {
    if (ticking) return;
    ticking = true;
    gsap.ticker.add(frame);
  }

  function sleep() {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(frame);
  }

  const onPointer = (event) => {
    const box = el.getBoundingClientRect();
    const scale = box.width / el.offsetWidth || 1;
    // in the pattern's own coordinates, which start past the container's
    pointer.x = (event.clientX - box.left) / scale + ox;
    pointer.y = (event.clientY - box.top) / scale + oy;
    pointer.inside = true;
    pointer.moved = now();
    wake();
  };
  const onLeave = () => {
    pointer.inside = false;
    wake();
  };

  el.addEventListener("pointermove", onPointer);
  el.addEventListener("pointerdown", onPointer);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("pointercancel", onLeave);

  // the sequence only runs while the field is on screen
  const resume = () => {
    if (!next) plan(0.6);
    if (!traffic) planTraffic(between(SEQUENCE.traffic));
  };
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) resume();
  });
  intersectionObserver.observe(el);

  const onMotionChange = () => {
    if (reducedMotion.matches) stopSequence();
    else resume();
  };
  reducedMotion.addEventListener("change", onMotionChange);

  const resizeObserver = new ResizeObserver(() => layout());
  resizeObserver.observe(el);
  layout();

  const instance = {
    refresh: () => el.slashField === instance && layout(),
    destroy() {
      stopSequence();
      sleep();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener("change", onMotionChange);
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerdown", onPointer);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      canvas.remove();
      delete el.slashField;
    },
  };
  el.slashField = instance;
  // the words' widths change once their face has loaded
  document.fonts?.ready.then(() => instance.refresh());
  return instance;
}
