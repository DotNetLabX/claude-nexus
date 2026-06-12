---
name: improve-skills
description: Creates project-local skills for skill gaps, fixes project-local skills as a consolidating pass, and routes fixes to shipped (plugin) skills into the portable plugin-feedback file. Every scaffold and fix ends with the shipped skill-lint gate. Invoked by the learner agent after classification and user approval, or directly when the user asks to create or fix a skill.
---

# Improve Skills

Handles lesson items about skills: "skill fix" (an existing skill needs correction) or "skill gap" (a new skill is needed). The meta-loop has a force-multiplier property — a defect in a skill propagates into every run that follows it — so everything this skill writes must be **born compliant**: registered, lint-clean, correctly encoded.

## Entry Points

Two callers, one process:

1. **Learner-classified item** (the pipeline path) — the item arrives already classified and user-approved; the classification carries the channel and target.
2. **Direct request** — the user asks to create or fix a skill ("build me a skill for X"). Same gates, same lint; where the learner's classification would have decided something (channel, gap home), confirm it with the user instead of inventing it.

## Two Channels (ADR-1)

Shipped nexus skills live in the plugin's version-keyed cache — not editable from a consuming project.

- **Fix to a shipped (plugin) skill** → append to the portable feedback file `docs/plugin-feedback/nexus-{plugin-version}-{date}.md` (same entry format as improve-flow: suggested target = the skill + section, action, evidence, condensed lesson). Never edit the cache.
- **Fix to a project-local skill** (one that lives in this project's `.claude/skills/`) → apply directly **as a consolidating pass**: read the SKILL.md fully, fold the fix into the section it belongs to — net complexity flat or down, never additive patching. A skill that only ever grows becomes unreadable and stops being followed. Check the fix against `references/proven-patterns.md` — especially AP2 (sweep every normative surface the rule lives on, not just where it was reported) and AP3 (one owner per fact).
- **Skill gap** → decide the home:
  - **Project-specific pattern** (this codebase's stack/structure) → scaffold a **project-local** skill in `.claude/skills/{name}/` (a consumer project legitimately owns its local skills).
  - **Pipeline-generic pattern** (useful to every nexus consumer) → feedback-file entry proposing a new plugin skill; don't scaffold locally.

## For New Project-Local Skills

1. **Verify the gap is real:**
   - Check the skills already surfaced in your context (plugin skills are listed there — directory globbing under-reports them) AND grep the project's own `.claude/skills/` — confirm no existing skill covers it.
   - Check that reference files mentioned in the lesson still exist.
   - Confirm the pattern is repeatable — will be needed again, not a one-off.
2. **Study 2-3 existing skills** closest in type (project-local ones, or shipped ones from your context) and match their structure. Consult `references/proven-patterns.md` for the mechanisms that earned their keep (state-first writing, deterministic post-conditions, …) and the anti-patterns to design out.
3. **Scaffold:** `.claude/skills/{skill-name}/SKILL.md` (add `workflows/` or `references/` only if variant-aware or template-bearing).
4. **Write SKILL.md born compliant** — frontmatter first:
   - `name:` — must equal the folder name.
   - `description:` — what it does AND when to use it; this line is the auto-invocation trigger, so name the situations ("Use when …"), not just the topic.
   - Decide `user-invocable:` (should a human trigger it as `/{name}`?) and, for side-effecting skills, whether `disable-model-invocation: true` is safer.
   Then the body: `# {Skill Name}`, `## Steps` (concrete, actionable), `## Arguments` if applicable.
5. **Extract the real pattern from the codebase** — read the reference files from the gap description; don't invent abstract instructions.
6. **Register it** — if the project keeps a skills index (a README or list under `.claude/skills/`), add the row. A skill that isn't listed isn't discoverable.

## Write Discipline (encoding)

Write `SKILL.md` and reference files with the **Write tool — UTF-8 without BOM**. Never create them via shell redirection (`Out-File`, `>`): the default Windows-shell encoding prepends a BOM that breaks frontmatter parsing, and the skill silently stops loading (measured incident class — three skills registered broken, found weeks later).

## Deterministic Gate (both paths — the done-condition)

Every fix and every scaffold ends by running the lint that ships with this skill:

```bash
node {improve-skills folder}/scripts/skill-lint.mjs .claude/skills/{name}
```

`scripts/skill-lint.mjs` sits next to this SKILL.md; in a consuming project resolve it via the plugin cache (glob `~/.claude/plugins/cache/**/skills/improve-skills/scripts/skill-lint.mjs`, highest version). It checks: SKILL.md exists, no BOM, frontmatter valid, `name` matches the folder, `description` present, cited `references/`/`workflows/` files exist.

**Exit 0 is the done-condition.** Fix every ERROR before reporting the item complete; WARNs are advice. A prose rule no machine executes decays silently — this gate is the machine. (If node is genuinely unavailable, walk the checklist above by hand and say so in the report.)

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
- **No anti-pattern from `references/proven-patterns.md`** — especially AP1 (every MUST names its executor), AP4 (glob, don't enumerate), AP5 (every named path/tool verified to exist), AP6 (multi-phase producers ship a finalize path).

If the gate fails, log the gap to the backlog with status `Deferred` and the reason.

## Changelog Maintenance

When fixing a **project-local** skill, append to its `CHANGELOG.md` under `## [Unreleased]` — one bullet per meaningful change with the evidence citation (feature slug). Create the file if absent. (Shipped-skill changelogs are the plugin repo's concern — the feedback entry carries the evidence instead.)

## Cross-Reference Lint

Before renaming or deleting a project-local skill, grep the project's docs and config for references to the old name. Update or remove stale references first.

## What This Skill Does NOT Do

- Classify items — the learner already did that (in direct mode, the user's request is the classification).
- Modify CLAUDE.md, conventions, or rule files — that's `improve-flow`.
- Edit shipped plugin skills — those route to the feedback file.
- Write application code.
- Tag items as [APPLIED] — the learner handles tagging.
