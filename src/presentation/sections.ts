/* TEMPORARY (2026-11-16): the sections of the software Backend and integrations page
   at /backend (see platforms.ts), as data. One scrolling page (second
   pass, at the user's word: no slides): every section a tab in the list on
   the left, and on the right its title, a line under it and, where it
   helps, a diagram and a note or two.

   A diagram is a plane of its own size (w by h), scaled to the column:
   nodes placed by their centre (x, y) and size (w, h), and edges between
   them by node id, drawn edge to edge (Diagram.astro), so a moved node
   keeps its lines.

   Third pass (2026-11-16, at the user's word): the page says how things
   are set up from now on, and nothing about how they were (no Carrd, no
   HubSpot, no "today" or "proposed"). Other reports' email sequences are
   not invented: only the AI in the Built Environment automation's steps
   are shown, as seen in beehiiv. */
import type { ImageMetadata } from "astro";
import type { PlatformKey } from "./platforms";
import pageEditor from "./page-editor.png";

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** a platform's card: its mark, its name and what it does here (either may be replaced) */
  platform?: PlatformKey;
  title?: string;
  text?: string;
  /** a step's number */
  n?: number;
  /** "card" (default), "step", "frame" (an outline round others, its title
     at its top), "label" (a column's heading), "pill" (a short outcome) */
  kind?: "card" | "step" | "frame" | "label" | "pill";
  /** quieter: still to come, optional, or not documented */
  muted?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  /** dashed: optional, or still to confirm */
  dashed?: boolean;
  /** no arrowhead */
  plain?: boolean;
  /** straight down (or across) from the first node's centre */
  straight?: boolean;
}

