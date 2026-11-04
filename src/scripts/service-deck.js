// -----------------------------------------
// ADDD — the service deck's horizontal run
// -----------------------------------------
//
// The homepage's four routes (ServiceDeck.astro) side by side on a track,
// in a stage that sticks to the screen while the page's scroll carries the
// track across, one card after another, and lets go once the last is in
// view (service-deck.css). The stage is held by CSS (position: sticky), so
// it follows the scroll exactly; this moves the track, pixel for pixel
// with the scroll, so a card leaves at the speed the page was moving.
//
// The turns: rather than the page stopping dead as the track starts (a
// corner), the cards come round a quarter circle. From a radius (CURVE, a
// share of the screen's height) before the stage sticks, it slows to a
// stop under the scroll (its cards held a little lower than where the page
// has them, translateY) while the track gathers speed from rest, the cards
// moving at the scroll's own speed all the way round; the way out is the
// same turned round. The turn takes the track a radius across, so the
// first card comes up that far right of the middle and is in the middle
// both ways just as the turn ends; the last is in the middle as the way
// out begins, and leaves as far left. The stage still sticks and lets go
// where CSS has it; going round is a little shorter than going to the
// corner and on, so the run is shortened to match.
//
// A bar under the nav (data-service-deck-progress) fills from the first
// card in the middle to the last, shown only while the stage stands still
// (faded in as it sticks and out before it lets go), so it never moves
// with the page.
//
// The cards either side of the middle are held back a little (opacity),
// so the one in the middle leads.
//
// Everything is measured on a refresh (the stretch, the track's way; the
// nav's foot and the bar's place, again as the run starts); a scroll frame
// writes transforms and opacities and reads nothing. Both run back
// exactly the other way. Below 768px the cards are in the page's flow
// (service-deck.css) and nothing here runs. Under reduced motion the track
// still follows the scroll, which the reader moves, but without the curves.

// how long each turn is, either side of where the stage sticks (or lets go):
// a share of the screen's height (and so how far off the middle the first
// card comes up, and the last leaves), never more than a card's step
const CURVE = 0.15;
// how far under the nav's bar the progress bar runs, in px
const BAR_GAP = 8;
// how far a card a step from the middle is held back (its opacity's loss)
const DIM = 0.4;

/**
 * Run a deck's cards across its stage with the scroll. `scrollTo(y)` takes
 * the page to a place (the site's glide), for a card reached by the keyboard.
 */
