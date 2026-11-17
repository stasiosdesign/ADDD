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
const tileObject = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'object',
    description,
    options: {collapsible: true, collapsed: true},
    fields: [
      defineField({name: 'name', title: 'Name', type: 'string'}),
      textField('The line under the name.', 'text', 'Line', 2),
      hrefField(),
    ],
  })

export const navSection = pageSection(
  'nav',
  'Navigation (every page)',
  'The bar at the top of every page and its two dropdowns, Services and Resources. A link to another site opens in a new tab.',
  [
    linkObject('partners', 'AEC Tech Partners link', 'The first link in the bar.'),
    headingField('The Services dropdown’s button.', 'servicesLabel', 'Services button'),
    headingField('The Resources dropdown’s button.', 'resourcesLabel', 'Resources button'),
    linksField('links', 'Links after the dropdowns', 'The plain links after Services and Resources, in order: AEC Jobs, About. Add one for a new link in the bar.'),
    linkObject('signIn', 'Sign in link', 'The link before Contact, on the right.'),
    linkObject('contact', 'Contact button', 'The button at the bar’s right end (and beside the menu on phones).'),
    defineField({
      name: 'services',
      title: 'Services dropdown',
      type: 'array',
      description: 'The cards in the Services dropdown, in order, each a service. The cards’ patterns follow their places: the first is set on its line grid.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navService',
          title: 'Service card',
          components: {item: BlockItem},
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', description: 'The dropdown’s short name, e.g. “Tech Blueprint”.'}),
            defineField({name: 'stem', title: 'Turning name: its start', type: 'string', description: 'For a name whose end turns between words (Work·shop, Work·flow): the part that stays, e.g. “Work”. Leave empty for a name that stays still.'}),
            linesField('words', 'Turning name: its endings', 'The endings that take turns after the start, one per line, the first making the name itself (“shop”, then “flow”).'),
            linesField('lines', 'Text', 'The line under the name, set as two lines by hand: one per line here, the first the longer.'),
            hrefField('The service’s page, e.g. /advisory.'),
          ],
          preview: {select: {title: 'name', subtitle: 'href'}},
        }),
      ],
    }),
    tileObject('stacksTile', 'Free Tech Stacks box', 'Resources, top left: drawn over a small row of the stacks’ cards.'),
    tileObject('databaseTile', 'Software Database box', 'Resources, bottom left. Write ↗ after the name for a link to another site.'),
    defineField({
      name: 'reportTile',
      title: 'Latest report box',
      type: 'object',
      description: 'Resources, top middle: the latest report, its cover filling the box’s right side.',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'name', title: 'Report title', type: 'string'}),
        defineField({name: 'label', title: 'Label', type: 'string', description: 'Under the title, e.g. “Latest report”.'}),
        defineField({name: 'cta', title: 'Link words', type: 'string', description: 'E.g. “Read the report”.'}),
        hrefField('The report’s page, e.g. /reports/the-state-of-ai.'),
        imageField('The cover, filling the box’s right side.'),
      ],
    }),
    tileObject('reportsTile', 'Reports & Guides box', 'Resources, bottom middle.'),
    tileObject('newsletterTile', 'Newsletter box', 'Resources, right: the newsletter’s name and line over its signup (whose words are the Newsletter signup section’s).'),
  ],
)

export const signupSection = pageSection(
  'signup',
  'Newsletter signup (every page)',
  'The newsletter signup’s words wherever it shows: the navigation, the footer, and the report and issue pages.',
  [
    headingField('Inside the email box, before anything is typed.', 'placeholder', 'Email box'),
    buttonField('The button beside the email box.'),
    headingField('Asked in the footer, over the two choices.', 'audienceQuestion', 'Audience question'),
    headingField('The first choice.', 'practiceOption', 'First choice'),
    headingField('The second choice.', 'vendorOption', 'Second choice'),
  ],
)

export const footerSection = pageSection(
  'footer',
  'Footer (every page)',
  'The footer under every page: three columns of links, the newsletter signup, the contact details and the social links. A link to another site opens in a new tab; write ↗ after its words to show it.',
  [
    headingField('Over the first column.', 'servicesTitle', 'First column title'),
    linksField('servicesLinks', 'First column links'),
    headingField('Over the second column.', 'resourcesTitle', 'Second column title'),
    linksField('resourcesLinks', 'Second column links'),
    headingField('Over the third column.', 'companyTitle', 'Third column title'),
    linksField('companyLinks', 'Third column links'),
    taglineField('Over the signup’s heading.', 'signupTagline', 'Signup tagline'),
    headingField('The signup’s heading.', 'signupHeading', 'Signup heading'),
    headingField('Over the contact details.', 'contactTitle', 'Contact title'),
    defineField({name: 'email', title: 'Email address', type: 'string', description: 'Shown and linked as an email.', validation: (rule) => rule.email()}),
    defineField({name: 'phone', title: 'Telephone', type: 'string', description: 'As shown, e.g. “+44 (0) 207 183 3675”; the link dials it without the (0) and the spaces.'}),
    headingField('The last contact link.', 'callLabel', 'Call link words'),
    hrefField('Where the call link leads.', 'callHref', 'Call link'),
    hrefField('The LinkedIn page.', 'linkedin', 'LinkedIn'),
    hrefField('The Instagram page.', 'instagram', 'Instagram'),
    hrefField('The YouTube channel.', 'youtube', 'YouTube'),
  ],
)

export const bookingSection = pageSection(
  'booking',
  'Free call booking (every page)',
  'The free call with Allister: the buttons that open it on the service pages, the FAQs and the Contact page, and the booking calendar they open. Which weekdays can be picked stays in the code.',
  [
    hrefField('Allister’s booking page (Google Calendar, Calendly, Cal.com…). Every booking button opens it in a new tab. Leave it empty to show the preview calendar below instead.', 'link', 'Booking page link'),
    buttonField('The floating button at the foot of the screen on the service pages.', 'floatLabel', 'Floating button'),
    buttonField('The button at the end of the FAQs and on the folders’ papers.', 'faqLabel', 'Book a Free Call button'),
    imageField('Allister’s portrait in the buttons.', 'photo', 'Portrait'),
    taglineField('Over the calendar’s title.', 'label', 'Label'),
    headingField('The calendar’s title.', 'title', 'Title'),
    textField('Under the title.', 'note', 'Note', 3),
    defineField({
      name: 'slots',
      title: 'Times',
      type: 'array',
      description: 'The times a day offers, in order: each a name and its hours.',
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
    headingField('Beside the button, before a date and time are chosen.', 'summary', 'Prompt'),
    buttonField('The button that sends the request.'),
    textField('Shown once the request is sent.', 'done', 'Thanks', 2),
  ],
)

/** The closing call to action's additions: where its button leads, and the software marks in its tiles */
export const closingCtaExtras = [
  hrefField('Where the button leads, e.g. /stack-diagnostic.', 'primaryHref', 'Button link'),
  defineField({
    name: 'marks',
    title: 'Software marks',
    type: 'array',
    description: 'The software marks that turn in the tiles round the words, in order. Square marks on a clear ground work best.',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'ctaMark',
        title: 'Mark',
        fields: [imageField('The mark.')],
        preview: {select: {media: 'image', title: 'image.alt'}, prepare: ({media, title}) => ({media, title: title || 'Mark'})},
      }),
    ],
  }),
]

