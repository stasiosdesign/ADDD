import {defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {headingField, leadField, pageSection, taglineField} from '../shared/fields'

/* The Newsletter page: its heading row (src/pages/newsletter.astro; the
   page's own words in src/sanity/defaults/newsletter.ts). The issues
   themselves are a collection (documents/insights.ts), listed newest first,
   and the filter buttons are made from their categories. A singleton with
   the fixed ID "newsletterPage". */
export const newsletterPage = defineType({
  name: 'newsletterPage',
  title: 'Newsletter page',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    pageSection('hero', 'Opening', 'The heading row above the issues, which are a collection. The filters are made from the issues’ categories.', [
      leadField('The standfirst on the left.'),
      taglineField(),
      headingField(),
    ]),
  ],
  preview: {prepare: () => ({title: 'Newsletter page'})},
})
