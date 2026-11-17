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
    defineField({name: 'stage', title: 'Stage', type: 'string', description: 'What happens at this stage of the workflow, e.g. “Concept imagery”. Shown on its card, open or locked.', validation: (rule) => rule.required()}),
    defineField({
      name: 'locked',
      title: 'Locked',
      type: 'boolean',
      description: 'On: the card shows the stage alone, with a lock, and the way into the ADDD app. Its tool stays in the app and is never written here.',
      initialValue: false,
    }),
    defineField({
      name: 'tool',
      title: 'Tool',
      type: 'string',
      description: 'The software at this stage, e.g. “Rhino”.',
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
      description: 'A sentence or two, shown under the tool in the stack’s sheet.',
      hidden: ({parent}) => !!parent?.locked,
      validation: (rule) =>
        rule.custom((value, context) => ((context.parent as {locked?: boolean} | undefined)?.locked && value ? 'A locked stage keeps this in the ADDD app: clear it here.' : true)),
    }),
    defineField({
      name: 'alternatives',
      title: 'Alternatives',
      type: 'array',
      description: 'Other tools that could do the same job, one per line. Shown in one line under what it does.',
      of: [defineArrayMember({type: 'string'})],
      hidden: ({parent}) => !!parent?.locked,
      validation: (rule) =>
        rule.custom((value, context) => ((context.parent as {locked?: boolean} | undefined)?.locked && Array.isArray(value) && value.length ? 'A locked stage keeps its alternatives in the ADDD app: clear them here.' : true)),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'The tool’s logo, square, on its card and in the sheet. Without one, the card shows the tool’s initials.',
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
    defineField({name: 'name', title: 'Name', type: 'string', description: 'The workflow’s name, e.g. “Residential Design”: beside its cards in the row, on its block in the list and at the top of its sheet.', validation: (rule) => rule.required()}),
    defineField({name: 'short', title: 'Short line', type: 'string', description: 'One short line, shown beside the row while the stack is under the pointer.'}),
    defineField({name: 'summary', title: 'What it is for', type: 'text', rows: 3, description: 'Who the workflow suits and what it does, at the top of its sheet.'}),
    defineField({name: 'note', title: 'Note', type: 'text', rows: 3, description: 'A note under the stages in the sheet, where there is one. Leave empty for none.'}),
    defineField({
      name: 'stages',
      title: 'Stages',
      type: 'array',
      description: 'The workflow’s stages, in order: each a card in the row. Drag to reorder; switch a stage to Locked to keep its tool in the ADDD app.',
      of: [defineArrayMember({type: 'techStackStage'})],
      validation: (rule) => rule.min(1),
    }),
    defineField({name: 'url', title: 'Its place in the ADDD app', type: 'url', description: 'Where the sheet’s button and the locked stages lead for this stack. Without it, the Free Stack’s sign-up (the page’s Opening).'}),
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
