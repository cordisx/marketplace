# Marketplace Maintenance Rules

- Follow the [organization file-size rule](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/file-size.md) for formatting and responsibility-based splitting guidance.
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

## Shared quality configuration

The local dprint and ESLint entry points consume an exact formal
[Mono quality configuration](https://github.com/cordisx/cordisxmono/blob/c63c2e8c2ba7e11502934a52ad2ce3734e804cdc/.agents/docs/quality-tooling.md).
The Shared quality configuration CI job checks the installed configuration and
tracked-file coverage; inspect its report for excluded paths.
`npm run lint:source` runs the full source policy as a blocking CI step.
Configuration coverage and full-source lint are separate checks.
Update the dependency, lock, formatter reference and CI provider SHA together.
