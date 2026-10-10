#!/usr/bin/env node
/**
 * Nexus handoff-latency tracker. Async, observe-only — never blocks, never changes any behaviour.
 *
 * Why this exists (F81): the pipeline's wall-clock cost is not all model time. Between a subagent
 * handing back and the coordinator resuming or spawning the next one there is dead time, and nobody
 * could say how much of a run it was — the number had never been measured, only argued about.
 * This hook records the two endpoints so the gap can be quantified.
 *
 * It deliberately does NOT split that gap into "waiting for the human" versus "the machine was
 * busy". Reading the cause is the owner's; a script that guessed would be inventing the very number
 * this instrumentation exists to establish.
 *
 * Records, appended one JSON line each to .claude/audit/handoff.jsonl:
 *   - SubagentStop                 -> { ts, event:"handback",   agent_id, agent_type, token, session[, step] }
 *   - PostToolUse(SendMessage)     -> { ts, event:"resume",     target, token, session }
 *   - PostToolUse(Agent)           -> { ts, event:"spawn",      target, token, session }
 *   - Stop                         -> { ts, event:"turn-end",   prompt_id, session }
 *   - UserPromptSubmit             -> { ts, event:"user-resume", prompt_id, session }
 * Every record also carries `plugin_version`, read from the plugin.json two levels above this script
 * (omitted when unreadable): a reader takes each spawn's plugin version from here — a subagent's by
 * agent_id, a main session's by session — since no transcript line carries one.
 *
 * The last two bracket the OTHER half of the same dead time: `Stop` fires when the main session
 * hands control back to a human, `UserPromptSubmit` when that human's next prompt lands — the gap
 * between them is the part of the wall clock this file could not previously attribute to anyone.
 * Neither carries `tool_name`, same as a genuine SubagentStop handback, so they are dispatched on
 * `hook_event_name` BEFORE the tool-less branch below — otherwise both would misrecord as handbacks
 * with no agent to attribute the gap to.
 *
 * The optional `step` (F175, ADR-122): a developer hands back after every step with
 * `Step {n} done for …`; on such a mid-slice checkpoint (lib/step-checkpoint.js, the same matcher
 * the verify gate uses) the handback carries `step: "{n}"`, so a step's time and tokens join
 * exactly — its resume-to-handback window against the platform transcript — instead of being
 * inferred from hand-back order. The role test goes through the shared resolver, since this
 * hook's own recorded `agent_type` keeps a named spawn's role-prefixed name (`dev-s1`) as it is. Any
 * other role, "ready for Step 1", "range complete" or an unrecognised message: no `step` key,
 * the record exactly as before. `--report` ignores the field.
 *
 * One state file per developer (F176), .claude/audit/dev-steps/{agentId}.json —
 * `{ name, range: {from, to} | null, phase: "analyze" | "review-fixes" | "fixes" | null, step | null,
 * cycle?, phaseDone?, ts }` — kept for a renderer of the agents list, which cannot afford to
 * scan this log every few seconds (none ships with this plugin):
 *   - an unnamed developer spawn (the Agent result carries `agentId`) writes it: the name is the
 *     description's first word, `phase: "analyze"` when the prompt opens with `Analyze`,
 *     `phase: "review-fixes"` with `cycle: "N/M"` when it carries `Fix round for … Cycle N/M`, and the
 *     range comes from the prompt (`Your slice: a–b` beats `Your steps: a–b`; `Build {slug}, steps
 *     a–b`; `Implement. Steps: a–b`; en dash or hyphen);
 *   - a SendMessage to an id that has a file replaces the range when the message carries one,
 *     `Implement. Steps:` clears the phase, a fix-round line sets `review-fixes`, and any other
 *     resume of a developer whose range is finished sets `fixes`; every resume clears `phaseDone`;
 *   - a developer hand-back sets `step` — the checkpoint's id, or the range's last on the range's
 *     last hand-back — and clears the phase; a hand-back recording neither (the analysis) keeps it;
 *     a hand-back in a fix phase keeps the phase and sets `phaseDone`.
 * Written to a temp file and renamed; an id outside lib/safe-id.js's pattern gets no file; files
 * a day old are pruned on each write; every error is swallowed and the log records are unchanged.
 * A named spawn has no agent id at spawn, so it gets no file.
 *
 * One type file per started subagent, .claude/audit/agent-types/{agentId}.json — `{ type, ts }`,
 * the platform's own `agent_type` from SubagentStart, named or unnamed. It is such a renderer's only
 * role source: the agents-list payload carries `local_agent` for every task, and its `label` is
 * live activity text. Same safe-id, temp-and-rename and day-old pruning as the developer files;
 * SubagentStart writes no handoff record.
 *
 * A SubagentStop event with no `agent_type` is skipped, not recorded as `"unknown"`: the platform
 * fires an internal event of that shape roughly every 30 s while a real subagent is still running,
 * and its `agent_id` matches no running agent — it is not a handback. A genuine handback always
 * carries a non-empty `agent_type`.
 *
 * `--report` prints, per agent, each handback -> next-resume latency in ms plus the per-round
 * total, and separately, per session, each turn-end -> next-user-resume gap (the human-wait
 * section) plus the per-session total.
 *
 * THREE PLATFORM ASSUMPTIONS, ALL UNVERIFIED — the live probe is operator-owed:
 *   1. That PostToolUse fires for `SendMessage` at all. If it does not, the resume leg is silent and
 *      every gap reads `open`; the handback leg still records, so the failure is partial.
 *   2. That the resume target arrives as `tool_input.to` (`recipient` is accepted as a fallback).
 *   3. That the `SubagentStop` hooks in one entry run without the earlier ones blocking them. This
 *      hook is `hooks[1]` behind `verify-gate.js`, which has a 180 s timeout and runs the repo's
 *      verify set. `ts` is stamped when THIS process starts, so if the runner awaits `hooks[0]`
 *      first, every handback is stamped late and every measured gap is shortened by the verify
 *      gate's runtime — a silent, variable bias in exactly the number being measured. Prefer a stop
 *      time from the payload over `Date.now()` if the probe finds one.
 *
 * Fail silent on any error, exit 0 on every path (mirrors read-tracker / skill-tracker).
 */
