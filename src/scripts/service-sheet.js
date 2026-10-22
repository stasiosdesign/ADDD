// -----------------------------------------
// ADDD — a service card opening into its page
// -----------------------------------------
//
// The homepage's deck (ServiceDeck.astro) is four cards stacked like
// sheets of paper, and each service page opens on the same card at the
// screen's size (ServiceHero.astro). A click on a card opens it into the
// page: the card comes out of the pile, over the cards in front of it, and
// its edges open out to the screen's while every part the card and the
// hero share — the number, the name, the square, the list, the diagram's
// panel — glides from where it stands on the card to where it stands on
// the hero. Barba runs it in place of the wipe (site.js, "service-sheet"):
// leave() opens the card until it covers the screen, the page is built
// under it as under the wipe, and enter() hands over to the page.
//
// The opening card is a sheet over everything (service-deck.css, "Service
// sheet"): the destination's own hero, fetched ahead and laid out at its
// own size, so its last frame is the page's hero exactly, cut to the
// card's shape (a clip on the screen's rectangle) with each shared part
// moved back onto the card's (FLIP: measured at rest, then set off by the
// difference). Its first frame is then the card as it stands, even a card
// all but hidden under the pile. The movement is in two:
//
//   uncover  the cards in front of it slide down off it, its foot on
//            their top edge, so it shows whole where it lies, and the
//            pile behind it falls back into shade;
//   open     it comes forward over them, its edges out to the screen's
//            (its foot overtaking theirs, a shadow under it), every part
//            to its place on the page.
//
// Everything that moves is a transform or an opacity: nothing is laid out
// or painted again while it plays. The card's shape, and the panel's, are
// windows (windowed()): boxes that clip what is in them, moved by transforms
// with their contents moved back by as much, so an edge sweeps across while
// the contents stand still. (An animated clip-path did the same, but had
// the browser paint the whole sheet again every frame, which on this
// machine's graphics halved the frame rate.)
//
// The page comes in before the card has landed: what the card does not
// have (the heading, the lede, the buttons), laid out in the sheet but not
// shown (data-sheet-hide), rises into it over the last of the opening, the
// heading line by line as the page's line reveal does. These run as Web
// Animations of transform and opacity, on the compositor, so they carry on
// smoothly through the page being built under the sheet, which starts as
// soon as the sheet is still to the eye (under half a pixel from rest), not
// when its curve has quite run out. The page's own hero is then built in
// the state they end in (data-hero-shown: its reveals stand down), the nav
// comes back over the sheet in the page's state, and once the words are in
// the sheet hands over. The drawing is the card's own, copied as it stands
// mid-loop, so nothing jumps as the sheet takes over from the card; the
// page's own starts its loop where the card's was.
//
// A card's page is fetched as the pointer comes onto the card, or a finger
// presses it, into Barba's own cache (barba.prefetch), so the click
// fetches nothing new. Should the page not come (or have no hero), the
// click goes by the wipe like any other link.

import { motion } from "./page.js";
import { mountIsoField } from "./dot-field.js";

// The two movements, in seconds: the card drawn out of the pile (its foot
// let down over the cards in front, the stack falling back under it), then
// opened to the screen, starting as the first settles.
// (uncover: the longest it takes, for a card under all the rest; less
// for one that shows more; overlap: how much of it is still to go as the
// opening starts; sink: how far on the cards in front go as the card
// opens over them, a share of the way left to the screen's foot; still:
// the share of the opening's time after which it is under half a pixel
// from rest, on the site's curve; words: when the page's words start to
// rise, after the opening starts, and how long each takes; navIn, the
// nav's return; handover, the sheet's going)
const SHEET = {
  uncover: 0.45, overlap: 0.5, open: 0.85, sink: 0.4, still: 0.95, lineOut: 0.35,
  words: { at: 0.42, duration: 0.75, stagger: 0.08, rise: 0.12 }, navIn: 0.4, handover: 0.3,
};
// the line reveal's curve (power3.out, reveals.js), as CSS has it
const WORDS_EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
// Uncovering answers the click at once and eases in to rest, as a sheet
// slid aside does; the opening is on the site's own curve (gsap-setup.js),
// which takes most of its way early and settles long.
CustomEase.create("sheetUncover", "0.2, 0.6, 0.25, 1");

