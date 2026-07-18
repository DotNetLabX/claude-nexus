# F8 W3 — Value Layer: `value-briefing` skill + KG/product runbooks

**Feature Spec:** `docs/specs/F8-AnalyticsEnforcementValueLayer/definition/w3-value-layer-spec.md`
(Status: Ready 2026-07-18 — the W3 content authority; `tech-spec.md` stays the gate/order record).
**Spec rules:** `definition/spec-rules.md` (67 rules) — stamp `sha256:2080af79d7ad` **re-verified at
plan time** (LF-normalized recompute matches, 2026-07-18). Rule-bearing steps carry
`Satisfies: {ruleName}` referents into that table. The two ambiguous rows (SR-64/SR-65, both
validator-shaped) are resolved by Decision D2; the file-format open question (bounded by verified
SR-30) by Decision D1.
**Status:** Plan — architect (Fable 5), 2026-07-18. **W3 only**: W1 stays gated (post-F3-pilot,
unplanned here); W2 executed 2026-07-17/18. Owner decisions locked in the spec are treated as
binding inputs, not re-opened: skill-first, first consumer = omnishelf-analytics product repo only,
value-model home = KG `docs/value-model/` governed. Proposal Unresolved #4 is DISSOLVED — no
compatibility rule is planned (SR-11/SR-12).

## Context

After W2a, the battle-tested VWH value knowledge sits as raw material with no structured home:
three open, W3-parked ledger entries in KG (`docs/model-feedback/analytics.md`) that BR-C
re-dispositions on every analytics run, plus the OD-hub KB draft
(`D:\omnishelf\omnishelf-docs\kb\analytics-value-model-vwh-import.md` — a **third** repo). Nothing
validates it, nothing joins it to the semantic model, no tool is sanctioned to read it. W3 ships:
**(1)** a governed, validated value-model artifact in KG `docs/value-model/`; **(2)** the
`value-briefing` skill in nexus-analytics — the only sanctioned reader; **(3)** ledger closure +
product-repo sync wiring. **Cross-repo boundary (same as W2):** this repo builds ONLY the plugin
skill + release (Steps 1–6); KG-side and product-repo-side work are operator runbooks (Steps 7–8)
executed in their own repos' sessions — this repo never edits KG, product-repo, or OD-hub
artifacts.

## Scope

