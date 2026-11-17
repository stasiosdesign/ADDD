/* The ADDDitive's archive (2026-11-16), from https://www.addd.io/archive:
   every post's details and its whole text, as published on beehiiv, its
   images left as placeholders for now (archive-posts.json: imported once,
   2026-11-16, by a script reading the archive and each post's page; 71
   posts, a corrected resend of one left out).
   Shown on the Newsletter page (newsletter.astro) and one page each at
   /newsletter/<slug> (newsletter/[slug].astro, NewsletterIssue.astro)
   until beehiiv is set up (src/newsletter/beehiiv.ts), whose issues these
   are, at the same addresses. (Moved from Reports & Guides on 2026-11-16,
   at the user's word.) */
import posts from "./archive-posts.json";
import { NEWSLETTER_TEMPLATE } from "./newsletter-template";
import type { NewsletterPost } from "../newsletter/beehiiv";

export type ArchivePost = (typeof posts)[number];

// the issues, newest first, the template (newsletter-template.ts) at the
// head of them as the newest
export const ARCHIVE: ArchivePost[] = [NEWSLETTER_TEMPLATE, ...posts];

/** A post as the issue page takes it (NewsletterIssue.astro): no picture yet */
export const archiveIssue = (post: ArchivePost): NewsletterPost => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  description: post.subtitle,
  date: post.date,
  image: "",
  imageIsOwn: false,
  tags: post.tags,
  authors: post.author ? [post.author] : [],
  html: post.html,
  readTime: post.readTime,
});

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const label = (tag?: string) => (tag ? tag.replace(/\b\w/g, (c) => c.toUpperCase()) : "Newsletter");

/** A post as a card (InsightCard.astro), its thumbnail empty for now */
export const archiveCard = (post: ArchivePost) => ({
  href: `/newsletter/${post.slug}`,
  image: "",
  category: label(post.tags[0]),
  title: post.title,
  description: post.subtitle || undefined,
  meta: [date(post.date), post.readTime ? `${post.readTime.replace(/ minutes?$/, " min")} read` : ""].filter(Boolean),
});
