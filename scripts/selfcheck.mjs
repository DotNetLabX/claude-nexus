#!/usr/bin/env node
// selfcheck.mjs — one local command that runs every mechanical wiring check the way CI does,
// with a PASS/FAIL line per check and a nonzero exit on any failure. Dev-repo machinery ONLY —
// never shipped, never bumped (same posture as bump-plugin / gen-*). It mirrors the CI gate's
// checks for fast local feedback; it adds no enforcement CI doesn't already have.
//
// Usage:  node scripts/selfcheck.mjs [--base <ref>]
//   --base <ref>   base ref for the version-bump check (default: origin/main; forwarded to
//                  bump-plugin.mjs, which itself falls back to HEAD~1 if the ref is absent).
//
// Checks, in order:
//   1. node --test (lint + unit)            — the CI hard gate (T1 + T2)
//   2. gen-commands drift                    — regen, then `git diff --exit-code` over commands/
//   3. gen-omni --check                      — the private twin is in sync
//   4. bump-plugin --check                   — a shipped-surface change carries a version bump
//   5. salience report                       — INFORMATIONAL: printed, never fails the run (Q1)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : 'origin/main';

// Run a command, capturing combined output and the exit status. Never throws.
function exec(cmd, cmdArgs, opts = {}) {
  try {
    const stdout = execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    return { status: 0, output: stdout };
  } catch (e) {
    return { status: e.status ?? 1, output: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

// Each check returns { ok, detail }. The shell calls are the real CI commands.
const checks = [
  {
    name: 'tests (lint + unit)',
    run: () => {
      // The bare-dir form (`--test tests/lint`) regressed on Node ≥22 (treats the dir as a module);
      // the glob form is what the README + CI use.
      const r = exec(node, ['--test', 'tests/lint/*.test.mjs', 'tests/unit/*.test.mjs']);
      const m = r.output.match(/# fail (\d+)/) || r.output.match(/fail (\d+)/);
      const detail = m ? `${m[1]} failing` : (r.status === 0 ? 'all passing' : 'see output');
      return { ok: r.status === 0, detail };
    },
  },
  {
    name: 'gen-commands drift',
    run: () => {
      // Working-tree-aware: the question is "are commands consistent with the CURRENT agents?",
      // not "are commands committed?". A `git diff --exit-code` vs the index/HEAD always fires at the
      // developer's pre-commit stop — agent edits AND their regen'd commands are both uncommitted by
      // design (ADR-18, the developer never commits) — a documented false-positive that once bounced a
      // developer for ~125k tokens. So gate on whether REGEN itself introduces drift: snapshot the
      // commands' working-tree CONTENT, regen, and compare. Equal ⇒ in sync (commands already match
      // agents, committed or not); changed ⇒ genuine drift (an agent edited whose command wasn't regen'd).
      // Snapshot CONTENT (`git diff`), not status flags: a `git status --porcelain` snapshot is
      // byte-identical before/after when an already-dirty command's content changes but its ` M` flag
      // doesn't — which would false-pass genuine drift. `git diff` is content-sensitive.
      const snap = () => exec('git', ['diff', '--', 'plugins/nexus/commands']).output;
      const before = snap();
      const regen = exec(node, ['scripts/gen-commands.mjs', 'nexus']);
      if (regen.status !== 0) return { ok: false, detail: 'gen-commands failed to run' };
      const ok = snap() === before;
      return { ok, detail: ok ? 'in sync' : 'commands/ differ from agents/ — run gen-commands' };
    },
  },
  {
    name: 'gen-omni --check',
    run: () => {
      const r = exec(node, ['scripts/gen-omni.mjs', '--check']);
      return { ok: r.status === 0, detail: r.status === 0 ? 'twin in sync' : 'omni twin drifted — run gen-omni' };
    },
  },
  {
    name: 'bump-plugin --check',
    run: () => {
      const r = exec(node, ['scripts/bump-plugin.mjs', '--check', '--base', BASE]);
      return { ok: r.status === 0, detail: r.status === 0 ? 'bump present (or no shipped change)' : 'shipped surface changed without a version bump' };
    },
  },
  {
    name: 'spec-diff inline-copy sync',
    run: () => {
      // The Workflow runtime cannot `import`, so the spec-diff libs are inlined verbatim in the Workflow
      // scripts that use them. This guard enforces that each (lib, workflow) pair shares identical code
      // logic for its shared functions (modulo comment-only lines and blank-line differences). A code-level
      // change to one copy that isn't mirrored in the other is caught. Generalized (adhoc-SddCoverageLoop,
      // Step 3) from a single (spec-diff.mjs, spec-cover.workflow.js) pair to a LIST of pairs — each workflow
      // inlines its own subset of a lib's exports (e.g. spec-cover-calc.workflow.js inlines spec-diff.mjs's
      // rule-diff functions but NOT its validator-only labelRed/RULE_ORDER, plus spec-diff-calc.mjs's
      // calculator outcome-labeler).

      // Normalize: strip comment-only lines and blank lines, then compare.
      function normalize(text) {
        return text.split('\n').filter((l) => {
          const t = l.trim();
          return t !== '' && !t.startsWith('//');
        }).join('\n');
      }

      // Extract a named function from source. Handles optional 'export ' prefix and parameter destructuring.
      // Returns the normalized function body (declaration + body, 'export ' stripped), or null if not found.
      function extractFn(src, name) {
        const re = new RegExp(`(?:export\\s+)?function\\s+${name}\\s*\\(`);
        const m = re.exec(src);
        if (!m) return null;
        // Skip past parameter list using paren depth counting
        let i = m.index + m[0].length - 1; // position of '('
        let pd = 0;
        while (i < src.length) {
          if (src[i] === '(') pd++;
          else if (src[i] === ')' && --pd === 0) break;
          i++;
        }
        // Scan forward to the body opening '{'
        while (i < src.length && src[i] !== '{') i++;
        if (i >= src.length) return null;
        // Count braces to find the matching closing '}'
        let bd = 0;
        const start = m.index;
        while (i < src.length) {
          if (src[i] === '{') bd++;
          else if (src[i] === '}' && --bd === 0) break;
          i++;
        }
        const raw = src.slice(start, i + 1).replace(/^export\s+/, '').trim();
        return normalize(raw);
      }

      // Each entry: a (lib, workflow) pair + the functions THAT workflow inlines from THAT lib. A workflow
      // may inline only a subset of a lib's exports (e.g. spec-cover-calc skips the validator-only labelRed).
      const PAIRS = [
        {
          lib: 'harness/lib/spec-diff.mjs',
          workflow: 'harness/spec-cover.workflow.js',
          fns: ['decideLocation', 'evaluateMinerResult', 'ruleKey', 'classifyRule', 'diffRules', 'serializeDiff', 'labelRed'],
        },
        {
          lib: 'harness/lib/spec-diff.mjs',
          workflow: 'harness/spec-cover-calc.workflow.js',
          fns: ['decideLocation', 'evaluateMinerResult', 'ruleKey', 'classifyRule', 'diffRules', 'serializeDiff'],
        },
        {
          lib: 'harness/lib/spec-diff-calc.mjs',
          workflow: 'harness/spec-cover-calc.workflow.js',
          fns: ['outcomeMatches', 'labelOutcome'],
        },
        // adhoc-SddMergeGen Step 4: harness/merge.workflow.js inlines FOUR libs (its own two-lib-plus
        // composition — merge-rules.mjs composes rule-crosswalk.mjs internally, so the workflow's inline
        // copy needs the crosswalk functions too, transitively, exactly like spec-cover-calc's dual-lib
        // inline above).
        {
          lib: 'harness/lib/rule-crosswalk.mjs',
          workflow: 'harness/merge.workflow.js',
          fns: ['applyCrosswalk', 'crosswalkExpectations', 'reconcileRuleSets'],
        },
        {
          lib: 'harness/lib/merge-rules.mjs',
          workflow: 'harness/merge.workflow.js',
          fns: ['ruleKey', 'boundaryDiverges', 'isStaleSpec', 'triageRuleSets'],
        },
        {
          lib: 'harness/lib/rules-registry.mjs',
          workflow: 'harness/merge.workflow.js',
          fns: ['bucketOf', 'evidenceKey', 'flattenTriage', 'updateRegistry', 'renderRegistry', 'parseRegistry'],
        },
        {
          lib: 'harness/lib/kb-distill.mjs',
          workflow: 'harness/merge.workflow.js',
          fns: ['clusterKey', 'estimateTokens', 'distillRegistry', 'lintTokenBudget'],
        },
      ];

      const mismatches = [];
      for (const { lib, workflow, fns } of PAIRS) {
        const libSrc = readFileSync(join(ROOT, lib), 'utf8');
        const wfSrc = readFileSync(join(ROOT, workflow), 'utf8');
        for (const name of fns) {
          const libFn = extractFn(libSrc, name);
          const wfFn = extractFn(wfSrc, name);
          if (!libFn) { mismatches.push(`${name}: not found in ${lib}`); continue; }
          if (!wfFn) { mismatches.push(`${name}: not found in ${workflow}`); continue; }
          if (libFn !== wfFn) mismatches.push(`${name}: code diverges between ${lib} and its inline copy in ${workflow}`);
        }
      }

      return { ok: mismatches.length === 0, detail: mismatches.length === 0 ? `${PAIRS.length} lib/workflow pair(s) in sync` : mismatches.join('; ') };
    },
  },
  {
    name: 'salience report',
    informational: true,
    run: () => {
      const r = exec(node, ['scripts/salience-report.mjs']);
      return { ok: r.status === 0, detail: 'informational — never fails the run' };
    },
  },
];

let passed = 0;
let gating = 0;
let failedGating = 0;
for (const c of checks) {
  const { ok, detail } = c.run();
  const tag = c.informational ? (ok ? 'INFO' : 'INFO?') : (ok ? 'PASS' : 'FAIL');
  process.stdout.write(`[${tag}] ${c.name}${detail ? ` — ${detail}` : ''}\n`);
  if (!c.informational) {
    gating += 1;
    if (ok) passed += 1;
    else failedGating += 1;
  }
}

process.stdout.write(`\nselfcheck: ${passed}/${gating} passed${failedGating ? ` (${failedGating} failing)` : ''}\n`);
process.exit(failedGating ? 1 : 0);
