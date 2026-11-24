'use strict';
/**
 * The session-start path reads local results and launches the background check.
 * The background check and on-demand command share the transcript reader and atomic result writes.
 */

const fs = require('fs');
const path = require('path');
const { devNull, homedir } = require('os');
const { execSync, spawn } = require('child_process');
const { createHash, randomUUID } = require('crypto');
const { performance } = require('perf_hooks');
const { StringDecoder } = require('string_decoder');
const lock = require('./file-lock');
const {
  parsePin, parseVersion, isNewer, selectTranscript, agentType, captureSubagents, captureMain, compareSide,
  renderDifference, auditWarning, transcriptProjectName,
} = require('./prompt-audit');

const AUDIT_DOC = 'docs/architecture/subagent-context-audit.md';
const BASELINE = 'docs/architecture/subagent-context-baseline.json';
const STATE_DIR = '.claude/prompt-audit';
const VERSION_LOOKUP_MS = 1500;
const CHECK_LOCK = 'check.lock';
const LOCK_AGE_MS = 10 * 60 * 1000;
const SIDES = ['subagent', 'main'];
const DIFFERENCE_NAME = /^(\d+\.\d+\.\d+)\.md$/;
const VERSION_STAMP = /(?<!\\)"version"\s*:\s*"(\d+\.\d+\.\d+)"/;
const AUDIT_RECORD = /(?<!\\)"type"\s*:\s*"(?:attachment|api-request-shape)"/;
const REQUIRED_RECORD = /(?<!\\)"type"\s*:\s*"(?:prompt_snapshot|api-request-shape)"/;

function missing(error) {
  return error.code === 'ENOENT';
}

function readOptional(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (error) { if (!missing(error)) throw error; }
  return null;
}

function entries(folder) {
  try { return fs.readdirSync(folder, { withFileTypes: true }); } catch (error) { if (!missing(error)) throw error; }
  return [];
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function versionOrder(left, right) {
  return isNewer(left, right) ? 1 : isNewer(right, left) ? -1 : 0;
}

function runningVersion() {
  // A shell also resolves npm's claude.cmd on Windows.
  return parseVersion(execSync('claude --version', {
    timeout: VERSION_LOOKUP_MS, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
  }));
}

function recordedProject(folderName, sample) {
  const instructionPaths = sample.attachments
    .filter(attachment => attachment.type === 'instructions' && Array.isArray(attachment.files))
    .flatMap(attachment => attachment.files.filter(file => file?.type === 'Project').map(file => file.path));
  for (const candidate of [sample.project, ...instructionPaths]) {
    if (typeof candidate !== 'string') continue;
    const windows = /^[A-Za-z]:[\\/]/.test(candidate);
    const paths = windows ? path.win32 : path.posix;
    if (!paths.isAbsolute(candidate)) continue;
    for (let dir = candidate; ; dir = paths.dirname(dir)) {
      const name = transcriptProjectName(dir.replaceAll('\\', '/'));
      if (windows ? name.toLowerCase() === folderName.toLowerCase() : name === folderName) return dir;
      if (paths.dirname(dir) === dir) break;
    }
  }
  return sample.project;
}

function readBaseline(project) {
  const text = readOptional(path.join(project, BASELINE));
  return { baseline: text === null ? null : JSON.parse(text), baseHash: text === null ? 'none' : hash(text) };
}

function transcriptFiles(folder, wantsMain) {
  const files = [];
  function add(directory, entry, side) {
    if (!entry.isFile() || !entry.name.endsWith('.jsonl')) return;
    const file = path.join(directory, entry.name);
    try {
      files.push({ file, side, mtimeMs: fs.statSync(file).mtimeMs });
    } catch (error) {
      if (!missing(error)) throw error;
    }
  }
  const sessions = entries(folder);
  if (wantsMain) {
    for (const entry of sessions) {
      add(folder, entry, 'main');
    }
  }
  for (const entry of sessions) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(folder, entry.name, 'subagents');
    for (const subagent of entries(directory)) {
      if (subagent.name.startsWith('agent-')) add(directory, subagent, 'subagent');
    }
  }
  files.sort((a, b) => b.mtimeMs - a.mtimeMs || a.file.localeCompare(b.file));
  return files;
}

