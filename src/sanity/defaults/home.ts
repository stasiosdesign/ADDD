import { keyed } from './types';

/* The home page's own words and pictures (src/pages/index.astro), section by
   section, as the Home page document is shaped (studio/schemaTypes/pages/home.ts).
   The logo strip's clients are CLIENTS (clients.ts): the seed references them
   in order. The research slider's cards come from the reports and newsletter
   issues; while there are none the page keeps the six it was built with
   (INSIGHT_DEFAULTS, below). */
export const homePage = {
  hero: {
    tagline: 'Independent research',
    lede: 'See how technology, workflows, BIM, software, data and AI connect in practice, so you can make better decisions about how your practice works.',
    heading: 'Better workflow decisions\nFor architecture practices',
    // the heading's first word here cycles through the rest, in order
    headingWords: ['workflow', 'technology', 'software'],
    primaryButton: 'Free Tech Stacks',
    secondaryButton: 'Work With Us',
  },
  logos: {
    title: 'Practices\nwe’ve worked with',
  },
  approach: {
    statement:
      'The right technology decisions don’t start with software. They begin with understanding how a practice truly works, and where it could work better.',
    steps: keyed('step', [
      { title: 'Understand', text: 'Map how work, tools, information and decisions actually move through the practice, not how they are supposed to.' },
      { title: 'Diagnose', text: 'Trace the causes across workflows, BIM, software, infrastructure, data, costs, roles and AI, rather than treating each issue separately.' },
      { title: 'Prioritise', text: 'Turn what we find into clear priorities: what should change first, who should own it and where investment will have the most impact.' },
    ]),
  },
  cost: {
    lede: 'Tools multiply. Workflows drift. Information fragments. AI gets added without clear direction or ownership.',
    tagline: 'The cost of standing still',
    heading: 'What actually costs you time',
    cards: keyed('card', [
      { title: 'Software keeps piling up.', text: 'New tools get added, old ones stay, and costs rise without anyone knowing what’s actually delivering value.', image: { path: 'assets/images/conference-keynote.jpg', alt: '' } },
      { title: 'Every project works differently.', text: 'Without consistent workflows, teams keep solving the same problems, repeating mistakes and losing valuable time.', image: { path: 'assets/images/allister-keynote-stage.jpg', alt: '' } },
      { title: 'Information gets lost.', text: 'Disconnected systems force teams to re-enter data, recreate information and waste time searching for what they need.', image: { path: 'assets/images/allister-presenting.jpg', alt: '' } },
    ]),
  },
  routes: {
    lede: 'From a focused workflow problem or early-stage design to practice-wide strategy and ongoing guidance. Choose the route that fits the issue.',
    tagline: 'Ways to work with ADDD',
    heading: 'Start with what needs solving',
    cards: keyed('route', [
      { tagline: 'A focused issue', title: 'Workflow Workshop', text: 'A half-day diagnostic on a live project: map how work moves through the practice, find where tools and workflows create friction, and leave with a written report of priorities.' },
      { tagline: 'Early-stage design workflow', title: 'Before Revit', text: 'A review of the early stages of design, before work moves into Revit or Archicad: the tools, information and decisions that shape a project before it is modelled.' },
      { tagline: 'A practice-wide issue', title: 'Technology Blueprint', text: 'An eight-week, practice-wide strategy across workflows, software and licensing costs, infrastructure, data and AI readiness, ending in a sequenced roadmap.' },
      { tagline: 'Ongoing guidance', title: 'Ongoing Advisory', text: 'Regular strategic guidance for practice leaders on AI, BIM, software and digital priorities, before isolated decisions add more complexity.' },
    ]),
  },
  testimonials: {
    heading: 'Trusted by leading firms',
    items: keyed('quote', [
      {
        quote: 'We thought our problem was choosing between software platforms. It turned out we had no shared understanding of what we actually needed.',
        name: 'Sarah Mitchell',
        role: 'Operations director, ADAM Architecture',
        clientId: 'client-adam',
      },
      {
        quote: 'ADAM Architecture had three separate software systems doing the same job. The blueprint showed us how to consolidate without losing capability, and we recovered nearly half a day per project.',
        name: 'Marcus Reid',
        role: 'Technology director, ADAM Architecture',
        clientId: 'client-adam',
      },
      {
        quote: 'We thought we needed better software. The workshop showed us we needed better workflows.',
        name: 'Elena Foster',
        role: 'Design director, Haworth Tompkins',
        clientId: 'client-haworth-tompkins',
      },
      {
        quote: 'The proposal was professionally presented and the report was clear, insightful and highly informative. It provided valuable guidance for our internal discussions and decision making, while also highlighting a range of AI opportunities and solutions that we would not have identified independently. Thank you for your time, expertise and the quality of the recommendations provided.',
        role: 'DMWR Architects',
        clientId: 'client-dmwr',
      },
    ]),
  },
  credentials: {
    tagline: 'Credentials',
    heading: 'Strategy built on real architecture practice',
    text: 'Allister combines 25 years of architecture experience with BIM, Head of Technology and AEC software product expertise. His advice is grounded in how projects are actually delivered, how teams use tools and how vendor products perform in practice.',
    button: 'About Allister',
  },
  fit: {
    lede: 'ADDD is most useful when the problem is no longer isolated to one tool, one project or one team.',
    tagline: 'Fit',
    heading: 'For practices where technology is now a leadership issue.',
    forTitle: 'Best suited to',
    forItems: [
      'Established architecture practices, usually around 25–200 people.',
      'Practices facing connected questions around workflows, software, costs, data, AI or ownership.',
      'Firms ready to act, but unclear about what should happen first.',
    ],
    notTitle: 'Not primarily for',
    notItems: [
      'Firms seeking implementation without taking part in the strategic decisions.',
      'One-off software training, tactical BIM production support or outsourced IT management.',
      'Quick recommendations for a particular product.',
    ],
  },
  research: {
    lede: 'The Process of Architecture: the people, process and projects behind how technology actually gets used to make architecture.',
    heading: 'Research and insight',
    signupTagline: 'ADDDitive newsletter',
    signupHeading: 'Get ADDDitive in your inbox',
  },
  closingCta: {
    label: 'For architecture practices',
    heading: 'Need help making sense of your technology setup?',
    primaryButton: 'Free Tech Stacks',
    secondaryButton: 'Book a Call',
  },
};

