# Nexus /research skill — rename + depth-route + capture — Review

## Step 1 — Done-Check

**Pre-commitment predictions (made before reading implementation.md):** (1) a stray `search-researches`
hit surviving the Step-1 rename; (2) the Step-3 cite-check derived-field rule deviating from plan prose;
(3) Step-5 twin sync deferred → Deviated, not Missing. All three landed: (1) zero stray hits (gate clean);
(2) confirmed as Q3, plan patched; (3) Deviated (valid reason) per the Q1 ruling.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Rename `search-researches` → `research` (live surfaces only) | Implemented | Authoritative Q2-effective gate `grep -rn "search-researches" plugins/ rules/ tests/ \| grep -v CHANGELOG.md` → **zero hits** (re-run by architect). Folder `git mv`'d (history preserved): `research/` exists, old folder gone. `skill-lint research` → exit 0. `cite-check.test.mjs` → **19/19 pass** at renamed path (re-run). The 3 historical CHANGELOG hits left untouched per Q2 ruling. |
| 2 — Depth-routing branch + `/deep-research` re-label | Implemented | Consolidating rewrite of `research/SKILL.md` (folds, not additive). `grep -n "external .deep-research" …research/SKILL.md` → zero (re-label complete). Routing chain `recall → route(low-med forked \| heavy → /deep-research) → capture` present; depth heuristic stated. skill-lint exit 0. |
| 3 — Capture path (`/deep-research` report → pool entry) | Deviated (valid reason — Q3, design-origin) | Capture section added; three derived-field rules per plan. **Deviation:** the plan's Corroboration rule ("`Status: uncertain` so the validator does not fail-closed") was verified WRONG against `cite-check.mjs` pass C (keys the high-stakes floor only on the `Corroboration` `high-stakes` token; never reads `Status`; cite-check.mjs:130-141 + tested contract cite-check.test.mjs:77-85). Developer applied the correct rule (omit `high-stakes` label, record count + `Status: uncertain` + prose Caveat) → cite-check exit 0 verified. **Architect ruled Q3 (origin: design), patched plan Step 3 to match.** Live-`/deep-research`-report validation = OPERATOR ACTION (build-time-unavailable resource, plan-sanctioned). |
| 4 — `research-before-asking` depth dial | Implemented | Engine-split block added to `## The depth dial`; both engines named (low–med forked `/research`; heavy → `/deep-research` + capture); AP3 one-owner (mechanics deferred to skill). `grep -rn "search-researches" plugins/nexus/rules/` → zero. No duplicated mechanics. |
| 5 — Release: bump + regenerate twin | Deviated (valid reason — Q1, operator-owed) | **In-repo half done:** MINOR bump 1.13.2 → **1.14.0** (plugin.json confirmed); CHANGELOG `[1.14.0]` entry added using the new name (describes the rename; the old name appears only to *describe* the rename + audit-trail decision — correct, not a gate hit). gen-commands correctly NOT run (no agents changed; verified no-diff). Full suite **224 pass / 0 fail**. `research` validates **clean under `--strict`** (architect re-ran: the 4 `--strict` failures are `boy-scout`/`diagnose`/`evaluate-skill`/`improve-skills`, all **unchanged in the working tree** → pre-existing on `main`, NOT this feature). **gen-omni DEFERRED** as OPERATOR ACTION REQUIRED per the architect Q1 ruling (`../omni` twin absent on this machine; gen-omni hard-exits 1 when missing) — Deviated, not Missing; the twin-sync gate is surfaced, not silently passed. |

**Skill-conformance check (scored against `.claude/audit/skill-invocations.log`).** Scoped to this run
(`session dc5ee579-366c-4db0-a066-92c848d48085`, `agent: developer`, `token: developer:implement`,
2026-06-18 10:13–10:27): logged invocations `improve-skills`, `research-entry-schema`, `improve-flow`,
`release-plugin`, `diagnose` — **all five non-`None` mapped skills present**, exactly matching the
implementation's `## Skills Used` table. No fabrication; no missing mapped skill. `tdd` correctly absent
(every step is `TDD: no` per plan). `## Skills Used` section present (structural gate satisfied).

