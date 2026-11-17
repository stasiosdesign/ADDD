// -----------------------------------------
// ADDD — the reveals: headings coming in as a scramble, the card wall
// -----------------------------------------
//
// Mounted per page from the registry in site.js; each waits for the page
// to be uncovered (pageShown) before anything already on screen plays.
// gsap, ScrollTrigger and SplitText are the site's globals.

import { motion, pageShown, registerPageCleanup } from "./page.js";

/* ============================================================
   Heading reveal — the marked headings coming in as a scramble
   ============================================================
   (2026-11-16, at the user's word, in place of the lines rising into
   masks, which kept a heading empty until it was well up the screen while
   the words beside it already showed. Rebuilt the same day: the first
   version boxed every letter, which lost the font's kerning and could
   rebalance the lines, so the heading shifted as the boxes came off.)

   Every [data-split="heading"] comes in the moment it is on the screen:
   a soft front runs along it left to right; some of its letters show a
   stand-in or two first, faint (the heading's own letters, of the same
   case), and every letter fades into itself. Quiet, about a second
   however long the heading.

     - the letters never move: each is wrapped in a plain inline span (no
       box, no width: the line breaks and the kerning are the heading's
       own, measured equal to 0.2px), the real letter stays in place,
       hidden while a stand-in is drawn over it from a layer beside the
       heading (nothing is added inside it), and the spans are unwrapped
       at the end; in a flex or grid heading the letters stay together
       in one span, as the text was one item there;
     - a heading already on screen when its page arrives waits for the
       page to be uncovered (pageShown), so it comes in as it is seen;
     - with reduced motion, or in the Studio's preview, headings are left
       as they are (and styles.css never hides them).

   LINE_REVEAL stays: the testimonial quotes and the Blueprint's hero
   still rise line by line on it.
   ============================================================ */
export const LINE_REVEAL = { yPercent: 125, duration: 0.9, stagger: 0.09, ease: "power3.out", start: "clamp(top 72%)" };
// the scramble: when (the heading's top just on the screen); each letter's
// start after the one before (s; less for a long heading, so the front
// crosses it in SPREAD at most); the share of letters that show stand-ins
// (and of those, the share that show a second), how long each shows and
// how faint; and how long a letter takes to fade into itself
const SCRAMBLE_IN = { start: "clamp(top 92%)", step: 0.026, spread: 0.6, share: 0.38, twice: 0.25, flip: 0.08, faint: 0.16, settle: 0.42 };
const STANDINS = { upper: "ABCDEFGHKMNPRSTUVWXZ", lower: "abcdeghkmnoprsuvwxz", digit: "0123456789" };
const kindOf = (ch) => (/\p{Lu}/u.test(ch) ? "upper" : /\p{Ll}/u.test(ch) ? "lower" : /\p{N}/u.test(ch) ? "digit" : null);
const easeOut = (p) => 1 - (1 - p) ** 3;

// a text laid out by a flex or grid container (the FAQ panel's heading is
// one, to centre it) is one anonymous item, a block holding the whole run;
// its letters as spans straight in the container would each be an item of
// their own, the spaces between them dropped and the line unable to wrap
// ("Questions&Answers" on one line until the end, 2026-11-16). There the
// letters go into one span standing for that anonymous item.
const ITEM_PARENT = /^(inline-)?(flex|grid)$/;

function wrapLetters(heading) {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const spans = [];
  const runs = [];
  nodes.forEach((node) => {
    if (!node.nodeValue.trim()) return;
    const frag = document.createDocumentFragment();
    // the letters' home: the text's own place, or the run standing for
    // the anonymous item a flex or grid container makes of it
    let home = frag;
    if (ITEM_PARENT.test(getComputedStyle(node.parentElement).display)) {
      home = document.createElement("span");
      home.className = "scramble-run";
      frag.append(home);
      runs.push(home);
    }
    let gap = "";
    for (const ch of node.nodeValue) {
      if (!ch.trim()) {
        gap += ch;
        continue;
      }
      if (gap) home.append(gap);
      gap = "";
      const span = document.createElement("span");
      span.className = "scramble-char";
      span.textContent = ch;
      home.append(span);
      spans.push(span);
    }
    if (gap) home.append(gap);
    node.replaceWith(frag);
  });
  return { spans, runs };
}

