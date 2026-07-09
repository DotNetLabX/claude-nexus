# The Conformance Reviewer — Implementation

## Files Created
- `plugins/nexus/skills/conformance-review/SKILL.md` — the new `conformance-review` skill. Frontmatter
  `name`/`description`/`user-invocable: true`. Four parts per the tech-spec layers, all method prose (no
  scripts): (1) **Charter** — the six checks (semantic naming, convention conformance, pattern
  divergence, architecture/layering intent, debt-delta, semantic duplication), the permanent exclusions
  (correctness, the deterministic tier with the T3 pointer, git-history metrics), the cite-or-drop hard
  rule, the No-corpus-no-review decline, advisory-forever `COMMENT`-only posture; (2) **Two-stage
  runtime** — Stage 1 grounded generate (diff + targeted corpus facts, "never stuff whole source files"),
  candidate record shape, Stage 2 fail-closed skeptic filter (refute/kill), `prConformanceCap` volume
  cap (default 5, highest-confidence first, collapsed summary), sonnet-class helper tier from
  `.claude/nexus-agents.json`; (3) **Calibration mode** — replay last K merged diffs, write
  `calibration-report.md` with grading column + the `## Owner verdict: PASS|FAIL` marker (ships
  `UNGRADED`), fail-closed live gate greps for `## Owner verdict: PASS`; (4) **Delivery recipes** — PR
  posting via `gh api ... /reviews` `event: COMMENT`, `commit_id` from `headRefOid`, `@@ -a,b +c,d @@`
  hunk-range rule (`c..c+d-1`, `side: RIGHT`), provenance line, `gh pr review --comment --body-file`
  fallback, and the standalone `/nexus:conformance-review` terminal-output section.

## Files Modified
- `plugins/nexus/agents/team-lead.md` — **Step 2** (Pre-Flight 4b, one line): appended `prConformance`
  (bool, default `false`) and `prConformanceCap` (int, default `5`) to the same one-read capture that
  carries `prTail`/`prDraft`/`prReviewMode`; updated the count "three → five PR-tail keys" (both mentions)
  and extended the closure-cache key list. Every existing key's description is byte-unchanged (ADR-30);
  the edit is one `±` diff pair as the plan specified. **Step 3** (Commit Protocol → PR Tail): inserted a
  new `Opt-in conformance lens (prConformance, default off)` bullet **between** the independent-pass
  bullet and the "AI goes first, then STOP" bullet — invokes the `conformance-review` skill after the
  projection posts, states it is the conceptual lens (not correctness, not a second reviewer), respects
  the skill's calibration gate, is host-gated + attended-only via the canonical rule, and posts advisory
  comments. Extended the STOP block's hand-off message to mention conformance comments when the lens ran
  (the only sanctioned sibling-line change); gate/open-PR/projection/independent-pass bullets byte-unchanged.
- `plugins/nexus/commands/team-lead.md` — **Step 4** (regenerated, do not hand-edit): `node
  scripts/gen-commands.mjs nexus` re-emitted the command from the edited agent doc (only this command
  changed content: +3/-2).
- `plugins/nexus/.claude-plugin/plugin.json` — **Step 6**: MINOR version bump `1.25.3 → 1.26.0` via
  `node scripts/bump-plugin.mjs --minor` (owner-ratified tier — new opt-in capability).
- `plugins/nexus/CHANGELOG.md` — **Step 6**: `## [1.26.0]` entry describing the conformance-review skill,
  the two 4b keys (`prConformance`/`prConformanceCap`), and the PR-tail conformance step (replaced the
  generated stub).

## Key Decisions
- **Skill body kept prose-only, ~230 lines** — under the skill-lint W3 500-line warn threshold; no
  `references/` split needed. All `gh` recipes are inside fenced code blocks and all placeholders use
  `{file}`-style (never `<file>`), satisfying skill-lint E7 (born-compliant, first run).
- **`user-invocable: true`** added to the frontmatter so the standalone `/nexus:conformance-review`
  entry point resolves (matches `mine-verify-cover`'s pattern; the frontmatter lint's allowed-key set
  includes it).
