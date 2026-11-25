/* The legal pages into the staging dataset (2026-11-25).

   - Writes the Privacy Policy and Terms and Conditions documents
     (privacyPage, termsPage) from their defaults
     (src/sanity/defaults/legal.ts). With --replace it overwrites their
     opening, search summary and text with the defaults, on the published
     document and on a draft if there is one, and removes the first
     version's single text box (content.body); without it, it only makes a
     document that doesn't exist yet.
   - Adds their two links to the footer's Company column (the Home page
     document's footer.companyLinks), on the published document and on a
     draft if there is one, only where a link to that page isn't there yet.

   Written because scripts/seed.ts can't run at the moment: it loads the
   whole schema, and the beehiiv automation input (a .tsx component) stops
   `sanity exec` from loading it. Never touches production (Publish Site
   does).

   From studio/:
     npx sanity exec scripts/seed-legal.ts --with-user-token -- --dry             (says what it would write)
     npx sanity exec scripts/seed-legal.ts --with-user-token                      (makes what's missing)
     npx sanity exec scripts/seed-legal.ts --with-user-token -- --replace         (and overwrites the legal pages) */
import {getCliClient} from 'sanity/cli'
import {privacyPage, termsPage} from '../../src/sanity/defaults/legal'

const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({dataset: 'staging'})
const dry = process.argv.includes('--dry')
const replace = process.argv.includes('--replace')

const LINKS = [
  {_key: 'footer-company-privacy', _type: 'link', label: 'Privacy Policy', href: '/privacy-policy'},
  {_key: 'footer-company-terms', _type: 'link', label: 'Terms & Conditions', href: '/terms'},
]

type Doc = {_id: string; _updatedAt?: string; content?: {body?: unknown[]; sections?: unknown[]}}

async function main() {
  console.log(`${dry ? 'Dry run: nothing is written. ' : ''}Dataset: staging${replace ? ', replacing the legal pages' : ''}`)

  for (const [id, content] of [['privacyPage', privacyPage], ['termsPage', termsPage]] as const) {
    const [published, draft] = await Promise.all(
      [id, `drafts.${id}`].map((at) => client.fetch<Doc | null>('*[_id == $at][0]{_id, _updatedAt, content}', {at})),
    )
    if (draft) console.log(`${id}: has an unpublished draft (changed ${draft._updatedAt})`)
    if (!published) {
      if (!dry) await client.createIfNotExists({_id: id, _type: id, ...content})
      console.log(`${dry ? 'would create' : 'created'} ${id}`)
    } else if (!replace) {
      console.log(`kept ${id} (exists; --replace overwrites it)`)
      continue
    }
    for (const doc of [published, draft]) {
      if (!doc) continue
      const sets = {seo: content.seo, hero: content.hero, content: content.content}
      if (!dry) await client.patch(doc._id).set(sets).commit({autoGenerateArrayKeys: false})
      console.log(`${dry ? 'would replace' : 'replaced'} ${doc._id}: opening, search summary and ${content.content.sections.length} sections${doc.content?.body ? ' (the old text box goes)' : ''}`)
    }
  }

  for (const id of ['homePage', 'drafts.homePage']) {
    const links = await client.fetch<{href?: string}[] | null>('*[_id == $id][0].footer.companyLinks', {id})
    if (links === null) {
      console.log(`no ${id} footer links (no such document): skipped`)
      continue
    }
    const missing = LINKS.filter((link) => !links.some((l) => l.href === link.href))
    if (!missing.length) {
      console.log(`kept ${id} footer (links there)`)
      continue
    }
    if (!dry) await client.patch(id).insert('after', 'footer.companyLinks[-1]', missing).commit({autoGenerateArrayKeys: false})
    console.log(`${dry ? 'would add' : 'added'} to ${id} footer: ${missing.map((l) => l.label).join(', ')}`)
  }
}

main().catch((error: Error) => {
  console.error('ERR', error.message)
  process.exit(1)
})
