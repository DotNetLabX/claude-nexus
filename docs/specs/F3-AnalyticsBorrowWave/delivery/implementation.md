# F3 increment 0 — port the feedback-loop layer into shipped `mine-semantic-model` — Implementation

Port of the KG project-local `mine-semantic-model` feedback-loop layer into the shipped plugin skill
at `plugins/nexus-analytics/skills/mine-semantic-model/`, generalized per the plan's binding ground
rules (no KG tokens outside `references/project-profile.md`'s worked example; no tooling ships;
fail-closed posture intact). Reference (read-only): `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\`.

## Files Created
- `plugins/nexus-analytics/skills/mine-semantic-model/references/feedback-ledger.md` — new
  generalized whole-file port of KG's feedback-ledger reference (Step 3).

## Files Modified

### Step 1 — `references/output-contract.md` (Schema v2 + Audit mode + Feedback-dispositions + Findings)
- **Origin enum bullet** (1.1): extended the closed token list with `code({ref})` (now six tokens)
  and added the code-origin caveat sentence ("attests what the code *intends*, not a fact verified
  against running data"). Header tag now reads `(BR5, closed; Schema v2 adds code({ref}))`. Generic
  example `code(OrderWriter.settledAt)` (KG's `AnalyticsReport.scopeIsAutocompleted` not ported).
- **Precedence chain** (1.1): inserted `code({ref})` as entry 4 (ranks below `data-derived`, above
  `schema-derived`); `schema-derived` renumbered to 5. Precedence is now
  `interview > kb > data-derived > code > schema-derived`; `carried` stays outside precedence.
- **New `### Schema v2 (structured verification dates + confirmed-in-use accretion)` section** (1.2):
  inserted after the "Ledger-coverage check" bullet, before `### Who reads the ledger`. Covers
  `verified: YYYY-MM-DD` (entry- and `fields`-scalar-level; both shape rules; the inline `(BR-F)`
  tag on the "`code({ref})`-primary entry never receives `verified`" rule retained; `carried({baseline})`
  rows stay undated), `confirmed-in-use: [{date, ref}]` (appendable discrete facts, never a scalar
  score — BR-E; runtime-served-grounding-root wording replacing KG's `read_reference`), `deprecated`
  (generic lifecycle-flag example, KG's flat-hierarchy example not ported), and the "v2 does NOT
  bless `+`-composition" rule (migration generalized to a "project-side one-time migration"; the
  structural composed-vs-prose definition now points at the profile's item-10 validation attestation,
  NOT KG's `tools/migrate-provenance-v2.*`/`tools/validate-provenance.*` — critic HIGH-1).
- **Run-report template** (1.3): mode enum `{mode: Bootstrap|Refresh}` → `{mode: Bootstrap|Refresh|Audit}`;
  inserted the mandatory `## Feedback dispositions (BR-C — mandatory, every run)` table (closed set
  `{probed | grounded | asked | still-open}` + the explicit `none open` line; ledger path generalized
  to "the profile's item-11 location") after `## Hypotheses`; appended `## Findings / follow-ups`
  required section at the template tail (the Step 5.9 defect-log repoint target — critic HIGH-2).

### Step 2 — `references/interview-protocol.md` (v2 answer-recording shapes)
- Replaced the flattened orphan example (`{ "origin": ..., "question": "Q3", ... }`) under
  `## Recording answers` with the v2 per-construct-object shapes: keyed by construct id,
  `origin: interview({date})`, `verified` lifted from the same date ("the interview date IS the
  verification date"). Both examples present — whole-construct and field-scoped (the field-scoped
  one shows `carried({baseline})` at entry level with the interview-dated scalar inside `fields`).
  Removes the pre-F60 `"question": "Q3"` shape (Step 6.1 zero-check target).

### Step 4 — `references/project-profile.md` (eleventh input + item-10 attestation + worked example)
- **Intro + heading** (4.1): "ten inputs" → "eleven inputs" in three spots (intro ×2 + the
  `## The eleven inputs` heading).
- **Item 10 attestation extended** (4.3): the runner attestation now also covers the project's
  provenance-schema validation (Schema v2 grammar: no numeric/boolean confidence leaves — BR-E;
  `verified`-shape + truthful-date — BR-F; single-primary origins), invoked at Phase-5 step 6,
  non-zero exit blocks (BR6 extended). Either/or absence case spelled out: a profile MAY declare "no
  provenance validator" → BR-E/BR-F contract-bound and disclosed, Gate result records
  `provenance validation: none declared (BR-E/BR-F contract-bound only)`, never silent (critic MEDIUM-1).
- **New input 11** (4.2): Model-feedback ledger location (proposed default `docs/model-feedback/{area}.md`,
  sibling of the run-report dir, never under bundle root — BR-A) + optional staleness-threshold
  (days) sub-field feeding Audit leg 3's stale band (undeclared → merges into sampled/pilot band).
- **Worked example** (4.4, KG tokens allowed here): item 10 gains `tools/validate-provenance.cs`
  attestation lines (v2-grammar validator, numeric-leaf scan, invoked Phase-5 step 6); new worked
  item 11 = `docs/model-feedback/{area}.md` (KG's F60 feature; staleness threshold
  `SemanticModel:StalenessThresholdDays`).

### Step 5 — `SKILL.md` (obligations rows + phase/leg insertions)
- **Phase 0** (5.1): "the ten profile inputs" → "the eleven profile inputs".
- **Phase 1 new step 4** (5.2): read the profile's model-feedback ledger (item 11) for the target
  area if it exists; every open entry joins the run's hypothesis set, never silently skipped. Item-11
  location is the binding source; `docs/model-feedback/{area}.md` named once as the proposed default.
- **Phase 3 new step 0** (5.3): the ledger read FIRST — an open entry IS the hypothesis; ground it
  like any probe-raised hypothesis ("steps 1-2 below" — the plugin's Phase 3 has two steps, not KG's
  three), then record its disposition. Intro extended to include "every open model-feedback ledger
  entry carried in from Phase 1"; closing paragraph adds the BR-C disposition sentence + `none open`.
- **Phase 5 new step 6** (5.4): run the profile's provenance-schema validation (item 10 attestation);
  non-zero exit blocks (BR6 extended); the item-10 absence case records
  `provenance validation: none declared (BR-E/BR-F contract-bound only)` in the Gate result and continues.
- **Audit new leg 0** (5.5): before the four legs, read the area's ledger; every open entry is a
  mandatory hypothesis with a BR-C disposition (the only path the ledger reaches an Audit run).
  **BR10 reconciliation** (5.5): Idempotence-invariant sentence extended — an open ledger entry is
  *new input*, so consuming it is not an idempotence violation; after closure, a repeat run is again
  a strict no-op.
- **Audit leg 3 data-grounded ordering** (5.6): flat class list replaced by the ordered sequence
  (undated-and-never-confirmed → stale-dated [staleness threshold item 11; undeclared merges into
  next] → sampled/pilot-only → heavily-confirmed last); the existing refutation classes retained verbatim.
- **Obligations table** (5.7): appended BR-A..BR-H rows (no `(F60)` tags — generalized); BR-E/BR-F
  Enforced-by columns annotate the validator-absence case.
- **References section** (5.8): added the `references/feedback-ledger.md` line.
- **Standalone defect-log repoint** (5.9): "append an entry to this skill's own `CHANGELOG.md`" →
  "record it in the run report's `## Findings / follow-ups` section" (the plugin cache is read-only;
  the target section is added by Step 1.3 in this same increment).

### Post done-check fixes (architect, 2026-07-17)
- `probes/orphan-fk-fanout.sql:8` — reworded a **pre-existing** foreign feature-id in a comment:
  "caught live during the F52 Step 6 dry-run against the" → "caught live during the KG pilot's
  dry-run against the". Provenance story preserved; "KG pilot" phrasing is sanctioned style
  (SKILL.md BR4 row), foreign feature-ids are not (F38 is the one id SKILL.md carries; `probes/`
  files carry none). Caught only because the corrected sweep spans all file types (see re-verify).
- `references/feedback-ledger.md` `grounded` disposition bullet — reworded KG-flavored Phase-3
  vocabulary "the KB or analytics reference already had the answer" → "the profile's KB hub(s)
  already had the answer (Phase 3 Ground, BR3); no new probe was needed" (matches the plugin's
  Phase-3 vocabulary — the profile's KB hub(s), not KG's "analytics reference"). Not a token
  removal — a vocabulary-generalization polish.

### Post Step-2 review folds (reviewer LOW, 2026-07-17)
Reviewer APPROVED (no blocking findings); two LOW one-liners folded before the release commit so
they ride the same MINOR:
- `SKILL.md` Phase-5 step 4 — appended KG's reinforcing clause so the one unported F60 delta lands:
  "...per `references/output-contract.md`, including its mandatory `## Feedback dispositions` section
  (BR-C)." Ties the Phase-5 emit explicitly back to the mandatory section.
- `references/output-contract.md` `deprecated` bullet — dropped ", established shape":
  "(optional, established shape, formally documented here)" → "(optional, formally documented here)"
  ("established" implied a usage history a generic consuming project doesn't have).
- **NOT touched:** the SR-n ids / "review cycle" phrases (reviewer LOW-1) — explicitly deferred
  follow-up, out of this increment.

## Key Decisions
- **Generic examples for ported KG-specific illustrations.** `code(OrderWriter.settledAt)` (enum),
  `legacy status flag retired next release; superseded by the lifecycle-state column` (deprecated) —
  read native, carry no KG tokens. KG's own examples deliberately left in KG per binding ground rule 1.
- **`read_reference` scrubbed to "a runtime-served grounding root"** everywhere in ported text
  (critic HIGH-1); the plugin has zero `read_reference` today and must stay at zero.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | prose/markdown contract-file port; plan has no Skill Mapping (no pattern skill fits editing a shipped skill's contract files); no testable code behavior (verification is Step 6 greps + skill-lint + repo tests) |

## Deviations from Plan
- **Step 6.3 test command — glob form instead of the plan's literal `node --test tests/`.** The
  bare-directory form errors `MODULE_NOT_FOUND: tests` on this repo's Node (v24.18.0); the repo's
  own `tests/README.md` (lines 63-66) documents that the bare-dir form regressed on Node ≥22 and
  mandates the glob form. Ran the documented CI hard gate instead:
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → 536 pass / 0 fail. The plan's
  acceptance intent (lint/enforcement tests that read shipped skills, green) is fully satisfied;
  only the literal invocation string differed. (Flagged to the reviewer/architect: the plan's
  Step 6.3 acceptance line should be updated to the glob form for future runs.)
- **Generic illustrative examples** used where the plan required generalization but KG's own
  example had to stay in KG: `code(OrderWriter.settledAt)` (origin-enum example),
  `legacy status flag retired next release; superseded by the lifecycle-state column` (deprecated
  example). Both read native and carry no forbidden KG tokens. Not a scope deviation — the plan
  explicitly required generic examples here (Steps 1.1, 1.2).

## Verification (Step 6 — actual results)

### 6.1 Acceptance greps (scoped to `plugins/nexus-analytics/skills/mine-semantic-model/`)
**Six markers — all non-zero and in the required files:**
| Marker | Per-file counts | Required-file check |
|--------|-----------------|---------------------|
| `Schema v2` | output-contract 3, SKILL.md 2, project-profile 1 | output-contract ✓ |
| `confirmed-in-use` | output-contract 2, SKILL.md 4 | non-zero ✓ |
| `BR-C` | SKILL.md 3, output-contract 1, feedback-ledger 1 | SKILL.md + output-contract ✓ |
| `BR-F` | SKILL.md 3, output-contract 1, project-profile 4 | SKILL.md + output-contract ✓ |
| `feedback-ledger` | SKILL.md 5, output-contract 1, project-profile 1 | SKILL.md references + BR rows ✓ |
| `model-feedback` | SKILL.md 7, project-profile 3, feedback-ledger 5 | SKILL.md + project-profile + feedback-ledger ✓ |
| `Findings / follow-ups` | output-contract 1, SKILL.md 1 | output-contract AND SKILL.md ✓ |

**Extended KG-token sweep** (`F60|F52|F41|laurentiu_read|kg_seed|kg_god_ro|fmcg_platform|omniaz|omnishelf|OD hub|seed/db/|Cortex|MSM_PROBE_DSN|StalenessThresholdDays|read_reference|migrate-provenance|validate-provenance|F38`):
- **All hits confined to allowed locations.** `project-profile.md` hits are all at lines 74-133 —
  inside the worked example (heading at line 68); the template section (lines 13-67) is token-clean.
  `SKILL.md` hits are only `F38` at lines 14-15 (the origin note). No hits in output-contract.md,
  interview-protocol.md, feedback-ledger.md, or probe-catalog.md.
- **Zero-everywhere:** `read_reference` = 0, `migrate-provenance` = 0. ✓
- **File-scoped allowances honored:** `validate-provenance` only at project-profile.md:127 (worked
  example); `StalenessThresholdDays` only at project-profile.md:133 (worked example); `F38` only in
  project-profile.md worked example + SKILL.md origin note; `F60` only at project-profile.md:132
  (worked example); everything else (F52/F41/laurentiu_read/kg_seed/kg_god_ro/fmcg_platform/omniaz/
  omnishelf/OD hub/seed/db//Cortex/MSM_PROBE_DSN) = 0 outside the worked example. ✓

**Targeted zero-checks:**
- `carried(F38)` = 0 in output-contract.md, interview-protocol.md, feedback-ledger.md ✓
  (ported sections carry `carried({baseline})`).
- Pre-F60 flattened answer shape `"question": "Q3"` = 0 everywhere ✓.

### 6.2 skill-lint
`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/mine-semantic-model`
→ **`OK mine-semantic-model (with warnings)`, exit 0. 0 ERROR.** 6 WARN, all the same
nested-reference advisory class (references cite one another one level too deep — e.g.
`output-contract.md` ↔ `feedback-ledger.md`, `project-profile.md` → `feedback-ledger.md`). Three
are pre-existing (interview↔output-contract, project-profile→probe-catalog); three are new from the
feedback-ledger cross-citations. WARN-level acceptable per the KG-pilot precedent (plan Step 6.2);
the cross-citations are legitimate (the confirmed-in-use tag and disposition vocabulary genuinely
span the two files), mirroring KG's own structure.

### 6.3 Repo tests
Glob form (see Deviations): `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`
→ **tests 536, pass 536, fail 0, exit 0.** Includes the skill-reference-resolution lint (the new
`references/feedback-ledger.md` resolves from SKILL.md) and the CHANGELOG ↔ plugin.json agreement
lint (unchanged — no bump this pass, per directive).

### 6.4 / 6.5 — NOT run (per directive)
No `bump-plugin`, no commit, no `gen-omni`. The architect closes the bump (nexus-analytics
0.1.1 → 0.2.0 MINOR) + commit after the Step-2 review. Working tree carries the port only:
- `SKILL.md`, `references/output-contract.md`, `references/interview-protocol.md`,
  `references/project-profile.md`, `probes/orphan-fk-fanout.sql` (modified) +
  `references/feedback-ledger.md` (new).

### Re-verify — architect done-check fixes (2026-07-17)
**Scoping correction:** the original 6.1 sweep used `grep --include="*.md"`, which silently
excluded the 7 `probes/*.sql` files — the reason a pre-existing `F52` in an SQL comment went
uncaught. The corrected sweep drops the `--include` filter and spans **all file types** in the
skill tree. (Lesson recorded.)

**Re-run extended KG-token sweep (all file types):** **20 total hits, all sanctioned.**
- `probes/` = **0** (was 1 — `orphan-fk-fanout.sql:8`, now fixed). All 7 probe SQL files clean.
- `references/project-profile.md` = 18 hits, all at lines 74-133 (inside the worked example;
  heading at line 68).
- `SKILL.md` = 2 hits, lines 14-15 (the F38 origin note).
- Zero hits in output-contract.md, interview-protocol.md, feedback-ledger.md, probe-catalog.md,
  and the other 6 probes. `read_reference` = 0, `migrate-provenance` = 0 (unchanged).

**Re-run skill-lint:** `OK mine-semantic-model (with warnings)`, **exit 0, 0 ERROR**, same 6
nested-reference WARNs (unchanged by either fix). Six markers + targeted zero-checks unaffected
(neither fix touched a marker, a `carried(F38)`, or the `"question": "Q3"` shape).

### Re-verify — Step-2 review folds (2026-07-17)
Two reviewer-LOW folds (above). Re-ran skill-lint + marker greps:
- **skill-lint:** `OK (with warnings)`, **exit 0, 0 ERROR**, 6 WARN (unchanged).
- **`Feedback dispositions` in SKILL.md: 3 → 4** (+1, the Phase-5 step-4 clause) — as predicted.
- **Six markers all still non-zero in required files** (none regressed): Schema v2→output-contract 3;
  confirmed-in-use→output-contract 2/SKILL 4; BR-C→SKILL 4 (was 3, +1 from the step-4 `(BR-C)`)/output-contract 1;
  BR-F→output-contract 1/SKILL 3; feedback-ledger→SKILL 5; model-feedback→SKILL 7/project-profile 3/feedback-ledger 5;
  Findings/follow-ups→output-contract 1/SKILL 1.
- **`established shape` = 0** in output-contract.md (fold 2 confirmed).

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Plan Step 6.3 acceptance line uses the regressed bare-dir test form | low | architect | `tests/README.md:63-66`; `node --test tests/` → MODULE_NOT_FOUND on Node 24.18.0 | Update the plan/future acceptance lines to the glob form `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` |
| skill-lint emits 6 nested-reference WARNs (3 new from feedback-ledger cross-citations) | low | reviewer | skill-lint output, exit 0, 0 ERROR | Accepted per KG-pilot precedent (plan Step 6.2); cross-citations are semantically load-bearing, not accidental |

*Status: COMPLETE — developer, 2026-07-17*
