// -----------------------------------------
// ADDD — the stage timeline: opening a stage
// -----------------------------------------
//
// Each stage's block (StageTimeline.astro) opens on its button to show more
// (stage-timeline.css does the opening: rows 0fr to 1fr), and closes again;
// the others are left as they are. The run keeps, from the start, the room
// the opened blocks would need under it (the tallest column, every block
// open), so opening one never moves anything below: measured on mount, as
// the fonts arrive and as the window changes size, never while scrolling.
// Below 992px the stages stand in one column and nothing is reserved.

import { registerPageCleanup } from "./page.js";

const WIDE = "(min-width: 992px)";

export function initStageTimelines(container) {
  container.querySelectorAll("[data-stage-timeline]").forEach((root) => {
    if (root.stageTimeline) return;
    const list = root.querySelector(".stage-timeline__stages");
    const stages = [...root.querySelectorAll(".stage-timeline__stage")];
    const wide = matchMedia(WIDE);

    // the tallest column with its block open: the column's height now,
    // plus what its closed block's more would add
    function reserve() {
      list.style.removeProperty("min-height");
      if (!wide.matches) return;
      const top = list.getBoundingClientRect().top;
      let room = 0;
      stages.forEach((stage) => {
        const block = stage.querySelector("[data-stage-block]");
        const inner = block?.querySelector(".stage-timeline__more-inner");
        const open = block?.classList.contains("is--open");
        const extra = inner && !open ? inner.scrollHeight : 0;
        room = Math.max(room, block.getBoundingClientRect().bottom - top + extra);
      });
      list.style.minHeight = `${Math.ceil(room)}px`;
    }

    const toggles = [...root.querySelectorAll("[data-stage-toggle]")];
    const onClick = (e) => {
      const button = e.currentTarget;
      const block = button.closest("[data-stage-block]");
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      block.classList.toggle("is--open", open);
    };
    toggles.forEach((b) => b.addEventListener("click", onClick));

    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reserve);
    };
    reserve();
    document.fonts?.ready.then(reserve);
    window.addEventListener("resize", onResize);
    wide.addEventListener("change", reserve);
    root.stageTimeline = { reserve };

    registerPageCleanup(() => {
      cancelAnimationFrame(frame);
      toggles.forEach((b) => b.removeEventListener("click", onClick));
      window.removeEventListener("resize", onResize);
      wide.removeEventListener("change", reserve);
      root.stageTimeline = null;
    });
  });
}
