# F28-RegenerateUnit — Tech-Spec

**Status:** Ready
**Slug:** F28-RegenerateUnit
**Plan:** docs/specs/F28-RegenerateUnit/delivery/plan.md
**Source (graduation, ADR-28):** ratified proposal `omnishelf_flutter_app
docs/proposals/regeneration-and-conventions-skill-pack.md` §S1 (ratified 2026-07-20) — promoted,
not re-authored — **plus** the 2026-07-22 architect-shaped program-gap fold (backlog F28 row,
ADR-58): cluster mode (G1), golden-seam catalog (G2), perf bench line (G3). **Definition
checkpoint:** 2026-07-22 — scope boundary confirmed (Q1: shaped-row scope only), review mode =
code-grounded critic (Q2).

## What

`regenerate-unit` — the **program-home regeneration skill**: the wave inner loop validated 5×
(RC/FSD/RG/p0c/p0d — repairs 1→1→1→0 trend). One run = one unit (or one **cluster** in cluster
mode). NOT a mine-family member — it consumes the mines' outputs (registry, S2 audit, census,
anti-pattern list) and produces regenerated code behind gates. Ships in the nexus plugin.

## Method (promoted from S1 + the G-fold)

1. **Preflight (hard gates, all fail-closed):**
   - BR registry exists and is mutation-gated (else HALT → `mine-verify-cover`); **registry
     freshness** — rows re-stamped against current source via `mine-verify-cover`'s run-2 refresh
     mode (re-verify citations, re-stamp `last_verified`; rules and tests stay).
   - **Oracle strength (D1):** the suite has survived a `mine-oracle-strength` (F29) audit on an
     integrity-proven instrument — or the run schedules that audit as its own battery stage.
     Instrument honesty is F29's territory; this skill asserts the attestation, never re-implements
     the checks.
   - **Golden-seam check (G2):** consult the campaign's golden-seam catalog
     (`docs/golden-seam-catalog.md` species — campaign-owned instance; required row shape: unit,
     seam kind (byte-seam | void/file-write | none), oracle location). A unit absent from the
     catalog or seamless = a **declared gate gap** recorded in the report, never silent.
   - **Perf-delta audit (G3):** prior perf-wave changes invisible to behavior tests are carried as
     owner-sanctioned lines in the shape directive; the run records a **before/after perf bench
     line** at the gate (the W5 snapshot-once precedent).
2. **Contract pack:** class name + byte-exact ctor + public signatures with defaults + the owner's
   shape directive. Deliberately NO import list (linkage discovery is measured). Shape-directive
   inputs: (a) `mine-design` Stage-1 census where one exists (evidence only — the prescriptive
   designer/judge stages are NOT part of regeneration), (b) the ratified conventions charter (F27,
   when present), (c) the anti-pattern / do-not-regenerate list (`mine-skill-candidates`), (d)
   prior perf-wave deltas. Design intent enters at generation time, never as post-generation
   refactoring (owner ruling 2026-07-20; the byte-identical v3 pass is the evidence).
3. **Clean-room generation (spawned, background):** forbidden = target file in ANY form incl. git
   history, all test trees, design briefs/specs/tech-debt/proposals; allowed = registry,
   entities/models/contracts/core, sibling usecases. Registry semantics: active rows only;
   bug-preserve rows implemented verbatim. MANDATORY outputs: files-read honesty list +
   **declared-ambiguities list** (empty is suspicious) + rule-coverage self-check (every active
   row → implementing function). Analyzer-clean at project baseline; the generator runs no tests.
4. **Hidden-oracle run + bounded repair loop (≤3):** each failure adjudicated **registry-gap**
   (registry corrected with a dated annotation; the fact — never the old code — relayed to the
   generator) vs **generation-slip** (repair instruction). More rounds → NO-GO with findings.
