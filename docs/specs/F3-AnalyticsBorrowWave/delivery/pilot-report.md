# F3 Stage-0 pilot report — KG query-lane run (run #2, committed-bundle path)

**Status:** Pilot evidence — data-analyst persona (Opus 4.8), 2026-07-19. **Partial run by
design:** this session executed **Run step 3 only** (the live query lane) of the six-step
`pilot-plan.md`, against KG's **already-committed** bundle (`seed/db/semantic-model/`). It is the
`pilot-plan.md` "run #2 (refresh/migration path)" vantage — KG already has a bundle, so Phase-0
intake (step 1) and a fresh area Bootstrap (step 2) were not re-run here. The fresh-consumer
**run #1** on the fmcg_platform workspace (Phase-0 intake + a real Bootstrap + the runner
adaptation that feeds F8-W1) is still owed; the friction it will surface is called out where this
lane could not reach it.

**Scope boundary (read this before trusting a number below):** no live read-only DSN was resolved
in this shell (`MSM_PROBE_DSN` unset; the local seed dry-run container on :5433 was down), and the
task scoped the lane to the *committed bundle*. **No SQL was executed.** Every magnitude cited is a
**grounding attestation already committed in the bundle** (dated, windowed), never a fresh result.
This no-DSN outcome is legitimate per the plan's stop rules ("a profile-only session is still
partial progress… the value is the validation run, not the finding") — and it is the exact
condition that made the S2 grounding-gate signal legible (see below).

---

## The business question (real, analyst-shaped, Reports-class)

> "Support tickets spiked about scans not showing up. **How many reports did we lose to failed
> uploads last month (June 2026), and is the failure concentrated on particular app versions or
> devices** we should push to update?"

Reports-class (report-loss) — the KG-proven starter the plan names. Chosen deliberately to load
the machinery: it conflates two measures at two grains in one breath, rides the events-fact
carve-out from the mandatory filter, and carries a lower-bound honesty caveat — the hardest
grounding/provenance test in the bundle.

## Query-lane outcome

**Skills executed (namespaced, both v0.3.0 from the plugin cache — no project-local shadow):**
`nexus-analytics:semantic-model-query` (resolution ladder + pre-query obligations), then
`nexus-analytics:answer-qa` (shipped-answer contract). Precondition #2 of the plan (namespaced
invocation, guard against a same-name project-local skill) **held** — the retired project-local
`.claude/skills/mine-semantic-model/` copy did not shadow the query/QA skills, and the profile's
own instruction to invoke namespaced was followed.

### Resolution ladder (semantic-model-query)

| Rung | The analyst's word | Resolved to | Note |
|------|--------------------|-------------|------|
| grain → table | "reports lost" | grain = **report** → measure `lost-reports` → `analytics_events` (scan_session gap) | report-grain, **lower bound** |
| grain → table | "failed uploads" | grain = **run** → measure `failed-upload-runs` → `analytics_events` (`MERCH_APP_UPLOAD_REPORTS_FINALIZED`, `is_success='false'`) | run-grain; a run brackets a **batch** of reports |
| metric → column | "how many lost" | `lost-reports` = distinct `scan_session_id` with `MERCH_APP_START_UPLOAD_REPORTS` and **no** matching `..._FINALIZED` | corroborated by direct `is_success='false'` |
| dimension → join | "app versions / devices" | `analytics_events.app_version`, `analytics_events.device_model` (both decision-relevant on the measure) | single-table; no fan-out guard triggered |
| dimension → join | "our chains" | `retail_chain_id` (+ LEFT JOIN `retail_chains` for names) | must be **exact per chain** — see bound below |

**The model forced the disambiguation the question fused:** "how many reports did we lose **to
failed uploads**" is not one number. `lost-reports` (report grain, lower bound) ≠
`failed-upload-runs` (run grain). The count the analyst wants is `lost-reports`; "to failed
uploads" names the mechanism, not the grain. Reporting the run count as the report count is exactly
"the review's error" the measure notes flag — the ladder caught it before a query was shaped.

### Mandatory-obligation pre-query check (the gate that prevents a *wrong* number)

1. **Bad-reports-excluded class → EXEMPT, and that exemption is itself the obligation.** Both
   measures are `badReportsFilter: "exempt"` (BR9 Scope-Ext carve-out): they query `analytics_events`
   only, which is **not** wrapped in the `analytics_reports` quality filter. The obligation here is
   to *name the exemption* — an analyst reflexively expects the bad-reports filter; on the events
   fact it correctly does **not** apply, and claiming it did would be a false-filter (inverted
   obligation) malformation.
