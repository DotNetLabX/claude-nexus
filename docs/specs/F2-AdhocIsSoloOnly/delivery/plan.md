# F2-AdhocIsSoloOnly — Implementation Plan

**Feature Spec:** None — definition collapsed to ADR-58 (ADR-25 two-way-door; see `docs/architecture/README.md` § ADR-58)

## Context

Owner policy (2026-07-12): work shaped with the PO or designed with the architect — regardless of source — is a **feature** (`F{N}` slug + backlog row); `adhoc-{Name}` is **solo-only**. Bake this into the shipped plugin so every role enforces it. All facts below were grep-grounded at plan time against the live tree.

## Scope

**In scope:** the lane rule in `plugins/nexus/rules/agents-workflow.md`; the shared compact slug line across all 8 agent files; role-specific edits (po, architect, team-lead, solo); command regeneration; MINOR release.
**Out of scope:** retro-renaming existing `adhoc-*` slugs/history; editing mine-family skills' "ad-hoc refactoring lane" wording, and `create-implementation-plan`'s "ad-hoc pass" wording (`SKILL.md:72`, `references/plan-template.md:58-59`) — both explicitly deferred, superseded-on-next-open per ADR-58 Tradeoffs (the Satisfies/done-check mechanism is label-invariant); `BUG-`/`GAP-` conventions; the omni twin sync (deferred, see Step 5 guard). The `docs/backlog.md` header contradiction (ADR-29-era "ratified-only" lifecycle) was fixed at definition close — not deferred.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Lane-rule text + 4 anchored edits in agents-workflow.md | — |
| 2 | (none) | — | no | One identical line ×8 agent files (convergence) | — |
| 3 | (none) | — | no | Role-specific edits: po, architect, team-lead, solo | — |
| 4 | (none) | — | no | `node scripts/gen-commands.mjs nexus` | — |
| 5 | release-plugin | Follow | no | MINOR (owner-escalated); concurrent-tree sequencing guard | |

TDD `no` throughout — prose rule/agent edits plus a regen; the repo lint suite is the gate.

## Domain Model Changes

None.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — The lane rule in `plugins/nexus/rules/agents-workflow.md` (canonical home)

Four anchored edits (line numbers from plan-time grep):
- Line 11 — `- Ad-hoc: `adhoc-{Name}` — e.g., `adhoc-SyncRefactoring`` → append ` (**solo-only** — see the Lane rule below)`.
- After line 15 (the "team lead or PO assigns the slug…" paragraph), insert the binding paragraph:
  > **Lane rule (ADR-58).** Any unit of work **shaped with the PO or designed with the architect — regardless of source** (fresh idea, external or ratified proposal, tracker item, owner directive) — is a **feature**: it takes an `F{N}` (or tracker-key) slug and is **recorded as a row in `docs/backlog.md`** when that file exists. `adhoc-{Name}` is **solo-only**. The moment work outgrows solo — it needs a PO shaping pass or an architect plan — re-slug it as a feature and add the backlog row before the pipeline proceeds. `BUG-{N}` / `GAP-{N}` are unaffected. A feature slug does not force a heavy definition — the technical branch's ADR-collapsed definition (ADR-25/27) still applies.
- Line 30 — `Ad-hoc work has no `definition/` folder — only `delivery/`.` → append ` (solo-only lane — Lane rule above).`
- Line 237 — the persona table's architect row lists "ad-hoc analysis" as an example: reword to "one-off analysis" so the term "ad-hoc" stays reserved for the lane.
- Accept: `grep -n "Lane rule" plugins/nexus/rules/agents-workflow.md` ≥ 2 hits (definition + line-30 backref); `grep -c "solo-only" plugins/nexus/rules/agents-workflow.md` ≥ 2.
- Satisfies: ADR-58 Decision.

### Step 2 — The shared compact slug line, identically, in all 8 agent files

Plan-time grep confirms the line `- **Slug** — assigned by the team lead or PO and passed down; never derive it. Forms: …` at: `agents/team-lead.md:33`, `agents/solo.md:60`, `agents/reviewer.md:118`, `agents/po.md:109`, `agents/learner.md:45`, `agents/critic.md:196`, `agents/developer.md:176`, `agents/architect.md:369`. Replace `` `adhoc-{Name}` `` with `` `adhoc-{Name}` (solo-only — Lane rule, agents-workflow) `` — **byte-identical replacement in all 8** (the lint convergence check covers duplicated vocabulary; a divergent copy fails T1). Do NOT edit `commands/*.md` — Step 4 regenerates them.
- Accept: `grep -rc "solo-only — Lane rule" plugins/nexus/agents/*.md` → exactly 8 files, 1 hit each.
- Satisfies: ADR-58 Decision.

### Step 3 — Role-specific edits (4 files)

