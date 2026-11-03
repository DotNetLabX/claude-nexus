#!/usr/bin/env node
// move-check.mjs — the rename-and-move-code skill's check: shows that a names-only or move change changed nothing.
//
//   node move-check.mjs --base {ref} [--map {file}] [--keep {file}] [--skip {glob}]… [--root {dir}]
//
// Base is the tree at {ref}; head is the working tree — tracked and untracked files, ignored files left out. The
// script reads both itself and writes nothing, the index included.
//
//   --map    one `Old.Name -> New.Name` pair a line; applied to the base side of code, project files and docs.
//   --keep   one `{path glob} :: {exact text}` or `{exact text}` entry a line; covers every item whose line text
//            equals it, in a matching file. A `#` line is a comment; a text starting with `#` is written `** :: #…`.
//   --skip   a path glob left out of both the compare and the sweep (repeatable), for history folders. The map and
//            keep files are never compared or swept, wherever they sit.
//
// Output: one summary line, then each item not kept as `{file}:{line}: {what}: {text}`.
// Exit: 0 when every item is kept or none exists, 1 with any item left, 2 on bad input.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

class BadInput extends Error {}

const HAS_WORD = /[\p{L}\p{N}]/u;
const USING = /^(global\s+)?using\s+(static\s+)?([\p{L}\p{N}_@]+\s*=\s*)?[\p{L}\p{N}_@.:<>,\s[\]?]+;$/u;
const NAMESPACE = /^namespace\s+[\p{L}\p{N}_@.]+\s*;?$/u;
const CONFIG_EXT = new Set(['.json', '.yaml', '.yml', '.config', '.env', '.xml']);
// A pair needs this share of the larger file's distinct lines; a split fragment or merged file this share of its own.
const PAIR_FLOOR = 0.2;
const JOIN_FLOOR = 0.5;
// A line found in more files than this says nothing about which file a fragment came from.
const COMMON = 200;
const MAX_CELLS = 30_000_000;
const utf8 = new TextDecoder('utf-8', { fatal: true });

