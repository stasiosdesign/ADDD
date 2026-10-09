import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {contentKey as packageKey, logId as packageLogId} from '@stasiosdesign/sanity-cms/protocol'
import {contentKey as routeKey, logId as routeLogId} from '../../src/sanity/publish/content-key.ts'

/* The site's publishing route (src/sanity/publish/) and the CMS package
   must describe content the same way: the route writes a contentKey into
   each publish note, and the Studio compares it with its own to say whether
   the live site has the version in the editor. If these drift apart, every
   item reads as "Changes in draft". Run with `npm test`; CI runs it on every
   update of the package. */

const documents = [
  {_id: 'homePage', _type: 'homePage', _rev: 'a', _createdAt: '2026-01-01', _updatedAt: '2026-02-01', hero: {heading: 'Hi', tagline: 'Studio'}},
  {_id: 'drafts.r1', _type: 'report', _rev: 'b', title: 'Report', meta: [{_key: 'x', value: 'Lead'}], _system: {base: {id: 'r1'}}},
  {_id: 'r2', _type: 'report', z: 1, a: {d: [1, {c: 2, b: 3}], a: null}, slug: {current: 'report', _type: 'slug'}},
  {_id: 'empty', _type: 'client'},
]

describe('the route and the CMS package agree', () => {
  for (const doc of documents) {
    it(`on ${doc._id}`, () => assert.equal(routeKey(doc), packageKey(doc as never)))
  }

  it('whatever order the keys were written in', () => {
    const a = {_id: 'x', _type: 't', b: {y: 1, x: 2}, a: 1}
    const b = {a: 1, b: {x: 2, y: 1}, _type: 't', _id: 'x'}
    assert.equal(routeKey(a), routeKey(b))
    assert.equal(packageKey(a as never), routeKey(b))
  })

  it('on the publish notes’ IDs', () => assert.equal(routeLogId('homePage'), packageLogId('homePage')))
})
