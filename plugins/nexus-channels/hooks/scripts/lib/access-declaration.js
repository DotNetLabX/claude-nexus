#!/usr/bin/env node
/**
 * The access declaration: read, resolve, check.
 *
 * A consuming repo commits `.claude/access.yaml` naming, per corpus, what may ground an answer — a
 * local copy in the repo, a remote server, or both. This module turns that file into a table of
 * resolved channels plus a list of findings. It is the whole contract: the SessionStart emitter and
 * the `--check` report are two renderings of what these three functions return.
 *
 * FAIL-CLOSED, NOT LENIENT. The failure this exists to prevent is a silent one — a line that stops
 * being read, a corpus that quietly falls back to the wrong channel — so anything the reader cannot
 * account for becomes an error naming its line, and the corpus it belongs to resolves to nothing.
 * Unknown keys are rejected rather than ignored: a typo and a key from a newer schema look identical
 * here, and ignoring both is how the missing line ships. The blast radius is deliberately graded —
 * a broken FILE unresolves every corpus (the structure is no longer trustworthy), a broken CORPUS
 * unresolves only itself (the others parsed fine and still deserve to work).
 *
 * NO YAML LIBRARY. Hook scripts are dependency-free, so this reads one canonical block-style dialect
 * rather than a YAML subset that would be part-implemented and misleading. Everything outside the
 * dialect is an error, never a best-effort guess.
 *
 * FILESYSTEM ACCESS IS INJECTED. Every read goes through `ctx.exists` / `ctx.readFile` so the checks
 * — which read settings layers including the user's own `~/.claude/settings.json` — run against test
 * sandboxes without monkey-patching `fs`. `load()` is the only function that builds a real-fs ctx.
 *
 * NOTHING HERE WRITES. The deny check reports a missing entry; it never edits a settings file. That
 * is the whole posture of the feature: it discloses, the owner decides.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ── the dialect and the schema ───────────────────────────────────────────────
// The plugin knows only these words. A key outside these sets is an error, not a pass-through.
const KINDS = ['private', 'published', 'split'];
const CORPUS_KEYS = ['kind', 'path', 'manifest', 'remote', 'deny'];
const MANIFEST_KEYS = ['path', 'commit_key', 'hash_key'];
const REMOTE_KEYS = ['server', 'tools', 'version_tool', 'version_key', 'fetch_tool', 'fetch_key'];
// Which keys are scalars, which open a nested block, which take a list. A value of the wrong SHAPE
// (a scalar where a block belongs) is as much an error as an unknown key.
const SHAPE = {
  corpus: { kind: 'scalar', path: 'scalar', manifest: 'block', remote: 'block', deny: 'list' },
  manifest: { path: 'scalar', commit_key: 'scalar', hash_key: 'scalar' },
  remote: { server: 'scalar', tools: 'list', version_tool: 'scalar', version_key: 'scalar', fetch_tool: 'scalar', fetch_key: 'scalar' },
};
// Required inside a block once the block is declared at all — independent of the corpus kind, which
// is why these are parse-level and not resolve-level.
const REQUIRED = { manifest: ['path', 'commit_key'], remote: ['server', 'tools'] };

// OWN properties only. `SHAPE.corpus[key]` on a plain object literal inherits from Object.prototype,
// so `constructor`, `toString`, `hasOwnProperty` and friends all return something truthy — every one
// of them matches the key regex, so an unknown-key check written as a bare lookup silently ACCEPTS
// them. Fail-closed means the lookup has to be own-property-only.
const shapeOf = (table, key) =>
  (Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined);

// A value that is present but empty is not a declared value. `server: ""` passing the required-key
// check is how a corpus resolves to a remote whose server name is the empty string.
const blank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

// Indentation is fixed, two spaces per level, so a level is a position rather than a guess:
const ROOT_INDENT = 0;      // corpora:
const NAME_INDENT = 2;      // a corpus name
const KEY_INDENT = 4;       // a corpus key
const CHILD_INDENT = 6;     // a manifest/remote child, or a block list item under a corpus key
const DEEP_INDENT = 8;      // a block list item under a manifest/remote key

const finding = (level, code, message, extra) =>
  Object.assign({ level, code, message }, extra || {});

// A UTF-8 byte-order mark, stripped from EVERY file this module reads — the declaration, a settings
// layer, a manifest. Windows editors and PowerShell's `Out-File -Encoding utf8` add one routinely,
// and `JSON.parse` rejects it: a perfectly valid settings file then reported as unreadable and its
// deny entries silently went unseen, which is exactly the missing-line failure this module exists to
// prevent. (Found by the live probe, whose own fixture settings were written with a BOM.)
const stripBom = (s) => String(s == null ? '' : s).replace(/^﻿/, '');

// A comment starts at ` #` and only outside a quoted value — a `#` with no space before it is part
// of the value (a fragment id, a colour), and one inside quotes is always literal.
//
// A quote only OPENS where a value can start: after whitespace, a colon, a comma or an opening
// bracket. An apostrophe inside an unquoted word (`docs/don't/kb`) is not a quote — treating it as
// one leaves the scanner permanently "inside a string" and silently swallows the rest of the line,
// comment and all, into the value.
const OPENS_QUOTE = /[\s:,[]/;
function stripInlineComment(s) {
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if ((c === '"' || c === "'") && (i === 0 || OPENS_QUOTE.test(s[i - 1]))) { quote = c; continue; }
    if (c === '#' && i > 0 && s[i - 1] === ' ') return s.slice(0, i - 1);
  }
  return s;
}

function unquote(v) {
  const m = v.match(/^(['"])([\s\S]*)\1$/);
  return m ? m[2] : v;
}

// A LIST where a single value belongs. The twin of the flow-mapping guard below, and the same
// reasoning: a value of the wrong SHAPE is an error, never a string. Without it `server: [s1, s2]`
// was stored verbatim and the corpus resolved to a server literally named "[s1, s2]" — a channel
// that cannot exist, presented as resolved. The likeliest trigger is a bracket copied from the
// `tools:` line the shipped template prints directly beneath `server:`.
const listInScalarSlot = (v) => /^\[/.test(v);

// An unreplaced `{placeholder}` from the shipped template, in a value slot, inside a list item, or
// as a corpus NAME. No colon and no comma inside: that is what separates `{docs/handbook}` from a
// genuine flow mapping like `{ server: gw, tools: [x] }`, which must still be reported as one.
//
// EMBEDDED, not whole-value. The template's own list items carry the braces inside a larger string —
// `tools: [{search}, {fetch}]`, `deny: [mcp__{atlas_server}__{write}]` — so a whole-value test read
// every one of them as a literal tool name and reported the unfilled file as clean, on exactly the
// first run this check exists for.
//
// The braces have to still wrap a BARE TOKEN, so a filled-in value carrying brackets or a braced
// pair with structure inside it stays legal (`docs/atlas[1]`, `docs/{a:b}`). A value that keeps a
// brace-wrapped bare token — `get{v}` — is refused, deliberately: it is overwhelmingly template
// text nobody replaced, and the price of refusing the rare literal is one renamed value, while the
// price of accepting it is a corpus that resolves to a channel named `{search}`.
const PLACEHOLDER = /\{[^{}:,]*\}/;
const placeholderIn = (v) => {
  const m = String(v).match(PLACEHOLDER);
  return m ? m[0] : null;
};

// An inline list `[a, b]`. Returns null when the value is not inline-list-shaped, so the caller can
// tell "not a list" from "an empty list". An EMPTY ITEM (`[a, , b]`) is reported rather than dropped
// — the block form errors on `- ` with nothing after it, and the inline form is the one a human is
// more likely to hand-edit into that state.
function parseInlineList(v) {
  if (!/^\[[\s\S]*\]$/.test(v)) return null;
  const inner = v.slice(1, -1).trim();
  if (inner === '') return { items: [], empty: false };
  const parts = inner.split(',').map((s) => unquote(s.trim()));
  return { items: parts.filter((s) => s !== ''), empty: parts.some((s) => s === '') };
}

/**
 * parse(text) -> { corpora: Map<name, Corpus>, errors: Finding[] }
 *
 * File-level errors empty the map (every corpus unresolved); corpus-level errors leave the corpus in
 * the map, flagged, so the table can still show it as unresolved with its reason.
 */
