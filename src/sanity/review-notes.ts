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

const DRIVE = 'https://drive.google.com/drive/folders/1qUs6T9DWWB_4FciRVqQKiCYcruC9Cihn?usp=drive_link';

/** The notes' author, the designer */
export const designer = { id: 'stas', name: 'Stas', role: 'admin' };

type Note = { id: string; page: string; target: string; at: string; offset?: [number, number]; text: string };

const NOTES: Note[] = [
  {
    // the three cards under "What actually costs you time"
    id: 'note:home:cost-images',
    page: '/',
    target: '#cost .problem-grid',
    at: 'above-right',
    offset: [0, -16],
    text: `Could you please provide an image for each of these three blocks? You can upload them to the Homepage folder here: ${DRIVE}`,
  },
  {
    // "Close to the practices making technology decisions"
    id: 'note:tech-firms:why-image',
    page: '/tech-firms',
    // inside the cards' top-right corner: above them is the heading
    target: '#why .tf-why__cards',
    at: 'top-right',
    offset: [-16, 16],
    text: `Could you please provide an image for this section? You can upload it to the AEC Tech Partners folder here: ${DRIVE}`,
  },
  {
    // the Free Tech Stacks page's heading, over the row of stacks
    id: 'note:stack-diagnostic:stacks',
    page: '/stack-diagnostic',
    target: '.sd__head',
    at: 'below-left',
    offset: [0, 24],
    text: 'Could you please add me to Softr (softr.io)? Alternatively, just send me the three tech stacks you’d like to feature so I can add them to the website.',
  },
  {
    // the Technology Blueprint's opening, under its buttons (the text's own
    // box fills the held hero)
    id: 'note:technology-blueprint:hero',
    page: '/technology-blueprint',
    target: '.bp-hero__actions',
    at: 'below-left',
    offset: [0, 32],
    text: 'Do you have any specific Technology Blueprint case studies, metrics or deliverables we could showcase on this page? It would be great to include some real examples.',
  },
];

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
