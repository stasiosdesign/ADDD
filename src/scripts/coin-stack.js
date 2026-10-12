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

   The moment the stack is finished, the drawing says so: it takes
   data-coin-stack-settled and fires "coinstack:settle" (detail true),
   which the cards under the heading come in on (initProblemGrid,
   site.js). It says the opposite only once the stack is wholly back
   where it started, scrolled back up, when those cards are below the
   screen again, so nothing on screen goes away.
   ============================================================ */

// how far before a coin is reached its form starts to show on the red
// face, in the drawing's units
const SHOW = 12;

export function mountCoinStack(el) {
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
  const saved = coins.map((coin) => coin.getAttribute("transform"));

  // the drawing with the red face at height g
  const draw = (g) => {
    coins.forEach((coin, i) => coin.setAttribute("transform", `translate(${x} ${Math.max(from[i], g + under[i]).toFixed(2)})`));
    forms.forEach(({ form, reached }) => form.setAttribute("opacity", gsap.utils.clamp(0, 1, (g - reached + SHOW) / SHOW).toFixed(3)));
  };
  const undo = () => {
    coins.forEach((coin, i) => coin.setAttribute("transform", saved[i]));
    forms.forEach(({ form }) => form.removeAttribute("opacity"));
  };

  // finished, or wholly back at the start: said once each way
  let settled = false;
  const settle = (on) => {
    if (on === settled) return;
    settled = on;
    el.toggleAttribute("data-coin-stack-settled", on);
    el.dispatchEvent(new CustomEvent("coinstack:settle", { detail: on }));
  };

  const mm = gsap.matchMedia();
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" }, (context) => {
    if (context.conditions.still) {
      draw(rest);
      settle(true);
      return undo;
    }
    // the scroll's share of the way, eased in and out: from the
    // drawing's top 70% of the way down the screen to its middle a
    // little above the screen's, the heading having risen in just
    // before (its line reveal starts at 72%)
    const along = { p: 0 };
    const ease = gsap.parseEase("sine.inOut");
    const tween = gsap.to(along, {
      p: 1,
      ease: "none",
      onUpdate: () => {
        draw(start + (rest - start) * ease(along.p));
        if (along.p >= 0.985) settle(true);
        else if (along.p <= 0.001) settle(false);
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
    },
  };
}
