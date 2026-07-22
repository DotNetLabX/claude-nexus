# F18-SkillAuthoringStandards — Review

## Step 1 — Done-Check

**Pre-commitment predictions:** (1) path-predicate edge cases (nested targets, separator handling);
(2) §4 restates the description rule (third-statement drift); (3) the F24-recipe invocation fails
against the stale install cache. **Result:** (1) handled — `stackPluginDir` splits on both
separators with an `i > 0` guard, live-verified on win32; (2) refuted — point-don't-restate applied
uniformly, `## Assumes` backtick-wrapped in §4 to avoid a stray structural H2; (3) occurred exactly
as the documented Read-channel deviation branch anticipates (valid pass, below).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — skill-recipe §4 standards | Implemented | Independently verified: title names the section (:1), `## 4. Stack-skill standards` at :124; developer acceptance actuals recorded (Assumes ×4, Use when, lint 0). |
| 2 — skill-lint W5/W6 + tests | Implemented | Live re-run by architect: create-feature → W5 warn + exit 0; improve-skills → clean OK (scope exclusion). Suite 593/0. W5 baseline 42 / W6 baseline 5 = plan census exactly. Red-first evidenced (W6 via branch-neutralization anti-vacuity). |
| 3 — judgment wiring | Implemented | Rubric `Assumes` = 1 (0 before); Quality Gate bullet + warn-summary clause per critic C.2; point-don't-restate honored. |
| 4 — release + backlog | Implemented | Version 1.47.0 confirmed; dry-run reasons rule-2 clean; backlog diff = the F18 row only. |

**Skill conformance (log-scoped — agent=developer, session=main, ts ≥ 2026-07-22 21:08:54Z):**
`tdd` (21:14Z, Step 2) and `release-plugin` (21:22Z, Step 4) logged. `edit-shipped-plugin-skill`
(Steps 1–3): **Deviated (valid reason)** — the Skill tool failed on both name forms because the
skill (shipped in 1.46.0, uncommitted-to-cache) postdates the session's 1.44.1 install cache; the
developer read the repo-source SKILL.md and demonstrably ran its phases (pre-edit sweeps,
two-surface reconciliation, header-leg staleness). This is the documented Read-channel-deviation
branch — a valid pass, not a Fail; no fabrication (the deviation is self-disclosed, not a claimed
invocation).

**Plan hygiene:** `## Decisions` present (6 rows, non-silent). `## Self-Review` present with
verdict + per-angle evidence (in-context, disclosed — the developer correctly declined to spawn
review agents per ADR-21).

**Carry-overs accepted:** MINOR-veto stays open at close (owner's call); the W6 census
case-sensitivity note recorded.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-23*
