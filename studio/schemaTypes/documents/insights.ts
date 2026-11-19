import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {imageField, linesField} from '../shared/fields'
import {BeehiivAutomationInput} from '../../components/BeehiivAutomationInput'

/* The site's one collection: reports (at /reports/<slug>, listed on the
   Reports page), shown as insight cards on the Reports page, in the home
   page's research slider and in the "related" sliders. (The newsletter's
   issues were a second collection until 2026-11-16: they come from
   beehiiv now, src/newsletter/beehiiv.ts, and are never written here.) */

/* The beehiiv automation a report's sign-ups start (2026-11-19): picked from
   beehiiv's own list, read live (studio/components/BeehiivAutomationInput.tsx,
   through the site's src/sanity/beehiiv/automations.ts). Until 19 Nov the
   list was typed here by hand; no report had one chosen. */

// A slug is the last part of the page's address, so it may only use lowercase
// letters, numbers and single hyphens
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const slugify = (input: string) =>
  input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/, '')

const slugField = (where: string) =>
  defineField({
    name: 'slug',
    type: 'slug',
    description: `The page address: ${where}. Lowercase letters, numbers and hyphens; “Generate” makes one from the title.`,
    options: {source: 'title', maxLength: 96, slugify},
    validation: (rule) =>
      rule.required().custom((slug) =>
        !slug?.current || SLUG_PATTERN.test(slug.current)
          ? true
          : `Use lowercase letters, numbers and single hyphens only, e.g. “${slugify(slug.current) || 'the-report'}”`,
      ),
  })

/** The written text of a report or an issue: headings, paragraphs, lists and links */
const bodyField = (description: string) =>
  defineField({
    name: 'body',
    title: 'Text',
    type: 'array',
    description,
    of: [
      defineArrayMember({
        type: 'block',
        styles: [
          {title: 'Paragraph', value: 'normal'},
          {title: 'Heading', value: 'h2'},
          {title: 'Subheading', value: 'h3'},
        ],
        lists: [
          {title: 'Bullets', value: 'bullet'},
          {title: 'Numbered', value: 'number'},
        ],
        marks: {
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
          ],
          annotations: [
            {
              name: 'link',
              title: 'Link',
              type: 'object',
              fields: [
                defineField({
                  name: 'href',
                  title: 'Address',
                  type: 'url',
                  validation: (rule) => rule.required().uri({scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true}),
                }),
              ],
            },
          ],
        },
      }),
    ],
  })

const cardFields = (kind: string) => [
  defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
  defineField({
    name: 'category',
    title: 'Category',
    type: 'string',
    description: `The chip on the card, and what the ${kind} page’s filters match: Technology, AI, BIM, Workflows…`,
    validation: (rule) => rule.required(),
  }),
  defineField({name: 'summary', title: 'Summary', type: 'text', rows: 2, description: 'The line under the title on the card.'}),
  imageField('The card’s picture.', 'cover', 'Cover'),
  defineField({name: 'readTime', title: 'Reading time', type: 'string', description: 'As shown on the card, e.g. “12 min read”.'}),
  defineField({name: 'publishedAt', title: 'Date', type: 'date', description: 'Newest first on the index pages and in the sliders.'}),
]

