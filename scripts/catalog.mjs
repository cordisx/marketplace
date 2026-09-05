import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const currentFile = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(currentFile), '..')
const lock = JSON.parse(await readFile(path.join(root, 'protocol.lock.json'), 'utf8'))
const protocolDirectory = process.env.CORDISX_PROTOCOL_DIR
const TRUST_ROOT = 'https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json'

async function loadSchema(relativePath) {
  if (protocolDirectory !== undefined) {
    return JSON.parse(await readFile(path.resolve(protocolDirectory, relativePath), 'utf8'))
  }
  const url = `https://raw.githubusercontent.com/cordisx/cordisx-protocol/${lock.commit}/${relativePath}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`schema download returned HTTP ${response.status}: ${url}`)
  return response.json()
}

const schemas = new Map(
  await Promise.all(
    Object.entries(lock.schemas).map(async ([name, relativePath]) => [
      name,
      await loadSchema(relativePath),
    ]),
  ),
)
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true })
addFormats(ajv)
for (const schema of schemas.values()) ajv.addSchema(schema)

function validator(name) {
  const schema = schemas.get(name)
  const resolved = schema === undefined ? undefined : ajv.getSchema(schema.$id)
  if (resolved === undefined) throw new Error(`pinned ${name} schema was not registered`)
  return resolved
}

const validatePluginSchema = validator('plugin')
const validateFeedSchema = validator('feed')
const validateOfficialSchema = validator('official')
const validateCertificationSchema = validator('certification')

/** Testable catalog boundary: plugin documents cannot carry trust self-claims. */
export function validateMarketplacePluginDocument(value) {
  const valid = validatePluginSchema(value)
  return Object.freeze({
    valid,
    errors: Object.freeze((validatePluginSchema.errors ?? []).map(error => Object.freeze({ ...error }))),
  })
}

export function canonicalSource(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    throw new Error('source must be an HTTPS URL without credentials, query, or fragment')
  }
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  return url.href
}

function canonicalLocale(value) {
  const [canonical] = Intl.getCanonicalLocales(value)
  if (canonical === undefined) throw new Error(`invalid locale: ${value}`)
  return canonical
}

async function jsonFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await jsonFiles(absolute))
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(absolute)
  }
  return files.sort()
}

async function readJson(file, errors) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    errors.push(`${path.relative(root, file)}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
}

function appendSchemaErrors(errors, label, schemaValidator) {
  for (const error of schemaValidator.errors ?? []) errors.push(`${label}${error.instancePath}: ${error.message}`)
}

function comparePlugins(left, right) {
  return left.source.localeCompare(right.source)
    || left.id.localeCompare(right.id)
    || left.version.localeCompare(right.version)
}

function compareOfficial(left, right) {
  return left.identity.canonicalSource.localeCompare(right.identity.canonicalSource)
    || left.identity.pluginId.localeCompare(right.identity.pluginId)
    || left.identity.packageName.localeCompare(right.identity.packageName)
}

function compareCertification(left, right) {
  return left.identity.canonicalSource.localeCompare(right.identity.canonicalSource)
    || left.identity.pluginId.localeCompare(right.identity.pluginId)
    || left.identity.version.localeCompare(right.identity.version)
    || left.identity.integrity.localeCompare(right.identity.integrity)
}

function instant(value, label, errors) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) errors.push(`${label} must be a valid date-time`)
  return parsed
}

