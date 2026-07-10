# Mine-Family Core

**Feature Spec:** `docs/specs/adhoc-MineFamilyCore/definition/tech-spec.md`

## Context

Consolidate the mine family's repeated blocks into one shared reference (P1), land the pilot
lessons and truthful records (P0), and add the new-target kickoff checklist (B4). Prose-shape
refactor of three shipped SKILL.mds + one new reference file + four record annotations + two
target-repo backlog rows. **Binding invariant: zero behavior change — a mine run before and after
follows identical rules.**

## Scope

In scope: the three files under `plugins/nexus/skills/` named below, the new
`references/mine-family-core.md`, the four stale meta-docs, the two target-repo backlogs, the
release bump. Out of scope: stack adapters, gate/stage semantics, binding-obligation sections
(byte-identical), intra-skill glance lists, the fifth mine's table row.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | the core reference file; content inventory below | |
| 2–4 | (none) | — | no | per-skill extraction edits per the disposition table | |
| 5 | (none) | — | no | four annotation lines + two backlog rows; anchors below | |
| 6 | evaluate-skill | Follow | no | targets: the three touched skills; lint layer + drift/pointer integrity focus | |
| 7 | release-plugin | Follow | no | PATCH (tech-spec Decision 3) | |

`Skill: None` steps are prose/doc edits with grep-checkable acceptance — no testable runtime
behavior anywhere in this pass (TDD `no` throughout).

## Extraction-disposition table (the de-duplication boundary — binding)

Every family block, its current homes, and where it lands. "Pointer" = the sibling keeps a 1–3
line load-bearing pointer (`read ../mine-verify-cover/references/mine-family-core.md §{section}`)
plus ONLY the listed per-skill deltas.

