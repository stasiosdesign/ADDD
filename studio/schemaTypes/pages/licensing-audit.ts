import {defineField, defineType} from 'sanity'
import {BillIcon} from '@sanity/icons/Bill'
import {buttonField, headingField, itemsField, leadField, pageSection, sectionHead, taglineField} from '../shared/fields'

/* The Software & Licensing Audit page, one section per part of the page, in
   the order the page shows them (src/pages/software-licensing-audit.astro;
   the page's own words in src/sanity/defaults/licensing-audit.ts). The
   navigation, the footer, the chevron icons and where every button and text
   link leads stay in the site's code. A singleton with the fixed ID
   "licensingAuditPage". */

export const licensingAuditPage = defineType({
  name: 'licensingAuditPage',
  title: 'Software & Licensing Audit page',
  type: 'document',
  icon: BillIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening: the tagline and headline on the left, the standfirst, its button and the text link beside it on the right.', [
      taglineField(),
      headingField(),
      leadField('The standfirst.', 'lede', 'Standfirst', 4),
      buttonField('Links to the Technology Blueprint.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'The text link beside the button; it scrolls down to How it works on this page.'}),
    ]),
    pageSection('fit', 'Who it’s for', 'The heading row, the three cards on who the audit suits, and the two outlined cards pointing elsewhere. Where each outlined card’s link leads stays in the site’s code.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title and a line of text each.'),
      itemsField('alternatives', 'Outlined cards', 'tile', 'The two outlined cards under them: a title, a line of text and the text link. The first links to Free Tech Stacks, the second to the Technology Blueprint.'),
    ]),
    pageSection('method', 'How it works', 'The heading row, the four stages, and the button and text link under them. Where they lead stays in the site’s code.', [
      ...sectionHead(),
      itemsField('steps', 'Stages', 'step', 'The four stages, top to bottom: the small label, the title and the text.'),
      buttonField('Links to the Contact page.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'The text link beside the button; it links to the Reports page.'}),
    ]),
    pageSection('next', 'Where it leads', 'The heading row and the three cards on the routes practices take next. Where each card’s link leads stays in the site’s code.', [
      leadField(),
      headingField(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title, a line of text and the text link. They link to the Technology Blueprint, the Workflow Workshop and ADDDvisory.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Software & Licensing Audit page'})},
})
