# F10-SkillGapMiner — mine-skill-gaps: the cross-plan `(none)` collector (ninth mine)

**Status:** Ready — architect (Fable 5), 2026-07-18; code-grounded critic returned GO-with-fixes
same day, all findings folded (2 HIGH, 3 MEDIUM, 1 LOW + 2 gap notes — see `## Critic
disposition`).
**Target:** `plugins/nexus` — one new shipped skill `mine-skill-gaps` (+ one family-core routing
line), authored via improve-skills' New-Skill recipe (dev-repo carve-out: full recipe incl. the
Judgment Gate, `improve-skills/SKILL.md:21`); one release-plugin bump at close (**MINOR** — new
capability).
**Binding inputs:** the ratified proposal `docs/proposals/skill-gap-miner-2026-07.md` (Laurentiu,
2026-07-18); the KG pilot recorded there (2026-07-17: 359 `(none)` rows / 72 plans → six clusters
clearing 3+); ADR-59 (the capture fix this complements); ADR-46/47/49 (registry species + triage
precedent); ADR-55 (family membership; routing boundary lives once in the family core); ADR-62
(bundled-executable option for the parser); ADR-63 (this feature's extracted ADR).

## Goal

Turn delivery-artifact exhaust into a verified, evidence-ranked skill-candidate registry.
Discovery only: the miner finds and ranks recurring uncovered work; building or fixing skills
stays with evaluate-skill (diagnose) and improve-skills (apply). The pilot's decisive finding
shapes v1: **collection is the bottleneck, not detection** — the strongest candidates
self-identify by name across plans; the miner is the missing collector, so v1 leans on cheap
clustering plus a registry, not a smarter detector.

## S1 — Discover (two-tier sources)

- **Tier A — pre-flagged (grep, no clustering).** Post-ADR-59 artifacts self-identify. The
  **candidate-of-record is the fielded `## Skill Gaps` lessons entry** (`### {Suggested skill
  name}`, lessons-format); it enters the registry as a named candidate whose native recurrence is
  its `**Evidence:**` provenance-tag count. A plan `gap: {what's missing}` cell (the two-value
  `Gap?` vocabulary, `create-implementation-plan/references/plan-template.md:34`) is **never an
  independent counted candidate** — ADR-59 makes the cell a marker, never the record — it only
  corroborates/strengthens its lessons entry. A `gap:` cell with no matching lessons entry is an
  ADR-59 capture-leak finding the registry surfaces as such, not a counted candidate. One row per
  candidate; zero double-counts between cell and entry.
- **Tier B — unflagged (cluster).** plan.md Skill-Mapping rows whose skill is `(none)`/`None`,
  with their step descriptions → task-shape clustering (what the step does, not its wording),
  cross-plan recurrence counted; threshold **3+ plans**.
- **v1 sources: plan.md + lessons.md only.** implementation.md and review.md are excluded — the
  pilot's six clusters cited neither. Re-entry condition: a run on a different estate surfaces a
  confirmed cluster whose only evidence lives in one of them.
- **Parser posture:** tolerant of pre-F5 estates (the KG pilot's tables predate the two-value
  vocabulary — `(none)` spelling variants, freeform `Gap?` cells). The table parser may ship as a
  bundled script invoked in place per ADR-62 — developer's call; the clustering stays model-tier.

## S2 — Verify (skeptic)

A fresh-context skeptic re-reads each Tier-B cluster's source rows and confirms they are one
task-shape; coincidental groupings die here (family precedent: extraction without verification
invents virtues). Tier-A entries skip cluster-verification but get a citation-resolution check —
the cited plan/lessons rows exist and say what the entry claims. Every surviving row carries the
skeptic's excerpt (F6 R2 pattern: verify evidence lands in registry rows).

## S3 — Emit (the registry — new species, ADR-63)

`docs/skill-gaps/registry.md` in the consumer repo. Row fields: candidate skill name · kind ·
recurrence (N rows / M plans) · source citations (slug + step, or lessons entry) · repo (single
value in v1; the field is what keeps cross-repo merge format-compatible) · skeptic excerpt ·
`last_verified` · status (`candidate | confirmed | building | built | rejected | superseded`).
Ranked by recurrence — plan count first, row count as tiebreak; no cost weighting in v1 (see
Decisions). Registry invariants carried from ADR-43/45/49 via the family core's registry rules:
one canonical set over linked evidence; per-row `last_verified` plus an **append-only changelog**
entry on every write; a re-run refreshes — strengthens or updates existing rows keyed on the
delta since `last_verified`, never forks duplicates; a kill marks the row `superseded` with a
reason, never silently rewrites it.

## S4 — Route (owner-triaged, never auto)

The registry is evidence, not an auto-route (ADR-46/47 posture). The owner triages
`candidate → confirmed`; a confirmed candidate routes to improve-skills' New-Skill recipe through
that skill's existing channel rules (project-local build in the consumer repo; plugin-bound
candidates via `docs/plugin-feedback/`). The miner never builds skills and never invokes
improve-skills itself. **Learner fence:** the learner's contract (lessons.md + comm-logs,
2-occurrence promotion, approval gate) is untouched; when a candidate also exists as a
learner-`[TRACKED]` item, the registry row links that entry — strengthen-don't-duplicate, one
record per candidate.

