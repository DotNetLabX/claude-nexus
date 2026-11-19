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
 * open; `seatAnswer` gives the row's answer with that reason. A role gains a seat by a change to that file alone.
 * No row reads `yes` today.
 *
 * TEST SEAM: `NEXUS_CODEX_SEAT_TABLE`, where set and not empty, names another table file to read in this file's
 * place, read again whenever the name changes. Tests point it at a table whose seats are open.
 */
const fs = require('fs');
const path = require('path');

const SHIPPED_TABLE = path.join(__dirname, 'codex-seats.json');
let loaded = { file: null, table: null };

function table() {
  const named = process.env.NEXUS_CODEX_SEAT_TABLE;
  const file = named ? path.resolve(named) : SHIPPED_TABLE;
  if (loaded.file !== file) loaded = { file, table: JSON.parse(fs.readFileSync(file, 'utf8')) };
  return loaded.table;
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

const seatAllowed = (role) => { const row = seatRow(role); return Boolean(row && row.codexSeat === 'yes'); };

/** The row's seat answer, `not yet: {reason}` where a closed row gives one; `no seat` for a role with no row. */
function seatAnswer(role) {
  const row = seatRow(role);
  if (!row) return 'no seat';
  return row.codexSeat === 'not yet' && row.notYetReason ? `not yet: ${row.notYetReason}` : row.codexSeat;
}

module.exports = { LEVELS, KEYS, readsCodex, isCodexValue, effortLevel, modelName, codexEntry, seatRows, seatRow, seatAllowed, seatAnswer };
