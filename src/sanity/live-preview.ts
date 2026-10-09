/* Visual editing in the Studio's Visual editor (Sanity's Presentation tool).

   Staging and development only: production builds leave it out, and even
   there it loads only when the page is open in a frame (BaseLayout.astro), so
   visitors never download it. With the Studio as the parent it:
   - connects the click-to-edit outlines (enableVisualEditing);
   - asks the Studio for each document on the page in live mode
     (enableLiveMode): the Studio runs the queries with the editor's own
     login, drafts included, and sends every change as it is typed, so no
     token reaches the browser;
   - writes those drafts into the elements that show them, and again
     whenever Barba brings a page in.

   What it reads from the page (content.ts): an element naming its document
   (data-page-doc, data-page-type: the Barba container, or a nested block
   such as the closing call to action, which every page takes from the Home
   page) and, inside it, each element naming the field it shows:
   - data-page-field="hero.heading"       the element's text; on an <img>, its
                                          picture (at data-page-width)
   - data-page-bg="cost.cards.0.image"    a slot drawn with a background picture
   - data-page-list="faq.questions"       a list of blocks, redrawn from the
                                          draft in its order: each block an
                                          element carrying its key
                                          (data-page-item), its fields marked
                                          by name (data-page-item-field)
   A field a draft leaves empty keeps the page's own words. The page underneath
   is rendered by staging in draft mode (src/sanity/draft-mode/), so anything
   else a draft changes shows when the preview reloads. */
import { createQueryStore } from '@sanity/core-loader';
import { createDataAttribute, enableVisualEditing } from '@sanity/visual-editing-standalone';
import { sanityClient } from './client';
import { valueAt, type Block, type Doc } from './content';
import { hasImage, urlFor } from './image';
import { PAGE_QUERY } from './queries';

type Path = NonNullable<Parameters<typeof createDataAttribute>[0]['path']>;
type Ref = { id: string; type: string };

// The Studio framing this page; its outlines open documents there
const studioUrl = (() => {
  try {
    return new URL(document.referrer).origin;
  } catch {
    return 'https://addd.sanity.studio';
  }
})();

// A path into a document, with list positions as numbers ("cards.0.title")
const toPath = (field: string): (string | number)[] => field.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part));

const mark = (el: Element, path: Path, ref: Ref) => {
  if (el instanceof HTMLElement) el.dataset.sanity = createDataAttribute({ baseUrl: studioUrl, id: ref.id, type: ref.type, path }).toString();
};

const setText = (el: Element, value: unknown) => {
  if (typeof value === 'string' && value.trim() !== '' && el.textContent !== value) el.textContent = value;
};

const setImage = (el: Element, value: unknown) => {
  if (!(el instanceof HTMLImageElement) || !hasImage(value)) return;
  const src = urlFor(value).width(Number(el.dataset.pageWidth) || 1600).url();
  if (el.getAttribute('src') !== src) el.src = src;
};

const setBackground = (el: Element, value: unknown) => {
  if (!(el instanceof HTMLElement) || !hasImage(value)) return;
  const url = `url(${urlFor(value).width(Number(el.dataset.pageWidth) || 1600).url()})`;
  if (el.style.backgroundImage !== url) el.style.backgroundImage = url;
};

// A list of a page's repeatable blocks (a FAQ's questions, a grid of cards):
// redrawn from the draft in its order, so adding, removing and moving a block
// shows at once (a new one copies the first's markup), and each block marked
// by its key, so a click on one opens that very block in the Studio's panel.
function renderList(list: HTMLElement, path: string, blocks: Block[], ref: Ref) {
  const current = [...list.querySelectorAll<HTMLElement>(':scope > [data-page-item]')];
  const template = current[0];
  if (!template) return;
  const byKey = new Map(current.map((el) => [el.dataset.pageItem, el]));
  let previous: HTMLElement | null = null;
  for (const block of blocks) {
    let el = byKey.get(block._key);
    byKey.delete(block._key);
    if (!el) {
      el = template.cloneNode(true) as HTMLElement;
      el.dataset.pageItem = block._key;
    }
    const blockPath = [...toPath(path), { _key: block._key }];
    mark(el, blockPath as Path, ref);
    el.querySelectorAll<HTMLElement>('[data-page-item-field]').forEach((field) => {
      const name = field.dataset.pageItemField ?? '';
      const value = block[name];
      mark(field, [...blockPath, ...toPath(name)] as Path, ref);
      if (field instanceof HTMLImageElement) setImage(field, value);
      else if (field.dataset.pageItemBg !== undefined) setBackground(field, value);
      else setText(field, value);
    });
    if (previous) previous.after(el);
    else list.prepend(el);
    previous = el;
  }
  byKey.forEach((el) => el.remove());
}

