import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lock = JSON.parse(await readFile(path.join(root, 'protocol.lock.json'), 'utf8'))
const protocolDirectory = process.env.CORDISX_PROTOCOL_DIR

async function loadSchema(relativePath) {
  if (protocolDirectory !== undefined) {
    return JSON.parse(await readFile(path.resolve(protocolDirectory, relativePath), 'utf8'))
  }
  const url = `https://raw.githubusercontent.com/cordisx/cordisx-protocol/${lock.commit}/${relativePath}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`schema download returned HTTP ${response.status}: ${url}`)
  return response.json()
}

const pluginSchema = await loadSchema(lock.schemas.plugin)
const feedSchema = await loadSchema(lock.schemas.feed)
const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
ajv.addSchema(pluginSchema)
const validatePluginSchema = ajv.getSchema(pluginSchema.$id)
const validateFeedSchema = ajv.compile(feedSchema)
if (validatePluginSchema === undefined) throw new Error('pinned plugin schema was not registered')

function canonicalSource(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    throw new Error('source must be an HTTPS URL without credentials, query, or fragment')
  }
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  return url.href
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

function comparePlugins(left, right) {
  return left.source.localeCompare(right.source)
    || left.id.localeCompare(right.id)
    || left.version.localeCompare(right.version)
}

const errors = []
const plugins = []
const identities = new Map()
for (const file of await jsonFiles(path.join(root, 'plugins'))) {
  const relative = path.relative(root, file)
  let plugin
  try {
    plugin = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    errors.push(`${relative}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  if (!validatePluginSchema(plugin)) {
    for (const error of validatePluginSchema.errors ?? []) errors.push(`${relative}${error.instancePath}: ${error.message}`)
    continue
  }
  try {
    if (canonicalSource(plugin.source) !== plugin.source) errors.push(`${relative}: source must use canonical serialization`)
  } catch (error) {
    errors.push(`${relative}: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (path.basename(file) !== `${plugin.id}.json`) errors.push(`${relative}: filename must be ${plugin.id}.json`)
  const identity = `${plugin.source}\u0000${plugin.id}`
  const duplicate = identities.get(identity)
  if (duplicate !== undefined) errors.push(`${relative}: duplicate identity already declared by ${duplicate}`)
  identities.set(identity, relative)
  plugins.push(plugin)
}

plugins.sort(comparePlugins)
const feed = {
  $schema: 'https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/marketplace-feed.v1.schema.json',
  schemaVersion: 1,
  name: 'CordisX Community Marketplace',
  homepage: 'https://cordisx.github.io/marketplace/',
  plugins,
}
if (!validateFeedSchema(feed)) {
  for (const error of validateFeedSchema.errors ?? []) errors.push(`marketplace.json${error.instancePath}: ${error.message}`)
}
const generated = `${JSON.stringify(feed, null, 2)}\n`
const outputPath = path.join(root, 'marketplace.json')
const mode = process.argv[2]
if (mode === 'build') {
  if (errors.length > 0) throw new Error(errors.join('\n'))
  await writeFile(outputPath, generated)
  console.log(`generated marketplace.json with ${plugins.length} plugin(s)`)
} else if (mode === 'check') {
  const committed = await readFile(outputPath, 'utf8').catch(() => '')
  if (committed !== generated) errors.push('marketplace.json is stale; run npm run build')
  if (errors.length > 0) throw new Error(errors.join('\n'))
  console.log(`marketplace catalog check: ${plugins.length} plugin(s), all checks passed`)
} else {
  throw new Error('Usage: node scripts/catalog.mjs <build|check>')
}
