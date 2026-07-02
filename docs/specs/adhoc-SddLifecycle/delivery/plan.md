# SDD Golden-Set Lifecycle — v1 UNGATED slice (Implementation Plan)

**Feature Spec:** `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` (Status: Ready)
**Scope decision:** Q1 = **(A) ungated slice only** (user-confirmed 2026-07-03). Q2 = **fold into
`mine-verify-cover` as an "SDD lifecycle" section** (user-confirmed). Review mode = **critic, code-grounded**.

## Context

The parent pilot (`adhoc-SddCoverageLoop`) built the two-arm SDD loop machinery in dev-repo `harness/`
(doesn't ship) but its live **AC-6** verdict is **still pending** (never run; operator-owed — parent
`summary.md:31`). This spec's full lifecycle (C1 registry, C2 attestation, C3 merged set, C4 triage, M1
Create, M3 Evolve) **assumes the two-arm loop works** and is therefore **gated on AC-6** — a NO-GO invalidates
M1/M3 as designed. Per Q1=(A) that gated machinery is **deferred to a follow-up pass once AC-6 = GO**.

This plan ships **only the slice that is correct regardless of the pilot verdict**: the **M2 refactor-safety
protocol** (code-arm only — "stands regardless"), the **M0 greenfield naming** (no new machinery, OD-L6), the
**AC-L6 drift rules** (a dormant conditional referencing C2, verified net-new), their two **ADRs**, and the
**plugin release**. This is the **first `plugins/**` touch in this lineage** (skill text + agent files ship →
bump + omni twin). Grounding facts verified at plan time: no attestation check exists in any shipped nexus
agent file today; `mine-verify-cover/SKILL.md` (+ `-dotnet` adapter) carries no lifecycle/spec-arm content;
highest existing ADR is **ADR-37** → this pass adds **ADR-38 / ADR-39**; the deterministic release gates are
`claude plugin validate --strict` + `node scripts/selfcheck.mjs` (there is no separate skill-lint script).

## Scope

**In:** an "SDD lifecycle (M0–M3)" section in `mine-verify-cover/SKILL.md` fully specifying **M0** (naming) and
**M2** (refactor-safety protocol) and stubbing M1/M3 as deferred; the **AC-L6 drift rules** in the solo,
architect, and developer agent files; **ADR-38** (M2 safety) + **ADR-39** (drift v1) in the architecture
record; the **plugin bump + gen-commands + validate + selfcheck**.

**Out (deferred pending parent pilot AC-6, per Q1=(A)):** C1 registry, C2 attestation record, C3 merged test
set, C4 triage protocol, **M1 Create**, **M3 Evolve** + the three-way reconciliation table, live proofs
**AC-L1..L5**, ADRs **A–F** + the *merged-set-is-the-gated-unit* half of ADR-G. Also out: any harness `.mjs`
work (dev-repo, and all gated here); the parent's own AC-6 live run; the omni-twin **commit** + the two nexus
**commits** (team-lead commit protocol — see Owner split).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Author the "SDD lifecycle (M0–M3)" section in `mine-verify-cover/SKILL.md`: 4-mode map (naming); M0 + M2 full text; M1/M3 = deferred stub | Log to lessons |
| 2 | (none) | — | no | Add the AC-L6 C2-attestation **drift rule** (dormant conditional) to `solo.md`, `architect.md`, `developer.md` — shared anchor phrase | Log to lessons |
| 3 | (none) | — | no | Extract **ADR-38** (M2 safety = suite-green + floor, never a kill-rate delta) + **ADR-39** (drift v1) into `docs/architecture/README.md` | — |
| 4 | release-plugin | Follow | no | Bump `nexus` (PATCH default; flag possible MINOR to owner), regen commands, validate --strict, selfcheck | — |

**Why all-`None` on Steps 1–3 (done-check note).** These are **doc / skill-text / agent-prose** authoring
steps — no shipped skill dictates the *content* of an ADR, an agent rule, or a lifecycle section (the skill
that governs the architecture doc, `create-architecture-doc`, is Generate/Refresh of the whole doc; this
README is the ADR-1 dev-exception, not managed by it). The **one** expected skill invocation is
**`release-plugin` at Step 4** — the skill-invocation log should show exactly that, not an empty log flagged
against Steps 1–3. TDD is `no` throughout: this pass writes no code logic; `selfcheck` + `validate` are the
gates.

