# Research-KB — Review

## Step 1 — Done-Check

Pre-commitment predictions (made before reading implementation.md): (1) self-reported `improve-skills`
invocation on Steps 2/5 might not appear in the audit log; (2) the live-run N/A steps (4, 7) might not have
a verifiable on-disk artifact; (3) the two flagged deviations. Findings below resolve all three.

### Skill-conformance (scored against `.claude/audit/skill-invocations.log`)

Scoped to this developer run — `agent ∈ {developer, main}` AND `token = developer:implement`, session
`c891537a` (2026-06-15). Logged invocations: `improve-skills` @15:44, `tdd` @15:47, `release-plugin` @16:00.
Mapped against the plan's non-`None` Skill Mapping:

| Plan step | Mapped skill | In scoped log | Verdict |
|-----------|--------------|---------------|---------|
| 1, 2, 5 | improve-skills (Follow) | yes (@15:44) | pass |
| 3 | tdd (TDD: yes) | yes (@15:47) | pass |
| 8 | release-plugin (Follow) | yes (@16:00) | pass |

`## Skills Used` section present (required by implementation-format) — no fabricated entries; every
self-reported invocation corroborated by the log. Steps 4, 6, 7 are `Skill: None` (no log entry owed).

### Step dispositions

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — `research-entry-schema` skill + claim grammar | Implemented | `plugins/nexus/skills/research-entry-schema/SKILL.md` exists; born-compliant lint exit 0. Satisfies P2 §b + R1 / ADR-4 (real). |
| 2 — `search-researches` execution path (Incr. 1) | Implemented | `plugins/nexus/skills/search-researches/SKILL.md` exists; imperative `Explore` spawn (recall-inline rationale carried, H1); lint exit 0. Satisfies P2 §a/§c + Q1 + Q2-revised (real). |
| 3 — cite-or-drop validator (TDD) | Implemented | `scripts/cite-check.mjs` + `tests/unit/cite-check.test.mjs` exist; `tdd` logged; 7 tests green in the 156-pass suite. High-stakes single-source fail enforced. Satisfies the prompt-only-obligation rule (real). |
| 4 — Validate execution path (incl. fork isolation) | Implemented (N/A-verified) | Live-run step. On-disk artifact `docs/kb/research/claude-code-skill-context-fork.md` exists; cite-check exits 0; §8 isolation probe recorded in Key Decisions. Output verified to exist. |
| 5 — recall path (Incr. 2) | Implemented | `search-researches/SKILL.md` extended with recall-first → validity-gate (R2) → supersede; `improve-skills` logged; grep-only (R3), P3 excluded. |
| 6 — wire the shipped P1 rule | Implemented | `research-before-asking.md` references both `` `search-researches` skill `` and `` `research-entry-schema` skill `` in the lint-asserted form; `skill-refs.test.mjs` passes (3/0). |
| 7 — validate recall end-to-end | Implemented (N/A-verified) | Live-run step. Cache-hit (no fork) + stale-path supersede verified on disk: old block `Status: superseded` + `Superseded by:` pointer, new block `Status: current`, both in one file, cite-check exit 0. See deviation note. |
| 8 — born-compliant lint + MINOR release | Deviated (valid reason) | Both new skills lint exit 0; full `node --test` suite 156 pass / 0 fail; plugin.json at 1.10.0; CHANGELOG 1.10.0 entry; gen-omni twin in sync (`--check` exit 0). Version-drift deviation below. No commit/tag (team lead owns, ADR-18). |

### Deviation assessment (both documented by developer)

1. **Step 8 — baseline 1.9.3 → 1.10.0 (plan said 1.9.2 → 1.10.0).** **Valid.** The binding instruction is
   MINOR / new capability (R4), not a literal source number; the plan states the arithmetic `1.{9+1}.0`.
   Commit `f51f1f3` (subagentStatusLine) bumped the live plugin.json to 1.9.3 *after* the plan was authored,
   so the session-start snapshot was stale. A MINOR bump from 1.9.3 lands on **1.10.0** — exactly the plan's
   stated target. Cosmetic source-number drift; identical outcome.

2. **Step 7 Part 2 — stale-path entry composed directly, not via a second live `Explore` dive.** **Valid.**
   Step 7's acceptance is "force a stale path → confirm it re-researches and **supersedes**." The mechanism
   under test is the supersede-don't-delete write, verified deterministically on disk (superseded block kept
   + pointer, new current block, cite-check exit 0). The forked-dive orchestration is non-deterministic and
   was already proven live in Step 4 (§8 isolation probe); re-running an identical dive would prove nothing
   new and burn budget. Sound test economy — the plan itself classes the orchestration as
   live-run-validated, not unit-testable.

### Open production / operator notes
- **Working-tree scoping (developer Carry-Over → team lead).** The tree carried pre-existing out-of-band
  changes from prior sessions (`f51f1f3` statusline surfaces, learner.md, the 1.9.3 bump). The team lead must
  scope the commit to this feature's surface (the rule + two new skills + their tests + the 1.10.0 bump +
  regenerated omni twin), or deliberately include the carried changes. Not a conformance gap — a commit-scope
  decision the developer correctly routed.