export function mountServiceDeck(root, { reducedMotion = false, scrollTo } = {}) {
  const run = root.querySelector("[data-service-deck-run]");
  const stage = root.querySelector("[data-service-deck-stage]");
  const track = root.querySelector("[data-service-deck-track]");
  const cards = [...root.querySelectorAll(".service-deck__card")];
  const bar = root.querySelector("[data-service-deck-progress]");
  const fill = bar?.firstElementChild;
  if (!run || !stage || !track || cards.length < 2) return { destroy() {} };

  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    // measured on refresh: the stage's stuck stretch (P, the scroll it
    // takes), the track's way across (W), and each turn's radius (a)
    let P = 0;
    let W = 0;
    let a = 0;

    // One turn, t into it (0 to a quarter circle's length): how far the
    // cards have come up and across, and how far they stand under the
    // stage's place in the page (sticky's own, which stops dead at a).
    // Along a quarter circle of radius a, so the cards keep the scroll's
    // speed all the way round, the page's motion turning into the track's.
    function turn(t) {
      const theta = t / a;
      const up = a * Math.sin(theta);
      return { h: a * (1 - Math.cos(theta)), y: Math.min(t, a) - up };
    }

    // The nav as it is seen while the run plays, measured as the run starts
    // (at a refresh it may still have been at the page's top, another
    // shape): its blocks' outer edges (below 992px they stand inset in a
    // clear band, so the band's own box is not what is seen). Its foot
    // goes to the stylesheet (--deck-nav), which centres the cards in what
    // is left of the screen under it; it was set from the nav's own
    // measures, so this changes nothing unless they have drifted. The bar
    // runs under it, as wide as the nav; it shows only while the stage is
    // stuck at the screen's top, so its top is the screen's.
    let navFoot = null;
    function placeNav() {
      const start = document.querySelector(".mega-nav__bar-start")?.getBoundingClientRect();
      const end = document.querySelector(".mega-nav__bar-end")?.getBoundingClientRect();
      if (!start?.height) return;
      const left = start.left;
      const right = end?.width ? end.right : start.right;
      const foot = Math.max(start.bottom, end?.height ? end.bottom : 0);
      if (navFoot === null || Math.abs(foot - navFoot) > 0.5) {
        navFoot = foot;
        root.style.setProperty("--deck-nav", `${foot}px`);
      }
      if (!bar) return;
      const box = stage.getBoundingClientRect();
      Object.assign(bar.style, {
        top: `${Math.round(foot + BAR_GAP)}px`,
        left: `${Math.round(left - box.left)}px`,
        right: "auto",
        width: `${Math.round(right - left)}px`,
      });
    }

    // The card in the middle leads; each either side is held back the
    // further it is from the middle, to DIM at a step's distance, on a
    // smooth curve so a card comes up and goes back softly.
    const settle = (v) => v * v * (3 - 2 * v);
    function dimCards(offset) {
      const step = W / (cards.length - 1) || 1;
      cards.forEach((card, i) => {
        const far = Math.min(1, Math.abs(i * step - offset) / step);
        card.style.opacity = String(+(1 - DIM * settle(far)).toFixed(3));
      });
    }

    // The track's offset, x into the run (0 to P + 2a, the stage sticking
    // at a and letting go at P + a), and the bar's fill. The track moves,
    // not the stage, whose edges stay where the page has them. h is how
    // far the track has gone, from a radius short of the first card in the
    // middle (0) to a radius past the last (W + 2a): the first card is in
    // the middle as the way in ends (T), the last as the way out begins.
    function place(x) {
      const T = (Math.PI / 2) * a;
      const L = W + 2 * a;
      let h;
      let y = 0;
      if (a <= 0) h = Math.min(W, Math.max(0, x));
      else if (x < T) ({ h, y } = turn(Math.max(0, x)));
      else if (x <= P + 2 * a - T) h = a + x - T;
      else {
        // the way in, turned round
        const end = turn(Math.max(0, P + 2 * a - x));
        h = L - end.h;
        y = -end.y;
      }
      track.style.transform = `translate3d(${a - h}px, ${y}px, 0)`;
      dimCards(h - a);
      if (bar) {
        // from the first card in the middle to the last; shown from where
        // the stage sticks (a) to where it lets go (P + a), faded in and
        // out over the rest of each turn, while it stands still
        const fade = Math.max(1, T - a);
        const clamp = (v) => Math.min(1, Math.max(0, v));
        bar.style.opacity = String(clamp((x - a) / fade) * clamp((P + a - x) / fade));
        fill.style.transform = `scaleX(${W ? clamp((h - a) / W) : 0})`;
      }
    }

    const trigger = ScrollTrigger.create({
      trigger: run,
      // from the stage's top a turn's length under the screen's top, to its
      // foot a turn's length over where it lets go
      start: () => `top ${a}px`,
      end: () => `bottom ${stage.offsetHeight - a}px`,
      invalidateOnRefresh: true,
      onRefreshInit: () => {
        // laid out at rest while the page is measured
        track.style.transform = "";
        // the track's way: from the first card in the middle to the last
        W = Math.max(0, cards[cards.length - 1].offsetLeft - cards[0].offsetLeft);
        a = reducedMotion ? 0 : Math.min(CURVE * window.innerHeight, W / (cards.length - 1));
        // the turns add a radius of the track's way at each end (W + 2a in
        // all) and go round rather than across the corner, which is shorter
        // by (4 − π)a: the stage stands still for the rest
        P = W + 2 * a - (4 - Math.PI) * a;
        run.style.height = `${stage.offsetHeight + P}px`;
      },
      onRefresh: (self) => {
        if (self.isActive) placeNav();
        place(self.progress * (P + 2 * a));
      },
      onUpdate: (self) => place(self.progress * (P + 2 * a)),
      // a layer for the track, each card (its opacity) and the bar's fill
      // only while they move
      onToggle: (self) => {
        if (self.isActive) placeNav();
        const on = self.isActive;
        track.style.willChange = on ? "transform" : "";
        cards.forEach((card) => (card.style.willChange = on ? "opacity" : ""));
        if (fill) fill.style.willChange = on ? "transform" : "";
      },
    });

    // A card reached by the keyboard is brought onto the stage: the page
    // goes to where the track has it in full (the stage clips, never
    // scrolls, so focus cannot move the track behind the scroll's back)
    const onFocus = (event) => {
      const i = cards.findIndex((card) => card.contains(event.target));
      if (i < 0 || !scrollTo) return;
      // each in the middle once the track has gone its share of the way,
      // the first as the way in ends
      const x = (Math.PI / 2) * a + (W * i) / (cards.length - 1);
      const at = trigger.start + x;
      if (Math.abs(trigger.scroll() - at) > 1) scrollTo(at);
    };
    root.addEventListener("focusin", onFocus);

    return () => {
      root.removeEventListener("focusin", onFocus);
      trigger.kill();
      run.style.height = "";
      track.style.transform = "";
      track.style.willChange = "";
      cards.forEach((card) => Object.assign(card.style, { opacity: "", willChange: "" }));
      root.style.removeProperty("--deck-nav");
      bar?.removeAttribute("style");
      fill?.removeAttribute("style");
    };
  });

  return { destroy: () => mm.revert() };
}
