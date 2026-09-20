# Repository Guide

Read `.agents/rules/README.md` before changing this repository.

- Keep this repository limited to discovery catalog data, validation, and feed generation.
- Treat the pinned `cordisx/cordisx-protocol` schemas as normative.
- Store one contributed plugin entry per JSON file under `plugins/<namespace>/`.
- Do not accept executable plugin code, credentials, private metadata, or unpublished strategy.
- Keep `marketplace.json` deterministic and generated from validated entries.
- Run `npm run check` after catalog, schema-lock, validator, or workflow changes.
- CordisX-maintained plugin packages should use the `@cordisx/plugin-<slug>`
  naming convention. It is not an admission requirement for external plugins:
  the version-8 artifact contract accepts independent scopes and unscoped names.
- Keep the existing version-3 canonical feed until a compatible Host is released.
  A version-8 rollout requires an explicit feed configuration and compatible
  version-8 entries; do not invent scope or publisher metadata for a downgrade.
