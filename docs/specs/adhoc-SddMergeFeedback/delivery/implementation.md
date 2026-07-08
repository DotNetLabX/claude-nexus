# SDD Merge Feedback (items 1–4 + doc honesty + release) — Implementation

Applies the sprint-rituals nexus-1.21.0 merge-machinery feedback (items 1–4) to the SDD merge harness,
plus the skill-doc honesty edit and the release bump. Every lib edit is mirrored VERBATIM into its
inlined copy in `harness/merge.workflow.js` (the Workflow runtime cannot `import`); `node
scripts/selfcheck.mjs` stays green throughout.

## Files Modified

- `harness/lib/rules-registry.mjs` — **Step 1.** Added a module-local `ruleKey(entry)` helper
  (`(entry?.ruleName ?? entry?.id ?? '').trim()`, the same fallback merge-rules.mjs uses). Changed
  `updateRegistry`'s new-entry key (`newByName`) and the new-entry walk (`const name = …`) from
  `entry.ruleName` to `ruleKey(entry)`, so a code-only-precision entry carrying only `id` (BR-n, no
  ruleName) is no longer silently dropped. The retire-walk (keyed on `prior.canonicalName`) already
  round-trips a code-only row's canonicalName back to its id, so it stays consistent.
- `harness/merge.workflow.js` — **Step 1.** Mirrored the two `updateRegistry` usages
  (`newByName`, `const name`) to `ruleKey(e)` / `ruleKey(entry)`. Did NOT add a second `ruleKey` to the
  workflow — the inlined `updateRegistry` reuses the merge-rules `ruleKey` already inlined at ~line 101
  (a duplicate top-level `function` would be invisible to selfcheck's first-match `extractFn`, per plan
  MED-1). The local helper lives only in the lib.
  **Step 2.** Rewrote inline `applyCrosswalk` to resolve the canonical name from either a string or a
  `{canonical, expect?, staleSpec?}` object (verbatim mirror of the lib); added inline
  `crosswalkExpectations` after `reconcileRuleSets` (verbatim body, no JSDoc — matching inline style).
- `harness/lib/rule-crosswalk.mjs` — **Step 2.** `applyCrosswalk` now resolves the canonical from a
  string OR an object value (`typeof mapped === 'string' ? mapped : mapped?.canonical) ?? r?.ruleName`
  — the `?? r?.ruleName` is the LOW-3 defensive fallback so a canonical-less object keeps the existing
  ruleName rather than keying by `undefined`. Added exported `crosswalkExpectations(map)` → a
  canonical-keyed `Map<name, {expect?, staleSpec?}>` built only from object-valued entries (string
  entries and canonical-less objects contribute nothing → an all-string crosswalk yields an empty map,
  preserving today's behavior). Only sets `expect`/`staleSpec` keys when defined (so `deepEqual` against
  `{expect:'divergent'}` holds).
- `scripts/selfcheck.mjs` — **Step 2 (HIGH-1).** Added `'crosswalkExpectations'` to the
  `rule-crosswalk.mjs → merge.workflow.js` PAIR's `fns` array (now
  `['applyCrosswalk', 'crosswalkExpectations', 'reconcileRuleSets']`) so the new inlined fn is
  byte-compared — closing the inline-sync hole on the divergence hot-path.
