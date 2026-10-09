import { keyed } from './types';

/* The About page's own words (src/pages/about.astro), section by section, as
   the About page document is shaped (studio/schemaTypes/pages/about.ts). The
   two picture slots in Validation ship empty: the page draws plain
   placeholders until pictures are set in the Studio. */
export const aboutPage = {
  hero: {
    heading: 'A clearer view of how your practice really works.',
    lede: 'I’m Allister Lewis, an architect and technology strategist. I founded ADDD to help architecture leaders understand what is really holding their practice back—across technology, workflows, information, costs and decision-making.',
    primaryButton: 'Discover',
    secondaryButton: 'Blueprint',
  },
  foundation: {
    tagline: 'Foundation',
    statement:
      'Architecture practices rarely choose poorly. They choose reactively, without a coherent framework, and then live with the consequences compounding across years. The real problem is structural, not technical.',
    primaryButton: 'Services',
    secondaryButton: 'Resources',
  },
  perspective: {
    lede: 'An external eye finds what internal teams have learned to live with.',
    tagline: 'Perspective',
    heading: 'What Allister sees',
    tiles: keyed('tile', [
      {
        title: 'Workarounds that became the system',
        text: 'Every practice has them. Manual steps inserted between tools. Data re-entered because systems do not talk. Email used as workflow because nothing else fits. These are not inefficiencies. They are invisible infrastructure. No one reports them because everyone assumes they are normal. An external review makes them visible and shows what becomes possible when they are removed.',
        linkLabel: 'Workflow Workshop',
      },
      {
        title: 'Fragmented choices that compound into risk',
        text: 'One team picks software for speed. Another chooses based on cost. A third inherits legacy systems no one wants to replace. Each decision made sense at the time. Together they create governance gaps, duplicated data, conflicting workflows and costs that climb without visibility. The problem is not the tools. It is the absence of a framework that connects them.',
        linkLabel: 'Blueprint',
      },
      {
        title: 'The gap between what leadership believes and what actually happens',
        text: 'Partners assume BIM is embedded. Project directors know it is partial. Teams use workarounds leadership has never seen. Investment in training does not translate to adoption. What gets reported upwards and what happens on projects are often two different stories. Closing that gap is where real change begins.',
        linkLabel: 'ADDDvisory',
      },
    ]),
  },
  validation: {
    tagline: 'Validation',
    heading: 'Proven outcomes across architecture practices',
    image1: { path: '', alt: '' },
    image2: { path: '', alt: '' },
    text: 'ADAM Architecture reduced licensing costs by half, uncovered eighteen hidden workflow steps and aligned leadership around a shared digital roadmap. The approach works because it treats technology as a system, not a series of isolated tools. Allister’s work spans 1,800+ researched AEC software solutions, direct experience with AJ100 practices and ongoing industry research through reports, speaking and the ADDDitive newsletter.',
    button: 'Case study',
  },
};
