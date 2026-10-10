---
name: edit-shipped-plugin-skill
user-invocable: true
description: "Coherent-edit recipe for changing shipped plugin prose in the plugin source repo (dev repo only) — a shipped skill, agent, rule, or hook/script header comment. Use when editing shipped plugin text: smallest-coherent-edit scoping, the enumeration/consumer sweep (the four echo shapes of a count), adjacent-surface staleness, two-surface reconciliation when an added exception contradicts an existing rule, the agent-file obligation rider, and the skill-lint authoring traps (E9 colon-space, E7 angle-bracket tokens, E6 sibling-cite paths). Not for consuming projects, where the cache is read-only — route those via improve-skills' plugin-feedback channel."
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
count has **four echo shapes**, each of which can go stale independently:

1. the **count word** itself ("four sibling skills", "all six items");
2. the **enumerated member list** near it;
3. any **in-prose sentence summarizing the list** — the shape most often missed;
4. a **quantifying label or policy-asserting comment**: a parenthetical quantifier in a bold
   label (`**Dispatch (once):**`) or a comment stating a policy beside a constant ("never another
   raise") — consumers of the fact next to them that go stale with no number moving and no grep
   firing.

**Scope floor:** the full estate **plus every file this pass will edit**. A member you add in one
file has consumers in files you were not otherwise touching.

**DO-NOT-TOUCH carve-outs:** when the same phrase appears in an unrelated pair, record each keep-hit
as a `DO-NOT-TOUCH` line with its `file:line`, so a later contiguous edit doesn't sweep a hit that
was never part of the count.

**Markup and line-wrap tolerance:** bold/italic markers break a contiguous-substring grep — a line
written `` `**Not** a member` `` in source will not match a grep for `` `not a member` ``, so a naive
sweep under-reports. Widen the pattern (drop the marker, or match the rendered text) when a surface
may carry inline markup. (This illustration uses a **synthetic** phrase on purpose — never demonstrate
a sweep with a literal that a plan or gate counts estate-wide; reproducing a counted literal in prose
is exactly the estate-invariant trap phase 3 guards against.) Hard-wrapped prose breaks a grep the
same way: this estate wraps at ~100 columns, so a counted literal routinely spans two source lines
and a naive grep under-reports it as **zero**. Sweep with the shortest distinctive fragment that
cannot wrap (or a multiline-capable grep), and re-verify any keep-hit that returns zero by **opening
the cited lines** before believing it — a zero on a keep-hit reads exactly like "the surface is
already clean", the most dangerous false negative a sweep can produce. The inverse fails too: a hit is
a **token, not a carrier** — one token (a state-file name, a script name) routinely serves two
unrelated rules in a file — so before a row asserts "file X carries rule Y", open each hit; count
invocations, never names.

**Rule edits sweep like count edits.** A *contract* has consumers the way a count does: when the
edit changes a rule that other files restate — a classification list, a marker vocabulary, a status
grammar — grep the estate for the rule's **distinctive literals** (its marker names, its status
values), not just for count words. The restatement most often lives in a stack adapter and goes
stale silently because no number moves. Prefer converting the restatement into a pointer at the
canonical owner over maintaining two copies.

**A claim spreads in paraphrase, so a literal sweep returns a clean-looking zero.** A changed *count*
has literals; a changed **claim** does not, so it can ship in several differently-worded surfaces and
surface one at a time across rounds. So on the **first** sighting of a ruling
that corrects a claim, sweep for it in **every phrasing, including the negative form** ("costs one
card, not the page" is the claim "the scope is card-level"). Three riders:

- **The mode twin is a mandatory surface** — a sentence lifted from one carrier's mode-scoped text
  inverts the other's. Grep every carrier for the **negated** form and the mode twin (team vs standalone,
  developer vs solo), not only the affirming carrier the ruling came from.
- **An anchor-scoped edit owes an enclosing-section read** — an edit can land exactly where aimed and
  leave the *same file* still asserting what it disproves. Read the enclosing section
  and the front matter; do not just grep the anchor phrase.
- **A homonym whitelist is part of the grep** — once a stem has innocent homonyms a zero-hit accept
  is impossible, so write the expected-hits list with the sweep.

