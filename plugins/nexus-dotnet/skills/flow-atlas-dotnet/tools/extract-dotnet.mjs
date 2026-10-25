#!/usr/bin/env node
// extract-dotnet.mjs — the flow-atlas-dotnet profile's S1 tool. A text scanner over one .NET tree: it never builds,
// never loads an assembly and reads nothing outside the tree it is given.
//
//   node extract-dotnet.mjs --repo {tree} [--include-tests]
//
// Test code — a project named `*Tests` or referencing a test framework, and any `test` or `tests` folder — is left
// out unless --include-tests is given.
//
// JSON on stdout:
//   routePrefix           the endpoint framework's global route prefix where it declares one, else null
//   routePrefixConflict   the prefixes found when the framework declares more than one, else []
//   entries[]             kind, id, route, verb, absolute, file, line (+ class, message, exposed, group, unresolved)
//   registrations[]       contract, implementation or factory, primary token, modifiers, lifetime, hosts, file, line
//   hosts[]               each web host's and executable's composition tree, from its start-up file down
//   directNew[]           each `new {Class}(` outside registration code whose class is registered as an
//                         implementation, or built as a factory's proven arm, in non-test code
//   testCode              { included, files }: whether test code was read, and how many test files the tree holds
//
// What a text scan cannot prove — an unpinned scan's members, an open generic, a factory's class — is reported as
// such, never guessed.
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRS = new Set(['.git', 'bin', 'obj', 'node_modules']);
const VERBS = 'Get|Post|Put|Delete|Patch';
const KIND_ORDER = ['fastendpoints', 'controller', 'minimal-api', 'mcp-tool', 'hosted', 'consumer', 'event-handler', 'mediator-handler', 'executable'];
const OPEN_GENERIC = 'open generic — the closed type is chosen at run time';
const UNPINNED = 'scan membership is found at run time';
const FACTORY_RESULT = 'the service type is the factory\'s result, which the scan cannot read';

const slash = (p) => p.split(sep).join('/');

function walk(root, dir = root, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(root, p, out);
    else if (/\.(cs|csproj)$/.test(entry.name)) out.push(slash(relative(root, p)));
  }
  return out.sort();
}

// ── the lexer ────────────────────────────────────────────────────────────────

// The literal starting at `i` — a char, a string, verbatim, interpolated or raw — as { open, close, end }: its
// contents run from open to close, and the literal ends before `end`. Null when no literal starts there.
function literalAt(s, i) {
  let j = i;
  let dollars = 0;
  let verbatim = false;
  while (s[j] === '$' || s[j] === '@') {
    if (s[j] === '$') dollars++; else verbatim = true;
    j++;
  }
  if (s[j] === "'" && j === i) {
    let k = j + 1 + (s[j + 1] === '\\' ? 2 : 1);
    while (k < s.length && s[k] !== "'" && s[k] !== '\n') k++;
    return { open: j + 1, close: k, end: k + 1 };
  }
  if (s[j] !== '"') return null;
  let quotes = 0;
  while (s[j + quotes] === '"') quotes++;
  if (quotes >= 3 && !verbatim) {
    const at = s.indexOf('"'.repeat(quotes), j + quotes);
    const close = at < 0 ? s.length : at;
    return { open: j + quotes, close, end: Math.min(s.length, close + quotes) };
  }
  let k = j + 1;
  let depth = 0;
  while (k < s.length) {
    const c = s[k];
    if (depth > 0) {
      const inner = literalAt(s, k);
      if (inner) { k = inner.end; continue; }
      if (c === '{') depth++;
      else if (c === '}') depth--;
      k++;
      continue;
    }
    if (dollars && c === '{') {
      if (s[k + 1] === '{') { k += 2; continue; }
      depth++;
      k++;
      continue;
    }
    if (verbatim) {
      if (c === '"') { if (s[k + 1] === '"') { k += 2; continue; } break; }
    } else {
      if (c === '\\') { k += 2; continue; }
      if (c === '"' || c === '\n') break;
    }
    k++;
  }
  return { open: j + 1, close: k, end: k + 1 };
}

// `text` blanks every comment; `code` also blanks every literal's contents. Both keep the file's length and line
// breaks, so an offset found in `code` reads the same place in `text`.
export function lex(raw) {
  const text = raw.split('');
  const code = raw.split('');
  const blank = (arr, from, to) => { for (let k = from; k < to && k < arr.length; k++) if (arr[k] !== '\n') arr[k] = ' '; };
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '/' && raw[i + 1] === '/') {
      const end = raw.indexOf('\n', i) < 0 ? raw.length : raw.indexOf('\n', i);
      blank(text, i, end);
      blank(code, i, end);
      i = end;
      continue;
    }
    if (raw[i] === '/' && raw[i + 1] === '*') {
      const at = raw.indexOf('*/', i + 2);
      const end = at < 0 ? raw.length : at + 2;
      blank(text, i, end);
      blank(code, i, end);
      i = end;
      continue;
    }
    const literal = /[\w]/.test(raw[i - 1] ?? '') ? null : literalAt(raw, i);
    if (literal) {
      blank(code, literal.open, literal.close);
      i = literal.end;
      continue;
    }
    i++;
  }
  return { text: text.join(''), code: code.join('') };
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

const PAIRS = { '(': ')', '{': '}', '<': '>', '[': ']' };

// The index of the bracket that closes the one at `open`, over code whose literals are blanked.
export function closing(code, open) {
  const pair = PAIRS[code[open]];
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === code[open]) depth++;
    else if (code[i] === pair && !(pair === '>' && code[i - 1] === '=') && --depth === 0) return i;
  }
  return -1;
}

// The index of the bracket that opens the one closing at `close`.
function opening(code, close) {
  const open = Object.keys(PAIRS).find((k) => PAIRS[k] === code[close]);
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    if (code[i] === code[close]) depth++;
    else if (code[i] === open && --depth === 0) return i;
  }
  return -1;
}

