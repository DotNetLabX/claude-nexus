// T1 — release-surface integrity: manifest/CHANGELOG agreement and shipped-markdown hygiene.
// The install cache is version-keyed (CLAUDE.md), so manifest/CHANGELOG disagreement means
// users see a changelog that doesn't match what they actually received.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, pluginRoot } from '../helpers.mjs';

const marketplace = JSON.parse(readFileSync(join(REPO, '.claude-plugin', 'marketplace.json'), 'utf8'));

test('marketplace.json lists plugins whose sources exist', () => {
  assert.ok(Array.isArray(marketplace.plugins) && marketplace.plugins.length >= 2);
  for (const p of marketplace.plugins) {
    assert.ok(existsSync(join(REPO, p.source)), `marketplace plugin ${p.name}: source ${p.source} missing`);
  }
});

for (const { name } of marketplace.plugins) {
  test(`${name}: plugin.json is valid and CHANGELOG top entry matches its version`, () => {
    const manifest = JSON.parse(readFileSync(join(pluginRoot(name), '.claude-plugin', 'plugin.json'), 'utf8'));
    assert.equal(manifest.name, name, `${name}: manifest name mismatch`);
    assert.match(String(manifest.version), /^\d+\.\d+\.\d+$/, `${name}: version is not semver`);

    const changelog = readFileSync(join(pluginRoot(name), 'CHANGELOG.md'), 'utf8');
    const top = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
    assert.ok(top, `${name}: CHANGELOG.md has no version entry`);
    assert.equal(top[1], manifest.version,
      `${name}: CHANGELOG top entry ${top[1]} != plugin.json ${manifest.version} — bump and changelog must move together`);
  });
}

test('no ${CLAUDE_PLUGIN_ROOT} in shipped markdown bodies', () => {
  // The variable expands ONLY in hooks.json commands — in agent/skill/command/rule markdown
  // it reaches the model as a dead literal (the restore-agent header documents this).
  const offenders = [];
  for (const { name } of marketplace.plugins) {
    for (const sub of ['agents', 'skills', 'commands', 'rules']) {
      const dir = join(pluginRoot(name), sub);
      if (!existsSync(dir)) continue;
      (function walk(d) {
        for (const entry of readdirSync(d)) {
          const p = join(d, entry);
          if (statSync(p).isDirectory()) { walk(p); continue; }
          if (entry.endsWith('.md') && readFileSync(p, 'utf8').includes('${CLAUDE_PLUGIN_ROOT}')) {
            offenders.push(p);
          }
        }
      })(dir);
    }
  }
  assert.deepEqual(offenders, [], `\${CLAUDE_PLUGIN_ROOT} does not expand in markdown: ${offenders.join(', ')}`);
});

test('hook scripts and build scripts parse (node --check)', async () => {
  // Syntax-level smoke: a hook with a parse error fails silently at session start.
  const { spawnSync } = await import('node:child_process');
  const targets = [];
  const hookDir = join(pluginRoot('nexus'), 'hooks', 'scripts');
  for (const f of readdirSync(hookDir).filter((f) => /\.(js|mjs|cjs)$/.test(f))) targets.push(join(hookDir, f));
  for (const f of readdirSync(join(REPO, 'scripts')).filter((f) => /\.mjs$/.test(f))) targets.push(join(REPO, 'scripts', f));
  for (const t of targets) {
    const res = spawnSync(process.execPath, ['--check', t], { encoding: 'utf8' });
    assert.equal(res.status, 0, `${t} fails node --check:\n${res.stderr}`);
  }
});
