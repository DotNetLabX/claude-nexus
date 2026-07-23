# F19-DotnetSkillCoverageWave — P1–P10 under the F18 standard (ADR-collapsed: plan is the definition)

**Feature Spec:** None — ADR-collapsed per F17/F20/F24/F30/F32 precedent. Definition = the backlog
F19 row (Ready) + plugin-feedback `docs/plugin-feedback/nexus-1.36.0-2026-07-18.md` §A (P1–P10) +
the F18 standard (`plugins/nexus/skills/improve-skills/references/skill-recipe.md` §4) + this plan.

## Context

Apply plugin-feedback P1–P10 to 10 shipped nexus-dotnet skills — one coherent-edit pass per skill
under the F18 authoring standard (`## Assumes` first-H2 block + minimal-stack branch or adaptation
posture + discoverability description). Both sequencing gates have landed: F24's
`edit-shipped-plugin-skill` recipe (nexus 1.46.0) and F18's standards + W5/W6 lint tier (nexus
1.47.0). F19 is the recipe's first large consumer and the W5 worklist's first tranche.

**Verification (2026-07-23, this session — 3 Explore agents + live lint against nexus-dotnet 1.6.0;
the 10 skills unchanged since 1.5.0, 2026-07-07):**

- Live `skill-lint`: **W5 (missing `## Assumes`) on all 10 skills; W6 (description lacks
  `Use when`) on `vue-patterns` + `pinia-patterns` only.** `^## Assumes` in `plugins/nexus-dotnet/`
  = 0 hits today.
