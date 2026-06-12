# adhoc-DotnetSkillSweep — Implementation Plan

**Feature Spec:** None (ad-hoc pass — binding input is the Phase-1 analysis in this plan's Context, ADR-23, and the owner's directive of 2026-06-12).
**Scope decisions (owner, 2026-06-12):** convergent pass — improve the existing 26 .NET skills; capability gaps found by research land as a proposal, nothing new is built this pass. Review mode: **code-grounded critic** (mandatory for shipped-skill edits).
**Reference repo:** `D:\src\dotnet-microservices` (read-only; owner-confirmed). Last commit 2026-04-22 — the skills (last touched 2026-06-04) postdate it, so drift risk is low but per-skill grounding stays in scope.
**Release shape:** one release at the end — fix everything, verify, ship once. Tier proposed by `bump-plugin.mjs` (PATCH default); owner decides escalation to MINOR given the 26-skill breadth.
**Review:** critic Mode 2 (fresh context, code-grounded) — verdict **REVISE**, 2 HIGH / 2 MEDIUM / 1 LOW, no CRITICAL; **all findings applied in this revision** (markers "critic {ID}" inline). Review record: `delivery/plan-review.md`.

---

## Context

The nexus-dotnet skill estate (32 skills) predates the ADR-23 quality system: every skill was last substantively touched 2026-06-04, before `skill-lint` (1.6.0), the proven-patterns catalog, and `evaluate-skill` (1.7.0) shipped. None has been through the rubric. Phase-1 facts (grep/lint-verified 2026-06-12):

