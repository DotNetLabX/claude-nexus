---
name: implementation-format
description: Format spec for docs/specs/{slug}/delivery/implementation.md — sections, anti-patterns, consumers. Load when writing or reviewing an implementation file.
---

# Implementation File Format

Written by developer after each implementation round: `docs/specs/{slug}/delivery/implementation.md`.

**Section map (targeting index).** `implementation.md`'s fixed top-level headings — the set agents target for a section read (ADR-22 Extended): `## Files Created`, `## Files Modified`, `## Key Decisions`, `## Skills Used`, `## Carry-Over Findings`, `## KB Changes`, `## Deviations from Plan`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around the section you need rather than the whole file.

```
# {Feature Name} — Implementation

## Files Created
- `full/path/to/File` — what it does

## Files Modified
- `full/path/to/File` — what changed and why

## Key Decisions
- Implementation choices not specified in the plan

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | {skill-name}, tdd | |
| 2 | None | wiring-only step (plan: TDD no) |
| 3 | None — deviation: {reason} | mapped skill not invoked; reason documented |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| {title} | low/medium/high | reviewer/architect | {one-line evidence} | {note} |

## KB Changes
| Entry | Action | What changed |
|-------|--------|-------------|
| `docs/kb/{area}/{entry}.md` | NEW/UPDATE | {brief description} |

## Deviations from Plan
- Steps done differently, with reasons

*Status: COMPLETE — developer, {date}*
```

**Required sections.** Every implementation.md carries, at minimum: `## Files Created` / `## Files
Modified` (whichever apply), `## Key Decisions`, **`## Skills Used`** (a per-step table — never omit
it), `## Deviations from Plan`, and the completion footer. `## Skills Used` is a **required section**,
not optional: the architect's done-check treats its **absence as a hard Fail** (it scores skill
conformance against `.claude/audit/skill-invocations.log` and uses this section as the corroborating
cross-check), so a missing section leaves the gate nothing to cross-check and fails structurally.
`## Carry-Over Findings` and `## KB Changes` are included when they have content.

**Completion footer.** The final line above is written exactly once — when the implementation
round is genuinely done (all steps, verification run). While work is in progress the file ends
without it. The footer is how the artifact **self-certifies**: the team lead trusts the footer,
not the completion message, so a stranded message costs nothing (ADR-17).

## Anti-patterns

- **"Updated file" without explaining what changed.** Every Files Modified entry must state what changed and why — not just that the file was touched.
- **Omitting deviation reasons.** Every deviation needs a reason. "Plan said X, did Y" is incomplete — add why Y was better or necessary.
- **Listing files without linking to plan steps.** Files Modified should connect back to what the plan asked for. If a file is in the list but no plan step required it, explain why it was touched.
- **Writing all at once at the end.** Update implementation.md after each step completes — not all at the end. Enables resume-from-timeout and gives architect incremental visibility.
- **Empty or missing Skills Used section.** Every step gets a row — the skill(s) actually invoked, or `None` with the plan's sanction (`TDD: no`, `Skill: None`) or a documented deviation reason. The architect's done-check verifies this table against the plan's Skill Mapping; a mapped skill silently skipped is a Fail finding.
- **Missing operator-owed callout.** When a step fired a plan-sanctioned fallback (live connection/credential unavailable at build time), its Deviations entry carries an explicit `OPERATOR ACTION REQUIRED` note + the helper script path — the fallback is a valid deviation only with that documentation.

## Consumers

| Agent | What they read | Impact of stale data |
|-------|---------------|---------------------|
| Architect | Files Created/Modified, Deviations, Key Decisions, Skills Used (vs the plan's Skill Mapping) | Done check misses gaps or falsely fails |
| Reviewer | All sections, especially Carry-Over Findings | Reviewer misses developer-flagged risks |
| Developer (resume) | All sections to determine which steps are already done | Duplicate work or missed steps on resume |
