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
import { latticeOf } from "./dot-field.js";

// the resource's 0.7s reveal and fade, the overlap between headings, and
// how long the last is held, in the timeline's units
const REVEAL = 1;
const FADE_OUT = 0.85;
const OVERLAP = 0.15;
const HOLD = 0.35;
// The statement starts hidden (DIM, 0: none of it showing; above 0 it
// would wait on the page, dimmed) and comes in word by word, like lights
// switched on down a row:
// each word comes up quickly (WORD_IN, eased out, so it switches on and
// settles rather than fading through), a touch warm as it does (the red
// mostly eased into the white, like a filament), and turns white just
// after (WARM_FOR, WARM_SETTLE). In the timeline's units.
const DIM = 0;
const WORD_IN = 0.14;
const WORD_EASE = "power3.out";
const WARM_FOR = 0.05;
const WARM_SETTLE = 0.2;
// the scrub's ease after the scroll (s)
const SMOOTH = 0.6;
// a single statement is whole a little before the frame lets go (this
// much more of the timeline, unused), so even a quick scroll, which the
// scrub eases after, has it whole as its line hands over to the stack
const END_HOLD = 0.25;

export function mountStickyTitle(wrap) {
  const headings = [...wrap.querySelectorAll('[data-sticky-title="heading"]')];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const styles = getComputedStyle(wrap);
    const red = styles.getPropertyValue("--c-red").trim() || "#c40000";

    // the held frame: where it is held (its sticky top) and its height
    const frame = wrap.querySelector(".sticky-title__container");
    // The run: the held frame's, after anything the section opens on;
    // held, from well before the frame takes hold to its release (the
    // track's foot at the frame's foot as held); not held (.is--static),
    // from as the statement comes up into the screen to a little over the
    // screen's middle.
    const staticRun = wrap.classList.contains("is--static");
    const run = {
      trigger: wrap.querySelector('[data-sticky-title="track"]') || wrap,
      // held, from as the statement comes up the lower part of the screen,
      // still riding up with the band's dots (so it moves with them, never
      // over them) until it and they are held together (from 992px, where
      // the frame is the statement's height; narrower, the frame is the
      // screen's height and the words its middle, half a screen under the
      // track's top)
      start: staticRun ? "top 85%" : () => (window.matchMedia("(min-width: 992px)").matches ? "top 70%" : "top 40%"),
      end: staticRun
        ? "bottom 45%"
        : () => `bottom ${(parseFloat(getComputedStyle(frame).top) || 0) + frame.offsetHeight}px`,
    };
    const masterTl = gsap.timeline({ scrollTrigger: { ...run, scrub: SMOOTH } });

    const splits = headings.map((heading, index) => {
      // the whole heading for screen readers, its split words hidden
      heading.setAttribute("aria-label", heading.textContent);
      const split = new SplitText(heading, { type: "words,chars" });
      split.words.forEach((word) => word.setAttribute("aria-hidden", "true"));
      // the words in their order with the pictures set among them
      // (StickyTitle.astro, pictures), each a word in its place: SplitText
      // leaves a picture outside its word boxes, and left out of the
      // tweens it would stand whole while the words round it are dim
      const pics = [...heading.querySelectorAll(".sticky-title__pic")];
      const words = [...heading.querySelectorAll("*")].filter((el) => split.words.includes(el) || pics.includes(el));

      // the stacked headings, hidden by the CSS until now
      gsap.set(heading, { visibility: "visible" });
      const white = getComputedStyle(heading).color;
      // the warmth a word lights up with: the red mostly eased into the
      // heading's white, so it reads as a faint warm glow, not a red word
      const [r1, g1, b1] = gsap.utils.splitColor(red);
      const [r2, g2, b2] = gsap.utils.splitColor(white);
      const mix = (a, b) => Math.round(a + (b - a) * 0.6);
      const accent = `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;

      // Opacity, not autoAlpha (which writes visibility as well, a second
      // inline style per word every frame). Per word, not per letter: a
      // word comes in whole, and there are a fifth as many to write.
      const headingTl = gsap.timeline();
      headingTl.fromTo(words, { opacity: DIM }, {
        opacity: 1,
        duration: WORD_IN,
        ease: WORD_EASE,
        stagger: { amount: REVEAL, from: "start" },
      }, 0);
      headingTl.fromTo(words, { color: white }, {
        keyframes: [
          { color: accent, duration: 0.001 },
          { color: accent, duration: WARM_FOR },
          { color: white, duration: WARM_SETTLE, ease: "none" },
        ],
        stagger: { amount: REVEAL, from: "start" },
        immediateRender: false,
      }, 0);
      if (index < headings.length - 1) {
        headingTl.to(words, {
          opacity: DIM,
          stagger: { amount: FADE_OUT, from: "end" },
          duration: FADE_OUT,
        });
      }
      // A marked phrase (StickyTitle.astro): its chip and its red ground
      // uncovered left to right with the reveal's leading edge, from the
      // moment its first letter starts in to the moment the letter after
      // its last does, its own letters fading in on it like the rest.
      // (Timed to its last letter being fully in, it ran a fade behind
      // that edge: the words after it were already showing while the end
      // of the phrase was still clipped, a gap in the middle of the line.)
      heading.querySelectorAll("[data-sticky-title-mark]").forEach((mark) => {
        const step = REVEAL / Math.max(1, split.chars.length - 1);
        const at = (i) => step * i;
        const own = split.chars.filter((char) => mark.contains(char));
        if (!own.length) return;
        const start = at(split.chars.indexOf(own[0]));
        const end = at(split.chars.indexOf(own[own.length - 1])) + step;
        headingTl.fromTo(mark, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: end - start, ease: "none" }, start);
        // and faded up with its letters, so the red ground comes in as
        // softly as the words on it rather than standing whole ahead of them
        headingTl.fromTo(mark, { opacity: DIM }, { opacity: 1, duration: end - start + WORD_IN, ease: "none" }, start);
      });
      masterTl.add(headingTl, index === 0 ? 0 : `-=${OVERLAP}`);
      return split;
    });
    // what stands over the statements (StickyTitle.astro, "above") comes up
    // as a word does with the first statement's first words, and what
    // stands under them ("after") as the last statement's settle to white
    const above = wrap.querySelector('[data-sticky-title="above"]');
    if (above) masterTl.fromTo(above, { opacity: DIM }, { opacity: 1, duration: WORD_IN, ease: WORD_EASE }, 0);
    // and what stands round them ("around": the marks), each switched on
    // in its turn, scattered as they stand, over the first statement's reveal
    const around = [...wrap.querySelectorAll('[data-sticky-title="around"] [data-float-mark]')];
    if (around.length) masterTl.fromTo(around, { opacity: DIM }, { opacity: 1, duration: WORD_IN, ease: WORD_EASE, stagger: { amount: REVEAL, from: "random" } }, 0);
    const after = wrap.querySelector('[data-sticky-title="after"]');
    if (after) masterTl.fromTo(after, { opacity: DIM }, { opacity: 1, duration: WORD_IN, ease: WORD_EASE }, `-=${WARM_SETTLE}`);
    // a run of statements holds the last a moment to be read; a single one
    // is whole a little before it lets go (END_HOLD)
    if (headings.length > 1) masterTl.to({}, { duration: HOLD });
    else masterTl.to({}, { duration: END_HOLD });

    // The dotted line beside the statement is its progress: a track of
    // dots, filled from the top as the first statement comes in, all
    // filled as it is whole. The fill flows: its edge is soft over a couple
    // of dots (sticky-title.css), so each dot brightens as the edge comes
    // to it. Where it stands is counted in the line's dots' own box, which
    // runs with the page while the frame is held (rule.leadShift, -pitch
    // to 0, approach-stack.js's). Transforms alone: the fill's window
    // comes down from above the line and the dots in it go back up by as
    // much, so they stand still in the track. The line's length and the
    // pitch are read on each refresh, never on the scroll.
    const rule = wrap.querySelector("[data-rail-lead]");
    const fill = rule?.querySelector(".sticky-title__rule-fill");
    const lit = rule?.querySelector(".sticky-title__rule-lit");
    const lead = { amount: 0, extent: 0, pitch: 18 };
    const measureLead = () => {
      if (!rule) return;
      lead.extent = rule.offsetHeight;
      lead.pitch = parseFloat(getComputedStyle(rule).getPropertyValue("--dot-pitch")) || 18;
      fillLead();
    };
    function fillLead() {
      if (!fill) return;
      const { pitch, extent } = lead;
      const box = extent + pitch;
      // the fill's edge, past the line's foot by the soft edge's length
      // once the statement is whole, so the last dot is fully lit
      const edge = -(rule.leadShift || 0) + lead.amount * (extent + 2.5 * pitch);
      fill.style.transform = `translate3d(0, ${(edge - box).toFixed(2)}px, 0)`;
      lit.style.transform = `translate3d(0, ${(box - edge).toFixed(2)}px, 0)`;
    }
    if (rule) {
      rule.leadLight = fillLead;
      // straight off the scroll, not eased after it as the words are, so
      // it is full the moment the frame lets go and the line hands over
      // to the stack (approach-stack.js), however quick the scroll; over
      // the same share of the run as the first statement's words
      const share = (REVEAL + WORD_IN) / masterTl.duration();
      const fillFrom = (self) => {
        lead.amount = gsap.utils.clamp(0, 1, self.progress / share);
        fillLead();
      };
      ScrollTrigger.create({ ...run, onUpdate: fillFrom, onRefresh: fillFrom });
      measureLead();
      ScrollTrigger.addEventListener("refresh", measureLead);
    }

    // The band's dots held still with the frame (data-sticky-title-still):
    // while the statement is held, every field of dots on the band is
    // moved down by as much as the page has scrolled since (dot-field.js,
    // shift), so on the screen the dots stand still, as the statement
    // does, and the scroll shows in nothing but the words coming in. Not
    // from the moment the frame takes hold, though, but from the moment
    // whatever the section opens on (the logo wall, data-statement-above)
    // has left the top of the screen: held sooner, its cards slid on over
    // the still dots and dots came out from under their foot as it went.
    // The hold is a whole number of the band's pitches (sticky-title.css,
    // the track's run), and the dots are held from the last whole pitch
    // before the release after the wall has gone, so at the release the
    // dots moved down stand exactly where the page's own would: the shift
    // is kept from there on, and nothing jumps. Each field keeps as much
    // of itself drawn above its top as the hold brings down (reserve). The
    // statement's dotted line stands with the field (approach-stack.js,
    // syncLead, which reads where the hold begins off the section:
    // dotsHeldFrom; the statement's grid of cells, cell-grid.js, reads
    // where it ends as well, dotsHeldTo).
    let holdDots = null;
    const field = wrap.querySelector(".sticky-title__dots");
    if (wrap.hasAttribute("data-sticky-title-still") && field) {
      const band = wrap.closest(".ink-band") || wrap;
      const fields = () => [...band.querySelectorAll(".dot-grid.band-field:not(.band-steps__dots)")].map((el) => el.dotGrid).filter(Boolean);
      const above = wrap.querySelector("[data-statement-above]");
      const hold = { from: 0, to: 0 };
      const shiftDots = (self) => {
        const s = gsap.utils.clamp(0, hold.to - hold.from, self.scroll() - hold.from);
        fields().forEach((grid) => grid.shift(s));
      };
      holdDots = ScrollTrigger.create({
        trigger: run.trigger,
        start: () => `top ${parseFloat(getComputedStyle(frame).top) || 0}px`,
        // (sub-pixel sizes, as the layout has them: offsetHeight rounds
        // each to a pixel, which can leave the run a hair off whole pitches)
        end: () => `+=${Math.max(0, run.trigger.getBoundingClientRect().height - frame.getBoundingClientRect().height)}`,
        onRefresh(self) {
          hold.to = self.end;
          let from = self.start;
          if (above) from = Math.max(from, above.getBoundingClientRect().bottom + window.scrollY);
          const pitch = latticeOf(field)?.pitch || 0;
          // (the run is a whole number of pitches, but laid out to a 64th
          // of a pixel: a hair short of one counts as one, or the dots would
          // wait a pitch after the frame takes hold)
          if (pitch > 1) from = hold.to - Math.floor((hold.to - from) / pitch + 0.05) * pitch;
          hold.from = Math.min(from, hold.to);
          wrap.dotsHeldFrom = hold.from;
          wrap.dotsHeldTo = hold.to;
          fields().forEach((grid) => grid.reserve(hold.to - hold.from));
          shiftDots(self);
        },
        onUpdate: shiftDots,
      });
    }

    // Run the timeline through once now, while the page is still covered.
    // A tween reads its start values off the element's computed style the
    // first time it renders; left to the scroll, each character's tweens
    // did that as the scrub first reached them, each read coming between
    // the writes to the characters before it and so forcing a style
    // recalculation of its own — some 600 of them, about 100 ms, spread
    // over the first scroll through the section as stalls.
    masterTl.progress(1).progress(0);

    // The held frame stands with the block's middle on the screen's
    // (sticky-title.css, --st-half: half the block's height, mark and
    // button included): measured before every refresh's measurements, so
    // whatever is set out from where the frame stands (approach-stack.js,
    // matchGap) sees it in place; never on the scroll.
    const inner = wrap.querySelector(".sticky-title__inner");
    const centre = () => wrap.style.setProperty("--st-half", `${(inner.offsetHeight / 2).toFixed(2)}px`);
    centre();
    ScrollTrigger.addEventListener("refreshInit", centre);

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", centre);
      wrap.style.removeProperty("--st-half");
      masterTl.scrollTrigger?.kill();
      masterTl.kill();
      holdDots?.kill();
      delete wrap.dotsHeldFrom;
      delete wrap.dotsHeldTo;
      splits.forEach((split) => split.revert());
      const marks = wrap.querySelectorAll("[data-sticky-title-mark]");
      if (marks.length) gsap.set(marks, { clearProps: "clipPath,opacity" });
      if (above) gsap.set(above, { clearProps: "opacity" });
      if (after) gsap.set(after, { clearProps: "opacity" });
      if (around.length) gsap.set(around, { clearProps: "opacity" });
      if (rule) {
        ScrollTrigger.removeEventListener("refresh", measureLead);
        delete rule.leadLight;
        fill.style.transform = lit.style.transform = "";
      }
      headings.forEach((heading) => {
        heading.removeAttribute("aria-label");
        gsap.set(heading, { clearProps: "visibility" });
      });
    };
  });

  return { destroy: () => mm.revert() };
}
