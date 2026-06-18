// T2 — boundary-detector.js (evaluation roadmap B.2, unlocked by Probe P1 2026-06-10:
// PostToolUse fires inside background subagents). Prevention is impossible there (the
// platform drops PreToolUse deny, ADR-13); this detector makes violations DETERMINISTICALLY
// VISIBLE instead: every boundary breach lands in .claude/audit/violations.log, which the
// team lead checks at every checkpoint. Observe-only — it must never block anything.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const DETECTOR = join(pluginRoot('nexus'), 'hooks', 'scripts', 'boundary-detector.js');
after(cleanupSandboxes);

const LOG = (dir) => join(dir, '.claude', 'audit', 'violations.log');
const lines = (dir) => readFileSync(LOG(dir), 'utf8').trim().split('\n').map(JSON.parse);

function detect(dir, agentType, file, tool = 'Write') {
  return runHook(DETECTOR, {
    session_id: 'sess-bd', tool_name: tool, agent_type: agentType,
    tool_input: { file_path: file, content: 'x' }, cwd: dir,
  }, { projectDir: dir });
}

test('a non-code role writing application source is logged', () => {
  const dir = makeSandbox();
  const res = detect(dir, 'critic', 'src/Orders/OrderQuery.cs');
  assert.equal(res.status, 0, 'detector never fails the call');
  const [v] = lines(dir);
  assert.equal(v.agent, 'critic');
  assert.match(v.rule, /non-code role/i);
  assert.ok(res.json?.systemMessage, 'a violation surfaces a systemMessage for visibility');
});

// RecipeEstateAudit (2026-06-18): the source predicate is now the shared lib/is-code-file.js. This
// detector already had .sh/.ps1; the assertions below pin the shared predicate's behavior in this caller
// (union extension set + backslash normalization) so a future drift in the lib is caught here too.
test('a non-code role writing a shell script (.sh) is logged (union extension set)', () => {
  const dir = makeSandbox();
  detect(dir, 'critic', 'scripts/deploy.sh');
  const [v] = lines(dir);
  assert.match(v.rule, /non-code role/i, '.sh is application source for the shared predicate');
});

test('a non-code role writing a Windows backslash source path is logged; backslash doc areas are not', () => {
  const dir = makeSandbox();
  detect(dir, 'critic', 'src\\Orders\\OrderQuery.cs');   // normalized → caught
  detect(dir, 'critic', 'docs\\notes.cs');               // backslash docs/ → still a doc area
  detect(dir, 'critic', '.claude\\scratch.js');          // backslash .claude/ → still a system area
  const all = existsSync(LOG(dir)) ? lines(dir) : [];
  assert.equal(all.length, 1, 'only the real source path logs; backslash doc/system paths do not');
  assert.match(all[0].rule, /non-code role/i);
});

test('artifact ownership: a role writing another role\'s artifact is logged', () => {
  const dir = makeSandbox();
  detect(dir, 'developer', 'docs/specs/F1/delivery/plan.md');          // architect's file
  detect(dir, 'developer', 'docs/specs/F1/delivery/review.md');        // architect+reviewer's file
  detect(dir, 'nexus:architect', 'docs/specs/F1/delivery/summary.md'); // team lead's file
  const all = lines(dir);
  assert.equal(all.length, 3);
  assert.ok(all.every((v) => /owner/i.test(v.rule)));
});

test('any subagent writing .pipeline-state is logged (team lead is main-session only)', () => {
  const dir = makeSandbox();
  detect(dir, 'developer', '.claude/.pipeline-state');
  const [v] = lines(dir);
  assert.match(v.rule, /pipeline-state/i);
});