'use strict';
const fs = require('fs');
const path = require('path');

let pluginVersion;
function readPluginVersion() {
  if (pluginVersion === undefined) {
    pluginVersion = null;
    try {
      const v = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
      if (typeof v === 'string' && v) pluginVersion = v;
    } catch { /* unreadable: the field is omitted */ }
  }
  return pluginVersion;
}

function appendRecord(root, record) {
  const auditDir = path.join(root, '.claude', 'audit');
  fs.mkdirSync(auditDir, { recursive: true });
  const version = readPluginVersion();
  fs.appendFileSync(path.join(auditDir, 'handoff.jsonl'), JSON.stringify(version ? { ...record, plugin_version: version } : record) + '\n');
}

// The near and far ends of a gap are named DIFFERENTLY by the platform, and pairing has to bridge
// that or it silently never fires: a handback carries the instance `agent_id` (`agent_01AB…`), a
// spawn carries a role TYPE (`nexus:developer`), and a SendMessage carries what the coordinator
// addressed — an agent id, or a named spawn's NAME (`dev-fix-c2`). An id-only match would leave every spawn-started round open forever.
// So a closer matches a handback when its target equals that handback's agent_id, OR — failing that
// — when both reduce to the same role. The reduction is the shared resolve-role lib, which already
// peels a namespace and a role-prefixed spawn name (`nexus:developer`, `developer-2`, `dev-fix-c2`
// all -> developer); re-deriving it here would be a second copy free to drift from the detector's.
const { resolveRole } = require('./lib/resolve-role');
const { stepCheckpoint, isRangeEnd, handbackText } = require('./lib/step-checkpoint');
const { isSafeId } = require('./lib/safe-id');

const DAY_MS = 24 * 60 * 60 * 1000;
const STEP_ID = '(\\d+[a-z]?)';
const SPAN = `${STEP_ID}\\s*[-–]\\s*${STEP_ID}`;
// First match wins, so a slice line beats a steps line in the same prompt.
const RANGE_FORMS = [
  new RegExp(`\\bYour slice:\\s*${SPAN}`),
  new RegExp(`\\bImplement\\.\\s*Steps:\\s*${SPAN}`),
  new RegExp(`\\bBuild\\s+\\S+,\\s*steps\\s+${SPAN}`),
  new RegExp(`\\bYour steps:\\s*${SPAN}`),
];

