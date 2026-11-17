import { keyed } from './types';
import { TECH_STACKS } from '../../data/tech-stacks';

/* The stacks as the page document holds them (stacks.items): each with its
   key (its id), its stages keyed in order, a stage's logo as a picture
   the seed uploads, and a locked stage as its name alone (its tool is the
   ADDD app's, never written here or in the dataset). */
const STACK_ITEMS = TECH_STACKS.map((stack) => ({
  _key: stack.id,
  name: stack.name,
  short: stack.short,
  summary: stack.summary,
  ...(stack.note ? { note: stack.note } : {}),
  stages: stack.stages.map((stage, i) =>
    !('tool' in stage)
      ? { _key: `${stack.id}-${i + 1}`, stage: stage.stage, locked: true }
      : {
          _key: `${stack.id}-${i + 1}`,
          stage: stage.stage,
          locked: false,
          tool: stage.tool,
          does: stage.does,
          alternatives: stage.alternatives,
          ...(stage.logo ? { logo: { path: stage.logo, alt: stage.tool } } : {}),
        },
  ),
}));

/* The Stack Diagnostic page's own words (src/pages/stack-diagnostic.astro),
   section by section, as the Stack Diagnostic page document is shaped
   (studio/schemaTypes/pages/stack-diagnostic.ts). */
export const stackDiagnosticPage = {
  seo: {
    title: 'Tech Stacks — ADDD',
    description: 'A short, focused assessment of the technology your practice actually runs—what each tool is for, who depends on it, and where two tools do the same job.',
  },
  hero: {
    tagline: 'Resources · Free Tech Stacks',
    heading: 'Free Tech Stacks',
    lede: 'Explore curated combinations of software built for specific architectural workflows.',
    button: 'Access the Free Stack',
    // where the Free Stack, every stack's way in and its locked stages lead:
    // the ADDD app's sign-up (the app enforces the access)
    buttonHref: 'https://app.addd.io/sign-up',
    linkLabel: 'How it works',
    legend: 'Each card is a piece of software. Cards that stand together in one tone are a curated stack, tools chosen to work together on one workflow: open any of them to see the stack.',
  },
  // the ten stacks, in the page's order (src/data/tech-stacks.ts)
  stacks: {
    items: STACK_ITEMS,
  },
  // the words round the stacks: the switch between the views, the list's
  // blocks and the sheet a stack opens into (stack-sheet.js). In the
  // sentences, {n} is a number, {stage} "stage" or "stages" to go with
  // it, and {stack} the stack's name.
  sheet: {
    view3d: '3D',
    viewList: 'List',
    listCount: '{n} stages · {locked} locked',
    listOpen: 'Open the stack',
    kicker: 'Stack · {n} stages',
    lockedCount: '{n} locked',
    allOpen: 'All open',
    locked: 'Locked',
    lockedLink: 'Access the Free Tech Stack',
    alternatives: 'Alternatives:',
    noteLabel: 'Note',
    unlockTitle: 'Unlock the full stack',
    unlockText: 'The {n} locked {stage} of {stack}, with each tool, what it does and its alternatives, are in the ADDD app. Sign up, or sign in, to see the whole stack.',
    openTitle: 'See it in the ADDD app',
    openText: 'The whole of {stack} is in the ADDD app. Sign up, or sign in, to see it.',
    button: 'Unlock the full stack',
  },
  fit: {
    lede: 'The Stack Diagnostic suits practices that have accumulated tools faster than they have retired them, and now need one clear picture before deciding anything else.',
    tagline: 'Fit',
    heading: 'Who it’s for',
    tiles: keyed('tile', [
      { title: 'Practices that have grown past their tooling', text: 'Software was chosen team by team as the practice expanded. Nobody has stepped back to look at the whole stack since.' },
      { title: 'Leaders who cannot see what they own', text: 'There is no single list of tools, owners and dependencies—so every technology conversation starts by arguing about the facts.' },
      { title: 'Teams about to commit to something large', text: 'A platform migration, a new BIM standard or an AI pilot is coming. Knowing what you already run changes what you should buy.' },
    ]),
    alternatives: keyed('alternative', [
      { title: 'If the problem is one workflow, not the whole stack', text: 'When friction is concentrated in how a single project runs, a half-day session on a real project will get you further, faster.', linkLabel: 'Workflow Workshop' },
      { title: 'If you need a strategy, not a snapshot', text: 'The diagnostic tells you what you have. When you need a sequenced plan across workflows, costs, roles and AI, start with the blueprint.', linkLabel: 'Technology Blueprint' },
    ]),
  },
  method: {
    lede: 'Four stages across roughly three weeks. Most of the work happens away from your team—you are needed for a kickoff, a handful of short interviews and the readout.',
    tagline: 'Method',
    heading: 'How it works',
    steps: keyed('step', [
      { label: 'Stage one', title: 'Inventory', text: 'We collect every tool in use across the practice, including the ones bought on a card and never registered centrally. Each entry gets an owner, a purpose and a dependency.' },
      { label: 'Stage two', title: 'Interviews', text: 'Short conversations with the people who actually use the stack. What they reach for, what they avoid, and what they have quietly built a workaround around.' },
      { label: 'Stage three', title: 'Overlap and gap analysis', text: 'We map where two tools do one job, where one tool does none, and where a dependency sits with a single person. Findings are checked against independent product research rather than vendor claims.' },
      { label: 'Stage four', title: 'Readout', text: 'You receive a written stack map with consolidation candidates, risks and a short list of what to change first. Delivered as a document and walked through with leadership.' },
    ]),
    button: 'Enquire about a diagnostic',
    linkLabel: 'Software costs in the Blueprint',
  },
  next: {
    lede: 'The diagnostic is a starting point, not a commitment. Most practices use it to decide which of these comes next.',
    heading: 'Where it leads',
    tiles: keyed('tile', [
      { title: 'Workflow Workshop', text: 'Find where the time goes across the practice, in a half-day session with your team.', linkLabel: 'Explore' },
      { title: 'Technology Blueprint', text: 'Take the findings into a sequenced roadmap across the whole practice.', linkLabel: 'Explore' },
      { title: 'Ongoing Advisory', text: 'Keep an external reference point as the decisions arrive month to month.', linkLabel: 'Explore' },
    ]),
  },
};
