import {defineArrayMember, defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons/Users'
import {headingField, heroSection, imageField, itemsField, leadField, linesField, pageSection, quoteSection, sectionHead, seoSection, taglineField} from '../shared/fields'

/* The Ongoing Advisory page, one section per part of the page, in the order the
   page shows them (src/pages/advisory.astro; the page's own words in
   src/sanity/defaults/advisory.ts). The navigation, the footer, the
   comparison table's column headings and where every button leads stay in
   the site's code. A singleton with the fixed ID "advisoryPage". */

// The two price cards are drawn by the page in two fixed places, so their
// list keeps its length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const advisoryPage = defineType({
  name: 'advisoryPage',
  title: 'Ongoing Advisory page',
  type: 'document',
  icon: UsersIcon,
  fields: [
    seoSection(),
    heroSection('', 'Opens the booking calendar.', 'Scrolls to the pricing.', [
      headingField(undefined, 'figureFrame', 'Drawing: frame label'),
      headingField(undefined, 'figurePlatform', 'Drawing: middle'),
      linesField('figureTags', 'Drawing: parts'),
    ]),
    pageSection('statement', 'Statement', '', [leadField('A line break starts a new line.', 'statement', 'Statement', 3)]),
    pageSection('structure', 'How it works', '', [
      // the standfirst, no longer shown (2026-11-05); kept so the code on
      // main can still read it
      {...leadField('No longer shown.'), hidden: true},
      taglineField(),
      headingField(),
      itemsField('tiles', 'Panels', 'tile', 'Only the first four show.'),
      defineField({
        name: 'chips',
        title: 'First panel: themes',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'chip',
            title: 'Theme',
            fields: [
              defineField({name: 'name', title: 'Theme', type: 'string'}),
              defineField({name: 'on', title: 'Highlighted', type: 'boolean', initialValue: false}),
            ],
            preview: {select: {title: 'name', on: 'on'}, prepare: ({title, on}) => ({title, subtitle: on ? 'Highlighted' : undefined})},
          }),
        ],
      }),
      headingField(undefined, 'sessionLabel', 'Second panel: session'),
      headingField(undefined, 'channelLabel', 'Second panel: channel'),
      headingField(undefined, 'pathStart', 'Third panel: start'),
      headingField(undefined, 'pathMiddle', 'Third panel: middle'),
      headingField(undefined, 'pathEnd', 'Third panel: end'),
      headingField(undefined, 'membersTitle', 'Fourth panel: title'),
      linesField('members', 'Fourth panel: who it includes'),
      headingField(undefined, 'membersIncluded', 'Fourth panel: included'),
    ]),
    pageSection('themes', 'Themes covered', '', [
      leadField(),
      headingField(),
      linesField('items', 'Themes'),
      defineField({
        name: 'photos',
        title: 'Photographs',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'themePhoto',
            title: 'Photograph',
            fields: [imageField('Landscape.')],
            preview: {select: {media: 'image'}, prepare: ({media}) => ({media, title: 'Photograph'})},
          }),
        ],
      }),
      // the four squares before 2026-11-05, no longer shown; kept so the code
      // on main can still read them
      ...[1, 2, 3, 4].flatMap((n) => [
        {...imageField('No longer shown.', `image${n}`, `Picture ${n}`), hidden: true},
        {...defineField({name: `title${n}`, title: `Theme ${n}`, type: 'string', description: 'No longer shown.'}), hidden: true},
      ]),
    ]),
    pageSection('impact', 'Impact', '', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile'),
    ]),
    pageSection('difference', 'Difference', '', [
      // the standfirst and the small tab, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      {...taglineField('No longer shown.'), hidden: true},
      headingField(),
      itemsField('rows', 'Rows', 'compareRow'),
      headingField(undefined, 'oursLabel', 'Column: ours'),
      headingField(undefined, 'othersLabel', 'Column: other'),
      headingField('Hidden; for screen readers.', 'rowsLabel', 'Column: rows (hidden)'),
    ]),
    pageSection('pricing', 'Pricing', '', [
      ...sectionHead(),
      itemsField('cards', 'Cards', 'priceCard'),
    ]),
    quoteSection('Not shown on the page.'),
    pageSection('faq', 'Answers', '', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem'),
      defineField({name: 'footLine', title: 'Line under the questions', type: 'string'}),
    ]),
  ],
  preview: {prepare: () => ({title: 'Ongoing Advisory page'})},
})

// The price cards keep their length: the page draws exactly two
{
  const section = advisoryPage.fields.find((f) => f.name === 'pricing') as {fields?: {name: string; options?: object}[]} | undefined
  const list = section?.fields?.find((f) => f.name === 'cards')
  if (list) list.options = {...list.options, ...FIXED}
}
