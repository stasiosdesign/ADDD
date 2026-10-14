// -----------------------------------------
// ADDD — the insight slider (the research deck)
// -----------------------------------------
//
// Mounted per page from the registry in site.js, like every component in
// the Barba container. gsap and its Draggable plugin are the site's globals.

import { registerPageCleanup } from "./page.js";

/* ============================================================
   INSIGHT SLIDER
   ------------------------------------------------------------
   A dragged deck of insight cards. The list translates under the
   pointer; every card that reaches the left edge stops there and is
   scaled and tipped back a few degrees, so what has been read piles
   up as a stack instead of scrolling away.

   The motion is deliberately flat: Draggable snaps to whole cards,
   overshootTolerance is 0 so the throw cannot spring past a bound,
   and every programmatic move runs on power3.out. Nothing elastic,
   nothing that bounces back.

   Structure (see src/components/InsightSlider.astro):
     [data-slider]                    the root, carries the tuning
       [data-slider-viewport]         clipped frame
         [data-slider-list]           the element Draggable moves
           [data-slider-item] ...     one card each
       [data-slider-controls]         optional .dots + .arrows

   Tuning attributes on the root: data-scale (rest scale of a stacked
   card) and data-rotate (its rotation in degrees).
   ============================================================ */
export function initInsightSlider(container) {
  container.querySelectorAll("[data-slider]").forEach(root => {
    const viewport = root.querySelector("[data-slider-viewport]");
    const list = root.querySelector("[data-slider-list]");
    const slides = Array.from(root.querySelectorAll("[data-slider-item]"));
    if (!viewport || !list || !slides.length) return;

    const minScale = Number(root.dataset.scale ?? 0.72);
    const maxRotation = Number(root.dataset.rotate ?? -5);

    const controls = root.querySelector("[data-slider-controls]");
    const prevBtn = controls && controls.querySelector("[data-slider-prev]");
    const nextBtn = controls && controls.querySelector("[data-slider-next]");
    const dots = controls ? Array.from(controls.querySelectorAll("[data-slider-dot]")) : [];

    // Vertical panning has to stay with the page — the deck only ever
    // wants the horizontal axis.
    viewport.style.touchAction = "pan-y";

    let spacing = 0;
    let maxDrag = 0;
    let dragX = 0;
    let index = 0;
    let draggable = null;
    let moveTween = null;

    const clamp = v => (maxDrag <= 0 ? 0 : Math.min(Math.max(v, 0), maxDrag));

    function paint() {
      gsap.set(list, { x: -dragX });

      slides.forEach((slide, i) => {
        const local = Math.max(0, dragX - i * spacing);
        const t = spacing > 0 ? Math.min(local / spacing, 1) : 0;

        gsap.set(slide, {
          x: local,
          scale: 1 - (1 - minScale) * t,
          rotation: maxRotation * t,
          transformOrigin: "75% center"
        });
      });

      const at = spacing > 0 ? Math.round(dragX / spacing) : 0;
      if (at !== index) {
        index = at;
        syncControls();
      }
    }

    function syncControls() {
      dots.forEach((d, i) => d.classList.toggle("is--active", i === index));
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= slides.length - 1;
    }

    function goTo(i) {
      const target = clamp(Math.max(0, Math.min(i, slides.length - 1)) * spacing);
      if (moveTween) moveTween.kill();
      if (draggable) draggable.endDrag?.();

      const state = { value: dragX };
      moveTween = gsap.to(state, {
        value: target,
        duration: 0.5,
        ease: "power3.out",
        onUpdate() {
          dragX = state.value;
          paint();
        }
      });

      viewport.setAttribute("aria-label", `Slide ${Math.round(target / (spacing || 1)) + 1} of ${slides.length}`);
    }

    function measure() {
      const gapRight = parseFloat(getComputedStyle(slides[0]).marginRight) || 0;
      spacing = slides[0].offsetWidth + gapRight;
      maxDrag = spacing * (slides.length - 1);

      dragX = clamp(dragX);
      paint();
      syncControls();

      if (draggable) draggable.applyBounds({ minX: -maxDrag, maxX: 0 });
    }

    draggable = Draggable.create(list, {
      type: "x",
      bounds: { minX: -maxDrag, maxX: 0 },
      inertia: true,
      // A throw settles inside a beat and cannot spring past the
      // ends — the restraint the deck is asked for.
      maxDuration: 0.8,
      overshootTolerance: 0,
      edgeResistance: 0.9,
      allowContextMenu: true,
      snap: raw => {
        const d = clamp(-raw);
        return -(spacing > 0 ? Math.round(d / spacing) : 0) * spacing;
      },
      onPress() {
        if (moveTween) moveTween.kill();
      },
      onDragStart() {
        root.classList.add("is--dragging");
      },
      onDrag() {
        dragX = clamp(-this.x);
        paint();
      },
      onThrowUpdate() {
        dragX = clamp(-this.x);
        paint();
      },
      onDragEnd() {
        // Released after a real drag the card under the pointer must
        // not also follow its link; a tap that never moved still
        // should, so the class only comes off once the click that
        // ends the gesture has been and gone.
        requestAnimationFrame(() => root.classList.remove("is--dragging"));
      },
      onClick() {
        root.classList.remove("is--dragging");
      }
    })[0];

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));
    dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));

    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-roledescription", "carousel");

    // Arrow keys drive the deck only while it is the thing on screen.
    let inView = false;
    const io = new IntersectionObserver(
      entries => { inView = entries[0].isIntersecting; },
      { threshold: 0.25 }
    );
    io.observe(root);

    function onKey(e) {
      if (!inView) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    }
    window.addEventListener("keydown", onKey);

    const ro = new ResizeObserver(() => measure());
    ro.observe(root);

    measure();
    // The card width is set in em against the webfont's metrics on the
    // body; re-measure once it has actually loaded.
    document.fonts.ready.then(measure);

    registerPageCleanup(() => {
      if (moveTween) moveTween.kill();
      if (draggable) draggable.kill();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("keydown", onKey);
      gsap.set([list, ...slides], { clearProps: "transform" });
    });
  });
}
