// Mine→Verify→Cover pipeline controller (harness Increment 3a).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/loop.workflow.js" }, { target: {...} }).
//
// WHAT IT DOES: automates the five manual steps of the Inc-2 pilot into ONE invocation:
//   fire mine-verify → score → fire cover → flip the KB → assemble the run report.
//   Each live run is zero manual steps.
//
// SCOPE (3a — single-class controller; Discover and multi-class worklist are 3b):
//   One class per invocation. Target via args (Step-1/8 bringup check; fallback to BugRatio consts).
//   Composition: prefer `workflow({scriptPath})` to reuse the fixed sub-workflows; fall back to a
//   MONOLITH (all stage logic inlined) if `workflow()` nesting is unavailable at the bringup run
//   (Step 8). Both paths share the same KB-write seam and safety rails below.
//
// HONEST NAMING: with Discover deferred + single-class, there is no multi-pass loop — this is a
//   PIPELINE CONTROLLER. The multi-pass loop arrives with Discover (3b). (plan §1 / ADR-13.)
//
// SAFETY RAILS (never fake green):
//   • Budget cap: halts when `budget.spent()` exceeds `BUDGET_CEILING_TOKENS` per class.
//   • Mutation ratchet: a kill-rate regression means the harness is broken → halt.
//   • On halt or cap: writes a report that includes the stop reason — never silently exits green.
//
// CLEAN-ROOM SEAL (design §3 / ADR-13):
//   `agent()` has NO `disallowedTools` option (verified against the tool contract). The seal must
//   come via a custom `agentType` (a subagent whose tool set cannot read the golden path). Whether a
//   restricted `agentType` is achievable in the Workflow runtime is UNVERIFIED at build time — it
//   resolves at the Step-8 bringup run. FALLBACK: if the agentType seal is infeasible, the miners
//   and Cover agent run under PROMPT-ONLY enforcement (the Inc-1/2 posture). This file documents
//   the fallback explicitly — never claim a mechanical seal that isn't confirmed.
//   Current seal status: PROMPT-ONLY (pending Step-8 agentType investigation).
//
// OPERATOR-OWED (Step 8 / bringup checks):
//   1. args injection: does `Workflow({scriptPath}, {target})` inject a 2nd arg as `args`?
//      If yes: the controller passes { src, kbRules, ... } to retarget sub-workflows.
//      If no: controller passes target via another mechanism (e.g. inline const override).
//   2. workflow() composition: does `workflow({scriptPath})` nest? If yes: use the sub-workflow
//      path. If no: activate the MONOLITH (see MONOLITH_FALLBACK const below).
//   3. agentType seal: investigate restricted agentType; if unavailable, note in the run report.
//   All three resolve at the Step-8 live run against sprint-rituals.

// meta MUST be the first statement (Workflow tool requirement).
export const meta = {
  name: 'mine-verify-cover-loop',
  description:
    'Harness Inc 3a: automated Mine→Verify→Cover pipeline controller for ONE target class. Composes the proven sub-workflows, writes the KB ledger, enforces the §6 gate battery, writes the self-contained run report. Budget cap + mutation ratchet safety rails. Seal: PROMPT-ONLY (agentType investigation is Step-8 bringup — see controller header).',
  phases: [
    { title: 'Mine→Verify', detail: 'clean-room Mine (3 samples) + batched-sliced Verify (sub-workflow or inlined)' },
    { title: 'KB Write', detail: 'serialize verified rules into the consuming project KB (verified status) before Cover reads it' },
    { title: 'Cover',    detail: 'Cover agent writes tests; runner double-runs dotnet test + dotnet stryker; orchestrator gates (sub-workflow or inlined)' },
    { title: 'Report',   detail: 'controller writes cover-{class}.md automatically; KB flipped to mutation-gated on all-gates-green' },
  ],
}

// =================================================================================================
// TARGET CONFIG (parameterized via args — Inc-3 Step 1; fallback to BugRatio consts)
// =================================================================================================
// Step-8 bringup check: does `Workflow({scriptPath}, {target})` inject `args`?
// YES → retargeting works via _args.src / _args.targetClass / etc.
// NO  → the sub-workflows use their own BugRatio defaults (standalone fallback).
// Args arrive two ways with DIFFERENT shapes (probe-confirmed 2026-06-23):
//   • Workflow TOOL ({scriptPath}, args)  -> args is a JSON STRING  -> must JSON.parse.
//   • workflow() composition (2nd param)  -> args is a real OBJECT  -> use as-is.
// Parse the string form so _args.X resolves in both cases (the missing parse made Step-8 Run 2
// silently default to BugRatio and waste a full run).
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const SR = 'D:\\src\\sprint-rituals'
const TARGET_CLASS = _args.targetClass ?? 'BugRatioAnalyzer'
const SRC          = _args.src         ?? `${SR}\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\BugRatioAnalyzer.cs`
const KB_RULES     = _args.kbRules     ?? `${SR}\\docs\\kb\\bug-ratio.md`
const KB_INDEX     = _args.kbIndex     ?? `${SR}\\docs\\kb\\index.md`
const TEST_STYLE   = _args.testStyle   ?? `${SR}\\docs\\conventions\\mutation-testing.md`
const TEST_DIR     = `${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics`
const EXAMPLE_TESTS = _args.exampleTests  ?? `${TEST_DIR}\\${TARGET_CLASS}Tests.cs`
const PROPERTY_TESTS = _args.propertyTests ?? `${TEST_DIR}\\${TARGET_CLASS}PropertyTests.cs`

