/*
  The ADDD Stack Ecosystem: the software inventory the Stack Diagnostic
  page shows (src/pages/stack-diagnostic.astro, drawn by
  src/scripts/stack-space.js), as supplied on 2026-11-04: 13 categories and
  20 products, some products in more than one category.

  Three kinds of thing, kept apart, so the page can grow without its
  drawing changing:

  - a TOOL is one software product: one record however many categories it
    is listed in, with the inventory's line for it in each (notes, by
    category id); its summary is its first category's line;
  - a CATEGORY is how the inventory sorts the tools (AI Rendering, Markups…).
    It is not a stack: the page lets a visitor bring a category's tools
    together, and says plainly that it is a category;
  - a STACK is a curated combination of tools chosen for one architectural
    workflow (visualisation, documentation…). Stacks are made in the Studio
    (studio/schemaTypes/documents/tech-stack.ts), and the page leads with
    them (since 2026-11-04). The site holds only what a stack's preview
    shows: its name, workflow, purpose, how many tools it has and the two or
    so tools named before sign-up. The full stack is in the ADDD app,
    behind its sign-up, and is never written here or in the dataset.
    Until stacks are published, SAMPLE_STACKS stand in for them on staging
    and in development only, each labelled a sample on the page; production
    never shows them.

  Logos: a tool's logo is reserved a square on its card; where the site has
  the product's own mark (public/assets/logos/software) it goes in logo,
  otherwise the card shows the tool's initials in a plain square. None of
  these twenty has a mark in the site yet. A few widely used products whose
  own marks the site does have (PLATFORMS: Rhino, Bluebeam, Slack, Notion,
  ChatGPT) can stand in a stack beside them, each with its own mark only.

  Every card on the page belongs to a stack (2026-11-04): the row and the
  list show the stacks' tools, never a tool on its own. Every stack takes
  the one colour (STACK_TONE: the row's cards, the list's blocks and the
  sheet's title); the row tells them apart by the stack being read.

  Shaped so it can move into the Studio as three document types (tool,
  category, stack) without the page or its script changing.
*/

export interface Category {
  id: string;
  name: string;
}

export interface Tool {
  id: string;
  name: string;
  /** the inventory's line for the tool in each category it is listed in */
  notes: Record<string, string>;
  /** its categories, in the inventory's order (the first is its home) */
  categories: string[];
  /** the product's own mark, where the site has it (public/assets/...) */
  logo?: string;
  /** something in the inventory that needs confirming before it is shown as fact */
  verify?: string;
}

/** a stack as the page previews it */
export interface Stack {
  id: string;
  name: string;
  /** the workflow it is chosen for */
  workflow: string;
  /** what it helps a practice do */
  summary: string;
  /** how many tools the full stack holds */
  toolCount: number;
  /** the tools named before sign-up, by name */
  preview: string[];
  /** where the full stack is, in the ADDD app */
  url: string;
  /** a stand-in, shown on staging and in development only */
  sample?: boolean;
}

/** The stacks' colour: their cards' ground and the ink on it. Since
    2026-11-04 (sixth pass, at the user's word) one colour for every stack:
    the stacks are told apart by which is being read, the one at the row's
    middle or under the pointer at full strength and the others a little
    faded (stack-space.js), not by a shade of their own. (Before: close
    greys in turn, and before that solid colours.) */
export interface Tone {
  ground: string;
  ink: string;
}
export const STACK_TONE: Tone = { ground: "#ffffff", ink: "#0a0a0a" };

/** where a stack without its own link sends a visitor: the app's sign-up */
export const APP_SIGN_UP = "https://app.addd.io/sign-up";

export const CATEGORIES: Category[] = [
  { id: "ai-design", name: "AI Design" },
  { id: "revit-plugins", name: "Revit Plugins" },
  { id: "ai-rendering", name: "AI Rendering & Visualisation" },
  { id: "ai-manual", name: "AI Manual" },
  { id: "hardware", name: "Hardware" },
  { id: "cde", name: "Common Data Environments" },
  { id: "project-management", name: "Project Management" },
  { id: "data-connectors", name: "Data & Connectors" },
  { id: "practice-management", name: "Practice Management" },
  { id: "training", name: "Training Partner" },
  { id: "markups", name: "Markups" },
  { id: "reports-graphics", name: "Reports, Graphics & Presentations" },
  { id: "generative-design", name: "Generative Design & BIM 2.0" },
];

