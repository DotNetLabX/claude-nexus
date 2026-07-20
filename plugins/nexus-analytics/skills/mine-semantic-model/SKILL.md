---
name: mine-semantic-model
description: Build, refresh, or audit a semantic-model bundle from live-datasource evidence via a five-phase, evidence-grounded, interview-driven method (Mine -> Probe -> Ground -> Interview -> Emit+Validate), parameterized by a per-project profile (see references/project-profile.md). Use when authoring a new model area (Bootstrap), auditing/refreshing an existing area against live data (Refresh), or investigating what a column/flag actually means before trusting it in a measure or join-guard. Never invoked passively from an ambient mention — always a deliberate, operator-triggered run against a real, resolvable datasource.
user-invocable: true
disable-model-invocation: true
---

# Mine Semantic Model

## Origin (KG pilot)

This method was born from a real defect during the KnowledgeGateway ("KG") project's pilot run: a
hand-authored semantic-model bundle, built from schema exports alone, carried a phantom column
(tracked there as feature `F38`) that survived spec -> plan undetected — a column that verifiably
never existed in the live schema. `F38` is the one feature-id this file carries; every other
feature-id or stack-specific detail belongs only in `references/project-profile.md`'s worked
example, never here.

Ground the hand-authored semantic model in **real data** instead of schema-reading alone: every
claim in the model must trace to a column that verifiably exists, a probe that ran against real
rows, a KB citation, or an answered interview question — never a guess.

This is a **design-time method skill, not runtime code**. It never ships in a consuming
application's request path; it is a procedure a developer or agent runs deliberately, from a
terminal, against a resolvable read-only datasource DSN.

## Phase 0 — Resolve the project profile

Read `docs/semantic-model/profile.md` (this repo's committed project profile — see
`references/project-profile.md` for the template and a complete worked example). If it exists,
load it and proceed to Phase 1.

If it is missing, run the **first-run intake**: ONE batched message (BR4 shape — see
`references/interview-protocol.md`) asking for the eleven profile inputs listed in
`references/project-profile.md`, each with its proposed default where one exists. Write the
answered profile to `docs/semantic-model/profile.md`, then proceed to Phase 1.

**A missing profile is never silently defaulted** — Phase 1 never starts against assumed values;
the intake (or an already-committed profile) is a hard precondition for every run mode.

## The five phases

```
1 Mine       inventory live schema (information_schema/pg_catalog) for the target area;
             reconcile against any project-maintained schema-reference snapshot, if one exists
             (optional). Refresh mode also diffs against the current bundle. Every downstream
             claim starts from a column that verifiably exists -- the phantom-column class dies
             here.
2 Probe      run read-only, floor-carrying SQL probes per column class: cardinality, null rate,
             low-cardinality value distribution (flags/enums), orphan-FK rate + fan-out, date
             coverage (MIN/MAX -- doubles as the run's data-vintage stamp), cross-column
             implication (e.g. is_valid vs deleted_at vs ignore_in_analytics). Every probe
             carries the BR1 preamble + BR12 load floor -- see references/probe-catalog.md.
3 Ground     for each hypothesis formed from probe output, exhaust the profile's KB hub(s) (item
             5, in the profile's stated search order) and the existing bundle provenance BEFORE
             forming a question. A hypothesis the KB answers is recorded with its citation, not
             asked (BR3).
4 Interview  residual questions go to the user, batched ONE message per area (never one at a
             time), each carrying: the probe evidence, a proposed default, and the consequence
             of each choice. See references/interview-protocol.md. Answers are recorded with
             provenance; a re-run never re-asks an answered question.
5 Emit+Vali- write/update the bundle constructs (the profile's construct-file map, item 1) + the
  date        provenance ledger (the profile's ledger path, item 2). Done only when the profile's
             validation gate (item 6) passes with no new failures vs the pre-run baseline.
             Knowledge learned in Interview (flag meanings, measure definitions, business
             vocabulary) is additionally drafted as KB entries in the profile's KB hub (item 5)
             for the user to review/commit -- see references/output-contract.md.
```

## Run modes

