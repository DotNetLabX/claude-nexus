# nexus plugin feedback — v1.9.1 / 2026-06-14 (Fokus + MineVerifyCoverHarness sweep)

Second learner pass of 2026-06-14. Consolidated against the **live 1.9.1 tree**. This file does
**not** supersede `nexus-1.9.0-2026-06-14.md` — that file holds the applied-item history (P2a/P3/P4/N4/N6
→ shipped 1.9.1) and two still-open items (P2 part b, T4) carried forward below. This file records the
items the **prior pass did not see**.

**What this pass added over 1.9.0:**
- **Fokus swept for the first time.** The 1.9.0 pass covered nexus + sprint-rituals + knowledge-gateway
  but **not** `D:\src\fokus` (48 `lessons.md` + 41 `communication-log.md`). This pass swept it.
- **`adhoc-MineVerifyCoverHarness`** — the newest nexus slug, committed *after* the 1.9.1 release, so it
  postdates the 1.9.0 consolidation.
- Re-swept sprint-rituals (13+13) to re-ground; nothing new past what 1.9.0 already captured.

**Scope note:** `reflekt` and `knowledge-gateway` were held out by request ("the 2 other repos").
knowledge-gateway was already in the 1.9.0 sweep; reflekt has 5 lessons not yet swept (future pass).

**Status legend:** `[PENDING APPROVAL]` = classified, awaiting owner go before any source edit ·
`[TRACKED]` = below the 2-feature bar / self-scoped, recorded for corroboration · `[CONFIRMED-SHIPPED]`
= surfaced by a corpus but already enforced on the live tree — **do not re-surface**.

> **Dev-repo note (ADR-1).** This is the plugin source repo, so an approved item is a fix made **here**
> (agent/rule/skill edit + a `release-plugin` bump in the same commit), routed to a developer/solo pass
> and Mode-3 critic-reviewed — not mailed to a downstream maintainer. Cross-repo evidence (Fokus, SR)
> only sources the recurrence; the fix lands here.

---

## Carried open from `nexus-1.9.0` (still pending — not re-litigated here)

