/* src/newsletter/sections.ts: an issue's content cut into rows, one per
   <h2>, however deep beehiiv wraps its blocks. `npm run test:site`. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { postSections } from "../src/newsletter/sections.ts";

test("headings deep inside beehiiv's wrappers still start their rows, in order", async () => {
  const html = `<div><div><p>Hi there</p></div><div><div><h2>This week's partner</h2><p>Ideatura</p></div></div><div><h2>News &amp; Events</h2><div><h3>Clinic</h3><p>When: 25th</p></div></div><div><p>Thanks for reading</p></div></div>`;
  const sections = await postSections(html);
  assert.deepEqual(sections.map((s) => s.heading), ["", "This week's partner", "News &amp; Events"]);
  assert.match(sections[0].html, /Hi there/);
  assert.match(sections[2].html, /<h3>Clinic<\/h3>[\s\S]*When: 25th[\s\S]*Thanks for reading/);
});

test("a post with no section headings stays one row", async () => {
  const sections = await postSections("<div><p>One</p><p>Two</p></div>");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].heading, "");
});