**Owner split (release & commit).** The developer runs Step 4's bump + `gen-commands` + `validate` +
`selfcheck`, leaving the tree dirty with the version bump. The **two nexus commits, the `gen-omni.mjs` twin
regen, and the `../omni` cross-repo commit are the team-lead's commit protocol** (ADR-6/ADR-9/ADR-20) — the
omni footer pins the implementation SHA, so `gen-omni` must run **after** the last nexus edit, at commit time,
not mid-implementation (memory: "Finalize artifacts before commit 2"). The developer does **not** commit and
does **not** run `gen-omni`.

## Domain / Data Model Changes

None (skill text + agent prose + ADR record + release tooling; no product domain or persistence).

## Binding surfaces vs developer's call

- **Binding (do not vary):** the skill section heading **"SDD lifecycle"** (user-confirmed Q2); the **M2 pass
  criterion** wording — *suite-green + floor re-clear across the refactor, kill-rate delta advisory only, never
  the pass/fail criterion* (it is ADR-38); the **ADR numbers 38 and 39** and their one-line titles; the
  **AC-L6 anchor phrase** (below) present in all three agent files; the drift rule framed as a **dormant,
  forward conditional** ("when a class *has* an attested golden set…"), not an assertion that C2 exists today.
- **Developer's call:** exact placement of each drift rule within its agent file; prose wording (as long as the
  binding criteria + anchor phrases survive); internal ordering within the new skill section; the PATCH-vs-MINOR
  escalation is **flagged to the owner, never self-decided** (CLAUDE.md release policy).

## Implementation Steps

### Step 1 — Add the "SDD lifecycle (M0–M3)" section to `mine-verify-cover`
Fold the lifecycle framing into the shipped stack-neutral skill as a new top-level section, shipping **only**
the ungated modes in full.
- **Files:** edit `plugins/nexus/skills/mine-verify-cover/SKILL.md` (add one new `## SDD lifecycle (M0–M3)`
  section; do not restructure the existing method).
- **Content (feature-specific):**
  - A one-paragraph frame: `mine-verify-cover` is the **code arm** of a larger SDD lifecycle; the lifecycle has
    four modes, keyed on what already exists (spec / code / golden set).
  - A **4-row mode map** — one line each, naming only: **M0 Greenfield** (spec exists, code doesn't),
    **M1 Create** (both exist, no golden set), **M2 Protect** (refactor of a covered class), **M3 Evolve**
    (feature update on a class with an attested set).
  - **M0** = a **named position in the lifecycle** (not a shipped recipe): greenfield is where a spec exists but
    the code doesn't, so the lifecycle's **spec arm run alone** produces the **red suite** the code is written to
    turn green. **No new machinery** (OD-L6) — and note the spec arm itself is **dev-repo harness, not yet
    shipped**, its live run **AC-6-gated** (same deferral as M1/M3). Described here to place greenfield in the
    lifecycle, not as an executable mode this slice ships.
  - **M2** (full — the substantive ungated content): *When refactoring a class already covered by a
    `mine-verify-cover` gated suite, re-run the two **safety-net gates the protect case actually uses** —
    `suite_green` (every pre-refactor gated test stays green post-refactor) AND `mutation_floor` (the re-gated
    whole-class **reachable kill clears the adapter's floor**) — before and after the refactor. `char_pin`
    **is inapplicable** to M2: M2 deliberately changes production source (the inverse of `mine-verify-cover`'s
    normal no-edit-prod stance), so the "prod source unchanged" gate does not apply. A kill-rate before/after
    **delta is advisory only** — the mutant population (denominator) changes with the source, so a rate
    comparison is not apples-to-apples and is **never** the pass/fail criterion. Code arm only; needs no spec
    arm.*
  - **M1 / M3** = a **single deferred stub**: "The full Create/Evolve lifecycle (canonical rule registry,
    attestation record, merged-set triage, three-way reconciliation) is **deferred pending the parent pilot's
    AC-6 verdict** — see `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md`." Do **not** ship the C1–C4 or
    reconciliation-table content.
- **Pattern reference:** mirror the existing section voice/format in the same file (e.g. "The gate battery",
  "Safety rails"); the M2 text **must reference the file's own existing gate names** (`suite_green`,
  `mutation_floor`) rather than restate them.
- **Accept (mechanism):** `grep` `mine-verify-cover/SKILL.md` finds (a) a heading `## SDD lifecycle (M0–M3)`;
  (b) the M2 phrase `delta is advisory only` **and** `never` (the pass/fail carve-out) **and** a `char_pin` …
  `inapplicable` clause; (c) M0's `red suite` **plus** a `not yet shipped` / `AC-6-gated` marker (position, not
  recipe); (d) the M1/M3 `deferred pending the parent pilot's AC-6` stub. No C1/C2/C3/C4 or reconciliation-table
  prose present (gated-content check).