// The team lead's fix-round dispatch: `Fix round for {slug}. Cycle {N}/3.`
const FIX_ROUND = /\bFix round for\b[^\n]*?\bCycle\s+(\d+)\s*\/\s*(\d+)/;

function parseRange(text) {
  const s = String(text || '');
  for (const re of RANGE_FORMS) {
    const m = re.exec(s);
    if (m) return { from: m[1], to: m[2] };
  }
  return null;
}

function devStepsDir(root) {
  return path.join(root, '.claude', 'audit', 'dev-steps');
}

function agentTypesDir(root) {
  return path.join(root, '.claude', 'audit', 'agent-types');
}

function writeDevState(root, id, state) {
  writeStateFile(devStepsDir(root), id, state);
}

function writeStateFile(dir, id, state) {
  if (!isSafeId(id)) return;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ ...state, ts: new Date().toISOString() }));
  fs.renameSync(tmp, file);
  pruneDevStates(dir);
}

// A file whose `ts` is a day old is dropped (mtime when `ts` is unreadable, and for a temp file a
// killed writer left behind); a developer idle that long falls back to the plain role row when resumed.
function pruneDevStates(dir) {
  const cutoff = Date.now() - DAY_MS;
  for (const f of fs.readdirSync(dir)) {
    const tmp = f.endsWith('.tmp');
    if (!tmp && !f.endsWith('.json')) continue;
    const file = path.join(dir, f);
    try {
      let at = NaN;
      if (!tmp) {
        try { at = Date.parse(JSON.parse(fs.readFileSync(file, 'utf8')).ts); } catch { /* unreadable */ }
      }
      if (!Number.isFinite(at)) at = fs.statSync(file).mtimeMs;
      if (at < cutoff) fs.unlinkSync(file);
    } catch { /* another session removed it first */ }
  }
}

function readDevState(root, id) {
  if (!isSafeId(id)) return null;
  try {
    const s = JSON.parse(fs.readFileSync(path.join(devStepsDir(root), `${id}.json`), 'utf8'));
    return s && typeof s === 'object' ? s : null;
  } catch { return null; }
}

function fixRound(text) {
  const m = FIX_ROUND.exec(String(text || ''));
  return m ? `${m[1]}/${m[2]}` : '';
}

function onDevResume(root, id, message) {
  const state = readDevState(root, id);
  if (!state) return;
  const text = typeof message === 'string' ? message : JSON.stringify(message || '');
  const range = parseRange(text);
  const cycle = fixRound(text);
  const pastEnd = !range && state.range && state.step && state.step === state.range.to;
  let phase = state.phase;
  if (cycle) phase = 'review-fixes';
  else if (/\bImplement\.\s*Steps:/.test(text)) phase = null;
  else if (!phase && pastEnd) phase = 'fixes';
  writeDevState(root, id, {
    ...state, range: range || state.range, phase, cycle: cycle || state.cycle || null, phaseDone: false,
  });
}

// The phase clears only when a step or the range end is recorded: a Phase-1 hand-back
// ("All clear", questions) records neither, so the row keeps reading "analyze done". A fix-phase
// hand-back keeps its phase and marks it done until the next resume.
function onDevHandback(root, id, step, message) {
  const state = readDevState(root, id);
  if (!state) return;
  if (state.phase === 'review-fixes' || state.phase === 'fixes') {
    writeDevState(root, id, { ...state, phaseDone: true });
    return;
  }
  const reached = step || (isRangeEnd(message) && state.range ? state.range.to : '');
  if (!reached) return;
  writeDevState(root, id, { ...state, step: reached, phase: null });
}

function parseResponse(resp) {
  if (typeof resp === 'string') {
    try { return JSON.parse(resp) || {}; } catch { return {}; }
  }
  return resp && typeof resp === 'object' ? resp : {};
}

function onDevSpawn(root, ti, resp) {
  if (resolveRole(ti.subagent_type) !== 'developer') return;
  const id = String((resp && resp.agentId) || '');
  const description = String(ti.description || resp.description || '');
  const prompt = String(ti.prompt || resp.prompt || '');
  const name = description.trim().split(/\s+/)[0] || '';
  const cycle = fixRound(prompt);
  const phase = cycle ? 'review-fixes' : /^Analyze\b/.test(prompt.trimStart()) ? 'analyze' : null;
  writeDevState(root, id, { name, range: parseRange(prompt), phase, step: null, ...(cycle ? { cycle } : {}) });
}