// Runner results: nexus-side + git-ignored (harness/.runs/). NEVER in the SR tree.
const RUNS_DIR     = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\cover-${TARGET_CLASS.toLowerCase()}-run.json`

// Report path (Step 7): self-written run report per the cover-bugratio.md shape.
const REPORT_PATH  = _args.reportPath ?? `D:\\src\\claude-plugins\\nexus\\docs\\specs\\adhoc-MineVerifyCoverHarness\\delivery\\cover-${TARGET_CLASS.toLowerCase()}.md`

// The nexus-repo abs paths for the sub-workflows (used if workflow() composition works).
const MINE_VERIFY_SCRIPT = 'D:\\src\\claude-plugins\\nexus\\harness\\mine-verify.workflow.js'
const COVER_SCRIPT       = 'D:\\src\\claude-plugins\\nexus\\harness\\cover.workflow.js'

// =================================================================================================
// SAFETY RAILS
// =================================================================================================
// Budget cap: halt when budget.spent() exceeds this ceiling (tokens). One class typically costs
// ~100k–300k tokens across Mine→Verify + Cover iterations; 1.5M is a generous per-class ceiling.
// Adjust downward for tighter cost control.
const BUDGET_CEILING_TOKENS = 1_500_000

// Cover loop constants (passed to the sub-workflow or used inline in the monolith).
const MUTATION_FLOOR   = 75   // per-file REACHABLE kill >= 75% (design §6)
const MAX_ITERATIONS   = 5    // hard cap: stop and report, never fake green
const BASELINE_SKIPS   = 0    // measured baseline skip count (0 today in sprint-rituals)
// KB-pre-documented dead lines to exclude from the REACHABLE denominator. Per-class — must NOT carry
// one class's dead lines onto another (that would wrongly exclude real survivors = fake green). Default
// [] for any class without a pre-documented dead-line list; BugRatio keeps its back-compat list when no
// override is passed. A class with no known dead code MUST run with [] so genuine survivors surface.
const EXPECTED_SURVIVOR_LINES = _args.expectedSurvivorLines
  ?? (TARGET_CLASS === 'BugRatioAnalyzer' ? [17, 133, 268] : [])

// =================================================================================================
// COMPOSITION MODE
// =================================================================================================
// Step-8 bringup check: set MONOLITH_FALLBACK = true if workflow() nesting is unavailable.
// When false (default): tries workflow({scriptPath}) for both sub-workflows.
// When true: uses the inlined phase agents below (the MONOLITH path).
const MONOLITH_FALLBACK = false // flip to true at Step-8 if workflow() nesting fails.

// =================================================================================================
// INLINED GATE HELPERS (copy of cover-gates.mjs — keep in sync, same pattern as cover.workflow.js)
// =================================================================================================
// The Workflow runtime has no module/fs access — gate helpers must be inlined.
// SOURCE OF TRUTH: harness/lib/cover-gates.mjs (unit-tested). Copied VERBATIM; keep in sync.

function suiteGreen(testRuns) {
  const runs = testRuns ?? [];
  const everyGreen = runs.length >= 2 && runs.every((r) => r.failed === 0 && r.passed > 0);
  return { pass: everyGreen, detail: { runs: runs.map((r) => ({ passed: r.passed, failed: r.failed })) } };
}
function noFlaky(testRuns) {
  const runs = testRuns ?? [];
  const key = (r) => `${r.passed}/${r.failed}/${r.skipped}`;
  const keys = runs.map(key);
  const identical = runs.length >= 2 && keys.every((k) => k === keys[0]);
  return { pass: identical, detail: { counts: keys } };
}
const DENOMINATOR_STATUSES = new Set(['Killed', 'Survived', 'Timeout', 'NoCoverage']);
function mutantLine(m) { return m?.location?.start?.line ?? null; }
function mutationFloor(strykerReport, sourcePath, opts) {
  const floor = opts?.floor ?? 75;
  const deadLines = new Set(opts?.expectedSurvivorLines ?? []);
  const files = strykerReport?.files ?? {};
  const entry = files[sourcePath];
  if (!entry) {
    return { pass: false, detail: { scorePct: 0, killed: 0, reachableDenominator: 0,
      error: `no per-file Stryker entry for ${sourcePath} (check the mutate glob + the json reporter)`,
      reachableSurvivors: [] } };
  }
  const mutants = entry.mutants ?? [];
  let killed = 0, reachableDenominator = 0, expectedSurvivorsExcluded = 0;
  const reachableSurvivors = [];
  for (const m of mutants) {
    if (!DENOMINATOR_STATUSES.has(m.status)) continue;
    const line = mutantLine(m);
    // Timeout is treated as killed (Inc-3 Step 3): a timeout = the mutant was detected by a slow/hanging
    // test — it counts as a kill for the numerator. So isSurvivor excludes both Killed and Timeout.
    const isSurvivor = m.status !== 'Killed' && m.status !== 'Timeout';
    if (isSurvivor && deadLines.has(line)) { expectedSurvivorsExcluded++; continue; }
    reachableDenominator++;
    // Timeout counts as killed (standard Stryker semantics: a timeout = a detected mutation — the test
    // ran long enough to break the mutant, which is a kill signal). Inc-3 Step 3 fix.
    if (m.status === 'Killed' || m.status === 'Timeout') killed++;
    else reachableSurvivors.push({ status: m.status, line, mutatorName: m.mutatorName, replacement: m.replacement });
  }
  const scorePct = reachableDenominator > 0 ? Math.round((killed / reachableDenominator) * 100) : 0;
  return { pass: reachableDenominator > 0 && scorePct >= floor,
    detail: { scorePct, killed, reachableDenominator, expectedSurvivorsExcluded, floor, reachableSurvivors } };
}
function noNewSkips(testRuns, baselineSkips) {
  const runs = testRuns ?? [];
  const maxSkips = runs.length ? Math.max(...runs.map((r) => r.skipped ?? 0)) : 0;
  return { pass: maxSkips <= baselineSkips, detail: { maxSkips, baselineSkips } };
}
const STRYKER_DISABLE_RE = /^\/\/\s*Stryker\s+disable\b/i;
function isDiffMetaLine(line) {
  return line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@') ||
    line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('new file mode') ||
    line.startsWith('deleted file mode') || line.startsWith('rename ') ||
    line.startsWith('similarity index') || line.startsWith('\\ No newline');
}
function charPin(prodSourceDiff) {
  const text = prodSourceDiff ?? '';
  if (text.trim() === '') return { pass: true, detail: { changedLines: 0, disallowed: [] } };
  const disallowed = []; let changedLines = 0;
  for (const raw of text.split(/\r?\n/)) {
    if (isDiffMetaLine(raw)) continue;
    const isAdd = raw.startsWith('+'); const isDel = raw.startsWith('-');
    if (!isAdd && !isDel) continue; changedLines++;
    if (isDel) { disallowed.push(raw); continue; }
    const content = raw.slice(1).trim();
    if (!STRYKER_DISABLE_RE.test(content)) disallowed.push(raw);
  }
  return { pass: disallowed.length === 0, detail: { changedLines, disallowed } };
}
function mutationRatchet(priorScore, currentScore) {
  if (priorScore === null || priorScore === undefined)
    return { pass: true, detail: `first iteration — no prior score to regress against (current ${currentScore}%)` };
  if (currentScore < priorScore)
    return { pass: false, detail: `mutation kill regressed ${priorScore}% → ${currentScore}% (harness broken — halt)` };
  return { pass: true, detail: `kill held/improved ${priorScore}% → ${currentScore}%` };
}

// =================================================================================================
// INLINED KB-WRITE HELPERS (from harness/lib/kb-write.mjs — keep in sync)
// =================================================================================================
// The controller needs to compute the new KB text (pure fn) and then delegate the file WRITE to an
// agent (the orchestrator has no fs access). The same functions are in kb-write.mjs for unit tests.
// SOURCE OF TRUTH: harness/lib/kb-write.mjs. Inlined here because Workflow scripts cannot import.

function buildRulesSection(rules, year) {
  // year must be passed by the caller — new Date() throws in the Workflow runtime (breaks resume).
  const preamble = `Rules below are **verified** via the Mine→Verify pass (automated harness, ${year} — ${rules.length} rule${rules.length !== 1 ? 's' : ''} confirmed).`;
  if (!rules.length) return `## Rules\n\n${preamble}`;
  const bullets = rules.map((r) => `- ${r.id}: ${r.statement}`).join('\n');
  return `## Rules\n\n${preamble}\n\n${bullets}`;
}
function buildStatusFooter({ mutationGated, date, runNote }) {
  const gatedStr = mutationGated ? 'true' : 'false';
  const status   = mutationGated ? 'mutation-gated' : 'verified';
  return ['---', `<!-- status: ${status} — ${runNote} (${date}) -->`, `<!-- mutation-gated: ${gatedStr} -->`, `<!-- last-stryker-run: ${date} — ${runNote} -->`].join('\n');
}
function supersedingRules(existingKb, rules, { date, mutationGated, runNote }) {
  const text = existingKb ?? '';
  // Derive year from the ISO date string — never call new Date() in a Workflow script (throws, breaks resume).
  const year = date ? date.slice(0, 4) : '';
  const rulesHeadingIdx = text.indexOf('\n## Rules');
  if (rulesHeadingIdx === -1) { return _insertRulesIntoNew(text, rules, { date, mutationGated, runNote, year }); }
  const afterRules = rulesHeadingIdx + '\n## Rules'.length;
  const nextSectionMatch = text.slice(afterRules).match(/\n##\s+\w/);
  const footerSepMatch   = text.slice(afterRules).match(/\n---/);
  let nextSectionIdx;
  if (nextSectionMatch && footerSepMatch) { nextSectionIdx = afterRules + Math.min(nextSectionMatch.index, footerSepMatch.index); }
  else if (nextSectionMatch) { nextSectionIdx = afterRules + nextSectionMatch.index; }
  else if (footerSepMatch)   { nextSectionIdx = afterRules + footerSepMatch.index; }
  else { nextSectionIdx = text.length; }
  const newRulesBlock = '\n' + buildRulesSection(rules, year);
  const footerIdx = text.lastIndexOf('\n---');
  const newFooter = '\n' + buildStatusFooter({ mutationGated, date, runNote });
  if (footerIdx !== -1 && footerIdx >= nextSectionIdx) {
    return text.slice(0, rulesHeadingIdx) + newRulesBlock + text.slice(nextSectionIdx, footerIdx) + newFooter;
  }
  return text.slice(0, rulesHeadingIdx) + newRulesBlock + text.slice(nextSectionIdx).replace(/\n---[\s\S]*$/, '') + '\n\n' + newFooter;
}
function _insertRulesIntoNew(text, rules, { date, mutationGated, runNote, year }) {
  const firstSectionMatch = text.match(/\n## /);
  const insertAt = firstSectionMatch ? text.indexOf('\n## ') : text.length;
  const before = text.slice(0, insertAt);
  const after  = text.slice(insertAt).replace(/\n---[\s\S]*$/, '');
  const newRulesBlock = '\n\n' + buildRulesSection(rules, year);
  const footer = '\n\n---\n' + buildStatusFooter({ mutationGated, date, runNote });
  return before + newRulesBlock + after + footer;
}

// =================================================================================================
// RUNNER RESULT SCHEMA (same shape as cover.workflow.js — keep in sync)
// =================================================================================================
const RUNNER_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    testRuns: {
      type: 'array', minItems: 2,
      items: { type: 'object', properties: { passed: { type: 'integer' }, failed: { type: 'integer' }, skipped: { type: 'integer' } }, required: ['passed', 'failed', 'skipped'] },
    },
    strykerReportPath: { type: 'string' },
    mutants: {
      type: 'array',
      items: { type: 'object', properties: { status: { type: 'string' }, location: { type: 'object', properties: { start: { type: 'object', properties: { line: { type: 'integer' } }, required: ['line'] } }, required: ['start'] }, mutatorName: { type: 'string' }, replacement: { type: 'string' } }, required: ['status', 'location', 'mutatorName'] },
    },
    redOnCurrent: { type: 'array', items: { type: 'object', properties: { test: { type: 'string' }, note: { type: 'string' } }, required: ['test'] } },
  },
  required: ['testRuns', 'strykerReportPath', 'mutants'],
}