- P2, P3, P6, P7, P8, P10: **confirmed open as filed** (file:line evidence in the step inputs).
- **P1 narrowed:** the `GlobalExceptionMiddleware` + `Send.*` sub-claim is ALREADY-FIXED (declared
  in all three endpoint workflows' Error Handling sections). The `NotEmptyWithMessage`/
  `MaximumLengthWithMessage`/`MaxLength.C*` refs are **not dead upstream** — Validator.md:56-72
  attributes them to `Blocks.Core` source files, and `service-infra-conventions/SKILL.md:253-272`
  ships the extension-method source. They are an **unhedged reference-app assumption** (the P11/F18
  shape): real in the reference app, absent in consumers like reflekt (Guard.cs-only Blocks.Core).
- **P5 premise broken:** fokus's `create-standalone-service` was **never built** — no skill dir, no
  git history for `.claude/skills/create-standalone-service`; it exists only as a gap description
  (fokus `docs/specs/F1-Scaffolding/delivery/lessons.md:22` — direct NuGet packages, inline base
  classes or none, SQLite-first). Nothing to promote; the branch is authored fresh.
- **P9 half-fixed:** helpers are already attributed reference-app-only (`SKILL.md:16/:108/:115`);
  the open gap is the prescriptive imperatives (":110 the default for anything a service needs",
  ":142 Don't call services.Configure") with no no-BuildingBlocks fallback.
- **P4 nuance:** `Store Composition` (pinia-patterns:229-247) covers cross-store reads, not
  extending an existing store — the fix targets the extend-in-place axis.

**Plan-time greps (2026-07-23, executed, pasted):** `NotEmptyWithMessage|MaxLength(` estate-wide →
create-feature/workflows/Validator.md:27,50,61 + cqrs-patterns/SKILL.md:100 +
service-infra-conventions/SKILL.md:253,272 (helper mentions/source) + `MaxLength.C*`-ladder hits in
create-aggregate/ValueObject/persistence-patterns (EF constants — different fact, DO-NOT-TOUCH).
`Project Conventions` → vue-patterns/SKILL.md:120 only (no external consumer of the heading).
plugin.json skill count "37" — unchanged by this wave (no skills added/removed; no enumeration
ripple).

**Execution decisions (user, 2026-07-23 — questions.md Q1–Q3):** code-grounded critic on this plan;
architect-led fast lane for implementation; semver **MINOR** (owner-ratified escalation).

## Scope

**In:** the 10 skill folders under `plugins/nexus-dotnet/skills/` — `authorization-patterns`,
`create-feature`, `create-vue-feature`, `vue-patterns`, `pinia-patterns`, `create-service`,
`domain-patterns`, `service-registration`, `service-infra-conventions`, `add-integration-event`;
each gets one F24-recipe pass = `## Assumes` block + minimal-stack branch/adaptation posture +
its P-specific content fixes; W6 description fixes where flagged; one MINOR release at the end.
**Out:** the other ~32 estate W5 warns (F18 recorded baseline 42 — later tranches own the rest);
new skills (`create-host` is F21, `analytics-profile-authoring` is F22); P11/P20 standard text
(F18, shipped); `consumer-patterns` content changes (P10 stays in `add-integration-event` with the
existing hand-off intact); the C++/Flutter packs (F23/F31).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | edit-shipped-plugin-skill | Follow | no | authorization-patterns: policy branch + stub branch + honest scope (P7) | — |
| 2 | edit-shipped-plugin-skill | Follow | no | create-feature: declare+fallback for Blocks.Core helpers, GET/DELETE, response-record location, no-CQRS framing (P1) | — |
| 3 | edit-shipped-plugin-skill | Follow | no | create-service: fresh minimal-stack branch (P5) | — |
| 4 | edit-shipped-plugin-skill | Follow | no | domain-patterns: zero-dep variant, promotion recipe, alias note (P6) | — |
| 5 | edit-shipped-plugin-skill | Follow | no | create-vue-feature: extend-existing-slice branch + mismatch callout (P2) | — |
| 6 | edit-shipped-plugin-skill | Follow | no | vue-patterns scoping + pinia-patterns two patterns + both W6 descriptions (P3+P4) | — |
| 7 | edit-shipped-plugin-skill | Follow | no | service-registration frontmatter refit + service-infra-conventions fallback posture (P8+P9) | — |
| 8 | edit-shipped-plugin-skill | Follow | no | add-integration-event: test-harness-only consumer guidance (P10) | — |
| 9 | release-plugin | Follow | no | MINOR (owner-ratified); backlog row | — |

Every step 1–8 also delivers that skill's **F18 §4 retrofit** (`## Assumes` as first H2 after the
title; minimal-stack branch or one-line adaptation posture; `Use when` step-shape description where
flagged) — listed once here, not restated per step. TDD `no` throughout: prose-only edits; the
deterministic checks are skill-lint + the repo lint suite (Step 9).

## Domain Model Changes

None (prose-only).

## Data Model Changes

None.

## Implementation Steps