- **P2 part (b)** — give the critic a single allowed write to `review-critic.md` (touches `critic.md`
  `disallowedTools`). Parked as an **architect decision**. This pass adds cross-repo weight: the
  message-only critic strands/never-emits across **nexus ×4 + sprint-rituals ×5** with real detail loss.
  Recommend the architect revisit; learner does **not** promote (owner's baseline holds critic = message-only).
- **T4** — make `pipeline-gate.js` two-repo / plugin-tree-`.md` aware. **Owner-approved build**, pending a
  dev pass. Candidate **#4 below overlaps this** (token lifecycle) — fold or ship alongside.

---

## P5 — Standard+Codex earns its keep on multi-file / cross-file-coherence passes  `[PENDING APPROVAL]`

- **Recurrence:** **2 features** — `adhoc-BuildFlowFormalization` (TL lesson, N2 in 1.9.0 Tracked at 1) +
  `adhoc-MineVerifyCoverHarness` (comm-log #21-22: Codex caught a sequestration/coherence violation the
  single-pass reviewer missed). Crosses the bar at the 2nd occurrence as N2 predicted.
- **Target:** `plugins/nexus/agents/team-lead.md:215` — the "When to recommend Standard+Codex" list
  (currently: complex analytics, full-stack client/server agreement, filtering/pagination).
- **Action (prose):** add the case — multi-file **documentation / process passes with cross-file
  coherence invariants** (a per-file reviewer structurally can't see contradictions across files).
- **Channel:** plugin-bound · **Locus:** prose · **Risk:** low.

## P6 — Re-sync the Skill Mapping table after any step fold/add/renumber  `[PENDING APPROVAL]`

- **Recurrence:** **Fokus ×4** — F13-BugRatio (8 rows / 10 steps), F14-EpicProgress (11 rows / 10 steps
  after a step fold), F26-SprintTestCoverage, F23-TransitionBasedSprintScope (post-critic-fold). Caught by
  critic/architect on re-review every time → pure rework; promotion shifts the catch earlier and cheaper.
- **Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` — the Skill Mapping section
  (`:36-49`) and/or Anti-patterns (`:97-99`).
- **Action:** prose rule — "after any step fold/add/renumber, re-sync the Skill Mapping table; row count
  must equal step count and step numbers must match." (Locus could escalate to a plan-lint if it recurs.)
- **Channel:** plugin-bound · **Locus:** prose (deterministic plan-lint if it recurs) · **Risk:** low.

## P7 — Plan-named identifiers are binding; a rename is a documented deviation  `[PENDING APPROVAL]`

- **Recurrence:** **Fokus ×6** — F6-WorkflowAutoDetection (store action renamed), F15-TeamManagement
  (sidebar position), F26-SprintTestCoverage (TS field vs JSON serialization), F28-PerDeveloperStoryQuality
  (DTO naming), F29-QaWorkloadThroughput (delta naming), F16-BugCostDisruption (verbatim tooltip text).
- **Caveat (why not higher priority):** the general deviation rule **already catches it** — `developer.md:115`
  ("every deviation documented") and `reviewer.md:25` ("does the code match the plan? Flag deviations").
  The gap is that it's caught *late* (reviewer), costing cycles. Promotion makes "plan-named
  method/DTO/store-action names are binding" **explicit up front** to cut those cycles.
- **Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (plan-authoring) +
  `plugins/nexus/agents/developer.md:134` (`## Anti-patterns`).
- **Channel:** plugin-bound · **Locus:** prose · **Risk:** low (reinforces an existing rule).

## P8 — Clear `.pipeline-state` on SessionStart (stale token leaks across sessions)  `[PENDING APPROVAL]`

- **Recurrence:** **nexus ×1 + sprint-rituals ×3** — nexus `adhoc-PipelineHardening` (L-A6/L-A7: flat file,
  no session id, no expiry); SR `adhoc-Pass3c-C-DevEpicAnalytics` (N2 "clear at shutdown", N3 stale
  `.current-agent`), `adhoc-Pass3c-B-DeliveryMetrics` (M4 token lifecycle).
- **Verified gap:** `plugins/nexus/hooks/scripts/restore-agent.js` handles **only** persona state
  (`.personas.json` / `.current-agent`); `.pipeline-state` is **not** cleared on SessionStart/clear.
- **Action:** mirror the persona lifecycle — clear `.pipeline-state` on `SessionStart` source `clear`
  (and/or TTL-prune on `startup`).
- **Overlap:** **T4** is the approved gate/token-lifecycle build. Recommend **folding P8 into T4** so the
  SessionStart self-heal and the gate-hardening ship as one coherent change (owner may prefer a standalone
  small patch — open question on the routing).
- **Channel:** plugin-bound · **Locus:** deterministic (hook) · **Risk:** low.

---

## Tracked — below the 2-feature bar or self-scoped

- **MVCH workflow-authoring trio** (`adhoc-MineVerifyCoverHarness`, 1 feature, source-scoped to a future
  "harness-authoring" skill = Increment 4): (a) `node --check` validates JS syntax only, **not** Workflow
  runtime constraints (`export const meta` first; `description` a pure literal) — a "runnable" claim needs
  a live launch; (b) plan steps needing a live Workflow launch must be labeled **`Owner: operator`** (a
  developer subagent lacks the `Workflow` tool); (c) never record **golden answer-key text** verbatim in
  `implementation.md` — record method + consensus + a path to the sequestered file. Promote with Inc 4.
- **`node --test` bare-dir form regressed on Node ≥22** (`adhoc-VwhSelfcheckAndPrinciple` +
  `adhoc-MineVerifyCoverHarness` = 2 feat, but **project-bound**, not plugin source). Tooling already uses
  the glob form (`selfcheck.mjs`); at most a one-line CLAUDE.md / `tests/README.md` note. Routed to dev-repo.
- **`improve-flow` routes promotions to `## Anti-patterns`** — valid for `developer.md:134` and
  `reviewer.md:74` (both have the section) but **architect.md has none**, so a recurring *architect* mistake
  has no target section. Fokus, 1 feature. Minor — add `## Anti-patterns` to architect.md OR note the
  exception in the skill, when it recurs.
- **Plans under-note skill prerequisites** (Fokus: `create-service` needs a pre-existing CLAUDE.md). The
  *skill* already hard-errors cleanly (`create-service/SKILL.md:12-16`); the gap is plan-craft. With-judgment.
- **auto-approve step-count pressure** (Fokus ×3) and **architect-idle-no-ack** (Fokus ×3) — with-judgment;
  the gate/rule exists, these are behavior/compliance, not missing rules.
- **Positive patterns (no promotion):** critic-value-confirmed (Fokus ×6 — critic consistently catches
  real bugs self-review misses) and open-questions-with-inline-recommendation (Fokus ×3 — avoids
  questions.md round-trips). Validations of current design, recorded as evidence.

---

## Confirmed shipped on the live 1.9.1 tree — DO NOT re-surface

Each was raised by one or more corpora this pass but is already enforced; re-grounded against source:

- **Gate false-positive on `CRITICAL`/`HIGH`/`Confidence:` tokens** (nexus ×5, SR ×3) — RESOLVED 1.8.3,
  `pipeline-gate.js:129-130`.
- **Salvage defeated by SubagentStop closer-storm / fenced closer** (cross-repo) — RESOLVED 1.8.1 +
  strip-all-closers walk-back in `salvage-transcript.js`.
- **0-byte `output_file` ≠ hang; never poll a sibling's output file** (nexus ×4) — APPLIED P3 1.9.1.
- **Model override does not survive a `SendMessage` resume** (nexus ×4) — shipped `team-lead.md:91,202`.
- **Resume-first / re-spawn only when the task is too big** (Fokus ×6, "fresh-spawn-vs-resume") — shipped
  `team-lead.md:84,307-308`. Fokus occurrences are non-compliance, not a missing rule.
- **Communication-log maintained in real-time** (Fokus ×2) — shipped `team-lead.md:354`. Fokus
  backfill cases are non-compliance.
- **Stale task-notification labels** (SR ×3) — documented as a known caveat `team-lead.md:89`.
- **`persistence-patterns` `HasDefaultValueSql` needs the Relational package** (Fokus, build-break) —
  ALREADY FIXED `persistence-patterns/SKILL.md:88`.
- **`persistence-patterns` `ref`-in-async cache helpers won't compile** (Fokus, build-break) — appears
  fixed: no `ref List`/`ref T` in the current skill. (Verify on apply; the Fokus lesson predates the fix.)
- **`create-service` hard-errors without CLAUDE.md** (Fokus ×2) — skill already errors cleanly `:12-16`.
- **Architect honest-self-review + escalate when critic spawn unavailable** (SR ×4) — applied to
  `architect.md`. **The architect's self-review-vs-critic review-mode question is load-bearing — keep it.**
- **No-self-advance / ADR-21 boundary** (SR ×8+3, nexus ×4) — detection layer shipped 1.4.0; runtime
  enforcement is the **T4 owner-approved build** (above), not a re-promotion.

---

## Approval status

**Nothing in this file has been applied.** P5–P8 are `[PENDING APPROVAL]`. On owner go, each routes to a
developer/solo pass (edit + `release-plugin` bump) and a Mode-3 promotion-review critic before close.
Source `lessons.md` items are **not yet tagged** with these dispositions — tag on approval (or treat this
ledger as the canonical record, given Fokus's 48 files).
