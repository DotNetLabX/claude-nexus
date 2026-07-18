# Proposal — Mine machinery borrow wave 2: ship the enforcement, mechanize the firing, survive the kill

**Status:** Ratified — Laurentiu (ldumit), 2026-07-17 (in-session, bundled with the analytics wave). Backlog row: F7.
**Decision-maker:** Laurentiu (ldumit)
**Recommendation:** A staged wave-2 borrow of VWH machinery into the mine family — a Stage-0 spike that settles the executable-delivery question, then M1 (ship the enforcement runtime, the centerpiece), then four cheap hardenings (M2 mechanized firing, M3 cross-session resume, M4 blocking kickoff, M5 runway forecast) and one market-motivated rider (N1 recall golden set).
**Confidence:** High — every item was independently re-derived by the 2026-07-17 clean-room evaluation; M1 is convergent across three rounds (07-15 steal #4, F6's one unshipped item, fresh-eval M1); the one genuinely open question (delivery mechanism) is resolved by the named Stage-0 spike, not assumed away.
**Impact:** 7
**Effort:** high
**Date:** 2026-07-17

## Need

The mine family's #1 measured gap is that its enforcement is prose a consuming session must
faithfully transcribe. The evidence is not hypothetical:

- The tier-(a) gate battery (`harness/lib/cover-gates.mjs`) is real, pure, unit-tested code that
  **ships nothing to users**; 9 of 10 workflow drivers hardcode the dev-repo `RUNS_DIR`, so the
  engineered artifact and the shipped artifact are two different programs
  (machinery eval 2026-07-15 §3.2 — the "seam that isn't a tradeoff"). The 06-14 harness plan's
  Increment 4 (ship deterministic helpers to consuming projects) was never executed.
- Field-measured prompt-tier compliance: **1 of 13** pilot suites carried the mandated per-test tags
  (`mine-verify-cover/SKILL.md` §fact tags). An off-contract runner agent hand-compiled a mutant
  that spun at 100% CPU until operator kill (C++ re-validation).
- Two developer-stranding incidents from unreliable completion notifications before "poll, don't
  wait" was hand-written into 23 stage prompts (`mine-verify-repo/SKILL.md` §staging) — a
  workaround, not a fix.
- Resume is same-session-only ("a run killed today cannot be resumed tomorrow",
  `mine-family-core.md` §budget/resume) with 400–787k tokens/class at risk; the one resume that
  ever ran saved ~193k tokens.
- The kickoff checklist is self-labeled "wired-but-advisory" and was violated in practice (the
  mine-algorithm pilot-2 truth fork; the vanished CI suite) — every advisory rule that failed,
  failed because it was advisory.

F6-MineMachineryHardening (ADR-60, nexus 1.34.7) shipped wave-1 steals #1/#2/#3/#5 (resume runbook,
skeptic excerpts into rows, capability-contract CI gate, tier disclosure). **Steal #4 — ship the
gates — is the remaining item and this wave's centerpiece.**

**Out of scope:** the analytics tile (own proposal, `analytics-enforcement-value-layer-2026-07.md`);
any VWH *loop* machinery — DAG, variance-aware acceptance, firewall, commit-per-experiment — the
2026-06-23 non-adoption table stands unchallenged by all three evaluation rounds.

## Approach

Staged; each stage independently shippable.

**Stage 0 — spike (settles the two open facts before design):**
1. The recorded P3 spike: does a read-restricted `agentType` actually deny file reads under
   Workflow? (Determines whether the clean-room seal can graduate from prompt-tier.)
2. Delivery-mechanism decision for shipped executables: ADR-5 read-index extension (projects copy
   scripts like they copy conventions) vs a small installable package vs generated-at-kickoff from
   a shipped template. Platform constraint #2 (`${CLAUDE_PLUGIN_ROOT}` never expands inside skill
   markdown) blocks the obvious path — this is the design question that made F6 defer #4, so it is
   the spike, not a footnote.

