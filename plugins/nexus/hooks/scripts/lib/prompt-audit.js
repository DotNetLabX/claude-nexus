'use strict';
/**
 * Prompt-audit capture and comparison without transcript or process access.
 * The background check and the on-demand command share these rules.
 */

const { createHash } = require('node:crypto');
const { win32, posix } = require('node:path');

const SEMVERISH = /^\d+\.\d+\.\d+$/;
const UNFINISHED_AGE_MS = 10 * 60 * 1000;
const CONNECTOR = /\bmcp__\w+/;

/**
 * The `Last-audited-cc: X.Y.Z` pin from the audit doc's Re-check protocol, or null.
 * Anchored to the start of a line on purpose: the same section explains the pin in running prose,
 * so an unanchored match would let the doc parse a pin out of its own explanation.
 */
function parsePin(auditDocText) {
  const m = String(auditDocText).match(/^Last-audited-cc: (\d+\.\d+\.\d+)/m);
  return m ? m[1] : null;
}

/**
 * The first X.Y.Z in `claude --version` output, or null. The banner shape is UNDOCUMENTED
 * (ADR-84) — today it is `2.1.225 (Claude Code)`, so scan for the pattern anywhere in the string
 * rather than assuming a position, and treat anything without one as "no version".
 */
function parseVersion(cliOutput) {
  const m = String(cliOutput).match(/\d+\.\d+\.\d+/);
  return m ? m[0] : null;
}

/**
 * True only when `running` is STRICTLY newer than `pinned`, compared numerically per segment
 * (a lexical compare reads 2.10.0 as older than 2.9.9).
 */
function isNewer(running, pinned) {
  // Shape-check BOTH inputs before comparing: either can be null (an unparseable banner, a doc with
  // no pin), and a four-segment or lettered version would otherwise compare on its first three.
  if (!SEMVERISH.test(String(running)) || !SEMVERISH.test(String(pinned))) return false;
  const a = String(running).split('.').map(Number);
  const b = String(pinned).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false; // equal
}

function auditWarning(files, problems, limit) {
  if (!files.length && !problems.length) return '';
  const banner = '\n\n--- prompt-audit tripwire ---\n';
  const affected = sides => sides.length ? ' (' + sides.join(', ') + ')' : '';
  const problemLines = problems.map(({ reason, sides }) => 'Check could not run' + affected(sides) + ': ' + reason + '.');
  const named = files.map(({ name, sides, couldNotRun }) =>
    name + affected(sides) + (couldNotRun ? ' — check could not run' : '')).join(', ');
  const lines = [
    ...(files.length ? ['Differences in .claude/prompt-audit/: ' + named] : []),
    ...problemLines,
    ...(problems.length ? ['See docs/architecture/subagent-context-audit.md.'] : []),
  ];
  const full = banner + lines.join('\n') + '\n';
  if (full.length <= limit) return full;

  const sides = [...new Set([...files, ...problems].flatMap(item => item.sides))];
  if (!files.length) {
    return [banner + problemLines.join('\n'), '\n\nPrompt audit: check could not run' + affected(sides),
      '\n\nCheck could not run'].find(text => text.length <= limit) ?? '';
  }
  const prefix = '\n\n';
  const names = [];
  let remaining = limit - prefix.length;
  for (const { name } of files) {
    const length = name.length + (names.length ? 2 : 0);
    if (length > remaining) break;
    names.push(name);
    remaining -= length;
  }
  if (!names.length) return '';
  for (const [index, name] of names.entries()) {
    const label = affected(files[index].sides);
    if (label.length > remaining) continue;
    names[index] = name + label;
    remaining -= label.length;
  }
  const detail = ['\n' + problemLines.join('\n'), '; check could not run']
    .find(text => problems.length && text.length <= remaining) ?? '';
  const title = 'Prompt audit: ';
  return prefix + (title.length + detail.length <= remaining ? title : '') + names.join(', ') + detail;
}

