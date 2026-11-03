'use strict';
/**
 * The busy-machine mark: whether another heavy run shared the machine with a run.
 *
 * A heavy run — a full run of verify-run.js, from the moment its turn starts — keeps a presence marker for its
 * life in the `presence/` subfolder of the run-slots folder (NEXUS_RUN_SLOTS_DIR, else ~/.nexus/run-slots),
 * refreshed every 10 s and written with an expiry. The subfolder keeps the markers out of the turn queue: the
 * queue reads only the claim files at the folder's top, so a marker never takes a place or makes a run wait.
 *
 * A heavy run exports its marker id in NEXUS_HEAVY_RUN; a process started under it inherits the id and writes no
 * marker of its own. A reader never counts its own chain: the marker of a run it runs under, its own, and any
 * marker whose chain names one of those. So a run's own tests never mark it busy. A stated limit: a process started
 * with a scrubbed environment (`env -i`) loses the id, so a heavy run it starts writes its own marker and marks its
 * parent busy; telling it apart would take the process ancestry, which no platform gives cheaply.
 *
 * A marker is live while its heartbeat is under 60 s old and its expiry has not passed. A stale marker is skipped,
 * never touched; a marker a day past its expiry, or unreadable and a day unwritten, is swept by any reader — the
 * rule the turn queue's claims follow. A folder that cannot be read or written never blocks a run and never
 * reads busy.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HEAVY_RUN_ENV = 'NEXUS_HEAVY_RUN';
const HEARTBEAT_MS = 10000;
const STALE_MS = 60000;
const SWEEP_AFTER_MS = 24 * 3600000;
const MARKER = /^[\w.-]+\.marker$/;
const MARKER_TMP = /^[\w.-]+\.marker\.tmp$/;

const presenceDir = (slots) => path.join(slots, 'presence');

// The ids of the heavy runs this process runs under, from the inherited NEXUS_HEAVY_RUN.
const inherited = (env) => String((env && env[HEAVY_RUN_ENV]) || '').split(',').map((s) => s.trim()).filter(Boolean);

// Through a temporary file and a rename, so a reader never sees half a marker.
function writeMarker(slots, marker) {
  const dir = presenceDir(slots);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${marker.id}.marker`);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(marker));
  try {
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* already gone */ }
    throw e;
  }
  return file;
}

/**
 * Starts this run's marker, or returns null: under another heavy run, or where the folder cannot be written.
 * The marker expires `limitMs` plus a minute after it starts. `release(treeEnded)` stops the heartbeat and removes
 * it, once; where the command's tree could not be confirmed ended (`false`) the marker stays, still counted until
 * its heartbeat is a minute old.
 */
function holdMarker({ slots, env = process.env, limitMs, heartbeatMs = HEARTBEAT_MS }) {
  if (inherited(env).length) return null;
  const now = Date.now();
  const id = `${process.pid}-${now}-${crypto.randomBytes(4).toString('hex')}`;
  const marker = { id, pid: process.pid, chain: [], started: now, expires: now + (Number(limitMs) || 0) + STALE_MS };
  let file;
  try { file = writeMarker(slots, marker); } catch { return null; }
  const beat = setInterval(() => {
    try { const t = new Date(); fs.utimesSync(file, t, t); } catch {
      try { writeMarker(slots, marker); } catch { /* the run goes on, uncounted by others */ }
    }
  }, Math.max(1, heartbeatMs));
  beat.unref();
  let released = false;
  const release = (treeEnded) => {
    if (released) return;
    released = true;
    clearInterval(beat);
    if (treeEnded === false) return;
    try { fs.unlinkSync(file); } catch { /* gone, or swept */ }
  };
  return { id, file, release };
}

function sweepable(name, marker, mtimeMs, now) {
  if (MARKER_TMP.test(name)) return now - mtimeMs > SWEEP_AFTER_MS;
  if (marker && typeof marker === 'object' && typeof marker.expires === 'number') return now > marker.expires + SWEEP_AFTER_MS;
  return now - mtimeMs > SWEEP_AFTER_MS;
}

/**
 * The live markers in `dir` outside `chain` — each `{ file, marker }`. A marker is of the chain when its id is in
 * it or its own chain names an id in it. Any error listing the folder reads as no marker.
 */
function readMarkers(dir, { now = Date.now(), chain = [] } = {}) {
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return []; }
  const own = new Set(chain);
  const live = [];
  for (const name of names) {
    if (!MARKER.test(name) && !MARKER_TMP.test(name)) continue;
    const full = path.join(dir, name);
    let mtimeMs;
    try { mtimeMs = fs.statSync(full).mtimeMs; } catch { continue; }
    let marker = null;
    if (MARKER.test(name)) {
      try { marker = JSON.parse(fs.readFileSync(full, 'utf8')); } catch { /* torn, or gone since the listing */ }
    }
    const valid = MARKER.test(name) && marker && typeof marker === 'object' && typeof marker.id === 'string';
    if (valid && typeof marker.expires === 'number' && now <= marker.expires && now - mtimeMs < STALE_MS) {
      const ids = [marker.id, ...(Array.isArray(marker.chain) ? marker.chain : [])];
      if (!ids.some((id) => own.has(id))) live.push({ file: name, marker });
      continue;
    }
    if (sweepable(name, valid ? marker : null, mtimeMs, now)) {
      try { fs.unlinkSync(full); } catch { /* another reader swept it */ }
    }
  }
  return live;
}

// How many other heavy runs are live now, for a reader with this environment and, for a heavy run, its own id.
function othersLive({ slots, env = process.env, own = null, now = Date.now() }) {
  const chain = [...inherited(env), ...(own ? [own] : [])];
  try { return readMarkers(presenceDir(slots), { now, chain }).length; } catch { return 0; }
}

/**
 * Watches for other heavy runs while a run runs: one read now, one every `everyMs`, and one at `finish()`, which
 * stops the watch and says whether any read saw one.
 */
function busyWatch({ slots, env = process.env, own = null, everyMs = HEARTBEAT_MS }) {
  let busy = false;
  const sample = () => { if (!busy && othersLive({ slots, env, own }) > 0) busy = true; };
  sample();
  const timer = setInterval(sample, Math.max(1, everyMs));
  timer.unref();
  let done = false;
  return {
    finish() {
      if (!done) {
        done = true;
        clearInterval(timer);
        sample();
      }
      return busy;
    },
  };
}

module.exports = { HEAVY_RUN_ENV, presenceDir, writeMarker, holdMarker, readMarkers, othersLive, busyWatch };
