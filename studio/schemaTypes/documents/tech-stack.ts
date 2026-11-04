import {defineArrayMember, defineField, defineType} from 'sanity'
import {StackIcon} from '@sanity/icons/Stack'

/* A tech stack (2026-11-04): a set of tools Allister has chosen to work
   together for one architectural workflow, shown on the Free Tech Stacks
   page (src/pages/stack-diagnostic.astro) as a deck of cards on its own
   tray, and opened there as a preview.

   Only what the preview shows lives here: the stack's name, its workflow,
   what it helps a practice do, how many tools it holds, and the two or so
   tools shown before a visitor signs up. The full list is the ADDD app's,
   behind its sign-up: this dataset can be read publicly, so the whole
   stack is never written here. The preview's button goes to the stack in
   the app (appUrl), or to the app's sign-up. */

// The tools a preview can name: the ADDD Stack Ecosystem's, as the site
// lists them (src/data/stack-ecosystem.ts). Keep the two in step.
const TOOL_NAMES = [
  'laiout', 'Ideatura', 'DTOAEC', 'RunDiffusion', 'xFigura', 'MyarchitectAI', 'Prome', 'There', 'ARKI', 'Cogram',
  'DesignAir', 'Sofidus.tech', 'Layer', 'Plannerly', 'Satori', 'Synergy', 'AAL Innovation Academy', 'Markedup', 'zipBoard', 'Spaciv',
]

export const techStack = defineType({
  name: 'techStack',
  title: 'Tech stack',
  type: 'document',
  icon: StackIcon,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', description: 'The stack’s name, e.g. “Visualisation stack”.', validation: (rule) => rule.required()}),
    defineField({name: 'workflow', title: 'Workflow', type: 'string', description: 'The architectural workflow or task it is for, e.g. “Architectural visualisation”. Shown on the stack’s tray.', validation: (rule) => rule.required()}),
    defineField({name: 'summary', title: 'What it does', type: 'text', rows: 3, description: 'What the stack helps a practice do, in a sentence or two. Shown in the preview.'}),
    defineField({
      name: 'toolCount',
      title: 'Number of tools',
      type: 'number',
      description: 'How many tools the full stack holds. The list itself lives in the ADDD app, behind its sign-up.',
      validation: (rule) => rule.required().integer().min(2).max(20),
    }),
    defineField({
      name: 'previewTools',
      title: 'Tools in the preview',
      type: 'array',
      description: 'The tools a visitor sees before signing up, in order: two is enough. The rest stay hidden.',
      of: [defineArrayMember({type: 'string', options: {list: TOOL_NAMES}})],
      validation: (rule) => rule.max(3).unique(),
    }),
    defineField({name: 'appUrl', title: 'Full stack in the app', type: 'url', description: 'Where this stack is in the ADDD app. Without it, the preview’s button goes to the app’s sign-up.'}),
    defineField({name: 'sortOrder', title: 'Order', type: 'number', description: 'Position on the page, 1 first.', validation: (rule) => rule.integer().min(1)}),
  ],
  orderings: [{title: 'Order', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'workflow'}},
})
