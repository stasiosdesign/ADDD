import {defineArrayMember, defineField, defineType} from 'sanity'
import {RocketIcon} from '@sanity/icons/Rocket'
import {buttonField, headingField, itemsField, leadField, linesField, pageSection, sectionHead, seoSection, stageItemsField, taglineField, textField, timelineField, timelineKeyFields} from '../shared/fields'

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
    defineField({name: 'folderMeta', title: 'Folder: beside the number', type: 'string', description: 'E.g. “Price on enquiry”.'}),
    defineField({name: 'folderKind', title: 'Folder: kind', type: 'string', description: 'E.g. “Story”.'}),
    linesField('folderCovers', 'Folder: on the sheet', 'The sheet inside the folder.'),
    defineField({name: 'kicker', title: 'Line over the title', type: 'string'}),
    defineField({name: 'lede', title: 'In short', type: 'text', rows: 3}),
    linesField('body', 'Paragraphs', '“## ” at the start makes a heading.'),
    linesField('points', 'What you receive', 'Empty: the card’s “What it includes”.'),
  ],
  preview: {select: {title: 'kicker', subtitle: 'lede'}},
})

export const techFirmsPage = defineType({
  name: 'techFirmsPage',
  title: 'AEC Tech Partners page',
  type: 'document',
  icon: RocketIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', '', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField('Opens the enquiry form.', 'primaryButton', 'First button label'),
      buttonField('Scrolls to the options.', 'secondaryButton', 'Second button label'),
      textField(undefined, 'statement', 'Statement', 3),
    ]),
    pageSection('why', 'Why ADDD', '', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile'),
      headingField(undefined, 'benefitsTitle', 'Benefits heading'),
      linesField('benefits', 'Benefits'),
      textField(undefined, 'note', 'Note', 3),
    ]),
    pageSection('routes', 'Objectives (no longer shown)', '', [
      itemsField('items', 'Objectives', 'tile'),
    ]),
    pageSection('services', 'Ways to work with ADDD', '', [
      taglineField(undefined, 'tagline', 'Heading'),
      linesField('statements', 'Statements', 'One per line; three reads best.'),
      itemsField('cards', 'Routes (no longer shown)', 'tile'),
    ]),
    pageSection('example', 'Episode format', '', [
      ...sectionHead(),
      itemsField('steps', 'Steps', 'step'),
    ]),
    pageSection('options', 'Partnership options', '', [
      // the standfirst, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      taglineField(),
      headingField(),
      itemsField('cards', 'Partnerships', 'priceCard', 'The first three folders.'),
      headingField('E.g. “Partnership” (Partnership N°01).', 'folderLabel', 'Folder label'),
      headingField(undefined, 'folderGo', 'Folder link words'),
      headingField('E.g. “ADDD :: AEC Tech Partners”.', 'series', 'Papers: series'),
      headingField(undefined, 'summaryLabel', 'Papers: summary label'),
      headingField(undefined, 'audienceLabel', 'Papers: audience label'),
      headingField(undefined, 'pricingLabel', 'Papers: pricing label'),
      headingField('Same for every partnership.', 'pricingValue', 'Papers: price'),
      headingField(undefined, 'termsLabel', 'Papers: terms label'),
      headingField('Unless a card has its own List label.', 'pointsLabel', 'Papers: list label'),
      buttonField('Unless a card has its own.', 'ctaLabel', 'Papers: button'),
    ]),
    pageSection('more', 'Smaller placements', 'The last two folders.', [
      {...headingField('No longer shown.'), hidden: true},
      itemsField('cards', 'Placements', 'priceCard'),
    ]),
    pageSection('documents', 'Partnership papers', 'One per folder, in order.', [
      defineField({name: 'items', title: 'Papers', type: 'array', of: [partnerDocument]}),
    ]),
    pageSection('process', 'Process and independence', '', [
      ...sectionHead(),
      timelineField(),
      // the timeline is one field since 2026-11-17 (timelineField); the old
      // lists are kept so the code on main can still read them, hidden
      {...itemsField('tiles', 'Steps', 'tile', 'No longer shown.'), hidden: true},
      {...linesField('phases', 'Phases', 'No longer shown.'), hidden: true},
      headingField(undefined, 'measurementTitle', 'Measurement heading'),
      textField('For promotional partnerships.', 'measurement', 'Measurement'),
      textField(undefined, 'intelligenceMeasurement', 'Intelligence measurement', 3),
      headingField(undefined, 'independenceTitle', 'Independence heading'),
      linesField('independence', 'Independence statement'),
      {...stageItemsField('No longer shown.'), hidden: true},
      ...timelineKeyFields(),
    ]),
    pageSection('closingCta', 'Closing call to action', 'Only on this page.', [
      // the label on the left, no longer shown (2026-11-04); kept so the
      // code on main can still read it, hidden from the form
      {...taglineField('No longer shown.', 'label', 'Label'), hidden: true},
      headingField(),
      leadField(),
      buttonField('Opens the enquiry form.', 'primaryButton', 'First button label'),
      buttonField('Scrolls to the options.', 'secondaryButton', 'Second button label'),
    ]),
    // The four cards the page showed before its redesign, kept so the code
    // on main can still read them; hidden from the form.
    defineField({...pageSection('opportunities', 'Opportunities (retired)', 'No longer shown.', [itemsField('items', 'Opportunities', 'tile')]), hidden: true}),
  ],
  preview: {prepare: () => ({title: 'AEC Tech Partners page'})},
})
