# Build-Flow Formalization — Review

## Step 1 — Done-Check

**Done-check method:** code-grounded (ad-hoc lane, no spec.md — dispositions verified against on-disk
state + the `.claude/audit/skill-invocations.log`, per `architect.md:134`). Round token at done-check:
`architect:donecheck`; developer round token: `developer:implement` (session `19e36d5c`).

**Pre-commitment predictions (made before reading implementation.md):** (1) the Step-1 "consume,
don't restate P1/P2" greppable check — easy to reference yet still paraphrase a schema; (2) the Step-5
`Satisfies:` "where-present, never blanket-mandate" wording — risk of a hard-gate phrasing that
retro-fails existing plans; (3) the Step-3 `improve-skills` invocation in the skill log. **All three
verified clean** (see notes).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — New ADRs (PROPOSED) | Implemented | ADR-25…ADR-29 appended after ADR-24 (`README.md:658/678/702/724/746`); all five carry `PROPOSED — owner ratifies` (11 hits) + the verbatim ADR-24 `(owner ratifies)` banner (6 hits); Contents list updated (`:43-47`). All five binding content units present (master gate / flow+RESEARCH / definition branch / proposal lifecycle / backlog lifecycle). **Hard constraint verified both halves:** ADR-26 references P1 (`research-before-asking.md`) + P2 (`search-researches`/`adhoc-ResearchKB`) by name AND states "their entry/output schemas are not restated here"; defers the rule-file recall edits to `adhoc-ResearchKB`; Rejected-alternatives names "Restate P1/P2's schemas — violates the hard constraint." VERIFY row names T1–T4 + mine-verify **by reference, NOT built here**. |
| 2 — Tech-spec | Implemented | `definition/tech-spec.md` created (§2a design-doc shape); `## Non-goals` lists R6-build + P1/P2/P3-redefinition; references ADR-25…29, does not restate decisions (one-authoritative-source). |
| 3 — `proposal-format` skill | Implemented | `plugins/nexus/skills/proposal-format/SKILL.md` created; `skill-lint.mjs` → exit 0 (`OK proposal-format`). **Skill-conformance (authoritative log):** `improve-skills` logged `agent=developer, token=developer:implement, session=19e36d5c` — the round window. Self-report corroborates. Defines RFC-lite front-matter + NABC; points lifecycle rules back to ADR-28 (format-only). |
| 4 — `docs/backlog.md` | Implemented | Created (the team-lead/PO already depend on it); header = ratified-proposal queue, row schema with `Impact ÷ Effort`, lifecycle rule matching ADR-29 (ratified ⇒ row; unratified = idea inbox), Shape Up zombie-row warning. One illustrative row only — **no migration** (Q3 honored). |
| 5 — `Satisfies: AC-n` traceability (R5) | Implemented | Wired into all four surfaces — `create-implementation-plan/SKILL.md:70` (+ `plan-template.md`), `architect.md:228` (done-check cross-check), `reviewer.md:25` (Plan-conformance), `review-format/SKILL.md:37`. **Binding-constraint verified:** every surface phrases it optional / where-present; SKILL.md explicitly says **never** a blanket "every step must carry `Satisfies:`" mandate (`:76`). No retro-fail risk to existing plans. |
| 6 — Light agent edits (R4) | Implemented | `architect.md:135` — "for a technical feature you own the definition — tech-spec + extracted ADRs" + the graduate rule (this line was **absent at plan time**, verified — a genuine addition). `po.md:19` — "a ratified product proposal is the spec seed" (also absent at plan time). Both reference ADR-27/ADR-28; neither restates ADR text. |
| 7 — Release (bump + regen) | Deviated (valid reason — owner-confirmed Q5) | **Sanctioned dry-run-only state.** Per the owner-confirmed Q5 answer, the developer's Step-7 was narrowed to dry-run + report; the team lead owns apply/regen/commit (ADR-18). `bump-plugin.mjs --minor --dry-run` reported `1.8.3 → 1.9.0`; nothing applied, nothing committed. `release-plugin` logged `agent=developer, token=developer:implement, session=19e36d5c` (the round). **On-disk confirmed:** this pass's edits are all unstaged (no developer commit, ADR-18 honored); the staged `M ` 1.8.3 files (plugin.json, CHANGELOG, pipeline-gate.js, the test) are the pre-existing GateNegationFix release, untouched. **OPERATOR ACTION REQUIRED carried to the team lead** (apply bump after reconciling the co-staged 1.8.3; regen 3 commands — architect/po/reviewer — + omni; commit as one). |

