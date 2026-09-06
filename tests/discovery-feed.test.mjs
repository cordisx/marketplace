import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const feed = JSON.parse(await readFile(new URL('../marketplace.json', import.meta.url), 'utf8'))

test('publishes the four reviewed discovery entries', () => {
  assert.deepEqual(feed.plugins.map(plugin => plugin.id), [
    'slot-showcase',
    'agent-trace-showcase',
    'chatroom',
    'codex-ascension',
  ])
})

test('keeps product listings discovery-only without fabricated install metadata', () => {
  const productIds = new Set(['agent-trace-showcase', 'chatroom', 'codex-ascension'])
  const products = feed.plugins.filter(plugin => productIds.has(plugin.id))
  assert.equal(products.length, 3)
  for (const plugin of products) {
    assert.equal(Object.hasOwn(plugin, 'artifact'), false, plugin.id)
    assert.equal(Object.hasOwn(plugin, 'manifest'), false, plugin.id)
    assert.equal(Object.hasOwn(plugin, 'icon'), false, plugin.id)
  }
})

test('labels the Host slot showcase as a non-installable development example', () => {
  const showcase = feed.plugins.find(plugin => plugin.id === 'slot-showcase')
  assert.ok(showcase)
  assert.match(showcase.name, /Development Example/)
  assert.match(showcase.description, /no installable artifact/i)
  assert.equal(Object.hasOwn(showcase, 'artifact'), false)
})
