// T1 — dangling-reference lint. No prior art in the ecosystem (research §2 gap 2):
// an agent that names a skill which doesn't ship fails silently at runtime — the model
// just can't load it. Every reference must resolve to a shipped skill directory.
//
// Discovery is marketplace-driven (adhoc-AnalystExtension Step 1 — was hard-coded to nexus (+
// nexus-dotnet as the sole cross-plugin carve-out for test 2), so a dangling reference in any
// other plugin shipped lint-green, and a same-plugin extension skill (e.g. nexus-analytics's
// data-investigation -> mine-semantic-model, now a SAME-plugin sibling post-relocation) had no
// coverage at all. Iterates marketplace.plugins (release.test.mjs:19 precedent).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatter, listAgents, listSkills, pluginRoot, REPO } from '../helpers.mjs';

const marketplace = JSON.parse(readFileSync(join(REPO, '.claude-plugin', 'marketplace.json'), 'utf8'));
const pluginNames = marketplace.plugins.map((p) => p.name);

// Per-plugin skill-name sets, plus their union — a skill in ANY plugin is a legal in-body
// reference target (the mine-verify-cover-dotnet adapter already references nexus core's
// mine-verify-cover this way; extension plugins reference core-plugin skills the same way).
const skillsByPlugin = new Map(
  pluginNames.map((p) => [p, new Set(listSkills(p).map((f) => f.replace(/[\\/]SKILL\.md$/, '').split(/[\\/]/).pop()))])
);
const allSkills = new Set([...skillsByPlugin.values()].flatMap((s) => [...s]));

test('agent frontmatter skills: lists resolve to shipped skills (same plugin)', () => {
  let checkedAny = false;
  for (const plugin of pluginNames) {
    const ownSkills = skillsByPlugin.get(plugin);
    for (const file of listAgents(plugin)) {
      const { data } = frontmatter(file);
      if (!data || !data.skills) continue;
      checkedAny = true;
      for (const name of data.skills.split(',').map((s) => s.trim()).filter(Boolean)) {
        assert.ok(
          ownSkills.has(name),
          `${file}: frontmatter references skill "${name}" but plugins/${plugin}/skills/${name}/ does not ship`
        );
      }
    }
  }
  assert.ok(checkedAny, 'no agent frontmatter skills: list was checked — test is inert');
});

test('in-body `name` skill references resolve to a shipped skill (any plugin)', () => {
  // The convention across agents/rules/skills is `skill-name` skill — lintable text.
  const surfaces = [];
  for (const plugin of pluginNames) {
    for (const dir of ['agents', 'rules']) {
      const d = join(pluginRoot(plugin), dir);
      if (!existsSync(d)) continue;
      for (const f of readdirSync(d).filter((f) => f.endsWith('.md'))) surfaces.push(join(d, f));
    }
    for (const skillDir of skillsByPlugin.get(plugin)) {
      const f = join(pluginRoot(plugin), 'skills', skillDir, 'SKILL.md');
      if (existsSync(f)) surfaces.push(f);
    }
  }

  for (const file of surfaces) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/`([a-z][a-z0-9-]{2,})` skill/g)) {
      const name = m[1];
      assert.ok(
        allSkills.has(name),
        `${file}: body references "\`${name}\` skill" but no shipped skill (any plugin) has that name`
      );
    }
  }
});

test('format-skill references ({x}-format) resolve to a shipped skill (any plugin)', () => {
  // Agents lean on the *-format skills as authoritative artifact specs; a dangling one
  // means an agent writes an artifact with no format contract behind it.
  let checkedAny = false;
  for (const plugin of pluginNames) {
    for (const file of listAgents(plugin)) {
      checkedAny = true;
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/`([a-z-]+-format)`/g)) {
        assert.ok(
          allSkills.has(m[1]),
          `${file}: references format skill "${m[1]}" which does not ship`
        );
      }
    }
  }
  assert.ok(checkedAny, 'no agents were checked for format-skill references — test is inert');
});
