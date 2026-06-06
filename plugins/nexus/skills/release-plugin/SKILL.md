---
name: release-plugin
description: Decides and applies the version bump when this marketplace repo's plugin files change, in the same commit as the change, then validates and (on publish) tags. Owns the ADR-9 release flow. A dev-repo tool — invoke it directly when developing the plugin; it no-ops outside the plugin repo and is not wired into the shipped agents.
---

# Release Plugin

Whenever a change touches a plugin's shipped files (`plugins/{name}/**`), the plugin's
`version` **must** be bumped **in the same commit** — the install cache is version-keyed, so
an un-bumped change never reaches users (`/plugin update` is a no-op). This skill owns that:
it classifies the change, bumps the right plugin(s), writes the CHANGELOG, validates, and —
when publishing — tags.

**Precondition (stack-agnostic).** Only run in the plugin repo — the one with
`.claude-plugin/marketplace.json` at its root. In a consuming project there is nothing to
version; the skill (and `bump-plugin.mjs`) **no-op**. Don't bump a project that merely
*installs* the plugin.

## The engine: `scripts/bump-plugin.mjs`

The deterministic work (detect changed plugins, classify, edit `plugin.json` + `CHANGELOG.md`)
lives in `scripts/bump-plugin.mjs`. You orchestrate it and apply judgment where the policy
allows a downgrade.

```
node scripts/bump-plugin.mjs --dry-run   # print the classification + proposed bump, change nothing
node scripts/bump-plugin.mjs             # apply: bump plugin.json + prepend CHANGELOG (does NOT commit)
node scripts/bump-plugin.mjs --check     # CI: exit 1 if a behavior-surface change has no bump
```

Always run `--dry-run` first, read the reasons, then apply.

## Procedure

```
0. PRECONDITION   .claude-plugin/marketplace.json present? If not → no-op, say so.

1. CLASSIFY       node scripts/bump-plugin.mjs --dry-run
                  Read the per-plugin tier + one-line reasons. This is the EVALUATION —
                  surfaced, not silent.

2. JUDGMENT       The script escalates anything it can't prove additive (see Policy).
                  You may DOWNGRADE an "existing skill edit" from major→minor ONLY if the
                  edit is provably additive (new optional section / clarified step, no
                  changed contract). State why. Never downgrade agents/rules/hooks/
                  *-format/security — those are major floors. Never escalate below what
                  the script reports.

3. BUMP           node scripts/bump-plugin.mjs   (applies plugin.json + CHANGELOG.md)
                  For a downgrade, edit the version by hand to the lower tier and fix the
                  CHANGELOG entry to match, noting the additive justification.

4. REGENERATE     If any agents/*.md changed:  node scripts/gen-commands.mjs {plugin}
                  (commands are generated from agents; stage the regenerated commands too.)

5. SYNC TWIN      node scripts/gen-omni.mjs   (omni mirrors nexus file CONTENTS, so the
                  bumped plugin.json + CHANGELOG ride along — no separate omni bump.
                  Run AFTER the bump. Skip if the omni target isn't present locally.)

6. VALIDATE       claude plugin validate plugins/{name} --strict   (per changed plugin)

7. SAME-COMMIT    Stage the content edits AND the bumped plugin.json AND CHANGELOG.md AND any
                  regenerated commands TOGETHER, and commit as ONE commit. The bump must never
                  land in a separate follow-up commit — that is the exact failure this skill
                  prevents.

8. TAG (publish)  Only when publishing a release, from inside plugins/{name}/:
                  claude plugin tag --push   → creates {name}--v{version}.
                  Requires a clean tree (step 7 committed first) and re-validates. Pushing
                  tags is outward-facing — confirm with the user before --push unless the
                  release driver is pre-authorized.
```

## Versioning policy (semver — MAJOR-leaning)

The payload is **agent behavior** and the cache is **version-keyed**, so the question is:
*must installed users re-pull to get correct behavior?* If yes → at least MINOR, and since
almost everything here changes behavior, **MAJOR is the default**. The only way to skip a bump
is to prove the change never reaches a running session.

| Change | Tier |
|--------|------|
| `agents/*.md` body, `rules/*.md`, `hooks/**`, `.mcp.json`/`.lsp.json`/`settings.json`, `commands/**` | **MAJOR** |
| Security guard (`guard.js`, `pipeline-gate.js`, `security_mode`) | **MAJOR** (floor — never less) |
| `*-format` skill (machinery parses the shape) | **MAJOR** |
| `dependencies` change; command rename/removal | **MAJOR** |
| New agent | **MAJOR** |
| New non-format skill | **MINOR** (purely additive) |
| Additive edit to an existing non-format skill (no contract change) | **MINOR** (judgment — else MAJOR) |
| Discovery metadata in `plugin.json` (description/keywords/userConfig) | **MINOR** |
| Bug fix moving behavior toward the *unchanged* intended contract | **PATCH** (rare) |
| `docs/**`, top-level `README.md`, `CHANGELOG.md`, comments, `scripts/*` (unchanged output) | **none** (no bump) |

Rules: **highest tier wins**; **ambiguity escalates, never de-escalates**; **security never
de-escalates**. Versions are kept only in `plugin.json` (marketplace entries stay version-less,
so `claude plugin tag`'s version-agreement check is trivially satisfied).

## Multi-plugin

Classify **per plugin**. A change touching only `nexus-dotnet/` bumps only `nexus-dotnet`;
only `nexus/` bumps only `nexus`. When a `nexus` **major** ships and `nexus-dotnet` declares a
**bare** `nexus` dependency, dotnet users get it with no dotnet bump — `bump-plugin.mjs` will
note this; if `nexus-dotnet` ever pins a constraint (`{ "name": "nexus", "version": "^N" }`),
crossing it forces a `nexus-dotnet` bump too (dependency-change = MAJOR).

## What this skill does NOT do

- Commit for you — it leaves the edits staged-ready; you commit them with the change.
- Bump a consuming project — only the plugin repo.
- Ship anything into consumer-facing agents — it is a dev-repo tool, invoked directly when
  developing the plugin, not wired into the pipeline personas.
- Push tags without confirmation.
