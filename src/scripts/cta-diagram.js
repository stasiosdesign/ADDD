/* ============================================================
   The closing call's diagram (ClosingCta.astro): held to the dots, and
   drawn in, once
   ------------------------------------------------------------
   Held to the dots: the drawing is set out on the section's field of dots,
   its bus along a row. After a light FAQ the field carries on that
   section's lattice (dot-field.js, data-dot-follow), so where its rows fall
   depends on how tall the FAQ is; each time the field is drawn it says
   where its lattice fell (dotgrid:set), and the drawing is moved up or
   down by at most half a step to put its bus on the nearest row
   (--cta-snap; styles.css). The first time at once; after that (an answer
   opening above, the window resized) once the field has settled, gliding.

   Drawn in: as the call comes into view, the ADDD mark in the middle
   settles into place, then the lines draw out from it to the rings, the
   shortest first; each ring and its name comes up as its line reaches it,
   and last the lines run on out past the rings, off the screen or up out
   of the call. About two seconds in all, on the site's soft eases, then it
   is still. Each line is drawn by its dash. The lines keep a hairline
   whatever the drawing's scale (vector-effect: non-scaling-stroke), and a
   dash then counts in the screen's pixels, not the drawing's units: a dash
   the path's own length (as pathLength="1" made it, until 2026-11-04) fell
   short of its end wherever the drawing is scaled up, and every line
   stopped short of its ring. So each dash is the path's length at the
   drawing's scale, and once drawn the dash is taken off altogether.

   Under reduced motion, or without the script, the diagram is simply
   there: its hidden start is set here, never in the stylesheet.
   ============================================================ */
import { motion, registerPageCleanup } from "./page.js";

// how long the field must be still before the drawing glides to its row
const SETTLE_MS = 140;

export function initCtaDiagram(container) {
  container.querySelectorAll("[data-cta-diagram]").forEach((svg) => {
    if (svg.ctaDiagram) return;
    svg.ctaDiagram = true;
    const dots = svg.closest("section")?.querySelector(":scope > .dot-grid");
    const bus = Number(svg.dataset.ctaBus) || 0;
    const viewHeight = svg.viewBox.baseVal.height;

    // ---- held to the dots ------------------------------------------------
    let snapped = false;
    let settle = 0;
    const snapTo = ({ pitch, y }) => {
      if (!(pitch > 0) || !viewHeight) return;
      // a unit on the screen, and the bus's place in the field's box (the
      // section's: the field covers it), unmoved
      const u = (svg.clientHeight || svg.getBoundingClientRect().height) / viewHeight;
      let d = (((y - bus * u) % pitch) + pitch) % pitch;
      if (d > pitch / 2) d -= pitch;
      svg.style.setProperty("--cta-snap", `${d.toFixed(2)}px`);
    };
    const onSet = (e) => {
      clearTimeout(settle);
      if (!snapped) {
        snapped = true;
        snapTo(e.detail);
        return;
      }
      settle = setTimeout(() => {
        svg.classList.add("is--snapping");
        snapTo(e.detail);
      }, SETTLE_MS);
    };
    dots?.addEventListener("dotgrid:set", onSet);
    if (dots?.dotGrid?.lattice) onSet({ detail: dots.dotGrid.lattice });

    let release = () => {};
    registerPageCleanup(() => {
      clearTimeout(settle);
      dots?.removeEventListener("dotgrid:set", onSet);
      release();
      svg.ctaDiagram = false;
    });
    if (motion.reduced) return;

    // ---- drawn in ----------------------------------------------------------
    const hub = svg.querySelector("[data-cta-hub]");
    const routes = [...svg.querySelectorAll("[data-cta-route]")];
    const outs = [...svg.querySelectorAll("[data-cta-out]")];
    const nodes = [...svg.querySelectorAll("[data-cta-node]")];
    if (!hub || !routes.length) return;
    const lines = [...routes, ...outs];

    // each line's dash: its length at the drawing's scale (or its own,
    // whichever is longer), so a whole dash always reaches its end
    const scale = Math.max(1, svg.getScreenCTM()?.a || 1);
    const dash = new Map(lines.map((path) => [path, Math.ceil(path.getTotalLength() * scale) + 2]));
    lines.forEach((path) => {
      const l = dash.get(path);
      gsap.set(path, { strokeDasharray: `${l} ${l}`, strokeDashoffset: l });
    });
    gsap.set(nodes, { opacity: 0, scale: 0.86, transformOrigin: "50% 50%" });
    gsap.set(hub, { opacity: 0, y: 10, transformOrigin: "50% 50%" });

    // routes, rings and outs in the same order (ClosingCta.astro: the
    // shortest route first), each a step after the last
    const step = 0.07;
    const undash = (path) => () => gsap.set(path, { clearProps: "strokeDasharray,strokeDashoffset" });
    const tl = gsap.timeline({ paused: true });
    tl.to(hub, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0);
    routes.forEach((path, i) => tl.to(path, { strokeDashoffset: 0, duration: 1.05, ease: "power2.inOut", onComplete: undash(path) }, 0.3 + i * step));
    nodes.forEach((node, i) => tl.to(node, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, 1.05 + i * step));
    outs.forEach((path, i) => tl.to(path, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out", onComplete: undash(path) }, 1.3 + i * step));

    const trigger = ScrollTrigger.create({
      trigger: svg.closest("section") || svg,
      start: "top 72%",
      once: true,
      onEnter: () => tl.play(),
    });

    release = () => {
      trigger.kill();
      tl.kill();
      gsap.set([hub, ...lines, ...nodes], { clearProps: "all" });
    };
  });
}
