// recall-score.mjs — the harness's deterministic recall-scoring helper (Increment 1, Step 3).
//
// Design §3 (orchestrator-scores-only): the golden set is visible to exactly ONE actor — the
// orchestrator — which never mines. This helper runs orchestrator-side, AFTER Mine, and is the only
// place golden text is read. It is NEVER passed into the mining Workflow, and a miner/verifier never
// imports it.
//
// Architect Q3 enforcement (binding for Step 3): this helper is a PURE pairing fn + recall
// computation FROM A SUPPLIED VERDICT MAP. The substance-match itself is semantic (golden-set.md:54:
// "matches the golden rule's substance ... regardless of wording"), so the *pairing* is deterministic
// here but the *match verdict* is a scoped LLM judge call made orchestrator-side at Step 4 — that
// judge is NOT in this module and NOT in its unit test. Keeping the LLM out keeps the tested contract
// deterministic.
//
//   parseGoldenSubset(md, ids)            -> [{ id, rule }]      (golden text -> structured subset)
//   buildPairingPacket(golden, consensus) -> { pairs: [...] }    (deterministic packet for the judge)
//   computeRecall(golden, verdictMap)     -> { recall, ... }     (recall from a supplied verdict map)
//
// Pure functions only; the CLI at the bottom is a thin wrapper for the Step-4 run.

import { readFileSync } from 'node:fs';

/**
 * Extract exactly the requested golden ids (with their rule substance) from a golden-set.md table.
 * Orchestrator-side only. Fails loud if a requested id is absent — a silently dropped golden rule
 * would inflate recall (the denominator must be the full requested subset).
 *
 * @param {string} markdown  Raw golden-set.md text (read orchestrator-side, never by an agent).
 * @param {string[]} ids     Golden ids to extract, e.g. ['GOLD-16','GOLD-17','GOLD-18'].
 * @returns {{id: string, rule: string}[]}
 */
export function parseGoldenSubset(markdown, ids) {
  const wanted = new Set(ids);
  const found = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    // Match a markdown table row whose first cell is a golden id: | GOLD-NN | rule | ... |
    const m = line.match(/^\s*\|\s*(GOLD-\d+)\s*\|\s*(.*?)\s*\|/);
    if (m && wanted.has(m[1]) && !found.has(m[1])) {
      found.set(m[1], m[2]);
    }
  }
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    throw new Error(`parseGoldenSubset: golden id(s) not found in the supplied text: ${missing.join(', ')}`);
  }
  // Preserve the caller's id order.
  return ids.map((id) => ({ id, rule: found.get(id) }));
}

/**
 * Build the deterministic pairing packet for the semantic judge. Each golden rule is paired with
 * ALL consensus candidates (carried inline) — the helper does NOT pre-filter by similarity, because
 * the substance match is the judge's semantic call (Q3). The judge receives golden + consensus inline
 * and returns a verdict map (see computeRecall).
 *
 * @param {{id: string, rule: string}[]} golden       The golden subset (from parseGoldenSubset).
 * @param {{id: string, statement: string}[]} consensus  The Workflow's consensus rules.
 * @returns {{ pairs: { goldenId: string, goldenRule: string, candidates: {id: string, statement: string}[] }[] }}
 */
export function buildPairingPacket(golden, consensus) {
  const candidates = consensus.map((c) => ({ id: c.id, statement: c.statement }));
  return {
    pairs: golden.map((g) => ({
      goldenId: g.id,
      goldenRule: g.rule,
      candidates,
    })),
  };
}

/**
 * Compute recall (and the matched/unmatched breakdown) from a SUPPLIED verdict map. The verdict map
 * is the judge's output: { [goldenId]: { matched: boolean, consensusId?: string } }. A golden id
 * absent from the map counts as unmatched (the judge returning nothing for a rule is a miss, never a
 * crash). The denominator is the golden subset length — never the verdict map's size.
 *
 * @param {{id: string, rule: string}[]} golden  The golden subset (the denominator).
 * @param {Record<string, { matched: boolean, consensusId?: string }>} verdictMap  Judge output.
 * @returns {{ recall: number, total: number, matchedCount: number, matched: string[], unmatched: string[], matchedPairs: {goldenId: string, consensusId: string|null}[] }}
 */
export function computeRecall(golden, verdictMap) {
  const matched = [];
  const unmatched = [];
  const matchedPairs = [];
  for (const g of golden) {
    const v = verdictMap[g.id];
    if (v && v.matched) {
      matched.push(g.id);
      matchedPairs.push({ goldenId: g.id, consensusId: v.consensusId ?? null });
    } else {
      unmatched.push(g.id);
    }
  }
  const total = golden.length;
  return {
    recall: total ? matched.length / total : 0,
    total,
    matchedCount: matched.length,
    matched,
    unmatched,
    matchedPairs,
  };
}

// --- Thin CLI -------------------------------------------------------------------------------------
// Two orchestrator-side modes for the Step-4 run. The golden PATH is supplied at run time and is
// NEVER committed (it is the sequestered answer key in the sibling sprint-rituals repo).
//
//   --pair  --golden <golden-set.md> --ids GOLD-16,GOLD-17,GOLD-18 --consensus <consensus.json>
//           -> prints the pairing packet (feed to the judge).
//   --score --golden <golden-set.md> --ids GOLD-16,GOLD-17,GOLD-18 --verdicts <verdict-map.json>
//           -> prints the recall report.
//
// --consensus / --verdicts may be a file path or '-' for stdin.
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
    else out._.push(a);
  }
  return out;
}

function readJson(pathOrDash) {
  const text = pathOrDash === '-' ? readFileSync(0, 'utf8') : readFileSync(pathOrDash, 'utf8');
  return JSON.parse(text);
}

function main(argv) {
  const args = parseArgs(argv);
  const ids = typeof args.ids === 'string' ? args.ids.split(',').map((s) => s.trim()).filter(Boolean) : [];
  if (!args.golden || !ids.length) {
    process.stderr.write(
      'usage: recall-score.mjs --pair|--score --golden <golden-set.md> --ids GOLD-16,... ' +
        '[--consensus <file|->] [--verdicts <file|->]\n',
    );
    process.exit(2);
  }
  const golden = parseGoldenSubset(readFileSync(args.golden, 'utf8'), ids);

  if (args.pair) {
    const consensus = readJson(typeof args.consensus === 'string' ? args.consensus : '-');
    const rules = Array.isArray(consensus) ? consensus : consensus.consensusRules ?? [];
    process.stdout.write(JSON.stringify(buildPairingPacket(golden, rules), null, 2) + '\n');
    return;
  }
  if (args.score) {
    const verdictMap = readJson(typeof args.verdicts === 'string' ? args.verdicts : '-');
    process.stdout.write(JSON.stringify(computeRecall(golden, verdictMap), null, 2) + '\n');
    return;
  }
  process.stderr.write('error: choose --pair or --score\n');
  process.exit(2);
}

// Run as CLI only when invoked directly (not when imported by the test).
import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2));
}
