# Orchestration Plugins — Scorecard

A code-grounded scoring of every plugin evaluated this pass, **including Nexus itself**,
across the categories that actually matter for Nexus's stated goal: *run unattended
overnight without breaking the attended experience we already have.*

All scores are 1–10 and grounded in **source read on clone** (hooks, scripts, CI
workflows), not READMEs — except OMC, which is marked `*` (carried from prior research,
not code-read this pass). Where a README claim was contradicted by the code, the score
reflects the **code**.

---

## Why these categories

The prior research used six generic axes and got burned because it never asked the one
question that separates a real gate from a slogan. So the first category here is the one
it missed:

| Category | What it measures | Why it matters for the goal |
|----------|------------------|------------------------------|
| **Enforce** — Enforcement reality | Are gates deterministic (hooks, exit codes, server state, process boundaries) or prompt instructions a model may ignore? | Unattended runs have no human to catch a skipped gate. This is *the* discriminator. |
| **Orch** — Orchestration / pipeline control | Multi-step coordination, role separation, handoffs, gate structure | The pipeline's backbone. |
| **Auton** — Autonomy mechanism | Genuine unattended capability: verify-remediate loops, headless operation, budgets | The thing we're building toward. |
| **Verify** — Verification & anti-gaming rigor | Runs a real test/lint/type suite; resists test-gaming (holdout) | Substitutes for the absent human's judgment. |
| **Token** — Token & context discipline | Context isolation, serial vs parallel cost, read discipline | Overnight jobs must be affordable. |
| **Eng** — Engineering & architecture quality | Code quality + design reasoning depth | Determines maintainability. |
| **Observ** — Observability / auditability | Can an operator reconstruct what happened from logs/state? | When nobody watched, the audit trail *is* the run. |
| **Attend** — Attended HITL UX | Quality of the human-gated experience (checkpoints, options, relay) | **The thing we must not break.** |
| **Port** — Portability / fork-and-own | Stack-agnosticism + surface size + license + platform coupling | Maintainability of the base. |

---

## The matrix

| Plugin | Enforce | Orch | Auton | Verify | Token | Eng | Observ | Attend | Port | ~Avg |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Nexus** | 6 | **8** | 5 | 3 | **8** | **9** | **8** | **8** | 7 | **6.9** |
| joycraft | **7** | 6 | **8** | **8** | **8** | 8 | 6 | 5 | 7 | **7.0** |
| maestro | **7** | **8** | 6 | 5 | 5 | 8 | 7 | 7 | 6 | 6.6 |
| feature-dev | 3 | 7 | 4 | 4 | 7 | 8 | 3 | **8** | **8** | 5.8 |
| meridian | 4 | 5 | 4 | 4 | 7 | 7 | 6 | 7 | 7 | 5.7 |
| sddw | 2 | 5 | 5 | 4 | **8** | 6 | 4 | 7 | **9** | 5.6 |
| nexus-agents | 5 | 7 | 6 | 5 | 3 | 8 | 6 | 4 | 4 | 5.3 |
| OMC* | 4 | 6 | 6 | 5 | 3 | 4 | 5 | 5 | 3 | 4.6 |

> The flat average is deliberately *not* the headline — the categories aren't equally
> important for our goal, and these tools aren't all trying to be the same thing. Read the
> per-category leaders instead.

**Per-category leaders:**
- **Enforcement reality:** joycraft / maestro (7) — the only two with a *real* hard mechanism. Nexus (6) is detect-then-log on the agents that matter (ADR-13).
- **Orchestration:** Nexus / maestro (8).
- **Autonomy:** joycraft (8) — the holdout loop is the genuine article.
- **Verification & anti-gaming:** joycraft (8); **Nexus is dead last (3)** — the single biggest gap.
- **Engineering quality:** Nexus (9) — the ADR record is unmatched in the field.
- **Observability:** Nexus (8) — audit logs, violation detection, consumption report. A real asset for unattended.
- **Attended UX:** Nexus / feature-dev (8) — the thing we protect.

---

## Per-plugin notes (notable scores only)

**Nexus — 6.9.** Leads the field on orchestration, engineering, observability, and attended
UX, and is genuinely token-disciplined. Two soft spots and one hole: enforcement is
detect-then-log on background subagents (Enforce 6); autonomy scaffolding exists but isn't
load-bearing (Auton 5); and **verification is the hole (3)** — no real suite gate, trusts
agent-authored tests (gameable). The whole autonomy program is about turning that 3 into an
8 *without* denting the 8s.

**joycraft — 7.0.** The mirror image of Nexus: weak where Nexus is strong (attended UX 5,
orchestration 6) and strong exactly where Nexus is weak (autonomy 8, verify 8). Its holdout
mechanism — separate private repo, one-way spec dispatch, tests against the compiled binary
in CI, GitHub-App-token access — is the only **real** anti-gaming boundary in the set. This
is the plugin to mine.

**maestro — 6.6.** The one **genuinely enforced gate** in the field: `create_session`
throws `DESIGN_GATE_UNAPPROVED` server-side, and because it's a cooperative tool call (not a
PreToolUse hook) it survives the background-subagent deny-drop that caps Nexus. The
`assertNoOrphanedApprovedGate` drift detector is a clever bonus. But its "no-code-after-review"
HARD-GATE is pure prompt theater, and its parallel-subagent + MCP-server cost model is the
OMC-adjacent profile we're avoiding (Token 5, Port 6).

**feature-dev — 5.8.** First-party, elegant, no enforcement (Enforce 3, Observ 3 — nothing
persists past the conversation). Worth it for two patterns: the **parallel-options
architecture panel** (3 opinionated blueprints → orchestrator synthesis → user picks) and the
**confidence-gated reviewer** (≥80 numeric cutoff). Both transplant cleanly.

**meridian — 5.7.** Headline claims are README fiction (no-subagents: false; 9+ hard gate:
self-reported; memory.jsonl: deleted v0.0.82). The one real asset is deterministic
SessionStart context injection — which Nexus already equals.

**sddw — 5.6.** The trilogy's "primary fork target," and at the code level the **least
enforced** option: no shell loop, "loop until green" is prose, re-entry is a human re-typing
a command. Its genuine value is narrow: clean four-component decomposition and a
remediation-task schema with a `Severity / Origin` taxonomy. Best portability (9), tiny surface.

**nexus-agents — 5.3.** Real, production-grade LinUCB/TOPSIS + consensus code (Eng 8) but the
wrong shape for a fixed-role serial pipeline, heavy (Token 3, Port 4), and the multi-voter
happy path is untested (issue #2158 confirmed). Skip.

**OMC* — 4.6.** Not code-read this pass; carried from prior research as the negative anchor.
Parallel tmux workers at ~5× tokens (Token 3), large native-dep codebase (Port 3). Rejected.

---

## Where Nexus stands, and the one-line strategy

Nexus is **already the best-engineered orchestrator in the field** and leads on everything
except the two axes that define unattended operation — **verification rigor (3)** and
**enforcement reality on background agents (6)**. It is not behind the field; it is ahead of
it with one specific, well-understood hole.

> **Strategy: keep all of Nexus's 8s and 9s; import joycraft's verify/anti-gaming (3→8) and
> maestro's cooperative-tool-call gate (6→8). That single move makes Nexus the unambiguous
> leader — and it's exactly the unattended-autonomy program.**

The complementarity is almost too clean: the two plugins that beat Nexus on a category each
beat it on *precisely* the categories the autonomy goal needs, and nowhere else.
