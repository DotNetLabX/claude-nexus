// T2 — bump-plugin.mjs classification + check gate, run against a throwaway git repo
// (the script is git-coupled by design; a fixture repo tests the real CLI surface).
// This is the $0 offline twin of the CI version-bump gate.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, run, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const SCRIPT = join(REPO, 'scripts', 'bump-plugin.mjs');
let repo;

function git(...args) {
  const res = run('git', args, { cwd: repo });
  assert.equal(res.status, 0, `git ${args.join(' ')} failed:\n${res.stderr}`);
  return res.stdout.trim();
}
function bump(...args) {
  return run(process.execPath, [SCRIPT, ...args], { cwd: repo });
}
function writeRepoFile(rel, content) {
  const p = join(repo, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, content);
}

before(() => {
  repo = makeSandbox('nexus-bump-');
  git('init', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'tester');
  writeRepoFile('.claude-plugin/marketplace.json', JSON.stringify({ name: 'fixture', plugins: [{ name: 'x', source: './plugins/x' }] }));
  writeRepoFile('plugins/x/.claude-plugin/plugin.json', JSON.stringify({ name: 'x', version: '1.0.0' }, null, 2) + '\n');
  writeRepoFile('plugins/x/CHANGELOG.md', '# x — Changelog\n\n## [1.0.0] — 2026-01-01\n- initial.\n');
  writeRepoFile('plugins/x/README.md', 'readme\n');
  writeRepoFile('plugins/x/agents/a.md', '---\nname: a\ndescription: agent a\n---\nbody\n');
  git('add', '-A');
  git('commit', '-m', 'baseline');
});
after(cleanupSandboxes);

// Reset the working tree between cases so classifications don't bleed into each other.
function clean() { git('checkout', '--', '.'); git('clean', '-fd'); }

test('shipped-file change classifies PATCH by default; tool never auto-escalates', () => {
  writeRepoFile('plugins/x/agents/a.md', '---\nname: a\ndescription: agent a\n---\nchanged body\n');
  const res = bump('--dry-run');
  assert.match(res.stdout, /x: PATCH {2}1\.0\.0 -> 1\.0\.1/);
  assert.match(res.stdout, /agent instruction\/behavior change/);
  clean();
});

test('plugin-root doc/meta changes need no bump; root runtime config does', () => {
  writeRepoFile('plugins/x/README.md', 'updated readme\n');
  assert.match(bump('--dry-run').stdout, /no plugin behavior-surface changes/);
  clean();
  writeRepoFile('plugins/x/.mcp.json', '{}\n');
  assert.match(bump('--dry-run').stdout, /runtime config surface/, 'audit B1: root config must not be swallowed as doc/meta');
  clean();
});

test('a version-only plugin.json diff is the bump itself, not a new change', () => {
  writeRepoFile('plugins/x/.claude-plugin/plugin.json', JSON.stringify({ name: 'x', version: '1.0.1' }, null, 2) + '\n');
  assert.match(bump('--dry-run').stdout, /no plugin behavior-surface changes/);
  clean();
});

test('owner escalation: --minor and --major raise the tier', () => {
  writeRepoFile('plugins/x/agents/a.md', 'minor change\n');
  assert.match(bump('--dry-run', '--minor').stdout, /x: MINOR {2}1\.0\.0 -> 1\.1\.0/);
  assert.match(bump('--dry-run', '--major').stdout, /x: MAJOR {2}1\.0\.0 -> 2\.0\.0/);
  clean();
});

test('apply mode bumps plugin.json and prepends the CHANGELOG entry', () => {
  writeRepoFile('plugins/x/agents/a.md', 'applied change\n');
  const res = bump('--note', 'test release note');
  assert.equal(res.status, 0, res.stderr);
  const manifest = JSON.parse(readFileSync(join(repo, 'plugins/x/.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(manifest.version, '1.0.1');
  const changelog = readFileSync(join(repo, 'plugins/x/CHANGELOG.md'), 'utf8');
  const firstEntry = changelog.indexOf('## [1.0.1]');
  assert.ok(firstEntry > 0 && firstEntry < changelog.indexOf('## [1.0.0]'), 'new entry prepends under the title');
  assert.match(changelog, /test release note/);
  clean();
});

test('--check fails an unbumped behavior change and passes once bumped (both directions)', () => {
  // Commit a shipped change WITHOUT a bump -> gate must fail against the baseline.
  writeRepoFile('plugins/x/agents/a.md', 'unbumped behavior change\n');
  git('add', '-A');
  git('commit', '-m', 'change without bump');
  const fail = bump('--check', '--base', 'HEAD~1');
  assert.equal(fail.status, 1, 'check must exit 1 on an unbumped surface change');
  assert.match(fail.stderr, /behavior surface changed but version is still 1\.0\.0/);

  // Add the bump in a follow-up commit -> gate passes over the combined range.
  writeRepoFile('plugins/x/.claude-plugin/plugin.json', JSON.stringify({ name: 'x', version: '1.0.1' }, null, 2) + '\n');
  git('add', '-A');
  git('commit', '-m', 'the bump');
  const pass = bump('--check', '--base', 'HEAD~2');
  assert.equal(pass.status, 0, `check must pass once the bump exists:\n${pass.stderr}`);
});

test('outside the plugin repo the script no-ops (stack-agnostic guard)', () => {
  const plain = makeSandbox('nexus-noop-');
  const res = run('git', ['init', '-b', 'main'], { cwd: plain });
  assert.equal(res.status, 0);
  const out = run(process.execPath, [SCRIPT, '--dry-run'], { cwd: plain });
  assert.equal(out.status, 0);
  assert.match(out.stdout, /not the plugin repo\. No-op\./);
});
