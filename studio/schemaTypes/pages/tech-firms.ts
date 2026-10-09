import {defineType} from 'sanity'
import {RocketIcon} from '@sanity/icons/Rocket'
import {buttonField, headingField, heroSection, itemsField, pageSection, taglineField} from '../shared/fields'

/* The For AEC Tech Firms page, one section per part of the page, in the
   order the page shows them (src/pages/tech-firms.astro; the page's own
   words in src/sanity/defaults/tech-firms.ts). The hero's pattern, the
   cards' colours and crops, and where every button leads stay in the site's
   code. A singleton with the fixed ID "techFirmsPage". */
export const techFirmsPage = defineType({
  name: 'techFirmsPage',
  title: 'For AEC Tech Firms page',
  type: 'document',
  icon: RocketIcon,
  fields: [
    heroSection('The opening: the standfirst and tagline, the headline and its two buttons beside the pattern. The pattern stays in the code.', 'Links to the Contact page.', 'Opens an email asking for the fee sheet.'),
    pageSection('opportunities', 'Opportunities', 'The four cards that pin in turn as the page scrolls. Each card’s colour and the crop of its picture stay in the code, by position.', [
      itemsField('items', 'Opportunities', 'tile', 'The four cards, in order: the title, the text and the picture. There are always four; their colours stay in the code.'),
    ]),
    pageSection('closingCta', 'Closing call to action', 'The block that ends this page, for technology companies: this page has its own, apart from the one the other pages share.', [
      taglineField('The small label on the left.', 'label', 'Label'),
      headingField(),
      buttonField('Links to the Contact page.', 'primaryButton', 'First button label'),
      buttonField('Opens an email asking for the fee sheet.', 'secondaryButton', 'Second button label'),
    ]),
  ],
  preview: {prepare: () => ({title: 'For AEC Tech Firms page'})},
})
