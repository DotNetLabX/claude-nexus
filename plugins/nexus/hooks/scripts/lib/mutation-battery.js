'use strict';
/**
 * The mutation runner's pure core (mutation-run.js beside the folder above drives it).
 *
 * THE MANIFEST is a JSON array of mutants, each `{id, file, find, replace, tests, line?, note?}` and no other
 * key: `id` a non-empty string, unique by exact match; `file` and every entry of `tests` (non-empty) a
 * relative path with no `..` segment; `find` non-empty exact text and `replace` a string that differs from
 * it; `line` a whole number from 1, the line `find` must start on. `validateManifest` returns every error at
 * once.
 *
 * CONTAINMENT: a mutant's file and its tests must resolve, through `fs.realpathSync`, to the same place
 * inside the copy as their path names — a path that passes through a linked folder resolves elsewhere and
 * is refused, so no mutant writes a file of the real tree.
 *
 * APPLY: `find` must occur exactly once — on its `line` when one is given — read with the file's own line
 * endings (each `\n` in `find` and `replace` becomes the file's `\r\n` in a CRLF file); else the mutant is
 * not applied, with why: `absent`, `{n} matches` or `not on line {L}`. Overlapping matches count.
 *
 * CLASSIFY reads one verify-run.js record against the baseline's failing tests (by name and target):
 * a pass survives; a cut run or a timed-out test is a timeout; a fail whose new failures include a node
 * test with `code: "ERR_ASSERTION"` is killed, those tests its killers; a fail whose named failures were all
 * failing at the baseline is masked, naming those tests in `masking` — never a survivor, since one of them
 * may be the test that pins the mutated code; any other fail — a load failure, a thrown error, a
 * record naming no test, another runner — is unscored, with each failure's code or message as why. A kill
 * is never counted from an exit status or a test name alone.
 *
 * THE SUMMARY counts each status and names as a suspect each test that killed every killed mutant, where
 * three or more were killed — likely a drift or size check rather than a behaviour test; the reader
 * decides.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS = new Set(['id', 'file', 'find', 'replace', 'tests', 'line', 'note']);
const STATUSES = ['killed', 'survived', 'masked', 'timeout', 'unscored', 'not-applied'];
const SUSPECT_FROM = 3;
const SUSPECT_NOTE = 'suspect: kills every killed mutant — a drift or size check, not a behaviour test?';

const slashed = (p) => String(p).replace(/\\/g, '/');

function relativeOk(p) {
  if (typeof p !== 'string' || !p.trim() || path.isAbsolute(p) || /^[a-zA-Z]:/.test(p)) return false;
  return !slashed(p).split('/').includes('..');
}

function validateManifest(value) {
  if (!Array.isArray(value)) return { errors: ['the manifest is not a JSON array of mutants'], mutants: [] };
  if (!value.length) return { errors: ['the manifest holds no mutant'], mutants: [] };
  const errors = [];
  const seen = new Set();
  value.forEach((m, i) => {
    const at = `mutant ${i + 1}${m && typeof m.id === 'string' && m.id ? ` (${m.id})` : ''}`;
    if (!m || typeof m !== 'object' || Array.isArray(m)) { errors.push(`${at}: not an object`); return; }
    for (const key of Object.keys(m)) if (!KEYS.has(key)) errors.push(`${at}: unknown key "${key}"`);
    if (typeof m.id !== 'string' || !m.id) errors.push(`${at}: id must be a non-empty string`);
    else if (seen.has(m.id)) errors.push(`${at}: duplicate id "${m.id}"`);
    else seen.add(m.id);
    if (!relativeOk(m.file)) errors.push(`${at}: file must be a relative path inside the tree, with no ..`);
    if (typeof m.find !== 'string' || !m.find) errors.push(`${at}: find must be non-empty text`);
    if (typeof m.replace !== 'string') errors.push(`${at}: replace must be a string`);
    else if (m.replace === m.find) errors.push(`${at}: replace must differ from find`);
    if (!Array.isArray(m.tests) || !m.tests.length || !m.tests.every(relativeOk)) {
      errors.push(`${at}: tests must be a non-empty list of relative test-file paths, with no ..`);
    }
    if (m.line !== undefined && !(Number.isInteger(m.line) && m.line >= 1)) errors.push(`${at}: line must be a whole number from 1`);
    if (m.note !== undefined && typeof m.note !== 'string') errors.push(`${at}: note must be a string`);
  });
  return { errors, mutants: errors.length ? [] : value };
}

function containmentError(copyRoot, mutant) {
  let root;
  try { root = fs.realpathSync(copyRoot); } catch { return `the copy ${copyRoot} cannot be read`; }
  for (const rel of [mutant.file, ...mutant.tests]) {
    const expected = path.join(root, rel);
    let real;
    try { real = fs.realpathSync(expected); } catch { return `${slashed(rel)}: not found in the copy`; }
    if (real !== expected) return `${slashed(rel)}: resolves through a link, outside the copy's own files`;
  }
  return null;
}

function applyMutant(text, mutant) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const find = mutant.find.replace(/\r?\n/g, eol);
  const replace = mutant.replace.replace(/\r?\n/g, eol);
  const starts = [];
  for (let at = text.indexOf(find); at >= 0; at = text.indexOf(find, at + 1)) starts.push(at);
  if (!starts.length) return { ok: false, why: 'absent' };
  const lineOf = (offset) => text.slice(0, offset).split('\n').length;
  const scoped = mutant.line === undefined ? starts : starts.filter((s) => lineOf(s) === mutant.line);
  if (!scoped.length) return { ok: false, why: `not on line ${mutant.line}` };
  if (scoped.length > 1) return { ok: false, why: `${scoped.length} matches` };
  const at = scoped[0];
  return { ok: true, text: text.slice(0, at) + replace + text.slice(at + find.length) };
}

const keyOf = (t) => `${t.target}\u0000${t.test}`;

function classify(record, baselineFailing) {
  if (!record || typeof record !== 'object') return { status: 'unscored', killers: [], why: 'no run record' };
  if (record.verdict === 'pass') return { status: 'survived', killers: [], why: null };
  if (record.reason === 'timeout' || (Array.isArray(record.timed_out) && record.timed_out.length)) {
    return { status: 'timeout', killers: [], why: record.reason === 'timeout' ? 'the run was cut at its limit' : 'a test timed out' };
  }
  if (record.verdict !== 'fail') return { status: 'unscored', killers: [], why: `the run read ${record.verdict}${record.reason ? ` (${record.reason})` : ''}` };
  if (!Array.isArray(record.failed_tests) || !record.failed_tests.length) {
    return { status: 'unscored', killers: [], why: 'the record names no failed test' };
  }
  const base = new Set((baselineFailing || []).map(keyOf));
  const fresh = record.failed_tests.filter((t) => t && !base.has(keyOf(t)));
  if (!fresh.length) {
    const masking = record.failed_tests.filter(Boolean).map((t) => ({ test: t.test, target: t.target }));
    return { status: 'masked', killers: [], masking, why: `failed only in tests failing at the baseline: ${masking.map((t) => t.test || t.target).join(', ')}` };
  }
  const killers = fresh.filter((t) => t.runner === 'node' && t.code === 'ERR_ASSERTION').map((t) => ({ test: t.test, target: t.target }));
  if (killers.length) return { status: 'killed', killers, why: null };
  const why = fresh.map((t) => `${t.test || t.target}: ${t.runner !== 'node' ? `runner ${t.runner}` : t.code || t.message || 'no code'}`).join('; ');
  return { status: 'unscored', killers: [], why };
}

function summarize(results) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of results) if (Object.hasOwn(counts, r.status)) counts[r.status]++;
  const kills = results.filter((r) => r.status === 'killed');
  if (kills.length < SUSPECT_FROM) return { counts, suspects: [] };
  const suspects = kills[0].killers
    .filter((k) => kills.every((r) => r.killers.some((o) => keyOf(o) === keyOf(k))))
    .map((k) => ({ test: k.test, target: k.target, note: SUSPECT_NOTE }));
  return { counts, suspects };
}

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function restoreError(file, pristineHash) {
  let bytes;
  try { bytes = fs.readFileSync(file); } catch (e) { return `${slashed(file)}: cannot be read after the restore (${e.code || e.message})`; }
  return hashBytes(bytes) === pristineHash ? null : `${slashed(file)}: the restored bytes' hash does not match the pristine one`;
}

module.exports = { validateManifest, containmentError, applyMutant, classify, summarize, hashBytes, restoreError, SUSPECT_NOTE };