// the parts the card and the hero share, glided from one to the other
const PARTS = [".service-deck__n", ".service-deck__h", ".service-deck__go", ".service-deck__list"];

// The hero of each page asked for, as a promise of its element (parsed
// once, idle), by its address.
const heroes = new Map();

function heroOf(href) {
  const url = new URL(href, location.href).href;
  if (heroes.has(url)) return heroes.get(url);
  if (!barba.cache.has(url)) barba.prefetch(url);
  const request = barba.cache.get(url)?.request ?? fetch(url).then((r) => r.text()).then((html) => ({ html }));
  const hero = Promise.resolve(request)
    .then(({ html }) => idle().then(() => new DOMParser().parseFromString(html, "text/html").querySelector("[data-service-hero]")))
    .catch(() => null)
    .then((el) => {
      if (!el) heroes.delete(url);
      return el;
    });
  heroes.set(url, hero);
  return hero;
}

const idle = (timeout = 250) => new Promise((resolve) => ("requestIdleCallback" in window ? requestIdleCallback(resolve, { timeout }) : setTimeout(resolve, 0)));

/** A deck's cards fetch their pages ahead, as one is pointed at, pressed or focused. */
export function initServiceSheets(container) {
  container.querySelectorAll("[data-service-deck]").forEach((deck) => {
    const intent = (event) => {
      const link = event.target.closest?.(".service-deck__card")?.querySelector("[data-service-sheet]");
      if (link) heroOf(link.href);
    };
    // listeners on the deck, which goes with its page
    deck.addEventListener("pointerover", intent, { passive: true });
    deck.addEventListener("pointerdown", intent, { passive: true });
    deck.addEventListener("focusin", intent);
  });
}

/** Whether a click opens a card into its page: a card's link, with motion. */
export function opensSheet(trigger) {
  return !motion.reduced && trigger instanceof Element && trigger.matches("[data-service-sheet]");
}

// The sheet open now, from leave() to enter().
let sheet = null;

export function sheetOpen() {
  return !!sheet;
}

/**
 * Open the clicked card into its page. Resolves true once the sheet covers
 * the screen, or false, at once, should the page not be there to open into
 * (the wipe then goes instead).
 */
export async function openSheet(link, href) {
  const card = link.closest(".service-deck__card");
  if (!card) return false;
  // the card holds as pressed while its page comes, if it has not yet
  card.setAttribute("data-sheet-opening", "");
  const source = await Promise.race([heroOf(href), new Promise((resolve) => setTimeout(() => resolve(null), 2500))]);
  card.removeAttribute("data-sheet-opening");
  if (!source) return false;
  sheet = build(card, source);
  await sheet.opened;
  return true;
}

/**
 * Hand over from the sheet to the page's own hero, under it now, built in
 * the state the sheet's words end in: the nav comes back over the sheet at
 * once, in the page's state; once the words are in, release() (scrolling
 * the reader's again) and the sheet goes.
 */
export async function closeSheet(release) {
  const open = sheet;
  sheet = null;
  if (!open) return release?.();
  open.layer.style.pointerEvents = "none";
  // under the nav (z-index 100) from here
  open.layer.style.zIndex = "99";
  const nav = document.querySelector("[data-menu-wrap]");
  if (nav) gsap.fromTo(nav, { opacity: 0 }, { opacity: 1, duration: SHEET.navIn, ease: "power1.out", clearProps: "opacity" });
  await open.revealed;
  release?.();
  await gsap.to(open.layer, { opacity: 0, duration: SHEET.handover, ease: "power1.out" });
  // gone from the screen now; taken out of the document in an idle moment
  open.layer.style.visibility = "hidden";
  idle(1500).then(() => {
    open.field?.destroy();
    open.layer.remove();
  });
}

