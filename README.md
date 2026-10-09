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
| Production | https://addd-final-wireframes.vercel.app              | `main`                      |
| Staging    | https://addd-git-staging-stasiosdesign.vercel.app     | `staging`                   |
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
  `/build.json`). **Publish to Staging** never touches production; **Publish
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
| `/tech-firms.html` | `src/pages/tech-firms.astro` — Tech Firms (the homepage hero, then the original approach cards from the homepage — Understand, Diagnose, Prioritise — kept there while the page is written) |
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
  scripts/                   site.js (Barba lifecycle and every interaction),
                             logo-morph-loader.js, logo-morph.js,
                             logo-stack-loader.js, wavy-marquee.js,
                             column-grid.js, slash-field.js, approach-stack.js
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
timelines and the Contact button's width measurement are wired up once per
document rather than per page. Anything inside the container is replaced on
every navigation, so page-level behaviour is bound per container: each
component is listed in `PAGE_COMPONENTS` in `src/scripts/site.js`, with the
selector that marks it, and anything it leaves running registers an undo with
`registerPageCleanup()`. `data-page-name` comes from each page's `pageName`
prop.

### Class names

Classes style, `data-*` attributes are what scripts hook onto, and state is a
`data-*` value or an `is--*` modifier. Components follow BEM:
`.block__element`, `.block.is--variant`. Components that started life as
third-party snippets carry names for what they are here — `.action-button`,
`.contact-button`, `.accordion` — rather than the supplier's. Osmo's Wavy
Marquee keeps its own `.wavy-marquee` names and `data-wavy-marquee-*` hooks.

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
  corner radius, shadows, motion offsets, the scrollbar, 44px touch targets,
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
- `site.js` is bundled as a module, importing `logo-morph-loader.js` (and,
  through it and the nav's logo, `logo-morph.js`), `logo-stack-loader.js`,
  `wavy-marquee.js`, `column-grid.js`, `slash-field.js` and
  `approach-stack.js`. GSAP (with its plugins, ScrambleTextPlugin among
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
  a red submit block (`.newsletter-form__submit`) inside one ink border, square.
  The submit drops under the field, full width, where the row is too narrow.
  The dropdown and the footer only set its height and width.
- **Logos** — client logos live in `public/assets/logos/`, with `Black/`,
  `White/` and `SVGs/` variants of each practice mark. The ADDD brand mark is
  `public/assets/logo.svg`. The homepage strip under the hero runs on Osmo's
  Wavy Marquee (`src/scripts/wavy-marquee.js`): a seamless loop that scroll
  speed and dragging push along (the drag through `ScrollTrigger.observe`,
  ScrollTrigger's built-in Observer), without its wave: the tiles run level,
  one straight row.
- **Page transitions** — [Barba](https://barba.js.org/) 2.10.3. A panel wipes up
  over the page, shows the incoming page's name, then continues up to reveal it.
  The logo intro — the Logo Morph Loader (`MorphLoader.astro`,
  `logo-morph-loader.js`, `logo-morph.js`): A D D D drawn into the logo's
  forms and the red disc opening behind them, which on the homepage plays out
  in the hero's own Slash Field and flies into the nav's logo slot; Osmo's
  Logo Stack Loader is kept behind `?loader=stack` — plays once
  per browsing session: on the first page the visitor lands on, whichever it
  is, and again only on a genuine reload. Any other document load in the
  session — Barba falling back to a full load, a back/forward that misses the
  bfcache, a typed URL — opens on the wipe's reveal instead, and so does any
  load that arrives from one of the site's own pages, even in a tab with no
  record of the intro. The inline script in `<head>` makes that call before the
  first paint and writes it to `<html data-arrival>`; see *ARRIVAL* in
  `src/scripts/site.js`. On a click the page is held exactly as it is — the
  smooth scroll stops and the document height is kept — and the outgoing
  page's components are torn down only once the panel covers it (`afterLeave`),
  since killing pins and reverting splits or the slider's cards would
  otherwise show as a jump before the wipe; the next page is scrolled to the
  top while still covered. A Back or Forward pressed while a transition is still
  running is held and replayed when it finishes, rather than letting Barba turn
  it into a full page load. Both honour `prefers-reduced-motion`: the wipe
  becomes an immediate swap, and the intro shows the mark without the stack
  and fades out.
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
  in from the foot of the band up as it lifts. The canvas only redraws the
  rows that changed each frame, so a quiet field costs next to nothing. On
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
  as a live schematic — the route work actually takes against the intended
  one, symptoms traced back into a shared cause, findings re-ranking by impact
  with their owners. Each card rises into place as it comes up the screen, and
  its schematic draws in the first time the card is in view, then loops while
  it is on screen. From 768 to 991px the cards are one column (6rem apart)
  with the rail down Grid Column 1; below 768px they are one column (3.5rem
  apart) with no rail. Under reduced motion the schematics are still and
  nothing moves on scroll. The previous approach cards — pinned, tipping
  slides closed over by the shutter — now live on the Tech Firms page,
  unchanged.
- **Smooth scroll** — [Lenis](https://github.com/darkroomengineering/lenis) 1.2.3,
  driven by the GSAP ticker rather than `autoRaf`, so the transition can stop and
  restart it around a navigation.
- **Navigation** — mega nav with directional hover dropdowns, mobile slide-over
  panels and an animated burger, built on GSAP 3.15 via CDN. From 992px the bar
  is a row of full-height blocks: the logo block (the ADDD triangles on the
  Contact button's fill, running to the end of Grid Column 1), the Tech Firms
  feature block "For Tech Firms" (on a near-white grey, running to the end of
  Grid Column 5, its label at the block's end), the links and Sign in set
  together on one lighter ground as one compact run across Grid Columns 7–10 —
  starting where the hero's headline does, each label centred in its own share
  of the run, the gaps between them even — then the Contact button, from the
  end of Grid Column 11 to the bar's edge. The logo
  is the link home; there is no Home item. Every item takes one type treatment,
  the `--nav-text-*` tokens (the drawer redeclares only the size), and every
  colour is a `--nav-*` token in `src/styles/nav.css`, redeclared for the dark
  state. In the drawer, "For Tech Firms" leads the list. The dropdowns are the
  bar continued downwards and, like it, built from blocks told apart by tone
  rather than ruled off by lines: the four Services cards are two-tone blocks
  (the feature block's grey for the band, the group's lighter grey for the
  wording) on Grid Columns 1–3, 4–6, 7–9 and 10–12, a gutter apart; the three
  Resources columns are thirds of the grid stepping from the nav's ground to
  the group's grey to the feature block's, with the latest report as a block
  of the ground on its grey. Stacked in the drawer, the cards sit a gutter
  apart and the columns become bands of their tone. Scrolling down, the nav
  slides up out of view, and comes back the moment the page moves up; it
  stays while a menu is open or focus is inside it, and every page opens with
  it in place (`initNavReveal` in `site.js`). It goes up by its height
  rounded up to whole device pixels: the bar's height is fluid, so moved by
  exactly that it would leave its last, partly covered row of pixels on the
  top edge of the screen.
- **Buttons** — every CTA is `ActionButton.astro`: one compact slab, as long
  as its label, in the label face in capitals at 13px with the site's arrow
  at its far end, in two variants, primary (ink) and secondary (light grey).
  Without an `href` it renders a `<button>`, for form submits. A pair sits a
  gutter apart (`.actions--pair`) — the hero and the closing CTA lead with
  Free Tech Stacks (primary) and Work With Us (secondary). On a dark ground
  (the CTA band, a dark page, section, hero or price card) the pair inverts,
  as the nav's Contact does on a dark page: the primary white, the secondary
  a quiet lift off the ground. Only the primary takes the red sweep on hover.
  `.btn` remains only for the chevron text links (`.btn--link`).
- **Links** — the nav's items (For Tech Firms, the two toggles, AEC Jobs,
  About, Sign in) and the footer's link lists are one sliding-box link
  (`.nav-link`, `src/styles/nav-link.css`, with `NavLinkLabel.astro` for the
  inside): on hover a block in the link's ink slides into a small box round
  the label and the label takes the ground's colour, in through the edge the
  pointer came in by and out through the edge it leaves by (`initNavLinks` in
  `site.js`; CSS alone slides it from below). `--fg`/`--bg` set the block
  and the label on it for each context, so it inverts on the light bar, the
  dark bar and the footer alike. Each link keeps its own hit area — the bar's
  items stay full height — and the box gives its padding back in negative
  margin, so no label moves. Only hover and keyboard focus invert a link —
  the link to the page being viewed rests like the others — and focus adds a
  ring.
  Buttons, cards, the logo and the social marks keep their own hovers.
- **12-Column Grid** — the layout reference. Shift + G toggles the overlay
  (`src/components/ColumnGrid.astro`); it always starts hidden and never
  affects the layout. The columns are **Grid Column 1** to **Grid Column 12**
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
