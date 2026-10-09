# ADDD Website: instructions for Claude

The ADDD marketing site. Astro 7, fully static, no UI framework: Astro components, plain CSS, plain JavaScript on GSAP, Barba and Lenis. Universal rules (naming, assets, git, safety): the workspace `CLAUDE.md`.
The README has the page table, structure and class-name conventions: read it before editing.

## Commands

`npm run dev` (4321), `npm run build`, `npm run preview`. Needs Node 22.12+.

## Layout

- `src/pages/*.astro`: one per page. `build.format: "file"` makes `about.astro` become `/about.html`; do not change it (links and Barba depend on it).
- `src/layouts/BaseLayout.astro` the shared shell; `src/components/`, `src/styles/`, `src/scripts/` (`site.js` owns the Barba lifecycle).
- `webflow-billing-toggle/`: tracked, standalone Webflow embed snippets (versions `v2`, `v3`, `combined`, `restored`) with their own docs. Not part of the Astro build. Do not touch unless asked.

## Assets

- **Library: `public/assets/`**, served at `/assets/...`: `images/` (photography), `logos/` (client logos in `Black/`, `White/` PNG and `SVGs/`, plus the ADDD `logo.svg` at the top level, which is the favicon), `icons/` (UI/social SVGs). Keep these existing names and folder cases (pages and CSS reference them).
- **New files: `source-assets/`** (git-ignored). New files follow the workspace naming rule.
- A few library files (some icons) are not referenced by any page yet. Keep them; do not delete assets without the user's confirmation that they are unused.
- After moving or renaming assets, build and check every referenced file still exists in `dist/`.

## Deployment

Vercel builds from GitHub; every push to `main` deploys. No `vercel.json`, no adapter. Do not push unless asked.

## Working-tree note

The user keeps uncommitted design work here. Never revert or stage files you did not change.

## Future Sanity (not installed)

Planned. When added: `studio/` at the project root with its own `package.json`, same pattern as `tomrow-studios/tomrow-website`. The site is static, so a Sanity build also needs a rebuild-hook decision first. Do not add it unless asked.
