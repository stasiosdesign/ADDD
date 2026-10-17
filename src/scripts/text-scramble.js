// -----------------------------------------
// ADDD — text links: the scramble and the dotted underline
// -----------------------------------------
//
// The hover every link set in text shares (nav-link.css): bound once for
// the nav's bar (nav.js) and with each page for the page's own links, the
// footer's among them (the page registry, site.js). Listeners live on the
// links, so they leave with their page. gsap is the site's global.

import "./gsap-setup.js";
import { motion } from "./page.js";
import { DECODE } from "./slash-field.js";

/* ============================================================
   Text links — the label decodes and a dotted line draws under it
   ============================================================
   The site's one hover for a link set in text: the nav bar's links, the
   footer's, and the text links in the pages (.nav-link with its label in
   NavLinkLabel.astro: the "Learn more" kind, the contact lists).
   Buttons, cards and the nav's dropdown cards keep their own.

   Pointed at, or reached by the keyboard, a link's label runs a
   short scramble through itself, left to right: a band a couple of
   letters wide (NAV_SCRAMBLE.band) passes along the word, each
   letter in it flickering through the hero's own characters (the
   Slash Field's DECODE, in lower case) in a faint tint of the site's
   red (nav.css; AEC Tech Partners' in its page's blue) and settling
   back as the band moves on, so the word is always mostly itself.

   The word never changes length or moves. Only its letters scramble —
   never a space, so it never gains a word — one character for one, and
   each only into characters no wider than itself in the label's own
   face (measured once per label): a letter too narrow for any (an i, an
   l) keeps its shape and takes only the tint. For the scramble each
   letter stands in a box of exactly its own advance in the set word
   (kerning and all, read off the text itself before it is split), the
   word held to its own width. A stand-in character is centred in its
   letter's box (and clipped to it, should a face ever measure
   otherwise); the letter itself always stands where it does in the word,
   at its own pen position, a kerned T overhanging its neighbour as it
   does at rest. The label is put back as plain text once the band has passed.
   A pointer coming back part-way starts the band again from the left,
   in the boxes already there. Not with reduced motion: the label stays
   as it is (the line simply shows), and keyboard focus shows its ring.
   The label's words are read as each run starts, so a label the Studio's
   Visual editor has rewritten scrambles its new words.

   The same band draws a dotted underline (nav-link.css): a row of dots
   the label's width, evenly spaced from its first letter's edge to its
   last's, each placed on whole device pixels as it starts. A dot comes
   on as the band reaches the letter above it, flickers on and off in
   the band's tint while it is in it, and settles once it has passed, so
   the line arrives in step with the word, a little broken, and is whole
   as the word is. It stays while the link is pointed at or focused, and
   as that ends leaves from its start, dot after dot (NAV_DOTS.back), as
   a line drawn in from the left and taken out to the right (the Osmo
   underline link's motion, in dots). With reduced motion it simply
   shows and goes.
   ============================================================ */
// how long the band takes to cross a label (s): at least, at most and per
// letter; how many letters wide it is; how often a letter in it shows a
// new character (s)
const NAV_SCRAMBLE = { min: 0.34, max: 0.6, perChar: 0.035, band: 3.5, tick: 0.04 };
// the underline's dots: their size (px, rounded down to whole device
// pixels: 2, a touch over the 1.5 they were, so each dot reads as a square;
// still small, so the line stays quieter than the word), their pitch
// along the line (px, at most; the
// line is shared out evenly between its ends), how likely a dot in the
// band is to show on each tick, and how long each waits after the one
// before it as the line leaves (s)
const NAV_DOTS = { size: 2, pitch: 6, flicker: 0.6, back: 0.014 };

