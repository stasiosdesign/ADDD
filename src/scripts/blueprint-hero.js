/* ============================================================
   The Technology Blueprint hero (BlueprintHero.astro): its figure, the
   ground it stands on, and the statement that follows it
   ------------------------------------------------------------
   The figure (network-figure.js, a Hairline figure on the vendored
   kernel) is drawn into the svg in its stage, the stage its own pointer
   surface: the key under the pointer rises and lights its routes, and
   while the figure is on screen a signal runs along the routes into the
   hub (the kernel's one frame loop, asleep off screen; at rest under
   reduced motion).

   The hero's ground is the Technology Blueprint's own dash-dot lattice
   (dot-field.js, mountIsoField, data-iso-line="dash"), set out from the
   figure's ground origin at the figure's scale, a key's side to a cell
   (figure.cell), so each key fills a cell wherever the figure is drawn.
   The origin is the figure's own (fitted when it mounts), so the lattice
   is mounted here, after it, not by the page's iso fields. It fades out
   towards the words (pages.css, "Technology Blueprint hero").

   The hold that keeps the figure in place while the words scroll by is
   CSS (sticky). What is here:

   - The figure's place: the drawing (its own box, at rest) in the middle
     of the room between the nav bar's foot and the screen's, set when it
     is drawn and whenever the hold changes size, never with the scroll.
   - The scroll's stir: the figure's keys lift a little with the scroll's
     speed, and settle when it stops (network.js, stir).

   - The statement's lines, one per line of the Studio's field (a field
     written as one line is broken where its lines come out most even:
     inLines), all at the statement's one size (2026-11-04, sixth pass:
     they were each brought to one width by their own size and tracking,
     which read as lines of different sizes).
   - Its rise: the lines up into their masks, one after another, the
     first time it comes up the screen (the headings' line reveal).
   - The routes lighting together (is--together) while the statement is
     up the screen, and going back to grey above it.
   ============================================================ */
import { HL } from "./vendor/hairline-kernel.js";
import { NETWORK } from "./network-figure.js";
import { mountIsoField } from "./dot-field.js";
import { motion, registerPageCleanup } from "./page.js";
import { LINE_REVEAL } from "./reveals.js";

// the scroll's speed (px a second) that stirs the network fully
const STIR_SPEED = 2600;

export function initBlueprintHero(container) {
  container.querySelectorAll("[data-blueprint-hero]").forEach((hero) => {
    const stage = hero.querySelector("[data-hairline]");
    const svg = stage?.querySelector(":scope > svg");
    const ground = hero.querySelector("[data-blueprint-ground]");
    if (!svg || hero.blueprintHero) return;
    hero.blueprintHero = true;

    HL.inject(document);
    svg.replaceChildren();
    const read = hero.querySelector("[data-hairline-live]") || { textContent: "" };
    const figure = NETWORK.mount({ stage, svg, read }, NETWORK.range[1]);
    svg.dataset.ground = figure.origin.map((v) => v.toFixed(2)).join(" ");
    // a cell of the lattice a key's side, so each key fills a cell
    if (ground && figure.cell) ground.dataset.isoModule = String(figure.cell);
    // and on the figure's own camera: its angle, and how long a unit of
    // the ground is on the screen (the figure is drawn a little closer in
    // than the plain isometric, fourth pass)
    if (ground && figure.axis) ground.dataset.isoAxis = figure.axis.map((v) => v.toFixed(5)).join(" ");

    const statement = hero.querySelector("[data-bp-statement]");
    const set = statement ? mountStatement(hero, statement) : null;

    // The network in the middle of the hero's room (fourth pass): from the
    // nav bar's foot to the screen's, the drawing as it is drawn (its own
    // box at rest, the routes and keys, not the frame round them) as far
    // from the one as from the other. The hold keeps it there through the
    // whole sequence: nothing moves it with the scroll. Set as the
    // figure's top (--bp-fig-y) once the figure is drawn and whenever the
    // hold changes size, before the lattice is laid out from it again.
    // From 992px, where the hold holds; below, the network is in the flow.
    const hold = hero.querySelector(".bp-hero__hold");
    const fig = hero.querySelector(".bp-hero__figure");
    const bar = document.querySelector(".mega-nav__bar");
    const wide = window.matchMedia("(min-width: 992px)");
    let drawn = null;
    const place = () => {
      if (!hold || !fig) return;
      if (!wide.matches) {
        hero.style.removeProperty("--bp-fig-y");
        hero.style.removeProperty("--bp-fig-mid");
        return;
      }
      drawn ??= svg.getBBox();
      const k = fig.offsetWidth / svg.viewBox.baseVal.width;
      if (!(k > 0) || !drawn.height) return;
      // the bar's foot where it rests (the nav floats over the page: a bar
      // moved off the screen falls back to its own height)
      const nav = bar ? bar.getBoundingClientRect().bottom : 0;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const top = nav > 0 ? nav : parseFloat(getComputedStyle(hero).getPropertyValue("--nav-h")) * rem || 64;
      const room = hold.clientHeight - top;
      const y = top + (room - drawn.height * k) / 2 - drawn.y * k;
      hero.style.setProperty("--bp-fig-y", `${y.toFixed(1)}px`);
      hero.style.setProperty("--bp-fig-mid", `${(y + (drawn.y + drawn.height / 2) * k).toFixed(1)}px`);
    };
    place();
    // The statement's height, for its screen's length (pages.css,
    // .bp-hero__next: the screen ends where the statement's middle meets
    // the window's, so the hold lets go just as it is centred, and it
    // starts wholly under the first screen): measured now, once the face
    // has loaded and whenever the window changes size. From 992px, where
    // the hold holds.
    const sizeStatement = () => {
      if (!statement || !wide.matches) return hero.style.removeProperty("--bp-stmt-h");
      const h = statement.offsetHeight;
      if (h > 0) hero.style.setProperty("--bp-stmt-h", `${h}px`);
    };
    sizeStatement();
    document.fonts?.ready.then(() => hero.blueprintHero && sizeStatement());
    const field = ground ? mountIsoField(ground) : null;
    const sized = new ResizeObserver(() => {
      place();
      sizeStatement();
      field?.layout?.();
    });
    if (hold) sized.observe(hold);
    wide.addEventListener("change", place);
    wide.addEventListener("change", sizeStatement);

    // The scroll stirs the network (fourth pass): its keys lift a little as
    // the pointer lifts one, by how fast the page is going either way, and
    // settle once it stops (network.js, stir: the lift dies away on its
    // own). Only through the hero and its statement, the one number read
    // per scroll update; the figure's own loop does the rest.
    const stirs = motion.reduced
      ? null
      : ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => figure.stir?.(Math.abs(self.getVelocity()) / STIR_SPEED),
        });

    registerPageCleanup(() => {
      stirs?.kill();
      sized.disconnect();
      wide.removeEventListener("change", place);
      wide.removeEventListener("change", sizeStatement);
      hero.style.removeProperty("--bp-stmt-h");
      set?.destroy();
      field?.destroy();
      figure.destroy();
      hero.style.removeProperty("--bp-fig-y");
      hero.style.removeProperty("--bp-fig-mid");
      hero.blueprintHero = false;
    });
  });
}

