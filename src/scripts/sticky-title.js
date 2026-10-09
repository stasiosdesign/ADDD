/* ============================================================
   Sticky Title Scroll Effect (Osmo Supply), on the page registry
   ------------------------------------------------------------
   The resource's own timeline: one master timeline scrubbed from the
   held frame's run (its track) at 40% of the screen to its foot at the
   screen's foot, each heading's characters faded in in order and, for
   every heading but the last, taken back out from the end before the
   next comes in, a little overlapped.

   Adapted to the site:
     - it is mounted per page against the Barba container (initStickyTitle
       in site.js) and hands back a destroy that undoes it all;
     - it is a touch slower than the resource: each character takes
       longer to come in, the characters follow one another over a longer
       stretch, and the scrub eases after the scroll (SMOOTH) rather than
       sitting on it, so the fade reads as unhurried;
     - each character comes in in the site's red and settles to the
       heading's white just behind it, so a thin edge of red runs along
       the line as it fades in, and none is left once it has;
     - the last heading is held a moment once it has come in, so it can
       be read in full before the section lets go.

   Nothing runs with reduced motion; sticky-title.css lays the headings
   out one after another instead.

   Markup: src/components/StickyTitle.astro.
   ============================================================ */
// the resource's 0.7s reveal and fade, the overlap between headings, and
// how long the last is held, in the timeline's units
const REVEAL = 1;
const FADE_OUT = 0.85;
const OVERLAP = 0.15;
const HOLD = 0.35;
// how long each character takes to come in; when, after it starts to, it
// turns from red to white, and how quickly — so only the few characters
// at the leading edge are red at any moment, in the same units
const CHAR_IN = 0.5;
const RED_FOR = 0.22;
const CHAR_SETTLE = 0.3;
// the scrub's ease after the scroll (s)
const SMOOTH = 0.8;

export function mountStickyTitle(wrap) {
  const headings = [...wrap.querySelectorAll('[data-sticky-title="heading"]')];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const styles = getComputedStyle(wrap);
    const red = styles.getPropertyValue("--c-red").trim() || "#c40000";

    const masterTl = gsap.timeline({
      scrollTrigger: {
        // the held frame's run, after anything the section opens on
        trigger: wrap.querySelector('[data-sticky-title="track"]') || wrap,
        start: "top 40%",
        // to the held frame's release, so the frame lets go the moment the
        // last statement has fully come in
        end: "bottom bottom",
        scrub: SMOOTH,
      },
    });

    const splits = headings.map((heading, index) => {
      // the whole heading for screen readers, its split words hidden
      heading.setAttribute("aria-label", heading.textContent);
      const split = new SplitText(heading, { type: "words,chars" });
      split.words.forEach((word) => word.setAttribute("aria-hidden", "true"));

      // the stacked headings, hidden by the CSS until now
      gsap.set(heading, { visibility: "visible" });
      const white = getComputedStyle(heading).color;
      // the red a character comes in with, mostly eased into the heading's
      // white, so it reads as a faint warm edge rather than a red line
      const [r1, g1, b1] = gsap.utils.splitColor(red);
      const [r2, g2, b2] = gsap.utils.splitColor(white);
      const mix = (a, b) => Math.round(a + (b - a) * 0.6);
      const accent = `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;

      // opacity, not autoAlpha: autoAlpha writes visibility as well, a
      // second inline style per character on every frame of the scroll,
      // and a character at opacity 0 is as invisible without it. (Chrome
      // still lays the heading out again on the frame a character's opacity
      // leaves zero, as it did with autoAlpha: the one cost left in a fade
      // that is per character, well under a millisecond a frame.)
      const headingTl = gsap.timeline();
      headingTl.fromTo(split.chars, { opacity: 0, color: accent }, {
        opacity: 1,
        duration: CHAR_IN,
        stagger: { amount: REVEAL, from: "start" },
      }, 0);
      headingTl.to(split.chars, {
        color: white,
        duration: CHAR_SETTLE,
        ease: "none",
        stagger: { amount: REVEAL, from: "start" },
      }, RED_FOR);
      if (index < headings.length - 1) {
        headingTl.to(split.chars, {
          opacity: 0,
          stagger: { amount: FADE_OUT, from: "end" },
          duration: FADE_OUT,
        });
      }
      masterTl.add(headingTl, index === 0 ? 0 : `-=${OVERLAP}`);
      return split;
    });
    // a run of statements holds the last a moment to be read; a single one
    // lets go as soon as it has come in, with no scroll left empty after it
    if (headings.length > 1) masterTl.to({}, { duration: HOLD });

    // Run the timeline through once now, while the page is still covered.
    // A tween reads its start values off the element's computed style the
    // first time it renders; left to the scroll, each character's tweens
    // did that as the scrub first reached them, each read coming between
    // the writes to the characters before it and so forcing a style
    // recalculation of its own — some 600 of them, about 100 ms, spread
    // over the first scroll through the section as stalls.
    masterTl.progress(1).progress(0);

    return () => {
      masterTl.scrollTrigger?.kill();
      masterTl.kill();
      splits.forEach((split) => split.revert());
      headings.forEach((heading) => {
        heading.removeAttribute("aria-label");
        gsap.set(heading, { clearProps: "visibility" });
      });
    };
  });

  return { destroy: () => mm.revert() };
}
