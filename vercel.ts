/* How Vercel builds and serves the site: vercel.json's settings, as code that
   runs at the start of each build, so a setting can depend on the deployment.
   (Vercel reads this or a vercel.json, never both.)

   Clean addresses (/about) with the old .html ones sent on to them (below),
   and headers. Production is `main`
   (VERCEL_ENV "production"); every other deployment, staging included, is
   "preview". A review round (a `review/<round>` branch, astro.config.mjs) is a
   preview too, but built as files like production. */
import type { VercelConfig } from '@vercel/config/v1';

const preview = process.env.VERCEL_ENV === 'preview';
const review = (process.env.VERCEL_GIT_COMMIT_REF ?? '').startsWith('review/');
// The deployments rendered on request
const staging = preview && !review;

export const config: VercelConfig = {
  framework: 'astro',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  // Every push is built, staging included (25 Nov 2026, at the user's word):
  // until then commits that changed only the Studio skipped staging's build
  // (scripts/vercel-ignore.sh), and Vercel lists a skipped deployment as
  // "Canceled", which hid staging from the project's Active Branches. The
  // cost is one more build per CMS release, well inside the Hobby plan's limit.

  // Clean addresses (/about, not /about.html), since 9 Nov 2026. Production is
  // built as files (about.html, astro.config.mjs): Vercel serves each at its
  // clean address and sends the old .html address there (308), so links
  // shared before still work. Staging renders on request, where Astro's
  // routes are already clean: the old .html addresses are sent on to them
  // the same way (src/middleware.ts still answers one that reaches it, as in
  // development). A review round is served like production; Final Design V1,
  // frozen with its own copy of this file from before, keeps its .html ones.
  ...(staging
    ? {
        redirects: [
          { source: '/index.html', destination: '/', permanent: true },
          { source: '/:path*.html', destination: '/:path*', permanent: true },
        ],
      }
    : { cleanUrls: true }),
  headers: [
    // The build stamp (astro.config.mjs): read by the Studio, on another
    // origin, and never from a cache, so it always says when the site was
    // last built
    {
      source: '/build.json',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Cache-Control', value: 'no-store' },
      ],
    },
    // The newsletter's issues as data (src/pages/newsletter.json.ts): read by
    // the Studio's Newsletter collection, on another origin. Public: the
    // same issues the site's pages show
    {
      source: '/newsletter.json',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      ],
    },
    // Staging and the review rounds are never indexed. Every response says so,
    // files and images too, on any domain (Vercel's own preview header is
    // missing on a custom one). The pages say it again themselves
    // (BaseLayout.astro's robots meta; src/middleware.ts on staging).
    ...(preview ? [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : []),
  ],
  // The newsletter (2026-11-16): the production site rebuilt once a day
  // (api/beehiiv.js), besides beehiiv's webhook, so a missed one (or a
  // plan read through RSS, without webhooks) still reaches the site within
  // a day. Vercel runs crons on production only; the Hobby plan allows one
  // a day, at some point in its hour.
  crons: [{ path: '/api/beehiiv', schedule: '0 6 * * *' }],
};