// The top-level parts of code[from, to) split at commas, each read from text with its offset.
function partsOf(f, from, to) {
  const parts = [];
  let depth = 0;
  let start = from;
  for (let i = from; i < to; i++) {
    const c = f.code[i];
    if ('([{'.includes(c) || (c === '<' && /\w/.test(f.code[i - 1] ?? ''))) depth++;
    else if (')]}'.includes(c) || (c === '>' && f.code[i - 1] !== '=' && depth > 0)) depth--;
    else if (c === ',' && depth === 0) { parts.push(part(f, start, i)); start = i + 1; }
  }
  const last = part(f, start, to);
  if (last.text) parts.push(last);
  return parts;
}
function part(f, from, to) {
  const raw = f.text.slice(from, to);
  const lead = raw.length - raw.trimStart().length;
  return { text: raw.trim(), at: from + lead };
}

const splitTop = (text) => {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const c of text) {
    if ('<([{'.includes(c)) depth++;
    if ('>)]}'.includes(c)) depth--;
    if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
};

// A whole argument that is one plain or verbatim string literal → its value, else null.
const literalValue = (arg) => /^@?"([^"]*)"$/.exec(arg.trim())?.[1] ?? null;

// A test framework, any of its packages (`xunit.extensibility.core`, `MSTest.TestAdapter`), or the .NET test SDK.
const TEST_PACKAGE = /^(?:(?:xunit|nunit|mstest|tunit)(?:\..+)?|nunit3testadapter|microsoft\.net\.test\.sdk)$/i;

