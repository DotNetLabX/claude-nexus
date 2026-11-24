'use strict';
/**
 * One holder at a time for a lock file, shared by the writers that keep their own lock beside a file.
 *
 * A LOCK is made by exclusive create and names its holder: its pid, its creation time and a token the caller gives,
 * unique to one acquisition. Only the holder removes it: a lock whose token is another's is left alone.
 *
 * A LOCK WHOSE HOLDER IS DEAD — no process runs under its pid, or the one that does was created at another time —
 * is taken over. A caller with a hard work deadline can also expire a named holder after `maxAgeMs`.
 * Every caller that finds a lock takes this one path, so a takeover never races a fresh
 * acquisition: it makes `{lock}.takeover` by exclusive create, reads the lock again under it, and only while the
 * holder is still dead or expired writes its own lock over it by renaming a temp file onto it, so the lock's path is never
 * empty while another caller looks. A caller that finds a takeover under way gets no lock. A caller that enables
 * expiration must finish its work and release before its lock expires. The takeover file names its taker as a lock does, and
 * only its taker removes it; one whose taker is dead is removed by the caller that finds it (`reapGuard`), which
 * tries again later — judged and removed under a reap claim of its own, so no live taker's file is ever removed. A
 * reap claim a stopped caller left is never removed here: every caller gets no lock until a person removes it, and
 * `stranded` names its path. A holder whose creation time cannot be looked up counts as alive. A lock that names no holder — a bare pid counts as a holder named by pid alone —
 * is taken over once it has gone unchanged longer than the caller's `staleMs`.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const TAKEOVER_STALE_MS = 30000;
const SAME_PROCESS_MS = 5000;
const LOOKUP_MS = 15000;
const OWN_CREATED = new Date(Date.now() - Math.round(process.uptime() * 1000)).toISOString();
const seenAlive = new Set();

/** A token unique to one acquisition. */
const newToken = () => `${process.pid}-${crypto.randomBytes(6).toString('hex')}`;

const ageOf = (file) => {
  try { return Date.now() - fs.statSync(file).mtimeMs; } catch { return null; }
};

const body = (token) => JSON.stringify({ pid: process.pid, created: OWN_CREATED, token, at: new Date().toISOString() });

function pidLives(pid) {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
}

// A process's creation time in ms: null where no process runs under the pid, undefined for no answer.
function createdAt(pid) {
  let res;
  if (process.platform === 'win32') {
    const script = `$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if ($null -eq $p) { 'none' } else { try { $p.StartTime.ToUniversalTime().ToString('o') } catch { 'unknown' } }`;
    res = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', timeout: LOOKUP_MS, windowsHide: true });
  } else {
    // Only reached for a pid that lives; a `ps` that cannot take these options (BusyBox) exits 1 with nothing on
    // stdout, which is no answer.
    res = spawnSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8', timeout: LOOKUP_MS, windowsHide: true, env: { ...process.env, LC_ALL: 'C' } });
  }
  if (res.error || res.status !== 0) return undefined;
  const out = String(res.stdout || '').trim().split(/\r?\n/).pop();
  if (out === 'none') return null;
  const at = Date.parse(out);
  return Number.isNaN(at) ? undefined : at;
}

// The lock's holder as written, `missing`, or null where it names none.
function readHolder(lock) {
  let text;
  try { text = fs.readFileSync(lock, 'utf8'); } catch (err) { return err.code === 'ENOENT' ? 'missing' : null; }
  let value;
  try { value = JSON.parse(text); } catch { return null; }
  if (Number.isInteger(value)) return { pid: value };
  return value && typeof value === 'object' && Number.isInteger(value.pid) && value.pid > 0 ? value : null;
}

function holderDead({ pid, created }) {
  if (!pidLives(pid)) return true;
  const when = Date.parse(created);
  if (Number.isNaN(when)) return false;
  if (pid === process.pid) return created !== OWN_CREATED;
  const key = `${pid}@${created}`;
  if (seenAlive.has(key)) return false;
  const now = createdAt(pid);
  if (now === null) return true;
  if (now === undefined) return false;
  if (Math.abs(now - when) > SAME_PROCESS_MS) return true;
  seenAlive.add(key);
  return false;
}

