/**
 * pipeline-gate.js unit tests
 *
 * Runs the gate as a child process (exactly as the hook runtime does) by piping
 * crafted PreToolUse JSON payloads via stdin and asserting permissionDecision.
 *
 * No package.json needed — run with: node --test plugins/nexus/hooks/scripts/__tests__/
 *
 * Cases:
 *  1. developer source-write under developer:analyze → DENY  (H2 collapse)
 *  2. developer source-write under developer:implement → allow
 *  3. developer source-write with .pipeline-state absent → allow (fail open)
 *  4. developer source-write under unrecognized token → DENY (conservative)
 *  5a. architect plan.md write under architect:analyze → DENY
 *  5b. architect plan.md write under architect:plan → allow
 *  6. pipeline-role write to .claude/.pipeline-state → DENY (invariant 3 regression)
 *  7. review.md APPROVED with open HIGH → DENY (invariant 2 regression)
 *  9. (H2b) developer write to plugins/nexus/agents/x.md under developer:analyze:
 *       marker root+name=nexus → DENY; no marker → allow; marker name≠nexus → allow.
 * 10. (H0) team-lead via .personas.json[session_id].agent==='team-lead' + no agent_type:
 *       Read plan.md/implementation.md → DENY; Read comm-log/questions.md → allow;
 *       bounded Grep review.md → allow; broad-context Grep plan.md → DENY;
 *       absent persona entry → allow (fail open).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GATE = join(__dirname, '..', 'pipeline-gate.js');

/**
 * Run the gate with a given payload and optional fixtures.
 *
 * @param payload        the PreToolUse JSON (without cwd — added here)
 * @param stateContent   string written to .claude/.pipeline-state, or undefined to leave it absent
 * @param opts.plugin    { name } — writes <root>/plugins/<dir>/.claude-plugin/plugin.json (H2b marker)
 * @param opts.pluginDir the plugin folder name under plugins/ (default 'nexus')
 * @param opts.personas  object written verbatim to .claude/.personas.json (H0 registry)
 * @returns { decision, reason } where decision is 'deny' | 'allow' ('allow' = gate emitted nothing).
 */
