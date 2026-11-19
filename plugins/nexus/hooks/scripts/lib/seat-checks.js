'use strict';
/**
 * The checks after a seat job, run by codex-job.js once, by the call that confirms the job's end: what a hook would
 * have recorded for a Claude seat is recorded in the session root's `.claude/audit/violations.log`, and nothing is
 * sent back to the seat. Each check reuses the hook's own reading.
 *
 * TEST COMMANDS. Codex's session record of the job — `{CODEX_HOME or ~/.codex}/sessions/{yyyy}/{mm}/{dd}/
 * rollout-{time}-{thread id}.jsonl`, the thread id read from the job's output — holds each command whole, as a
 * `CommandExecution` item. Each command goes through the test-entry gate's own seat reading (test-entry-gate.js
 * `classifyCommand`), script files read from the command's folder, else the tree: what the gate would refuse — a raw
 * test command where the tree declares its unit test role, and on a developer's seat a separate build, the
 * mutation runner, a declared role's script or a script that runs a test, a build or the runner — is one
 * `rule: "test-entry"` line in the gate's form with no `blocked` key, and a script file it could not read one
 * `script-unread` line with `blocked: false`. Where the record cannot be found or read, or a command in it is cut
 * (not a string, or ending in an ellipsis), one `check: "seat-unread"` line with `blocked: false` is written instead.
 *
 * RUNS PER STEP. The job's step-run records (lib/seat-records.js) of a unit run more than twice are counted.
 *
 * THE APPROVED SET, for a seat whose row in the seat table lists the compare (lib/codex-seats.json). A file changed
 * while the job ran — one git shows that it did not show before the job, or one it showed whose content now differs
 * from the safety copy (lib/seat-copy.js) — is held against three rules, one line per file at the first it breaks:
 * under `.claude/`; another role's artifact (boundary-detector.js); outside the session's live approved set
 * (prohibition-gate.js), the file's own path read against the session root as the gate reads it, the always-allowed
 * surfaces against the tree. The first two run always; the third only where the session has a live set, and the
 * result says when it did not run. Where git cannot list the tree after the job, only the safety copy's files are
 * held against them: the result reads `partly run` and one `rule: "approved-set"`, `check: "seat-unread"` line
 * with `blocked: false` says why.
 *
 * THE CLASS-CHECK LINE. For a completed fix-round unit, the round's block in the feature's implementation.md is
 * read as the fix-record check reads it (lib/fix-record.js); a block without its line gets one `rule:
 * "class-check"` line.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { gitChanged } = require('./codex-seat');
const { readManifest, hashOf } = require('./seat-copy');
const { jobStepRuns } = require('./seat-records');
const { roundBlock, hasClassLine } = require('./fix-record');
const { specFolder } = require('./parts');
const { seatRow } = require('./codex-entry');

const TOOL = 'codex';
const COMMAND_EXCERPT = 120;
const SHELLS = /(?:^|[\\/])(?:powershell|pwsh|bash|sh|zsh|cmd)(?:\.exe)?$/i;
const SHELL_FLAGS = /^(?:-command|-c|-lc|\/c|\/s)$/i;
const THREAD = /(?:Codex session ID:|Thread ready \()[ \t]*([0-9A-Za-z][0-9A-Za-z-]*)/g;
const DAY_MS = 24 * 3600 * 1000;

function appendViolation(root, row) {
  const dir = path.join(root, '.claude', 'audit');
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'violations.log'), JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
}

/** The last thread id the job's output or log names, or null. */
function threadIdOf(...texts) {
  let found = null;
  for (const text of texts) for (const m of String(text || '').matchAll(THREAD)) found = m[1];
  return found;
}

/** The session record's path for a thread, looked for in the day folders around the job's time, or null. */
function sessionRecordFile(thread, { since, env = process.env, now = Date.now() }) {
  const base = path.join(env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'sessions');
  const from = Number.isFinite(Date.parse(since)) ? Date.parse(since) : now;
  const days = new Set();
  for (let t = from - DAY_MS; t <= now + DAY_MS; t += DAY_MS) {
    const d = new Date(t);
    days.add([d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n, i) => (i ? String(n).padStart(2, '0') : String(n))).join('/'));
    days.add([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()].map((n, i) => (i ? String(n).padStart(2, '0') : String(n))).join('/'));
  }
  for (const day of days) {
    const dir = path.join(base, ...day.split('/'));
    let names;
    try { names = fs.readdirSync(dir); } catch { continue; }
    const hit = names.find((n) => n.startsWith('rollout-') && n.endsWith(`-${thread}.jsonl`));
    if (hit) return path.join(dir, hit);
  }
  return null;
}

