import {defineArrayMember, defineField} from 'sanity'
import {pageSection, SectionField} from '@stasiosdesign/sanity-cms'

/* The building blocks of the page documents (schemaTypes/pages): one section
   per part of a page, each a folded bar in the form (pageSection, the CMS
   foundation's convention for the Page editor), holding the few things the
   page's code no longer fixes: a tagline, a heading, a standfirst, the words
   on a button, a list of cards. Every page's own file is a list of these, so
   it reads as an outline of the page.

   No field is required: the site falls back to its own words for any field
   that is empty (src/sanity/defaults/), so clearing one changes nothing and
   a page never breaks. */
export {pageSection}

/** The small line above a heading (the tagline). */
export const taglineField = (description = 'The small line above the heading.', name = 'tagline', title = 'Tagline') =>
  defineField({name, title, type: 'string', description})

/** A heading, on one line. */
export const headingField = (description?: string, name = 'heading', title = 'Heading') =>
  defineField({name, title, type: 'string', description})

/** A standfirst or other short run of text, a few lines long. */
export const leadField = (description?: string, name = 'lede', title = 'Standfirst', rows = 3) =>
  defineField({name, title, type: 'text', rows, description})

/** A paragraph of text. */
export const textField = (description?: string, name = 'text', title = 'Text', rows = 4) =>
  defineField({name, title, type: 'text', rows, description})

/** The words on a button; where it leads stays in the site's code, so say so in the description. */
export const buttonField = (description: string, name = 'button', title = 'Button label') =>
  defineField({name, title, type: 'string', description})

/** A picture, cropped and focused in the Studio. Alternative text is kept but hidden from the form for now. */
export const imageField = (description?: string, name = 'image', title = 'Picture') =>
  defineField({
    name,
    title,
    type: 'image',
    description,
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Alternative text',
        type: 'string',
        description: 'What the picture shows, for screen readers and search engines.',
        hidden: true,
      }),
    ],
  })

/** A list of blocks of one object type (a tile, a step, a question...), each edited in place. */
export const itemsField = (name: string, title: string, of: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description,
    of: [defineArrayMember({type: of})],
  })

/** A list of lines of text (a check-list, the rows of a comparison side). */
export const linesField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description,
    of: [defineArrayMember({type: 'string'})],
  })

/** The hero most content pages open with: the tagline, the heading, the standfirst and two buttons. */
export const heroSection = (description: string, primary: string, secondary: string) =>
  pageSection('hero', 'Opening', description, [
    taglineField(),
    headingField(),
    leadField(),
    buttonField(primary, 'primaryButton', 'First button label'),
    buttonField(secondary, 'secondaryButton', 'Second button label'),
  ])

/** The heading row most sections open with: a standfirst on the left, a tagline and heading on the right. */
export const sectionHead = (lede = 'The standfirst beside the heading.') => [
  leadField(lede),
  taglineField(),
  headingField(),
]

/** A page's testimonial (the quote block), folded into a bar like the page's sections. */
export const quoteSection = (description: string) =>
  defineField({
    name: 'quote',
    title: 'Quote',
    type: 'quote',
    description,
    options: {collapsible: true, collapsed: true},
    components: {field: SectionField},
  })
