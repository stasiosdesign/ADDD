// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";

/* One codebase, built three ways. Which one comes from Vercel (VERCEL_ENV),
   never from a hostname, so a custom domain changes nothing here:

   production   `main` on Vercel, and `npm run build` on your machine. Fully
                static: every page is built from the production dataset's
                published Sanity content and served as a file.
   staging      every other Vercel deployment: the `staging` branch (and any
                other branch pushed to GitHub). Each request is rendered by a
                Vercel Function from the staging dataset, so staging always
                has the latest content: published, or drafts in draft mode,
                which the Studio's Visual editor switches on
                (src/sanity/draft-mode/). Never indexed.
   development  `npm run dev`: staging's behaviour, on your machine. */
const { VERCEL_ENV, NODE_ENV } = process.env;
const deployment =
  VERCEL_ENV === "production" ? "production"
  : VERCEL_ENV === "preview" ? "staging"
  : VERCEL_ENV === "development" || NODE_ENV === "development" ? "development"
  : "production";
const onDemand = deployment !== "production";

// Staging and development only: the routes that switch draft mode on and off,
// and the Studio's publishing route. Production is built without them.
/** @returns {import('astro').AstroIntegration} */
const sanityRoutes = () => ({
  name: "addd:sanity-routes",
  hooks: {
    "astro:config:setup": ({ injectRoute }) => {
      injectRoute({ pattern: "/api/draft-mode/enable", entrypoint: "./src/sanity/draft-mode/enable.ts", prerender: false });
      injectRoute({ pattern: "/api/draft-mode/disable", entrypoint: "./src/sanity/draft-mode/disable.ts", prerender: false });
      // The Studio's live publishing, done on the server (src/sanity/publish/)
      injectRoute({ pattern: "/api/publish", entrypoint: "./src/sanity/publish/index.ts", prerender: false });
    },
  },
});

// Production only: a build stamp, dist/build.json, saying when the site was
// built. The Studio's publishing bar reads it (with the CORS header vercel.ts
// gives it) to tell an editor when a live publish has reached the site.
/** @returns {import('astro').AstroIntegration} */
const buildStamp = () => ({
  name: "addd:build-stamp",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const { writeFile } = await import("node:fs/promises");
      const stamp = { builtAt: new Date().toISOString(), deployment };
      await writeFile(new URL("build.json", dir), JSON.stringify(stamp));
    },
  },
});

export default defineConfig({
  // Production: static, no adapter; Vercel serves `dist/` as files. Staging and
  // development render every request, through the Vercel adapter.
  output: onDemand ? "server" : "static",
  adapter: onDemand ? vercel() : undefined,

  integrations: [...(deployment === "production" ? [buildStamp()] : []), ...(onDemand ? [sanityRoutes()] : [])],

  env: {
    schema: {
      // A Sanity Viewer token, for draft mode on staging and in development.
      // Secret: read on the server at request time, never sent to a browser.
      SANITY_API_READ_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
      // A Sanity Editor token, for /api/publish: writes to the production
      // dataset on the Studio's behalf. Secret, server-side, staging only.
      SANITY_API_WRITE_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
      // The Vercel deploy hook for `main`: /api/publish calls it after every
      // live publish, so the static production site is rebuilt. Secret.
      VERCEL_DEPLOY_HOOK_URL: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },

  build: {
    // Every page keeps its existing URL — /about.html, /workshops-audits.html
    // and so on — rather than moving to /about/. The markup links between
    // pages with relative hrefs ("about.html", "assets/logo.svg"), and Barba
    // fetches those same URLs on a navigation, so the files have to sit flat
    // at the root exactly as they did before. (Where staging renders on
    // request, src/middleware.ts rewrites each .html address to its route.)
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
    // The deployment, fixed at build time (src/env.d.ts). Code that only
    // staging needs checks it, so a production build leaves that code out.
    define: { __DEPLOYMENT__: JSON.stringify(deployment) },
    // The Sanity Studio in studio/ is its own app: its rebuilds while it runs
    // beside the site must not reload the site's dev server.
    server: { watch: { ignored: ["**/studio/**"] } },
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
