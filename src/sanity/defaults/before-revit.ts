import { keyed } from './types';

/* The Before Revit page's own words (src/pages/before-revit.astro), section
   by section, as the Before Revit page document is shaped
   (studio/schemaTypes/pages/before-revit.ts). The page's eight sections
   (2026-11-05, the second rebuild, from the user's full brief): the
   opening, the challenge, the scope, the method, the output, why ADDD, the
   investment and the common questions. */
export const beforeRevitPage = {
  hero: {
    // the label over the heading, the heading (a line break where its
    // second line starts), the standfirst and the two buttons
    tagline: 'Before Revit / Early-stage design workflow',
    heading: 'Find the right workflow\nbefore Revit.',
    lede: 'For architecture practices rethinking their early-stage design tools. ADDD researches the options and recommends a workflow that connects concept design to BIM.',
    primaryButton: 'Discuss your workflow',
    // scrolls down to the method (#how-it-works)
    secondaryButton: 'How it works',
    // the statement that comes up as the opening's words scroll away
    // (2026-11-04), one line per line
    statement: 'The tools, information\nand decisions that shape\na project before it is modelled.',
  },
  problem: {
    tagline: 'The challenge',
    heading: 'When early-stage design needs a rethink.',
    lede: 'Your current tools may no longer be the best fit. But deciding what should replace them, and how everything should connect, isn’t straightforward.',
    tiles: keyed('problem', [
      { title: 'Tools that no longer fit', text: 'Your practice is reconsidering the software it uses for concept design and feasibility.' },
      { title: 'Work that gets repeated', text: 'Models and information are recreated when projects move into Revit or Archicad.' },
      { title: 'Too many possible options', text: 'There are plenty of new tools, but no clear way to decide which ones suit your practice.' },
    ]),
  },
  // What ADDD examines: the four focus areas as the Technology Blueprint's
  // tabs, each its name on the tab and its line as the panel's heading
  scope: {
    tagline: 'The scope',
    heading: 'The whole workflow, not just the software.',
    lede: 'We examine what your practice needs from early-stage design, which tools can support it and how the work connects to what comes next.',
    areas: keyed('area', [
      { title: 'Concept and feasibility', text: 'How ideas, design options and information are developed during the early stages.' },
      { title: 'Existing tools', text: 'What your team uses today, where it works well and where alternatives may help.' },
      { title: 'Moving into BIM', text: 'What needs to carry forward into Revit or Archicad, and what currently gets lost or recreated.' },
      { title: 'Practical requirements', text: 'Your project types, team capabilities, costs and the constraints that shape a workable solution.' },
    ]),
  },
  method: {
    tagline: 'The method',
    heading: 'Research before recommendation.',
    lede: 'A structured process that moves from understanding your requirements to identifying a suitable way forward.',
    steps: keyed('step', [
      { label: 'Understand', title: 'Define what your practice needs.', text: 'Review current workflows, speak with the relevant people and establish what early-stage design needs to achieve.' },
      { label: 'Research', title: 'Evaluate the available options.', text: 'Compare suitable software and workflows against your requirements, including their strengths, limitations and trade-offs.' },
      { label: 'Recommend', title: 'Set out the right approach.', text: 'Recommend how the tools should work together, what needs to carry into BIM and which changes to prioritise.' },
    ]),
  },
  // What the practice receives: the four deliverables as the homepage's
  // banded cards, and the line under them
  output: {
    tagline: 'The output',
    heading: 'A clear recommendation you can act on.',
    lede: 'A documented basis for deciding what to keep, what to change and how your early-stage workflow should operate.',
    deliverables: keyed('deliverable', [
      { title: 'Requirements brief', text: 'A clear definition of what your early-stage design workflow needs to achieve.' },
      { title: 'Software options assessment', text: 'Suitable tools compared against your requirements, with their advantages and limitations.' },
      { title: 'Recommended workflow', text: 'A proposed approach showing how tools and information should connect from concept design into BIM.' },
      { title: 'Prioritised next steps', text: 'Clear recommendations on what to change first and what needs further consideration.' },
    ]),
    statement: 'The aim is to give your practice a clear direction before committing to new software, processes or implementation.',
  },
  why: {
    tagline: 'Why ADDD',
    heading: 'Architectural knowledge. Independent judgement.',
    lede: 'ADDD is led by Allister Lewis, an architect, BIM specialist and AEC technology advisor with more than 20 years of industry experience.',
    text: 'We assess technology in the context of how architecture practices actually design and deliver projects, rather than recommending software in isolation.',
    points: keyed('point', [
      { title: 'Grounded in practice', text: 'Recommendations reflect real architectural workflows, not just software features.' },
      { title: 'Independent advice', text: 'Software recommendations are based on your requirements, never paid product placements.' },
    ]),
  },
  pricing: {
    tagline: 'Investment',
    heading: 'Before Revit',
    lede: 'A focused research engagement to help your practice choose and structure its early-stage design workflow.',
    cards: keyed('card', [
      {
        title: 'Early-stage design workflow research',
        pricePrefix: 'From',
        price: '£9,500',
        // under the button
        subtitle: 'Scope and pricing are agreed following an initial conversation.',
        includesLabel: 'What you receive',
        includes: [
          'Independent research into suitable software options.',
          'A clear assessment of your workflow requirements.',
          'A recommended approach from concept design into BIM.',
          'Practical priorities and next steps.',
        ],
        note: 'This is a research and recommendation engagement. Software implementation and training are not included.',
        button: 'Book a call',
      },
      {
        // the first panel under the prices, on to the Workflow Workshop:
        // the question over it, the title, the line and the button (its
        // price is not shown)
        badge: 'Not sure where the problem lies?',
        title: 'Workflow Workshop',
        subtitle: 'Start with a half-day review to identify where your workflows need attention.',
        button: 'Explore the Workshop',
      },
    ]),
    // no longer shown (2026-11-05: each panel has its own question)
    nextHeading: 'Looking for something different?',
    // the second panel, on to the Technology Blueprint
    blueprintQuestion: 'Need a practice-wide technology strategy?',
    blueprintTitle: 'Technology Blueprint',
    blueprintText: 'Review software, infrastructure, workflows and AI across your entire practice.',
    blueprintButton: 'Explore the Blueprint',
  },
  faq: {
    tagline: 'Common questions',
    heading: 'Before you get started.',
    questions: keyed('question', [
      { question: 'Is Before Revit only for practices using Revit?', answer: 'No. The engagement focuses on early-stage design before projects move into a BIM environment. We can also consider workflows into Archicad.' },
      { question: 'Do we need to know which software we want to replace?', answer: 'No. The research helps establish whether you need different tools, a better-connected workflow or changes to your existing setup.' },
      { question: 'Does ADDD implement the recommended software?', answer: 'No. Before Revit focuses on research and recommendations. Implementation and software training are separate from this engagement.' },
      { question: 'How is the final price determined?', answer: 'The starting price is £9,500. The final fee depends on your practice’s requirements, size and the scope of the research.' },
    ]),
  },
  // the closing call to action's one button (ClosingCta.astro: its heading
  // is the Home page's); it opens the free call's calendar
  closing: {
    button: 'Discuss your early-stage workflow',
  },
};
