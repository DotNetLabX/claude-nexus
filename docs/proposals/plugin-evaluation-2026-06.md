# Nexus plugin evaluation — post-1.3.0 scorecard & improvement roadmap

**Date:** 2026-06-10 · **Scope:** `nexus` plugin + dev-repo machinery, after the adhoc-PluginCleanup
release (1.3.0) and its Step-10 APPROVED review.
**Inputs:** the consolidated audit (`docs/specs/adhoc-PluginCleanup/definition/audit.md`), the
independent Step-10 review, live session evidence (two sessions of agent runs), and the test-strategy
research (`docs/research/testing-claude-code-plugins.md`).

## Scoring method (read before arguing with a number)

Scores rate the **strength of the current mechanism**, calibrated by **empirical failure data** — not
the pain history. Two consequences:
- A category that *had* many bugs but now has verified hard mechanisms scores high (release machinery
  had ~10 audit findings; it scores 9 because every fix was verified in both pass and fail directions).
- A category where the only mechanism is "instructions the model usually follows + manual recovery"
  cannot score above ~5 no matter how rarely it has bitten, because nothing prevents recurrence.
- **Platform-capped** means the ceiling is set by Claude Code behavior, not by unfixed plugin work.

## Scorecard

| # | Category | Score | One-line basis |
|---|----------|:---:|----------------|
| 1 | Architecture & decision record | **9** | 20 ADRs with tradeoffs/rejected/supersession; verified platform constraints. Docked 1: the record long described a better system than shipped (the audit existed). |
| 2 | Agent design (roles & contracts) | **8** | Fokus parity restored + improvements, convergence independently verified. Held at 8: **unproven in a live team run since the restore**; agent files ~2× longer (dilution risk). |
| 3 | Pipeline enforcement | **5** | Platform-capped: PreToolUse deny not honored for background subagents (ADR-13) → enforcement = prompts policing prompts (hard rules + TL verify). Hooks themselves now correct. |
| 4 | Messaging / relay reliability | **4** | Empirically the worst: audit ran 4/6 background agents stranding reports; 2026-06-10 research ran 3/3 (incl. failed re-asks). ADR-17 artifact-first is the right *response*, but it is recovery, not reliability. Platform-capped. |
| 5 | Skills system | **8** | ADR-4 producer-preload solid, ~20 skills consistent post-sweep. Cap: plugin-skill inventory under-reporting (P2). |
| 6 | Release & build machinery | **9** | Version-keyed-cache problem fully owned; CI bump-gate verified in pass AND fail directions; twin `--check`; regen-drift gate. Best-verified area. |
| 7 | Automated testing | **2** | Zero automated tests; this release was verified by hand, once. Three 1.3.0-cycle bugs were unit-catchable. (Ecosystem average is ~1 — context, not absolution.) |
| 8 | Internal consistency | **8** | Swept, grep-verified, independently re-verified. Standing risk: 8 agents duplicate blocks by design (ADR-14) with no lint guarding drift yet. |
| 9 | Security guard | **7** | Catastrophic-op + secret coverage incl. Windows/PowerShell; pattern-based and deliberately fail-open — a seatbelt, not a lock. |
| 10 | Observability / audit | **7** | Opt-in token audit done right (zero-cost off, per-session trace + detail, consumption-report). No run-level health view beyond the TL dashboard. |
| 11 | Consumer-facing docs & config | **7** | Strong README/CHANGELOG discipline; per-agent model/effort config ships. No "first pipeline run" walkthrough. |

**Overall: 6.5/10** (pain-weighted toward relay + boundaries; unweighted ≈ 6.7).
Shape: **design & machinery 8–9 · runtime reliability 4–5 · testing 2.**

## Why categories 3 and 4 score low — incidents or real evaluation?

Real evaluation; the incidents are the *evidence*, not the *cause*. Three structural facts set the scores:

1. **No preventing mechanism exists.** For background subagents the gate's deny is not honored
   (ADR-13), so a boundary violation is prevented only by the agent reading and obeying its own
   instructions. For relay, an agent's deliverable can vanish behind a lifecycle reply and nothing
   in the channel prevents it. Instruction-level mitigation tops out around 5/10 by the method above.
