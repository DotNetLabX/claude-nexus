// RED SUITE — TDD reds for the enforcement + relay fix package
// (docs/proposals/plugin-evaluation-2026-06.md, roadmap items B.1 and C.2–C.4).
//
// Every test here is EXPECTED TO FAIL until the fix package lands. They are written first
// (owner-decided TDD sequencing) so each fix has a deterministic definition of done. CI runs
// this suite non-blocking, for visibility only. When the fix package ships:
//   1. these tests turn green,
//   2. MOVE this file's tests into tests/lint / tests/unit (they become the regression suite),
//   3. delete tests/red/ and drop the non-blocking CI step.
//
// The tests ARE the contract — the .md files are the compiled artifact (TDAD, research §4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, frontmatter, run, FIXTURES } from '../helpers.mjs';

// ── B.1 — critic is tool-locked, not just instructed ────────────────────────────────────────
// disallowedTools in agent frontmatter is enforced by the PLATFORM regardless of spawn mode
// (proven live: OMC document-specialist agents physically lack Write). The critic is
// message-only by contract; make the contract physical.
test('B.1: critic frontmatter declares disallowedTools covering all edit tools', () => {
  const { data } = frontmatter(join(pluginRoot('nexus'), 'agents', 'critic.md'));
  assert.ok(data.disallowedTools, 'critic.md must declare disallowedTools in frontmatter');
  for (const tool of ['Write', 'Edit', 'MultiEdit', 'NotebookEdit']) {
    assert.ok(data.disallowedTools.includes(tool), `critic disallowedTools must include ${tool}`);
  }
});

// ── C.2 — generic salvage script: salvage(agentId|file) -> text ─────────────────────────────
// The platform writes every subagent's full run to {session-dir}/subagents/agent-{id}.jsonl —
// verbatim by construction, cannot strand. Reading it is a SCRIPT's job, never a model's
// (token-consumption goal). Contract: extract the final SUBSTANTIVE assistant text, skipping
// lifecycle stubs ("Ready when you are.", "Standing by.", "."), which is exactly the measured
// stranding shape (4/6 audit, 3/3 research agents on 2026-06-10).
const SALVAGE = join(pluginRoot('nexus'), 'hooks', 'scripts', 'salvage-transcript.js');

test('C.2: salvage-transcript script ships with the plugin', () => {
  assert.ok(existsSync(SALVAGE),
    'plugins/nexus/hooks/scripts/salvage-transcript.js does not exist yet (C.2 unimplemented)');
});

test('C.2: salvage recovers a report stranded behind a lifecycle reply', () => {
  const res = run(process.execPath, [SALVAGE, '--file', join(FIXTURES, 'transcripts', 'stranded.jsonl')]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /FINDINGS:/, 'the substantive report must be recovered');
  assert.match(res.stdout, /two-tier offline harness/, 'recovered text is verbatim, not summarized');
  assert.ok(!res.stdout.includes('Ready when you are.'), 'lifecycle stubs are not the deliverable');
});

test('C.2: salvage returns the final text when the agent ended cleanly', () => {
  const res = run(process.execPath, [SALVAGE, '--file', join(FIXTURES, 'transcripts', 'clean.jsonl')]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /VERDICT: REVISE/, 'clean transcripts return the final substantive message');
});

// ── C.3 — completion footer in artifact formats ──────────────────────────────────────────────
// A stranded message must cost nothing for artifact-producing agents: the artifact
// self-certifies via a final `*Status: COMPLETE — {role}, {date}*` line; the team lead
// trusts the footer, not the message.
test('C.3: implementation-format and review-format specify the completion footer', () => {
  for (const skill of ['implementation-format', 'review-format']) {
    const text = readFileSync(join(pluginRoot('nexus'), 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(text, /Status:\s*COMPLETE/,
      `${skill} must define the completion footer (C.3 unimplemented)`);
  }
});

// ── C.4 — recovery order codified in team-lead.md ────────────────────────────────────────────
// Measured: re-asking a stranded agent ran 0/2 on 2026-06-10. The designed order is
// artifact -> TaskOutput -> salvage script -> re-ask LAST; today team-lead.md jumps from
// TaskOutput straight to re-spawn and never names the salvage leg.
test('C.4: team-lead.md names the salvage script as a designed recovery leg', () => {
  const teamLead = readFileSync(join(pluginRoot('nexus'), 'agents', 'team-lead.md'), 'utf8');
  assert.match(teamLead, /salvage/i,
    'team-lead.md must document transcript salvage as a recovery step (C.4 unimplemented)');
  // Order: the salvage leg must be tried BEFORE any re-ask/re-spawn.
  const salvageAt = teamLead.search(/salvage/i);
  const reAskAt = teamLead.search(/re-spawn|re-ask/i);
  assert.ok(reAskAt === -1 || salvageAt < reAskAt,
    'recovery order must place salvage before re-ask (re-ask is the measured-worst option, 0/2)');
});
