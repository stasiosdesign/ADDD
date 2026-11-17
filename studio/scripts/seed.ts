/* Writes the pages' own words and pictures (src/sanity/defaults/, at the
   repository root) into the staging dataset: every page's document (its _id
   is its type), and the clients of the logo strip (the Home page's Logos
   list references them in order, and each testimonial its practice), with
   every picture uploaded from public/. Sanity keeps one copy of identical
   files, so running this again uploads nothing new.

   It never overwrites. A document that doesn't exist is made whole; one
   that exists is filled in: every field it leaves empty (missing, blank or
   an empty list) gets the page's own value, and every field it has is left
   exactly as it is. So it is also how a new field reaches the Studio: add
   it to the schema and the defaults, then run this (2026-11-16, when every
   field of the site was connected and the emptied documents refilled).

   Each list item gets the _type its schema gives it (read from the Studio's
   own schema), so the Studio never shows an item of unknown type.

   Never touches the production dataset: publishing from the Studio does.

   From studio/:
     npm run seed                       (sanity exec scripts/seed.ts --with-user-token)
     npm run seed -- --only homePage
     npm run seed -- --dry              (says what it would write, writes nothing)
     npm run seed -- --dry --print --only homePage   (and shows it) */
import fs from 'node:fs'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'
import {CLIENTS, PAGE_DEFAULTS, type ImageDefault} from '../../src/sanity/defaults'
import {schemaTypes} from '../schemaTypes'

const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({dataset: 'staging'})

// The script runs from studio/ (sanity exec needs its sanity.cli.ts), so the
// site's public/ is one level up
const publicDir = path.resolve(process.cwd(), '..', 'public')

const dry = process.argv.includes('--dry')
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

type Json = Record<string, unknown>
const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)
const isImage = (value: unknown): value is ImageDefault => isObject(value) && 'path' in value

const uploaded = new Map<string, string>()
async function uploadImage(image: ImageDefault) {
  // A slot the page draws without a picture of its own (a placeholder) stays empty
  if (!image.path) return undefined
  let id = uploaded.get(image.path)
  if (!id) {
    const file = path.join(publicDir, image.path)
    if (dry) id = `(upload ${image.path})`
    else {
      const asset = await client.assets.upload('image', fs.createReadStream(file), {filename: path.basename(file)})
      id = asset._id
    }
    uploaded.set(image.path, id)
  }
  return {_type: 'image', asset: {_type: 'reference', _ref: id}, ...(image.alt ? {alt: image.alt} : {})}
}

/* ---- the schema: what _type each list item and named object has ------- */

type FieldDef = {name?: string; type?: string; fields?: FieldDef[]; of?: FieldDef[]}
const registry = new Map<string, FieldDef>((schemaTypes as unknown as FieldDef[]).map((t) => [t.name ?? '', t]))
const BUILT_IN = new Set(['string', 'text', 'number', 'boolean', 'url', 'date', 'datetime', 'slug', 'image', 'file', 'reference', 'array', 'object', 'block', 'email'])

/** A field definition's own fields, following a named type to its definition */
const fieldsOf = (def: FieldDef | undefined): FieldDef[] | undefined => {
  if (!def) return undefined
  if (def.fields) return def.fields
  const named = def.type && !BUILT_IN.has(def.type) ? registry.get(def.type) : undefined
  return named?.fields
}

/** The _type of an array's items, and their definition (single-type arrays of objects only) */
function memberOf(def: FieldDef | undefined): {type?: string; def?: FieldDef} {
  const member = def?.of?.[0]
  if (!member || (def?.of?.length ?? 0) !== 1) return {}
  if (member.type === 'object') return {type: member.name, def: member}
  if (member.type && !BUILT_IN.has(member.type)) return {type: member.type, def: registry.get(member.type)}
  return {}
}