2. **The failure rate is measured, repeated, and cross-context.** Relay stranding reproduced across
   two sessions, multiple agent types, multiple prompt styles — including prompts that explicitly
   forbade the failure mode, and including re-asks (0/2 on 2026-06-10). This is not one bad day.
3. **The mitigations are recovery, not reliability.** Artifact-first (ADR-17) + TL salvage protocols
   mean little is ultimately *lost* — which is why the pipeline is usable at all — but the category
   measures the channel, and the channel drops deliverables.

What the scores are **not**: punishment for past, since-fixed pain (see machinery at 9), or a claim
that the 1.3.0 work didn't help (it moved agent design 4→8). Honest caveat the other way: the worst
relay offenders measured to date were OMC research agents, not nexus pipeline agents — but nexus runs
on the same platform channel, its own audit-time rate was 4/6, and until a live post-1.3.0 pipeline
run produces better numbers, 4 stands.

## Improvement roadmap (the three named categories)

### A. Automated testing (2 → ~6, then ~7) — plan exists

Per `docs/research/testing-claude-code-plugins.md` (4 tiers):
1. **Now, $0, no bump:** T1 structural lint (frontmatter schema, skill-ref resolution, convergence
   lint on verdict vocabulary + carry-over headings, CHANGELOG↔plugin.json) + T2 `node --test` unit
   tests (hooks fed synthetic event JSON; bump classifier table; gen-commands fixture; gen-omni
   round-trip), both wired into `plugin-release-check.yml`. → score ~6.
