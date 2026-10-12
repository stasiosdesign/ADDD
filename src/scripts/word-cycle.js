/* ============================================================
   Word cycle — a heading's word that turns into the next
   (the homepage hero's "Better workflow decisions")
   ------------------------------------------------------------
   The word (data-word-cycle="workflow|technology|software", set
   by Hero.astro) holds for a while, then scrambles into the next
   and settles, and so on round the list. Each change is one
   timeline:

     - the word's width eases from the old word's to the new one's,
       so the words after it on the line glide over to make room,
       rather than jump when the letters land;
     - over the same time the letters scramble (ScrambleTextPlugin,
       as the hero field's labels do) and resolve into the new word
       from the left, the length running from the old word's to the
       new one's; the letters still scrambling are the field's
       decoding red (.is--scrambling, styles.css) and each settles
       to the ink as it resolves.

   It waits while the heading is off screen, so a change never
   starts unseen, and does nothing under reduced motion. The
   heading keeps one name for screen readers, with the word it is
   written with. GSAP and ScrambleTextPlugin are the site's globals.
   ============================================================ */
const CYCLE = {
  // how long each word holds, and how long a change takes (s). The ease is
  // Osmo's Rotating Text's: the word lets go decisively, travels and
  // settles softly, and the whole word turns to scramble at once, in its
  // red, before the new one starts to resolve.
  hold: 2.2,
  change: 1,
  ease: "power4.inOut",
  // how long the word is all scramble before the new one starts to resolve
  scrambled: 0.25,
  // lower case, as the words are, and only the letters of an even width
  // with nothing above or below the x-height: the scramble keeps close to
  // the word's box as it moves, and stays calm in it
  chars: "aceonsuvxz",
  speed: 0.5,
  // the most the scrambling letters' spacing is eased by to fill the word's
  // box, in ems
  fit: 0.12,
};

export function mountWordCycle(el) {
  const words = (el.dataset.wordCycle || "").split("|").filter(Boolean);
  if (words.length < 2 || !window.ScrambleTextPlugin) return { destroy() {} };
  const heading = el.closest("h1, h2, h3, h4, p") || el.parentElement;
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const written = el.textContent;
    heading.setAttribute("aria-label", heading.textContent.replace(/\s+/g, " ").trim());

    // A copy of the word, out of sight in the heading, to measure the next
    // word in the heading's own type.
    const ruler = document.createElement("span");
    ruler.className = el.className;
    ruler.setAttribute("aria-hidden", "true");
    ruler.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none";
    heading.appendChild(ruler);
    const widthOf = (word) => {
      ruler.textContent = word;
      return ruler.getBoundingClientRect().width;
    };

    // The scrambling letters, spaced a touch closer or wider so the word
    // fills its box exactly: the random letters are seldom the width of the
    // word's own, and would otherwise leave a gap before the next word or
    // run under the clip (styles.css). Never more than a little either way.
    const range = document.createRange();
    const fit = () => {
      const scrambling = el.querySelector(".is--scrambling");
      if (!scrambling) return;
      scrambling.style.letterSpacing = "0px";
      range.selectNodeContents(el);
      const spare = parseFloat(el.style.width) - range.getBoundingClientRect().width;
      const most = parseFloat(getComputedStyle(el).fontSize) * CYCLE.fit;
      const each = gsap.utils.clamp(-most, most, spare / scrambling.textContent.length);
      scrambling.style.letterSpacing = `${each}px`;
    };

    let index = words.indexOf(written);
    if (index < 0) index = 0;
    let change = null;
    let wait = null;
    let onScreen = true;

    const turn = () => {
      wait = null;
      // off screen, wait for it to come back (the observer, below)
      if (!onScreen) return;
      index = (index + 1) % words.length;
      const word = words[index];
      const from = el.getBoundingClientRect().width;
      const to = widthOf(word);
      change = gsap.timeline({
        onComplete() {
          change = null;
          // back to the word's own width, so it follows the type if the
          // page is resized
          el.textContent = word;
          gsap.set(el, { clearProps: "width" });
          hold();
        },
      });
      // the width and the letters on one curve, so the letters fill the
      // word's box as it moves rather than run ahead of it or lag behind
      change
        .fromTo(el, { width: from }, { width: to, duration: CYCLE.change, ease: CYCLE.ease }, 0)
        .to(el, {
          duration: CYCLE.change,
          ease: CYCLE.ease,
          scrambleText: {
            text: word,
            chars: CYCLE.chars,
            speed: CYCLE.speed,
            revealDelay: CYCLE.scrambled,
            oldClass: "is--scrambling",
          },
          onUpdate: fit,
        }, 0);
    };
    const hold = () => {
      wait = gsap.delayedCall(CYCLE.hold, turn);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !change && !wait) hold();
    });
    observer.observe(heading);
    hold();

    return () => {
      observer.disconnect();
      wait?.kill();
      change?.kill();
      ruler.remove();
      el.textContent = written;
      gsap.set(el, { clearProps: "width" });
      heading.removeAttribute("aria-label");
    };
  });

  return { destroy: () => mm.revert() };
}