// each listing in the inventory, in its order: [category, tool, line]
const LISTINGS: [string, string, string][] = [
  ["ai-design", "laiout", "AI commercial floor planning and layout generation from PDF/DWG files."],
  ["ai-design", "Ideatura", "AI-assisted Revit automation using natural-language instructions."],
  ["ai-design", "DTOAEC", "Building-product information and technical design knowledge."],
  ["revit-plugins", "Ideatura", "Automated dimensions, tags, sheets, views, and repetitive Revit tasks."],
  ["revit-plugins", "DTOAEC", "Building-product information and BIM-related design resources."],
  ["ai-rendering", "RunDiffusion", "AI image and video generation platform."],
  ["ai-rendering", "xFigura", "AI creative workspace for text, image, and 3D generation."],
  ["ai-rendering", "MyarchitectAI", "Browser-based architectural AI rendering."],
  ["ai-rendering", "Prome", "AI visualisation from sketches and 3D models."],
  ["ai-manual", "There", "AI-assisted site reporting, inspections, and snagging."],
  ["ai-manual", "ARKI", "Architectural knowledge search across BIM, CAD, and PDF files."],
  ["ai-manual", "Cogram", "AI meeting notes, summaries, and email assistance."],
  ["hardware", "DesignAir", "Cloud computing and virtual desktops for CAD/BIM workflows."],
  ["cde", "Sofidus.tech", "Centralised documents, collaboration, project data, and construction information."],
  ["project-management", "Layer", "AEC data management connecting surveys, BIM, and building information."],
  ["project-management", "Plannerly", "BIM management, information requirements, model checking, and ISO 19650 workflows."],
  ["data-connectors", "ARKI", "AI search and knowledge management for architectural project information."],
  ["data-connectors", "Satori", "Listed with a description of CenterPoint: a platform for interactive 3D design-intent information and connected data."],
  ["practice-management", "Synergy", "CRM, timesheets, financial reporting, resource management, and practice operations."],
  ["training", "AAL Innovation Academy", "Training in digital transformation, BIM, AI, computational design, and project management."],
  ["markups", "Markedup", "Automated drawing checking and technical-document quality control."],
  ["markups", "zipBoard", "Collaborative review, feedback, annotations, and approvals."],
  // Reports, Graphics & Presentations: no products listed yet
  ["generative-design", "laiout", "Automated commercial floor planning and design metrics."],
  ["generative-design", "Spaciv", "AI-powered workplace design and generative space planning."],
];

const VERIFY: Record<string, string> = {
  Satori: "The inventory lists this product as Satori but describes CenterPoint. The product's name needs confirming.",
};

/* Widely used products the site has the marks of (public/assets/logos/
   software), for a stack to name beside the inventory's: each with its own
   mark, its role, and a plain line on what it is. */
export const PLATFORMS: { name: string; role: string; note: string; logo: string }[] = [
  { name: "Rhino", role: "3D modelling", note: "3D modelling for design development, form-finding and fabrication.", logo: "/assets/logos/software/rhino-icon.svg" },
  { name: "Bluebeam", role: "PDF review", note: "PDF markup, measurement and document review.", logo: "/assets/logos/software/bluebeam-mark.svg" },
  { name: "Slack", role: "Team messaging", note: "Messaging and channels for project teams.", logo: "/assets/logos/software/slack.svg" },
  { name: "Notion", role: "Notes and wiki", note: "Shared notes, wikis and project documentation.", logo: "/assets/logos/software/notion.svg" },
  { name: "ChatGPT", role: "AI assistant", note: "A general AI assistant for drafting, research and prompts.", logo: "/assets/logos/software/chatgpt.svg" },
];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** one record per product, its categories and lines gathered from every listing */
export const TOOLS: Tool[] = (() => {
  const byName = new Map<string, Tool>();
  for (const [category, name, line] of LISTINGS) {
    let tool = byName.get(name);
    if (!tool) {
      tool = { id: slug(name), name, notes: {}, categories: [], ...(VERIFY[name] ? { verify: VERIFY[name] } : {}) };
      byName.set(name, tool);
    }
    tool.categories.push(category);
    tool.notes[category] = line;
  }
  return [...byName.values()];
})();

