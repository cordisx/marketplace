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

test('replaces Pet discovery with the verified scoped release without changing plugin identity', () => {
  const entries = feed.plugins.filter(plugin => plugin.id === 'plugin-composer-animal')
  assert.equal(entries.length, 1)
  const [plugin] = entries
  assert.equal(plugin.source, 'https://github.com/cordisx/plugin-pet')
  assert.equal(plugin.version, '0.1.3')
  assert.equal(plugin.compatibility.cordisx, '>=0.1.0-beta.11 <0.2.0')
  assert.deepEqual(plugin.artifact, {
    publisherIdentity: 'npm:@cordisx',
    packageNamespace: '@cordisx',
    packageName: '@cordisx/plugin-pet',
    downloadUrl: 'https://github.com/cordisx/plugin-pet/releases/download/v0.1.3/cordisx-plugin-pet-0.1.3.tgz',
    integrity: 'sha256:097280dba8cec8206cfabc57a6f4c85b2c36e6732d6c9cd60e4f0adab92afdf4',
  })
  assert.equal(Object.hasOwn(plugin, 'manifest'), false)
  assert.equal(Object.hasOwn(plugin, 'official'), false)
  assert.equal(Object.hasOwn(plugin, 'certified'), false)
})

test('released owner packages use versioned URLs and exact digests', () => {
  for (
    const id of [
      'chatroom',
      'channel',
      'cli-proxy-api',
      'agent-trace-showcase',
      'codex-ascension',
      'plugin-composer-animal',
    ]
  ) {
    const plugin = feed.plugins.find(plugin => plugin.id === id)
    assert.ok(plugin?.artifact, id)
    assert.ok(plugin.artifact.downloadUrl.startsWith(`${plugin.source}/releases/download/v${plugin.version}/`), id)
    assert.match(plugin.artifact.integrity, /^sha256:[a-f0-9]{64}$/, id)
    assert.equal(plugin.artifact.publisherIdentity, `npm:${plugin.artifact.packageNamespace}`, id)
    assert.ok(plugin.artifact.packageName.startsWith(`${plugin.artifact.packageNamespace}/`), id)
  }
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