function selectTranscript(records, version, ageMs = 0) {
  let snapshot;
  let project;
  let request;
  const attachments = [];
  let foundVersion = false;
  for (const record of records) {
    if (record?.version !== version) continue;
    foundVersion = true;
    if (record.malformed) return { status: ageMs < UNFINISHED_AGE_MS ? 'unfinished' : 'unreadable' };
    if (snapshot && request) continue;
    if (record.type === 'attachment') {
      const attachment = record.attachment;
      if (attachment?.type === 'prompt_snapshot') {
        if (!snapshot) {
          snapshot = attachment;
          project = record.cwd;
        }
      }
      else if (typeof attachment?.type === 'string') attachments.push(attachment);
    }
    if (record.type === 'api-request-shape') request ??= record;
  }
  if (!foundVersion) return { status: 'no-sample' };
  if (snapshot && (!Array.isArray(snapshot.systemPrompt) || snapshot.systemPrompt.some(block => typeof block !== 'string'))) {
    return { status: 'unreadable' };
  }
  if (request && (!Array.isArray(request.shape?.tools) || request.shape.tools.some(tool =>
    typeof tool?.name !== 'string' || (tool.description != null && typeof tool.description !== 'string')))) {
    return { status: 'unreadable' };
  }
  if (!snapshot || !request) return { status: ageMs < UNFINISHED_AGE_MS ? 'unfinished' : 'unsupported' };
  const tools = request.shape.tools.map(({ name, description }) => ({ name, description }));
  return { status: 'usable', blocks: snapshot.systemPrompt, tools, attachments, project };
}

function maskIdentifiers(text) {
  return text
    .replace(/\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi, '<ID>')
    .replace(/\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/g, '<DATE>')
    .replace(/\b(?:claude[ -](?:(?:fable|opus|sonnet|haiku)(?:[ -]\d+(?:[.-]\d+)*)?|\d+(?:[.-]\d+)*)|(?:fable|opus|sonnet|haiku)[ -]\d+(?:[.-]\d+)*)\b/gi, '<MODEL>');
}

function maskProfile(text) {
  return text.replace(/(?<![\w.-])\.claude(?:-[\w-]+)?(?![\w.-])/g, '<CLAUDE_CONFIG>');
}

