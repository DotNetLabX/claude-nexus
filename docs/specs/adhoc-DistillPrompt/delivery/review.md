# Distill Prompt Skill — Review

## Step 1 — Done-Check

**Pre-commitment predictions (3 most likely gaps):** (1) skill-invocation log mismatch — the mapped
skills not actually appearing in `.claude/audit/skill-invocations.log` scoped to this run; (2) the
`wiring.test.mjs` change being scope creep rather than a justified root-cause deviation; (3) the
`selfcheck` 4/4 / `skill-lint` claims being asserted rather than freshly verified. All three were
checked specifically and **none materialized** — see notes.

**Evidence gathered (code-grounded, per the shared/external-artifact mandate — this is a shipped
plugin skill):**
- `plugins/nexus/skills/distill-prompt/SKILL.md` read: closed 4-key frontmatter (`name`=folder,
  `description` ≫20 conveying lossless + human-invoked, `user-invocable: true`,
  `disable-model-invocation: true`); 7-stage Method; lossless rule single-owned at stage 4 with
  thesis echoes; never-invent at stage 6 + scope/NOT-do echoes; `## Arguments` + empty-input
  fallback; `/nexus:distill-prompt` slash form; no XML/angle-bracket tokens (E7). The AP3
  consolidations are visible (stage 4 lossless owner; `## Output shape` owns block structure, stage 7
  defers to it).
- `plugins/nexus/.claude-plugin/plugin.json` → `version` `1.15.0` (MINOR). `CHANGELOG.md` carries the
  `[1.15.0] — 2026-06-20` `distill-prompt` entry.
- `tests/lint/wiring.test.mjs` read: resolver (test 4) now imports `listSkills`, builds a skill-name
  set, and accepts `agents.has(name) || skills.has(name)` — agent references preserved.
- **Skill-invocation log scoped** to this run (session `b56d4b9d…`, `agent: developer`,
  `token: developer:implement`, 2026-06-20): `improve-skills` (06:52, Step 1) · `claude-api` (06:52,
  Step 1) · `evaluate-skill` (06:53, Step 2) · `improve-skills` (06:55, Step 2 fold) · `release-plugin`
  (06:56, Step 3) · `improve-skills` (07:12, Step 2b active pass). **Every non-`None` mapped skill is
  present in the authoritative log; no self-reported invocation is absent from it.**
- Fresh re-runs (not assumed): `skill-lint plugins/nexus/skills/distill-prompt` → **exit 0**;
  `node scripts/selfcheck.mjs` → **4/4 PASS** (tests/lint+unit 0 failing; gen-commands in sync;
  gen-omni twin in sync; bump present). `docs/skill-evals/2026-06-20-distill-prompt.md` exists (ACCEPT);
  `docs/skill-backlog.md` has the `### distill-prompt` entry.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Author `SKILL.md` | Implemented | File + folder exist; closed 4-key frontmatter (`name`=folder, desc≫20, `user-invocable`, `disable-model-invocation`); 7-stage recipe; lossless rule (stage 4 owner) + never-invent (stage 6) each stated explicitly; `## Arguments`+fallback; E7-clean. `improve-skills`+`claude-api` both in scoped log. `Satisfies: ADR-23` — real. |
