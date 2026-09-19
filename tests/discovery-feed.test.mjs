import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const feed = JSON.parse(await readFile(new URL('../marketplace.json', import.meta.url), 'utf8'))

test('publishes the four reviewed discovery entries alongside newer catalog additions', () => {
  const reviewed = new Set(['slot-showcase', 'agent-trace-showcase', 'chatroom', 'codex-ascension'])
  assert.deepEqual(feed.plugins.map(plugin => plugin.id).filter(id => reviewed.has(id)), [
    'slot-showcase',
    'agent-trace-showcase',
    'chatroom',
    'codex-ascension',
  ])
})

test('keeps source-only products without fabricated install metadata', () => {
  const productIds = new Set(['agent-trace-showcase', 'codex-ascension'])
  const products = feed.plugins.filter(plugin => productIds.has(plugin.id))
  assert.equal(products.length, 2)
  for (const plugin of products) {
    assert.equal(Object.hasOwn(plugin, 'artifact'), false, plugin.id)
    assert.equal(Object.hasOwn(plugin, 'manifest'), false, plugin.id)
  }
})

test('Chatroom uses a versioned owner release URL and an exact digest', () => {
  const chatroom = feed.plugins.find(plugin => plugin.id === 'chatroom')
  assert.ok(chatroom?.artifact)
  assert.ok(chatroom.artifact.downloadUrl.startsWith(`${chatroom.source}/releases/download/v${chatroom.version}/`))
  assert.match(chatroom.artifact.integrity, /^sha256:[a-f0-9]{64}$/)
  assert.equal(chatroom.artifact.publisherIdentity, `npm:${chatroom.artifact.packageNamespace}`)
  assert.ok(chatroom.artifact.packageName.startsWith(`${chatroom.artifact.packageNamespace}/`))
})

test('labels the Host slot showcase as a non-installable development example', () => {
  const showcase = feed.plugins.find(plugin => plugin.id === 'slot-showcase')
  assert.ok(showcase)
  assert.match(showcase.name, /Development Example/)
  assert.match(showcase.description, /no installable artifact/i)
  assert.equal(Object.hasOwn(showcase, 'artifact'), false)
})

// Catalog images must remain pinned to reviewed owner assets, never a moving branch.
test('reviewed plugin icons reference immutable PNGs in their owning repositories', () => {
  const ids = new Set([
    'slot-showcase',
    'agent-trace-showcase',
    'chatroom',
    'codex-ascension',
    'channel',
    'cli-proxy-api',
    'plugin-composer-animal',
    'game-room',
    'wallet',
  ])
  const reviewed = feed.plugins.filter(plugin => ids.has(plugin.id))
  assert.equal(reviewed.length, ids.size)
  for (const plugin of reviewed) {
    const source = new URL(plugin.source)
    const icon = new URL(plugin.icon)
    assert.equal(icon.origin, 'https://raw.githubusercontent.com', plugin.id)
    assert.ok(icon.pathname.startsWith(`${source.pathname}/`), plugin.id)
    const asset = icon.pathname.slice(source.pathname.length + 1)
    assert.match(asset, /^[a-f0-9]{40}\/.+\.png$/, plugin.id)
  }
})
