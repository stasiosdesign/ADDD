# Combined Billing + Bouncy Tabs

One CSS block and one JavaScript block now run both components. Their selections remain independent: billing changes all tagged prices on the page; Bouncy Tabs changes only its own panels. Your original sliding-pill motion, price crossfade, tab indicator, hover ghost, and content stagger are retained.

## 1. Replace the old custom code

In Webflow Site settings → Custom code:

| Remove | Replace with |
| --- | --- |
| Previous billing CSS and the Bouncy Tabs custom CSS block | All of `head.html`, including `<style>` tags, in Head code |
| Previous billing JavaScript, original Osmo Toggle Switch initialization if installed, and Bouncy Tabs JavaScript | All of `footer.html`, including `<script>` tags, in Footer code / Before `</body>` |

Replace these blocks rather than adding the new package alongside them. Check Page settings too if an older copy was installed there. Keep unrelated site code and your Webflow visual classes.

## 2. Keep GSAP loaded once

Bouncy Tabs already uses GSAP. Keep your existing GSAP script above the new Footer code. You do not need any additional GSAP plugins for this package.

If GSAP is not already installed, add this line above the new Footer code:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js"></script>
```

Do not use async on that script: GSAP should finish loading before the combined code starts. If GSAP is unavailable, billing still works and tabs switch instantly, with a console message explaining the missing animation library.

## 3. Keep your current billing HTML

If you used the previous answer's HTML, no changes are needed. `toggle.html` is an unchanged copy for reference or for adding another card.

| Element | Keep these attributes |
| --- | --- |
| Toggle wrapper | `data-toggle-init` and `data-billing="toggle"` |
| Sliding background | `data-toggle-bg` |
| Yearly button | `data-toggle-btn="annual"` and initial `data-toggle-active` |
| Quarterly button | `data-toggle-btn="quarterly"` |
| Wrapper holding both price groups | `data-billing="prices"` |
| Direct child with annual price and caption | `data-billing="annual"` |
| Direct child with quarterly price and caption | `data-billing="quarterly"` |

Keep each price and its caption together. Do not hide either price group using Display none. Repeat the same attribute values on every card. Extra external labels using `data-billing="label-annual"` or `data-billing="label-quarterly"` still work.

## 4. Keep your existing Bouncy Tabs attributes

There is no new required attribute for the tabs. Keep:

| Existing attribute | Element it identifies |
| --- | --- |
| `data-bouncy-tabs-init` | Outer wrapper around one complete tabs component |
| `data-bouncy-tabs-nav` | Wrapper around its tab buttons and indicators |
| `data-bouncy-tabs-button` | Each tab button |
| `data-bouncy-tabs-indicator` | Active sliding indicator |
| `data-bouncy-tabs-ghost` | Optional hover indicator |
| `data-bouncy-tabs-panels` | Wrapper around the content panels |
| `data-bouncy-tabs-panel` | Each content panel |
| `data-active` | Initially selected tab button and panel |

Keep buttons and their matching panels in the same order, with one panel per button. If `data-bouncy-tabs-card` is already present, leave it; it is harmless and the new package does not require it to calculate height.

The code no longer needs a special conflict-avoidance attribute on pricing cards. Existing `data-bouncy-tabs-item` attributes can stay. Avoid putting both a billing-group attribute and a tabs-panel attribute on the same element: keep pricing groups inside the panel as before.

## 5. Only if you want the original text-by-text stagger

The original tabs script used class names as a fallback to find a text wrapper and visual. This combined version uses attributes throughout.

If you already have `data-bouncy-tabs-item` on the elements you want animated, nothing needs changing.

If you were relying on that class fallback, add only these:

| Element | Name | Value |
| --- | --- | --- |
| Wrapper containing the heading, paragraph and other text | `data-bouncy-tabs-item` | `children` |
| Visual/image wrapper | `data-bouncy-tabs-item` | `true` |

`children` animates the wrapper's direct children in sequence. Any other value animates the tagged element as one item. Untagged panels animate their direct children by default. If you tag items in a panel, those tags define its animated items, so tag every section you want included in that panel's stagger.

No attributes need to be added to every heading or paragraph. The code automatically skips billing controls and price elements when choosing stagger targets, so tab animations do not override billing visibility. Billing still fades the two groups; the tabs can move and fade an outer container around them.

## 6. Publish and check

Publish to your Webflow staging domain. Check that:

1. A fresh page load selects Yearly everywhere.
2. Selecting Quarterly in any card updates all tagged cards, including ones inside other tab panels.
3. Switching Bouncy Tabs preserves the billing selection.
4. Tab and arrow keys operate each control independently.

The supplied local demo and browser checks cover rapid clicks, nested tabs, stable pricing height, panel height changes after content loads, mobile widths, keyboard operation, reduced motion, repeated initialization, and missing-GSAP fallback. Your final Webflow styling still needs the staging check.

## Styling and scope

Keep using your Webflow classes for appearance. Billing colors, corner radii, wrapper width and button padding have low-specificity defaults that your classes can override. Tabs keep their existing visual classes. No custom class names are used to target elements in the combined JavaScript or CSS.

The shared JavaScript initializes all components present when the page loads, including server-rendered CMS cards. It watches existing panel sizes for changes; inserting entirely new controls after initialization is outside this package's scope.

This code changes the displayed prices and billing labels. It does not calculate prices or update a payment/checkout subscription.

## Files

- `head.html`: complete combined CSS to paste into Head code.
- `footer.html`: complete combined JavaScript to paste into Footer code.
- `toggle.html`: unchanged billing control HTML.
- `INSTALL.html`: copy-and-paste page with the complete snippets.
- `demo.html`: interactive combined example. The neighboring GSAP test file is used only by this local demo.