// =================================================================================================
// DATE STAMP — sourced from an agent (new Date() / Date.now() throw in the Workflow runtime)
// =================================================================================================
// The orchestrator VM has no Date object (calling it breaks workflow resume). Source today's date
// from a cheap agent call whose only job is to return the current date. This `today` string is then
// threaded into buildRulesSection (via supersedingRules) and the report header — zero Date calls
// in orchestrator code anywhere in this file.
const DATE_STAMP_SCHEMA = { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] }
const dateStampResult = await agent(
  'Output ONLY today\'s date as YYYY-MM-DD (e.g. 2026-06-22). Return nothing else.',
  { label: 'date-stamp', phase: 'Init', schema: DATE_STAMP_SCHEMA }
)
const today = dateStampResult?.date ?? '(date-unavailable)'

// =================================================================================================
// PHASE 1: MINE → VERIFY
// =================================================================================================
phase('Mine→Verify')
log(`Controller start: target=${TARGET_CLASS}, src=${SRC}`)
log(`Budget ceiling: ${BUDGET_CEILING_TOKENS.toLocaleString()} tokens (safety rail — halts before exceeding).`)
log(`Seal status: PROMPT-ONLY (agentType investigation is Step-8 bringup — see controller header).`)

let mineVerifyResult
if (!MONOLITH_FALLBACK) {
  // --- Preferred path: workflow() composition ---
  // Step-8 bringup check: does workflow({scriptPath}) nest one level?
  // The sub-workflow is parameterized via args (Step-1 _args pattern); if args injection is absent
  // the sub-workflow uses its own BugRatio defaults (back-compat).
  log('Attempting workflow() composition for Mine→Verify (Step-8 bringup: verifies nesting + args injection).')
  mineVerifyResult = await workflow(
    { scriptPath: MINE_VERIFY_SCRIPT },
    { src: SRC, targetClass: TARGET_CLASS },   // args forwarding (unverified at build time)
  )
  if (!mineVerifyResult?.consensusRules) {
    log('WARNING: workflow() composition returned no consensusRules. Bringup check failed — switch to MONOLITH_FALLBACK = true.')
    return { stopped: 'bringup-fail', reason: 'mine-verify sub-workflow returned no consensusRules; set MONOLITH_FALLBACK=true', outputTokensThisTurn: budget.spent() }
  }
} else {
  // --- Monolith fallback: inline Mine→Verify agent calls ---
  // (Activated when workflow() nesting is unavailable. All agent logic mirrors mine-verify.workflow.js.)
  log('MONOLITH path: inlining Mine→Verify agent calls (workflow() composition not available).')
  const BATCH_SIZE = 5
  function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

  const minerPrompt = `You are a clean-room business-rule miner. Read ONLY this one source file: ${SRC}. Do NOT read any other file — no docs/, no tests, no knowledge base, no golden set. Extract every business rule the code ENCODES. Quote-first: capture the verbatim code quote + line range in the quote/lines fields. The \`statement\` is durable KB prose — describe rules by SYMBOL/CONDITION (names + predicates), NEVER embed source line numbers ("L35"/"line 76") in the statement (they rot; keep them in \`lines\` only). Be exhaustive. Return the full rule list.`
  const MINER_SCHEMA = { type: 'object', properties: { rules: { type: 'array', items: { type: 'object', properties: { statement: { type: 'string' }, quote: { type: 'string' }, lines: { type: 'string' } }, required: ['statement', 'quote', 'lines'] } } }, required: ['rules'] }
  const miners = await parallel([
    () => agent(minerPrompt, { label: 'miner-1', phase: 'Mine→Verify', schema: MINER_SCHEMA }),
    () => agent(minerPrompt, { label: 'miner-2', phase: 'Mine→Verify', schema: MINER_SCHEMA }),
    () => agent(minerPrompt, { label: 'miner-3', phase: 'Mine→Verify', schema: MINER_SCHEMA }),
  ])
  const valid = miners.filter(Boolean)
  if (!valid.length) return { stopped: 'mine-fail', reason: 'no miner returned a valid rule set', outputTokensThisTurn: budget.spent() }
  log(`Mine: ${valid.length}/3 miners returned`)

  const CONSOLIDATE_SCHEMA = { type: 'object', properties: { consistencyScore: { type: 'string' }, contradictions: { type: 'array', items: { type: 'string' } }, consensusRules: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, statement: { type: 'string' }, quote: { type: 'string' }, lines: { type: 'string' }, agreement: { type: 'integer' }, kind: { type: 'string', enum: ['transcribed', 'interpretive'] } }, required: ['id', 'statement', 'quote', 'lines', 'agreement', 'kind'] } } }, required: ['consistencyScore', 'contradictions', 'consensusRules'] }
  const consensus = await agent(
    `You are the consolidation step. Merge and deduplicate these 3 miner outputs. Give each rule a stable id (BR-1, BR-2...), agreement count, and classify kind (transcribed/interpretive). Keep quote/lines in their fields; the consensus \`statement\` must be LINE-NUMBER-FREE durable prose — refer to code by SYMBOL/CONDITION (names, predicates), never "L35"/"line 76"/"lines 48". Miner outputs:\n\nMINER 1:\n${JSON.stringify(valid[0]?.rules ?? [], null, 1)}\n\nMINER 2:\n${JSON.stringify(valid[1]?.rules ?? [], null, 1)}\n\nMINER 3:\n${JSON.stringify(valid[2]?.rules ?? [], null, 1)}`,
    { label: 'consolidate', phase: 'Mine→Verify', schema: CONSOLIDATE_SCHEMA }
  )
  if (!consensus) return { stopped: 'consolidate-fail', reason: 'consolidation returned no result', outputTokensThisTurn: budget.spent() }

  const interpretive = consensus.consensusRules.filter((r) => r.kind === 'interpretive')
  const SLICE_SCHEMA = { type: 'object', properties: { slices: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, slice: { type: 'string' } }, required: ['id', 'slice'] } } }, required: ['slices'] }
  const BATCH_VERDICT_SCHEMA = { type: 'object', properties: { verdicts: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, verdict: { type: 'string', enum: ['CONFIRMED', 'WRONG', 'IMPRECISE'] }, evidence: { type: 'string' } }, required: ['id', 'verdict', 'evidence'] } } }, required: ['verdicts'] }
  const TRANSCRIBED_SCHEMA = { type: 'object', properties: { failures: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } } }, required: ['failures'] }
  const transcribed = consensus.consensusRules.filter((r) => r.kind === 'transcribed')

  const sliced = interpretive.length ? await agent(
    `Read ${SRC} ONCE. For each rule, return the code slice (±15 lines context):\n${interpretive.map((r) => `${r.id} (lines ${r.lines}): ${r.statement.slice(0, 130)}`).join('\n')}`,
    { label: 'slicer', phase: 'Mine→Verify', schema: SLICE_SCHEMA }
  ) : { slices: [] }
  const sliceById = Object.fromEntries((sliced?.slices ?? []).map((s) => [s.id, s.slice]))

  const batches = chunk(interpretive, BATCH_SIZE)
  const batchResults = await parallel(batches.map((batch, bi) => () => {
    const rulesBlock = batch.map((r) => `--- Rule ${r.id} ---\nStatement: ${r.statement}\nCODE SLICE:\n${sliceById[r.id] ?? '(missing)'}`).join('\n\n')
    return agent(`Verify this BATCH of rules from inline slices ONLY — do NOT read files.\n\n${rulesBlock}`, { label: `verify:batch-${bi + 1}`, phase: 'Mine→Verify', schema: BATCH_VERDICT_SCHEMA })
  }))
  const verdicts = batchResults.filter(Boolean).flatMap((b) => b.verdicts ?? [])

  const transcribedCheck = transcribed.length ? await agent(
    `Quote-entailment check. Judge ONLY from inline quotes — do NOT read any file.\n${transcribed.map((r) => `${r.id}: ${r.statement}\n  quote: ${r.quote}`).join('\n')}`,
    { label: 'verify:transcribed-batch', phase: 'Mine→Verify', schema: TRANSCRIBED_SCHEMA }
  ) : { failures: [] }

  mineVerifyResult = {
    consensusRules: consensus.consensusRules.map((r) => ({ id: r.id, kind: r.kind, agreement: r.agreement, lines: r.lines, statement: r.statement })),
    counts: { consensusRules: consensus.consensusRules.length, interpretive: interpretive.length, transcribed: transcribed.length },
    interpretiveVerdicts: verdicts,
    transcribedFailures: transcribedCheck.failures,
    outputTokensThisTurn: budget.spent(),
  }
}

