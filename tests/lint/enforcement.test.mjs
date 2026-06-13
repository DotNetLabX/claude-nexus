// T1 — enforcement + relay package contracts (evaluation roadmap B.1, B.2, C.3, C.4).
// Born as TDD reds (tests/red/), promoted here when the package shipped. These pin the
// text-level halves of the package; the behavior halves live in tests/unit/salvage.test.mjs
// and tests/unit/boundary-detector.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, frontmatter } from '../helpers.mjs';

const read = (...p) => readFileSync(join(pluginRoot('nexus'), ...p), 'utf8');

// ── B.1 — critic is tool-locked, not just instructed ────────────────────────────────────────
// disallowedTools in agent frontmatter is enforced by the PLATFORM regardless of spawn mode —
// the one lever ADR-13 left standing. The critic is message-only by contract; this makes the
// contract physical.
test('B.1: critic frontmatter declares disallowedTools covering all edit tools', () => {
  const { data } = frontmatter(join(pluginRoot('nexus'), 'agents', 'critic.md'));
  assert.ok(data.disallowedTools, 'critic.md must declare disallowedTools in frontmatter');
  for (const tool of ['Write', 'Edit', 'MultiEdit', 'NotebookEdit']) {
    assert.ok(data.disallowedTools.includes(tool), `critic disallowedTools must include ${tool}`);
  }
});

// ── B.2 — boundary detection (gate-as-detector) ──────────────────────────────────────────────
// Probe P1 (2026-06-10): PostToolUse hooks DO fire inside background subagents (and carry the
// parent session_id). Prevention stays impossible (deny dropped, ADR-13); detection is
// deterministic: the detector appends violations to .claude/audit/violations.log and the
// team lead checks it at every checkpoint.
test('B.2: hooks.json registers the boundary detector on PostToolUse edits', () => {
  const cfg = JSON.parse(read('hooks', 'hooks.json'));
  const post = JSON.stringify(cfg.hooks.PostToolUse || []);
  assert.ok(post.includes('boundary-detector.js'), 'PostToolUse must run the boundary detector');
});

test('B.2: team-lead.md instructs checking violations.log at checkpoints', () => {
  assert.match(read('agents', 'team-lead.md'), /violations\.log/,
    'team-lead.md must name the violations log as a checkpoint input');
});

// ── C.3 — completion footer in artifact formats ──────────────────────────────────────────────
// A stranded message must cost nothing for artifact-producing agents: the artifact
// self-certifies via a final `*Status: COMPLETE — {role}, {date}*` line; the team lead
// trusts the footer, not the message.
test('C.3: implementation-format and review-format specify the completion footer', () => {
  for (const skill of ['implementation-format', 'review-format']) {
    assert.match(read('skills', skill, 'SKILL.md'), /Status:\s*COMPLETE/,
      `${skill} must define the completion footer`);
  }
});

// ── C.4 — recovery order codified in team-lead.md ────────────────────────────────────────────
// Measured: re-asking a stranded agent ran 0/2 on 2026-06-10. The designed order is
// artifact -> TaskOutput -> salvage script -> re-ask LAST.
test('C.4: team-lead.md names the salvage script as a designed recovery leg, before any re-ask', () => {
  const teamLead = read('agents', 'team-lead.md');
  assert.match(teamLead, /salvage-transcript/, 'team-lead.md must name the salvage script');
  const salvageAt = teamLead.search(/salvage/i);
  const reAskAt = teamLead.search(/re-spawn|re-ask/i);
  assert.ok(salvageAt >= 0 && (reAskAt === -1 || salvageAt < reAskAt),
    'recovery order must place salvage before re-ask (re-ask is the measured-worst option)');
});

test('C.4: the always-on context tells the model where the plugin (and salvage script) lives', () => {
  // ${CLAUDE_PLUGIN_ROOT} does not expand in markdown, so the model cannot construct the
  // script path from the agent file alone — inject-rules.js carries the resolved path.
  const inject = read('hooks', 'scripts', 'inject-rules.js');
  assert.match(inject, /salvage-transcript/, 'inject-rules must surface the salvage script location');
});

// ── ADR-23 — the meta-loop's own gate is physically wired (AP1 applied to itself) ────────────
// improve-skills' done-condition is the lint script; the skill must name it, the script must
// ship, and the rubric consumer (evaluate-skill) must run lint as its Layer 0.
test('ADR-23: improve-skills names skill-lint as its done-condition and ships the script', () => {
  const skill = read('skills', 'improve-skills', 'SKILL.md');
  assert.match(skill, /skill-lint\.mjs/, 'improve-skills must name the lint script');
  assert.match(skill, /done-condition/i, 'improve-skills must bind the lint to completion, not advice');
  read('skills', 'improve-skills', 'scripts', 'skill-lint.mjs'); // throws if the script does not ship
});

test('ADR-23: evaluate-skill runs the lint as Layer 0 and ships the rubric', () => {
  const skill = read('skills', 'evaluate-skill', 'SKILL.md');
  assert.match(skill, /skill-lint\.mjs/, 'evaluate-skill must run the shipped lint first');
  read('skills', 'evaluate-skill', 'references', 'rubric.md'); // throws if the rubric does not ship
});

// ── ADR-24 (proposed) — Gate A: `## Skills Used` is a NAMED required section ──────────────────
// Step 3's done-check makes ABSENCE of `## Skills Used` a structural hard-Fail; for that to be
// mechanically enforceable the format skill must NAME the section as required, not merely template
// it + carry an anti-pattern. This pins the promotion (Step 4): an explicit "required sections"
// statement that names `## Skills Used`. The template (:22-28) + anti-pattern (:56) stay; this adds
// the named-requirement line the done-check can rely on.
test('Gate A: implementation-format names `## Skills Used` as a required section', () => {
  const fmt = read('skills', 'implementation-format', 'SKILL.md');
  // An explicit required-sections statement naming the section — close enough to the prose to bind,
  // strict enough that the pre-Step-4 template-only state fails.
  const requiredStmt =
    /required sections?\b[\s\S]{0,400}?##\s*Skills Used|##\s*Skills Used[\s\S]{0,400}?\brequired section/i;
  assert.match(fmt, requiredStmt,
    'implementation-format must state that `## Skills Used` is a required section (not just template it) — ' +
    'so Step 3 can hard-Fail on its absence');
});
