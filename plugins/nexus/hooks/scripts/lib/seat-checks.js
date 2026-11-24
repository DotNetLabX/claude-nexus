'use strict';
/**
 * The checks after a seat job, run by codex-job.js once, by the call that confirms the job's end: what a hook would
 * have recorded for a Claude seat is recorded in the session root's `.claude/audit/violations.log`, and nothing is
 * sent back to the seat. Each check reuses the hook's own reading. Run again after a stop, the checks write no line
 * the log already holds for the job.
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
 * Unusable file-change evidence disables attribution and does not affect this command check.
 *
 * RUNS PER STEP. The job's step-run records (lib/seat-records.js) of a unit run more than twice are counted.
 *
 * THE APPROVED SET, for a seat whose row in the seat table lists the compare (lib/codex-seats.json). A file changed
 * while the job ran — one git shows that it did not show before the job, or one it showed whose content now differs
 * from the safety copy (lib/seat-copy.js) — is held against three rules, one line per file at the first it breaks:
 * under `.claude/`; another role's pipeline delivery record (boundary-detector.js); outside the session's live approved set
 * (prohibition-gate.js), the file's own path read against the session root as the gate reads it, the always-allowed
 * surfaces against the tree. A record in the feature's delivery folder that breaks only the other-role rule
 * goes to `changedByOthers` when a complete, readable session record names no completed `FileChange` for it.
 * The comparison resolves usable absolute paths through existing ancestors, including move destinations.
 * The first two rules run always, the third only where the session has a live set, and the
 * result says when it did not run. Where git cannot list the tree after the job, only the safety copy's files are
 * held against them: the result reads `partly run` and one `rule: "approved-set"`, `check: "seat-unread"` line
 * with `blocked: false` says why. Both writing roles also get a violation when a completed file change names
 * the feature's communication log, even if the record is incomplete or the log started clean.
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
const { artifactOwners } = require('../boundary-detector');
const { relPath } = require('../prohibition-gate');

const TOOL = 'codex';
const COMMAND_EXCERPT = 120;
const SHELLS = /(?:^|[\\/])(?:powershell|pwsh|bash|sh|zsh|cmd)(?:\.exe)?$/i;
const SHELL_FLAGS = /^(?:-command|-c|-lc|\/c|\/s)$/i;
const THREAD = /(?:Codex session ID:|Thread ready \()[ \t]*([0-9A-Za-z][0-9A-Za-z-]*)/g;
const DAY_MS = 24 * 3600 * 1000;

// While `afterJob` runs: how many of each row the log already holds for its job, so a check run again after a stop
// matches each row it would write to one already written and adds none twice.
let known = null;
const rowKey = ({ ts, ...rest }) => JSON.stringify(rest);
const logFile = (root) => path.join(root, '.claude', 'audit', 'violations.log');

function appendViolation(root, row) {
  const key = known ? rowKey(row) : null;
  if (known && known.get(key) > 0) { known.set(key, known.get(key) - 1); return; }
  fs.mkdirSync(path.dirname(logFile(root)), { recursive: true });
  fs.appendFileSync(logFile(root), JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
}

function rowsOf(root, jobId) {
  const counts = new Map();
  let text = '';
  try { text = fs.readFileSync(logFile(root), 'utf8'); } catch { return counts; }
  for (const line of text.split(/\r?\n/)) {
    let r = null;
    try { r = line.trim() ? JSON.parse(line) : null; } catch { /* a torn line is no row */ }
    if (r && (r.job === jobId || r.agent_id === `codex-${jobId}`)) counts.set(rowKey(r), (counts.get(rowKey(r)) || 0) + 1);
  }
  return counts;
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

function readEvents(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (err) { return { why: `the Codex session record ${file} cannot be read: ${err.message}` }; }
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { events.push(JSON.parse(line)); } catch { return { why: `the Codex session record ${file} holds a line that is not JSON` }; }
  }
  return { events };
}

const completedItem = (event) => event?.payload?.type === 'item_completed' ? event.payload.item : null;

function commandsOf(events, file) {
  const commands = [];
  for (const event of events) {
    const item = completedItem(event);
    if (!item || item.type !== 'CommandExecution') continue;
    const cmd = commandText(item.command);
    if (cmd === null || /…\s*$/.test(cmd)) return { why: `a command in the Codex session record ${file} is cut` };
    commands.push({ command: cmd, cwd: typeof item.cwd === 'string' && path.isAbsolute(item.cwd) ? item.cwd : null });
  }
  return { commands };
}

