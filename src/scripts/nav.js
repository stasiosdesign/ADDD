// -----------------------------------------
// ADDD — the navigation
// -----------------------------------------
//
// The mega nav, its reveal and its theme, and the logo's morph. The nav
// lives outside the Barba container, so initNav() runs once per document
// load. Its links' scramble and dotted underline are the site's one text-
// link hover (text-scramble.js), bound here for the bar's links and with
// each page for the page's own. gsap and its plugins are the site's
// globals.

import "./gsap-setup.js";
import { motion, isSamePage } from "./page.js";
import { lenis, glideTo } from "./scroll.js";
import { parallaxTravel } from "./parallax.js";
import { mountIsoField } from "./dot-field.js";
import { mountWordCycle } from "./word-cycle.js";
import { LETTER_COUNT, morphPath, getMorphEase } from "./logo-morph.js";
import { initTextScramble } from "./text-scramble.js";

// the nav's change between its light and dark states (initNavTheme)
CustomEase.create("navTheme", "0.45, 0, 0.25, 1");

/** The nav and the logo, wired up once per document. */
export function initNav() {
  initMegaNav();
  initNavReveal();
  initNavLogo();
  initTextScramble(document.querySelector("[data-menu-wrap]"));
}

/* ============================================================
   Mega nav — directional hover dropdowns, mobile slide-over panels.
   Lives outside the Barba container, so this runs once per document.
   ============================================================ */