| 2 — Job-fitness (`evaluate-skill`) | Implemented | Eval doc `docs/skill-evals/2026-06-20-distill-prompt.md` exists, verdict ACCEPT (sole keep-as-is LOW, no CRITICAL/HIGH to resolve); backlog logged. `evaluate-skill`+`improve-skills` both in scoped log. `Satisfies: ADR-23` — real. |
| 3 — Bump + twin sync (`release-plugin`) | Implemented | `plugin.json` `1.14.1→1.15.0` (MINOR, owner-escalated); `CHANGELOG.md` `[1.15.0]` entry; `gen-omni --check` twin in sync (verified via selfcheck). `release-plugin` in scoped log. `Satisfies: ADR-9, ADR-6` — real. |
| 4 — Terminal gate (lint + selfcheck) | Implemented (N/A-for-code; verified by command output) | Re-ran fresh: `skill-lint` exit 0; `selfcheck` 4/4 PASS. `Satisfies: ADR-23` — real. |
| Dev. item A — `tests/lint/wiring.test.mjs` fix | Deviated (valid reason) | Step-4-surfaced root-cause fix: the `/nexus:X` resolver was agents-only and failed on the skill's self-documented `/nexus:distill-prompt`. Widened to accept a shipped agent **or** skill (skills *are* invoked as `/nexus:{name}` — exactly the plan's Scope). Test file, not shipped `plugins/**` → no bump needed; selfcheck green with it. Correct call: the lint encoded a pre-skill assumption; the test was wrong, not the skill. |
| Dev. item B — owner-directed active `improve-skills` pass | Implemented | 3 AP3 (one-fact-one-owner) consolidations to `SKILL.md` (opener, grounding section, stage 7/Output shape) — net complexity down. Confirmed by the 6th scoped-log `improve-skills` entry (07:12) and visible in the read SKILL.md; gates re-run green (gen-omni/skill-lint/selfcheck exit 0); no second bump (rides the 1.15.0 release). |

**Skill conformance:** `## Skills Used` section present (required). Every non-`None` plan mapping
(`improve-skills`, `claude-api`, `evaluate-skill`, `release-plugin`) appears in the authoritative
`skill-invocations.log` scoped to this developer run — no fabrication, no missing mapped invocation.
TDD `no` throughout (prose recipe; no testable code behavior) — consistent with the plan.

**Carry-overs (out of scope, not blockers — flagged for the reviewer, not findings against this
feature):**
- `claude plugin validate --strict` errors on 4 **pre-existing, unmodified** skills
  (`boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills`) — `distill-prompt` is NOT flagged. The
  plan's authoritative terminal gate is `skill-lint` + `selfcheck` (both green); the strict YAML parser
  is stricter than the repo's own CI gates. Pre-existing; attribution confirmed read-only.
- `nexus:fleet` reference in `skills/fleet/scripts/render-fleet.mjs:2` escapes the resolver (the
  wiring walk scans only `.md`). The widened resolver would resolve it if `.md`-scanning were ever
  extended to scripts. Separate decision; out of scope.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-20*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer), 2026-06-20. Code-grounded: SKILL.md read directly, `skill-lint` and `selfcheck` re-run fresh (not assumed), wiring test re-run fresh.

## Verdict: APPROVED

## Pre-commitment Predictions

| Prediction | Result |
|------------|--------|
| Frontmatter key-set: wrong key count, typo, or description below ≥20 floor | Refuted — exactly 4 keys; description 369 chars; frontmatter.test.mjs 4/4 passes |
| Lossless and never-invent rules implied rather than named explicitly (plan mandates both as explicit statements) | Refuted — lossless rule explicit at stage 4 (single normative owner) + intro/grounding/scope echoes; never-invent explicit at stage 6 heading + body prose + NOT-do fence |
| wiring.test.mjs resolver fix too narrow or too broad (regression risk) | Refuted — `agents.has(name) \|\| skills.has(name)` with correct skill-name extraction; all 4 wiring tests pass; existing agent references unaffected |
| selfcheck/skill-lint claimed green without fresh run | Refuted — both re-run fresh this session; output captured in Evidence table |
| AP3 consolidations incomplete or introducing regression | Refuted — three consolidations visible in SKILL.md; each core fact has one full-statement owner; no plan invariant removed |

## Findings

No findings with confidence ≥80. All plan invariants verified.

## Positive Observations

