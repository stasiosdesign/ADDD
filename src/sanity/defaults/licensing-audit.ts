import { keyed } from './types';

/* The Software & Licensing Audit page's own words
   (src/pages/software-licensing-audit.astro), section by section, as the
   Software & Licensing Audit page document is shaped
   (studio/schemaTypes/pages/licensing-audit.ts). */
export const licensingAuditPage = {
  hero: {
    tagline: 'Part of the Technology Blueprint',
    heading: 'Software & Licensing Audit',
    lede: 'A complete account of what your practice pays for and what it actually uses. Every seat, every renewal date, every overlapping subscription—set against real usage, so renewal conversations start from evidence instead of habit. ADDD assesses software cost and licensing as part of the wider technology strategy, usually within a Technology Blueprint.',
    button: 'Technology Blueprint',
    linkLabel: 'How it works',
  },
  fit: {
    lede: 'This suits practices where software spend has climbed steadily, nobody can explain exactly why, and a large renewal is close enough to matter.',
    tagline: 'Fit',
    heading: 'Who it’s for',
    tiles: keyed('tile', [
      { title: 'Practices facing a major renewal', text: 'A multi-year agreement is up and the only available comparison is last year’s invoice. You need a position before the conversation, not after it.' },
      { title: 'Finance and operations without visibility', text: 'Subscriptions sit across departments, cards and cost centres. Nobody holds a single view of what is paid for, by whom, or whether it is used.' },
      { title: 'Practices paying for seats nobody uses', text: 'Headcount changed, projects ended, tools were replaced—but the licences renewed anyway. The cost is real and rarely visible.' },
    ]),
    alternatives: keyed('alternative', [
      { title: 'If you do not yet know what you run', text: 'An audit prices the stack. If the stack itself is unclear, map it first—then the numbers mean something.', linkLabel: 'Free Tech Stacks' },
      { title: 'If cost is a symptom of something larger', text: 'When spending is only one of several connected problems, the audit becomes one input into a broader strategy.', linkLabel: 'Technology Blueprint' },
    ]),
  },
  method: {
    lede: 'Four stages across roughly four weeks. The heaviest lift is gathering records at the start; after that the work sits with us until the readout.',
    tagline: 'Method',
    heading: 'How it works',
    steps: keyed('step', [
      { label: 'Stage one', title: 'Collect the records', text: 'Invoices, licence agreements, admin consoles and expense lines. We build one register of every product, contract term, renewal date and seat count.' },
      { label: 'Stage two', title: 'Match seats to use', text: 'Allocated seats are compared against actual activity. Dormant licences, duplicated products and users holding access they no longer need are identified by name.' },
      { label: 'Stage three', title: 'Test the commercial position', text: 'Pricing, tiers and bundling are checked against how comparable products are sold. This is where consolidation and renegotiation opportunities surface.' },
      { label: 'Stage four', title: 'Recommendations and renewal calendar', text: 'You receive a costed set of recommendations—what to cut, consolidate, renegotiate or leave alone—plus a dated renewal calendar so the next cycle is planned rather than reactive.' },
    ]),
    button: 'Enquire about software costs',
    linkLabel: 'Read the research',
  },
  next: {
    lede: 'Software cost is rarely the whole problem. These are the routes practices take to the wider questions.',
    heading: 'Where it leads',
    tiles: keyed('tile', [
      { title: 'Technology Blueprint', text: 'Take software cost into the full practice-wide technology strategy.', linkLabel: 'Explore' },
      { title: 'Workflow Workshop', text: 'Find where the time goes, using a real project as the test case.', linkLabel: 'Explore' },
      { title: 'ADDDvisory', text: 'Bring vendor and licensing decisions into a standing monthly conversation.', linkLabel: 'Explore' },
    ]),
  },
};
