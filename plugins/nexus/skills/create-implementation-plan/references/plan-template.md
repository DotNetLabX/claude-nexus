# Plan Template

Use this template for every `docs/specs/{slug}/delivery/plan.md` file — the full format first, and the light format after it, valid only under a light level (→ SKILL.md § Light Plan Format). **This template IS the plan format** — the `create-implementation-plan` skill owns it, and the coordination protocol (`rules/on-demand/agents-workflow.md` § Artifact Formats) points here rather than defining a second one.

**Section map (targeting index).** `plan.md`'s fixed top-level headings — the set agents target for a section read (ADR-22 Extended). A light plan's: `## Goal` (plan-only definitions), `## Implementation Steps`, `## Where to Look`, `## Decisions`, `## Decisions and why`, `## Cut candidates` (when a part qualifies), `## Open Questions`. The full format's: `## Context`, `## Scope`, `## Skill Mapping`, `## Domain Model Changes`, `## Data Model Changes`, `## Implementation Steps`, `## Cross-Service Changes`, `## Migration Notes`, `## Must-NOT-Change`, `## Testing Strategy`, `## KB Impact`, `## Decisions`, `## Decisions and why`, `## Cut candidates` (when a part qualifies), `## Open Questions`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around the section you need rather than the whole file.

**The `Developers` header line is optional and usually absent** — keep it only where the content divides by kind of work (the rule is the architect's Plan Writing Rules). **The `Build slices` header line is optional too** — required only above 8 developer-built steps, for a heavy step, or in place of a split a fold finds under a lane built in the architect's session, omitted otherwise (the rule is this skill's § Build Slices). **The `Size`, `Lane`, `Build lane` and `Gear` header lines are the architect's**, counted and written by the rules in `architect.md` § Check Level and Plan Size: `Size` on every plan; `Lane` — the recommended check level, `light` or `full`, with a one-line why — on every plan a standalone architect writes, before the plan's review, and omitted on a plan written for the team pipeline; `Build lane` — the lane the owner chose and the one recommended — standalone plans only: with the owner present, written once the plan is written, before its review; with the owner away, nothing is asked and it is written after the review's last fold, holding the lane re-derived then. Under a gear (`agents-workflow.md` § Gears) every plan, the team pipeline's included, carries the `Lane` and `Build lane` lines the gear sets, and `Gear` is the line `gear.js fix` prints when the plan starts — the feature's fixed gear. **The `Skills per step` header line is the architect's too**, on any plan, the team pipeline's included: written `**Skills per step:** on` where the repo's switch is on (the rule is the architect's Plan Writing Rules, in `architect.md`), left out where it is off; with it, a step names every pattern skill that covers one of its actions (SKILL.md step 4). **The `Mirrors` header line** is written where the owner named an existing pattern to mirror, on any plan: the pattern is one more source, never a copy order, and the ticket wins where the two disagree (the rule is the architect's Plan Writing Rules).

---

```markdown
# {Feature Name}

**Feature Spec:** `docs/specs/{slug}/definition/spec.md` | the spec `sdd-read.js` resolves, for a feature with an `sdd/` folder | None
**Model:** {your own model's exact id, self-reported from your system context — write "unknown" if unstated, never the model you were dispatched as; see agents-workflow.md § Artifact Formats}
**Developers:** {n} — {kind} (steps {a}–{b}) · {kind} (steps {c}–{d}); boundary: {what separates them} | omit this line — one developer builds the plan
**Build slices:** {a}–{b} · {c}–{d} · …; why: {one line} | omit this line — the whole plan is one slice
**Size:** {n} developer-built steps · {m} files · fullChecks: {matched globs | none}
**Lane:** light — {why} | full — {why} | omit this line — a plan written for the team pipeline
**Build lane:** {chosen option} — recommended: {recommended option} | omit this line — standalone plans only; written before the review with the owner present, after its last fold with the owner away
**Gear:** {gear} — {campaign | switch | repo} | omit this line — no gear in force when the plan started
**Skills per step:** on | omit this line — the repo's skills-per-step switch is off
**Mirrors:** {pattern} — {where the owner named it}; the ticket wins a conflict | omit this line — no pattern named

## Context
What problem this solves. Which service(s) impacted and why.

## Scope
In scope. Explicitly out of scope.
Where the slug has a rule list and the mining skills (`nexus-miner`) are installed:
**Not delivered by this feature** — each `kind: behaviour` row no step's `Satisfies:` cites, one per line,
`{ruleName} — {reason}`.
Without them, a leftover rule list is named in one line with the install line; no row is listed.
An acceptance criterion a cut left without a step goes on the same line, rule list or not, as
`{AC id} — cut, {backlog row}`; the line appears when such a criterion or a rule row exists.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | {skill-name} | Follow | yes | {only what's unique: entity names, paths, types} | |
| 2 | {skill-name} | Find or build | no | {what to look for, where it is built once if nothing is found + feature inputs} | |
| 3 | (none) | — | yes | (full inline detail in step) | gap: {what's missing} |

**Disposition rules:**
- **Follow** — apply the skill pattern. Adapt implementation specifics (e.g., SQLite instead of SQL Server) but never skip the pattern.
- **Find or build** — the skill relies on something not in sight. The step names what was looked for and, when nothing was found, where it is built once (→ agents-workflow.md § Skill Authority); then follow the skill.
- **None** — no skill covers this step. Describe what to accomplish + acceptance criteria. Do NOT write method-body logic flows. The developer decides internal decomposition. Log the gap to `lessons.md` `## Skill Gaps` per `lessons-format`.
- **Never "Adapt"** — if you're about to write "adapted for this project's needs," you're skipping the skill. Either Follow (the pattern applies, specifics may differ) or Find or build (something the skill relies on is not in sight). A line a mapped skill itself tells the step to carry is not this, whatever its wording — the ban is for a step that softens a skill it was told to follow.
- **TDD column (process skill — every plan has it, even all-`None` plans).** The architect marks each step at plan time: `yes` = testable behavior (domain logic, endpoint request/response, business rules) — the developer invokes the `tdd` skill on it; `no` = pure wiring (DI, config, migrations). `Skill: None` means no *pattern* skill — it never waives TDD. (Measured failure: an all-`None` plan read as "no skills at all" and 34+ tests shipped test-after.)
- **Several skills — only where the header carries `**Skills per step:** on`.** The Skill cell names every pattern skill whose description covers one of the step's actions, comma-separated (`{skill-a}, {skill-b}`); the Disposition cell holds their shared keyword, and where they differ it holds each skill's own in the Skill cell's order, the step text carrying one disposition each. Process skills stay in their own column, and the five preloaded format skills are never named (SKILL.md step 4). Without the line, one skill per row, as above.
- **`Gap?` column vocabulary (exactly two legal values).** `gap: {what's missing}` — a real gap; the
  binding record is the `## Skill Gaps` entry in `lessons.md` (`lessons-format`), not this cell. `—` — no
  gap; an explicit "expected, not a gap" note stays welcome. Confidence ratings, owner assignments, and
  TDD values do not belong in this column — each has its own home.

**Anti-patterns (if any of these appear, revise before proceeding):**
- A skill dismissed as "simple" or "not needed" — Skills ensure consistency, not just complexity.
- Pattern details restated alongside a skill reference — Over-specification. Delete the pattern detail, keep only feature-specific inputs.
- "No shared library to reference" used to skip a skill — The pattern is the value, not the package. Find or build, or Follow.
- A mapped skill without the disposition keyword in the step text — `Follow {name}` / `Find or build …, then follow {name}` is the developer's binding invocation trigger; bare names broke it in a measured run (9 mapped steps, zero invocations); under `**Skills per step:** on`, one disposition keyword binds every skill in its list, so `Follow a, b` — or one disposition each where they differ — is the sanctioned form, never this violation.
- Structural-pattern code references on a Follow step — developers imitate cited code and skip the skill. Cite code only for feature-specific surfaces; the pattern is the skill's job.

## Domain Model Changes
New/modified aggregates, entities, value objects, domain events.

## Data Model Changes
New tables, columns, relationships, migrations needed.

## Implementation Steps

Numbered steps — each step is one focused task.
For each step:
- What to do (not how to code it — unless Skill Mapping says "None")
- Which files to create or modify (full paths)
- Skill reference (from the mapping table) — if Follow or Find or build, say "Follow {skill-name}" or "Find or build {what}, then follow {skill-name}"; under `**Skills per step:** on`, every skill the row names — "Follow {skill-a}, {skill-b}", or one disposition each where they differ
- Feature-specific inputs only (entity names, property types, route paths)
- Dependencies on previous steps
- **Long runs:** (only where the step waits on one) — what runs and roughly how long
- **Effort points:** {n} — added at the sweep after the review (SKILL.md § Step Effort); not on close- or operator-owned steps
- **`Satisfies:`** (optional, recommended) — the acceptance criterion the step delivers, e.g.
  `Satisfies: AC-3`. For an ad-hoc pass with no spec ACs, cite the **ADR unit** instead
  (`Satisfies: ADR-26 RESEARCH-stage`), consistent with the ad-hoc ADR-mapping done-check. This is the
  lightweight SDD requirement→task link — **optional-but-recommended, not a hard gate**: a step may omit
  it, and existing plans predate it. Where present, the done-check confirms the cited AC/ADR-unit is
  real and the reviewer verifies the code traces to it. **Rules narrow it:**
  where the slug has a rule list and the mining skills (`nexus-miner`) are installed, every `kind: behaviour`
  row is cited by some step's `Satisfies:` or listed under § Scope's *Not delivered by this feature*. A step that cites rules lists them under its `Satisfies:` line, one
  per line, as `{ruleName} — {one-line statement}` — nothing more; this is the developer's rule list for
  the step (this skill's step 6, `Satisfies:` traceability, owns the rule).

**Always include a final numbered step for KB updates** if the KB Impact section identifies entries to update. Trailing sections are routinely skipped — only numbered steps are verified by the done check.

**Follow step content budget:** When disposition is Follow, include ONLY what the skill can't know — feature-specific inputs. The developer invokes the skill via the Skill tool to get structural patterns. Over-specifying Follow steps causes the developer to skip skill invocation (all info is already inline). Target: 5-15 lines. A Follow step exceeding 30 lines is over-specified — split feature-specific inputs from structural patterns and delete the structural patterns.

## Cross-Service Changes (if applicable)
gRPC contract changes, integration events, consumers.

## Migration Notes
Migration commands per persistence convention. Seed data if needed.

## Must-NOT-Change (refactor/regeneration plans)
The safety contract — one row per invariant that must survive the change.

| Invariant | Pinned by | Disposition |
|-----------|-----------|-------------|
| {behavior that must not change} | {the test assertion or diff-based accept that mechanically pins it} | pinned / new-test (step N) / accepted-gap ({why}) |

Every row names the mechanical check that pins it. An unpinnable row is either given a new test by a numbered step or explicitly declared an accepted gap — a prose claim alone is not a safety contract.

## Testing Strategy
Key scenarios to test.

## KB Impact
Which `docs/kb/` entries need updating or creating after this feature? (None if purely frontend/infra)

**Important:** If any KB entries need updating, the architect MUST include a numbered implementation step for KB updates (e.g., "Step N: Update KB entries"). Trailing sections after the numbered steps are routinely skipped by developers. Making it a numbered step ensures the done check catches it.

## Decisions
One row per judgment call the architect resolved alone — **decision · one-line why · rejected alternative · confidence (`high | medium | low — {one-line why}`) · status (`decided` | `deferred`)**. A call earns a row when **a reasonable user might have decided differently AND the call is a two-way door** (reversible enough that asking first isn't warranted); below that bar, just decide — no row. A **one-way door** (hard to reverse) is never a row — the ask-first machinery (questions checkpoint / ADR-25 options panel) applies to it, not this section. `deferred` marks a call explicitly left to the developer or a later pass; genuinely *open* items go to `## Open Questions`, not here. The section is **always present** — when nothing met the bar, write exactly: `None — no self-resolved calls met the disclosure bar`. Additive: plans predating this section are not retro-flagged, and a row written before the confidence column is read as confidence missing. **Two kinds of row are written even where the bar above would not ask for one:** a call that adds behaviour no source asks for opens `Adds:`; and, where the header carries `**Mirrors:**`, a call that builds differently from the named pattern opens `Departs from {pattern}:` — `Departs from {pattern}, required by {source}:` where a source requires the departure. A one-way door still goes to the questions checkpoint, never to a row. Every tagged row is put to the owner before the build (the architect's Approval rule).

## Decisions and why
The why behind the plan's decisions: the owner's plan-time rulings and the architect's writer's decisions, numbered `P1`, `P2`, …, each entry in the shape `../create-feature-spec/workflows/Template.md` § Decisions and why owns (never restated here). Present whether or not the plan has a spec. **Which section, as one test:** a question that `rules/on-demand/research-before-asking.md` § Interview — answer first, ask what the owner alone decides would have put to the owner — one the source put to the architect, or one of its own the architect resolved instead of asking — gets a `P` entry; when it also meets `## Decisions`' disclosure bar it keeps its `## Decisions` row too, the row's why ending `see plan P{n}`. A build judgment call that is no such question gets a `## Decisions` row only. With no entry, write exactly: `None — no ruling carried the owner's reason.`

## Cut candidates
Left out when no part qualifies — written only where the repo turns the feature on, for parts off the main path whose cost is real (the rules are `architect.md` § Check Level and Plan Size). Its first line reads exactly: `Cut candidates — every part not cut is built as its steps say.`

| Part | Path | What reads or runs it | Cost (files · tests · steps · findings) | Ruling | {reader} verdict | {reader} verdict | Recommendation | Outcome |
|---|---|---|---|---|---|---|---|---|
| {the capability} | rare case, rare flow or copy | {the reader, run or flow} | {n} · {n} · {steps} · {finding ids} | {the ruling and its date}, or — | safe to defer or keep, {confidence} | safe to defer or keep, {confidence} | cut or keep | `kept`, `cut — {backlog row}` or `not asked — {why}` |

A part a fold changed stays offered: its verdict cells read `changed after its verdicts` and its recommendation is keep.

Not offered: {part} — past the cap; one per line, below the table.

## Open Questions
Unresolved decisions needing input.
```

---

**Light plan** — the header lines are the full format's; the sections it leaves out and the rules it keeps are SKILL.md § Light Plan Format's.

```markdown
# {Feature Name}

{the full format's header lines, `**Lane:** light — {why}` among them}
**Related:** {each same-name or same-topic artifact the reading protocol found, with its state} | none
**Not delivered by this feature:** {ruleName} — {reason}; one per row a joined rule list leaves uncited, and {AC id} — cut, {backlog row}; one per acceptance criterion a cut left without a step | omit this line — no such row or criterion

## Goal
{2–4 lines: what changes and why — a plan-only definition only; a spec'd plan omits this section, its `Feature Spec` line points to the spec}
Out of scope: {one line}

## Implementation Steps

### Step N — {outcome}
Accept: `{test file}` asserts {what} | `{exact grep or command}` gives {result} · Files: `{path}`, `{path}` · Follow {skill} | Follow {skill}, {skill} (under **Skills per step:** on) | None · TDD: yes (test-first steps only) · Risk: risky — {why} (risky steps only) · Long runs: {what runs, about how long} (only where the step waits on one) · Effort points: {n}
Satisfies: (where a rule list is joined)
- {ruleName} — {one-line statement}

## Where to Look
- Step N: `{file}` — {class, method, document section or configuration key}; a new file: `{the file it follows}` | no precedent; never a line number

## Decisions
{rows as in the full format — decision · why · rejected alternative · confidence · status} | None — no self-resolved calls met the disclosure bar

## Decisions and why
{entries as in the full format} | None — no ruling carried the owner's reason.

## Cut candidates
{as in the full format, its first line `Cut candidates — every part not cut is built as its steps say.`} | omit this section — no part qualifies

## Open Questions
{unresolved decisions} | None
```
