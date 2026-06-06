#!/usr/bin/env node
// bump-plugin.mjs — classify a change to this plugin marketplace repo and bump the
// affected plugin(s)' version + CHANGELOG, or (in --check mode) verify a bump exists.
//
// Owned procedure behind the `release-plugin` skill (plugins/nexus/skills/release-plugin/).
// Policy: docs/proposals/plugin-authoring-and-versioning.md §4.
//
// Usage:
//   node scripts/bump-plugin.mjs            apply: classify working-tree changes, bump + changelog
//   node scripts/bump-plugin.mjs --dry-run  classify only, print the decision, change nothing
//   node scripts/bump-plugin.mjs --check    CI: exit 1 if a plugin's behavior surface changed
//                                           (vs --base) without a version bump. Changes nothing.
//   --base <ref>   base ref for --check (default: origin/main, fallback HEAD~1)
//   --staged       apply/dry-run over staged changes only (default: staged + unstaged + untracked)
//
// Stack-agnostic: if there is no .claude-plugin/marketplace.json at the repo root, this is a
// consuming project (not the plugin repo) and the script no-ops with exit 0.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TIER = { NONE: 0, PATCH: 1, MINOR: 2, MAJOR: 3 };
const TIER_NAME = ['none', 'patch', 'minor', 'major'];

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valOf = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const MODE = has('--check') ? 'check' : has('--dry-run') ? 'dry-run' : 'apply';
const STAGED_ONLY = has('--staged');
const BASE = valOf('--base');

