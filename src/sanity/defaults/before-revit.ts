import { keyed } from './types';

/* The Before Revit page's own words (src/pages/before-revit.astro), section
   by section, as the Before Revit page document is shaped
   (studio/schemaTypes/pages/before-revit.ts). */
export const beforeRevitPage = {
  hero: {
    tagline: 'Before Revit',
    heading: 'Early-stage design workflow',
    lede: 'An engagement for practices reviewing what happens in the early stages of design, before the work moves into Revit or Archicad: the tools, information and decisions that shape a project before it is modelled.',
    primaryButton: 'Inquire',
    secondaryButton: 'View Pricing',
    // the statement that comes up as the opening's words scroll away
    // (2026-11-04): the standfirst's own closing words, one line per line
    statement: 'The tools, information\nand decisions that shape\na project before it is modelled.',
  },
  method: {
    lede: 'The ADDD approach, applied to the start of the design process rather than the whole practice.',
    tagline: 'Method',
    heading: 'How it works',
    steps: keyed('step', [
      { label: 'Understand', title: 'Map early-stage design as it actually happens', text: 'How work, tools, information and decisions move through the early stages of design, not how they are supposed to.' },
      { label: 'Diagnose', title: 'Trace what carries forward and what is lost', text: 'Where early design work connects to what follows in Revit or Archicad, and where it is recreated or lost on the way.' },
      { label: 'Prioritise', title: 'Decide what should change first', text: 'Clear priorities for the early-stage workflow: what should change first, who should own it and where investment will have the most impact.' },
    ]),
  },
  pricing: {
    tagline: 'Investment',
    heading: 'Before Revit',
    // the standfirst under the heading (2026-11-05)
    lede: 'The ADDD approach applied to the start of the design process, before the work moves into Revit or Archicad.',
    cards: keyed('card', [
      {
        title: 'Before Revit',
        badge: 'Engagement',
        subtitle: 'Early-stage design workflow',
        pricePrefix: 'From',
        price: '£9,500',
        includesLabel: 'Includes',
        includes: [
          'Early-stage workflow map — how work, tools, information and decisions move before modelling',
          'Handover review — what carries forward into Revit or Archicad, and what is recreated or lost',
          'Clear priorities — what should change first, who should own it and where investment counts most',
        ],
        button: 'Enquire about Before Revit',
      },
      {
        // shown since 2026-11-05 as a panel on to the Workflow Workshop under
        // the prices: the title, the line and the button (not the price)
        title: 'Not sure where to start?',
        subtitle: 'The Workflow Workshop is a half-day diagnostic using a live project, for when something is not working but the starting point is unclear.',
        price: '£1,995',
        button: 'Explore the Workflow Workshop',
      },
    ]),
    // the panel on to the Technology Blueprint under the prices (2026-11-05)
    blueprintTitle: 'Need the whole practice in view?',
    blueprintText: 'The Technology Blueprint reviews workflows, software, infrastructure and AI across the practice, and sets out a roadmap to follow.',
    blueprintButton: 'Explore the Technology Blueprint',
  },
};