const slash = (p) => p.split(sep).join('/');
const byPath = (a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function git(cwd, args, input) {
  return spawnSync('git', args, {
    cwd, input, maxBuffer: 1 << 30, windowsHide: true, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
}

function decode(buf) {
  try { return utf8.decode(buf); } catch { return null; }
}

const utf16Bom = (buf) => (buf[0] === 0xff && buf[1] === 0xfe ? 'le' : buf[0] === 0xfe && buf[1] === 0xff ? 'be' : null);

// For the sweep only: UTF-16 by its byte-order mark, else UTF-8, else Latin-1, so an ASCII name is found in any of them.
function decodeAny(buf) {
  const bom = utf16Bom(buf);
  if (bom) {
    const body = Buffer.from(buf.subarray(2, 2 + ((buf.length - 2) & ~1)));
    return (bom === 'be' ? body.swap16() : body).toString('utf16le');
  }
  return decode(buf) ?? buf.toString('latin1');
}

// ── input files ──────────────────────────────────────────────────────────────

function lines(file) {
  const buf = readFileSync(file);
  if (utf16Bom(buf)) throw new BadInput(`${file} is UTF-16 — save it as UTF-8`);
  const text = decode(buf);
  if (text === null) throw new BadInput(`${file} is not valid UTF-8 — save it as UTF-8`);
  if (text.includes('\0')) throw new BadInput(`${file} holds a NUL byte — save it as UTF-8 text`);
  return text.split(/\r?\n/);
}

function readMap(file) {
  if (!existsSync(file)) throw new BadInput(`no map file: ${file}`);
  const pairs = [];
  lines(file).forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const at = t.indexOf('->');
    const from = at < 0 ? '' : t.slice(0, at).trim();
    const to = at < 0 ? '' : t.slice(at + 2).trim();
    if (!from || !to) throw new BadInput(`${file}:${i + 1}: a map line is "Old.Name -> New.Name"`);
    pairs.push([from, to]);
  });
  return pairs;
}

function readKeep(file) {
  if (!existsSync(file)) throw new BadInput(`no keep file: ${file}`);
  const entries = [];
  for (const line of lines(file)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const at = t.indexOf(' :: ');
    entries.push(at < 0 ? { text: t } : { glob: globRegex(t.slice(0, at).trim()), text: t.slice(at + 4).trim() });
  }
  return entries;
}

export function globRegex(glob) {
  const g = glob.replace(/\\/g, '/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      i++;
      if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += escapeRe(c);
  }
  return new RegExp(`^${re}$`);
}

// Identifier-boundary matches: no letter, digit or `_` directly before or after; a following `.` continues the name.
function nameRegex(names) {
  const alt = [...names].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alt})(?![\\p{L}\\p{N}_])`, 'gu');
}

function makeMapper(pairs) {
  if (!pairs.length) return null;
  const to = new Map(pairs);
  const re = nameRegex(pairs.map(([from]) => from));
  return (s) => s.replace(re, (m) => to.get(m));
}

// ── the C# lexer ─────────────────────────────────────────────────────────────

// The literal starting at `i`, or null: { kind, end, holes }. `end` is one past its last character; each hole of an
// interpolated string is [from, fmt, to]: its expression is [from, fmt), its alignment and format text [fmt, to).
function literalAt(s, i) {
  let j = i;
  let dollars = 0;
  let verbatim = false;
  while (s[j] === '$' || s[j] === '@') {
    if (s[j] === '$') dollars++; else verbatim = true;
    j++;
  }
  if (s[j] === "'") {
    if (j !== i) return null;
    let k = j + 1;
    while (k < s.length && s[k] !== "'" && s[k] !== '\n') k += s[k] === '\\' ? 2 : 1;
    return { kind: 'char', end: s[k] === "'" ? k + 1 : Math.min(s.length, k), holes: [] };
  }
  if (s[j] !== '"') return null;
  const holes = [];
  let quotes = 0;
  while (s[j + quotes] === '"') quotes++;
  if (quotes >= 3 && !verbatim) {
    const close = '"'.repeat(quotes);
    let k = j + quotes;
    while (k < s.length) {
      if (s.startsWith(close, k)) return { kind: 'string', end: k + quotes, holes };
      if (dollars && s[k] === '{') {
        let run = 0;
        while (s[k + run] === '{') run++;
        if (run >= dollars) {
          const from = k + run;
          const { fmt, end: to } = holeAt(s, from);
          holes.push([from, fmt, to]);
          k = to + dollars;
          continue;
        }
        k += run;
        continue;
      }
      k++;
    }
    return { kind: 'string', end: s.length, holes };
  }
  let k = j + 1;
  while (k < s.length) {
    const c = s[k];
    if (dollars && c === '{') {
      if (s[k + 1] === '{') { k += 2; continue; }
      const { fmt, end: to } = holeAt(s, k + 1);
      holes.push([k + 1, fmt, to]);
      k = to + 1;
      continue;
    }
    if (verbatim) {
      if (c === '"') {
        if (s[k + 1] === '"') { k += 2; continue; }
        return { kind: 'string', end: k + 1, holes };
      }
    } else {
      if (c === '\\') { k += 2; continue; }
      if (c === '"') return { kind: 'string', end: k + 1, holes };
      if (c === '\n') return { kind: 'string', end: k, holes };
    }
    k++;
  }
  return { kind: 'string', end: s.length, holes };
}

// The interpolation hole whose expression starts at `from`: `end` is the index of its closing `}`, `fmt` where its
// alignment (`,`) or format (`:`) text starts — `end` when it has neither. A `::` is never a format.
function holeAt(s, from) {
  let depth = 0;
  let k = from;
  while (k < s.length) {
    const c = s[k];
    if (c === '"' || c === "'" || c === '$' || c === '@') {
      const inner = literalAt(s, k);
      if (inner) { k = inner.end; continue; }
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if ((c === ')' || c === ']') && depth) depth--;
    else if (c === '}') {
      if (depth === 0) return { fmt: k, end: k };
      depth--;
    } else if (depth === 0 && (c === ',' || (c === ':' && s[k + 1] !== ':' && s[k - 1] !== ':'))) {
      const end = s.indexOf('}', k);
      return { fmt: k, end: end < 0 ? s.length : end };
    }
    k++;
  }
  return { fmt: s.length, end: s.length };
}

// `text` has every comment blanked; `code` also has every literal blanked. Both keep the source's length and line
// breaks. `literals` are the string and char literals, an interpolated one with each hole's expression emptied (its
// alignment and format text kept) and the literals inside the expressions listed on their own. A preprocessor line
// is left as it stands: an apostrophe in `#region Don't` opens nothing.
export function lex(src) {
  const text = src.split('');
  const code = src.split('');
  const literals = [];
  const blank = (arr, from, to) => { for (let k = from; k < to && k < arr.length; k++) if (arr[k] !== '\n') arr[k] = ' '; };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '#' && /^[ \t]*$/.test(src.slice(src.lastIndexOf('\n', i - 1) + 1, i))) {
      const end = src.indexOf('\n', i);
      i = end < 0 ? src.length : end;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      let end = src.indexOf('\n', i);
      if (end < 0) end = src.length;
      blank(text, i, end);
      blank(code, i, end);
      i = end;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const at = src.indexOf('*/', i + 2);
      const end = at < 0 ? src.length : at + 2;
      blank(text, i, end);
      blank(code, i, end);
      i = end;
      continue;
    }
    if (c === '"' || c === "'" || c === '$' || c === '@') {
      const lit = literalAt(src, i);
      if (lit) {
        let value = '';
        let at = i;
        for (const [from, fmt, to] of lit.holes) {
          value += src.slice(at, from) + src.slice(fmt, to);
          at = to;
          for (const inner of lex(src.slice(from, fmt)).literals) literals.push({ start: from + inner.start, value: inner.value });
        }
        literals.push({ start: i, value: value + src.slice(at, lit.end) });
        blank(code, i, lit.end);
        i = lit.end;
        continue;
      }
    }
    i++;
  }
  return { text: text.join(''), code: code.join(''), literals };
}

