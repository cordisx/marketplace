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

Official does not imply Certified; Certified does not imply Official. Neither
is a signature, absolute safety guarantee, permission grant, install approval,
or lifecycle bypass.
