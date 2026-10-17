/* ============================================================
   Approach stack — the homepage's three steps on a scroll-driven
   timeline (src/components/ApproachStack.astro)
   ------------------------------------------------------------
   Built on the supplied Scroll-driven Stack Timeline spec, adapted
   to three cards and to this site. The cards are always open, each
   with its step drawn as a live schematic, and the scroll drives
   the rest:

     - each card rises into place as it comes up the screen, and its
       figure comes alive the first time the card is properly in
       view, then runs while the card is on screen and holds while it
       is not: each is a Hairline figure (understand-figure.js,
       approach-figures.js), walked by an unseen pointer meanwhile;
     - the rail's dotted line shows only through a window held at
       the middle of the viewport. The dots are drawn inside the
       window and moved against the scroll, which reads exactly as
       the full-length line seen through it, without a clip-path on
       a full-height SVG;
     - the mark on the rail, the logo's triangle, points the way the
       page is scrolling, down or up;
     - a solid trail grows out of the cube with the scroll's speed,
       behind it either way, and fades over the end of the rail.

   gsap.matchMedia sets up one of three states and tears it down
   again when the viewport crosses a breakpoint: the rail and the
   trail from 768px, cards only below it, and under reduced motion
   every schematic at rest, with no trail or entrance. GSAP and
   ScrollTrigger are the site's globals; Lenis, when given,
   supplies the trail's speed.
   ============================================================ */

import { mountApproachFigure } from "./approach-figures.js";
import { mountUnderstandFigure } from "./understand-figure.js";

// The velocity trail, as the spec sets it: lengths are shares (%) of the
// window's half, and the line fades out over the last 15% of the rail.
const TRAIL = { gain: 2, max: 50, minSpeed: 0.5, fadeFrom: 0.85, idle: 150 };

