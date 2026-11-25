import {defineField, defineType} from 'sanity'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {buttonField, headingField, hrefField, itemsField, leadField, pageSection, quoteSection, sectionHead, seoSection, stageItemsField, taglineField, textField, stageDetailsField, timelineField, timelineKeyFields} from '../shared/fields'

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
    seoSection(),
    pageSection('hero', 'Opening', '', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField('Opens the booking calendar.'),
      linkField('Scrolls to Delivery.'),
      textField('One line here is one line on the page.', 'statement', 'Statement', 3),
    ]),
    pageSection('benefits', 'Benefits', '', [
      headingField(),
      headingField(undefined, 'note', 'Note under the heading'),
      itemsField('tiles', 'Cards', 'tile', '**word** in a card’s text is set bold.'),
    ]),
    pageSection('examine', 'What we look at', '', [
      ...sectionHead(),
      itemsField('tabs', 'Tabs', 'step', 'Label on the tab, Title and Text in its panel.'),
      headingField(undefined, 'panelLabel', 'Panel label'),
      // the single card the page showed before its tabs worked (2026-11-04);
      // kept so the code on main can still read it, hidden from the form
      {...taglineField('No longer shown.', 'cardTagline', 'Card tagline'), hidden: true},
      {...headingField('No longer shown.', 'cardHeading', 'Card heading'), hidden: true},
      {...textField('No longer shown.', 'cardText', 'Card text'), hidden: true},
    ]),
    pageSection('delivery', 'Delivery', '', [
      taglineField(),
      headingField(),
      buttonField(),
      hrefField(undefined, 'buttonHref', 'Button link'),
      // the “Learn” link beside the button, no longer shown (2026-11-04);
      // kept so the code on main can still read it, hidden from the form
      {...linkField('No longer shown.'), hidden: true},
      timelineField(),
      // the timeline is one field since 2026-11-17 (timelineField); the old
      // lists are kept so the code on main can still read them, hidden
      {...itemsField('steps', 'Stages', 'step', 'No longer shown.'), hidden: true},
      {...stageDetailsField('No longer shown.'), hidden: true},
      {...stageItemsField('No longer shown.'), hidden: true},
      ...timelineKeyFields(),
    ]),
    // the page now shows the Home page's testimonials (2026-11-04); kept
    // so the code on main can still read it, hidden from the form
    {...quoteSection('The quote between the delivery steps and the enquiry, and who said it. The avatar placeholder stays in the code.'), hidden: true},
    pageSection('enquiry', 'Start here', '', [
      taglineField(),
      headingField(),
      leadField(),
      defineField({name: 'email', title: 'Email address', type: 'string'}),
      defineField({name: 'phone', title: 'Phone number', type: 'string', description: 'E.g. +44 (0) 207 183 3675'}),
      defineField({name: 'address', title: 'Address', type: 'string'}),
      headingField(undefined, 'nameLabel', 'Form: name label'),
      headingField(undefined, 'emailLabel', 'Form: email label'),
      headingField(undefined, 'messageLabel', 'Form: message label'),
      headingField('Placeholder text.', 'messagePlaceholder', 'Form: message prompt'),
      headingField(undefined, 'consent', 'Form: consent'),
      buttonField(),
    ]),
    pageSection('faq', 'Answers', '', [
      headingField(),
      itemsField('questions', 'Questions', 'faqItem'),
      defineField({name: 'footLine', title: 'Line under the questions', type: 'string'}),
    ]),
  ],
  preview: {prepare: () => ({title: 'Technology Blueprint page'})},
})
