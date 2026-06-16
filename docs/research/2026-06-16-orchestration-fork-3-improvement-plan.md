# claude-nexus Fork — Improvement Plan

**Decision:** Fork `github.com/DotNetLabX/claude-nexus` as the base for an internal, serial, near-autonomous build pipeline, conditional on a same-day source audit (see §0).

**Scope of this document:** concrete improvements for the four lower-scored evaluation axes — Pipeline Control (6.5), Autonomy Path (6), Token Efficiency (8), Fork-and-Own (7). The two high-scoring axes (Engineering Quality 9, Stack-Agnosticism 9) are already strong and are left as-is.

**The throughline:** axes 1 and 2 collapse into a single load-bearing build — a *deterministic verification gate at an enforceable boundary, plus holdout scenarios so it can't be gamed*. Pipeline control and autonomy are both currently capped by the same missing gate. Build that one thing and both scores move together.

**Sequencing:** do the Fork-and-Own organizational fixes (§4) **first** — they are cheap and de-risk everything else. Then build the gate (§1 + §2). Then tune tokens (§3) once hardened gates let you delete redundant prose rules.

---

## 0. Precondition — source audit before committing

The deep evaluation verified the 29-ADR architecture record and READMEs directly, but the **literal enforcement code could not be read remotely**. Before investing in the fork, read these in full on clone:

- `guard.js` — the PreToolUse security guard (open/hardened/off modes)
- `pipeline-gate.js` — the mechanical pipeline gate
- `inject-rules.js` — SessionStart rule injection
- `boundary-detector.js`, `read-tracker.js`, `skill-tracker.js` — PostToolUse detection
- `gen-commands.mjs` — agent → persona-command generation
- Run the shipped T1/T2 `node:test` suite; benchmark one real feature end-to-end and compare tokens against the OMC baseline.

**Go / no-go:** if the hook code quality matches the ADR reasoning, commit to the fork. If it doesn't, drop to `sddw` as the lighter fallback.

---

## 1. Pipeline Control — current 6.5, target ~8.5

**Ceiling cause:** ADR-13 — a synchronous PreToolUse `deny` is *not honored for a background (sidechain) subagent's tool call*. Since the pipeline spawns agents in the background (ADR-12), the mechanical gate is "inert against exactly the agents it targets." Enforcement degrades to prompt-level rules + after-the-fact detection logging. This is the single highest-leverage area in the tool.

### 1.1 Move the hard gate to the enforceable boundary
Background-subagent denies are dropped, but the **foreground orchestrator's Stop / SubagentStop boundary** is enforceable. Re-architect so the deterministic gate fires when control returns to the team-lead, not inside the background worker.
- The worker can't be blocked mid-write, but its output **can** be blocked from acceptance at handoff.
- Converts "detect-then-log" into "block-at-handoff" — the difference between observing a violation and preventing it from advancing.

### 1.2 Implement ADR-24 (currently PROPOSED) — detect-then-gate
Convert the two most dangerous documented failure modes from detected-after-the-fact into deterministic facts:
- **Gate fabrication (ADR-18):** a git-author check at every verify point — did the developer sign a verdict only the reviewer may author?
- **Pipeline self-advancement (ADR-21):** a skill-invocation log gate confirming the required stage actually ran before the next stage starts.
- Both are cheap, deterministic, and close failure modes the ADRs themselves flag as live.

### 1.3 Harden against platform renames
ADR-24 warns Gate A "hangs on the platform `tool_name` for a skill being `Skill`" — a rename would silently false-green the gate. Add a startup assertion that fails **loud** if the tool-name contract changes, so a Claude Code update can't silently disable enforcement.

---

## 2. Autonomy Path — current 6, target ~8

**Ceiling cause:** self-verification quality. The scaffolding for unattended runs exists (`[UNATTENDED]` defaults, ≤11-step auto-approval, force-accept after the 3-cycle cap, fail-open hooks), but nothing *independently* guarantees correctness. This axis is where the 95%-agentic goal actually lives.

### 2.1 Build the deterministic verification gate (the load-bearing addition)
The thing every evaluated tool lacks and that must be built regardless of base.
- Wire **test + lint + type-check + security** as a Stop-boundary gate: the pipeline cannot reach "done" unless the machine ran the real suite and it passed.
- Place it at the **foreground/Stop boundary and in CI**, not on background workers (per §1.1 / ADR-13).
- This is the difference between near-autonomous-demo and trustworthy-unattended. nexus explicitly cannot provide it itself.

