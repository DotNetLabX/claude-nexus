#!/usr/bin/env node
/**
 * Nexus lessons-append: a locked append to a feature's lessons.md, for agents writing it at the same
 * time (the done check beside the code review and its second reader).
 *
 *   node lessons-append.js --file <lessons.md> --role <role> --from <text file> [--section <heading>] [--session <id>]
 *
 * The text in `--from` lands at the end of the `## {Role} Lessons` section (or `--section`, e.g.
 * "Skill Gaps"), creating the section — and a missing file with its header — when absent. The file is
 * read only after the lock is taken, so a concurrent writer's text is never overwritten.
 *
 * NEVER BLOCKS (owner condition): a lost lesson is acceptable, a stalled pipeline is not. The lock is
 * an exclusive create under `.claude/audit/lessons-append/`, waited on for at most 2 s; a lock older
 * than 10 s is removed as stale; when the lock still cannot be taken the write happens anyway with a
 * warning. Every I/O failure is a warning and exit 0 — only a missing argument exits non-zero.
 *
 * The write is not a Write/Edit tool call, so lessons-tracker.js never sees it: this script appends
 * the same `lessons-writes.log` row itself, so pipeline-gate.js's lessons check still counts it.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WAIT_MS = 2000;
const STALE_MS = 10000;
const POLL_MS = 50;
const LESSONS_RE = /(?:^|\/)docs\/specs\/(.+)\/delivery\/lessons\.md$/;
const HEADINGS = { po: 'PO Lessons' };

function warn(msg) {
  process.stderr.write(`lessons-append: ${msg}\n`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(file|role|from|section|session)$/.exec(argv[i]);
    if (m && i + 1 < argv.length) out[m[1]] = argv[++i];
  }
  return out;
}

function headingFor(role) {
  const r = String(role).toLowerCase();
  return HEADINGS[r] || `${r.charAt(0).toUpperCase()}${r.slice(1)} Lessons`;
}

function takeLock(lockPath) {
  const deadline = Date.now() + WAIT_MS;
  let announced = false;
  for (;;) {
    try {
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') return false;
    }
    try {
      if (Date.now() - fs.statSync(lockPath).mtimeMs > STALE_MS) fs.rmSync(lockPath, { force: true });
    } catch { /* the holder released it between the create and the stat */ }
    if (Date.now() >= deadline) return false;
    if (!announced) { warn('waiting for lock'); announced = true; }
    sleep(POLL_MS);
  }
}

function insert(text, slug, section, body) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const add = body.replace(/\r\n/g, '\n').replace(/\s+$/, '').split('\n');
  const lines = text === '' ? [`# ${slug || 'Feature'} — Lessons`] : text.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  const at = lines.findIndex((l) => l.trim() === `## ${section}`);
  if (at === -1) {
    lines.push('', `## ${section}`, '', ...add);
    return lines.join(eol) + eol;
  }
  let next = lines.findIndex((l, i) => i > at && /^## /.test(l));
  if (next === -1) next = lines.length;
  let end = next;
  while (end > at + 1 && lines[end - 1].trim() === '') end--;
  const gap = end === at + 1 || !/^\s*[-*]/.test(add[0]) ? [''] : [];
  const tail = next < lines.length ? ['', ...lines.slice(next)] : [];
  return [...lines.slice(0, end), ...gap, ...add, ...tail].join(eol) + eol;
}

function writeAtomic(file, content, tmpDir) {
  const tmp = path.join(tmpDir, `write-${process.pid}-${Date.now()}.tmp`);
  try {
    fs.writeFileSync(tmp, content);
    fs.renameSync(tmp, file);
  } catch {
    try { fs.rmSync(tmp, { force: true }); } catch { /* best effort */ }
    fs.writeFileSync(file, content);
  }
}

function auditRow(root, role, slug, session) {
  let token = '';
  try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }
  const auditDir = path.join(root, '.claude', 'audit');
  fs.mkdirSync(auditDir, { recursive: true });
  fs.appendFileSync(
    path.join(auditDir, 'lessons-writes.log'),
    JSON.stringify({ ts: new Date().toISOString(), agent: String(role).toLowerCase(), slug, token, session, source: 'lessons-append' }) + '\n'
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file || !args.role || !args.from) {
    process.stderr.write('usage: lessons-append.js --file <lessons.md> --role <role> --from <text file> [--section <heading>] [--session <id>]\n');
    return 2;
  }
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const file = path.resolve(args.file);
  const m = file.replace(/\\/g, '/').match(LESSONS_RE);
  const slug = m ? m[1] : '';
  const section = args.section || headingFor(args.role);
  const session = args.session || String(process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID || '');

  let body;
  try { body = fs.readFileSync(args.from, 'utf8'); } catch (e) { warn(`cannot read --from (${e.code || e.message}); nothing appended`); return 0; }

  const lockDir = path.join(root, '.claude', 'audit', 'lessons-append');
  const lockPath = path.join(lockDir, `${(slug || 'lessons').replace(/[\\/:*?"<>|]/g, '__')}.lock`);
  let locked = false;
  try {
    fs.mkdirSync(lockDir, { recursive: true });
    locked = takeLock(lockPath);
  } catch { /* no lock home — write unlocked */ }
  if (!locked) warn('lock not taken; appending without it');

  try {
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    writeAtomic(file, insert(text, slug, section, body), fs.existsSync(lockDir) ? lockDir : path.dirname(file));
  } catch (e) {
    warn(`append failed (${e.code || e.message}); the lesson is lost`);
    return 0;
  } finally {
    if (locked) { try { fs.rmSync(lockPath, { force: true }); } catch { /* stale-lock rule clears it */ } }
  }

  try { fs.rmSync(args.from, { force: true }); } catch { /* scratch left behind */ }
  try { auditRow(root, args.role, slug, session); } catch (e) { warn(`audit row not written (${e.code || e.message})`); }
  return 0;
}

let code = 0;
try { code = main(); } catch (e) { warn(`unexpected failure (${e.message})`); code = 0; }
process.exit(code);
