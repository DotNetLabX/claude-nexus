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
node scripts/bump-plugin.mjs --dry-run   # print the proposed PATCH bump + reasons, change nothing
node scripts/bump-plugin.mjs             # apply: PATCH-bump plugin.json + prepend CHANGELOG (no commit)
node scripts/bump-plugin.mjs --minor     # apply, escalated to MINOR (new capability)
node scripts/bump-plugin.mjs --major     # apply, escalated to MAJOR (breaking / behavior reversal)
node scripts/bump-plugin.mjs --check     # CI: exit 1 if a shipped-file change has NO bump
```

Always run `--dry-run` first, read the reasons, then apply — adding `--minor`/`--major` only when the
owner says the change is bigger than a patch.

## Procedure

```
0. PRECONDITION   .claude-plugin/marketplace.json present? If not → no-op, say so.

1. CLASSIFY       node scripts/bump-plugin.mjs --dry-run
                  Shows which plugins changed + the proposed PATCH bump + one-line reasons.
                  This is the EVALUATION — surfaced, not silent.

2. JUDGMENT       Default is PATCH. The OWNER decides if the change is bigger:
                  MINOR for a new user-facing capability, MAJOR for a breaking change or a
                  reversal of documented behavior. The tool never auto-escalates by file type.
                  When unsure, ASK the owner — don't silently pick a higher tier.

3. BUMP           node scripts/bump-plugin.mjs            (PATCH — the default)
                  node scripts/bump-plugin.mjs --minor    (owner escalates: new capability)
                  node scripts/bump-plugin.mjs --major    (owner escalates: breaking / reversal)
                  Applies plugin.json + CHANGELOG.md, then edit the generated CHANGELOG entry
                  to describe the actual change (the stub line is just a placeholder).

4. REGENERATE     If any agents/*.md changed:  node scripts/gen-commands.mjs {plugin}
                  (commands are generated from agents; stage the regenerated commands too.)

5. SYNC TWIN      node scripts/gen-omni.mjs   (omni mirrors nexus file CONTENTS, so the
                  bumped plugin.json + CHANGELOG ride along — no separate omni bump.
                  Run AFTER the bump. Skip if the omni target isn't present locally.)
                  Then VERIFY: node scripts/gen-omni.mjs --check   (exit 0 = twin in sync;
                  exit 1 lists drift — a forgotten regen is exactly how the twin silently
                  diverges, so the check is part of the flow, not optional.)

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

## Versioning policy (semver — PATCH-default, owner escalates)

The install cache is **version-keyed**, so *any* bump — including a PATCH — reaches users on
`/plugin update`. "Must reach users" therefore never forces a higher tier; it only means a shipped
change must bump **something**. The tier reflects the **semantic size** of the change, and that is the
**owner's** call, not the file type:

- **PATCH** — the default the tool proposes for *every* shipped-file change (`agents/`, `rules/`,
  `hooks/`, `commands/`, `skills/`, `plugin.json` metadata, runtime config). Bug fixes, wording,
  tightening, behavior tweaks that stay within intent.
- **MINOR** (`--minor`) — owner's call: a **new user-facing capability** (new agent, new skill, new
  config) that is purely additive.
- **MAJOR** (`--major`) — owner's call: a **breaking change** or a **reversal of documented behavior**
  (e.g. flipping a default the docs commit to).

What gets **no bump**: `docs/**`, top-level `README.md`, a plugin's own `CHANGELOG.md`, `scripts/*`,
comments — nothing a running session loads. A **version-only** `plugin.json` diff is the bump itself,
not a change.

The tool **never auto-escalates by file type.** (It used to floor agents/hooks/security at MAJOR, which
produced a major on nearly every edit — removed.) It proposes PATCH and, in `--check`, only verifies
that *a* bump exists; the owner adds `--minor`/`--major` when the change warrants it. Versions live only
in `plugin.json` (marketplace entries stay version-less, so `claude plugin tag`'s version-agreement
check is trivially satisfied).

## Multi-plugin

Classify **per plugin**. A change touching only `nexus-dotnet/` bumps only `nexus-dotnet`;
only `nexus/` bumps only `nexus`. When a `nexus` **major** ships and `nexus-dotnet` declares a
**bare** `nexus` dependency, dotnet users get it with no dotnet bump — `bump-plugin.mjs` will
note this; if `nexus-dotnet` ever pins a constraint (`{ "name": "nexus", "version": "^N" }`),
crossing it forces a `nexus-dotnet` bump too (dependency-change = MAJOR).

## New-plugin ship checklist

A **brand-new** plugin (first release, `0.1.0`) trips four wiring surfaces the per-file bump flow
doesn't cover — treat them as one unit, verified before the release commit:

1. **Don't re-bump the authored version.** `bump-plugin.mjs` sees the whole new folder as changed
   and proposes `0.1.0 → 0.1.1` plus a CHANGELOG stub — revert to the authored `0.1.0` and keep the
   hand-written CHANGELOG; `--check` does not catch this.
2. **Both `gen-omni.mjs` sites** — the mirror-dir mapping AND the marketplace `wantPlugins` array;
   one without the other ships a half-wired twin.
3. **Both `tests/unit/gen-omni.test.mjs` sites** — the synthetic sandbox's `before()` seed AND the
   `deepEqual` expectation; a new plugin crashes the fixture (ENOENT) if unseeded. Same class:
   any hard-coded registry a shared script carries (e.g. `gen-commands.mjs`'s role map) — run the
   script against the new plugin at authoring time, don't assume the pattern generalizes.
4. **Shipped toolchain assets reference the SKILL.md**, never dev-repo `delivery/` paths —
   neutralize comment references when copying templates/Dockerfiles into the plugin folder.

## What this skill does NOT do

- Commit for you — it leaves the edits staged-ready; you commit them with the change.
- Bump a consuming project — only the plugin repo.
- Ship anything into consumer-facing agents — it is a dev-repo tool, invoked directly when
  developing the plugin, not wired into the pipeline personas.
- Push tags without confirmation.