function* transcriptLines(file) {
  const descriptor = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.allocUnsafe(64 * 1024);
    const decoder = new StringDecoder('utf8');
    let pending = '';
    for (;;) {
      const length = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (!length) {
        if (pending) yield pending + decoder.end();
        return;
      }
      pending += decoder.write(buffer.subarray(0, length));
      let start = 0;
      for (let next = pending.indexOf('\n'); next >= 0; next = pending.indexOf('\n', start)) {
        yield pending.slice(start, next);
        start = next + 1;
      }
      pending = pending.slice(start);
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

function transcriptGroups(candidate, target) {
  const groups = new Map();
  let unstampedFailure = false;
  let stamped = false;
  for (const line of transcriptLines(candidate.file)) {
    const required = REQUIRED_RECORD.test(line);
    if (target && !line.includes(target) && !required) {
      stamped ||= VERSION_STAMP.test(line);
      continue;
    }
    const stamp = line.match(VERSION_STAMP)?.[1];
    stamped ||= Boolean(stamp);
    if (target && stamp && stamp !== target && !line.includes(target)) continue;
    const isAudit = AUDIT_RECORD.test(line);
    const existing = groups.get(stamp);
    if (!required && ((existing?.snapshot && existing.shape) || (!isAudit && (!stamp || existing)))) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      if (!required) continue;
      if (!stamp) {
        unstampedFailure = true;
        continue;
      }
      record = { version: stamp, malformed: true };
    }
    const { version } = record ?? {};
    if (!/^\d+\.\d+\.\d+$/.test(version) || (target && version !== target)) continue;
    if (!groups.has(version)) groups.set(version, { records: [], snapshot: false, shape: false });
    const group = groups.get(version);
    if (record.malformed) {
      group.records.push(record);
      continue;
    }
    if (group.snapshot && group.shape) continue;
    if (unstampedFailure) {
      group.records.push({ version, malformed: true });
      unstampedFailure = false;
    }
    if (isAudit) group.records.push(record);
    else if (!group.records.length) group.records.push({ version });
    group.snapshot ||= record.type === 'attachment' && record.attachment?.type === 'prompt_snapshot';
    group.shape ||= record.type === 'api-request-shape';
  }
  if (unstampedFailure && groups.size === 1) {
    const [version, group] = groups.entries().next().value;
    if (!group.snapshot || !group.shape) group.records.push({ version, malformed: true });
  } else if (unstampedFailure && target && !stamped) {
    groups.set(target, { records: [{ version: target, malformed: true }], snapshot: false, shape: false });
  }
  return groups;
}

function fileError(error) {
  return typeof error.code === 'string' && typeof error.syscall === 'string';
}

function readMeta(file) {
  const text = readOptional(file.replace(/\.jsonl$/, '.meta.json'));
  try { return JSON.parse(text); } catch (error) { if (!(error instanceof SyntaxError)) throw error; }
  return null;
}

function readSample(candidate, group, version, folderName) {
  const sample = selectTranscript(group?.records ?? [], version, Date.now() - candidate.mtimeMs);
  if (sample.status === 'usable') {
    sample.meta = candidate.meta;
    sample.project = recordedProject(folderName, sample);
  }
  return sample;
}

function comparisonRoots(project, transcripts) {
  const projects = path.dirname(path.resolve(transcripts));
  const home = homedir();
  const config = path.basename(projects) === 'projects' ? path.dirname(projects) :
    process.env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
  return { project, home, config };
}

function sampleVersion({ files, loadType, loadSample, version, baseline, sides, roots, allowUncompared = [] }) {
  const coverage = Object.fromEntries(SIDES.map(side => [side, {
    count: 0, unsupported: 0, unreadable: 0, unfinished: 0,
  }]));
  const savedAgents = baseline?.subagent?.agents ?? {};
  const newest = new Map();
  const uncompared = new Map();
  const mains = [];
  const extra = [];
  let evidence;
  let main;

  function read(candidate) {
    if (candidate.error) return { status: 'unreadable' };
    try { return loadSample(candidate); } catch (error) {
      if (!fileError(error)) throw error;
      return { status: missing(error) ? 'no-sample' : 'unreadable' };
    }
  }

  function add(candidate, type) {
    const sample = read(candidate);
    const side = coverage[candidate.side];
    if (type !== undefined && sample.status !== 'no-sample' && !newest.has(type)) {
      newest.set(type, sample.status);
      if (Object.hasOwn(savedAgents, type) && ['unfinished', 'unsupported'].includes(sample.status)) {
        uncompared.set(type, sample.status);
      }
    }
    if (sample.status === 'usable') {
      if (uncompared.has(type)) return false;
      side.count++;
      if (candidate.side === 'main') mains.push(sample);
      else evidence = captureSubagents(version, [sample], roots, evidence);
    } else if (Object.hasOwn(side, sample.status) &&
      !(sample.status === 'unsupported' && uncompared.has(type) && allowUncompared.includes(type))) {
      side[sample.status]++;
    }
    return sample.status === 'usable';
  }

  function captureNow() {
    const capture = { version };
    if (sides.includes('subagent') && evidence) capture.subagent = evidence;
    if (sides.includes('main') && evidence && main) {
      capture.main = main;
      if (!capture.subagent) capture.mainEvidence = evidence;
    }
    return capture;
  }

  function compare() {
    const capture = captureNow();
    return { capture, results: Object.fromEntries(sides.map(side => [side, compareSide(side, capture, baseline)])) };
  }

  for (const candidate of files) {
    if (candidate.side === 'subagent') {
      const type = loadType(candidate);
      if (coverage.subagent.count < 4 || !newest.has(type) || candidate.error) add(candidate, type);
      else if (!uncompared.has(type)) extra.push([candidate, type]);
    }
  }

  let comparison = compare();
  const hasLoss = () => Object.values(comparison.results).some(result => result?.verdict === 'loss');
  let next = 0;
  function resolveLoss() {
    while (hasLoss() && next < extra.length) {
      if (add(...extra[next++])) comparison = compare();
    }
  }
  resolveLoss();
  if (sides.includes('main')) {
    for (const candidate of files) {
      if (mains.length >= 3) break;
      if (candidate.side === 'main') add(candidate);
    }
    main = captureMain(version, mains, roots);
    comparison = compare();
    resolveLoss();
  }

  const problems = [];
  const blocked = [...uncompared].filter(([type]) => !allowUncompared.includes(type));
  if (sides.includes('subagent')) {
    for (const [type, status] of blocked) problems.push({
      side: 'subagent', type, reason: 'not compared: ' + type + ' — ' + status,
    });
  }
  for (const side of SIDES) {
    const counts = coverage[side];
    const neededForMain = side === 'subagent' && sides.includes('main');
    if (!sides.includes(side) && !neededForMain) continue;
    const verdict = counts.unreadable ? 'unreadable' : counts.unsupported && !counts.count ? 'unsupported' : '';
    if (verdict) {
      const reason = verdict === 'unreadable' ? 'unreadable record' : 'record shape changed';
      problems.push({ side, reason });
    }
  }
  return { ...comparison, coverage, problems };
}

function searchVersion({ transcripts, version, baseline, sides = SIDES, project, allowUncompared }) {
  const start = performance.now();
  const folderName = path.basename(path.resolve(transcripts));
  const files = transcriptFiles(transcripts, sides.includes('main'));
  const loadType = candidate => {
    if (!Object.hasOwn(candidate, 'meta')) {
      try { candidate.meta = readMeta(candidate.file); } catch (error) {
        if (!fileError(error)) throw error;
        candidate.error = error;
      }
    }
    return agentType(candidate.meta);
  };
  const loadSample = candidate => {
    const group = transcriptGroups(candidate, version).get(version);
    return readSample(candidate, group, version, folderName);
  };
  const comparison = sampleVersion({ files, loadType, loadSample, version, baseline, sides, allowUncompared,
    roots: comparisonRoots(project, transcripts) });
  return { ...comparison, durationMs: performance.now() - start };
}

function readHistory(transcripts) {
  const versions = new Map();
  const folderName = path.basename(path.resolve(transcripts));
  for (const candidate of transcriptFiles(transcripts, true)) {
    const groups = transcriptGroups(candidate);
    if (candidate.side === 'subagent') candidate.meta = readMeta(candidate.file);
    for (const [version, group] of groups) {
      if (!versions.has(version)) versions.set(version, []);
      versions.get(version).push({
        side: candidate.side, type: agentType(candidate.meta), sample: readSample(candidate, group, version, folderName),
      });
    }
  }
  return versions;
}

function compareHistory(version, files, baseline, project, transcripts) {
  return sampleVersion({ files, version, baseline, sides: SIDES,
    roots: comparisonRoots(project, transcripts),
    loadType: candidate => candidate.type, loadSample: candidate => candidate.sample });
}

function replaceFile(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = target + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temp, content, { flag: 'wx' });
    fs.renameSync(temp, target);
  } catch (error) {
    try { fs.unlinkSync(temp); } catch { /* Keep the original write error. */ }
    throw error;
  }
}

