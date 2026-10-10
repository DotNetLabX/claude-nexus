---
name: release-plugin
description: Decides and applies the version bump when this marketplace repo's plugin files change, in the same commit as the change, then validates. Owns the ADR-9 release flow. A dev-repo tool — invoke it directly when developing the plugin; it no-ops outside the plugin repo and is not wired into the shipped agents.
---

# Release Plugin

Whenever a change touches a plugin's shipped files (`plugins/{name}/**`), the plugin's
`version` **must** be bumped **in the same commit** — the install cache is version-keyed, so
an un-bumped change never reaches users (`/plugin update` is a no-op), and a bumped one reaches
them at the next publish. This skill owns that: it classifies the change, bumps the right
plugin(s), writes the CHANGELOG and validates.

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
node scripts/bump-plugin.mjs --tier nexus=major   # apply, MAJOR for that one plugin only; repeatable
node scripts/bump-plugin.mjs --check     # CI: exit 1 if a shipped-file change has NO bump
```

Its measuring sibling is `scripts/estate-delta.mjs`, which owns the shipped-prose byte baseline the
bump consults before it will run (step 4 below).

Always run `--dry-run` first, read the reasons, then apply — adding `--minor`/`--major` only when the
owner says the change is bigger than a patch. `--tier <plugin>=<patch|minor|major>` sets one plugin's
tier and applies only when that plugin has a change (otherwise the run says it ignored the flag); it
cannot be combined with `--minor`/`--major`, and naming a plugin twice or one the marketplace does not
list is refused.

Two `--check` readings that look like bugs and aren't — both follow from `--check` being
**base-ref-scoped** (default `origin/main`): it is silent about uncommitted working-tree changes
(`--dry-run` is the working-tree classifier; `--check` is the CI backstop over commits), and run
over a tree whose edits — including a just-applied, not-yet-committed bump — sit outside the
committed range, its "no plugin behavior-surface changes detected" message with exit 0 is the
**pass signal**, not a failed detection.

## Procedure

```
0. PRECONDITION   .claude-plugin/marketplace.json present? If not → no-op, say so.

1. CLASSIFY       node scripts/bump-plugin.mjs --dry-run
                  Shows which plugins changed + the proposed PATCH bump + one-line reasons.
                  This is the EVALUATION — surfaced, not silent.
                  The dry-run also prints the estate delta: file count, bytes against HEAD
                  and against the recorded charter sizes, and how many files grew.

2. JUDGMENT       Default is PATCH. The OWNER decides if the change is bigger:
                  MINOR for a new user-facing capability, MAJOR for a breaking change or a
                  reversal of documented behavior. The tool never auto-escalates by file type.
                  When unsure, ASK the owner — don't silently pick a higher tier.

