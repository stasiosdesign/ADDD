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
    pageSection('hero', 'Opening', '', [
      headingField(),
      leadField(),
      buttonField(undefined, 'primaryButton', 'First button label'),
      hrefField(undefined, 'primaryHref', 'First button link'),
      buttonField(undefined, 'secondaryButton', 'Second button label'),
      hrefField(undefined, 'secondaryHref', 'Second button link'),
    ]),
    pageSection('foundation', 'Foundation', '', [
      taglineField(),
      leadField(undefined, 'statement', 'Statement', 4),
      buttonField(undefined, 'primaryButton', 'First button label'),
      hrefField(undefined, 'primaryHref', 'First button link'),
      buttonField(undefined, 'secondaryButton', 'Second button label'),
      hrefField(undefined, 'secondaryHref', 'Second button link'),
    ]),
    pageSection('perspective', 'Perspective', '', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile'),
    ]),
    pageSection('validation', 'Validation', '', [
      taglineField(),
      headingField(),
      imageField(undefined, 'image1', 'Picture 1'),
      imageField(undefined, 'image2', 'Picture 2'),
      textField(),
      buttonField(),
      hrefField(undefined, 'buttonHref', 'Button link'),
    ]),
  ],
  preview: {prepare: () => ({title: 'About page'})},
})
