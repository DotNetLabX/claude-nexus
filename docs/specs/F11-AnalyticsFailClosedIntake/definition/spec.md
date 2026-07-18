# F11 — Fail-Closed Intake (Mandatory Clarification)

**Traces to:** `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (feature D) — plugin-lane extract of the parent proposal ratified 2026-07-18 in omnishelf-analytics (`docs/proposals/2026-07-18-am-workspace-and-two-leg-improvement.md`)
**Source:** Ratified proposal
**Dependencies:** None ship-blocking. Related lanes: the KG-lane must-specify classification pass (fills the per-measure layer; the interim bridge below covers its absence), F12-AnalyticsWorkspaceSelfHeal (shares the `my-workspace/` home — this feature creates the file and folders it needs itself, so it does not wait for F12), and a product-repo work item retiring the consuming repo's own interview rule. **Sequencing constraint on that retirement:** the consumer's legacy interview rule stays active in every session until removed, so in each consuming repo the retirement must land **with or before** this feature's activation there — otherwise two interview owners run side by side, re-creating the double-ask this feature eliminates.
**Status:** Ready
**Plan:** None

---

## Purpose

The product serves 10–20 non-technical Account Managers. Today, missing query parameters are
sometimes silently assumed, producing confidently-wrong numbers — the single biggest trust risk
with this audience. This feature makes the data-analyst intake **fail-closed**: no query runs
while a mandatory input is unresolved, every missing mandatory input is asked for in one batched
message, and every default that is applied is named in the shipped answer — never invisible. The
plugin becomes the **single interview owner** for every consuming repo (the parent proposal's
binding commitment); the consuming repo's own interview rule is retired by a product-repo work
item that lands with or before this feature's activation in that consumer (see Dependencies).

## Entities

### Intake requirement declaration

The declared set of inputs a question must have resolved before a query may run. The declaration
is **data the plugin reads, never knowledge the plugin ships** — the plugin is agnostic to which
inputs a product requires (interview decision, 2026-07-18, confirmed by investigation of the
model bundle and its consumer sync channel).

Two layers:

- **Question-level inputs** — apply to every question (for this product: retail chain, date
  range). Each declared input carries:
  - **Identity** — the input's name as the user knows it ("retail chain").
  - **Ask guidance** — the question wording and any example answers to offer.
  - **Resolution policy** — one of:
    - *must-ask* — never defaulted; if the question doesn't resolve it, it is asked.
    - *documented default* — a named default (with its wording, e.g. "last 30 days") that may
      be applied when the question doesn't resolve it, and is always named in the answer.
    - *persistable per-user default* — the user's first answer is saved and reused across
      sessions (read back and confirmed, never re-asked).
- **Per-measure must-specify flags** — a measure may declare additional inputs that become
  mandatory whenever that measure is part of the question. Flags are **additive**: a question
  touching several measures requires the union of their flags plus the question-level inputs. A
  measure with no flags adds nothing beyond the question-level set.

**Where the declaration lives (precedence order — per declared item, never whole-layer):**

1. **The semantic model** (authoritative) — the declaration is model content: governed by the
   model's owning lane, synced to every consumer through the existing model-sync channel, exactly
   like measures and dimensions. Per-measure flags sit on the measure entries; question-level
   inputs are a model-level intake section.
2. **The consuming project's committed model contract (profile) — interim bridge** — the profile
   carries the same declaration in the same shape for whatever the model does not yet declare.
3. **The answer-contract floor** — every shipped answer must already name its grain and date
   range (the existing answer contract), so the intake must still resolve those two before
   running even when neither source above declares anything. This floor derives from the
   plugin's own universal answer contract, not from product knowledge.

Precedence is resolved **item by item**: for a question-level input, the model's entry for that
input wins over the profile's entry for the same input; a profile entry for an input the model
does not declare stays in force. For per-measure flags, the model's classification of a measure
wins for that measure; the profile's flags for a measure the model has not classified stay in
force. A partial model declaration therefore never silently retires anything the profile still
declares — the model-over-profile transition completes input by input as the model's
classification lands, with no window in which a previously-mandatory input stops being mandatory.

The floor is a backstop, never a ceiling: grain and date range must be resolved regardless of
what the layers above declare. **Grain is not a user-interview item** — it is resolved through
the model's existing resolution ladder (from the question's own wording: "by store", "per
category"). When the ladder cannot establish a grain, the batched message asks a
business-language clarification ("per store, or per SKU?") — never a technical "what grain?"
prompt. Date range, by contrast, is a genuine user-supplied input.

Independent of the declaration, the intake always resolves the **output destination** (in the
conversation, or a spreadsheet link plus tab name) — a universal workflow input owned by the
plugin, not a data-semantics input. A destination already given in the question's wording is not
re-asked (a deliberate relaxation of the retired interview rule's "always ask"); the resolved
destination continues to feed the product's existing output-routing behavior unchanged.

### Per-user defaults record

A plugin-owned file under the user's personal workspace folder (`my-workspace/` — per-clone and
ignored by version control, which in this product's one-clone-per-AM deployment means per-user;
survives pulls; interview decision, 2026-07-18). It stores the persisted answers for inputs
whose policy is *persistable per-user default* (for this product: the retail chain). The intake
creates the file and any missing parent folders on first persist. A persisted default is a
**UX convenience only — never access control** (the product grants full read access to all
employees; carried over from the retired interview rule). A defaults record that cannot be read
is treated as absent — the affected inputs are simply asked again and the record rewritten;
concurrent sessions resolve last-writer-wins.

**Legacy migration:** the consuming repo's current mechanism stores the chain default in an
untracked repo-local config file. Migration is **per input**: whenever the defaults record lacks
a persistable input for which the legacy file holds a value, the intake ports that value into
the defaults record and confirms it in the session. The legacy file is never written; removing
it belongs to the product-repo retirement work item.

## User Flows

```
Flow 1: Fully resolved question
1. User asks a question that resolves every mandatory input (from its own wording,
   persisted defaults, and documented defaults).
