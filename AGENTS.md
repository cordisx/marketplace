# Repository Guide

Read `.agents/rules/README.md` before changing this repository.

- Keep this repository limited to discovery catalog data, validation, and feed generation.
- Treat the pinned `cordisx/cordisx-protocol` schemas as normative.
- Store one contributed plugin entry per JSON file under `plugins/<namespace>/`.
- Do not accept executable plugin code, credentials, private metadata, or unpublished strategy.
- Keep `marketplace.json` deterministic and generated from validated entries.
- Run `npm run check` after catalog, schema-lock, validator, or workflow changes.