2. **No-gold-tables class → N/A.** The answer is on the raw events fact, not a pre-aggregated
   gold/snapshot table.
3. **Large-table bound → the strict three-part shape.** `analytics_events` (~187M rows / ~90GB,
   single-column indexes) mandates a `date` window **AND** an exact `event` **AND** an exact
   `retail_chain_id`, all three present. The verified queries add the operational rail: run **per
   chain, one week per statement**; even the fully-bounded month **times out** (live-verified
   2026-07-18, chains 22 & 41); on cold-cache timeout **slice to days, never widen**.

All three cleared → the query plan is ready. Four committed verified queries ground it:
`vq-lost-reports-total`, `vq-period-report-loss-by-version-device`, `vq-failed-upload-runs-count`,
`vq-failed-upload-runs-by-version-device-chain`.

### The shipped answer (answer-qa contract, all five items)

- **Grain:** report (for `lost-reports`, lower bound) **and** run (for `failed-upload-runs`) — named
  distinctly, never equated.
- **Filters (as applied):** standard bad-reports filter **EXEMPT** here (BR9 events carve-out),
  stated as *not applied and why* — not silently, not falsely as applied.
- **Date range:** June 2026 (2026-06-01 … 2026-06-30), executed as **per-chain weekly slices summed**
  (weekly counts / distinct-session gaps are additive across non-overlapping weeks). Boundary
  caveat: a session finalized just after a slice edge counts as lost in that slice — loop adjacent
  weeks to net it out.
- **Constructs:** measures `lost-reports`, `failed-upload-runs`; entities `report_upload_run`,
  `scan_session`, `retail_chain`; dimensions app-version, device-model, retail-chain; the four
  verified queries above.
- **Data caveats:** (a) **lower bound** — reports lost before their events uploaded leave no
  server-side trace, so true loss ≥ measured; (b) **run≠report grain**; (c) **legacy signature** —
  pre-5.1.7 clients emit `MERCH_APP_SYNC_FINALIZED.is_success='false'` (sync_run entity); if June
  2026 includes pre-5.1.7 app versions, omitting that signature under-reports old-version loss —
  directly relevant since the question asks which versions to push-update; (d) **boundary** (above).

- **The number — not shippable from the committed bundle; disposition = ESTIMATED / pending
  live validation.** The query shape is attested, but the bundle carries **no June-2026 result
  rows** for this question. The only live magnitudes in the bundle are grounding-probe evidence from
  a **2-day chain-22 window (2026-07-09)**: **247** direct `is_success='false'` failed upload runs,
  and **4,570 started vs 4,038 finalized ⇒ ~532** started-but-never-finalized. These size the
  signatures and prove they are real — they are **explicitly not the June 2026, all-chains answer**,
  and generalizing them would commit the managed-cohort≠population error (one chain, two days →
  "our chains, last month"). To ship the number: resolve `laurentiu_read@fmcg_platform`, run the
  four verified queries per-chain × weekly across June, sum.

**Answer-qa verdict:** the answer's *shape* clears all five contract items. What answer-qa 0.1.0
could **not** do is force the pending number to re-execute-or-drop — see the S2 signal.

## Did the grounding / provenance machinery hold?

- **Provenance — HELD.** `provenance.json` + each measure's `verified` field carried dated,
  windowed, method-tagged attestations (2026-07-09 events grounding on clean 7-11 PH; 2026-07-18
  live timeout behavior; `carried(F38)` origin tokens; the audit refutation notes). The lower-bound
  framing and the run-vs-report grain split are first-class *in the model*, not something the
  analyst had to remember. Nothing in the ledger was silently dropped.
- **Grounding — HELD ONLY TO QUERY-SHAPE, NOT TO VALUE.** The bundle grounds the *canonical SQL*
  (four verified queries matched the question exactly), so the query is trustworthy. But
  "grounding" in the VWH/F3 sense — *re-execute the evidence and attach the excerpt, or drop the
  claim* — **could not fire**: no DSN, and verified queries carry SQL, not result rows. The lane
  therefore grounds *the query* but not *the number*. That precise gap between "verified query" and
  "verified value" is the S2 grounding-gate's whole reason to exist, made concrete.

---

## Friction log (every rough edge)