const scopeOf = (el: Element, id: string) => el.closest<HTMLElement>('[data-page-doc]')?.dataset.pageDoc === id;

function renderDoc(ref: Ref, doc: Doc) {
  // Lists first: their blocks' fields are marked as they are drawn
  document.querySelectorAll<HTMLElement>('[data-page-list]').forEach((list) => {
    if (!scopeOf(list, ref.id) || !list.dataset.pageList) return;
    const blocks = valueAt(doc, list.dataset.pageList);
    if (Array.isArray(blocks) && blocks.length > 0) renderList(list, list.dataset.pageList, blocks as Block[], ref);
  });
  document.querySelectorAll<HTMLElement>('[data-page-field]').forEach((el) => {
    if (!scopeOf(el, ref.id) || !el.dataset.pageField || el.closest('[data-page-list]')) return;
    const path = el.dataset.pageField;
    mark(el, toPath(path) as Path, ref);
    const value = valueAt(doc, path);
    if (el instanceof HTMLImageElement) setImage(el, value);
    else setText(el, value);
  });
  document.querySelectorAll<HTMLElement>('[data-page-bg]').forEach((el) => {
    if (!scopeOf(el, ref.id) || !el.dataset.pageBg || el.closest('[data-page-list]')) return;
    mark(el, toPath(el.dataset.pageBg) as Path, ref);
    setBackground(el, valueAt(doc, el.dataset.pageBg));
  });
}

// The Studio's address bar follows the page: every page Barba brings in is
// reported, and a page the Studio asks for is opened through Barba, keeping
// its transitions. Same-page moves are ignored.
type Barba = { hooks: { after: (hook: () => void) => void }; go?: (href: string) => Promise<void> };
const getBarba = () => (window as unknown as { barba?: Barba }).barba;
const samePage = (url: string) => new URL(url, location.href).pathname === location.pathname;
enableVisualEditing({
  zIndex: 10000, // above the site's own layers
  history: {
    subscribe: (navigate) => {
      const report = () => navigate({ type: 'replace', url: `${location.pathname}${location.search}${location.hash}` });
      report();
      getBarba()?.hooks.after(report);
      window.addEventListener('popstate', report);
      return () => window.removeEventListener('popstate', report);
    },
    update: (change) => {
      if (change.type === 'pop') return history.back();
      if (samePage(change.url)) return;
      const barba = getBarba();
      if (barba?.go) barba.go(change.url);
      else location.assign(change.url);
    },
  },
});

// One live query per document, made the first time a page shows it; its
// latest draft is drawn in on arrival and again on every page Barba brings in
const { createFetcherStore, enableLiveMode } = createQueryStore({ client: sanityClient, ssr: false });
const live = new Map<string, { ref: Ref; latest?: Doc }>();

function update() {
  const refs = new Map<string, Ref>();
  document.querySelectorAll<HTMLElement>('[data-page-doc]').forEach((el) => {
    const id = el.dataset.pageDoc;
    if (id) refs.set(id, { id, type: el.dataset.pageType || id });
  });
  refs.forEach((ref, id) => {
    const known = live.get(id);
    if (known) {
      if (known.latest) renderDoc(ref, known.latest);
      return;
    }
    const entry: { ref: Ref; latest?: Doc } = { ref };
    live.set(id, entry);
    createFetcherStore<Doc | null>(PAGE_QUERY, { id }).subscribe(({ data }) => {
      if (!data) return;
      entry.latest = data;
      renderDoc(ref, data);
    });
  });
}

enableLiveMode({ client: sanityClient });
update();
getBarba()?.hooks.after(update);

// Opening a section in the Studio's side panel scrolls the page to it: the
// Studio posts the section's field name (SHOW_SECTION_MESSAGE in
// @stasiosdesign/sanity-cms/protocol), and the first element showing a
// field of that section is brought into view
const SHOW_SECTION = new Set(['sanity-cms/show-section', 'tomrow/show-section']);
window.addEventListener('message', (event) => {
  if (event.source !== window.parent || !SHOW_SECTION.has(event.data?.type) || typeof event.data.section !== 'string') return;
  const name = CSS.escape(event.data.section);
  const part = [...document.querySelectorAll(`[data-page-field="${name}"], [data-page-field^="${name}."], [data-page-list^="${name}."], [data-page-bg^="${name}."]`)].find(
    (el) => (el as HTMLElement).offsetParent !== null,
  );
  if (!part) return;
  const target = part.closest('section') ?? part;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
