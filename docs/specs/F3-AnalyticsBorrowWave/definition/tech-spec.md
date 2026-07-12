# F3-AnalyticsBorrowWave — import VWH retail-flavor honesty discipline into nexus-analytics (0.2.0)

**Status:** Ready — architect, 2026-07-12; critic review (code-grounded, opus) returned GO-with-fixes
same day, all findings folded (2 HIGH, 4 MEDIUM, 3 LOW — see `## Critic disposition`). Owner-directed
(no proposal; ADR-58 lane: architect-designed ⇒ feature slug + backlog row). **Stage 0 gates the
build stages.**
**Source analysis:** `docs/research/2026-07-12-mine-family-vs-vwh-per-member.md` §7 (deep-dive of
`D:\omnishelf\virtual-worker-harness\harness\flavors\retail_intelligence\`, grounded reads 2026-07-12).
**Target:** `plugins/nexus-analytics` 0.1.0 → **0.2.0** (MINOR — new capability: the value-ledger
skill; owner escalation per release policy, and owner already named 0.2.0).
**Boundary rule (binding, already settled):** *method → plugin, data → project, autonomous loop →
VWH* (`docs/proposals/vwh-adoptions-2026-06.md:242-244`; restated in the adhoc-AnalystExtension
tech-spec). Everything below imports **method**; nothing imports the loop.

## Goal

nexus-analytics 0.1.0 ships the query/model method but has no discipline layer for the *claims* an
analyst ships: no persistent value-claim artifact, no mechanical grounding check on insights, no
codified analyst craft. VWH's retail flavor paid real tuition for exactly these (a gaming vector
caught live; production analyses on the fmcg_platform DB with confound control and honest nulls).
This wave imports the proven, zero-coupling mechanisms as nexus-analytics method.

## Stage 0 — gate: first real 0.1.0 pilot (operator-owed, not a plugin edit)

The plugin has **zero real-world validation runs**. Before any borrow lands: one pilot on a real
consumer (**first target: the analytics workspace / fmcg_platform DB** — the recorded first
consumer whose `docs/semantic-model/profile.md` is operator-owed since adhoc-AnalystExtension;
KG is run #2, exercising the refresh/migration path of the relocated skill) —
author `profile.md` there, run `mine-semantic-model` once for real, run one live query lane through
`semantic-model-query` + `answer-qa`. **Exit criteria:** the pilot's lessons are written and each
S1–S3 item below gets a one-line placement confirmation or correction from them. Stage-2 items are
triggered (or dropped) by pilot signals, not by default.

## Stage 1 — core borrows (the 0.2.0 content)

**S1 — `value-ledger` skill (new; the wave's centerpiece).** The ESTIMATED→MEASURED value-claim
lifecycle our own proposal deferred ("adopt when analyst claims ship to stakeholders" —
`nexus-data-extension-2026-07.md:40-41`; that trigger is the point of this wave). Ships as method +
output contract; the artifact lives in the consuming project at `docs/value-ledger/` (data → project):
- Contract (a `references/output-contract.md`): 1-line index file + one detail doc per claim with
  YAML frontmatter — `{id: VL-NNN, kpi/claim, estimate, confidence, evidence: {source, query|rows},
  status: proposed | validating | validated | invalidated | retired, last_verified}`. `retired` is
  the never-delete terminal disposition (superseded/abandoned claims flip to it, never vanish). The
  source's sixth state `refining` is intentionally dropped — a claim under refinement re-enters
  `validating`.
- Lifecycle grammar: status transitions are append-only with a dated changelog line — reuse the
  mine-family registry invariants (never-delete, disposition flips, idempotent refresh) verbatim by
  pointer to `mine-family-core.md` `## Registry invariants + refresh outcome grammar` (the full
  heading; do not restate the content).
- Provenance: pattern from VWH `flavors/retail_intelligence/value_ledger.py` + `TEMPLATE.md` + the
  live VL-005/011/017 entries; re-expressed as prose contract + (optional) one small deterministic
  index-check script.

**S2 — `answer-qa` hardening (grounding gate + penalty-only doctrine + provenance presentation).**
- Grounding gate (net-new section — the live skill has none): before an answer or value claim
  ships, every cited evidence reference must **re-execute** — the query re-runs (or the cited rows
  re-fetch) and the excerpt is attached; a claim whose evidence does not re-execute is dropped, not
  shipped. Same shape as the family skeptic's excerpt-or-drop; cite it, don't reinvent it. (VWH
  source: `value_model.py:41-74` — uncited coefficient earns zero.)
