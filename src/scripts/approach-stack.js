/* ============================================================
   Approach stack — the homepage's three steps on a scroll-driven
   timeline (src/components/ApproachStack.astro)
   ------------------------------------------------------------
   Built on the supplied Scroll-driven Stack Timeline spec, adapted
   to three cards and to this site. The cards are always open, each
   with its step drawn as a live schematic, and the scroll drives
   the rest:

     - each card rises into place as it comes up the screen, and its
       schematic draws in the first time the card is properly in
       view, then loops while the card is on screen and pauses while
       it is not;
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

import { boxFaces, floorLines, projector } from "./iso.js";
import { mountDotFlicker } from "./dot-field.js";

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
  // card's sides where the grid puts them. The pitch fits a whole number
  // of steps across the first card, near 1.125rem (the 18px the field was
  // drawn on, at the ideal width, so it scales with the page as the grid
  // does and the count holds at every width in a range); for each count
  // either side of the nearest, one pitch and one offset are fitted to
  // all the lines at once (least squares), and the count that leaves no
  // line further off midway wins, the nearest on a tie. Every line then
  // runs midway between two columns to a fraction of a pixel. Returns the
  // pitch and one of those midway lines, in the field's own box.
  function fitColumns() {
    const box = field.getBoundingClientRect();
    const lines = cards.flatMap(({ slot }) => {
      const r = slot.getBoundingClientRect();
      return [r.left - box.left, r.right - box.left];
    });
    const [a, b] = lines;
    const target = 1.125 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const nearest = Math.max(1, Math.round((b - a) / target));
    const fit = (count) => {
      const rough = (b - a) / count;
      const ks = lines.map((v) => Math.round((v - a) / rough));
      const n = lines.length;
      const sum = (f) => lines.reduce((s, v, i) => s + f(v, ks[i]), 0);
      const sk = sum((_, k) => k);
      const sv = sum((v) => v);
      const skk = sum((_, k) => k * k);
      const skv = sum((v, k) => k * v);
      const pitch = (n * skv - sk * sv) / (n * skk - sk * sk) || rough;
      const line = (sv - pitch * sk) / n;
      const off = Math.max(...lines.map((v, i) => Math.abs(v - line - ks[i] * pitch)));
      return { pitch, line, off };
    };
    return [nearest - 1, nearest + 1]
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
    fieldDots?.style.setProperty("--dot-x", px(grid.x));
    fieldDots?.style.setProperty("--dot-y", px(grid.y));
    placeCards();
  };
  const unplaceField = () => {
    grid = null;
    band.style.removeProperty("--dot-pitch");
    fieldDots?.style.removeProperty("--dot-x");
    fieldDots?.style.removeProperty("--dot-y");
  };

  // The rail on the field: from the line the stylesheet gives it (the
  // left edge of Grid Column 7 from 992px, where a column of dots already
  // stands, or the middle of Grid Column 1 below), moved across onto the
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
  const SIZE = ["--card-top", "--card-pad", "--media-pad", "--foot-min"];
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
      drawing: el.querySelector("[data-schematic]")?.getBoundingClientRect().height ?? 0,
      foot: el.querySelector(".step-card__foot").offsetHeight,
    }));
    cards.forEach(({ el }, i) => {
      const { media, drawing, foot } = blocks[i];
      el.style.setProperty("--media-pad", px((steps(media) - drawing) / 2));
      el.style.setProperty("--foot-min", px(Math.ceil(foot / pitch) * pitch));
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
    });
  };

  // A dot of the field to light, as the top-left of its square in the
  // field's own coordinates: on the screen, away from its edges, never
  // beside the rail or under a card. Set to the device pixel, as the
  // field's own dots are.
  const pickFieldDot = () => {
    if (!grid) return null;
    const box = field.getBoundingClientRect();
    const { pitch } = grid;
    const wrap = (n) => ((n % pitch) + pitch) % pitch;
    const lo = Math.max(0, window.innerHeight * 0.1 - box.top);
    const hi = Math.min(box.height, window.innerHeight * 0.9 - box.top);
    const first = lo + wrap(grid.y - lo);
    const rows = Math.floor((hi - first) / pitch) + 1;
    const x0 = wrap(grid.x) + pitch;
    const columns = Math.floor((box.width - x0 - pitch / 2) / pitch);
    if (rows < 1 || columns < 1) return null;
    const line = rail && rail.offsetParent ? rail.getBoundingClientRect() : null;
    const railX = line ? line.left + line.width / 2 : null;
    const covers = cards.map((card) => card.el.getBoundingClientRect());
    const dpr = window.devicePixelRatio || 1;
    const snap = (v) => Math.round(v * dpr) / dpr;
    for (let tries = 0; tries < 8; tries++) {
      const x = x0 + gsap.utils.random(0, columns - 1, 1) * pitch;
      const y = first + gsap.utils.random(0, rows - 1, 1) * pitch;
      const sx = box.left + x;
      const sy = box.top + y;
      if (railX !== null && Math.abs(sx - railX) < pitch) continue;
      if (covers.some((r) => sx > r.left - 8 && sx < r.right + 8 && sy > r.top - 8 && sy < r.bottom + 8)) continue;
      return { x: snap(x - DOT / 2), y: snap(y - DOT / 2) };
    }
    return null;
  };

  const cards = [...root.querySelectorAll("[data-approach-stack-slot]")].map((slot) => {
    const el = slot.querySelector("[data-step-card]");
    return { slot, el, schematic: mountSchematic(el.querySelector("[data-schematic]")), started: false };
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

        // the odd dot of the field lighting red (dot-field.js)
        if (field) {
          const flicker = mountDotFlicker(field, { pick: pickFieldDot });
          cleanups.push(() => flicker.destroy());
        }
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
      const box = rail.getBoundingClientRect();
      geo = {
        top: box.top + window.scrollY,
        height: box.height,
        sticky: parseFloat(getComputedStyle(win).top) || 0,
        win: win.offsetHeight,
        pitch: fit?.pitch ?? 18,
      };
      if (lead) {
        // The line's box, to the sub-pixel, in its held frame. It draws in
        // scaled down from its top, which leaves its top and its middle
        // across where they are, so only its height is read off the layout.
        const line = lead.getBoundingClientRect();
        const frame = leadFrame.getBoundingClientRect();
        geo.release = leadTrack.getBoundingClientRect().bottom + window.scrollY - leadFrame.offsetHeight;
        geo.lineTop = line.top - frame.top;
        geo.lineHeight = parseFloat(getComputedStyle(lead).height);
        geo.lineX = line.left + line.width / 2 - (box.left + box.width / 2);
        geo.morph = window.innerHeight * SNAKE.scroll;
        snake.draw(geo);
      }
      placeField(lead ? snake.origin : geo.top, fit);
      return geo;
    };
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

      // Over the morph's scroll the snake runs along its path, its dots
      // brighten to the rail's, the window's ends fade into the band and
      // the cube comes up.
      morph = gsap.timeline({
        scrollTrigger: {
          start: () => geo.release,
          end: () => geo.release + geo.morph,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => snake.at(self.scroll() - geo.release, geo),
          onRefresh: (self) => snake.at(self.scroll() - geo.release, geo),
        },
      });
      morph
        .fromTo(snake.dots, { attr: { "stroke-opacity": 0.3 } }, { attr: { "stroke-opacity": 0.55 }, duration: 0.7, ease: "none" }, 0.15)
        .fromTo(win, { "--rail-ends": 0 }, { "--rail-ends": 1, duration: 0.2, ease: "none" }, 0.8)
        .fromTo(cube, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, 0.7);
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
    // The mark on the rail is the logo's triangle, pointing the way the page
    // is going: down to start with, turned up the moment the scroll turns
    // up, and back. Only a scroll fast enough to draw a trail turns it, so a
    // trackpad's jitter at rest never does; the turn swings through the
    // right, the way the logo's forms point.
    let heading = 1;
    const turnMark = (dir) => {
      if (!mark || dir === heading) return;
      heading = dir;
      gsap.to(mark, { rotation: dir > 0 ? 90 : -90, duration: 0.6, ease: "power3.inOut", overwrite: true });
    };
    if (mark) gsap.set(mark, { rotation: 90 });

    let idle = 0;
    const resetTrail = (smooth) => {
      clearTimeout(idle);
      gsap.killTweensOf(trail);
      gsap.to(trail, { top: 0, bottom: 0, duration: smooth ? 0.6 : 0, ease: "none", onUpdate: apply });
    };

    // From the moment the window settles at the middle of the viewport to
    // the moment it leaves the bottom of the rail. Measured off the rail:
    // the window is sticky, so where it sits depends on the scroll.
    // Led in, from the end of the morph, once the cube is up.
    const half = () => win.offsetHeight / 2;
    ScrollTrigger.create({
      trigger: rail,
      start: () => (lead ? geo.release + geo.morph : `top center-=${half()}`),
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
        idle = setTimeout(() => resetTrail(true), TRAIL.idle);
      },
      onToggle(self) {
        if (!self.isActive) resetTrail(true);
      },
    });

    return () => {
      clearTimeout(idle);
      gsap.killTweensOf(trail);
      trailEls.top.style.transform = trailEls.bottom.style.transform = "";
      if (mark) {
        gsap.killTweensOf(mark);
        gsap.set(mark, { clearProps: "transform" });
      }
      dots.style.removeProperty("--rail-y");
      rail.style.removeProperty("--rail-snap");
      if (lead) {
        morph.scrollTrigger?.kill();
        morph.kill();
        gsap.set([dots, win, cube], { clearProps: "all" });
        snake.el.remove();
        lead.style.visibility = "";
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


/* ============================================================
   Schematics — the step drawn in each card's panel
   ============================================================
   Small flat drawings, each one paused
   GSAP timeline: a draw-in, then a light loop with no end. start()
   plays it from the top, stop() takes it back to the undrawn state
   (when a breakpoint change sets the stack up again), rest() shows
   a representative frame and holds it (reduced motion), hold()
   pauses and resumes it while it runs. Every element starts from
   a state set here, so seeking back to 0 always returns the
   drawing to blank. The loops are slow and few: one signal at a
   time, in the site's red, on hairlines that otherwise hold still.
   ============================================================ */
