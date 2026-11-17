/* TEMPORARY (2026-11-16): the Backend and integrations page at /backend,
   for a client call. Delete this folder and src/pages/backend.astro to
   remove it; nothing else uses them.

   The platforms the diagrams show, each once: its name, its mark and the
   one line on what it does. A diagram's node names a platform by its key
   and may say something else in its place (sections.ts).

   Marks: Simple Icons' official brand marks in their brand colour
   (cdn.simpleicons.org); beehiiv is not in Simple Icons, so its own
   favicon through Google's favicon service; ADDD's own mark from the
   site. Should one fail to load, the node shows its initial instead. */

export interface Platform {
  name: string;
  logo?: string;
  /** what it does here, one short line */
  role: string;
}

const simple = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

export const PLATFORMS = {
  website: { name: "ADDD website", logo: "/assets/logo.svg", role: "Report pages and sign-up forms" },
  beehiiv: {
    name: "beehiiv",
    logo: "https://www.google.com/s2/favicons?domain=beehiiv.com&sz=128",
    role: "Subscribers and emails",
  },
  drive: { name: "Google Drive", logo: simple("googledrive"), role: "Hosts downloads" },
  sanity: { name: "Sanity", logo: simple("sanity"), role: "Report content" },
  backend: { name: "Website backend", logo: simple("vercel/000000"), role: "Sends sign-ups on" },
} satisfies Record<string, Platform>;

export type PlatformKey = keyof typeof PLATFORMS;
