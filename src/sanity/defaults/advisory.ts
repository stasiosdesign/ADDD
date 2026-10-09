import { keyed } from './types';

/* The ADDDvisory page's own words (src/pages/advisory.astro), section by
   section, as the ADDDvisory page document is shaped
   (studio/schemaTypes/pages/advisory.ts). The four picture slots under
   Themes Covered are empty until pictures are set in the Studio. */
export const advisoryPage = {
  hero: {
    tagline: 'ADDDvisory',
    heading: 'Ongoing strategic guidance for architecture practices',
    lede: 'After or alongside the main strategic work, ADDDvisory gives practice leaders a regular place to make sense of AI, BIM, software, workflows and digital priorities—before isolated decisions create more complexity.',
    primaryButton: 'Enquire',
    secondaryButton: 'Membership Pricing',
  },
  statement: {
    statement: 'Architecture practices live in a cycle of technology decisions, but the people making them are pulled in too many directions to think clearly',
  },
  structure: {
    lede: 'Predictability matters. Your practice knows when to expect guidance, what to prepare, and how to build on the month before. No surprises, no scrambling.',
    tagline: 'Structure',
    heading: 'How it Works',
    tiles: keyed('tile', [
      { title: 'One focused live session', text: 'A 60-minute monthly advisory session centred on a strategic issue affecting architecture practices.' },
      { title: 'A rotating theme', text: 'Each session explores a relevant area of technology, workflow, digital leadership or practice performance.' },
      { title: 'Practical frameworks', text: 'Use decision frameworks, comparisons and supporting resources informed by ADDD’s work inside real practices.' },
      { title: 'Questions between sessions', text: 'Raise limited follow-up questions through a shared channel as related decisions emerge.' },
      { title: 'One practice membership', text: 'Relevant directors, operations leaders and digital or BIM leads can participate under the same membership.' },
    ]),
  },
  themes: {
    lede: 'Each month rotates based on what matters to your practice',
    heading: 'Themes Covered',
  },
  impact: {
    lede: 'Monthly sessions compound. Better decisions now mean better foundations later.',
    tagline: 'Impact',
    heading: 'What your practice gains over time',
    tiles: keyed('tile', [
      { number: '01', tagline: 'Clearer priorities', title: 'Stop chasing everything', text: 'You know which technology decisions matter most to your practice right now. The noise quiets down.' },
      { number: '02', tagline: 'Stronger alignment', title: 'One shared view', text: 'Directors, operations and digital leads work from the same picture instead of separate assumptions.' },
      { number: '03', tagline: 'Better judgement', title: 'Decide with evidence', text: 'Frameworks and comparisons replace vendor claims as the basis for what you choose.' },
      { number: '04', tagline: 'Less reactive work', title: 'Fewer emergencies', text: 'Problems get anticipated and sequenced rather than solved under pressure.' },
    ]),
  },
  difference: {
    lede: 'Most advisory stops at recommendations. We stay for the decisions.',
    tagline: 'Difference',
    heading: 'Why ADDDvisory stands apart',
    rows: keyed('row', [
      { label: 'Diagnoses root causes, not symptoms', ours: 'Ongoing', others: 'One-off' },
      { label: 'Understands your entire practice context', ours: 'Yes', others: 'Partial' },
      { label: 'Prioritises and sequences decisions', ours: 'Yes', others: 'No' },
      { label: 'Builds your own decision-making framework', ours: 'Yes', others: 'No' },
      { label: 'Speaks architecture, not just technology', ours: 'Yes', others: 'No' },
    ]),
  },
  pricing: {
    lede: 'One practice membership, month to month',
    tagline: 'Pricing',
    heading: 'Membership pricing',
    cards: keyed('card', [
      {
        title: 'ADDDvisory membership',
        subtitle: 'Full access, month to month',
        price: '£1,250',
        priceSuffix: '/mo',
        note: 'From January 2027',
        includes: [
          'One 60-minute session monthly',
          'Rotating strategic themes',
          'Practical frameworks and guides',
          'Limited questions between sessions',
          'Team access included',
        ],
        button: 'Enquire about ADDDvisory',
      },
      {
        title: 'Technology Blueprint',
        subtitle: 'The practice-wide strategy ADDDvisory follows or runs alongside',
        pricePrefix: 'From',
        price: '£18,000',
        includes: [
          'Practice-wide workflow analysis',
          'Software, licensing and cost review',
          'Infrastructure and security assessment',
          'AI readiness and capability evaluation',
          'Prioritised recommendations and roadmap',
        ],
        button: 'Explore the Technology Blueprint',
      },
    ]),
  },
  quote: {
    quote: 'We thought our problem was choosing between software platforms. It turned out we had no shared understanding of what we actually needed.',
    name: 'Sarah Mitchell',
    role: 'Operations director, ADAM Architecture',
  },
  faq: {
    heading: 'Answers',
    questions: keyed('question', [
      { question: 'Who should join?', answer: 'Practice leaders who carry technology decisions — directors, partners, operations leads and digital or BIM leads.' },
      { question: 'What counts as a question between sessions?', answer: 'Short, decision-shaped questions related to the themes covered. Anything needing dedicated analysis becomes a separate engagement.' },
      { question: 'Does this include implementation support?', answer: 'No. ADDDvisory shapes decisions. Delivery sits with your team, and practice-wide strategy with a Technology Blueprint engagement.' },
      { question: 'What if we already have a BIM or digital lead?', answer: 'They benefit most. ADDDvisory gives them an external reference point and a framework to bring back to leadership.' },
      { question: 'When should we choose a Technology Blueprint instead?', answer: 'When you need one evidence-based view of the whole practice before deciding anything, rather than monthly guidance.' },
    ]),
  },
};