- **Live-validation artifact `docs/kb/research/claude-code-skill-context-fork.md`** is under `docs/`, not
  `plugins/` — not shipped plugin surface, no bump impact. Team lead keeps or removes at commit time.

No plan step is Missing. All 8 steps Implemented or Deviated-with-valid-reason; both N/A live-run steps have
verified on-disk output; skill conformance scored clean against the log.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-15*

## Step 2 — Code Review

## Reviewed By
Reviewer (nexus:reviewer), cycle 2/3. Fresh build and test output from this session. Re-checked all four fixed areas plus adjacent logic.

## Verdict: APPROVED

## Re-review Scope
Cycle 1 had one MEDIUM (Fix/Alternatives test coverage) and one LOW (multi-block source namespace collision + first-only corroboration). The developer additionally addressed two Codex BLOCKERs not in the original review: (1) prose claim lines bypassing the bullet check; (2) file-global source resolution and first-only corroboration (same root defect as the LOW). All four areas verified resolved with no regression.

## Findings from Cycle 1 — Resolved

**[MEDIUM resolved] Test coverage for Fix and Alternatives sections**
Three new tests added: cited claims under Fix and Alternatives pass (exit 0); uncited claim under Fix fails (exit 1); uncited claim under Alternatives fails (exit 1). Tests 8-10 in the 19-test cite-check suite all pass. Verified by running the full test suite (168 pass / 0 fail).

**[LOW resolved] Multi-block source namespace collision + first-only corroboration**
Resolved by the per-block rewrite. See Codex BLOCKER-2 below for detail.

## Codex BLOCKERs — Verified Fixed

**[BLOCKER-1 resolved] Prose claim lines bypassed the check**
Old code silently skipped non-bullet lines under a claim section, allowing an uncited prose claim to pass undetected. Fixed at `cite-check.mjs:108-110`: a non-blank, non-bullet line under a claim section now pushes a `non-bullet (prose) line under ## {section} — claims must be bullets` violation (exit 1). Blank lines are still skipped as framing (line 104 `if (!line) continue` comes first). Test 11 (`a prose (non-bullet) claim line under ## Finding fails`) exercises this path — exit 1, output matches the non-bullet/prose pattern. Confirmed green.

**[BLOCKER-2 resolved] File-global source resolution and first-only corroboration**
The old file-global `sources` Map allowed a later block's `[2]` to satisfy an earlier block's claim citing `[2]`. The old `lines.find()` only checked the first `Corroboration` field. Fixed by rewriting to a per-block model (`cite-check.mjs:61-143`): the file is first split into entry blocks keyed on the `## {Question answered}` heading (any `## ` heading whose title is not one of the 8 BODY_SECTIONS names), then each block runs its own source-collection pass A, claim-citation pass B, and corroboration pass C — all with per-block scope.

Three new tests cover the two false-pass scenarios plus the positive control:
- Test 17: block-1 claim citing `[2]` (only defined in block-2 sources) fails per-block (exit 1).
- Test 18: later block's high-stakes single-source verdict fails per-block corroboration (exit 1).
- Test 19: clean two-block file (the legitimate supersede steady state) passes (exit 0).

All 19 cite-check tests green; full 168-test suite green.

## Adjacent-Area Re-verification

**Block-split boundary logic (`cite-check.mjs:61-72`):** The `BODY_SECTIONS` guard correctly identifies question headings. The topic-level `# {title}` line (single hash) does not match the `## ` heading pattern so it does not trigger a split. The `---` separator between blocks is not a `## ` heading — it is pushed into current block lines and ignored by all three passes. Verified on the live two-block artifact (cite-check exits 0).

**Prose-claim edge case:** Blank lines in claim sections are skipped before the bullet check (line 104 before line 108). Sub-bullets with leading spaces would be rejected as malformed — conservative and consistent with the current schema grammar (claims are top-level bullets per the example).

**Per-block corroboration (`cite-check.mjs:130`):** Uses `block.lines.find()` scoped to the current block inside the `for (const block of blocks)` loop — every block is checked, not just the first.

**`research-entry-schema/SKILL.md` (Fix 4):** Grammar wording now explicitly states: claims are written as bullet lines, a non-bullet prose line is malformed and fails, `[n]` is a bracketed number (one or more digits), resolution is against "this entry block's `## Sources`", and the corroboration floor is per-block. E7-safe (no angle-bracket tokens). Skill-lint: OK.

## Remaining Gaps (non-blocking)
- Missing Corroboration field not caught: a researcher who omits the field entirely bypasses the high-stakes check. Not in the plan's specified exit conditions; follow-up only.
- No test for a question heading that coincidentally matches a body-section name (e.g., a question literally titled "Verdict") — this would fail to split a new block. Extremely unlikely per schema grammar.

## Open Questions
None.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full test suite (168 tests) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 168 pass / 0 fail |
| cite-check unit tests (19 tests) | pass | `node --test tests/unit/cite-check.test.mjs` | 19 pass / 0 fail |
| skill-lint on both skills | pass | `node ...skill-lint.mjs research-entry-schema search-researches` | OK research-entry-schema / OK search-researches |
| cite-check on live two-block artifact | pass | `node ...cite-check.mjs docs/kb/research/claude-code-skill-context-fork.md` | OK — every claim cited |

*Status: COMPLETE — reviewer, 2026-06-15*
