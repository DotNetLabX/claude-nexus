# adhoc-DotnetSkillSweep — Summary

## Status: COMPLETE

## What Was Built
First full pass of the 26 in-scope nexus-dotnet skills through the ADR-23 quality system
(`skill-lint` → `evaluate-skill` → `improve-skills`): external research benchmark, a per-skill
findings doc for all 26, an owner-approved disposition table (9 keep · 12 reformat · 5 rewrite ·
0 merge · 0 retire), and the applied edits — the headline being the §2.E genericization that
de-bound 5 skills from two private projects (Fokus, sprint-rituals) and removed unbuilt "Pass 2/3"
framing while preserving every valuable mechanical pattern verbatim. Shipped as nexus-dotnet 1.1.0.

## Key Outcomes
- **22 SKILL.md modified, 5 per-skill CHANGELOG.md deleted** (23 skill folders touched); 3 keeps
  (cqrs-patterns, authorization-patterns, error-handling) intentionally untouched (already conformant).
- **New artifacts:** 26 `docs/skill-evals/2026-06-12-*.md`, `delivery/research-external.md`,
  `delivery/disposition.md`, `delivery/implementation.md`, and the gap/adoption proposal
  `docs/proposals/dotnet-skill-adoptions-2026-06.md` (9 capability gaps, nothing implemented).
- **Build/validate:** estate `skill-lint` 32/32 exit 0 (6 Vue skills untouched); `claude plugin
  validate plugins/nexus-dotnet --strict` exit 0; gen-omni twin in sync (`--check` exit 0).
- **Release:** nexus-dotnet **1.0.3 → 1.1.0 (MINOR)** — owner-escalated from the tool's PATCH default
  on the grounds of 26-skill breadth + the §2.D model-invocation behavior change.
- **Review:** nexus reviewer **APPROVED** (cycle 1/3, LOW findings only) + Codex cross-check
  (Standard+Codex) — see reconciliation below. Step-1 architect done-check PASS.

## Deviations from Plan
- **ADR-1 dev-repo carve-out (planned).** The 26 are shipped plugin skills, but this repo is canonical,
  so findings became direct edits here rather than feedback-file entries. Cited in every eval doc.
- **Step 0 added (critic HIGH-1).** The in-flight 1.0.3 release was committed separately (`be0818a`)
  before any sweep edit, to keep the two logical releases from conflating under one version.
- **§2.D is a behavior change.** 3 architect-only skills now set `disable-model-invocation: true` —
  the model can no longer auto-invoke them. Intentional; the basis for the MINOR tier.
- **Codex NO-GO reconciled to no developer fixes.** Codex's two BLOCKERs were pipeline-sequencing
  artifacts (release commit is team-lead-owned at close; the "missing Step-2 verdict" was a
  gate-stranded reviewer), its HIGH (`Loaded when` vs `Use when`) was ruled conformant per §2.C's own
  acceptance criterion, and its LOW (disposition header) was fixed. Full finding-by-finding merge in
  `communication-log.md`.

## Notes
- **`Loaded when` ruling is reversible.** 7 agent-auto-loaded pattern skills keep `Loaded when …`
  descriptions rather than `Use when …`. Ruled conformant (the §2.C grep blessed both; "loaded" is the
  accurate verb for auto-loaded skills). Reverse with 7 one-line edits if strict uniformity is wanted.
- **Plugin bug to fix separately (nexus core, out of this slug's scope).** The `pipeline-gate` hook's
  `approvedWithOpenHighSev` guard is negation-blind — it false-positive-blocked the reviewer's
  legitimate APPROVED write because the prose "No CRITICAL or HIGH findings." contains the bare tokens.
  That single block caused an ~8h stall. Fix candidate logged in the Issues Log.
- **Pre-existing, untouched:** plugin.json `description` still says "29 … skills" (estate is 32). The
  pass touched only `version`; flag for a future copy-edit, not this release.
- **Twin:** the omni/omni-dotnet twin is a sibling repo (`../omni`); gen-omni synced it there. This
  repo's commit carries only the nexus-dotnet source + delivery docs.
