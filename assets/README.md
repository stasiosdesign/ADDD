# Assets: where new files go

Drop anything new into **`inbox/`** and ask Claude Code to add it ("add the files in assets/inbox to the site").

| Folder | Put here | Published? |
|---|---|---|
| `inbox/` | New photos, renders, logos, SVGs, icons, video: anything you want used on the site | No |
| `originals/` | Full-resolution masters. Claude moves files here after it has made the web versions | No |
| `references/` | Screenshots, mood boards, design references, anything not meant for the site | No |

The contents of these three folders stay on this computer: Git ignores them, so they are never uploaded to GitHub or Vercel. Only this README and the `.gitkeep` placeholders are tracked.

## What Claude does with an inbox file

1. Looks at the file and decides where it belongs on the site.
2. Makes the web version under a descriptive name (see below). Images that Astro optimises go in `src/assets/`; files served as-is (logos, SVGs, favicons, video, anything with a fixed URL) go in `public/`. Images managed by a CMS go into Sanity instead of the repository.
3. Moves the untouched original into `originals/`. Originals are never overwritten or deleted.
4. Updates the references and tells you exactly what it did.

Do not put files straight into `public/` or `src/`: those folders are the website itself.

## Naming new files

Lowercase, hyphens, no spaces, purpose first: `homepage-hero.webp`, `project-exterior-01.jpg`, `brand-logo-primary.svg`, `brand-logo-light.svg`, `summit-speaker-portrait.jpg`. Existing files keep their current names, because renaming them can break pages, SEO and CMS content.