test('legitimate writes are NOT logged — zero footprint when clean', () => {
  const dir = makeSandbox();
  detect(dir, 'developer', 'src/Orders/OrderQuery.cs');                    // code role writes code
  detect(dir, 'developer', 'docs/specs/F1/delivery/implementation.md');    // own artifact
  detect(dir, 'solo', 'docs/specs/adhoc-X/delivery/implementation.md');    // solo's own deliverable (nexus-1.13.0 item 2)
  detect(dir, 'solo', 'src/Orders/OrderQuery.cs');                         // solo is a code role
  detect(dir, 'nexus:architect', 'docs/specs/F1/delivery/plan.md');        // own artifact (namespaced)
  detect(dir, 'reviewer', 'docs/specs/F1/delivery/review.md');             // own artifact
  detect(dir, 'developer', 'docs/specs/F1/delivery/lessons.md');           // shared by design
  detect(dir, 'critic', 'docs/notes.md');                                  // docs are not source
  assert.ok(!existsSync(LOG(dir)), 'a clean run leaves no audit dir at all');
});

test('solo writing another role\'s artifact is STILL logged (the owner map widened, not removed)', () => {
  const dir = makeSandbox();
  detect(dir, 'solo', 'docs/specs/adhoc-X/delivery/plan.md');    // architect's file — solo doesn't own it
  detect(dir, 'solo', 'docs/specs/adhoc-X/delivery/summary.md'); // team lead's file
  const all = lines(dir);
  assert.equal(all.length, 2);
  assert.ok(all.every((v) => /owner/i.test(v.rule)));
});

test('main-session calls (no agent_type) are ignored — the foreground gate already covers them', () => {
  const dir = makeSandbox();
  const res = runHook(DETECTOR, {
    session_id: 's', tool_name: 'Write',
    tool_input: { file_path: 'docs/specs/F1/delivery/plan.md', content: 'x' }, cwd: dir,
  }, { projectDir: dir });
  assert.equal(res.status, 0);
  assert.ok(!existsSync(LOG(dir)));
});

test('fail silent: malformed stdin and non-edit tools never log or fail', () => {
  const dir = makeSandbox();
  assert.equal(runHook(DETECTOR, '{{{', { projectDir: dir }).status, 0);
  assert.equal(detect(dir, 'critic', '', 'Bash').status, 0);
  assert.ok(!existsSync(LOG(dir)));
});

// --- ADR-21: delegated self-advancement (a subagent spawning pipeline-role agents) ---

function spawn(dir, agentType, subagentType, tool = 'Agent') {
  const event = {
    session_id: 'sess-bd', tool_name: tool,
    tool_input: { subagent_type: subagentType, prompt: 'Step 1 done check for F16.' }, cwd: dir,
  };
  if (agentType) event.agent_type = agentType;
  return runHook(DETECTOR, event, { projectDir: dir });
}

test('a subagent spawning a pipeline-role agent is logged (delegated self-advancement)', () => {
  const dir = makeSandbox();
  const res = spawn(dir, 'developer', 'nexus:reviewer');
  assert.equal(res.status, 0, 'detector never fails the call');
  const [v] = lines(dir);
  assert.equal(v.agent, 'developer');
  assert.match(v.rule, /pipeline-role|ADR-21/i);
  assert.ok(res.json?.systemMessage, 'a spawn violation surfaces a systemMessage');
});

test('Task-tool spawns and own-role respawns are detected too', () => {
  const dir = makeSandbox();
  spawn(dir, 'nexus:developer', 'architect', 'Task');
  spawn(dir, 'developer', 'nexus:developer'); // nested developer = same breach
  const all = lines(dir);
  assert.equal(all.length, 2);
  assert.ok(all.every((v) => /pipeline-role|ADR-21/i.test(v.rule)));
});

test('research spawns (Explore / general-purpose) by a subagent are NOT logged', () => {
  const dir = makeSandbox();
  spawn(dir, 'architect', 'Explore');
  spawn(dir, 'learner', 'general-purpose');
  assert.ok(!existsSync(LOG(dir)), 'research helpers are sanctioned');
});

