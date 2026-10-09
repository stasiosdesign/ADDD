import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
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
    {type: 'beforeRevitPage', title: 'Before Revit', description: 'The early-stage design engagement: its opening, method and pricing.'},
    {type: 'blueprintPage', title: 'Technology Blueprint', description: 'The practice-wide strategy: its opening, benefits, delivery, enquiry and questions.'},
    {type: 'advisoryPage', title: 'ADDDvisory', description: 'The membership: its opening, structure, impact, comparison, pricing and questions.'},
    {type: 'stackDiagnosticPage', title: 'Stack Diagnostic', description: 'Free Tech Stacks: its opening, fit, method and where it leads.'},
    {type: 'licensingAuditPage', title: 'Software & Licensing Audit', description: 'The audit: its opening, fit, method and where it leads.'},
    {type: 'reportsPage', title: 'Reports', description: 'The heading over the reports, which are a collection.'},
    {type: 'newsletterPage', title: 'Newsletter', description: 'The heading over the issues, which are a collection.'},
    {type: 'techFirmsPage', title: 'For AEC Tech Firms', description: 'The partnership page: its opening, the opportunities and its own call to action.'},
    {type: 'aboutPage', title: 'About', description: 'The opening, foundation statement, what Allister sees and the validation.'},
    {type: 'contactPage', title: 'Contact', description: 'The enquiry page’s words and contact details; the form stays in the code.'},
  ],

  // The CMS collections, in the sidebar's order
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
    {
      type: 'newsletterIssue',
      title: 'Newsletter',
      singular: 'issue',
      nameField: 'title',
      orderField: 'publishedAt',
      icon: EnvelopeIcon,
      description: 'ADDDitive issues: a card on the Newsletter page and in the sliders, and each issue’s own page.',
      listedOn: 'newsletterPage',
    },
  ],

  // The page each kind of CMS item shows on (a client shows in the home
  // page's logo strip)
  documentRoute(doc) {
    const slug = doc.slug?.current
    if (doc._type === 'report') return slug ? `/reports/${slug}.html` : null
    if (doc._type === 'newsletterIssue') return slug ? `/newsletter/${slug}.html` : null
    if (doc._type === 'client') return '/'
    return null
  },

  visualEditor: {
    // A report's and an issue's own pages open the item beside the preview
    mainDocuments: [
      {route: '/reports/:slug.html', filter: `_type == "report" && slug.current == $slug`},
      {route: '/newsletter/:slug.html', filter: `_type == "newsletterIssue" && slug.current == $slug`},
    ],
    locations: {
      report: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: [
            {title: doc?.title || 'Untitled', href: `/reports/${doc?.slug}.html`},
            {title: 'Reports', href: '/reports.html'},
          ],
        }),
      }),
      newsletterIssue: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: [
            {title: doc?.title || 'Untitled', href: `/newsletter/${doc?.slug}.html`},
            {title: 'Newsletter', href: '/newsletter.html'},
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