function validatePluginLocalization(plugin, label, errors) {
  try {
    if (canonicalLocale(plugin.fallbackLocale) !== plugin.fallbackLocale) {
      errors.push(`${label}.fallbackLocale must use canonical serialization`)
    }
    for (const [locale, localization] of Object.entries(plugin.localizations ?? {})) {
      if (canonicalLocale(locale) !== locale) {
        errors.push(`${label}.localizations locale must use canonical serialization: ${locale}`)
      }
      if (locale === plugin.fallbackLocale) {
        errors.push(`${label}.localizations must not repeat fallbackLocale ${locale}`)
      }
      if (localization.authors !== undefined && localization.authors.length !== plugin.authors.length) {
        errors.push(`${label}.localizations.${locale}.authors must preserve base author order and length`)
      }
    }
  } catch (error) {
    errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function sameOfficialIdentity(record, plugin) {
  return record.identity.pluginId === plugin.id
    && record.identity.canonicalSource === plugin.source
    && record.identity.publisherIdentity === plugin.artifact?.publisherIdentity
    && record.identity.packageNamespace === plugin.artifact?.packageNamespace
    && record.identity.packageName === plugin.artifact?.packageName
}

function sameCertificationIdentity(record, plugin) {
  return record.identity.pluginId === plugin.id
    && record.identity.version === plugin.version
    && record.identity.canonicalSource === plugin.source
    && record.identity.integrity === plugin.artifact?.integrity
}

export function evaluateTrustRecords(plugins, official, certifications, evaluatedAtValue) {
  const errors = []
  const evaluatedAt = instant(evaluatedAtValue, 'generatedAt', errors)
  const pluginByIdentity = new Map(plugins.map(plugin => [`${plugin.source}\u0000${plugin.id}`, plugin]))

  const officialIdentities = new Set()
  for (const record of official) {
    const identity = JSON.stringify(record.identity)
    if (officialIdentities.has(identity)) errors.push(`duplicate official identity: ${identity}`)
    officialIdentities.add(identity)
    const plugin = pluginByIdentity.get(`${record.identity.canonicalSource}\u0000${record.identity.pluginId}`)
    if (plugin === undefined || plugin.artifact === undefined || !sameOfficialIdentity(record, plugin)) {
      errors.push(`official identity does not exactly match a current plugin artifact: ${record.identity.pluginId}`)
    }
    const verifiedAt = instant(record.verifiedAt, `official ${record.identity.pluginId}.verifiedAt`, errors)
    const revokedAt = record.revokedAt === undefined
      ? undefined
      : instant(record.revokedAt, `official ${record.identity.pluginId}.revokedAt`, errors)
    if (verifiedAt > evaluatedAt) {
      errors.push(`official ${record.identity.pluginId}.verifiedAt must not be after generatedAt`)
    }
    if (record.status === 'active' && revokedAt !== undefined) {
      errors.push(`active official ${record.identity.pluginId} must not include revokedAt`)
    }
    if (record.status === 'revoked') {
      if (revokedAt === undefined) errors.push(`revoked official ${record.identity.pluginId} requires revokedAt`)
      else if (revokedAt < verifiedAt || revokedAt > evaluatedAt) {
        errors.push(`official ${record.identity.pluginId}.revokedAt is outside the valid interval`)
      }
    }
  }

  const certificationIdentities = new Set()
  for (const record of certifications) {
    const identity = JSON.stringify(record.identity)
    if (certificationIdentities.has(identity)) errors.push(`duplicate certification identity: ${identity}`)
    certificationIdentities.add(identity)
    const plugin = pluginByIdentity.get(`${record.identity.canonicalSource}\u0000${record.identity.pluginId}`)
    if (plugin === undefined || plugin.artifact === undefined || !sameCertificationIdentity(record, plugin)) {
      errors.push(
        `certification does not exactly match a current plugin artifact: ${record.identity.pluginId}@${record.identity.version}`,
      )
    }
    const reviewedAt = instant(record.reviewedAt, `certification ${record.identity.pluginId}.reviewedAt`, errors)
    const expiresAt = instant(record.expiresAt, `certification ${record.identity.pluginId}.expiresAt`, errors)
    const revokedAt = record.revokedAt === undefined
      ? undefined
      : instant(record.revokedAt, `certification ${record.identity.pluginId}.revokedAt`, errors)
    if (reviewedAt > evaluatedAt) {
      errors.push(`certification ${record.identity.pluginId}.reviewedAt must not be after generatedAt`)
    }
    if (expiresAt <= reviewedAt) {
      errors.push(`certification ${record.identity.pluginId}.expiresAt must be after reviewedAt`)
    }
    if (record.status === 'active') {
      if (revokedAt !== undefined) {
        errors.push(`active certification ${record.identity.pluginId} must not include revokedAt`)
      }
      if (expiresAt <= evaluatedAt) {
        errors.push(`expired certification ${record.identity.pluginId} cannot remain active`)
      }
    }
    if (record.status === 'expired') {
      if (revokedAt !== undefined) {
        errors.push(`expired certification ${record.identity.pluginId} must not include revokedAt`)
      }
      if (expiresAt > evaluatedAt) {
        errors.push(`unexpired certification ${record.identity.pluginId} cannot be marked expired`)
      }
    }
    if (record.status === 'revoked') {
      if (revokedAt === undefined) errors.push(`revoked certification ${record.identity.pluginId} requires revokedAt`)
      else if (revokedAt < reviewedAt || revokedAt > evaluatedAt) {
        errors.push(`certification ${record.identity.pluginId}.revokedAt is outside the valid interval`)
      }
    }
  }
  return errors
}

function validateOfficialPath(file, record, errors) {
  const relative = path.relative(path.join(root, 'trust/official'), file)
  if (path.basename(file) !== `${record.identity.pluginId}.json`) {
    errors.push(`${relative}: official filename must be ${record.identity.pluginId}.json`)
  }
}

function validateCertificationPath(file, record, errors) {
  const relative = path.relative(path.join(root, 'trust/certifications'), file)
  const segments = relative.split(path.sep)
  const digest = record.identity.integrity.slice('sha256:'.length)
  const expectedTail = [record.identity.pluginId, record.identity.version, `${digest}.json`]
  if (segments.length !== 4 || JSON.stringify(segments.slice(1)) !== JSON.stringify(expectedTail)) {
    errors.push(`${relative}: certification path must be <namespace>/${expectedTail.join('/')}`)
  }
}

async function main() {
  const errors = []
  const config = await readJson(path.join(root, 'feed.config.json'), errors)
  if (config === undefined) throw new Error(errors.join('\n'))
  if (config.trust?.root !== TRUST_ROOT) errors.push(`feed.config.json: trust.root must be ${TRUST_ROOT}`)

  const plugins = []
  const identities = new Map()
  for (const file of await jsonFiles(path.join(root, 'plugins'))) {
    const relative = path.relative(root, file)
    const plugin = await readJson(file, errors)
    if (plugin === undefined) continue
    if (!validatePluginSchema(plugin)) {
      appendSchemaErrors(errors, relative, validatePluginSchema)
      continue
    }
    try {
      if (canonicalSource(plugin.source) !== plugin.source) {
        errors.push(`${relative}: source must use canonical serialization`)
      }
    } catch (error) {
      errors.push(`${relative}: ${error instanceof Error ? error.message : String(error)}`)
    }
    validatePluginLocalization(plugin, relative, errors)
    if (plugin.artifact !== undefined) {
      if (!plugin.artifact.packageName.startsWith(`${plugin.artifact.packageNamespace}/`)) {
        errors.push(`${relative}: artifact.packageName must belong to artifact.packageNamespace`)
      }
      if (plugin.artifact.publisherIdentity !== `npm:${plugin.artifact.packageNamespace}`) {
        errors.push(`${relative}: artifact.publisherIdentity must match artifact.packageNamespace`)
      }
    }
    if (path.basename(file) !== `${plugin.id}.json`) errors.push(`${relative}: filename must be ${plugin.id}.json`)
    const identity = `${plugin.source}\u0000${plugin.id}`
    const duplicate = identities.get(identity)
    if (duplicate !== undefined) errors.push(`${relative}: duplicate identity already declared by ${duplicate}`)
    identities.set(identity, relative)
    plugins.push(plugin)
  }

  const official = []
  for (const file of await jsonFiles(path.join(root, 'trust/official'))) {
    const relative = path.relative(root, file)
    const record = await readJson(file, errors)
    if (record === undefined) continue
    if (!validateOfficialSchema(record)) {
      appendSchemaErrors(errors, relative, validateOfficialSchema)
      continue
    }
    if (typeof record.label.fallback !== 'string' || typeof record.description.fallback !== 'string') {
      errors.push(`${relative}: official label and description require localized fallbacks`)
    }
    validateOfficialPath(file, record, errors)
    official.push(record)
  }

  const certifications = []
  for (const file of await jsonFiles(path.join(root, 'trust/certifications'))) {
    const relative = path.relative(root, file)
    const record = await readJson(file, errors)
    if (record === undefined) continue
    if (!validateCertificationSchema(record)) {
      appendSchemaErrors(errors, relative, validateCertificationSchema)
      continue
    }
    if (typeof record.label.fallback !== 'string' || typeof record.description.fallback !== 'string') {
      errors.push(`${relative}: certification label and description require localized fallbacks`)
    }
    validateCertificationPath(file, record, errors)
    certifications.push(record)
  }

  plugins.sort(comparePlugins)
  official.sort(compareOfficial)
  certifications.sort(compareCertification)
  errors.push(...evaluateTrustRecords(plugins, official, certifications, config.generatedAt))

  const feed = {
    $schema: 'https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/marketplace-feed.v3.schema.json',
    schemaVersion: 3,
    generatedAt: config.generatedAt,
    trust: config.trust,
    fallbackLocale: config.fallbackLocale,
    name: config.name,
    ...(config.localizations === undefined ? {} : { localizations: config.localizations }),
    homepage: config.homepage,
    plugins,
    official,
    certifications,
  }
  if (!validateFeedSchema(feed)) appendSchemaErrors(errors, 'marketplace.json', validateFeedSchema)

  const generated = `${JSON.stringify(feed, null, 2)}\n`
  const outputPath = path.join(root, 'marketplace.json')
  const mode = process.argv[2]
  if (mode === 'build') {
    if (errors.length > 0) throw new Error(errors.join('\n'))
    await writeFile(outputPath, generated)
    console.log(
      `generated marketplace.json with ${plugins.length} plugin(s), ${official.length} official record(s), and ${certifications.length} certification record(s)`,
    )
  } else if (mode === 'check') {
    const committed = await readFile(outputPath, 'utf8').catch(() => '')
    if (committed !== generated) errors.push('marketplace.json is stale; run npm run build')
    if (errors.length > 0) throw new Error(errors.join('\n'))
    console.log(
      `marketplace catalog check: ${plugins.length} plugin(s), ${official.length} official record(s), ${certifications.length} certification record(s), all checks passed`,
    )
  } else {
    throw new Error('Usage: node scripts/catalog.mjs <build|check>')
  }
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === currentFile) await main()
