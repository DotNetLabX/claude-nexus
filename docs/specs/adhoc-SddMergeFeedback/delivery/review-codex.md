# Codex Cross-Check — adhoc-SddMergeFeedback (Standard+Codex, round 1)

> Persisted by the team lead: Codex's sandbox was read-only (`apply_patch` rejected), so it could not
> write this file itself. Below is Codex's verdict + findings **verbatim** from its completion message,
> followed by the team lead's finding-by-finding reconciliation against live source.

## Codex verdict: NO-GO

Note: Codex's node-based verification was blocked by the local shell policy — the review is grounded in
source tracing + `HEAD` diffs + manual workflow/lib body comparison, **not** a rerun of `node --test` /
`node scripts/selfcheck.mjs`.

### Codex findings (verbatim)

1. **blocker** — `harness/lib/rules-registry.mjs:88-151`, `tests/unit/merge-rules.test.mjs:34-43`
   `updateRegistry()` now uses the right fallback for code-only rows, but it still treats `ruleKey` as a
   unique registry identity without ever coalescing duplicates. `triageRuleSets()` can emit two entries
   with the same reconciled `ruleName` (`merge-rules.test.mjs:34-43`). `updateRegistry()` iterates both
   `newEntries` one-by-one and emits two rows with the same `canonicalName`, even though the file contract
   says "one row per canonical rule". On later runs `priorByName`/`newByName` collapse duplicates to the
   last row seen, so carried/supersede/retire becomes order-dependent.

2. **major** — `harness/lib/rule-crosswalk.mjs:50-60`, `harness/lib/merge-rules.mjs:132-155`,
   `plugins/nexus/skills/mine-verify-cover/SKILL.md:372-380`, `tests/unit/merge-rules.test.mjs:22-43`
   Operator metadata is stored one declaration per canonical name, not per matched pair.
   `crosswalkExpectations()` overwrites earlier object entries with `out.set(value.canonical, decl)`, and
   `triageRuleSets()` consults only `expectations.get(key)`. Two object-valued crosswalk entries sharing
   one canonical rule are order-dependent, and a later self-map object with no metadata can silently clear
   an earlier `expect:'divergent'` / `staleSpec:true` declaration. The changed skill text says divergence
   is declared "per matched pair" — but the mechanism is per-canonical.

3. **minor** — `harness/lib/rules-registry.mjs:43-45`, `harness/merge.workflow.js:119-121`,
   `scripts/selfcheck.mjs:168-170`
   The new local `ruleKey(entry)` helper in `rules-registry.mjs` is not mirrored into the workflow or
   covered by the selfcheck PAIRS byte-compare — the workflow reuses the older inlined `merge-rules.mjs`
   `ruleKey(r)`. Runtime-equivalent today, but the "edited function mirrored and byte-compared" invariant
   is not met for this addition.

Focus areas: Area 1 (operator-declared divergence override branch) — correct once a declaration survives
extraction. Area 2 (`ruleKey` fallback) — narrow code-only drop fixed. Area 3 (layer-only `clusterKey`) —
PASS. Area 4 (all-string backward compat) — PASS, five buckets byte-identical.

## Team-lead reconciliation (finding-by-finding, vs live source)

Codex did **not** execute the suites (sandbox blocked); the reviewer independently ran 48/48 + selfcheck
5/5 + reproduced RED→GREEN via `git show HEAD:…`. Reconciled against source:

- **Finding 1 — NOT a regression; pre-existing; out of scope.** The pre-change `updateRegistry` already
  walked one-row-per-entry keyed by `entry.ruleName` (same collapse behavior). Item 1 only extended the
  key to `ruleName ?? id` to stop dropping code-only rows — it does not introduce or worsen duplicate
  coalescing. The many-to-one duplicate-canonicalName scenario is enabled by pre-existing `triageRuleSets`
  behavior (test 34-43 predates this pass). **Disposition: not blocking; recorded as a follow-up candidate
  (registry duplicate-coalescing), outside items 1–4.**
- **Finding 2 — partly real; folded as LOW.** (a) `crosswalkExpectations` per-canonical overwrite is a
  narrow footgun — a *metadata-less* object `{canonical:'X'}` sets `{}` and can clear a sibling alias's
  real declaration. Semantically per-canonical is the correct model (one canonical rule has one spec↔code
  divergence truth), but the empty-decl clear is a real sharp edge. **Fix (fold): skip `out.set` when the
  decl is empty, so a metadata-less object cannot clear a real declaration.** (b) SKILL.md "per matched
  pair" wording is mildly imprecise for the many-to-one fan-in — and this is a doc-honesty pass. **Fix
  (fold): tighten to per-canonical wording.**
- **Finding 3 — adjudicated; won't-fix.** The local `ruleKey` not being byte-mirrored is the deliberate
  MED-1 plan decision (a duplicate top-level `function ruleKey` in `merge.workflow.js` is invisible to
  selfcheck's first-match `extractFn`, so the inlined `updateRegistry` reuses the existing inlined
  `merge-rules` `ruleKey`; the local helper is lib-only). Both are identical `(ruleName ?? id).trim()`
  one-liners. **Disposition: not a defect; noted.**

**Reconciled verdict: reviewer APPROVED stands.** No blocking (CRITICAL/HIGH) findings survive
reconciliation. Codex's NO-GO rests on finding 1 (pre-existing/out-of-scope) + finding 2 (LOW, folded).
Three LOW items routed to a single developer fix cycle (round 1): reviewer-LOW stale test comment +
Codex-2b skill wording + Codex-2a empty-decl guard.
