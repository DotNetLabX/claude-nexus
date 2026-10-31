#!/usr/bin/env node
/**
 * Nexus persona registration — records a session's role in the HOST project's .claude/.personas.json
 * (shape and prune: lib/persona-record.js). Two events reach it:
 *
 *   UserPromptSubmit — a prompt that is a persona command (`/{plugin}:{agent}`, or a bare `/{agent}`)
 *     whose plugin ships `agents/{agent}.md` records `{agent, plugin, unattended?, transcript?}`. The
 *     prompt arrives as typed, so the role is recorded whether or not the model later writes the
 *     trigger file. Runs synchronously on every prompt: anything not starting with `/` leaves before
 *     any file is read, and nothing is ever printed — a prompt hook's stdout reaches the model.
 *   PostToolUse(Write|Edit) of .claude/.current-agent — the persona commands' own write, and the only
 *     path for the "be {agent}" phrase, which has no command. Naming the role already recorded keeps
 *     the entry's plugin, unattended mark and transcript; naming another role replaces the entry.
 *
 * Why a hook and not the command itself: a slash command is model-run and never learns its own
 * session_id; a SessionStart-injected id would be shared/raced across concurrent tabs. The hook
 * payload is the only place both the session_id and the chosen role meet.
 *
 * Two files BY DESIGN (don't "unify" them): `.claude/.current-agent` is only the WRITE-TRIGGER —
 * nothing ever reads it back; `.claude/.personas.json` is the durable per-session registry that
 * guard.js / audit-logger.js / restore-agent.js consume.
 */
'use strict';

const { isSpawned } = require('./lib/is-spawned');

const ROLE = /^[a-z][a-z-]{1,30}$/;
const COMMAND = /^\/(?:([a-z0-9][a-z0-9._-]*):)?([a-z][a-z-]{1,30})(?=\s|$)/;

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try { run(); } catch { /* never block a prompt or a tool call */ }
  process.exit(0);
});

function run() {
  let evt = {};
  try { evt = JSON.parse(raw || '{}'); } catch { return; }

  // Subagent events carry agent_id AND the PARENT's session_id (Probe P1, 2026-06-10) — a
  // background subagent's event would silently reassign the MAIN session's persona. Persona
  // commands run main-thread only; ignore every subagent event. A `--agent` main session carries
  // agent_type but no agent_id, and registers like any main session.
  if (isSpawned(evt) || !evt.session_id) return;

  const isPrompt = evt.hook_event_name === 'UserPromptSubmit' || typeof evt.prompt === 'string';
  if (isPrompt) {
    const text = String(evt.prompt || '').trimStart();
    if (!text.startsWith('/')) return;
    const m = text.match(COMMAND);
    if (!m) return;
    record(evt, (prev, ctx) => {
      const found = ctx.findAgent(m[2], { plugin: m[1] || null, root: ctx.root });
      if (!found) return prev;
      return {
        agent: m[2], plugin: found.plugin,
        ...(text.includes('[UNATTENDED]') ? { unattended: true } : {}),
        ...transcriptOf(evt),
      };
    });
    return;
  }

  const ti = evt.tool_input || {};
  const fp = String(ti.file_path || '').replace(/\\/g, '/');
  if (!fp.endsWith('.current-agent')) return;
  // Write carries `content`; Edit carries `new_string` (the file usually pre-exists from an
  // earlier session, so the model may legitimately Edit it — the hook matcher covers both).
  const agent = String(ti.content != null ? ti.content : (ti.new_string != null ? ti.new_string : '')).trim();
  if (!ROLE.test(agent)) return;
  record(evt, (prev, ctx) => {
    if (prev && prev.agent === agent) {
      const plugin = prev.plugin ? {} : pluginOf(ctx, agent);
      return { ...prev, ...plugin, ...(prev.transcript ? {} : transcriptOf(evt)) };
    }
    return { agent, ...pluginOf(ctx, agent), ...transcriptOf(evt) };
  });
}

function transcriptOf(evt) {
  return typeof evt.transcript_path === 'string' && evt.transcript_path ? { transcript: evt.transcript_path } : {};
}

function pluginOf(ctx, agent) {
  const found = ctx.findAgent(agent, { root: ctx.root });
  return found ? { plugin: found.plugin } : {};
}

// Loads the registry, prunes it, and stores what `next` returns for this session (unchanged when it
// returns the previous entry). Libraries load here, after the cheap exits above.
function record(evt, next) {
  const { readRegistry, prune, writeRegistry } = require('./lib/persona-record');
  const { findAgent } = require('./lib/plugin-root');
  const root = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
  const reg = readRegistry(root);
  const pruned = prune(reg);
  const prev = reg[evt.session_id];
  const entry = next(prev, { root, findAgent });
  if (entry === prev && !pruned) return;
  if (entry !== prev) reg[evt.session_id] = { ...entry, ts: Date.now() };
  writeRegistry(root, reg);
}