function parse(text) {
  const errors = [];
  const corpora = new Map();
  const fileErr = (line, code, message) => errors.push(finding('file', code, message, { line }));
  const corpusErr = (corpus, line, code, message) => {
    const f = finding('corpus', code, message, { corpus: corpus ? corpus.name : undefined, line });
    errors.push(f);
    if (corpus) corpus.errors.push(f);
  };

  const raw = stripBom(text);
  const lines = raw.split(/\r\n|\r|\n/);

  let sawRoot = false;
  let rootLine = 0;
  let firstContentLine = 0;
  let current = null;                      // the corpus being built
  let block = null;                        // { name: 'manifest'|'remote', obj }
  let openList = null;                     // { target, key, itemIndent, items, lines, corpus }

  const closeList = () => { openList = null; };

  const makeCorpus = (name, n) => ({
    name,
    kind: null,
    path: null,
    manifest: null,
    remote: null,
    deny: [],
    errors: [],
    seen: { corpus: new Set(), manifest: new Set(), remote: new Set() },
    lines: { self: n, kind: 0, path: 0, manifest: 0, remote: 0, deny: [], server: 0, tools: [], version_tool: 0, fetch_tool: 0 },
  });

  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const rawLine = lines[i];
    if (rawLine.indexOf('\t') !== -1) {
      // A tab is invisible and its width is a matter of opinion, so an indentation built from tabs
      // means the level structure this reader depends on is not knowable. Fail the file, not a line.
      fileErr(n, 'tab-indent', 'tab character — indentation must be spaces, two per level');
      continue;
    }
    if (/^\s*$/.test(rawLine)) continue;
    if (/^\s*#/.test(rawLine)) continue;

    const stripped = stripInlineComment(rawLine).replace(/\s+$/, '');
    if (stripped.trim() === '') continue;

    const indent = stripped.length - stripped.replace(/^ +/, '').length;
    const content = stripped.slice(indent);
    if (!firstContentLine) firstContentLine = n;

    if (indent % 2 !== 0 || indent > DEEP_INDENT) {
      fileErr(n, 'bad-indent', `indent of ${indent} space(s) — block style is two spaces per level`);
      continue;
    }

    // A list item belongs to the list its indentation opens under; anything else is out of place.
    if (content.startsWith('- ') || content === '-') {
      if (!openList || indent !== openList.itemIndent) {
        fileErr(n, 'stray-list-item', 'list item with no list key open at the level above it');
        continue;
      }
      const value = unquote(content.replace(/^-\s*/, '').trim());
      if (value === '') {
        corpusErr(openList.corpus, n, 'bad-value', `empty item in the "${openList.key}" list`);
        continue;
      }
      const strayItem = placeholderIn(value);
      if (strayItem) {
        corpusErr(openList.corpus, n, 'unreplaced-placeholder',
          `the "${openList.key}" list still holds the template placeholder ${strayItem} — replace it with the value the repo owner supplies`);
        continue;
      }
      openList.items.push(value);
      openList.lines.push(n);
      continue;
    }

    closeList();

    const kv = content.match(/^([A-Za-z0-9_-]+)\s*:(.*)$/);
    if (!kv) {
      // A line at CORPUS-NAME indent that still ends in a colon is a corpus declaration whose NAME
      // is wrong — not a structurally mangled file. Falling through to `not-a-mapping` made it
      // FILE-level, which unresolved every corpus and, worse, masked every other error behind one
      // message about mappings and list items. Two cases actually happen: an unreplaced template
      // placeholder (`{handbook}:` — the expected first-run state of anyone following the skill's
      // scaffold recipe, whose very first `--check` then reported the one thing they had not done
      // as the one thing it could not name), and a name outside the documented character class,
      // which the reader enforced only by accident and never named.
      const named = indent === NAME_INDENT ? content.match(/^(.*\S)\s*:(.*)$/) : null;
      if (named) {
        const rawName = named[1];
        block = null;
        if (corpora.has(rawName)) {
          fileErr(n, 'duplicate-corpus',
            `corpus "${rawName}" is declared twice (first at line ${corpora.get(rawName).lines.self})`);
          current = null;
          continue;
        }
        // Registered under its raw name ANYWAY, flagged: the keys below it then attach here instead
        // of cascading into a file-level `orphan-key` that would mask the real cause a second time.
        current = makeCorpus(rawName, n);
        corpora.set(rawName, current);
        if (PLACEHOLDER.test(rawName)) {
          corpusErr(current, n, 'unreplaced-placeholder',
            `the corpus name ${rawName} is still the template placeholder — replace it with the corpus name the repo owner supplies`);
        } else {
          corpusErr(current, n, 'bad-corpus-name',
            `"${rawName}" is not a corpus name — letters, digits, hyphen and underscore only`);
        }
        if (named[2].trim() !== '') {
          corpusErr(current, n, 'bad-value',
            `corpus "${rawName}" takes no inline value — declare its keys on the lines below it`);
        }
        continue;
      }
      fileErr(n, 'not-a-mapping', 'line is neither a "key: value" mapping nor a "- item" list entry');
      continue;
    }
    const key = kv[1];
    const value = kv[2].trim();

    // An UNREPLACED TEMPLATE PLACEHOLDER, checked before the flow-mapping rule below, because
    // `{docs/handbook}` is brace-shaped and would otherwise be reported as a flow mapping — advice
    // that has nothing to do with what the user actually did. This is the expected first-run state
    // for anyone scaffolding from the shipped template, so it gets its own message.
    // The corpus-NAME form of the same mistake is handled above, where the strict key regex rejects
    // the line entirely.
    const stray = placeholderIn(value);
    if (stray) {
      corpusErr(current, n, 'unreplaced-placeholder',
        `"${key}" still holds the template placeholder ${stray} — replace it with the value the repo owner supplies`);
      continue;
    }

    // A flow mapping doubles the parser surface for no consumer gain, so the dialect refuses it
    // outright rather than half-reading it.
    if (value.startsWith('{')) {
      fileErr(n, 'flow-mapping', `"${key}" uses a flow mapping — write the block form, two spaces per level`);
      continue;
    }

    if (indent === ROOT_INDENT) {
      if (key !== 'corpora') {
        // `execution:` is the specific stale sibling this catches — a key that belongs to another
        // file's schema. Silently ignoring it is how a repo believes it declared something it did not.
        fileErr(n, 'unknown-key', `unknown top-level key "${key}" — the only top-level key is "corpora"`);
        continue;
      }
      if (sawRoot) {
        fileErr(n, 'duplicate-key', `"corpora" is declared twice (first at line ${rootLine})`);
        continue;
      }
      if (value !== '') {
        fileErr(n, 'bad-value', '"corpora" takes no inline value — declare corpus names on the lines below it');
        continue;
      }
      sawRoot = true;
      rootLine = n;
      current = null;
      block = null;
      continue;
    }

    if (!sawRoot) {
      fileErr(n, 'no-root', 'no "corpora:" root — every declaration nests under it');
      break;
    }

    if (indent === NAME_INDENT) {
      block = null;
      if (value !== '') {
        fileErr(n, 'bad-value', `corpus "${key}" takes no inline value — declare its keys on the lines below it`);
        current = null;
        continue;
      }
      // (No corpus-name character check here: the `key: value` regex above already captures only
      // `[A-Za-z0-9_-]+`, so a name outside that class never reaches this branch. It is caught in
      // the `!kv` branch above instead, where the offending line still exists to name.)
      if (corpora.has(key)) {
        // Two corpora under one name means one of the two declarations is dead, and which one wins
        // is a parser detail nobody should have to know.
        fileErr(n, 'duplicate-corpus', `corpus "${key}" is declared twice (first at line ${corpora.get(key).lines.self})`);
        current = null;
        continue;
      }
      current = makeCorpus(key, n);
      corpora.set(key, current);
      continue;
    }

    if (!current) {
      fileErr(n, 'orphan-key', `"${key}" is not inside a corpus`);
      continue;
    }

    if (indent === KEY_INDENT) {
      block = null;
      const shape = shapeOf(SHAPE.corpus, key);
      if (!shape) {
        corpusErr(current, n, 'unknown-key', `unknown corpus key "${key}" — expected one of ${CORPUS_KEYS.join(', ')}`);
        continue;
      }
      // A repeated key means one of the two declarations is dead, and which one wins is a parser
      // detail nobody should have to know — the same reasoning the duplicate CORPUS name uses.
      if (current.seen.corpus.has(key)) {
        corpusErr(current, n, 'duplicate-key', `corpus key "${key}" is declared twice — remove one`);
        continue;
      }
      current.seen.corpus.add(key);
      if (shape === 'block') {
        if (value !== '') {
          corpusErr(current, n, 'bad-value', `"${key}" takes no inline value — it is a block of its own keys`);
          continue;
        }
        current[key] = { path: null, commit_key: null, hash_key: null, server: null, tools: null, version_tool: null, version_key: null, fetch_tool: null, fetch_key: null };
        // Only the keys this block actually owns survive the prune at the end; carrying the union
        // here keeps one object shape for both blocks.
        current.lines[key] = n;
        block = { name: key, obj: current[key] };
        continue;
      }
      if (shape === 'list') {
        const inline = parseInlineList(value);
        if (inline) {
          if (inline.empty) corpusErr(current, n, 'bad-value', `empty item in the "${key}" list`);
          current.deny = inline.items;
          current.lines.deny = inline.items.map(() => n);
          continue;
        }
        if (value !== '') { corpusErr(current, n, 'bad-value', `"${key}" takes a list — [a, b] or "- a" lines below it`); continue; }
        current.deny = [];
        current.lines.deny = [];
        openList = { key, itemIndent: CHILD_INDENT, items: current.deny, lines: current.lines.deny, corpus: current };
        continue;
      }
      if (value === '') { corpusErr(current, n, 'bad-value', `"${key}" has no value`); continue; }
      if (listInScalarSlot(value)) {
        corpusErr(current, n, 'bad-value', `"${key}" takes a single value — a list was given (${value})`);
        continue;
      }
      current[key] = unquote(value);
      current.lines[key] = n;
      continue;
    }

    if (indent === CHILD_INDENT) {
      if (!block) {
        // Its OWN code, not the file-level `orphan-key`. Every assertion in the suite is on the
        // stable code (P-4), so one code shared across two blast radii leaves the contract unable to
        // express the difference between a mangled file and one over-indented key.
        corpusErr(current, n, 'orphan-key-corpus', `"${key}" is indented under no manifest or remote block`);
        continue;
      }
      const shape = shapeOf(SHAPE[block.name], key);
      if (!shape) {
        const allowed = block.name === 'manifest' ? MANIFEST_KEYS : REMOTE_KEYS;
        corpusErr(current, n, 'unknown-key', `unknown ${block.name} key "${key}" — expected one of ${allowed.join(', ')}`);
        continue;
      }
      if (current.seen[block.name].has(key)) {
        corpusErr(current, n, 'duplicate-key', `${block.name} key "${key}" is declared twice — remove one`);
        continue;
      }
      current.seen[block.name].add(key);
      if (shape === 'list') {
        const inline = parseInlineList(value);
        if (inline) {
          if (inline.empty) corpusErr(current, n, 'bad-value', `empty item in the "${key}" list`);
          block.obj[key] = inline.items;
          current.lines.tools = inline.items.map(() => n);
          continue;
        }
        if (value !== '') { corpusErr(current, n, 'bad-value', `"${key}" takes a list — [a, b] or "- a" lines below it`); continue; }
        block.obj[key] = [];
        current.lines.tools = [];
        openList = { key, itemIndent: DEEP_INDENT, items: block.obj[key], lines: current.lines.tools, corpus: current };
        continue;
      }
      if (value === '') { corpusErr(current, n, 'bad-value', `"${key}" has no value`); continue; }
      if (listInScalarSlot(value)) {
        corpusErr(current, n, 'bad-value', `"${key}" takes a single value — a list was given (${value})`);
        continue;
      }
      block.obj[key] = unquote(value);
      // The keys a finding can point AT, rather than at the block above them: the module's whole
      // posture is that an error names the line it is about.
      if (block.name === 'remote' && key === 'server') current.lines.server = n;
      if (block.name === 'remote' && key === 'version_tool') current.lines.version_tool = n;
      if (block.name === 'remote' && key === 'fetch_tool') current.lines.fetch_tool = n;
      continue;
    }

    fileErr(n, 'bad-indent', `"${key}" is indented ${indent} spaces — deeper than the dialect nests`);
  }

  if (!sawRoot && !errors.some((e) => e.code === 'no-root')) {
    fileErr(firstContentLine || 1, 'no-root', 'no "corpora:" root — every declaration nests under it');
  }

  // A `corpora:` root with nothing under it declares nothing, and a repo that committed the file
  // means to declare something. Left unreported it checks CLEAN — "all 0 declared paths exist" —
  // so an empty declaration would read as a verified one, which is the silent success this reader
  // exists to prevent.
  if (sawRoot && corpora.size === 0 && !errors.length) {
    fileErr(rootLine, 'no-corpora', '"corpora:" is declared with no corpora under it — declare at least one, or remove the file');
  }

  // Per-corpus schema completeness. Done after the walk so a key declared later in the corpus still
  // counts, and so the error can point at the corpus rather than at an arbitrary line.
  for (const corpus of corpora.values()) {
    // A corpus still carrying template text has ONE thing wrong with it — the unreplaced
    // placeholders — and every completeness check below would re-describe that as several: a key
    // whose value was READ AND REFUSED reads out as a key that was never declared. The scaffold
    // recipe's first `--check` is exactly this state, and the shipped template's own lists are
    // placeholders, so the report has to name the one thing to do rather than its consequences.
    // Each one surfaces on the next run, once the placeholders are gone.
    if (corpus.errors.some((e) => e.code === 'unreplaced-placeholder')) continue;

    for (const name of ['manifest', 'remote']) {
      const blk = corpus[name];
      if (!blk) continue;
      for (const k of Object.keys(blk)) {
        if (!(name === 'manifest' ? MANIFEST_KEYS : REMOTE_KEYS).includes(k)) delete blk[k];
      }
      for (const req of REQUIRED[name]) {
        // `blank`, not a null check: `server: ""` parses to the empty string, which is not null and
        // would otherwise satisfy "required" while naming no server at all.
        if (blank(blk[req])) {
          corpusErr(corpus, corpus.lines[name], 'missing-key', `"${name}" is declared without its required "${req}"`);
        }
      }
      if (name === 'remote' && Array.isArray(blk.tools) && blk.tools.length === 0) {
        corpusErr(corpus, corpus.lines[name], 'missing-key', '"remote" declares an empty "tools" list — name the tools the agent may call');
      }
      // Every optional key is validated the same way, whether THIS extension acts on it (the two
      // compare keys) or another one does (`hash_key` and the fetch pair, which the analytics
      // extension's model-channel contract reads): a key this reader accepts and hands on empty is a
      // value its consumer cannot tell from a declaration nobody made.
      if (name === 'manifest' && blk.hash_key !== null && blk.hash_key !== undefined && blank(blk.hash_key)) {
        corpusErr(corpus, corpus.lines[name], 'bad-value', '"manifest.hash_key" is declared empty — give it a key name or remove it');
      }
      if (name === 'remote') {
        // The two `key` entries here are NOT the same grammar, and they sit adjacent on purpose:
        // `version_key` reads a value OUT of an answer object (a dotted path), while `fetch_key`
        // names one argument going IN — an argument name, never a dotted path.
        for (const [optional, what] of [['version_tool', 'tool'], ['version_key', 'key'], ['fetch_tool', 'tool'], ['fetch_key', 'key']]) {
          if (blk[optional] !== null && blk[optional] !== undefined && blank(blk[optional])) {
            corpusErr(corpus, corpus.lines[name], 'bad-value', `"remote.${optional}" is declared empty — give it a ${what} name or remove it`);
          }
        }
        // The version key's grammar is a dotted path of OBJECT keys (`kb.gitCommit`) — the shipped
        // contract says so, and an unenforced rule in a fail-closed reader is exactly the promise
        // this module refuses to make. A version answer is an object of objects, so an index or a
        // space here would be the reader handing the agent something to interpret.
        if (!blank(blk.version_key) && !/^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/.test(blk.version_key)) {
          corpusErr(corpus, corpus.lines[name], 'bad-value',
            `"remote.version_key" is "${blk.version_key}" — it takes a dotted path of object keys, like "kb.gitCommit", with no array indexes`);
        }
        // The fetch key's grammar is ONE ARGUMENT NAME — the parameter of the fetch tool that carries
        // the file's bundle-relative path. A dot here is the version key's grammar copied one line
        // up: it would parse, and hand the consumer an argument name no tool declares.
        if (!blank(blk.fetch_key) && !/^[A-Za-z0-9_-]+$/.test(blk.fetch_key)) {
          corpusErr(corpus, corpus.lines[name], 'bad-value',
            `"remote.fetch_key" is "${blk.fetch_key}" — it takes a single argument name, like "path"; the dotted-path form belongs to "remote.version_key"`);
        }
      }
    }
    // A manifest names the version stamp OF A LOCAL COPY. Without a `path` there is no copy for it
    // to stamp, so the block would be read and its value silently discarded.
    if (corpus.manifest && blank(corpus.path)) {
      corpusErr(corpus, corpus.lines.manifest, 'manifest-without-path',
        '"manifest" stamps the local copy, but this corpus declares no "path" — add the path or remove the manifest');
    }
    // A manifest records WHICH VERSION of an upstream source the local copy is. A private corpus has
    // no upstream — the copy in this repo is the corpus — so a stamp here names a comparison that
    // can never be made. The contract says published and split only; every other kind restriction
    // was enforced and this one was not, so the stamp of a corpus with nothing to be stamped against
    // was read and shown as fact.
    if (corpus.manifest && corpus.kind === 'private') {
      corpusErr(corpus, corpus.lines.manifest, 'manifest-on-private',
        '"manifest" stamps a copy against its upstream source, but this corpus is private — a private corpus has no upstream; remove the manifest or change the kind');
    }
    if (!corpus.kind) {
      corpusErr(corpus, corpus.lines.self, 'missing-kind', `corpus "${corpus.name}" declares no kind — one of ${KINDS.join(', ')}`);
    } else if (!KINDS.includes(corpus.kind)) {
      corpusErr(corpus, corpus.lines.kind, 'unknown-kind', `unknown kind "${corpus.kind}" — one of ${KINDS.join(', ')}`);
    }
  }

  // A file-level error means the STRUCTURE is untrustworthy, so nothing parsed from it may be acted
  // on — returning the corpora that happened to survive would be exactly the half-read file this
  // reader exists to prevent.
  if (errors.some((e) => e.level === 'file')) return { corpora: new Map(), errors };
  return { corpora, errors };
}

