import { keyed } from './types';

/* The Technology Blueprint page's own words
   (src/pages/technology-blueprint.astro), section by section, as the
   Technology Blueprint page document is shaped
   (studio/schemaTypes/pages/blueprint.ts). The filter buttons, the enquiry
   form's inputs and where every button and link leads stay in the page. */
export const blueprintPage = {
  hero: {
    tagline: 'Technology Blueprint',
    heading: 'Eight weeks to a working strategy',
    lede: 'A technology blueprint is how established architecture practices move from scattered tools and unclear spending to a sequenced roadmap that works. It is the full practice-wide technology strategy: we examine your technology ecosystem, workflows, software and licensing costs, infrastructure, data, security, roles and AI readiness, then hand you back clear priorities you can actually act on. One practice cut their software spend by 40% and reclaimed two days a week. That’s what happens when you see what you actually have.',
    button: 'Enquire',
    linkLabel: 'Learn more',
  },
  benefits: {
    tiles: keyed('benefit', [
      { number: '01', tagline: 'Coherence', title: 'One reliable view of the practice', text: 'Most practices operate in silos, with each department making technology choices independently. A blueprint connects those choices into one coherent picture, so you understand how decisions in one area affect everything else.' },
      { number: '02', tagline: 'Direction', title: 'Stop reacting to every problem', text: 'Without strategy, you buy software when pressure builds and hope it fits with what you already have. A blueprint lets you choose tools that serve your actual direction instead of chasing problems as they emerge.' },
      { number: '03', tagline: 'Efficiency', title: 'Eliminate waste and reclaim capacity', text: 'Overlapping tools, parallel workflows and unclear ownership drain money and time without anyone tracking it. A blueprint finds that waste and shows you exactly what to change to recover both.' },
    ]),
  },
  examine: {
    lede: 'A technology blueprint examines your practice as one connected system. We don’t isolate workflows from software, or software costs from infrastructure—everything connects.',
    tagline: 'Examine',
    heading: 'What we look at',
    cardTagline: 'Workflows',
    cardHeading: 'How work moves through your practice',
    cardText: 'We trace real project delivery from brief through to completion, finding where tools connect and where teams improvise around gaps. This reveals which workflows are intentional and which are fragile.',
  },
  delivery: {
    tagline: 'Delivery',
    heading: 'From current reality to a clear roadmap',
    button: 'Explore',
    linkLabel: 'Learn',
    steps: keyed('step', [
      { label: 'Week 1', title: 'Mobilisation', text: 'We align on scope, timeline and who participates from your practice.' },
      { label: 'Weeks 2–4', title: 'Discovery and analysis', text: 'Interviews map your workflows. Inventory captures every tool and cost. Gap analysis reveals where systems fail.' },
      { label: 'Weeks 5–7', title: 'Strategy and planning', text: 'Recommendations emerge from findings. Cost analysis shows where money goes. Priorities sequence what matters most.' },
      { label: 'Week 8', title: 'Finalisation and handover', text: 'You receive the blueprint, present it to your leadership, then move into implementation with clear next steps.' },
    ]),
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
    button: 'Send',
  },
  faq: {
    heading: 'Answers',
    questions: keyed('question', [
      { question: 'Who should be involved from our side?', answer: 'A sponsor at partner or director level, plus whoever owns BIM, IT and operations. Project leads join for the interview stage.' },
      { question: 'How much time does it take from our team?', answer: 'Roughly six to ten hours per participant across the eight weeks, mostly in the discovery stage.' },
      { question: 'What do we actually receive?', answer: 'A written blueprint with findings, a cost picture, prioritised recommendations and a sequenced two to three-year roadmap.' },
      { question: 'Do you implement the roadmap?', answer: 'The blueprint is strategy, not delivery. Ongoing strategic guidance continues through ADDDvisory.' },
      { question: 'Should we start with a workshop instead?', answer: 'If the problem is isolated to one workflow or project, start with a workshop. If it spans the practice, start here.' },
    ]),
  },
};