// The `{` and `}` of every block-scoped namespace, as indexes into `code`.
function namespaceBraces(code) {
  const out = [];
  for (const m of code.matchAll(/(?<![\p{L}\p{N}_@])namespace\s+[\p{L}\p{N}_@.]+/gu)) {
    let k = m.index + m[0].length;
    while (/\s/.test(code[k] ?? '')) k++;
    if (code[k] !== '{') continue;
    let depth = 0;
    for (let j = k; j < code.length; j++) {
      if (code[j] === '{') depth++;
      else if (code[j] === '}' && --depth === 0) { out.push(k, j); break; }
    }
  }
  return out;
}

function lineStarts(src) {
  const starts = [0];
  for (let k = 0; k < src.length; k++) if (src[k] === '\n') starts.push(k + 1);
  return starts;
}

function lineOf(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}

// The name a `{` opens a block under: its line without the braces, or the line before when the brace stands alone.
// `partial` is set aside, so a class split into partial files keeps its blocks.
const blockLabel = (t) => t.replace(/^[\s}]+|[\s{]+$/g, '').replace(/(?<![\p{L}\p{N}_@])partial\s+/gu, '');

// Each line's `ctx` is the chain of block labels around it, one per line break; split and merge groups match on it.
function normaliseCs(src, mapper) {
  const lexed = lex(src);
  const text = lexed.text.split('');
  const code = lexed.code.split('');
  for (const k of namespaceBraces(lexed.code)) { text[k] = ' '; code[k] = ' '; }
  const codeLines = code.join('').split('\n');
  const out = [];
  const blocks = [];
  text.join('').split('\n').forEach((line, i) => {
    const t = line.trim();
    const c = codeLines[i].trim();
    if (!t || USING.test(c) || NAMESPACE.test(c)) return;
    const mapped = mapper ? mapper(t) : t;
    out.push({ n: i + 1, t: mapped, ctx: blocks.join('\n') });
    for (const ch of c) {
      if (ch === '{') blocks.push(blockLabel(mapped) || blockLabel(out[out.length - 2]?.t ?? ''));
      else if (ch === '}') blocks.pop();
    }
  });
  const starts = lineStarts(src);
  return { lines: out, literals: lexed.literals.map((l) => ({ n: lineOf(starts, l.start), v: l.value })) };
}