### 2.2 Transplant joycraft's holdout-scenario mechanism
nexus's verify step trusts tests that may have been authored by the same agent implementing the feature — gameable.
- Add externally-held scenario tests in a separate location the implementing agent cannot see or edit.
- The verify loop then can't be satisfied by the agent rewriting its own tests.
- This is the strongest autonomy idea in the comparison set and it is directly transplantable.

### 2.3 Wire the T3/T4 eval tier into CI
nexus *built* the real-agent eval tier (`claude -p --plugin-dir`) but never CI-wired it (subscription CLI, no API key). The layer most relevant to autonomy is the least exercised.
- Add an API key to CI and run the eval tier on every change.
- Otherwise autonomy improvements ship untested.

### 2.4 Fail-safe budgets for unattended runs
- Per-run token cap.
- Explicit force-accept / abort budget at cycle-cap exhaustion.
- Prevents the OMC failure mode (an unattended run burning a plan).

---

## 3. Token Efficiency — current 8, target ~9

Already strong (deliberately serial, opt-in token audit, justified model routing, round-scoped reads). These are tuning knobs, not surgery — and several open up *after* §1 hardens the gates.

### 3.1 Trim the every-session rule injection
The ~150-line rule injection fires on every session, including solo runs. Once gates are deterministic (§1), some prose rules become redundant with the hooks and can be cut — the promotion ratchet run in reverse (prose → gate lets you delete the prose).

### 3.2 Reconsider opus-on-five-roles
po, critic, and learner currently run on opus. architect and team-lead genuinely need the reasoning; the other three may not.
- Measure whether sonnet suffices for po / critic / learner at production volume.
- Biggest standing cost lever in the tool.

### 3.3 Extend ADR-22 round-scoped read discipline
ADR-22 was added after an audit found the architect re-reading its own `plan.md` ×35 (~2.5MB through context). Audit the other agents the same way — with one hotspot already found, others are likely.

---

## 4. Fork-and-Own — current 7, target ~8.5 (DO THESE FIRST)

Organizational fixes, mostly free, that de-risk every other change.

### 4.1 Kill the bus factor
Effectively single-author, zero external contributors. Assign **2+ internal owners** who have each read the hook JS and generation scripts end-to-end. Non-negotiable before production dependence.

### 4.2 Impose release discipline on the fork
No tagged releases upstream; versioning lives only in `plugin.json`, marketplace entry is version-less.
- Tag releases on the fork.
- Pin to known-good commit SHAs.
- Treat `plugin.json` bumps as deliberate, reviewed events (the version-keyed cache means a forgotten bump ships nothing).

### 4.3 Add a Claude Code compatibility smoke test
Hooks and gen scripts are coupled to current CC internals (tool names, spawn semantics, persona-registry files).
- Thin smoke test that runs on every CC upgrade and fails loud on hook/tool-name breakage.
- Pairs with §1.3 — both defend against silent platform-drift.

### 4.4 Complete the §0 source audit
Read `guard.js`, `pipeline-gate.js`, `inject-rules.js`, `gen-commands.mjs` in full. This is the conditional gate on the whole decision: confirm code quality matches ADR quality before deep investment.

---

## Recommended execution order

1. **§4 Fork-and-Own fixes** (cheap, de-risking) + **§0 source audit** — establish ownership, release discipline, compatibility testing, and confirm the code is worth the investment.
2. **§1 + §2 the verification gate** — the deterministic gate at the Stop/handoff boundary + holdout scenarios + ADR-24 detect-then-gate + T3/T4 in CI. This is the core build; it moves both pipeline-control and autonomy scores together.
3. **§3 token tuning** — trim now-redundant rules, right-size model routing, extend read discipline. Done last because §1's deterministic gates are what make the prose-rule trims safe.

## What does NOT need changing
- **Engineering Quality (9):** the 29-ADR record is an asset to inherit, not rebuild.
- **Stack-Agnosticism (9):** the Read-Index pattern (ADR-5) + dependency-extension model (ADR-3) give a clean stack-agnostic core; keep the `nexus` / `nexus-dotnet` split intact and add your own stack layer the same way `nexus-dotnet` does.

## The honest constraint
Every verify-and-remediate loop is only as good as the checks the machine can run. The §2.1 gate is necessary but not sufficient — a passing suite against a mis-specified feature still ships the bug. Investment in the **test + holdout-scenario corpus** matters more than any change to the pipeline tool itself, and is the real determinant of how close you get to 95%.