function runGate(payload, stateContent, opts = {}) {
  // Create a temp project dir with .claude/ so the gate can read the state file.
  const tmpProject = join(tmpdir(), `nexus-gate-test-${randomUUID()}`);
  const claudeDir = join(tmpProject, '.claude');
  mkdirSync(claudeDir, { recursive: true });

  const stateFile = join(claudeDir, '.pipeline-state');
  if (stateContent !== undefined) {
    writeFileSync(stateFile, stateContent);
  }

  // H2b marker: <root>/plugins/<dir>/.claude-plugin/plugin.json with the given name.
  if (opts.plugin) {
    const dir = opts.pluginDir || 'nexus';
    const markerDir = join(tmpProject, 'plugins', dir, '.claude-plugin');
    mkdirSync(markerDir, { recursive: true });
    writeFileSync(join(markerDir, 'plugin.json'), JSON.stringify(opts.plugin));
  }

  // H0 registry: .claude/.personas.json keyed by session_id.
  if (opts.personas) {
    writeFileSync(join(claudeDir, '.personas.json'), JSON.stringify(opts.personas));
  }

  // Inject cwd so the gate resolves project-root fixtures correctly.
  const input = JSON.stringify({ ...payload, cwd: tmpProject });

  const result = spawnSync(process.execPath, [GATE], {
    input,
    encoding: 'utf8',
    timeout: 5000,
  });

  // Cleanup (recursive — fixtures may have nested plugins/ dirs).
  try { rmSync(tmpProject, { recursive: true, force: true }); } catch { /* best-effort */ }

  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Gate exited non-zero: ${result.stderr}`);

  if (!result.stdout || result.stdout.trim() === '') {
    return { decision: 'allow', reason: '' };
  }

  let parsed;
  try { parsed = JSON.parse(result.stdout); } catch {
    throw new Error(`Gate stdout is not valid JSON: ${result.stdout}`);
  }
  const out = parsed.hookSpecificOutput || {};
  return {
    decision: out.permissionDecision || 'allow',
    reason: out.permissionDecisionReason || '',
  };
}

// ---------- Case 1: developer source-write under developer:analyze → DENY ----------
test('Case 1 — developer source-write under developer:analyze → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/src/Feature.cs', content: 'code' },
      agent_type: 'developer',
    },
    'developer:analyze'
  );
  assert.equal(result.decision, 'deny', `Expected deny, got allow. Reason: ${result.reason}`);
  assert.match(result.reason, /developer:implement/, 'Deny reason should name the required token');
});

// ---------- Case 2: developer source-write under developer:implement → allow ----------
test('Case 2 — developer source-write under developer:implement → allow', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/src/Feature.cs', content: 'code' },
      agent_type: 'developer',
    },
    'developer:implement'
  );
  assert.equal(result.decision, 'allow', `Expected allow, got deny. Reason: ${result.reason}`);
});

// ---------- Case 3: developer source-write with .pipeline-state absent → allow (fail open) ----------
test('Case 3 — developer source-write with .pipeline-state absent → allow (fail open)', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/src/Feature.cs', content: 'code' },
      agent_type: 'developer',
    }
    // no stateContent → file absent
  );
  assert.equal(result.decision, 'allow', `Expected allow (fail open), got deny. Reason: ${result.reason}`);
});

// ---------- Case 4: developer source-write under unrecognized token → DENY (conservative) ----------
test('Case 4 — developer source-write under unrecognized token → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/src/Feature.cs', content: 'code' },
      agent_type: 'developer',
    },
    'some-unknown-state'
  );
  assert.equal(result.decision, 'deny', `Expected deny (conservative), got allow. Reason: ${result.reason}`);
});

// ---------- Case 5a: architect plan.md write under architect:analyze → DENY ----------
test('Case 5a — architect plan.md write under architect:analyze → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/plan.md', content: 'plan' },
      agent_type: 'architect',
    },
    'architect:analyze'
  );
  assert.equal(result.decision, 'deny', `Expected deny, got allow. Reason: ${result.reason}`);
  assert.match(result.reason, /analyze-and-stop/, 'Deny reason should explain the analyze phase');
});

// ---------- Case 5b: architect plan.md write under architect:plan → allow ----------
test('Case 5b — architect plan.md write under architect:plan → allow', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/plan.md', content: 'plan' },
      agent_type: 'architect',
    },
    'architect:plan'
  );
  assert.equal(result.decision, 'allow', `Expected allow, got deny. Reason: ${result.reason}`);
});

// ---------- Case 6: pipeline-role write to .claude/.pipeline-state → DENY (invariant 3) ----------
test('Case 6 — pipeline-role write to .claude/.pipeline-state → DENY (invariant 3)', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/.claude/.pipeline-state', content: 'developer:implement' },
      agent_type: 'developer',
    },
    'developer:analyze'
  );
  assert.equal(result.decision, 'deny', `Expected deny (invariant 3), got allow. Reason: ${result.reason}`);
  assert.match(result.reason, /team lead/, 'Deny reason should reference the team lead');
});

// ---------- Case 7: review.md APPROVED with open HIGH → DENY (invariant 2) ----------
test('Case 7 — review.md APPROVED with open HIGH → DENY (invariant 2)', () => {
  const content = `## Step 2 — Code Review\n\n## Verdict: APPROVED\n\n### [HIGH] Missing validation\n**File:** src/Thing.cs:42\n**Issue:** Input not validated\n**Fix:** Add guard\n`;
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/review.md', content },
      agent_type: 'reviewer',
    }
    // state absent — invariant 2 fires regardless of phase state
  );
  assert.equal(result.decision, 'deny', `Expected deny (invariant 2), got allow. Reason: ${result.reason}`);
  assert.match(result.reason, /CRITICAL\/HIGH|CRITICAL or HIGH/, 'Deny reason should mention severity');
});

// ========================================================================================
// Case 9 (H2b) — dev-repo markdown source coverage, scoped to THIS repo by the marker.
// ========================================================================================

// 9a: root-anchored marker name=nexus → a developer plugins/*​/agents/*.md write in analyze DENIES.
test('Case 9a (H2b) — plugin source write under developer:analyze, marker name=nexus → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: 'plugins/nexus/agents/x.md', content: '# agent' },
      agent_type: 'developer',
    },
    'developer:analyze',
    { plugin: { name: 'nexus' }, pluginDir: 'nexus' }
  );
  assert.equal(result.decision, 'deny', `Expected deny (dev-repo source collapse), got allow. Reason: ${result.reason}`);
  assert.match(result.reason, /developer:implement/, 'Deny reason should name the required token');
});

// 9b: no marker (a consuming project) → the same .md write is allowed (docs, not source).
test('Case 9b (H2b) — same write with NO marker (consuming project) → allow', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: 'plugins/nexus/agents/x.md', content: '# agent' },
      agent_type: 'developer',
    },
    'developer:analyze'
    // no plugin marker → not the nexus dev repo → markdown is not guarded source here
  );
  assert.equal(result.decision, 'allow', `Expected allow (no marker → not dev repo), got deny. Reason: ${result.reason}`);
});

// 9c: marker present but name≠nexus (vendored/unrelated plugin, MINOR-3) → allowed.
test('Case 9c (H2b) — marker name≠nexus (vendored plugin) → allow', () => {
  const result = runGate(
    {
      tool_name: 'Write',
      tool_input: { file_path: 'plugins/some-vendor/agents/x.md', content: '# agent' },
      agent_type: 'developer',
    },
    'developer:analyze',
    { plugin: { name: 'some-vendor-plugin' }, pluginDir: 'some-vendor' }
  );
  assert.equal(result.decision, 'allow', `Expected allow (marker name≠nexus), got deny. Reason: ${result.reason}`);
});

