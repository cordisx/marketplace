# CordisX Marketplace

Public, pull-request-driven discovery catalog for CordisX plugins.

- Browse: <https://cordisx.github.io/marketplace/>
- JSON feed: <https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json>
- Protocol: <https://github.com/cordisx/cordisx-protocol>

This repository publishes metadata only. Ordinary catalog inclusion is neither
Official nor Certified. Those independent, stackable projections require a
protected record under `trust/`. Official only affects Marketplace identity and
product priority. Certified means the exact artifact conforms to the named
CordisX review policy; it is not an absolute safety guarantee. Its Host-owned
permission eligibility projection is not itself a grant and never changes
non-DOM permission review, installation, sandbox, or lifecycle gates.

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