// ── the version compare ──────────────────────────────────────────────────────
//
// The compare itself is the AGENT's, run once at first grounding from the injected rule: a hook has
// no MCP client and cannot hold a server's sign-in, so this library ships the compare's INPUTS —
// the callable tool id, the key to read out of its answer, and the local copy's bare stamp — and
// never its result. What it does decide is whether a compare is OWED at all.
//
// A row that owes one carries neither `local` nor `remote` in its channel cell but `compare`: the
// honest static statement about a channel the agent is about to decide is that the compare decides
// it. Calling it `local` would invite grounding on a copy nobody checked; calling it `remote` would
// let the compare be skipped and the remote paid for every time.
//
// Every input has to be present: a published corpus (a private one has no upstream; a split's arms
// are picked per operation, not by currency), BOTH declared keys, a live remote arm, a live local
// copy, and a stamp that was actually read. Any one missing makes the compare UNAVAILABLE with its
// reason on the row — a disclosure, never an unresolution: the corpus still resolves exactly as it
// did before the compare existed.
const COMPARE_INCOMPLETE = 'version_tool and version_key must be declared together';
const COMPARE_ONLY_PUBLISHED = 'compare applies to published corpora only';
const COMPARE_NO_MANIFEST = 'no manifest — nothing to compare';
const COMPARE_NO_STAMP = 'the local stamp was not read — nothing to compare';
const COMPARE_TOOL_DENIED = 'version tool denied';