| Block | cover (`mine-verify-cover/SKILL.md`) | repo (`mine-verify-repo/SKILL.md`) | ref-model (`mine-reference-model/SKILL.md`) | Disposition |
|---|---|---|---|---|
| Execution topology (orchestrator-owns-spawning · staged background `general-purpose` agents · no-filesystem orchestrator · "launch = orchestrate stages") | §mine-from-spec mode → "Execution topology" (the canonical original) | §"Execution topology (who runs what)" — says "inherits", restates anyway | §"Execution topology" — same | **CORE canonical.** Deltas kept per skill: cover/from-spec — miners‖ then consolidate+skeptic, stages interleave with plan authoring; repo — metric agent → per-area miners‖ → consolidate+skeptic; ref-model — five extractors‖ → ONE consolidate+skeptic + the Entry-6 sizing note |
| Marginal-budget rail + report-on-halt | §Safety rails, bullets 1+3 | C6 bullets | R6 bullets | **CORE.** One pointer line each; C6/R6 keep their skill-specific prohibitions lists (the AC-anchored "four prohibitions") |
| Skeptic protocol (CONFIRMED/WRONG/IMPRECISE · must-RUN · drop-without-excerpt) | **n/a — STAYS** (cover's code-arm Verify is a *different mechanism*: mutation-gated code re-check, not the must-RUN protocol; critic F7) | C3 | R3 ("inherited unchanged from C3") | **CORE**, lifted from repo C3 / ref-model R3 (NOT from cover) + the two harvested clauses (vacuous-evidence check; merged-row audit note — tech-spec §Design). Deltas kept: repo — severity recalibration, cross-model seam; ref-model — invented-virtue framing, self-mode tech-debt cross-check; cover's from-spec mode — its distinct `verified \| ambiguous` grammar STAYS in cover untouched |
| Fact/judgment doctrine (unreproducible claim = judgment, never CONFIRMED) | implicit | C2 paragraph | R2 bullets | **CORE** one paragraph. The row schemas (C2's finding fields, R2's pattern fields) stay per skill |
| Registry invariants (provenance · `last_verified` · never-delete · append-only changelog · idempotent re-runs) | the Merge-paragraph invariant sentence inside `## SDD lifecycle` (≈:386–388) — **slimmed by Step 2** (critic F2); `## The rule registry` row grammar STAYS | C4 | R4 | **CORE.** Per-skill artifact schemas/paths stay |
| Refresh outcome grammar (resolved / still-active / superseded) | n/a (M-modes differ — untouched) | C5 refresh | R4 refresh | **CORE** grammar; per-skill triggers stay |
| Family table + sibling relationship rows | §Relationship table (**8 rows**, :413–420 — slim removes the 2 family rows, keeps 6: 4 adapters + kb-entry-schema + tdd) | intro "third mine" paragraph + relationship table | intro 4-row family table + relationship table | **CORE** owns the one family table (4 mines + from-spec mode: unit/ground truth/gate/output). Each skill keeps: a 1-line identity sentence + relationship rows ONLY for non-family skills (repo: graphify, improve-architecture, kb-entry-schema; ref-model: improve-skills non-consumer note) |
| Binding prompt obligations sections | **n/a — cover has none** (AC-4 vacuously true for cover; critic F8a) | AC-3-anchored | AC-2-anchored | **STAY — byte-identical** (tech-spec AC-4) |
| B4 kickoff checklist | pointer line (Step 2) | pointer line (Step 3) | pointer line (Step 4) | **NEW in CORE** (final section) + **wired-but-advisory**: one pointer line per skill at the run-launch area (tech-spec Decision; critic F5) |

## Domain Model Changes / Data Model Changes / Cross-Service Changes / Migration Notes

None (docs + skill prose only).

## Implementation Steps

### Step 1 — Author the core reference

Create `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`. Sections in
tech-spec §Design order; content = the canonical text lifted from the current homes per the
disposition table (lift, don't rewrite — the canonical sentences are already skeptic-hardened
prose; editorial changes invite semantic drift), plus the two harvested clauses and the B4
checklist (tech-spec §Design has both verbatim-ready). Target ≤140 lines. No frontmatter (it is a
reference file, not a skill).
Acceptance: AC-1 heading grep; AC-5 (`CAN fail`, `Merged from`); AC-7-checklist grep
(`stop-budget`).
Satisfies: AC-1, AC-5 (harvest), B4

### Step 2 — Extract from `mine-verify-cover/SKILL.md`

Per the disposition table: replace the from-spec-mode topology block with the pointer + its
staging delta; safety-rails bullets 1+3 → pointer line; **the Merge-paragraph registry-invariant
sentence (≈:386–388, "existing rows never deleted … appends a changelog entry … idempotent") →
pointer to core §registry-invariants** (the rest of `## SDD lifecycle` untouched — critic F2);
relationship table → keep only the 6 non-family rows + one pointer line to the core family table;
add the identity sentence; **add the B4 pointer line** at the from-spec run-launch area ("on a NEW
target, walk the core §kickoff checklist first"). Inside cover, pointers use the self-relative
form `references/mine-family-core.md` (critic F8c). The `verified | ambiguous` grammar, gate
battery, Minimize, Report, fact-tagging sections: untouched. Depends on Step 1.
Acceptance: AC-2 hits for this file; AC-3 signature greps (`capture the start`, `is the session
that owns spawning`, `appends a changelog entry`) return 0 hits in this file; the file shrinks
(sanity: `git diff --stat` shows net deletion).
Satisfies: AC-2, AC-3, B4

### Step 3 — Extract from `mine-verify-repo/SKILL.md`

Same treatment: topology → pointer + repo staging delta; C3 → pointer + severity-recalibration +
cross-model-seam deltas; C2 doctrine paragraph → pointer (schema stays); C4 invariants → pointer
(registry specifics stay); C5 → pointer for the outcome grammar (triggers + dispositions table
stay); C6 budget/report bullets → pointer (prohibitions stay); intro "third mine" paragraph →
identity sentence + pointer; relationship table → non-family rows only; **add the B4 pointer line**
at the pipeline/launch area. Binding obligations + safety-rails glance list untouched. Depends on
Step 1.
Acceptance: as Step 2, scoped to this file (signatures: `capture the start`, `is the session that
owns spawning`, `carried unchanged from ADR-43` → 0 hits here); AC-4 diff-empty on its binding
section.
Satisfies: AC-2, AC-3, AC-4, B4

### Step 4 — Extract from `mine-reference-model/SKILL.md`

Same treatment: topology → pointer + sizing note; R2 doctrine → pointer (pattern schema +
negative-claims-carry-their-zero stay — the latter is AC-anchored in its binding section); R3 →
pointer + flattery framing + self-mode cross-check; R4 → pointer for invariants + refresh grammar
(artifact sections stay); R6 → pointer for budget/report (read-only rule + prohibitions stay);
intro family table → REMOVED (core owns it), identity sentence + pointer; relationship table →
non-family rows only; **add the B4 pointer line** at the pipeline/launch area. Depends on Step 1.
Acceptance: as Step 2, scoped to this file (signatures: `is the session that owns spawning`,
`carried unchanged from ADR-43` → 0 hits here; `capture the start` never occurred here — critic
inventory); AC-4 diff-empty on its binding section; additionally the 4-row family table appears 0
times in this file and 1 time in the core.
Satisfies: AC-2, AC-3, AC-4, B4

### Step 5 — P0 record hygiene (four annotations + two backlog rows)

- `docs/skill-evals/2026-07-04-mine-verify-repo.md` — under the header block (anchor: line 6
  "Run artifacts consulted: NONE"), add one dated line: pilot executed 2026-07-04/05 →
  `docs/tech-debt/` (6 areas) in `omnishelf_flutter_app`; eval text below reflects the pre-pilot
  state.
- `docs/skill-evals/2026-07-05-mine-reference-model.md` — same shape: pilot executed 2026-07-05 →
  `docs/reference-model.md` (self-reference, runs 1–3) in `dotnet-microservices`.
- `docs/specs/adhoc-MineVerifyRepo/delivery/summary.md` (anchors: line 3 status line, line 51 "KG
  pilot") — dated addendum beginning **`pilot executed 2026-07-04/05 on omnishelf_flutter_app`**
  (contiguous date — the AC-6 grep target; critic F4), then: not KG as originally scoped, artifact
  path `docs/tech-debt/` (6 areas), refresh owner = operator, `last_verified: 2026-07-05`.
- `docs/specs/adhoc-MineReferenceModel/delivery/summary.md` (anchor: line 20 "OPERATOR ACTION
  REQUIRED") — dated addendum beginning **`pilot executed 2026-07-05 (self-reference on
  dotnet-microservices, runs 1–3)`** (contiguous date), then: superseded the originally-planned
  omnishelf-consumer parameters, artifact `docs/reference-model.md`, refresh owner = operator,
  `last_verified: 2026-07-05`.
- Backlog rows (target repos — permission prompts expected, proceed):
  `D:\Omnishelf\omnishelf_flutter_app\docs\backlog.md` → one row: run `mine-verify-repo` refresh
  (rows `last_verified: 2026-07-05`); `D:\src\dotnet-microservices\docs\skill-backlog.md` → one
  row: run `mine-reference-model` refresh (same stamp) — **that repo has no `docs/backlog.md`;
  `skill-backlog.md` is its live queue (critic F3)**. Match each file's existing row format.
- **Consumer repoint (critic F6):** `plugins/nexus/agents/team-lead.md:127` cites
  "mine-verify-cover's Execution topology" — a heading Steps 2–4 remove from the SKILL.md body.
  Repoint the citation to `mine-verify-cover references/mine-family-core.md §topology`, then
  regenerate the mirror: `node scripts/gen-commands.mjs nexus` (same commit).
- Annotations are dated addenda — never rewrite the original text (the record stays, same rule as
  the registries).
Acceptance: AC-6 grep `"pilot executed 2026-07-0"` hits all four files; AC-7 rows present;
`grep "mine-family-core" plugins/nexus/agents/team-lead.md plugins/nexus/commands/team-lead.md`
hits both.
Satisfies: AC-6, AC-7 (P0)

### Step 6 — Gates: lint, selfcheck, grep-diff, evaluate-skill

Run `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` and `node scripts/selfcheck.mjs` —
green. Run the AC-3 signature greps and record output in implementation.md. Then Follow
evaluate-skill over the three touched skills (focus: pointer integrity, no orphaned references,
frontmatter-body match); fix any finding above Low in this pass. Depends on Steps 1–4.
Acceptance: AC-8 (gates green; eval findings ≤ Low or fixed).
Satisfies: AC-8

### Step 7 — Release

Follow release-plugin: one bump after all edits land, PATCH (tech-spec Decision 3 — prose-shape
refactor, no behavior change); CHANGELOG one-liner: "mine-family core reference extracted
(topology/budget/skeptic/registry invariants consolidated) + pilot-lesson harvest + kickoff
checklist; records annotated". Commit bump with the change.
Acceptance: version bumped once; CI `plugin-release-check` green.
Satisfies: AC-8 (release half)

## Testing Strategy

No runtime behavior → no tests. Verification is the AC grep battery (Steps 2–6 acceptance) + the
repo's lint/selfcheck + the evaluate-skill pass. The load-bearing check is AC-3 (each canonical
signature sentence survives in exactly one shipped file) and AC-4 (binding sections byte-identical).

## KB Impact

None (`docs/kb/` has no entries covering skill structure).

## Decisions

Inherited from the tech-spec's table (core location, binding sections untouched, PATCH, target-repo
backlog rows, no fifth-mine row). Plan-level additions:

| Decision | Why | Rejected | Status |
|---|---|---|---|
| Lift canonical text verbatim, don't rewrite | the sentences are skeptic-hardened; editorial rewrites invite semantic drift the grep battery can't catch | fresh rewrite for style | decided |
| evaluate-skill scoped to pointer/structural integrity | full judgment rubric ×3 is disproportionate for a prose-shape refactor; the code-grounded critic covers the judgment layer | full rubric per skill | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2, live-tree greps): **GO-with-fixes** — full findings persisted to
`delivery/review-critic.md`. All eight folded into this revision:
F1 → AC-3 topology signature replaced with the discriminating long form (`is the session that owns
spawning`; short form collides with `conformance-review`); F2 → cover's Merge-paragraph invariant
sentence added to Step 2 + a cover-specific signature (`appends a changelog entry`) added to AC-3;
F3 → dotnet target corrected to `skill-backlog.md`; F4 → summary addenda re-worded to contiguous
`pilot executed {date}`; F5 → B4 ruled **wired-but-advisory** (one pointer line per skill, Steps
2–4; new tech-spec Decision row); F6 → team-lead.md repoint + command regen added to Step 5;
F7 → disposition row 3 corrected (cover's code-arm skeptic STAYS — different mechanism; core text
lifts from repo C3/ref-model R3); F8 → row/count/self-pointer corrections. Critic verified sound:
the P0 pilots-ran premise (artifacts on disk), all Step-5 anchors, the sibling-relative cache
path, and no stack-adapter signature collisions.