- **Satisfies:** OD-L6 (M0); AC-L3 *M2-protocol half* (the merged-set gate half is deferred).

### Step 2 — Add the AC-L6 attestation drift rule to solo, architect, developer
Encode the Drift-policy v1 awareness as a rule in each of the three agent files — a **dormant forward
conditional** (C2 sets do not exist until the gated slice ships; verified net-new: zero attestation checks in
the shipped agents today).
- **Files:** edit `plugins/nexus/agents/solo.md`, `plugins/nexus/agents/architect.md`,
  `plugins/nexus/agents/developer.md`.
- **Content (feature-specific), role-differentiated (MEDIUM-4 — the architect never writes tests):**
  - **solo** (primary owner) and **developer** (symmetric, before implementing): *when the class you are about to
    touch has an **attested golden set** (a C2 attestation record at `docs/kb/golden/{Class}.md`), **update the
    affected tests in the same pass**, or flag an **M3 re-mine**.*
  - **architect** (symmetric, at **plan / done-check time**): *when a class in scope has an **attested golden
    set** (`docs/kb/golden/{Class}.md`), **plan the test update or flag an M3 re-mine**.* Do **not** copy the
    "update tests in the same pass" clause into `architect.md` — that duty is solo/developer-only.
  - All three: frame it as a forward conditional ("when a class *has* an attested golden set…"), not a claim that
    C2 exists now.
- **Placement:** near each agent's existing convention-reading / pre-implementation (solo/developer) or
  plan/done-check (architect) guidance — **exact location is the developer's call**; the binding requirement is
  the anchor phrases' presence with the correct per-role framing.
- **Accept (mechanism):** all three of `plugins/nexus/agents/solo.md`, `architect.md`, `developer.md` carry the
  role-neutral anchors — `grep -l "attested golden set" …` → **3 files**, each also referencing `docs/kb/golden/`
  and `M3 re-mine` (this 3-file grep IS the AC-L6 proof). **Role-fit check:** `grep -l "update the affected tests
  in the same pass" …` hits `solo.md` + `developer.md` but **NOT** `architect.md`.
- **Satisfies:** AC-L6; ADR-39.

### Step 3 — Extract ADR-38 and ADR-39 into the architecture record
Record the two shipped decisions as durable one-decision ADRs (ADR-27/28: a shipped technical decision extracts
its ADR). Highest existing ADR is **ADR-37** → append **38** then **39**.
- **Files:** edit `docs/architecture/README.md` — add the two ADR sections (mirror the existing ADR shape:
  Context → Decision → Why → Tradeoffs → Rejected) and add **ADR-38 + ADR-39** to the `## Contents` list.
  **Boy-scout (fold in):** the `## Contents` list currently ends at ADR-36 but **ADR-37** already exists in the
  body (README.md:889) — add the missing **ADR-37** line to Contents in the same edit.