/** Every text link (.nav-link) in root takes the scramble; none twice. */
export function initTextScramble(root) {
  if (!root) return;
  const chars = [...DECODE.chars.toLowerCase()];
  const pick = (from) => from[Math.floor(Math.random() * from.length)];

  root.querySelectorAll(".nav-link").forEach((link) => {
    const label = link.querySelector(".nav-link__text");
    if (!label || link.scrambleBound) return;
    link.scrambleBound = true;
    let text = label.textContent;
    let boxes = null;
    let run = null;

    // the underline, in the label's box beside the label (so putting the
    // label back as text leaves it be), its dots made as it is laid out
    const line = Object.assign(document.createElement("span"), { className: "nav-link__dots" });
    line.setAttribute("aria-hidden", "true");
    label.parentElement.append(line);
    let dots = [];
    let drawn = false;

    // The dots the line's width, the first and last at its ends, each on
    // whole device pixels, and each with the place along the word (in
    // letters, as the band counts) of the letter above it. Laid out as
    // the band starts, where the line is then.
    function layDots() {
      const dpr = window.devicePixelRatio || 1;
      line.style.setProperty("--nav-dot", `${Math.max(1, Math.floor(NAV_DOTS.size * dpr)) / dpr}px`);
      const rect = line.getBoundingClientRect();
      if (!rect.width) return false;
      const size = rect.height;
      const n = Math.max(2, Math.floor((rect.width - size) / NAV_DOTS.pitch) + 1);
      if (n !== dots.length) {
        line.textContent = "";
        dots = Array.from({ length: n }, () => {
          const el = Object.assign(document.createElement("span"), { className: "nav-link__dot" });
          line.append(el);
          return { el, at: 0, on: false, tint: false };
        });
      }
      const snap = (v) => Math.round(v * dpr) / dpr;
      const step = (rect.width - size) / (n - 1);
      const y = snap(rect.top) - rect.top;
      // the letters' advances, to find the letter over each dot
      const widths = boxes?.map((b) => parseFloat(b.box.style.width) || 0) ?? [];
      const total = widths.reduce((a, w) => a + w, 0) || rect.width;
      dots.forEach((d, j) => {
        const x = snap(rect.left + j * step) - rect.left;
        d.el.style.transform = `translate(${x}px, ${y}px)`;
        let along = ((j * step + size / 2) / rect.width) * total;
        let i = 0;
        while (i < widths.length - 1 && along > widths[i]) along -= widths[i++];
        d.at = widths.length ? i + along / (widths[i] || 1) : (j / (n - 1)) * text.length;
      });
      return true;
    }

    const showDot = (d, on, tint) => {
      if (d.on !== on) d.el.classList.toggle("is--on", (d.on = on));
      if (d.tint !== tint) d.el.classList.toggle("is--scrambling", (d.tint = tint));
    };

    // the band's pass over the dots, at its place p (in letters), at the
    // run's time now
    function drawDots(p, now) {
      dots.forEach((d) => {
        if (p <= d.at) {
          showDot(d, false, false);
          d.t = 0;
        } else if (p < d.at + NAV_SCRAMBLE.band) {
          // in the band: on or off by chance, on the letters' own ticks
          if (!d.t || now - d.t >= NAV_SCRAMBLE.tick) {
            showDot(d, Math.random() < NAV_DOTS.flicker, true);
            d.t = now || 1e-6;
          }
        } else showDot(d, true, false);
      });
    }

    function showLine() {
      drawn = true;
      line.classList.add("is--drawing");
      if (!layDots()) return false;
      dots.forEach((d) => showDot(d, false, false));
      return true;
    }

    // taken out from its start, each dot a beat after the one before it,
    // so the line leaves to the right as it came in from the left
    function hideLine() {
      if (!drawn) return;
      drawn = false;
      line.classList.remove("is--drawing");
      let k = 0;
      dots.forEach((d) => {
        d.el.style.setProperty("--nav-dot-delay", d.on ? `${(k++ * NAV_DOTS.back).toFixed(3)}s` : "0s");
        showDot(d, false, false);
      });
    }

    // each letter in a box its own advance wide, read off the set text
    function split() {
      const node = label.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) return null;
      const range = document.createRange();
      const widths = [...text].map((_, i) => {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        return range.getBoundingClientRect().width;
      });
      // the characters each letter may become: those no wider than it, each
      // set once in the label itself (its face, size, tracking and features
      // all as the letters have them), out of sight, and measured there
      const probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;";
      probe.append(...chars.map((c) => Object.assign(document.createElement("span"), { textContent: c })));
      label.append(probe);
      const advance = Object.fromEntries(chars.map((c, i) => [c, probe.children[i].getBoundingClientRect().width]));
      probe.remove();
      // and the word held to its own width, whatever the letters' widths
      // add up to after rounding
      label.style.display = "inline-block";
      label.style.width = `${label.getBoundingClientRect().width}px`;
      label.textContent = "";
      return [...text].map((ch, i) => {
        const box = document.createElement("span");
        box.className = "nav-scramble__char";
        box.style.width = `${widths[i]}px`;
        box.textContent = ch;
        label.append(box);
        const fits = ch.trim() ? chars.filter((c) => c !== ch && advance[c] <= widths[i] - 0.1) : [];
        return { box, ch, fits, shown: ch, at: 0 };
      });
    }

    function restore() {
      run?.kill();
      run = null;
      boxes = null;
      label.textContent = text;
      label.style.removeProperty("display");
      label.style.removeProperty("width");
    }

    function play() {
      // the words as they stand now (the Visual editor may have changed
      // them), unless a run is part-way and they are in boxes
      if (!boxes) text = label.textContent;
      if (motion.reduced) {
        // the line whole, at once; the label as it is
        if (showLine()) dots.forEach((d) => showDot(d, true, false));
        return;
      }
      run?.kill();
      boxes ??= split();
      if (!boxes) return;
      const lined = showLine();
      const n = boxes.length;
      const state = { p: 0 };
      run = gsap.to(state, {
        // the band from just before the first letter to just past the last
        p: n + NAV_SCRAMBLE.band,
        duration: gsap.utils.clamp(NAV_SCRAMBLE.min, NAV_SCRAMBLE.max, n * NAV_SCRAMBLE.perChar),
        ease: "none",
        onUpdate() {
          const now = run.time();
          boxes.forEach((b, i) => {
            const inBand = b.ch.trim() && state.p > i && state.p < i + NAV_SCRAMBLE.band;
            if (!inBand) {
              if (b.at) {
                b.box.textContent = b.shown = b.ch;
                b.box.classList.remove("is--scrambling", "is--swapped");
                b.at = 0;
              }
              return;
            }
            if (!b.at || now - b.at >= NAV_SCRAMBLE.tick) {
              // a character that fits, or the letter itself, tinted
              b.box.textContent = b.shown = b.fits.length ? pick(b.fits) : b.ch;
              b.at = now || 1e-6;
              b.box.classList.add("is--scrambling");
              b.box.classList.toggle("is--swapped", b.shown !== b.ch);
            }
          });
          if (lined && drawn) drawDots(state.p, now);
        },
        onComplete: restore,
      });
    }

    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") play();
    });
    link.addEventListener("focus", () => {
      if (link.matches(":focus-visible")) play();
    });
    // the line goes as the last of the pointer and the keyboard's focus does
    link.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse" && !link.matches(":focus-visible")) hideLine();
    });
    link.addEventListener("blur", () => {
      if (!link.matches(":hover")) hideLine();
    });
  });
}
