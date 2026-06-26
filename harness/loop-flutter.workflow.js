// Mine→Verify→Cover controller — FLUTTER/DART (harness Increment 4, Flutter bringup).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/loop-flutter.workflow.js", args: {...} }).
//
// The Flutter twin of loop.workflow.js: ONE invocation does the whole loop for a Dart class —
//   compose mine-verify (the STACK-AGNOSTIC workflow, unchanged) → serialize + write the KB →
//   compose cover-flutter → write the report → flip the KB to mutation-gated on all-gates-green.
//
// Thinner than the .NET controller by design:
//   • No MONOLITH_FALLBACK — workflow() composition is proven (the .NET loop ships on it).
//   • KB is OVERWRITTEN from the verified rules (harness-owned file), not superseded — no kb-read step.
//   • Mine→Verify needs NO Dart variant: mine-verify.workflow.js is language-neutral and runs on a
//     `.dart` source via args.src (proven 2026-06-24).
//
// SAFETY RAILS (never fake green): budget ceiling (run-marginal), mine-verify clean-halt propagation,
// and the cover-flutter sub-workflow's own §6 gate battery. On halt/cap it returns the stop reason.

// meta MUST be the first statement (Workflow tool requirement) and a PURE LITERAL.
export const meta = {
  name: 'mine-verify-cover-flutter-loop',
  description:
    'Harness Inc 4 Flutter controller: ONE invocation runs Mine→Verify→Cover for a Dart class. Composes the stack-agnostic mine-verify workflow, serializes the verified rules into the consuming app KB, composes cover-flutter (mutation_test gate), writes the run report, and flips the KB to mutation-gated on all-gates-green. DEFAULT MODEL: Sonnet (the mutation gate measures test quality). Budget cap safety rail. Target from args; defaults to BuildZplCodeUsecase.',
  phases: [
    { title: 'Mine→Verify', detail: 'compose mine-verify.workflow.js on the Dart source (stack-agnostic) → consensus rules' },
    { title: 'KB Write', detail: 'serialize the verified rules into the app KB (status: verified) before Cover reads it' },
    { title: 'Cover', detail: 'compose cover-flutter.workflow.js: Cover agent writes flutter_test; runner runs flutter test + mutation_test; §6 gates' },
    { title: 'Report', detail: 'write the run report; flip the KB to mutation-gated on all-gates-green' },
  ],
}

// --- Args (Workflow-tool injects a JSON STRING; workflow() composition injects an OBJECT) ----------
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const APP = _args.appDir ?? 'D:\\omnishelf\\omnishelf_flutter_app'
const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'BuildZplCodeUsecase'
const SRC = _args.src ?? `${APP}\\lib\\domain\\usecases\\zebra_printer\\build_zpl_code_usecase.dart`
const KB_RULES = _args.kbRules ?? `${APP}\\docs\\kb\\${kebab(TARGET_CLASS)}.md`
const KB_INDEX = _args.kbIndex ?? `${APP}\\docs\\kb\\index.md`
const COVER_TEST = _args.coverTest ?? `${APP}\\test\\domain\\usecases\\${snake(TARGET_CLASS)}_harness_test.dart`
const TEST_PROJECT_DIR = _args.testProjectDir ?? APP
const MUTATE_FILE = _args.mutateFile ?? toAppRel(SRC, APP)
const TEST_STYLE = _args.testStyle ?? `${APP}\\test\\flutter_test_config.dart`
const PATTERN_TESTS = _args.patternTests ?? null
const EXPECTED_SURVIVOR_LINES = _args.expectedSurvivorLines ?? []
// Pre-tag signal (Q1) — log-call line numbers the adapter surfaces; forwarded to cover-flutter so the
// orchestrator can pre-tag `equivalent-logging`. Distinct from EXPECTED_SURVIVOR_LINES (denominator exclusion).
const EQUIVALENT_LOGGING_LINES = _args.equivalentLoggingLines ?? []
const MUTATION_FLOOR = _args.mutationFloor ?? 75
const MAX_ITERATIONS = _args.maxIterations ?? 5

