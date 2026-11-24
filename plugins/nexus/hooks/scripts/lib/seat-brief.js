'use strict';
/**
 * Builds the prompt, other-work list and developer build approval stamp for codex-job.js brief.
 * The approval stamp belongs to one coordinating session. That session is its sole writer and runs
 * its stamp updates and brief calls sequentially.
 */

const fs = require('fs');
const path = require('path');
const { findAgent, installedNames, pluginRoot } = require('./plugin-root');
const { specFolder } = require('./parts');
const { isSafeId } = require('./safe-id');
const { gitChanged } = require('./codex-seat');
const { readApprovedSet, relPath } = require('../prohibition-gate');

const TEMPLATE = path.join(__dirname, 'seat-brief-template.md');
const RUNNER = path.resolve(__dirname, '..', 'verify-run.js');
const STEP = /^#{2,4}\s+Step\s+(\d+[a-z]?)\b/i;
const FIELD = /^(\s*)(?:[-*]\s+)?(?:\*\*)?(Files|Accept|Effort points):(?:\*\*)?\s*/;
const PRIOR_WORK = {
  question: 'if it exists, read the last finished step block to find the first incomplete step.',
  build: 'read the newest range note and the blocks after it first. With no range note, read the last finished step block first. Rebuild from the plan, the answers, implementation.md and the working tree.',
  fix: 'read the newest range note, where it has one, and the blocks after it first. Rebuild from implementation.md and the working tree.',
  solo: 'read your earlier solo block where the dispatch resumes it and rebuild from the failure evidence and the working tree.',
};

function unitKind(unit) {
  if (unit === 'questions') return { kind: 'question' };
  if (unit.startsWith('steps ')) return { kind: 'build', runUnit: '{the step}' };
  const number = /\d+/.exec(unit)[0];
  if (unit.startsWith('solo fix ')) return { kind: 'solo', runUnit: `solo-fix-${number}` };
  if (unit.startsWith('hand-up ')) return { kind: 'fix', runUnit: `hand-up-${number}` };
  return { kind: 'fix', runUnit: `fix-c${number}` };
}

function skillFile(name, tree, root) {
  const parts = name.split(':');
  if (parts.length > 2 || !parts.every(isSafeId)) throw new Error(`invalid skill name ${name}`);
  const fileOf = (base) => base && path.resolve(base, 'skills', parts.at(-1), 'SKILL.md');
  const installed = (plugin) => fileOf(pluginRoot(plugin, root));
  const exists = (file) => file && fs.existsSync(file);
  if (parts.length === 2) {
    const file = installed(parts[0]);
    if (exists(file)) return file;
  } else {
    for (const file of [fileOf(path.join(tree, '.claude')), installed('nexus')]) {
      if (exists(file)) return file;
    }
    const matches = installedNames().filter((plugin) => plugin !== 'nexus').map((plugin) => ({ plugin, file: installed(plugin) }))
      .filter(({ file }) => exists(file));
    if (matches.length > 1) throw new Error(`skill ${name} is ambiguous: ${matches.map(({ plugin }) => plugin).join(', ')}`);
    if (matches.length) return matches[0].file;
  }
  throw new Error(`skill ${name} was not found`);
}

function briefSkills(agent, mapped, tree, root) {
  const source = fs.readFileSync(agent, 'utf8');
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1] ?? '';
  const formats = /^skills:[ \t]*(.*)$/m.exec(frontmatter)?.[1] ?? '';
  const names = new Set([...formats.replace(/^\[|\]$/g, '').split(',').map((name) => name.trim()).filter(Boolean), ...mapped]);
  return [...names].map((name) => {
    const file = skillFile(name, tree, root);
    return { name, file, content: fs.readFileSync(file, 'utf8') };
  });
}

