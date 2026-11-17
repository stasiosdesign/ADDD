import { keyed } from './types';

/* The Technology Blueprint page's own words
   (src/pages/technology-blueprint.astro), section by section, as the
   Technology Blueprint page document is shaped
   (studio/schemaTypes/pages/blueprint.ts). The filter buttons, the enquiry
   form's inputs and where every button and link leads stay in the page. */
export const blueprintPage = {
  seo: {
    title: 'Technology Blueprint — ADDD',
    description: 'The Technology Blueprint is a full practice-wide technology strategy for architecture practices, covering the technology ecosystem, workflows, software, infrastructure, data, security, AI and priorities.',
  },
  hero: {
    tagline: 'Technology Blueprint',
    heading: 'Six weeks to a working strategy',
    lede: 'We assess your practice’s workflows, software, data, costs and AI readiness, then build a prioritised roadmap showing what to keep, change and invest in next.',
    button: 'Start a Blueprint',
    linkLabel: 'Learn more',
    // one line here is one line of the set block (BlueprintHero.astro)
    statement: 'A collection of tools isn’t\na strategy. What matters is\nhow your people, systems\nand workflows work together.',
  },
  benefits: {
    heading: 'When Technology Has Direction',
    note: '(How ADDD Helps)',
    // a word written **so** is set bold and scrambles once as it is read
    tiles: keyed('benefit', [
      { number: '01', title: 'One Connected View', text: 'Gain **visibility** across your workflows, software, data and teams. See the gaps, dependencies and risks that isolated decisions tend to miss.' },
      { number: '02', title: 'Stop Reacting', text: 'Replace reactive technology purchases with clear **priorities**. Know what to change, what to keep and the order in which to invest.' },
      { number: '03', title: 'Recover Lost Capacity', text: 'Identify **waste** in overlapping tools, repeated work and unclear ownership. Simplify how your practice operates and recover time and budget.' },
    ]),
  },
  examine: {
    lede: 'A technology blueprint examines your practice as one connected system. We don’t isolate workflows from software, or software costs from infrastructure—everything connects.',
    tagline: 'Examine',
    heading: 'What we look at',
    // the name at the foot of each tab's panel, after the heading
    panelLabel: 'Technology Blueprint',
    cardTagline: 'Workflows',
    cardHeading: 'How work moves through your practice',
    cardText: 'We trace real project delivery from brief through to completion, finding where tools connect and where teams improvise around gaps. This reveals which workflows are intentional and which are fragile.',
    // the tabs, in order: the name on the tab, and the heading and words
    // of its panel (the first is the card's own, above)
    tabs: keyed('tab', [
      { label: 'Workflows', title: 'How work moves through your practice', text: 'We trace real project delivery from brief through to completion, finding where tools connect and where teams improvise around gaps. This reveals which workflows are intentional and which are fragile.' },
      { label: 'Software', title: 'Every tool, and what it does for you', text: 'An inventory captures every tool the practice pays for, how each is actually used and where several do the same job, so you can see which ones earn their place.' },
      { label: 'Infrastructure', title: 'What everything runs on', text: 'We assess the hardware, networks, storage and hosting your tools depend on, and where they will hold the practice back as it grows.' },
      { label: 'Data & security', title: 'Where information lives, and who can reach it', text: 'We map where project and practice data is kept, how it moves between systems and how well it is protected, so information stops being recreated or exposed.' },
      { label: 'AI capability', title: 'What AI can realistically do for you', text: 'We evaluate how ready your tools, data and people are for AI, and where it could genuinely help rather than add another tool to manage.' },
      { label: 'Costs', title: 'Where the money goes', text: 'Cost analysis shows what the practice spends on software, licences and services, and where spending overlaps or goes unused. One practice cut their software spend by 40%.' },
      { label: 'Governance', title: 'Who decides, and how', text: 'We look at who owns technology decisions, how they are made and recorded, and how roles share the work, so choices hold together as the practice grows.' },
    ]),
  },
  delivery: {
    tagline: 'Delivery',
    heading: 'From current reality to a clear roadmap',
    button: 'Explore',
    buttonHref: '/contact',
    linkLabel: 'Learn',
    steps: keyed('step', [
      { label: 'Week 1', title: 'Mobilisation', text: 'We align on scope, timeline and who participates from your practice.' },
      { label: 'Weeks 2–4', title: 'Discovery and analysis', text: 'Interviews map your workflows. Inventory captures every tool and cost. Gap analysis reveals where systems fail.' },
      { label: 'Weeks 5–7', title: 'Strategy and planning', text: 'Recommendations emerge from findings. Cost analysis shows where money goes. Priorities sequence what matters most.' },
      { label: 'Week 8', title: 'Finalisation and handover', text: 'You receive the blueprint, present it to your leadership, then move into implementation with clear next steps.' },
    ]),
    // each stage's more, opened on the roadmap (StageTimeline.astro), in
    // the steps' order; its weeks are the step's label
    details: keyed('detail', [
      { more: 'A sponsor at partner or director level takes part from the start, with whoever owns BIM, IT and operations; project leads join for the interviews.' },
      { more: 'Most of your team’s time falls here: roughly six to ten hours per participant across the eight weeks, mostly in the discovery stage.' },
      { more: 'The findings, the cost picture and the priorities are drawn together into prioritised recommendations and a sequenced two to three-year roadmap.' },
      { more: 'The written blueprint holds the findings, a cost picture, prioritised recommendations and the roadmap. The blueprint is strategy, not delivery: ongoing guidance continues through Ongoing Advisory.' },
    ]),
    // what each stage holds on the roadmap, each point marked by who does
    // it (by: you, optional; ADDD when not given), in the steps' order
    stageItems: keyed('stage', [
      { items: keyed('point', [{ label: 'Scope', by: 'addd' }, { label: 'Timeline', by: 'addd' }, { label: 'Who takes part', by: 'you' }]) },
      { items: keyed('point', [{ label: 'Workflow interviews', by: 'addd' }, { label: 'Tool and cost inventory', by: 'addd' }, { label: 'Gap analysis', by: 'addd' }]) },
      { items: keyed('point', [{ label: 'Recommendations', by: 'addd' }, { label: 'Cost analysis', by: 'addd' }, { label: 'Priorities', by: 'addd' }]) },
      { items: keyed('point', [{ label: 'The blueprint', by: 'addd' }, { label: 'Leadership presentation', by: 'you' }, { label: 'Implementation', by: 'you' }]) },
    ]),
    // the timeline, all of it in one field (2026-11-17): each stage its title,
    // its length in the unit (drawn to scale), its timing words (empty: the
    // weeks it runs) and its points; the lists above stay for the code on main
    timeline: {
      unit: 'week',
      stages: keyed('stage', [
        { title: 'Mobilisation', length: 1, items: keyed('point', [{ label: 'Scope', by: 'addd' }, { label: 'Timeline', by: 'addd' }, { label: 'Who takes part', by: 'you' }]) },
        { title: 'Discovery and analysis', length: 3, items: keyed('point', [{ label: 'Workflow interviews', by: 'addd' }, { label: 'Tool and cost inventory', by: 'addd' }, { label: 'Gap analysis', by: 'addd' }]) },
        { title: 'Strategy and planning', length: 3, items: keyed('point', [{ label: 'Recommendations', by: 'addd' }, { label: 'Cost analysis', by: 'addd' }, { label: 'Priorities', by: 'addd' }]) },
        { title: 'Finalisation and handover', length: 1, items: keyed('point', [{ label: 'The blueprint', by: 'addd' }, { label: 'Leadership presentation', by: 'you' }, { label: 'Implementation', by: 'you' }]) },
      ]),
    },
    keyAddd: 'ADDD',
    keyYou: 'Your team',
    keyOptional: 'Optional',
  },
  quote: {
    quote: 'ADAM Architecture had three separate software systems doing the same job. The blueprint showed us how to consolidate without losing capability, and we recovered nearly half a day per project.',
    name: 'Marcus Reid',
    role: 'Technology director, ADAM Architecture',
  },
  enquiry: {
    tagline: 'Investment',
    heading: 'Start here',
    lede: 'Eight weeks, tailored to your practice’s scale and complexity.',
    email: 'hello@addd.studio',
    phone: '+44 (0) 207 183 3675',
    address: 'London, United Kingdom',
    // the form's words
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us about your practice',
    consent: 'I agree to the privacy policy',
    button: 'Send',
  },
  faq: {
    heading: 'About the Blueprint',
    questions: keyed('question', [
      { question: 'Who should be involved from our side?', answer: 'A sponsor at partner or director level, plus whoever owns BIM, IT and operations. Project leads join for the interview stage. The sponsor keeps decisions moving; the others bring the detail of how the practice really works.' },
      { question: 'How much time does it take from our team?', answer: 'Roughly six to ten hours per participant across the eight weeks, mostly in the discovery stage. Interviews are arranged around project deadlines, and existing documents are reviewed first so time with your team is spent on what only they can answer.' },
      { question: 'What do we actually receive?', answer: 'A written blueprint with findings, a cost picture, prioritised recommendations and a sequenced two to three-year roadmap. It is presented to your leadership, so the people who fund the changes hear the reasoning first-hand.' },
      { question: 'Do you implement the roadmap?', answer: 'The blueprint is strategy, not delivery. Ongoing strategic guidance continues through Ongoing Advisory. Where vendors or partners carry out the work, the roadmap gives them a clear brief to start from.' },
      { question: 'Should we start with a workshop instead?', answer: 'If the problem is isolated to one workflow or project, start with a workshop. If it spans the practice, start here. A workshop’s findings can also become the starting point for a blueprint later.' },
    ]),
    footLine: 'Have any other questions?',
  },
};