/* The snake: the statement's dotted line running into the rail.

   A path fixed to the page, in the rail's own coordinates (from its top,
   about its centre line): down the statement's line, then over to the
   rail in steps, square ones only, down and across and down again, then
   on down the rail. Its dots are drawn along the whole path and fixed to
   it, and only a stretch of it shows, through a mask: the snake, which
   slides along the path as the page scrolls, its body following its head
   round each corner, and closes in from the line's length to the
   window's on the way.

   How far along it is (at) is worked out so it joins on at both ends: it
   leaves as the line stood, still on the screen while the statement
   scrolls away (moving down its path as fast as the page goes up), and
   it arrives as the window stands, held at the middle of the screen with
   its dots running with the page, so the rail takes over dot for dot
   (origin, the page position the rail's dots are counted from). In
   between it runs the extra length of the way, on an S-curve. */
const SNAKE = {
  // the scroll it runs over, in screens
  scroll: 1,
  // how many steps across it takes to the rail, each the same width, the
  // drop between them the same height
  steps: 1,
};

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

      // Square steps: an even drop, then an even run across, and so on,
      // the last drop landing on the rail where the window stands.
      const rise = drop / (SNAKE.steps + 1);
      const points = [[x0, top], [x0, bottom]];
      let y = bottom;
      for (let i = 1; i <= SNAKE.steps; i++) {
        y += rise;
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
    // the snake's place q px of scroll after the release
    at(q, geo) {
      const run = geo.morph;
      const k = gsap.utils.clamp(0, 1, q / run);
      const s = k * k * (3 - 2 * k);
      const start = k * run + (into - run) * s;
      const length = geo.lineHeight + (geo.win - geo.lineHeight) * s;
      reach.style.strokeDasharray = `${length} 1000000`;
      reach.style.strokeDashoffset = `${-start}`;
    },
  };
  return snake;
}