// A settings file keeps its whitespace: a trailing space in a YAML block scalar is part of the value.
function normaliseText(src, mapper, keepSpace) {
  const raw = src.split('\n');
  if (raw.length && raw[raw.length - 1] === '') raw.pop();
  return raw.map((l, i) => {
    const t = keepSpace ? l : l.trimEnd();
    return { n: i + 1, t: mapper ? mapper(t) : t };
  });
}

function isConfig(path) {
  const ext = extname(path).toLowerCase();
  return CONFIG_EXT.has(ext) || basename(path).toLowerCase().startsWith('.env');
}

// A symbolic link is compared by its target text, never followed; it takes no part in pairing by shared lines.
function unitOf(path, buf, side, mapper, link) {
  const ext = extname(path).toLowerCase();
  if (link) {
    const target = buf.toString('utf8');
    const t = side === 'base' && mapper ? mapper(target) : target;
    return { path, side, ext, kind: 'link', buf, raw: [target], lines: [{ n: 1, t }], literals: [], distinct: new Set() };
  }
  const decoded = decode(buf);
  if (decoded === null) return { path, side, ext, kind: 'binary', buf, raw: [], lines: [], literals: [], distinct: new Set() };
  const src = decoded.replace(/\r\n?/g, '\n');
  const kind = ext === '.cs' ? 'cs' : isConfig(path) ? 'config' : 'text';
  const fn = side === 'base' && kind !== 'config' ? mapper : null;
  const { lines: norm, literals } = kind === 'cs' ? normaliseCs(src, fn) : { lines: normaliseText(src, fn, kind === 'config'), literals: [] };
  const distinct = new Set(norm.filter((l) => HAS_WORD.test(l.t)).map((l) => l.t));
  return { path, side, ext, kind, buf, raw: src.split('\n'), lines: norm, literals, distinct };
}

// ── reading both sides ───────────────────────────────────────────────────────

function baseTree(top, commit) {
  const res = git(top, ['ls-tree', '-r', '-z', '--full-tree', commit]);
  if (res.status !== 0) throw new Error(`git ls-tree failed: ${res.stderr}`);
  const oids = new Map();
  const links = new Set();
  for (const rec of res.stdout.toString('utf8').split('\0')) {
    if (!rec) continue;
    const tab = rec.indexOf('\t');
    const [mode, type, oid] = rec.slice(0, tab).split(' ');
    if (type !== 'blob') continue;
    oids.set(rec.slice(tab + 1), oid);
    if (mode === '120000') links.add(rec.slice(tab + 1));
  }
  return { oids, links };
}

function readBlobs(top, oids) {
  const unique = [...new Set(oids)];
  const blobs = new Map();
  if (!unique.length) return blobs;
  const res = git(top, ['cat-file', '--batch'], `${unique.join('\n')}\n`);
  if (res.status !== 0) throw new Error(`git cat-file failed: ${res.stderr}`);
  const buf = res.stdout;
  let at = 0;
  for (const oid of unique) {
    const nl = buf.indexOf(0x0a, at);
    const header = buf.toString('utf8', at, nl).split(' ');
    if (header[1] === 'missing') { at = nl + 1; continue; }
    const size = Number(header[2]);
    blobs.set(oid, buf.subarray(nl + 1, nl + 1 + size));
    at = nl + 1 + size + 1;
  }
  return blobs;
}

