import {defineArrayMember, defineField, defineType} from 'sanity'
import {LockIcon} from '@sanity/icons/Lock'
import {StackIcon} from '@sanity/icons/Stack'
import {BlockItem} from '@stasiosdesign/sanity-cms'

/* A tech stack of the Free Tech Stacks page (src/pages/stack-diagnostic.astro,
   drawn by stack-space.js as a run of cards in the row, and opened by
   stack-sheet.js as a sheet): a curated workflow, its name and lines, and
   its stages in order, each a card. An open stage names its tool, what the
   tool does there, its alternatives and its logo; a locked stage shows only
   its name, its tool being in the ADDD app, behind its sign-up.

   Part of the Tech Stacks page (its Tech stacks section, edited in the Page
   editor, in the page's order) since 2026-11-16; rebuilt that day, when
   every field of the site was connected to Sanity, in the shape the page
   draws (src/data/tech-stacks.ts: the ten example workflows were its
   first content).

   The dataset can be read publicly, so a locked stage's tool is never
   written here: the form hides a locked stage's tool fields, and refuses
   to publish one that still holds them. */

/** One stage of a stack: a card in the row and a container in its sheet */
export const techStackStage = defineType({
  name: 'techStackStage',
  title: 'Stage',
  type: 'object',
  components: {item: BlockItem},
  fields: [
    defineField({name: 'stage', title: 'Stage', type: 'string', description: 'E.g. “Concept imagery”.', validation: (rule) => rule.required()}),
    defineField({
      name: 'locked',
      title: 'Locked',
      type: 'boolean',
      description: 'Hides the tool behind the ADDD app sign-up.',
      initialValue: false,
    }),
    defineField({
      name: 'tool',
      title: 'Tool',
      type: 'string',
      description: 'E.g. “Rhino”.',
      hidden: ({parent}) => !!parent?.locked,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {locked?: boolean} | undefined
          if (parent?.locked) return value ? 'A locked stage keeps its tool in the ADDD app: clear it here (switch Locked off to see it).' : true
          return value ? true : 'An open stage names its tool.'
        }),
    }),
    defineField({
      name: 'does',
      title: 'What it does here',
      type: 'text',
      rows: 3,
      hidden: ({parent}) => !!parent?.locked,
      validation: (rule) =>
        rule.custom((value, context) => ((context.parent as {locked?: boolean} | undefined)?.locked && value ? 'A locked stage keeps this in the ADDD app: clear it here.' : true)),
    }),
    defineField({
      name: 'alternatives',
      title: 'Alternatives',
      type: 'array',
      description: 'One per line.',
      of: [defineArrayMember({type: 'string'})],
      hidden: ({parent}) => !!parent?.locked,
      validation: (rule) =>
        rule.custom((value, context) => ((context.parent as {locked?: boolean} | undefined)?.locked && Array.isArray(value) && value.length ? 'A locked stage keeps its alternatives in the ADDD app: clear them here.' : true)),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Square.',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string', hidden: true})],
      hidden: ({parent}) => !!parent?.locked,
      validation: (rule) =>
        rule.custom((value, context) => ((context.parent as {locked?: boolean} | undefined)?.locked && value ? 'A locked stage keeps its logo in the ADDD app: remove it here.' : true)),
    }),
  ],
  preview: {
    select: {stage: 'stage', tool: 'tool', locked: 'locked', media: 'logo'},
    prepare: ({stage, tool, locked, media}) => ({
      title: stage || 'Stage',
      subtitle: locked ? 'Locked' : tool,
      media: locked ? LockIcon : media,
    }),
  },
})

export const techStackItem = defineType({
  name: 'techStackItem',
  title: 'Tech stack',
  type: 'object',
  icon: StackIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', description: 'E.g. “Residential Design”.', validation: (rule) => rule.required()}),
    defineField({name: 'short', title: 'Short line', type: 'string'}),
    defineField({name: 'summary', title: 'What it is for', type: 'text', rows: 3}),
    defineField({name: 'note', title: 'Note', type: 'text', rows: 3}),
    defineField({
      name: 'stages',
      title: 'Stages',
      type: 'array',
      description: 'In order.',
      of: [defineArrayMember({type: 'techStackStage'})],
      validation: (rule) => rule.min(1),
    }),
    defineField({name: 'url', title: 'Its place in the ADDD app', type: 'url', description: 'Empty: the Free Stack sign-up.'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'short', stages: 'stages'},
    prepare: ({title, subtitle, stages}) => {
      const list = (stages ?? []) as {locked?: boolean}[]
      const locked = list.filter((s) => s.locked).length
      return {title: title || 'Tech stack', subtitle: `${list.length} stages, ${locked} locked${subtitle ? ` · ${subtitle}` : ''}`}
    },
  },
})
