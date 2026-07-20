# Tech-Spec — F16-ArchitectureMiner (`mine-architecture`, the eleventh mine)

**Status:** Ready — code-grounded critic GO-with-fixes folded (2026-07-19,
`../delivery/review-critic.md`)
**Type:** Technical feature (ADR-27 technical branch — architect owns the definition; no product spec)
**Owner:** Architect · **Decision-maker:** Maria (repo owner)
**Source:** Owner-directed 2026-07-19, shaped in-session per ADR-58 (no proposal; graduated from the
F2-SdkRewrite dependency — see Consumers)
**Plan:** `docs/specs/F16-ArchitectureMiner/delivery/plan.md` (this session)
**Consumers:** `omnivision-ai-sdk` F2-SdkRewrite **P2 architecture mine** (blocks on this skill —
its tech-spec names the dependency verbatim: "the architecture-miner skill (nexus plugin repo)");
F2 **P3 target design** (consumes the output as the *informed-by* current-state map); any consuming
repo needing a verified architecture-of-record.

## Goal

Ship `mine-architecture` — a repo-scoped mine that produces the **skeptic-verified current-state
semantic map** of ONE repository: what the system's modules actually are, what business capabilities
each carries, who owns which data, and which contracts join them — every claim carried by
re-executable evidence. It answers the question a rewrite must answer before designing anything:
*what does this system actually do, structurally, and where is the proof?*

**Extraction only (owner-decided 2026-07-19).** The artifact contains **zero target-design
content** — no proposed modules, no recommended decomposition. Target design is a *decided* human
artifact (F2 P3: "informed by the mined current-state map, never a copy of it"); a mined "proposed
architecture" would be a judgment wearing a fact's clothes (ADR-47) and would anchor the human
design. The research base is explicit that the separation is the copyable prior art: a graph IR
"separating extracted behavior from target design"
(`docs/kb/research/br-anchored-regeneration-landscape.md`, Fix #2).

## Grounding facts (verified 2026-07-19)

- **The consumer contract** (`omnivision-ai-sdk/docs/specs/F2-SdkRewrite/definition/tech-spec.md`,
  P2): the architecture mine produces "the skeptic-verified current-state semantic map (domain
  boundaries, data ownership, context map)"; copy from prior art "hierarchical business-function
  catalog, EARS-style testable requirements, per-finding source traceability, a graph IR separating
  extracted behavior from target design"; invent "the adversarial skeptic pass (no prior art in the
  field)". Mining waves do **not** block on this skill; only the architecture mine does.
- **Research base:** `docs/kb/research/br-anchored-regeneration-landscape.md` (10 sources, 3-vote
  adversarial verification) — AWS Transform's four-level catalog (Line of Business → Business
  Functions → Features → Component) + EARS requirements + `traceability.yaml` are the copy list
  [sources 1][8]; unverified extraction at ~90% fidelity still yielded near-total regeneration
  failure downstream [2], which is why the skeptic pass is the invented, load-bearing part.
- **Family state:** `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` is
  **ten-member** (lines 3–4, table lines 11–22, invariant line 24) — F15's
  `mine-skill-candidates` implementation is already in the working tree (uncommitted, owned by the
  F15 thread). `mine-architecture` is the **eleventh**.
