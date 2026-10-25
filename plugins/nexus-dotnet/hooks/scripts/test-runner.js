'use strict';
/**
 * The vstest runner: `dotnet test`. Written to the test-runner contract of the nexus core (its
 * hooks/scripts/lib/test-runners.js, contract 1), which finds this file by its path in this plugin.
 *
 * Slow tests carry `[Trait("Speed", "Slow")]` on a class or a test method and are left out by the filter
 * clause `Speed!=Slow`. A named-files run is grouped per test project, each command filtered to the classes
 * its named files declare. A changed file ties to every test project that reaches its nearest project
 * through any chain of ProjectReferences, that project included when it is a test project; a
 * Directory.Build.props/.targets, Directory.Packages.props, global.json or NuGet.config ties to every test
 * project. A file no project owns leaves the run to the declared unit whole. A step close is
 * timed from a trx report; a red run's failures are read from the VSTest summary line of each failing
 * assembly.
 */
const fs = require('fs');
const path = require('path');

const SLOW_CLAUSE = 'Speed!=Slow';
// A .csproj is a test project when it references a test SDK or a test framework, or says so outright.
const TEST_PROJECT = /Microsoft\.NET\.Test\.Sdk|<IsTestProject>\s*true|xunit|nunit|mstest/i;
// Under cmd.exe's 8,191-character line limit with room for its own wrapper. Applied on every
// platform so the Linux gate exercises the fallback the Windows run depends on.
const COMMAND_BUDGET = 7000;
// MSBuild, the SDK and NuGet read these from any folder above a project, so a change to one can reach
// every project's output.
const READ_BY_EVERY_PROJECT = new Set(['directory.build.props', 'directory.build.targets', 'directory.packages.props', 'global.json', 'nuget.config']);
const ALREADY_EXCLUDED = /Speed!=Slow/;
const ALREADY_STOPPED = /(^|\s)--blame-hang-timeout[= ]/;
// The `--filter` forms the join accepts: quoted either way, `=` or `:`.
const FILTER = /--filter(\s+|[=:])(?:"([^"]*)"|'([^']*)'|([^\s"']+))/;
// The VSTest summary line of an assembly with a failure.
const FAILURE = /^\s*Failed!\s+-\s+Failed:.*?-\s+([^\s\\/]+)\.dll\b/gm;
// A run the test host aborted never ran the tests after the abort.
const ABORTED = /^\s*Test Run Aborted\b|The active test run was aborted/im;

// ── report reader ────────────────────────────────────────────────────────────────────────────────────

// trx attribute values are read as written: the fields used (ids, a class and method name, a
// codeBase path, a duration) carry nothing XML escapes.
function attributes(text) {
  const out = {};
  for (const m of String(text).matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

function trxDurationMs(text) {
  const m = String(text).match(/^(\d+):(\d+):(\d+)(?:\.(\d+))?$/);
  if (!m) return 0;
  const [, h, min, s, frac = ''] = m;
  return (Number(h) * 3600 + Number(min) * 60 + Number(s)) * 1000 + Number(frac.padEnd(7, '0').slice(0, 7)) / 10000;
}

// Each executed test of a .trx report.
function parseTrx(xml) {
  const methods = new Map();
  for (const m of String(xml).matchAll(/<UnitTest\b([^>]*)>([\s\S]*?)<\/UnitTest>/g)) {
    const method = String(m[2]).match(/<TestMethod\b([^>]*?)\/?>/);
    if (method) methods.set(attributes(m[1]).id, attributes(method[1]));
  }
  const entries = [];
  for (const m of String(xml).matchAll(/<UnitTestResult\b([^>]*?)\/?>/g)) {
    const a = attributes(m[1]);
    if (a.outcome === 'NotExecuted') continue;
    const def = methods.get(a.testId) || {};
    const className = def.className || '';
    entries.push({ key: `${className}::${a.testName}`, className, method: def.name || '', codeBase: def.codeBase || '', ms: trxDurationMs(a.duration) });
  }
  return entries;
}

// ── labels ───────────────────────────────────────────────────────────────────────────────────────────

const TRAIT = '[Trait("Speed", "Slow")]';
const HAS_TRAIT = /Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)/;
const TRAIT_LINE = /^\s*\[Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)\]\s*\r?$/;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The index of the quote closing the literal opened at `i`, -1 when the line ends first.
function closingQuote(s, i) {
  const verbatim = s[i] === '"' && (s[i - 1] === '@' || (s[i - 1] === '$' && s[i - 2] === '@'));
  for (let j = i + 1; j < s.length; j++) {
    if (verbatim && s[j] === '"') {
      if (s[j + 1] !== '"') return j;
      j++;
    } else if (!verbatim && s[j] === '\\') j++;
    else if (!verbatim && s[j] === s[i]) return j;
  }
  return -1;
}