1. **[MEDIUM] answer-qa's check-order assumes numbers-in-hand; the no-DSN / committed-bundle lane
   has none.** The contract says "run LAST, after the query has executed and the numbers are in
   hand." When the lane legitimately ends at a resolved-and-grounded *query plan* (no live surface),
   the contract still validates shape, but there is no contract-level disposition for "answer shape
   valid, value pending validation." I had to invent the ESTIMATED/pending disposition in prose. →
   direct S2 input (grounding gate) **and** an S1 input (the ledger is where a pending-validation
   claim should live instead of prose).
2. **[MEDIUM] No grounding gate ⇒ a shape-valid answer can ship with an unverified number and
   nothing flags it.** answer-qa 0.1.0 checks that grain/filters/date/constructs/caveats are
   *named*; it has no mechanism that says "this cited number never re-executed → drop it." In this
   lane the honesty came from the analyst discipline, not the skill. That is the exact hole S2's
   re-execute-or-drop gate fills.
3. **[LOW] The mandatory-filter obligation has no vocabulary for EXEMPT.** Both the pre-query check
   and the answer contract are phrased around *applying* the bad-reports filter. The correct action
   here was to *name a declared exemption* (events carve-out). It worked because the profile marks
   `badReportsFilter: "exempt"` per measure — but the skills' prose only ever discusses the
   apply-case, so an exemption reads as an edge the analyst must handle by hand rather than an
   obligation the contract recognizes. Minor S2 wording opportunity.
4. **[LOW] "How many reports did we lose to failed uploads" is a grain-trap in the user's own
   phrasing.** The model handled it, but only because `lost-reports` and `failed-upload-runs` both
   carry explicit run-vs-report grain notes. A thinner model would have shipped the run count as the
   report count. Evidence *for* keeping grain first-class, not a friction against the skill.
