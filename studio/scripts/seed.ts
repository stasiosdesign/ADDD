/* Makes the pages' documents in the staging dataset, once, from the words and
   pictures the pages were built with (src/sanity/defaults/, at the repository
   root): every page's document (its _id is its type), the clients of the
   logo strip (the Home page's Logos list references them in order, and each
   testimonial its practice), with every picture uploaded from public/.
   Sanity keeps one copy of identical files, so running this again uploads
   nothing new. So publishing them changes nothing on the site until they are
   edited.

   It never overwrites: a document that already exists is left exactly as it
   is ("kept"). To redo one, delete it in the Studio first. Never touches the
   production dataset.

   From studio/:
     npm run seed                      (sanity exec scripts/seed.ts --with-user-token)
     npm run seed -- --only homePage */
import fs from 'node:fs'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'
import {CLIENTS, PAGE_DEFAULTS, type ImageDefault} from '../../src/sanity/defaults'

const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({dataset: 'staging'})

// The script runs from studio/ (sanity exec needs its sanity.cli.ts), so the
// site's public/ is one level up
const publicDir = path.resolve(process.cwd(), '..', 'public')

const onlyAt = process.argv.indexOf('--only')
const only = onlyAt >= 0 ? process.argv[onlyAt + 1] : undefined
if (onlyAt >= 0 && !only) {
  console.error('--only needs a page type, such as --only homePage')
  process.exit(1)
}
if (only && !(only in PAGE_DEFAULTS) && only !== 'clients') {
  console.error(`No defaults for "${only}". Pages: ${Object.keys(PAGE_DEFAULTS).join(', ')}, or clients`)
  process.exit(1)
}

const isImage = (value: unknown): value is ImageDefault => typeof value === 'object' && value !== null && 'path' in value

const uploaded = new Map<string, string>()
async function uploadImage(image: ImageDefault) {
  // A slot the page draws without a picture of its own (a placeholder) stays empty
  if (!image.path) return undefined
  let id = uploaded.get(image.path)
  if (!id) {
    const file = path.join(publicDir, image.path)
    const asset = await client.assets.upload('image', fs.createReadStream(file), {filename: path.basename(file)})
    id = asset._id
    uploaded.set(image.path, id)
  }
  return {_type: 'image', asset: {_type: 'reference', _ref: id}, ...(image.alt ? {alt: image.alt} : {})}
}

/** A default's value as the document holds it: pictures uploaded, clientId a reference, the rest as it is */
async function convert(value: unknown): Promise<unknown> {
  if (isImage(value)) return uploadImage(value)
  if (Array.isArray(value)) return Promise.all(value.map(convert))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'clientId' && typeof child === 'string') out.client = {_type: 'reference', _ref: child}
      else out[key] = await convert(child)
    }
    return out
  }
  return value
}

async function exists(id: string): Promise<boolean> {
  return !!(await client.fetch<string | null>('*[_id == $id][0]._id', {id}))
}

async function seedClients() {
  for (const {_id, name, logo} of CLIENTS) {
    if (await exists(_id)) {
      console.log(`kept ${_id}`)
      continue
    }
    const sortOrder = CLIENTS.findIndex((c) => c._id === _id) + 1
    await client.createIfNotExists({_id, _type: 'client', name, sortOrder, logo: await uploadImage(logo)})
    console.log(`created ${_id} (${name})`)
  }
}

async function seedPage(type: string, defaults: Record<string, unknown>) {
  if (await exists(type)) {
    console.log(`kept ${type}`)
    return
  }
  const content = (await convert(defaults)) as Record<string, unknown>
  if (type === 'homePage') {
    const logos = (content.logos as Record<string, unknown>) ?? {}
    content.logos = {...logos, clients: CLIENTS.map((c, i) => ({_type: 'reference', _key: `client-${i + 1}`, _ref: c._id}))}
  }
  await client.createIfNotExists({_id: type, _type: type, ...content})
  console.log(`created ${type}, ${uploaded.size} pictures uploaded so far`)
}

async function main() {
  if (!only || only === 'clients' || only === 'homePage') await seedClients()
  for (const [type, defaults] of Object.entries(PAGE_DEFAULTS)) {
    if (only && type !== only) continue
    await seedPage(type, defaults as Record<string, unknown>)
  }
}

main().catch((error: Error) => {
  console.error('ERR', error.message)
  process.exit(1)
})