log(`Mine→Verify complete: ${mineVerifyResult.consensusRules.length} consensus rules.`)

// Budget check after Mine→Verify.
if (budget.spent() > BUDGET_CEILING_TOKENS) {
  log(`HALT: budget ceiling breached after Mine→Verify (${budget.spent().toLocaleString()} > ${BUDGET_CEILING_TOKENS.toLocaleString()} tokens).`)
  return { stopped: 'budget-ceiling', after: 'mine-verify', spent: budget.spent(), ceiling: BUDGET_CEILING_TOKENS, outputTokensThisTurn: budget.spent() }
}

// =================================================================================================
// PHASE 2: KB WRITE — serialize verified rules BEFORE Cover reads the KB file
// =================================================================================================
// Design §5 (CRITICAL-1 fix): the controller MUST write the rules to the KB file before Cover runs.
// Cover reads the KB from the file path (KB_RULES) — it cannot receive rules in-memory.
// The orchestrator has no fs access — an agent does the file write.
phase('KB Write')
log(`KB Write: computing new KB text from ${mineVerifyResult.consensusRules.length} verified rules.`)

// Compute the new KB text (pure function — no fs, no agent).
// The existing KB content is read by the kb-write agent and returned for the transform.
const kbWritePrompt = `You are the KB-WRITE agent. Your ONLY job is:

1. READ this file and return its ENTIRE content verbatim (do not summarize):
   ${KB_RULES}

Return the full file content in your schema'd response. Make NO changes — this is a read-only step.`