**Kernel-budgeted trigger lines (mechanism fact).** An on-demand rule's `> Read when:` line is
embedded verbatim in the always-on SessionStart payload (`inject-rules.js` builds the Read-Index
from it), so editing a trigger spends the kernel budget (`KERNEL_BUDGET` in
`tests/unit/inject-rules.test.mjs`, the deterministic gate; the hook's own `WARN_AT` tripwire sits
between it and the platform cap) even when no always-on rule is in the diff — measure
before/after in JavaScript string length (a shell `${#var}` counts bytes and
mis-sizes every em dash), and keep descriptive prose in the file body, which is not injected.
The budgets were raised once and are now **effectively frozen** — triage any kernel-bound
addition as diet/demotion/on-demand first. When a budget *constant* moves, re-derive which leg
**binds**: the test carries more than one leg, and a raise can silently flip the binding gate. Run the budget
assertion immediately after a trigger-line edit, never at the final gate only.

### 3. Edit discipline

- **An identifier is never the subject.** State the rule in plain words and cite the decision as a
  trailing tag (`(ADR-n)` / `— ADR-n`); a reader in a consuming repo cannot resolve the ID, so a
  sentence whose subject is one carries no instruction there. A private term is defined on first use
  per file, or replaced by plain words. Never cite a dev-repo feature slug (`F{n}-Name`) or a dev-repo
  path (`scripts/*.mjs`, `tests/`) in shipped prose — a consuming project has no such record or file;
  rewrite the mention as the content it points at, or scope the sentence to the plugin source repo in
  as many words. Two narrow exceptions survive: a slug that has become a **stable cross-skill anchor**
  (a named seam two skills both cite) and a slug or path appearing as a **format example** (this rule's
  own two). Each is glossed or allowlisted, and the glossary lint pins the slug set — so the exception
  is a registered fact, not a judgment call.
- **Two-surface reconciliation.** An added exception that contradicts an existing rule edits **both**
  surfaces in the same pass — the new exception and the old rule it narrows. Landing one alone ships
  a self-contradicting file (the old behavior recurs from the un-narrowed surface). The rule fires
  **across files**, not just within one: when an edit removes or gates a *destination*, grep the
  estate for the surfaces that route TO it — the exception and every routing sentence land in the
  same pass, or the pair ships self-contradicting. And the carve-out lands where the rule is stated
  **strongest**, not only at the surface the edit was aimed at — a categorical statement elsewhere in
  the file keeps reading categorically after a narrower site is amended.
- **Pointer hygiene.** A `(→ file § Heading)` stays **whole on one source line** — this estate
  hard-wraps, and a wrapped pointer returns zero for every grep that checks it, reading exactly like
  "never written". Its `§ Heading` matches a real `#` heading, never a bold run-in (promote the
  run-in instead: nothing moves, every cite resolves); a heading's trailing parenthetical gloss is
  not part of its name. A pointer that still **resolves** after a rule moves is not a **correct**
  one — retarget pointers aimed at the *rule*, not only those aimed at the heading; no lint catches
  that. End the pass with one **exact-match, balanced-paren** resolution sweep over every pointer it
  introduced — a prefix-matching resolver silently passes pointers carrying the locator form the
  grammar forbids, and a naive `[^)]*` pattern truncates parenthesized headings into false findings.
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
- **Destination-coherence read.** Before adding an *obligation* (a MUST / unqualified / every-X rule)
  or a new *capability* to a shipped skill, read the destination file's assumptions (`## Assumes`),
  its read-boundary/clean-room statements and kickoff/gate attestations, and its
  `## What this skill does NOT do` (anti-scope) section in full — confirm the addition is satisfiable
  in every mode the file declares, and that it contradicts no standing denial. The contradicting
  sentence usually sits far from the insertion point; reading around the edit will not surface it.
- **Gated-artifact rider.** When the edit inserts or extends a stage that MUTATES an artifact
  something else already measured or gated, the re-measurement is part of the same edit — name the
  actor that re-runs the gate and the state the artifact holds until it passes. An addition that
  lands after its own gate reports a result for something that was never delivered (fake-green).

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
  `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs" "tests/mined/*.test.mjs"`
  (the bare-directory form fails on this repo's Node). Green before the release bump.

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
  edits **existing** shipped prose); a new mine-family member or program-home pipeline skill
  additionally follows `mine-member-authoring` (`nexus-miner`).
- Run in a consuming project — the cache is read-only there.
- Commit, tag, or regenerate a published copy — the lane close commits, nothing is tagged, and the omni edition is regenerated at the owner's publish.