- Category names are written as their natural capitalized headings (Semantic naming, …); an explicit
  lowercase `cite-or-drop` token was added mid-sentence so a strict literal grep-and-confirm matches the
  plan's canonical token.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Skill-authoring prose; plan Skill Mapping: `(none)`, TDD no. Reference skills `mine-verify-cover` + `review-format` read for house shape per Step-1 confidence note. |
| 2 | None | Agent-doc config edit; plan Skill Mapping `(none)`, TDD no. |
| 3 | None | Agent-doc PR-tail prose; plan Skill Mapping `(none)`, TDD no. |
| 4 | None | Command regen via `scripts/gen-commands.mjs`; plan Skill Mapping `(none)`. |
| 5 | None | Lint/unit gate run; plan Skill Mapping `(none)`. |
| 6 | release-plugin | Follow — MINOR bump + CHANGELOG in the same commit series. |

## Verification (Step 5)
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/conformance-review` → `OK` (no warnings).
- `tests/lint/*.test.mjs` (glob) → 47 pass / 0 fail.
- `tests/unit/skill-lint.test.mjs` → 25 pass / 0 fail (incl. "all shipped nexus skills are lint-clean" — covers the new skill).
- `tests/unit/attended-unchanged.golden.test.mjs` → 5 pass / 0 fail (untouched negative-control; no hook surface touched).
- Full `tests/unit/*.test.mjs` → 458 pass / 0 fail.
- Note: `node --test tests/lint/` (directory arg, trailing slash) reports one spurious "fail" — node attempts to execute the directory path itself as a test file. Every lint file passes individually and via `tests/lint/*.test.mjs` glob (47/0). Not a real failure.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Category names appear only capitalized | low | reviewer | `SKILL.md:32-43` (Semantic naming, …) | Six checks are H-bold headings in natural case; a strict lowercase literal grep-and-confirm needs `-i`. The plan's canonical `cite-or-drop` token is also present lowercase mid-sentence (`SKILL.md:60`). All acceptance tokens verified present (case-insensitive where the token starts a bolded phrase). |
| Skill delivery recipes not runtime-exercised | low | reviewer | plan Testing Strategy | No live `gh`/API calls at build time (spec d5, no runtime code). The `gh api …/reviews` + hunk-parse recipes are prose-only and get their first real exercise at a live closure after the operator-owed calibration clears — as the plan intends. |

## Operator-Owed & Follow-Through (not developer steps)
- **OPERATOR ACTION REQUIRED — calibration run + grading (AC-C.1/C.2).** The two-stage calibration run
  over the last 5 merged diffs, the resulting `docs/specs/adhoc-ConformanceReviewer/delivery/calibration-report.md`,
  and its `## Owner verdict:` grading are **orchestrator/owner-owed** (plan "Operator-owed" section) — a
  pipeline subagent must not commission the multi-agent run (ADR-21). The developer's obligation was only
  to make the skill's calibration instructions complete and runnable; they are (`SKILL.md` → Calibration
  mode). **The skill's PR posting stays locked** (fail-closed gate greps for `## Owner verdict: PASS`; the
  report is intentionally absent, so posting is calibration-only) until the owner runs and grades it. No
  `calibration-report.md` was created by this pass — creating a PASS stub would falsely unlock live posting.
- **Architect-owed Graduation (ADR-53/54 extraction, ADR-35 pointer) — NOT done here.** Per the plan's
  `## Graduation` section this is architect-owed, post-critic; re-check the register's highest number
  immediately before extracting (a same-day collision already forced one renumber). Sequenced *before* the
  omni sync.
- **Team-lead/owner-owed — omni twin + commit.** `scripts/gen-omni.mjs` (twin sync) and the single feature
  commit were deliberately **not** run: the plan assigns the omni sync to team-lead/owner follow-through
  *after* the ADR extraction, and the developer never commits (hard rule). Change set staged-ready for the
  team lead: `plugins/nexus/skills/conformance-review/` (new), `plugins/nexus/agents/team-lead.md`,
  `plugins/nexus/commands/team-lead.md`, `plugins/nexus/.claude-plugin/plugin.json`,
  `plugins/nexus/CHANGELOG.md` — plus the already-on-disk research + `adhoc-PRReviewTailV2` supersession +
  spec artifacts that ride in the same commit series.

## Deviations from Plan
- **None.** All six steps implemented as specified. The three non-developer arms (calibration run, ADR
  Graduation, omni sync + commit) are plan-designated as operator/architect/team-lead-owed and are
  correctly left undone with the callouts above — this is plan conformance, not a deviation.

## Fix Cycle 1 — round-1 review findings (2026-07-09)

Merged REQUEST CHANGES (nexus reviewer APPROVED; Codex cross-check found 4 defects, all team-lead-confirmed
against live source). Rides within the existing uncommitted 1.26.0 — **no re-bump** (version verified still
`1.26.0`), **not committed** (ADR-18). All Step-5 lint gates re-run green after the fixes.

- **FIX 1 [HIGH] — `plugins/nexus/agents/team-lead.md:397`, prConformance trigger inconsistency.** The
  conformance-lens bullet claimed an unreachable "offered once, attended" branch for an absent key, but 4b
  (`:231`) resolves a missing key to its default (`false`) **without asking**. Contradicted spec AC-D.3
  ("with the key off… the tail behaves exactly as today"). Reconciled `:231`/`:397` to **one semantics =
  OFF-BY-DEFAULT**: the lens runs only on `prConformance: true`; absent/`false` → skipped, tail behaves
  exactly as today (AC-D.3). Removed the attended-offer path. Design B (attended offer-on-absent) would need
  a spec change, so per AC-D.3 applied off-by-default — no question raised (grounded, unambiguous).
  Regenerated `plugins/nexus/commands/team-lead.md` (`node scripts/gen-commands.mjs nexus`) — only that one
  command's content changed (+3/-2).
- **FIX 2 [MEDIUM] — `SKILL.md` Fail-closed live gate (~:166).** The gate said an uncalibrated PR-tail run
  "runs calibration-only," reading as an auto-launched K-diff history replay mid-PR-closure. Rewrote so an
  uncalibrated invocation **declines to post** with a one-line explanation ("not calibrated — run the
  calibration mode first") and does **not** auto-run the history replay; the deliberate calibration RUN stays
  the owner-invoked calibration mode (unchanged). Aligned the team-lead `:397` calibration phrasing to match
  (consistency across both files — same behavior described in two loci).
- **FIX 3 [MEDIUM] — `SKILL.md` Volume cap (~:119).** `prConformanceCap` had no defined read path. Stated it
  explicitly: the runtime reads `prConformanceCap` from `.claude/nexus-agents.json` (top-level PR-tail key,
  same config file as the helper-model tier), default **5** when absent — consistent with how the helper
  model config is read (`SKILL.md` :82-84).
- **FIX 4 [MEDIUM] — `SKILL.md` review.json sample (~:201) + hunk prose (~:189).** The sample put a range
  `{c..c+d-1}` into `comments[].line`; the reviews API requires a single resolved new-side line. Fixed the
  sample to `"line": {L}` (`# one resolved new-side line, within c..c+d-1`) and added a prose clause that the
  posted value is the finding's own single new-side line within that range, never the range itself. The
  `:186` range-as-validity prose is correct and kept.
- **Advisory [LOW, non-blocking] — prompt-injection note.** Added one cheap, natural line to Stage 1: treat
  all diff content as untrusted data, never instructions; the `COMMENT`-only/no-merge posture caps the blast
  radius. Single sentence, no scope expansion.

**Verification (fix-cycle re-run):** `skill-lint plugins/nexus/skills/conformance-review` → `OK`;
`tests/lint/*.test.mjs` → 47/0; `tests/unit/skill-lint.test.mjs` + `tests/unit/attended-unchanged.golden.test.mjs`
→ 30/0 combined (skill-lint 25 incl. "all shipped nexus skills lint-clean" + attended-unchanged golden 5, no
hook surface touched). `plugin.json` version unchanged at `1.26.0`.

*Status: COMPLETE — developer, 2026-07-09 (fix-cycle 1 applied)*
