# ADDD Website: instructions for Claude

The ADDD marketing site (Astro 7, repository root) and its Sanity Studio
(`studio/`). No UI framework: Astro components, plain CSS, plain JavaScript on
GSAP, Barba and Lenis. Universal rules (naming, assets, git, safety): the
workspace `CLAUDE.md`. The README has the page table, structure, class-name
conventions and the CMS: read it before editing.

## Branches and deployments

- `main` is **production**: every push deploys the public site
  (https://addd-io.vercel.app until a domain is connected).
  Keep it production-ready at all times.
- `staging` is the permanent **staging** branch: every push updates the
  stable staging URL (https://addd-staging.vercel.app). It
  is not a feature branch; never delete it.

## How to work

1. Work locally first (`npm run dev` on 4321, `npm run studio` on 3333). Do
   not commit or push after each change.
2. When the user asks for an online preview, commit and push to `staging`.
3. Never push unfinished work to `main`.
4. Merge `staging` into `main` (and push) only when the user explicitly
   approves a production deployment. Run `npm run build` and `npm run check`
   first; afterwards confirm the Vercel status on the commit.
5. After a production merge, bring `staging` level with `main` so the
   branches don't drift apart.
6. No force-pushes, history rewrites or new long-lived branches.

## Commands

`npm run dev` (4321; staging's behaviour: renders on request from the
staging dataset), `npm run build` (the static production build), `npm run
preview`, `npm run check` (types for the site, then the Studio's checks),
`npm run studio` (the Studio on 3333), `npm run studio:deploy`. Needs Node
22.12+. On this computer Node isn't on PATH (workspace `CLAUDE.md`).

## Layout

- `src/pages/*.astro`: one per page. `build.format: "file"` makes `about.astro`
  become `/about.html`; do not change it (links and Barba depend on it).
  `src/pages/reports/[slug].astro` and `src/pages/newsletter/[slug].astro`
  are one page per report and newsletter issue in Sanity.
- `src/layouts/BaseLayout.astro` the shared shell; `src/components/`,
  `src/styles/`, `src/scripts/` (`site.js` owns the Barba lifecycle).
- Links in the shared shell (the nav, the footer, the closing call to
  action, the sliders) are root-relative (`/about.html`, `/assets/...`), so
  they work one folder deep on the report and issue pages too.
- `src/sanity/`: the site's side of the CMS (below).
- `webflow-billing-toggle/`: tracked, standalone Webflow embed snippets with
  their own docs. Not part of the Astro build. Do not touch unless asked.

## Assets

- **Library: `public/assets/`**, served at `/assets/...`: `images/`
  (photography), `logos/` (client logos in `Black/`, `White/` PNG and
  `SVGs/`, plus the ADDD `logo.svg` at the top level, which is the favicon),
  `icons/` (UI/social SVGs). Keep these existing names and folder cases
  (pages and CSS reference them). Pictures an editor sets are uploaded in
  the Studio, not added to `public/`.
- **New files: `source-assets/`** (git-ignored). New files follow the
  workspace naming rule.
- After moving or renaming assets, build and check every referenced file
  still exists in `dist/`.

## Rules that protect production

- Never commit secrets. Real values live in Vercel's environment variables
  and in git-ignored `.env*.local` files (`.env.example` lists them). Nothing
  secret gets a `PUBLIC_` or `SANITY_STUDIO_` prefix.
- Keep the two datasets apart: production is built from the `production`
  dataset only. The read token, the draft-mode routes, the publishing route
  and the visual-editing code exist only off production (`__DEPLOYMENT__`,
  see `astro.config.mjs`).
- Staging must never be indexable: keep its noindex header and meta.
- The user keeps uncommitted design work here. Never revert or stage files
  you did not change.

## The CMS

The Studio is the shared CMS package `@stasiosdesign/sanity-cms` (private,
GitHub Packages; source in the `sanity-cms` repository, checked out on the
development machine at `3 - Claude/1 - HQ/shared-sanity-cms`, with its own
CLAUDE.md) set up for this website. This repository lives in its client
folder, `3 - Claude/ADDD/addd-website`; shared changes are never made from
here. Tomrow Studios (`3 - Claude/Tomrowstudios/tomrowstudios-website`) is
the reference implementation this one follows.

| Kind of change | Where |
| --- | --- |
| How every Studio looks or works: navigation, layout, the Content tool, the Visual editor's controls, editors, publishing UI and logic, the theme | the shared package, developed in the stasiosdesign.com Studio, released, then updated here. Never in this repository. |
| This site's content model: pages, sections, fields, references | `studio/schemaTypes/` (`pages/` one file per page, `objects/blocks.ts` the repeatable blocks, `documents/` the collections and clients, `shared/fields.ts` the helpers) |
| This site's Studio setup: pages, collections, routes, brand, Visual editor locations, publishing wording | `studio/project.ts` |
| A bespoke editor only this site needs | `studio/components/`, used from the schema |
| The site's side of publishing and preview: the route, draft mode, the preview script, the readers | `src/sanity/` (the contract: the package's README, "What a website must provide") |

- Sanity project `xqa8b0u9`, two datasets: `staging` (the Studio edits it;
  the staging site and the Visual editor read it) and `production` (the live
  site alone reads it; only `/api/publish` writes it, with
  `SANITY_API_WRITE_TOKEN`, after checking the caller's Studio session, and
  then calls `VERCEL_DEPLOY_HOOK_URL` to rebuild `main`).
- Every page document is a singleton whose `_id` is its type
  (`homePage`, `workshopPage`…). Every page in `src/pages` reads its document
  with `reader()` (`src/sanity/content.ts`) and falls back, field by field,
  to the page's own words in `src/sanity/defaults/<page>.ts`. Keep those
  defaults exactly as the page's text. `npm run seed` in `studio/` writes
  them to `staging` (never over a document that exists).
- Binding a new element: give it `data-page-field="section.field"` inside
  the Barba container (which names the page's document); a list of blocks
  gets `data-page-list` / `data-page-item` / `data-page-item-field`; a
  background slot `data-page-bg`. Add the field to the schema and its
  current text to the defaults. Then rebuild and confirm the page is
  unchanged.
- `studio/package.json` pins an exact release; updates arrive as Dependabot
  pull requests against `staging` (`.github/dependabot.yml`), checked by
  `.github/workflows/studio.yml`. Merging is the user's approval; then the
  usual staging → main promotion and `npm run studio:deploy`. Never merge
  or deploy an update without approval. Read the package's CHANGELOG.md for
  what a version asks of the site.
- A change that needs both sides: the shared part in the shared package;
  run this Studio on it with `npm run dev:linked` in `studio/`; commit this
  site's part once a release with the shared part is installed here.
- Use only the package's entry points (`@stasiosdesign/sanity-cms`,
  `/protocol`, `/cli`); ESLint refuses deep imports. Never copy package code
  into this repository.
- The hosted Studio (https://addd.sanity.studio) is deployed by hand
  (`npm run studio:deploy`), from whichever branch is checked out, and
  serves both environments. Deploy it after schema or Studio changes, and
  keep schema changes backward-compatible with the code on `main` (they
  share one dataset).
- Sanity is pinned (`autoUpdates: false` in `studio/sanity.cli.ts`):
  upgrades start in the package and the stasiosdesign.com Studio.
- Dataset writes from here may be blocked by auto mode; `npm run seed` is
  then for the user to run. Never print tokens, the deploy hook URL or the
  Vercel bypass secret.