/** A default's value as the document holds it: pictures uploaded, clientId a reference, list items and named objects typed */
async function convert(value: unknown, def?: FieldDef): Promise<unknown> {
  if (isImage(value)) {
    // alternative text only where the schema's picture has a field for it
    const image = await uploadImage(value)
    if (image && 'alt' in image && !fieldsOf(def)?.some((f) => f.name === 'alt')) delete (image as Json).alt
    return image
  }
  if (Array.isArray(value)) {
    const member = memberOf(def)
    return Promise.all(
      value.map(async (item) => {
        const out = await convert(item, member.def)
        return isObject(out) && member.type && !out._type ? {_type: member.type, ...out} : out
      }),
    )
  }
  if (isObject(value)) {
    const fields = fieldsOf(def)
    const out: Json = {}
    if (def?.type && !BUILT_IN.has(def.type) && !value._type) out._type = def.type
    for (const [key, child] of Object.entries(value)) {
      if (key === 'clientId' && typeof child === 'string') out.client = {_type: 'reference', _ref: child}
      else {
        const converted = await convert(child, fields?.find((f) => f.name === key))
        if (converted !== undefined) out[key] = converted
      }
    }
    return out
  }
  return value
}

/* ---- filling in ------------------------------------------------------- */

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0) ||
  (isObject(value) && Object.keys(value).filter((k) => !k.startsWith('_')).length === 0)

/** The paths an existing document leaves empty, each with the page's own value: never one it has */
function missing(existing: unknown, wanted: Json, at: string, out: Json) {
  const have = isObject(existing) ? existing : {}
  for (const [key, value] of Object.entries(wanted)) {
    if (key.startsWith('_') || isEmpty(value)) continue
    const own = have[key]
    if (isEmpty(own)) out[`${at}${key}`] = value
    // a section or object both have: fill it field by field (a picture or a list it has stays whole)
    else if (isObject(own) && isObject(value) && !('asset' in value)) missing(own, value, `${at}${key}.`, out)
  }
}

async function existing(id: string): Promise<Json | null> {
  return client.fetch<Json | null>('*[_id == $id][0]', {id})
}

async function write(id: string, type: string, content: Json) {
  const doc = await existing(id)
  if (!doc) {
    if (!dry) await client.createIfNotExists({...content, _id: id, _type: type})
    console.log(`${dry ? 'would create' : 'created'} ${id}`)
    return
  }
  const sets: Json = {}
  missing(doc, content, '', sets)
  const paths = Object.keys(sets)
  if (!paths.length) {
    console.log(`kept ${id} (nothing empty)`)
    return
  }
  if (dry && process.argv.includes('--print')) console.log(JSON.stringify(sets, null, 1))
  if (!dry) await client.patch(id).set(sets).commit({autoGenerateArrayKeys: false})
  console.log(`${dry ? 'would fill' : 'filled'} ${id}: ${paths.length} field${paths.length === 1 ? '' : 's'} (${paths.slice(0, 6).join(', ')}${paths.length > 6 ? '…' : ''})`)
}

async function seedClients() {
  for (const [i, {_id, name, logo}] of CLIENTS.entries()) {
    await write(_id, 'client', {name, sortOrder: i + 1, ...(await convert({logo}, registry.get('client')) as Json)})
  }
}

async function seedPage(type: string, defaults: Json) {
  const content = (await convert(defaults, registry.get(type))) as Json
  if (type === 'homePage') {
    const logos = (content.logos as Json) ?? {}
    content.logos = {...logos, clients: CLIENTS.map((c, i) => ({_type: 'reference', _key: `client-${i + 1}`, _ref: c._id}))}
  }
  await write(type, type, content)
}

async function main() {
  console.log(`${dry ? 'Dry run: nothing is written. ' : ''}Dataset: staging`)
  if (!only || only === 'clients' || only === 'homePage') await seedClients()
  for (const [type, defaults] of Object.entries(PAGE_DEFAULTS)) {
    if (only && type !== only) continue
    await seedPage(type, defaults as Json)
  }
  console.log(`${uploaded.size} pictures ${dry ? 'to upload' : 'uploaded or reused'}`)
}

main().catch((error: Error) => {
  console.error('ERR', error.message)
  process.exit(1)
})
