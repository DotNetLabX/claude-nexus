// T2 — gen-omni.mjs against a SYNTHETIC nexus/omni pair (never the real private twin):
// token-swap correctness, the apply -> --check round-trip, drift detection in all three
// directions (differs / extra / obsolete), and the MIT refusal gate.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, run, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

let nexus, omni;

function writeAt(root, rel, content) {
  const p = join(root, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, content);
}
function genOmni(...extra) {
  return run(process.execPath, [join(nexus, 'scripts', 'gen-omni.mjs'), omni, ...extra]);
}

before(() => {
  nexus = makeSandbox('nexus-src-');
  omni = makeSandbox('omni-dst-');
  mkdirSync(join(nexus, 'scripts'), { recursive: true });
  cpSync(join(REPO, 'scripts', 'gen-omni.mjs'), join(nexus, 'scripts', 'gen-omni.mjs'));
  cpSync(join(REPO, 'scripts', 'gen-commands.mjs'), join(nexus, 'scripts', 'gen-commands.mjs'));
  writeAt(nexus, 'plugins/nexus/agents/a.md', 'Nexus pipeline doc. The nexus twin test. DotNetLabX marketplace.\n');
  writeAt(nexus, 'plugins/nexus-dotnet/skills/s/SKILL.md', '---\nname: s\ndescription: a nexus-dotnet skill\n---\nbody\n');
  // gen-omni.mjs mirrors every stack/domain plugin (nexus-flutter, nexus-cpp, nexus-php,
  // nexus-analytics too) — seed them so collect() doesn't ENOENT.
  writeAt(nexus, 'plugins/nexus-flutter/skills/f/SKILL.md', '---\nname: f\ndescription: a nexus-flutter skill\n---\nbody\n');
  writeAt(nexus, 'plugins/nexus-cpp/skills/c/SKILL.md', '---\nname: c\ndescription: a nexus-cpp skill\n---\nbody\n');
  writeAt(nexus, 'plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md', '---\nname: mine-verify-cover-php\ndescription: a nexus-php skill\n---\nbody\n');
  writeAt(nexus, 'plugins/nexus-analytics/skills/semantic-model-query/SKILL.md', '---\nname: semantic-model-query\ndescription: a nexus-analytics skill\n---\nbody\n');
  // README needs the override anchors; the MIT link must be the ONLY MIT mention (the swap removes it).
  writeAt(nexus, 'README.md', [
    '# Nexus',
    '> **Name alternatives considered:** Gravity, Blade — in case of a future rename.',
    '- [Architecture & Decision Record](docs/architecture/README.md) — why Nexus is built the way it is: source of truth, dependency model, knowledge delivery, pipeline enforcement, build & release',
    'License: [MIT](LICENSE)',
    '',
  ].join('\n'));
  writeAt(omni, '.claude-plugin/marketplace.json', JSON.stringify({ name: 'claude-omni', owner: { name: 'x' }, plugins: [] }, null, 2));
  writeAt(omni, 'LICENSE', 'Proprietary. All rights reserved.\n');
});
after(cleanupSandboxes);

test('apply: mirrors plugins with token swap, rewrites marketplace, preserves LICENSE', () => {
  const res = genOmni();
  assert.equal(res.status, 0, res.stderr);

  const mirrored = readFileSync(join(omni, 'plugins/omni/agents/a.md'), 'utf8');
  assert.equal(mirrored, 'Omni pipeline doc. The omni twin test. omniaz marketplace.\n', 'token swap (case-distinct + DotNetLabX)');
  assert.ok(existsSync(join(omni, 'plugins/omni-dotnet/skills/s/SKILL.md')), 'path segments are swapped too (nexus-dotnet -> omni-dotnet)');

  const mp = JSON.parse(readFileSync(join(omni, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.equal(mp.name, 'claude-omni', 'marketplace identity preserved');
  assert.deepEqual(mp.plugins.map((p) => p.name), ['omni', 'omni-dotnet', 'omni-flutter', 'omni-cpp', 'omni-php', 'omni-analytics']);

  assert.equal(readFileSync(join(omni, 'LICENSE'), 'utf8'), 'Proprietary. All rights reserved.\n', 'LICENSE never touched');
  const readme = readFileSync(join(omni, 'README.md'), 'utf8');
  assert.ok(!/\bMIT\b/.test(readme), 'proprietary twin must not ship MIT');
  assert.match(readme, /Internal tooling/, 'license override applied');
});

test('--check: clean tree is in sync; each drift direction is detected', () => {
  assert.equal(genOmni('--check').status, 0, 'right after apply the twin must be in sync');

  // differs
  const target = join(omni, 'plugins/omni/agents/a.md');
  const original = readFileSync(target, 'utf8');
  writeFileSync(target, original + 'local edit\n');
  let res = genOmni('--check');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /differs: {2}plugins\/omni\/agents\/a\.md/);
  writeFileSync(target, original);

  // extra
  writeAt(omni, 'plugins/omni/agents/rogue.md', 'hand-added\n');
  res = genOmni('--check');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /extra: {4}plugins\/omni\/agents\/rogue\.md/);
  assert.equal(genOmni().status, 0, 'apply removes the rogue file');
  assert.ok(!existsSync(join(omni, 'plugins/omni/agents/rogue.md')));

  // obsolete (a plugin that should no longer exist)
  writeAt(omni, 'plugins/omni-net/x.md', 'zombie\n');
  res = genOmni('--check');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /obsolete: plugins\/omni-net/);
});

test('refuses to write a README that still contains MIT after overrides', () => {
  const readmePath = join(nexus, 'README.md');
  const original = readFileSync(readmePath, 'utf8');
  writeFileSync(readmePath, original + '\nAlso MIT licensed elsewhere.\n');
  const res = genOmni();
  assert.equal(res.status, 1, 'must refuse');
  assert.match(res.stderr, /REFUSING to write omni README/);
  writeFileSync(readmePath, original);
});
