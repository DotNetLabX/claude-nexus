# MVC Suite Fidelity (F1 + F3) — Summary

## Status: COMPLETE

## What Was Built
Refined ADR-37's post-floor Minimize stage on two axes from the flutter rerun feedback. **F1 (categorical-KEEP):** a degenerate-input test that constructs an edge (empty / no-match / zero / empty-collection / documented failure-passthrough) *and* asserts the safe/no-op result is now KEPT even when mutation-redundant, because the kill-count confirm is structurally blind to behaviour-coverage loss; plus an activation gate that skips Minimize when the generated suite doesn't materially exceed the distinct mined-rule count. **F3 (fixture rule):** the Dart adapter's Fixtures/Mocks guidance is hardened into a rule — mock only true I/O boundaries, never a plain data model. Landed in the method skill, the Dart adapter, the dev-repo reference harness, and a contract-test suite.

## Key Outcomes
- **Files:** 10 modified (2 shipped SKILL.md, 2 plugin.json, 2 CHANGELOG.md, 2 harness workflows, 1 contract-test file, plan.md correction), 6 delivery artifacts.
- **Versions:** nexus 1.18.9 → **1.18.10**, nexus-flutter 0.2.0 → **0.2.1** (both PATCH — additive refinements).
- **Gates:** contract suite `tests/unit/workflow-contract.test.mjs` **55/55**; `node --check` clean on both harness workflows; `bump-plugin --check` green; gen-commands in sync.
- **Review:** **APPROVED** after **2 cycles**. Team mode Standard+Codex — the plan pre-passed a code-grounded critic (Mode 2), and Step 2 ran the nexus reviewer + an independent Codex cross-check.
- **Codex cross-check earned its keep:** Codex NO-GO caught two real code-grounded issues the single-pass reviewer missed — a fail-**open** on the load-bearing F1 guard (absent `categoricalKeep` defaulted to removal) and an activation-gate undercount (skipped tests dropped from the generated total). Both fixed in cycle 1 (fail-closed filter + schema `required` backstop; `generated = passed + failed + skipped`).

## Deviations from Plan
- **FIX-A (fail-closed guard)** — the plan/first implementation left `categoricalKeep` optional in the proposal schema (fail-open on an absent flag). Hardened during review to fail closed (remove only when both keep flags are explicitly `false`), matching the plan's own "the guard that must not decay lives in the orchestrator" principle.
- **FIX-B added `harness/cover-flutter.workflow.js`** (carry `skipped` through `suiteGreen()`) — one file beyond the plan's Step-3 target, needed to compute the true generated total. Dev-only; no extra version bump.
- **plan.md:42 corrected** — the "passed == total suite size" invariant was false; updated to `passed + failed + skipped`.

## Notes
- **Omni twin regen deferred to merge** (per plan + ADR-6) — `gen-omni.mjs` mirrors both shipped SKILL.md; the harness is dev-only and not mirrored. Regenerate + commit in the `../omni` repo when this lands there.
- **Pre-existing, unrelated failures surfaced during the run (NOT this feature's defects):** (1) `tests/lint/release.test.mjs` — `nexus-cpp: CHANGELOG.md has no version entry` (nexus-cpp untouched). (2) `tests/unit/gen-omni.test.mjs` ×3 — stale synthetic fixture: the sandbox lacks `plugins/nexus-flutter` which `gen-omni.mjs` now scans (`ENOENT`); the feature touched neither `gen-omni.mjs` nor its test. Both are open tech-debt worth a follow-up pass; they cause the `SubagentStop` verify gate to record `blocking_failed` (advisory — the feature's own gates are green).
- **Not done (out of scope per plan):** F2/F4/F5, a live end-to-end re-run on the pilot classes (maintainer's optional check), the two-tier survivor model.
