/*
  The holding page switch. A page marked held (BaseLayout's `held`) shows
  the nav and a short note that it hasn't been published yet
  (HoldingPage.astro) in place of its own content, on black, while HOLD is
  true; BaseLayout.astro decides. The pages themselves are untouched: set
  this to false, or take a page's `held` away, and it is back as it was.

  Held since 2026-11-04, in every environment (development, staging and
  production alike): the About page and every single report, guide and
  newsletter issue (reports/[slug], newsletter/[slug], and the two pages
  they are set after, report-template and newsletter-template). The
  Reports and Newsletter index pages and every other page are live.
  (Until then every page but the homepage was held on the deployed site,
  and none on the development server.)
*/
export const HOLD = true;
