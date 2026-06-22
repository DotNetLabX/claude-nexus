// Mine -> batched-Verify Workflow (harness Increment 1).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/mine-verify.workflow.js" }).
//
// This is the harness's first durable component. It proves the design's load-bearing cost fix
// (mine-verify-automation-design.md §2): the verifier is BATCHED + SLICED, not fanned out per rule.
//
//   Mine        -> 3 clean-room miners, source-only (clean-room is PROMPT-enforced this increment;
//                  the disallowedTools mechanical seal is Increment 3 — design §3 / ADR-13).
//   Consolidate -> merge the 3 miner outputs into consensus rules with agreement counts,
//                  a consistency string, contradictions, and transcribed/interpretive triage.
//   Verify      -> ONE slicer reads the source ONCE and emits a per-rule code slice (+/- ~15 lines);
//                  interpretive rules are verified in BATCHES of ~5 (rule + slice inline), so each
//                  verifier reads ZERO files and the call count is ~ceil(interpretive/5);
//                  transcribed rules get a single batched quote-entailment check.
//
// The Mine + Consolidate + single-slicer shape is reused from the proven spike
// (<session>/workflows/scripts/mine-verify-bugratio-spike-*.js). The BATCHED verifier is the new
// build for this increment — the spike fanned out one verifier per rule (35-way), which tripped a
// server rate limit and re-loaded context per rule; batching is the corrected shape (design §2).
//
// The orchestrator NEVER reads the golden set — recall is scored separately by
// harness/lib/recall-score.mjs, orchestrator-side, after this Workflow returns (design §3).

// meta MUST be the first statement (Workflow tool requirement).
export const meta = {
  name: 'mine-verify-bugratio',
  description: 'Harness Inc 1 (Inc-3 parameterized): clean-room Mine (3 samples) + triage + BATCHED sliced Verify. Target from args.src when provided; defaults to BugRatioAnalyzer (back-compat). Returns consensus rules + verdicts + counts + a token cost signal.',
  phases: [
    { title: 'Mine', detail: '3 clean-room miners, source-only (prompt-enforced)' },
    { title: 'Consolidate', detail: 'merge + agreement + consistency + transcribed/interpretive triage' },
    { title: 'Verify', detail: 'slice once; interpretive verified in batches of ~5 (slice inline); transcribed quote-checked' },
  ],
}

// --- Target ---------------------------------------------------------------------------------------
// Pilot target. Mirrors harness/targets/bugratio.json (kept inline so the Workflow is self-contained
// when run by the platform Workflow tool, which executes this file directly).
//
// Inc-3 parameterization: if the Workflow runtime injects an `args` global (unverified — Step-1/8
// bringup check), the controller passes { src } to retarget. Default to the BugRatio consts so
// standalone invocations (`Workflow({ scriptPath })` without a 2nd arg) are back-compatible.
// Fallback (if `args` injection is absent): the defaults below reproduce current behavior unchanged;
// the controller can parameterize via a different mechanism — see loop.workflow.js header.
const _args = (typeof args !== 'undefined' && args) ? args : {}
const SRC = _args.src ?? 'D:\\src\\sprint-rituals\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\BugRatioAnalyzer.cs'
const BATCH_SIZE = 5 // interpretive rules per batched verifier call (design §2: cluster ~5/call).

// --- Schemas --------------------------------------------------------------------------------------
const MINER_SCHEMA = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement: { type: 'string' },
          quote: { type: 'string' },
          lines: { type: 'string' },
        },
        required: ['statement', 'quote', 'lines'],
      },
    },
  },
  required: ['rules'],
}

const CONSOLIDATE_SCHEMA = {
  type: 'object',
  properties: {
    consistencyScore: { type: 'string' },
    contradictions: { type: 'array', items: { type: 'string' } },
    consensusRules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          statement: { type: 'string' },
          quote: { type: 'string' },
          lines: { type: 'string' },
          agreement: { type: 'integer' },
          kind: { type: 'string', enum: ['transcribed', 'interpretive'] },
        },
        required: ['id', 'statement', 'quote', 'lines', 'agreement', 'kind'],
      },
    },
  },
  required: ['consistencyScore', 'contradictions', 'consensusRules'],
}

const SLICE_SCHEMA = {
  type: 'object',
  properties: {
    slices: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, slice: { type: 'string' } },
        required: ['id', 'slice'],
      },
    },
  },
  required: ['slices'],
}

// A batched verifier returns one verdict per rule in its batch.
const BATCH_VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['CONFIRMED', 'WRONG', 'IMPRECISE'] },
          evidence: { type: 'string' },
        },
        required: ['id', 'verdict', 'evidence'],
      },
    },
  },
  required: ['verdicts'],
}

const TRANSCRIBED_SCHEMA = {
  type: 'object',
  properties: {
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, reason: { type: 'string' } },
        required: ['id', 'reason'],
      },
    },
  },
  required: ['failures'],
}

