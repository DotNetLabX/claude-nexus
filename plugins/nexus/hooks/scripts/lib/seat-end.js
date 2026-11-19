'use strict';
/**
 * A seat job's end, read by codex-job.js: whether the job has really stopped writing in its tree, whether a
 * fallback is owed, and which steps it finished.
 *
 * WHAT MAY STILL WRITE. The companion's worker is a client: a job's commands run under the tree's Codex server,
 * whose process tree outlives the job, or under a server the worker started itself; and a cancel the companion
 * reports as done may not have stopped the turn.
 *
 * THE OWNED SET. A process is the job's when any look at the process list since the job's start tied it to the job:
 * the job's workers (a companion `task-worker` naming the job, and the worker pid the status record gave), the tree's
 * Codex servers — every server whose own folder cannot be read included — every process under them by parent link,
 * and off Windows every process sharing the session of a server or a worker of the job. A process is known by its pid
 * and its creation time, never by its command text: a live pid with the same creation time is the same process
 * whatever it now runs, and one with another creation time is another process, which seeds nothing. A process that
 * has exited still seeds the search under it, since its children keep its pid as their parent where nothing
 * re-parents them. The session of the process running this helper is never the job's. Every look reads the set —
 * from what earlier looks kept (`known`, `sessions`) and a fresh list — before it ends anything, and only adds to it.
 *
 * AN END IS CONFIRMED only when the whole set is gone, on every path. A job that finished by itself ends nothing:
 * its set must be gone but for the tree's servers themselves, which outlive every job. Any other end first ends the
 * job's workers and, through lib/codex-servers.js's rule that no other Codex job runs in the tree, the tree's
 * servers, then lists again. A server left running there is not counted itself — what runs under it is — but the
 * end then also needs proof that the turn stopped: the cancel's own reply says the turn was interrupted
 * (`turnInterrupted: true`), or the job's Codex session record shows its last turn ended (`task_complete` or
 * `turn_aborted` after the last `task_started`). A proof never confirms alone. A start that got no job id has as its
 * set the tree's companion `task` and `task-worker` processes, the tree's servers and what runs under them
 * (`confirmStart`); it ends no companion, only the servers under the same rule.
 *
 * MISSING EVIDENCE HOLDS. A list that cannot be taken or carries no creation time, a tree whose folder cannot be
 * read, what earlier looks found that cannot be read (`ownersUnread`), and a first look that could list nothing with
 * no worker pid known each leave the end `unconfirmed`, naming why. An unconfirmed end names the processes still
 * running (`writers`: pid, command, creation time, session) and the owned sessions (`sessions`), which codex-job.js
 * keeps for the next look; the tree's servers still running are among the writers, so a server another caller ends
 * later still names its children to the next look.
 *
 * THE PROCESS LIST is every process with its parent, creation time and session: NEXUS_CODEX_TREE_LIST names a command
 * printing it as JSON `[{pid, ppid, cmd, started, sid}]`; otherwise the Windows CIM table (no session), or `ps`
 * elsewhere, as NEXUS_CODEX_PLATFORM or the platform says.
 *
 * A FALLBACK IS OWED where the job failed, lost its worker, was cut or cancelled, or completed with no hand-back
 * line of the role's own: a line addressed `For team-lead:` or `For architect:` in one of its row's forms in the seat
 * table (lib/codex-entry.js) — opening with a blocker or fix phrase, ending with a unit phrase, or opening with a
 * unit phrase whose disposition follows the next colon — or, on a question job only, one opening with a phrase of
 * the row's question phase.
 *
 * A STEP IS FINISHED on the seat's own word and a proof: its `## Step {n}` block in the feature's
 * implementation.md ends with `**Step done:** {n}`, and the latest step-run record of that unit made by this job
 * (lib/seat-records.js) counts as passing (lib/run-verdict.js) or was skipped for want of a runner; with no such
 * record, only where the tree declares no unit test role.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const servers = require('./codex-servers');
const { seatRow } = require('./codex-entry');
const { jobStepRuns } = require('./seat-records');
const { sessionRecordFile } = require('./seat-checks');
const { specFolder } = require('./parts');

const LIST_MS = 20000;
const PS_ROW = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+\s+\S+\s+\d+\s+\d+:\d+:\d+\s+\d+)(?:\s(.*))?$/;
const PS_ROW_BARE = /^\s*(\d+)\s+(\d+)\s+(\S+)(?:\s(.*))?$/;

function platformOf(env) { return env.NEXUS_CODEX_PLATFORM || process.platform; }

const text = (v) => (v === null || v === undefined || v === '' ? null : String(v));

/** `{procs: [{pid, ppid, cmd, started, sid}]}`, or `{reason}`. */
function listProcesses(env = process.env) {
  const plat = platformOf(env);
  const override = servers.commandOverride('NEXUS_CODEX_TREE_LIST', env);
  let exe;
  let args;
  if (override) [exe, ...args] = override;
  else if (plat === 'win32') {
    const script = "$ErrorActionPreference = 'Stop'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; " +
      'try { $p = @(Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object { ' +
      '[pscustomobject]@{ pid = [int]$_.ProcessId; ppid = [int]$_.ParentProcessId; ' +
      'started = $(if ($_.CreationDate) { ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() } else { $null }); ' +
      'cmd = $_.CommandLine } }); ' +
      '[Console]::Out.Write((ConvertTo-Json -InputObject $p -Compress -Depth 3)) } catch { exit 1 }';
    exe = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  } else {
    exe = 'ps';
    args = ['-eww', '-o', 'pid=,ppid=,sess=,lstart=,args='];
  }
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: LIST_MS, windowsHide: true, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, LC_ALL: 'C' } });
  if (res.error || res.status !== 0) return { reason: `the process list could not be taken${res.error ? `: ${res.error.message}` : ''}` };
  const out = String(res.stdout || '');
  if (override || plat === 'win32') {
    let rows;
    try { rows = JSON.parse(out); } catch { return { reason: 'the process list is malformed' }; }
    if (!Array.isArray(rows)) return { reason: 'the process list is malformed' };
    return {
      procs: rows.filter((r) => r && Number.isInteger(r.pid)).map((r) => ({
        pid: r.pid, ppid: Number.isInteger(r.ppid) ? r.ppid : null, cmd: typeof r.cmd === 'string' ? r.cmd : '', started: text(r.started), sid: text(r.sid),
      })),
    };
  }
  const procs = [];
  for (const line of out.split('\n')) {
    const m = PS_ROW.exec(line);
    if (m) { procs.push({ pid: Number(m[1]), ppid: Number(m[2]), sid: m[3], started: m[4].replace(/\s+/g, ' '), cmd: m[5] || '' }); continue; }
    const bare = PS_ROW_BARE.exec(line);
    if (bare) procs.push({ pid: Number(bare[1]), ppid: Number(bare[2]), sid: bare[3], started: null, cmd: bare[4] || '' });
  }
  return procs.length ? { procs } : { reason: 'the process list is empty' };
}

