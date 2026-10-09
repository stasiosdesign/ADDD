/* How Vercel builds and serves the site: vercel.json's settings, as code that
   runs at the start of each build, so a setting can depend on the deployment.
   (Vercel reads this or a vercel.json, never both.)

   The site keeps its .html addresses (astro.config.mjs), so there are no
   clean URLs or redirects here, only headers. Production is `main`
   (VERCEL_ENV "production"); every other deployment, staging included, is
   "preview". */
import type { VercelConfig } from '@vercel/config/v1';

const staging = process.env.VERCEL_ENV === 'preview';

export const config: VercelConfig = {
  framework: 'astro',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
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
    // Staging is never indexed. Every response says so, files and images too,
    // on any domain (Vercel's own preview header is missing on a custom one).
    // The rendered pages say it again themselves (src/middleware.ts).
    ...(staging ? [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : []),
  ],
};
