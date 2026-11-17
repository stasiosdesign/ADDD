/* ============================================================
   The ADDDitive newsletter, from beehiiv (2026-11-16)
   ============================================================
   Every newsletter is written, managed and sent in beehiiv; the site reads
   the published ones and gives each a card on /newsletter and a page of
   its own at /newsletter/<slug>. Nothing is copied by hand.

   Where the posts come from, by the variables set (.env.example):
     - BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID: beehiiv's API v2 (paid
       plans), each post's full content included (its RSS rendering, the
       version beehiiv makes for other sites: minimal styling);
     - else BEEHIIV_RSS_URL: the publication's RSS feed (every plan);
     - neither: null, and the newsletter pages keep what they had (the
       Sanity issues or the template's).

   Only what is public and already out: published (beehiiv's "confirmed"),
   its publish date passed (so a scheduled post waits), on the web (not
   email-only), for free readers (not premium-only), not hidden from the
   feed. One post per id and per slug, newest first.

   When it is read:
     - production (static): once per build. A build is started by beehiiv
       (a webhook: api/beehiiv.js) when a post is sent, updated or deleted,
       and once a day besides (vercel.ts, crons). If beehiiv cannot be
       reached, or answers with an error, the build fails rather than
       publish an empty newsletter page, and Vercel keeps serving the last
       good one;
     - staging and development (rendered on request): kept in memory for
       CACHE_MS, and on an error the last good list is served if there is
       one.
   The API key stays on the server: it is read at build time (production)
   or in the Vercel Function (staging), never sent to a browser.
   ============================================================ */
import { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID, BEEHIIV_RSS_URL } from "astro:env/server";
import { transform } from "ultrahtml";
import sanitize from "ultrahtml/transformers/sanitize";

export type NewsletterPost = {
  id: string;
  slug: string;
  title: string;
  /** beehiiv's subtitle, or its preview text */
  description: string;
  /** ISO date it was published (its displayed date where it has one) */
  date: string;
  /** the thumbnail, or the site's stand-in */
  image: string;
  imageIsOwn: boolean;
  tags: string[];
  authors: string[];
  /** its content, cleaned: the site's styles apply, nothing of beehiiv's */
  html: string;
  /** how long it takes to read, where known (e.g. "6 minutes") */
  readTime?: string;
};

const API = "https://api.beehiiv.com/v2";
const FALLBACK_IMAGE = "/assets/images/allister-presenting.jpg";
const CACHE_MS = 10 * 60 * 1000;
const TRIES = 5;

export const newsletterSource = (): "api" | "rss" | null =>
  BEEHIIV_API_KEY && BEEHIIV_PUBLICATION_ID ? "api" : BEEHIIV_RSS_URL ? "rss" : null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A request, retried when beehiiv asks us to wait (202: content still rendering; 429: too many) or briefly fails */
async function request(url: string, init: RequestInit = {}): Promise<Response> {
  let last = "";
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
      if (response.ok && response.status !== 202) return response;
      last = `${response.status} ${response.statusText}`;
      if (response.status !== 202 && response.status !== 429 && response.status < 500) break;
      const wait = Number(response.headers.get("retry-after"));
      await sleep(Number.isFinite(wait) && wait > 0 ? Math.min(wait, 30) * 1000 : 1000 * attempt);
    } catch (error) {
      last = String(error);
      await sleep(1000 * attempt);
    }
  }
  throw new Error(`beehiiv: ${url.replace(/\?.*/, "")} failed (${last})`);
}

