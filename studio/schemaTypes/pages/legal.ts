import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {BlockItem} from '@stasiosdesign/sanity-cms'
import {headingField, itemsField, leadField, pageSection, seoSection, taglineField} from '../shared/fields'

/* The legal pages (2026-11-25): the Privacy Policy (/privacy-policy) and
   the Terms and Conditions (/terms), both drawn by one template
   (src/components/LegalPage.astro; the pages' own words in
   src/sanity/defaults/legal.ts) and linked from the footer's Company
   column. Each is its own singleton (fixed IDs "privacyPage" and
   "termsPage") with the same fields.

   The text is a list of sections, each a title and its text, opened in
   place in the list (BlockItem, as the site's other blocks) rather than on
   a screen of its own. The page numbers them and lists their titles as its
   contents. The form says as little as it can (2026-11-25, at the user's
   word): the titles say what each field is. */

/** A section's text: paragraphs, subheadings, lists, bold, italic and links (drawn live: data-page-rich) */
const sectionText = defineField({
  name: 'text',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Paragraph', value: 'normal'},
        {title: 'Subheading', value: 'h3'},
      ],
      lists: [
        {title: 'Bullets', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
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
                description: 'A page (/contact), a website (https://…) or mailto:',
                validation: (rule) => rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              }),
            ],
          },
        ],
      },
    }),
  ],
})

/** One numbered section of a legal page: its title and its text */
export const legalSection = defineType({
  name: 'legalSection',
  title: 'Section',
  type: 'object',
  icon: DocumentTextIcon,
  components: {item: BlockItem},
  fields: [defineField({name: 'heading', title: 'Title', type: 'string', validation: (rule) => rule.required()}), sectionText],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Untitled section'})},
})

const legalPage = (name: string, title: string, what: string) =>
  defineType({
    name,
    title: `${title} page`,
    type: 'document',
    icon: DocumentTextIcon,
    fields: [
      seoSection(),
      pageSection('hero', 'Opening', '', [
        taglineField(),
        headingField(),
        leadField(),
        headingField(undefined, 'updatedLabel', 'Date label'),
        defineField({name: 'updated', title: 'Last updated', type: 'date', options: {dateFormat: 'D MMMM YYYY'}}),
      ]),
      pageSection('content', `The ${what}`, '', [
        headingField(undefined, 'contentsLabel', 'Contents label'),
        itemsField('sections', 'Sections', 'legalSection'),
      ]),
    ],
    preview: {prepare: () => ({title: `${title} page`})},
  })

export const privacyPage = legalPage('privacyPage', 'Privacy Policy', 'policy')
export const termsPage = legalPage('termsPage', 'Terms and Conditions', 'terms')
