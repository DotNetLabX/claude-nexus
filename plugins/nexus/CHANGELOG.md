# nexus — Changelog

## [2.4.74] — 2026-10-30
- PATCH bump.
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 119788→119981 B — F318-F282RunToolFixes: the miner's Tag-scan scope names docs/specs; the violations.log row in agents-workflow states the git watcher's every-change rule

## [2.4.73] — 2026-10-30
- F315: no tracker writes around the product lane; a spawned agent is one with an agent id
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - estate raise: plugins/nexus/agents/po.md 77790→78085 B — F315: tracker-write rule in po/team-lead, publish-tickets earlier-yes rule, tracker writes.json contract, setup old-lane sub-step
  - estate raise: plugins/nexus/agents/team-lead.md 252193→252517 B — F315: tracker-write rule in po/team-lead, publish-tickets earlier-yes rule, tracker writes.json contract, setup old-lane sub-step

## [2.4.72] — 2026-10-29
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - rule (always-on prohibitions envelope — injected every session)
  - estate raise: plugins/nexus/agents/architect.md 235434→235588 B — BUG-17: per-session approval stamp — the always-on line names the new address
  - estate raise: plugins/nexus/agents/solo.md 35696→35880 B — BUG-17: per-session approval stamp — the always-on line names the new address
  - estate raise: plugins/nexus/agents/team-lead.md 252039→252193 B — BUG-17: per-session approval stamp — the always-on line names the new address
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 119711→119788 B — BUG-17: per-session approval stamp — the always-on line names the new address
  - estate raise: plugins/nexus/rules/prohibitions/prohibitions.md 3469→3496 B — BUG-17: per-session approval stamp — the always-on line names the new address

## [2.4.71] — 2026-10-29
- One full test run per feature, at close after main is merged in; tied tests at handover; a passing run on the same content closes any feature
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (implementation-format)
  - skill change (release-plugin)
  - skill change (review-format)
  - skill change (summary-format)
  - estate raise: plugins/nexus/agents/architect.md 234404→235434 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/agents/reviewer.md 31426→31913 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/agents/solo.md 35538→35696 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/agents/team-lead.md 244153→252039 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 119542→119711 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 29023→29027 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/skills/implementation-format/SKILL.md 16107→16228 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/skills/release-plugin/SKILL.md 10847→11658 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 30919→31106 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 11380→11822 B — F313: tied handover run, one complete run at close after the merge-in, BUG-79; F313 fix round 1: catch-up list from the complete run's commit, scoped commit only before a merge-in, release base read after the merge-in, release-plugin --base documented; F313 fix round 2: the close's own changes take a tied run with no commit or merge-in, the catch-up is for the default branch moving

## [2.4.70] — 2026-10-29
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 234326→234404 B — adhoc-CodexFailReason: a failed job names its cause
  - estate raise: plugins/nexus/agents/learner.md 61879→61957 B — adhoc-CodexFailReason: a failed job names its cause
  - estate raise: plugins/nexus/agents/po.md 77712→77790 B — adhoc-CodexFailReason: a failed job names its cause
  - estate raise: plugins/nexus/agents/team-lead.md 244075→244153 B — adhoc-CodexFailReason: a failed job names its cause
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 28945→29023 B — adhoc-CodexFailReason: a failed job names its cause

## [2.4.69] — 2026-10-29
- PATCH bump.
  - hook behavior/enforcement change
  - skill change (diagnose)
  - skill change (edit-shipped-plugin-skill)
  - skill change (tdd)
  - estate raise: plugins/nexus/skills/edit-shipped-plugin-skill/SKILL.md 15713→15886 B — adhoc-TddStepRunFix: skills point at the step test rule

## [2.4.68] — 2026-10-28
- F310-StepTestCap: a developer step makes at most two test runs, held by the hooks. The first runs the step's changed test files (the build they need included) within 2 minutes; only a real red is fixed, then a second run of the failed tests and any test file the fix changed, within 1 minute; a timeout or a cut is recorded, never fixed or re-run; every problem is written as a `Test problem:` line for the complete run at the end. The rule lives in one place, `developer.md` § The step test rule; the test-first and debugging skills, the plan skill, the coordinators and the shared rules point to it. The test-entry gate refuses every other developer test or build command, a declared-role suite script, a background step run, and a test command hidden in a script file (every gated seat); the verify gate runs nothing at a developer's stops; the labeller runs no two-leg check on a step run; a step run counts as close evidence only for the tests it ran. Every gear. Source: knowledge-gateway feedback `nexus-2.4.66-2026-10-28-test-runs-per-step` (F257: a step ran up to 29 test runs)
  - agent instruction/behavior change (developer, solo, team lead, architect)
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (create-implementation-plan)
  - skill change (declare-verify-roles)
  - skill change (diagnose)
  - skill change (implementation-format)
  - skill change (tdd)

## [2.4.67] — 2026-10-28
- adhoc-SalvageConfigDir: the salvage script finds a stranded subagent's transcript under any Claude profile. It searches the running session's own config folder (`CLAUDE_CONFIG_DIR`, else `~/.claude`) and the session's temp folder, skips files with no assistant text, and prefers the `subagents/agent-{id}.jsonl` transcript over the `tasks/{id}.output` pointer. The not-found message, the session-start salvage line and the team lead's recovery order now name the transcript folder, never the spawn result's `output_file`, which is routinely empty. Feedback `nexus-2.4.66-2026-10-28-salvage-ignores-claude-config-dir` (knowledge-gateway).
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - estate raise: plugins/nexus/agents/team-lead.md 244220→244403 B — adhoc-SalvageConfigDir: team-lead Relay Contract salvage step names the transcript folder, not the empty output_file

## [2.4.66] — 2026-10-27
- F309-QuestionStyleFlag, default reversed on the owner's word: `features.nexusQuestionStyle` now ships **off**, like every other feature switch. A repo gets the Nexus question shape, and the question gate's shape checks, only where it sets the switch to `true`; elsewhere agents ask in Claude Code's own style, with the recommended option first and its confidence, the owner-away hold and a gear's answers kept. A repo that relied on the shape checks sets the switch to `true`
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 42215→42218 B — F309-QuestionStyleFlag: the question-style switch ships off — the Nexus question shape applies only where nexusQuestionStyle is true

## [2.4.65] — 2026-10-27
- F309-QuestionStyleFlag: the Nexus question style is now a per-repo switch, `features.nexusQuestionStyle`, on by default. A repo that sets it to `false` gets Claude Code's own question style — the question-shaping rules and the shape checks of the question gate are off — while questions are still held when the owner is away, a gear still answers its questions, and the recommended option still leads with its confidence. Listed in the README's feature switches, the one switch that ships on
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 41608→42215 B — F309-QuestionStyleFlag: a per-repo switch, nexusQuestionStyle, turns the Nexus question shape off for Claude Code's own style

## [2.4.64] — 2026-10-27
- F308-ReadKnownSources: a known source is read where it lives, quietly — before any agent explains or decides from a design, document, picture or knowledge-base page the repo or the user names, it opens the copy on disk, or the original in its tool (Figma, Google Docs or similar), checking its tools at that moment; a summary is not the source; nothing about sources reaches the screen except one short sentence when a source cannot be opened, or one short warning when two compete — never a question; before calling something a mock or not built, the knowledge base is checked. The rule lives in `kb-navigation.md` § Known sources and reaches every agent: one line in the always-on rules (paid for by four wording trims, the kernel budget unchanged) and one line in each start-of-spawn message — the pipeline-agent message now carries this one rule alone, an exception named in the hook header, its test and the README
  - rule (always-on kernel, on-demand rule, spawn-time contract — injected at SubagentStart)

