# F6-MineMachineryHardening — Implementation Plan

**Feature Spec:** `docs/specs/F6-MineMachineryHardening/definition/tech-spec.md` (Status: Ready;
ADR-60 extracted)
**Slug:** `F6-MineMachineryHardening`
**Intent class:** Scoped (2 shipped skill files + 3 harness workflows + 1 new unit test + fixtures +
selfcheck mirror; one PATCH release)
**Release tier:** PATCH (default policy — shipped edits are a runbook line, a scoping-note fix, and a
disclosure sentence; owner may escalate)

## Context

The ratified proposal `docs/proposals/mine-machinery-hardening-2026-07.md` closes four verified
enforcement gaps in the mine family's Cover arm (R1 resume wiring, R2 evidence-into-row, R3
capability-contract check, R5 tier disclosure). R4 (ship the gates) is spike-gated and **not in this
plan**. All factual anchors below were grep-verified at plan time (2026-07-16); the census of verify
schemas, row serializers, and adapter capability tables was taken from live source this session.

## Scope

**In scope:** the four tech-spec work units R1/R2/R3/R5; contract-test coverage for the changed
serializers; the adversarial fixture proving R3's check can fail; one PATCH bump.

**Explicitly out of scope:**
- **R4** — `cover-gates.mjs` delivery, `RUNS_DIR` de-hardcoding (spike-gated; own ADR pending).
- **Spec-arm row changes** — `spec-cover*.workflow.js` / `merge.workflow.js` (see Decisions D3).
- **Adapter re-authoring** — no edits to the four `mine-verify-cover-*` adapter SKILL.md files (D1).
- **CI workflow changes** — `.github/workflows/plugin-release-check.yml` is untouched; the new test
  rides the existing `node --test tests/lint tests/unit` step (per the F6 definition review, C1).
- Any live mine run (build-only increment — see Testing Strategy for what a PASS does not prove).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Exact runbook/README text below | — (prose edit; no covering skill) |
| 2 | (none) | — | yes | Row shape D2; copy table below; test home `kb-write.test.mjs` | — (harness JS; pattern ref: existing kb-write tests) |
| 3 | (none) | — | yes | Parsing contract D1; fixture layout below | — (test code; pattern ref: `tests/unit/skill-lint.test.mjs`-style repo-reading tests) |
| 4 | (none) | — | no | Exact disclosure sentence below | — (prose edit; no covering skill) |
| 5 | release-plugin | Follow | no | PATCH; one bump after steps 1–4; regen not needed (no agent edits) | |

Steps 1–4 are honestly `None` — dev-repo harness JS and the plugin's own prose have no generative
skill (same disposition as adhoc-VwhSelfcheckAndPrinciple). `Skill: None` never waives TDD: steps 2
and 3 are `TDD: yes` — the developer invokes the `tdd` skill on them.

## Domain Model Changes

None (no consuming-app domain model; this is plugin prose + dev-repo machinery).

## Data Model Changes

None.

## Implementation Steps

### Step 1 — R1: wire the resume into the runbook

`Satisfies: R1` (tech-spec work unit; proposal R1).

Files:
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — add one bullet to the
  shared safety-rails list (the list containing the *"Report on halt"* bullet):

  > - **Capture the `runId` at launch; resume, don't restart** — a `Workflow` launch returns a
  >   `runId`; on a kill or hang, relaunch with `Workflow({scriptPath, resumeFromRunId})` — the
  >   unchanged `agent()` prefix replays from cache and only live work re-runs. Same-session only: a
  >   run killed today cannot be resumed tomorrow, so resume immediately or write the loss off.

- `harness/README.md` — add a short "Resume" note in the Running section: capture `runId`, relaunch
  with `resumeFromRunId` (proven 2026-06-23: the ReviewInvitation run resumed past a fixed budget
  gate, replaying Mine→Verify, ~193k tokens saved).

Wording is adjustable; the **binding tokens** are `runId`, `resumeFromRunId`, and the same-session
cap being stated.

**Accept (executed at plan time — both currently 0 hits):**
`grep -c resumeFromRunId plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` ≥ 1;
`grep -c resumeFromRunId harness/README.md` ≥ 1; the core bullet contains "same-session".

### Step 2 — R2: thread the skeptic's evidence into the KB row

`Satisfies: R2` (tech-spec work unit; proposal R2).

**Copy table — every verify-schema / row-serializer copy, with disposition** (census taken from live
source at plan time; the acceptance suite covers exactly the `edit` rows):

