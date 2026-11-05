// -----------------------------------------
// ADDD — Themes Covered (the Advisory page, 2026-11-05)
// -----------------------------------------
//
// A [data-theme-list]: a large list of themes ([data-theme-item], one row
// each, all the same height) beside a drawing per theme ([data-theme-vis])
// held on the screen while the list scrolls (position: sticky, advisory.css).
// The theme at the middle of the screen is the active one: dark, its drawing
// shown, its name in the caption and its number in the count. One
// ScrollTrigger over the list turns its progress into a row (the rows are
// equal, so progress × rows is the row at the middle), and the page changes
// only when that row changes, so a fast scroll lands on the right row
// without work on every frame. Pointing at a row (or focusing it) makes it
// the active one until the list is left or the page scrolls on.

import { registerPageCleanup } from "./page.js";

export function initThemeList(container) {
  container.querySelectorAll("[data-theme-list]").forEach((root) => {
    if (root.themeListBound) return;
    root.themeListBound = true;
    const list = root.querySelector("[data-theme-items]");
    const items = [...root.querySelectorAll("[data-theme-item]")];
    const visuals = [...root.querySelectorAll("[data-theme-vis]")];
    const caption = root.querySelector("[data-theme-caption]");
    const count = root.querySelector("[data-theme-count]");
    if (!list || !items.length) return;

    const n = items.length;
    let shown = 0;
    let scrolled = 0;

    function show(i) {
      if (i === shown) return;
      items[shown]?.classList.remove("is--active");
      visuals[shown]?.classList.remove("is--active");
      items[i]?.classList.add("is--active");
      visuals[i]?.classList.add("is--active");
      if (caption) caption.textContent = items[i]?.textContent ?? "";
      if (count) count.textContent = String(i + 1).padStart(2, "0");
      shown = i;
    }

    const fromProgress = (p) => Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    // from the first row's top to the last row's foot at the screen's middle
    // (not the list's: its padding is room, not rows)
    const trigger = ScrollTrigger.create({
      trigger: items[0],
      endTrigger: items[n - 1],
      start: "top center",
      end: "bottom center",
      onUpdate(self) {
        scrolled = fromProgress(self.progress);
        show(scrolled);
      },
      onRefresh(self) {
        scrolled = fromProgress(self.progress);
        show(scrolled);
      },
    });

    // pointed at or focused: that row, until the list is left
    const onEnter = (e) => show(items.indexOf(e.currentTarget));
    const onLeave = () => show(scrolled);
    const canHover = window.matchMedia("(hover: hover)").matches;
    items.forEach((item) => {
      if (canHover) item.addEventListener("pointerenter", onEnter);
      item.addEventListener("focus", onEnter);
    });
    if (canHover) list.addEventListener("pointerleave", onLeave);

    registerPageCleanup(() => {
      trigger.kill();
      items.forEach((item) => {
        item.removeEventListener("pointerenter", onEnter);
        item.removeEventListener("focus", onEnter);
      });
      list.removeEventListener("pointerleave", onLeave);
      root.themeListBound = false;
    });
  });
}
