# VWH steal-list — harness hardening tickets

Concrete tickets to port proven *engineering* from VWH into our Mine→Verify→Cover harness, per the
comparison (`docs/research/2026-06-23-vwh-vs-mine-verify-cover.md`). The rule **engine** stays ours; this is
about adopting VWH's **guardrails**. Each ticket cites its VWH source so it can be grounded before building.

| # | Ticket | Effort | Status |
|---|---|---|---|
| T1 | Real-report gate read (anti-fake-green) | — | **DONE `4bfaa25`** |
| T2 | Port `flutter.yaml`'s mutation-fallback into Flutter Phase 0 | S | open |
| T3 | Import the gaming threat model as our reward-hacking defense map | S–M | open |
| T4 | Sequestered-tier tripwire for the golden set | S | open |
| T5 | Negative-test pattern across the whole gate battery | S | open |
| T6 | Lift `dotnet-xunit.yaml` command/glob shapes at adapter extraction | S | deferred (adapter) |

---

## T1 — Real-report gate read · **DONE (2026-06-23, `4bfaa25`)**
The `target_mutated` gate + `--mutate` CLI pin adopt VWH `measure.py`'s "score the *real* per-file report"
posture instead of trusting a runner-fabricated entry. The fake-green that motivated it is now a regression
fixture. *Source: `harness/flavors/coverage/measure.py`, `mutation.py`.* Recorded for provenance — no further
work.

## T2 — Port `flutter.yaml`'s mutation-fallback into Flutter Phase 0
**What:** VWH already ships a Flutter toolchain config declaring the *degraded-honesty* mode for Dart —
line-only coverage, **no mutation tool**, an assertion-density floor + raised skeptic cadence as the fallback.
Lift its `capability_notes` + the `prd.md §3.7` fallback into our `journey-and-flutter-plan.md` Phase 0 so we
don't rediscover it.
**Why:** Dart has no maintained mutation tool — the gate's premise weakens; VWH already designed the answer.
**Source:** `harness/flavors/coverage/toolchains/flutter.yaml`, `coverage/prd.md §3.7`. **Effort:** S.

## T3 — Import the gaming threat model as a reward-hacking defense map
**What:** VWH's `coverage/prd.md §3` (7 attacks) + `cookbook.md §TRAPS` (13 rows) is an agent-gaming catalog
written by people who watched it happen. Produce a defense-map: each attack → the gate or prompt rail that
defends it; flag gaps. (We already cover several: `suite_green`, `no_flaky`, `char_pin`, `no_new_skips`, and
now `target_mutated` — today's fake-green was the "score the wrong thing" attack class.)
**Why:** cheapest red-team we'll get; turns a prose threat list into checkable coverage.
**Source:** `coverage/prd.md §3`, `cookbook.md §TRAPS`. **Effort:** S–M (a map doc + any gate gaps it exposes).

## T4 — Sequestered-tier tripwire for the golden set
**What:** a cheap mechanical check (CI grep / pre-run assert) that the golden-set path was **never read** by
any harness input — *in addition to* keeping it outside harness-visible dirs. Adopt VWH's firewall *framing*
(tripwire + placement, not trust); do **not** inherit the audit-hook enforcement (same-process, can't bind a
shell-capable agent).
**Why:** our clean-room is prompt-only; a mechanical tripwire is the cheap, honest upgrade.
**Source:** `harness/kernel/firewall.py` (framing only). **Effort:** S.

## T5 — Negative-test pattern across the whole gate battery
**What:** VWH pairs each check with a *negative* test — build a broken fixture, inject exactly one defect,
assert the **right** gate fails (and only that one). We have one such test (the fake-green fixture); extend the
pattern to every gate in `cover-gates.test.mjs` (a suite that's green when it should be red, a flaky pair, a
skip injection, a disallowed prod-diff, a sub-floor kill-rate).
**Why:** a gate you've never watched fail is a gate you don't actually trust.
**Source:** VWH `harness/tests/` negative suite + the `SelfcheckReport` shape. **Effort:** S.

## T6 — Lift `dotnet-xunit.yaml` command/glob shapes at adapter extraction
**What:** when we extract the .NET adapter (at the Flutter step — roadmap), reuse VWH's **live-validated**
command shapes: `dotnet test --collect`, `dotnet stryker --mutate {targets} --reporter json`, and the
cobertura / Stryker-JSON report globs — instead of re-deriving them.
**Why:** these shapes are validated on real .NET; the adapter seam is exactly where they belong.
**Source:** `harness/flavors/coverage/toolchains/dotnet-xunit.yaml`. **Effort:** S (deferred until adapter).

---

## Explicit NON-adopt (kept for the record)
- **Hypothesis DAG / islands / EV ranking / agent calibration** — exploration machinery; our Mine→Verify→Cover
  conveyor is a *fixed* sequence and would no-op or fight it (prior eval, code-grounded §8).
- **Variance / noise model / seed-variance stats** — no noisy scalar metric; mutation runs are deterministic.
- **The Python kernel as host** — a markdown plugin ships markdown, not a kernel; the loop is a Workflow.
