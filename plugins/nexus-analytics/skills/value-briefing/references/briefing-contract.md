# Briefing Output Contract

Every briefing `value-briefing` emits is checked against this contract before it reaches the user.
It is the value-layer analogue of `answer-qa`'s answer contract — but where that contract governs an
*accuracy* answer (grain, filters, date range, constructs), this one governs a *value* briefing
(labeling, guardrails, disclosure). The two never overlap: accuracy answers carry no value labeling,
and this contract is the only home of measured-vs-estimated.

## 1. Every number is labeled measured or estimated

Every number in a briefing carries one of two labels:

- **measured** — the number is a quantity the project's semantic model **verifies**: a value-model
  row's construct value whose join (`measureId`/`termId`) resolves against the bundle at profile
  input 2, or **direct probe evidence** (a real query result over real rows). Measured numbers are
  facts the accuracy layer already stands behind.
- **estimated** — the number is **derived** from the value model's own business inputs: a value
  weight, a coefficient-register row, or a modeled displacement mapping. An estimate is a
  projection, not an observation.

A resolving construct join makes a row **measured-eligible** — its underlying metric can be reported
measured — but it does NOT promote the row's *value weight* or any coefficient-derived figure to
measured: those stay **estimated** even on a row whose construct resolves. When a single number could
fit either label, it is estimated.

A number with neither label is malformed. "Roughly", "about", and an unqualified currency figure are
all numbers — they are labeled too.

## 2. Every estimate names its coefficient source and declares its confounds

An estimated number carries, inline:

- **its coefficient source** — the coefficient-register row (an elasticity/coefficient id) the
  estimate derives from. An estimate with no named source is malformed.
- **the confounds that threaten it** — the confounds that row carries (the value model records them
  per coefficient — phantom inventory, substitution, promo, seasonality, and any others). They are
  declared **alongside** the estimate they threaten, never in a distant footnote.

## 3. A dimensional-plausibility violation is refused or flagged — never a bare number

Before an estimate is emitted, it is checked against the value model's **dimensional-plausibility
bound** for that coefficient. The canonical example: a 1-percentage-point out-of-stock reduction is
worth *fractions of a percent* of category revenue — never a double-digit percent. A number that
violates its bound is **refused or flagged** — it is never emitted as a plain number. Enforced
in-method (SKILL.md Producing step 3), and re-checked by the Briefing QA pass below. This is the
guardrail that stops a coefficient from being multiplied out into an absurd headline figure.

## 4. Unreachable cited sources are disclosed

Where a briefing relies on the value model's embedded provenance because a cited KB source was not
locally reachable, it **says so** — a short "sources unavailable at briefing time" note listing what
could not be read. A briefing that silently drops an unreachable source is malformed.

## The mandatory `## Briefing QA` self-check

The LAST thing a briefing does, before it ships, is a self-check pass under a literal
`## Briefing QA` heading. It scans the drafted briefing and confirms:

- [ ] every number is labeled **measured** or **estimated** — no bare numbers;
- [ ] every **estimate** names its coefficient source and declares its confounds;
- [ ] no number violates a dimensional-plausibility bound without being refused or flagged;
- [ ] every unreachable cited source is disclosed.

A briefing that fails any line is **malformed — it does not ship**. Fix the gap (label the number,
name the source, flag the implausibility, disclose the gap) and re-run the pass. Never ship first and
caveat later.

This self-check is the paired enforcement for the prompt-shaped obligations above — the value-layer
analogue of a producing-phase gate. Its hard demonstration is a recorded must-fail demo: a
deliberately dimension-violating ask (e.g. "a 1pp OOS reduction — is that 20% of category revenue?")
must be refused or flagged by this pass, never emitted as a plain number.