function git(...a) {
  return execFileSync('git', a, { encoding: 'utf8' }).trim();
}
function gitSafe(...a) {
  // stderr ignored: callers use this for lookups where a miss (e.g. a not-yet-committed path) is expected
  try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

const root = gitSafe('rev-parse', '--show-toplevel');
if (!root) { console.error('bump-plugin: not a git repo.'); process.exit(2); }
if (!existsSync(join(root, '.claude-plugin', 'marketplace.json'))) {
  console.log('bump-plugin: no .claude-plugin/marketplace.json — not the plugin repo. No-op.');
  process.exit(0);
}

// ── change set ────────────────────────────────────────────────────────────────
function resolveBase() {
  if (BASE) return BASE;
  if (gitSafe('rev-parse', '--verify', '--quiet', 'origin/main')) return 'origin/main';
  if (gitSafe('rev-parse', '--verify', '--quiet', 'HEAD~1')) return 'HEAD~1';
  return 'HEAD';
}
const baseRef = MODE === 'check' ? resolveBase() : 'HEAD';

function changedPaths() {
  if (MODE === 'check') {
    const out = gitSafe('diff', '--name-only', `${baseRef}...HEAD`) ?? git('diff', '--name-only', baseRef);
    return out ? out.split('\n').filter(Boolean) : [];
  }
  // apply / dry-run: working-tree changes (staged + unstaged [+ untracked unless --staged])
  const porcelain = git('status', '--porcelain', STAGED_ONLY ? '--untracked-files=no' : '--untracked-files=all');
  const paths = [];
  for (const line of porcelain.split('\n').filter(Boolean)) {
    const xy = line.slice(0, 2);
    let p = line.slice(3);
    if (STAGED_ONLY && xy[0] === ' ') continue;     // unstaged-only change, skip in --staged
    if (xy === '??' && STAGED_ONLY) continue;
    if (p.includes(' -> ')) p = p.split(' -> ')[1];  // rename: take new path
    paths.push(p.replace(/^"|"$/g, ''));
  }
  return paths;
}

function pluginOf(p) {
  const m = p.replace(/\\/g, '/').match(/^plugins\/([^/]+)\//);
  return m ? m[1] : null;
}

// ── classification (policy §4) ─────────────────────────────────────────────────
function fileAtBase(relPath) {
  // content of a plugin-relative path at the comparison base
  return gitSafe('show', `${baseRef}:${relPath}`);
}

function classify(pluginRel, name, fullPath) {
  // pluginRel is the path within the plugin (e.g. "agents/team-lead.md")
  const seg = pluginRel.replace(/\\/g, '/');
  if (seg.startsWith('agents/')) return [TIER.MAJOR, 'agent instruction/behavior change'];
  if (seg.startsWith('rules/')) return [TIER.MAJOR, 'rule (injected every session)'];
  if (seg.startsWith('hooks/')) return [TIER.MAJOR, 'hook behavior/enforcement change'];
  if (seg.startsWith('commands/')) return [TIER.MAJOR, 'shipped command changed/renamed'];
  if (/^\.(mcp|lsp)\.json$/.test(seg) || seg === 'settings.json') return [TIER.MAJOR, 'runtime config surface'];
  if (seg.startsWith('skills/')) {
    const sm = seg.match(/^skills\/([^/]+)\//);
    const skillName = sm ? sm[1] : '';
    if (/-format$/.test(skillName)) return [TIER.MAJOR, `artifact-format skill (${skillName}) — machinery contract`];
    // new skill (its SKILL.md didn't exist at base) → additive → MINOR; else can't prove additive → MAJOR
    const skillMd = `plugins/${name}/skills/${skillName}/SKILL.md`;
    const existed = fileAtBase(skillMd) !== null;
    return existed
      ? [TIER.MAJOR, `existing skill edit (${skillName}) — escalated; downgrade to minor only if provably additive`]
      : [TIER.MINOR, `new skill (${skillName}) — additive`];
  }
  if (seg === '.claude-plugin/plugin.json') {
    const before = fileAtBase(`plugins/${name}/.claude-plugin/plugin.json`);
    if (before === null) return [TIER.MAJOR, 'new plugin manifest'];
    let a, b;
    try { a = JSON.parse(before); b = JSON.parse(readFileSync(fullPath, 'utf8')); } catch { return [TIER.MINOR, 'plugin.json changed (unparseable)']; }
    const depsChanged = JSON.stringify(a.dependencies ?? null) !== JSON.stringify(b.dependencies ?? null);
    if (depsChanged) return [TIER.MAJOR, 'dependency graph change'];
    // ignore version-only diffs (that IS the bump)
    const stripV = (o) => { const c = { ...o }; delete c.version; return JSON.stringify(c); };
    if (stripV(a) === stripV(b)) return [TIER.NONE, 'version-only (the bump itself)'];
    return [TIER.MINOR, 'discovery metadata (description/keywords/userConfig)'];
  }
  // plugin-root doc/meta files (CHANGELOG.md, README.md, LICENSE, …) are not shipped to sessions
  if (!seg.includes('/')) return [TIER.NONE, `plugin-root doc/meta (${seg})`];
  return [TIER.MAJOR, `other plugin payload (${seg}) — conservative`];
}

// ── aggregate per plugin ─────────────────────────────────────────────────────
const paths = changedPaths();
const perPlugin = new Map(); // name -> { tier, reasons:Set }
let nonPluginPaths = [];

for (const p of paths) {
  const name = pluginOf(p);
  if (!name) { nonPluginPaths.push(p); continue; }
  const rel = p.replace(/\\/g, '/').replace(new RegExp(`^plugins/${name}/`), '');
  const [tier, reason] = classify(rel, name, join(root, p));
  const cur = perPlugin.get(name) ?? { tier: TIER.NONE, reasons: new Set() };
  if (tier > cur.tier) cur.tier = tier;
  if (tier > TIER.NONE) cur.reasons.add(reason);
  perPlugin.set(name, cur);
}

// ── version helpers ───────────────────────────────────────────────────────────
function manifestPath(name) { return join(root, 'plugins', name, '.claude-plugin', 'plugin.json'); }
function readVersion(name, ref) {
  if (ref) {
    const txt = gitSafe('show', `${ref}:plugins/${name}/.claude-plugin/plugin.json`);
    return txt ? JSON.parse(txt).version : null;
  }
  return JSON.parse(readFileSync(manifestPath(name), 'utf8')).version;
}
function nextVersion(v, tier) {
  const [x, y, z] = String(v).split('.').map((n) => parseInt(n, 10) || 0);
  if (tier === TIER.MAJOR) return `${x + 1}.0.0`;
  if (tier === TIER.MINOR) return `${x}.${y + 1}.0`;
  if (tier === TIER.PATCH) return `${x}.${y}.${z + 1}`;
  return v;
}

// ── report ────────────────────────────────────────────────────────────────────
const bumped = [];
for (const [name, { tier, reasons }] of perPlugin) {
  if (tier === TIER.NONE) continue;
  bumped.push({ name, tier, reasons: [...reasons] });
}

function printPlan() {
  if (bumped.length === 0) {
    console.log('bump-plugin: no plugin behavior-surface changes detected — no bump needed.');
    if (nonPluginPaths.length) console.log(`  (non-plugin paths, no bump: ${nonPluginPaths.length} file(s) under docs/, scripts/, etc.)`);
    return;
  }
  console.log(`bump-plugin (${MODE}) — base ${MODE === 'check' ? baseRef : 'HEAD'}:`);
  for (const b of bumped) {
    const cur = readVersion(b.name);
    const next = nextVersion(cur, b.tier);
    console.log(`  ${b.name}: ${TIER_NAME[b.tier].toUpperCase()}  ${cur} -> ${next}`);
    for (const r of b.reasons) console.log(`      - ${r}`);
  }
}

if (MODE === 'check') {
  printPlan();
  let failed = false;
  for (const b of bumped) {
    const baseV = readVersion(b.name, baseRef);
    const headV = readVersion(b.name); // working/HEAD
    if (baseV !== null && baseV === headV) {
      failed = true;
      console.error(`\n✗ ${b.name}: behavior surface changed but version is still ${headV} (expected ≥ ${nextVersion(baseV, b.tier)}).`);
      console.error(`  Run the release-plugin skill (node scripts/bump-plugin.mjs) and commit the bump WITH the change.`);
    }
  }
  process.exit(failed ? 1 : 0);
}

// apply / dry-run
printPlan();
if (MODE === 'dry-run' || bumped.length === 0) process.exit(0);

const today = new Date().toISOString().slice(0, 10);
for (const b of bumped) {
  const mp = manifestPath(b.name);
  const manifest = JSON.parse(readFileSync(mp, 'utf8'));
  const cur = manifest.version;
  const next = nextVersion(cur, b.tier);
  manifest.version = next;
  writeFileSync(mp, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // CHANGELOG.md — prepend a new version block under the title
  const clPath = join(root, 'plugins', b.name, 'CHANGELOG.md');
  const title = `# ${b.name} — Changelog`;
  const entry = `## [${next}] — ${today}\n` +
    `- ${TIER_NAME[b.tier].toUpperCase()} bump.\n` +
    b.reasons.map((r) => `  - ${r}`).join('\n') + '\n';
  let cl;
  if (existsSync(clPath)) {
    const txt = readFileSync(clPath, 'utf8');
    const lines = txt.split('\n');
    const titleIdx = lines.findIndex((l) => l.startsWith('# '));
    const insertAt = titleIdx >= 0 ? titleIdx + 1 : 0;
    // skip a blank line right after the title
    const after = (lines[insertAt] ?? '').trim() === '' ? insertAt + 1 : insertAt;
    lines.splice(after, 0, '', entry.trimEnd());
    cl = lines.join('\n');
  } else {
    cl = `${title}\n\n${entry}`;
  }
  writeFileSync(clPath, cl.endsWith('\n') ? cl : cl + '\n', 'utf8');
  console.log(`  wrote ${b.name} ${cur} -> ${next} + CHANGELOG.md`);
}
console.log('\nbump-plugin: applied. Stage the bumped plugin.json + CHANGELOG WITH your content change and commit together.');
