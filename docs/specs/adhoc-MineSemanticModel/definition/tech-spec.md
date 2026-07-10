# Tech-Spec — mine-semantic-model: the Fifth Mine

**Status:** Ready
**Branch:** technical (ADR-27 — architect-owned definition; no product "what")
**Provenance:** `docs/proposals/mine-family-next-wave-2026-07.md` P4 (Ratified 2026-07-10, owner) —
promote KG's project-local `mine-semantic-model` into `plugins/nexus/skills/` as the family's data
arm. Source package: `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\` (SKILL.md 195
lines + 3 references + 7 probe templates + a project runner), verified on disk 2026-07-10.
**Plan:** `docs/specs/adhoc-MineSemanticModel/delivery/plan.md`

## Problem

Live-datasource rule mining exists today only as a KG-local skill. Its born-from-defect provenance
(the F38 phantom-column class: a column that never existed survived spec → plan undetected) is a
defect class every data-touching consumer has, not a KG quirk — and P5 (nexus-analyst) needs the
mine as its authoring arm. The skill is already family-shaped (bounded unit → evidence → gate →
graded registry) but hardwires KG values: bundle path, DSN rungs, large-table names, the dotnet
validation gate, the OD-hub KB path. Promotion = extract the method, parameterize the project.

## Design

### What ships (the method) vs what stays project-side (the data + tooling)

The settled boundary rule applies: **method → plugin, data/tooling → project.**

**Ships in `plugins/nexus/skills/mine-semantic-model/`:**

| File | From | Generalization |
|---|---|---|
| `SKILL.md` | KG SKILL.md | five phases + modes + BR table, KG values → profile references; family pointer lines added |
| `references/probe-catalog.md` | KG same | probe classes + preamble contract + EXPLAIN gate kept; KG's four large-table rows → "per the profile's large-table policy" with KG rows as worked example |
| `probes/*.sql` (7 files) | KG `probes/` | lifted as-is — already parameterized (`{{schema}}`/`{{table}}`/`{{column}}`/`{{bound_predicate}}`), BR1 preamble is static text in each file (grep-verifiable, portable) |
| `references/interview-protocol.md` | KG same | near-verbatim — already generic; ledger path → profile reference |
| `references/output-contract.md` | KG same | ledger schema + run-report template kept; construct families, paths, baseline origin token → profile-defined |
| `references/project-profile.md` | **new** (absorbs KG `connection.md`'s *role*) | the per-project intake template — see below |

**Stays project-side (never ships):** the probe runner (`tools/run-probe.*` — stack-specific
tooling; KG's is dotnet, a Flutter/Node consumer writes its own against the runner contract), the
DSN resolution recipe (credential-adjacent; `connection.md` stays in KG), the cost log, and all
profile *values*. The skill ships the runner **contract** (what a compliant runner MUST refuse —
BR1 non-read-only DSN, BR12 EXPLAIN ceiling, BR12c bound-shape on profiled large tables) inside
`probe-catalog.md` — **anchor-free** (critic H2): the KG `run-probe.cs` worked-example citation
lives ONLY in `project-profile.md` item 10, never in the catalog, so the shipped method files carry
zero stack anchors.

### The project profile (the generalization seam)

A committed file in the consuming repo — `docs/semantic-model/profile.md` — holding every run
input the KG skill hardwires:

1. bundle root + construct-file map (KG: `seed/db/semantic-model/*.json`, 7 files)
2. provenance ledger path (KG: `seed/db/semantic-model/provenance.json`)
3. baseline origin token for pre-existing constructs (KG: `carried(F38)`)
4. run-report directory (default convention: `docs/model-runs/{date}.md`)
5. KB hub path(s) + Ground-phase search order (KG: OD hub + analytics reference)
6. validation gate command + baseline rule (KG: `dotnet test --filter FullyQualifiedName~SemanticModel`)
7. datasource engine + read-only role name + forbidden surfaces (KG: `laurentiu_read`; forbidden `kg_seed`)
8. optional dry-run surface + its posture label (KG: `kg_god_ro`, synthetic, never evidence)
9. large-table policy rows: table → required bound-predicate SHAPE (KG: the four analytics tables)
10. runner invocation + a one-line attestation that it implements the runner contract

`references/project-profile.md` is the template with **KG's filled profile as the inline worked
example** — the only file in the package where KG-specific tokens may appear. **Phase 0 (new):**
resolve the profile; a repo with no profile gets a **first-run intake** — one batched message (BR4
shape) asking for the ten inputs with proposed defaults — and the answered intake is written as the
profile file before Phase 1 runs. A missing profile is never silently defaulted.

### Family membership (edits to `mine-family-core.md`)

`plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` is the single family
table (P1). Four edits, all additive-or-one-word:

1. Line 3: "four-member" → "five-member"; add `mine-semantic-model` to the member enumeration.
2. §The mine family table — fifth row: `mine-semantic-model` | one datasource area | live schema +
   read-only data probes | probe re-execution + KB grounding + operator interview | semantic-model
   bundle + provenance ledger.
3. §Execution topology per-skill staging — the delta line: `mine-semantic-model` runs its phases
   **sequentially in the main session** — the Phase-4 interview is operator-in-loop (the family's
   one in-loop human gate; ADR-47 fact/judgment applied to data — what a flag *means* is a judgment
   only the owner renders), so the run is **never delegable as one background agent**; probe
   batches may run as background stages between interview points.
4. §Skeptic protocol — carve-out sentence alongside the existing mine-from-spec one:
   `mine-semantic-model`'s gate is a different mechanism (probe re-execution + Audit-mode
   refutation legs + interview provenance; its origin enum is its verdict grammar) and is not a
   consumer of the must-RUN protocol section.
5. **Member-count sweep (critic H1):** three more places assert the old count and flip with the
   membership — `mine-family-core.md:18` "unchanged across all four" → "all five";
   `mine-reference-model/SKILL.md:29` and `mine-verify-repo/SKILL.md:27` "all four members follow"
   → "all five members follow". **DO-NOT-TOUCH carve-out:** `mine-family-core.md:109` "confirm all
   four up front" counts the kickoff checklist's four ITEMS, not the members — verified live (4
   total `all four` hits, only 3 are member counts); it stays.

The registry-invariants mapping (never-delete ↔ constructs keep flipped origins; changelog ↔ the
run report; idempotent refresh ↔ BR10) lives in the new SKILL.md's pointer section — the core file
stays lean, per its own "each skill keeps its own schema/path" rule.

### What is deliberately preserved, not papered over

- **The in-loop human gate.** The other four mines gate post-hoc (skeptic after miners); this one
  interviews mid-run because data semantics are owner-judgments. The honest difference is stated in
  the family table row and topology delta, not smoothed into false symmetry.
- **Postgres-flavored, seam named not extracted.** One live engine so far; the probe templates and
  catalog are openly `information_schema`/`pg_catalog`-shaped. A `## Datasource seam` section in
  SKILL.md names the seam and the extraction trigger (a second engine) — the family's own
  "don't extract a seam from a single stack" rule.
- **Born-from-defect provenance.** The F38 phantom-column story stays in SKILL.md's intro,
  explicitly labeled as the KG pilot origin — it is the skill's reason to exist for every consumer.

## Decisions (extracted; ADR-25 — two-way door, no standalone ADR)

| Decision | Why | Rejected |
|---|---|---|
| Ship probe `.sql` templates; runner stays project-provided against a shipped contract | templates are engine-generic-within-Postgres static text (grep-verifiable BR1 preamble); the runner is stack-specific tooling (KG's is dotnet) and nexus is the stack-agnostic core | shipping `run-probe.cs` (wrong stack coupling; nexus-dotnet overreach); shipping no SQL (every consumer re-authors seven identical templates) |
| Profile = committed file `docs/semantic-model/profile.md` in the consuming repo, Phase-0 resolved, intake-created on first run | run inputs must persist across runs (never-ask-twice applies to setup too); a per-invocation parameter list would be re-asked every run | invocation args (re-asked, drift-prone); plugin `user_config` (repo-scoped data in a user-scoped store) |
| KG tokens allowed ONLY in `project-profile.md` (the worked example) | keeps the method files clean for every consumer while preserving the one full filled example; per-file scoping makes the AC grep-executable | scrubbing KG entirely (loses the only real worked example); KG tokens throughout (a "generalized" skill that still reads as KG's) |
| `connection.md` stays in KG; the profile absorbs only its *role* (surface + forbidden-surface declaration) | DSN rungs are credential-adjacent and per-project by nature; shipping a template of credential-resolution steps invites copy-paste of the wrong project's rungs | generalizing connection.md into the package |
| Keep BR1–BR13 numbering and the obligations-table shape | the BR ids are load-bearing cross-references (probe preamble comments, output contract, interview protocol all cite them); renumbering breaks the lifted text for zero gain | renumbering to a "clean" sequence |
| Family-core edits are additive + one word flip; invariants mapping lives in the new SKILL.md | core file stays lean per its own ownership rule; the P1 consolidation must not re-bloat one slug later | restating the ledger/report mapping inside core |
| KG repo migration out of scope | plugin skills are namespaced (`nexus:mine-semantic-model`) — no collision with KG's local copy; KG swaps on its own schedule | bundling a KG-repo edit into a nexus release |
| Stack-anchor sweep AC (critic H2): class-derived regex, profile excluded, single sanctioned exception = literal `F38` in SKILL.md's labeled origin story | a fixed token list under-covers the coupling surface (14 measured dotnet/C#/ps1 anchors would have shipped); the sweep must be derived from the coupling CLASS | extending AC-6's token list ad hoc (same under-coverage failure, one round later) |
| Member-count sweep is per-context, not blanket (critic H1 + architect correction) | `mine-family-core.md:109`'s "confirm all four" counts checklist items — a blanket `all four`=0 AC would false-positive on it | the critic's suggested blanket grep |
| BOM gate on every shipped file, not just SKILL.md (critic M2) | skill-lint E2 covers SKILL.md only; PowerShell redirection writes UTF-16 on this platform; the KG sources are verified BOM-free so byte-for-byte stays clean | trusting the copy mechanism |
| AC-6/AC-9 exclude `probes/*.sql` (done-check Q1 adjudication — developer-raised) | byte-for-byte fidelity (Step 1, binding) and a whole-folder token sweep cannot both hold when the SOURCE bytes carry the tokens; the leaks are non-sensitive comments (public table names, one pilot feature-id), AC-5's credential sweep stays whole-folder, and the plan's own per-step Satisfies lines never claimed AC-6/AC-9 for the probes | hand-editing two probe comments (breaks the byte-for-byte contract for cosmetics); leaving the tech-spec wording contradicting the plan's step scoping |
| **OWNER OVERRIDE (2026-07-10, post-build): the skill ships in `nexus-analytics`, not nexus core** — supersedes this spec's "extension consumes, mine stays core" framing | domain cohesion (owner ruling); the cross-plugin composition precedent is `mine-verify-cover-dotnet`'s plain prose reference to the core method — no file pointers needed; side effect: the skill needs NO core version bump at all | the original core placement (family co-location argument over-weighted the relative-pointer constraint the estate already solves by prose reference). Family REGISTRY stays core; relocation + pointer re-wording executed by the adhoc-AnalystExtension build |

## Acceptance criteria

All signature greps executed against disk at authoring time — `mine-semantic-model` is virgin in
`plugins/` (0 hits), `four-member` has exactly 1 hit (`mine-family-core.md:3`), `five-member` is
virgin, and the KG source package's 7 probe files are confirmed on disk.

- **AC-1** (skill exists, family-wired): `plugins/nexus/skills/mine-semantic-model/SKILL.md` exists
  with frontmatter `user-invocable: true` and `disable-model-invocation: true`; grep
  `mine-family-core` inside it returns ≥3 hits (family table, execution topology, registry
  invariants pointer lines, `../mine-verify-cover/references/…` shape — the sibling convention).
- **AC-2** (probe preamble, portable BR1): each of the 7 files in
  `plugins/nexus/skills/mine-semantic-model/probes/*.sql` contains both `SET TRANSACTION READ ONLY`
  and `statement_timeout`; a case-insensitive grep for statement-leading write keywords
  (`^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|GRANT)`) across them returns zero hits.
- **AC-3** (family membership): `mine-family-core.md` contains `five-member` (and no longer
  `four-member`) and a table row containing both `mine-semantic-model` and `one datasource area`;
  §Execution topology contains `operator-in-loop`; the skeptic carve-out is checked by its UNIQUE
  phrase `origin enum is its verdict grammar` (critic M3 — a whole-file `mine-semantic-model` grep
  is satisfied by the table row even if the carve-out is skipped); **member-count sweep (critic
  H1):** `all four members|across all four` = 0 hits across `plugins/nexus/skills/**` and
  `all five` ≥ 3 hits (core :18 + the two sibling SKILL.mds) — `mine-family-core.md:109`'s
  checklist "confirm all four" is out of pattern by construction and stays.
- **AC-4** (profile template): `references/project-profile.md` exists and contains, each ≥1 hit:
  `bundle`, `provenance`, `validation gate`, `read-only role`, `large-table policy`, `KB hub`,
  `runner`, `baseline origin`.
- **AC-5** (credential hygiene, inherited from KG AC-9):
  `grep -riE 'Password\s*=|pwd\s*=|postgres(ql)?://\S+:\S+@'` over
  `plugins/nexus/skills/mine-semantic-model/` returns zero hits.
- **AC-6** (KG-token scoping, extended per critic H2; probe carve-out per done-check Q1
  adjudication): grep for
  `laurentiu_read|kg_seed|kg_god_ro|seed/db/|omnishelf-docs|analytics_report|analytics_events|retail_chain_id|fmcg_platform`
  across `plugins/nexus/skills/mine-semantic-model/` lists at most `references/project-profile.md`
  (the worked example) **plus the `probes/*.sql` files** — the probes are byte-for-byte lifts
  (Step 1 forbids editing them) whose pre-existing inline COMMENTS name KG tables; the tokens are
  non-sensitive, AC-5's credential sweep still covers the whole folder, and every AUTHORED `.md`
  file must be KG-clean. (`seed/db/` deliberately broad: KG's `generation-rules` cite slipped past
  the original `seed/db/semantic-model` token.)
- **AC-7** (Phase 0): SKILL.md contains a `Phase 0` (or `## Project profile`) section stating a
  missing profile triggers the batched first-run intake and is never silently defaulted.
- **AC-8** (release): MINOR bump (new capability — owner-escalation per policy), CHANGELOG entry,
  omni twin regenerated; bump runs only when `plugin.json` == committed HEAD (the standing
  sequencing gate — adhoc-DecisionLog's bump is in flight ahead of this slug; exact check:
  `git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json` exits 0; this bump then
  targets 1.29.0).
- **AC-9** (stack-anchor sweep, new — critic H2; probe carve-out per done-check Q1 adjudication):
  grep `\.cs\b|\.ps1\b|\bdotnet\b|DataPool|QueryLoad|\bF[0-9]{2}\b` across the shipped skill folder
  **excluding `references/project-profile.md` AND `probes/*.sql`** returns hits ONLY for the
  literal `F38` inside SKILL.md's labeled pilot-origin story — zero hits of any other kind in any
  other authored file (the measured leak surface: 14 dotnet/C#/ps1 anchors + 4 secondary
  feature-ids in the KG sources; the one probe-comment `F52` rides the byte-for-byte lift, same
  carve-out rationale as AC-6's).
- **AC-10** (BOM, new — critic M2): first 3 bytes ≠ `EF BB BF` for every shipped `probes/*.sql`
  and `references/*.md` (SKILL.md already gated by skill-lint E2). KG sources verified BOM-free —
  a byte-for-byte copy passes; a PowerShell-redirection copy does not.

## Out of scope

- **The model-feedback loop** (P7/F60 shape: feedback ledger read-first, staleness nudge,
  confirmed-in-use accretion) — explicitly deferred until KG's F60 pilot reports; the proposal
  backlog row carries the re-open trigger.
- **A second datasource engine** (SQL Server etc.) — the named extraction trigger for the seam,
  not this slug.
- **Shipping a runner implementation** — project-side by decision; a future nexus-dotnet helper is
  a separate proposal if demand recurs.
- **KG repo migration** to the plugin skill, and any edit inside `D:\src\knowledge-gateway`.
- **P5 (nexus-analyst)** — consumes this mine later; nothing here presumes its shape.

## Definition review

Shared-artifact pass (`plugins/**`, including an edit to `mine-family-core.md` owned by a sibling
skill folder) — the **code-grounded critic (Mode 2) is mandatory** at plan review per the standing
mandate; self cross-check alone is insufficient. `mine-from-spec`: default-skip — the BR
obligations are lifted verbatim from KG's already-piloted skill (piloted F52, reviewed twice),
not newly-authored rule text; no new rule-shaped behavior is born in this slug.
