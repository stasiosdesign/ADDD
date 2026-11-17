import { keyed } from './types';

/* The AEC Tech Partners page's own words and pictures
   (src/pages/tech-firms.astro), section by section, as the page's document is
   shaped (studio/schemaTypes/pages/tech-firms.ts). Where every button
   leads stays in the page. The objectives (routes) are not shown since
   2026-11-04 (they said again what Ways to work with ADDD says); kept
   while the live site still reads them. */
export const techFirmsPage = {
  seo: {
    title: 'AEC Tech Partners — ADDD',
    description: 'Partnerships for technology companies: founder stories, featured workflow episodes and practice intelligence that help architects understand where your technology fits.',
  },
  hero: {
    tagline: 'AEC Tech Partners',
    // the opening's words (2026-11-05, the user's exact copy)
    heading: 'Show architects where your technology fits.',
    lede: 'ADDD helps AEC technology companies reach architecture practices through real projects, relevant content and industry insight.',
    primaryButton: 'Discuss a Partnership',
    secondaryButton: 'Explore Options',
    // the positioning statement that rises into the hero as its words go
    // (Hero.astro, "centred"; 2026-11-05, the user's exact copy)
    statement: 'Architects don’t choose tools in isolation. They choose what fits the way they design, collaborate and deliver projects.',
  },
  why: {
    lede: 'ADDD works with architecture practices on their technology challenges: reviewing workflows, untangling software estates and supporting the decisions about what to adopt, keep or replace. Its content explores how architects work, and why particular tools fit particular tasks.',
    tagline: 'Why ADDD',
    heading: 'Close to the practices making technology decisions',
    tiles: keyed('why', [
      {
        number: '01',
        title: 'Insight from practice work',
        text: 'Workshops, audits and Technology Blueprint sessions with practices show ADDD the problems, constraints and priorities behind their technology choices.',
        image: { path: '/assets/images/team-model-review.webp', alt: '', width: 450, height: 268 },
      },
      {
        number: '02',
        title: 'Content about real work',
        text: 'Workflow videos and articles follow real projects, the people behind them, and the processes and tools they use to deliver them.',
        image: { path: '/assets/images/allister-keynote-stage-crop.webp', alt: '', width: 600, height: 400 },
      },
      {
        number: '03',
        title: 'Distribution to the audience',
        text: 'That content reaches architects through workflow videos, online sessions, the ADDDitive newsletter and ADDD’s social channels.',
        image: { path: '/assets/images/conference-keynote-crop.webp', alt: '', width: 640, height: 478 },
      },
    ]),
    benefitsTitle: 'What that gives a technology company',
    benefits: [
      'A relevant audience: architects and practice leaders who engage with architectural technology and how it is used in workflows.',
      'First-hand understanding of the problems and priorities that shape how practices choose and adopt technology.',
    ],
    note: 'Practices that work with ADDD as clients, people who take part in ADDD’s content, and companies that sponsor it are separate relationships. Taking part in ADDD’s work does not mean a practice endorses any sponsor or product.',
  },
  routes: {
    items: keyed('route', [
      {
        title: 'Tell your story',
        text: 'Introduce your company and the people behind it to ADDD’s architecture audience through a founder story.',
        linkLabel: 'Founder story',
        image: { path: 'assets/images/allister-podium-portrait.jpg', alt: '' },
      },
      {
        title: 'Show your technology in use',
        text: 'Explain how your technology fits into a real project and architectural workflow through a featured episode.',
        linkLabel: 'Featured workflow episode',
        image: { path: 'assets/images/allister-keynote-stage.jpg', alt: '' },
      },
      {
        title: 'Understand what practices need',
        text: 'Receive anonymised intelligence on what architecture practices in your category are doing, drawn from ADDD’s practice engagements and sessions.',
        linkLabel: 'Practice intelligence',
        image: { path: 'assets/images/allister-gesture-warm.jpg', alt: '' },
      },
    ]),
  },
  services: {
    tagline: 'Ways to work with ADDD',
    statements: [
      'Reach the architecture professionals your technology was built for.',
      'Show your technology in action, through real architectural projects.',
      'Understand what architecture practices really need, and where the industry is heading.',
    ],
    cards: keyed('route', [
      { title: 'Workflow Workshop', text: 'A half-day session with your team, focused on the practice as a whole: map how work moves around the practice, find where tools and workflows create friction, and leave with a written report of priorities.' },
      { title: 'Early Stage Design', text: 'A review of the early stages of design, before work moves into Revit or Archicad: the tools, information and decisions that shape a project before it is modelled.' },
      { title: 'Technology Blueprint', text: 'An eight-week, practice-wide strategy across workflows, software and licensing costs, infrastructure, data and AI readiness, ending in a sequenced roadmap.' },
      { title: 'Ongoing Advisory', text: 'Regular strategic guidance for practice leaders on AI, BIM, software and digital priorities, before isolated decisions add more complexity.' },
    ]),
  },
  example: {
    lede: 'Every featured episode starts from a piece of architectural work, not from a product. This is the format an episode follows; it describes the structure, not a completed project.',
    tagline: 'Illustrative format',
    heading: 'What a featured workflow episode covers',
    steps: keyed('format', [
      { label: 'The project', title: 'An architectural project or task', text: 'A real piece of work with a clear design or delivery problem, chosen with the partner and the practice involved.' },
      { label: 'The people', title: 'The practice and the people doing the work', text: 'The architects and specialists who carried out the work explain their role and the decisions they made.' },
      { label: 'The workflow', title: 'How the work was done', text: 'The process step by step: the inputs, the tools at each stage and how information moved between them.' },
      { label: 'The technology', title: 'Where the technology fits', text: 'What role the partner’s technology plays in that workflow, what it was used for and why it suited the task.' },
      { label: 'The output', title: 'The video and its distribution', text: 'An 8–10 minute workflow video, with a LinkedIn post, a newsletter inclusion, an Instagram Reel and a YouTube Short drawn from it.' },
    ]),
  },
  options: {
    lede: 'Three partnerships, each for a different objective. Every one starts with a call to agree the fit, the deliverables and how success is measured.',
    tagline: 'Partnership options',
    heading: 'Choose the partnership that fits your objective',
    // the folders: the word before each number, the way on at each foot,
    // and the papers they open: their series, labels and button
    folderLabel: 'Partnership',
    folderGo: 'Open folder',
    series: 'ADDD :: AEC Tech Partners',
    summaryLabel: 'In short',
    audienceLabel: 'Best suited to',
    pricingLabel: 'Pricing',
    pricingValue: 'Shared on enquiry, once the scope is agreed',
    termsLabel: 'Terms',
    pointsLabel: 'You receive',
    ctaLabel: 'Discuss a partnership',
    cards: keyed('offer', [
      {
        // the first partnership (2026-11-16): Founder story in place of the
        // main channel sponsorship, at the client's direction; its details
        // are still to come, so the words stay general and list no inclusions
        title: 'Founder story',
        audience: 'Technology companies that want to introduce themselves, and the people behind them, to architects and practice leaders.',
        subtitle: 'Your company’s story, told for ADDD’s audience of architects and practice leaders.',
        includesLabel: 'You receive',
        includes: [],
        conditions: 'The format, scope and timing are agreed on a first call. Sponsorship is always disclosed.',
        button: 'Discuss a partnership',
      },
      {
        title: 'Featured workflow episode',
        audience: 'Software and design-tool companies with a suitable architectural project or workflow to demonstrate.',
        subtitle: 'A project-led episode showing the people, process and technology behind real architectural work.',
        note: 'Per episode',
        includesLabel: 'You receive',
        includes: [
          'One 8–10 minute workflow video',
          'One LinkedIn post',
          'Newsletter inclusion',
          'One Instagram Reel',
          'One YouTube Short',
        ],
        conditions: 'The episode needs a real project or workflow, and a practice willing to take part. Sponsorship is disclosed in the episode.',
        button: 'Discuss a partnership',
      },
      {
        title: 'Practice intelligence',
        audience: 'Technology companies that want a clearer understanding of practices in their market category.',
        subtitle: 'An ongoing intelligence relationship, with quarterly briefings drawn from ADDD’s practice workshops and sessions.',
        note: 'Briefings every quarter',
        includesLabel: 'You receive',
        includes: [
          'A quarterly briefing on what practices in your category are doing',
          'Anonymised findings drawn from workshops and sessions',
        ],
        conditions: 'Findings are anonymised: no practice is identified and no raw data is shared.',
        button: 'Discuss a partnership',
      },
    ]),
  },
  more: {
    heading: 'Smaller placements',
    cards: keyed('placement', [
      {
        title: 'Newsletter placement',
        audience: 'Companies with a specific announcement, resource or event for architecture practices.',
        subtitle: 'A placement in ADDDitive, the ADDD newsletter.',
        includes: [],
        button: 'Discuss a partnership',
      },
      {
        title: 'Event coverage',
        audience: 'Companies running or exhibiting at an event relevant to architecture practices.',
        subtitle: 'ADDD covers your event and produces a LinkedIn carousel from it.',
        includes: [],
        conditions: 'An 8–10 minute summary video, with interviews, short quotes and a summary of the carousel, can be added. It is agreed separately on the call.',
        button: 'Discuss a partnership',
      },
    ]),
  },
  // What each partnership's folder opens (2026-11-05: the partnerships as
  // the Workflow Workshop's folders, FolderDocument.astro), in the folders'
  // order: the three partnerships (options.cards), then the two smaller
  // placements (more.cards). Drawn from the page's own account of each
  // offer, its process and its independence commitments; not final copy.
  documents: {
    items: keyed('document', [
    {
      folderMeta: 'Price on enquiry',
      folderKind: 'Story',
      folderCovers: ['Your story', 'For architects'],
      kicker: 'Your story, for architects',
      lede: 'A founder story introduces your company, and the people behind it, to the architects and practice leaders who follow ADDD.',
      body: [
        '## How it is shaped',
        'Like every partnership, it starts with a call: what you want architects to understand about your company, and the format, scope and timing that suit it.',
        '## How it stays independent',
        'Sponsorship is always disclosed. Sponsors do not preview editorial content, and a founder story does not buy inclusion in recommendations, rankings or reviews, or a place in the ADDD Stack.',
      ],
    },
    {
      folderMeta: 'Price on enquiry',
      folderKind: 'Content',
      folderCovers: ['Real project', '8–10 min video'],
      kicker: 'Your technology in real work',
      lede: 'One episode built around a real architectural project or workflow: the people who did the work, how they did it, and where your technology fitted into it.',
      body: [
        '## How an episode is made',
        'Every episode starts from a piece of architectural work, not from a product. The project is chosen with you and the practice involved, and needs a clear design or delivery problem worth explaining.',
        'The architects and specialists who carried out the work explain their roles and decisions. The workflow is traced step by step: the inputs, the tools at each stage and how information moved between them. Only then does the episode turn to the role your technology played, what it was used for and why it suited the task.',
        '## What is produced',
        'An 8–10 minute workflow video, with a LinkedIn post, a newsletter inclusion, an Instagram Reel and a YouTube Short drawn from it, distributed through ADDD’s channels.',
        '## What it needs from you',
        'A real project or workflow, and a practice willing to take part. The sponsorship is disclosed in the episode itself.',
      ],
    },
    {
      folderMeta: 'Price on enquiry',
      folderKind: 'Intelligence',
      folderCovers: ['Quarterly', 'Anonymised'],
      kicker: 'What practices are doing',
      lede: 'An ongoing intelligence relationship: every quarter, a briefing on what architecture practices in your category are doing, drawn from ADDD’s workshops and sessions with them.',
      body: [
        '## Where the insight comes from',
        'ADDD works with practices on their technology decisions: reviewing workflows, untangling software estates and helping decide what to adopt, keep or replace. That work shows the problems, constraints and priorities behind their choices, which rarely appear in surveys or sales conversations.',
        '## What a briefing covers',
        'Each quarter’s briefing sets out what practices in your market category are doing, against a scope agreed at the start. It is measured by that scope and its regular delivery, not by conversion figures.',
        '## How confidentiality is kept',
        'Findings are anonymised. No practice is identified, and no raw data is shared.',
      ],
    },
    {
      folderMeta: 'Price on enquiry',
      folderKind: 'Placement',
      folderCovers: ['ADDDitive', 'One issue'],
      kicker: 'One issue, one message',
      lede: 'A placement in ADDDitive, the ADDD newsletter, for a specific announcement, resource or event that is relevant to architecture practices.',
      body: [
        '## When it fits',
        'A newsletter placement suits a single, clear message, such as a launch, a useful resource or an event, rather than an ongoing presence. It reaches the architects and practice leaders who read ADDDitive alongside ADDD’s own writing on technology in practice.',
        '## How it is handled',
        'The placement is agreed on a first call: what it says, which issue it runs in and how it is linked. It is marked as a sponsored placement in the issue.',
      ],
      points: ['A placement in one issue of ADDDitive', 'A clearly marked sponsored slot', 'Linked to your announcement, resource or event'],
    },
    {
      folderMeta: 'Price on enquiry',
      folderKind: 'Coverage',
      folderCovers: ['Your event', 'LinkedIn carousel'],
      kicker: 'Your event, in practice terms',
      lede: 'ADDD attends your event and turns it into content for architecture practices, starting with a LinkedIn carousel built from the day.',
      body: [
        '## What the day covers',
        'For a company running or exhibiting at an event relevant to architecture practices, ADDD covers the day and produces a LinkedIn carousel that draws out what matters to architects.',
        '## How it is agreed',
        'Like every partnership, it starts with a call: the event, what the coverage should focus on, and whether the optional summary video set out above suits it.',
      ],
      points: ['Coverage of your event for the day', 'A LinkedIn carousel produced from it', 'An optional summary video, agreed separately'],
    },
  ]),
  },
  process: {
    lede: 'Every partnership follows the same four steps, whatever its format.',
    tagline: 'How it works',
    heading: 'From first call to reporting',
    tiles: keyed('process', [
      { number: '01', title: 'Discuss and assess fit', text: 'We talk through your objective and whether ADDD’s audience and work are the right fit for it.' },
      { number: '02', title: 'Agree the format', text: 'We agree the partnership, the deliverables and the measures you will be reported against.' },
      { number: '03', title: 'Produce and deliver', text: 'ADDD produces and distributes the content, or delivers the intelligence briefing.' },
      { number: '04', title: 'Report', text: 'You receive reporting against the measures agreed at the start.' },
    ]),
    // the phases across the top of the timeline (2026-11-04), one to a
    // step, from the heading's own words: from first call to reporting
    phases: ['First call', 'Agreement', 'Production', 'Reporting'],
    measurementTitle: 'How success is measured',
    measurement: 'For promotional partnerships, tracked links are agreed and set up before anything is published, and trial sign-ups are reported monthly where they apply. Views and impressions give context, but they are not treated as the only measure of commercial success. ADDD does not guarantee sign-ups or sales.',
    intelligenceMeasurement: 'Practice intelligence is measured differently: briefings arrive every quarter, against a scope agreed at the start, rather than against conversion figures.',
    independenceTitle: 'Editorial independence',
    independence: [
      'Sponsorship is always clearly disclosed.',
      'Sponsors do not preview editorial content before it is published.',
      'Payment does not buy inclusion in recommendations, rankings or reviews.',
      'Intelligence is anonymised.',
      'Sponsorship does not buy a place in the ADDD Stack.',
    ],
    // what each step holds on the timeline, each point marked by who does
    // it (by: you, optional; ADDD when not given), in the steps' order
    stageItems: keyed('stage', [
      { items: keyed('point', [{ label: 'Your objective', by: 'you' }, { label: 'Audience fit', by: 'addd' }]) },
      { items: keyed('point', [{ label: 'Partnership', by: 'addd' }, { label: 'Deliverables', by: 'addd' }, { label: 'Measures', by: 'addd' }]) },
      { items: keyed('point', [{ label: 'Content', by: 'addd' }, { label: 'Distribution', by: 'addd' }, { label: 'Intelligence briefing', by: 'optional' }]) },
      { items: keyed('point', [{ label: 'Reporting against the measures', by: 'addd' }]) },
    ]),
    // the timeline, all of it in one field (2026-11-17): each stage its title,
    // its length in the unit (drawn to scale), its timing words (empty: the
    // weeks it runs) and its points; the lists above stay for the code on main
    timeline: {
      unit: 'step',
      stages: keyed('stage', [
        { title: 'Discuss and assess fit', length: 1, when: 'First call', items: keyed('point', [{ label: 'Your objective', by: 'you' }, { label: 'Audience fit', by: 'addd' }]) },
        { title: 'Agree the format', length: 1, when: 'Agreement', items: keyed('point', [{ label: 'Partnership', by: 'addd' }, { label: 'Deliverables', by: 'addd' }, { label: 'Measures', by: 'addd' }]) },
        { title: 'Produce and deliver', length: 1, when: 'Production', items: keyed('point', [{ label: 'Content', by: 'addd' }, { label: 'Distribution', by: 'addd' }, { label: 'Intelligence briefing', by: 'optional' }]) },
        { title: 'Report', length: 1, when: 'Reporting', items: keyed('point', [{ label: 'Reporting against the measures', by: 'addd' }]) },
      ]),
    },
    keyAddd: 'ADDD',
    keyYou: 'Your team',
    keyOptional: 'Optional',
  },
  closingCta: {
    label: 'For technology companies',
    heading: 'Tell us what you want to achieve with architecture practices',
    lede: 'A 30-minute call to understand your objectives, assess whether ADDD is the right fit, and identify the partnership that suits them.',
    primaryButton: 'Discuss a partnership',
    secondaryButton: 'Explore partnership options',
  },
};
