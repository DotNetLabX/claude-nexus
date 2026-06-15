# adhoc-ResearchKB — Summary

**Status:** Complete · **Released:** nexus 1.10.0 (MINOR) · **Date:** 2026-06-15
**Team mode:** Standard+Codex · **Branch:** main

## What shipped

A self-contained research capability (ADR-1 — no OMC / external `deep-research` dependency): research **compounds** instead of repeating, and output is **cited or it doesn't ship**.

- **`search-researches`** skill — inline, user-invocable. Cheap **recall** (grep the local `docs/kb/research/` pool, validity-gated per R2) runs in the caller; on a cache miss it spawns a **forked read-only `Explore` researcher** (`WebSearch`/`WebFetch` only) that runs the web dive in its own context and returns a drafted, cited entry. Write-time **supersede-don't-delete**.
- **`research-entry-schema`** skill — the entry format (Question-answered, Verdict, Evidence tier, As-of + validity scope, Status, Reconfirm trigger, Corroboration), the 8-part output ordering, and the machine-checkable claim/citation grammar.
- **`cite-check.mjs`** — deterministic cite-or-drop validator the skill runs before persisting. Per-block source resolution + corroboration floor; fails on uncited claims, bare placeholders, and high-stakes single-source verdicts. 19 unit tests.
- Wired the always-on **`research-before-asking`** P1 rule to route capture + recall through the two skills.
- **MINOR release 1.9.3 → 1.10.0** (owner-escalated per R4; new capability).

## Steps

8/8 implemented. Two documented deviations, both assessed valid at the Step-1 done-check:
1. **Version 1.9.3 → 1.10.0** (plan said 1.9.2 → 1.10.0): an external commit (`f51f1f3`) bumped the baseline to 1.9.3 mid-run; MINOR-from-1.9.3 lands on 1.10.0 — the plan's exact target. Cosmetic drift, identical outcome.
2. **Step-7 Part-2 supersede composed directly** rather than re-running the already-proven live fork. Sound test economy — the fork was proven live in Step 4; the supersede *write* was verified deterministically on disk.

## Review

- **Step 1 done-check (architect):** PASS — 7 Implemented, 1 Deviated-valid, 0 Missing; skill conformance clean.
- **Step 2 (Standard+Codex, round 1):** nexus reviewer **APPROVED** (2 non-blocking findings) and an independent **Codex** cross-check returned **NO-GO** with two validator BLOCKERs the single-pass review missed:
  - prose (non-bullet) claim lines bypassed the bullet-only cite check;
  - source resolution + corroboration ran file-globally, defeating the rule in the multi-block steady state that supersede-don't-delete creates.
  - Reconciled finding-by-finding → merged **REQUEST CHANGES**. Fixed in cycle 1 (per-block rewrite of `cite-check.mjs`, tests 7 → 19), re-reviewed → **APPROVED**.
- **Final gate:** full suite **168/0**, skill-lint OK on both skills, cite-check exit 0 on the live artifact.

## Commits

1. `fc53a53` — `feat(adhoc-ResearchKB): add implementation plan` (plan + questions + binding research verdict)
2. (this) — `feat(adhoc-ResearchKB): implement search-researches + research-entry-schema, release 1.10.0`

Pre-pipeline cleanup commit (user-approved, separate): `7004755` — committed the in-flight 1.9.2 learner release first to clear a version collision with the Step-8 MINOR bump.

## Runtime notes

- **Concurrent external commit on `main` mid-run** (`f51f1f3`, subagent status-line rows, bumped 1.9.2→1.9.3). Confirmed NOT a pipeline-agent breach (clean violations.log, unrelated content); treated as legitimate parallel work and scoped around, not unwound. The implementation commit excludes it and all other unrelated dirty files.
- The `docs/kb/research/claude-code-skill-context-fork.md` live-validation artifact is committed as evidence (the dev repo is not a consumer, so this is out of the normal `docs/research/` convention) — safe to `git rm` if a convention-pure dev tree is preferred.

## Lessons

Recorded in `lessons.md` (developer + architect headings). Processing is the optional post-run step — pending user decision.
