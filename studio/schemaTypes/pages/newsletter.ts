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
    pageSection('hero', 'Opening', 'Issues come from beehiiv.', [
      leadField(),
      taglineField(),
      headingField(),
    ]),
    pageSection('archive', 'The issues', '', [
      textField(undefined, 'empty', 'While there are none', 2),
      headingField(undefined, 'allLabel', 'All button'),
      headingField(undefined, 'resetLabel', 'Clear button'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Newsletter page'})},
})
