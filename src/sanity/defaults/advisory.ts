import { keyed } from './types';

/* The Ongoing Advisory page's own words (src/pages/advisory.astro), section by
   section, as the Ongoing Advisory page document is shaped
   (studio/schemaTypes/pages/advisory.ts). The four picture slots under
   Themes Covered are empty until pictures are set in the Studio; each
   has its theme's name under it. The quote is not shown since 2026-11-04
   (the site's testimonials, which open on it, stand in its place). */
export const advisoryPage = {
  hero: {
    tagline: 'Ongoing Advisory',
    heading: 'Ongoing strategic guidance for architecture practices',
    lede: 'After or alongside the main strategic work, Ongoing Advisory gives practice leaders a regular place to make sense of AI, BIM, software, workflows and digital priorities—before isolated decisions create more complexity.',
    primaryButton: 'Enquire',
    secondaryButton: 'Membership Pricing',
  },
  statement: {
    statement: 'Architecture practices live in a cycle of technology decisions, but the people making them are pulled in too many directions to think clearly',
  },
  structure: {
    // the standfirst is no longer shown (2026-11-05)
    tagline: 'Structure',
    heading: 'How it Works',
    // the four panels of the bento, in order (2026-11-05)
    tiles: keyed('tile', [
      { title: 'Monthly strategy sessions', text: 'A focused 60-minute live session each month exploring the technology, workflow and strategic challenges facing architecture practices.' },
      { title: 'Guidance between sessions', text: 'Ask follow-up questions through a shared channel as new challenges arise, keeping decisions moving between monthly sessions.' },
      { title: 'Practical tools and frameworks', text: 'Access useful frameworks, comparisons and resources shaped by ADDD’s experience working directly with architecture practices.' },
      { title: 'One practice-wide membership', text: 'Bring directors, operations leaders and BIM or digital leads together under one membership, with guidance relevant to the whole practice.' },
    ]),
  },
  themes: {
    lede: 'Each month rotates based on what matters to your practice',
    heading: 'Themes Covered',
    // the themes, one large list in this order (2026-11-05); the four
    // squares' names before it (title1–4) are no longer shown
    items: ['AI', 'BIM', 'Technology', 'Workflows', 'Software', 'Hardware', 'Infrastructure', 'Automation', 'Integration', 'Licensing', 'Costs', 'Strategy', 'Security', 'Productivity', 'Leadership'],
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
    heading: 'Why Ongoing Advisory stands apart',
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
        title: 'Ongoing Advisory membership',
        badge: 'Ongoing',
        subtitle: 'Full access, month to month',
        includesLabel: 'Includes',
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
        button: 'Enquire about Ongoing Advisory',
      },
      {
        title: 'Technology Blueprint',
        badge: 'Practice-wide',
        subtitle: 'The practice-wide strategy Ongoing Advisory follows or runs alongside',
        includesLabel: 'Includes',
        // no price: the Technology Blueprint shows none in public (2026-11-05)
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
    heading: 'About ADDDvisory',
    questions: keyed('question', [
      { question: 'Who should join?', answer: 'Practice leaders who carry technology decisions — directors, partners, operations leads and digital or BIM leads. Sessions work best with a small, consistent group, so decisions carry over from one month to the next.' },
      { question: 'What counts as a question between sessions?', answer: 'Short, decision-shaped questions related to the themes covered. Anything needing dedicated analysis becomes a separate engagement. A vendor’s proposal, a licence renewal or a question about using AI on projects are typical examples.' },
      { question: 'Does this include implementation support?', answer: 'No. Ongoing Advisory shapes decisions. Delivery sits with your team, and practice-wide strategy with a Technology Blueprint engagement. Advice can still cover how to brief the people who carry the work out.' },
      { question: 'What if we already have a BIM or digital lead?', answer: 'They benefit most. Ongoing Advisory gives them an external reference point and a framework to bring back to leadership. It also gives their recommendations independent support when decisions reach partner level.' },
      { question: 'When should we choose a Technology Blueprint instead?', answer: 'When you need one evidence-based view of the whole practice before deciding anything, rather than monthly guidance. Many practices begin with a blueprint and continue with Ongoing Advisory once the roadmap is in place.' },
    ]),
    footLine: 'Have any other questions?',
  },
};
