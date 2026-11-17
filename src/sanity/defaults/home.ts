import { keyed } from './types';

/* The home page's own words and pictures (src/pages/index.astro), section by
   section, as the Home page document is shaped (studio/schemaTypes/pages/home.ts).
   The logo strip's clients are CLIENTS (clients.ts): the seed references them
   in order. The research slider's cards come from the reports and newsletter
   issues; while there are none the page keeps the six it was built with
   (INSIGHT_DEFAULTS, below). */
export const homePage = {
  // the page's title in the browser's tab and search results, and its summary there
  seo: {
    title: 'ADDD — Technology strategy for architecture practices',
    description: 'Independent research and technology strategy for architecture practices: how technology actually gets used to make architecture, and which decisions to make first.',
  },
  hero: {
    tagline: 'Independent research',
    lede: 'See how technology, workflows, BIM, software, data and AI connect in practice, so you can make better decisions about how your practice works.',
    heading: 'Better workflow decisions\nFor architecture practices',
    // the heading's first word here cycles through the rest, in order
    headingWords: ['workflow', 'technology', 'software'],
    primaryButton: 'Free Tech Stacks',
    secondaryButton: 'Contact',
    primaryHref: '/stack-diagnostic',
    secondaryHref: '/contact',
    // the words scattered over the pattern, each in its own place
    // (Hero.astro): ten over the field, ten on the screen's part
    fieldWords: ['BIM', 'Software', 'Infrastructure', 'Artificial intelligence', 'Data', 'Workflows', 'Automation', 'Computation', 'Visualisation', 'Digital fabrication'],
    screenWords: ['Digital twins', 'Parametric design', 'Reality capture', 'Interoperability', 'Generative design', 'Point clouds', 'Energy modelling', 'Simulation', 'Robotics', 'Cloud'],
    // the text the pattern is set in, also behind the first-load intro
    fieldText: 'Technology strategy for architecture practices·Workflows·BIM·Software·Data·AI·Infrastructure·Better software decisions·Workflow Workshop·Early Stage Design·Technology Blueprint·Ongoing Advisory·Independent research',
  },
  logos: {
    title: 'Practices we’ve\nworked with',
  },
  approach: {
    statement:
      'Good technology decisions don’t start with software. They start with how a practice works, and how it could improve.',
    button: 'Free Tech Stacks',
    buttonHref: '/stack-diagnostic',
    // the software marks round the statement, taking turns in its six
    // places (index.astro, PHOTOS)
    marks: keyed('mark', [
      { image: { path: '/assets/logos/software/bluebeam.png', alt: 'Bluebeam', width: 576, height: 376 } },
      { image: { path: '/assets/logos/software/rhino.svg', alt: 'Rhino', width: 1200, height: 1200 } },
    ]),
    heading: 'How we work',
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
      { title: 'Too Many Tools.', text: 'New tools get added, old licences remain, and costs keep rising. Yet nobody has a clear picture of what’s actually being used or delivering value.', image: { path: '/assets/images/team-model-review.webp', alt: '' } },
      { title: 'Inconsistent Workflows.', text: 'Every team develops its own way of working. The same problems get solved repeatedly, mistakes recur, and valuable time disappears between projects.', image: { path: '/assets/images/team-model-review.webp', alt: '' } },
      { title: 'Lost Information.', text: 'Files, decisions and project data are scattered across disconnected systems. Teams waste time searching, re-entering information and recreating work that’s already been done.', image: { path: '/assets/images/team-model-review.webp', alt: '' } },
    ]),
  },
  routes: {
    lede: 'From a focused workflow problem or early-stage design to practice-wide strategy and ongoing guidance. Choose the route that fits the issue.',
    tagline: 'Ways to work with ADDD',
    heading: 'Start with what needs solving',
    button: 'Free Tech Stacks',
    buttonHref: '/stack-diagnostic',
    // the folders: the word before each number, and the way on at the foot
    label: 'Service',
    go: 'View service',
    // each route's folder: its format by the number, its kind in the pill,
    // the lines on the sheet inside it (its page's hero's own), and where
    // it leads
    cards: keyed('route', [
      { tagline: 'A focused issue', title: 'Workflow Workshop', text: 'A half-day session with your team, focused on the practice as a whole: map how work moves around the practice, find where tools and workflows create friction, and leave with a written report of priorities.', format: 'Half a day', kind: 'Workshop', covers: ['A half day with your team', 'How work actually moves', 'Where tools and workflows create friction', 'A written report of priorities', 'No further commitment'], href: '/workshops-audits' },
      { tagline: 'Early-stage design workflow', title: 'Early Stage Design', text: 'A review of the early stages of design, before work moves into Revit or Archicad: the tools, information and decisions that shape a project before it is modelled.', format: 'Early design', kind: 'Research', covers: ['The early stages of design', 'Tools, information and decisions', 'What carries into Revit or Archicad', 'What is recreated or lost on the way', 'What should change first'], href: '/before-revit' },
      { tagline: 'A practice-wide issue', title: 'Technology Blueprint', text: 'An eight-week, practice-wide strategy across workflows, software and licensing costs, infrastructure, data and AI readiness, ending in a sequenced roadmap.', format: 'Eight weeks', kind: 'Strategy', covers: ['Eight weeks, practice-wide', 'Workflows and software', 'Licensing costs', 'Infrastructure, data and AI readiness', 'A sequenced roadmap'], href: '/technology-blueprint' },
      { tagline: 'Ongoing guidance', title: 'Ongoing Advisory', text: 'Regular strategic guidance for practice leaders on AI, BIM, software and digital priorities, before isolated decisions add more complexity.', format: 'Monthly', kind: 'Advisory', covers: ['A monthly 60-minute session', 'A rotating theme', 'Decision frameworks and comparisons', 'Questions between sessions', 'One practice membership'], href: '/advisory' },
    ]),
  },
  testimonials: {
    heading: 'Trusted by leading firms',
    items: keyed('quote', [
      {
        quote: 'We are extremely pleased with the Technology Blueprint delivered by ADDD. Their team combined deep industry knowledge with a clear, collaborative approach, resulting in a comprehensive yet highly practical strategy... The work has given us real clarity and confidence... and we would highly recommend ADDD to any practice seeking expert digital and technology advice.',
        name: 'Wayne Rekes',
        role: 'Director of Operations, ADAM Architecture',
        clientId: 'client-adam',
      },
      {
        quote: 'The report was clear, insightful and highly informative, and highlighted AI opportunities we would not have identified independently.',
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
    buttonHref: '/about',
    // the photograph beside the words: none yet (the page shows its
    // placeholder until one is set in the Studio)
    image: { path: '', alt: '' },
  },
  fit: {
    lede: 'ADDD is most useful when the problem is no longer isolated to one tool, one project or one team.',
    tagline: 'Fit',
    heading: 'For practices where technology is now a leadership issue.',
    faqHeading: 'Questions & Answers',
    forQuestion: 'Who is this for?',
    notQuestion: 'Who is this not for?',
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
    questions: keyed('question', [
      { question: 'Are you a software reseller or IT provider?', answer: 'No. ADDD is independent of software vendors and does not run day-to-day IT. We advise on the workflows, technology and decisions behind them. With no products to sell, the advice follows what your practice needs.' },
      { question: 'Where should we start?', answer: 'Most practices start with a Workflow Workshop: a half-day session on how work moves around the practice, ending with a written report of priorities. It shows quickly whether the issue sits in one workflow or across the whole practice.' },
      { question: 'How long does a Technology Blueprint take?', answer: 'Around eight weeks, in three phases: discovery, strategy, and a sequenced roadmap presented to your leadership. The time asked of your team falls mostly in the discovery phase.' },
      { question: 'Can you help after the recommendations?', answer: 'Yes. Ongoing Advisory gives your leadership a monthly session and access to our research as new decisions come up. It keeps the roadmap current as tools, costs and priorities change.' },
    ]),
  },
  research: {
    // the standfirst is no longer shown (2026-11-05)
    lede: 'The Process of Architecture: the people, process and projects behind how technology actually gets used to make architecture.',
    // on two lines: a line break written here starts the second
    heading: 'Research\n& Insights',
    signupTagline: 'ADDDitive newsletter',
    signupHeading: 'Get ADDDitive in your inbox',
  },
  closingCta: {
    label: 'For architecture practices',
    // (2026-11-16, at the user's word: much shorter; was "Make sense of
    // your technology setup")
    heading: 'Start with clarity.',
    primaryButton: 'Free Tech Stacks',
    secondaryButton: 'Contact',
    primaryHref: '/stack-diagnostic',
    // the software marks that turn in the tiles round the words, in order
    // (ClosingCta.astro, cta-tiles.js)
    marks: keyed('mark', [
      { image: { path: '/assets/logos/software/rhino-icon.svg', alt: 'Rhino' } },
      { image: { path: '/assets/logos/software/bluebeam-mark.svg', alt: 'Bluebeam' } },
      { image: { path: '/assets/logos/software/figma.svg', alt: 'Figma' } },
      { image: { path: '/assets/logos/software/notion.svg', alt: 'Notion' } },
      { image: { path: '/assets/logos/software/slack.svg', alt: 'Slack' } },
      { image: { path: '/assets/logos/software/chatgpt.svg', alt: 'ChatGPT' } },
      { image: { path: '/assets/logos/software/adobe.svg', alt: 'Adobe' } },
      { image: { path: '/assets/logos/software/google.svg', alt: 'Google' } },
    ]),
  },

  /* What every page shares (2026-11-16, when every field was connected to
     Sanity): kept in the Home page document, as the closing call to action
     is, and read once per request (siteDocument, src/sanity/content.ts). */

  // The navigation bar and its two dropdowns (Nav.astro)
  nav: {
    partners: { label: 'AEC Tech Partners', href: '/tech-firms' },
    servicesLabel: 'Services',
    resourcesLabel: 'Resources',
    links: keyed('nav-link', [
      { label: 'AEC Jobs', href: 'https://aectechjobs.com/' },
      { label: 'About', href: '/about' },
    ]),
    signIn: { label: 'Sign in', href: 'https://app.addd.io/login' },
    contact: { label: 'Contact', href: '/contact' },
    // the Services dropdown's cards: the dropdown's own short names, each
    // line on the card set as two by hand; the first card's name ends in a
    // word that turns ("Work", then "shop" or "flow")
    services: keyed('nav-service', [
      { name: 'Workshop', stem: 'Work', words: ['shop', 'flow'], lines: ['A half-day practice workflow session,', 'followed by a written report.'], href: '/workshops-audits' },
      { name: 'Early Stage Design', lines: ['A review of early-stage design,', 'before Revit or Archicad.'], href: '/before-revit' },
      { name: 'Tech Blueprint', lines: ['An eight-week practice-wide strategy', 'and a sequenced roadmap.'], href: '/technology-blueprint' },
      { name: 'ADDD Advisory', lines: ['Monthly advice on AI, BIM, software', 'and other digital priorities.'], href: '/advisory' },
    ]),
    // the Resources dropdown's five tiles
    stacksTile: { name: 'Free Tech Stacks', text: 'See how software fits together across architecture workflows.', href: '/stack-diagnostic' },
    databaseTile: { name: 'Software Database ↗', text: 'ADDD’s research into 1,700+ AEC software solutions.', href: 'https://app.addd.io/' },
    reportTile: {
      name: 'The state of AI in architecture',
      label: 'Latest report',
      cta: 'Read the report',
      href: '/report-template',
      image: { path: '/assets/images/allister-podium-full-landscape.webp', alt: '' },
    },
    reportsTile: { name: 'Reports & Guides', text: 'Deeper research into technology, AI, workflows and practice.', href: '/reports' },
    newsletterTile: { name: 'ADDDitive Newsletter', text: 'How technology actually gets used to make architecture.', href: '/newsletter' },
  },

  // The newsletter signup, wherever it shows (the navigation, the footer,
  // the report and issue pages)
  signup: {
    placeholder: 'Your email',
    button: 'Subscribe',
    audienceQuestion: 'Which describes you?',
    practiceOption: 'I run or work in a practice',
    vendorOption: 'I sell to practices',
  },

  // The footer (Footer.astro): three columns of links, the signup, the
  // contact details and the social links
  footer: {
    servicesTitle: 'Services',
    servicesLinks: keyed('footer-service', [
      { label: 'Workflow Workshop', href: '/workshops-audits' },
      { label: 'Early Stage Design', href: '/before-revit' },
      { label: 'Technology Blueprint', href: '/technology-blueprint' },
      { label: 'Ongoing Advisory', href: '/advisory' },
    ]),
    resourcesTitle: 'Resources',
    resourcesLinks: keyed('footer-resource', [
      { label: 'Free Tech Stacks', href: '/stack-diagnostic' },
      { label: 'Software Database ↗', href: 'https://app.addd.io/' },
      { label: 'Reports & Guides', href: '/reports' },
      { label: 'ADDDitive Newsletter', href: '/newsletter' },
      { label: 'AEC Jobs ↗', href: 'https://aectechjobs.com/' },
    ]),
    companyTitle: 'Company',
    companyLinks: keyed('footer-company', [
      { label: 'About', href: '/about' },
      { label: 'AEC Tech Partners', href: '/tech-firms' },
      { label: 'Sign in ↗', href: 'https://app.addd.io/login' },
    ]),
    signupTagline: 'ADDDitive newsletter',
    signupHeading: 'Get ADDDitive in your inbox',
    contactTitle: 'Contact',
    email: 'allister@addd.io',
    phone: '+44 (0) 207 183 3675',
    callLabel: 'Book a call',
    callHref: '/contact',
    linkedin: '#',
    instagram: '#',
    youtube: '#',
  },

  // The free call with Allister: the button that opens it, and the
  // booking dialog (BookCallDialog.astro, BookingDialog.astro), on every
  // page that offers it
  booking: {
    floatLabel: 'Book a Call',
    faqLabel: 'Book a Free Call',
    photo: { path: '/assets/images/allister-headshot-bw-crop.webp', alt: '' },
    label: 'Free call · with Allister',
    title: 'Book a free call',
    note: 'Pick a day and a time for a short call with Allister about your practice. This calendar is a preview: online booking opens soon.',
    slots: keyed('slot', [
      { name: 'Morning', time: '10:00–12:00' },
      { name: 'Afternoon', time: '14:00–16:00' },
    ]),
    summary: 'Choose a date and a time',
    button: 'Request this date',
    done: 'Thank you. This calendar is a preview, so nothing has been booked yet: we will be in touch to confirm your date.',
  },
};

/** The research slider's cards while there are no reports or issues yet: the six the page was built with */
export const INSIGHT_DEFAULTS = [
  { href: '/report-template', image: 'assets/images/allister-podium-full.jpg', category: 'Technology', title: 'The state of AI in architecture', description: 'How generative tools are reshaping design practice and what firms need to know', meta: ['Report', '12 min read'] },
  { href: '/report-template', image: 'assets/images/allister-headshot-bw.png', category: 'BIM', title: 'BIM maturity and implementation strategy', description: 'A framework for assessing where your practice stands and what comes next', meta: ['Report', '9 min read'] },
  { href: '/newsletter-template', image: 'assets/images/allister-keynote-stage.jpg', category: 'Strategy', title: 'Implementing AI without losing your identity', description: 'How firms can adopt emerging tools while keeping their own approach and values', meta: ['Newsletter', '8 min read'] },
  { href: '/report-template', image: 'assets/images/allister-podium-portrait.jpg', category: 'Workflows', title: 'Software selection for architecture teams', description: 'Practical guidance on evaluating tools and building your technology stack', meta: ['Report', '8 min read'] },
  { href: '/newsletter-template', image: 'assets/images/allister-gesture-warm.jpg', category: 'Workflow', title: 'The cost of poor software integration', description: 'Why disconnected tools drain resources and how to fix it before it becomes a problem', meta: ['Newsletter', '6 min read'] },
  { href: '/report-template', image: 'assets/images/conference-keynote.jpg', category: 'AI', title: 'Governance and risk in AI adoption', description: 'What architecture practices need to consider before implementing AI tools', meta: ['Report', '7 min read'] },
];
