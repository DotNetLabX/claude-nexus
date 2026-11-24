#!/usr/bin/env node
/**
 * Detached prompt-audit check. The process owns the checkout lock and publishes the result.
 * Transcript reads run in a worker thread so a blocked search cannot delay the safety deadline.
 */
'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { constants, setPriority } = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const { parsePin, isNewer } = require('./lib/prompt-audit');
const io = require('./lib/prompt-audit-io');
const lock = require('./lib/file-lock');

const CHECK_LIMIT_MS = 5 * 60 * 1000;

async function check(project, transcripts, version) {
  const file = io.checkLock(project);
  const token = lock.newToken();
  if (!lock.take(file, { staleMs: io.LOCK_AGE_MS, maxAgeMs: io.LOCK_AGE_MS, token })) return;
  let sides = io.SIDES;
  let worker;
  let timer;
  let failure = 'background check failed';
  try {
    try { setPriority(constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* Scheduling policy may forbid this. */ }
    const pin = parsePin(readFileSync(join(project, io.AUDIT_DOC), 'utf8'));
    if (!isNewer(version, pin)) return;
    const saved = io.readBaseline(project);
    sides = io.checkDue(project, version, pin, saved);
    if (!sides.length) return;
    worker = new Worker(__filename, { workerData: { project, transcripts, version, baseline: saved.baseline, sides } });
    const search = await new Promise((resolve, reject) => {
      worker.once('message', resolve);
      worker.once('error', reject);
      worker.once('exit', () => reject(new Error('Check exited without a result')));
      timer = setTimeout(() => {
        failure = 'background check exceeded its five-minute limit';
        reject(new Error(failure));
      }, CHECK_LIMIT_MS);
    });
    if (lock.owns(file, token)) io.publishComparison(project, search, saved.baseHash);
  } catch {
    if (lock.owns(file, token)) {
      io.writeDifference(project, { version, verdict: 'could-not-run', sides, losses: [], others: [], problems: [failure] });
    }
  } finally {
    clearTimeout(timer);
    try {
      if (worker) await worker.terminate();
    } finally {
      lock.release(file, token);
    }
  }
}

if (isMainThread) {
  const [project, transcripts, version] = process.argv.slice(2);
  if (project && transcripts && /^\d+\.\d+\.\d+$/.test(version)) {
    check(project, transcripts, version).catch(() => { process.exitCode = 1; });
  }
} else {
  parentPort.postMessage(io.searchVersion(workerData));
}
