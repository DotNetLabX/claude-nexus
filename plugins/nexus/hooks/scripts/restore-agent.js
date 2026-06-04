#!/usr/bin/env node
/**
 * Nexus SessionStart hook: re-injects the active agent persona after
 * clear/compact/resume so the role survives a context reset.
 *
 * Reads .claude/.current-agent (written by the persona commands in the host
 * project), loads that agent's full body from the plugin's own agents/ folder,
 * and injects it as SessionStart additionalContext. In a plugin the agent file
 * is NOT at .claude/agents/, and ${CLAUDE_PLUGIN_ROOT} does not expand inside
 * command/agent markdown — so a bare "re-read the agent file" reminder is
 * un-actionable. Injecting the body directly is the only reliable mechanism.
 *
 * Plugin root is derived from __dirname (hooks/scripts/ -> two levels up),
 * which is robust against the version-keyed cache path and needs no env var.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const VALID = ['architect', 'developer', 'reviewer', 'team-lead', 'po', 'critic', 'learner', 'solo'];

function readCurrentAgent() {
  try {
    const p = path.join(process.cwd(), '.claude', '.current-agent');
    return fs.readFileSync(p, 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

function readAgentBody(agent) {
  const pluginRoot = path.resolve(__dirname, '..', '..'); // hooks/scripts -> plugin root
  try {
    return stripFrontmatter(fs.readFileSync(path.join(pluginRoot, 'agents', `${agent}.md`), 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const agent = readCurrentAgent();
  if (!agent || !VALID.includes(agent)) process.exit(0);

  const body = readAgentBody(agent);
  const context = body
    ? `Active persona: ${agent}. You are operating as the ${agent} agent for this session. ` +
      `Your full role definition is restored below — adopt it exactly; this IS your role.\n\n${body}`
    : `Active persona: ${agent}. You are operating as the ${agent} agent, but its role definition ` +
      `could not be loaded from the plugin. Ask the user to re-run the /${agent} command.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context
    }
  }));
  process.exit(0);
}

main();