- **`plugins/nexus/agents/po.md`** — `## Slug Assignment` section (heading at line 31): add one sentence: work the PO shapes is **never** `adhoc-*` — always a feature/tracker slug, and the PO adds (or updates) the `docs/backlog.md` row when the slug is confirmed, whatever the source (idea, external proposal, ratified proposal).
- **`plugins/nexus/agents/architect.md`** — the `## Feature Spec Workflow` exception block (begins line 131, "**Exception — ad-hoc / refactoring passes have no `spec.md`…"): re-scope its framing from "ad-hoc slugs" to "technical features with an ADR-collapsed definition (ADR-25/27)" — the no-spec machinery (backlog-row-plus-ADR gate, Mode-2-vs-ADR-register critic, ADR-mapping done-check) is **kept verbatim in substance** but now keyed to F-slugged technical features; add the guard: if work arrives for planning under an `adhoc-*` slug, **stop and re-slug** — next free `F{N}` + backlog row (ADR-58) — before Phase 1 proceeds. Keep the section's existing bullets otherwise intact (they are load-bearing for done-checks).
- **`plugins/nexus/agents/team-lead.md`** — the entry decision tree (lines 273–278): collapse the two `Ad-hoc …` branches into one reconciled sub-tree (target shape, resolving the old `spec exists → Architect` / `no spec → PO` legs, which under ADR-58 imply feature status anyway):
  ```
  └── Non-backlog work (no backlog row yet)
        ├── needs PO shaping or an architect plan → assign F{N} + backlog row
        │     (re-slug if it arrived as adhoc-*), then route per the Entry-point rule
        │     (plan exists → Developer; spec Ready → Architect; else → PO)
        └── solo-scoped (small fix, 1–3 files, no plan/spec) → adhoc-{Name}, route to solo
  ```
  The Entry-point rule paragraph (line 281) is unchanged in substance; append one sentence pointing at the Lane rule.
- **`plugins/nexus/agents/solo.md`** — after the compact-reference block (lines 59–62, before `## Message Footer` at 64): add the boundary line: solo owns the `adhoc-*` lane; when work outgrows solo scope (needs a plan, a spec, or multi-service reach), hand it to the team lead/PO for a **feature slug** — never carry an `adhoc-*` slug into the pipeline. **Phrasing caution:** do not use the literal string "solo-only — Lane rule" here — that exact phrase is Step 2's accept-grep anchor and must count exactly 1 per agent file.
- Accept: each file greps for its added anchor phrase (`never.*adhoc` in po.md; `re-slug` in architect.md and team-lead.md; `outgrows solo` in solo.md).
- Satisfies: ADR-58 Decision + Why.

### Step 4 — Regenerate commands

- `node scripts/gen-commands.mjs nexus` (agents changed → commands must ride; the script supports any plugin with an `agents/` dir).
- Accept: `git diff --stat plugins/nexus/commands/` shows the mirrored edits; no hand edits under `commands/`.

### Step 5 — Release (MINOR, owner-escalated) — Follow release-plugin

Follow release-plugin. Feature-specific inputs and guards:
- **Live baseline (re-grounded at plan review, 2026-07-12):** adhoc-MineSkillAuthoring has committed (`1bc68e1`, 1.31.0) and a further release landed (`fb3a37e`, 1.31.1); `plugins/nexus/.claude-plugin/plugin.json` + `CHANGELOG.md` are **clean at 1.31.1**. F2 is the only feature dirtying `plugins/**` → bump is MINOR, **1.31.1 → 1.32.0**, after Steps 1–4. General guard stays: if `node scripts/bump-plugin.mjs --dry-run --minor` lists a reason naming any non-F2 file, **stop and hand the bump to the session owning that feature** (CLAUDE.md release rule) — concurrent sessions are active in this tree.
- Known noise: `scripts/selfcheck.mjs` gen-commands check false-positives while any agent edits are uncommitted — resolves at commit, don't chase.
- omni twin regeneration: deferred by the same dirty-tree condition (established F1 Step-6 guard); record as owed in implementation.md if deferred.
- Accept: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green; bump is MINOR; CHANGELOG entry describes the lane rule; commit = content + bump together, F2-scoped staging only (`git status` re-checked immediately before commit — concurrent sessions are active in this tree).
- Satisfies: ADR-58 (release of the rule to consumers).

## Cross-Service Changes

None.

## Migration Notes

None — consuming repos pick the rule up on `/plugin update`; existing `adhoc-*` folders are grandfathered.

## Testing Strategy

T1 structural lint (frontmatter, convergence of duplicated vocabulary across agent files, CHANGELOG↔plugin.json) is the harness; the Step-2 convergence constraint is the main trap and is lint-covered. Per-step grep gates above.

## KB Impact

None.

## Decisions

| Decision | Why | Rejected alternative | Status |
|----------|-----|----------------------|--------|
| Mine-family "ad-hoc refactoring lane" wording left untouched; superseded on next open (ADR-58 Tradeoffs) | Owner scoped the rule to the lanes, not the mine machinery; smallest shipped diff | Sweep all skills' "ad-hoc" mentions now | decided |
| The compact slug line's annotation is short (`solo-only — Lane rule, agents-workflow`) with the full rule living once in agents-workflow.md | 8 duplicated copies must stay lean and converged | Full rule text repeated per agent | decided |
| Persona-table "ad-hoc analysis" reworded to "one-off analysis" | Reserves the term for the lane; zero semantic change | Leave as-is (harmless but ambiguous) | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (opus, 2026-07-12): **ACCEPT** with 3 MEDIUM findings, all resolved in this revision: Step 5 re-grounded to the live baseline (MineSkillAuthoring committed; plugin clean at 1.31.1 → F2 bumps 1.32.0); the `docs/backlog.md` header lifecycle widened per ADR-58 (its own F2 row had contradicted it); the team-lead decision-tree rewrite now carries the target sub-tree sketch; `create-implementation-plan`'s "ad-hoc pass" wording added to Out of Scope as an explicit deferral; Step 2's accept-grep phrasing caution added to the solo.md edit. The critic confirmed: all 12 line anchors exact; the convergence lint does whole-block byte comparison (Step 2's identical ×8 edit keeps it green, baseline 5/5); no lint compares command content to agents (Step 4's regen is the only content guarantee, backed by selfcheck + CI); ADR-58 is consistent with ADR-25/27/29 as written.
