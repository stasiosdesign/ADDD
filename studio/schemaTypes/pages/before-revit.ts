import {defineType} from 'sanity'
import {EditIcon} from '@sanity/icons/Edit'
import {headingField, heroSection, itemsField, pageSection, sectionHead, taglineField} from '../shared/fields'

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
    heroSection('The opening: the tagline and headline on the left, the standfirst and its two buttons on the right.', 'Links to the Contact page.', 'Scrolls to the Investment section.'),
    pageSection('method', 'Method', 'The heading row and the three steps of the ADDD approach applied to early-stage design.', [
      ...sectionHead(),
      itemsField('steps', 'Steps', 'step', 'The steps, top to bottom: the label on the left, the title and the text.'),
    ]),
    pageSection('pricing', 'Investment', 'The tagline and heading, and the two price cards. The cards’ looks and where their buttons lead stay in the site’s code.', [
      taglineField(),
      headingField(),
      {...itemsField('cards', 'Price cards', 'priceCard', 'Before Revit on the left, the Workflow Workshop on the dark card on the right.'), options: FIXED},
    ]),
  ],
  preview: {prepare: () => ({title: 'Before Revit page'})},
})
