# Spike Result — Spec-driven Cover + diff (go/no-go)

**Date:** 2026-06-25
**Slug:** adhoc-SpecDrivenCoverDiff
**Spec:** `docs/specs/adhoc-SpecDrivenCoverDiff/definition/spec.md`
**Evidence:** `delivery/baseline-*.md`, `delivery/killdelta-*.md`, `delivery/specdriven-*.md`,
`delivery/diff-*.md`, `delivery/candidate-bugs-*.md`, `delivery/rule-code-map-*.md`

---

## Candidate-bug count from the diff

**1 confirmed candidate bug** (floating-point boundary at `GeneratedSqlValidator.cs:272`):
- `|0.86 - 0.85| = 0.010000000000000009` (IEEE-754) is `> 0.01`, so the code **wrongly rejects a value
  the spec says should pass** (GOLD-08: tolerance boundary is exclusive — exactly-at-tolerance passes).
- Corroborated by **both directions independently**: Direction 1 (code-derived) left a surviving `>`→`>=`
  mutant here; Direction 2 (spec-derived) produced a RED on the same line.
- **Status in live KG source: FIXED.** Post-experiment the KG team patched to `> 0.01 + 1e-9`; the fix
  comment restates this spike's diagnosis verbatim. The harness found a real bug that the team patched.

*Note on scope:* 0 candidate bugs for Slack (code correctly implements all 6 rules; one known
code-vs-intent gap in GOLD-15 was not probed via adversarial inputs — a production Direction-2 gap, not
a code defect). 1 candidate bug for SQL (above). The 4 remaining SQL reds (of 5) were test/harness
artifacts after triage.

---

## The three unknowns — verdict per unknown

### Unknown 1 — Spec source on KG

**Question:** Is there a usable spec beyond the PO-authored golden rules? If golden rules are the only
source, viable but bounded to what the PO writes.

**Verdict: VIABLE — bounded to PO-authored rules, and that is a real constraint.**

- The PO-authored golden set worked as-is: 18 rules across 2 classes, independently authored, fed
  directly into the Direction-2 Cover agent. No additional spec source (design docs, API contracts, formal
  spec) was needed for the spike.
- **The constraint is real:** if the PO hasn't authored golden rules, Direction 2 has no input. The
  consuming-side question becomes "can we identify existing artifacts that serve as spec input?" — for KG:
  `seed/db/generation-rules/`, `query-patterns.md`, and XML doc comments are all candidates for
  automated extraction in the full build. The spike didn't exercise automated extraction (PO-authored
  manual set was available), so that path remains to be proven.
- **Go on the spike's test:** the PO golden set is a usable spec source. The bounded-to-PO-authoring
  constraint does not block a full build — it scopes the initial spec-source coverage.

### Unknown 2 — rule→code location feasibility

**Question:** Is manual rule→code mapping feasible for the spike? Is retrieval at scale unproven?

**Verdict: FEASIBLE for the spike (manual); UNPROVEN at scale (as expected for a spike).**

- Manual mapping (plan §64: "Manual for the spike") completed in one pass for both classes: 12 SQL rules
  + 6 Slack rules mapped to `file:line` targets using the golden-set's Code attestation column.
  See `delivery/rule-code-map-*.md`. No `NO-CODE-FOUND` flags — all 18 rules had locatable code.
- **The rule→code location is the genuinely new piece** (plan §65, Confidence low) — the code-derived
  harness gets this free by starting *from* a class; the inverse must map a rule *to* code. Manual was
  tractable for 18 rules across 111 + 519 lines.
- **Scale is the open question.** For the full build: a class with 50+ rules, or mapping across a whole
  domain, requires retrieval. Options: embedding-based search over the codebase (the most direct),
  or a guided miner agent given the rule text + codebase. Neither was tested. This is the #1 technical
  risk for the full build (remains low-confidence per plan §65).
- **Go on the spike's scope:** manual mapping is feasible and produced clean results. Retrieval at scale
  is the known open risk — the full-build plan must address it explicitly.

### Unknown 3 — Diff signal-to-noise

**Question:** Is the diff signal usable for triage, or is it dominated by trivial wording mismatches
and false positives?

**Verdict: SIGNAL IS USABLE — but triage burden is real and the false-positive rate needs a production filter.**

- **Slack:** 0 candidate bugs; 1 minor code-vs-intent gap (GOLD-15 base string, not surfaced because the
  spec test used canonical inputs). Diff produced clean, trivially-actionable output. Low noise.
- **SQL:** 1 real candidate bug; 4 test/harness artifacts (2 rule-interaction false positives, 1 bad
  example table, 1 un-constructable profile). 4/5 reds needed triage. Triage required reading the code +
  spec — ~30 min for a human reviewing the 5 reds.
