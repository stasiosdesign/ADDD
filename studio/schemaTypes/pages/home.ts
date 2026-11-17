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
    pageSection('hero', 'Opening', 'The opening: the standfirst and tagline on the left, the headline and its two buttons on the right. The pattern behind them stays in the code.', [
      taglineField(),
      textField('On two lines: a line break written here starts the second.', 'heading', 'Heading', 2),
      linesField('headingWords', 'Changing words', 'The words that take turns in the headline, one per line, in order. The first must appear in the headline exactly as written there; the others replace it in turn. Leave one or none for a headline that stays still.'),
      leadField(),
      buttonField('Where it leads: First button link.', 'primaryButton', 'First button label'),
      hrefField('Where the first button leads.', 'primaryHref', 'First button link'),
      buttonField('Where it leads: Second button link.', 'secondaryButton', 'Second button label'),
      hrefField('Where the second button leads.', 'secondaryHref', 'Second button link'),
      linesField('fieldWords', 'Words over the pattern', 'The ten words scattered over the pattern, one per line: each line has its own place, so the first word stands where “BIM” does.'),
      linesField('screenWords', 'Words lower down', 'The ten words on the lower part of the screen, one per line, each in its own place.'),
      textField('The text the pattern behind the opening is drawn in, each subject separated by ·. It also shows behind the logo intro on the first visit.', 'fieldText', 'Pattern text', 3),
    ]),
    pageSection('logos', 'Logo strip', 'The title above the logos, and the logos themselves, in order. Each opens the client to change its name or mark.', [
      textField('The title above the strip. On two lines: a line break written here starts the second.', 'title', 'Title', 2),
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
      buttonField('The button under the statement.'),
      hrefField('Where the button under the statement leads.', 'buttonHref', 'Button link'),
      defineField({
        name: 'marks',
        title: 'Software marks',
        type: 'array',
        description: 'The marks lit in turn round the statement while it is held: they take turns in its six places (the first, the second, the first again…).',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'statementMark',
            title: 'Mark',
            fields: [imageField('The mark, on a dark square.')],
            preview: {select: {media: 'image', title: 'image.alt'}, prepare: ({media, title}) => ({media, title: title || 'Mark'})},
          }),
        ],
      }),
      headingField('The heading centred over the three steps.'),
      itemsField('steps', 'Steps', 'step', 'The three steps: Understand, Diagnose, Prioritise. Edit what each says; there are always three.'),
    ]),
    pageSection('cost', 'The cost of standing still', 'The heading row and the three cards with their pictures.', [
      ...sectionHead('The standfirst on the left.'),
      itemsField('cards', 'Cards', 'tile', 'The three cards, left to right: the picture, the title and the line of text.'),
    ]),
    pageSection('routes', 'Ways to work with ADDD', 'The heading held on the left with the button under it, and the four route cards. Where the button and each card lead stays in the code.', [
      ...sectionHead(),
      buttonField('Under the heading.'),
      hrefField('Where the button under the heading leads.', 'buttonHref', 'Button link'),
      headingField('The word before each folder’s number, e.g. “Service” (Service N°01).', 'label', 'Folder label'),
      headingField('The way on at each folder’s foot, e.g. “View service”.', 'go', 'Folder link words'),
      itemsField('cards', 'Folders', 'routeCard', 'The four routes, top to bottom: each folder’s words, format, kind, sheet and where it leads.'),
    ]),
    pageSection('testimonials', 'Testimonials', 'The title and the quotes, in the order they turn through.', [
      headingField('The small title above the quotes.'),
      itemsField('items', 'Quotes', 'quote'),
    ]),
    pageSection('credentials', 'Credentials', 'The tagline, heading, paragraph and button beside the two pictures.', [
      taglineField(),
      headingField(),
      textField('The paragraph.'),
      buttonField('Where it leads: Button link.'),
      hrefField('Where the button leads.', 'buttonHref', 'Button link'),
      imageField('The photograph beside the words. Without one, the page shows its grey placeholder.'),
    ]),
    pageSection('fit', 'FAQ', 'The questions near the foot of the page: the heading, two questions, each answered by its list (who ADDD is for, and who it is not primarily for), then further questions, each with its answer. All start closed.', [
      headingField('The heading beside the questions.', 'faqHeading', 'Heading'),
      headingField('The first question.', 'forQuestion', 'First question'),
      linesField('forItems', 'First answer', 'One point per line.'),
      headingField('The second question.', 'notQuestion', 'Second question'),
      linesField('notItems', 'Second answer', 'One point per line.'),
      itemsField('questions', 'More questions', 'faqItem', 'The questions after the two above, in order, each with its answer.'),
      // the comparison the questions replaced: no longer shown, kept while
      // the live site still reads them
      ...sectionHead().map((f) => ({...f, hidden: true})),
      {...headingField('The left side’s title (no longer shown).', 'forTitle', 'Left title'), hidden: true},
      {...headingField('The right side’s title (no longer shown).', 'notTitle', 'Right title'), hidden: true},
    ]),
    pageSection('research', 'Research & Insights', 'The heading above the slider of reports and issues (which are collections), and the newsletter signup under it.', [
      // the standfirst, no longer shown (2026-11-05)
      {...leadField('No longer shown.'), hidden: true},
      textField('On two lines: a line break written here starts the second.', 'heading', 'Heading', 2),
      taglineField('The small line above the signup’s heading.', 'signupTagline', 'Signup tagline'),
      headingField('The signup’s heading.', 'signupHeading', 'Signup heading'),
    ]),
    pageSection('closingCta', 'Closing call to action', 'The block that ends this page and most others: a change here shows on all of them. AEC Tech Partners has its own.', [
      // the label on the left, no longer shown (2026-11-04); kept so the
      // code on main can still read it, hidden from the form
      {...taglineField('No longer shown.', 'label', 'Label'), hidden: true},
      headingField(),
      buttonField('Where it leads: the Button link below.', 'primaryButton', 'First button label'),
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