// THE ONLY WAY A COMPARE COMES OFF THE TABLE, so every caller inherits one rule: FIRST CAUSE WINS.
// A facet that already carries a reason keeps it, and the caller is told so by the return value —
// which is also how a caller knows whether its own condition is what actually cost the corpus its
// compare, and therefore whether it has anything to report. Written once because it was written
// four times: the copy inside the deny check had no such guard, so a denied version tool overwrote
// whatever the declaration had already ruled — reporting a settings fact in place of the
// declaration defect the owner has to fix, and inventing findings for corpora that never owed a
// compare at all.
function demote(facet, reason) {
  if (!facet || facet.status !== 'owed') return false;
  facet.status = 'unavailable';
  facet.reason = reason;
  return true;
}

// The DECLARATION half: everything decidable from the file alone. Returns null when the corpus said
// nothing about a compare, so `compare` never becomes a field every row carries.
function buildCompare(corpus) {
  const remote = corpus.remote || {};
  const tool = blank(remote.version_tool) ? null : remote.version_tool;
  const key = blank(remote.version_key) ? null : remote.version_key;
  if (!tool && !key) return null;
  const facet = {
    tool: tool ? toolId(remote.server, tool) : null,
    key,
    stamp: null,
    status: 'owed',
    reason: null,
  };
  const stop = (reason) => { demote(facet, reason); return facet; };
  // ONE key without the other is a contradiction in the declaration, not a run-time excuse: the tool
  // answers for a whole server, so without the key nobody can say which of its values belongs to
  // this corpus — and that judgment is exactly what the declaration exists to take away.
  if (!tool || !key) return stop(COMPARE_INCOMPLETE);
  if (corpus.kind !== 'published') return stop(COMPARE_ONLY_PUBLISHED);
  if (!corpus.manifest) return stop(COMPARE_NO_MANIFEST);
  return facet;
}

// ── the per-file fetch ───────────────────────────────────────────────────────
//
// Same division of labour as the compare above: the fetch is the ANALYTICS extension's to run, and
// this library ships only its declared inputs — the tool to call, and the name of the argument that
// carries the file's bundle-relative path. Nothing here calls anything.
//
// ONE key without the other is a contradiction in the declaration, not a run-time excuse. A tool
// with no argument name leaves the caller to guess which parameter takes the path — the judgment the
// declaration exists to remove — and an argument name with no tool names a parameter of nothing. So
// half a pair is reported AND ignored: carried onto the row, it would be read as a usable input.
const FETCH_INCOMPLETE = 'fetch_tool and fetch_key must be declared together';

// THE INVARIANT, in one place: a fetch pair is on a row only while that row could actually use it.
// The pair has no facet of its own — the compare records a loss as a `status` and a `reason`, and a
// pair records it by ceasing to be an input — so this is the whole of its state machine.
//
// BOTH statuses, not just the arm's. A corpus can end `unresolved` with a perfectly live remote arm:
// an ordinary split whose local directory has been deleted is the case a real repo hits, and the
// injected resolver rule tells the agent to refuse to ground from that corpus at all. A row that
// refuses to be grounded from must not still advertise a way to fetch its files.
//
// Called at the end of BOTH resolution passes, because each can be the one that decides: `resolve()`
// unresolves a corpus whose declaration contradicts itself, and `reResolve()` unresolves one the
// repo's real files did. A guard placed in the deny check alone runs too early to see the second.
function clearFetchIfUnusable(row) {
  if (!row.remote) return;
  if (row.status === 'resolved' && row.remote.status === 'resolved') return;
  row.remote.fetch_tool = null;
  row.remote.fetch_key = null;
}

function buildFetch(corpus) {
  const remote = corpus.remote || {};
  const tool = blank(remote.fetch_tool) ? null : remote.fetch_tool;
  const key = blank(remote.fetch_key) ? null : remote.fetch_key;
  if (tool && key) return { tool, key, declared: null, missing: null };
  if (!tool && !key) return { tool: null, key: null, declared: null, missing: null };
  return {
    tool: null,
    key: null,
    declared: tool ? 'fetch_tool' : 'fetch_key',
    missing: tool ? 'fetch_key' : 'fetch_tool',
  };
}

/**
 * The WORLD half, applied wherever a row's arms are current: in the static pass it can only confirm
 * what the declaration promised (`checked` false — nothing has been stat'ed yet); after `check()` it
 * sees the arms and the stamp and demotes a compare whose inputs did not survive them.
 *
 * FIRST CAUSE WINS. A reason already on the facet is never overwritten — the owner needs the cause,
 * and the last check to run is not the one that explains anything.
 */
