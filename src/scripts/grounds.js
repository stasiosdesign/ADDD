// -----------------------------------------
// ADDD — a page's grounds: light or dark
// -----------------------------------------
//
// What the nav reads to take its light or dark state (nav.js, "Nav
// theme"), and the Book a Call float (book-float.js) the same way: every
// element in the page with an opaque background at least half the screen
// wide (so the cards and tiles a section holds never count against the
// section they sit in), dark or light by its colour's luminance. Anything
// that should decide for itself, a dark photograph with no background
// colour behind it, sets data-nav-theme="dark" or "light". Scrims and
// other overlays the pointer passes through (pointer-events: none) are
// not grounds. Of several grounds at one point, the last in the document
// (the innermost, or the one painted over the other) decides.

// whole subtrees that can never be a section's ground
const SKIP = new Set(["svg", "SCRIPT", "STYLE", "CANVAS", "IMG", "PICTURE", "VIDEO", "IFRAME", "BR", "INPUT", "TEXTAREA", "SELECT"]);

// a computed background colour as [r, g, b, a], each 0–1: rgb()/rgba(),
// and color(srgb …), which is how a color-mix() comes back
function parseColor(value) {
  const m = value.match(/^(rgba?|color)\((.*)\)$/);
  if (!m) return null;
  const parts = m[2].replace(/^srgb\s+/, "").split(/[\s,/]+/).filter(Boolean).map(parseFloat);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  const [r, g, b, a = 1] = parts;
  return m[1] === "color" ? [r, g, b, a] : [r / 255, g / 255, b / 255, a];
}

function groundOf(el, minWidth) {
  const set = el.getAttribute("data-nav-theme");
  if (set === "dark" || set === "light") return set;
  const style = getComputedStyle(el);
  if (style.pointerEvents === "none") return null;
  const c = parseColor(style.backgroundColor);
  if (!c || c[3] < 0.5) return null;
  if (el.getBoundingClientRect().width < minWidth) return null;
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 0.5 ? "dark" : "light";
}

/** Every ground in the container, the container's own included: element → "dark" | "light". */
export function findGrounds(container) {
  const grounds = new Map();
  const minWidth = document.documentElement.clientWidth / 2;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (el) => (SKIP.has(el.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let el = container; el; el = walker.nextNode()) {
    const ground = groundOf(el, minWidth);
    if (ground) grounds.set(el, ground);
  }
  return grounds;
}

/** Of some grounds (at one point), the one that decides: the last in the document. */
export function lastInDocument(els) {
  let top = null;
  els.forEach((el) => {
    if (!top || top.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) top = el;
  });
  return top;
}
