// The node test runner reporter every composed test leg carries beside `spec`: one JSON line per finished
// test or suite, appended to the file NEXUS_TEST_EVENTS names (nothing when it is unset), and one
// `run-end` line when the invocation's event stream ends. It yields nothing to its own destination: two
// legs of one run append to one file, and a destination the runner opens would be truncated per leg.
//
// Per event: `kind` (test | suite), `skip`, `todo`, `file`, `line`, `column`, `test` (the name), `ms`,
// `failureType` (the runner's own — `testTimeoutFailure`, `cancelledByParent`, `testCodeFailure`, … —
// null on a pass) and `causeCode` (the thrown error's `code`, which carries the child-call preload's
// ERR_NEXUS_TEST_STOP), `message` (the thrown error's message, its first line capped; null on a pass), and
// `pid`, this runner process's, which tells apart two legs running at the same time over one file.
// readTestEvents (test-events.js beside this file) is the reader.
import { appendFileSync } from 'node:fs';

const MESSAGE_CAP = 400;

// The failure's own error, inside the runner's wrapper, as its first non-empty line.
function messageOf(error) {
  const cause = error && error.cause;
  const text = cause && typeof cause === 'object' && cause.message ? cause.message : (error && error.message) || (cause ? String(cause) : '');
  const line = String(text).split(/\r?\n/).map((l) => l.trim()).find(Boolean) || '';
  return line.slice(0, MESSAGE_CAP) || null;
}

function write(line) {
  const file = process.env.NEXUS_TEST_EVENTS;
  if (!file) return;
  try { appendFileSync(file, `${JSON.stringify(line)}\n`); } catch { /* the run's verdict never depends on this file */ }
}

export default async function* testReporter(source) {
  for await (const { type, data } of source) {
    if (type !== 'test:pass' && type !== 'test:fail') continue;
    const details = data.details || {};
    const error = type === 'test:fail' ? details.error || {} : null;
    write({
      kind: details.type === 'suite' ? 'suite' : 'test',
      skip: Boolean(data.skip),
      todo: Boolean(data.todo),
      file: data.file || null,
      line: data.line ?? null,
      column: data.column ?? null,
      test: data.name,
      nesting: data.nesting,
      ms: details.duration_ms,
      failureType: error ? error.failureType || 'unknown' : null,
      causeCode: error && error.cause && error.cause.code ? String(error.cause.code) : null,
      message: error ? messageOf(error) : null,
      pid: process.pid,
    });
  }
  write({ kind: 'run-end' });
}