function mountSchematic(svg) {
  const build = svg && SCHEMATICS[svg.dataset.schematic];
  if (!build) return null;

  const css = getComputedStyle(svg);
  const colors = {
    red: css.getPropertyValue("--c-red").trim() || "#c40000",
  };
  const parts = (name) => [...svg.querySelectorAll(`[data-s="${name}"]`)];
  const tl = build(parts, colors, svg);
  let running = false;

  return {
    start() {
      running = true;
      tl.restart();
    },
    stop() {
      running = false;
      tl.pause(0);
    },
    rest() {
      running = false;
      tl.pause("rest");
    },
    hold(paused) {
      if (running) tl.paused(paused);
    },
    destroy() {
      tl.kill();
    },
  };
}

// The stylesheet's own fill or stroke for a face, so a tween can hand it
// back exactly.
const paint = (el, prop) => getComputedStyle(el)[prop];

const SCHEMATICS = {
  // Understand — the practice in plan, four rooms: work, tools,
  // information, decisions. The setting-out, the floor and its rooms come
  // in, then the route work actually takes draws in, the long way round
  // the rooms, and the block in each appears; then a red signal runs the
  // route, each block's edges catching it as it passes, while the dashed
  // line straight from the first room to the last shows the way it was
  // meant to go.
  map(parts, colors) {
    const [ground] = parts("ground");
    const plates = parts("plate");
    const [intended] = parts("intended");
    const [route] = parts("route");
    const [pulse] = parts("pulse");
    const nodes = parts("node");
    const stroke = paint(nodes[0], "stroke");

    gsap.set([ground, intended, ...nodes], { opacity: 0 });
    gsap.set(plates, { opacity: 0, y: 6 });
    gsap.set(nodes, { scale: 0.6, transformOrigin: "50% 50%" });
    // unrounded (autoRound: false): the route and the pulse are measured in
    // shares of their own length (pathLength="1"), which whole pixels would
    // only ever jump from end to end
    gsap.set(route, { strokeDasharray: "1 1", strokeDashoffset: 1, autoRound: false });

    const tl = gsap.timeline({ paused: true });
    tl.to(ground, { opacity: 1, duration: 0.5, ease: "none" }, 0.1)
      .to(plates, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 }, 0.15)
      .to(route, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut", autoRound: false }, 0.6)
      .to(nodes, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out", stagger: 0.12 }, 0.7)
      .to(intended, { opacity: 1, duration: 0.5, ease: "none" }, 1.5);
    tl.add("rest", 2);

    // The pulse's head runs 0 → 1.08 of the route as its offset runs from
    // the dash's length to -1, so a cube at share s of the route is reached
    // at s / 1.08 of the run.
    const travel = 3.2;
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    loop.fromTo(pulse, { strokeDashoffset: 0.08 }, { strokeDashoffset: -1, duration: travel, ease: "none", immediateRender: false, autoRound: false }, 0);
    nodes.forEach((node) => {
      const at = (parseFloat(node.dataset.at) / 1.08) * travel;
      loop.to(node, { stroke: colors.red, duration: 0.12, ease: "none" }, at)
        .to(node, { stroke, duration: 0.9, ease: "power1.in" }, at + 0.3);
    });
    tl.add(loop, "rest");
    return tl;
  },

  // Diagnose — the practice as a stack of slabs. A scan runs down through
  // them one by one until it reaches the slab the trouble starts in, whose
  // edges turn red, while the slabs above lift off it and four red
  // chevrons close in on its corners; then it all settles for the next pass.
  trace(parts, colors, svg) {
    const cause = Number(svg.dataset.cause);
    const [ground] = parts("ground");
    // listed in the markup bottom first, so each hides what is under it
    const layers = parts("layer").sort((a, b) => a.dataset.i - b.dataset.i);
    const [marker] = parts("marker");
    const [ping] = parts("ping");
    const above = layers.slice(0, cause);
    const line = paint(layers[0], "stroke");
    const bright = "rgba(255, 255, 255, 0.95)";

    gsap.set(ground, { opacity: 0 });
    gsap.set(layers, { opacity: 0, y: 8 });
    gsap.set(marker, { opacity: 0, scale: 1.25, transformOrigin: "50% 50%" });
    gsap.set(ping, { opacity: 0, transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ paused: true });
    // the setting-out, then the stack built from the ground up
    tl.to(ground, { opacity: 1, duration: 0.5, ease: "none" }, 0.05)
      .to(layers, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: { each: 0.08, from: "end" } }, 0.1);
    const introEnd = 0.9;

    const loop = gsap.timeline({ repeat: -1 });
    // the scan, top down: each slab it passes brightens and lets go, until
    // the cause, which turns red and holds
    for (let i = 0; i < cause; i++) {
      loop.to(layers[i], { stroke: bright, duration: 0.12, ease: "none" }, i * 0.22)
        .to(layers[i], { stroke: line, duration: 0.5, ease: "power1.in" }, i * 0.22 + 0.2);
    }
    const found = cause * 0.22;
    loop.to(layers[cause], { stroke: colors.red, duration: 0.15, ease: "none" }, found);
    // the slabs above lift off it, opening it up
    const open = found + 0.3;
    loop.to(above, { y: -12, duration: 0.8, ease: "power3.inOut", stagger: 0.05 }, open);
    const shown = open + 0.4;
    loop.to(marker, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, shown)
      .fromTo(ping, { scale: 1, opacity: 0.9 }, { scale: 1.3, opacity: 0, duration: 1.1, ease: "power2.out", immediateRender: false }, shown + 0.15);
    // a beat to read it, then everything settles back
    const close = shown + 1.8;
    loop.to(marker, { opacity: 0, scale: 1.15, duration: 0.35, ease: "power1.in" }, close)
      .to(above, { y: 0, duration: 0.8, ease: "power3.inOut", stagger: { each: 0.05, from: "end" } }, close + 0.15)
      .to(layers[cause], { stroke: line, duration: 0.6, ease: "none" }, close + 0.6);
    loop.set({}, {}, close + 2);

    tl.add(loop, introEnd);
    // found and opened, the chevrons on it
    tl.add("rest", introEnd + shown + 0.5);
    return tl;
  },

  // Prioritise — the findings as a massing model, nine blocks on a three
  // by three grid. They rise into a ranking and the tallest, what should
  // change first, is drawn in red; then the figures move, the blocks find
  // their new heights and the red passes to whichever now leads, the last
  // set coming back to the first, which mirrors about the card's middle.
  // Each block is redrawn from its height on every frame of a change, from
  // the projection the page drew it with (src/scripts/iso.js).
  rank(parts, colors, svg) {
    const [base] = parts("base");
    const [ox, oy] = svg.dataset.origin.split(",").map(Number);
    const P = projector(ox, oy);
    const size = Number(svg.dataset.size);
    // the towers stand on the plinth, their floor lines every so far up
    const plinth = Number(svg.dataset.plinth) || 0;
    const floor = Number(svg.dataset.floor) || 12;
    // in the markup back to front; here by their place on the grid, which
    // the figures below are listed in (row by row)
    const bars = parts("bar").sort((a, b) => a.dataset.k - b.dataset.k);
    // the stylesheet marks the resting leader; from here the script does
    bars.forEach((bar) => bar.classList.remove("is--first"));
    const stroke = paint(bars[0], "stroke");
    const blocks = bars.map((bar) => ({
      bar,
      x0: Number(bar.dataset.x0),
      y0: Number(bar.dataset.y0),
      h: 0,
      faces: Object.fromEntries([...bar.querySelectorAll("[data-face]")].map((face) => [face.dataset.face, face])),
    }));
    const draw = (block) => {
      const f = boxFaces(P, block.x0, block.y0, plinth, size, size, block.h);
      block.faces.floors.setAttribute("d", floorLines(P, block.x0, block.y0, plinth, size, size, block.h, floor));
      block.faces.top.setAttribute("d", f.top);
      block.faces.left.setAttribute("d", f.left);
      block.faces.right.setAttribute("d", f.right);
    };
    const grow = (block, h, vars) => ({ h, onUpdate: () => draw(block), ...vars });
    // heights by row then column; the first mirrors about the card's
    // middle with the tallest in the centre, and the loop comes back to it
    const sets = [
      [36, 52, 28, 52, 84, 44, 28, 44, 20],
      [60, 30, 44, 38, 48, 72, 24, 56, 32],
      [30, 64, 40, 80, 42, 36, 50, 28, 54],
      [44, 38, 68, 34, 58, 40, 76, 30, 26],
    ];
    const lead = (values) => values.indexOf(Math.max(...values));

    gsap.set(base, { opacity: 0 });
    gsap.set(bars, { opacity: 0, stroke });
    blocks.forEach(draw);

    const tl = gsap.timeline({ paused: true });
    tl.to(base, { opacity: 1, duration: 0.5, ease: "none" }, 0.1)
      .to(bars, { opacity: 1, duration: 0.2, ease: "none", stagger: 0.04 }, 0.35);
    blocks.forEach((block, i) => {
      tl.to(block, grow(block, sets[0][i], { duration: 0.9, ease: "power3.out" }), 0.4 + i * 0.05);
    });
    tl.to(blocks[lead(sets[0])].bar, { stroke: colors.red, duration: 0.3, ease: "none" }, 1.5);
    tl.add("rest", 1.9);

    const cycle = 3.6;
    const loop = gsap.timeline({ repeat: -1 });
    sets.forEach((values, k) => {
      const next = sets[(k + 1) % sets.length];
      const t = k * cycle;
      loop.to(blocks[lead(values)].bar, { stroke, duration: 0.4, ease: "none" }, t + 2);
      blocks.forEach((block, i) => {
        loop.to(block, grow(block, next[i], { duration: 1, ease: "power3.inOut" }), t + 2);
      });
      loop.to(blocks[lead(next)].bar, { stroke: colors.red, duration: 0.3, ease: "none" }, t + 3);
    });
    loop.set({}, {}, sets.length * cycle);
    tl.add(loop, "rest");
    return tl;
  },
};