## Family membership

**Ninth mine** (corrected at critic review: the family core is already "eight-member" with
`mine-verify-flows` as the eighth — `mine-family-core.md:3`): joins by **name and shape**
(discover → verify → registry → owner triage), **not** the full method contract — no stack
adapter, no ADR-60 capability-contract obligations (the unit is markdown artifacts; there is no
toolchain). Precedent: mine-reference-model, the family's toolchain-free member.

Concrete landing sites in `mine-verify-cover/references/mine-family-core.md`: the
`## The mine family` **descriptive table gains a 9th row** (unit = one repo's delivery-artifact
estate) and the "eight-member" header count updates; the `## Routing boundary` section
(design↔algorithm only) is untouched. The member-count sweep also covers the five siblings that
assert "full 8-row family table / all eight members": `mine-verify-flows/SKILL.md:16`,
`mine-verify-cover/SKILL.md:473`, `mine-reference-model/SKILL.md:28`, `mine-design/SKILL.md:25`,
`mine-algorithm/SKILL.md:26`.

**Execution topology (disclosed latitude):** single-session run. The S2 skeptic MUST be a
fresh-context subagent (clean-room posture); Tier-B clustering may run inline or as a subagent.
The family core's full staged-orchestration mandate is deliberately not adopted
(shape-not-contract).

## Non-goals (recorded so they aren't re-litigated)

- Creating or fixing skills — evaluate-skill / improve-skills own that split.
- Cross-repo merge machinery — the row format is merge-ready; the merge itself is future work.
- implementation.md / review.md mining — re-entry condition in S1.
- Learner changes — its input contract stays lessons.md + comm-logs.

## Acceptance summary

**Grep-checkable:** the skill passes the shipped skill-lint (born-compliant, ADR-23); the
family-core table carries the 9th row AND all member-count sites list nine — across the six files
enumerated under Family membership, `grep -r 'eight-member|all eight|8-row'` returns 0 stale
hits; the skill's registry template names every S3 row field (`last_verified`, repo, skeptic
excerpt included) plus the append-only changelog rule; the miner's text contains no
improve-skills invocation — routing is a recommendation the owner executes.
**Run gates:** *(Tier B — KG golden fixture)* a re-run on knowledge-gateway re-finds the two
author-named clusters **by name** (orchestrator decorator/state wiring; raw-Npgsql persistence)
plus ≥ 4 total clusters at the 3+ threshold — keyed to the self-identifying candidates, not exact
reproduction of borderline model groupings — and emits `docs/skill-gaps/registry.md` with
resolving citations (spot-check ≥ 3 rows against the cited plans). *(Tier A — post-ADR-59
fixture)* a run over this repo's own `docs/specs/` estate yields the fielded `## Skill Gaps`
entries as candidates-of-record with `gap:` cells folded as corroboration only — one row per
candidate, zero double-counts.
**Judgment:** evaluate-skill findings resolved — CRITICAL/HIGH fixed or waived with a reason (the
improve-skills done-condition, not a bare verdict word); Judgment Gate passed at authoring; omni
twin regenerated and committed per convention at close.

## Decisions (architect, disclosure per plan-template)

- **Two-tier source split (net-new beyond the proposal).** ADR-59's vocabulary makes recognized
  gaps mechanically greppable; clustering them would pay model cost to rediscover what is already
  named. (Two-way door; rejected: uniform clustering of all sources.)
