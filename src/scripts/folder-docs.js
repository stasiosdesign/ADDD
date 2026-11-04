// -----------------------------------------
// ADDD — a folder's document, drawn out of it
// -----------------------------------------
//
// The Workflow Workshop's folders (DeckFolder.astro, opens) each open a
// document (FolderDocument.astro): a native modal <dialog>, so the browser
// keeps the keyboard inside it, closes it on Escape (handled here, to
// animate it) and gives the focus back to the folder after.
//
// Opening, as a sheet is pulled out of a folder: the folder opens a little
// further (is--pulled, service-deck.css); the paper appears exactly where
// the folder's inner sheet is, as wide as it, and only the strip of it
// that stands above the folder's front is seen (a clip at the front's top
// edge); it rises out of the folder, more of it showing below that edge
// as it comes up, and then grows to its place in the window as the clip
// opens to the whole sheet. The scrim fades in behind it a beat after it
// has left the folder, so the folder is still clear as the paper leaves
// it, and the close button comes in once the paper is all but in place.
// Closing is the way back: the button goes, the paper shrinks back over
// the folder, sinks into it below the front's edge and is gone, and the
// folder settles. Transforms, a clip and opacity only, on the Web
// Animations API; one direction cut short by the other starts from
// wherever the paper is, so quick clicks never jump.
//
// The paper is a fixed document viewer: it keeps its place in the window
// and only its writing scrolls, inside it (folder-doc.css), on a Lenis of
// its own, as the page scrolls on the page's: made as the paper opens
// (its wrapper the paper's scrolling box, its content the writing),
// driven by the site's one ticker, held still while the paper moves, and
// taken down as it closes. The dialog is marked data-lenis-prevent, so the
// page's Lenis leaves every wheel over it alone (a Lenis looks for that
// mark only below its own wrapper, so the paper's is not stopped by it);
// the page's own scroll stops while the paper is open and starts again
// after, where it was. With reduced motion the paper scrolls natively and
// opens and closes at once.
//
// Only elements marked data-folder-open take part: the homepage's folders
// (links) are untouched.

import { lenis } from "./scroll.js";
import { motion, registerPageCleanup } from "./page.js";

// The curves (2026-11-04, a second pass: softer, and a touch more
// restrained): the rise out of the folder a quick start that eases as the
// sheet clears the folder's mouth; the growth to its place a quick start
// that lands softly (a quint out, gentler than the expo before), so the
// sheet is in place almost at once and settles; going back, an even pull
// to over the folder and a quick, soft drop into it.
const EASE_RISE = "cubic-bezier(0.25, 0.8, 0.35, 1)";
const EASE_OPEN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_BACK = "cubic-bezier(0.45, 0, 0.3, 1)";
const EASE_SINK = "cubic-bezier(0.5, 0, 0.75, 0.5)";
const OPEN_MS = 600;
const CLOSE_MS = 440;
// how far the paper rises out of the folder before it grows (rem)
const RISE = 2.5;
// the share of the opening spent rising, and of the closing spent
// travelling back over the folder
const RISE_AT = 0.28;
const BACK_AT = 0.55;

