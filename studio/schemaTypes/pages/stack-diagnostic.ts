import {defineField, defineType} from 'sanity'
import {SearchIcon} from '@sanity/icons/Search'
import {buttonField, headingField, hrefField, itemsField, leadField, pageSection, sectionHead, taglineField, textField, seoSection} from '../shared/fields'

/* The Tech Stacks page (Free Tech Stacks), one section per part of the
   page, in the order the page shows them (src/pages/stack-diagnostic.astro;
   the page's own words in src/sanity/defaults/stack-diagnostic.ts). The
   navigation, the footer, the chevron icons and where every button and text
   link leads stay in the site's code. A singleton with the fixed ID
   "stackDiagnosticPage". */

export const stackDiagnosticPage = defineType({
  name: 'stackDiagnosticPage',
  title: 'Tech Stacks page',
  type: 'document',
  icon: SearchIcon,
  fields: [
    seoSection(),
    pageSection('hero', 'Opening', 'The opening: the tagline and headline on the left, the standfirst, its button and the text link beside it on the right.', [
      taglineField(),
      headingField(),
      leadField('The line under the title: what the page is, in one sentence.'),
      buttonField('The Free Stack button, in the screen’s bottom-right corner.', 'button'),
      hrefField('Where the Free Stack button leads, and every stack’s way into the app unless it has its own: the ADDD app’s sign-up. Opens in a new tab.', 'buttonHref', 'Free Stack link'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'The text link beside the button; it scrolls down to How it works on this page.'}),
      defineField({name: 'legend', title: 'How to read the cards', type: 'text', rows: 2, description: 'Not shown on the page since 2026-11-04 (the cards and the stacks say it themselves); kept for later.'}),
    ]),
    // the stacks themselves (2026-11-16: a collection before; part of the
    // page now, in its order)
    pageSection('stacks', 'Tech stacks', 'The stacks on the page, in the order they stand in the row and the list: each its name, its lines and its stages, each stage a card. Add a stack to add a run of cards; a locked stage keeps its tool in the ADDD app.', [
      itemsField('items', 'Stacks', 'techStackItem', 'Drag to reorder; the first stands first on the page.'),
    ]),
    pageSection('sheet', 'Views, list and sheet', 'The words round the stacks: the switch between the row and the list, the list’s blocks, and the sheet a stack opens into. In a sentence, {n} is a number, {stage} “stage” or “stages” to go with it, and {stack} the stack’s name.', [
      headingField('The switch’s first button: the row of cards.', 'view3d', 'Row button'),
      headingField('The switch’s second button: the list.', 'viewList', 'List button'),
      headingField('At the top of each block in the list, e.g. “{n} stages · {locked} locked”.', 'listCount', 'List block count'),
      headingField('At the foot of each block in the list.', 'listOpen', 'List block link'),
      headingField('At the top of a sheet, e.g. “Stack · {n} stages”.', 'kicker', 'Sheet count'),
      headingField('Beside it, when stages are locked, e.g. “{n} locked”.', 'lockedCount', 'Sheet locked count'),
      headingField('Beside it, when none is.', 'allOpen', 'Sheet all open'),
      headingField('On a locked stage’s card, in the row and the sheet.', 'locked', 'Locked'),
      headingField('The link on a locked stage in the sheet.', 'lockedLink', 'Locked stage link'),
      headingField('Before a tool’s alternatives.', 'alternatives', 'Alternatives label'),
      headingField('Over a stack’s note.', 'noteLabel', 'Note label'),
      headingField('The sheet’s last box, when stages are locked.', 'unlockTitle', 'Unlock title'),
      textField('Under it.', 'unlockText', 'Unlock text', 3),
      headingField('The sheet’s last box, when no stage is locked.', 'openTitle', 'Open title'),
      textField('Under it.', 'openText', 'Open text', 2),
      buttonField('The button in the sheet’s last box; it leads where the stack’s way in does.'),
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
      itemsField('tiles', 'Cards', 'tile', 'The three cards, left to right: a title, a line of text and the text link. They link to the Workflow Workshop, the Technology Blueprint and Ongoing Advisory.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Tech Stacks page'})},
})
