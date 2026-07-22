---
name: edit-shipped-plugin-skill
user-invocable: true
description: "Coherent-edit recipe for changing shipped plugin prose in the plugin source repo (dev repo only) — a shipped skill, agent, rule, or hook/script header comment. Use when editing shipped plugin text: smallest-coherent-edit scoping, the enumeration/consumer sweep (count word plus the member list plus any in-prose summary of it), adjacent-surface staleness, two-surface reconciliation when an added exception contradicts an existing rule, the agent-file obligation rider, and the skill-lint authoring traps (E9 colon-space, E7 angle-bracket tokens, E6 sibling-cite paths). Not for consuming projects, where the cache is read-only — route those via improve-skills' plugin-feedback channel."
---

# Edit Shipped Plugin Skill

The recurring "edit shipped plugin text coherently" pass, as a recipe. Every plugin-feedback apply
wave (F9, F16, F17, F20; queued F19/F21/F22) re-derived the same discipline in its own plan; this
skill owns it once so a consumer wave stops re-inventing it. A change to shipped plugin prose is a
meta-loop edit — a defect propagates into every run that follows the skill it corrupts — so the
edit must be **coherent** (no surface left contradicting another) and **born compliant** (lint-clean,
correctly encoded).

## Scope (binding)

**Dev repo only.** This recipe runs *only* in the plugin source repo, where shipped files are edited
directly. It covers every shipped prose surface — use the glob form, never a hardcoded file list:

- `plugins/*/skills/**` — a shipped skill's `SKILL.md` or its sibling reference/workflow files.
- `plugins/*/agents/*.md` — an agent file (the agent-file rider below).
- `plugins/*/rules/*.md` — a shipped rule.
- hook and script header comments — the header-comment leg of the adjacent-surface staleness triple.

A **consuming project never runs this pass** — its plugin cache is version-keyed and read-only, so a
fix there routes through `improve-skills`' Two Channels (the plugin-feedback file), not an in-place
edit. That split is `improve-skills`' to define; this recipe is only the in-repo edit half. (One
owner per fact — point at the split, don't restate it.)

## The recipe (six phases)

### 1. Scope the edit

Make the **smallest coherent edit** that lands the change and leaves no surface contradicting another.
When several related fixes are in flight, apply them as one **consolidating pass** — net complexity
flat or down, never additive patching. The consolidating-pass posture is `improve-skills`' fix-channel
language; follow it there rather than re-deriving it here.

### 2. Pre-edit sweeps (executed, pasted — never retyped)

Before editing a count or an enumeration, run the **enumeration/consumer sweep**. Grep the whole
estate and paste the real output into your working notes — never retype a grep result from memory. A
count has **three echo shapes**, each of which can go stale independently:

1. the **count word** itself ("four sibling skills", "all six items");
2. the **enumerated member list** near it;
3. any **in-prose sentence summarizing the list** — the shape most often missed.

**Scope floor:** the full estate **plus every file this pass will edit**. A member you add in one
file has consumers in files you were not otherwise touching.

**DO-NOT-TOUCH carve-outs:** when the same phrase appears in an unrelated pair, record each keep-hit
as a `DO-NOT-TOUCH` line with its `file:line`, so a later contiguous edit doesn't sweep a hit that
was never part of the count.

**Markup tolerance:** bold/italic markers break a contiguous-substring grep — a line written
`` `**Not** a member` `` in source will not match a grep for `` `not a member` ``, so a naive sweep
under-reports. Widen the pattern (drop the marker, or match the rendered text) when a surface may
carry inline markup. (This illustration uses a **synthetic** phrase on purpose — never demonstrate a
sweep with a literal that a plan or gate counts estate-wide; reproducing a counted literal in prose
is exactly the estate-invariant trap phase 3 guards against.)

### 3. Edit discipline

- **Two-surface reconciliation.** An added exception that contradicts an existing rule edits **both**
  surfaces in the same pass — the new exception and the old rule it narrows. Landing one alone ships
  a self-contradicting file (the old behavior recurs from the un-narrowed surface).
- **Renumber/insert ripple.** After renumbering or inserting into a list, grep the same file for its
  in-prose summaries of that list ("the first three…", "steps 2–4…") and reconcile them.
- **Directional references.** Verify every "above"/"below"/"the section that follows" against the
  **final** layout after your edit, not the layout you started from.
- **Adjacent-surface staleness.** A change to a code or config unit can strand the *neighbors* that
  describe it — its header comment, its JSDoc/doc-comment, and any prose sentence about it (the
  staleness triple). Sweep all three whenever you touch the thing they describe.
- **Canonical terms.** Point a canonical term at its defining artifact; never paraphrase it into a
  second, drifting definition.
- **Estate-invariant protection.** When a plan or a gate counts a literal phrase estate-wide, adjacent
  prose (a CHANGELOG line, a doc sentence) must **paraphrase** that phrase, never reproduce the
  literal — a reproduced literal silently bumps the count the invariant guards.

### 4. Agent-file rider (`plugins/*/agents/*.md`)

When the edit adds an obligation to an agent file:

- Place the new obligation **inside the agent's existing section structure** — under the heading that
  already owns that class of rule, not a new bolt-on section.
- Phrase the trigger sentence in the **binding shape the file already uses** (match its existing
  "always/never/before X" cadence) so it reads as a rule, not a suggestion.
- **Reference a skill's template, don't restate it** — cite the owning skill; never copy its body into
  the agent file (one owner per fact).
- After any `plugins/*/agents/*.md` edit, regenerate the command:
  `node scripts/gen-commands.mjs {plugin}` (resolves at the repo root).

### 5. Gates

- **skill-lint on every touched skill folder** — run `../improve-skills/scripts/skill-lint.mjs` (the
  sibling skill owns it) against each edited `plugins/*/skills/{name}` folder; **exit 0 is the
  done-condition.** Three authoring traps to pre-empt while writing:
  - **E9** — no colon-space in an unquoted frontmatter value (quote the whole value, or reword to
    ` - ` / commas); a strict YAML parser reads a bare colon-space as a nested mapping and rejects
    the skill.
  - **E7** — no angle-bracket tokens in prose (use `{placeholder}`); keep any `<tag>`-shaped
    illustration inside a code span or fence, since E7 scans bare prose only.
  - **E6** — a cited path must resolve skill-relative or at the repo root; a **sibling** skill's file
    is cited by its resolvable sibling path (`../{skill}/...`), never a bare `references/`- or
    `scripts/`-rooted path that dangles for a light skill.
- **Repo lint suite** — run it in the glob form:
  `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` (the bare-directory form fails on
  this repo's Node). Green before the release bump.

### 6. Release obligations

One `release-plugin` run **per feature, after all edits land** — never per-step (a mid-sequence run
re-detects the still-dirty earlier steps and double-bumps). The version-and-changelog policy is
`release-plugin`'s to own; invoke that skill for it rather than restating the semver rules here.

## Born compliant

This skill is itself a shipped `SKILL.md`, so it must pass every discipline it teaches — it was
authored against its own recipe (lint-clean, synthetic sweep example, sibling cites in resolvable
form, no reproduced estate literal). A recipe that violates its own rule teaches the violation.

## What this recipe does NOT do

- Decide *whether* a fix belongs in the plugin vs a consuming project's feedback file — that
  classification is `improve-skills`' Two Channels.
- Author a brand-new skill from scratch — that is `improve-skills`' New-Skill recipe (this recipe
  edits **existing** shipped prose).
- Run in a consuming project — the cache is read-only there.
- Commit, tag, or regenerate the omni twin — the release bump (phase 6) and the lane close own those.