// --- Helpers --------------------------------------------------------------------------------------
function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// --- Phase: Mine ----------------------------------------------------------------------------------
// Clean-room is PROMPT-enforced this increment (Inc-1 scope; mechanical seal is Inc 3).
const minerPrompt = `You are a clean-room business-rule miner.
Read ONLY this one source file: ${SRC}
Do NOT read any other file — no docs/, no tests, no knowledge base, no golden set, no other source. Extract rules from this code alone.

For every business rule the code ENCODES:
- Quote-first: capture the verbatim code quote in \`quote\` and its line range in \`lines\`. No quote -> drop the rule.
- The \`statement\` is DURABLE KB prose: describe the rule by SYMBOL and CONDITION (method/property/variable names + the actual predicate), NEVER by source line number. Do NOT write "L35", "line 76", "lines 48/145", or similar inside \`statement\` — line numbers rot the moment the file changes and belong ONLY in the structural \`lines\` field. To point at a site, name it by its symbol (e.g. "the team-totals aggregation"), not its line.
- Be exhaustive across branches: main computations, every guard/degenerate branch, clamps, boundary inclusivity, aggregation semantics (ratio-of-totals vs average-of-ratios), case-sensitivity of EACH string comparison, ordering/tie behavior, rounding, and streak/loop termination.
- State only what the code does. Never infer intent the code does not show.

Return the full rule list.`

phase('Mine')
const miners = await parallel([
  () => agent(minerPrompt, { label: 'miner-1', phase: 'Mine', schema: MINER_SCHEMA }),
  () => agent(minerPrompt, { label: 'miner-2', phase: 'Mine', schema: MINER_SCHEMA }),
  () => agent(minerPrompt, { label: 'miner-3', phase: 'Mine', schema: MINER_SCHEMA }),
])
const valid = miners.filter(Boolean)
log(`Mine: ${valid.length}/3 miners returned; rule counts = ${valid.map((m) => m.rules.length).join(', ')}`)
if (!valid.length) throw new Error('Mine failed: no miner returned a valid rule set')

// --- Phase: Consolidate + triage ------------------------------------------------------------------
phase('Consolidate')
const consolidatePrompt = `You are the consolidation + triage step. Three independent clean-room miners extracted rules from the same source file (${SRC}). Their outputs:

MINER 1:
${JSON.stringify(valid[0]?.rules ?? [], null, 1)}

MINER 2:
${JSON.stringify(valid[1]?.rules ?? [], null, 1)}

MINER 3:
${JSON.stringify(valid[2]?.rules ?? [], null, 1)}

Produce the consensus rule set:
- Merge semantically-equivalent rules (wording differs, same behavior = one rule). Give each a stable id BR-1, BR-2, ... and an agreement count = in how many of the 3 miners it appeared.
- consistencyScore: a short string, e.g. "20 rules in all 3, 4 in 2, 3 in 1".
- contradictions: any rule where the miners disagree on BEHAVIOR (not just wording); [] if none.
- Classify each consensus rule's kind:
  - "transcribed" = a formula/value lifted directly from code where the quote alone entails it (band math, sums, a ratio expression).
  - "interpretive" = a claim needing judgment: guard reachability / dead code, branch discontinuity, aggregation semantics, case-sensitivity asymmetry, ordering/tie behavior, streak/loop termination, "never reaches X" claims.
Keep the verbatim quote + line range in the quote/lines fields on each consensus rule. The consensus \`statement\`, however, must be LINE-NUMBER-FREE durable prose — refer to code by SYMBOL/CONDITION (names, predicates), never "L35"/"line 76"/"lines 48". If a miner statement embeds line numbers, rewrite it to name the site by its symbol. Line numbers live ONLY in the \`lines\` field, never in \`statement\`.`
const consensus = await agent(consolidatePrompt, { label: 'consolidate', phase: 'Consolidate', schema: CONSOLIDATE_SCHEMA })
if (!consensus) throw new Error('consolidation failed')

const interpretive = consensus.consensusRules.filter((r) => r.kind === 'interpretive')
const transcribed = consensus.consensusRules.filter((r) => r.kind === 'transcribed')
log(
  `Triage: ${consensus.consensusRules.length} consensus rules -> ${interpretive.length} interpretive (batched verify), ` +
    `${transcribed.length} transcribed (quote-check only). ${consensus.consistencyScore}`,
)

// --- Phase: Verify (BATCHED + SLICED) -------------------------------------------------------------
// 1) Slice the source ONCE (one full-file read for the whole verify phase).
phase('Verify')
const sliceReq = interpretive.map((r) => `${r.id} (lines ${r.lines}): ${r.statement.slice(0, 130)}`).join('\n')
const sliced = interpretive.length
  ? await agent(
      `Read ${SRC} exactly ONCE. For each rule below, return a verbatim code slice covering its stated line range PLUS about 15 lines of context above and below (enough to independently judge the rule). Preserve line numbers in each slice.

${sliceReq}`,
      { label: 'slicer', phase: 'Verify', schema: SLICE_SCHEMA },
    )
  : { slices: [] }
