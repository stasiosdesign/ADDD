/* The site's Sanity client: published content only, no token.

   Which dataset it reads follows the deployment (astro.config.mjs): the
   production dataset for the static production build, staging for staging
   and development. The Studio edits staging; only its Publish Live, through
   /api/publish (src/sanity/publish/), writes production. PUBLIC_SANITY_*
   can point a build elsewhere (.env.example). Nothing here is secret, so the
   browser code (live-preview.ts) uses it too. Drafts come from the request's
   own client in draft mode (src/sanity/draft-mode/, src/middleware.ts). */
import { createClient } from '@sanity/client';

export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'xqa8b0u9';

/** The dataset the Studio edits; staging and development read it */
export const STAGING_DATASET = 'staging';

export const dataset = import.meta.env.PUBLIC_SANITY_DATASET || (__DEPLOYMENT__ === 'production' ? 'production' : STAGING_DATASET);

export const apiVersion = '2025-02-19';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  // Production reads straight from the API at build time, so a rebuild right
  // after a publish always sees it; staging renders on request and has no
  // cache to go stale
  useCdn: false,
  perspective: 'published',
  stega: false,
});