function applyCompare(row, checked) {
  const c = row.compare;
  if (!c || c.status !== 'owed') return;

  if (!row.local || row.local.status !== 'resolved') {
    demote(c, (row.local && row.local.reason) || 'no local copy — nothing to compare');
  } else if (!row.remote || row.remote.status !== 'resolved') {
    // The remote is the side the compare would be made AGAINST, so an unusable remote arm leaves
    // nothing to compare to. The corpus falls back to its local copy, currency unverified.
    demote(c, (row.remote && row.remote.reason) || 'no remote — nothing to compare against');
  } else if (checked) {
    // The BARE stamp value: `row.local.stamp` is rendered as `{commit_key}={value}` for the table's
    // stamp cell, and the version tool answers the value alone. Handing the agent the prefixed form
    // to compare against would make every compare read "different".
    if (row.local.stamp) c.stamp = String(row.local.stamp).slice(String(row.manifest.commit_key).length + 1);
    else demote(c, COMPARE_NO_STAMP);
  }

  // Promoted only over `remote` — the channel the F85 rule chose for a published corpus with both
  // arms live. An unresolved row has a null channel and keeps it: a channel named on an unresolved
  // row is the fallback the resolver rule forbids.
  if (c.status === 'owed' && row.channel === 'remote') row.channel = 'compare';
}

/**
 * resolve(corpora, ctx) -> Row[]
 *
 * The STATIC pass: what each corpus's kind entitles it to, given what it declared. No filesystem and
 * no settings — `check()` applies those and returns the rows re-resolved. The compare facet is built
 * here from the declaration alone and FINALIZED by `check()`, which is the only pass that can see
 * whether the copy, the stamp and the tool survived the repo's real files and permissions.
 *
 * A Row is what the emitted table renders and what a consuming skill reads:
 *   { corpus, kind, line, channel, status, reason, local, remote, compare, notes, findings }
 * with `channel` one of 'local' | 'remote' | 'both' | 'compare' | null, and each ARM carrying its own
 * status — a published corpus can lose its local arm and still be resolved to its remote.
 */
function resolve(corpora, ctx) {
  void ctx; // the static pass takes no filesystem; the parameter is the shape check() shares
  const rows = [];
  for (const corpus of corpora.values()) {
    const findings = corpus.errors.slice();
    const notes = [];
    const row = {
      corpus: corpus.name,
      kind: corpus.kind || null,
      line: corpus.lines.self,
      channel: null,
      status: 'unresolved',
      reason: null,
      local: corpus.path ? { path: corpus.path, exists: null, stamp: null, status: 'resolved', reason: null } : null,
      remote: corpus.remote
        ? {
          server: corpus.remote.server,
          tools: (corpus.remote.tools || []).slice(),
          // Filled in below, past the parse guard — the same posture `compare` takes: a corpus whose
          // declaration did not parse must not present any of its keys as usable inputs.
          fetch_tool: null,
          fetch_key: null,
          status: 'resolved',
          reason: null,
        }
        : null,
      manifest: corpus.manifest ? { path: corpus.manifest.path, commit_key: corpus.manifest.commit_key, hash_key: corpus.manifest.hash_key || null } : null,
      compare: null,
      deny: corpus.deny.slice(),
      lines: corpus.lines,
      parseFailed: false,
      notes,
      findings,
    };

    const fail = (line, code, message) => {
      const f = finding('corpus', code, message, { corpus: corpus.name, line });
      findings.push(f);
      row.status = 'unresolved';
      row.channel = null;
      if (!row.reason) row.reason = message;
      return f;
    };

    // A corpus whose declaration did not fully parse is not a corpus this plugin will resolve —
    // its remaining keys may be exactly the ones the broken line was about. Flagged rather than
    // inferred later: `check()` has to tell "the keys are untrustworthy, skip the world checks"
    // from "the keys are fine, this corpus merely failed to resolve" — the second still owes its
    // deny-presence and path checks, which are facts about the REPO, not about the corpus.
    if (corpus.errors.length) {
      row.parseFailed = true;
      row.reason = corpus.errors[0].message;
      rows.push(row);
      continue;
    }

    if (corpus.kind === 'private') {
      // "Private" means the copy in this repo IS the corpus. A remote alongside it is not a richer
      // declaration, it is a contradiction about what the corpus is.
      if (corpus.remote) {
        fail(corpus.lines.remote, 'remote-on-private', 'a private corpus declares a remote — a private corpus exists only as its local copy');
      } else if (!corpus.path) {
        fail(corpus.lines.self, 'missing-path', 'a private corpus declares no path — the local copy is its only channel');
      } else {
        row.channel = 'local';
        row.status = 'resolved';
      }
    } else if (corpus.kind === 'published') {
      if (corpus.remote) {
        row.channel = 'remote';
        row.status = 'resolved';
      } else if (corpus.path) {
        row.channel = 'local';
        row.status = 'resolved';
        notes.push('no remote declared — local copy, currency unverified');
      } else {
        fail(corpus.lines.self, 'no-channel', 'a published corpus declares neither a path nor a remote — nothing to ground from');
      }
    } else if (corpus.kind === 'split') {
      // Both arms are required BEFORE either is usable: the consuming skill picks per operation, so
      // a half-declared split would silently become whichever arm happened to survive.
      if (!corpus.path) fail(corpus.lines.self, 'missing-path', 'a split corpus declares no path — it needs both a local copy and a remote');
      if (!corpus.remote) fail(corpus.lines.self, 'missing-remote', 'a split corpus declares no remote — it needs both a local copy and a remote');
      if (corpus.path && corpus.remote) {
        row.channel = 'both';
        row.status = 'resolved';
      }
    }

    // The fetch pair, on the same seam as the compare finding below: a corpus-level finding that does
    // NOT unresolve. `fail()` would take down a corpus whose every other key is fine, and `parse()`'s
    // `corpusErr()` would set `parseFailed` and skip the world checks — whether the repo's settings
    // deny this corpus's tools is still a fact worth reporting.
    const fetch = buildFetch(corpus);
    if (row.remote) {
      row.remote.fetch_tool = fetch.tool;
      row.remote.fetch_key = fetch.key;
    }
    if (fetch.declared) {
      findings.push(finding('corpus', 'fetch-incomplete',
        `corpus "${corpus.name}" declares "remote.${fetch.declared}" without "remote.${fetch.missing}" — ${FETCH_INCOMPLETE}, or the fetch cannot say which argument of that tool carries the file's path`,
        { corpus: corpus.name, line: corpus.lines.remote || corpus.lines.self }));
    }

    row.compare = buildCompare(corpus);
    if (row.compare && row.compare.reason === COMPARE_INCOMPLETE) {
      // A corpus-level finding that does NOT unresolve, and deliberately neither of the two seams
      // beside it: `fail()` would unresolve a corpus whose every other key is fine, and `parse()`'s
      // `corpusErr()` would set `parseFailed` and skip the world checks — whether the repo's
      // settings carry this corpus's deny entries is still a fact worth reporting. Same posture as
      // `path-outside-root` on a kind that survives it.
      const missing = row.compare.tool ? 'version_key' : 'version_tool';
      const declared = row.compare.tool ? 'version_tool' : 'version_key';
      findings.push(finding('corpus', 'compare-incomplete',
        `corpus "${corpus.name}" declares "remote.${declared}" without "remote.${missing}" — ${COMPARE_INCOMPLETE}, or the compare cannot say which value in the tool's answer belongs to this corpus`,
        { corpus: corpus.name, line: corpus.lines.remote || corpus.lines.self }));
    }
    applyCompare(row, false);
    clearFetchIfUnusable(row);

    rows.push(row);
  }
  return rows;
}

// ── the check ────────────────────────────────────────────────────────────────

// The three layers a deny can be effective from. A deny in ANY of them wins over every allow, so a
// verbatim search of the project file alone would emit a false gap every session for a repo that
// denies at the user level or by wildcard.
const SETTINGS_LAYERS = [
  ['.claude/settings.json', 'project'],
  ['.claude/settings.local.json', 'project-local'],
];

// Does a deny entry cover a specific tool id? The platform's documented forms are the bare server
// prefix (every tool of that server), the per-server wildcard, and the two broad globs.
function denyCovers(entry, toolId) {
  const raw = String(entry || '').trim();
  if (!raw) return false;
  // An entry always covers ITSELF. Without this, the bare-server form below is rewritten to
  // `{server}__*` and then fails to match the un-suffixed id it came from — so the same predicate
  // would answer differently at its two call sites (the gap check compensated locally; the
  // contradiction check did not, and silently found no contradiction).
  if (raw === String(toolId)) return true;
  let pattern = raw;
  // `mcp__{server}` with no tool segment and no wildcard means the whole server.
  if (pattern.indexOf('mcp__') === 0 && pattern.indexOf('*') === -1 && pattern.slice(5).indexOf('__') === -1) {
    pattern += '__*';
  }
  const rx = new RegExp('^' + pattern.split('*').map(escapeForRegExp).join('[\\s\\S]*') + '$');
  return rx.test(toolId);
}

function escapeForRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// PATH CONTAINMENT (D-21). A declared path is repo-relative and must stay inside the repo once
// resolved. This is not hygiene: `readStamp` below pulls one line's value out of `manifest.path` and
// into every session's context, so an uncontained `manifest.path: ../../../secrets.env` would let a
// committed declaration read an arbitrary file on disk into the agent's context on every start. An
// escaping path is neither stat'ed nor read — refusing to look is the whole point.
//
// `path.resolve` for the COMPARISON only; the read path stays `path.join(root, rel)` so the tests'
// injected filesystem keeps its platform-independent keys. Both sides resolve against the same cwd,
// so the prefix test is sound on either platform. An ABSOLUTE declared path fails here too, which is
// correct — the schema says repo-relative.
function insideRoot(root, rel) {
  const base = path.resolve(root);
  const full = path.resolve(root, rel);
  return full === base || full.indexOf(base + path.sep) === 0;
}

// A declared tool may be written bare (`search`) or already qualified (`mcp__{server}__search`).
function toolId(server, tool) {
  return String(tool).indexOf('mcp__') === 0 ? String(tool) : 'mcp__' + server + '__' + tool;
}

// One line-anchored read of a version stamp, format-free by design: a manifest is as likely to be a
// JSON file as a markdown front-matter header, and a `manifest.format:` key would be one more thing
// for a repo to get wrong.
//
// SHALLOWEST WINS, TIES FAIL CLOSED. The pattern is line-anchored but not PATH-anchored, so a nested
// object carrying the same key name matches too — and taking the first match would quietly show a
// nested homonym's value as the corpus's version, wrong data presented as fact on the one field the
// resolver rule tells the agent to quote back. Indentation is the only structure available without a
// parser, so the outermost match wins; two equally-shallow matches that disagree are ambiguous and
// return null (reported as an unreadable stamp) rather than picking one.
function readStamp(text, key) {
  const k = escapeForRegExp(String(key));
  // The optional leading `{` admits COMPACT single-line JSON (`{"key": "value"}`) — a manifest
  // written by `JSON.stringify` with no indent is an ordinary shape, and rejecting it produced a
  // "stamp unreadable" finding against a perfectly good file. Still line-anchored: this reads one
  // line, it does not parse JSON.
  const rx = new RegExp('^([ \\t]*)\\{?[ \\t]*["\']?' + k + '["\']?[ \\t]*:[ \\t]*(.*)$');
  let best = null;
  for (const line of stripBom(text).split(/\r\n|\r|\n/)) {
    const m = line.match(rx);
    if (!m) continue;
    const depth = m[1].replace(/\t/g, '  ').length;
    // Same trailing-syntax trims the declaration dialect applies: an inline comment, then a trailing
    // JSON object close and comma, then surrounding quotes of either kind.
    let value = stripInlineComment(m[2]).trim().replace(/[},][ \t}]*$/, '').trim();
    value = unquote(value);
    if (value === '') continue;
    if (!best || depth < best.depth) { best = { depth, value }; continue; }
    if (depth === best.depth && best.value !== value) best.ambiguous = true;
  }
  if (!best || best.ambiguous) return null;
  return best.value;
}

/**
 * check(rows, ctx) -> { rows, findings }
 *
 * Settings and filesystem facts applied to the static rows. The rows come back RE-RESOLVED: a check
 * that unresolves an arm changes that row's status cell, so the caller must use the returned rows
 * and never the ones it passed in.
 */