// Sub-workflow script paths (nexus dev repo).
const MINE_VERIFY_SCRIPT = 'D:\\src\\claude-plugins\\nexus\\harness\\mine-verify.workflow.js'
const COVER_FLUTTER_SCRIPT = 'D:\\src\\claude-plugins\\nexus\\harness\\cover-flutter.workflow.js'

// Report (nexus-side delivery doc) + runner result (nexus-side, git-ignored — set by cover-flutter).
const REPORT_PATH = _args.reportPath ?? `D:\\src\\claude-plugins\\nexus\\docs\\specs\\adhoc-MineVerifyCoverHarness\\delivery\\cover-flutter-${TARGET_CLASS.toLowerCase()}.md`

// Budget ceiling (run-marginal — budget.spent() is the SHARED session pool; gate on the run's own spend).
const BUDGET_CEILING_TOKENS = _args.budgetCeiling ?? 4_000_000
const RUN_START_SPENT = budget.spent()
const runSpent = () => budget.spent() - RUN_START_SPENT

// --- Pure helpers (no Date/Math.random/fs — resume-safe) ------------------------------------------
function snake(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase()
}
function kebab(name) {
  return snake(name).replace(/_/g, '-')
}
function toAppRel(abs, appRoot) {
  const a = String(abs).replace(/\//g, '\\')
  const root = String(appRoot).replace(/\//g, '\\').replace(/\\+$/, '')
  const rel = a.startsWith(root) ? a.slice(root.length).replace(/^\\+/, '') : a
  return rel.replace(/\\/g, '/')
}
// Serialize the verified rules into the consuming-app KB markdown (the build-zpl-code.md shape).
function serializeKb(rules, verdicts, opts) {
  const tally = (k) => (verdicts ?? []).filter((v) => v.verdict === k).length
  const summary = `${rules.length} rules; ${tally('CONFIRMED')} CONFIRMED, ${tally('IMPRECISE')} IMPRECISE, ${tally('WRONG')} WRONG`
  const ruleLines = rules
    .map((r) => `- ${r.id}: ${r.statement}${r.agreement < 3 ? ` _(agreement ${r.agreement}/3)_` : ''}`)
    .join('\n')
  const status = opts.mutationGated ? 'mutation-gated' : 'verified'
  const note = opts.mutationGated ? 'Cover gate PASSED.' : 'Cover not yet run.'
  return `# ${opts.targetClass} — verified business rules

Source: \`${opts.relpath}\`.

## Rules

Mined by 3 clean-room miners + skeptic verify (${summary}). ${note}

${ruleLines}

---
<!-- status: ${status} — ${opts.runNote} (${opts.date}) -->
<!-- mutation-gated: ${opts.mutationGated} -->
`
}

// --- Date stamp (prefer args.runDate; the orchestrator VM has no Date — see loop.workflow.js) ------
const DATE_STAMP_SCHEMA = { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] }
const dateStampResult = _args.runDate
  ? { date: _args.runDate }
  : await agent('Output ONLY today\'s date as YYYY-MM-DD. Return nothing else.', { label: 'date-stamp', phase: 'Mine→Verify', schema: DATE_STAMP_SCHEMA, model: MODEL })
const today = dateStampResult?.date ?? '(date-unavailable)'

// =================================================================================================
// PHASE 1: MINE → VERIFY (compose the stack-agnostic workflow on the Dart source)
// =================================================================================================
phase('Mine→Verify')
log(`Flutter controller start: target=${TARGET_CLASS}, src=${SRC}. Budget ceiling ${BUDGET_CEILING_TOKENS.toLocaleString()} run-marginal (baseline ${RUN_START_SPENT.toLocaleString()}).`)

const mineVerifyResult = await workflow(
  { scriptPath: MINE_VERIFY_SCRIPT },
  { src: SRC, targetClass: TARGET_CLASS, model: MODEL },
)
if (mineVerifyResult?.stopped) {
  log(`HALT: mine-verify stopped (${mineVerifyResult.stopped}): ${mineVerifyResult.reason ?? ''}`)
  return { stopped: mineVerifyResult.stopped, reason: mineVerifyResult.reason, after: 'mine-verify', outputTokensThisTurn: budget.spent() }
}
if (!mineVerifyResult?.consensusRules?.length) {
  return { stopped: 'mine-fail', reason: 'mine-verify returned no consensus rules', outputTokensThisTurn: budget.spent() }
}
log(`Mine→Verify complete: ${mineVerifyResult.consensusRules.length} consensus rules.`)

if (runSpent() > BUDGET_CEILING_TOKENS) {
  return { stopped: 'budget-ceiling', after: 'mine-verify', spent: runSpent(), sessionTotal: budget.spent(), outputTokensThisTurn: budget.spent() }
}

// =================================================================================================
// PHASE 2: KB WRITE (serialize verified rules to the app KB BEFORE Cover reads it)
// =================================================================================================
phase('KB Write')
const relpath = toAppRel(SRC, APP)
const kbText = serializeKb(mineVerifyResult.consensusRules, mineVerifyResult.interpretiveVerdicts, {
  targetClass: TARGET_CLASS, relpath, date: today, mutationGated: false,
  runNote: 'Mine→Verify pass complete, Cover not yet run',
})
const KB_WRITE_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
const kbWritePrompt = `You are the KB-WRITE-FILE agent. Write EXACTLY this content to the file — no changes, no reformatting, no summarizing. Create the docs/kb/ directory if needed.

TARGET FILE: ${KB_RULES}

CONTENT TO WRITE (verbatim):
${kbText}

Write the file now with the Write tool. Return { "written": true }.`
const kbWriteConfirm = await agent(kbWritePrompt, { label: 'kb-write-file', phase: 'KB Write', schema: KB_WRITE_SCHEMA, model: MODEL })
if (!kbWriteConfirm?.written) log('WARNING: KB-write-file agent did not confirm the write.')
log(`KB Write complete: ${KB_RULES} (status: verified, ${mineVerifyResult.consensusRules.length} rules).`)

// =================================================================================================
// PHASE 3: COVER (compose cover-flutter — it runs its own bounded loop + §6 gate battery)
// =================================================================================================
phase('Cover')
const coverResult = await workflow(
  { scriptPath: COVER_FLUTTER_SCRIPT },
  {
    targetClass: TARGET_CLASS, src: SRC, kbRules: KB_RULES, appDir: APP, coverTest: COVER_TEST,
    testProjectDir: TEST_PROJECT_DIR, mutateFile: MUTATE_FILE, testStyle: TEST_STYLE,
    patternTests: PATTERN_TESTS, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES,
    equivalentLoggingLines: EQUIVALENT_LOGGING_LINES,
    mutationFloor: MUTATION_FLOOR, maxIterations: MAX_ITERATIONS, model: MODEL,
  },
)
if (!coverResult) {
  return { stopped: 'cover-fail', reason: 'cover-flutter sub-workflow returned no result', after: 'cover', outputTokensThisTurn: budget.spent() }
}
log(`Cover done: ${coverResult.stopped} after ${coverResult.iter ?? '?'} iteration(s); achieved ${coverResult.achievedScore ?? '?'}% reachable kill.`)

// --- classify-survivors agent contract (source-aware; the orchestrator only records its verdict) --------
// Assigns the SOURCE-DEPENDENT tags the orchestrator cannot derive. `equivalent-logging` is NOT in the enum:
// it is the orchestrator's pre-tag (cover-flutter). REAL-gap is the ONLY tag that should drive more tests.
// Each verdict echoes back the survivor's `index` (its position in the list sent to the agent) — TWO survivors
// can share one source line, so the verdict is keyed PER-SURVIVOR by index, never by line (F2 — keying by line
// let the last verdict clobber the first). `reason` is required: a verdict with no rationale is not actionable (F4).
const CLASSIFY_SURVIVORS_SCHEMA = {
  type: 'object',
  properties: {
    classifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          line: { type: 'integer' },
          tag: { type: 'string', enum: ['equivalent-format', 'dead-code', 'masked', 'REAL-gap'] },
          reason: { type: 'string' },
          cleanup: { type: 'string' },
        },
        required: ['index', 'line', 'tag', 'reason'],
      },
    },
  },
  required: ['classifications'],
}
function classifySurvivorsPrompt(survivorsToClassify) {
  const list = survivorsToClassify.map((s, i) => `  - index ${i} | line ${s.line}: ${s.mutatorName} → \`${s.replacement}\` (${s.status})`).join('\n')
  return `You are the CLASSIFY-SURVIVORS agent. You have SOURCE access; the orchestrator does not — it only
RECORDS your verdict. Read the target source + the verified-rule KB, then assign EACH residual surviving
mutant below exactly ONE tag. (equivalent-logging survivors were already pre-tagged by the orchestrator and
are NOT in this list.)

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${SRC}
STEP 2 — READ THE VERIFIED RULES KB (ground truth, already Mine→Verify'd):
  ${KB_RULES}

RESIDUAL SURVIVORS TO CLASSIFY — each carries a stable \`index\`. TWO survivors can share one source line, so the
INDEX (not the line) identifies which survivor your verdict is for; echo the exact index back in every entry:
${list}

TAGS (assign exactly one per survivor; you MUST prove equivalence before falling back to REAL-gap):
  • equivalent-format — a consistent internal-format change (the same key-builder mutated on BOTH the
    construction and the lookup side), so matching is unaffected. Equivalent — not a test gap.
  • dead-code — the mutated statement sits in a branch NO caller reaches (a guard/edge never taken).
    Equivalent AND a cleanup signal — return a \`cleanup\` of \`file:line — what to remove\`.
  • masked — a fallback / \`else\` / \`?? default\` reproduces the same observable result, so no assertion can
    distinguish the mutant. Equivalent.
  • REAL-gap — a genuine behaviour the suite missed. The ONLY tag that should drive another Cover iteration.
    Use it ONLY after you FAIL to prove the mutant equivalent/dead/masked — never as a default.

Give a one-line \`reason\` for EVERY verdict (it is required). Return
  { "classifications": [ { "index": I, "line": N, "tag": "...", "reason": "...", "cleanup": "file:line — ..." }, ... ] }
with one entry per survivor listed above — copy each \`index\` EXACTLY as shown so two survivors on one line never collide.`
}

