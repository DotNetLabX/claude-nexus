// T1 — frontmatter schema lint for shipped prompt assets.
// Ports the proven ecosystem pattern (anthropics/claude-plugins-official validate-frontmatter):
// agents and skills must declare name + description; keys are a closed set so a typo'd or
// platform-rejected key (hooks/mcpServers/permissionMode in plugin agents) fails here, not live.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatter, listAgents, listSkills, agentName, pluginRoot } from '../helpers.mjs';

const AGENT_KEYS = new Set(['name', 'description', 'model', 'effort', 'skills', 'disallowedTools', 'maxTurns']);
const AGENT_FORBIDDEN = new Set(['hooks', 'mcpServers', 'permissionMode']); // platform rejects these in plugin agents
const SKILL_KEYS = new Set(['name', 'description', 'user-invocable']);
const MODELS = new Set(['opus', 'sonnet', 'haiku', 'inherit']);
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

test('every nexus agent has valid frontmatter', () => {
  const agents = listAgents('nexus');
  assert.ok(agents.length >= 8, `expected >= 8 agents, found ${agents.length}`);
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
});

test('every skill (both plugins) has valid frontmatter', () => {
  for (const plugin of ['nexus', 'nexus-dotnet']) {
    const skills = listSkills(plugin);
    assert.ok(skills.length > 0, `${plugin}: no skills found`);
    for (const file of skills) {
      const { data } = frontmatter(file);
      assert.ok(data, `${file}: missing frontmatter block`);
      const dir = file.replace(/[\\/]SKILL\.md$/, '').split(/[\\/]/).pop();
      assert.equal(data.name, dir, `${file}: frontmatter name must match directory name`);
      assert.ok((data.description || '').length >= 20, `${file}: description missing or too thin`);
      for (const key of Object.keys(data)) {
        assert.ok(SKILL_KEYS.has(key), `${file}: unknown frontmatter key "${key}"`);
      }
    }
  }
});

test('every agent has a generated command and commands carry no model override', () => {
  // gen-commands drops agent frontmatter BY DESIGN (audit B4): a persona command must inherit
  // the interactive session's model. A model: key in a command means a hand edit or a generator
  // regression — both wrong.
  for (const file of listAgents('nexus')) {
    const cmd = join(pluginRoot('nexus'), 'commands', `${agentName(file)}.md`);
    assert.ok(existsSync(cmd), `missing generated command for agent ${agentName(file)} — run scripts/gen-commands.mjs nexus`);
    const { data } = frontmatter(cmd);
    assert.ok(data && data.description, `${cmd}: command needs a description`);
    assert.ok(!('model' in data), `${cmd}: commands must not carry model overrides (gen-commands drops frontmatter by design)`);
  }
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