// A list that cannot say which process is which confirms nothing.
function takeList(env) {
  const list = listProcesses(env);
  if (list.reason) return list;
  if (list.procs.length && list.procs.every((p) => p.started === null)) return { reason: 'the process list carries no creation time' };
  return list;
}

// The same process: the same pid, and the same creation time wherever both sides know one.
const sameProcess = (k, p) => k.pid === p.pid && (text(k.started) === null || p.started === null || text(k.started) === p.started);

function under(procs, roots) {
  const found = new Set();
  const seeds = new Set(roots);
  for (let grew = true; grew;) {
    grew = false;
    for (const p of procs) {
      if (!found.has(p.pid) && (seeds.has(p.ppid) || found.has(p.ppid))) { found.add(p.pid); grew = true; }
    }
  }
  return [...found];
}

/** The pids of one list tied to the job: each seed still the same process, everything under a seed — an exited one
 * too — and every process in an owned session. A seed whose pid now holds another process ties nothing. */
function tiedSet(procs, seeds, sessions) {
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const alive = new Set();
  const roots = new Set();
  for (const k of seeds) {
    if (!k || !Number.isInteger(k.pid)) continue;
    const p = byPid.get(k.pid);
    if (!p) roots.add(k.pid);
    else if (sameProcess(k, p)) { alive.add(p.pid); roots.add(p.pid); }
  }
  for (const p of procs) if (p.sid !== null && sessions.has(p.sid)) { alive.add(p.pid); roots.add(p.pid); }
  for (const pid of under(procs, [...roots])) alive.add(pid);
  return [...alive];
}

