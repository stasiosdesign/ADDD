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
import newsletterBeehiiv from "./newsletter-beehiiv.png";

/* A side-by-side (2026-11-17, at the user's word): a draft in beehiiv on
   the left (a screenshot), the same issue on the website on the right
   (drawn, backend.astro), their parts numbered alike; under them, each
   part and what it becomes. "at": where the part sits down the screenshot,
   in per cent of its height. */
export interface Compare {
  image: ImageMetadata;
  alt: string;
  parts: { n: number; beehiiv: string; site: string; at: number }[];
  link?: { label: string; href: string };
}

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
  /** an arrowhead at both ends: something goes each way */
  both?: boolean;
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
  { id: "overview-group", tab: "Overview", sections: ["overview", "timeline", "three", "platforms"] },
  { id: "editing-group", tab: "Editing the Site", sections: ["editing", "page-editor", "collections"] },
  { id: "report-group", tab: "Adding a Report", sections: ["report", "publishing", "automations"] },
  { id: "newsletter-group", tab: "Adding a Newsletter", sections: ["newsletter", "newsletter-steps"] },
  { id: "tasks-group", tab: "Final Tasks", sections: ["tasks"] },
  { id: "questions-group", tab: "Questions", sections: ["questions"] },
];

/* A timeline (2026-11-17, second pass after a plan the user pointed to): the
   working days across the top, then a row per phase, stepping down: each
   phase a block from its first day to its last (indexes into days, both
   included), a line along its top, its title and its points as bullets.
   Allister's phases carry his photo. */
export interface Timeline {
  /** a weekend day is shown, blocked out: Allister's work stops under it, ours carries on over it */
  days: { day: string; date: string; today?: boolean; weekend?: boolean }[];
  phases: { title: string; from: number; to: number; who: "us" | "allister" | "launch"; items: string[] }[];
}

export interface Section {
  id: string;
  /** its tab on the left */
  tab: string;
  title: string;
  /** a line under the title, only where it says something the title and diagram do not */
  lede?: string;
  /** a picture under the line (a screenshot), before the diagram */
  image?: { src: ImageMetadata; alt: string };
  timeline?: Timeline;
  /** the call's agenda (the introduction): each part or section, its number and a few words */
  agenda?: { n: string; title: string; text: string; href: string }[];
  /** questions for the call, numbered, each with a line of detail */
  questions?: { q: string; detail?: string }[];
  /** tasks as numbered drop-downs: a title, a line and points */
  tasks?: { title: string; text: string; items?: string[] }[];
  compare?: Compare;
  diagram?: Diagram;
  /** under the diagram, side by side: a heading and its bullet points each (2026-11-17) */
  lists?: { platform?: PlatformKey; title: string; items: string[] }[];
  notes?: string[];
}

/* The timeline to launch: one, shown twice (1.2 and 5.1), so they always agree */
const LAUNCH_TIMELINE: Timeline = {
  days: [
    { day: "Tue", date: "17", today: true },
    { day: "Wed", date: "18" },
    { day: "Thu", date: "19" },
    { day: "Fri", date: "20" },
    { day: "Sat", date: "21", weekend: true },
    { day: "Sun", date: "22", weekend: true },
    { day: "Mon", date: "23" },
    { day: "Tue", date: "24" },
    { day: "Wed", date: "25" },
    { day: "Thu", date: "26" },
    { day: "Fri", date: "27" },
  ],
  phases: [
    { title: "Backend walkthrough", from: 0, to: 0, who: "us", items: [] },
    {
      title: "Allister: content in Sanity",
      from: 0,
      to: 7,
      who: "allister",
      items: ["Final copy", "Operational details", "FAQs", "Reports with automations", "Booking calendar"],
    },
    { title: "Automations connected", from: 1, to: 3, who: "us", items: ["Each report linked to its automation"] },
    { title: "Visual fixes and final refinements", from: 1, to: 8, who: "us", items: ["Anything new content upsets", "Fixes and changes", "Testing"] },
    { title: "Technical and SEO setup", from: 2, to: 8, who: "us", items: ["Technical foundations", "Foundational SEO"] },
    { title: "Launch", from: 10, to: 10, who: "launch", items: ["Domain live", "Desktop", "Mobile"] },
  ],
};

