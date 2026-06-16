# Critic Review — adhoc-UnattendedAutonomy, plan.md (Mode-2, plan vs spec, code-grounded)

**Mode:** 2 (Plan vs Spec, code-grounded)
**Reviewed:** `docs/specs/adhoc-UnattendedAutonomy/delivery/plan.md` (9 steps) vs `definition/tech-spec.md` (Status: Ready)
**Verdict:** REVISE
**Date:** 2026-06-16
**Critic agentId:** a0644e8173747674e (recovered via salvage-transcript — critic stranded after idle without sending findings; see communication-log Runtime Issues)

> Durable record (ADR-13: the critic writes no file; the team-lead persists verbatim). Architect
> owns the fixes; team-lead does not gate on the REVISE verdict (advisory input to the architect).

## Traceability cross-check (every AC against the 9 steps)

| AC | Covered by | Verdict |
|---|---|---|
| AC-0.1 (single mode signal) | Step 6 (Satisfies), enforced by ADR-30 | Covered |
| AC-0.2 (flag-off unreachable) | Step 6 | Covered |
| AC-0.3 (golden test) | Step 1 (scaffold), Step 6 (green) | Covered |
| AC-1.1 (SubagentStop hook runs+records) | Steps 1, 2 | Covered |
| AC-1.2 (one execution path, consumption fork) | Steps 2, 4 | Covered |
| AC-1.3 (project-declared config) | Steps 3, 7 | Covered |
| AC-1.4 (dogfood command set) | Step 3 | Covered |
| AC-1.5 (verdict → audit trail) | Step 2 | Covered |
| AC-3.1 (defer-to-queue) | Steps 4, 5 | Covered |
| AC-3.2 (structured resumable queue) | Step 5 | Covered |
| AC-3.3 (token cap) | Step 4 | Covered, inert-by-default (see MED-2) |
| AC-3.4 (never force-accept) | Step 4 | Covered |

Every AC maps to a step; every step traces to an AC or release mechanics (Steps 8/9). No orphans either direction. Gaps are in *thoroughness*, not coverage.

## Verdict: REVISE

No CRITICAL, no REJECT. Coverage complete, the three architect-flagged forks are sound — but the plan touches the hook estate without touching the two lint tests that exist to pin hook/platform wiring, and one is the natural permanent home for the plan's own highest-risk item.

## Findings

### HIGH-1 — The plan never wires the new hook into `platform-contract.test.mjs`, the repo's drift tripwire for exactly this risk
`tests/lint/platform-contract.test.mjs` pins every Claude Code platform string the hooks depend on (the `Skill` tool name, the `Agent|Task`/`subagent_type` pair, persona files) so a silent rename "is caught LOUDLY here instead of false-greening a gate." The plan adds a `SubagentStop` hook whose correctness hinges on two undocumented platform strings — the `SubagentStop` event name and the developer-role `agent_type` — and Step 2 itself calls a wrong `agent_type` key "silently false-green (no verdict written) — the worst outcome." That is precisely the failure class `platform-contract.test.mjs` was built to tripwire, yet **no step adds a CONTRACT entry for it.** Step 2 parks the finding in `implementation.md` instead of the executable tripwire. The live-verify catches drift *once, at authoring time*; the CONTRACT entry catches it *forever after*. **Fix:** add to Step 2 (or Step 6) a CONTRACT entry pinning `SubagentStop` + the `agent_type`-on-stop assumption + the matcher-less `hooks.json` registration, mirroring the `Agent|Task`/`subagent_type` entry at `platform-contract.test.mjs:36-43`.

### HIGH-2 — Step 2's `agent_type` value was never observed live; residual false-green risk under-mitigated
The spike (tech-spec lines 227-232) **discarded the only run that used a custom agent type** ("`--agents probe-impl` did not register") and fell back to the built-in `general-purpose` subagent. So the spike confirmed the *event fires* and *carries an `agent_type` field*, but **never observed the string a real `nexus:developer` spawn emits** on `SubagentStop`. Step 2 inherits this as `medium`-confidence live-verify (honest), but the mitigation ("re-run a minimal `claude -p` probe if the payload needs reconfirming") is written as optional ("if") when it is the load-bearing unknown for the whole gate. `subagent-rows.test.mjs` documents the per-task field values are **undocumented, detection scans every text field, word-boundary matching load-bearing** (the `po`-inside-"purpose" regression). The `.split(/[:/]/).pop()` normalization is the right idiom but presumes `nexus:developer`/`developer` — unverified for the *stop* payload. **Fix:** make the developer-role `agent_type` reconfirmation **mandatory and blocking** for Step 2 (not "if"), paired with a defensive fallback: if `agent_type` is absent/unrecognized on a `SubagentStop`, the hook still writes a verdict record marked `agent: "unknown"` rather than silently skip — a written "couldn't classify" is recoverable; a silent no-write is the feared false-green.

