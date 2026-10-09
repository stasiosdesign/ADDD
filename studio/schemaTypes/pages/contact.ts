import {defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {buttonField, headingField, leadField, pageSection, taglineField} from '../shared/fields'

/* The Contact page: one section, the words beside the form (src/pages/contact.astro;
   the page's own words in src/sanity/defaults/contact.ts). The form's fields,
   options and labels, and where the email and phone links lead, stay in the
   site's code. A singleton with the fixed ID "contactPage". */
export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    pageSection('hero', 'Opening', 'The tagline, heading and line of text, the email, phone and address under them, and the words on the form’s button. The form’s fields, options and labels stay in the code.', [
      taglineField(),
      headingField(),
      leadField('The line under the heading.'),
      headingField('The email address shown; the link it opens stays in the code.', 'email', 'Email'),
      headingField('The phone number shown; the link it opens stays in the code.', 'phone', 'Phone'),
      headingField('The address, on one line.', 'address', 'Address'),
      buttonField('The form’s submit button.', 'button', 'Button label'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Contact page'})},
})
