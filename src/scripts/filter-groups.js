// -----------------------------------------
// ADDD — the archive filters (Reports and Newsletter)
// -----------------------------------------
//
// Mounted per page from the registry in site.js.

import { motion, registerPageCleanup } from "./page.js";

/* ============================================================
   filter groups — the archive filters on Reports and Newsletter
   ============================================================ */
/* A group is any element holding both the buttons ([data-filter-target])
   and the things they filter ([data-filter-name]).

   Two axes, both read off the group:
     data-filter-target-match  single | multi  — one button at a time, or
                                                 several selected together
     data-filter-name-match    single | multi  — with several selected, AND
                                                 across them, or OR

   An item's tokens can be written on it directly, or collected from
   whichever children carry [data-filter-name-collect] — which is how both
   archives do it, so the token comes off the category chip already on the
   card rather than being repeated in a second attribute.

   Bound from the page registry (initPage) rather than DOMContentLoaded: Barba
   replaces the container on every navigation, so a one-shot listener on
   the document would only ever wire up the first page loaded. */
export function initFilterGroups(container) {
  // Matches the out transition in the stylesheet — the item is faded before
  // its state flips, so a row never re-flows under a visible card.
  const transitionDelay = motion.reduced ? 0 : 300;
  const groups = [...container.querySelectorAll('[data-filter-group]')];

  groups.forEach(group => {
    const targetMatch = (group.getAttribute('data-filter-target-match') || 'multi').trim().toLowerCase();
    const nameMatch   = (group.getAttribute('data-filter-name-match')   || 'multi').trim().toLowerCase();

    const buttons = [...group.querySelectorAll('[data-filter-target]')];
    const items   = [...group.querySelectorAll('[data-filter-name]')];

    // Collect tokens from children if present
    items.forEach(item => {
      const collectors = item.querySelectorAll('[data-filter-name-collect]');
      if (!collectors.length) return;
      const seen = new Set(), tokens = [];
      collectors.forEach(c => {
        const v = (c.getAttribute('data-filter-name-collect') || '').trim().toLowerCase();
        if (v && !seen.has(v)) {
          seen.add(v);
          tokens.push(v);
        }
      });
      if (tokens.length) item.setAttribute('data-filter-name', tokens.join(' '));
    });

    // Cache item tokens
    const itemTokens = new Map();
    items.forEach(el => {
      const raw = (el.getAttribute('data-filter-name') || '').trim().toLowerCase();
      const tokens = raw ? raw.split(/\s+/).filter(Boolean) : [];
      itemTokens.set(el, new Set(tokens));
    });

    const setItemState = (el, on) => {
      const next = on ? 'active' : 'not-active';
      if (el.getAttribute('data-filter-status') !== next) {
        el.setAttribute('data-filter-status', next);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      }
    };

    const setButtonState = (btn, on) => {
      const next = on ? 'active' : 'not-active';
      if (btn.getAttribute('data-filter-status') !== next) {
        btn.setAttribute('data-filter-status', next);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    };

    // Active tags model
    let activeTags = targetMatch === 'single' ? null : new Set(['all']);

    const hasRealActive = () => {
      if (targetMatch === 'single') return activeTags !== null;
      return activeTags.size > 0 && !activeTags.has('all');
    };

    const resetAll = () => {
      if (targetMatch === 'single') {
        activeTags = null;
      } else {
        activeTags.clear();
        activeTags.add('all');
      }
    };

    // Matching logic
    const itemMatches = (el) => {
      if (!hasRealActive()) return true;
      const tokens = itemTokens.get(el);

      if (targetMatch === 'single') {
        return tokens.has(activeTags);
      } else {
        const selected = [...activeTags];
        if (nameMatch === 'single') {
          // AND logic: must contain all selected
          for (let i = 0; i < selected.length; i++) {
            if (!tokens.has(selected[i])) return false;
          }
          return true;
        } else {
          // OR logic: must contain any selected
          for (let i = 0; i < selected.length; i++) {
            if (tokens.has(selected[i])) return true;
          }
          return false;
        }
      }
    };

    // `force` is the one addition to the reference: its guard makes the
    // opening paint('all') a no-op, since nothing is selected yet, and the
    // group would render with no state written at all — no active pill and
    // no aria on any card. It still guards every user click.
    const paint = (rawTarget, force) => {
      const target = (rawTarget || '').trim().toLowerCase();
      if (!force && (target === 'all' || target === 'reset') && !hasRealActive()) return;

      if (target === 'all' || target === 'reset') {
        resetAll();
      } else if (targetMatch === 'single') {
        activeTags = target;
      } else {
        if (activeTags.has('all')) activeTags.delete('all');
        if (activeTags.has(target)) activeTags.delete(target);
        else activeTags.add(target);
        if (activeTags.size === 0) resetAll();
      }

      // Update items
      items.forEach(el => {
        if (el._ft) clearTimeout(el._ft);
        const next = itemMatches(el);
        const cur = el.getAttribute('data-filter-status');
        if (cur === 'active' && transitionDelay > 0) {
          el.setAttribute('data-filter-status', 'transition-out');
          el._ft = setTimeout(() => { setItemState(el, next); el._ft = null; }, transitionDelay);
        } else if (transitionDelay > 0) {
          el._ft = setTimeout(() => { setItemState(el, next); el._ft = null; }, transitionDelay);
        } else {
          setItemState(el, next);
        }
      });

      // Update buttons
      buttons.forEach(btn => {
        const t = (btn.getAttribute('data-filter-target') || '').trim().toLowerCase();
        let on = false;
        if (t === 'all') on = !hasRealActive();
        else if (t === 'reset') on = hasRealActive();
        else on = targetMatch === 'single' ? activeTags === t : activeTags.has(t);
        setButtonState(btn, on);
      });
    };

    group.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter-target]');
      if (btn && group.contains(btn)) paint(btn.getAttribute('data-filter-target'));
    });

    // The pending state flips are the only thing that outlives the page —
    // the listener goes with the container Barba removes.
    registerPageCleanup(() => {
      items.forEach(el => { if (el._ft) { clearTimeout(el._ft); el._ft = null; } });
    });

    paint('all', true);
  });
}
