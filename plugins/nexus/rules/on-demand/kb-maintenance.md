# Knowledge Base Maintenance

> Read when: a feature adds or changes domain rules, computation logic, or data flows — a `docs/kb/` KB or a `docs/business-rules/` registry-backed unit.

The business knowledge base at `docs/kb/` captures domain rules, computation logic, and data flows that agents need to navigate the codebase efficiently.

## When to Update

`docs/kb/index.md` is the topic map — it lists which KB entries exist and what each one covers. After implementing a feature that modifies any concept tracked there, update the corresponding KB entry. If the feature introduces a new tracked concept, add a new entry and register it in the topic map.

## Who Updates

- **Developer:** Updates KB entries as part of implementation. Record the entry on the `Files:` line of the implementation.md step block whose work changed it.
- **Reviewer:** Verifies KB entries match the implementation. Flag violations per the Lint Checks table below.

## What to Capture

- Business rules (the "why" that code doesn't explain)
- Computation formulas (exact logic, not just "calculates X")
- Edge cases (division by zero, null handling, boundary conditions)
- Key file paths (so agents know where to look)
- Relationships between concepts

## What NOT to Capture

- Full property lists (agents read the class file for that)
- Response DTO shapes (agents read the endpoint for that)
- UI layout details (agents read the UI component source for that)
- Anything derivable from reading the code itself

## Hard Rules

1. **Never delete a KB entry.** If a concept is deprecated, add `## Status: Deprecated` at the top and note why. The historical record stays.
2. **Never remove sections without replacing them.** Update and expand — don't truncate. A section with fewer lines than before is a warning sign.
3. **Always update `docs/kb/index.md`** when adding or renaming an entry. The index is the topic map — orphaned entries are invisible to agents.
4. **Use Edit tool for KB updates, not Write.** Carry forward all untouched sections exactly. Write rewrites the whole file and risks losing content.

## Lint Checks

Run these checks when reviewing KB-impacted features:

| Check | Severity | Condition |
|-------|----------|-----------|
| broken-index-link | error | `docs/kb/index.md` links to a file that doesn't exist |
| orphan-entry | warning | KB file under `docs/kb/` not linked from `docs/kb/index.md` |
| stale-key-file | warning | A "Key file:" path in a KB entry doesn't exist in the codebase |
| duplicate-term | warning | Same concept defined in `docs/kb/glossary.md` and a domain entry with conflicting definitions |
| empty-section | info | Section header present but no content beneath it |

## Consumers

| Agent | What they read | Impact of stale data |
|-------|---------------|---------------------|
| Architect | Business rules, formulas | Plan steps miss edge cases; wrong approach chosen |
| Developer | Key file paths | Wrong files modified; time lost on exploration |
| Reviewer | Business rules | Bugs missed in review; incorrect correctness judgments |

## KB Entry Schema

All KB entries follow the standard section order. See the **kb-entry-schema** skill.

## On-Demand Update

When the user asks to update the KB for a concept (e.g., "update KB for Xray"):

1. Read the relevant source files (entities, services, repositories for that concept)
2. Extract: business rules, computation formulas, edge cases, key file paths, relationships
3. Write or update `docs/kb/{area}/{concept}.md` following the KB Entry Schema
4. Update `docs/kb/index.md` if it's a new entry (add a link under the appropriate section)
5. Apply the "What NOT to Capture" rules — keep it to ~60 lines of what's non-obvious

Any agent can perform this (solo, developer, or the main session directly). No pipeline or plan required.

## Registry-Backed Edits

The registry guardrail — the pre/post-edit procedure for changing code whose unit has a mined
business-rule registry. It binds every agent that edits such a unit; the role-specific destination of
each flag stays in that agent's own file.

- **Pre-edit.** When the unit you are about to touch **has a registry at
  `docs/business-rules/<area>/<unit>.md`**, read it before editing — its rows are the load-bearing
  behaviors.
- **Post-edit — scoped skeptic re-verify.** Run a **scoped** re-verify of the *touched* rules only:
  spawn a read-only `general-purpose` verifier over the edited source against those rows, on the
  `audit` job's model, default `sonnet` (→ pipeline-guardrails.md § Helper agents — model and type). If a
  subagent spawn is unavailable, do the re-check in-context and **disclose** that you did. Semantic
  drift is flagged and fixed or escalated — **never silently absorbed, never a full re-mine.**
- **Tests in the same pass, or an `M3 re-mine` flag.** Update the affected tests with the edit, or
  flag an **M3 re-mine** (M3 is the Evolve mode — a full re-mine of a unit that already has an
  attested golden set).
- **A changed registry row makes the module's concept digest stale.** Raise the stale-digest flag on
  a surface that has a reader — your own agent file names which one, and a flag nothing reads is not
  a flag. Write it in the **pinned grammar** its owner defines —
  load the `locate-miner` skill (`nexus-miner`), then read `mine-verify-cover/SKILL.md` § The Distill stage beside it —
  and follow that form exactly rather than reconstructing it: the drift gate (the `nexus-miner`
  plugin's, which does not run without it) matches the heading as a contract string, so a folded
  variant is never seen.
- **Attestation staleness.** When the unit carries an `-attestation.md` sibling — the attestation
  record, the durable log of merge-triage verdicts — the same pass compares the touched rule's
  registry `revision` against its last attested `rev:` there. A stale attestation is **flagged for M3
  re-triage**, never resolved in the edit — you never write a verdict line, because the M3 table and
  the human ceremony own every disposition
  (load the `locate-miner` skill (`nexus-miner`), then read `mine-verify-cover/SKILL.md` § `re-open` and attestation staleness beside it),
  and the drift gate — the `nexus-miner` plugin's, which does not run without it — reports
  `attestation-stale` on every run until that ceremony discharges it. Those are the verdicts
  of a code-mined, attested set, and they stay the ceremony's.
- **A rule the registry has no row for** is captured immediately as a `pending-triage` row,
  scope-limited to the unit being edited, with the mismatch noted on it — capture is durable, and the
  **verdict is the architect's** (`architect.md` § Ruling on a Rule): hand it off, never rule on it,
  never edit a rule.
- **A campaign-frozen unit** (rules change only at regeneration) still takes the capture row — a row
  is documentation, not a rule change — but *new behavior entering* a frozen unit is itself a freeze
  breach: capture **and escalate**, never proceed with the edit.
- **Without the mining skills** (the `nexus-miner` plugin) no row is written and no ruling is made;
  where the uncaptured rule and the flags go instead is each role's own — the role-specific
  destinations paragraph in `developer.md` and in `solo.md`, never restated here.

## Species Boundary — Registries Are Not KB Entries

The KB update and lint rules in this file govern `docs/kb/` only. Registries under
`docs/business-rules/` are their own species (ADR-45) with their own lifecycle — **never hand-edit**
them; their edit procedures are § Registry-Backed Edits, above (a re-mine, or the post-edit skeptic
re-verify), and the architect's ruling on a row (`architect.md` § Ruling on a Rule) — and none of the
KB update/lint rules apply to them.
