# Mine→Verify Harness — Increment 1 — Questions

_Phase-1 analysis (developer). The plan is unusually well-specified: every referenced artifact was
verified to exist (spike script, target source, golden set, Workflow harness, test convention, the
ADR-26/27 architecture home). No **blocking** ambiguity — all items below are advisory, each with a
recommendation safe to proceed on. The three plan "Open Questions" (recall-judge form, clean-room
defer, build location) are restated here as A1/A2/A3 so the answers are recorded in one place._

## Q1: Test file location for the recall-scorer unit test (Step 3)
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 3 — Build the recall-scoring helper (TDD)
**File:** `harness/lib/recall-score.test.mjs` **or** `tests/unit/recall-score.test.mjs`

**Context:** The plan offers both locations explicitly. The repo's CI gate and `scripts/selfcheck.mjs`
run tests via the **glob form** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (verified in
`selfcheck.mjs:44` and the architecture doc's "Plugin unit tests — SHIPPED" note; the bare-dir form
regressed on Node ≥22). A test placed under `harness/lib/` is **not** in that default glob, so it would
not run in CI or selfcheck unless the glob is widened. The existing unit tests share
`tests/helpers.mjs` (REPO/FIXTURES/`makeSandbox`), which a `tests/unit/` test can import directly.

**Question:** Place the recall-scorer test at `tests/unit/recall-score.test.mjs` (in the CI glob) or at
`harness/lib/recall-score.test.mjs` (co-located with the helper, outside CI)?

**Recommendation:** `tests/unit/recall-score.test.mjs`. It is auto-covered by the existing CI hard gate
and selfcheck with **zero wiring changes**, matches the repo's established `node:test` + `helpers.mjs`
convention, and keeps the deterministic helper's contract continuously protected. The helper source
itself stays at `harness/lib/recall-score.mjs` per the plan (only the *test* moves into `tests/unit/`).
**Confidence:** high — the plan sanctions this exact path as the first-named option, and the CI-glob
fact is verified in-repo; no trade-off beyond test/source not being directory-siblings.

### Answer (architect)
**Decision:** Confirmed — place the test at `tests/unit/recall-score.test.mjs`; keep the helper source at
`harness/lib/recall-score.mjs` (plan).
**Rationale:** Verified against current state — `selfcheck.mjs:44` runs `node --test tests/lint/*.test.mjs
tests/unit/*.test.mjs` (glob form; bare-dir regressed on Node ≥22) and `tests/unit/` already holds 13
`node:test` suites sharing `tests/helpers.mjs`. A `tests/unit/` test enters the CI hard gate + selfcheck
with zero wiring; a `harness/lib/` one would not. The plan names this path first, so it's a sanctioned
variant, not a deviation. (cite: `scripts/selfcheck.mjs:43-44`; plan Step 3.)

## Q2: How Step 4 reads the golden text (cross-repo), keeping the clean-room intact
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 4 — Validation run + record results
**File:** `harness/lib/recall-score.mjs` (CLI side) + the Step-4 run

**Context:** Plan integrity point: `harness/targets/bugratio.json` stores **golden ids only**
(`GOLD-16/17/18`), never the rule text, so the config is safe to feed the clean-room Mine run. The
golden **text** lives in the *sibling* repo: `D:\src\sprint-rituals\docs\audit\golden-set.md` (verified;
GOLD-16↔spike BR-1, GOLD-17↔spike BR-4, GOLD-18↔spike BR-28..32). That file is the **sequestered answer
key** — `golden-set.md:4` says it must NEVER be an input to any miner/verifier/test-writer agent. For
Step 4 the scorer (orchestrator-side, post-Mine) needs the golden text to build the judge packet. The
Step-3 **unit test** uses *fixtures*, not the real file, so there is no cross-repo dependency in the test.

**Question:** For the Step-4 run, how should the golden text reach the scorer — (a) the operator passes
the sibling-repo path to the scorer CLI at run time (path not committed into nexus), or (b) commit a
copy of the three GOLD rows into the nexus repo?

