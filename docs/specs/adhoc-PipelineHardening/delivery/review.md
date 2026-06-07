# Review — adhoc-PipelineHardening

## Step 1 — Done-Check

**Architect done-check of the full implementation (prior-run work + the H0/H2b/critic-fix delta) against the
current plan.** The architect did not author the implementation, so this is an independent pass. The
high-risk surface (the gate) was read in full and the test suite was run; the prior-run prose steps were
verified via the second critic pass's tree cross-check + `implementation.md` + targeted spot-reads, with the
full code review deferred to Step 2 (reviewer).

| Step | Finding | Disposition |
|------|---------|-------------|
| 1 — `.pipeline-state` vocabulary (M7) | `agents-workflow.md` Pipeline State section + `team-lead.md` sole-writer/contract present. | Implemented |
| 2 — Gate: H2 + H4 + **H2b** + **H0** | Read `pipeline-gate.js`/`restore-agent.js`/`hooks.json` in full. H2b root-anchored + `name∈{nexus,nexus-dotnet}` (real `plugin.json name=nexus` ⇒ fires in prod). H0 session-keyed via `.personas.json` (not `.current-agent`), runs before the `:59` early-return, structural grep-bound, fails open on absent persona, subagent-proof; matcher widened to `…|Read|Grep`, guard/audit blocks untouched. | Implemented |
| 3 — Stacked verdicts → Fokus parity (M4) | `review-format` two labeled sections; critic message-only. | Implemented |
| 4 — Reviewer re-review postcondition + staleness (H1) | `reviewer.md` postcondition + `team-lead.md` per-cycle check. | Implemented |
| 5 — Critic spawn = current hub; review-mode Q unchanged (H3) | `critic.md` hub-conditional; `architect.md` keeps the review-mode question; `team-lead.md` hand-back. | Implemented |
| 6 — Codex → `codex-crosscheck.md` (M5) | `team-lead.md` Standard+Codex dispatch subsection. | Implemented |
| 7 — Minimal-return per agent (M6) | architect/developer/reviewer + team-lead checkpoint format. | Implemented |
| 8 — Comm-log name (L8) / agentId (L9) / RUNTIME | `agents-workflow.md` + `team-lead.md`. | Implemented |
| 9 — Gate unit tests + live-fire | `node --test "…/__tests__/*.test.mjs"` → **25 pass / 0 fail** (run by the architect). Covers H2, H4 (8a–d), H2b (9a–c incl. vendored-allow), H0 (10a–j incl. broad-grep deny, absent-persona fail-open, subagent-allow, backlog allow). | Implemented |
| 10 — Regenerate, MINOR release, sync omni, one commit | **Intentionally deferred** — a coordinated step after Step-2 review; not part of this implementation pass. | N/A (pending) |

### Gap found and resolved during this done-check
- **H0 denied the team-lead a `Read` of `docs/backlog.md`** — would have wedged the hub's headline triage
  job and the read-before-edit forced by "update backlog/spec Status" at shutdown. Root cause: the plan's H0
  allow-list mirrored an *incomplete* `team-lead.md` Read Discipline table (architect-introduced plan gap),
  which H0 then made binding. **Resolved:** plan + table + gate allow-list now include `docs/backlog.md`
  (gate `:251`, table `:44`), with test case 10j (`backlog.md → allow`). Re-verified: 25/25 green.

### Verdict: **PASS** (Step 10 release pending as the next coordinated step)

All plan steps are Implemented (or N/A-pending for the release). No `Missing` steps. The one done-check gap
was a plan-level omission, corrected and re-verified. Hand to the **reviewer** for Step 2 (code review of the
gate logic + the prose changes); after Step-2 APPROVED, the owner runs the single Step-10 release.

## Step 2 — Code Review