3. REGENERATE     If any agents/*.md changed:  node scripts/gen-commands.mjs {plugin}
                  (commands are generated from agents; stage the regenerated commands too.)
                  If a shared include SOURCE changed — rules/on-demand/codex-dispatch.md,
                  rules/on-demand/agents-workflow.md, agents/team-lead.md — run
                  node scripts/gen-agent-includes.mjs FIRST, then gen-commands: the expanded
                  agents are what the commands are generated from.

4. MEASURE        node scripts/estate-delta.mjs --write                      (nothing grew)
                  node scripts/estate-delta.mjs --write --reason "{why}"     (a file GREW)
                  Rewrites tests/fixtures/estate-size-baseline.json so it records the tree the
                  bump is about to classify. Runs AFTER step 3 — the generators rewrite bytes
                  inside the very files this measures, so a baseline written before them is
                  stale. Growth is legal with a recorded reason; a shrink needs none.

5. BUMP           node scripts/bump-plugin.mjs            (PATCH — the default)
                  node scripts/bump-plugin.mjs --minor    (owner escalates: new capability)
                  node scripts/bump-plugin.mjs --major    (owner escalates: breaking / reversal)
                  node scripts/bump-plugin.mjs --tier {plugin}=major   (one plugin only)
                  Applies plugin.json + CHANGELOG.md, then edit the generated CHANGELOG entry
                  to describe the actual change (the stub line is just a placeholder).
                  A stale baseline, or a file that grew with no recorded reason, REFUSES the
                  bump — go back to step 4 rather than editing the fixture by hand.
                  A refusal from CI is measured against a RANGE, not HEAD, so repair it against
                  the base the refusal names: estate-delta.mjs --write --base {base} --reason
                  (a plain --write sees no raise there and would stamp nothing).

6. NO SYNC        Nothing is regenerated here. Every published repository, the omni edition
                  included, is regenerated at the owner's publish (scripts/publish.mjs, in the
                  plugin source repo only) — so a bump leaves them lagging by design, and no
                  generator --check is expected green mid-cycle. The bumped plugin.json +
                  CHANGELOG ride along at that publish — no separate omni bump.

7. VALIDATE       claude plugin validate plugins/{name} --strict   (per changed plugin)

8. SAME-COMMIT    Stage the content edits AND the bumped plugin.json AND CHANGELOG.md AND any
                  regenerated commands AND tests/fixtures/estate-size-baseline.json TOGETHER,
                  and commit as ONE commit. The bump must never land in a separate follow-up
                  commit — that is the exact failure this skill prevents.

9. DO NOT TAG     Do not tag a release: a plugin version tag pins every user of a plugin that
                  depends on it to that version, so no repository carries one.
```

## Versioning policy (semver — PATCH-default, owner escalates)

The install cache is **version-keyed**, so *any* bump — including a PATCH — reaches users at the
next publish. "Must reach users" therefore never forces a higher tier; it only means a shipped
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
that *a* bump exists; the owner adds `--minor`/`--major` (or `--tier` for one plugin) when the change warrants it. Versions live only
in `plugin.json` (marketplace entries stay version-less).

## Multi-plugin

Classify **per plugin**. A change touching only `nexus-dotnet/` bumps only `nexus-dotnet`;
only `nexus/` bumps only `nexus`. When a `nexus` **major** ships and `nexus-dotnet` declares a
**bare** `nexus` dependency, dotnet users get it with no dotnet bump — `bump-plugin.mjs` will
note this; if `nexus-dotnet` ever pins a constraint (`{ "name": "nexus", "version": "^N" }`),
crossing it forces a `nexus-dotnet` bump too (dependency-change = MAJOR).

**Mixed tiers across plugins are one run with `--tier`.** `--minor` / `--major` is a **global**
override — it applies the one tier to every plugin the run classifies — so running it over both
plugins over-bumps the one that only earned a PATCH. Name the escalated plugin instead: "nexus PATCH +
nexus-dotnet MINOR" is `node scripts/bump-plugin.mjs --tier nexus-dotnet=minor`, and every other
changed plugin keeps the PATCH default.

## New-plugin ship checklist

A **brand-new** plugin (first release, `0.1.0`) trips three wiring surfaces the per-file bump flow
doesn't cover — treat them as one unit, verified before the release commit:

1. **The authored version ships as written.** A plugin absent at HEAD is not bumped:
   `bump-plugin.mjs` says so on the dry-run ("new plugin (absent at HEAD) — first release ships at its
   authored version; no bump") and leaves `plugin.json` and the hand-written CHANGELOG alone. Author
   both before the release run.
2. **The publish list** — add the plugin to `scripts/publish-list.json` and give its target
   `publish/{target}/README.md` and `LICENSE`. Same class:
   any hard-coded registry a shared script carries (e.g. `gen-commands.mjs`'s role map) — run the
   script against the new plugin at authoring time, don't assume the pattern generalizes.
3. **Shipped toolchain assets reference the SKILL.md**, never dev-repo `delivery/` paths —
   neutralize comment references when copying templates/Dockerfiles into the plugin folder.

## What this skill does NOT do

- Commit for you — it leaves the edits staged-ready; you commit them with the change.
- Bump a consuming project — only the plugin repo.
- Ship anything into consumer-facing agents — it is a dev-repo tool, invoked directly when
  developing the plugin, not wired into the pipeline personas.
