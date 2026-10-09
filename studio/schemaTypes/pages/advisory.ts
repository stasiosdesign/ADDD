import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons/Users'
import {headingField, heroSection, imageField, itemsField, leadField, pageSection, sectionHead} from '../shared/fields'

/* The ADDDvisory page, one section per part of the page, in the order the
   page shows them (src/pages/advisory.astro; the page's own words in
   src/sanity/defaults/advisory.ts). The navigation, the footer, the
   comparison table's column headings and where every button leads stay in
   the site's code. A singleton with the fixed ID "advisoryPage". */

// The two price cards are drawn by the page in two fixed places, so their
// list keeps its length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const advisoryPage = defineType({
  name: 'advisoryPage',
  title: 'ADDDvisory page',
  type: 'document',
  icon: UsersIcon,
  fields: [
    heroSection('The opening: the tagline and headline on the left, the standfirst and its two buttons on the right.', 'Links to the Contact page.', 'Scrolls down to the pricing on this page.'),
    pageSection('statement', 'Statement', 'The single large line under the opening.', [leadField('The statement.', 'statement', 'Statement', 3)]),
    pageSection('structure', 'How it works', 'The heading row and the five cards describing how the membership works.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The five cards, left to right: a title and a line of text each.'),
    ]),
    pageSection('themes', 'Themes covered', 'The heading row and the four square pictures under it.', [
      leadField(),
      headingField(),
      imageField('The first square, on the left.', 'image1', 'Picture 1'),
      imageField('The second square.', 'image2', 'Picture 2'),
      imageField('The third square.', 'image3', 'Picture 3'),
      imageField('The fourth square, on the right.', 'image4', 'Picture 4'),
    ]),
    pageSection('impact', 'Impact', 'The heading row and the four numbered cards on what the practice gains.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The four cards, left to right: the number, the small label, the title and the line of text.'),
    ]),
    pageSection('difference', 'Difference', 'The heading row and the comparison table. The table’s column headings (ADDDvisory, Other) stay in the site’s code.', [
      ...sectionHead(),
      itemsField('rows', 'Rows', 'compareRow', 'One row per line of the table: what is compared, then the ADDDvisory column and the Other column.'),
    ]),
    pageSection('pricing', 'Pricing', 'The heading row and the two price cards. Where each card’s button leads stays in the site’s code.', [
      ...sectionHead(),
      itemsField('cards', 'Cards', 'priceCard', 'The two cards: the membership on the left, the Technology Blueprint on the right. There are always two.'),
    ]),
    defineField({name: 'quote', title: 'Quote', type: 'quote', description: 'The testimonial between the pricing and the questions: the quote, and who said it.'}),
    pageSection('faq', 'Answers', 'The heading and the questions that end the page, each with its answer.', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions, in order; the first starts open.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'ADDDvisory page'})},
})

// The price cards keep their length: the page draws exactly two
{
  const section = advisoryPage.fields.find((f) => f.name === 'pricing') as {fields?: {name: string; options?: object}[]} | undefined
  const list = section?.fields?.find((f) => f.name === 'cards')
  if (list) list.options = {...list.options, ...FIXED}
}
