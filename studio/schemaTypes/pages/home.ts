import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'
import {buttonField, headingField, hrefField, imageField, itemsField, leadField, linesField, pageSection, sectionHead, seoSection, taglineField, textField} from '../shared/fields'
import {bookingSection, closingCtaExtras, footerSection, navSection, signupSection} from './site-wide'

/* The Home page, one section per part of the page, in the order the page
   shows them (src/pages/index.astro; the page's own words in
   src/sanity/defaults/home.ts). The hero's pattern stays in the site's
   code. A singleton with the fixed ID "homePage".

   Since 2026-11-16 it also holds what every page shares (./site-wide.ts):
   the navigation, the newsletter signup, the footer and the free call's
   booking, after the closing call to action. */

// The approach steps, the cost cards and the route cards are drawn by the
// page in a fixed number of places, so their lists keep their length
const FIXED = {disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy']} as const

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    seoSection(),
    // The other pages' opening (heroSection), with the headline's changing
    // word (src/components/Hero.astro) after the headline
    pageSection('hero', 'Opening', '', [
      taglineField(),
      textField('A line break starts line two.', 'heading', 'Heading', 2),
      linesField('headingWords', 'Changing words', 'One per line; the first must match the heading exactly.'),
      leadField(),
      buttonField(undefined, 'primaryButton', 'First button label'),
      hrefField(undefined, 'primaryHref', 'First button link'),
      buttonField(undefined, 'secondaryButton', 'Second button label'),
      hrefField(undefined, 'secondaryHref', 'Second button link'),
      linesField('fieldWords', 'Words over the pattern', 'Ten, one per line.'),
      linesField('screenWords', 'Words lower down', 'Ten, one per line.'),
      textField('Subjects separated by ·.', 'fieldText', 'Pattern text', 3),
    ]),
    pageSection('logos', 'Logo strip', '', [
      textField('A line break starts line two.', 'title', 'Title', 2),
      defineField({
        name: 'clients',
        title: 'Logos',
        type: 'array',
        description: 'Alternate wide and compact logos.',
        of: [defineArrayMember({type: 'reference', to: [{type: 'client'}]})],
        options: {sortable: true},
      }),
    ]),
    pageSection('approach', 'Approach', '', [
      leadField(undefined, 'statement', 'Statement', 4),
      buttonField(),
      hrefField(undefined, 'buttonHref', 'Button link'),
      defineField({
        name: 'marks',
        title: 'Software marks',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'statementMark',
            title: 'Mark',
            fields: [imageField('Shown on a dark square.')],
            preview: {select: {media: 'image', title: 'image.alt'}, prepare: ({media, title}) => ({media, title: title || 'Mark'})},
          }),
        ],
      }),
      headingField(),
      itemsField('steps', 'Steps', 'step'),
    ]),
    pageSection('cost', 'The cost of standing still', '', [
      ...sectionHead(),
      itemsField('cards', 'Cards', 'tile'),
    ]),
    pageSection('routes', 'Ways to work with ADDD', '', [
      ...sectionHead(),
      buttonField(),
      hrefField(undefined, 'buttonHref', 'Button link'),
      headingField('E.g. “Service” (Service N°01).', 'label', 'Folder label'),
      headingField('E.g. “View service”.', 'go', 'Folder link words'),
      itemsField('cards', 'Folders', 'routeCard'),
    ]),
    pageSection('testimonials', 'Testimonials', '', [
      headingField(),
      itemsField('items', 'Quotes', 'quote'),
    ]),
    pageSection('credentials', 'Credentials', '', [
      taglineField(),
      headingField(),
      textField(),
      buttonField(),
      hrefField(undefined, 'buttonHref', 'Button link'),
      imageField(),
    ]),
    pageSection('fit', 'FAQ', '', [
      headingField(undefined, 'faqHeading', 'Heading'),
      headingField(undefined, 'forQuestion', 'First question'),
      linesField('forItems', 'First answer'),
      headingField(undefined, 'notQuestion', 'Second question'),
      linesField('notItems', 'Second answer'),
      itemsField('questions', 'More questions', 'faqItem'),
      // the comparison the questions replaced: no longer shown, kept while
      // the live site still reads them
      ...sectionHead().map((f) => ({...f, hidden: true})),
      {...headingField('The left side’s title (no longer shown).', 'forTitle', 'Left title'), hidden: true},
      {...headingField('The right side’s title (no longer shown).', 'notTitle', 'Right title'), hidden: true},
    ]),
    pageSection('research', 'Research & Insights', '', [
      // the standfirst, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      textField('A line break starts line two.', 'heading', 'Heading', 2),
      taglineField(undefined, 'signupTagline', 'Signup tagline'),
      headingField(undefined, 'signupHeading', 'Signup heading'),
    ]),
    pageSection('closingCta', 'Closing call to action', 'Shown on most pages.', [
      // the label on the left, no longer shown (2026-11-04); kept so the
      // code on main can still read it, hidden from the form
      {...taglineField('No longer shown.', 'label', 'Label'), hidden: true},
      headingField(),
      buttonField(undefined, 'primaryButton', 'First button label'),
      // the second button, no longer shown (one button since 2026-11-16)
      {...buttonField('No longer shown.', 'secondaryButton', 'Second button label'), hidden: true},
      ...closingCtaExtras,
    ]),
    navSection,
    signupSection,
    footerSection,
    bookingSection,
  ],
  preview: {prepare: () => ({title: 'Home page'})},
})

// Lists the page draws in a fixed number of places keep their length
for (const section of ['approach', 'cost', 'routes']) {
  const field = homePage.fields.find((f) => f.name === section) as {fields?: {name: string; options?: object}[]} | undefined
  const list = field?.fields?.find((f) => f.name === 'steps' || f.name === 'cards')
  if (list) list.options = {...list.options, ...FIXED}
}