- **Content (feature-specific):**
  - **ADR-38 — M2 refactor safety = suite-green + floor re-clear across the refactor, never a kill-rate delta.**
    (The shipped half of the tech-spec's ADR-G.) State that the *merged-set-is-the-gated-unit* (C3 / AC-L3) and
    the full M1/M3 lifecycle are **deferred pending the parent pilot's AC-6**. Reference the existing
    `mine-verify-cover` gate battery; do not restate it.
  - **ADR-39 — Drift v1 = encoded agent awareness (solo/architect/developer) + CI/suite backstop; additive
    drift deferred to the per-PR loop.** (The tech-spec's ADR-H, in full.) Note the mechanical backstop (the
    merged set lives in the normal suite, so a broken attested rule fails CI regardless of process) and the
    named, accepted **additive-drift** gap.
  - Both ADRs note the gated lifecycle ADRs (**A–F** + the C3 half of G) are **deferred to the post-AC-6 fold-in**.
- **Accept (mechanism):** `grep '^## ADR-3[89]'` in `docs/architecture/README.md` → both present with the titles
  above; the `## Contents` list includes lines for **ADR-37, ADR-38, ADR-39** (37 was the pre-existing gap); each
  new ADR body contains the string `AC-6` (the deferral note).
- **Satisfies:** the tech-spec "ADRs to extract" obligation for the shipped slice (ADR-G→38, ADR-H→39).

### Step 4 — Release: bump, regen commands, validate, selfcheck
Run the release flow **once**, after Steps 1–3's edits all land (never per-step — CLAUDE.md double-bump hazard).
- **Files:** `plugins/nexus/plugin.json` (version), `plugins/nexus/CHANGELOG.md`, regenerated
  `plugins/nexus/commands/*.md` (agents changed in Step 2).
- **Do:** `Follow release-plugin` — `node scripts/bump-plugin.mjs` (proposes **PATCH**; this pass adds a new
  skill-section capability + agent rules, so **flag to the owner that a MINOR is available** — do **not**
  self-escalate); `node scripts/gen-commands.mjs nexus` (Step 2 edited agents); `claude plugin validate
  plugins/nexus --strict`; `node scripts/selfcheck.mjs` (read the developer-stage scoping below before judging
  its output).
- **Accept (mechanism) — scoped to what CAN go green at the developer stage (HIGH-1):** `git diff` shows
  `plugin.json` `version` incremented by exactly one tier and a new `CHANGELOG.md` entry naming this slug;
  `claude plugin validate plugins/nexus --strict` passes; and `node scripts/selfcheck.mjs` shows **PASS** on its
  four other gating checks — `tests (lint + unit)`, `gen-commands drift` (working-tree-aware regen → PASS after
  gen-commands), `bump-plugin --check` (PASS once the bump is applied), and `spec-diff inline-copy sync`.
- **Expected-RED, not a bounce (HIGH-1):** the one gating check the developer **cannot** turn green is
  `gen-omni --check` (`selfcheck.mjs:73-77`, gating) — the `../omni` twin is stale by design until the
  team-lead's commit-time `gen-omni` (Owner split), so a red `gen-omni --check` here is a **known-deferred
  state**, the omni analog of the documented `gen-commands` false-positive (`selfcheck.mjs:54-63`). The developer
  **records it as expected-deferred and does NOT run `gen-omni`** to chase it green (running it would pin the
  twin to a pre-commit SHA the team-lead must then re-generate — memory "Finalize artifacts before commit 2").
- **Owner split:** developer stops here (tree dirty, uncommitted). Team-lead commits + runs `gen-omni.mjs` +
  syncs the `../omni` twin per the commit protocol.
- **Satisfies:** roadmap step 4 (ship the ungated slice); CLAUDE.md release policy.

## Review gate

**Critic, code-grounded (mandatory — not doc-only).** This pass edits shipped skill text + agent files and
extends a subsystem (`mine-verify-cover`) — a doc-only critic is structurally blind here. Run critic **Mode 2**
against the tech-spec ACs (the ungated subset: OD-L6, AC-L3 M2-half, AC-L6) **+ the ADR register**, reading the
actual `mine-verify-cover/SKILL.md`, the three agent files, and `docs/architecture/README.md`. Team mode is
standard+codex → the Codex cross-check is also in play.

## Plan Review

Code-grounded critic (Mode 2) ran on this plan → verdict **REVISE** (1 HIGH + 3 MEDIUM; ungated-subset
coverage judged **complete** — all findings were feasibility/coherence, none missing-requirement). Full
findings persisted at `docs/specs/adhoc-SddLifecycle/delivery/review-critic.md`. All folded in this revision:

| # | Finding | Fix applied |
|---|---------|-------------|
| HIGH-1 | Step 4 "selfcheck exits green" unsatisfiable at developer stage — `gen-omni --check` is gating (`selfcheck.mjs:73-77`) and the twin is stale by design until the team-lead's commit-time regen | Step 4 acceptance rescoped: developer gates on `validate --strict` + the four *other* selfcheck gating checks; `gen-omni --check` is an **expected-RED known-deferred** state, explicitly **not** a bounce |
| MEDIUM-2 | M2 "re-run the existing gate battery" pulls in `char_pin`, which forbids the prod-source change a refactor *is* (`SKILL.md:49`) | M2 text scoped to `suite_green` + `mutation_floor`; added a clause that `char_pin` is **inapplicable** to M2 |
| MEDIUM-3 | M0 shipped as a full recipe, but its spec arm is unshipped dev-repo harness (AC-6-gated) | M0 reframed as a **named lifecycle position**, spec arm marked **not-yet-shipped / AC-6-gated** (like the M1/M3 stub) |
| MEDIUM-4 | AC-L6 architect rule text off-role ("update tests in the same pass") — the architect never writes tests | Step 2 content role-differentiated: solo/developer keep "update in same pass"; architect gets the **plan/done-check flag** framing + a role-fit grep that the off-role clause is absent from `architect.md` |
| boy-scout | ADR-37 missing from README `## Contents` (README.md:889 body, but Contents ends at 36) | Folded into Step 3 — add the ADR-37 Contents line alongside 38/39 |

Re-grounded against source before fixing: HIGH-1 confirmed at `selfcheck.mjs:73-77` (gating, not
informational) + `:54-63` (the documented false-positive precedent); MEDIUM-2 at `SKILL.md:49`. No open
questions remain.
