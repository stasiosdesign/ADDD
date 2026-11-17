/* The designer's own comments for Site Review (the CMS package's comment
   layer, "Website comments" in its README): staging and development only,
   loaded by BaseLayout.astro in a tab the Studio opened, never in
   production. Each is a seed: the layer shows it expanded beside the
   element its selector names, and keeps it in Sanity (the staging dataset)
   the first time a page opens, so Site Review counts it. Replies,
   completing and everything else are the layer's own.

   A note's `id` is what it is kept under: never change one once used.
   `page` is the page's address as the layer reads it (no `.html`, the
   home page "/"). `at` is where the card sits against its element:
   vertical (top, bottom inside it; above, below outside it) then
   horizontal (left, right inside; before, after outside), moved by
   `offset` in pixels. */

/** The notes' author, the designer */
export const designer = { id: 'stas', name: 'Stas', role: 'admin' };

type Note = { id: string; page: string; target: string; at: string; offset?: [number, number]; text: string };

// None for now (2026-11-17, at the user's word): a new Site Review round
// starts with no comments. The four notes asked before (the home page's
// cost images, AEC Tech Partners' image, the free tech stacks, Technology
// Blueprint case studies) are kept, resolved, with the 9 November round.
// Add a note here to have it seeded again.
const NOTES: Note[] = [];

const CREATED = '2026-11-05T16:00:00.000Z';

/** The notes as the layer's seeds: open, expanded, the designer's */
export const seeds = NOTES.map((note) => ({
  id: note.id,
  origin: 'seed',
  display: 'expanded',
  page: note.page,
  anchor: { type: 'placement', selector: note.target, at: note.at, offset: note.offset ?? [0, 0] },
  status: 'open',
  createdAt: CREATED,
  messages: [{ id: `${note.id}:0`, authorId: designer.id, body: note.text, attachments: [], createdAt: CREATED }],
}));
