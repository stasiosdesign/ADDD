/* /newsletter.json (2026-11-19): the newsletter issues the website shows,
   as beehiiv gives them (src/newsletter/beehiiv.ts), for the Studio's
   Newsletter collection (studio/project.ts, externalCollections), which
   shows them view only. Nothing here is beyond what the issues' own pages
   show: published, public issues only, the same filters, no key.

   Built with the live site (and so rebuilt with it whenever beehiiv sends,
   updates or the daily rebuild runs: api/beehiiv.js); on staging, read on
   request. Another origin (the Studio) may read it: vercel.ts gives it its
   CORS header. */
import type { APIRoute } from "astro";
import { newsletterPosts } from "../newsletter/beehiiv";

export const GET: APIRoute = async () => {
  const posts = await newsletterPosts();
  const items = (posts ?? []).map((post) => ({
    id: post.id,
    slug: post.slug,
    url: `/newsletter/${post.slug}`,
    title: post.title,
    subtitle: post.description || undefined,
    date: post.date,
    readTime: post.readTime,
    author: post.authors.join(", ") || undefined,
    image: post.imageIsOwn ? post.image : undefined,
    status: "Published",
    html: post.html,
  }));
  return new Response(JSON.stringify({ source: posts ? "beehiiv" : null, builtAt: new Date().toISOString(), items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
