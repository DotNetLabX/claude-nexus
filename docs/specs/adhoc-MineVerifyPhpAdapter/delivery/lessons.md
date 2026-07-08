# Lessons — adhoc-MineVerifyPhpAdapter

## Architect Lessons

- **A hardcoded list's TEST FIXTURE is a wiring surface too — grep for the list, then grep for the list's test.**
  The plan correctly found `gen-omni.mjs`'s hardcoded `mirrorDir` list (grep hit) but missed
  `tests/unit/gen-omni.test.mjs`, whose sandbox seed + expected-plugins `deepEqual` break on ANY new
  plugin — a CI-breaking omission the cpp campaign already paid for in fixup commits (`3d14501`,
  `3e6cafe`). Only the code-grounded critic caught it. When a plan step edits a generator/config with
  an enumerated list, the step must also enumerate every test that asserts that list.

- **"Run the guard against the new file" is mechanically unreachable when the guard is a fixed suite.**
  `workflow-contract.test.mjs` hardcodes the workflows it covers; the plan's original Step 5 ("run it
  against cover-php.workflow.js") would have silently no-op'd and let a defect reach a paid live run.
  Plan phrasing for fixed-suite gates must be "EXTEND the suite (named edit sites), then run" — the
  acceptance is the new slice existing and passing, not the suite exiting 0.

- **"The class's narrow deps" is a claim to verify at plan time, not implementation time.** Target #2's
  import block (5 collaborators, one extending `Spatie\LaravelData\Data` with an Eloquent reference)
  contradicted the plan's "collections + Randomizer" summary — discovered only because the critic read
  the source. For any workspace-copy design, the plan must enumerate the target's full import block and
  give each collaborator a disposition (composer / copy / stub) before the step is scoped.

