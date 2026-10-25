# ADDD — website

The ADDD website, built with [Astro](https://astro.build), whose content is
managed in [Sanity](https://www.sanity.io). No UI framework: Astro components
for the markup, plain CSS, and plain JavaScript on GSAP, Barba and Lenis. One
repository, two apps: the website at the root, deployed by Vercel, and the
Sanity Studio in `studio/`, where the content is edited.

## Commands

Requires Node 22.12 or later. The two apps install their own dependencies:
`npm install`, then `npm install` in `studio/` (the Studio's CMS package is
private: see "The CMS").

```bash
npm run dev            # dev server on http://localhost:4321 (staging's behaviour)
npm run studio         # the Studio on http://localhost:3333; its Visual editor shows 4321
npm run build          # production build into dist/ (static, from the production dataset)
npm run preview        # serve the production build locally
npm run check          # type-checks the site, then the Studio's checks and tests
npm run studio:deploy  # deploys the hosted Studio
```

## Addresses

|            | URL                                                   | From                        |
| ---------- | ----------------------------------------------------- | --------------------------- |
| Production | https://addd-io.vercel.app              | `main`                      |
| Staging    | https://addd-staging.vercel.app     | `staging`                   |
| Studio     | https://addd.sanity.studio                            | `studio/`, deployed by hand |

Staging's URL is Vercel's alias for the `staging` branch: it always shows the
branch's latest deployment. The Vercel project is `addd`, in the
`stasiosdesign` team; the Sanity project is `xqa8b0u9`.

## Production and staging

|                | Production (`main`)                     | Staging (`staging`)                            |
| -------------- | --------------------------------------- | ---------------------------------------------- |
| Built          | static, at deploy time                  | on each request, by a Vercel Function          |
| Sanity content | the `production` dataset                | the `staging` dataset; drafts in draft mode    |
| Visual editor  | never                                   | the Studio's Visual editor shows staging       |
| Search engines | indexed                                 | never: `noindex, nofollow` on every response   |
| Access         | public                                  | Vercel Authentication (and the Studio's bypass)|

Which is which comes from Vercel itself (`VERCEL_ENV`: `production` for
`main`, `preview` for every other branch), read in `astro.config.mjs`. Nothing
depends on a hostname, so adding a domain changes no code. `npm run dev`
behaves like staging, on your machine. The site keeps its `.html` addresses
in both (`build.format: "file"`; where staging renders on request,
`src/middleware.ts` rewrites each `.html` address to the route that renders it).

## Workflow

```
local (npm run dev, npm run studio)  →  staging  →  review  →  main
```

1. Work locally. Nothing is deployed until you push.
2. Send changes to staging: `git switch staging`, commit, `git push`.
3. Review on the staging URL, or in the Studio's Visual editor, where staging
   shows unpublished drafts too.
4. Promote to production once approved: `git switch main`, `git merge
   --ff-only staging`, `git push`, `git switch staging`.

## Content: draft, staging, live

Two datasets, one for each site (`src/sanity/client.ts` picks one by
deployment), and Sanity's own drafts in the one the Studio edits:

| State   | Where                                | Made by                  | Shown by                                       |
| ------- | ------------------------------------ | ------------------------ | ---------------------------------------------- |
| Draft   | `staging`, `drafts.<id>`             | typing in the Studio     | staging, in draft mode only (the Visual editor)|
| Staging | `staging`, the published document    | **Publish to Staging**   | staging, to everyone                           |
| Live    | `production`, the published document | **Publish Live…**        | production, at its next build                  |

- **Production** is built from the `production` dataset alone, at build time.
  Its build has no draft-mode routes, no publishing route and no
  visual-editing code. A code release rebuilds it from that dataset as it is,
  so deploying code never publishes content, and publishing content never
  deploys code.
- **Staging** reads the `staging` dataset on every request: published
  documents for anyone, drafts for a browser in **draft mode**, which the
  Studio's Visual editor switches on through `/api/draft-mode/enable`
  (`src/sanity/draft-mode/`; the read token stays on the server).
- The Studio's publishing control (the CMS package's) sends every action to
  `/api/publish` on staging (`src/sanity/publish/`), which checks the caller's
  Studio session and role, writes with its own token, and after every live
  write calls the Vercel deploy hook for `main`, so the static production
  site is rebuilt with the new content (about a minute; the control watches
  `/build.json`, whose `contentFrom` says when the build read its content,
  and shows a rebuild that doesn't come as failed, with Try again). That
  rebuild is of a commit that hasn't changed, so production builds are never
  skipped (`vercel.ts`: its ignore rule is for staging alone; from 10 to 25
  Oct 2026 it skipped them, and live publishes never reached the site). **Publish to Staging** never touches production; **Publish
  Live…** asks for confirmation first.

### What is editable

Every page has a document in the Studio's Page editor (`studio/schemaTypes/pages/`),
holding the words and pictures its code no longer fixes: taglines, headings,
standfirsts, the words on buttons, the cards, steps, questions, price cards
and quotes, the home page's logo strip (the clients) and the closing call to
action most pages end on (from the Home page). Layout, navigation, the footer,
forms, icons and where buttons lead stay in the code. Two collections,
**Reports** and **Newsletter**, list on their pages and in the sliders, and
each item has its own page (`/reports/<slug>.html`, `/newsletter/<slug>.html`).

Every bound element falls back to the page's own words
(`src/sanity/defaults/`, exactly the text the pages had) while a field is
empty, so the site reads the same until something is published. `npm run
seed` in `studio/` writes those defaults into the staging dataset, once.

## Environment variables

Set in Vercel (Settings → Environment Variables) and locally in
`.env.development.local` (see `.env.example`):

| Variable                           | Production | Preview                  | Local                     |
| ---------------------------------- | ---------- | ------------------------ | ------------------------- |
| `SANITY_API_READ_TOKEN` (secret)   | not set    | Git branch `staging` only| optional, for drafts      |
| `SANITY_API_WRITE_TOKEN` (secret)  | not set    | Git branch `staging` only| optional, for Publish Live|
| `VERCEL_DEPLOY_HOOK_URL` (secret)  | not set    | Git branch `staging` only| optional                  |

The Studio's, in committed files: `SANITY_STUDIO_PREVIEW_ORIGIN` (staging's
URL in `studio/.env.production`, http://localhost:4321 in
`studio/.env.development`) and `SANITY_STUDIO_PRODUCTION_ORIGIN` (the live
site). Both are public settings.

## Vercel

- One project, `addd`, connected to `stasiosdesign/ADDD`; production branch
  `main`. Build settings and headers (the build stamp's CORS, staging's
  noindex) are in `vercel.ts`.
- **Deployment Protection:** Vercel Authentication protects every deployment
  except the production domain. The Studio gets through with Vercel's
  *Protection Bypass for Automation* secret, saved once in the Studio's
  **Vercel Protection Bypass** tool (`/vercel-protection-bypass`).
- **Deploy hook** on `main`, whose URL is `VERCEL_DEPLOY_HOOK_URL` for the
  `staging` branch's environment: `/api/publish` calls it after every live
  publish, unpublish or delete.

## Adding a custom domain

No code changes: add the domain to the Vercel project for Production (and a
`staging.` domain for the Git branch `staging`, if wanted); set
`SANITY_STUDIO_PRODUCTION_ORIGIN` (and the preview origin, for a staging
domain) in `studio/.env.production`, add any new staging origin to Sanity's
CORS origins, then `npm run studio:deploy`.

## The CMS

The Studio is the shared CMS package `@stasiosdesign/sanity-cms` (private,
GitHub Packages; the `sanity-cms` repository): the layout, editors,
publishing control and design every Stasios Design Studio shares, set up for
this site by `studio/project.ts` (brand, sites, pages, collections, routes)
and `studio/schemaTypes/` (the content model). Updates arrive as Dependabot
pull requests against `staging`; CLAUDE.md, "The CMS", has the rules. First
time on a machine: give npm read access to GitHub Packages (the package's
README, "Access"), then `npm install` in `studio/`.

## Pages

Every page keeps its original URL. `build.format: "file"` in `astro.config.mjs`
writes `src/pages/about.astro` to `/about.html` rather than `/about/`, so the
relative links between pages (`href="about.html"`) and the URLs Barba fetches
are unchanged.

| URL | Source |
|---|---|
| `/index.html` (`/`) | `src/pages/index.astro` — Home |
| `/workshops-audits.html` | `src/pages/workshops-audits.astro` |
| `/technology-blueprint.html` | `src/pages/technology-blueprint.astro` |
| `/advisory.html` | `src/pages/advisory.astro` — ADDDvisory |
| `/stack-diagnostic.html` | `src/pages/stack-diagnostic.astro` |
| `/software-licensing-audit.html` | `src/pages/software-licensing-audit.astro` |
| `/reports.html` | `src/pages/reports.astro` — Reports index |
| `/report-template.html` | `src/pages/report-template.astro` — "The ultimate BIM 2.0 report" |
| `/newsletter.html` | `src/pages/newsletter.astro` — Newsletter index |
| `/newsletter-template.html` | `src/pages/newsletter-template.astro` — "AI in architecture" |
| `/tech-firms.html` | `src/pages/tech-firms.astro` — AEC Tech Partners (a centred black hero, `Hero.astro` "centred", on a dotted isometric lattice with stacks of blue plates round its words lying in its cells (one cell, `--cell`, sets out both), drawn in the flatter 2:1 view of the reference rather than the site's 30° isometric (`data-iso-angle`), `IsoStacks.astro`; the blue statements panel; then the original approach cards from the homepage — Understand, Diagnose, Prioritise) |
| `/about.html` | `src/pages/about.astro` |
| `/contact.html` | `src/pages/contact.astro` |

External destinations (`Sign in`, `Software Database`, `AEC Jobs`) link out to
their own sites and are not pages here.

## Structure

```
src/
  layouts/BaseLayout.astro   the shell every page shares: <head>, loader, wipe
                             panel, nav, grid overlay, Barba container, footer,
                             stylesheets and scripts
  components/                the shell's parts — Loader, MorphLoader, Transition, Nav,
                             ColumnGrid, Footer — and the pieces pages share:
                             Hero, ActionButton, ClosingCta, Accordion,
                             InsightCard, InsightSlider, ArrowIcon, and the
                             homepage's ApproachStack
  pages/*.astro              one per page — its title, description, Barba page
                             name and <main>; repeated content (cards, FAQs)
                             sits in a data array in the frontmatter
  styles/*.css               the site stylesheets, imported by the layout
  scripts/                   site.js (the arrival, the wipe and the page
                             lifecycle), with gsap-setup.js, scroll.js (Lenis
                             and ScrollTrigger), page.js (what components
                             share) and nav.js around it, and one module per
                             component: slash-field.js, approach-stack.js,
                             sticky-title.js, dot-lift.js (the dots lifted
                             round the logos), cell-grid.js (the dots behind
                             the statement drawn as a grid of cells, its
                             photographs lit in them),
                             service-tabs.js, parallax.js,
                             reveals.js, insight-slider.js, …
public/assets/               images, logos, icons and logo.svg, served as-is at
                             /assets/…
astro.config.mjs
```

Each page renders as:

```html
<body data-barba="wrapper">
  <div data-logo-loader-init>…</div>    <!-- the session's logo intro -->
  <div data-transition-wrap>…</div>     <!-- wipe panel, outside the container -->
  <nav class="mega-nav">…</nav>         <!-- persistent, outside the container -->
  <div data-column-grid>…</div>         <!-- the 12-Column Grid (Shift + G) -->
  <div data-barba="container" data-page-name="Home">
    <main>…</main>
    <footer>…</footer>                  <!-- inside, so it animates with the page -->
  </div>
</body>
```

The nav sits outside the container so it survives navigation — its GSAP
timelines are wired up once per document rather than per page. Anything inside the container is replaced on
every navigation, so page-level behaviour is bound per container: each
component is listed in `PAGE_COMPONENTS` in `src/scripts/site.js`, with the
selector that marks it, so a component's script runs only on a page that
has its markup, and anything it leaves running registers an undo with
`registerPageCleanup()` (`src/scripts/page.js`, which also holds the
visitor's motion preference and `pageShown()`, kept once the page is in
view). `data-page-name` comes from each page's `pageName` prop, and is
carried on `<html>` as `data-page` (with `data-theme`, light or dark) for
the stylesheets that lay a page out by it. Once a page is built it is
measured (`ScrollTrigger.refresh()`), and
its height is then watched (`watchPageHeight`): any change in it that is not
a resize (the Visual editor rewriting a heading, an accordion opening, a late
picture, a stylesheet hot-reloaded in development) has the page measured
again once it settles, so every scroll position, the service tabs' above
all, stays true.

### Class names

Classes style, `data-*` attributes are what scripts hook onto, and state is a
`data-*` value or an `is--*` modifier. Components follow BEM:
`.block__element`, `.block.is--variant`. Components that started life as
third-party snippets carry names for what they are here — `.action-button`,
`.contact-button`, `.accordion` — rather than the supplier's.

### Sizing — the Osmo scaling system

Every size scales with the viewport through Osmo's scaling system
(`src/styles/scaling.css`, as supplied, loaded first). It defines
`--size-font`: the design's 16px body size at each range's ideal width
(1440 desktop, 834 tablet, 550 a phone on its side, 390 upright), scaled in
proportion between that range's min and max and held above 1920px. The body
takes it as its font-size, as the system's documentation applies it, and the
root takes it too, so sizes are written in `rem` as the design's px / 16:
`1.5rem` is 24px at the ideal width and scales from there, without
compounding through nested font-sizes the way `em` does. The Osmo components
written in `em` (the nav, the loader, the buttons) scale from the body.

- The breakpoints are the system's: 991, 767 and 479px. Each range's values
  are its design at the ideal width; a narrower desktop needs no sizes of its
  own, because the system already shrinks the 1440 design for it.
- Fixed pixels are kept where they are the point: hairlines and borders, the
  corner radius (`--radius`, 2px, for cards, tiles, panels and pictures;
  `--radius-sm`, 1px, for buttons, inputs, chips and pills; the nav keeps
  its own, and edge-to-edge bands stay square), shadows, motion offsets, the scrollbar, 44px touch targets,
  and the hero's patterns (the dots, the Slash Field) and schematic lines,
  which are drawn on a fixed pitch.
- Below 992px each range starts at its own ideal, so sizes step at the
  breakpoints themselves (most visibly from 991 to 992px, and 767 to 768px).

### Stylesheets and scripts

Barba replaces only the container on a navigation, never `<head>`, so every
page has to load exactly the same CSS and JS. That is why all of it is declared
once, in `BaseLayout.astro`, and no page or component carries a `<style>` or
`<script>` of its own — a page-specific bundle would be missing after a Barba
navigation onto that page.

- The stylesheets are imported in their cascade order and bundled into a single
  hashed file.
- `site.js` is bundled as one module with everything it imports: the
  setup (`gsap-setup.js`, `scroll.js`, `page.js`), the nav (`nav.js`) and
  the components. GSAP (with its plugins, ScrambleTextPlugin among
  them), Barba and Lenis stay on the jsDelivr CDN and are loaded as classic
  scripts ahead of it, so they are globals by the time it runs.
  Lenis's small stylesheet is bundled with the site CSS (`src/styles/lenis.css`)
  rather than fetched as a separate render-blocking request; keep it in step
  with the Lenis version.
- One inline script sits in `<head>`: it classifies the document load before
  the first paint (see *Page transitions* below).
- Neither bundle is minified (see `astro.config.mjs`): the minifiers rewrite
  code for their target browsers, which would change how the site behaves in
  some of the browsers it supports today. Vercel compresses both in transit.
- `compressHTML` is off. Astro 7 otherwise strips the whitespace between
  elements, which closes up the spaces between inline elements.

## Performance

The homepage runs a dozen scroll-linked and time-based effects at once, so
every one of them keeps to a few rules, found the hard way (profiled on an
Intel integrated GPU at 1280 × 800, 1.5x, in October 2026):

- **Scroll-linked work moves transforms and opacity, and measures on
  refresh, never per frame.** Positions are read in `onRefresh` and kept;
  a scroll frame reads nothing off the layout (`getBoundingClientRect`,
  `offsetHeight`, `getComputedStyle`, `scrollY`) after anything has been
  written, which would have the browser lay the page out again mid-frame.
  ScrollTrigger callbacks take the scroll from `self.scroll()`.
- **One scroll pipeline.** Lenis first in the GSAP tick, ScrollTrigger once
  from Lenis, every tween after; `src/scripts/scroll.js`. Nothing else
  listens to the browser's `scroll` event.
- **A canvas draws only what changed, and only while it is on screen.**
  Its size is set once (setting a canvas's size throws its backing store
  away), its content is redrawn in the cells or stretch that changed, and
  a stroke that repeats is drawn once into an atlas and copied. The GPU
  cost of a canvas is the number of separate draws a frame far more than
  the pixels: the Slash Field cost two thirds of the GPU's time at rest
  when it stroked a path per tint per frame, and a few percent copying
  sprites.
- **Text and DOM churn is kept off the hot path.** A ScrambleText decode
  rewrites a label's children a dozen times a second; nothing on `:root`
  or `body` uses `:has()`, which the browser would evaluate again on every
  such change (the page's name and theme go on `<html>` as attributes
  instead), and a measurement of changing text is taken on a canvas
  (`measureText`), not off the layout.
- **Everything is scoped and undone.** A component runs only where its
  markup is (the registry in `site.js`), runs its loops only while on
  screen (IntersectionObserver or a ScrollTrigger's `onToggle`), and
  registers an undo for every tween, trigger, listener, timer and observer
  it starts (`registerPageCleanup`).

How it was measured, so a change can be: a headed Chrome driven over the
DevTools protocol, real wheel gestures (`Input.synthesizeScrollGesture`,
so Lenis handles them), `performance.mark` phases, a `requestAnimationFrame`
recorder for dropped frames, and a trace (`devtools.timeline`, the frame
pipeline, the CPU profiler) summed per phase: main-thread time by kind,
forced style and layout by caller, paints by element, and the GPU process's
busy time. Measure a repeat visit as well as a first one: a first visit
pays for shader compilation as each new kind of drawing scrolls into view,
and the shader disk cache (which the scripts can disable) hides it.

## Notes

- **Fonts** — Adobe Fonts (Typekit kit `lzu8hkz`): `elza` for display and body,
  `dm-mono` for labels.
- **Imagery** — photography lives in `public/assets/images/`. Every placeholder
  slot (`.ph`, `.band`, `.card__media`, `.cover`, `.avatar__img`) takes
  `allister-presenting.jpg` as a `background-image` from `src/styles/media.css`;
  giving a slot its own artwork means overriding `background-image` on that
  selector only.
- **Email signup** — every form that asks for an email (the newsletter in the
  Resources dropdown, the footer and the newsletter page, and the report
  downloads) is the one `.newsletter-form` in `styles.css`: a white field and
  a red submit block (`.newsletter-form__submit`) inside one ink border, on
  the controls' radius.
  The submit drops under the field, full width, where the row is too narrow.
  On a block of colour of its own — the footer's red, the Resources
  dropdown's field — it goes without the border (`.is--plain`): the ground
  frames it. The dropdown and the footer only set its height and width; on
  the footer's red the submit is ink. The homepage keeps one signup, the
  footer's: the research section no longer closes on one, so the closing
  call to action stands on its own (the Home page's Research fields
  "Signup tagline" and "Signup heading" are no longer shown).
- **Logos** — client logos live in `public/assets/logos/`, with `Black/`,
  `White/` and `SVGs/` variants of each practice mark. The ADDD brand mark is
  `public/assets/logo.svg`. Under the hero the homepage shows every client
  at once, each on a card of its own, in one even grid across the 12
  Grid Columns (styles.css "logo wall": five across, two below 992px).
- **Page transitions** — [Barba](https://barba.js.org/) 2.10.3. A panel wipes up
  over the page, shows the incoming page's name, then continues up to reveal it.
  The logo intro — the Logo Morph Loader (`MorphLoader.astro`,
  `logo-morph-loader.js`, `logo-morph.js`): A D D D drawn into the logo's
  forms and the red disc opening behind them, which on the homepage plays out
  in the hero's own Slash Field and flies into the nav's logo slot, its pulse
  handing over to the field's continuous wave as it reaches the field's edge —
  plays only on a genuine load of the homepage: opened from outside the site
  (a typed address, a bookmark, a link from elsewhere) or reloaded. Every other
  document load — another page, a back/forward that misses the bfcache, Barba
  falling back to a full load, any load that arrives from one of the site's own
  pages — opens on the wipe's reveal instead, and moving round the site,
  home by the logo included, is Barba's wipe. A link to the page already open
  (the logo on the homepage) is no navigation: the page glides back to its top
  (`isSamePage`, `page.js`; `nav.js`). The inline script in `<head>` makes that call before the
  first paint and writes it to `<html data-arrival>`; see *ARRIVAL* in
  `src/scripts/site.js`. On a click the page is held exactly as it is — the
  smooth scroll stops and the document height is kept — and the outgoing
  page's components are torn down only once the panel covers it (`afterLeave`),
  since killing pins and reverting splits or the slider's cards would
  otherwise show as a jump before the wipe; the next page is scrolled to the
  top while still covered. Building a page is one long piece of main-thread
  work (the homepage's, a few hundred milliseconds), so it happens only in a
  still covered window: the old page is taken out and torn down, and the new
  one built, once the panel's logo has settled (`wipeSettled`, timed to be
  still about as the panel arrives, 0.65s); then, still covered, the new
  page's webfonts are awaited, it is measured once, and it is shown under the
  panel for a frame so its first paint lands there too, not on the panel's
  first frame off it. The panel lifts as soon as the page has settled (the
  main thread idle, a quarter of a second at most: `pageSettled`), not after
  a fixed beat, so a light page shows about 0.8s after the click and the
  homepage, whose build runs on for a moment after it is laid out, about
  1.35s. Every face the stylesheets declare is
  fetched in an idle moment after the first page arrives (`warmFonts`), so a
  navigation never waits on the network for one. A Back or Forward pressed while a transition is still
  running is held and replayed when it finishes, rather than letting Barba turn
  it into a full page load. A Back or Forward step comes back to where the
  reader left that page (`leftAt`, `site.js`), as a reload does, so Back
  from a service page finds the homepage's deck where it was; a link to a
  place on another page (`page.html#section`), or a load of one, opens the
  page there; every other navigation opens a page at its top. The nav takes
  the new page's light or dark state at once while the page is covered, so
  it never shows the last page's as the cover lifts.
- **Glide to a place** — every scroll the site makes to a place is one glide
  (`glideTo`, `scroll.js`): a link to a section on the same page (one
  listener for every `#` link), the service tabs taking a route, the nav's
  back to the top. On Lenis, eased in and out (cubic), 0.9s plus a second
  for every 2000px, to 2.2s; the section stands 1.5rem under the nav's
  foot (`anchorY`); the reader's own wheel, key or touch takes over at
  once; with reduced motion the page is simply there. Both honour `prefers-reduced-motion`:
  the wipe becomes an immediate swap, and the intro shows the mark without
  the stack and fades out.
- **Card to page** — a click on a card of the homepage's service deck opens
  the card into its page in place of the wipe (`service-sheet.js`, Barba's
  `service-sheet` transition in `site.js`). Each service page's hero is the
  card at the screen's size (`ServiceHero.astro`), on the card's own parts
  and measures, so the card can become it part for part. The page is fetched
  into Barba's cache as the pointer comes onto a card (or a finger presses
  it), and its hero is laid out in a layer over everything at its own size,
  cut to the card's shape, with every shared part (number, name, square,
  list, the diagram's panel and drawing) moved back onto the card's place
  (FLIP), so its first frame is the card as it stands, however much of it
  the pile hides. The cards in front slide down off it, its foot on their
  edge, and the pile behind falls into shade; then it comes forward over
  them, its edges out to the screen's, every part gliding to its place on
  the page, and over the last of that the page's heading rises into it
  line by line and its lede and buttons after it (Web Animations, on the
  compositor, so they run on smoothly while the page is built under the
  sheet, which starts as soon as the sheet is still to the eye). The page's
  hero is built in the state those end in (`data-hero-shown`), the nav
  comes back over the sheet in the page's state, and the sheet hands over
  (the drawing picking up its loop where the card's was): about two seconds
  from click to scroll. Only transforms and opacity move: the card's shape
  is a window of boxes moved by transforms, not an animated clip-path,
  which repainted the sheet every frame and halved the frame rate on this
  machine's graphics. With reduced motion, or should the page not come, a
  card is an ordinary link (the swap or the wipe).
- **Hero pattern** — the hero's band carries one of two patterns
  (`src/components/Hero.astro`, `pattern` prop). The homepage has the Slash
  Field (`src/scripts/slash-field.js`), and no schematic lines: a stable grid
  of thin `/ | \` canvas strokes on 7 × 15px cells, running to the band's
  edges, mounted per page by the registry in `site.js`. It has no hover: it
  runs entirely by itself. Ten technology words (six on a phone,
  `data-slash-from`) are real text placed in the field at the pattern's own
  weight: each on its own spot in the band (`data-slash-spot`) and its own
  row, snapped to the grid, the pattern stopping around it (its cells and one
  either side left empty) so no stroke runs through the letters. The pattern
  runs on past the band's edges — the canvas is a couple of cells larger than
  the band on every side, and the band's overflow crops it — so it carries on
  behind the band rather than being made to fit it: shifted across so each
  side cuts its strokes part-way, and its rows sized a hair either way so the
  top and foot each leave about 85% of a row's strokes showing, never a stub
  of a tip. On its own the field runs as a calm chain reaction of systems
  coming online: a word near the middle bursts — its frame of strokes lighting
  up, a few short traces out along its row and columns, a touch of red at
  its heart — and decodes (GSAP's ScrambleTextPlugin, set up as in Osmo's
  Text Scramble — split, scrambled to its own text, reverted); a beat later
  its shockwave, a sparse grey ring, runs out through the strokes, furthest
  towards a neighbour — one of the nearest few, the nearer the likelier,
  rarely the way it went last time — and sets that word off as it arrives.
  Nothing is ever drawn between two words, so it reads as discrete events
  rather than a line travelling through the field; about one a second and a
  bit, with faint packets of traffic under it all. The word is held forward
  (`data-slash-active`) and settles back slowly; now and then the wave also
  sets off a nearer word it passes, which answers more briefly
  (`data-slash-active="minor"`). The site's red is only ever the heart of a
  burst and a decoding word's characters, and it always resolves into ink.
  The sequence runs only while the band is on screen and the page has
  arrived, and never under reduced motion. Arriving from another page, the
  words are taken out of the field while the wipe covers it and decoded back
  in from the foot of the band up as it lifts. The canvas redraws only the
  cells that changed each frame, every stroke copied from an atlas it was
  drawn into once (so a frame is one draw for the GPU, where a path per
  tint was most of what the page cost it), so a quiet field costs next to
  nothing. On
  the homepage the band is 102% of the dotted band's height
  (`--hero-band-scale`), and sits recessed between the bar and the copy: a
  close, light shade under the bar's edge and a fainter one along the
  bottom. The colours and cell size are `--slash-*` properties in
  `styles.css`; the chain's timing and choice of neighbour and the traffic
  are `SEQUENCE`, the decode's `DECODE`, the burst `BURST`, the shockwave
  `SHOCK`, and the strokes' smaller answers `RIPPLE` and `SCAN`, in the
  script. Tech Firms keeps the dotted canvas and its lines.
- **Approach stack** — the homepage's "Fix the system, not the symptoms"
  section (`src/components/ApproachStack.astro`, `approach-stack.css`,
  `approach-stack.js`), built on the supplied Scroll-driven Stack Timeline
  spec and adapted to three steps. On an ink band, the heading starts on Grid
  Column 2 and the lede on Grid Column 7, dropped one heading line. Below them
  the steps (data in the component) zig-zag either side of a centre rail from
  992px — Understand and Prioritise on Grid Columns 2–5, Diagnose on 8–11 —
  on a ladder of rungs (`--stack-step`, 26rem): each card starts a rung below
  the last, so the spacing between them is that one value. Only a short window
  of the rail's dotted line shows, held at the middle of the viewport with a
  cube in it; the dots are moved against the scroll, so they run past the
  cube, and a solid trail grows out of the cube with the scroll's speed
  (Lenis's velocity), behind it either way. Every card is open, its step drawn
  as a live schematic, each with its own outline: Understand, the practice
  in plan, four rooms and the route work actually takes the long way round
  them against the intended line (a drawing that reads across); Diagnose, a
  tall stack of five slabs scanned down to the one the trouble starts in
  (one that reads down); Prioritise, findings as massing, re-ranking by
  impact. The dashes that travel are measured in shares of their own
  path (`pathLength="1"`), so their tweens are unrounded (`autoRound:
  false`). The 12-Column Grid places the cards and the band's
  field of dots is set out from them (`placeField` in
  `approach-stack.js`): its pitch fits a whole number of steps across a
  card, near 1.125rem (18px at the ideal width, scaled with the page as
  the grid is), and its columns stand so that every card's sides run
  midway between two of them, to a fraction of a pixel at every width.
  The rail stands on one of those columns, so the mark on it sits on a
  line of dots: from 992px on the page's centre line, exactly, which the
  fit takes as a point a column must stand on (the cards stand
  symmetrically about it, so the fit can give both), the rail set onto
  that column to the fraction of a pixel (`snapRail`); its rows run from the rail's dots, which take the same
  pitch (`--dot-pitch` on the band, which the statement's dotted line and
  the snake take too). Inside each card the blocks are whole steps and
  the card's top is moved down onto a row by half a step at most
  (`placeCards`), so the lines between its blocks run midway too. Each card rises into place as it comes up the screen, and
  its schematic draws in the first time the card is in view, then loops while
  it is on screen. From 768 to 991px the cards are one column (6rem apart)
  with the rail down Grid Column 1; below 768px they are one column (3.5rem
  apart) with no rail. Under reduced motion the schematics are still and
  nothing moves on scroll. The previous approach cards — pinned, tipping
  slides closed over by the shutter — now live on the Tech Firms page,
  unchanged.
- **Service diagrams** — `ServiceDiagram.astro`, one drawing per service, in
  the approach schematics' language and a 400 × 256 viewBox, each composed
  square or a little taller than wide and each with its own outline: the
  Workflow Workshop's floor and loop under a small report; Before Revit's
  loose sheets, their register in red and the model over them; the
  Technology Blueprint held over the practice's four systems, its roadmap
  stepping through a milestone over each; Ongoing Advisory's floors in
  their rings. In the homepage's service tabs they move
  (`service-diagram.js`, `animate` on the component): the work runs its loop
  and sticks and the report takes it down; the sheets come into register
  and the model is built; the roadmap is drawn milestone by milestone; a
  session runs round the ring. Only while on screen, never under reduced
  motion.
  Behind each drawing in the service tabs, and behind each schematic in the approach cards'
  panels (not the approach band, whose field of dots is its own: `.dot-grid`), the
  drawing's ground: a dotted axonometric lattice on its two
  plan axes, a cell every 54 of its units, projected from its origin at
  its scale (`data-ground` on the `<svg>`; `mountIsoField` in
  `dot-field.js`), so it runs through the setting-out cross and the forms
  stand on it. The Workflow Workshop's floor is two cells by two, the
  Blueprint's sheet the same, and the Advisory's rings touch the lattice
  at their sessions. It is faint, and runs out to every edge of its
  field.
- **Band steps** — the ink band after the hero comes up over it with its
  top edge in pieces, one per two Grid Columns (six from 992px, three on
  a tablet, two on a phone), their sides on the gutters' middles
  (`initBandSteps`, `parallax.js`; styles.css "band steps"). Nothing shows
  with the page at the top; from the first of the scroll each piece comes
  up a little faster than the band on a curve of its own (`BAND_STEPS`:
  small leads, up to 14% of the screen, stepping down gently from the
  left on near-even curves), so every column is still moving as the band
  reaches the top and the silhouette develops across the whole way, in a
  staircase none of the first five ever breaks (the last rises again a
  little). One timeline, a short lag behind the scroll, a transform
  each; not under reduced motion.
- **What actually costs you time** — the heading alone, centred and
  larger than the hero's, its two lines set close and still (no line
  reveal), over three level
  cards of one size joined as one strip across the whole 12-Column
  Grid, equal thirds, so each covers Grid Columns 1–4, 5–8 or 9–12 and
  the joins fall inside the gutters (one under another, apart, below
  992px). Each card is a drawing over a dark band of words: a landscape
  field of dots, seven steps across and five down (`--pc-step`, a
  seventh of the card's width, measured as a container), on its own
  ground (white, ink, a mid grey; `--pc-field`, `--pc-dots`), with the
  card's picture (from the Studio) over its middle five by three, so
  it is landscape too; the field's and the picture's edges run midway
  between lines of dots. Under it, on the band (`--c-dark-bg`), the
  title, large (1.875rem; 1.5rem on a phone), and the line in white, the
  band unbroken where two cards meet. From 992px the scroll
  sets the three at three depths as it passes (`initProblemParallax`,
  `parallax.js`; one scrubbed tween, a transform only): coming up the
  screen they stand as a stair, the white card leading and each after
  it a step (`PROBLEM_STAIR`, 4.5rem) lower, and the stair turns over
  in one continuous movement (a sine curve from +i steps to -i) into its
  reverse, so going up and out the grey card leads and the white comes
  last. The row is level only for the instant it passes through the
  middle of its way; there is no hold. Scrolling back runs it back. Not
  under reduced motion, nor below 992px. On a tablet each
  card lies on its side, the field on Grid Columns 1–3 and the words
  from Grid Column 4.
- **Coin stack** — set into that heading (`CoinStack.astro`,
  `coin-stack.css`, `coin-stack.js`): five coins at the site's isometric
  angle, stood apart one under another with nothing drawn round them —
  the logo's red disc on top, plain, then four greys, each carrying one
  of the logo's four forms on its face. It shares the heading's cell,
  centred on the words and sized from the heading's own size
  (`--head-size`, the drawing 2.856 of it tall), and set between its two
  lines in depth: in front of the first line and behind the second (the
  heading is split into its lines in place, without moving, by
  `coin-stack.js`, each `.problem-head__line` taking a z-index about the
  coins; unsplit, in the Studio's preview, the heading stands in front
  whole). The red coin, the width of a couple of
  letters, starts at the foot of the first line. Nothing holds or steers the scroll. As the
  drawing passes up the screen, the column closes up as one piece: the
  four gaps between the coins each close on their own eased curve, top
  first, the curves overlapping (`OVERLAP`, 0.6), so the coins move
  together, the red one fastest, in one continuous fold rather than a
  coin at a time, and each coin's form appears on the red face as its
  gap closes, so the logo is still built a form at a time; the stack
  comes to rest where the lowest coin stood, just under the heading. It
  runs from
  the drawing's top 70% of the way down the screen to its middle a
  little above the screen's. Under reduced motion it is the finished
  stack, still.
- **Service deck** — the homepage's four routes, straight after the cost
  section, as cards that stack as the page scrolls (`ServiceDeck.astro`,
  `service-deck.css`; CSS alone, position: sticky). Four bands the page's
  full width, each a shade of the charcoal stepping lighter; every card
  sticks under the nav a head lower than the one before, so as the next
  comes up over it only its head stays in view and the names pile up
  like tabs, the last card whole under them. Inside a card, on the
  12-Column Grid, two left edges only: Grid Column 1 for the number (the
  label face, centred on the name's line) and Grid Column 2 for all
  else. The head row is the name's line (`--t-h3`, the section headings'
  setting a step down) with the square way on at the end of Grid Column
  7, so the four squares stand in one column whatever the names'
  lengths. Under it, high in the card where it is read before the next
  card covers it, two cells on one level, each a label on the site's
  dotted rule with its words under it: the tagline and the line on Grid
  Columns 2–4, "What it covers" and its list on Grid Columns 5–7, every
  line of the list on the rule. The diagram's panel takes Grid Columns
  8–12 from the name's line to the card's foot, on the drawing's lattice
  with a + near each corner. On a tablet the cells stand one over the
  other on Grid Columns 2–3 beside the panel; on a phone the cards are
  in the flow, one column. The words are the routes' from the Studio;
  the lists are the routes' own (`src/components/services.ts`), which
  each service page's hero shows too. Each card opens into its page (see
  *Card to page*).
- **Service hero** — each service page (Workflow Workshop, Before Revit,
  Technology Blueprint, Ongoing Advisory) opens on its deck card at the
  screen's size (`ServiceHero.astro`, `service-deck.css` "Service hero"):
  the charcoal ground, the head row (the number on Grid Column 1, the name,
  from the page's `hero.tagline`, on Grid Column 2 at the card's size, the
  square at the end of Grid Column 7, its triangle turned down to lead on
  into the page), the page's heading under it, the lede and buttons on Grid
  Columns 2–4 beside the card's list on 5–7, and the diagram's panel on Grid
  Columns 8–12 from the name's line to the foot, the drawing at the card's
  size. Its head row stands where the head of the card at the top of the
  deck's pile stands. The heading's lines rise and the lede and buttons
  come in once the page is in view (`initHeroRise`, `reveals.js`).
- **AEC Tech Partners blue** — that page's one accent is `--c-blue`
  (#1E6EF3): its container (and the nav while it is the page marked on
  `<html>`) sets `--c-red` to it, so every red accent there, the diagrams'
  highlights included, is the blue, and the wipe into the page is blue. It
  goes with the page; every other page keeps the red. The footer keeps its
  red ground (`--c-red-brand`).
- **Homepage FAQ** — near the foot of the homepage, in place of the old
  fit comparison (`index.astro` "8. FAQ"): a large heading on Grid Columns
  1–5 and the questions on Grid Columns 7–12 (`Accordion.astro`, variant
  "boxed": each question in a plain white box, a little apart; six "FAQ
  Test" placeholders after the two real questions, for now). "Who is
  this for?" and "Who is this not for?", answered by the fit lists
  (`fit.forItems`, `fit.notItems`, a red square or an open one before each
  point); the heading and questions are fields of their own in the Studio.
  Each answer opens to its own height on the site's curve (grid rows 0fr to
  1fr, after Osmo's CSS accordion), the questions under it moving with it;
  with reduced motion it is simply there.
- **Service tabs** — the AEC Tech Partners page's statements as one panel
  on a black band the page's full width, straight after its hero
  (`ServiceTabs.astro`, `service-tabs.js`, styles.css "service tabs"): one
  panel the scroll moves through, under the section's tagline as its
  heading. From 992px it takes Grid Columns 1–12, half and half: a square of
  the page's blue (`--c-blue`, #1E6EF3, after the supplied reference) on Grid Columns 1–6,
  a solid white + near each corner, one statement at a time in its middle,
  large and centred, with nothing else (`services.statements` in the
  Studio: three), and at its foot the statements' numbers (01–03), each a
  small block, the one in front filling white from the left as the scroll
  goes through its statement; on Grid Columns 7–12, on the black, one
  dotted lattice and a drawing for each statement (ServiceDiagram, by
  position), carried up through the panel by the scroll. Below 992px the
  two stand one over the other.
- **Testimonials** — the homepage's quotes (`TestimonialSlider.astro`,
  `testimonial-slider.js`), after the Outsource Consultants slider: every
  quote mounted and stacked in one place, with no title over it, the
  section uncovered from under the service deck as the deck scrolls away
  (`initDepthTransitions`, `parallax.js`, "depth transitions",
  `data-depth="under"`, as the footer is from under the page: the quotes
  settle out of a higher place inside the section's clipping wrap and its
  shadow clears; nothing comes over the deck), split
  into masked lines that rise in one after another and run back out last
  line first (its timings: 0.3s a line, 0.05s apart), and with them, in
  the same run, the count and the attribution in masked lines of their
  own and the logo rising in a mask as a line does. On the 12-Column
  Grid: the dotted rule upright on the left edge of Grid Column 3, the
  section's full height, from the band above to the section after, the
  logo and the two square controls on it (white blocks, as the research
  slider's arrows are, inverting to the ink with a white arrow on hover
  and focus), the quote on Grid Columns 5–11; below 992px the rule lies across
  the grid between the quote and a row of the logo and the controls. The
  quotes' room is the height of the quote showing, so the section, its
  rule and its controls stretch or gather to each quote as it comes in
  (an elastic ease with one small overshoot, `SIZE`) under the controls,
  which stand a fixed step under the logo and never move with it (below
  992px, where they sit under the quote, the room stays the longest
  quote's), and the page's
  scroll positions are measured again once it settles. The
  words and logos come from the Home page's Testimonials section; the
  logos, white marks, are set in ink. Under reduced motion, and in the
  Studio's preview, a change is a fade.
- **Smooth scroll** — [Lenis](https://github.com/darkroomengineering/lenis) 1.2.3
  (`src/scripts/scroll.js`), driven by the GSAP ticker rather than `autoRaf`,
  so the transition can stop and restart it around a navigation, and first
  in the tick, so it moves the page before any tween writes. ScrollTrigger
  follows it once a frame, from Lenis's own scroll event: the browser's
  scroll event is held back from ScrollTrigger while Lenis is scrolling (it
  would update everything a second time, a frame early), and still reaches
  it for any other scroll.
- **Navigation** — mega nav with directional hover dropdowns, mobile slide-over
  panels and an animated burger, built on GSAP 3.15 via CDN. From 992px the bar
  is a row of full-height blocks: the logo block (the ADDD triangles on the
  Contact button's fill, running to the end of Grid Column 1), the Tech Firms
  feature block "For Tech Firms" (on a near-white grey, running to the end of
  Grid Column 5, its label at the block's end), the links and Sign in set
  together on one lighter ground as one compact run across Grid Columns 7–10 —
  starting where the hero's headline does, each label centred in its own share
  of the run, the gaps between them even — then the Contact button, from the
  end of Grid Column 11 to the bar's edge: one solid block of the bar's
  call-to-action colour, its hover a slight deepening of it
  (`contact-button.css`). The logo
  is the link home; there is no Home item. Every item takes one type treatment,
  the `--nav-text-*` tokens (the drawer redeclares only the size), and every
  colour is a `--nav-*` token in `src/styles/nav.css`, redeclared for the dark
  state. In the drawer, "For Tech Firms" leads the list. The dropdowns are the
  bar continued downwards: each panel its groups side by side over the
  dimmed page, with no ground or frame of their own, each group an equal
  column of the screen's width and the dropdown's full height, flush,
  one continuous ground with no line between the columns. A panel opens column by
  column (`initMegaNav`): each drops in from under the bar, clipped by
  its edge, 0.07s after the one before, left to right, as the dimmed page
  comes up; closing, they lift back under it, the last first; from one
  panel to the other, the open one's columns lift out as the other's drop
  in. In the drawer a panel's items slide in one after the next, 0.06s
  apart. The four Services cards (`ServiceCard.astro`) are minimal and
  typographic: each a block a quarter of the screen and sixteen steps
  (`--sc-step`) tall, in the nav's state like the bar (a near-white with
  the name in ink, or a charcoal with it in white, each a step off the
  bar's group: `--nav-card-bg`, `--nav-fg`), the
  service's name large in its middle both ways, on one line, in the
  dropdown's own short forms (Work[shop/flow], Before Revit, Tech -
  Blueprint, ADDD Advisory; the names everywhere else are unchanged), a
  line on the service small under it, set by hand as two lines, the
  first the longer (Before Revit's proportions, the model for the
  four), and behind it a faint pattern of its own, running on across the
  whole card, behind the words too (no clearing or fade). The Workshop's ending turns between "shop" and "flow" with the
  homepage hero's word cycle (`word-cycle.js`, mounted once by
  `initMegaNav`), in a box as wide as its widest ending, so the name
  never moves. The patterns: the hero's upright
  strokes, worked out at build from a seeded sequence — two streams along
  the diagonal (Workflow Workshop), rings (Ongoing Advisory) — or the
  site's dotted lines, drawn on a canvas by the drawings' ground field
  (`mountIsoField`, `dot-field.js`, in `--nav-card-dots`) — a square grid
  of the approach band's 2px dots on a tighter pitch (Before Revit), a
  fine isometric lattice of cube tops at 30° either way (Technology
  Blueprint). Flush, they carry their ground a
  pixel under the next card, so a seam at a fractional device pixel never
  shows the dimmed page. In the drawer they stand one under another, nine
  steps tall, still flush. The three Resources blocks, a third of the screen each, are
  built in the cards' earlier language round their own content: a header of the column's mark in a
  compact square and its name (Explore, Reports, Newsletter), its lead
  link, then a feature on the field's grey — the software database, the
  latest report with its cover, the signup — every row's words hanging
  from the name's line, the cards' palette and steps shared (`--sc-*`),
  and, like the cards, in the nav's state (light greys with ink, or the
  cards' near-black with white, mixed by `--nav-dark`).
  Stacked in the drawer, the blocks sit a step apart, over the
  page's off-white (dark, the bar's near-black), so the white
  stands off it as it does on the page. The nav stays in place
  over the main content whichever way the page scrolls, and leaves only
  where a section holds it out (`initNavReveal` in `site.js`): on the
  homepage it goes up with the hero, at the hero's own parallax pace, stays
  out while the statement plays out (`data-nav-hold`) and comes back as the
  approach takes over; on every page it stays until the last quarter
  screen of scroll before the footer's entrance, goes up with the scroll
  over that stretch (so it is wholly gone as the footer starts to come up,
  however fast), and stays out over the footer, and back in on the way up
  (never out at the top of a page). From 992px it floats once the page's
  hero has gone up under it, or, on a service page, once the hero's head
  row reaches it (`data-nav-float-from`). It
  stays while a menu is open or keyboard focus is inside it. It goes up by its height
  rounded up to whole device pixels: the bar's height is fluid, so moved by
  exactly that it would leave its last, partly covered row of pixels on the
  top edge of the screen.
- **Buttons** — every CTA is `ActionButton.astro`: one compact slab, as long
  as its label, in the label face in capitals at 13px with the site's arrow
  at its far end, in two variants, primary (ink) and secondary (light grey).
  Without an `href` it renders a `<button>`, for form submits. A pair sits a
  gutter apart (`.actions--pair`) — the hero and the closing CTA lead with
  Free Tech Stacks (primary) and Work With Us (secondary). On a dark ground
  (a dark page, section, hero or price card) the pair inverts, as the nav's Contact does on a dark page: the primary
  white, the secondary a quiet lift off the ground. The closing CTA is on
  the off-white everywhere, a dark page included, so its pair never
  inverts. Only the primary takes the red sweep on hover. In the homepage's
  service tabs, on the red panel, the primary is white with ink capitals,
  its arrow block a light grey, the label sweeping to that grey on hover,
  nothing red of its own.
  `.btn` remains only for the chevron text links (`.btn--link`).
- **Links** — every link set in text shares one hover: the nav's items (For
  Tech Firms, the two toggles, AEC Jobs, About, Sign in), the footer's link
  lists, the pages' chevron text links (`.btn--link`) and the contact
  lists (`.nav-link`, `src/styles/nav-link.css`, with `NavLinkLabel.astro`
  for the inside, which takes a `data-page-field` for the Studio). Pointed
  at or focused, the label decodes through itself left to right and a
  dotted line of the site's square dots (2px, 6px apart) draws in under it
  with the band, and leaves dot by dot as the pointer goes (`initTextScramble`,
  `text-scramble.js`: bound once for the nav, and with each page through
  the registry). The footer's old sliding box is gone. Each link keeps its
  own hit area, and the box round the label gives its padding back in
  negative margin, so no label moves; focus adds a ring. With reduced motion
  the line simply shows. Buttons, cards, the logo and the social marks keep
  their own hovers.
- **Footer** — `Footer.astro`, on the site's red, revealed with a parallax.
  One row across the 12-Column Grid: the four link groups on Grid Columns
  1–2, 3–4, 5–6 and 7–8, each under a quiet name, the social marks (the
  platforms' own marks, square, named for screen readers) closing Contact,
  and the newsletter signup on Grid Columns 9–12. No copyright or legal
  line for now. Across the foot, the logo drawn by the hero's Slash Field
  in a white held well back into the red, on finer cells than the hero's,
  each form filling its three Grid Columns where the panel crops it (the
  upward triangle opened to about 85° to do so). Below 992px the groups
  run two across, then the signup; on a phone, one across.
- **12-Column Grid** — the layout reference. Shift + G toggles the overlay
  (`src/components/ColumnGrid.astro`), at once, with no animation; it
  always starts hidden, is faint (a 9% fill a column, half-strength edge
  lines) and never affects the layout. The columns are **Grid Column 1** to **Grid Column 12**
  from the left, numbered on the overlay and marked `data-grid-column="1"` …
  `"12"`, so a position can be named directly ("start at Grid Column 3",
  "span Grid Columns 4–8"). The geometry is in the `--grid-columns`,
  `--grid-edge`, `--grid-margin` and `--grid-gutter` tokens in
  `src/styles/column-grid.css`, which also gives the formula for where any Grid
  Column starts and ends. The margin, where Grid Column 1 starts and Grid
  Column 12 ends, is twice the edge: it is the line text and normal content
  align to. The edge, drawn on the overlay as one line either side, is where the
  columns used to start and end, kept as the reference for full-bleed parts that
  run out past the text on purpose. Below 992px the overlay shows 6 columns, and
  below 768px 4.
- **Pages on the grid** — a page whose `<main>` has `class="page--grid"` (the
  homepage, for now) takes its horizontal layout from the 12-Column Grid instead
  of the 1280px container (`src/styles/page-grid.css`). The page gutter becomes
  the grid margin, full-width parts hold Grid Columns 1–12 (the routes cards
  run out to the edge instead, as a full-bleed row), and contained
  sections lay their container out as the grid itself and sit in Grid Columns
  2–11, with rows placed by Grid Column number (`grid-column: 7 / 12` is Grid
  Columns 7–11). Intro headings start on Grid Column 7, except the approach
  stack's, which opens on the left on Grid Column 2.
