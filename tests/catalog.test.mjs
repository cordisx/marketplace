import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateTrustRecords } from '../scripts/catalog.mjs'

const GENERATED_AT = '2026-08-24T12:31:00Z'
const plugin = {
  id: 'notes',
  version: '1.3.0',
  source: 'https://github.com/cordisx/notes',
  artifact: {
    publisherIdentity: 'npm:@cordisx',
    packageNamespace: '@cordisx',
    packageName: '@cordisx/notes',
    integrity: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
}
const official = {
  identity: {
    pluginId: 'notes',
    canonicalSource: plugin.source,
    publisherIdentity: plugin.artifact.publisherIdentity,
    packageNamespace: plugin.artifact.packageNamespace,
    packageName: plugin.artifact.packageName,
  },
  verifiedAt: '2026-08-20T08:00:00Z',
  status: 'active',
}
const certification = {
  identity: {
    pluginId: 'notes',
    version: plugin.version,
    canonicalSource: plugin.source,
    integrity: plugin.artifact.integrity,
  },
  reviewedAt: '2026-08-20T08:00:00Z',
  expiresAt: '2026-11-20T08:00:00Z',
  status: 'active',
}

test('accepts independent active Official and Certified records', () => {
  assert.deepEqual(evaluateTrustRecords([plugin], [official], [certification], GENERATED_AT), [])
})

test('rejects publisher/source migration until Official is re-verified', () => {
  const migrated = structuredClone(plugin)
  migrated.artifact.publisherIdentity = 'npm:@example'
  migrated.artifact.packageNamespace = '@example'
  migrated.artifact.packageName = '@example/notes'
  assert.match(evaluateTrustRecords([migrated], [official], [], GENERATED_AT).join('\n'), /official identity does not exactly match/)
})

test('does not inherit certification across version or digest changes', () => {
  const rebuilt = structuredClone(plugin)
  rebuilt.version = '1.4.0'
  rebuilt.artifact.integrity = 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  assert.match(evaluateTrustRecords([rebuilt], [], [certification], GENERATED_AT).join('\n'), /certification does not exactly match/)
})

test('rejects an expired certification that remains active', () => {
  const stale = { ...certification, expiresAt: '2026-08-23T08:00:00Z' }
  assert.match(evaluateTrustRecords([plugin], [], [stale], GENERATED_AT).join('\n'), /cannot remain active/)
})

test('accepts feed revocation without changing independent Official identity', () => {
  const revoked = { ...certification, status: 'revoked', revokedAt: '2026-08-23T08:00:00Z' }
  assert.deepEqual(evaluateTrustRecords([plugin], [official], [revoked], GENERATED_AT), [])
  assert.equal(official.status, 'active')
  assert.equal(revoked.status, 'revoked')
})