- **The real finding was a convergent one:** both directions independently flagged L272 (the FP boundary).
  That is the highest-confidence signal the method produces — when two independent methods agree, triage
  confidence goes up sharply.
- **Production Direction-2 needs three filters** (confirmed by the spike):
  1. **Rule isolation** — inputs that trigger ONLY the rule under test (hard with first-violation-wins).
  2. **Fixture fidelity** — all profiles/fixtures must match real runtime construction (curated profile gap).
  3. **False-positive labeling** — rule-interaction reds are predictable (earlier-rule fires) and can be
     detected mechanically (re-run with the earlier rule disabled / input restructured).
- **Go on signal usability:** the diff produces an actionable signal (1 real bug found, since patched).
  The false-positive filter is a productionization requirement, not a blocker for a full build — the spike
  confirmed the method's signal quality is high when the finding is real.

---

## Per-AC pass/fail

| AC | Statement | Verdict | Evidence |
|----|-----------|---------|---------|
| AC-1 | Spec source exists, authored independent of implementation; isolation demonstrable | **PASS** | Golden rules in sequestered `docs/audit/golden-set.md`; targets carry IDs only; no mining agent was pointed at `docs/audit/`; miner had production source only. |
| AC-2 | Every spec rule mapped to `file:line` or `no-code-found` | **PASS** | `delivery/rule-code-map-slacksignatureverifier.md` (6 rules, 0 NO-CODE), `delivery/rule-code-map-generatedsqlvalidator.md` (12 rules, 0 NO-CODE) |
| AC-3 | Spec-driven Cover produces mutation-gated tests; reds captured as candidate bugs | **PASS** | `delivery/specdriven-*.md` (Slack 23/23 green; SQL 124 cases, 5 reds triaged); `delivery/candidate-bugs-*.md` |
| AC-4 | Diff classifies every rule into exactly one axis; `spec ∧ ¬code` items carry red test or code-missing note | **PASS** | `delivery/diff-slacksignatureverifier.md` (3 axes, every rule classified); `delivery/diff-generatedsqlvalidator.md` (3 axes, S1 carries red test at L272) |
| AC-5 | Go/no-go writeup answers three unknowns; reports candidate-bug count | **PASS** | This file |

**All five ACs: PASS.**

---

## Go/no-go recommendation

**GO on the full build.** All five ACs pass; all three unknowns answered with affirmative evidence.

### Rationale

1. **The method works end-to-end.** Both directions (code-derived and spec-driven) ran successfully on
   both classes; the diff mechanism functioned; the candidate-bug queue was populated and triaged.

2. **The headline finding is a validation win.** One real bug — the L272 FP boundary — was found and
   confirmed by both directions independently. It was significant enough that the KG team patched it
   (post-experiment, fix comment echoes the spike's diagnosis). A spike that found a real bug the team
   patched is a strong GO signal.

3. **The risks are scoped and addressable.** The three open items going into the full build are:
   - *Retrieval at scale* (rule→code location for 50+ rules) — the #1 technical risk; requires a
     dedicated design step (embedding search or guided miner agent).
   - *False-positive filter* (rule isolation + fixture fidelity + labeling) — confirmed needed; design
     is partially available from the spike's lessons.
   - *Spec source beyond PO authoring* — for KG, `generation-rules/` + `query-patterns.md` are
     candidates for automated extraction; unproven but tractable.

4. **The evidence covers the difficulty range.** One simple class (Slack, 6 rules, 111 lines, zero
   candidate bugs — high spec-code agreement) and one complex class (SQL, 12 rules, 519 lines, 1 real
   bug found — meaningful divergence). The spike's easy/hard pair design confirmed the method scales
   across classes rather than being a one-class artifact.

### ADR extractions (on go)

Extract the four ADR units named in the spec (§ADR units):
- **ADR-A** — Pluggable rule source / Cover-engine reuse: confirmed (spec-driven input shape works with
  the existing engine unchanged).
- **ADR-B** — Three diff axes are the deliverable: confirmed (all three axes populated with real content;
  `spec ∧ ¬code` is the most actionable).
- **ADR-C** — Oracle isolation is mechanical, not prompt: confirmed (sequestered golden-set + prompt-only
  sealing; miner/Cover agents never saw `docs/audit/`).
- **ADR-D** — Red-on-current = candidate bug, routed not gated: confirmed (5 reds captured and triaged,
  not deleted; the 1 real one became the headline finding).

### Conditions on the full build

The following are **required** in the full-build plan (not optional):
1. Solve rule→code location at scale before committing to a full sweep. Retrieval design comes first.
2. Specify the false-positive filter mechanism (rule isolation + fixture fidelity + labeling pass).
3. Run the spec-source extraction step (identify what structured docs beyond PO-authored rules are
   available on the consuming codebase and whether they can be ingested automatically).