2. System runs the query and ships the answer. The answer names: grain, date range,
   every mandatory filter applied, model constructs used, every persisted default used
   ("Using default chain: {name}"), and every documented default applied
   ("assumed: {input} = {value}").
```

```
Flow 2: Missing mandatory inputs
1. User asks a question that leaves one or more mandatory inputs unresolved.
2. System sends ONE message asking for all missing inputs together — never a sequence
   of single questions. No query runs yet.
3. User answers.
4. System runs and ships the answer per Flow 1's naming rules.
```

```
Flow 3: First-run persistable default
1. A user with no persisted chain default asks a question without naming a chain.
2. The batched message (Flow 2) includes the chain question.
3. On answer, the system saves it to the per-user defaults record and proceeds.
4. In every later session, the chain is read back and confirmed inline — never re-asked.
```

```
Flow 4: Multi-measure question
1. User asks a question touching several measures.
2. The mandatory set is the union of the question-level inputs and every touched
   measure's must-specify flags; missing ones are asked per Flow 2.
```

```
Flow 5: Legacy default migration
1. A user whose clone has the legacy chain default (and no defaults record) asks a question.
2. The system ports the legacy value into the per-user defaults record, confirms it inline
   ("Using default chain: {name} — migrated from your previous setting"), and proceeds.
```

```
Flow 6: Declaration bridge
1. In a consumer whose synced model carries no intake declaration, the profile's interim
   declaration governs — behavior identical to Flows 1–5.
2. As model syncs deliver the model-carried declaration item by item, each delivered item
   supersedes the profile's entry for that same item; profile entries the model does not
   yet cover stay in force. No plugin change, and no input ever stops being mandatory
   during the transition.
3. Once every interim entry is shadowed by a model-carried counterpart, the interim
   section's removal is flagged to the repo owner (a note in the session, not an edit).
