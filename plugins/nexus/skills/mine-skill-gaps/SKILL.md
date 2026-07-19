---
name: mine-skill-gaps
description: "Sweep ONE repo's delivery-artifact estate for recurring uncovered work and emit a skeptic-verified, evidence-ranked skill-candidate registry — two-tier discovery (pre-flagged lessons gap-entries plus cross-plan clustering of unflagged `(none)` skill-mapping rows), a fresh-context skeptic that kills coincidental clusters, and an owner-triaged registry at docs/skill-gaps/registry.md that feeds improve-skills' apply-half (evaluate-skill is a sibling diagnostic, not a consumer). Discovery only — it never builds or fixes skills and never auto-routes. Use when a repo's docs/specs delivery estate needs a skill-gap sweep, when recurring `Skill: None` / `(none)` rows are suspected across plans, or when the plan-time Gap column and the learner miss cross-plan repetition no single vantage point can see. Not a debt mine (mine-verify-repo), a class miner (mine-verify-cover), a spec miner (mine-from-spec), nor a judge or builder of existing skills (evaluate-skill / improve-skills)."
user-invocable: true
---

# Mine skill gaps (cross-plan `(none)` collector)

Point this at ONE repo's `docs/specs/*/delivery/` estate. It turns delivery-artifact exhaust into
a **verified, evidence-ranked skill-candidate registry** — `docs/skill-gaps/registry.md` in that
repo — answering a question no single plan author or the learner can: *what uncovered work recurs
across plans often enough to deserve a skill?*

**Discovery only.** The miner finds and ranks recurring uncovered work; building or fixing skills
stays with `evaluate-skill` (diagnose) and `improve-skills` (apply). The decisive pilot finding
shapes v1: **collection is the bottleneck, not detection** — the strongest candidates
self-identify by name across plans, so v1 leans on cheap clustering plus a registry, not a smarter
detector.

This is the **ninth mine** — the delivery-estate sibling of the mine family, joining by **name and
shape** (discover -> verify -> registry -> owner triage), **not** the full method contract: the
unit is markdown artifacts, so there is no stack adapter, no toolchain, and no capability-contract
obligation (precedent: `mine-reference-model`, the family's toolchain-free member). Its code-side
counterpart is `mine-skill-candidates` — the same registry, the same triage surface, a different
unit (code + git history instead of delivery artifacts); see its `source` field and the
Anti-patterns cross-reference below for where the two skills meet. Read
`../mine-verify-cover/references/mine-family-core.md` §The mine family for the family table and the
shared invariant (bounded unit -> clean-room extraction -> skeptic verify -> verified registry) the
family follows.

## The pipeline

```
S1 Discover  two tiers over docs/specs/*/delivery/ (v1 sources: plan.md + lessons.md only)
             Tier A  grep pre-flagged lessons `## Skill Gaps` entries — candidates of record
             Tier B  collect unflagged `(none)` rows + step text, then task-shape cluster them
                     (group by what the step DOES, not its wording; count cross-plan recurrence)
S2 Verify    a fresh-context skeptic subagent re-reads each cluster's source rows -> one task-shape,
             or the cluster dies; Tier-A entries get a citation-resolution check instead
S3 Emit      docs/skill-gaps/registry.md — one row per candidate, ranked by recurrence, every row
             carrying its skeptic excerpt; append-only changelog on every write
S4 Route     the owner triages candidate -> confirmed; a confirmed candidate is routed by the owner
             to improve-skills' New-Skill recipe (the miner never routes automatically)
```
(Clustering is the back half of S1's Tier-B discovery — it has no separate section by design.)

## S1 — Discover (two-tier sources)

The estate splits into a pre-flagged tier that is already greppable and an unflagged tier that must
be clustered. Both draw on **plan.md and lessons.md only** in v1.

**Tier A — pre-flagged (grep, no clustering).** Post-standardization artifacts self-identify. The
**candidate of record is the fielded `## Skill Gaps` lessons entry** (`### {Suggested skill name}`
per `lessons-format`); it enters the registry as a named candidate whose native recurrence is its
`**Evidence:**` provenance-tag count. A plan `gap: {what is missing}` skill-mapping cell (the
two-value `Gap?` vocabulary) is **never an independently counted candidate** — the cell is a marker,
never the record — it only corroborates and strengthens its matching lessons entry. A `gap:` cell
with **no** matching lessons entry is a **capture-leak finding** the registry surfaces as such (a
gap the estate noticed but never logged), not a counted candidate. One row per candidate; zero
double-counts between a cell and its entry.

**Tier B — unflagged (cluster).** plan.md Skill-Mapping rows whose skill is `(none)` or `None`,
together with their step descriptions, are grouped by **task-shape** — what the step actually does,
not how it is worded — and cross-plan recurrence is counted. Threshold: a cluster enters the
registry only at **3 or more plans**. (The bar is higher than the learner's 2-occurrence promotion
because raw unflagged rows are noisier than curated lessons; Tier A carries its native count and
takes no 3-plan bar.)

