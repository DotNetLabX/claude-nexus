# Tech-Spec — Mine-Family Core (P0 record hygiene + P1 consolidation + B4 kickoff checklist)

**Status:** Ready
**Branch:** technical (ADR-27 — architect-owned definition)
**Provenance:** `docs/proposals/mine-family-next-wave-2026-07.md` — P0, P1, B4 (Ratified
2026-07-10, owner; combined per the proposal's own sequencing note: one coherent slug, one file set).
**Plan:** `docs/specs/adhoc-MineFamilyCore/delivery/plan.md`

## Problem

Three ratified items, one file set:

1. **P1 — cross-skill drift.** The three mine SKILL.mds (`mine-verify-cover` incl. the
   `mine-from-spec` mode, `mine-verify-repo`, `mine-reference-model`) restate the same family
   blocks — execution topology, marginal-budget rail, skeptic protocol, registry invariants,
   refresh grammar, the family/sibling tables. Both newer skills even say "inherits the semantics
   of mine-verify-cover's Execution topology" *and then restate it anyway*. This drift class
   already produced one real defect (the C6 verbatim-duplication eval finding, fixed 2026-07-04);
   with the estate about to grow (fifth mine, analyst extension), the repeated walls multiply.
2. **P0 — stale records + unharvested pilot lessons.** The two skill-evals
   (`docs/skill-evals/2026-07-04-mine-verify-repo.md`, `2026-07-05-mine-reference-model.md`) and
   the two pipeline summaries still describe the pilots as never-run/operator-owed; the pilots ran
   2026-07-04/05 and their lessons (the skeptic's vacuous-grep kill; the merged-finding audit-note
   pattern) live only in target-repo artifacts. Registry refresh runs have no named owner.
3. **B4 — no kickoff discipline for new-target runs.** Each mine run on a fresh repo starts
   without a confirmed preflight, a stated survival-rate expectation, or a stop-budget.

## Design

**One shared reference file, loaded by pointer — no new skill, no behavior change.**

- **The artifact:** `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — the
  family head owns it (ratified location, proposal P1). Contents, in order: the family table (the
  4 mines + the from-spec mode: unit / ground truth / gate / output) · execution topology
  (canonical) · marginal-budget rail + report-on-halt · skeptic protocol (verdict grammar
  CONFIRMED/WRONG/IMPRECISE, must-RUN + drop-without-excerpt enforcement, plus the two harvested
  pilot clauses below) · fact/judgment doctrine (one paragraph; per-skill schemas stay put) ·
  registry invariants (ADR-43/45/49) + the refresh outcome grammar
  (resolved / still-active / superseded) · the B4 kickoff checklist (tool preflight confirmed on
  the target · expected survival rate stated up front · stop-budget set · run-report location named).
- **The pointer mechanism:** each sibling SKILL.md replaces its restated block with a short
  load-bearing pointer — "read `../mine-verify-cover/references/mine-family-core.md` (sibling skill
  folder in this plugin) §{section} before orchestrating" — plus ONLY its per-skill deltas (repo:
  stage list metric→miners→consolidate+skeptic, severity recalibration, cross-model seam;
  reference-model: sizing note, flattery framing, self-mode cross-check; cover/from-spec: its
  `verified | ambiguous` grammar, which deliberately differs and stays). All skills of one plugin
  ship in one version-keyed cache tree, so the sibling-relative path is stable by construction.
- **Harvested pilot lessons (P0 → into the core's skeptic protocol):**
  1. *The vacuous-evidence check* — the skeptic also validates that an evidence command CAN fail:
     a zero-hit/absence claim whose grep is structurally unable to match (the pilot's
     `Services[\\/]\K…` kill — sibling-relative paths never contained the literal) is WRONG, not
     CONFIRMED; re-prove with a command that would fire on a real violation.
  2. *The merged-row audit note* — when consolidation merges overlapping findings, the surviving
     row records what was merged (`Merged from: {ids}`), the pilot's working pattern.
- **What does NOT move (binding):** the per-skill "Binding prompt obligations (grep-checkable)"
  sections — their ACs bind them to their own file (AC-2/AC-3 of the original tech-specs); they
  stay byte-identical. The intra-skill safety-rails glance lists (the settled F1 pointer shape)
  are out of scope. `mine-from-spec`'s distinct verdict grammar stays in cover.

## Decisions

| Decision | Why | Rejected |
|---|---|---|
| Core as a `references/` file under the family head | ratified location; zero new estate units; sibling-relative read is stable within one plugin cache | a standalone `mine-family-core` skill (a 27th skill for what is a reference file; Skill-tool loading buys nothing a Read doesn't) |
| Binding-obligation sections stay byte-identical | their grep-checkable ACs cite "in this file"; moving them breaks shipped acceptance | re-pointing the ACs in the same pass (more churn, zero drift-risk reduction — they are single-copy already) |
| PATCH bump | prose-shape refactor + advisory checklist; no behavior change, no new capability | MINOR (nothing new reaches users functionally) |
| Refresh-owner rows land in the two TARGET repos' backlogs | ratified P0 text ("a backlog row per target repo"); nexus's backlog is the ratified-proposal queue, not an operator task list | nexus backlog rows (zombie-row risk, ADR-29) |
| Family table in core lists the current 4 members + mode only | the fifth mine (P4) is unshipped; its pass adds the row | pre-adding a semantic-model row (documents vaporware) |
| B4 ships **wired-but-advisory** | one pointer line per skill at the run-launch area ("on a NEW target, walk the core §kickoff checklist first") — discipline without a gate; resolves the critic's F5/open question | passive core section only (write-only doc); an enforced preflight gate (disproportionate for advisory prose) |
| Cover's Merge-paragraph registry-invariant sentence IS slimmed (F2 resolution) | the family head must not be the one place P1's de-dup silently skips; the SDD-lifecycle section stays otherwise untouched | marking it STAY (leaves the exact drift class alive in the head skill) |

## Acceptance criteria

- **AC-1 (core exists):** `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`
  present; `grep -c '^## '` ≥ 6 covering: family table, topology, budget rail, skeptic protocol,
  registry invariants, kickoff checklist.
- **AC-2 (pointers live):** `grep -l "mine-family-core" plugins/nexus/skills/mine-verify-{cover,repo}/SKILL.md plugins/nexus/skills/mine-reference-model/SKILL.md`
  → all three hit.
- **AC-3 (duplication dead):** the canonical signature sentences appear in exactly ONE shipped
  file (the core). Grep targets (critic-verified discriminating against the live tree,
  review-critic.md): `"capture the start"` (budget rail — pre-edit hits: cover:238, repo:192;
  absent from ref-model, whose R6 wording differs), `"is the session that owns spawning"`
  (topology — the long form; the short `"owns spawning"` also hits the out-of-scope
  `conformance-review` skill and must NOT be used), `"carried unchanged from ADR-43"` (invariants —
  pre-edit: repo:155, ref-model:146), `"appends a changelog entry"` (cover's Merge-paragraph
  invariant residue — pre-edit: cover only) — each 0 hits across `plugins/*/skills/*/SKILL.md`
  after the edit, 1 hit in the core file.
- **AC-4 (binding sections untouched):** `git diff` scoped to each skill's "Binding prompt
  obligations" section is empty.
- **AC-5 (harvest landed):** core contains both pilot clauses — grep `"CAN fail"` and
  `"Merged from"`.
- **AC-6 (records truthful):** the two skill-evals + two pipeline summaries each carry a
  dated annotation line — grep `"pilot executed 2026-07-0"` hits in all four files; each summary
  annotation also names the refresh owner + the target-repo artifact path.
- **AC-7 (refresh rows):** one row each in
  `D:\Omnishelf\omnishelf_flutter_app\docs\backlog.md` (mine-verify-repo refresh) and
  `D:\src\dotnet-microservices\docs\skill-backlog.md` (mine-reference-model refresh — that repo
  has no `docs/backlog.md`; `skill-backlog.md` is its live queue, critic-verified), citing
  `last_verified: 2026-07-05`.
- **AC-8 (gates):** repo lint + selfcheck green (`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`,
  `node scripts/selfcheck.mjs`); one `evaluate-skill` pass over the three touched skills with no
  finding above Low left unfixed; `release-plugin` PATCH bump in the same commit.

## Out of scope

- Any change to gate batteries, stage semantics, verdict meanings, or run behavior — this is a
  prose-shape refactor; a mine run before and after must follow identical rules.
- The stack adapters (dotnet/flutter/cpp/php) — they reference the core method, restate nothing.
- The fifth mine's family-table row (P4's pass), the A2 declutter skill itself (this is its
  workload, not its implementation), intra-skill glance-list dedup.

## Definition review

Shared-artifact pass (Nexus skills) → the code-grounded review mandate applies: the critic must
read the three live SKILL.mds and re-run the AC greps, not review this spec in isolation. Run as
ONE code-grounded critic pass over spec+plan together (batched checkpoint). `mine-from-spec`
offer: default-skip — no rule-shaped runtime behavior.
