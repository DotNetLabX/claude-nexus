# Analyst craft — the ten transferable moves

Ten analytical levers that make an analysis credible on **any** domain, entity, or data situation.
They are the craft that turns a correct query into a trustworthy answer — the moves that
`answer-qa`'s caveats operationalize. The parenthetical illustrations are **examples of the move,
never constants to reuse**: discover the actual parameters for the engagement in front of you. The
domains below (logistics, subscriptions, sensor telemetry, support operations) are illustrative
stand-ins — the move is what transfers, not the example.

Read these **before** forming a hypothesis, not after drafting the answer.

---

## 1. Attribution isolation — claim only the residual you caused

Every metric move is part intervention, part exogenous. Decompose it, state the netting rule, and
credit only the attributable residual.

*Illustration:* an on-time-delivery rate rises the same month a routing change ships **and** seasonal
carrier congestion eases. Credit only the gain *above* the congestion easing — never the raw
improvement. Exogenous gains (supply, seasonality, price, weather) are never ours; a "no gameable
positive" rule keeps them out of the claim.

## 2. Effort ≠ outcome — judge by the causal instrument

Activity and adoption proxies (messages sent, tasks completed, time spent, sessions logged) are not
results. Find the field that measures the **post-action state** — a re-measurement, a before→after,
a confirmation — and conclude only from it.

*Illustration:* the count of support replies sent measures effort, not resolution. The instrument
that measures the outcome is a "did this fix it?" re-check, or the absence of a repeat contact within
a follow-up window. Effort may inform; it may never conclude.

## 3. Decompose every gap into actionable vs structural

Underperformance = coachable execution + exogenous constraint (capacity, timing, physical limit,
measurement gap). Split it, route each part to its owner, and **never score an actor against a
structural limit**.

*Illustration:* a fulfilment hub that misses its dispatch target is either "didn't stage the orders
in time" (coachable execution) **or** "inbound freight arrived late and dock capacity is fixed"
(structural) — opposite owners, opposite fixes. Attributing a structural miss to the team is a
category error.

## 4. Validity firewall before measurement — know the sensor's failure modes

Measurement is contaminated. Gate every metric behind a trust check (dead sensor, wrong context,
stale reference, instrument limit) and compute **only over valid observations**; surface measurement
error as explicit tags, never silence it. A surprising-low number is a suspected **artifact first**,
reality second.

*Illustration:* a temperature probe reports a flat zero when its battery browns out. Reading that as
"the cold chain held perfectly" is the trap — gate on a sensor-health flag and compute the metric
only over trusted readings, tagging the dead-probe intervals rather than letting them read as real.

## 5. Coverage and scope are a tracked frontier — "can't measure yet" ≠ "measured and bad"

A missing reference (an un-enrolled entity, an absent master record, an out-of-scope segment) is a
**coverage hole**, not a failure. Split the denominator into *measured* vs *unmeasurable*, make
coverage its own metric, and score only what the business actually enforces.

*Illustration:* subscribers with no plan-tier recorded are a coverage hole, not churn — folding them
into the churn rate understates or overstates it arbitrarily. Each missing feed is an "**If [we
captured plan tier] → we could [attribute churn by tier]**" lever on the dependency ladder (baseline
→ enrich one field → split the confound → add the outcome measure → attribute). Report coverage
alongside the metric so the reader sees what the number can and cannot yet see.

## 6. Per-entity dynamic baselines beat fixed global targets

Judge each entity against **its own recent trajectory plus an improvement increment**, not one global
constant — fairer and more actionable. This is where a forecast earns its keep: it *sets the next
target*, not as a term to maximize.

*Illustration:* hold each delivery hub to its own trailing-N-week on-time average plus a step-up,
rather than one network-wide on-time target that a structurally-slow region can never meet and a
structurally-fast one clears without trying.

## 7. Distribution over mean; rank-and-diagnose the tails

The aggregate hides the action. Always segment (by region, entity archetype, top/bottom decile,
variance outliers under a **stated rule**) and name the worst performers **with their limiting-factor
cause**. Variance itself — "uneven performance" — is a first-class signal, not noise.

*Illustration:* a mean handle-time of nine minutes hides everything worth acting on. Segment by queue
and region, then name the bottom-decile queues *tagged by why* — understaffed versus routed the
hardest tickets — because the fix differs by cause.

## 8. Effect sizes are heterogeneous — distrust any single blended coefficient

Value-per-unit-of-improvement varies several-fold across segments; estimate it **per segment** and
prioritize by it. A single blended coefficient hides the segments where the lever does nothing and
the ones where it pays for itself.

*Illustration:* renewal-revenue lift per +1 percentage point of on-time delivery ranges several-fold
across customer segments — the segment with the largest delivery gain can show near-zero renewal
lift, while a smaller gain in a price-sensitive segment moves revenue materially. Cite the per-segment
coefficient wherever the evidence is per-segment.

## 9. Value is a decomposable, provenance-tagged stack, reported as a band

Total value = a sum of **independently-grounded terms**, each tagged `measured / derived /
extrapolated`, presented realistic→full-potential with the assumptions (fleet size, active-account
count) **visible** — never a single hero number. A range is often the only honest framing.

*Illustration:* a recoverable-value figure is built as measured (what re-executed against live data)
+ derived (a coefficient applied to a measured base) + extrapolated (the same rate assumed across
un-instrumented entities), each term tagged, with the entity count driving the extrapolation stated
in the open. The same offering's headline value can swing several-fold across framings — the band,
with its assumptions shown, is what to report.

## 10. Managed-cohort value ≠ population value

"Provable under active intervention" is not "happens automatically". Always name the **cohort** and
the **management intensity** behind a result — a number driven by a small, hands-on cohort does not
generalize to the untouched population by default.

*Illustration:* a 20-account, actively-managed pilot cohort improves sharply while the broad account
base stays flat over the same window. Reading the pilot's rate as "our whole base, last quarter" is
the error; the honest claim names the cohort size and the intervention intensity that produced it,
and treats generalization as a separate thing to prove.
