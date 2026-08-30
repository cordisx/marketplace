# Certification records

Store each `marketplace-certification.v1` JSON record at
`<namespace>/<plugin-id>/<version>/<sha256-hex>.json`. The full lowercase
sha256 in the filename must equal the record integrity. New versions or rebuilt
digests require a new review and never inherit an earlier certification.

Removal, revocation, expiry, source drift, version drift, or digest drift must
remove the Host's exact Certified projection. Permission consumers use that
replacement as a revocation signal for certification-derived grants or leases;
the Marketplace record itself never names capabilities or creates a grant.
