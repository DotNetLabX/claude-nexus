'use strict';
/**
 * One holder at a time for a lock file, shared by the writers that keep their own lock beside a file.
 *
 * A LOCK is made by exclusive create and names its holder by a token the caller gives, unique to one acquisition.
 * Only the holder marks it fresh or removes it: a lock whose token is another's is left alone.
 *
 * A STALE LOCK — unmarked longer than the caller's `staleMs` — is taken over by one caller at a time: the taker
 * first makes `{lock}.takeover` by exclusive create, checks the lock is still stale, and writes its own lock over
 * it by renaming a temp file onto it, so the lock's path is never empty while another caller looks. A caller that
 * finds a takeover under way gets no lock. A takeover file left by a taker that died is removed once it is older
 * than TAKEOVER_STALE_MS, and the caller tries again later.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TAKEOVER_STALE_MS = 30000;

/** A token unique to one acquisition. */
const newToken = () => `${process.pid}-${crypto.randomBytes(6).toString('hex')}`;

const ageOf = (file) => {
  try { return Date.now() - fs.statSync(file).mtimeMs; } catch { return null; }
};

const body = (token) => JSON.stringify({ pid: process.pid, token, at: new Date().toISOString() });

/** True where the lock exists and has gone unmarked longer than `staleMs`. */
function isStale(lock, staleMs) {
  const age = ageOf(lock);
  return age !== null && age > staleMs;
}

function owns(lock, token) {
  try { return JSON.parse(fs.readFileSync(lock, 'utf8')).token === token; } catch { return false; }
}

// True where this caller replaced the stale lock with its own.
function takeOver(lock, { staleMs, token }) {
  const guard = `${lock}.takeover`;
  try {
    fs.closeSync(fs.openSync(guard, 'wx'));
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const age = ageOf(guard);
    if (age !== null && age > TAKEOVER_STALE_MS) { try { fs.unlinkSync(guard); } catch { /* another caller removed it */ } }
    return false;
  }
  try {
    if (!isStale(lock, staleMs)) return false;
    const tmp = `${lock}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmp, body(token));
    try { fs.renameSync(tmp, lock); } catch (err) { try { fs.unlinkSync(tmp); } catch { /* never mask the real error */ } throw err; }
    return true;
  } finally {
    try { fs.unlinkSync(guard); } catch { /* already gone */ }
  }
}

/** True where the lock is now this token's: made, or taken over from a stale holder. False while another holds it. */
function take(lock, { staleMs, token }) {
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  try {
    const fd = fs.openSync(lock, 'wx');
    try { fs.writeSync(fd, body(token)); } finally { fs.closeSync(fd); }
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  return isStale(lock, staleMs) ? takeOver(lock, { staleMs, token }) : false;
}

/** Marks the lock fresh where it is still this token's. */
function refresh(lock, token) {
  if (!owns(lock, token)) return false;
  const now = new Date();
  try { fs.utimesSync(lock, now, now); return true; } catch { return false; }
}

/** Removes the lock where it is still this token's. */
function release(lock, token) {
  if (!owns(lock, token)) return false;
  try { fs.unlinkSync(lock); return true; } catch { return false; }
}

module.exports = { newToken, take, isStale, owns, refresh, release };
