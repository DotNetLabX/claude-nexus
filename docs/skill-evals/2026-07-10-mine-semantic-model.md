# Skill Evaluation — mine-semantic-model

**Evaluator:** developer (adhoc-MineSemanticModel, Step 3 post-authoring gate)
**Date:** 2026-07-10
**Scope read:** `plugins/nexus/skills/mine-semantic-model/SKILL.md` (new, v1 — authored this pass) +
`references/probe-catalog.md`, `references/interview-protocol.md`, `references/output-contract.md`,
`references/project-profile.md` (all new, v1) + `probes/*.sql` (7 files, byte-for-byte lift from
`D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\`). Cross-checked against
`docs/specs/adhoc-MineSemanticModel/definition/tech-spec.md` (AC-1..AC-10), `delivery/plan.md`
(Steps 1-3), `delivery/review-critic.md` (GO-with-fixes, H1/H2/M1/M2/M3/L1/L2 — all adopted into
the plan), and the KG source package this promotion lifts from.
**Run artifacts consulted:** none — this is a design-time method skill; it has not run against a
live datasource yet in this or any consuming repo (the KG project's own piloted run, F52, is the
prior-art evidence this promotion is grounded in, per the tech-spec's Definition Review). This
evaluation therefore judges the **spec-as-written** against the rubric, not runtime behavior.
**Layer 0 (lint):** `skill-lint.mjs plugins/nexus/skills/mine-semantic-model` → `OK
mine-semantic-model (with warnings)`, 0 errors, 3 W4 nested-reference warnings (see F3).

## F1: Inherited internal `AC-N` citations collided with this promotion's own tech-spec `AC-N` ids

**Severity:** Medium
**Layer:** Layer 1.4 (citation audit) / Layer 2.1 (one concept once)
**Claim vs reality:** The KG-original text cites its own internal acceptance-criteria numbering
inline (`AC-2`, `AC-4`, `AC-6`, `AC-7`, `AC-10`) as load-bearing cross-references (e.g.
"`BR10/AC-6`'s idempotence run", "`AC-4` coverage check", "BOM check (`AC-10`)"). None of these ids
resolve to anything that ships with this skill — the KG spec document that originally defined them
is not part of the package. Worse, **this promotion's own tech-spec independently defines AC-1
through AC-10 with different meanings for the same numbers** (e.g. this skill's internal `AC-6`
means "idempotence run"; the tech-spec's `AC-6` means "KG-token scoping"; the skill's internal
`AC-4` means "ledger-coverage count"; the tech-spec's `AC-4` means "profile-template keyword
sweep"). A reader of the shipped skill in ANY consuming repo would have no way to resolve these
numbers — and in this repo specifically, they'd resolve to the wrong document's ACs by coincidence
of number reuse. Exact pre-fix occurrences (grep `AC-\d+` across the shipped folder): `SKILL.md:132`,
`references/probe-catalog.md:31`, `references/interview-protocol.md:17,19`,
`references/output-contract.md:11,85,93,151` — 8 hits across 4 files.
**Fix:** Removed every `AC-N` numeric citation from the shipped body text, replacing each with a
plain-prose description of the same check (e.g. "the ledger-coverage check" instead of "the AC-4
coverage check"; "the mechanical proof behind BR10's idempotence run" instead of
"BR10/AC-6's idempotence run"). BR-ids were left untouched — the tech-spec's own Decisions table
explicitly sanctions keeping BR1–BR13 numbering as load-bearing cross-references; it never sanctions
carrying forward the KG spec's separate, non-shipping AC numbering. **Applied in this pass** (before
Step 4) — re-verified: `grep -rn 'AC-[0-9]' plugins/nexus/skills/mine-semantic-model` → 0 hits;
`skill-lint.mjs` still exits 0 after the edit.

## F2: External-system claims (EXPLAIN JSON shape, `information_schema` behavior, `pg_stat_user_tables`) are inherited, not independently re-verified in this pass

**Severity:** Low
**Layer:** Layer 1.3 (external-system claims verified live or cited)
**Claim vs reality:** `references/probe-catalog.md`'s EXPLAIN cost-gate section and
`probes/usage-heat.sql`'s `pg_stat_user_tables` claims (counters reset on `pg_stat_reset()`,
catalog view = no table scan) are carried forward from the KG source without a fresh live-Postgres
check in this promotion session.
**Fix:** Not fixed — correctly out of scope. The tech-spec's Definition Review explicitly addresses
this: "the BR obligations are lifted verbatim from KG's already-piloted skill (piloted F52, reviewed
twice), not newly-authored rule text; no new rule-shaped behavior is born in this slug" — the
verification already happened at the source pilot, and re-verifying Postgres catalog-view semantics
from first principles is not this promotion's job. Noted for completeness per the rubric's Layer 1.3
instruction, not routed as a carry-over.

## F3: Three cross-references nest one level past the references/-flat canon (W4)

**Severity:** Low
**Layer:** Layer 0 / Layer 2.1
**Claim vs reality:** `skill-lint.mjs` W4 flags: `references/project-profile.md` cites
`references/probe-catalog.md` (the runner-invocation pointer, item 10); `references/interview-protocol.md`
and `references/output-contract.md` cite each other (the ledger-entry example / question-recording
loop — each is the natural target of the other's "see also"). All three are genuine, non-circular
content pointers inherited from the KG original's own cross-reference shape, not an accidental deep
chain.
**Fix:** Not fixed — these are legitimate two-node references, not a multi-hop chain; flattening
`interview-protocol.md` ↔ `output-contract.md`'s mutual pointer would require duplicating the
ledger-entry JSON shape or the question-recording rule into both files (drift risk, the opposite of
W4's intent). `skill-lint.mjs`'s own dogfood test (`tests/unit/skill-lint.test.mjs`) treats W4 as a
non-blocking WARN by design for exactly this reason. Routed as a Low, accepted-as-is.

## F4: The "does NOT do" scope fence names lanes, not adjacent skills

**Severity:** Low
**Layer:** Layer 1.5 (scope fence names its adjacent skills)
**Claim vs reality:** "## What this skill does NOT do" enumerates write-lane boundaries (BR7/BR8)
but does not explicitly name sibling mine-family skills and what THEY do instead (e.g. "does not
mutation-test code — `mine-verify-cover`'s job"). The adjacency is covered elsewhere (the
"Relationship to the mine family" section states the family table pointer and this skill's
differentiator), so the information exists, just not co-located with the "does NOT do" list the way
some sibling skills structure it.
**Fix:** Not fixed — deliberately deferred. The plan's Step 3 authoring instructions enumerate
exactly what "does NOT do" must generalize (BR7/BR8 items, the lane-id genericization, the two
"keep" sentences) and do not request an adjacent-skills cross-reference there; adding one is
polish beyond the plan's specified content, and the "Relationship to the mine family" section
already discharges the adjacency-naming intent the rubric item is checking for. Routed as a Low
carry-over if a future pass wants the two sections merged for symmetry with other family members.

## Verdict

**ACCEPT** (fix-then-accept, F1 applied in this pass). No Critical/High findings. One Medium (F1)
was fixed before Step 4, per the plan's instruction to fold evaluate-skill's findings before
registering the family member. Two Low findings (F2, F3) are correctly out of scope / by-design.
One Low (F4) is routed as a carry-over for a future consolidating pass across the family, not a
defect in this promotion.

## Rubric items checked clean

- **Layer 1.1 — frontmatter promise = body.** Every `description` capability (build/refresh/audit,
  five-phase Mine→Probe→Ground→Interview→Emit+Validate, per-project-profile parameterization,
  operator-triggered/never-ambient) is implemented in the body (Phase 0 + the five phases + Run
  modes + the profile pointer throughout).
- **Layer 1.2 — guardrail claims have mechanisms.** "Never invoked passively from an ambient
  mention" is backed by `disable-model-invocation: true` in frontmatter, not just prose; "the skill
  never commits, either repo" (BR8) is backed by the absence of any git-command step across all five
  Phase-5 sub-steps; "a missing profile is never silently defaulted" (AC-7's signature) is backed by
  Phase 0's structural precondition (Phase 1 is stated to never start before profile resolution),
  not just the sentence itself.
- **Layer 1.6 — known failure modes encoded.** The KG pilot's own review-cycle-1 fixes (bare-`TRUE`
  tautology bypass on large-table probes, the orphan-rate denominator bug, the CROSS-JOIN-drops-
  empty-scope bug) are preserved as the "Large table policy" shape-check language and the
  probes/*.sql comments themselves (unedited, byte-for-byte) — the failure modes travel with the
  artifact that encodes the fix, not just a lessons file.
- **Layer 2.2 — mechanical checks over exhortation.** The obligations table ties every BR to a
  concrete enforcement mechanism (a runner refusal, a grep, a structural precondition), not prose
  "be careful" — matches the KG original's own discipline, preserved through genericization.
- **Layer 2.4 — steps followable cold.** The Procedure section's five phases are ordered,
  self-contained, and each cites the exact profile item number it depends on (no forward references
  to un-introduced concepts).
- **Layer 2.5 — no AP1/AP4/AP5/AP6 anti-patterns.** No hardcoded inventory that will rot (the
  large-table names/counts live only in the profile's worked example, correctly treated as
  project-specific data, not method text); no fictional path (`docs/semantic-model/profile.md` is
  explicitly framed as "read it; if missing, run intake" — never claimed to already exist); a
  finalize/resume path exists for the one genuinely long-running gate (Phase 4's interview) via the
  `OPERATOR ACTION REQUIRED` + `interview({date})` provenance resume mechanism.
- **Layer 4.1 — lessons-capture instruction present.** "Discovered a defect while running this
  skill?" paragraph in "What this skill does NOT do" routes to `lessons.md` (in-pipeline) or the
  skill's own `CHANGELOG.md` (standalone).
