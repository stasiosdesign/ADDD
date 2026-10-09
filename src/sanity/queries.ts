/* Every GROQ query the site runs. Which dataset a query reads is the client's
   business (src/sanity/client.ts, src/middleware.ts): staging reads the
   staging dataset (drafts in draft mode), production the production dataset. */

// A CMS item the editor has unpublished and not edited since: left out of
// every collection query. Only the Visual editor (drafts perspective) can see
// such an item at all, as its kept draft; the note the publish route leaves
// (publish-log.<id>, staging only) names the draft revision it left, so the
// first edit brings the item back, as Changes in draft. Published content
// never matches, so the live site and ordinary staging are unaffected.
const VISIBLE = `count(*[_id == "publish-log." + ^._id && state == "unpublished" && draftRev == ^._rev]) == 0`;

/** What a client's logo needs: the picture, and the name as its alt text */
const CLIENT = `_id, name, logo`;

/* A page document, whole, with its references followed: the logo strip's
   clients and each testimonial's logo (null on pages that have neither).
   Pictures come as their image objects (asset reference, crop, hotspot):
   src/sanity/image.ts reads the asset's size from the reference itself. */
export const PAGE_QUERY = `*[_id == $id][0]{
  ...,
  logos{ ..., clients[]->{ ${CLIENT} } },
  testimonials{ ..., items[]{ ..., client->{ ${CLIENT} } } }
}`;

/* The logo strip's clients in the order the Home page lists them, or every
   client in their own order while the Home page lists none */
export const CLIENT_LOGOS_QUERY = `select(
  count(*[_id == "homePage"][0].logos.clients) > 0 =>
    (*[_id == "homePage"][0].logos.clients[]-> { ${CLIENT} })[defined(logo.asset)],
  *[_type == "client" && defined(logo.asset)] | order(sortOrder asc, name asc) { ${CLIENT} }
)`;

/** An insight card: what the card shows, and the page it links to */
const CARD = `_id, _type, title, "slug": slug.current, category, summary, cover, readTime, author, publishedAt`;

export const REPORTS_QUERY = `*[_type == "report" && defined(slug.current) && ${VISIBLE}] | order(publishedAt desc, _createdAt desc) { ${CARD} }`;
export const ISSUES_QUERY = `*[_type == "newsletterIssue" && defined(slug.current) && ${VISIBLE}] | order(publishedAt desc, _createdAt desc) { ${CARD} }`;

/** Reports and issues together, newest first: the home page's research slider */
export const INSIGHTS_QUERY = `*[_type in ["report", "newsletterIssue"] && defined(slug.current) && ${VISIBLE}] | order(publishedAt desc, _createdAt desc) { ${CARD} }`;

export const REPORT_QUERY = `*[_type == "report" && slug.current == $slug && ${VISIBLE}][0]{ ..., "slug": slug.current }`;
export const ISSUE_QUERY = `*[_type == "newsletterIssue" && slug.current == $slug && ${VISIBLE}][0]{ ..., "slug": slug.current }`;
