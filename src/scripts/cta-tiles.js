/* ============================================================
   The closing call's grid and tiles (ClosingCta.astro)
   ------------------------------------------------------------
   (2026-11-16, at the user's word: the homepage statement's squares and
   dotted lines, exactly, on the call's white.) The same rules as the
   statement's grid (cell-grid.js), laid out here for the call alone:

     - the grid: the section's dots drawn as a grid of cells (the field's
       zone, dot-field.js): every n-th column and row of dots kept and a
       little brighter (BOOST, crossings CROSS), the dots between them gone;
       the dots and the cell the statement's own size (its pitch,
       styles.css; its cell, cellPitches), across the width between the
       dots at the grid's margins; framed by plain dots, the
       same margin over and under it as at its sides, as many whole cells
       down as fill what that leaves, centred, on a row of dots;
     - the tiles: each one cell, its box over the cell's lines, its mark in
       the middle of the cell less a pitch (styles.css, "CTA"); placed by
       its shares among the inner cells (never the outer ring), moved
       outward off the words and never touching another tile, even at a
       corner, as the statement's marks are;
     - now and then (EVERY, give or take JITTER), while the section is on
       the screen and the tab in front, one tile (never the one before)
       has a fine red line round its cell and its mark fades into one not
       standing in a tile just then, and the line fades. Nothing moves with
       reduced motion; the grid and tiles are laid out all the same.

   Laid out again whenever the field is set out (dotgrid:set: its pitch,
   on every ScrollTrigger refresh) or the section changes size.
   ============================================================ */
import { latticeOf } from "./dot-field.js";
import { motion, registerPageCleanup } from "./page.js";

// the grid's lines and crossings, as the statement's (cell-grid.js)
const BOOST = 0.3;
const CROSS = 0.6;
// the cell, in pitches: the statement's own, as measured on it (73px of
// 14.6 at 1920, 111 of 13.9 at 834, 71 of 14.25 at 390): 5 from 992px, 8
// on a tablet, 5 on a phone
const cellPitches = () => (matchMedia("(max-width: 767px)").matches ? 5 : matchMedia("(max-width: 991px)").matches ? 8 : 5);
// the change: how often (ms), give or take, and the line's time in and held
const EVERY = 2600;
const JITTER = 1200;
const LINE_IN = 380;
const LINE_HOLD = 1100;

const px = (v) => `${+v.toFixed(3)}px`;

