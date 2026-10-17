// -----------------------------------------
// ADDD — the pinned approach slides and the shutter (the Tech Firms page)
// -----------------------------------------
//
// Mounted per page from the registry in site.js, like every component in
// the Barba container. gsap and ScrollTrigger are the site's globals.

import { registerPageCleanup } from "./page.js";

/* ============================================================
   Approach slides — each step pinned, tipped back and faded
   ============================================================
   The homepage's original approach cards, kept on the Tech Firms
   page since the homepage moved to the approach stack above.

   The reference effect is kept as shipped: the slide's wrapper is
   pinned for one viewport while the card inside it rotates back on
   X, twists a few degrees on Z and shrinks, then a second scrubbed
   tween fades it out once it has travelled far enough. Three things
   are adapted so it lives in this codebase rather than beside it:

     - it is queried against the Barba container, not document, and
       is called from the page registry instead of DOMContentLoaded,
       so it rebinds on every navigation to the page;
     - its ScrollTriggers are killed through registerPageCleanup,
       which is what unpins the wrappers when the container goes;
     - Lenis and ScrollTrigger are already wired up by the page
       lifecycle, so nothing here starts either.
   ============================================================ */
export function initApproachSlides(container) {
  const root = container.querySelector("[data-approach-slides-init]");

  const slides = [...root.querySelectorAll(".approach__slide")];
  if (!slides.length) return;

  // The bar is fixed over the page, so a card has to stack beneath it
  // rather than at the very top of the viewport.
  //
  // Two sources, whichever is larger, because either can read zero at
  // the moment a refresh happens: the bar itself if it is mid-intro,
  // and --nav-h if a stylesheet has not landed. The value is written
  // back onto the section as data-nav-offset, so what the trigger is
  // actually using can be read straight off the DOM.
  const navBar = document.querySelector(".mega-nav__bar");
  const cssNavHeight = () => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;height:var(--nav-h)";
    document.body.appendChild(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  };
  const navOffset = () => {
    const measured = navBar ? navBar.getBoundingClientRect().height : 0;
    const offset = Math.round(Math.max(measured, cssNavHeight()));
    root.dataset.navOffset = offset;
    return offset;
  };

  const tweens = [];

  slides.forEach((slide, index) => {
    const wrapper = slide.querySelector(".approach__slide-wrapper");
    const card = slide.querySelector(".approach__card");
    if (!wrapper || !card) return;

    // The last step is where the sequence ends, so it is left alone:
    // no pin, no tip, no fade. It arrives like any other block on the
    // page and scrolls on into the section below it.
    if (index === slides.length - 1) return;

    tweens.push(gsap.to(card, {
      rotationZ: (Math.random() - 0.5) * 10, // between -5 and 5 degrees
      scale: 0.7,
      rotationX: 40,
      ease: "power1.in",
      scrollTrigger: {
        pin: wrapper, // held while the card tips away
        // The wipe moves the Barba container with a transform, which
        // makes it the containing block for anything fixed while it
        // runs — a default (fixed) pin would drop the pinned card to
        // the top of the container mid-wipe instead of holding it in
        // the viewport.
        pinType: "transform",
        // start and end are re-measured on every refresh, and the
        // trigger is invalidated with them, so a start computed while
        // the page was still settling cannot stick around
        invalidateOnRefresh: true,
        trigger: slide,
        start: () => "top " + navOffset() + "px",
        end: () => "+=" + window.innerHeight, // one viewport later
        scrub: true,
      },
    }));

    tweens.push(gsap.to(card, {
      autoAlpha: 0,
      ease: "power1.in",
      scrollTrigger: {
        trigger: card,
        start: "top -80%",
        end: "+=" + 0.2 * window.innerHeight,
        scrub: true,
      },
    }));
  });

  // resetPage refreshes once the page has settled, which is the
  // measurement that matters. These two cover the reflows that can
  // still land after it: a late font swap and the images finishing.
  const refreshIfLive = () => {
    if (root.isConnected) ScrollTrigger.refresh();
  };
  // (only while a font is still on its way: a promise already kept would
  // measure the whole page again inside the page's own build)
  if (document.fonts?.status === "loading") document.fonts.ready.then(refreshIfLive);
  if (document.readyState !== "complete") {
    window.addEventListener("load", refreshIfLive, { once: true });
    registerPageCleanup(() => window.removeEventListener("load", refreshIfLive));
  }

  registerPageCleanup(() => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  });
}

/* ============================================================
   Shutter scroll transition — rows closing over a section
   ============================================================
   The reference component as shipped: its defaults, breakpoints,
   matchMedia tiers, row building and the two modes (cover, where
   the rows grow from the bottom as a section leaves; reveal, where
   they retract as one arrives) are unchanged.

   Three adaptations so it lives in this codebase:

     - it is queried against the Barba container, not document, and
       is called from the page registry rather than DOMContentLoaded,
       so it rebinds on every navigation;
     - the trigger is the nearest [data-shutter-scroll-section] when
       there is one, falling back to the reference's closest section.
       Here the shutter belongs to the last of the approach slides
       (Tech Firms), not to the whole section it sits in;
     - the matchMedia context is reverted through registerPageCleanup,
       which tears the rows and their triggers down with it, and GSAP
       and ScrollTrigger are the ones the page has already loaded.
   ============================================================ */
