# adhoc-MineVerifyFlows — Critic Review (Plan Review, code-grounded)

> **Provenance — as-run in the `omni` twin.** This review was written against the twin and ported
> back verbatim (`adhoc-MineVerifyFlowsPort`). Its findings were grounded in omni's tree: paths
> read `plugins/omni/…`, and its "release tooling absent" confirmations are facts about the twin —
> `bump-plugin.mjs` and `gen-omni.mjs` are nexus-side and do exist here.

Persisted verbatim by the architect from the critic agent's return, 2026-07-13.

## Mode: Plan Review (Mode 2, code-grounded)
## Verdict: GO-with-fixes  (no CRITICAL, no HIGH; 2 MEDIUM + several LOW to fold before authoring)

## Pre-commitment Predictions (written before detailed cross-reference)
| # | Predicted problem area | Found? |
|---|---|---|
| 1 | Stale "ships unused" wording leaking into the graduated skill | **No** — plan actively forbids it (hard constraint + `grep -c "ships unused" = 0` accept). Handled well. |
| 2 | Family-count sweep missing a consumer (omni-analytics `mine-semantic-model`, or a rules/agents mention) | **No miss** — sweep is complete; `mine-semantic-model` carries no member-count mention. |
| 3 | Wrong current versions / absent release tooling | **No error** — versions correct; `bump-plugin.mjs`/`gen-omni.mjs` genuinely absent; deviation justified. |
| 4 | E9 colon-space frontmatter trip | Deferred to authoring but **double-gated** (skill-lint E9 + `validate --strict`). Mitigated. |
| 5 | An Entry (method 5-10 / adapter 1-4) with no mapping row | **None** — full coverage. |
| — | (unpredicted) skeptic-protocol carve-out gap in family core | Found — MEDIUM. |

## Cross-reference Matrix

**Method inputs (omni-1.25.1 Part B, Entries 5-10):**
| Source | Plan section | Status | Notes |
|---|---|---|---|
| Entry 5 (class-excision gate calibration) | Step 1 §Gate calibration | COVERED | `~189 leaf fields`, `**.sfr` ε 0.005, wandering-fields → class-wide `**.` — all match Entry 5 verbatim |
| Entry 6 (~4 verify pairs) | Step 1 §Cost | COVERED | "four drift surfaces across four pairs" matches Entry 6 |
| Entry 7 (catalog match ≠ sufficient; grep FFI + firstWhere) | Step 1 §Fixture strategy | COVERED | both greps + "planogram version" nuance preserved |
| Entry 8 (verdict scoped to files produced) | Step 1 §Determinism verdicts scoped | COVERED | "re-ask on every reach extension" |
| Entry 9 (deferred-smoke precision) | Step 1 §Acceptance precision | COVERED | host-side exact-string unit test for asset-key constants |
| Entry 10 (5-item recipe bundle) | Step 1 §Stage recipes | COVERED | all 5 sub-items present (scrubber-smoke, catalog-overlap grep, fan-out policy, dead-code→tech-debt, critic-vs-live-tree) |

**Adapter inputs (omni-flutter-0.3.0, Entries 1-4):**
| Source | Plan section | Status | Notes |
|---|---|---|---|
| Entry 1 (`flutter drive --keep-app-running`) | Step 2 §On-device runs | COVERED | command + `reportData/callback/writeResponseData` prohibition match; placeholders converted to `{...}` (E7-safe) |
| Entry 2 (two-hop bless) | Step 2 §Blessing a golden | COVERED | `files/goldens_bless_output/{flowSlug}/{file}` path matches |
| Entry 3 (grep chain + 2 Flutter traps) | Step 2 §Fixture soundness | COVERED | both traps (opt-in `checkInit`, `compute()` isolate-local statics) present; `assistant/sendPlanogram/processReport/checkShelfProductsInside/calcShelfFillRate` match exactly |
| Entry 4 (pure-Dart 3-verdict module + two-tier outcome) | Step 2 §The golden-gate module | COVERED | three verdicts + FINAL two-tier + "NEVER the spike's exact-only wording" |

**tech-spec + critic fold-ins:**
| Source | Plan section | Status |
|---|---|---|
| Pipeline (Mine→…→Report) | Step 1 §The pipeline | COVERED |
| OQ-1 FINAL form (two-tier, exclusions + `**.sfr`, hardware-pin, runs 3-6 refinements) | Hard constraints + Step 1 §Gate calibration | COVERED — FINAL form only, no stale intermediate |
| M1 (pre/post-diff capture) | golden-gate row (attributed M1, L4) | COVERED |
| M3 (sabotage as new flow-scope fallback) | deviations row (attributed M3, L2) | COVERED |
| L1 (registry `source:` field) | registry row (attributed L1, L2) | COVERED |
| L2 (single-file registry) | deviations + registry rows | COVERED |
| L4 (FakeApiAdapter / no live-API dependence) | golden-gate row | COVERED |
| M2 (fixture procedure), L3 (plan staleness) | — | **Correctly NOT graduated** (pilot-specific / meta-note); matches the task's M1/M3/L1/L2/L4 fold-in list |

