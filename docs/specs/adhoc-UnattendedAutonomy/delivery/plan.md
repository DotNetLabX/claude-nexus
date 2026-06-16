# Implementation Plan — Unattended Autonomy (v1)

**Feature Spec:** `docs/specs/adhoc-UnattendedAutonomy/definition/tech-spec.md` (Status: Ready).
Binding cross-check (technical branch, ADR-27): the **ADR register** — **ADR-30** (additive mode),
**ADR-31** (`SubagentStop` verify gate — runs+records, never blocks), **ADR-32** (fail-closed →
review queue), reconciled with ADR-13 (deny dropped on background), ADR-15 (graduated intervention),
ADR-19 (resume idempotency), ADR-11 (opt-in `token_audit`).
**Slug:** adhoc-UnattendedAutonomy
**Plan:** docs/specs/adhoc-UnattendedAutonomy/delivery/plan.md
**Intent:** New capability (plugin-internal: a net-new hook + config convention + agent-doc behavior +
tests; no consuming-project source). One **MINOR** release.
**Review mode (recommended):** **critic, Mode-2 (plan vs spec)** — owner-set. This pass edits a hook
(`*.js`), `team-lead.md`, and the test suite; a doc-only critic is structurally blind to hook/script
defects (architect.md: code-grounded review is mandatory for shared-artifact passes), so run the
Mode-2 critic **code-grounded**.

---

## Context

v1 makes Nexus runnable unattended overnight as a **strictly additive** mode (ADR-30): a switch, not
a rewrite. Three layers ship — Layer 0 (mode switch + the attended-unchanged golden test), Layer 1
(the `SubagentStop` verification gate), Layer 3 (fail-closed defer-to-queue). Layers 2 (enforceable
advancement) and 4 (holdout) are roadmap, not built here.

**The CR-1 spike (RUN & PASSED, 2026-06-16) is the foundation this plan rests on.** It confirmed
empirically (live `claude -p`, CLI 2.1.178): `SubagentStop` fires **per subagent completion**,
mid-session, carrying `agent_type` / `agent_id` / `agent_transcript_path` / `last_assistant_message`
and the parent `session_id`; it runs+records on a *background* subagent; and a `SubagentStop` `block`
**is** honored (unlike the PreToolUse deny of ADR-13) but traps a verify-failed subagent in an
unsatisfiable retry loop — so v1 enforces by **consuming the recorded verdict**, never by blocking.

**The one design fork that shapes the steps (binding interpretation — resolves an AC-0.3a/AC-1.5
tension; flag for the critic):**

> A hook is a **separate process** and **cannot read the `[UNATTENDED]` launch-prompt token**
> (`team-lead.md:383` — it is prompt text the team-lead reads behaviorally, not a hook-visible env
> signal). Therefore the **verify-gate hook is unconditionally advisory**: it *always* runs the
> verify set and *always* records a verdict to `.claude/audit/` (AC-1.5, AC-1.2 "always runs and
> records the same way"). The **`[UNATTENDED]` fork lives entirely in the team-lead** (which reads
> both the prompt and the recorded verdict): attended → the verdict *informs* a human; unattended →
> the verdict *is* the decision and a Fail/cap/unanswered-question **defers to the review queue**.
>
> This means **AC-0.3a's "the hook is a no-op on output and filesystem flag-off" is read precisely
> as: zero `deny`/block output, and no *review-queue* artifact written** (the queue is team-lead-
> driven, AC-3.2). The advisory verdict record in `.claude/audit/` is the always-on behavior present
> in *both* modes (AC-1.5) and is **not** "new behavior reachable only when flag-on" — it changes no
> exit code and blocks nothing (AC-0.3c). The golden test (Step 6) asserts exactly this boundary.

**Code-grounded facts (verified on disk this session):**
- `plugins/nexus/hooks/hooks.json` has **only** `SessionStart`/`PreToolUse`/`PostToolUse` — **no
  `SubagentStop`** today. Clean insertion (tech-spec inventory row; critic CONFIRMED).
- `read-tracker.js` / `skill-tracker.js` are the **always-on observe-only hook** precedents (stdin
  JSON, `async`/`timeout:10`, fail-silent, root = `CLAUDE_PROJECT_DIR || data.cwd || cwd`,
  `mkdir -p .claude/audit`, one JSON line appended). The verify-gate logger mirrors them, but with a
  key difference: it must **run a command** (synchronous verify), so it is **not** `async` and needs
  a longer `timeout` (see Step 2 live-verify).
