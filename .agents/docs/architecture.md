# CordisX Marketplace Catalog Architecture

## Boundary

This repository is the public contribution and discovery-data plane for
CordisX plugins. It accepts metadata only. Executable packages, manifests,
signatures, installation, activation, capability grants, and rollback are
outside this repository's authority.

## Data pipeline

```text
plugins/<namespace>/<plugin>.json
trust/official/<namespace>/<plugin>.json
trust/certifications/<namespace>/<plugin>/<version>/<sha256>.json
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

## Trust records

The version-3 feed has two independent top-level trust dimensions. Official
publisher records bind stable plugin id, canonical CordisX source, trusted npm
publisher identity, package namespace, and exact package name; they may
continue across versions only while those values stay unchanged. Certification
records bind one plugin id, semantic version, canonical source, sha256 artifact
integrity, and review-policy version. A new version or digest never inherits a
certification.

Only JSON records under `trust/official/` and `trust/certifications/` can grant
these projections. Both directories, their generator, the schema lock, and the
generated feed are owned by `@cordisx/core` through CODEOWNERS. CI rejects
unknown authority, identity mismatch, invalid status time, missing digest, and
plugin-entry self-claims. Removing, revoking, or expiring a record changes the
next deterministic feed; consumers replace their cached trust projection on
refresh.

The trust model is explicitly `protected-merge-chain-v1` with cryptographic
attestation `unsupported`. Marketplace hosts no plugin code and does not
pretend these records are signatures. Official and Certified do not grant
permissions, bypass install review, or relax Package Store, sandbox, or
generation lifecycle gates.

## PR and validation boundary

This repository's initial PR owns contributor instructions, protocol pinning,
one official example entry, deterministic generation, and GitHub Actions
checks. Protocol evolution remains in `cordisx-protocol`; public presentation
remains in `cordisx.github.io`; consumer behavior remains in `cordisx`.

Validation consists of `npm run check`, a clean regeneration comparison, JSON
Schema validation, semantic identity checks, and a CI run on pull requests and
`main`. No plugin code is loaded during validation.