function mountStatement(hero, p) {
  const text = p.textContent;
  let lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  // written as one line (the Studio's field without its breaks): set on
  // four, broken where the four come out most even, as the statement is
  // set (four lines since the fifth pass)
  if (lines.length === 1) lines = inLines(lines[0], p, 4);
  // the Studio's preview writes into the statement as it is edited: there
  // it stays as written
  const draft = document.documentElement.hasAttribute("data-draft");
  let reveal = null;
  let rise = null;

  // the routes light while the statement is up the screen
  const together = ScrollTrigger.create({
    trigger: p,
    start: "top 78%",
    end: "max",
    toggleClass: { targets: hero, className: "is--together" },
  });

  if (!draft && lines.length > 1) {
    p.textContent = "";
    const inks = lines.map((line) => {
      const box = document.createElement("span");
      box.className = "bp-hero__line";
      const ink = document.createElement("span");
      ink.className = "bp-hero__ink";
      ink.textContent = line;
      box.append(ink);
      p.append(box);
      return ink;
    });
    p.setAttribute("aria-label", lines.join(" "));
    inks.forEach((ink) => ink.parentElement.setAttribute("aria-hidden", "true"));

    if (!motion.reduced) {
      gsap.set(inks, { yPercent: LINE_REVEAL.yPercent });
      reveal = gsap.to(inks, {
        yPercent: 0,
        duration: LINE_REVEAL.duration,
        stagger: LINE_REVEAL.stagger,
        ease: LINE_REVEAL.ease,
        paused: true,
      });
      rise = ScrollTrigger.create({ trigger: p, start: LINE_REVEAL.start, once: true, onEnter: () => reveal.play() });
    }
  }

  return {
    destroy() {
      together.kill();
      rise?.kill();
      reveal?.kill();
      hero.classList.remove("is--together");
    },
  };
}

// A line of words as n lines: the breaks that leave the lines' widths (in
// the statement's own face, measured on a canvas) closest to one another,
// found by trying every set of breaks (a statement is a few dozen words).
function inLines(text, p, n) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < n) return [text];
  const cs = getComputedStyle(p);
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const width = (a, b) => ctx.measureText(words.slice(a, b).join(" ")).width;
  let best = null;
  let least = Infinity;
  const tryFrom = (start, left, cuts) => {
    if (left === 1) {
      const ends = [...cuts, words.length];
      const ws = ends.map((end, i) => width(i ? ends[i - 1] : 0, end));
      const spread = Math.max(...ws) - Math.min(...ws);
      if (spread < least) { least = spread; best = ends; }
      return;
    }
    for (let i = start + 1; i <= words.length - left + 1; i++) tryFrom(i, left - 1, [...cuts, i]);
  };
  tryFrom(0, n, []);
  return best.map((end, i) => words.slice(i ? best[i - 1] : 0, end).join(" "));
}
