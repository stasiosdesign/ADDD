/* Draft mode: how staging (and `npm run dev`) shows unpublished drafts to a
   browser the Studio's Visual editor has opened. Staging and development only;
   production builds never see this code (astro.config.mjs).

   The Visual editor opens the site at /api/draft-mode/enable with a
   short-lived secret it has written into the dataset. The route checks the
   secret with the read token, sets a signed cookie, and redirects to the page
   asked for. The middleware then reads drafts for that browser with the read
   token, on the server; the token never reaches a browser. The same as
   Tomrow Studios' src/sanity/draft-mode/, the reference implementation. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies, AstroCookieSetOptions } from 'astro';
import type { ClientPerspective } from '@sanity/client';
import { perspectiveCookieName, urlSearchParamPreviewPerspective } from '@sanity/preview-url-secret/constants';
import { SANITY_API_READ_TOKEN } from 'astro:env/server';
import { sanityClient } from '../client';

export const DRAFT_MODE_COOKIE = 'addd-draft-mode';

/** How long a draft session lasts, in seconds */
const MAX_AGE = 12 * 60 * 60;

/** Set on a page inside the Studio's iframe (another site), so SameSite=None, Secure, Partitioned */
export const cookieOptions: AstroCookieSetOptions = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  partitioned: true,
  maxAge: MAX_AGE,
};

export { perspectiveCookieName };

/** The Sanity Viewer token, from the deployment's environment; undefined where draft mode is not set up */
export const readToken = (): string | undefined => SANITY_API_READ_TOKEN || undefined;

// The cookie's value is when it was issued, signed with the read token, so it
// can't be made up or kept beyond MAX_AGE, and rotating the token ends every
// draft session.
const signature = (issuedAt: string, token: string) =>
  createHmac('sha256', token).update(`addd draft mode ${issuedAt}`).digest('base64url');

export function draftModeCookie(token: string): string {
  const issuedAt = String(Math.floor(Date.now() / 1000));
  return `${issuedAt}.${signature(issuedAt, token)}`;
}

function isValidCookie(value: string | undefined, token: string): boolean {
  const [issuedAt = '', signed = ''] = value?.split('.') ?? [];
  const age = Date.now() / 1000 - Number(issuedAt);
  if (!signed || !(age >= 0 && age < MAX_AGE)) return false;
  const expected = Buffer.from(signature(issuedAt, token));
  const actual = Buffer.from(signed);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** The content the Visual editor is showing: drafts, unless it is set to published or to a
    release (a comma-separated stack of IDs, ending in "drafts"). Anything else means drafts. */
function perspectiveFrom(value: string | null | undefined): ClientPerspective {
  if (value === 'published' || value === 'drafts') return value;
  const stack = value?.split(',') ?? [];
  const isRelease = stack.length > 1 && stack.at(-1) === 'drafts' && stack.every((id) => /^[\w.-]+$/.test(id));
  return isRelease ? stack : 'drafts';
}

/**
 * The Sanity client for a request in draft mode, reading drafts with the token and bypassing
 * the CDN; null when the request isn't in draft mode. The Visual editor adds the perspective it
 * shows to the URLs it opens; the cookie keeps it for the pages visited after.
 */
export function draftClient({ cookies, url }: { cookies: AstroCookies; url: URL }) {
  const token = readToken();
  if (!token || !isValidCookie(cookies.get(DRAFT_MODE_COOKIE)?.value, token)) return null;

  const requested = url.searchParams.get(urlSearchParamPreviewPerspective);
  if (requested && requested !== cookies.get(perspectiveCookieName)?.value) {
    cookies.set(perspectiveCookieName, requested, cookieOptions);
  }
  const perspective = perspectiveFrom(requested ?? cookies.get(perspectiveCookieName)?.value);

  return sanityClient.withConfig({ token, perspective, useCdn: false, stega: false });
}
