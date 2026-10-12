# nexus — Changelog

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