export function mountApproachStack(root, { lenis } = {}) {
  const rail = root.querySelector("[data-approach-stack-rail]");
  const win = root.querySelector("[data-approach-stack-window]");
  const dots = root.querySelector("[data-approach-stack-dots]");
  const mark = root.querySelector("[data-approach-stack-mark]");
  const trailEls = {
    top: root.querySelector('[data-approach-stack-trail="top"]'),
    bottom: root.querySelector('[data-approach-stack-trail="bottom"]'),
  };

  // The dotted line beside the statement before the stack (StickyTitle.astro),
  // which the rail's window grows out of, and the statement's held frame.
  const lead = root.parentElement?.querySelector("[data-rail-lead]") ?? null;
  const leadFrame = lead?.closest(".sticky-title__container") ?? null;
  const leadTrack = lead?.closest('[data-sticky-title="track"]') ?? null;

  // The band's field of dots (approach-stack.css, the site's .dot-grid),
  // set out from the 12-Column Grid rather than the cards from it: the
  // grid places every card, and the field takes the pitch and the
  // columns that put the cards' sides midway between its dots
  // (fitColumns). The rail then stands on one of those columns, the one
  // nearest the line the stylesheet gives it (snapRail), so the mark on
  // it sits on a line of dots, never between two; its rows run from
  // where the rail's dots are counted (origin, a page position), so the
  // rail's dots are the field's own. The pitch goes on the band
  // (--dot-pitch), for the rail's dots and the statement's dotted line
  // before it. Without a rail (a phone, or reduced motion), the rows run
  // from the field's top.
  const field = root.querySelector("[data-approach-stack-field]");
  const fieldDots = root.querySelector("[data-approach-stack-field-dots]");
  const band = root.closest(".ink-band") ?? root;
  const DOT = 2;
  // the field as set out: its pitch, and the middles of one of its
  // columns (x) and one of its rows (y), in its own box
  let grid = null;
  const px = (v) => `${+v.toFixed(3)}px`;

  // The pitch and the columns from the lines they have to clear: every
  // card's sides where the grid puts them, and, where the rail runs down
  // the page's centre (from 992px: the cards either side of it), the
  // centre itself, which a column has to stand on — half a step off the
  // lines, between two of them. The pitch fits a whole number of steps
  // across the first card, near 0.875rem (14px at the ideal width, so it
  // scales with the page as the grid does and the count holds at every
  // width in a range: the band's one dot field, between the approach's
  // old 18px and the logos' old 12px); for each count near the nearest,
  // one pitch and one offset are fitted to all the lines at once (least
  // squares), the offset then set so the centre's column is exact, and
  // the count that leaves no card's side further off midway wins, the
  // nearest on a tie. Every side then runs midway between two columns
  // to a fraction of a pixel, and the centre is on one exactly. Returns
  // the pitch and one of those midway lines, in the field's own box.
  function fitColumns() {
    const box = field.getBoundingClientRect();
    const lines = cards.flatMap(({ slot }) => {
      const r = slot.getBoundingClientRect();
      return [r.left - box.left, r.right - box.left];
    });
    const [a, b] = lines;
    // the centre, where the rail is (the stack's middle, which is the
    // page's: the stack runs the page's width); null below 992px, where
    // the rail runs down Grid Column 1 and the cards all stand to its right
    const centred = window.matchMedia("(min-width: 992px)").matches;
    const mid = centred ? box.width / 2 : null;
    const target = 0.875 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const nearest = Math.max(1, Math.round((b - a) / target));
    const fit = (count) => {
      const rough = (b - a) / count;
      const pts = lines.map((v) => [v, Math.round((v - a) / rough)]);
      const kc = mid === null ? null : Math.round((mid - a) / rough - 0.5) + 0.5;
      if (kc !== null) pts.push([mid, kc]);
      const n = pts.length;
      const sum = (f) => pts.reduce((s, [v, k]) => s + f(v, k), 0);
      const sk = sum((_, k) => k);
      const sv = sum((v) => v);
      const skk = sum((_, k) => k * k);
      const skv = sum((v, k) => k * v);
      const pitch = (n * skv - sk * sv) / (n * skk - sk * sk) || rough;
      const line = kc === null ? (sv - pitch * sk) / n : mid - kc * pitch;
      const off = Math.max(...lines.map((v, i) => Math.abs(v - line - pts[i][1] * pitch)));
      return { pitch, line, off };
    };
    const counts = centred ? [nearest - 2, nearest - 1, nearest + 1, nearest + 2] : [nearest - 1, nearest + 1];
    return counts
      .filter((count) => count > 0)
      .map(fit)
      .reduce((best, next) => (next.off < best.off - 0.25 ? next : best), fit(nearest));
  }

  // origin null: no rail (a phone, or reduced motion); fit, the columns
  // when the caller has them already
  const placeField = (origin, fit) => {
    if (!field) return;
    const { pitch, line } = fit ?? fitColumns();
    const top = field.getBoundingClientRect().top + window.scrollY;
    grid = {
      pitch,
      x: line + pitch / 2,
      y: origin === null ? pitch / 2 : origin + DOT / 2 - top,
    };
    band.style.setProperty("--dot-pitch", px(pitch));
    // the band's other fields (the logos', the steps' pieces) on the same
    // pitch, set on each, so each is drawn again (dot-field.js redraws a
    // field when its own style changes, not an ancestor's)
    band.querySelectorAll(".band-field").forEach((el) => {
      if (el !== fieldDots) el.style.setProperty("--dot-pitch", px(pitch));
    });
    fieldDots?.style.setProperty("--dot-x", px(grid.x));
    fieldDots?.style.setProperty("--dot-y", px(grid.y));
    // One lattice for the band: where a column of dots falls from the
    // band's (the page's) left edge, --dot-phase, and where a row falls
    // from its top, --dot-row (the steps' pieces), or from a field's own
    // top, --dot-y (the logos' and the statement's), on the band's other
    // fields and the logo wall, each set on its own so each is drawn
    // again. So the dots run on unbroken from the band's top edge into
    // the approach's.
    const mod = (v) => ((v % pitch) + pitch) % pitch;
    const fieldLeft = field.getBoundingClientRect().left;
    const phase = mod(grid.x + fieldLeft - band.getBoundingClientRect().left);
    const row = top + grid.y;
    const bandRow = mod(row - (band.getBoundingClientRect().top + window.scrollY));
    [band, ...band.querySelectorAll(".band-field, .logo-wall")].forEach((el) => {
      el.style.setProperty("--dot-phase", px(phase));
      el.style.setProperty("--dot-row", px(bandRow));
    });
    band.querySelectorAll(".band-field:not(.band-steps__dots)").forEach((el) => {
      if (el !== fieldDots) el.style.setProperty("--dot-y", px(mod(row - (el.getBoundingClientRect().top + window.scrollY))));
    });
    placeWall(pitch, phase);
    placeCards();
  };
  // The logo wall centred on the band, on the dots. Its cards are a whole
  // number of pitches each, a column of dots down the middle of every gap
  // (styles.css, .logo-wall, which rounds the step to the pitch and then
  // the wall down onto a column, as near centred as that allows: up to a
  // pitch off). Five steps from a column land the wall's middle on a
  // column when the step is an even number of pitches and midway between
  // two when it is odd; the band's middle is one or the other (the field
  // is fitted to the 12-Column Grid, which is symmetrical about it). So
  // the step is the nearest whole number of pitches to a fifth of the
  // grid's width WITH the parity the middle asks for, and the wall is
  // then centred exactly, its gaps on the columns. Set on the wall in px
  // (over the stylesheet's own formulas, which stand without it); the
  // lattice itself is never moved, so the approach's cards stay on it.
  const wall = band.querySelector(".logo-wall");
  const placeWall = (pitch, phase) => {
    if (!wall) return;
    const host = wall.closest(".logos__field") ?? band;
    const wrap = wall.parentElement;
    const W = host.getBoundingClientRect().width;
    const margin = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    const gap = parseFloat(getComputedStyle(wall).getPropertyValue("--wall-gap")) || 0;
    const avail = W - 2 * margin + gap;
    if (!(avail > 0) || !(pitch > 1)) return;
    // the band's middle on the lattice: 0 on a column, 0.5 midway
    const middle = ((((W / 2 - phase) % pitch) + pitch) % pitch) / pitch;
    const odd = Math.abs(middle - 0.5) < Math.abs(((middle + 0.5) % 1) - 0.5) ? 1 : 0;
    const ideal = avail / 5 / pitch;
    let steps = Math.round(ideal);
    if (steps % 2 !== odd) steps += ideal > steps ? 1 : -1;
    if (steps * 5 * pitch > avail + 0.5) steps -= 2;
    if (steps < 1) return;
    const step = steps * pitch;
    const width = 5 * step - gap;
    // centred, then the first gap's middle put exactly on its column
    const first = (W - width) / 2 - gap / 2;
    const x = phase + Math.round((first - phase) / pitch) * pitch + gap / 2;
    wall.style.setProperty("--wall-step", px(step));
    wall.style.setProperty("--wall-x", px(x));
  };
  const unplaceField = () => {
    grid = null;
    wall?.style.removeProperty("--wall-step");
    wall?.style.removeProperty("--wall-x");
    band.style.removeProperty("--dot-pitch");
    band.querySelectorAll(".band-field").forEach((el) => el.style.removeProperty("--dot-pitch"));
    fieldDots?.style.removeProperty("--dot-x");
    fieldDots?.style.removeProperty("--dot-y");
    [band, ...band.querySelectorAll(".band-field, .logo-wall")].forEach((el) => {
      el.style.removeProperty("--dot-phase");
      el.style.removeProperty("--dot-row");
    });
    band.querySelectorAll(".band-field:not(.band-steps__dots)").forEach((el) => {
      if (el !== fieldDots) el.style.removeProperty("--dot-y");
    });
  };

  // The rail on the field: from the line the stylesheet gives it (the
  // page's centre from 992px, where the field is set out with a column of
  // dots standing exactly, so this moves it by a fraction of a pixel at
  // most; the middle of Grid Column 1 below), moved across onto the
  // nearest column of dots (--rail-snap, half a step at most), so the mark
  // on it stands on a line of dots rather than between two.
  const snapRail = ({ pitch, line }) => {
    rail.style.removeProperty("--rail-snap");
    const box = field.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    const x = r.left + r.width / 2 - box.left;
    const column = line + pitch / 2 + Math.round((x - line - pitch / 2) / pitch) * pitch;
    rail.style.setProperty("--rail-snap", px(column - x));
  };
  // The statement's line onto the nearest column of dots too (--lead-snap),
  // so it stands on the field and the snake runs a whole number of steps
  // across from it to the rail.
  const snapLead = ({ pitch, line }) => {
    lead.style.removeProperty("--lead-snap");
    const box = field.getBoundingClientRect();
    const r = lead.getBoundingClientRect();
    const x = r.left + r.width / 2 - box.left;
    const column = line + pitch / 2 + Math.round((x - line - pitch / 2) / pitch) * pitch;
    lead.style.setProperty("--lead-snap", px(column - x));
  };

  // The lines inside each card on the field too, so its dots lay the card
  // out rather than lie behind it: its sides already run midway between
  // two columns (the field is set out from them), and here its top, its
  // foot, where the number's square meets the name and where each block
  // meets the next run midway between two lines of dots, the dots the
  // same step clear of all of them. So each card's top is moved down to
  // the nearest such line (by half a step at most), each block is made a
  // whole number of steps, and the padding a step and a half, which
  // starts the name and the copy on a column of dots. The cards never
  // move across: the 12-Column Grid places them. Only the middle card is
  // still; the outer two drift (initGlobalParallax), through their rest
  // on the field as each stands at the middle of the screen
  // (ApproachStack.astro, PARALLAX). Measured again on every refresh; a
  // change that moves the page under it asks for one more, so the
  // triggers below the stack measure the page as it now stands.
  const SNAP = ["--snap-top"];
  const SIZE = ["--card-top", "--card-pad", "--media-pad", "--foot-min", "--foot-pad-x"];
  let placed = "";
  function placeCards() {
    if (!grid || !cards?.length) return;
    const { pitch } = grid;
    // a row's middle, on the page
    const row = field.getBoundingClientRect().top + window.scrollY + grid.y;
    const between = (v, o) => o + pitch / 2 + Math.round((v - o - pitch / 2) / pitch) * pitch;
    const steps = (v) => Math.max(1, Math.round(v / pitch)) * pitch;

    // each card and its blocks as the stylesheet sets them, without any of this
    cards.forEach(({ slot, el }) => {
      SNAP.forEach((p) => slot.style.removeProperty(p));
      SIZE.forEach((p) => el.style.removeProperty(p));
      el.classList.remove("is--even");
    });
    const sides = cards.map(({ el }) => ({
      head: el.querySelector(".step-card__head").offsetHeight,
      pad: parseFloat(getComputedStyle(el.querySelector(".step-card__foot")).paddingLeft),
    }));
    // the number's square and the padding on the field
    cards.forEach(({ el }, i) => {
      const { head, pad } = sides[i];
      el.style.setProperty("--card-top", px(steps(head)));
      el.style.setProperty("--card-pad", px((Math.max(1, Math.round(pad / pitch - 0.5)) + 0.5) * pitch));
    });
    // then, at the width that gives them, the schematic's block and the
    // copy's in whole steps: the drawing centred in its block, the copy
    // in its own
    const blocks = cards.map(({ el }) => ({
      media: el.querySelector(".step-card__media").offsetHeight,
      drawing: el.querySelector(".step-card__figure")?.getBoundingClientRect().height ?? 0,
      foot: el.querySelector(".step-card__foot").offsetHeight,
    }));
    cards.forEach(({ el }, i) => {
      const { media, drawing, foot } = blocks[i];
      el.style.setProperty("--media-pad", px((steps(media) - drawing) / 2));
      el.style.setProperty("--foot-min", px(Math.ceil(foot / pitch) * pitch));
    });
    // the copy as far in from the card's sides as it stands from the top
    // and foot of its block: the block stays the whole steps nearest what
    // it is (never with less room than the padding over and under the
    // copy), and the room is what copy and room twice over fill it with
    // exactly, set on all four sides, the copy filling the width between.
    // At that measure the copy may break into more or fewer lines, so it is
    // read again and the room found again, a few times at most; once a
    // narrower measure has made it taller, the room never comes back under
    // what did that, so it cannot go back and forth between the two.
    cards.forEach(({ el }) => {
      const foot = el.querySelector(".step-card__foot");
      const copy = foot.querySelector(".step-card__p");
      const pad = parseFloat(getComputedStyle(foot).paddingTop) || 0;
      let copyH = copy.offsetHeight;
      const block = foot.offsetHeight;
      let least = pad;
      el.classList.add("is--even");
      for (let pass = 0; pass < 6; pass++) {
        const k = Math.max(Math.round(block / pitch), Math.ceil((copyH + 2 * least - 0.01) / pitch));
        const room = (k * pitch - copyH) / 2;
        el.style.setProperty("--foot-pad-x", px(room));
        el.style.setProperty("--foot-min", px(k * pitch));
        const now = copy.offsetHeight;
        if (Math.abs(now - copyH) < 0.5) break;
        if (now > copyH) least = Math.max(least, room);
        copyH = now;
      }
    });
    // and last each card's top on a row, in order: where the cards run
    // one under another (one column), each stands where those above it
    // have left it
    cards.forEach(({ slot }) => {
      const top = slot.getBoundingClientRect().top + window.scrollY;
      slot.style.setProperty("--snap-top", px(between(top, row) - top));
    });

    const now = cards.map(({ slot, el }) => [...SNAP.map((p) => slot.style.getPropertyValue(p)), ...SIZE.map((p) => el.style.getPropertyValue(p))].join()).join(";");
    if (now !== placed) gsap.delayedCall(0, () => ScrollTrigger.refresh());
    placed = now;
  }
  const unplaceCards = () => {
    placed = "";
    cards.forEach(({ slot, el }) => {
      SNAP.forEach((p) => slot.style.removeProperty(p));
      SIZE.forEach((p) => el.style.removeProperty(p));
      el.classList.remove("is--even");
    });
  };

  const cards = [...root.querySelectorAll("[data-approach-stack-slot]")].map((slot) => {
    const el = slot.querySelector("[data-step-card]");
    // each card's Hairline figure: Understand's (understand-figure.js),
    // or Diagnose's and Prioritise's (approach-figures.js); the same
    // start/hold/stop either way
    const schematic = mountUnderstandFigure(el.querySelector("[data-understand-figure]")) ?? mountApproachFigure(el.querySelector("[data-approach-figure]"));
    return { slot, el, schematic, started: false };
  });

  const mm = gsap.matchMedia();

  // rail and phone between them always match, so the setup always runs (GSAP
  // only calls it while at least one condition does).
  mm.add(
    {
      rail: "(min-width: 768px)",
      phone: "(max-width: 767px)",
      reduce: "(prefers-reduced-motion: reduce)",
      // the rail between the two columns of cards, where it can grow out
      // of the statement's dotted line before it
      led: "(min-width: 992px)",
    },
    (context) => {
      const { phone, reduce, led } = context.conditions;
      const cleanups = [];

      // No rail to set the field by (a phone, or reduced motion): the field
      // set out from the cards alone, its rows from its top, and the cards
      // set on it, on every refresh.
      if (phone || reduce) {
        const fit = ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onRefresh: () => placeField(null) });
        placeField(null);
        cleanups.push(() => fit.kill());
      }

      if (reduce) {
        cards.forEach((card) => card.schematic?.rest());
      } else {
        cards.forEach((card) => {
          // Drawn in the first time the card is well in view; after that it
          // runs while the card is on screen and holds while it is not.
          ScrollTrigger.create({
            trigger: card.slot,
            start: "top 85%",
            end: "bottom 15%",
            onToggle: (self) => {
              if (!card.schematic) return;
              if (self.isActive && !card.started) {
                card.started = true;
                card.schematic.start();
              } else {
                card.schematic.hold(!self.isActive);
              }
            },
          });

          // Entrance: each card rises into place as it comes up the screen.
          gsap.fromTo(card.el, { y: 48, opacity: 0 }, {
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: card.slot, start: "top bottom", end: "top 80%", scrub: true },
          });
        });

        if (!phone) cleanups.push(setUpRail(led && lead ? lead : null));
      }

      return () => {
        cleanups.forEach((fn) => fn());
        cards.forEach((card) => {
          card.started = false;
          card.schematic?.stop();
        });
      };
    }
  );

  // The rail: the dots moved against the scroll inside the window, and the
  // velocity trail out of the cube; led in, the rail first comes out of
  // the statement's dotted line as a snake (below). Returns its teardown.
  function setUpRail(lead) {
    if (!rail || !win) return () => {};
    const cube = win.querySelector(".approach-stack__cube");
    const snake = lead ? makeSnake(rail) : null;
    if (lead) root.classList.add("is--led");

    // The geometry, measured on each refresh rather than read every frame
    // (reading the boxes each frame forced a layout, straight after the
    // trail had resized): the rail's top and height on the page, the
    // window's sticky top and height, and, led in, the scroll at which the
    // statement's frame lets go (release), the line's box in the screen
    // then, how far it stands from the rail's centre line, and the snake's
    // path from it to the rail.
    let geo = null;
    const measure = () => {
      // the field's pitch first: the rail's dots, the snake's and the
      // statement's line all take it, and the rail stands on one of its
      // columns
      const fit = field ? fitColumns() : null;
      if (fit) snapRail(fit);
      if (fit && lead) snapLead(fit);
      // led in, the window as long as the statement's line, so the line,
      // the snake and the window are one length (approach-stack.css)
      if (lead) root.style.setProperty("--rail-win", px(parseFloat(getComputedStyle(lead).height)));
      const box = rail.getBoundingClientRect();
      geo = {
        top: box.top + window.scrollY,
        height: box.height,
        sticky: parseFloat(getComputedStyle(win).top) || 0,
        // to the sub-pixel: the snake lands the window's length exactly, and
        // a rounded height cut or added a dot at its ends (19rem is rarely a
        // whole number of pixels)
        win: win.getBoundingClientRect().height,
        pitch: fit?.pitch ?? 18,
      };
      if (lead) {
        // The line's box, to the sub-pixel, in its held frame. It draws in
        // scaled down from its top, which leaves its top and its middle
        // across where they are, so only its height is read off the layout.
        const line = lead.getBoundingClientRect();
        const frame = leadFrame.getBoundingClientRect();
        // where the frame is held (its sticky top): it takes hold as the
        // track's top reaches that, and lets go as the track's foot
        // reaches the frame's foot as held
        const held = parseFloat(getComputedStyle(leadFrame).top) || 0;
        geo.release = leadTrack.getBoundingClientRect().bottom + window.scrollY - leadFrame.offsetHeight - held;
        geo.hold = leadTrack.getBoundingClientRect().top + window.scrollY - held;
        // the line's top in the screen while held
        geo.lineTop = line.top - frame.top + held;
        geo.lineHeight = parseFloat(getComputedStyle(lead).height);
        geo.lineX = line.left + line.width / 2 - (box.left + box.width / 2);
        geo.morph = window.innerHeight * SNAKE.scroll;
        snake.draw(geo);
      }
      placeField(lead ? snake.origin : geo.top, fit);
      // the top edge of a row of the field's dots, on the page
      if (grid && field) geo.rowEdge = field.getBoundingClientRect().top + window.scrollY + grid.y - DOT / 2;
      // after the whole refresh, once the wall over the statement has been
      // set on the rows as they now stand (dot-snap.js, on the refresh event)
      if (lead) { gapCheck?.kill(); gapCheck = gsap.delayedCall(0, matchGap); }
      return geo;
    };

    // The room under the statement as it lets go, down to the first card,
    // made the room over it as it takes hold, up to what the section marks
    // as above it (data-statement-above, the logo wall), and --gap-more
    // besides (approach-stack.css, a section's step), so the statement
    // reads as closing what is above it and the steps start afresh.
    // The wall and the cards stand on the field's rows, so the two rooms
    // move in whole steps with the stack; within a step it is where the
    // statement's line starts over its text (--lead-nudge) that sets them:
    // the field's rows are counted from the line, so raising it moves the
    // rows, and with them the wall over the statement and the cards under
    // it, a pixel for a pixel, opening the room over it and closing the
    // room under it. So: the stack drawn up (--stack-pull) while they are
    // more than a step apart, then the line raised by half the difference
    // until they are equal (a row passing over the wall or a card jumps
    // them by a step, so the nearest it came is kept). Each change asks
    // for one more refresh, as the page under it has moved; sixteen at most
    // for a width (tries).
    let tries = { width: 0, count: 0, best: null };
    // --gap-more in pixels, whatever it is written in (a calc, rem), off a
    // hidden box as tall as it; read on refresh only
    const gapMore = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:var(--gap-more, 0px)";
      root.append(probe);
      const h = probe.getBoundingClientRect().height;
      probe.remove();
      return h;
    };
    let gapCheck = null;
    function matchGap() {
      const above = leadTrack.closest('[data-sticky-title="wrap"]')?.querySelector("[data-statement-above]");
      const heading = leadFrame.querySelector('[data-sticky-title="heading"]');
      const first = cards?.[0]?.slot;
      if (!above || !heading || !first) return;
      const page = (r) => r + window.scrollY;
      const frame = leadFrame.getBoundingClientRect();
      const text = heading.getBoundingClientRect();
      const held = parseFloat(getComputedStyle(leadFrame).top) || 0;
      // the frame stands at the track's top until it is held
      const over = page(leadTrack.getBoundingClientRect().top) + (text.top - frame.top) - page(above.getBoundingClientRect().bottom);
      const under = page(first.getBoundingClientRect().top) - (geo.release + held + (text.bottom - frame.top));
      geo.gaps = { over, under };
      const off = under - (over + gapMore());
      const pull = parseFloat(root.style.getPropertyValue("--stack-pull")) || 0;
      const nudge = parseFloat(lead.style.getPropertyValue("--lead-nudge")) || 0;
      const step = geo.pitch;
      if (tries.width !== window.innerWidth) tries = { width: window.innerWidth, count: 0, best: null, seen: [] };
      if (!tries.best || Math.abs(off) < Math.abs(tries.best.off)) tries.best = { off, pull, nudge };
      if (Math.abs(off) < 0.25) return;
      const set = (p, n) => {
        root.style.setProperty("--stack-pull", px(p));
        lead.style.setProperty("--lead-nudge", px(n));
        gsap.delayedCall(0, () => ScrollTrigger.refresh());
      };
      // out of tries, the nearest it came
      if (++tries.count > 16) {
        const { best } = tries;
        if (best.pull !== pull || best.nudge !== nudge) set(best.pull, best.nudge);
        return;
      }
      // more than a step out: the stack drawn up by the difference (and
      // the line's tries start again)
      if (Math.abs(off) > step && !tries.seen.length) return set(pull + off, nudge);
      // within it: the line tried at eight places across a step (a step
      // more is the same rows again), then, between two that the rooms
      // cross between (the room under it larger at one, smaller at the
      // next, by less than a step: no row jumped between them), the place
      // they would cross, and again from there
      tries.seen.push({ n: nudge, off });
      if (tries.seen.length < 8) return set(pull, (tries.seen.length * step) / 8);
      const seen = [...tries.seen].sort((a, b) => a.n - b.n);
      let pair = null;
      seen.forEach((a, i) => {
        const b = seen[(i + 1) % seen.length];
        const span = i + 1 < seen.length ? b.n - a.n : b.n + step - a.n;
        if (a.off > 0 && b.off < 0 && a.off - b.off < step && span > 0) {
          const near = Math.min(Math.abs(a.off), Math.abs(b.off));
          if (!pair || near < pair.near) pair = { a, span, near, k: a.off / (a.off - b.off) };
        }
      });
      if (!pair) return set(tries.best.pull, tries.best.nudge);
      set(pull, gsap.utils.wrap(0, step, pair.a.n + pair.k * pair.span));
    }
    measure();

    // Where the dots stand in the window: fixed to the page, so they run
    // past the cube as the page scrolls; the window's top in the screen
    // follows from the scroll, as it is sticky. Led in, they carry on the
    // snake's dots, which are fixed to its path, so the hand-over is dot
    // for dot (snake.origin).
    const syncDots = (scroll) => {
      if (!geo) return;
      const winTop = Math.min(Math.max(geo.sticky, geo.top - scroll), geo.top + geo.height - geo.win - scroll);
      const origin = lead ? snake.origin : geo.top;
      dots.style.setProperty("--rail-y", `${(origin - scroll - winTop).toFixed(3)}px`);
    };
    // The statement's line's dots on the field's rows: the frame is held
    // while the page runs on under it, so its dots run with the page (a
    // transform of the line's dots, -pitch to 0), from where the frame is
    // held to the release; before it the frame moves with the page.
    const leadDots = lead?.querySelector(".sticky-title__rule-dots") ?? null;
    // Where the band's dots are held still with the frame (sticky-title.js,
    // data-sticky-title-still), the line's dots stand with them: with the
    // page up to where the hold begins (the section's dotsHeldFrom), still
    // from there, which is where the release has them too (the hold is a
    // whole number of pitches, sticky-title.css).
    const leadWrap = leadTrack?.closest('[data-sticky-title="wrap"]') ?? null;
    const heldDots = !!leadWrap?.hasAttribute("data-sticky-title-still");
    const syncLead = (scroll) => {
      if (!geo || !leadDots || !grid) return;
      const upTo = heldDots ? Math.min(geo.release, leadWrap.dotsHeldFrom ?? geo.release) : geo.release;
      const at = Math.min(Math.max(scroll, geo.hold), upTo) + geo.lineTop;
      const shift = (((geo.rowEdge - at) % grid.pitch) + grid.pitch) % grid.pitch - grid.pitch;
      leadDots.style.transform = `translate3d(0, ${shift.toFixed(3)}px, 0)`;
      // the statement's progress lights the line's dots (sticky-title.js)
      lead.leadShift = shift;
      lead.leadLight?.();
    };
    if (lead) {
      ScrollTrigger.create({
        trigger: leadTrack,
        start: "top bottom",
        end: () => geo.release,
        onUpdate: (self) => syncLead(self.scroll()),
        onRefresh: (self) => syncLead(self.scroll()),
      });
    }
    ScrollTrigger.create({
      trigger: rail,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => syncDots(self.scroll()),
      onRefresh(self) {
        measure();
        syncDots(self.scroll());
      },
    });

    let morph = null;
    if (lead) {
      // Which of the three shows: the statement's line up to the release,
      // then the snake, then, once it has run into the rail, the rail's own
      // dots. The window (held at the middle of the screen under all of it)
      // shows from the release, for its cube and faded ends to come in.
      const state = { released: false, landed: false };
      const show = () => {
        lead.style.visibility = state.released ? "hidden" : "";
        win.style.visibility = state.released ? "" : "hidden";
        snake.el.style.visibility = state.released && !state.landed ? "visible" : "";
        dots.style.visibility = state.landed ? "" : "hidden";
      };
      show();
      ScrollTrigger.create({
        start: () => geo.release,
        end: "max",
        onToggle: (self) => { state.released = self.isActive; show(); },
      });
      ScrollTrigger.create({
        start: () => geo.release + geo.morph,
        end: "max",
        onToggle: (self) => { state.landed = self.isActive; show(); },
      });

      // Over the morph's scroll the snake runs along its path, straight off
      // the scroll (no smoothing: it must meet the line and the window
      // exactly at either end).
      ScrollTrigger.create({
        start: () => geo.release,
        end: () => geo.release + geo.morph,
        onUpdate: (self) => snake.at(self.scroll() - geo.release, geo),
        onRefresh: (self) => snake.at(self.scroll() - geo.release, geo),
      });
      // The window keeps the snake's hard ends (no fade, led in: the line
      // looks the same all the way). The mark comes up on it gently, from
      // part way along the snake's run (SNAKE.cubeFrom) to a little after
      // the landing (SNAKE.settleScroll): faded in as it grows from a
      // little under its size, eased out with no overshoot.
      win.style.setProperty("--rail-ends", "0");
      morph = gsap.timeline({
        scrollTrigger: {
          start: () => geo.release + geo.morph * SNAKE.cubeFrom,
          end: () => geo.release + geo.morph + window.innerHeight * SNAKE.settleScroll,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      morph.fromTo(cube, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }, 0);
    } else {
      gsap.fromTo(rail, { opacity: 0 }, {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: rail, start: "top 80%", end: "top 50%", scrub: true },
      });
    }

    const trail = { top: 0, bottom: 0 };
    // Scaled rather than resized (approach-stack.css), so the trail never
    // costs a layout: each line stands half the window tall at full scale.
    const apply = () => {
      trailEls.top.style.transform = `scaleY(${trail.top / 100})`;
      trailEls.bottom.style.transform = `scaleY(${trail.bottom / 100})`;
    };
    // the two lengths eased to their new values on every frame of the
    // scroll: one tween each, retargeted, rather than a new tween a frame
    const easeTop = gsap.quickTo(trail, "top", { duration: 0.3, ease: "power2.out", onUpdate: apply });
    const easeBottom = gsap.quickTo(trail, "bottom", { duration: 0.3, ease: "power2.out", onUpdate: apply });
    // The mark on the rail is the logo's triangle. It comes up pointing up,
    // and from then on points the way the page is going: down the moment
    // the scroll goes down, up the moment it turns up, and back. Only a
    // scroll fast enough to draw a trail turns it, so a trackpad's jitter
    // at rest never does; the turn swings through the right, the way the
    // logo's forms point.
    let heading = -1;
    const turnMark = (dir) => {
      if (!mark || dir === heading) return;
      heading = dir;
      gsap.to(mark, { rotation: dir > 0 ? 90 : -90, duration: 0.6, ease: "power3.inOut", overwrite: true });
    };
    if (mark) gsap.set(mark, { rotation: -90 });

    // The trail drawn back in once the scroll rests, by the same two eased
    // tweens that draw it out, retargeted to nothing. (It used to kill every
    // tween on the trail and start one of its own, which killed those two
    // as well: the trail worked until the first rest, then never again.)
    let idle = 0;
    const resetTrail = () => {
      clearTimeout(idle);
      easeTop(0);
      easeBottom(0);
    };

    // From the moment the window settles at the middle of the viewport to
    // the moment it leaves the bottom of the rail. Measured off the rail:
    // the window is sticky, so where it sits depends on the scroll.
    // Led in, from the moment the mark starts to come up on the window
    // (SNAKE.cubeFrom), so it points the way the page is going as soon as
    // it can be seen.
    const half = () => win.offsetHeight / 2;
    ScrollTrigger.create({
      trigger: rail,
      start: () => (lead ? geo.release + geo.morph * SNAKE.cubeFrom : `top center-=${half()}`),
      end: () => `bottom center+=${half()}`,
      invalidateOnRefresh: true,
      onUpdate(self) {
        // Lenis reports px per frame; ScrollTrigger px per second.
        const velocity = lenis ? lenis.velocity : self.getVelocity() / 60;
        const speed = Math.abs(velocity);
        const damp = self.progress > TRAIL.fadeFrom
          ? gsap.utils.mapRange(TRAIL.fadeFrom, 1, 1, 0, self.progress)
          : 1;
        const length = speed > TRAIL.minSpeed ? Math.min(TRAIL.gain * speed * damp, TRAIL.max * damp) : 0;
        if (speed > TRAIL.minSpeed) turnMark(Math.sign(velocity));
        // Scrolling down, the line trails above the cube; up, below it.
        easeTop(velocity > 0 ? length : 0);
        easeBottom(velocity > 0 ? 0 : length);
        clearTimeout(idle);
        idle = setTimeout(() => resetTrail(), TRAIL.idle);
      },
      onToggle(self) {
        if (!self.isActive) resetTrail();
      },
    });

    return () => {
      clearTimeout(idle);
      gapCheck?.kill();
      gsap.killTweensOf(trail);
      trailEls.top.style.transform = trailEls.bottom.style.transform = "";
      if (mark) {
        gsap.killTweensOf(mark);
        gsap.set(mark, { clearProps: "transform" });
      }
      dots.style.removeProperty("--rail-y");
      rail.style.removeProperty("--rail-snap");
      root.style.removeProperty("--stack-pull");
      root.style.removeProperty("--rail-win");
      if (lead) {
        morph.scrollTrigger?.kill();
        morph.kill();
        gsap.set([dots, win, cube], { clearProps: "all" });
        snake.el.remove();
        lead.style.visibility = "";
        lead.style.removeProperty("--lead-snap");
        lead.style.removeProperty("--lead-nudge");
        if (leadDots) leadDots.style.transform = "";
        delete lead.leadShift;
        root.classList.remove("is--led");
      }
    };
  }

  return {
    destroy() {
      mm.revert();
      unplaceCards();
      unplaceField();
      cards.forEach((card) => card.schematic?.destroy());
    },
  };
}