// =================================================================================================
// PHASE 4: REPORT + KB FLIP (on all-gates-green)
// =================================================================================================
phase('Report')
const allGatesGreen = coverResult.stopped === 'all-gates-green'
const achievedScore = coverResult.achievedScore ?? 0
const candidateBugs = coverResult.redOnCurrent ?? []

if (allGatesGreen) {
  const flippedKb = serializeKb(mineVerifyResult.consensusRules, mineVerifyResult.interpretiveVerdicts, {
    targetClass: TARGET_CLASS, relpath, date: today, mutationGated: true,
    runNote: `${achievedScore}% reachable kill, floor ${MUTATION_FLOOR} cleared, ${candidateBugs.length} candidate bug${candidateBugs.length !== 1 ? 's' : ''}`,
  })
  const kbEntryFile = KB_RULES.split('\\').pop()
  const KB_FLIP_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
  await agent(
    `You are the KB-FLIP agent. Write EXACTLY this content to ${KB_RULES} — no changes:\n\n${flippedKb}\n\nThen, IF ${KB_INDEX} exists, find the row for \`${kbEntryFile}\` and set its Status to "mutation-gated" (if there is no such row or no index file, skip silently). Return { "written": true }.`,
    { label: 'kb-flip', phase: 'Report', schema: KB_FLIP_SCHEMA, model: MODEL },
  )
  log('KB flipped to mutation-gated.')
} else {
  log(`Cover did not reach all-gates-green (${coverResult.stopped}). KB stays at verified.`)
}