| Copy | file:line | Disposition |
|---|---|---|
| `BATCH_VERDICT_SCHEMA` (source of truth, delegated path) | `harness/mine-verify.workflow.js:122-134` | edit: `minLength: 1` on `evidence` |
| consensus return map (currently strips `evidence`) | `harness/mine-verify.workflow.js:311` | edit: carry per-rule `evidence` through |
| `BATCH_VERDICT_SCHEMA` (dormant monolith copy) | `harness/loop.workflow.js:388` | edit: same `minLength` (must not drift) |
| monolith `consensusRules` mapping (strips `evidence` into `interpretiveVerdicts`) | `harness/loop.workflow.js:411` | edit: carry `evidence` per rule |
| `buildRulesSection` — **source of truth** (the lib `kb-write.test.mjs` imports) | `harness/lib/kb-write.mjs:68` | edit: emit excerpt sub-bullet (D2) |
| `buildRulesSection` — inline runtime mirror (the Workflow runtime cannot import the lib) | `harness/loop.workflow.js:245` | edit: same change; keep **byte-identical** to the lib |
| `serializeKb` row serializer (currently untested; exists **inline-only**) | `harness/loop-flutter.workflow.js:88-110` | edit: first extract to `harness/lib/` (mirror the `kb-write.mjs` lib + inline-mirror pattern), emit excerpt sub-bullet (D2) in both, test the lib |
| `serializeDiff` (spec arm) | `spec-cover.workflow.js:139` / `spec-cover-calc.workflow.js:144` | DO NOT TOUCH (D3) |
| `renderRegistry` / `distillRegistry` (merge registry) | `harness/merge.workflow.js:323,430` | DO NOT TOUCH (D3) |

Row shape (D2, binding prefix): each rule row gains one indented sub-bullet
`  - verify: {excerpt}` — single line, ≤200 chars, sanitized the same way statements are (see the
existing sanitize behavior pinned by `kb-write.test.mjs:220`). Rules whose verdict path carries no
evidence (transcribed rules — `mine-verify.workflow.js:212`) emit no sub-bullet.

Also in this step: `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md:112-114` —
replace the cover-arm exemption (*"not a consumer of this section"*) with the cover arm's row
obligation: the code-arm rule-verify carries the excerpt into the registry row; the mutation gate
remains the arm's *test* verification, distinct from this row obligation. Keep the mine-from-spec
grammar exemption intact.

**Accept:** extended `tests/unit/kb-write.test.mjs`: `buildRulesSection` emits
`  - verify: {excerpt}` for a rule with evidence and no sub-bullet for one without; new equivalent
assertions for the extracted `serializeKb` lib; the `kb-write.mjs` lib and its `loop.workflow.js`
inline mirror stay **byte-identical** (the test imports the lib; the runtime executes the mirror —
same for the new `serializeKb` lib + its `loop-flutter` mirror); offline contract suite green
(`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`); `grep -n "minLength"
harness/mine-verify.workflow.js harness/loop.workflow.js` hits both schema copies; the core scoping
note names the cover arm's row obligation. Inspect one serializer *output string* in the test —
never a prompt.

### Step 3 — R3: the capability-contract conformance test (ADR-60)

`Satisfies: R3 / ADR-60`.

Files:
- `tests/unit/capability-contract.test.mjs` (new) — reads the method contract and the four adapters
  from the repo, asserts conformance per the D1 parsing contract:
  - method side: the 5 capability names from
    `plugins/nexus/skills/mine-verify-cover/SKILL.md:345-349` (Evidence indexer, Test runner,
    Mutation tool, Test-style contract, Prod-source-diff scoping);
  - adapter side: for each of `plugins/nexus-{dotnet,php,cpp,flutter}/skills/mine-verify-cover-*/
    SKILL.md`, locate the heading matching `^## The 5 capabilities, filled for ` (prefix match —
    suffix varies per stack), parse the following markdown table **by column position** (2nd column;
    header text varies: `.NET fill` / `PHP fill` / `C/C++ fill` / `Dart/Flutter fill`), generic
    separator-row match;
  - per-capability fill rules (D1): capabilities 2–5 require ≥1 backticked token that is not a bare
    file extension (`^\.\w+$`); capability 1 (Evidence indexer) additionally accepts the recorded
    prose idiom `/reads the target .{0,40}directly/` (3 of 4 adapters legitimately fill it that way;
    only cpp names `toolchain/index_slice.py`); every cell must be non-empty and not a placeholder
    (`—`, `TBD`, `TODO`, `n/a`).
- `tests/fixtures/capability-contract/broken-adapter/SKILL.md` (new) — an adapter table with one
  missing executor; the test asserts the checker **fails** on it (the can-fail proof).
- `scripts/selfcheck.mjs` — no new logic: the existing check #1 (`node --test`) already runs the new
  test; add one line to the header comment's check list naming capability-contract as covered by
  check #1, so the local mirror's inventory stays honest.

**Accept:** `node --test tests/unit/capability-contract.test.mjs` green against the four real
adapters; the broken-fixture assertion proves failability; full suite green. Note: bold-marker
variants (`**mull-15**`) exist in adapter prose — the parser must not require bold, only backticks,
per the plan-time census.

### Step 4 — R5: disclose the clean-room tier in the shipped text

`Satisfies: R5`.

File: `plugins/nexus/skills/mine-verify-cover/SKILL.md` — insert immediately after the Mine stage's
clean-room description (the `3 clean-room miners read ONLY the one source class` text, ~line 26),
this sentence (verbatim — it is the grep gate):

