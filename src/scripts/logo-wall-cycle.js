/* ============================================================
   Logo Wall Cycle — the homepage's wall of client logos
   (Osmo Supply's resource, index.astro)
   ------------------------------------------------------------
   The cards CSS displays show logos; the rest wait in a pool. On a
   loop, one card at a time (in a shuffled order) slides its logo up
   and out while the next from the pool slides up into it. When every
   logo is on show (the homepage: all ten cards), there is no pool, so
   two cards trade logos instead, with the same slide, the second a
   beat after the first (TRADE_LAG) so no two change together, and the
   wait between swaps varies a little either side of the loop's
   (LOOP_SWAY), so the wall never ticks like a clock. Osmo's
   code otherwise as supplied, made a page component: mounted per page and
   undone on leaving (the loop, ScrollTrigger, listener), and still
   under reduced motion. GSAP and ScrollTrigger are the site's globals.
   ============================================================ */
export function mountLogoWallCycle(root) {
  const loopDelay = 1.5;   // Loop Duration
  const duration  = 0.9;   // Animation Duration
  // in a trade, the second card starts this long after the first (s)
  const TRADE_LAG = [0.4, 0.6];
  // each wait between swaps, a share either side of loopDelay
  const LOOP_SWAY = 0.2;
  const between = ([a, b]) => a + Math.random() * (b - a);

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

  // The loop: a swap, then the next after a wait drawn afresh round
  // loopDelay (so the average frequency is the loop's own), each a call
  // of its own; paused off screen and with the tab hidden.
  let next = null;
  let playing = true;
  const wait = () => loopDelay * between([1 - LOOP_SWAY, 1 + LOOP_SWAY]);
  function tick() {
    next = null;
    swapNext();
    // (a swap that found the wall changed has set it up afresh, with its
    // own first call)
    if (!next) next = gsap.delayedCall(wait(), tick);
    if (!playing) next.pause();
  }
  const loop = {
    play()  { playing = true; next?.resume(); },
    pause() { playing = false; next?.pause(); },
    kill()  { next?.kill(); next = null; },
  };

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
    loop.kill();
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

    // the first swap at once
    next = gsap.delayedCall(0, tick);
    if (!playing) next.pause();
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
      const lag = between(TRADE_LAG);
      parents.forEach((p, i) => slide(p, currents[i], currents[1 - i].cloneNode(true), true, i ? lag : 0));
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
  function slide(parent, current, incoming, traded, after = 0) {
    gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
    parent.appendChild(incoming);

    if (current) {
      gsap.to(current, {
        yPercent: -50,
        autoAlpha: 0,
        duration,
        delay: after,
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
      delay: after + 0.1,
      ease: "expo.inOut"
    });
  }

  setup();

  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onEnter:     () => loop.play(),
    onLeave:     () => loop.pause(),
    onEnterBack: () => loop.play(),
    onLeaveBack: () => loop.pause()
  });
  if (!st.isActive) loop.pause();

  const onVisibility = () => (document.hidden ? loop.pause() : st.isActive && loop.play());
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy() {
      document.removeEventListener('visibilitychange', onVisibility);
      st.kill();
      loop.kill();
      gsap.killTweensOf(root.querySelectorAll('[data-logo-wall-target]'));
    }
  };
}