- Penalty-only doctrine (one paragraph, answer-qa + persona): *an agent-produced estimate feeding
  any score, rank, or recommendation may only ever count against it, never for it, until it is
  validated in the ledger.* Paid-tuition rule — VWH caught the summed-forecast gaming vector live
  (`memory/retail_intelligence/forecast-not-summed.md`).
- Provenance presentation convention: numbers ship with source + query alongside the contract's
  existing Date-range and Constructs items — an integration of answer-contract items 3–4 into one
  provenance panel plus CSV-first export, **not** a duplicate obligation. *(Deliberate tier note:
  research §7.5 had reporting discipline pilot-gated; it is promoted to Stage-1 here because it is
  cheap prose riding an S2 edit already happening — and Stage-0's exit criteria can still demote it.)*

**S3 — `analyst-craft.md` reference (homed under answer-qa).** The ten §CRAFT discipline moves
(VWH `cookbook.md:210-257` — attribution isolation; effort≠outcome; actionable-vs-structural gap
decomposition; the validity firewall; coverage-as-frontier; per-entity dynamic baselines;
distribution-over-mean; heterogeneous effect sizes; value-as-provenance-band;
managed-cohort≠population), as a **domain-generalized rewrite** — retail illustrations replaced
with domain-neutral ones; this is genuine rewriting, not a verbatim lift. **Location:**
`plugins/nexus-analytics/skills/answer-qa/references/analyst-craft.md` — skill `references/` is the
proven shipped-and-linted layout; `agents/references/` has zero precedent in the repo and no
packaging/lint guarantee (critic HIGH-1). The `data-analyst` agent and `answer-qa` both point to it
in prose.

**S4 — CI rider (two precise edits, not "add bump-check").** The version-bump gate **already
covers** nexus-analytics — `bump-plugin.mjs:111` classifies by the marketplace-agnostic
`^plugins\/([^/]+)\/` regex. The real hardcoded gaps in `plugin-release-check.yml`:
1. the `Generated commands in sync` step (`:40-44`) runs `gen-commands.mjs nexus` + diffs
   `plugins/nexus/commands` only — extend with `nexus-analytics` + a diff of
   `plugins/nexus-analytics/commands` (this feature edits that plugin's agent, making the gap live);
2. the `plugin-validate` job list (`:74-75`) — add `plugins/nexus-analytics`.

## Stage 2 — pilot-signal-gated (default skip unless the pilot shows the pain)

- **Boot briefing** (session-start state rendered deterministically from the ledger, jargon
  translated, never free-handed numbers — VWH `briefing.py` + `speak-plainly.md`): adopt only if the
  pilot shows session-continuity pain. Depends on S1.
- **Per-persona expansion grammar** ("If [X data], we could [Y outcome]" — VWH `persona.md:102`):
  graft into `mine-semantic-model`'s interview-protocol only if the pilot's interview phase feels
  shallow.

## Non-goals (recorded so they aren't re-litigated)

- **KPI feed-state coverage** (blocked-vs-covered computation, demand-weighted leaked value) — real
  design work; its own future feature if the pilot surfaces "why can't this be answered" friction.
- **Deferred-feedback miscalibration scoring** — stays deferred; its trigger (stakeholder ratings
  exist) is downstream of the ledger this wave ships.
- **Engine-computed scoring loop, firewall/held-out tiers, SOTA/certify** — never; boundary rule.

## Acceptance

**Grep-checkable:**
1. `plugins/nexus-analytics/skills/value-ledger/SKILL.md` + `references/output-contract.md` exist;
   contract carries the five status values (incl. `retired`) and the `last_verified` field;
   invariants section is a pointer citing the full heading
   `## Registry invariants + refresh outcome grammar` in `mine-family-core.md`, not a restatement.
2. `answer-qa/SKILL.md` carries a `## Grounding gate` section (re-execute-or-drop wording) and the
   penalty-only paragraph; the answer contract's provenance panel integrates (not duplicates) the
   existing Date-range/Constructs items.
3. `answer-qa/references/analyst-craft.md` exists with 10 moves; domain-vocabulary grep is clean:
   no `chain 22|OmniShelf|SAP|shelf|planogram|realogram|OOS|SKU` in the shipped text.
4. `plugin-release-check.yml` carries both S4 edits: gen-commands-sync extended to nexus-analytics
   (command + diff), and `plugins/nexus-analytics` in the plugin-validate list.
5. `commands/data-analyst.md` regenerated after the agent edit
   (`node scripts/gen-commands.mjs nexus-analytics`; `git diff plugins/nexus-analytics/commands`
   clean).
6. skill-lint exit 0; self-containment grep (no `D:\omnishelf`/dev-repo paths in shipped text) = 0
   hits.
7. `plugin.json` 0.2.0 + CHANGELOG entry in the same commit.

**Judgment gates (not grep-shaped — run, don't grep):**
8. evaluate-skill ACCEPT on both touched skill folders (value-ledger, answer-qa).
9. Reviewer judgment that analyst-craft.md reads domain-neutral beyond the vocabulary grep (AC-3's
   list is a tripwire, not proof).
10. omni-analytics twin regenerated **and committed in `../omni`** with the mirrored-subject
    convention (regen alone is not closure).

## Decisions (architect, disclosure per plan-template)

- **New skill vs extending answer-qa for the ledger → new skill.** The ledger is an artifact-species
  method (like every mine); answer-qa is a per-answer gate. Two lifecycles, two skills. (Two-way
  door; rejected: folding into answer-qa — would couple claim persistence to answer shipping.)
- **analyst-craft.md homed under `answer-qa/references/`, not `agents/references/`** (critic
  HIGH-1). Skill references are the proven packaged-and-linted layout; an agent-level references dir
  exists nowhere in the repo. Rejected: a dedicated micro-skill (overhead without a lifecycle of its
  own); `agents/references/` (unproven packaging, ships un-linted).
- **Five ledger statuses, adopting `retired`, dropping `refining`** (critic MEDIUM-1). `retired` is
  the natural never-delete terminal the imported invariants require; `refining` collapses into
  `validating`. Rejected: the 4-state simplification (left abandoned claims dispositionless).
- **Reporting discipline promoted from pilot-gated (§7.5) to Stage-1** — deliberate: cheap prose on
  an S2 edit already happening; Stage-0 exit criteria retain the demotion path.
- **MINOR (0.2.0), not PATCH** — new capability (a new skill + a new consuming-project artifact
  species). Owner already named 0.2.0; recorded as the escalation rationale.
- **ADR owed at ship, not now:** "value ledger as a consuming-project artifact species" (the
  ADR-45/49 registry-species pattern applied to value claims) — extract when the wave ships (ADR-28:
  extracted, never re-authored).

## Critic disposition (2026-07-12, code-grounded, verdict GO-with-fixes)

| Finding | Disposition |
|---|---|
| HIGH-1 `agents/references/` unprecedented, un-linted | Fixed — relocated to `answer-qa/references/`; Decisions row added |
| HIGH-2 S4 mislabeled CI gap, undercounted edits | Fixed — S4 rewritten (bump-check already covers; gen-commands + validate are the real gaps); AC-4 names both |
| MEDIUM-1 status enum dropped `retired`/`refining` | Fixed — `retired` adopted, `refining` consciously dropped; Decisions row |
| MEDIUM-2 gen-commands regen missing from acceptance | Fixed — AC-5 added |
| MEDIUM-3 acceptance header overclaimed grep-checkability | Fixed — split into grep-checkable vs judgment gates |
| MEDIUM-4 "near-verbatim" vs domain-generic contradiction; narrow grep | Fixed — S3 reworded to domain-generalized rewrite; AC-3 grep broadened + AC-9 judgment backstop |
| Gap: reporting tier moved from §7.5 without note | Fixed — deliberate-tier note in S2 + Decisions row |
| Gap: provenance panel duplicated contract items | Fixed — S2 states integration, not duplication |
| Gap: omni twin needs commit, not just regen | Fixed — AC-10 |
| LOW-1 partial heading in pointer | Fixed — full heading cited in S1 + AC-1 |
| LOW-2 loose illustrative CRAFT list | Fixed — S3 lists the real ten (validity firewall + gap decomposition restored, invented item dropped) |
| LOW boundary-rule "P5" label | Accepted as-is — citation now points at `vwh-adoptions-2026-06.md:242-244` directly |

## Effort / sequencing

Stage 0: operator-owed, unblocks everything. Stages S1–S4: one pipeline pass, `med` effort (S1 is
the only design-bearing item; S2–S4 are prose + two workflow edits). Stage 2: separate small rider
only if triggered.