const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export function initFolderDocs(container) {
  container.querySelectorAll("[data-folder-open]").forEach((button) => {
    const dialog = document.getElementById(button.dataset.folderOpen);
    const folder = button.closest(".deck-folder");
    if (!dialog || !folder || button.folderDoc) return;
    const paper = dialog.querySelector(".folder-doc__paper");
    const scrim = dialog.querySelector(".folder-doc__scrim");
    const scroller = dialog.querySelector("[data-folder-doc-scroll]");
    const writing = dialog.querySelector(".folder-doc__sheet") || scroller.firstElementChild;
    const closer = dialog.querySelector(".folder-doc__close");
    const sheet = folder.querySelector(".deck-folder__sheet") || folder;
    const front = folder.querySelector(".deck-folder__front") || folder;
    let running = [];
    let state = "closed";
    let pageY = 0;
    let smooth = null; // the paper's own Lenis while it is open

    // the paper's smooth scroll, driven by the site's one ticker
    const tick = (time) => smooth?.raf(time * 1000);
    function startScroll() {
      if (smooth || motion.reduced || !window.Lenis || !writing) return;
      smooth = new Lenis({ wrapper: scroller, content: writing, lerp: 0.1, wheelMultiplier: 1 });
      gsap.ticker.add(tick);
    }
    function stopScroll() {
      if (!smooth) return;
      gsap.ticker.remove(tick);
      smooth.destroy();
      smooth = null;
    }
    let unpull = 0;

    // The paper over the folder, from its own resting place (measured with
    // nothing running): its top on the inner sheet's top, centred on it and
    // as wide as it (scaled from its top), clipped below the front's top
    // edge; and the same, risen by `rise` px, with that much more of it
    // showing.
    function overFolder(rise = 0) {
      const s = sheet.getBoundingClientRect();
      const f = front.getBoundingClientRect();
      const p = paper.getBoundingClientRect();
      const h = paper.offsetHeight;
      const scale = Math.min(1, s.width / p.width);
      const dx = s.left + s.width / 2 - (p.left + p.width / 2);
      const dy = s.top - p.top - rise;
      // what stands above the front's edge, in the paper's own pixels
      const shown = Math.max(2, (f.top - s.top + rise) / scale);
      return {
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(4)})`,
        clipPath: `inset(0px 0px ${Math.max(0, h - shown).toFixed(1)}px 0px)`,
      };
    }

    // where the paper, the scrim and the button are now (part-way, if
    // something runs), then nothing running
    function settle() {
      let now = null;
      if (running.length) {
        const cs = getComputedStyle(paper);
        now = {
          transform: cs.transform,
          clipPath: cs.clipPath,
          opacity: cs.opacity,
          scrim: getComputedStyle(scrim).opacity,
          closer: getComputedStyle(closer).opacity,
        };
      }
      running.forEach((a) => a.cancel());
      running = [];
      clearTimeout(unpull);
      return now;
    }

    async function play(anims) {
      running = anims;
      try {
        await Promise.all(anims.map((a) => a.finished));
      } catch {
        return false; // cut short by the other direction
      }
      if (running !== anims) return false;
      anims.forEach((a) => a.cancel());
      running = [];
      return true;
    }

    async function open() {
      if (state === "open" || state === "opening") return;
      const now = settle();
      const fresh = !dialog.open;
      state = "opening";
      if (fresh) {
        pageY = window.scrollY;
        lenis.stop();
        dialog.showModal();
        scroller.scrollTop = 0;
        scroller.focus({ preventScroll: true });
      }
      startScroll();
      smooth?.stop();
      // measured before the folder moves: where the inner sheet stands now
      const from = now ?? { ...overFolder(), opacity: "0" };
      const risen = overFolder(RISE * rem());
      folder.classList.add("is--pulled");
      if (motion.reduced) {
        state = "open";
        smooth?.start();
        return;
      }
      const fromOpacity = now ? now.opacity : 0;
      const done = await play([
        scrim.animate([{ opacity: now ? now.scrim : 0 }, { opacity: 1 }], {
          duration: OPEN_MS * 0.5,
          delay: now ? 0 : OPEN_MS * 0.14,
          easing: "ease-out",
          fill: "both",
        }),
        paper.animate(
          now
            ? [
                { transform: from.transform, clipPath: from.clipPath, opacity: fromOpacity, easing: EASE_OPEN },
                { transform: "none", clipPath: "inset(0px 0px 0px 0px)", opacity: 1 },
              ]
            : [
                { transform: from.transform, clipPath: from.clipPath, opacity: 0, easing: EASE_RISE },
                { opacity: 1, offset: 0.05 },
                { transform: risen.transform, clipPath: risen.clipPath, opacity: 1, offset: RISE_AT, easing: EASE_OPEN },
                { transform: "none", clipPath: "inset(0px 0px 0px 0px)", opacity: 1 },
              ],
          { duration: now ? OPEN_MS * 0.7 : OPEN_MS, fill: "both" },
        ),
        // the close button, once the paper is all but in place
        closer.animate([{ opacity: now ? now.closer : 0 }, { opacity: 1 }], {
          duration: 200,
          delay: now ? 0 : OPEN_MS * 0.6,
          easing: "ease-out",
          fill: "both",
        }),
      ]);
      if (!done) return;
      state = "open";
      smooth?.start();
    }

    async function close() {
      if (state === "closed" || state === "closing") return;
      const now = settle();
      state = "closing";
      smooth?.stop();
      if (!motion.reduced) {
        // where it goes back to: measured from its resting place, the
        // folder still open
        const risen = overFolder(RISE * rem());
        const tucked = overFolder();
        const start = now ?? { transform: "none", clipPath: "inset(0px 0px 0px 0px)", opacity: "1", scrim: "1", closer: "1" };
        // the folder closes behind the paper as it sinks in
        unpull = setTimeout(() => folder.classList.remove("is--pulled"), CLOSE_MS * 0.78);
        const done = await play([
          closer.animate([{ opacity: start.closer }, { opacity: 0 }], { duration: 120, easing: "ease-in", fill: "both" }),
          scrim.animate([{ opacity: start.scrim }, { opacity: 0 }], { duration: CLOSE_MS * 0.6, easing: "ease-in", fill: "both" }),
          paper.animate(
            [
              { transform: start.transform, clipPath: start.clipPath, opacity: start.opacity, easing: EASE_BACK },
              { transform: risen.transform, clipPath: risen.clipPath, opacity: 1, offset: BACK_AT, easing: EASE_SINK },
              { transform: tucked.transform, clipPath: tucked.clipPath, opacity: 1, offset: 0.9 },
              { transform: tucked.transform, clipPath: tucked.clipPath, opacity: 0 },
            ],
            { duration: CLOSE_MS, fill: "both" },
          ),
        ]);
        if (!done) return;
      }
      finish();
    }

    // closed: the dialog gone, the folder settled, the page scrolling
    // again where it was
    function finish() {
      // hold the closed look until the dialog is gone, so it never flashes
      // back to its resting place for a frame
      paper.style.opacity = "0";
      state = "closed";
      if (dialog.open) dialog.close();
      paper.style.removeProperty("opacity");
      settle();
      stopScroll();
      folder.classList.remove("is--pulled");
      lenis.start();
      if (Math.abs(window.scrollY - pageY) > 1) lenis.scrollTo(pageY, { immediate: true, force: true });
    }

    button.addEventListener("click", open);
    dialog.querySelectorAll("[data-folder-doc-close]").forEach((el) => el.addEventListener("click", close));
    // Escape: the browser would close it at once; close it the same way
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    // closed by the browser without asking (a second Escape can do that):
    // put everything back as a close would
    dialog.addEventListener("close", () => {
      if (state !== "closed") finish();
    });
    button.folderDoc = { open, close };

    registerPageCleanup(() => {
      if (state !== "closed") finish();
      button.folderDoc = null;
    });
  });
}
