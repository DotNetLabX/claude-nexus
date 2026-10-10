# Changelog — nexus-channels

All notable changes to the `nexus-channels` plugin.

## [0.2.5] — 2026-09-26
- PATCH bump.
  - hook behavior/enforcement change
  - rule (always-on kernel — injected every session)
  - estate raise: plugins/nexus-channels/rules/access-resolver.md 2505→3107 B — adhoc-ClaimsAndSources: consumer feedback nexus-2.0.2-2026-09-25 #10-#12 - access rule scoped to how a declared corpus is reached (not which sources), undeclared-source Grounded form; kernel research line gains the works-or-breaks and other-system duty (ADR-121)

## [0.2.4] — 2026-09-01
- PATCH bump.
  - skill change (access-declaration)

## [0.2.3] — 2026-09-01
- PATCH bump.
  - hook behavior/enforcement change

## [0.2.2] — 2026-09-01
- PATCH bump.
  - hook behavior/enforcement change

## [0.2.1] — 2026-08-31
- PATCH bump.
  - plugin.json metadata change
  - hook behavior/enforcement change
  - skill change (access-declaration)

## [0.2.0] — 2026-08-31
- `remote.fetch_key`: the fetch tool's path-argument name, required with `fetch_tool` (an argument
  name, never the version key's dotted path); `fetch-incomplete` and `fetch-tool-denied` checks —
  findings that never unresolve a corpus, the deny silent while the pair is incomplete; an unusable
  pair is removed from the row (`clearFetchIfUnusable`, placement after re-resolve is load-bearing
  and mutation-pinned) (F89-ModelFragmentAndRemoteFetch)
- `manifest.hash_key` and `remote.fetch_tool` activated out of "reserved, not read": both now name
  the analytics extension as the consumer that acts on them (schema, template, skill, parser)
- includes the carried F87 version-compare content, unreleased since its 2026-08-30 content commit
  (the program's batch release now owes only the nexus core PATCH)

## [0.1.0] — 2026-08-30

First release — the access declaration becomes a session fact.

The same content can reach an agent through two channels: a local copy committed into the repo and a
remote gateway the agent can call. Nothing owned that choice, so it was made ad hoc, per answer, from
tool descriptions. This plugin gives the choice one owner: a committed file the repo writes,
`.claude/access.yaml`, resolved at session start and injected as a table the agent reads before it
grounds anything.

- **The declaration** — `corpora:` maps a corpus name to its `kind` (`private`, `published`,
  `split`), its local `path`, an optional `manifest` block (`path`, `commit_key`, `hash_key`) naming
  the local copy's version stamp, an optional `remote` block (`server`, `tools`, `version_tool`,
  `fetch_tool`), and an optional `deny` list of tools that must not be callable in the repo.
- **Fail-closed parse** — a dependency-free block-style reader. A missing `corpora:` root, a tab, a
  flow mapping, a duplicate corpus name, an unknown top-level key, or any structural mangling (a
  stray list item, a line that is neither a mapping nor a list entry, an orphan key, an indent
  deeper than the dialect nests, a second `corpora:` root, a `corpora:` root with nothing under it)
  fails the whole file (every corpus unresolved); an unknown key, a corpus name outside the
  documented character class, an unreplaced template placeholder or a wrong value type below that
  fails only its own corpus. Every error names the line it is on. Nothing is guessed and nothing is
  silently ignored.
- **Per-kind safe defaults** — `private` resolves to its local copy and may declare no remote;
  `published` resolves to its declared remote, or falls back to the local copy disclosed as
  currency-unverified; `split` carries both arms and the consuming skill picks per operation. A corpus
  whose requirements are unmet is `unresolved`, with the reason — the agent must refuse to ground from
  it and say so.
- **Session-start conservation check** — every `deny` entry must already be present in
  `permissions.deny` of the project settings, the project-local settings or the user settings, either
  verbatim or covered by a deny glob; a declared remote tool that is itself denied unresolves that
  arm; declared paths must exist and must resolve inside the repo (a path that escapes it is neither
  checked nor read); the local version stamp is read and shown. Findings are disclosed in the
  envelope and on stderr — **no settings file is ever written**.
- **Conditional injection** — the resolved table, the resolver rule and the findings ride this
  plugin's own SessionStart hook, with its own budget under the platform's per-hook output cap and an
  overflow guard that drops table rows from the tail rather than the rule or the marker. No
  declaration file means no output at all; a resumed session re-injects nothing.
- **`--check` mode** — `node "{plugin root}/hooks/scripts/inject-access.js" --check [root]` prints the
  same report as plain text and exits 0 (clean), 1 (findings or an unresolved corpus) or 2 (no
  declaration file).
- **The `access-declaration` skill** — when to use it, the full schema reference, the scaffold recipe
  (values come from the repo owner, never invented), the deny recipe (propose the settings line; edit
  only on confirmation) and the validate recipe.

No version compare runs in this release: a published corpus resolved to its local copy is disclosed as
currency-unverified rather than compared against the remote.