/* The snake: the statement's dotted line running into the rail.

   A path fixed to the page, in the rail's own coordinates (from its top,
   about its centre line): down the statement's line, then over to the
   rail in steps, square ones only, down and across and down again, then
   on down the rail. Its dots are drawn along the whole path and fixed to
   it, and only a stretch of it shows, through a mask: the snake, which
   slides along the path as the page scrolls, its body following its head
   round each corner.

   It is one line from end to end: the same length (the statement's
   line's, which the window is made too), the same dots in the same white
   (--stack-dot, as the line's lit dots and the window's). Where it is
   (at) is worked out so it joins on at both ends with nothing changing
   but its place: at the release it is the statement's line exactly and
   sets off from rest with its words, and it arrives as the window
   stands, held at the middle of the screen, running down the path as
   fast as the page goes up, so the window takes over dot for dot
   (origin, the page position the rail's dots are counted from), hard
   ends to hard ends. Between, a cubic eases it from the one speed to the
   other, and its ends stand in the gaps between dots, so a dot comes on
   whole at the head as one goes at the tail, never sliced. */
const SNAKE = {
  // the scroll it runs over, in screens
  scroll: 1,
  // how many steps across it takes to the rail, each the same width
  steps: 1,
  // how far under the statement's line it turns across, in the field's
  // steps: straight away, in the room over the first card, so it never
  // runs behind it; the rest of the way it drops down the rail's line,
  // between the cards
  turn: 2,
  // the share of the run at either end over which its ends ease from the
  // true ends to the gaps between dots
  settle: 0.12,
  // the mark comes up from this share of the run, as the snake's head
  // reaches the window's middle (never ahead of the line), and is whole this
  // much scroll after the landing, in screens
  cubeFrom: 0.8,
  settleScroll: 0.1,
};

