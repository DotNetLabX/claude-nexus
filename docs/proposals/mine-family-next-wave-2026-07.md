# Proposal — Mine-family next wave: consolidation, hardening leads, the fifth mine, and the data-analyst extension

**Status:** Ratified — 2026-07-10, owner ("yes agree"), scope: P0+P1+P4 ratified; P2+P3 proceed as
spikes; P5 proceeds to definition shaping. P6+P7 added same-day at owner direction and are **in
execution in separate sessions** (P6: `adhoc-LearnerCadenceNudge` spec+plan; P7: KG proposal
`knowledge-gateway docs/proposals/2026-07-10-semantic-model-self-improvement.md`). The consolidated
ranked backlog of all remaining items lives in this file (see `## Consolidated open-items backlog`).
**Decision-maker:** ldumit (owner)
**Recommendation:** Ratify P0+P1+P4 now (record hygiene, family-core consolidation, adopt
mine-semantic-model as the fifth mine via the technical branch); treat P2+P3 as research-first
hardening leads (each has a named spike); hand P5 (nexus-analyst extension) to definition shaping —
it is a direction, not yet a ratifiable design. Post-ratification additions: P6 — adopt ONLY the
cadence trigger from VWH's auto-learn loop (the rest is parity or already backlogged); P7 — give the
semantic model a consumption-side self-improvement loop (folds into P4's tech-spec + P5's skills).
**Confidence:** High — for P0/P1/P4: every load-bearing mechanism is already shipped and working
(the cross-skill pointer pattern, the skill-lint + evaluate-skill gates, and mine-semantic-model
itself runs in KG). P2/P3/P5 are explicitly NOT put up for ratification here (P2/P3 are
VWH-derived leads pending their spikes; P5 needs definition) — the High rating covers only what the
recommendation asks the owner to ratify.
**Impact:** 8
**Effort:** med
**Date:** 2026-07-10

## Need

Two inputs converged (owner review of `docs/research/2026-07-10-mine-suite-vs-vwh.md`, 2026-07-10):

1. **The mine family works and must not be broken.** All five method members now have real runs:
   cover ~13 runs across 4 stacks; from-spec piloted (zero false alarms); the debt mine on
   omnishelf_flutter_app (`docs/tech-debt/`, 6 areas, `mvr-pilot-1-2026-07-04`); the reference model
   ×3 self-reference on dotnet-microservices (the skeptic gate demonstrably fired — it killed a
   vacuous grep); an omnivision-ai-sdk run in progress. **Every change below is therefore additive
   or prose-shape-only, gated by skill-lint + a post-change `evaluate-skill` pass; no behavior
   change to a working mine is in scope.**
2. **The estate grew without consolidation, and the owner wants two extensions:** the KG
   project-local `mine-semantic-model` promoted into the plugin, and a data-analyst extension
   (agents + skills) built on it.

Out of scope: hosting any mine on the VWH Python kernel (settled 2026-06-23, re-affirmed 2026-07-10);
re-litigating the A-series adoptions (`docs/proposals/vwh-adoptions-2026-06.md` — A2/A4/A5 remain
their own backlog); cost-optimization of the mines (owner stance: the deliverable amortizes, budget
rails are runaway-stops only, completeness beats thrift).

## Approach

### P0 — Record hygiene + pilot-lesson harvest (immediate, no bump beyond touched shipped files)

- Annotate the stale meta-docs (`docs/skill-evals/2026-07-04-mine-verify-repo.md`, the two pipeline
  summaries) with a one-line "pilot executed 2026-07-04/05 — artifacts in {target repo}" note. Two
  contradicting records is how this assessment's own first pass went wrong.
- Harvest the pilot runs' lessons into the skills where they are load-bearing. Known candidates from
  the run artifacts: the vacuous-grep kill (a skeptic catching an evidence command that could never
  fire — worth a one-line "the skeptic also validates that the evidence command CAN fail" clause in
  C3/R3); the merged-finding audit-note pattern the reference model used.