test('main-session spawns (no agent_type) are NOT logged — the team lead spawns freely', () => {
  const dir = makeSandbox();
  spawn(dir, null, 'nexus:architect');
  spawn(dir, null, 'developer', 'Task');
  assert.ok(!existsSync(LOG(dir)));
});

// --- ADR-18/20: a subagent state-changing git write (pipeline agents never commit) ---
// Best-effort early-warning layer (the team-lead `git log` author check is the guaranteed
// retroactive catch). Anchored-regex substring matching mirrors guard.js house style; the
// trailing (\s|$) excludes `git commit-graph`. Subagent (agent_type present) Bash only;
// read-only git and no-verb Bash stay a zero-footprint no-op (HIGH-3, preserves :76 above).

function bash(dir, agentType, command) {
  const event = { session_id: 'sess-bd', tool_name: 'Bash', tool_input: { command }, cwd: dir };
  if (agentType) event.agent_type = agentType;
  return runHook(DETECTOR, event, { projectDir: dir });
}

test('a subagent git commit is logged as a rogue write', () => {
  const dir = makeSandbox();
  const res = bash(dir, 'developer', 'git commit -m x');
  assert.equal(res.status, 0, 'detector never fails the call');
  const [v] = lines(dir);
  assert.equal(v.agent, 'developer');
  assert.equal(v.tool, 'Bash');
  assert.match(v.rule, /git write|never commit|ADR-18|ADR-20/i);
  assert.ok(res.json?.systemMessage, 'a rogue git write surfaces a systemMessage');
});

test('every canonical state-changing git verb is flagged (incl. && chains)', () => {
  const dir = makeSandbox();
  const writes = [
    'git status && git commit -m x',   // chained — prefix would miss this
    'git add -A',
    'git add .',
    'git stash',
    'git stash push',
    'git push origin main',
    'git restore --staged f',
    'git switch -c b',
    'git reset --soft HEAD~1',
  ];
  for (const cmd of writes) bash(dir, 'developer', cmd);
  const all = lines(dir);
  assert.equal(all.length, writes.length, 'each state-changing verb logs exactly one line');
  assert.ok(all.every((v) => /git write|never commit|ADR-18|ADR-20/i.test(v.rule)));
});

test('read-only git, git commit-graph, and an empty Bash command append NOTHING (DO-NOT-FLAG)', () => {
  const dir = makeSandbox();
  for (const cmd of [
    'git status',
    'git diff',
    'git log --oneline',
    'git rev-parse HEAD',
    'git branch',
    'git remote -v',
    'git fetch',
    'git show HEAD:src/Feature/Handler.cs', // read file content at HEAD (sanctioned no-write path)
    'git stash list',                  // read-only stash subcommand (nexus-1.13.0 item 5)
    'git stash show',                  // read-only stash subcommand
    'git --no-pager stash list',       // read-only stash behind an interposed global flag
    'git --git-dir=/r stash show',     // read-only stash behind an =-valued global flag
    'git commit-graph write',          // maintenance — excluded by the trailing (\s|$)
    '',                                 // no verb at all — the :76 zero-footprint no-op
    'npm test',                         // not git
  ]) {
    bash(dir, 'developer', cmd);
  }
  assert.ok(!existsSync(LOG(dir)), 'no read-only/maintenance/empty/non-git command logs — zero footprint');
});

test('read-only stash exemption does NOT open a bypass: a chained write still flags', () => {
  const dir = makeSandbox();
  bash(dir, 'developer', 'git stash list && git commit -m x'); // the commit must still be caught
  const [v] = lines(dir);
  assert.match(v.rule, /git write|never commit|ADR-18|ADR-20/i,
    'stripping `git stash list` must not exempt the chained `git commit`');
});

test('a git write by the MAIN session (no agent_type) is NOT logged — only subagents are in scope', () => {
  const dir = makeSandbox();
  bash(dir, null, 'git commit -m x'); // main session = team lead's own commit, sanctioned
  assert.ok(!existsSync(LOG(dir)), 'main-session git writes are the team lead, never flagged');
});
