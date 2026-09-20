import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createMarketplaceFeed, evaluateTrustRecords, validateMarketplacePluginDocument } from '../scripts/catalog.mjs'

const config = JSON.parse(await readFile(new URL('../feed.config.json', import.meta.url), 'utf8'))
const legacyFeedText = await readFile(new URL('../marketplace.json', import.meta.url), 'utf8')
const legacyFeed = JSON.parse(legacyFeedText)
const plugin = {
  $schema: 'https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/marketplace-plugin.v8.schema.json',
  schemaVersion: 8,
  id: 'notes',
  fallbackLocale: 'en',
  name: 'Notes',
  description: 'Notes from an independent publisher.',
  version: '1.0.0',
  source: 'https://github.com/independent/notes',
  artifact: {
    packageName: 'independent-notes',
    downloadUrl: 'https://github.com/independent/notes/releases/download/v1.0.0/notes.tgz',
    integrity: `sha256:${'a'.repeat(64)}`,
  },
  license: 'MIT',
  compatibility: { cordisx: '^0.1.0' },
  authors: [{ name: 'Independent developer' }],
}

test('ordinary v8 artifacts accept unrelated scopes and unscoped names without publisher claims', () => {
  for (const name of ['independent-notes', '@independent/notes', '@another-team/plugin-notes']) {
    const entry = { ...plugin, artifact: { ...plugin.artifact, packageName: name } }
    assert.equal(validateMarketplacePluginDocument(entry).valid, true, name)
    assert.deepEqual(evaluateTrustRecords([entry], [], [], config.generatedAt), [])
  }
})

test('package scope does not supply or constrain optional asserted publisher metadata', () => {
  const entry = {
    ...plugin,
    artifact: { ...plugin.artifact, packageName: '@independent/notes', publisherIdentity: 'npm:another-author' },
  }
  assert.equal(validateMarketplacePluginDocument(entry).valid, true)
  const malformed = { ...entry, artifact: { ...entry.artifact, publisherIdentity: 'not-a-publisher-identity' } }
  assert.equal(validateMarketplacePluginDocument(malformed).valid, false)
})

test('v8 still rejects invalid names, fabricated namespaces, and plugin trust self-claims', () => {
  for (
    const name of [
      '../notes',
      '@scope/../notes',
      'Uppercase',
      '@scope',
      'notes/extra',
      'node_modules',
      'favicon.ico',
      '',
    ]
  ) {
    assert.equal(
      validateMarketplacePluginDocument({ ...plugin, artifact: { ...plugin.artifact, packageName: name } }).valid,
      false,
    )
  }
  assert.equal(
    validateMarketplacePluginDocument({ ...plugin, artifact: { ...plugin.artifact, packageNamespace: '@cordisx' } })
      .valid,
    false,
  )
  for (const field of ['official', 'certified', 'certification']) {
    assert.equal(validateMarketplacePluginDocument({ ...plugin, [field]: true }).valid, false)
  }
})

test('explicit v8 generation supports registry-independent artifacts without granting trust', () => {
  const feed = createMarketplaceFeed({ ...config, schemaVersion: 8, description: 'Community plugins.' }, [plugin])
  assert.equal(feed.schemaVersion, 8)
  assert.equal(feed.plugins[0].artifact.packageName, 'independent-notes')
  assert.equal(Object.hasOwn(feed.plugins[0].artifact, 'publisherIdentity'), false)
  assert.deepEqual(feed.official, [])
  assert.deepEqual(feed.certifications, [])
})

test('v8 preserves exact Official identity matching without inferring a publisher from the name', () => {
  const entry = {
    ...plugin,
    source: 'https://github.com/cordisx/notes',
    artifact: { ...plugin.artifact, packageName: '@cordisx/plugin-notes', publisherIdentity: 'npm:@cordisx' },
  }
  const record = {
    identity: {
      pluginId: entry.id,
      canonicalSource: entry.source,
      publisherIdentity: entry.artifact.publisherIdentity,
      packageNamespace: '@cordisx',
      packageName: entry.artifact.packageName,
    },
    verifiedAt: '2026-08-20T08:00:00Z',
    status: 'active',
  }
  assert.deepEqual(evaluateTrustRecords([entry], [record], [], config.generatedAt), [])
  for (
    const artifact of [
      { ...entry.artifact, publisherIdentity: undefined },
      { ...entry.artifact, publisherIdentity: 'npm:another-author' },
      { ...entry.artifact, packageName: '@cordisx/other-notes' },
      { ...entry.artifact, packageName: '@cordisx-extra/plugin-notes' },
      { ...entry.artifact, packageName: 'independent-notes' },
    ]
  ) {
    assert.match(
      evaluateTrustRecords([{ ...entry, artifact }], [record], [], config.generatedAt).join('\n'),
      /official identity does not exactly match/,
    )
  }
})

test('unscoped v8 artifacts can match independent certification only for the exact source, id, version and digest', () => {
  const record = {
    identity: {
      pluginId: plugin.id,
      canonicalSource: plugin.source,
      version: plugin.version,
      integrity: plugin.artifact.integrity,
    },
    reviewedAt: '2026-08-20T08:00:00Z',
    expiresAt: '2026-11-20T08:00:00Z',
    status: 'active',
  }
  assert.deepEqual(evaluateTrustRecords([plugin], [], [record], config.generatedAt), [])
  for (
    const changed of [
      { ...plugin, id: 'other-notes' },
      { ...plugin, source: 'https://github.com/another/notes' },
      { ...plugin, version: '1.0.1' },
      { ...plugin, artifact: { ...plugin.artifact, integrity: `sha256:${'b'.repeat(64)}` } },
    ]
  ) {
    assert.match(
      evaluateTrustRecords([changed], [], [record], config.generatedAt).join('\n'),
      /certification does not exactly match/,
    )
  }
})

test('the default feed stays byte-compatible with the already published v3 catalog', () => {
  const feed = createMarketplaceFeed(config, legacyFeed.plugins, legacyFeed.official, legacyFeed.certifications)
  assert.equal(`${JSON.stringify(feed, null, 2)}\n`, legacyFeedText)
  assert.throws(() => createMarketplaceFeed(config, [plugin]), /marketplace.json/)
  assert.throws(
    () =>
      createMarketplaceFeed({ ...config, schemaVersion: 8, description: 'Community plugins.' }, [
        plugin,
        legacyFeed.plugins[0],
      ]),
    /marketplace.json/,
  )
  assert.throws(() => createMarketplaceFeed({ ...config, schemaVersion: 9 }, []), /unsupported/)
})
