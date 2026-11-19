/* A post's content in sections, one per <h2> (2026-11-16), for the post
   page's rows (NewsletterIssue.astro): each section's heading beside its
   words. The content before the first <h2> is a section with no heading.
   beehiiv wraps its blocks in a div or two: those single wrappers are gone
   through first; an <h2> deeper than that stays where it is, in its
   section's words. */
import { ELEMENT_NODE, TEXT_NODE, parse, render, type Node } from "ultrahtml";

export interface PostSection {
  /** the heading's inner markup ("" for the opening section) */
  heading: string;
  html: string;
}

const WRAPPERS = new Set(["div", "section", "article", "main"]);
const blank = (node: Node) => node.type === TEXT_NODE && !node.value.trim();
const hasHeading = (node: Node): boolean =>
  node.type === ELEMENT_NODE && (node.name === "h2" || (node.children ?? []).some(hasHeading));
/* (2026-11-19) beehiiv's blocks come in wrappers of their own, several
   side by side and some deep (the 18 November issue: no <h2> at the top
   level at all, so it was one untitled row). A wrapper with a section
   heading somewhere inside is opened, wherever it is, so every <h2> reaches
   the top and starts its row; a wrapper with none stays whole, in order. */
const flatten = (nodes: Node[]): Node[] =>
  nodes.flatMap((node) => (node.type === ELEMENT_NODE && WRAPPERS.has(node.name) && hasHeading(node) ? flatten(node.children) : [node]));

export async function postSections(html: string): Promise<PostSection[]> {
  let nodes: Node[] = parse(html).children;
  for (;;) {
    const solid = nodes.filter((node) => !blank(node));
    const only = solid[0];
    if (solid.length !== 1 || only.type !== ELEMENT_NODE || !WRAPPERS.has(only.name)) break;
    nodes = only.children;
  }
  nodes = flatten(nodes);
  const groups: { heading: Node[] | null; nodes: Node[] }[] = [{ heading: null, nodes: [] }];
  for (const node of nodes) {
    if (node.type === ELEMENT_NODE && node.name === "h2") groups.push({ heading: node.children, nodes: [] });
    else groups[groups.length - 1].nodes.push(node);
  }
  const out = await Promise.all(groups.map(async (group) => ({
    heading: group.heading ? (await Promise.all(group.heading.map((n) => render(n)))).join("").trim() : "",
    html: (await Promise.all(group.nodes.map((n) => render(n)))).join("").trim(),
  })));
  // an opening with nothing in it (the post starts on a heading)
  return out.filter((section, i) => i > 0 || section.html);
}