function unwrapLetters(heading, { spans, runs }) {
  spans.forEach((span) => span.replaceWith(span.textContent));
  runs.forEach((run) => run.replaceWith(...run.childNodes));
  heading.normalize();
}

// The stand-ins are drawn on a layer of their own, never in the heading
// or beside it (2026-11-16): an absolutely placed box inside a line, even
// with no width, is a place the line may break (a heading set exactly as
// wide as its words, a flex item, broke onto two lines for a frame), and a
// box beside it would come between it and the rules that read its
// neighbours (h2 + p). The layer is the last thing in the body, taking no
// room; each stand-in is set over its letter, in the letter's own type, and
// kept there each frame it shows (the letter's box read from a layout the
// scramble never changes).
function standinLayer() {
  const layer = document.createElement("div");
  layer.className = "scramble-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);
  return layer;
}

function dressStandin(span, glyph) {
  const cs = getComputedStyle(span);
  glyph.style.font = cs.font;
  glyph.style.letterSpacing = cs.letterSpacing;
  glyph.style.fontFeatureSettings = cs.fontFeatureSettings;
  glyph.style.color = cs.color;
}

function placeStandin(origin, span, glyph) {
  const box = span.getBoundingClientRect();
  glyph.style.lineHeight = `${box.height}px`;
  glyph.style.transform = `translate(${box.left - origin.left + box.width / 2}px, ${box.top - origin.top}px) translateX(-50%)`;
}

function scrambleIn(heading) {
  const wrapped = wrapLetters(heading);
  const { spans } = wrapped;
  // the stand-ins: the heading's own letters of each case, or a calm set
  const own = { upper: new Set(), lower: new Set(), digit: new Set() };
  spans.forEach((s) => own[kindOf(s.textContent)]?.add(s.textContent));
  const pools = Object.fromEntries(Object.entries(own).map(([k, set]) => [k, set.size > 3 ? [...set] : [...STANDINS[k]]]));
  const letters = spans.map((span) => {
    const kind = kindOf(span.textContent);
    const flips = kind && Math.random() < SCRAMBLE_IN.share ? (Math.random() < SCRAMBLE_IN.twice ? 2 : 1) : 0;
    span.style.opacity = "0";
    return { span, pool: kind ? pools[kind] : null, flips, shown: -1, glyph: null, done: false };
  });
  const layer = letters.some((l) => l.flips) ? standinLayer() : null;
  gsap.set(heading, { visibility: "visible" });
  const step = Math.min(SCRAMBLE_IN.step, SCRAMBLE_IN.spread / Math.max(1, letters.length));
  let t = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    gsap.ticker.remove(tick);
    layer?.remove();
    unwrapLetters(heading, wrapped);
  };
  function tick(_time, deltaMs) {
    t += Math.min(deltaMs, 34) / 1000;
    let left = false;
    const origin = layer?.getBoundingClientRect();
    letters.forEach((letter, i) => {
      if (letter.done) return;
      const local = t - i * step;
      if (local < 0) {
        left = true;
        return;
      }
      const { span } = letter;
      const scrambling = letter.flips * SCRAMBLE_IN.flip;
      if (local < scrambling) {
        // a stand-in over the letter (the letter itself still hidden),
        // fading up to faint
        const flip = Math.floor(local / SCRAMBLE_IN.flip);
        if (flip !== letter.shown) {
          letter.shown = flip;
          let pick = letter.pool[Math.floor(Math.random() * letter.pool.length)];
          if (pick === span.textContent) pick = letter.pool[(letter.pool.indexOf(pick) + 1) % letter.pool.length];
          if (!letter.glyph) {
            letter.glyph = document.createElement("span");
            letter.glyph.className = "scramble-layer__glyph";
            layer.append(letter.glyph);
            dressStandin(span, letter.glyph);
          }
          letter.glyph.textContent = pick;
        }
        placeStandin(origin, span, letter.glyph);
        letter.glyph.style.opacity = String(SCRAMBLE_IN.faint * Math.min(1, local / SCRAMBLE_IN.flip));
        left = true;
        return;
      }
      // the letter itself, fading in (from faint, after a stand-in)
      if (letter.glyph) {
        letter.glyph.remove();
        letter.glyph = null;
      }
      const p = Math.min(1, (local - scrambling) / SCRAMBLE_IN.settle);
      const from = letter.flips ? SCRAMBLE_IN.faint : 0;
      if (p < 1) {
        span.style.opacity = String(from + (1 - from) * easeOut(p));
        left = true;
      } else {
        span.style.opacity = "";
        letter.done = true;
      }
    });
    if (!left) finish();
  }
  gsap.ticker.add(tick);
  return finish;
}