## [2.4.63] — 2026-10-26
- F303: new bug folders are named `B{N}-{Name}` (a legacy `BUG-{N}-{name}` folder stays valid, never renamed; the next bug takes the number after the highest of either form; the close's carry-over bug row is `B{N}-CarryOver`), and the owner-question check flags a bug slug written with its name; a feature's spec and rule list are read through the new `sdd-read.js` — from `definition/`, a local `sdd/` folder, or a pinned specification repository at a pushed commit — by the architect's planning gates, the critic, the team lead's critic spawns and the Codex done-check brief; a rule list mined from a local `sdd/` spec is written beside it; the `Plan:` line goes only in a development spec
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - rule (always-on kernel — injected every session)
  - skill change (create-feature-spec)
  - skill change (create-implementation-plan)

## [2.4.62] — 2026-10-26
- F307: the architect scores every developer-built step on a Fibonacci scale (1, 2, 3, 5, 8, 13, 21) in one sweep after the plan review, the cuts and the departures, written as `Effort points:` on the step; a step scored 21 that touches over about 100 files is split by area, each half ending green; the team lead starts a fresh developer at a step hand-back when the current size plus the next step's points times the feature's rate reaches the size limit (rate = growth over counted steps ÷ their points, 15k per point to start, no margin); the measured limit stays the first test for every step
  - agent instruction/behavior change
  - skill change
  - shipped command changed
  - estate raise: plugins/nexus/agents/architect.md 232460→233225 B — F307-StepEffortScores: effort scores, the sweep and the handover rule
  - estate raise: plugins/nexus/agents/team-lead.md 241618→243266 B — F307-StepEffortScores: effort scores, the sweep and the handover rule
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 39497→41612 B — F307-StepEffortScores: effort scores, the sweep and the handover rule
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 18293→18445 B — F307-StepEffortScores: effort scores, the sweep and the handover rule

## [2.4.61] — 2026-10-26
- F304: a plan step that moves, creates or deletes files gives the developer searches that also see files not yet committed, and never stages files to make a search see them; a step that waits on a long machine run says what runs and roughly how long (`Long runs:`, in both plan formats)
  - skill change
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 38907→39497 B — F304-PlanStepSizing: uncommitted-files search rule and the long-run line in the planning skill and its template
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 18129→18293 B — F304-PlanStepSizing: uncommitted-files search rule and the long-run line in the planning skill and its template

## [2.4.60] — 2026-10-26
- Every bug row a role adds to the backlog carries two fields: `Cause:` (the feature whose change introduced the defect, or unknown / outside) and `Found:` (where it was seen); the finding feature goes in Cause only when its own change caused the defect
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 232374→232460 B — adhoc-BugRowCauseFound: bug rows carry Cause and Found fields
  - estate raise: plugins/nexus/agents/team-lead.md 241371→241618 B — adhoc-BugRowCauseFound: bug rows carry Cause and Found fields
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 117356→117956 B — adhoc-BugRowCauseFound: bug rows carry Cause and Found fields

## [2.4.59] — 2026-10-26
- F292: every full run names each failed test and why, for .NET, vitest, Flutter and Node, even when cut; a .NET or Flutter timeout in a test the change did not touch no longer holds the close
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 232301→232374 B — F292-DotnetFlutterTimeouts fix round 1: the handover ladder's 'bar the unchanged re-run above' names no stack, and the cut-run clause names the record field holding the named failures
  - estate raise: plugins/nexus/agents/team-lead.md 241293→241371 B — F292-DotnetFlutterTimeouts fix round 1: the handover ladder's 'bar the unchanged re-run above' names no stack, and the cut-run clause names the record field holding the named failures
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 117317→117356 B — F292-DotnetFlutterTimeouts fix round 1: the handover ladder's 'bar the unchanged re-run above' names no stack, and the cut-run clause names the record field holding the named failures

## [2.4.58] — 2026-10-25
- F301: the plan skill's "never adapt" ban (step 5 and the template's `Never "Adapt"` rule) no longer flags a line a mapped skill itself asks the step to carry, and the critic's plan review flags a step that maps a skill whose description names such a line and leaves it out. Both are generic and name no paid part; nexus-pro 0.1.27's `adapt-suite-methods` skill is the first to use them.
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (create-implementation-plan)
  - estate raise: plugins/nexus/agents/critic.md 34703→34900 B — F301-AdaptedFromLine: adapt-suite-methods skill (nexus-pro), the plan skill's exemption clause, the critic's missing-line check
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 38750→38907 B — F301-AdaptedFromLine: adapt-suite-methods skill (nexus-pro), the plan skill's exemption clause, the critic's missing-line check
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 17972→18129 B — F301-AdaptedFromLine: adapt-suite-methods skill (nexus-pro), the plan skill's exemption clause, the critic's missing-line check

## [2.4.57] — 2026-10-25
- F298: share code as far as it naturally divides, never by force — a new `## Share by fit` section in the engineering-discipline rule (a shared part that needs a per-caller flag, type switch or mode to serve its callers is forced; warn before such a share, never rewrite or comply silently), its trigger now naming designs that share, merge or generalize code, and a matching plan-review check in the critic.
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/critic.md 34403→34703 B — F298-ShareByFit: share-by-fit rule (engineering-discipline) and its critic pointer
  - estate raise: plugins/nexus/rules/on-demand/engineering-discipline.md 3876→4649 B — F298-ShareByFit: share-by-fit rule (engineering-discipline) and its critic pointer

## [2.4.56] — 2026-10-25
- F297: a commit made by an installed plugin's own save script counts as the user's act (each push still asked), the architect may write a spec's optional technical part, and the safety check allows folders added to the session
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (create-feature-spec)
  - estate raise: plugins/nexus/agents/architect.md 231307→231977 B — F297 step 2: plugin save exception, architect technical part, voice-check skip
  - estate raise: plugins/nexus/agents/po.md 77394→77650 B — F297 step 2: plugin save exception, architect technical part, voice-check skip
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 116260→116949 B — F297 step 2: plugin save exception, architect technical part, voice-check skip
  - estate raise: plugins/nexus/skills/create-feature-spec/SKILL.md 7789→8147 B — F297 step 2: plugin save exception, architect technical part, voice-check skip
  - estate raise: plugins/nexus/skills/create-feature-spec/workflows/Template.md 8190→8516 B — F297 step 2: plugin save exception, architect technical part, voice-check skip

## [2.4.55] — 2026-10-24
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - skill change (create-architecture-doc)
  - estate raise: plugins/nexus/agents/architect.md 231100→231307 B — F295 fix round 1: the flow-atlas switch restored in the reading-order rule, the architect's planning-time digest read restored, and the map pointers inherit the switch
  - estate raise: plugins/nexus/rules/on-demand/kb-navigation.md 3388→3467 B — F295 fix round 1: the flow-atlas switch restored in the reading-order rule, the architect's planning-time digest read restored, and the map pointers inherit the switch
  - estate raise: plugins/nexus/skills/create-architecture-doc/SKILL.md 3986→4036 B — F295 fix round 1: the flow-atlas switch restored in the reading-order rule, the architect's planning-time digest read restored, and the map pointers inherit the switch

## [2.4.54] — 2026-10-24
- PATCH bump.
  - F295: the reading order is now code first, replacing the read-the-maps-first ladder. Agents find the place by
    searching the code, take the answer from the code, and read the KB, digest or registry afterwards for the why; a
    map (code graph, flow atlas, KB index) is used only when the search finds nothing, and only for a location.
  - Affected: architect, developer, solo, reviewer, `kb-navigation`, `kb-maintenance` and `create-architecture-doc`.
    The light plan no longer lets a registry row or code map stand in for reading the code.
  - Measured in the session-accuracy study (2026-10-24): maps-first never beat code search, in empty or busy sessions.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - skill change (create-architecture-doc)
  - estate raise: plugins/nexus/agents/reviewer.md 31353→31423 B — F295-TrimSessionStartLoad: code-first reading order replaces read-maps-first steps (reviewer and kb-maintenance read the registry after the code)
  - estate raise: plugins/nexus/rules/on-demand/kb-maintenance.md 7816→7861 B — F295-TrimSessionStartLoad: code-first reading order replaces read-maps-first steps (reviewer and kb-maintenance read the registry after the code)

