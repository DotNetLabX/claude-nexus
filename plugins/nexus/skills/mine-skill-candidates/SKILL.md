---
name: mine-skill-candidates
description: "Sweep ONE repo's code and git history for recurring patterns worth turning into skills — co-change file-sets across capability-adding commits, structural recurrence across units, plus a hand-authored Gaps table as pre-named seeds — verified by a fresh-context skeptic and a tech-debt/reference-model health gate splitting survivors into skill candidates and an anti-pattern (do-not-propagate) list, both written to the repo's docs/skill-gaps/registry.md (mine-skill-gaps stays schema owner; this skill owns only the code source value and the anti-patterns section). Discovery only — never builds/fixes skills, never auto-routes. Use when code and git history need a pattern sweep, when a thin delivery estate makes mine-skill-gaps near-zero-signal (no specs/plans, or zero existing skills), or when a rewrite lane needs a do-not-regenerate list. Not an artifact-estate miner (mine-skill-gaps), a whole-repo debt mine (mine-verify-repo), or a class miner (mine-verify-cover)."
user-invocable: true
---

# Mine skill candidates (code + git-history pattern miner)

Point this at ONE repo's code and git history. It is the **supply-side complement** to
`mine-skill-gaps`: where that sibling reads delivery-artifact exhaust (plans, lessons — "work we
keep doing with no skill"), this mine reads the code and its history directly — "patterns the repo
already repeats." It exists because artifact mining returns near-zero signal on a repo with a thin
delivery estate and zero skills: every row would read as a gap, with nothing to corroborate it.

**Discovery only.** Building or fixing a skill stays with `improve-skills`; judging an existing one
stays with `evaluate-skill`. **Dual output** — skill candidates AND an anti-pattern list (recurring
shapes that are debt, recorded so a rewrite or refactoring lane knows what NOT to regenerate).
Skills are recipes, not classes: the unit of mining is the **recurring cross-file shape**, never a
single class — why this does not bolt onto `mine-verify-cover`.

This is the **tenth mine** — joining the family by **name and shape** (discover -> verify ->
registry -> owner triage), not the full method contract: no stack adapter, no capability-contract
obligation (free tooling only: git, Code Maat, grep/ctags; graphify optional, never a
prerequisite). Read `../mine-verify-cover/references/mine-family-core.md` §The mine family for the
full 10-row family table and the shared invariant (bounded unit -> clean-room miners -> consolidate
-> skeptic verify -> graded registry) all ten members follow.

## The pipeline

```
S1 Discover  Lens A (co-change): bot-filtered git log + Code Maat coupling over a declared window ->
             a file-set recurring across 3+ capability-adding commits is a candidate recipe.
             Lens B (structural recurrence): 3+ units instantiating the same member/signature
             skeleton -> a candidate recipe; graphify-out/ accelerates clustering when present,
             grep/ctags name-and-signature clustering is the fallback (never a prerequisite).
             Seed join: an architecture-doc Gaps table (when the swept repo has one) joins as
             pre-named candidates for the lenses to corroborate or challenge.
S2 Verify    a fresh-context skeptic subagent re-reads each candidate's cited evidence (the
             commits Lens A cites, the file:line instances Lens B cites) and confirms one coherent
             pattern; then the health gate cross-checks survivors against the swept repo's
             docs/tech-debt/ registry and reference model.
S3 Emit      docs/skill-gaps/registry.md in the swept repo — the same registry mine-skill-gaps
             writes. New `source: code` rows plus the `## Anti-patterns (do-not-propagate)`
             section (this skill's deltas only; mine-skill-gaps keeps schema ownership).
S4 Route     the owner triages candidate -> confirmed; a confirmed candidate is routed by the
             owner to improve-skills' New-Skill recipe (this miner never routes automatically).
```

## S1 — Discover (two lenses + a hand-authored seed join)

Both lenses are **cheap collectors, not smart detectors** — the sibling mine's pilot lesson holds
here too: collection is the bottleneck, not detection. Clustering judgment stays model-tier even
where a lens's collection step is scriptable.

**Lens A — co-change (git history).** Reuse `mine-verify-repo`'s deterministic-layer posture: the
bot filter, the exact `git log` / Code Maat invocations, and the tool-availability preflight all
live in `../mine-verify-repo/references/metric-layer.md` — read it rather than re-deriving the
commands here (one fact, one owner). That runbook does not fix a time window; **this mine declares
its own** — the commit range to scan (e.g. full history, or a date-bounded slice for a large repo)
is a run-time choice this skill states plainly in its run report before mining starts, so the run
stays reproducible. A **file-set that recurs across 3 or more capability-adding commits** — a
commit that adds a new public symbol, route, or config entry, as distinct from a pure fix, refactor,
or format commit — is a candidate recipe: for example, if every "add a task type" commit touches
`ts_task + ts_scheduler + core_adapter + ts_types`, that file-set IS the recipe. Every candidate
carries: an inferred name, the commit citations, and the file-set.

**Lens B — structural recurrence.** **3 or more units** instantiating the same member/signature
skeleton and the same wiring (e.g. every detector class carries init/detect/release plus a net and
a decrypt step) is a candidate recipe. `graphify-out/` — communities plus fan-in/out — is an
accelerator when present, never a prerequisite; the fallback is name/signature clustering at the
grep/ctags tier. Every candidate carries: an inferred name, the instance citations (`file:line` per
instance), and the shared skeleton.

**Lens-parser posture.** The git/Code Maat parse and the grep/ctags clustering pass run as a prose
recipe against the runbooks above — no bundled parser script ships with this skill. The clustering
judgment is model-tier either way; a deterministic parser is future work only if a target repo's
history is uniform enough to make one cheaper than the prose read (the same tolerant-by-default
posture `mine-skill-gaps` took for its own table read).

**Hand-authored seed join.** When the swept repo's architecture doc carries a Gaps table (a
hand-maintained "recipes we know we're missing" section — the generic schema is `Gap | What's
Missing | Suggested Skill Name`; a code-shaped gap often fills "What's Missing" with a file or
module list, but the column is free prose, not a guaranteed file-list), those rows join S1 as
**pre-named candidates**. The lenses corroborate or challenge them; they are never re-discovered
from scratch. A seed **without** lens corroboration survives only as a `candidate` row explicitly
marked `uncorroborated` — its citation stays the hand-authored Gaps-table entry, real knowledge
but unverified by this mine. **Only lens-corroborated candidates count toward this skill's run
gate** — an uncorroborated seed row never substitutes for lens evidence, closing the loophole where
a run with both lenses broken would otherwise read as passing.

## S2 — Verify (skeptic + health gate)

A **fresh-context skeptic subagent** (mandatory — clean-room posture, never the same context that
collected) re-reads each candidate's actual evidence: Lens A's cited commits, Lens B's cited
`file:line` instances. It confirms one coherent pattern; coincidental clusters die here. This
follows the family's general must-RUN skeptic protocol — read
`../mine-verify-cover/references/mine-family-core.md` §Skeptic protocol for the CONFIRMED / WRONG /
IMPRECISE verdict grammar, the vacuous-evidence check, and the merged-row audit note this reuses
without a carve-out (Lens A's commits and Lens B's `file:line` instances are both re-executable
evidence, unlike the artifact-text re-read `mine-skill-gaps` carries).

**The health gate** runs next — the check the artifact-side sibling does not need, because
recurrence in an established repo includes debt shapes as well as good ones. Every surviving
candidate is cross-checked against the swept repo's `docs/tech-debt/` registry and
`docs/reference-model.md` (when present):

- **Recurring AND debt-implicated** -> routed to the anti-pattern list, not the skill candidates.
- **Recurring AND healthy** -> skill candidate.
- **No tech-debt or reference-model signal either way** -> passes as a candidate, with the check
  recorded as `unopposed`.

Every surviving row — candidate or anti-pattern — carries the skeptic's excerpt; a row without one
is dropped, never recorded as verified (the registry's evidence-gate invariant, family-wide).

## S3 — Emit (same registry, extended — deltas only)

Write into the **existing registry**: `docs/skill-gaps/registry.md` in the swept repo — the same
file `mine-skill-gaps` writes. **`mine-skill-gaps` remains the canonical schema owner.** This skill
never restates or mirrors the full row template — it owns exactly two deltas, cross-referenced from
the owner, never duplicated:

**Emit incrementally, per candidate that clears S2 — never batch the whole run.** A candidate's row
is complete the moment its skeptic excerpt lands (S2), so write it then, not after every candidate
in the run has cleared. A run that halts mid-way (budget, an unreachable repo) still leaves every
already-verified candidate usable in the registry — no "finalize what exists" gap, the natural
per-candidate write already covers it.

- The **`source: code`** value on its own rows (the schema's `source` column lives in
  `mine-skill-gaps`, positioned immediately after `kind`; this skill stamps `code` where that
  sibling stamps `artifact`).
- The **`## Anti-patterns (do-not-propagate)`** section, owned and defined here:

```
## Anti-patterns (do-not-propagate)

| pattern | instances | tech-debt row | last_verified | status |
|---------|-----------|---------------|---------------|--------|
| {inferred shape name} | {file:line citations} | {swept repo's tech-debt row id + one-line why} | {YYYY-MM-DD} | {candidate|confirmed|rejected|superseded} |
```

- **pattern** — the recurring shape's inferred name.
- **instances** — the Lens B `file:line` citations (or the Lens A commit citations, for a
  co-change-implicated anti-pattern).
- **tech-debt row** — the swept repo's `docs/tech-debt/` row that implicated the shape as debt; an
  anti-pattern row without a resolving tech-debt citation does not belong in this section.
- **last_verified** / **status** — same per-row semantics and status vocabulary as the
  skill-candidate rows (carried invariant, see below) — `candidate | confirmed | building | built |
  rejected | superseded`; `building`/`built` describe a routed skill under construction so rarely
  apply to a debt shape, but `rejected` matters here: a human triager can overturn the health gate
  (a shape flagged debt-implicated that triage judges by-design) without deleting the row.

**Cross-corroboration merge rule.** A candidate found by both this mine and `mine-skill-gaps` merges
into ONE strengthened row citing both evidence classes — strengthen-don't-duplicate, the family
invariant, and the reason both miners share one registry rather than keeping separate triage
surfaces. The merged row's `source` value is `code+artifact` (neither single value alone would
disclose that both mines corroborated it).

**Carried invariants** (defined and owned by `mine-skill-gaps` — read
`../mine-skill-gaps/SKILL.md` §S3 — Emit for the canonical statement, stated here as a pointer, not
restated): one canonical set over linked evidence; per-row `last_verified`; every write appends a
changelog entry; a re-run refreshes the delta since `last_verified` rather than forking a duplicate;
a killed row flips to `superseded` with a reason rather than being deleted. **Code-row citations
must resolve**: a commit SHA cited by Lens A exists in the swept repo's history; a `file:line`
cited by Lens B exists at the cited revision — spot-checked before any row is trusted.

## S4 — Route (owner-triaged, never auto)

Identical posture to the artifact-side sibling: the registry is evidence, not an auto-route. The
owner triages a `candidate` row to `confirmed`; a confirmed candidate is then routed **by the
owner** to `improve-skills`' New-Skill recipe through that skill's existing channel rules (a
project-local build in the swept repo; a plugin-bound candidate via `docs/plugin-feedback/`). This
miner **never builds skills, never edits code, and never routes to `improve-skills` itself** —
routing is a recommendation the owner executes.

Anti-pattern rows are **evidence handed to the swept repo's design artifacts** — a rewrite lane's
target design, a refactoring plan's do-not-regenerate list — never auto-applied. Recognizing a
recurring shape as debt is not a mandate to delete or rewrite it; that decision stays with the
repo's own architects.

## Execution topology

**Single-session run** (disclosed shape-not-contract latitude): the family core's full staged
background-orchestration mandate is deliberately **not** adopted here, the same latitude
`mine-skill-gaps` takes — the swept evidence (a bounded set of commits and code instances) does not
need parallel clean-room miners the way a whole-codebase debt sweep does. The one hard requirement:
the S2 skeptic **MUST be a fresh-context subagent**, never the same context that collected — the
family's self-verification failure mode. Lens A and Lens B collection may each run inline or as a
`general-purpose` subagent; there is one skeptic pass over the whole run, so concurrency is one — no
fan-out cap to state. Read
`../mine-verify-cover/references/mine-family-core.md` §Execution topology for the clean-room
rationale; only the fresh-skeptic clause binds here.

## Safety rails

- **Read-only over the swept repo; one write.** Code and history are read-only; the sole write
  **into the swept repo** is `docs/skill-gaps/registry.md` (plus its changelog). No source file is
  edited, no refactor is applied.
- **No counted candidate without lens-corroborated recurrence.** Both lenses need 3 or more
  citations (commits or instances); a hand-authored seed with no lens corroboration is marked
  `uncorroborated` and never counts toward the run gate.
- **The skeptic excerpt is mandatory.** A surviving row — candidate or anti-pattern — carries the
  re-read excerpt or is dropped; the health gate is not a formality.
- **Never auto-route and never double-count.** Routing to `improve-skills` is the owner's; a
  candidate corroborated by both this mine and `mine-skill-gaps` is one row, strengthened, not two.
- **Marginal-budget rail.** Gate on the spend delta, not the shared-pool absolute — capture the
  start spend and halt when this run's marginal spend exceeds its ceiling (read
  `../mine-verify-cover/references/mine-family-core.md` §Marginal-budget rail).
