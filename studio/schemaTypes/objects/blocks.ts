import {defineField, defineType} from 'sanity'
import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {CommentIcon} from '@sanity/icons/Comment'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {ListIcon} from '@sanity/icons/List'
import {SquareIcon} from '@sanity/icons/Square'
import {TagIcon} from '@sanity/icons/Tag'
import {BlockItem} from '@stasiosdesign/sanity-cms'
import {buttonField, imageField, linesField, textField} from '../shared/fields'

/* The repeatable blocks of the pages: each a framed block in its list, edited
   within the page (BlockItem), never a CMS collection of its own. A page's
   list of them replaces the page's own list once it has any; while it is
   empty the page keeps the blocks it was built with. */

/** A card in a grid: a title and a line of text, with an optional tagline, number, picture and text link */
export const tile = defineType({
  name: 'tile',
  title: 'Card',
  type: 'object',
  icon: SquareIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'number', title: 'Number', type: 'string', description: 'A small number above the card, where the design shows one (01, 02…).'}),
    defineField({name: 'tagline', title: 'Tagline', type: 'string', description: 'The small line above the title, where the design shows one.'}),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    textField('The card’s text.'),
    defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'The text link at the foot of the card, where the design shows one; where it leads stays in the site’s code.'}),
    imageField('The picture at the top of the card, where the design shows one.'),
  ],
  preview: {select: {title: 'title', subtitle: 'text', media: 'image'}},
})

/** One step of a numbered or labelled sequence: its label, title and text */
export const step = defineType({
  name: 'step',
  title: 'Step',
  type: 'object',
  icon: ListIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', description: 'The small label on the left: Prepare, Week 1, Stage one…'}),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    textField('The step’s text.'),
  ],
  preview: {select: {title: 'title', subtitle: 'label'}},
})

/** One question of a FAQ and its answer */
export const faqItem = defineType({
  name: 'faqItem',
  title: 'Question',
  type: 'object',
  icon: HelpCircleIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string'}),
    defineField({name: 'answer', title: 'Answer', type: 'text', rows: 3}),
  ],
  preview: {select: {title: 'question', subtitle: 'answer'}},
})

/** A testimonial: the quote, who said it, and their practice’s logo */
export const quote = defineType({
  name: 'quote',
  title: 'Quote',
  type: 'object',
  icon: CommentIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 3, description: 'Without quotation marks: the design adds them.'}),
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'role', title: 'Role', type: 'string', description: 'Their role and practice, e.g. “Operations director, ADAM Architecture”.'}),
    defineField({
      name: 'client',
      title: 'Logo',
      type: 'reference',
      to: [{type: 'client'}],
      description: 'The practice whose logo shows beside the quote, from the logo strip’s clients.',
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'quote'}},
})

/** A price card: the offer, its price and what it includes */
export const priceCard = defineType({
  name: 'priceCard',
  title: 'Price card',
  type: 'object',
  icon: TagIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'subtitle', title: 'Line under the title', type: 'text', rows: 2}),
    defineField({name: 'pricePrefix', title: 'Before the price', type: 'string', description: 'E.g. “From”. Leave empty for none.'}),
    defineField({name: 'price', title: 'Price', type: 'string', description: 'As shown, e.g. “£1,995”.'}),
    defineField({name: 'priceSuffix', title: 'After the price', type: 'string', description: 'E.g. “/mo”. Leave empty for none.'}),
    defineField({name: 'note', title: 'Note under the price', type: 'string', description: 'E.g. “From January 2027”. Leave empty for none.'}),
    defineField({name: 'includesLabel', title: 'List label', type: 'string', description: 'The small line above the list, e.g. “Includes”.'}),
    linesField('includes', 'What it includes', 'One line per item.'),
    buttonField('Where the button leads stays in the site’s code.'),
  ],
  preview: {select: {title: 'title', subtitle: 'price'}},
})

/** A row of a comparison table: what is compared, and each side’s answer */
export const compareRow = defineType({
  name: 'compareRow',
  title: 'Row',
  type: 'object',
  icon: BlockContentIcon,
  components: {item: BlockItem},
  fields: [
    defineField({name: 'label', title: 'What is compared', type: 'string'}),
    defineField({name: 'ours', title: 'ADDD', type: 'string'}),
    defineField({name: 'others', title: 'Other', type: 'string'}),
  ],
  preview: {select: {title: 'label', subtitle: 'ours'}},
})