- `pipeline-gate.js` is **fail-open-by-design** and **does not read `[UNATTENDED]`** (`:101` `// no
  state -> fail open`; the critic's PARTIALLY-REFUTED row). v1 must **not** wire the flag here (CR-2).
- `team-lead.md:319` (retry-once-then-skip-record), `:327` (`Force-accept`, attended-only), `:330`
  (fail-run-never-escalate), `:383` (the `[UNATTENDED]` behavioral switch), and the **Enforcing the
  Rules** § (`:170-189`, the verdict-consumption + least-intervention home) are the edit surfaces for
  Layers 1/3. ADR-19 resume state: `communication-log.md` header `Step`/`Cycle` + `.pipeline-state`.
- No `.claude/verify.json` and no `review-queue` convention exist anywhere yet (grep clean) — both
  are net-new (D1, D2).
- `audit-logger.js` reads `token_audit` (`argv[2]`, ADR-11 opt-in, default OFF) — the D3 cost-cap
  dependency the tech-spec flags (CR-D3).
- Test harness: repo-root `tests/unit/` + `tests/lint/`; `tests/helpers.mjs` exports `runHook`,
  `makeSandbox`, `cleanupSandboxes`, `pluginRoot`, `denyReason`. Canonical CI invocation (hard gate,
  `plugin-release-check.yml`): **`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`** (glob
  form — bare-dir regressed on Node ≥22) + `node scripts/selfcheck.mjs`. `pipeline-gate.test.mjs` is
  the golden-test idiom precedent.
- Current plugin version **1.11.0**. New capability → **MINOR**.

**Decisions settled on the critic-blessed defaults (D1/D2/D3):**
- **D1 — verify config:** `.claude/verify.json` — `{ "commands": [ { "run": "...", "blocking": true }
  … ] }` — with a runner-detection fallback when absent. (Confidence medium-high.)
- **D2 — review queue:** `.claude/review-queue/` holding one file per deferred item + an `index.md`;
  resume re-enters the attended pipeline at the recorded failing phase via the ADR-19 resume state.
  (Chose `.claude/` over `docs/specs/_review-queue/` — it is run-state/audit-adjacent, not a spec
  artifact, and sits beside the audit trail the queue points into.) (Confidence medium.)
- **D3 — budget governor:** a per-run token cap the team-lead reads at each checkpoint, abort-to-queue
  on breach; advisory/inert in attended. **Dependency stated (CR-D3):** the cap is only real if
  `token_audit` is enabled OR a lightweight always-on counter exists — v1 ships the cap as a
  **team-lead checkpoint behavior that reads `token-usage.jsonl` when present and is documented-inert
  when absent** (no new always-on counter in v1; that is a noted follow-up). (Confidence medium.)

## Scope

**In scope (v1 = Layers 0 + 1 + 3):**
1. `.claude/verify.json` config convention + a runner-detection fallback (D1, AC-1.3/1.4).
2. A net-new **always-on advisory `SubagentStop` verify-gate hook** → runs the verify set, writes a
   verdict to `.claude/audit/` (AC-1.1, AC-1.2, AC-1.5). Never blocks/denies (ADR-31).
3. `team-lead.md` consumes the recorded verdict — **attended informs / unattended decides** — and on
   verify-fail / 3-cycle-cap / unanswered-question under `[UNATTENDED]` **defers to the review queue**
   (AC-3.1/3.4), reusing ADR-19 resume state (AC-3.2); a per-run token cap aborts-to-queue (AC-3.3).
4. `.claude/review-queue/` structured-artifact convention + index (D2, AC-3.2).
5. The **golden regression test** pinning attended-unchanged (AC-0.3) — *must exist and pass first*.
6. Document the gate + queue + config in `agents-workflow.md`; ADR-30/31/32 already extracted
   (a cross-check step, not a re-author).
7. One **MINOR** release via `release-plugin`; regenerate `nexus` commands + the `omni` twin.

**Explicitly out of scope:**
- **Layer 2 (enforceable advancement)** — roadmap; rests on the unconfirmed cooperative-tool-call
  assumption, gated behind its own spike. v1 does not depend on it.
- **Layer 4 (anti-gaming holdout)** — phased last; lives outside the in-session path.
- **A `SubagentStop` block path** — the spike proved it traps verify-fails in a loop (ADR-31 Rejected).
  v1 is run+record-and-consume only.
- **A new always-on token counter** — D3 reads existing `token-usage.jsonl` when present; the cap is
  documented-inert when `token_audit` is off. A standalone counter is a noted follow-up, not v1.
- **Wiring `[UNATTENDED]` into `pipeline-gate.js`** — it is fail-open-by-design and not a mode consumer
  (CR-2). Do not touch its decision logic.
- **T3/T4 eval CI-wiring** — separate deferred owner decision.

---

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none — test authoring) | None | yes | Red `node:test` units: verify-gate hook (verdict written / non-impl ignored / **unrecognized agent_type → `agent:"unknown"` written, not skipped** / malformed-stdin no-op / never emits deny-block, **raw** `doesNotMatch("decision":"block")`), verify-config resolution (explicit vs detection), review-queue artifact shape. Each fails for the right reason first. | — |
| 2 | (none — Claude Code hook) | None | yes | New `verify-gate.js` `SubagentStop` hook + matcher-less `hooks.json` registration. **MANDATORY blocking live-verify: the literal `nexus:developer` `agent_type` on `SubagentStop`** (the spike never observed a custom role — built-in `general-purpose` only); **unknown-agent fallback writes `agent:"unknown"`**, never a silent skip. | CC-hook authoring |
| 3 | (none — config convention) | None | no | `.claude/verify.json` schema (`commands[]` w/ `run`+`blocking`) + detection fallback order; this repo's dogfood set (the `node --test` glob + `selfcheck.mjs`) | — |
| 4 | (none — agent definition) | None | no | `team-lead.md`: verdict-consumption fork (attended informs / unattended decides) in **Enforcing the Rules**; **primary edit = Unattended Mode § `:391`** (defer-to-queue), `:319`/`:330` for consistency; token-cap checkpoint + **loud-inert launch warning**; `Force-accept` attended-only | — |
| 5 | (none — convention doc) | None | no | `.claude/review-queue/` per-item artifact + `index.md`; resume instruction wired to ADR-19 state (`communication-log.md` Step/Cycle + `.pipeline-state`) | — |
| 6 | (none — golden test + lint tripwire) | None | yes | AC-0.3 golden (flag-off → no deny/block, no queue artifact; advisory run alters no exit code; **(b') sibling PreToolUse/PostToolUse hooks still fire with the new entry present**); **+ a `SubagentStop` CONTRACT entry in `platform-contract.test.mjs`** (event name + `agent_type` field + matcher-less reg) | — |
| 7 | (none — rules doc) | None | no | Document the verify gate, verify.json, and review-queue alongside the existing audit substrate in `agents-workflow.md` | — |
| 8 | (none — ADR cross-check) | None | no | Confirm ADR-30/31/32 (already extracted) match the shipped behavior; no silent ADR rewrite | — |
| 9 | `release-plugin` | Follow | no | MINOR bump, CHANGELOG, regenerate `nexus` commands + `omni` twin (assert the twin's `hooks.json` carries the new `SubagentStop` entry) | — |

**Skill-verification notes:** Steps 1–8 are plugin-internal authoring (a CC hook script, a config
convention, agent markdown, a convention doc, an ADR cross-check). No `nexus`/`nexus-dotnet` skill
frontmatter covers "write a Claude Code hook" or "edit an agent definition" — `None` is warranted for
each (same finding as adhoc-PipelineGatesHardening). Step 9 is the ADR-9 release flow → `Follow
release-plugin` (the keyword is the developer's binding trigger). **Anti-pattern check:** no "adapt"
near any skill ref; the one Follow step carries only the bump tier + regen targets, not restated
release mechanics.

**Anti-patterns (checked, none present):** no skill dismissed as "simple"; no pattern detail restated
beside a skill ref; every mapped step carries its disposition keyword; no structural-pattern code
reference on the Follow step.

---

## Domain Model / Data Model Changes

None (this is a pipeline/orchestration plugin — no aggregates or DB). New **on-disk artifacts**:
`.claude/verify.json` (project-declared, optional), `.claude/audit/verify-verdict.json` (gate output),
`.claude/review-queue/` (deferred items + `index.md`).

---

## Implementation Steps

### Step 1 — Red tests first (TDD baseline)
**Files (create):** `tests/unit/verify-gate.test.mjs`; **and** add the golden-test scaffolding red in
`tests/unit/` (the golden assertions land green in Step 6 — here, only the verify-gate hook reds).
Mirror the existing hook tests: import `runHook, makeSandbox, cleanupSandboxes, pluginRoot, denyReason`
from `../helpers.mjs`; feed a synthetic event JSON on stdin via `runHook`. Add reds for:
- a synthetic `SubagentStop` event for the **implementation** subagent (payload per the spike:
  `agent_type` = developer-role, `agent_id`, `last_assistant_message`) in a sandbox with a
  `.claude/verify.json` whose command **passes** → asserts a `{verdict:"pass", …}` line written to
  `.claude/audit/verify-verdict.json` (or the chosen audit path); a **failing** command →
  `{verdict:"fail", …}` with the failing command captured.
- a `SubagentStop` for a **non-implementation** subagent (e.g. `architect`) → the gate does **not**
  run verify (it keys to the implementation subagent only; assert no verdict / a skipped record).
- **unknown-agent fallback (HIGH-2):** a `SubagentStop` whose `agent_type` is **absent or
  unrecognized** → the hook still **writes a verdict record marked `agent:"unknown"`** (it does NOT
  silently skip). A written "couldn't classify" is recoverable; a silent no-write is the feared
  false-green. Assert the `unknown`-marked record is written.
- **never a deny/block (LOW-1):** assert the hook's stdout never carries a `decision:"block"`
  (the `SubagentStop` block shape) **nor** a PreToolUse-style `permissionDecision:"deny"` — run+record
  only (ADR-31). **Helper gap:** `helpers.mjs:62` `denyReason()` only reads the PreToolUse deny shape
  (`hookSpecificOutput.permissionDecision`); it does **not** cover the `decision:"block"` field, so
  this assertion needs a **raw** `assert.doesNotMatch(res.stdout, /"decision"\s*:\s*"block"/)` next to
  `denyReason(res) === null`.
- malformed stdin and a missing `.claude/verify.json` → **fail-silent**, exit 0, no crash; with no
  config, the **detection fallback** resolves (assert the fallback command set).
- **flag-off no-queue invariant (pairs with Step 6):** the hook writing a verdict does **not** create
  any `.claude/review-queue/` artifact (the queue is team-lead-driven, not hook-driven).

Each red must **fail for the right reason** (hook script absent) before Step 2, not on a harness error.

- **Skill:** None (test authoring). **TDD:** yes (these ARE the tests).
- **Dependency:** none.
- **Accept:** the verify-gate reds exist and fail because `verify-gate.js` is absent (not a harness
  error); the full baseline stays green under `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`.
- **Confidence:** high — harness layout pinned; `read-tracker.test.mjs` / `skill-tracker.test.mjs`
  are direct precedents for the fixture-feed + audit-append shape.
- **Satisfies:** AC-0.3 (scaffold), AC-1.1.

### Step 2 — The always-on advisory `SubagentStop` verify-gate hook
**Files (create):** `plugins/nexus/hooks/scripts/verify-gate.js`. **Modify:**
`plugins/nexus/hooks/hooks.json` (register a **new `SubagentStop` event** — the first one in the file).

Author a `SubagentStop` hook that, when the completing subagent is the **implementation** subagent
(key off `agent_type` — the spike-confirmed field; match the developer role the way
`boundary-detector.js:80` normalizes `agent_type.split(/[:/]/).pop()`), **runs the project's verify
command set and writes a verdict** to the audit trail (AC-1.1/1.5). Resolve commands via Step 3's
config. Plumbing mirrors `read-tracker.js` (root resolution, fail-silent, `mkdir -p .claude/audit`)
**except**: it executes a command, so it is **synchronous** (not `async`), and `hooks.json` gives it a
**generous `timeout`** (the verify set can take seconds — for this repo the `node --test` glob).

**Verdict record (`.claude/audit/verify-verdict.json`, one JSON line or a small object):**
`{ ts, agent, agent_id, session, token (.pipeline-state), verdict: "pass"|"fail", commands: [{run, ok, blocking}], blocking_failed: bool }`. `token`/`session` give the team-lead a round to scope by
(read-tracker round-keying). The verdict is **advisory** — the hook **never** emits a `decision`/deny.

**Unknown-agent fallback (HIGH-2) — the false-green guard.** Do **not** silently skip when `agent_type`
is absent or unrecognized on a `SubagentStop`. The branch is three-way: implementation role → run
verify + write the verdict; a recognized **non-implementation** role (architect/reviewer/…) → skip
verify, no verdict (it's not the impl boundary); **absent/unrecognized** `agent_type` → still write a
verdict record marked **`agent:"unknown"`** (verify not run, reason recorded). A written
"couldn't classify" is recoverable by the team-lead at its checkpoint; a silent no-write is the feared
false-green. (`salvage-transcript.js` already consumes the same per-subagent transcript surface
`SubagentStop` exposes via `agent_transcript_path` — note the shared platform surface in
implementation.md for the next maintainer; LOW-2, informational.)

**This hook does NOT read `[UNATTENDED]`** (it can't — separate process). It always runs+records; the
mode fork is Step 4's job. This is the AC-1.2 "one execution path, the only branch is consumption."

**MANDATORY BLOCKING LIVE-VERIFY (do before relying on the gate — not optional, HIGH-2).** The spike
confirmed `SubagentStop` fires per-subagent with `agent_type`/`agent_id`/`last_assistant_message`, and
that the matcher-**less** registration is correct (Stop-family hooks take no tool `matcher`;
`wiring.test.mjs` = "absent matcher = `*`" — replicate the spike's matcher-less form exactly). **But the
spike discarded its only custom-agent-type run and fell back to the built-in `general-purpose`
subagent — so the exact `agent_type` string a real `nexus:developer` spawn emits on `SubagentStop` was
NEVER observed.** That string is the load-bearing unknown for the whole gate; the
`.split(/[:/]/).pop()` normalization presumes `nexus:developer`/`developer`, unverified for the *stop*
payload. **The developer MUST run a minimal `claude -p` probe that spawns the real developer role and
records the literal `agent_type` on its `SubagentStop`, and pin the result, before the gate is trusted
— this is a blocking gate on Step 2, not an "if".** Record the verified `agent_type` + matcher form in
implementation.md. (The CR-1 spike harness in the tech-spec verdict is the reference scaffold.) The
unknown-agent fallback above is the safety net if the live string still surprises: a misclassify writes
`agent:"unknown"`, never a silent green.

- **Skill:** None (CC hook). **TDD:** yes (Step 1 red → green).
- **Key constraints:** runs verify only for the implementation subagent; a recognized non-impl role
  skips; an **unrecognized/absent `agent_type` writes an `agent:"unknown"` verdict, never a silent
  skip**; synchronous with a generous timeout; never blocks/denies; fail-silent + zero-footprint on a
  genuine error (malformed JSON), distinct from the unknown-agent *written* record; advisory verdict in
  **both** modes; no `[UNATTENDED]` read in the hook.
- **Dependency:** Steps 1 (red), 3 (config resolution — author 2 and 3 together; either order, but the
  hook needs the resolver).
- **Accept:** `verify-gate.js` exists; `hooks.json` registers it on `SubagentStop` matcher-less; a
  passing/failing verify set writes the right verdict; a non-impl subagent writes no verify verdict; an
  **absent/unrecognized `agent_type` writes an `agent:"unknown"` record**; no deny/block is ever
  emitted; malformed/absent-config paths are fail-silent; Step 1's reds are green; **the live-verified
  `nexus:developer` `agent_type` + the matcher-less form are recorded in implementation.md AND pinned
  by the Step-6 platform-contract CONTRACT entry (HIGH-1).**
- **Confidence:** **medium** — plumbing is high-confidence (always-on hook precedents), but the live
  `SubagentStop` developer-role `agent_type` string is the false-green risk; the mandatory probe +
  the unknown-agent fallback + the CONTRACT tripwire bound it. Not `high` until the live-verify lands.
- **Satisfies:** AC-1.1, AC-1.2, AC-1.5.

### Step 3 — Verify-command config + detection fallback
**Files (create):** the `.claude/verify.json` **schema** is documented (Step 7) and **consumed** by
Step 2's resolver; commit this repo's own `.claude/verify.json` as the dogfood instance. **Modify:**
none beyond what Step 2 reads.

Define the resolver (a small function in `verify-gate.js`, or a sibling `verify-config.js` it
requires): read `.claude/verify.json` → `{ commands: [ { run: string, blocking: bool } ] }`; on
absence, **detection fallback** — detect the project's runner (this repo: `node --test` + a
`selfcheck.mjs` present) and synthesize a default set. `blocking:true` commands gate the verdict;
`blocking:false` are recorded but don't flip a pass to fail.

**This repo's `.claude/verify.json` (D1, AC-1.4):**
```json
{ "commands": [
  { "run": "node --test tests/lint/*.test.mjs tests/unit/*.test.mjs", "blocking": true },
  { "run": "node scripts/selfcheck.mjs", "blocking": true }
] }
```

- **Skill:** None (config convention). **TDD:** yes — covered by Step 1's config-resolution red.
- **Key constraints:** explicit config wins; detection is fallback-only; `blocking` flag honored;
  absent/malformed config never crashes the hook (fail-silent, default to detection or an empty set).
- **Dependency:** pairs with Step 2.
- **Accept:** the resolver returns the explicit set when `.claude/verify.json` is present and the
  detection set when absent; this repo's `.claude/verify.json` is committed and matches AC-1.4; the
  config-resolution red is green.
- **Confidence:** medium-high (D1 confidence).
- **Satisfies:** AC-1.3, AC-1.4.

### Step 4 — Team-lead consumes the verdict; unattended fails closed → queue
**File (modify):** `plugins/nexus/agents/team-lead.md` — the **PRIMARY edit target is the Unattended
Mode § at `:391`** (the *actually-live* unattended failure rules: "Phase failure: retry once, then skip
the step (record it). 3-cycle exhaustion / escalation: … record the outcome and fail the run") — this
is where the defer-to-queue evolution **must** land or it silently doesn't apply where it matters most
(MED-3). The **Enforcing the Rules** § (`:170-189`) gets the verdict-consumption fork; the **attended**
failure-menu trailers at `:319`/`:330` are updated **only for consistency**, secondary to `:391`.

Wire the **verdict-consumption fork** (AC-1.2) into Enforcing the Rules, **additive to** the existing
Verdict Validation + fabrication void-and-rerun matrix (don't replace them):
- At each verify point the team-lead reads `.claude/audit/verify-verdict.json` for the round (scope by
  the `.pipeline-state` token, as it already does for `violations.log`).
- **Attended:** the verdict **informs** — surface it; the human/normal review decides. It does not
  auto-block (advisory).
- **Unattended (`[UNATTENDED]`):** the verdict **is** the decision. A `blocking_failed` verify-fail
  on the implementation phase → **defer the item to the review queue** (Step 5), do not advance.
- **Fail-defer is scoped to the implementation-phase verify checkpoint, NOT every developer
  `SubagentStop` (Q-D1).** The hook runs verify (advisory) on *any* developer-role stop — including a
  Step-1 **red-test-authoring** stop, where a *failing* verify set is the correct expected state (reds
  must fail). The token alone does **not** separate these: red-authoring and implementation both carry
  `developer:implement`. So the team-lead consumes a `blocking_failed` verdict as a defer trigger
  **only at its own implementation-phase verify checkpoint** — after the developer hands back
  `implementation.md` as complete (the point where a failing verify set genuinely means broken code) —
  **not** on an intermediate `developer:implement` `SubagentStop` mid-turn. A `verdict:"fail"` recorded
  on a red-authoring completion is a true-green advisory artifact the team-lead does not act on. (This
  is fully inside the existing `.pipeline-state` + checkpoint-consumption mechanism — no design change,
  no second mode signal.)

Evolve the **Unattended Mode § bullets at `:391`** (AC-3.1/3.4) — this is the primary edit (MED-3); the
`:319`/`:330` attended trailers are updated only to stay consistent, and ADR-32 names this the
`:319`/`:330`-spirit evolution:
- **Phase failure / verify-fail:** the live `:391` rule "retry once, then skip the step (record it)" →
  **retry once, then defer the item to the review queue** with the failing gate + audit pointer +
  resume instruction. Never a silent skip.
- **3-cycle exhaustion / escalation:** the live `:391` rule "record the outcome and fail the run" →
  **defer to the review queue** (record + enqueue for human resume), never escalate to a human live.
- **Per-run token cap (AC-3.3, D3):** at each checkpoint the team-lead reads the running token total
  from `.claude/audit/token-usage.jsonl` **when present** (ADR-11 `token_audit` on); if it exceeds the
  configured cap → **abort-to-queue**. **State the dependency inline:** when `token_audit` is off the
  cap is **inert** (documented), since v1 adds no standalone counter. In **attended** the cap is
  advisory/inert (the human is the governor).
- **Loud inertness (MED-2):** when `[UNATTENDED]` is active **and** a token cap is configured **but**
  `.claude/audit/token-usage.jsonl` is absent (`token_audit` off), the team-lead writes a **one-line
  warning at launch** into the run's audit / `communication-log.md` Runtime section — e.g. "token cap
  configured but token_audit off — cap inert this run." Cheap; converts a silent gap into a visible
  one. (The cap's fail-direction is safe regardless — no cap → run proceeds → the verify/3-cycle
  defers still fire; the cap is a *secondary* backstop, per the critic's MED-2 adjudication.)
- **`Force-accept` (`:327`) stays attended-only and unreachable under `[UNATTENDED]`** (AC-3.4) — make
  this explicit in the Unattended Mode list (worst case is "deferred to the queue").

- **Skill:** None (agent definition). **TDD:** no (behavioral agent text; the hook/queue mechanics are
  tested in Steps 1/6).
- **Key constraints:** the fork is **consumption-only** — one verify execution path (the hook), the
  team-lead only *reads*; additive to Verdict Validation + least-intervention (ADR-15), not a
  replacement; the **fail-defer is consumed only at the implementation-phase verify checkpoint** (not on
  every developer `SubagentStop` — a red-authoring fail is a true-green, Q-D1); unattended never
  force-accepts/ships; the token-cap dependency on `token_audit` is stated, not hidden.
- **Dependency:** Steps 2 (verdict file), 5 (queue artifact shape).
- **Accept:** Enforcing-the-Rules carries the attended-informs / unattended-decides fork keyed to the
  verdict file scoped by the `.pipeline-state` token; **the fail-defer is scoped to the
  implementation-phase verify checkpoint (developer handed back `implementation.md`), NOT every
  developer `SubagentStop` — a Step-1 red-authoring fail is an advisory true-green the team-lead does
  not act on (Q-D1)**; **the Unattended Mode § at `:391` is edited (the primary target — MED-3)** so its
  phase-failure + 3-cycle rules defer-to-queue, with `:319`/`:330` updated only for consistency; the
  token cap reads `token-usage.jsonl`-when-present with the inert-when-off caveat stated **and the
  launch-time "cap inert this run" warning is emitted when configured-but-off under `[UNATTENDED]`
  (MED-2)**; `Force-accept` is explicitly attended-only/unattended-unreachable.
- **Confidence:** medium — wording must reconcile with the existing Verdict Validation + least-
  intervention + "never wedge an unattended run" rules; the fork is additive to those.
- **Satisfies:** AC-1.2, AC-3.1, AC-3.3, AC-3.4.

### Step 5 — The review-queue convention (structured, resumable)
**Files (create):** `.claude/review-queue/index.md` is created **at runtime by the team-lead** (not
committed empty); this step authors the **convention** — define it where the team-lead/agents read it.
Document it in `agents-workflow.md` (Step 7) and reference it from `team-lead.md` (Step 4). If a
machine-checkable shape is warranted, add a tiny schema note; no script writes the queue (the
team-lead does, as it owns run state).

**Per-item artifact** (`.claude/review-queue/{slug}.md`): `slug`, **failing gate/reason** (verify-fail
/ 3-cycle-cap / unanswered-question / token-cap), **audit-trail pointer** (the `verify-verdict.json` +
`communication-log.md` paths), and the **resume instruction**. **Resume reuses ADR-19 state (AC-3.2,
CR-5):** the instruction points at `communication-log.md` (header `Step`/`Cycle`) + `.pipeline-state`
— `summary.md`⇒done / log⇒resume-from-step — so re-entry continues at the **failing phase** and does
**not** re-run completed work (a cold restart is wrong). `index.md` lists open items.

- **Skill:** None (convention doc). **TDD:** no (the artifact *shape* is asserted in Step 1's
  queue-shape red as a fixture; the team-lead writes it at runtime).
- **Key constraints:** one file per deferred item + an index; every item carries slug + reason + audit
  pointer + ADR-19 resume instruction; resume continues at the failing phase, never cold-restarts;
  the queue lives under `.claude/` (run-state-adjacent), not in `docs/specs/`.
- **Dependency:** none (pairs with Step 4; referenced by it).
- **Accept:** the review-queue convention is defined (per-item fields + index + ADR-19 resume wiring);
  `team-lead.md` (Step 4) and `agents-workflow.md` (Step 7) reference it consistently; no dangling
  reference to a queue path nothing writes.
- **Confidence:** medium (D2 confidence).
- **Satisfies:** AC-3.2.

### Step 6 — The golden regression test (attended-unchanged) + the platform-contract tripwire
**Files (create):** `tests/unit/attended-unchanged.golden.test.mjs` (or extend Step 1's file — keep the
golden assertions in one clearly-named place). **Modify:** `tests/lint/platform-contract.test.mjs` (add
the `SubagentStop` CONTRACT entry — HIGH-1). Capture a **pre-v1 snapshot** of the existing gates'
decisions and assert byte-identity.

Assert, with the flag **off** (no `[UNATTENDED]`), the offline observables AC-0.3 names:
- **(a)** the new `verify-gate.js` produces **zero deny/block output** and **no review-queue artifact**
  for a `SubagentStop` event (the advisory verdict record in `.claude/audit/` is allowed — that is the
  always-on behavior of AC-1.5/AC-1.2, per the binding interpretation in Context; assert *no
  `.claude/review-queue/` write* and *no `decision`/`deny` in stdout*, **not** "writes nothing").
- **(b)** `pipeline-gate.js` and `guard.js` produce **byte-identical decisions** to a captured pre-v1
  snapshot for a fixed fixture set (reuse representative fixtures from `pipeline-gate.test.mjs` /
  `guard.test.mjs` — analyze-phase plan/source deny, implement-phase allow, review-verdict integrity,
  a guard deny). **This assertion is a *documentation* pin, not behavioral (MED-1):** neither gate is
  in any step's modify list, so it can never fail from anything v1 does — it records AC-0.3b's intent.
  Keep it, but don't over-invest; the assertion that actually *bites* is (b').
- **(b') the assertion that bites (MED-1):** with the new `SubagentStop` hook **present in
  `hooks.json`**, the **existing PreToolUse/PostToolUse hooks still fire and decide identically** — i.e.
  the new entry didn't corrupt sibling registration or break `hooks.json` parse. Drive `pipeline-gate.js`
  + `guard.js` through `runHook` against the *current* `hooks.json` and assert their decisions are
  unchanged. This is the real attended-regression catch (a malformed new entry breaking the whole file,
  or the new hook emitting on a sibling's event).
- **(c)** the gate's **advisory run does not alter exit codes or block** — a `SubagentStop` verify run
  (pass or fail) exits 0 and emits no deny.

**Platform-contract CONTRACT entry (HIGH-1) — the permanent tripwire for Step 2's highest-risk item.**
Add one CONTRACT entry to `tests/lint/platform-contract.test.mjs`, mirroring the `Agent|Task` /
`subagent_type` entry at `:36-43`, pinning the three strings the gate hinges on:
- `verify-gate.js` references the **`SubagentStop`** event name;
- `verify-gate.js` reads the role from **`agent_type`** (the stop-payload field);
- `hooks.json` wires `verify-gate.js` under a **matcher-less `SubagentStop`** registration (assert the
  `SubagentStop` key exists and its hook entry carries **no `matcher`** — the "absent matcher = `*`"
  contract `wiring.test.mjs` documents).

The Step-2 live-verify catches drift *once, at authoring time*; this CONTRACT entry catches it *forever
after* — exactly the false-green class `platform-contract.test.mjs` exists to tripwire. (Pin the event
name + field, not the literal developer-role string — that string is pinned by recording it in
implementation.md from the mandatory probe; the CONTRACT pins the *platform surface* the gate reads.)

**This test must exist and pass before any other v1 code merges** (CR-3) — it is the executable form of
the don't-break-attended constraint. Order note: Step 1 lands the verify-gate reds; this step lands the
golden **green** once Steps 2–5 exist, but its *assertions* are authored against the pre-v1 baseline so
a regression in 2–5 fails it. The CONTRACT entry lands with Step 2's hook (it pins Step 2's strings).

- **Skill:** None (golden test + lint tripwire). **TDD:** yes.
- **Key constraints:** offline only (stdout / exit-code / written-artifact assertions, no live model);
  the (b) byte-identity is a documentation pin and (b') sibling-hooks-still-fire is the behavioral
  catch; the advisory-verdict-allowed vs queue-artifact-forbidden distinction is asserted exactly per
  the binding interpretation; the `SubagentStop` CONTRACT entry pins the event name + `agent_type` field
  + matcher-less registration; runs in the existing `node:test` gate.
- **Dependency:** Steps 2–5 (the surfaces it pins) — but authored against the pre-v1 snapshot.
- **Accept:** the golden test asserts (a)/(b)/(b')/(c); it is green; flipping any existing-gate decision,
  making the hook emit a deny/queue-write flag-off, or a malformed new `hooks.json` entry breaking
  sibling registration turns it red; **the `tests/lint/platform-contract.test.mjs` `SubagentStop`
  CONTRACT entry (event name + `agent_type` field + matcher-less registration) exists and passes
  (HIGH-1).** Full suite green under the canonical invocation.
- **Confidence:** high — `pipeline-gate.test.mjs` (snapshot-and-assert) and `platform-contract.test.mjs:36-43`
  (the CONTRACT-entry shape) are direct precedents.
- **Satisfies:** AC-0.1, AC-0.2, AC-0.3, AC-1.1 (the `SubagentStop` platform pin).

### Step 7 — Document the gate, config, and queue
**File (modify):** `plugins/nexus/rules/agents-workflow.md`.

Document `.claude/verify.json` (shape + detection fallback), the `SubagentStop` verify gate (always-on
advisory, writes `.claude/audit/verify-verdict.json`, never blocks — ADR-31), and the
`.claude/review-queue/` convention (per-item + index + ADR-19 resume), alongside the existing audit
substrate (`violations.log`, `skill-invocations.log`). Name the **additive-mode** principle once
(ADR-30): new behavior branches on `[UNATTENDED]`; attended is byte-unchanged (golden-pinned).

- **Skill:** None (rules doc). **TDD:** no.
- **Dependency:** Steps 2–6.
- **Accept:** `agents-workflow.md` describes the gate, verify.json, and review-queue; no dangling
  reference to a path no code writes; the additive-mode principle is stated.
- **Confidence:** high.
- **Satisfies:** AC-1.3 (config doc), AC-3.2 (queue doc).

### Step 8 — ADR cross-check (30/31/32 already extracted)
**File (verify, edit only if drift):** `docs/architecture/README.md` — ADR-30/31/32 were **extracted
when the spec reached Ready** (this session). This step **confirms the shipped behavior matches** the
ADR text and corrects any drift introduced by Steps 2–7 (e.g. if the verdict path or queue location
changed during implementation). **Do not silently rewrite an accepted ADR** — if behavior diverged from
the ADR, flag it in the handback for the owner, don't quietly amend.

- **Skill:** None (ADR cross-check). **TDD:** no.
- **Dependency:** Steps 2–7 (the behavior the ADRs describe).
- **Accept:** ADR-30/31/32 match the shipped paths/behavior (verdict file, queue dir, never-block);
  any divergence is flagged, not silently amended.
- **Confidence:** high.
- **Satisfies:** ADR-30, ADR-31, ADR-32 (cross-check).

### Step 9 — Release (MINOR) + regenerate twins
**Files:** `plugins/nexus/.claude-plugin/plugin.json` + `CHANGELOG.md` (via `bump-plugin.mjs --minor`);
regenerated `plugins/nexus/commands/*.md` (`gen-commands.mjs nexus` — `team-lead.md` changed); the
`omni` twin (`gen-omni.mjs`).

New capability (the verify gate + fail-closed queue) → **MINOR** (owner-set; the tool proposes PATCH).
Run the bump in the **same commit** as the changes; regenerate commands after the agent-doc edit;
regenerate the `omni`/`omni-dotnet` twin so its versions ride along.

- **Skill:** Follow `release-plugin` (ADR-9 flow). **TDD:** no.
- **Dependency:** Steps 1–8.
- **Accept:** `plugin.json` MINOR-bumped (1.11.0 → 1.12.0) + CHANGELOG entry; `gen-commands.mjs nexus`
  re-run with no stray diff (team-lead changed); **`gen-omni.mjs` re-run and the `omni` twin's
  `hooks.json` carries the new `SubagentStop` verify-gate entry** (the new hook is the at-risk artifact
  — assert the twin round-trips it); full suite green under `node --test tests/lint/*.test.mjs
  tests/unit/*.test.mjs` + `node scripts/selfcheck.mjs`; one commit carries the change + bump;
  `plugin-release-check.yml` passes.
- **Confidence:** high.
- **Satisfies:** (release mechanics — ADR-9.)

---

## Cross-Service / Cross-Repo Changes

- **`omni`/`omni-dotnet` twin (Step 9):** generated — the new `SubagentStop` hook must round-trip into
  the twin's `hooks.json`. No hand edits.
- **Consumer install (ops, not code):** version-keyed cache — a consumer picks up the gate only after
  `/plugin update` to 1.12.0. A stale install gets none of it.

## Testing Strategy

Tests-first (Step 1), golden-test-pinned (Step 6 — the AC-0.3 hard-constraint gate that must pass
before other v1 code merges). JS units live in repo-root `tests/unit/` under the canonical CI gate
`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`. **Highest-risk unit:** the developer-role
`agent_type` on `SubagentStop` — Step 2's **mandatory blocking** live-verify (a wrong key is silently
false-green), now triple-guarded: the mandatory probe (authoring-time), the `agent:"unknown"` fallback
(runtime), and the `platform-contract.test.mjs` CONTRACT entry (the permanent drift tripwire).
**Live validation (owner, last):** one real `claude -p [UNATTENDED]` pipeline run on the updated
install that (a) passes verify → advances, and (b) fails verify → **defers to `.claude/review-queue/`**
with a resumable item; then resume the item and confirm it continues at the failing phase (ADR-19), not
a cold restart. A clean happy-path run alone proves nothing about the fail-closed path.

## KB Impact

None — no `docs/kb/` in this repo. The autonomy model is captured in `agents-workflow.md` (Step 7,
numbered) and ADR-30/31/32 (already extracted; Step 8 cross-checks), not a KB entry.

## Open Questions

None — D1/D2/D3 are settled on their critic-blessed defaults (Context); the CR-1 spike and the owner
scope question are resolved; the AC-0.3a/AC-1.5 tension is resolved by the binding interpretation in
Context (flagged for the critic). The token-cap-inert-when-`token_audit`-off dependency (CR-D3) is
stated, not hidden.

---

## Plan Review

**Review mode:** critic, Mode-2 (plan vs spec), code-grounded — **RAN 2026-06-16, verdict REVISE**
(full record: `docs/specs/adhoc-UnattendedAutonomy/delivery/review-critic-plan.md`; critic agentId
`a0644e8173747674e`, recovered via salvage-transcript after an idle strand). **No CRITICAL, no REJECT
— coverage complete (every AC maps to a step, no orphans either way) and all three architect-flagged
forks adjudicated sound.** The critic stated folding the two HIGHs makes the plan **ACCEPT-ready
without another full pass**. All six findings folded:

| Finding | Sev | Resolution (where it landed) |
|---|---|---|
| **CR(plan)-HIGH-1** — new hook not wired into `platform-contract.test.mjs`, the drift tripwire for exactly this risk | HIGH | **Step 6** now adds a `SubagentStop` CONTRACT entry (event name + `agent_type` field + matcher-less registration), mirroring `:36-43`; **Step 2** Accept requires it. The permanent tripwire behind the authoring-time live-verify. |
| **CR(plan)-HIGH-2** — developer-role `agent_type` never observed live (spike fell back to `general-purpose`); mitigation written as optional | HIGH | **Step 2** live-verify is now **mandatory + blocking** (not "if"), paired with the **unknown-agent fallback**: an absent/unrecognized `agent_type` on `SubagentStop` **writes `agent:"unknown"`**, never a silent skip. **Step 1** adds the unknown-agent red. |
| **CR(plan)-MED-1** — AC-0.3b byte-identity is structurally unfalsifiable (neither gate is modified) | MED | **Step 6** keeps (b) as a stated **documentation pin** and adds **(b') the assertion that bites**: with the new hook present, the existing PreToolUse/PostToolUse hooks still fire+decide identically (sibling registration uncorrupted). |
| **CR(plan)-MED-2** — AC-3.3 cap inert-by-default is silent | MED | **Step 4** emits a launch-time warning under `[UNATTENDED]` when a cap is configured but `token_audit` is off ("cap inert this run"). Critic adjudicated inert-by-default **satisfies AC-3.3** — no owner escalation; the fix is making inertness loud. |
| **CR(plan)-MED-3** — Step 4's edit target imprecise; live unattended rules are at `:391`, not `:319`/`:330` | MED | **Step 4** primary edit target is now explicitly **Unattended Mode § `:391`**; `:319`/`:330` updated only for consistency. Prevents a real miss. |
| **CR(plan)-LOW-1** — `denyReason()` only covers the PreToolUse deny shape | LOW | **Step 1** notes the block-half needs a **raw** `assert.doesNotMatch(stdout, /"decision"\s*:\s*"block"/)` alongside `denyReason()`. |
| **CR(plan)-LOW-2** — `salvage-transcript.js` consumes the same transcript surface (informational) | LOW | **Step 2** cross-references it in implementation.md for the next maintainer. |

**The three architect-flagged forks — critic adjudication (all sustained):**
1. **AC-0.3a interpretation** (advisory verdict always-on; "filesystem no-op" = "no queue artifact + no
   deny", not "writes nothing") — **CONFIRMED, no drift**; ADR-30's Tradeoffs ratify it verbatim.
2. **Step 2 false-green** — real risk, was under-mitigated → became HIGH-1 + HIGH-2 (now folded). The
   matcher-*less* form is correct; the `agent_type`-string half was the exposure, now triple-guarded.
3. **AC-3.3 inert-by-default** — **satisfies AC-3.3, do not escalate** → MED-2 (loud inertness).

**Verdict: ACCEPT — plan approved (2026-06-16).** The two HIGHs are folded (the critic's stated
condition for ACCEPT-without-another-pass), MED-1/2/3 + LOW-1/2 are folded, and the fold was
self-verified internally consistent (every finding traced to its landing step; Skill-Mapping rows 1/2/4/6
updated to match the step bodies). No fix opened a new question, so **no re-critic pass is needed**. The
plan is ready for the developer. The Step-2 mandatory live-verify (the `nexus:developer` `agent_type`
on `SubagentStop`) remains the one item the developer must land before the gate is trusted — it is now
blocking in the step, fallback-guarded, and tripwire-pinned.

**Post-approval precision amendment — Q-D1 (developer Phase-1, plan-owner adjudicated 2026-06-16).**
The developer flagged that `agent_type` is `nexus:developer` for *both* the implementation turn and a
Step-1 red-test-authoring turn, so the advisory gate runs verify (and records `verdict:"fail"`) on a
red-authoring completion where a *failing* set is the correct expected state — a true-green recorded as
a fail. Adjudication: **option (b) — an explicit plan edit was warranted**, with one sharpening of the
developer's proposal. The discriminator is **not** the `developer:implement` token alone (red-authoring
shares it); it is that the team-lead consumes the fail-defer **only at its implementation-phase verify
checkpoint** (developer handed back `implementation.md` complete), never on an intermediate developer
`SubagentStop`. Folded into Step 4's consumption-fork bullet + Key constraints + Accept. Fully inside
the existing `.pipeline-state` + checkpoint-consumption mechanism — **not a design change, no new mode
signal, no scope reversal.** Suite green (177/177) after the edit.
