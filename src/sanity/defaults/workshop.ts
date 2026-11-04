import { keyed } from './types';

/* The Workflow Workshop page's own words (src/pages/workshops-audits.astro),
   section by section, as the Workflow Workshop page document is shaped
   (studio/schemaTypes/pages/workshop.ts). */
export const workshopPage = {
  hero: {
    tagline: 'Workflow Workshop',
    heading: 'Find out where your practice is losing time',
    lede: 'A half-day session with your team around a real project. You’ll map how work moves through the practice, identify where workflows and tools create friction, and receive a written report with findings and priorities',
    primaryButton: 'Start Workshop',
    secondaryButton: 'View Pricing',
  },
  symptoms: {
    lede: 'Most practices don’t have a software problem. They have a workflow problem. The same issues recur across projects. Teams solve similar problems in different ways. Information gets lost or recreated. Tools accumulate without clear purpose.',
    heading: 'Does This Sound Like Your Practice?',
    tiles: keyed('symptom', [
      { title: 'Problems Keep Returning.', text: 'The same coordination delays, mistakes and rework appear project after project. Teams keep fixing the symptoms without addressing what’s causing them.' },
      { title: 'No Shared Approach.', text: 'Different teams follow different processes, making collaboration harder, knowledge difficult to transfer and effort unnecessarily duplicated.' },
      { title: 'Broken Handoffs.', text: 'As work moves between people and project stages, information gets lost or recreated, wasting time and introducing avoidable errors.' },
    ]),
  },
  method: {
    lede: 'One structured half-day on a real project, and what your practice takes away from it.',
    tagline: 'Outcomes',
    heading: 'Inside the Workshop',
    tiles: keyed('method', [
      { title: 'Examine one project', text: 'Every finding comes from a project your team knows, not a generic checklist, so the problems it names are ones you recognise.' },
      { title: 'Identify friction and lost time', text: 'A clear view of where duplication happens, where information disappears and where decisions go unrecorded, so you know what is costing you time.' },
      { title: 'Map the actual flow', text: 'A shared picture of how information, decisions and work really move through the practice, from brief to completion, that the whole team agrees on.' },
    ]),
    // the document each folder opens (FolderDocument.astro), in the
    // folders' order
    documents: keyed('document', [
      {
        kicker: 'Why one real project',
        lede: 'The workshop starts from a project your team has just delivered or is working on now. Because the evidence is your own, the findings describe how your practice actually works, not how a template says it should.',
        body: [
          'Before the session, a short questionnaire helps you choose a project that exposed workflow problems or delays: one where deadlines slipped, information had to be chased or work was done twice. You also receive guidance on who should attend and how to prepare.',
          'In the room, the project becomes a shared reference point. Rather than discussing workflows in the abstract, the team walks through what really happened, step by step, with the people who did the work.',
        ],
        points: [
          'Findings grounded in your own work, not general advice',
          'A shared reference everyone in the room recognises',
          'Problems named precisely enough to act on',
        ],
      },
      {
        kicker: 'Where the time goes',
        lede: 'With the project laid out, the workshop pinpoints where time is lost: the duplicated effort, the information that disappears between stages, the decisions nobody recorded and the responsibilities that blur.',
        body: [
          'Most practices already sense these problems; they rarely see them all at once, in context, or understand why they keep returning. The session separates symptoms from causes, so the conversation moves from frustration to specifics.',
          'The friction points are then prioritised together, so the team agrees which matter most before anything changes. The written report that follows within two weeks sets them out with practical recommendations and next steps.',
        ],
        points: [
          'A prioritised list of friction points, agreed by the team',
          'The causes behind recurring delays, not just the symptoms',
          'A clear starting point for change, without a larger commitment',
        ],
      },
      {
        kicker: 'How work really moves',
        lede: 'Over four hours, the team traces how information, decisions and work move through the practice, from brief to completion, and draws the flow as it really is, not as the process documents describe it.',
        body: [
          'Mapping the actual flow shows where the handoffs are, which tools each stage depends on and where the same information is entered more than once. It makes the unseen parts of the process visible to everyone at the same time.',
          'The map becomes a shared picture the whole team can return to. It is the foundation for the findings, priorities and recommendations in the report, and a reference for any change that follows.',
        ],
        points: [
          'One shared view of how work moves through the practice',
          'Every handoff, tool and duplication made visible',
          'A foundation for decisions about workflows and tools',
        ],
      },
    ]),
  },
  journey: {
    lede: 'Four stages, from a short questionnaire before the session to a written report and a clear place to start.',
    tagline: 'Journey',
    heading: 'What to Expect',
    steps: keyed('step', [
      { label: 'Prepare', title: 'You complete the questionnaire', text: 'A short questionnaire helps you choose a project that exposed real workflow problems, and tells you who should attend.' },
      { label: 'Attend', title: 'Half a day in the room', text: 'Four hours tracing how work, information and decisions move through your practice, around your chosen project.' },
      { label: 'Review', title: 'The report arrives', text: 'A tailored written report, delivered within two weeks: findings, priority areas and practical recommendations.' },
      { label: 'Act', title: 'What you leave with', text: 'A clear map of where time disappears, which problems to address first, and a practical starting point for change.' },
    ]),
    // each step's timing and the more it tells when opened (StageTimeline.astro),
    // in the steps' order
    details: keyed('detail', [
      { meta: 'Before the session', more: 'The questionnaire arrives with guidance on choosing the project and on who should come: four to eight people, such as a director or partner, the project lead and whoever owns BIM, IT or operations. Nothing else needs to be produced in advance.' },
      { meta: 'Half a day · four hours', more: 'ADDD facilitates a structured session in person, with everyone in the room working through the real project. Together you map the actual flow, identify where friction occurs and agree on what matters most.' },
      { meta: 'Within two weeks', more: 'The report is specific to your practice and the project examined, with suggested next steps. An optional executive readout presents the findings to leadership.' },
      { meta: 'After the report', more: 'Quick wins and next steps are set out, so the team can begin with what matters most, without a larger commitment or further investment.' },
    ]),
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
        title: 'Standard workshop',
        subtitle: 'Includes everything above',
        price: '£1,040',
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
        price: 'Custom',
        includesLabel: 'Includes',
        includes: [
          'Practice-wide workflow analysis',
          'Software audit and licensing review',
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
