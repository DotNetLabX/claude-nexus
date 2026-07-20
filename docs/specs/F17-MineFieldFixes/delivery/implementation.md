# F17-MineFieldFixes — Implementation

Two field fixes from the knowledge-gateway 2026-07-18 run: P18 (mine-skill-gaps S1 sweep
hardening) and P19 (mine-family kickoff stage-model-plan item, prose + code checker). Architect-led
fast lane — no git writes, no version bump (both happen at lane close in the main session).

## Files Modified

### Step 1 — P18: mine-skill-gaps S1 sweep hardening
- `plugins/nexus/skills/mine-skill-gaps/SKILL.md` — three touch points, smallest coherent edits, no
  restructure:
  1. **Pipeline block (S1 Tier A line):** the pre-flagged sweep now greps the `Skill Gaps` heading
     **case-insensitively at any heading level** (`## Skill Gaps`, `### Skill gaps`), not h2-only /
     case-sensitive.
  2. **§S1 Tier A paragraph:** states the sweep contract explicitly — match the `Skill Gaps` heading
     case-insensitively at any heading level; the fielded `### {Suggested skill name}` entry remains
     the candidate of record (guarantee preserved, only the match widened).
  3. **§Parser posture:** added a **Heading-less tolerance** paragraph — a candidate-shaped gap
     bullet under NO `Skill Gaps` heading (F8-style bare bullet) is swept and surfaced as a
     **capture-signal**, a disposition kept *distinct* from the orphan-cell **capture leak** of §S3
     (one clause distinguishes the two; the precisely-defined "capture leak" term is NOT widened).
     Cites the measured miss (KG 2026-07-18: F3 `### Skill gaps` lowercase-h3 missed → three
     candidates misclassified as capture leaks).

### Step 2 — P19 prose: Tier-1 item 5 + 8 pointer-line enumerations + mine-skill-gaps pointer clause
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — §Kickoff checklist Tier 1
  gains item **5. Stage-model-plan declared**: the run names which model tier each stage class runs
  on (mechanical stages a named cheaper tier; judgment stages the session tier or a deliberately
  named one), **declare-and-veto** (lands in kickoff output for the operator to veto, never an
  interactive prompt). Notes it generalizes the mine-skill-gaps §Execution topology clause.
- `plugins/nexus/skills/mine-skill-gaps/SKILL.md` — §Execution topology gains one pointer clause
  tying the existing "session's model tier or a deliberately named one" sentence to the new core
  Tier-1 item, carrying the literal token `stage-model-plan` (the acceptance grep keys on it). The
  existing sentence is unchanged.
- The 8 pointer-line enumeration files each gain `stage-model-plan` inside the Tier-1 parenthetical
  (structure-independent; inserted wherever the parenthetical flows):
  `mine-algorithm`, `mine-architecture`, `mine-design`, `mine-reference-model`, `mine-verify-cover`,
  `mine-verify-flows`, `mine-verify-repo` (all nexus), and `mine-semantic-model` (nexus-analytics —
  release-affected too; lane close bumps both plugins). In `mine-semantic-model` the parenthetical
  uses `;` separators, so `stage-model-plan` was appended with `;`.

