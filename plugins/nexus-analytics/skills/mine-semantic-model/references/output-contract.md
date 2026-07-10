# Output Contract

Governs what Phase 5 (Emit + Validate) writes, in what shape, and where. Two artifact families:
the provenance ledger (durable, versioned with the bundle) and the run report (a point-in-time
record of what one run did).

## Provenance ledger — the profile's ledger path (item 2)

**Decision D1: per-construct-object, id-keyed.** One entry per bundle construct object, keyed by
its natural id — not one entry per JSON scalar field. Proportionate to the bundle's actual size (a
construct-level ledger, not a per-scalar one) and satisfies the ledger-coverage check's
countable-coverage requirement (below) without the maintenance cost of a per-scalar ledger.

### Schema

```json
{
  "$schema-note": "sidecar ledger; loader-inert (fixed named-file set, no directory walk)",
  "entities": {
    "{entity_id}": { "origin": "carried({baseline})", "fields": { "{scalar_name}": "data-derived(cardinality-probe)" } }
  },
  "relationships": {
    "{from_id}->{to_id}": { "origin": "carried({baseline})" }
  },
  "measures": {
    "{measure_id}": { "origin": "carried({baseline})" }
  },
  "dimensions": {
    "{dimension_id}": { "origin": "carried({baseline})" }
  },
  "compatibility_rules": {
    "{rule_key}": { "origin": "carried({baseline})" }
  },
  "terms": {
    "{term_canonical}": { "origin": "carried({baseline})" }
  },
  "join_guards": {
    "{join_guard_id}": { "origin": "carried({baseline})" }
  }
}
```

- Top-level keys mirror the profile's construct-file map (item 1) — one key per construct family
  the bundle defines. See the profile's worked example for a concrete, filled-in instance (a
  six-file, seven-family bundle: one file yields both the `entities` and `relationships` families
  via its edges).
- **Origin enum (BR5, closed):** `schema-derived` | `data-derived({probe})` |
  `kb({entry})` | `interview({date})` | `carried({baseline})`, where `{baseline}` is the profile's
  baseline origin token (item 3) for constructs pre-existing before this skill's first run. No
  other value is valid; a runner/emit step that would write anything else is a bug, not a new
  origin.