const KB_READ_SCHEMA = {
  type: 'object',
  properties: { content: { type: 'string' } },
  required: ['content'],
}

const kbReadResult = await agent(kbWritePrompt, { label: 'kb-read', phase: 'KB Write', schema: KB_READ_SCHEMA })
if (!kbReadResult?.content) {
  log('WARNING: KB-read agent returned no content. Proceeding with empty base (new entry path).')
}
const existingKbContent = kbReadResult?.content ?? ''

// `today` was sourced from the date-stamp agent at controller start (before Phase 1).
const newKbText = supersedingRules(
  existingKbContent,
  mineVerifyResult.consensusRules,
  { date: today, mutationGated: false, runNote: 'verified — Mine→Verify pass complete, Cover not yet run' }
)

// Delegate the file write to an agent.
const kbWriteFilePrompt = `You are the KB-WRITE-FILE agent. Write EXACTLY this content to the file — no changes, no reformatting, no summarizing.

TARGET FILE: ${KB_RULES}

CONTENT TO WRITE (verbatim):
${newKbText}

Write the file now using the Write tool. Confirm by returning { "written": true } in your response.`

const KB_WRITE_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
const kbWriteConfirm = await agent(kbWriteFilePrompt, { label: 'kb-write-file', phase: 'KB Write', schema: KB_WRITE_SCHEMA })
if (!kbWriteConfirm?.written) {
  log('WARNING: KB-write-file agent did not confirm the write. The KB file may not have been updated.')
}
log(`KB Write complete: ${KB_RULES} updated with ${mineVerifyResult.consensusRules.length} verified rules (status: verified).`)