const gateRows = coverResult.gates
  ? Object.entries(coverResult.gates).map(([name, g]) => `| ${name} | ${g.pass ? 'PASS' : 'FAIL'} | ${typeof g.detail === 'string' ? g.detail : (g.detail?.scorePct !== undefined ? `${g.detail.scorePct}%` : JSON.stringify(g.detail).slice(0, 90))} |`).join('\n')
  : '| — | — | Cover did not reach gate evaluation — see stopped reason |'
// --- Survivor classification (Report-stage enhancement: structured, repeatable run output) -------------
// Runs on the FINAL iteration's residual survivors (after expectedSurvivorLines exclusions are known) so the
// tagged set does not shrink run-over-run. The orchestrator pre-tagged equivalent-logging (cover-flutter,
// pure); a source-aware classify-survivors agent assigns the source-dependent tags
// (equivalent-format / dead-code / masked / REAL-gap) to the rest — the orchestrator only RECORDS its verdict.
const survivors = coverResult.gates?.mutation_floor?.detail?.reachableSurvivors ?? []
const toClassify = survivors.filter((s) => !s.tag) // un-pre-tagged → need source to classify
// Key the agent's verdicts by the survivor's INDEX in `toClassify`, NOT by source line: two survivors can
// share one line (e.g. two mutators on the same `&&`), and a line key lets the last verdict clobber the first
// (F2 — last-verdict-wins collision). The agent echoes the index back; the merge below walks survivors in the
// SAME order `toClassify` was built (filter preserves order), so a running counter recovers each index.
const classifyByIndex = new Map()
// Q2: spawn only when there are residual survivors (skipped on the empty-survivor path); additionally skip the
// agent when every survivor is already pre-tagged (nothing source-dependent left to classify).
if (survivors.length > 0 && toClassify.length > 0) {
  const classifyResult = await agent(classifySurvivorsPrompt(toClassify), {
    label: 'classify-survivors', phase: 'Report', schema: CLASSIFY_SURVIVORS_SCHEMA, model: MODEL,
  })
  for (const c of classifyResult?.classifications ?? []) classifyByIndex.set(c.index, c)
}
// Merge pre-tags + the agent's verdicts into one tagged list (orchestrator records; never derives source tags).
let nextClassifyIndex = 0
const taggedSurvivors = survivors.map((s) => {
  if (s.tag) return { line: s.line, mutatorName: s.mutatorName, replacement: s.replacement, status: s.status, tag: s.tag }
  const idx = nextClassifyIndex++
  const c = classifyByIndex.get(idx)
  if (!c) {
    // No verdict for an un-pre-tagged survivor → the classify agent did not respond for it. `unclassified` is
    // a LOUD, logged terminal state (never a silent default, and NEVER REAL-gap): it flags that the Report
    // carries a survivor the classify step never covered, so the operator must look.
    log(`WARNING (classify): no verdict for residual survivor #${idx} (line ${s.line}, ${s.mutatorName}) — recording tag 'unclassified' (classify-agent non-response; terminal state).`)
    return { line: s.line, mutatorName: s.mutatorName, replacement: s.replacement, status: s.status, tag: 'unclassified' }
  }
  return { line: s.line, mutatorName: s.mutatorName, replacement: s.replacement, status: s.status, tag: c.tag, reason: c.reason, cleanup: c.cleanup }
})
const survivorsSection = taggedSurvivors.length
  ? taggedSurvivors.map((m) => `- Line ${m.line}: ${m.mutatorName} \`${m.replacement}\` (${m.status}) — **${m.tag}**${m.reason ? ` — ${m.reason}` : ''}`).join('\n')
  : '_No reachable survivors._'