## [2.4.53] — 2026-10-23
- PATCH bump.
  - F47-FlowAtlas: the navigation ladder gains a rung — agents read `docs/flow-atlas/` after the structural graph and before the KB — which classes run for an entry point — only where it exists and the repo's `.claude/nexus-agents.json` sets `features.flowAtlas` to `true` (off by default; README's feature switches); the five ladders (architect, developer, solo, create-architecture-doc, kb-navigation) now count five rungs.

## [2.4.52] — 2026-10-23
- Fail-fast tests, the late close (F265): the fixes its code review found after the merge. A cancelled test counts as a timeout only under a timed-out ancestor; a wrapper's red reads timeout-only only from its own `endLegs` statement, made by the one-stage `node {script}` process the runner started (now run with no shell) with no exit listener left to run; the child-call preload acts only in a real test worker, never in a fork that copied its options, and tracks promisified children; the fast and slow legs run at the same time on a split concurrency cap, every running leg tracked and ended on an interrupt; .NET and Flutter step closes time the change's own test files; `label-tests.js` runs a labelled file's two legs apart once and keeps a failed check, and a failed check takes away label coverage at close; declared reporters are kept; the ladder prose in the solo, the developer and `implementation-format` matches the rule of re-running failed tests by name. A complete run red only on timed-out tests can be cleared by running each touched timed-out test file green by name. Two HIGH edge cases closed with on the owner's ruling (BUG-81) and five MEDIUMs carried over (BUG-80)
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - skill change (declare-verify-roles, implementation-format)

## [2.4.51] — 2026-10-23
- PATCH bump.
  - skill change (questions-format)
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 33949→34137 B — adhoc-DeviationsTitle: the plan departures ask is titled Deviations

## [2.4.50] — 2026-10-23
- PATCH bump.
  - F291-DotnetTestSelection: every test runner sits behind one runner contract and loader (`lib/test-runners.js`); JavaScript stays built in, .NET and Flutter load from their plugins; a missing runner falls back to the whole declared unit with a `runner_missing` reason.
  - hook behavior/enforcement change: a named or tied .NET run reuses the last build while nothing changed (a tree-local build ledger, conservative under concurrent builds); step-close slow labels only in the step's own files; `test-time.js` prints the feature's total test and build time.
  - skill change (summary-format): the `**Tests and builds:**` line.
  - skill change (declare-verify-roles): a .NET or Flutter repo needs its language plugin.
  - estate raise: summary-format/SKILL.md 10674→11391 B, declare-verify-roles/SKILL.md 15022→15505 B — F291.

## [2.4.49] — 2026-10-22
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - skill change (create-implementation-plan)
  - estate raise: plugins/nexus/agents/critic.md 34049→34403 B — F289-ScopeTraceRules: source markers, keep-or-drop routes and plan departures
  - estate raise: plugins/nexus/agents/po.md 77243→77394 B — F289-ScopeTraceRules: source markers, keep-or-drop routes and plan departures
  - estate raise: plugins/nexus/agents/team-lead.md 240824→240969 B — F289-ScopeTraceRules: source markers, keep-or-drop routes and plan departures
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 38642→38750 B — F289-ScopeTraceRules: source markers, keep-or-drop routes and plan departures

## [2.4.48] — 2026-10-22
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (always-on kernel — injected every session)
  - rule (on-demand tier — read on trigger)
  - skill change (create-implementation-plan)
  - skill change (lessons-format)
  - skill change (review-format)
  - estate raise: plugins/nexus/agents/architect.md 225816→228411 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/critic.md 31663→32166 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/developer.md 51703→52080 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/learner.md 61104→61546 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/po.md 73881→74187 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/reviewer.md 30866→31353 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/solo.md 34113→34461 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/agents/team-lead.md 237381→238877 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/rules/agent-invocation.md 704→762 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 114979→115719 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 37821→38406 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/skills/lessons-format/SKILL.md 7141→7260 B — F288: exception pointers at flat rules
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 30677→30919 B — F288: exception pointers at flat rules

## [2.4.47] — 2026-10-22
- F283-UnattendedAsAttended: an unattended run follows the attended rules, the owner's seat taken by one away answerer; every unattended clause that checked less is removed (self-review of specs and plans, close checks recorded as debt, the skipped test declaration, Sonnet-only research, dropped Fable readers, weaker panel seats, the skipped options panel); work touching shipped or production code calls for a critic in every run; the campaign end report shows each unit's spec and plan review; campaign mining needs nexus-miner 0.1.8 (--unattended).
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 114950→114979 B — F283: one owner-away rule

## [2.4.46] — 2026-10-22
- F280-CampaignRun2Fixes: every decision a plan or a spec records carries a confidence — a confidence column in the plan's `## Decisions` row (full and light formats) and a `Confidence:` line in every `## Decisions and why` entry; an older row or entry reads as confidence missing.
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (create-feature-spec)
  - skill change (create-implementation-plan)
  - estate raise: plugins/nexus/agents/architect.md 225371→225426 B — F280 step 5: every plan decision row and spec decision entry carries a confidence
  - estate raise: plugins/nexus/skills/create-feature-spec/workflows/Template.md 6488→6699 B — F280 step 5: every plan decision row and spec decision entry carries a confidence
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 16874→17077 B — F280 step 5: every plan decision row and spec decision entry carries a confidence

## [2.4.45] — 2026-10-21
- F279-CodexServerSweep: `codex-job.js` closes the Codex servers the Codex plugin forgot (pid file gone, not in its record) whenever no Codex job runs in their workspace — at every `start`, at every confirmed-ended `collect`, and across the machine with the new `sweep` command; the recorded server stays; anything the process list cannot show for certain keeps the server; every job (labelled or not) and every close is recorded in `.claude/audit/codex-jobs.jsonl`
  - hook behavior/enforcement change

## [2.4.44] — 2026-10-21
- F278-TeamLeadCompaction: a persona is recorded from the command that sets it (`/{plugin}:{agent}`, on the prompt, synchronously), not only from a later Write of `.claude/.current-agent`, so a session that wrote that file from the shell keeps its role through a compaction; the restore finds the role file in whichever installed plugin ships it, this checkout's install first; an entry lives while its transcript changes; an unattended session whose role file cannot be read stops with a continuation note instead of asking; a helper agent's re-read no longer sends a reminder into its parent session's context (it is still counted and logged)
  - hook behavior/enforcement change

## [2.4.43] — 2026-10-20
- F273-CampaignQuickFixes2: the source-tree hash (`lib/tree-hash.js`) skips `.claude/tmp/`, a session's scratch folder, so a scratch file never makes a passing complete-run record stale
  - hook behavior/enforcement change

## [2.4.42] — 2026-10-19
- F267-MiningStageModels: every mining job runs on a model and effort from one shipped table (Opus for writers, Codex for judges, a non-Fable fallback); campaign check shows seat models, the mining table and the fit to the weekly limit; the board shows a dated limit reading
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 225168→225371 B — F267-MiningStageModels: mining job table rules (family core § Mining job models), member judge rows, campaign check/board seat and weekly-limit lines
  - estate raise: plugins/nexus/agents/learner.md 61188→61391 B — F267-MiningStageModels: mining job table rules (family core § Mining job models), member judge rows, campaign check/board seat and weekly-limit lines
  - estate raise: plugins/nexus/agents/po.md 73965→74168 B — F267-MiningStageModels: mining job table rules (family core § Mining job models), member judge rows, campaign check/board seat and weekly-limit lines
  - estate raise: plugins/nexus/agents/team-lead.md 236790→236993 B — F267-MiningStageModels: mining job table rules (family core § Mining job models), member judge rows, campaign check/board seat and weekly-limit lines
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 28576→28779 B — F267-MiningStageModels: mining job table rules (family core § Mining job models), member judge rows, campaign check/board seat and weekly-limit lines
  - estate raise: plugins/nexus/rules/on-demand/pipeline-guardrails.md 14234→14445 B — F267-MiningStageModels: mining job table rules (family core § Mining job models), member judge rows, campaign check/board seat and weekly-limit lines

