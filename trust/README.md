# Marketplace trust records

This protected directory contains Marketplace-authority metadata only. It does
not contain, host, build, or execute plugin code.

- `official/<namespace>/<plugin-id>.json` verifies the independent CordisX
  publisher/maintainer identity.
- `certifications/<namespace>/<plugin-id>/<version>/<sha256>.json` reviews one
  exact published artifact under the named policy.

Only `@cordisx/core` CODEOWNERS may approve changes here. Grant, revocation,
expiry, publisher/source migration, and digest changes require a normal pull
request, passing deterministic conformance, and an evidence reference to that
Marketplace PR or its resulting exact commit.

Official and Certified are independent booleans: ordinary, Official only,
Certified only, and Official + Certified are all valid states. Official affects
Marketplace identity/filtering/product priority only and never changes a
PermissionBroker decision.

Certified is an exact-artifact code-conformance review, not a signature or an
absolute safety guarantee. A Host may turn an active exact record into the
Protocol-defined Certified permission eligibility projection. That projection
is not a grant and contains no permission allowlist: only PermissionBroker's
own catalog may omit explicit confirmation for named DOM/rendering abilities,
while still issuing a scoped, profile-, generation-, fingerprint-bound audited
grant or lease. Every other permission, install review, sandbox, and lifecycle
gate remains unchanged.

## Owner-maintained release coverage

`required-decisions.json` lists catalog identities whose author and Marketplace
owner require explicit Official and Certified decisions when an installable
artifact exists. For each new version or digest, provide a new exact record
with the owner's approval evidence; the previous certification does not carry
over. Validation accepts an explicit revoked or expired record so withdrawal
remains possible. Entries without a published artifact are discovery-only and
cannot receive these artifact-bound records until one exists. Other catalog
entries retain the independent trust states described above.
