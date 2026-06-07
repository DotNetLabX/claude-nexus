#!/usr/bin/env node
/**
 * Nexus PreToolUse hook: appends a one-line audit record for every tool call.
 * Async (observe-only) — never blocks. Writes JSONL under docs/audit/ in the host project.
 * Enforcement is handled separately by guard.js (synchronous).
 *
 * Two outputs:
 *   - tool-calls.log     — ALWAYS: {ts, agent, tool, cwd} per call (record-only trace, unchanged).
 *   - token-usage.jsonl  — ONLY when token_audit is on (argv[2]): adds the per-agent token reading
 *                          {ts, agent, tool, input, output, cache_read, cache_creation, context} so the
 *                          consumption-report skill can show how each agent grows its own context.
 *
 * The current in-flight turn's usage is not in the transcript yet at PreToolUse time, so we read the
 * last COMPLETED turn's usage from transcript_path (a one-turn lag — fine for a growth curve). For a
 * subagent call, transcript_path is that subagent's own transcript, so the reading is attributed to it.
 *
 * Design rules: best-effort, never block, fail silent on any error (bad JSON, unreadable transcript).
 * Default off means zero extra work for installs that do not opt in.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const AUDIT_ON = /^(1|true|on|yes)$/i.test(String(process.argv[2] || '').trim());

// Resolve the main-thread persona for THIS session from the per-session registry.
function readSessionPersona(sid, cwd) {
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(cwd || process.cwd(), '.claude', '.personas.json'), 'utf8'));
    return reg[sid] && reg[sid].agent;
  } catch {
    return null;
  }
}

// Last COMPLETED assistant turn's usage from the transcript (the in-flight turn isn't written yet).
// Scans lines from the end for the most recent record carrying a usage block. Returns null on any miss.
function lastUsage(transcriptPath) {
  try {
    if (!transcriptPath) return null;
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i];
      if (!ln || ln.indexOf('"usage"') === -1) continue;
      let rec;
      try { rec = JSON.parse(ln); } catch { continue; }
      const u = rec && rec.message && rec.message.usage;
      if (u && (u.input_tokens != null || u.output_tokens != null)) return u;
    }
  } catch {
    /* unreadable -> null */
  }
  return null;
}

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (input += d));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      const agent = data.agent_type || readSessionPersona(data.session_id, data.cwd) || 'main';
      const ts = new Date().toISOString();
      const dir = path.join(process.cwd(), 'docs', 'audit');
      fs.mkdirSync(dir, { recursive: true });

      // Always: the tool-call trace (unchanged behavior).
      fs.appendFileSync(
        path.join(dir, 'tool-calls.log'),
        JSON.stringify({ ts, agent, tool: data.tool_name, cwd: data.cwd }) + '\n'
      );

      // Opt-in: per-agent token reading.
      if (AUDIT_ON) {
        const u = lastUsage(data.transcript_path);
        if (u) {
          const inputTok = u.input_tokens || 0;
          const outputTok = u.output_tokens || 0;
          const cacheRead = u.cache_read_input_tokens || 0;
          const cacheCreation = u.cache_creation_input_tokens || 0;
          const rec = {
            ts,
            agent,
            tool: data.tool_name,
            input: inputTok,
            output: outputTok,
            cache_read: cacheRead,
            cache_creation: cacheCreation,
            context: inputTok + cacheRead + cacheCreation
          };
          fs.appendFileSync(path.join(dir, 'token-usage.jsonl'), JSON.stringify(rec) + '\n');
        }
      }
    } catch {
      // best-effort; never block
    }
    process.exit(0);
  });
}

main();