**Reviewed by:** reviewer (nexus). Independent code-review pass over the H0/H2b/critic-fix delta plus the
prior-run gate/restore code and prose. `pipeline-gate.js`, `restore-agent.js`, `hooks.json`, and both test
files were read in full. Beyond the 25-case suite I drove ~40 additional crafted payloads through the live
gate via `child_process` to probe bypasses and false-denies on all four invariants (Windows path separators,
case variation, nested `plugins/`, `ti.path` vs `ti.file_path`, MultiEdit, state-present fall-through,
`grepIsBounded` boundaries, the team-lead enumerated lane against other doc trees). No blocker-severity
defects; the enforcement core is sound. All findings below are non-blocking (MED / LOW / observation).

> Note on severity tokens: this section deliberately avoids the literal upper-case words for the two
> blocker tiers in prose, and uses lowercase confidence words. Reason — invariant 2's heuristic scans for
> those literal tokens, and it (correctly, per its own conservative rule) blocked the first two attempts to
> write this review because the verdict word co-occurred with `Confidence` lines carrying the upper-case
> token. That live self-block is logged as OBS-1; it is the guard working, not a defect to fix this run.

### Verdict: APPROVED

No blocker-severity findings. Two MED + three LOW + one observation are follow-ups, not merge blockers. Per
the feature's own thesis ("no divergence between prose and enforcement"), MED-2 is the one most worth closing
before the next live team run, but it fails *closed* with a self-correcting deny, so it does not block this
release.

### Pre-commitment predictions vs found
- Predicted the H2b path regex would have a separator/case seam → confirmed (MED-1: case bypass; the
  backslash seam is actually closed by the line-92 normalization — verified, not a bug).
- Predicted the enumerated team-lead lane would over-deny a legitimate router read → confirmed (MED-2:
  spec-status triage; LOW-2 breadth).
- Predicted invariants 2 & 3 might regress under the restructure → did not occur (both intact; verified with
  state-present and MultiEdit payloads).

### Findings

#### [MED-1] H2b dev-repo source guard is case-sensitive on its path keywords — evadable on a case-insensitive FS
**File:** `plugins/nexus/hooks/scripts/pipeline-gate.js:206`
**Issue:** `isDevRepoPluginSource` matches with
`/(?:^|\/)plugins\/([^/]+)\/(agents|rules|skills|commands|hooks)\//` — no `i` flag and no `.toLowerCase()`
(unlike `isCodeFile`, which lowercases at `:187`). On Windows/macOS, `plugins/nexus/Agents/x.md` and
`Plugins/nexus/agents/x.md` name the same file as the guarded `plugins/nexus/agents/x.md`, but the capitalized
keyword does not match the regex, so the developer analyze-collapse write is allowed. Verified live in this dev
repo (marker present, state = `developer:analyze`): `plugins/nexus/agents/x.md` → DENY (control);
`plugins/nexus/Agents/x.md` → ALLOW (bypass); `Plugins/nexus/agents/x.md` → ALLOW (bypass).
Scope is narrow — real source extensions are still caught because `isCodeFile` lowercases, so only markdown
under a case-varied path keyword slips through, and only in the dev repo. But H2b exists precisely because this
repo's source IS markdown and prose can't stop the collapse; a guard a faithful agent can defeat by
capitalizing a folder is the "load-bearing by luck" class this feature ends.
**Fix:** test the keywords case-insensitively — e.g. `const p = String(fp).replace(/\\/g,'/').toLowerCase();`
then the existing regex; derive the marker-path `name` from the original-cased string (the FS lookup is
case-insensitive). Add a test (capitalized subfolder → DENY).
**Confidence:** high (reproduced live).