**Family integration (Step 3) — verified against live grep:**
| Consumer | Line(s) | In plan's edit list? |
|---|---|---|
| mine-family-core.md | 3 (`seven-member`), 21 (`across all seven`) | Yes |
| mine-verify-cover/SKILL.md | 409 (`7-row`) | Yes |
| mine-verify-repo/SKILL.md | 27, 232 (`all seven`) | Yes |
| mine-design/SKILL.md | 25 (`7-row`), 27 (`all seven`) | Yes |
| mine-reference-model/SKILL.md | 28 (`7-row`), 29, 221 (`all seven`) | Yes |
| mine-algorithm/SKILL.md | 26 (`7-row`), 28 (`all seven`); **23 (`seventh mine`) kept** | Yes |
| mine-semantic-model (omni-analytics) | — | **No count mention** (its "seven" hits are construct-families/probe-classes, unrelated) → correctly out of scope |

Every count-bearing mention (12 across 6 files) is in the edit list; the acceptance grep is correctly scoped and would catch a miss. **Step 3's file:line list is complete and accurate.** The proposed 8th row is column-consistent (Unit / Ground truth / Gate / Output all parallel the existing rows).

**Mechanics (all verified against live repo @ d188536):**
- omni `1.33.0`→`1.34.0`, omni-flutter `0.3.0`→`0.4.0` — **both current versions confirmed against live plugin.json**; MINOR tier correct per release-plugin policy (new user-facing skill).
- skill-lint path `plugins/omni/skills/improve-skills/scripts/skill-lint.mjs` exists; accepts multiple folder args (confirmed in source).
- E9 (`--strict` colon-space rejection) claim accurate (skill-lint E9 comment confirms).
- **`bump-plugin.mjs` and `gen-omni.mjs` confirmed absent repo-wide** (only `gen-commands.mjs` in `scripts/`); manual-bump deviation is factually justified.
- CHANGELOG header format `## [X.Y.Z] — YYYY-MM-DD` (em-dash) matches existing entries in both files.

## Findings

### [MEDIUM] Flow-Verify's relationship to the family-core §Skeptic protocol is left undefined by the integration sweep
**Source:** `mine-family-core.md:93-113` (Skeptic protocol + its carve-out list) vs plan skeptic-note row and tech-spec:42-43.
**Issue:** The family-core §Skeptic protocol mandates the skeptic **RUNS** each evidence command and the orchestrator **"drops any verdict without [a re-execution output excerpt]"**, and it explicitly enumerates which members are *not* consumers of that must-RUN enforcement (code-arm, `mine-from-spec`, `mine-semantic-model`). The plan's flow-Verify is a **code re-trace for reachability** ("re-traces each flow through the navigation/bloc code" — tech-spec:42) that borrows "the core verdict grammar CONFIRMED/WRONG/IMPRECISE" by pointing at §Skeptic protocol — but a reachability verdict is a code-reading claim, not a runnable evidence command with an excerpt. Step 3 (the family-integration sweep) adds the 8th table row, the count fixes, and an Execution-topology bullet, but **does not classify flow-Verify in the §Skeptic protocol carve-out list**. The result: the shared file consumed by 8 skills will enumerate must-RUN consumers/non-consumers yet omit the newest member, and the new skill's skeptic obligation is ambiguous.
**Impact:** Two authors could implement the flow skeptic differently — one over-constraining it to produce a runnable excerpt per "reachable" claim, another treating it as a code re-trace and leaving the shared file silently incomplete.
**Suggestion:** In Step 3, add one clause to the family-core §Skeptic protocol closing paragraph classifying flow-Verify (a code re-trace that reuses the CONFIRMED/WRONG/IMPRECISE grammar but is *not* a consumer of the command-re-execution must-RUN enforcement — the same treatment the code-arm gets). Adjust the plan's skeptic-note row to point at "the core verdict grammar" specifically, not the whole §Skeptic protocol.
**Self-audit:** Confidence MEDIUM. Refutable — the author could argue flow-Verify genuinely "runs" (traces code) and produces evidence, making it a consumer with no carve-out needed. Genuine gap (shared-file completeness), non-blocking; the tech-spec resolves design intent so no rework results.

