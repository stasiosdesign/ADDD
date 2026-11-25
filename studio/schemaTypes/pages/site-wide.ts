import {defineArrayMember, defineField} from 'sanity'
import {BlockItem} from '@stasiosdesign/sanity-cms'
import {buttonField, headingField, hrefField, imageField, linesField, linksField, pageSection, taglineField, textField} from '../shared/fields'

/* What every page shares (2026-11-16, when every field of the site was
   connected to Sanity): the navigation, the newsletter signup, the footer
   and the free call's booking dialog. Kept in the Home page document, as
   the closing call to action is, so a change here shows on every page; the
   site reads them once per request (siteDocument, src/sanity/content.ts),
   falling back to src/sanity/defaults/home.ts for any field left empty. */

/** A link with its words: the label and where it leads */
const linkObject = (name: string, title: string, description?: string) =>
  defineField({name, title, type: 'link', description, options: {collapsible: true, collapsed: false}})

/** A box of the Resources dropdown: its name, its line and where it leads */
const tileObject = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'object',
    description,
    options: {collapsible: true, collapsed: true},
    fields: [
      defineField({name: 'name', title: 'Name', type: 'string'}),
      textField(undefined, 'text', 'Line', 2),
      hrefField(),
    ],
  })

export const navSection = pageSection(
  'nav',
  'Navigation (every page)',
  '',
  [
    linkObject('partners', 'AEC Tech Partners link'),
    headingField(undefined, 'servicesLabel', 'Services button'),
    headingField(undefined, 'resourcesLabel', 'Resources button'),
    linksField('links', 'Links after the dropdowns'),
    linkObject('signIn', 'Sign in link'),
    linkObject('contact', 'Contact button'),
    defineField({
      name: 'services',
      title: 'Services dropdown',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navService',
          title: 'Service card',
          components: {item: BlockItem},
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', description: 'E.g. “Tech Blueprint”.'}),
            defineField({name: 'stem', title: 'Turning name: its start', type: 'string', description: 'The part that stays, e.g. “Work”.'}),
            linesField('words', 'Turning name: its endings', 'One per line; the first completes the name.'),
            linesField('lines', 'Text', 'Two lines, the first longer.'),
            hrefField('E.g. /advisory.'),
          ],
          preview: {select: {title: 'name', subtitle: 'href'}},
        }),
      ],
    }),
    tileObject('stacksTile', 'Free Tech Stacks box'),
    tileObject('databaseTile', 'Software Database box', 'Write ↗ after the name for an outside link.'),
    defineField({
      name: 'reportTile',
      title: 'Latest report box',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'name', title: 'Report title', type: 'string'}),
        defineField({name: 'label', title: 'Label', type: 'string', description: 'E.g. “Latest report”.'}),
        defineField({name: 'cta', title: 'Link words', type: 'string', description: 'E.g. “Read the report”.'}),
        hrefField('E.g. /reports/the-state-of-ai.'),
        imageField(),
      ],
    }),
    tileObject('reportsTile', 'Reports & Guides box'),
    tileObject('newsletterTile', 'Newsletter box'),
  ],
)

export const signupSection = pageSection(
  'signup',
  'Newsletter signup (every page)',
  '',
  [
    headingField('Placeholder text.', 'placeholder', 'Email box'),
    buttonField(),
    headingField(undefined, 'audienceQuestion', 'Audience question'),
    headingField(undefined, 'practiceOption', 'First choice'),
    headingField(undefined, 'vendorOption', 'Second choice'),
  ],
)

export const footerSection = pageSection(
  'footer',
  'Footer (every page)',
  'Write ↗ after a link’s words to mark an outside link.',
  [
    headingField(undefined, 'servicesTitle', 'First column title'),
    linksField('servicesLinks', 'First column links'),
    headingField(undefined, 'resourcesTitle', 'Second column title'),
    linksField('resourcesLinks', 'Second column links'),
    headingField(undefined, 'companyTitle', 'Third column title'),
    linksField('companyLinks', 'Third column links'),
    taglineField(undefined, 'signupTagline', 'Signup tagline'),
    headingField(undefined, 'signupHeading', 'Signup heading'),
    headingField(undefined, 'contactTitle', 'Contact title'),
    defineField({name: 'email', title: 'Email address', type: 'string', validation: (rule) => rule.email()}),
    defineField({name: 'phone', title: 'Telephone', type: 'string', description: 'E.g. +44 (0) 207 183 3675'}),
    headingField(undefined, 'callLabel', 'Call link words'),
    hrefField(undefined, 'callHref', 'Call link'),
    hrefField('', 'linkedin', 'LinkedIn'),
    hrefField('', 'instagram', 'Instagram'),
    hrefField('', 'youtube', 'YouTube'),
  ],
)

export const bookingSection = pageSection(
  'booking',
  'Free call booking (every page)',
  '',
  [
    hrefField('Calendly, Cal.com… Empty: shows the calendar below.', 'link', 'Booking page link'),
    buttonField(undefined, 'floatLabel', 'Floating button'),
    buttonField(undefined, 'faqLabel', 'Book a Free Call button'),
    imageField(undefined, 'photo', 'Portrait'),
    taglineField(undefined, 'label', 'Label'),
    headingField(undefined, 'title', 'Title'),
    textField(undefined, 'note', 'Note', 3),
    defineField({
      name: 'slots',
      title: 'Times',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bookingSlot',
          title: 'Time',
          components: {item: BlockItem},
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', description: 'E.g. “Morning”.'}),
            defineField({name: 'time', title: 'Hours', type: 'string', description: 'E.g. “10:00–12:00”.'}),
          ],
          preview: {select: {title: 'name', subtitle: 'time'}},
        }),
      ],
    }),
    headingField('Before a time is chosen.', 'summary', 'Prompt'),
    buttonField(),
    textField('After sending.', 'done', 'Thanks', 2),
  ],
)

/** The closing call to action's additions: where its button leads, and the software marks in its tiles */
export const closingCtaExtras = [
  hrefField('E.g. /stack-diagnostic.', 'primaryHref', 'Button link'),
  defineField({
    name: 'marks',
    title: 'Software marks',
    type: 'array',
    description: 'Square, on a transparent background.',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'ctaMark',
        title: 'Mark',
        fields: [imageField()],
        preview: {select: {media: 'image', title: 'image.alt'}, prepare: ({media, title}) => ({media, title: title || 'Mark'})},
      }),
    ],
  }),
]

