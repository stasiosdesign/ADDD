/* The line grid's geometry (LineGrid.astro), shared with what sizes a box
   to it (the nav's Services cards, Nav.astro). Measured in small squares:
   cols × rows large squares of sub × sub small ones, and the grid running
   on past its outer large lines by bleed small squares each way. */
export interface LineGridShape {
  cols: number;
  rows: number;
  sub?: number;
  bleed?: number;
}

/** The drawing's width and height, in small squares. */
export const lineGridSize = ({ cols, rows, sub = 4, bleed = 1 }: LineGridShape) => ({
  width: cols * sub + 2 * bleed,
  height: rows * sub + 2 * bleed,
});

/** The drawing's height over its width: a box of this shape holds it whole. */
export const lineGridRatio = (shape: LineGridShape) => {
  const { width, height } = lineGridSize(shape);
  return height / width;
};
