/*
  The holding page switch. While HOLDING is true, every page but the
  homepage shows the nav and a short note that it hasn't been published
  yet (HoldingPage.astro), in place of its own content; BaseLayout.astro
  decides. The pages themselves are untouched: set this to false and
  every page is back as it was.

  On for the deployed site (staging and production, both built), off on
  the local dev server (npm run dev), where the pages are worked on.
*/
export const HOLDING = !import.meta.env.DEV;
