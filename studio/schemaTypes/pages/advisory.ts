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
    heroSection('The opening: the tagline and headline on the left, the standfirst and its two buttons on the right.', 'Opens the Book a Call calendar.', 'Scrolls down to the pricing on this page.', [
      headingField('The drawing: the session on the frame going round the loop.', 'figureFrame', 'Drawing: frame label'),
      headingField('The drawing: the name on its middle.', 'figurePlatform', 'Drawing: middle'),
      linesField('figureTags', 'Drawing: parts', 'The parts round the loop, one per line.'),
    ]),
    pageSection('statement', 'Statement', 'The large statement that comes up in the opening as its words scroll away.', [leadField('The statement. Written as one paragraph, the page sets it on even lines; a line break starts a new line where it is.', 'statement', 'Statement', 3)]),
    pageSection('structure', 'How it works', 'The tagline and heading centred over four panels (2026-11-05): monthly sessions, guidance between them, tools and frameworks, one membership, each with its small drawing and its words.', [
      // the standfirst, no longer shown (2026-11-05); kept so the code on
      // main can still read it
      {...leadField('No longer shown.'), hidden: true},
      taglineField(),
      headingField(),
      itemsField('tiles', 'Panels', 'tile', 'The four panels, in order (the first four are shown): a title and a line of text each.'),
      defineField({
        name: 'chips',
        title: 'First panel: themes',
        type: 'array',
        description: 'The themes drawn as chips in the first panel, in two rows (the first half, then the rest). Highlighted ones are lit.',
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
      headingField('Second panel: at both ends of the line.', 'sessionLabel', 'Second panel: session'),
      headingField('Second panel: under the line.', 'channelLabel', 'Second panel: channel'),
      headingField('Third panel: where the path starts.', 'pathStart', 'Third panel: start'),
      headingField('Third panel: its middle.', 'pathMiddle', 'Third panel: middle'),
      headingField('Third panel: where it ends.', 'pathEnd', 'Third panel: end'),
      headingField('Fourth panel: the lit bar.', 'membersTitle', 'Fourth panel: title'),
      linesField('members', 'Fourth panel: who it includes', 'One per line, each a bar.'),
      headingField('Fourth panel: beside each.', 'membersIncluded', 'Fourth panel: included'),
    ]),
    pageSection('themes', 'Themes covered', 'The heading and its line, held on the left, and the themes as one large list, each with its drawing (the drawings stay in the site’s code, by the theme’s name).', [
      leadField('Under the heading.'),
      headingField(),
      linesField('items', 'Themes', 'One theme per line, in order.'),
      defineField({
        name: 'photos',
        title: 'Photographs',
        type: 'array',
        description: 'The photographs beside the list, taking turns down it: the first with the first theme, the second with the second, then round again.',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'themePhoto',
            title: 'Photograph',
            fields: [imageField('Landscape, framed by its hotspot.')],
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
    pageSection('impact', 'Impact', 'The heading row and the four numbered cards on what the practice gains.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The four cards, left to right: the number, the small label, the title and the line of text.'),
    ]),
    pageSection('difference', 'Difference', 'The heading, on the left, and the comparison table with its column headings.', [
      // the standfirst and the small tab, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      {...taglineField('No longer shown.'), hidden: true},
      headingField(),
      itemsField('rows', 'Rows', 'compareRow', 'One row per line of the table: what is compared, then the Ongoing Advisory column and the Other column.'),
      headingField('The first column’s heading.', 'oursLabel', 'Column: ours'),
      headingField('The second column’s heading.', 'othersLabel', 'Column: other'),
      headingField('For screen readers: what the rows are.', 'rowsLabel', 'Column: rows (hidden)'),
    ]),
    pageSection('pricing', 'Pricing', 'The tagline, heading and standfirst over two rows that choose the plan, and the chosen plan’s card beside them. Where each card’s button leads stays in the site’s code.', [
      ...sectionHead('Under the heading.'),
      itemsField('cards', 'Cards', 'priceCard', 'The two plans: the membership (shown first), then the Technology Blueprint. Each row shows the plan’s title, its price and its badge; the note sits at the card’s foot. There are always two.'),
    ]),
    quoteSection('Not shown on the page since 2026-11-04: the site’s testimonials (the Home page’s, which open on this quote) stand between the pricing and the questions. Kept for later.'),
    pageSection('faq', 'Answers', 'The heading and the questions that end the page, each with its answer.', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions, in order; all start closed.'),
      defineField({name: 'footLine', title: 'Line under the questions', type: 'string', description: 'Over the Book a Free Call button.'}),
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
