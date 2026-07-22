# F28-RegenerateUnit — Lessons

> **Learner disposition (2026-07-22 → nexus 1.44.1):** [APPLIED] same-day-drift re-grounding (with F29 — threshold met) → architect.md Read Discipline carve-out: multi-session status docs re-read same-turn before citing. [APPLIED] program-home recipe gap → backlog F25 scope addendum (program-home variant, F28/F29 evidence). E9/E7 lint traps: gate-covered — folded into F24 recipe scope. Code-grounded critic 5th corroboration: standing mandate, no action. Pre-computed MINOR target + classifier-ignores-docs: informational, judgment.

## Architect Lessons

- **Same-day drift is the fastest drift: a file you shipped edits to THIS MORNING is already
  stale by afternoon.** F28's Step 3 targeted program-doc §7's structure from memory of the F29
  edits I closed hours earlier — but external sessions had rewritten §7 in between (build queue
  folded into item 1, campaign statuses re-marked). The critic's HIGH was exactly the
  re-grounding failure F29's lessons already logged this morning — recurrence #2, same day,
  strengthening that entry: **cite program/status docs only from a same-turn read, never from
  session memory, no matter how recent the memory is.** Multi-session repos make every status
  file a moving target.
- **The code-grounded critic caught it again (5th corroborating instance):** a doc-only pass
  could not have known §7 was rewritten. The mandate holds.

## Developer Lessons

- **When a docs edit must cite the about-to-be-bumped version, pre-compute the deterministic MINOR
  target and write it before the bump — then verify after.** F28 Step 3's program-doc §5 line marks
  S1 shipped "nexus 1.43.0, this release", but the bump runs in Step 4. A MINOR from a known base is
  deterministic (`1.42.2 → 1.43.0`, patch zeroed), so computing it up front let the doc and
  `plugin.json` land consistent in one pass; the post-bump `grep '"version"'` confirmed the match.
  Cheaper than a second doc-edit round after the bump.
- **The bump classifier ignores `docs/**` cleanly — a same-feature program-doc edit + implementation.md
  never contaminate the dry-run reasons.** F28 touched `docs/programs/` and `docs/specs/` alongside the
  one `plugins/` SKILL.md, yet `--dry-run` reasons named ONLY `skill change (regenerate-unit)`. The
  "reasons must name only my feature's files" gate is satisfiable even in a mixed-directory change,
  as long as the only *plugin* file touched is yours.
- **skill-lint frontmatter traps for a hand-authored SKILL.md:** (1) E9 rejects a colon-space (`": "`)
  in an unquoted `description:` value (strict-YAML reads it as a nested map) — compose the description
  with em-dashes/commas, never `word: word`. (2) E7 flags angle-bracket tokens only in *prose* (fenced
  blocks AND inline code spans are stripped first) — wrap every type expression like
  `Future<Either<Failure, T>>` in backticks and it is exempt. Both were designed-around up front, so
  the first lint run was clean (0 errors, 0 warnings).

## Skill Gaps

### program-home skill authoring (recipe adjacency)
- **Kind:** missing
- **Searched for:** a recipe for authoring a program-home (non-mine) skill — F18 standards +
  self-containment + relationship-table conventions without the mine-family sweep half
- **Why it would help:** F28 Step 1 re-derives the authoring shape from sibling precedent; the
  F25 mine-recipe covers only family members
- **References:** docs/specs/F28-RegenerateUnit/delivery/plan.md (Step 1),
  plugins/nexus/skills/mine-oracle-strength/SKILL.md (nearest precedent)
- **Evidence:** [F29-OracleStrengthMiner, F28-RegenerateUnit]