/** `{commands: [{command, cwd}]}` from a session record, or `{why}` where it cannot be read whole. */
function readCommands(file) {
  const read = readEvents(file);
  return read.why ? read : commandsOf(read.events, file);
}

function changePath(value) {
  if (typeof value !== 'string' || value.includes('\0')) return null;
  if (process.platform !== 'win32') return path.isAbsolute(value) ? value : null;
  let windows = value.replace(/\//g, '\\');
  if (/^\\\\\?\\UNC\\/i.test(windows)) windows = '\\\\' + windows.slice(8);
  else if (/^\\\\\?\\[a-z]:\\/i.test(windows)) windows = windows.slice(4);
  return /^(?:[a-z]:\\|\\\\[^\\?.][^\\]*\\[^\\]+(?:\\|$))/i.test(windows) ? windows : null;
}

function resolvedChangePath(value) {
  let file = changePath(value);
  if (!file) return null;
  file = path.resolve(file);
  const suffix = [];
  for (;;) {
    try { return path.join(fs.realpathSync.native(file), ...suffix); } catch (err) {
      if (err.code !== 'ENOENT') return null;
      try {
        if (fs.lstatSync(file, { throwIfNoEntry: false })) return null;
      } catch { return null; }
    }
    const parent = path.dirname(file);
    if (parent === file) return null;
    suffix.unshift(path.basename(file));
    file = parent;
  }
}

function changeKey(file, base) {
  const real = base && resolvedChangePath(file);
  return real ? relPath(real, base) : null;
}

function completedChanges(events, tree) {
  const base = resolvedChangePath(tree);
  const changed = new Set();
  let complete = Boolean(base) && events.some((event) => event?.type === 'event_msg' && event.payload?.type === 'task_complete');
  for (const event of events) {
    const item = completedItem(event);
    if (item?.type !== 'FileChange' || item.status !== 'completed') continue;
    const changes = item.changes;
    if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length) {
      complete = false;
      continue;
    }
    for (const [source, change] of Object.entries(changes)) {
      if (!change || typeof change !== 'object' || Array.isArray(change)) {
        complete = false;
        continue;
      }
      const paths = [source, ...[change.move_path, change.kind?.move_path].filter((p) => p != null)];
      for (const file of paths) {
        const key = changeKey(file, base);
        if (key === null) complete = false;
        else changed.add(key);
      }
    }
  }
  return { base, changed, complete };
}

function sessionActivity({ thread, since, tree }) {
  const file = thread ? sessionRecordFile(thread, { since }) : null;
  if (!file) return { why: thread ? `no Codex session record names the thread ${thread}` : 'the job\'s output names no Codex session record' };
  const read = readEvents(file);
  if (read.why) return read;
  return { ...commandsOf(read.events, file), ...completedChanges(read.events, tree) };
}