export function initCtaTiles(container) {
  container.querySelectorAll("[data-cta-tiles]").forEach((section) => {
    if (section.ctaTiles) return;
    section.ctaTiles = true;
    const field = section.querySelector(":scope > .cta__dots");
    const tiles = [...section.querySelectorAll("[data-cta-tile]")];
    const inked = [...section.querySelectorAll(".cta__heading, .cta__lede, .cta .actions")];
    let pool = [];
    try {
      pool = JSON.parse(section.dataset.ctaTiles);
    } catch {
      /* the tiles keep their marks */
    }
    let given = "";

    // ---- the grid and the tiles in it ----------------------------------
    function layout() {
      const lattice = latticeOf(field);
      if (!lattice || !field.dotGrid) return;
      const p = lattice.pitch;
      const box = section.getBoundingClientRect();
      const fieldBox = field.getBoundingClientRect();
      // a dot, in the section's box
      const fx = fieldBox.left - box.left + lattice.x;
      const fy = fieldBox.top - box.top + lattice.y;
      // across: the dots at the grid's margins (at them, or the first
      // outside), the width widened a pitch at a time, a side at a time,
      // until it is whole cells, as the statement's is
      const marginBox = section.querySelector(".cta__grid")?.getBoundingClientRect();
      const left = marginBox ? marginBox.left - box.left : 0;
      const right = marginBox ? marginBox.right - box.left : box.width;
      const n = cellPitches();
      let kL = Math.floor((left - fx) / p + 0.02);
      let kR = Math.ceil((right - fx) / p - 0.02);
      for (let grow = 0; (kR - kL) % n !== 0 && grow < 2 * n; grow++) grow % 2 ? kL-- : kR++;
      const size = n * p;
      const x0 = fx + kL * p;
      const x1 = fx + kR * p;
      const across = Math.round((x1 - x0) / size);
      // down: the side margin over and under it, whole cells, centred, on
      // a row of dots
      const margin = (x0 + box.width - x1) / 2;
      const down = Math.max(3, Math.floor((box.height - 2 * margin) / size));
      const y0 = fy + Math.round(((box.height - down * size) / 2 - fy) / p) * p;
      const y1 = y0 + down * size;

      // the field's zone, in its own box
      const ox = box.left - fieldBox.left;
      const oy = box.top - fieldBox.top;
      const spec = {
        x0: x0 + ox, y0: y0 + oy, n,
        left: x0 + ox - p / 2, right: x1 + ox + p / 2,
        top: y0 + oy - p / 2, bottom: y1 + oy + p / 2,
        boost: BOOST, cross: CROSS, still: true,
      };
      const key = JSON.stringify(spec);
      if (key !== given) {
        given = key;
        field.dotGrid.zone(spec);
        field.dotGrid.zoneAmount(1);
      }

      // the words (each as set, not its block) and the button, half a
      // pitch round, in the section's box
      const words = inked.map((el) => {
        if (el.matches(".actions")) return el.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      }).filter((b) => b.width);
      const clear = {
        x0: Math.min(...words.map((b) => b.left)) - box.left - p / 2,
        x1: Math.max(...words.map((b) => b.right)) - box.left + p / 2,
        y0: Math.min(...words.map((b) => b.top)) - box.top - p / 2,
        y1: Math.max(...words.map((b) => b.bottom)) - box.top + p / 2,
      };

      // the tiles: in the inner cells by their shares, moved outward off the
      // words, never touching another, even at a corner
      const narrow = matchMedia("(max-width: 991px)").matches;
      const phone = matchMedia("(max-width: 767px)").matches;
      const colLo = 1, colHi = Math.max(colLo, across - 2);
      const rowLo = 1, rowHi = Math.max(rowLo, down - 2);
      const taken = new Set();
      const middleX = (x0 + x1) / 2;
      const middleY = (clear.y0 + clear.y1) / 2;
      const clash = (c, r) => {
        const l = x0 + c * size, t = y0 + r * size;
        const onWords = l < clear.x1 && l + size > clear.x0 && t < clear.y1 && t + size > clear.y0;
        return onWords || [-1, 0, 1].some((dc) => [-1, 0, 1].some((dr) => taken.has(`${c + dc},${r + dr}`)));
      };
      tiles.forEach((tile) => {
        tile.classList.remove("is--placed", "is--crowded");
        if (getComputedStyle(tile).display === "none") return;
        const at = (narrow ? (phone && tile.dataset.atPhone) || tile.dataset.atNarrow : tile.dataset.at).split(/\s+/).map(Number);
        let col = Math.round(colLo + at[0] * (colHi - colLo));
        let row = Math.round(rowLo + at[1] * (rowHi - rowLo));
        const out = x0 + (col + 0.5) * size < middleX ? -1 : 1;
        let c = col;
        while (clash(c, row) && c + out >= colLo && c + out <= colHi) c += out;
        if (!clash(c, row)) col = c;
        else {
          const away = y0 + (row + 0.5) * size < middleY ? -1 : 1;
          const tries = [away, -away].flatMap((dir) => Array.from({ length: rowHi - rowLo + 1 }, (_, i) => row + dir * (i + 1)));
          const free = tries.find((r) => r >= rowLo && r <= rowHi && !clash(col, r));
          if (free === undefined) {
            tile.classList.add("is--crowded");
            return;
          }
          row = free;
        }
        taken.add(`${col},${row}`);
        tile.style.setProperty("--cell-x", px(x0 + col * size));
        tile.style.setProperty("--cell-y", px(y0 + row * size));
        tile.style.setProperty("--cell-size", px(size));
        tile.style.setProperty("--cell-inset", px(p / 2));
        tile.classList.add("is--placed");
      });
    }

    let pending = 0;
    const relayout = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(layout);
    };
    field?.addEventListener("dotgrid:set", relayout);
    const resized = new ResizeObserver(relayout);
    resized.observe(section);
    relayout();

    // ---- now and then, a change ----------------------------------------
    let last = null;
    let timer = 0;
    let onScreen = false;
    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const front = (tile) => tile.querySelector(tile.classList.contains("is--b") ? ".is--b" : ".is--a");
    const back = (tile) => tile.querySelector(tile.classList.contains("is--b") ? ".is--a" : ".is--b");
    function turn() {
      const shown = tiles.filter((t) => t.classList.contains("is--placed"));
      if (shown.length < 2) return;
      const choices = shown.filter((t) => t !== last);
      const tile = choices[Math.floor(Math.random() * choices.length)];
      last = tile;
      const showing = new Set(shown.map((t) => front(t).getAttribute("src")));
      const fresh = pool.filter((src) => !showing.has(src));
      if (!fresh.length) return;
      const next = fresh[Math.floor(Math.random() * fresh.length)];
      tile.classList.add("is--turning");
      later(() => {
        back(tile).setAttribute("src", next);
        tile.classList.toggle("is--b");
      }, LINE_IN);
      later(() => tile.classList.remove("is--turning"), LINE_IN + LINE_HOLD);
    }
    const schedule = () => {
      clearTimeout(timer);
      if (motion.reduced || !onScreen || document.hidden) return;
      timer = setTimeout(() => {
        turn();
        schedule();
      }, EVERY + Math.random() * JITTER);
    };
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      schedule();
    });
    seen.observe(section);
    document.addEventListener("visibilitychange", schedule);

    registerPageCleanup(() => {
      cancelAnimationFrame(pending);
      field?.removeEventListener("dotgrid:set", relayout);
      resized.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      clearTimeout(timer);
      timers.forEach(clearTimeout);
      timers.clear();
      section.ctaTiles = false;
    });
  });
}
