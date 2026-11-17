/** Which deployment this build is for, fixed at build time from Vercel's VERCEL_ENV and branch (astro.config.mjs). */
declare const __DEPLOYMENT__: 'production' | 'staging' | 'review' | 'development';

declare namespace App {
  interface Locals {
    /** Sanity for this page: published content, or drafts in draft mode (src/middleware.ts). */
    sanity: import('@sanity/client').SanityClient;
    /** Whether this request is in draft mode. Only ever true on staging and in development. */
    draftMode: boolean;
    /** Page documents fetched once per request by id (cachedDocument, src/sanity/content.ts): the Home page, which holds what every page shares, and the Tech Stacks page, whose stacks the navigation draws too. */
    documents?: Map<string, Promise<Record<string, unknown> | null>>;
  }
}
