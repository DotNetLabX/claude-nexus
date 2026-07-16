# F6-MineMachineryHardening — close the mine-family enforcement gaps (R1/R2/R3/R5 now; R4 spike-gated)

**Status:** Ready — architect, 2026-07-16; definition review (code-grounded critic) returned NO-GO
(1 CRITICAL, 1 HIGH, 2 MEDIUM, 1 LOW), all findings folded same day, re-verified by the same critic
→ GO (see `## Critic disposition`).
**Source proposal:** `docs/proposals/mine-machinery-hardening-2026-07.md` (ratified 2026-07-16; this
tech-spec is its promotion per ADR-28 — the proposal's Need/Approach/Alternatives are the reasoning
record and are not restated here).
**Source evaluation:** `docs/research/2026-07-15-mine-family-vs-vwh-machinery.md` (§3.2, §4 SM/ET/XS;
§7 correction log including the 2026-07-16 fresh-eyes rows — every factual anchor below was
re-grounded against the live repo on 2026-07-16).
**Plan:** `docs/specs/F6-MineMachineryHardening/delivery/plan.md`
**ADRs:** ADR-60 (capability-contract conformance — extracted at ratification, covers R3). R4's
delivery-vehicle ADR is extracted when the spike reports; none of R1/R2/R5 needs one (two-way-door
plumbing, ADR-25).
**Target surfaces:**
- Shipped (one PATCH bump via `release-plugin`, same commit as the change):
  `plugins/nexus/skills/mine-verify-cover/SKILL.md`,
  `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`.
- Dev-repo (no bump): `harness/loop.workflow.js` + sibling workflow KB-writer stages,
  `harness/README.md`, `scripts/selfcheck.mjs`, `.github/workflows/plugin-release-check.yml`,
  `tests/unit/`.

## Goal

The machinery evaluation found the Cover arm's five enforcement gaps are unwired organs, not
philosophical tradeoffs. Four are cheap and fully understood — this feature lands them. The fifth
(R4, ship the gate battery) has a real open design question and is explicitly **not** in build scope
until its spike answers.

## Work units

### R1 — wire the resume

**What:** a runbook line in `mine-family-core.md`: capture the `runId` a `Workflow` launch returns;
on a kill/hang, relaunch with `Workflow({scriptPath, resumeFromRunId})` instead of from scratch;
state the same-session-only cap. Plus a matching note in `harness/README.md`. No new module — the
organ is tool-supplied and the harness is already resume-safe; the mechanism is proven on these exact
workflows (2026-06-23 run-eval: halt → fix → resume, ~193k tokens saved).
**Accept:** `grep resumeFromRunId` hits both files; the runbook line names capture-at-launch and the
same-session cap.
**Non-gating residual:** a hard *mid-iteration kill* resume is unexercised (06-23 was
halt → edit → resume; the tool contract documents kill-resume). Verify opportunistically on the next
killed run and record the outcome in that run's report.

### R2 — persist the skeptic's excerpt into the registry row