**v1 sources: plan.md + lessons.md only.** implementation.md and review.md are excluded — the pilot's
clusters cited neither. Re-entry condition: a run on a different estate surfaces a confirmed cluster
whose only evidence lives in one of them.

**Parser posture.** The table read is **model-tier and tolerant** of pre-standardization estates —
`(none)` spelling variants, freeform `Gap?` cells, tables that predate the two-value vocabulary.
Tolerance is why v1 reads model-tier rather than shipping a brittle regex parser; a bundled in-place
parser script is an available option, taken only if a future estate's tables are uniform enough to
make a deterministic parse cheaper than a tolerant read. The **clustering stays model-tier** either
way — task-shape grouping is judgment, not a parse.

## S2 — Verify (skeptic)

A **fresh-context skeptic re-reads each Tier-B cluster's source rows** and confirms they are one
task-shape; coincidental groupings die here (the family precedent: extraction without verification
invents virtues). Tier-A entries skip cluster-verification but get a **citation-resolution check** —
the cited plan and lessons rows exist and say what the entry claims. Every surviving row carries the
skeptic's excerpt (the verify-evidence-lands-in-the-row pattern). Read
`../mine-verify-cover/references/mine-family-core.md` §Skeptic protocol for the clean-room posture
this reuses; the mine-skill-gaps unit is artifact text (a re-read, not a runnable command), so a
verdict here is a reading claim carrying the re-read excerpt, not a re-executed command.

The skeptic **writes its per-cluster verdict and excerpt to a scratch file** the run reads back
before authoring any registry row — a row is never composed from the subagent's returned message
alone (disk-verify, never trust the final message). A row whose skeptic excerpt is empty, a
claim-echo, or carrying no re-read content (no cited line, no quoted artifact) is **dropped**,
never recorded as verified — the skeptic actually re-read the cited rows, or the candidate does not
enter the registry.

## S3 — Emit (the registry)

Write `docs/skill-gaps/registry.md` in the swept repo. One row per candidate:

```
| name | kind | source | recurrence | citations | repo | skeptic excerpt | last_verified | status |
|------|------|--------|-----------|-----------|------|-----------------|---------------|--------|
| {candidate skill name} | gap or fix | artifact or code | {N rows / M plans} | {slug + step, or lessons entry} | {repo} | {re-read excerpt} | {YYYY-MM-DD} | {status} |
```

- **name** — the candidate skill name (a Tier-A entry brings its own `### {Suggested skill name}`).
- **kind** — `gap` (no skill covers it) or `fix` (an existing skill under-covers it).
- **source** — values `artifact | code`. Optional-with-default `artifact`: every pre-existing row is
  `artifact` by definition (this skill's own rows, backward compatible); `code` marks a row from the
  sibling `mine-skill-candidates` (code + git history rather than delivery artifacts). A candidate
  corroborated by both mines merges into ONE strengthened row valued `code+artifact` —
  strengthen-don't-duplicate, never two rows for one
  candidate.
- **recurrence** — `{N rows / M plans}`. **Ranked by recurrence: plan count first, row count as
  tiebreak.** For a Tier-A candidate, `M` = the distinct plans in its `**Evidence:**` provenance tag
  and `N` = its entry/cell count, so a pre-flagged entry sorts on the same key as a Tier-B cluster.
  No cost weighting in v1 (no cost or effort field exists in any swept artifact to weight on).
- **citations** — source citations that resolve: for Tier B, `{slug} + {step}` per cited plan; for
  Tier A, the lessons entry (slug + `### {name}`).
- **repo** — the swept repo (single value in v1). The field is what keeps the row format-compatible
  with a future cross-repo merge — no merge machinery ships now.
- **skeptic excerpt** — the re-read excerpt the S2 skeptic carried; a row without one is dropped.
- **last_verified** — the date this row was last verified (per-row, re-stamped on every refresh).
- **status** — `candidate | confirmed | building | built | rejected | superseded`.

**Registry invariants** (carried from the family's registry rules — read
`../mine-verify-cover/references/mine-family-core.md` §Registry invariants for the lineage): one
canonical set over linked evidence; per-row `last_verified`; every write **appends a changelog
entry** (an append-only changelog section at the foot of the registry — a dated line per write, never
a silent rewrite); a re-run **refreshes** — it strengthens or updates an existing row keyed on the
delta since `last_verified`, never forks a duplicate; rows are **never deleted** — a killed candidate
flips to `superseded` with a reason, the record stays. A re-run against unchanged input is idempotent.

**Capture leaks** (orphan `gap:` cells with no matching lessons entry — Tier A) are **not counted
candidates**, so they do not belong in the ranked candidate table. Surface them in a dedicated
`## Capture leaks` subsection at the foot of the registry (one line per orphan cell: slug + step +
the missing-gap text) — a standing to-do for the estate to log the gap, distinct from a candidate.

**Anti-patterns cross-reference.** The registry may also carry a `## Anti-patterns
(do-not-propagate)` section — recurring code shapes the sibling `mine-skill-candidates` found to be
debt, not a good pattern to name a skill after. That section is emitted and owned by
`mine-skill-candidates`; this skill neither writes it nor mirrors its row template here.

## S4 — Route (owner-triaged, never auto)

The registry is **evidence, not an auto-route**. The owner triages a `candidate` to `confirmed`; a
confirmed candidate is then routed **by the owner** to `improve-skills`' New-Skill recipe through
that skill's existing channel rules (a project-local build in the consumer repo; a plugin-bound
candidate via `docs/plugin-feedback/`). This miner **never builds skills and never routes to
`improve-skills` itself** — routing is a recommendation the owner executes.

