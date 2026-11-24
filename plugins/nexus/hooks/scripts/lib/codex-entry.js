'use strict';
/**
 * The one reader of a Codex entry and of the seat table.
 *
 * A CODEX ENTRY is a helper job's or a role's object in `.claude/nexus-agents.json`:
 * `{ "model": "codex", "effort": "{level}", "codexModel": "{name}" }`, every key but `model` optional and no
 * other key allowed. `codexEntry` answers whether a value is one, the effort where it names a Codex level, and
 * the Codex model where the name has the shape — letters, digits, `.`, `_`, `:` and `-`, opening with a letter or
 * digit. The shape is the only check: no list of models is held here, and a well-shaped name is returned as
 * written. `textModel` says whether `model` is a string; a caller that takes a model only from a string `model`
 * reads it.
 *
 * THE SEAT TABLE is `codex-seats.json` beside this file, read by nothing else: one row per pipeline role with
 * its seven fields — the role, whether its seat may run on Codex (`yes`, `not yet`, `not a seat`), the unit one
 * job takes, the question phase, the hand-back phrases, the checks after the job and the Claude fallback. A
 * `not yet` row whose seat is built but closed keeps those fields and adds `notYetReason`, the reason it is not
 * open. A `yes` row may name the platforms it is open on (`platforms`, `process.platform` values) with
 * `notYetReason` for the others; a `yes` row naming none is open everywhere. `seatState` gives a role's answer on
 * this platform — `yes`, or the row's closed answer with its reason and, where only the platform closes it, that
 * platform — `seatAllowed` whether it is `yes`, and `seatAnswer` the answer with its reason. A role gains a seat by
 * a change to that file alone. The developer's and the solo's rows are open on Windows.
 *
 * A row's `checksAfterJob.afterJobRuns` names the runs the job helper makes after the job's end (lib/seat-after.js).
 *
 * TEST SEAMS, both honoured only under the test runner: `NEXUS_CODEX_SEAT_TABLE` names another table file to read
 * in this file's place, read again whenever the name changes — tests point it at a table whose seats are open
 * everywhere — and `seatTableFile` names that file, null for the shipped one; `NEXUS_CODEX_PLATFORM` names the
 * platform the table is read for.
 *
 * `testSeam(name)` reads a test-only variable: its value only where NODE_TEST_CONTEXT is set, which `node --test`
 * sets and a session never does; else undefined, as for an empty value. Every NEXUS_CODEX_SEAT_TABLE,
 * NEXUS_CODEX_PLATFORM, NEXUS_CODEX_EXEC, NEXUS_CODEX_BOX, NEXUS_CODEX_VERSION_CMD, NEXUS_CODEX_TEMP_ROOTS and
 * NEXUS_CODEX_PROFILE_READ read goes through it.
 */
const fs = require('fs');
const path = require('path');

const SHIPPED_TABLE = path.join(__dirname, 'codex-seats.json');
let loaded = { file: null, table: null };

function tableFile() {
  const named = testSeam('NEXUS_CODEX_SEAT_TABLE');
  return named ? path.resolve(named) : SHIPPED_TABLE;
}
function table() {
  const file = tableFile();
  if (loaded.file !== file) loaded = { file, table: JSON.parse(fs.readFileSync(file, 'utf8')) };
  return loaded.table;
}
/** The table file read in the shipped one's place, or null where the shipped one is read. */
function seatTableFile() {
  const file = tableFile();
  return file === SHIPPED_TABLE ? null : file;
}
const LEVELS = Object.freeze(['none', 'minimal', 'low', 'medium', 'high', 'xhigh']);
const KEYS = Object.freeze(['model', 'effort', 'codexModel']);
const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const CODEX = 'codex';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const copy = (row) => JSON.parse(JSON.stringify(row));

/** A value read as text names Codex — `["codex"]` included. */
const readsCodex = (v) => String(v).trim().toLowerCase() === CODEX;
/** A string value names Codex. */
const isCodexValue = (v) => typeof v === 'string' && readsCodex(v);
const effortLevel = (v) => (LEVELS.includes(v) ? v : null);
const modelName = (v) => (typeof v === 'string' && MODEL_NAME.test(v) ? v : null);

/** `{effort, codexModel, textModel}` for a Codex entry, else null. */
function codexEntry(v) {
  if (!isObject(v) || !readsCodex(v.model)) return null;
  if (Object.keys(v).some((k) => !KEYS.includes(k))) return null;
  return { effort: effortLevel(v.effort), codexModel: modelName(v.codexModel), textModel: typeof v.model === 'string' };
}

function seatRows() { return table().seats.map(copy); }

function seatRow(role) {
  const row = table().seats.find((r) => r.role === role);
  return row ? copy(row) : null;
}

function testSeam(name, env = process.env) {
  if (!env.NODE_TEST_CONTEXT) return undefined;
  const value = env[name];
  return value === undefined || value === '' ? undefined : value;
}

const platformNow = () => testSeam('NEXUS_CODEX_PLATFORM') || process.platform;

/** `{seat, reason, platform}` for a role on this platform; null for a role with no row. */
function seatState(role) {
  const row = seatRow(role);
  if (!row) return null;
  const platform = platformNow();
  if (row.codexSeat === 'yes' && Array.isArray(row.platforms) && !row.platforms.includes(platform)) {
    return { seat: 'not yet', reason: row.notYetReason || null, platform };
  }
  return { seat: row.codexSeat, reason: row.codexSeat === 'not yet' ? row.notYetReason || null : null, platform: null };
}

const seatAllowed = (role) => { const state = seatState(role); return Boolean(state && state.seat === 'yes'); };

/** The role's seat answer here, `not yet: {reason}` where a closed row gives one; `no seat` for a role with no row. */
function seatAnswer(role) {
  const state = seatState(role);
  if (!state) return 'no seat';
  return state.seat === 'not yet' && state.reason ? `not yet: ${state.reason}` : state.seat;
}

module.exports = { LEVELS, KEYS, readsCodex, isCodexValue, effortLevel, modelName, codexEntry, seatRows, seatRow, seatState, seatAllowed, seatAnswer, seatTableFile, testSeam };
