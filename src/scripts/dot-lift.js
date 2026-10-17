/* ============================================================
   Dot lift — a field's dots a little brighter round what stands on it
   ------------------------------------------------------------
   The logo wall stands on the band's dots: each card a hole in them,
   on their lattice, so the lines of dots run between the cards and
   round the wall (styles.css, data-dot-snap). For contrast, the dots
   nearest each logo are lifted a little (dot-field.js, lift): the
   field keeps its grain, every dot is raised in proportion, in full
   under the logo's own room in its card and falling away softly
   beyond it, unevenly, so the lines between the cards are brightest
   beside the logos and fade towards the corners and the wall's edges,
   as the field warming to the logos rather than a glow drawn round
   them.

   The button under the approach statement has a glow instead
   (dot-field.js, glow): the same dots, raised in full under the button
   and falling away round it on a soft ellipse, grainy, with no edge of
   its own; a layer of its own over the field, so it can be faded. It
   comes up with the button, a little behind it: the button fades in as
   the last statement settles (sticky-title.js), and the glow's opacity
   follows the button's, from the moment the button is half there, so
   the dots warm to the button once it is there rather than before it.
   Read off the button's inline style on the scroll's updates: no
   layout, nothing drawn again.

   data-dot-lift="<the field's .dot-grid selector>" on the wall, or on
   the button; data-dot-lift-reach (in the field's pitches) and
   data-dot-lift-amount (how much brighter at the fullest, a share of
   the dots' own brightness) for other than the logos' values. A wall
   gives a region per card ([data-logo-wall-item]): the room its logo
   can take (the width and height the logos are kept to, styles.css),
   centred in the card, so the regions stand still while the logos
   trade (logo-wall-cycle.js) and the field is never drawn again for a
   trade. Anything else gives its own box, as a glow. Measured on mount
   and on every ScrollTrigger refresh (after the wall has been put on
   its row, dot-snap.js), never on scroll.

   In a held frame whose dots are held still with it (sticky-title.js,
   data-sticky-title-still: the statement's button), the glow is set
   against the dots as they stand while held: the frame stands still on
   the screen and so do the dots, so the button's place on them is its
   place at the release (as dot-fit.js fits it), and the layer, moved
   down the field with the dots by the hold, is given the box that much
   higher.
   ============================================================ */
import { heldTopInField } from "./dot-fit.js";

// the logo's core in its card (a share of the card's width and height,
// centred: the marks are kept to 76% by 64% at most and most are far
// smaller), and how far beyond it the lift reaches, in the field's pitches
const ROOM_W = 0.4;
const ROOM_H = 0.2;
const REACH = 9;
// the lift at its fullest: this much more of the dots' own brightness
const AMOUNT = 3;
// a glow follows its button's fade from this far into it
const GLOW_FROM = 0.5;

let keys = 0;

export function mountDotLift(el) {
  const field = el.closest("section, [data-barba='container']")?.querySelector(el.dataset.dotLift);
  if (!field) return { destroy() {} };
  const key = `lift-${keys++}`;
  const reach = parseFloat(el.dataset.dotLiftReach) || REACH;
  const amount = parseFloat(el.dataset.dotLiftAmount) || AMOUNT;
  const items = () => [...el.querySelectorAll("[data-logo-wall-item]")];
  const pitchOf = () => {
    const probe = field.querySelector(":scope > [data-dot-probe]");
    const pitch = probe ? parseFloat(getComputedStyle(probe).width) / 64 : 0;
    return pitch > 1 ? pitch : 0;
  };
  // the held frame the element stands in, if its dots are held with it
  const wrap = el.closest('[data-sticky-title="wrap"][data-sticky-title-still]');
  // what fades the button (sticky-title.js writes its opacity inline)
  const fader = el.closest('[data-sticky-title="after"]');
  let glow = null;

  function measure() {
    const grid = field.dotGrid;
    const pitch = pitchOf();
    if (!grid || !pitch) return;
    const box = field.getBoundingClientRect();
    const cards = items().filter((item) => getComputedStyle(item).display !== "none");
    if (cards.length) {
      const regions = cards.map((item) => {
        const r = item.getBoundingClientRect();
        const w = r.width * ROOM_W;
        const h = r.height * ROOM_H;
        return { x: r.left + (r.width - w) / 2 - box.left, y: r.top + (r.height - h) / 2 - box.top, w, h };
      });
      grid.lift(regions, reach * pitch, amount, key);
      return;
    }
    const r = el.getBoundingClientRect();
    const y = wrap ? heldTopInField(el, field, r) - grid.held : r.top - box.top;
    glow = grid.glow(key, { x: r.left - box.left, y, w: r.width, h: r.height }, reach * pitch, amount);
    follow();
  }

  // the glow as far in as the button is past GLOW_FROM of its fade; whole
  // where nothing fades it
  function follow() {
    if (!glow) return;
    const shown = fader ? parseFloat(fader.style.opacity) : 1;
    const at = Number.isFinite(shown) ? shown : 1;
    glow.style.opacity = Math.min(1, Math.max(0, (at - GLOW_FROM) / (1 - GLOW_FROM))).toFixed(3);
  }
  // The button's fade is scrubbed off the scroll with a lag, so it goes on
  // changing after the scroll has stopped: followed on every frame, but
  // only while the frame that holds the button is on the screen
  const following = fader
    ? ScrollTrigger.create({
        trigger: wrap ?? fader,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? gsap.ticker.add(follow) : gsap.ticker.remove(follow)),
      })
    : null;

  measure();
  ScrollTrigger.addEventListener("refresh", measure);
  return {
    destroy() {
      ScrollTrigger.removeEventListener("refresh", measure);
      following?.kill();
      gsap.ticker.remove(follow);
      field.dotGrid?.lift(null, 0, 0, key);
      field.dotGrid?.glow(key, null);
    },
  };
}
