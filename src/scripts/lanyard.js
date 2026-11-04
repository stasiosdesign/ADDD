// -----------------------------------------
// ADDD — the Contact page's pass on its lanyard (contact.astro)
// -----------------------------------------
//
// The pass is markup (contact.astro; pages.css, "The lanyard"): the strap,
// the clip and the holder drawn in CSS, the printed card in the page's own
// type with its real links and the Book a Free Call button.
//
// It hangs front on, nearly flat, and floats: left alone, the lanyard sways
// a fraction of a degree from its top and the card turns a degree or so on
// its clasp, slowly and out of step (three slow sines), so it is alive
// without ever seeming to repeat. With the pointer on the card it tips as a
// card held up in the air does under a fingertip: the corner the pointer is
// near goes back and the opposite one comes forward (rotateX and rotateY
// from where the pointer is on the card, at most TIP_Y and TIP_X degrees),
// easing in; off the card it eases back into the float.
//
// One loop (gsap.ticker) writes both transforms each frame from the float
// and the eased tip together, so nothing fights over a property (before
// 2026-11-04 the swing, the turn and a rock were separate tweens retargeted
// on every pointer move). The tip eases exponentially towards where the
// pointer asks, with no overshoot, so a pointer crossing the card gives a
// smooth, steady answer. The pointer is tested against the card's resting
// box, measured with the transforms off, so its own tilt never moves the
// edge out from under the pointer: no flicker at the edge. The loop runs
// only while the pass is on screen (and the browser stops it with the tab
// hidden); the tip only for a fine pointer; under reduced motion the pass
// simply hangs.
//
// (Until 2026-11-04 the pass was drawn in WebGL with three.js on a rope
// simulation; it weighed on the page's loading and could not carry real
// links, and was replaced by this.)

import { motion, registerPageCleanup } from "./page.js";

// the float: amplitude (deg) and period (s) of the lanyard's sway and the
// card's turn and nod, and how long it takes to come in after the page
// arrives (s)
const SWAY = [0.6, 7.3];
const TURN = [1.3, 9.1];
const NOD = [0.45, 11.7];
const FLOAT_IN = 2;
// the tip under the pointer: at most this far (deg) about each axis, eased
// in at this rate (per second) and back out at a slower one, and a
// perspective that keeps it a card, not a sheet bending
const TIP_Y = 9;
const TIP_X = 7;
const EASE_IN = 7;
const EASE_OUT = 3.5;
const PERSPECTIVE = 900;

export function initLanyard(container) {
  container.querySelectorAll("[data-lanyard]").forEach((root) => {
    if (root.lanyard || motion.reduced) return;
    const rig = root.querySelector("[data-lanyard-rig]");
    const card = root.querySelector("[data-lanyard-card]");
    const section = root.closest("section") || root;
    if (!rig || !card) return;
    root.lanyard = true;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

    // the card's resting box on the page, and the swing's pivot at the
    // strap's top, measured with every transform off
    let box = null;
    const measure = () => {
      gsap.set(rig, { rotation: 0 });
      gsap.set(card, { rotationX: 0, rotationY: 0 });
      const r = card.getBoundingClientRect();
      box = { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
      const rigTop = rig.getBoundingClientRect().top;
      const top = section.getBoundingClientRect().top;
      // over the strap (pages.css: the lanyard stands at 46% of its column)
      rig.style.transformOrigin = `46% ${Math.round(top - rigTop)}px`;
    };
    gsap.set(card, { transformPerspective: PERSPECTIVE });

    // where the pointer asks the card to tip (-1 to 1 across and down), and
    // where it is now
    const want = { x: 0, y: 0 };
    const tip = { x: 0, y: 0 };
    let over = false;
    const onMove = (e) => {
      if (!box) return;
      const nx = (e.pageX - box.left) / box.width;
      const ny = (e.pageY - box.top) / box.height;
      over = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
      want.x = over ? nx * 2 - 1 : 0;
      want.y = over ? ny * 2 - 1 : 0;
    };
    const onLeave = (e) => {
      if (e.relatedTarget) return;
      over = false;
      want.x = 0;
      want.y = 0;
    };

    let t = 0;
    // measured on the loop's first frame, and again whenever the column
    // changes size (the window, the fonts arriving)
    let remeasure = true;
    const wave = ([amp, period], phase) => amp * Math.sin((t / period) * Math.PI * 2 + phase);
    const tick = (_time, deltaMs) => {
      if (remeasure) {
        remeasure = false;
        measure();
      }
      const dt = Math.min(deltaMs, 64) / 1000;
      t += dt;
      const come = Math.min(1, t / FLOAT_IN);
      const k = 1 - Math.exp(-dt * (over ? EASE_IN : EASE_OUT));
      tip.x += (want.x - tip.x) * k;
      tip.y += (want.y - tip.y) * k;
      gsap.set(rig, { rotation: wave(SWAY, 0) * come });
      gsap.set(card, {
        // the right side back when the pointer is on the right; the top
        // back when it is near the top
        rotationY: wave(TURN, 1.1) * come + tip.x * TIP_Y,
        rotationX: wave(NOD, 0.4) * come - tip.y * TIP_X,
      });
    };

    // the loop only while the pass is on screen
    let running = false;
    const run = (on) => {
      if (on === running) return;
      running = on;
      if (on) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    };
    const seen = new IntersectionObserver(([entry]) => run(entry.isIntersecting));
    seen.observe(root);

    let resizing = 0;
    const onResize = () => {
      clearTimeout(resizing);
      resizing = setTimeout(() => (remeasure = true), 150);
    };
    const sized = new ResizeObserver(onResize);
    sized.observe(root);
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerout", onLeave);
    }
    window.addEventListener("resize", onResize);

    registerPageCleanup(() => {
      clearTimeout(resizing);
      seen.disconnect();
      sized.disconnect();
      run(false);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", onResize);
      gsap.set([rig, card], { clearProps: "transform,transformOrigin" });
      root.lanyard = false;
    });
  });
}
