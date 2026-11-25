/* The pages' content, read from the page's own document in Sanity.

   A page asks for its document (pageDocument) and reads each field with a
   fallback: the words the page has always had (src/sanity/defaults/). A
   field that is empty in Sanity, or a document not published yet, keeps the
   page's own words, so the site looks exactly as before until something is
   published, and a field emptied in the Studio goes back to them. The same
   for a list of blocks: the document's list once it has any, else the page's.

   Each element that shows a field names it (data-page-field="hero.heading")
   inside the element naming its document (data-page-doc, on the Barba
   container: BaseLayout.astro), so the Visual editor can outline it and
   write drafts into it (live-preview.ts). */
import type { SanityClient } from '@sanity/client';
import { hasImage, imageAttrs, urlFor, type SanityImage } from './image';
import { PAGE_QUERY } from './queries';

export type Doc = Record<string, unknown>;

/** A picture the page shipped with: its file under public/ (as the page references it) and its alt text */
export type ImageDefault = { path: string; alt?: string; width?: number; height?: number };

/**
 * DETACHED: the site reads nothing from Sanity. Every page shows its own
 * words and pictures from src/sanity/defaults/ (edit them there), the logo
 * strip shows CLIENTS, and the collections (reports, newsletter issues,
 * tech stacks) are empty, so their pages keep the cards they were built
 * with. The bindings (data-page-field…) stay in place for relinking.
 *
 * History: detached from 2026-10-10 to 2026-11-09 while the copy was
 * written, then reattached once the defaults' wording was in both datasets.
 * Detached again on 2026-11-16 at the user's request, so the text can be
 * changed in the code for now; the staging dataset's page and client
 * fields were emptied at the same time (a backup of the dataset is in
 * source-assets/sanity-backups/). To relink: write the defaults back into
 * the Studio's documents (both datasets), set this to false, and check
 * the Page editor shows the same words as the page.
 *
 * Relinked on 2026-11-16 at the user's word ("every field connected to
 * Sanity"): every page, the navigation, the footer, the booking dialog and
 * the tech stacks read their documents again, and the defaults were
 * written back into the staging dataset (studio/scripts/seed.ts).
 */
export const DETACHED = false;

/** A page document from the request's client (published content, or drafts in draft mode) */
export const pageDocument = (sanity: SanityClient, id: string): Promise<Doc | null> =>
  DETACHED ? Promise.resolve(null) : sanity.fetch<Doc | null>(PAGE_QUERY, { id });

/**
 * The Home page document, fetched once per request (kept on Astro.locals):
 * it also holds what every page shares, the navigation, the footer, the
 * newsletter signup, the booking dialog and the closing call to action, so
 * the shell's components (Nav, Footer, BookCallDialog…) read it from here.
 */
export const siteDocument = (locals: App.Locals): Promise<Doc | null> => cachedDocument(locals, 'homePage');

/** A page document fetched at most once per request (kept on Astro.locals), for what more than one component reads (the Home page's shared parts, the tech stacks) */
export const cachedDocument = (locals: App.Locals, id: string): Promise<Doc | null> => {
  const cache = (locals.documents ??= new Map());
  let doc = cache.get(id);
  if (!doc) cache.set(id, (doc = pageDocument(locals.sanity, id)));
  return doc;
};

/** The attributes that name the Home page document on a shared block outside its page (the nav, the footer), for the Visual editor */
export const SITE_SCOPE = { 'data-page-doc': 'homePage', 'data-page-type': 'homePage' } as const;

/** A collection query (clients, reports, issues, stacks): nothing while detached */
export const collection = <T>(sanity: SanityClient, query: string, params: Record<string, unknown> = {}): Promise<T[]> =>
  DETACHED ? Promise.resolve([]) : sanity.fetch<T[]>(query, params);

/** One collection item (a report, an issue): none while detached */
export const collectionItem = <T>(sanity: SanityClient, query: string, params: Record<string, unknown> = {}): Promise<T | null> =>
  DETACHED ? Promise.resolve(null) : sanity.fetch<T | null>(query, params);

