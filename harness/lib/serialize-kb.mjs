// serialize-kb.mjs — the Flutter/Dart controller's KB row serializer.
//
// F6-MineMachineryHardening (R2, M1 critic fold): this function previously existed ONLY inline in
// harness/loop-flutter.workflow.js:88-110 — a Workflow script cannot `import`, so nothing exercised
// it under `node --test`. This lib is now the SOURCE OF TRUTH; loop-flutter.workflow.js keeps a
// byte-identical inline mirror (Workflow scripts still cannot import — same pattern as
// harness/lib/kb-write.mjs's buildRulesSection + its harness/loop.workflow.js inline mirror).
//
// Pure, deterministic — no filesystem I/O, no LLM.
import { stripLineRefs, buildVerifyExcerpt } from './kb-write.mjs';

// Serialize the verified rules into the consuming-app KB markdown (the build-zpl-code.md shape).
// Each rule becomes a bullet: `- {id}: {statement}` (+ agreement annotation below 3/3), plus an
// indented `  - verify: {excerpt}` sub-bullet when the rule carries verifier evidence
// (F6-MineMachineryHardening R2 / D2 row shape — same contract as kb-write.mjs's buildRulesSection).
export function serializeKb(rules, verdicts, opts) {
  const tally = (k) => (verdicts ?? []).filter((v) => v.verdict === k).length
  const summary = `${rules.length} rules; ${tally('CONFIRMED')} CONFIRMED, ${tally('IMPRECISE')} IMPRECISE, ${tally('WRONG')} WRONG`
  const ruleLines = rules
    .map((r) => {
      const line = `- ${r.id}: ${r.statement}${r.agreement < 3 ? ` _(agreement ${r.agreement}/3)_` : ''}`
      const excerpt = buildVerifyExcerpt(r.evidence)
      return excerpt ? `${line}\n  - verify: ${excerpt}` : line
    })
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
