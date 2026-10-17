/*
  The four routes, in the order the homepage's deck stacks them
  (ServiceDeck.astro) and the order of their diagrams (ServiceDiagram.astro):
  where each card leads, and the short list of what it covers. The list is
  the card's and the hero's of the page it opens into (ServiceHero.astro),
  so a card's list stays the same words as the card becomes the page. The
  words are the short forms of what each service page sets out.
*/
export interface ServiceRoute {
  /** the service page, root-relative so it holds one folder deep too */
  href: string;
  /** what the route covers, a line each */
  covers: string[];
}

export const SERVICES: ServiceRoute[] = [
  {
    href: "/workshops-audits.html",
    covers: ["A half day on a live project", "How work actually moves", "Where tools and workflows create friction", "A written report of priorities", "No further commitment"],
  },
  {
    href: "/before-revit.html",
    covers: ["The early stages of design", "Tools, information and decisions", "What carries into Revit or Archicad", "What is recreated or lost on the way", "What should change first"],
  },
  {
    href: "/technology-blueprint.html",
    covers: ["Eight weeks, practice-wide", "Workflows and software", "Licensing costs", "Infrastructure, data and AI readiness", "A sequenced roadmap"],
  },
  {
    href: "/advisory.html",
    covers: ["A monthly 60-minute session", "A rotating theme", "Decision frameworks and comparisons", "Questions between sessions", "One practice membership"],
  },
];
