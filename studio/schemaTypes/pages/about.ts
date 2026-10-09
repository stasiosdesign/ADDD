import {defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'
import {buttonField, headingField, imageField, itemsField, leadField, pageSection, sectionHead, taglineField, textField} from '../shared/fields'

/* The About page, one section per part of the page, in the order the page
   shows them (src/pages/about.astro; the page's own words in
   src/sanity/defaults/about.ts). Where every button and card link leads
   stays in the site's code. A singleton with the fixed ID "aboutPage". */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: UserIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening: the headline on the left, the paragraph and its two buttons on the right.', [
      headingField('The headline.'),
      leadField('The paragraph beside the headline.'),
      buttonField('Links to the Contact page.', 'primaryButton', 'First button label'),
      buttonField('Links to the Technology Blueprint page.', 'secondaryButton', 'Second button label'),
    ]),
    pageSection('foundation', 'Foundation', 'The tagline, the statement under it and the two buttons beneath.', [
      taglineField(),
      leadField('The statement.', 'statement', 'Statement', 4),
      buttonField('Links to the Workflow Workshop page.', 'primaryButton', 'First button label'),
      buttonField('Links to the Reports page.', 'secondaryButton', 'Second button label'),
    ]),
    pageSection('perspective', 'Perspective', 'The heading row and the three cards under it. Where each card’s link leads stays in the code.', [
      ...sectionHead('The standfirst on the left.'),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: the title, the text and the words of the link at the foot; where each link leads stays in the code.'),
    ]),
    pageSection('validation', 'Validation', 'The tagline and heading, the two picture slots, and the paragraph with its button beside them.', [
      taglineField(),
      headingField(),
      imageField('The first of the two pictures.', 'image1', 'Picture 1'),
      imageField('The second of the two pictures.', 'image2', 'Picture 2'),
      textField('The paragraph.'),
      buttonField('Links to the Reports page.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'About page'})},
})
