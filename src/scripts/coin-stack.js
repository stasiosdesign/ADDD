/* ============================================================
   Coin stack — the coins building the logo as the page scrolls past
   (src/components/CoinStack.astro, src/styles/coin-stack.css)
   ------------------------------------------------------------
   Nothing holds the page: the drawing follows the scroll, from its top
   coming up the screen to its middle reaching the screen's.
   The column closes up as one piece: the four gaps between the coins
   each close on their own eased curve, the top gap first and the lowest
   last, but the curves overlap (OVERLAP), so for most of the way the
   coins are moving together, the red one fastest, and the stack folds
   down in one continuous movement rather than a coin at a time. The
   lowest coin stands on the floor throughout; every coin's place is its
   gap above the one under it, so the column keeps its order and no coin
   ever passes another. As each gap closes, the form the coin under it
   carries appears on the red face, so the logo is still built a form
   at a time, the forms arriving in quick overlapping succession.
   Each coin's places come from the markup (data-from: its face's height
   apart; data-under: how far under the red face it rides once joined;
   data-rest on the section: where the red face comes to rest). Under
   reduced motion the stack is simply finished. GSAP and ScrollTrigger
   are the site's globals.

   The heading the coins are set into stands still (it has no line
   reveal), but it is split into its lines here, without moving them, so
   each line can take its own place about the coins (styles.css: the
   first line under them, the second over), autoSplit keeping the lines
   true as the width or the webfont changes. Not in the Studio's
   preview, where the Visual editor writes into the heading.
   ============================================================ */

// how far before a gap closes the form under it starts to show on the
// red face, in the drawing's units
const SHOW = 12;
// how much of each gap's share of the scroll's way it shares with the
// next: at 0.6 a gap sets off when the one above it is two fifths of the
// way closed, so the coins are moving together for most of the way
const OVERLAP = 0.6;

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
  // The column top first, each coin's height measured as the red face's
  // would be with that coin under it (from - under), so a coin has joined
  // the one above when the two heights meet. The gaps between them, top
  // first, close from where the markup sets them to nothing; the lowest
  // coin stands where it is, on the stack's rest (data-rest).
  const order = coins.map((_, i) => i).sort((a, b) => from[a] - from[b]);
  const height = order.map((i) => from[i] - under[i]);
  height[0] = start - under[coins.indexOf(red)];
  height[order.length - 1] = rest;
  const gaps = order.slice(0, -1).map((_, k) => height[k + 1] - height[k]);
  // each form on the red face, with the gap whose closing brings it
  const forms = [...red.querySelectorAll("[data-coin-form]")].map((form) => {
    const i = coins.findIndex((coin) => coin.dataset.coin === `form-${Number(form.dataset.coinForm) + 1}`);
    return { form, gap: order.indexOf(i) - 1 };
  });
  const saved = coins.map((coin) => coin.getAttribute("transform"));

  // The drawing at the scroll's way p (0–1): each gap's share of it, from
  // its own start on, eased in and out, so it sets off and settles
  // gently; the coins placed from the lowest up, each its gap above the
  // one under it.
  const close = gsap.parseEase("sine.inOut");
  const span = 1 / (1 + (gaps.length - 1) * (1 - OVERLAP));
  const lag = span * (1 - OVERLAP);
  const draw = (p) => {
    const left = gaps.map((gap, k) => gap * (1 - close(gsap.utils.clamp(0, 1, (p - k * lag) / span))));
    let h = height[order.length - 1];
    for (let k = order.length - 1; k >= 0; k--) {
      if (k < order.length - 1) h -= left[k];
      const i = order[k];
      coins[i].setAttribute("transform", `translate(${x} ${(h + under[i]).toFixed(2)})`);
    }
    forms.forEach(({ form, gap }) => form.setAttribute("opacity", gsap.utils.clamp(0, 1, (SHOW - left[gap]) / SHOW).toFixed(3)));
  };
  const undo = () => {
    coins.forEach((coin, i) => coin.setAttribute("transform", saved[i]));
    forms.forEach(({ form }) => form.removeAttribute("opacity"));
  };

  // the heading's lines, split in place, for the depth (not in the preview)
  const heading = el.parentElement?.querySelector(".problem-head__h");
  const split = heading && !still ? SplitText.create(heading, { type: "lines", linesClass: "problem-head__line", autoSplit: true }) : null;

  const mm = gsap.matchMedia();
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, (context) => {
    if (context.conditions.reduced) {
      draw(1);
      return undo;
    }
    // from the drawing's top 70% of the way down the screen to its middle
    // a little above the screen's
    const along = { p: 0 };
    const tween = gsap.to(along, {
      p: 1,
      ease: "none",
      onUpdate: () => draw(along.p),
      scrollTrigger: {
        trigger: drawing,
        start: "top 70%",
        end: "center 35%",
        scrub: 0.5,
      },
    });
    draw(0);
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
