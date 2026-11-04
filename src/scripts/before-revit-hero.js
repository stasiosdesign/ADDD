/* ============================================================
   The Before Revit hero (BeforeRevitHero.astro; the figure:
   press-figure.js; styles: pages.css, "Before Revit hero")
   ------------------------------------------------------------
   The drawing is mounted on the vendored Hairline kernel, then given what
   the reference has and a bench figure may not:

   - its words, set in its own planes (each an affine of the drawing's
     projection, so a word lies on the ground, on the platform or on the
     frame as the reference's do): the frame's name and its note riding on
     the frame, the platform's name on its top, three tags on the ground;
   - its fills and light: the platform's faces take red gradients (defs
     here, the fills in pages.css), a soft red light sits under it (a CSS
     glow in the stage, placed under the platform from the projection);
   - the ground it stands on (second pass, 2026-11-04): the Technology
     Blueprint's dash-dot lattice (dot-field.js, mountIsoField), set out
     from the drawing's own ground at its own camera (figure.origin,
     .cell, .axis), so the platform's and the ground square's edges run
     on its lines; it fades out towards the words (pages.css);
   - the page's motion (second pass: scroll-linked): while the hold keeps
     the drawing where it is (CSS sticky), the frame's height is the
     scroll's. One number, how far through the hold the page is (p, a
     ScrollTrigger's progress, read as it scrolls, no tween of its own),
     sets everything: up to LAND the frame comes down, slowly at first and
     faster as it nears the platform (a cube, for its weight); at LAND it
     is down, and from there the landing plays out over the rest of the
     hold: a small rebound, a ring running out over the platform, a flash
     on its top, the light under it swelling and fading. Stopped, it all
     stops where it is; scrolled back, it all runs back, the pulse
     included, since every part of it is a function of p. Transforms and
     opacities, and the frame's own few paths (figure.lift); nothing is
     read from the layout while it runs.

   Under reduced motion, or below 992px (where nothing is held), the frame
   is simply up before LAND and down after it, without the pulse.
   Everything goes with the page.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";
import { PRESS } from "./press-figure.js";
import { mountIsoField } from "./dot-field.js";
import { registerPageCleanup } from "./page.js";

const NS = "http://www.w3.org/2000/svg";
// how far through the hold the frame lands (share of the hold's scroll),
// and how much of what follows the rebound takes
const LAND = 0.72;
const BOUNCE = 0.12;
// the rebound's height (the figure's units)
const REBOUND = 2.4;

const el = (tag, attrs, parent) => {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  parent?.append(node);
  return node;
};
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
// out of the impact: quick, then easing off
const out = (t) => 1 - (1 - clamp01(t)) ** 3;

// a plane through o, across u and down v (world vectors): the matrix that
// sets a word's own (x, y) there, one unit a world unit
function planeMatrix(P, o, u, v) {
  const p0 = P(...o);
  const pu = P(o[0] + u[0], o[1] + u[1], o[2] + u[2]);
  const pv = P(o[0] + v[0], o[1] + v[1], o[2] + v[2]);
  return `matrix(${[pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]].map((n) => n.toFixed(4)).join(" ")})`;
}
const X = [1, 0, 0];
const Y = [0, 1, 0];

// a word in a plane, and, for a tag, the rounded box round it
function word(parent, P, o, text, size, cls, box) {
  const g = el("g", { transform: planeMatrix(P, o, X, Y) }, parent);
  if (box) {
    const w = text.length * size * 0.64;
    const pad = size * 0.55;
    el("rect", { x: -pad, y: -size * 0.98 - pad * 0.6, width: w + 2 * pad, height: size * 1.25 + pad * 1.2, rx: size * 0.35, class: "br-tagbox" }, g);
  }
  const t = el("text", { x: 0, y: 0, "font-size": size, class: cls }, g);
  t.textContent = text;
  return g;
}

export function initBeforeRevitHero(container) {
  container.querySelectorAll("[data-br-hero]").forEach((hero) => {
    const stage = hero.querySelector("[data-hairline]");
    const svg = stage?.querySelector(":scope > svg");
    const hold = hero.querySelector(".br-hero__hold");
    if (!svg || !hold || hero.brHero) return;
    hero.brHero = true;
    HL.inject(document);
    svg.replaceChildren();
    let words = {};
    try {
      words = JSON.parse(stage.dataset.pressWords || "{}");
    } catch {}

    // the fills: the platform's top lit from the front, its sides darker
    const defs = el("defs", {}, svg);
    const grad = (id, stops, x2 = 0, y2 = 1) => {
      const lg = el("linearGradient", { id, x1: 0, y1: 0, x2, y2 }, defs);
      stops.forEach(([at, color, a = 1]) => el("stop", { offset: at, "stop-color": color, "stop-opacity": a }, lg));
    };
    grad("br-top", [[0, "#5e0606"], [0.55, "#b8120d"], [1, "#ff3b2a"]], 0.35, 1);
    grad("br-side", [[0, "#d21a12"], [1, "#4a0303"]]);

    let flash = null;
    let ring = null;
    const figure = PRESS.mount({
      stage,
      svg,
      read: { textContent: "" },
      labels: (g, P, { B, T, G, F, FT }) => {
        // under the frame: the flash on the platform's top, and the ring
        const sq = (s, z) => [[-s / 2, -s / 2, z], [s / 2, -s / 2, z], [s / 2, s / 2, z], [-s / 2, s / 2, z]];
        flash = el("path", { d: HL.poly(sq(B - 2, T).map((p) => P(...p))), class: "br-flash" }, g);
        ring = el("path", { d: HL.poly(sq(F + 6, T).map((p) => P(...p))), class: "br-ring" }, g);
        ring.style.opacity = "0";
        // the light's middle under the platform, in shares of the stage
        const [gx, gy] = P(0, 0, T / 2);
        stage.style.setProperty("--glow-x", `${((gx / 400) * 100).toFixed(2)}%`);
        stage.style.setProperty("--glow-y", `${((gy / 320) * 100).toFixed(2)}%`);
        // on the ground and the platform
        if (words.platform) word(g, P, [-B / 2 + 9, B / 2 - 3.6, T], words.platform.toUpperCase(), 3.1, "br-word", true);
        const [tTools, tInfo, tDecisions] = words.tags || [];
        if (tTools) word(g, P, [-G / 2 - 36, G / 2 + 7, 0], tTools.toUpperCase(), 3.4, "br-word", true);
        if (tInfo) word(g, P, [B / 2 + 8, G / 2 + 12, 0], tInfo.toUpperCase(), 3.1, "br-word is--faint", false);
        if (tDecisions) word(g, P, [G / 2 - 30, -G / 2 + 9, 0], tDecisions.toUpperCase(), 3.4, "br-word", true);
        // on the frame, riding with it
        const ride = [];
        if (words.frame) ride.push({ at: [-F / 2 + 6, -F / 2 + 7.5], text: words.frame.toUpperCase(), size: 3.6, cls: "br-word is--bright" });
        (words.note || []).forEach((line, i) => ride.push({ at: [-F / 2 + 6, F / 2 - 14 + i * 4.8], text: line, size: 3.5, cls: "br-note" }));
        const riders = ride.map((r) => ({ ...r, g: word(g, P, [r.at[0], r.at[1], T + 80], r.text, r.size, r.cls, false) }));
        return (z) => riders.forEach((r) => r.g.setAttribute("transform", planeMatrix(P, [r.at[0], r.at[1], z + FT], X, Y)));
      },
    }, PRESS.range[1]);

    // the lattice under it, from the drawing's own ground and camera
    const ground = hero.querySelector("[data-br-ground]");
    let field = null;
    if (ground && figure.origin) {
      svg.dataset.ground = figure.origin.map((v) => v.toFixed(2)).join(" ");
      ground.dataset.isoModule = String(figure.cell);
      ground.dataset.isoAxis = figure.axis.map((v) => v.toFixed(5)).join(" ");
      field = mountIsoField(ground);
    }

    const pulse = stage.querySelector("[data-press-pulse]");
    if (ring) {
      ring.style.transformBox = "fill-box";
      ring.style.transformOrigin = "50% 50%";
    }

    // ---- the frame, from the scroll ---------------------------------------
    const FLOAT = PRESS.range[1];
    let shownZ = null;
    const lift = (z) => {
      const r = Math.round(z * 100) / 100;
      if (r === shownZ) return;
      shownZ = r;
      figure.lift(r);
    };
    // everything at p (0 the frame up, LAND down, 1 the landing spent)
    let shownP = -1;
    function render(p) {
      const q = Math.round(clamp01(p) * 10000) / 10000;
      if (q === shownP) return;
      shownP = q;
      const fall = Math.min(1, q / LAND);
      const u = q < LAND ? -1 : (q - LAND) / (1 - LAND);
      // at the very top the frame is the figure's own again (it floats
      // where it rests, and the pointer can lift it); scrolled at all, it
      // is the scroll's
      if (q === 0) {
        if (shownZ !== "free") {
          shownZ = "free";
          figure.lift(null);
        }
      } else lift(u < 0 ? FLOAT * (1 - fall * fall * fall) : u < BOUNCE ? REBOUND * Math.sin((Math.PI * u) / BOUNCE) : 0);
      const on = u >= 0 && u < 1;
      if (ring) {
        ring.style.opacity = on ? (0.9 * (1 - out(u))).toFixed(3) : "0";
        ring.style.scale = on ? (1 + 0.9 * out(u)).toFixed(4) : "1";
      }
      if (flash) flash.style.opacity = on ? (0.38 * (1 - out(u / 0.6))).toFixed(3) : "0";
      if (pulse) {
        pulse.style.opacity = on ? (1 - out(u)).toFixed(3) : "0";
        pulse.style.scale = on ? (0.85 + 0.45 * out(u)).toFixed(4) : "0.85";
      }
    }
    // the same, without the motion: up before LAND, down after
    function snap(p) {
      lift(p < LAND ? FLOAT : 0);
      if (ring) ring.style.opacity = "0";
      if (flash) flash.style.opacity = "0";
      if (pulse) pulse.style.opacity = "0";
    }

    // how far through the hold the page is: from the hero's top at the
    // screen's to the hold letting go (where the after-room ends)
    const mm = gsap.matchMedia();
    mm.add(
      { moving: "(min-width: 992px) and (prefers-reduced-motion: no-preference)", still: "(max-width: 991px), (prefers-reduced-motion: reduce)" },
      (ctx) => {
        const moving = ctx.conditions.moving;
        const show = moving ? render : snap;
        shownP = -1;
        const st = ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          // below 992px the hero is not held: the frame lands once the
          // words have gone up the screen
          end: () => (moving ? `+=${Math.max(1, hero.offsetHeight - hold.clientHeight)}` : "bottom top"),
          invalidateOnRefresh: true,
          onUpdate: (self) => show(self.progress),
          onRefresh: (self) => show(self.progress),
        });
        show(st.progress);
        return () => st.kill();
      },
    );

    registerPageCleanup(() => {
      mm.revert();
      field?.destroy();
      figure.destroy();
      hero.brHero = false;
    });
  });
}
