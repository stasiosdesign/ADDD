/* One-off (2026-11-25): the legal pages into the staging dataset.

   - Makes the Privacy Policy and Terms and Conditions documents
     (privacyPage, termsPage) from their defaults
     (src/sanity/defaults/legal.ts), only where they don't exist yet.
   - Adds their two links to the footer's Company column (the Home page
     document's footer.companyLinks), on the published document and on a
     draft if there is one, only where a link to that page isn't there yet.

   Written because scripts/seed.ts can't run at the moment: it loads the
   whole schema, and the beehiiv automation input (a .tsx component) stops
   `sanity exec` from loading it. Never overwrites, never touches
   production (Publish Site does).

   From studio/:
     npx sanity exec scripts/seed-legal.ts --with-user-token            (writes)
     npx sanity exec scripts/seed-legal.ts --with-user-token -- --dry   (says what it would write) */
import {getCliClient} from 'sanity/cli'
import {privacyPage, termsPage} from '../../src/sanity/defaults/legal'

const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({dataset: 'staging'})
const dry = process.argv.includes('--dry')

const LINKS = [
  {_key: 'footer-company-privacy', _type: 'link', label: 'Privacy Policy', href: '/privacy-policy'},
  {_key: 'footer-company-terms', _type: 'link', label: 'Terms & Conditions', href: '/terms'},
]

async function main() {
  console.log(`${dry ? 'Dry run: nothing is written. ' : ''}Dataset: staging`)

  for (const [id, content] of [['privacyPage', privacyPage], ['termsPage', termsPage]] as const) {
    const exists = await client.fetch<boolean>('defined(*[_id == $id][0]._id)', {id})
    if (exists) {
      console.log(`kept ${id} (exists)`)
      continue
    }
    if (!dry) await client.createIfNotExists({_id: id, _type: id, ...content})
    console.log(`${dry ? 'would create' : 'created'} ${id}`)
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