- `harness/lib/merge-rules.mjs` — **Step 3.** Extended the import to
  `{ reconcileRuleSets, crosswalkExpectations }`. `triageRuleSets` now builds an `expectations` map from
  the crosswalk and, at the match point, makes the operator-declared `expect` AUTHORITATIVE:
  `expect:'overlap'` forces overlap-confirmed (attaches `matches[0]`), `expect:'divergent'` forces
  spec-only-divergent, and ABSENT falls back to the `boundaryDiverges` hint exactly as before. The
  `suspect-stale-spec` tag now fires on `decl.staleSpec === true` OR the dormant date-based `isStaleSpec`
  (kept as a valid fallback, per plan). Corrected the file-header comment (removed the false
  "content-keyed, granularity-tolerant" claim; describes operator-declared divergence with boundary as a
  corroborating hint) and the `boundaryDiverges` comment (now labels it a hint + explains the
  missing-boundary false-overlap flavor). Comment edits are lib-only — they sit outside the compared
  function bodies (the workflow's inline copies strip them), so no workflow mirror is needed.
- `harness/merge.workflow.js` — **Step 3.** Mirrored the `expectations` build + the authoritative-`expect`
  decision + the `staleSpec`-OR-date tag logic verbatim into inline `triageRuleSets`. No import change
  (the workflow has no imports; inline `crosswalkExpectations` was added in Step 2).
- `harness/lib/kb-distill.mjs` — **Step 4.** `clusterKey` now falls back to LAYER-ONLY when `symbol` is
  absent (`symbol ? \`${symbol}|${layer}\` : \`${layer}\``) instead of to `canonicalName` — collapsing
  symbol-less rows to one cluster per layer instead of one-per-rule. In `distillRegistry`, dropped the
  `?? row.canonicalName` pseudo-symbol in the cluster object (`symbol: row?.symbol`) and split the line
  render so a symbol-less cluster emits a layer-only line `- [<layer>]: N rules — see <ledger>` (no
  arbitrary rule name label — LOW-4). `hotRows[].cluster` is now the real symbol (undefined when absent),
  never a fake label. Symbol-present clustering is byte-unchanged (guarded by the existing symbol-present
  Slice 1 cases).
- `harness/merge.workflow.js` — **Step 4.** Mirrored `clusterKey` + the `distillRegistry` cluster-object
  and line-render changes verbatim into the inline kb-distill copy.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — **Step 5 (release-surface).** Rewrote the
  **Merge.** paragraph: removed the false "Content-keyed, granularity-tolerant matching (symbol +
  condition content…)" claim (the exact-string compare never delivered it); now states the spec/code
  rule sets are reconciled by the human-authored crosswalk (many-to-one tolerant both ways) and that
  agree-vs-diverge is operator-declared via the crosswalk, with the condition-boundary comparison as a
  corroborating hint consulted only when nothing is declared. Adjusted the `suspect-stale-spec` clause to
  "operator-declared via the crosswalk (or derived when the code-arm KB carries an attributed-source
  date…)". No harness filename appears in the changed lines (`## Substrate` rule). This is a shipped-file
  change → drives the Step 6 version bump.
- `plugins/nexus/.claude-plugin/plugin.json` — **Step 6.** Version `1.25.1` → `1.25.2` (PATCH, via
  `scripts/bump-plugin.mjs`; owner-decided PATCH, not escalated to MINOR).
- `plugins/nexus/CHANGELOG.md` — **Step 6.** Prepended the `1.25.2` entry, rewritten from the stub to
  describe the Merge doc-honesty change and cite the binding feedback file
  (`nexus-1.21.0-2026-07-04.md`, item 2 doc half); notes the items 1–4 harness fixes ship alongside but
  live outside `plugins/**` so carry no version.
- `../omni` (private twin, separate repo) — **Step 6.** Regenerated via `node scripts/gen-omni.mjs` so
  the omni plugin mirrors the bumped `plugin.json` + `CHANGELOG.md`; `gen-omni.mjs --check` exits 0
  (twin in sync). The twin's commit in `../omni` is **team-lead-owed** (see Carry-Over).

## Key Decisions

- Step 1 local `ruleKey` param named `entry` (plan phrasing `ruleKey(entry)`); parameter name is
  immaterial to selfcheck since `ruleKey` is not in the rules-registry PAIR's `fns` list (it is
  byte-compared only in the merge-rules PAIR, against merge-rules.mjs). The `updateRegistry` body IS in
  the rules-registry PAIR and is byte-identical across lib and workflow.
- `crosswalkExpectations` includes only object-valued entries that carry a `canonical` field, and sets
  `expect`/`staleSpec` keys only when defined — so `deepEqual` against `{expect:'divergent'}` holds and an
  all-string crosswalk yields an empty map (backward-compat preserved).
- Step 3 forced-overlap attaches `matches[0]` as the `codeRule` (deterministic; the boundary-agreeing
  pick is moot once the operator declares overlap).
- Step 4 `hotRows[].cluster` is now the real symbol (`undefined` when absent) rather than a `'(unnamed)'`
  / canonicalName placeholder — existing tests assert `hotRows.length`, `.pointer`, `.line`, not
  `.cluster`, so this is safe.
- Verbatim inline mirror includes the in-body `//` comments (not just the code) even though selfcheck's
  `normalize` strips them — honors the plan's "character-for-character" mandate and is robust to any
  future normalize change.
