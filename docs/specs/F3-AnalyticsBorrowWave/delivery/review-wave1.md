# F3-AnalyticsBorrowWave wave-1 (S1–S4) — Review

Wave artifact (increment 0 owns `review.md` — never overwritten). Step 1 (done-check) is the
architect's section; this file was created by the reviewer with Step 2 only.

## Step 2 — Code Review

## Reviewed By
reviewer (Fable 5), standalone Step-2 pass; plan `plan-wave1.md` re-read at start; VWH cookbook
§CRAFT read read-only for the AC-9 comparison.

## Verdict: APPROVED

(Task vocabulary: **APPROVE-with-notes** — no CRITICAL/HIGH; four LOW findings, two of which are
one-line edits best ridden on the same uncommitted 0.4.0 bump at the architect's discretion.)

## Pre-commitment Predictions
- **Structure leak in analyst-craft.md** — partially found: moves 8 and 10 retain the source
  examples' narrative skeletons (LOW, see F2); the other eight are cleanly re-invented.
- **MED-2 sentence drift** — not found: byte-identical after normalization, mutually pinned.
- **Cross-plugin citation ambiguity** — not found: plugin + skill + path + exact heading, all
  verified live.
- **MED-1 papered-over contradiction** — substantively resolved; one residual unqualified clause
  (LOW, see F4).
- **CI rider mechanics** — clean; both yml edits correct, `plugin validate --strict` passes locally.
- **Sweep blind spots (CHANGELOG/plugin.json)** — I swept both myself: 0 hits. But the sweep has a
  blind spot the wave actually hit: numeric fingerprints (F1) — a regex vocabulary sweep cannot see
  numbers.

## Findings

### [LOW] Shipped worked example carries the real pilot run's exact magnitudes
**File:** `plugins/nexus-analytics/skills/value-ledger/references/output-contract.md:146` (also
`:30`, `:142`)
**Origin:** implementation
**Issue:** The pending-live-validation worked example ships the KG pilot's real measured values
verbatim — `started 4,570 vs completed 4,038 => ~532` matches `pilot-report.md:101` exactly, plus
the `~530/month` index row and the 2-day single-site probe window. The plan says the pilot entry
supplies "the *shape* (probe window + cohort + pending status), never its tokens"; magnitudes are
neither listed as shape nor as tokens (plan ambiguity), but three exact-match numbers are a
fingerprint of a real client run in shipped plugin text — linkable because `pilot-report.md` (which
names the real domain and `chain-22`) is committed to the same public repo at closure.
**Fix:** Perturb the example magnitudes (e.g. `5,240 vs 4,690 ⇒ ~550` and `~550/month`) — zero doc
value lost, fingerprint gone. One-file edit, rides the uncommitted 0.4.0.
**Confidence:** 95/100 (exact-match verified by grep; the numbers-are-tokens reading is
interpretive, which is why this is LOW not MEDIUM)

### [LOW] analyst-craft.md moves 8 and 10 retain the source examples' narrative skeleton
**File:** `plugins/nexus-analytics/skills/answer-qa/references/analyst-craft.md:117` (move 10),
`:94-96` (move 8)
**Origin:** implementation
**Issue:** Move 10's illustration — "a 20-account, actively-managed pilot cohort improves sharply
while the broad account base stays flat over the same window" — is the source's sentence skeleton
(`cookbook.md:255-256`: "a 50-store actively-driven cohort rose sharply while the broad population
stayed flat over the same window") with nouns swapped; "over the same window" is verbatim. Move 8
reuses the source's narrative beat "the largest input-mover shows near-zero output lift"
(`cookbook.md:247`), though the ~7× figure was correctly dropped. All ten moves are otherwise
genuinely rewritten (new domains, new mechanisms, added pedagogy, VWH cross-refs dropped) — these
two skeletons are near-minimal statements of their moves, which is why this does not fail AC-9.
**Fix:** Optional — rephrase the two illustrations' sentence structure (e.g. move 10: lead with the
population's flatness, or use a different contrast frame).
**Confidence:** 90/100 (both texts side-by-side)

### [LOW] `plugin.json` description omits the release's headline skill (carry-over #1 — CONFIRMED)
**File:** `plugins/nexus-analytics/.claude-plugin/plugin.json:5`
**Origin:** design (plan step 7 scoped the release to version + CHANGELOG; the description
enumeration convention was not in any step — developer correctly flagged rather than silently fixed)
**Issue:** The marketplace-facing description enumerates semantic-model-query, data-investigation,
answer-qa, and value-briefing but not value-ledger — the 0.4.0 MINOR's headline capability.
**Fix:** **Fix in this release, don't defer**: add one clause (e.g. "value-ledger (the
ESTIMATED-to-MEASURED value-claim lifecycle; ledger artifact in the consuming project's
docs/value-ledger/)"). It rides the already-uncommitted 0.4.0 for free; deferring costs a later
PATCH bump for prose alone or leaves the inconsistency standing. Optionally extend answer-qa's
clause ("the shipped-answer contract") with "+ grounding gate" in the same touch.
**Confidence:** 95/100

### [LOW] MED-1 residual: value-briefing's unqualified exclusivity clause precedes its own carve-out
**File:** `plugins/nexus-analytics/skills/value-briefing/SKILL.md:23-24`
**Origin:** design (the plan mandated exactly "one coordinating sentence"; the developer authored it
faithfully — the seam is in the untouched preceding clause the plan did not permit retouching)
**Issue:** The preceding sentence still reads unqualified — "The accuracy layer … carries no value
content and no measured-vs-estimated labeling" — while the accuracy-side ledger's lifecycle is
literally estimated→measured (`value-ledger/SKILL.md:36`: "the number is now MEASURED") and its rows
store worth-estimates. The new coordinating sentence resolves this one sentence later via the
"*value* labeling" qualifier and the record-vs-decide partition — which both files state
consistently (registration + validation state = ledger; worth/prioritization/monetization judgment =
value-briefing). The boundary is genuinely resolved, not papered over; only a literal reading of the
one unqualified clause momentarily contradicts it before the qualifier lands.
**Fix:** At the ship-time ADR (already owed for this boundary), qualify the clause — e.g. "carries
no *worth* content and no measured-vs-estimated labeling *of value content*" — or let the ADR state
the partition and leave the skill text as is (adjacency makes it readable).
**Confidence:** 85/100

## Carry-Over Findings (both addressed)
1. **`plugin.json` description does not enumerate `value-ledger`** — CONFIRMED; promoted to F3 with
   a fix-now recommendation.
2. **answer-qa binding sentence duplicated by design** — CONFIRMED as intended design, REFUTED as
   drift: both occurrences normalize byte-identical (verified mechanically; they differ only in bold
   emphasis), sit in exactly the two plan-mandated sections (`## Grounding gate` @ the gate's
   disposition paragraph, `## Check order` @ the pending-value lane), and each carries a "one rule,
   not two — read them together" cross-reference. The duplication is convergence-pinned. No action.

## Gate answers (the six judgment gates from the review task)
1. **AC-9 domain-neutrality beyond the grep — PASS.** Move-by-move against `cookbook.md` §CRAFT
   (:208-257): every retail illustration replaced with an invented-domain one (routing change vs
   carrier congestion; support-reply counts vs repeat-contact absence; dispatch staging vs dock
   capacity; browned-out temperature probe; plan-tier coverage holes; hub trailing-N baselines;
   handle-time deciles). The dependency ladder in move 5 was abstracted (stock/sales steps →
   enrich/confound/outcome steps), §TRAPS/§DEPTH/§LEVERS/value_model.json cross-refs dropped, the
   source's ~7× and 3–4× figures generalized to "several-fold" (a term the source's own move
   statements use). The invented world is coherent across files (move 8's renewal/on-time example =
   output-contract VL-001). Residual: F2's two skeleton echoes — noted, not disqualifying.