const keyOf = (dir, plat) => {
  const top = dir ? servers.gitTopLevel(dir) : null;
  return top ? servers.workspaceKey(top, plat) : null;
};

function workersOf(procs, jobId, plat) {
  return procs.filter((p) => {
    const c = servers.companionOptions(p, plat);
    return c && c.sub === 'task-worker' && c.jobId === jobId;
  });
}

// The tree's servers, and every server whose own folder cannot be read, since it may be the tree's.
function serversOf(procs, want, plat) {
  return procs.filter((p) => {
    if (!servers.isServer(p, plat)) return false;
    const key = keyOf(servers.serverOptions(p, plat).cwd, plat);
    return key === null || key === want;
  });
}

// The sessions of the given processes, never this helper's own, nor an empty or zero one.
function sessionsOf(procs, all, kept = []) {
  const me = all.find((p) => p.pid === process.pid);
  const own = me ? me.sid : null;
  const out = new Set();
  for (const sid of [...procs.map((p) => p.sid), ...kept.map(text)]) if (sid !== null && sid !== '0' && sid !== own) out.add(sid);
  return out;
}

const named = (procs, pids) => pids.map((pid) => {
  const p = procs.find((x) => x.pid === pid) || {};
  return { pid, cmd: p.cmd || '', started: p.started === undefined ? null : p.started, sid: p.sid === undefined ? null : p.sid };
});

const pidsOf = (list) => list.map((p) => p.pid).join(', ');

/** True where the session record shows its last turn ended, false where it does not, null where it cannot say. */
function turnEnded(thread, since, env = process.env) {
  const file = thread ? sessionRecordFile(thread, { since, env }) : null;
  if (!file) return null;
  let body;
  try { body = fs.readFileSync(file, 'utf8'); } catch { return null; }
  let started = -1;
  let ended = -1;
  body.split(/\r?\n/).forEach((line, i) => {
    let row;
    try { row = JSON.parse(line); } catch { return; }
    const type = row && row.payload && row.payload.type;
    if (type === 'task_started') started = i;
    if (type === 'task_complete' || type === 'turn_aborted') ended = i;
  });
  return started >= 0 && ended > started;
}

function closeWith(closeTree) {
  try { return closeTree(); } catch (err) { return { workspaces: [], reason: err.message }; }
}

const keptWhy = (closed) => {
  const row = closed && closed.workspaces && closed.workspaces[0];
  return row && row.why && row.why.length ? ` — the tree's servers were kept: ${row.why.join('; ')}` : '';
};

/**
 * `{end: 'confirmed' | 'unconfirmed', endReason, alive?, writers?, sessions?}`. `byItself` for a completed job;
 * `cancel` the cancel's reply where this collect cancelled; `known` the `{pid, cmd, started, sid}` and `sessions` the
 * owned sessions every earlier look kept, `ownersKnown` false where the first look could list nothing, `ownersUnread`
 * why what earlier looks kept cannot be read; `closeTree()` ends the tree's servers under the no-other-job rule and
 * returns lib/codex-servers.js's result; `kill(pid)` ends a process tree. An unconfirmed end names its `writers`, or
 * null where no list was taken.
 */