- Name a refresh owner: both registries carry `last_verified: 2026-07-05` and run-2+ semantics exist
  (C5/R4) but no trigger owns them. Cheapest correct locus: a backlog row per target repo, not new
  machinery.

### P1 — Family-core consolidation (the "inheritance" answer)

True skill inheritance does not exist on the platform, but the supported equivalent is already in
use and proven: **cross-skill semantic pointers** (mine-verify-repo/-reference-model "inherit the
semantics of mine-verify-cover's Execution topology" today) and **shipped `references/` files**
(mine-verify-repo ships `references/metric-layer.md`). P1 extends that pattern conservatively:

- Extract the blocks that are verbatim-or-near repeated across the four SKILL.mds into
  `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` (the family head owns it):
  the execution topology (orchestrator-owns-spawning, staged background `general-purpose` agents,
  no-filesystem orchestrator), the marginal-budget rail wording, the skeptic verdict grammar
  (CONFIRMED/WRONG/IMPRECISE) + the drop-without-excerpt enforcement, the registry invariants
  (never-delete, append-only changelog, idempotent re-runs, provenance + `last_verified`), and the
  family relationship table (stated once, referenced thrice).
- Each sibling keeps: its one-line pointer + anything its **grep-checkable ACs bind to its own file**
  — the "Binding prompt obligations (grep-checkable)" sections state "verifiable by grep in this
  file (AC-3/AC-2)" and MUST stay in place (or their ACs are re-pointed in the same change; default:
  stay in place). Safety floors already use the pointer form (the C6/R6 single-source pattern that
  fixed eval finding F1) — P1 finishes what that fix started.
- Gate: skill-lint green on all touched skills + one `evaluate-skill` pass over the family after the
  edit + a grep-diff proving every binding obligation still resolves. One `release-plugin` bump for
  the whole consolidation (never per-file).

This is also the mine-family instance of the ratified-but-unbuilt **A2 declutter lane** — P1 can be
its first workload rather than a separate mechanism.

### P2 — Statistical-honesty hardening (research-first lead, not ratified here)

Two small, additive method-text upgrades borrowed from VWH's coverage-flavor substrate discipline;
both target the same risk — a gate verdict decided by randomness rather than by the tests:

- **Flake base-rate baseline:** before Cover writes any test, the runner measures the EXISTING
  suite ×2 and records baseline pass/fail/skip + any pre-existing flake. A flaky-by-inheritance
  target then surfaces at kickoff (raise to operator) instead of failing `no_flaky` late and
  mis-attributing the flake to generated tests. (The `no_new_skips` baseline measurement already
  exists — this extends the same step; near-zero new cost.)
- **Near-floor repeat:** when reachable kill lands within one mutant of `mutation_floor`, re-run the
  mutation pass once before the pass/fail verdict — a boundary decided by a nondeterministic timeout
  should not stand on N=1. (Timeout-counts-as-kill stays; this only adds a repeat at the boundary.)

**Spike before adopting:** check the real runs' reports for any near-floor or inherited-flake
incident. If no run has ever hit either condition, park both as documented seams — do not add
machinery for unobserved pain (VWH's own minimal-first rule).

### P3 — Mechanical miner clean-room seal (research-first lead, not ratified here)

The verifier seal is already structural (inline code slice, zero file reads). The **miner**
clean-room is still prompt-only — deferred as Increment-3 in `nexus/harness/README.md`, and the
recall numbers remain conditioned on miners honoring the prompt. The platform may now close this:
Workflow `agent()` supports `agentType`, so a read-restricted subagent type (no file tools) fed the
target source **inline** would make the seal mechanical for the class-scope and spec-scope mines
(cover, from-spec). Repo-scope mines keep prompt-clean-room + the skeptic gate (inlining whole areas
is impractical; the must-reproduce gate is the design mitigation there).

**Spike before adopting:** one cheap probe — spawn a read-less `agentType` under Workflow with
inline source and confirm (a) it can complete a mine pass, (b) tool denial actually blocks reads.
If the platform denies cleanly → adopt for cover/from-spec miners; if not → the status quo stands,
conditionality stays recorded.

### P4 — mine-semantic-model: the fifth mine (adopt via the technical branch)

Promote KG's project-local `mine-semantic-model` (194-line SKILL.md + probe-catalog +
interview-protocol references; already `user-invocable`, `disable-model-invocation: true`) into
`plugins/nexus/skills/`. It genuinely extends the family rather than duplicating a member:

| Mine | Unit | Ground truth | Gate | Output |
|------|------|-------------|------|--------|
| mine-verify-cover | one class | code | mutants | rules KB + gated suite |
| mine-from-spec (mode) | one spec | spec text | skeptic-vs-text | spec-rules |
| mine-verify-repo | one repo (debts) | git metrics + code | hotspot rank + re-execution | tech-debt registry |
| mine-reference-model | one reference repo (virtues) | reference source | skeptic re-execution | reference-model registry |
| **mine-semantic-model** | **one datasource area** | **live schema + read-only data probes** | **probe re-execution + KB grounding + operator interview** | **semantic-model bundle** |

Its five phases (Mine → Probe → Ground → Interview → Emit+Validate) map onto the family invariant
with one honest difference to preserve, not paper over: the human gate is **in-loop** (the batched
interview is a pipeline stage) rather than post-hoc triage — because live-data semantics
(what a flag *means*) are judgments only the owner can render, exactly the ADR-47 fact/judgment
split applied to data.

Adoption shape (per ADR-27/28 — this graduates to a tech-spec; the proposal only fixes direction):
- Generalize the KG-specific parameters (bundle path `seed/db/semantic-model/`, the BR1/BR12 probe
  preamble/floor references, the KB hub path) into run inputs with KG's values as the worked example.
- Keep it **Postgres-flavored with the datasource seam named, not extracted** — one live datasource
  so far; the family's own rule ("don't extract the seam from a single stack") applies. A second
  engine (e.g. SQL Server) is the extraction trigger.
- Born-from-defect provenance travels with it: the phantom-column class (F38) is its reason to
  exist — every model claim must trace to a verified column, a ran probe, a KB citation, or an
  answered interview question.

### P5 — nexus-analyst: the data-analyst extension (definition handoff, not ratified here)

A new marketplace plugin (sibling in the repo like nexus-dotnet, but a **domain extension**, not a
stack adapter): agents + skills for data-analyst work in consuming projects (fmcg_platform,
omnivision-ai-sdk, KG). Candidate contents to shape — not commitments:

- **Agents:** a data-analyst persona (query discipline, semantic-model-first navigation); possibly a
  data-engineer counterpart (model authoring/refresh — the mine-semantic-model operator).
- **Skills:** semantic-model consumption (measures/dimensions/join-guards as the only query
  vocabulary — the anti-phantom-column discipline at query time); the probe catalog as a standalone
  read-only investigation skill; measure/dimension authoring format; a data-QA gate.
- **One VWH concept worth carrying in:** the retail-intelligence flavor's **ESTIMATED → MEASURED
  value-claim lifecycle** (a claim starts estimated, becomes measured via validation iterations) —
  the analyst-domain analogue of `status: verified → mutation-gated`.
- **Boundary (already settled, reuse it):** the vwh-adoptions "where a capability lives" rule —
  *method → plugin, data → project, autonomous loop → VWH*. nexus-analyst ships the day-to-day
  method; VWH's retail flavor remains the autonomous-campaign engine; they share the semantic model
  as the common artifact, they do not compete.

### P6 — Learner: adopt the trigger, nothing else (the genuinely-better test, applied)

**Owner question (2026-07-10):** can VWH's auto-learn process improve the nexus lessons/learner
flow — but only if genuinely better; the manual learner works really well.

**Verdict: the process is at parity; the only genuine gap is the trigger.** Side-by-side:

| VWH auto-learn mechanism | Nexus equivalent | Delta |
|---|---|---|
| Operator intervention → triage (detail vs structural) | Agents persist user instructions + write lessons.md in-flow | Parity (nexus persists user directives *faster*) |
| Reflection: root assumption + cheapest-locus fix (memory < doc < nudge < gate < kernel) | A1 delivered — "which locus?" is a learner triage question | Parity |
| Generalization gate: capture now, harden only on recurrence | Learner recurrence tracking + A6 provenance tags (strengthen-don't-duplicate) | Parity |
| Prune direction (declutter) | A2 — ratified, unbuilt | Already backlogged |
| Outcome back-links | A5 — ratified, unbuilt | Already backlogged |
| **The trigger: the loop fires as part of normal operation, never from memory** | **Nothing** — the learner runs when the owner remembers | **The gap** |

Evidence the gap is real but modest: the last consolidation was `adhoc-LearnerConsolidation`
(2026-06-30); in the 10 days since, 10+ slugs closed, each writing lessons — the backlog of
unconsolidated lessons grows silently between runs. VWH paid for this exact shape once (its skeptic
fired 0/7 times when memory-triggered) and fixed the *trigger*, not the process.

**Adopt (one line of machinery, no new process):** a cadence nudge at the pipeline-close touchpoint —
when the team lead writes `summary.md`, if ≥N slugs (default 5) have closed since the last learner
consolidation, the close message appends one suggestion line: "N slugs closed since the last learner
run — consider `be learner`." Deterministic count (summary.md files newer than the last
learner-consolidation commit), silent when clean, never blocks. This is the A4 nudge pattern applied
to the learner — if A4's registry ships first, this becomes just another nudge row in it.

**Explicitly NOT adopted (the over-engineering line):** reflection sub-agents, dual-write to a
template repo, auto-triage of interventions, a standing daemon — all either parity with what the
learner already does or machinery the manual flow demonstrably doesn't need.

### P7 — Semantic-model self-improvement loop (the owner-requested adoption)

**Owner directive (2026-07-10):** the auto-improve idea IS worth adopting for the semantic model.

The KG skill is already further along than a surface read suggests — Refresh mode is diff-driven and
idempotent, and **Audit mode already carries the skeptic half** (refutation probes re-verifying the
weakest attestations "framed to refute not confirm", usage-heat via `pg_stat_user_tables`,
column-coverage drift detection, and downgrade-on-refutation-hit). What is genuinely missing is the
**consumption side of the loop**: when the model is *used* (an analyst query, a gateway answer) and
reality pushes back — a measure returns nonsense, a join-guard fires, the user corrects an answer —
nothing structured captures that signal, so the next Refresh/Audit cannot prioritize it. Three
additions, each riding an existing mechanism (no new species, no daemon):

1. **A model-feedback ledger** (append-only, per area — the lessons.md pattern applied to the
   model): any consumer that hits a model-vs-reality mismatch appends a discrepancy note *at the
   moment of observation* with evidence (the query, the observed vs expected shape). **Refresh/Audit
   reads this ledger FIRST** — exactly lessons → learner, so mismatches drive the next run's probe
   priorities instead of evaporating. (The skill already has the inverse channel — defects in the
   *skill* go to lessons.md/CHANGELOG; this adds the channel for defects in the *model*.)