function testEntry({ root, tree, role, jobId, activity, marks }) {
  const gate = require('../test-entry-gate');
  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); } catch { /* none declared */ }
  const row = (fields) => ({ agent: role, tool: TOOL, path: tree, rule: 'test-entry', job: jobId, token: marks.token, session: marks.session, ...fields });
  if (activity.why) {
    appendViolation(root, row({ check: 'seat-unread', blocked: false, why: activity.why }));
    return { testEntry: 'unread', why: activity.why };
  }
  let lines = 0;
  for (const { command, cwd } of activity.commands) {
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

function otherRoleArtifact(rel, role) {
  if (!/^docs\/specs\/(?:[^/]+\/){1,3}delivery\/[^/]+$/.test(rel)) return false; // [codex-job BR-55]
  const owners = artifactOwners(`/${rel}`);
  return Boolean(owners && !owners.includes(role));
}

function featureDelivery(tree, slug) {
  const folder = specFolder(tree, slug);
  return folder ? path.relative(tree, path.join(folder, 'delivery')).split(path.sep).join('/') : null;
}

function attributedToOthers(file, tree, { base, changed, complete, why }) {
  if (!complete || why) return false;
  const key = changeKey(path.join(tree, file), base);
  return key !== null && !changed.has(key);
}

function copyChanges({ files, tree, role, slug, activity }) {
  const changed = [];
  const changedByOthers = [];
  const folder = activity.complete && featureDelivery(tree, slug);
  const delivery = folder && relPath(folder, tree);
  for (const file of files) {
    const rel = relPath(file, tree);
    if (path.posix.dirname(rel) === delivery && (otherRoleArtifact(rel, role) || path.posix.basename(rel) === 'communication-log.md')
        && attributedToOthers(file, tree, activity)) changedByOthers.push(file);
    else changed.push(file);
  }
  return { changed, changedByOthers };
}

function approvedSet({ root, tree, role, jobId, intent, activity, marks }) {
  const folder = featureDelivery(tree, intent.slug);
  const delivery = folder && relPath(folder, tree);
  const log = folder && path.posix.join(folder, 'communication-log.md');
  const logKey = log && relPath(log, tree);
  const editedLog = intent.write !== false && log && activity.changed?.has(changeKey(path.join(tree, log), activity.base));
  const outside = [];
  const report = (rel, rule) => {
    appendViolation(root, { agent: role, tool: TOOL, path: rel, rule, job: jobId, token: marks.token, session: marks.session });
    outside.push(rel);
  };
  if (editedLog) report(log, `wrote the coordinator's communication log (${log})`);
  if (!comparesApprovedSet(role)) {
    return { approvedSet: `not run — the ${role}'s seat gets no approved-set compare`, ...(editedLog ? { outside } : {}) };
  }
  const gate = require('../prohibition-gate');
  const set = gate.readApprovedSet(root, marks.session);
  // The stamp is read against the session root, as the live gate reads it; the seat's own records against the tree.
  const inSet = (rel) => gate.alwaysAllowed(gate.relPath(rel, tree), set.slug) || gate.inApprovedSet(path.join(tree, rel), root, set);
  const changedByOthers = [];
  const changed = changedByJob(tree, intent.changedBefore, intent.copy);
  for (const rel of changed.files) {
    const normalized = relPath(rel, tree);
    if (editedLog && normalized === logKey) continue;
    let rule = null;
    if (/^\.claude\//i.test(rel)) rule = `a Codex seat changed a file under .claude/ (${rel}) — the pipeline's records and settings are the coordinating session's`;
    else if (otherRoleArtifact(normalized, role)) {
      if (path.posix.dirname(normalized) === delivery && attributedToOthers(rel, tree, activity) && (!set || inSet(rel))) {
        changedByOthers.push(rel);
        continue;
      }
      rule = `wrote an artifact whose owner is another role (${rel}) — each artifact has exactly one owner (ADR-18)`;
    } else if (set && !inSet(rel)) rule = `approval-scope: edit outside the stamped set (${set.declared.length} paths, ${set.slug})`;
    if (rule) report(rel, rule);
  }
  if (!changed.listed) {
    const why = 'git could not list the tree after the job, so only the safety copy\'s files were compared';
    appendViolation(root, { agent: role, tool: TOOL, path: tree, rule: 'approved-set', check: 'seat-unread', blocked: false, why, job: jobId, token: marks.token, session: marks.session });
    return { approvedSet: `partly run — ${why}`, outside, changedByOthers };
  }
  return { approvedSet: set ? 'ran' : 'not run — the session has no live approved set', outside, changedByOthers };
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
function afterJob({ root, intent, jobId, state, activity, marks }) {
  const base = { root, tree: intent.tree, role: intent.seat, jobId, marks };
  const out = {};
  const guard = (name, fn) => {
    try { Object.assign(out, fn()); } catch (err) { out[`${name}Note`] = `the ${name} check failed: ${err.message}`; }
  };
  known = rowsOf(root, jobId);
  try {
    guard('testEntry', () => testEntry({ ...base, activity }));
    guard('stepRuns', () => ({ stepRunsOverTwo: overTwo(jobStepRuns({ tree: intent.tree, role: intent.seat, since: intent.at })) }));
    guard('approvedSet', () => approvedSet({ ...base, intent, activity }));
    if (state === 'completed') guard('classCheck', () => classCheck({ ...base, unit: intent.unit, slug: intent.slug }));
  } finally {
    known = null;
  }
  return out;
}

module.exports = { threadIdOf, sessionRecordFile, readCommands, sessionActivity, copyChanges, changedByJob, afterJob };
