---
name: improve-skills
description: Creates project-local skills for skill gaps and routes fixes to shipped (plugin) skills into the portable plugin-feedback file. Invoked by the learner agent after classification and user approval.
---

# Improve Skills

Handles classified lesson items about skills: "skill fix" (an existing skill needs correction) or "skill gap" (a new skill is needed). Each item was already classified by the learner.

## Two Channels (ADR-1)

Shipped nexus skills live in the plugin's version-keyed cache — not editable from a consuming project.

- **Fix to a shipped (plugin) skill** → append to the portable feedback file `docs/plugin-feedback/nexus-{plugin-version}-{date}.md` (same entry format as improve-flow: suggested target = the skill + section, action, evidence, condensed lesson). Never edit the cache.
- **Fix to a project-local skill** (one that lives in this project's `.claude/skills/`) → apply directly: read the SKILL.md fully, identify the section, fix it preserving structure and style.
- **Skill gap** → decide the home:
  - **Project-specific pattern** (this codebase's stack/structure) → scaffold a **project-local** skill in `.claude/skills/{name}/` (a consumer project legitimately owns its local skills).
  - **Pipeline-generic pattern** (useful to every nexus consumer) → feedback-file entry proposing a new plugin skill; don't scaffold locally.

## For New Project-Local Skills

1. **Verify the gap is real:**
   - Check the skills already surfaced in your context (plugin skills are listed there — directory globbing under-reports them) AND grep the project's own `.claude/skills/` — confirm no existing skill covers it.
   - Check that reference files mentioned in the lesson still exist.
   - Confirm the pattern is repeatable — will be needed again, not a one-off.
2. **Study 2-3 existing skills** closest in type (project-local ones, or shipped ones from your context) and match their structure.
3. **Scaffold:** `.claude/skills/{skill-name}/SKILL.md` (add `workflows/` or `references/` only if variant-aware or template-bearing).
4. **Write SKILL.md** in the native format — frontmatter (`name`, `description` specific enough for auto-detection), then `# {Skill Name}`, `## Steps` (concrete, actionable), `## Arguments` if applicable.
5. **Extract the real pattern from the codebase** — read the reference files from the gap description; don't invent abstract instructions.

## Skill Backlog

Log every action to `docs/skill-backlog.md` (create if absent). Entry format:

```markdown
### {Skill Name}
- **Status:** Created | Fixed | Routed-to-plugin | Deferred
- **Type:** Gap | Fix
- **Source:** {Feature name} lessons
- **Description:** {What it covers, what was fixed, or what was routed to the feedback file}
- **Date:** {YYYY-MM-DD}
```

Group entries under `## Skills Created`, `## Skills Fixed`, and `## Routed to Plugin`.

## Quality Gate (before creating any new skill)

- The pattern is **repeatable** — it will be needed again.
- **No existing skill** covers it, even partially (context-surfaced + project-local).
- The **reference files** mentioned in the gap still exist.
- The steps are **concrete and actionable** — not abstract guidance.
- Project-local skills may bake in project specifics; a skill proposed for the **plugin** must be generic — placeholders (`{Name}`, `{Svc}`), no project paths.

If the gate fails, log the gap to the backlog with status `Deferred` and the reason.

## Changelog Maintenance

When fixing a **project-local** skill, append to its `CHANGELOG.md` under `## [Unreleased]` — one bullet per meaningful change with the evidence citation (feature slug). Create the file if absent. (Shipped-skill changelogs are the plugin repo's concern — the feedback entry carries the evidence instead.)

## Cross-Reference Lint

Before renaming or deleting a project-local skill, grep the project's docs and config for references to the old name. Update or remove stale references first.

## What This Skill Does NOT Do

- Classify items — the learner already did that.
- Modify CLAUDE.md, conventions, or rule files — that's `improve-flow`.
- Edit shipped plugin skills — those route to the feedback file.
- Write application code.
- Tag items as [APPLIED] — the learner handles tagging.
