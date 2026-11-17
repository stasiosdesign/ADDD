import {defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'
import {buttonField, headingField, hrefField, imageField, itemsField, leadField, pageSection, sectionHead, taglineField, textField, seoSection} from '../shared/fields'

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
    seoSection(),
    pageSection('hero', 'Opening', 'The opening: the headline on the left, the paragraph and its two buttons on the right.', [
      headingField('The headline.'),
      leadField('The paragraph beside the headline.'),
      buttonField('Where it leads: First button link.', 'primaryButton', 'First button label'),
      hrefField('Where the first button leads.', 'primaryHref', 'First button link'),
      buttonField('Where it leads: Second button link.', 'secondaryButton', 'Second button label'),
      hrefField('Where the second button leads.', 'secondaryHref', 'Second button link'),
    ]),
    pageSection('foundation', 'Foundation', 'The tagline, the statement under it and the two buttons beneath.', [
      taglineField(),
      leadField('The statement.', 'statement', 'Statement', 4),
      buttonField('Where it leads: First button link.', 'primaryButton', 'First button label'),
      hrefField('Where the first button leads.', 'primaryHref', 'First button link'),
      buttonField('Where it leads: Second button link.', 'secondaryButton', 'Second button label'),
      hrefField('Where the second button leads.', 'secondaryHref', 'Second button link'),
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
      buttonField('Where it leads: Button link.'),
      hrefField('Where the button leads.', 'buttonHref', 'Button link'),
    ]),
  ],
  preview: {prepare: () => ({title: 'About page'})},
})
