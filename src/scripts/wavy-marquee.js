/* ============================================================
   Wavy Marquee — the homepage's logo strip
   ------------------------------------------------------------
   Osmo Supply's Wavy Marquee, kept to its structure and its data-*
   attributes. The list is rebuilt from clones of its items into a
   seamless loop and moved along on GSAP's ticker; scroll velocity
   (ScrollTrigger) and dragging push it faster. Markup:
     [data-wavy-marquee-init]        the container (and drag target)
       [data-wavy-marquee-list]      rebuilt with the loop's clones
         [data-wavy-marquee-item]    one tile each

   Adapted to the site:
     - it is mounted per page from the registry in site.js and hands
       back a destroy() for registerPageCleanup, rather than running on
       DOMContentLoaded and parking its state on the element;
     - the drag uses ScrollTrigger.observe(), which is the Observer
       plugin as ScrollTrigger already ships it, so no script is added;
     - scrolling down carries the strip on in its own direction and
       scrolling up turns it round, as the strip always has here;
     - it runs while it is on screen by an IntersectionObserver, not a
       ScrollTrigger's range, so it keeps running held in a sticky frame;
     - the copies after the first set are hidden from assistive tech;
     - the wave is left out: the tiles run level, one straight row, and
       only move along it.
   ============================================================ */

// px per second at desktop, before scroll and drag push it on: slow
// enough that each logo can be read as it passes
const AUTO_SPEED = 45;
// [min width, speed multiplier]
const VIEWPORT = [
  [992, 1],
  [768, 0.75],
  [480, 0.6],
  [0, 0.5],
];
// Scrolling pushes the strip on by its velocity (px/s) times this, as a
// multiple of its resting pace, up to MAX_SCROLL_SPEED times it: a clear
// step up from rest on an ordinary scroll that a fast flick can't turn
// into a blur. The push is a target the strip eases up to and back down
// from (DRAG_EASE), as a drag is, so it gathers pace rather than jumping.
const SCROLL_SPEED = 0.0075;
const MAX_SCROLL_SPEED = 8;
const DRAG_SPEED = 0.5;
const MAX_DRAG_SPEED = 75;
const DRAG_EASE = 0.1;

export function initWavyMarquee(container) {
  const list = container.querySelector("[data-wavy-marquee-list]");
  if (!list) return null;

  const originals = [...list.querySelectorAll("[data-wavy-marquee-item]")].map((item) => item.cloneNode(true));
  if (!originals.length) return null;

  const getViewport = () => VIEWPORT.find(([min]) => innerWidth >= min).slice(1);
  const baseDirection = container.dataset.wavyMarqueeDirection === "flipped" ? 1 : -1;
  const setX = gsap.quickSetter(list, "x", "px");

  let loopWidth = 0, averageWidth = 1, containerWidth = 0, travel = 0;
  let speed = 1, targetSpeed = 1, direction = baseDirection;
  let isActive = false, isDragging = false;
  let [speedScale] = getViewport();

  function addBatch(hidden) {
    const fragment = document.createDocumentFragment();
    originals.forEach((item) => {
      const copy = item.cloneNode(true);
      if (hidden) copy.setAttribute("aria-hidden", "true");
      fragment.appendChild(copy);
    });
    list.appendChild(fragment);
  }

  function buildLoop() {
    list.innerHTML = "";

    addBatch(false);
    addBatch(true);

    const firstItems = [...list.querySelectorAll("[data-wavy-marquee-item]")];
    loopWidth = firstItems[originals.length].offsetLeft - firstItems[0].offsetLeft;
    containerWidth = container.offsetWidth;
    // nothing laid out yet (hidden, or unstyled): no loop to fill, and
    // filling the width with a zero-width loop would never end
    if (loopWidth <= 0) {
      loopWidth = 0;
      return;
    }

    for (let i = 2; i < Math.max(2, Math.ceil(containerWidth / loopWidth) + 1); i++) {
      addBatch(true);
    }

    const originalItems = firstItems.slice(0, originals.length);
    averageWidth = originalItems.reduce((sum, item) => sum + item.offsetWidth, 0) / originals.length;
    render();
  }

  function render() {
    if (loopWidth) setX(gsap.utils.wrap(-loopWidth, 0, travel));
  }

  function tick(_, deltaTime) {
    if (!isActive || !loopWidth) return;

    speed += (targetSpeed - speed) * DRAG_EASE;
    if (targetSpeed !== 1) targetSpeed += (1 - targetSpeed) * DRAG_EASE;

    travel += (AUTO_SPEED * speedScale * speed * direction * deltaTime) / 1000;
    render();
  }

  const observer = ScrollTrigger.observe({
    target: container,
    type: "touch,pointer",
    lockAxis: true,
    onChangeX: (self) => {
      if (!isActive || !self.deltaX) return;

      isDragging = true;
      container.style.cursor = "grabbing";
      direction = self.deltaX > 0 ? 1 : -1;

      const dragAmount = (Math.abs(self.deltaX) / averageWidth) * 100 * DRAG_SPEED;
      targetSpeed = Math.min(1 + dragAmount, MAX_DRAG_SPEED);
    },
    onRelease: () => {
      isDragging = false;
      container.style.cursor = "grab";
    },
  });

  // Whether the strip is on screen, from where it actually is rather than
  // where the page's flow puts it: held in a sticky frame (the homepage's
  // StickyTitle) it stays on screen long after its place in the flow has
  // scrolled away. The page's scroll, wherever the strip is, sets its speed
  // and direction.
  const visibility = new IntersectionObserver(([entry]) => (isActive = entry.isIntersecting));
  visibility.observe(container);
  const trigger = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      if (isDragging) return;

      direction = self.direction === 1 ? baseDirection : -baseDirection;
      targetSpeed = Math.min(1 + Math.abs(self.getVelocity()) * SCROLL_SPEED, MAX_SCROLL_SPEED);
    },
  });

  buildLoop();

  isActive = ScrollTrigger.isInViewport(container);
  gsap.ticker.add(tick);

  const onResize = debounceOnWidthChange(() => {
    [speedScale] = getViewport();
    buildLoop();
    ScrollTrigger.refresh();
  }, 150);

  window.addEventListener("resize", onResize);

  return {
    destroy() {
      onResize.cancel();
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      observer.kill();
      trigger.kill();
      visibility.disconnect();
    },
  };
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth, timer;
  const debounced = function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