**Learner fence.** The learner's contract (lessons.md plus comm-logs, 2-occurrence promotion, its
approval gate) is untouched by this skill. When a candidate also exists as a learner-`[TRACKED]`
item, the registry row **links** that entry rather than restating it — strengthen-don't-duplicate,
one record per candidate.

## Execution topology

**Single-session run** (disclosed shape-not-contract latitude): the family core's full staged
background-orchestration mandate is deliberately **not** adopted here — the unit is a bounded set of
markdown files, not a codebase needing parallel clean-room miners. The one hard requirement: the S2
skeptic **MUST be a fresh-context subagent** (a `general-purpose` agent carrying the skeptic prompt,
dispatched at the session's model tier or a deliberately named one), never the same context that
clustered — self-verification is the invented-cluster failure mode. Tier-B clustering may run inline
or as a subagent. There is one skeptic pass over the whole run, so concurrency is one — no fan-out cap
to state. Read
`../mine-verify-cover/references/mine-family-core.md` §Execution topology for the clean-room
rationale; only the fresh-skeptic clause binds here.

## Safety rails

- **Read-only over the estate; one estate write.** The swept artifacts are read-only; the sole
  write **into the swept repo** is `docs/skill-gaps/registry.md` (plus its changelog). No artifact
  is edited. (The S2 skeptic's verdict scratch file is orchestrator-side scratch, outside the
  estate — not an estate write.)
- **No counted candidate without recurrence evidence.** Tier B needs 3 or more plans; Tier A needs a
  fielded lessons entry with its provenance count. A bare `gap:` cell never carries a count.
- **The skeptic excerpt is mandatory.** A surviving row carries the re-read excerpt or is dropped —
  the verify gate is not a formality.
- **Never auto-route and never double-count.** Routing to `improve-skills` is the owner's; a `gap:`
  cell and its lessons entry are one candidate, one row.
- **Marginal-budget rail.** Gate on the spend delta, not the shared-pool absolute — capture the
  start spend and halt when this run's marginal spend exceeds its ceiling (read
  `../mine-verify-cover/references/mine-family-core.md` §Marginal-budget rail; the core kickoff
  checklist's stop-budget declaration applies to every member).
- **Report on halt.** A run that stops early (budget, unreachable estate) writes a report naming the
  stop reason and never exits silently green.
- **Not rollbackable.** Rows are never deleted — a wrong row is corrected by flipping `status` to
  `superseded` or `rejected` with a reason, never removed; the changelog keeps the write history.

## What this skill does NOT do

- **Build or fix skills** — `evaluate-skill` (diagnose) and `improve-skills` (apply) own that split;
  this miner only ranks candidates for them.
- **Auto-route a candidate** — the owner triages and routes; the registry is evidence, not a trigger.
- **Change the learner's input contract** — lessons.md plus comm-logs stays the learner's; this skill
  links a `[TRACKED]` item, never re-owns it.
- **Mine implementation.md or review.md** — excluded from v1 sources (re-entry condition in S1).
- **Merge across repos** — the `repo` field keeps rows merge-ready; the merge itself is future work.
- **Adopt the full mine-family method contract** — no stack adapter, no toolchain, no
  capability-contract obligation (name-and-shape membership only).

## Relationship to other skills

See `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family table.

| Skill | Relationship |
|-------|-------------|
| `improve-skills` | **Consumer** — a confirmed candidate is routed by the owner to its New-Skill recipe. This miner recommends the route; it never invokes `improve-skills`. |
| `evaluate-skill` | Sibling diagnostic (the diagnose half) — it judges *existing* skills; this miner discovers *absent* ones. Different input, method, output. |
| `mine-verify-repo` | Family sibling debt mine — a different unit (one repo's code debts) and output (`docs/tech-debt/`); this miner's unit is the delivery-artifact estate. |
| the learner | **Fenced** — its lessons.md + comm-logs contract is untouched; a registry row links a `[TRACKED]` learner item, never re-owning it. |
