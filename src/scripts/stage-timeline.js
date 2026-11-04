// -----------------------------------------
// ADDD — the stage timeline: opening a stage, and keeping its room
// -----------------------------------------
//
// Each stage's box (StageTimeline.astro) opens its card under it, over the
// rows below (stage-timeline.css does the showing: is--open on the row),
// and a marker runs down the chart at the stage's start (is--marking and
// --tl-at on the timeline). One stage is open at a time.
//
// Pressed (its title's button), a stage opens and stays open until it is
// pressed again, another is opened, Escape is pressed or the pointer
// presses anywhere else. With a fine pointer, pointing at a box opens it
// for as long as the pointer is on it or its card (a beat late, so
// passing over the chart does not flicker), unless one is held open.
//
// The chart keeps, under its last row, the room the lowest cards need
// (--tl-room), so opening one never moves anything below it. Measured on
// mount, as the fonts arrive and as the window changes size, never while
// scrolling. Below 992px every card stands open in the flow and nothing
// is kept.

import { registerPageCleanup } from "./page.js";

const WIDE = "(min-width: 992px)";
const FINE = "(hover: hover) and (pointer: fine)";
// how long the pointer rests before a box opens, and leaves before it shuts (ms)
const ENTER = 90;
const LEAVE = 140;

export function initStageTimelines(container) {
  container.querySelectorAll("[data-stage-timeline]").forEach((root) => {
    if (root.stageTimeline) return;
    const chart = root.querySelector(".stage-timeline__chart");
    const stages = [...root.querySelectorAll("[data-stage]")];
    const blocks = stages.map((s) => s.querySelector("[data-stage-block]"));
    const toggles = stages.map((s) => s.querySelector("[data-stage-toggle]"));
    const cards = stages.map((s) => s.querySelector("[data-stage-card]"));
    const wide = matchMedia(WIDE);
    const fine = matchMedia(FINE);
    let current = -1; // the open stage
    let held = false; // opened by a press, not by pointing
    let timer = 0;

    function show(i, hold) {
      clearTimeout(timer);
      held = hold;
      if (i === current) return;
      stages.forEach((s, j) => {
        const on = j === i;
        s.classList.toggle("is--open", on);
        toggles[j]?.setAttribute("aria-expanded", String(on));
      });
      current = i;
      if (i >= 0) root.style.setProperty("--tl-at", stages[i].style.getPropertyValue("--at") || "0");
      root.classList.toggle("is--marking", i >= 0);
    }
    const shut = () => show(-1, false);

    // pressed: open and hold, or let go of the one held
    const onPress = (e) => {
      const i = toggles.indexOf(e.currentTarget);
      if (i === current && held) shut();
      else show(i, true);
    };
    // pointed at (a fine pointer, from 992px): open while the pointer is on it
    const onEnter = (e) => {
      if (!fine.matches || !wide.matches || held) return;
      const i = blocks.indexOf(e.currentTarget);
      clearTimeout(timer);
      timer = setTimeout(() => show(i, false), current >= 0 ? 0 : ENTER);
    };
    const onLeave = () => {
      if (held) return;
      clearTimeout(timer);
      timer = setTimeout(shut, LEAVE);
    };
    // a press anywhere else, or Escape, lets go
    const onDocPress = (e) => {
      if (current < 0 || blocks[current]?.contains(e.target)) return;
      shut();
    };
    const onKey = (e) => {
      if (e.key !== "Escape" || current < 0) return;
      const t = toggles[current];
      shut();
      if (root.contains(document.activeElement)) t?.focus();
    };

    toggles.forEach((t) => t?.addEventListener("click", onPress));
    blocks.forEach((b) => {
      b.addEventListener("pointerenter", onEnter);
      b.addEventListener("pointerleave", onLeave);
    });
    document.addEventListener("pointerdown", onDocPress);
    document.addEventListener("keydown", onKey);

    // the room the lowest cards need under the chart
    function reserve() {
      chart.style.setProperty("--tl-room", "0px");
      if (!wide.matches) return;
      const foot = chart.getBoundingClientRect().bottom;
      const lowest = Math.max(foot, ...cards.map((c) => (c ? c.getBoundingClientRect().bottom : foot)));
      chart.style.setProperty("--tl-room", `${Math.ceil(lowest - foot + 8)}px`);
    }
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reserve);
    };
    reserve();
    document.fonts?.ready.then(reserve);
    window.addEventListener("resize", onResize);
    wide.addEventListener("change", reserve);
    root.stageTimeline = { reserve, show, shut };

    registerPageCleanup(() => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      toggles.forEach((t) => t?.removeEventListener("click", onPress));
      blocks.forEach((b) => {
        b.removeEventListener("pointerenter", onEnter);
        b.removeEventListener("pointerleave", onLeave);
      });
      document.removeEventListener("pointerdown", onDocPress);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      wide.removeEventListener("change", reserve);
      root.stageTimeline = null;
    });
  });
}
