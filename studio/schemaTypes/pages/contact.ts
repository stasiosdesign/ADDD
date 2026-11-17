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
    pageSection('hero', 'Opening', 'The page’s headings, the email and phone on the pass, and the words on the form’s button.', [
      taglineField(),
      headingField(),
      leadField('The line under the heading.'),
      headingField('For screen readers: the heading over Allister’s details.', 'contactHeading', 'Details heading (hidden)'),
      headingField('For screen readers: the heading over the form.', 'formHeading', 'Form heading (hidden)'),
      headingField('Shown on the pass and linked as an email; the form’s messages name it too.', 'email', 'Email'),
      headingField('Shown on the pass, e.g. “+44 (0) 207 183 3675”; the link dials it without the (0) and the spaces.', 'phone', 'Phone'),
      headingField('The address, on one line.', 'address', 'Address'),
      buttonField('The form’s submit button.', 'button', 'Button label'),
    ]),
    pageSection('pass', 'The pass', 'The printed card on the lanyard: its label (the year beside it is the current one), Allister’s portrait, name and role, and the labels over his email and telephone.', [
      headingField('At the top of the card.', 'label', 'Label'),
      imageField('Upright, about 4 by 5.', 'portrait', 'Portrait'),
      headingField(undefined, 'name', 'Name'),
      headingField(undefined, 'role', 'Role'),
      headingField('Over the email address.', 'emailLabel', 'Email label'),
      headingField('Over the phone number.', 'phoneLabel', 'Phone label'),
    ]),
    pageSection('form', 'The enquiry form', 'Each field’s label, the words in it before anything is typed and what it says when it is missed; what an enquiry can be about; and the messages the form gives. In a message, {n} is a number and {email} the address on the pass.', [
      headingField(undefined, 'nameLabel', 'Name: label'),
      headingField(undefined, 'namePlaceholder', 'Name: prompt'),
      headingField(undefined, 'nameError', 'Name: when missed'),
      headingField(undefined, 'emailLabel', 'Email: label'),
      headingField(undefined, 'emailPlaceholder', 'Email: prompt'),
      headingField(undefined, 'emailError', 'Email: when missed'),
      headingField(undefined, 'topicLabel', 'Topic: label'),
      headingField('Shown until a topic is chosen.', 'topicPlaceholder', 'Topic: prompt'),
      linesField('topics', 'Topics', 'What an enquiry can be about, one per line, in order. Keep the AEC Tech Partners topic (below) among them: that page’s buttons choose it.'),
      headingField(undefined, 'topicError', 'Topic: when missed'),
      headingField(undefined, 'messageLabel', 'Message: label'),
      headingField(undefined, 'messagePlaceholder', 'Message: prompt'),
      headingField(undefined, 'messageError', 'Message: when missed'),
      headingField('When one field is missed.', 'oneError', 'One field missed'),
      headingField('When more are, e.g. “{n} fields need your attention.”', 'manyErrors', 'Fields missed'),
      textField('While the form is not connected to a service.', 'notConnected', 'Not connected yet', 2),
      headingField('While an enquiry is being sent.', 'sending', 'Sending'),
      textField('Once it is sent.', 'sent', 'Sent', 2),
      textField('If sending fails.', 'failed', 'Not sent', 2),
      headingField('The topic chosen when the form is reached from an AEC Tech Partners button: one of the topics above, exactly.', 'partnerTopic', 'AEC Tech Partners topic'),
      textField('The message’s opening line, reached from a partnership button in general.', 'partnerMessage', 'Partnership message', 2),
      textField('Reached from a named partnership’s button: {offer} is its name.', 'offerMessage', 'Named partnership message', 2),
    ]),
  ],
  preview: {prepare: () => ({title: 'Contact page'})},
})
