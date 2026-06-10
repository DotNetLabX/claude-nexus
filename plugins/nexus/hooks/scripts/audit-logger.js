#!/usr/bin/env node
/**
 * Nexus PreToolUse hook: OPT-IN audit trail. Async (observe-only) — never blocks.
 *
 * Fully gated behind the `token_audit` plugin config (argv[2]) — when OFF (the default), this
 * script does nothing at all: no directories, no files, zero footprint in the host project.
 *
 * When ON, writes under `.claude/audit/` in the host project (NOT docs/ — audit logs are local
 * state, not committed content; add `.claude/audit/` to the project's .gitignore):
 *   - {session_id}.log    — per-session tool-call trace: {ts, agent, tool, detail, cwd} per call.
 *                           `detail` carries the forensic argument (file_path / command / skill /
 *                           pattern, 120-char excerpt) so "who wrote what during analyze" is
 *                           answerable from the trail. Per-session files keep concurrent sessions
 *                           from interleaving.
 *   - token-usage.jsonl   — per-agent token reading {ts, agent, tool, input, output, cache_read,
 *                           cache_creation, context} for the consumption-report skill.
 *
 * The current in-flight turn's usage is not in the transcript yet at PreToolUse time, so we read the
 * last COMPLETED turn's usage from transcript_path (a one-turn lag — fine for a growth curve). For a
 * subagent call, transcript_path is that subagent's own transcript, so the reading is attributed to it.
 * Only the transcript TAIL is read (last 64KB) — the usage record is by construction near the end,
 * and whole-file reads grow O(n²) over a long session.
 *
 * Design rules: best-effort, never block, fail silent on any error (bad JSON, unreadable transcript).
 * Root resolution: CLAUDE_PROJECT_DIR || event cwd || process cwd — the hook process's own cwd alone
 * is NOT trustworthy (it follows wherever the session is rooted; this was the stray-log bug).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const AUDIT_ON = /^(1|true|on|yes)$/i.test(String(process.argv[2] || '').trim());

// Resolve the main-thread persona for THIS session from the per-session registry.
function readSessionPersona(sid, root) {
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(root, '.claude', '.personas.json'), 'utf8'));
    return reg[sid] && reg[sid].agent;
  } catch {
    return null;
  }
}

// Forensic detail: the one argument that identifies WHAT the call touched. Content-redacted —
// paths/commands/names only, 120-char cap, never file contents.
function extractDetail(toolName, ti) {
  if (!ti || typeof ti !== 'object') return '';
  const pick =
    ti.file_path || ti.path || ti.notebook_path ||
    ti.command ||
    ti.skill ||
    ti.pattern ||
    ti.url ||
    (ti.subagent_type ? `${ti.subagent_type}: ${String(ti.description || '')}` : '') ||
    ti.prompt || '';
  return String(pick).replace(/\s+/g, ' ').slice(0, 120);
}

// Last COMPLETED assistant turn's usage — read only the transcript tail (last 64KB).
function lastUsage(transcriptPath) {
  try {
    if (!transcriptPath) return null;
    const fd = fs.openSync(transcriptPath, 'r');
    let text;
    try {
      const size = fs.fstatSync(fd).size;
      const want = Math.min(size, 64 * 1024);
      const buf = Buffer.alloc(want);
      fs.readSync(fd, buf, 0, want, size - want);
      text = buf.toString('utf8');
    } finally {
      fs.closeSync(fd);
    }
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i];
      if (!ln || ln.indexOf('"usage"') === -1) continue;
      let rec;
      try { rec = JSON.parse(ln); } catch { continue; } // first (partial) line of the tail may not parse — skip
      const u = rec && rec.message && rec.message.usage;
      if (u && (u.input_tokens != null || u.output_tokens != null)) return u;
    }
  } catch {
    /* unreadable -> null */
  }
  return null;
}

function main() {
  if (!AUDIT_ON) { process.exit(0); } // default off = truly zero work (no dirs, no files)

  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (input += d));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
      const agent = data.agent_type || readSessionPersona(data.session_id, root) || 'main';
      const ts = new Date().toISOString();
      const dir = path.join(root, '.claude', 'audit');
      fs.mkdirSync(dir, { recursive: true });

      // Per-session tool-call trace with forensic detail.
      const sid = String(data.session_id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
      fs.appendFileSync(
        path.join(dir, `${sid}.log`),
        JSON.stringify({ ts, agent, tool: data.tool_name, detail: extractDetail(data.tool_name, data.tool_input), cwd: data.cwd }) + '\n'
      );

      // Per-agent token reading.
      const u = lastUsage(data.transcript_path);
      if (u) {
        const inputTok = u.input_tokens || 0;
        const cacheRead = u.cache_read_input_tokens || 0;
        const cacheCreation = u.cache_creation_input_tokens || 0;
        const rec = {
          ts,
          agent,
          tool: data.tool_name,
          input: inputTok,
          output: u.output_tokens || 0,
          cache_read: cacheRead,
          cache_creation: cacheCreation,
          context: inputTok + cacheRead + cacheCreation
        };
        fs.appendFileSync(path.join(dir, 'token-usage.jsonl'), JSON.stringify(rec) + '\n');
      }
    } catch {
      // best-effort; never block
    }
    process.exit(0);
  });
}

main();
