'use strict';
/**
 * lib/keep-going.js — the clock of a run that keeps going while its tests finish.
 *
 * A run reaching its limit while results are still arriving gets one more window; at the end of each window
 * it gets another where a result arrived during that window, up to WINDOWS in all. The look-back at the limit
 * is the last window length, or the whole run where the run is shorter. One clock serves the whole run: every
 * command reads its time left from it, any command's progress counts for all of them, and a check made by one
 * command at a deadline another command already moved grants nothing.
 *
 *   const clock = keepGoing({ limitMs });
 *   clock.progress();   // a result arrived
 *   clock.left();       // ms to the current deadline, at least 1
 *   clock.goOn();       // at the deadline: true where the run still has time, else false (and stays false)
 *   clock.extended();   // { windows, ms } granted, or null
 *   clock.cutBy();      // null, 'quiet' (a window or the look-back had no result) or 'spent' (the windows were used)
 */
const WINDOW_MS = 120000;
const WINDOWS = 3;

function keepGoing({ limitMs, windowMs = WINDOW_MS, windows = WINDOWS, now = Date.now }) {
  let ends = now() + limitMs;
  let used = 0;
  let last = null;
  let cut = null;
  const recent = () => last !== null && last >= ends - windowMs;
  return {
    windowMs,
    progress() { last = now(); },
    left() { return Math.max(1, ends - now()); },
    goOn() {
      if (cut) return false;
      if (now() < ends) return true;
      if (recent() && used < windows) {
        used++;
        ends += windowMs;
        last = null;
        return true;
      }
      cut = recent() ? 'spent' : 'quiet';
      return false;
    },
    extended() { return used ? { windows: used, ms: used * windowMs } : null; },
    cutBy() { return cut; },
  };
}

// The window length in words: "2-minute", "0.4-second".
function windowWords(ms) {
  return ms % 60000 === 0 ? `${ms / 60000}-minute` : `${ms / 1000}-second`;
}

// The extra time a cut run was given, for its cut line; '' where it was given none.
function extraWords(clock) {
  const ext = clock && clock.extended();
  if (!ext) return '';
  const why = clock.cutBy() === 'spent' ? `the ${WINDOWS} windows were used` : 'the last window had no test finished';
  return ` plus ${ext.windows} more ${windowWords(clock.windowMs)} window${ext.windows === 1 ? '' : 's'} while tests were still finishing (${why})`;
}

// A command through the platform shell under a kept-going limit, its output the signal: resolves with
// `{ status, timedOut, output, extended, extra }` (`extra` the cut's words, '' when none was granted). At the
// final cut the whole process tree is ended — on Windows through taskkill, elsewhere through the process group
// the command heads — and a process outside the tree still holding the pipes is cut off after a grace.
function runKeptGoing(command, { cwd, env = process.env, limitMs, windowMs = WINDOW_MS, platform = process.platform, graceMs = 2000 }) {
  const { spawn, spawnSync } = require('child_process');
  const clock = keepGoing({ limitMs, windowMs });
  const windows = platform === 'win32';
  return new Promise((done) => {
    const child = spawn(command, { cwd, shell: true, windowsHide: true, env, detached: !windows });
    let output = '';
    let timedOut = false;
    let settled = false;
    let timer = null;
    let grace = null;
    const take = (chunk) => { clock.progress(); output += chunk; };
    const finish = (status, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(grace);
      done({ status, timedOut, output: error ? `${output}${error.message}` : output, extended: clock.extended(), extra: extraWords(clock) });
    };
    const cut = () => {
      timedOut = true;
      if (windows) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      else {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* the group has already exited */ }
      }
      grace = setTimeout(() => {
        child.stdout.destroy();
        child.stderr.destroy();
        finish(null);
      }, graceMs);
    };
    const due = () => {
      if (clock.goOn()) timer = setTimeout(due, clock.left());
      else cut();
    };
    timer = setTimeout(due, clock.left());
    child.stdout.on('data', take);
    child.stderr.on('data', take);
    child.on('error', (error) => finish(null, error));
    child.on('close', (status) => finish(status));
  });
}

module.exports = { keepGoing, extraWords, windowWords, runKeptGoing, WINDOW_MS, WINDOWS };
