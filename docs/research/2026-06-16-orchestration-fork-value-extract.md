# Orchestration-Fork Research — Value Extract

Distilled from the three-part fork investigation
(`2026-06-16-orchestration-fork-{1,2,3}-*.md`). **Only the items that genuinely add
value to Nexus are kept** — the source documents were written outside-in (researcher
never read the hook code, optimized for a "95% agentic / Dark Factory" goal Nexus has
not committed to), so most of their recommendations are already-shipped, already-decided,
or Nexus's own principles handed back. Those are listed at the bottom as *excluded*, so
we don't re-litigate them.

> Status: code-reviewed. The comparison plugins were cloned and their actual source read
> (hooks, scripts, CI workflows — not just READMEs); see **From source-level evaluation**
> at the end. Several trilogy claims did not survive contact with the code.

---

## A. Net-new mechanisms Nexus lacks (proposal-worthy)

These are the genuine gaps. All three pull in the same direction: **deterministic
verification, at an enforceable boundary, that the implementing agent cannot game.**

### A1. Stop / SubagentStop boundary — "block-at-handoff" instead of "detect-then-log"
The sharpest single idea in the trilogy, and net-new relative to the ADR register.
ADR-13 records that a *background* subagent's PreToolUse `deny` is dropped, so Nexus
retreated to PostToolUse detection logging. But the **foreground orchestrator's
Stop / SubagentStop boundary is still enforceable.** The worker can't be blocked
mid-write, but its *output can be blocked from acceptance at handoff*. This converts
the weakest axis (pipeline control) from a documented limitation into a fixable one —
without reverting ADR-12 (background spawn).
- **Net-new:** yes. The ADRs never exploit the Stop boundary as an enforcement locus.
- **Effort:** medium (new hook + handoff-acceptance logic in team-lead).

### A2. A deterministic verification gate wired to a real suite
Nexus is a *coordination + quality-review* pipeline. It does **not** run your real
test / lint / type-check / security suite as a hard gate. That gap is exactly the line
between "near-autonomous demo" and "trustworthy unattended." Wire the suite at the
**Stop boundary + CI** (per A1, not on background workers). No off-the-shelf orchestrator
provides this — it is the load-bearing thing you build yourself.
- **Net-new:** yes (T3/T4 evals exist but are agent-behavior tests, not a per-feature
  code-correctness gate).
- **Effort:** medium–high; the gate is cheap, the *test corpus it runs* is the real cost.

### A3. Holdout-scenario anti-gaming (transplant from joycraft)
Nexus's verify trusts tests that may have been authored by the same agent implementing
the feature — gameable. Hold a set of scenario tests in a location the implementing agent
cannot see or edit; the verify loop then can't be satisfied by the agent rewriting its own
tests. This is the strongest *autonomy-quality* idea in the comparison set and is directly
transplantable onto A2.
- **Net-new:** yes.
- **Effort:** medium; needs a separate, access-isolated scenario corpus.

---

## B. Worth doing (tuning / hygiene — not proposal-scale)

### B1. Model-routing review — opus on po / critic / learner
Verified live: opus runs on **team-lead, architect, po, learner, critic** (5 of 8);
sonnet on developer, reviewer, solo. architect + team-lead genuinely need the reasoning;
**po / critic / learner are the candidates to measure sonnet against.** Biggest standing
cost lever in the system.

### B2. Fail-safe budgets for unattended runs
Per-run token cap + an explicit force-accept / abort budget at the 3-cycle cap. Prevents
the unattended-run-burns-a-plan failure mode. Lightweight, only matters if autonomy is
pursued (A-series).

### B3. CC-upgrade compatibility smoke test
ADR-24 already flags that Gate A "hangs on the platform `tool_name` for a skill being
`Skill`" — a rename would silently false-green it. Add a thin smoke test that runs on each
Claude Code upgrade and **fails loud** on hook / tool-name / spawn-semantics breakage.
Cheap insurance against silent platform drift.

### B4. Fix the Rules 10/11 doc drift
File 3 caught a real inconsistency: the marketplace README says "Rules (11)" while the
core plugin README says "Rules: 10." Trivial, but it's documentation moving faster than
reconciliation — worth a one-line fix.

---

## C. Explicitly excluded (do NOT re-litigate)

The research recommended these; each is already done, already decided, or restating
Nexus's own principle. Listed so they don't resurface as "open items."

| Recommendation | Why excluded |
|----------------|--------------|
| Implement ADR-24 (detect-then-gate) | **Already shipped** — `skill-tracker.js`, `skill-invocations.log`, boundary-detector Bash branch, git-author check all exist. Only the ADR *ratification* (a doc act) is pending. |
| Tag releases / impose release discipline | Tagging machinery exists (ADR-9: `claude plugin tag --push`). If GitHub shows no tags, that's publish discipline, not a missing capability. |
| Wire T3/T4 evals into CI with an API key | Contradicts a documented owner decision (subscription CLI, no API key, deferred on purpose). |
| Trim the ~150-line rule injection | Nexus's own allocation principle handed back; already governed by it. |
| Extend round-scoped read discipline | ADR-22 already does this. |
| Kill the bus factor / assign 2+ owners | Forker framing — the owner *is* the author; not an architecture change. |

---

## Framing caveat (carry into any adoption decision)

All three source documents optimize toward unattended autonomy (their Autonomy axis = 6,
the one they push hardest). That is the axis Nexus has most *deliberately* not maximized —
judgment-in-the-loop at the scope and ship gates (ADR-25, ADR-15) is a feature. **The real
decision the A-series forces is: do we want to push Nexus toward unattended autonomy at
all?** If yes, A1 + A2 + A3 are a coherent spine and proposal-worthy (RFC-lite, ADR-28).
If no, only B1 (cost) and B3/B4 (hygiene) survive as generally useful.

