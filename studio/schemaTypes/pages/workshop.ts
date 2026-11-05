import {defineArrayMember, defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons/Presentation'
import {buttonField, headingField, itemsField, leadField, linesField, pageSection, sectionHead, stageDetailsField, taglineField, textField} from '../shared/fields'

/* The Workflow Workshop page, one section per part of the page, in the
   order the page shows them (src/pages/workshops-audits.astro; the page's
   own words in src/sanity/defaults/workshop.ts). The navigation, the
   footer and where every button leads stay in the site's code. The
   testimonials between the journey and the investment are the Home page's
   (its Testimonials section), shared with the homepage. A singleton
   with the fixed ID "workshopPage". */

// The two price cards are drawn by the page in two fixed places, with their
// own looks and buttons, so their list keeps its length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

// The document a folder opens, one per folder in the folders’ order: the
// page draws it on a sheet of paper (FolderDocument.astro), under the
// folder's own title
const folderDocument = defineArrayMember({
  type: 'object',
  name: 'folderDocument',
  title: 'Document',
  fields: [
    defineField({name: 'kicker', title: 'Line over the title', type: 'string'}),
    defineField({name: 'lede', title: 'In short', type: 'text', rows: 3, description: 'The summary under the title, between two rules.'}),
    linesField('body', 'Paragraphs', 'The body, one paragraph each. A line starting with “## ” is set as a heading.'),
    linesField('points', 'What you take away', 'The short list at the foot, one line each.'),
  ],
  preview: {select: {title: 'kicker', subtitle: 'lede'}},
})

export const workshopPage = defineType({
  name: 'workshopPage',
  title: 'Workflow Workshop page',
  type: 'document',
  icon: PresentationIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening on black: the headline, the standfirst and its two buttons on the left, the drawing held on the right while they scroll away and the statement comes up after them.', [
      taglineField('The name on the drawing’s platform.'),
      headingField(),
      leadField(),
      buttonField('Opens the Book a Call calendar.', 'primaryButton', 'First button label'),
      buttonField('Scrolls down to the pricing.', 'secondaryButton', 'Second button label'),
      textField('The statement that comes up as the opening’s words scroll away. One line here is one line on the page, all at one size: break the lines where a reader would pause.', 'statement', 'Statement', 3),
    ]),
    pageSection('symptoms', 'Does this sound like your practice?', 'The heading, the standfirst and the three cards naming the problems the workshop finds, each with its figure (the homepage problem cards’ design).', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title and a line of text each. The figures stay in the site’s code.'),
    ]),
    pageSection('method', 'Inside the Workshop', 'The heading, held on the left; the word on the right (Tagline); and the three numbered folders, each opening a document.', [
      // the line under the heading, no longer shown (2026-11-04); kept so
      // the code on main can still read it, hidden from the form
      {...leadField('No longer shown.'), hidden: true},
      taglineField(),
      headingField(),
      itemsField('tiles', 'Folders', 'tile', 'The three folders, top to bottom: the title and the line on the front of each.'),
      defineField({name: 'documents', title: 'Folder documents', type: 'array', description: 'What each folder opens, in the folders’ order.', of: [folderDocument]}),
    ]),
    pageSection('journey', 'Workshop Process', 'The heading and the line beside it, and the four stages on a timeline, from preparing to acting on the report.', [
      ...sectionHead('The line beside the heading.'),
      itemsField('steps', 'Stages', 'step', 'The stages, left to right: the name at the head of its column (Label), and the title and line in its block. The photographs stay in the site’s code.'),
      stageDetailsField('For each stage, in the same order: its timing under the name, and what its block tells when opened.'),
    ]),
    pageSection('pricing', 'Pricing', 'The heading, what the day holds, the workshop’s card, and the panel on to the Technology Blueprint under them. The looks and where the buttons lead stay in the site’s code.', [
      // the standfirst and the small tab over the heading, no longer shown
      // (2026-11-05); kept so the code on main can still read them
      {...leadField('No longer shown.'), hidden: true},
      {...taglineField('No longer shown.'), hidden: true},
      defineField({name: 'headingLead', title: 'Heading, first words', type: 'string', description: 'The heading’s first words, set a step quieter, e.g. “Half a day.”'}),
      headingField('The rest of the heading, e.g. “A clear place to start.”'),
      itemsField('tiles', 'Rows', 'tile', 'What the day holds, beside the workshop’s card: a title and a line of text each.'),
      {...itemsField('cards', 'Price cards', 'priceCard', 'The workshop’s card (an included line written “Title — detail” shows the detail under the title; the note sits at the card’s foot), then the Technology Blueprint: its title, line under the title and button make the panel under the prices.'), options: FIXED},
    ]),
    pageSection('faq', 'Common questions', 'The heading and the questions, in order (all start closed; their icons stay in the site’s code), and the line over Book a Free Call under them.', [
      // the small tab over the heading, no longer shown (2026-11-04); kept
      // so the code on main can still read it, hidden from the form
      {...taglineField('No longer shown.'), hidden: true},
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions and their answers, in order.'),
      defineField({name: 'footLine', title: 'Line under the questions', type: 'string', description: 'Over the Book a Free Call button.'}),
    ]),
    pageSection('closing', 'Closing call to action', 'The one button under the closing heading (the heading is the Home page’s, shared by every page). It leads to the Technology Blueprint page.', [
      buttonField('The button’s words.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Workflow Workshop page'})},
})
