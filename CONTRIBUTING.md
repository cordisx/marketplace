# Contributing a CordisX Plugin

## Entry workflow

1. Copy `templates/plugin.json` to `plugins/<namespace>/<plugin-id>.json`.
2. Use a lowercase stable `id` and your canonical public HTTPS repository URL
   as `source`.
3. Fill in discovery metadata only. Do not include tokens, executable code, or
   unsupported permission claims. Never add `official`, `certified`, or an
   equivalent self-asserted trust field to a plugin entry or manifest.
4. Run `npm ci`, `npm run build`, and `npm run check`.
5. Commit both your plugin entry and the regenerated `marketplace.json`, then
   open a pull request.

The identity key is `(source, id)`, not the file path or catalog URL. One feed
contains one current record for each identity.

## Local protocol checkout

Maintainers validating a compatible protocol branch can avoid network schema
downloads:

```bash
CORDISX_PROTOCOL_DIR=../cordisx-protocol npm run check
```

Normal CI uses the exact public commit in `protocol.lock.json`.

## Review boundary

Passing validation proves only that the metadata conforms to the discovery
format. It is not a code audit, identity verification, signature check, safety
review, or installation approval. Official and Certified are separately
granted through the CODEOWNERS-protected process documented in
[`trust/README.md`](trust/README.md); plugin contributors cannot grant either
through discovery or package metadata.