// --report: pair each handback with the next resume/spawn that names that agent, and total per
// round. An unpaired handback stays OPEN — the run ended, or the resume never fired. Reporting a
// number there would fabricate the very measurement this exists to take.
function printReport() {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  let lines = [];
  try {
    lines = fs.readFileSync(path.join(root, '.claude', 'audit', 'handoff.jsonl'), 'utf8')
      .split('\n').filter(Boolean);
  } catch { /* no log */ }
  const rows = [];
  for (const l of lines) {
    // A line can parse and still be shaped wrong (hand-edited log, a future producer). Drop anything
    // without a usable timestamp here: an unparseable ts would otherwise make the comparator
    // inconsistent AND put NaN in the output, which reads as a measurement rather than an absence.
    try {
      const r = JSON.parse(l);
      if (Number.isFinite(Date.parse(r && r.ts))) rows.push(r);
    } catch { /* skip a torn line */ }
  }
  if (!rows.length) {
    process.stdout.write('No handoff records — .claude/audit/handoff.jsonl is missing or empty.\n');
    return;
  }
  rows.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));

  // One forward pass. Each closer closes AT MOST ONE handback — the earliest still-open one it
  // matches — because a `find` that never consumes its match lets a single resume close every
  // preceding handback of that agent and counts the same dead time two or three times over. That
  // inflates the metric, which is the worse failure direction for a number meant to settle an
  // argument about how much of a run is dead time.
  const open = [];
  const gaps = [];
  for (const r of rows) {
    if (r.event === 'handback') {
      if (!r.agent_id) continue; // nothing to attribute a gap to
      const gap = {
        agent: String(r.agent_id), type: String(r.agent_type || ''),
        token: r.token || '(none)', at: Date.parse(r.ts), ms: null,
      };
      gaps.push(gap);
      open.push(gap);
      continue;
    }
    if (!r.target) continue;
    const exact = open.findIndex((g) => g.agent === r.target);
    const role = resolveRole(r.target);
    const at = exact === -1
      ? open.findIndex((g) => g.type && role && resolveRole(g.type) === role)
      : exact;
    if (at === -1) continue; // a closer for an agent that never handed back here
    const [g] = open.splice(at, 1);
    g.ms = Date.parse(r.ts) - g.at;
  }

  const width = Math.max(5, ...gaps.map((g) => g.agent.length));
  process.stdout.write('handback -> next resume (ms)\n');
  for (const g of gaps) {
    process.stdout.write(
      `  ${g.agent.padEnd(width)}  ${g.type}  ${g.ms === null ? 'open (never resumed)' : g.ms}\n`
    );
  }
  const byRound = new Map();
  for (const g of gaps) {
    if (g.ms === null) continue;
    byRound.set(g.token, (byRound.get(g.token) || 0) + g.ms);
  }
  process.stdout.write('\nper-round total (ms)\n');
  for (const [token, total] of byRound) process.stdout.write(`  ${token}  ${total}\n`);

  // Human wait: pair each turn-end with the NEXT user-resume in the SAME session. Sessions, not
  // agent roles, are the join key here — Stop and UserPromptSubmit both fire on the main session,
  // never on a subagent, so there is no role to resolve. Same non-double-counting shape as the
  // handback pass above: a FIFO queue per session, so a resume closes at most one still-open
  // turn-end — the earliest one — and an unpaired turn-end stays OPEN rather than reading as zero.
  const openTurns = new Map();
  const turnGaps = [];
  for (const r of rows) {
    if (r.event === 'turn-end') {
      const session = String(r.session || '');
      const gap = { session, at: Date.parse(r.ts), ms: null };
      turnGaps.push(gap);
      if (!openTurns.has(session)) openTurns.set(session, []);
      openTurns.get(session).push(gap);
      continue;
    }
    if (r.event === 'user-resume') {
      const session = String(r.session || '');
      const queue = openTurns.get(session);
      if (!queue || !queue.length) continue; // a resume with no open turn-end in this session
      const gap = queue.shift();
      gap.ms = Date.parse(r.ts) - gap.at;
    }
  }

  const sessionWidth = Math.max(7, ...turnGaps.map((g) => g.session.length));
  process.stdout.write('\nhuman wait: turn-end -> next user-resume (ms)\n');
  for (const g of turnGaps) {
    process.stdout.write(
      `  ${g.session.padEnd(sessionWidth)}  ${g.ms === null ? 'open (no resume)' : g.ms}\n`
    );
  }
  const bySession = new Map();
  for (const g of turnGaps) {
    if (g.ms === null) continue;
    bySession.set(g.session, (bySession.get(g.session) || 0) + g.ms);
  }
  process.stdout.write('\nhuman wait per-session total (ms)\n');
  for (const [session, total] of bySession) process.stdout.write(`  ${session}  ${total}\n`);
}

