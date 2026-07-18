# Proposal — nexus-analytics AM-facing features (plugin lane of the ratified AM-workspace proposal)

**Status:** Ratified (2026-07-18 — inherited: this is the plugin-lane extract of the parent product
proposal, ratified same day by the same decision-maker; recorded here so this repo's backlog rows
trace to a local proposal)
**Decision-maker:** Laurentiu
**Recommendation:** Ship the four AM-facing behaviors — workspace self-heal, saved prompts,
fail-closed intake, usage capture — in the nexus-analytics plugin, versioned by release tag, so
every consuming repo gets them identically.
**Confidence:** High — inherits the parent's basis: every mechanism exists and is verified in the
estate; the one open dependency (shared-Sheet provisioning, for E-capture only) is a known cutover
item, not an unknown.
**Impact:** 8
**Effort:** med
**Date:** 2026-07-18

## Need

The omnishelf-analytics product serves 10–20 non-technical Account Managers. Four gaps keep it
from being something they can live in daily; all four are plugin-shaped (every consumer must get
them identically, versioned): AM files colliding with `git pull` (B), no way to save/replay
prompts (C), silently assumed query parameters producing confidently-wrong numbers (D), and no
channel from the real AM query stream back into the semantic-model improvement loop (E).

**Out of scope (parent decisions, binding):** any write path into KG's model; auto-promotion of
model changes without a human gate; per-repo (non-plugin) implementations of these behaviors.

## Approach

Four features, in rank order (decided at parent ratification):

**D. Fail-closed intake (mandatory clarification) — first.** Before running, correlate the
question against the semantic model's required inputs for the resolved measures and ask for every
missing one in ONE batched message; any documented default that is applied must be named in the
answer ("assumed: last 30 days, chain 22") — never invisible. Two binding design commitments from
the parent review: (1) the must-specify classification lives **in the semantic model as
per-measure data** (KG-governed, synced to consumers — the classification pass itself is a KG-lane
work item; define the plugin's fallback behavior while flags are absent, e.g. grain/date-range/
chain always-mandatory baseline); (2) the plugin intake is the **single interview owner** — the
consuming repo's `interview.md` gets absorbed/retired (a product-repo work item tracked there).

**B. Workspace self-heal.** The consuming repo commits a single `my-workspace/` parent (star-form
ignore `my-workspace/*` + `!my-workspace/README.md` — a fully-ignored *directory* cannot
re-include the README; already done in omnishelf-analytics). The plugin's self-heal: create
`my-workspace/` + standard subfolders (`exports/`, `prompts/`) if missing; **warn** the repo owner
if the ignore entry is absent; **never** append to `.gitignore` (tracked file — a plugin-side
append leaves every AM clone permanently dirty, the exact pull conflict B exists to prevent).
Export skills default their output to `my-workspace/exports/`.

**C. Saved prompts.** "save this as *weekly OSA report*" → a plain file in
`my-workspace/prompts/`; "run / list my prompts" replays them. No server (KG's web product solved
this server-side — F25/F67; this is the file-based sibling). Sharing = send to the owner, who
promotes into a committed shared folder.

**E-capture. Per-question signal record.** (timestamp, AM identity, question, resolved measures,
generated SQL, runtime, outcome: ok/slow/wrong/clarified, optional correction) — buffered to a
local append-only log in `my-workspace/`, flushed in batches to the product's shared-Sheet channel
(identity-keyed, code-verified, **not yet provisioned** — hard dependency on the product's cutover
items). **Explicitly fail-open**: capture failure never blocks or degrades an answer. Result rows
never captured — questions and SQL only. The strongest signal (*wrong + correction*) needs a
deliberate UX affordance — a named spec requirement (borrow the shape of KG's F41 thumbs vote).

## Benefits

Every consumer identical via one release tag; fewer confidently-wrong answers (D is the single
biggest trust lever with a non-technical audience); AM clones never break on pull; the model
improvement loop finally gets its strongest signal source while KG's human-gate stays intact.

## Alternatives

Adjudicated at the parent (see Provenance): auto-improve on AM machines (rejected —
exemplar-poisoning), per-repo implementations (rejected — drift), Azure Blob capture transport now
(deferred — revisit on volume), scheduled/CI sync (deferred — different lane).

## Unresolved

1. Staging (parent Unresolved 5, lean recorded): prove E-capture **project-local in
   omnishelf-analytics first** (the record shape will churn; mining-skill precedent); ship D
   straight to the plugin.
2. The "wrong answer" affordance shape (parent Unresolved 6) — PO shaping at spec time.
3. Home of the chain-default persistence once the plugin owns the interview (parent Unresolved 7):
   today it is the consuming repo's `.claude/config.json` via `set_default_chain` — the
   plugin-owned intake needs a per-consumer home that the absorption must not silently drop.
4. D's fallback contract while KG's must-specify flags don't exist yet (baseline-mandatory set?).

## Graduate-to-spec

Product branch, this repo's pipeline: PO shapes one spec per feature in rank order — **D first**,
then B-selfheal, C, E-capture (E-capture last; it is also gated by the shared-Sheet provisioning
and the staging lean above). Backlog rows in this repo's `docs/backlog.md` on slug confirmation.

## Provenance

Plugin-lane extract of
`D:\omnishelf\omnishelf-analytics\docs\proposals\2026-07-18-am-workspace-and-two-leg-improvement.md`
(ratified 2026-07-18; see its revision log for the two same-day review passes and the
post-ratification `my-workspace/` shape decision). Sibling lanes: product-repo features tracked in
that repo's `docs/backlog.md`; KG lane (must-specify flags classification, ledger-drafting
routine) to the KG backlog. Extract authored by the analytics-product PO session, 2026-07-18.
