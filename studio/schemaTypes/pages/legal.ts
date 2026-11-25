import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {headingField, itemsField, leadField, pageSection, richTextField, seoSection, taglineField} from '../shared/fields'

/* The legal pages (2026-11-25): the Privacy Policy (/privacy-policy) and
   the Terms and Conditions (/terms), both drawn by one template
   (src/components/LegalPage.astro; the pages' own words in
   src/sanity/defaults/legal.ts) and linked from the footer's Company
   column. Each is its own singleton (fixed IDs "privacyPage" and
   "termsPage") with the same fields.

   The text is a list of sections, each a title and its own text (the
   first version, the same day, was one long text box: too much to edit in
   the Page editor's panel, and the page didn't follow the typing). The
   page numbers the sections and lists their titles as its contents. */

/** One numbered section of a legal page: its title and its text */
export const legalSection = defineType({
  name: 'legalSection',
  title: 'Section',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Title',
      type: 'string',
      description: 'The section’s title, e.g. “Your rights”. It is numbered on the page and listed in the contents beside the text.',
      validation: (rule) => rule.required(),
    }),
    richTextField('Paragraphs, lists and links, as in a word processor. Select words to make them bold or a link; choose Subheading for a title inside the section.'),
  ],
  preview: {
    select: {title: 'heading', text: 'text'},
    prepare: ({title, text}) => {
      const first = ((text ?? []) as {children?: {text?: string}[]}[])
        .flatMap((block) => block.children ?? [])
        .map((span) => span.text ?? '')
        .join('')
      return {title: title || 'Untitled section', subtitle: first.length > 90 ? `${first.slice(0, 90)}…` : first}
    },
  },
})

const legalPage = (name: string, title: string, what: string) =>
  defineType({
    name,
    title: `${title} page`,
    type: 'document',
    icon: DocumentTextIcon,
    fields: [
      seoSection(),
      pageSection('hero', 'Opening', `The page’s heading, the line under it, and the date the ${what} last changed.`, [
        taglineField(),
        headingField(),
        leadField('The line under the heading.'),
        headingField('The words before the date, e.g. “Last updated”.', 'updatedLabel', 'Date label'),
        defineField({
          name: 'updated',
          title: 'Last updated',
          type: 'date',
          description: `Shown at the top of the text, e.g. “25 November 2026”. Change it whenever the ${what} change${what === 'policy' ? 's' : ''}.`,
          options: {dateFormat: 'D MMMM YYYY'},
        }),
      ]),
      pageSection('content', `The ${what}`, `The ${what}, section by section. Each section is a title and its text; the page numbers them in order and lists them as its contents.`, [
        headingField('Over the list of sections beside the text.', 'contentsLabel', 'Contents label'),
        itemsField('sections', 'Sections', 'legalSection', 'Each section in order, e.g. “Who we are”, “Your rights”.'),
      ]),
    ],
    preview: {prepare: () => ({title: `${title} page`})},
  })

export const privacyPage = legalPage('privacyPage', 'Privacy Policy', 'policy')
export const termsPage = legalPage('termsPage', 'Terms and Conditions', 'terms')
