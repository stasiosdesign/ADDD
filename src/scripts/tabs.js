// -----------------------------------------
// ADDD — tabs
// -----------------------------------------
//
// A [data-tabs] group: buttons with role="tab", each naming its panel
// (aria-controls), the panels role="tabpanel". The Technology Blueprint's
// "What we look at" (pages.css, "The tabs' panels"). Pressed (or reached by
// the arrow keys, Home and End, which move along the tabs and open each as
// it is reached), a tab is selected and its panel shown: the tab marked
// aria-selected and in the filters' active look (data-filter-status), the
// only one in the tab order; its panel is-active, which the stylesheet
// fades in while the one before fades out. Listeners live on the tabs, so
// they leave with their page.

import { registerPageCleanup } from "./page.js";

export function initTabs(container) {
  container.querySelectorAll("[data-tabs]").forEach((root) => {
    if (root.tabsBound) return;
    root.tabsBound = true;
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

    function select(tab, focus = false) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) t.setAttribute("data-filter-status", "active");
        else t.removeAttribute("data-filter-status");
        panelOf(t)?.classList.toggle("is--active", on);
      });
      if (focus) tab.focus();
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
      tabs.forEach((t) => {
        t.removeEventListener("click", onClick);
        t.removeEventListener("keydown", onKey);
      });
      root.tabsBound = false;
    });
  });
}
