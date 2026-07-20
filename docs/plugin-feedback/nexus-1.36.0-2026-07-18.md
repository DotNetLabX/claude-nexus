# Nexus plugin feedback — v1.36.0 — 2026-07-18

Portable feedback file (ADR-1). Plugin-bound items targeting the version-keyed plugin cache; apply in
the plugin source repo.

Source project: knowledge-gateway. Evidence: the 2026-07-18 `mine-skill-gaps` sweep
(`docs/skill-gaps/registry.md` — every cited row is skeptic-verified with a re-read excerpt) and the
four-repo cross-check (`docs/skill-gaps/cross-repo.md` — kg/fokus/sprint-rituals/reflekt). Items P1–P10
and P15 carry multi-estate corroboration from the cross-check; apply-side can read the sibling repos'
registries for their halves of the evidence.

Prior file: `nexus-1.33.0-2026-07-14.md`.

---

## Triage (2026-07-20, architect session — campaign-grounded, owner-approved)

Routed into `docs/backlog.md` rows F17–F22. Spot-checks re-verified 8/8 mechanically-checkable
claims still open at current versions (nexus 1.38.0, nexus-analytics 0.4.0). Triage priorities are
grounded in the F2-SdkRewrite campaign (omnivision-ai-sdk): P0 round-trip GO 2026-07-19, p0b
algorithm-arm defined, P2 census/mining waves next (consume `mine-*` kickoffs), P3 needs the C++
generative pattern pack — hence miner fixes first and authoring standards before the pack.

| Items | Backlog row | Note |
|-------|------------|------|
| P18, P19 | **F17-MineFieldFixes** | First — the in-flight P2 mining waves execute these kickoffs; P19 touches `kickoff-preflight.mjs` too, not just prose |
| P11, P20 | **F18-SkillAuthoringStandards** | The standard, not the per-skill fixes; lands before the C++ pattern pack (born-compliant, ADR-23) and before F19 |
| P1–P10 | **F19-DotnetSkillCoverageWave** | One pass per skill under the F18 standard; P7 first (actively misleading); P5 evaluates promoting fokus `create-standalone-service` (read its current state first) |
| P12, P13, P14 | **F20-ProcessSkillQuickWins** | P12's mutation loop is the SDK campaign's proven discipline, generalized |
| P15 | **F21-CreateHostSkill** | Strongest new-skill case in the file (3 estates) |
| P16, P17 | **F22-AnalyticsMinorFixes** | P17 is verify-then-fix — one absorbed item already confirmed at 0.3.0, two re-verified open at 0.4.0 |

Out of scope of this file, flagged separately: the **C++ generative pattern pack** (F2-SdkRewrite
P3's named consumer expectation of this repo) is not a feedback item — shaped 2026-07-20 as
**F23-CppPatternPack** under the owner's pilot-then-generalize doctrine (pilot one stack, C++
first, stack-flavors later if required). p0b's Stage A field-tests `mine-algorithm`; expect its
method feedback in a future file.

---

## A. nexus-dotnet skill fixes (existing skills, under-coverage confirmed in use)

### P1 — `create-feature`: variants missing, dead references
- **Action:** fix. **Evidence:** KG registry (F55/F26/F24 lessons); reflekt registry row 1 — 4 sub-claims
  verified STILL OPEN, incl. `workflows/Validator.md` referencing `NotEmptyWithMessage()`/`MaxLength`
  from Blocks.Core, which contains only Guard.cs — zero repo usages (a dead reference, not just a gap).
- **Needed:** no-CQRS/endpoint-only branch; GET query-string binding; DELETE/no-body coverage;
  response-record location; declare the `GlobalExceptionMiddleware` + FastEndpoints `Send.*` assumptions.

### P2 — `create-vue-feature`: extend-existing-slice branch
- **Action:** fix. **Evidence:** KG (analytics-query-budget:90 "assumes a fresh vertical slice", F50, F55);
  fokus `frontend-data-layer` (5 plans); the cross-check's §A.1 extension-not-creation theme (all 4 estates).
- **Needed:** an "extend an existing slice" branch (add types/API fn/store refs to existing files);
  reference-app mismatch callout.

### P3 — `vue-patterns`: Project Conventions section over-claims
- **Action:** fix. **Evidence:** KG (F54:211, F26:30, F55:34) — the section names a layout/template the
  consuming repos don't use. **Needed:** scope the section as reference-app-specific or make it discovery-driven.

### P4 — `pinia-patterns`: two missing patterns
- **Action:** fix. **Evidence:** KG (F26:29 — no localStorage persistence; F24:48 — no
  composing-into-an-existing-store section).

### P5 — `create-service`: minimal-stack branch
- **Action:** fix. **Evidence:** KG F50:196 (no raw-Npgsql / no-MediatR / no-BuildingBlocks branch;
  precedents F1/F5/F17/F21 read directly instead). Note: fokus already built `create-standalone-service`
  for the same root cause — consider promoting that as the official minimal branch instead of a parallel skill.

### P6 — `domain-patterns`: minimal/edge coverage batch
- **Action:** fix (consolidated). **Evidence:** KG (F50:205, F55:28 zero-dependency variant — one already
  ships in KG unrecognized); sprint-rituals `promote-entity-to-aggregate` (in-place Entity→AggregateRoot);
  reflekt `refactor-base-classes` (`Entity<int>` vs `Entity` alias constraint caused a build failure).

### P7 — `authorization-patterns`: three independent complaints — highest-priority fix of this batch
- **Action:** fix. **Evidence:** reflekt (verified: "an actively misleading skill" for policy-based auth —
  the two-layer role/resource template names checkers that don't exist there; skill touched twice since,
  content unchanged); fokus `auth-patterns` (no OAuth middleware / pre-processor / route-guard / 401
  interception coverage); KG (minimal-shape + single-stub-principal variants, F50:215/F55:30).
