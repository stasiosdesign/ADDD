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
export type ImageDefault = { path: string; alt?: string };

/** A page document from the request's client (published content, or drafts in draft mode) */
export const pageDocument = (sanity: SanityClient, id: string): Promise<Doc | null> => sanity.fetch<Doc | null>(PAGE_QUERY, { id });

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
    return { src: original?.path ?? '', width: undefined, height: undefined, alt: original?.alt ?? '' };
  };
  const bg = (path: string, width = 1600): string | undefined => {
    const value = valueAt(doc, path);
    return hasImage(value) ? `background-image:url(${urlFor(value).width(width).url()})` : undefined;
  };
  return { t, list, lines, img, bg };
}

/** The same readers for one block of a list (a tile, a step), falling back to the page's own block */
export function blockReader(block: Block | undefined, fallback: Block | undefined) {
  return reader(block ?? null, fallback ?? {});
}

export type { SanityImage };
