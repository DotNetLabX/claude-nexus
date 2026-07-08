# Plan — adhoc-SddMergeFeedback

Apply the sprint-rituals **nexus 1.21.0 merge-machinery feedback** (items 1–4) to the SDD merge
harness. Item 5 (read-tracker post-compaction) is **out of scope** — different subsystem, tied to an
unshipped 1.20.0 read-tracker thread.

- **Slug:** `adhoc-SddMergeFeedback` (ad-hoc pass — `delivery/` only, no `spec.md`)
- **Intent:** Refactoring + defect-fix (behavior-preserving for existing runs; new capability is opt-in via crosswalk metadata)
- **Binding definition:** `D:\src\sprint-rituals\docs\plugin-feedback\nexus-1.21.0-2026-07-04.md` (items 1–4) + the adhoc-SddMergeGen ADRs
- **Review mode:** critic, **code-grounded (mandatory)** — this edits a shipped skill + harness a consuming repo runs; a doc-only pass is structurally blind to the defect classes here.

## Hard constraint — inline-copy sync (applies to EVERY lib edit)

`harness/merge.workflow.js` inlines **verbatim** copies of the lib functions (the Workflow runtime
cannot `import`). `scripts/selfcheck.mjs` PAIRS byte-compares each inlined copy against its source lib
(`libFn !== wfFn` → fail). So **every function edited in `harness/lib/*.mjs` must be mirrored
character-for-character into its inlined copy in `harness/merge.workflow.js`**, and `node
scripts/selfcheck.mjs` must stay green. This is a sub-requirement of every step below, not a separate
step.

## Scope

**In:** items 1–4 — `rules-registry.mjs` (item 1), `rule-crosswalk.mjs` + `merge-rules.mjs` (items 2, 3),
`kb-distill.mjs` (item 4); their inlined copies in `merge.workflow.js`; the four unit test files; the
`mine-verify-cover` skill Merge paragraph + `merge-rules.mjs` header comment (doc honesty).

**Out:** item 5 (read-tracker) → separate pass. `kb-entry-schema` skill — **untouched** (no
`attributedSource`/stale claim exists to correct; item 3 uses the crosswalk route, not schema extension).
C2/C3/C4 SDD lifecycle deferrals — unchanged. The addendum's "reader over-extraction" / "write-agent
`</content>`" notes — agent-prompt issues, not these libs; out of scope (route to a follow-up if wanted).

## Decisions (two-way-door, self-resolved — ADR-25)

| Decision | Why | Rejected alternative | Status |
|----------|-----|----------------------|--------|
| Extend crosswalk value shape to `string \| {canonical, expect?, staleSpec?}` | Backward-compatible (string values keep working); the crosswalk is already the human-authored post-hoc home | A separate `expectMap` arg — two sources of truth, more plumbing through `_args` | decided |
| `expect` is authoritative; `boundaryDiverges` consulted only when `expect` absent | The feedback's chosen fix — "string equality demoted to at most a hint"; operator authoring the crosswalk knows the real divergences | Keep boundary as co-equal — reproduces the 16/18 false-positive flood | decided |
| Item 3 stale-spec via crosswalk `staleSpec` flag; `kb-entry-schema` untouched | Same crosswalk mechanism as item 2 (one extension serves both); keeps the date-based `isStaleSpec` path as a still-valid dormant fallback | Extend `kb-entry-schema` with a dated `attributedSource` — larger schema change, unused by current KBs | decided |
| `ruleKey` fallback defined **locally** in `rules-registry.mjs` (not imported from `merge-rules.mjs`) | Keeps the function self-contained for verbatim inlining into `merge.workflow.js` (an import complicates the inline copy + PAIRS) | Export `ruleKey` from `merge-rules.mjs` and import it | decided |
| Slug `adhoc-SddMergeFeedback` | Standalone architect run, no PO/team-lead to assign | — | decided |

## Steps