Order: Step 1 first (backlog mandate — actively misleading skill); Steps 2–8 in any order after it;
Step 9 last. Each of Steps 1–8: Follow edit-shipped-plugin-skill (sweeps, DO-NOT-TOUCH recording,
lint traps, per-folder skill-lint exit 0 are the recipe's — not restated). Assumes-block content
below names the verified assumption set per skill; the developer words the prose.

### Step 1 — `authorization-patterns` (P7)

Follow edit-shipped-plugin-skill. Single file, 207 lines. Feature-specific inputs:

- **Assumes:** closed role enum + per-service resource checkers + JWT validation as taught; the
  reference app's two-layer `RequireRoleAuthorization` infrastructure.
- **Architecture branch (new):** policy-based authorization (ASP.NET Core policies /
  `IAuthorizationRequirement` / `IAuthorizationHandler`) vs the existing two-layer role/resource
  gate — when each fits; the existing content becomes the two-layer branch, not the only truth.
  (Evidence: reflekt — "actively misleading" for a policy-based consumer; checkers named don't
  exist there.)
- **Stub/minimal branch (new):** single-stub-principal / authentication-only minimal shape
  (KG F50:215, F55:30).
- **Honest scope:** description names both branches and what the skill does NOT cover — concretely:
  OAuth middleware, client-side route guards, 401 interception (the fokus non-coverage items; the
  pre-processor stamp at :146 and JWT validation ARE covered — don't disclaim those).
- **Acceptance:** W5 clear on the folder; description contains `policy` (0 hits in frontmatter
  today); a stub/minimal H2 or H3 exists; skill-lint exit 0.
- Satisfies: backlog F19 row P7.

### Step 2 — `create-feature` (P1)

Follow edit-shipped-plugin-skill. 7 files / 606 lines. Feature-specific inputs:

- **Assumes:** FastEndpoints/Carter/Minimal-API variants; MediatR (variant-scoped);
  `GlobalExceptionMiddleware` + FastEndpoints `Send.*` (consolidate the already-present per-workflow
  declarations — do not duplicate them, point the block at them); Blocks.Core FluentValidation
  extensions + `MaxLength.C*` ladder (reference app).
- **`workflows/Validator.md` declare+fallback (NOT deletion) + two-surface reconciliation (critic
  HIGH-1):** the **FastEndpoints** variant template (:21-30) currently calls `NotEmptyWithMessage`/
  `MaximumLengthWithMessage` — which `service-infra-conventions/SKILL.md:254` ("They do **not** use
  the `Blocks.Core` extensions") and `:279` ("**Don't** call the `Blocks.Core` FluentValidation
  helpers from a FastEndpoints validator") forbid. Reconcile in this pass: the FastEndpoints
  template switches to the service-local `ValidatorsMessagesConstants` form per §10; the **MediatR**
  variant keeps the helpers. Then add the no-Blocks.Core fallback for the MediatR path — plain
  FluentValidation `NotEmpty().WithMessage(...)` / `MaximumLength(n)` — and point at
  `service-infra-conventions/SKILL.md:253-272` (ships the helper source for copy-in).
  DO-NOT-TOUCH: cqrs-patterns/SKILL.md:100 and service-infra-conventions:253/:272 are consistent
  siblings **for the MediatR path only**; `MaxLength.C*` EF-ladder hits in
  create-aggregate/persistence-patterns.
- **No-CQRS framing:** promote the existing FastEndpoints inline-handler reality
  (`EndpointFastEndpoints.md:19`) to an explicit endpoint-only/no-CQRS branch label.
- **GET query-string binding + DELETE/no-body coverage (new):** currently 0 matches for
  `FromQuery`/`DELETE` in the folder.
- **Response-record location guidance (new):** `{ResponseType}` is opaque throughout today.
- **Acceptance:** W5 clear; `grep -F 'NotEmpty().WithMessage'` ≥ 1 in Validator.md (0 today);
  the `Validator<T>` (FastEndpoints) code block contains `ValidatorsMessagesConstants` and zero
  `NotEmptyWithMessage` calls (2 today at :27-28); `grep -iE 'query.string|FromQuery'` ≥ 1 and
  `grep -i 'DELETE'` ≥ 1 in the folder (0 today); skill-lint exit 0.
- Satisfies: backlog F19 row P1.

### Step 3 — `create-service` (P5)

Follow edit-shipped-plugin-skill. 9 files / 887 lines. Feature-specific inputs:

- **Assumes:** BuildingBlocks packages (`Blocks.Domain`, `Blocks.Core`, `Blocks.MediatR`,
  `Blocks.EntityFrameworkCore` — `ScaffoldCsprojFiles.md:24,48,98-106,151-161`), the
  `create-service-claude-md` precondition, reference app.
- **Minimal-stack branch (new, authored fresh — nothing to promote):** no-BuildingBlocks path at
  the csproj/DI fork points — direct NuGet packages, inline base classes or none, raw
  Npgsql/SQLite-first configuration, no MediatR. Seed requirements: fokus
  `docs/specs/F1-Scaffolding/delivery/lessons.md:22` (KG F50:196 precedents F1/F5/F17/F21
  corroborate the demand).
- **Acceptance:** W5 clear; a minimal-stack H2/H3 exists naming the no-BuildingBlocks path;
  skill-lint exit 0.
- Satisfies: backlog F19 row P5.

### Step 4 — `domain-patterns` (P6)

Follow edit-shipped-plugin-skill. Single file, 231 lines. Feature-specific inputs:

- **Assumes:** `Blocks.Domain` base classes; MediatR for the full stack ("Light stack" at :11
  drops MediatR but still requires Blocks.Domain — say so).
- **Zero-dependency variant (new):** inline base classes, no Blocks.Domain (KG F55:28 — one
  already ships in KG unrecognized).
- **In-place Entity→AggregateRoot promotion recipe (new):** sprint-rituals
  `promote-entity-to-aggregate` evidence; 0 occurrences today.
- **`Entity<int>` vs `Entity` alias/constraint note (new):** reflekt `refactor-base-classes` build
  failure; the Entity section (:37-44) covers setter/`required` pitfalls only today.
- **Acceptance:** W5 clear; `grep -i 'AggregateRoot'` hits a promotion-recipe heading/paragraph
  (promotion content absent today); skill-lint exit 0.
- Satisfies: backlog F19 row P6.

### Step 5 — `create-vue-feature` (P2)

Follow edit-shipped-plugin-skill. Single file, 112 lines. Feature-specific inputs:

- **Assumes:** the reference layout (`client/src/...` paths, Pinia, the router/nav wiring the
  steps assume).
- **Extend-existing-slice branch (new):** add types / an API function / store refs to existing
  files — the 8-step list (:10-50) and Checklist (:103-112) are creation-only today (KG
  analytics-query-budget:90, F50, F55; fokus `frontend-data-layer` ×5 plans).
- **Structure-mismatch callout (new):** what to do when the consuming app's layout differs from
  the reference paths.
- **Acceptance:** W5 clear; an extend-existing H2/H3 exists; skill-lint exit 0.
- Satisfies: backlog F19 row P2.

### Step 6 — `vue-patterns` + `pinia-patterns` (P3+P4) — one recipe pass per skill

Follow edit-shipped-plugin-skill (twice — two folders). Feature-specific inputs:

- **vue-patterns:** scope `## Project Conventions` (:120-127 — flat universal path claims) as
  reference-app-specific or discovery-driven; **W6 fix** — description gains `Use when` +
  step-shapes (composables, reactivity, script-setup macros). Assumes: Vue 3 + the reference
  layout for the conventions section.
- **pinia-patterns:** add **localStorage persistence** pattern (0 hits today) and an
  **extend-an-existing-store** section (adding state/actions to an existing store file — distinct
  from the cross-store `Store Composition` at :229-247, which stays); **W6 fix** — description
  gains `Use when` + step-shapes (create store, extend store, persist state). Assumes: Pinia setup
  stores, Vue 3 — **with the §4.1 posture stated explicitly** (framework-native: no extra packages
  presumed; the localStorage pattern uses the plain Web API unless the project already carries a
  persistence plugin).
- **Acceptance:** W5+W6 clear on both folders; `grep -i localStorage` ≥ 1 in pinia-patterns
  (0 today); skill-lint exit 0 on both.
- Satisfies: backlog F19 row P3, P4.

### Step 7 — `service-registration` + `service-infra-conventions` (P8+P9) — one recipe pass per skill

Follow edit-shipped-plugin-skill (twice — two folders). Feature-specific inputs:

- **service-registration (P8):** frontmatter refit — the lead phrase "Service DI registration…"
  reads as module-DI while 8 of 9 H2s teach single-service/host composition (verified; the
  description's tail already names layers/host/`Use when` — the fix is the lead framing, narrower
  than a full rewrite). Reconcile the body lead sentence (**:9**) in the same pass (two-surface
  rule). Assumes: BuildingBlocks registration extensions, MediatR behavior order, reference app —
  **with the §4.1 posture stated explicitly** (without the Blocks registration extensions /
  MediatR, register the equivalent services directly per layer; the layer-placement rules stand
  regardless of package). Post-rewrite, confirm the two live consumers still read true:
  `service-infra-conventions/SKILL.md:287` and `file-storage-patterns/SKILL.md:163` (both describe
  it as layer-structure/what-goes-where — aligned with the refit direction).
- **service-infra-conventions (P9, narrowed):** attribution already present (:16/:108/:115) —
  keep it; add the no-BuildingBlocks **adaptation posture** to §3 options binding (what to do
  without `AddAndValidateOptions`/`GetSectionByTypeName`: the plain
  `AddOptions<T>().Bind().ValidateDataAnnotations().ValidateOnStart()` shape or copy-in per its own
  §10 source listing), and soften the unconditional imperatives (:110, :142) to the
  reference-app-stack branch. Assumes: Blocks.Core configuration extensions (reference app),
  MediatR pipeline, CPM.
- **Acceptance:** W5 clear on both; service-registration description no longer leads with bare
  "Service DI registration" (refit visible in frontmatter); §3 carries a fallback sentence
  (`grep -i 'without\|fallback\|no Blocks' SKILL.md` §3 range ≥ 1); skill-lint exit 0 on both.
- Satisfies: backlog F19 row P8, P9.

### Step 8 — `add-integration-event` (P10)

Follow edit-shipped-plugin-skill. SKILL.md 31 lines + 3 workflows. Feature-specific inputs:

- **Assumes:** MassTransit + RabbitMQ wiring site (`AddMassTransitWithRabbitMQ`), the
  `consumer-patterns` hand-off for consumer bodies.
- **Test-harness-only consumer guidance (new):** the case where the only consumer of a new event
  is a test harness / no production consumer exists yet (KG F50:208, R22/F51). 0 hits for
  test-harness language in this skill AND in `consumer-patterns` today. Lives here (the wiring
  skill); keep the existing `consumer-patterns` hand-off intact — pointer, no restatement.
- **Acceptance:** W5 clear; `grep -i 'test harness\|test-harness\|no production consumer'` ≥ 1
  (0 today); skill-lint exit 0.
- Satisfies: backlog F19 row P10.

### Step 9 — Estate gates + release + backlog

Follow release-plugin. After all Steps 1–8 land (never per-step — F24 recipe phase 6):

- **Estate guards (per-folder form — immune to a new born-compliant skill landing first, e.g.
  F21):** each of the **10 target folders'** SKILL.md contains exactly one `^## Assumes` (0 in each
  today), and no **non-target** folder lost or gained one **through this wave's edits**; skill-lint
  exit 0 with zero W5/W6 warns on all 10 target folders; plugin.json's "37" skill count untouched
  (no skills added/removed).
- **Repo lint suite** in the glob form: `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"`
  — green before the bump.
- **Release:** `release-plugin` — **MINOR** (owner-ratified, questions.md Q3); dry-run reasons must
  name only the 10 skill folders — any file outside them (in-flight F27/eval trees are untracked in
  this repo today) = stop and hand the bump to the owning session. CHANGELOG: one wave entry, P#
  per skill.
- **Backlog:** F19 row → In Progress at dispatch; Done (shipped date, version) at lane close —
  re-read the row in the same turn before editing (multi-session doc).
- **Executor split (fast lane):** the developer delivers the estate guards + green lint suite; the
  `release-plugin` run and the backlog edits are the **lane close's (architect)** — the bump rides
  in the close commit. A developer Step-9 without the release run is Implemented, not Deviated.
- Satisfies: backlog F19 row (release + tracker obligations).

## Cross-Service Changes

N/A (plugin prose).

## Migration Notes

N/A.

## Testing Strategy

Deterministic: per-folder skill-lint exit 0 (W5/W6 clear on the 10); the pinned acceptance greps
per step (all baselines executed at plan time, 2026-07-23); the `^## Assumes` = 10 estate guard;
repo lint suite glob form. Judgment: the fast-lane dispatch's docs-only-diff review branch (prose
angles: internal consistency, dangling cross-refs, dropped guarantees, directional refs, stale
adjacent sentences — two parallel general-purpose finder passes + in-context verification). The
standards' honest-vs-present judgment tier (`evaluate-skill` overlay) is not re-run per skill here
— it rides the estate's periodic review, not this wave.

## KB Impact

None (dev-repo; no `docs/kb/` entries).

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| P1 fix = declare + plain-FluentValidation fallback, not deletion | Helpers are real in the reference app — service-infra-conventions:253-272 ships the source; 3 sibling files reference them (deletion would contradict the estate) | Strip the refs per the feedback's "dead reference" framing | decided |
| P5 branch authored fresh inside `create-service` | fokus's `create-standalone-service` never existed (no dir, no git history) — only a gap description; F18 §4.1 mandates branch-or-posture in the owning skill | Build a parallel `create-standalone-service` skill; "promote" a nonexistent artifact | decided |
| P9 narrowed to fallback-posture | Attribution already shipped at 1.5.0 (:16/:108/:115) — re-scoping is done; the open gap is only the missing no-BuildingBlocks path | Full re-scope per the feedback's phantom-helpers framing | decided |
| P4 adds extend-an-existing-store alongside `Store Composition` | The existing section is cross-store reads; the KG complaint (F24:48) is the extend-in-place axis — different fact, both stay | Treat `Store Composition` as already covering it | decided |
| Description rewrites limited to W6-flagged + P-named skills (vue-patterns, pinia-patterns, service-registration, authorization-patterns) | W6 is the deterministic trigger; P8/P7 name their descriptions explicitly; blanket rewrites risk churn on 6 descriptions no evidence flagged | Rewrite all 10 descriptions to the §4.2 judgment bar in this wave | decided |
| Steps pair P3+P4 and P8+P9 (one step, two recipe passes) | Sibling pairs, same discipline, keeps the plan at 9 steps (no split machinery); each skill still gets its own full pass + lint gate | Strict one-step-per-skill (11 steps → split overhead for no gain) | decided |
| HIGH-1 reconciliation folded into Step 2, not a separate ticket | Same file, same pass — the recipe's two-surface rule mandates it once the pass touches Validator.md; a one-template ticket would re-open the same edit | Defer to a follow-up ticket; ship the contradiction with a note | decided |

## Open Questions

None.

## Plan Review

**Code-grounded critic (opus, 2026-07-23): GO-with-fixes — all findings folded.**
- HIGH-1 (Validator.md FastEndpoints template uses `NotEmptyWithMessage`; service-infra-conventions
  :254/:279 forbids Blocks.Core helpers in FastEndpoints validators; plan labeled the sections
  "consistent siblings"): folded — Step 2 now does the two-surface reconciliation (FastEndpoints →
  `ValidatorsMessagesConstants`, MediatR keeps helpers + fallback); sibling label corrected to
  MediatR-path-only; acceptance gains the FastEndpoints-block grep pair; Decisions row added.
- MEDIUM-1 (§4.1 posture unpinned for service-registration + pinia-patterns; W5-only gate can't
  catch the omission): folded — explicit posture lines added to Steps 6 and 7.
- LOW-1 (lead-sentence cite :11-15 → :9): folded.
- LOW-2 (estate guard "= exactly 10" brittle vs a born-compliant F21 landing first): folded —
  per-folder guard form.
- LOW-3 (P7 honest-scope items unnamed): folded — OAuth middleware / route guards / 401
  interception named; covered items excluded from the disclaimer.
- Informational (service-registration consumer refs :287/:163 not enumerated): folded into Step 7.
- Verified clean by the critic: all acceptance-grep baselines real; W6 scope correct (all 10
  descriptions checked); `^## Assumes` = 0 across all 36 nexus-dotnet skills; no external consumer
  of `Project Conventions`; P9/P1 narrowings justified by source.