/** The research slider's cards while there are no reports or issues yet: the six the page was built with */
export const INSIGHT_DEFAULTS = [
  { href: 'report-template.html', image: 'assets/images/allister-podium-full.jpg', category: 'Technology', title: 'The state of AI in architecture', description: 'How generative tools are reshaping design practice and what firms need to know', meta: ['Report', '12 min read'] },
  { href: 'report-template.html', image: 'assets/images/allister-headshot-bw.png', category: 'BIM', title: 'BIM maturity and implementation strategy', description: 'A framework for assessing where your practice stands and what comes next', meta: ['Report', '9 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/allister-keynote-stage.jpg', category: 'Strategy', title: 'Implementing AI without losing your identity', description: 'How firms can adopt emerging tools while keeping their own approach and values', meta: ['Newsletter', '8 min read'] },
  { href: 'report-template.html', image: 'assets/images/allister-podium-portrait.jpg', category: 'Workflows', title: 'Software selection for architecture teams', description: 'Practical guidance on evaluating tools and building your technology stack', meta: ['Report', '8 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/allister-gesture-warm.jpg', category: 'Workflow', title: 'The cost of poor software integration', description: 'Why disconnected tools drain resources and how to fix it before it becomes a problem', meta: ['Newsletter', '6 min read'] },
  { href: 'report-template.html', image: 'assets/images/conference-keynote.jpg', category: 'AI', title: 'Governance and risk in AI adoption', description: 'What architecture practices need to consider before implementing AI tools', meta: ['Report', '7 min read'] },
];
