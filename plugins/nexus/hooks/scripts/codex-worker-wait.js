/**
 * Nexus codex-worker-wait: holds the Codex companion's background worker until the process that
 * launched it has exited. `codex-job.js start` loads it into the companion through NODE_OPTIONS.
 *
 * The companion starts the worker before it saves the job, and a worker that reads first exits — the
 * job then stays `queued` with no process behind it. The launcher saves the job and exits, so its
 * exit is the signal. The wait ends after 15 seconds whatever the launcher does, and the worker then
 * runs as it would have.
 *
 * ONLY THE WORKER WAITS. Every node process the companion starts loads this file; it acts only where
 * the first argument is `task-worker`. Once it has waited it takes its own `--require` out of
 * NODE_OPTIONS, so nothing the worker starts loads it. It never throws: an error here would end the
 * worker it is there to keep alive.
 *
 *   NEXUS_CODEX_WORKER_WAIT     the `--require` text `start` added, removed here from NODE_OPTIONS
 *   NEXUS_CODEX_WORKER_WAIT_MS  the longest wait, in place of 15 seconds
 */
'use strict';

const MAX_WAIT_MS = 15000;
const POLL_MS = 50;

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function waitForLauncher() {
  const own = Number(process.env.NEXUS_CODEX_WORKER_WAIT_MS);
  const end = Date.now() + (process.env.NEXUS_CODEX_WORKER_WAIT_MS && Number.isFinite(own) && own >= 0 ? own : MAX_WAIT_MS);
  const launcher = process.ppid;
  const cell = new Int32Array(new SharedArrayBuffer(4));
  while (isAlive(launcher) && Date.now() < end) Atomics.wait(cell, 0, 0, POLL_MS);
}

function dropOwnFlag() {
  const flag = process.env.NEXUS_CODEX_WORKER_WAIT;
  delete process.env.NEXUS_CODEX_WORKER_WAIT;
  delete process.env.NEXUS_CODEX_WORKER_WAIT_MS;
  if (!flag) return;
  const rest = String(process.env.NODE_OPTIONS || '').split(flag).join('').trim();
  if (rest) process.env.NODE_OPTIONS = rest;
  else delete process.env.NODE_OPTIONS;
}

if (process.argv[2] === 'task-worker') {
  try { waitForLauncher(); } catch { /* the worker runs as it would have */ }
  try { dropOwnFlag(); } catch { /* the flag stays, and loads a file that does nothing */ }
}
