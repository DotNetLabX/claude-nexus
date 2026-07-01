# Review — adhoc-MvcCoverMinimize

## Step 1 — Done-Check

**Method:** code-grounded (per task) — verified against the actual changed files, not the
implementation.md prose. Focused re-review of the redesigned surfaces (Steps 3–4), the two SKILL.md
edits vs ADR-37, and independent re-run of the scoped gate.

### Pre-commitment predictions
1. The `mutationFloor` helpers copied into `loop-flutter` drift from `cover-flutter` (breaking the
   apples-to-apples confirm). → **Checked:** byte-identical executable bodies; same args at both call sites.
2. The confirm re-gate is wired but slice (c) doesn't actually prove a *second* runner call drove the
   restore (vacuous confirm). → **Checked:** slice (c) asserts the `minimize-confirm-run` call occurred
   and its regressed result (killedAfter 17, not the stale 18) drove restore.
3. `documentsDistinctRule` filtered somewhere the orchestrator could override. → **Checked:** filtered
   unconditionally before any removal (`loop-flutter:457`); slice (b) asserts no apply/confirm spawned.

### Step dispositions

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Method SKILL.md: Minimize stage + generation guard + report line | Implemented | `## The Minimize stage` (`mine-verify-cover/SKILL.md:55-103`) names the minimize/write/runner/orchestrator split, the rule-traceable removal rule, the 4 categorical classes, the I/O-ownership note, and the exact-count confirm + restore. `^Minimize` pipeline row present (line 27). References classify-survivors / anti-fake-green invariant / mutation ratchet **by name** (lines 58/66/96); no `:NN` citations introduced (grep clean). Generation guard in `## Safety rails` (line 139) labels itself non-enforcing. Matches ADR-37. |
| 2 — Adapter SKILL.md: Dart fill + confirm re-gate + line-scoping | Implemented | `## Minimize stage — Dart fill` (`mine-verify-cover-flutter/SKILL.md:116-143`) names the guard's reuse of the no-log-output rule + `equivalentLoggingLines` signal, and the confirm's reuse of the `mutation_test` run with an honest cost statement. Operator-owed line-scoping fact resolved **SUPPORTED** (`<lines begin/end>`), cited to the new research KB entry, documented as a future optimization and **not implemented this pass** — matches Step 2 acceptance. |
| 3 — Reference harness: Minimize stage | Implemented (with valid deviation) | Phase 3.5 in `loop-flutter.workflow.js:180-508`. Crux verified against source: **fresh** runner re-gate via the `minimize-confirm-run` agent (line 474, a real re-mutation → fresh `mutationSummary`, never a recompute); compares **exact `killed`** (`killedAfter < killedBefore`, line 492), never `scorePct`; restore is a **hard unconditional branch** (line 492, plus an anti-fake-green survivor-count cross-check that also restores on an inconsistent confirm); `documentsDistinctRule` honored unconditionally (line 457); write-agent captures **verbatim originalContent** for restore (schema line 322, prompt line 332). Copied `mutationFloor`/`mutantLine`/`VOID_CALL_REMOVAL_RE`/`pretagEquivalentLogging` are **byte-identical** to `cover-flutter.workflow.js` (both call sites pass the same `expectedSurvivorLines`/`equivalentLoggingLines`), so `killedBefore`/`killedAfter` are a real comparison. Grep-verified: **no** orchestrator `import`/`require`/`fs`, **no** `Date`/`Math.random`. **Deviation:** `cover-flutter.workflow.js` not edited — the plan's Files-line parenthetical is a reuse pointer, not a diff target; a `workflow()` re-compose would re-run a Cover agent that discards the reduced suite. Valid, documented. |
| 4 — Contract tests (5 slices) | Implemented (with valid deviation) | 5 slices (a)–(e) in `workflow-contract.test.mjs:1138-1286` drive the **real** `loop-flutter.workflow.js` in a VM sandbox against mocked `mutationSummary` fixtures (the real output shape — not an invented per-test kill-map). (c) load-bearing: asserts the second runner call + exact-count restore + verbatim-content restore prompt; (d) proves the exact-count compare catches a drop `scorePct` rounds away (911→910, both 91%). Independently re-ran: **48/48 green**. `tdd` logged in this run. **Deviation:** one pre-existing F1/F2 fixture updated (a `{candidates:[]}` no-op) to keep the suite green after Step 3 legitimately changed the agent-call sequence — required, non-masking, documented. |
| 5 — Version bump + omni note | N/A | Explicitly excluded from the developer task (owner/team-lead closure). `release-plugin`/`bump-plugin.mjs` intentionally not run. Not a Missing finding. |