- **Bootstrap** — an area not yet modeled. All five phases run in full for that area.
- **Refresh** — diff-driven. Only new/drifted/never-attested items generate probes and
  questions; an item already `carried({baseline})` (the profile's baseline origin token, item 3)
  or previously attested and unchanged is skipped. **The first real run of this skill on a new
  project is typically a Refresh audit of an existing hand-authored bundle** — its job is to
  data-ground it, not to hunt bugs. A zero-divergence outcome is a legitimate result: the value is
  the grounding, not the finding.
- **Audit** — claim-verification over an already-mined area (no discovery). Run when a downstream
  consumer is about to bake the model's claims in (e.g. an aggregated "gold" layer).
  **Leg 0 — ledger first.** Audit never routes through Phase 1/3, so this is the only path by which
  the profile's model-feedback ledger (item 11) reaches an Audit run: before any of the four legs
  below, read the area's ledger; every open entry there is a mandatory hypothesis for this Audit —
  refuted, grounded, or left `still-open`, exactly like the four legs' own findings — and gets a
  disposition in the run report's mandatory `## Feedback dispositions` section (BR-C). Four legs:
  1. **Tier + heat** — the `usage-heat` probe (`pg_stat_user_tables`) + entity-graph degree +
     measure/dimension reference counts → a data-grounded `tier` attestation per entity (core
     answer surface / supporting dimension / config-or-detail).
  2. **Column-coverage diff** — for every MODELED table, live columns vs the columns the bundle
     actually references (measures column/numerator/denominator, dimensions column, relationship
     joinKeys). Live-but-unreferenced metric-shaped columns are candidate semantic drift — the
     phantom-column check run in reverse.
  3. **Refutation probes** — re-verify the WEAKEST attestations on fresh windows, framed to refute
     not confirm. **Ordering is data-grounded, not structural:** undated-AND-never-confirmed
     constructs first (no `verified` date AND zero `confirmed-in-use` tags in the provenance ledger
     — reality has never touched these at all), then stale-dated (a `verified` date older than the
     profile's declared staleness threshold, item 11; when undeclared, this band merges into the
     next), then sampled/pilot-only attestations, then heavily-confirmed constructs (multiple
     `confirmed-in-use` tags) last — genuinely the least urgent to re-verify. Within that ordering,
     the refutation classes are: sampled (not full-population) FKs, pilot-only verifications,
     characterized-not-reconciled formulas, and every additivity/grain claim (rollup-consistency:
     does the detail SUM back to its header?). A refutation hit downgrades the construct's
     provenance and raises a finding — never silently re-confirm.
  4. **Gold-layer contract** — emit, per measure, the grain + mandatory filter + re-aggregation
     rule an aggregation layer MUST carry (an aggregate table built without the filter is the
     cautionary tale: unusable for answers).
  Findings flow through the normal Phase 4/5 gates (interview BEFORE emit on any genuine fork).
- **Idempotence invariant (Bootstrap/Refresh):** an immediate second Refresh run over an unchanged
  DB + bundle must ask zero questions and produce zero model-file changes. (An Audit re-run is
  idempotent too EXCEPT the heat numbers, which move with live usage — tier changes only on
  material shifts, not stat noise.) An open model-feedback ledger entry is *new input*, so consuming
  one is not an idempotence violation; once it is closed, a repeat run over the unchanged DB +
  bundle is again a strict no-op.

## Datasource surface + channel (binding — do not substitute)

- **Surface:** the profile's declared read-only role (item 7) against the profile's target
  database — the only surface holding real data. Resolve the DSN per the profile's datasource
  surface (item 7); never hardcode it, never commit it.
- **An optional dry-run surface** (the profile's item 8, if declared) is offline/synthetic-only —
  never evidence for a real Bootstrap/Refresh run, only for shaking out probe/runner defects
  before touching the real surface.
- **Never the profile's forbidden surface(s)** (item 7) — typically a dev/admin role that bypasses
  grants, so a read-only assumption under it is fiction. A committed default connection string
  that resolves to a forbidden surface is a documented project hazard, not a probe source —
  declare it explicitly in the profile so the runner's refusal makes sense against the actually-
  committed config.
- **Channel: a raw read-only connection through the project runner, never an application's own
  validated-query path.** A gateway/API's own SQL-generation validator, if the project has one,
  typically enforces answer-shaped obligations that reject catalog- and probe-shaped SQL — so none
  of that layer's protections come for free over this channel; every probe replicates the
  necessary floor itself (BR1/BR12), mandatorily.

## Datasource seam (Postgres today)

The catalog and every probe template are openly `information_schema`/`pg_catalog`-shaped — this
method has one live engine so far. A second datasource engine (SQL Server, MySQL, etc.) is the
extraction trigger for a stack-neutral seam; until a second engine is actually needed, the seam is
**named, not extracted** — the family's own don't-extract-a-seam-from-a-single-stack rule.

## Obligations table (every business rule names its enforcement)

| BR | Rule | Enforced by |
|----|------|-------------|
| BR1 | Read-only, always; probes never run as the profile's forbidden role; credentials never committed | the project runner refuses a DSN not matching the profile's read-only role (item 7), and any DSN matching a forbidden surface, unconditionally; every `probes/*.sql` file opens with `BEGIN; SET TRANSACTION READ ONLY; SET LOCAL statement_timeout = '{param}';` and closes `ROLLBACK;` (grep-verifiable) |
| BR2 | Evidence before question — no speculative interview questions | `references/interview-protocol.md` question template requires an `Evidence:` field; a question with no probe/schema citation is malformed by the template |
| BR3 | KB-first — a question the KB/analytics reference can answer is never asked | Phase 3 (Ground) procedure below + the run-report's KB-cited-not-asked section (`references/output-contract.md`) |
| BR4 | Batched interviews — all questions for an area in one message | `references/interview-protocol.md` (batched-per-area pattern, proven in the KG pilot) |
| BR5 | Provenance on every touched field, closed-enum ledger values | `references/output-contract.md` ledger schema (Decision D1); the profile's ledger path (item 2) is the sidecar of record |
| BR6 | Fail-closed emit — done only when the project's validation gate is green vs baseline | Phase 5 procedure below: the profile's validation gate command (item 6) re-run is a hard gate before a run is reported complete |
| BR7 | Lane boundaries — never write into any of the profile's declared no-write lanes | Phase 5 write-set is enumerated in `references/output-contract.md`; none of the profile's declared no-write lanes (KG example: a verified-queries store, an accuracy/golden set, a schema-reference snapshot, a generation-rules tree) appear in it |
| BR8 | KB write-back goes to the profile's KB hub only; the skill never commits | Phase 5 writes drafts to the profile's KB hub (item 5) — never this repo's own `docs/kb/`; **the skill never commits, either repo** — this skill contains no `git commit`/`git push` step in any phase |
| BR9 | Every run emits a stamped report outside the grounding root | the profile's run-report directory (item 4), default convention `docs/model-runs/{date}.md` — required-section list in `references/output-contract.md` |
| BR10 | Idempotent refresh | see "Idempotence invariant" above |
| BR11 | UTF-8 without BOM on every emitted file | Phase 5's emit step writes every file via a BOM-free writer and the run report lists a first-3-bytes check per emitted file |
| BR12 | Load floor on every aggregate probe — `LIMIT` is not a floor; `EXPLAIN` cost gate; large-table probes must carry a real bounded predicate | the project runner runs `EXPLAIN` before every aggregate probe body and refuses execution above the configured ceiling; a probe targeting one of the profile's large-table policy rows (item 9) is refused unless the `bound_predicate` parameter's SHAPE matches that row's sanctioned form — a tautology no longer passes; see `references/probe-catalog.md`'s "Large table policy" |
| BR13 | Aggregate-only evidence — no row-level client/tenant data in any artifact | `references/output-contract.md` run-report template only has distribution/count/boundary-stamp table shapes; the aggregate-only sweep is a mandatory Phase-5 pre-emit check |
| BR-A | Ledger placement — the profile's item-11 location, never under the bundle root or any runtime-served grounding root | `references/feedback-ledger.md` + BR9's same logic |
| BR-B | No second write path — a ledger entry reaches the bundle only via the next run's Phase 1/3 (or Audit leg 0) → Phase 5 gate; a `confirmed-in-use` tag writes only the provenance sidecar, never a model construct | `references/output-contract.md` Schema v2; no phase below writes a bundle construct from a ledger entry directly |
| BR-C | Mandatory disposition — a run over an area with open ledger entries is incomplete until each has a disposition; zero open entries emits an explicit `none open` line | Phase 1/3/leg-0 procedure below + the run report's mandatory `## Feedback dispositions` section |
| BR-D | Never delete — ledger entries and `confirmed-in-use` tags are append-only; closure is a resolution append | `references/feedback-ledger.md`'s recurrence/closure rules |
| BR-E | No scalar confidence — tags and dates only, never a numeric confidence score | the profile's provenance-validation attestation (item 10): a project-provided numeric/boolean-leaf scan, non-zero exit blocks (when the profile declares a validator; else contract-bound and disclosed — the item-10 absence case) |
| BR-F | Truthful dates — `verified` set only from an actual run/probe/interview date; a `code({ref})`-primary entry never receives `verified` | `references/output-contract.md` Schema v2 (governs every Phase-5 emit) + the item-10 validation attestation (same absence case as BR-E) |
| BR-G | Staleness nudge — silent when fresh, advisory only; contract-bound here, runtime implementation is the consuming project's own lane | this table row + Audit leg 3's stale band (no code in this skill enforces it — by design) |
| BR-H | UTF-8 without BOM on every feedback-loop artifact (ledger files included) | same discipline as BR11, extended |

## Procedure

### Phase 1 — Mine

1. Resolve the target area (a bounded set of tables/views the run covers — e.g. "Reports",
   "Tasks"). Query `information_schema.columns` and `information_schema.table_constraints` (or
   `pg_catalog` equivalents) for every table in scope.
2. Reconcile the live inventory against any project-maintained schema-reference snapshot, if the
   project keeps one (optional — not every project does; the live inventory is the primary source
   of truth regardless). Anything live but not in the snapshot, or in the snapshot but not live, is
   a Mine-phase finding — record it, do not silently drop it.
3. Refresh mode only: diff the live inventory against the current bundle (the profile's bundle
   root, item 1) for the area. Unchanged, already-`carried({baseline})`-and-verified items are
   skipped for Probe/Interview (BR10).
4. Read the profile's model-feedback ledger (item 11) for the target area, if it exists. Every open
   entry there joins this run's hypothesis set alongside whatever Mine/Probe raise — it is never
   silently skipped. See `references/feedback-ledger.md`. (The profile's item-11 location is the
   binding source; its proposed default is `docs/model-feedback/{area}.md`.)

### Phase 2 — Probe

Run the probe classes in `references/probe-catalog.md` against every in-scope column, through the
project runner only (never a bare `psql`/driver call — the runner is the BR1/BR12 gatekeeper).
Record every probe's cost-log line (feeds BR12) and its result set (aggregate shape only — BR13).

### Phase 3 — Ground

For each hypothesis the probes raised (e.g. "does `status = 9` mean cancelled?") **and every open
model-feedback ledger entry carried in from Phase 1**, search in this order before ever drafting a
question:

0. **The profile's model-feedback ledger (item 11), read FIRST** — an open entry for this exact
   construct is itself the hypothesis under investigation here; ground it the same way any
   probe-raised hypothesis is grounded (steps 1-2 below), then record its disposition
   (`probed | grounded | asked | still-open`, `references/feedback-ledger.md`).
1. This project's own bundle provenance (the profile's ledger path, item 2) — was this already
   attested?
2. The profile's KB hub(s), in the profile's stated search order (item 5).

A hit at any step is recorded in the run report's KB-cited-not-asked list with its citation
(BR3/BR9) — the hypothesis is never asked. Only a genuine miss becomes an interview question. Every
ledger entry consumed this run gets a disposition in the run report's mandatory
`## Feedback dispositions` section (BR-C) — zero open entries emits an explicit `none open` line.

### Phase 4 — Interview

Batch every residual question for the area into one message per
`references/interview-protocol.md`. If the user (the run's oracle) is not available synchronously,
STOP here: write the batches into the run report and the pipeline's `questions.md` with an
`OPERATOR ACTION REQUIRED` note, and do not proceed to Phase 5 for the affected constructs. Resume
Phase 5 once answers land.

### Phase 5 — Emit + Validate

1. Update the bundle constructs and the profile's ledger (item 2) for everything Phase 1-4
   resolved (probed, KB-cited, or interview-answered). Untouched constructs keep their existing
   ledger origin.
2. Run the BR13 aggregate-only sweep over every table/list about to be written (run report, KB-hub
   drafts) — refuse to emit on a per-row-identifier hit.
3. Run the profile's validation gate command (item 6). Compare against the pre-run baseline
   recorded at the start of the run. Any *new* failure blocks the emit — the run reports and stops
   (BR6), it is never left "done" red.
4. Write the run report to the profile's run-report directory (item 4) per
   `references/output-contract.md`, including its mandatory `## Feedback dispositions` section
   (BR-C).
5. Draft KB entries for any *knowledge* learned (not mechanical facts) into the profile's KB hub
   (item 5) — uncommitted, for user review.
6. Run the profile's provenance-schema validation (item 10 attestation; project-provided tooling).
   A non-zero exit blocks the run exactly like a new validation-gate failure (BR6 extended) — the
   run reports and stops, never left "done" with a schema violation. If the profile declares no
   validator (the item-10 absence case), record
   `provenance validation: none declared (BR-E/BR-F contract-bound only)` in the Gate result and
   continue — BR-E/BR-F are then contract-bound only for this project.

## What this skill does NOT do

- Write into any of the profile's declared no-write lanes (BR7) — e.g. a verified-queries store,
  an accuracy/golden set, a schema-reference snapshot, or any other one-way analytics port the
  project declares off-limits.
- Commit anything in this repo or the KB hub (BR8) — the user handles all git, both repos/trees.
- Adopt or grow the consuming project's own adjacent lanes/tooling — follow-ups the project owns,
  never this skill's job.
- Run against a forbidden surface, or treat dry-run/seed-container output as evidence for a real
  run.

**Discovered a defect while running this skill** (a runner bug, a missing probe class, a protocol
gap)? Log it: inside the SDD pipeline, append to that feature's
`docs/specs/{slug}/delivery/lessons.md` under `## Developer Lessons` or `## Skill Gaps`; running
standalone, record it in the run report's `## Findings / follow-ups` section (this run's durable
log — the shipped skill's own `CHANGELOG.md` lives in a read-only plugin cache, not a writable
working tree). Never silently work around a defect in the runner/probe catalog without recording it
somewhere.

## Relationship to the mine family

This is the **fifth mine** — the datasource sibling of the mine family, scanning ONE datasource
area (ground truth: live schema + read-only data probes; gate: probe re-execution + KB grounding +
operator interview) to ground a semantic model in real data. Read nexus core's
`mine-verify-cover` skill → its `mine-family-core.md` reference, §The mine family (this plugin
requires nexus core) for the full family table and the shared invariant (bounded unit →
clean-room miners → consolidate → skeptic verify → graded/verified registry) all five members
follow.

What changes here is **who runs the gate**. The other four mines gate post-hoc, in the background,
via a fresh skeptic; this mine's gate mixes mechanical re-execution (Probe) with an **in-loop
human interview** (Phase 4) — because what a data flag or measure *means* is an owner judgment no
automated skeptic can render (read nexus core's `mine-verify-cover` skill → its
`mine-family-core.md` reference, §Fact/judgment doctrine — this plugin requires nexus core —
applied to data: probe results are facts; flag *meanings* are judgments, which route to
interview, never to a fabricated confirmed verdict).

**Execution topology delta** (see the core file's §Execution topology for the shared shape): this
skill's phases run **sequentially in the main session** — the Phase 4 interview is
**operator-in-loop**, the family's one in-loop human gate, and is **never delegable as one
background agent run**; probe batches (Phase 2) may still run as background stages between
interview points.

**Marginal-budget rail** — read nexus core's `mine-verify-cover` skill → its
`mine-family-core.md` reference, §Marginal-budget rail (this plugin requires nexus core;
capture-the-start delta gating; report on every halt, never silently exit green) — applies to
this skill's probe/interview budget exactly as to the other four.

**Registry invariants mapping** (the core file's §Registry invariants, applied to this skill's own
artifacts): never-delete ↔ a construct's provenance origin flips (e.g. `carried({baseline})` →
`data-derived(...)`), the construct itself stays; changelog ↔ this skill's own run report (one per
run, per `references/output-contract.md`); idempotent refresh ↔ BR10 (the Idempotence invariant
above).

**Kickoff checklist** — on a NEW datasource area (one this skill hasn't scanned before), walk
nexus core's `mine-verify-cover` skill → its `mine-family-core.md` reference, §Kickoff checklist
first (this plugin requires nexus core; tool preflight — a resolvable read-only DSN and a working
project runner; expected survival rate; stop-budget; run-report location; stage-model-plan) before
launching a Bootstrap run.

## References

- `references/interview-protocol.md` — question batching template and never-ask-twice mechanics.
- `references/output-contract.md` — provenance ledger schema, run-report template, KB-hub
  write-back conventions pointer.
- `references/probe-catalog.md` — the probe classes, parameters, BR1/BR12 preamble template, and
  the runner contract.
- `references/project-profile.md` — the per-project intake template and the KG pilot's complete
  worked example.
- `references/feedback-ledger.md` — the model-feedback ledger: entry template, recurrence/closure
  rules, disposition vocabulary, area-file map.
