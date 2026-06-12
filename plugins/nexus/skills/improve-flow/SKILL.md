---
name: improve-flow
description: Applies promoted lessons to project flow artifacts (CLAUDE.md, docs/conventions/) and routes plugin-bound lessons to the portable plugin-feedback file. Invoked by the learner agent after classification and user approval. Do not invoke directly.
---

# Improve Flow

Applies classified and approved lesson items to their targets. Each item has already been classified by the learner agent with a specific target, section, and action.

## Two Channels (decide per item, by target)

The nexus agents, rules, and skills live in the **plugin's version-keyed cache** — a consuming project holds no editable copy (ADR-1). Lessons therefore split by audience:

1. **Project-bound** (this project's conventions, gotchas, guardrails) → **apply on the spot** to project files: `CLAUDE.md`, `docs/conventions/*`, project rule files the project itself owns.
2. **Plugin-bound** (a nexus agent behaved wrong, a pipeline rule needs changing, a shipped skill has a gap) → **never write into `.claude/` or the plugin cache.** Append the item to the **portable feedback file**: `docs/plugin-feedback/nexus-{plugin-version}-{date}.md` (create with header if absent). This file is committable; a consumer sends it to the plugin owner, who applies it in the plugin source repo. On the owner's machine the same file is simply applied there directly.

## Steps

1. **Receive the promotion list** — items with: content, channel (project | plugin), target file, target section, action (add or update).

2. **Project-bound items, grouped per file:**
   a. Read the current file content fully.
   b. Find the target section; final dedup check — verify the item isn't already expressed (different wording, same concept).
   c. Insert or update; preserve the file's existing style, formatting, and indentation.

3. **Plugin-bound items:** append each to the feedback file as an entry:
   ```markdown
   ## {short title}
   - **Suggested target:** {agent|rule|skill name} → {section, e.g. "developer.md ## Anti-patterns"}
   - **Action:** add | update
   - **Evidence:** {feature slug(s)}, recurrence {N}x
   - **Lesson:** {the actionable rule, condensed}
   ```
   Suggest the target precisely — e.g. recurring agent mistakes map to that agent's `## Anti-patterns` section; cross-cutting rules to `agents-workflow.md`.

4. **Verify consistency** — no duplicate entries introduced, no sections broken, files still read coherently.

5. **Report** — list every change: file path, section, what was added or updated; plus the feedback-file entries written.

## Prefer Mechanical Enforcement

When a promoted lesson can be enforced by something deterministic the project already runs — a lint script, a test, a hook, a CI check — wire or extend that check instead of (or alongside) the prose rule, and name the enforcement in the report. A rule that isn't mechanically executed on every run is decoration: two independent projects measured prose-only rules decaying to zero compliance until a script enforced them. "Rule + check" beats "rule"; if only prose is possible, say so explicitly so the gap is a known one.

## Project Target Conventions

### CLAUDE.md
- Guardrails go under a `## Guardrails` (or equivalent) section.
- Framework-specific gotchas go near related existing sections; create a subsection only if there's no natural fit.
- Match the existing bullet style.

### docs/conventions/
- Extend the file the conventions index (`coding-conventions.md`) lists for that topic; create a new file only if no existing one covers it, and add it to the index.

## Style Rules

- Match the target file's voice and density.
- Don't add attribution ("learned from JiraSync") or dates — git history tracks that. (The feedback file is the exception: it carries evidence citations by design.)
- Condense the lesson to its actionable essence. Strip the story, keep the rule.

## Cross-Reference Lint

Before renaming or removing a project convention or doc reference, grep the project's docs and CLAUDE.md for references to the old name. Update or remove stale references before completing the change.

## What This Skill Does NOT Do

- Classify items — the learner already did that.
- Create or modify skills — that's `improve-skills`.
- Edit nexus agent files, rules, or shipped skills — plugin-bound items go to the feedback file, never applied locally.
- Write application code.
- Decide what gets promoted — the learner decides, user approves.
- Tag items as [APPLIED] — the learner handles tagging after the skill completes.
