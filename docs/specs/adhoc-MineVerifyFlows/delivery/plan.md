# Implementation Plan — adhoc-MineVerifyFlows (graduate the mine-verify-flows skill pair)

> **Provenance — as-run in the `omni` twin.** This run executed in the twin, not in nexus, and was
> ported back afterwards (`adhoc-MineVerifyFlowsPort`). Kept verbatim so it stays a true record:
> paths read `plugins/omni/…` (nexus: `plugins/nexus/…`), and the release-tooling deviation below
> is a fact about the twin — `bump-plugin.mjs` and `gen-omni.mjs` are nexus-side and do exist here.

**Status:** Approved (code-grounded critic: GO-with-fixes, all findings folded — see `## Plan Review`)
**Author:** architect · **Date:** 2026-07-13 · **Base:** `main` @ d188536 (omni 1.33.0, omni-flutter 0.3.0)
**Intent class:** Scoped (two new shipped skills + family integration + release mechanics)

## Context

Graduate the `mine-verify-flows` method proven in the OmniShelf pilot
(`adhoc-MineVerifyFlows` in the consuming repo) into this plugin repo as a skill **pair**:
the stack-neutral method in `omni`, the Dart/Flutter adapter in `omni-flutter`, mirroring the
`mine-verify-cover` / `mine-verify-cover-flutter` pair. All content is pre-decided; this plan
maps inputs → sections and fixes the mechanics. Binding inputs (all read):

| Input | Role |
|---|---|
| `…/new-repo/docs/plugin-feedback/omni-1.25.1-2026-07-12.md` **Part B (Entries 5–10)** | method-skill content (Entries 1–4 are agent feedback — OUT of scope, routed separately in nexus) |
| `…/new-repo/docs/plugin-feedback/omni-flutter-0.3.0-2026-07-12.md` (Entries 1–4) | adapter content |
| `…/new-repo/docs/specs/adhoc-MineVerifyFlows/definition/tech-spec.md` (Ready, critic-reviewed) | pipeline design + final OQ-1 (two-tier gate) |
| Reference implementation (worktree `mine-verify-spike`): `integration_test/support/{json_golden,golden_gate,scan_to_report_prelude,capture_manifest}.dart`, `integration_test/flows/*`, `docs/business-rules/flows/user-flows.md`, `delivery/spike-findings.md` | proven mechanism shapes cited as worked examples |
| `plugins/omni/skills/mine-verify-cover/references/mine-family-core.md` + sibling SKILL.mds | the family architecture the new method must join |

**Hard constraints (from the handoff, verified against inputs):**
- The stale spike wording — "exact-match, `FieldTolerance` ships unused" — must NOT appear.
  The authoritative gate answer is **two-tier**: semantic exact-match after canonicalize+scrub
  for pure-Dart-flow / SDK-stage outputs; for FFI report-stage documents, class-wide
  `**.`-suffix **exclusions** for geometry/garbage classes plus the single per-field tolerance
  `**.sfr` ε 0.005; goldens **hardware-pinned** to one device profile.
- Both SKILL.md bodies under 500 lines (lint W3 threshold).
- Lint constraints now in force (skill-lint.mjs @ main): E7 no XML-tag-shaped tokens in prose,
  **E9 no unquoted colon-space in frontmatter values**, E6 cited reference paths must exist.
- `skill-lint` run on both folders before declaring done.

## Steps

### Step 1 — Author the method skill
**File (new):** `plugins/omni/skills/mine-verify-flows/SKILL.md`
**Skill:** improve-skills (dev-repo carve-out; archetype per `references/skill-recipe.md`: heavy, but single-file — no `references/` folder v1, mirroring the graduation pair precedent)
**TDD:** no
**Confidence:** high (voice/pattern exemplars: `mine-verify-repo/SKILL.md` for the family-sibling shape, `mine-verify-cover/SKILL.md` for the method-vs-adapter split)

