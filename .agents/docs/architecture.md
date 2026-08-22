# CordisX Marketplace Catalog Architecture

## Boundary

This repository is the public contribution and discovery-data plane for
CordisX plugins. It accepts metadata only. Executable packages, manifests,
signatures, installation, activation, capability grants, and rollback are
outside this repository's authority.

## Data pipeline

```text
plugins/<namespace>/<plugin>.json
              |
              v
pinned cordisx-protocol schemas + semantic validator
              |
              v
deterministic marketplace.json
              |
              +---- cordisx.github.io read-only page
              +---- CordisX manager configured feed reader
```

`protocol.lock.json` pins the exact protocol repository commit and schema paths.
Local compatible-set validation may use `CORDISX_PROTOCOL_DIR`; CI downloads the
same files from the pinned public commit. The aggregate feed sorts by canonical
plugin `source`, plugin `id`, then plugin release `version`.

## Identity and pull requests

One current plugin is identified by canonical `(source, id)`. File paths make
review ownership legible but do not define protocol identity. A contribution
pull request adds or updates one plugin JSON file and regenerates the feed.

CI parses every JSON entry, validates the pinned JSON Schema, enforces canonical
source serialization and tuple uniqueness, validates the generated feed, and
fails if `marketplace.json` is stale. Network reachability is not a merge-time
identity guarantee and is not folded into deterministic format validation.

## PR and validation boundary

This repository's initial PR owns contributor instructions, protocol pinning,
one official example entry, deterministic generation, and GitHub Actions
checks. Protocol evolution remains in `cordisx-protocol`; public presentation
remains in `cordisx.github.io`; consumer behavior remains in `cordisx`.

Validation consists of `npm run check`, a clean regeneration comparison, JSON
Schema validation, semantic identity checks, and a CI run on pull requests and
`main`. No plugin code is loaded during validation.