export const SECTIONS: Section[] = [
  {
    id: "overview",
    tab: "Introduction",
    title: "Backend and integrations",
    agenda: [
      { n: "1.2", title: "Timeline to launch", text: "From today to launch on Friday 27", href: "#timeline" },
      { n: "1.3", title: "Platforms", text: "Sanity, beehiiv and Softr", href: "#three" },
      { n: "2", title: "Editing the site", text: "The page editor and collections", href: "#editing" },
      { n: "3", title: "Adding a report", text: "From Sanity to an inbox", href: "#report" },
      { n: "4", title: "Adding a newsletter", text: "Written in beehiiv, shown on the site", href: "#newsletter" },
      { n: "5", title: "Final tasks", text: "What Allister prepares before launch", href: "#tasks" },
      { n: "6", title: "Questions", text: "What we still need to know", href: "#questions" },
    ],
  },

  /* From today to launch (2026-11-17, at the user's word): Tuesday 17 to
     Friday 27 November, the weekend shown but blocked out. */
  {
    id: "timeline",
    tab: "Timeline",
    title: "Timeline to launch",
    timeline: LAUNCH_TIMELINE,
  },

  /* The three platforms Allister uses himself (2026-11-17, at the user's
     word): everything else connects to one of them. */
  {
    id: "three",
    tab: "Platforms",
    title: "Platforms",
    // the three on top; the website, which they all reach, under them
    diagram: {
      w: 1000,
      h: 340,
      nodes: [
        { id: "sanity", platform: "sanity", text: "The website’s content", x: 160, y: 60, w: 280, h: 110 },
        { id: "beehiiv", platform: "beehiiv", text: "The newsletter and emails", x: 500, y: 60, w: 280, h: 110 },
        { id: "softr", platform: "softr", text: "The ADDD app", x: 840, y: 60, w: 280, h: 110 },
        { id: "website", platform: "website", text: "Connects the three", x: 500, y: 275, w: 280, h: 100, muted: true },
      ],
      edges: [
        { from: "sanity", to: "website", label: "Content" },
        { from: "website", to: "beehiiv", label: "Sign-ups", straight: true },
        { from: "website", to: "softr", label: "Sign-in" },
      ],
    },
    lists: [
      { platform: "sanity", title: "Sanity is used for the website’s content", items: ["Reports", "Images", "Text", "Links"] },
      { platform: "beehiiv", title: "beehiiv is used for", items: ["The ADDDitive newsletter", "Email automations"] },
      { platform: "softr", title: "Softr is the ADDD app, used for", items: ["The Software Database", "Access to the tech stacks"] },
    ],
    notes: [
      "Everything else (hosting, the backend, Google Drive) runs behind these three.",
    ],
  },

  {
    id: "platforms",
    tab: "How they connect",
    title: "How they connect",
    // what moves between them (2026-11-17, at the user's word): the
    // website in the middle, each platform where it meets it; hosting is
    // infrastructure, under it all, not a part of its own
    diagram: {
      w: 1000,
      h: 330,
      nodes: [
        { id: "sanity", platform: "sanity", text: "Pages and reports", x: 130, y: 70, w: 230, h: 100 },
        { id: "website", platform: "website", text: "Shows it all", x: 500, y: 70, w: 230, h: 100 },
        { id: "beehiiv", platform: "beehiiv", text: "Newsletter and emails", x: 870, y: 70, w: 230, h: 100 },
        { id: "softr", platform: "softr", text: "Database and tech stacks", x: 500, y: 265, w: 230, h: 100 },
        { id: "inbox", title: "Readers’ inboxes", text: "Reports and the ADDDitive", x: 870, y: 265, w: 230, h: 100, muted: true },
      ],
      edges: [
        { from: "sanity", to: "website", label: "Content" },
        { from: "website", to: "beehiiv", label: "Sign-ups · issues", both: true },
        { from: "website", to: "softr", label: "Sign-in" },
        { from: "beehiiv", to: "inbox", label: "Emails" },
      ],
    },
    notes: ["Hosting runs underneath it all: infrastructure, nothing to manage."],
  },

  {
    id: "editing",
    tab: "Two ways to edit",
    title: "Two ways to edit",
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
    tab: "Page editor",
    title: "Page editor",
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
    lists: [
      { title: "What it is: editing what’s already on the site", items: ["Headings, text and pictures", "Buttons and links", "Timelines, e.g. the Technology Blueprint’s", "FAQs and pricing"] },
      { title: "What it isn’t", items: ["New reports or pages: CMS collections (2.3)", "Newsletters: written in beehiiv (4)", "The ADDD app: Softr"] },
    ],
    notes: ["Click anything on the page to edit it. Nothing goes live until you publish."],
  },

  {
    id: "collections",
    tab: "CMS collections",
    title: "CMS collections",
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
      "Reports: each entry becomes its own page.",
      "Newsletter: view only, written in beehiiv (part 4).",
    ],
  },

  /* How a report works (2026-11-17, third pass, at the user's word): a
     report is a page of its own with a sign-up; one sign-up gives instant
     access and starts the report's beehiiv automation, which emails the
     product and adds the reader to the newsletter. */
  {
    id: "report",
    tab: "How it works",
    title: "How a report works",
    diagram: {
      w: 1000,
      h: 430,
      nodes: [
        { id: "page", platform: "website", title: "Report page", text: "Its own content and a sign-up", x: 165, y: 60, w: 280, h: 110 },
        { id: "signup", platform: "website", title: "Sign up", text: "The visitor enters their email", x: 500, y: 60, w: 280, h: 110 },
        { id: "auto", platform: "beehiiv", title: "beehiiv automation", text: "Chosen for this report", x: 835, y: 60, w: 280, h: 110 },
        { id: "instant", platform: "website", title: "Instant access", text: "Taken straight to the product", x: 500, y: 290, w: 280, h: 100 },
        { id: "frame", kind: "frame", title: "What the automation does", x: 835, y: 305, w: 300, h: 230 },
        { id: "emailed", platform: "beehiiv", title: "Emailed the product", x: 835, y: 255, w: 260, h: 80 },
        { id: "news", platform: "beehiiv", title: "Joins the newsletter", text: "The ADDDitive", x: 835, y: 355, w: 260, h: 80 },
      ],
      edges: [
        { from: "page", to: "signup" },
        { from: "signup", to: "auto", label: "Starts" },
        { from: "signup", to: "instant", label: "At once" },
        { from: "auto", to: "frame", label: "Then" },
      ],
    },
    notes: [
      "One sign-up: instant access, the product by email, and the newsletter.",
      "The emails come from the report’s beehiiv automation.",
    ],
  },

  {
    id: "publishing",
    tab: "Steps",
    title: "Adding a report",
    diagram: {
      w: 1000,
      h: 130,
      nodes: [
        { id: "p1", kind: "step", n: 1, title: "Create the report in Sanity", x: 92, y: 65, w: 168, h: 110 },
        { id: "p2", kind: "step", n: 2, title: "Add its title, text and images", x: 296, y: 65, w: 168, h: 110 },
        { id: "p3", kind: "step", n: 3, title: "Choose how it’s accessed", x: 500, y: 65, w: 168, h: 110 },
        { id: "p4", kind: "step", n: 4, title: "Choose its beehiiv automation", x: 704, y: 65, w: 168, h: 110 },
        { id: "p5", kind: "step", n: 5, title: "Publish", x: 908, y: 65, w: 168, h: 110 },
      ],
      edges: [
        { from: "p1", to: "p2" },
        { from: "p2", to: "p3" },
        { from: "p3", to: "p4" },
        { from: "p4", to: "p5" },
      ],
    },
    lists: [
      { title: "Ways in (step 3)", items: ["beehiiv sign-up (most common)", "HubSpot form", "Payment link", "Any other link, e.g. a Google Form"] },
      { title: "Its automation (step 4)", items: ["Built in beehiiv first", "Chosen from the report’s drop-down in Sanity", "Not listed? Name it and we connect it"] },
    ],
    notes: ["Build the automation in beehiiv first, or it won’t appear in Sanity."],
  },
  {
    id: "automations",
    tab: "Automations",
    title: "Report automations",
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
    notes: ["Each sign-up starts the automation its report names."],
  },

  /* The newsletter (2026-11-17, at the user's word): written and sent in
     beehiiv alone; the site shows each published issue by itself
     (src/newsletter/beehiiv.ts, api/beehiiv.js, README "Newsletter"). */
  {
    id: "newsletter",
    tab: "How it works",
    title: "How a newsletter works",
    compare: {
      image: newsletterBeehiiv,
      alt: "A draft of the ADDDitive in beehiiv: its title, subtitle, a banner image, a heading and the opening text.",
      parts: [
        { n: 1, beehiiv: "Title", site: "The page’s title", at: 3.3 },
        { n: 2, beehiiv: "Subtitle", site: "The line under the title", at: 11.5 },
        { n: 3, beehiiv: "Images", site: "Images, in the site’s frame", at: 33 },
        { n: 4, beehiiv: "Headings", site: "Headings, in the site’s type", at: 53 },
        { n: 5, beehiiv: "Text, links and lists", site: "The body, in the site’s type", at: 72 },
      ],
      link: { label: "See a newsletter page", href: "https://addd-staging.vercel.app/newsletter/addditive-template" },
    },
    notes: [
      "Write and send in beehiiv as usual. The site updates itself.",
      "beehiiv’s styling is dropped. The site adds the date, reading time and cover.",
    ],
  },

  {
    id: "newsletter-steps",
    tab: "Steps",
    title: "Adding a newsletter",
    diagram: {
      w: 1000,
      h: 130,
      nodes: [
        { id: "n1", kind: "step", n: 1, title: "Write it in beehiiv", x: 115, y: 65, w: 210, h: 110 },
        { id: "n2", kind: "step", n: 2, title: "Publish to email and web", x: 372, y: 65, w: 210, h: 110 },
        { id: "n3", kind: "step", n: 3, title: "The site updates by itself", x: 628, y: 65, w: 210, h: 110 },
        { id: "n4", kind: "step", n: 4, title: "Live on the Newsletter page", x: 885, y: 65, w: 210, h: 110 },
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
      ],
    },
    notes: [
      "Only free issues published to the web appear.",
      "Edits and deletions in beehiiv reach the site too.",
    ],
  },

  /* Final tasks (2026-11-17, at the user's word): who does what next */
  {
    id: "tasks",
    tab: "Allister’s tasks",
    title: "Allister’s tasks",
    timeline: LAUNCH_TIMELINE,
    tasks: [
      {
        title: "Final copy in Sanity",
        text: "Every page’s words, as they should read at launch, written in the page editor.",
        items: ["Headings, introductions and body text", "Buttons and what they say", "Pictures where a page needs a new one"],
      },
      {
        title: "Operational details",
        text: "The facts behind each service, so the pages promise what ADDD delivers.",
        items: ["Timelines: each stage and how long it takes", "Deliverables: what the client receives", "Pricing", "Who takes part from the client’s side", "What the client prepares beforehand"],
      },
      {
        title: "FAQs",
        text: "The questions clients really ask, with ADDD’s answers, on each page that has them.",
      },
      {
        title: "Reports, each with its beehiiv automation",
        text: "Each report added in Sanity, its automation built in beehiiv first, then chosen from the report’s drop-down.",
      },
      {
        title: "A booking calendar",
        text: "A free booking page connected to your own calendar, so calls never clash. Send Stas its link.",
        items: ["Calendly (calendly.com) or Cal.com (cal.com): both free", "Connect it to Google Calendar, or whichever calendar you use"],
      },
    ],
  },
  /* Questions for the call (2026-11-17, at the user's word) */
  {
    id: "questions",
    tab: "For Allister",
    title: "For Allister",
    questions: [
      {
        q: "When someone signs up to the ADDD app (Softr), is their email added to the newsletter?",
        detail: "For example, someone signing up to see a full free tech stack. Is there an automation for this, or is it added by hand?",
      },
    ],
  },
];