**What:** the cover-arm KB **row serializer** emits the skeptic's re-execution excerpt in the
registry row — **one excerpt per row, never transcripts**; raw dumps stay in the gitignored
`harness/.runs/`. Ground truth (critic-verified 2026-07-16): today the row is built by the pure
function `buildRulesSection` (`harness/loop.workflow.js:245-250`) as `id: statement` only — the
`consensusRules` mapping (line 411) strips the skeptic's `evidence` into a separate
`interpretiveVerdicts` field that never reaches the row, and the Phase-2 prompts only read and
write verbatim. So the excerpt lands by **enriching the serializer and its input mapping**, not by
a prompt line; the plan defines the enriched row shape against the ADR-45 registry format (the
current slim row carries no citations/line ranges either — the proposal's "beside the existing
citations" premise described the ADR-45 registry format, not this serializer's output). In the same
change, update `mine-family-core.md` §Skeptic protocol's scoping note: today it exempts the cover
code-arm (*"not a consumer of this section"*) — state the cover arm's row obligation instead, so
the shipped standard and the arm agree.
**Accept:** `buildRulesSection` (and the mapping feeding it) emits the excerpt; a KB row written by
a run **contains** it — inspect the written artifact, never just the prompt; the core scoping note
names the cover arm's obligation. Tier honesty (proposal Unresolved #4): this buys auditability,
not verification — no tier claim changes anywhere.
**Explicit plan deliverable (multi-homed paths):** enumerate every verify/KB-writer copy — the
preferred delegated path (`harness/mine-verify.workflow.js`, its own `BATCH_VERDICT_SCHEMA` at
lines 122-132), `loop.workflow.js`'s inline MONOLITH_FALLBACK verify (schema at line 388), and the
spec-arm siblings — and apply the excerpt wiring plus any schema hardening to all of them, not just
the fallback.
**Optional hardening the plan may include:** `minLength: 1` on the verify schemas' `evidence` field
(every copy) — today `required` forces only presence; an empty string passes.

### R3 — capability-contract conformance check (ADR-60)

**What:** a deterministic drift gate in the **CI-gated unit suite**: a `tests/unit/*.test.mjs` test —
executed in CI by `plugin-release-check.yml`'s existing `node --test tests/lint tests/unit` step —
reads `mine-verify-cover`'s 5-capability contract (`SKILL.md:343-349`), discovers the adapters on
disk (`plugins/nexus-{dotnet,php,cpp,flutter}/skills/mine-verify-cover-*/SKILL.md`), and asserts
every adapter fills every capability with a **named executor**; drift fails the suite.
`scripts/selfcheck.mjs` gains a mirror entry for local one-command feedback. (Critic-corrected
2026-07-16: CI does **not** invoke selfcheck — the workflow runs the test glob; a selfcheck-only
check would be a local-only gate that never fires on a PR.)
**Accept:** the unit test asserts the four real on-disk adapters conform AND includes an adversarial
fixture (an adapter missing a named executor) proving the check **can fail** — a gate that cannot
fail is no gate (the family's own vacuous-evidence rule); `node scripts/selfcheck.mjs` lists the
mirror with a PASS line.
**Plan-time decision:** the parsing contract for "a named executor" (what constitutes a fill in an
adapter's `## The 5 capabilities` table). Recorded counterexample the contract must handle: in 3 of
4 adapters the **Evidence indexer** capability is legitimately filled with prose-only mechanics
("the miner reads the target source file directly" — .NET/Flutter/PHP; only C++ names a tool). A
literal named-tool check false-positives on these correct fills; a bare non-empty-cell check is
vacuous. The `mine-verify-flows` sabotage-gate incident is the reference failure class.

### R5 — disclose the tier in the shipped text

**What:** one sentence in `mine-verify-cover/SKILL.md` near the clean-room/miner text: clean-room is
prompt-enforced; the mechanical seal is pending (the next-wave P3 spike owns it —
`mine-family-next-wave-2026-07.md`).
**Accept:** grep for the disclosure phrase (final wording at plan time, e.g. "prompt-enforced") in
the shipped `SKILL.md`.

## R4 — ship the gates (spike-gated; NOT in build scope)

The spike question: which vehicle carries `cover-gates.mjs` to consuming projects — an ADR-5
read-index extension, an ADR-52-style script-synced copy, or verbatim-block transcription in the
skill's reference (plus the mechanical half: de-hardcode `RUNS_DIR` and the other dev-repo absolutes,
present in 9 of 10 drivers). Build starts only on the spike's verdict and its extracted ADR. The open
questions live in the proposal's Unresolved #2/#3.

## Out of scope

Carried from the proposal: making clean-room mechanical (blocked upstream; owned by the next-wave
spike), VWH-shaped organs the one-shot topology does not need, and real harnesses for the prose
siblings (deferred behind R4's delivery answer).

## Critic disposition (definition review, code-grounded, 2026-07-16)

First pass: **NO-GO** (1 CRITICAL, 1 HIGH, 2 MEDIUM, 1 LOW). All folded same day; the same critic
re-verified the folded fixes → **GO**.

- **C1 (CRITICAL, folded):** "run by `plugin-release-check.yml`" was false — CI never invokes
  `scripts/selfcheck.mjs` (the workflow runs the `node --test` glob + bump/gen checks). R3's gate
  moved into the CI-gated `tests/unit/` locus (real-adapter assertion + adversarial fixture);
  selfcheck demoted to the local mirror. ADR-60's Decision corrected; the pre-existing README
  §Known-limitations drift that seeded the error corrected; the proposal's Unresolved #5 annotated.
- **H1 (HIGH, folded):** R2's acceptance targeted "the KB-writer prompt" — rows are actually built
  by `buildRulesSection` (`loop.workflow.js:245-250`, `id: statement` only) and the line-411 mapping
  strips `evidence` before it can reach a row. Acceptance retargeted to the serializer + inspection
  of a written row; the "beside existing citations" premise corrected.
- **M1 (folded):** the verify path is multi-homed (delegated `mine-verify.workflow.js` preferred;
  loop's inline verify is the MONOLITH_FALLBACK) — full-copy enumeration is now an explicit plan
  deliverable.
- **M2 (folded):** the Evidence-indexer prose-only counterexample (3 of 4 adapters) recorded in
  R3's parsing-contract decision.
- **L1 (folded):** the member-table input dropped from R3 and ADR-60 (capabilities live in
  `SKILL.md:343-349`; adapters are glob-discovered).