**Recommendation:** (a) — pass the sibling-repo path to the scorer CLI at Step-4 run time; do **not**
commit golden text into nexus. This preserves the design's three-layer split (method = nexus; instance
KB + golden set = sprint-rituals; `golden-set.md:13-14` forbids moving it into a harness-readable path)
and keeps the answer key out of the clean-room repo entirely. The scorer loads it **orchestrator-side
only**, after Mine, never into the Workflow. I will record the exact path + invocation in
implementation.md as an `OPERATOR ACTION REQUIRED`-style note for reproducibility.
**Confidence:** high — directly enforces `golden-set.md` sequestration + design §3; (b) would copy a
frozen answer key into the wrong repo and risk leakage into a future clean-room run.

### Answer (architect)
**Decision:** Confirmed — (a). The operator passes the sibling-repo golden path to the scorer CLI at
Step-4 run time; do **not** commit golden text into nexus. The scorer loads it orchestrator-side only,
after Mine, never into the Workflow.
**Tightening (record, not a change):** in implementation.md, record the golden path as a *parameter* with
an `OPERATOR ACTION REQUIRED` note (the exact `D:\src\sprint-rituals\docs\audit\golden-set.md` path is
operator-supplied and machine-local, not committed) so the Step-4 run is reproducible without baking the
path into a committed artifact. Confirm `harness/targets/bugratio.json` carries golden **ids only**.
**Rationale:** Enforces the three-layer split (method=nexus; instance KB + golden=sprint-rituals) and
`golden-set.md:4,13-14` (never a miner/verifier input; never moved to a harness-readable path). Verified
the split against design §3 and the proposal's boundary section. (cite: design §3; proposal "three-layer
split"; plan Step 4 / Open Q2.)

## Q3 (= plan Open Question 1): Recall-judge form — semantic LLM judge vs deterministic match-keys
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 3 — recall-scoring helper

**Context:** The recall protocol is fixed by `golden-set.md:54` — "a discovery counts if the extracted
rule matches the golden rule's **substance** (same formula/threshold/edge case), **regardless of
wording**." That is inherently semantic. The plan's design already isolates the judgment: the *pairing*
is deterministic (pure fn, unit-tested), and only the *match verdict* is a scoped judge call (golden +
consensus inline, kept out of the mining run). So the helper is deterministic either way; the only
question is whether the verdict is produced by an LLM judge or by hand-authored match-keys.

**Question:** Confirm the semantic LLM judge (with deterministic pairing) over per-golden match-keys.

