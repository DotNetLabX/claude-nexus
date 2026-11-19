#!/usr/bin/env node
/**
 * Nexus main-run: the one full run on a branch after its merges.
 *
 *   node main-run.js request --slug <slug> --session <id> --commit <sha> [--branch <name>]
 *   node main-run.js status [--branch <name>]
 *   node main-run.js claim|release|retest --session <id> [--branch <name>]
 *
 * `request` is called by the session whose commit just reached the branch, with that commit as `--commit`; it
 * prints one JSON line when the run holding that commit ends — `{result, branch, commit, requested, run_id,
 * failed, why}`, `result` one of `green`, `red`, `unrun` or `undeclared` — and exits 1 on a red, 2 when the commit
 * is not on the branch, else 0. `--branch` names the branch to prove where it is not the resolved default branch
 * (a campaign's branch); every branch has its own state and its own clean copy. A repo whose `.claude/verify.json`
 * declares no `full` role prints `undeclared` and exits 0. `status` prints the branch's state as JSON, with the
 * session holding the red's fix while its claim is live (`holder`).
 *
 * A red's fix: `claim` gives it to the first session that asks (exit 0) and tells every later one who holds it
 * (exit 1); a claim lapses 30 minutes after its last refresh — the holder's own `claim` or `retest` refreshes it —
 * and `release` gives it up. `retest` re-runs the red's failed test files by name at the branch's tip and clears a
 * red whose record names every failure when all are green (exit 0); a red it cannot clear exits 1, and so does a
 * retest made while a run is going, at once, as `busy`.
 *
 * The rules — one running and one waiting, the clean copy, a dead run, the base handed to the run, the trace — are
 * lib/main-run.js's. The project root is CLAUDE_PROJECT_DIR, else the working folder; the state lives in its main
 * checkout. NEXUS_MAIN_RUN_POLL_MS, NEXUS_MAIN_RUN_HEARTBEAT_MS, NEXUS_MAIN_RUN_DEAD_MS and NEXUS_MAIN_RUN_CLAIM_MS
 * shorten the waits for the tests.
 */
'use strict';
const { request, status, claim, release, retest, TIMING } = require('./lib/main-run');

const USAGE = 'main-run: request --slug <slug> --session <id> --commit <sha> [--branch <name>] | status | claim | release | retest --session <id> [--branch <name>]\n';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      args[a.slice(2)] = next !== undefined && !next.startsWith('--') ? (i++, next) : true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function timingFrom(env) {
  const ms = (name, fallback) => (/^\d+$/.test(env[name] || '') ? Number(env[name]) : fallback);
  return {
    pollMs: ms('NEXUS_MAIN_RUN_POLL_MS', TIMING.pollMs),
    heartbeatMs: ms('NEXUS_MAIN_RUN_HEARTBEAT_MS', TIMING.heartbeatMs),
    deadMs: ms('NEXUS_MAIN_RUN_DEAD_MS', TIMING.deadMs),
    claimMs: ms('NEXUS_MAIN_RUN_CLAIM_MS', TIMING.claimMs),
  };
}

function print(out) {
  if (out.error) process.stderr.write(`${out.error}\n`);
  if (out.line) process.stdout.write(`${JSON.stringify(out.line)}\n`);
  return out.code;
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  const root = env.CLAUDE_PROJECT_DIR || process.cwd();
  const branch = typeof args.branch === 'string' ? args.branch : undefined;
  const timing = timingFrom(env);
  const command = args._[0];
  if (command === 'status') {
    process.stdout.write(`${JSON.stringify(status({ root, branch, timing }))}\n`);
    return 0;
  }
  if (!['request', 'claim', 'release', 'retest'].includes(command)) {
    process.stderr.write(USAGE);
    return 2;
  }
  const session = typeof args.session === 'string' ? args.session : String(env.CLAUDE_CODE_SESSION_ID || '');
  const needed = command === 'request' ? [['slug', args.slug], ['commit', args.commit], ['session', session]] : [['session', session]];
  for (const [name, value] of needed) {
    if (typeof value !== 'string' || value === '') {
      process.stderr.write(`main-run: ${command} needs --${name}\n`);
      return 2;
    }
  }
  if (command === 'claim') return print(claim({ root, session, branch, timing }));
  if (command === 'release') return print(release({ root, session, branch }));
  if (command === 'retest') return print(await retest({ root, session, branch, env, timing }));
  return print(await request({ root, slug: args.slug, session, commit: args.commit, branch, env, timing }));
}

if (require.main === module) {
  for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => process.exit(130));
  main().then((code) => process.exit(code), (e) => {
    process.stderr.write(`main-run: ${e && e.message ? e.message : e}\n`);
    process.exit(2);
  });
}

module.exports = { main };
