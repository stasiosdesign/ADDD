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
  // Production is never skipped: it is static, so a live publish reaches it
  // only through the rebuild its deploy hook asks for, a build of a commit
  // that hasn't changed. (From 10 to 25 Oct 2026 the rule below applied to
  // production too, skipped those rebuilds, and live publishes never reached
  // the site.) Staging renders every request from Sanity, so content needs
  // no build there, and commits that change nothing it is built from (only
  // the Studio, GitHub's workflows or these notes; a CMS release records its
  // version on both branches) don't rebuild it: the Hobby plan allows few
  // deployments a day. A review round's branch is built whenever it is
  // pushed (once, as a rule). The rules are in scripts/vercel-ignore.sh:
  // Vercel refuses an ignoreCommand over 256 characters, and failed the
  // deployment when this one grew past it (9 Nov 2026).
  ignoreCommand: 'sh scripts/vercel-ignore.sh',
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
    // Staging and the review rounds are never indexed. Every response says so,
    // files and images too, on any domain (Vercel's own preview header is
    // missing on a custom one). The pages say it again themselves
    // (BaseLayout.astro's robots meta; src/middleware.ts on staging).
    ...(preview ? [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : []),
  ],
};
