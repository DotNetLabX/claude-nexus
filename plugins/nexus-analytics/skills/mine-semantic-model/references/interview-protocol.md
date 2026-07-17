# Interview Protocol

Governs Phase 4 of `mine-semantic-model`. Mirrors the batched-question pattern already proven in
the KG pilot run ("ask all missing questions in a single message — never ask one at a time") —
same shape, applied to model-authoring hypotheses instead of query intake.

## Rules (BR2/BR4)

1. **Evidence before question (BR2).** No question may be asked unless it cites a probe result or
   a schema fact. If you cannot point to a `Probe:` or `Schema:` line, the hypothesis is not ready
   to ask — go back to Phase 2/3.
2. **Batched per area (BR4).** Every residual question for the area under audit goes into ONE
   message. Never trickle questions one at a time — the user answers the whole area in one pass.
3. **Never ask twice (SR-21).** Before drafting a question, check the profile's ledger path
   (item 2) for an existing `interview({date})` entry on the same construct/field. If one exists
   and the underlying data/bundle is unchanged, the question is already answered — do not re-ask
   (this is also the mechanical proof behind BR10's idempotence run).
4. **Every question carries three parts** — evidence, a proposed default, and the consequence of
   each choice. Evidence and a proposed default are the bare minimum a question must carry, but
   omitting consequence produces a worse question — include it.

## Question template

```
### Q{n}: {short title}
**Area:** {e.g. Reports}
**Construct:** {entity id / measure id / dimension id / term canonical / join-guard id / field}

**Evidence:**
- Probe: {probe name + one-line result, e.g. "value-distribution on orders.status:
  9 -> 1,204 rows (0.3%), all with deleted_at IS NOT NULL"}
- Schema: {information_schema fact, if relevant}

**Question:** {the actual question}

**Proposed default:** {what the skill will assume if the user doesn't override}
**Consequence:**
- If {default}: {what gets written to the bundle/ledger}
- If {alternative}: {what changes instead}
```

## Batch message shape

One message per area, all questions for that area together:

```
## Interview batch — {Area} — {date}

{n} residual question(s) after KB-first grounding ({m} hypotheses were KB-answered — see the
run report's KB-cited-not-asked list, not repeated here).

{Q1 block}
{Q2 block}
...
```

## Unavailable-user path (Decision D3)

The user is the run's oracle for residual questions (BR3) — a developer/agent must never
self-answer on the user's behalf; that fabricates the oracle. If the user cannot answer
synchronously within the run:

1. Write the batch into the run report's Questions section (per `output-contract.md`) exactly as
   it would have been sent.
2. Write the same batch to the pipeline's `questions.md` (when running inside the SDD pipeline)
   with `**Status:** Open` and a note: `OPERATOR ACTION REQUIRED — interview pending`.
3. Do not proceed to Phase 5 (Emit) for the constructs the open questions touch. Constructs
   already fully resolved via Probe+Ground (no open question) may still emit — Phase 5 is scoped
   per-construct, not all-or-nothing for the whole run.
4. Resume: once answers land, record them with `interview({date})` provenance and continue Phase
   5 for the previously-blocked constructs.

## Recording answers

Every answer becomes a ledger entry, in the real per-construct-object shape
(`references/output-contract.md`): keyed by the construct's own id, `origin` set to
`interview({date})`, and `verified` lifted from that same date (the interview date IS the
verification date — the user answered synchronously). A whole-construct answer:

```json
"{construct_id}": { "origin": "interview(2026-07-08)", "verified": "2026-07-08" }
```

A field-scoped answer (only one scalar of an otherwise-`carried({baseline})` construct was
clarified):

```json
"{construct_id}": {
  "origin": "carried({baseline})",
  "fields": {
    "{scalar_name}": { "origin": "interview(2026-07-08)", "verified": "2026-07-08" }
  }
}
```
