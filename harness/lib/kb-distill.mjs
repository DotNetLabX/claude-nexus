// kb-distill.mjs — the two-layer KB distillation + token-budget lint (adhoc-SddMergeGen, Step 3).
//
// Proposal §C (two-layer KB, owner correction 2026-07-03): the KB's consumption model is not uniform.
// The HOT layer is loaded/cached into every agent's context — it must stay distilled and TOKEN-BUDGETED
// (kb-sync's `MAX_GLOSSARY_ENTRIES: 500` guards the same failure). The COLD layer is the full BR ledgers
// (Step 2's registry), read on demand when working on that class/spec. A distillation stage compresses
// each ledger to one-line rule-CLUSTER rows + a pointer to the ledger; a budget lint fails the sync when
// the hot layer exceeds its token ceiling.
//
// Cluster = same symbol + layer (per the plan). A cluster's one-line hot row NEVER carries the full rule
// statement/body — only the cluster identity, rule count, and a pointer back to the cold-layer ledger.
//
// PURE — no fs, no LLM. The caller does the actual file I/O; this lib only computes the hot-layer rows
// and the rendered distillate text.

// Rough, deterministic token estimate (no tokenizer dependency in this pure lib) — 4 chars/token, the
// same coarse ratio kb-sync-style budgets use for a fast, dependency-free ceiling check. This is an
// ESTIMATE for the lint gate, not a billing-accurate count.
const CHARS_PER_TOKEN = 4;

// Default hot-layer token ceiling — overridable per call (never hardcoded past the lint call site).
export const DEFAULT_TOKEN_CEILING = 2000;

function clusterKey(row) {
  return `${row?.symbol ?? row?.canonicalName ?? ''}|${row?.layer ?? ''}`;
}

function estimateTokens(text) {
  return Math.ceil((text ?? '').length / CHARS_PER_TOKEN);
}

/**
 * Distill a class's registry rows (Step 2 output) into hot-layer rows — one per (symbol, layer)
 * cluster — plus a resolving pointer back to the cold-layer ledger.
 *
 * @param {{className:string, rows:Array<object>, ledgerPath:string}} opts
 * @returns {{hotRows:Array<{cluster:string, layer:string, ruleCount:number, pointer:string, line:string}>,
 *   renderedDistillate:string}}
 */
export function distillRegistry({ className, rows = [], ledgerPath } = {}) {
  const clusters = new Map();
  for (const row of rows) {
    const key = clusterKey(row);
    const existing = clusters.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      clusters.set(key, { symbol: row?.symbol ?? row?.canonicalName, layer: row?.layer, count: 1 });
    }
  }

  const hotRows = [];
  for (const { symbol, layer, count } of clusters.values()) {
    const cluster = symbol ?? '(unnamed)';
    // ONE LINE ONLY — no embedded newline, no full rule statement/body (Slice-1b / Slice-3 invariants).
    const line = `- ${cluster} [${layer ?? 'unlayered'}]: ${count} rule${count !== 1 ? 's' : ''} — see ${ledgerPath}`;
    hotRows.push({ cluster, layer, ruleCount: count, pointer: ledgerPath, line });
  }

  const renderedDistillate = [
    `## ${className} — hot-layer distillate`,
    '',
    ...hotRows.map((r) => r.line),
  ].join('\n');

  return { hotRows, renderedDistillate };
}

/**
 * Lint a rendered hot-layer text against a token ceiling. Fail-closed: exceeding the ceiling is a
 * lint FAILURE, never a silent truncation — the sync must not silently bloat the always-loaded context.
 *
 * @param {{hotText:string, ceiling?:number}} opts
 * @returns {{pass:boolean, estimatedTokens:number, ceiling:number}}
 */
export function lintTokenBudget({ hotText = '', ceiling = DEFAULT_TOKEN_CEILING } = {}) {
  const estimatedTokens = estimateTokens(hotText);
  return { pass: estimatedTokens <= ceiling, estimatedTokens, ceiling };
}