// ---- cleaning a post's HTML ---------------------------------------------
// Kept: the words and their structure, links, images, tables, embeds' links.
// Dropped: scripts, styles, forms, tracking pixels, beehiiv's own classes
// and inline styles (the site's prose styles take over: styles.css .prose).
const ALLOWED = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "sub", "sup", "small", "mark", "code", "pre",
  "a", "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "picture", "source", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "div", "span", "section", "article",
];
const KEEP_ATTRIBUTES: Record<string, string[]> = {
  href: ["a"],
  src: ["img", "source"],
  srcset: ["img", "source"],
  alt: ["img"],
  width: ["img"],
  height: ["img"],
  colspan: ["td", "th"],
  rowspan: ["td", "th"],
  title: ["a", "img"],
};
async function clean(html: string): Promise<string> {
  // the post's body alone: beehiiv's RSS rendering wraps it in .beehiiv__body
  const body = html.match(/<div[^>]+class="[^"]*beehiiv__body[^"]*"[^>]*>([\s\S]*)<\/div>\s*$/i)?.[1] ?? html;
  const out = await transform(body, [
    sanitize({
      // any other element is unwrapped (its words kept); these go whole
      unblockElements: ALLOWED,
      dropElements: ["script", "style", "noscript", "form", "input", "button", "select", "textarea", "iframe", "svg", "object", "embed", "head", "title", "meta", "link"],
      allowComments: false,
    }),
  ]);
  return out
    // only these attributes, each on its own elements: no class, style, id
    // or handler of beehiiv's (the sanitizer's own attribute list keeps them)
    .replace(/<([a-z][a-z0-9]*)(\s[^>]*?)?(\/?)>/gi, (_, tag: string, attrs = "", end: string) => {
      const keep = [...attrs.matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)]
        .filter(([, name]) => KEEP_ATTRIBUTES[name.toLowerCase()]?.includes(tag.toLowerCase()))
        .map(([, name, value = ""]) => ` ${name.toLowerCase()}="${value}"`)
        .join("");
      return `<${tag}${keep}${end}>`;
    })
    // no script in a link
    .replace(/\shref="\s*(?:javascript|data|vbscript):[^"]*"/gi, "")
    // links out open in a new tab, safely
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"')
    // images load as they come near, and decode off the main thread
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    // no tracking pixels (1 × 1 images)
    .replace(/<img[^>]*\b(width="1"[^>]*height="1"|height="1"[^>]*width="1")[^>]*>/g, "")
    // no empty paragraphs and wrappers left behind
    .replace(/<(p|div|span)>\s*(?:&nbsp;)?\s*<\/\1>/g, "")
    .trim();
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "issue";

/** Newest first, and one per id and per slug */
function tidy(posts: NewsletterPost[]): NewsletterPost[] {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  return posts
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((post) => {
      if (!post.title || ids.has(post.id)) return false;
      let slug = post.slug;
      for (let n = 2; slugs.has(slug); n++) slug = `${post.slug}-${n}`;
      post.slug = slug;
      ids.add(post.id);
      slugs.add(slug);
      return true;
    });
}

// ---- the API (paid plans) ------------------------------------------------
type ApiPost = {
  id: string;
  title?: string;
  subtitle?: string;
  preview_text?: string;
  slug?: string;
  thumbnail_url?: string;
  publish_date?: number;
  displayed_date?: number;
  status?: string;
  audience?: string;
  platform?: string;
  hidden_from_feed?: boolean;
  authors?: string[];
  content_tags?: string[];
  content?: { free?: { rss?: string; web?: string } };
};

