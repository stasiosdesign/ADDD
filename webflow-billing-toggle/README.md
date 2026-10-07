# Webflow billing toggle

Yearly is selected on each fresh page load. Its price is a monthly equivalent, billed annually. Switching to Quarterly shows the monthly equivalent billed quarterly. Every toggle, label and tagged price group on the current page updates together. Prices stay as text you edit in Webflow; this code does not calculate prices or update checkout billing.

## 1. Add the custom code

In Webflow Site settings → Custom code:

- Paste all of `head.html`, including its `<style>` tags, into Head code.
- Paste all of `footer.html`, including its `<script>` tags, into Footer code / Before `</body>`.

Install each snippet once. Replace the supplied toggle CSS with this CSS, including removing the original `:checked` animation rules and `.section-resource` demo styling. This version intentionally puts annual/checked on the left and quarterly/unchecked on the right.

Webflow documentation: https://help.webflow.com/hc/en-us/articles/33961357265299

## 2. Build the toggle row in Webflow

Use `structure.html` as the structural reference. The row contains three siblings:

1. Text: **Yearly**, with `data-billing-label` = `annual`.
2. The `.btn-toggle` wrapper, containing the original track, dot and actual checkbox input.
3. Text: **Quarterly**, with `data-billing-label` = `quarterly`.

Style the outer row as horizontal Flex, align center, with your preferred gap. Set the text margins to 0. The labels are indicators; the switch between them is the clickable control.

Add `data-billing-toggle` = `true` to the actual checkbox input, not its wrapper or a decorative checkbox. Any attribute value works. Use `aria-label` = `Annual billing`, `role` = `switch`, and mark it checked initially. Keep the checkbox focusable; do not use Display none on it.

For exact control over the supplied HTML, use a Webflow Custom Element with tag `input`, type `checkbox`, class `btn-toggle__checkbox`, and the attributes above. `checked` is a Boolean attribute: its presence means true. If using Webflow's native Checkbox, its surrounding form-field wrapper must not introduce extra layout or another visible checkbox graphic. The script needs the real input.

The code includes a visible keyboard focus ring and a minimum 44px switch hit area. Tab to focus, then Space to toggle.

Custom attributes: https://help.webflow.com/hc/en-us/articles/33961389460115-Custom-attributes

Custom elements: https://help.webflow.com/hc/en-us/articles/33961250668691-Custom-element

## 3. Build the two price groups

Inside each card, create a wrapper with `data-billing-stack` = `true`. It contains two direct child divs:

| Child div attribute | Put these two text elements inside |
| --- | --- |
| `data-billing-content` = `annual` | Annual monthly-equivalent price; “per month, billed annually” |
| `data-billing-content` = `quarterly` | Quarterly monthly-equivalent price; “per month, billed quarterly” |

Both groups remain normal Webflow content. Use your own classes, typography, spacing and values. Do not set either group to Display none or add Webflow hide/show interactions; the custom CSS handles visibility. Add `aria-hidden` = `true` and the Boolean `inert` attribute to the quarterly group for the initial state; the script manages them afterward.

The two direct children share a grid cell. The wrapper keeps the height of the taller group, including when captions wrap on mobile, so the card and its button do not jump during switching. The text crossfades over 200ms; the dot travels over 320ms with a gentle ease. Rapid repeated clicks reverse the transition from its current position without queued animations.

If your price and caption must be in separate parts of a layout, use two `data-billing-stack` wrappers: one with annual/quarterly price elements, and the other with annual/quarterly caption elements. Add `data-billing-content` to each of those text elements instead. Each pair must be direct children of its own stack.

## 4. Repeat and publish

Duplicate the setup across all three cards and edit each card's prices. No card IDs or linking attributes are needed. You can also place additional tagged labels and paired text elsewhere on the page. All tagged elements share the same billing selection, including toggles in separate sections.

Publish to your Webflow staging domain to verify the integrated result. Select quarterly in one card and annual in another; all cards should follow. Also check narrow screens and keyboard input.

## Optional adjustments

- Inactive label opacity: change `--billing-muted-opacity: 0.5` in the head snippet.
- Text fade speed: change `--billing-fade: 200ms`.
- Toggle size: change `.btn-toggle` font-size; its track and dot use relative units.
- Toggle color: change `.btn-toggle__toggle` background.
- Visible labels can be renamed without changing attribute values. “Yearly / Quarterly” matches the two billing periods; both prices remain expressed per month.

There is no saved preference between fresh page loads. No libraries are required. Content and toggles present on initial page load are supported, including server-rendered CMS cards; asynchronously inserting new cards would require an initialization hook.

The script removes inactive content from keyboard navigation and the accessibility tree using `inert`, and announces one billing change for the page. Reduced-motion preferences disable transitions.

References: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert and https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