### [MEDIUM] "Body under 500 lines" is a hard accept criterion, but the content volume plus the single-file decision are in tension (and W3 is only a warning)
**Source:** Plan accept criteria + Decisions ("Content fits well under the 500-line W3 bar"), vs skill-lint W3 (over-500 body → **WARN**, exit 0) and live sibling sizes.
**Issue:** The method skill's content mapping has ~20 dense sections. The closest analog, `mine-verify-cover/SKILL.md`, is **419 lines with ~15 sections**. A 20-section skill of comparable prose density plausibly exceeds 500. Two mismatches follow: (a) skill-lint W3 is a *warning* (lint still exits 0 at 520 lines), so the accept criterion "skill-lint exits 0" and "body under 500 lines" are not the same gate — the plan conflates them; (b) if content genuinely runs past 500, the "single-file, no `references/` v1" decision collides with the self-imposed cap, forcing either a split (breaking the decision) or a waiver.
**Impact:** The author may hit an unplanned fork mid-authoring (split vs waive) that the plan doesn't pre-resolve.
**Suggestion:** Either (a) explicitly treat over-500 as an accepted W3 warning (lint still passes) and drop it as a hard accept, or (b) pre-authorize a `references/` fallback for the method skill if it overruns, noting the family-core is already the shared reference. Prefer terse authoring first (mine-verify-cover proves 20-ish sections can fit near 420).
**Self-audit:** Confidence MEDIUM. Non-blocking; would not cause rework (content is correct either way), only a late authoring decision.

## Gap Analysis (LOW)

- **[LOW] Consumer-count prose in Decisions is slightly off.** Decisions says "11 grep-verified consumers"; the live grep shows **12** count-bearing mentions across 6 files (plus the kept "seventh mine" line). The rejected-alternative "leaves 9 stale mentions" is also off (a family-core-only edit leaves **10**). Cosmetic only — the Step 3 edit list and acceptance grep are complete and correct.
- **[LOW] `hardware-pinned` has an accept-gate in the method skill but no assigned method section, and is device-flavored.** Step 1 accept requires the grep, yet no content-mapping row plants it, and hardware-pinning is a device concern that most naturally lives in the adapter. Suggest: state the generic principle ("pin goldens to one reproducible profile") in a named method section and reserve the specific device profile for the adapter — or move the grep check to the adapter's accept.
- **[LOW] Worked-example figure `58/112 files differed` (Step 2) is not in the three binding docs.** The tech-spec cites `137/140` for SDK-stage byte-identity, not a cross-device count; the plan attributes 58/112 to `spike-findings.md`. Verify against spike-findings before it lands in the shipped skill (traceability).
- **[LOW] "Two modes" for flows is a scope addition not sourced from the tech-spec.** The plan mirrors mine-verify-cover's Full vs Mine→Verify-only split; well-justified by family parallel but the tech-spec defines no such split. Fine to include — noting it as an author-visible innovation, not a defect.
- **[LOW] "flutter entries map 1:1 onto five fills" (Decisions) is imprecise.** There are 4 adapter entries and 5 capabilities; capability 3 (output capture = docs-dir pre/post `.json` set-diff) is filled from the method's M1 pre/post-diff concept plus a Flutter mechanic, not a distinct adapter entry. The 5 method capabilities do map 1:1 to the 5 adapter fills — that internal consistency is fine; only the entry→fill framing overstates.

## Open Questions (low-confidence — moved here by self-audit)
- Do the two new `user-invocable: true` skills require any manifest/index registration, or are they purely folder-discovered? The plan assumes folder discovery (no manifest edit). No skills-index requiring an entry was found, and sibling skills (e.g. mine-algorithm) followed the same folder-only pattern — flagged only for the architect to confirm the skill-discovery assumption before authoring.
- Exact frontmatter description strings are deferred to authoring. Both E9 and W2 are gated (skill-lint + `validate --strict`), so risk is well-mitigated; the only residual is a re-round if a description trips E9. Watch the temptation to write "the gate: golden-master…" (a colon-space) — reword or quote.

## Verdict rationale
No CRITICAL and no surviving HIGH (the skeptic carve-out downgraded to MEDIUM under the Realist Check — design intent is clear from the tech-spec, fix is small). The stale-wording trap, the family-count sweep, coverage of all graduation inputs, and every mechanical claim (versions, lint paths, absent tooling, CHANGELOG format) are **verified correct against the live repo**. Fold the two MEDIUMs (skeptic carve-out classification into Step 3; resolve the 500-line/single-file tension) and the LOW cleanups, then proceed. **GO-with-fixes.**
