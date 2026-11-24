'use strict';
/**
 * A seat job's after-job runs: what its row in the seat table (lib/codex-entry.js) names under
 * `checksAfterJob.afterJobRuns`, run by codex-job.js's finalizer once the job's end is confirmed and before the tree
 * is given back. The code names runs, never roles: a row gains a run by naming it.
 *
 * `verify-commands` runs the project's verify commands as a Claude solo's stop does (verify-gate.js): the commands
 * its resolver gives for the round's tree, one after another, each in a box of its own (lib/seat-box.js, a command
 * box) with the tree as its folder, between the start and end lines verify-gate.js writes in the tree's build
 * ledger. The finalizer hands in its book of command boxes (`book`): each box is entered there — its id, the
 * command's place and text — before it starts, and its keeper once known, so a finish stopped part-way leaves it on
 * record. Each box's keeper cuts its command at 120 s itself, whether or not the caller still runs; the caller waits
 * for the box to close, and cuts it as well should the keeper not have. A box's end is read through the book's
 * `endOf`, the seat job's own end proof. A box that may have launched and is not seen to end — its start returned
 * `launchClaimed`, its keeper said it could not close, or its end cannot be read — fails the run, which leaves the
 * end unfinished and the tree held. The record is appended through verify-gate.js's writer to the session root's
 * `.claude/audit/verify-verdict.json`, with the tree, the coordinating session and its phase token,
 * `agent: codex-seat-{role}` and `agent_id` the seat job's box id — once: a record that already names the box id is
 * read back, and no command runs again. A command whose earlier box closed by itself, uncut, is not run again: its
 * result is read from that box.
 *
 * `settle` ends the boxes an earlier, stopped finish started, before any command runs again: a box with no status
 * is given up where its `abandon` claim can be made; any other is cut where it has not closed, and its end read
 * through `endOf`. One whose end is not seen throws, so the tree stays held.
 *
 * `run` returns one result per named run: its name and, for `verify-commands`, the verdict and the command count.
 * A name the code does not know is returned as `unknown`, never run.
 */
const fs = require('fs');
const path = require('path');
const seatBox = require('./seat-box');

const COMMAND_CAP_MS = 120000;
const CLOSE_GRACE_MS = 90000;
const POLL_MS = 200;
const VERDICTS = path.join('.claude', 'audit', 'verify-verdict.json');

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function readTail(dir) {
  const read = (name) => { try { return fs.readFileSync(path.join(dir, name), 'utf8'); } catch { return ''; } };
  return `${read('output.log')}${read('stderr.log')}`;
}

const isClosed = (st) => Boolean(st && st.boxClosed !== undefined);
const own = (read, id) => (read.status && read.status.boxId === id ? read.status : null);

function mustEnd(book, entry, what) {
  const end = book.endOf(entry);
  if (end.end !== 'confirmed') throw new Error(`${what} (${entry.id}) is not seen to have ended: ${end.endReason}`);
  entry.ended = true;
  book.save();
}

function settle(book, env = process.env) {
  for (const entry of book.entries) {
    if (entry.ended) continue;
    const read = seatBox.readBox(entry.id, { env });
    if (read.read === 'missing' && seatBox.abandon(entry.id, { env })) {
      entry.ended = true;
      book.save();
      continue;
    }
    if (!isClosed(own(read, entry.id))) seatBox.cut(entry.id, { env });
    mustEnd(book, entry, 'the box of an earlier verify command');
  }
}

// A command's result from its closed box's status: `{ok, output}`.
function resultOf(st, dir, cutHere) {
  const timedOut = cutHere || st.limitReached === true;
  if (!timedOut && st.state === 'completed' && st.exitCode === 0) return { ok: true };
  const cause = timedOut ? 'ETIMEDOUT' : st.state === 'completed' ? `exit status ${st.exitCode}` : `${st.state}: ${st.reason || 'no reason given'}`;
  return { ok: false, output: `${readTail(dir)}\n[seat-after] command failed: ${cause}\n` };
}

// The result an earlier finish's box already holds for the command at `index`: one that closed by itself, uncut.
function earlier(book, index, run, env) {
  for (const entry of [...book.entries].reverse()) {
    if (entry.index !== index || entry.run !== run || !entry.ended) continue;
    const dir = seatBox.boxDir(entry.id, env);
    const st = own(seatBox.readBox(entry.id, { env }), entry.id);
    if (st && st.boxClosed === true && !fs.existsSync(path.join(dir, 'cut.request'))) return resultOf(st, dir, false);
  }
  return null;
}