function confirmEnd({ jobId, tree, byItself, workerPid = null, known = [], sessions: kept = [], ownersKnown = true, ownersUnread = null, cancel = null, thread = null, since = null, closeTree, kill, env = process.env }) {
  const plat = platformOf(env);
  const keptList = Array.isArray(known) ? known : [];
  const keptSessions = Array.isArray(kept) ? kept : [];
  const hold = (endReason, writers = null, sessions = new Set(keptSessions)) => ({ end: 'unconfirmed', endReason, writers, sessions: [...sessions] });
  if (ownersUnread) return hold(`${ownersUnread}, so what earlier looks found cannot be counted`);
  if (!ownersKnown && !Number.isInteger(workerPid)) {
    return hold('the first look at the job\'s end could list no process, so no later list can show its processes gone');
  }
  const first = takeList(env);
  if (first.reason) return hold(`${first.reason}, so no end can be seen`);
  const want = keyOf(tree, plat);
  const workers = workersOf(first.procs, jobId, plat);
  const serverProcs = want === null ? [] : serversOf(first.procs, want, plat);
  const sessions = sessionsOf([...workers, ...serverProcs], first.procs, keptSessions);
  const workerSeed = Number.isInteger(workerPid) ? [{ pid: workerPid, started: null }] : [];
  const owned = tiedSet(first.procs, [...workers, ...serverProcs, ...keptList, ...workerSeed], sessions);
  if (want === null) {
    return hold('the tree\'s folder cannot be read, so its servers cannot be told from another folder\'s', named(first.procs, owned), sessions);
  }
  if (byItself) {
    const alive = owned.filter((pid) => !serverProcs.some((s) => s.pid === pid));
    return alive.length
      ? { ...hold(`the job's worker or a process of it still runs (pid ${alive.join(', ')})`, named(first.procs, [...alive, ...serverProcs.map((s) => s.pid)]), sessions), alive }
      : { end: 'confirmed', endReason: 'the job ended by itself, and its worker and every process of it are gone' };
  }
  for (const w of workers) kill(w.pid);
  const closed = serverProcs.length ? closeWith(closeTree) : null;
  const after = takeList(env);
  if (after.reason) return hold(`${after.reason}, so the end cannot be seen`, named(first.procs, owned), sessions);
  for (const sid of sessionsOf(workersOf(after.procs, jobId, plat), after.procs)) sessions.add(sid);
  const seeds = [...named(first.procs, owned), ...keptList, ...workersOf(after.procs, jobId, plat), ...workerSeed];
  const left = serverProcs.filter((s) => after.procs.some((p) => sameProcess(s, p)));
  const alive = tiedSet(after.procs, seeds, sessions).filter((pid) => !left.some((s) => s.pid === pid));
  if (alive.length) {
    return { ...hold(`pid ${alive.join(', ')} of the job still runs${keptWhy(closed)}`, named(after.procs, [...alive, ...left.map((s) => s.pid)]), sessions), alive };
  }
  if (!left.length) return { end: 'confirmed', endReason: 'the worker, the tree\'s servers and every process of the job are gone' };
  if (cancel && cancel.turnInterrupted === true) {
    return { end: 'confirmed', endReason: `every process of the job is gone, and the cancel interrupted the turn on the server left running (pid ${pidsOf(left)})` };
  }
  if (turnEnded(thread, since, env) === true) {
    return { end: 'confirmed', endReason: `every process of the job is gone, and the Codex session record shows the turn ended on the server left running (pid ${pidsOf(left)})` };
  }
  return hold(`the tree's server (pid ${pidsOf(left)}) was left running${keptWhy(closed)}, and nothing shows the job's turn stopped`, named(after.procs, left.map((s) => s.pid)), sessions);
}

/** A start that got no job id: confirmed once nothing of it — the tree's companion task and worker processes, its
 * servers, what runs under them and what an earlier look kept (`known`, `sessions`) — runs; `closeTree()` ends the
 * servers under the no-other-job rule. An unconfirmed one names its `writers` and `sessions`, as `confirmEnd` does. */
function confirmStart({ tree, closeTree, known = [], sessions: kept = [], env = process.env }) {
  const plat = platformOf(env);
  const keptList = Array.isArray(known) ? known : [];
  const keptSessions = Array.isArray(kept) ? kept : [];
  const hold = (endReason, writers = null, sessions = new Set(keptSessions)) => ({ end: 'unconfirmed', endReason, writers, sessions: [...sessions] });
  const first = takeList(env);
  if (first.reason) return hold(`${first.reason}, so nothing of the start can be seen gone`);
  const want = keyOf(tree, plat);
  if (want === null) return hold('the tree\'s folder cannot be read, so its processes cannot be told from another folder\'s');
  const companions = first.procs.filter((p) => {
    const c = servers.companionOptions(p, plat);
    return c && (c.sub === 'task' || c.sub === 'task-worker') && c.cwd && keyOf(c.cwd, plat) === want;
  });
  const serverProcs = serversOf(first.procs, want, plat);
  const sessions = sessionsOf([...companions, ...serverProcs], first.procs, keptSessions);
  const owned = tiedSet(first.procs, [...companions, ...serverProcs, ...keptList], sessions);
  if (!owned.length) return { end: 'confirmed', endReason: 'nothing of the start runs in the tree' };
  const closed = serverProcs.length ? closeWith(closeTree) : null;
  const after = takeList(env);
  if (after.reason) return hold(`${after.reason}, so nothing of the start can be seen gone`, named(first.procs, owned), sessions);
  const alive = tiedSet(after.procs, [...named(first.procs, owned), ...keptList], sessions);
  return alive.length
    ? hold(`pid ${alive.join(', ')} of the start may still run in the tree${keptWhy(closed)}`, named(after.procs, alive), sessions)
    : { end: 'confirmed', endReason: 'the tree\'s servers and every process of the start are gone' };
}