// The attributes written at the start of a line (`[Fact] public void X()`), read bracket by bracket past string
// and character literals: { indent, attrs, rest }, `{ open: true }` when an attribute goes on past the line, null
// when the line starts with none.
function leadingAttributes(line) {
  const s = String(line);
  const indent = s.match(/^\s*/)[0];
  let i = indent.length;
  if (s[i] !== '[') return null;
  while (s[i] === '[') {
    let depth = 0;
    for (; i < s.length; i++) {
      if (s[i] === '"' || s[i] === "'") {
        i = closingQuote(s, i);
        if (i < 0) return { open: true };
      } else if (s[i] === '[') depth++;
      else if (s[i] === ']' && --depth === 0) break;
    }
    if (depth > 0) return { open: true };
    i++;
    while (i < s.length && /\s/.test(s[i])) i++;
  }
  return { indent, attrs: s.slice(indent.length, i), rest: s.slice(i) };
}
const inlineAttributes = (line) => {
  const a = leadingAttributes(line);
  return a && !a.open ? a.attrs : '';
};
const INLINE_TRAIT = /\[Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)\]\s*/;
// A line of attributes alone belongs to the declaration below it; one that goes on is a declaration itself.
const attributesOnly = (line) => {
  const a = leadingAttributes(line);
  const rest = a && !a.open ? a.rest.trim() : null;
  return rest === '' || (rest !== null && rest.startsWith('//'));
};

function insertAttribute(lines, declIndex) {
  let top = declIndex;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  if (lines.slice(top, declIndex).some((l) => HAS_TRAIT.test(l)) || HAS_TRAIT.test(inlineAttributes(lines[declIndex]))) return false;
  const indent = lines[declIndex].match(/^\s*/)[0];
  lines.splice(top, 0, `${indent}${TRAIT}${lines[declIndex].endsWith('\r') ? '\r' : ''}`);
  return true;
}

const classIndex = (lines, name) => lines.findIndex((l) => new RegExp(`\\bclass\\s+${escapeRegex(name)}\\b`).test(l));
const methodDecl = (method) => new RegExp(`\\b(?:void|Task|ValueTask)(?:<[^>]*>)?\\s+${escapeRegex(method)}\\s*\\(`);

function methodIndex(lines, className, method) {
  const from = classIndex(lines, className);
  return from < 0 ? -1 : lines.findIndex((l, i) => i > from && methodDecl(method).test(l));
}

function tagDotnetSource(source, { classes = [], methods = [] }) {
  const lines = String(source).split('\n');
  const missing = [];
  for (const name of classes) {
    const at = classIndex(lines, name);
    if (at < 0) missing.push(name);
    else insertAttribute(lines, at);
  }
  for (const { className, method } of methods) {
    const at = methodIndex(lines, className, method);
    if (at < 0) missing.push(`${className}.${method}`);
    else insertAttribute(lines, at);
  }
  return { text: lines.join('\n'), missing };
}