2. **After CI auth decision (ANTHROPIC_API_KEY secret):** T3 deterministic trajectory evals
   (promptfoo claude-agent-sdk provider; "critic never invokes Write", "developer Phase 1 makes no
   edits") + T4 small llm-rubric set. Grow scenarios from real failures only (TDAD). → score ~7.

### B. Pipeline enforcement (5 → ~7.5)

Constraint honored: no re-litigating spawn mode; enforcement stays agent-hard-rule + TL-verify
(ADR-13–16). What raises the score is converting prompt-level rules into **platform-enforced or
deterministic** mechanisms:

1. **Frontmatter `disallowedTools` + `maxTurns` (Track 5 item — highest impact).** Tool restriction
   in agent frontmatter is enforced by the platform regardless of spawn mode — *proven live*: OMC's
   document-specialist agents physically lack Write. Lock the **critic** (no Write/Edit/MultiEdit/
   NotebookEdit — it is message-only by contract) and consider learner restrictions; add `maxTurns`
   caps to all pipeline agents. This makes the most dangerous boundary (a spoke authoring artifacts)
   physically impossible for the critic instead of discouraged. Shipped change → MINOR bump.
2. **Probe P1, then gate-as-detector.** Verify empirically whether PostToolUse hooks *fire* inside
   background subagents (hook payloads carry `agent_id`/`agent_type`; ADR-13 only established that
   the *deny* is ignored). If they fire: extend the gate to **detect** — append boundary violations
   (agent X wrote path Y) to a `.claude/audit/violations.log` and emit a systemMessage; the TL greps
   the log at every verify point. Prevention stays impossible; detection becomes deterministic.
   If hooks don't fire at all in background subagents, this route dies — record the probe result in the ADR.
3. **Deterministic TL verification.** Completion-footer checks (see C.2) + existing Self-Review/
   verdict validations move TL verification from "read and judge" to "grep and judge".

### C. Messaging / relay reliability (4 → ~6.5, platform-capped)

**The transcript, defined (mechanism — was previously undocumented).** For every spawned subagent,
the platform itself appends the agent's entire run — every message and tool call — to
`{session-dir}/subagents/agent-{agentId}.jsonl` (the spawn result returns the `agentId`). It is
written by the platform, not by the model: it cannot strand, cannot be forgotten, and is verbatim by
construction. It is therefore the **guaranteed record** behind every lossy message channel. Reading
it must be done by a **script, never by a model** — piping a 300KB transcript through an agent to
"find the report" burns tokens for nothing; this plugin optimizes feature production AND token
consumption. (Design detail to verify during implementation: locating `{session-dir}` from a consumer
project — likely a SessionStart hook recording the path for scripts to use.)

1. **No standalone critic artifact — the review record lives in the artifact it served.** The critic
   is an aid bound to some task (spec, plan, promotion — always someone else's artifact); its
   findings' lifecycle ends when the artifact owner applies them, and the **owner** records the
   outcome *in the artifact itself* — as `plan.md` already does (review-record header line + inline
   `critic {ID}` markers). No `plan-review.md` as a pipeline mechanism: it would be a second,
   driftable source of truth for what the reviewed artifact already records, written by someone who
   isn't the critic. (Historical archives like PluginCleanup's remain valid as archives.) The critic
   stays message-only and tool-locked (B.1); if its message strands, the spawner salvages (2) and
   applies findings exactly as if the message had arrived.
2. **Ship a generic salvage script — `salvage(agentId) → text`.** Agent-agnostic by design: stranding
   hits any background agent (measured on researchers, not pipeline agents, on 2026-06-10), the critic
   is merely the only agent whose *primary* deliverable rides the message channel. The script extracts
   the final substantive assistant text from the subagent transcript; the spawner decides what to do
   with it (critic findings → apply; worker report → read). Hand-built twice now; ship it
   (hooks/scripts or a skill-bundled script), document it in team-lead.md as the designed recovery
   leg, not an emergency improvisation. Zero model tokens.
3. **Completion footer in artifact formats.** `implementation-format`/`review-format` (etc.) gain a
   final `*Status: COMPLETE — {role}, {date}*` line; the TL trusts the footer, not the message. A
   stranded message then costs nothing for artifact-producing agents: the artifact self-certifies.
4. **Codify recovery order in team-lead.md:** artifact → TaskOutput → salvage script → re-ask
   LAST (measured 0/2 on 2026-06-10). Today's order implies re-ask too early.
5. **Measure stranding rate** via T3 evals + token-audit detail, so the next evaluation has a number
   instead of anecdotes.

### Sequencing (owner-decided, TDD-first)

No rapid live test exists — every live run costs 30–120 min, so live validation moves to the END.

1. **Tests first (TDD).** Build the T1+T2 harness: green baseline tests for current behavior, plus
   **red** tests for the fix package, failing for the right reason before any fix lands —
   frontmatter lint asserting the critic declares `disallowedTools` (red until B.1); unit tests for
   the salvage script against fixture transcripts (red until C.2); format-skill lint asserting the
   completion footer (red until C.3); convergence lint asserting team-lead.md's recovery order names
   salvage-before-re-ask (red until C.4).
2. **Probe P1** (do hooks fire inside background subagents?) — an experiment, not a test; its result
   sets the scope of B.2 before implementation starts.
3. **Implement the enforcement + relay package** — turn the reds green; one MINOR release
   (B.1, C.1–C.4; B.2 if P1 allows).
4. **T3/T4 evals** once CI auth is decided — turns categories 3/4 into measured numbers.
5. **Live validation by the owner: 2 new features in other projects** — the real acceptance test, last.

**Status (2026-06-10):** steps 1–3 SHIPPED. Step 1: 60-test green baseline + 18 reds, all verified
failing for the right reason first; CI hard gate live; the harness found a real bump-plugin bug
(porcelain first-line trim) on its first run. Step 2: probe answered YES for PostToolUse —
background-subagent hook events fire and carry the parent session_id (which exposed and fixed a
register-persona clobber). Step 3: B.1 + B.2 + C.2–C.4 shipped as 1.4.0 (critic tool-lock,
boundary-detector + violations.log, salvage-transcript script + injected path, completion footers,
recovery order codified); all reds promoted to the permanent suite. Step 4 SHIPPED
**local-first on subscription auth** (owner decision: no API key/CI billing for now) —
`tests/evals/`: headless `claude -p --plugin-dir` sessions run the real agents against
seeded-defect fixtures (critic message-only + verdict vocabulary + gap not accepted;
developer Phase-1 stop-and-ask; reviewer carry-over engagement, haiku-judged), promptfoo
dropped because its judge path requires an API key; CI wiring deferred with that decision.
Remaining: step 5 (owner live validation).

*Confidence: high on A (researched, costed); high on B.1 (platform behavior proven live); medium on
B.2 (gated on probe P1); medium-high on C (designs are simple, but the score ceiling is the platform's).*