function initMegaNav() {
  // On desktop both panels open item by item: the open panel stands in
  // the dropdown's flow, so the dropdown is its height without being
  // measured or animated, and each of its columns (Services' cards,
  // Resources' blocks) drops in from under the bar on its own, clipped by
  // the dropdown's top edge, one after the next, left to right, while the
  // dimmed page comes up behind them; closing, they lift back up under
  // it, the last first. Going from one panel to the other, the open
  // panel's columns lift out while the other's drop in over them, the
  // dimmed page staying as it is. Only transforms and opacity move.
  const DUR = {
    // the mobile drawer's panels, item by item
    stagger: 0.06,
    backdropIn: 0.35,
    backdropOut: 0.25,
    dropIn: 0.55,
    dropStagger: 0.07,
    liftOut: 0.3,
    liftStagger: 0.04,
  };

  const HOVER_ENTER = 120;
  const HOVER_LEAVE = 150;

  // DOM references
  const menuWrap = document.querySelector("[data-menu-wrap]");
  const navList = document.querySelector("[data-nav-list]");
  const dropWrapper = document.querySelector("[data-dropdown-wrapper]");
  const dropContainer = document.querySelector("[data-dropdown-container]");
  const backdrop = document.querySelector("[data-menu-backdrop]");
  const toggles = [...document.querySelectorAll("[data-dropdown-toggle]")];
  const panels = [...document.querySelectorAll("[data-nav-content]")];
  const burger = document.querySelector("[data-burger-toggle]");
  const backBtn = document.querySelector("[data-mobile-back]");
  const logo = document.querySelector("[data-menu-logo]");
  // The menu's four triangles, each with the turn it rests at (Nav.astro)
  const burgerMarks = [...document.querySelectorAll("[data-burger-mark]")];
  const markTurn = (_, el) => Number(el.dataset.burgerMark);

  if (!menuWrap || !navList || !dropWrapper) return;

  // The Services cards' dotted patterns (ServiceCard.astro, dot-field.js):
  // mounted once, as the nav outlives every page, and redrawn by their own
  // observer as they resize. Their ink is the nav's state, so they are
  // drawn again in it each time it reaches the dropdown (initNavTheme).
  const cardFields = [...menuWrap.querySelectorAll("[data-iso-field]")].map((el) => mountIsoField(el));
  menuWrap.addEventListener("navthemechange", () => cardFields.forEach((f) => f.redraw()));
  // The Workshop card's turning ending, the homepage hero's word cycle
  // (word-cycle.js): mounted once too. It holds while the dropdown is
  // closed (clipped out of sight, so its observer counts it off screen),
  // and each time the dropdown opens the word stands a while before it
  // turns.
  menuWrap.querySelectorAll("[data-word-cycle]").forEach((el) => mountWordCycle(el));

  // State
  const state = {
    isOpen: false,
    // the close is playing: still open until it ends, but not to be kept
    closing: false,
    activePanel: null,
    isMobile: window.innerWidth <= 991,
    mobileMenuOpen: false,
    mobilePanelActive: null,
    hoverTimer: null,
    leaveTimer: null,
    tl: null,
    mobileTl: null,
    mobilePanelTl: null,
    // from a navigation's click until the page wipe covers the screen
    navigating: false,
  };

  // Lookups — the nav is never replaced, so every list is collected once.
  const panelByName = new Map(panels.map((p) => [p.dataset.navContent, p]));
  const toggleByName = new Map(toggles.map((t) => [t.dataset.dropdownToggle, t]));
  const fadeByPanel = new Map(panels.map((p) => [p, p.querySelectorAll("[data-menu-fade]")]));
  const navItems = navList.querySelectorAll("[data-nav-list-item]");
  const getPanel = (name) => panelByName.get(name);
  const getToggle = (name) => toggleByName.get(name);
  const getFade = (el) => fadeByPanel.get(el);
  // the drawer's items one after the next, as the desktop's columns drop in
  const stagger = (n) => (n <= 1 ? 0 : { each: DUR.stagger });

  function clearTimers() {
    clearTimeout(state.hoverTimer);
    clearTimeout(state.leaveTimer);
    state.hoverTimer = state.leaveTimer = null;
  }

  function killTl(key) {
    if (state[key]) { state[key].kill(); state[key] = null; }
  }

  function killDropdown() {
    killTl("tl");
    gsap.killTweensOf(backdrop);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function killMobile() {
    killTl("mobileTl");
    gsap.killTweensOf([navList, ...burgerMarks]);
  }

  function killMobilePanel() {
    killTl("mobilePanelTl");
    gsap.killTweensOf(navItems);
    gsap.killTweensOf([backBtn, logo]);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function resetToggles() {
    toggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  // A desktop panel put away: hidden, out of the dropdown's flow, its
  // blocks back to rest.
  function hidePanel(p) {
    gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", x: 0, y: 0, xPercent: 0, clearProps: "position,zIndex" });
    gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0, xPercent: 0, yPercent: 0 });
  }

  // The panel being opened: in the dropdown's flow, so the dropdown is its
  // height, and over any panel still leaving; its blocks are the caller's.
  function showPanel(p) {
    gsap.set(p, { position: "relative", zIndex: 1, visibility: "visible", opacity: 1, pointerEvents: "auto" });
  }

  function resetDesktop() {
    panels.forEach(hidePanel);

    gsap.set(dropContainer, { clearProps: "height,transform" });
    gsap.set(backdrop, { autoAlpha: 0 });

    menuWrap.setAttribute("data-menu-open", "false");
    resetToggles();
  }

  function setupMobile() {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: "visible", pointerEvents: "none", clearProps: "position,zIndex" });
      gsap.set(getFade(p), { xPercent: 20, yPercent: 0, autoAlpha: 0 });
    });
    gsap.set(navItems, { xPercent: 0, y: 0, autoAlpha: 1 });
    gsap.set(navList, { autoAlpha: 0, x: 0 });
    gsap.set(backBtn, { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 1 });
    gsap.set(dropContainer, { clearProps: "height" });
    gsap.set(backdrop, { autoAlpha: 0 });
  }

  // DESKTOP — a panel's blocks dropping in from under the bar, one after
  // the next, from wherever they are (so a panel caught leaving comes
  // straight back rather than starting over)
  function dropIn(tl, blocks, at = 0) {
    if (!blocks.length) return;
    gsap.set(blocks, { autoAlpha: 1 });
    tl.to(blocks, { yPercent: 0, duration: DUR.dropIn, stagger: DUR.dropStagger, ease: "osmo" }, at);
  }

  // DESKTOP — and lifting back up under it, the last first
  function liftOut(tl, blocks, at = 0) {
    if (!blocks.length) return;
    tl.to(blocks, { yPercent: -100, duration: DUR.liftOut, stagger: { each: DUR.liftStagger, from: "end" }, ease: "power2.in" }, at);
  }

  // DESKTOP — open dropdown (first open)
  function openDropdown(panelName) {
    if (state.navigating) return;
    if (state.isOpen && !state.closing && state.activePanel === panelName) return;
    if (state.isOpen && !state.closing) return switchPanel(state.activePanel, panelName);

    const el = getPanel(panelName);
    if (!el) return;
    const blocks = getFade(el);
    const toggle = getToggle(panelName);
    // back over the panel that is shutting: its blocks come back down from
    // where they are; anything else opens from rest, blocks above the edge
    const reopening = state.closing && state.activePanel === panelName;

    killDropdown();
    if (!reopening) {
      resetDesktop();
      gsap.set(blocks, { yPercent: -100 });
    }

    state.isOpen = true;
    state.closing = false;
    state.activePanel = panelName;
    menuWrap.setAttribute("data-menu-open", "true");
    resetToggles();
    if (toggle) toggle.setAttribute("aria-expanded", "true");

    showPanel(el);
    const tl = gsap.timeline();
    state.tl = tl;
    tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: "power2.out" }, 0);
    dropIn(tl, blocks);
  }

  // DESKTOP — close dropdown
  function closeDropdown() {
    if (!state.isOpen || state.closing || state.navigating) return;
    const el = getPanel(state.activePanel);

    killDropdown();
    state.closing = true;

    const tl = gsap.timeline({
      onComplete() {
        state.isOpen = false;
        state.closing = false;
        state.activePanel = null;
        state.tl = null;
        resetDesktop();
      },
    });
    state.tl = tl;
    if (el) {
      gsap.set(el, { pointerEvents: "none" });
      liftOut(tl, getFade(el));
    }
    tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: "power2.out" }, 0.05);
  }

  // DESKTOP — switch panel: the open panel's blocks lift out while the
  // other's drop in over them, over the dimmed page, which stays as it is
  function switchPanel(fromName, toName) {
    const fromEl = getPanel(fromName), toEl = getPanel(toName);
    if (!fromEl || !toEl) return;
    const fromBlocks = getFade(fromEl), toBlocks = getFade(toEl);

    killDropdown();
    panels.forEach((p) => { if (p !== fromEl) hidePanel(p); });
    // the panel leaving: out of the flow, under the one arriving, still
    // drawn where it was while its blocks go
    gsap.set(fromEl, { position: "absolute", zIndex: 0, pointerEvents: "none" });
    gsap.set(toBlocks, { yPercent: -100 });
    showPanel(toEl);
    gsap.set(backdrop, { autoAlpha: 1 });

    const toToggle = getToggle(toName);
    state.activePanel = toName;
    resetToggles();
    if (toToggle) toToggle.setAttribute("aria-expanded", "true");

    const tl = gsap.timeline();
    state.tl = tl;
    liftOut(tl, fromBlocks);
    tl.add(() => hidePanel(fromEl));
    dropIn(tl, toBlocks, 0.1);
  }

  // DESKTOP — hover intent, for a mouse or a pen. A tap on a touch screen
  // fires its own mouseenter and mouseleave around the click, which would
  // open the dropdown and shut it again; a tap is the click's to handle
  // (handleToggleClick), so the hover handlers stand aside for it.
  let lastPointer = "mouse";
  const byTouch = () => lastPointer === "touch";

  function handleToggleEnter(e) {
    if (state.isMobile || byTouch()) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
  }

  // one pending close at a time: a new one replaces any already waiting
  function scheduleClose() {
    clearTimeout(state.leaveTimer);
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  function handleToggleLeave() {
    if (state.isMobile || byTouch()) return;
    clearTimeout(state.hoverTimer); state.hoverTimer = null;
    scheduleClose();
  }

  function handleWrapperEnter() {
    if (state.isMobile || byTouch()) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
    // back over the dropdown while it is shutting: open it again
    if (state.closing && state.activePanel) openDropdown(state.activePanel);
  }

  function handleWrapperLeave() {
    if (state.isMobile || byTouch()) return;
    scheduleClose();
  }

  // DESKTOP — close behaviours
  function handleEscape(e) {
    if (e.key !== "Escape") return;
    if (state.isMobile) {
      state.mobilePanelActive ? closeMobilePanel() : state.mobileMenuOpen && closeMobileMenu();
      return;
    }
    if (state.isOpen) {
      const t = getToggle(state.activePanel);
      closeDropdown();
      if (t) t.focus();
    }
  }

  function handleDocClick(e) {
    if (state.isMobile || !state.isOpen) return;
    if (!e.target.closest("[data-menu-wrap]")) closeDropdown();
  }

  // A link to the page already open — the logo on the homepage, above all —
  // is no navigation (Barba leaves it: isSamePage, page.js): the menu
  // closes if it is open and the page glides back to its top, at a pace
  // that grows with the way it has to go. A click meant for elsewhere (a
  // new tab or window, a download) is left to the browser.
  function handleSamePageClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") || !isSamePage(link.href)) return;
    e.preventDefault();
    // the site's one glide (scroll.js)
    const toTop = () => glideTo(0, { force: true });
    if (state.mobileMenuOpen) return closeMobileMenu().then(toTop);
    if (state.isOpen) closeDropdown();
    toTop();
  }

  // DESKTOP — keyboard navigation
  function focusFirstLink(panelName) {
    setTimeout(() => {
      const el = getPanel(panelName);
      if (!el) return;
      const link = el.querySelector("a");
      if (!link) return;
      gsap.set(link, { visibility: "visible" });
      link.focus();
    }, 80);
  }

  function handleKeydownOnToggle(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (state.isOpen && state.activePanel === name) closeDropdown();
      else { openDropdown(name); focusFirstLink(name); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!state.isOpen || state.activePanel !== name) openDropdown(name);
      focusFirstLink(name);
    }
    if (e.key === "Tab" && !e.shiftKey && state.isOpen && state.activePanel === name) {
      e.preventDefault();
      const link = getPanel(name)?.querySelector("a");
      if (link) link.focus();
    }
  }

  function handleKeydownInPanel(e) {
    if (state.isMobile || !state.isOpen) return;
    const el = getPanel(state.activePanel);
    if (!el) return;

    const links = [...el.querySelectorAll("a")];
    const idx = links.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      links[(idx + 1) % links.length].focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx <= 0) { const t = getToggle(state.activePanel); if (t) t.focus(); }
      else links[idx - 1].focus();
    }
    if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
      e.preventDefault();
      const curIdx = toggles.indexOf(getToggle(state.activePanel));
      const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
      closeDropdown();
      if (next) next.focus();
    }
    if (e.key === "Tab" && e.shiftKey && idx === 0) {
      e.preventDefault();
      const t = getToggle(state.activePanel);
      if (t) t.focus();
    }
  }

  // MOBILE — burger animation: open, each triangle turns an eighth on, so
  // the four that chase each other round the square all point at its
  // middle (the close); shut, they turn back to chasing.
  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to(burgerMarks, { rotation: (i, el) => markTurn(i, el) + (toX ? 45 : 0), duration: 0.3 }, 0);
    return tl;
  }

  // MOBILE — page scroll lock
  // The page scrolls on <html>, not <body>, so body's overflow cannot hold
  // it still under the open drawer. Stopped, Lenis blocks wheel and touch
  // scrolling everywhere except inside an element marked data-lenis-prevent
  // — which the drawer and the panels are given only while they are taller
  // than the screen, so they still scroll then, and a swipe on one that fits
  // is blocked like the rest of the page.
  const scrollAreas = [navList, ...panels];
  let pageScrollLocked = false;

  function lockPageScroll() {
    pageScrollLocked = true;
    lenis.stop();
    scrollAreas.forEach((el) => el.toggleAttribute("data-lenis-prevent", el.scrollHeight > el.clientHeight));
  }

  function unlockPageScroll() {
    if (!pageScrollLocked) return;
    pageScrollLocked = false;
    scrollAreas.forEach((el) => el.removeAttribute("data-lenis-prevent"));
    lenis.start();
  }

  // MOBILE — open/close menu
  function openMobileMenu() {
    killMobile();
    state.mobileMenuOpen = true;
    menuWrap.setAttribute("data-menu-open", "true");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    lockPageScroll();

    const tl = gsap.timeline();
    state.mobileTl = tl;
    tl.add(animateBurger(true), 0);
    tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0);
    if (navItems.length) {
      tl.fromTo(navItems,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power3.out" },
        0.15
      );
    }
  }

  function closeMobileMenu() {
    const hadPanel = state.mobilePanelActive;
    const panelEl = hadPanel ? getPanel(hadPanel) : null;

    killMobile();
    killMobilePanel();

    menuWrap.setAttribute("data-menu-open", "false");
    state.mobileMenuOpen = false;
    state.mobilePanelActive = null;
    burger.setAttribute("aria-expanded", "false");

    const tl = gsap.timeline({
      onComplete() {
        document.body.style.overflow = "";
        unlockPageScroll();
        state.mobileTl = null;
        setupMobile();
      },
    });
    state.mobileTl = tl;

    tl.add(animateBurger(false), 0);

    if (hadPanel && panelEl) {
      tl.to(panelEl, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
    }

    tl.to(navList, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
    return tl;
  }

  // MOBILE — slide-over panels
  function openMobilePanel(panelName) {
    const el = getPanel(panelName);
    if (!el) return;
    killMobilePanel();
    state.mobilePanelActive = panelName;

    const panelFade = getFade(el);

    const tl = gsap.timeline();
    state.mobilePanelTl = tl;

    if (navItems.length) {
      tl.to(navItems, {
        xPercent: -10, autoAlpha: 0,
        duration: 0.35, stagger: 0.03, ease: "power2.in",
      }, 0);
    }

    tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(backBtn, { autoAlpha: 1, duration: 0.25, ease: "power2.inOut" }, 0.15);

    tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: "auto" }, 0.2);
    if (panelFade.length) {
      tl.fromTo(panelFade,
        { xPercent: 8, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.3, stagger: stagger(panelFade.length), ease: "power3.out" },
        0.25
      );
    }
  }

  function closeMobilePanel() {
    if (!state.mobilePanelActive) return;
    const el = getPanel(state.mobilePanelActive);
    if (!el) return;
    killMobilePanel();

    const panelFade = getFade(el);

    const tl = gsap.timeline({
      onComplete() { state.mobilePanelActive = null; state.mobilePanelTl = null; },
    });
    state.mobilePanelTl = tl;

    if (panelFade.length) {
      tl.to(el, {
        xPercent: 20, autoAlpha: 0,
        duration: 0.3, stagger: 0.02, ease: "power2.in",
      }, 0);
    }

    tl.set(el, { autoAlpha: 0, pointerEvents: "none" }, 0.25);

    tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0.15);

    if (navItems.length) {
      tl.fromTo(navItems,
        { xPercent: -20, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: "power3.out" },
        0.25
      );
    }
  }

  function handleToggleClick(e) {
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    // desktop, from a tap: the tap opens the dropdown and a second tap on
    // the same toggle shuts it (a tap anywhere else shuts it too,
    // handleDocClick)
    if (!state.isMobile) {
      if (!byTouch()) return;
      e.preventDefault();
      if (state.isOpen && !state.closing && state.activePanel === name) closeDropdown();
      else openDropdown(name);
      return;
    }
    if (!state.mobileMenuOpen) return;
    e.preventDefault();
    openMobilePanel(name);
  }

  // A navigation leaves the menu exactly as it is while the page wipe rises
  // over it: closing it on the click played its whole closing move — the
  // dropdown springing up, the drawer fading — ahead of the panel. Held
  // still, it cannot be opened or closed under the wipe either (the panel
  // takes no pointer events, so hover intent would otherwise go on acting
  // as the panel slides under the pointer). Once the panel covers the
  // screen the menu is put back to rest in a single frame, unseen, so the
  // next page starts with it closed.
  function holdForNavigation() {
    state.navigating = true;
    clearTimers();
  }

  function resetForNewPage() {
    if (state.isMobile) {
      if (state.mobileMenuOpen) {
        killMobile();
        killMobilePanel();
        gsap.set(burgerMarks, { rotation: markTurn });
        burger.setAttribute("aria-expanded", "false");
        menuWrap.setAttribute("data-menu-open", "false");
        state.mobileMenuOpen = false;
        state.mobilePanelActive = null;
        document.body.style.overflow = "";
        unlockPageScroll();
        setupMobile();
      }
    } else if (state.isOpen) {
      killDropdown();
      state.isOpen = false; state.closing = false;
      state.activePanel = null;
      resetDesktop();
    }
    state.navigating = false;
  }

  // RESIZE
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  function handleResize() {
    const w = window.innerWidth;
    if (w === lastWidth) return;
    lastWidth = w;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const was = state.isMobile;
      state.isMobile = window.innerWidth <= 991;

      if (was && !state.isMobile) {
        killMobile(); killMobilePanel();
        gsap.set(navList, { clearProps: "all" });
        gsap.set(navItems, { clearProps: "all" });
        gsap.set(backBtn, { autoAlpha: 0 });
        gsap.set(logo, { clearProps: "all" });
        gsap.set(burgerMarks, { rotation: markTurn });

        panels.forEach((p) => {
          gsap.set(p, { clearProps: "all" });
          gsap.set(getFade(p), { clearProps: "all" });
        });

        burger.setAttribute("aria-expanded", "false");
        // also covers a close that was still animating when it was killed
        unlockPageScroll();
        state.mobileMenuOpen = false;
        state.mobilePanelActive = null;
        document.body.style.overflow = "";
        resetDesktop();
      }

      if (!was && state.isMobile) {
        killDropdown();
        state.isOpen = false; state.closing = false; state.activePanel = null;
        clearTimers();
        menuWrap.setAttribute("data-menu-open", "false");
        resetToggles();
        setupMobile();
      }

    }, 150);
  }

  // EVENT BINDING
  // which kind of pointer was last used, so a tap is told from a click
  // (the hover handlers above), and a mouse moved again after a tap, on a
  // device with both, hovers again
  const notePointer = (e) => { lastPointer = e.pointerType || "mouse"; };
  document.addEventListener("pointerdown", notePointer, { capture: true, passive: true });
  document.addEventListener("pointermove", notePointer, { capture: true, passive: true });

  toggles.forEach((btn) => {
    btn.addEventListener("mouseenter", handleToggleEnter);
    btn.addEventListener("mouseleave", handleToggleLeave);
    btn.addEventListener("keydown", handleKeydownOnToggle);
    btn.addEventListener("click", handleToggleClick);
  });

  dropWrapper.addEventListener("mouseenter", handleWrapperEnter);
  dropWrapper.addEventListener("mouseleave", handleWrapperLeave);

  panels.forEach((p) => p.addEventListener("keydown", handleKeydownInPanel));

  backdrop.addEventListener("click", closeDropdown);

  document.addEventListener("keydown", handleEscape);
  document.addEventListener("click", handleDocClick);
  document.addEventListener("click", handleSamePageClick);

  burger.addEventListener("click", () => state.mobileMenuOpen ? closeMobileMenu() : openMobileMenu());

  backBtn.addEventListener("click", closeMobilePanel);

  window.addEventListener("resize", handleResize);

  barba.hooks.beforeLeave(holdForNavigation);
  barba.hooks.afterLeave(resetForNewPage);

  // INIT
  state.isMobile ? setupMobile() : resetDesktop();
}