- **The cross-session pipeline-state false positive recurred, exactly as the cpp lesson recorded.** A
  concurrent session's `developer:analyze` state blocked this session's legitimate `plan.md` write; the
  documented shell-route workaround held (do NOT clobber the other session's state). The root-cause fix
  (per-worktree / per-session pipeline-state) is already TRACKED by the learner (CPA-11) — this is a
  second occurrence data point for that promotion.

- **Front-loading research + a repo scan before Phase-1 questions made the checkpoint cheap and the
  critic mostly a confirmer.** The two background agents (target-repo scan, cited web research) resolved
  the test-framework surprise (Pest v4, not PHPUnit) and the report-translation requirement before the
  plan was drafted; the critic's research-fidelity area came back fully clean as a result. The failures
  it did find were all in surfaces the research could not see (test fixtures, import blocks) —
  reinforcing that the research protocol and the code-grounded review are complements, not substitutes.

- **Done-check (block {1,3,4,5}): my own plan omitted the `## Decisions` section — disclosure lived
  under `## Open Questions` instead.** The four self-resolved architect calls (workspace-copy isolation,
  PHPUnit+eris test API, Docker host, timeout-as-killed) were disclosed with why + reversibility, but
  under "Defaults taken" in `## Open Questions`, not in the canonical `## Decisions` section (row set OR
  the explicit `None …` sentinel) the disclosure rule now mandates. Substance was present so this was a
  non-blocking self-attributed hygiene note, not a developer Fail — but future plans I author must carry
  the named `## Decisions` section so the done-check is a form-check, not a substance-hunt across headings.

- **Two Step-3 acceptance lines were idealized-literal, producing false "deviations" at done-check.**
  "diff of the gate-battery section is empty" and "grep confirms `model: 'sonnet'` on the agent() calls"
  are both surface-literal checks a faithful thin fork *cannot* literally satisfy (every sibling fork
  carries a sanctioned disable-regex delta; the Sonnet pin lives on the `MODEL` default, not the call
  sites). The implementation met the intent exactly and disclosed both, so they resolved as valid
  Deviated in one line each — but per create-implementation-plan's "acceptance = mechanism, not surface"
  rule, I should have written them as "gate-battery diff = only the sanctioned per-language disable-regex
  const" and "the `MODEL` default is `?? 'sonnet'` and every agent() call passes `model: MODEL`."

- **A commit-shaped acceptance line is unverifiable at a developer done-check when the plan itself
  routes the commit to the team lead.** Step 8's accept read "`git show --stat` of the ship commit
  contains all SEVEN file groups" — but the same step (:111) mandates leaving everything UNCOMMITTED for
  the code-grounded review, and the developer never commits (team lead owns the ship commit + omni
  twin). So at done-check HEAD is still the prior commit and the acceptance can only be met as a
  **working-tree-presence** check, not a `git show`. It resolved cleanly (all 7 groups present as
  `M`/`??` entries) but forced a Deviated-with-note instead of a clean Implemented. For any ship/close
  step the developer is expected to leave uncommitted, write the acceptance against the **working tree**
  (`git status --short` shows groups X..Z; grep hits in the staged files) — never against a commit the
  developer's role forbids making. (Mechanism-not-surface, applied to the commit boundary.)

## Developer Lessons

- **Step 3's L-1 acceptance grep ("`model: 'sonnet'` on the Cover + runner agent() calls") won't
  literally match the mirror pattern.** `cover-cpp.workflow.js` pins the model as
  `const MODEL = _args.model ?? 'sonnet'` (:178) and then passes `model: MODEL` on the `agent()` calls
  (:367, :370) — the literal `'sonnet'` lives only on the MODEL-default line, not the agent calls. A
  verbatim thin fork therefore satisfies the *intent* (Sonnet pin, not session-model inheritance) but a
  literal `grep "model: 'sonnet'"` over the agent calls returns nothing. When implementing Step 3, copy
  the `MODEL` default + `model: MODEL` pattern verbatim and read the acceptance as "the Sonnet pin is
  present (MODEL default) and every agent() call passes `model: MODEL`," not the literal string on the
  call sites. (Surfaced at Phase-1 analysis; non-blocking.)

- **The plan's critical path needs the Workflow runtime, which a developer subagent does not have.**
  Steps 2/6/7 run `harness/*.workflow.js` via the nexus Workflow tool (absent from the developer
  toolset — only the Chrome `shortcuts_execute` is present, unrelated). The plan already labels these
  "Owner: operator," so the clean developer block is the deterministic/offline set {1 (author + Docker
  probe), 3, 4, 5}; Steps 8–9 depend on the operator runs' outputs and must follow them. Verified the
  handoff boundary at analysis rather than discovering it mid-implementation.

- **The Windows→Linux bind-mount I/O tax makes Infection falsely time out EVERY mutant — run on the
  container's native fs.** The Step-1 probe's first pass showed 45/45 "Timed Out" (MSI 100 via
  timeouts). Root cause (diagnose skill): a bare PHPUnit run over the bind-mounted workspace was
  **9.6 s wall for 0.42 s of test logic** (~20× penalty, all `sys` time — PHP's autoloader reads
  thousands of `vendor/` files over the slow 9p/virtiofs mount). Infection spawns one PHPUnit
  subprocess **per mutant**, so every mutant blew past the 30 s per-process timeout. Fix: `cp -r /work
  /native && cd /native` before running (native run is ~0.16 s / ~2.5 s total, yielding the genuine
  21-killed/24-escaped map). A loop-free SUT can produce NO genuine timeout, which is the tell that
  100% timeouts are infrastructural. This is baked into the runner prompt, the contract, and the
  Dockerfile — but it is a general trap for any vendor-heavy interpreted-language workspace-copy harness
  on Docker Desktop for Windows.

- **Infection's `json` log encodes status as the ARRAY KEY, not a per-mutant field.** Top-level keys:
  `stats` + per-status arrays `killed`/`killedByStaticAnalysis`/`errored`/`escaped`/`timeouted`/
  `uncovered`/`syntaxErrors`/`ignored`. Each element is `{ mutator: { mutatorName, originalStartLine,
  originalFilePath, originalSourceCode, mutatedSourceCode }, diff, processOutput }` — no `status`, no
  `id`, no `location` object, line is a flat `originalStartLine`. The research had inferred keys and
  missed `killedByStaticAnalysis` + `syntaxErrors`; the probe observed them, so the translation map
  gained `killedByStaticAnalysis→Killed` and `syntaxErrors→CompileError` (critic L-2's whole point —
  translate against observed, never inferred). The single anti-fake-green invariant the seam needs is
  `mutants.length === stats.total − ignored − skipped`.

- **"Byte-identical gate battery" across forks means the gate LOGIC, with the disable regex as the one
  sanctioned per-language delta.** The plan's Step-3 acceptance ("diff of the gate-battery section vs
  cover.workflow.js is empty") is idealized: cover-cpp already reworded one error string and carries
  `CPP_DISABLE_RE`; cover-flutter carries `DART_DISABLE_RE` and INTENTIONALLY diverges its
  `mutationFloor`. The faithful reading (and what maximizes the empty-diff) is: copy the battery
  **from cover.workflow.js verbatim** (not from the sibling fork, which drifted), and adapt ONLY the
  disable-regex constant (`PHP_DISABLE_RE`, matching `@infection-ignore-all`). Measured result: a 2-line
  diff (the const + its one `charPin` reference). The translation seam lives OUTSIDE the battery (runner
  schema + prompt + a loop-body cross-check), so it never touches the diff.

- **`bump-plugin.mjs` over-bumps a BRAND-NEW plugin — correct it back to its authored initial version.**
  Running `node scripts/bump-plugin.mjs` on a ship that ADDS a new plugin (its plugin.json authored at
  `0.1.0`) classifies the new manifest as a change-vs-HEAD and proposes `0.1.0 → 0.1.1`; it also prepends
  a stub `0.1.1` CHANGELOG block that mangles the file (it lands the block ABOVE the "All notable changes"
  intro line). The tool has no per-plugin filter and cannot know `0.1.0` is the intended *initial* version.
  After applying, revert the new plugin's `version` to `0.1.0` and restore its clean CHANGELOG (keep only
  the authored `0.1.0` entry). Only the pre-existing plugin (here `nexus` for the core-skill edit) takes
  the real PATCH bump. (Step-8 handled this; the `--check` CI gate does NOT catch it — a new plugin has
  `baseV === null`, so `baseV === headV` is never true regardless of the version.)

