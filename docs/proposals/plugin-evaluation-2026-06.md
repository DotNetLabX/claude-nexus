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

1. **Two-leg critic channel (hub-persisted, transcript-backed).** Keep the critic message-only and
   tool-locked (B.1); the hub (TL, or architect in standalone) persists the verdict + findings to
   `docs/specs/{slug}/delivery/plan-review.md` (spec reviews: `definition/spec-review.md`).
   *The persistence alone does NOT fix stranding* — if the message strands, there is nothing to
   persist. The load-bearing leg is the transcript: the platform writes
   `subagents/agent-{id}.jsonl` unconditionally, so for a tool-locked agent the transcript IS the
   guaranteed artifact. Happy path: message arrives → hub transcribes. Stranded path: hub runs the
   salvage extractor (2) on the transcript → same file. Either way the artifact exists and nothing
   trusts the model's last message. This also resolves the B.1↔artifact-first tension: a locked
   critic cannot be artifact-first, and doesn't need to be — the platform's transcript is more
   reliable than an agent remembering to Write (an agent can strand a message; the platform cannot
   strand a transcript).
2. **Ship the salvage extractor.** A small script/skill that extracts the last substantive assistant
   text from a subagent transcript — hand-built twice now; as the designed second leg of (1), it must
   be deterministic and documented in team-lead.md, not an emergency improvisation.
3. **Completion footer in artifact formats.** `implementation-format`/`review-format` (etc.) gain a
   final `*Status: COMPLETE — {role}, {date}*` line; the TL trusts the footer, not the message. A
   stranded message then costs nothing for artifact-producing agents: the artifact self-certifies.
4. **Codify recovery order in team-lead.md:** artifact → TaskOutput → transcript salvage → re-ask
   LAST (measured 0/2 on 2026-06-10). Today's order implies re-ask too early.
5. **Measure stranding rate** via T3 evals + token-audit detail, so the next evaluation has a number
   instead of anecdotes.

### Sequencing recommendation

1. **Live pipeline run on a small feature** (validates 1.3.0 restorations; feeds real eval scenarios) —
   highest information per hour; moves category 2 toward 9 or surfaces what the restore missed.
2. **Testing T1+T2** (no bump, ~1–2 days) — locks in the consistency sweep, catches the next B1-class bug.
3. **Enforcement+relay package as one release** (B.1, C.1–C.4 are mostly agent/skill edits → one MINOR
   bump; B.2 probe first since its result shapes the gate change).
4. **T3/T4 evals** once CI auth is decided — turns categories 3/4 into measured numbers.

*Confidence: high on A (researched, costed); high on B.1 (platform behavior proven live); medium on
B.2 (gated on probe P1); medium-high on C (designs are simple, but the score ceiling is the platform's).*
