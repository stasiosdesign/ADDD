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

/**
 * How every list in the Studio is used, at the end of its description
 * (2026-11-17): the page editor selects a list as one block and opens it
 * here, so the panel says how to change it.
 */
const HOW_LISTS_WORK = 'Click an entry to change it, drag it by its handle to reorder, and use “Add item” for a new one.'
const withHow = (description?: string) => [description, HOW_LISTS_WORK].filter(Boolean).join(' ')

/** A list of blocks of one object type (a tile, a step, a question...), each edited in place. */
export const itemsField = (name: string, title: string, of: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description: withHow(description),
    of: [defineArrayMember({type: of})],
  })

/**
 * A timeline's stage details (StageTimeline.astro on the Workflow Workshop
 * and Technology Blueprint pages): for each stage, in the stages' order, its
 * timing and the more its block tells when opened.
 */
export const stageDetailsField = (description = 'For each stage, in the same order: its timing, and what its block tells when opened.') =>
  defineField({
    name: 'details',
    title: 'Stage details',
    type: 'array',
    description,
    of: [
      defineArrayMember({
        type: 'object',
        name: 'stageDetail',
        title: 'Stage detail',
        fields: [
          defineField({name: 'meta', title: 'Timing', type: 'string', description: 'E.g. “Before the session” or “Weeks 2–4”.'}),
          defineField({name: 'more', title: 'More', type: 'text', rows: 3, description: 'What the block tells when opened.'}),
        ],
        preview: {select: {title: 'meta', subtitle: 'more'}},
      }),
    ],
  })

/**
 * Where a link or button leads: a page of the site (/about), another site
 * (https://…), an email address (mailto:…) or a telephone number (tel:…).
 * A link to another site opens in a new tab.
 */
export const hrefField = (description = 'A page of the site (/about), another site (https://…), mailto: or tel:.', name = 'href', title = 'Link') =>
  defineField({
    name,
    title,
    type: 'url',
    description,
    validation: (rule) => rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
  })

/** A list of text links, each its words and where it leads (the link type, objects/blocks.ts). */
export const linksField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description: withHow(description),
    of: [defineArrayMember({type: 'link'})],
  })

/**
 * The page in the browser's tab and in search results (2026-11-16): its
 * title and its summary. Every page's first section, folded away.
 */
export const seoSection = () =>
  pageSection('seo', 'Search and sharing', 'The page’s title in the browser’s tab and in search results, and the summary search results show under it.', [
    defineField({name: 'title', title: 'Title', type: 'string', description: 'About 50–60 characters, e.g. “Contact — ADDD”.'}),
    defineField({name: 'description', title: 'Summary', type: 'text', rows: 3, description: 'One or two sentences, about 150 characters.'}),
  ])

/**
 * What each stage of a timeline holds (StageTimeline.astro, the staircase
 * on the Workflow Workshop, Technology Blueprint and AEC Tech Partners
 * pages): for each stage, in the stages' order, its points, each marked by
 * who does it, ADDD, your team, or optional.
 */
export const stageItemsField = (description = 'For each stage, in the same order: the points listed in its box, each marked by who does it.', name = 'stageItems', title = 'What each stage holds') =>
  defineField({
    name,
    title,
    type: 'array',
    description,
    of: [
      defineArrayMember({
        type: 'object',
        name: 'timelineStage',
        title: 'Stage',
        fields: [
          defineField({
            name: 'items',
            title: 'Points',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                name: 'timelinePoint',
                title: 'Point',
                fields: [
                  defineField({name: 'label', title: 'Point', type: 'string'}),
                  defineField({
                    name: 'by',
                    title: 'Who',
                    type: 'string',
                    options: {list: [{title: 'ADDD', value: 'addd'}, {title: 'Your team', value: 'you'}, {title: 'Optional', value: 'optional'}], layout: 'radio', direction: 'horizontal'},
                    initialValue: 'addd',
                  }),
                ],
                preview: {select: {title: 'label', subtitle: 'by'}},
              }),
            ],
          }),
        ],
        preview: {
          select: {items: 'items'},
          prepare: ({items}) => ({title: ((items ?? []) as {label?: string}[]).map((i) => i.label).filter(Boolean).join(' · ') || 'Stage'}),
        },
      }),
    ],
  })

/**
 * A timeline (StageTimeline.astro, 2026-11-17, at the user's word): all of
 * it in one field, so the Visual editor selects it as one block and the
 * panel shows the whole of it. Each stage a row: its title, how long it
 * takes (its box drawn to that length: three weeks three times one), when
 * it starts (after the one before, unless set), the words beside its
 * title, and its points, each marked by who does it.
 */
