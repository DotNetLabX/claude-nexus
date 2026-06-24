# Review — Spec-driven Cover + diff (one-class spike)

## Step 1 — Done-Check

**Done-check basis:** This is an ADR-register / AC-gated spike (no spec to diff). The gate is AC-1..5
in `definition/spec.md`, mapped through plan Steps 1–6. Per the spec's review gate and the architect's
own answers (Q3), this Step-1 done-check **is** the gate — no Step-2 reviewer follows. Each step's
Accept clause was validated against the delivered artifacts, and three load-bearing claims (AC-1
isolation, the L272 FIXED annotation, the every-rule classification) were verified against live source,
not taken from the self-report.

**Pre-commitment predictions (made before reading implementation.md):** (1) backfilled
rule-code-map/candidate-bugs files might be thin or invented vs. recorded evidence; (2) AC-4
"every rule in exactly one axis" might be under-covered or double-classified; (3) AC-1 isolation might
be asserted, not demonstrated. All three checked explicitly below.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Confirm targets + ingest sequestered golden set (AC-1) | Implemented | **Verified against live source.** `golden-set.md` exists at `D:\src\knowledge-gateway\docs\audit\golden-set.md` — outside KG `src/`. Both targets registered: `targets/gateway-sqlvalidator.json` (GOLD-01..12) + `gateway-slackverifier.json` (GOLD-13..18), both **ids-only** with an explicit `_note` confirming the golden text is never fed to a miner/verifier (read orchestrator-side only). Both classes located in KG source. Isolation is demonstrable, not asserted. |
| 2 — rule→code location (AC-2) | Implemented | Named files present (backfilled per architect answer Q2/A2). `rule-code-map-generatedsqlvalidator.md` maps GOLD-01..12 to `file:line` (0 NO-CODE-FOUND); `rule-code-map-slacksignatureverifier.md` maps GOLD-13..18 to `file:line` (0 NO-CODE-FOUND). All 18 rules carry a locatable target. Content corroborates `specdriven-*`/`golden-set.md` attestation — faithful extraction, not invention. |
| 3 — Code-derived baseline (AC-4 code side) | Implemented | The `code` side of the diff is `killdelta-*`/`baseline-*` (survivor + mutation data), cited as the Direction-1 evidence in both diff files. Prior solo run; not re-executed (correct — re-deriving against now-fixed source would erase the headline). |
| 4 — Spec-driven Cover (AC-3) | Deviated (valid reason) | Spec-driven tests (Slack 23/23 green; SQL 124 cases / 5 reds) were generated and run in the **prior solo run**; this closeout extracted the results into `candidate-bugs-{class}.md`. The `tdd` skill (plan §80, non-`None`) was **not** invoked this run — documented as a plan-sanctioned deviation in `## Skills Used` (no-new-experiments per plan §33-39 + architect A1). Reds captured, none discarded: 1 confirmed (REAL-01/L272) + 4 triaged artifacts (SQL); 0 + 1 un-probed caveat (Slack). Accept clause met. |
| 5 — Diff the two rule sets (AC-4) | Implemented | `diff-generatedsqlvalidator.md` + `diff-slacksignatureverifier.md` both present, three axes each, `spec ∧ ¬code` listed first. Each `spec ∧ ¬code` item carries a red test (S1/L272) or a code-status note. All 18 rules accounted for. (Minor: the convergent GOLD-08 finding appears in both SQL Axis-1 S1 and Axis-3 D1, explicitly cross-noted as "same as S1" — same finding from two directions, not a double-classification of two distinct rules. LOW note, not a gap.) |
| 6 — Go/no-go writeup (AC-5) | Implemented | `spike-result.md` present. Three unknowns answered with verdicts (1: VIABLE; 2: FEASIBLE-manual/UNPROVEN-at-scale; 3: SIGNAL USABLE). Candidate-bug count = 1 (L272). Recommendation: **GO** with three named full-build conditions + ADR-A..D extraction. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, scoped to the
`developer:implement` window):** No developer-attributed skill entries exist for this slug's
implement window (synthesis closeout — no experiments re-run). Steps 1,2,3,5,6 map `Skill: None`
(all-`None` exemption applies — the log-based check does not fire on `None` steps). Step 4 maps
`Skill: tdd` (non-`None`) but carries a **documented deviation reason** in `## Skills Used` (the
TDD loop ran in the prior solo run; re-running is out of scope per plan §33-39 and architect A1) —
a documented deviation is a valid pass, not a Fail. The required `## Skills Used` section is present
(structural gate satisfied). → Skill conformance **passes**.

**Independent-claim verification (not from the self-report):**
- AC-1 isolation: `golden-set.md` outside `src/` + `targets/*.json` ids-only with sealing note — **confirmed**.
- L272 FIXED annotation: live `GeneratedSqlValidator.cs` carries the `> 0.01 + 1e-9` fix with the FP-safe-boundary comment verbatim — **confirmed**. The headline candidate bug was a true positive; the FIXED framing is honest.
- Every-rule classification (AC-4): GOLD-01..18 all accounted for across the two diff files — **confirmed**.

**Carry-overs noted for the team lead (not done-check failures):**
- L272 candidate bug is FIXED in live KG (medium) — reported as-found per architect A1; strengthens the GO.
- Direction-2 un-probed Slack gap GOLD-15 (low) — known method limitation, not a code defect.
- The full-build plan owes a **mandatory code-grounded critic** (shared-artifact change to `harness/**`) — per the spec review gate; the spike's low-ceremony self-review does not carry forward.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-25*
