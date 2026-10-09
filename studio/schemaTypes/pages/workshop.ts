import {defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons/Presentation'
import {headingField, heroSection, itemsField, pageSection, sectionHead, taglineField} from '../shared/fields'

/* The Workflow Workshop page, one section per part of the page, in the
   order the page shows them (src/pages/workshops-audits.astro; the page's
   own words in src/sanity/defaults/workshop.ts). The navigation, the
   footer and where every button leads stay in the site's code. A singleton
   with the fixed ID "workshopPage". */

// The two price cards are drawn by the page in two fixed places, with their
// own looks and buttons, so their list keeps its length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const workshopPage = defineType({
  name: 'workshopPage',
  title: 'Workflow Workshop page',
  type: 'document',
  icon: PresentationIcon,
  fields: [
    heroSection('The opening: the tagline and headline on the left, the standfirst and its two buttons on the right.', 'Links to the Contact page.', 'Scrolls to the Investment section.'),
    pageSection('symptoms', 'Does this sound like your practice?', 'The heading row and the four cards naming the problems the workshop finds.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The four cards: a title and a line of text each.'),
    ]),
    pageSection('method', 'Method', 'The heading row and the three cards on how the workshop works, each with a picture slot above it.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: the picture, an optional small line, the title and the text.'),
    ]),
    pageSection('journey', 'Journey', 'The heading row and the four steps from preparing to acting on the report.', [
      ...sectionHead(),
      itemsField('steps', 'Steps', 'step', 'The steps, top to bottom: the label on the left, the title and the text.'),
    ]),
    pageSection('story', 'What practices discover', 'The tagline and heading above the quote.', [taglineField(), headingField()]),
    defineField({name: 'quote', title: 'Quote', type: 'quote', description: 'The quote under “What practices discover”, and who said it. The avatar placeholder stays in the code.'}),
    pageSection('pricing', 'Investment', 'The heading row, the three outlined cards on what the workshop includes, and the two price cards. The cards’ looks and where their buttons lead stay in the site’s code.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The three outlined cards: a title and a line of text each.'),
      {...itemsField('cards', 'Price cards', 'priceCard', 'The workshop on the left, the Technology Blueprint on the dark card on the right.'), options: FIXED},
    ]),
    pageSection('faq', 'Common questions', 'The heading and the questions, in order; the first starts open.', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions and their answers, in order.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Workflow Workshop page'})},
})
