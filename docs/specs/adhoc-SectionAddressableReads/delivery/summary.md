# Section-Addressable Reads & Read-Discipline Extension — Summary

## Status: COMPLETE

## What Was Built
Extended ADR-22 read-discipline from *"don't re-read"* to a second dimension — *"read only the
section you need."* A prose/skill/agent change only (no source behavior, no domain model): the
canonical Read-Discipline rule gains a section-targeting bullet (with three whole-read fallbacks),
five format skills document a fixed-heading section map, four heavy-loader agents
(critic/reviewer/architect/po) get a duplicated targeted-read pointer (ADR-14), kb-navigation is
extended, and a measurement harness (`scripts/measure-read-cost.mjs`) was added to baseline and verify
the cache-cost impact. PATCH release 1.16.0 → 1.16.1.

## Key Outcomes
- **Files:** 2 created (`scripts/measure-read-cost.mjs`, `tests/unit/measure-read-cost.test.mjs`),
  ~20 modified (1 ADR, 2 rules, 6 skills, 4 agents + 4 regenerated commands, plugin.json, CHANGELOG).
- **Tests:** 233/233 green (full suite); 7/7 unit cases on the Step-6 parser, including the added
  dangling-flag guard, malformed-input `calls` count, and exact-`--since` boundary case.
- **Review:** Step-1 done-check **PASS** (0 Missing, 2 plan-sanctioned deviations); Step-2 reviewer
  **APPROVED** (no CRITICAL/HIGH; 1 LOW + 2 test gaps folded in before close). 0 fix cycles; 1
  discretionary polish pass.
- **Commits:** plan `b8b7642`; implementation (this close, scoped to this feature only).

## Deviations from Plan
- **Step 7** — plan said "both plugins touched"; only `nexus` changed (`nexus-dotnet` git-clean) —
  per-plugin classification is correct.
- **Step 6 / AC4** — the absolute `cache_creation` drop is **OPERATOR-OWED post-bump** (live
  `be critic` Mode-2 run + `token_audit` ON + reload) — plan-sanctioned; the harness + baseline +
  verbatim capture commands are recorded in implementation.md.

## Notes
- **Concurrent-pipeline collision (important):** `adhoc-DistillPromptContractFix` ran in the same
  working tree mid-run. This commit is **scoped** — only this feature's files plus a hunk-staged
  ADR-22 note in README.md; the other feature's ADR-34 and its files are left untouched. The other
  feature intends version 1.17.0 (bumps from this committed 1.16.1).
- **`--strict` carry-over (out of scope):** `claude plugin validate plugins/nexus --strict` fails on 4
  pre-existing untouched skills (long unquoted em-dash `description:` frontmatter — a CLI/YAML quirk);
  the authoritative `skill-lint.mjs` gate passes estate-wide. Follow-up candidate: quote those
  frontmatter descriptions, or drop `--strict` from accept lines in favor of `skill-lint`.
- **Tooling note:** the selfcheck `gen-commands drift` check is git-HEAD-based, so it reports RED at
  the developer's pre-commit stop by design; it goes green on this commit.
- **Omni twin** regenerated (`gen-omni`); commit it in `../omni` with a mirroring message.
- **Lessons** unprocessed (optional learner pass offered at close).
