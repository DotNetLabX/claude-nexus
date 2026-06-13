# Skill Evaluation — central-package-management

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `central-package-management/SKILL.md` (126 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `src/Directory.Packages.props` verified present (the skill cites it as the 82-entry worked example).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** E (architect/process).

## Layer 0 — Lint
PASS.

## F1: Time-sensitive "not proven until Passes 2/3" banner + ADR-013 + SprintRituals "Pass 0" reference
**Severity:** Medium
**Layer:** 2 / F6 / genericization
**Claim vs reality:** Opens with the `> Accepted but not proven until Passes 2/3 consume it. This skill encodes ADR-013…` banner (time-sensitive, internal pass-numbers). Also references a project named **SprintRituals** with a stray absolute path `D:\src\sprint-rituals\src\Directory.Packages.props` ("the after state") and a "SprintRituals note: As of Pass 0, all three forms return zero hits" — a moment-in-time claim about a specific project. Note: this skill references `sprint-rituals` where the Domain-family skills reference `Fokus` — so the estate's project-binding is **inconsistent across skills** (two different private projects named).
**Fix:** Remove the banner; drop the SprintRituals "Pass 0" moment-in-time note (the three-form grep is a general requirement — keep that, lose the project snapshot); keep the `dotnet-microservices` reference (it's the sweep's reference repo) but as an illustrative example, not "the after state of project X." Restate ADR-013 as "the CPM convention" without the project's ADR number. Couples to the Step-3 genericization decision.

## Rubric items checked clean
- L1.1 frontmatter = body (Directory.Packages.props at src/ root + bare PackageReference + three-form verification grep — all present)
- **L1.6 / P1 / L2.2 — BEST-IN-ESTATE deterministic check.** The three-form verification grep (inline `Version="`, child `<Version>`, `VersionOverride=`) WITH the **globstar-portability warning** ("do not use `src/**/*.csproj` with bare grep — globstar is off by default in Windows bash and CI; `**` would silently match nothing") is a genuinely excellent, hard-won mechanical check — exactly the P1 "deterministic post-condition script over prose" pattern. The `--include` vs ripgrep `--glob` dual form is correct.
- **L1.5 scope fence — PRESENT.** "What This Skill Does NOT Cover" (version choice, transitive resolution, TargetFramework → framework-currency).
- L2.4 followable cold: migration recipe is a concrete 5-step sequence; CORRECT/WRONG csproj examples
- L1.4 cross-skill: framework-currency interplay correctly described
- L3 N/A

## Verdict: **fix-then-accept** (rewrite-lite). The CPM *content* is excellent — the three-form grep with the globstar warning is a standout mechanical check worth preserving verbatim. The only defects are the time-sensitive banner + the SprintRituals project snapshot (F1), both resolved by the Step-3 genericization decision. **The inconsistent project naming (sprint-rituals here, Fokus in Domain skills) is itself a Step-3 input** — the estate can't bind to two different private projects.
