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
import { layoutTimeline, type TimelineValue } from './timeline';

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

// Text as a reader sees it: every run of spaces and line breaks one space
const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();

// Whether an element holds text of its own beside its child elements
const hasLooseText = (el: Element) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');

// The element that holds a line's words: down through wrappers with one child
// and no text of their own (.br-hero__line > .br-hero__ink)
const textHolder = (el: Element): Element => {
  let holder = el;
  while (holder.children.length === 1 && !hasLooseText(holder)) holder = holder.children[0];
  return holder;
};

/**
 * A field's text in its element, keeping the page's markup. Text the page
 * already shows (however its markup splits it into lines or runs) is left
 * exactly as built: replacing it flattened statements set line by line (the
 * Before Revit hero's three lines ran together across the page, and their
 * animation lost its targets). Changed text set in lines (a "\n" per line,
 * and one element per line on the page) goes line by line into those
 * elements, a line added copying the first; anything else is plain text.
 */
const setText = (el: Element, value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') return;
  if (collapse(el.textContent ?? '') === collapse(value)) return;
  const lines = value.split('\n');
  const parts = [...el.children];
  const inLines = lines.length > 1 && parts.length > 0 && !hasLooseText(el) && parts.every((part) => part.tagName === parts[0].tagName && part.className === parts[0].className);
  if (!inLines) {
    el.textContent = value;
    return;
  }
  while (parts.length < lines.length) {
    const copy = parts[0].cloneNode(true) as Element;
    parts[parts.length - 1].after(copy);
    parts.push(copy);
  }
  parts.forEach((part, index) => {
    if (index < lines.length) textHolder(part).textContent = lines[index];
    else part.remove();
  });
  // Its name for screen readers, where the lines themselves are hidden from them
  if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', collapse(value));
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

/* What the editor can select (2026-11-17, at the user's word): anything
   that repeats is one block. A list (tabs, cards, questions, steps), the
   fields of a list's entries shown anywhere in a section, and a timeline
   are outlined as a whole, at the element that holds all of them, and a
   click opens that list in the Studio's panel, where adding, ordering and
   changing its entries is explained. Their words are still drawn live, but
   not outlined one by one. A single field (a heading, a line, a picture)
   stays selectable on its own. An element can name its block itself
   (data-page-block="examine.tabs"): everything inside it is that block. */
type Claims = { direct: [Element, Path][]; groups: Map<string, { path: string; members: Element[] }> };

// the path of the list a field belongs to ("examine.tabs.2.title" → "examine.tabs"), or null
const listOf = (path: string): string | null => {
  const parts = path.split('.');
  const at = parts.findIndex((part) => /^\d+$/.test(part));
  return at > 0 ? parts.slice(0, at).join('.') : null;
};

const inBlock = (el: Element) => !!el.parentElement?.closest('[data-page-block]') || (el as HTMLElement).dataset?.pageBlock !== undefined;

function claim(claims: Claims, el: Element, path: string, asList = false) {
  if (inBlock(el)) return;
  const list = asList ? path : listOf(path);
  if (!list) {
    claims.direct.push([el, toPath(path) as Path]);
    return;
  }
  // one block per list in each section (a list shown in two places is two blocks)
  const section = el.closest('section, [data-page-doc]');
  const id = `${list}|${section ? [...document.querySelectorAll('section, [data-page-doc]')].indexOf(section) : -1}`;
  const group = claims.groups.get(id) ?? { path: list, members: [] };
  group.members.push(el);
  claims.groups.set(id, group);
}

// the nearest element holding every one of them
function holderOf(members: Element[]): Element {
  let holder: Element | null = members[0];
  while (holder && !members.every((m) => holder!.contains(m))) holder = holder.parentElement;
  return holder ?? members[0];
}

function applyClaims(claims: Claims, scope: Element[], ref: Ref) {
  // last time's outlines go, so an element that is now part of a block loses its own
  scope.forEach((root) => {
    if (root instanceof HTMLElement && root.dataset.pageDoc === ref.id) delete root.dataset.sanity;
    root.querySelectorAll<HTMLElement>('[data-sanity]').forEach((el) => {
      if (el.closest('[data-page-doc]') === root || el.closest<HTMLElement>('[data-page-doc]')?.dataset.pageDoc === ref.id) delete el.dataset.sanity;
    });
  });
  claims.direct.forEach(([el, path]) => mark(el, path, ref));
  claims.groups.forEach(({ path, members }) => {
    const holder = holderOf(members);
    if (!inBlock(holder)) mark(holder, toPath(path) as Path, ref);
  });
  document.querySelectorAll<HTMLElement>('[data-page-block]').forEach((el) => {
    if (scopeOf(el, ref.id) && el.dataset.pageBlock) mark(el, toPath(el.dataset.pageBlock) as Path, ref);
  });
}

// A timeline (StageTimeline.astro): redrawn from the draft, every stage at its
// length, so changing one in the Studio resizes its box at once
function renderTimeline(root: HTMLElement, value: TimelineValue) {
  const { units, stages } = layoutTimeline(value);
  const rows = [...root.querySelectorAll<HTMLElement>('[data-tl-row]')];
  const template = rows[0];
  if (!template || stages.length === 0) return;
  const holder = template.parentElement!;
  while (rows.length < stages.length) {
    const copy = template.cloneNode(true) as HTMLElement;
    holder.append(copy);
    rows.push(copy);
  }
  rows.slice(stages.length).forEach((row) => row.remove());
  root.style.setProperty('--tl-count', String(units));
  stages.forEach((stage, i) => {
    const row = rows[i];
    const num = row.querySelector('[data-tl-num]');
    if (num) num.textContent = `${String(i + 1).padStart(2, '0')} /`;
    const box = row.querySelector<HTMLElement>('[data-tl-box]');
    if (box) box.style.gridColumn = `${stage.start + 2} / span ${stage.span}`;
    const title = row.querySelector('[data-tl-title]');
    if (title) title.textContent = stage.title;
    const when = row.querySelector<HTMLElement>('[data-tl-when]');
    if (when) {
      when.textContent = stage.when;
      when.hidden = !stage.when;
    }
    const items = row.querySelector('[data-tl-items]');
    if (items) {
      items.replaceChildren(
        ...stage.items.map((item) => {
          const li = document.createElement('li');
          li.className = `is--${item.by}`;
          li.textContent = item.label;
          return li;
        }),
      );
    }
  });
}

// A list of a page's repeatable blocks (a FAQ's questions, a grid of cards):
// redrawn from the draft in its order, so adding, removing and moving a block
// shows at once (a new one copies the first's markup). The list is selected
// as one block (above), its entries' words drawn into them here.
function renderList(list: HTMLElement, blocks: Block[]) {
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
    delete el.dataset.sanity;
    el.querySelectorAll<HTMLElement>('[data-page-item-field]').forEach((field) => {
      const name = field.dataset.pageItemField ?? '';
      const value = block[name];
      delete field.dataset.sanity;
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
  const claims: Claims = { direct: [], groups: new Map() };
  document.querySelectorAll<HTMLElement>('[data-page-timeline]').forEach((root) => {
    if (!scopeOf(root, ref.id) || !root.dataset.pageTimeline) return;
    const value = valueAt(doc, root.dataset.pageTimeline);
    if (value && typeof value === 'object') renderTimeline(root, value as TimelineValue);
  });
  document.querySelectorAll<HTMLElement>('[data-page-list]').forEach((list) => {
    if (!scopeOf(list, ref.id) || !list.dataset.pageList) return;
    const blocks = valueAt(doc, list.dataset.pageList);
    if (Array.isArray(blocks) && blocks.length > 0) renderList(list, blocks as Block[]);
    claim(claims, list, list.dataset.pageList, true);
  });
  document.querySelectorAll<HTMLElement>('[data-page-field]').forEach((el) => {
    if (!scopeOf(el, ref.id) || !el.dataset.pageField || el.closest('[data-page-list]')) return;
    const path = el.dataset.pageField;
    claim(claims, el, path);
    const value = valueAt(doc, path);
    if (el instanceof HTMLImageElement) setImage(el, value);
    else setText(el, value);
  });
  document.querySelectorAll<HTMLElement>('[data-page-bg]').forEach((el) => {
    if (!scopeOf(el, ref.id) || !el.dataset.pageBg || el.closest('[data-page-list]')) return;
    claim(claims, el, el.dataset.pageBg);
    setBackground(el, valueAt(doc, el.dataset.pageBg));
  });
  applyClaims(claims, [...document.querySelectorAll(`[data-page-doc="${CSS.escape(ref.id)}"]`)], ref);
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

// Shift + G opens and closes the Studio's editing panel, also while the
// keyboard is in the page: the Studio can't hear keys pressed in its frame,
// so the page passes it on (TOGGLE_EDITOR_MESSAGE in
// @stasiosdesign/sanity-cms/protocol). Not while typing in a field.
window.addEventListener('keydown', (event) => {
  if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.key.toLowerCase() !== 'g') return;
  const el = event.target;
  if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
  event.preventDefault();
  window.parent.postMessage({ type: 'sanity-cms/toggle-editor' }, '*');
});