2. **MED-2 one-rule check — PASS.** Byte-identical (normalized), mutually cross-referenced, and the
   surrounding logic agrees: gate governs "shipped as validated without re-execution ⇒ dropped";
   lane governs "cannot re-execute by circumstance ⇒ pending label only". No drift in wording or
   implication.
3. **MED-1 boundary — resolved, not papered over.** Both files draw the identical partition
   (record claims + validation state = ledger, accuracy-side; decide worth/rank/monetization +
   value labeling = value-briefing) using the same terms. Residual LOW wording seam (F4).
4. **Cross-plugin citation — unambiguous.** `value-ledger/SKILL.md:67-69` names the nexus plugin,
   the `mine-verify-cover` skill, the in-plugin path
   `skills/mine-verify-cover/references/mine-family-core.md`, and the exact heading — which exists
   verbatim (`mine-family-core.md:180`), with content matching value-ledger's summary word-for-word
   (per-row provenance, `last_verified`, never-delete, append-changelog, idempotent,
   resolved/still-active/superseded). The secondary cite in answer-qa's grounding gate also
   verified: "Evidence gate on write" is the literal bolded term at `:188`, "no re-execution
   content … is dropped" at `:190-191`. The E6-safe full-path form is a bonus, not an obfuscation.
5. **Three disclosed deviations — all sound.** (a) SKU-day generalization: forced by plan step 6's
   own whole-file 0-hit rule over S2-touched files (`SKU` is in the regex; answer-qa is in scope) —
   not scope creep; (b) answer-qa description extension: AC-8's F1 fix applied in-pass with re-lint
   + re-sweep evidence, exactly the fix-then-accept path evaluate-skill defines (measured 620 chars
   vs dev-reported 624 — both < 1024, immaterial); (c) evals inlined in implementation-wave1.md:
   satisfies the plan's "developer runs it and reports" and the no-report-file guidance; the
   verdicts are complete (findings + checked-clean lists + evidence basis), so nothing was lost.
