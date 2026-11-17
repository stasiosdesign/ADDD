import {defineArrayMember, defineField, defineType} from 'sanity'
import {EditIcon} from '@sanity/icons/Edit'
import {buttonField, headingField, hrefField, imageField, itemsField, leadField, linesField, pageSection, seoSection, taglineField, textField} from '../shared/fields'

/* The Before Revit page, one section per part of the page, in the order the
   page shows them (src/pages/before-revit.astro; the page's own words in
   src/sanity/defaults/before-revit.ts). The navigation, the footer and
   where every button leads stay in the site's code. A singleton with the
   fixed ID "beforeRevitPage". Eight sections since 2026-11-05 (the second
   rebuild): every field the page showed before keeps its name and type, so
   the code on main still reads them. */

// The two price cards are drawn by the page in two fixed places, with their
// own looks and buttons, so their list keeps its length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const beforeRevitPage = defineType({
  name: 'beforeRevitPage',
  title: 'Before Revit page',
  type: 'document',
  icon: EditIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', 'The opening, on black: the label, the headline, the standfirst and the two buttons on the left over the practices’ marks, the drawing held on the right while they scroll away and the statement comes up after them.', [
      taglineField('The small label over the heading.'),
      // a text (it was a single line): a line break written in it is where
      // the heading's second line starts (the same value either way)
      textField('On two lines, both the same size: a line break written here is where the second line starts; without one, the second line takes the second half of the words.', 'heading', 'Heading', 2),
      leadField(),
      buttonField('Opens the Book a Call calendar.', 'primaryButton', 'First button label'),
      buttonField('Scrolls down to the method (How it works).', 'secondaryButton', 'Second button label'),
      textField('The statement that comes up on the left as the opening’s words scroll away, the drawing staying in place on the right. One line here is one line on the page, all at one size: break the lines where a reader would pause.', 'statement', 'Statement', 3),
      headingField('The drawing: the label on the frame that lands on the platform.', 'figureFrame', 'Drawing: frame label'),
      linesField('figureNote', 'Drawing: note', 'The note beside the drawing, one line per line.'),
      headingField('The drawing: the name on its platform.', 'figurePlatform', 'Drawing: platform'),
      linesField('figureTags', 'Drawing: tags', 'The tags round the platform, one per line.'),
      headingField('Over the row of practices at the foot of the opening.', 'trustLabel', 'Practices: label'),
      defineField({
        name: 'practices',
        title: 'Practices',
        type: 'array',
        description: 'The practices whose marks stand in the row, in order: four fit. Each is a client of the Home page’s logo strip.',
        of: [defineArrayMember({type: 'reference', to: [{type: 'client'}]})],
        options: {sortable: true},
      }),
    ]),
    pageSection('problem', 'The challenge', 'The tagline, heading and standfirst, and the three cards naming when early-stage design needs a rethink, each with its figure (the Workflow Workshop’s problem cards; the figures stay in the code).', [
      taglineField(),
      headingField(),
      leadField('Under the heading.'),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title and a line of text each.'),
    ]),
    pageSection('scope', 'The scope', 'The tagline, heading and standfirst, centred, over the focus areas as tabs (the Technology Blueprint’s What we look at; the icons stay in the code).', [
      taglineField(),
      headingField(),
      leadField('Under the heading.'),
      itemsField('areas', 'Focus areas', 'tile', 'The tabs, top to bottom: the area’s name on the tab (Title), and the line its panel shows (Text).'),
      headingField('At the foot of each area’s panel, after the area’s name.', 'panelLabel', 'Panel label'),
    ]),
    pageSection('method', 'The method', 'The standfirst, the tagline, the heading and the three numbered steps. The steps’ labels and titles are also the rows beside the prices.', [
      leadField('Beside the heading.'),
      taglineField(),
      headingField(),
      itemsField('steps', 'Steps', 'step', 'The steps, top to bottom: the label on the left, the title and the text.'),
    ]),
    pageSection('output', 'The output', 'The standfirst, tagline and heading, the deliverables as numbered cards on black (numbered by the page), and the line under them.', [
      leadField('Beside the heading.'),
      taglineField(),
      headingField(),
      itemsField('deliverables', 'Deliverables', 'tile', 'The cards, left to right: a title and a line of text each.'),
      textField('Under the cards, beside a red mark.', 'statement', 'Line under the cards', 2),
    ]),
    pageSection('why', 'Why ADDD', 'The tagline and heading, then the photograph beside the words: the standfirst, a paragraph and the two short points.', [
      taglineField(),
      headingField(),
      leadField('The first paragraph, set larger.'),
      textField('The second paragraph.'),
      itemsField('points', 'Points', 'tile', 'The short points under the words: a title and a line each.'),
      imageField('The photograph beside the words.'),
    ]),
    pageSection('pricing', 'Investment', 'The tagline, heading and standfirst over the three steps (the Method’s labels and titles), Before Revit’s card beside them, and the two panels under them, on to the Workflow Workshop and the Technology Blueprint, each with its question. The looks and where the buttons lead stay in the site’s code.', [
      taglineField(),
      headingField(),
      leadField('Under the heading.'),
      {...itemsField('cards', 'Price cards', 'priceCard', 'Before Revit’s card (the line under the button is “Line under the title”; the note sits at the card’s foot), then the Workflow Workshop: its badge (the question over it), title, line under the title and button make the first panel under the prices (its price is not shown).'), options: FIXED},
      // the line over both panels, no longer shown (2026-11-05: each panel
      // has its own question); kept so the code on main can still read it
      {...defineField({name: 'nextHeading', title: 'Line over the panels', type: 'string', description: 'No longer shown.'}), hidden: true},
      defineField({name: 'blueprintQuestion', title: 'Blueprint panel question', type: 'string', description: 'The small question over the second panel’s title.'}),
      defineField({name: 'blueprintTitle', title: 'Blueprint panel title', type: 'string', description: 'The second panel under the prices, on to the Technology Blueprint.'}),
      defineField({name: 'blueprintText', title: 'Blueprint panel line', type: 'text', rows: 2}),
      buttonField('Where it leads: Blueprint panel link.', 'blueprintButton', 'Blueprint panel button'),
      hrefField('Where the Technology Blueprint panel’s button leads.', 'blueprintHref', 'Blueprint panel link'),
    ]),
    pageSection('faq', 'Common questions', 'The tagline and heading, and the questions, in order (all start closed; their icons stay in the site’s code). Book a Free Call follows them.', [
      taglineField(),
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions and their answers, in order.'),
    ]),
    pageSection('closing', 'Closing call to action', 'The one button under the closing heading (the heading is the Home page’s, shared by every page). It opens the Book a Call calendar.', [
      buttonField('The button’s words.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Before Revit page'})},
})
