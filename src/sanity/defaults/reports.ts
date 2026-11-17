/* The Reports page's own words (src/pages/reports.astro), as the Reports
   page document is shaped (studio/schemaTypes/pages/reports.ts). The cards
   come from the reports in Sanity; while there are none the page keeps the
   six it was built with (REPORT_CARD_DEFAULTS, below), filters included. */
export const reportsPage = {
  // the words every report's own page shares (src/pages/reports/[slug].astro)
  reportPage: {
    formatDefault: 'Report',
    freeLabel: 'Free',
    wasLabel: 'Was',
    freeButton: 'Get it free',
    buyButton: 'Buy now',
    insideLink: 'What’s inside',
    coversTagline: 'Inside',
    coversHeading: 'What’s inside',
    audienceTagline: 'Readers',
    audienceHeading: 'Who it’s for',
    getTagline: 'Get it',
    getHeading: 'Get your copy',
    includesLabel: 'What you get',
    formTitle: 'Sign-up form',
    partnerButton: 'Find out more',
    relatedTagline: 'Resources',
    relatedHeading: 'Related reports',
    relatedText: 'Explore more insight-led content to guide your practice forward',
    relatedButton: 'View all',
  },
  // the reports' archive: what it says while there are none, and the
  // filters' first and last buttons (the others are the categories)
  archive: {
    empty: 'The first reports and guides are on their way.',
    allLabel: 'View all',
    resetLabel: 'Clear filters',
  },
  seo: {
    title: 'Reports — ADDD',
    description: 'Independent ADDD research into how technology actually gets used to make architecture: AI, BIM, software and workflows in architecture practices.',
  },
  hero: {
    lede: 'Independent research into how technology actually gets used to make architecture: AI, BIM, software and workflows in practice',
    tagline: 'Reports',
    heading: 'Research and insight',
  },
};

export const REPORT_CARD_DEFAULTS = [
  { href: '/report-template', image: 'assets/images/allister-podium-full.jpg', category: 'Technology', title: 'The state of AI in architecture', description: 'How generative tools are reshaping design practice and what firms need to know', meta: ['Allister Burt', '12 min read'] },
  { href: '/report-template', image: 'assets/images/allister-headshot-bw.png', category: 'BIM', title: 'BIM maturity and implementation strategy', description: 'A framework for assessing where your practice stands and what comes next', meta: ['Allister Burt', '9 min read'] },
  { href: '/report-template', image: 'assets/images/allister-podium-portrait.jpg', category: 'Workflows', title: 'Software selection for architecture teams', description: 'Practical guidance on evaluating tools and building your technology stack', meta: ['14 Nov 2024', '8 min read'] },
  { href: '/report-template', image: 'assets/images/allister-presenting.jpg', category: 'Technology', title: 'Digital transformation in practice', description: 'Lessons from firms that have successfully modernised their operations', meta: ['7 Oct 2024', '9 min read'] },
  { href: '/report-template', image: 'assets/images/conference-keynote.jpg', category: 'AI', title: 'Governance and risk in AI adoption', description: 'What architecture practices need to consider before implementing AI tools', meta: ['22 Sep 2024', '7 min read'] },
  { href: '/report-template', image: 'assets/images/allister-gesture-close.jpg', category: 'Workflows', title: 'Collaboration tools and team productivity', description: 'How to choose platforms that actually improve how your team works together', meta: ['5 Aug 2024', '11 min read'] },
];

/** The filter buttons the page was built with: the label shown, and the token it matches (data-filter-target) */
export const REPORT_FILTER_DEFAULTS = [
  { target: 'technology', label: 'Technology' },
  { target: 'ai', label: 'AI' },
  { target: 'bim', label: 'BIM' },
  { target: 'workflows', label: 'Workflows' },
];
