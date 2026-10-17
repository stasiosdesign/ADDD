import { keyed } from './types';

/* The AEC Tech Partners page's own words and pictures
   (src/pages/tech-firms.astro), section by section, as the page's document is
   shaped (studio/schemaTypes/pages/tech-firms.ts). The cards' tone and crop
   stay in the page, by position; so does where every button leads. */
export const techFirmsPage = {
  hero: {
    tagline: 'AEC Tech Partners',
    heading: 'Help architects understand where your technology fits',
    lede: 'ADDD helps technology companies reach architecture practices, show their technology inside real architectural workflows, and understand what practices actually need from it.',
    primaryButton: 'Discuss a partnership',
    secondaryButton: 'Explore partnership options',
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
      },
      {
        number: '02',
        title: 'Content about real work',
        text: 'Workflow videos and articles follow real projects, the people behind them, and the processes and tools they use to deliver them.',
      },
      {
        number: '03',
        title: 'Distribution to the audience',
        text: 'That content reaches architects through workflow videos, online sessions, the ADDDitive newsletter and ADDD’s social channels.',
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
        title: 'Build ongoing visibility',
        text: 'Keep a sustained presence with ADDD’s architecture audience through a 12-month channel sponsorship.',
        linkLabel: 'Main channel sponsorship',
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
      { title: 'Workflow Workshop', text: 'A half-day diagnostic on a live project: map how work moves through the practice, find where tools and workflows create friction, and leave with a written report of priorities.' },
      { title: 'Before Revit', text: 'A review of the early stages of design, before work moves into Revit or Archicad: the tools, information and decisions that shape a project before it is modelled.' },
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
    cards: keyed('offer', [
      {
        title: 'Main channel sponsorship',
        audience: 'Infrastructure, hardware, licensing, managed service and cloud providers looking for an ongoing relationship with the audience.',
        subtitle: 'A 12-month sponsorship supporting ADDD’s workflow content and Technology Blueprint sessions.',
        price: '£2,000–£2,500',
        priceSuffix: '/month',
        note: '12-month commitment',
        includesLabel: 'You receive',
        includes: [
          'Named sponsorship across workflow sessions and Technology Blueprint sessions',
          'A monthly newsletter slot',
          'Category exclusivity',
          'A tracked trial link',
          'Monthly tracked-link reporting',
        ],
        conditions: 'Open to companies whose products are not the subject of ADDD’s editorial coverage. Design-tool vendors are better suited to a featured workflow episode.',
        button: 'Discuss a partnership',
      },
      {
        title: 'Featured workflow episode',
        audience: 'Software and design-tool companies with a suitable architectural project or workflow to demonstrate.',
        subtitle: 'A project-led episode showing the people, process and technology behind real architectural work.',
        price: '£2,500',
        priceSuffix: '/episode',
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
        price: '£1,480',
        priceSuffix: '/month',
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
        price: '£350',
        priceSuffix: '/issue',
        includes: [],
        button: 'Discuss a partnership',
      },
      {
        title: 'Event coverage',
        audience: 'Companies running or exhibiting at an event relevant to architecture practices.',
        subtitle: 'ADDD covers your event and produces a LinkedIn carousel from it.',
        price: '£1,500',
        priceSuffix: '/day',
        includes: [],
        conditions: 'An 8–10 minute summary video, with interviews, short quotes and a summary of the carousel, can be added. It is not included in the day rate; its fee is agreed on the call.',
        button: 'Discuss a partnership',
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
  },
  closingCta: {
    label: 'For technology companies',
    heading: 'Tell us what you want to achieve with architecture practices',
    lede: 'A 30-minute call to understand your objectives, assess whether ADDD is the right fit, and identify the partnership that suits them.',
    primaryButton: 'Discuss a partnership',
    secondaryButton: 'Explore partnership options',
  },
};
