'use strict';
/**
 * The safety copy a writing seat job's tree gets, read by codex-job.js. The sandbox lets `git clean` through, so
 * before a seat job with the write option starts, every uncommitted file git shows in the tree —
 * changed or untracked, never one git ignores — is copied under the seat folder, outside the tree and outside
 * temp: `copies/{tree}/{intent}/files/…`, beside a `manifest.json` naming the tree, the unit, the dispatch's
 * other-work list and each file copied with its hash.
 *
 * AFTER THE JOB — once its end is confirmed — only copied files that are gone are looked for, and no file that
 * exists is ever written over:
 * a gone file on the other-work list — the path itself, or a folder that holds it — is put back (`restored`);
 * an other-work file whose content changed is left as it is and named (`changed`), since another session may
 * have changed it; a gone file of the feature's own is named (`featureGone`) and its copy kept, for the
 * coordinator to put back where the unit's steps did not ask for the removal. The copy's `restoring.json` names
 * each file before it is put back, so a look stopped after putting one back and run again still reports it.
 *
 * A COPY OUTLIVES THE JOB. A later writing start for the same tree drops an earlier copy once its feature
 * files are committed — none still uncommitted there, none gone; `seat-release --close` drops every copy of the
 * tree at the feature's close.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { seatDir, reservationFile } = require('./codex-seat');

const MANIFEST = 'manifest.json';
const RESTORING = 'restoring.json';

const treeCopies = (tree, env = process.env) => path.join(seatDir(env), 'copies', path.basename(reservationFile(tree, env), '.json'));
const slash = (p) => String(p).replace(/\\/g, '/').replace(/\/+$/, '');

function hashOf(file) {
  try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } catch { return null; }
}

function readManifest(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, MANIFEST), 'utf8')); } catch { return null; }
}

/** Whether a tree path is other work: the list names it, or a folder holding it. */
function isOtherWork(rel, otherWork) {
  const p = slash(rel);
  return (otherWork || []).some((entry) => { const e = slash(entry); return e !== '' && (p === e || p.startsWith(`${e}/`)); });
}

/**
 * Copies every file of `files` (`[{path}]`, git's uncommitted list) that exists in the tree. Returns the copy's
 * folder and how many files it holds. Throws where the copy cannot be made whole.
 */
function makeCopy({ tree, intent, unit, files, otherWork, env = process.env }) {
  const dir = path.join(treeCopies(tree, env), intent);
  const held = [];
  for (const f of files || []) {
    const from = path.join(tree, f.path);
    let stat;
    try { stat = fs.statSync(from); } catch { continue; }
    if (!stat.isFile()) continue;
    const to = path.join(dir, 'files', f.path);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    held.push({ path: slash(f.path), status: f.status, sha: hashOf(to), otherWork: isOtherWork(f.path, otherWork) });
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, MANIFEST), JSON.stringify({ tree, intent, unit, at: new Date().toISOString(), otherWork: otherWork || [], files: held }, null, 2));
  return { dir, count: held.length };
}

function readRestoring(dir) {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(dir, RESTORING), 'utf8'));
    return Array.isArray(value) ? value.filter((p) => typeof p === 'string') : [];
  } catch { return []; }
}

function writeRestoring(dir, paths) {
  const file = path.join(dir, RESTORING);
  fs.writeFileSync(`${file}.${process.pid}.tmp`, JSON.stringify(paths));
  fs.renameSync(`${file}.${process.pid}.tmp`, file);
}

/** `{restored, changed, featureGone}` after a job — only gone files are put back, and only other work. */
function checkCopy(dir) {
  const manifest = readManifest(dir);
  const out = { restored: [], changed: [], featureGone: [] };
  if (!manifest) return { ...out, reason: `the safety copy's manifest in ${dir} cannot be read` };
  const restoring = readRestoring(dir);
  for (const f of manifest.files) {
    const target = path.join(manifest.tree, f.path);
    if (fs.existsSync(target)) {
      const same = hashOf(target) === f.sha;
      if (f.otherWork && same && restoring.includes(f.path)) out.restored.push(f.path);
      else if (f.otherWork && !same) out.changed.push(f.path);
      continue;
    }
    if (!f.otherWork) { out.featureGone.push(f.path); continue; }
    try {
      if (!restoring.includes(f.path)) {
        restoring.push(f.path);
        writeRestoring(dir, restoring);
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(dir, 'files', f.path), target, fs.constants.COPYFILE_EXCL);
      out.restored.push(f.path);
    } catch (err) {
      if (!out.reason) out.reason = `${f.path} could not be put back: ${err.message}`;
    }
  }
  return out;
}

function copiesOf(tree, env) {
  const base = treeCopies(tree, env);
  try { return fs.readdirSync(base).map((name) => path.join(base, name)); } catch { return []; }
}

/**
 * Drops each copy of the tree whose feature files are all committed — none still uncommitted, none gone from
 * the tree; returns how many.
 */
function dropCommitted(tree, uncommitted, env = process.env) {
  const open = new Set((uncommitted || []).map((f) => slash(f.path)));
  let dropped = 0;
  for (const dir of copiesOf(tree, env)) {
    const manifest = readManifest(dir);
    if (!manifest) continue;
    if (manifest.files.some((f) => !f.otherWork && (open.has(f.path) || !fs.existsSync(path.join(manifest.tree, f.path))))) continue;
    try { fs.rmSync(dir, { recursive: true, force: true }); dropped++; } catch { /* kept for the next start */ }
  }
  return dropped;
}

/** Drops every copy of the tree; returns how many. */
function dropAll(tree, env = process.env) {
  let dropped = 0;
  for (const dir of copiesOf(tree, env)) {
    try { fs.rmSync(dir, { recursive: true, force: true }); dropped++; } catch { /* left in place */ }
  }
  return dropped;
}

module.exports = { treeCopies, isOtherWork, makeCopy, checkCopy, dropCommitted, dropAll, hashOf, readManifest };
