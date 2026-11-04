// -----------------------------------------
// ADDD — a word that scrambles once as it is read
// -----------------------------------------
//
// A highlighted word in running text (data-scramble-word: the Technology
// Blueprint's three cards, ApproachStack.astro) scrambles once, briefly, in
// the site's red, and settles back to itself, when it has come up to about
// the middle of the screen: the homepage hero's word change
// (word-cycle.js) run on the word in place, its letters, pace and fitting
// shared. The word is held to its own width while it scrambles (and the
// scrambling letters spaced to fill it), so nothing on its line moves; once
// settled it is itself again, its width let go. Each word on its own
// trigger, once (it does not run again as the page is scrolled back and
// forth). Nothing runs with reduced motion: the word stands, bold.

import { registerPageCleanup, motion } from "./page.js";
import { scrambleFitter, SCRAMBLE } from "./word-cycle.js";

// where on the screen the word's top has to come up to (from the top)
const AT = "top 58%";
// how long the scramble takes, and how much of it is all scramble before
// the word starts to resolve from its left (s)
const DURATION = 1.15;
const SCRAMBLED = 0.32;

export function initScrambleWords(container) {
  if (motion.reduced || !window.ScrambleTextPlugin) return;
  container.querySelectorAll("[data-scramble-word]").forEach((el) => {
    if (el.scrambleWord) return;
    el.scrambleWord = true;
    const word = el.textContent;
    const fitter = scrambleFitter(el);
    let run = null;

    const settle = () => {
      el.textContent = word;
      gsap.set(el, { clearProps: "display,width,whiteSpace" });
    };
    const play = () => {
      fitter.read();
      // held to its own width, on its own line box, while it scrambles
      gsap.set(el, { display: "inline-block", whiteSpace: "nowrap", width: el.getBoundingClientRect().width });
      run = gsap.to(el, {
        duration: DURATION,
        ease: "power2.out",
        scrambleText: {
          text: word,
          chars: SCRAMBLE.chars,
          speed: SCRAMBLE.speed,
          revealDelay: SCRAMBLED,
          oldClass: "is--scrambling",
        },
        onUpdate: fitter.fit,
        onComplete: settle,
      });
    };
    const trigger = ScrollTrigger.create({ trigger: el, start: AT, once: true, onEnter: play });

    registerPageCleanup(() => {
      trigger.kill();
      run?.kill();
      settle();
      el.scrambleWord = false;
    });
  });
}