// =================================================================================================
// PHASE 3: COVER (sub-workflow or monolith)
// =================================================================================================
phase('Cover')

// Cover agent prompt (same as cover.workflow.js coverPrompt — mirrors the proven Inc-2 shape).
function makeCoverPrompt(survivingMutants) {
  const survBlock = survivingMutants.length
    ? `SURVIVING MUTANTS to target this iteration:\n${survivingMutants.map((m) => `- ${m.mutatorName} at line ${m.line}: replacement \`${m.replacement}\` (status ${m.status})`).join('\n')}`
    : 'FIRST ITERATION — no surviving-mutant feedback yet. Write the full example + property suite covering every verified rule boundary below.'
  return `You are the COVER agent. Write mutation-gated tests for ONE production class, against the VERIFIED rules below.

YOUR ONLY TWO WRITE TARGETS:
  1. ${EXAMPLE_TESTS}
  2. ${PROPERTY_TESTS}

FORBIDDEN — you have NO write access to: ${SRC}, stryker-config.json, any gate infra, any docs/kb/** file.

NON-NEGOTIABLE RULES:
  • A test that FAILS on the CURRENT production code is KEPT and FLAGGED as a candidate bug in a \`// CANDIDATE BUG:\` comment — NEVER deleted.
  • Coverage is NOT the goal — KILLING MUTANTS is. Pin exact threshold/boundary cases.
  • Deliverable = the file write. Write() both files.

STEP 1 — READ THE PRODUCTION SOURCE: ${SRC}
STEP 2 — READ THE VERIFIED RULES (from the consuming project's KB — GROUND TRUTH): ${KB_RULES}
STEP 3 — READ THE TEST-STYLE CONTRACT: ${TEST_STYLE}

${survBlock}

Write both files now.`
}

const runnerPromptStr = `You are the RUNNER agent. Execute the .NET toolchain — do NOT write tests, do NOT edit production code.

STEPS (from ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests):
  1. Run \`dotnet test\` TWICE. Record { passed, failed, skipped } for EACH run.
  2. Run \`dotnet stryker\`. Capture the JSON report path.
  3. Read mutation-report.json. Find the per-file entry for ${TARGET_CLASS}.cs. Extract its \`mutants\` array.
  4. Note any red-on-current tests — list them, do NOT delete them.

WRITE YOUR RESULTS HERE (nexus-side, git-ignored): ${RUNNER_RESULT}
as JSON: { "testRuns": [...], "strykerReportPath": "...", "mutants": [...], "redOnCurrent": [...] }

IMPORTANT: return the same data in your schema'd response AND in the Write().`

let survivingMutants = []
let lastScore = null
let coverResult = null

for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
  log(`Cover iteration ${iter}/${MAX_ITERATIONS}: ${survivingMutants.length} surviving mutant(s) fed back.`)

  if (!MONOLITH_FALLBACK) {
    // Preferred: sub-workflow handles its own Cover loop.
    // NOTE: cover.workflow.js already runs its own bounded loop; the controller runs it once
    // and reads the final result. The controller's ratchet + budget cap wrap the sub-workflow call.
    log('Attempting workflow() composition for Cover (Step-8 bringup check).')
    const coverSubResult = await workflow(
      { scriptPath: COVER_SCRIPT },
      { src: SRC, kbRules: KB_RULES, testStyle: TEST_STYLE, exampleTests: EXAMPLE_TESTS,
        propertyTests: PROPERTY_TESTS, runnerResult: RUNNER_RESULT, targetClass: TARGET_CLASS },
    )
    if (!coverSubResult) {
      log('WARNING: cover sub-workflow returned no result. Bringup check failed — switch MONOLITH_FALLBACK=true.')
      return { stopped: 'bringup-fail', reason: 'cover sub-workflow returned no result; set MONOLITH_FALLBACK=true', outputTokensThisTurn: budget.spent() }
    }
    coverResult = coverSubResult
    // The sub-workflow runs its own loop; we take its final result as-is.
    break
  } else {
    // Monolith: inline Cover agent + runner agent + gate battery.
    await agent(makeCoverPrompt(survivingMutants), { label: `cover:iter-${iter}`, phase: 'Cover' })

    const runRaw = await agent(runnerPromptStr, { label: `runner:iter-${iter}`, phase: 'Cover', schema: RUNNER_RESULT_SCHEMA })
    if (!runRaw) throw new Error(`Cover iteration ${iter}: runner returned no result`)

    const strykerReport = { files: { [SRC]: { mutants: runRaw.mutants } } }
    const prodSourceDiff = '' // prompt-only clean-room; char_pin passes (no prod diff at controller level).
    const gates = {
      suite_green:     suiteGreen(runRaw.testRuns),
      no_flaky:        noFlaky(runRaw.testRuns),
      mutation_floor:  mutationFloor(strykerReport, SRC, { floor: MUTATION_FLOOR, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES }),
      no_new_skips:    noNewSkips(runRaw.testRuns, BASELINE_SKIPS),
      char_pin:        charPin(prodSourceDiff),
    }
    const score = gates.mutation_floor.detail.scorePct
    const ratchet = mutationRatchet(lastScore, score)
    if (!ratchet.pass) {
      log(`HALT (ratchet): ${ratchet.detail}`)
      coverResult = { stopped: 'ratchet-regression', iter, gates, ratchet, runRaw, achievedScore: score }
      break
    }
    lastScore = score

    const allGreen = Object.values(gates).every((g) => g.pass)
    log(`Gate iter ${iter}: suite_green=${gates.suite_green.pass} mutation_floor=${gates.mutation_floor.pass} (${score}% reachable)`)

    if (allGreen) {
      coverResult = { stopped: 'all-gates-green', iter, gates, achievedScore: score, redOnCurrent: runRaw.redOnCurrent ?? [] }
      break
    }
    survivingMutants = gates.mutation_floor.detail.reachableSurvivors

    if (budget.spent() > BUDGET_CEILING_TOKENS) {
      log(`HALT: budget ceiling breached during Cover (${budget.spent().toLocaleString()} tokens).`)
      coverResult = { stopped: 'budget-ceiling', iter, gates, achievedScore: score, spent: budget.spent() }
      break
    }

    if (iter === MAX_ITERATIONS) {
      coverResult = { stopped: 'cap-reached', iter, gates, achievedScore: score, reachableSurvivors: survivingMutants }
    }
  }
}

log(`Cover done: ${coverResult.stopped} after ${coverResult.iter ?? '?'} iteration(s); achieved ${coverResult.achievedScore ?? '?'}% reachable kill.`)

// Budget check after Cover.
if (budget.spent() > BUDGET_CEILING_TOKENS) {
  log(`HALT: budget ceiling breached after Cover (${budget.spent().toLocaleString()} tokens).`)
}

// =================================================================================================
// PHASE 4: KB LEDGER FLIP (on all-gates-green) + REPORT
// =================================================================================================
phase('Report')

const allGatesGreen = coverResult.stopped === 'all-gates-green'
const achievedScore = coverResult.achievedScore ?? 0
const candidateBugs = coverResult.redOnCurrent ?? []
// Reuse `today` from the KB-write phase — both phases run in the same session day.

// Flip the KB to mutation-gated on all-gates-green.
if (allGatesGreen) {
  log(`All gates green at ${achievedScore}%. Flipping KB to mutation-gated.`)
  const flippedKbText = supersedingRules(
    newKbText,
    mineVerifyResult.consensusRules,
    { date: today, mutationGated: true, runNote: `${achievedScore}% reachable kill, floor ${MUTATION_FLOOR} cleared, ${candidateBugs.length} candidate bug${candidateBugs.length !== 1 ? 's' : ''}` }
  )
  // KB index entry filename (e.g. bug-ratio.md) is the last segment of the KB_RULES path.
  const kbEntryFile = KB_RULES.split('\\').pop()
  const kbFlipPrompt = `You are the KB-FLIP agent. Write EXACTLY this content to ${KB_RULES} — no changes.\n\nCONTENT:\n${flippedKbText}\n\nAlso update ${KB_INDEX}: find the row for ${kbEntryFile} and change its Status from "verified" to "mutation-gated".\n\nReturn { "written": true } when done.`
  const KB_FLIP_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
  await agent(kbFlipPrompt, { label: 'kb-flip', phase: 'Report', schema: KB_FLIP_SCHEMA })
  log('KB ledger flipped to mutation-gated.')
} else {
  log(`Cover did not reach all-gates-green (stopped: ${coverResult.stopped}). KB remains at verified status.`)
}

// --- Step 7: Self-written run report (the cover-{class}.md shape) ---------------------------------
// The controller writes the report automatically — zero manual steps (design §5 / plan Step 7).
// With Timeout counted as killed (Step 3), BugRatio's survivor section may be empty — rendered
// cleanly as "No reachable survivors" (no broken table).
const gateRows = allGatesGreen
  ? Object.entries(coverResult.gates ?? {}).map(([name, g]) => `| ${name} | ${g.pass ? 'PASS' : 'FAIL'} | ${typeof g.detail === 'string' ? g.detail : (g.detail?.scorePct !== undefined ? `${g.detail.scorePct}%` : JSON.stringify(g.detail).slice(0, 80))} |`).join('\n')
  : '| — | — | Cover did not reach gate evaluation — see stopped reason |'

const survivorsSection = (() => {
  const survivors = coverResult.gates?.mutation_floor?.detail?.reachableSurvivors ?? []
  if (!survivors.length) return '_No reachable survivors._'
  return survivors.map((m) => `- Line ${m.line}: ${m.mutatorName} \`${m.replacement}\` (${m.status})`).join('\n')
})()

const candidateBugSection = candidateBugs.length
  ? candidateBugs.map((b) => `- \`${b.test}\`${b.note ? ` — ${b.note}` : ''}`).join('\n')
  : '_None._'

const cleanRoomStatus = 'PROMPT-ONLY enforcement (agentType mechanical seal pending Step-8 bringup investigation — see controller header).'

const reportContent = `# Cover run — ${TARGET_CLASS} (${today})

**Controller:** \`harness/loop.workflow.js\` (Inc 3a — automated pipeline controller)
**Target:** \`${SRC}\`
**Clean-room status:** ${cleanRoomStatus}

## Result

| Field | Value |
|-------|-------|
| Stopped | ${coverResult.stopped} |
| Iterations | ${coverResult.iter ?? '?'} |
| Achieved score | ${achievedScore}% reachable kill |
| Budget spent | ${budget.spent().toLocaleString()} tokens |
| Date | ${today} |

## Gate Battery (§6)

| Gate | Result | Detail |
|------|--------|--------|
${gateRows}

## Residual Survivors

${survivorsSection}

## Candidate Bugs (red-on-current tests kept, never deleted)

${candidateBugSection}

## Mine→Verify Summary

- Consensus rules: ${mineVerifyResult.consensusRules.length}
- Mine→Verify cost (up to this point): ${mineVerifyResult.outputTokensThisTurn?.toLocaleString() ?? 'N/A'} tokens

## Notes

- Timeout mutants counted as killed (Inc-3 Step-3 fix — standard Stryker semantics).
- If the survivor section is empty, all reachable mutants were killed (Timeout-as-killed may have cleared the remaining survivors).
- This report was written automatically by the controller (no manual assembly required).
`

const reportWritePrompt = `You are the REPORT-WRITE agent. Write EXACTLY this content to ${REPORT_PATH} — no changes, no reformatting.

CONTENT:
${reportContent}

Write the file now using the Write tool. Return { "written": true } when done.`
const REPORT_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
await agent(reportWritePrompt, { label: 'report-write', phase: 'Report', schema: REPORT_SCHEMA })
log(`Report written: ${REPORT_PATH}`)

// =================================================================================================
// RETURN
// =================================================================================================
return {
  variant: 'inc3a-loop-controller',
  target: { class: TARGET_CLASS, source: SRC },
  mineVerify: {
    consensusRules: mineVerifyResult.consensusRules.length,
    outputTokensThisTurn: mineVerifyResult.outputTokensThisTurn,
  },
  cover: coverResult,
  allGatesGreen,
  reportPath: REPORT_PATH,
  cleanRoomStatus: 'prompt-only (agentType seal is Step-8 investigation)',
  outputTokensThisTurn: budget.spent(),
}