- **Member-count landing sites:** every `ten-member | all ten | ten members | 10-row` hit under
  `plugins/nexus/skills/` — the **authoritative sweep target is Acceptance #2's grep, not a
  hand-listed enumeration** (critic finding D: a hand list missed `mine-verify-cover/SKILL.md:473`
  and the paired "10-row" hits in four siblings; the grep cannot). Positional labels ("ninth
  mine" in `mine-skill-gaps/SKILL.md:20`, "tenth mine" in `mine-skill-candidates/SKILL.md:21`)
  and CHANGELOG history are exempt — historical ordinals, not member counts, and must NOT be
  edited.
- **Reusable machinery:** `mine-verify-repo` ships a deterministic metric layer
  (`references/metric-layer.md` — bot filter, Code Maat coupling, lizard) whose **change-coupling
  table** is cross-module evidence this skill can consume; graphify structural graphs
  (`graphify-out/GRAPH_REPORT.md`) exist in the SDK target (89 TUs, clang-uml). Both are
  **optional inputs**, not preconditions.
- **Registry-species precedent:** `docs/business-rules/` (ADR-45), `docs/tech-debt/` (ADR-49),
  `docs/reference-model.md` (ADR-50), `docs/skill-gaps/registry.md` (ADR-63), the value ledger
  (ADR-65 — it explicitly joins "the registry-species family (the ADR-45/49 pattern)"). This
  skill adds the **sixth** species (ADR owed at close — see Acceptance).

## The pipeline

```
Extract     parallel clean-room extractors, one per dimension (default four, below) — every claim
            fact-shaped: statement + reproducible evidence command + file:line traceability
Consolidate merge per-dimension claims into the single map IR; dedup cross-dimension overlaps;
            join BR-registry coverage per capability (when docs/business-rules/ exists)
Verify      the adversarial skeptic RE-EXECUTES each claim's evidence -> CONFIRMED / WRONG /
            IMPRECISE; dependency-direction claims re-queried against the graph/import scan;
            catalog traceability re-resolved; vacuous-evidence check applies
Emit        write docs/architecture-map/ in the TARGET repo (registry invariants, ADR-43/45/49
            lineage): index.md (context map + module table + run report) + one file per module
Refresh     run 2+ re-verifies existing rows against the git delta (family outcome grammar)
```

### The four dimensions (default set, overridable per run)

- **D1 — Boundaries & context map.** The de-facto module set and the dependency directions between
  modules. Ground truth: the structural graph when present (graphify), else a deterministic
  include/import scan; the repo-mine change-coupling table (when available) adds *evolutionary*
  coupling evidence — modules that co-change without a static edge are a flagged boundary fact.
  Every direction claim carries the query/grep that proves it. **Overlap disposition (critic
  finding A):** `mine-verify-repo`'s global structure-graph pass derives dependency-direction
  facts from the same substrate — when the target repo has `docs/tech-debt/` with confirmed
  global-pass rows, D1 **reuses those edge facts as input** (same standing as the coupling table)
  rather than re-deriving them; independent derivation happens only when they are absent, and
  `index.md`'s run report records which substrate a run used (graphify / import scan / reused
  tech-debt rows), so two registries in one repo can never silently disagree about their basis.
- **D2 — Business-function catalog.** Hierarchical: module → capability → entry function(s). Each
  capability row carries an **EARS-style** testable statement (EARS = the "Easy Approach to
  Requirements Syntax" — a `When {trigger}, the {module} shall {response}` sentence, i.e. a
  requirement phrased so a test can be written from it) **plus** per-finding source traceability
  (`file:line` of the implementing entry point). **The catalog cites, never duplicates:** where a
  BR registry covers the capability, the row carries the registry rows' ids as its rule coverage;
  the rules themselves stay in `docs/business-rules/` (ADR-45 — one canonical set).
- **D3 — Data ownership.** Which module owns each core domain type / store, and who mutates it
  from outside — every outside-mutation claim backed by the grep that finds the mutating call site.
- **D4 — Contracts & seams.** The public surfaces between modules and at the system edge (exported
  APIs, FFI seams, message/file formats), each with its declaring `file:line`.

### The BR-coverage join (the census feed)

