# mine-semantic-model — the Fifth Mine

**Feature Spec:** `docs/specs/adhoc-MineSemanticModel/definition/tech-spec.md` (technical branch;
no product spec.md — the tech-spec + proposal P4 are the binding definition)

## Context

Promote KG's project-local `mine-semantic-model` skill into `plugins/nexus/skills/` as the mine
family's data arm: lift the method, parameterize every KG-specific value behind a committed
per-project profile, and register the fifth family member in `mine-family-core.md`. Source package
(verified on disk): `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\` — SKILL.md,
3 references, 7 probe templates, plus a project runner + connection recipe that deliberately do
NOT ship.

## Scope

In scope: the new skill folder (SKILL.md + 4 references + 7 probes), four edits to
`mine-family-core.md`, plugin release. Out of scope: any KG-repo edit, the runner implementation,
the feedback loop (F60-gated), a second datasource engine.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | 7 probe files, source + dest paths below | |
| 2 | (none) | — | no | per-file generalization dispositions (tech-spec table) | skill-authoring skill gap — log to lessons.md |
| 3 | evaluate-skill | Follow (as post-authoring gate) | no | the new SKILL.md | |
| 4 | (none) | — | no | 4 named edits to mine-family-core.md | |
| 5 | release-plugin | Follow | no | recommend `--minor` (new capability); sequencing gate below | |

**Disposition rules:** see plan-template. `Skill: None` never waives the TDD column (all `no`
here — doc/skill artifacts, no executable code ships).

## Domain Model Changes

None.

## Data Model Changes

None in this repo. The skill defines (for consuming repos) the committed profile file
`docs/semantic-model/profile.md` — a convention shipped as a template, not a file in this repo.

## Cross-repo read (binding note for Step 1–2)

Steps 1–2 read from `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\`. If reads
outside this repo are permission-denied in your session, STOP the step and report:
`OPERATOR ACTION REQUIRED — copy D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\ into
docs/specs/adhoc-MineSemanticModel/definition/inputs/ and re-dispatch`. This fallback is
pre-authored — firing it is `Deviated (valid reason)`, not an escalation.

## Implementation Steps

### Step 1 — Lift the probe templates

Copy the 7 files from KG `probes\` (`cardinality.sql`, `null-rate.sql`, `value-distribution.sql`,
`orphan-fk-fanout.sql`, `date-coverage.sql`, `cross-column-implication.sql`, `usage-heat.sql`) to
`plugins/nexus/skills/mine-semantic-model/probes/` **byte-for-byte** — they are already
parameterized (`{{schema}}`/`{{table}}`/`{{column}}`/`{{bound_predicate}}`/`{{timeout_seconds}}`)
and carry the BR1 preamble as static text; do not edit SQL. UTF-8 without BOM (BR11 applies to the
package itself).

**Copy mechanism matters (critic M2):** use a byte-copy (`Copy-Item` / `cp`), never PowerShell
redirection or `Set-Content` (writes UTF-16/BOM on this platform). KG sources are verified
BOM-free.

Acceptance: AC-2 executed — all 7 files present; per-file grep: `SET TRANSACTION READ ONLY` AND
`statement_timeout` both hit in each; case-insensitive `^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|GRANT)`
across `probes/*.sql` = 0 hits. AC-10 executed on the 7 files (first 3 bytes ≠ `EF BB BF`).
Satisfies: AC-2, AC-10 (probes half)

### Step 2 — Generalize the references + author the profile template

Create under `plugins/nexus/skills/mine-semantic-model/references/`, using the KG originals as
source and the tech-spec's ship-table dispositions as the binding transform:

- `probe-catalog.md` — keep: the 7-class table, the BR1 preamble/postamble block + BODY markers
  explanation, the EXPLAIN cost-gate section (BR12), the "Running a probe" invocation shape.
  Replace (critic H2 — the FULL anchor inventory, measured at 8 in this file): KG's four named
  large tables + row counts, the `retail_chain_id`/`analytics_events` column examples, and the
  `DataPoolOptions.cs`/`query-patterns.md`/`DataPoolQueryExecutor.cs:103`/`QueryLoadFloor.ParseTotalCost`/
  `scripts/calibrate-explain-ceiling.ps1`/`IsValidReportDetailBound|IsValidEventsBound|IsBareTautology`/
  `F52` anchors → "per the profile's large-table policy rows", with the *shape* taxonomy stated
  GENERICALLY (a date-window / IDs-first-CTE shape; a stricter multi-filter shape for an extreme
  table) and KG's concrete rows living only in the profile's worked example. Re-point line 111's
  `references/connection.md` cite → "the profile's datasource surface (item 7)" (critic M1 —
  connection.md does not ship and skill-lint E6 would not catch the dangler in a reference file).
  Add: the **runner contract** subsection — a compliant project runner MUST refuse (a) a DSN not
  matching the profile's read-only role (and the profile's forbidden surfaces unconditionally),
  (b) execution when EXPLAIN cost exceeds the ceiling or the plan is unreadable (fail-closed),
  (c) a large-table probe whose `bound_predicate` fails the profile row's shape (tautologies and
  self-comparisons named as refused), (d) non-dry-run flags against a dry-run surface; and MUST
  log every invocation (pass or refused) to a cost log. The contract is **anchor-free**: the KG
  `run-probe.cs` worked-example citation lives ONLY in `project-profile.md` item 10 (critic H2).
- `interview-protocol.md` — near-verbatim lift; replace `provenance.json` literal path with "the
  profile's ledger path"; ALSO (critic H2): line 4's `seed/db/generation-rules/interview.md`
  provenance cite → a generic "mirrors the batched-question pattern proven in the KG pilot" (the
  `generation-rules` path slips past AC-6's original token, which is why AC-6 now greps `seed/db/`);
  line 30's `analytics_reports.status` example → a stack-neutral example (e.g. `orders.status`).
  Keep the question template, batch shape, unavailable-user path, and recording format intact.
- `output-contract.md` — keep the ledger schema shape, single-primary-origin doctrine + precedence
  ladder, run-report required sections, rollback posture, zero-divergence rule. Replace: the seven
  KG construct families + file names → "the profile's construct-file map" (KG's seven as worked
  example); `carried(F38)` → `carried({baseline})` with the baseline token profile-defined; prose
  `F38` at source lines 19/44 → `{baseline}`-generic wording (critic H2 — the enum mapping alone
  left the prose ids); line 146's literal `dotnet test --filter FullyQualifiedName~SemanticModel`
  in the run-report template → "{the profile's validation gate command}: pass/fail counts vs
  baseline"; the KG-feature lane references (F39/F41 ownership) → one generic line ("multi-origin
  provenance and adjacent lanes belong to the consuming project's own feature map"); OD-hub
  write-back specifics → "the profile's KB hub, following that hub's own observed format".
- `project-profile.md` — **new**: the template listing the ten profile inputs (tech-spec §The
  project profile, items 1–10), each with one line of guidance + a proposed default where one
  exists, followed by **KG's filled profile as the complete inline worked example** (bundle
  `seed/db/semantic-model/`, ledger + `carried(F38)`, `docs/model-runs/`, OD hub, the dotnet gate,
  `laurentiu_read` real / `kg_seed` forbidden / `kg_god_ro` dry-run, the four large-table rows with
  their shapes, the `run-probe.cs` invocation). This is the ONLY shipped file where KG tokens may
  appear (AC-6).

Acceptance: AC-4 (profile-template key greps, each ≥1 hit), AC-5 (credential sweep = 0 hits over
the whole skill folder), AC-6 **extended token list** (grep lists at most
`references/project-profile.md`), AC-9 (stack-anchor sweep — zero hits in the references; the
single sanctioned `F38` exception lives in SKILL.md, Step 3), AC-10 (BOM check on the three lifted
references + the new profile) — all executed, outputs recorded in implementation.md.
Satisfies: AC-4, AC-5, AC-6, AC-9 (references half), AC-10 (references half)

### Step 3 — Author SKILL.md, then follow evaluate-skill

Create `plugins/nexus/skills/mine-semantic-model/SKILL.md` from the KG original with:

- Frontmatter: `name: mine-semantic-model`; description generalized (build/refresh/audit a
  semantic-model bundle from live-datasource evidence; five-phase; operator-triggered); keep
  `user-invocable: true` and `disable-model-invocation: true`.
- Intro: the F38 phantom-column origin story, explicitly labeled as the KG pilot provenance.
- **`## Phase 0 — Resolve the project profile`** (new): read `docs/semantic-model/profile.md`; if
  missing, run the first-run intake — ONE batched message (BR4 shape) asking the ten inputs with
  proposed defaults — write the answered profile, then proceed. A missing profile is never silently
  defaulted (AC-7 signature: `never silently defaulted`).
- The five phases + three run modes + idempotence invariant: lift, replacing KG literals with
  profile references (the phase procedure's KB search order → profile item 5; the Phase-5 gate →
  profile item 6; report path → profile item 4).
- The BR1–BR13 obligations table: keep ids and rules; reword enforcement column to
  profile-parameterized form ("the project runner refuses…", "the profile's KB hub…"). BR7's lane
  list → "the profile's declared no-write lanes" (KG's list as example); BR8 keeps
  "the skill never commits, either repo" verbatim.
- `## Datasource seam (Postgres today)` (new, short): the catalog + probes are
  `information_schema`/`pg_catalog`-shaped; a second engine is the extraction trigger; until then
  the seam is named, not extracted.
- Family pointer lines (the sibling convention, `../mine-verify-cover/references/mine-family-core.md §…`):
  §The mine family (at the intro), §Execution topology (with this skill's operator-in-loop delta
  restated in one line), §Marginal-budget rail, §Fact/judgment doctrine (one line: probes are
  facts; flag *meanings* are judgments → interview), §Registry invariants (with the mapping:
  never-delete ↔ origins flip / constructs stay; changelog ↔ the run report; idempotent refresh ↔
  BR10; §Kickoff checklist (a new datasource area = a new target).
- The "does NOT do" list: generalize BR7/BR8 items — including the `F41`/`F39`/`F50` lane ids at
  KG source lines 174/179 (critic H2) → generic wording ("the consuming project's own adjacent
  lanes"); keep "never treat dry-run output as evidence"; keep the defect-logging paragraph
  (lessons.md in-pipeline / skill CHANGELOG standalone).
- **The single sanctioned stack token:** the literal `F38` may appear ONLY inside the labeled
  pilot-origin story in this file — nowhere else, no other feature-id (AC-9's one exception).
- **Phrasing rule (critic L1, lint-binding):** `tests/lint/skill-refs.test.mjs` fails on
  `` `name` skill `` where `name` is not a shipped skill directory — write "the mine-from-spec
  **mode**" and "the mine-family-core **reference**", never backtick + " skill".

Then **Follow evaluate-skill** on the finished SKILL.md; fold its findings before Step 4.

Acceptance: AC-1 (file exists, frontmatter flags, ≥3 `mine-family-core` pointer hits), AC-7
(Phase-0 signature grep), AC-9 (SKILL.md half: the sweep hits only the labeled `F38`) — executed;
evaluate-skill invocation visible in `.claude/audit/skill-invocations.log`;
`node --test tests/lint/*.test.mjs` green (skill-lint E2/E6 + skill-refs pick the new skill up
automatically).
Satisfies: AC-1, AC-7, AC-9 (SKILL.md half)

### Step 4 — Register the fifth family member

Edit `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — the four edits from
tech-spec §Family membership — **plus the member-count sweep (edit 5, critic H1)**:

1. Line 3 area: `four-member` → `five-member`; append `mine-semantic-model` to the member
   enumeration in the same sentence.
2. §The mine family table — append the row:
   `| mine-semantic-model | one datasource area | live schema + read-only data probes | probe re-execution + KB grounding + operator interview | semantic-model bundle + provenance ledger |`
3. §Execution topology, per-skill staging list — append the delta bullet: phases sequential in the
   main session; the Phase-4 interview is **operator-in-loop** (the family's one in-loop human
   gate — never delegable as one background run); probe batches may background between interview
   points.
4. §Skeptic protocol — append one carve-out sentence naming `mine-semantic-model` alongside the
   existing cover code-arm / mine-from-spec carve-outs (its gate = probe re-execution + Audit
   refutation legs + interview provenance; **the sentence must contain the exact phrase
   `origin enum is its verdict grammar`** — it is AC-3's section-discriminating signature, critic
   M3; not a consumer of the must-RUN section).
5. **Member-count sweep** (three one-word edits, two of them in SIBLING files):
   - `mine-family-core.md:18` "unchanged across all four" → "unchanged across all five"
   - `mine-reference-model/SKILL.md:29` "all four members follow" → "all five members follow"
   - `mine-verify-repo/SKILL.md:27` "all four members follow" → "all five members follow"
   **DO-NOT-TOUCH:** `mine-family-core.md:109` "confirm all four up front" — the kickoff
   checklist's four ITEMS, not the member count (verified: 4 live `all four` hits, only these 3
   are member counts).

No other section of the core file changes. Depends on Step 3 (pointer targets must exist).

Acceptance: AC-3 executed — `five-member` present, `four-member` 0 hits, family-table row grep
(`mine-semantic-model.*one datasource area`), `operator-in-loop` present in §Execution topology,
carve-out signature `origin enum is its verdict grammar` present, member-count sweep grep
`all four members|across all four` = 0 hits across `plugins/nexus/skills/**` AND `all five` ≥ 3
hits.
Satisfies: AC-3

### Step 5 — Release (sequenced)

Follow release-plugin. **Sequencing gate: run the bump ONLY when
`plugins/nexus/.claude-plugin/plugin.json` equals committed HEAD — exact check (critic L2):
`git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json` exits 0** — adhoc-DecisionLog's
1.28.0 bump is in flight ahead of this slug (this bump then targets 1.29.0); never bump over an
uncommitted sibling bump (CLAUDE.md double-bump rule; team-lead/operator-owned ordering). Then one
bump run; recommend `--minor` (new capability —
owner escalation; the tool proposes PATCH). CHANGELOG line: "mine-semantic-model — the fifth mine
(live-datasource semantic-model mining, project-profile seam, 7 probe templates); mine-family-core
five-member registration". After the bump: `node scripts/gen-omni.mjs` (the ../omni tree may hold
prior uncommitted sync output — expected; regenerate on top, commit nothing).

Acceptance: AC-8 — version bumped once from a clean (== HEAD) baseline; CHANGELOG updated; twin
regenerated; CI `plugin-release-check` green.
Satisfies: AC-8

## Cross-Service Changes

None.

## Migration Notes

Consuming repos see a new namespaced skill (`nexus:mine-semantic-model`) on `/plugin update`. KG's
project-local copy coexists (different namespace) and migrates on KG's own schedule — no action
owed in this slug. First use in any repo runs the Phase-0 intake and commits a profile.

## Testing Strategy

No executable code ships — the acceptance battery is the AC-1..AC-7 grep set (each executed by the
developer, outputs pasted into implementation.md) plus `node --test tests/unit/*.test.mjs` and
`tests/lint/*.test.mjs` staying green (regression only — no new tests owed). The skill's live
validation is its first real run (KG or fmcg_platform) — operator-owned, out of this slug.

## KB Impact

None (dev-repo skill estate; no `docs/kb/` here).

## Decisions

Inherited from the tech-spec's decision table (ship-templates/runner-contract split; profile file +
Phase-0 intake; KG-tokens-only-in-profile; connection.md stays; BR numbering kept; lean core edits;
KG migration out of scope). Plan-level: `None — no additional self-resolved calls met the
disclosure bar`.

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2): **GO-with-fixes, 2 HIGH** — findings persisted to
`delivery/review-critic.md`, all folded: H1 → member-count sweep added as Step 4 edit 5 (three
one-word edits, two in sibling SKILL.mds; the critic's suggested blanket `all four`=0 AC corrected
to the per-context pattern `all four members|across all four` after the architect's re-grep found
a 4th, legitimate hit at `mine-family-core.md:109`); H2 → the full 14-anchor stack-coupling
inventory enumerated into Step 2/3 dispositions, new AC-9 class-derived sweep
(profile-excluded, single sanctioned `F38` exception), AC-6 token list extended + `seed/db/`
broadened, the `run-probe.cs` worked-example citation moved into project-profile.md; M1 →
probe-catalog:111's dangling `connection.md` cite re-pointed to profile item 7; M2 → AC-10 BOM
gate over every shipped file + byte-copy instruction; M3 → AC-3's skeptic check re-anchored on the
section-unique phrase `origin enum is its verdict grammar`; L1 → lint-binding phrasing rule
(mode/reference, never backtick+" skill"); L2 → the Step-5 gate's exact git command named. Critic
verified TRUE (recorded so the next promotion doesn't re-litigate): gen-omni copies `.sql`
recursively; the `disable-model-invocation` frontmatter pair is already shipped + linted; AC-2
passes non-vacuously on the real probes; AC-5 is 0-hit over the entire KG package; all family-core
edit loci exact; DecisionLog's dirty set content-disjoint.
