import {defineField, defineType} from 'sanity'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {buttonField, headingField, itemsField, leadField, pageSection, quoteSection, sectionHead, taglineField, textField, stageDetailsField} from '../shared/fields'

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
    pageSection('hero', 'Opening', 'The opening, as the Workflow Workshop’s: the tagline and headline on the left, the standfirst and the two buttons on the panel on the right.', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField('The first button; it opens the booking calendar.'),
      linkField('The second button; it scrolls down to the Delivery section.'),
    ]),
    pageSection('benefits', 'Benefits', 'The heading and the three cards under the opening, set as the homepage’s “How we work” is, in its light version: each a number, a title and a paragraph, with a live drawing (a card’s small line is not shown here). The drawings stay in the site’s code.', [
      headingField('Centred over the cards, on two lines.'),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, top to bottom. In a card’s text, the word written between two pairs of asterisks (**visibility**) is set bold and scrambles once as it is read.'),
    ]),
    pageSection('examine', 'What we look at', 'The heading row, and the tabs with the panel each opens.', [
      ...sectionHead(),
      itemsField('tabs', 'Tabs', 'step', 'The tabs, in order: the name on the tab (Label), and its panel’s heading and text.'),
      // the single card the page showed before its tabs worked (2026-11-04);
      // kept so the code on main can still read it, hidden from the form
      {...taglineField('No longer shown.', 'cardTagline', 'Card tagline'), hidden: true},
      {...headingField('No longer shown.', 'cardHeading', 'Card heading'), hidden: true},
      {...textField('No longer shown.', 'cardText', 'Card text'), hidden: true},
    ]),
    pageSection('delivery', 'Delivery', 'The tagline, heading and button, and the four stages of the eight weeks on a timeline, each opening to tell more.', [
      taglineField(),
      headingField(),
      buttonField('Links to the Contact page.'),
      // the “Learn” link beside the button, no longer shown (2026-11-04);
      // kept so the code on main can still read it, hidden from the form
      {...linkField('No longer shown.'), hidden: true},
      itemsField('steps', 'Stages', 'step', 'The stages, in order: the weeks (Label), the title and the text. The photographs stay in the site’s code.'),
      stageDetailsField(),
    ]),
    // the page now shows the Home page's testimonials (2026-11-04); kept
    // so the code on main can still read it, hidden from the form
    {...quoteSection('The quote between the delivery steps and the enquiry, and who said it. The avatar placeholder stays in the code.'), hidden: true},
    pageSection('enquiry', 'Start here', 'The tagline, heading, standfirst and contact details beside the enquiry form, and the words on its button. The form’s fields and where the details link stay in the site’s code.', [
      taglineField(),
      headingField(),
      leadField('The line under the heading.'),
      defineField({name: 'email', title: 'Email address', type: 'string', description: 'As shown; the link it opens stays in the site’s code.'}),
      defineField({name: 'phone', title: 'Phone number', type: 'string', description: 'As shown; the link it opens stays in the site’s code.'}),
      defineField({name: 'address', title: 'Address', type: 'string'}),
      buttonField('The form’s submit button.'),
    ]),
    pageSection('faq', 'Answers', 'The heading and the questions, in order; all start closed.', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem', 'The questions and their answers, in order.'),
      defineField({name: 'footLine', title: 'Line under the questions', type: 'string', description: 'Over the Book a Free Call button.'}),
    ]),
  ],
  preview: {prepare: () => ({title: 'Technology Blueprint page'})},
})