## [2.4.41] — 2026-10-19
- F269-RerunFailuresAlone: a red complete run first re-runs each failed test file once, by name; a file that passes is flaky — listed in the summary, given one backlog row, and holding nothing up; only what fails again goes to a solo (a .NET project target re-runs the complete run once instead).
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - skill change (summary-format)
  - estate raise: plugins/nexus/agents/architect.md 222920→225168 B — F269-RerunFailuresAlone: a red complete run re-runs its failed tests by name once before a solo
  - estate raise: plugins/nexus/agents/team-lead.md 234225→236790 B — F269-RerunFailuresAlone: a red complete run re-runs its failed tests by name once before a solo
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 112054→113228 B — F269-RerunFailuresAlone: a red complete run re-runs its failed tests by name once before a solo
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 9893→10674 B — F269-RerunFailuresAlone: a red complete run re-runs its failed tests by name once before a solo

## [2.4.40] — 2026-10-19
- A repo that declares no complete test command (`roles.full`) is no longer forced to full checks (adhoc-NoFullSuiteLightClose, owner ruling 2026-10-19): the architect's lane pick, the gear's plan type, lowering to light, the plan-only entry and the catalogue's `build lane` and `plan only` entries drop that condition; the light close states an undeclared complete run is met — it rests on the green step runs, noted in `summary.md` — as the close gate already fails open there
  - agent instruction/behavior change
  - shipped command changed
  - skill change (questions-format)

## [2.4.39] — 2026-10-19
- Fail-fast tests (F265): every node test run gets a per-test stop — 3 s for a fast test, 30 s for one labelled slow (`testStop` in `.claude/verify.json`; the 3 s stop only where `slow.labelled: true`) — run as a fast leg and a slow leg, with a child-call preload that stops an untimed synchronous child call in the test worker; a timed-out test is recorded apart from a real failure (`timed_out`, `failed_tests`, `touched`), and one close rule (`lib/run-verdict.js`) lets a run whose only failures are timeouts in tests the change did not touch count as passing — those go to a solo after the closing commit; the step close times the step's tests and `label-tests.js` labels the ones over the slow line from the same run, the developer getting one speed-up try before a slow label with a reason; .NET and Flutter tests are timed and labelled at the step close too. The handover ladder re-runs only the failed tests by name, never the suite unchanged, at most 3 fix attempts, and the close reads that by-name evidence at every close, not only under the "once beside the reviewers" gear. Merged on the owner's word before its code review and done check (both owed)
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (declare-verify-roles, implementation-format, summary-format, tdd)

## [2.4.38] — 2026-10-18
- Skills per step (F264), behind the new `features.skillsPerStep` switch (off unless `true`): the architect writes `**Skills per step:** on` in the plan header and names every pattern skill each step's actions touch, several per step in both plan formats; the plan critic checks each step's changed files against the skills it names; the code reviewer, as primary or second reader, checks each step's code against those skills; on the light lane the line also spawns the second code reader when no step is risky; the developer opens and the done check scores each named skill. Off, every role reads a plan as before (ADR-158)
  - agent instruction/behavior change
  - shipped command changed
  - skill change (create-implementation-plan, summary-format)
  - estate raise: plugins/nexus/agents/architect.md 219767→221533 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep
  - estate raise: plugins/nexus/agents/critic.md 31180→31663 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep
  - estate raise: plugins/nexus/agents/developer.md 50829→50927 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep
  - estate raise: plugins/nexus/agents/reviewer.md 29840→30389 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 36420→37821 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 15490→16874 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 8229→8419 B — F264-SkillsPerStep: skills per step behind features.skillsPerStep

## [2.4.37] — 2026-10-18
- Verdicts in prose (F263): the interview opens with a new rule — a request for your judgement on a source (is it valid, worth building, who should build it) is answered first in prose, a verdict per item with no table, title lines, progress line or question box; the walk starts when the owner asks to shape, plan or build, each undisputed verdict standing as that fix's critique; the "No move forward" bullet binds the walk; the owner-question contract treats a choice asked in prose while shaping as a discussion turn; the architect's and PO's interview paragraphs point at it
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 219378→219767 B — F263: a request for judgement on a source is answered in prose first; brainstorm idea rounds laid out in prose (example, gain, cost) and picked by reply
  - estate raise: plugins/nexus/agents/po.md 73576→73965 B — F263: a request for judgement on a source is answered in prose first; brainstorm idea rounds laid out in prose (example, gain, cost) and picked by reply
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 39669→41608 B — F263: a request for judgement on a source is answered in prose first; brainstorm idea rounds laid out in prose (example, gain, cost) and picked by reply

## [2.4.36] — 2026-10-18
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (create-implementation-plan)
  - skill change (questions-format)
  - estate raise: plugins/nexus/agents/architect.md 213983→219378 B — F233-PlanCutCandidates: cut candidates behind the features.planCutCandidates switch - marking, reader verdicts, the keep-or-defer questions
  - estate raise: plugins/nexus/agents/critic.md 30402→31180 B — F233-PlanCutCandidates: cut candidates behind the features.planCutCandidates switch - marking, reader verdicts, the keep-or-defer questions
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 36234→36420 B — F233-PlanCutCandidates: cut candidates behind the features.planCutCandidates switch - marking, reader verdicts, the keep-or-defer questions
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 13940→15490 B — F233-PlanCutCandidates: cut candidates behind the features.planCutCandidates switch - marking, reader verdicts, the keep-or-defer questions
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 28412→30283 B — F233-PlanCutCandidates: cut candidates behind the features.planCutCandidates switch - marking, reader verdicts, the keep-or-defer questions