2. **Staleness nudge at the point of use** (VWH's research-staleness cadence, relocated to the
   consumer): provenance rows already carry dates and probes already stamp data-vintage
   (MIN/MAX coverage). The consuming skill (P5's analyst query discipline) checks the stamp of the
   constructs it uses and appends one line when stale past a threshold — "construct X last verified
   {date}; consider a Refresh run." Trigger lives at consumption; silent when fresh.
3. **Usage-confirmation provenance accretion** (the ESTIMATED→MEASURED lifecycle, done the family
   way — discrete facts, never scalar scores): when an answer built on a construct is validated by
   the user, the construct's provenance row gains a confirmation tag (`confirmed-in-use:
   {date/ref}`) — the A6 strengthen-don't-duplicate mechanism applied to model rows. Audit mode's
   "re-verify the WEAKEST attestations" then has a data-grounded definition of weakest: never
   probed-on-fresh-window AND never confirmed-in-use.

Home: all three are **P4 tech-spec scope** (the generalization pass specifies the ledger schema +
nudge threshold) and **P5 skill scope** (the analyst skills do the writing/checking). No change to
the KG skill until P4's tech-spec lands — KG is the working reference implementation, same
protect-the-working-thing rule as the mines.

## Benefits

- **P0:** one truthful record; pilot lessons stop evaporating; refresh runs get an owner.
- **P1:** four skills stop drifting apart (the C6-duplication defect class dies structurally);
  smaller per-invocation context; the A2 declutter lane gets a proven first workload.
- **P2/P3:** gate verdicts and recall claims stop resting on unexamined randomness/promises — but
  only if the spikes show the pain/mechanism is real (no speculative machinery).
- **P4:** the family gains the data arm with a member that already runs in production use; the
  phantom-column defect class gets a structural fix everywhere, not just KG.
- **P5:** the analyst direction starts from a shaped definition instead of ad-hoc skill accretion —
  the exact failure mode ("built and built but never consolidated") the owner flagged.
- **P6:** unconsolidated-lesson backlog stops growing silently, at the cost of one deterministic
  suggestion line — the working manual process stays untouched.
- **P7:** the semantic model stops being write-once-refresh-on-memory: real usage feeds the next
  run's priorities, staleness surfaces where it matters (at consumption), and "weakest attestation"
  gets a measurable meaning.

## Alternatives

- **Do nothing / keep the skills as-is.** Rejected: drift already produced a real defect once
  (the C6 verbatim-duplication eval finding), and the estate is about to grow (P4/P5) — consolidating
  before the growth is strictly cheaper than after.
- **True base-skill inheritance.** Not supported by the platform; the pointer + references/ pattern
  is the supported form and is already load-bearing in the family. P1 uses it rather than inventing
  a mechanism.
- **Host the mine loop (or the analyst loop) on the VWH kernel.** Re-affirmed rejection
  (2026-06-23 verdict, unchanged): a Claude Code plugin ships markdown, not a Python kernel; and a
  fixed extraction conveyor underuses VWH's exploration machinery.
- **Build the data-analyst capability as a VWH flavor instead of a nexus extension.** Genuine
  alternative — VWH's retail-intelligence flavor exists and is validated. Rejected as an
  *either/or*: the two serve different jobs (autonomous optimization campaigns vs day-to-day
  analyst workflows inside consuming projects). The boundary rule keeps both without duplication;
  the semantic model is the shared artifact.
- **Adopt P2/P3 now without spikes.** Rejected: both are VWH-derived leads, not measured mine pain;
  minimal-first (both repos' shared doctrine) says spike first.
- **Adopt VWH's full aggressive-feedback loop for the learner (reflection sub-agents, dual-write,
  intervention auto-triage).** Rejected — the P6 parity table shows every load-bearing piece is
  already delivered (A1/A6) or backlogged (A2/A5); the manual learner demonstrably works. Only the
  trigger gap is real, and it costs one line.
- **A scalar confidence score for semantic-model claims (P7).** Rejected for the same reason the
  family rejected it for rules/tests (`mine-verify-cover` "Rejected: a 1–100 scalar"): agents can't
  calibrate it and thresholds drift — discrete provenance facts (`confirmed-in-use`, refutation
  hits) give the same signal honestly.

## Unresolved

1. omnivision-ai-sdk run outcome — does it surface new method lessons for P0's harvest?
2. P3 spike result: does a read-restricted `agentType` actually deny file reads under Workflow?
3. P4: exact parameter set for generalization (bundle path, probe preamble/floor, KB hub) — tech-spec
   work; and does the interview stage need a team-mode routing rule (interview via team lead) or
   stay standalone-only as in KG?
4. P5 shaping: first consumer (fmcg_platform vs omnivision-ai-sdk)? Agent list (analyst only, or
   analyst + data-engineer)? Which skills are v1? Does the ESTIMATED→MEASURED lifecycle enter v1 or
   wait?
5. P1: do the binding-obligation AC greps stay per-skill (default) or re-point to the family-core
   file in the same change?
6. P6: owner nod on the trigger-only verdict + the threshold N (default 5 closed slugs); and does it
   ship now as a one-line team-lead close-protocol addition, or wait to be A4's first nudge row?
7. P7: ledger granularity (one feedback file per area vs one per bundle)? Who may append —
   any consuming agent, or only the analyst skills? (Both answered in P4's tech-spec.)

## Consolidated open-items backlog (2026-07-10 — all remaining points, ranked)

**Owner directive:** every open item from the VWH evaluation cycle in one place, each with the
impact it produces **in the plugin** and its effort. P6 and P7 are excluded — both in execution in
separate sessions (P6: spec+plan written, `adhoc-LearnerCadenceNudge`; P7: proposal handed to KG).
Scores use the job lens (research doc §8): impact = what the plugin's *users and outputs* gain, not
engineering elegance. Sorted by impact ÷ effort; the sequencing notes carry the dependencies.

| # | Item | What it produces in the plugin | Impact | Effort | Status / gate |
|---|------|-------------------------------|--------|--------|---------------|
| 1 | **B1 — Conclusion-gate verdict semantics** | Higher-quality verdicts in `diagnose` + reviewer/critic: causal claims must name their one changed variable; kill-verdicts-on-thin-evidence refused by default. Two shipped files, prose only. | 6 | low | New — ready to run as a small adhoc pass |
| 2 | **P3 — Miner clean-room seal (spike, then adopt)** | Recall claims become unconditional (today they are "conditioned on miners honoring the prompt"); the last prompt-only gap in the family's enforcement story closes for cover/from-spec. | 5 | low (spike) + med (adopt) | Spike-gated: does a read-restricted `agentType` deny reads under Workflow? |
| 3 | **A5 — Decision log with outcome back-links** | Team-lead/architect judgment calls become a lesson source the learner mines; success later unlocks the `agent_calib` revisit (confidence-label calibration). | 5 | low | Ratified 2026-06 (pilot design settled); kill-if-unused criterion built in |
| 4 | **P0 — Record hygiene + pilot-lesson harvest** | Trustworthy meta-records (no more "never run" contradictions); pilot lessons (vacuous-grep kill → C3/R3 clause) land in the skills; registry refresh gets named owners. | 4 | low | Ratified; docs-only, solo-sized; do FIRST (feeds P1/P2) |
| 5 | **B4 — Charter kickoff checklist for new-target mine runs** | Every fresh-target run (omnivision-ai-sdk onward) starts with confirmed preflight, a stated survival-rate expectation, and a stop-budget — no mid-run surprises. | 4 | low | New — one short checklist, fold into family-core (P1) |
| 6 | **P2 — Statistical-honesty upgrades** | ~~Gate verdicts provably not decided by randomness~~ **PARKED (spike executed 2026-07-10):** across all 11 real cover runs, near-floor **never occurred** (closest pass 13pp above floor; the one fail was a reproduced structural ceiling at 69%, not noise) and inherited-flake occurred **once** — already caught and correctly attributed by the existing `redOnCurrent` mechanism (the PHP cross-suite contamination case). Per minimal-first: no machinery for unobserved/already-handled pain. **Provenance for the recurrence trigger:** a second inherited-flake incident (a `suite_green` refusal caused by pre-existing reds) re-opens the kickoff-baseline half; a first genuine near-floor verdict (within one mutant of the floor) re-opens the repeat half. | — | — | Parked with provenance; both re-open triggers named |
| 7 | **P4 — mine-semantic-model as the fifth mine** | A new plugin capability (the data arm): live-datasource rule mining with the phantom-column defect class structurally fixed for every consumer, not just KG. Feeds P5. | 8 | med | Ratified; tech-spec next; inherits P7's feedback-loop shape after KG pilots it |
| 8 | **P1 — Family-core consolidation** | Every mine invocation pays less context; the verbatim-drift defect class (the C6/F1 incident) dies structurally; the estate is ready to grow (P4/P5) without multiplying the walls. | 7 | med | **Delivered** — adhoc-MineFamilyCore, nexus 1.26.1 (`a4742bf`); Step-2 APPROVED, pipeline closed 2026-07-11; carried P0's record-hygiene addendums |
| 9 | **A2 — Declutter skill (the prune lane)** | The estate-wide subtraction counterpart to improve-flow/skills — evidence-based deletion/compaction with owner confirmation; keeps the whole plugin lean as it grows. | 7 | med | Ratified 2026-06; P1 is its first concrete workload |
| 10 | **A4 — Advisory nudges registry** | The missing middle enforcement tier: deterministic, silent-when-clean discipline flags at Stop/PostToolUse touchpoints (missing dispositions, skipped skills); absorbs the P6 nudge as its first row. | 6 | med | Ratified 2026-06; one narrow spike open (SubagentStop feedback reach) |
| 11 | **B2 — Onboarding companion (HANDS-ON walkthrough + read-only tutor skill)** | Plugin adoption cost drops for a new operator/repo: a repo-correlated walkthrough + a strictly read-only tutor with a forbidden-command carve-out. | 5 | med | New; impact rises the day a second operator arrives — owner-demand-driven |
| 12 | **P5 — data-analyst extension plugin (name TBD; `nexus-analyst` rejected at intake)** | A whole new domain product (analyst agents + skills, semantic-model-first query discipline, ESTIMATED→MEASURED lifecycle) for the data-analyst consumers. | 9 | med (thin-slice v1, re-scoped at intake) | Intake resolved 2026-07-10 (first consumer `D:\omnishelf\analytics`, thin slice, define-now/build-after-P4) → `nexus-data-extension-2026-07.md` (Draft, awaiting ratification) |
| 13 | **B3 — Roast mode (inverted operator-skeptic)** | Systematic extraction of the owner's unstated knowledge on high-uncertainty definitions, with ingestion receipts; double-gated behind ADR-25. | 5 | med | New; niche by design — only fires on genuinely uncertain specs |

**Sequencing notes (dependencies over ratios):** P0 → P1 (harvested lessons land in the
consolidated core, and B4's checklist folds into it) → P4 → P5. The two spikes (#2, #6) are
independent afternoon-sized probes — run them whenever, adopt only on evidence. A2/A4/A5 remain the
standing estate lane in their 2026-06 order (A5 → A4 after its spike; A2 whenever P1 starts, as its
vehicle). B1 is dependency-free and the best effort-to-value on the board; B2/B3 wait for owner
demand.

## Graduate-to-spec

Technical branch (ADR-27/28) for the ratified items: P1 and P4 each become an `adhoc-*` slug with an
architect-owned tech-spec + extracted ADRs (P4 likely mints the "fifth mine" ADR + the in-loop
interview-gate decision). P5, on owner go-ahead, gets its own definition pass (intake interview →
tech-spec for the plugin skeleton; product-shaped parts may route through the PO). P2/P3 return as
one-line ADR-25 records or small follow-ups after their spikes.

## Provenance

Session 2026-07-10 (Architect, standalone). Fed by: `docs/research/2026-07-10-mine-suite-vs-vwh.md`
(the scorecard + its same-day correction), owner review answers (six points: run evidence, prune
mechanics, cost stance, consolidation ask, statistical honesty, mechanical enforcement), run
artifacts read in dotnet-microservices / omnishelf_flutter_app, KG's
`.claude/skills/mine-semantic-model/SKILL.md`, `docs/proposals/vwh-adoptions-2026-06.md` (boundary
rule + A-series status), `docs/research/2026-06-23-vwh-vs-mine-verify-cover.md` (substrate verdict).
