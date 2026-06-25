# Lessons — adhoc-SpecDrivenHarnessBuild

## Architect Lessons

- **Re-verify inherited "facts" against live git, not prose.** Every spike artifact (and my first spec
  draft) stated the L272 fix was "FIXED in live KG / patched by the team." Live git says the `+ 1e-9` fix is
  an **uncommitted working-tree edit** in no commit; HEAD still carries `> 0.01`. The code-grounded critic
  caught it; a doc-only pass would not have. The whole AC-6 known-answer design (HEAD vs HEAD+operator-patch,
  with a stash/restore dance because the tree starts dirty-with-patch) hinges on this. Carried-forward
  provenance is a claim, not a fact — grep git before building acceptance on it.

- **A deterministic classifier must enumerate the shape of its own headline finding.** My first FP-labeler
  clauses (earlier-fired / actual-null-when-violation-expected) routed the *expected-null/actual-fired*
  shape — which is exactly L272 — to `needs-triage`, while AC-6 demanded it in the candidate queue. The
  labeler couldn't express the bug it exists to find. Fix: a 5-case table where case 4 (over-rejection)
  routes to the candidate queue *tagged* `needs-triage`. Nuance the critic's literal fix missed: case 4 is
  the *same* shape as the fixture artifacts, so it's a candidate needing triage, never an auto-confirmed bug.

- **Reusing an engine inverts an assumption — name the divergence, don't inherit it.** The spec direction's
  primary output is reds (ADR-D), but the code-derived Cover loop's `suiteGreen` (`failed===0`) and its
  `allGreen`-stop loop treat a red as failure. Two real divergences a developer would otherwise inherit
  wrongly: (1) the front-end needs its own control flow (reds → diff/labeler before any green gate); (2)
  Stryker requires a baseline-green suite, so the mutation pass runs over the **green subset** with reds
  quarantined. "Reuse the engine" means reuse the *helpers*, not the *stop condition*.

- **A late-rule known-answer needs a fixture that isolates that rule.** `Validate` is first-violation-wins
  over 7 ordered rules; Rule 5 (the L272 rule) only fires if rules 1-4 pass and 6-7 stay silent. An
  un-pinned fixture reds as Rule 6 (`BadReportsFilterPresent`) — reproducing an *artifact*, not the bug.
  The acceptance must assert the *specific* fired-rule identity (`actual === "NoStrayLiteralThreshold"`), not
  "any red," and pin the fixture (pre-computed stats table) so only Rule 5 can fire.

- **Code-grounded critic earned its mandate twice.** Both the spec critic and the plan critic (each reading
  live `harness/` libs + KG source + git) found defects a doc-conformance pass structurally could not — the
  uncommitted-fix provenance, the Stryker baseline-green interaction, the wrong-reason-red hole. For any
  shared-`harness/**` change or a negative/known-answer acceptance, doc-only review is not sufficient.

- **Q1↔Q2 coupling: answer the mechanism, defer the scale.** Q1's "is retrieval-at-scale in scope" half was
  really decided by Q2's appetite — at one-class scope it doesn't arise. Surfacing the coupling kept the two
  decisions coherent instead of forcing a premature embedding-index commitment (the master-gate one-way door).

- **A rule *catalog* id is not a positional *firing-order* index — and a "slice" question can be unanswerable
  because of it (Q6).** The developer's Q6 option (B) proposed a "Rule-5 slice" of the golden set, but the
  GOLD-ids (`GOLD-01..12`, a catalog) don't map 1:1 to the validator's 7-element positional `ruleOrder`: the
  L272 stray-literal rule is **GOLD-08** = **Rule 5**, and `GOLD-05` is `RelationPolicy` = Rule 2. So there is
  no clean GOLD-id slice that isolates Rule 5 — which independently sinks (B) and confirms (A) all-12. Lesson:
  when a plan carries both a catalog-id set and a positional-order set for the same class, state explicitly
  that they are different lists and which one keys fixtures/labelers (the firing order, by rule *name*), or a
  developer will key a fixture off the wrong ordinal.

- **An operator-owed live arm is `Deviated (valid reason)`, never Missing — but say so at answer time (Q7).**
  Q7's real ask was "does an offline-unit-proof + operator runbook *satisfy* the developer phase, so the
  done-check doesn't read the absent live two-arm run as incomplete?" The no-git-writes boundary makes the
  developer executing both KG git arms physically impossible, and the plan already sanctions the operator
  seam — so the right move is to pre-commit the done-check disposition in the answer itself (offline parts
  Implemented; live arm Deviated-operator-owed; a *missing runbook or stub fixture* would be Missing). Pre-
  declaring the disposition removes the ambiguity the developer flagged rather than leaving it to the Step-1
  pass. **Paid off at the done-check:** the disposition was already settled, so Step 7 resolved in one line
  instead of an escalation — but I still verified the *condition* (the runbook is present AND the fixture
  actually pins Rule 5) before granting it, because the pre-declared disposition is conditional, not a blank
  pass.

