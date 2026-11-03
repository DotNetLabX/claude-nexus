#!/usr/bin/env node
// extract-vue.mjs — the flow-atlas-vue profile's S1 tool. A text scanner over one Vue client tree, and the join of its
// server calls to a server's entry points.
//
//   node extract-vue.mjs --repo {tree} [--include-tests]                        routes, views, stores, calls
//   node extract-vue.mjs join --repo {tree} --server {json} [--include-tests]   matches and unresolved, against extract-dotnet's output
//
// Test code — `*.spec.*`, `*.test.*` and anything under `__tests__/` — is left out unless --include-tests is given;
// `testCode` says whether it was read and how many test files the tree holds.
//
// The join rule: a literal call is read directly; a wrapper (a module-level function or arrow function, exported or
// not, whose first parameter is the path and whose body passes it to fetch as the URL) is followed one level, in its
// own file or through the file's imports of an exported declaration or export list, its route and
// verb taken from each call site, the verb defaulting to the wrapper's own or its fetch options'; a verb that is given but not a literal
// leaves the call unresolved; a query string is dropped; a route held in a named constant is resolved in the calling
// file or through its imports; the server's global route prefix is applied to every server route not marked absolute.
// Both sides are then normalised the same way — a client `${…}`, a server `{name}` or `{name:constraint}`, and a
// `:name` segment all become `{}`, compared without case. A call that matches no entry, or more than one, is
// unresolved — never a guessed link. Comments and the inside of strings are never read as calls.
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join as joinPath, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build']);
const EXTENSIONS = ['', '.ts', '.js', '.mts', '.mjs', '.vue', '/index.ts', '/index.js'];
const slash = (p) => p.split(sep).join('/');
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

function walk(root, dir = root, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = joinPath(dir, entry.name);
    if (entry.isDirectory()) walk(root, p, out);
    else if (/\.(ts|js|vue|mts|mjs)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(slash(relative(root, p)));
  }
  return out.sort();
}

const isTest = (rel) => /\.(?:spec|test)\.[^/]+$/.test(rel) || /(^|\/)__tests__\//.test(rel);

export function normalise(route) {
  const path = route.replace(/\$\{[^}]*\}/g, '{}').split(/[?#]/)[0].replace(/^~?\/+|\/+$/g, '').toLowerCase();
  return path.split('/').map((segment) => (segment.startsWith(':') ? '{}' : segment.replace(/\{[^}]*\}/g, '{}'))).join('/');
}

// The index of the bracket closing the one at `open`, skipping string and template literals.
function closing(text, open) {
  const pair = { '(': ')', '{': '}' }[text[open]];
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      else if (quote === '`' && c === '$' && text[i + 1] === '{') i = closing(text, i + 1);
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === text[open]) depth++;
    else if (c === pair && --depth === 0) return i;
  }
  return -1;
}

// The top-level arguments of a call whose `(` is at `open`.
function args(text, open) {
  const end = closing(text, open);
  const out = [];
  let start = open + 1;
  let depth = 0;
  let quote = null;
  for (let i = open + 1; i < end; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      else if (quote === '`' && c === '$' && text[i + 1] === '{') i = closing(text, i + 1);
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { out.push(text.slice(start, i).trim()); start = i + 1; }
  }
  const last = text.slice(start, end).trim();
  if (last) out.push(last);
  return out;
}

