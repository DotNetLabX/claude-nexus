#!/usr/bin/env node
// bump-plugin.mjs — classify a change to this plugin marketplace repo and bump the
// affected plugin(s)' version + CHANGELOG, or (in --check mode) verify a bump exists.
//
// Owned procedure behind the `release-plugin` skill (plugins/nexus/skills/release-plugin/).
// Policy: PATCH-default; owner escalates. See plugins/nexus/skills/release-plugin/SKILL.md.
//
// Usage:
//   node scripts/bump-plugin.mjs            apply: PATCH-bump any plugin whose shipped files changed
//   node scripts/bump-plugin.mjs --minor    apply, but escalate the bump to MINOR (owner's call)
//   node scripts/bump-plugin.mjs --major    apply, but escalate the bump to MAJOR (owner's call)
//   node scripts/bump-plugin.mjs --dry-run  classify only, print the decision, change nothing
//   node scripts/bump-plugin.mjs --check    CI: exit 1 if a plugin's shipped surface changed
//                                           (vs --base) without ANY version bump. Changes nothing.
//   --base <ref>   base ref for --check (default: origin/main, fallback HEAD~1)
//   --staged       apply/dry-run over staged changes only (default: staged + unstaged + untracked)
//   --note <text>  one-line human summary seeded into the CHANGELOG entry (apply mode)
//
// Tiering: PATCH is the default for every shipped-file change (the install cache is version-keyed, so
// even a patch reaches users). The tool NEVER auto-escalates by file type — the owner escalates to
// MINOR/MAJOR with --minor/--major.
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
// Owner escalation: default is PATCH; --minor / --major raise the bump for every changed plugin.
const OVERRIDE_TIER = has('--major') ? TIER.MAJOR : has('--minor') ? TIER.MINOR : null;
// Optional human summary for the CHANGELOG entry (audit B8 — generic labels alone tell users nothing).
const NOTE = valOf('--note');

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
    if (p.includes(' -> ')) {
      // Rename: classify BOTH sides (audit B2). A file moved OUT of plugins/ removes shipped
      // surface — a behavior change that classifying only the new path would miss.
      const [oldP, newP] = p.split(' -> ');
      paths.push(oldP.replace(/^"|"$/g, ''));
      p = newP;
    }
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
  // Default tier for ANY shipped-file change is PATCH; the owner escalates with --minor/--major.
  // This only decides PATCH-vs-NONE (does the change reach a session at all?) plus a descriptive label.
  const seg = pluginRel.replace(/\\/g, '/');

  // Root-level runtime config (.mcp.json, .lsp.json, settings.json) IS shipped surface. This test
  // must run BEFORE the no-slash doc/meta check below — those filenames contain no '/' and would be
  // silently swallowed as "doc/meta → no bump" (audit B1: the change would never reach users).
  if (/^\.(mcp|lsp)\.json$/.test(seg) || seg === 'settings.json') {
    return [TIER.PATCH, 'runtime config surface'];
  }

  // Plugin-root doc/meta (CHANGELOG.md, README.md, LICENSE, …) is not shipped to sessions → no bump.
  if (!seg.includes('/')) return [TIER.NONE, `plugin-root doc/meta (${seg})`];

  // plugin.json: a version-only diff IS the bump (no-op); any other manifest edit is shipped metadata.
  if (seg === '.claude-plugin/plugin.json') {
    const before = fileAtBase(`plugins/${name}/.claude-plugin/plugin.json`);
    if (before === null) return [TIER.PATCH, 'new plugin manifest'];
    let a, b;
    try { a = JSON.parse(before); b = JSON.parse(readFileSync(fullPath, 'utf8')); }
    catch { return [TIER.PATCH, 'plugin.json changed (unparseable)']; }
    const stripV = (o) => { const c = { ...o }; delete c.version; return JSON.stringify(c); };
    if (stripV(a) === stripV(b)) return [TIER.NONE, 'version-only (the bump itself)'];
    return [TIER.PATCH, 'plugin.json metadata change'];
  }

  // Everything else under plugins/{name}/ is shipped payload → PATCH (owner escalates if it's bigger).
  const skill = (seg.match(/^skills\/([^/]+)\//) || [])[1];
  const label =
    seg.startsWith('agents/') ? 'agent instruction/behavior change' :
    seg.startsWith('rules/') ? 'rule (injected every session)' :
    seg.startsWith('hooks/') ? 'hook behavior/enforcement change' :
    seg.startsWith('commands/') ? 'shipped command changed' :
    skill ? `skill change (${skill})` :
    `plugin payload (${seg})`;
  return [TIER.PATCH, label];
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

// Owner escalation: --minor / --major raises every changed plugin to that tier (default stays PATCH).
if (OVERRIDE_TIER) {
  for (const cur of perPlugin.values()) {
    if (cur.tier > TIER.NONE) {
      cur.tier = OVERRIDE_TIER;
      cur.reasons.add(`owner-escalated to ${TIER_NAME[OVERRIDE_TIER]}`);
    }
  }
}

// ── version helpers ───────────────────────────────────────────────────────────
function manifestPath(name) { return join(root, 'plugins', name, '.claude-plugin', 'plugin.json'); }
function readVersion(name, ref) {
  if (ref) {
    const txt = gitSafe('show', `${ref}:plugins/${name}/.claude-plugin/plugin.json`);
    return txt ? JSON.parse(txt).version : null;
  }
  // Working tree: a wholesale-deleted plugin dir is a reportable state, not a crash (audit B9).
  if (!existsSync(manifestPath(name))) return null;
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
    if (cur === null) {
      console.log(`  ${b.name}: plugin dir removed from working tree — nothing to bump (verify the removal is intended).`);
      continue;
    }
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
  if (!existsSync(mp)) { console.log(`  ${b.name}: plugin dir removed — skipping bump.`); continue; }
  const manifest = JSON.parse(readFileSync(mp, 'utf8'));
  const cur = manifest.version;
  const next = nextVersion(cur, b.tier);
  manifest.version = next;
  writeFileSync(mp, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // CHANGELOG.md — prepend a new version block under the title
  const clPath = join(root, 'plugins', b.name, 'CHANGELOG.md');
  const title = `# ${b.name} — Changelog`;
  const entry = `## [${next}] — ${today}\n` +
    (NOTE ? `- ${NOTE}\n` : `- ${TIER_NAME[b.tier].toUpperCase()} bump.\n`) +
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