```

## API Surface

N/A — conversational intake behavior of the analyst agent; no HTTP surface.

## Business Rules

1. **Fail-closed:** no query executes while any mandatory input for the question is unresolved.
   Unresolved means: not in the question's wording, no persisted default, and no documented
   default whose policy allows applying it. A user who declines or cannot answer keeps the query
   blocked — the intake restates which inputs are still needed; there is no "run anyway" path
   and no fallback guess.
2. **One batch:** all missing mandatory inputs are asked in one message; asking one-at-a-time is
   a defect. Within one question's intake, nothing is asked twice.
3. **No invisible defaults:** every default applied to a shipped answer is named in that answer —
   persisted defaults as an inline confirmation, documented defaults as an "assumed:" line. The
   answer-quality gate is extended with this as a checked item: an answer that applied any
   default without naming it is malformed, alongside the gate's existing obligations.
4. **Never re-ask a persisted default:** a persisted per-user default is read back and confirmed,
   not re-asked. The user can change it at any time by saying so; the change is persisted.
5. **Declaration precedence is per item:** for each question-level input, the model's entry wins
   over the profile's entry for that same input; for each measure, the model's classification
   wins over the profile's for that measure. Entries the higher layer does not declare stay
   governed by the lower layer. The floor (grain + date range) is a backstop that always
   applies. A partial higher layer never retires a lower layer's undeclared entries.
6. **Plugin input-agnosticism:** the plugin ships no product-specific input (no "chain"). The
   only plugin-native intake items are the answer-contract floor and the universal output
   destination. Everything else comes from declaration data.
7. **Additive per-measure flags:** a question's mandatory set is the union of question-level
   inputs and the must-specify flags of every measure the question touches; a measure without
   flags contributes nothing extra.
8. **Data-anchored relative dates:** a relative date range ("last 30 days") resolves against the
   data's latest available date, not today's date; the resolved concrete range is named in the
   answer (carried over from the retired interview rule).
9. **Row-quality exclusions are never a question:** profile-mandated row-quality filters (the
   bad-reports class) are always applied and always named in the answer, never asked about —
   the existing pre-query obligation restated as an intake non-question.
10. **Persistence boundary:** the intake writes only to the per-user defaults record inside the
    personal workspace folder — never to any version-controlled file, never to the repository's
    ignore file, never to the semantic model or profile.
11. **UX default, not access control:** a persisted default narrows nothing about what the user
    may query; it only pre-answers a question.
12. **One declaration shape:** the model-carried declaration and the profile's interim
    declaration use the same shape, so the bridge-to-model switch is a data change only. The
    shape defined by this spec is the contract both the model's owning lane and consuming-repo
    authors write against.

## Acceptance Criteria

- [ ] In a fresh clone with no persisted defaults, a question naming neither chain nor date range
  produces exactly one clarification message asking for both (plus destination if unresolved),
  and no query output precedes the answers.
- [ ] After the chain is answered once, a new session's first answer contains an inline
  "Using default chain: {name}" confirmation and asks no chain question.
- [ ] A question relying on a documented date-range default ships an answer containing an
  "assumed:" line naming the concrete, data-anchored date range.
- [ ] With the model-carried declaration absent and the profile's interim declaration present,
  Flows 1–3 behave identically to the model-carried case.
- [ ] With a **partial** model-carried declaration (e.g., it declares date range but not the
  chain input the profile's interim declaration carries), the profile-declared input remains
  mandatory — it is still asked when missing or named when defaulted, exactly as before the
  partial sync arrived.
- [ ] With both declarations absent, a question that leaves date range open, or whose wording
  lets the resolution ladder establish no grain, still triggers the batched ask — the grain
  question is phrased in business language ("per store, or per SKU?"), never as a technical
  grain prompt — and the intake never runs on an unresolved floor input.
- [ ] When the user declines to supply a mandatory input ("just run it"), no query runs; the
  response restates which inputs are still needed.
- [ ] A question touching a flagged measure asks for that measure's must-specify inputs even
  when all question-level inputs are resolved.
- [ ] A clone carrying the legacy chain default and no defaults record gets its value migrated
  on first intake, with the migration named inline; the legacy file's content is unchanged.
- [ ] No intake run modifies any version-controlled file; the only file the intake ever writes
  is the per-user defaults record.
- [ ] The answer-quality gate's checked obligations include default-naming: an answer that
  applied any default (persisted or documented) without the corresponding inline confirmation
  or "assumed:" line is flagged as malformed and fixed before shipping — including a default
  that maps to none of the gate's pre-existing items.

## Out of Scope

- **The must-specify classification pass itself** — deciding which measures flag which inputs is
  model content, owned by the model's lane (KG); on this feature's critical path only for the
  per-measure layer, which the interim bridge and question-level layer do not wait on.
- **Retiring the consuming repo's interview rule and legacy config helper** — a product-repo work
  item; this spec defines the plugin behavior that makes the retirement safe, and the
  Dependencies sequencing constraint (retirement lands with or before this feature's activation
  in that consumer) closes the double-owner window.
- **Creating `my-workspace/` structure beyond what persistence needs, ignore-entry warnings,
  export defaults** — F12-AnalyticsWorkspaceSelfHeal.
- **Saved prompts and usage capture** — F13 / F14 (later lane ranks).
- **Any write path into the semantic model or profile** — parent-proposal binding exclusion.
- **Permission gating by chain or anything else** — company policy is full read access; defaults
  are UX only.