### MED-1 — AC-0.3b's "byte-identical gate/guard decisions" is structurally trivial; the snapshot guards nothing the plan changes
Neither `pipeline-gate.js` nor `guard.js` appears in any step's modify list — v1 adds a *new* hook and never edits them; their decision logic is not shared with the new `verify-gate.js`. So the Step 6 byte-identity assertion can never fail from anything v1 does — an unfalsifiable green. Not wrong (AC-0.3b asks for it; documents intent), but it's a tautology presented as a load-bearing pin. The *real* attended-regression risk: a malformed new `hooks.json` entry breaking parse for the whole file, or the new hook emitting on a non-impl event. **Fix:** keep the byte-identity assertion but add the one that bites — with the new `SubagentStop` hook present, the **existing PreToolUse/PostToolUse hooks still fire and decide identically** (the new entry didn't corrupt sibling registration). State plainly that AC-0.3b byte-identity is a documentation pin, not behavioral, so the developer doesn't over-invest.

### MED-2 — AC-3.3 budget governor ships inert-by-default: acceptable, but make the inertness *loud*
Adjudicating fork-3 directly: **shipping a fail-safe cost cap inert when `token_audit` is off DOES satisfy AC-3.3** — AC-3.3 says "in attended the human is the governor, so the cap is advisory/inert," and ADR-32's Tradeoffs ratify the `token_audit` dependency. Fail-direction is safe (no cap → run proceeds → the 3-cycle/verify defer still fires; the token cap is a *secondary* backstop). **Not an escalate-to-owner gap.** The real defect is silent inertness: an unattended overnight run with `token_audit` off gets a cap that *looks* configured but never triggers. **Fix:** Step 4 — when `[UNATTENDED]` is active and the cap is configured but `token-usage.jsonl` is absent, the team-lead emits a one-line warning into the run's audit/communication-log at launch ("token cap configured but token_audit off — cap inert this run"). Cheap; converts a silent gap into a visible one. Keep MED, keep in v1.

### MED-3 — Step 4's edit target is imprecise; the live unattended rules are at `:391`, not `:319`/`:330`
The plan frames Step 4 as "evolve `:319`/`:330`," but those are the **attended** failure-menu trailers. The *actually-live* unattended rules are duplicated in the **Unattended Mode §** at `team-lead.md:391` ("Phase failure: retry once, then skip... 3-cycle exhaustion: ... record the outcome and fail the run"). If the developer edits only `:319`/`:330` and misses `:391`, the unattended path keeps the old skip-and-fail and the defer-to-queue evolution silently doesn't apply where it matters most. The plan *names* "the Unattended Mode § (`:381-393`)" in Step 4's header (aware), but the body + Skill-Mapping row say "evolve `:319`/`:330`" (the misdirection). **Fix:** make Step 4's Accept criterion explicit that **`:391` is the primary edit** and `:319`/`:330` are updated only for consistency. One-line precision fix preventing a real miss.

### LOW-1 — `denyReason` helper only checks the PreToolUse deny shape; Step 1's "never a block" needs a custom check
`helpers.mjs:62` `denyReason()` reads `hookSpecificOutput.permissionDecision === 'deny'` (PreToolUse shape). Step 1 wants to assert the new hook "never carries `decision:"block"` or `permissionDecision:"deny"`." The `decision:"block"` (SubagentStop) shape is a different field the helper doesn't cover — the developer needs a raw `assert.doesNotMatch(stdout, /"decision"\s*:\s*"block"/)`. Worth a line in Step 1 so it isn't a mid-impl surprise.

### LOW-2 — `salvage-transcript.js` cross-reference (informational)
The plan's fact "`hooks.json` has only SessionStart/PreToolUse/PostToolUse — no SubagentStop today" is verified correct. Note for completeness: `salvage-transcript.js` (a CLI, unregistered) already parses the per-subagent transcript at the path `SubagentStop` provides (`agent_transcript_path`). No conflict — but the new gate and salvage-transcript consume the same platform transcript surface; a one-line cross-reference in Step 2/implementation.md would help the next maintainer. Purely informational.

## Forks the architect flagged — adjudicated
1. **AC-0.3a interpretation (advisory verdict always-on):** CONFIRMED, no drift. ADR-30's Tradeoffs ratify it verbatim ("the gate itself always runs advisory"). Reading "no-op on filesystem" as "no review-queue artifact + no deny" (not "writes nothing") is faithful — the advisory verdict record is AC-1.5 always-on behavior in both modes, changes no exit code (AC-0.3c).
2. **Step 2 false-green:** Real risk, under-mitigated → HIGH-1 (missing tripwire) + HIGH-2 (unverified `agent_type`). The matcher-*less* form is correct per the spike + `wiring.test.mjs` ("absent matcher = `*`"). The `agent_type`-string half is the exposure.
3. **AC-3.3 inert-by-default:** Satisfies AC-3.3, **do not escalate** → MED-2. Fail-direction safe, dependency ADR-ratified; fix is making inertness loud, not changing design.

## ADR register sanity (30-32)
No register-number conflict — ADR-29 was prior max; 30/31/32 are next free, indexed `README.md:48-50`, bodied `:769+`. Internally consistent, cross-cite correctly (ADR-31↔ADR-13 deny-drop, ADR-32↔ADR-15 graduated-menu, ADR-32↔ADR-19 resume); the plan's binding interpretation is derived from ADR-30's Tradeoffs, not in tension. Clean.

## Bottom line
REVISE. No CRITICAL, no REJECT. Coverage complete, forks sound. Fold the two HIGHs into Steps 2/6 (HIGH-1 platform-contract CONTRACT entry; HIGH-2 mandatory `agent_type` reconfirm + unknown-agent fallback write) and this is ACCEPT-ready **without another full pass**. MED-1/2/3 + LOW-1 are precision fixes (MED-3's `:391` target prevents a real miss).

**Key files:** `tests/lint/platform-contract.test.mjs`, `tests/lint/wiring.test.mjs`, `tests/unit/subagent-rows.test.mjs`, `plugins/nexus/agents/team-lead.md` (Unattended Mode § `:381-393`), `docs/architecture/README.md` (ADR-30/31/32 `:769-813`).
