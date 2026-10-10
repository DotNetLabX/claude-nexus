#!/usr/bin/env node
/**
 * Nexus doc-anchoring close gate (F48). Manually invoked — NOT a registered hook, so there is no
 * hooks.json entry (unregistered-script precedent: salvage-transcript.js). The session-start
 * payload's resolved-plugin-paths block carries its absolute path, because ${CLAUDE_PLUGIN_ROOT}
 * does not expand in markdown and no agent file can name it otherwise.
 *
 * Why it exists: current-state docs rot silently when code moves. The one doc layer with a
 * round-trip loop (the BR registries) stayed correct across a measured god-file split; every other
 * layer described deleted files and no gate noticed. This is the existence-level gate — it guards
 * the fatal class (the cited file is gone), never line numbers or content drift.
 *
 * Config: docs/conventions/anchored-set.md in the consuming repo (buckets + `Source roots:`), read
 * by path convention. No manifest = exit 0, silent — repos adopt incrementally.
 *
 * Exit codes are the contract:
 *   0 — clean, or no manifest. Advisory warnings (unbucketed docs, stale non-anchored entries) may
 *       still print; they never block a close.
 *   1 — a malformed manifest (config error, distinct wording), a broken live-cite in an anchored
 *       doc, or an anchored-set entry that matches no file (the anchored doc itself was deleted).
 *
 * Root resolution is CLAUDE_PROJECT_DIR || cwd (estate convention; bare cwd breaks worktree
 * sessions). Node, zero third-party deps. Checks the WORKING TREE, not HEAD: the close-gate moment
 * precedes the closure commit, so uncommitted moves are exactly what it must see.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const MANIFEST_REL = 'docs/conventions/anchored-set.md';
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const manifestPath = path.join(root, ...MANIFEST_REL.split('/'));
if (!fs.existsSync(manifestPath)) process.exit(0); // repo has not adopted the manifest — silent no-op

const manifestLines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/);

// `Source roots:` declares the path prefixes treated as live-cite-shaped — never a hardcoded `src/`.
// It is a PREAMBLE by contract: only the region before the first `## ` heading is searched, so a
// declaration that drifted below a bucket heading fails loudly instead of being silently ignored.
const firstHeading = manifestLines.findIndex((l) => /^##\s/.test(l));
const preamble = firstHeading === -1 ? manifestLines : manifestLines.slice(0, firstHeading);
const rootsLine = preamble.find((l) => /^\s*Source roots:/i.test(l));
const sourceRoots = rootsLine
  ? rootsLine.replace(/^\s*Source roots:/i, '').split(',').map((s) => s.replace(/`/g, '').trim()).filter(Boolean)
  : [];
if (sourceRoots.length === 0) configError('no usable `Source roots:` declaration before the first `## ` heading');

// Buckets: `- ` entries under each `## ` heading, with the optional `— exempt: § {Heading}` suffix.
const buckets = new Map();
let currentBucket = null;
for (let i = firstHeading; i >= 0 && i < manifestLines.length; i++) {
  const heading = manifestLines[i].match(/^##\s+(.+?)\s*$/);
  if (heading) {
    currentBucket = heading[1].trim().toLowerCase();
    if (!buckets.has(currentBucket)) buckets.set(currentBucket, []);
    continue;
  }
  const item = manifestLines[i].match(/^\s*-\s+(.+?)\s*$/);
  if (!item || !currentBucket) continue;
  const exempt = item[1].match(/^(.*?)\s+(?:—|--)\s*exempt:\s*§\s*(.+)$/);
  buckets.get(currentBucket).push(
    exempt ? { pattern: exempt[1].trim(), exempt: exempt[2].trim() } : { pattern: item[1].trim(), exempt: null }
  );
}

// The bucket headings are contract strings — the fatal tier is keyed off `## Anchored set`. A
// manifest that spells it differently would parse cleanly and check nothing, so an absent or empty
// anchored set is a config error, never a green gate. (This also covers a manifest with no `## `
// heading at all, where the `Source roots:` preamble check above degenerates to the whole file.)
if ((buckets.get('anchored set') || []).length === 0) {
  configError('no `## Anchored set` bucket with at least one `- ` entry (the heading text is part of the format)');
}

const docFiles = walk(path.join(root, 'docs'), 'docs');
// Entry -> matching files. Memoized because every entry is resolved three times below (the fatal
// check, the coverage set, the stale-entry warning). Declared here, not beside resolve(): the
// resolution runs at module top level, and a `const` below it would be in its temporal dead zone.
const resolved = new Map();

// Live-cite shape: a declared source root followed by at least one more character, plus the optional
// advisory `:{line}` — stripped before the existence test, since only the PATH is load-bearing.
//
// LEFT BOUNDARY (F124 Q1, ratified 2026-09-10). A root only opens a cite when the character before
// it is NOT a path character — not a letter, digit, `_`, `.`, `/`, `~` or `-`. A root glued to the
// tail of a longer path names someone else's tree (`bloc-9.0.0/lib/x.dart`, `dart-sdk/lib/x`,
// `~/.pub-cache/.../lib/x.dart`), never this one. Stated as a DENY-list, deliberately: an allow-list
// of the predecessors anyone thought of would silently stop checking the ones they did not — a cite
// in brackets, in quotes, in a table cell, in bold — and a doc-freshness gate that quietly checks
// less is the failure class this gate exists for. `:` is not a path character, so a history-qualified
// `{sha}:src/x.js` still matches here and is still skipped by extractCites below.
const CITE_RE = new RegExp(
  `(?<![A-Za-z0-9_./~-])(?:${sourceRoots.map(escapeRe).join('|')})[A-Za-z0-9_.-][A-Za-z0-9_./-]*(?::\\d+)?`, 'g'
);

const brokenCites = [];
const deadEntries = [];
for (const entry of buckets.get('anchored set') || []) {
  const docs = resolve(entry.pattern);
  if (docs.length === 0) deadEntries.push(entry.pattern); // the anchored doc itself is gone
  for (const doc of docs) {
    let text;
    try { text = fs.readFileSync(path.join(root, doc), 'utf8'); } catch { continue; }
    for (const cite of extractCites(stripSection(stripFences(text), entry.exempt))) {
      const target = cite.replace(/:\d+$/, '');
      if (!fs.existsSync(path.join(root, target))) brokenCites.push({ doc, cite });
    }
  }
}

// Advisory tier (never exit 1): every docs markdown file that no bucket claims, plus every
// non-anchored entry that claims nothing. The manifest is implicitly ignored — it never
// self-warns. Enforcement with a surface, without the nag-until-disabled failure mode.
const warnings = [];
for (const [bucket, entries] of buckets) {
  if (bucket === 'anchored set') continue; // its dead entries are fatal, handled above
  for (const entry of entries) {
    if (resolve(entry.pattern).length === 0) {
      warnings.push(`stale "${bucket}" entry — matches no file in the tree: ${entry.pattern}`);
    }
  }
}
const claimed = new Set();
for (const entries of buckets.values()) {
  for (const entry of entries) for (const f of resolve(entry.pattern)) claimed.add(f);
}
for (const doc of docFiles) {
  if (!doc.endsWith('.md') || doc === MANIFEST_REL || claimed.has(doc)) continue;
  warnings.push(`unbucketed doc — classify it in ${MANIFEST_REL}: ${doc}`);
}
if (warnings.length > 0) {
  process.stdout.write(
    `anchor-check: ${warnings.length} warning(s) (advisory — these never block a close):\n` +
    warnings.map((w) => `  ${w}\n`).join('')
  );
}

if (deadEntries.length > 0) {
  process.stdout.write(
    `anchor-check: ${deadEntries.length} anchored-set entry/entries match no file in the tree ` +
    `(the anchored doc was deleted or moved — fix ${MANIFEST_REL}):\n` +
    deadEntries.map((p) => `  ${p}\n`).join('')
  );
}
if (brokenCites.length > 0) {
  process.stdout.write(
    `anchor-check: ${brokenCites.length} broken live-cite(s) — the cited path is not in the working tree:\n` +
    brokenCites.map(({ doc, cite }) => `  ${doc} -> ${cite}\n`).join('')
  );
}
if (deadEntries.length > 0 || brokenCites.length > 0) process.exit(1);

process.exit(0);

// Fenced code blocks are illustrative, not claims about the current tree — drop them before
// extraction (the fence lines themselves are kept so nothing outside the fence shifts into it).
function stripFences(text) {
  const out = [];
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; out.push(''); continue; }
    out.push(inFence ? '' : line);
  }
  return out.join('\n');
}

// The `— exempt: § {Heading}` suffix excludes one section: from its heading to the next heading of
// the SAME OR HIGHER level (a deeper sub-heading stays inside the exemption). Fences are already
// blanked when this runs, so a `#` line inside a code block can never be mistaken for a heading.
function stripSection(text, heading) {
  if (!heading) return text;
  const want = normalizeHeading(heading);
  const out = [];
  let level = 0;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (level > 0) {
      if (!h || h[1].length > level) { out.push(''); continue; }
      level = 0; // same-or-higher heading: the exemption ends here, and THIS line is back in scope
    }
    if (h && normalizeHeading(h[2]) === want) { level = h[1].length; out.push(''); continue; }
    out.push(line);
  }
  return out.join('\n');
}

// Heading text as written vs as declared in the manifest: emphasis and code markers are noise.
function normalizeHeading(s) {
  return s.replace(/[`*_]/g, '').trim().toLowerCase();
}

// Every live-cite-shaped token in an anchored doc, minus the history-qualified ones: a `{sha}:`
// prefix marks a cite into a PAST tree state, which is never tree-checked (citation grammar).
function extractCites(text) {
  const found = [];
  for (const m of text.matchAll(CITE_RE)) {
    if (/\b[0-9a-f]{7,40}:$/.test(text.slice(Math.max(0, m.index - 41), m.index))) continue;
    found.push(m[0].replace(/[.,;)\]]+$/, ''));
  }
  return found;
}

// A manifest entry resolves to the doc files it matches. A glob-free entry may also name a file
// outside docs/ (a repo-root README), so existence is accepted as a match there.
function resolve(pattern) {
  if (!resolved.has(pattern)) {
    const re = globRe(pattern);
    let hits = docFiles.filter((f) => re.test(f));
    if (hits.length === 0 && !/[*?]/.test(pattern) && fs.existsSync(path.join(root, pattern))) hits = [pattern];
    resolved.set(pattern, hits);
  }
  return resolved.get(pattern);
}

// Minimal glob: `**` spans separators, `*` stops at one. Zero third-party deps is the estate
// constraint, and manifest patterns are directory prefixes, not a full glob dialect.
function globRe(pattern) {
  const escaped = escapeRe(pattern).replace(/\\\*/g, '*');
  return new RegExp(`^${escaped.replace(/\*\*/g, ' ').replace(/\*/g, '[^/]*').replace(/ /g, '.*')}$`);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Every file under a directory, as repo-relative POSIX paths. Missing directory = empty list.
function walk(dir, prefix) {
  let out = [];
  let listing;
  try { listing = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of listing) {
    const rel = `${prefix}/${e.name}`;
    if (e.isDirectory()) out = out.concat(walk(path.join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}

// A malformed manifest is its own failure class: distinct wording, so it can never be read as a
// clean pass NOR mistaken for a broken citation (different fixes).
function configError(what) {
  process.stdout.write(
    `anchor-check: config error in ${MANIFEST_REL} — ${what}. ` +
    'Declare `Source roots: `src/`, `lib/`` before the first `## ` heading.\n'
  );
  process.exit(1);
}
