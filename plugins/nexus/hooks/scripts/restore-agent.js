#!/usr/bin/env node
/**
 * Nexus SessionStart hook: session-aware persona restore.
 *
 * Personas are tracked per session in the HOST project's .claude/.personas.json (shape and prune:
 * lib/persona-record.js), written by register-persona.js when a persona command sets the role.
 *
 * Restore policy (decided deliberately — see the persona design notes):
 *   compact -> restore: emit a cap-safe pointer to the role (the summary dropped it)
 *   clear   -> forget THIS session's persona (clear is the exit)
 *   startup -> nothing (a fresh session_id has no entry — clean slate for free)
 *   resume  -> nothing (the transcript, persona included, is reloaded verbatim)
 * Entries whose session has ended are pruned on every run (lib/persona-record.js).
 *
 * The role file is found wherever its plugin is installed (lib/plugin-root.js): a record naming its
 * plugin is looked up in that plugin; one without (set by the "be {agent}" phrase) in the core's own
 * agents first, then each installed plugin's. A plugin-less role no plugin ships is never injected.
 *
 * The restore payload is a POINTER, never the role's text (ADR-85): every shipped agent file is
 * larger than the platform's per-hook output cap, so an inlined body is persisted to a file and
 * never reaches the model. We emit identity + the agent's one-line frontmatter description + the
 * resolved absolute agent-file path + an instruction to read it. In a plugin that file is NOT at
 * .claude/agents/ and ${CLAUDE_PLUGIN_ROOT} does not expand in command/agent markdown, so the
 * path is resolved here and handed to the model already absolute.
 *
 * The pointer also RE-GROUNDS the resumed session (ADR-89, which amends ADR-85): re-adopting the
 * role file is not the same as re-grounding in the work, so the payload also tells the agent to
 * re-run whatever "Context to load first" duties its role file names, and to treat everything the
 * compaction summary carried over as a claim to re-verify against the repo's artifacts and
 * standing protocol rules — never as a fact. The claims half is role-independent, so it rides the
 * fallback payload too: a session whose role file never loaded is exactly where second-hand
 * context is most dangerous.
 *
 * Nobody answers an unattended session — one whose record carries the `[UNATTENDED]` mark, or that
 * the owner has marked owner-away since (lib/read-owner-away.js) — so where its role cannot be read
 * it is told to stop with a continuation note, never to ask the user to re-run the command.
 */
'use strict';
const fs = require('fs');
const { readRegistry, prune, writeRegistry } = require('./lib/persona-record');
const { findAgent } = require('./lib/plugin-root');
const { readOwnerAway } = require('./lib/read-owner-away');

// Two numbers, one concept — same shape as inject-rules.js. The platform caps a hook's output,
// additionalContext included, at PLATFORM_CAP chars. The DETERMINISTIC per-role gate lives in
// tests/unit/persona.test.mjs (it parses these constants rather than re-typing them), and this
// runtime tripwire sits between that gate and the cap, warning only — fail open.
const PLATFORM_CAP = 10000;
const WARN_AT = PLATFORM_CAP - 500;

// The registry is a plain file in the project; its names become a path, so they are checked first.
const ROLE = /^[a-z][a-z-]{1,30}$/;
const PLUGIN = /^[a-z0-9][a-z0-9._-]*$/;

// Identity only — the one-line frontmatter `description:`, never the body (see the cap note above).
function readAgentMeta(file) {
  let md;
  try { md = fs.readFileSync(file, 'utf8'); } catch { return { found: false, description: null }; }
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const desc = fm && fm[1].match(/^description:[ \t]*(.+)$/m);
  return { found: true, description: desc ? desc[1].trim() : null };
}

const CLAIMS = `Everything carried over from the compaction summary is a CLAIM, not a fact — re-verify any ` +
  `status, protocol, or boundary fact against the repo's artifacts and standing protocol rules`;

const stopText = (agent, command) =>
  `do not continue without the role: write a continuation note (what was in progress, what is left), then end ` +
  `the turn with \`Stopped — needs you: the ${agent} role file could not be read; re-run ${command}.\``;

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let sid = '', source = '', evtCwd = '';
  try { const e = JSON.parse(raw || '{}'); sid = e.session_id || ''; source = e.source || ''; evtCwd = e.cwd || ''; } catch { /* ignore */ }

  // Same root chain as register-persona.js — the hook process's own cwd may differ from the event's.
  const root = process.env.CLAUDE_PROJECT_DIR || evtCwd || process.cwd();
  const reg = readRegistry(root);
  let changed = prune(reg);

  // /clear is the exit: drop this session's persona so a later compact won't resurrect it.
  if (source === 'clear' && sid && reg[sid]) { delete reg[sid]; changed = true; }
  if (changed) writeRegistry(root, reg);

  // Restore ONLY on compact.
  if (source !== 'compact' || !sid) process.exit(0);
  const entry = reg[sid] || {};
  const agent = entry.agent;
  const recorded = typeof entry.plugin === 'string' && PLUGIN.test(entry.plugin) ? entry.plugin : null;
  if (typeof agent !== 'string' || !ROLE.test(agent)) process.exit(0);
  const found = findAgent(agent, { plugin: recorded, root });
  if (!found && !recorded) process.exit(0);

  const plugin = found ? found.plugin : recorded;
  const command = `/${plugin}:${agent}`;
  const meta = found ? readAgentMeta(found.file) : { found: false, description: null };
  const unattended = entry.unattended === true || readOwnerAway(sid, root);
  const context = meta.found
    ? `Active persona: ${agent}. You are operating as the ${agent} agent for this session.` +
      (meta.description ? `\n${meta.description}` : '') +
      `\n\nThe full role definition is not inlined here — it exceeds the per-hook injection cap, ` +
      `so injecting it would silently drop it instead of delivering it (ADR-85).\n\n` +
      `FIRST ACTION, before resuming anything: Read ${found.file} in full and re-adopt it exactly — ` +
      `this IS your role — then re-run any "Context to load first" duties it names before ` +
      `continuing the task that was in progress.\n` +
      `${CLAIMS} (backlog, summaries, ADRs, CLAUDE.md, the plugin's rules) before acting on it.\n` +
      `If that Read is unavailable or denied (in a plugin install the file lives in the plugin ` +
      `cache, outside the project workspace), ` +
      (unattended
        ? `say so explicitly and ${stopText(agent, command)} — never continue silently without the role.`
        : `say so explicitly and ask the user to re-run ${command} — never continue silently without the role.`)
    : `Active persona: ${agent}. You are operating as the ${agent} agent, but its role definition ` +
      `could not be loaded from the plugin. ` +
      (unattended ? `Nobody is here to answer, so ${stopText(agent, command)}\n` : `Ask the user to re-run the ${command} command.\n`) +
      `${CLAIMS} before acting on it.`;

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