/* ============================================================
   Nav reveal — the bar steps out of the way where a section asks
   ============================================================
   The bar is in place over the page's main content whichever way
   the page scrolls, and out of view only where a section holds it
   out:

     - the homepage's hero ([data-hero-parallax]): as the page leaves
       it, the bar goes up with the hero, at the hero's own pace. The
       hero is scrubbed down a share of its height as its wrap scrolls
       away (initHeroParallax), so it rises slower than the scroll, and
       the bar, which sits on it, rises with it until it is out of
       view; scrolled back up, it comes back down with it;
     - a section marked data-nav-hold (the homepage's logo strip and
       its held statements): from where the hero lets the bar go (on a
       page without one, the section's top coming up the screen) to the
       moment the section's foot has passed the bar's, so its
       statements play out with nothing over them and the bar comes
       back as the next section takes the screen; or, where the section
       names something further on (data-nav-hold-until, a selector: the
       homepage's Diagnose card), until that is just short of the middle
       of the screen (NAV_HOLD_PAST, a share of the screen; negative is
       short of it);
     - the end of the page: the footer's entrance (its top coming up
       over the screen's foot) and everything after it. The bar stays
       until the last stretch of scroll before the footer comes
       (NAV_FOOTER_AHEAD, a quarter of the screen) and over that stretch
       goes up with the scroll itself, as the hero takes it, so it is
       wholly gone the moment the entrance begins, however fast the
       page is scrolled. Never at the very top of a page: where the
       footer is in view from the start (a short page), the bar goes
       over the first stretch of scroll instead.

   It is always in place while a menu is open or keyboard focus is in
   it. Scroll direction plays no part.

   One writer, so nothing else ever moves the bar: how far out of view
   it is, 0 to 1, a single number drawn as the bar's y. In the hero it
   follows the scroll exactly; everywhere else it eases between 0 and
   1 on the site's curve as a boundary is crossed, and a change of mind
   part-way turns round from where it is. Where the hero takes over
   from a change still under way, the bar catches up with the hero in
   a moment rather than jumping, and every change takes the time its
   share of the way calls for. The boundaries are page positions,
   measured on each ScrollTrigger refresh (load, resize, the webfont),
   so nothing is read while the page scrolls. A page opens with the
   bar where its scroll puts it, at once: in place at the top, out of
   view on a reload into a held section.

   It goes up by its height rounded up to whole device pixels: the
   bar's height is fluid (3.9em on the scaling system's size), so it is
   rarely a whole number of device pixels — 68.79px is 103.19 of them
   at 1.5x — and moved by exactly that, its last, partly covered row of
   pixels would show on the screen's top edge once the compositor snaps
   the layer to the pixel grid. In place, its transform is cleared,
   because a transformed nav would become the containing block for the
   fixed drawer and backdrop inside it.
   ============================================================ */
