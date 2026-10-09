/* Reports and newsletter issues as insight cards (InsightCard.astro): the
   cards on the Reports and Newsletter pages, in the home page's research
   slider and in the "related" sliders. Each collection lives in Sanity
   (REPORTS_QUERY, ISSUES_QUERY, INSIGHTS_QUERY); while a list is empty the
   page keeps the cards it was built with (its defaults). */
import { hasImage, imageAttrs, type SanityImage } from './image';

/** What the card queries return (src/sanity/queries.ts, CARD) */
export type Insight = {
  _id: string;
  _type: 'report' | 'newsletterIssue';
  title: string;
  slug: string;
  category?: string | null;
  summary?: string | null;
  cover?: SanityImage | null;
  readTime?: string | null;
  author?: string | null;
  publishedAt?: string | null;
};

/** The props InsightCard.astro takes */
export type Card = { href: string; image: string; category: string; title: string; description?: string; meta: string[] };

export const insightHref = (item: Pick<Insight, '_type' | 'slug'>) =>
  item._type === 'report' ? `reports/${item.slug}.html` : `newsletter/${item.slug}.html`;

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * A card for an item. `meta` is the row under the title: by default the kind
 * (Report / Newsletter) and the reading time, as the home page shows them; an
 * index page passes its own choice (the author or the date, then the time).
 */
export function cardOf(item: Insight, meta?: (item: Insight) => string[]): Card {
  const image = hasImage(item.cover) ? imageAttrs(item.cover, 900).src : 'assets/images/allister-presenting.jpg';
  const kind = item._type === 'report' ? 'Report' : 'Newsletter';
  return {
    href: insightHref(item),
    image,
    category: item.category ?? kind,
    title: item.title,
    description: item.summary ?? undefined,
    meta: (meta ? meta(item) : [kind, item.readTime ?? '']).filter(Boolean),
  };
}

/** A card's meta row for an index page: the author or the date, then the reading time */
export const indexMeta = (item: Insight): string[] =>
  [item.author ?? (item.publishedAt ? formatDate(item.publishedAt) : ''), item.readTime ?? ''].filter(Boolean);
