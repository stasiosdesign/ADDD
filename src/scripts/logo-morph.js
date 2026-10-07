/* ============================================================
   The ADDD morph — the name and the logo as one shape
   ------------------------------------------------------------
   A D D D, set in the site's face, drawn into the four forms of the
   logo, and back: the A's flat apex pinches to a point and the notch
   between its legs fills down to the base; the D's stem becomes the
   triangle's upright, its bowl flattens into the two diagonals and its
   flat side pinches to the tip; both counters press shut as the ink
   goes solid. Each letter is pressed down onto its foot as it gives
   way, and released into its new shape.

   Shared by the first-load intro (logo-morph-loader.js) and the nav's
   logo (initNavLogo() in site.js), so the two are the same motion.

   The letters are the font's own outlines (Elza 500, the site's face
   at its heaviest served weight, from the Adobe Fonts kit) rather than
   live text, because an outline can be reshaped point by point where a
   glyph cannot; they draw exactly as the type does, and need no font
   to have loaded. Every point carries its target and its own window of
   the letter's morph, so the parts of a letter do not all move at
   once: the counters close first, the notch and the bowl follow, the
   apex and the tip pinch last. Played backwards, the same windows open
   the shape back out in reverse order.

   All of it in the logo's own 100-unit viewBox (assets/logo.svg). Pure
   data and arithmetic, so the layout can render the finished forms on
   the server (formPath) before any script has run.
   ============================================================ */

// Each letter: its foot (the press pivots on it) and its path, one command
// per row; every point is [glyph x, glyph y, form x, form y, window start,
// window end], the window as a share of the letter's own morph.
const LETTERS = [
  // A
  {
    pivot: [26.55, 58.7],
    cmds: [
      ["M", [34.738, 58.7, 34.7, 58.7, 0, 0.85]],
      ["L", [28.586, 42.7, 26.5, 42.7, 0.12, 0.94]],
      ["L", [25.724, 42.7, 26.5, 42.7, 0.12, 0.94]],
      ["L", [19.572, 58.7, 18.4, 58.7, 0, 0.85]],
      ["L", [22.231, 58.7, 21.258, 58.7, 0.03, 0.7]],
      ["L", [23.673, 54.801, 22.808, 58.7, 0, 0.66]],
      ["L", [30.546, 54.801, 30.195, 58.7, 0, 0.66]],
      ["L", [31.966, 58.7, 31.721, 58.7, 0.03, 0.7]],
      ["Z"],
      ["M", [27.121, 45.494, 27.114, 48.58, 0.02, 0.52]],
      ["L", [29.735, 52.615, 27.114, 51.073, 0.02, 0.52]],
      ["L", [24.485, 52.615, 27.114, 51.073, 0.02, 0.52]],
      ["Z"],
    ],
  },
  // D
  {
    pivot: [42.2, 58.7],
    cmds: [
      ["M", [41.949, 58.7, 40.91, 55.388, 0.1, 0.9]],
      ["C", [46.659, 58.7, 43.84, 53.825, 0.1, 0.9], [49.859, 55.928, 46.77, 52.263, 0.1, 0.88], [49.859, 50.97, 49.7, 50.7, 0.14, 0.92]],
      ["L", [49.859, 50.43, 49.7, 50.7, 0.14, 0.92]],
      ["C", [49.859, 45.427, 46.77, 49.137, 0.1, 0.88], [46.637, 42.7, 43.84, 47.575, 0.1, 0.9], [41.949, 42.7, 40.91, 46.012, 0.1, 0.9]],
      ["L", [36.361, 42.7, 34.7, 42.7, 0, 0.8]],
      ["L", [36.361, 58.7, 34.7, 58.7, 0, 0.8]],
      ["Z"],
      ["M", [38.975, 44.908, 40.642, 48.673, 0, 0.5]],
      ["L", [41.724, 44.908, 40.642, 48.673, 0, 0.5]],
      ["C", [45.082, 44.908, 40.642, 48.673, 0, 0.5], [47.155, 46.621, 40.642, 49.272, 0, 0.5], [47.155, 50.43, 40.642, 50.605, 0, 0.5]],
      ["L", [47.155, 50.97, 40.642, 50.795, 0, 0.5]],
      ["C", [47.155, 54.801, 40.642, 52.135, 0, 0.5], [45.059, 56.492, 40.642, 52.727, 0, 0.5], [41.769, 56.492, 40.642, 52.727, 0, 0.5]],
      ["L", [38.975, 56.492, 40.642, 52.727, 0, 0.5]],
      ["Z"],
    ],
  },
  // D
  {
    pivot: [58.55, 58.7],
    cmds: [
      ["M", [57.634, 58.7, 57.2, 55.388, 0.1, 0.9]],
      ["C", [62.344, 58.7, 60.267, 53.825, 0.1, 0.9], [65.544, 55.928, 63.333, 52.263, 0.1, 0.88], [65.544, 50.97, 66.4, 50.7, 0.14, 0.92]],
      ["L", [65.544, 50.43, 66.4, 50.7, 0.14, 0.92]],
      ["C", [65.544, 45.427, 63.333, 49.137, 0.1, 0.88], [62.321, 42.7, 60.267, 47.575, 0.1, 0.9], [57.634, 42.7, 57.2, 46.012, 0.1, 0.9]],
      ["L", [52.045, 42.7, 50.7, 42.7, 0, 0.8]],
      ["L", [52.045, 58.7, 50.7, 58.7, 0, 0.8]],
      ["Z"],
      ["M", [54.659, 44.908, 56.327, 48.673, 0, 0.5]],
      ["L", [57.408, 44.908, 56.327, 48.673, 0, 0.5]],
      ["C", [60.766, 44.908, 56.327, 48.673, 0, 0.5], [62.839, 46.621, 56.327, 49.272, 0, 0.5], [62.839, 50.43, 56.327, 50.605, 0, 0.5]],
      ["L", [62.839, 50.97, 56.327, 50.795, 0, 0.5]],
      ["C", [62.839, 54.801, 56.327, 52.135, 0, 0.5], [60.744, 56.492, 56.327, 52.727, 0, 0.5], [57.454, 56.492, 56.327, 52.727, 0, 0.5]],
      ["L", [54.659, 56.492, 56.327, 52.727, 0, 0.5]],
      ["Z"],
    ],
  },
  // D
  {
    pivot: [74.6, 58.7],
    cmds: [
      ["M", [73.318, 58.7, 73.259, 55.388, 0.1, 0.9]],
      ["C", [78.028, 58.7, 76.306, 53.825, 0.1, 0.9], [81.228, 55.928, 79.353, 52.263, 0.1, 0.88], [81.228, 50.97, 82.4, 50.7, 0.14, 0.92]],
      ["L", [81.228, 50.43, 82.4, 50.7, 0.14, 0.92]],
      ["C", [81.228, 45.427, 79.353, 49.137, 0.1, 0.88], [78.006, 42.7, 76.306, 47.575, 0.1, 0.9], [73.318, 42.7, 73.259, 46.012, 0.1, 0.9]],
      ["L", [67.73, 42.7, 66.8, 42.7, 0, 0.8]],
      ["L", [67.73, 58.7, 66.8, 58.7, 0, 0.8]],
      ["Z"],
      ["M", [70.344, 44.908, 72.011, 48.673, 0, 0.5]],
      ["L", [73.093, 44.908, 72.011, 48.673, 0, 0.5]],
      ["C", [76.451, 44.908, 72.011, 48.673, 0, 0.5], [78.524, 46.621, 72.011, 49.272, 0, 0.5], [78.524, 50.43, 72.011, 50.605, 0, 0.5]],
      ["L", [78.524, 50.97, 72.011, 50.795, 0, 0.5]],
      ["C", [78.524, 54.801, 72.011, 52.135, 0, 0.5], [76.428, 56.492, 72.011, 52.727, 0, 0.5], [73.138, 56.492, 72.011, 52.727, 0, 0.5]],
      ["L", [70.344, 56.492, 72.011, 52.727, 0, 0.5]],
      ["Z"],
    ],
  },
];

