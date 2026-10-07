/* ============================================================
   Logo Morph Loader (GSAP) — the first-load intro, second iteration
   ------------------------------------------------------------
   Built alongside the Logo Stack Loader (logo-stack-loader.js), which
   is kept as it is; which of the two plays is chosen per document
   load (data-loader on <html>, see BaseLayout and runIntro()).

   On the homepage it is the hero's way in rather than a curtain in
   front of it. The hero's own field is the screen from the first paint
   (morph-loader.css) — the field alone, whole and unbroken, with none
   of its words in it yet — and the intro plays out in it:

     A D D D       the name rises into the middle of the screen out of
                   its own baseline, one letter after another, as the
                   field makes room for it — hugging the letters, the
                   strokes beside a slanted edge turning to run along it,
                   so the pattern closes round the A's legs. It is set in
                   the field's grid: a cap height of one and a half rows,
                   on the line between two rows (a touch above centre, to
                   sit optically centred), so the letters stand in them,
                   and the word centred across a run of whole cells, all
                   from the field's own cell, with a little more room
                   before it than after it
     → the logo    each letter's own outline is drawn into its form:
                   the A's flat apex pinches to a point and the notch
                   between its legs fills down to the base; the D's
                   stem becomes the triangle's upright, its bowl
                   flattens into the two diagonals and its flat side
                   pinches to the tip; both counters close as the ink
                   goes solid. A wave runs through the word, one letter
                   a beat after the last, each pressed down onto its
                   foot as it gives way and released into its new shape
     → the disc    the red circle opens out behind the forms, turning
                   each white as it passes under it, and as it opens it
                   pushes the field back — close round its rim, the
                   strokes there turning to run round it — and sets off
                   the pulse: a light chain reaction out through the
                   whole field, a firm grey touched with red at the logo
                   and faint by the edges, every stroke it passes turning, traces
                   flung out ahead of it, and the field's words born in
                   its wake all over the screen, each carving its place
                   out of the strokes and decoding in with a burst of
                   its own (the lower half's are the intro's own words)
     → the hero    with the pulse still spreading, the logo sets off for
                   the nav's logo slot and the red disc becomes the slot
                   on the way — one shape that loses its roundness, takes
                   the slot's proportions and darkens from the red into
                   the slot's own black as it travels, already black as
                   it arrives — while the clearing closes behind it, the
                   bar drops in and the hero's copy rises from the foot
                   of the screen, the band's crop on its top edge: all
                   three on one curve, arriving together as the logo
                   locks in, and the hero is the hero.

   Everywhere else, and with reduced motion, it is the plain intro: the
   name rises out of its baseline on a black ground, the morph and the
   disc, and the ground lifts off the page as the stack's does.

   The morph itself — the letters' outlines, their targets and the
   windows that stagger the parts of each letter — is logo-morph.js,
   shared with the nav's logo, which plays it on hover. Each letter is
   its own path, so the four are handled individually throughout. The
   field's part — the clearing, the pulse, the words' births and the
   close — is the field's own (slash-field.js, its intro methods).

   Hands back its timeline (null without the markup), as the stack
   loader does, with a "reveal" label where scrolling can be handed
   back: as the ground starts to lift, or on the homepage once the hero
   has settled. Markup: src/components/MorphLoader.astro. Styles:
   src/styles/morph-loader.css.
   ============================================================ */

import { LETTER_COUNT, NAME_BOUNDS, morphPath, outline, getMorphEase } from "./logo-morph.js";

// Each stage starts as the one before it is all but done rather than once it
// has finished, so the intro runs on as one movement.
const TIMING = {
  enter: 0.1, // the first letter starts to rise
  enterDuration: 0.75,
  enterStagger: 0.05,
  hold: 0.18, // the name, set and readable, before it starts to change
  morphDuration: 1.0,
  morphStagger: 0.08,
  // the disc opens as the last letter is finding its form: the morph ease
  // spends its tail settling, and the disc's opening carries that tail
  circleAt: 0.66,
  circleDuration: 0.85,
  finished: 0.3, // the completed mark, held, before the ground lifts
};

// The homepage's own. calm: the field alone before anything happens; then
// the name rising into the field as the field carves its room (carve, how
// long that takes across the word), and the hold on the name; the disc's
// push and its pulse — how long the push takes to open the clearing, and
// the pulse to cross the field; when the field's traffic starts, and when
// the logo sets off for the nav — both from the disc's start, the second as
// soon as the disc has opened and sent its pulse off, so the flight and the
// pulse are one event, the pulse spreading and bringing its words in as the
// logo travels; the flight; meet, how long the bar and the copy take to
// arrive, landing as the logo locks in; and the clearing closing behind the
// logo.
const HERO = {
  calm: 0.22,
  carve: 0.38,
  hold: 0.08,
  openTime: 0.36,
  pulseTime: 1.5,
  traffic: 0.9,
  wake: 0.5,
  flight: 1.05,
  meet: 0.9,
  closeTime: 0.55,
};

