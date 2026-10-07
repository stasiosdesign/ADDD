# Billing switch — Osmo Toggle Switch version

Replace the previous billing CSS and JavaScript with head.html and footer.html. Use toggle.html for each billing control. Do not also initialize these same controls with Osmo's original initToggleSwitches script. Keep the Bouncy Tabs CSS and JavaScript separate and unchanged.

The supplied HTML includes every control attribute. It keeps data-toggle-init, data-toggle-btn, and data-toggle-active from Osmo. Buttons use data-toggle-btn="annual" and data-toggle-btn="quarterly" to identify billing periods. data-billing="toggle" scopes the billing code, and data-toggle-bg identifies the sliding background independently of classes.

Keep the existing pricing structure:

- Outer wrapper: data-billing="prices".
- Direct child containing annual price and caption: data-billing="annual".
- Direct child containing quarterly price and caption: data-billing="quarterly".

The control now contains its own Yearly and Quarterly labels. No separate label attributes are needed on its spans. Existing external labels with data-billing="label-annual" or data-billing="label-quarterly" still work if wanted.

All controls and pricing groups present on page load share one state. Annual is selected on a fresh load. The Osmo background pill uses its original 0.5-second CSS transform easing. Prices retain their 200ms crossfade and stable-height grid. Arrow keys wrap, Home/End select the endpoints, and native Enter/Space activate buttons. Reduced-motion settings remove CSS transitions.

Appearance defaults use :where() so Webflow classes can override background colors, radii, wrapper width and button padding. The rest of the CSS controls layout and behavior and should stay in the snippet. JavaScript and CSS targeting never rely on class names.

## Bouncy Tabs compatibility

No shared functions or active-state attributes: the billing switch uses data-toggle-active and data-billing-cycle, while Bouncy Tabs uses data-active on data-bouncy-tabs-* elements. The billing switch has no GSAP dependency and uses a private function scope. Handled billing arrow keys stop propagation.

If pricing cards are inside a Bouncy Tabs panel, tag each outer pricing card with data-bouncy-tabs-item. Do not put that attribute on the annual or quarterly price groups: Bouncy Tabs changes animated items' opacity inline, which would override the price group's CSS visibility logic. Animating the outer card keeps ownership separate. No Bouncy Tabs code changes are needed.

## Verification

The local demo ran the user's Bouncy Tabs JavaScript unchanged with GSAP 3.15. Browser checks passed for synchronized controls, pill alignment, annual default, keyboard input, rapid switching, stable desktop/mobile height, reduced motion, duplicate initialization, class-independent behavior, and preserved pricing state after switching tabs. Final Webflow styling and placement should be checked on the published staging site.

demo.html, build-demo.cjs, verify.cjs and the *.test.* files are local verification assets, not Webflow installation snippets. Paste only toggle.html, head.html and footer.html into the corresponding Webflow locations.