// `missing`, true where the lock may be taken over, false while its holder lives and the lock is current.
function takeable(lock, staleMs, { maxAgeMs = Infinity, pidOnly = false } = {}) {
  const holder = readHolder(lock);
  if (holder === 'missing') return 'missing';
  if (holder === null) {
    const age = ageOf(lock);
    return age !== null && age > staleMs;
  }
  if (maxAgeMs < Infinity) {
    const at = Date.parse(holder.at);
    if ((Number.isNaN(at) ? ageOf(lock) : Date.now() - at) > maxAgeMs) return true;
  }
  return pidOnly ? !pidLives(holder.pid) : holderDead(holder);
}

function create(lock, token) {
  try {
    const fd = fs.openSync(lock, 'wx');
    try { fs.writeSync(fd, body(token)); } finally { fs.closeSync(fd); }
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    return false;
  }
}

/**
 * Removes a takeover file whose maker is dead — or that names none and is older than TAKEOVER_STALE_MS — under
 * `{guard}.reap`, made by exclusive create, and judges it there. Only its taker or the holder of that claim removes a
 * takeover file, so the one judged is the one removed. A claim already there is never removed: the caller gets no lock,
 * and `stranded` names a claim left that way. `beforeRemove` runs between the judgement and the removal (tests pause there).
 */
function reapGuard(guard, { beforeRemove } = {}) {
  const claim = `${guard}.reap`;
  if (!create(claim, newToken())) return false;
  try {
    const maker = readHolder(guard);
    if (maker === 'missing') return false;
    if (maker === null ? !(ageOf(guard) > TAKEOVER_STALE_MS) : !holderDead(maker)) return false;
    if (beforeRemove) beforeRemove();
    try { fs.unlinkSync(guard); return true; } catch { return false; }
  } finally {
    try { fs.unlinkSync(claim); } catch { /* already gone */ }
  }
}

/** The reap claim beside a lock's takeover file once it is older than any reap takes, else null. */
function stranded(lock) {
  const claim = `${lock}.takeover.reap`;
  const age = ageOf(claim);
  return age !== null && age > TAKEOVER_STALE_MS ? claim : null;
}

function takeOver(lock, { staleMs, token, maxAgeMs }) {
  const guard = `${lock}.takeover`;
  const mine = newToken();
  try {
    const fd = fs.openSync(guard, 'wx');
    try { fs.writeSync(fd, body(mine)); } finally { fs.closeSync(fd); }
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    reapGuard(guard);
    return false;
  }
  try {
    const now = takeable(lock, staleMs, { maxAgeMs });
    if (now === 'missing') return create(lock, token);
    if (now !== true) return false;
    const tmp = `${lock}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmp, body(token));
    try { fs.renameSync(tmp, lock); } catch (err) { try { fs.unlinkSync(tmp); } catch { /* never mask the real error */ } throw err; }
    return true;
  } finally {
    if (owns(guard, mine)) { try { fs.unlinkSync(guard); } catch { /* already gone */ } }
  }
}

/** True where the lock is now this token's. False while another holds it. */
function take(lock, { staleMs, token, maxAgeMs }) {
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  if (create(lock, token)) return true;
  return takeable(lock, staleMs, { maxAgeMs }) === false ? false : takeOver(lock, { staleMs, token, maxAgeMs });
}

/** A live, current lock, or an incomplete lock younger than staleMs. pidOnly skips the process start-time lookup. */
const held = (lock, staleMs, options) => takeable(lock, staleMs, options) === false;

function owns(lock, token) {
  try { return JSON.parse(fs.readFileSync(lock, 'utf8')).token === token; } catch { return false; }
}

/** Removes the lock where it is still this token's. */
function release(lock, token) {
  if (!owns(lock, token)) return false;
  try { fs.unlinkSync(lock); return true; } catch { return false; }
}

module.exports = { newToken, take, held, owns, release, reapGuard, stranded };
