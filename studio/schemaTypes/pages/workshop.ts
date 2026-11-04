import {defineArrayMember, defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons/Presentation'
import {buttonField, headingField, heroSection, itemsField, leadField, linesField, pageSection, sectionHead, stageDetailsField, taglineField} from '../shared/fields'

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
    heroSection('The opening: the tagline (a small label) and the headline, large, on the left; the standfirst and its two buttons on the light panel on the right.', 'Opens the booking calendar (a demonstration for now).', 'Scrolls down to the Investment section.'),
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
    pageSection('pricing', 'Investment', 'The heading, what the day holds, and the two price cards. The cards’ looks and where their buttons lead stay in the site’s code.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'What the day holds, beside the workshop’s card: a title and a line of text each.'),
      {...itemsField('cards', 'Price cards', 'priceCard', 'The workshop’s card, then the Technology Blueprint’s across the page under it. A workshop line written “Title — detail” is set as two entries side by side.'), options: FIXED},
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