function textMask({ home, project, config } = {}) {
  const separator = '[/\\\\]';
  const roots = [home, project, config].filter(Boolean).map(root => root.replace(/[\\/]+$/, ''))
    .filter(Boolean).sort((a, b) => b.length - a.length)
    .map(root => root.split(/[\\/]/).map(part => part.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&')).join(separator));
  const known = roots.length ? '(?:' + roots.join('|') + ')(?![\\w-]|\\.[\\w.-])' : '(?!)';
  const pathPart = '[\\w.%+@~$-]+';
  const absolute = '(?:[A-Za-z]:' + separator + '|\\\\\\\\(?=' + pathPart + separator +
    ')|/(?!dev/null\\b)(?=' + pathPart + '/))';
  const tail = '[^\\s<>"\'\\x60|,;:!()\\[\\]{}]*';
  const bare = new RegExp('(?<![\\w.*?/\\\\<])(?:' + known + '(?:' + separator + tail +
    ')?|' + absolute + tail + ')', 'gi');
  const quoted = new RegExp('(["\'])(?:' + known + '|' + absolute +
    ')(?:(?!\\1)[^\\r\\n*?])*\\1', 'gi');
  const knownGlob = new RegExp('(?<![\\w.*?/\\\\<])' + known + '(?=' + separator + tail + '[*?])', 'gi');
  const spacedGlob = new RegExp('(?<![\\w.*?/\\\\<])' + known +
    separator + '[\\w.%+@~$ /\\\\-]*?\\s+[\\w.%+@~$ /\\\\-]*?(?=' + separator + '[*?])', 'gi');
  return text => maskIdentifiers(maskProfile(text.replace(knownGlob, '<PATH>').replace(spacedGlob, '<PATH>')
    .replace(quoted, '$1<PATH>$1').replace(bare, path =>
    /[*?]/.test(path) ? path : '<PATH>' + (path.match(/\.+$/)?.[0] ?? ''),
  ))).trim();
}

function sorted(values) {
  return Array.from(new Set(values)).sort();
}

function lines(text, mask) {
  return (text ?? '').split(/\r?\n/)
    .filter(line => !/^\s*<total_tokens>\d+ tokens left<\/total_tokens>\s*$/.test(line))
    .map(mask).filter(Boolean);
}

function instructionPath(path, { home, project, config }, mask) {
  const normalized = path.replaceAll('\\', '/');
  for (const [root, label] of [[project, '<PROJECT>'], [home, '<HOME>'], [config, '<CLAUDE_CONFIG>']]) {
    if (!root) continue;
    const prefix = root.replaceAll('\\', '/').replace(/\/+$/, '');
    const windows = /^[A-Za-z]:\//.test(prefix);
    const candidate = windows ? normalized.toLowerCase() : normalized;
    const rootPath = windows ? prefix.toLowerCase() : prefix;
    if (candidate === rootPath) return label;
    if (!candidate.startsWith(rootPath + '/')) continue;
    const parts = maskProfile(normalized.slice(prefix.length)).split('/');
    const keyIndex = label === '<CLAUDE_CONFIG>' && parts[1] === 'projects' ? 2 :
      parts[1] === '<CLAUDE_CONFIG>' && parts[2] === 'projects' ? 3 : -1;
    const projectKey = project && transcriptProjectName(project);
    if (keyIndex > 0 && parts[keyIndex]?.toLowerCase() === projectKey?.toLowerCase()) parts[keyIndex] = '<PROJECT>';
    return label + maskIdentifiers(parts.join('/'));
  }
  if (/^(?:[A-Za-z]:)?\//.test(normalized)) {
    const windows = /^[A-Za-z]:\/|^\/\//.test(normalized);
    const canonical = windows ? win32.normalize(normalized).replaceAll('\\', '/').toLowerCase() :
      posix.normalize(normalized);
    const id = createHash('sha256').update(canonical).digest('hex').slice(0, 8);
    const name = posix.basename(canonical).toUpperCase();
    return '<EXT-' + id + '>' + (['CLAUDE.MD', 'MEMORY.MD'].includes(name) ? '/' + name.replace(/\.MD$/, '.md') : '');
  }
  return mask(path);
}

function transcriptProjectName(project) {
  return project.replace(/[^A-Za-z0-9]/g, '-');
}

function captureInputs(attachments, roots, mask) {
  const inputs = [];
  const otherInputs = [];
  for (const attachment of attachments) {
    if (attachment.type === 'instructions' && Array.isArray(attachment.files)) {
      for (const file of attachment.files) {
        if (typeof file?.type === 'string' && typeof file.path === 'string') {
          inputs.push(mask(file.type) + ':' + instructionPath(file.path, roots, mask));
        }
      }
    } else if (attachment.type === 'hook_additional_context' && Array.isArray(attachment.content)) {
      for (const contribution of attachment.content) {
        if (typeof contribution !== 'string') continue;
        const normalized = lines(contribution, mask);
        const heading = normalized.find(line => /^#{1,6}\s/.test(line));
        const identity = heading ?? normalized[0];
        if (identity) (/^# Nexus\b/.test(heading) ? inputs : otherInputs).push(identity.slice(0, 80));
      }
    } else if (attachment.type === 'environment') {
      inputs.push('environment');
    }
  }
  return { inputs, otherInputs };
}

const maskType = textMask();
function agentType(meta) {
  return typeof meta?.agentType === 'string' ? maskType(meta.agentType) : 'unknown';
}

function captureSubagents(version, samples, roots = {}, previous) {
  const wrapper = [...(previous?.wrapper ?? [])];
  const agents = new Map(Object.entries(previous?.agents ?? {}).map(([type, agent]) => [type, {
    inputs: [...agent.inputs], otherInputs: [...agent.otherInputs], tools: new Map(Object.entries(agent.tools)),
  }]));
  for (const { blocks, tools, attachments, meta, project } of samples) {
    const sampleRoots = { ...roots, project: project ?? roots.project };
    const mask = textMask(sampleRoots);
    wrapper.push(...blocks.slice(1).flatMap(block => lines(block, mask)));
    const type = agentType(meta);
    if (!agents.has(type)) agents.set(type, { tools: new Map(), inputs: [], otherInputs: [] });
    const agent = agents.get(type);
    for (const tool of tools) {
      if (tool.name.startsWith('mcp__')) continue;
      const name = mask(tool.name);
      agent.tools.set(name, sorted([...(agent.tools.get(name) ?? []), ...lines(tool.description, mask)]));
    }
    const { inputs, otherInputs } = captureInputs(attachments, sampleRoots, mask);
    agent.inputs.push(...inputs);
    agent.otherInputs.push(...otherInputs);
  }
  return {
    version, wrapper: sorted(wrapper),
    agents: Object.fromEntries(sorted(agents.keys()).map(type => {
      const { inputs, otherInputs, tools } = agents.get(type);
      return [type, {
        inputs: sorted(inputs),
        otherInputs: sorted(otherInputs),
        tools: Object.fromEntries(sorted(tools.keys()).map(name => [name, tools.get(name)])),
      }];
    })),
  };
}

function captureMain(version, samples, roots = {}) {
  if (samples.length < 2) return null;
  const counts = new Map();
  for (const { blocks, attachments, project } of samples.slice(0, 3)) {
    const mask = textMask({ ...roots, project: project ?? roots.project });
    const style = new Set(attachments.filter(attachment => attachment.type === 'output_style_instructions')
      .flatMap(attachment => typeof attachment.style?.prompt === 'string' ? lines(attachment.style.prompt, mask) : []));
    const kept = blocks.flatMap((block, index) => {
      if (CONNECTOR.test(block)) return [];
      const text = index === 0 ? block.replace(/^[\s\S]*?(?:[.!?](?=\s|$)|$)/, '') : block;
      return lines(text, mask).filter(line => !style.has(line));
    });
    for (const line of new Set(kept)) counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return { version, lines: sorted([...counts].filter(([, count]) => count >= 2).map(([line]) => line)) };
}

function compareLines(saved, current, removed, added, label) {
  const previous = new Set(saved);
  const observed = new Set(current);
  for (const line of previous) {
    if (!observed.has(line)) removed.push(label + line);
  }
  for (const line of observed) {
    if (!previous.has(line)) added.push('Added ' + label + line);
  }
}

function compareSubagents(saved, current, losses, others) {
  compareLines(saved.wrapper, current.wrapper, losses, others, 'Wrapper: ');
  for (const [type, agent] of Object.entries(saved.agents)) {
    if (!Object.hasOwn(current.agents, type)) {
      others.push('Agent type not sampled: ' + type);
      continue;
    }
    const seen = current.agents[type];
    compareLines(agent.inputs, seen.inputs, losses, others, type + ' input: ');
    compareLines(agent.otherInputs ?? [], seen.otherInputs ?? [], others, others, type + ' other hook context: ');
    for (const [name, description] of Object.entries(agent.tools)) {
      if (Object.hasOwn(seen.tools, name)) {
        compareLines(description, seen.tools[name], losses, others, type + ' ' + name + ': ');
      } else {
        others.push('Tool not sampled: ' + type + ' ' + name);
      }
    }
    for (const [name, description] of Object.entries(seen.tools)) {
      if (!Object.hasOwn(agent.tools, name)) others.push(['Added tool: ' + type + ' ' + name, ...description].join('\n'));
    }
  }
  for (const [type, agent] of Object.entries(current.agents)) {
    if (!Object.hasOwn(saved.agents, type)) {
      others.push(['Added agent type: ' + type, ...agent.inputs, ...agent.otherInputs,
        ...Object.entries(agent.tools).map(([name, description]) => [name, ...description].join('\n'))].join('\n'));
    }
  }
}

function compareMain(saved, current, evidence, losses, others) {
  const normalize = line => line.trim().replace(/^(?:[-*+]|\d+[.)])\s+/, '').replace(/\s+/g, ' ');
  const subagentLines = new Set([
    ...evidence.wrapper,
    ...Object.values(evidence.agents).flatMap(agent => Object.values(agent.tools).flat()),
  ].map(normalize));
  const previous = new Set(saved.lines);
  const observed = new Set(current.lines);
  for (const line of previous) {
    if (!observed.has(line)) others.push('Removed main line: ' + line);
  }
  for (const line of observed) {
    if (previous.has(line)) continue;
    const changes = subagentLines.has(normalize(line)) ? others : losses;
    changes.push('New main line: ' + line);
  }
}

function compareSide(side, capture, baseline, evidence = capture.subagent ?? capture.mainEvidence) {
  const current = capture[side];
  if (!current || (side === 'main' && evidence?.version !== current.version)) return null;
  const losses = [];
  const others = [];
  const saved = baseline?.[side];
  if (!saved) {
    if (side === 'subagent') compareSubagents({ wrapper: [], agents: {} }, current, losses, others);
    else for (const line of current.lines) others.push('Added main line: ' + line);
    return { verdict: 'first-run', losses, others };
  }
  if (side === 'subagent') compareSubagents(saved, current, losses, others);
  else compareMain(saved, current, evidence, losses, others);
  return { verdict: losses.length ? 'loss' : 'clean', losses, others };
}

function updateBaseline(saved, capture) {
  const updated = { ...saved };
  if (capture.subagent) {
    const updatedAgents = new Map(Object.entries(saved?.subagent?.agents ?? {}));
    for (const [type, agent] of Object.entries(capture.subagent.agents)) {
      updatedAgents.set(type, { ...agent, tools: { ...updatedAgents.get(type)?.tools, ...agent.tools } });
    }
    updated.subagent = { ...capture.subagent, agents: Object.fromEntries(updatedAgents) };
  }
  if (capture.main) updated.main = capture.main;
  return updated;
}

function renderDifference({ version, verdict, sides, losses, others, problems = [] }) {
  const section = (title, items) =>
    ['## ' + title, '', ...(items.length ? items.map(item => '- ' + item.replaceAll('\n', '\n  ')) : ['None']), ''];
  return [
    '# Prompt audit — ' + version, '', 'Verdict: ' + verdict, 'Sides: ' + sides.join(', '), '',
    ...section('Losses', losses), ...section('Other differences', others),
    ...(problems.length ? section('Checks that could not run', problems) : []),
  ].join('\n');
}

module.exports = {
  parsePin, parseVersion, isNewer, selectTranscript, agentType, captureSubagents, captureMain,
  compareSide, updateBaseline, renderDifference, auditWarning, transcriptProjectName,
};