const NAV_REVEAL = { duration: 0.6, ease: "osmo", catchUp: 0.2 };
// The morph between the full bar and the floating one (initNavReveal): each
// half this long, the second this far behind the first, on a curve that
// carries a hair past and settles back, so it lands rather than stops.
CustomEase.create("navFloat", "M0,0 C0.18,0.6 0.32,1.06 0.56,1.035 0.74,1.016 0.86,1 1,1");
const NAV_FLOAT = { duration: 0.7, lag: 0.09, ease: "navFloat" };
// how far past the middle of the screen a data-nav-hold-until element's
// middle goes before the bar comes back, as a share of the screen: a
// little short of it, so the bar is back as the card comes to the middle
const NAV_HOLD_PAST = -0.06;
// the stretch of scroll before the footer's entrance (its top at the
// screen's foot) over which the bar goes up with the scroll, as a share of
// the screen: short, so it stays as long as it can, long enough to read as
// a movement rather than a snap
const NAV_FOOTER_AHEAD = 0.25;

function initNavReveal() {
  const nav = document.querySelector("[data-menu-wrap]");
  if (!nav) return;

  const state = { out: 0 };
  let distance = 0;
  let drawn = 0;
  let zones = null;
  let watcher = null;
  let easing = null;
  let goal = 0;
  // Past the page's hero the bar floats (nav.css, .is--floating: from
  // 992px, inset to the grid's width a little below the top, shorter).
  // Out of view (the homepage's bar leaves with its hero) it simply
  // changes. In view it morphs (NAV_FLOAT): it drops off the top edge and
  // shortens, then a beat later its sides draw in to the grid, its blocks
  // narrowing onto the columns as they go, each settling with a little
  // give, so the bar seems to be lifted off the page and set down over
  // it. The morph moves the bar's own box (its top, sides and height, and
  // the grid's margin its blocks are measured from), set inline on the
  // nav and the bar alone, a small fixed box laid out on its own, and
  // hands back to the stylesheet's rule as it settles; a turn part-way
  // goes back from where it is. The way out (distance) is each state's
  // own, and the morph's two ends, measured on refresh.
  let floating = false;
  const ways = { full: 0, floating: 0 };
  const geo = { top: 0, side: 0, margin: 0, fullH: 0, floatH: 0, radius: 0 };
  const barEl = nav.querySelector(".mega-nav__bar");
  const morph = { y: 0, x: 0 };
  let morphing = null;

  // how far up the bar goes to be out of view: its foot, from the top of
  // the screen, rounded up to whole device pixels
  const outOfView = () => {
    const dpr = window.devicePixelRatio || 1;
    const foot = (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight;
    return Math.ceil(foot * dpr) / dpr;
  };

  // the bar part-way between the two: y the drop and the height, x the
  // sides, the blocks' margin and the corners, each 0 (full) to 1
  // (floating)
  const lerp = (a, b, t) => a + (b - a) * t;
  function paintMorph() {
    nav.style.top = `${(morph.y * geo.top).toFixed(2)}px`;
    nav.style.left = nav.style.right = `${(morph.x * geo.side).toFixed(2)}px`;
    barEl?.style.setProperty("--nav-height", `${lerp(geo.fullH, geo.floatH, morph.y).toFixed(2)}px`);
    barEl?.style.setProperty("--grid-margin", `${((1 - morph.x) * geo.margin).toFixed(2)}px`);
    barEl?.style.setProperty("--nav-bar-radius", `${(morph.x * geo.radius).toFixed(2)}px`);
  }
  function clearMorph() {
    nav.style.removeProperty("top");
    nav.style.removeProperty("left");
    nav.style.removeProperty("right");
    barEl?.style.removeProperty("--nav-height");
    barEl?.style.removeProperty("--grid-margin");
    barEl?.style.removeProperty("--nav-bar-radius");
  }

  // at once: out of view, as a page opens, or with reduced motion
  function setFloating(on) {
    morphing?.kill();
    morphing = null;
    clearMorph();
    floating = on;
    morph.x = morph.y = on ? 1 : 0;
    nav.classList.toggle("is--floating", on);
    distance = on ? ways.floating : ways.full;
    // drawn again at the new way out, where it is
    drawn = NaN;
    draw();
  }

  // in view: the morph, from wherever the bar is
  function morphTo(on) {
    floating = on;
    morphing?.kill();
    nav.classList.remove("is--floating");
    paintMorph();
    const to = on ? 1 : 0;
    // floating, the drop leads and the sides follow; back, the reverse
    const [first, second] = on ? ["y", "x"] : ["x", "y"];
    morphing = gsap.timeline({
      onUpdate: paintMorph,
      onComplete: () => {
        morphing = null;
        clearMorph();
        nav.classList.toggle("is--floating", on);
        distance = on ? ways.floating : ways.full;
      },
    })
      .to(morph, { [first]: to, duration: NAV_FLOAT.duration, ease: NAV_FLOAT.ease }, 0)
      .to(morph, { [second]: to, duration: NAV_FLOAT.duration, ease: NAV_FLOAT.ease }, NAV_FLOAT.lag);
  }

  function draw() {
    const y = state.out > 0 ? -state.out * distance : 0;
    if (y === drawn) return;
    drawn = y;
    if (y) gsap.set(nav, { y });
    else gsap.set(nav, { clearProps: "transform" });
  }

  // Where the sections hold the bar, as page positions, for the page in
  // container: the hero's run, if it has one, and the held stretches.
  function measure(container) {
    const page = (el) => el.getBoundingClientRect().top + window.scrollY;
    // each state's way out and the morph's two ends, read with the bar in
    // each (and nothing of a morph under way set on it meanwhile)
    morphing?.progress(1);
    nav.classList.toggle("is--floating", true);
    ways.floating = outOfView();
    const css = getComputedStyle(nav);
    geo.top = parseFloat(css.top) || 0;
    geo.side = geo.margin = parseFloat(css.left) || 0;
    geo.floatH = barEl?.offsetHeight || 0;
    geo.radius = barEl ? parseFloat(getComputedStyle(barEl).borderTopLeftRadius) || 0 : 0;
    nav.classList.toggle("is--floating", false);
    ways.full = outOfView();
    geo.fullH = barEl?.offsetHeight || 0;
    nav.classList.toggle("is--floating", floating);
    const bar = nav.offsetHeight;
    distance = ways.full;
    let hero = null;
    const wrap = container.querySelector("[data-hero-parallax]");
    const inner = wrap?.querySelector("[data-hero-parallax-inner]");
    if (wrap && inner) {
      // the hero's pace: the scroll less what the parallax takes back
      const start = Math.max(0, page(wrap));
      const pace = 1 - (parallaxTravel(inner) / 100) * inner.offsetHeight / wrap.offsetHeight;
      hero = { start, end: start + distance / Math.max(pace, 0.1), foot: page(wrap) + wrap.offsetHeight };
    }
    // A held section straight after the hero takes the bar over exactly
    // where the hero lets it go, however tall the hero is beside the
    // screen; any other from its top coming up the screen.
    const holds = [...container.querySelectorAll("[data-nav-hold]")].map((section) => {
      const top = page(section);
      const afterHero = hero && top <= hero.foot + 1;
      // held to the section's foot, or to an element further on coming to
      // the screen's middle (its layout box: a drift is a transform)
      const until = section.dataset.navHoldUntil && container.querySelector(section.dataset.navHoldUntil);
      const end = until
        ? page(until) + until.offsetHeight / 2 - window.innerHeight * (0.5 - NAV_HOLD_PAST)
        : top + section.offsetHeight - bar;
      return [afterHero ? hero.end : top - window.innerHeight, end];
    });
    // the end of the page: gone with the scroll over the stretch before
    // the footer's entrance, and held out from the entrance on (never at
    // the very top: a page opens with its bar)
    const footer = container.querySelector(".footer-wrap");
    const footerIn = footer ? page(footer) - window.innerHeight : Infinity;
    let foot = null;
    if (footerIn < Infinity) {
      const stretch = window.innerHeight * NAV_FOOTER_AHEAD;
      const end = Math.max(footerIn, 1 + stretch);
      foot = { start: end - stretch, end };
      holds.push([end, Infinity]);
    }
    // where the bar starts to float: as the page's hero (its first
    // section, whichever kind) has gone up under the full bar, or, on a
    // hero that names the moment (data-nav-float-from: a service page's,
    // whose head row stands where the floating bar leaves room for it), as
    // that element's top comes up to the full bar's foot
    const at = container.querySelector("[data-nav-float-from]");
    const first = at ? null : container.querySelector("[data-hero-parallax], .pg-hero, .hero") || container.firstElementChild;
    const floatFrom = at ? Math.max(1, page(at) - ways.full) : first ? page(first) + first.offsetHeight - ways.full : Infinity;
    zones = { hero, holds, floatFrom, foot };
    distance = floating ? ways.floating : ways.full;
  }

  // whether the bar floats at scroll y: past the hero, and only where the
  // stylesheet has a floating bar (from 992px)
  const floats = (y) => !!zones && wide.matches && y >= zones.floatFrom;
  const wide = window.matchMedia("(min-width: 992px)");

  // Where the bar should be at scroll y: how far out, and whether it
  // follows the scroll (the hero) or eases there. Keyboard focus in the
  // bar is noted as it comes and goes (below), not looked for on every
  // frame of the scroll.
  let focused = false;
  function wanted(y) {
    if (nav.getAttribute("data-menu-open") === "true" || focused) return [0, false];
    if (!zones) return [0, false];
    const { hero, holds, foot } = zones;
    if (hero && y > hero.start && y < hero.end) return [(y - hero.start) / (hero.end - hero.start), true];
    // nearing the footer, the bar follows the scroll out, unless a hold
    // already has it out
    if (foot && y > foot.start && y < foot.end && !holds.some(([from, to]) => y >= from && y < to)) {
      return [(y - foot.start) / (foot.end - foot.start), true];
    }
    return [holds.some(([from, to]) => y >= from && y < to) ? 1 : 0, false];
  }

  // y: the scroll, as the watcher below already has it (reading
  // window.scrollY would have the layout brought up to date first, on
  // every frame, after the frame's other writes)
  function update(immediate = false, y = window.scrollY) {
    // floating or full: at once out of view (or as a page opens, or with
    // reduced motion), a morph in view
    if (floats(y) !== floating) {
      if (immediate || motion.reduced || state.out >= 1) setFloating(floats(y));
      else morphTo(floats(y));
    }
    const [out, follows] = wanted(y);
    if (immediate || (follows && !easing?.isActive())) {
      easing?.kill();
      easing = null;
      goal = out;
      state.out = out;
      draw();
      return;
    }
    if (out === goal && (easing?.isActive() || state.out === out)) return;
    goal = out;
    easing?.kill();
    // the time in proportion to the way left to go, so the last of the
    // hero's run, or a turn part-way, is not drawn out over the whole
    const share = NAV_REVEAL.duration * Math.abs(out - state.out);
    easing = gsap.to(state, {
      out,
      duration: motion.reduced ? 0 : follows ? NAV_REVEAL.catchUp : Math.max(NAV_REVEAL.catchUp, share),
      ease: NAV_REVEAL.ease,
      onUpdate: draw,
    });
  }

  // A page's own watcher: its boundaries on every refresh, the bar on
  // every scroll. Bound to the container, so it goes with the page.
  function bind(container) {
    watcher?.kill();
    watcher = null;
    zones = null;
    if (!container) return;
    watcher = ScrollTrigger.create({
      trigger: container,
      start: 0,
      end: "max",
      onUpdate: (self) => update(false, self.scroll()),
      onRefresh: (self) => {
        measure(container);
        update(true, self.scroll());
      },
    });
    measure(container);
    update(true);
  }

  // Opening or closing a menu, and keyboard focus coming into the bar or
  // leaving it, settle it again where it is.
  new MutationObserver(() => update()).observe(nav, { attributes: true, attributeFilter: ["data-menu-open"] });
  nav.addEventListener("focusin", (e) => {
    focused = e.target.matches(":focus-visible");
    update();
  });
  nav.addEventListener("focusout", () => gsap.delayedCall(0, () => {
    focused = !!nav.querySelector(":focus-visible");
    update();
  }));

  barba.hooks.beforeEnter((data) => bind(data?.next?.container));
  barba.hooks.afterLeave(() => bind(null));

  initNavTheme(nav);
}

/* ============================================================
   Nav theme — light or dark from the section under the bar
   ============================================================
   The bar takes the dark state over a dark section and the light
   state over a light one, wherever they are on the page, not per page.

   Each page's grounds are found once, as it arrives: every element in
   it with an opaque background at least half the screen wide — so the
   cards and tiles a section holds never count against the section they
   sit in — dark or light by its colour's luminance. Anything that
   should decide for itself, a dark photograph with no background
   colour behind it, sets data-nav-theme="dark" or "light". Scrims and
   other overlays the pointer passes through (pointer-events: none)
   are not grounds.

   An IntersectionObserver then watches them against one line across
   the screen at the middle of the bar, where the bar rests, so the
   state follows the page while the reveal has the bar out of view.
   The browser says when a ground crosses the line, and of those on it
   the last in the document — the innermost, or the one painted over
   the other — decides. Nothing is read while the page scrolls or sits
   still; this was five hit-tests and a run of style reads on every
   frame of a scroll, and a poll four times a second besides. The
   grounds are found again for each new page, under the wipe, and when
   the window changes size.

   While a menu is open the state holds, and the change is made as it
   closes.

   The change itself is one tween of one number, --nav-dark on the
   nav's own style (0% light, 100% dark), which every colour in nav.css
   is mixed by — so nothing in the nav can run ahead of or behind
   anything else. It is a script tween rather than a CSS transition
   because Chrome paints visited links' text with the page's ink while
   a CSS animation moves a custom property (see nav.css). A soft ease in
   and out, slow enough to feel like the bar settling onto the new
   ground; a change of mind mid-way turns round from where it is, in
   the share of the time that is left to cover. The first state of a
   document is set at once, as is every state with reduced motion.
   ============================================================ */
function initNavTheme(nav) {
  const bar = nav.querySelector(".mega-nav__bar") || nav;
  // whole subtrees that can never be a section's ground
  const SKIP = new Set(["svg", "SCRIPT", "STYLE", "CANVAS", "IMG", "PICTURE", "VIDEO", "IFRAME", "BR", "INPUT", "TEXTAREA", "SELECT"]);
  const grounds = new Map(); // element → "dark" | "light"
  const onLine = new Set(); // the grounds crossing the line now
  let observer = null;
  let theme = null; // the state the bar shows
  let wanted = null; // the state the ground asks for

  // a computed background colour as [r, g, b, a], each 0–1: rgb()/rgba(),
  // and color(srgb …), which is how a color-mix() comes back
  function parseColor(value) {
    const m = value.match(/^(rgba?|color)\((.*)\)$/);
    if (!m) return null;
    const parts = m[2].replace(/^srgb\s+/, "").split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    const [r, g, b, a = 1] = parts;
    return m[1] === "color" ? [r, g, b, a] : [r / 255, g / 255, b / 255, a];
  }

  function groundOf(el, minWidth) {
    const set = el.getAttribute("data-nav-theme");
    if (set === "dark" || set === "light") return set;
    const style = getComputedStyle(el);
    if (style.pointerEvents === "none") return null;
    const c = parseColor(style.backgroundColor);
    if (!c || c[3] < 0.5) return null;
    if (el.getBoundingClientRect().width < minWidth) return null;
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 0.5 ? "dark" : "light";
  }

  const DURATION = 0.7;
  const state = { dark: 0 }; // how far into the dark state, 0–1
  const amount = () => `${(state.dark * 100).toFixed(2)}%`;
  // Each frame of the change is written to the bar alone, the part of the
  // nav that is in view, so the browser recalculates the bar's styles and
  // not the closed dropdown's as well — twice the bar's elements, and most
  // of each frame's cost (nav.css mixes the colours per part). The nav's
  // own value, which the dropdown takes, is set as the change settles. A
  // dropdown opened mid-change follows the bar frame by frame until then.
  // Each time the dropdown's value is set, the nav says so ("navthemechange"),
  // for what in the dropdown is drawn rather than styled: the Services
  // cards' dots (initMegaNav).
  const settle = () => {
    nav.style.setProperty("--nav-dark", amount());
    nav.dispatchEvent(new Event("navthemechange"));
  };
  const draw = () => {
    bar.style.setProperty("--nav-dark", amount());
    if (nav.getAttribute("data-menu-open") === "true") settle();
  };

  function apply(next, instant = false) {
    wanted = next;
    if (next === theme || nav.getAttribute("data-menu-open") === "true") return;
    const first = theme === null || instant;
    theme = next;
    nav.setAttribute("data-nav-theme", next);
    const target = next === "dark" ? 1 : 0;
    gsap.killTweensOf(state);
    if (first || motion.reduced) {
      state.dark = target;
      draw();
      settle();
      return;
    }
    gsap.to(state, {
      dark: target,
      duration: DURATION * Math.abs(target - state.dark),
      ease: "navTheme",
      onUpdate: draw,
      onComplete: settle,
    });
  }

  // A new page's first reading is taken while the page is still covered
  // (the wipe, or a card opening over everything), so the bar takes its
  // state at once there: eased, it was still part-way from the last
  // page's (a light bar going dark) as the cover lifted.
  let covered = false;
  function decide() {
    let top = null;
    onLine.forEach((el) => {
      if (!top || top.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) top = el;
    });
    apply(top ? grounds.get(top) : "light", covered);
    covered = false;
  }

  function watch(underCover = false) {
    covered = underCover;
    observer?.disconnect();
    grounds.clear();
    onLine.clear();
    const container = document.querySelector('[data-barba="container"]');
    if (!container) return;

    const minWidth = document.documentElement.clientWidth / 2;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (el) => (SKIP.has(el.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let el = container; el; el = walker.nextNode()) {
      const ground = groundOf(el, minWidth);
      if (ground) grounds.set(el, ground);
    }

    // the line: one pixel tall, at the middle of the bar
    const y = Math.round(bar.offsetHeight / 2);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? onLine.add(e.target) : onLine.delete(e.target)));
      decide();
    }, { rootMargin: `${-y}px 0px ${-(window.innerHeight - y - 1)}px 0px` });
    grounds.forEach((_, el) => observer.observe(el));
    // with nothing to watch the observer never reports: the body's ground
    if (!grounds.size) decide();
  }

  watch();
  // each new page, once its components are built and before the wipe
  // uncovers it (the lifecycle's own beforeEnter runs first)
  barba.hooks.beforeEnter(() => watch(true));
  let resizing = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizing);
    resizing = setTimeout(watch, 150);
  });
  // a change held while a menu was open goes through as it closes
  new MutationObserver(() => wanted && apply(wanted)).observe(nav, {
    attributes: true,
    attributeFilter: ["data-menu-open"],
  });
}

