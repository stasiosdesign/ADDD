import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'
import {buttonField, headingField, heroSection, itemsField, leadField, linesField, pageSection, sectionHead, taglineField, textField} from '../shared/fields'

/* The Home page, one section per part of the page, in the order the page
   shows them (src/pages/index.astro; the page's own words in
   src/sanity/defaults/home.ts). The navigation, the footer, the hero's
   pattern and where every button leads stay in the site's code. A
   singleton with the fixed ID "homePage". */

// The approach steps, the cost cards and the route cards are drawn by the
// page in a fixed number of places, so their lists keep their length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    heroSection('The opening: the standfirst and tagline on the left, the headline and its two buttons on the right. The pattern behind them stays in the code.', 'Links to Free Tech Stacks.', 'Links to the Contact page.'),
    pageSection('logos', 'Logo strip', 'The title above the logos, and the logos themselves, in order. Each opens the client to change its name or mark.', [
      headingField('The line above the strip.', 'title', 'Title'),
      defineField({
        name: 'clients',
        title: 'Logos',
        type: 'array',
        description: 'The logos in the strip, in order. Wide wordmarks and compact marks take turns, so keep them alternating.',
        of: [defineArrayMember({type: 'reference', to: [{type: 'client'}]})],
        options: {sortable: true},
      }),
    ]),
    pageSection('approach', 'Approach', 'The statement held on screen under the logos, and the three steps on the rail. The steps’ drawings stay in the code.', [
      leadField('The statement.', 'statement', 'Statement', 4),
      itemsField('steps', 'Steps', 'step', 'The three steps: Understand, Diagnose, Prioritise. Edit what each says; there are always three.'),
    ]),
    pageSection('cost', 'The cost of standing still', 'The heading row and the three cards with their pictures.', [
      ...sectionHead('The standfirst on the left.'),
      itemsField('cards', 'Cards', 'tile', 'The three cards, left to right; the icon on each stays in the code.'),
    ]),
    pageSection('routes', 'Ways to work with ADDD', 'The heading row and the four route cards. Where each card leads stays in the code.', [
      ...sectionHead(),
      itemsField('cards', 'Cards', 'tile', 'The four routes, left to right: the small label, the title and the line of text.'),
    ]),
    pageSection('testimonials', 'Testimonials', 'The title and the quotes, in the order they turn through.', [
      headingField('The small title above the quotes.'),
      itemsField('items', 'Quotes', 'quote'),
    ]),
    pageSection('credentials', 'Credentials', 'The tagline, heading, paragraph and button beside the two pictures.', [
      taglineField(),
      headingField(),
      textField('The paragraph.'),
      buttonField('Links to the About page.'),
    ]),
    pageSection('fit', 'Fit', 'The heading row and the two sides: who ADDD is for, and who it is not primarily for.', [
      ...sectionHead(),
      headingField('The left side’s title.', 'forTitle', 'Left title'),
      linesField('forItems', 'Left rows', 'One row per line.'),
      headingField('The right side’s title.', 'notTitle', 'Right title'),
      linesField('notItems', 'Right rows', 'One row per line.'),
    ]),
    pageSection('research', 'Research and insight', 'The heading row above the slider of reports and issues (which are collections), and the newsletter signup under it.', [
      leadField('The standfirst on the left.'),
      headingField(),
      taglineField('The small line above the signup’s heading.', 'signupTagline', 'Signup tagline'),
      headingField('The signup’s heading.', 'signupHeading', 'Signup heading'),
    ]),
    pageSection('closingCta', 'Closing call to action', 'The block that ends this page and most others: a change here shows on all of them. For AEC Tech Firms has its own.', [
      taglineField('The small label on the left.', 'label', 'Label'),
      headingField(),
      buttonField('Links to Free Tech Stacks.', 'primaryButton', 'First button label'),
      buttonField('Links to the Contact page.', 'secondaryButton', 'Second button label'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Home page'})},
})

// Lists the page draws in a fixed number of places keep their length
for (const section of ['approach', 'cost', 'routes']) {
  const field = homePage.fields.find((f) => f.name === section) as {fields?: {name: string; options?: object}[]} | undefined
  const list = field?.fields?.find((f) => f.name === 'steps' || f.name === 'cards')
  if (list) list.options = {...list.options, ...FIXED}
}
