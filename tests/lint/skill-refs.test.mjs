// T1 — dangling-reference lint. No prior art in the ecosystem (research §2 gap 2):
// an agent that names a skill which doesn't ship fails silently at runtime — the model
// just can't load it. Every reference must resolve to a shipped skill directory.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatter, listAgents, pluginRoot } from '../helpers.mjs';

const nexusSkills = new Set(readdirSync(join(pluginRoot('nexus'), 'skills')));

test('agent frontmatter skills: lists resolve to shipped nexus skills', () => {
  for (const file of listAgents('nexus')) {
    const { data } = frontmatter(file);
    if (!data || !data.skills) continue;
    for (const name of data.skills.split(',').map((s) => s.trim()).filter(Boolean)) {
      assert.ok(
        nexusSkills.has(name),
        `${file}: frontmatter references skill "${name}" but plugins/nexus/skills/${name}/ does not ship`
      );
    }
  }
});

test('in-body `name` skill references resolve to shipped nexus skills', () => {
  // The convention across agents/rules/skills is `skill-name` skill — lintable text.
  // Stack-plugin skills (nexus-dotnet) are also legal targets: pipeline docs reference them.
  const dotnetSkills = new Set(readdirSync(join(pluginRoot('nexus-dotnet'), 'skills')));
  const surfaces = [];
  for (const dir of ['agents', 'rules']) {
    const d = join(pluginRoot('nexus'), dir);
    for (const f of readdirSync(d).filter((f) => f.endsWith('.md'))) surfaces.push(join(d, f));
  }
  for (const skillDir of nexusSkills) {
    const f = join(pluginRoot('nexus'), 'skills', skillDir, 'SKILL.md');
    if (existsSync(f)) surfaces.push(f);
  }

  for (const file of surfaces) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/`([a-z][a-z0-9-]{2,})` skill/g)) {
      const name = m[1];
      assert.ok(
        nexusSkills.has(name) || dotnetSkills.has(name),
        `${file}: body references "\`${name}\` skill" but no shipped skill has that name`
      );
    }
  }
});

test('format-skill references ({x}-format) resolve to shipped skills', () => {
  // Agents lean on the *-format skills as authoritative artifact specs; a dangling one
  // means an agent writes an artifact with no format contract behind it.
  for (const file of listAgents('nexus')) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/`([a-z-]+-format)`/g)) {
      assert.ok(
        nexusSkills.has(m[1]),
        `${file}: references format skill "${m[1]}" which does not ship`
      );
    }
  }
});
