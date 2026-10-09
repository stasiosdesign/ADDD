import { keyed } from './types';

/* The Workflow Workshop page's own words (src/pages/workshops-audits.astro),
   section by section, as the Workflow Workshop page document is shaped
   (studio/schemaTypes/pages/workshop.ts). */
export const workshopPage = {
  hero: {
    tagline: 'Workflow Workshop',
    heading: 'Find where your practice is losing time',
    lede: 'A half-day diagnostic using a live project, for practice leaders who know something isn’t working but need clarity on where to start. You’ll map how work moves through the practice, identify where workflows and tools create friction, and receive a written report with findings and priorities',
    primaryButton: 'Enquire',
    secondaryButton: 'Workshop Pricing',
  },
  symptoms: {
    lede: 'Most practices don’t have a software problem. They have a workflow problem. The same issues recur across projects. Teams solve similar problems in different ways. Information gets lost or recreated. Tools accumulate without clear purpose.',
    heading: 'Does This Sound Like Your Practice?',
    tiles: keyed('symptom', [
      { title: 'The same problems surface on every project', text: 'Coordination delays, rework and information loss repeat without lasting solutions' },
      { title: 'Teams work in different ways across the practice', text: 'No shared method means knowledge stays siloed and effort duplicates' },
      { title: 'Information disappears between handoffs', text: 'Data is recreated rather than passed forward, wasting time and introducing error' },
      { title: 'Growth has exposed weak foundations', text: 'Systems that worked at 30 people don’t scale to 80 without breaking' },
    ]),
  },
  method: {
    lede: 'A structured half-day that examines a real project to reveal where workflows break down.',
    tagline: 'Method',
    heading: 'How the workshop works',
    tiles: keyed('method', [
      { title: 'Examine one project', text: 'You select a recent or current project that exposed workflow problems or delays.' },
      { title: 'Map the actual flow', text: 'Four hours tracing how information, decisions and work move through your practice from start to finish.' },
      { tagline: 'Diagnostic', title: 'Identify friction and lost time', text: 'Spot where duplication happens, information disappears, decisions go unrecorded and responsibility blurs.' },
    ]),
  },
  journey: {
    lede: 'ADDD arrives to trace how information, decisions and work move through your practice from brief to completion. You’ll identify where duplication happens, where information disappears and where responsibility blurs.',
    tagline: 'Journey',
    heading: 'How the Workshop works',
    steps: keyed('step', [
      { label: 'Prepare', title: 'You complete the questionnaire', text: 'A short questionnaire arrives with guidance on choosing a project that exposed real workflow problems. You’ll also receive details on who should attend and how to prepare.' },
      { label: 'Attend', title: 'Half day in the room', text: 'ADDD facilitates a structured session tracing how work, information and decisions move through your practice. You’ll map the actual flow, identify where friction occurs and agree on what matters most.' },
      { label: 'Review', title: 'The report arrives', text: 'A tailored written report is delivered within two weeks. It contains findings, priority areas, practical recommendations and suggested next steps specific to your practice and the project examined.' },
      { label: 'Act', title: 'What you leave with', text: 'A clear map of where time disappears, which problems to address first, and a practical starting point for change without requiring a larger commitment or further investment.' },
    ]),
  },
  story: {
    tagline: 'What practices discover',
    heading: 'How a 90-person practice found where time was disappearing',
  },
  quote: {
    quote: 'We thought we needed better software. The workshop showed us we needed better workflows.',
    name: 'Design director',
    role: '90-person London practice',
  },
  pricing: {
    lede: 'One half-day session. Everything needed to find where time disappears.',
    tagline: 'Investment',
    heading: 'The workshop',
    tiles: keyed('stage', [
      { title: 'Before arrival', text: 'Short questionnaire and project selection guidance sent in advance' },
      { title: 'During the session', text: 'Four hours mapping workflows, identifying friction and prioritising opportunities' },
      { title: 'After completion', text: 'Tailored written report with findings, recommendations and next steps' },
    ]),
    cards: keyed('card', [
      {
        title: 'Workflow Workshop',
        subtitle: 'Includes everything above',
        price: '£1,995',
        includesLabel: 'Includes',
        includes: [
          'Pre-workshop questionnaire — attendee and preparation guidance',
          'Four-hour facilitated session — real project analysis and mapping',
          'Tailored written report — key findings and priority areas',
          'Practical recommendations — quick wins and next steps',
          'Optional executive readout — leadership-facing presentation of findings',
        ],
        button: 'Enquire about a workshop',
      },
      {
        title: 'Technology Blueprint',
        pricePrefix: 'From',
        price: '£18,000',
        includesLabel: 'Includes',
        includes: [
          'Practice-wide workflow analysis',
          'Software, licensing and cost review',
          'Infrastructure and security assessment',
          'Governance and decision structure',
          'AI readiness and capability evaluation',
          'Vendor strategy and cost optimisation',
          'Two to three-year implementation roadmap',
          'Prioritised recommendations and quick wins',
        ],
        button: 'Explore the Technology Blueprint',
      },
    ]),
  },
  faq: {
    heading: 'Common Questions',
    questions: keyed('question', [
      { question: 'Who should attend the workshop?', answer: 'Anyone who shapes how work moves through the practice — a director or partner, the project lead for the chosen project, and whoever owns BIM, IT or operations.' },
      { question: 'How many people should come?', answer: 'Between four and eight. Enough perspectives to see the whole flow, few enough that everyone contributes.' },
      { question: 'What preparation is required?', answer: 'A short questionnaire and the selection of one real project. Nothing else needs to be produced in advance.' },
      { question: 'Does it have to be in person?', answer: 'Yes. The workshop works because people are in the room together, working through a real project. Remote doesn’t create the same clarity.' },
      { question: 'When do we get the report?', answer: 'Within two weeks of the session.' },
    ]),
  },
};
