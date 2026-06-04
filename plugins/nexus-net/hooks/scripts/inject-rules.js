#!/usr/bin/env node
/**
 * Nexus SessionStart hook: injects the plugin's always-on rules into context.
 *
 * Plugins have NO auto-loaded rules/ directory (verified — bug-class behaviour, not a config
 * miss), so this hook delivers every rules/*.md as additionalContext on each session start
 * (startup | clear | compact | resume). This is the mechanism that replaces the host
 * project's auto-loaded .claude/rules/.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..', '..');
const rulesDir = path.join(pluginRoot, 'rules');

let files = [];
try {
  files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md')).sort();
} catch {
  process.exit(0); // no rules dir — nothing to inject
}
if (files.length === 0) process.exit(0);

let body =
  '# Nexus — always-on rules\n' +
  '\nThe following rules are delivered by the nexus plugin and apply to this ' +
  'session. Treat them as if they were loaded from .claude/rules/.\n';

for (const f of files) {
  body += `\n\n--- ${f} ---\n` + fs.readFileSync(path.join(rulesDir, f), 'utf8');
}

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body }
}));