// The command a shell was asked to run, else the words joined; null where the item holds no readable command.
function commandText(command) {
  if (!Array.isArray(command) || !command.length || !command.every((w) => typeof w === 'string')) return null;
  if (command.length >= 3 && SHELLS.test(command[0]) && SHELL_FLAGS.test(command[command.length - 2])) return command[command.length - 1];
  return command.join(' ');
}

/** `{commands: [{command, cwd}]}` from a session record, or `{why}` where it cannot be read whole. */
function readCommands(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (err) { return { why: `the Codex session record ${file} cannot be read: ${err.message}` }; }
  const commands = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { return { why: `the Codex session record ${file} holds a line that is not JSON` }; }
    const item = row && row.payload && row.payload.type === 'item_completed' ? row.payload.item : null;
    if (!item || item.type !== 'CommandExecution') continue;
    const cmd = commandText(item.command);
    if (cmd === null || /…\s*$/.test(cmd)) return { why: `a command in the Codex session record ${file} is cut` };
    commands.push({ command: cmd, cwd: typeof item.cwd === 'string' && path.isAbsolute(item.cwd) ? item.cwd : null });
  }
  return { commands };
}

function testEntry({ root, tree, role, jobId, thread, since, marks }) {
  const gate = require('../test-entry-gate');
  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); } catch { /* none declared */ }
  const row = (fields) => ({ agent: role, tool: TOOL, path: tree, rule: 'test-entry', job: jobId, token: marks.token, session: marks.session, ...fields });
  const file = thread ? sessionRecordFile(thread, { since }) : null;
  const read = file ? readCommands(file) : { why: thread ? `no Codex session record names the thread ${thread}` : 'the job\'s output names no Codex session record' };
  if (read.why) {
    appendViolation(root, row({ check: 'seat-unread', blocked: false, why: read.why }));
    return { testEntry: 'unread', why: read.why };
  }
  let lines = 0;
  for (const { command, cwd } of read.commands) {
    const excerpt = gate.fold(command).slice(0, COMMAND_EXCERPT);
    const seen = gate.classifyCommand(command, { developer: role === 'developer', cfg, tree, cwd: cwd || tree });
    for (const u of seen.unread) {
      appendViolation(root, row({ check: 'script-unread', blocked: false, command: excerpt, file: u.file, why: u.why }));
      lines++;
    }
    if (!seen.check) continue;
    appendViolation(root, row({ check: seen.check, command: excerpt, ...(seen.script ? { file: seen.script } : {}) }));
    lines++;
  }
  return { testEntry: lines };
}

function overTwo(runs) {
  const counts = {};
  for (const r of runs) counts[r.unit] = (counts[r.unit] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 2));
}

// `{files, listed}`: each file whose content changed while the job ran, relative to the tree with forward slashes,
// and whether git listed the tree — where it did not, only the safety copy's files were compared.
function changedByJob(tree, before, copyDir) {
  const now = gitChanged(tree);
  const earlier = new Set((before || []).map((p) => String(p).replace(/\\/g, '/')));
  const out = new Set((now || []).map((f) => f.path.replace(/\\/g, '/')).filter((p) => !earlier.has(p)));
  const manifest = copyDir ? readManifest(copyDir) : null;
  for (const f of (manifest && manifest.files) || []) {
    if (hashOf(path.join(tree, f.path)) !== f.sha) out.add(f.path);
  }
  return { files: [...out].sort(), listed: now !== null };
}

// The seat table's row decides whether a seat's job gets the approved-set compare.
function comparesApprovedSet(role) {
  const row = seatRow(role);
  const checks = row && row.checksAfterJob && Array.isArray(row.checksAfterJob.checks) ? row.checksAfterJob.checks : [];
  return checks.includes('approved-set');
}

