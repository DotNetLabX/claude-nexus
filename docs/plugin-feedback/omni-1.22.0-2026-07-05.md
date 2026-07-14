# Plugin Feedback — omni 1.22.0 (2026-07-05)

Source: first end-to-end pilot of `mine-verify-repo` (run `mvr-pilot-1-2026-07-04`, repo
omnishelf_flutter_app, Windows/Git Bash). Outcome: 143 mined → 83 registry rows, 0 WRONG, 0 dropped,
~2.2M subagent tokens. Full friction list: `docs/specs/adhoc-CodebaseEvaluation/delivery/mine-run/run-report.md`.

## Entry 1: lizard has no native Dart reader and silently skips .dart in directory walks

- **Suggested target:** `mine-verify-repo` → `references/metric-layer.md` §4 (Complexity).
- **Action:** Document that (a) Dart parses via the generic `CLikeReader` fallback (usable CCN, not a
  native parse), and (b) `lizard <dir>` returns **0 files for Dart** because the directory walk
  filters by known-reader extensions before the fallback applies — the working invocation is
  `lizard -f <filelist>` (explicit file names bypass the filter). Without this note, the preflight's
  "lizard present" check passes and the complexity table comes back silently empty.
- **Evidence:** metric agent verified `get_reader_for()` returns None for `.dart`; `lizard lib --csv`
  → 0 files; `-f` filelist → 1,887 rows. (`delivery/mine-run/metric-tables.md`, degradation notes.)
- **Condensed lesson:** the tool-availability preflight proves the binary runs, not that it reads the
  target language — add a one-file parse probe per stack to the preflight.

## Entry 2: graphify areas collapse to singletons on flat-package repos — define an area-expansion rule

- **Suggested target:** `mine-verify-repo` → SKILL.md, Scope stage.
- **Action:** Specify what "area" means when the community decomposition is near file-granular
  (here: 735 communities / 951 files, 86.5% singletons — 4 of the top-5 areas were single files).
  The rule this pilot improvised and validated: area = anchor file(s) + direct imports/importers +
  change-coupled files at support ≥5 from the coupling table. Worth codifying so miners across runs
  get consistent scopes.
- **Evidence:** `delivery/mine-run/scope.md` (singleton stats); all 20 area-miner prompts used the
  improvised expansion and produced verifiable scopes.
- **Condensed lesson:** community structure is repo-shape-dependent; the skill should own the
  degenerate case, not each orchestrator.

## Entry 3: the test-coverage lens over-produces per-branch rows

- **Suggested target:** `mine-verify-repo` → SKILL.md, "The four lenses" (test-coverage).
- **Action:** Add granularity guidance: one row per uncovered method/region, uncovered branches as
  sub-bullets — not one row per branch. This pilot's TC miners produced 44 rows that consolidation
  merged to 8; the extra rows cost skeptic re-execution time without adding registry value.
- **Evidence:** run-report consolidation stats (143→83; the largest merge class was TC branch rows).
- **Condensed lesson:** lcov makes branch-level facts cheap to mine and expensive to verify — cap the
  granularity at the unit a refactoring wave would actually act on.

## Entry 4: evidence-command guidance — formatter-split lines and generated files

- **Suggested target:** `mine-verify-repo` → SKILL.md C2 (finding schema / evidence).
- **Action:** Two robustness notes for evidence commands: (a) single-line anchored greps break when
  the Dart formatter splits an expression across lines — prefer file-level unanchored patterns or
  multiline-tolerant checks; (b) structural greps MUST exclude generated files (`*.g.dart`,
  `*.config.dart`, `*.freezed.dart`) or layer-edge counts inflate by an order of magnitude (raw
  re-execution gave 116/60/167 upward core edges; after exclusion, 45/7/4 — matching the graph).
  Also: extracting lcov records with `grep -A N` truncates long records — use awk record extraction;
  this caused the pilot's one refuted side-number.
- **Evidence:** `docs/tech-debt/structure-global.md` reproducibility note; run-report friction items.
- **Condensed lesson:** the skeptic gate is only as good as the evidence commands' determinism —
  bake the known traps into the schema section.

