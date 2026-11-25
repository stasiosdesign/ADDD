import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {imageField} from '../shared/fields'
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

const slugField = () =>
  defineField({
    name: 'slug',
    title: 'Page address',
    type: 'slug',
    options: {source: 'title', maxLength: 96, slugify},
    validation: (rule) =>
      rule.required().custom((slug) =>
        !slug?.current || SLUG_PATTERN.test(slug.current)
          ? true
          : `Use lowercase letters, numbers and single hyphens only, e.g. “${slugify(slug.current) || 'the-report'}”`,
      ),
  })

/** The written text of a report or an issue: headings, paragraphs, lists and links */
const bodyField = (description?: string) =>
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

/* (2026-11-19, at the user's word) the form, cleaner: how it's got (the
   beehiiv automation among it) straight under the title, then the price;
   the card's fields and the page's in two folding groups; every
   description a few words. The fields and their data are as before. */

/** A list of short lines, each its own entry */
const shortList = (name: string, title: string, description: string, fieldset: string) =>
  defineField({name, title, type: 'array', description, of: [defineArrayMember({type: 'string'})], fieldset})

export const report = defineType({
  name: 'report',
  title: 'Report',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [
    {name: 'card', title: 'Card', description: 'On the Reports page and sliders.', options: {collapsible: true, collapsed: true}},
    {name: 'page', title: 'Page', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'access',
      title: 'How to get it',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'method',
          title: 'How',
          type: 'string',
          options: {
            list: [
              {title: 'Sign up: beehiiv', value: 'beehiiv'},
              {title: 'Sign up: HubSpot', value: 'hubspot'},
              {title: 'Buy', value: 'buy'},
              {title: 'Link elsewhere', value: 'link'},
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
          description: 'Sends the report after sign-up; needs the “Added by API” trigger.',
          fields: [
            defineField({name: 'id', title: 'Automation ID', type: 'string', readOnly: true}),
            defineField({name: 'name', title: 'Name when chosen', type: 'string', readOnly: true}),
          ],
          components: {input: BeehiivAutomationInput},
          hidden: ({parent}) => parent?.method !== 'beehiiv',
        }),
        defineField({
          name: 'href',
          title: 'Link',
          type: 'url',
          description: 'Checkout or page; with an automation, the download.',
          validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true}),
          hidden: ({parent}) => parent?.method !== 'buy' && parent?.method !== 'link' && !(parent?.method === 'beehiiv' && parent?.beehiivAutomation?.id),
        }),
        defineField({
          name: 'beehiivForm',
          title: 'beehiiv form (older way)',
          type: 'string',
          description: 'Embedded form ID; only without an automation.',
          // shown again (2026-11-19): three reports still use one
          hidden: ({parent}) => parent?.method !== 'beehiiv' && !parent?.beehiivForm,
        }),
        defineField({name: 'beehiivHeight', title: 'Form height', type: 'number', description: 'Pixels (240 if empty).', hidden: ({parent}) => !parent?.beehiivForm}),
        defineField({name: 'hubspotRegion', title: 'HubSpot region', type: 'string', options: {list: ['na1', 'eu1']}, hidden: ({parent}) => parent?.method !== 'hubspot'}),
        defineField({name: 'hubspotPortal', title: 'HubSpot portal ID', type: 'string', hidden: ({parent}) => parent?.method !== 'hubspot'}),
        defineField({name: 'hubspotForm', title: 'HubSpot form ID', type: 'string', hidden: ({parent}) => parent?.method !== 'hubspot'}),
        defineField({name: 'buttonLabel', title: 'Button words', type: 'string', description: 'Empty: “Get it free” or “Buy now”.'}),
        defineField({name: 'note', title: 'Small print', type: 'text', rows: 2}),
        // the automation by name, from the hand-typed list before 19 Nov 2026,
        // and the note asking Stas to connect one: none was ever set; kept,
        // hidden, so nothing written before is lost
        defineField({name: 'automation', title: 'beehiiv automation (by name, before 19 Nov 2026)', type: 'string', hidden: true}),
        defineField({name: 'automationNote', title: 'Automation not in the list?', type: 'text', rows: 2, hidden: true}),
      ],
    }),
    defineField({name: 'price', title: 'Price', type: 'string', description: 'E.g. “£99”. Empty: free.'}),
    defineField({name: 'wasPrice', title: 'Price before', type: 'string', description: 'Struck through, e.g. “£499”.'}),

    // the card
    defineField({name: 'category', title: 'Category', type: 'string', description: 'E.g. AI, BIM, Workflows.', validation: (rule) => rule.required(), fieldset: 'card'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 2, fieldset: 'card'}),
    {...imageField(undefined, 'cover', 'Cover'), fieldset: 'card'},
    defineField({name: 'format', title: 'What it is', type: 'string', description: 'E.g. Report, Cheat sheet.', fieldset: 'card'}),
    defineField({name: 'readTime', title: 'Reading time', type: 'string', description: 'E.g. “12 min read”.', fieldset: 'card'}),
    defineField({name: 'author', title: 'Author', type: 'string', fieldset: 'card'}),
    defineField({name: 'publishedAt', title: 'Date', type: 'date', fieldset: 'card'}),
    {...slugField(), fieldset: 'card'},

    // the page
    defineField({name: 'standfirst', title: 'Standfirst', type: 'text', rows: 3, fieldset: 'page'}),
    shortList('facts', 'Facts', 'E.g. “380 pages”.', 'page'),
    defineField({name: 'coversLede', title: 'What’s inside: intro', type: 'text', rows: 3, fieldset: 'page'}),
    shortList('contents', 'What’s inside', '“Title — detail” adds a detail.', 'page'),
    defineField({name: 'highlightTitle', title: 'Highlight', type: 'string', fieldset: 'page'}),
    defineField({name: 'highlightText', title: 'Highlight text', type: 'text', rows: 2, fieldset: 'page'}),
    defineField({
      name: 'gallery',
      title: 'Pages',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
        }),
      ],
      options: {layout: 'grid'},
      fieldset: 'page',
    }),
    {...bodyField(), fieldset: 'page'},
    shortList('audience', 'Who it’s for', 'Empty hides the band.', 'page'),
    defineField({name: 'audienceLede', title: 'Who it’s for: intro', type: 'text', rows: 2, fieldset: 'page'}),
    shortList('includes', 'What you get', '“Title — detail” adds a detail.', 'page'),

    defineField({
      name: 'partner',
      title: 'Partner panel',
      type: 'object',
      description: 'Empty title hides it.',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'kicker', title: 'Question', type: 'string'}),
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
