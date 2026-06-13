# Skill Evaluation — create-feature

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-feature/SKILL.md` (86 lines) + 6 workflow files (`Endpoint{FastEndpoints,Carter,MinimalApi}.md`, `Handler.md`, `Validator.md`, `Mappings.md`) + `CHANGELOG.md`
**Run artifacts:** none (consuming-project skill). Spec judged against `D:\src\dotnet-microservices` (FastEndpoints in 5 services verified; Carter/MinAPI are the other documented variants).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. All 6 workflow citations resolve.

## F1: Description tail is not a trigger clause
**Severity:** Low
**Layer:** 1.1 / F1 estate finding
**Claim vs reality:** `description` ends "...Check the service CLAUDE.md for which framework to use." That is an *instruction*, not a *when-to-use* trigger. Anthropic's authoring guidance (research-external.md F1) wants the description to state what-it-does AND when-to-invoke with key terms ("Use when adding a feature / vertical slice / endpoint"). The skill's own body has a strong "Required Reading" + "Anti-patterns" pair, so the gap is purely the frontmatter trigger.
**Fix:** Append a when-to-use clause to the description ("Use when adding a new feature / vertical slice / endpoint to a service."). Estate-wide F1 standardization (Step 3).

## F2: Per-skill CHANGELOG (estate consistency)
**Severity:** Low
**Layer:** 4.2 / F9 — same as create-aggregate. Step-3 estate decision.

## Rubric items checked clean
- L1.1 frontmatter = body (endpoint+cmd/query+handler+validator+mappings+DI; FastEndpoints/Carter/MinAPI variants all present)
- **L1.6 / L2.5 — STRONG.** Dedicated `## Anti-patterns` section encodes 3 measured failure modes (read CLAUDE.md late; invent folder structure; manually register a FastEndpoints endpoint). No AP from proven-patterns.
- L2.2 mechanical over exhortation: "FastEndpoints auto-discovers — no manual registration" is a concrete rule, not "be careful"
- L2.4 followable cold: per-framework folder-structure trees are explicit
- L3 N/A (generates source)

## Verdict: **fix-then-accept** — F1 description trigger (estate-wide), CHANGELOG (estate-wide). Body is high quality; no scope fence is the only minor structural gap (the Anti-patterns section partly compensates). Consider adding a one-line fence to `create-aggregate` (feature vs new-aggregate boundary).