// `text` blanks comments; `code` also blanks the inside of every string and the literal text of every template, its
// `${…}` expressions kept as code. Both keep the file's length and line breaks. In a .vue file only the <script>
// blocks are read.
function lexJs(raw) {
  const text = raw.split('');
  const code = raw.split('');
  const blank = (arr, from, to) => { for (let k = from; k < to && k < arr.length; k++) if (arr[k] !== '\n') arr[k] = ' '; };
  // Code from `from`; inside an interpolation it stops at the `}` that closes it, and returns that index.
  const scan = (from, inner) => {
    let i = from;
    let depth = 0;
    while (i < raw.length) {
      const c = raw[i];
      if (c === '/' && (raw[i + 1] === '/' || raw[i + 1] === '*')) {
        const close = raw[i + 1] === '/' ? raw.indexOf('\n', i) : raw.indexOf('*/', i + 2);
        const end = close < 0 ? raw.length : raw[i + 1] === '/' ? close : close + 2;
        blank(text, i, end);
        blank(code, i, end);
        i = end;
        continue;
      }
      if (c === '"' || c === "'") {
        let k = i + 1;
        while (k < raw.length && raw[k] !== c && raw[k] !== '\n') k += raw[k] === '\\' ? 2 : 1;
        blank(code, i + 1, k);
        i = k + 1;
        continue;
      }
      if (c === '`') { i = template(i); continue; }
      if (inner && c === '{') depth++;
      else if (inner && c === '}' && depth-- === 0) return i;
      i++;
    }
    return i;
  };
  const template = (start) => {
    let k = start + 1;
    let from = k;
    while (k < raw.length && raw[k] !== '`') {
      if (raw[k] === '\\') { k += 2; continue; }
      if (raw[k] === '$' && raw[k + 1] === '{') {
        blank(code, from, k);
        k = scan(k + 2, true) + 1;
        from = k;
        continue;
      }
      k++;
    }
    blank(code, from, k);
    return k + 1;
  };
  scan(0, false);
  return { text: text.join(''), code: code.join('') };
}

function scriptOnly(raw) {
  const keep = new Array(raw.length).fill(false);
  for (const m of raw.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const start = m.index + m[0].indexOf('>') + 1;
    for (let k = start; k < start + m[1].length; k++) keep[k] = true;
  }
  return raw.split('').map((c, k) => (keep[k] || c === '\n' ? c : ' ')).join('');
}

function load(rels, root) {
  return rels.map((rel) => {
    const raw = readFileSync(joinPath(root, rel), 'utf8').replace(/\r\n/g, '\n');
    return { rel, raw, ...lexJs(rel.endsWith('.vue') ? scriptOnly(raw) : raw) };
  });
}

// ── modules: imports, constants, wrappers ────────────────────────────────────

// A relative import resolves against the importing file; an aliased one (`@/api/x`) to the one file whose path ends
// with what follows the alias. Anything else — a package, or several candidates — resolves to nothing.
function resolveModule(byRel, fromRel, spec) {
  if (spec.startsWith('.')) {
    const base = posix.normalize(posix.join(posix.dirname(fromRel), spec));
    for (const ext of EXTENSIONS) if (byRel.has(base + ext)) return byRel.get(base + ext);
    return null;
  }
  const tail = /^[@~]\//.exec(spec) ? spec.slice(2) : null;
  if (!tail) return null;
  const found = [...byRel.values()].filter((f) => EXTENSIONS.some((ext) => f.rel === tail + ext || f.rel.endsWith(`/${tail}${ext}`)));
  return found.length === 1 ? found[0] : null;
}

