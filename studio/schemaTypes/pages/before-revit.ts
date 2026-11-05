import {defineField, defineType} from 'sanity'
import {EditIcon} from '@sanity/icons/Edit'
import {buttonField, headingField, itemsField, leadField, pageSection, taglineField, textField} from '../shared/fields'

/* The Before Revit page, one section per part of the page, in the order the
   page shows them (src/pages/before-revit.astro; the page's own words in
   src/sanity/defaults/before-revit.ts). The navigation, the footer and
   where every button leads stay in the site's code. A singleton with the
   fixed ID "beforeRevitPage". */

// The two price cards are drawn by the page in two fixed places, with their
// own looks and buttons, so their list keeps its length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const beforeRevitPage = defineType({
  name: 'beforeRevitPage',
  title: 'Before Revit page',
  type: 'document',
  icon: EditIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening, on black: the headline, the standfirst and the two buttons on the left, the drawing held on the right while they scroll away and the statement comes up after them.', [
      taglineField(),
      // a text (it was a single line): a line break written in it is where
      // the heading's second line starts (the same value either way)
      textField('On two lines, both the same size: a line break written here is where the second line starts; without one, the second line takes the second half of the words.', 'heading', 'Heading', 2),
      leadField(),
      buttonField('Opens the Book a Call calendar.', 'primaryButton', 'First button label'),
      buttonField('Scrolls to the Investment section.', 'secondaryButton', 'Second button label'),
      textField('The statement that comes up on the left as the opening’s words scroll away, the drawing staying in place on the right. One line here is one line on the page, all at one size: break the lines where a reader would pause.', 'statement', 'Statement', 3),
    ]),
    pageSection('problem', 'The problem', 'The heading and the three cards naming when the early-stage workflow needs rethinking, each with its figure (the Workflow Workshop’s problem cards; the figures stay in the code).', [
      headingField(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title and a line of text each.'),
    ]),
    pageSection('method', 'How it works', 'The tagline, the heading and the three numbered steps. The steps’ labels and titles are also the rows beside the prices.', [
      // the standfirst, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      taglineField(),
      headingField(),
      itemsField('steps', 'Steps', 'step', 'The steps, top to bottom: the label on the left, the title and the text.'),
    ]),
    pageSection('pricing', 'Investment', 'The tagline, heading and standfirst over the three steps (the Method’s labels and titles), Before Revit’s card beside them, and the two panels under them, on to the Technology Blueprint and the Workflow Workshop. The looks and where the buttons lead stay in the site’s code.', [
      taglineField(),
      headingField(),
      leadField('Under the heading.'),
      {...itemsField('cards', 'Price cards', 'priceCard', 'Before Revit’s card (an included line written “Title — detail” shows the detail under the title), then the Workflow Workshop: its title, line under the title and button make the first panel under the prices (its price is not shown).'), options: FIXED},
      defineField({name: 'nextHeading', title: 'Line over the panels', type: 'string', description: 'Over the two panels under the prices, e.g. “Looking for something different?”'}),
      defineField({name: 'blueprintTitle', title: 'Blueprint panel title', type: 'string', description: 'The second panel under the prices, on to the Technology Blueprint.'}),
      defineField({name: 'blueprintText', title: 'Blueprint panel line', type: 'text', rows: 2}),
      buttonField('Links to the Technology Blueprint page.', 'blueprintButton', 'Blueprint panel button'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Before Revit page'})},
})
