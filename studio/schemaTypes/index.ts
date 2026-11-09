import {client} from './documents/client'
import {newsletterIssue, report} from './documents/insights'
import {techStack} from './documents/tech-stack'
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

/** Every fixed page, in the site's navigation order; each a singleton whose _id is its type, at its address (clean, no .html) */
export const PAGES: PageEntry[] = [
  {type: 'homePage', title: 'Home', route: '/'},
  {type: 'techFirmsPage', title: 'AEC Tech Partners', route: '/tech-firms'},
  {type: 'workshopPage', title: 'Workflow Workshop', route: '/workshops-audits'},
  {type: 'beforeRevitPage', title: 'Before Revit', route: '/before-revit'},
  {type: 'blueprintPage', title: 'Technology Blueprint', route: '/technology-blueprint'},
  {type: 'advisoryPage', title: 'Ongoing Advisory', route: '/advisory'},
  {type: 'stackDiagnosticPage', title: 'Stack Diagnostic', route: '/stack-diagnostic'},
  {type: 'licensingAuditPage', title: 'Software & Licensing Audit', route: '/software-licensing-audit'},
  {type: 'reportsPage', title: 'Reports', route: '/reports'},
  {type: 'newsletterPage', title: 'Newsletter', route: '/newsletter'},
  {type: 'aboutPage', title: 'About', route: '/about'},
  {type: 'contactPage', title: 'Contact', route: '/contact'},
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
  techStack,
  client,
  tile,
  step,
  faqItem,
  quote,
  priceCard,
  compareRow,
]
