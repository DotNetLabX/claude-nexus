# adhoc-PipelineHardening — Lessons

## Architect Lessons

### L-A1 — When a plan relocates/renames an artifact, enumerate every *consumer* in the same step
The critic's MAJOR-1: Step 3 moved the architect done-check verdict `review.md → done-check.md` but listed
only the *producer* files, dropping `team-lead.md` (which greps `review.md` for the `Missing` marker). The
relocation would have silently regressed the done-check PASS-with-`Missing` validation — exactly the
silent-guardrail class this pass exists to kill.
- **Proposed improvement (promote to plan-writing rules):** "When a step moves or renames an artifact,
  grep for every reader/grep of the old path and list each as a file to update in the *same* step. A
  producer-only file list is incomplete." Candidate for `create-implementation-plan` skill +
  `architect.md` Plan Writing Rules (sits alongside the existing "grep for all callers" rule for method
  renames — same principle, applied to artifacts).
- **Update:** the relocation itself was later reverted to **full Fokus parity** (M4 introduces no new files;
  done-check stays a labeled section in `review.md`; the critic is message-only). The consumer-enumeration
  lesson still stands and remains the promote-worthy item.

### L-A5 — A bug fix must not delete adjacent working behavior; diff against the baseline first
The H3 fix (Step 5) was first written as "the architect **no longer** spawns the critic" — which would have
deleted the architect's *standalone* critic-spawn and read as removing the review-mode question. The owner
caught it: the self/critic **review-mode question is load-bearing and unchanged**; only the *spawn
mechanics* are context-dependent (standalone architect spawns; the team-lead spawns when the architect is a
subagent — the Fokus model). Lesson: when hardening a flow, **diff against the Fokus baseline** and isolate
the *minimal* defect — never restate a whole flow in absolutes ("never", "no longer") that silently drop
working paths. Also: the `plan-review.md`/`done-check.md` artifacts were AI-invented in the (untracked)
findings brief, not user-mandated and absent from Fokus — verify provenance before building on a proposed
artifact.

### L-A2 — Verify a line-anchor is the right *kind* of location, not just keyword-present
The critic's MAJOR-2: I anchored Step 6 (Codex→file) to `team-lead.md:153`, but `:153` is the team-mode
*selection* line, not a *dispatch* contract (which doesn't exist). The keyword matched; the semantics
didn't.
- **Proposed improvement:** when a plan step says "edit section X at `:N`", confirm `:N` is the section
  that *does the thing* (dispatch), not merely one that *mentions* it (selection). Cheap to check, prevents
  the developer inventing placement.

### L-A3 — The review cycle reproduced the findings live (validation, not a defect to fix)
The spawned critic returned a bare `"Complete."` with no artifact (M6 terse-return + M4 no-canonical-file),
twice, until re-dispatched with "you MUST write the findings" — the H1 re-dispatch pattern. Recovered only
by grep-the-artifact. This is direct in-session evidence that M6/M4/H1 are real and that the
grep-the-artifact + re-dispatch discipline is load-bearing. Strengthens the case for the plan; no action
beyond noting it.

### L-A4 — Token audit is blind to long single-turn agents
While reading the audit logs (Task 2), found the per-turn-sampling defect: the heaviest agents (developer
209/258 calls → 3-5 samples; reviewer 62 calls → 1 sample) are the least observable. Routed to a separate
`adhoc-TokenAuditFidelity` follow-up by owner decision. Recorded here so the follow-up isn't lost.

### L-A6 — `.pipeline-state` had no session lifecycle; a dead session's token blocked a new one (H4, found live)
While editing the plan, the gate **blocked the edit** because `.pipeline-state` was stale at
`architect:analyze` — written by a prior, now-closed team-lead session and never cleared. Root cause: the
persona registry (`.personas.json`) is session-keyed + 16h-TTL + cleared-on-exit by `restore-agent.js`, but
`.pipeline-state` is a flat file with **no session id and no expiry**, so it outlives its session and the
gate keeps enforcing it. `present⇒strict` (H2) amplifies the hazard. Fix (Step 2 / H4): `restore-agent.js`
clears `.pipeline-state` on SessionStart `startup`/`clear`, mirroring the persona lifecycle. **Generalizable
lesson:** any persistent state a synchronous gate trusts must carry session identity or a SessionStart
self-heal — otherwise an abandoned/crashed session leaks enforcement into the next one. Promote-worthy as an
ADR note (state files the gate reads must be session-scoped or SessionStart-pruned).

### L-A7 — A new guardrail keyed on un-hygienic state reproduces the very defect it fixes (caught by the 2nd critic pass)
Folding the live-run holes into the plan, the H0 team-lead read-lane was first specified to detect the
team-lead via `.current-agent` — a flat, host-repo-scoped file **no hook ever clears**. The critic's MAJOR-1:
that is the *same* stale-state class H4 was added to fix; keyed on it, H0 would false-positive-wedge the main
session (still says `team-lead` after the user switches persona) or no-op in a consumer that never ran
`/team-lead`. Fix: detect via session-keyed `.personas.json[session_id]` (16h-TTL, cleared-on-exit) +
fail-open on absent. **Generalizable lesson:** when adding a synchronous gate, audit the *liveness* of every
signal it reads — a guardrail is only as session-correct as its least-hygienic input. The same audit that
produced H4 must be applied to any new enforcement signal in the same pass. Promote-worthy alongside
[[verify-against-fokus-baseline]] as a gate-design rule (an enforcement signal must carry session identity or
a SessionStart self-heal).

### L-A8 — M6 terse-return recurred a third time (the critic), recovered only by reading the transcript
This pass's own critic returned a verdict-only message **twice** and, on re-dispatch, looped emitting
"findings delivered earlier" without re-emitting them — the full 2-MAJOR/5-MINOR findings existed only in its
agent transcript (`subagents/agent-*.jsonl`) and had to be recovered by parsing it. Third live M6 occurrence
in this feature (after L-A3's two). Confirms: (a) M6 is endemic and Step 7's minimal-return requirement is
load-bearing; (b) the grep-the-artifact recovery must extend to **the agent transcript** when the agent
writes no durable file (message-only critic) and the return is terse — a documented recovery worth adding to
the team-lead's playbook. The return-surfacing friction is itself the strongest evidence for the fix.

## Process notes
- Standalone mode (no team-lead): ran Phase 1 analyze → AskUserQuestion (4 decisions bundled) → Phase 2
  plan → critic review → fix-all → approve. Worked cleanly.
- The critic's findings were all actionable with concrete fixes attached; applying them verbatim resolved
  the CHANGES verdict without a second review pass.