/* ============================================================
   Nav logo — the forms drawn back into the name on hover
   ============================================================
   The intro's own morph (logo-morph.js), run backwards while the
   pointer is on the logo — the four forms open back out into
   A D D D — and forwards again as it leaves. Each letter tweens its
   own progress (1 the form, 0 the glyph) from wherever it is, so
   leaving halfway turns the change round mid-shape rather than
   jumping, and the wave runs left to right both ways. A little
   quicker than the intro, being a hover.

   A pointer only: on a touch screen a tap is a click, and it goes
   home. Keyboard focus shows the name too. With reduced motion the
   name and the forms swap without the change between them.
   ============================================================ */
function initNavLogo() {
  const link = document.querySelector("[data-menu-logo]");
  const paths = link ? [...link.querySelectorAll("[data-logo-morph-letter]")] : [];
  if (paths.length !== LETTER_COUNT) return;

  const DURATION = 0.75; // one letter, all the way from form to glyph
  const STAGGER = 0.07;
  // The name a touch heavier than the type it is drawn from: a stroke of the
  // mark's own colour round each letter, this wide (in the mark's viewBox)
  // once the letter is fully the glyph, and nothing on the forms, so the
  // weight comes and goes with the change itself.
  const WEIGHT = 0.4;
  const ease = getMorphEase();
  const states = paths.map(() => ({ t: 1 }));
  const draw = (i) => {
    paths[i].setAttribute("d", morphPath(i, states[i].t, ease));
    paths[i].setAttribute("stroke-width", (WEIGHT * (1 - states[i].t)).toFixed(3));
  };

  function morphTo(target) {
    states.forEach((state, i) => {
      gsap.killTweensOf(state);
      const distance = Math.abs(target - state.t);
      if (!distance) return;
      if (motion.reduced) {
        state.t = target;
        draw(i);
        return;
      }
      gsap.to(state, {
        t: target,
        duration: DURATION * distance,
        // a letter already part of the way there waits less for its turn
        delay: i * STAGGER * distance,
        // Going back to the name, the morph runs from its own long settle,
        // which played straight would leave a hover a third of a second with
        // nothing to show; the run is hurried through it instead. Back to the
        // forms it plays at the intro's own pace. Either way the shape is the
        // same function of t, so turning round mid-change never jumps.
        ease: target === 0 ? "power2.out" : "none",
        onUpdate: () => draw(i),
      });
    });
  }

  link.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") morphTo(0);
  });
  link.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !link.matches(":focus-visible")) morphTo(1);
  });
  link.addEventListener("focus", () => {
    if (link.matches(":focus-visible")) morphTo(0);
  });
  link.addEventListener("blur", () => {
    if (!link.matches(":hover")) morphTo(1);
  });
}
