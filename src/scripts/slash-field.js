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
       pattern ending on a seam of its own. Across, the cells keep their
       size and the grid is shifted so each side cuts its strokes
       part-way, never down a straight stroke, where it would read as a
       border. Down, the rows are sized a hair either way (within 5%) so
       the top and the foot both cut a row near the far end of its
       strokes — about 85% of each stroke showing, never a stub of its
       tip; filling the screen, the size picked is the one that cuts the
       screen's own top and foot best too, and a row the screen would
       still cut to a stub there is left undrawn while it does;
     - it has no hover: the pointer passing over it changes nothing, and
       everything it does is its own;
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
       coming online and setting one another off. It runs as one chain
       reaction: it opens on a word near the middle bursting straight
       away, and each burst is a small explosion whose shockwave runs out
       through the strokes around it, furthest towards a neighbour, and
       sets that word off as it reaches it — another explosion, another
       shockwave — word to word without a pause, each landing before the
       last has settled. Nothing is ever drawn from one word to the next,
       so the chain reads as discrete explosions, each setting off the
       next, rather than as a line travelling through the field. When the
       chain has to stop (the field leaving the screen) it picks up again
       from the last word, so activity never jumps across the field.

       Each word is a node, and the shockwave reaching it is an event.
       The word starts to decode (ScrambleTextPlugin, set up the way the
       Osmo Text Scramble resource does it: split into words, scrambled to
       its own text, the split reverted once it resolves) as the wave is
       about to reach it, and as it lands the node bursts: the strokes
       framing the word flare to full ink at once, a few of them holding
       the red a moment, short traces fly out of it on every side, some
       with a red head that turns to ink, and its own shockwave sets off —
       a sparse ring of strokes flaring as its front passes, strongest by
       the word and fading as it spreads, running on furthest towards the
       word the chain goes to next. A quick front resolves the word from
       the side the wave came in by, the strokes above and below following
       it across, and the light settles back. Held forward a moment
       (data-slash-active), the word settles back slowly, so the last is
       still fading as the next comes online. Now and then the wave also
       sets off a nearer word it passes, which answers with a smaller
       burst and a short decode of its own (data-slash-active="minor").
       Under all of it faint packets of traffic run out from one word
       towards a neighbour, so the field is never still.

       Three tones: the field's own tint, ink (two steps of it — a firmer
       grey, and a near-black the system reaches at its most active),
       and red. Red is the heart of each burst, nothing else: the frame
       and the traces' heads as it lands, a few strokes sparking right by
       the word, the characters of a word still decoding (the one at the
       front full red) and the strokes at the front of a decode. The
       shockwaves and the traffic are ink, so the red stays where the
       explosions are and has something to stand against. It never stays
       where it lands — every red stroke turns to ink and then back to the
       field's own tint, and a word resolves to ink.

       Which words, in what order, from which side and how fast the
       waves travel all vary: each next word
       is drawn from the few nearest the last, by weight — the nearer the
       likelier, onward the way the chain was going a little likelier —
       and never one of the last few, so the route wanders through
       neighbours rather than repeating. Only one word ever comes fully
       online at a time.

   Nothing runs under prefers-reduced-motion, and the sequence runs only
   while the field is on screen and the page has
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
  ink: "#0a0a0a",
  signal: "#c40000",
  "cell-w": 10,
  "cell-h": 22,
  stroke: 1.25,
  fade: 700,
  straight: 0.5,
  blank: 0.06,
  // "screen" runs the field on past the container to fill the screen (the
  // homepage's first-load intro sets it: see logo-morph-loader.js)
  extend: "",
  // "unborn" keeps the words out of the field until the intro's pulse
  // brings each one in (bear): until then the strokes run on under it
  words: "",
};
// Tints between the base and the highlight, the same again from the
// highlight on to the ink, and steps towards the signal red. A stroke's
// light runs 0–1 to the highlight and on to 2 at the ink.
const LEVELS = 12;
const SIGNAL_LEVELS = 8;
// How far the pattern runs on past the container's edges, in whole cells
// (the grid is then shifted up to one more, so each edge crops it well).
const OVERSCAN = 2;
// Where the container's top and foot cut the rows they fall in (a share of
// the way down the row): ideally, and the furthest either way they may go,
// both leaving well over three quarters of each stroke showing; how far the
// row height may give to make both land there; and the least share of a
// stroke any edge must leave showing.
const CUT_TOP = 0.26;
const CUT_FOOT = 0.74;
const CUT_GIVE = 0.06;
const ROW_GIVE = 0.06;
const SHOWN = 0.75;
// Where a stroke sits in its cell: a straight one runs down the middle, a
// slanted one from INSET_X in from either side, and both from INSET_Y down
// to INSET_Y up from the foot, so the rows read as lines with a gap between.
const INSET_X = 0.18;
const INSET_Y = 0.16;
// The tints a stroke can take: ink steps for each red step (see colors).
const SHADES = (2 * LEVELS + 1) * (SIGNAL_LEVELS + 1);
// How long the system's light takes to die away (s): the ink a signal leaves
// in the strokes, and the red, which goes well before it, so a stroke the
// signal crosses turns from red to ink before it settles back to the base.
// Red can be held a moment first, where a burst lands.
const GLOW_FADE = 1.5;
const SIGNAL_FADE = 0.2;

