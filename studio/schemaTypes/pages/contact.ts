import {defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {buttonField, headingField, imageField, leadField, linesField, pageSection, taglineField, seoSection, textField} from '../shared/fields'

/* The Contact page (src/pages/contact.astro; the page's own words in
   src/sanity/defaults/contact.ts): Allister's details on the pass on the
   lanyard, and the enquiry form beside it, its labels, prompts, topics and
   messages (all in the Studio since 2026-11-16). The pass's button is the
   free call's (the Home page's Free call booking section). A singleton with
   the fixed ID "contactPage". */
export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', '', [
      taglineField(),
      headingField(),
      leadField(),
      headingField('Hidden; for screen readers.', 'contactHeading', 'Details heading (hidden)'),
      headingField('Hidden; for screen readers.', 'formHeading', 'Form heading (hidden)'),
      headingField(undefined, 'email', 'Email'),
      headingField('E.g. +44 (0) 207 183 3675', 'phone', 'Phone'),
      headingField('On one line.', 'address', 'Address'),
      buttonField(undefined, 'button', 'Button label'),
    ]),
    pageSection('pass', 'The pass', '', [
      headingField(undefined, 'label', 'Label'),
      imageField('Upright, 4:5.', 'portrait', 'Portrait'),
      headingField(undefined, 'name', 'Name'),
      headingField(undefined, 'role', 'Role'),
      headingField(undefined, 'emailLabel', 'Email label'),
      headingField(undefined, 'phoneLabel', 'Phone label'),
    ]),
    pageSection('form', 'The enquiry form', '{n} is a number, {email} the pass’s email.', [
      headingField(undefined, 'nameLabel', 'Name: label'),
      headingField(undefined, 'namePlaceholder', 'Name: prompt'),
      headingField(undefined, 'nameError', 'Name: when missed'),
      headingField(undefined, 'emailLabel', 'Email: label'),
      headingField(undefined, 'emailPlaceholder', 'Email: prompt'),
      headingField(undefined, 'emailError', 'Email: when missed'),
      headingField(undefined, 'topicLabel', 'Topic: label'),
      headingField('Placeholder text.', 'topicPlaceholder', 'Topic: prompt'),
      linesField('topics', 'Topics', 'Must include the AEC Tech Partners topic.'),
      headingField(undefined, 'topicError', 'Topic: when missed'),
      headingField(undefined, 'messageLabel', 'Message: label'),
      headingField(undefined, 'messagePlaceholder', 'Message: prompt'),
      headingField(undefined, 'messageError', 'Message: when missed'),
      headingField(undefined, 'oneError', 'One field missed'),
      headingField('E.g. “{n} fields need your attention.”', 'manyErrors', 'Fields missed'),
      textField(undefined, 'notConnected', 'Not connected yet', 2),
      headingField(undefined, 'sending', 'Sending'),
      textField(undefined, 'sent', 'Sent', 2),
      textField(undefined, 'failed', 'Not sent', 2),
      headingField('Must match one of the topics exactly.', 'partnerTopic', 'AEC Tech Partners topic'),
      textField('Opening line from a partnership button.', 'partnerMessage', 'Partnership message', 2),
      textField('{offer} is the partnership’s name.', 'offerMessage', 'Named partnership message', 2),
    ]),
  ],
  preview: {prepare: () => ({title: 'Contact page'})},
})