export const valueAt = (doc: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((at, key) => (at && typeof at === 'object' ? (at as Record<string, unknown>)[key] : undefined), doc);

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** A block of a list, with the key the Visual editor redraws the list by */
export type Block = { _key: string } & Record<string, unknown>;

/**
 * A page's readers for one document, each falling back to the page's own
 * words in its defaults:
 *   t(path)         a field's text
 *   list(path)      a list of blocks: the document's once it has any, else the page's own
 *   img(path, w)    an <img>'s src, size and alt: the picture set in the Studio, or the page's own file
 *   bg(path)        the inline style of a slot drawn with a background picture, or undefined
 */
export function reader(doc: Doc | null | undefined, defaults: Doc) {
  const own = (path: string) => valueAt(defaults, path);
  const t = (path: string, fallback?: string): string => {
    const value = valueAt(doc, path);
    if (nonEmpty(value)) return value;
    if (fallback !== undefined) return fallback;
    const original = own(path);
    return nonEmpty(original) ? original : '';
  };
  const list = <T extends Block = Block>(path: string): T[] => {
    const value = valueAt(doc, path);
    if (Array.isArray(value) && value.length > 0) return value as T[];
    const original = own(path);
    return Array.isArray(original) ? (original as T[]) : [];
  };
  const lines = (path: string): string[] => {
    const value = valueAt(doc, path);
    if (Array.isArray(value) && value.length > 0) return value.filter(nonEmpty);
    const original = own(path);
    return Array.isArray(original) ? original.filter(nonEmpty) : [];
  };
  const img = (path: string, width = 1600, fallback?: ImageDefault) => {
    const value = valueAt(doc, path);
    const original = fallback ?? (own(path) as ImageDefault | undefined);
    if (hasImage(value)) return { ...imageAttrs(value, width), alt: value.alt ?? original?.alt ?? '' };
    return { src: original?.path ?? '', width: original?.width, height: original?.height, alt: original?.alt ?? '' };
  };
  const bg = (path: string, width = 1600): string | undefined => {
    const value = valueAt(doc, path);
    return hasImage(value) ? `background-image:url(${urlFor(value).width(width).url()})` : undefined;
  };
  /**
   * A list of blocks (list), each with readers of its own: a field a block
   * leaves empty falls back to the page's own block with the same key (the
   * seed writes the defaults with their keys), so a block added in the
   * Studio has no fallback but the page's own keep theirs.
   */
  const items = <T extends Block = Block>(path: string) => {
    const original = valueAt(defaults, path);
    const byKey = new Map((Array.isArray(original) ? (original as Block[]) : []).map((block) => [block._key, block]));
    return list<T>(path).map((block, index) => ({ block, index, key: block._key, ...reader(block, byKey.get(block._key) ?? {}) }));
  };
  return { t, list, lines, img, bg, items };
}

/** A telephone number as written (+44 (0) 207 183 3675) as a tel: link's number (+442071833675) */
export const telOf = (phone: string): string => phone.replace(/\(0\)/g, '').replace(/[^\d+]/g, '');

/** A date as the Studio keeps it (2026-11-25) as the site writes it (25 November 2026); empty if it isn't one */
export const longDate = (iso: unknown): string => {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
};

/** Whether a link leads off the site (it then opens in a new tab) */
export const isExternal = (href: string): boolean => /^https?:\/\//i.test(href);

/** A link's target attributes: a new tab for another site, none for the site's own pages, mailto: or tel: */
export const linkTarget = (href: string) => (isExternal(href) ? { target: '_blank', rel: 'noopener' } : {});

/** The same readers for one block of a list (a tile, a step), falling back to the page's own block */
export function blockReader(block: Block | undefined, fallback: Block | undefined) {
  return reader(block ?? null, fallback ?? {});
}

export type { SanityImage };
