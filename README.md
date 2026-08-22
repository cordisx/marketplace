# CordisX Marketplace

Public, pull-request-driven discovery catalog for CordisX plugins.

- Browse: <https://cordisx.github.io/marketplace/>
- JSON feed: <https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json>
- Protocol: <https://github.com/cordisx/cordisx-protocol>

This first stage publishes metadata only. Catalog inclusion does not mean that
CordisX has verified, signed, installed, or sandboxed a plugin.

## Add a plugin

Read [CONTRIBUTING.md](CONTRIBUTING.md), add one JSON file under
`plugins/<namespace>/<plugin-id>.json`, run the checks, and open a pull request.
Every pull request validates the pinned JSON Schema, canonical plugin source,
`(source, id)` uniqueness, deterministic ordering, and generated-feed drift.

```bash
npm ci
npm run build
npm run check
```