- **Needed:** architecture-branching (policy-based vs role/resource-gate), a stub/minimal branch, and an
  honest scope statement in the frontmatter.

### P8 — `service-registration`: fit + frontmatter
- **Action:** fix. **Evidence:** KG (F41:45 ill-fitting; F48:33; F4 lessons:17 — the frontmatter's "DI
  registration" reads as module-DI, the body is host/service-layer composition; the mismatch caused a
  wrong Follow disposition that had to be self-caught).

### P9 — `service-infra-conventions`: options-binding §3 assumes non-existent helpers
- **Action:** fix. **Evidence:** KG F49:42 — `AddAndValidateOptions<TOptions>`/`GetSectionByTypeName<TOptions>`
  exist nowhere in the consuming repo; precedents F43/F48/F58/F61 cited in-entry.

### P10 — `add-integration-event`: test-harness-only consumer guidance
- **Action:** fix. **Evidence:** KG F50:208 (R22/F51 cited in-entry).

### P11 — Family-wide: declared assumptions + minimal-stack posture (the F50 umbrella)
- **Action:** meta-fix across the nexus-dotnet family. **Evidence:** KG F50 IP (priority high — "recurred
  on literally every mapped skill in an 8-step, 6-skill plan"); corroborated by reflekt P1 and fokus's
  `create-standalone-service` history (cross-check §A.2).
- **Needed:** each skill declares its stack assumptions up front (BuildingBlocks, MediatR, EF, endpoint
  framework, reference app) and either carries a minimal-stack branch or names the adaptation posture.

## B. nexus core process-skill fixes

### P12 — `tdd`: retro-fit mutation-testing variant
- **Action:** fix. **Evidence:** KG F24:50 + architect concurrence F24:14 (two-role sighting) — the
  green-first→single-mutation→red→revert loop as the named variant for tests over already-shipped behavior.

### P13 — `diagnose`: infra-gate mimicry addendum
- **Action:** fix. **Evidence:** KG F56:44 — a tool-level infrastructure gate that mimics a
  pipeline-phase error message; the protocol should name this branch.

### P14 — `create-implementation-plan` / architect: grep-feature-name-before-authoring check
- **Action:** fix. **Evidence:** KG F59 IP (:106-109) — a stale same-name proposal was nearly re-planned.

## C. New plugin skills

### P15 — `create-host` (nexus-dotnet) — NEW
- **Action:** create. **Evidence:** 3 estates (cross-check §A.4): KG (adhoc-SolutionReshape + F57 — incl.
  the verified `Sdk.Web`→`Sdk` implicit-usings loss, F57 lessons:20, named the highest-value content);
  fokus `compose-host`; sprint-rituals `compose-host` (4 plans incl. Kestrel h2c + MapGrpcService wiring).
- **Scope:** compose a Host from class-lib modules + convert a self-hosted `Sdk.Web` API into a module
  (Program.cs → DI extensions, GlobalUsings restoration, test-factory `Main` shape, launchSettings,
  relative-path config re-derivation).

### P16 — `analytics-profile-authoring` (nexus-analytics) — NEW
- **Action:** create. **Evidence:** KG F68:185 — authoring a query-flavor `profile.md` for a consuming
  repo with no mining run has no skill; the template ships inside `mine-semantic-model/references/` only.

## D. nexus-analytics `mine-semantic-model` runtime fixes (F52 2026-07-09 run) — status-checked at 0.3.0

### P17 — two of three F52 fixes still open at 0.3.0
- **Absorbed:** coverage Mine column-level diff — present at 0.3.0 (`SKILL.md:89` "Column-coverage diff —
  for every MODELED table, live columns vs the columns the bundle"). No action.
- **Open (verify + apply):** (1) BR12c catalog-read false-positive — the BR12c shape-check machinery is
  present at 0.3.0, but no textual trace of the root-cause fix from F52 lessons (:163/:170); verify in the
  plugin repo. (2) explicit gate on Bootstrap Emit behind the interview checkpoint — no gate text at 0.3.0;
  the five-phase order implies it, but F52's live run (lessons :182) shows order alone didn't prevent the miss.

## E. Miner + orchestration method items

### P18 — `mine-skill-gaps` S1: case-insensitive, any-level heading sweep
- **Action:** fix. **Evidence:** this run's skeptic — F3's `### Skill gaps` (lowercase, h3) section was
  missed by a case-sensitive `## Skill Gaps` census, initially misclassifying three captured candidates as
  capture leaks; F8-style heading-less candidate bullets also escape. Sweep `skill gaps` case-insensitively
  at any heading level and note the heading-less-bullet tolerance in the parser posture.

### P19 — `mine-family-core` kickoff checklist: stage-model-plan declaration
- **Action:** add a Tier-1 item. **Evidence:** operator directive 2026-07-18 (this project): a run declares
  at kickoff which model tier each stage class runs on — mechanical collection/extraction stages may run a
  named cheaper tier (Opus here), judgment stages (clustering, skeptic, judges) the session tier or a
  deliberately named one. Declare-and-veto, not an interactive prompt; generalizes the clause the
  mine-skill-gaps skeptic already carries.

### P20 — Skill discoverability: frontmatter/trigger wording pattern
- **Action:** investigate + guideline. **Evidence:** fokus registry `analytics-computation-service` fix —
  the skill EXISTS and lists the very services whose plans kept mapping `(none)` (6 plans). Coverage was
  fine; discovery failed. Suggest a frontmatter-trigger review pass (does each skill's description name the
  step-shapes plans actually use?) as part of skill-lint or a one-off audit.