async function fromApi(): Promise<NewsletterPost[]> {
  const now = Date.now() / 1000;
  const posts: NewsletterPost[] = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const query = new URLSearchParams({
      status: "confirmed",
      expand: "free_rss_content",
      order_by: "publish_date",
      direction: "desc",
      hidden_from_feed: "false",
      limit: "50",
      page: String(page),
    });
    const response = await request(`${API}/publications/${BEEHIIV_PUBLICATION_ID}/posts?${query}`, {
      headers: { Authorization: `Bearer ${BEEHIIV_API_KEY}`, Accept: "application/json" },
    });
    const body = (await response.json()) as { data?: ApiPost[]; total_pages?: number };
    pages = Math.max(1, body.total_pages ?? 1);
    for (const post of body.data ?? []) {
      const published = post.publish_date ?? 0;
      // public and already out: published, its time passed, on the web, for free readers, in the feed
      if (post.status !== "confirmed" || !published || published > now) continue;
      if (post.platform === "email" || post.audience === "premium" || post.hidden_from_feed) continue;
      const content = post.content?.free?.rss ?? post.content?.free?.web ?? "";
      posts.push({
        id: post.id,
        slug: post.slug ? slugify(post.slug) : slugify(post.title ?? post.id),
        title: post.title?.trim() ?? "",
        description: (post.subtitle || post.preview_text || "").trim(),
        date: new Date((post.displayed_date || published) * 1000).toISOString(),
        image: post.thumbnail_url || FALLBACK_IMAGE,
        imageIsOwn: Boolean(post.thumbnail_url),
        tags: (post.content_tags ?? []).filter(Boolean),
        authors: (post.authors ?? []).filter(Boolean),
        html: content ? await clean(content) : "",
      });
    }
  }
  return tidy(posts);
}

// ---- the RSS feed (every plan) -------------------------------------------
const decode = (text: string) =>
  text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&")
    .trim();
const tagOf = (xml: string, name: string) => {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1].trim()) : "";
};

async function fromRss(): Promise<NewsletterPost[]> {
  const response = await request(BEEHIIV_RSS_URL!, { headers: { Accept: "application/rss+xml, application/xml" } });
  const xml = await response.text();
  const now = Date.now();
  const posts: NewsletterPost[] = [];
  for (const item of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []) {
    const link = tagOf(item, "link");
    const date = new Date(tagOf(item, "pubDate"));
    if (Number.isNaN(date.getTime()) || date.getTime() > now) continue;
    const image = item.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ?? item.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ?? "";
    const content = tagOf(item, "content:encoded") || tagOf(item, "description");
    const title = tagOf(item, "title");
    posts.push({
      id: tagOf(item, "guid") || link || title,
      slug: slugify(link.replace(/\/+$/, "").split("/").pop() || title),
      title,
      description: tagOf(item, "description").replace(/<[^>]+>/g, "").slice(0, 280),
      date: date.toISOString(),
      image: image || FALLBACK_IMAGE,
      imageIsOwn: Boolean(image),
      tags: [...item.matchAll(/<category>([\s\S]*?)<\/category>/gi)].map((m) => decode(m[1])).filter(Boolean),
      authors: [tagOf(item, "dc:creator") || tagOf(item, "author")].filter(Boolean),
      html: content ? await clean(content) : "",
    });
  }
  return tidy(posts);
}

// ---- the list, once per build or kept a while ------------------------------
let cache: { at: number; posts: NewsletterPost[] } | null = null;
let pending: Promise<NewsletterPost[]> | null = null;
const onDemand = __DEPLOYMENT__ === "staging" || __DEPLOYMENT__ === "development";

/** Every public newsletter, newest first; null while beehiiv is not set up */
export async function newsletterPosts(): Promise<NewsletterPost[] | null> {
  const source = newsletterSource();
  if (!source) return null;
  if (cache && (!onDemand || Date.now() - cache.at < CACHE_MS)) return cache.posts;
  pending ??= (source === "api" ? fromApi() : fromRss())
    .then((posts) => {
      cache = { at: Date.now(), posts };
      return posts;
    })
    .finally(() => {
      pending = null;
    });
  try {
    return await pending;
  } catch (error) {
    // On request: the last good list, if there is one. In a build: fail,
    // so the site keeps its last good deployment.
    if (onDemand && cache) return cache.posts;
    throw error;
  }
}

export async function newsletterPost(slug: string): Promise<NewsletterPost | null> {
  return (await newsletterPosts())?.find((post) => post.slug === slug) ?? null;
}

export const newsletterDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
