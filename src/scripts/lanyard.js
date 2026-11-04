// -----------------------------------------
// ADDD — the Contact page's pass on its lanyard (contact.astro)
// -----------------------------------------
//
// The pass is markup (contact.astro; pages.css, "The lanyard"): the strap,
// the clip and the holder drawn in CSS, the printed card in the page's own
// type with its real email and telephone links. It hangs still, at rest,
// from the moment the page appears. This only gives it a slight response
// to the pointer: as the pointer moves over the page the card turns a few
// degrees towards it and the lanyard swings a degree or so from its top
// (a quick sideways move rocking it a touch more), each eased to its angle (gsap.quickTo, so a tween runs only
// while the pointer moves and nothing at all while it is still); when the
// pointer leaves the window it settles back, without bounce. On the card
// itself it holds still where it is (since 2026-11-04, when the card took
// the Book a Free Call button), so the button and the links stay put under
// the pointer, and moves on once the pointer is off it again.
//
// With a fine pointer only, and not with reduced motion: otherwise the
// pass simply hangs. Transforms only, on the compositor; the card's place
// is measured once and again when the window changes size, never while
// the pointer moves.
//
// (Until 2026-11-04 the pass was drawn in WebGL with three.js on a rope
// simulation, to be grabbed and thrown; it weighed on the page's loading
// and could not carry real links, and was replaced by this.)

import { motion, registerPageCleanup } from "./page.js";

// the most it moves: the swing from the top (deg) and the card's turn and
// tilt towards the pointer (deg); a quick sideways move adds a little rock
// to the swing (deg per px of the pointer's travel between moves, at most
// ROCK), let go a moment after the pointer slows (s). A long, soft ease,
// so it settles.
const SWING = 1.5;
const TURN = 6;
const TILT = 3.5;
const ROCK = 1.2;
const ROCK_PER_PX = 0.05;
const ROCK_LET_GO = 0.14;
const TIME = 1.5;
const EASE = "power2.out";

export function initLanyard(container) {
  container.querySelectorAll("[data-lanyard]").forEach((root) => {
    if (root.lanyard || motion.reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rig = root.querySelector("[data-lanyard-rig]");
    const card = root.querySelector("[data-lanyard-card]");
    const section = root.closest("section") || root;
    if (!rig || !card) return;
    root.lanyard = true;

    gsap.set(card, { transformPerspective: 1100 });
    const swing = gsap.quickTo(rig, "rotation", { duration: TIME, ease: EASE });
    const turn = gsap.quickTo(card, "rotationY", { duration: TIME, ease: EASE });
    const tilt = gsap.quickTo(card, "rotationX", { duration: TIME, ease: EASE });

    // the card's middle and box on the page (not the window, so scrolling
    // needs no new measure), and the swing's pivot at the strap's top
    let box = null;
    const measure = () => {
      const r = card.getBoundingClientRect();
      box = { left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY };
      box.x = (box.left + box.right) / 2;
      box.y = (box.top + box.bottom) / 2;
      const rigTop = rig.getBoundingClientRect().top;
      const top = section.getBoundingClientRect().top;
      // over the strap (pages.css: the lanyard stands at 46% of its column)
      rig.style.transformOrigin = `46% ${Math.round(top - rigTop)}px`;
    };
    const clamp = gsap.utils.clamp(-1, 1);
    const clampRock = gsap.utils.clamp(-ROCK, ROCK);
    let lastX = null;
    let rest = 0; // the swing the pointer's place alone asks for
    let letGo = null;
    // on the card: everything held where it is now, once, as it is reached
    let held = false;
    const hold = () => {
      held = true;
      letGo?.kill();
      lastX = null;
      swing(gsap.getProperty(rig, "rotation"));
      turn(gsap.getProperty(card, "rotationY"));
      tilt(gsap.getProperty(card, "rotationX"));
    };
    const onMove = (e) => {
      if (!box) measure();
      const over = e.pageX > box.left && e.pageX < box.right && e.pageY > box.top && e.pageY < box.bottom;
      if (over) {
        if (!held) hold();
        return;
      }
      held = false;
      const nx = clamp((e.pageX - box.x) / (innerWidth / 2));
      const ny = clamp((e.pageY - box.y) / (innerHeight / 2));
      rest = -nx * SWING;
      // a quick move sideways: a little rock against it, let go after
      const rock = lastX === null ? 0 : clampRock(-(e.pageX - lastX) * ROCK_PER_PX);
      lastX = e.pageX;
      swing(rest + rock);
      turn(nx * TURN);
      tilt(-ny * TILT);
      letGo?.kill();
      letGo = gsap.delayedCall(ROCK_LET_GO, () => swing(rest));
    };
    // the pointer gone from the window: back to rest
    const onLeave = (e) => {
      if (e.relatedTarget) return;
      letGo?.kill();
      held = false;
      lastX = null;
      rest = 0;
      swing(0);
      turn(0);
      tilt(0);
    };
    let resizing = 0;
    const onResize = () => {
      clearTimeout(resizing);
      resizing = setTimeout(() => (box = null), 150);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave);
    window.addEventListener("resize", onResize);

    registerPageCleanup(() => {
      clearTimeout(resizing);
      letGo?.kill();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf([rig, card]);
      gsap.set([rig, card], { clearProps: "transform,transformOrigin" });
      root.lanyard = false;
    });
  });
}
