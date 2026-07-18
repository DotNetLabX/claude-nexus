# F9-CoordinationHardening — Implementation

Applies plugin-feedback `nexus-1.34.8-2026-07-17` (ADR-61, five parts). Architect-led fast lane;
answers pre-resolved (plan `## Decisions` / `## Plan Review`). Line numbers below are as-edited.

## Files Created
- `docs/plugin-feedback/nexus-1.34.8-2026-07-17.md` — dev-repo disposition copy of the five inbound
  feedback entries, each with a Disposition line (Step 6).

## Files Modified
- `plugins/nexus/rules/agents-workflow.md` — Step 1: two new `## All Agents` bullets (arrival order is
  untrusted; idle-without-payload recovery for every dispatcher). Step 2: one new `## All Agents`
  bullet (spawn-tasking contract — four capability pins + role-prefixed custom-name convention).
  Review fold: resolve-role wording aligned to "longest leading prefix" (finding B1).
- `plugins/nexus/agents/team-lead.md` — Step 3: four edits (arrival-order RUNTIME caveat; custom-name
  paragraph rewritten from ban to role-prefixed convention; standing capability-pins dispatch line;
  Relay Contract reconciling sentence; `Decisions Log` → `Decisions` at three sites). Review fold:
  resolve-role wording aligned to "longest leading prefix" (B1); Relay Contract opening scoped to
  "a completed agent's result" (A2).
- `plugins/nexus/agents/learner.md` — Step 4: repoint the decisions-pilot clause to tolerant-read /
  strict-write wording (`## Decisions` specified; legacy variants read).
- `plugins/nexus/hooks/scripts/read-tracker.js` — Step 5: per-file round decay (30-min sliding window).
- `tests/unit/read-tracker.test.mjs` — Step 5: four new decay test cases (TDD red-first).
- `plugins/nexus/commands/team-lead.md`, `plugins/nexus/commands/learner.md` — Step 7: regenerated
  from the edited agents via `gen-commands.mjs`.
