#!/usr/bin/env node
/**
 * Nexus SessionStart nudge: a repo hears about it once when it has NOT declared its verify roles,
 * and once when it HAS but never timed them.
 *
 * WHY THIS EXISTS. The declared verify roster (`.claude/verify.json` → `roles`: build / unit / full /
 * mutation) is what lets a developer close a step with ONE call instead of rediscovering the build
 * and test commands every run, and what lets the close gate run the full suite once with a record.
 * It shipped with no trigger: every consuming repo sat silently undeclared for two weeks and the
 * feature measured nothing (owner ruling 2026-09-09 — "you failed to implement a mechanic to make the
 * agent attentive to this and ask"). This hook is that mechanic's first half; the pre-flight ask in
 * team-lead.md / architect.md is the second.
 *
 * ONE LINE PER CONCERN, ADDRESSED TO THE AGENT AS WORK. Mirrors the channels extension's onboarding nudge: the
 * line opens with a RELAY instruction (speak it in the first user-visible reply, once), because a
 * bare statement of repo state measurably gets filed as background and never spoken. The quoted
 * phrase inside is what the person says back to start the recipe (`declare-verify-roles` skill).
 *
 * WHEN IT FIRES. When `roles` is undeclared — no `.claude/verify.json`, or one without a
 * `roles.unit` string — and, separately, when `roles.unit` IS declared but the file records no
 * measurement for it. That second case exists because every over-broad declaration we have measured
 * was hand-written against a recipe that never asked how long the command takes: an unmeasured
 * declaration is the shape the defect comes in, so it is worth one line. The check reads the
 * declaration ONLY — it runs no command and reads no log, which is the whole reason the recipe now
 * writes the number into the file. A repo happy with the default commit strategy is NOT nagged about
 * `commitStrategy`: that key is optional and the recipe offers it. A verify.json that exists and
 * fails to parse is the LOUD case (the line names the parse failure) — present-but-broken is never
 * treated as absent. Silent on `compact` (same conversation, already told) and on `resume`; `clear`
 * and `startup` nudge again. Opt-out: `"declarationsNudge": false` in `.claude/nexus-agents.json`.
 *
 * FILTERED_FULL, OUTSIDE THE LADDER. A `roles.full` carrying a filter clause is not the complete
 * suite the close runs once, whatever state the ladder reads — so its line is decided from
 * `roles.full` alone and rides the same injection as the ladder's line (two lines, one output).
 * Warn-only. The clause forms belong to lib/compose-test-command.js; this file imports the
 * predicate and holds no list of its own.
 *
 * OWN CAP. A separate hook output, capped by the platform independently of the kernel envelope —
 * this line costs the kernel budget nothing. NOTHING HERE WRITES.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { isFilteredFull } = require('./lib/compose-test-command');

const RELAY = 'Tell the user once, in your first reply, in your own words, keeping the quoted phrase exactly as written: ';
const NUDGE = RELAY + 'This repo hasn\'t declared its verify roles (the build / unit / full test commands in .claude/verify.json) — until it does, the developer speed features stay off: every run rediscovers the build and test commands, and the close cannot prove the full suite ran. Say "declare verify roles" and I will set them up from this repo\'s conventions, or silence this with "declarationsNudge": false in .claude/nexus-agents.json.';
const BROKEN = (why) => RELAY + 'This repo\'s .claude/verify.json exists but does not parse (' + why + ') — the verify gate is running on its detection fallback and the declared roles are unread. Say "declare verify roles" and I will repair it.';
const FILTERED_FULL = RELAY + 'This repo\'s "full" verify role in .claude/verify.json carries a filter clause, so the suite the close runs once is not the whole suite — the tests the clause leaves out run at no gate. Slow tests belong in the "unit" exclusion instead: the complete run at handover already covers them. Say "declare verify roles" and I will re-propose "full" without the clause, or silence this with "declarationsNudge": false in .claude/nexus-agents.json.';
const UNMEASURED = RELAY + 'This repo declared its verify roles but never timed them: .claude/verify.json records no measurement for the "unit" role, the command a step close runs, so nothing shows whether it is inside the 30-second bound or is really the whole suite. This is a one-time re-measure after an upgrade, not a fault report. Say "declare verify roles" and I will time the declared commands and record the numbers, or silence this with "declarationsNudge": false in .claude/nexus-agents.json.';

function resolveRoot(evt) {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  if (evt && typeof evt.cwd === 'string' && fs.existsSync(evt.cwd)) return evt.cwd;
  return process.cwd();
}

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

/**
 * A measurement counts only when `measured.unit` carries BOTH a positive, finite numeric `ms` and a
 * non-empty `at`. Anything less — an empty object, either field missing, a non-numeric or
 * non-positive `ms`, a `measured` that is not an object at all — is "no measurement", which warns.
 * Never throws: every shape is interrogated defensively because this runs at session start. The
 * finite check is belt-and-braces rather than a JSON case (JSON.parse yields no NaN or Infinity) —
 * `inspect` is exported and can be handed a hand-built object.
 */
function hasMeasurement(cfg) {
  const measured = cfg && cfg.measured;
  if (!measured || typeof measured !== 'object') return false;
  const u = measured.unit;
  if (!u || typeof u !== 'object') return false;
  const msOk = typeof u.ms === 'number' && Number.isFinite(u.ms) && u.ms > 0;
  const atOk = typeof u.at === 'string' && u.at.trim() !== '';
  return msOk && atOk;
}

/** Returns { state: 'declared' | 'unmeasured' | 'absent' | 'broken', why?, filtered } — never throws. */
function inspect(root) {
  const file = path.join(root, '.claude', 'verify.json');
  if (!fs.existsSync(file)) return { state: 'absent', filtered: false };
  let cfg;
  try { cfg = readJson(file); } catch (e) { return { state: 'broken', why: String(e && e.message || e).slice(0, 120), filtered: false }; }
  const roles = cfg && cfg.roles;
  const filtered = Boolean(roles && typeof roles === 'object' && typeof roles.full === 'string' && isFilteredFull(roles.full));
  if (roles && typeof roles === 'object' && typeof roles.unit === 'string' && roles.unit.trim()) {
    return { state: hasMeasurement(cfg) ? 'declared' : 'unmeasured', filtered };
  }
  return { state: 'absent', filtered };
}

function silenced(root) {
  try {
    const cfg = readJson(path.join(root, '.claude', 'nexus-agents.json'));
    return cfg && cfg.declarationsNudge === false;
  } catch { return false; }
}

function inject(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
  }));
  process.exit(0);
}

function main(evt) {
  const source = evt && evt.source;
  if (source === 'compact' || source === 'resume') return process.exit(0);
  const root = resolveRoot(evt);
  if (silenced(root)) return process.exit(0);
  const r = inspect(root);
  const lines = [];
  if (r.state === 'broken') lines.push(BROKEN(r.why));
  else if (r.state === 'unmeasured') lines.push(UNMEASURED);
  else if (r.state === 'absent') lines.push(NUDGE);
  if (r.filtered) lines.push(FILTERED_FULL);
  if (lines.length === 0) return process.exit(0);
  return inject(lines.join('\n'));
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    let evt = {};
    try { evt = raw.trim() ? JSON.parse(raw) : {}; } catch { evt = {}; }
    try { main(evt); } catch { process.exit(0); } // fail open — a nudge must never break a session start
  });
  // A hook invoked without a piped stdin still runs the check.
  if (process.stdin.isTTY) { try { main({}); } catch { process.exit(0); } }
}

module.exports = { inspect, NUDGE, UNMEASURED, FILTERED_FULL, RELAY };