function summarize({ capture, results, problems }) {
  const compared = SIDES.filter(side => capture[side]);
  const losses = compared.flatMap(side => results[side].losses ?? []);
  const others = compared.flatMap(side => results[side].others ?? []);
  const warningSides = compared.filter(side => ['loss', 'first-run'].includes(results[side].verdict));
  const verdict = ['loss', 'first-run'].find(kind => Object.values(results).some(result => result?.verdict === kind)) ??
    (problems.length ? 'could-not-run' : compared.length ? 'clean' : undefined);
  const affected = [...new Set([...warningSides, ...problems.map(problem => problem.side)])];
  return { version: capture.version, verdict, sides: affected.length ? affected : compared, losses, others,
    problems: problems.map(({ side, type, reason }) => type === undefined ? side + ': ' + reason : reason) };
}

function writeDifference(project, difference) {
  const name = difference.version + '.md';
  replaceFile(path.join(project, STATE_DIR, name), renderDifference(difference));
  return name;
}

function publishComparison(project, search, baseHash) {
  const difference = summarize(search);
  const name = difference.verdict ? writeDifference(project, difference) : undefined;
  if (baseHash !== undefined) {
    const { version } = search.capture;
    for (const side of SIDES) {
      const unsampled = side === 'subagent' && search.results.subagent?.others.some(item =>
        item.startsWith('Agent type not sampled: '));
      if (!unsampled && search.results[side]?.verdict === 'clean' &&
        !search.problems.some(problem => problem.side === side)) {
        replaceFile(marker(project, version, side, baseHash), '');
      }
    }
  }
  return { difference, name };
}

