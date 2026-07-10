// T1 — frontmatter schema lint for shipped prompt assets.
// Ports the proven ecosystem pattern (anthropics/claude-plugins-official validate-frontmatter):
// agents and skills must declare name + description; keys are a closed set so a typo'd or
// platform-rejected key (hooks/mcpServers/permissionMode in plugin agents) fails here, not live.
//
// Discovery is marketplace-driven (adhoc-AnalystExtension Step 1 — was hard-coded to nexus /
// ['nexus','nexus-dotnet'], so a malformed skill/agent in any other plugin, including a brand-new
// one, shipped lint-green). Iterates marketplace.plugins (release.test.mjs:19 precedent); a plugin
// missing the relevant dir (no agents/, e.g. nexus-dotnet) is skipped, not failed — absence is legal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { frontmatter, listAgents, listSkills, agentName, pluginRoot, REPO } from '../helpers.mjs';

const AGENT_KEYS = new Set(['name', 'description', 'model', 'effort', 'skills', 'disallowedTools', 'maxTurns']);
const AGENT_FORBIDDEN = new Set(['hooks', 'mcpServers', 'permissionMode']); // platform rejects these in plugin agents
const SKILL_KEYS = new Set(['name', 'description', 'user-invocable', 'disable-model-invocation']);
const MODELS = new Set(['opus', 'sonnet', 'haiku', 'inherit']);
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

// Pre-existing-violation protocol (adhoc-AnalystExtension Step 1): the marketplace-wide widening
// surfaces violations in OTHER plugins nobody checked before. Never silently narrowed or fixed
// here (that plugin's own shipped files aren't this slug's to touch) — named explicitly instead;
// the fix rides that plugin's own next release. May be empty; may not be silent.
const SKILL_FRONTMATTER_KEY_SKIPLIST = new Map([
  // nexus-flutter/skills/figma-to-flutter/SKILL.md carries `argument-hint` (not a skill
  // frontmatter key per SKILL_KEYS) — pre-existing at HEAD, first surfaced by this widening.
  ['plugins/nexus-flutter/skills/figma-to-flutter/SKILL.md', new Set(['argument-hint'])],
]);

const marketplace = JSON.parse(readFileSync(join(REPO, '.claude-plugin', 'marketplace.json'), 'utf8'));
const pluginNames = marketplace.plugins.map((p) => p.name);

test('every agent (every plugin) has valid frontmatter', () => {
  let checkedAnyPlugin = false;
  for (const plugin of pluginNames) {
    const agents = listAgents(plugin);
    if (agents.length === 0) continue; // no agents/ dir — legal (e.g. nexus-dotnet ships skills only)
    checkedAnyPlugin = true;
    if (plugin === 'nexus') assert.ok(agents.length >= 8, `expected >= 8 nexus agents, found ${agents.length}`);
    for (const file of agents) {
      const { data } = frontmatter(file);
      assert.ok(data, `${file}: missing frontmatter block`);
      assert.equal(data.name, agentName(file), `${file}: frontmatter name must match filename`);
      assert.ok((data.description || '').length >= 40, `${file}: description missing or too thin to route on`);
      for (const key of Object.keys(data)) {
        assert.ok(!AGENT_FORBIDDEN.has(key), `${file}: key "${key}" is rejected by the platform in plugin agents`);
        assert.ok(AGENT_KEYS.has(key), `${file}: unknown frontmatter key "${key}" (typo, or extend AGENT_KEYS deliberately)`);
      }
      if (data.model) assert.ok(MODELS.has(data.model), `${file}: unknown model "${data.model}"`);
      if (data.effort) assert.ok(EFFORTS.has(data.effort), `${file}: unknown effort "${data.effort}"`);
    }
  }
  assert.ok(checkedAnyPlugin, 'no plugin with an agents/ dir was checked — test is inert');
});

test('every skill (every plugin) has valid frontmatter', () => {
  let checkedAnyPlugin = false;
  for (const plugin of pluginNames) {
    const skills = listSkills(plugin);
    if (skills.length === 0) continue; // no skills/ dir — legal, though every plugin ships some today
    checkedAnyPlugin = true;
    for (const file of skills) {
      const { data } = frontmatter(file);
      assert.ok(data, `${file}: missing frontmatter block`);
      const dir = file.replace(/[\\/]SKILL\.md$/, '').split(/[\\/]/).pop();
      assert.equal(data.name, dir, `${file}: frontmatter name must match directory name`);
      assert.ok((data.description || '').length >= 20, `${file}: description missing or too thin`);
      const relPath = relative(REPO, file).replace(/\\/g, '/');
      const allowedExtra = SKILL_FRONTMATTER_KEY_SKIPLIST.get(relPath);
      for (const key of Object.keys(data)) {
        if (allowedExtra && allowedExtra.has(key)) continue; // named pre-existing exemption
        assert.ok(SKILL_KEYS.has(key), `${file}: unknown frontmatter key "${key}"`);
      }
    }
  }
  assert.ok(checkedAnyPlugin, 'no plugin skills were checked — test is inert');
});

test('every agent has a generated command and commands carry no model override', () => {
  // gen-commands drops agent frontmatter BY DESIGN (audit B4): a persona command must inherit
  // the interactive session's model. A model: key in a command means a hand edit or a generator
  // regression — both wrong.
  let checkedAnyPlugin = false;
  for (const plugin of pluginNames) {
    const agents = listAgents(plugin);
    if (agents.length === 0) continue;
    checkedAnyPlugin = true;
    for (const file of agents) {
      const cmd = join(pluginRoot(plugin), 'commands', `${agentName(file)}.md`);
      assert.ok(existsSync(cmd), `missing generated command for agent ${agentName(file)} (plugin ${plugin}) — run scripts/gen-commands.mjs ${plugin}`);
      const { data } = frontmatter(cmd);
      assert.ok(data && data.description, `${cmd}: command needs a description`);
      assert.ok(!('model' in data), `${cmd}: commands must not carry model overrides (gen-commands drops frontmatter by design)`);
    }
  }
  assert.ok(checkedAnyPlugin, 'no plugin commands were checked — test is inert');
});

test('hooks.json parses and every referenced script exists on disk', () => {
  // The official validator checks hooks.json SCHEMA but not that the scripts exist —
  // a renamed script ships silently and every session breaks. Close that gap here.
  const hooksFile = join(pluginRoot('nexus'), 'hooks', 'hooks.json');
  const cfg = JSON.parse(readFileSync(hooksFile, 'utf8'));
  const commands = JSON.stringify(cfg).match(/\$\{CLAUDE_PLUGIN_ROOT\}[^"\\ ]*/g) || [];
  assert.ok(commands.length > 0, 'hooks.json references no plugin scripts — suspicious');
  for (const ref of commands) {
    const rel = ref.replace('${CLAUDE_PLUGIN_ROOT}', '');
    const onDisk = join(pluginRoot('nexus'), rel);
    assert.ok(existsSync(onDisk), `hooks.json references ${rel} but it does not exist on disk`);
  }
});
