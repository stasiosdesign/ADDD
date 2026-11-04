// -----------------------------------------
// ADDD — tabs
// -----------------------------------------
//
// A [data-tabs] group: buttons with role="tab", each naming its panel
// (aria-controls), the panels role="tabpanel". The Technology Blueprint's
// "What we look at" (pages.css, "What we look at": since 2026-11-04 a
// column of rows beside a dark panel). A group may have a pill that glides
// to the open tab (a [data-tabs-glider] in the tablist, given the open
// tab's offset and width as --glider-x and --glider-w, from the tab's own
// box, when a tab is chosen and whenever the list changes size). Pressed (or reached by the arrow keys,
// Home and End, which move along the tabs and open each as it is reached),
// a tab is selected and its panel shown: the tab marked aria-selected
// (and data-filter-status), the only one in the tab order; its panel
// is-active, which the stylesheet opens and fades in while the one before
// closes. Listeners live on the tabs, so they leave with their page.

import { registerPageCleanup } from "./page.js";

export function initTabs(container) {
  container.querySelectorAll("[data-tabs]").forEach((root) => {
    if (root.tabsBound) return;
    root.tabsBound = true;
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));
    const glider = root.querySelector("[data-tabs-glider]");
    const list = glider?.parentElement;
    let open = tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabs[0];
    // the pill to the open tab; at once (no glide) when it is first placed
    // or the list has changed size
    function glide(instant = false) {
      if (!glider || !open) return;
      if (instant) glider.classList.add("is--instant");
      glider.style.setProperty("--glider-x", `${open.offsetLeft}px`);
      glider.style.setProperty("--glider-w", `${open.offsetWidth}px`);
      if (instant) requestAnimationFrame(() => requestAnimationFrame(() => glider.classList.remove("is--instant")));
      // a bar wider than the screen (a phone) scrolls the open tab into view
      if (list && list.scrollWidth > list.clientWidth) {
        const left = open.offsetLeft - (list.clientWidth - open.offsetWidth) / 2;
        list.scrollTo({ left, behavior: instant ? "auto" : "smooth" });
      }
    }
    const sized = glider ? new ResizeObserver(() => glide(true)) : null;
    sized?.observe(list);

    function select(tab, focus = false) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) t.setAttribute("data-filter-status", "active");
        else t.removeAttribute("data-filter-status");
        panelOf(t)?.classList.toggle("is--active", on);
      });
      open = tab;
      glide();
      if (focus) tab.focus({ preventScroll: true });
    }

    const onClick = (e) => select(e.currentTarget);
    const onKey = (e) => {
      const i = tabs.indexOf(e.currentTarget);
      const to = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowDown: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        ArrowUp: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(tabs[to], true);
    };
    tabs.forEach((t) => {
      t.addEventListener("click", onClick);
      t.addEventListener("keydown", onKey);
    });

    registerPageCleanup(() => {
      sized?.disconnect();
      tabs.forEach((t) => {
        t.removeEventListener("click", onClick);
        t.removeEventListener("keydown", onKey);
      });
      root.tabsBound = false;
    });
  });
}