- **A pre-declared "Deviated, not Missing" disposition is conditional — verify the condition, don't rubber-
  stamp it.** At the Q7 done-check, the operator-owed live arm being `Deviated` *depended* on the two
  Missing-triggers I'd named: a present `OPERATOR ACTION REQUIRED` runbook, and a fixture that genuinely pins
  Rule 5 (not a loose fixture that reds as Rule 6 — the critic's HIGH). So the done-check still read the
  actual fixture JSON (`generatedsqlvalidator-l272-fixture.json`) and confirmed the per-rule pin rationale
  (rules 1-4/6/7 pass, `analytics_store_category_stats` in `PreComputedStatsTables`, `ReportTableRe` matches
  only `analytics_report*`) before granting Deviated. A pre-commitment that removes ambiguity must not also
  remove the verification — it changes *what* you check (the condition), not *whether* you check.

- **Skill-log scoping by token+session is what makes the skill-conformance check honest on a multi-feature
  day.** The log had 40+ entries across a week of sessions; only the two keyed to `developer` +
  `developer:implement` + this session (`995e6477…`) count. `tdd` logged once covers all four `TDD: yes`
  steps (the invocation is logged, not per-step re-invocations); the all-`None` steps (1/6/7) owe nothing.
  Without the token+session filter a stale `tdd`/`improve-skills` from another feature would have falsely
  satisfied — or a genuinely-missing invocation would have been masked. Read `.pipeline-state` for the token
  first, then filter; never eyeball by timestamp.

- **A developer-introduced 4th bucket (`both-agree`) was AC-fidelity, not a deviation to flag.** AC-4 says
  "every rule in **exactly one** axis"; a spec rule matching a code rule on the *same* boundary is an
  agreement, not a `both-divergent` divergence — labeling it `both-divergent` would make AC-4's accounting
  wrong. The developer added `both-agree` to keep the partition complete and recorded it as a Key Decision,
  with the `diffRules` unit test proving the partition. The done-check accepts a structure-completing addition
  that *serves* the AC over a literal-but-wrong three-bucket reading. Plan-literalism is not the done-check's
  job — AC-fidelity is.

## Developer Lessons

- **Phase-1 verified the plan's git/source anchors against live state before writing a line — and they all
  held.** The plan's load-bearing claims are now confirmed against live KG (2026-06-25): `Validate`'s 7-rule
  order matches `ruleOrder` exactly (`GeneratedSqlValidator.cs:215-306`); HEAD line 272 is the buggy
  `> 0.01`, the working tree is **already dirty with `+ 1e-9`** (` M`, no fix commit — `git log -S "1e-9"`
  empty), exactly the dirty-tree hazard Step 7 warns of; `PreComputedStatsTables` contains
  `analytics_store_category_stats` (the Step-7 fixture-pin table); `SurfaceProfile.Curated` is commented-out
  (the real ARTIFACT-04 case-5 signal); the golden set carries GOLD-01..12 with a `Code attestation` column
  mapping to Step 1's `codeAttestation?` field; `harness/.runs/` is git-ignored; `tests/unit/*.test.mjs` is
  in the selfcheck CI glob. The architect's "re-verify inherited facts against live git" lesson paid off — a
  doc-only analysis would have inherited the spike artifact's stale "FIXED by the KG team" row (now proven
  false by git).

- **Two genuine open forks the plan left unstated, both surfaced before any code:** (Q6) *which* golden IDs
  the target config carries — the plan's "golden ids only" is about text-exclusion, not id-count, and
  `bugratio.json`'s 3-id list is small only because that class's golden set *is* 3 ids; and (Q7) whether
  Step 7's developer deliverable is wire-the-harness + offline unit proof + an operator runbook, or
  execute-both-live-arms (physically blocked for the developer by the no-git-writes boundary + KG's dirty
  tree). Neither is a codebase fact — both change what "Step done" means, so they belong in questions.md,
  not an in-code assumption.

- **The no-git-writes boundary intersects the AC-6 acceptance shape.** Step 7's behavioral acceptance needs
  two KG git arms (HEAD vs HEAD+patch), but the developer is barred from `git stash`/`checkout`/`reset` in
  the target repo. This isn't a plan defect — the plan already marks it `OPERATOR ACTION REQUIRED` — but it
  means the developer-phase deliverable for a live-behavioral AC must resolve to "runnable + offline unit
  proof + operator runbook," with the live confirmation operator-owed. Worth confirming explicitly (Q7) so
  the done-check doesn't read the absent live run as an incomplete step.

