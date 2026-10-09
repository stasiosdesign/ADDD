import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {imageField, linesField} from '../shared/fields'

/* The two collections of insight: reports (at /reports/<slug>.html, listed on
   the Reports page) and newsletter issues (at /newsletter/<slug>.html, listed
   on the Newsletter page). Both show as insight cards: on their index page,
   in the home page's research slider, and in the "related" sliders. */

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
    slugField('/reports/<slug>.html'),
    defineField({name: 'author', title: 'Author', type: 'string', description: 'Shown on the card’s meta row, before the reading time.'}),
    defineField({name: 'standfirst', title: 'Standfirst', type: 'text', rows: 3, description: 'The introduction beside the cover on the report’s page.'}),
    defineField({name: 'coversLede', title: 'What it covers: standfirst', type: 'text', rows: 3, description: 'The standfirst of the “What this report covers” section.'}),
    linesField('contents', 'What it covers', 'The list of subjects, one per line.'),
    defineField({name: 'highlightTitle', title: 'Highlight title', type: 'string', description: 'The large card beside the list.'}),
    defineField({name: 'highlightText', title: 'Highlight text', type: 'text', rows: 2}),
    bodyField('The report’s own text, if it is published as a page rather than a download. Optional.'),
  ],
  orderings: [{title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'category', media: 'cover'}},
})

export const newsletterIssue = defineType({
  name: 'newsletterIssue',
  title: 'Newsletter issue',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    ...cardFields('Newsletter'),
    slugField('/newsletter/<slug>.html'),
    linesField('tags', 'Tags', 'The small tags under the title on the issue’s page.'),
    defineField({name: 'standfirst', title: 'Standfirst', type: 'text', rows: 3, description: 'The introduction beside the title on the issue’s page.'}),
    bodyField('The issue’s text: headings and paragraphs.'),
  ],
  orderings: [{title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'category', media: 'cover'}},
})