// One command in a box of its own: `{ok, output}`, once its box is seen to end. Throws where it is not.
function boxedCommand(run, index, tree, env, book) {
  const entry = { id: seatBox.newBoxId(), index, run };
  book.entries.push(entry);
  book.save();
  const what = `the box of the verify command ${JSON.stringify(run)}`;
  const began = seatBox.start({ tree, command: run, env, boxId: entry.id, limitMs: COMMAND_CAP_MS });
  if (began.unavailable) {
    if (began.launchClaimed) throw new Error(`${what} (${entry.id}) may have launched it: ${began.unavailable}`);
    entry.ended = true;
    book.save();
    return { ok: false, output: `[seat-after] the command's box could not start: ${began.unavailable}\n` };
  }
  entry.keeper = began.keeper || null;
  book.save();
  const deadline = Date.now() + COMMAND_CAP_MS + CLOSE_GRACE_MS;
  let st = own(seatBox.readBox(entry.id, { env }), entry.id);
  while (!isClosed(st) && Date.now() < deadline) {
    sleep(POLL_MS);
    st = own(seatBox.readBox(entry.id, { env }), entry.id);
  }
  const cutHere = !isClosed(st);
  if (cutHere) st = seatBox.cut(entry.id, { env }).status || st;
  if (st && st.boxClosed === false) throw new Error(`${what} (${entry.id}) did not close: ${st.closeReason || 'it gave no reason'}`);
  mustEnd(book, entry, what);
  const last = own(seatBox.readBox(entry.id, { env }), entry.id) || st || {};
  return resultOf(last, began.dir || seatBox.boxDir(entry.id, env), cutHere);
}

function recordedVerdict(root, boxId, agent) {
  let text = '';
  try { text = fs.readFileSync(path.join(root, VERDICTS), 'utf8'); } catch { return null; }
  for (const line of text.split(/\r?\n/)) {
    let r = null;
    try { r = line.trim() ? JSON.parse(line) : null; } catch { /* a torn line is no record */ }
    if (r && r.agent_id === boxId && r.agent === agent) return r;
  }
  return null;
}

function verifyCommands({ root, tree, intent, boxId, marks, env, book }) {
  const agent = `codex-seat-${intent.seat}`;
  const before = recordedVerdict(root, boxId, agent);
  if (before) return { run: 'verify-commands', verdict: before.verdict, commands: before.commands_count };
  const gate = require('../verify-gate');
  const { hasBuildLedger, startBuild, endBuild } = require('./build-ledger');
  const commands = gate.resolveCommands(tree);
  const ts = new Date().toISOString();
  const ledgerId = commands.length ? `seat-${boxId}-${Date.now().toString(36)}` : null;
  if (ledgerId) startBuild(tree, { id: ledgerId, source: 'codex-seat' });
  const results = commands.map((c, index) => {
    const started = Date.now();
    const r = earlier(book, index, c.run, env) || boxedCommand(c.run, index, tree, env, book);
    const entry = { run: c.run, ok: r.ok, blocking: c.blocking, duration_ms: Date.now() - started };
    if (!r.ok) entry.output_excerpt = gate.excerpt(r.output);
    return entry;
  });
  if (ledgerId && hasBuildLedger(tree)) endBuild(tree, { id: ledgerId, ts, source: 'codex-seat', builds: null });
  const blockingFailed = results.some((r) => r.blocking && !r.ok);
  const verdict = blockingFailed ? 'fail' : 'pass';
  gate.writeVerdict(root, {
    ts, agent_id: boxId, session: marks.session || '', token: marks.token === undefined ? null : marks.token, tree,
    agent, verdict, commands: results, commands_count: results.length, blocking_failed: blockingFailed,
  });
  return { run: 'verify-commands', verdict, commands: results.length };
}

const RUNS = { 'verify-commands': verifyCommands };

/** The row's after-job runs for a confirmed seat job's end. */
function run({ row, root, tree, intent, boxId, marks, env = process.env, book }) {
  const named = row && row.checksAfterJob && Array.isArray(row.checksAfterJob.afterJobRuns) ? row.checksAfterJob.afterJobRuns : [];
  return named.map((name) => (RUNS[name] ? RUNS[name]({ root, tree, intent, boxId, marks, env, book }) : { run: name, result: 'unknown' }));
}

module.exports = { run, settle, RUNS: Object.freeze(Object.keys(RUNS)) };