function referencesTestFramework(xml) {
  const text = xml.replace(/<!--[\s\S]*?-->/g, '');
  if (/<IsTestProject>\s*true\s*</i.test(text)) return true;
  return [...text.matchAll(/<PackageReference\b([^>]*)>/gi)]
    .some((m) => TEST_PACKAGE.test(/\bInclude\s*=\s*(["'])(.*?)\1/i.exec(m[1])?.[2].trim() ?? ''));
}

// Test code: a project named `*Tests`, a project referencing a test framework, and anything under a `test` or
// `tests` folder. Left out unless `includeTests`; `testCode` says how many files that is.
function loadTree(root, includeTests) {
  const files = walk(root).map((rel) => {
    const raw = readFileSync(join(root, rel), 'utf8').replace(/\r\n/g, '\n');
    const lexed = rel.endsWith('.cs') ? lex(raw) : { text: raw, code: raw };
    return { rel, raw, ...lexed };
  });
  const projects = files.filter((f) => f.rel.endsWith('.csproj')).map((f) => {
    const dir = dirname(f.rel) === '.' ? '' : dirname(f.rel);
    const name = f.rel.split('/').pop().replace(/\.csproj$/, '');
    const refs = [...f.text.matchAll(/ProjectReference\s+Include="([^"]+)"/g)]
      .map((m) => slash(join(dir, m[1].replace(/\\/g, '/'))))
      .map((p) => slash(dirname(p)));
    return {
      file: f.rel, dir, name, test: /Tests$/.test(name) || referencesTestFramework(f.text),
      web: /Sdk="Microsoft\.NET\.Sdk\.Web"/.test(f.text), exe: /<OutputType>\s*Exe\s*<\/OutputType>/i.test(f.text), refs,
    };
  });
  const projectOf = (rel) => projects.filter((p) => !p.dir || rel.startsWith(`${p.dir}/`))
    .sort((a, b) => b.dir.length - a.dir.length)[0] ?? null;
  for (const f of files) f.test = /(^|\/)tests?\//i.test(f.rel) || !!projectOf(f.rel)?.test;
  const cs = files.filter((f) => f.rel.endsWith('.cs') && (includeTests || !f.test));
  return { root, cs, projects, projectOf, testCode: { included: !!includeTests, files: files.filter((f) => f.test).length } };
}

// ── attributes and classes ───────────────────────────────────────────────────

const MODIFIER = /\b(?:public|internal|private|protected|sealed|partial|abstract|static|file|new|unsafe|readonly)$/;

// Every member of the attribute blocks `[…]` in code[from, to): its name (no `Attribute` suffix), its arguments
// and its offset.
function attributeMembers(f, from, to) {
  const members = [];
  for (let i = from; i < to; i++) {
    if (f.code[i] !== '[') continue;
    const close = closing(f.code, i);
    if (close < 0) break;
    for (const p of partsOf(f, i + 1, close)) {
      const m = /^(?:\w+\s*:\s*)?((?:\w+\.)*\w+)\s*(\()?/.exec(p.text);
      if (!m) continue;
      const name = m[1].split('.').pop().replace(/Attribute$/, '');
      const paren = m[2] ? p.at + p.text.indexOf('(') : -1;
      members.push({ name, at: p.at, args: paren >= 0 ? partsOf(f, paren + 1, closing(f.code, paren)) : [] });
    }
    i = close;
  }
  return members;
}

// The start of the attribute blocks and modifiers written before the declaration at `at`.
function attributeStart(code, at) {
  let k = at;
  for (;;) {
    let kk = k;
    while (kk > 0 && /\s/.test(code[kk - 1])) kk--;
    const mod = MODIFIER.exec(code.slice(Math.max(0, kk - 12), kk));
    if (mod) { k = kk - mod[0].length; continue; }
    if (code[kk - 1] === ']') {
      const open = opening(code, kk - 1);
      if (open < 0) break;
      k = open;
      continue;
    }
    return k;
  }
  return k;
}

function baseNames(header) {
  const h = header.replace(/\bwhere\b[\s\S]*$/, '');
  let depth = 0;
  for (let i = 0; i < h.length; i++) {
    const c = h[i];
    if ('(<'.includes(c)) depth++;
    else if (')>'.includes(c)) depth--;
    else if (c === ':' && depth === 0) {
      return splitTop(h.slice(i + 1)).map((b) => /^[\w.]+/.exec(b)?.[0].split('.').pop()).filter(Boolean);
    }
  }
  return [];
}

// Every class or record: its name, its attribute members, its bases, its header up to the body, and its body.
function classes(tree) {
  const out = [];
  for (const f of tree.cs) {
    for (const m of f.code.matchAll(/\b(?:class|record(?:\s+class)?)\s+(\w+)/g)) {
      if (m[1] === 'struct' || m[1] === 'where') continue;
      const open = f.code.indexOf('{', m.index);
      const semi = f.code.indexOf(';', m.index);
      if (open < 0 || (semi >= 0 && semi < open)) continue;
      const attrStart = attributeStart(f.code, m.index);
      const header = f.code.slice(m.index, open);
      out.push({
        name: m[1], file: f, at: m.index, line: lineAt(f.text, m.index), attrStart, members: attributeMembers(f, attrStart, m.index),
        header, bases: baseNames(header.slice(m[0].length)), bodyStart: open, bodyEnd: closing(f.code, open),
      });
    }
  }
  return out;
}

const trimRoute = (route) => route.replace(/^~?\/+/, '');
const joinRoute = (...parts) => parts.map((p) => p.replace(/^~?\/+|\/+$/g, '')).filter(Boolean).join('/');

function constantsOf(tree, all) {
  const out = [];
  for (const f of tree.cs) {
    for (const m of f.code.matchAll(/\bconst\s+string\s+(\w+)\s*=\s*/g)) {
      const end = f.code.indexOf(';', m.index);
      const value = literalValue(f.text.slice(m.index + m[0].length, end));
      if (value === null) continue;
      const owner = all.filter((c) => c.file === f && c.bodyStart < m.index && m.index < c.bodyEnd).sort((a, b) => b.bodyStart - a.bodyStart)[0];
      out.push({ cls: owner?.name ?? null, name: m[1], value, file: f.rel });
    }
  }
  return out;
}

// A route argument: a literal, or a constant named by its class (`Routes.Search`) or found in the using class `cls`,
// the same file or in one class only. Several values left → null, never a guess.
function routeArg(consts, f, arg, cls = null) {
  const literal = literalValue(arg);
  if (literal !== null) return literal;
  if (!/^[\w.]+$/.test(arg.trim())) return null;
  const parts = arg.trim().split('.');
  const name = parts.pop();
  const owner = parts.pop() ?? null;
  let found = consts.filter((c) => c.name === name && (!owner || c.cls === owner));
  if (!owner && found.some((c) => c.file === f.rel)) found = found.filter((c) => c.file === f.rel);
  if (!owner && cls && found.some((c) => c.cls === cls)) found = found.filter((c) => c.cls === cls);
  const values = [...new Set(found.map((c) => c.value))];
  return values.length === 1 ? values[0] : null;
}

// ── entries ──────────────────────────────────────────────────────────────────

const verbOf = (member) => new RegExp(`^Http(${VERBS})$`).exec(member.name)?.[1].toUpperCase() ?? null;

// The attribute runs written on the members of a class body: consecutive `[…]` blocks at the body's own depth.
function memberAttributeRuns(f, c) {
  const runs = [];
  let depth = 0;
  let lastEnd = -1;
  for (let i = c.bodyStart + 1; i < c.bodyEnd; i++) {
    const ch = f.code[i];
    if (ch === '{' || ch === '(') { depth++; continue; }
    if (ch === '}' || ch === ')') { depth--; continue; }
    if (ch !== '[' || depth !== 0) continue;
    let p = i - 1;
    while (p > c.bodyStart && /\s/.test(f.code[p])) p--;
    if (!'{};]'.includes(f.code[p])) continue;
    const close = closing(f.code, i);
    if (close < 0) break;
    const members = attributeMembers(f, i, close + 1);
    if (p === lastEnd && runs.length) runs[runs.length - 1].push(...members);
    else runs.push(members);
    lastEnd = close;
    i = close;
  }
  return runs;
}

function controllerChain(c, byName, seen = new Set([c])) {
  if (c.bases.some((b) => b === 'ControllerBase' || b === 'Controller')) return [c];
  for (const b of c.bases) {
    for (const base of byName.get(b) ?? []) {
      if (seen.has(base)) continue;
      seen.add(base);
      const chain = controllerChain(base, byName, seen);
      if (chain) return [c, ...chain];
    }
  }
  return null;
}

// The receiver chain of code[from, to): its first identifier and the arguments of every MapGroup call along it.
function chainOf(f, from, to) {
  const head = /^\s*(\w+)/.exec(f.code.slice(from, to));
  if (!head) return null;
  const groups = [];
  let k = from + head[0].length;
  for (;;) {
    const call = /^\s*\.\s*(\w+)\s*(?:<[^<>()]*>)?\s*\(/.exec(f.code.slice(k, to));
    if (!call) break;
    const paren = k + call[0].length - 1;
    const close = closing(f.code, paren);
    if (close < 0 || close >= to) break;
    if (call[1] === 'MapGroup') groups.push(partsOf(f, paren + 1, close)[0]?.text ?? '');
    k = close + 1;
  }
  return { ident: head[1], groups };
}

// The route prefix a receiver variable carries, from its MapGroup assignments in the same file. A variable typed
// RouteGroupBuilder and never assigned here is a group built elsewhere: unresolved.
function groupPrefix(f, consts, ident, before, seen = new Set()) {
  if (seen.has(ident)) return { prefix: [] };
  seen.add(ident);
  const inScope = (a) => {
    const open = enclosingBlock(f.code, a.index);
    return open < 0 || closing(f.code, open) > before;
  };
  const assigns = [...f.code.slice(0, before).matchAll(new RegExp(`\\b${ident}\\s*=(?![=>])`, 'g'))].filter(inScope);
  const assign = assigns.pop();
  if (!assign) {
    if (new RegExp(`\\bRouteGroupBuilder\\s+${ident}\\b`).test(f.code)) return { unresolved: `${ident} is a route group built elsewhere` };
    return { prefix: [] };
  }
  const start = assign.index + assign[0].length;
  const chain = chainOf(f, start, statementEnd(f.code, start));
  if (!chain) return { prefix: [] };
  const outer = groupPrefix(f, consts, chain.ident, assign.index, seen);
  if (outer.unresolved) return outer;
  const own = chain.groups.map((g) => routeArg(consts, f, g));
  if (own.some((g) => g === null)) return { unresolved: `a MapGroup route on ${ident} is not resolved` };
  return { prefix: [...outer.prefix, ...own] };
}

// The `{` of the innermost block holding `index`, or -1 at file level.
function enclosingBlock(code, index) {
  let depth = 0;
  for (let k = index - 1; k >= 0; k--) {
    if (code[k] === '}') depth++;
    else if (code[k] === '{' && depth-- === 0) return k;
  }
  return -1;
}

// The start of the statement holding `index`: back over balanced brackets to the last `;`, `{`, `}` or `=`.
function statementStart(code, index) {
  let k = index - 1;
  while (k >= 0) {
    const c = code[k];
    if (c === ')' || c === ']') { k = opening(code, k) - 1; continue; }
    if (';{}'.includes(c) || (c === '=' && code[k + 1] !== '>' && code[k + 1] !== '=' && !'=!<>'.includes(code[k - 1]))) break;
    k--;
  }
  return k + 1;
}

function entriesOf(tree, all, consts, regs) {
  const entries = [];
  const add = (e) => entries.push({ route: null, verb: null, absolute: null, ...e });
  const byName = new Map();
  for (const c of all) byName.set(c.name, [...(byName.get(c.name) ?? []), c]);

  for (const c of all) {
    const f = c.file;
    const chain = controllerChain(c, byName);
    if (!chain) {
      for (const member of c.members) {
        const verb = verbOf(member);
        const raw = verb && member.args[0] ? routeArg(consts, f, member.args[0].text) : null;
        if (raw === null) continue;
        const route = trimRoute(raw);
        add({ kind: 'fastendpoints', id: `${verb} ${route}`, route, verb, absolute: false, file: f.rel, line: lineAt(f.text, member.at), class: c.name });
      }
    }
    const configure = /override\s+void\s+Configure\s*\(\s*\)\s*\{/.exec(f.code.slice(c.bodyStart, c.bodyEnd));
    if (configure) {
      const open = c.bodyStart + configure.index + configure[0].length - 1;
      const end = closing(f.code, open);
      const prefixCall = /\bRoutePrefixOverride\s*\(/.exec(f.code.slice(open, end));
      const override = prefixCall ? partsOf(f, open + prefixCall.index + prefixCall[0].length, closing(f.code, open + prefixCall.index + prefixCall[0].length - 1))[0]?.text : null;
      for (const r of f.code.slice(open, end).matchAll(new RegExp(`\\b(${VERBS})\\s*\\(`, 'g'))) {
        const paren = open + r.index + r[0].length - 1;
        const raw = routeArg(consts, f, partsOf(f, paren + 1, closing(f.code, paren))[0]?.text ?? '');
        if (raw === null) continue;
        const verb = r[1].toUpperCase();
        let route = trimRoute(raw);
        const prefix = override && override !== 'string.Empty' ? literalValue(override) : null;
        if (prefix) route = `${trimRoute(prefix)}/${route}`;
        add({ kind: 'fastendpoints', id: `${verb} ${route}`, route, verb, absolute: !!override, file: f.rel, line: lineAt(f.text, open + r.index), class: c.name });
      }
    }
    if (chain) {
      const classRoute = chain.map((x) => x.members.find((m) => m.name === 'Route')).find(Boolean);
      const holder = classRoute && chain.find((x) => x.members.includes(classRoute));
      const baseRaw = classRoute?.args[0] ? routeArg(consts, holder.file, classRoute.args[0].text, holder.name) : '';
      const base = baseRaw === null ? null : trimRoute(baseRaw).replace('[controller]', c.name.replace(/Controller$/, '').toLowerCase());
      for (const run of memberAttributeRuns(f, c)) {
        const routeMember = run.find((m) => m.name === 'Route');
        for (const member of run.filter(verbOf)) {
          const verb = verbOf(member);
          const arg = member.args[0] ?? routeMember?.args[0] ?? null;
          const own = arg ? routeArg(consts, f, arg.text, c.name) : '';
          const line = lineAt(f.text, member.at);
          const missing = own === null ? arg.text : base === null && !/^~?\//.test(own) ? classRoute.args[0].text : null;
          if (missing !== null) {
            add({ kind: 'controller', id: `${verb} ${missing}`, verb, file: f.rel, line, class: c.name, unresolved: `route constant ${missing} is not resolved` });
            continue;
          }
          const route = /^~?\//.test(own) ? trimRoute(own) : joinRoute(base, own);
          add({ kind: 'controller', id: `${verb} ${route || '/'}`, route, verb, absolute: true, file: f.rel, line, class: c.name });
        }
      }
    }
    const message = (re) => re.exec(c.header)?.[1];
    if (message(/IConsumer<(\w+)>/)) add({ kind: 'consumer', id: c.name, file: f.rel, line: c.line, class: c.name, message: message(/IConsumer<(\w+)>/) });
    const event = message(/(?:INotificationHandler|IEventHandler)<(\w+)>/);
    if (event) add({ kind: 'event-handler', id: c.name, file: f.rel, line: c.line, class: c.name, message: event });
    const request = message(/IRequestHandler<(\w+)/);
    if (request) add({ kind: 'mediator-handler', id: c.name, file: f.rel, line: c.line, class: c.name, message: request });
  }

  for (const f of tree.cs) {
    for (const m of f.code.matchAll(new RegExp(`\\.\\s*Map(${VERBS})\\s*\\(`, 'g'))) {
      const paren = m.index + m[0].length - 1;
      const arg = partsOf(f, paren + 1, closing(f.code, paren))[0]?.text ?? '';
      const verb = m[1].toUpperCase();
      const line = lineAt(f.text, m.index);
      const raw = routeArg(consts, f, arg);
      if (raw === null) {
        add({ kind: 'minimal-api', id: `${verb} ${arg}`, verb, file: f.rel, line, unresolved: `route constant ${arg} is not resolved` });
        continue;
      }
      const chain = chainOf(f, statementStart(f.code, m.index), m.index);
      const group = chain ? groupPrefix(f, consts, chain.ident, m.index) : { prefix: [] };
      const own = chain?.groups.map((g) => routeArg(consts, f, g)) ?? [];
      const unresolved = group.unresolved ?? (own.some((g) => g === null) ? 'a MapGroup route is not resolved' : null);
      const route = unresolved ? trimRoute(raw) : joinRoute(...group.prefix, ...own, raw);
      const e = { kind: 'minimal-api', id: `${verb} ${route || '/'}`, route, verb, absolute: unresolved ? null : true, file: f.rel, line };
      if (unresolved) e.group = `unresolved — ${unresolved}`;
      add(e);
    }
  }

  const listed = new Set(tree.cs.flatMap((f) => [...f.code.matchAll(/WithTools<([^>]+)>/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()))));
  const attributed = all.filter((c) => c.members.some((m) => m.name === 'McpServerToolType'));
  for (const name of new Set([...listed, ...attributed.map((c) => c.name)])) {
    const c = all.find((x) => x.name === name);
    add({ kind: 'mcp-tool', id: name, file: c ? c.file.rel : null, line: c ? lineAt(c.file.text, c.attrStart) : null, class: name, exposed: listed.has(name) });
  }

  const hosted = regs.filter((r) => r.primary === 'reg:hosted');
  for (const name of new Set(hosted.map((r) => r.implementation).filter(Boolean))) {
    const c = all.find((x) => x.name === name);
    add({ kind: 'hosted', id: name, file: c ? c.file.rel : null, line: c ? c.line : null, class: name });
  }
  for (const r of hosted.filter((x) => !x.implementation)) {
    add({ kind: 'hosted', id: null, file: r.file, line: r.line, class: null, unresolved: 'the factory builds no class the scan can name' });
  }

  for (const p of tree.projects.filter((x) => x.exe && !x.web)) {
    const program = tree.cs.find((f) => f.rel === (p.dir ? `${p.dir}/Program.cs` : 'Program.cs'))
      ?? tree.cs.find((f) => tree.projectOf(f.rel) === p && /static\s+(?:async\s+)?\S+\s+Main\s*\(/.test(f.code));
    if (program) add({ kind: 'executable', id: p.name, file: program.rel, line: 1 });
  }

  const rank = (e) => KIND_ORDER.indexOf(e.kind);
  return entries.sort((a, b) => rank(a) - rank(b) || String(a.file).localeCompare(String(b.file)) || (a.line ?? 0) - (b.line ?? 0));
}

// ── methods: the extension methods a composition tree is made of ─────────────

// Every static extension method (`this {Type} x`), with its body; a host's start-up file is one more body.
function methodDefs(tree) {
  const defs = [];
  for (const f of tree.cs) {
    for (const m of f.code.matchAll(/static\s+[\w<>[\],.?\s]+?\s+(\w+)\s*\(\s*this\s+[\w<>.]+\s+\w+/g)) {
      const paren = f.code.indexOf('(', m.index + m[0].indexOf(m[1]));
      const after = closing(f.code, paren);
      const arrow = /^\s*=>/.exec(f.code.slice(after + 1));
      const start = arrow ? after + 1 : f.code.indexOf('{', after);
      const end = arrow ? f.code.indexOf(';', start) : closing(f.code, start);
      defs.push({ name: m[1], file: f, line: lineAt(f.text, m.index), start, end, project: tree.projectOf(f.rel), hosts: new Set() });
    }
  }
  return defs;
}

const within = (def, file, index) => def.file === file && index > def.start && index < def.end;

// A call resolves to the definition in the caller's own project, then in a project it references, then to the
// only definition of that name; several left → unresolved, never a guess.
function resolveCall(defs, tree, name, callerFile) {
  const candidates = defs.filter((d) => d.name === name);
  if (candidates.length <= 1) return { def: candidates[0] ?? null, ambiguous: [] };
  const project = tree.projectOf(callerFile.rel);
  const own = candidates.filter((d) => d.project === project);
  if (own.length === 1) return { def: own[0], ambiguous: [] };
  const referenced = candidates.filter((d) => d.project && project?.refs.includes(d.project.dir));
  if (referenced.length === 1) return { def: referenced[0], ambiguous: [] };
  return { def: null, ambiguous: candidates.map((d) => d.file.rel) };
}

// The index of the last character of the statement starting at `from`: a block, an if with its else chain, or one
// statement to its `;`.
function statementEnd(code, from) {
  const at = from + /^\s*/.exec(code.slice(from))[0].length;
  if (code[at] === '{') return closing(code, at);
  if (/^if\s*\(/.test(code.slice(at, at + 4))) {
    const close = closing(code, code.indexOf('(', at));
    const end = statementEnd(code, close + 1);
    const rest = /^\s*else\b/.exec(code.slice(end + 1));
    return rest ? statementEnd(code, end + 1 + rest[0].length) : end;
  }
  let depth = 0;
  for (let k = at; k < code.length; k++) {
    if ('([{'.includes(code[k])) depth++;
    else if (')]}'.includes(code[k])) { if (--depth < 0) return k - 1; } else if (code[k] === ';' && depth === 0) return k;
  }
  return code.length - 1;
}

// Every if and else arm of a file: its span and the condition under which it runs.
function branchesOf(f) {
  if (f.branches) return f.branches;
  f.branches = [];
  for (const m of f.code.matchAll(/\bif\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = closing(f.code, open);
    if (close < 0) continue;
    const cond = f.text.slice(open + 1, close).trim().replace(/\s+/g, ' ');
    const id = `${f.rel}:${open}`;
    const thenEnd = statementEnd(f.code, close + 1);
    f.branches.push({ id, arm: 'then', start: close, end: thenEnd, cond, loose: looserThanAnd(f.code.slice(open + 1, close)), at: m.index });
    const rest = /^\s*else\b/.exec(f.code.slice(thenEnd + 1));
    if (rest) {
      const start = thenEnd + 1 + rest[0].length;
      f.branches.push({ id, arm: 'else', start, end: statementEnd(f.code, start), cond: `!(${cond})`, loose: false, at: m.index });
    }
  }
  return f.branches;
}

// The arms around `index` whose `if` lies within [from, to), outermost first, and their conditions joined.
function conditionAt(f, index, from = 0, to = f.code.length) {
  const arms = branchesOf(f).filter((b) => b.at >= from && b.at < to && index > b.start && index <= b.end).sort((a, b) => a.start - b.start);
  const cond = (b) => (arms.length > 1 && b.loose ? `(${b.cond})` : b.cond);
  return { text: arms.length ? arms.map(cond).join(' && ') : null, path: arms.map((b) => [b.id, b.arm]) };
}

// Whether a condition holds, outside brackets, an operator that binds looser than `&&` (`||`, `??`, `?:`).
function looserThanAnd(code) {
  let depth = 0;
  for (let k = 0; k < code.length; k++) {
    const c = code[k];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (depth === 0 && ((c === '|' && code[k + 1] === '|') || (c === '?' && !'.['.includes(code[k + 1])))) return true;
  }
  return false;
}

// ── registrations ────────────────────────────────────────────────────────────

const typeofList = (text) => [...text.matchAll(/typeof\((\w+)\)|AssemblyOf<(\w+)>/g)].map((m) => m[1] ?? m[2]);

// What a registration lambda does: forward to another registration, or build per call from a selector.
function lambdaShape(args) {
  const arrow = args.indexOf('=>');
  if (arrow < 0) return null;
  const body = args.slice(arrow + 2).trim().replace(/\s+/g, ' ');
  const forward = /^\w+\.GetRequired(Keyed)?Service<(\w+)>\(\s*(?:"([^"]*)")?\s*\)$/.exec(body);
  if (forward) return { kind: 'forward', target: forward[2], key: forward[3] ?? null };
  const selector = /^(.+?)\s+switch\b/.exec(body)?.[1] ?? /^([^?]+?)\s*\?/.exec(body)?.[1] ?? null;
  const built = [...body.matchAll(/(?<!\bthrow\s+)\bnew\s+(\w+)\s*\(|\bCreateInstance<(\w+)>/g)].map((m) => m[1] ?? m[2]);
  return { kind: 'factory', selector: selector?.trim() ?? null, arms: [...new Set(built)].sort() };
}

function callAt(f, nameEnd) {
  let at = nameEnd;
  let generics = '';
  if (f.code[at] === '<') {
    const close = closing(f.code, at);
    generics = f.text.slice(at + 1, close);
    at = close + 1;
  }
  if (f.code[at] !== '(') return null;
  const close = closing(f.code, at);
  return { generics: splitTop(generics), args: f.text.slice(at + 1, close), list: partsOf(f, at + 1, close), end: close };
}

const typeArg = (arg) => /^typeof\(\s*([\w.]+(?:<[^()]*>)?)\s*\)$/.exec(arg.trim())?.[1] ?? null;

// Every class, record, interface and struct of the tree, by name, with the base lists of its declarations.
function typeGraph(tree) {
  const graph = new Map();
  for (const f of tree.cs) {
    for (const m of f.code.matchAll(/\b(?:class|record(?:\s+(?:class|struct))?|interface|struct)\s+(\w+)/g)) {
      const ends = [f.code.indexOf('{', m.index), f.code.indexOf(';', m.index)].filter((k) => k >= 0);
      if (!ends.length) continue;
      graph.set(m[1], [...(graph.get(m[1]) ?? []), baseNames(f.code.slice(m.index + m[0].length, Math.min(...ends)))]);
    }
  }
  return graph;
}

// The service type of a lambda registration that declares none: the class its body builds or resolves, when the
// body is that one call; else null.
function resultType(lambda) {
  const body = lambda.slice(lambda.indexOf('=>') + 2).trim();
  const m = /^(?:new\s+(\w+)|\w+\.GetRequired(?:Keyed)?Service<(\w+)>)\s*\(/.exec(body);
  return m && closing(body, m[0].length - 1) === body.length - 1 ? m[1] ?? m[2] : null;
}

// A factory's arms: each class it builds that is the contract or derives from it through the types of the tree.
// One the tree proves is not — a helper object, a library type built for a contract the tree declares — is dropped;
// one it can neither prove nor refute is kept as unproven.
function armsOf(graph, candidates, contract) {
  if (!contract) return { arms: [], unproven: candidates };
  const target = contract.replace(/<.*$/, '').split('.').pop();
  const verdict = (name, seen) => {
    if (name === target) return 'arm';
    if (seen.has(name)) return 'not';
    seen.add(name);
    if (!graph.has(name)) return 'unknown';
    let result = 'not';
    for (const b of graph.get(name).flat()) {
      const v = verdict(b, seen);
      if (v === 'arm') return v;
      if (v === 'unknown') result = v;
    }
    return result;
  };
  const declared = graph.has(target);
  const arms = [];
  const unproven = [];
  for (const c of candidates) {
    const v = verdict(c, new Set());
    if (v === 'arm') arms.push(c);
    else if (v === 'unknown' && !declared) unproven.push(c);
  }
  return { arms, unproven };
}

function registrationsOf(tree, defs) {
  const graph = typeGraph(tree);
  const regs = [];
  const spans = [];
  for (const f of tree.cs) {
    const scans = [];
    for (const m of f.code.matchAll(/\.(TryAddEnumerable|AddHostedService|Decorate|Scan|AddDbContext|(?:TryAdd|Add)(Keyed)?(Scoped|Singleton|Transient)|\w*FromAssembl\w*|AddConsumers)\b/g)) {
      const call = callAt(f, m.index + m[0].length);
      if (!call) continue;
      if (scans.some((s) => m.index > s.start && m.index < s.end)) continue;
      const base = { file: f.rel, line: lineAt(f.text, m.index), modifiers: [], implementation: null, lifetime: null, sourceFile: f, index: m.index };
      spans.push({ file: f.rel, start: m.index, end: call.end });
      const shape = lambdaShape(call.args);
      const name = m[1];
      if (name === 'Scan') {
        const list = typeofList(call.args);
        scans.push({ start: m.index, end: call.end });
        const lifetime = /With(Scoped|Singleton|Transient)Lifetime/.exec(call.args)?.[1] ?? null;
        const r = { ...base, contract: 'Scan', primary: `reg:scan ${list.length ? list.join(', ') : 'unpinned'}`, lifetime, scan: { call: 'Scan', pinned: list.length > 0, list } };
        if (!list.length) r.unproven = UNPINNED;
        regs.push(r);
      } else if (/FromAssembl|AddConsumers/.test(name)) {
        const list = [...typeofList(call.args), ...call.generics.map((g) => /^\w+/.exec(g)?.[0]).filter(Boolean)];
        const r = { ...base, contract: name, primary: `reg:scan ${list.length ? list.join(', ') : 'unpinned'}`, scan: { call: name, pinned: list.length > 0, list } };
        if (!list.length) r.unproven = UNPINNED;
        regs.push(r);
      } else if (name === 'AddHostedService') {
        const r = { ...base, contract: 'IHostedService', primary: 'reg:hosted', lifetime: 'Singleton', implementation: call.generics[0] ?? null };
        if (shape) {
          r.modifiers.push('+factory');
          if (shape.kind === 'forward') {
            r.implementation = shape.target;
            if (shape.key) r.modifiers.push(`+keyed ${shape.key}`);
          } else if (shape.arms.length === 1) r.implementation = shape.arms[0];
        }
        regs.push(r);
      } else if (name === 'TryAddEnumerable') {
        const d = /ServiceDescriptor\.(Scoped|Singleton|Transient)<([^>]+)>/.exec(call.args);
        if (!d) continue;
        const [contract, impl] = splitTop(d[2]);
        regs.push({ ...base, contract, implementation: impl, lifetime: d[1], primary: contract === 'IHostedService' ? 'reg:hosted' : 'reg:direct' });
      } else if (name === 'Decorate') {
        const [contract, impl] = call.generics;
        const order = regs.filter((r) => r.contract === contract && r.primary.startsWith('reg:decorator')).length + 1;
        regs.push({ ...base, contract, implementation: impl, primary: `reg:decorator ${order}` });
      } else if (name === 'AddDbContext') {
        regs.push({ ...base, contract: call.generics[0], implementation: call.generics[0], primary: 'reg:direct', lifetime: 'Scoped' });
      } else {
        const keyed = !!m[2];
        const lifetime = m[3];
        let [contract, impl] = call.generics;
        let unproven = null;
        const value = call.list[keyed ? 1 : 0];
        if (!contract) {
          const types = call.list.map((a) => typeArg(a.text));
          if (types[0]) {
            [contract, impl] = [types[0], types[1] ?? types[0]];
            if ([contract, impl].some((t) => /<\s*,*\s*>/.test(t))) unproven = OPEN_GENERIC;
          } else if (shape && value) contract = resultType(f.code.slice(value.at, value.at + value.text.length));
        }
        const instance = /^new\s+(\w+)\s*\(/.exec(value?.text ?? '')?.[1];
        const r = { ...base, contract: contract ?? (shape ? null : call.args.trim().split('.')[0]), implementation: impl ?? instance ?? contract ?? call.args.trim(), lifetime };
        if (unproven) r.unproven = unproven;
        if (keyed) {
          r.primary = `reg:keyed ${literalValue(call.list[0]?.text ?? '') ?? '?'}`;
          if (shape?.kind === 'factory') {
            r.implementation = null;
            r.modifiers.push('+factory');
            r.factory = { selector: shape.selector, arms: shape.arms };
          }
        } else if (shape?.kind === 'forward') {
          r.implementation = shape.target;
          r.primary = 'reg:forwarded';
          if (shape.key) r.modifiers.push(`+keyed ${shape.key}`);
        } else if (shape?.kind === 'factory') {
          r.implementation = null;
          r.primary = `reg:factory ${shape.selector ?? 'unread'}`;
          r.factory = { selector: shape.selector, arms: shape.arms };
        } else {
          r.primary = 'reg:direct';
        }
        regs.push(r);
      }
    }
  }
  for (const r of regs) {
    const def = defs.find((d) => within(d, r.sourceFile, r.index));
    r.method = def?.name ?? null;
    r.def = def ?? null;
    r.condition = conditionAt(r.sourceFile, r.index, def?.start ?? 0, def?.end ?? r.sourceFile.code.length);
    if (r.factory) {
      const { arms, unproven } = armsOf(graph, r.factory.arms, r.contract);
      r.factory.arms = arms;
      if (unproven.length) r.factory.unproven = unproven;
      if (!r.contract) r.unproven = FACTORY_RESULT;
      else if (unproven.length) r.unproven = `factory arm not proven to be ${r.contract}: ${unproven.join(', ')}`;
    }
  }
  // Two registrations in opposite arms of one `if` never run together, so they are no collection.
  const exclusive = (a, b) => a.condition.path.some(([id, arm]) => b.condition.path.some(([id2, arm2]) => id === id2 && arm !== arm2));
  const directs = regs.filter((x) => x.primary === 'reg:direct');
  const enumerable = new Set(directs.filter((r) => directs.some((s) => s !== r && s.contract === r.contract && !exclusive(r, s))));
  for (const r of regs) {
    if (enumerable.has(r)) r.primary = 'reg:enumerable';
    const condition = r.condition.text;
    if (condition) {
      if (r.primary === 'reg:direct') r.primary = `reg:conditional ${condition}`;
      else r.modifiers.push(`+conditional ${condition}`);
    }
  }
  return { regs, spans };
}

// ── hosts ────────────────────────────────────────────────────────────────────

function hostsOf(tree, defs) {
  const hosts = [];
  for (const p of tree.projects.filter((x) => x.web || x.exe)) {
    const program = tree.cs.find((f) => f.rel === (p.dir ? `${p.dir}/Program.cs` : 'Program.cs'));
    if (!program) continue;
    const reached = new Set();
    const node = (file, from, to, stack) => {
      const children = [];
      for (const m of file.code.slice(from, to).matchAll(/\.(\w+)\s*(?:<[^>()]*>)?\s*\(/g)) {
        const index = from + m.index;
        if (!defs.some((d) => d.name === m[1])) continue;
        const { def, ambiguous } = resolveCall(defs, tree, m[1], file);
        const condition = conditionAt(file, index, from, to).text;
        if (!def) { children.push({ method: m[1], file: null, line: lineAt(file.text, index), condition, ambiguous, children: [] }); continue; }
        if (stack.includes(def)) continue;
        reached.add(def);
        children.push({ method: def.name, file: def.file.rel, line: def.line, condition, children: node(def.file, def.start, def.end, [...stack, def]).children });
      }
      return { children };
    };
    const root = { method: 'Program', file: program.rel, line: 1, condition: null, ...node(program, 0, program.code.length, []) };
    for (const def of reached) def.hosts.add(p.name);
    hosts.push({ host: p.name, kind: p.web ? 'web' : 'executable', project: p.file, tree: root, programFile: program });
  }
  return hosts;
}

// ── route prefix ─────────────────────────────────────────────────────────────

// The endpoint framework's prefix: a `RoutePrefix =` inside a UseFastEndpoints(…) call, or on its `Endpoints`
// options. Any other RoutePrefix (a Swagger UI's) is not the endpoints'.
function routePrefixes(tree) {
  const found = new Set();
  for (const f of tree.cs) {
    const spans = [...f.code.matchAll(/\bUseFastEndpoints\s*\(/g)].map((m) => {
      const open = m.index + m[0].length - 1;
      return [open, closing(f.code, open)];
    });
    for (const m of f.code.matchAll(/\bRoutePrefix\s*=(?![=>])/g)) {
      const onEndpoints = /\.\s*Endpoints\s*\.\s*$/.test(f.code.slice(Math.max(0, m.index - 20), m.index));
      if (!onEndpoints && !spans.some(([a, b]) => m.index > a && m.index < b)) continue;
      const value = /^\s*@?"([^"]*)"/.exec(f.text.slice(m.index + m[0].length))?.[1];
      if (value !== undefined) found.add(trimRoute(value));
    }
  }
  return [...found].sort();
}

// ── direct new ───────────────────────────────────────────────────────────────

function directNewOf(tree, regs, spans) {
  const contractOf = new Map();
  for (const r of regs.filter((x) => !x.sourceFile.test)) {
    for (const cls of [r.implementation, ...(r.factory?.arms ?? [])]) {
      if (cls && cls !== r.contract && !contractOf.has(cls)) contractOf.set(cls, r.contract);
    }
  }
  const out = [];
  for (const f of tree.cs) {
    for (const m of f.code.matchAll(/\bnew\s+(\w+)\s*\(/g)) {
      if (!contractOf.has(m[1])) continue;
      if (spans.some((s) => s.file === f.rel && m.index > s.start && m.index < s.end)) continue;
      out.push({ file: f.rel, line: lineAt(f.text, m.index), class: m[1], contract: contractOf.get(m[1]) });
    }
  }
  return out;
}

export function extract(rootArg, { includeTests = false } = {}) {
  const root = resolve(rootArg);
  if (!existsSync(root)) throw new Error(`no such tree: ${root}`);
  const tree = loadTree(root, includeTests);
  const all = classes(tree);
  const consts = constantsOf(tree, all);
  const defs = methodDefs(tree);
  const { regs, spans } = registrationsOf(tree, defs);
  const hosts = hostsOf(tree, defs);
  const hostsOfReg = (r) => {
    if (r.def) return [...r.def.hosts].sort();
    return hosts.filter((h) => h.programFile === r.sourceFile).map((h) => h.host);
  };
  const registrations = regs.map(({ sourceFile, index, def, condition, ...r }) => ({ ...r, hosts: hostsOfReg({ sourceFile, def }) }));
  const prefixes = routePrefixes(tree);
  return {
    routePrefix: prefixes.length === 1 ? prefixes[0] : null,
    routePrefixConflict: prefixes.length > 1 ? prefixes : [],
    entries: entriesOf(tree, all, consts, regs),
    registrations,
    hosts: hosts.map(({ programFile, ...h }) => h),
    directNew: directNewOf(tree, regs, spans),
    testCode: tree.testCode,
  };
}

// Both sides canonical, so a run through a link or junction is still a direct run.
const sameFile = (a, b) => { try { return realpathSync(a) === realpathSync(b); } catch { return false; } };
if (process.argv[1] && sameFile(fileURLToPath(import.meta.url), process.argv[1])) {
  const at = process.argv.indexOf('--repo');
  const root = at >= 0 ? process.argv[at + 1] : '.';
  try {
    process.stdout.write(`${JSON.stringify(extract(root, { includeTests: process.argv.includes('--include-tests') }), null, 2)}\n`);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exitCode = 2;
  }
}
