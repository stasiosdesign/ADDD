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
    pageSection('hero', 'Opening', '', [
      taglineField(),
      headingField(),
      leadField(),
      buttonField(undefined, 'button'),
      hrefField('Also each stack’s default link.', 'buttonHref', 'Free Stack link'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'Scrolls to How it works.'}),
      defineField({name: 'legend', title: 'How to read the cards', type: 'text', rows: 2, description: 'Not shown on the page.'}),
    ]),
    // the stacks themselves (2026-11-16: a collection before; part of the
    // page now, in its order)
    pageSection('stacks', 'Tech stacks', '', [
      itemsField('items', 'Stacks', 'techStackItem'),
    ]),
    pageSection('sheet', 'Views, list and sheet', '{n} is a number, {stage} “stage(s)”, {stack} the stack’s name.', [
      headingField(undefined, 'view3d', 'Row button'),
      headingField(undefined, 'viewList', 'List button'),
      headingField('E.g. “{n} stages · {locked} locked”.', 'listCount', 'List block count'),
      headingField(undefined, 'listOpen', 'List block link'),
      headingField('E.g. “Stack · {n} stages”.', 'kicker', 'Sheet count'),
      headingField('E.g. “{n} locked”.', 'lockedCount', 'Sheet locked count'),
      headingField(undefined, 'allOpen', 'Sheet all open'),
      headingField(undefined, 'locked', 'Locked'),
      headingField(undefined, 'lockedLink', 'Locked stage link'),
      headingField(undefined, 'alternatives', 'Alternatives label'),
      headingField(undefined, 'noteLabel', 'Note label'),
      headingField('When stages are locked.', 'unlockTitle', 'Unlock title'),
      textField(undefined, 'unlockText', 'Unlock text', 3),
      headingField('When no stage is locked.', 'openTitle', 'Open title'),
      textField(undefined, 'openText', 'Open text', 2),
      buttonField(),
    ]),
    pageSection('fit', 'Who it’s for', '', [
      ...sectionHead(),
      itemsField('tiles', 'Cards', 'tile'),
      itemsField('alternatives', 'Outlined cards', 'tile', 'Link to the Workflow Workshop, then the Technology Blueprint.'),
    ]),
    pageSection('method', 'How it works', '', [
      ...sectionHead(),
      itemsField('steps', 'Stages', 'step'),
      buttonField('Links to Contact.', 'button'),
      defineField({name: 'linkLabel', title: 'Link label', type: 'string', description: 'Links to the Technology Blueprint.'}),
    ]),
    pageSection('next', 'Where it leads', '', [
      leadField(),
      headingField(),
      itemsField('tiles', 'Cards', 'tile', 'Link to the Workshop, Blueprint and Advisory pages.'),
    ]),
  ],
  preview: {prepare: () => ({title: 'Tech Stacks page'})},
})