// ========================================================================================
// Case 10 (H0) — team-lead read-lane, detected via session-keyed .personas.json.
// ========================================================================================

const TL_SID = 'tl-session-0001';
// A registry that marks this session_id as the team lead.
const TL_REG = { [TL_SID]: { agent: 'team-lead', ts: Date.now() } };

// 10a: team-lead Read of plan.md → DENY.
test('Case 10a (H0) — team-lead Read of plan.md → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/plan.md' },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'deny', `Expected deny (router lane), got allow. Reason: ${result.reason}`);
  assert.match(result.reason, /you route, you don't read/, 'Deny reason should be self-correcting');
});

// 10b: team-lead Read of implementation.md → DENY.
test('Case 10b (H0) — team-lead Read of implementation.md → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/implementation.md' },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'deny', `Expected deny (router lane), got allow. Reason: ${result.reason}`);
});

// 10c: team-lead Read of communication-log.md → allow.
test('Case 10c (H0) — team-lead Read of communication-log.md → allow', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/communication-log.md' },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'allow', `Expected allow (legitimate router read), got deny. Reason: ${result.reason}`);
});

// 10d: team-lead Read of questions.md → allow.
test('Case 10d (H0) — team-lead Read of questions.md → allow', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/questions.md' },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'allow', `Expected allow (legitimate router read), got deny. Reason: ${result.reason}`);
});

// 10e: team-lead bounded Grep of review.md (output_mode files_with_matches) → allow.
test('Case 10e (H0) — team-lead bounded Grep of review.md → allow', () => {
  const result = runGate(
    {
      tool_name: 'Grep',
      tool_input: {
        path: '/project/docs/specs/F1/delivery/review.md',
        pattern: 'APPROVED|REQUEST CHANGES',
        output_mode: 'files_with_matches',
      },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'allow', `Expected allow (bounded verdict grep), got deny. Reason: ${result.reason}`);
});

// 10f: team-lead broad-context Grep of plan.md (-C 200) → DENY (MINOR-1: a disguised full read).
test('Case 10f (H0) — team-lead broad-context Grep of plan.md (-C 200) → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Grep',
      tool_input: {
        path: '/project/docs/specs/F1/delivery/plan.md',
        pattern: 'Step',
        output_mode: 'content',
        '-C': 200,
      },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'deny', `Expected deny (broad grep = full read), got allow. Reason: ${result.reason}`);
});

// 10g: broad-context Grep of review.md (-C 200) → DENY (even an allowed file, if unbounded — MINOR-1).
test('Case 10g (H0) — team-lead broad-context Grep of review.md (-C 200) → DENY', () => {
  const result = runGate(
    {
      tool_name: 'Grep',
      tool_input: {
        path: '/project/docs/specs/F1/delivery/review.md',
        pattern: 'HIGH',
        output_mode: 'content',
        '-C': 200,
      },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'deny', `Expected deny (unbounded grep of an allowed file), got allow. Reason: ${result.reason}`);
});

// 10h: absent persona entry for this session → fail open (MAJOR-1) — Read of plan.md allowed.
test('Case 10h (H0) — absent persona entry → Read of plan.md allowed (fail open)', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/plan.md' },
      session_id: 'some-other-unregistered-session',
    },
    undefined,
    { personas: TL_REG } // registry exists but has no entry for this session_id
  );
  assert.equal(result.decision, 'allow', `Expected allow (fail open — not detected as team lead), got deny. Reason: ${result.reason}`);
});

// 10i: a SUBAGENT carrying agent_type cannot pose as the team lead — Read of plan.md allowed.
test('Case 10i (H0) — subagent (agent_type set) Read of plan.md → allow (cannot pose as team lead)', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/specs/F1/delivery/plan.md' },
      session_id: TL_SID,        // same session id…
      agent_type: 'developer',   // …but a subagent → not the main-session hub
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'allow', `Expected allow (subagent, not the hub), got deny. Reason: ${result.reason}`);
});

// 10j: team-lead Read of docs/backlog.md → allow (triage ledger, must read before editing status).
test('Case 10j (H0) — team-lead Read of docs/backlog.md → allow', () => {
  const result = runGate(
    {
      tool_name: 'Read',
      tool_input: { file_path: '/project/docs/backlog.md' },
      session_id: TL_SID,
    },
    undefined,
    { personas: TL_REG }
  );
  assert.equal(result.decision, 'allow', `Expected allow (backlog is the hub's triage ledger), got deny. Reason: ${result.reason}`);
});
