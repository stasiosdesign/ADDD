import {defineArrayMember, defineField, defineType} from 'sanity'
import {RocketIcon} from '@sanity/icons/Rocket'
import {buttonField, headingField, itemsField, leadField, linesField, pageSection, sectionHead, taglineField, textField} from '../shared/fields'

/* The AEC Tech Partners page, one section per part of the page, in the
   order the page shows them (src/pages/tech-firms.astro; the page's own
   words in src/sanity/defaults/tech-firms.ts). The hero's pattern, the
   cards' colours and crops, and where every button leads stay in the site's
   code. A singleton with the fixed ID "techFirmsPage". */
// What each partnership's folder opens (2026-11-05), one per folder in the
// folders' order (the three partnerships, then the two smaller placements):
// the page draws it on a sheet of paper (FolderDocument.astro) under the
// folder's own title, with the card's who it suits, price and terms
const partnerDocument = defineArrayMember({
  type: 'object',
  name: 'partnerDocument',
  title: 'Document',
  fields: [
    defineField({name: 'kicker', title: 'Line over the title', type: 'string'}),
    defineField({name: 'lede', title: 'In short', type: 'text', rows: 3, description: 'The summary under the title, between two rules.'}),
    linesField('body', 'Paragraphs', 'The body, one paragraph each. A line starting with “## ” is set as a heading.'),
    linesField('points', 'What you receive', 'The short list at the foot, one line each. Left empty, the card’s own list (What it includes) is shown.'),
  ],
  preview: {select: {title: 'kicker', subtitle: 'lede'}},
})

export const techFirmsPage = defineType({
  name: 'techFirmsPage',
  title: 'AEC Tech Partners page',
  type: 'document',
  icon: RocketIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening on the ink: the tagline, the headline, the standfirst and its two buttons, over the plates, which are held while the page scrolls the words away and brings the statement up. The plates stay in the code.', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField('Opens the enquiry form, set to AEC Tech Partners.', 'primaryButton', 'First button label'),
      buttonField('Scrolls down to the partnership options.', 'secondaryButton', 'Second button label'),
      textField('The positioning statement that rises into the middle of the opening as its words go, at the size of the homepage’s statement.', 'statement', 'Statement', 3),
    ]),
    pageSection('why', 'Why ADDD', 'The heading row, the three cards on what ADDD does, and what that gives a technology company.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: the number, the title and the text.'),
      headingField('The heading beside the list of benefits.', 'benefitsTitle', 'Benefits heading'),
      linesField('benefits', 'Benefits', 'One line per benefit.'),
      textField('The note under the benefits, separating practice clients, content participants and sponsors.', 'note', 'Note', 3),
    ]),
    pageSection('routes', 'Objectives (no longer shown)', 'Not shown on the page since 2026-11-04: the three cards said again what Ways to work with ADDD says. Kept while the live site still reads them.', [
      itemsField('items', 'Objectives', 'tile', 'The three cards, in order: the title, the text, the link label and the picture. There are always three.'),
    ]),
    pageSection('services', 'Ways to work with ADDD', 'The heading over the blue panel that takes its statements in turn as the page scrolls, one large statement at a time, each with its number under it. The drawings beside them stay in the code, by position.', [
      taglineField('The heading over the panel.', 'tagline', 'Heading'),
      linesField('statements', 'Statements', 'One statement per line, in order: each is shown on its own in the panel, large, with nothing else. Three reads best.'),
      itemsField('cards', 'Routes (no longer shown)', 'tile', 'The four routes the panel used to take in turn. No longer shown on this page; kept while the live site still reads them.'),
    ]),
    pageSection('example', 'Episode format', 'The heading row and the steps of a featured workflow episode, labelled as an illustrative format.', [
      ...sectionHead(),
      itemsField('steps', 'Steps', 'step', 'One step per row: the small label, the title and the text.'),
    ]),
    pageSection('options', 'Partnership options', 'The heading, held beside the five partnerships as folders (the three here, then the two smaller placements below), each opening its paper. The folders’ looks and where each paper’s button leads stay in the code: the enquiry form, carrying the partnership’s title.', [
      // the standfirst, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      taglineField('The small word held on the right of the folders.'),
      headingField(),
      itemsField('cards', 'Partnerships', 'priceCard', 'The first three folders: main channel sponsorship, featured workflow episode, practice intelligence. On the folder: the title, the line under it (Line under the title) and the price; in its paper: who it suits, the price, the note and conditions as its terms, what you receive, and the button.'),
    ]),
    pageSection('more', 'Smaller placements', 'The last two folders, after the three partnerships: newsletter placement, event coverage.', [
      {...headingField('No longer shown.'), hidden: true},
      itemsField('cards', 'Placements', 'priceCard', 'The two cards: newsletter placement, event coverage.'),
    ]),
    pageSection('documents', 'Partnership papers', 'What each of the five folders opens, in order.', [
      defineField({name: 'items', title: 'Papers', type: 'array', of: [partnerDocument]}),
    ]),
    pageSection('process', 'Process and independence', 'The four steps of a partnership on a timeline, how success is measured, and the editorial independence statement.', [
      ...sectionHead(),
      itemsField('tiles', 'Steps', 'tile', 'The four steps, in order: each a box on the timeline, its title on the box and its text when it opens.'),
      linesField('phases', 'Phases', 'The names across the top of the timeline, one per line, one for each step, in order.'),
      headingField('The heading over how success is measured.', 'measurementTitle', 'Measurement heading'),
      textField('How promotional partnerships are measured.', 'measurement', 'Measurement'),
      textField('How practice intelligence is measured.', 'intelligenceMeasurement', 'Intelligence measurement', 3),
      headingField('The heading over the independence statement.', 'independenceTitle', 'Independence heading'),
      linesField('independence', 'Independence statement', 'One line per commitment.'),
    ]),
    pageSection('closingCta', 'Closing call to action', 'The block that ends this page, for technology companies: this page has its own, apart from the one the other pages share.', [
      // the label on the left, no longer shown (2026-11-04); kept so the
      // code on main can still read it, hidden from the form
      {...taglineField('No longer shown.', 'label', 'Label'), hidden: true},
      headingField(),
      leadField('The line under the heading.'),
      buttonField('Opens the enquiry form, set to AEC Tech Partners.', 'primaryButton', 'First button label'),
      buttonField('Scrolls up to the partnership options.', 'secondaryButton', 'Second button label'),
    ]),
    // The four cards the page showed before its redesign, kept so the code
    // on main can still read them; hidden from the form.
    defineField({...pageSection('opportunities', 'Opportunities (retired)', 'No longer shown.', [itemsField('items', 'Opportunities', 'tile')]), hidden: true}),
  ],
  preview: {prepare: () => ({title: 'AEC Tech Partners page'})},
})