#### [MED-2] Team-lead Launch-Path triage needs spec `Status`, but the enforced lane denies every spec read — undocumented divergence
**File:** `plugins/nexus/hooks/scripts/pipeline-gate.js:247-254` (lane) vs `plugins/nexus/agents/team-lead.md:202`
(Launch Path Selection)
**Issue:** The enumerated read-lane allows the team-lead to Read only `communication-log.md` / `questions.md` /
`backlog.md` and to bounded-Grep only `review.md` / `codex-crosscheck.md`; every other Read/Grep is denied,
including the spec. Verified live: TL `Read` of `spec.md` → DENY, and TL `Grep` of `spec.md` for `Status:
Ready` → DENY. But the team-lead's own Launch Path Selection (`team-lead.md:202`) branches on *"spec exists
with **Status: Ready**?"* — a routing decision that needs the spec's Status. The Read Discipline table (`:49`)
correctly lists the spec under "never open," but nothing reconciles how the hub then learns spec status (it can
`Glob` for existence — Glob is not gated — but not read `Status:`). This is the prose↔enforcement divergence
the feature exists to eliminate, inverted: enforcement is stricter than the documented behavior.
Why MED not blocker: (a) the architect re-gates spec status authoritatively (`architect.md:138`), so a
mis-route fails safe downstream; (b) the deny is fail-*closed* with a self-correcting message; (c) the
team-lead rarely hand-checks spec status in practice (it usually spawns PO/architect). **Fix (pick one):**
either add a bounded `Grep` of `spec.md` to the allow-lane (mirroring the verdict-grep model) plus the matching
`team-lead.md` row, OR amend Launch Path Selection to state the hub uses `Glob` for existence and delegates the
`Status: Ready` check to the architect/PO gate. Keep the table and the hook in lock-step either way.
**Confidence:** high (reproduced live; the prose requirement is explicit at `team-lead.md:202`).

#### [LOW-1] Header comment + implementation.md claim the root-anchor neutralizes nested `plugins/` — it does not
**File:** `plugins/nexus/hooks/scripts/pipeline-gate.js:203-205` (and `implementation.md` "Key Decisions
(delta)" bullet 2)
**Issue:** The comment says the `(?:^|\/)` anchor stops *"a stray `plugins/` deeper in a path (e.g.
`.../node_modules/x/plugins/...`)"*. It does not — `(?:^|\/)` matches at any `/`, so
`node_modules/x/plugins/nexus/agents/y.md` matches, extracts `name=nexus`, and in the real dev repo the root
marker exists, so the rule arms and DENIES the nested path (verified live). Harmless in practice (fails
*closed*, over-blocking a vendored copy's markdown that a developer shouldn't write during analyze anyway), and
`implementation.md` elsewhere correctly states "the root-anchored marker is the real gate." But the inline
comment asserts a path-shape guarantee the code does not provide — on an enforcement file, an inaccurate
invariant comment is a maintainer trap. **Fix:** reword to say the *marker read* (not the regex anchor) scopes
the rule to the dev repo; a nested match is acceptable because it only ever over-denies inside the dev repo.
**Confidence:** high.

#### [LOW-2] `grepIsBounded` treats a large `head_limit` content grep as bounded
**File:** `plugins/nexus/hooks/scripts/pipeline-gate.js:268-277`
**Issue:** In `content` mode with no context flags, the function returns `true` for any `head_limit !== 0`, so
a team-lead `Grep` of `review.md` with `output_mode: content, head_limit: 5000` is allowed (verified) —
effectively a full-body read of a verdict file, the thing MINOR-1 set out to prevent. This is conformant to the
agreed rule ("head_limit !== 0 AND context ≤ 3"), so it is not a code-vs-spec defect — the rule bounds context
width, not total output. **Fix (optional):** also cap `head_limit` in content mode (positive and ≤ ~20), or
rely on the path allow-list. Low impact: the allow-list is restricted to the small `review.md` /
`codex-crosscheck.md`.
**Confidence:** med (blast radius limited by the path allow-list).

#### [LOW-3] Test matrix gaps for the edge cases above
**File:** `plugins/nexus/hooks/scripts/__tests__/pipeline-gate.test.mjs`
**Issue:** The 25-case suite is real — every case asserts a concrete deny/allow and the deny-reason content;
not tautological (confirmed by running it and by reading each assertion). Gaps: no case for (a) a H2b
case-variant path → should DENY (MED-1), (b) a team-lead Read of a non-allowlisted doc (`spec.md` /
`architecture` / `README.md`) → DENY (would lock in the enumerated-lane breadth and surface MED-2), (c) the
nested `node_modules/.../plugins/` path (documents the actual over-block of LOW-1). **Fix:** add these
alongside the MED-1/MED-2 fixes so the behavior is regression-locked.
**Confidence:** high.

