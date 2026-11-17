import {defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {headingField, leadField, pageSection, taglineField, seoSection, textField} from '../shared/fields'

/* The Newsletter page: its heading row (src/pages/newsletter.astro; the
   page's own words in src/sanity/defaults/newsletter.ts). The issues
   themselves come from beehiiv (src/newsletter/beehiiv.ts): written and
   sent there, they appear on the site by themselves, and nothing about them
   is written here (a collection until 2026-11-16). A singleton with the
   fixed ID "newsletterPage". */
export const newsletterPage = defineType({
  name: 'newsletterPage',
  title: 'Newsletter page',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', 'The heading row above the issues. Every issue comes from beehiiv and is integrated with it: written and sent there, it appears on the site by itself. Issues are never added or edited here.', [
      leadField('The standfirst on the left.'),
      taglineField(),
      headingField(),
    ]),
    pageSection('archive', 'The issues', 'What the page says while there are no issues yet, and the filters’ first and last buttons; the others are made from the issues’ categories.', [
      textField('Shown while there are none.', 'empty', 'While there are none', 2),
      headingField('The first filter: everything.', 'allLabel', 'All button'),
      headingField('The last: clears the filters.', 'resetLabel', 'Clear button'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Newsletter page'})},
})