### Skill conformance (scored against `.claude/audit/skill-invocations.log`)
Scoped to this developer run (session `834a02b0…`, token `reviewer:review`): logged `nexus:tdd` (Step 4 —
the only in-scope non-`None` mapping ✓), `nexus:research` (Step 2 operator-owed fact), `nexus:boy-scout`
(Step 3 post-edit). `## Skills Used` section present in implementation.md; every self-reported invocation
appears in the log (no fabrication). Steps 1–3 map `None`/`(none)` — no pattern skill required. **PASS.**

### Independent verification
- `node --check harness/loop-flutter.workflow.js` → clean.
- `node --test tests/unit/workflow-contract.test.mjs` → **48/48 pass, 0 fail** (re-run here, not assumed).
- Grep: no orchestrator `import`/`require`/`readFileSync`/`writeFileSync`/`node:fs`; no `new Date`/`Date.now`/`Math.random`.
- `mutationFloor` + deps byte-diff vs `cover-flutter.workflow.js` → in sync.

### Known carry-overs (not this pass; not flagged)
- 4 pre-existing full-suite failures (nexus-cpp CHANGELOG ×1, gen-omni ENOENT ×3) — predate this work; none of the changed files touch `nexus-cpp/**` or `gen-omni`.
- `gen-omni --check` drift — the two edited SKILL.md not yet mirrored; omni-twin regen deferred to close (Step 5 excluded from the dev task).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-01*

---

## Step 2 — Code Review

**Reviewer:** team-lead (inline substitution — three consecutive reviewer subagents died on an API-side
outage: stream-watchdog stall → connection-closed → connection-refused/classifier-unavailable, none wrote
a review). Code-grounded over the changed files + an independent test run. **This collapses the independent
reviewer role into the team lead; the Step-1 done-check was an independent code-grounded pass, so the crux
carries a second set of eyes. Flagged for the owner.**

**Verdict: APPROVED** — 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW (both defensive-only, non-blocking).

**Independent verification**
- `node --test tests/unit/workflow-contract.test.mjs` → **48/48 pass** (re-run in this pass, not trusted).
- `git diff --stat`: 5 files, +655/−4. Reviewed the full `harness/loop-flutter.workflow.js` Minimize diff
  (Phase 3.5) line by line, plus both SKILL.md diffs.

**The crux both prior NO-GO reviews conditioned GO on — all verified against source:**

| Requirement | Evidence (loop-flutter.workflow.js) | Verdict |
|---|---|---|
| Confirm is a genuinely FRESH re-gate, never a recompute | `minimize-confirm-run` agent runs `flutter test` ×2 + a real `mutation_test`, returns a fresh `mutationSummary` | ✓ |
| Compares EXACT killed-count, not `scorePct` | decision on `killedAfter < killedBefore`, both from `mutationFloor().detail.killed` | ✓ |
| Restore-on-any-drop is unconditional | `if (!countsConsistent || killedAfter < killedBefore)` → `minimize-restore`; hard branch | ✓ |
| Anti-fake-green cross-check on the confirm | `countsConsistent = undetected === survivors.length`; inconsistent ⇒ restore (never scores) | ✓ |
| `documentsDistinctRule` honored unconditionally | `candidates.filter(c => !c.documentsDistinctRule)` before any removal | ✓ |
| Write-agent captures VERBATIM original for restore | `MINIMIZE_APPLY_SCHEMA.originalContent` → replayed via `minimizeRestorePrompt` | ✓ |
| `mutationFloor` + deps copied verbatim, in sync | function + helpers copied with `KEEP IN SYNC` note; confirm scores with identical formula + same `EXPECTED_SURVIVOR_LINES`/`EQUIVALENT_LOGGING_LINES` args as `killedBefore` | ✓ |
| No `const` redeclare from the moved `allGatesGreen` | old Phase-4 declaration deleted; `node --check` clean; suite green | ✓ |

**SKILL conformance (both files):** Minimize stage / generation guard / report line match ADR-37; references
classify-survivors, the anti-fake-green invariant, and the mutation ratchet **by name** (no restated
invariant prose); guard labeled non-enforcing ("a prompt instruction is a request... the confirm re-gate is
the actual enforcement"); **no `:NN` line citations** introduced (grep clean).

**Findings**

- **LOW-1 — partial-removal count is a reporting-only risk.** If the write-agent removes fewer tests than
  proposed, `minimizeResult.removed` may misreport, but safety holds — the confirm re-gate is the authority
  on kill-count, and a partial reduction that keeps the kill-count is still safe. Already emits a `WARNING`.
  No fix needed.
- **LOW-2 — null `originalContent` leaves the suite reduced on a restore-needed path.** Defensive-only:
  `MINIMIZE_APPLY_SCHEMA` requires `originalContent`, so null is a should-never-happen; the code logs a
  clear `WARNING … investigate manually`. Acceptable as-is.

**Known carry-overs (not flagged as new):** the 4 pre-existing full-suite failures and the `gen-omni --check`
drift / version bump — all deferred to close, team-lead-owned.

*Status: COMPLETE — team-lead (reviewer substitution), 2026-07-01*