export function initLineReveal(container) {
  if (motion.reduced || document.documentElement.hasAttribute("data-draft")) return;

  container.querySelectorAll('[data-split="heading"]').forEach((heading) => {
    // held hidden until it comes in (styles.css: past the stylesheet's own
    // fallback, which shows every heading after 3s should no script run)
    heading.setAttribute("data-scramble-pending", "");
    let stop = null;
    const play = () => {
      if (stop) return;
      heading.removeAttribute("data-scramble-pending");
      stop = scrambleIn(heading);
    };
    const trigger = ScrollTrigger.create({
      trigger: heading,
      start: SCRAMBLE_IN.start,
      once: true,
      onEnter: () => pageShown().then(play),
    });
    // A heading near the top of its page has its start clamped to the
    // top, which a page arriving at the top sits exactly on and
    // ScrollTrigger does not count as entered; once the page is seen, any
    // heading the scroll has already reached comes in too.
    pageShown().then(() => {
      if (trigger.scroll() >= trigger.start) play();
    });

    registerPageCleanup(() => {
      trigger.kill();
      stop?.();
      heading.removeAttribute("data-scramble-pending");
      gsap.set(heading, { clearProps: "visibility" });
    });
  });
}

/* ============================================================
   Hero rise — a service hero's lede and buttons coming in
   ============================================================
   A service page's hero (ServiceHero.astro) opens on the card's own
   parts, and what the card does not have comes in once the page is in
   view (pageShown): the heading's lines rise (the line reveal above),
   and a beat behind them each [data-hero-rise] rises a little and fades
   up, in turn, on the line reveal's ease, the wipe having uncovered the
   hero with them still out. Only transform and opacity, cleared once they are in; with reduced
   motion, or in the Studio's preview, they are simply there.
   ============================================================ */
const HERO_RISE = { rise: 1.25, delay: 0.3, duration: 0.9, stagger: 0.1 };

export function initHeroRise(container) {
  if (motion.reduced || document.documentElement.hasAttribute("data-draft")) return;
  const items = [...container.querySelectorAll("[data-hero-rise]")];
  if (!items.length) return;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  gsap.set(items, { opacity: 0, y: HERO_RISE.rise * rem });
  let tween = null;
  pageShown().then(() => {
    if (!items[0].isConnected) return;
    tween = gsap.to(items, {
      opacity: 1,
      y: 0,
      delay: HERO_RISE.delay,
      duration: HERO_RISE.duration,
      stagger: HERO_RISE.stagger,
      ease: LINE_REVEAL.ease,
      clearProps: "transform,opacity",
    });
  });
  registerPageCleanup(() => {
    tween?.kill();
    gsap.set(items, { clearProps: "transform,opacity" });
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
