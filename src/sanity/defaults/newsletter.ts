/* The Newsletter page's own words (src/pages/newsletter.astro), as the
   Newsletter page document is shaped (studio/schemaTypes/pages/newsletter.ts).
   The cards come from the newsletter issues in Sanity; while there are none
   the page keeps the six it was built with (ISSUE_CARD_DEFAULTS, below),
   filters included. */
export const newsletterPage = {
  hero: {
    lede: 'The Process of Architecture: the people, process and projects behind how technology actually gets used to make architecture',
    tagline: 'Newsletter',
    heading: 'More from ADDD',
  },
};

export const ISSUE_CARD_DEFAULTS = [
  { href: 'newsletter-template.html', image: 'assets/images/allister-keynote-stage.jpg', category: 'Strategy', title: 'Implementing AI without losing your practice’s identity', description: 'How architecture firms can adopt emerging tools while maintaining their unique approach and values', meta: ['8 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/allister-gesture-warm.jpg', category: 'Workflow', title: 'The cost of poor software integration in architecture', description: 'Why disconnected tools drain resources and how to fix it before it becomes a problem', meta: ['6 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/conference-keynote.jpg', category: 'Technology', title: 'BIM governance frameworks that actually work', description: 'Setting up clear standards and processes that your team will follow without resistance', meta: ['7 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/allister-gesture-close.jpg', category: 'Strategy', title: 'When technology becomes a distraction from design', description: 'Finding the balance between innovation and the work that matters most', meta: ['9 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/allister-podium-portrait.jpg', category: 'Workflow', title: 'Building teams that understand your software stack', description: 'How to hire and develop people who can navigate complex digital environments', meta: ['7 min read'] },
  { href: 'newsletter-template.html', image: 'assets/images/allister-headshot-bw.png', category: 'Technology', title: 'The hidden cost of staying with legacy systems', description: 'Why familiar tools sometimes cost more than the alternatives', meta: ['6 min read'] },
];

/** The filter buttons the page was built with: the label shown, and the token it matches (data-filter-target) */
export const ISSUE_FILTER_DEFAULTS = [
  { target: 'strategy', label: 'Strategy' },
  { target: 'workflow', label: 'Workflow' },
  { target: 'technology', label: 'Technology' },
];