### Step 3 — P19 checker: kickoff-preflight.mjs + test (TDD, red first)
- `tests/unit/kickoff-preflight.test.mjs` — RED first: `baseConfig` gains
  `stageModelPlan: 'extract=named-cheaper-tier, judgment=session-tier'`; the `(a2)` universal-field
  loop gains `'stageModelPlan'`. Ran → exactly ONE test failed (`(a2)`, "stageModelPlan missing must
  refuse") for the right reason (checker unaware of the key); the other 9 stayed green.
- `plugins/nexus/skills/mine-verify-cover/tools/kickoff-preflight.mjs` — GREEN: added the 5th
  `UNIVERSAL` entry `{ key: 'stageModelPlan', reason: '…' }` (reason carries: which model tier each
  stage class runs on, mechanical = named cheaper tier, judgment = session/named tier, declare-and-veto),
  and extended the header-comment universal enumeration (line 11) with `· stage-model-plan`.
  `confirmed()` semantics unchanged (a non-empty string passes). Ran → 10/10 green. No refactor
  needed (one array entry, no duplication introduced). Self-review fold: also added
  `stageModelPlan?:*` to the `@param` JSDoc typedef (line 46-47) so the doc lists the new config
  field — see `## Self-Review`.

### Step 4 — Conformance sweep + lint + full suite
- Re-ran every Step 1–3 acceptance grep — all pass (results in `## Acceptance Greps` below).
- Sweep check: `grep -l 'stage-model-plan' <file>` succeeds for all 8 enumeration files
  (structure-independent).
- `skill-lint.mjs` run on all 9 edited skill dirs → **exit 0** (gate = "lint passes"). All OK; the
  only warnings are 6 pre-existing W4 nested-reference warnings on `mine-semantic-model` in files I
  did NOT touch (`references/project-profile.md`, `interview-protocol.md`, `output-contract.md`,
  `feedback-ledger.md`). My edit added one token to a SKILL.md parenthetical — it neither caused nor
  is related to those warnings. Warnings alone exit 0; the gate is green.
- Full regression: **538 pass, 0 fail** across all 42 files in `tests/unit/`.

## Acceptance Greps (executed — done-check re-runs these)
```
# Step 1 — plugins/nexus/skills/mine-skill-gaps/SKILL.md
grep -ic 'case-insensitive'   → 3   (≥1 ✓)
grep -ic 'any heading level'  → 1   (≥1 ✓)
grep -ic 'heading-less'       → 2   (≥1 ✓)

# Step 2 — mine-family-core.md
grep -n  'Stage-model-plan declared'  → 1 hit, line 273, inside Tier 1 (Tier 1 hdr @264, Tier 2 @281) ✓
grep -in 'declare-and-veto'           → 1 hit, line 275 (≥1 ✓)
# Step 2 — grep -c 'stage-model-plan' → 1 for EACH of the 8 enumeration files + mine-skill-gaps pointer ✓
#   mine-algorithm=1 mine-architecture=1 mine-design=1 mine-reference-model=1 mine-verify-cover=1
#   mine-verify-flows=1 mine-verify-repo=1 mine-semantic-model=1 mine-skill-gaps=1

# Step 3
node --test tests/unit/kickoff-preflight.test.mjs → 10 pass / 0 fail ✓
grep "'stageModelPlan'" tests/unit/kickoff-preflight.test.mjs → present in the (a2) loop, line 43 ✓
grep -c "key: '" plugins/nexus/skills/mine-verify-cover/tools/kickoff-preflight.mjs → 5 ✓

# Step 4
grep -l 'stage-model-plan' <8 enumeration files> → all 8 succeed ✓
skill-lint on 9 edited dirs → exit 0 (green; 6 pre-existing W4 warnings on mine-semantic-model untouched files)
node --test tests/unit/*.test.mjs → 538 pass / 0 fail ✓
```

## Key Decisions
- Touch point 2 keeps the existing "candidate of record" clause intact and only prepends the
  sweep-contract sentence — the guarantee (fielded entry is the record) is unchanged, only the match
  is widened. This is the "do NOT restructure; smallest coherent edits" directive.
- The measured-miss citation lives in §Parser posture (touch point 3) per the plan, not repeated in
  the Tier A paragraph, to avoid duplication.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan Skill Mapping: `(none)`, TDD no — prose edit to a shipped SKILL.md; no skill covers editing shipped plugin skills in the dev repo (we ARE the apply side) |
| 2 | None | plan Skill Mapping: `(none)`, TDD no — same class of prose edit, 10 files |
| 3 | tdd | plan Skill Mapping: `Follow tdd`, TDD yes — invoked `nexus:tdd` before writing any code; red-first (one failing test), then green, no refactor |
| 4 | None | plan Skill Mapping: `(none)`, TDD no — mechanical sweep + skill-lint gate + full regression suite |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| capture-signal has no dedicated S3 emit subsection | low | reviewer | mine-skill-gaps §Parser posture (Heading-less tolerance) vs §S3 `## Capture leaks` | By design — plan touch point 3 scoped this to "one clause"; the disposition is named + surfaced, not a registry-schema change |
| mine-semantic-model 6x W4 nested-reference warnings | low | reviewer | `skill-lint` on mine-semantic-model | Pre-existing in files F17 did not touch; not caused by the one-token parenthetical edit; lint still exit 0 |

## Self-Review

**Reviewed by:** developer self-review (first-round). The built-in `/review` skill is
GitHub-PR-scoped (it resolves its target via `gh pr view` and declares "local working-tree changes
are out of scope") — there is no PR for this architect-led fast lane (commit is deferred to lane
close), so `/code-review` on the working-tree diff is effectively unavailable. Per the run's rule 5,
I ran a **disclosed self-review against the `review-format` checklist** (loaded) instead, covering
both the code half and the prose-specific checks (internal consistency, dangling cross-references,
dropped/narrowed guarantees, stale adjacent sentences).

**Verdict: APPROVED (self-review)** — 0 CRITICAL, 0 HIGH, 0 MEDIUM; 1 LOW folded, 1 LOW by-design
observation carried over.

**Findings folded:**
- **[LOW] Stale JSDoc typedef** — `kickoff-preflight.mjs:46-47` `@param` enumerated the config
  fields (`toolPreflight`, `expectedSurvivalRate`, `stopBudget`, `runReportLocation`, `registryFresh`,
  `minedTestRootDisclosed`) but not the new `stageModelPlan`. Added `stageModelPlan?:*` to the
  typedef so the doc stays consistent with the new `UNIVERSAL` key (also a boy-scout in-file
  consistency fix). Re-ran the suite: 10/10 green, `key: '` count still 5.

**Prose checks (all clear):**
- **Cross-references resolve.** mine-skill-gaps §Execution topology → `mine-family-core.md`
  §Kickoff checklist item 5 (added) via the relative path already used elsewhere in the file;
  mine-family-core item 5 → mine-skill-gaps §Execution topology (exists); the Heading-less-tolerance
  clause → §S3 capture-leak subsection (exists). `skill-lint` E6 (cited-reference existence) passed
  for all dirs, corroborating.
- **No narrowed guarantee.** Touch point 2 *widened* the match (`## Skill Gaps` → any heading level,
  case-insensitive); the "candidate of record is the fielded entry" guarantee is preserved verbatim,
  only the `##` literal was generalized to `Skill Gaps`. Canonical heading stays `## Skill Gaps`
  (per `lessons-format`) — the sweep merely tolerates variants.
- **No stale enumeration.** Grep confirmed mine-family-core.md has no other 4-item universal
  enumeration beyond the Tier-1 list (now 5) and the checker header comment (updated); no
  universal-set re-listing exists outside the 8 handled enumeration files (checked via
  `runReportLocation` / `run-report location` sweep across `plugins/ scripts/ tests/`).
- **capture-leak term not widened.** The new **capture-signal** disposition is introduced as
  *distinct* from the precisely-defined orphan-cell **capture leak**, with an explicit
  do-not-conflate clause — exactly the plan's MEDIUM-folded requirement.
- **confirmed() semantics unchanged.** A non-empty `stageModelPlan` string passes; `undefined`
  refuses — proven by the base test (green) and the `(a2)` loop (red→green).

**Carry-over observation (for reviewer):**
- **[LOW, by design] capture-signal has no dedicated S3 emit subsection** (unlike capture leaks,
  which have `## Capture leaks`). The plan scoped touch point 3 to "one clause distinguishing the
  two is enough" — a prose hardening that names and surfaces the disposition, not a registry-schema
  change. Recorded so the reviewer knows the omission is intentional, not an oversight.

## Deviations from Plan
- **Step 4 full-suite invocation form.** The plan's `node --test tests/unit/` (directory form)
  errors under this repo's Node **v24.18.0** — the runner tries to load the directory as a CJS module
  (`Cannot find module '…/tests/unit'`), a Node-version invocation quirk, NOT a test failure and NOT
  caused by any F17 edit. Ran the equivalent shell-expanded glob `node --test tests/unit/*.test.mjs`
  instead, which runs every file in the directory (538 tests, 42 files) — the plan's intent
  ("full regression, no unrelated breakage") is satisfied. The Step-3 single-file form
  (`node --test tests/unit/kickoff-preflight.test.mjs`) works as written and was used verbatim.

*Status: COMPLETE — developer, 2026-07-20*