At Consolidate, when the target repo has `docs/business-rules/`, every D2 capability row gains a
`rule-coverage` field: the covering registry file + row ids, or **`none`** — making
zero-coverage modules a first-class, grep-countable output. This is direct P2-census evidence
(F2's grounding: 7 of 13 SDK modules have zero BR coverage) and the P3 re-homing map's starting
join. When no `docs/business-rules/` exists, the field reads `no-registry-estate` — the join is
optional-input, never a precondition.

### Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology — the canonical
shape (multi-agent by design, orchestrator-owns-spawning, staged background `general-purpose`
agents) is defined there. This skill's sizing: **four dimension extractors in parallel (default),
then ONE consolidate+skeptic agent** — the `mine-reference-model` staging shape, which held
comfortably at ~145 findings on the pilot sibling. On a NEW target, the core §Kickoff checklist is
the enforced preflight (Tier 1 universal; Tier 2 — this member consumes no registry oracle, so the
registry-freshness check is skipped by member class; the BR-coverage join input is optional and
disclosed at kickoff).

### Verify gate — the adversarial skeptic (the invented part)

- Full consumer of the family §Skeptic protocol: the skeptic **RUNS** each claim's evidence
  command; a verdict row without its re-execution excerpt is dropped by the orchestrator; the
  vacuous-evidence check applies (a zero-hit claim whose grep is structurally unable to match is
  WRONG, not CONFIRMED).
- Dimension-specific re-execution: D1 direction claims re-queried against the graph/import scan;
  D2 traceability re-resolved (the cited `file:line` must contain the named entry point) and the
  cited BR rows must exist in the named registry file; D3 outside-mutation greps re-run; D4
  declaring-site reads re-confirmed.
- **Anti-flattery framing carried over from `mine-reference-model`:** extractors are clean-room and
  never told what the architecture "should" be — the prompt asks *what boundaries and capabilities
  does this code exhibit*, not *how well is it structured*. Judgment-shaped observations ("this
  boundary is leaky") are `lens-note`s attached to facts, never standalone rows (family
  §Fact/judgment doctrine). This mine finds *what is*, `mine-verify-repo` finds *what hurts*,
  `mine-reference-model` finds *what to copy*.

## Output artifact & species

`docs/architecture-map/` in the **target** repo — the sixth registry species:

- `index.md` — the context map (module table + dependency-direction matrix + external seams), the
  run report (claims mined / confirmed / killed — the survival rate), and the changelog.
- `{module}.md` — one per module: capability catalog (D2 rows incl. `rule-coverage`), data
  ownership (D3), contracts (D4), each row with evidence + provenance + `last_verified`.

Registry invariants: family §Registry invariants + refresh outcome grammar apply unchanged
(per-row provenance, `last_verified`, never-deleted, append-only changelog, idempotent re-runs);
the shipped evidence gate (`tools/evidence-gate.mjs` `structuralEvidenceOk`) runs at every row
write. A **`Current-state only`** header line is mandatory in `index.md` — the artifact's own
declaration that it contains no target design.

**Relationship to the repo's own architecture docs (critic finding E).** A consuming repo may
already carry a hand-authored `docs/architecture/` estate (the golden fixture does:
`index.md`/`assessment.md`/`flow-map.md`). The separation is deliberate: `docs/architecture/`
holds what the humans **decided** (ADRs, assessments); `docs/architecture-map/` holds what the
mine **verified the code exhibits**. On drift the decided record wins for intent and the map wins
for current-state fact. `index.md` carries a mandatory pointer line naming the repo's
decided-architecture location (or `none`) so the two estates are never read as competitors.

## Relationship to other skills (the routing the owner asked about)

| Skill | Relationship |
|-------|-------------|
| `mine-verify-repo` | Sibling, different question (*what hurts* vs *what is*); its metric layer's coupling table AND its confirmed global-pass dependency-direction rows are optional D1 evidence inputs (reused, never re-derived, when present — see D1's overlap disposition). Not a consumer. |
| `mine-reference-model` | Sibling, different question (*what to copy*); staging shape and anti-flattery framing borrowed. Not a consumer. |
| `mine-design` / `mine-algorithm` | **Not inputs and not consumers of this skill.** They prescribe at unit level for existing code; their briefs feed F2 P3/P4 generation directly (the P0 experiment proved design briefs travel inside registries). This skill maps repo-level structure — no overlap, no duplication. |
| `mine-verify-cover` | Producer of the BR registries the D2 `rule-coverage` join cites. Independent runs. |
| `mine-skill-gaps` / `mine-skill-candidates` | Unrelated outputs (skill candidates); no seam. |
| graphify | Optional D1 substrate (structural graph); fallback is the deterministic import scan. |

## Family membership

