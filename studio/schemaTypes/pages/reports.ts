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
    pageSection('hero', 'Opening', 'The heading row above the reports, which are a collection. The filters are made from the reports’ categories.', [
      leadField('The standfirst on the left.'),
      taglineField(),
      headingField(),
    ]),
    pageSection('archive', 'The reports', 'What the page says while there are no reports yet, and the filters’ first and last buttons; the others are made from the reports’ categories.', [
      textField('Shown while there are none.', 'empty', 'While there are none', 2),
      headingField('The first filter: everything.', 'allLabel', 'All button'),
      headingField('The last: clears the filters.', 'resetLabel', 'Clear button'),
    ]),
    pageSection('reportPage', 'Report pages', 'The words every report’s own page shares: its labels and buttons, the headings of what is inside, who it is for and getting it, and the heading over the other reports. Each report’s own words are in the Reports collection.', [
      defineField({name: 'formatDefault', title: 'What it is, by default', type: 'string', description: 'Over the title when a report doesn’t say what it is.'}),
      defineField({name: 'freeLabel', title: 'Free', type: 'string', description: 'In place of a price, for a free download.'}),
      defineField({name: 'wasLabel', title: 'Before the old price', type: 'string', description: 'On the card, before a struck-through price.'}),
      defineField({name: 'freeButton', title: 'Button: free', type: 'string', description: 'The opening’s button for a free download, unless the report has its own words.'}),
      defineField({name: 'buyButton', title: 'Button: paid', type: 'string', description: 'The opening’s and the card’s button for a paid report, unless the report has its own words.'}),
      defineField({name: 'insideLink', title: 'Button: what’s inside', type: 'string', description: 'The opening’s second button, down to what is inside.'}),
      defineField({name: 'coversTagline', title: 'What’s inside: tagline', type: 'string', description: 'Over the heading.'}),
      defineField({name: 'coversHeading', title: 'What’s inside: heading', type: 'string'}),
      defineField({name: 'audienceTagline', title: 'Who it’s for: tagline', type: 'string', description: 'Over the dark band’s heading.'}),
      defineField({name: 'audienceHeading', title: 'Who it’s for: heading', type: 'string'}),
      defineField({name: 'getTagline', title: 'Getting it: tagline', type: 'string', description: 'Over the heading beside the card.'}),
      defineField({name: 'getHeading', title: 'Getting it: heading', type: 'string', description: 'Beside the card; the report’s summary goes under it.'}),
      defineField({name: 'includesLabel', title: 'Getting it: list label', type: 'string', description: 'Over the card’s list.'}),
      defineField({name: 'formTitle', title: 'Getting it: form’s name', type: 'string', description: 'For screen readers, before the report’s title.'}),
      defineField({name: 'partnerButton', title: 'Partner panel: button', type: 'string', description: 'Unless the report’s panel has its own words.'}),
      defineField({name: 'relatedTagline', title: 'Related: tagline', type: 'string', description: 'Over the other reports.'}),
      defineField({name: 'relatedHeading', title: 'Related: heading', type: 'string'}),
      defineField({name: 'relatedText', title: 'Related: line', type: 'text', rows: 2, description: 'Under the heading.'}),
      defineField({name: 'relatedButton', title: 'Related: button', type: 'string', description: 'Leads to the Reports page.'}),
    ]),
  ],
  preview: {prepare: () => ({title: 'Reports page'})},
})
