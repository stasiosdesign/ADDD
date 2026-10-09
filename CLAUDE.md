# ADDD Website: instructions for Claude

The ADDD marketing site. Astro 7, fully static, no UI framework: Astro components, plain CSS, plain JavaScript on GSAP, Barba and Lenis.
Client folder: `addd/`. Universal rules: the parent `CLAUDE.md`. The README has the page table, structure and class-name conventions: read it before editing.

## Commands

`npm run dev` (port 4321), `npm run build` (into `dist/`), `npm run preview`. Needs Node 22.12+.

## Layout

- `src/pages/*.astro`: one file per page (`build.format: "file"`, so `about.astro` becomes `/about.html`; do not change this, links and Barba depend on it).
- `src/layouts/BaseLayout.astro`: the shared shell. `src/components/`: shell parts and shared pieces. `src/styles/`: stylesheets. `src/scripts/`: all interactions (`site.js` owns the Barba lifecycle).
- `public/assets/`: files served as-is at `/assets/...` (`icons/`, `images/`, `logos/{Black,White,SVGs}/`). Keep these existing names; new files follow the naming rule in the parent `CLAUDE.md`.
- `assets/{inbox,originals,references}/`: the user's drop zone (see `assets/README.md`). Not part of the site, git-ignored.
- `webflow-billing-toggle/`: tracked, standalone Webflow embed snippets with their own README. Not part of the Astro build. Do not touch unless asked.

## Deployment

Vercel builds from GitHub; every push to `main` deploys. No `vercel.json` and no adapter. Do not push without being asked.

## Future Sanity CMS (not installed)

Do not add Sanity unless asked. When it is added, follow the workspace pattern: Studio in `studio/` at this project's root with its own `package.json`, schemas in `studio/schemaTypes/`,
queries in one file under `src/sanity/`, root scripts using `npm --prefix studio`. The site is static today; a Sanity build would also need a deployment/rebuild-hook decision first.

## Working-tree note

The repository may contain uncommitted work from the user's design sessions. Never revert or stage files you did not change.