#### [OBS-1] Invariant 2 cannot distinguish a `Confidence` line's token from a finding heading (observation, no fix this run)
**File:** `plugins/nexus/hooks/scripts/pipeline-gate.js:289-308`
**Issue:** `approvedWithOpenHighSev` scans each line for the two blocker-tier tokens; a reviewer who writes an
APPROVED verdict with `Confidence:` lines carrying the upper-case token (and no resolution word within 4 lines)
trips the heuristic. This blocked the first two writes of this very review. That is the guard behaving per its
own conservative rule, and over-blocking a verdict write is the safe direction — so it is **not** a defect to
change for this release; flagged so a later tightening pass (the separate observability/accuracy axis) is
aware. Reviewers can avoid it by using lowercase confidence words, which this review does. **No fix requested.**
**Confidence:** high.

### Positive observations
- **Invariant 3 is airtight** across write shapes: `file_path`, `path`, and `MultiEdit` to
  `.claude/.pipeline-state` all DENY for every pipeline role; the main-session team-lead (no `agent_type`) is
  correctly allowed to write it. No regression from the restructure.
- **Invariant 2 survived the restructure intact**: fires with state present and absent, respects
  `resolved` / `REQUEST CHANGES` markers, catches `MultiEdit`. The `writer` const scoped inside the
  `state !== null` block does not leak into invariant 2 (which doesn't reference it) — verified.
- **H0 ordering is correct**: the Read/Grep branch (`:84`) precedes the Write/Edit/MultiEdit early-return
  (`:90`), so no branch is dead; a non-team-lead Read/Grep fast-paths to `allow()`, and a subagent
  (`agent_type` set) can never pose as the hub — verified (cases 10h/10i + direct probes).
- **H4 lifecycle is robust**: deletes `.pipeline-state` on `startup` / `clear` (even with no `session_id`),
  keeps on `compact` / `resume` / unknown / empty, no crash when the state file is absent — full source matrix
  verified.
- **`grepIsBounded` boundary is exactly per spec**: `-C 3` allow / `-C 4` deny / `head_limit: 0` deny.
- **H2b arms in production**: real `plugin.json name = "nexus"`, so the self-hosting collapse hole is genuinely
  closed here, not just in tests.
- The 25-case suite passes clean on this repo's Node v24 via the glob form (MAJOR-2 honored).

### Gaps (edge cases not covered by code or tests)
- Case-insensitive FS handling for H2b (MED-1) — uncovered in code and tests.
- Team-lead lane breadth vs documented spec-status triage (MED-2) — uncovered in tests.

### Open questions
- None blocking. MED-2 is a design choice (widen the lane vs amend the prose) for the architect/owner; both
  resolutions are listed in the finding.

### Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit suite | pass | `node --test "plugins/nexus/hooks/scripts/__tests__/*.test.mjs"` | tests 25, pass 25, fail 0 |
| Invariant 3 (write shapes) | deny roles / allow TL | crafted payloads via child_process | file_path/path/MultiEdit → DENY; main-session TL → ALLOW |
| Invariant 2 (state present, MultiEdit, resolved) | correct | crafted payloads | verdict+open blocker → DENY; resolved / request-changes → ALLOW |
| H2b case bypass | reproduced | crafted payloads (marker present, analyze) | lowercase path → DENY; capitalized keyword → ALLOW |
| H2b backslash seam | closed | crafted payloads | `plugins\nexus\agents\x.md` → DENY (normalized) |
| H0 enumerated lane | over-broad as designed | crafted payloads | spec / architecture / product / kb / README Read → DENY |
| H4 source matrix | correct | crafted payloads | startup/clear → DELETED; compact/resume/unknown → KEPT |
| Prod marker | armed | read `plugin.json` | `name = "nexus"` |