// The disc's radius in the logo's viewBox.
const DISC = 40.2;

// The name's cap height, in rows of the field: well under the two rows
// of strokes it stands in (1.68 would be their full span), on the line
// between them — raised by NAME_RISE (rows) from dead centre, since the A's
// point and the D's shoulders leave its top looking lower than it is, so it
// sits optically centred: a little less room above it than below.
const NAME_ROWS = 1.15;
const NAME_RISE = 0.1;

// How close the field's strokes may come (px) to the name's letters, and to
// the disc's rim, as each clears its room; on the name's left, where the
// strokes face the A, they keep NAME_LEFT (px) further off, so the word has
// a little more room before it than after it.
const NAME_MARGIN = 2.5;
const NAME_LEFT = 2.5;
const DISC_MARGIN = 3.5;

// Over which stretch of the flight (a share of the way there, along the
// flight's own curve) the red shape darkens into the slot's black, so it is
// black before it arrives.
const DARKEN = [0.22, 0.88];

// How far (px, py) is from the nearest of the given polygons — 0 inside one —
// which way that polygon's nearest edge runs, and the way from the point to
// the nearest point of it: [distance, ex, ey, vx, vy].
function nearestEdge(polygons, px, py) {
  let best = Infinity;
  let ex = 0;
  let ey = 1;
  let vx = 0;
  let vy = 0;
  let inside = false;
  for (const poly of polygons) {
    let within = false;
    for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) {
      const [ax, ay] = poly[j];
      const [bx, by] = poly[k];
      if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) within = !within;
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
      const qx = ax + t * dx - px;
      const qy = ay + t * dy - py;
      const d = qx * qx + qy * qy;
      if (d < best) {
        best = d;
        ex = dx;
        ey = dy;
        vx = qx;
        vy = qy;
      }
    }
    if (within) inside = true;
  }
  return [inside ? 0 : Math.sqrt(best), ex, ey, vx, vy];
}

