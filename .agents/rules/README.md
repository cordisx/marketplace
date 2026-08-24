# Marketplace Maintenance Rules

- Pin protocol schemas to an exact public commit in `protocol.lock.json`.
- Reject entries that fail the pinned schema, canonical-source rule, or `(source, id)` uniqueness rule.
- Require lowercase stable plugin ids and canonical HTTPS source repositories.
- Generate the aggregate feed from sorted contributor files; never hand-edit generated data.
- Treat catalog metadata as untrusted display data and never execute contributed URLs or code in CI.
- Keep pull-request checks deterministic and deny generated-feed drift.
- Keep official-publisher and certification records under `trust/`; only the
  Marketplace CODEOWNERS authority may grant, revoke, or expire them.
- Official and Certified are independent. Official binds publisher/source/
  namespace identity; Certified binds one id/version/source/sha256 artifact.
- Do not claim installation, signing, capability enforcement, activation, or
  rollback. A recorded sha256 is artifact identity, not publisher proof or a
  cryptographic Marketplace attestation.