- Step 6 version stays `1.25.2`. The post-bump `--dry-run` proposing `1.25.3` is the documented false
  dirty-vs-HEAD signal (the SKILL.md is still uncommitted vs the committed HEAD `1.25.1`); the bump rides
  within `1.25.2` — did NOT bump again (CLAUDE.md release rule / MEMORY: "uncommitted bump rides within").

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Omni twin needs committing in `../omni` | low | team-lead | `gen-omni.mjs --check` exits 0; twin files regenerated in the sibling `../omni` repo | Commit the twin in `../omni` with the mirrored message per CLAUDE.md (`feat(adhoc-SddMergeFeedback): sync mine-verify-cover Merge doc honesty (omni 1.25.2)` shape), as part of the nexus close. Not committed by the developer. |
| Backward-compat spine is test-guarded, not asserted byte-for-byte across a live run | low | reviewer | rule-crosswalk + merge-rules backward-compat tests cover triage bucketing; items 1/4 intentionally change registry/distillate | The live merge run (real spec-rules.md + code-arm KB + registry write) is operator-owed (merge.workflow.js Step 9 runbook) and out of THIS pass's scope — build-only proves the runtime shape, per the workflow header. |
| gen-commands NOT run | low | reviewer | no `agents/*.md` changed this pass (only a skill + harness + tests + scripts) | selfcheck's gen-commands drift check is green; regen intentionally skipped (nothing to regen). |

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | tdd | RED (BR-9 row absent) → GREEN; regression test added as Slice 10 in rules-registry.test.mjs |
| 2 | tdd | RED (missing `crosswalkExpectations` export) → GREEN; 5 new tests (object-shape resolve, LOW-3 fallback, expectations map, 2 backward-compat) in rule-crosswalk.test.mjs |
| 3 | tdd | RED (expect:divergent on boundary-equal falsely overlapped) → GREEN; 5 new tests (expect:divergent, expect:overlap, no-decl backward-compat, staleSpec, LOW-2 false-overlap) in merge-rules.test.mjs |
| 4 | tdd | RED (41 symbol-less rows → 41 clusters; name leaked) → GREEN; 2 new tests (per-layer collapse, LOW-4 layer-only line) in kb-distill.test.mjs |
| 5 | None | prose edit; `TDD: n/a`, `Skill: None` (lint is the gate) — per-skill skill-lint OK, full-estate 25/25 |
| 6 | release-plugin | dry-run → PATCH 1.25.1→1.25.2 (owner-decided, not escalated); applied, CHANGELOG rewritten, omni twin regenerated, plugin validated |

## Deviations from Plan

- None. All six steps implemented as planned. gen-commands intentionally not run (no `agents/*.md`
  changed — see Carry-Over). The `../omni` twin was regenerated (selfcheck `gen-omni --check` green) but
  its commit is team-lead-owed, not a developer action.

## Final Verification (whole pass)

- Four suites: `node --test tests/unit/{rules-registry,rule-crosswalk,merge-rules,kb-distill}.test.mjs`
  → **48 pass / 0 fail** (13 new regression cases: 1 + 5 + 5 + 2).
- `node scripts/selfcheck.mjs` → **5/5** (tests, gen-commands drift, gen-omni --check, bump-plugin
  --check, spec-diff inline-copy sync all PASS).
- `node scripts/bump-plugin.mjs --check` → exit 0 (bump present).
- Per-skill `skill-lint plugins/nexus/skills/mine-verify-cover` → exit 0; full-estate skill-lint test
  25/25.
- `claude plugin validate plugins/nexus --strict` → Validation passed.
- Backward-compat spine (triage bucketing): guarded by the all-string-crosswalk / no-declaration tests
  in rule-crosswalk + merge-rules; items 1 & 4 intentionally change registry/distillate (the fix).

## Fix Cycle 1

Step-2 review (reviewer + Codex) APPROVED; folded in three consolidated LOW follow-ups. No blocking
findings — Steps 1–6 left intact. No plugin re-bump (edits ride within the uncommitted `1.25.2`).

