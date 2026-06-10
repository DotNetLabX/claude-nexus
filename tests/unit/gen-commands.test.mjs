// T2 — gen-commands.mjs in a tmp copy of the repo layout (the script resolves paths
// relative to its own location, so the copy preserves scripts/ <-> plugins/ geometry).
// Pins the single-source-of-truth contract: command = activation wrapper + agent body,
// frontmatter INTENTIONALLY dropped (audit B4 — a command must inherit the session's model).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, cpSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, run, makeSandbox, cleanupSandboxes, listAgents, agentName } from '../helpers.mjs';

let tmp;
before(() => {
  tmp = makeSandbox('nexus-gencmd-');
  mkdirSync(join(tmp, 'scripts'), { recursive: true });
  cpSync(join(REPO, 'scripts', 'gen-commands.mjs'), join(tmp, 'scripts', 'gen-commands.mjs'));
  cpSync(join(REPO, 'plugins', 'nexus', 'agents'), join(tmp, 'plugins', 'nexus', 'agents'), { recursive: true });
});
after(cleanupSandboxes);

test('generates one command per agent with wrapper, body, and no agent frontmatter', () => {
  const res = run(process.execPath, [join(tmp, 'scripts', 'gen-commands.mjs'), 'nexus']);
  assert.equal(res.status, 0, res.stderr);

  const agents = listAgents('nexus').map(agentName);
  const commands = readdirSync(join(tmp, 'plugins', 'nexus', 'commands'));
  assert.equal(commands.length, agents.length, 'one generated command per agent');

  for (const name of agents) {
    const cmd = readFileSync(join(tmp, 'plugins', 'nexus', 'commands', `${name}.md`), 'utf8');
    assert.match(cmd, /^---\ndescription: Become /, `${name}: activation wrapper frontmatter`);
    assert.ok(cmd.includes(`write the single word \`${name}\` to \`.claude/.current-agent\``),
      `${name}: persona-registration instruction`);
    assert.ok(cmd.includes('$ARGUMENTS'), `${name}: first-task argument slot`);
    assert.ok(!/\nmodel:/.test(cmd), `${name}: agent model: must NOT leak into the command (audit B4)`);
    assert.ok(!/\neffort:/.test(cmd), `${name}: agent effort: must NOT leak into the command`);
    // The agent body itself must be inlined (spot-check via the agent's own H1).
    const agentBody = readFileSync(join(tmp, 'plugins', 'nexus', 'agents', `${name}.md`), 'utf8');
    const h1 = agentBody.match(/^# .+$/m)[0];
    assert.ok(cmd.includes(h1), `${name}: agent body not inlined (missing "${h1}")`);
  }
});

test('a plugin without agents/ is a clean no-op, not an error', () => {
  const res = run(process.execPath, [join(tmp, 'scripts', 'gen-commands.mjs'), 'nexus-dotnet']);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /no agents\/ dir — nothing to generate/);
  assert.ok(!existsSync(join(tmp, 'plugins', 'nexus-dotnet', 'commands')), 'nothing created');
});
