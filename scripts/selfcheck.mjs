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