function verifyRoles(tree) {
  try {
    return JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8'))?.roles ?? {};
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

function inlineFields(line, ticks) {
  const segments = [];
  let start = 0;
  for (const token of line.matchAll(/`+| · /g)) {
    if (token[0][0] === '`') {
      if (!ticks) ticks = token[0].length;
      else if (ticks === token[0].length) ticks = 0;
    } else if (!ticks) {
      segments.push(line.slice(start, token.index));
      start = token.index + token[0].length;
    }
  }
  segments.push(line.slice(start));
  return { segments, ticks };
}

function planSteps(text) {
  const steps = [];
  let inSteps = false;
  let step;
  let files;
  let fence;
  let ticks = 0;
  for (const line of text.split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker?.startsWith(fence) && line.trim() === marker) fence = null;
      continue;
    }
    if (marker) { fence = marker; continue; }
    if (!inSteps) {
      inSteps = /^## Implementation Steps\s*$/.test(line);
      continue;
    }
    const heading = STEP.exec(line);
    if (heading) {
      step = { id: heading[1].toLowerCase(), files: [], effort: 0 };
      steps.push(step);
      files = null;
      ticks = 0;
      continue;
    }
    if (/^#{1,2}\s/.test(line)) break;
    if (/^#{3,6}\s/.test(line)) { step = null; files = null; }
    if (!step) continue;
    const item = /^(\s*)[-*]\s/.exec(line);
    if (!ticks && (!line.trim() || (item && files && item[1].length <= files.indent))) files = null;
    const continuing = ticks > 0;
    const fields = inlineFields(line, ticks);
    ticks = fields.ticks;
    for (const [index, segment] of fields.segments.entries()) {
      if (index) files = null;
      const field = index || !continuing ? FIELD.exec(segment) : null;
      if (field) {
        const value = segment.slice(field[0].length);
        files = null;
        if (field[2] === 'Files') {
          files = { indent: index ? Infinity : field[1].length, lines: [value] };
          step.files.push(files);
        }
        if (field[2] === 'Effort points') step.effort = Number(/^\d+(?:\.\d+)?\b/.exec(value)?.[0] ?? 0);
      } else if (files) {
        files.lines.push(segment);
      }
    }
  }
  return steps;
}

function planScope(steps, tree) {
  const paths = new Set();
  const skippedTokens = new Set();
  for (const step of steps) {
    for (const { lines } of step.files) {
      const field = lines.join('\n').trim();
      if (/^none\b/i.test(field)) continue;
      for (const [, raw] of field.matchAll(/(?<!`)`([^`]+)`(?!`)/g)) {
        if (/\s/u.test(raw)) continue;
        const token = raw.replace(/\\/g, '/');
        if (/[?*{}\[\]]/.test(token)) { skippedTokens.add(raw); continue; }
        if (!/[/.]/.test(token) && !/^(?:[A-Z][A-Z0-9_-]+|Dockerfile|Makefile)$/.test(token)) continue;
        if (/[<>|"\r\n]/.test(token) || /:/.test(token.replace(/^[a-z]:\//i, ''))) continue;
        const absolute = path.resolve(tree, token);
        const rel = relPath(absolute, tree);
        if (!rel || rel === '..' || rel.startsWith('../') || path.isAbsolute(rel)) continue;
        paths.add(token.endsWith('/') ? `${absolute}/` : absolute);
      }
    }
  }
  return { paths: [...paths], skippedTokens: [...skippedTokens] };
}

function unitEffort(steps, unit) {
  const range = /^steps (\d+[a-z]?)[–-](\d+[a-z]?)$/.exec(unit);
  if (!range) return 0;
  const first = steps.findIndex(({ id }) => id === range[1]);
  const last = steps.findIndex(({ id }) => id === range[2]);
  if (first === -1 || last < first) throw new Error(`the plan does not hold ${unit}`);
  return steps.slice(first, last + 1).reduce((sum, step) => sum + step.effort, 0);
}

function otherWorkOf(tree, delivery, paths) {
  const uncommitted = gitChanged(tree);
  if (!uncommitted) throw new Error(`git could not list the uncommitted files in ${tree}`);
  const ownRecords = ['implementation.md', 'questions.md', 'lessons.md'].map((name) => path.join(delivery, name));
  const declared = [...paths, ...ownRecords].map((entry) => {
    const rel = relPath(entry, tree);
    return entry.endsWith('/') ? `${rel}/` : rel;
  });
  return uncommitted.filter((file) => {
    const rel = relPath(file.path, tree);
    return !declared.some((entry) => entry.endsWith('/') ? rel.startsWith(entry) : rel === entry);
  }).map((file) => file.path);
}

function writeStamp(root, session, slug, paths) {
  const stamp = path.join(root, '.claude', 'approval-scope', `${session}.json`);
  const live = readApprovedSet(root, session);
  const previous = live?.slug === slug ? JSON.parse(fs.readFileSync(stamp, 'utf8')) : {};
  const merged = [...new Set([...(Array.isArray(previous.paths) ? previous.paths : []), ...paths])];
  const content = { ...previous, ts: new Date().toISOString(), session_id: session, slug, paths: merged };
  const pending = `${stamp}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(stamp), { recursive: true });
  fs.writeFileSync(pending, `${JSON.stringify(content, null, 2)}\n`);
  try {
    fs.renameSync(pending, stamp);
  } finally {
    if (fs.existsSync(pending)) fs.unlinkSync(pending);
  }
  return { stamp, stampPathCount: merged.length };
}

function writeBrief({ role, unit, tree, slug, skills: mapped, root, session, unitFile, out, model, repoLimit }) {
  if (!isSafeId(session)) throw new Error('brief needs a usable CLAUDE_CODE_SESSION_ID');
  const folder = specFolder(tree, slug);
  if (!folder) throw new Error(`feature ${slug} was not found in ${tree}`);
  const delivery = path.join(folder, 'delivery');
  const agent = isSafeId(role) && findAgent(role, { root });
  if (!agent) throw new Error(`agent ${role} was not found`);
  const skills = briefSkills(agent.file, mapped, tree, root);
  const { kind, runUnit } = unitKind(unit);
  const writing = kind !== 'question';
  const plan = path.join(delivery, 'plan.md');
  const steps = planSteps(fs.readFileSync(plan, 'utf8'));
  const limitMinutes = Math.ceil(1.5 * Math.max(repoLimit, unitEffort(steps, unit)));
  const { paths, skippedTokens } = planScope(steps, tree);
  const other = otherWorkOf(tree, delivery, paths);
  const otherWork = `${out}.other-work`;
  const sections = { QUESTION: !writing, WRITE: writing, DEVELOPER: writing && role === 'developer',
    BUILD: kind === 'build' && role === 'developer', SOLO: kind === 'solo' };
  const fields = {
    ROLE_TITLE: role[0].toUpperCase() + role.slice(1), ROLE: role, SLUG: slug, UNIT: unit, TREE: tree,
    AGENT_FILE: path.resolve(agent.file), PLAN: plan, ANSWERS: path.join(delivery, 'questions.md'),
    IMPLEMENTATION: path.join(delivery, 'implementation.md'), PRIOR_WORK: PRIOR_WORK[kind],
    UNIT_TEXT: fs.readFileSync(unitFile, 'utf8').trimEnd(), OTHER_WORK: other.join(', ') || 'none', RUNNER, RUN_UNIT: runUnit,
    TEST_FILES: kind === 'solo' ? '{failing test files}' : '{test files}', SESSION: session,
    VERIFY_ROLES: writing ? JSON.stringify(verifyRoles(tree)) : null,
    MODEL_STAMP: model ? `codex — ${model}` : 'codex',
    SKILLS: skills.map(({ name, file, content }) => `===== skill: ${name} (${file}) =====\n${content}`).join('\n\n'),
  };
  const body = fs.readFileSync(TEMPLATE, 'utf8')
    .replace(/^@@([A-Z]+)_BEGIN@@\r?\n([\s\S]*?)^@@\1_END@@\r?\n/gm, (_, section, text) => sections[section] ? text : '')
    .replace(/@@([A-Z_]+)@@/g, (_, field) => {
      if (!Object.hasOwn(fields, field)) throw new Error(`unknown brief field ${field}`);
      return fields[field];
    });
  fs.writeFileSync(out, body);
  fs.writeFileSync(otherWork, other.length ? `${other.join('\n')}\n` : '');
  const approval = role === 'developer' && kind === 'build' ? writeStamp(root, session, slug, paths) : { stamp: null, stampPathCount: 0 };
  return { brief: out, characters: body.length, skills: skills.map(({ name, file }) => ({ name, file })),
    otherWork, ...approval, skippedTokens, limitMinutes };
}

module.exports = { writeBrief };
