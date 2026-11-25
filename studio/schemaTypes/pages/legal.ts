import {defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {headingField, leadField, pageSection, richTextField, seoSection, taglineField} from '../shared/fields'

/* The legal pages (2026-11-25): the Privacy Policy (/privacy-policy) and
   the Terms and Conditions (/terms), both drawn by one template
   (src/components/LegalPage.astro; the pages' own words in
   src/sanity/defaults/legal.ts) and linked from the footer's Company
   column. Each is its own singleton (fixed IDs "privacyPage" and
   "termsPage") with the same fields: the opening, a "last updated" line,
   and the text itself, written as in a word processor. */
const legalPage = (name: string, title: string, what: string) =>
  defineType({
    name,
    title: `${title} page`,
    type: 'document',
    icon: DocumentTextIcon,
    fields: [
      seoSection(),
      pageSection('hero', 'Opening', `The page’s heading, the line under it, and when the ${what} last changed.`, [
        taglineField(),
        headingField(),
        leadField('The line under the heading.'),
        headingField(`When the ${what} last changed, e.g. “Last updated 25 November 2026”. Change it whenever the text below changes.`, 'updated', 'Last updated'),
      ]),
      pageSection('content', `The ${what}`, `The ${what} itself. Write it as in a word processor: choose Heading or Subheading for a section’s title, and use the toolbar for bold, italic, lists and links.`, [
        richTextField(`The whole of the ${what}, from its first section to its last.`),
      ]),
    ],
    preview: {prepare: () => ({title: `${title} page`})},
  })

export const privacyPage = legalPage('privacyPage', 'Privacy Policy', 'policy')
export const termsPage = legalPage('termsPage', 'Terms and Conditions', 'terms')
