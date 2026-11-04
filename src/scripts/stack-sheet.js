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

   Opening (since 2026-11-04, a morph): the containers grow out of the
   stack's own cards, wherever they stand on the screen (no glide to the
   middle first: fourth pass), or out of the list's rows. Each starts
   exactly over its card, slanted as the card is (one transform maps the
   container's box onto the card's four corners) and in the stack's
   colour, the cards themselves taken out of the row at that moment, and
   travels to its place in the column, square and full size, taking its
   own colour on the way, one after the next, its words coming in once it
   is most of the way; the head (in the stack's colour throughout) comes
   from the stack's middle card, the way in from its last. The scrim comes
   up behind them. Closing is the way back: the words go, each container
   goes back onto its card, and as they land the cards are back in the row
   and the dialog closes. Transforms, opacity and the containers' own
   colour, on the Web Animations API. Under reduced motion it opens and
   closes at once.
   ============================================================ */
import { lenis } from "./scroll.js";
import { motion } from "./page.js";

// out: a long, soft arrival; back: picked up gently, set down firmly
const EASE_OUT = "cubic-bezier(0.2, 0.9, 0.24, 1)";
const EASE_BACK = "cubic-bezier(0.5, 0, 0.2, 1)";
const MORPH_MS = 720;
const BACK_MS = 540;
const STAGGER_MS = 36;

// the transform that sets a box (its rect on the screen, untransformed,
// transform-origin at its top left) exactly onto a card's four corners
function onto(r, q) {
  const [tl, tr, , bl] = q;
  const m = [(tr[0] - tl[0]) / r.width, (tr[1] - tl[1]) / r.width, (bl[0] - tl[0]) / r.height, (bl[1] - tl[1]) / r.height, tl[0] - r.left, tl[1] - r.top];
  return `matrix(${m.map((v) => v.toFixed(4)).join(",")})`;
}

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
  let morph = null;

  // the containers for one stack
  function build(g) {
    column.replaceChildren();
    const total = g.toolCount;
    const head = el("section", "sd-sheet__card is--head");
    // the head in the stack's own colour, as its cards are
    if (g.tone) {
      head.style.setProperty("--sheet-tone", g.tone.ground);
      head.style.setProperty("--sheet-tone-ink", g.tone.ink);
    }
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

  // where each container grows from (the morph's quads: the head's, each
  // tool's, named then locked, in order, and the way in's)
  function sourcesOf(list, q) {
    if (!q?.items?.length) return list.map(() => null);
    return list.map((card, i) => {
      if (card.classList.contains("is--head")) return q.head;
      if (card.classList.contains("is--cta")) return q.cta;
      return q.items[i - 1] ?? q.cta;
    });
  }
  // the stack's colour, for the containers to start (and end) in
  let tone = null;

  async function open(g, onClosed, from) {
    if (state !== "closed") return;
    done = onClosed;
    morph = from ?? null;
    tone = g.tone?.ground ?? null;
    build(g);
    state = "opening";
    lenis?.stop();
    dialog.showModal();
    scroller.scrollTop = 0;
    scroller.focus({ preventScroll: true });
    if (motion.reduced) {
      morph?.hide(true);
      state = "open";
      return;
    }
    const list = cards();
    const sources = sourcesOf(list, morph?.quads());
    const anims = [
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MORPH_MS * 0.7, easing: "ease-out", fill: "both" }),
      closer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: MORPH_MS * 0.6, easing: "ease-out", fill: "both" }),
    ];
    list.forEach((card, i) => {
      const q = sources[i];
      const r = card.getBoundingClientRect();
      const timing = { duration: MORPH_MS, delay: Math.min(i, 8) * STAGGER_MS, fill: "both" };
      if (!q || !r.width || !r.height) {
        anims.push(card.animate([{ opacity: 0, transform: "translateY(1.75rem)" }, { opacity: 1, transform: "none" }], { ...timing, easing: EASE_OUT }));
        return;
      }
      card.style.transformOrigin = "0 0";
      // from the card's colour to its own
      const own = getComputedStyle(card).backgroundColor;
      const from = tone ? { backgroundColor: tone } : {};
      const to = tone ? { backgroundColor: own } : {};
      anims.push(card.animate([{ transform: onto(r, q), ...from }, { transform: "none", ...to }], { ...timing, easing: EASE_OUT }));
      // its words once it is most of the way there
      [...card.children].forEach((child) => anims.push(child.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { ...timing, easing: "linear" })));
    });
    // the cards out of the row as their containers take their place
    morph?.hide(true);
    const ok = await play(anims);
    if (ok) {
      settle();
      state = "open";
    }
  }

  async function close() {
    if (state === "closed" || state === "closing") return;
    state = "closing";
    if (!motion.reduced) {
      const scrimNow = getComputedStyle(scrim).opacity;
      settle();
      const list = cards();
      const targets = sourcesOf(list, morph?.quads());
      const anims = [
        closer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "ease-in", fill: "both" }),
        scrim.animate([{ opacity: scrimNow }, { opacity: 0 }], { duration: BACK_MS, easing: "ease-in-out", fill: "both" }),
      ];
      list.forEach((card, i) => {
        const q = targets[i];
        const r = card.getBoundingClientRect();
        const timing = { duration: BACK_MS, delay: Math.min(list.length - 1 - i, 8) * (STAGGER_MS / 2), fill: "both" };
        if (!q || !r.width || !r.height) {
          anims.push(card.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(1rem)" }], { ...timing, easing: EASE_BACK }));
          return;
        }
        card.style.transformOrigin = "0 0";
        const own = getComputedStyle(card).backgroundColor;
        const from = tone ? { backgroundColor: own } : {};
        const to = tone ? { backgroundColor: tone } : {};
        anims.push(card.animate([{ transform: "none", ...from }, { transform: onto(r, q), ...to }], { ...timing, easing: EASE_BACK }));
        [...card.children].forEach((child) => anims.push(child.animate([{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }], { ...timing, easing: "linear" })));
      });
      const ok = await play(anims);
      if (!ok) return;
    }
    finish();
  }

  // closed: the cards back in the row (drawn there at once, in the same
  // frame as the containers go), the dialog gone, the page as it was, the
  // row told
  function finish() {
    morph?.hide(false);
    morph = null;
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