- **Lint (Layer 0): 30/32 clean.** Failures: `persistence-patterns`, `redis-patterns` — `<T>` angle-bracket token in prose.
- **No dangling references** — every `workflows/`/`references/` citation resolves: 40 companion docs under `workflows/`+`references/`, plus 5 per-skill `CHANGELOG.md` (counts corrected per critic HIGH-2).
- **Two format shapes coexist, both legitimate:** thin SKILL.md + `workflows/` (scaffolders, e.g. `create-feature`, 86 lines + 6 workflow files) and monolithic pattern files (e.g. `service-registration`, 240 lines). Counts are `wc -l` (the original figures measured non-blank lines only — critic HIGH-2). Inconsistencies live *within* shapes: 5 skills carry per-skill `CHANGELOG.md` (most don't), only `vue-patterns` uses `references/`, description/trigger quality varies, and genericization/legibility artifacts remain — `add-integration-event` ships an empty project-specific events table keyed on `{ProjectName}`, and `service-registration`'s body opens by duplicating its frontmatter description verbatim (critic MEDIUM-2; representative Batch-B reformat targets).
- **Reference repo matches the skills' stack claims:** FastEndpoints + Carter + Minimal APIs, MediatR, MassTransit, Redis.OM, gRPC code-first; `Modules` + `Services` + `BuildingBlocks` + `ApiGateway` layout.
- **Zero .NET testing skills** (core `tdd` is process-only) — expected to head the gap list.
- **Prior methodology exists:** `D:\src\temp-skills-eval\SKILL_RESEARCH.md` (Flutter round, 2026-05-13) — sources → overlap map → gap table → validate-against-code → side-by-side → merge. The external sweep clones this shape.

## Scope

**In scope (26 .NET skills):**
add-integration-event, add-pipeline-behavior, analytics-computation-service, authorization-patterns, central-package-management, cqrs-patterns, create-aggregate, create-building-blocks-package, create-domain-event-handler, create-feature, create-grpc-contract, create-module, create-module-claude-md, create-service, create-service-claude-md, domain-patterns, domain-service, error-handling, extract-endpoint-types, extract-feature-service, framework-currency, improve-architecture, persistence-patterns, redis-patterns, service-registration, system-design.

**Out of scope:** the 6 frontend skills (create-vue-feature, frontend-review, pinia-patterns, tailwind-theme, vue-component-architecture, vue-patterns) — same machinery, later pass, needs its own reference-repo decision (they reference a `client/` project that is not dotnet-microservices). Building new skills (gaps → proposal only). Skill **renames** — `name:` is a consumer-facing invocation contract; renames are breaking and excluded from a convergent pass. `plugins/nexus` core skills. Conventions files (`conventions/*.md`) except where an eval finding names one explicitly — log, don't drift into them.

**Binding surfaces:** skill folder names and frontmatter `name:` fields (consumers invoke by name — frozen this pass). Everything else — descriptions, body structure, `workflows/`/`references/` layout, per-skill CHANGELOGs — is improvable within lint constraints.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 0 | (none — operator gate) | — | no | Commit the in-flight 1.0.3 release; accept = clean `plugins/nexus-dotnet/**` tree | |
| 1 | (none — research) | — | no | Sources + output shape inline; executed with OMC research agents per owner | Research process; no skill candidate — one-off |
| 2 | evaluate-skill | Follow | no | 26 skills, 5 family batches, grounding repo path, evidence caveat | |
| 3 | (none — synthesis) | — | no | Disposition vocabulary + estate-wide normalization decisions inline | Log to lessons.md |
| 4 | improve-skills | Follow | no | Per-family batches, disposition.md as input, consolidation constraints | |
| 5 | (none — verification grep) | — | no | Exact greps + lint sweep inline | |
| 6 | (none — proposal doc) | — | no | Output path + required sections inline | |
| 7 | release-plugin | Follow | no | Plugin name, tier proposal, twin sync | |
| 8 | (none — independent review) | — | no | Reviewer dispatch contract inline | |

TDD is `no` throughout — every step produces markdown artifacts; the deterministic gate is `skill-lint` (Steps 4–5), not tests.

## Domain Model Changes

None — documentation/plugin-content pass.

## Data Model Changes

None.

## Implementation Steps

### Step 0 — Baseline gate (OPERATOR ACTION REQUIRED — critic HIGH-1)

The currently staged `nexus-dotnet` change is a **complete in-flight release** (1.0.2 → 1.0.3: plugin.json + CHANGELOG + conventions/csharp.md). `node scripts/bump-plugin.mjs --dry-run` already attributes a 1.0.4 PATCH to that csharp.md change — if it is still uncommitted at Step 7, the sweep release would conflate two logical releases under one version and one CHANGELOG entry (verified live by the critic, 2026-06-12).

The owner commits the in-flight 1.0.3 release before any Step-4 edit. Steps 1–3 are read-only and may start immediately.

**Accept:** `git status --short` shows no staged or modified files under `plugins/nexus-dotnet/**` at the moment Step 4 begins; `node scripts/bump-plugin.mjs --dry-run` at that moment reports no pending nexus-dotnet change attributable to anything but the sweep.

### Step 1 — External research sweep → `delivery/research-external.md`

No skill (research process). Executed with OMC research agents (owner's choice) or equivalent web/document research capability if those agents are unavailable in the executing context — the mandate is capability-level, not tool-name-level (critic MEDIUM-1). Parallel web/document agents; judgment and synthesis stay with the executing lead.

Clone the Flutter round's methodology (`D:\src\temp-skills-eval\SKILL_RESEARCH.md`):
1. **Find external .NET/C# Claude Code skill packages.** Sources, minimum set: GitHub topic/code search (`claude skills` + dotnet/csharp/aspnetcore), `awesome-claude-skills`, claudemarketplaces.com / skillsmp.com / skillhub.club, any official Microsoft/.NET-team skills, the `everything-claude-code` collection. Record install source per package.
2. **Clone the 3–6 most credible packages** to `D:\src\temp-skills-eval\dotnet\` (keep the Flutter content untouched).
3. **Produce the artifact** with these sections: per-package skill tables; **overlap map** vs our 26 (HIGH/MEDIUM/none per pair); **gap table** (capability, best source, priority); **form findings** — structure/trigger/disclosure conventions the best externals use that ours lack (this feeds Step 3's normalization decisions, and is the half of external value that survives even if external content is shallow).

**Accept:** `research-external.md` exists with all four sections; every overlap/gap row cites a concrete external skill (repo + path); a one-line credibility note per package (stars/maintainer/recency).

### Step 2 — Internal evaluation: Follow `evaluate-skill` × 26 → `docs/skill-evals/`

Follow `evaluate-skill` for each of the 26 in-scope skills, batched by family so family norms are judged consistently:

| Batch | Family | Skills |
|-------|--------|--------|
| A | Scaffolders (workflows-shape) | add-integration-event, create-aggregate, create-building-blocks-package, create-domain-event-handler, create-feature, create-grpc-contract, create-module, create-module-claude-md, create-service, create-service-claude-md |
| B | Pattern references (monolithic) | authorization-patterns, cqrs-patterns, domain-patterns, error-handling, persistence-patterns, redis-patterns, service-registration |
| C | Extract/refactor | add-pipeline-behavior, extract-endpoint-types, extract-feature-service |
| D | Domain computation | analytics-computation-service, domain-service |
| E | Architect/process | central-package-management, framework-currency, improve-architecture, system-design |

Feature-specific inputs the skill can't know:
- **Channel (ADR-1 dev-repo carve-out):** these are shipped plugin skills, but this repo is the canonical source — the skills' "shipped → feedback file, never edit" rule is the *consuming-project* path; in the dev repo a direct fix IS the canonical channel (ADR-1: "project surfaces a gap → fix in the plugin repo"). Cite "ADR-1 dev-repo carve-out" in each eval doc so a reviewer doesn't read direct edits as a contract violation (critic Note A).
- **Grounding evidence:** verify each skill's factual claims (type names, package names, folder shapes, framework calls) against `D:\src\dotnet-microservices` (read-only). Run evidence is scarce — these skills execute in consuming projects — so most verdicts judge the *spec* against the *reference code*; state that caveat per the skill's own rule.
- **Layer 0 pre-result:** lint already run estate-wide — only `persistence-patterns` and `redis-patterns` fail (`<T>` in prose); record per skill, don't re-litigate.
- Findings docs: `docs/skill-evals/2026-06-{DD}-{skill-name}.md`, one per skill (the skill's standard; thin skills get thin docs).

**Accept:** 26 findings docs exist, each with severity-rated findings, a verdict (ACCEPT / fix-then-accept / rework), and rubric items checked clean; every factual-claim finding cites the dotnet-microservices path it was checked against.

### Step 3 — Synthesis: disposition table → `delivery/disposition.md` (USER CHECKPOINT)

No skill (plan-level judgment). Merge Step 1 + Step 2 into one decision artifact:

1. **Per-skill disposition:** `keep` / `reformat` (structure only) / `rewrite` (content defects) / `merge` (name the absorbing skill) / `retire` (name the migration note). Each row cites its findings doc and, where external comparison informed it, the external skill.
2. **Estate-wide normalization decisions**, each with before/after: per-skill CHANGELOG policy (keep on all? drop to git history?); `workflows/` vs `references/` naming convention; description/trigger phrasing standard (when-to-use form per ADR-23 born-compliant rules); frontmatter field standard (`user-invocable`, `disable-model-invocation` decisions per family); fate of genericization artifacts (e.g. `add-integration-event`'s empty events table — registry tables belong to consuming projects, not shipped skills; confirm or refute per family).
3. **Anything touching a conventions file or a core-nexus skill** is listed under "routed out" — not executed this pass.

**STOP after writing: present the disposition table to the user for approval before Step 4.** `merge`/`retire` verdicts and every normalization decision are owner calls — assume none.

**Accept:** disposition.md has all 26 rows + the normalization section; no row's disposition contradicts its findings doc without a stated reason; user approval recorded (date + any overrides) before any Step-4 edit.

### Step 4 — Apply: Follow `improve-skills`, one consolidating batch per family

Follow `improve-skills` for the approved dispositions, batched A–E as in Step 2. Feature-specific inputs:
- Input per batch: the approved `disposition.md` rows + the per-skill findings docs.
- Consolidating constraint: net complexity flat or down — reformat means restructure, never append; a fix that grows a skill needs a one-line justification in the batch note.
- Includes the two known lint fixes (`<T>` → `{T}`-style or fenced) in batch B.
- Write path: Write tool, UTF-8 no BOM (the measured BOM incident class — improve-skills owns this rule; cited here because shell redirection is the tempting path for 26 files).
- **Per-batch done-condition:** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs <folder>` exits 0 for every skill touched in the batch.

**Accept:** all approved dispositions applied; per-batch lint exit 0; no skill folder renamed; no `conventions/*.md` modified.

### Step 5 — Estate-wide conformance sweep

No skill (deterministic verification). After all batches:
1. Lint all 32 skill folders (the 6 Vue skills must still pass untouched — proves no collateral edits): exit 0 × 32.
2. `grep -rn "Adapt" docs/specs/adhoc-DotnetSkillSweep/delivery/disposition.md` — zero disposition rows invented an "adapt" verdict.
3. Frontmatter sweep: every in-scope SKILL.md `name:` equals its folder name; description matches the Step-3 phrasing standard (spot-grep the standard's signature phrase).
4. Diff review: `git diff --stat` touches only `plugins/nexus-dotnet/skills/**` and the pass's own `docs/` artifacts.

**Accept:** all four checks pass; output pasted into implementation.md.

### Step 6 — Gap/adoption proposal → `docs/proposals/dotnet-skill-adoptions-2026-06.md`

No skill. Convert Step 1's gap table + any Step-2 finding of class "missing capability" into a proposal doc (same genre as the existing `docs/proposals/` entries): per-gap — capability, best external source, what adoption would look like (new skill vs extension of an existing one), priority, and proposed slug for a future pass. Expected to be headed by .NET testing skills (zero today).

**Accept:** proposal exists; every entry traces to a research-external.md or skill-eval citation; no entry was implemented this pass.

### Step 7 — Release: Follow `release-plugin`

Follow `release-plugin` for `nexus-dotnet`. Feature-specific inputs:
- Tier: tool proposes PATCH; breadth (26 skills) is the owner's stated ground for escalating to `--minor` — owner decides at the prompt.
- `--note` summary: "dotnet skill estate sweep — rubric evaluation, format normalization, genericization fixes (ADR-23)".
- After bump: `node scripts/gen-omni.mjs` (twin rides along), `claude plugin validate --strict` for nexus-dotnet, exit 0. No gen-commands (nexus-dotnet ships no `agents/`).
- **One commit**: skill edits + bump + CHANGELOG + the pass's docs/ artifacts. Eval/research docs are dev-repo content and may ride in the same commit (no separate bump applies to `docs/**`).

**Accept:** clean tree after one release commit; validate exit 0; CHANGELOG top entry matches plugin.json version.

### Step 8 — Independent verification (post-implementation)

No skill. Writer/reviewer separation (the pass edits shipped skills — doc-only review is insufficient by ADR evidence):
- Spawn a **fresh-context, code-grounded reviewer** over the full diff with `disposition.md` as the checklist: every row marked applied / deviated-with-reason / missing; spot-verify 5+ grounding claims directly against `D:\src\dotnet-microservices`; re-run the estate lint independently.
- Findings route through the normal fix cycle (max 3) before the pass closes.

**Accept:** reviewer verdict APPROVED with zero unresolved CRITICAL/HIGH; verdict + evidence table written to `delivery/review.md` (`## Step 2 — Code Review` section).

## Cross-Service Changes

None.

## Migration Notes

None — no consumer-visible contract changes (skill names frozen; description/body changes are additive behavior improvements delivered by the version bump).

## Testing Strategy

The deterministic gate is `skill-lint` (per-batch in Step 4, estate-wide in Step 5) plus `claude plugin validate --strict` (Step 7). Judgment-layer quality is gated by Step 3's user checkpoint and Step 8's independent code-grounded review. No runtime tests apply (markdown payload).

## KB Impact

None — this repo has no `docs/kb/`. The pass's durable records are the skill-eval docs, disposition.md, and the adoption proposal.

## Open Questions

None — both scope forks (gap handling, review mode) were resolved by the owner at the Phase-1 checkpoint (2026-06-12). The Step-3 checkpoint intentionally re-engages the owner on per-skill dispositions; that is by design, not an open question.

## Plan Review

Critic Mode 2 (fresh context, code-grounded), 2026-06-12 — verdict **REVISE**; full record in `delivery/plan-review.md`. All findings applied in this revision:
- **HIGH-1** → Step 0 baseline gate with checkable accept criteria (live `bump-plugin.mjs --dry-run` collision evidence).
- **HIGH-2** → Context counts corrected: `create-feature` 86 lines, `service-registration` 240 (`wc -l`; originals measured non-blank lines only), 40 workflow/reference docs + 5 CHANGELOGs.
- **MEDIUM-1** → Step 1 mandate made capability-level (OMC agents or equivalent).
- **MEDIUM-2** → `service-registration` description-duplication added as a named Context example for Batch B.
- **LOW-1** → rolled into HIGH-2.
- **Note A** (not a finding) → Step 2 channel note now cites the ADR-1 dev-repo carve-out explicitly.
Cross-reference matrix: all binding inputs COVERED post-revision (the two PARTIALs were HIGH-1/HIGH-2, both closed).
