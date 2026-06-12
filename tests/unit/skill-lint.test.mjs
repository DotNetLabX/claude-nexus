// skill-lint.mjs (improve-skills' deterministic gate, ADR-23): a scaffolded or fixed
// skill must be born compliant — frontmatter valid, no BOM, no dangling references.
// Born as TDD reds. Evidence: docs/evidence/2026-06-11-omnishelf-job-fitness.md (H1-H3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { pluginRoot, run, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const LINT = join(pluginRoot('nexus'), 'skills', 'improve-skills', 'scripts', 'skill-lint.mjs');
const lint = (...args) => run(process.execPath, [LINT, ...args]);

function makeSkill(name, skillMd, extra = {}) {
  const dir = join(makeSandbox('skill-lint-'), name);
  mkdirSync(dir, { recursive: true });
  if (skillMd !== null) {
    writeFileSync(join(dir, 'SKILL.md'), skillMd, { encoding: 'utf8' });
  }
  for (const [rel, content] of Object.entries(extra)) {
    const p = join(dir, rel);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, content, { encoding: 'utf8' });
  }
  return dir;
}

const GOOD = `---
name: good-skill
description: Scaffolds the widget integration pattern for this project. Use when adding a new widget endpoint.
---

# Good Skill

## Steps

1. Read \`references/template.md\` and apply it.
`;

test('a compliant skill passes (exit 0)', () => {
  const dir = makeSkill('good-skill', GOOD, { 'references/template.md': '# T\n' });
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, /OK/);
});

test('a UTF-8 BOM is an error', () => {
  const dir = makeSkill('good-skill', '﻿' + GOOD, { 'references/template.md': '# T\n' });
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /BOM/i);
});

test('frontmatter name must match the folder name', () => {
  const dir = makeSkill('other-name', GOOD, { 'references/template.md': '# T\n' });
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /name/i);
});

test('a missing description is an error', () => {
  const md = `---\nname: no-desc\n---\n\n# No Desc\n`;
  const dir = makeSkill('no-desc', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /description/i);
});

test('missing frontmatter entirely is an error', () => {
  const dir = makeSkill('bare', '# Bare\n\nNo frontmatter at all.\n');
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /frontmatter/i);
});

test('a dangling relative reference is an error', () => {
  const md = `---\nname: dangler\ndescription: A skill whose SKILL.md cites a reference file that does not exist on disk.\n---\n\n# Dangler\n\nApply \`references/missing-template.md\` to the target.\n`;
  const dir = makeSkill('dangler', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /references\/missing-template\.md/);
});

test('a missing SKILL.md is an error', () => {
  const dir = makeSkill('empty-folder', null);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /SKILL\.md/);
});

test('a thin description warns but does not fail', () => {
  const md = `---\nname: thin\ndescription: Does things.\n---\n\n# Thin\n`;
  const dir = makeSkill('thin', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.match(res.stdout, /WARN/);
});

test('no arguments prints usage and exits 2', () => {
  const res = lint();
  assert.equal(res.status, 2);
  assert.match(res.stderr + res.stdout, /usage/i);
});

test('multiple folders: one bad folder fails the run, all are reported', () => {
  const good = makeSkill('good-skill', GOOD, { 'references/template.md': '# T\n' });
  const bad = makeSkill('no-desc', `---\nname: no-desc\n---\n\n# X\n`);
  const res = lint(good, bad);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /OK/);
  assert.match(res.stdout, /ERROR/);
});

// Dogfood: every shipped nexus skill must pass its own lint.
test('all shipped nexus skills are lint-clean', () => {
  const skillsDir = join(pluginRoot('nexus'), 'skills');
  const dirs = readdirSync(skillsDir)
    .map((d) => join(skillsDir, d))
    .filter((d) => existsSync(join(d, 'SKILL.md')));
  const res = lint(...dirs);
  assert.equal(res.status, 0, res.stdout);
});

test.after(() => cleanupSandboxes());