export interface Diagram {
  w: number;
  h: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/* The tab list's groups (third pass, at the user's word): each a tab of
   its own that opens, when it is the one being read or is clicked, onto
   its sections, numbered; the sections in SECTIONS' order. */
export interface Group {
  id: string;
  tab: string;
  sections: string[];
}

export const GROUPS: Group[] = [
  { id: "overview-group", tab: "Overview", sections: ["overview", "platforms"] },
  { id: "editing-group", tab: "Editing the site", sections: ["editing", "page-editor", "collections"] },
  { id: "report-group", tab: "Report", sections: ["report", "publishing", "automations"] },
];

export interface Section {
  id: string;
  /** its tab on the left */
  tab: string;
  title: string;
  lede: string;
  /** a picture under the line (a screenshot), before the diagram */
  image?: { src: ImageMetadata; alt: string };
  diagram?: Diagram;
  notes?: string[];
}

export const SECTIONS: Section[] = [
  {
    id: "overview",
    tab: "Introduction",
    title: "Backend and integrations",
    lede: "How the software behind the ADDD website fits together, and what each part is responsible for.",
  },

  {
    id: "platforms",
    tab: "The platforms",
    title: "Five parts, one job each",
    lede: "Sanity holds the content, the website shows it, the backend passes sign-ups on, and beehiiv sends the emails.",
    diagram: {
      w: 1000,
      h: 360,
      nodes: [
        { id: "sanity", platform: "sanity", x: 105, y: 80, w: 205, h: 120 },
        { id: "website", platform: "website", x: 368, y: 80, w: 205, h: 120 },
        { id: "backend", platform: "backend", title: "Backend", text: "Sends sign-ups to beehiiv", x: 632, y: 80, w: 205, h: 120 },
        { id: "beehiiv", platform: "beehiiv", x: 895, y: 80, w: 205, h: 120 },
        { id: "drive", platform: "drive", x: 895, y: 290, w: 205, h: 120, muted: true },
      ],
      edges: [
        { from: "sanity", to: "website", label: "Content" },
        { from: "website", to: "backend", label: "Sign-ups" },
        { from: "backend", to: "beehiiv", label: "API" },
        { from: "beehiiv", to: "drive", label: "Download links", dashed: true },
      ],
    },
    notes: ["Google Drive keeps hosting downloads where that suits."],
  },

  {
    id: "editing",
    tab: "Two ways to edit",
    title: "Editing the site",
    lede: "Everything on the site is edited in Sanity, ADDD's content studio, in one of two ways: the page editor, for what is already on a page, and CMS collections, for new things that get a page of their own.",
    diagram: {
      w: 1000,
      h: 230,
      nodes: [
        { id: "sanity", platform: "sanity", text: "Where the site is edited", x: 500, y: 45, w: 230, h: 90 },
        { id: "editor", platform: "sanity", title: "Page editor", text: "Change what is already there", x: 260, y: 180, w: 300, h: 90 },
        { id: "cms", platform: "sanity", title: "CMS collections", text: "Add new things with their own page", x: 740, y: 180, w: 300, h: 90 },
      ],
      edges: [
        { from: "sanity", to: "editor" },
        { from: "sanity", to: "cms" },
      ],
    },
  },

  {
    id: "page-editor",
    tab: "The page editor",
    title: "The page editor",
    lede: "For the words and pictures already on the site. Open a page, select the part to change, change it and publish.",
    image: { src: pageEditor, alt: "The page editor in Sanity: the selected section's fields on the left, the page itself on the right with the part being edited outlined." },
    diagram: {
      w: 1000,
      h: 130,
      nodes: [
        { id: "e1", kind: "step", n: 1, title: "Open the page in Sanity", x: 115, y: 65, w: 210, h: 110 },
        { id: "e2", kind: "step", n: 2, title: "Select the part to change", x: 372, y: 65, w: 210, h: 110 },
        { id: "e3", kind: "step", n: 3, title: "Change its words or picture", x: 628, y: 65, w: 210, h: 110 },
        { id: "e4", kind: "step", n: 4, title: "Publish", x: 885, y: 65, w: 210, h: 110 },
      ],
      edges: [
        { from: "e1", to: "e2" },
        { from: "e2", to: "e3" },
        { from: "e3", to: "e4" },
      ],
    },
    notes: [
      "The page is shown as it looks on the site, with its fields beside it: select a heading, a line or a picture on the page and its field opens, ready to change.",
      "Almost every element built on the site can be edited this way. It changes what is already there; it does not add new pages.",
      "Nothing changes on the live site until you publish.",
    ],
  },

  {
    id: "collections",
    tab: "CMS collections",
    title: "CMS collections",
    lede: "For new content that gets a page of its own. A collection is a template: each entry added to it becomes its own page on the site.",
    diagram: {
      w: 1000,
      h: 300,
      nodes: [
        { id: "reports", platform: "sanity", title: "Reports", text: "A collection in Sanity", x: 160, y: 150, w: 260, h: 100 },
        { id: "ra", platform: "website", title: "AI in the Built Environment", text: "Its own page", x: 720, y: 50, w: 400, h: 76 },
        { id: "rb", platform: "website", title: "Generative Design Cheat Sheet", text: "Its own page", x: 720, y: 150, w: 400, h: 76 },
        { id: "rc", platform: "website", title: "A new report", text: "Added as an entry: its page made for it", x: 720, y: 250, w: 400, h: 76, muted: true },
      ],
      edges: [
        { from: "reports", to: "ra" },
        { from: "reports", to: "rb" },
        { from: "reports", to: "rc", dashed: true },
      ],
    },
    notes: [
      "On this site, the one collection to use is Reports: to add a report, add an entry to it.",
      "The difference: the page editor changes content that is already there; a collection adds new content, each entry with its own page.",
      "Reports are covered in full in the Report section.",
    ],
  },

  {
    id: "report",
    tab: "How it works",
    title: "From a report page to an inbox",
    lede: "A visitor signs up on the report's page, and beehiiv sends them the report and what follows it.",
    diagram: {
      w: 1000,
      h: 480,
      nodes: [
        { id: "page", platform: "website", title: "Report page", text: "With its sign-up form", x: 105, y: 65, w: 205, h: 110 },
        { id: "backend", platform: "backend", title: "Backend", text: "Sends the sign-up on", x: 368, y: 65, w: 205, h: 110 },
        { id: "beehiiv", platform: "beehiiv", text: "Adds the subscriber", x: 632, y: 65, w: 205, h: 110 },
        { id: "auto", platform: "beehiiv", title: "Automation", text: "The report's own emails", x: 895, y: 65, w: 205, h: 110 },
        { id: "frame", kind: "frame", title: "Inside a report's automation: AI in the Built Environment", x: 500, y: 305, w: 990, h: 150 },
        { id: "s1", kind: "step", n: 1, title: "Subscriber added", x: 90, y: 310, w: 140, h: 72 },
        { id: "s2", kind: "step", n: 2, title: "Send the report", x: 254, y: 310, w: 140, h: 72 },
        { id: "s3", kind: "step", n: 3, title: "Status: Active", x: 418, y: 310, w: 140, h: 72 },
        { id: "s4", kind: "step", n: 4, title: "Wait one day", x: 582, y: 310, w: 140, h: 72 },
        { id: "s5", kind: "step", n: 5, title: "Follow-up email", x: 746, y: 310, w: 140, h: 72 },
        { id: "s6", kind: "step", n: 6, title: "And so on", x: 910, y: 310, w: 140, h: 72, muted: true },
        { id: "news", kind: "pill", title: "Then receives the ADDD newsletter", x: 418, y: 448, w: 300, h: 40 },
      ],
      edges: [
        { from: "page", to: "backend" },
        { from: "backend", to: "beehiiv" },
        { from: "beehiiv", to: "auto" },
        { from: "auto", to: "frame", plain: true, dashed: true, straight: true },
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s3", to: "news", dashed: true },
      ],
    },
    notes: ["The report's email carries its download link."],
  },

  {
    id: "publishing",
    tab: "Setting one up",
    title: "Adding a report",
    lede: "No page building. Each report page is made from its entry in Sanity.",
    diagram: {
      w: 1000,
      h: 130,
      nodes: [
        { id: "p1", kind: "step", n: 1, title: "Create it in Sanity", x: 92, y: 65, w: 168, h: 110 },
        { id: "p2", kind: "step", n: 2, title: "Add title, text and images", x: 296, y: 65, w: 168, h: 110 },
        { id: "p3", kind: "step", n: 3, title: "Choose its automation", x: 500, y: 65, w: 168, h: 110 },
        { id: "p4", kind: "step", n: 4, title: "Publish", x: 704, y: 65, w: 168, h: 110 },
        { id: "p5", kind: "step", n: 5, title: "Visitors get its emails", x: 908, y: 65, w: 168, h: 110 },
      ],
      edges: [
        { from: "p1", to: "p2" },
        { from: "p2", to: "p3" },
        { from: "p3", to: "p4" },
        { from: "p4", to: "p5" },
      ],
    },
    notes: ["A report's automation and its emails are set up in beehiiv before the report is published."],
  },
  {
    id: "automations",
    tab: "Its automation",
    title: "Each report has its own automation",
    lede: "A report names its automation in Sanity, so every sign-up starts the right emails.",
    diagram: {
      w: 1000,
      h: 340,
      nodes: [
        { id: "h1", kind: "label", title: "Report, in Sanity", x: 250, y: 16, w: 380, h: 24 },
        { id: "h2", kind: "label", title: "Automation, in beehiiv", x: 750, y: 16, w: 380, h: 24 },
        { id: "ra", platform: "sanity", title: "AI in the Built Environment", x: 250, y: 95, w: 380, h: 76 },
        { id: "aa", platform: "beehiiv", title: "Automation A", text: "Report, activate, wait, follow-up", x: 750, y: 95, w: 380, h: 76 },
        { id: "rb", platform: "sanity", title: "Generative Design Cheat Sheet", x: 250, y: 200, w: 380, h: 76 },
        { id: "ab", platform: "beehiiv", title: "Automation B", text: "Its own emails", x: 750, y: 200, w: 380, h: 76 },
        { id: "rc", platform: "sanity", title: "FASS Assessment", x: 250, y: 305, w: 380, h: 76 },
        { id: "ac", platform: "beehiiv", title: "Automation C", text: "Its own emails", x: 750, y: 305, w: 380, h: 76 },
      ],
      edges: [
        { from: "ra", to: "aa" },
        { from: "rb", to: "ab" },
        { from: "rc", to: "ac" },
      ],
    },
    notes: ["Each automation uses beehiiv's API trigger: it starts when the backend adds the subscriber and names that automation."],
  },

];