// Whether this load's first paint is the homepage's field (the selector
// morph-loader.css sets that paint up with).
const heroPaint = () =>
  document.documentElement.matches('[data-arrival="intro"][data-loader="morph"]:has(.hero__media[data-slash-field])') &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initLogoMorphLoader(root = document.querySelector("[data-morph-loader]"), { hero = null } = {}) {
  if (!root) return null;

  const bg = root.querySelector("[data-morph-loader-bg]");
  const shape = root.querySelector("[data-morph-loader-shape]");
  const logo = root.querySelector("[data-morph-loader-logo]");
  const word = root.querySelector("[data-morph-loader-word]");
  const circle = root.querySelector("[data-morph-loader-circle]");
  const discClip = root.querySelector("[data-morph-loader-disc-clip]");
  const paths = [...root.querySelectorAll("[data-morph-loader-letter]")];
  const lit = [...root.querySelectorAll("[data-morph-loader-letter-lit]")];
  if (!bg || !shape || !logo || !word || !circle || !discClip || paths.length !== LETTER_COUNT || lit.length !== LETTER_COUNT) return null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The homepage: the field the intro plays out in, and the parts of the
  // hero it brings in. Without them a first paint set up for the homepage
  // is let go, so the plain intro plays over the page as it is.
  const stage = heroPaint() ? homepage(hero) : null;
  if (heroPaint() && !stage) delete document.documentElement.dataset.arrival;

  // The disc arrives quickly and spends most of its time settling.
  const discEase = CustomEase.create("addd-disc", "0.2, 0.7, 0.2, 1");
  // The flight to the nav eases out of the middle and spends its time on the
  // way, so the disc is seen becoming the slot rather than snapping to it;
  // the forms ride the same curve, so they never leave the shape.
  const flightEase = CustomEase.create("addd-flight", "0.5, 0, 0.15, 1");

  const morphEase = getMorphEase();
  // Draws letter i at morph progress t (0 the glyph, 1 the form), and its
  // copy cut to the disc.
  function draw(i, t) {
    const d = morphPath(i, t, morphEase);
    paths[i].setAttribute("d", d);
    lit[i].setAttribute("d", d);
  }

  const states = paths.map(() => ({ t: 0 }));
  states.forEach((state, i) => draw(i, state.t));

  const timeline = gsap.timeline();

  // Everything is placed before the logo is shown, so the first frame it
  // appears in is already the first frame of the animation.
  timeline.set([circle, discClip], { attr: { r: 0 } }, 0);
  timeline.set(logo, { autoAlpha: 1 }, 0);

  // The morph's wave through the word, from the given moment; hands back
  // when the disc opens.
  function morph(start) {
    states.forEach((state, i) => {
      timeline.to(state, {
        t: 1,
        duration: TIMING.morphDuration,
        ease: "none",
        onUpdate: () => draw(i, state.t),
      }, start + i * TIMING.morphStagger);
    });
    return start + TIMING.morphStagger * (LETTER_COUNT - 1) + TIMING.morphDuration * TIMING.circleAt;
  }

  // The disc opening behind the forms, and the forms giving a fraction as
  // it does, then settling into it: the one move the whole mark makes
  // together.
  function disc(start) {
    timeline
      .addLabel("circle", start)
      .to([circle, discClip], { attr: { r: DISC }, duration: TIMING.circleDuration, ease: discEase }, "circle")
      .to(word, { scale: 0.965, svgOrigin: "50.4 50.7", duration: 0.28, ease: "power2.out" }, "circle")
      .to(word, { scale: 1, duration: 0.7, ease: "power3.out" }, "circle+=0.28")
      .addLabel("complete", start + TIMING.circleDuration * 0.7);
  }

  // A D D D rising up out of its own baseline, one letter after another,
  // from the given moment; hands back when the name has landed.
  function rise(start) {
    timeline.set([...paths, ...lit], { y: 17 }, 0);
    [paths, lit].forEach((set) => {
      timeline.to(set, { y: 0, duration: TIMING.enterDuration, ease: "osmo", stagger: TIMING.enterStagger }, start);
    });
    return start + TIMING.enterDuration * 0.75 + TIMING.enterStagger * (LETTER_COUNT - 1);
  }

  // The name set into the field's grid. Its cap height is the span of two
  // rows of strokes — from the top of one row's strokes to the foot of the
  // next's — so the mark is sized from the field's own cell; its middle goes
  // on the line between the two rows nearest the middle of the screen, and
  // the word is centred across the run of whole cells it needs, the way the
  // field sets its own words. Placed by nudging the mark from where the
  // stylesheet centres it, before anything else measures it. Hands back the
  // cells it stands in: the first (c) and how many (n), and its two rows (r
  // and the one under it), with the grid.
  function fitToGrid(field) {
    const grid = field.intro.grid();
    const { cellW, cellH } = grid;
    const { left, right, top, bottom } = NAME_BOUNDS;
    const unit = (cellH * NAME_ROWS) / (bottom - top);
    // set directly, as the nudge below is: GSAP would round them to whole
    // pixels, and with them the name's height off the rows
    logo.style.width = logo.style.height = `${100 * unit}px`;
    const box = logo.getBoundingClientRect();
    // the line between two rows nearest the name's middle
    const line = Math.round((box.top + ((top + bottom) / 2) * unit - grid.y) / cellH);
    const width = (right - left) * unit;
    const n = Math.ceil(width / cellW);
    const slack = (n * cellW - width) / 2;
    const c = Math.round((box.left + left * unit - slack - grid.x) / cellW);
    // the rows sit wherever the band puts them, between pixels as often as
    // not
    logo.style.left = `${grid.x + c * cellW + slack - (box.left + left * unit)}px`;
    logo.style.top = `${grid.y + (line - NAME_ROWS / 2 - NAME_RISE) * cellH - (box.top + top * unit)}px`;
    return { ...grid, c, n, r: line - 1 };
  }

  // The homepage: everything the intro does to the hero, in the hero's own
  // terms, measured from its layout before anything has moved.
  function heroIntro({ field, band, copy, nav, slot, mark }) {
    const name = fitToGrid(field);
    const box = logo.getBoundingClientRect();
    const unit = box.width / 100;
    const at = (x, y) => [box.left + x * unit, box.top + y * unit];
    const [dx, dy] = at(51, 50.3); // the disc's centre
    const bandBox = band.getBoundingClientRect();
    const above = Math.max(0, bandBox.top);
    const below = Math.max(0, window.innerHeight - bandBox.bottom);
    // the forms' flight: their corner onto the nav mark's, at its size
    const target = mark.getBoundingClientRect();
    const [fx, fy] = at(18.4, 42.7);
    const flight = { x: target.left - fx, y: target.top - fy, scale: target.width / (64 * unit) };
    // the red shape's: the disc, as a rounded inset of the screen, onto the
    // nav's logo slot, square-cornered
    const screen = shape.getBoundingClientRect();
    const r = DISC * unit;
    const inset = (top, right, bottom, left, round) =>
      `inset(${top - screen.top}px ${screen.right - right}px ${screen.bottom - bottom}px ${left - screen.left}px round ${round}px)`;
    const slotBox = slot.getBoundingClientRect();
    // the disc as it is when the flight sets off — it may still be opening
    const asDisc = () => {
      const now = parseFloat(circle.getAttribute("r")) * unit;
      return inset(dy - now, dx + now, dy + now, dx - now, now);
    };
    const asSlot = inset(slotBox.top, slotBox.right, slotBox.bottom, slotBox.left, 0);

    // The band's crop, opened out over the screen, in the terms the rise
    // closes it in; the nav's own mark held back until the logo is in it.
    timeline
      .set(band, { clipPath: `inset(${-above}px 0px ${-below}px 0px)` }, 0)
      .set(mark, { opacity: 0 }, 0);

    // A D D D rises into the field, one letter after another, and the field
    // carves the name its room as it comes, across it from the left, the way
    // it leaves a word its cells — but hugging the letters rather than a
    // block of cells: a stroke goes only where it would come too close to
    // them, and the strokes right beside a slanted edge — the A's legs above
    // all — turn to run along it, so the pattern closes round the letters the
    // way they lean. As the morph starts, the field makes room in the same
    // way for the forms the letters are becoming, a little wider at the
    // foot, so it gives way as they change.
    // (Seen from beside the letters — between their cap line and baseline —
    // where they lie to the right, on the A's side, the word reads NAME_LEFT
    // nearer than it is, so the strokes before it stand further off; those
    // over and under it are left as they are.)
    const shapeOf = (t) => {
      const polygons = Array.from({ length: LETTER_COUNT }, (_, i) => outline(i, t));
      return (x, y) => {
        const py = (y - box.top) / unit;
        const [d, ex, ey, vx] = nearestEdge(polygons, (x - box.left) / unit, py);
        const before = vx > 0 && py >= NAME_BOUNDS.top && py <= NAME_BOUNDS.bottom ? NAME_LEFT : 0;
        return [Math.max(0, d * unit - before), ex, ey];
      };
    };
    const cellBox = (c0, r0, c1, r1) => ({
      x0: name.x + c0 * name.cellW,
      y0: name.y + r0 * name.cellH,
      x1: name.x + c1 * name.cellW - 0.01,
      y1: name.y + r1 * name.cellH - 0.01,
    });
    const nameBox = cellBox(name.c - 3, name.r - 1, name.c + name.n + 3, name.r + 3);
    const echo = 1.5 * name.cellW;
    timeline.call(() => field.intro.carve(shapeOf(0), nameBox, { margin: NAME_MARGIN, echo, time: HERO.carve }), null, HERO.calm);
    const morphStart = rise(HERO.calm) + HERO.hold;
    timeline
      .addLabel("morph", morphStart)
      .call(() => field.intro.carve(shapeOf(1), nameBox, { margin: NAME_MARGIN, echo, time: TIMING.morphDuration * 0.6 }), null, morphStart);

    // The morph, then the disc: as it opens it pushes the field back from
    // the middle — hugging its rim, the strokes there turning to run round it
    // — and sets off the pulse, from just inside its rim, the field's words
    // born in its wake; the traffic runs between them once they are in. The
    // pulse is worked out as the morph starts, a quiet moment, and set to
    // start with the disc, so the frame the disc opens on has only the
    // clearing to cut.
    const discStart = morph(morphStart);
    disc(discStart);
    timeline
      .call(() => field.intro.pulse(dx, dy, { inner: r * 0.6, time: HERO.pulseTime, delay: discStart + 0.02 - morphStart }), null, morphStart)
      .call(() => field.intro.open(dx, dy, r, { margin: DISC_MARGIN, echo: name.cellW, time: HERO.openTime }), null, discStart)
      .call(() => field.intro.live(), null, discStart + HERO.traffic);

    // The hand-over, with the pulse still on its way out: the logo travels to
    // the nav's logo slot and the disc becomes the slot on the way, while the
    // bar drops in and the copy rises from the foot of the screen — all three
    // on the flight's own curve, so they arrive together, at the moment the
    // logo locks in. The red darkens into the slot's own black as the shape
    // travels, in step with how far it has come along that curve, so it is
    // already black when it arrives and nothing changes as it locks in.
    const handover = discStart + HERO.wake;
    const lock = handover + HERO.flight;
    const meet = lock - HERO.meet;
    const flightAt = gsap.parseEase(flightEase);
    const darken = (p) => {
      const u = gsap.utils.clamp(0, 1, (flightAt(p) - DARKEN[0]) / (DARKEN[1] - DARKEN[0]));
      return u * u * (3 - 2 * u);
    };
    // what moves in the hand-over gets its own layer while it does, so the
    // flight is the compositor's to draw rather than a repaint every frame
    const moving = [logo, copy, nav];
    timeline
      .addLabel("handover", handover)
      // the clearing closes behind the logo as it leaves
      .call(() => field.intro.close(HERO.closeTime), null, handover)
      .set(moving, { willChange: "transform" }, handover)
      // the red shape takes over from the disc where it is, and becomes the
      // slot as it travels, darkening into the slot's black on the way; the
      // forms travel with it, onto the nav's mark
      .set(shape, { clipPath: asDisc, visibility: "visible" }, handover)
      .set(circle, { opacity: 0 }, handover)
      .to(shape, { clipPath: asSlot, duration: HERO.flight, ease: flightEase }, handover)
      .to(shape, { backgroundColor: getComputedStyle(slot).backgroundColor, duration: HERO.flight, ease: darken }, handover)
      .to(logo, { ...flight, transformOrigin: "18.4% 42.7%", duration: HERO.flight, ease: flightEase }, handover)
      // the bar, and the copy with the band's crop riding on its top edge
      .fromTo(nav, { yPercent: -100, visibility: "visible" }, { yPercent: 0, duration: HERO.meet, ease: flightEase, immediateRender: false }, meet)
      .fromTo(copy, { y: below, visibility: "visible" }, { y: 0, duration: HERO.meet, ease: flightEase, immediateRender: false }, meet)
      .to(band, { clipPath: `inset(${-above}px 0px 0px 0px)`, duration: HERO.meet, ease: flightEase }, meet)
      .addLabel("lock", lock)
      // locked in, the nav's own slot and mark take over from the shape and
      // the forms, which are already the same black and white
      .set(mark, { opacity: 1 }, lock)
      .set([shape, logo], { autoAlpha: 0 }, lock)
      .addLabel("reveal", lock)
      // the hero as it always is: every word in, the intro's own words let
      // go, the arrival over and the page's own styles back in charge; and,
      // a moment later, so the work is not all on the frame the logo locks
      // in, the field cut back to the band
      .call(() => {
        field.intro.bearAll();
        field.intro.retire();
        gsap.delayedCall(0.25, field.intro.crop);
        delete document.documentElement.dataset.arrival;
        gsap.set(band, { clearProps: "clipPath" });
        gsap.set(copy, { clearProps: "transform,visibility,willChange" });
        gsap.set(nav, { clearProps: "transform,visibility,willChange" });
        gsap.set(mark, { clearProps: "opacity" });
      }, null, lock);
  }

  if (reduceMotion) {
    states.forEach((state, i) => draw(i, 1));
    timeline
      .set([circle, discClip], { attr: { r: DISC } }, 0)
      .fromTo(logo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0)
      .addLabel("complete", 0.5)
      .addLabel("reveal", "complete+=0.6")
      .to(root, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, "reveal");
  } else if (stage) {
    heroIntro(stage);
  } else {
    const morphStart = rise(TIMING.enter) + TIMING.hold;
    timeline.addLabel("morph", morphStart);
    disc(morph(morphStart));
    timeline
      .addLabel("reveal", `complete+=${TIMING.finished}`)
      // as the stack's: the mark goes, then the ground lifts off the page
      .to(logo, { autoAlpha: 0, y: "-6%", duration: 0.4, ease: "power2.out" }, "reveal")
      .to(bg, { scaleY: 0, duration: 0.55, ease: "expo.inOut" }, "reveal+=0.1");
  }

  timeline.set(root, { display: "none" });

  return timeline;
}

// The homepage's parts, or null where the page has none: the field (mounted
// by the page, so already running), its band, the copy under it, the nav,
// its logo slot and the mark in it.
function homepage(band) {
  const field = band?.slashField;
  const copy = band?.closest(".hero")?.querySelector(":scope > .container");
  const nav = document.querySelector("[data-menu-wrap]");
  const slot = nav?.querySelector(".mega-nav__bar-logo");
  const mark = slot?.querySelector(".mega-nav__bar-logo-mark");
  if (!field?.intro || !copy || !nav || !slot || !mark) return null;
  return { field, band, copy, nav, slot, mark };
}
