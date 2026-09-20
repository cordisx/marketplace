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
- The canonical feed uses version 8 and requires CordisX 0.1.0-beta.12 or later.
  Keep version-8 entries consistent with the explicit feed configuration;
  do not invent scope or publisher metadata for a downgrade.
