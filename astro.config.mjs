// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  build: {
    // Every page keeps its existing URL — /about.html, /workshops-audits.html
    // and so on — rather than moving to /about/. The markup links between
    // pages with relative hrefs ("about.html", "assets/logo.svg"), and Barba
    // fetches those same URLs on a navigation, so the files have to sit flat
    // at the root exactly as they did before.
    format: "file",
  },

  // Astro 7 strips the whitespace between elements by default, which would
  // close up the spaces between inline elements the design relies on. Keep
  // the markup's whitespace exactly as written.
  compressHTML: false,

  // The toolbar injects its own UI into the page in development; keep the
  // dev server rendering the site and nothing else.
  devToolbar: { enabled: false },

  vite: {
    build: {
      // The stylesheets and scripts are bundled — one hashed file each, so a
      // deploy can never be served stale — but left exactly as written. The
      // minifiers rewrite code for their target browsers: the CSS one turns
      // media queries into range syntax that Safari before 16.4 ignores and
      // drops -webkit-backdrop-filter; the JS one introduces ES2021 syntax
      // the ES2020 source never used. Either would change how the site runs
      // in browsers it works in today. Vercel compresses both in transit.
      minify: false,
      cssMinify: false,
    },
  },
});