export function initShutterScrollTransition(container) {
  // Defaults — edit these to change fallbacks if no data-attribute is added
  const defaultRows = 6;
  const defaultMode = "cover";
  const defaultScrollStart = { cover: "bottom bottom", reveal: "top bottom" };
  const defaultScrollEnd = { cover: "bottom top", reveal: "top center" };
  // Raised from the reference's 0.3: at that value the rows sit almost
  // directly on the scroll position, so a quick flick of the wheel puts
  // the shutter through its whole range in a frame or two and it reads
  // as a cut. Just under a second of catch-up keeps the rows moving
  // after the scroll stops, which is what makes the move legible at
  // speed. Only the approach step's shutter runs on the site.
  const defaultScrub = 0.9;
  const defaultShutterDuration = 0.1;
  const defaultStaggerAmount = 0.01;

  // Class names applied to generated elements
  const panelClass = "shutter-scroll-transition__panel";
  const rowClass = "shutter-scroll-transition__row";

  // Breakpoints
  const breakpoints = {
    mobile: "(max-width: 478px)",
    landscape: "(max-width: 767px)",
    tablet: "(max-width: 991px)",
  };

  const instances = [];

  function getMode(wrapper) {
    return wrapper.dataset.mode === "reveal" ? "reveal" : defaultMode;
  }

  function getRows(wrapper) {
    const base = parseInt(wrapper.dataset.rows, 10) || defaultRows;

    if (window.matchMedia(breakpoints.mobile).matches) {
      return parseInt(wrapper.dataset.rowsMobile, 10) || base;
    }
    if (window.matchMedia(breakpoints.landscape).matches) {
      return parseInt(wrapper.dataset.rowsLandscape, 10) || base;
    }
    if (window.matchMedia(breakpoints.tablet).matches) {
      return parseInt(wrapper.dataset.rowsTablet, 10) || base;
    }
    return base;
  }

  function getScrollStart(wrapper, mode) {
    return wrapper.dataset.scrollStart || defaultScrollStart[mode];
  }

  function getScrollEnd(wrapper, mode) {
    return wrapper.dataset.scrollEnd || defaultScrollEnd[mode];
  }

  function createRow() {
    const row = document.createElement("div");
    row.classList.add(rowClass);
    return row;
  }

  function buildRows(wrapper, rows) {
    const panel = document.createElement("div");
    panel.classList.add(panelClass);

    const fragment = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) {
      fragment.appendChild(createRow());
    }
    panel.appendChild(fragment);
    wrapper.appendChild(panel);

    return { panel };
  }

  function collectRows(panel) {
    return Array.from(panel.children);
  }

  function createAnimation(wrapper, rows, section, mode) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: getScrollStart(wrapper, mode),
        end: getScrollEnd(wrapper, mode),
        scrub: defaultScrub,
        invalidateOnRefresh: true,
      },
    });

    const fromScale = mode === "cover" ? 0 : 1;
    const toScale = mode === "cover" ? 1 : 0;
    const origin = mode === "cover" ? "bottom center" : "top center";

    gsap.set(rows, {
      scaleY: fromScale,
      transformOrigin: origin,
    });

    tl.to(rows, {
      scaleY: toScale,
      duration: defaultShutterDuration,
      stagger: { each: defaultStaggerAmount, from: "end" },
      ease: "none",
    });

    return tl;
  }

  function setupInstance(wrapper) {
    const section =
      wrapper.closest("[data-shutter-scroll-section]") ||
      wrapper.closest("section") ||
      wrapper.parentElement;
    const rows = getRows(wrapper);
    const mode = getMode(wrapper);

    const { panel } = buildRows(wrapper, rows);
    const rowList = collectRows(panel);
    const tl = createAnimation(wrapper, rowList, section, mode);

    return { panel, tl };
  }

  function destroyInstance(instance) {
    if (instance.tl) {
      instance.tl.scrollTrigger?.kill();
      instance.tl.kill();
    }
    instance.panel.remove();
  }

  function buildAll(wrappers) {
    wrappers.forEach((wrapper) => {
      instances.push(setupInstance(wrapper));
    });
    ScrollTrigger.refresh();
  }

  function destroyAll() {
    instances.forEach(destroyInstance);
    instances.length = 0;
  }

  const wrappers = [...container.querySelectorAll("[data-shutter-scroll-transition]")];

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 992px)",
      isTablet: "(min-width: 768px) and (max-width: 991px)",
      isLandscape: "(min-width: 479px) and (max-width: 767px)",
      isMobile: "(max-width: 478px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      if (context.conditions.reduceMotion) return;

      buildAll(wrappers);

      return () => {
        destroyAll();
      };
    }
  );

  registerPageCleanup(() => mm.revert());
}
