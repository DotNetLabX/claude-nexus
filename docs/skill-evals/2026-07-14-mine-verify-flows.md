# Skill Evaluation — mine-verify-flows (2026-07-14)

Scope: `plugins/nexus/skills/mine-verify-flows/SKILL.md` (method) read in full against the shipped rubric Layers 1–4 plus the fan-out, unbounded-list, and resumable overlays; cross-read against `plugins/nexus-flutter/skills/mine-verify-flows-flutter/SKILL.md` (the paired adapter), `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` (all six cited §pointers resolved against actual headings), and `plugins/nexus/skills/mine-verify-repo/SKILL.md` (structural sibling). Layer 0 lint pre-passed (exit 0) and was skipped. Run evidence is **pilot-documented only** (a run in another repo, summarized inside the skill's own "pilot" citations) — the binding inputs (plugin-feedback entries, tech-spec) were not available to the evaluator, so gate behavior claims were judged for internal coherence and family consistency, not re-executed.

## Findings

[HIGH] — **The sabotage check — the skill's headline gate — has no executable mechanics on either side of the adapter seam.** The gate battery says "with ONE asserted field perturbed in a copy of the golden, the test goes RED," and the orchestrator (which "has no filesystem") computes the gate from raw runner output — but no stage or agent is named to perturb the golden, and the operation is not one of the 5 adapter capabilities. Per the adapter, goldens are bundled pubspec assets loaded on-device, so a sabotage run implies mutating a golden asset + rebuild + re-run — mechanics stated nowhere; a plausible cheap improvisation (host-side compare via the pure-Dart gate module) is unsound because it never proves *the test* wires the gate in, which is exactly the vacuity the check exists to kill. Worse, the Cover-agent prohibition ("editing … the gate infrastructure") makes it ambiguous whether the obvious executor may even touch a golden copy. One-move fix: add a sixth line to the adapter contract (or extend capability 2/4) — "sabotage run: who perturbs the copy, where the perturbed compare executes, and how the original golden is restored" — and name the executing agent in the gate battery.

[MEDIUM] — **Flow selection and criticality assignment live only in the adapter, but the method is the stack-neutral owner.** The pipeline says "one flow test per selected flow" and the registry carries `criticality: golden | core | edge`, yet the method never says who assigns criticality or how flows are selected; the only statement is in the *adapter's* scope fence ("the registry's criticality tags and the operator choose"). A future non-Flutter adapter consumer hits Cover with no selection rule. One-move fix: one line at the Cover stage or registry section — criticality assigned at Consolidate/Verify, selection = operator choice guided by criticality — and drop the adapter's ownership of that fact.

[MEDIUM] — **The dead-code by-product write into `docs/tech-debt/` is a cross-skill registry write with no defined handoff.** The skill routes reachability findings "to the `docs/tech-debt/` triage registry (`mine-verify-repo`'s artifact)," but mine-verify-repo's registry has a strict row contract (C2: fact-shaped, reproducible-command evidence, computed hotspot-priority, run-id provenance) and documents no inbound source other than its own pipeline — a single-writer concern under the writes-overlay. Does a flows run append C2-conformant rows directly, or hand findings to the run report for a later repo-mine to adjudicate? Unstated. One-move fix: state the handoff shape in the "dead-code discovery" bullet (e.g. "logged in the run report as candidate rows for a mine-verify-repo run — never appended directly").

[LOW] — **Skeptic-protocol carve-out is a deliberate copy without a convergence check.** §Execution topology restates the full reachability-is-a-code-reading-claim rationale that mine-family-core §Skeptic protocol already records verbatim (the skill even says "the carve-out is recorded in the core"). Rubric L2.1 allows deliberate copies only with a convergence mechanism. One-move fix: shrink the skill's restatement to the pointer plus one clause.

[LOW] — **No lessons-capture instruction (Layer 4.1).** Nothing tells a runner where discovered failure modes go. Shared gap with sibling mine-verify-repo, so likely a family-level omission — fix once, ideally in mine-family-core.

[LOW] — **No downstream-consumers note for `docs/business-rules/flows/user-flows.md`.** The sibling names its registry's consumers (ad-hoc lane, M2); this skill's registry consumers (the Cover stage, the operator's selection, refresh runs) are implied, not named (rubric L1.5 second half).

None at CRITICAL.

## Checked clean

- **L1.1 description = body**: every description clause (miners from routes/screens/blocs, skeptic re-trace, on-device golden-gated tests, sabotage check, Mine→Verify-only mode with dead-code findings, adapter pairing) is implemented in a body section; description is specific enough to auto-invoke on flow-inventory/E2E-output-regression asks and does not overlap the class-scope sibling's trigger.
- **L1.2 guardrails have mechanisms**: never-edits-source → executor-named Forbidden list (Cover agent) + clean-room miner reading boundary; never-deletes-a-RED-test → same list; gates orchestrator-computed from raw runner output stated twice (pipeline + gate battery); no agent self-reports a gate; goldens never auto-refreshed on failure, regeneration an explicit reviewed act.
- **L1.4 citation audit / cross-reference integrity**: all four named skills exist on disk (`mine-verify-flows-flutter`, `mine-verify-cover`, `mine-verify-repo`, `tdd`); all six family-core §pointers resolve (§The mine family, §Execution topology, §Marginal-budget rail [+ report-on-halt], §Registry invariants + refresh outcome grammar, §Skeptic protocol, §Kickoff checklist); the core's 8-row family table row for mine-verify-flows (unit/ground-truth/gate/output) matches the skill; the core's per-skill staging and skeptic carve-out entries are consistent with the skill's own text.
- **Adapter seam**: the method's 5-capability contract matches the adapter's 5-row fill table 1:1 (runner, bless+pull, output capture, gate module, harness bringup); the method's relationship-table summary of the adapter's fills is accurate; the hardware-pin split works as designed (method states the principle, adapter names the concrete Pixel 7 Pro API 30 arm64 pin).
- **L1.5 scope fence**: present, names the adapter, the family head, mine-verify-repo, and the platform-side/Maestro/mutation non-goals.
- **L1.6 failure modes encoded**: pilot lessons are in the skill's own steps, not just narrated — scrubber real-corpus smoke MUST, fixture catalog-overlap grep, tolerance non-convergence → class-excision doctrine, ~4-verify-pair budget, determinism-verdict scoping, deferred-smoke seam-naming, fixture-soundness double grep.
- **L2**: family content is pointed-to, not restated (family table, topology canon, budget rail, registry invariants, kickoff checklist — no drifted copies except the one LOW above); deviations from family defaults are explicitly labeled AND honestly graded ("weaker than a mutation floor"); gate battery is a mechanical table (twice-green, identical counts, sabotage RED), not exhortation; right weight (single SKILL.md + shared core, matching sibling shape); placeholder discipline clean (curly-brace tokens, no angle brackets); no AP4/AP5 (registry path concrete, adapter real, no fictional tools); AP6 finalize present (report written every run, including on halt; skipped/deferred never a silent no-op).
- **L3 fan-out overlay**: concurrency stated (3 miners parallel), model policy explicit (§Model — Sonnet for mechanical stages, stronger only for the skeptic, never inherit session model), miners read their own inputs (reading boundary), intra-miner fan-out policy required in stage prompts.
- **L3 unbounded-list overlay**: bounded by design (~10–20 flows, no Minimize in v1 with a stated revisit trigger); deferred flows (scan-flows awaiting frames) reported honestly.
- **L3 resumable overlay**: idempotent re-run + append-only changelog + never-deleted rows via the core invariants pointer; golden lifecycle is explicitly re-bless-proof under config change.
- **L4.3**: no separate index row to drift; registry changelog covered by core invariants.

## Verdict

**fix-then-accept** — the method is coherent, honestly self-graded, and family-consistent with a clean 5-capability adapter seam, but its differentiating gate (sabotage) lacks named execution mechanics on either side of that seam, plus two one-line ownership gaps (flow selection, tech-debt handoff); all fixes are single-move spec edits.

---

## Resolution (architect, 2026-07-14 — consolidating pass, re-linted)

| Finding | Disposition |
|---|---|
| HIGH sabotage mechanics | **Fixed** — gate battery names the executor (a distinct runner agent, never the Cover agent; perturb a working copy of the checked-in golden, re-run, restore; orchestrator scores raw output); adapter-contract capability 1 extended to include the sabotage re-run; the adapter's on-device-runs section documents the concrete Flutter mechanics (edit checked-in golden → same `flutter drive` command re-bundles the asset → confirm RED → `git checkout` restore). |
| MEDIUM flow selection / criticality ownership | **Fixed** — the method's registry section now states: criticality assigned at Consolidate, confirmed at Verify; selection = operator choice guided by criticality; the adapter's fence line now defers to the method's rule. |
| MEDIUM dead-code handoff | **Fixed** — findings are logged in the run report as candidate rows for a `mine-verify-repo` run, never appended directly to `docs/tech-debt/`. |
| LOW skeptic carve-out restatement | **Fixed** — shrunk to the pointer plus one clause. |
| LOW lessons-capture hook | **Waived** — a family-wide convention gap (sibling skills share it); the right fix is one addition to `mine-family-core.md` in a dedicated pass, not a per-skill patch here. |
| LOW registry downstream-consumers | **Fixed** — consumers named (Cover selection, refresh runs, operator triage). |

Post-fix: skill-lint exit 0, no warnings.