**Stage 1 — M1, ship the enforcement runtime.** Generalize the dev-repo gate battery
(`suiteGreen`/`noFlaky`/`mutationFloor`/`targetMutated`/`noNewSkips`/`charPin`/`mutationRatchet`)
and the skeptic evidence-schema checks into consuming-repo-runnable artifacts via the Stage-0
mechanism; parameterize the 9 hardcoded drivers. Add a `conclusion.py`-shaped deterministic check at
registry-write time: a verdict row without its re-execution excerpt is **rejected by code**, not by
convention (upgrades the schema's `evidence` field check from exists to non-vacuous). VWH reference:
`kernel/conclusion.py`, the golden-triangle doctrine (`PRINCIPLES.md`).

**Stage 2 — the four cheap hardenings:**
- **M2 mechanized firing** — a monitor-daemon pattern (pidfile-gated cadence, VWH
  `kernel/monitor.py` shape) replacing orchestrator-prose choreography for stage/skeptic dispatch;
  kills the stranding class the 23 "poll, don't wait" lines patch.
- **M3 cross-session resume** — a run-id journal + idempotent `reconcile`
  (resume / complete-tail / none; VWH `kernel/recovery.py` shape) layered over the Workflow tool's
  same-session cache, so a killed run resumes tomorrow.
- **M4 blocking kickoff** — the kickoff checklist becomes a preflight that refuses to start
  unfulfilled (VWH `kernel/charter.py` shape); the family already has the precedent
  (mine-algorithm's Stage-0 HARD BLOCK — the one advisory→mechanical hardening that exists).
- **M5 runway forecast** — realized-cost accrual per stage feeding a forward budget projection onto
  the marginal-budget rail (VWH `dag.py` cost-accrual shape); halts become forecasts.

**Stage 3 — N1 rider (market-motivated, not a VWH borrow):** a recall golden set — one class with a
small curated registry of known rules, F1-scored per run — so the family can state the
recall number the market grades miners on (COBRAIN's evaluation design, EASE 2025; the family's #4
import gap "recall is unmeasured everywhere").

## Benefits

- **Grounding & enforcement 6 → ~8.5** (the largest category deficit in the 07-17 eval): every
  consuming-repo guarantee stops depending on session transcription — the exact failure mode with a
  measured 1-of-13 compliance rate.
- The stranding class is eliminated structurally (M2); a killed 400–787k-token run resumes (M3,
  ~193k measured savings on the single occurrence to date); incident classes that were each fixed
  post-hoc become preventions (M4); budget surprises become forecasts (M5).
- The family gains the one number it cannot currently state (recall F1) using the market-standard
  evaluation shape (N1).
- Strategic: this closes the "method seeking a kernel" half of the convergence the three rounds
  documented — without adopting any loop machinery.

## Alternatives

- **Status quo + more prose discipline.** Rejected: the compliance rate of prose is measured
  (1-of-13), and both fake-green and runaway incidents already happened; a third evaluation round
  independently re-deriving M1 is the strongest evidence the gap doesn't close by itself.
- **Rebuild the mine family on VWH's Python kernel.** Rejected — the 2026-06-23 substrate verdict
  stands: VWH's own RP is 4 (Windows not a target, multi-project layouts open), and plugin-native
  distribution (nothing to host, runs wherever Claude Code runs) is the family's structural moat.
  Borrow the lessons, never the machinery for machinery's sake.
- **Keep hardening per-member as incidents occur (the F6 pattern without a wave).** Rejected: F6
  proved the cheap items ship fine that way, but M1 needs a delivery decision no single member's
  pass will make — it has now been deferred by exactly that dynamic twice.
- **Adopt VWH's firewall for clean-room sealing instead of the agentType spike.** Rejected: the
  audit-hook approach requires owning a Python process; the mine substrate orchestrates black-box
  subagents through a tool contract — same intent, different substrate, different lever (machinery
  eval §3.3).

## Unresolved

1. Stage-0 outcome: which delivery mechanism (ADR-5 extension / package / kickoff-generated) — and
   does the read-restricted `agentType` deny reads in practice?
2. M1 v1 scope: Cover arm only (where the gates already exist as code) vs also shipping orchestrator
   check-scripts for the prose siblings (repo/design/algorithm/reference-model/flows) — the
   prose-siblings' ET score of 2 says they need it most, but they have no existing code to ship.
3. M2's daemon substrate on Windows (no cron; scheduled task vs in-session Monitor loops).
4. Whether N1 rides this wave or the next — it is method-evidence work, not machinery.

## Graduate-to-spec

Technical branch (ADR-27/28): on ratification this graduates to a tech-spec with ADRs extracted —
expected ADRs: the delivery mechanism (Stage 0), "verdict rejection is code, not convention" (M1),
and the blocking-kickoff rule (M4). Backlog row as the next free `F{N}`, ranked by the front-matter
Impact/Effort.

## Provenance

Session 2026-07-17 (architect, Fable 5). Inputs: the fresh clean-room evaluation
(`docs/research/2026-07-17-mine-family-vs-vwh-fresh-eval.md` §6), the machinery evaluation
(`2026-07-15-mine-family-vs-vwh-machinery.md` §3.2/§5 — currently deleted-uncommitted in the working
tree, content at HEAD), F6-MineMachineryHardening (ADR-60) as wave 1, the market scan
(`2026-07-17-market-scan-harnesses-and-mining.md` — N1, and the AIDE metric-hacking lesson
reinforcing M1), and `mine-machinery-hardening-2026-07.md` (the wave-1 proposal this continues;
not superseded — its shipped items stand).