- **implementation.md AND review.md dropped from v1** (the proposal left review.md open; the
  pilot answered — zero of six clusters cited either), with a written re-entry condition.
  (Two-way door; rejected: keep all four sources — cost with no evidenced yield.)
- **Threshold 3+ for Tier B vs the learner's 2+ — deliberate asymmetry.** Raw unflagged rows are
  noisier than curated lessons; Tier A carries its native count and takes no 3+ bar. (Two-way
  door; rejected: unify at 2+ — lowers the bar exactly where input noise is highest.)
- **Registry is its own species at `docs/skill-gaps/registry.md`**, not a tech-debt section —
  different consumer (skill authoring vs the refactoring lane) and different lifecycle. (Two-way
  door; rejected: co-location in `docs/tech-debt/` — couples two refresh cadences and consumers.)
- **Shape-not-contract family membership** — no adapter, no ADR-60 obligations. (Two-way door;
  rejected: full method contract — imposes toolchain machinery on a markdown miner.)
- **Single-repo v1, repo-field-carrying rows** (proposal Unresolved #4 resolved as
  format-readiness, no machinery now).
- **Ninth, not eighth** (critic HIGH-1 folded — a fact correction, not a preference: the live
  family core is "eight-member" with mine-verify-flows as the eighth; the stale ordinal came from
  reading the ADR register alone). Corrected in spec + ADR-63 + contents bullet; the member-count
  sweep is now an acceptance line.
- **Tier-A candidate-of-record = the lessons entry; `gap:` cells corroborate only** (critic
  HIGH-2 folded): ADR-59 already makes the cell "never the record"; counting cells independently
  double-counts the same gap. (Two-way door; rejected: cells as independent counted candidates.)
- **Rank = recurrence only in v1** (critic MEDIUM folded): "step cost" has no source — no
  cost/effort field exists in the plan Skill-Mapping table or any cited artifact. (Two-way door;
  rejected: recurrence × step cost — uncomputable as specified; a cost proxy can join when one is
  actually defined.)

## Critic disposition (2026-07-18, code-grounded, verdict GO-with-fixes — all folded)

| Finding | Disposition |
|---|---|
| HIGH-1 "eighth mine" collides with the live eight-member family core (mine-verify-flows is 8th); no "routing table" exists; member-count cascade spans 6 files | Fixed — ninth everywhere (spec + ADR-63 + contents bullet); exact landing sites named (§The mine family table 9th row; Routing boundary untouched); 6-file count sweep in acceptance |
| HIGH-2 Tier A unvalidated by the KG fixture (predates the ADR-59 vocabulary) and a `gap:` cell cannot carry a native count — double-count risk | Fixed — candidate-of-record rule (lessons entry counts, cells corroborate; orphan cells = capture-leak findings); Tier-A run gate added on this repo's post-F5 estate |
| MEDIUM registry schema omitted `last_verified` + append-only changelog; no `superseded` status | Fixed — fields + invariants added to S3 and acceptance |
| MEDIUM "re-finds ≥ six clusters" not pass/fail under model-tier clustering (6th cluster is borderline at 3 plans) | Fixed — gate keyed to the two author-named clusters by name + ≥ 4 total at threshold |
| MEDIUM "recurrence × step cost" has no defined cost source | Fixed — v1 ranks by recurrence only; Decisions row added |
| LOW "evaluate-skill ACCEPT" implies a verdict evaluate-skill may not emit | Fixed — reworded to the improve-skills done-condition |
| Gap: execution topology unstated (family core mandates staged orchestration; shape-not-contract leaves latitude) | Fixed — disclosed-latitude paragraph (fresh-context skeptic mandatory; no staged orchestration) |
| Gap: conflicting-pattern retrofit check | No change needed — verified clean by the critic (`docs/skill-gaps/` collision-free; improve-skills posture matches the reference-model precedent) |

## Effort / sequencing

Single skill, single pass: **med**. Author via the New-Skill recipe → skill-lint → the KG
golden-fixture run → close (one MINOR bump, omni sync). No spike: no unresolved mechanism — the
pilot already validated the parse + cluster method, and ADR-62 already settled how a bundled
parser would ship if the developer chooses one.
