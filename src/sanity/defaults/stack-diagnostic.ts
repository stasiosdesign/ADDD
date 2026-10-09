import { keyed } from './types';

/* The Stack Diagnostic page's own words (src/pages/stack-diagnostic.astro),
   section by section, as the Stack Diagnostic page document is shaped
   (studio/schemaTypes/pages/stack-diagnostic.ts). */
export const stackDiagnosticPage = {
  hero: {
    tagline: 'Resources · Free Tech Stacks',
    heading: 'Stack Diagnostic',
    lede: 'A short, focused assessment of the technology your practice actually runs—what each tool is for, who depends on it, where two tools do the same job, and which parts of the stack no longer earn their place.',
    button: 'Access the Free Stack',
    linkLabel: 'How it works',
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
      { title: 'Workflow Workshop', text: 'Find where the time goes, using a live project as the test case.', linkLabel: 'Explore' },
      { title: 'Technology Blueprint', text: 'Take the findings into a sequenced roadmap across the whole practice.', linkLabel: 'Explore' },
      { title: 'ADDDvisory', text: 'Keep an external reference point as the decisions arrive month to month.', linkLabel: 'Explore' },
    ]),
  },
};
