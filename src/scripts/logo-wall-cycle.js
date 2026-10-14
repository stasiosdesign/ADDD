/* ============================================================
   Logo Wall Cycle — the homepage's wall of client logos
   (Osmo Supply's resource, index.astro)
   ------------------------------------------------------------
   The cards CSS displays show logos; the rest wait in a pool. On a
   loop, one card at a time (in a shuffled order) slides its logo up
   and out while the next from the pool slides up into it. When every
   logo is on show (the homepage: all ten cards), there is no pool, so
   two cards trade logos instead, with the same slide. Osmo's
   code otherwise as supplied, made a page component: mounted per page and
   undone on leaving (timeline, ScrollTrigger, listener), and still
   under reduced motion. GSAP and ScrollTrigger are the site's globals.
   ============================================================ */
export function mountLogoWallCycle(root) {
  const loopDelay = 1.5;   // Loop Duration
  const duration  = 0.9;   // Animation Duration

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { destroy() {} };

  const list   = root.querySelector('[data-logo-wall-list]') || root;
  const items  = Array.from(list.querySelectorAll('[data-logo-wall-item]'));

  const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';
  const originalTargets = items
    .map(item => item.querySelector('[data-logo-wall-target]'))
    .filter(Boolean);

  let visibleItems   = [];
  let visibleCount   = 0;
  let pool           = [];
  let pattern        = [];
  let patternIndex   = 0;
  let tl;

  function isVisible(el) {
    return window.getComputedStyle(el).display !== 'none';
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setup() {
    if (tl) {
      tl.kill();
    }
    visibleItems = items.filter(isVisible);
    visibleCount = visibleItems.length;

    pattern = shuffleArray(
      Array.from({ length: visibleCount }, (_, i) => i)
    );
    patternIndex = 0;

    // remove all injected targets
    items.forEach(item => {
      item.querySelectorAll('[data-logo-wall-target]').forEach(old => old.remove());
    });

    pool = originalTargets.map(n => n.cloneNode(true));

    let front, rest;
    if (shuffleFront) {
      const shuffledAll = shuffleArray(pool);
      front = shuffledAll.slice(0, visibleCount);
      rest  = shuffleArray(shuffledAll.slice(visibleCount));
    } else {
      front = pool.slice(0, visibleCount);
      rest  = shuffleArray(pool.slice(visibleCount));
    }
    pool = front.concat(rest);

    for (let i = 0; i < visibleCount; i++) {
      const parent =
        visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
        visibleItems[i];
      parent.appendChild(pool.shift());
    }

    tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
    tl.call(swapNext);
    tl.play();
  }

  function swapNext() {
    const nowCount = items.filter(isVisible).length;
    if (nowCount !== visibleCount) {
      setup();
      return;
    }
    const idx = pattern[patternIndex % visibleCount];
    patternIndex++;

    // Every logo is on show (no pool): the card trades logos with another.
    if (!pool.length) {
      if (visibleCount < 2) return;
      let other = Math.floor(Math.random() * (visibleCount - 1));
      if (other >= idx) other++;
      const parents = [idx, other].map(i =>
        visibleItems[i].querySelector('[data-logo-wall-target-parent]') || visibleItems[i]);
      if (parents.some(p => p.querySelectorAll('[data-logo-wall-target]').length !== 1)) return;
      const currents = parents.map(p => p.querySelector('[data-logo-wall-target]'));
      parents.forEach((p, i) => slide(p, currents[i], currents[1 - i].cloneNode(true), true));
      return;
    }

    const container = visibleItems[idx];
    const parent =
      container.querySelector('[data-logo-wall-target-parent]') ||
      container.querySelector('*:has(> [data-logo-wall-target])') ||
      container;
    const existing = parent.querySelectorAll('[data-logo-wall-target]');
    if (existing.length > 1) return;

    const current  = parent.querySelector('[data-logo-wall-target]');
    slide(parent, current, pool.shift(), false);
  }

  // Osmo's swap: the current logo slides up and out, the incoming one up
  // into its place. A traded logo is a copy, so the old one is dropped.
  function slide(parent, current, incoming, traded) {
    gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
    parent.appendChild(incoming);

    if (current) {
      gsap.to(current, {
        yPercent: -50,
        autoAlpha: 0,
        duration,
        ease: "expo.inOut",
        onComplete: () => {
          current.remove();
          if (!traded) pool.push(current);
        }
      });
    }

    gsap.to(incoming, {
      yPercent: 0,
      autoAlpha: 1,
      duration,
      delay: 0.1,
      ease: "expo.inOut"
    });
  }

  setup();

  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onEnter:     () => tl.play(),
    onLeave:     () => tl.pause(),
    onEnterBack: () => tl.play(),
    onLeaveBack: () => tl.pause()
  });
  if (!st.isActive) tl.pause();

  const onVisibility = () => (document.hidden ? tl.pause() : st.isActive && tl.play());
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy() {
      document.removeEventListener('visibilitychange', onVisibility);
      st.kill();
      tl.kill();
      gsap.killTweensOf(root.querySelectorAll('[data-logo-wall-target]'));
    }
  };
}