## Entry 5: subagent background-run notifications are unreliable — mandate foreground completion

- **Suggested target:** `mine-verify-repo` → SKILL.md, Execution topology (also applies to
  mine-verify-cover's topology paragraph).
- **Action:** Stage prompts should instruct agents to run measurements in the foreground (bounded
  poll loops if long) and never end their turn waiting for a background-command completion
  notification. On this platform the notification repeatedly failed to re-invoke the waiting agent —
  a Step-6 developer stranded twice on the same pattern before an explicit "poll, don't wait"
  instruction fixed it; all 23 pilot-stage prompts carried the instruction and no stage stranded.
- **Evidence:** session log 2026-07-04 (two SendMessage nudges to the stranded developer); zero
  stranding across the 23 pilot agents afterwards.
- **Condensed lesson:** treat background-completion callbacks as best-effort; completion discipline
  belongs in the stage prompt.

## Entry 6: scale datapoint — single consolidate+skeptic agent is fine at ~145 findings

- **Suggested target:** `mine-verify-repo` → SKILL.md, Execution topology (informational).
- **Action:** Record the datapoint: one Fable consolidate+skeptic handled 143 findings across 21
  files (read + merge + re-execute every evidence command + write 6 registry files + run report) in
  ~301k tokens / 52 tool calls. No sharding needed at top-N=5. Revisit sharding only for
  substantially wider runs.
- **Evidence:** stage usage stats, run `mvr-pilot-1-2026-07-04`.
- **Condensed lesson:** the singular "consolidate+skeptic agent" in the topology holds at pilot
  scale.

## Entry 7: metric layer — add an author-identity consolidation step before ownership

- **Suggested target:** `mine-verify-repo` → `references/metric-layer.md` §1/§3.
- **Action:** Before computing minor-contributor ownership, merge duplicate author identities
  (same human, multiple emails/names — here 3 people held 9 of 13 identities). A `.mailmap`-style
  map, recorded in the run report. Without it the ownership signal fragments and minor-contributor
  flags fire falsely.
- **Evidence:** `delivery/preflight-report.md` (identity map); ownership tables built on the merged
  identities reproduced cleanly.
- **Condensed lesson:** ownership is the strongest validated signal — don't let identity noise
  corrupt it.

## Entry 8: skill gap — a `mine-reference-model` sibling (the "what to copy" arm)

- **Suggested target:** new skill proposal, sibling to `mine-verify-repo` in the mine family.
- **Action:** `mine-verify-repo` extracts what's *wrong* with a repo; nothing formalizes extracting
  what's *right* from a designated reference repo: layering, boundaries, error handling, DI, testing
  strategy — each pattern skeptic-verified against source (cite file:line, no invented virtues) and
  stamped with a portability verdict for the consuming stack. Output: `reference-model.md` used at
  triage as the C5 by-design adjudication reference and as the cross-stack translation dictionary.
  Optional second stage: generate/refresh project skills from the extracted patterns (this pilot's
  repo already ran that loop informally — codebase-scanner → skill-extraction → 25+ project skills).
- **Evidence:** this program needs exactly that artifact for its triage step (user reference repo:
  `dotnet-microservices`; consuming stack: Flutter). Being run ad-hoc on 2026-07-05 — that run's
  prompt + output are the design donor.
- **Condensed lesson:** triage against a reference model is a C5 contract requirement, but producing
  the reference model has no owner in the skill family.

## Entry 9: mine-verify-cover-flutter — @JsonKey-name mutants are not battery-reachable

- **Suggested target:** `mine-verify-cover-flutter` adapter (mutation tool capability).
- **Action:** Agent-driven mutation on a json_serializable model that mutates a `@JsonKey(name: '...')`
  annotation has NO effect at test time, because the generated `*.g.dart` (which holds the actual
  `_$FromJson`/`_$ToJson` key strings) is not regenerated between applying the mutant and running the
  suite. Worse, even with a per-mutant `build_runner` regen, a symmetric `fromJson(toJson())`
  round-trip test can't catch a key rename (both directions use the new name) — only a wire-key-string
  assertion (`toJson()['2d_x_position']` present) would, and that also needs the regen. The adapter
  should either (a) EXCLUDE `@JsonKey`-name mutants from generation, or (b) run `build_runner build`
  per such mutant (expensive) and pair it with wire-key assertions. Observed on target #6
  (SdkProductModel): M33/M34 survived purely as codegen-mediated inert mutants, correctly excluded
  from the reachable denominator.
- **Evidence:** `delivery/mvc-run-reports.md` Run 6; `scratchpad/classify_sdk.json` (M33/M34).
- **Condensed lesson:** for codegen'd stacks, a source mutation whose effect is mediated by a build
  step is inert unless the build step runs inside the gate loop — the adapter must own that.

## Entry 10: mine-verify-cover — hanging/crashing mutants + a durable mutation-harness contract

- **Suggested target:** `mine-verify-cover` method (the gate battery) + the flutter adapter.
- **Action:** A mutant can make the target NON-TERMINATE (infinite recursion) or CRASH the VM
  (stack-overflow), not just fail an assertion. Two hard lessons from target #5 (CustomDio): (1) a
  hanging `flutter test` leaves a grandchild Dart VM holding the stdout pipe open, so a naive
  `subprocess.run(timeout=)` NEVER returns on Windows — the harness must write output to a FILE and
  kill the whole process TREE (`taskkill /F /T`) on timeout; then "Timeout counts as a kill" actually
  works (M3 infinite-401-retry scored KILLED at 75s). (2) A crashing mutant returns a platform crash
  code (Windows `0xC0000409`) with an empty/green-less suite — treat rc∉{0, clean-fail} + not-all-green
  as KILLED-by-crash, not SUSPECT. Also: a hard external kill (or the run-time limit) bypasses the
  restore `finally` and leaves a mutant applied to prod source — the orchestrator must re-verify
  `char_pin` and restore before proceeding (happened 3× this campaign). These belong in the adapter's
  documented mutation-tool contract, not re-derived per run.
- **Evidence:** `delivery/mvc-run-reports.md` Run 5 (the operational saga); hardened
  `scratchpad/mutation_gate.py` (file output + process-tree kill).
- **Condensed lesson:** mutation harnesses must assume mutants hang and crash, kill process trees not
  processes, and re-assert the char-pin after any abnormal exit — a prompt-level "restore in finally"
  is not enough against SIGKILL.

## Entry 11: skill gap — a golden/UI "miner" sibling for the rendering layer

- **Suggested target:** new skill proposal, sibling to `mine-verify-cover` — the UI-rendering arm of the mine family.
- **Action:** `mine-verify-cover` fits logic classes (mutants over pure logic). The rendering layer (Flutter
  widgets: `App{Name}` shared widgets `app_*.dart`, `*_screen.dart`, content widgets) has little pure logic —
  its behavior IS the rendered output, so golden tests are the right net, not mutation rule tests. Nothing
  formalizes generating goldens the way `mine-verify-cover` generates rule tests. A **golden-miner** would:
  (a) read a widget + its bloc-state/props contract; (b) enumerate the distinct render states (the golden
  equivalent of "rules"); (c) generate + baseline one golden per state via the existing `new-golden-test`
  skill; (d) OPTIONAL strength gate — mutate the widget's layout/color/text and confirm a golden diff fires
  (the golden analog of the mutation floor). Value scales with UI surface (this repo: 25+ screens, ~70 shared
  widgets, a 15-screen split wave W7).
- **Caveat / decision (OPEN, not decided):** golden state-enumeration needs design-intent judgment (which
  states matter); goldens pin the CURRENT render (pins wrong UI if the current UI is wrong) and are
  env-brittle. So worth building ONLY if committing to broad UI coverage; for a bounded set, `new-golden-test`
  + developer judgment during standard dev suffices. Logged as a candidate for the operator to decide.
- **Condensed lesson:** the mine family has a code arm and a spec arm but **no rendering arm**; goldens are
  characterization-of-render and are as automatable as rule tests, with mutation-of-widget as their strength gate.