## [2.4.35] — 2026-10-18
- Pipeline gears (F258): a repo picks a gear — `fast`, `normal`, `quality` or `off` — with `/nexus:gear`, and the pipeline stops asking the process questions it answers (plan type, review mode, reader pair, build lane); `off` keeps every question, and a repo with no gear set behaves exactly as before. A gear also sets the fix rounds and their bar, the checker and Codex effort, the readers (`quality` adds Fable as a third reader), the test runs (`fast` runs only the tests tied to each step's change and the complete run once beside the reviewers) and the close's evidence; the team lead can run the light path under a gear. Shipped gears are fixed; `next {gear}` switches the next feature only. Known gap BUG-60: under `fast`, a red complete run whose declared command hides a wrapper behind an unquoted glob can close over a stage that never ran (ADR-156; ledger R-2026-10-18-F258A1-A6)
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (critic-calibration)
  - estate raise: plugins/nexus/agents/architect.md 213518→213983 B — F258-PipelineGears fix round 1: a gear pair below the repo's per-agent checker entry, the slug on every fast call, the close's repair rule
  - estate raise: plugins/nexus/agents/developer.md 50637→50829 B — F258-PipelineGears fix round 1: a gear pair below the repo's per-agent checker entry, the slug on every fast call, the close's repair rule
  - estate raise: plugins/nexus/agents/learner.md 61020→61188 B — F258-PipelineGears fix round 1: a gear pair below the repo's per-agent checker entry, the slug on every fast call, the close's repair rule
  - estate raise: plugins/nexus/agents/po.md 73408→73576 B — F258-PipelineGears fix round 1: a gear pair below the repo's per-agent checker entry, the slug on every fast call, the close's repair rule
  - estate raise: plugins/nexus/agents/team-lead.md 231153→231618 B — F258-PipelineGears fix round 1: a gear pair below the repo's per-agent checker entry, the slug on every fast call, the close's repair rule
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 111127→111424 B — F258-PipelineGears fix round 1: a gear pair below the repo's per-agent checker entry, the slug on every fast call, the close's repair rule

## [2.4.34] — 2026-10-17
- adhoc-CodeReviewSkillInvocable: the architect and developer instructions no longer say an agent cannot invoke Claude Code's built-in `/code-review` skill — it starts from the main session and from a spawned helper (measured on Claude Code 2.1.301). It is still never the first-round review's required mechanism; `/deep-research` and `/review` stay listed as user-invocable only.
  - agent instruction/behavior change
  - shipped command changed

## [2.4.33] — 2026-10-17
- F257-SuiteTimeWatch: a complete test run knows its usual time and waits its turn. `verify-run.js` takes the median of the last 10 passing complete runs of the same command (at least 5) as the usual time, writes one warning line while a run passes 1.5× it, and puts `usual_ms` and `slow` on the record; a slow run is never stopped. Complete runs now queue across every repo on the machine: at most `NEXUS_COMPLETE_RUNS_AT_ONCE` at once (default 2, 0 turns it off), each holding its own claim file under `~/.nexus/run-slots` with a heartbeat; a further run waits (`waited_ms`, `others` on its record), a dead claim is skipped and swept a day after it expires, a run started inside another complete run takes no turn, and a broken queue never blocks a run (`slot: "unavailable"`). The team lead's close names a slow run's ratio in its report.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - estate raise: plugins/nexus/agents/team-lead.md 221150→221365 B — F257-SuiteTimeWatch: the close names a slow complete run (team-lead.md Close Gate item 5)

## [2.4.32] — 2026-10-17
- Brainstorm one click (F255): every interview turn with the owner takes one topic and ends in one question box — a four-column topic table (Decide topics, then Read topics), a title line naming each topic's type, one Read turn for everything that asks nothing (skipped when there is none), one closing turn holding the process questions (name, review mode, plan type, Options Panel offer — at most three), and a `Step {n} of {total}` line; the question check accepts several leading recommended options in a multi-select; the end-of-turn critique check reads interview turns only and refuses a Read topic that declares a change
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (questions-format)
  - estate raise: plugins/nexus/agents/architect.md 205178→205331 B — F255 one topic per turn
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 39134→39669 B — F255 one topic per turn
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 27085→27285 B — F255 one topic per turn

## [2.4.31] — 2026-10-17
- The full test run stops at 10 minutes by default, instead of 30; a repo sets its own limit with fullLimitSeconds in .claude/verify.json, and a run cut at its limit names that setting (owner, 2026-10-17)
  - hook behavior/enforcement change
  - skill change (declare-verify-roles)
  - estate raise: plugins/nexus/skills/declare-verify-roles/SKILL.md 10755→11560 B — adhoc-FullSuiteLimitSetting: the full test run's limit becomes a repo setting, default 10 minutes (owner, 2026-10-17)

## [2.4.30] — 2026-10-17
- Unattended panels and brainstorms (F252): in a run the owner has left, the PO and the architect take hard open points to a two-voice panel and run owed brainstorms themselves, within 5 panels and 3 brainstorms per feature, every away choice recorded and listed for the owner
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 204492→205517 B — F252 unattended panels and brainstorms: the PO and the architect run panels and owed brainstorms in a run the owner has left
  - estate raise: plugins/nexus/agents/learner.md 57867→57870 B — F252 unattended panels and brainstorms: the PO and the architect run panels and owed brainstorms in a run the owner has left
  - estate raise: plugins/nexus/agents/po.md 69609→70331 B — F252 unattended panels and brainstorms: the PO and the architect run panels and owed brainstorms in a run the owner has left
  - estate raise: plugins/nexus/agents/team-lead.md 219965→221150 B — F252 unattended panels and brainstorms: the PO and the architect run panels and owed brainstorms in a run the owner has left
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 101194→103549 B — F252 unattended panels and brainstorms: the PO and the architect run panels and owed brainstorms in a run the owner has left

## [2.4.29] — 2026-10-17
- F247-TestsThroughRunnerOnly: the test-entry gate (`test-entry-gate.js`) now refuses a raw test command from a developer or solo seat in the background too, naming the runner call, and every `test-entry` line it logs carries `blocked: true` — a PreToolUse deny is honoured for a background subagent at Claude Code 2.1.301 (dropped through 2.1.273). The done check's test-entry wording follows, and the passages saying a background deny is dropped carry a dated qualifier; the other gates' background behaviour is unchanged. Limit: on a client that drops a background deny, a raw run would now go unseen.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 204418→204492 B — F247-TestsThroughRunnerOnly: the done-check sentence on a refused test-entry row, and the dated platform-version qualifier on the seven background-deny passages
  - estate raise: plugins/nexus/agents/team-lead.md 219422→219965 B — F247-TestsThroughRunnerOnly: the done-check sentence on a refused test-entry row, and the dated platform-version qualifier on the seven background-deny passages
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 100927→101194 B — F247-TestsThroughRunnerOnly: the done-check sentence on a refused test-entry row, and the dated platform-version qualifier on the seven background-deny passages

## [2.4.28] — 2026-10-17
- adhoc-SuiteNormalPriorityCap: `verify-run.js` no longer lowers a test run to below-normal priority (reverses 2.4.23's priority part). On a busy laptop a lowered suite starved its timing-dependent tests: every complete run after 2.4.23 failed (14 of 14, against about 1 in 4 before), and an alternating trial failed 2 of 2 lowered against 1 of 2 at normal. The run keeps its caller's priority; a repo that must leave room for other work caps its own parallelism in the command it declares (this repo's close suite now runs a third of the logical CPUs' test files at a time).
  - hook behavior/enforcement change

## [2.4.27] — 2026-10-17
- F256-CheckerEffortByModel: the critic and reviewer seats take their effort from the model in the seat — Sonnet `high`, Opus and Fable `xhigh`, any other model the agent file's `effort` — so 2.4.25's Sonnet-only drop to `high` no longer lowers Opus (second reader where Codex is missing) or Fable (the early stand-in for a stalled Codex). A new synchronous PreToolUse hook, `checker-effort.js` (`Agent|Task`), fills a critic or reviewer spawn's `effort` from the table when the call passes none; an explicit per-spawn effort (the light lane, an owner direction) still wins, and the light lane steps down from the table's value. It never emits a permission decision and fails open. Needs Claude Code 2.1.292 or later; probed live on 2.1.302. The "a model swap never changes effort" rule now holds outside these two seats only (ADR-154).
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 204172→204418 B — F256: checker effort by model — table section, amended effort-substitution rule
  - estate raise: plugins/nexus/agents/critic.md 30276→30402 B — F256: checker effort by model — table section, amended effort-substitution rule
  - estate raise: plugins/nexus/agents/learner.md 57745→57867 B — F256: checker effort by model — table section, amended effort-substitution rule
  - estate raise: plugins/nexus/agents/po.md 69487→69609 B — F256: checker effort by model — table section, amended effort-substitution rule
  - estate raise: plugins/nexus/agents/team-lead.md 218909→219422 B — F256: checker effort by model — table section, amended effort-substitution rule
  - estate raise: plugins/nexus/rules/on-demand/pipeline-guardrails.md 10801→13071 B — F256: checker effort by model — table section, amended effort-substitution rule

## [2.4.26] — 2026-10-17
- BUG-37-CodexJobLostWorkerTestTiming: the Codex job helper's process lookup holds on a busy machine — each lookup gets 5 seconds instead of 3, and a lookup with no answer is tried once more before it counts as no answer, so a live worker is still found and stopped. Its tests use a process id no process ever gets, so a reused id can no longer fool them. On an idle machine nothing changes.
  - hook behavior/enforcement change

## [2.4.25] — 2026-10-17
- adhoc-SonnetHighReplay: the critic and the reviewer run at `high` effort instead of `xhigh`. A blind replay of 24 past reviews (12 in this repo, 12 in a .NET service) found `high` 44% faster per review, with serious findings nearly even (62 against 66.5 of 89) and about 11 points fewer findings overall; Codex reads beside it. The light lane's one-step-lower rule now puts them at `medium`.
  - agent instruction/behavior change

## [2.4.24] — 2026-10-16
- F242-CritiqueChangeCheck: every critique on a source ends with `Change: none` or `Change: {what it adds, removes or replaces}`, and a synchronous end-of-turn check (`critique-check.js`, core `Stop` hook) refuses an architect's or PO's turn — once per owner prompt — whose `read only` topic declares a change, or whose declared changes outnumber the questions its question boxes asked; it fails open on anything it cannot read or pair. The hand-off tracker's human-wait report lets a later stop of the same prompt supersede an earlier unclosed one. Limit: a false `Change: none` is not caught.
  - hook behavior/enforcement change (new Stop hook `critique-check.js`; `handoff-tracker.js` report pairing)
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 203919→204172 B — F242-CritiqueChangeCheck: the Change line in the interview rule, the architect and PO interview sections and the brainstorm skill; the end-of-turn critique check
  - estate raise: plugins/nexus/agents/po.md 69234→69487 B — F242-CritiqueChangeCheck: the Change line in the interview rule, the architect and PO interview sections and the brainstorm skill; the end-of-turn critique check
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 100638→100927 B — F242-CritiqueChangeCheck: the Change line in the interview rule, the architect and PO interview sections and the brainstorm skill; the end-of-turn critique check
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 37036→37317 B — F242-CritiqueChangeCheck: the Change line in the interview rule, the architect and PO interview sections and the brainstorm skill; the end-of-turn critique check

## [2.4.23] — 2026-10-16
- adhoc-TestRunDetectorAndPriority: the test runner (`verify-run.js`) lowers its own priority to below normal before it starts a suite, and every test process inherits it — the machine stays responsive during a complete run at no cost in time (F244, priority part; the test-concurrency cap is not in this release). The test-run detector no longer counts a PowerShell process listing that filters or groups on a test command (`Where-Object`, `Group-Object`) as a raw test run (BUG-52).
  - hook behavior/enforcement change

## [2.4.22] — 2026-10-16
- adhoc-CritiqueChangeAsks: a critique that changes the source's fix (adds, removes or replaces any part of it) is now `your decision` — the change asked in the question box in the turn it comes up; silence or "next" adopts nothing and the source's fix stands until the owner rules. A critique that finds the fix sound is `read only`. The `read, object if needed` tag is retired (ADR-145 amended).
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 203686→203919 B — adhoc-CritiqueChangeAsks: a critique that changes a fix is asked, not settled by silence
  - estate raise: plugins/nexus/agents/po.md 68992→69234 B — adhoc-CritiqueChangeAsks: a critique that changes a fix is asked, not settled by silence
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 36824→37036 B — adhoc-CritiqueChangeAsks: a critique that changes a fix is asked, not settled by silence

## [2.4.21] — 2026-10-16
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (create-implementation-plan)
  - skill change (questions-format)
  - estate raise: plugins/nexus/agents/architect.md 200596→203686 B — F240: the plan type after the interview, the lane after the plan
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 35579→36088 B — F240: the plan type after the interview, the lane after the plan
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 13258→13585 B — F240: the plan type after the interview, the lane after the plan
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 25657→26852 B — F240: the plan type after the interview, the lane after the plan

## [2.4.20] — 2026-10-16
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (questions-format)
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 25263→25657 B — adhoc-BuildLaneSpeedLabels: build-lane options name their speed and benefit

## [2.4.19] — 2026-10-15
- Decisions and why: specs, epics and plans keep the owner's reasons; build agents follow a current entry and stop on a changed one
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - skill change (create-feature-spec)
  - skill change (create-implementation-plan)
  - skill change (questions-format)
  - estate raise: plugins/nexus/agents/architect.md 199076→200596 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/agents/critic.md 29540→30277 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/agents/developer.md 49613→49887 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/agents/po.md 66443→68992 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/agents/reviewer.md 28957→29183 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/agents/solo.md 33035→33283 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/agents/team-lead.md 218664→218909 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 97242→100638 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 36747→36824 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/skills/create-feature-spec/SKILL.md 7049→7532 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/skills/create-feature-spec/workflows/Template.md 4033→6488 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 35504→35579 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 12199→13258 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers
  - estate raise: plugins/nexus/skills/questions-format/SKILL.md 10033→10319 B — F237: Decisions and why — section, follow/stop rule, writer duties, reader pointers

## [2.4.18] — 2026-10-15
- F232-LightPlanPath: small-to-medium features take a faster light path. A light plan is short (each step an outcome and its acceptance test, a light template in create-implementation-plan) and is expanded to the full format whenever the plan is made full; the architect reads less before it (a verified registry row or a fresh code map stands in for the code); each step is rated safe or risky, by a built-in sensitive-path list (migrations, login and security, secrets, dependencies) plus judgement, and the new risk-recheck.js re-derives the risky steps from what the build changed before review; the main code reader reads the whole change while the second reader reads only the risky steps and joins only when one exists; the done check grades a light step on outcome and acceptance evidence. ADR-150; a lint pins the new contracts.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - skill change (create-implementation-plan, implementation-format, review-format, summary-format)
  - rule change (agents-workflow, codex-dispatch)
  - estate raise: plugins/nexus/agents/architect.md 193585→199076 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/agents/developer.md 48351→49613 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/agents/learner.md 57233→57745 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/agents/po.md 65931→66443 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/agents/team-lead.md 218152→218664 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 96974→97242 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 27004→27248 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/skills/create-implementation-plan/SKILL.md 32980→35504 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 10568→12199 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/skills/implementation-format/SKILL.md 14562→15118 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 27892→30281 B — F232: light plan path — light format, light reading, per-step risk and readers
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 7179→7606 B — F232: light plan path — light format, light reading, per-step risk and readers

## [2.4.17] — 2026-10-15
- F227-LaneForkCriteria: work forks between the lanes on size and shape, never on the spec. Every plan carries a Size line and every standalone plan a recommended check level (full past 8 developer-built steps or 15 files, on a protected file, with no declared complete run, or with the owner away); once the plan is approved the owner picks the lane from a ranked build-lane list, where size only orders the options and never removes one; the choice is recorded as a Build lane header line and holds to the close. A backlog feature with a plan reaches the team pipeline with or without a spec. Every summary.md carries a Mode line (team pipeline or architect-led fast lane, level, definition spec/bug/epic/ADR/plan only), and pipeline-gate refuses a summary Write without one. Solo takes work stated in one sentence and built in one pass. ADR-148.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - skill change (summary-format)
  - estate raise: plugins/nexus/agents/architect.md 193495→193585 B — F227: check level for every standalone plan, size recommends, mode line at close
  - estate raise: plugins/nexus/agents/team-lead.md 218085→218152 B — F227: check level for every standalone plan, size recommends, mode line at close
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 7089→7179 B — F227: check level for every standalone plan, size recommends, mode line at close

## [2.4.16] — 2026-10-14
- adhoc-DevRowPlanTotal: the developer's step state now records `total`, the plan's step count, so the agents list counts against the whole plan again. Since plans were cut into build slices (2.1.2), a developer's range is its slice, and the row read `step 1/4` on a 13-step plan. At a developer's start, the tracker reads the plan from the dispatch's `Plan:` path, else `docs/specs/{slug}/delivery/plan.md`, under its `Tree:` when one is named. It takes the plan's highest step number, so close-owned steps count too and the total matches the plan the reader opens. When no plan is found, nothing is recorded and the row reads as before.
  - hook behavior/enforcement change

## [2.4.15] — 2026-10-14
- adhoc-PlanOnlyReplanRule: a plan-only plan is no longer told to re-plan for the full pipeline because it has more than 8 steps. The build-lane question now recommends the check level its `**Lane:**` header names, whatever its size — full checks give a large plan the pipeline's review rounds, and build slices give each part a fresh developer. Re-planning is still recommended where the plan declares a developer split, which the fast lane never builds. The 8-step rule had come back through the recommendation although ADR-146 rejected a step-count threshold; ADR-146 Decision (2) is amended to match.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (questions-format)
  - estate raise: plugins/nexus/agents/architect.md 191352→191455 B — adhoc-PlanOnlyReplanRule: plan-only build-lane recommendation drops the 8-step re-plan rule
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 25498→25499 B — adhoc-PlanOnlyReplanRule: plan-only build-lane recommendation drops the 8-step re-plan rule

## [2.4.14] — 2026-10-13
- F229-UnnamedSecondReaders: no pipeline agent is started with a spawn name any more, whatever its role. An agent started with a name runs as an in-process teammate, which Claude Code leaves out of its agents list — so a second reader, told until now to be started under a name, had no row there, and since Codex became the main code reviewer the plugin's own reviewer only ever ran that way. The agent's label (`dev-s1`, `critic-second`, `reviewer-second`, `solo-red1`) is the first word of the spawn's description for every role, as it already was for a developer; the rule is stated once in the spawn-tasking contract, and every dispatch line of the team lead, the architect, the PO and the learner follows it. An unnamed reviewer cannot see its own label, so the second reader's brief now always carries the line that says it is the second reader and where it writes — on the first review too, not only on a follow-up. A lint fails if an agent or rule file tells a coordinator to name a spawn again.

## [2.4.13] — 2026-10-13
- F226-CampaignTrialFixes: a Codex job a later session can find — review and done-check jobs start with a label the helper records (`codex-job.js start --label`, `jobs --label`), and a session missing a round's record looks it up before starting any reader, so a relaunch collects or falls back instead of starting a second job; the owner-away mark is written with the Write tool
  - hook behavior/enforcement change

## [2.4.12] — 2026-10-12
- adhoc-InterviewAsksOwner: an architect or PO handed a source asks first, in the question box, what only the owner can decide — an owner-only decision and the persona's own questions are topics tagged `your decision`, taken ahead of the critiques, so the first turn ends with the box whenever there is one; one line under the topic list says the conversation is the interview; an answer stays prose. "No move forward while a fix is uncritiqued" bars a build, a name, an intake or a plan, not a question. Applies `nexus-2.4.10-2026-10-12#1`.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 189022→190007 B — adhoc-InterviewAsksOwner: what only the owner can decide is asked first, in the question box; the persona's own questions are topics; one line says the conversation is the interview
  - estate raise: plugins/nexus/agents/po.md 63839→64686 B — adhoc-InterviewAsksOwner: what only the owner can decide is asked first, in the question box; the persona's own questions are topics; one line says the conversation is the interview
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 35053→36747 B — adhoc-InterviewAsksOwner: what only the owner can decide is asked first, in the question box; the persona's own questions are topics; one line says the conversation is the interview

## [2.4.11] — 2026-10-12
- BUG-35-CodexJobQueuedForever: a Codex job no longer stays `queued` with no process behind it. The Codex plugin starts its background worker before it saves the job, and a worker that read first exited; the job helper now makes the worker wait for its launcher (a new `codex-worker-wait.js`, loaded through `NODE_OPTIONS` on the start call only). A worker lost all the same is read as `failed` at once by `wait` and `collect`, in place of a 6-minute stall, and the stall check is unchanged. A shell without `CLAUDE_PLUGIN_DATA` (the PowerShell tool) is given the Codex plugin's data folder, so a job started from one shell is found from the other.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 188661→189022 B — BUG-35: the Codex job helper's lost-worker reading and its one job folder, two sentences in the Codex dispatch rule and its generated copies
  - estate raise: plugins/nexus/agents/learner.md 55627→55988 B — BUG-35: the Codex job helper's lost-worker reading and its one job folder, two sentences in the Codex dispatch rule and its generated copies
  - estate raise: plugins/nexus/agents/po.md 63478→63839 B — BUG-35: the Codex job helper's lost-worker reading and its one job folder, two sentences in the Codex dispatch rule and its generated copies
  - estate raise: plugins/nexus/agents/team-lead.md 216197→216558 B — BUG-35: the Codex job helper's lost-worker reading and its one job folder, two sentences in the Codex dispatch rule and its generated copies
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 25784→26145 B — BUG-35: the Codex job helper's lost-worker reading and its one job folder, two sentences in the Codex dispatch rule and its generated copies

## [2.4.10] — 2026-10-12
- adhoc-TopicTitleLine: an interview topic now opens on a bold line of its own carrying the topic's number, its title and the owner's part, and the topic's text begins below it — the owner found the part hard to spot inside the prose. Stated once in the core interview rule; the architect's and the PO's interview paragraphs carry the same words. The parts, the index line and the closing topic line are unchanged.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 188471→188661 B — adhoc-TopicTitleLine: the topic title line carries the owner's part
  - estate raise: plugins/nexus/agents/po.md 63287→63478 B — adhoc-TopicTitleLine: the topic title line carries the owner's part
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 34903→35053 B — adhoc-TopicTitleLine: the topic title line carries the owner's part

## [2.4.9] — 2026-10-12
- A plan-only definition takes lighter or full checks, picked by the architect from the finished plan (the repo's `fullChecks` path list in `.claude/nexus-agents.json`) before its review; the intake question (`plan only`) settles the definition only; the build-lane question offers both levels and the owner may overrule there (F224, ADR-146).
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - skill change (create-implementation-plan)
  - skill change (questions-format)
  - skill change (summary-format)
  - estate raise: plugins/nexus/agents/architect.md 185177→188471 B — F224: plan-only definition section, build-lane full option
  - estate raise: plugins/nexus/skills/create-implementation-plan/references/plan-template.md 10014→10198 B — F224: plan-only definition section, build-lane full option
  - estate raise: plugins/nexus/skills/questions-format/references/standard-questions.md 25042→25498 B — F224: plan-only definition section, build-lane full option
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 6730→6837 B — F224: plan-only definition section, build-lane full option

## [2.4.8] — 2026-10-12
- Codex reads unattended runs too; a Codex job with no log line for 6 minutes is cut; Fable replaces only a Codex down in its first 6 minutes; a repo can name Codex as its done-check reader (jobs.doneCheck: codex); the stop at the limit is judged by whether the job is alive; a review job's limit waits for the round's other readers. The usage record (nexus-pro) reads the new Codex done-check brief in this same release (ADR-136).
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (review-format)
  - skill change (summary-format)
  - estate raise: plugins/nexus/agents/architect.md 172555→185177 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/agents/learner.md 48840→55627 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/agents/po.md 56500→63287 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/agents/team-lead.md 203037→216197 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 96043→96707 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 13799→25784 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/rules/on-demand/pipeline-guardrails.md 9918→10801 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 27159→27892 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 6608→6730 B — F209-CodexUnattendedAndDoneCheck: new codex-dispatch § Done check, the stall check, the early window, the late rule and the round-wide limit (generated into architect/team-lead/po/learner and their commands); Codex in unattended runs (agents-workflow, guardrails, research); the Codex done-check block in review-format/summary-format

## [2.4.7] — 2026-10-11
- F222-OwnerPartPerTopic: on a source, every interview topic opens with what the owner has to do with it — `read only`, `read, object if needed` or `your decision`, chosen by one test (does the owner's silence settle it?); the short opening topic list starts with an index-only line; and the bold closing topic line names the topics that need a reply (`reply needed on: …`, or `nothing — say next`). From agentic-content's feedback `nexus-2.4.5-2026-10-11` (ADR-145).
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - estate raise: plugins/nexus/agents/architect.md 172189→172555 B — F222 fix round 1
  - estate raise: plugins/nexus/agents/po.md 56133→56500 B — F222 fix round 1
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 33741→34903 B — F222 fix round 1

## [2.4.6] — 2026-10-11
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (review-format)
  - estate raise: plugins/nexus/agents/architect.md 167800→172189 B — F221-FasterFixRounds: the fix round starts on the first findings in; a MEDIUM/LOW-only round is never re-read (gate check 8)
  - estate raise: plugins/nexus/agents/developer.md 47910→48351 B — F221-FasterFixRounds: the fix round starts on the first findings in; a MEDIUM/LOW-only round is never re-read (gate check 8)
  - estate raise: plugins/nexus/agents/team-lead.md 197558→203037 B — F221-FasterFixRounds: the fix round starts on the first findings in; a MEDIUM/LOW-only round is never re-read (gate check 8)
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 92413→96043 B — F221-FasterFixRounds: the fix round starts on the first findings in; a MEDIUM/LOW-only round is never re-read (gate check 8)
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 13688→13799 B — F221-FasterFixRounds: the fix round starts on the first findings in; a MEDIUM/LOW-only round is never re-read (gate check 8)
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 25971→27159 B — F221-FasterFixRounds: the fix round starts on the first findings in; a MEDIUM/LOW-only round is never re-read (gate check 8)

## [2.4.5] — 2026-10-11
- F218-InterviewCritique: an architect or PO handed a source critiques every fix it proposes — what holds, the hole, the alternative, a confidence — starting in the first turn, takes up at most three topics a turn, ends every turn on the source with a bold topic line counting what follows, and proposes no build, feature name, intake or plan until every fix is critiqued. The rules sit in the architect's and the PO's persona files, where they are always read; the interview rule keeps the full form. The post-analysis checkpoint asks at most three questions a turn. Replay evidence: docs/evidence/2026-10-11-interview-critique-replay.md (ADR-142).
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - owner-set to patch (--tier)
  - estate raise: plugins/nexus/agents/architect.md 167588→167800 B — F218: critique first, three topics a turn, rules in the persona files
  - estate raise: plugins/nexus/agents/po.md 56022→56133 B — F218: critique first, three topics a turn, rules in the persona files

## [2.4.4] — 2026-10-11
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - skill change (review-format)
  - estate raise: plugins/nexus/agents/architect.md 165620→166628 B — F220-ReviewTestRuns: reviewers cite the run record; no rerun after a fix round
  - estate raise: plugins/nexus/agents/reviewer.md 27058→28857 B — F220-ReviewTestRuns: reviewers cite the run record; no rerun after a fix round
  - estate raise: plugins/nexus/agents/team-lead.md 196224→197558 B — F220-ReviewTestRuns: reviewers cite the run record; no rerun after a fix round
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 13054→13688 B — F220-ReviewTestRuns: reviewers cite the run record; no rerun after a fix round
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 25275→25971 B — F220-ReviewTestRuns: reviewers cite the run record; no rerun after a fix round

## [2.4.3] — 2026-10-11
- adhoc-TreeHashClaudeDir: the source-tree hash a test record carries now counts everything under `.claude/` except what the pipeline itself writes there (audit logs, the review queue, the state and stamp files, the test-times record), so a project that keeps code in `.claude/` can no longer close on a test record made before its last edit there.
  - hook behavior/enforcement change

## [2.4.2] — 2026-10-11
- F207-SoloFirstForBugs: a failing test or a bug met during a run goes to a spawned solo first - it fixes what fits its size rule and hands the rest to the architect with its diagnosis (ADR-137). The round-less follow-up reviews it adds (Solo fix {n}, Hand-up {n}) are read by the usage report from nexus-pro 0.1.3.
  - agent instruction/behavior change
  - shipped command changed
  - rule (on-demand tier — read on trigger)
  - skill change (implementation-format)
  - skill change (review-format)
  - estate raise: plugins/nexus/agents/architect.md 159268→165620 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/agents/developer.md 45663→47910 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/agents/reviewer.md 26306→27058 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/agents/solo.md 27651→32909 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/agents/team-lead.md 185463→196224 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/rules/on-demand/agents-workflow.md 90982→92413 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/rules/on-demand/codex-dispatch.md 12709→13054 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/skills/implementation-format/SKILL.md 9542→14562 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)
  - estate raise: plugins/nexus/skills/review-format/SKILL.md 23861→25275 B — F207-SoloFirstForBugs: solo first for failing tests and bugs inside a run (ADR-137)

## [2.4.1] — 2026-10-11
- Asked by name for the live agent view without nexus-pro installed, the core now says it comes with nexus-pro,
  like any other paid part, instead of "not available in this version" (F197).

## [2.4.0] — 2026-10-10
- **A light lane for small changes that are not trivial** (F211, ADR-138): the architect plans with no spec, the
  developer goes straight to code under half the step limit, the full suite runs beside the done check and the code
  readers, every checker runs one effort level lower, and one fix round closes it — leftovers are listed for a Solo pass.
- **A per-repo step-test time limit, every lane:** `stepLimitSeconds` in `.claude/verify.json` (90 s when unset; limits
  the runner works out are capped at 110 s; an explicit `--timeout-ms` passes through; `--light` halves it, 15 s floor).
  Step-close records carry `limit_ms`; a cut step close reads *not finished* where `roles.full` is declared, and is
  listed under `Unfinished:` in implementation.md.
- `codex-job.js start --effort {level}` lowers Codex's effort per job; the "Agent tool takes no effort" claim is
  corrected — a per-spawn effort reaches the subagent (probed).
- MINOR bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - rule (on-demand tier — read on trigger)
  - skill change (declare-verify-roles)
  - skill change (summary-format)
  - owner-escalated to minor
  - estate raise: plugins/nexus/agents/architect.md 158797→159268 B — F211 fix round 1: step-limit clamp scope, light-lane mode phrase, handover order and targeted checks, effort and light-half wording
  - estate raise: plugins/nexus/agents/reviewer.md 26077→26306 B — F211 fix round 1: step-limit clamp scope, light-lane mode phrase, handover order and targeted checks, effort and light-half wording
  - estate raise: plugins/nexus/rules/on-demand/pipeline-guardrails.md 9816→9918 B — F211 fix round 1: step-limit clamp scope, light-lane mode phrase, handover order and targeted checks, effort and light-half wording
  - estate raise: plugins/nexus/skills/declare-verify-roles/SKILL.md 10400→10755 B — F211 fix round 1: step-limit clamp scope, light-lane mode phrase, handover order and targeted checks, effort and light-half wording
  - estate raise: plugins/nexus/skills/summary-format/SKILL.md 6554→6608 B — F211 fix round 1: step-limit clamp scope, light-lane mode phrase, handover order and targeted checks, effort and light-half wording

## [2.3.3] — 2026-10-10
- PATCH bump.
  - rule (on-demand tier — read on trigger)
  - skill change (questions-format)
  - Owner questions are asked from the owner's side: the question says what changes for the owner, never how the agent's own mechanism works, and a word the agent coined during the run never appears in the ask — a writing rule, not checked by the question gate (F215)
  - estate raise: plugins/nexus/rules/on-demand/research-before-asking.md 29877→30700 B — F215: owner-side question rule - a coined word is banned in an owner ask
  - estate raise: plugins/nexus/skills/questions-format/references/ask-words.md 3103→3273 B — F215: owner-side question rule - a coined word is banned in an owner ask

## [2.3.2] — 2026-10-10
- PATCH bump.
  - hook behavior/enforcement change
  - `verify-run.js`: a run ended at its time limit, on output overflow or by an interrupt now ends every process its test command started, not only the shell (BUG-30, part 1)

## [2.3.1] — 2026-10-10
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - hook behavior/enforcement change
  - estate raise: plugins/nexus/agents/architect.md 153281→153744 B — F194: the rules a campaign's feature session works under, the coordinator's text, and the one passage on where access is asked
  - estate raise: plugins/nexus/agents/team-lead.md 184806→185216 B — F194: the rules a campaign's feature session works under, the coordinator's text, and the one passage on where access is asked

## [2.3.0] — 2026-10-10
- **The free core's first public release.** Nexus turns Claude Code into an engineering team: a product owner, an
  architect, a developer, a reviewer, a critic, a learner, a team lead and solo, each a separate agent.
- A feature moves from an idea to a spec, a plan, the code and an independent review. The product owner shapes it
  with you in a short interview; the spec and the plan are reviewed before a line of code is written.
- The developer builds the plan step by step with its tests; the architect's done check and the code review run
  side by side, and a finding is fixed and read again before the feature is called done.
- The team's working rules reach every session and every spawned agent through hooks, which also block
  dangerous commands and keep each role to its own files.
- What a feature teaches is kept: the learner turns repeated lessons into your project's conventions and skills.
- Stack extensions for .NET and Vue, Flutter, C++ and PHP install beside the core.
