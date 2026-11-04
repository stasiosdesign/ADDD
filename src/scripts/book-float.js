// -----------------------------------------
// ADDD — the floating Book a Call (BookCallFloat.astro)
// -----------------------------------------
//
// Shown (is--shown; styles.css fades and lifts it in, and back out) from
// when the page's first section, its hero, has all but gone off the top
// of the screen until the end of the page's booking (Book a Free Call, or
// the closing CTA; an FAQ's Book a Free Call, its last item) is about to
// come up under it: one ScrollTrigger, on
// the site's one scroll pipeline (scroll.js), nothing read per frame.
//
// Over a dark section it turns over to white (data-ground="dark", which
// action-button.css reads as it reads a dark section), as the nav does:
// the page's grounds found as the nav finds them (grounds.js), the first
// time it is shown, and watched against one line across the screen at
// its middle. Found again when the window changes size.

import { registerPageCleanup } from "./page.js";
import { findGrounds, lastInDocument } from "./grounds.js";

// shown once the hero's foot is this far down the screen or higher
const FROM = "bottom 15%";
// gone while the end is still this far under the button's top (px)
const CLEAR = 24;

export function initBookFloat(container) {
  container.querySelectorAll("[data-book-float]").forEach((root) => {
    if (root.bookFloat) return;
    const button = root.querySelector("[data-booking-open]");
    const hero = root.parentElement?.querySelector(":scope > section");
    const end = container.querySelector(root.dataset.bookFloatUntil || ".faq-call, .book-call, .cta");
    if (!button || !hero || !document.getElementById(button.dataset.bookingOpen)) return;

    // ---- the ground under it ------------------------------------------
    let grounds = null;
    let observer = null;
    const onLine = new Set();
    const decide = () => {
      const top = lastInDocument(onLine);
      root.dataset.ground = (top && grounds.get(top)) || "light";
    };
    function watch() {
      observer?.disconnect();
      onLine.clear();
      grounds = findGrounds(container);
      // the line: one pixel tall, across the middle of the button
      const box = button.getBoundingClientRect();
      const y = Math.round(box.top + box.height / 2);
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? onLine.add(e.target) : onLine.delete(e.target)));
          decide();
        },
        { rootMargin: `${-y}px 0px ${-(window.innerHeight - y - 1)}px 0px` },
      );
      grounds.forEach((_, el) => observer.observe(el));
    }

    // ---- in and out -----------------------------------------------------
    const show = (on) => {
      if (on && !grounds) watch();
      root.classList.toggle("is--shown", on);
    };
    // how far over the screen's foot the end must stay: the button's
    // height and its room under it, and a little more
    const clear = () => Math.round(window.innerHeight - button.getBoundingClientRect().top + CLEAR);
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: FROM,
      ...(end ? { endTrigger: end, end: () => `top bottom-=${clear()}` } : { end: "max" }),
      onToggle: (self) => show(self.isActive),
    });
    if (trigger.isActive) show(true);

    let resizing = 0;
    const onResize = () => {
      clearTimeout(resizing);
      resizing = setTimeout(() => grounds && watch(), 150);
    };
    window.addEventListener("resize", onResize);
    root.bookFloat = true;

    registerPageCleanup(() => {
      trigger.kill();
      observer?.disconnect();
      clearTimeout(resizing);
      window.removeEventListener("resize", onResize);
      root.bookFloat = false;
    });
  });
}