/** Mark a page's hero, being built under the sheet, as shown: its reveals stand down. */
export function markSheetArrival(container) {
  if (sheet) container.querySelector("[data-service-hero]")?.setAttribute("data-hero-shown", "");
}

// --- The sheet ------------------------------------------------------

function build(card, source) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const box = (el) => el.getBoundingClientRect();

  // The card as it stands: its box, and how much of it shows, from its
  // top to the top of the first card in front that comes over it (or the
  // screen's foot), and how much it has, to the foot of its own panel
  // and its inset under it (the card runs on under the cards in front
  // further, the tail that keeps the pile together, never seen).
  const cardBox = box(card);
  const media = card.querySelector(".service-deck__media");
  const front = [];
  for (let next = card.nextElementSibling; next; next = next.nextElementSibling) {
    if (next.matches(".service-deck__card")) front.push(next);
  }
  // the tail: on a stuck card, a head for every card still to pile over it
  // (each sticks a head lower than the one before)
  const style = getComputedStyle(card);
  const head = front.length && style.position === "sticky" ? parseFloat(getComputedStyle(front[0]).top) - parseFloat(style.top) : 0;
  const whole = Math.min(vh, cardBox.bottom - front.length * Math.max(0, head || 0));
  let shown = whole;
  front.forEach((next) => (shown = Math.min(shown, Math.max(cardBox.top, box(next).top))));
  const top = Math.max(0, cardBox.top);
  // the cards in front that are on the screen, which slide off it
  const sliding = front.filter((next) => box(next).top < vh);

  // the layer: the stack's shade, the shadow under the sheet's foot, and
  // the page's hero, cut to the card
  const layer = document.createElement("div");
  layer.className = "service-sheet";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = '<div class="service-sheet__shade"></div><div class="service-sheet__edge"></div><div class="service-sheet__page"></div>';
  const shade = layer.querySelector(".service-sheet__shade");
  const edge = layer.querySelector(".service-sheet__edge");
  const page = layer.querySelector(".service-sheet__page");
  // the card's shape: a window on the screen, the sheet's contents in it
  const pageWin = windowed(vw, vh);
  page.appendChild(pageWin.box);
  const into = pageWin.content;
  const hero = document.importNode(source, true);
  hero.removeAttribute("data-service-hero");
  // the drawing as the card has it, mid-answer; the page draws its own
  // figure afresh over the copy (service-diagram.js)
  const drawing = card.querySelector(".service-deck__diagram");
  hero.querySelector(".service-deck__diagram")?.replaceWith(drawing ? drawing.cloneNode(true) : document.createTextNode(""));
  into.appendChild(hero);
  // (the cards carry no rule along their top any more: nothing to draw)
  const rule = null;
  if (rule) {
    rule.className = "service-sheet__rule";
    into.appendChild(rule);
  }
  // the card's own line, over the sheet, for as long as it fades
  const ownLine = card.querySelector(".service-deck__p");
  const line = ownLine?.cloneNode(true);
  if (line) {
    const at = box(ownLine);
    line.removeAttribute("data-page-field");
    line.classList.add("service-sheet__line");
    Object.assign(line.style, { left: `${at.left}px`, top: `${at.top}px`, width: `${at.width}px` });
    into.appendChild(line);
  }
  document.body.appendChild(layer);

  // The lattice behind the drawing, drawn once at the hero's size (it runs
  // past the panel on every side, service-deck.css), before anything is
  // moved: it is set out from the drawing as it stands.
  // (or the route's own ground, across the whole hero: ServiceGround.astro)
  const fields = [...hero.querySelectorAll(".service-deck__pattern, .service-ground")].map((el) => mountIsoField(el));
  const field = { destroy: () => fields.forEach((f) => f.destroy()) };

  // Every shared part, from where it is on the card back to where the hero
  // has it, at rest: the difference, set as a transform to undo.
  const moves = [];
  PARTS.forEach((selector) => {
    const from = card.querySelector(selector);
    const to = hero.querySelector(selector);
    if (!from || !to) return;
    const a = box(from);
    const b = box(to);
    const scale = Math.abs(a.width / b.width - 1) < 0.01 ? 1 : a.width / b.width;
    moves.push({ el: to, from: { x: a.left - b.left, y: a.top - b.top, scale } });
  });
  // the square, lit as the card's is under the pointer, to the hero's
  // own, its triangle turning from on to down
  const go = { from: card.querySelector(".service-deck__go"), to: hero.querySelector(".service-deck__go") };
  const turn = (el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return (Math.atan2(m.b, m.a) * 180) / Math.PI;
  };
  const goArrow = { from: go.from?.querySelector(".service-deck__arrow"), to: go.to?.querySelector(".service-deck__arrow") };
  const goState = go.from && go.to ? {
    from: { backgroundColor: getComputedStyle(go.from).backgroundColor, color: getComputedStyle(go.from).color },
    to: { backgroundColor: getComputedStyle(go.to).backgroundColor, color: getComputedStyle(go.to).color },
  } : null;
  const arrowTurn = goArrow.from && goArrow.to ? { from: turn(goArrow.from), to: turn(goArrow.to) } : null;

  // The panel: shown as the card's, a window on the hero's (a clip), the
  // whole moved where it must be for the window to fall inside it; and the
  // drawing with its lattice, moved (and sized, where the two differ) from
  // the hero's place onto the card's.
  const panel = { from: media, to: hero.querySelector(".service-deck__media") };
  let panelMove = null;
  if (panel.from && panel.to) {
    const a = box(panel.from);
    const b = box(panel.to);
    const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
    const x = clamp(0, a.right - b.right, a.left - b.left);
    const y = clamp(0, a.bottom - b.bottom, a.top - b.top);
    const inset = {
      top: Math.max(0, a.top - (b.top + y)),
      right: Math.max(0, b.right + x - a.right),
      bottom: Math.max(0, b.bottom + y - a.bottom),
      left: Math.max(0, a.left - (b.left + x)),
    };
    const art = panel.to.querySelector(".service-deck__art");
    const d = drawing ? box(drawing) : null;
    const D = art?.querySelector(".service-deck__diagram") ? box(art.querySelector(".service-deck__diagram")) : null;
    let artFrom = null;
    if (art && d && D) {
      const scale = Math.abs(d.width / D.width - 1) < 0.01 ? 1 : d.width / D.width;
      artFrom = {
        x: d.left + d.width / 2 - (D.left + D.width / 2) - x,
        y: d.top + d.height / 2 - (D.top + D.height / 2) - y,
        scale,
        origin: `${D.left + D.width / 2 - b.left}px ${D.top + D.height / 2 - b.top}px`,
      };
    }
    // the panel taken out of the hero's grid (a hidden stand-in keeps its
    // place) into a window of its own, at its own place and size
    const W = b.width;
    const H = b.height;
    const area = document.createElement("div");
    area.className = "service-sheet__panel";
    Object.assign(area.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${W}px`, height: `${H}px` });
    const win = windowed(W, H);
    area.appendChild(win.box);
    const holder = panel.to.cloneNode(false);
    holder.style.visibility = "hidden";
    panel.to.replaceWith(holder);
    panel.to.classList.add("is--sheet-panel");
    win.content.appendChild(panel.to);
    into.appendChild(area);
    const from = { t: inset.top, r: W - inset.right, b: H - inset.bottom, l: inset.left };
    panelMove = { area, win, x, y, from, W, H, art, artFrom };
  }

  // the card's line rides with the name as it goes, and fades
  const nameMove = moves.find((m) => m.el.matches(".service-deck__h"));

  // --- the first frame: the card as it stands --------------------------
  const clip = { t: top, b: shown, l: Math.max(0, cardBox.left), r: Math.min(vw, cardBox.right) };
  const drawClip = () => {
    pageWin.set(clip.t, clip.r, clip.b, clip.l);
    edge.style.transform = `translate3d(0, ${clip.b}px, 0)`;
    if (rule) rule.style.transform = `translate3d(0, ${clip.t}px, 0)`;
  };
  drawClip();
  moves.forEach(({ el, from }) => gsap.set(el, { ...from, transformOrigin: "0 0", force3D: true }));
  if (goState) gsap.set(go.to, goState.from);
  if (arrowTurn) gsap.set(goArrow.to, { rotation: arrowTurn.from });
  // the panel's window, k of the way from the card's (1) to the hero's (0)
  const panelWindow = (k) => {
    const { win, from, W, H } = panelMove;
    win.set(from.t * k, W - (W - from.r) * k, H - (H - from.b) * k, from.l * k);
  };
  if (panelMove) {
    panelWindow(1);
    gsap.set(panelMove.area, { x: panelMove.x, y: panelMove.y, force3D: true });
    if (panelMove.artFrom) {
      const { x, y, scale, origin } = panelMove.artFrom;
      gsap.set(panelMove.art, { x, y, scale, transformOrigin: origin, force3D: true });
    }
  }

  // --- the movement ----------------------------------------------------
  const tl = gsap.timeline({ paused: true });
  // Uncover: the cards in front slide down off it, its foot riding on
  // their top edge, as long as the way is (none, for a card in front of
  // the rest), and the pile behind falls back into shade.
  const away = whole - shown;
  const uncover = away > 1 ? SHEET.uncover * Math.min(1, 0.5 + away / (vh * 0.6)) : 0;
  const u = { duration: uncover, ease: "sheetUncover" };
  if (uncover) {
    tl.to(clip, { b: whole, ...u, onUpdate: drawClip }, 0);
    tl.to(sliding, { y: away, force3D: true, ...u }, 0);
  }
  tl.to(shade, { opacity: 0.3, duration: Math.max(uncover, 0.35), ease: "sheetUncover" }, 0);

  // Open: forward over them, every shared part to its place on the page;
  // the cards in front sink a little further and its foot overtakes them,
  // a shadow under it as it goes
  const open = uncover * (1 - SHEET.overlap);
  const o = { duration: SHEET.open, ease: "osmo" };
  tl.to(clip, { t: 0, b: vh, l: 0, r: vw, ...o, onUpdate: drawClip }, open);
  if (sliding.length) tl.to(sliding, { y: away + (vh - whole) * SHEET.sink, force3D: true, ...o }, open);
  tl.to(shade, { opacity: 0.6, ...o }, open);
  tl.fromTo(edge, { opacity: 0 }, { opacity: 1, duration: SHEET.open * 0.2, ease: "power1.out", immediateRender: false }, open);
  tl.to(edge, { opacity: 0, duration: SHEET.open * 0.4, ease: "power1.in" }, open + SHEET.open * 0.3);
  if (rule) tl.to(rule, { opacity: 0, duration: SHEET.open * 0.35, ease: "power1.out" }, open);
  moves.forEach(({ el }) => tl.to(el, { x: 0, y: 0, scale: 1, ...o }, open));
  if (goState) tl.to(go.to, { ...goState.to, ...o }, open);
  if (arrowTurn) tl.to(goArrow.to, { rotation: arrowTurn.to, ...o }, open);
  if (panelMove) {
    const k = { v: 1 };
    tl.to(k, { v: 0, ...o, onUpdate: () => panelWindow(k.v) }, open);
    tl.to(panelMove.area, { x: 0, y: 0, ...o }, open);
    if (panelMove.artFrom) tl.to(panelMove.art, { x: 0, y: 0, scale: 1, ...o }, open);
  }
  if (line) {
    tl.to(line, { y: nameMove ? -nameMove.from.y : 0, ...o }, open);
    tl.to(line, { opacity: 0, duration: SHEET.lineOut, ease: "power1.out" }, open);
  }

  // covered, to the eye: the page can be built under it
  const opened = new Promise((resolve) => tl.call(resolve, null, open + SHEET.open * SHEET.still));

  // The page's words, rising into the sheet over the last of the opening
  // (Web Animations: see the header), held at their start until it plays.
  const words = wordsOf(hero, (open + SHEET.words.at) * 1000);
  const revealed = Promise.all(words.map((a) => a.finished)).catch(() => {});

  // Before the first move, one frame with the sheet open whole, all but
  // unseen (a hundredth of its opacity), and the cards in front on layers
  // of their own: the browser draws all of it then, while nothing moves,
  // rather than piece by piece as the opening uncovers it, which cost the
  // first few hundred milliseconds of the movement frames.
  const ready = { clip: { ...clip } };
  Object.assign(clip, { t: 0, b: vh, l: 0, r: vw });
  drawClip();
  if (panelMove) panelWindow(0);
  layer.style.opacity = "0.01";
  gsap.set(sliding, { y: 0, force3D: true, willChange: "transform" });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.assign(clip, ready.clip);
    drawClip();
    if (panelMove) panelWindow(1);
    layer.style.opacity = "";
    tl.play();
    words.forEach((a) => a.play());
  }));
  return { layer, field, opened, revealed };
}

// The hero's own words in the sheet, as the page brings them in: the
// heading's lines rising each into its mask (the line reveal's split and
// its curve), then the lede and the buttons rising a little and fading up
// (the hero rise). Paused, each at its start, from delay ms.
function wordsOf(hero, delay) {
  const { duration, stagger, rise } = SHEET.words;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const anims = [];
  const timing = (i, extra = 0) => ({ duration: duration * 1000, delay: delay + (extra + i * stagger) * 1000, easing: WORDS_EASE, fill: "both" });
  hero.querySelectorAll("[data-sheet-hide]").forEach((el) => (el.style.visibility = "visible"));
  const heading = hero.querySelector('[data-split="heading"]');
  let lines = [];
  if (heading) {
    heading.style.visibility = "visible";
    lines = SplitText.create(heading, { type: "lines", mask: "lines", linesClass: "line" }).lines;
    lines.forEach((line, i) => anims.push(line.animate([{ transform: "translateY(125%)" }, { transform: "translateY(0)" }], timing(i))));
  }
  hero.querySelectorAll("[data-hero-rise]").forEach((el, i) => {
    anims.push(el.animate(
      [{ opacity: 0, transform: `translateY(${1.25 * rem}px)` }, { opacity: 1, transform: "translateY(0)" }],
      timing(i, rise + lines.length * stagger),
    ));
  });
  anims.forEach((a) => a.pause());
  return anims;
}

// A window on a box W by H: four boxes, each clipping what is in it, two
// moved by transforms and two moved back by as much, so that what shows of
// the contents is [l, r] across and [t, b] down while the contents stay
// where they are. The first pair sets the top and left edges, the second
// the bottom and right. Only transforms change, so moving an edge is the
// compositor's work alone.
function windowed(W, H) {
  const box = () => {
    const el = document.createElement("div");
    el.className = "service-sheet__win";
    return el;
  };
  const a = box(), inA = box(), b = box(), inB = box();
  a.append(inA);
  inA.append(b);
  b.append(inB);
  const move = (el, x, y) => (el.style.transform = `translate3d(${x}px, ${y}px, 0)`);
  return {
    box: a,
    content: inB,
    set(t, r, bottom, l) {
      move(a, l, t);
      move(inA, -l, -t);
      move(b, r - W, bottom - H);
      move(inB, W - r, H - bottom);
    },
  };
}