function pendingDifferences(project, pin, known) {
  const folder = path.join(project, STATE_DIR);
  for (const entry of entries(folder)) {
    const version = entry.isFile() && entry.name.match(DIFFERENCE_NAME)?.[1];
    if (!version || !isNewer(version, pin)) continue;
    const [, , verdict, sides] = readOptional(path.join(folder, entry.name))?.split(/\r?\n/, 4) ?? [];
    if (!['Verdict: loss', 'Verdict: first-run', 'Verdict: could-not-run'].includes(verdict)) continue;
    known.set(version, { name: entry.name, couldNotRun: verdict === 'Verdict: could-not-run',
      sides: SIDES.filter(side => sides?.slice('Sides: '.length).split(', ').includes(side)) });
  }
}

const checkLock = project => path.join(project, STATE_DIR, CHECK_LOCK);
const marker = (project, version, side, baseHash) =>
  path.join(project, STATE_DIR, 'clean-' + version + '-' + side + '-' + baseHash);

function checkDue(project, version, pin, { baseline, baseHash }) {
  return SIDES.filter(side => isNewer(version, baseline?.[side]?.version ?? pin) &&
    !fs.existsSync(marker(project, version, side, baseHash)));
}

function launchCheck(project, transcripts, version) {
  const fd = fs.openSync(devNull, 'w');
  try {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'prompt-audit-check.js'), project, transcripts, version],
      { detached: true, windowsHide: true, stdio: ['ignore', fd, fd] });
    child.on('error', () => {});
    child.unref();
  } finally {
    fs.closeSync(fd);
  }
}

function sessionWarning({ project, transcripts, version, warningLimit = Infinity, launch = launchCheck }) {
  const pending = new Map();
  const problems = new Map();
  const recordProblem = (reason, sides = []) => problems.set(reason, [...(problems.get(reason) ?? []), ...sides]);
  const warn = () => auditWarning(
    [...pending.keys()].sort((left, right) => versionOrder(right, left)).map(key => pending.get(key)),
    [...problems].map(([reason, sides]) => ({ reason, sides })), warningLimit,
  );

  try {
    const pin = parsePin(readOptional(path.join(project, AUDIT_DOC)));
    if (!pin) return '';
    pendingDifferences(project, pin, pending);
    if (version == null) {
      try { version = runningVersion(); } catch (error) {
        if (!fileError(error) && typeof error.status !== 'number') throw error;
        recordProblem('Claude Code version unavailable');
        return warn();
      }
    }
    if (!isNewer(version, pin)) return warn();

    let saved;
    try { saved = readBaseline(project); } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      recordProblem('saved copy unreadable');
      return warn();
    }
    const sides = checkDue(project, version, pin, saved);
    if (!sides.length) return warn();
    if (!transcripts) {
      recordProblem('no transcript path', sides);
      return warn();
    }

    if (!lock.held(checkLock(project), LOCK_AGE_MS, { maxAgeMs: LOCK_AGE_MS, pidOnly: true })) {
      launch(project, transcripts, version);
    }
  } catch (error) {
    if (!fileError(error)) throw error;
    recordProblem('local audit I/O failed');
  }
  return warn();
}

module.exports = {
  AUDIT_DOC, BASELINE, STATE_DIR, SIDES, LOCK_AGE_MS, checkLock, checkDue, versionOrder, runningVersion, readBaseline,
  searchVersion, publishComparison,
  summarize, replaceFile, writeDifference, transcriptProjectName, sessionWarning, readHistory, compareHistory,
};