5. **PROVE:** invoke `mine-oracle-strength` (fresh blind battery → adjudication → gap-kill) and
   consume its `## Scores / ## Buckets / ## Survivors / ## Gap-Kill / ## Pair / ## Registry
   Annotations` report seam — F28 invokes, never re-implements. Plus: full-project analyze at
   baseline; shape metrics (lizard) for the comparison table; the G3 bench line.
6. **Report + adoption checkpoint:** GO/NO-GO, N-way shape table, residuals (incl. the
   unpinned-log-text ambiguity class), registry-gap findings, declared gate gaps. **Adoption is a
   standalone owner question — never bundled with any other approval** (binding 2026-07-20 lesson;
   same for integration-branch operations).

### Cluster mode (G1 — the fix-shelf pilot's need)

When the run targets a cluster (units merged/split/re-homed by the target design): before
generation, produce the **rule→target-home mapping check** — every legacy registry row from EVERY
cluster unit maps to a named home in the target design (unit + function), or carries an explicit
disposition (`retired — owner-ruled` with a dated annotation). **Orphaned registries** (a unit
dissolved by the target design) require explicit dispositions — fail-closed: an unmapped row HALTs
the run before generation. Wave model context: waves are cut by the *target* architecture —
re-shape vs in-place chunk (ratified doctrine, method-v2).

### Calibration ledger (mechanism + seed)

The ledger grows per run: post-generation findings become **directive lines for the next run**,
never applied passes. Seeded with the 4 ratified rulings (proposal §S1, election-worksheet AS-4):
consts for filesystem/sentinel literals; centralize ≥3-repeated resolution shapes; the **+15–20%
code-growth budget** (CODE lines, comments excluded; plumbing must earn signatures back); the
structure lines (config/accumulator split in context records; assembly separate from I/O;
exhaustive switch for enum dispatch). Campaign ledgers extend the seed; the skill states where the
campaign instance lives.

### Stage models (owner-ratified 2026-07-22)

Generator = `opus`; adjudication/judge calls = `fable`; mechanical (battery runs, report assembly)
= `sonnet`. Explicit `model:` on every dispatch, never session-inherit (supersedes the proposal's
budget-era all-sonnet line).

## Decisions

- **D1 — p0d incident extras excluded** (user-confirmed Q1): estate-damage sweep + plugin-gate
  stops are incident remediation, not the standard loop; instrument honesty delegated to F29.
- **D2 — Ledger seeded in-skill:** the 4 ratified rulings ship as skill-default directive lines;
  campaign instances extend. (Two-way door; alternative — campaign-only ledger — rejected: every
  new campaign would re-derive the ratified rulings.)
- **D3 — G2 catalog is a campaign-owned species:** the skill defines the required row shape and
  consumes it at preflight; it never authors the catalog (campaign #2's
  `docs/golden-seam-catalog.md` is the live instance and shape precedent).
- **D4 — PROVE is an F29 invocation** with the report-seam grammar as the contract (nexus 1.42.0,
  `mine-oracle-strength/SKILL.md` Relationship table already names F28 as consumer).

## Acceptance (grep-checkable)

- `plugins/nexus/skills/regenerate-unit/SKILL.md` exists, `user-invocable: true`; describes
  stages 1–6, cluster mode, the ledger seed (4 rulings present), and the stage-model pins.
- Preflight names all four hard gates; the golden-seam gap line ("declared gate gap, never
  silent") present; the adoption-standalone rule present verbatim-equivalent.
- PROVE section names the F29 seam sections exactly as shipped
  (`## Scores|## Buckets|## Survivors|## Gap-Kill|## Pair|## Registry Annotations` — grep
  against `mine-oracle-strength/SKILL.md`).
- Cluster mode: "every legacy registry row" + explicit-disposition + HALT semantics present.
- Program doc §5 (line ~140) + §7 item 3: S1 marked shipped (F28); §7 item-1/positional lines
  untouched.
- Lint suite green (glob form); MINOR bump + CHANGELOG in the same commit.