/* Stand-ins for curated stacks, for the page's layout on staging and in
   development until the Studio has stacks: made of the inventory's own
   tools (and a few PLATFORMS), marked as samples in their sheets, never a
   recommendation, and never on production (stack-diagnostic.astro).
   Between them they hold every tool of the inventory but Satori, whose
   name needs confirming first (VERIFY). */
export const SAMPLE_STACKS: Stack[] = [
  { id: "sample-visualisation", name: "Visualisation", workflow: "Architectural visualisation", summary: "From sketch or massing model to images a client can react to.", toolCount: 5, preview: ["Rhino", "Prome", "RunDiffusion"], url: APP_SIGN_UP, sample: true },
  { id: "sample-space-planning", name: "Early layouts", workflow: "Space planning", summary: "Test commercial floor plates and workplace options before the model.", toolCount: 4, preview: ["laiout", "Spaciv"], url: APP_SIGN_UP, sample: true },
  { id: "sample-documentation", name: "Documentation", workflow: "BIM documentation", summary: "Take the repetitive work out of Revit, and check drawings before issue.", toolCount: 6, preview: ["Ideatura", "Markedup", "Bluebeam"], url: APP_SIGN_UP, sample: true },
  { id: "sample-operations", name: "Practice operations", workflow: "Practice management", summary: "Resourcing, timesheets and meeting notes, joined up.", toolCount: 4, preview: ["Synergy", "Cogram", "Slack"], url: APP_SIGN_UP, sample: true },
  // three more (2026-11-04), so the row reads as stacks end to end
  { id: "sample-information", name: "Project information", workflow: "BIM management", summary: "Keep models, documents and information requirements in one place, and checked.", toolCount: 5, preview: ["Plannerly", "Sofidus.tech"], url: APP_SIGN_UP, sample: true },
  { id: "sample-knowledge", name: "Practice knowledge", workflow: "Knowledge and search", summary: "Find what the practice already knows, across BIM, CAD and PDF files.", toolCount: 3, preview: ["ARKI", "DTOAEC", "Notion"], url: APP_SIGN_UP, sample: true },
  { id: "sample-site", name: "Site and delivery", workflow: "Construction stage", summary: "Site reports, snags and reviews, from the visit to the sign-off.", toolCount: 4, preview: ["There", "zipBoard"], url: APP_SIGN_UP, sample: true },
  // and three more (2026-11-04, fourth pass), so every tool stands in one
  { id: "sample-cloud", name: "Cloud workstations", workflow: "Remote working", summary: "Model and draw on machines in the cloud, with survey and building data connected.", toolCount: 4, preview: ["DesignAir", "Layer"], url: APP_SIGN_UP, sample: true },
  { id: "sample-concepts", name: "Concept imagery", workflow: "Early design ideas", summary: "Turn a brief, a sketch or a massing model into images and ideas to test early.", toolCount: 4, preview: ["xFigura", "MyarchitectAI", "ChatGPT"], url: APP_SIGN_UP, sample: true },
  { id: "sample-skills", name: "Skills and adoption", workflow: "Training", summary: "Bring the team up to speed on BIM, AI and computational design.", toolCount: 3, preview: ["AAL Innovation Academy"], url: APP_SIGN_UP, sample: true },
];

/** a stack from the Studio, as the page previews it */
export interface StackDocument {
  _id: string;
  title?: string;
  workflow?: string;
  summary?: string;
  toolCount?: number;
  previewTools?: string[];
  appUrl?: string;
}
export const stackOf = (doc: StackDocument): Stack => {
  const preview = (doc.previewTools ?? []).filter(Boolean).slice(0, 3);
  return {
    id: doc._id.replace(/^drafts\./, ""),
    name: doc.title ?? "",
    workflow: doc.workflow ?? "",
    summary: doc.summary ?? "",
    toolCount: Math.max(preview.length, Math.round(doc.toolCount ?? preview.length)),
    preview,
    url: doc.appUrl || APP_SIGN_UP,
  };
};

/** how many tools each category lists */
export const categoryCount = (id: string) => TOOLS.filter((t) => t.categories.includes(id)).length;
