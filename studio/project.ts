import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineLocations} from 'sanity/presentation'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import type {CmsProjectConfig} from '@stasiosdesign/sanity-cms'
import {StudioIcon} from './components/StudioIcon'
import {PAGES, schemaTypes} from './schemaTypes'

/* Everything the CMS package (@stasiosdesign/sanity-cms) needs to know about
   the ADDD website: its Sanity project, its brand, its two sites, its content
   model, and how the Studio's Visual editor and publishing reach it. The
   package builds the Studio from this (sanity.config.ts); nothing in the
   package knows about this site otherwise. */

// The site the Visual editor (Sanity's Presentation tool) shows, never
// production: staging from the hosted Studio (.env.production beside this
// file), your own dev server from `npm run studio` (.env.development). It
// opens the site through its draft-mode route with a short-lived secret, so
// the site renders drafts on the server (src/sanity/draft-mode/), and the
// click-to-edit layer keeps them live as they are typed
// (src/sanity/live-preview.ts). The same address the publishing control
// sends its actions to (src/sanity/publish/). See the README, "Addresses".
const PREVIEW_ORIGIN = process.env.SANITY_STUDIO_PREVIEW_ORIGIN ?? ''

// The live site: the publishing menu's links and the build stamp it watches
// (/build.json, written by every production build, astro.config.mjs)
const LIVE_ORIGIN = process.env.SANITY_STUDIO_PRODUCTION_ORIGIN ?? ''

export const project: CmsProjectConfig = {
  projectId: 'xqa8b0u9',
  // The dataset the Studio edits. The live site reads `production`, which
  // only Publish Live writes to (src/sanity/publish/).
  dataset: 'staging',

  brand: {
    title: 'ADDD',
    // The ADDD mark, wherever Sanity shows the Studio's icon
    icon: StudioIcon,
    // The website's Adobe Fonts kit, the one src/layouts/BaseLayout.astro loads
    font: {family: '"parabolica", "Helvetica Neue", Helvetica, Arial, sans-serif', stylesheet: 'https://use.typekit.net/lzu8hkz.css'},
    // The site's red (--c-red in src/styles/styles.css)
    accent: {base: '#c40000', hover: '#d81a1a', pressed: '#a50000'},
  },

  sites: {preview: PREVIEW_ORIGIN, live: LIVE_ORIGIN},

  // Site Review's folders, one per review round: a frozen copy of the site,
  // code and content, on its own branch (review/<round>, cut from staging by
  // `npm run review:round`; README, "Site Review rounds"), so a round never
  // changes once its comments are made. Final Design V1 keeps the id
  // "final-design" its comments were made under (on staging, before rounds
  // were frozen); every later round gets an id of its own, never changed.
  // The Page editor always shows staging, the latest version.
  review: {
    versions: [
      {
        id: 'final-design',
        title: 'Final Design V1',
        date: '2026-11-09',
        url: 'https://addd-final-design-v1.vercel.app',
        branch: 'review/final-design-v1',
      },
    ],
    // The designer's notes in code (src/sanity/review-notes.ts, author
    // "stas") are shown as Stas's own Sanity account: his name and picture,
    // and replies to them in his inbox. The comments as kept are unchanged.
    authors: {stas: 'pd3Yhpnkn'},
  },

  publishing: {
    // The route is src/sanity/publish/ (the default /api/publish), on the
    // datasets staging and production (the defaults). A live publish that
    // doesn't rebuild the site points to the deploy hook in the README.
    rebuildHelp: 'check VERCEL_DEPLOY_HOOK_URL in the Vercel project’s Preview environment variables (README)',
  },

  schema: {
    types: schemaTypes,
    // Clients are edited from the Home page's logo strip, never made from the menu
    hiddenFromNew: ['client'],
  },

  // The static pages (schemaTypes/index.ts): in the site's navigation order
  pages: PAGES,

  // The Page editor's list: its order, its names, and each page's card on the overview
  pageEditor: [
    {type: 'homePage', title: 'Home', description: 'The hero, logo strip, approach, routes, testimonials, credentials, fit, research and the closing call to action every page ends on.'},
    {type: 'workshopPage', title: 'Workflow Workshop', description: 'The half-day diagnostic: its opening, method, journey, case study, pricing and questions.'},
    {type: 'beforeRevitPage', title: 'Before Revit', description: 'The early-stage design workflow research: its opening, challenge, scope, method, output, why ADDD, pricing and questions.'},
    {type: 'blueprintPage', title: 'Technology Blueprint', description: 'The practice-wide strategy: its opening, benefits, delivery, enquiry and questions.'},
    {type: 'advisoryPage', title: 'Ongoing Advisory', description: 'The membership: its opening, structure, impact, comparison, pricing and questions.'},
    {type: 'stackDiagnosticPage', title: 'Tech Stacks', description: 'Free Tech Stacks: its opening, the tech stacks themselves, fit, method and where it leads.'},
    {type: 'licensingAuditPage', title: 'Software & Licensing Audit', description: 'The audit: its opening, fit, method and where it leads.'},
    {type: 'reportsPage', title: 'Reports', description: 'The heading over the reports, which are a collection.'},
    {type: 'newsletterPage', title: 'Newsletter', description: 'The heading over the issues. The issues themselves come from beehiiv: written and sent there, they appear on the site by themselves, so there is nothing to add here.'},
    {type: 'techFirmsPage', title: 'AEC Tech Partners', description: 'The partnership page: its opening, the opportunities and its own call to action.'},
    {type: 'aboutPage', title: 'About', description: 'The opening, foundation statement, what Allister sees and the validation.'},
    {type: 'contactPage', title: 'Contact', description: 'The enquiry page’s words and contact details; the form stays in the code.'},
  ],

  // The CMS collections: Reports alone (2026-11-16, at the user's word).
  // The tech stacks are part of the Tech Stacks page (its Tech stacks
  // section, in the Page editor), and the newsletter's issues come from
  // beehiiv (src/newsletter/beehiiv.ts), never written here.
  collections: [
    {
      type: 'report',
      title: 'Reports',
      singular: 'report',
      nameField: 'title',
      orderField: 'publishedAt',
      icon: DocumentTextIcon,
      description: 'Reports and guides: a card on the Reports page and in the sliders, and each report’s own page.',
      listedOn: 'reportsPage',
    },
  ],

  // The page each kind of CMS item shows on (a client shows in the home
  // page's logo strip)
  documentRoute(doc) {
    const slug = doc.slug?.current
    if (doc._type === 'report') return slug ? `/reports/${slug}` : null
    if (doc._type === 'client') return '/'
    return null
  },

  visualEditor: {
    // A report's own page opens the report beside the preview
    mainDocuments: [
      {route: '/reports/:slug', filter: `_type == "report" && slug.current == $slug`},
    ],
    locations: {
      report: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: [
            {title: doc?.title || 'Untitled', href: `/reports/${doc?.slug}`},
            {title: 'Reports', href: '/reports'},
          ],
        }),
      }),
      client: defineLocations({locations: [{title: 'Home (logo strip)', href: '/'}]}),
    },
  },

  plugins: [
    // Staging sits behind Vercel Authentication. This tool stores Vercel's
    // "Protection Bypass for Automation" secret in the dataset (a private
    // document); the visual editor and the publishing route then add it to
    // the staging URLs they open. Hidden from the top bar, reached by its URL
    // alone: /vercel-protection-bypass.
    vercelProtectionBypassTool(),
  ],
}