Eleventh mine, **full method-contract member** (unlike the two name-and-shape members): unit = one
repo's architecture; ground truth = code structure (+ optional graph and coupling table); gate =
adversarial skeptic re-execution; output = `docs/architecture-map/` registry. Implementation adds
the eleventh row to the family table and sweeps every member-count landing site enumerated in
Grounding facts. **Sequencing:** the F15 thread owns the current uncommitted family-core state —
F16's family edits land **after** F15's closure commit (verify `git log` shows F15's closure before
touching shared family files; on collision, the F15 thread's closure wins and F16 rebases).

## Non-goals

- **Any target-design content** (owner-decided): no proposed modules, no decomposition advice, no
  migration ordering. P3 owns design; this skill feeds it facts.
- The P2 **census itself** (class dispositions mine/brief/glue/dead) — a campaign artifact built
  *using* this map, not produced by this skill.
- Pattern/virtue mining (`mine-reference-model`), debt mining (`mine-verify-repo`), unit-level
  prescriptions (`mine-design`/`mine-algorithm`).
- A security dimension (same deferral as the siblings — `/security-review`, owner call).
- Multi-repo / cross-repo maps; one repo per run.
- Editing any source in the target repo — the only write is `docs/architecture-map/`.

## Acceptance (inspect/grep-checkable)

1. `plugins/nexus/skills/mine-architecture/SKILL.md` exists, `user-invocable: true`, and carries:
   the four-dimension Extract stage, the BR-coverage join with the `none` /
   `no-registry-estate` grammar, the skeptic consumer declaration (must-RUN + drop-without-excerpt
   + vacuous-evidence), the `Current-state only` mandatory header rule, and a "What this skill
   does NOT do" section naming target-design content first.
2. Family sweep: `mine-family-core.md` names eleven members (line 3–4 prose + an eleventh table
   row + invariant line); after the sweep,
   `grep -rnE 'ten-member|all ten|ten members|10-row' plugins/nexus/skills/` → **0 hits**;
   positive control: `grep -rn 'eleventh mine' plugins/nexus/skills/` → exactly the
   `mine-architecture/SKILL.md` self-declaration. Positional ordinals ("ninth mine", "tenth
   mine") and CHANGELOG history are exempt and must NOT be edited.
3. Run gate (golden fixture = `omnivision-ai-sdk`): a pilot run produces
   `docs/architecture-map/index.md` + per-module files; every D2 capability row carries a
   traceability `file:line` that the skeptic re-resolved (re-execution excerpts recorded); the
   `rule-coverage` join marks the registry-covered areas and flags the zero-coverage modules —
   **counts reconciled against the live `docs/business-rules/` tree at run time, which is
   authoritative** (the borrowed F2 figures — "16 files / 7 of 13" — are already drifting: the
   live tree held 18 files at spec time; critic finding F); `index.md` contains the
   `Current-state only` header, the decided-architecture pointer line, and **zero**
   proposed-target content — the header and pointer are grep-checked, the *absence* of
   target-design content is **judgment-checked** (skeptic pass + human read; named as such — no
   grep can prove an absence of prose intent).
4. Kickoff preflight reachable: the SKILL.md carries the core §Kickoff checklist pointer line
   (Tier 2 registry-oracle check *skipped by member class*, stated).
5. ADR extracted at close, **next free number verified against the register at close** (ADR-67
   expected — F3's close claimed ADR-65 and F15 claims ADR-66; the spec's own after-F15
   sequencing guarantees 66 is taken; critic finding C): "mine-architecture is the eleventh mine:
   unit = one repo's architecture, output = the current-state architecture-map registry (sixth
   species), extraction-only by decision."
6. Release: MINOR bump (new capability, owner-escalated per release policy), one closure commit
   after F15's closure is confirmed in `git log`; omni twin regenerated per convention.
7. Backlog row: `docs/backlog.md` carries the F16 row (added at Spec Ready, this pass — ADR-58).

## Decisions (self-resolved, disclosed — ADR-25 two-way doors)

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Artifact = `docs/architecture-map/` dir (index + per-module files) | Repo-scale catalog outgrows one file; per-area precedent is `docs/tech-debt/{area}.md` | Single flat `docs/architecture-map.md` (reference-model precedent) — too large for a 13-module repo | decided |
| Default dimensions = 4 (boundaries, catalog, data ownership, contracts) | Matches the F2 P2 contract exactly; overridable per run like reference-model's list | 5th "evolution" dimension — folded into D1 as the coupling-table input instead | decided |
| EARS phrasing at capability level only | Rules stay canonical in BR registries (ADR-45); the catalog cites row ids | EARS-restating every rule — duplicates the registry estate | decided |
| graphify + coupling table = optional inputs with deterministic fallback | The skill must run on repos without either; preflight discloses which substrate a run used | Hard graphify precondition — would block most consuming repos | decided |
| Skill name `mine-architecture` | Family naming convention (`mine-{unit}`) | `architecture-miner` (the working name) — inconsistent with siblings | decided |

## Open questions

None — the four owner calls (slug, extraction-only scope, review mode, depth) were taken
2026-07-19 via the checkpoint.

## Effort & impact

**Effort: med** (one SKILL.md + family sweep + backlog/ADR bookkeeping; no new harness code — the
evidence gate and preflight are shipped and invoked in place per ADR-62). **Impact: 7** — F2 P2's
architecture mine hard-blocks on it, and it is the last unbuilt capability the rewrite campaign
names. One MINOR closure commit.
