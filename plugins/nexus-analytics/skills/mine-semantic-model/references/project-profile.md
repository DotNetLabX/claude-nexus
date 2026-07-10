# Project Profile

`mine-semantic-model` ships as a stack-agnostic **method**; every project-specific value it needs
lives in ONE committed file — `docs/semantic-model/profile.md` in the consuming repo — resolved at
Phase 0 of every run. This file is the **template** for that profile (ten inputs, each with
guidance and a proposed default where one exists) plus a **complete worked example**: the KG
pilot's own filled profile, the run this method was extracted from.

A missing profile triggers the first-run intake (SKILL.md Phase 0) — one batched message asking
for these ten inputs, with the proposed defaults below offered as a starting point. The answered
intake becomes the committed profile; a run never starts against an unresolved or assumed profile.

## The ten inputs

1. **Bundle root + construct-file map** — where the semantic-model bundle lives, and which file
   holds which construct family (entities, relationships, measures, dimensions, compatibility
   rules, terms, join-guards, or the project's own equivalent set). No universal default — this is
   the single most project-specific input.
2. **Provenance ledger path** — the sidecar JSON that carries per-construct origin/provenance,
   read by Phase 3 (never-ask-twice) and written by Phase 5. Proposed default: a `provenance.json`
   sibling of the bundle root.
3. **Baseline origin token** — the ledger's `origin` value for constructs that pre-date this
   skill's first run on the project (a hand-authored bundle, a prior migration, etc.). Proposed
   default: `carried(pre-existing)`; a project with its own feature/ticket-id convention may prefer
   `carried({that id})`.
4. **Run-report directory** — where each run's point-in-time report lands. Proposed default:
   `docs/model-runs/{date}.md`.
5. **KB hub path(s) + Ground-phase search order** — every knowledge base the Ground phase (Phase 3)
   must exhaust before drafting an interview question, in priority order. No universal default —
   name every hub the project actually maintains (a docs/kb/ tree, an internal wiki export, a
   reference-docs folder), even if there is only one.
6. **Validation gate command + baseline rule** — the project's own test/check command that must
   stay green (no *new* failures vs. the pre-run baseline) before Phase 5 reports a run complete
   (BR6). No universal default — this is the project's own CI-equivalent command.
7. **Datasource engine + read-only role name + forbidden surfaces** — which engine (Postgres today
   — see "Datasource seam" in SKILL.md), which role is the evidence-bearing read-only surface, and
   which role(s) are unconditionally forbidden as a probe source (a dev/admin superuser that
   bypasses grants, most commonly). No universal default.
8. **Optional dry-run surface + its posture label** — a synthetic/seed surface used only to shake
   out probe/runner defects before touching the real surface, if the project has one. Its posture
   label must say, in the run report, that it is never evidence. Optional — a project with no
   dry-run surface skips this item.
9. **Large-table policy rows** — for each table too large for an unbounded probe (a
   scan/EXPLAIN-cost concern), which bound-predicate SHAPE `probes/*.sql`'s `{{bound_predicate}}`
   parameter must satisfy (see `references/probe-catalog.md`'s "Large table policy"). No universal
   default — a project with no tables at that scale may declare an empty list.
10. **Runner invocation + attestation** — the exact command that invokes the project's own probe
    runner, plus a one-line attestation that the runner implements `references/probe-catalog.md`'s
    "The runner contract" (BR1 refusal, BR12 EXPLAIN gate, BR12c shape check, dry-run gating, cost
    logging). No universal default — the runner is project-provided, stack-specific tooling; this
    skill ships no runner implementation.

## Worked example — the KG pilot profile

This is the complete, filled profile from the project this method was extracted from
(KnowledgeGateway, "KG" below) — the only place in this skill package where project-specific
tokens are allowed to appear (every other shipped file is generic).

1. **Bundle root + construct-file map:** `seed/db/semantic-model/` — six JSON files mapping to
   seven construct families: `entity-graph.json` (yields both `entities` and `relationships`, via
   its edges), `measures.json`, `dimensions.json`, `compatibility.json`, `term-registry.json`,
   `join-guards.json`.
2. **Provenance ledger path:** `seed/db/semantic-model/provenance.json`.
3. **Baseline origin token:** `carried(F38)` — `F38` is KG's internal feature id for the pilot run
   that first authored the bundle (and the phantom-column defect this whole method exists to
   prevent — see SKILL.md's origin story).
4. **Run-report directory:** `docs/model-runs/{date}.md` (KG uses the proposed default as-is).
5. **KB hub path(s) + Ground-phase search order:** (1) this repo's own bundle provenance
   (`provenance.json` — was this already attested?); (2) the OD hub KB, `D:\omnishelf\omnishelf-docs\kb\`;
   (3) the analytics reference, `D:\omnishelf\analytics` docs + `seed/db/generation-rules/`.
6. **Validation gate command + baseline rule:** `dotnet test --filter FullyQualifiedName~SemanticModel`
   (run from the solution root, `src/Cortex.slnx`) — the F38 consistency gate
   (`SemanticModelConsistencyChecker`/`JoinGuardValidator`); a run is complete only when this
   re-run shows no *new* failures vs. the pre-run baseline.
7. **Datasource engine + read-only role + forbidden surfaces:** Postgres. Read-only role:
   `laurentiu_read` against `fmcg_platform` on `omniaz-postgres-production`, resolved into the
   `MSM_PROBE_DSN` environment variable for the current shell only (never written to a file, never
   echoed into a script or report). Forbidden, unconditionally: `kg_seed` — the dev superuser,
   bypasses grants; the committed `appsettings.json` `DataPool:ConnectionString` default resolves
   to `kg_seed@localhost:5433`, which is exactly why the runner refuses it by literal username
   match rather than trusting the committed default to be safe.
8. **Optional dry-run surface + posture label:** `kg_god_ro` — a CI-fixture-only base-table
   read-only role on a local Postgres 17 instance (port 5433), loaded from the project's own seed
   schema/views/role scripts. Posture label in every run report: "dry-run: `kg_god_ro` (seed,
   synthetic, not evidence)". Never cited as evidence for a real Bootstrap/Refresh finding.
9. **Large-table policy rows:**
   - `analytics_report_items` (~823M rows), `analytics_report_product_stats` (~607M rows),
     `analytics_report_client_subcategory_stats` (~166M rows) — date-window / IDs-first-CTE shape:
     either a direct `date {op} {value}` comparison, or an
     `IN (SELECT id FROM analytics_reports WHERE date ...)` report-IDs-first CTE.
   - `analytics_events` (~187M rows / ~90GB, single-column indexes only) — the stricter shape: a
     `date` window (`BETWEEN`, or both a lower and an upper comparison) **AND** an exact `event`
     filter **AND** an exact `retail_chain_id` filter, all three present together.
10. **Runner invocation + attestation:** KG's runner is `tools/run-probe.cs` (a standalone
    `dotnet run` file-based app, Npgsql-backed — project-side tooling, not part of this skill
    package). Invocation shape:
    ```bash
    cd .claude/skills/mine-semantic-model/tools
    export MSM_PROBE_DSN="{resolved DSN — never hardcoded, never committed}"
    dotnet run run-probe.cs -- ../probes/cardinality.sql \
        --param schema=public --param table=analytics_reports --param column=status \
        --param bound_predicate="date >= '2026-06-01'" \
        --timeout 60
    ```
    Add `--dry-run` when `MSM_PROBE_DSN` points at the seed container. Add `--ceiling {n}` to
    override the EXPLAIN ceiling for one invocation. Attestation: `run-probe.cs` refuses a
    non-`laurentiu_read`/non-dry-run DSN and any DSN literally equal to the `kg_seed` local
    default (BR1); runs `EXPLAIN (FORMAT JSON)` before every aggregate probe body and refuses
    execution above the configured ceiling, fail-closed on an unreadable plan (BR12); enforces the
    large-table bound-predicate SHAPE check via `IsValidReportDetailBound`/`IsValidEventsBound`/
    `IsBareTautology` (BR12c); and appends one line per invocation (pass or refused) to
    `tools/cost-log.jsonl` (BR12).
