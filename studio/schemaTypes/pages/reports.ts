import {defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {headingField, leadField, pageSection, taglineField} from '../shared/fields'

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
    pageSection('hero', 'Opening', 'The heading row above the reports, which are a collection. The filters are made from the reports’ categories.', [
      leadField('The standfirst on the left.'),
      taglineField(),
      headingField(),
    ]),
  ],
  preview: {prepare: () => ({title: 'Reports page'})},
})
