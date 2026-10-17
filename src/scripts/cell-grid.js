/* ============================================================
   Cell grid — the homepage statement's ground drawn as a grid of
   cells, and its photographs lit in them
   ------------------------------------------------------------
   The ink band's dots (the site's .dot-grid fields: the logos' and
   statement's, the approach's) run on one lattice from the band's top
   edge to its foot. Behind the approach statement, across the logo
   wall's width, they are drawn as a grid instead: dotted lines every
   few dots across and down, the dots between them gone, a little
   brighter on the lines (dot-field.js, zone). Outside the wall's width,
   and above and below the grid, the dots stay as they are.

   The grid is set out from the wall over it, so the two read as one
   drawing: its outer lines are the columns of dots at the wall's outer
   edges (from 992px, the columns that run down the gaps between its
   cards, a card's width a whole number of pitches: styles.css, "Logo
   wall"), and over and under it, on the screen as the statement is
   held, it leaves the same margin of plain dots as at its sides, so the
   held screen is a grid framed evenly all round (its top well under the
   wall's foot, its foot over the first card after the statement:
   StickyTitle's cells, a selector). The cell is the whole number of
   pitches that divides the grid's width (from 992px a card's width, so
   every gap between the wall's cards runs on down as a line of the
   grid) nearest four-fifths of the 12-Column Grid's step (a Grid Column
   and a gutter). The grid is always there, drawn into the dots
   themselves: nothing fades it in.

   The software marks ([data-cell-photo]: index.astro's PHOTOS) each take
   a cell of the grid where their data-cell-at (from 992px) or
   data-cell-at-narrow puts them among its inner cells (never its outer
   ring), or else the one nearest where the stylesheet sets them
   (sticky-title.css, "around"), the card inside it half a pitch in from
   its lines (so every edge runs midway between two lines of dots),
   moved outward (or, where the words take the width, up or down) when
   it would touch the words or another mark. While the dots are held
   (sticky-title.js, dotsHeldFrom) they light up one after another, in
   reading order: a red hairline drawn from the square's top left corner
   clockwise all the way round, unhurried, easing in and out as one
   stroke, the picture wiped in from the
   top inside it as the outline closes, and the red going out once the
   picture is there, leaving it in its square. Scrubbed from the scroll,
   eased after it, transforms and opacity alone.

   Measured on every ScrollTrigger refresh (after the statement's hold
   and the band's pitch are set), never on scroll. With reduced motion
   the grid is drawn as ever and the photographs stay as the stylesheet
   sets them.
   ============================================================ */
import { latticeOf } from "./dot-field.js";

// the lines' dots brighter by this share of their own, and the
// crossings by this
const BOOST = 0.3;
const CROSS = 0.6;
// the cell: about this share of the 12-Column Grid's step, and between
// these many pitches
const CELL = 0.8;
const CELL_MIN = 4;
const CELL_MAX = 10;
// the photographs' turns through the hold: the first starting this far
// in, the last this far, each taking this much of it (shares of the
// hold); within a turn, the outline's stroke, the box's charcoal coming
// up as it closes, the mark's wipe and the red going out (shares of the
// turn)
const FIRST = 0.03;
const LAST = 0.66;
const TURN = 0.3;
const TRACE = 0.62;
const FILL_AT = 0.5;
const FILL = 0.2;
const WIPE_AT = 0.62;
const WIPE = 0.3;
const OUT_AT = 0.84;
// the scrub's ease after the scroll (s)
const SMOOTH = 0.8;
// the red outline's width (px; sticky-title.css, --cell-line, the same)
const OUTLINE = 1;

const px = (v) => `${+v.toFixed(3)}px`;

