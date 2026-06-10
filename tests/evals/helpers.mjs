// T3/T4 eval harness — drives the REAL plugin through headless `claude -p` runs.
// Subscription-auth only by design (owner decision 2026-06-10): no API key, no promptfoo
// (its judge path bills an API account). Everything — agent-under-test AND judge — goes
// through the locally logged-in claude CLI, so it works for anyone with a subscription.
//
// These are MODEL-IN-THE-LOOP tests: minutes per scenario, plan-quota cost, and live-model
// nondeterminism. They are NOT part of the CI hard gate. Run on demand:
//   node --test tests/evals/*.eval.mjs
// Assert on structure, vocabulary, and trajectories — never exact text (research §5).
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const NEXUS_PLUGIN = join(REPO, 'plugins', 'nexus');
export const EVAL_FIXTURES = join(REPO, 'tests', 'evals', 'fixtures');

// The harness may itself be invoked from inside a Claude Code session (dev loop). The
// nested-session markers must not leak into the child or it may refuse subscription auth;
// capture the exec path first — it's the most reliable way to find the CLI.
function claudeCommand() {
  return process.env.CLAUDE_CODE_EXECPATH || 'claude';
}
function cleanEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) {
    if (k === 'CLAUDECODE' || k === 'CLAUDE_PLUGIN_DATA' || k === 'AI_AGENT' || k.startsWith('CLAUDE_CODE_')) {
      delete env[k];
    }
  }
  return env;
}

/**
 * Run one headless claude session and return its parsed stream-json events.
 *
 * Deliberately NOT --bare: bare mode reads auth "strictly [from] ANTHROPIC_API_KEY or
 * apiKeyHelper — OAuth and keychain are never read" (claude --help), which would break the
 * subscription-only constraint. The cost is that the user's installed plugins load alongside
 * the dev tree — which is the real consumer environment anyway; the dev --plugin-dir copy of
 * nexus takes precedence over an installed one (verified live, see tests/evals/README note).
 */
export function runClaude(prompt, { cwd, agent, model = 'sonnet', timeoutMs = 480_000, pluginDir = NEXUS_PLUGIN } = {}) {
  const args = [
    '-p', '--verbose',
    '--output-format', 'stream-json',
    '--model', model,
    '--permission-mode', 'bypassPermissions', // sandbox fixture dir; we observe behavior, not denials
  ];
  if (pluginDir) args.push('--plugin-dir', pluginDir);
  if (agent) args.push('--agent', agent);

  const res = spawnSync(claudeCommand(), args, {
    cwd,
    input: prompt, // prompt via stdin — immune to shell quoting on Windows
    encoding: 'utf8',
    env: cleanEnv(),
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32' && !process.env.CLAUDE_CODE_EXECPATH,
  });

  const events = (res.stdout || '')
    .split('\n')
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
  return { events, stdout: res.stdout, stderr: res.stderr, status: res.status };
}

// ── trajectory helpers ────────────────────────────────────────────────────────────────────
export function initEvent(events) {
  return events.find((e) => e.type === 'system' && e.subtype === 'init') || null;
}
export function toolUses(events) {
  return events
    .filter((e) => e.type === 'assistant')
    .flatMap((e) => (e.message && Array.isArray(e.message.content) ? e.message.content : []))
    .filter((b) => b && b.type === 'tool_use');
}
export function editToolUses(events) {
  return toolUses(events).filter((t) => /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(t.name));
}
export function resultOf(events) {
  const r = events.find((e) => e.type === 'result');
  if (r && typeof r.result === 'string') return r;
  return r || null;
}
export function finalText(events) {
  const r = resultOf(events);
  if (r && typeof r.result === 'string') return r.result;
  // fall back to the last assistant text block
  const texts = events
    .filter((e) => e.type === 'assistant')
    .flatMap((e) => (e.message && Array.isArray(e.message.content) ? e.message.content : []))
    .filter((b) => b && b.type === 'text' && b.text)
    .map((b) => b.text);
  return texts[texts.length - 1] || '';
}
export function assertSessionRan(run) {
  const r = resultOf(run.events);
  if (!r || r.is_error) {
    throw new Error(
      `claude run failed (status ${run.status}): ${r ? r.result : 'no result event'}\nstderr: ${(run.stderr || '').slice(0, 500)}`
    );
  }
}

// Guard against silently evaluating the marketplace-installed nexus instead of the dev tree:
// the init event must show the plugin loaded from THIS repo (source "nexus@inline").
export function assertDevPluginLoaded(run) {
  const init = initEvent(run.events);
  if (!init) throw new Error('no init event — session never started');
  const nexus = (init.plugins || []).filter((p) => p.name === 'nexus');
  if (nexus.length !== 1 || !String(nexus[0].path).replace(/\\/g, '/').startsWith(REPO.replace(/\\/g, '/'))) {
    throw new Error(`dev nexus plugin not (solely) loaded: ${JSON.stringify(init.plugins)}`);
  }
  // Only errors about the plugin under test count. Replacing the installed nexus with the
  // dev tree makes an installed nexus-dotnet report dependency-unsatisfied for
  // "nexus@claude-nexus" — an expected artifact of the replacement, not a load failure.
  const ownErrors = (init.plugin_errors || []).filter((e) => /^nexus(@|$)/.test(String(e.plugin || '')));
  if (ownErrors.length) {
    throw new Error(`plugin_errors for nexus: ${JSON.stringify(ownErrors)}`);
  }
}

// ── fixtures ──────────────────────────────────────────────────────────────────────────────
const sandboxes = [];
export function projectFrom(fixtureName) {
  const dir = mkdtempSync(join(tmpdir(), 'nexus-eval-'));
  cpSync(join(EVAL_FIXTURES, fixtureName), dir, { recursive: true });
  sandboxes.push(dir);
  return dir;
}
export function cleanupSandboxes() {
  for (const dir of sandboxes.splice(0)) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

// ── T4 judge: a second claude run (haiku) grading content against a rubric ────────────────
// Pointwise, structural rubric, JSON answer with an escape hatch — per the eval research.
export function judge(rubric, content, { cwd } = {}) {
  const prompt =
    `You are a strict structural grader. Rubric:\n${rubric}\n\n` +
    `Content to grade:\n<<<\n${content}\n>>>\n\n` +
    `Reply with ONLY a JSON object: {"pass": true|false, "reason": "<one sentence>"} — ` +
    `if the content is genuinely ambiguous against the rubric, use {"pass": false, "reason": "ambiguous: ..."}.`;
  const run = runClaude(prompt, { cwd: cwd || tmpdir(), model: 'haiku', pluginDir: null, timeoutMs: 120_000 });
  const text = finalText(run.events);
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`judge returned no JSON: ${text.slice(0, 300)}`);
  return JSON.parse(m[0]);
}
