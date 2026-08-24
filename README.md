# CordisX Marketplace

Public, pull-request-driven discovery catalog for CordisX plugins.

- Browse: <https://cordisx.github.io/marketplace/>
- JSON feed: <https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json>
- Protocol: <https://github.com/cordisx/cordisx-protocol>

This repository publishes metadata only. Ordinary catalog inclusion is neither
Official nor Certified. Those independent projections require a protected
record under `trust/`; neither is a signature, permission grant, installation
approval, sandbox claim, or absolute safety guarantee.

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