// Implied cleanups: dead-code + always-equivalent (logging/format) survivors are removable/buggy-code signals.
const EQUIVALENT_TAGS = new Set(['equivalent-logging', 'equivalent-format'])
const impliedCleanups = taggedSurvivors
  .filter((s) => s.tag === 'dead-code' || EQUIVALENT_TAGS.has(s.tag))
  .map((s) => (s.cleanup
    ? `- ${s.cleanup}`
    : `- \`${relpath}:${s.line}\` — ${s.tag === 'dead-code' ? 'dead branch; candidate removal' : 'equivalent mutant; redundant code / add to expectedSurvivorLines'} (${s.mutatorName})`))
const impliedCleanupsSection = impliedCleanups.length ? impliedCleanups.join('\n') : '_None — no dead-code or equivalent survivors._'
// expectedSurvivorLines suggestion: the equivalent (logging/format) lines, so a follow-up run is honest.
const suggestedLines = [...new Set(taggedSurvivors.filter((s) => EQUIVALENT_TAGS.has(s.tag)).map((s) => s.line))].sort((a, b) => a - b)

const reportContent = `# Cover run (Flutter) — ${TARGET_CLASS} (${today})

**Controller:** \`harness/loop-flutter.workflow.js\` (Inc 4 — Flutter Mine→Verify→Cover, one invocation)
**Target:** \`${SRC}\`
**Mutation tool:** mutation_test (regex) driving \`flutter test\`. **Clean-room:** PROMPT-ONLY.

## Result

| Field | Value |
|-------|-------|
| Stopped | ${coverResult.stopped} |
| Iterations | ${coverResult.iter ?? '?'} |
| Achieved score | ${achievedScore}% reachable kill |
| Floor | ${MUTATION_FLOOR} |
| Model | ${MODEL} |
| Run cost (marginal) | ${runSpent().toLocaleString()} output tokens — THIS run |
| Date | ${today} |

## Gate Battery (§6)

| Gate | Result | Detail |
|------|--------|--------|
${gateRows}

## Residual Survivors

_Classified on the FINAL iteration's residual survivors (after \`expectedSurvivorLines\` exclusions are known), so the tags do not shrink run-over-run. Only \`REAL-gap\` should drive another Cover iteration._

${survivorsSection}

## Implied cleanups

${impliedCleanupsSection}

**\`expectedSurvivorLines\` suggestion:** \`expectedSurvivorLines: [${suggestedLines.join(', ')}]\` — add the equivalent (logging/format) lines so a follow-up run reports an honest reachable kill rate.

## Candidate Bugs (red-on-current tests kept, never deleted)

${candidateBugs.length ? candidateBugs.map((b) => `- \`${b.test}\`${b.note ? ` — ${b.note}` : ''}`).join('\n') : '_None._'}

## Mine→Verify Summary

- Consensus rules: ${mineVerifyResult.consensusRules.length}
- KB: \`${KB_RULES}\` (${allGatesGreen ? 'mutation-gated' : 'verified'})

## Notes

- mutation_test is regex-based: equivalent mutants (log-line / consistent-key-format) may survive — exclude by reasoning via expectedSurvivorLines, do not chase.
- Written automatically by the controller (no manual assembly).
`
const REPORT_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
await agent(
  `You are the REPORT-WRITE agent. Write EXACTLY this content to ${REPORT_PATH} — no changes:\n\n${reportContent}\n\nReturn { "written": true }.`,
  { label: 'report-write', phase: 'Report', schema: REPORT_SCHEMA, model: MODEL },
)
log(`Report written: ${REPORT_PATH}`)

return {
  variant: 'inc4-loop-flutter',
  target: { class: TARGET_CLASS, source: SRC },
  mineVerify: { consensusRules: mineVerifyResult.consensusRules.length },
  cover: coverResult,
  allGatesGreen,
  achievedScore,
  kbPath: KB_RULES,
  reportPath: REPORT_PATH,
  runCostMarginal: runSpent(),
  outputTokensThisTurn: budget.spent(),
}