function headFiles(top) {
  const res = git(top, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  if (res.status !== 0) throw new Error(`git ls-files failed: ${res.stderr}`);
  const files = new Set();
  const links = new Set();
  for (const p of res.stdout.toString('utf8').split('\0')) {
    if (!p || files.has(p)) continue;
    let st;
    try { st = lstatSync(join(top, p)); } catch { continue; }
    if (st.isSymbolicLink()) links.add(p);
    if (st.isFile() || st.isSymbolicLink()) files.add(p);
  }
  return { files, links };
}

const blobId = (buf, oid) => createHash(oid.length === 64 ? 'sha256' : 'sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

// ── pairing and groups ───────────────────────────────────────────────────────

function shareIndex(units) {
  const index = new Map();
  for (const u of units) {
    for (const t of u.distinct) {
      let list = index.get(t);
      if (!list) index.set(t, (list = []));
      list.push(u);
    }
  }
  return index;
}

function sharesOf(unit, index) {
  const counts = new Map();
  for (const t of unit.distinct) {
    const list = index.get(t);
    if (!list || list.length > COMMON) continue;
    for (const o of list) if (o.ext === unit.ext) counts.set(o, (counts.get(o) ?? 0) + 1);
  }
  return counts;
}

function shared(a, b) {
  let n = 0;
  const [small, large] = a.distinct.size <= b.distinct.size ? [a.distinct, b.distinct] : [b.distinct, a.distinct];
  for (const t of small) if (large.has(t)) n++;
  return n;
}

// The best partner in `counts` whose share of `of` reaches `floor`, or null: { o, tie }, `tie` the first other
// partner sharing as many lines, or null.
function bestOf(counts, of, floor) {
  if (!of.distinct.size) return null;
  const fit = [...counts].filter(([, n]) => n / of.distinct.size >= floor).sort((x, y) => y[1] - x[1] || byPath(x[0], y[0]));
  if (!fit.length) return null;
  return { o: fit[0][0], tie: fit.length > 1 && fit[1][1] === fit[0][1] ? fit[1][0] : null };
}

const ambiguousJoin = (u, best) => ({
  file: u.path, line: 0, count: 'n', text: '(ambiguous join)',
  what: `ambiguous join: as many lines shared with ${best.o.path} and ${best.tie.path}, compared with ${best.o.path}`,
});

// ── the in-order compare ─────────────────────────────────────────────────────

// Index pairs [i, j] of an in-order match of `a` against `b`. The earliest match wins a tie, so a split fragment
// takes the first run of its base that fits it; the shared tail is trimmed first only when `tail` is set.
function lcsMatches(aText, bText, tail) {
  const ids = new Map();
  const id = (t) => { let v = ids.get(t); if (v === undefined) ids.set(t, (v = ids.size)); return v; };
  const a = aText.map(id);
  const b = bText.map(id);
  const out = [];
  let lo = 0;
  while (lo < a.length && lo < b.length && a[lo] === b[lo]) { out.push([lo, lo]); lo++; }
  let ea = a.length;
  let eb = b.length;
  const tailOut = [];
  if (tail || (ea - lo + 1) * (eb - lo + 1) > MAX_CELLS) {
    while (ea > lo && eb > lo && a[ea - 1] === b[eb - 1]) { ea--; eb--; tailOut.unshift([ea, eb]); }
  }
  const n = ea - lo;
  const m = eb - lo;
  if (n > 0 && m > 0) {
    if ((n + 1) * (m + 1) > MAX_CELLS) {
      let j = lo;
      for (let i = lo; i < ea && j < eb; i++) {
        let k = j;
        while (k < eb && b[k] !== a[i]) k++;
        if (k < eb) { out.push([i, k]); j = k + 1; }
      }
    } else {
      const w = m + 1;
      const dp = new Int32Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          dp[i * w + j] = a[lo + i] === b[lo + j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
        }
      }
      let i = 0;
      let j = 0;
      while (i < n && j < m) {
        if (a[lo + i] === b[lo + j]) { out.push([lo + i, lo + j]); i++; j++; }
        else if (dp[i * w + j + 1] >= dp[(i + 1) * w + j]) j++;
        else i++;
      }
    }
  }
  return out.concat(tailOut);
}

function lineItem(unit, line, dir) {
  const config = unit.kind === 'config';
  return {
    file: unit.path, line: line.n, what: config ? `setting ${dir}` : unit.kind === 'link' ? `link target ${dir}` : dir,
    text: (unit.raw[line.n - 1] ?? '').trim(), count: config ? 'm' : 'n',
  };
}

// Each head fragment is matched once against each base of its group, in order; what no match covers is a leftover.
// In a split or merge a line matches only under the same chain of blocks, so a statement taken out of its condition
// or nested into another class is a leftover.
function compareGroup(g) {
  const items = [];
  const one = g.bases.length === 1 && g.heads.length === 1;
  const key = (l) => (!one && l.ctx ? `${l.ctx}\n${l.t}` : l.t);
  if ([...g.bases, ...g.heads].some((u) => u.kind === 'binary')) {
    if (one && g.bases[0].buf.equals(g.heads[0].buf)) return items;
    for (const u of g.heads) items.push({ file: u.path, line: 0, what: 'binary content changed', text: '(binary file)', count: 'n' });
    return items;
  }
  const covered = new Map(g.bases.map((b) => [b, new Uint8Array(b.lines.length)]));
  const first = (u, pick) => (u === pick ? 0 : 1);
  const heads = [...g.heads].sort((x, y) => first(x, g.pairHead) - first(y, g.pairHead) || y.distinct.size - x.distinct.size || byPath(x, y));
  for (const h of heads) {
    const hit = new Uint8Array(h.lines.length);
    const own = h === g.pairHead ? g.pairBase : null;
    const bases = [...g.bases].sort((x, y) => first(x, own) - first(y, own) || shared(h, y) - shared(h, x) || byPath(x, y));
    for (const b of bases) {
      const cov = covered.get(b);
      const hi = [];
      const bi = [];
      for (let i = 0; i < h.lines.length; i++) if (!hit[i]) hi.push(i);
      for (let j = 0; j < b.lines.length; j++) if (!cov[j]) bi.push(j);
      if (!hi.length) break;
      if (!bi.length) continue;
      for (const [x, y] of lcsMatches(hi.map((i) => key(h.lines[i])), bi.map((j) => key(b.lines[j])), one)) {
        hit[hi[x]] = 1;
        cov[bi[y]] = 1;
      }
    }
    h.lines.forEach((l, i) => { if (!hit[i]) items.push(lineItem(h, l, 'added')); });
  }
  for (const b of g.bases) {
    const cov = covered.get(b);
    b.lines.forEach((l, j) => { if (!cov[j]) items.push(lineItem(b, l, 'dropped')); });
  }
  if ([...g.bases, ...g.heads].every((u) => u.kind === 'cs')) items.push(...compareLiterals(g));
  return items;
}

// String literals, compared as multisets and without the map: a renamed message or key is what tests and deploy
// files depend on.
function compareLiterals(g) {
  const tally = new Map();
  const add = (u, side) => {
    for (const lit of u.literals) {
      let t = tally.get(lit.v);
      if (!t) tally.set(lit.v, (t = { base: [], head: [] }));
      t[side].push({ u, n: lit.n });
    }
  };
  g.bases.forEach((u) => add(u, 'base'));
  g.heads.forEach((u) => add(u, 'head'));
  const items = [];
  for (const [v, t] of tally) {
    const extra = t.base.length - t.head.length;
    const left = extra > 0 ? t.base.slice(t.base.length - extra) : t.head.slice(t.head.length + extra);
    for (const { u, n } of left) {
      items.push({
        file: u.path, line: n, what: `literal ${extra > 0 ? 'dropped' : 'added'} ${v}`,
        text: (u.raw[n - 1] ?? '').trim(), count: 'm',
      });
    }
  }
  return items;
}

// ── the old-name sweep ───────────────────────────────────────────────────────

function sweep(path, buf, oldNames, re) {
  const items = [];
  const found = (s) => new Set([...s.matchAll(re)].map((m) => m[0]));
  for (const name of found(path)) items.push({ file: path, line: 0, what: `old name ${name} in the path`, text: path, count: 'k' });
  const content = decodeAny(buf);
  const braces = content.includes('.{');
  if (content.search(re) < 0 && !braces) return items;
  content.replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
    const names = found(line);
    if (braces) {
      for (const m of line.matchAll(/([\p{L}\p{N}_.]+)\.\{([^{}\n]*)\}/gu)) {
        for (const part of m[2].split(',')) for (const name of found(`${m[1]}.${part.trim()}`)) names.add(name);
      }
    }
    for (const name of [...names].sort()) {
      if (oldNames.has(name)) items.push({ file: path, line: i + 1, what: `old name ${name}`, text: line.trim(), count: 'k' });
    }
  });
  return items;
}

