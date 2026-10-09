/* Every page's own words and pictures: what the pages showed before they read
   Sanity, kept exactly, one object per page document and shaped like the
   document in Sanity (section → field). Each page in src/pages renders its
   document and falls back to these, field by field (src/sanity/content.ts),
   so the site reads the same whether a document is missing, a section is
   empty or a field has been cleared. The Studio's seed script
   (studio/scripts/seed.ts) makes the documents in the staging dataset from
   the same objects, uploading each picture from public/, so the two always
   agree.

   No imports from the site in these files: the seed script loads them
   outside the site's build. Keep the strings the real characters (’, —),
   not HTML entities. A list's blocks carry a _key, which the Visual editor
   redraws the list by. */
import { homePage } from './home';
import { aboutPage } from './about';
import { contactPage } from './contact';
import { techFirmsPage } from './tech-firms';
import { workshopPage } from './workshop';
import { beforeRevitPage } from './before-revit';
import { blueprintPage } from './blueprint';
import { advisoryPage } from './advisory';
import { stackDiagnosticPage } from './stack-diagnostic';
import { licensingAuditPage } from './licensing-audit';
import { reportsPage } from './reports';
import { newsletterPage } from './newsletter';
import { CLIENTS } from './clients';

export type { ImageDefault } from './types';
export { CLIENTS };

export const PAGE_DEFAULTS = {
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
} as const;

export type PageType = keyof typeof PAGE_DEFAULTS;
