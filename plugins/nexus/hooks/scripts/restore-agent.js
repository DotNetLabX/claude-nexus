#!/usr/bin/env node
/**
 * Nexus SessionStart hook: session-aware persona restore.
 *
 * Personas are tracked per session in the HOST project's .claude/.personas.json:
 *     { "<session_id>": { "agent": "architect", "ts": <epoch-ms> }, ... }
 * written by register-persona.js when a /<agent> command sets the role.
 *
 * Restore policy (decided deliberately — see the persona design notes):
 *   compact -> restore: emit a cap-safe pointer to the role (the summary dropped it)
 *   clear   -> forget THIS session's persona (clear is the exit)
 *   startup -> nothing (a fresh session_id has no entry — clean slate for free)
 *   resume  -> nothing (the transcript, persona included, is reloaded verbatim)
 * Entries older than 16h are pruned on every run so abandoned sessions self-expire.
 *
 * The restore payload is a POINTER, never the role's text (ADR-85): every shipped agent file is
 * larger than the platform's per-hook output cap, so an inlined body is persisted to a file and
 * never reaches the model. We emit identity + the agent's one-line frontmatter description + the
 * resolved absolute agent-file path + an instruction to read it. In a plugin that file is NOT at
 * .claude/agents/ and ${CLAUDE_PLUGIN_ROOT} does not expand in command/agent markdown, so the
 * path is resolved here from __dirname (robust against the version-keyed cache path) and handed
 * to the model already absolute.
 *
 * The pointer also RE-GROUNDS the resumed session (ADR-89, which amends ADR-85): re-adopting the
 * role file is not the same as re-grounding in the work, so the payload also tells the agent to
 * re-run whatever "Context to load first" duties its role file names, and to treat everything the
 * compaction summary carried over as a claim to re-verify against the repo's artifacts and
 * standing protocol rules — never as a fact. The claims half is role-independent, so it rides the
 * fallback payload too: a session whose role file never loaded is exactly where second-hand
 * context is most dangerous.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TTL_MS = 16 * 60 * 60 * 1000;

// Two numbers, one concept — same shape as inject-rules.js. The platform caps a hook's output,
// additionalContext included, at PLATFORM_CAP chars. The DETERMINISTIC per-role gate lives in
// tests/unit/persona.test.mjs (it parses these constants rather than re-typing them), and this
// runtime tripwire sits between that gate and the cap, warning only — fail open.
const PLATFORM_CAP = 10000;
const WARN_AT = PLATFORM_CAP - 500;

// Valid roles = whatever the plugin actually ships — derived from agents/, never hardcoded
// (a hardcoded roster silently orphans a newly added agent: it registers but never restores).
function validRoles() {
  try {
    const pluginRoot = path.resolve(__dirname, '..', '..');
    return fs.readdirSync(path.join(pluginRoot, 'agents'))
      .filter(f => f.endsWith('.md'))
      .map(f => f.slice(0, -3));
  } catch {
    return [];
  }
}

function agentFile(agent) {
  const pluginRoot = path.resolve(__dirname, '..', '..'); // hooks/scripts -> plugin root
  return path.join(pluginRoot, 'agents', `${agent}.md`);
}

// Identity only — the one-line frontmatter `description:`, never the body (see the cap note above).
function readAgentMeta(agent) {
  let md;
  try { md = fs.readFileSync(agentFile(agent), 'utf8'); } catch { return { found: false, description: null }; }
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const desc = fm && fm[1].match(/^description:[ \t]*(.+)$/m);
  return { found: true, description: desc ? desc[1].trim() : null };
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let sid = '', source = '', evtCwd = '';
  try { const e = JSON.parse(raw || '{}'); sid = e.session_id || ''; source = e.source || ''; evtCwd = e.cwd || ''; } catch { /* ignore */ }

  // Same root chain as register-persona.js — the hook process's own cwd may differ from the event's.
  const root = process.env.CLAUDE_PROJECT_DIR || evtCwd || process.cwd();
  const file = path.join(root, '.claude', '.personas.json');

  let reg = {};
  try { reg = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { /* no registry yet */ }

  // Prune expired entries.
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(reg)) {
    const e = reg[k];
    if (!e || typeof e.ts !== 'number' || now - e.ts > TTL_MS) { delete reg[k]; changed = true; }
  }

  // /clear is the exit: drop this session's persona so a later compact won't resurrect it.
  if (source === 'clear' && sid && reg[sid]) { delete reg[sid]; changed = true; }

  if (changed) {
    try {
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(reg, null, 2));
      fs.renameSync(tmp, file);
    } catch { /* best-effort */ }
  }

  // Restore ONLY on compact.
  if (source !== 'compact' || !sid) process.exit(0);
  const agent = reg[sid] && reg[sid].agent;
  if (!agent || !validRoles().includes(agent)) process.exit(0);

  const meta = readAgentMeta(agent);
  const roleFile = agentFile(agent);
  const context = meta.found
    ? `Active persona: ${agent}. You are operating as the ${agent} agent for this session.` +
      (meta.description ? `\n${meta.description}` : '') +
      `\n\nThe full role definition is not inlined here — it exceeds the per-hook injection cap, ` +
      `so injecting it would silently drop it instead of delivering it (ADR-85).\n\n` +
      `FIRST ACTION, before resuming anything: Read ${roleFile} in full and re-adopt it exactly — ` +
      `this IS your role — then re-run any "Context to load first" duties it names before ` +
      `continuing the task that was in progress.\n` +
      `Everything carried over from the compaction summary is a CLAIM, not a fact — re-verify any ` +
      `status, protocol, or boundary fact against the repo's artifacts and standing protocol rules ` +
      `(backlog, summaries, ADRs, CLAUDE.md, the plugin's rules) before acting on it.\n` +
      `If that Read is unavailable or denied (in a plugin install the file lives in the plugin ` +
      `cache, outside the project workspace), say so explicitly and ask the user to re-run ` +
      `/nexus:${agent} — never continue silently without the role.`
    : `Active persona: ${agent}. You are operating as the ${agent} agent, but its role definition ` +
      `could not be loaded from the plugin. Ask the user to re-run the /${agent} command.\n` +
      `Everything carried over from the compaction summary is a CLAIM, not a fact — re-verify any ` +
      `status, protocol, or boundary fact against the repo's artifacts and standing protocol rules ` +
      `before acting on it.`;

  // Fail OPEN — emit regardless (a dropped persona is worse than an oversize one) and warn on
  // stderr, which the platform surfaces without breaking the hook.
  if (context.length > WARN_AT) {
    process.stderr.write(
      `nexus restore-agent: persona pointer for ${agent} is ${context.length} chars, over the ` +
      `${WARN_AT} tripwire (platform hook-output cap is ${PLATFORM_CAP} — oversize output is ` +
      `persisted to a file and never reaches the model). Restore must stay a pointer, not a body.\n`
    );
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context }
  }));
  process.exit(0);
});