function check(rows, ctx) {
  const findings = [];
  const add = (code, message, extra) => {
    const f = finding('check', code, message, extra || {});
    findings.push(f);
    return f;
  };
  // A containment failure is a fact about the DECLARATION, not about the world the check inspects —
  // the same class as an unknown key — so it carries the corpus level and its blast radius.
  const addCorpus = (code, message, extra) => {
    const f = finding('corpus', code, message, extra || {});
    findings.push(f);
    return f;
  };
  // The compare has lost its comparand. Recorded only while the local copy ITSELF is still there:
  // when the copy is gone the stamp is the smaller half of that fact, and a compare cell reading
  // "manifest-missing" beside a local cell reading "(missing)" names the wrong cause. The dead arm
  // is `applyCompare`'s to name, from the arm's own reason.
  const noComparand = (row, reason) => {
    if (row.local && row.local.status === 'resolved') demote(row.compare, reason);
  };

  // ── the deny set, read once across all three layers ──
  const denies = [];
  const layerPaths = SETTINGS_LAYERS.map(([rel, label]) => [path.join(ctx.root, rel), label]);
  // The USER layer lives in the Claude CONFIG DIRECTORY, which is not always `{homedir}/.claude`:
  // `CLAUDE_CONFIG_DIR` redirects it, and a machine carrying two profiles is an ordinary state. The
  // hardcoded home-relative join read a file that was not this session's settings at all — a deny
  // already in force went unseen, and every session re-reported a gap the owner had closed.
  // Resolved HERE rather than at every call site so the guard keys on the resolved value: a ctx
  // injecting `homedir` alone keeps the fallback (the shape most tests use), and a ctx naming
  // neither skips the layer exactly as `if (ctx.homedir)` did.
  const userConfigDir = ctx.configDir || (ctx.homedir && path.join(ctx.homedir, '.claude'));
  if (userConfigDir) layerPaths.push([path.join(userConfigDir, 'settings.json'), 'user']);
  for (const [file, label] of layerPaths) {
    if (!ctx.exists(file)) continue;
    let parsed;
    try {
      parsed = JSON.parse(stripBom(ctx.readFile(file)));
    } catch (e) {
      // Fail OPEN on the check's own inputs: one broken settings file must not cost the session its
      // channel table. The remaining layers are still read.
      add('settings-unreadable', `the ${label} settings layer could not be read as JSON — deny entries in it were not seen`, { file });
      continue;
    }
    const list = parsed && parsed.permissions && parsed.permissions.deny;
    if (Array.isArray(list)) for (const entry of list) denies.push(entry);
  }
  const isDenied = (id) => denies.some((entry) => denyCovers(entry, id));

  for (const row of rows) {
    if (row.parseFailed) {
      // The corpus's keys did not parse, so its declared paths and deny entries may be exactly what
      // the broken line was about — checking them would report noise about values the repo never
      // successfully declared. A corpus that parsed fine and merely failed to RESOLVE is not
      // skipped: whether the repo's settings carry its deny entries is a fact about the settings.
      continue;
    }

    // ── declared deny entries must already be in force ──
    for (let i = 0; i < row.deny.length; i++) {
      const entry = row.deny[i];
      if (denies.some((d) => denyCovers(d, entry) || d === entry)) continue;
      add('deny-gap', `"${entry}" is declared as denied for corpus "${row.corpus}" but no settings layer denies it — add it to permissions.deny`,
        { corpus: row.corpus, line: row.lines.deny[i] || row.line });
    }

    // ── a declared remote tool the platform has made uncallable ──
    if (row.remote && row.remote.server) {
      const denied = [];
      for (let i = 0; i < row.remote.tools.length; i++) {
        const tool = row.remote.tools[i];
        if (!isDenied(toolId(row.remote.server, tool))) continue;
        denied.push(tool);
        add('tool-denied', `corpus "${row.corpus}" declares remote tool "${tool}" but a settings layer denies it — the declared channel is uncallable`,
          { corpus: row.corpus, line: row.lines.tools[i] || row.lines.remote || row.line });
      }
      if (denied.length) {
        row.remote.status = 'unresolved';
        row.remote.reason = `declared tool${denied.length > 1 ? 's are' : ' is'} denied: ${denied.join(', ')}`;
      }

      // ── the version tool, denied ──
      // Its OWN code, not `tool-denied`: that code means "the remote ARM is now unresolved", and one
      // code across two blast radii is the thing this library rejects in writing a few lines above.
      // Only `tools` entries govern the arm — a denied version tool costs the corpus its compare and
      // nothing else.
      //
      // Reported only when the compare was not ALREADY RULED OUT BY THE DECLARATION (`demote` says
      // so): a split, half a declared pair or no manifest has nothing to lose to this deny, and a
      // finding there would turn a clean declaration into a validate-recipe failure over a tool
      // that was never going to be called. Declaration-time causes only — this check runs before
      // the path and stamp checks, so a corpus whose local copy turns out to be missing reports
      // both this and its own finding. Both are true; neither is invented.
      if (row.compare && row.compare.tool && isDenied(row.compare.tool) &&
          demote(row.compare, COMPARE_TOOL_DENIED)) {
        add('version-tool-denied',
          `corpus "${row.corpus}" declares version tool "${row.compare.tool}" but a settings layer denies it — the version compare cannot run for this corpus`,
          { corpus: row.corpus, line: row.lines.version_tool || row.lines.remote || row.line });
      }

      // ── the fetch tool, denied ──
      // A third code, for the same reason the second one exists: a denied fetch tool costs the corpus
      // its per-file fetch and nothing else, so folding it into `tool-denied` would say the remote
      // arm is gone when it is not.
      //
      // Reported only over a fetch that could actually have run, which takes BOTH halves of the
      // version tool's guard — its `demote()` refuses on an incomplete pair AND on a compare the
      // declaration had already ruled out, and only the first half has an obvious analogue here:
      //   * `row.remote.fetch_tool` is non-null only when the PAIR is complete (half a pair already
      //     raises `fetch-incomplete`, and one defect earns one finding);
      //   * `row.status` is still `resolve()`'s verdict at this point — the `tools` deny above sets
      //     the ARM's status, never the row's — so an unresolved corpus is one whose declaration
      //     already forbids or lost the remote. A private corpus that illegally declares a remote
      //     would otherwise collect a second finding about a tool that can never be called, which is
      //     exactly what the version guard beside it exists to prevent.
      if (row.status === 'resolved' && row.remote.fetch_tool) {
        const fetchId = toolId(row.remote.server, row.remote.fetch_tool);
        if (isDenied(fetchId)) {
          add('fetch-tool-denied',
            `corpus "${row.corpus}" declares fetch tool "${fetchId}" but a settings layer denies it — no file of this corpus can be fetched from the source`,
            { corpus: row.corpus, line: row.lines.fetch_tool || row.lines.remote || row.line });
          // AND the pair comes off the row. The contract promises "no per-file fetch"; leaving the
          // inputs sitting there says the opposite in the only place a consumer could read it. This
          // is the fetch's version of `demote()` — the compare records its loss as a status and a
          // reason, and a pair with no facet records it by ceasing to be an input.
          row.remote.fetch_tool = null;
          row.remote.fetch_key = null;
        }
      }
    }

    // ── declared paths must exist, and must be inside the repo ──
    if (row.local) {
      if (!insideRoot(ctx.root, row.local.path)) {
        // Not stat'ed: `exists` on a path the declaration should never have been able to name is
        // still a fact about a file outside the repo, reported back into the session.
        row.local.status = 'unresolved';
        row.local.reason = 'path resolves outside the repo root';
        addCorpus('path-outside-root',
          `corpus "${row.corpus}" declares path "${row.local.path}", which resolves outside the repo root — a declared path is repo-relative and stays inside the repo`,
          { corpus: row.corpus, line: row.lines.path || row.line });
      } else {
        const full = path.join(ctx.root, row.local.path);
        row.local.exists = ctx.exists(full);
        if (!row.local.exists) {
          row.local.status = 'unresolved';
          row.local.reason = 'local copy missing';
          add('path-missing', `corpus "${row.corpus}" declares path "${row.local.path}" but it does not exist`,
            { corpus: row.corpus, line: row.lines.path || row.line });
        }
      }
    }

    // ── the version stamp ──
    if (row.manifest && row.manifest.path && !insideRoot(ctx.root, row.manifest.path)) {
      // Neither stat'ed nor read. This is the containment case that matters most: the stamp read
      // puts one line of the named file into the envelope, and the envelope reaches the model.
      addCorpus('path-outside-root',
        `corpus "${row.corpus}" declares manifest "${row.manifest.path}", which resolves outside the repo root — the stamp is not read`,
        { corpus: row.corpus, line: row.lines.manifest || row.line });
      noComparand(row, 'manifest outside the repo — no local version to compare');
    } else if (row.manifest && row.manifest.path) {
      const full = path.join(ctx.root, row.manifest.path);
      if (!ctx.exists(full)) {
        // A finding, never an unresolution: a missing stamp file means the copy's version is unknown,
        // not that the copy is gone. The compare loses its comparand and names the existing cause —
        // no new finding code, because nothing new is wrong.
        add('manifest-missing', `corpus "${row.corpus}" declares manifest "${row.manifest.path}" but it does not exist — the local copy's version is unknown`,
          { corpus: row.corpus, line: row.lines.manifest || row.line });
        noComparand(row, 'manifest-missing — no local version to compare');
      } else {
        let value = null;
        try {
          value = readStamp(ctx.readFile(full), row.manifest.commit_key);
        } catch (e) {
          value = null;
        }
        if (value === null) {
          add('stamp-unreadable', `corpus "${row.corpus}" declares stamp key "${row.manifest.commit_key}" but the manifest does not carry it`,
            { corpus: row.corpus, line: row.lines.manifest || row.line });
          noComparand(row, 'stamp-unreadable — no local version to compare');
        } else if (row.local) {
          row.local.stamp = row.manifest.commit_key + '=' + value;
        }
      }
    }

    reResolve(row);
  }

  return { rows, findings };
}

// Recompute a row's channel and status from its ARMS, after the check has had its say. Kept separate
// from resolve() because the inputs differ (declaration vs. world) while the kind rule is identical —
// two copies of that rule is how a status cell drifts away from the findings beside it.
function reResolve(row) {
  const localOk = !!row.local && row.local.status === 'resolved';
  const remoteOk = !!row.remote && row.remote.status === 'resolved';
  if (row.kind === 'private') {
    row.channel = localOk ? 'local' : null;
  } else if (row.kind === 'published') {
    if (remoteOk) row.channel = 'remote';
    else if (localOk) row.channel = 'local';
    else row.channel = null;
    if (!remoteOk && localOk && row.remote) {
      // Name WHY the remote is gone. "remote unresolved" tells the owner nothing actionable; the
      // reason is the one fact that says whether to fix settings or fix the declaration.
      row.notes.push('remote unusable (' + (row.remote.reason || 'unresolved') +
        ') — local copy, currency unverified');
    }
  } else if (row.kind === 'split') {
    if (localOk && remoteOk) row.channel = 'both';
    else if (localOk) row.channel = 'local';
    else if (remoteOk) row.channel = 'remote';
    else row.channel = null;
  }

  const armsRequired = row.kind === 'split' ? localOk && remoteOk : row.channel !== null;
  if (!armsRequired) {
    row.status = 'unresolved';
    if (!row.reason) {
      row.reason = (row.remote && row.remote.reason) || (row.local && row.local.reason) || 'no usable channel';
    }
    // Blanked for EVERY kind, split included. The resolver rule tells the agent not to fall back to
    // the other channel when a corpus is unresolved; an unresolved row that still names a surviving
    // channel in its channel cell is precisely the invitation to do it anyway. The arms stay visible
    // in their own cells, so nothing is hidden — it just is not presented as "the channel to use".
    row.channel = null;
  }
  if (row.local && !row.local.exists && row.local.exists !== null && row.channel === 'remote') {
    if (!row.notes.some((n) => /local copy missing/i.test(n))) row.notes.push('local copy missing');
  }
  // The containment refusal leaves a THIRD arm state — `exists` null because the path was never
  // stat'ed — that the missing-copy note above cannot reach. On a kind that survives the loss the
  // row still reads `resolved`, so without this the table presents an unusable path as an ordinary
  // local copy and only the Checks section says otherwise.
  if (row.local && row.local.exists === null && row.channel === 'remote' &&
      /outside the repo/i.test(row.local.reason)) {
    if (!row.notes.some((n) => /outside the repo/i.test(n))) {
      row.notes.push('local copy outside the repo (not read)');
    }
  }
  // Last, and after the status is settled: the compare can only be owed on a row that resolved, and
  // it may only take over a channel the kind rule above has already chosen.
  applyCompare(row, true);
  // LAST, and the placement is load-bearing. This is the FIRST point at which a corpus the repo's
  // real files unresolved — a split whose local copy is gone — is known to be unresolved: the status
  // flip happens a few lines above, long after the deny check ran. The same call one seam earlier,
  // beside that deny check, still sees `resolved` on both the row and the arm and leaves the pair on
  // a row that is about to refuse grounding. Pinned by the missing-local-copy case of "an UNRESOLVED
  // corpus carries no fetch pair", which goes red on exactly that move.
  clearFetchIfUnusable(row);
}