const TEST_ATTRIBUTE = /[[,]\s*(?:[\w.]*\.)?(?:Fact|Theory|Test|TestMethod|TestCase|TestCaseSource|DataTestMethod|SkippableFact|SkippableTheory)\b/;
const ANY_METHOD = /\b(?:void|Task|ValueTask)(?:<[^>]*>)?\s+(\w+)\s*\(/;

// The test methods a class declares, by the test attribute above each or on its own line, up to the next
// class declaration; `complete` is false when an attribute there goes on past its line, so its method may be
// missing.
function testMethodsOf(lines, className) {
  const from = classIndex(lines, className);
  if (from < 0) return { names: [], complete: false };
  const names = [];
  let complete = true;
  for (let i = from + 1; i < lines.length && !/\bclass\s+\w+/.test(lines[i]); i++) {
    const a = leadingAttributes(lines[i]);
    if (a && a.open) complete = false;
    const m = lines[i].match(ANY_METHOD);
    if (!m) continue;
    let top = i;
    while (top > 0 && attributesOnly(lines[top - 1])) top--;
    if (lines.slice(top, i).some((l) => TEST_ATTRIBUTE.test(l)) || TEST_ATTRIBUTE.test(inlineAttributes(lines[i]))) names.push(m[1]);
  }
  return { names, complete };
}

const labelAbove = (lines, at) => {
  let top = at;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  return lines.slice(top, at).some((l) => HAS_TRAIT.test(l)) || HAS_TRAIT.test(inlineAttributes(lines[at]));
};
// Removes the label lines above the declaration at `at` and a label written on its own line; returns its new index.
function removeLabelAbove(lines, at) {
  let top = at;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  let decl = at;
  for (let i = at - 1; i >= top; i--) if (TRAIT_LINE.test(lines[i])) { lines.splice(i, 1); decl--; }
  const a = leadingAttributes(lines[decl]);
  if (a && !a.open) lines[decl] = a.indent + a.attrs.replace(INLINE_TRAIT, () => '') + a.rest;
  return decl;
}

// The labels of the timed tests set from their times, in place; a test the pass did not time keeps its label,
// and a class label is written only when every test of the class was timed slow. `classes` maps a class's
// short name to its timed methods, each true when slow.
function retagDotnetSource(source, classes) {
  const lines = String(source).split('\n');
  const missing = [];
  for (const [className, timed] of classes) {
    if (classIndex(lines, className) < 0) {
      if ([...timed.values()].some(Boolean)) missing.push(className);
      continue;
    }
    // A class label needs the class's membership read whole from its source: every timed method among the
    // declared test methods, and every declared one timed slow. A class label over members that cannot all be
    // read stays, so none of them loses it.
    const { names: declared, complete } = testMethodsOf(lines, className);
    const inherited = labelAbove(lines, classIndex(lines, className));
    if (inherited && !complete) continue;
    const members = [...new Set([...declared, ...timed.keys()])];
    const wholeClass = complete && declared.length > 0 && [...timed.keys()].every((m) => declared.includes(m))
      && declared.every((m) => timed.has(m)) && [...timed.values()].every(Boolean);
    if (!wholeClass && inherited) removeLabelAbove(lines, classIndex(lines, className));
    for (const method of members) {
      const at = methodIndex(lines, className, method);
      if (at < 0) {
        if (timed.get(method) || (!timed.has(method) && inherited)) missing.push(`${className}.${method}`);
        continue;
      }
      const slow = wholeClass ? false : timed.has(method) ? timed.get(method) : (inherited || labelAbove(lines, at));
      if (slow) insertAttribute(lines, at);
      else removeLabelAbove(lines, at);
    }
    if (wholeClass) insertAttribute(lines, classIndex(lines, className));
  }
  return { text: lines.join('\n'), missing };
}

function untagDotnetSource(source) {
  return String(source).split('\n').filter((l) => !TRAIT_LINE.test(l)).join('\n');
}

// The 1-based line of a test method's declaration, 0 when it is not found.
function dotnetMethodLine(source, className, method) {
  return methodIndex(String(source).split('\n'), className, method) + 1;
}

// The 1-based line of the first attribute above a test method (its declaration when it has none) — where
// a reason comment goes; 0 when the method is not found.
function dotnetReasonLine(source, className, method) {
  const lines = String(source).split('\n');
  let top = methodIndex(lines, className, method);
  if (top < 0) return 0;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  return top + 1;
}

// One test method labelled slow or not, from its own time: the method's own Trait is added or removed; a
// class-level Trait is never touched.
function labelDotnetMethod(source, className, method, slow) {
  const lines = String(source).split('\n');
  const at = methodIndex(lines, className, method);
  if (at < 0) return { text: String(source), found: false };
  if (slow) insertAttribute(lines, at);
  else removeLabelAbove(lines, at);
  return { text: lines.join('\n'), found: true };
}

// ── command shape ────────────────────────────────────────────────────────────────────────────────────

const VALUE = () => true;
const oneOf = (...allowed) => (v) => allowed.includes(v);
const VERBOSITY = oneOf('q', 'quiet', 'm', 'minimal', 'n', 'normal', 'd', 'detailed', 'diag', 'diagnostic');
const TEST_OPTIONS = new Map([
  ['--filter', VALUE], ['--no-build', null], ['--no-restore', null], ['-c', VALUE], ['--configuration', VALUE],
  ['--logger', (v) => /^(?:console|trx|html)(?:;[\w.]+=[\w.]+)*$/i.test(v)], ['-v', VERBOSITY], ['--verbosity', VERBOSITY],
  ['--blame-hang-timeout', (v) => /^\d+(?:ms|s|m|h)?$/.test(v)], ['--blame-hang-dump-type', oneOf('none', 'mini', 'full')],
  ['--results-directory', VALUE],
]);
const BUILD_OPTIONS = new Map([
  ['-c', VALUE], ['--configuration', VALUE], ['-f', VALUE], ['--framework', VALUE], ['-v', VERBOSITY], ['--verbosity', VERBOSITY],
  ['--no-restore', null], ['--nologo', null],
]);
// MSBuild reads a `/` word as a switch and an `@` word as a response file of further arguments.
const PROJECT_PATH = (a) => !/^[-/@]/.test(a);

// ── build reuse ──────────────────────────────────────────────────────────────────────────────────────

// Options that leave the build output as it is, with whether each takes a value. Every other option is
// read as part of the output's identity, so an option this list does not know makes a key of its own.
const NOT_OUTPUT = new Map([
  ['--filter', true], ['--logger', true], ['-l', true], ['--results-directory', true], ['--blame-hang-timeout', true],
  ['--blame-hang-dump-type', true], ['-v', true], ['--verbosity', true], ['--blame', false], ['--no-restore', false],
  ['--nologo', false], ['--no-build', false],
]);
const SAME_OPTION = { '--configuration': '-c', '--framework': '-f', '--runtime': '-r', '--arch': '-a', '--property': '-p', '/p': '-p', '-property': '-p' };

function words(command) {
  return [...String(command).matchAll(/"([^"]*)"|(\S+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
}

// The project a `dotnet test` command runs and every option that changes what it builds, in one string.
function buildKey(command) {
  const all = words(command);
  const at = all.findIndex((w, i) => /(^|[\\/])dotnet(\.exe)?$/i.test(w) && all[i + 1] === 'test');
  const args = at < 0 ? all : all.slice(at + 2);
  let target = '';
  const parts = [];
  for (let i = 0; i < args.length; i++) {
    const w = args[i];
    if (w === '--') {
      parts.push(args.slice(i).join(' '));
      break;
    }
    const [name, inline] = w.split(/[:=](.*)/s);
    if (NOT_OUTPUT.has(name)) {
      if (NOT_OUTPUT.get(name) && inline === undefined) i++;
      continue;
    }
    if (/^[-/]/.test(w)) {
      const value = inline !== undefined ? inline : (args[i + 1] !== undefined && !/^-/.test(args[i + 1]) ? args[++i] : '');
      parts.push(`${SAME_OPTION[name] || name}=${value}`);
      continue;
    }
    if (!target) target = w.replace(/\\/g, '/');
    else parts.push(w);
  }
  return [target, ...parts.sort()].join(' ');
}

function noBuild(command) {
  if (/(^|\s)--no-build(\s|$)/.test(command)) return command;
  const m = String(command).match(/dotnet(\.exe)?"?\s+test(?=\s|$)/i);
  if (!m) return command;
  const at = m.index + m[0].length;
  return `${command.slice(0, at)} --no-build${command.slice(at)}`;
}

function create(h) {
  const slashes = (p) => String(p).replace(/\\/g, '/');
  const stopFlags = (seconds) => `--blame-hang-timeout ${seconds}s --blame-hang-dump-type none`;
  const shape = {
    test: (args) => args[0] === 'test' && h.argsListed(TEST_OPTIONS, args.slice(1), PROJECT_PATH, 1),
    setup: (args) => (args[0] === 'restore' || args[0] === 'build') && h.argsListed(BUILD_OPTIONS, args.slice(1), PROJECT_PATH, 1),
  };

  // Bounded by cwd: a .csproj above the tree belongs to some other checkout.
  function nearestTestProject(absFile, cwd) {
    const top = path.resolve(cwd);
    let dir = path.dirname(absFile);
    while (dir === top || dir.startsWith(top + path.sep)) {
      let projects = [];
      try { projects = fs.readdirSync(dir).filter((n) => n.endsWith('.csproj')).sort(); } catch { /* unreadable */ }
      if (projects.length > 0) {
        const proj = path.join(dir, projects[0]);
        let text = '';
        try { text = fs.readFileSync(proj, 'utf8'); } catch { /* unreadable */ }
        return TEST_PROJECT.test(text) ? proj : null;
      }
      if (dir === top || path.dirname(dir) === dir) break;
      dir = path.dirname(dir);
    }
    return null;
  }

  const disjunction = (classes) => classes.map((c) => `FullyQualifiedName~${c}`).join('|');

  // A filter that would take the command past the budget is dropped, keeping only the exclusion `clause`:
  // the whole project runs, which is slower and never wrong.
  function filtered(head, classes, clause, note) {
    let expr = disjunction(classes);
    if (clause) expr = `${classes.length > 1 ? `(${expr})` : expr}&${clause}`;
    const command = `${head} --filter "${expr}"`;
    if (command.length <= COMMAND_BUDGET) return command;
    if (note) note(`${head}: its class filter makes a ${command.length}-character command, over the ${COMMAND_BUDGET}-character budget — running the whole project`);
    return clause ? `${head} --filter "${clause}"` : head;
  }

  const wrapped = (e) => {
    if (!e.startsWith('(') || !e.endsWith(')')) return false;
    let depth = 0;
    for (let i = 0; i < e.length; i++) {
      if (e[i] === '(') depth++;
      else if (e[i] === ')' && --depth === 0) return i === e.length - 1;
    }
    return false;
  };
  function topLevelParts(e) {
    const parts = [];
    let depth = 0;
    let from = 0;
    for (let i = 0; i < e.length; i++) {
      if (e[i] === '(') depth++;
      else if (e[i] === ')') depth--;
      else if (e[i] === '&' && depth === 0) {
        parts.push(e.slice(from, i));
        from = i + 1;
      }
    }
    return [...parts, e.slice(from)];
  }
  // A filter as its `&` parts, parentheses opened wherever no `|` stands between them.
  function conjuncts(expr) {
    let e = expr.trim();
    while (wrapped(e)) e = e.slice(1, -1).trim();
    if (h.hasTopLevelOr(e)) return [{ group: e }];
    const parts = topLevelParts(e);
    return parts.length === 1 ? [{ atom: e }] : parts.flatMap(conjuncts);
  }
  const NEGATIVE = /^[^=!~&|()]+(!=|!~)/;
  const isSlowClause = (atom) => atom.replace(/\s+/g, '') === SLOW_CLAUSE;

  const selects = (part) => ({ why: `its filter selects tests (${part}), so what it leaves out cannot be told` });

  // One invocation's exclusion, from its arguments after `dotnet`: the negative parts of its filter, or why
  // they cannot be told apart.
  function callExclusion(args) {
    let expr = null;
    for (let i = 1; i < args.length; i++) {
      const eq = args[i].indexOf('=');
      if ((eq < 0 ? args[i] : args[i].slice(0, eq)) === '--filter') expr = eq < 0 ? args[i + 1] : args[i].slice(eq + 1);
    }
    if (expr === null) return { clause: '' };
    const kept = [];
    for (const part of conjuncts(expr)) {
      if (part.group) {
        if (/!=|!~/.test(part.group)) return { why: `its filter leaves tests out inside a | expression, so what it excludes cannot be told: ${part.group}` };
        return selects(part.group);
      }
      if (isSlowClause(part.atom)) continue;
      if (!NEGATIVE.test(part.atom)) return selects(part.atom.trim());
      kept.push(part.atom.trim());
    }
    return { clause: kept.join('&') };
  }

  function exclusionOf(command) {
    if (/(^|\s)(--settings|-s)(\s|=|$)|TestCaseFilter/i.test(command)) return { unknown: true, why: `its settings may filter tests of their own: ${String(command).trim()}` };
    const read = h.invocationsOf(command, 'vstest', shape);
    if (read.why) return { unknown: true, why: read.why };
    const found = read.calls.map(callExclusion);
    const blocked = found.find((f) => f.why);
    if (blocked) return { unknown: true, why: blocked.why };
    const clauses = new Set(found.map((f) => f.clause.split('&').filter(Boolean).sort().join('&')));
    if (clauses.size > 1) return { unknown: true, why: 'its dotnet test runs leave out different tests' };
    return found[0].clause ? { known: true, clause: found[0].clause } : { none: true };
  }

  // `strict` refuses what a changed-files restriction drops: a named-files run names only test files, while a
  // diff over a test root also lists the code under test.
  function classesByProject(files, cwd, strict) {
    const byProject = new Map();
    for (const f of files) {
      const abs = path.resolve(cwd, f);
      const proj = String(f).endsWith('.cs') ? nearestTestProject(abs, cwd) : null;
      if (!proj) {
        if (strict) throw new Error(`filesCommand: ${f} is not a .cs file under a test project`);
        continue;
      }
      let classes = [];
      try { classes = h.parseClasses(fs.readFileSync(abs, 'utf8')); } catch { /* unreadable → no classes */ }
      if (classes.length === 0) {
        if (strict) throw new Error(`filesCommand: ${f} declares no class to filter on`);
        continue;
      }
      const rel = path.relative(cwd, proj).replace(/\\/g, '/');
      if (!byProject.has(rel)) byProject.set(rel, []);
      const names = byProject.get(rel);
      for (const c of classes) if (!names.includes(c)) names.push(c);
    }
    return byProject;
  }

  function joinExclusion(segment) {
    if (ALREADY_EXCLUDED.test(h.fold(segment))) return segment;
    const filter = segment.match(FILTER);
    if (filter) {
      const expr = filter[2] ?? filter[3] ?? filter[4];
      const joined = `${h.hasTopLevelOr(expr) ? `(${expr})` : expr}&${SLOW_CLAUSE}`;
      return segment.slice(0, filter.index) + `--filter${filter[1]}"${joined}"` + segment.slice(filter.index + filter[0].length);
    }
    const clause = ` --filter "${SLOW_CLAUSE}"`;
    const runsettings = segment.match(/\s--(\s|$)/);
    if (runsettings) return segment.slice(0, runsettings.index) + clause + segment.slice(runsettings.index);
    const body = segment.replace(/\s+$/, '');
    return body + clause + segment.slice(body.length);
  }

  function readProjects(repo, listing) {
    return listing.map(slashes).filter((f) => f.endsWith('.csproj')).map((file) => {
      let text = '';
      try { text = fs.readFileSync(path.join(repo, file), 'utf8'); } catch { /* removed: no references, not a test project */ }
      const dir = path.posix.dirname(file);
      const refs = [...text.matchAll(/<ProjectReference\s+Include\s*=\s*"([^"]+)"/gi)]
        .map((m) => path.posix.normalize(path.posix.join(dir, slashes(m[1]))));
      const assembly = (text.match(/<AssemblyName>\s*([^<\s]+)\s*<\/AssemblyName>/i) || [])[1];
      return { file, dir, refs, test: TEST_PROJECT.test(text), assembly: assembly || path.posix.basename(file, '.csproj') };
    });
  }

  function ownerOf(f, projects) {
    if (f.endsWith('.csproj')) return projects.find((p) => p.file === f) || null;
    let best = null;
    for (const p of projects) {
      const inside = p.dir === '.' || f.startsWith(`${p.dir}/`);
      if (inside && (!best || p.dir.length > best.dir.length)) best = p;
    }
    return best;
  }

  // The one filter every `dotnet test` run of the declared unit carries ('' for none), or null when two
  // runs differ — then no tied project can be told which filter is its own.
  function unitFilter(unit) {
    const filters = new Set();
    for (const segment of h.splitChain(unit)) {
      if (h.inferRunner(segment) !== 'vstest') continue;
      const m = segment.match(FILTER);
      filters.add(m ? (m[2] ?? m[3] ?? m[4]) : '');
    }
    if (filters.size > 1) return null;
    return filters.size ? [...filters][0] : '';
  }

  // A tied run is never wider than the step close it stands in for: it keeps the unit's filter and,
  // where slow tests are declared, their exclusion. `stopSeconds` adds the hang stop.
  function tiedCommand(project, filter, slow, stopSeconds) {
    const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
    const head = `dotnet test "${project}"${stop}${filter ? ` --filter "${filter}"` : ''}`;
    return slow ? joinExclusion(head) : head;
  }

  // Every test project that reaches `start` through any chain of project references, itself included.
  function testsReaching(start, projects) {
    const seen = new Set([start.file]);
    const queue = [start];
    const hits = [];
    while (queue.length) {
      const p = queue.shift();
      if (p.test) hits.push(p);
      for (const q of projects) {
        if (!seen.has(q.file) && q.refs.includes(p.file)) {
          seen.add(q.file);
          queue.push(q);
        }
      }
    }
    return hits;
  }

  function tiedSet({ repo, changed, listing, unit = '', slow = null, stopSeconds = 0 }) {
    const projects = readProjects(repo, listing);
    const targets = new Set();
    const untied = [];
    for (const f of changed) {
      let hits;
      if (READ_BY_EVERY_PROJECT.has(path.posix.basename(slashes(f)).toLowerCase())) hits = projects.filter((p) => p.test);
      else {
        const owner = ownerOf(f, projects);
        hits = owner ? testsReaching(owner, projects) : [];
      }
      if (hits.length === 0) untied.push(f);
      for (const p of hits) targets.add(p.file);
    }
    const sorted = [...targets].sort();
    if (untied.length) return { targets: sorted, untied, commands: [] };
    if (sorted.length === 0) return { targets: sorted, untied, commands: [], fallback: 'no changed file ties to a test project' };
    const filter = unitFilter(typeof unit === 'string' ? unit : '');
    if (filter === null) {
      return { targets: sorted, untied, commands: [], fallback: "the declared unit's dotnet test runs carry different filters, so a tied project's own cannot be told" };
    }
    return { targets: sorted, untied, commands: sorted.map((p) => tiedCommand(p, filter, Boolean(slow), stopSeconds)) };
  }

  // The source file declaring the class `short` in the test project above `codeBase` (the test assembly's
  // path), or null. `cache` keeps one class index per project across calls.
  function classFile(tree, codeBase, short, cache = new Map()) {
    const project = h.projectDir(path.dirname(codeBase), tree, (n) => n.endsWith('.csproj'));
    if (!project) return null;
    if (!cache.has(project)) {
      const index = new Map();
      for (const f of h.sourceFiles(project, '.cs')) {
        for (const c of h.parseClasses(fs.readFileSync(f, 'utf8'))) if (!index.has(c)) index.set(c, f);
      }
      cache.set(project, index);
    }
    return cache.get(project).get(short) || null;
  }

  // A .NET method is labelled by its name, never its line, so the attribute and comment lines the edits add
  // move nothing still to come. A method is slow when every timed case of it is at or over the line.
  function labelSource({ file, source, tests, threshold, wanted, out }) {
    let text = source;
    const methods = new Map();
    for (const t of tests.filter((x) => x.class && x.method)) {
      const key = `${t.class}.${t.method}`;
      if (!methods.has(key)) methods.set(key, { cls: t.class, method: t.method, lines: new Set(), slow: true, ms: 0 });
      const m = methods.get(key);
      m.lines.add(t.line);
      m.slow = m.slow && t.ms >= threshold;
      m.ms = Math.max(m.ms, t.ms);
    }
    for (const { cls, method, lines, slow, ms } of methods.values()) {
      const edit = labelDotnetMethod(text, cls, method, slow);
      if (!edit.found) { out(`label-tests: ${file} ${cls}.${method} — its declaration was not found, so no label was written\n`); continue; }
      text = edit.text;
      const asked = wanted.find((w) => w.file === file && lines.has(w.line));
      const at = dotnetReasonLine(text, cls, method);
      if (!slow) {
        text = h.clearReason(text, at).text;
        if (asked) { asked.done = true; out(`label-tests: ${file}:${asked.line} ran under the slow line (${Math.round(ms)} ms) — no reason written\n`); }
      } else if (asked) {
        text = h.setReason(text, at, asked.reason || 'kept slow').text;
        asked.done = true;
      }
    }
    return { text, slow: [...methods.values()].some((m) => m.slow) };
  }

  // The timing pass's labels: a class whose every test is slow gets the class-level Trait, otherwise each
  // slow method its own; the labels of the timed tests are set from their times, and a test the pass did not
  // time keeps its label.
  function retagEdits({ tree, keys, tagged, meta, log }) {
    const isTagged = new Set(tagged);
    const allIn = (list) => list.length > 0 && list.every((k) => isTagged.has(k));
    const byClass = new Map();
    for (const key of keys) {
      const { className } = meta[key];
      if (!byClass.has(className)) byClass.set(className, []);
      byClass.get(className).push(key);
    }
    const indexes = new Map();
    const byFile = new Map();
    for (const [className, classKeys] of byClass) {
      const timed = new Map([...new Set(classKeys.map((k) => meta[k].method))]
        .map((method) => [method, allIn(classKeys.filter((k) => meta[k].method === method))]));
      const short = className.split('.').pop();
      const file = classFile(tree, meta[classKeys[0]].codeBase, short, indexes);
      if (!file) {
        if ([...timed.values()].some(Boolean)) log(`could not find class ${className} under its test project — tag it by hand`);
        continue;
      }
      if (!byFile.has(file)) byFile.set(file, new Map());
      byFile.get(file).set(short, timed);
    }
    return [...byFile].map(([file, classes]) => ({ file, edit: (text) => retagDotnetSource(text, classes) }));
  }

  return {
    filesCommand({ files, exclude, cwd = process.cwd(), note, stopSeconds }) {
      const list = Array.isArray(files) ? files : [];
      const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
      return [...classesByProject(list, cwd, true)].map(([proj, classes]) =>
        filtered(`dotnet test ${h.quote(proj)}${stop}`, classes, exclude ? SLOW_CLAUSE : '', note));
    },
    // The test projects of the changed .cs files, each with only the classes that live in it.
    deltaTargets({ files, cwd = process.cwd() }) {
      const byProject = classesByProject((Array.isArray(files) ? files : []).map(String), cwd, false);
      return { targets: [...byProject.keys()], classes: Object.fromEntries(byProject) };
    },
    timingCommand({ targets, tmp, classes = {}, note, exclusion = null }) {
      const dir = String(tmp).replace(/\\/g, '/');
      const clause = exclusion || '';
      return (Array.isArray(targets) ? targets : []).map((t) => {
        const head = `dotnet test ${h.quote(t)} --logger trx --results-directory ${h.quote(dir)}`;
        const own = classes[t];
        if (Array.isArray(own) && own.length) return filtered(head, own, clause, note);
        return clause ? `${head} --filter "${clause}"` : head;
      });
    },
    exclusionOf,
    stopFlags,
    joinExclusion,
    joinStop(segment, seconds) {
      if (ALREADY_STOPPED.test(h.fold(segment))) return segment;
      return h.insertAfter(segment, /dotnet\s+test(?=\s|$)/, ` ${stopFlags(seconds)}`);
    },
    tiedSet,
    failedTargets({ output, repo, listing }) {
      const text = String(output || '');
      if (ABORTED.test(text)) return null;
      const assemblies = [...text.matchAll(FAILURE)].map((m) => m[1]);
      if (assemblies.length === 0) return [];
      const projects = readProjects(repo, listing || h.listFiles(repo));
      const found = [];
      for (const name of assemblies) {
        const owners = projects.filter((p) => p.test && p.assembly === name);
        if (owners.length === 0) return null;
        for (const p of owners) if (!found.includes(p.file)) found.push(p.file);
      }
      return found;
    },
    commandShape: shape,
    // A trx file in its own folder per command.
    withReport: (command, dir) => `${command} --logger trx --results-directory "${dir}"`,
    // Each executed test by the file that declares its class and the line of its method. The report folder is
    // removed once read.
    reportTimes({ tree, reportDir }) {
      const dir = path.join(tree, reportDir);
      const times = [];
      const cache = new Map();
      const sources = new Map();
      try {
        for (const trx of h.sourceFiles(dir, '.trx')) {
          for (const e of parseTrx(fs.readFileSync(trx, 'utf8'))) {
            const short = e.className.split('.').pop();
            const abs = e.codeBase ? classFile(tree, e.codeBase, short, cache) : null;
            if (!abs) continue;
            const file = path.relative(tree, abs).split(path.sep).join('/');
            if (!sources.has(file)) sources.set(file, fs.readFileSync(abs, 'utf8'));
            const line = dotnetMethodLine(sources.get(file), short, e.method) || null;
            times.push({ file, line, column: null, test: e.key.slice(e.key.indexOf('::') + 2), class: short, method: e.method, ms: e.ms });
          }
        }
      } catch { /* no report written: nothing was timed */ }
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* left for the next run's sweep */ }
      return times;
    },
    labelSource,
    timingEntries: ({ dir }) => h.sourceFiles(dir, '.trx').flatMap((f) => parseTrx(fs.readFileSync(f, 'utf8'))),
    reportCount: (dir) => h.sourceFiles(dir, '.trx').length,
    buildKey,
    noBuild,
    retagEdits,
    untagSource: untagDotnetSource,
  };
}

module.exports = {
  runners: ['vstest'], contract: 1, create,
  COMMAND_BUDGET, parseTrx, tagDotnetSource, untagDotnetSource, dotnetMethodLine, dotnetReasonLine, labelDotnetMethod,
};
