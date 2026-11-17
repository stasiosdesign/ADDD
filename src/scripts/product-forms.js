/* ============================================================
   A report's sign-up form (2026-11-17): the form that sends the
   download, set inside the report page's card (reports/[slug].astro),
   as the report's own page in Sanity names it (its access):
     beehiiv  the publication's subscribe form, an iframe already in the
              page at the height the report gives it (beehiiv's own
              resizing script is left out: on the site's page it
              stretched the frame to many times the form's height);
     hubspot  a HubSpot form (region, portal and form), drawn here into
              its frame by HubSpot's embed script.
   The page arrives through Barba, where a script in its markup would
   never run, so the forms are set up on every arrival: HubSpot's script
   is added again each time, so it finds the new frame. Nothing is sent
   from here: the form is the service's own.
   ============================================================ */

const hubspotScript = (region, portal) =>
  `https://js${region && region !== "na1" ? `-${region}` : ""}.hsforms.net/forms/embed/${portal}.js`;

export function initProductForms(container) {
  container.querySelectorAll("[data-product-form]").forEach((el) => {
    if (el.dataset.productFormReady) return;
    el.dataset.productFormReady = "";
    const kind = el.dataset.productForm;
    if (kind === "beehiiv") return;
    if (kind === "hubspot") {
      const { region = "na1", portal, form } = el.dataset;
      if (!portal || !form) return;
      const frame = document.createElement("div");
      frame.className = "hs-form-frame";
      frame.dataset.region = region;
      frame.dataset.formId = form;
      frame.dataset.portalId = portal;
      el.append(frame);
      // added again on every arrival, so HubSpot's script looks for frames anew
      const src = hubspotScript(region, portal);
      document.querySelectorAll(`script[src="${src}"]`).forEach((old) => old.remove());
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      el.append(script);
    }
  });
}