// The sequence. Every range is [least, most], drawn afresh each time.
const SEQUENCE = {
  // the chain's first word, once the field is up (s), and how long after
  // the page has finished arriving, if it was still arriving then; it opens
  // on a burst, picked from the few words nearest the field's middle
  first: 0.3,
  settle: 0.12,
  opener: 3,
  // a word's shockwave sets off a beat after it bursts (s), so the flare is
  // seen first and the wave rolls out of it, unhurried
  beat: [0.16, 0.3],
  // the next word: one of the nearest few still free (near) within reach (a
  // share of the field's width; the nearest of all if none is), the nearer
  // the likelier, onward the way the chain was going a little likelier, and
  // the word this one set off last time much less likely (again)
  near: 3,
  reach: 0.42,
  onward: 1.4,
  again: 0.25,
  // how often the wave also sets off a nearer word it passes, with a smaller
  // answer
  branch: 0.3,
  // the word held forward after it has resolved (s)
  hold: [0.9, 1.4],
  // the traffic under it all: how often a packet sets off from one word
  // towards one of its neighbours (s), how much of the way it gets — never
  // all of it, so a packet never joins two words up — and its pace (cells/s)
  traffic: [0.55, 1.2],
  trafficReach: [0.25, 0.6],
  trafficSpeed: [32, 48],
};
// The decode: a brief moment fully scrambled — the wave's last stretch in,
// then the burst — and resolving across the whole label in the direction the
// wave came in by, one quick front running through it word after word;
// longer labels take a little longer. A word answering a passing wave decodes
// more briefly still. The characters are hexadecimal — data rather than
// decoration — redrawn about fifteen times a second, so even a short decode
// shows a few of them.
const DECODE = {
  chars: "0123456789ABCDEF",
  speed: 0.8,
  major: { hold: 0.12, base: 0.22, perChar: 0.018, min: 0.32, max: 0.62 },
  minor: { hold: 0.06, base: 0.16, perChar: 0.011, min: 0.22, max: 0.4 },
};
// The burst as the wave lands on a word: a small, contained answer, the same
// either side — the word's own frame lighting up and a few short traces out
// of it along its row and its columns, never flung out across the field. The
// frame — the strokes over and under the word and beyond its ends:
// the share lit, the light they keep and the flash they give (light past 1 is
// on the way to the ink), and the share that take the red and hold it (s);
// outer is the share of the ring of strokes one further out that answer it, a
// step fainter and never red. The traces out of it, short: along its row
// from both ends (row), up and down the columns over it from a few spots
// (columns, rise) and out across the diagonals from its corners (diag), all
// lengths in cells; their pace (s per cell) and the light they flash and
// leave. A share of them (hot) carry red at the head for redReach of the
// way, so the burst is mostly ink with the red at its heart. A word
// answering a passing wave answers the same, smaller and fainter.
const BURST = {
  major: {
    frame: 0.72, outer: 0.28, ink: 1.25, flash: 1.45, red: 0.2, hold: 0.3,
    row: [3, 5], columns: 2, rise: [1, 3], diag: [0, 0],
    pace: [0.036, 0.052], traceFlash: 1.35, traceInk: 0.75, redReach: 0.5, hot: 0.25,
  },
  minor: {
    frame: 0.5, outer: 0, ink: 0.75, flash: 1.05, red: 0.08, hold: 0.12,
    row: [2, 3], columns: 1, rise: [1, 1], diag: [0, 0],
    pace: [0.038, 0.052], traceFlash: 1, traceInk: 0.45, redReach: 0.4, hot: 0.1,
  },
};
// The shockwave out of a word that has burst, which carries the chain on: a
// sparse ring of strokes flaring as its front passes, run out from the
// word's own outline. Every way it reaches near (px); towards the word the
// chain goes to next it runs on, in a lobe (the higher lobe, the narrower),
// over (a share) of the way there, and sets that word off as its front
// arrives. Its pace (px/s), held to the least and most time it may take to
// get there (s), slowing a touch as it spreads (spread, the power of
// distance over time); how many of the strokes it passes it lights, how
// strongly they flash and how much light they keep — at the word, and at the
// far end of the wave; the share of the strokes right by the word (within
// two rows) that spark red with it; and how long the strokes it stirs turn
// (s). Ink otherwise, never a line: nothing seen joins two words. A pulse
// through the strokes rather than a blast: sparse, mid-grey, travelling
// steadily, with nothing knocked about as it passes.
const SHOCK = {
  near: 70, lobe: 2, over: 1.08,
  speed: [190, 260], time: [0.85, 1.6], spread: 0.9,
  pick: [0.55, 0.16], flash: [1.25, 0.6], ink: [0.65, 0.12],
  spark: 0.04, turn: 0,
};
// The answer of a word set off by a passing wave: a small ring of light
// round it — how far it reaches (in cells across, rows up and down), how long
// it takes to spread, how sparse it is, how strongly it flashes (past 1
// towards the ink, at its inside), how much of that stays behind it, the
// share of its inner strokes that spark red, and how much further it runs
// (lean) on one side (none here; the intro's clearing uses the same ring).
// The scan: the strokes above and below the word, following the decode's
// front across, a share of them (red) touched with red as the front passes
// and held there a beat (hold, s).
const RIPPLE = {
  minor: { reach: 7, rows: 2, time: 0.6, pick: 0.35, ink: 0.85, after: 0.4, spark: 0.02, lean: 1 },
};
const SCAN = { pick: 0.5, ink: 0.6, flash: 1.2, signal: 1, red: 0.22, hold: 0.1 };
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

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;max-width:none;pointer-events:none;display:block;";
  el.prepend(canvas);
  const ctx = canvas.getContext("2d");
  // the canvas keeps what was drawn from frame to frame (draw); if the
  // browser has to throw that away, draw it all again
  canvas.addEventListener("contextrestored", () => {
    blank(cols * rows);
    draw();
  });

  // the words decode only where the site's GSAP plugins are there to do it
  const canDecode = !!(window.SplitText && window.ScrambleTextPlugin);

  // the container's size, and how far the canvas runs on past its top-left
  // corner (ox, oy); per cell: its glyph, its flash, the system's ink, its
  // red, and how long that red is held before it fades
  let opts, colors, width, height, ox, oy, cols, rows, cellW, cellH;
  let glyph, taken, heat, glow, signal, keep;
  // the rows added above and below the container to fill the screen; per
  // cell, how long its stroke stays stirred, and whether the intro has
  // cleared it away
  let above = 0;
  let below = 0;
  // the rows left undrawn at the screen's top and foot while the field
  // fills it
  let veiled = [-1, -1];
  let stir, gone;
  // drawing: what is on the canvas, per cell — its tint (−1 none) and its
  // stroke (0 none) as last drawn — and a frame's scratch: per row, whether
  // it has changed; the strokes to draw, in tint order; and where each
  // tint's run of them ends. Kept from frame to frame, so a frame allocates
  // nothing.
  let tint, shown, stale, order;
  const ends = new Uint32Array(SHADES + 1);
  let words = [];
  // the words brought into the field, while it is keeping them out — until
  // the intro's pulse brings each in (opts.words "unborn"), or as the page
  // comes in (entering: see enter) — and the calls that will bring them in
  const born = new WeakSet();
  let entering = false;
  let births = [];
  const unborn = (word) => (opts.words === "unborn" || entering) && !born.has(word.label);
  let ticking = false;

  // the sequence: what is lighting the strokes, the words online (each with
  // its timeline and split) and those a wave is on its way to, the call
  // that starts (or restarts) the chain and the one that sends the next
  // packet, and the last few words to come online
  let runs = [];
  let ripples = [];
  let scans = [];
  let waves = [];
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
      fade: num("fade"),
      straight: num("straight"),
      blank: num("blank"),
      extend: String(readOption(el, "extend")).trim(),
      words: String(readOption(el, "words")).trim(),
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

  // How well a container's side crops the strokes, at a fraction f of the
  // way through a cell: it should cut the slanted strokes part-way and keep
  // clear of the straight one at the middle, which a side running down it
  // would turn into a border.
  const cropAcross = (f) => Math.min(f - 0.18, 0.82 - f, Math.abs(f - 0.5) - 0.04);

  // The overscan before the container's first cell edge (px): OVERSCAN cells,
  // and the shift into the next cell that crops both sides best.
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

  // How much of a row's strokes an edge leaves showing, cutting the row a
  // share f of the way down it: what is below the cut at a top edge (top),
  // above it at a foot. An edge in the gap between two rows cuts nothing.
  function shows(f, top) {
    const span = 1 - 2 * INSET_Y;
    if (f <= INSET_Y || f >= 1 - INSET_Y) return 1;
    return top ? (1 - INSET_Y - f) / span : (f - INSET_Y) / span;
  }
  const frac = (n) => n - Math.floor(n);

  // The rows for a container of the given height: their height, near the
  // asked-for one (within ROW_GIVE), and where its top cuts its first row
  // (a share of the way down it), with whole rows between that and its foot
  // cutting its last — both near CUT_TOP and CUT_FOOT (within CUT_GIVE).
  // Filling the screen (screen: the container's top in the viewport, and the
  // screen's height), the rows that also cut the screen's top and foot best;
  // among equals, the nearest the ideal cuts and the asked-for height.
  function fitRows(size, cell, screen) {
    let best = [cell, CUT_TOP];
    let bestRank = -Infinity;
    const steps = [-1, -0.5, 0, 0.5, 1].map((k) => k * CUT_GIVE);
    for (const dt of steps) {
      for (const df of steps) {
        const top = CUT_TOP + dt;
        const span = CUT_FOOT + df - top;
        const least = Math.max(1, Math.ceil(size / (cell * (1 + ROW_GIVE)) - span));
        const most = Math.floor(size / (cell * (1 - ROW_GIVE)) - span);
        for (let n = least; n <= most; n++) {
          const h = size / (n + span);
          const score = screen
            ? Math.min(shows(frac(top - screen.top / h), true), shows(frac(top + (screen.height - screen.top) / h), false))
            : 1;
          // good enough at the screen's edges is as good as perfect; past
          // that, the nearer the ideal cuts and the asked-for size the better
          const rank = Math.min(score, SHOWN) * 100 - (Math.abs(dt) + Math.abs(df)) * 4 - Math.abs(h - cell) / cell;
          if (rank > bestRank) {
            bestRank = rank;
            best = [h, top];
          }
        }
      }
    }
    return best;
  }

  // While the field fills the screen, the rows the screen's top and foot
  // would cut to a stub (field rows; -1 for none): left undrawn meanwhile.
  function stubs(box) {
    const at = (y) => (y - box.top + oy) / cellH;
    const top = at(0);
    const foot = at(window.innerHeight);
    return [
      shows(frac(top), true) < SHOWN ? Math.floor(top) : -1,
      shows(frac(foot), false) < SHOWN ? Math.floor(foot) : -1,
    ];
  }

  function layout() {
    stopSequence();
    readOptions();
    width = el.clientWidth;
    height = el.clientHeight;

    // The pattern is larger than the container and sits under it, which
    // crops it: OVERSCAN cells and a little more past each edge, shifted
    // across so each side cuts through the strokes part-way, and its rows
    // sized and placed so the top and foot each cut a row near the far end
    // of its strokes (fitRows). So it carries on behind the container's
    // edges rather than having been made to fit inside them.
    cellW = opts.cellW;
    const empty = width < cellW || height < opts.cellH;
    // Filling the screen, the field runs on in whole rows over everything
    // above the container and under it. The rows are counted from the
    // container's own first row, so its strokes are the same with or
    // without them, and the container can settle back to its crop without
    // a stroke in it changing.
    const box = !empty && opts.extend === "screen" ? el.getBoundingClientRect() : null;
    const [rowH, cutTop] = empty ? [opts.cellH, CUT_TOP] : fitRows(height, opts.cellH, box && { top: box.top, height: window.innerHeight });
    cellH = rowH;
    above = box ? Math.ceil(Math.max(0, box.top) / cellH) : 0;
    below = box ? Math.ceil(Math.max(0, window.innerHeight - box.bottom) / cellH) : 0;
    ox = empty ? 0 : overscan(width, cellW, cropAcross);
    oy = empty ? 0 : (OVERSCAN + cutTop + above) * cellH;
    veiled = box ? stubs(box) : [-1, -1];
    cols = empty ? 0 : Math.ceil((ox + width) / cellW) + OVERSCAN;
    rows = empty ? 0 : Math.ceil((oy + height) / cellH) + OVERSCAN + below;

    sizeCanvas();

    glyph = new Uint8Array(cols * rows);
    taken = new Uint8Array(cols * rows);
    heat = new Float32Array(cols * rows);
    glow = new Float32Array(cols * rows);
    signal = new Float32Array(cols * rows);
    keep = new Float32Array(cols * rows);
    stir = new Float32Array(cols * rows);
    gone = new Uint8Array(cols * rows);
    blank(cols * rows);
    const slant = opts.straight + (1 - opts.straight) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (hash(c, r - above, 1) < opts.blank) continue;
        const m = hash(c, r - above, 2);
        glyph[r * cols + c] = m < opts.straight ? 2 : m < slant ? 1 : 3;
      }
    }

    placeWords();
    if (hole.length) clearHole();
    plan(SEQUENCE.first);
    planTraffic(SEQUENCE.first + between(SEQUENCE.traffic));
    draw();
  }

  // The canvas at the pattern's size, sharp for the device's pixels; it sits
  // up and left of the container by the overscan.
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.left = `${-ox}px`;
    canvas.style.top = `${-oy}px`;
    canvas.style.width = `${cols * cellW}px`;
    canvas.style.height = `${rows * cellH}px`;
    canvas.width = Math.round(cols * cellW * dpr);
    canvas.height = Math.round(rows * cellH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // A canvas with nothing on it yet, as sizing it leaves it, for n cells.
  function blank(n) {
    tint = new Int16Array(n).fill(-1);
    shown = new Uint8Array(n);
    stale = new Uint8Array(cols ? Math.ceil(n / cols) : 0);
    order = new Uint32Array(n);
  }

  // The field cut back to the container once the homepage's intro is over:
  // the rows it ran on over the rest of the screen are dropped, and every
  // stroke left keeps its light and whatever is still under way in it. The
  // rows are counted from the container's own first row either way, so not a
  // stroke the band shows changes — the field just stops drawing the screen
  // the band no longer shows.
  function crop() {
    if (!above && !below) return;
    const shift = above * cols;
    const kept = (rows - above - below) * cols;
    const move = (i) => (i >= shift && i < shift + kept ? i - shift : -1);
    const cut = (array) => array.slice(shift, shift + kept);
    glyph = cut(glyph);
    taken = cut(taken);
    heat = cut(heat);
    glow = cut(glow);
    signal = cut(signal);
    keep = cut(keep);
    stir = cut(stir);
    gone = cut(gone);
    blank(kept);

    // what is under way, moved with its strokes; anything that was out on
    // the screen alone is let go
    runs = runs.filter((s) => (s.route = s.route.map(move)).every((i) => i >= 0));
    ripples.forEach((rp) => rp.cells.forEach((cell) => (cell.i = move(cell.i))));
    waves.forEach((w) => w.i.forEach((i, k) => (w.i[k] = move(i))));
    cues.forEach((q) => {
      if (q.i != null) q.i = move(q.i);
      if (q.r != null) q.r -= above;
    });
    words.forEach((word) => {
      word.r -= above;
      word.y -= above * cellH;
    });
    hole = [];
    holeCells = new Map();

    oy -= above * cellH;
    rows -= above + below;
    above = below = 0;
    veiled = [-1, -1];
    opts.extend = "";
    opts.words = "";
    sizeCanvas();
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

    // The area a word is placed in, in the field's own px: the container,
    // or — for a word set on the screen (data-slash-screen: the homepage
    // intro's, placed only while the field fills the screen) — the screen.
    const fill = opts.extend === "screen";
    const box = fill ? el.getBoundingClientRect() : null;
    const areas = {
      container: { x: ox, y: oy, w: width, h: height },
      screen: fill ? { x: ox - box.left, y: oy - box.top, w: document.documentElement.clientWidth, h: window.innerHeight } : null,
    };

    labels.forEach((label) => {
      label.removeAttribute("data-slash-active");
      const area = label.hasAttribute("data-slash-screen") ? areas.screen : areas.container;
      if (!area) {
        label.style.visibility = "hidden";
        return;
      }
      // the cells wholly inside it: the first and last of them
      const left = Math.ceil(area.x / cellW);
      const right = Math.floor((area.x + area.w) / cellW) - 1;
      const top = Math.ceil(area.y / cellH);
      const bottom = Math.floor((area.y + area.h) / cellH) - 1;
      const from = parseFloat(label.dataset.slashFrom) || 0;
      const w = label.offsetWidth;
      const n = Math.max(1, Math.ceil(w / cellW));

      // c is the word's first cell and r its row, with an empty cell either
      // side; the word stays wholly inside its area, never on or beside
      // another word's row where the two would crowd, and — while there is
      // a row for it (apart) — on a row no other word is on, so no two read
      // as a line of them
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
        const c = Math.min(Math.max(Math.round((area.x + fx * area.w - (n * cellW) / 2) / cellW), left + 1), right - n);
        const r = Math.min(Math.max(Math.floor((area.y + fy * area.h) / cellH), top), bottom);
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
        last: -Infinity,
        travel: 1,
        // set on the screen for the intro only, and let go after it
        intro: area === areas.screen,
      });
    });

    // The pattern stops around each word: its cells, and one either side,
    // are left empty, so the strokes run up to the word and on after it
    // but never through or behind the letters. A signal never runs through
    // them either. A word not yet born into the field has the strokes run
    // on under it, as if it were not there.
    words.forEach((word) => {
      if (unborn(word)) return;
      const { c, n, r } = word;
      for (let cc = c - 1; cc <= c + n; cc++) {
        glyph[r * cols + cc] = 0;
        taken[r * cols + cc] = 1;
      }
    });
  }

  /* ---------- drawing: only the rows that have changed ---------- */
  // The canvas keeps what was drawn last frame, and only the rows with a
  // stroke whose tint or shape has changed since are drawn again: cleared
  // across, and every stroke in them drawn anew. A row's strokes stand well
  // in from its top and foot, so clearing one never touches another's — the
  // canvas is always exactly what drawing it whole would give. The strokes
  // drawn are sorted by tint (a counting sort into the arrays kept for it),
  // one path per tint, so a frame makes no objects for the garbage
  // collector, and a quiet field costs next to nothing to keep up however
  // fine its grid.
  function draw() {
    if (!cols || !rows) return;
    // a stirred stroke turns through the three strokes, about twenty times a
    // second, each on its own beat
    const spin = Math.floor(now() * 22);
    let changed = 0;
    for (let r = 0; r < rows; r++) {
      let row = 0;
      const veil = r === veiled[0] || r === veiled[1];
      for (let i = r * cols, end = i + cols; i < end; i++) {
        let k = -1;
        let g = 0;
        if (glyph[i] && !gone[i] && !veil) {
          const level = Math.min(2 * LEVELS, Math.ceil(Math.max(heat[i], glow[i]) * LEVELS));
          const red = signal[i] ? Math.ceil(Math.min(1, signal[i]) * SIGNAL_LEVELS) : 0;
          k = red * (2 * LEVELS + 1) + level;
          g = stir[i] ? 1 + Math.floor(hash(i - r * cols, r, 20 + spin) * 3) : glyph[i];
        }
        if (k === tint[i] && g === shown[i]) continue;
        tint[i] = k;
        shown[i] = g;
        row = 1;
      }
      stale[r] = row;
      changed += row;
    }
    if (!changed) return;

    // clear the rows that changed, a run of them at a time, and count their
    // strokes by tint
    ends.fill(0);
    for (let r = 0; r < rows; r++) {
      if (!stale[r]) continue;
      let last = r;
      while (last + 1 < rows && stale[last + 1]) last++;
      ctx.clearRect(0, r * cellH, cols * cellW, (last + 1 - r) * cellH);
      for (let i = r * cols, end = (last + 1) * cols; i < end; i++) if (tint[i] >= 0) ends[tint[i] + 1]++;
      r = last;
    }
    for (let k = 1; k <= SHADES; k++) ends[k] += ends[k - 1];
    for (let r = 0; r < rows; r++) {
      if (!stale[r]) continue;
      for (let i = r * cols, end = i + cols; i < end; i++) if (tint[i] >= 0) order[ends[tint[i]]++] = i;
    }

    ctx.lineWidth = opts.stroke;
    ctx.lineCap = "butt";
    for (let k = 0, start = 0; k < SHADES; start = ends[k], k++) {
      if (ends[k] === start) continue;
      ctx.beginPath();
      for (let o = start; o < ends[k]; o++) segment(order[o], shown[order[o]]);
      ctx.strokeStyle = colors[k];
      ctx.stroke();
    }
  }

  // Adds cell i's stroke — g: 1 /, 2 |, 3 \ — to the path.
  function segment(i, g) {
    const x = (i % cols) * cellW;
    const r = (i / cols) | 0;
    const top = r * cellH + cellH * INSET_Y;
    const bottom = (r + 1) * cellH - cellH * INSET_Y;
    if (g === 2) {
      ctx.moveTo(x + cellW / 2, top);
      ctx.lineTo(x + cellW / 2, bottom);
    } else if (g === 1) {
      ctx.moveTo(x + cellW * INSET_X, bottom);
      ctx.lineTo(x + cellW * (1 - INSET_X), top);
    } else {
      ctx.moveTo(x + cellW * INSET_X, top);
      ctx.lineTo(x + cellW * (1 - INSET_X), bottom);
    }
  }

  /* ---------- the system's light in the strokes ---------- */
  // Lights a stroke with ink and red, never dimming what is already lit;
  // flash is a brief light on a quick fade (opts.fade), so it passes, and
  // hold keeps the red where it is that long (s) before it fades.
  function light(i, ink, red = 0, flash = 0, hold = 0) {
    if (!glyph[i] || gone[i]) return;
    if (ink > glow[i]) glow[i] = ink;
    if (red && red >= signal[i]) {
      signal[i] = red;
      if (hold > keep[i]) keep[i] = hold;
    }
    if (flash > heat[i]) heat[i] = flash;
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

  // A trace: a head running the route over its duration on the ease, after
  // a delay, lighting each stroke as it reaches it with the shade for that
  // point along it (0 at its start, 1 at its end) — [ink, red, flash] — and a
  // scattered few left dark. The traces a burst flings out, the intro's, and
  // the traffic.
  function run(route, { duration, ease, shade, pick, delay = 0 }) {
    runs.push({ route, duration, ease: gsap.parseEase(ease), shade, pick, t: -delay, done: 0 });
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
        if (hash(i % cols, (i / cols) | 0, 5) > s.pick) continue;
        const [ink, red, flash = 0] = s.shade(u);
        light(i, ink, red, flash);
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

  // The burst as the wave lands on a word: the frame round it flares at once
  // — the rows over and under it and the cells beyond its ends — a share of
  // it holding the red a moment, and part of the ring one further out
  // answering in ink; and short traces fly out of it on every side, like
  // debris, some red at the head and ink behind. A word coming fully online
  // then sends its shockwave out (handOn); one answering a passing wave has a
  // small ring of its own instead.
  function burst(word, kind) {
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
    // out along the row from both ends
    trace(c + n + 1, r, 1, 0, spec.row);
    trace(c - 2, r, -1, 0, spec.row);
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

    if (kind === "minor") ripple(word, RIPPLE.minor);
  }

  // A wave: strokes lit one by one as a front reaches each — a word's
  // shockwave, and the intro's pulse through the whole field. Each stroke is
  // a row of flat arrays — the cell, when the front gets there (s), the light
  // it keeps, the red it takes, the flash it gives and how long it turns —
  // put in order by a counting sort on the frames rather than as a list of
  // objects, so a front across the whole screen costs next to nothing to set
  // off. calls are run as the front passes their moment (at, s).
  const WAVE_STEP = 1 / 120;
  // How many strokes of a wave across the whole field are worked out a
  // frame; and the work still to do, a step each frame, each step handing
  // back whether it is done.
  const BUILD_CELLS = 2400;
  let jobs = [];

  // A wave of at most size strokes, its arrays made at that size up front.
  function wave(size, hold = 0) {
    return {
      i: new Int32Array(size),
      at: new Float32Array(size),
      ink: new Float32Array(size),
      red: new Float32Array(size),
      flash: new Float32Array(size),
      turn: new Float32Array(size),
      n: 0,
      calls: [],
      hold,
      t: 0,
      k: 0,
      order: null,
    };
  }

  function mark(w, i, at, ink, red, flash, turn) {
    const k = w.n++;
    w.i[k] = i;
    w.at[k] = at;
    w.ink[k] = ink;
    w.red[k] = red;
    w.flash[k] = flash;
    w.turn[k] = turn;
  }

  function launch(w) {
    const n = w.n;
    let last = 0;
    for (let k = 0; k < n; k++) if (w.at[k] > last) last = w.at[k];
    const starts = new Uint32Array(Math.floor(last / WAVE_STEP) + 2);
    for (let k = 0; k < n; k++) starts[((w.at[k] / WAVE_STEP) | 0) + 1]++;
    for (let s = 1; s < starts.length; s++) starts[s] += starts[s - 1];
    w.order = new Uint32Array(n);
    for (let k = 0; k < n; k++) w.order[starts[(w.at[k] / WAVE_STEP) | 0]++] = k;
    waves.push(w);
    wake();
  }

  function advanceWaves(dt) {
    // a call may set off a wave of its own, which joins the rest next frame
    const current = waves;
    waves = [];
    waves = current.filter((w) => {
      w.t += dt;
      const slot = (w.t / WAVE_STEP) | 0;
      for (; w.k < w.order.length; w.k++) {
        const k = w.order[w.k];
        if (((w.at[k] / WAVE_STEP) | 0) > slot) break;
        const i = w.i[k];
        if (i < 0 || !glyph[i] || gone[i]) continue;
        if (w.turn[k] > stir[i]) stir[i] = w.turn[k];
        light(i, w.ink[k], w.red[k], w.flash[k], w.hold);
      }
      if (w.calls.length) w.calls = w.calls.filter((call) => call.at > w.t || void call.fn());
      return w.k < w.order.length || w.calls.length > 0;
    });
  }

  // Where a word sits in the field (px): its cells and the empty one either
  // side, the outline a wave runs out from and arrives at.
  const outline = ({ c, n, r }) => ({ x0: (c - 1) * cellW, x1: (c + n + 1) * cellW, y0: r * cellH, y1: (r + 1) * cellH });
  // the nearest point of an outline to (x, y)
  const nearest = (o, x, y) => [clamp(x, o.x0, o.x1), clamp(y, o.y0, o.y1)];

  // The way from one word's outline to another's: how far it is (px), and
  // which way (radians).
  function gap(a, b) {
    const oa = outline(a);
    const ob = outline(b);
    const [ax, ay] = nearest(oa, (ob.x0 + ob.x1) / 2, (ob.y0 + ob.y1) / 2);
    const [bx, by] = nearest(ob, ax, ay);
    const [px, py] = nearest(oa, bx, by);
    return { d: Math.max(cellW, Math.hypot(bx - px, by - py)), angle: Math.atan2(by - py, bx - px) };
  }

  // A word's shockwave: out of its outline every way as far as SHOCK.near,
  // and on towards the next word (the given way to it) in a lobe, a little
  // past it. Every stroke the front passes flares and keeps a little light,
  // fewer and fainter the further out; a few right by the word spark red, and
  // the strokes close in turn as it passes, as if knocked. Hands back the
  // wave, for its calls; the time its front takes to reach the next word, and
  // to reach any distance; and whether it passes over a word at a given way.
  function shock(word, way = null) {
    const spec = SHOCK;
    const o = outline(word);
    const span = way ? Math.max(spec.near, way.d * spec.over) : spec.near;
    const time = way ? clamp(way.d / between(spec.speed), ...spec.time) : spec.time[0];
    const far = way ? way.d : spec.near;
    const when = (d) => time * (d / far) ** spec.spread;
    const lobe = (angle) => (way ? Math.max(0, Math.cos(angle - way.angle)) ** spec.lobe : 0);
    const passes = (g) => g.d < spec.near + (span - spec.near) * lobe(g.angle);
    const c0 = Math.max(0, Math.floor((o.x0 - span) / cellW));
    const c1 = Math.min(cols - 1, Math.ceil((o.x1 + span) / cellW));
    const r0 = Math.max(0, Math.floor((o.y0 - span) / cellH));
    const r1 = Math.min(rows - 1, Math.ceil((o.y1 + span) / cellH));
    const w = wave(Math.max(0, (c1 - c0 + 1) * (r1 - r0 + 1)), 0.08);
    for (let r = r0; r <= r1; r++) {
      const cy = (r + 0.5) * cellH;
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        if (!glyph[i] || gone[i] || taken[i]) continue;
        const cx = (c + 0.5) * cellW;
        const [px, py] = nearest(o, cx, cy);
        const d = Math.hypot(cx - px, cy - py);
        if (!d) continue;
        // how far the wave runs this way: near every way, on towards the next
        // word within its lobe
        const limit = spec.near + (span - spec.near) * lobe(Math.atan2(cy - py, cx - px));
        if (d >= limit) continue;
        // strongest by the word, fading as it spreads, and thinning out
        // towards the edge of its reach this way
        const s = 1 - Math.min(1, d / span);
        const edge = Math.min(1, (limit - d) / (0.3 * limit + cellW));
        if (Math.random() > (spec.pick[1] + (spec.pick[0] - spec.pick[1]) * s) * edge) continue;
        const red = d < 2 * cellH && Math.random() < spec.spark ? 1 : 0;
        mark(w, i, when(d),
          spec.ink[1] + (spec.ink[0] - spec.ink[1]) * s,
          red,
          (spec.flash[1] + (spec.flash[0] - spec.flash[1]) * s) * (0.6 + 0.4 * edge),
          s > 0.7 ? spec.turn * s : 0);
      }
    }
    launch(w);
    return { wave: w, time, when, passes };
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

  /* ---------- the intro: the field as the homepage's way in ----------
     The first-load intro (logo-morph-loader.js) plays out in the field
     itself: it carves the name its room in the middle of the screen as it
     rises in, pushes a clearing open round it and sends a pulse out
     through the whole field as the logo's disc comes up, and closes the
     clearing again as the logo leaves for the nav. Each is
     made of the field's own moves — the light a burst leaves, its traces,
     its ripple — and one more, the stir: as a wave passes a stroke, it
     turns through / | \ and back, so the field reads as displaced by the
     wave while no stroke ever leaves its cell. Points are given in the
     viewport's coordinates.

     A wave is a list of cues, one per stroke at its own moment: lit
     (FLASH), cleared away (VANISH) or brought back (RESTORE), or cut out
     for good to make room for a word (CARVE); and a few that are more
     than one stroke: a word being born into the field (BEAR), and a short
     trace flung out ahead of the pulse (SPARK). */
  const FLASH = 0;
  const VANISH = 1;
  const RESTORE = 2;
  const CARVE = 3;
  const BEAR = 4;
  const SPARK = 5;
  const TURN = 6;
  let cues = [];
  let cueAt = 0;
  let clock = 0;
  // the clearing: the shapes it has been cut round (so a field laid out
  // again can cut them again) and the cells it holds, each with how far
  // through its sweep it is; the strokes turned to lie along a shape's edge,
  // each with the stroke it had; the words it covers; and whether traffic
  // runs while the page is arriving
  let hole = [];
  let holeCells = new Map();
  let turned = new Map();
  let holeWords = [];
  let introLive = false;

  const toField = (x, y) => {
    const box = el.getBoundingClientRect();
    return [x - box.left + ox, y - box.top + oy];
  };

  // The grid in the viewport's terms, for setting something into it: the
  // size of a cell, where the field's first cell starts (x, y), and how far
  // a stroke stands in from the top and foot of its cell (inset, a share of
  // its height) — so a row's strokes run from y + (r + inset) × cellH down
  // to y + (r + 1 − inset) × cellH.
  function grid() {
    const box = el.getBoundingClientRect();
    return { cellW, cellH, x: box.left - ox, y: box.top - oy, inset: INSET_Y };
  }

  function schedule(list) {
    list.forEach((q) => (q.at += clock));
    cues = cues.slice(cueAt).concat(list).sort((a, b) => a.at - b.at);
    cueAt = 0;
    wake();
  }

  function advanceCues() {
    for (; cueAt < cues.length && cues[cueAt].at <= clock; cueAt++) {
      const q = cues[cueAt];
      const { i, op, ink = 0, red = 0, flash = 0, hold = 0, turn = 0 } = q;
      if (op === BEAR) {
        bear(q.word, q.travel);
        continue;
      }
      if (op === SPARK) {
        spark(q);
        continue;
      }
      if (op === VANISH) {
        gone[i] = 1;
        continue;
      }
      if (op === CARVE) {
        glyph[i] = 0;
        taken[i] = 1;
        continue;
      }
      if (op === RESTORE) {
        gone[i] = 0;
        if (q.glyph >= 0) glyph[i] = q.glyph;
      }
      if (op === TURN) glyph[i] = q.glyph;
      if (turn > stir[i] && glyph[i]) stir[i] = turn;
      light(i, ink, red, flash, hold);
    }
    if (cueAt >= cues.length) {
      cues = [];
      cueAt = 0;
    }
  }

  // The stroke a cell would draw, as its two ends in the viewport's terms:
  // g is 1 /, 2 |, 3 \.
  function strokeEnds(c, r, g, gx, gy) {
    const x = gx + c * cellW;
    const top = gy + (r + INSET_Y) * cellH;
    const bottom = gy + (r + 1 - INSET_Y) * cellH;
    if (g === 2) return [x + cellW / 2, top, x + cellW / 2, bottom];
    const left = x + cellW * INSET_X;
    const right = x + cellW * (1 - INSET_X);
    return g === 1 ? [left, bottom, right, top] : [left, top, right, bottom];
  }

  // The stroke that runs closest to the way (ex, ey) does, or 0 if none of
  // the three is near enough to it to read as following it.
  function strokeAlong(ex, ey) {
    const run = Math.hypot(ex, ey) || 1;
    const w = cellW * (1 - 2 * INSET_X);
    const h = cellH * (1 - 2 * INSET_Y);
    const slant = Math.hypot(w, h);
    const fits = [
      [1, Math.abs(ex * w - ey * h) / (run * slant)],
      [2, Math.abs(ey) / run],
      [3, Math.abs(ex * w + ey * h) / (run * slant)],
    ].sort((a, b) => b[1] - a[1]);
    return fits[0][1] >= 0.92 ? fits[0][0] : 0;
  }

  // The cells round a shape, sorted as it needs them: spec.shape(x, y)
  // gives, for a point in the viewport, how far it is from the shape (px, 0
  // inside) and which way the shape's edge runs nearest it — [d, ex, ey]. A
  // cell in spec.box (viewport px) whose stroke comes within spec.margin of
  // the shape is cut, unless its stroke turned to run along the edge there
  // would clear it, when it is turned instead; and one whose middle is within
  // spec.echo (px) of the shape is turned to run along its edge even if it
  // would clear it as it is, so the strokes right beside the shape follow
  // it — an empty cell there too, given a stroke that clears it, so the
  // pattern's own gaps never sit against the shape and read as space round
  // it. Each is handed on with its moment in the sweep (spec.sweep(x, y),
  // 0–1).
  function fit(spec, onCut, onTurn) {
    const { box, shape, margin, sweep, echo = 0 } = spec;
    const field = el.getBoundingClientRect();
    const gx = field.left - ox;
    const gy = field.top - oy;
    const clearance = margin + opts.stroke / 2;
    // past this from a cell's middle, nothing of its stroke can be in reach
    const far = Math.max(clearance + Math.hypot(cellW, cellH) / 2, echo);
    const clears = (c, r, g) => {
      const [ax, ay, bx, by] = strokeEnds(c, r, g, gx, gy);
      for (let k = 0; k <= 4; k++) if (shape(ax + ((bx - ax) * k) / 4, ay + ((by - ay) * k) / 4)[0] < clearance) return false;
      return true;
    };
    const c0 = Math.max(0, Math.floor((box.x0 - gx) / cellW));
    const c1 = Math.min(cols - 1, Math.floor((box.x1 - gx) / cellW));
    const r0 = Math.max(0, Math.floor((box.y0 - gy) / cellH));
    const r1 = Math.min(rows - 1, Math.floor((box.y1 - gy) / cellH));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        if (gone[i] || taken[i] || holeCells.has(i)) continue;
        const x = gx + (c + 0.5) * cellW;
        const y = gy + (r + 0.5) * cellH;
        const [d, ex, ey] = shape(x, y);
        if (d >= far) continue;
        if (!glyph[i]) {
          const fill = strokeAlong(ex, ey) || 1 + Math.floor(hash(c, r, 4) * 3);
          if (d < echo && clears(c, r, fill)) onTurn(i, fill, sweep(x, y));
          continue;
        }
        const own = clears(c, r, glyph[i]);
        if (own && d >= echo) continue;
        const g = strokeAlong(ex, ey);
        if (g && g !== glyph[i] && clears(c, r, g)) onTurn(i, g, sweep(x, y));
        else if (!own) onCut(i, sweep(x, y));
      }
    }
  }

  // The clearing, cut at once: for a field laid out again while it is open.
  function clearHole() {
    holeCells = new Map();
    turned = new Map();
    hole.forEach((spec) => fit(spec, (i, d) => {
      gone[i] = 1;
      holeCells.set(i, d);
    }, (i, g) => {
      turned.set(i, glyph[i]);
      glyph[i] = g;
    }));
  }

  // Clears the strokes from round a shape (see fit), as close as they can
  // stand to it, over the given time in the order of its sweep: a stroke in
  // the way flares, turns and is gone; one that can stay by lying along the
  // shape's edge turns to that and settles, so the pattern runs along the
  // shape rather than leaving a margin of its own round it. ink, flash and
  // red are the flare's. It stays cut until the clearing closes.
  function hug(spec, time, { ink = 0.9, flash = 1.3, red = 0.08 } = {}) {
    hole.push(spec);
    const list = [];
    fit(spec, (i, d) => {
      holeCells.set(i, d);
      const at = d * time;
      const c = i % cols;
      const r = (i / cols) | 0;
      list.push({ at, i, op: FLASH, ink, flash, red: hash(c, r, 12) < red ? 1 : 0, turn: 0.14 });
      list.push({ at: at + 0.06 + 0.06 * hash(c, r, 13), i, op: VANISH });
    }, (i, g, d) => {
      if (!turned.has(i)) turned.set(i, glyph[i]);
      list.push({ at: d * time, i, op: TURN, glyph: g, ink: ink * 0.5, flash: flash * 0.7, turn: 0.16 });
    });
    schedule(list);
  }

  // Carves a word's room out of the field, hugging its letters: shape (see
  // fit) is the word, box the cells to look at, margin how close a stroke
  // may come and echo how close one turns to follow the letters (px); swept
  // across from its left to its right over the given time, the way the field
  // leaves a word its cells — a quiet flare and the strokes gone or turned,
  // nothing flung out.
  function carve(shape, box, { margin = 2.5, echo = 0, time = 0.4 } = {}) {
    hug({ shape, box, margin, echo, sweep: (x) => clamp((x - box.x0) / (box.x1 - box.x0), 0, 1) }, time, { ink: 0.75, flash: 1.1, red: 0 });
  }

  // Opens a round clearing of the given radius (px) about (x, y), hugging the
  // circle — the field pushed back by it rather than kept at a distance, the
  // strokes at its rim turned to run round it — from the middle out: each
  // stroke flares, turns and is gone; the words it would cover step aside, a
  // faint ring runs out through the strokes past its edge and a few short
  // traces out of it.
  function open(x, y, radius, { margin = 3.5, echo = 0, time = 0.5 } = {}) {
    const reach = radius + margin + cellW;
    hug({
      shape: (px, py) => {
        const dx = px - x;
        const dy = py - y;
        return [Math.max(0, Math.hypot(dx, dy) - radius), -dy, dx];
      },
      box: { x0: x - reach - echo, y0: y - reach - echo, x1: x + reach + echo, y1: y + reach + echo },
      margin,
      echo,
      sweep: (px, py) => clamp(Math.hypot(px - x, py - y) / reach, 0, 1),
    }, time);

    // A word the clearing would cover waits to be born until it closes (bear).
    const [fx, fy] = toField(x, y);
    holeWords = holeWords.concat(words.filter((word) => {
      const [nx, ny] = nearest(outline(word), fx, fy);
      return Math.hypot(nx - fx, ny - fy) < reach + cellH;
    }));

    const c0 = Math.floor((fx - radius) / cellW);
    const c1 = Math.ceil((fx + radius) / cellW);
    const r = Math.floor(fy / cellH);
    const rowsOut = Math.ceil(radius / cellH);
    ripple({ c: c0, n: c1 - c0, r }, { reach: 10, rows: rowsOut + 3, time: 1, pick: 0.4, ink: 1, after: 0.35, spark: 0.03, lean: 1 });

    // the traces: out of its edge along its row both ways, and up and down
    const out = (cc, rr, dc, dr, hot) => {
      const route = [];
      for (let k = Math.round(between([3, 6])); k > 0; k--, cc += dc, rr += dr) {
        if (cc < 0 || cc >= cols || rr < 0 || rr >= rows || taken[rr * cols + cc]) break;
        route.push(rr * cols + cc);
      }
      if (route.length < 2) return;
      run(route, {
        duration: route.length * between([0.035, 0.05]),
        ease: "power2.out",
        shade: (u) => [0.8 * (1 - 0.5 * u), hot && u < 0.5 ? 1 - 0.5 * u : 0, 1.3 * (1 - 0.4 * u)],
        pick: 0.9,
        delay: time * 0.55 + Math.random() * 0.08,
      });
    };
    out(c1 + 1, r, 1, 0, true);
    out(c0 - 1, r, -1, 0, true);
    out(Math.round(fx / cellW), r - rowsOut - 1, 0, -1, false);
    out(Math.round(fx / cellW), r + rowsOut + 1, 0, 1, false);
  }

  // Closes the clearing: from its edge in, each stroke comes back turning
  // and settles, lit a moment, and the words it held back are born as the
  // field fills in round them.
  function close(time = 0.6) {
    if (!holeCells.size && !turned.size) return;
    const cells = [...new Set([...holeCells.keys(), ...turned.keys()])];
    const midX = cells.reduce((sum, i) => sum + (i % cols), 0) / cells.length;
    const midY = cells.reduce((sum, i) => sum + ((i / cols) | 0), 0) / cells.length;
    const out = (i) => Math.hypot(((i % cols) - midX) * cellW, (((i / cols) | 0) - midY) * cellH);
    const far = Math.max(...cells.map(out)) || 1;
    schedule(cells.map((i) => ({
      at: (1 - out(i) / far) * time * (0.8 + 0.4 * hash(i % cols, (i / cols) | 0, 14)),
      i,
      op: RESTORE,
      glyph: turned.has(i) ? turned.get(i) : -1,
      flash: 0.7,
      turn: 0.2,
    })));
    const waiting = holeWords;
    hole = [];
    holeCells = new Map();
    turned = new Map();
    holeWords = [];
    schedule(waiting.map((word, k) => ({ at: time * 0.6 + k * 0.08, op: BEAR, word, travel: 1 })));
  }

  // The words set on the screen for the intro, let go once it is over: out
  // of the network, so no signal is ever sent to a word the band has cropped
  // away, and out of the page.
  function retire() {
    words = words.filter((word) => {
      if (!word.intro) return true;
      word.label.hidden = true;
      return false;
    });
  }

  // A pulse out of (x, y) through the whole field, from a ring of the given
  // radius (px) to its far corner: strongest at the start — a firm grey with
  // a touch of red in it, never a dark mass — and fainter and sparser as it
  // travels, until at the edges it barely lifts the strokes; every stroke it
  // reaches turns a little as it passes. It slows as it goes, the way a wave
  // spreads.
  //
  // It is a chain reaction rather than a ring: ahead of it short traces are
  // flung outward, red-headed near the logo and grey further out, and each
  // word still out of the field is born as the front reaches it — its
  // strokes flaring and cut away from under it, its label decoding in with
  // a burst of its own — so the field comes up word by word in its wake.
  //
  // Given a delay (s), it is worked out now and sets off that much later, so
  // the work of it can be done in a quiet moment rather than on the frame
  // the logo's disc opens; strokes cleared away meanwhile are passed over.
  function pulse(x, y, { inner = 0, time = 1.5, delay = 0 } = {}) {
    const [fx, fy] = toField(x, y);
    const far = Math.max(
      Math.hypot(fx, fy), Math.hypot(cols * cellW - fx, fy),
      Math.hypot(fx, rows * cellH - fy), Math.hypot(cols * cellW - fx, rows * cellH - fy));
    const out = (d) => Math.min(1, Math.max(0, (d - inner) / (far - inner)));
    const when = (u) => delay + time * u ** 0.8;
    // the strokes, as one wave rather than a cue each: a whole screen of them
    // costs next to nothing to keep in order as the words born behind it add
    // cues of their own. Worked out a band of rows a frame, so no one frame
    // carries the whole screen, and set off once it is all worked out, its
    // clock already as far on as the frames that took.
    const front = wave(cols * rows, 0.06);
    const begun = clock;
    const band = Math.max(1, Math.ceil(BUILD_CELLS / cols));
    let r = 0;
    const build = () => {
      for (const end = Math.min(rows, r + band); r < end; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (!glyph[i] || gone[i]) continue;
          const dx = c * cellW + cellW / 2 - fx;
          const dy = r * cellH + cellH / 2 - fy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < inner) continue;
          const u = out(d);
          const strength = (1 - u) ** 1.5;
          if (hash(c, r, 15) > 0.18 + 0.5 * strength) continue;
          mark(front, i, when(u),
            0.25 + 0.75 * strength,
            strength > 0.55 && hash(c, r, 16) < 0.08 ? 1 : 0,
            0.5 + 0.9 * strength,
            0.04 + 0.12 * strength);
        }
      }
      if (r < rows) return false;
      front.t = clock - begun;
      launch(front);
      return true;
    };
    if (!build()) {
      jobs.push(build);
      wake();
    }

    // the traces flung out ahead of it, scattered over the whole field
    const list = [];
    // as many as the field's area calls for, whatever the size of its cells
    const sparks = Math.round((cols * cellW * rows * cellH) / 42000);
    for (let k = 0; k < sparks; k++) {
      const angle = Math.random() * Math.PI * 2;
      const u = Math.sqrt(Math.random());
      const d = inner + u * (far - inner);
      const c = Math.round((fx + Math.cos(angle) * d) / cellW);
      const r = Math.round((fy + Math.sin(angle) * d) / cellH);
      const dc = Math.round(Math.cos(angle));
      const dr = Math.round(Math.sin(angle));
      if (c < 0 || c >= cols || r < 0 || r >= rows || (!dc && !dr)) continue;
      list.push({ at: when(u), op: SPARK, c, r, dc, dr, strength: (1 - u) ** 1.2 });
    }

    // the words, born as the front passes, a moment behind it
    words.forEach((word) => {
      if (!unborn(word)) return;
      list.push({ at: when(out(Math.hypot(word.x - fx, word.y - fy))) + 0.06, op: BEAR, word, travel: word.x >= fx ? 1 : -1 });
    });
    schedule(list);
  }

  // A trace flung out ahead of the pulse: a few strokes straight on from
  // where it starts, the way the pulse is going, longer and firmer the
  // nearer the logo, red at the head where it is strongest.
  function spark({ c, r, dc, dr, strength }) {
    const route = [];
    for (let k = 3 + Math.round(5 * strength + Math.random() * 3); k > 0; k--, c += dc, r += dr) {
      if (c < 0 || c >= cols || r < 0 || r >= rows || taken[r * cols + c]) break;
      route.push(r * cols + c);
    }
    if (route.length < 2) return;
    run(route, {
      duration: route.length * between([0.028, 0.04]),
      ease: "power2.out",
      shade: (v) => [(0.3 + 0.6 * strength) * (1 - 0.5 * v), strength > 0.6 && v < 0.4 ? 1 - 0.5 * v : 0, (0.5 + 0.8 * strength) * (1 - 0.4 * v)],
      pick: 0.95,
    });
  }

  // A word born into the field: the strokes under it, and one either side,
  // flare and are cut away from the side the pulse came in by, and it
  // decodes in as a word answering a ping does, with the smaller burst.
  function bear(word, travel) {
    // a word under the clearing is born as the clearing closes instead
    if (!unborn(word) || holeWords.includes(word)) return;
    born.add(word.label);
    word.label.setAttribute("data-slash-born", "");
    const { c, n, r } = word;
    const span = n + 2;
    const list = [];
    for (let k = 0; k < span; k++) {
      const i = r * cols + c - 1 + (travel > 0 ? k : span - 1 - k);
      list.push({ at: k * 0.012, i, op: FLASH, ink: 0.9, flash: 1.3, turn: 0.08 });
      list.push({ at: k * 0.012 + 0.07, i, op: CARVE });
    }
    schedule(list);
    if (canDecode) arrive(word, travel, "minor", 0.08);
  }

  // The words brought into the field as the page comes in — the enter
  // animation in site.js, on every arrival but the homepage's first-load
  // intro, which brings them in with its pulse. While the page is still
  // covered they are taken out of the field at once, the strokes running on
  // under them and the words hidden (data-slash-entering), so the pattern is
  // whole rather than showing empty slots; then, after the given delay (s)
  // and over the given time, they are born back in from the foot of the band
  // up, as the wipe uncovers it, each with the flare, the carve and the short
  // decode a word born in the intro has. So the hero is put back together as
  // it arrives.
  function enter({ delay = 0, time = 0.5 } = {}) {
    if (!canDecode || reducedMotion.matches || opts.words === "unborn" || !words.length) return;
    entering = true;
    el.setAttribute("data-slash-entering", "");
    layout();
    const ys = words.map((word) => word.y);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const middle = ox + width / 2;
    let left = words.length;
    births = words.map(({ label, y }) => gsap.delayedCall(delay + (time * (bottom - y)) / (bottom - top || 1) + Math.random() * 0.08, () => {
      // the word as the field has it now, in case it has been laid out again
      const word = words.find((w) => w.label === label);
      if (word) bear(word, word.x >= middle ? 1 : -1);
      if (--left) return;
      entering = false;
      births = [];
      el.removeAttribute("data-slash-entering");
    }));
  }

  // Every word still out of the field, brought in at once: the intro's last
  // word, in case the pulse missed one.
  function bearAll() {
    words.forEach((word) => {
      if (!unborn(word)) return;
      born.add(word.label);
      word.label.setAttribute("data-slash-born", "");
      const { c, n, r } = word;
      for (let cc = c - 1; cc <= c + n; cc++) {
        glyph[r * cols + cc] = 0;
        taken[r * cols + cc] = 1;
      }
    });
    wake();
  }

  /* ---------- the sequence: a chain of words coming online ---------- */
  const running = () => canDecode && !reducedMotion.matches && onScreen && words.length > 0 && cols > 0 && rows > 0;
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
    // hold off while the page is still arriving or a page transition is
    // still running, and a moment after, and while a word is still coming
    // online, since that word carries the chain on itself
    if (document.documentElement.dataset.arrival || window.barba?.transitions?.isRunning) {
      held = true;
      plan(0.1);
      return;
    }
    if (held) {
      held = false;
      plan(SEQUENCE.settle);
      return;
    }
    if (majorLive()) {
      plan(0.2);
      return;
    }
    // The chain picks up again from the last word to come online, so it
    // never jumps; only with no word before it does it open, on a word near
    // the middle bursting at once, with no wave in to wait for.
    if (previous && send(previous, previous.ahead)) return;
    const word = choose(null);
    if (!word) {
      plan(0.2);
      return;
    }
    arrive(word, Math.random() < 0.5 ? 1 : -1, "major", 0);
  }

  // The next word: one of the few nearest the given one — the nearer, the
  // likelier, and onward the way the chain was going a little likelier
  // still — so the chain always moves to a neighbour but not always the same
  // one. Never one online or about to be, nor the last word or the few
  // before it, nor, for a ping, the word the chain is heading for. With no
  // word to go from, one of the few nearest the field's middle.
  function choose(from, ping = false) {
    // the last few to skip: three in a full field, fewer where there are only
    // a handful of words, so the chain still has a choice and never settles
    // into a loop
    const back = Math.max(0, Math.min(3, words.length - 4));
    const skip = back ? recent.slice(-back) : [];
    const open = (w) => w !== from && !live.has(w) && !pending.has(w) && !unborn(w) && !(ping && w === from?.ahead);
    let pool = words.filter((w) => open(w) && !skip.includes(w));
    if (!pool.length) pool = words.filter(open);
    if (!pool.length) return null;
    if (!from) {
      const middle = (w) => Math.hypot(w.x - (ox + width / 2), (w.y - (oy + height / 2)) * 1.4);
      pool = pool.sort((a, b) => middle(a) - middle(b)).slice(0, SEQUENCE.opener);
      return pool[Math.floor(Math.random() * pool.length)];
    }
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

  // The chain carried on from a word that has burst: its shockwave, run out
  // towards the next word — prefer, if it is still free, or another near it —
  // which comes online as the front reaches it, starting to decode a moment
  // before. Now and then a nearer word the wave passes over answers it too,
  // more briefly. Only the chain's latest word sets the next off: if the
  // chain has started over meanwhile, the wave just passes. False when there
  // is no word free to go to.
  function send(from, prefer = null) {
    const free = (w) => w && words.includes(w) && !live.has(w) && !pending.has(w) && !unborn(w);
    const to = free(prefer) ? prefer : choose(from);
    if (!to) return false;
    const way = gap(from, to);
    pending.add(to);
    from.went = to;
    const { wave: w, time, when, passes } = shock(from, way);
    w.calls.push({
      at: time - DECODE.major.hold,
      fn: () => (from === previous && running() ? arrive(to, to.x >= from.x ? 1 : -1, "major") : pending.delete(to)),
    });

    if (words.length > 2 && Math.random() < SEQUENCE.branch) {
      const passed = words.filter((w2) => w2 !== from && free(w2)).map((w2) => [w2, gap(from, w2)]).filter(([, g]) => passes(g));
      if (passed.length) {
        const [by, g] = passed[Math.floor(Math.random() * passed.length)];
        pending.add(by);
        w.calls.push({ at: Math.max(0, when(g.d) - DECODE.minor.hold), fn: () => arrive(by, by.x >= from.x ? 1 : -1, "minor") });
      }
    }
    return true;
  }

  // A word comes online: it starts to decode as the wave comes in, bursts as
  // it lands and resolves, and a beat after the burst its own shockwave sets
  // off for the next word, so the chain runs on from explosion to explosion.
  // The chain's opening word bursts at once (hold 0), with no wave in to
  // scramble ahead of.
  function arrive(word, travel, kind, hold = DECODE[kind].hold) {
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

    // The Osmo scramble: split into words, scramble each word to its own text,
    // revert the split once it has resolved. Every word scrambles at once,
    // and each resolves in its turn — its revealDelay runs to the moment the
    // front reaches it — so one front runs through the label at an even pace,
    // word after word, the way the wave goes. Not split into characters: the
    // scramble rewrites each word's insides on its first frame, so per-letter
    // nodes would only be made to be thrown away.
    const spec = DECODE[kind];
    const split = new SplitText(label, { type: "words", wordsClass: "word" });
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
        duration: hold + (before + length) * pace,
        ease: "none",
        scrambleText: {
          text: "{original}",
          chars: DECODE.chars,
          speed: DECODE.speed,
          revealDelay: hold + before * pace,
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
    timeline.to(scan.state, { p: 1, duration: decoded, ease: "none" }, hold);
    const resolved = hold + decoded;

    // the burst, as the wave lands and the word starts to resolve, and a beat
    // later the word's own shockwave, on to the next
    timeline.call(() => burst(word, kind), null, hold);
    if (major) timeline.call(() => handOn(word), null, hold + between(SEQUENCE.beat));
    timeline.call(() => (scans = scans.filter((s) => s !== scan)), null, resolved);
    timeline.call(() => label.removeAttribute("data-slash-active"), null, resolved + (major ? between(SEQUENCE.hold) : 0.35));
    wake();
  }

  // The chain runs on from a word to the one picked for it as it came online,
  // or another near it if that one has been taken, and with no word free
  // tries again a moment later. Only the chain's latest word hands on, so
  // there is only ever the one chain.
  function handOn(word) {
    if (!running() || word !== previous) return;
    if (send(word, word.ahead)) return;
    next?.kill();
    next = gsap.delayedCall(0.2, () => {
      next = null;
      handOn(word);
    });
  }

  // The traffic under it all: a packet setting off from one word towards one
  // of its neighbours with a blink of ink as it leaves, getting some of the
  // way and fading. Ink only, and never all the way, so it never reads as a
  // signal joining two words.
  function planTraffic(seconds) {
    traffic?.kill();
    traffic = running() ? gsap.delayedCall(seconds, sendTraffic) : null;
  }

  function sendTraffic() {
    traffic = null;
    if (!running()) return;
    const idle = words.filter((w) => !live.has(w) && !pending.has(w) && !unborn(w));
    if ((introLive || !document.documentElement.dataset.arrival) && idle.length > 1) {
      const from = idle[Math.floor(Math.random() * idle.length)];
      const away = (w) => Math.hypot(w.x - from.x, (w.y - from.y) * 1.4);
      const near = idle.filter((w) => w !== from).sort((a, b) => away(a) - away(b)).slice(0, SEQUENCE.near);
      const to = near[Math.floor(Math.random() * near.length)];
      const way = routeBetween(from, to);
      const length = way ? Math.min(way.route.length - 3, Math.max(5, Math.round(way.route.length * between(SEQUENCE.trafficReach)))) : 0;
      if (length >= 3) {
        const route = way.route.slice(0, length);
        run(route, {
          duration: clamp(route.length / between(SEQUENCE.trafficSpeed), 0.3, 2.2),
          ease: "sine.out",
          shade: (u) => [0.55 * (1 - 0.45 * u), 0, u < 0.12 ? 1 : 0.8 * (1 - u)],
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
    waves = [];
    jobs = [];
    cues = [];
    cueAt = 0;
  }

  /* ---------- the frame loop: runs only while something is lit ---------- */
  function frame(time, deltaTime) {
    const dt = Math.min(deltaTime / 1000, 0.1);
    clock += dt;

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
      if (stir[i]) {
        stir[i] = Math.max(0, stir[i] - dt);
        if (stir[i]) warm = true;
      }
    }

    if (cols && rows) {
      if (jobs.length && jobs[0]()) jobs.shift();
      advanceCues();
      advanceWaves(dt);
      advanceRuns(dt);
      advanceRipples(dt);
      advanceScans();
    }

    draw();

    if (!warm && !runs.length && !ripples.length && !scans.length && !cues.length && !waves.length && !jobs.length) sleep();
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

  // the sequence only runs while the field is on screen
  const resume = () => {
    if (!next) plan(previous ? 0.6 : SEQUENCE.first);
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
    // the words brought back in as the page comes in (site.js)
    enter,
    // the homepage's first-load intro (logo-morph-loader.js): the grid, to
    // set the name in; traffic while the page is still arriving; the
    // clearing, the pulse and the close; and the field cut back to the band
    // once it is over
    intro: {
      grid,
      live: () => (introLive = true),
      open,
      close,
      pulse,
      bearAll,
      carve,
      retire,
      crop,
    },
    destroy() {
      births.forEach((call) => call.kill());
      stopSequence();
      sleep();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener("change", onMotionChange);
      canvas.remove();
      delete el.slashField;
    },
  };
  el.slashField = instance;
  // the words' widths change once their face has loaded
  document.fonts?.ready.then(() => instance.refresh());
  return instance;
}
