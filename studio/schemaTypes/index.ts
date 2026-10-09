import {client} from './documents/client'
import {newsletterIssue, report} from './documents/insights'
import {compareRow, faqItem, priceCard, quote, step, tile} from './objects/blocks'
import {aboutPage} from './pages/about'
import {advisoryPage} from './pages/advisory'
import {beforeRevitPage} from './pages/before-revit'
import {blueprintPage} from './pages/blueprint'
import {contactPage} from './pages/contact'
import {homePage} from './pages/home'
import {licensingAuditPage} from './pages/licensing-audit'
import {newsletterPage} from './pages/newsletter'
import {reportsPage} from './pages/reports'
import {stackDiagnosticPage} from './pages/stack-diagnostic'
import {techFirmsPage} from './pages/tech-firms'
import {workshopPage} from './pages/workshop'

export type PageEntry = {type: string; title: string; route: string}

/** Every fixed page, in the site's navigation order; each a singleton whose _id is its type, at its .html address */
export const PAGES: PageEntry[] = [
  {type: 'homePage', title: 'Home', route: '/'},
  {type: 'techFirmsPage', title: 'For AEC Tech Firms', route: '/tech-firms.html'},
  {type: 'workshopPage', title: 'Workflow Workshop', route: '/workshops-audits.html'},
  {type: 'beforeRevitPage', title: 'Before Revit', route: '/before-revit.html'},
  {type: 'blueprintPage', title: 'Technology Blueprint', route: '/technology-blueprint.html'},
  {type: 'advisoryPage', title: 'ADDDvisory', route: '/advisory.html'},
  {type: 'stackDiagnosticPage', title: 'Stack Diagnostic', route: '/stack-diagnostic.html'},
  {type: 'licensingAuditPage', title: 'Software & Licensing Audit', route: '/software-licensing-audit.html'},
  {type: 'reportsPage', title: 'Reports', route: '/reports.html'},
  {type: 'newsletterPage', title: 'Newsletter', route: '/newsletter.html'},
  {type: 'aboutPage', title: 'About', route: '/about.html'},
  {type: 'contactPage', title: 'Contact', route: '/contact.html'},
]

export const schemaTypes = [
  homePage,
  techFirmsPage,
  workshopPage,
  beforeRevitPage,
  blueprintPage,
  advisoryPage,
  stackDiagnosticPage,
  licensingAuditPage,
  reportsPage,
  newsletterPage,
  aboutPage,
  contactPage,
  report,
  newsletterIssue,
  client,
  tile,
  step,
  faqItem,
  quote,
  priceCard,
  compareRow,
]
