/* ============================================================
   Logo Stack Loader (GSAP) — the first-load logo intro
   ------------------------------------------------------------
   The Osmo Supply resource as supplied, with three adaptations this
   codebase needs:

     - it does not start itself on DOMContentLoaded. Whether a
       document load plays the intro at all is decided by ARRIVAL in
       site.js, which calls this on an "intro" arrival only;
     - it hands back its timeline (null when the markup is missing)
       rather than a teardown function, so Barba's once() can wait
       for it to finish. Once it has played, the loader leaves the
       document altogether, so there is nothing to tear down;
     - it plays a touch faster than supplied: the whole timeline,
       every step and the progress bar with it, at SPEED.

   Markup: src/components/Loader.astro. Styles: src/styles/loader.css.
   ============================================================ */
export function initLogoStackLoader() {
  const root = document.querySelector("[data-logo-loader-init]");
  if (!root) return null;

  const logoDuplicateCount = 5; // copies of the logo made behind the original
  const SPEED = 1.1; // the whole intro, 10% quicker: 3.15s plays in about 2.9s

  const bg = root.querySelector("[data-logo-loader-bg]");
  const stack = root.querySelector("[data-logo-loader-stack]");
  const logo = root.querySelector("[data-logo-loader-logo]");
  const bar = root.querySelector("[data-logo-loader-bar]");
  const track = root.querySelector("[data-logo-loader-track]") || bar;
  if (!bg || !stack || !logo) return null;

  const resetTargets = [...root.querySelectorAll("[data-logo-loader-reset]")].filter((element) => element !== stack);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const logoDuplicates = [];
  for (let i = 0; i < logoDuplicateCount; i += 1) {
    const duplicate = logo.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    stack.appendChild(duplicate);
    logoDuplicates.push(duplicate);
  }

  const em = parseFloat(getComputedStyle(stack).fontSize);

  const timeline = gsap.timeline({
    defaults: {
      duration: 0.4,
      ease: "power2.out",
    },
  });

  gsap.set(logoDuplicates, {
    opacity: 0,
    z: 0,
  });

  if (resetTargets.length) {
    timeline.set(resetTargets, {
      autoAlpha: 1,
    }, 0);
  }

  timeline.to(stack, {
    autoAlpha: 1,
    duration: 0.5,
  });

  if (reduceMotion) {
    timeline
      .addLabel("impact", "+=0.6")
      .to(root, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.inOut",
      }, "impact+=0.5");
  } else {
    timeline
      .addLabel("tilt", "-=0.1")
      .to(stack, {
        rotationY: -40,
        rotationX: 20,
        xPercent: -15,
        duration: 0.6,
        ease: "power4.out",
      }, "tilt")
      .to(logoDuplicates, {
        z: (i) => -(i + 1) * 2.5 * em,
        opacity: (i) => Math.pow(0.5, i + 1),
        duration: 0.55,
        ease: "power4.out",
        stagger: {
          each: 0.05,
          ease: "power1.out",
        },
      }, "tilt+=0.1")
      .addLabel("smash", "+=0.4")
      .to(stack, {
        rotationY: 0,
        rotationX: 0,
        xPercent: 0,
        ease: "power4.in",
      }, "smash")
      .to(logoDuplicates, {
        z: 0,
        ease: "power4.in",
      }, "smash")
      .addLabel("impact")
      .set(logoDuplicates, {
        opacity: 0,
      }, "impact")
      .to(stack, {
        scale: 1.05,
        duration: 0.1,
      }, "impact")
      .to(stack, {
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      })
      .to(stack, {
        autoAlpha: 0,
      }, "impact+=0.5")
      .to(bg, {
        scaleY: 0,
        duration: 0.5,
        ease: "expo.inOut",
      }, "impact+=0.6");
  }

  if (bar) {
    timeline
      .to(bar, {
        scaleX: 1,
        duration: timeline.labels.impact,
        ease: "power2.inOut",
      }, 0)
      .to(track, {
        autoAlpha: 0,
      }, "impact+=0.5");
  }

  timeline.set(root, {
    display: "none",
  });

  timeline.timeScale(SPEED);

  return timeline;
}