5. **[INFO / owed to run #1] The probe runner was not exercised.** `run-probe.cs` is present and its
   guards are code-real (confirmed below), but a query-lane-only run against a committed bundle
   never invokes it. The runner-adaptation friction the plan wanted (recover the shape, re-point
   BR1 refusal at a new workspace's roles) is genuinely owed to the fmcg_platform **run #1**, not
   recoverable from this vantage. Recorded so F8-W1 does not mistake this report for that input.

## Combined lessons — the two KG skill runs (semantic-model-query + answer-qa)

Both skill runs, read together, point the same direction:

- **The model is the honesty engine; the skills are only as honest as the model they resolve
  against.** Every correct move in this lane — the grain split, the filter *exemption*, the
  lower-bound caveat, the timeout rail — came from the *bundle*, surfaced by the ladder. The two
  skills added disambiguation discipline and a presentation contract on top; they did not
  manufacture honesty the model didn't already carry. This validates the F3 boundary rule
  (*method → plugin, data → project*): the discipline layer S1–S3 imports is exactly the thin
  method that turns a rich model into a trustworthy answer.
- **The seam between the two skills is where a number can silently lose its provenance.**
  semantic-model-query guarantees the *right query*; answer-qa guarantees a *named answer*. Neither
  guarantees the *number was actually produced and re-checked*. In a run with a live DSN that seam
  is invisible (the number is right there); in this no-DSN lane it gaped open, which is why the
  grounding gate is the highest-value S2 borrow.
- **Provenance presentation wants to be a first-class panel, not five scattered obligations.**
  Assembling grain + filters + date + constructs + caveats + source-query into one coherent answer
  by hand is exactly the "provenance panel" S2 promotes to Stage-1. Doing it manually confirmed the
  promotion: it is cheap prose and the answer is unreadable without it.

---

## Exit gate — S1–S3 placement lines (one line each)

- **S1 (`value-ledger` skill) — CONFIRMED, live-triggered.** The lane produced an ESTIMATED number
  it cannot yet MEASURE ("~532 lost, 2-day chain-22 probe → pending June live validation"); with no
  ledger that claim lives only in this report's prose — S1 is where a `proposed`/`validating` claim
  belongs. Placement (Stage-1 core) correct; the pilot supplies a concrete first entry.
- **S2 (`answer-qa` hardening) — CONFIRMED, and the pilot's strongest signal.** Grounding gate:
  friction #1/#2 are the re-execute-or-drop hole exactly; **strong trigger**. Penalty-only doctrine:
  confirmed — the ~532 estimate must count only *against* any downstream push-update decision until
  validated, never for it. Provenance presentation: confirmed and the Stage-1 promotion is
  vindicated (I built the panel by hand and the answer needed it). Placement correct on all three
  sub-items.
- **S3 (`analyst-craft.md`, 10 moves) — CONFIRMED, three moves exercised live.**
  *value-as-provenance-band* (probe magnitude vs pending value), *coverage-as-frontier* (the
  lower-bound "loss ≥ measured; pre-upload loss leaves no trace"), and *managed-cohort≠population*
  (refusing to read a 2-day chain-22 probe as "our chains last month") all fired in this one
  answer. Homing under `answer-qa/references/` is right — these moves are precisely what answer-qa's
  caveats operationalize. Placement correct.

## Exit gate — Stage-2 verdicts (triggered or dropped, with the signal)

- **Boot briefing — DROPPED (no signal).** Trigger = session-continuity pain. A single query-lane
  run had no prior-session state to reconstruct and surfaced zero continuity pain. Dropped by
  absence of the pain, not by default. (Also depends on S1, unbuilt — it could not trigger yet
  regardless.) Re-test when multi-session analyst use exists.
- **Per-persona expansion grammar — DROPPED for this lane, UNTESTED (not falsified).** Trigger =
  a shallow interview phase. This lane ran the **query path**, not the interview/Bootstrap path, so
  the interview-depth trigger was never exercised. Honest verdict: no signal *because the phase that
  would signal was not run*; the trigger remains open and must be re-evaluated by fmcg_platform
  **run #1**, which does run the batched intake + area interview. Flagged as owed, not closed.

---

## Runner notes (feeds F8-W1 requirements)

The probe runner `docs/semantic-model/tools/run-probe.cs` was **not exercised** this lane
(committed-bundle, no DSN, no SQL run). What is code-grounded from reading it, as context for W1's
requirements pull:

- **Role gate (BR1):** allowed role = `MSM_ALLOWED_ROLE` when set, else the platform default
  `laurentiu_read`; `kg_seed` is refused by **literal username match** (`run-probe.cs:195,203-205`)
  rather than trusting the committed `appsettings.json` default to be safe — the adaptation point
  for a new workspace is re-pointing this allow/deny pair at that workspace's read-only role and
  forbidden dev surface.
- **Cost gate (BR12):** `EXPLAIN (FORMAT JSON)` runs in its own read-only transaction before every
  aggregate body; **fail-closed** — an unreadable/failed plan is treated as ceiling-exceeded
  (`:289,296,302`); real execution is likewise fail-closed on timeout (`:327`).
- **Bound-shape gate (BR12c):** `IsValidReportDetailBound` / `IsValidEventsBound` / `IsBareTautology`
  (`:343,354,376`) enforce the large-table shapes before a body runs — the events-table three-part
  bound this lane's question depends on is checked here, not just documented in the profile.
- **Cost log (BR12):** one line per invocation (pass or refused) appended to `./cost-log.jsonl`,
  path resolved against the **script** dir so `laurentiu_read` and a `kg_god_ro` dry run produce
  visually identical log lines (`:47-49,122`).

**W1 requirement this lane can already assert:** the runner is workspace-parameterized only at the
role/DSN boundary (`MSM_ALLOWED_ROLE`, `MSM_PROBE_DSN`, the `kg_seed` literal) — a new consumer's
adaptation cost is re-pointing those three, not rewriting the gates. The *actual* adaptation
friction (does re-pointing surface rough edges?) is owed to run #1 and must not be inferred from
this reading.

---

## Exit-criteria checklist (pilot-plan.md §Exit criteria)

| Criterion | Status |
|-----------|--------|
| Pilot lessons written | ✅ (Combined lessons + friction log) |
| Each S1–S3 item has a one-line placement confirmation/correction | ✅ (all three CONFIRMED) |
| Stage-2 items triggered or dropped **by signal, not default** | ✅ (both dropped; boot-briefing = no signal, expansion-grammar = untested-this-lane, owed to run #1) |
| Runner-adaptation notes present | ✅ `## Runner notes` (code-grounded; live adaptation owed to run #1) |
| Zero-friction is a legitimate result | n/a — friction found (all method-confirming, not method-breaking) |

**Owed follow-up (not a blocker to the S1–S4 build):** fmcg_platform **run #1** — Phase-0 intake +
one real Bootstrap + a live query lane *with* a resolved DSN — is the only vantage that can
exercise (a) the interview-depth Stage-2 trigger and (b) real runner-adaptation friction. This
KG run #2 satisfies the Stage-0 gate's query-lane exit for the S1–S3 placement decisions; the two
owed items above are scoped to run #1, not left silently open.
