## Marketplace trust record

- [ ] This pull request changes only Marketplace authority metadata and generated output, not plugin code.
- [ ] Official and Certified are modeled independently; neither is inferred from the other.
- [ ] Official identity exactly matches the trusted publisher, canonical source, namespace, and package name.
- [ ] Certification exactly matches plugin id, version, canonical source, sha256, and review-policy version.
- [ ] The record names a `cordisx.marketplace.codeowners/v1` evidence reference.
- [ ] Grant/revocation/expiry timestamps and `feed.config.json.generatedAt` are coherent.
- [ ] I ran `npm run build` and `npm run check` and committed `marketplace.json`.

This record is not a package signature, absolute safety guarantee, permission
grant, installation approval, or lifecycle bypass.
