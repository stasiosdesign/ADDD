// -----------------------------------------
// ADDD — GSAP, set up for the site
// -----------------------------------------
//
// gsap and its plugins are globals, loaded from the CDN by classic scripts
// ahead of the site's module (src/layouts/BaseLayout.astro). This module
// registers them and sets the site's defaults; every module that touches
// GSAP as it loads imports it first, so the order is never in doubt.

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, Draggable, InertiaPlugin, ScrambleTextPlugin);

// The site's motion curve: the same one styles.css has as --ease-osmo, so a
// tween and a CSS transition ease the same way.
CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: 0.6 });

// The site places the scroll itself (resetScroll, scroll.js), so the browser
// must never restore it. Set through ScrollTrigger, which reads the mode as
// its script loads, ahead of this module, and writes what it read back at
// the end of every refresh: set on history directly, the first refresh put
// it back to "auto", and the browser's own restoration moved a reloaded page
// under the wipe.
ScrollTrigger.clearScrollMemory("manual");