const strings = (list) => (Array.isArray(list) ? list.filter((p) => typeof p === 'string' && p) : []);
const ADDRESSED = /^(?:for team-lead|for architect):/;

// A hand-back line is addressed — `For team-lead:` or `For architect:` — and what follows the address opens with a
// blocker or fix phrase of the row, ends with a unit phrase, or opens with a unit phrase whose disposition — a
// blocker or fix phrase — follows the next colon, as a solo's verdict does. On a question job the question phase's
// phrases open it too, and may open a line by themselves, as its all-clear form does.
function handsBack(role, output, questions = false) {
  const row = seatRow(role);
  const groups = row && row.handbackPhrases ? row.handbackPhrases : {};
  const lower = (list) => strings(list).map((p) => p.toLowerCase());
  const dispositions = lower([...(groups.blocker || []), ...(groups.fix || [])]);
  const asked = questions ? lower(groups.questions) : [];
  const openers = [...dispositions, ...asked];
  const units = lower(groups.unit);
  const opens = (t, list) => list.some((p) => t.startsWith(p));
  return String(output || '').split(/\r?\n/).some((raw) => {
    const line = raw.replace(/^[\s>#*_`-]+/, '').replace(/\*\*/g, '').trim().toLowerCase();
    const addressed = ADDRESSED.exec(line);
    if (!addressed) return opens(line, asked);
    const rest = line.slice(addressed[0].length).trim();
    if (opens(rest, openers)) return true;
    if (units.some((p) => rest.replace(/[\s.!]+$/, '').endsWith(p))) return true;
    const colon = rest.indexOf(':');
    return colon > 0 && opens(rest, units) && opens(rest.slice(colon + 1).trim(), dispositions);
  });
}

/** `{fallback, fallbackReason}` for a seat job's end. */
function fallbackOf({ role, state, reason, output, cut, questions = false }) {
  if (state === 'completed') {
    if (handsBack(role, output, questions)) return { fallback: false, fallbackReason: null };
    return { fallback: true, fallbackReason: `the job ended with no hand-back line of the ${role}'s own` };
  }
  if (cut) return { fallback: true, fallbackReason: `the job was cut: ${reason}` };
  if (state === 'cancelled') return { fallback: true, fallbackReason: 'the job was cancelled' };
  if (/worker exited/.test(String(reason || ''))) return { fallback: true, fallbackReason: `the job lost its worker: ${reason}` };
  return { fallback: true, fallbackReason: `the job failed${reason ? `: ${reason}` : ''}` };
}

function declaresUnit(tree) {
  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); } catch { return false; }
  return require('../test-entry-gate').declaresUnit(cfg);
}

/** The step ids this job finished, in the order their blocks stand. */
function finishedSteps({ tree, slug, role, since }) {
  const folder = specFolder(tree, slug);
  let body;
  try { body = fs.readFileSync(path.join(folder, 'delivery', 'implementation.md'), 'utf8'); } catch { return []; }
  const { countsAsPassing } = require('./run-verdict');
  const runs = jobStepRuns({ tree, role, since });
  const unitDeclared = declaresUnit(tree);
  const out = [];
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const head = /^## Step (\S+?)\s+—/.exec(lines[i]);
    if (!head) continue;
    const id = head[1];
    let last = '';
    for (let j = i + 1; j < lines.length && !/^## /.test(lines[j]); j++) if (lines[j].trim()) last = lines[j].trim();
    const done = /^\*\*Step done:\*\*\s*(\S+)$/.exec(last);
    if (!done || done[1] !== id) continue;
    const mine = runs.filter((r) => String(r.unit) === id).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const latest = mine[mine.length - 1];
    const proven = latest ? countsAsPassing(latest) || latest.verdict === 'skipped' : !unitDeclared;
    if (proven) out.push(id);
  }
  return out;
}

module.exports = { listProcesses, confirmEnd, confirmStart, fallbackOf, finishedSteps, turnEnded };