### Step 1 — Fix `updateRegistry` code-only-row drop (item 1, HIGH)
- **Files:** `harness/lib/rules-registry.mjs`; mirror into `harness/merge.workflow.js`; test in `tests/unit/rules-registry.test.mjs`.
- **What:** `triageRuleSets` keys rules via `ruleKey = ruleName ?? id`, but `updateRegistry` reads `entry.ruleName` only (line 81 `newByName`, line 88 `const name`, `if (!name) continue`), so a code-only-precision entry carrying only `id` (`BR-n`) is silently skipped. Add a local `ruleKey(entry)` helper (same fallback as `merge-rules.mjs`) and use it for the new-entry key at line 81 and the walk at line 88. `priorByName`/`canonicalName` already round-trip (a code-only row's `canonicalName` becomes its `id`), so the retire-walk (line 136) stays consistent. **In the `merge.workflow.js` inline copy** the inlined `updateRegistry` **reuses the existing inlined `ruleKey`** (already present at ~line 101 from the merge-rules inline) — add the local helper only to the lib; do **not** inline a second `ruleKey` into the workflow (a duplicate top-level `function` is invisible to selfcheck's first-match `extractFn`). [critic MED-1]
- **Accept:** a triage whose `code-only-precision` bucket holds an entry with `id: "BR-9"` and **no** `ruleName` produces a registry row with `canonicalName: "BR-9"`, `arms: "code"`. Regression test asserts `rows.some(r => r.canonicalName === 'BR-9')` — RED before the fix (row absent), GREEN after. `node scripts/selfcheck.mjs` green (inline copy synced).
- **Skill:** None (harness JS; no matching pattern skill). **TDD:** yes. **Confidence:** high.