// ── the run ──────────────────────────────────────────────────────────────────

function insideRepo(top, file) {
  const rel = relative(realpathSync.native(top), realpathSync.native(file));
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? slash(rel) : null;
}

export function moveCheck({ cwd = process.cwd(), root, base, map, keep, skip = [] }) {
  if (!base || base.startsWith('-')) throw new BadInput('--base {ref} is required');
  const at = resolve(cwd, root ?? '.');
  const topRes = git(at, ['rev-parse', '--show-toplevel']);
  if (topRes.error || topRes.status !== 0) throw new BadInput(`not a git repository: ${at}`);
  const top = topRes.stdout.toString('utf8').trim();
  const commitRes = git(top, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]);
  if (commitRes.status !== 0) throw new BadInput(`unknown base ref: ${base}`);
  const commit = commitRes.stdout.toString('utf8').trim();

  const mapFile = map ? resolve(cwd, map) : null;
  const keepFile = keep ? resolve(cwd, keep) : null;
  const pairsOfMap = mapFile ? readMap(mapFile) : [];
  const keeps = keepFile ? readKeep(keepFile) : [];
  const skips = skip.map(globRegex);
  const mapper = makeMapper(pairsOfMap);
  const excluded = new Set([mapFile, keepFile].filter(Boolean).map((f) => insideRepo(top, f)).filter(Boolean));

  const { oids: baseOids, links: baseLinks } = baseTree(top, commit);
  const { files: heads, links: headLinks } = headFiles(top);
  for (const p of excluded) { baseOids.delete(p); heads.delete(p); }
  for (const p of [...baseOids.keys()]) if (skips.some((s) => s.test(p))) baseOids.delete(p);
  for (const p of [...heads]) if (skips.some((s) => s.test(p))) heads.delete(p);
  const read = (p) => (headLinks.has(p) ? Buffer.from(slash(readlinkSync(join(top, p)))) : readFileSync(join(top, p)));
  const headBufs = new Map([...heads].map((p) => [p, read(p)]));

  const unchangedPaths = new Set();
  const changedBase = [];
  for (const [p, oid] of baseOids) {
    if (heads.has(p) && blobId(headBufs.get(p), oid) === oid) unchangedPaths.add(p);
    else changedBase.push(p);
  }
  const unchanged = unchangedPaths.size;
  const blobs = readBlobs(top, changedBase.map((p) => baseOids.get(p)));
  const baseUnits = changedBase
    .map((p) => unitOf(p, blobs.get(baseOids.get(p)) ?? Buffer.alloc(0), 'base', mapper, baseLinks.has(p))).sort(byPath);
  const headUnits = [...heads].filter((p) => !unchangedPaths.has(p)).sort()
    .map((p) => unitOf(p, headBufs.get(p), 'head', mapper, headLinks.has(p)));
  const headAt = new Map(headUnits.map((u) => [u.path, u]));

  const groups = [];
  const groupOfBase = new Map();
  const groupOfHead = new Map();
  const freeBase = new Set();
  const freeHead = new Set(headUnits);
  const pair = (b, h) => {
    const g = { bases: [b], heads: [h], pairBase: b, pairHead: h };
    groups.push(g);
    groupOfBase.set(b, g);
    groupOfHead.set(h, g);
    freeBase.delete(b);
    freeHead.delete(h);
  };
  for (const b of baseUnits) {
    const h = headAt.get(b.path);
    if (h) pair(b, h); else freeBase.add(b);
  }
  if (mapper) {
    for (const b of [...freeBase]) {
      const h = headAt.get(mapper(b.path));
      if (h && freeHead.has(h)) pair(b, h);
    }
  }
  for (const b of [...freeBase]) {
    const name = basename(mapper ? mapper(b.path) : b.path);
    const same = [...freeHead].filter((h) => basename(h.path) === name);
    if (!same.length) continue;
    pair(b, same.reduce((best, h) => (shared(b, h) > shared(b, best) ? h : best)));
  }
  const newIndex = shareIndex([...freeHead]);
  const candidates = [];
  for (const b of freeBase) {
    for (const [h, n] of sharesOf(b, newIndex)) {
      const ratio = n / Math.max(b.distinct.size, h.distinct.size);
      if (ratio >= PAIR_FLOOR) candidates.push({ b, h, n, ratio });
    }
  }
  candidates.sort((x, y) => y.n - x.n || y.ratio - x.ratio || byPath(x.b, y.b) || byPath(x.h, y.h));
  for (const { b, h } of candidates) if (freeBase.has(b) && freeHead.has(h)) pair(b, h);
  const pairCount = groups.length;

  const ambiguous = [];
  const baseIndex = shareIndex(baseUnits);
  for (const h of [...freeHead]) {
    const best = bestOf(sharesOf(h, baseIndex), h, JOIN_FLOOR);
    if (!best) continue;
    if (best.tie) ambiguous.push(ambiguousJoin(h, best));
    const b = best.o;
    let g = groupOfBase.get(b);
    if (!g) {
      g = { bases: [b], heads: [], pairBase: null, pairHead: null };
      groups.push(g);
      groupOfBase.set(b, g);
      freeBase.delete(b);
    }
    g.heads.push(h);
    groupOfHead.set(h, g);
    freeHead.delete(h);
  }
  const groupedIndex = shareIndex([...groupOfHead.keys()]);
  for (const b of [...freeBase]) {
    const best = bestOf(sharesOf(b, groupedIndex), b, JOIN_FLOOR);
    if (!best) continue;
    if (best.tie) ambiguous.push(ambiguousJoin(b, best));
    const g = groupOfHead.get(best.o);
    g.bases.push(b);
    groupOfBase.set(b, g);
    freeBase.delete(b);
  }

  const items = [...ambiguous];
  let identical = unchanged;
  let splitGroups = 0;
  for (const g of groups) {
    const found = compareGroup(g);
    if (g.bases.length > 1 || g.heads.length > 1) splitGroups++;
    else if (!found.length) identical++;
    items.push(...found);
  }
  for (const b of freeBase) {
    if (b.kind === 'binary') items.push({ file: b.path, line: 0, what: 'binary file deleted', text: '(binary file)', count: 'n' });
    else for (const l of b.lines) items.push(lineItem(b, l, 'dropped'));
  }
  for (const h of freeHead) {
    items.push({ file: h.path, line: 0, what: `added file with no base counterpart (${h.raw.length} lines)`, text: '(new file)', count: 'n' });
  }

  if (pairsOfMap.length) {
    const re = nameRegex(pairsOfMap.map(([from]) => from));
    const oldNames = new Set(pairsOfMap.map(([from]) => from));
    for (const p of [...heads].sort()) items.push(...sweep(p, headBufs.get(p), oldNames, re));
  }

  const isKept = (item) => keeps.some((k) => k.text === item.text && (!k.glob || k.glob.test(item.file)));
  const count = { n: 0, m: 0, k: 0 };
  let kept = 0;
  const left = [];
  for (const item of items) {
    count[item.count]++;
    if (isKept(item)) kept++; else left.push(item);
  }
  left.sort((x, y) => (x.file < y.file ? -1 : x.file > y.file ? 1 : x.line - y.line));
  const summary = `move-check: ${pairCount + unchanged} pairs, ${splitGroups} split or merge groups, ${identical} identical, `
    + `${count.n} leftover lines, ${count.m} changed literals or settings, ${count.k} old-name hits, ${kept} kept`;
  const out = [summary, ...left.map((i) => `${i.file}${i.line ? `:${i.line}` : ''}: ${i.what}: ${i.text}`)];
  return { code: left.length ? 1 : 0, output: `${out.join('\n')}\n`, items, kept };
}

function parseArgs(argv) {
  const opts = { skip: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined) throw new BadInput(`${a} needs a value`);
      return v;
    };
    if (a === '--base') opts.base = value();
    else if (a === '--map') opts.map = value();
    else if (a === '--keep') opts.keep = value();
    else if (a === '--skip') opts.skip.push(value());
    else if (a === '--root') opts.root = value();
    else throw new BadInput(`unknown argument: ${a}`);
  }
  return opts;
}

export function run(argv, { cwd = process.cwd() } = {}) {
  try {
    const r = moveCheck({ ...parseArgs(argv), cwd });
    return { code: r.code, stdout: r.output, stderr: '' };
  } catch (e) {
    return { code: 2, stdout: '', stderr: `move-check: ${e instanceof BadInput ? e.message : e.stack}\n` };
  }
}

const sameFile = (a, b) => { try { return realpathSync(a) === realpathSync(b); } catch { return false; } };
if (process.argv[1] && sameFile(fileURLToPath(import.meta.url), process.argv[1])) {
  const r = run(process.argv.slice(2));
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  process.exitCode = r.code;
}
