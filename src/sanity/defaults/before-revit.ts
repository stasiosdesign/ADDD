import { keyed } from './types';

/* The Before Revit page's own words (src/pages/before-revit.astro), section
   by section, as the Before Revit page document is shaped
   (studio/schemaTypes/pages/before-revit.ts). */
export const beforeRevitPage = {
  hero: {
    // the opening's words (2026-11-05, the user's brief): the label over the
    // heading, the heading, the standfirst and one button
    tagline: 'Before Revit / Early-stage design workflow',
    heading: 'Choose the right workflow before Revit.',
    lede: 'A focused research engagement for architecture practices reviewing their early-stage design tools. We assess your needs, compare the options and recommend a workflow that connects concept design to BIM.',
    primaryButton: 'Discuss your workflow',
    // no longer shown (the brief has the one button)
    secondaryButton: 'View Pricing',
    // the statement that comes up as the opening's words scroll away
    // (2026-11-04): the standfirst's own closing words, one line per line
    statement: 'The tools, information\nand decisions that shape\na project before it is modelled.',
  },
  // The rebuild (2026-11-05, the user's brief): the problem, how it works and
  // the investment, in the brief's words; the opening stays as it was
  problem: {
    heading: 'When your early-stage workflow needs rethinking.',
    tiles: keyed('problem', [
      { title: 'Outdated or unsuitable tools', text: 'Your practice is reconsidering the software it uses during early design.' },
      { title: 'Repeated work', text: 'Models and information need recreating when projects move into Revit or Archicad.' },
      { title: 'Unclear decisions', text: 'You’re unsure which tools will work together or where to invest next.' },
    ]),
  },
  method: {
    // the standfirst is no longer shown (2026-11-05)
    lede: 'The ADDD approach, applied to the start of the design process rather than the whole practice.',
    tagline: 'How it works',
    heading: 'From requirements to a clear recommendation.',
    steps: keyed('step', [
      { label: 'Understand', title: 'Establish what your practice needs.', text: 'Review how early-stage design happens today, which tools are used and what needs to carry into BIM.' },
      { label: 'Research', title: 'Evaluate the options.', text: 'Compare software and workflows against your requirements, including their strengths and limitations.' },
      { label: 'Recommend', title: 'Define the right workflow.', text: 'Recommend the tools, processes and handovers best suited to your practice, with clear next steps.' },
    ]),
  },
  pricing: {
    tagline: 'Before Revit',
    heading: 'A clear direction for early-stage design.',
    lede: 'A focused review of your tools and workflows, with independent research and recommendations tailored to your practice.',
    cards: keyed('card', [
      {
        title: 'Early-stage design workflow engagement',
        pricePrefix: 'From',
        price: '£9,500',
        includesLabel: 'What you receive',
        includes: [
          'A clear definition of your early-stage workflow requirements.',
          'An independent comparison of suitable software options.',
          'A recommended workflow into Revit or Archicad.',
          'Clear trade-offs, priorities and next steps.',
        ],
        note: 'Scope and fee are agreed following an initial conversation. This is a research and recommendation engagement, not software implementation or training.',
        button: 'Book a call',
      },
      {
        // the first panel under the prices, on to the Workflow Workshop: the
        // title, the line and the button (its price is not shown)
        title: 'Workflow Workshop',
        subtitle: 'Not sure where the problem lies? Start with a half-day review of your workflows.',
        button: 'Explore the Workflow Workshop',
      },
    ]),
    // the line over the two panels, and the second, on to the Technology
    // Blueprint
    nextHeading: 'Looking for something different?',
    blueprintTitle: 'Technology Blueprint',
    blueprintText: 'Need a practice-wide strategy? Review your technology, systems, workflows and AI together.',
    blueprintButton: 'Explore the Technology Blueprint',
  },};
