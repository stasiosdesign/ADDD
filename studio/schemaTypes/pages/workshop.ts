import {defineArrayMember, defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons/Presentation'
import {buttonField, headingField, hrefField, itemsField, leadField, linesField, pageSection, sectionHead, seoSection, stageDetailsField, stageItemsField, taglineField, textField, timelineField, timelineKeyFields} from '../shared/fields'

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
    defineField({name: 'lede', title: 'In short', type: 'text', rows: 3}),
    linesField('body', 'Paragraphs', '“## ” at the start makes a heading.'),
    linesField('points', 'What you take away'),
  ],
  preview: {select: {title: 'kicker', subtitle: 'lede'}},
})

export const workshopPage = defineType({
  name: 'workshopPage',
  title: 'Workflow Workshop page',
  type: 'document',
  icon: PresentationIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', '', [
      taglineField('Shown on the drawing.'),
      headingField(),
      leadField(),
      buttonField('Opens the booking calendar.', 'primaryButton', 'First button label'),
      buttonField('Scrolls to the pricing.', 'secondaryButton', 'Second button label'),
      textField('One line here is one line on the page.', 'statement', 'Statement', 3),
      headingField(undefined, 'figureFrame', 'Drawing: project label'),
      linesField('figureNote', 'Drawing: note'),
    ]),
    pageSection('symptoms', 'Does this sound like your practice?', '', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile'),
    ]),
    pageSection('method', 'Inside the Workshop', '', [
      // the line under the heading, no longer shown (2026-11-04); kept so
      // the code on main can still read it, hidden from the form
      {...leadField('No longer shown.'), hidden: true},
      taglineField(),
      headingField(),
      headingField('E.g. “Outcome” (Outcome N°01).', 'folderLabel', 'Folder label'),
      headingField(undefined, 'folderGo', 'Folder link words'),
      itemsField('tiles', 'Folders', 'folderCard'),
      headingField('E.g. “ADDD :: Workflow Workshop”.', 'series', 'Papers: series'),
      headingField(undefined, 'summaryLabel', 'Papers: summary label'),
      headingField(undefined, 'pointsLabel', 'Papers: list label'),
      defineField({name: 'documents', title: 'Folder documents', type: 'array', description: 'In the folders’ order.', of: [folderDocument]}),
    ]),
    pageSection('journey', 'Workshop Process', '', [
      ...sectionHead(),
      timelineField(),
      // the timeline is one field since 2026-11-17 (timelineField); the old
      // lists are kept so the code on main can still read them, hidden
      {...itemsField('steps', 'Stages', 'step', 'No longer shown.'), hidden: true},
      {...stageDetailsField('No longer shown.'), hidden: true},
      {...stageItemsField('No longer shown.'), hidden: true},
      ...timelineKeyFields(),
    ]),
    pageSection('pricing', 'Pricing', '', [
      // the standfirst and the small tab over the heading, no longer shown
      // (2026-11-05); kept so the code on main can still read them
      {...leadField('No longer shown.'), hidden: true},
      {...taglineField('No longer shown.'), hidden: true},
      defineField({name: 'headingLead', title: 'Heading, first words', type: 'string', description: 'E.g. “Half a day.”'}),
      headingField('E.g. “A clear place to start.”'),
      itemsField('tiles', 'Rows', 'tile'),
      {...itemsField('cards', 'Price cards', 'priceCard', '“Title — detail” adds a detail; the second card makes the Blueprint panel.'), options: FIXED},
    ]),
    pageSection('faq', 'Common questions', '', [
      // the small tab over the heading, no longer shown (2026-11-04); kept
      // so the code on main can still read it, hidden from the form
      {...taglineField('No longer shown.'), hidden: true},
      headingField(),
      itemsField('questions', 'Questions', 'faqItem'),
      defineField({name: 'footLine', title: 'Line under the questions', type: 'string'}),
    ]),
    pageSection('closing', 'Closing call to action', 'The heading is edited on the Home page.', [
      buttonField(),
      hrefField(undefined, 'buttonHref', 'Button link'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Workflow Workshop page'})},
})