**Recommendation:** Semantic judge, exactly as the plan leans. Match-keys are brittle against
wording-independence (the protocol's whole point) and would re-introduce the contamination risk of
encoding the answer into the scorer. The helper stays a pure pairing fn + recall computation from a
**supplied verdict map** (so it is fully unit-testable with a fixture verdict map — no LLM in the test);
the judge call is a thin orchestrator-side step at Step 4. The plan permits prototyping both — I will
build the judge path and only fall back to keys if the judge proves unstable on GOLD-16/17/18.
**Confidence:** high — the protocol text mandates substance-over-wording; the plan, design §3, and the
pilot method all converge on the orchestrator-side semantic judge.

### Answer (architect)
**Decision:** Confirmed — semantic LLM judge with deterministic pairing. Build the judge path; fall back
to match-keys only if the judge proves unstable on GOLD-16/17/18 (the plan permits prototyping both).
**Enforcement obligation (binding for Step 3, my plan rule):** the **helper** stays a pure pairing fn +
recall computation **from a supplied verdict map** — keep the LLM out of the unit test entirely (fixture
verdict map only), so the unit-tested contract is deterministic. The **judge call** is the only
non-deterministic surface and is a thin orchestrator-side step at Step 4; it must be **fed golden +
consensus inline** and kept out of the mining run (no golden text reaches a miner/verifier). Record the
judge prompt + the GOLD-16/17/18 verdicts verbatim in implementation.md so the recall number is auditable
and reproducible — a semantic verdict with no recorded packet is not a verifiable 3/3.
**Rationale:** `golden-set.md:54` mandates substance-over-wording (inherently semantic); match-keys are
brittle against that and re-encode the answer into the scorer (contamination risk). (cite: `golden-set.md:54`;
design §3 orchestrator-scores-only; plan Step 3 / Open Q1.)

## Q4 (= plan Open Question 2): Confirm the clean-room mechanism stays prompt-enforced this increment
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 2 — Author the Mine→batched-Verify Workflow

**Context:** Design §3 and the pilot's "Open for the Pass-4 skill" both schedule the **mechanical** seal
(`disallowedTools` + inline source for miners) for a later pass; the plan explicitly defers it to
Increment 3. This increment enforces the miner clean-room by **prompt** (the spike's miner prompt:
"Read ONLY this one source file… Do NOT read any other file"). Verifiers are already sealed
structurally — they receive the code **slice inline** and read no files (spike: "Do NOT read any file —
judge ONLY against the code slice provided"). So only the miners rely on prompt-enforcement this round.

**Question:** Confirm miners stay prompt-enforced (no `disallowedTools`) for Increment 1.

**Recommendation:** Confirm the defer. It matches design §3, the pilot's explicit Pass-4 deferral, and
the plan's scope line; the verifier seal (the cost-relevant path) is already mechanical via inline
slices. Hardening miners with `disallowedTools` is Increment 3 work and out of scope here.
**Confidence:** high — three sources (design §3, pilot doc, plan scope) agree; ADR-13 notes prompts are
advisory on background subagents, but that is precisely *why* it's logged as a gap for Inc 3, not fixed now.

### Answer (architect)
**Decision:** Confirmed — miners stay **prompt-enforced** (no `disallowedTools`) for Increment 1; the
mechanical seal (`disallowedTools` + inline source for miners) is Increment 3. Verifiers stay sealed
structurally this increment (slice inline, zero file reads) — that is non-negotiable for Inc 1, since it is
both the cost mechanism (design §2) and the load-bearing leakage seal on the expensive path.
**Caveat to carry into implementation.md (not a blocker):** because the miner clean-room is prompt-only
this round, the Step-4 recall/precision number is conditioned on miners having honored the prompt. Record
that conditionality explicitly so the #4 comparison reads the metric correctly, and log the miner-seal as
the **known open gap for Inc 3** (mechanism, not prompt). This matches ADR-13: a prompt is advisory on a
background subagent, which is exactly why the mechanical seal is deferred work, not skipped work.
**Rationale:** design §3 (clean-room as mechanism is the eventual target), pilot Pass-4 deferral, and the
plan's Inc-1 scope all agree; the cost-relevant path (verifiers) is already mechanical. (cite: design §3 /
§2; plan Scope + Open Q2; ADR-13.)

## Q5 (= plan Open Question 3): Confirm build location `harness/` (top-level dev-repo machinery)
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 1 — Scaffold the harness dev-repo home

**Context:** The plan decides `harness/` as a new top-level dir (dev-repo machinery, like `scripts/` /
`tests/` — ships nothing, no version bump). Verified: no `harness/` exists yet; top-level dirs today are
`docs/ plugins/ scripts/ tests/`, so a new `harness/` sibling is consistent. `.gitignore` does not
ignore `harness/`, so its files will be committed (correct — they're durable dev-repo artifacts). The
alternative the plan flags is nesting under `docs/specs/.../delivery/`.

**Question:** Confirm `harness/` at repo root (vs nesting under the spec's delivery folder).

**Recommendation:** Confirm `harness/` at repo root. It is dev-repo machinery with a lifespan beyond
this one spec (it graduates to `plugins/nexus/skills/mine-verify-cover/` at Inc 4 and grows Cover/loop
controller in Inc 2–3), so it belongs alongside `scripts/`/`tests/`, not buried in a single feature's
`delivery/` folder. Ships nothing to users; no version bump (consistent with the plan's no-bump posture
for Inc 1–3).
**Confidence:** high — matches the plan's own decision and the repo's existing top-level structure; the
delivery-folder alternative would misplace a multi-increment durable component.

### Answer (architect)
**Decision:** Confirmed — `harness/` at repo root. It is dev-repo machinery (ships nothing, no version
bump for Inc 1–3) with a lifespan beyond this spec; it belongs alongside `scripts/`/`tests/`, not in a
single feature's `delivery/` folder.
**Rationale:** Verified against current state — `harness/` does not exist yet (glob: no files); top-level
dirs are exactly `docs/ plugins/ scripts/ tests/`, so a `harness/` sibling is consistent; `.gitignore` has
no `harness/` entry, so its files commit (correct — durable dev-repo artifacts). This is the plan's own
decision. Reminder for Step 1: this is a no-bump increment (`release-plugin` is not invoked — nothing under
`plugins/**` changes). (cite: plan "Delivery model" + Versioning §; CLAUDE.md release machinery; plan Step 1
/ Open Q3.)