- **Plan conformance is complete and traceable.** Every step's `Satisfies:` annotation was verified: ADR-23 (born-compliant frontmatter, judgment gate via evaluate-skill, deterministic terminal gate), ADR-9 (release flow), ADR-6 (twin sync). No intent drift detected.
- **Root-cause deviation on wiring.test.mjs is the correct call.** The plan named `frontmatter.test.mjs + selfcheck`; `selfcheck` runs all `tests/lint/*.test.mjs`, which includes `wiring.test.mjs`. The pre-existing assumption (agents-only resolver) was the bug; widening to agent-or-skill is precise and correct. The skill's own `/nexus:distill-prompt` description form is load-bearing (it is the platform's discovery trigger), so mangling the skill would have been the wrong fix.
- **The three AP3 consolidations are structurally clean.** Stage 4 is the single normative owner of the lossless rule; `## Output shape` is the single owner of the block structure; stage 7 defers to `## Output shape` by name. The opener and grounding section carry thesis-pointers, not full restatements — exactly the proven siblings (`research`) pattern.
- **Never-invent rule is stated explicitly three times without duplication.** Stage 6 heading names it, body prose elaborates it ("state the never-invent rule to yourself and hold it"), `## What this skill does NOT do` restates it as a fence. These are structurally distinct surfaces (execution, elaboration, boundary fence) — not AP3 drift.
- **Eval doc (`docs/skill-evals/2026-06-20-distill-prompt.md`) is thorough.** All four rubric layers checked; sole finding a keep-as-is LOW with explicit disposition. `improve-skills` routing section correctly records the no-change rationale for the first consolidating pass.
- **UTF-8, no BOM, no XML tokens.** First bytes `2d2d2d`; angle-bracket grep returns no results. E2 and E7 compliance confirmed.

## Gaps

None identified. The feature scope is additive and tightly bounded (one new SKILL.md + a test fix + a version bump). Edge cases relevant to this skill are behavioral (runtime model behavior when invoked) — excluded from the code review scope per the plan's testing strategy (manual smoke is owner-run). The plan's out-of-scope items (no agent, no hook, no command file) are all correctly absent.

## Carry-Over Findings (from implementation.md)

| Title | Severity | Assessment |
|-------|----------|------------|
| `claude plugin validate --strict` fails on 4 pre-existing skills | LOW | **Confirmed out of scope.** `git status` clean for all 4 files; `distill-prompt` is not flagged. The plan's terminal gate is `skill-lint` + `selfcheck` (both green). The strict YAML parser divergence is a pre-existing issue predating this feature. Not a finding against this change. |
| `nexus:fleet` reference in `render-fleet.mjs:2` escapes wiring resolver | LOW | **Confirmed out of scope.** The `walk` function in wiring.test.mjs scans only `.md` files (line 112–118). The widened resolver would handle this if `.mjs`-scanning were added — a separate decision outside this feature's scope. Not a finding against this change. |

## Open Questions

None.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| skill-lint | PASS | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/distill-prompt` | `OK    distill-prompt` (exit 0) |
| selfcheck | PASS (4/4) | `node scripts/selfcheck.mjs` | `[PASS] tests (lint + unit) — 0 failing; [PASS] gen-commands drift — in sync; [PASS] gen-omni --check — twin in sync; [PASS] bump-plugin --check — bump present`; `selfcheck: 4/4 passed` |
| frontmatter.test.mjs | PASS (4/4) | `node --test tests/lint/frontmatter.test.mjs` | `pass 4, fail 0` (includes closed-key-set + description ≥20 + skill lint dogfood) |
| wiring.test.mjs | PASS (4/4) | `node --test tests/lint/wiring.test.mjs` | `pass 4, fail 0` (test 4 = agent-or-skill resolver) |
| plugin.json version | PASS | Read `plugins/nexus/.claude-plugin/plugin.json` | `"version": "1.15.0"` |
| CHANGELOG entry | PASS | Read `plugins/nexus/CHANGELOG.md` | `## [1.15.0] — 2026-06-20` present with correct description |
| BOM check | PASS | Python byte read | First bytes `2d2d2d` (no BOM) |
| E7 (no angle-brackets in prose) | PASS | `grep "<\|>"` on SKILL.md | No matches |
| AP5 (create-feature-spec exists) | PASS | `test -f plugins/nexus/skills/create-feature-spec/SKILL.md` | EXISTS |

*Status: COMPLETE — reviewer, 2026-06-20*
