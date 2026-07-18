# F3 increment 0 — reviews

## Step 1 — Done-Check (architect, Fable 5, 2026-07-17)

**Verdict: PASS** (after one fix cycle, two one-line findings, both fixed and re-verified).

Scope checked: the feedback-loop port into `plugins/nexus-analytics/skills/mine-semantic-model/`
against `delivery/plan.md` (post-critic-fold). Method: independent re-run of the acceptance sweep
(all file types — which caught what the developer's `--include="*.md"` sweep structurally missed),
full read of the new `references/feedback-ledger.md`, and full-diff read of `SKILL.md` +
`references/output-contract.md`.

| Plan step | Disposition |
|---|---|
| 1 — output-contract: `code({ref})` enum+precedence, Schema v2 (BR-F tag retained), Audit mode enum, `## Feedback dispositions`, `## Findings / follow-ups` | Done — verified in diff; generalizations native (generic deprecated example; project-side migration note; item-10 structural-definition pointer) |
| 2 — interview-protocol v2 answer shapes | Done — flattened orphan (`"question": "Q3"`) = 0 hits; per-construct + field-scoped examples with `carried({baseline})` |
| 3 — new feedback-ledger.md | Done — read in full; faithful generalized port (placement/entry/recurrence/closure/dispositions/area-map/append policy); one KG-flavored phrase found → fixed (fix 2) |
| 4 — project-profile eleventh input + item-10 attestation (+absence case) + worked example | Done — verified via diff stat + sweep (worked example holds all 18 sanctioned KG-token hits) |
| 5 — SKILL.md insertions (eleven inputs, P1 s4, P3 s0, P5 s6, leg 0, leg-3 ordering, BR-A..H, references, defect-log repoint, BR10 reconciliation) | Done — verified line-by-line in diff; "steps 1-2 below" adaptation correct; item-11 is the binding source with the default named once |
| 6.1–6.3 — acceptance greps, skill-lint, repo tests | Done — six markers non-zero in the right files; extended sweep: 20 hits all sanctioned (probes/ = 0 after fix 1), `read_reference`/`migrate-provenance` = 0, `carried(F38)` = 0 in ported files; skill-lint 0 ERROR (6 accepted nested-reference WARNs); tests 536/0 (glob form — see deviation) |
| 6.4–6.5 — bump + commit | Deliberately deferred to post-Step-2 close (architect-owned) |

**Fix cycle (both applied + re-verified):**
1. `probes/orphan-fk-fanout.sql:8` — pre-existing foreign feature-id (`F52`) from the original
   relocation; reworded to sanctioned KG-pilot phrasing. Caught by the extended all-file-types
   sweep; the plan's HIGH-1 regex did its job on a file outside the port's edit set.
2. `references/feedback-ledger.md` `grounded` bullet — KG-flavored "KB or analytics reference" →
   "the profile's KB hub(s)" (plugin Phase-3 vocabulary).

**Recorded deviations (accepted):**
- Step 6.3 test invocation: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (the repo's
  documented Node ≥22 form, `tests/README.md:63-66`) instead of the plan's literal
  `node --test tests/`. Acceptance intent met; plan line not retro-edited (this note is the
  record).
- Illustrative examples authored generic where KG's stay KG-specific (`code(OrderWriter.settledAt)`,
  lifecycle-flag deprecated example) — plan-sanctioned.

**Lesson feeder:** the developer's `--include="*.md"` sweep silently excluded `probes/*.sql` — an
acceptance sweep must run over ALL shipped file types, not the types the port happened to edit.
Recorded in `delivery/lessons.md` by the developer.

## Step 2 — Code review (reviewer)