function importsOf(f) {
  const named = new Map();
  const namespaces = new Map();
  for (const m of f.text.matchAll(/\bimport\s+(type\s+)?([^;'"]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const clause = m[2];
    const ns = /\*\s+as\s+(\w+)/.exec(clause);
    if (ns) namespaces.set(ns[1], m[3]);
    const braces = /\{([^}]*)\}/.exec(clause);
    for (const item of braces ? braces[1].split(',') : []) {
      const parts = /^\s*(?:type\s+)?(\w+)(?:\s+as\s+(\w+))?\s*$/.exec(item);
      if (parts) named.set(parts[2] ?? parts[1], { name: parts[1], spec: m[3] });
    }
  }
  return { named, namespaces };
}

// The value a binding of `name` at `at` holds: a `const` with a plain literal → that string; any other binding → null.
function bindingValue(f, at, name) {
  if (!/\bconst\s+$/.test(f.code.slice(0, at))) return null;
  return /^\s*=\s*(['"`])([^'"`$\n]*)\1/.exec(f.text.slice(at + name.length))?.[2] ?? null;
}

// The value `name` holds at `index`: the innermost binding around it decides — a parameter or a declaration in an
// enclosing block, then the module's own declarations, then `imported`. Several bindings in one scope, or a binding
// that is not a const literal → null.
function constantAt(f, name, index, imported) {
  const found = [];
  for (const m of f.code.matchAll(new RegExp(`(?<![.\\w$])${escapeRe(name)}(?![\\w$])`, 'g'))) {
    const scope = bindingScope(f.code, m.index, name.length);
    if (scope && index > scope[0] && index < scope[1]) found.push({ start: scope[0], value: bindingValue(f, m.index, name) });
    else if (!scope && enclosingBlock(f.code, m.index) < 0 && /\b(?:const|let|var|function|class)\s+$/.test(f.code.slice(0, m.index))) {
      found.push({ start: -1, value: bindingValue(f, m.index, name) });
    }
  }
  if (!found.length) return imported ?? null;
  const inner = Math.max(...found.map((b) => b.start));
  const values = new Set(found.filter((b) => b.start === inner).map((b) => b.value));
  return values.size === 1 ? [...values][0] : null;
}

// The module-level const literals of a file, for its importers.
function constantsIn(f) {
  const out = new Map();
  for (const m of f.code.matchAll(/\bconst\s+(\w+)\s*=/g)) {
    if (enclosingBlock(f.code, m.index) < 0) out.set(m[1], constantAt(f, m[1], f.code.length, null));
  }
  return out;
}

// A wrapper: a module-level function or arrow function, exported or not, whose first parameter is the path and whose
// body calls fetch with that parameter as its URL — its delegates. Only a delegate is the wrapper's own fetch; any
// other request in its body is a call. Without a verb parameter, the delegates' options give the verb.
function wrappersIn(f) {
  const out = new Map();
  const add = (name, exported, start, open, bodyStart, bodyEnd) => {
    const params = args(f.text, open);
    const path = /^(\w+)/.exec(params[0] ?? '')?.[1];
    const delegates = [...f.code.slice(bodyStart, bodyEnd).matchAll(/(?<![.\w$])fetch\s*\(/g)]
      .map((m) => ({ index: bodyStart + m.index, args: args(f.text, bodyStart + m.index + m[0].length - 1) }))
      .filter((d) => d.args[0] === path);
    if (!delegates.length) return;
    const verbAt = params.findIndex((p) => /^(?:verb|method)\b/.test(p));
    let verb;
    if (verbAt >= 0) {
      const fallback = /=\s*['"](\w+)['"]/.exec(params[verbAt])?.[1];
      verb = /=(?![=>])/.test(params[verbAt]) && !fallback ? null : (fallback ?? 'GET').toUpperCase();
    } else {
      const verbs = new Set(delegates.map((d) => fetchVerb(d.args[1])));
      verb = verbs.size === 1 ? [...verbs][0] : null;
    }
    out.set(name, { name, exported, verbAt, verb, head: [start, open], delegates: new Set(delegates.map((d) => d.index)) });
  };
  const moduleLevel = (m) => enclosingBlock(f.code, m.index) < 0;
  for (const m of f.code.matchAll(/\b(export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(/g)) {
    if (!moduleLevel(m)) continue;
    const open = m.index + m[0].length - 1;
    const bodyOpen = f.code.indexOf('{', closing(f.text, open));
    add(m[2], !!m[1], m.index, open, bodyOpen, closing(f.text, bodyOpen));
  }
  for (const m of f.code.matchAll(/\b(export\s+)?const\s+(\w+)\s*(?::[^=]*)?=\s*(?:async\s+)?(?:<[^>()]*>\s*)?\(/g)) {
    if (!moduleLevel(m)) continue;
    const open = m.index + m[0].length - 1;
    const close = closing(f.text, open);
    const arrow = /^\s*(?::[^=]*?)?=>\s*/.exec(f.code.slice(close + 1));
    if (close < 0 || !arrow) continue;
    const bodyStart = close + 1 + arrow[0].length;
    let bodyEnd = bodyStart;
    if (f.code[bodyStart] === '{') bodyEnd = closing(f.text, bodyStart);
    else {
      let depth = 0;
      for (; bodyEnd < f.code.length; bodyEnd++) {
        const c = f.code[bodyEnd];
        if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) { if (--depth < 0) break; } else if ((c === '\n' || c === ';' || c === ',') && depth === 0) break;
      }
    }
    add(m[2], !!m[1], m.index, open, bodyStart, bodyEnd);
  }
  return out;
}

// The names a file exports its wrappers under: an exported declaration, or a local export list, aliases included.
function exportedWrappers(f, wrappers) {
  const out = new Map([...wrappers.values()].filter((w) => w.exported).map((w) => [w.name, w]));
  for (const m of f.code.matchAll(/\bexport\s*\{([^}]*)\}(?!\s*from\b)/g)) {
    for (const item of m[1].split(',')) {
      const parts = /^\s*(\w+)(?:\s+as\s+(\w+))?\s*$/.exec(item);
      if (parts && wrappers.has(parts[1])) out.set(parts[2] ?? parts[1], wrappers.get(parts[1]));
    }
  }
  return out;
}

function resolveRoute(arg, consts) {
  const literal = /^(['"])(.*)\1$/.exec(arg);
  if (literal) return literal[2];
  const template = /^`([\s\S]*)`$/.exec(arg);
  if (template) return template[1].replace(/\$\{\s*(\w+)\s*\}/g, (whole, name) => consts.get(name) ?? whole);
  if (/^\w+$/.test(arg)) return consts.get(arg) ?? null;
  return null;
}

function memberAt(text, index) {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  const prop = /^\s*(\w+)\s*:/.exec(text.slice(lineStart, index))?.[1];
  const owner = [...text.slice(0, index).matchAll(/\bconst\s+(\w+)\s*=\s*\{/g)].pop()?.[1];
  return prop && owner ? `${owner}.${prop}` : null;
}

// A fetch call's verb: no options → GET; an options object → the last property that can set the method decides — a
// `method` literal gives its verb, a non-literal `method`, a shorthand, a spread or a computed key gives null; GET
// only when no property can set it. Options that are not an object literal → null.
function fetchVerb(options) {
  if (options === undefined) return 'GET';
  if (!options.startsWith('{')) return null;
  let verb = 'GET';
  for (const prop of args(options, 0)) {
    const method = /^method\s*:\s*([\s\S]+)$/.exec(prop);
    if (method) verb = /^['"](\w+)['"]$/.exec(method[1].trim())?.[1].toUpperCase() ?? null;
    else if (/^(?:\.\.\.|\[|method\s*$)/.test(prop)) verb = null;
  }
  return verb;
}

const escapeRe = (s) => s.replace(/[$]/g, '\\$');

// The `{` of the innermost block holding `index`, or -1 at module level.
function enclosingBlock(code, index) {
  let depth = 0;
  for (let k = index - 1; k >= 0; k--) {
    if (code[k] === '}') depth++;
    else if (code[k] === '{' && depth-- === 0) return k;
  }
  return -1;
}

// The end of an arrow function's body starting at `start`: its block, or its expression.
function bodyEnd(code, start) {
  if (code[start] === '{') return closing(code, start);
  let depth = 0;
  let k = start;
  for (; k < code.length; k++) {
    const c = code[k];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (--depth < 0) break; } else if ((c === '\n' || c === ';' || c === ',') && depth === 0) break;
  }
  return k;
}

const CONTROL = /\b(?:if|for|while|switch|catch|with|return|typeof|await)\s*$/;

// The span a name binds at `at` — a parameter of a function, or a declaration inside a block — or null where the
// name is used there, or declared at module level.
function bindingScope(code, at, length) {
  const before = code.slice(0, at);
  const after = code.slice(at + length);
  if (/\b(?:const|let|var|function|class)\s+$/.test(before)) {
    const open = enclosingBlock(code, at);
    return open < 0 ? null : [open, closing(code, open)];
  }
  const single = /^\s*=>\s*/.exec(after);
  if (single && !/[.\w$)]\s*$/.test(before.replace(/\s+$/, '').slice(-1))) {
    const start = at + length + single[0].length;
    return [at, bodyEnd(code, start)];
  }
  if (!/(?:\(|,|\.\.\.)\s*$/.test(before) || !/^\s*\??\s*[,)=:]/.test(after) || /^\s*=[=>]/.test(after)) return null;
  let depth = 0;
  let open = -1;
  for (let k = at - 1; k >= 0; k--) {
    if (code[k] === ')') depth++;
    else if (code[k] === '(' && depth-- === 0) { open = k; break; }
  }
  if (open < 0) return null;
  const close = closing(code, open);
  const tail = /^\s*(?::[^={;]*?)?\s*(=>|\{)\s*/.exec(code.slice(close + 1));
  if (!tail) return null;
  if (tail[1] === '{' && CONTROL.test(code.slice(0, open))) return null;
  const start = close + 1 + tail[0].length - (tail[1] === '{' ? tail[0].length - tail[0].indexOf('{') : 0);
  return [open, bodyEnd(code, start)];
}

// Whether `name` is rebound around `index`, so a call there is not the module-level binding.
function shadowed(f, name, index) {
  for (const m of f.code.matchAll(new RegExp(`(?<![.\\w$])${escapeRe(name)}(?![\\w$])`, 'g'))) {
    const scope = bindingScope(f.code, m.index, name.length);
    if (scope && index > scope[0] && index < scope[1]) return true;
  }
  return false;
}

function callsOf(files) {
  const byRel = new Map(files.map((f) => [f.rel, f]));
  const defined = new Map(files.map((f) => [f.rel, wrappersIn(f)]));
  const exported = new Map(files.map((f) => [f.rel, exportedWrappers(f, defined.get(f.rel))]));
  const constants = new Map(files.map((f) => [f.rel, constantsIn(f)]));
  const calls = [];
  for (const f of files) {
    const local = new Map(defined.get(f.rel));
    const imported = new Map();
    const { named, namespaces } = importsOf(f);
    for (const [localName, { name, spec }] of named) {
      const mod = resolveModule(byRel, f.rel, spec);
      if (!mod) continue;
      const wrapper = exported.get(mod.rel).get(name);
      if (wrapper) local.set(localName, wrapper);
      const value = constants.get(mod.rel).get(name);
      if (value !== undefined) imported.set(localName, value);
    }
    const ns = new Map();
    for (const [localName, spec] of namespaces) {
      const mod = resolveModule(byRel, f.rel, spec);
      if (mod) ns.set(localName, exported.get(mod.rel));
    }
    const own = [...defined.get(f.rel).values()];
    const found = [];
    const direct = ['(?:window\\.|globalThis\\.)?fetch', ...[...local.keys()].map(escapeRe)];
    for (const m of f.code.matchAll(new RegExp(`(?<![.\\w$])(${direct.join('|')})\\s*(?:<[^>()]*>)?\\s*\\(`, 'g'))) {
      if (/^[\w$]+$/.test(m[1]) && shadowed(f, m[1], m.index)) continue;
      found.push({ index: m.index, open: m.index + m[0].length - 1, wrapper: /fetch$/.test(m[1]) && !local.has(m[1]) ? null : local.get(m[1]) });
    }
    if (ns.size) {
      for (const m of f.code.matchAll(new RegExp(`(?<![.\\w$])(${[...ns.keys()].map(escapeRe).join('|')})\\s*\\.\\s*(\\w+)\\s*(?:<[^>()]*>)?\\s*\\(`, 'g'))) {
        const wrapper = ns.get(m[1]).get(m[2]);
        if (wrapper && !shadowed(f, m[1], m.index)) found.push({ index: m.index, open: m.index + m[0].length - 1, wrapper });
      }
    }
    for (const { index, open, wrapper } of found.sort((a, b) => a.index - b.index)) {
      if (own.some((w) => (index >= w.head[0] && index < w.head[1]) || w.delegates.has(index))) continue;
      const a = args(f.text, open);
      if (!a.length) continue;
      let verb;
      if (!wrapper) verb = fetchVerb(a[1]);
      else if (wrapper.verbAt >= 0 && a[wrapper.verbAt] !== undefined) verb = /^['"](\w+)['"]$/.exec(a[wrapper.verbAt])?.[1].toUpperCase() ?? null;
      else verb = wrapper.verb;
      const raw = resolveRoute(a[0], { get: (name) => constantAt(f, name, index, imported.get(name)) });
      const call = {
        verb, raw: raw ?? a[0], key: verb === null || raw === null ? null : `${verb} ${normalise(raw)}`, via: wrapper ? wrapper.name : 'fetch',
        member: memberAt(f.text, index), file: f.rel, line: lineAt(f.text, index),
      };
      if (call.key === null) call.reason = verb === null ? 'verb not resolved' : 'route not resolved';
      calls.push(call);
    }
  }
  return calls;
}

function routesOf(files) {
  const routes = [];
  for (const f of files.filter((x) => /(^|\/)router(\/index)?\.(ts|js)$/.test(x.rel))) {
    const imports = new Map([...f.text.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g)].map((m) => [m[1], m[2]]));
    const paths = [...f.text.matchAll(/\bpath:\s*['"]([^'"]*)['"]/g)];
    paths.forEach((m, i) => {
      const chunk = f.text.slice(m.index, paths[i + 1]?.index ?? f.text.length);
      const lazy = /component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/.exec(chunk)?.[1];
      const named = /component:\s*(\w+)/.exec(chunk)?.[1];
      const source = lazy ?? imports.get(named);
      const view = source ? source.split('/').pop().replace(/\.vue$/, '') : named ?? null;
      routes.push({ path: m[1], view, file: f.rel, line: lineAt(f.text, m.index) });
    });
  }
  return routes;
}

export function extract(rootArg, { includeTests = false } = {}) {
  const root = resolve(rootArg);
  if (!existsSync(root)) throw new Error(`no such tree: ${root}`);
  const rels = walk(root);
  const files = load(rels.filter((rel) => includeTests || !isTest(rel)), root);
  const views = files.filter((f) => /(^|\/)views\/[^/]+\.vue$/.test(f.rel))
    .map((f) => ({ view: f.rel.split('/').pop().replace(/\.vue$/, ''), stores: [...new Set([...f.code.matchAll(/\b(use\w+Store)\s*\(/g)].map((m) => m[1]))], file: f.rel }))
    .sort((a, b) => a.view.localeCompare(b.view));
  const stores = files.flatMap((f) => [...f.text.matchAll(/export\s+const\s+(use\w+Store)\s*=\s*defineStore\(\s*['"]([^'"]+)['"]/g)].map((m) => ({
    store: m[1], id: m[2], file: f.rel, calls: [...new Set([...f.code.matchAll(/\b(\w+Api)\.(\w+)\s*\(/g)].map((c) => `${c[1]}.${c[2]}`))],
  }))).sort((a, b) => a.store.localeCompare(b.store));
  return { routes: routesOf(files), views, stores, calls: callsOf(files), testCode: { included: includeTests, files: rels.filter(isTest).length } };
}

export function join(client, server) {
  const prefix = server.routePrefix ?? null;
  const prefixKnown = !(server.routePrefixConflict ?? []).length;
  const prefixKey = prefix ? normalise(prefix) : '';
  const hasPrefix = (route) => { const key = normalise(route); return key === prefixKey || key.startsWith(`${prefixKey}/`); };
  const entries = (server.entries ?? []).filter((e) => e.verb && e.route !== null && e.route !== undefined).map((e) => {
    let route = null;
    if (e.absolute === true) route = e.route;
    else if (e.absolute !== null && prefixKnown) route = prefix && !hasPrefix(e.route) ? `${prefix}/${e.route}` : e.route;
    return {
      entry: { kind: e.kind, id: e.id, route: e.route, verb: e.verb, absolute: e.absolute, file: e.file, line: e.line },
      key: route === null ? null : `${e.verb} ${normalise(route)}`,
    };
  });
  const unkeyed = entries.filter((e) => e.key === null).length;
  const matches = [];
  const unresolved = [];
  // A reason is written into a page's `join: unresolved — {reason}` note, where `; ` separates cross-references.
  const miss = (call, reason, candidates = []) => unresolved.push({ call, reason: reason.replace(/;(?=\s)/g, () => ','), candidates });
  for (const call of client.calls) {
    if (!call.key) { miss(call, call.reason ?? 'route not resolved'); continue; }
    const found = entries.filter((e) => e.key === call.key);
    if (found.length === 1) matches.push({ call, entry: found[0].entry });
    else if (!found.length) {
      const note = !unkeyed ? '' : unkeyed === 1 ? ' (1 server entry with an unresolved route prefix or group was not compared)'
        : ` (${unkeyed} server entries with an unresolved route prefix or group were not compared)`;
      miss(call, `no server entry matches ${call.key}${note}`);
    } else miss(call, `${found.length} server entries match ${call.key}`, found.map((e) => e.entry.id));
  }
  return { matches, unresolved };
}

// Both sides canonical, so a run through a link or junction is still a direct run.
const sameFile = (a, b) => { try { return realpathSync(a) === realpathSync(b); } catch { return false; } };
if (process.argv[1] && sameFile(fileURLToPath(import.meta.url), process.argv[1])) {
  const argv = process.argv.slice(2);
  const flag = (name) => { const at = argv.indexOf(name); return at >= 0 ? argv[at + 1] : undefined; };
  try {
    const client = extract(flag('--repo') ?? '.', { includeTests: argv.includes('--include-tests') });
    let out = client;
    if (argv[0] === 'join') {
      const serverFile = flag('--server');
      if (!serverFile) throw new Error('join needs --server {extract-dotnet output}');
      out = join(client, JSON.parse(readFileSync(serverFile, 'utf8')));
    }
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exitCode = 2;
  }
}
