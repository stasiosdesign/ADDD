/* ============================================================
   A stack's sheet — what a curated stack opens on the Free Tech Stacks
   page (stack-diagnostic.astro, the dialog [data-stack-sheet]; styles:
   stack-space.css, "The stack's sheet"; opened by stack-space.js)
   ------------------------------------------------------------
   After the Workflow Workshop's folder documents (folder-docs.js): a
   native modal dialog, so the browser keeps the keyboard in it, closes it
   on Escape (handled here, to animate it) and gives the focus back after;
   the page behind dims a little and softens (a scrim with a fixed blur,
   only its opacity animated), and stays still. Not one sheet of paper but
   a column of containers, each a piece of the stack on its own: the
   stack's title and what it is for; each tool the preview names, its
   role in the workflow (its category) and what it does; one locked
   container for each tool held back (the SVG Collection's lock, its words
   veiled: nothing of the tool is on the page to give away); and the way
   into the ADDD app, where the whole stack is (the app's sign-up, or the
   stack's own place in the app: the app enforces the access). The column
   scrolls inside the dialog where it is longer than the window.

   Opening, the containers rise into place one after the next while the
   scrim comes up; closing, they sink a little and fade together, the
   scrim going, and the dialog closes. Transforms and opacity only, on the
   Web Animations API; one direction cut short by the other starts from
   wherever things are. Under reduced motion it opens and closes at once.
   ============================================================ */
import { lenis } from "./scroll.js";
import { motion } from "./page.js";

const EASE_OPEN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_CLOSE = "cubic-bezier(0.5, 0, 0.75, 0)";
const RISE_MS = 560;
const STAGGER_MS = 55;
const CLOSE_MS = 240;