**Verdict: PASS**

**Carry-overs surfaced (not blockers — routed, not fixed here):**
1. **OPERATOR ACTION (Step 5, Q1):** owner runs `node scripts/gen-omni.mjs` + `--check` and commits the
   twin in `../omni` at commit time. The whole-pass commit is the team-lead's (developer never commits).
2. **OPERATOR ACTION (Step 3 plan-sanctioned):** owner runs `/deep-research` once on a sample question;
   validate capture yields a cite-check-clean entry against genuine built-in output (hand-built sample
   already validated, exit 0).
3. **Carry-over finding (origin: design/external, MEDIUM — for a separate pass):** `claude plugin validate
   --strict` fails on 4 **pre-existing** skills (`boy-scout`, `diagnose`, `evaluate-skill`,
   `improve-skills`) — unquoted `description:` values with a colon-space that the real YAML parser rejects
   and `skill-lint`'s lenient regex misses. NOT introduced by this feature (`research` is clean). Possible
   `skill-lint` E-check gap (catch colon-space in unquoted `description:` at the per-skill gate). Logged to
   lessons for the learner; recommend a small dedicated fix pass.

*Status: COMPLETE — architect, 2026-06-18*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer), 2026-06-18. Single-pass checklist — all three axes (Simplicity/DRY, Bugs/Correctness, Conventions) run inline.

## Verdict: APPROVED

## Pre-commitment Predictions
1. **Stray `search-researches` hit surviving the rename** — MISS: fresh grep `grep -rn "search-researches" plugins/ tests/ | grep -v CHANGELOG.md` returned zero hits (confirmed).
2. **Cite-check capture rule contradicting the validator (Q3 carry-over)** — CONFIRMED CORRECTED: `research/SKILL.md` §3 Corroboration rule matches `cite-check.mjs` pass C exactly (do not label `high-stakes` with a single source; record count + `Status: uncertain` + `## Caveat`). Verified against cite-check.mjs:130-141.
3. **Depth heuristic inconsistency between SKILL.md and the rule** — MISS: AP3 one-owner is implemented correctly. The rule (research-before-asking.md L39-49) names the two tiers as a routing summary and explicitly defers mechanics to the skill; no restatement.
4. **research-entry-schema cross-references still containing old paths** — MISS: all 4 cross-references updated; no `search-researches` string remains; fresh grep confirms.
5. **gen-commands producing a diff (commands/ changed unexpectedly)** — MISS: `git diff --stat plugins/nexus/commands/` returned empty; no-diff confirmed independently.

## Findings

No CRITICAL or HIGH findings. No MEDIUM or LOW findings warranting follow-up beyond what is already tracked in carry-overs.

## Positive Observations

- **Authoritative gate over the hand table (AP2).** The plan correctly declared the grep gate authoritative over the rename table. The implementation honored this — every hit the grep returned was updated, including the two live hits the first table draft missed (`cite-check.mjs` comment, `SKILL.md` invocation token). Zero residual hits confirmed.
- **Corrected carry-over (Q3) applied cleanly.** The SKILL.md capture section (§Capture a /deep-research report, step 3) matches the corrected Corroboration rule exactly. It names three specific conditions and the correct escape hatch — no ambiguity that could lead a consuming agent to re-produce a CITE-FAIL entry.
- **AP3 one-owner discipline.** The `research-before-asking.md` depth dial extension names both engines with a one-line routing summary and explicitly attributes mechanics to the skill ("one owner — don't restate them here"). No mechanics are duplicated across the two surfaces.
- **Pre-existing failure correctly isolated.** The developer diagnosed the YAML colon-space issue, confirmed it existed at HEAD for the 4 non-`research` skills via git status (empty for them), fixed only the feature's own skill (the only one it can own), and surfaced the gap for a separate pass. The `--strict` gate is not artificially passing — `research` validates clean; the 4 pre-existing failures are correctly out of scope.
- **cite-check tests 19/19 at renamed path.** Fresh run confirmed; zero logic change in the validator itself.
- **Full test suite 224/0 pass/fail.** All lint and unit tests green on the CI-exact command.

