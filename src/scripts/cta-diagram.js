/* ============================================================
   The closing call's diagram (ClosingCta.astro): drawn in, once
   ------------------------------------------------------------
   As the call comes into view, the ADDD mark in the middle settles into
   place, then the lines draw out from it to the rings, the nearest first,
   the two sides together; each ring and its name comes up as its line
   reaches it, and last the lines run on out past the rings, off the
   diagram's edges. About two seconds in all, on the site's soft eases,
   then it is still. Each line is drawn by its dash (pathLength 1), so
   nothing is laid out while it runs.

   Under reduced motion, or without the script, the diagram is simply
   there: its hidden start is set here, never in the stylesheet.
   ============================================================ */
import { motion, registerPageCleanup } from "./page.js";

export function initCtaDiagram(container) {
  container.querySelectorAll("[data-cta-diagram]").forEach((svg) => {
    if (svg.ctaDiagram || motion.reduced) return;
    const hub = svg.querySelector("[data-cta-hub]");
    const routes = [...svg.querySelectorAll("[data-cta-route]")];
    const outs = [...svg.querySelectorAll("[data-cta-out]")];
    const nodes = [...svg.querySelectorAll("[data-cta-node]")];
    const shade = svg.querySelector(".cta__hub-shade");
    if (!hub || !routes.length) return;
    svg.ctaDiagram = true;
    const all = [hub, shade, ...routes, ...outs, ...nodes].filter(Boolean);

    gsap.set([...routes, ...outs], { strokeDasharray: "1 1", strokeDashoffset: 1 });
    gsap.set(nodes, { opacity: 0, scale: 0.86, transformOrigin: "50% 50%" });
    gsap.set(hub, { opacity: 0, y: 10, transformOrigin: "50% 50%" });
    if (shade) gsap.set(shade, { opacity: 0 });

    // the two sides together: routes and rings come in pairs, nearest first
    const pair = 0.09;
    const tl = gsap.timeline({ paused: true });
    tl.to(hub, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0);
    if (shade) tl.to(shade, { opacity: 1, duration: 1, ease: "power2.out" }, 0.1);
    routes.forEach((path, i) => tl.to(path, { strokeDashoffset: 0, duration: 1.05, ease: "power2.inOut" }, 0.3 + Math.floor(i / 2) * pair));
    nodes.forEach((node, i) => tl.to(node, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, 1.05 + Math.floor(i / 2) * pair));
    outs.forEach((path, i) => tl.to(path, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, 1.3 + Math.floor(i / 2) * pair));

    const trigger = ScrollTrigger.create({
      trigger: svg.closest("section") || svg,
      start: "top 72%",
      once: true,
      onEnter: () => tl.play(),
    });

    registerPageCleanup(() => {
      trigger.kill();
      tl.kill();
      gsap.set(all, { clearProps: "all" });
      svg.ctaDiagram = false;
    });
  });
}
