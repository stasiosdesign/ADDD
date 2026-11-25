import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'

// A practice in the home page's logo strip (and beside a testimonial): its
// name and its logo. Edited from the Home page's Logo strip section, never
// made from the menu (project.ts, hiddenFromNew).
export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'White, on a transparent background.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Order',
      type: 'number',
      description: '1 is first.',
      validation: (rule) => rule.integer().min(1),
    }),
  ],
  orderings: [{title: 'Order', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'name', media: 'logo'}},
})