- **A live-behavioral known-answer can often be proven OFFLINE when the mechanism is a pure predicate.** AC-6's
  L272 finding rests on `Math.Abs(literal - threshold) > 0.01` being an IEEE-754 artifact
  (`|0.86-0.85| = 0.010000000000000009 > 0.01`). That comparison is a *pure* function — so the pre-fix-reds /
  patched-green outcome is fully deterministic and provable in `node --test` by modeling the one comparison,
  with NO live .NET/Stryker run. The operator's live two-arm run then *confirms* the known answer rather than
  *discovering* it. Lesson: before writing a step off as "needs the live toolchain," check whether the
  load-bearing assertion reduces to a pure predicate you can pin offline — it shrinks the operator-owed
  surface to the genuinely-irreducible (the actual dotnet+Stryker execution) and makes the developer gate
  self-served.

- **Inline-after-define forces a deviation from strict step order — and that's correct, not a shortcut.** The
  plan numbered the pure-helper steps (2/4/5 → `spec-diff.mjs`) *after* and *before* the workflow step (3)
  that **inlines** them verbatim (the Workflow runtime can't `import` — workflow-contract.test.mjs). Building
  Step 3 before its helpers exist would inline incomplete logic. Implementing 2→4→5 (complete the TDD module)
  then 3→6→7 (the workflow that inlines the finished module) is the only correct order. When a plan's step
  numbering conflicts with a build dependency (define-before-inline, declare-before-use), follow the
  dependency and record the re-order as a deviation — every step still lands, only the sequence shifts.

- **A workflow's "testable behavior" (Step 3 `TDD: yes`) is its sandbox-run, not a .NET test.** The harness
  workflows can't be unit-tested by running them (they fire LLM agents + dotnet). The established TDD surface
  is the `workflow-contract.test.mjs` vm-sandbox: mock the 6 Workflow globals + throwing Date/Math.random
  shims, feed fixture agent-returns, and assert the orchestration runs to its return. That's where the
  reuse-boundary divergences (reds → labeler before any green gate; `suiteGreen` never over reds; green-subset
  mutation pass) are pinned offline. A new harness workflow should ship its own `*-workflow.test.mjs` sandbox
  AND join the shared no-static-import + meta-purity loop in `workflow-contract.test.mjs`.

- **The runner schema had to grow per-test `{expected, actual}` outcomes to feed the labeler.** `cover.workflow.js`'s
  runner returns only `redOnCurrent` (test name + note) — enough for the code-derived direction (a red is just
  a kept flag). The spec direction must *classify* each red into the 5-case table, which needs the observed
  Validate-return (`actual`) vs the asserted one (`expected`). So the spec-cover runner reports
  `testOutcomes: [{id, ruleName, expected, actual, errored}]`. Lesson: when reusing an engine's actor across a
  direction that asks a *different question* of the same output, the schema is the seam that has to widen —
  the actor (runner) and its clean-room boundary stay identical; only what it reports back grows.

## Reviewer Lessons

- **Inline-copy "verbatim" claims warrant a programmatic diff, not a visual scan.** The carry-over table
  flagged a sync hazard between `spec-diff.mjs` and its inline copy in `spec-cover.workflow.js`. The developer
  said "verbatim" but the `suiteGreen` formatting is different (trailing comma in multiline vs. single-line
  return). A visual scan would miss this; a `stripComments`+normalize script confirmed the function bodies are
  semantically identical. For any feature that inlines helpers verbatim, add a note to check by script, not
  eye.

- **A `codeContainsRule` auto-assignment that trusts the miner's own claim is a documented wire-time shortcut,
  not a silent mis-anchor.** The workflow sets `codeContainsRule: loc.location !== 'NO-CODE-FOUND'` — which
  means any non-FOUND location is treated as `located` at wire time, bypassing `evaluateMinerResult`'s
  `needs-triage` branch. The developer commented this explicitly. The finding is real (AC-2's mis-anchor
  protection is bypassed for this run) but is a documented design choice consistent with the operator-seam
  lineage. The reviewer's job: confirm the comment is there and the team understands the limitation, then file
  as MEDIUM rather than HIGH.

- **The FP-labeler's `isRed` guard (`errored || !sameOutcome`) should be verified to exclude `null===null`
  green tests before checking it as a logic error.** `null===null` (a spec test that expects a pass and the
  code passes) is green; `sameOutcome` handles this. Trace the guard fully before filing a false finding.
  Spend 30 seconds on the helper (`(a ?? null) === (b ?? null)`) before raising a confidence-80 concern.