- `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md` — Step 7: PATCH bump
  1.34.10 → 1.34.11 (staged edits only; commit is the lane close's job).

## Key Decisions
- Step 1 bullet ordering: the two Step-1 bullets sit between the "placeholder return" and
  "Research-helper dispatch contract" bullets; Step 2's spawn-tasking bullet sits right after the
  Research-helper bullet (topically adjacent — both govern spawns/helpers), before the confidence-label
  bullet. This satisfies both "after the placeholder bullet" (Step 1) and "adjacent to Research-helper"
  (Step 2) in one clean sequence.
- Idle-recovery bullet made self-sufficient per plan: the distinguishing note names the Relay
  Contract's thin-result recovery as a *contrast* (welcomed by the plan) but adds no dependency on
  reading team-lead.md and no "canonical/long form" pointer.
- Step 4 minimal-change discipline: only the three `Decisions Log` string occurrences on learner.md
  line 15 were reworked. The lowercase concept references (`decision-section evidence`,
  `decisions-heading pilot`) were touched only to keep the sentence coherent after the rename; the
  legacy variants are listed once in the read parenthetical and referenced as "the legacy variants
  above" in the pilot clause, so `Decisions Log` survives in exactly one legacy-variants parenthetical.
- Step 5 count-value shape: chose `[n, lastTs]` (array) over `{n, ts}` — the plan left this to the
  developer. Rationale: minimal serialized footprint, and the explicit `Array.isArray(prev) &&
  typeof prev[0]==='number' && typeof prev[1]==='number'` guard treats any legacy/foreign value as
  absent (reset), so no destructure ever throws into the fail-silent catch (plan HIGH/MED-6 binding).
- Step 5 sliding window: `lastTs` is refreshed to `now` on EVERY read (counted or reset), so the
  window is measured from the previous read — locked by test (d) (spanning streak survives a >30-min
  total span when each gap < window). A fixed-from-first window would let the F16 shape escape.
- Step 5 TDD note: the dispatch said "write the four decay cases red first." Red/green split against
  the current (undecayed) hook: (b), (c), (d) failed red for the right reason (missing decay/sliding/
  legacy-reset); (a) passed as a regression guard (the in-window tight-loop nudge/log must NOT
  regress). All four green after the hook change. This honors both the `tdd` skill (behavior-first,
  no shape-only assertions) and the dispatch (decay behavior demonstrated red-before-green).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | prose rule edit (plan Skill Mapping: none, TDD no) |
| 2 | None | prose rule edit (plan Skill Mapping: none, TDD no) |
| 3 | None | prose agent-file edit — 4 pinned sites (plan Skill Mapping: none, TDD no) |
| 4 | None | prose agent-file edit — 1 pinned site (plan Skill Mapping: none, TDD no) |
| 5 | tdd | TDD: yes — invoked `tdd`; wrote 4 decay cases red first, then implemented the hook to green |
| 6 | None | disposition-copy authoring (plan Skill Mapping: none, TDD no) |
| 7 | release-plugin | Follow — invoked `release-plugin`; gen-commands regen + PATCH bump staging (no commit) |

## Deviations from Plan
- **Step 7 stops at file edits (per dispatch + ADR-20).** The `release-plugin` flow's twin sync
  (`gen-omni.mjs`), commit, and tag are deferred to the lane close in the main session. `bump-plugin.mjs`
  and `gen-commands.mjs` were confirmed to perform NO git writes (grep verified) before running; the
  bump left `plugin.json` + `CHANGELOG.md` **modified but unstaged** (git status ` M`, not `M `). No
  `git add/commit/push/tag`. This is the sanctioned staging-only deviation the dispatch and plan name.
- **Step 5 TDD ordering:** wrote all four decay cases before implementing (the dispatch's "write the
  four red first"), rather than the `tdd` skill's strict one-slice-at-a-time. Justified: the change is
  a single atomic design (add decay to one counting path); cases (b)/(c)/(d) were confirmed red for the
  right reason before the hook change; case (a) is a deliberate regression guard (green on the current
  hook — the F16 tight-loop nudge/log must survive decay). No shape-only assertions (behavior/side-effect
  only), so the `tdd` anti-pattern (tests that verify shape not behavior) is not triggered.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `DECAY_MS` literal mirrored in test + hook | low | reviewer | `tests/unit/read-tracker.test.mjs:17` vs `read-tracker.js` const | Guarded by a "must mirror" comment; unavoidable for a subprocess/black-box hook test. Dismissed, noted. |
| `state.counts` not pruned of decayed keys within a long round | low | architect | `read-tracker.js` counting path | Pre-existing (pre-decay code never pruned); bounded by distinct (agent,file) keys touched, not per-read. Out of scope for F9. |

## Self-Review
**Scope:** first-round review baked into the dispatch — code part (code-review skill) + prose part
(two parallel finder passes), findings folded, false positives dismissed with reason.

### Code part — `read-tracker.js` + `read-tracker.test.mjs`
Ran the built-in **code-review** skill (medium, 8 finder angles, dedup) on the working diff.
**Verdict: no correctness bugs.** Evidence:
- Shape guard `Array.isArray(prev) && typeof prev[0]==='number' && typeof prev[1]==='number'` handles
  every non-`[n,ts]` value (undefined, bare number, short/corrupt array, string ts) → reset to 1; no
  blind destructure can throw into the fail-silent catch (plan MED-6 binding satisfied).
- Sliding window: `lastTs` set to `now` on every read (counted or reset) — locked by test (d).
- Removed-behavior: the old `(counts[key]||0)+1` increment is preserved within the window; nudge/log
  thresholds (`n<2`, `n>=3`) unchanged; missing-key path equivalent (`live=false → n=1`).
- Cross-file: `read-tracker.json` + its `counts` shape are consumed ONLY by the hook and its test
  (grep-confirmed) — the number→`[n,ts]` shape change breaks no consumer.
- Clock skew (`now < prev[1]`) → negative delta ≤ DECAY_MS → still counts: safe direction (a repeat
  still nudges), not a bug.
Two LOW cleanup notes surfaced (see Carry-Over) — neither a correctness defect.

### Prose part — `agents-workflow.md` + `team-lead.md` + `learner.md`
Two parallel general-purpose finder passes (Pass A: internal consistency / dropped-narrowed guarantees
/ stale adjacent sentences; Pass B: dangling cross-references / directional references vs final layout).
**Result: 4 LOW findings, no HIGH/MEDIUM.** `agents-workflow.md` and `learner.md` clean; `team-lead.md`
carried the nits. Each finding verified in-context by me; two folded, two dismissed with reason.

**Folded (2):**
- **B1 — resolve-role prefix/suffix wording.** My edits said `resolve-role.js` "peels the (qualifier)
  suffix"; ADR-61 part 3 and the actual code (`plugins/nexus/hooks/scripts/lib/resolve-role.js:42-48`,
  "longest hyphen-prefix first") frame it as a **prefix** match. Verified the code: it matches the role
  by its longest leading prefix, discarding the qualifier. Reworded both sites (agents-workflow.md Step
  2 bullet + team-lead.md naming paragraph) to "matches the role by its longest leading prefix,
  discarding the qualifier" — accurate against the code, aligned with the ADR's canonical language.
- **A2 — stale adjacent phrase in the Relay Contract opening.** The untouched opening scoped the
  recovery order to a result "thin, stranded, or **missing**" — and a live-idled-no-payload agent is
  arguably "missing", the exact case the new reconciling sentence carves out. Reworded the opening to
  "when a **completed agent's** result is thin, stranded, or missing", scoping the whole order to the
  completed-agent case up front (strengthens the Step 3b reconciliation the plan asked for).

**Dismissed with reason (2):**
- **A1 — the naming rewrite dropped "…and the agentId" from the old TaskStop/TaskOutput claim.** Not a
  defect: the plan (Step 3.2) prescribed keeping exactly "`TaskStop`/`TaskOutput` fail on custom names",
  and the dropped clause actually **contradicted** the addressing rule at team-lead.md:84/185 (address
  by agentId). The narrowing makes the file more internally consistent — plan-prescribed + correct.
- **B2 — the idle bullet names "the Relay Contract's thin-result recovery", a team-lead-only section.**
  Not a broken pointer: the plan (Step 1 + HIGH-2 remediation) **explicitly welcomed** this one-line
  contrast, and the distinction is glossed inline ("a completed agent's stranded result, where
  re-asking is the least-reliable last resort"), so a non-team-lead reader gets the meaning without
  locating the section. Self-sufficient by design.

**Post-fold verification:** team-lead.md regenerated to `commands/team-lead.md` (mirror in sync); full
gate `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green (540 pass, 0 fail); version steady
at 1.34.11 (fix-cycle edit rides within the uncommitted bump — no re-bump, per repo CLAUDE.md).

**Overall verdict: PASS.** All 7 steps implemented, every plan accept-grep satisfied, 11/11 hook tests
green, no correctness bugs, all review findings resolved (2 folded / 2 dismissed).

*Status: COMPLETE — developer, 2026-07-18*