export function mountCellGrid(wrap) {
  const field = wrap.querySelector(".sticky-title__dots");
  if (!field) return { destroy() {} };
  const band = wrap.closest(".ink-band") || wrap.parentElement;
  const scope = wrap.closest("[data-barba='container']") || document;
  const above = wrap.querySelector("[data-statement-above]");
  const frame = wrap.querySelector(".sticky-title__container");
  const stage = wrap.querySelector(".sticky-title__stage");
  const around = wrap.querySelector('[data-sticky-title="around"]');
  const cells = [...wrap.querySelectorAll("[data-cell-photo]")];
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const fields = () => [...band.querySelectorAll(".dot-grid.band-field:not(.band-steps__dots)")].filter((el) => el.dotGrid);
  const parts = (cell) => ({
    lines: cell.querySelector(".sticky-title__cell-lines"),
    fill: cell.querySelector(".sticky-title__cell-fill"),
    top: cell.querySelector(".sticky-title__cell-line.is--top"),
    right: cell.querySelector(".sticky-title__cell-line.is--right"),
    bottom: cell.querySelector(".sticky-title__cell-line.is--bottom"),
    left: cell.querySelector(".sticky-title__cell-line.is--left"),
    win: cell.querySelector(".sticky-title__cell-win"),
    photo: cell.querySelector(".sticky-title__photo"),
    img: cell.querySelector("img"),
  });

  // the zone as last given to each field, so a refresh that changes
  // nothing draws nothing
  const given = new WeakMap();
  // the timeline (in px of scroll from `from`), and the tween easing it
  // after the scroll
  let tl = null;
  let from = 0;
  let follow = null;

  function unplace() {
    cells.forEach((cell) => {
      cell.classList.remove("is--placed");
      ["--cell-x", "--cell-y", "--cell-size", "--cell-inset"].forEach((p) => cell.style.removeProperty(p));
      const el = parts(cell);
      gsap.set([el.lines, el.fill, el.top, el.right, el.bottom, el.left, el.win, el.photo, el.img].filter(Boolean), { clearProps: "all" });
    });
  }

  function measure() {
    const lattice = latticeOf(field);
    if (!lattice) return;
    const p = lattice.pitch;
    const sy = window.scrollY;
    const vh = window.innerHeight;
    const fieldBox = field.getBoundingClientRect();
    const fieldTop = fieldBox.top + sy;
    const fx = fieldBox.left + lattice.x;
    const fy = fieldTop + lattice.y;

    // Held: the statement's dots held still while it is (sticky-title.js),
    // and the cards after it come up the page by the hold's length later
    // than the dots do (D). Else (reduced motion), as laid out.
    const heldFrom = wrap.dotsHeldFrom;
    const heldTo = wrap.dotsHeldTo;
    const held = motion.matches && Number.isFinite(heldFrom) && heldTo > heldFrom && getComputedStyle(frame).position === "sticky";
    const D = held ? heldTo - heldFrom : 0;

    // Across: the columns of dots at the wall's outer edges (at them, or
    // the first outside), as many pitches apart as the grid is wide
    const wallBox = above ? above.getBoundingClientRect() : fieldBox;
    let kL = Math.floor((wallBox.left - fx) / p + 0.02);
    let kR = Math.ceil((wallBox.right - fx) / p - 0.02);
    // the cell: of the counts between CELL_MIN and CELL_MAX that divide the
    // width, the nearest CELL of the 12-Column Grid's step; where none
    // does, the grid widened a pitch at a time, a side at a time, until
    // one does
    const columns = stage ? getComputedStyle(stage) : null;
    const step = columns ? parseFloat(columns.gridTemplateColumns) + (parseFloat(columns.columnGap) || 0) : 8 * p;
    const ideal = (CELL * step) / p;
    let n = 0;
    for (let grow = 0; !n && grow < 2 * CELL_MAX; grow++) {
      if (grow) grow % 2 ? kL-- : kR++;
      const width = kR - kL;
      for (let c = CELL_MIN; c <= CELL_MAX; c++) {
        if (width % c === 0 && (!n || Math.abs(c - ideal) < Math.abs(n - ideal))) n = c;
      }
    }
    if (!n) return;
    const size = n * p;
    const x0 = fx + kL * p;
    const x1 = fx + kR * p;
    const across = (x1 - x0) / size;

    // Down, in page px as the dots are drawn (before any hold): framed by
    // the plain dots as it is across. The margin the grid leaves at either
    // side of the screen, it leaves over and under it too, on the screen
    // as the statement is held (a line at page y stands at y - heldFrom):
    // as many whole cells as come nearest to filling what that leaves,
    // centred in it, on a row of dots, so the grid's top is well under the
    // wall's foot and its last line over the first card after the
    // statement (StickyTitle's cells: a selector), a pitch clear of it at
    // least. Not held, the same margin under the wall's foot.
    const bandBox = band.getBoundingClientRect();
    const margin = (x0 - bandBox.left + bandBox.right - x1) / 2;
    const wallFoot = above ? wallBox.bottom + sy : fieldTop;
    const until = wrap.dataset.cellGrid ? scope.querySelector(wrap.dataset.cellGrid) : null;
    const stop = until ? until.getBoundingClientRect().top + sy - D - p : fieldTop + fieldBox.height;
    const onRow = (y) => fy + Math.round((y - fy) / p) * p;
    let down = Math.max(1, Math.round((vh - 2 * margin) / size));
    let y0 = held ? onRow(heldFrom + (vh - down * size) / 2) : onRow(wallFoot + margin);
    y0 = Math.max(y0, fy + Math.ceil((wallFoot - fy) / p) * p);
    if (!held) down = Math.max(1, Math.floor((stop - margin - y0) / size));
    while (down > 1 && y0 + down * size > stop) down--;
    const y1 = y0 + down * size;

    // each field its part of the zone, in its own box: the grid's lines
    // and the dots between them gone, half a pitch round its outer lines
    fields().forEach((el) => {
      const box = el.getBoundingClientRect();
      const t = box.top + sy;
      const spec = {
        x0: x0 - box.left, y0: y0 - t, n,
        left: x0 - box.left - p / 2, right: x1 - box.left + p / 2,
        top: y0 - t - p / 2, bottom: y1 - t + p / 2,
        boost: BOOST, cross: CROSS, still: true,
      };
      const key = JSON.stringify(spec);
      if (given.get(el) !== key) {
        given.set(el, key);
        el.dotGrid.zone(spec);
        el.dotGrid.zoneAmount(1);
      }
    });

    tl?.kill();
    tl = null;
    unplace();
    if (!held) return;

    // The photographs in squares of the grid, set out as they stand while
    // held: the frame at its sticky top on the screen, the dots with it,
    // so a line at page y stands at y - heldFrom on the screen.
    const frameTop = parseFloat(getComputedStyle(frame).top) || 0;
    const frameBox = frame.getBoundingClientRect();
    const aroundBox = around.getBoundingClientRect();
    // the around layer's top on the screen while held
    const aroundTop = frameTop + (aroundBox.top - frameBox.top);
    const lineY = y0 - heldFrom;
    // the cells wholly on the screen while held
    const rowMin = Math.max(0, Math.ceil(-lineY / size));
    const rowMax = Math.min(down, Math.floor((vh - lineY) / size)) - 1;
    // the words and the button under them, as set (each statement's text,
    // not the wide block it is centred in), half a pitch round, on the
    // screen while held
    const inked = [...wrap.querySelectorAll('[data-sticky-title="heading"]')].map((h) => {
      const range = document.createRange();
      range.selectNodeContents(h);
      return range.getBoundingClientRect();
    });
    const after = wrap.querySelector('[data-sticky-title="after"]');
    if (after) inked.push(after.getBoundingClientRect());
    const words = {
      x0: Math.min(...inked.map((b) => b.left)) - p / 2,
      x1: Math.max(...inked.map((b) => b.right)) + p / 2,
      y0: frameTop + Math.min(...inked.map((b) => b.top)) - frameBox.top - p / 2,
      y1: frameTop + Math.max(...inked.map((b) => b.bottom)) - frameBox.top + p / 2,
    };
    // The card: one cell, half a pitch in from its lines.
    const span = 1;
    const inset = 0.5;
    const block = span * size;

    // a line's middle (on the screen) moved so the line, OUTLINE wide,
    // covers whole device pixels
    const dpr = window.devicePixelRatio || 1;
    const crisp = (v) => Math.round((v - OUTLINE / 2) * dpr) / dpr + OUTLINE / 2;
    // The cells a mark may take: the grid's inner cells, never its outer
    // ring (and only those wholly on the screen while held).
    const colLo = 1;
    const colHi = Math.max(colLo, across - 2);
    const rowLo = Math.max(1, rowMin);
    const rowHi = Math.max(rowLo, Math.min(down - 2, rowMax));
    const narrow = window.matchMedia("(max-width: 991px)").matches;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const taken = new Set();
    const placed = [];
    const cx = x0 + (x1 - x0) / 2;
    const wordsMiddle = (words.y0 + words.y1) / 2;
    cells.forEach((cell) => {
      const own = getComputedStyle(cell);
      if (own.display === "none") return;
      // its cell: where `at` puts it among the inner cells (shares across
      // and down them), or else the one nearest its own place as the
      // stylesheet sets it (on the screen while held)
      const at = (narrow ? (phone && cell.dataset.cellAtPhone) || cell.dataset.cellAtNarrow : cell.dataset.cellAt)?.split(/\s+/).map(Number);
      let col;
      let row;
      if (at?.length === 2 && at.every(Number.isFinite)) {
        col = colLo + Math.round(at[0] * (colHi - colLo));
        row = rowLo + Math.round(at[1] * (rowHi - rowLo));
      } else {
        col = Math.round((aroundBox.left + parseFloat(own.left) - x0) / size);
        row = Math.round((aroundTop + parseFloat(own.top) - lineY) / size);
      }
      col = gsap.utils.clamp(colLo, colHi, col);
      row = gsap.utils.clamp(rowLo, rowHi, row);
      // kept clear of the words and of the other marks: moved outward,
      // away from the page's middle, and where the words take the width
      // (a phone), up or down, away from their middle, inside the inner
      // cells all the while
      // (and never touching another mark, not even at a corner)
      const clash = (c, r) => {
        const l = x0 + c * size;
        const t = lineY + r * size;
        const onWords = l < words.x1 && l + block > words.x0 && t < words.y1 && t + block > words.y0;
        return onWords || [-1, 0, 1].some((dc) => [-1, 0, 1].some((dr) => taken.has(`${c + dc},${r + dr}`)));
      };
      const out = x0 + (col + 0.5) * size < cx ? -1 : 1;
      let c = col;
      while (clash(c, row) && c + out >= colLo && c + out <= colHi) c += out;
      if (!clash(c, row)) col = c;
      else {
        const away = lineY + (row + 0.5) * size < wordsMiddle ? -1 : 1;
        const tries = [away, -away].flatMap((dir) => Array.from({ length: rowHi - rowLo + 1 }, (_, i) => row + dir * (i + 1)));
        row = tries.find((r) => r >= rowLo && r <= rowHi && !clash(col, r)) ?? row;
      }
      taken.add(`${col},${row}`);
      // its lines on the screen's pixels, so the outline is one crisp
      // device pixel wide rather than two half-lit ones
      const l = crisp(x0 + col * size);
      const t = crisp(lineY + row * size);
      cell.style.setProperty("--cell-x", px(l - aroundBox.left));
      cell.style.setProperty("--cell-y", px(t - aroundTop));
      cell.style.setProperty("--cell-size", px(crisp(x0 + col * size + block) - l));
      cell.style.setProperty("--cell-inset", px(inset * p));
      cell.classList.add("is--placed");
      placed.push({ cell, col, row });
    });

    // The timeline, in px of scroll from the hold: each photograph's turn
    // through it.
    from = heldFrom;
    const hold = heldTo - heldFrom;
    tl = gsap.timeline({ paused: true });
    placed
      .sort((a, b) => a.row - b.row || a.col - b.col)
      .forEach(({ cell }, i, all) => {
        const el = parts(cell);
        const turn = TURN * hold;
        const at = hold * (FIRST + (all.length > 1 ? (i * (LAST - FIRST)) / (all.length - 1) : 0));
        const t = (share) => at + share * turn;
        const d = (share) => share * turn;
        // the outline: brought up softly, then drawn as one line from the
        // top left corner clockwise all the way round, as a snake would
        // go (along the top, down the right side, back along the foot and
        // up the left side to where it began; each bar grows from the
        // corner the line reaches it at: sticky-title.css), easing in and
        // out over the whole of it, so it never jerks at a corner, and
        // out once the picture is in
        const stroke = { v: 0 };
        const sides = [["top", "X"], ["right", "Y"], ["bottom", "X"], ["left", "Y"]];
        const draw = () => sides.forEach(([side, axis], i) => {
          el[side].style.transform = `scale${axis}(${gsap.utils.clamp(0, 1, stroke.v * 4 - i)})`;
        });
        tl.fromTo(el.lines, { opacity: 0 }, { opacity: 1, duration: d(0.08), ease: "none" }, t(0));
        tl.fromTo(stroke, { v: 0 }, { v: 1, duration: d(TRACE), ease: "sine.inOut", onUpdate: draw }, t(0));
        tl.to(el.lines, { opacity: 0, duration: d(1 - OUT_AT), ease: "sine.inOut" }, t(OUT_AT));
        // the box: its charcoal faded up as the outline closes, and kept
        if (el.fill) tl.fromTo(el.fill, { opacity: 0 }, { opacity: 1, duration: d(FILL), ease: "sine.inOut" }, t(FILL_AT));
        // the picture: wiped in from the top inside the square (a window
        // brought down over it, the picture held still in it), settling
        // from a touch larger; the window starts a hair clear of the
        // picture, so no edge of its frame shows before its turn
        tl.fromTo(el.win, { yPercent: -102 }, { yPercent: 0, duration: d(WIPE), ease: "power2.inOut" }, t(WIPE_AT));
        tl.fromTo(el.photo, { yPercent: 102 }, { yPercent: 0, duration: d(WIPE), ease: "power2.inOut" }, t(WIPE_AT));
        if (el.img) tl.fromTo(el.img, { scale: 1.15 }, { scale: 1, duration: d(0.6), ease: "power2.out" }, t(WIPE_AT));
      });
    // rendered through once while the page is still covered, so no tween
    // first reads its start values mid-scroll (as sticky-title.js does)
    tl.progress(1).progress(0);
    seek(sy, true);
  }

  // the timeline at a scroll position, eased after it, or at once
  function seek(scroll, now) {
    if (!tl) return;
    const time = gsap.utils.clamp(0, tl.duration(), scroll - from);
    if (now) {
      follow?.kill();
      tl.time(time);
      return;
    }
    follow = gsap.to(tl, { time, duration: SMOOTH, ease: "power3.out", overwrite: true });
  }

  const along = ScrollTrigger.create({
    trigger: wrap,
    start: "top bottom",
    end: () => `bottom+=${window.innerHeight} top`,
    onUpdate: (self) => seek(self.scroll()),
  });
  measure();
  ScrollTrigger.addEventListener("refresh", measure);

  return {
    destroy() {
      ScrollTrigger.removeEventListener("refresh", measure);
      along.kill();
      follow?.kill();
      tl?.kill();
      fields().forEach((el) => el.dotGrid.zone(null));
      unplace();
    },
  };
}