const pad = (n) => String(n).padStart(2, "0");
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function initials(name) {
  const words = name.split(/[\s.]+/).filter(Boolean);
  if (words.length > 1 && !/^tech$/i.test(words[1])) return (words[0][0] + words[1][0]).toUpperCase();
  const caps = name.slice(1).match(/[A-Z]/);
  if (caps && /[a-z]/.test(name)) return (name[0] + caps[0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function mountStackSheet(dialog, data) {
  const scrim = dialog.querySelector(".sd-sheet__scrim");
  const scroller = dialog.querySelector("[data-sheet-scroll]");
  const column = dialog.querySelector("[data-sheet-column]");
  const closer = dialog.querySelector(".sd-sheet__close");
  const ctaTemplate = dialog.querySelector("template[data-sheet-cta]");
  const lockTemplate = dialog.querySelector("template[data-sheet-lock]");
  let state = "closed";
  let running = [];
  let done = null;

  // the containers for one stack
  function build(g) {
    column.replaceChildren();
    const total = g.toolCount;
    const head = el("section", "sd-sheet__card is--head");
    const kicker = el("p", "sd-sheet__kicker");
    kicker.append(el("span", null, `Stack · ${total} ${total === 1 ? "tool" : "tools"}`));
    if (g.sample) kicker.append(el("span", "sd-sheet__badge", "Sample"));
    const title = el("h2", "sd-sheet__title", g.name);
    title.id = "sd-sheet-title";
    head.append(kicker, title);
    if (g.workflow) head.append(el("p", "sd-sheet__workflow", g.workflow));
    if (g.summary) head.append(el("p", "sd-sheet__summary", g.summary));
    column.append(head);

    // the tools the preview names, each its own container
    g.preview.forEach((t, i) => {
      const card = el("section", "sd-sheet__card is--tool");
      const top = el("div", "sd-sheet__tool-head");
      const mark = el("span", "sd-sheet__mark");
      mark.setAttribute("aria-hidden", "true");
      if (t.logo) {
        const img = document.createElement("img");
        img.src = t.logo;
        img.alt = "";
        mark.append(img);
      } else mark.textContent = initials(t.name);
      const names = el("div", "sd-sheet__names");
      names.append(el("h3", "sd-sheet__name", t.name));
      if (t.category) names.append(el("p", "sd-sheet__role", t.category));
      top.append(mark, names, el("span", "sd-sheet__n", `${pad(i + 1)}/${pad(total)}`));
      card.append(top);
      if (t.note) card.append(el("p", "sd-sheet__desc", t.note));
      column.append(card);
    });

    // the tools held back: a lock, and nothing of them but that they are there
    const held = total - g.preview.length;
    for (let k = 0; k < held; k++) {
      const card = el("section", "sd-sheet__card is--locked");
      card.setAttribute("aria-hidden", "true");
      const top = el("div", "sd-sheet__tool-head");
      const mark = el("span", "sd-sheet__mark is--lock");
      if (lockTemplate) mark.append(lockTemplate.content.cloneNode(true));
      const veil = el("div", "sd-sheet__veil");
      veil.append(el("span", "sd-sheet__bar"), el("span", "sd-sheet__bar is--short"));
      top.append(mark, veil, el("span", "sd-sheet__n", `${pad(g.preview.length + k + 1)}/${pad(total)}`));
      const text = el("div", "sd-sheet__veil is--text");
      text.append(el("span", "sd-sheet__bar"), el("span", "sd-sheet__bar"), el("span", "sd-sheet__bar is--short"));
      card.append(top, text);
      column.append(card);
    }
    if (held > 0) {
      const said = el("p", "visually-hidden", `${held} more ${held === 1 ? "tool is" : "tools are"} in the full stack.`);
      column.append(said);
    }

    // the way in
    const cta = el("section", "sd-sheet__card is--cta");
    cta.append(el("h3", "sd-sheet__cta-title", "Unlock the full stack"));
    cta.append(el("p", "sd-sheet__cta-text", held > 0
      ? `The other ${held} ${held === 1 ? "tool" : "tools"} in ${g.name}, and how they work together, are in the ADDD app. Sign up, or sign in, to see the whole stack.`
      : `The whole of ${g.name}, and how its tools work together, is in the ADDD app. Sign up, or sign in, to see it.`));
    if (ctaTemplate) {
      const button = ctaTemplate.content.cloneNode(true);
      const link = button.querySelector("a");
      if (link) link.href = g.url || data.signUp;
      cta.append(button);
    }
    if (g.sample) cta.append(el("p", "sd-sheet__sample", "A sample, to show how a stack will look. Not a recommendation."));
    column.append(cta);
  }

  const cards = () => [...column.querySelectorAll(".sd-sheet__card")];
  function settle() {
    running.forEach((a) => a.cancel());
    running = [];
  }
  async function play(anims) {
    running = anims;
    try {
      await Promise.all(anims.map((a) => a.finished));
    } catch {
      return false; // cut short by the other direction
    }
    if (running !== anims) return false;
    return true;
  }

  async function open(g, onClosed) {
    if (state !== "closed") return;
    done = onClosed;
    build(g);
    state = "opening";
    lenis?.stop();
    dialog.showModal();
    scroller.scrollTop = 0;
    scroller.focus({ preventScroll: true });
    if (motion.reduced) {
      state = "open";
      return;
    }
    const list = cards();
    const ok = await play([
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out", fill: "both" }),
      closer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 260, easing: "ease-out", fill: "both" }),
      ...list.map((card, i) =>
        card.animate(
          [
            { opacity: 0, transform: "translateY(1.75rem) scale(0.985)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: RISE_MS, delay: Math.min(i, 7) * STAGGER_MS, easing: EASE_OPEN, fill: "both" },
        ),
      ),
    ]);
    if (ok) {
      settle();
      state = "open";
    }
  }

  async function close() {
    if (state === "closed" || state === "closing") return;
    state = "closing";
    if (!motion.reduced) {
      const now = cards().map((card) => getComputedStyle(card).opacity);
      const scrimNow = getComputedStyle(scrim).opacity;
      settle();
      const ok = await play([
        closer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "ease-in", fill: "both" }),
        scrim.animate([{ opacity: scrimNow }, { opacity: 0 }], { duration: CLOSE_MS + 60, easing: "ease-in", fill: "both" }),
        ...cards().map((card, i) =>
          card.animate(
            [
              { opacity: now[i] },
              { opacity: 0, transform: "translateY(1rem)" },
            ],
            { duration: CLOSE_MS, easing: EASE_CLOSE, fill: "both" },
          ),
        ),
      ]);
      if (!ok) return;
    }
    finish();
  }

  // closed: the dialog gone, the page as it was, the row told
  function finish() {
    column.style.opacity = "0";
    state = "closed";
    if (dialog.open) dialog.close();
    settle();
    column.style.removeProperty("opacity");
    column.replaceChildren();
    lenis?.start();
    const then = done;
    done = null;
    then?.();
  }

  const onClose = () => close();
  const onCancel = (e) => {
    e.preventDefault();
    close();
  };
  const onClosedByBrowser = () => {
    if (state !== "closed") finish();
  };
  const closers = [...dialog.querySelectorAll("[data-sheet-close]")];
  closers.forEach((b) => b.addEventListener("click", onClose));
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("close", onClosedByBrowser);

  return {
    open,
    close,
    destroy() {
      if (state !== "closed") finish();
      closers.forEach((b) => b.removeEventListener("click", onClose));
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClosedByBrowser);
    },
  };
}
