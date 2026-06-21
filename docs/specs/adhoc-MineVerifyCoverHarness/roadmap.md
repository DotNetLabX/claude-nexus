# adhoc-MineVerifyCoverHarness — implementation plan

**Design/spec:** `docs/proposals/mine-verify-automation-design.md` (method + the spike-corrected cost
design). **Pilot record:** `mine-verify-pilot-method.md`, `mine-verify-pass3-evaluation.md`.
**Architecture home:** the VERIFY-stage gate named by reference in ADR-26 — *"promote to its own ADR
when built."* This feature is that build; it graduates to **ADR-30** when shipped.

**Status:** Mine→Verify proven over 2 sessions (recall 3/3 on HealthScore + BugRatio; cost shape learned
— see design §2). VWH ruled out as host (engine eval, `vwh-engine-eval-result` memory). Substrate decided:
**standalone nexus skill + Workflow.**

## Delivery model (the architectural decision)

Build **dev-repo-first; harden to a shipped skill last** — the repo's own pilot-before-harden pattern
(ADR-25 master gate: prove the loop before paying the skill-delivery + version-bump cost).

- **Method** → eventual `plugins/nexus/skills/mine-verify-cover/SKILL.md` (the durable, shippable core).
- **Orchestration** → a Workflow (the Mine→Verify→Cover→Discover loop). It ships as *documented design the
  orchestrator instantiates* — skill markdown cannot reference `${CLAUDE_PLUGIN_ROOT}` (ADR-2 #3), so the
  loop is authored from the skill's spec, not loaded from a bundled script path.
- **Deterministic helpers** (recall scorer, gate computations, KB-ledger writer) → small scripts; consuming
  projects receive them via the read-index copy pattern (ADR-5).
- **Language-neutral core / adapter split** (the plan's binding constraint): core = loop controller, the
  5-gate battery, consistency math, KB schema, stopping signals; adapter = evidence indexer (Roslyn),
  mutation tool (Stryker), test stack (xUnit + FsCheck). **First adapter = .NET.**

## Build increments (dependency order)

1. **Verify — productionized (batched + sliced).** ✅ **DONE** (recall 3/3 on BugRatioAnalyzer). The
   spike-corrected cost fix as the real Verify phase: triage → slice once → batched sliced verify
   (~5 rules/call) → tier. Pure nexus, self-contained; yields the clean per-class token number still owed
   to #4. *No cross-repo dependency.* **NOT the dropped v3 spike** — that was a throwaway measurement; this
   is the durable component. Shipped: `harness/mine-verify.workflow.js` + `harness/lib/recall-score.mjs`.
2. **Cover.** ✅ **BUILT** (`harness/cover.workflow.js` + `harness/lib/cover-gates.mjs`; the Stryker config
   + KB ledger flip land in sprint-rituals). TDD test-writing + Stryker mutation gate on the verified rules
   — completes the loop AND produces our Cover cost, the phase that actually maps to VWH's ~73s/experiment
   (closes #4). *Touches sprint-rituals + the .NET/Stryker toolchain — coordinate with the sprint-rituals
   Cover work (HealthScore done there; BugRatio pending) to avoid collision.*
   **Operator-owed to fully close:** the live Cover run on BugRatioAnalyzer (mutation floor ≥75 reachable),
   the KB ledger flip, the recorded Cover cost, and the SR commit — see
   `delivery/implementation-increment2-cover.md` ## Operator Actions Required.
3. **Loop controller.** Wrap Mine→Verify→Cover→Discover with external-signal stopping (dry-counter,
   mutation ratchet, hard budget), the 5-gate honesty battery, the KB ledger write (project schema,
   supersede-not-delete), and clean-room enforced via `disallowedTools` (the mechanism, not a prompt).
4. **Harden to a shipped nexus skill.** Resolve delivery, write the born-compliant `SKILL.md`, add
   lint/unit tests under `tests/`, ship via `release-plugin`, promote the ADR-26 reference to **ADR-30**.

## Versioning & blockers (per `docs/research/2026-06-14-next-major-selection.md`)

- **This is a big *effort*, not a MAJOR *version*.** Semver MAJOR = breaking / behavior reversal
  (`release-plugin` policy); a new skill is new *capability* → **MINOR**. Increments **1–3 are no-bump
  dev-repo work** (the Workflow + helper scripts ship nothing to users); only **increment 4 (ship the
  skill) bumps — MINOR.** Don't force a MAJOR.
- **No CI-auth blocker.** The loop runs via Workflow/agents on the subscription session — no
  `ANTHROPIC_API_KEY` / CI-auth decision gates it (unlike the promptfoo plugin-evals, which are a
  *different* artifact and already shipped subscription-local). The next-major research eliminated this
  harness partly on a CI-auth blocker that does not apply to it.
- **The research's premises are stale/resolved** — the unit-test "collision" (that suite shipped), the
  "unbound substrate" (decided standalone + recall proven this session), and CI-auth (above). De-staled,
  this harness is the correct next big build; that is the path here.

## Start

**Increment 1 (Verify, batched)** — the safe, no-coordination foundation that also closes an open #4
number. **Cover (2)** is the bigger de-risk (it's the heart of the value), but it needs the sprint-rituals
side and the .NET toolchain, so it sequences next, coordinated — not unilaterally.