- **A new stack plugin needs BOTH gen-omni edits, not just the `mirrorDir` the plan names.** The plan's
  Step-8 wiring named only `mirrorDir(... 'nexus-php' ... 'omni-php')` (gen-omni.mjs :96), but the
  `wantPlugins` marketplace array (:108–113) MUST also gain `{ name: 'omni-php', source: './plugins/omni-php' }`
  — otherwise the regenerated omni `marketplace.json` omits omni-php and the `gen-omni.test.mjs` :55
  deepEqual (which the plan itself mandates extending with `'omni-php'`) fails. The cpp precedent touched
  both sites; treat the mirrorDir + wantPlugins entry + the test's `before()` seed + the `deepEqual`
  extension as ONE four-part unit for every new stack plugin.

- **Shipped toolchain assets should reference the SKILL.md, not dev-repo delivery paths.** The
  `harness/php/*.template` + Dockerfile carry dev-repo references (`delivery/probe-report.md`,
  `harness/cover-php.workflow.js`, "Step-1 probe") that are stale in a shipped plugin a consumer installs.
  When copying them into `plugins/nexus-php/skills/.../toolchain/`, neutralize those comment references to
  point at the skill's own SKILL.md — comments only, every build instruction (`FROM`, `RUN`, the `^0.34`
  pin, the loggers, `timeout 30`) stays byte-identical. Mirrors the cpp toolchain's self-contained style
  (its templates carry no dev-repo paths).

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (Docker/workspace bringup guidance) and the
per-stack adapter contracts (`harness/*/cover-*-contract.md`).
**Change:** Add a "native-fs run" rule to the workspace-copy bringup: when the toolchain runs inside a
Docker container against a bind-mounted workspace on Docker Desktop for Windows/macOS, copy the workspace
into the container's native fs first (`cp -r /work /native`) for any vendor/dependency-heavy interpreted
stack (PHP, Node, Python), because per-mutant subprocess spawning multiplies the bind-mount I/O tax into
false universal timeouts.
**Evidence:** [adhoc-MineVerifyPhpAdapter] — 45/45 false timeouts, 9.6 s vs 0.16 s bare-run measurement.
(First occurrence; C++ compiled-stack did not hit it because it does not re-read a huge vendor tree per
mutant. Watch for recurrence on a Node/Python adapter before promoting.)
**Priority:** medium

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/skills/release-plugin/SKILL.md` (a "new plugin" sub-section) and/or the
create-implementation-plan skill's ship-wiring checklist.
**Change:** Codify a **new-stack-plugin ship checklist** so it stops being rediscovered per adapter:
(1) `bump-plugin.mjs` over-bumps the new plugin — after applying, revert its `version` to the authored
`0.1.0` and restore its CHANGELOG (only the pre-existing plugin takes the real bump); (2) gen-omni needs
BOTH the `mirrorDir` AND the `wantPlugins` marketplace entry; (3) `gen-omni.test.mjs` needs BOTH the
`before()` SKILL.md seed AND the expected-plugins `deepEqual` extension; (4) shipped toolchain assets
reference the SKILL.md, not dev-repo paths. Treat items 2–3 as one four-part unit.
**Evidence:** [adhoc-MineVerifyCppAdapter (needed fixup commits `3d14501`/`3e6cafe` for the
gen-omni.test.mjs seed+deepEqual), adhoc-MineVerifyPhpAdapter (bump over-bump corrected + both gen-omni
sites + test seed/deepEqual)]. Two occurrences — meets the promotion threshold.
**Priority:** high

## Reviewer Lessons

- **A new adapter's first novel gate-battery status deserves its own offline fixture, even when the
  gate logic is verbatim-shared.** PHP's `syntaxErrors → CompileError` mapping is the first time any
  fork (.NET/Flutter/C++/PHP) actually produces the `CompileError` status the shared `DENOMINATOR_STATUSES`
  exclusion has silently protected since Inc-2 — but no offline fixture (in any fork's slice) exercises
  it. "The gate math is verbatim, so it's already tested" is true for the *general* logic but not for a
  *specific status a prior fork never generated* — that combination is new and worth one small fixture.
  Generalizable check for the next adapter (Node/Python): grep the new status-map's right-hand-side
  values against every existing offline fixture's `status:` literals; any value that never appears
  anywhere in the suite is an untested translation-seam branch, not merely "already covered by shared
  code."

- **Independent re-derivation (not re-reading the developer's/architect's claim) caught nothing new
  here, but was cheap and is the right default for a "byte-identical"/"observed-not-inferred" claim.**
  Re-running the `sed`+`diff` on the gate battery and re-`JSON.parse`-ing the actual captured
  `infection-log.json` took under a minute combined and turned a trusted assertion into a verified one
  at negligible cost — worth doing whenever a plan's core selling point rests on an exact-match or
  observed-vs-inferred claim, since that is precisely where prose can quietly drift from fact.

- **A carry-over finding can be simultaneously CONFIRMED and extended.** The "cross-check is the seam's
  only anti-fake-green guard" carry-over (for the Step-8 reviewer) didn't need refuting, but investigating
  it surfaced a scoped, narrower gap (the untested `CompileError` path) worth recording as a new finding
  rather than silently folding into the confirmation. Confirm-or-refute is not binary when the carry-over
  is broad enough to have partially-tested sub-cases.

- **An independent cross-check (Codex) rated the same fact I'd already surfaced at a higher severity —
  and the merge, not either reviewer alone, produced the better call.** My cycle-1 pass rated the
  unconstrained `infection/infection: "*"` constraint a 55/100 Open Question ("probably intentional,
  given `minimum-stability: stable` + the anti-fake-green cross-check would likely catch drift as a
  HALT"). The independent cross-check rated the identical fact HIGH — same evidence, stricter risk
  tolerance for a *reproducibility* gap (a future workspace rebuild pulling a schema-shifted Infection),
  not new evidence. The merged verdict (REQUEST CHANGES) treated the stricter read as actionable, and in
  hindsight that was right: pinning to `^0.34` cost nothing and removed the ambiguity permanently, where
  leaving it at `"*"` traded a free fix for a judgment call every future reader would re-litigate. Lesson:
  when a real environment-drift risk exists but the *current* run's evidence is clean, don't round down to
  "probably fine" on that account alone — a second independent read is exactly the mechanism that catches
  an under-called risk, and a near-free fix is usually worth taking even at moderate confidence rather
  than parking it as an Open Question.

- **Re-verifying a fix means re-deriving the property the finding cared about, not re-reading the
  developer's "Verified" column.** For F2, I didn't just confirm a `CompileError`-status entry existed in
  the new fixture — I hand-traced `mutationFloor`'s filter logic against all three of the fixture's
  mutants to confirm `reachableDenominator` lands at 1 for the stated reasons (one excluded via
  `DENOMINATOR_STATUSES`, one via `expectedSurvivorLines`, one counted). A fixture can satisfy a finding's
  literal ask (an entry with the right `status` string) without the accompanying assertion proving the
  property that motivated the finding in the first place — checking both that the assertion exists AND
  that its value is mathematically inevitable given the gate logic is what makes a re-review a
  verification rather than a checklist tick.

- **A shipped SKILL.md's own two mentions of the same artifact are a cheap, high-yield cross-check —
  don't just check prose against external reports.** The Steps 8-9 code-grounded review found the landed
  test filename claim (`SKILL.md:128`, "Run artifacts") contradicted the SKILL.md's *own* workspace-layout
  claim four sections earlier (`:44`, "the Cover agent writes `<Class>HarnessTest.php` here") — an
  internal self-contradiction that external cross-referencing (`mvc-report.md`, the runner's `COVER_TEST`
  const) then confirmed was also wrong against the live artifacts. For a long, multi-section skill doc
  authored across several implementation steps, grep the doc for every mention of the same path/filename
  pattern and diff them against each other before reaching for the external source — an internal
  contradiction is often cheaper to spot than a doc-vs-code drift and just as real a finding.

- **A "trivial 4-line pure helper" fix is still a testable behavior change, and disclosing "existing
  tests stay green" is not the same claim as "the new behavior is tested."** The `classFromSource` fix
  (mine-verify.workflow.js) was correctly disclosed as a deviation with a specific, true claim — the
  `.cs` default path still derives to `'BugRatioAnalyzer'`, so no regression. But that claim is about
  *non*-regression on the OLD default path, not coverage of the NEW derivation path (a custom `src` with
  no `targetClass`) the fix exists to add. Hand-tracing confirmed the logic was correct, but "confirmed
  correct by the reviewer's hand-trace" is not the same gate as "covered by the regression suite" — worth
  distinguishing explicitly in a finding rather than letting a passing hand-trace substitute for a missing
  test.