### Reviewed By
Reviewer (Fable 5), 2026-07-17. Per owner rule 5: BOTH skill trees read in full — target
`plugins/nexus-analytics/skills/mine-semantic-model/` (SKILL.md, output-contract.md,
interview-protocol.md, project-profile.md, feedback-ledger.md, probes/orphan-fk-fanout.sql) and
reference `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\` (same files +
feedback-ledger.md + CHANGELOG.md F60 entry as the delta manifest). All Step-6 acceptance gates
re-run fresh this session, not trusted from implementation.md.

### Verdict: APPROVED

No CRITICAL or HIGH findings. Three LOW follow-ups (below), none blocking. Both carry-over
findings from implementation.md confirmed with fresh evidence.

### Pre-commitment Predictions
1. *Mandatory-language dilution in translation* — **not found.** BR-C `none open`, BR-D
   append-only, BR-E no-scalar, BR-F code-primary-never-verified, leg-0 mandatory hypothesis, and
   the Phase-5 step-6 block all carry KG's exact force; the item-10 absence case degrades to
   contract-bound **disclosed** (never silent), per plan.
2. *`code({ref})` precedence drift* — **not found.** Rank 4 (below `data-derived`, above
   `schema-derived`) with KG's identical rationale; six-token closed enum matches KG's.
3. *Item-numbering / eleven-inputs inconsistency* — **not found.** "ten inputs" = 0 hits; item-10 /
   item-11 cross-references line up across all five files.
4. *Run-report template vs SKILL.md mandate mismatch* — one parity nit found (LOW-2); no
   enforcement gap.
5. *Leg-3 bands / BR10 clause divergence* — **not found.** The undeclared-staleness-threshold merge
   rule is stated identically in SKILL.md leg 3 and project-profile item 11; the BR10 new-input
   clause is the plan's sanctioned addition, honest and self-consistent.

### Findings

#### [LOW] Pre-existing KG spec-rule ids (`SR-n`) and review-history notes survive in shipped files
**File:** `plugins/nexus-analytics/skills/mine-semantic-model/references/interview-protocol.md:14` (SR-21); `probes/*.sql:1` (SR-12..SR-17, 6 files); `references/output-contract.md:55` ("review cycle 1 adjudication"); `probes/orphan-fk-fanout.sql:12` ("review cycle 1")
**Origin:** external (pre-existing relocation residue — outside this increment's edit set and outside the plan's sanctioned sweep alternation)
**Issue:** KG's spec-requirement ids (`SR-21`, `SR-12`–`SR-17`) and F52-review-history phrases reference a spec that does not exist in the plugin context — the same foreign-id class as the `F52` the architect's fix 1 removed, just not in the plan's token list. Orphan references in a shipped artifact.
**Fix:** Follow-up (not this increment): add `SR-\d` and "review cycle" to the sweep alternation and generalize the hits (e.g. drop the `(Phase 2 / SR-15)` suffixes; repoint SR-21 at BR10/never-ask-twice), or explicitly sanction them as KG-pilot provenance style.
**Confidence:** 95/100

#### [LOW] Phase-5 step 4 lacks KG's reinforcing BR-C clause
**File:** `plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md:229-230`
**Origin:** design (plan Step 5 did not enumerate this KG F60 delta; the developer conformed to the plan)
**Issue:** KG's Phase-5 step 4 reads "…per `references/output-contract.md`, **including its mandatory `## Feedback dispositions` section (BR-C)**"; the plugin's step 4 drops the bolded clause. **No enforcement gap** — the section is mandated by the output-contract required-sections template, the BR-C row, the Phase-3 closing paragraph, and leg 0 — but the reinforcement is the one F60 SKILL.md delta not ported.
**Fix:** Optional parity: append ", including its mandatory `## Feedback dispositions` section (BR-C)" to Phase-5 step 4.
**Confidence:** 90/100

#### [LOW] `deprecated` bullet keeps KG-history wording "established shape"
**File:** `plugins/nexus-analytics/skills/mine-semantic-model/references/output-contract.md:123`
**Origin:** implementation
**Issue:** KG's "(optional, established shape — pre-existing on 3 dimension entries, formally documented here)" was justified by KG's live ledger; the plugin keeps "(optional, established shape, formally documented here)" — "established" implies a usage history a generic consuming project doesn't have.
**Fix:** Drop ", established shape" → "(optional, formally documented here)".
**Confidence:** 85/100

### Carry-Over Findings (implementation.md) — dispositions
1. **Plan Step 6.3 bare-dir test form regressed** — **CONFIRMED with fresh evidence.**
   `node --test tests/` → `Error: Cannot find module '...\tests'` on Node v24.18.0 (run this
   session); glob form → 536/536 green. For the architect: update the plan's acceptance line to the
   glob form for future runs. LOW, routed as filed.
2. **skill-lint 6 nested-reference WARNs** — **CONFIRMED.** Re-ran skill-lint this session: exit OK,
   0 ERROR, exactly 6 WARNs, all the nested-reference advisory class (3 pre-existing, 3 from the
   legitimate feedback-ledger ↔ output-contract/project-profile cross-citations). Accepted per the
   KG-pilot precedent the plan's Step 6.2 sanctions. No action.

### Positive Observations
- **Fail-closed posture fully intact through generalization** — the port's highest risk. BR-C's
  explicit `none open` line survives in all three homes (BR row, Phase-3 closing, template); BR-D
  closure-is-a-resolution-append verbatim; BR-E/BR-F enforcement honestly re-homed from KG's
  shipped tools to the profile's item-10 attestation with the either/or absence case **disclosed,
  never silent** — the identical disclosure string
  `provenance validation: none declared (BR-E/BR-F contract-bound only)` appears in SKILL.md
  Phase-5 step 6, project-profile item 10, and is referenced by the BR-E/BR-F rows.
- **Critic HIGH-1/HIGH-2 fixes verified in the artifact**: `read_reference` = 0,
  `migrate-provenance` = 0, tooling-path references replaced by the item-10 pointer; the
  `## Findings / follow-ups` template section exists and the SKILL.md defect-log repoint targets it
  bidirectionally (template tail note names the SKILL.md pointer back).
- **Both post-done-check fixes verified in the diff**: probes/orphan-fk-fanout.sql:8 now uses the
  sanctioned "KG pilot's dry-run" phrasing (git diff shows the one-line comment change only);
  feedback-ledger.md's `grounded` bullet uses the plugin's Phase-3 vocabulary ("the profile's KB
  hub(s)").
- **BR10 reconciliation is honest**, not hand-waved: open ledger entry = new input; post-closure a
  repeat run is again a strict no-op — consistent with the ledger's closure rule.
- Working tree scope is exactly the six planned files — zero scope creep (`git status` scoped to
  `plugins/`).

### Gaps
- interview-protocol.md's unavailable-user path names "the run report's Questions section" while
  the template's sections are `## Interview`/`## Answers` — **pre-existing naming mismatch present
  in KG too**; parity preserved, not a port regression. Noted only.
- The literal `docs/model-feedback/{area}.md` default appears three times in feedback-ledger.md
  (intro, Placement, Area-file map), each explicitly qualified "proposed default" with item-11 as
  the binding source — judged conformant with the plan's binding-source rule (which targets
  SKILL.md's phase steps); noted for completeness.

### Open Questions
- None. (Nothing scored below the 80 report cutoff.)

### Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Six markers + `Findings / follow-ups` | pass | per-marker grep scoped to the skill dir | Schema v2: 6 hits (output-contract 3, SKILL 2, profile 1); confirmed-in-use: 6 (SKILL 4, output-contract 2); BR-C: 5 (SKILL 3, output-contract 1, feedback-ledger 1); BR-F: 8 (SKILL 3, profile 4, output-contract 1); feedback-ledger: 7; model-feedback: 15; Findings / follow-ups: output-contract 1 + SKILL 1 — all non-zero, all in required files |
| Extended KG-token sweep, ALL file types | pass | grep alternation (plan Step 6.1 extended set), no `--include` filter | 20 hits total: SKILL.md:14-15 (F38 origin note, sanctioned) + project-profile.md:74-133 (all inside the worked example, heading at :68). probes/ = 0. `read_reference` = 0, `migrate-provenance` = 0 |
| Targeted zero-checks | pass | grep | `carried(F38)` = 0 in output-contract/interview-protocol/feedback-ledger (worked example only); `"question": "Q3"` = 0; `ten inputs|ten profile inputs` = 0 |
| skill-lint | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/mine-semantic-model` | `OK mine-semantic-model (with warnings)` — 0 ERROR, 6 nested-reference WARNs (carry-over 2 confirmed) |
| Repo tests (glob form) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | tests 536, pass 536, fail 0 |
| Bare-dir test form (carry-over 1) | confirmed broken | `node --test tests/` on Node v24.18.0 | `Error: Cannot find module '...\tests'` — plan line needs the glob form |
| Diff scope | pass | `git status --porcelain -- plugins/`; `git diff --stat` | exactly 5 M + 1 new file, all under the skill dir; probe diff = the one line-8 comment reword |

*Status: COMPLETE — reviewer, 2026-07-17*
