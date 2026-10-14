/* ============================================================
   Coin stack — the coins building the logo as the page scrolls past
   (src/components/CoinStack.astro, src/styles/coin-stack.css)
   ------------------------------------------------------------
   Nothing holds the page: the drawing follows the scroll, from its top
   coming up the screen to its middle reaching the screen's.
   One number moves, the red coin's height in the drawing, from where
   it starts down to where it rests on the stack; every coin under it
   stays where it is until the red coin, with whatever it has taken up,
   reaches it, and from then on rides under it, so the coins are taken
   up one after another and the stack keeps its order and its spacing
   until each join. As each grey coin joins, the form it carries
   appears on the red face, so the logo is built a form at a time.
   Each coin's places come from the markup (data-from: its face's height
   apart; data-under: how far under the red face it rides once joined;
   data-rest on the section: where the red face comes to rest). Under
   reduced motion the stack is simply finished. GSAP and ScrollTrigger
   are the site's globals.

   The joins are a sequence, a beat each: the scroll's way is shared
   equally between them, and in each share the stack travels to the next
   coin and slows into it (MOVE, eased in and out), then, in contact,
   is pressed onto it a touch and comes back up (PRESS), a little seat as
   the coin clicks on, before it sets off for the next. So the four
   joins come evenly, one after another, rather than wherever an even
   drift down happens to reach each coin.

   The heading the coins are set into stands still (it has no line
   reveal), but it is split into its lines here, without moving them, so
   each line can take its own place about the coins (styles.css: the
   first line under them, the second over), autoSplit keeping the lines
   true as the width or the webfont changes. Not in the Studio's
   preview, where the Visual editor writes into the heading.
   ============================================================ */

// how far before a coin is reached its form starts to show on the red
// face, in the drawing's units
const SHOW = 12;
// each join's share of the scroll: travelling to the coin, then seating
// on it; how far the stack is pressed down as it seats (drawing units)
const MOVE = 0.8;
const PRESS = 5;

export function mountCoinStack(el, { still = false } = {}) {
  const drawing = el.querySelector(".coin-stack__drawing");
  // in the markup lowest first
  const coins = [...el.querySelectorAll("[data-coin]")];
  const red = coins.find((coin) => coin.dataset.coin === "logo");
  if (!drawing || !red) return { destroy() {} };
  const x = red.transform.baseVal.consolidate()?.matrix.e ?? 0;
  const from = coins.map((coin) => Number(coin.dataset.from));
  const under = coins.map((coin) => Number(coin.dataset.under));
  const start = Number(red.dataset.from);
  const rest = Number(el.dataset.rest);
  // each form on the red face, with the height of the red face at which
  // the coin carrying it is reached
  const forms = [...red.querySelectorAll("[data-coin-form]")].map((form) => {
    const i = coins.findIndex((coin) => coin.dataset.coin === `form-${Number(form.dataset.coinForm) + 1}`);
    return { form, reached: from[i] - under[i] };
  });
  // the red face's heights at each join, in order down the column: the
  // stops the sequence runs between, the last of them the rest
  const reachedAt = coins.filter((coin) => coin !== red).map((coin) => from[coins.indexOf(coin)] - under[coins.indexOf(coin)]);
  const stops = [start, ...reachedAt.sort((a, b) => a - b)];
  // the lowest join is where the stack rests
  stops[stops.length - 1] = rest;
  const saved = coins.map((coin) => coin.getAttribute("transform"));

  // the drawing with the red face at height g, pressed down by press
  const draw = (g, press = 0) => {
    coins.forEach((coin, i) => coin.setAttribute("transform", `translate(${x} ${Math.max(from[i], g + press + under[i]).toFixed(2)})`));
    forms.forEach(({ form, reached }) => form.setAttribute("opacity", gsap.utils.clamp(0, 1, (g - reached + SHOW) / SHOW).toFixed(3)));
  };
  const undo = () => {
    coins.forEach((coin, i) => coin.setAttribute("transform", saved[i]));
    forms.forEach(({ form }) => form.removeAttribute("opacity"));
  };

  // the scroll's way p (0–1) as the stack's height and press: each join an
  // equal share, travelling then seating
  const travel = gsap.parseEase("power2.inOut");
  const at = (p) => {
    const joins = stops.length - 1;
    const k = Math.min(joins - 1, Math.floor(p * joins));
    const t = p * joins - k;
    if (t < MOVE) return { g: stops[k] + (stops[k + 1] - stops[k]) * travel(t / MOVE), press: 0 };
    return { g: stops[k + 1], press: PRESS * Math.sin(Math.PI * ((t - MOVE) / (1 - MOVE))) };
  };

  // the heading's lines, split in place, for the depth (not in the preview)
  const heading = el.parentElement?.querySelector(".problem-head__h");
  const split = heading && !still ? SplitText.create(heading, { type: "lines", linesClass: "problem-head__line", autoSplit: true }) : null;

  const mm = gsap.matchMedia();
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, (context) => {
    if (context.conditions.reduced) {
      draw(rest);
      return undo;
    }
    // from the drawing's top 70% of the way down the screen to its middle
    // a little above the screen's
    const along = { p: 0 };
    const tween = gsap.to(along, {
      p: 1,
      ease: "none",
      onUpdate: () => {
        const { g, press } = at(along.p);
        draw(g, press);
      },
      scrollTrigger: {
        trigger: drawing,
        start: "top 70%",
        end: "center 35%",
        scrub: 0.5,
      },
    });
    draw(start);
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      undo();
    };
  });

  return {
    destroy() {
      mm.revert();
      split?.revert();
    },
  };
}
