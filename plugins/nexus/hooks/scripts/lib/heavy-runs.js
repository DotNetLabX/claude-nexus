'use strict';
/**
 * The presence markers: which runs of verify-run.js are going on the machine now, heavy or small.
 *
 * Every run keeps a presence marker for its life in the `presence/` subfolder of the run-slots folder
 * (NEXUS_RUN_SLOTS_DIR, else ~/.nexus/run-slots), refreshed every 10 s and written with an expiry. A marker records its
 * run's kind: `heavy` (a declared role's command run whole) or `small`; one with no kind, from an older version, reads
 * as heavy. A run that holds a turn in the queue says so (`turn: true`). The subfolder keeps the markers out of the
 * turn queue: the queue reads only the claim files at the folder's top, so a marker never takes a place.
 *
 * Two kinds of reader. The busy readers (`othersLive`, `busyWatch`) count other heavy markers only, so a small run
 * never makes the machine busy, nor does a run still waiting for the runs going before it (`waiting: true`, cleared
 * when its command starts), so the runs it waits for never read busy because of it. A run that waits its turn reads every live marker of either kind (`waitableRuns`)
 * and waits for those runs to end, leaving out a run that holds a turn, which the queue already orders.
 *
 * A run exports its chain in NEXUS_HEAVY_RUN: the ids of the live markers it runs under, then its own. A process
 * started under a live marker is nested. Under a heavy chain it writes no marker; under a small chain a small run
 * writes none either, and a heavy run writes its own heavy marker carrying the chain, so the busy readers see it. An
 * inherited id that names no live marker is no chain. A reader never counts its own chain: the markers it runs
 * under, its own, and any marker whose chain names one of those, so a run's own tests never mark it busy. A stated
 * limit: a process started with a scrubbed environment (`env -i`) loses the chain, so a run it starts writes its own
 * marker and reads its parent as another run; telling it apart would take the process ancestry, which no platform
 * gives cheaply.
 *
 * A marker is live while its heartbeat is under 60 s old and its expiry has not passed; the heartbeat never moves the
 * expiry. A stale marker is skipped, never touched; a marker a day past its expiry, or unreadable and a day
 * unwritten, is swept by any reader — the rule the turn queue's claims follow. A folder that cannot be read or
 * written never blocks a run, never reads busy and holds nothing to wait for.
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
const isHeavy = (marker) => marker.kind !== 'small';
// A run still waiting for the runs going before it puts no load on the machine.
const isLoad = (marker) => isHeavy(marker) && marker.waiting !== true;

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

function sweepable(name, marker, mtimeMs, now) {
  if (MARKER_TMP.test(name)) return now - mtimeMs > SWEEP_AFTER_MS;
  if (marker && typeof marker === 'object' && typeof marker.expires === 'number') return now > marker.expires + SWEEP_AFTER_MS;
  return now - mtimeMs > SWEEP_AFTER_MS;
}

// Every live marker in `dir` — each `{ file, marker }`, its chain's or not. Any error listing the folder reads as none.
function liveMarkers(dir, now) {
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return []; }
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
      live.push({ file: name, marker });
      continue;
    }
    if (sweepable(name, valid ? marker : null, mtimeMs, now)) {
      try { fs.unlinkSync(full); } catch { /* another reader swept it */ }
    }
  }
  return live;
}

/**
 * The live markers in `dir` outside `chain` — each `{ file, marker }`. A marker is of the chain when its id is in
 * it or its own chain names an id in it.
 */
function readMarkers(dir, { now = Date.now(), chain = [] } = {}) {
  const own = new Set(chain);
  return liveMarkers(dir, now).filter(({ marker }) => ![marker.id, ...(Array.isArray(marker.chain) ? marker.chain : [])].some((id) => own.has(id)));
}

/**
 * The live markers this process runs under: `live` when its inherited chain names one, `heavy` when one of those is
 * heavy, and `ids`, those markers' ids.
 */
function chainState({ slots, env = process.env, now = Date.now() }) {
  const names = new Set(inherited(env));
  if (!names.size || !slots) return { live: false, heavy: false, ids: [] };
  let found = [];
  try { found = liveMarkers(presenceDir(slots), now).filter(({ marker }) => names.has(marker.id)).map((m) => m.marker); } catch { /* none */ }
  return { live: found.length > 0, heavy: found.some(isHeavy), ids: found.map((m) => m.id) };
}

/**
 * Starts this run's marker of `kind`, or returns null: nested where it writes none, or where the folder cannot be
 * written. The marker expires `limitMs` plus a minute after it starts; a caller that waits after writing it adds the
 * wait to `limitMs`. `turn` says the run holds a turn in the queue; `waiting` that it still waits for the runs going,
 * until `ready()` clears it. `chain` is the live chain the marker carries and
 * `exported` what to hand the run's command in NEXUS_HEAVY_RUN. `release(treeEnded)` stops the heartbeat and removes
 * it, once; where the command's tree could not be confirmed ended (`false`) the marker stays, still counted until its
 * heartbeat is a minute old.
 */
function holdMarker({ slots, env = process.env, limitMs, kind = 'heavy', turn = false, waiting = false, heartbeatMs = HEARTBEAT_MS }) {
  if (!slots) return null;
  const outer = chainState({ slots, env });
  if (outer.live && (outer.heavy || kind === 'small')) return null;
  const chain = outer.live ? outer.ids : [];
  const now = Date.now();
  const id = `${process.pid}-${now}-${crypto.randomBytes(4).toString('hex')}`;
  let marker = { id, pid: process.pid, kind, ...(turn ? { turn: true } : {}), ...(waiting ? { waiting: true } : {}), chain, started: now, expires: now + (Number(limitMs) || 0) + STALE_MS };
  let file;
  try { file = writeMarker(slots, marker); } catch { return null; }
  // Set when ready()'s write failed: the file still says waiting, so a touch alone would keep it so.
  let unwritten = false;
  const beat = setInterval(() => {
    if (!unwritten) {
      try { const t = new Date(); fs.utimesSync(file, t, t); return; } catch { /* written whole below */ }
    }
    try { writeMarker(slots, marker); unwritten = false; } catch { /* tried again next beat; the run goes on */ }
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
  // The run stops waiting and starts its command: its marker counts as load from here on.
  const ready = () => {
    if (released || !marker.waiting) return;
    const { waiting: _, ...rest } = marker;
    marker = rest;
    try { writeMarker(slots, marker); } catch { unwritten = true; }
  };
  return { id, file, chain, exported: [...chain, id].join(','), release, ready };
}

const readerChain = (env, own) => [...inherited(env), ...(own ? [own] : [])];

// How many other heavy runs are live now, for a reader with this environment and, for a run with a marker, its own id.
function othersLive({ slots, env = process.env, own = null, now = Date.now() }) {
  try { return readMarkers(presenceDir(slots), { now, chain: readerChain(env, own) }).filter(({ marker }) => isLoad(marker)).length; } catch { return 0; }
}

// The ids of the runs a waiting run waits for: every live marker of either kind outside its chain, but a run's that
// holds a turn.
function waitableRuns({ slots, env = process.env, own = null, now = Date.now() }) {
  try {
    return readMarkers(presenceDir(slots), { now, chain: readerChain(env, own) }).filter(({ marker }) => marker.turn !== true).map(({ marker }) => marker.id);
  } catch {
    return [];
  }
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

module.exports = { HEAVY_RUN_ENV, presenceDir, writeMarker, holdMarker, readMarkers, chainState, othersLive, waitableRuns, busyWatch };
