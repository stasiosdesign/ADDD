import {defineField, defineType} from 'sanity'
import {BillIcon} from '@sanity/icons/Bill'
import {buttonField, headingField, itemsField, leadField, pageSection, sectionHead, taglineField, seoSection} from '../shared/fields'

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
    seoSection(),
    pageSection('hero', 'Opening', '', [
      taglineField(),
      headingField(),
      leadField(undefined, 'lede', 'Standfirst', 4),
      buttonField('Links to the Technology Blueprint.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'Scrolls to How it works.'}),
    ]),
    pageSection('fit', 'Who it’s for', '', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile'),
      itemsField('alternatives', 'Outlined cards', 'tile', 'Link to Free Tech Stacks, then the Technology Blueprint.'),
    ]),
    pageSection('method', 'How it works', '', [
      ...sectionHead(),
      itemsField('steps', 'Stages', 'step'),
      buttonField('Links to Contact.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'Links to Reports.'}),
    ]),
    pageSection('next', 'Where it leads', '', [
      leadField(),
      headingField(),
      itemsField('tiles', 'Cards', 'tile', 'Link to the Blueprint, Workshop and Advisory pages.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Software & Licensing Audit page'})},
})
