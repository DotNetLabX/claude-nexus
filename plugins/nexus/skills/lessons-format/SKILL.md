---
name: lessons-format
description: Format spec for docs/specs/{slug}/delivery/lessons.md — per-role headings plus improvement proposals. Load before any agent finishes its work.
---

# Lessons File Format

All pipeline agents append under their own heading: `docs/specs/{slug}/delivery/lessons.md`. The PO writes lessons during spec shaping (before the delivery/ folder exists) — create the folder and lessons file if needed.

**Section map (targeting index).** `lessons.md`'s fixed **per-role** top-level headings — the set agents target for a section read (ADR-22 Extended): `## PO Lessons`, `## Architect Lessons`, `## Developer Lessons`, `## Reviewer Lessons`, `## Solo Lessons`, `## Skill Gaps`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around your role's heading rather than the whole file. **Target the role heading only** — the `### Improvement Proposal` sub-heading repeats under multiple roles, so (per ADR-22's duplicate-heading fallback) it is not a targetable anchor; widen to the enclosing role section.

```
# {Feature Name} — Lessons

## PO Lessons
- Spec gaps the critic caught
- Research that changed a decision
- Questions that should have been asked earlier or differently

## Architect Lessons
- Plan instructions that were ambiguous
- Architecture decisions needing documentation
- Skill gaps discovered

## Developer Lessons
- Patterns discovered not yet documented
- Inconsistencies found
- Steps missing from a skill

## Reviewer Lessons
- Review criteria that were unclear
- Recurring code quality issues
- Patterns that should become conventions

## Solo Lessons
- Patterns discovered not yet documented
- Deviations from conventions found
- Missing skills or conventions

## Skill Gaps
- Skills referenced in plan steps but not found
- Recurring patterns that should become skills
```

For systemic issues that recur across features, append an improvement proposal inside the relevant heading:

```
### Improvement Proposal (optional, for systemic issues)
**Target:** {file path — agent file, skill, convention, or rule}
**Change:** {what to add/modify}
**Evidence:** {which features demonstrated this, with links}
**Priority:** {low/medium/high}
```

Only add items not already in CLAUDE.md, convention files, skills, or agent files. Update before `/compact` or `/clear`.

**Mandatory:** Every agent must write lessons before finishing its work. This is not optional — if you learned something (a gap, a pattern, a mistake, an ambiguity), write it down. If the lessons file doesn't exist yet, create it. If your heading already exists, append to it. No agent exits without writing lessons.

**Append-only per role (hard rule).** `lessons.md` is the one artifact several roles write — so each
role touches **only its own `## {Role} Lessons` heading** (plus `## Skill Gaps`): append entries with
`Edit`, never rewrite the whole file with `Write`. Never modify the file header or another role's
section — a full-file write across a resume boundary has silently dropped another role's lessons
before. If your heading is missing, add it at the end; if the file is missing, create it with the
header and your heading only.
