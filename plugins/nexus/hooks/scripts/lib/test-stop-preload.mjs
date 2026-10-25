// The child-call stop, loaded into every node process of a test run through
// NODE_OPTIONS="--import={this file}". `--test-timeout` cannot interrupt a test blocked on a synchronous
// child process, so inside a test worker this gives every spawnSync, execSync and execFileSync call that
// sets no `timeout` the stop in NEXUS_TEST_STOP_MS. When the call is made from the test file itself (the
// calling frame), the stop firing becomes an error with `code: 'ERR_NEXUS_TEST_STOP'` — the reporter finds
// it on the one test whose failure carries it. A call made from any other code (the code under test, a
// helper module) gets the stop as an ordinary timeout result: spawnSync's `error.code === 'ETIMEDOUT'`,
// or the error execSync and execFileSync throw. An explicit `timeout` is never changed.
//
// At exit it ends the direct children it saw spawn, exec, execFile or fork start that still run, their
// promisified forms included: a forced exit after a timed-out test would otherwise leave them behind. A
// grandchild behind a program that already exited is out of its reach.
//
// It acts only in the test worker itself, on Node 22.1 or later, with a positive stop. A worker is a process
// with NODE_TEST_CONTEXT starting `child` and the runner's `--test-*` options (the legs always pass
// `--test-timeout`) whose parent is the test runner, which loads no preload. Every process this loads into, the
// worker too, writes its own pid to NEXUS_TEST_PRELOAD_PID, so a process the worker starts — forked, it may carry
// every option the worker has — finds its parent's pid there and is left alone: its own children, and the
// detached ones it means to leave running, are not the preload's. So is any process outside a worker — a
// wrapper script, a runner's own process.
import childProcess from 'node:child_process';
import { realpathSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const [major, minor] = process.versions.node.split('.').map(Number);
const supported = major > 22 || (major === 22 && minor >= 1);
const stopMs = Number(process.env.NEXUS_TEST_STOP_MS);
const PRELOAD_PID = 'NEXUS_TEST_PRELOAD_PID';
const inWorker = String(process.env.NODE_TEST_CONTEXT || '').startsWith('child')
  && process.execArgv.some((a) => a.startsWith('--test-'))
  && process.env[PRELOAD_PID] !== String(process.ppid);
if (!process.execArgv.includes('--test')) process.env[PRELOAD_PID] = String(process.pid);

function stopError(what, cause) {
  const err = new Error(`${what} was stopped after ${stopMs} ms (the test stop) — it set no timeout of its own`);
  err.code = 'ERR_NEXUS_TEST_STOP';
  err.cause = cause;
  return err;
}

const untimed = (options) => !options || typeof options !== 'object' || options.timeout === undefined || options.timeout === null;

// spawnSync(file[, args][, options]) and execFileSync(file[, args][, options]): the options are the
// last object argument.
function withStop(args, at) {
  const out = [...args];
  const i = Array.isArray(out[at]) || (out[at] == null && out.length > at + 1) ? at + 1 : at;
  if (!untimed(out[i])) return null;
  out[i] = { ...(out[i] || {}), timeout: stopMs };
  return out;
}

// The forms a stack frame names the test file by: a file URL for an ES module, a path for CommonJS.
function testFileForms() {
  const file = process.argv[1];
  if (!file) return [];
  const paths = [resolve(file)];
  try { paths.push(realpathSync(paths[0])); } catch { /* the path as given */ }
  return [...new Set(paths.flatMap((p) => [p, pathToFileURL(p).href]))];
}

function patch() {
  const forms = testFileForms();
  const frameIsTestFile = (frame) => forms.some((f) => frame.includes(`${f}:`));
  // The first frame outside this file is the code that made the call.
  const fromTestFile = () => {
    const frames = String(new Error().stack || '').split('\n').slice(1);
    const caller = frames.find((l) => !l.includes(import.meta.url));
    return Boolean(caller) && frameIsTestFile(caller);
  };
  const { spawnSync, execSync, execFileSync, spawn, exec, execFile, fork } = childProcess;
  childProcess.spawnSync = function (...args) {
    const stopped = withStop(args, 1);
    if (!stopped) return spawnSync.apply(this, args);
    const res = spawnSync.apply(this, stopped);
    if (res && res.error && res.error.code === 'ETIMEDOUT' && fromTestFile()) throw stopError(`spawnSync ${args[0]}`, res.error);
    return res;
  };
  childProcess.execFileSync = function (...args) {
    const stopped = withStop(args, 1);
    if (!stopped) return execFileSync.apply(this, args);
    try { return execFileSync.apply(this, stopped); } catch (e) {
      throw e && e.code === 'ETIMEDOUT' && fromTestFile() ? stopError(`execFileSync ${args[0]}`, e) : e;
    }
  };
  childProcess.execSync = function (...args) {
    if (!untimed(args[1])) return execSync.apply(this, args);
    try { return execSync.apply(this, [args[0], { ...(args[1] || {}), timeout: stopMs }]); } catch (e) {
      throw e && e.code === 'ETIMEDOUT' && fromTestFile() ? stopError(`execSync ${args[0]}`, e) : e;
    }
  };

  const started = new Set();
  const register = (child) => {
    if (child && typeof child.once === 'function') {
      started.add(child);
      child.once('exit', () => started.delete(child));
    }
    return child;
  };
  // The wrapper keeps the original's promisified form, which `util.promisify(exec)` resolves to
  // `{ stdout, stderr }`, and registers the child that form's promise carries.
  const track = (original) => {
    const wrapped = function (...args) { return register(original.apply(this, args)); };
    const custom = original[promisify.custom];
    if (custom) {
      wrapped[promisify.custom] = function (...args) {
        const promise = custom.apply(this, args);
        if (promise) register(promise.child);
        return promise;
      };
    }
    return wrapped;
  };
  childProcess.spawn = track(spawn);
  childProcess.exec = track(exec);
  childProcess.execFile = track(execFile);
  childProcess.fork = track(fork);
  process.on('exit', () => {
    for (const child of started) {
      if (child.exitCode === null && child.signalCode === null) {
        try { child.kill('SIGKILL'); } catch { /* already gone */ }
      }
    }
  });
  syncBuiltinESMExports();
}

if (supported && inWorker && stopMs > 0) patch();
