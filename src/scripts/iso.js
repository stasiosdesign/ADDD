/* ============================================================
   Isometric drawing — the approach steps' schematics
   (src/components/ApproachStack.astro, src/scripts/approach-stack.js)
   ------------------------------------------------------------
   One projection for the page, which draws each schematic at rest,
   and for the script, which redraws the parts that move (the
   Prioritise blocks' heights), so the two always agree.

   x runs down to the right, y down to the left, z straight up, all
   in the SVG's own units: the standard 30° isometric.
   ============================================================ */
const COS = Math.cos(Math.PI / 6);

/** A projection with its origin (where x, y and z are 0) at (ox, oy) in the viewBox. */
export const projector = (ox, oy) => (x, y, z = 0) => [ox + (x - y) * COS, oy + (x + y) * 0.5 - z];

/** A path through projected points, closed unless told otherwise. */
export const path = (points, close = true) =>
  "M" + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + (close ? "Z" : "");

/** A horizontal rectangle, x0…x0+w by y0…y0+d, at height z. */
export const plane = (P, x0, y0, w, d, z = 0) =>
  path([P(x0, y0, z), P(x0 + w, y0, z), P(x0 + w, y0 + d, z), P(x0, y0 + d, z)]);

/** A box's floor lines: level lines across its two front sides every
    `step` up from its foot (none at its top), so it reads as a building's
    storeys rather than a block. */
export function floorLines(P, x0, y0, z0, w, d, h, step) {
  const x1 = x0 + w, y1 = y0 + d;
  let lines = "";
  for (let z = z0 + step; z < z0 + h - step / 3; z += step) {
    lines += path([P(x0, y1, z), P(x1, y1, z), P(x1, y0, z)], false);
  }
  return lines;
}

/** The three faces of a box seen from the front: its top and its two front sides. */
export function boxFaces(P, x0, y0, z0, w, d, h) {
  const x1 = x0 + w, y1 = y0 + d, z1 = z0 + h;
  return {
    top: path([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]),
    // the side facing down to the right (x = x1)
    right: path([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]),
    // the side facing down to the left (y = y1)
    left: path([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]),
  };
}