- **Report on halt.** A run that stops early (budget, an unreachable repo, a missing toolchain)
  writes a report naming the stop reason and never exits silently green.
- **Not rollbackable.** Rows are never deleted — a wrong row is corrected by flipping `status` to
  `superseded` or `rejected` with a reason; the changelog keeps the write history.

## What this skill does NOT do

- **Build or fix skills** — `improve-skills` (apply) and `evaluate-skill` (diagnose) own that split;
  this miner only surfaces candidates for them.
- **Auto-route a candidate** — the owner triages and routes; the registry is evidence, not a
  trigger.
- **Disposition class-level coverage or mine business rules** — that is `mine-verify-cover`'s and
  `mine-verify-repo`'s ground, not this mine's; this mine never asserts behavior, only recurrence.
- **Adopt the full mine-family method contract** — no stack adapter, no capability-contract
  obligation (name-and-shape membership only, the same latitude `mine-skill-gaps` takes).
- **Merge across repos** — the schema's `repo` field (owned by `mine-skill-gaps`) keeps rows
  merge-ready; the merge itself is future work, out of scope here as it is for the sibling.

## Relationship to other skills

See `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family
table.

| Skill | Relationship |
|-------|-------------|
| `mine-skill-gaps` | **Family sibling and schema owner** — the demand-side counterpart (artifact estate vs. this mine's code and history). `mine-skill-gaps` owns the canonical registry schema; this skill owns only the `code` source value and the anti-patterns section as deltas. A candidate found by both merges into one strengthened row. |
| `improve-skills` | **Consumer (route target only)** — a confirmed candidate is routed by the owner to its New-Skill recipe. This miner recommends the route; it never invokes `improve-skills`. |
| `evaluate-skill` | Sibling diagnostic (the diagnose half) — it judges *existing* skills; this miner discovers *absent* ones from code and history. Different input, method, output. |
| `mine-verify-repo` | Tooling precedent — Lens A reuses its bot-filtered git-log/Code Maat metric-layer runbook rather than re-deriving the commands; different unit (this mine's unit is recurring shapes, not repo-wide debt) and output otherwise. |
| the learner | **Fenced** — its lessons.md + comm-logs contract is untouched; a registry row links a `[TRACKED]` learner item, never re-owning it. |
