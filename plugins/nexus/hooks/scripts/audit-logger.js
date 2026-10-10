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
 *   - token-usage.jsonl   — per-agent token reading {ts, agent, agent_id, tool, input, output,
 *                           cache_read, cache_creation, context, model} for whatever reads the
 *                           log. `model` is the transcript record's own `message.model` (string) —
 *                           omitted (not null) when unrecoverable; `agent_id` is present on
 *                           subagent rows only.
 *
 * The current in-flight turn's usage is not in the transcript yet at PreToolUse time, so we read the
 * last COMPLETED turn's usage (a one-turn lag — fine for a growth curve) from the ACTING agent's own
 * transcript. transcript_path is always the parent session's transcript — even inside a subagent — so:
 *   - main session (no agent_id — including an `--agent` session, which carries agent_type too):
 *     transcript_path.
 *   - subagent (agent_id present — the platform's documented main-vs-subagent distinguisher):
 *     {dirname(transcript_path)}/{session_id}/subagents/agent-{agent_id}.jsonl, or — for a
 *     Workflow-tool subagent — the same file one level down, under subagents/workflows/{run}/.
 *   - a subagent transcript that is missing, or an id outside [a-zA-Z0-9_-]: NO token row. The
 *     {session_id}.log line is still written; the parent's figures are never copied onto a subagent row.
 * Only the transcript TAIL is read (last 64KB) — the usage entry is by construction near the end,
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

// Resolve the main-thread persona for THIS session from the per-session registry (shared lib —
// was a hand-copied local definition until F45-RuntimeDriftHardening Step 3).
const { readSessionPersona } = require('./lib/read-session-persona');

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

// Last COMPLETED assistant turn's usage plus the model that produced it — read only the
// transcript tail (last 64KB). Returns {usage, model} (model is string | undefined) or null.
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
      if (u && (u.input_tokens != null || u.output_tokens != null)) return { usage: u, model: rec.message.model };
    }
  } catch {
    /* unreadable -> null */
  }
  return null;
}

const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

// Whose transcript a token row reads: {file, agentId?} or null (write no token row). A subagent row
// never falls back to transcript_path — that is the parent session's transcript, not the subagent's.
function resolveTranscript(data) {
  if (!data.agent_id) return { file: data.transcript_path };
  const sid = String(data.session_id || '');
  const id = String(data.agent_id);
  if (!data.transcript_path || !SAFE_ID.test(sid) || !SAFE_ID.test(id)) return null;
  const subDir = path.join(path.dirname(String(data.transcript_path)), sid, 'subagents');
  const name = `agent-${id}.jsonl`;
  const flat = path.join(subDir, name);
  if (fs.existsSync(flat)) return { file: flat, agentId: id };
  try {
    const wfDir = path.join(subDir, 'workflows');
    for (const run of fs.readdirSync(wfDir)) {
      const file = path.join(wfDir, run, name);
      if (fs.existsSync(file)) return { file, agentId: id };
    }
  } catch {
    /* no workflows folder -> no row */
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
      const source = resolveTranscript(data);
      const last = source && lastUsage(source.file);
      if (last) {
        const u = last.usage;
        const inputTok = u.input_tokens || 0;
        const cacheRead = u.cache_read_input_tokens || 0;
        const cacheCreation = u.cache_creation_input_tokens || 0;
        const rec = {
          ts,
          agent,
          ...(source.agentId ? { agent_id: source.agentId } : {}),
          tool: data.tool_name,
          input: inputTok,
          output: u.output_tokens || 0,
          cache_read: cacheRead,
          cache_creation: cacheCreation,
          context: inputTok + cacheRead + cacheCreation
        };
        if (last.model) rec.model = last.model;
        fs.appendFileSync(path.join(dir, 'token-usage.jsonl'), JSON.stringify(rec) + '\n');
      }
    } catch {
      // best-effort; never block
    }
    process.exit(0);
  });
}

main();
