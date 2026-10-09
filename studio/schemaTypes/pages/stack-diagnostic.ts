import {defineField, defineType} from 'sanity'
import {SearchIcon} from '@sanity/icons/Search'
import {buttonField, headingField, itemsField, leadField, pageSection, sectionHead, taglineField} from '../shared/fields'

/* The Stack Diagnostic page (Free Tech Stacks), one section per part of the
   page, in the order the page shows them (src/pages/stack-diagnostic.astro;
   the page's own words in src/sanity/defaults/stack-diagnostic.ts). The
   navigation, the footer, the chevron icons and where every button and text
   link leads stay in the site's code. A singleton with the fixed ID
   "stackDiagnosticPage". */

export const stackDiagnosticPage = defineType({
  name: 'stackDiagnosticPage',
  title: 'Stack Diagnostic page',
  type: 'document',
  icon: SearchIcon,
  fields: [
    pageSection('hero', 'Opening', 'The opening: the tagline and headline on the left, the standfirst, its button and the text link beside it on the right.', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField('Opens the Free Stack sign-up (app.addd.io) in a new tab.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'The text link beside the button; it scrolls down to How it works on this page.'}),
    ]),
    pageSection('fit', 'Who it’s for', 'The heading row, the three cards on who the diagnostic suits, and the two outlined cards pointing elsewhere. Where each outlined card’s link leads stays in the site’s code.', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title and a line of text each.'),
      itemsField('alternatives', 'Outlined cards', 'tile', 'The two outlined cards under them: a title, a line of text and the text link. The first links to the Workflow Workshop, the second to the Technology Blueprint.'),
    ]),
    pageSection('method', 'How it works', 'The heading row, the four stages, and the button and text link under them. Where they lead stays in the site’s code.', [
      ...sectionHead(),
      itemsField('steps', 'Stages', 'step', 'The four stages, top to bottom: the small label, the title and the text.'),
      buttonField('Links to the Contact page.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'The text link beside the button; it links to the Technology Blueprint.'}),
    ]),
    pageSection('next', 'Where it leads', 'The heading row and the three cards on what practices do next. Where each card’s link leads stays in the site’s code.', [
      leadField(),
      headingField(),
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title, a line of text and the text link. They link to the Workflow Workshop, the Technology Blueprint and ADDDvisory.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Stack Diagnostic page'})},
})