**Fix 1 (doc, trivial) — stale test-header comment.**
- `tests/unit/merge-rules.test.mjs` (lines 1–13 header) — removed the false opening "Content-keyed,
  granularity-tolerant matching…" claim (the exact inaccuracy Step 3 already struck from
  `harness/lib/merge-rules.mjs`'s header). Rewrote the paragraph to match the honest mechanism: rules
  reconciled via the human-authored crosswalk (`reconcileRuleSets`, many-to-one tolerant both ways);
  agree-vs-diverge OPERATOR-DECLARED via the crosswalk (authoritative); the condition-boundary
  string-compare demoted to a CORROBORATING HINT. Comment-only — no test logic touched.

**Fix 2 (doc, trivial) — skill wording imprecision.**
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` (~L379) — "the crosswalk states, **per matched
  pair**, which rules agree vs diverge" → "the crosswalk states, **per canonical rule**, whether its
  matched code/spec pair agrees or diverges". The mechanism keys expectations by canonical rule name
  (`crosswalkExpectations` → `Map<canonical, decl>`), a many-to-one fan-in, so "per matched pair" was
  imprecise. No harness filename in the changed lines (`## Substrate` rule honored).
- Rode within the existing uncommitted `1.25.2` bump — did NOT re-bump (post-bump `--dry-run` proposing
  `1.25.3` is the documented false dirty-vs-HEAD signal; `cur` ≠ committed HEAD `1.25.1`).
- RE-RAN `node scripts/gen-omni.mjs` so the twin re-synced (selfcheck `gen-omni --check` → in sync).

**Fix 3 (hardening, guard + test) — `crosswalkExpectations` empty-decl guard.**
- `harness/lib/rule-crosswalk.mjs` (`crosswalkExpectations`, L50–65) — an object-valued entry with a
  `canonical` but NO `expect`/`staleSpec` built `decl = {}` and still did `out.set(value.canonical, decl)`.
  Two aliases mapping to the SAME canonical — one `{canonical:'X', expect:'divergent'}`, a later
  `{canonical:'X'}` — let the metadata-less object OVERWRITE and silently clear the real declaration
  (Codex finding 2). Guard: `if (Object.keys(decl).length > 0) out.set(value.canonical, decl)` — an empty
  decl is never stored, so a metadata-less alias cannot clear a sibling's real declaration. Behavior-
  preserving: an absent entry and a stored-empty entry are indistinguishable to the consumer (both fall
  through to the boundary hint), so skipping the empty set changes nothing for the string/absent paths.
- `harness/merge.workflow.js` (inline `crosswalkExpectations` copy, ~L85) — mirrored the guard (comment +
  line) VERBATIM. selfcheck `spec-diff inline-copy sync` PAIRS byte-compare covers this fn → in sync.
- `tests/unit/rule-crosswalk.test.mjs` — added 2 regression tests (TDD, RED→GREEN): (1) two entries →
  same canonical, first `{canonical:'X', expect:'divergent'}`, second `{canonical:'X'}` → still
  `X → {expect:'divergent'}` (was `X → {}` before the guard); (2) a canonical with ONLY a metadata-less
  object is `.has()===false` — confirms empty-decl and absent both fall through to the boundary hint
  (lookup semantics unchanged for the consumer). Confirmed RED first (both failed for the right reason:
  empty `{}` stored/overwritten), then GREEN after the guard.

### Fix Cycle 1 — Skills Used
| Fix | Skill(s) invoked | Notes |
|-----|------------------|-------|
| 1 | None | comment-only doc edit, no test logic — `Skill: None`, no TDD |
| 2 | None | prose edit; skill-lint is the gate (per-skill OK, full-estate 25/25) |
| 3 | tdd | RED (empty `{}` overwrote/stored) → GREEN after the guard; 2 regression tests added |

### Fix Cycle 1 — Verification
- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **505 pass / 0 fail** (2 new regression cases).
- `node scripts/selfcheck.mjs` → **5/5** (tests; gen-commands drift; gen-omni --check in sync after Fix 2
  regen; bump-plugin --check bump present; spec-diff inline-copy sync 7 pairs incl. `crosswalkExpectations`).
- `node scripts/bump-plugin.mjs --check` → passing; `plugin.json` version **1.25.2** (no re-bump).
- Per-skill skill-lint `mine-verify-cover` → **OK**; full-estate skill-lint test → **25/25**.

*Status: COMPLETE — developer, 2026-07-08 (Fix Cycle 1 folded in)*
