// -----------------------------------------
// ADDD — the reveals: headings rising line by line, the card wall
// -----------------------------------------
//
// Mounted per page from the registry in site.js; each waits for the page
// to be uncovered (pageShown) before anything already on screen plays.
// gsap, ScrollTrigger and SplitText are the site's globals.

import { motion, pageShown, registerPageCleanup } from "./page.js";

/* ============================================================
   Line reveal — the marked headings rising line by line
   ============================================================
   After the Osmo Masked Text Reveal: every [data-split="heading"]
   is split into its lines, each wrapped in a mask, and the lines rise
   into it one after another the first time the heading comes up the
   screen. Lines only, never words or letters, a short stagger and an
   ease that settles, so a heading reads as set rather than performed.

   Adapted to the site:
     - mounted per page from the registry and reverted with it;
     - a heading already on screen when its page arrives waits for the
       page to be uncovered (pageShown), so it rises as it is seen and
       not under the wipe;
     - autoSplit re-splits a heading whenever its width changes or the
       webfont arrives, so its lines are always its real lines; the
       tween handed back to SplitText is carried over to the new lines
       at the progress it had reached, so a resize never replays it;
     - SplitText's own aria handling keeps each heading read whole;
     - with reduced motion, or in the Studio's preview, headings are
       left as they are (and styles.css never hides them);
     - each line's mask is opened by the face's overhang past its line
       box (styles.css), so no glyph is cut, and a line starts far
       enough down to be wholly out of it.

   When: once the heading's top is well up the screen (28% of it up
   from the foot), so it is being looked at, not still at the edge; and
   on an ease that keeps moving long enough to be seen, rather than one
   that has done nearly all of its travel in the first quarter-second.
   ============================================================ */
export const LINE_REVEAL = { yPercent: 125, duration: 0.9, stagger: 0.09, ease: "power3.out", start: "clamp(top 72%)" };

export function initLineReveal(container) {
  if (motion.reduced || document.documentElement.hasAttribute("data-draft")) return;

  container.querySelectorAll('[data-split="heading"]').forEach((heading) => {
    let trigger = null;
    const split = SplitText.create(heading, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      linesClass: "line",
      onSplit(self) {
        trigger?.kill();
        gsap.set(heading, { visibility: "visible" });
        const reveal = gsap.from(self.lines, {
          yPercent: LINE_REVEAL.yPercent,
          duration: LINE_REVEAL.duration,
          stagger: LINE_REVEAL.stagger,
          ease: LINE_REVEAL.ease,
          paused: true,
        });
        trigger = ScrollTrigger.create({
          trigger: heading,
          start: LINE_REVEAL.start,
          once: true,
          onEnter: () => pageShown().then(() => reveal.play()),
        });
        // A heading near the top of its page has its start clamped to the
        // top, which a page arriving at the top sits exactly on and
        // ScrollTrigger does not count as entered; once the page is seen,
        // any heading the scroll has already reached rises too.
        const own = trigger;
        pageShown().then(() => {
          if (own === trigger && own.scroll() >= own.start) reveal.play();
        });
        return reveal;
      },
    });

    registerPageCleanup(() => {
      trigger?.kill();
      split.revert();
      gsap.set(heading, { clearProps: "visibility" });
    });
  });
}

/* ============================================================
   Stack cards — the Stack Diagnostic hero's card wall rising in
   ============================================================
   The cards (StackCard.astro, stack-cards.css) rise a little and fade
   into place as they come up the screen, a row at a time, each row left
   to right: those in the first screen as the page is uncovered
   (pageShown), the row peeking at its foot among them, and the rest as
   each one's top edge comes up over the screen's foot. Each card once,
   on the line reveal's ease and length. Only
   their transform and opacity move, cleared once a card has arrived,
   so its hover is its own; held by opacity alone, never visibility, so
   the keyboard still reaches a card not yet risen (and scrolls it up,
   which raises it). With reduced motion, or in the Studio's preview,
   the cards are simply there.
   ============================================================ */
const CARD_REVEAL = { rise: 1.5, duration: 0.9, stagger: 0.08, ease: "power3.out", start: "top bottom" };

export function initStackCards(container) {
  if (motion.reduced || document.documentElement.hasAttribute("data-draft")) return;

  container.querySelectorAll("[data-stack-cards]").forEach((wall) => {
    // Each card's cell is what is watched, so where a card is waiting
    // (lowered) never moves where it counts as having come up the screen.
    const cells = [...wall.children].filter((cell) => cell.querySelector(".stack-card"));
    const cards = cells.map((cell) => cell.querySelector(".stack-card"));
    if (!cards.length) return;
    // the rise, in rem, so it scales with the page (scaling.css)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    gsap.set(cards, { opacity: 0, y: CARD_REVEAL.rise * rem });
    // set to rise: the stylesheet's hold on them lets go
    wall.setAttribute("data-stack-cards-ready", "");

    const triggers = ScrollTrigger.batch(cells, {
      start: CARD_REVEAL.start,
      once: true,
      onEnter: (batch) => pageShown().then(() => gsap.to(batch.map((cell) => cell.querySelector(".stack-card")), {
        opacity: 1,
        y: 0,
        duration: CARD_REVEAL.duration,
        stagger: CARD_REVEAL.stagger,
        ease: CARD_REVEAL.ease,
        clearProps: "transform,opacity",
      })),
    });

    registerPageCleanup(() => {
      triggers.forEach((t) => t.kill());
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: "transform,opacity" });
      wall.removeAttribute("data-stack-cards-ready");
    });
  });
}
