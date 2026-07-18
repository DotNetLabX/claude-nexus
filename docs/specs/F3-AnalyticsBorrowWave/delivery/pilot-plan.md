# F3 Stage-0 pilot plan — first real run on the analytics workspace (fmcg_platform)

**Status:** Plan — architect (Fable 5), 2026-07-18. Review mode: self cross-check (this runbook
restates the critic-passed F3 tech-spec Stage-0 plus the shipped skill's own procedure; no new
design decisions). **Executes in the analytics workspace repo** (the fmcg_platform consumer — the
recorded first consumer, `tech-spec.md:26-28`; profile operator-owed since adhoc-AnalystExtension).
Nothing in the nexus repo changes during the pilot; the pilot's outputs come back as files under
this `delivery/` folder.
**Gate role:** F3 S1–S4 and F8-W1 both build only after this pilot's exit criteria are met. KG is
run #2 (refresh/migration path); this pilot is run #1 on a fresh consumer — the bootstrap path.

## Preconditions (check before anything)

| # | Precondition | How |
|---|--------------|-----|
| 1 | nexus-analytics **0.3.0+** installed and current in that workspace | `/plugin update`, confirm version |
| 2 | Invoke the skill **namespaced**: `nexus-analytics:mine-semantic-model` | a project-local same-name skill would shadow the bare name (platform rule, spike-verified); record which skill executed |
| 3 | A **read-only DSN** for fmcg_platform resolvable in that shell | never committed, never echoed; the forbidden dev/admin surface named explicitly |
| 4 | A **probe runner** exists or is adapted | the skill ships none (project-provided by contract). Fast path: recover KG's `run-probe.cs` shape from KG git history (`git -C D:\src\knowledge-gateway show 1843209:.claude/skills/mine-semantic-model/tools/run-probe.cs`) and re-point its BR1 refusal rules at THIS workspace's roles. This adaptation experience is exactly the W1 requirements input — log every rough edge |

## Run (one session, in order)

| Step | What | Binding reference |
|------|------|-------------------|
| 1 | **Phase-0 first-run intake** — one batched message, **eleven** inputs; author + commit-ready `docs/semantic-model/profile.md` | plugin `references/project-profile.md` (KG worked example = shape only; every value is this workspace's own) |
| 2 | **One real area run** — Bootstrap of ONE bounded area (this consumer has no bundle yet; pick the area the analyst most queries — Reports-class is the KG-proven starter) | the skill's five phases; interview batched; marginal-budget rail applies |
| 3 | **One live query lane** — a real business question through `semantic-model-query` + `answer-qa` against the emitted bundle | the plugin's query + QA skills |
| 4 | **Stamped run report** incl. `## Feedback dispositions` (ledger empty ⇒ the explicit `none open` line) and `## Findings / follow-ups` | plugin `references/output-contract.md` |
| 5 | **Friction log** — every "why can't this be answered", missing probe class, runner gap, contract gap | free-form; feeds step 6 |
| 6 | **Pilot lessons** — for each F3 S1/S2/S3 item: one-line placement confirmation or correction; each Stage-2 item: triggered or dropped, with the signal | `tech-spec.md:30-32` — this IS the exit gate |

## Exit criteria (verbatim intent from the tech-spec)

Pilot lessons written; **each S1–S3 item has a one-line placement confirmation or correction**;
Stage-2 items are **triggered or dropped by pilot signals, not by default**. A zero-friction pilot
is a legitimate result — the value is the validation run, not the finding.

## Evidence to bring back (files into this folder)

| Artifact | Path (this repo) |
|----------|------------------|
| Pilot report (copy or pointer + the S1–S3 placement lines + S2 verdicts + friction log) | `docs/specs/F3-AnalyticsBorrowWave/delivery/pilot-report.md` |
| Runner-adaptation notes (feeds F8-W1's requirements) | a `## Runner notes` section of the same file |

## Stop rules

No resolvable read-only DSN, or no runner and no capacity to adapt one → STOP after Phase 0,
report the blocker in `pilot-report.md`; a profile-only session is still partial progress (the
intake is Stage-0 work). Never run against a dev/admin surface to "unblock" the pilot.

## Handoff prompt (paste into a new session in the analytics workspace)

```
/data-analyst
Execute the F3 Stage-0 pilot per
D:\src\claude-plugins\nexus\docs\specs\F3-AnalyticsBorrowWave\delivery\pilot-plan.md — read it
first and follow it exactly (preconditions table, 6 run steps, exit criteria, stop rules). Write
the pilot report back to the path named in its Evidence table.
```