export const timelineField = (description = 'Each stage is one row. Open a stage to change its title, length and points; drag it to reorder; “Add item” adds a stage. Lengths are drawn to scale: a stage of 3 weeks is three times as long as one of 1.') =>
  defineField({
    name: 'timeline',
    title: 'Timeline',
    type: 'object',
    description,
    options: {collapsible: false},
    fields: [
      defineField({
        name: 'unit',
        title: 'Lengths counted in',
        type: 'string',
        description: 'What a stage’s length means. “Steps”: every stage the same size unless you say otherwise.',
        options: {list: [{title: 'Days', value: 'day'}, {title: 'Weeks', value: 'week'}, {title: 'Steps', value: 'step'}], layout: 'radio', direction: 'horizontal'},
        initialValue: 'week',
      }),
      defineField({
        name: 'stages',
        title: 'Stages',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'timelinePhase',
            title: 'Stage',
            fields: [
              defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
              defineField({
                name: 'length',
                title: 'Length',
                type: 'number',
                description: 'How many days, weeks or steps it takes. Its box is drawn to this length.',
                initialValue: 1,
                validation: (rule) => rule.required().min(0.5).max(52),
              }),
              defineField({
                name: 'start',
                title: 'Starts at',
                type: 'number',
                description: 'Leave empty: it starts when the stage before it ends. Set a day or week number (1 is the first) to start it elsewhere, e.g. to overlap the one before.',
                validation: (rule) => rule.min(1).max(52),
              }),
              defineField({
                name: 'when',
                title: 'Timing words',
                type: 'string',
                description: 'Beside the title. Leave empty to show the days or weeks it runs, e.g. “Weeks 2–4”. Write your own for anything else, e.g. “Before the session”.',
              }),
              defineField({
                name: 'items',
                title: 'Points',
                type: 'array',
                description: 'The bullet points in its box, each marked by who does it.',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'timelinePhasePoint',
                    title: 'Point',
                    fields: [
                      defineField({name: 'label', title: 'Point', type: 'string'}),
                      defineField({
                        name: 'by',
                        title: 'Who',
                        type: 'string',
                        options: {list: [{title: 'ADDD', value: 'addd'}, {title: 'Your team', value: 'you'}, {title: 'Optional', value: 'optional'}], layout: 'radio', direction: 'horizontal'},
                        initialValue: 'addd',
                      }),
                    ],
                    preview: {select: {title: 'label', subtitle: 'by'}},
                  }),
                ],
              }),
            ],
            preview: {
              select: {title: 'title', length: 'length', when: 'when', items: 'items'},
              prepare: ({title, length, when, items}) => ({
                title: title || 'Stage',
                subtitle: [when || (length ? `Length ${length}` : ''), ((items ?? []) as {label?: string}[]).map((i) => i.label).filter(Boolean).join(' · ')].filter(Boolean).join(' — '),
              }),
            },
          }),
        ],
      }),
    ],
  })

/** The timeline's key under it: the words for who does what */
export const timelineKeyFields = () => [
  defineField({name: 'keyAddd', title: 'Key: ADDD', type: 'string', description: 'Under the timeline: what a plain point stands for.'}),
  defineField({name: 'keyYou', title: 'Key: your team', type: 'string', description: 'What a point marked “Your team” stands for.'}),
  defineField({name: 'keyOptional', title: 'Key: optional', type: 'string', description: 'What a point marked “Optional” stands for.'}),
]

/**
 * Written text (2026-11-25, the Privacy Policy and Terms sections):
 * paragraphs, subheadings, bulleted and numbered lists, bold, italic and
 * links, written in the Studio as in a word processor. The page draws it
 * live as it is typed (src/sanity/live-preview.ts, data-page-rich). No
 * headings: the section it sits in has its own title.
 */
export const richTextField = (description?: string, name = 'text', title = 'Text') =>
  defineField({
    name,
    title,
    type: 'array',
    description,
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
              fields: [hrefField('A page of the site (/contact), another site (https://…) or an email address (mailto:…).', 'href', 'Address')],
            },
          ],
        },
      }),
    ],
  })

/** A list of lines of text (a check-list, the rows of a comparison side). */
export const linesField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description: withHow(description),
    of: [defineArrayMember({type: 'string'})],
  })

/** The hero most content pages open with: the tagline, the heading, the standfirst and two buttons. */
export const heroSection = (description: string, primary: string, secondary: string, more: ReturnType<typeof defineField>[] = []) =>
  pageSection('hero', 'Opening', description, [
    taglineField(),
    headingField(),
    leadField(),
    buttonField(primary, 'primaryButton', 'First button label'),
    buttonField(secondary, 'secondaryButton', 'Second button label'),
    ...more,
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
