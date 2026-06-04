#!/usr/bin/env node
/**
 * Nexus PreToolUse hook: appends a one-line audit record for every tool call.
 * Async (observe-only) — never blocks. Writes JSONL to docs/audit/tool-calls.log in
 * the host project. Enforcement is handled separately by guard.js (synchronous).
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Resolve the main-thread persona for THIS session from the per-session registry.
function readSessionPersona(sid, cwd) {
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(cwd || process.cwd(), '.claude', '.personas.json'), 'utf8'));
    return reg[sid] && reg[sid].agent;
  } catch {
    return null;
  }
}

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (input += d));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      const rec = {
        ts: new Date().toISOString(),
        agent: data.agent_type || readSessionPersona(data.session_id, data.cwd) || 'main',
        tool: data.tool_name,
        cwd: data.cwd
      };
      const dir = path.join(process.cwd(), 'docs', 'audit');
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(path.join(dir, 'tool-calls.log'), JSON.stringify(rec) + '\n');
    } catch {
      // best-effort; never block
    }
    process.exit(0);
  });
}

main();
