# VWH Adoptions (Allocation Principle + Selfcheck) — Lessons

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] node --test bare-dir Node≥22 regression pinned as a testing convention (5-run recurrence) → tests/README.md Conventions.

## Architect Lessons

- **A "verified" claim was nearly shipped unverified.** The Q1 recommendation initially said
  generous salience ceilings "pass against today's files" — written from assumption. The actual
  measurement showed 8/19 files fail, inverting the recommendation. The existing rule ("any count
  the plan cites comes from a grep run at plan time, never from memory") applies to *every*
  recommendation surfaced to anyone, not just plan-step counts. Catching it pre-presentation
  worked, but only because the claim was re-read skeptically.
- **When Phase-1 corrects a scope ("build X" → "extend existing X"), the plan must carry the
  boundary as a disposition table.** The code-grounded critic's three HIGHs shared one root: the
  catalog-item de-duplication (which checks exist / which are new / which are deferred) happened in
  the architect's head and questions.md, but not in the plan — leaving the developer to either
  re-implement covered checks or silently drop real gaps. One table resolved all three HIGHs.
- **Code-grounded critic review again out-performed what a doc-only pass could see.** Every finding
  with teeth required reading live test files (`frontmatter.test.mjs:51` overlap, missing
  nexus-dotnet hooks.json, the em-dash anchor slug). Reinforces the standing rule: shared-artifact
  passes get code-grounded review, mandatory.

— Done-check —

- **The plan's Skill Mapping omitted the TDD column** that `create-implementation-plan` mandates on
  every plan. Harmless here (the per-lint red-check Accept criteria carried the testable-behavior
  intent, and the developer executed them), but the done-check's skill-conformance step had no TDD
  column to verify against — the conformance check silently loses a dimension when the plan drops
  the column. Self-directed: include the TDD column even when every row would be `no` or covered by
  Accept-level red checks.
- **A plan-sanctioned deviation surface pays off at done-check.** Both deviations (glob-form test
  invocation, surgical bump) resolved in one line each because the plan had pre-declared the
  developer's-call points and the implementation documented reasons inline. The Node ≥22 bare-dir
  regression is a plan-authoring fact worth pinning in testing conventions so it is never written
  into a plan again (developer lesson already proposes this).

### Improvement Proposal (systemic) — [ROUTED-TO-PLUGIN · P4 → docs/plugin-feedback/nexus-1.8.2-2026-06-13.md]
**Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md`
**Change:** Add a rule: when the plan's scope is corrected from "create" to "extend" an existing
surface (test suite, script, doc), the plan MUST include a disposition table mapping every item of
the source catalog/brief to `covered (where)` / `new (step)` / `deferred (why)` — the
de-duplication boundary is a plan artifact, not working memory.
**Evidence:** adhoc-VwhSelfcheckAndPrinciple critic review — 3 HIGHs, one shared root, fixed by one
table.
**Priority:** medium

## Developer Lessons

- **Phase-1 analysis re-verified every load-bearing plan claim against the live tree before
  reporting clear** — none needed correction. Concretely confirmed: the Slug/paths/caps block is
  md5-identical across all 8 agents (`6ba8b58c…`); `commands/` is 9 files with `backlog.md` the lone
  orphan; the only `subagent_type=`/`nexus:` reference anywhere in agents/rules/skills is
  `nexus:critic` (so Step 4.4's `Explore`/`general-purpose` allowlist is purely forward-looking, not
  needed today); plugin.json `userConfig` keys are exactly `security_mode`+`token_audit` (matching
  the `${user_config.*}` placeholders in hooks.json); and the salience definition reproduces the
  cited numbers exactly (architect.md max-block 574, agents-workflow.md 1034). A plan this
  code-grounded made Phase-1 a verification pass, not a question-generation pass.
- **Two existing tests already cover what new scripts need, reducing Step 5/6 surface.**
  `release.test.mjs:55` runs `node --check` over every `scripts/*.mjs`, so the new
  `salience-report.mjs`/`selfcheck.mjs` get syntax-smoke coverage for free. `release.test.mjs:20`
  already asserts plugin.json↔CHANGELOG agreement (catalog #6 "covered"), and `frontmatter.test.mjs`
  lines 17/34/51/64 cover catalog #1c/#2/#1a/#3-targets — the four "do NOT re-implement" rows checked
  out exactly as the plan's disposition table claims.
- **The prior sonnet developer's partial edit was confirmed reverted** — `docs/architecture/README.md`
  has zero "allocation principle" matches and a clean `git status`; the only untracked slug target is
  the proposal doc itself (Step 7's edit target). Step 8's scoped commit must include that untracked
  proposal file alongside the tracked edits.

— Phase 2 (implementation) —

- **The plan's bare-dir `node --test` form (check 1 of the selfcheck) regressed on Node ≥22.**
  `node --test tests/lint tests/unit` now resolves the bare directory args as *modules*
  (`Cannot find module 'tests/lint'`) and fails even on a green tree; only the glob form
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (what `tests/README.md`/CI already use)
  works on v24.13.0. Worth pinning in the testing conventions so the bare-dir form is never written
  into new tooling. (Documented as the single deviation in implementation.md.)
- **`bump-plugin.mjs` is all-or-nothing across plugins — dangerous when another slug's change is
  staged.** The bulk apply bumps *every* changed plugin; here it would have re-bumped nexus-dotnet
  (a different slug's already-bumped `csharp.md`). There is no `--plugin <name>` scope flag. For a
  single-plugin feature with unrelated staged changes present, a **surgical** version edit +
  CHANGELOG prepend is safer than the bulk tool. Candidate: a `--plugin <name>` filter on
  `bump-plugin.mjs` would let the release skill stay the single owner without cross-slug bleed.
- **gen-omni `--check` flags gitignored stray files as drift.** `plugins/nexus/agents/.omc/state/*`
  (OMC runtime junk, gitignored + untracked in this repo) showed as "missing" in the omni twin until
  a sync copied them across — noise that has nothing to do with any feature. The check compares file
  presence without honoring `.gitignore`. Minor, but it makes a clean-tree gen-omni `--check` non-green
  whenever OMC has run in the source tree.

### Improvement Proposal (optional, for systemic issues)
**Target:** `scripts/bump-plugin.mjs` (+ a note in `plugins/nexus/skills/release-plugin/SKILL.md`)
**Change:** Add a `--plugin <name>` filter so a release can be scoped to one plugin even when another
plugin has unrelated staged/unstaged changes. The release skill would pass the slug's plugin
explicitly instead of relying on "only my plugin happens to be dirty."
**Evidence:** adhoc-VwhSelfcheckAndPrinciple Step 8 — `bump-plugin --dry-run` flagged nexus-dotnet
(a different slug's staged `csharp.md`, already bumped 1.0.2→1.0.3) alongside the in-scope nexus bump;
the bulk apply would have corrupted the other slug's bump, forcing a surgical hand-bump instead.
**Priority:** low-medium

## Skill Gaps

- No skill covers dev-repo lint/test authoring (Steps 3–6 are all disposition None). Acceptable —
  TDAD says these grow from real failures, and the house conventions live in `tests/README.md`;
  a skill would duplicate it. No action proposed.

## Reviewer Lessons
- **[ROUTED-TO-PLUGIN · P1 → docs/plugin-feedback/nexus-1.8.2-2026-06-13.md]** **The pipeline gate's `\b(CRITICAL|HIGH)\b` regex fires on confidence markers like `**Confidence:** HIGH`.** The LEGEND pattern exempts table rows and "severity/meaning" lines, but a freestanding `**Confidence:** HIGH` in findings prose is not exempted. Solution: use lowercase `confidence:` in findings rather than the severity-vocabulary words, or phrase it as `(confidence: verified)`. Worth documenting in `review-format` so future reviewers don't trip the gate unintentionally with their own confidence qualifiers.
- **A vacuously-passing test branch (zero hits today, forward-looking regex) is a real review finding but only LOW severity.** The right call is to document it with the exact reason it is acceptable now and what would make it a problem — not to suppress it, and not to inflate it.
- **The gate's LEGEND exemption for `|` (table rows) means Evidence and Carry-Over tables with words like "pass" cause no false positives, but findings prose does.** Design review output so CRITICAL/HIGH only appear in table rows (where LEGEND fires) or with a RESOLVED marker nearby.

## Cross-cutting (relay reliability — evidence, not a lesson for this slug's pipeline)

- **4/4 subagent final messages stranded this session** (3 background Explore + 1 foreground
  critic): each produced its full report, then a duplicate-`SubagentStop`-hook storm (OMC interplay
  suspected) appended short acknowledgments, clobbering the final message that relay/TaskOutput
  returns. Salvage via `subagents/agent-{id}.jsonl` longest-assistant-text-block extraction
  recovered all four intact; re-asks failed 0/2 (consistent with 2026-06-10 measurements).
  Foreground spawning did NOT avoid it. Evidence routed to: `docs/proposals/vwh-adoptions-2026-06.md`
  (session evidence note). Candidate ADR-17 follow-up: relay consumers should prefer
  longest/last-substantive-block extraction over "final message" wholesale.