function approvedSet({ root, tree, role, jobId, intent, marks }) {
  if (!comparesApprovedSet(role)) return { approvedSet: `not run — the ${role}'s seat gets no approved-set compare` };
  const owners = require('../boundary-detector').artifactOwners;
  const gate = require('../prohibition-gate');
  const set = gate.readApprovedSet(root, marks.session);
  // The stamp is read against the session root, as the live gate reads it; the seat's own records against the tree.
  const inSet = (rel) => gate.alwaysAllowed(gate.relPath(rel, tree), set.slug) || gate.inApprovedSet(path.join(tree, rel), root, set);
  const outside = [];
  const changed = changedByJob(tree, intent.changedBefore, intent.copy);
  for (const rel of changed.files) {
    let rule = null;
    const own = owners(`/${rel}`);
    if (/^\.claude\//i.test(rel)) rule = `a Codex seat changed a file under .claude/ (${rel}) — the pipeline's records and settings are the coordinating session's`;
    else if (own && !own.includes(role)) rule = `wrote an artifact whose owner is another role (${rel}) — each artifact has exactly one owner (ADR-18)`;
    else if (set && !inSet(rel)) rule = `approval-scope: edit outside the stamped set (${set.declared.length} paths, ${set.slug})`;
    if (!rule) continue;
    appendViolation(root, { agent: role, tool: TOOL, path: rel, rule, job: jobId, token: marks.token, session: marks.session });
    outside.push(rel);
  }
  if (!changed.listed) {
    const why = 'git could not list the tree after the job, so only the safety copy\'s files were compared';
    appendViolation(root, { agent: role, tool: TOOL, path: tree, rule: 'approved-set', check: 'seat-unread', blocked: false, why, job: jobId, token: marks.token, session: marks.session });
    return { approvedSet: `partly run — ${why}`, outside };
  }
  return { approvedSet: set ? 'ran' : 'not run — the session has no live approved set', outside };
}

function roundOf(unit) {
  const fix = /^fix cycle (\d+)(?: part \d+)?$/.exec(unit);
  if (fix) return `Fix Round ${fix[1]}`;
  const up = /^hand-up (\d+)$/.exec(unit);
  return up ? `Fix Round Hand-up ${up[1]}` : null;
}

function classCheck({ root, tree, unit, slug, jobId, marks }) {
  const round = roundOf(unit);
  if (!round) return {};
  const who = { rule: 'class-check', agent_id: `codex-${jobId}`, session: marks.session || null, round, slug };
  const folder = specFolder(tree, slug);
  let text = null;
  try { text = folder ? fs.readFileSync(path.join(folder, 'delivery', 'implementation.md'), 'utf8') : null; } catch { /* unreadable */ }
  if (text === null) {
    appendViolation(root, { ...who, check: 'unreadable', why: `no readable implementation.md for ${slug}`, blocked: false });
    return { classCheck: 'unread' };
  }
  if (hasClassLine(roundBlock(text, round))) return { classCheck: 'present' };
  appendViolation(root, { ...who, why: `the ## ${round} block has no **Class checked:** line`, blocked: false });
  return { classCheck: 'missing' };
}

/** Runs every check once for an ended seat job; returns what `collect` reports. Never throws past a failed check. */
function afterJob({ root, intent, jobId, state, output, log, marks }) {
  const base = { root, tree: intent.tree, role: intent.seat, jobId, marks };
  const out = {};
  const guard = (name, fn) => {
    try { Object.assign(out, fn()); } catch (err) { out[`${name}Note`] = `the ${name} check failed: ${err.message}`; }
  };
  guard('testEntry', () => testEntry({ ...base, thread: threadIdOf(output, log), since: intent.at }));
  guard('stepRuns', () => ({ stepRunsOverTwo: overTwo(jobStepRuns({ tree: intent.tree, role: intent.seat, since: intent.at })) }));
  guard('approvedSet', () => approvedSet({ ...base, intent }));
  if (state === 'completed') guard('classCheck', () => classCheck({ ...base, unit: intent.unit, slug: intent.slug }));
  return out;
}

module.exports = { threadIdOf, sessionRecordFile, readCommands, changedByJob, afterJob };