---

## From source-level evaluation (cloned the repos, read the code)

The trilogy never read these plugins' source — only READMEs. Reading the actual hooks,
scripts, and CI workflows overturned several load-bearing claims and sharpened two
genuinely transplantable mechanisms.

### What reading the code overturned

| Trilogy claim | Reality in the source | Verdict |
|---|---|---|
| sddw has the "cleanest verify→remediate loop"; **primary fork target** | No shell loop exists. "Loop until green" is markdown prose; re-entry is suggestion text a human/orchestrator must act on — no exit-code gate. The "multi-agent pipeline" is a single-agent slash-command system. (~95% markdown, not the "85% shell" claimed.) | **Less enforced than Nexus.** Debunked as a mechanism. |
| Harvest claude-spec's `check-approved-spec.sh` PreToolUse gate | **The file does not exist.** It's pseudocode in an architecture doc, marked "done" in PROGRESS.md but never created; specifies `exit 1` (wrong deny convention) and a self-settable `status: approved` marker. | **Vaporware.** Nothing to harvest. |
| maestro has "genuinely enforced gates" | Half true. The **design gate is real** (`create_session` throws `DESIGN_GATE_UNAPPROVED` server-side). The "HARD-GATE: orchestrator must not edit code after review" is **pure prompt theater** — no code enforces it. | **Partly real** — and the real half is the valuable part (A1 below). |
| meridian: avoids subagents, 9+ hard plan gate, append-only `memory.jsonl` | All three are README fiction. 6 agent types + a headless subprocess; the 9+ score is self-reported with no parse-and-block; `memory.jsonl` was deleted in v0.0.82. | **Debunked.** |
| joycraft's holdout-scenario anti-gaming | **Real and well-built** — separate private repo, one-way spec dispatch, tests run against the compiled binary in CI, access gated by a GitHub App token. | **Confirmed. Best idea in the field.** |
| nexus-agents: LinUCB/TOPSIS routing + consensus voting | Real, production-grade (correct Sherman-Morrison / TOPSIS). But no test exercises the full multi-voter panel (issue #2158 confirmed), and it's the wrong fit for a fixed-role serial pipeline. | **Real, but not for us.** |

Headline: the trilogy's *top* picks (sddw as primary, claude-spec's hook to harvest) are
the **weakest** at the code level. Only **joycraft** and **maestro** carry enforced
mechanisms Nexus lacks; **feature-dev** adds one quality/UX pattern.

### Upgrades to the A-series

**A1 → the enforceable boundary can be a cooperative tool call, not only a Stop hook.**
maestro shows the cleanest route around ADR-13's background-deny problem: the gate lives
*inside an MCP tool the agent must call to proceed* — `create_session` throws if the design
gate is entered-but-not-approved. Because it's a synchronous check in a tool handler, not a
PreToolUse hook, the platform's background-subagent deny-drop does not apply. **Implication
for Nexus:** "team-lead may not advance to phase N+1 without a recorded approval" becomes
*enforceable* if phase-advance is a tool/MCP call carrying a server-side state check — not a
prompt. (maestro's own gap: an agent that ignores the tool and just writes files bypasses it
— so pair it with the Stop-boundary check.) Its `assertNoOrphanedApprovedGate` session-ID
drift detector is a clever bonus worth copying.

**A3 → concrete holdout architecture (verified in joycraft's code).** Scenarios live in a
*separate private repo*; a `spec-dispatch` workflow sends spec **content** (not source)
one-way in; the scenario-writing agent there is told it "CANNOT access the main repository's
source" and may only invoke the **compiled binary**; after CI passes, a `run-scenarios` job
clones the PR, runs tests against the build, and posts PASS/FAIL back. The boundary is a real
repo + process + token boundary, not a markdown rule. **Constraint:** only works for features
with a behavioral surface (CLI / API / filesystem output) — a pure internal-library change has
no binary to test against. joycraft's 3-try autofix-against-the-black-box loop is a bonus.

### New candidates from source review

**A4 — parallel-options architecture panel (Anthropic feature-dev).** Phase 4 launches 2–3
`code-architect` agents in parallel, each forced to a different stance (minimal / clean /
pragmatic), each producing *one opinionated blueprint*; the orchestrator synthesizes them
into a comparison + a reasoned recommendation, then the user picks. Nexus's architect emits a
single plan. The panel surfaces trade-offs the single-plan path hides, and it's first-party-
blessed. Transplantable onto architect Phase-1 — gate it on the master-gate uncertainty axis
(ADR-25) so it fires only for genuinely uncertain designs, not every feature.

**B5 — confidence-gated, multi-axis review (feature-dev).** Its reviewer scores 0–100 and
reports only ≥80 — sharper than Nexus's categorical severity at suppressing noise. It also
runs 3 reviewers on distinct axes (simplicity/DRY, bugs/correctness, conventions) vs Nexus's
single reviewer. Both are cheap refinements to Step-2. (Every feature-dev agent also has
read-only tools — structural, like our critic's `disallowedTools`.)

**B6 — sddw's artifact schemas (the one thing sddw does well).** Remediation findings are
first-class task files carrying a `Severity / Origin` taxonomy (requirements / design /
implementation / external) — a causal classification our reviewer lacks. Its four-component
split (command / instructions / questionnaire / specs) is a clean modularity formalization
worth borrowing for skills.