if (process.argv[2] === '--report') {
  try { printReport(); } catch { /* fail silent — a report is never load-bearing */ }
  process.exit(0);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const session = String(data.session_id || '');
    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

    let token = '';
    try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

    const ts = new Date().toISOString();
    const eventName = String(data.hook_event_name || '');

    // Dispatch on hook_event_name FIRST: both new events arrive with no tool_name, exactly like a
    // genuine SubagentStop handback, so they must be routed here before the tool-less branch below
    // ever sees them — otherwise each would be misrecorded as a handback with no agent to blame it on.
    if (eventName === 'SubagentStart') {
      if (data.agent_id && data.agent_type) {
        try { writeStateFile(agentTypesDir(root), String(data.agent_id), { type: String(data.agent_type) }); } catch { /* display-only */ }
      }
      return process.exit(0);
    }
    if (eventName === 'Stop') {
      const promptId = String(data.prompt_id || '');
      appendRecord(root, { ts, event: 'turn-end', prompt_id: promptId, session });
      return process.exit(0);
    }
    if (eventName === 'UserPromptSubmit') {
      const promptId = String(data.prompt_id || '');
      appendRecord(root, { ts, event: 'user-resume', prompt_id: promptId, session });
      return process.exit(0);
    }

    const tool = String(data.tool_name || '');

    if (!tool) {
      // The remaining tool-less payload: a SubagentStop — a subagent has handed back. Stop and
      // UserPromptSubmit are handled above and never reach here.
      const agentId = String(data.agent_id || '');
      if (!agentId) return process.exit(0); // nothing to attribute the gap to
      if (!data.agent_type) return process.exit(0); // internal ~30s event, not a real handback
      const agentType = String(data.agent_type).toLowerCase().split(/[:/]/).pop();
      // A developer's step checkpoint stamps the plan's step id (header, F175); nothing otherwise.
      const isDev = resolveRole(data.agent_type) === 'developer';
      const text = isDev ? handbackText(data) : '';
      const step = isDev ? stepCheckpoint(text) : '';
      appendRecord(root, { ts, event: 'handback', agent_id: agentId, agent_type: agentType, token, session, ...(step ? { step } : {}) });
      if (isDev) {
        try { onDevHandback(root, agentId, step, text); } catch { /* display-only */ }
      }
      return process.exit(0);
    }

    // The other endpoint of a gap: the coordinator went back to an agent, or started a new one.
    // `to` is the documented SendMessage field; `recipient` is accepted because the payload shape is
    // unverified on this CLI and guessing wrong here would silently record nothing.
    const ti = data.tool_input || {};
    // `Agent|Task` is the spawn surface boundary-detector already treats as one thing — matching it
    // here keeps the two hooks from disagreeing about what a spawn is.
    const event = /^(Agent|Task)$/.test(tool) ? 'spawn' : tool === 'SendMessage' ? 'resume' : '';
    if (!event) return process.exit(0); // a tool this hook does not track — zero footprint
    const target = String(
      (event === 'spawn' ? ti.subagent_type : (ti.to || ti.recipient)) || ''
    );
    if (!target) return process.exit(0); // an unaddressable record cannot be paired with a handback
    appendRecord(root, { ts, event, target, token, session });
    try {
      if (event === 'spawn') onDevSpawn(root, ti, parseResponse(data.tool_response));
      else onDevResume(root, target, ti.message);
    } catch { /* the state file is display-only: never block the record above */ }
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