6. **plugin.json description — fix in this release** (F3 rationale: free ride on the uncommitted
   bump vs a dedicated PATCH later).

## Positive Observations
- Cross-plugin citation form is exemplary and should be the repo's reference example for the
  pattern: plugin + skill + path + heading, plus the stated reason a relative path would dangle.
- The invented illustration world is consistent across all three new/edited documents — VL-001's
  renewal-per-on-time coefficient reappears as move 8's illustration — which teaches better than
  disconnected examples and proves the rewrite was designed, not paraphrased.
- The grounding gate's dropped-vs-pending split is authored cleanly: the "exactly one disposition"
  framing kills the loophole an "exception" framing would have opened.
- Developer disclosure discipline: all three deviations surfaced with reasons and evidence; the
  carry-over table routed one item to the architect and one to this review, both correctly.
- CHANGELOG 0.4.0 entry is genuinely house-style (what shipped and why), not a generator file list.
- The evaluate-skill run was honest work — it found and fixed a real description-drift defect (F1)
  rather than rubber-stamping ACCEPT.

## Gaps
- No runnable surface exists for these prose skills, so no functional test exercises the
  answer-qa → value-ledger routing end-to-end; the next pilot lane is the real verification. (The
  Evidence table below is the full mechanical surface this diff has.)
- The token sweep cannot catch numeric fingerprints (F1's class) — a lessons item, not a defect in
  this diff's execution of the plan's sweep, which I re-ran clean over a superset of the developer's
  file list (added CHANGELOG.md and plugin.json: 0 hits).
- AC-7's "same commit" and AC-10 (omni twin) are architect-owned closure steps, correctly not
  claimed by the developer; the done-check should re-verify both at closure.

## Open Questions
- None. (No finding scored below the 80 cutoff after self-audit; the two judgment-flavored calls —
  F1's numbers-are-tokens reading and F4's literal-clause reading — are filed at LOW with the
  interpretive caveat stated inline.)

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Token sweep (plan step-6 regex, `-riE`, all file types) | pass | `grep -riE '<plan regex>'` over value-ledger/**, answer-qa/**, value-briefing/SKILL.md, agents+commands/data-analyst.md, **+ CHANGELOG.md + plugin.json** | 0 hits (exit 1) |
| Self-containment | pass | `grep -riE 'omnishelf\|virtual-worker-harness\|D:\\src\|D:\\omnishelf'` over shipped wave files | 0 hits |
| skill-lint | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` (3 skills) | `OK value-ledger` / `OK answer-qa` / `OK value-briefing`, exit 0 |
| Tests | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | tests 587, pass 587, fail 0 |
| Regen idempotency (AC-5) | pass | `git hash-object` before/after `gen-commands.mjs nexus-analytics` ×2 | hash stable `0faf55b` (= the staged blob) |
| Plugin validate (S4 gate, run locally) | pass | `claude plugin validate plugins/nexus-analytics --strict` | Validation passed |
| MED-2 byte-identity | pass | node script: normalized occurrence count + section mapping | 2 occurrences, identical, in `## Grounding gate` + `## Check order` |
| AC-1 statuses/`last_verified`/heading cite | pass | node script string checks | all five statuses + `last_verified` present; exact heading cited |
| AC-2 sections | pass | node script | `## Grounding gate`, "dropped, not shipped", `## Penalty-only doctrine`, `## Provenance panel` all present |
| AC-3 move count | pass | node script | exactly 10 `## N.` headings |
| AC-4 CI rider | pass | `git diff .github/workflows/plugin-release-check.yml` | both edits + comment fix present |
| Citation targets live | pass | grep `mine-family-core.md` | heading verbatim `:180`; "Evidence gate on write" `:188`; drop-rule `:190-191` |
| F1 fingerprint | confirmed | grep `532\|4,570\|4,038` in `pilot-report.md` | `:101` exact match to `output-contract.md:146` |
| plugin.json 0.4.0 + CHANGELOG (AC-7, pre-commit) | pass | `git diff` | version 0.4.0; enriched `[0.4.0]` entry dated 2026-07-19 |

*Status: COMPLETE — reviewer, 2026-07-19*