## Gaps

- **Live `/deep-research` report validation** (plan-sanctioned OPERATOR ACTION, already surfaced): the capture path was validated against a hand-built representative sample (cite-check exit 0), but not against genuine built-in output. This remains open until the owner runs `/deep-research` on a sample question. This is correctly noted as OPERATOR ACTION in implementation.md and was anticipated by the plan.
- **gen-omni twin sync** (OPERATOR ACTION, Q1 ruling): `../omni` absent on this machine; the developer correctly did only the in-repo half. The owner must run `node scripts/gen-omni.mjs` + `--check` and commit the regenerated twin separately.
- **4 pre-existing `--strict` YAML failures** (out of scope for this feature): `boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills` still fail `--strict`. Tracked as a carry-over finding in implementation.md and lessons.md; recommend a dedicated small pass.

## Carry-Over Findings (from implementation.md)

| Carry-Over | Confirmed/Refuted | Evidence |
|------------|-------------------|----------|
| Plan Step-3 single-source rule contradicts `cite-check.mjs` (Q3) | **Confirmed; corrected in SKILL.md.** The plan said "`Status: uncertain` bypasses the high-stakes floor." Verified wrong: cite-check.mjs pass C (L130-141) never reads `Status`; `high-stakes && singleSource` fails unconditionally. SKILL.md now carries the correct rule (omit `high-stakes` label, record count + `Status: uncertain` + `## Caveat`). Plan prose patched by architect (Step 1 Done-Check, Q3). | `cite-check.mjs` L130-141; cite-check.test.mjs L77-85 (test 5: high-stakes single-source fails); SKILL.md capture §, step 3 (Corroboration derivation rule). |
| Pre-existing `--strict` YAML failure on 4 skills | **Confirmed pre-existing; correctly out of scope.** `git status` is empty for `boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills` — these files were not touched by this feature. `research` itself validates clean under `--strict`. | Fresh `git status --short` shows those 4 skills not modified; `--strict` failures are a separate repo-wide issue. |

## Open Questions

None — all findings met the ≥80 confidence threshold for the Findings section; the two carry-overs are explicitly addressed above.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Rename gate (zero search-researches) | PASS | `grep -rn "search-researches" plugins/ tests/ \| grep -v CHANGELOG.md` | No output (zero hits) |
| skill-lint on research | PASS | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/research` | `OK    research` |
| cite-check unit tests | PASS | `node --test tests/unit/cite-check.test.mjs` | 19 pass / 0 fail |
| Full suite (lint + unit) | PASS | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 224 pass / 0 fail |
| depth-route re-label grep | PASS | `grep -n "external .deep-research" plugins/nexus/skills/research/SKILL.md` | No output (zero hits) |
| rules/ rename gate | PASS | `grep -rn "search-researches" plugins/nexus/rules/` | No output (zero hits) |
| research-entry-schema refs | PASS | `grep -n "search-researches" plugins/nexus/skills/research-entry-schema/SKILL.md` | No output (zero hits) |
| Plugin version | PASS | `plugins/nexus/.claude-plugin/plugin.json` | `"version": "1.14.0"` (MINOR bump from 1.13.2) |
| gen-commands no-diff | PASS | `git diff --stat plugins/nexus/commands/` | No output (no diff) |
| Plugin folder structure | PASS | `ls plugins/nexus/skills/` | `research/` present; `search-researches/` absent (deleted) |

*Status: COMPLETE — reviewer, 2026-06-18*
