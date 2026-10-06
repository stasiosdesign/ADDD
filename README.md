# ADDD — website

The ADDD website, built with [Astro](https://astro.build) as a fully static site.
No UI framework: Astro components for the markup, plain CSS, and plain JavaScript
on GSAP, Barba and Lenis.

## Commands

Requires Node 22.12 or later.

```bash
npm install
npm run dev       # dev server on http://localhost:4321
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Deployment

Vercel builds the site from GitHub: every push to `main` deploys. Vercel detects
Astro on its own (build command `astro build`, output directory `dist`), so the
project needs no `vercel.json` and no adapter — the output is plain static files.

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
| `/tech-firms.html` | `src/pages/tech-firms.astro` — Tech Firms (holding page) |
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
  components/                Loader, Transition, Nav, AnimatedGrid, Footer
  pages/*.astro              one per page — its title, its Barba page name and
                             its <main>
  styles/*.css               the site stylesheets, imported by the layout
  scripts/                   site.js (Barba lifecycle and every interaction),
                             marquee.js, animated-grid.js
public/assets/               images, logos, icons and logo.svg, served as-is at
                             /assets/…
astro.config.mjs
```

Each page renders as:

```html
<body data-barba="wrapper">
  <div data-load-wrap>…</div>           <!-- first-load logo reveal -->
  <div data-transition-wrap>…</div>     <!-- wipe panel, outside the container -->
  <nav class="mega-nav">…</nav>         <!-- persistent, outside the container -->
  <div data-animated-grid>…</div>       <!-- Shift + G layout overlay -->
  <div data-barba="container" data-page-name="Home">
    <main>…</main>
    <footer>…</footer>                  <!-- inside, so it animates with the page -->
  </div>
</body>
```

The nav sits outside the container so it survives navigation — its GSAP
timelines and the Contact button's width measurement are wired up once per
session rather than per page. Anything inside the container is replaced on
every navigation, so page-level behaviour must be re-bound in
`initBeforeEnterFunctions()` in `src/scripts/site.js`. `data-page-name` comes
from each page's `pageName` prop.

### Stylesheets and scripts

Barba replaces only the container on a navigation, never `<head>`, so every
page has to load exactly the same CSS and JS. That is why all of it is declared
once, in `BaseLayout.astro`, and no page or component carries a `<style>` or
`<script>` of its own — a page-specific bundle would be missing after a Barba
navigation onto that page.

- The stylesheets are imported in their cascade order and bundled into a single
  hashed file.
- `site.js` is bundled as a module, importing `marquee.js` and
  `animated-grid.js`. GSAP, Barba and Lenis stay on the jsDelivr CDN and are
  loaded as classic scripts ahead of it, so they are globals by the time it runs.
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
- **Logos** — client logos live in `public/assets/logos/`, with `Black/`,
  `White/` and `SVGs/` variants of each practice mark. The ADDD brand mark is
  `public/assets/logo.svg`.
- **Page transitions** — [Barba](https://barba.js.org/) 2.10.3. A panel wipes up
  over the page, shows the incoming page's name, then continues up to reveal it.
  The first document load plays the logo loader instead. Both honour
  `prefers-reduced-motion` with an immediate swap.
- **Smooth scroll** — [Lenis](https://github.com/darkroomengineering/lenis) 1.2.3,
  driven by the GSAP ticker rather than `autoRaf`, so the transition can stop and
  restart it around a navigation.
- **Navigation** — mega nav with directional hover dropdowns, mobile slide-over
  panels and an animated burger, built on GSAP 3.15 via CDN.
- **Layout grid** — Shift + G toggles a 12-column overlay (6 on tablet, 4 on
  mobile). It always starts hidden.