### Step 2 — Extend the crosswalk to carry operator-declared metadata (item 2a)
- **Files:** `harness/lib/rule-crosswalk.mjs`; mirror into `harness/merge.workflow.js`; **register the new fn in `scripts/selfcheck.mjs` PAIRS**; test in `tests/unit/rule-crosswalk.test.mjs`.
- **What:** allow a crosswalk map value to be either a `string` (canonical name, as today) **or** an object `{canonical, expect?: 'overlap'|'divergent', staleSpec?: boolean}`. Update `applyCrosswalk` to resolve the canonical name from either shape (`typeof v === 'string' ? v : v?.canonical`; a defensive one-liner so an object missing `canonical` doesn't silently key by `undefined` — [critic LOW-3]). Add an exported `crosswalkExpectations(map)` returning a `Map<canonicalName, {expect?, staleSpec?}>` built from the object-valued entries — the lookup `triageRuleSets` will consult in Step 3.
- **selfcheck (HIGH-1, mandatory):** the `rule-crosswalk.mjs → merge.workflow.js` PAIR at `scripts/selfcheck.mjs:160` lists `fns: ['applyCrosswalk','reconcileRuleSets']`. Add `'crosswalkExpectations'` to that array so its inlined copy is byte-compared too — otherwise the plan's inline-sync invariant has a hole on exactly the divergence hot-path. List `scripts/selfcheck.mjs` as an edited file.
- **Accept:** string-valued entries resolve canonical names byte-identically to today (backward-compat test); an object-valued entry `{canonical:'X', expect:'divergent'}` resolves `ruleName:'X'` **and** `crosswalkExpectations` returns `X → {expect:'divergent'}`. `selfcheck` green.
- **Skill:** None. **TDD:** yes. **Confidence:** high.

### Step 3 — Divergence detector honors declared `expect`/`staleSpec`; boundary demoted to a hint (items 2b + 3)
- **Files:** `harness/lib/merge-rules.mjs`; mirror into `harness/merge.workflow.js`; tests in `tests/unit/merge-rules.test.mjs`.
- **What:** extend the import at `merge-rules.mjs:31` to `{ reconcileRuleSets, crosswalkExpectations }` ([critic LOW-1]). In `triageRuleSets`, build the expectations map from the crosswalk (Step 2's `crosswalkExpectations`) and consult it at the match point (currently line 118). Per canonical name: `expect:'overlap'` → force `overlap-confirmed` regardless of boundary; `expect:'divergent'` → force `spec-only-divergent`; **absent** → fall back to `boundaryDiverges` exactly as today (`boundaryDiverges` stays, demoted to the no-declaration hint). For the stale tag (line 133–135), add the `suspect-stale-spec` tag when the declared `staleSpec` is true **OR** the existing date-based `isStaleSpec` fires (keep `isStaleSpec` as the dormant-but-valid fallback). Correct the header comment (lines 1–7) + the `boundaryDiverges` comment (line 45–46) to describe operator-declared divergence with boundary as a corroborating hint — no more "content-keyed, granularity-tolerant" claim the exact-compare never delivered.
- **Accept:**
  - declared `expect:'divergent'` on a pair whose boundaries are string-**equal** → lands `spec-only-divergent` (RED today: boundary-equal → falsely `overlap-confirmed`);
  - declared `expect:'overlap'` on a pair whose boundaries **differ** → lands `overlap-confirmed` (RED today: → falsely `spec-only-divergent`);
  - **no** declaration → bucket is byte-identical to current behavior (backward-compat test over a differing-boundary pair and an equal-boundary pair);
  - declared `staleSpec:true` on a divergent pair → entry `tags` includes `suspect-stale-spec`.
  - **false-overlap flavor** ([critic LOW-2]): declared `expect:'divergent'` on a pair where the **code rule has no `boundary`** (the CycleTime trigger — `boundaryDiverges` returns `false` for a missing boundary, so it would else falsely `overlap-confirmed`) → lands `spec-only-divergent`.
  - `selfcheck` green.
- **Skill:** None. **TDD:** yes. **Confidence:** high.

### Step 4 — `clusterKey` layer-only fallback when `symbol` absent (item 4, LOW)
- **Files:** `harness/lib/kb-distill.mjs`; mirror into `harness/merge.workflow.js`; tests in `tests/unit/kb-distill.test.mjs`.
- **What:** `clusterKey` falls back to `canonicalName` when `symbol` is absent (line 24–26), and no stage emits `symbol`, so every rule becomes its own cluster (degenerate 1-rule-per-line distillate). Change the fallback to **layer-only** when `symbol` is absent: `symbol ? \`${symbol}|${layer}\` : \`${layer}\``. Also **drop the `?? row.canonicalName` pseudo-symbol** in the cluster object construction (line 48) and the `symbol ?? '(unnamed)'` render (line 54) for the symbol-absent branch — otherwise the renderer prints an arbitrary rule name as the cluster label ([critic LOW-4]). The symbol-less line reads `- [<layer>]: N rules — see <ledger>`, preserving the one-line-only invariant. Symbol-present clustering is unchanged (guarded by the existing `kb-distill.test.mjs` symbol-present cases).
- **Accept:** 41 rows across (say) 3 layers, none carrying `symbol` → `hotRows.length === 3` (one per layer), each `ruleCount` summing correctly — not 41. Regression test asserts the collapse. `selfcheck` green.
- **Skill:** None. **TDD:** yes. **Confidence:** high.

### Step 5 — Skill doc honesty (item 2, doc half)
- **Files:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (Merge paragraph, lines ~372–377).
- **What:** replace "Content-keyed, granularity-tolerant matching (symbol + condition content — never names or counts; many-to-one both ways)" with an honest method-level description: rules are reconciled by the human-authored crosswalk, and divergence is **operator-declared** (the crosswalk states which matched pairs agree vs diverge), with condition-boundary comparison as a **corroborating hint** — many-to-one tolerant. Adjust the `suspect-stale-spec` clause (line 376–377) to "operator-declared via the crosswalk (or derived when the code-arm KB carries an attributed-source date)". **Do not name harness files** (the skill's `## Substrate` rule: skill text never references `merge.workflow.js`/lib paths). This is a **release-surface change** → the plugin needs a version bump (Step 6).
- **Accept:** grep of the Merge paragraph shows no "granularity-tolerant" claim; the operator-declared mechanism is described; no harness filename appears in the changed lines. Per-skill + full-estate `skill-lint` exit 0.
- **Skill:** None (prose edit; lint is the gate). **TDD:** n/a. **Confidence:** high.

### Step 6 — Verify + release bump
- **Files:** `plugins/nexus/.claude-plugin/plugin.json` + `plugins/nexus/CHANGELOG.md` (via the release-plugin flow); no source.
- **What:** run the full gate — `node --test tests/unit/*.test.mjs` (all four suites green, new regression cases included), `node scripts/selfcheck.mjs` (PAIRS + all checks green), `skill-lint` on `mine-verify-cover`. Because Step 5 changed a shipped skill, bump `nexus` per the release-plugin skill (PATCH by default — a defect-fix + honest-doc pass; owner escalates if they deem the crosswalk-metadata capability a MINOR). The harness/`tests/`/`scripts/` live **outside** `plugins/**`, so they do **not** themselves force a bump — only the `mine-verify-cover` edit does. Run the bump **once, after all edits land**, in the same commit as the change (CLAUDE.md release rule). **After the bump, regenerate the omni twin** — `node scripts/gen-omni.mjs` — and commit it in `../omni` with the mirrored message per CLAUDE.md ([critic MED-2]; `selfcheck.mjs`'s `gen-omni --check` fails until the twin is regenerated, so this is not optional).
- **Accept:** all tests green; selfcheck green (incl. `gen-omni --check`); `bump-plugin.mjs --dry-run` classifies the skill change and proposes the bump; changelog entry cites this feedback file; omni twin regenerated + committed in `../omni`.
- **Skill:** `release-plugin`. **TDD:** n/a. **Confidence:** high.

## Verification (whole pass)
1. `node --test tests/unit/rules-registry.test.mjs tests/unit/rule-crosswalk.test.mjs tests/unit/merge-rules.test.mjs tests/unit/kb-distill.test.mjs` — all green, each new regression case present.
2. `node scripts/selfcheck.mjs` — green (proves all four inlined copies match their libs).
3. Backward-compat spine ([critic HIGH-2] — scoped to **triage bucketing only**): under an all-string crosswalk with **no declared `expect`**, the **five triage buckets are byte-identical** to pre-change (protects the shipped BugRatio/CycleTime/HealthScore runs and the idempotency invariant). Items 1 and 4 **intentionally** change the registry (BugRatio 41→58 rows — the dropped code-only rows now persist) and the distillate (per-rule → per-layer) toward the operator-corrected shape; that divergence is the fix, not a regression — do **not** assert byte-identity on registry/distillate.
4. `skill-lint` on `mine-verify-cover` exit 0.

## Notes for the developer
- The four lib functions to mirror into `merge.workflow.js`: `applyCrosswalk` + the new `crosswalkExpectations` (Step 2), `triageRuleSets` + `boundaryDiverges` (Step 3), `updateRegistry` (Step 1), `clusterKey` + `distillRegistry` (Step 4). Check `scripts/selfcheck.mjs` PAIRS for the exact function list it verifies per workflow.
- Keep every change **backward-compatible**: a crosswalk with only string values, and a triage with no declared `expect`, must behave exactly as today. The new behavior is opt-in via the object-valued crosswalk entries.
- `isStaleSpec` and the date-based path stay — they're dormant (no KB emits the date) but still valid; Step 3 **adds** the declared path, it doesn't remove the date path.

## Plan Review

Critic review — **code-grounded** (mandatory: this edits a shipped skill + harness a consuming repo runs). Ran against live source: all four libs traced by line anchor, the item-2/3 crosswalk→`triageRuleSets` wiring traced through `merge.workflow.js`, `selfcheck.mjs` PAIRS checked function-by-function, all four test files checked for breakage, repo-wide grep for other consumers.

Verdict: initial **NO-GO (2 HIGH, 2 MEDIUM, 4 LOW)** — all findings verified and **folded**. Two of my worst-case risks were **refuted**: the crosswalk map already reaches `triageRuleSets` (no plumbing gap), and no workflow/lib outside `merge.workflow.js` + tests consumes the changed functions (clean consumer surface).

| Finding | Resolution |
|---------|-----------|
| HIGH-1 — new `crosswalkExpectations` absent from selfcheck PAIRS | Step 2: add to `selfcheck.mjs:160` `fns`; list `selfcheck.mjs` as edited |
| HIGH-2 — Verification #3 overclaims byte-identical registry/distillate | Verification #3 rescoped to triage bucketing only; items 1/4 intentionally change registry/distillate |
| MED-1 — `ruleKey` duplication ambiguity in the workflow inline | Step 1: inlined `updateRegistry` reuses the existing inlined `ruleKey`; no second copy |
| MED-2 — omni-twin regen missing from ship | Step 6: `gen-omni.mjs` + twin commit added (selfcheck's `gen-omni --check` backstops) |
| LOW-1 — merge-rules import must add `crosswalkExpectations` | Step 3 What |
| LOW-2 — no-boundary false-overlap case untested | Step 3 accept: added the code-has-no-boundary force-divergent test |
| LOW-3 — `crosswalkExpectations` guard for object missing `canonical` | Step 2: defensive one-liner |
| LOW-4 — Step 4 must drop the `?? canonicalName` pseudo-symbol too | Step 4 What: explicit |

Core mechanisms confirmed sound against source; no missed defect class in items 1–4; every per-step acceptance asserts a mechanism (RED→GREEN / exact bucket / exact hotRows count), not a surface.