**In:** `plugins/nexus-analytics/skills/value-briefing/` (SKILL.md + references: profile contract,
briefing output contract, synthetic worked example); MINOR bump nexus-analytics 0.2.0 → **0.3.0** +
CHANGELOG; cross-reference edits in this slug's definition docs; Runbook A (KG governed run);
Runbook B (product-repo sync + profile).
**Out (binding Non-goals):** no value/SAP/feed fields in the bundle; no KG runtime changes
(AskEngine, endpoints, prompts, grounding roots); no intelligence-analyst agent persona (SR-2); no
probe tooling shipped or moved (W1's lane — SR-50); no live feed-coverage tracking (SR-51); **no
edits to the three accuracy skills** (`semantic-model-query`, `data-investigation`, `answer-qa` —
SR-34/62/63) and **no edits to the `data-analyst` agent** (routing to `value-briefing` is the
user's explicit invocation, Decision D6 — not a prose pointer inside an accuracy surface); no
`mine-semantic-model` output-contract or profile-template change (SR-11; Decision D3).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | new shipped skill `value-briefing` (dev-repo carve-out: author directly in `plugins/nexus-analytics/skills/`) | — |
| 2 | (none) | — | no | synthetic worked example + recorded must-fail demos | — (demo/verification, not a pattern gap) |
| 3 | evaluate-skill | Follow | no | judgment gate on the new skill after skill-lint exits 0-ERROR | — |
| 4 | (none) | — | no | acceptance greps (AC-7 set, KG-token sweep, real-data leak scan) | — (verification step) |
| 5 | release-plugin | Follow | no | `--staged`-scoped MINOR bump → nexus-analytics 0.3.0 | — |
| 6 | (none) | — | no | cross-reference edits (tech-spec W3 pointer + W1 coordination marker) | — (doc bookkeeping) |
| 7 | (none) | — | no | Runbook A — KG governed run. **Owner: operator** | — (external-repo runbook) |
| 8 | (none) | — | no | Runbook B — product-repo wiring. **Owner: operator** | — (external-repo runbook) |

TDD is `no` on every step: prose/skill artifacts and operator runbooks — no runtime code behavior
in this repo (the repo lint suite still gates Step 5; the KG validator's tests are its must-fail
demos, Step 7.5).

## Domain Model Changes

None — doc/skill feature; no aggregates or services.

## Data Model Changes — the value-model artifact schema (KG-side; authored by Runbook A)

Mirrors the KG bundle style (Decision D1): **JSON + provenance sidecar**, under KG
`docs/value-model/`:

- **`value-model.json`** — stock JSON (SR-30 parse floor):
  - `kpis` — 24 rows keyed by VWH KPI id: optional `construct` join (`measureId`/`termId` where a
    KG construct exists — SR-21); an explicit `unmapped: true` marker where none does (SR-22);
    `pool` ∈ A/B/E, composites allowed (SR-13); `value_weight` + provenance-adjusted revisions
    (labor_yield 0.9→1.4 with its evidence — SR-14); `sap: {field, fiori_app}` where sourced
    (SR-15); per-KPI `blocked` flag (SR-27).
  - `coefficients` — the S001–S007 register, each row carrying BOTH guardrail classes:
    `dimensional_plausibility` (a 1pp OOS reduction is worth fractions of a percent of category
    revenue, never 20% — SR-17) and `confounds` (phantom inventory, substitution, promo,
    seasonality — SR-18) (SR-16).
  - `feed_taxonomy` — the durable knowledge per the corrected split: PRESENT and ABSENT classes
    with the unlock map, `expand_via`/`expand_priority` semantics, the operator expansion ranking
    (SR-27); the IMPORTED class's per-client lag / live coverage drift stays OUT (SR-28); no
    connected-vs-blocked knowledge dropped (SR-29).
- **`provenance.json`** — sidecar keyed like the bundle's (`family.entry[.fields.*]`), schema-v2
  grammar: cited origins, truthful `verified` dates, no scalar confidence (SR-19/SR-20).
- **`README.md`** — governance header: KG-owned; edits land only via governed runs (SR-6/SR-7);
  one-way sync KG → product, never product → KG (SR-8); VWH is historical, not a live upstream
  (SR-9).

Exact field spellings are Runbook A's call **within this shape**; the two-file split and the
sidecar grammar are binding — they are what buys the existing-validator reuse (Step 7.4).

## Implementation Steps

Steps 1–6: developer, this repo. Steps 7–8: **operator-owed by construction** (cross-repo
boundary — a nexus developer subagent must never edit KG/product/OD-hub artifacts); done-check
disposition for 7–8 is N/A-operator-owed with the runbooks' existence in this plan as the
verifiable output. Nexus-side build (1–6) has **no sequencing dependency** on Runbook A; Runbook B
is strictly after Runbook A (SR-45).

### Step 1 — Author `plugins/nexus-analytics/skills/value-briefing/` — Follow improve-skills

Follow improve-skills (dev-repo carve-out: shipped-skill authoring + its lint gate).
Feature-specific inputs only:

- **Frontmatter** (match the plugin's shape — `name`, `description`, `user-invocable`): name
  `value-briefing`; description states the trigger class (worth / prioritization / monetization /
  displacement questions) and explicit-invocation-only posture; `user-invocable: true`;
  `disable-model-invocation: true` (mine-semantic-model precedent — Decision D6; the mechanical
  form of SR-32/33/34's gate).
- **Phase 0 — profile hard precondition** (msm discipline: never silently defaulted): read the
  consuming project's committed `docs/value-model/profile.md`. Contract =
  `references/project-profile.md`, **4 inputs**: (1) value-model artifact path(s); (2)
  semantic-model bundle root (for measured-construct cross-reference); (3) model-feedback ledger
  location — optional, may legitimately be absent/empty (SR-36); (4) KB-source search order —
  optional enrichment (SR-66). Worked example: **fully synthetic** — zero KG, omnishelf, or VWH
  tokens anywhere in the shipped skill (SR-41, stricter than msm's carve-out; Decision D5).
- **Loads:** value model + cited KB sources where reachable + open ledger entries where a ledger
  exists (SR-35). Where a cited source is not locally reachable: run on the embedded provenance
  and DISCLOSE which sources were unavailable (SR-67).
- **Authoring trap (critic LOW fold):** mine-semantic-model's `references/project-profile.md`
  worked example is NOT copy-safe — it carries `seed/db` + KG/F38/F60 tokens that Step 4.2's sweep
  bans. Write value-briefing's profile reference fresh: describe input #2 (bundle root)
  abstractly; keep the worked example synthetic.
- **Output contract** (`references/briefing-contract.md`): every number labeled
  **measured** (KG-verified constructs / probe evidence) vs **estimated** (coefficient-derived)
  (SR-37); every estimate names its coefficient source and declares the confounds that threaten it
  (SR-39); dimensional-plausibility enforced in-method — a violation is refused or flagged, never
  emitted as a plain number (SR-38); a mandatory final **`## Briefing QA`** self-check pass (scan
  for unlabeled numbers / unflagged implausibilities → the briefing is malformed, fix before
  emitting) — the paired enforcement for the prompt-shaped obligations; its hard demonstration is
  Step 2's recorded must-fail demo.
- Files: `SKILL.md`, `references/project-profile.md`, `references/briefing-contract.md`,
  `references/worked-example.md` (Step 2's fixture).

Acceptance: files exist; frontmatter fields exact; Step 4's greps green.
Satisfies: `delivery-skill-first` (SR-1), SR-32–41, SR-66, SR-67.

### Step 2 — Synthetic worked example + recorded must-fail demos

- Fixture (`references/worked-example.md`): a small **synthetic** value model — fictional KPI ids,
  weights, coefficient ids; real VWH numbers/ids never enter the public plugin (boundary rule:
  method → plugin, data → project; Decision D5). It exercises: measured + estimated rows, one
  `unmapped: true` row, one coefficient with both guardrail classes, one unreachable cited source.
- Demos, recorded in `implementation.md`: (a) a sample briefing over the fixture with every number
  labeled (SR-57, build-time arm); (b) an implausibility probe — a deliberately dimension-violating
  ask (e.g. "1pp OOS → 20% of category revenue?") → refused/flagged, never a plain number (SR-58,
  must-fail demo); (c) the unavailable-source disclosure shown (SR-67).
- **What a PASS does not prove:** the fixture demo satisfies AC-4's recorded-demo obligation; the
  real-data briefing in the product repo is the operator's arm after Runbook B (enrichment, not
  this step's gate).

Satisfies: SR-57, SR-58, SR-37/38 (demonstration).

### Step 3 — Quality gates on the new skill — Follow evaluate-skill

`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/value-briefing`
→ 0 ERROR (WARN advisories acceptable per KG-pilot precedent), then Follow evaluate-skill
(mandatory judgment gate for new skills — owner decision 2026-06-20). Fold findings before Step 5.
Satisfies: SR-56 (ship-quality arm).

### Step 4 — Acceptance greps (all executed at plan time; expected results pinned from actual runs)

1. **AC-7 negative** — `(?i)value|estimate|measured|briefing` over the three accuracy skill
   directories (`semantic-model-query`, `data-investigation`, `answer-qa`) → **0 hits**
   (baseline verified 0 on all three SKILL.md files, 2026-07-18; must still be 0 post-build —
   this build touches none of them). Satisfies: SR-62, SR-63.
2. **Token sweep on the new skill dir** —
   `(?i)knowledge-gateway|kg_|seed/db|fmcg_platform|omniaz|omnishelf|laurentiu|F52|F60|F38|MSM_PROBE_DSN`
   → **0 everywhere in `plugins/nexus-analytics/skills/value-briefing/`** (no worked-example
   carve-out — the example is synthetic; Decision D5). Satisfies: SR-41.
3. **Real-data leak scan on the new skill dir** — `(?i)labor_yield|S00[1-7]` → **0** (real VWH
   coefficient ids and revision names stay out; the fixture uses fictional ids).

### Step 5 — Release: `--staged`-scoped MINOR bump — Follow release-plugin

The tree carries a concurrent feature's plugin dirt (verified at plan time + critic re-run,
2026-07-18): F9's `plugins/nexus/agents/learner.md`, `team-lead.md`,
`hooks/scripts/read-tracker.js`, `rules/agents-workflow.md`, **plus** F9's own already-applied bump
(`plugins/nexus/.claude-plugin/plugin.json`, `CHANGELOG.md`), regenerated
`commands/{learner,team-lead}.md`, and `tests/unit/read-tracker.test.mjs` (critic LOW fold — the
nexus plugin will show a bump this feature didn't make). A whole-tree bump run would contaminate
classification (CLAUDE.md rule); the `--staged` scoping below is what makes this safe. Sequence:

1. Stage ONLY `plugins/nexus-analytics/**`.
2. `node scripts/bump-plugin.mjs --staged --dry-run` — the reasons list must name ONLY
   `plugins/nexus-analytics/**` files; any foreign plugin file → STOP and hand the bump to the
   session owning the closure commit.
3. `node scripts/bump-plugin.mjs --staged --minor --note "value-briefing skill (F8-W3)"` →
   nexus-analytics **0.3.0** + CHANGELOG entry (MINOR = new capability; spec-committed, SR-56).
4. Repo tests: `node --test tests/lint/*.test.mjs` green (glob form, Node ≥22). Disclosure: the
   unit suite includes F9's in-flight `tests/unit/read-tracker.test.mjs` (dirty at plan time) — a
   red there is the concurrent feature's state, not this feature's gate; record, don't block.
5. Commit boundary (owner/team-lead side, recorded here, not the developer's): re-check
   `git branch` + `git log` immediately before committing (concurrent-run guard); stage only this
   feature's files (plugin dir + bump + this slug's docs); subject
   `feat(F8-AnalyticsEnforcementValueLayer): ship the value-briefing skill (W3), release nexus-analytics 0.3.0`.
   **Omni twin:** the FL-2 back-port has landed (8e6d697), so the twin block is cleared — run
   `gen-omni` with the twin path per the standing convention, but under the concurrent F9 run the
   shared twin sync is DEFERRED to whichever session owns the last closure commit of the day
   (recheck-branch rule); twin commit mirrors this subject per the omni convention.

Satisfies: SR-56.

### Step 6 — Cross-reference edits (this repo's definition docs; exact text)

1. `definition/tech-spec.md`, `## W3` section — append:
   `Plan: ../delivery/plan.md (2026-07-18) — W3 planned. W1 remains gated.`
2. `definition/tech-spec.md`, `## W1` section — append the coordination marker (SR-65 resolution;
   Decision D2):
   `W3 note (2026-07-18): the value-model construct-id validator ships KG-local (docs/semantic-model/tools/validate-value-model.cs, net-new sibling — W3 plan Decision D2). It is a candidate input to this lane's generalization pass; W1 decides adopt/ignore at its gate — W3 does not pre-empt the delivery-mechanism decision (shared with F7-S0).`
3. (Done by the architect at plan approval, recorded for completeness:) the W3 spec header gains
   `**Plan:** docs/specs/F8-AnalyticsEnforcementValueLayer/delivery/plan.md`.

Satisfies: `validator-coordinate-not-preempt-w1` (SR-65), SR-10.

### Step 7 — Runbook A: KG governed run — **Owner: operator** (KG session; before Runbook B)

Executed in `D:\src\knowledge-gateway`. Pre-flight: clean tree; confirm no concurrent session is
mid-edit on `docs/semantic-model/profile.md` (committed 2026-07-18 — brand new) or the ledger.

1. **Governed-run discipline:** the value model is CREATED BY this run — never hand-authored
   outside it (SR-7). Run report at `docs/model-runs/{date}-analytics-value.md` with the mandatory
   BR-C `## Feedback dispositions` section. **Any validator non-zero exit blocks the run** — it
   reports and stops; no artifact lands (SR-25).
2. **Author `docs/value-model/`** (`value-model.json`, `provenance.json`, `README.md`) per the
   Data Model Changes schema above, seeded from the three W3-parked entries in
   `docs/model-feedback/analytics.md` + the OD-hub KB note (read-only source:
   `D:\omnishelf\omnishelf-docs\kb\analytics-value-model-vwh-import.md`) (SR-31): all 24 KPI rows
   (SR-52), S001–S007 with both guardrail classes, feed taxonomy per the corrected split,
   provenance for every value/weight/mapping.
3. **Build the net-new validator** `docs/semantic-model/tools/validate-value-model.cs` —
   single-file dotnet app, same invocation + exit-code convention as its sibling
   `validate-provenance.cs` (`dotnet run … -- [--file]`; 0 pass / 1 violations / 2 unreadable).
   Checks: **construct-id join** — every referenced `measureId`/`termId` resolves against the live
   bundle files (SR-21/SR-23); rows with no construct carry the explicit `unmapped` marker
   (SR-22); value-model shape (pool enum incl. composites, required fields, both guardrail classes
   present on every coefficient row); **the full schema-v2 provenance grammar on the value-model
   sidecar** — origin enum, truthful `verified`-date shapes, no scalar-confidence leaves — as
   ported logic, owned here unconditionally (SR-19/SR-24; critic HIGH fold). **Zero edits to
   `validate-provenance.cs`** (SR-64 net-new;
   W1's generalization unit untouched — SR-50/SR-65).
4. **Scalar-leaf arm only — no grammar reuse** (critic HIGH fold): `validate-provenance.cs` is
   bundle-family-bound — its grammar pass iterates 7 hardcoded families (`:63`) and silently skips
   any other (`:70-72`), so against a kpis/coefficients/feed_taxonomy sidecar it exits **0 with the
   grammar checks never run**; only `ScanForScalars` (`:130`) is family-agnostic. The grammar
   (SR-19/SR-24) is therefore owned unconditionally by `validate-value-model.cs` (7.3). Retain
   `dotnet run validate-provenance.cs -- --file <docs/value-model/provenance.json>` only as an
   independent scalar-leaf arm for SR-54's demo — **never treat its exit 0 as grammar-valid**.
5. **Must-fail demos, recorded in the run report:** corrupt one construct id → non-zero exit
   (SR-53); introduce a scalar-confidence leaf → non-zero exit (SR-54); restore both.
6. **Close the three entries grounded:** resolution appends (BR-D append-only) pointing at
   value-model rows (SR-42); all three dispositioned in this run's report. SR-43/SR-55 ("next
   analytics-area run reports zero still-open W3-parked dispositions") is **verified on the NEXT
   run** — disclosed as such, an operator-owed follow-through, not this run's assertable output.
7. **Negative gates (executed; results in the run report):** over `seed/db/semantic-model/`:
   `(?i)value_weight|\bsap\b|fiori|feed_state|expand_via|expand_priority|labor_yield|S00[1-7]` →
   **0** (verified 0 at plan time, 2026-07-18); `\bpool\b` → exactly the **1 pre-existing
   whitelisted hit** `entity-graph.json:4` ("…analytics pool…" — prose homonym, DO-NOT-TOUCH, not
   value content) (SR-59). **Ask-path untouched:** the run's diff shows changes ONLY under `docs/`
   (`value-model/`, `model-feedback/analytics.md` resolution appends, `model-runs/`, the new
   `semantic-model/tools/` file) — zero changes under `seed/`, `src/`, or any runtime path
   (SR-60/SR-47/SR-49/SR-26/SR-48).
8. **OD-hub follow-up (operator, third repo):** add the authority pointer to the OD KB note — the
   note stays the human-readable companion; the value model is authoritative (Decision D4).
9. Working tree left uncommitted for operator review (W2a precedent).

Satisfies: SR-6/7/25/26/31, SR-42/43(deferred-next-run)/52/53/54/59/60, SR-21–24.

### Step 8 — Runbook B: product-repo consumer wiring — **Owner: operator** (strictly after Step 7 — SR-45)

Executed in the omnishelf-analytics product repo (owner session;
`D:\omnishelf\omnishelf-analytics`):

1. Extend `scripts/sync_model.py` **additively**: new source (KG `docs/value-model/`) + dest
   `docs/value-model/` — a distinct dest dir, avoiding a `provenance.json` filename collision with
   the synced bundle's — + **opt-in flag, default OFF** (SR-44/SR-46); direction stays one-way
   KG → product (SR-8). (Re-grounded live by the plan critic 2026-07-18: hardcoded single-bundle
   copy, `BUNDLE_FILES:25-33`; additive extension feasible without restructure.)
2. Run **one owner-run sync** with the flag; document the second artifact + its direction where
   the bundle sync is documented (SR-61).
3. Author the product repo's `docs/value-model/profile.md` (the skill's 4 inputs: synced
   value-model path; bundle root; ledger location = none — legitimately absent, SR-36; KB search
   order = optional/OD-hub) (SR-40).
4. Optional enrichment: a real-data briefing via `/value-briefing` — the operator's arm beyond
   AC-4's recorded fixture demo.

Satisfies: SR-8/40/44/45/46/61.

## Cross-Service Changes

Cross-REPO, not cross-service — four repos, each edited only in its own session: **nexus** (skill +
release, Steps 1–6), **KG** (artifact + validator + closure, Step 7), **product repo** (sync +
profile, Step 8), **OD hub** (authority pointer, Step 7.8).

## Migration Notes

None — no database; the value model is created governed-from-scratch.

## Testing Strategy

- skill-lint 0-ERROR + evaluate-skill judgment gate (Step 3).
- Recorded fixture demos: labeling, implausibility refusal, unavailable-source disclosure (Step 2).
- Negative greps with pinned, plan-time-executed baselines (Step 4; Step 7.7 KG-side).
- KG validator must-fail demos (Step 7.5).
- Repo lint suite green; F9's in-flight unit test disclosed as not-this-feature's-gate (Step 5.4).

## KB Impact

None in this repo (the dev repo hosts no consumer KB). KG-side knowledge lands as the governed
artifacts themselves; the OD-note pointer is Step 7.8.

## Decisions

| # | Decision | Why | Rejected alternative | Status |
|---|----------|-----|----------------------|--------|
| D1 | Value-model format = **JSON + provenance sidecar** mirroring the KG bundle style (`value-model.json` + `provenance.json` + `README.md`) | Keeps the bundle's authoring conventions KG operators already know, and the family-agnostic `ScanForScalars` pass via `--file` gives a free independent SR-54 arm; the grammar (SR-19/SR-24) is enforced by the net-new validator — the existing tool's grammar pass is bundle-family-bound (critic HIGH fold); stock JSON meets SR-30's verified parse floor | Single structured file with inline provenance — forfeits even the scalar-leaf reuse and diverges from the shape KG operators author | decided |
| D2 | Validator home = **net-new KG-local sibling** `docs/semantic-model/tools/validate-value-model.cs`; W1 gets a coordination marker (Step 6.2), decides adopt/ignore at its own gate | Resolves ambiguous SR-64/SR-65: net-new capability, `validate-provenance.cs` untouched, nothing ships in the plugin — the F3 owner directive ("no tooling ships; generalizing tooling is F8-W1's lane") is standing precedent | Extend `validate-provenance.cs` (couples the accuracy tool to value content, muddies W1's unit); ship plugin tooling now (pre-empts the W1/F7-S0 delivery-mechanism decision) | decided |
| D3 | `value-briefing` ships its **own lean 4-input profile contract** (consuming repo: `docs/value-model/profile.md`) — not a 12th mine-semantic-model profile input | The first consumer doesn't run mine-semantic-model — binding briefings to the 11-input mining profile forces dead intake on the product repo; keeps every accuracy-skill file 100% value-free | Extend msm's `references/project-profile.md` with item 12 | decided |
| D4 | OD KB note **kept** as the human-readable companion; operator adds an authority pointer in the OD hub (Step 7.8) | Cheapest honest resolution of the spec's 4th open question; supersede/delete is the OD-hub owner's call in that repo | Supersede the note now | decided |
| D5 | AC-4's demo = **recorded synthetic-fixture demo at build time**; real VWH values never enter the public plugin | nexus is public — VWH value weights / SAP mappings are proprietary engagement data (boundary rule: method → plugin, data → project); a fixture demo keeps AC-4 verifiable at ship | Fixture from real VWH rows (leaks data); defer the demo until product wiring (AC-4 unverifiable at ship) | decided |
| D6 | Invocation gate = `user-invocable: true` + `disable-model-invocation: true` (msm precedent) | The strongest mechanical form of "invoked explicitly"/gated (SR-32/33/34): default flows structurally cannot auto-load it | Model-invocable with prose-only gating (weaker; one hallucinated auto-load breaks a golden negative) | decided |
| D7 | Plan scope/naming: standard `delivery/plan.md`, scoped to W3 only (F3 "increment 0" precedent); W1 plans separately at its gate | One plan per triggered workstream; pipeline machinery greps the standard path | `w3-plan.md` sibling naming — breaks the standard-path greps | decided |

## Open Questions

None blocking. Recorded deferrals (not this plan's to resolve): W1's adopt/ignore call on
`validate-value-model.cs` (its lane, at its gate); the standing L3 skill-shadowing question
(F7-S0 spike); SR-43/SR-55's next-run verification (operator follow-through after Runbook A).

## Plan Review

Code-grounded critic (opus), 2026-07-18 — both repos read live, every grep re-run. Verdict:
**GO-with-fixes — all folded same day** (the steps above are post-fold; this section is the
disposition record).

| Sev | Finding | Disposition |
|---|---|---|
| HIGH | Step 7.4's grammar-reuse claim was false: `validate-provenance.cs`'s grammar pass iterates 7 hardcoded bundle families (`:63`; non-matching skipped `:70-72`) — against the value-model sidecar it silently exits 0 with grammar never run, and the "structurally rejects" contingency could never fire; only `ScanForScalars` (`:130`) is family-agnostic | Fixed — grammar fold made unconditional: `validate-value-model.cs` owns SR-19/SR-24 (Step 7.3); the `--file` run retained as the SR-54 scalar-leaf arm only (Step 7.4); D1 rationale reworded |
| LOW | Step 5's F9-dirt disclosure was a subset (~8 files incl. F9's own bump, regenerated commands, and its test) | Fixed — full list disclosed; `--staged` scoping named as the safety |
| LOW | msm's profile worked example is not copy-safe (carries `seed/db`/KG tokens the Step 4.2 sweep bans) — a copy-adapt would trip the gate | Fixed — authoring-trap note added to Step 1 |

Verified-correct by the critic (do not re-verify): plugin version 0.2.0 + skill set + frontmatter
shapes; msm's profile hard-precondition text; Step 4 greps (AC-7 = 0 live-confirmed with a control
pattern; sweep patterns well-formed); `bump-plugin.mjs` `--staged`/`--note` semantics; skill-lint +
evaluate-skill paths; KG `docs/value-model/` absent; `validate-provenance.cs` `--file` + exit
codes; the three W3-parked entries open; bundle = JSON + sidecar; Step 7.7 baseline greps incl. the
single whitelisted `pool` hit (`entity-graph.json:4`); Step 8.1 re-grounded live (`sync_model.py`
exists, single-bundle copy, additive extension feasible, dest collision avoided). D2–D7 survived
refutation; D1's format survived with its rationale corrected.
