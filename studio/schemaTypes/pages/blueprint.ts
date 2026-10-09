import {defineField, defineType} from 'sanity'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {buttonField, headingField, itemsField, leadField, pageSection, sectionHead, taglineField, textField} from '../shared/fields'

/* The Technology Blueprint page, one section per part of the page, in the
   order the page shows them (src/pages/technology-blueprint.astro; the
   page's own words in src/sanity/defaults/blueprint.ts). The navigation,
   the footer, the filter buttons, the enquiry form's inputs and where every
   button and link leads stay in the site's code. A singleton with the fixed
   ID "blueprintPage". */

/** A text link beside a button; where it leads stays in the site's code. */
const linkField = (description: string) => defineField({name: 'linkLabel', title: 'Link label', type: 'string', description})

export const blueprintPage = defineType({
  name: 'blueprintPage',
  title: 'Technology Blueprint page',
  type: 'document',
  icon: BlockElementIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening: the tagline and headline on the left, the standfirst, its button and the text link on the right.', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField('Links to the Contact page.'),
      linkField('The text link beside the button; it scrolls to the Delivery section.'),
    ]),
    pageSection('benefits', 'Benefits', 'The three cards under the opening, each with a number, a picture slot, a small line, a title and a paragraph.', [
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right.'),
    ]),
    pageSection('examine', 'What we look at', 'The heading row and the card under the filter buttons. The buttons themselves stay in the site’s code.', [
      ...sectionHead(),
      taglineField('The small line at the top of the card.', 'cardTagline', 'Card tagline'),
      headingField('The card’s heading.', 'cardHeading', 'Card heading'),
      textField('The card’s text.', 'cardText', 'Card text'),
    ]),
    pageSection('delivery', 'Delivery', 'The tagline, heading, button and text link, and the four steps of the eight weeks.', [
      taglineField(),
      headingField(),
      buttonField('Links to the Contact page.'),
      linkField('The text link beside the button; it links to the About page.'),
      itemsField('steps', 'Steps', 'step', 'The steps, top to bottom: the week on the left, the title and the text.'),
    ]),
    defineField({name: 'quote', title: 'Quote', type: 'quote', description: 'The quote between the delivery steps and the enquiry, and who said it. The avatar placeholder stays in the code.'}),
    pageSection('enquiry', 'Start here', 'The tagline, heading, standfirst and contact details beside the enquiry form, and the words on its button. The form’s fields and where the details link stay in the site’s code.', [
      taglineField(),
      headingField(),
      leadField('The line under the heading.'),
      defineField({name: 'email', title: 'Email address', type: 'string', description: 'As shown; the link it opens stays in the site’s code.'}),
      defineField({name: 'phone', title: 'Phone number', type: 'string', description: 'As shown; the link it opens stays in the site’s code.'}),
      defineField({name: 'address', title: 'Address', type: 'string'}),
      buttonField('The form’s submit button.'),
    ]),
    pageSection('faq', 'Answers', 'The heading and the questions, in order; the first starts open.', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions and their answers, in order.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Technology Blueprint page'})},
})