- **Single PRIMARY origin per field — by design, not a fidelity gap (review cycle 1
  adjudication).** A field's content is routinely *informed* by more than one evidence type
  (Mine's schema reconciliation, Phase 2 probe percentages, a KB citation, an interview answer) —
  the ledger records which ONE of those supplied the *decisive, final* fact, not every input that
  contributed context. The note/description text itself carries the full evidentiary trail (dates,
  citations, probe numbers) inline; the ledger origin is a coarse classification for programmatic
  use (the never-ask-twice check, audit triage), not a provenance graph. Precedence when more than
  one evidence type genuinely contributed, in order:
  1. **`interview({date})`** — if Ground exhausted the KB and still had to ask, and the user
     answered, the answer is the origin even though probe evidence motivated the question (Ground's
     own KB-first-then-interview order already makes these mutually exclusive per hypothesis — see
     Phase 3: a hypothesis the KB answers is never escalated to interview at all).
  2. **`kb({entry})`** — if Ground found a citation, use it, even if a probe first raised the
     hypothesis (probe evidence is the *input* to Ground, not itself a competing origin for the
     note's content).
  3. **`data-derived({probe})`** — when no KB/interview was involved and a live probe supplied the
     decisive fact (e.g., a relationship's cardinality/orphan-rate, confirmed empirically) even if a
     schema reconciliation (Mine phase) first suggested the construct exists — the probe is what
     justified *trusting* it enough to model.
  4. **`schema-derived`** — reserved for a fact establishable from `information_schema`/a
     project-maintained schema-reference snapshot alone, with no data probe needed to trust it.
  - **This is explicitly single-origin by design, not a fuller multi-origin provenance graph**
    (recording every contributing evidence type per field, not just the primary one). Multi-origin
    provenance and adjacent lanes belong to the consuming project's own feature map, not this
    skill's closed enum — do not build multi-origin tracking here.
- **Optional `fields` sub-map** — only present when an interview or probe touched a specific
  scalar inside an otherwise-`carried({baseline})` construct (e.g. one flag's meaning was clarified
  without re-deriving the whole entity). Absence of `fields` means the whole construct shares one
  origin.
- **Seeding (Step 5, first act):** every existing bundle object is enumerated by extracting ids
  directly from the bundle's construct files (script/jq-style extraction — never hand-listed) and
  seeded `carried({baseline})`. The extraction count is recorded in `implementation.md` as the
  ledger's actual size (closes the plan's sizing note).
- **Ledger-coverage check:** a scripted count comparing ledger keys against bundle-extracted ids
  must be equal. Untouched fields after any run stay `carried({baseline})` — the ledger always
  covers 100% of the bundle, never a subset.

### Who reads the ledger

| Consumer | Why |
|---|---|
| The next run of this skill (Phase 3 Ground, Phase 4 never-ask-twice) | Checks for an existing `interview({date})`/`kb({entry})` entry before drafting a question — the mechanical proof behind BR10 (idempotent refresh). |
| A drafting agent generating answers over the project's own grounding root | Compact, factual field-origin data is legitimate grounding for an answer, where the project's own conventions make the ledger part of that root. |
| A human auditing the bundle's provenance | "Where did this measure's definition come from" is answerable in one lookup instead of git-blame archaeology. |

### Rollback posture

Nothing this skill writes is committed automatically (BR8) — every bundle construct file, the
ledger, the run report, and KB-hub drafts land as **working-tree file changes** in their respective
repos/trees. The user's normal `git diff` / `git checkout --` (this repo) or manual discard (the KB
hub's working tree) is the rollback path; there is no separate "undo" mechanism because none is
needed — nothing is a system-of-record write until the user commits it.

## Run report — the profile's run-report directory (item 4)

**Location is binding (BR9):** never under the bundle root — run reports carry hypotheses, open
questions, and stale-data disclosures that must not become runtime grounding material via whatever
root the project serves recursively to its own agents/tools. If the project's ledger deliberately
sits inside such a root (compact and factual), the run report deliberately sits outside it (not
compact, not fully factual — it carries in-flight hypotheses).

### Required sections (every run)

```markdown
# Model run — {date} — {mode: Bootstrap|Refresh} — {area(s)}

## Endpoint
{DSN target, posture-labeled — "real: {the profile's read-only role} / {target database}" or
"dry-run: {the profile's dry-run role} (seed, synthetic, not evidence)" — never the DSN value itself}

## Data vintage
| Fact table | MAX(date) probed |
|---|---|
| {table} | {date} |

## Hypotheses (Mine + Probe)
| # | Construct | Hypothesis | Evidence |
|---|---|---|---|

## KB-cited-not-asked (BR3)
| Hypothesis | Citation |
|---|---|

## Interview
{batch(es) per references/interview-protocol.md, or "none — fully KB/probe-resolved"}

## Answers
{recorded with provenance, or "pending — OPERATOR ACTION REQUIRED" if unavailable}

## Bundle diff
{unified diff of changed construct JSON, or "empty — no changes" for an idempotent Refresh}

## Gate result
{the profile's validation gate command (item 6): pass/fail counts vs baseline}

## Per-probe cost log (BR12)
| Probe | Table(s) | EXPLAIN cost | Ceiling | Bound predicate (if big-table) |
|---|---|---|---|---|

## BOM check
| File | First 3 bytes | Result |
|---|---|---|

## Aggregate-only sweep attestation (BR13)
{one line: "every table/list above is aggregate-shaped (value + count/share/boundary stamps) —
no per-row entity identifiers present" or a named exception + remediation}
```

A zero-divergence Refresh audit still emits every section above — "found-count may legitimately
be zero", but the check must demonstrably have run.

## KB hub write-back (BR8 — explicit carve-out)

Drafted entries go into the profile's KB hub (item 5) following **that hub's own observed
format** — never this repo's `nexus:kb-entry-schema`. Only *knowledge* is drafted here — flag
meanings, measure definitions, business vocabulary learned in Interview — never mechanical facts
(those live in the ledger/bundle only). Drafts are left uncommitted in the KB hub's own working
tree for the user to review and commit; this skill never runs `git commit`/`git push` in either
repo (BR8).