> **Tier disclosure:** the miner clean-room is **prompt-enforced** — the Workflow tool's `agent()`
> exposes no tool-restriction option, so "reads ONLY the inline slice/class" is an instruction the
> model is asked to follow, not a mechanical guarantee; weigh a run's clean-room claim accordingly.
> A mechanical seal is pending upstream platform support.

Shipped-text self-containment: no dev-repo document references (no proposal/ADR pointers) — the
disclosure carries its own load-bearing content.

**Accept (executed at plan time — currently 0 hits):**
`grep -c "prompt-enforced" plugins/nexus/skills/mine-verify-cover/SKILL.md` = 1, located in the Mine
stage section (not §Substrate).

### Step 5 — Release: one PATCH bump

`Satisfies:` tech-spec Target-surfaces bump policy. **Follow release-plugin.**

Inputs: shipped edits = `plugins/nexus/skills/mine-verify-cover/SKILL.md` +
`references/mine-family-core.md` (steps 1, 2, 4) → one PATCH bump of `nexus`, run **once after
steps 1–4 are complete**, never per-step. No agent files change → no `gen-commands` regen. Check the
dry-run's reasons list names only F6 files (the tree was clean at session start; docs/ edits don't
bump). Steps 2–3's harness/tests/scripts edits are dev-repo only and trigger no bump.

**Accept:** `node scripts/bump-plugin.mjs --dry-run` proposes PATCH for `nexus` citing only F6
shipped files; bump applied; full suite green.

## Cross-Service Changes

None.

## Migration Notes

None.

## Testing Strategy

All verification is **offline**: the extended `kb-write.test.mjs`, the new
`capability-contract.test.mjs` (+ broken fixture), and the full `node --test` suite. **What a PASS
does not prove:** no live mine run exercises the excerpt end-to-end (the next real Cover run is the
operator's arm, and R1's kill-resume residual is likewise operator-verified on the next killed run —
both recorded as non-gating in the tech-spec). A live-launch validation step is deliberately absent:
the developer has no `Workflow` primitive (operator-owed by construction).

## KB Impact

None — no `docs/kb/` entries exist for the harness; the registry-row shape change is documented in
the tech-spec and `mine-family-core.md` itself.

## Decisions

| # | Decision | Why | Rejected alternative | Status |
|---|---|---|---|---|
| D1 | R3 parsing contract: heading prefix match; table column-by-position; caps 2–5 need a non-extension backticked executor; cap 1 also accepts the `reads the target … directly` idiom; placeholders rejected | Executed against all 4 real adapters at plan time: passes 4/4 today, fails on the broken fixture; deterministic without touching shipped adapters | Re-author 4 adapter tables with machine markers (4 plugin bumps, scope growth); bare non-empty-cell check (vacuous — the critic's named trap) | decided |
| D2 | Row shape: indented sub-bullet `  - verify: {excerpt}`, single line, ≤200 chars, statement-style sanitization; transcribed rules emit none | Human-auditable in the row (the point of R2); bounded (never transcripts); reuses the existing sanitize path | HTML-comment metadata (invisible to the human reader); full transcript blocks (proposal forbids) | decided |
| D3 | Spec-arm serializers and the merge registry are DO-NOT-TOUCH | Plan-time census: spec-arm grammar is `label`/`route` with no `verdict` field; merge's registry carries citation/attestation *pointers* by design (`merge.workflow.js:203-205`), and `mine-family-core.md` explicitly keeps mine-from-spec's grammar untouched | Force excerpts into merge rows (breaks its evidence model; scope growth into a different arm) | decided |
| D4 | R5 wording is shipped-safe: no dev-repo document pointers in the shipped sentence | Shipped text is self-contained (consuming repos have no `docs/proposals/`); the load-bearing content is inline | Citing `mine-family-next-wave-2026-07.md` / ADR-13 in the shipped skill (dangling references downstream) | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2, 2026-07-16): **GO-with-fixes** — 1 HIGH, 1 MEDIUM, 1 LOW, all folded:

- **H1 (folded):** the Step-2 copy table listed only `buildRulesSection`'s inline runtime mirror
  (`loop.workflow.js:245`) and omitted its **source of truth** `harness/lib/kb-write.mjs:68` — the
  file the R2 test actually imports. Both are now `edit` rows with an explicit byte-identical
  parity requirement (no automated sync guards the pair).
- **M1 (folded):** `serializeKb` exists inline-only and a Workflow script cannot be imported by
  `node:test` — the extraction to `harness/lib/` (lib + inline-mirror pattern) is now an explicit
  sub-task, not implied work.
- **L1 (folded):** `distillRegistry` citation corrected `:451` → `:430`.

All other anchors verified live by the critic: the copy-table lines, the evidence-strip claim at
`mine-verify.workflow.js:311`, D1 passing 4/4 real adapters and failing the fixture, all three grep
gates currently 0-hit, version 1.34.6 with no hard-coded version in the plan, the R4 fence, and the
`Satisfies:`/`## Decisions` hygiene gates.