Frontmatter: `name: mine-verify-flows`, `user-invocable: true`, description that
(a) states unit = ONE app's user flows, (b) names the gate (golden-master JSON + sabotage
check), (c) **enumerates the adapter** (`mine-verify-flows-flutter`), (d) names the
Mine→Verify-only fallback mode, (e) contains no unquoted colon-space (E9).

**Content mapping (binding — every row must land in the named section):**

| Section | Source |
|---|---|
| Intro + family-sibling pointer (`../mine-verify-cover/references/mine-family-core.md` §The mine family) | family pattern (mine-verify-repo lines 22–27) |
| `## The pipeline` — Mine → Consolidate → Verify → Registry → Cover → Gate → Report block | tech-spec §Pipeline |
| Deliberate flow-scope deviations — sabotage check instead of mutation floor (stated honestly as weaker, a NEW flow-scope fallback, not the class-scope no-tool fallback); one-file registry; cross-layer miners (clean-room property kept = miner independence, not one-class boundary); Cover agent = the repo's integration-test owner where one exists; no Minimize v1 | tech-spec §Reuse/deviations (critic M3, L2) |
| `## Two modes` — Full vs Mine→Verify-only (flow inventory + dead-code findings, no device toolchain) | family-parallel addition (mirrors cover's Two modes; not defined by the tech-spec — declared as an authoring innovation, critic LOW-4) |
| `## The JSON golden gate` — canonicalize (recursive key-sort; arrays reordered only when registry marks them semantically-unordered, by stable key) → scrub (volatile → stable tokens `Guid_N`/`Timestamp_N`/`{Path_N}`, referential identity preserved) → compare; three verdict knobs (exact default, FieldTolerance, FieldExclusion); `**.`-suffix class-wide path grammar + exact-beats-suffix precedence; output capture is a **pre/post docs-dir diff, never a static path list** (input/output collision); golden lifecycle (generated → human-blessed once → committed; regeneration explicit, never auto-refresh); flow outputs must not depend on live API responses; **goldens are pinned to ONE reproducible hardware/profile** (generic principle here — cross-hardware ML outputs genuinely differ; the concrete device profile lives in the adapter) | tech-spec §JSON golden gate (critic M1, L4) + OQ-1 hardware-pin corollary + json_golden.dart shapes |
| `## The gate battery (flow scope)` — suite green twice + `no_flaky` + per-flow **sabotage check** (orchestrator directs one asserted golden field to be perturbed in a copy; test MUST go red; green-on-sabotage = vacuous = rejected); orchestrator computes gates from raw output, never agent self-report | tech-spec §Pipeline Gate + gate principles |
| `## Gate calibration (by class, not by knob)` — start semantic-only exact-match + class-wide exclusions; per-field tolerances the exception; every sampled tolerance bound was exceeded by run N+1, every excluded class stayed excluded; tolerance-vs-exclusion diagnosis (bounded value drift vs shape-varying/garbage; array length-mismatch short-circuits before per-element tolerance); exclude/tolerate only **observed** drift, never siblings "for safety"; worked example = FL-8 final config (semantic exact on ~189 leaf fields + class-wide `**.` exclusions for geometry/garbage + single `**.sfr` ε 0.005); affected fields **wander across subtrees run-to-run** so rules are class-wide via `**.`, per-path enumeration never converges; two-way door (tolerances re-introducible per-field) | method Entry 5 + OQ-1 final form |
| `## Cost — budget ~4 verify pairs` per newly-reached output document (one pair samples drift, doesn't bound it; four different drift surfaces observed across four pairs) | method Entry 6 |
| `## Determinism verdicts are scoped to the files actually produced` — verdict = explicit file/field inventory, never "the flow"; re-ask on every reach extension | method Entry 8 |
| `## Fixture strategy` — the only self-consistent state is state produced against this run's own configured planogram/config; before choosing a pre-recorded seed, grep the full call chain for BOTH (a) FFI/native re-entry on the seeded data and (b) entity-id joins (`firstWhere`-style) against deployment data — either alone disqualifies; catalog match (names) is necessary but not sufficient (id-space of a different planogram *version* still fails); pre-recorded seeds sound only for pure local-file flows — confirm by grepping the chain, not by a scan/non-scan label | method Entry 7 |
| `## Acceptance precision` — a deferred smoke claim must name WHICH function/seam gets its first real exercise in the deferring step's own doc; pin composed asset-key/path constants with a host-side exact-string unit test, never defer their first exercise to a device day | method Entry 9 |
| `## Stage recipes` — (1) Cover-stage scrubber MUST smoke against a real captured-output corpus, synthetic acceptance tests alone are insufficient (13-digit float fractions matched an epoch-millis pattern; base64 vectors matched a path pattern); (2) fixture triage runs a catalog-overlap grep, never ranks by frame-count/completeness alone; re-capturability is a triage dimension; (3) state the intra-miner fan-out policy in the stage prompt; (4) flow mining doubles as dead-code discovery — route by-product findings to the `docs/tech-debt/` registry (cross-ref `mine-verify-repo`); (5) critic-review the flow tech-spec against the live fixture tree, not doc-only | method Entry 10 |
| `## The flow registry` — ONE file `docs/business-rules/flows/user-flows.md` for the whole flow set (the mined unit IS the inventory); per-flow fields = family row grammar (`source`, `status`, `criticality golden/core/edge`, `last_verified`) + flow-specific (entry route, steps, decision points, outputs written with citations, scan/non-scan class, miner agreement); registry-invariants pointer to core | tech-spec §Registry (critic L1, L2) + user-flows.md shape |
| Execution topology + kickoff-checklist pointers to core §Execution topology / §kickoff checklist, with this skill's own staging line (3 miners parallel → consolidate+skeptic → Cover per selected flow) | family pattern |
| Skeptic note — flow Verify re-traces each flow through navigation/bloc code with the core **verdict grammar** CONFIRMED/WRONG/IMPRECISE (grammar only — flow-Verify is a code re-trace, NOT a consumer of the core's command-re-execution must-RUN enforcement; the carve-out is declared in the core itself, Step 3); unreachable flows are findings | tech-spec §Pipeline Verify + core §Skeptic protocol carve-out (critic MEDIUM-1) |
| `## Model` — sonnet for mechanical stages, stronger model only where judgment concentrates (the skeptic) | tech-spec §Reuse |
| `## Safety rails` — budget rail + report-on-halt pointer to core; a skipped stage is logged and reported, never a silent no-op; forbidden — Cover agent editing production source or gate infra; deleting a red test; auto-refreshing a golden on failure | tech-spec gate principles |
| `## The adapter contract` — FIVE flow-scope capabilities the stack adapter fills — (1) on-device runner that keeps outputs retrievable, (2) golden bless + pull mechanics, (3) output capture (docs-dir pre/post snapshot), (4) the golden-gate module (host-testable canonicalize→scrub→compare with the three verdicts), (5) harness bringup (fixture seeding, camera/API bypass, SDK init ordering) | tech-spec + adapter entries, generalized |
| `## What this skill does NOT do` — platform-side/post-sync verification; Maestro/Patrol/Appium; mutation-gating flow tests; class-scope rule mining (→ `mine-verify-cover`) | tech-spec §Out of scope |
| `## Relationship to other skills` — `mine-verify-flows-flutter` (adapter), `mine-verify-cover` (family head; class scope), `mine-verify-repo` (dead-code by-product consumer), `tdd` | family pattern |

**Accept:** file exists; `node plugins/omni/skills/improve-skills/scripts/skill-lint.mjs plugins/omni/skills/mine-verify-flows` exits 0 **with no W3 warning** (body at or under 500 lines is the authoring target — W3 alone does not fail lint, so it is checked explicitly; if terse authoring genuinely cannot fit, the pre-authorized fallback is a `references/` split, not a waiver — critic MEDIUM-2); `grep -c "ships unused" SKILL.md` = 0; `grep -c '\*\*\.sfr'` ≥ 1; `grep -ci "pinned"` ≥ 1 (the generic one-profile principle); `grep -c "sabotage"` ≥ 1; description names `mine-verify-flows-flutter`.

### Step 2 — Author the Flutter adapter skill
**File (new):** `plugins/omni-flutter/skills/mine-verify-flows-flutter/SKILL.md`
**Skill:** improve-skills (dev-repo carve-out)
**TDD:** no
**Confidence:** high (exemplar: `mine-verify-cover-flutter/SKILL.md` @ main)

Frontmatter: `name: mine-verify-flows-flutter`, `user-invocable: true`, description naming the
method and the 5 fills (E9-safe).

**Content mapping (binding):**

| Section | Source |
|---|---|
| Intro — adapter for `mine-verify-flows`; method owns loop/gates/registry; read it first; Mine→Verify half stack-neutral, this adapter is the Cover+Gate+device half | mirror of cover-flutter intro |
| `## The 5 capabilities, filled` table — on-device runner = `flutter drive --keep-app-running`; bless/pull = two-hop adb tar; capture = docs-dir pre/post `.json` set-diff; golden module = pure-Dart canonicalize→scrub→compare; bringup = fixture seeding + camera/API fakes + SDK init ordering | adapter Entries 1–4 |
| `## On-device runs` — `flutter test integration_test/…` uninstalls the app at teardown, destroying outputs before they can be pulled; use `flutter drive --driver=test_driver/integration_test.dart --target={flow} --keep-app-running --flavor {flavor} -d {device}` with the stock 3-line `integrationDriver()` entrypoint; `--keep-app-running` is load-bearing; flow tests stay runner-agnostic (only `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` + plain `expect()`/`print()`; never `reportData`/`callback`/`writeResponseData`) | adapter Entry 1 |
| `## Blessing a golden is a two-hop pull-then-copy` — device test runs inside the app sandbox, no path back to the host repo; bless mode writes the canonicalized+scrubbed candidate to the app's own documents dir (`files/goldens_bless_output/{flowSlug}/{file}`) and prints the exact pull path; human hop = pull via `adb exec-out run-as {appId} tar c files/goldens_bless_output -C {docsPath} \| tar x`, review, copy into repo, declare as pubspec asset, `flutter pub get`; never design bless around a direct host write; gate config (tolerances/exclusions) applies at compare time — blessed goldens need no re-bless when the config changes | adapter Entry 2 + golden_gate.dart shape |
| `## Fixture soundness — grep the Dart chain` — both greps from the method's fixture-strategy section, made concrete: (a) platform-channel/FFI methods operating on stateful native data (worked example: `assistant`, `sendPlanogram`, `processReport`, `checkShelfProductsInside`, `calcShelfFillRate`), (b) `firstWhere`/entity-id joins against seeded deployment data; two Flutter traps — (i) native init gates are often opt-in per method: a cheap-looking sync setter can skip the `checkInit` gate every other method runs, so a native-touching flow dispatches the SDK-init event before it even if the setter is never called; (ii) a `compute()`/background-isolate native call binds a separate copy of plugin static/singleton state (Dart statics are isolate-local) — an awaited `compute()` proves the spawned isolate mutated, not the caller's | adapter Entry 3 |
| `## The golden-gate module is pure Dart` — implement canonicalize→scrub→compare as a Flutter-free module (pilot shape: `canonicalizeJson` w/ opt-in `UnorderedArray(path, sortKeyField)`, `scrubJson` w/ first-seen tokens, `FieldTolerance(path, ε)`, `FieldExclusion(path)`, `**.`-suffix wildcard w/ exact-beats-suffix precedence, diff-record list output) so it is host-testable off-device; extract pure-Dart logic out of harness files importing `flutter_test`/`path_provider` into a sibling module; the gate supports three verdicts, not two; worked example = the two-tier FL-8 outcome (semantic exact + class-wide `**.` exclusions + `**.sfr` ε 0.005) — NEVER the spike's provisional exact-only wording; an excluded field is skipped before inspection, so an excluded array's length/membership drift is invisible too — exclusion is deliberate blindness, use it only on diagnosed shape-varying/garbage classes | adapter Entry 4 + json_golden.dart shapes |
| `## Goldens are hardware-pinned` — cross-hardware outputs genuinely differ (58/112 files differed across device pairs + 28 hardware-only files whose crop filenames embed confidences — figures verified against `delivery/spike-findings.md`, critic LOW-3); pin ONE profile as golden hardware (worked example: Pixel 7 Pro API 30 arm64 AVD — reproducible on Apple Silicon hosts, ~5× faster than the reference device); CI runs the same pinned profile | spike-findings.md cross-hardware section + tech-spec OQ-1 corollary |
| `## What this skill does NOT do` — own the loop/gate battery/registry (method's); widget/pixel golden tests (this gates JSON output documents); choose which flows to cover | mirror of cover-flutter |
| `## Relationship to other skills` — `mine-verify-flows` (read first), `mine-verify-cover-flutter` (class-scope sibling adapter), `figma-to-flutter` n/a — omit; `tdd` | family pattern |

**Accept:** file exists; skill-lint exits 0 with no W3 warning (same 500-line target + `references/` fallback rule as Step 1); `grep -c "keep-app-running"` ≥ 1; `grep -c "ships unused"` = 0; `grep -c '\*\*\.sfr'` ≥ 1; `grep -ci "hardware-pinned"` ≥ 1 (the concrete device-profile pin lives here); frontmatter E9-clean.

### Step 3 — Family integration sweep (the all-consumers count fix)
**Files (edit):**
- `plugins/omni/skills/mine-verify-cover/references/mine-family-core.md` — add the 8th row to §The mine family table: `mine-verify-flows | one app's user flows | code (routes/screens/blocs) + on-device output documents | sabotage check + twice-green golden gate | flow registry + golden-gated flow tests`; update line 3 "seven-member" → "eight-member" (and member enumeration), line 21 "across all seven" → "across all eight"; add one per-skill staging bullet under §Execution topology (`mine-verify-flows` — 3 clean-room flow miners in parallel, then consolidate+skeptic, then Cover per selected flow with the orchestrator computing the sabotage gate).
- `plugins/omni/skills/mine-verify-cover/SKILL.md:409` — "full 7-row family table (including …)" → "full 8-row family table (including `mine-verify-repo`, `mine-reference-model`, `mine-algorithm`, `mine-design`, and `mine-verify-flows`)".
- `plugins/omni/skills/mine-verify-repo/SKILL.md:27,232` — "all seven members" → "all eight members" (×2).
- `plugins/omni/skills/mine-design/SKILL.md:25–27` — "7-row family" → "8-row family"; "all seven members follow" → "all eight members follow".
- `plugins/omni/skills/mine-reference-model/SKILL.md:28–29,221` — same two count forms (×3 mentions).
- `plugins/omni/skills/mine-algorithm/SKILL.md:26–28` — "7-row family" → "8-row"; "all seven members follow" → "all eight"; **keep** line 23's "the **seventh mine**" (ordinal identity — mine-algorithm remains the seventh member added; mine-verify-flows is the eighth).
- `plugins/omni/skills/mine-verify-cover/references/mine-family-core.md` §Skeptic protocol closing paragraph — add one clause classifying **flow-Verify** (critic MEDIUM-1): `mine-verify-flows`' Verify stage is a **code re-trace for reachability** that reuses the CONFIRMED/WRONG/IMPRECISE verdict grammar but is **not a consumer of the command-re-execution must-RUN enforcement** — the same treatment the code-arm gets. Without this, the shared file enumerates must-RUN consumers/non-consumers for 7 members and is silently incomplete for the 8th.
**Skill:** None. **TDD:** no.

Key domain constraint: the family table's `mine-semantic-model` row notes "(ships in
omni-analytics)" — the new row needs no such note (ships in omni) but its adapter does not get
a row (adapters are not family members; `mine-verify-cover`'s adapters aren't rows either).

**Accept:** `grep -rn "seven\|7-row" plugins/omni/skills/mine-{verify-cover,verify-repo,design,reference-model,algorithm}*/ | grep -iv "seventh mine"` returns 0 hits; the family table has exactly 8 rows; §Execution topology has a `mine-verify-flows` staging bullet; §Skeptic protocol names `mine-verify-flows` in its consumer/carve-out enumeration.

### Step 4 — Release mechanics (same-commit bump, per release-plugin / ADR-9)
**Files (edit):**
- `plugins/omni/.claude-plugin/plugin.json` — version 1.33.0 → **1.34.0** (MINOR: new user-facing skill).
- `plugins/omni/CHANGELOG.md` — prepend `## [1.34.0] — 2026-07-13` entry describing the new method skill + the family-core 8th-member integration, provenance `(adhoc-MineVerifyFlows)`.
- `plugins/omni-flutter/.claude-plugin/plugin.json` — version 0.3.0 → **0.4.0** (MINOR); extend `description` to enumerate the new adapter (keep the existing mine-verify-cover + figma-to-flutter enumeration; append the flow-scope adapter clause); add keywords `mine-verify-flows`, `integration-test`, `golden-master`.
- `plugins/omni-flutter/CHANGELOG.md` — prepend `## [0.4.0] — 2026-07-13` entry.
**Skill:** release-plugin. **TDD:** no.

Documented deviation: `scripts/bump-plugin.mjs` and `scripts/gen-omni.mjs` do NOT exist in this
repo (nexus-side tooling; verified `ls scripts/` = `gen-commands.mjs` only) — the bump is applied
manually, keeping the skill's binding intent: bump + CHANGELOG **in the same commit** as the
skill files. No agents changed → no `gen-commands.mjs` run. No new plugin → ship checklist n/a.

**Accept:** both plugin.json versions updated; both CHANGELOGs have a dated top entry; omni-flutter description mentions `mine-verify-flows`; `git diff --stat` shows all four files.

### Step 5 — Gates
**Skill:** evaluate-skill (Judgment Gate); improve-skills (lint). **TDD:** no.
1. `node plugins/omni/skills/improve-skills/scripts/skill-lint.mjs plugins/omni/skills/mine-verify-flows plugins/omni-flutter/skills/mine-verify-flows-flutter plugins/omni/skills/mine-verify-cover` (the third because Step 3 edits its folder) — exit 0 required.
2. `claude plugin validate plugins/omni --strict` and `claude plugin validate plugins/omni-flutter --strict` — exit 0 required (E9 colon-space is exactly what `--strict` rejects).
3. evaluate-skill Judgment Gate on both new skills; findings → `docs/skill-evals/2026-07-13-mine-verify-flows.md` and `…-mine-verify-flows-flutter.md`; fold ACCEPT-gated fixes before commit (figma-to-flutter ADR-1 precedent).

**Accept:** all commands exit 0; two eval docs exist with verdicts; any Judgment-Gate findings folded or explicitly waived with reason.

### Step 6 — Commit (ONE commit, on main)
**Skill:** None. **TDD:** no.
Stage Steps 1–5 outputs TOGETHER (two new SKILL.mds, family-sweep edits, both plugin.jsons,
both CHANGELOGs, two eval docs) and commit as one commit on `main`:
`feat(adhoc-MineVerifyFlows): graduate mine-verify-flows method + flutter adapter (omni 1.34.0, omni-flutter 0.4.0)`.
No tag (not publishing from this repo now); no push unless the user asks.

**Accept:** `git log -1 --stat` shows all files in one commit; working tree clean (except `docs/specs/` plan artifacts, committed or not per user preference at close).

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Slug `adhoc-MineVerifyFlows` reused for the dev-repo graduation | Dev-repo convention (every recent commit is `adhoc-*`/`F{N}`); the Lane rule's adhoc-is-solo-only governs the consuming pipeline, not this marketplace repo; matching the pilot slug keeps provenance greppable | Fresh `F{N}` slug | decided |
| Count-sweep 7→8 extends to mine-verify-repo/design/reference-model/algorithm SKILL.mds | The member count is a shared fact with 12 grep-verified count-bearing mentions across 6 files; leaving siblings at "seven" ships a self-contradicting family. Word-level edits riding the same omni MINOR | Family-core-only edit (leaves 10 stale mentions) | decided |
| `mine-algorithm`'s "the **seventh mine**" self-title kept | Ordinal identity (7th member added) — remains true when an 8th joins | Renumber it | decided |
| Single-file skills, no `references/` folder v1 — with a pre-authorized fallback | Terse authoring first (mine-verify-cover fits ~15 sections in 419 lines); if the method skill genuinely cannot fit under the 500-line W3 bar, split durable material into `references/` rather than waive the target (critic MEDIUM-2); the family core is already the shared reference | Hard single-file mandate (forces a mid-authoring fork) | decided |
| Manual version bump | `bump-plugin.mjs` absent in this repo (nexus tooling); intent (same-commit bump + CHANGELOG) preserved | Skip release-plugin as inapplicable | decided |
| Adapter contract stays at FIVE capabilities (flow-flavored) | Parallel structure with the cover method aids adapter authors; the 5 method capabilities map 1:1 to the 5 adapter fills (adapter Entries 1–4 fill four of them; capability 3, output capture, is filled from the method's M1 pre/post-diff concept plus the Flutter set-diff mechanic — critic LOW-5) | Free-form adapter section | decided |

## Open Questions

None — scope, versioning, gates, and git mechanics were resolved with the user 2026-07-13
(family core + manifest; full gates; work directly on main; no tag/push).

## Plan Review

Mode: code-grounded critic (user-selected, mandatory for shared-artifact passes), run 2026-07-13.
**Verdict: GO-with-fixes** — 0 CRITICAL, 0 HIGH, 2 MEDIUM, 5 LOW; full findings persisted verbatim
at `docs/specs/adhoc-MineVerifyFlows/delivery/review-critic.md`. All findings folded:

- **MEDIUM-1** (flow-Verify vs core §Skeptic protocol undefined) → Step 3 now adds the carve-out
  clause to the family core (code re-trace, verdict grammar only, not a must-RUN consumer); the
  Step 1 skeptic-note row points at the grammar specifically.
- **MEDIUM-2** (500-line hard-accept vs single-file decision tension) → accepts now check
  "lint exit 0 with no W3 warning" explicitly (W3 alone doesn't fail lint); terse-first, with a
  pre-authorized `references/` split as the overflow fallback (Decisions row updated).
- **LOW-1** (consumer counts 11/9 → 12/10) → Decisions row corrected.
- **LOW-2** (hardware-pin accept had no method section; device-flavored) → generic one-profile
  principle added to the method's golden-gate row; the concrete device pin + its grep moved to the
  adapter's accept.
- **LOW-3** (58/112 figure traceability) → verified against `delivery/spike-findings.md`
  (cross-hardware section: 58/112 differing + 28 hardware-only files); provenance noted in the row.
- **LOW-4** (Two modes not tech-spec-sourced) → row now declares it a family-parallel authoring
  addition.
- **LOW-5** (entry→fill "1:1" overstated) → Decisions row rephrased (capabilities map 1:1; Entry
  coverage is 4-of-5 + the M1 concept).

Critic open questions resolved by the architect: skill discovery is folder-based (sibling
precedent: mine-algorithm shipped with no index registration — confirmed by its live folder-only
landing at 1.31.0); frontmatter E9 risk stays double-gated at Step 5.