// How far a letter is pressed onto its foot at the height of its change; the
// press swells and releases over the first `end` of the letter's morph.
const PRESS = { squash: 0.075, spread: 0.035, end: 0.74 };

// Slow to start, decisive through the middle, a long settle: the way a
// material gives, then takes its new shape.
export const MORPH_EASE = "0.6, 0, 0.18, 1";

export const LETTER_COUNT = LETTERS.length;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const linear = (u) => u;

// The path data of letter i at morph progress t: 0 the glyph, 1 the form.
// ease shapes each point's travel through its own window.
export function morphPath(i, t, ease = linear) {
  const { pivot: [px, py], cmds } = LETTERS[i];
  // the press: a smooth swell and release, done before the letter settles
  const p = Math.sin(Math.PI * clamp01(t / PRESS.end)) ** 2;
  const sx = 1 + PRESS.spread * p;
  const sy = 1 - PRESS.squash * p;
  let d = "";
  for (const [cmd, ...points] of cmds) {
    d += cmd;
    for (const [fx, fy, tx, ty, a, b] of points) {
      const u = ease(clamp01((t - a) / (b - a)));
      const x = fx + (tx - fx) * u;
      const y = fy + (ty - fy) * u;
      d += `${(px + (x - px) * sx).toFixed(3)} ${(py + (y - py) * sy).toFixed(3)} `;
    }
  }
  return d.trim();
}

// The finished forms, as the logo draws them at rest.
export const formPath = (i) => morphPath(i, 1);

// The outer edge of letter i at morph progress t — 0 the glyph, 1 the form —
// as a polygon in the viewBox, its curves flattened, without the press: the
// shape something set round the letter has to keep clear of. (Its counter,
// the second contour, is left out: nothing fits in one.)
export function outline(i, t) {
  const at = ([fx, fy, tx, ty]) => [fx + (tx - fx) * t, fy + (ty - fy) * t];
  const points = [];
  for (const [cmd, ...pts] of LETTERS[i].cmds) {
    if (cmd === "Z") break;
    if (cmd !== "C") {
      points.push(at(pts[0]));
      continue;
    }
    const [x0, y0] = points[points.length - 1];
    const [[x1, y1], [x2, y2], [x3, y3]] = pts.map(at);
    for (let k = 1; k <= 8; k++) {
      const u = k / 8;
      const v = 1 - u;
      points.push([
        v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
        v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3,
      ]);
    }
  }
  return points;
}

// The name as set — the glyphs' outlines, before any morph — in the viewBox:
// its left and right ends, its cap line and its baseline.
export const NAME_BOUNDS = (() => {
  const points = LETTERS.flatMap(({ cmds }) => cmds.flatMap(([, ...pts]) => pts));
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
})();

// The morph's ease, as a function GSAP has parsed. Created on first use, by
// which time the page's GSAP and CustomEase have loaded.
let morphEase = null;
export function getMorphEase() {
  if (!morphEase) morphEase = gsap.parseEase(CustomEase.create("addd-morph", MORPH_EASE));
  return morphEase;
}