export const report = defineType({
  name: 'report',
  title: 'Report',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    ...cardFields('Reports'),
    slugField('/reports/<slug>'),
    defineField({name: 'author', title: 'Author', type: 'string', description: 'Shown on the card’s meta row, before the reading time.'}),
    // the product (2026-11-17, when ADDD's six products came over from
    // their Carrd and beehiiv pages): what it is, its price, its facts
    defineField({name: 'format', title: 'What it is', type: 'string', description: 'E.g. “Report”, “Cheat sheet”, “White paper”, “Spreadsheet”: over the title, on its card and on the card that gets it.'}),
    defineField({name: 'price', title: 'Price', type: 'string', description: 'As shown, e.g. “£99”. Leave empty for a free download.'}),
    defineField({name: 'wasPrice', title: 'Price before', type: 'string', description: 'Struck through beside the price, e.g. “£499”. Leave empty for none.'}),
    linesField('facts', 'Facts', 'A few short facts, shown as tags under the standfirst: “380 pages”, “30+ tools compared”. One per line.'),
    defineField({name: 'standfirst', title: 'Standfirst', type: 'text', rows: 3, description: 'The introduction under the title, beside the cover.'}),
    defineField({name: 'coversLede', title: 'What’s inside: standfirst', type: 'text', rows: 3, description: 'The line beside the heading of what is inside.'}),
    linesField('contents', 'What’s inside', 'The subjects, one per line, each a numbered row. A line written “Title — detail” shows the detail under the title. Leave empty to leave the section out.'),
    defineField({name: 'highlightTitle', title: 'Highlight', type: 'string', description: 'A line set apart under the rows, beside a red mark. Leave empty for none.'}),
    defineField({name: 'highlightText', title: 'Highlight text', type: 'text', rows: 2, description: 'Under the highlight.'}),
    defineField({
      name: 'gallery',
      title: 'Pages',
      type: 'array',
      description: 'Pages from inside, in a row under what is inside. Leave empty for none.',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string', description: 'What the page shows, for screen readers.'})],
        }),
      ],
      options: {layout: 'grid'},
    }),
    bodyField('More text, under the pages, where the report needs it: headings, paragraphs, lists and links. Optional.'),
    linesField('audience', 'Who it’s for', 'The readers it is for, one per line, on the dark band. Leave empty to leave the band out.'),
    defineField({name: 'audienceLede', title: 'Who it’s for: line', type: 'text', rows: 2, description: 'Under the band’s heading. Optional.'}),
    linesField('includes', 'What you get', 'On the card that gets it, one per line. A line written “Title — detail” shows the detail under the title.'),
    defineField({
      name: 'access',
      title: 'How to get it',
      type: 'object',
      description: 'A free report is signed up for (its form sends it); a paid one is bought (its link).',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'method',
          title: 'How',
          type: 'string',
          options: {
            list: [
              {title: 'Sign up: a beehiiv automation', value: 'beehiiv'},
              {title: 'Sign up: a HubSpot form', value: 'hubspot'},
              {title: 'Buy: a link to the checkout', value: 'buy'},
              {title: 'A link elsewhere', value: 'link'},
            ],
            layout: 'radio',
          },
          initialValue: 'beehiiv',
        }),
        // the beehiiv automation its sign-ups start, from beehiiv's live list
        // (2026-11-19): its ID is what the website sends; never shown on the site
        defineField({
          name: 'beehiivAutomation',
          title: 'beehiiv automation',
          type: 'object',
          description:
            'What happens in beehiiv after someone signs up for this report, e.g. the email that sends it. The list is beehiiv’s own: make the automation in beehiiv first (with the “Add by API” trigger), then choose it here. Choosing one puts the website’s own sign-up on the report, in place of an embedded beehiiv form.',
          fields: [
            defineField({name: 'id', title: 'Automation ID', type: 'string', readOnly: true}),
            defineField({name: 'name', title: 'Name when chosen', type: 'string', readOnly: true}),
          ],
          components: {input: BeehiivAutomationInput},
          hidden: ({parent}) => parent?.method !== 'beehiiv',
        }),
        defineField({
          name: 'beehiivForm',
          title: 'Embedded beehiiv form (older way)',
          type: 'string',
          description:
            'Only used when no automation is chosen above: a sign-up form made in beehiiv (Grow → Subscribe forms → the form → Embed: the address in its iframe, https://subscribe-forms.beehiiv.com/…), shown on the report as beehiiv’s own form. Whatever the form does in beehiiv is set there.',
          // shown again (2026-11-19): three reports still use one
          hidden: ({parent}) => parent?.method !== 'beehiiv' && !parent?.beehiivForm,
        }),
        defineField({
          name: 'beehiivHeight',
          title: 'Embedded form height',
          type: 'number',
          description: 'In pixels: the embedded form’s own height at the card’s width (240 if empty). Leave room for its thank-you message.',
          hidden: ({parent}) => !parent?.beehiivForm,
        }),
        // the automation by name, from the hand-typed list before 19 Nov 2026,
        // and the note asking Stas to connect one: none was ever set; kept,
        // hidden, so nothing written before is lost
        defineField({name: 'automation', title: 'beehiiv automation (by name, before 19 Nov 2026)', type: 'string', hidden: true}),
        defineField({name: 'automationNote', title: 'Automation not in the list?', type: 'text', rows: 2, hidden: true}),
        defineField({
          name: 'hubspotRegion',
          title: 'HubSpot region',
          type: 'string',
          description: 'From the form’s embed code: data-region, e.g. “na1” or “eu1”.',
          options: {list: ['na1', 'eu1']},
          hidden: ({parent}) => parent?.method !== 'hubspot',
        }),
        defineField({name: 'hubspotPortal', title: 'HubSpot portal ID', type: 'string', description: 'From the embed code: data-portal-id.', hidden: ({parent}) => parent?.method !== 'hubspot'}),
        defineField({name: 'hubspotForm', title: 'HubSpot form ID', type: 'string', description: 'From the embed code: data-form-id.', hidden: ({parent}) => parent?.method !== 'hubspot'}),
        defineField({
          name: 'href',
          title: 'Link',
          type: 'url',
          description:
            'Where the button leads: the checkout, or the page elsewhere. For a sign-up with an automation: the download, opened on the page once someone has signed up (optional; leave empty if the automation’s email is how it arrives).',
          validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true}),
          hidden: ({parent}) => parent?.method !== 'buy' && parent?.method !== 'link' && !(parent?.method === 'beehiiv' && parent?.beehiivAutomation?.id),
        }),
        defineField({name: 'buttonLabel', title: 'Button words', type: 'string', description: 'The opening’s button and the card’s. Leave empty for the Reports page’s (“Get it free” or “Buy now”).'}),
        defineField({name: 'note', title: 'Note', type: 'text', rows: 2, description: 'At the card’s foot, e.g. “By downloading, you’ll join the ADDDitive newsletter. You can unsubscribe anytime.”'}),
      ],
    }),
    defineField({
      name: 'partner',
      title: 'Partner panel',
      type: 'object',
      description: 'A dark panel under the card, for a partner the report is made with. Leave the title empty for none.',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'kicker', title: 'Question', type: 'string', description: 'Over the title, e.g. “Working at enterprise scale?”'}),
        defineField({name: 'title', title: 'Title', type: 'string'}),
        defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
        defineField({name: 'buttonLabel', title: 'Button words', type: 'string'}),
        defineField({name: 'href', title: 'Link', type: 'url', validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true})}),
      ],
    }),
  ],
  orderings: [{title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'category', media: 'cover'}},
})
