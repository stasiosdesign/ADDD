import {defineType, defineField} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {headingField, leadField, pageSection, taglineField, seoSection, textField} from '../shared/fields'

/* The Reports page: its heading row (src/pages/reports.astro; the page's
   own words in src/sanity/defaults/reports.ts). The reports themselves are
   a collection (documents/insights.ts), listed newest first, and the filter
   buttons are made from their categories. A singleton with the fixed ID
   "reportsPage". */
export const reportsPage = defineType({
  name: 'reportsPage',
  title: 'Reports page',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', '', [
      leadField(),
      taglineField(),
      headingField(),
    ]),
    pageSection('archive', 'The reports', '', [
      textField(undefined, 'empty', 'While there are none', 2),
      headingField(undefined, 'allLabel', 'All button'),
      headingField(undefined, 'resetLabel', 'Clear button'),
    ]),
    pageSection('reportPage', 'Report pages', 'Shared by every report’s page.', [
      defineField({name: 'formatDefault', title: 'What it is, by default', type: 'string', description: 'When a report has none.'}),
      defineField({name: 'freeLabel', title: 'Free', type: 'string', description: 'Shown instead of a price.'}),
      defineField({name: 'wasLabel', title: 'Before the old price', type: 'string'}),
      defineField({name: 'freeButton', title: 'Button: free', type: 'string', description: 'Unless the report has its own.'}),
      defineField({name: 'buyButton', title: 'Button: paid', type: 'string', description: 'Unless the report has its own.'}),
      defineField({name: 'insideLink', title: 'Button: what’s inside', type: 'string'}),
      defineField({name: 'coversTagline', title: 'What’s inside: tagline', type: 'string'}),
      defineField({name: 'coversHeading', title: 'What’s inside: heading', type: 'string'}),
      defineField({name: 'audienceTagline', title: 'Who it’s for: tagline', type: 'string'}),
      defineField({name: 'audienceHeading', title: 'Who it’s for: heading', type: 'string'}),
      defineField({name: 'getTagline', title: 'Getting it: tagline', type: 'string'}),
      defineField({name: 'getHeading', title: 'Getting it: heading', type: 'string'}),
      defineField({name: 'includesLabel', title: 'Getting it: list label', type: 'string'}),
      defineField({name: 'formTitle', title: 'Getting it: form’s name', type: 'string', description: 'Hidden; for screen readers.'}),
      defineField({name: 'partnerButton', title: 'Partner panel: button', type: 'string', description: 'Unless the report has its own.'}),
      defineField({name: 'relatedTagline', title: 'Related: tagline', type: 'string'}),
      defineField({name: 'relatedHeading', title: 'Related: heading', type: 'string'}),
      defineField({name: 'relatedText', title: 'Related: line', type: 'text', rows: 2}),
      defineField({name: 'relatedButton', title: 'Related: button', type: 'string'}),
    ]),
  ],
  preview: {prepare: () => ({title: 'Reports page'})},
})
