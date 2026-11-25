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
    pageSection('hero', 'Opening', '', [
      taglineField(),
      // a text (it was a single line): a line break written in it is where
      // the heading's second line starts (the same value either way)
      textField('A line break starts line two.', 'heading', 'Heading', 2),
      leadField(),
      buttonField('Opens the booking calendar.', 'primaryButton', 'First button label'),
      buttonField('Scrolls to the method.', 'secondaryButton', 'Second button label'),
      textField('One line here is one line on the page.', 'statement', 'Statement', 3),
      headingField(undefined, 'figureFrame', 'Drawing: frame label'),
      linesField('figureNote', 'Drawing: note'),
      headingField(undefined, 'figurePlatform', 'Drawing: platform'),
      linesField('figureTags', 'Drawing: tags'),
      headingField(undefined, 'trustLabel', 'Practices: label'),
      defineField({
        name: 'practices',
        title: 'Practices',
        type: 'array',
        description: 'Four fit.',
        of: [defineArrayMember({type: 'reference', to: [{type: 'client'}]})],
        options: {sortable: true},
      }),
    ]),
    pageSection('problem', 'The challenge', '', [
      taglineField(),
      headingField(),
      leadField(),
      itemsField('tiles', 'Cards', 'tile'),
    ]),
    pageSection('scope', 'The scope', '', [
      taglineField(),
      headingField(),
      leadField(),
      itemsField('areas', 'Focus areas', 'tile', 'Title on the tab, Text in its panel.'),
      headingField(undefined, 'panelLabel', 'Panel label'),
    ]),
    pageSection('method', 'The method', '', [
      leadField(),
      taglineField(),
      headingField(),
      itemsField('steps', 'Steps', 'step'),
    ]),
    pageSection('output', 'The output', '', [
      leadField(),
      taglineField(),
      headingField(),
      itemsField('deliverables', 'Deliverables', 'tile'),
      textField(undefined, 'statement', 'Line under the cards', 2),
    ]),
    pageSection('why', 'Why ADDD', '', [
      taglineField(),
      headingField(),
      leadField(),
      textField(),
      itemsField('points', 'Points', 'tile'),
      imageField(),
    ]),
    pageSection('pricing', 'Investment', '', [
      taglineField(),
      headingField(),
      leadField(),
      {...itemsField('cards', 'Price cards', 'priceCard', 'The second card makes the Workflow Workshop panel.'), options: FIXED},
      // the line over both panels, no longer shown (2026-11-05: each panel
      // has its own question); kept so the code on main can still read it
      {...defineField({name: 'nextHeading', title: 'Line over the panels', type: 'string', description: 'No longer shown.'}), hidden: true},
      defineField({name: 'blueprintQuestion', title: 'Blueprint panel question', type: 'string'}),
      defineField({name: 'blueprintTitle', title: 'Blueprint panel title', type: 'string'}),
      defineField({name: 'blueprintText', title: 'Blueprint panel line', type: 'text', rows: 2}),
      buttonField(undefined, 'blueprintButton', 'Blueprint panel button'),
      hrefField(undefined, 'blueprintHref', 'Blueprint panel link'),
    ]),
    pageSection('faq', 'Common questions', '', [
      taglineField(),
      headingField(),
      itemsField('questions', 'Questions', 'faqItem'),
    ]),
    pageSection('closing', 'Closing call to action', 'The heading is edited on the Home page.', [
      buttonField('Opens the booking calendar.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Before Revit page'})},
})
