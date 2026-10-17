/* ============================================================
   Dot fit — a button or a tile sized and set on a field's dots
   ------------------------------------------------------------
   data-dot-fit="<the field's .dot-grid selector>" on an action
   button: its height becomes the whole number of the dots' pitch
   nearest its own (at least two), so its arrow block is a square of
   whole pitches too; its label block widens until the whole button is
   a whole number of pitches, the count whose parity leaves it nearest
   where it stands (a centred button stays centred, as the lattice is
   symmetrical about the page); and it moves, less than half a pitch,
   so every edge runs midway between two lines of dots, as the cards'
   edges do on the band (grid-authoritative: the dots are fitted to
   the grid, and the button to the dots).

   In a held frame whose dots are held still with it (sticky-title.js,
   data-sticky-title-still), the button is set against the dots as
   they stand while it is held: as at the release, where the frame's
   foot meets its track's and the dots have moved down a whole number
   of pitches. Elsewhere, against the field as laid out.

   On anything else — a square tile (the statement's software) — the
   same in two dimensions: its side becomes the whole number of pitches
   nearest its own (--dot-fit-size, which its stylesheet sizes it by),
   and it moves so every edge runs midway between two lines of dots.
   With data-dot-fit-frame (the statement's captioned photographs), a
   rectangle instead: its width, then its height at that width, each
   the whole number of pitches nearest its own (--dot-fit-w and
   --dot-fit-h, which its stylesheet sizes it by), then the same move.

   A button's sizes are --action-button-height and --dot-fit-body (and
   --dot-fit-trim, which keeps its room in the layout its own), the move
   --dot-fit-x and --dot-fit-y, a translate (action-button.css), so
   the layout round it never changes. Measured on mount and on every
   ScrollTrigger refresh (the field's pitch is set then), never on
   scroll.
   ============================================================ */
import { latticeOf } from "./dot-field.js";

// the nearest offset to 0 that is congruent to v modulo p
const near = (v, p) => v - Math.round(v / p) * p;

// An element's top in a field's box as it stands on the field's dots:
// in a held frame whose dots are held with it, at the release (the
// frame's foot on the track's), where the dots moved down stand on the
// page's own rows again; else as laid out. box is the element's own
// rect, if the caller has it. Shared with the dot lift (dot-lift.js).
export function heldTopInField(el, field, box = el.getBoundingClientRect()) {
  const wrap = el.closest('[data-sticky-title="wrap"]');
  const frame = wrap?.querySelector(".sticky-title__container");
  const track = wrap?.querySelector('[data-sticky-title="track"]');
  const fieldTop = field.getBoundingClientRect().top;
  const held = wrap?.hasAttribute("data-sticky-title-still") && frame && track && getComputedStyle(frame).position === "sticky";
  if (!held) return box.top - fieldTop;
  const f = frame.getBoundingClientRect();
  return box.top - f.top + (track.getBoundingClientRect().bottom - frame.offsetHeight) - fieldTop;
}

export function mountDotFit(el) {
  const section = el.closest("section, [data-barba='container']");
  const field = section?.querySelector(el.dataset.dotFit);
  const body = el.querySelector(".action-button__body");
  if (!field) return { destroy() {} };

  const props = ["--action-button-height", "--dot-fit-trim", "--dot-fit-body", "--dot-fit-size", "--dot-fit-w", "--dot-fit-h", "--dot-fit-x", "--dot-fit-y"];
  const frame = el.hasAttribute("data-dot-fit-frame");
  const pitches = (v, p) => `${(Math.max(2, Math.round(v / p)) * p).toFixed(3)}px`;
  const clear = () => props.forEach((p) => el.style.removeProperty(p));

  const topInField = (box) => heldTopInField(el, field, box);

  function fit() {
    const lattice = latticeOf(field);
    clear();
    if (!lattice) return;
    const { pitch: p, x, y } = lattice;
    const fieldLeft = field.getBoundingClientRect().left;

    if (body) fitButton(p, x, fieldLeft);
    // a frame: whole pitches across, then down at that width
    else if (frame) {
      el.style.setProperty("--dot-fit-w", pitches(el.offsetWidth, p));
      el.style.setProperty("--dot-fit-h", pitches(el.offsetHeight, p));
    }
    // a tile: a square of whole pitches
    else el.style.setProperty("--dot-fit-size", pitches(el.offsetWidth, p));

    // the move: each edge midway between two lines of dots
    const box = el.getBoundingClientRect();
    const dx = near(fieldLeft + x + p / 2 - box.left, p);
    const dy = near(y + p / 2 - topInField(box), p);
    el.style.setProperty("--dot-fit-x", `${dx.toFixed(3)}px`);
    el.style.setProperty("--dot-fit-y", `${dy.toFixed(3)}px`);
  }

  function fitButton(p, x, fieldLeft) {
    // height: the whole pitches nearest the button's own, its room in the
    // layout kept at its own height (--dot-fit-trim): the frame round it,
    // and all the dots are fitted to below it, stay where they are
    const own = el.offsetHeight;
    const rows = Math.max(2, Math.round(own / p));
    el.style.setProperty("--action-button-height", `${(rows * p).toFixed(3)}px`);
    el.style.setProperty("--dot-fit-trim", `${(own - rows * p).toFixed(3)}px`);

    // width: whole pitches, at least the label's, the parity that moves
    // it least onto the dots (it grows from its middle when centred)
    const natural = el.getBoundingClientRect();
    const cols = Math.ceil(natural.width / p - 0.01);
    const moveFor = (n) => {
      const left = natural.left + natural.width / 2 - (n * p) / 2;
      return near(fieldLeft + x + p / 2 - left, p);
    };
    const n = Math.abs(moveFor(cols)) <= Math.abs(moveFor(cols + 1)) + 0.01 ? cols : cols + 1;
    const extra = n * p - natural.width;
    el.style.setProperty("--dot-fit-body", `${(body.getBoundingClientRect().width + extra).toFixed(3)}px`);
  }

  fit();
  ScrollTrigger.addEventListener("refresh", fit);
  return {
    destroy() {
      ScrollTrigger.removeEventListener("refresh", fit);
      clear();
    },
  };
}