**Open production/operator gate (disclosed, not a Fail):** the MINOR bump (`1.8.3 → 1.9.0`) and the 3
command regenerations are **owed to the team lead** (sanctioned dry-run; ADR-9/ADR-18/ADR-20). The
verdict is PASS; this is the open gate the team lead closes at release, plus the two co-staged releases
(GateNegationFix 1.8.3 then this pass's 1.9.0) it must order. Carried from implementation.md
`## Carry-Over Findings` + `## Deviations`.

**Skill-conformance summary:** the two non-`None` plan steps (3 `improve-skills`, 7 `release-plugin`)
both appear in `.claude/audit/skill-invocations.log` under the developer round token. Steps 1/2/4/5/6
are all-`None` prose authoring (the all-`None` exemption applies — an empty log for those is not a
Fail). `## Skills Used` section present (structural requirement met).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-14*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer). Evidence gathered with fresh greps and tool invocations in this session (2026-06-14).

## Verdict: APPROVED

## Pre-commitment Predictions

1. **P1/P2 hard-constraint discipline** — would the RESEARCH ADR restate P1/P2 schemas rather than just reference them? ADR-26 explicitly states "their entry/output schemas are not restated here" and its Rejected-alternatives names restating as violating the hard constraint. VERIFIED CLEAN.

2. **`Satisfies:` optional/where-present wording** — could any surface phrase it as a blanket mandate, retro-failing existing plans? All four wiring surfaces (SKILL.md, plan-template.md, architect.md done-check, reviewer.md dimension 1, review-format checklist) use "optional", "where present", or "not a mandate." VERIFIED CLEAN.

3. **PROPOSED banner coverage** — would any new ADR lack the required marker? grep finds 11 hits on ADR-25…ADR-29 headings and Contents list entries. Every new ADR is marked. VERIFIED CLEAN.

4. **Skill-lint conformance for proposal-format** — would the born-compliant requirement be met? `skill-lint.mjs` exits 0 (`OK proposal-format`). VERIFIED CLEAN.

5. **No scope creep or unexpected file changes** — git status shows exactly the expected changes plus pre-existing staged GateNegationFix files (untouched by this pass). VERIFIED CLEAN.

## Findings

No findings at severity CRITICAL or severity HIGH. See Positive Observations and Gaps.

## Positive Observations