// A cubic from 0 to 1 over k, setting off at speed a and arriving at speed
// b (speeds against an even run, 1); in range for speeds up to 3.
function ease(k, a, b) {
  return (k * k * k - 2 * k * k + k) * a + (3 * k * k - 2 * k * k * k) + (k * k * k - k * k) * b;
}

function makeSnake(rail) {
  const NS = "http://www.w3.org/2000/svg";
  const id = `approach-snake-${Math.random().toString(36).slice(2, 8)}`;
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("class", "approach-stack__snake");
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-10000" y="-10000" width="20000" height="200000">` +
    `<path fill="none" stroke="#fff" stroke-width="8"/></mask></defs>` +
    `<path fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 16" mask="url(#${id})"/>`;
  const reach = el.querySelector("mask path");
  const dots = el.querySelector(":scope > path");
  rail.prepend(el);

  // the length of the path from the line's top to where it meets the rail
  let into = 0;
  const snake = {
    el,
    dots,
    origin: 0,
    draw(geo) {
      // nothing to draw from until the page has a layout (a zero-sized
      // or hidden viewport reads the line's height as "auto")
      if (![geo.lineX, geo.release, geo.lineTop, geo.lineHeight, geo.morph].every(Number.isFinite)) return;
      const x0 = geo.lineX;
      const top = geo.release + geo.lineTop - geo.top;
      const bottom = top + geo.lineHeight;
      // where the window's top stands on the page once the snake is in
      const land = geo.release + geo.morph + geo.sticky - geo.top;
      const drop = Math.max(1, land - bottom);

      // Square steps: the first run across just under the line (SNAKE.turn),
      // any after it evenly down what is left, and the last drop landing
      // on the rail where the window stands.
      const first = Math.min(SNAKE.turn * geo.pitch, drop / 2);
      const rise = SNAKE.steps > 1 ? (drop - first) / SNAKE.steps : 0;
      const points = [[x0, top], [x0, bottom]];
      for (let i = 1; i <= SNAKE.steps; i++) {
        // each run across on a row of the field's dots: a whole number of
        // steps down the path from the line's top (whose dots are the
        // field's), so its dots fall on the field's columns; half a dot
        // down, as the stroke is centred on the path and a row is counted
        // from its dots' top edge
        const want = bottom + first + (i - 1) * rise;
        const y = top + Math.round((want - top) / geo.pitch) * geo.pitch + 1;
        points.push([x0 * (1 - (i - 1) / SNAKE.steps), y], [x0 * (1 - i / SNAKE.steps), y]);
      }
      points.push([0, land]);
      into = 0;
      for (let i = 1; i < points.length; i++) {
        into += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      }
      points.push([0, land + geo.win * 2]);
      const d = "M" + points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L");
      dots.setAttribute("d", d);
      reach.setAttribute("d", d);
      // 2px dots on the field's pitch, as the rail's
      dots.setAttribute("stroke-dasharray", `2 ${(geo.pitch - 2).toFixed(3)}`);
      snake.origin = geo.top + land - into;
    },
    // the snake's two ends q px of scroll after the release, as lengths
    // along the path from the line's top
    at(q, geo) {
      const run = geo.morph;
      const k = gsap.utils.clamp(0, 1, q / run);
      const p = geo.pitch;
      // One length all the way: the line's, which the window is made too
      // (--rail-win). The tail runs from the line's top (at rest on the
      // page, so the line sets off with its words) to the window's top,
      // arriving at the page's speed (a px of path a px of scroll).
      let tail = into * ease(k, 0, Math.min(3, run / into));
      let length = geo.lineHeight;
      // On the way, the tail in a gap between dots and the length a whole
      // number of them, so the same dots show the whole way, each coming
      // on whole at the head as one goes at the tail; eased back to the
      // true ends over the first and last stretch, where the line's and
      // the window's boxes are.
      const gap = (v) => Math.round((v - p / 2 - 1) / p) * p + p / 2 + 1;
      const w = gsap.utils.clamp(0, 1, Math.min(k, 1 - k) / SNAKE.settle);
      tail += (gap(tail) - tail) * w;
      length += (Math.max(1, Math.round(length / p)) * p - length) * w;
      reach.style.strokeDasharray = `${length.toFixed(2)} 1000000`;
      reach.style.strokeDashoffset = `${(-tail).toFixed(2)}`;
    },
  };
  return snake;
}