// ── the received template ────────────────────────────────────────────────────
//
// A repo can be HANDED a filled `access.template.yaml` — by the corpus's publisher, or by the person
// who set up the last repo — and should not have to say where it put it. These three functions are
// what the guided setup and the session-start nudge are built on: find that file, remember which
// version of it a declaration was drafted from, and notice when a newer one arrives.
//
// STILL NOTHING HERE WRITES. The stamp is written by the SKILL, at draft time, into the declaration
// it is drafting; this module only reads it back.

// Directory entries as `{ name, isDirectory }` plain objects rather than `fs.Dirent`, so an injected
// ctx can hand the walk a listing without constructing a platform type. A symlinked directory reports
// `isDirectory` false and is therefore never descended, which also keeps the walk loop-free.
const realReaddir = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));

const TEMPLATE_NAME = 'access.template.yaml';
// Depth counts the SEGMENTS of the repo-relative path, so a template at the repo root is depth 1 and
// `docs/access/setup/access.template.yaml` is the deepest one found. This walk runs at session start
// in every repo that installs the extension, so it is bounded rather than exhaustive: a monorepo's
// session must not pay for a full-tree scan, and a template nobody can find in four segments is one
// the human can name in the conversation instead.
const TEMPLATE_MAX_DEPTH = 4;
// Directories that are somebody else's tree or a build output. A template found under any of them is
// not this repo's declaration source — `.claude/` included, where the DECLARATION lives rather than
// the template it was drafted from.
const TEMPLATE_IGNORE = new Set([
  'node_modules', '.git', '.claude', 'bin', 'obj', 'dist', 'build', 'out', 'target', 'vendor',
  'packages', '.dart_tool', 'coverage',
]);

/**
 * findReceivedTemplate(root, ctx) -> string | null
 *
 * The repo-relative path (forward slashes) of a received `access.template.yaml`, or null. Breadth
 * first, so the shallowest candidate wins, with each directory's entries sorted by name so two
 * candidates at one depth resolve the same way on every machine — the nudge names the path it found,
 * and a walk that answered by directory order would name a different file on two clones of one repo.
 *
 * `ctx.readdir` is injected by the tests; the real filesystem is the default. An unreadable directory
 * is skipped rather than fatal: this runs on the session-start path, where a permissions error in one
 * subdirectory must not cost the session its envelope.
 */
function findReceivedTemplate(root, ctx) {
  const readdir = (ctx && ctx.readdir) || realReaddir;
  const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const queue = [{ dir: root, rel: '', depth: 1 }];
  while (queue.length) {
    const { dir, rel, depth } = queue.shift();
    let entries;
    try {
      entries = readdir(dir).slice().sort(byName);
    } catch (e) {
      continue;
    }
    // Files of THIS directory before any subdirectory of it, which is what makes the walk breadth
    // first: the queue only ever holds directories one level deeper than the one being read.
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (entry.name === TEMPLATE_NAME) return rel ? rel + '/' + entry.name : entry.name;
    }
    if (depth >= TEMPLATE_MAX_DEPTH) continue;
    for (const entry of entries) {
      if (!entry.isDirectory || TEMPLATE_IGNORE.has(entry.name)) continue;
      queue.push({
        dir: path.join(dir, entry.name),
        rel: rel ? rel + '/' + entry.name : entry.name,
        depth: depth + 1,
      });
    }
  }
  return null;
}

/**
 * templateStamp(content) -> 16 lowercase hex chars
 *
 * NORMALIZED BEFORE HASHING, and that is the whole subtlety — twice over. Git rewrites line endings
 * on checkout, and Windows editors add a byte-order mark on save, so a stamp taken over the bytes as
 * they sit on disk would differ between two clones of one repo and nag every one of them about a
 * template it had already drafted from. Both normalizations are the ones this module already applies
 * to every file it reads.
 */
function templateStamp(content) {
  const lf = stripBom(String(content == null ? '' : content)).replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(lf, 'utf8').digest('hex').slice(0, 16);
}

// The stamp a drafted declaration carries, as its own full-line comment. A COMMENT and not a key,
// deliberately: the dialect already ignores full-line comments, so a declaration drafted by the
// guided setup stays readable by every version of this reader, including the ones that shipped before
// the stamp existed.
//
// Deliberately NOT named `readStamp` — that one reads a MANIFEST's commit stamp, an unrelated
// concept, and one word for two would be read as one mechanism by everyone who meets the second.
const DRAFTED_FROM = /^[ \t]*#[ \t]*drafted-from:[ \t]*sha256:([0-9a-f]{16})[ \t]*$/;

/**
 * readDraftedFrom(text) -> 16 hex chars | null
 *
 * The first well-formed `# drafted-from:` line of a declaration's raw text. Absent — a hand-written
 * declaration, or any declaration written before this line existed — is null, and null means the
 * refresh check never runs for that repo: no walk, no nag.
 */
function readDraftedFrom(text) {
  for (const line of stripBom(String(text == null ? '' : text)).split(/\r\n|\r|\n/)) {
    const m = line.match(DRAFTED_FROM);
    if (m) return m[1];
  }
  return null;
}

/**
 * load(root, { homedir, configDir }) -> { present, corpora, rows, findings, draftedFrom }
 *
 * The one entry point that touches a real filesystem. `rows` is check()'s output, `findings` is the
 * parse errors and the check findings in one list — what the envelope and the `--check` report both
 * render. `draftedFrom` is the declaration's `# drafted-from:` stamp, or null. `present: false` means
 * the repo declared nothing, which is not a finding — and this function still costs that repo
 * nothing: what an undeclared repo now pays for is the caller's onboarding nudge, not this read.
 */
function load(root, opts) {
  const options = opts || {};
  const homedir = options.homedir || os.homedir();
  // `CLAUDE_CONFIG_DIR` names the config directory itself, not a parent of it — so it is used as
  // given, and `{homedir}/.claude` is the fallback rather than the rule. Null when there is no home
  // either, so `check()` skips the user layer exactly as it did before this resolution existed —
  // joining onto an empty home would have produced a path that is nobody's settings file.
  const configDir = options.configDir || process.env.CLAUDE_CONFIG_DIR ||
    (homedir ? path.join(homedir, '.claude') : null);
  const file = path.join(root, '.claude', 'access.yaml');
  const ctx = {
    root,
    homedir,
    configDir,
    exists: (p) => fs.existsSync(p),
    readFile: (p) => fs.readFileSync(p, 'utf8'),
    readdir: realReaddir,
  };
  if (!ctx.exists(file)) {
    return { present: false, corpora: new Map(), rows: [], findings: [], draftedFrom: null };
  }

  let text;
  try {
    text = ctx.readFile(file);
  } catch (e) {
    return {
      present: true,
      corpora: new Map(),
      rows: [],
      findings: [finding('file', 'unreadable', 'the declaration file exists but could not be read', { line: 1 })],
      draftedFrom: null,
    };
  }

  const { corpora, errors } = parse(text);
  const out = check(resolve(corpora, ctx), ctx);
  // RESOLVE-time failures are findings too. They live only on their row (a split that declared one
  // arm raises no parse error and no check finding), so concatenating just those two lists reported
  // "no findings" underneath a row that reads `unresolved` — and silenced the stderr warning with
  // it. Identity-filtered against `errors` because a row's `findings` already carries its parse
  // errors by reference.
  const rowFindings = [];
  for (const row of out.rows) {
    for (const f of row.findings) if (!errors.includes(f)) rowFindings.push(f);
  }
  // ADDITIVE. `draftedFrom` is read here because the raw text is already in hand — a caller that
  // wanted it would otherwise read the declaration a second time at session start, for one comment
  // line. Every existing consumer of `{ present, corpora, rows, findings }` is unaffected.
  return {
    present: true,
    corpora,
    rows: out.rows,
    findings: errors.concat(rowFindings, out.findings),
    draftedFrom: readDraftedFrom(text),
  };
}

module.exports = {
  parse, resolve, check, load,
  denyCovers, toolId, readStamp,
  findReceivedTemplate, templateStamp, readDraftedFrom,
  KINDS, CORPUS_KEYS, MANIFEST_KEYS, REMOTE_KEYS,
};