- **Hard constraint discipline is rigorous and layered.** ADR-26 names P1/P2 by name, states the no-restatement rule in the ADR body, AND includes it in the Rejected-alternatives section — making the constraint checkable in three independent places. The tech-spec and proposal-format skill reinforce the same boundary without restating the underlying schemas.
- **`Satisfies:` optionality is universally consistent.** All four wiring surfaces use identical "where present / not a mandate / existing plans predate it" language. No inconsistency risk for existing plans.
- **PROPOSED status implementation is correct.** The banner reconciliation (Q4: parenthetical ADR-24 shape in the `>` block + em-dash phrase in the heading to satisfy the plan's acceptance grep) satisfies both constraints simultaneously. 11 grep hits confirm every new ADR is marked.
- **One-authoritative-source discipline maintained.** Tech-spec links to ADR-25…ADR-29 and does not restate decision text; ADRs cross-reference each other without duplicating content; proposal-format skill points lifecycle rules to ADR-28 without restating the ratification rule. ADR-4 format/lifecycle split is correct.
- **Minimal backlog is exactly as specified.** `docs/backlog.md` has the column schema, the lifecycle rule matching ADR-29, the impact÷effort ordering, the appetite-bucket divisors, and exactly one illustrative row explicitly marked as illustrative. No migration of existing proposals — Q3 honored.
- **Skill lint clean on all modified skills.** `proposal-format`, `create-implementation-plan`, and `review-format` all exit 0 on skill-lint. The 17 structural lint tests (skill-refs, wiring, release, convergence) all pass.
- **Pre-existing test failure correctly isolated.** The nexus-dotnet frontmatter failure (`disable-model-invocation`) predates this pass — confirmed via `git show HEAD:` which shows the key present on HEAD, and the file is absent from this pass's working-tree diffs.

## Gaps

- **Carry-over: pre-existing nexus-dotnet frontmatter lint failure.** `tests/lint/frontmatter.test.mjs` fails on `plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md: unknown frontmatter key "disable-model-invocation"`. Confirmed pre-existing — not caused by this pass. Not in scope to fix here.
- **Carry-over: co-staged releases (GateNegationFix 1.8.3 + this pass's dry-run 1.9.0).** Team lead operator action required: commit GateNegationFix 1.8.3 first, then apply MINOR bump, run gen-commands (3 commands: architect, po, reviewer), run gen-omni, commit as one. Sanctioned by Q5.

## Open Questions

None. All carry-over findings are confirmed or refuted below.

## Carry-Over Findings Disposition

| Carry-Over Finding | Status | Evidence |
|---|---|---|
| Pre-existing lint-test failure in nexus-dotnet skill | Confirmed pre-existing — not from this pass | `git show HEAD:plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md` has `disable-model-invocation` on line 5; file absent from this pass's working-tree diffs |
| Two co-staged releases (Q5) | Confirmed accurate | `git status` shows staged 1.8.3 GateNegationFix files; dry-run reports `1.8.3 → 1.9.0`; team lead reconciles |
| `claude plugin validate` clean; nexus lint tests green | Confirmed | `claude plugin validate plugins/nexus --strict` → PASSED; 17/17 structural lint tests pass; 1 failing test is pre-existing nexus-dotnet item, not nexus |

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| skill-lint proposal-format | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/proposal-format` | `OK    proposal-format` |
| skill-lint create-implementation-plan | pass | same script, create-implementation-plan | `OK    create-implementation-plan` |
| skill-lint review-format | pass | same script, review-format | `OK    review-format` |
| PROPOSED banner on every new ADR | pass | `grep -n "PROPOSED — owner ratifies" docs/architecture/README.md` | 11 hits: ADR-25 through ADR-29 headings + Contents entries |
| P1/P2 referenced by name, no schema restated | pass | `grep -ni "research-before-asking\|search-researches\|adhoc-ResearchKB" docs/architecture/README.md` | Referenced at lines 668/682/690; no schema fields copied into the ADR |
| `Satisfies:` optional wording | pass | `grep -ni "Satisfies" plugins/nexus/agents/architect.md plugins/nexus/agents/reviewer.md` | Both: "where present, not a blanket gate" / "where-present check" |
| Tech-spec references ADRs without duplicating | pass | `grep -ni "ADR-" docs/specs/adhoc-BuildFlowFormalization/definition/tech-spec.md` | ADR-25 through ADR-29 referenced; no decision text duplicated |
| Backlog schema + lifecycle + no migration | pass | Read `docs/backlog.md` | Column schema, impact÷effort rule, lifecycle rule matching ADR-29, one illustrative row, no migration |
| claude plugin validate | pass | `claude plugin validate plugins/nexus --strict` (via node exec) | PASSED |
| Structural lint (17 tests) | pass | `node --test tests/lint/skill-refs.test.mjs tests/lint/release.test.mjs tests/lint/wiring.test.mjs tests/lint/convergence.test.mjs` | 17 pass, 0 fail |
| frontmatter test failure pre-existing | pre-existing, not this pass | `git show HEAD:plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md` | `disable-model-invocation` present on HEAD; file absent from this pass's diffs |
| bump dry-run | pass | `node scripts/bump-plugin.mjs --minor --dry-run` | `nexus: MINOR  1.8.3 -> 1.9.0` with correct reasons |
| Impact/effort ADR content units greppable | pass | `grep -ni "impact.*÷\|impact.*effort\|idea inbox" docs/architecture/README.md` | Lines 733/736/754/755/758 — all R7 content units present |

*Status: COMPLETE — reviewer, 2026-06-14*

---

### Re-review (cycle 1) — 2026-06-14

**Verdict: APPROVED** — no change to original verdict. All four fixes verified; no regressions found in adjacent call sites.

**Fix verification:**

| Fix | Check | Result | Evidence |
|-----|-------|--------|----------|
| FIX 1 — `Spec` column added to `docs/backlog.md` schema | Read backlog.md header row + bullet list | pass | 7-column header at line 15 with `Spec` column; `Spec` column bullet at lines 21-22 explaining fill/empty semantics |
| FIX 1 — `po.md:54` updated to match | Read po.md:54 | pass | "put the spec path in the row's `Spec` column" — consistent with backlog schema |
| FIX 2 — Impact/Effort reconciling rule in `proposal-format` SKILL.md | Read front-matter rules section | pass | New `Impact/Effort rule` bullet at SKILL.md:41-46: omitting Impact = master-gate "one ADR line" path only; any backlog row MUST carry both Impact and Effort |
| FIX 2 — Reconciling clause mirrored into ADR-29 | `grep "backlog row MUST" docs/architecture/README.md` | pass | Line 754: "Any proposal destined for a backlog row MUST therefore carry both `Impact` and `Effort`" |
| FIX 2 — skill-lint still exits 0 | `node skill-lint.mjs proposal-format` | pass | `OK    proposal-format` |
| FIX 3 — illustrative row uses obvious placeholder path | `grep "proposal-slug" docs/backlog.md` | pass | Line 17: `docs/proposals/<proposal-slug>.md` — `sample-feature.md` no longer present |
| FIX 4 — tech-spec formalized-flow opener names ADR-26 and ADR-25 ownership | Read tech-spec.md:82-85 | pass | "decided in ADR-26 … ADR-26 owns that matrix and the stage's output-contract decision; ADR-25 owns the master gate" |
| FIX 4 — tech-spec definition-branch opener names ADR-27 ownership | Read tech-spec.md:104-106 | pass | "decided in ADR-27 (it owns this decision). The paragraphs below are the rationale, not the decision." |
| Structural lint still green after all edits | `node --test tests/lint/skill-refs.test.mjs tests/lint/wiring.test.mjs tests/lint/convergence.test.mjs` | pass | 12 pass, 0 fail |

**Adjacent-call-site sweep:**
- `po.md` FIX 1 at line 54 is a standalone sentence in "After the spec goes Ready:" — the adjacent `create-feature-spec` skill invocation (line 50) and spec-review gate (lines 115-125) are unaffected.
- `proposal-format` FIX 2 adds a new bullet under `Front-matter rules:` — preceding `Confidence:` bullet and Body sections unchanged; Consumers table (Team Lead row cites Impact/Effort) now has consistent backing.
- ADR-29 FIX 2 clause appended to first Decision bullet — remaining bullets (unratified inbox, schema/no-migration, Shape Up warning) unchanged.
- `backlog.md` FIX 1+3: `Spec Ready` Status value now references "put its path in the `Spec` column", consistent with `po.md:54` and the new Spec-column bullet. Effort divisors bullet and no-migration note unchanged.
- Tech-spec FIX 4: purely additive parentheticals in two section openers; Cross-cutting section (already had inline ADR ownership refs) verified unchanged.

*Re-review — reviewer, 2026-06-14*