const sliceById = Object.fromEntries((sliced?.slices ?? []).map((s) => [s.id, s.slice]))

// 2) BATCHED verify: cluster ~5 interpretive rules + their slices into ONE call (design §2).
//    Interpretive verifiers judge ONLY from inline slices — ZERO file reads. Call count is
//    ceil(interpretive / BATCH_SIZE), NOT one-per-rule (the spike's rate-limit/cost failure).
//    Transcribed verifiers judge from inline quotes (step 3 below) — also ZERO file reads.
//    Mechanical sealing (disallowedTools) is Increment 3 for all agent types (miners + verifiers);
//    this increment all agents are prompt-instructed not to read files.
const batches = chunk(interpretive, BATCH_SIZE)
const batchResults = await parallel(
  batches.map((batch, bi) => () => {
    const rulesBlock = batch
      .map(
        (r) => `--- Rule ${r.id} ---
Statement: ${r.statement}
Claimed evidence: ${r.quote} (lines ${r.lines})
CODE SLICE (lines ${r.lines} +/- context):
${sliceById[r.id] ?? '(no slice returned -> verdict IMPRECISE: missing context)'}`,
      )
      .join('\n\n')
    return agent(
      `You are an independent skeptic verifying a BATCH of extracted rules. Do NOT read any file — judge ONLY against the code slice provided inline with each rule. Collaborative refutation: for EACH rule, actively look for where it is WRONG or IMPRECISE; cite exact lines from that rule's slice as counter-evidence. Default-skeptical — if a rule's slice does not fully support its claim, say so.

Return one verdict (CONFIRMED / WRONG / IMPRECISE) per rule, keyed by the rule id, with evidence (and the correction if WRONG/IMPRECISE).

${rulesBlock}`,
      { label: `verify:batch-${bi + 1}`, phase: 'Verify', schema: BATCH_VERDICT_SCHEMA },
    )
  }),
)
const verdicts = batchResults.filter(Boolean).flatMap((b) => b.verdicts ?? [])

// 3) Transcribed rules: a SINGLE batched quote-entailment check (no per-rule fan-out).
//    The verbatim quote is INLINE in the prompt — no file read needed or permitted.
const transcribedCheck = transcribed.length
  ? await agent(
      `Quote-entailment check. For each transcribed rule below, the verbatim quote is provided inline. Judge ONLY from the inline quote — do NOT read any file. Return ONLY the rules that FAIL entailment (where the inline quote does not entail the stated rule).

${transcribed.map((r) => `${r.id}: ${r.statement}\n  quote: ${r.quote} (lines ${r.lines})`).join('\n')}`,
      { label: 'verify:transcribed-batch', phase: 'Verify', schema: TRANSCRIBED_SCHEMA },
    )
  : { failures: [] }

// --- Return: consensus rules + verdicts + counts + cost signal ------------------------------------
const tally = (k) => verdicts.filter((x) => x.verdict === k).length
log(
  `Verify: ${batches.length} batched call(s) for ${interpretive.length} interpretive rules ` +
    `(batch size ${BATCH_SIZE}); ${transcribed.length ? 1 : 0} transcribed batch call.`,
)
return {
  variant: 'inc1-batched-sliced',
  target: { class: _args.targetClass ?? 'BugRatioAnalyzer', source: SRC },
  consistencyScore: consensus.consistencyScore,
  contradictions: consensus.contradictions,
  counts: {
    miners: valid.length,
    consensusRules: consensus.consensusRules.length,
    transcribed: transcribed.length,
    interpretive: interpretive.length,
    batchSize: BATCH_SIZE,
    verifyBatchCalls: batches.length, // interpretive batched calls
    transcribedBatchCalls: transcribed.length ? 1 : 0,
    verifyCallsTotal: batches.length + (transcribed.length ? 1 : 0) + (interpretive.length ? 1 : 0), // + slicer
    slicesReturned: (sliced?.slices ?? []).length,
    confirmed: tally('CONFIRMED'),
    imprecise: tally('IMPRECISE'),
    wrong: tally('WRONG'),
    transcribedEntailmentFailures: transcribedCheck.failures.length,
  },
  // consensusRules are returned WITHOUT the golden set anywhere — recall is scored separately,
  // orchestrator-side, by harness/lib/recall-score.mjs (design §3).
  consensusRules: consensus.consensusRules.map((r) => ({
    id: r.id,
    kind: r.kind,
    agreement: r.agreement,
    lines: r.lines,
    statement: r.statement,
  })),
  interpretiveVerdicts: verdicts,
  transcribedFailures: transcribedCheck.failures,
  outputTokensThisTurn: budget.spent(),
}
