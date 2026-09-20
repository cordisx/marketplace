# Install From A Marketplace

Requires [CordisX setup](https://raw.githubusercontent.com/cordisx/cordisx/main/llms.txt).
Use a CLI supporting local source names (0.1.0-beta.13 or a compatible later
release). Keep the existing `CORDISX_HOME` and selected profile throughout.

## Select The Source

Inspect `cordisx source list`. Reuse the requested source when already present
and enabled. For a new public Marketplace source:

```bash
SOURCE='https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json'
cordisx source add "$SOURCE" --name community --yes
```

For another Marketplace, take its URL and desired local name from the user's
source guide. Do not replace other configured stores. If an existing source is
disabled, use `source enable` with its URL when enabling it is part of the
request. Use `source edit` to name an existing unnamed source, not `source add`
to duplicate it. Consult `cordisx source --help` for the installed interface.

These examples use the configured default profile. If the user selected another
profile, append the same `--profile <profile>` to every source and plugin command.
On compatible Hosts, adding a canonical HTTPS source without a query trusts its
exact certification evidence by default. Use `--untrusted` for discovery only;
do not silently reverse an existing untrusted choice.

## Find And Install

```bash
cordisx plugin search '<query>' --source community
cordisx plugin info <plugin-id> --source community
cordisx plugin install <plugin-id> --source community --yes
cordisx plugin list
```

Replace the placeholders with the user's request and the id actually returned
by the source. Do not use the npm package name as the plugin id. Install only
the requested plugin. The selected source must be configured and enabled;
`--source` is not an ad-hoc URL fetch. `--version <version>` selects a version
the feed actually offers; it cannot make a registry-only release available.

`--yes` confirms the install operation, not plugin permissions. Honor the Host's
permission decision. If it requires user review, report that exact state rather
than copying grants or editing configuration to bypass it.

## Verify And Continue

Read the command result and `plugin list`. An offline install can remain pending
runtime activation. For a requested launch, use the [Host launch guide](https://raw.githubusercontent.com/cordisx/cordisx/main/.agents/docs/getting-started.md)
with the same profile, then verify the requested plugin in Manager. Follow the
plugin's own README for provider login and configuration; install success is
not proof of an authenticated provider or a working model request.

On failure, keep the nonzero result and useful diagnostic. Check source/profile
selection, network access, compatibility and artifact availability before
retrying; do not loop installs or describe a dry run as installation.
