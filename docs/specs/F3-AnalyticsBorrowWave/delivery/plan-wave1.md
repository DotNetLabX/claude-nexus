# F3 wave-1 build plan — S1–S4 (the Stage-1 core borrows)

**Status:** Plan — architect (Fable 5), 2026-07-19. Code-grounded critic ran same day: **GO-with-fixes,
all four folded** (HIGH-1 sweep regex broadened to real token forms + KG schema vocabulary, case-
insensitive; MED-1 value-briefing exclusivity reconciliation added as a coordinating edit; MED-2
grounding-gate⇄pending-value binding reconciliation sentence added; LOW-1 additive-vs-corrective
disclosure sharpened). Critic verified every file:line anchor live — zero stale citations.
**Gate:** Stage 0 **met** — `delivery/pilot-report.md` (2026-07-19, KG query-lane run #2): S1/S2/S3
all CONFIRMED with placement correct, Stage-2 both DROPPED by signal. The fmcg_platform run #1
residue (intake + runner adaptation) gates **F8-W1 only**, not this wave.
**Spec:** `definition/tech-spec.md` (Ready, critic-folded 2026-07-12) — this plan maps its S1–S4 to
execution steps; the spec's design decisions are binding and not restated.
**Version retarget (era-label fix):** the spec targets "0.1.0 → 0.2.0"; 0.2.0 (increment-0 port)
and 0.3.0 (F8-W3 value-briefing) have since shipped. This wave lands as **0.3.0 → 0.4.0** (MINOR —
new capability: the value-ledger skill; same escalation rationale the spec records). Spec AC-7's
"0.2.0" reads as "the wave's MINOR bump", now 0.4.0.
**Artifact naming:** increment 0 already owns `plan.md`/`implementation.md` in this folder (a
shipped, committed pass — never overwrite). This wave uses `plan-wave1.md` (this file) and the
developer writes `implementation-wave1.md`.

## Steps

| # | Step | Files |
|---|------|-------|
| 1 | S1 — new `value-ledger` skill | `plugins/nexus-analytics/skills/value-ledger/SKILL.md` + `references/output-contract.md` |
| 2 | S2 — `answer-qa` hardening (3 spec items + 2 pilot-fed) | `plugins/nexus-analytics/skills/answer-qa/SKILL.md` |
| 3 | S3 — `analyst-craft.md` (10 moves, domain-generalized) | `plugins/nexus-analytics/skills/answer-qa/references/analyst-craft.md` |
| 4 | Agent pointers + regen | `plugins/nexus-analytics/agents/data-analyst.md`, then `node scripts/gen-commands.mjs nexus-analytics` |
| 5 | S4 — CI rider (two yml edits) | `.github/workflows/plugin-release-check.yml` |
| 6 | Sweeps + lint + tests | repo-wide greps, `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` |
| 7 | Release rides the same commit | `bump-plugin.mjs --minor` → 0.4.0 + enriched CHANGELOG |

### Step 1 — S1 value-ledger (the wave's centerpiece; design per spec S1)

- `SKILL.md`: the ESTIMATED→MEASURED value-claim lifecycle as **method**; the artifact lives in the
  **consuming project** at `docs/value-ledger/` (data → project). Five statuses:
  `proposed | validating | validated | invalidated | retired` (`retired` = never-delete terminal;
  no `refining` — re-entry is `validating`, per spec Decisions).
- `references/output-contract.md`: 1-line index file + one detail doc per claim, YAML frontmatter
  `{id: VL-NNN, kpi/claim, estimate, confidence, evidence: {source, query|rows}, status,
  last_verified}`. Status transitions append-only with a dated changelog line.
- **Invariants by pointer, not restatement** (spec AC-1): cite the nexus plugin's
  `mine-verify-cover` skill, `references/mine-family-core.md`, full heading
  `## Registry invariants + refresh outcome grammar`. Cross-plugin prose citation (name plugin +
  skill + file + heading) — nexus-analytics ships no copy of that file; a relative path would
  dangle. Precedent for the heading-cite form: `mine-verify-flows/SKILL.md:149`.
- **Pilot-fed addition:** a first-class **pending-live-validation** reading — a claim whose number
  is shape-attested but never executed enters as `proposed` with its evidence naming the actual
  probe window and cohort; the contract states plainly that an ESTIMATED number appearing in any
  shipped answer MUST have a ledger entry (prose is not a ledger — pilot friction #1).
- **Species disambiguation (critic MED-1 — two boundaries, not one):** (a) the value ledger ≠ the
  model-feedback ledger (`mine-semantic-model` / `value-briefing` consume the latter); (b) the
  value ledger vs **value-briefing's exclusivity claim** (`value-briefing/SKILL.md:24-25` "ONLY
  home of value content… never flows back into the accuracy surface"): the value ledger is the
  **accuracy-side claims registry** (a claim's estimate must validate before it counts), NOT
  worth/prioritization labeling — that stays value-briefing's monopoly. State both carve-outs in
  the new SKILL.md **and** add one coordinating sentence to `value-briefing/SKILL.md` reconciling
  its exclusivity line with the new registry (rides the same 0.4.0 bump). The ship-time ADR states
  the boundary durably.
- **No tooling ships** — the spec's "(optional) one small deterministic index-check script" is
  **dropped** this wave: the F3/F8 posture is tooling-stays-project-provided until F8-W1
  generalizes it (see Decisions).
- Source (read-only, for shape): VWH `harness/flavors/retail_intelligence/value_ledger.py`,
  `TEMPLATE.md` + live VL entries under that flavor tree. **Never copy VWH/KG tokens into shipped
  text** — worked examples are domain-neutral (no chain ids, no OmniShelf/SAP vocabulary, no repo
  paths).

### Step 2 — S2 answer-qa hardening (edit `SKILL.md` in place)

Spec-mandated three:
- **`## Grounding gate`** (net-new section): before an answer or value claim ships, every cited
  evidence reference must **re-execute** — the query re-runs (or the cited rows re-fetch) and the
  excerpt is attached; a claim whose evidence does not re-execute is **dropped, not shipped**.
  Cite the mine-family skeptic's excerpt-or-drop as the shape; don't reinvent it.
- **Penalty-only doctrine** (one paragraph, here + persona in step 4): an agent-produced estimate
  feeding any score, rank, or recommendation may only ever count **against** it, never for it,
  until validated in the value ledger.
- **Provenance panel**: integrate contract items 3–4 (Date range, Constructs) + source + query into
  one presentation convention, CSV-first export note — an **integration, not a duplicate
  obligation** (spec S2 wording).

Pilot-fed two (both are Stage-0 exit-criteria corrections feeding placement — in-scope by design):
- **EXEMPT vocabulary** (pilot friction #3): contract item 2 and `## Malformed answers` currently
  speak only of filters "named as applied". Extend: a profile-declared **exemption** is named as
  such ("not applied and why") — a recognized obligation, not a hand-handled edge. Falsely stating
  a filter as applied stays malformed; so does silently omitting a declared exemption.
- **Pending-value disposition** (pilot friction #1/#2): `## Check order` assumes numbers-in-hand.
  Add the legitimate no-live-surface lane: when evidence cannot re-execute *by circumstance* (no
  DSN, committed-bundle vantage), the answer may ship only as **shape-attested with the value
  explicitly pending** — the number routes to the value ledger as `proposed` and the penalty-only
  doctrine governs its use. This is the grounding gate's disposition for "cannot re-execute", not
  an exception to it.
- **Binding reconciliation sentence (critic MED-2 — author both sections to this):** *cannot
  re-execute by circumstance ⇒ the number appears only as an explicitly-pending ESTIMATE (never as
  a validated value), routes to the ledger as `proposed`, and is penalty-only until validated.*
  The grounding gate's "dropped, not shipped" governs a claim shipped **as validated** without
  re-execution; the pending lane ships the *label*, never the naked number. The grounding-gate and
  check-order sections must read as one rule, not two.

### Step 3 — S3 analyst-craft.md

The ten §CRAFT moves (VWH `cookbook.md` §CRAFT: attribution isolation; effort≠outcome;
actionable-vs-structural gap decomposition; validity firewall; coverage-as-frontier; per-entity
dynamic baselines; distribution-over-mean; heterogeneous effect sizes; value-as-provenance-band;
managed-cohort≠population) as a **domain-generalized rewrite** — retail illustrations replaced with
domain-neutral ones; genuine rewriting, not a verbatim lift. Homed at
`skills/answer-qa/references/analyst-craft.md` (spec Decisions, critic HIGH-1). answer-qa
`## References` gains the pointer.

### Step 4 — agent pointers + regen

`agents/data-analyst.md`: prose pointer to analyst-craft.md + the penalty-only paragraph (spec S2:
"answer-qa + persona"). Then `node scripts/gen-commands.mjs nexus-analytics`;
`git diff plugins/nexus-analytics/commands` must come back clean after staging the regen.

### Step 5 — S4 CI rider (verified live 2026-07-19, both gaps still real)

1. `Generated commands in sync` step (yml:40-44): extend with `node scripts/gen-commands.mjs
   nexus-analytics` + `git diff --exit-code plugins/nexus-analytics/commands`; update the stale
   "nexus only" comment (nexus-analytics now ships agents/commands).
2. `plugin-validate` job (yml:73-75): add `claude plugin validate plugins/nexus-analytics --strict`.

### Step 6 — sweeps + lint + tests (all must pass before the bump)

- **KG/VWH-token sweep** over every new/edited shipped file, **all file types** (increment-0
  lesson: `--include="*.md"` missed SQL), **case-insensitive** (critic HIGH-1: the previous regex
  caught zero real forms of its own headline token — `chain-22`, `chains 22` — and none of the KG
  schema vocabulary the pilot report is saturated with):
  `grep -riE 'chain[s]?[ -]?(22|41)|OmniShelf|SAP|shelf|planogram|realogram|OOS|SKU|fmcg_platform|laurentiu_read|kg_seed|kg_god_ro|omniaz|Cortex|MSM_PROBE_DSN|retail_intelligence|analytics_events|analytics_reports|scan_session|retail_chain|report_upload_run|MERCH_APP|is_success|7-?11|device_model|app_version|F60|F52|F38'` —
  0 hits in `plugins/nexus-analytics/skills/value-ledger/**` and the S2/S3-touched files (the
  pre-existing `carried(F38)` allowance is `mine-semantic-model`-scoped and none of this wave's
  files). Worked examples in the new files must be invented-domain (logistics, subscriptions,
  anything non-retail) — the pilot's concrete entry supplies the *shape* (probe window + cohort +
  pending status), never its tokens.
- **Self-containment**: no `D:\omnishelf`, no `D:\src\` dev-repo paths in shipped text.
- skill-lint exit 0; `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green (glob form —
  bare `tests/` fails on Node 24).

### Step 7 — release (same commit as the edits)

`node scripts/bump-plugin.mjs --dry-run` → **check the reasons list names only this wave's files**
(concurrent-tree rule) → `node scripts/bump-plugin.mjs --minor` → 0.4.0. Enrich the CHANGELOG
entry to house style (what shipped and why, not file lists). Commit message:
`feat(F3-AnalyticsBorrowWave): ship wave 1 — value-ledger skill, answer-qa grounding gate + penalty-only + provenance panel, analyst-craft reference, CI rider; release nexus-analytics 0.4.0`.

## Acceptance (spec AC-1..10 with the two retargets)

AC-1..6 verbatim from the spec (AC-3's grep runs with step 6's extended regex, a superset). AC-7:
**0.4.0** (retarget). AC-8 evaluate-skill ACCEPT on value-ledger + answer-qa — developer runs it
and reports; architect re-checks at done-check. AC-9 reviewer judgment on domain-neutrality. AC-10
omni twin regenerated + committed (mirrored-subject convention) — architect-owned closure, after
Step 2 review.

## Decisions (this plan's, disclosed)

- **Optional index-check script dropped** — F3's no-tooling posture (tooling is project-provided
  until F8-W1 generalizes it) outweighs the spec's "(optional)" flag; the contract must stand as
  prose alone. Two-way door: W1 can ship the checker later.
- **Pilot-fed S2 additions are in-scope, with exact disclosure (critic LOW-1):** the pending-value
  disposition is an *elaboration* of the already-specced grounding gate; the EXEMPT vocabulary is
  **additive** — a new obligation-class wording beyond the spec's confirm-or-correct exit language,
  rated `[LOW] wording opportunity` by the pilot itself. Both trace to logged friction (#1/#2/#3);
  the additive one is called out here so the owner sees it at closure rather than discovering it.
- **Version retarget 0.2.0→0.4.0** — era-label fix, not a spec change; MINOR rationale unchanged.
- **Wave-suffixed artifact names** — preserves increment 0's committed pipeline record.

## Post-build (architect-owned closure, separate from the developer pass)

Done-check (AC-mapped) → Step-2 reviewer (reads plugin tree + VWH sources for AC-9) → ADR
extraction owed at ship: **"value ledger as a consuming-project artifact species"** (ADR-45/49
registry-species pattern; ADR-28 extract-never-reauthor) → backlog F3 row update → commit
`pilot-report.md` with the closure → gen-omni + omni commit (AC-10) → push both.
