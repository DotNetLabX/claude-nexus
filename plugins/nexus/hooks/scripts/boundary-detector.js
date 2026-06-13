#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit|MultiEdit) boundary detector. Async, observe-only — never blocks
 * (PostToolUse cannot block, and this must never wedge a run).
 *
 * Why this exists (evaluation roadmap B.2, unlocked by Probe P1 on 2026-06-10): the platform
 * drops a PreToolUse deny for background subagents (ADR-13), so the pipeline gate cannot
 * PREVENT a backgrounded agent's boundary violation — but PostToolUse hooks DO fire there.
 * Prevention stays with the agents' hard rules (ADR-14/18); this makes every breach
 * DETERMINISTICALLY VISIBLE: a violation appends one JSON line to .claude/audit/violations.log
 * (+ a systemMessage), and the team lead checks the log at every checkpoint instead of hoping
 * an agent self-reports.
 *
 * Scope: SUBAGENT calls only (agent_type present). Main-session/foreground writes are already
 * covered by the gate + guard, whose denies ARE honored there.
 *
 * Rules (ADR-18 ownership matrix + ADR-21 delegation):
 *   - a non-code role (architect/reviewer/po/critic/team-lead/learner) writing application source
 *   - a role writing another role's artifact: plan.md=architect, review.md=architect|reviewer,
 *     implementation.md=developer, summary.md=team-lead (lessons.md is shared by design)
 *   - ANY subagent writing .claude/.pipeline-state (the team lead owns it, main-session only)
 *   - ANY subagent spawning a pipeline-role agent via Agent/Task (ADR-21: delegated
 *     self-advancement — the F16 incident vector: a developer commissioned done-checks, a
 *     Step-2 review, and a learner as correctly-typed agents, so the ownership rules above
 *     never fired). Research spawns (Explore, general-purpose) are sanctioned.
 *   - ANY subagent running a state-changing git write via Bash (ADR-18/20: pipeline agents
 *     never commit; the team lead owns commits — the #1 fabrication vector's commit leg).
 *     Matched by anchored-regex substring (guard.js house style) on the canonical verb list
 *     commit/add/reset/push/stash/restore/switch; read-only git and `git commit-graph` never
 *     flag. Best-effort early-warning only — the team lead's `git log` author check is the
 *     guaranteed retroactive catch (team-lead.md Enforcing the Rules).
 *
 * Zero footprint when clean: nothing is created unless a violation occurs. Fail silent on any
 * error (mirrors audit-logger).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const NONCODE_ROLES = new Set(['architect', 'reviewer', 'po', 'critic', 'team-lead', 'learner']);
const PIPELINE_ROLES = new Set(['po', 'architect', 'developer', 'reviewer', 'critic', 'learner', 'team-lead', 'solo']);
const ARTIFACT_OWNERS = [
  [/\/plan\.md$/, new Set(['architect'])],
  [/\/review\.md$/, new Set(['architect', 'reviewer'])],
  [/\/implementation\.md$/, new Set(['developer'])],
  [/\/summary\.md$/, new Set(['team-lead'])],
];

// Same source-file test as guard.js/pipeline-gate.js: markdown/config are not code; docs/ and
// .claude/ are doc/system areas.
function isCodeFile(fp) {
  const p = String(fp).toLowerCase();
  if (/(^|\/)(docs|\.claude)\//.test(p)) return false;
  return /\.(cs|ts|tsx|js|jsx|mjs|cjs|vue|css|scss|sass|less|py|go|java|kt|rb|rs|php|c|h|cpp|hpp|cc|swift|sql|sh|ps1|razor|cshtml)$/.test(p);
}

function violation(role, fp) {
  if (/(^|\/)\.claude\/\.pipeline-state$/.test(fp)) {
    return 'subagent wrote .claude/.pipeline-state — the team lead (main session) is its sole writer (ADR-18)';
  }
  for (const [re, owners] of ARTIFACT_OWNERS) {
    if (re.test(fp) && !owners.has(role)) {
      return `wrote an artifact whose owner is another role (${fp}) — each artifact has exactly one owner (ADR-18)`;
    }
  }
  if (NONCODE_ROLES.has(role) && isCodeFile(fp)) {
    return `non-code role edited application source (${fp}) — route code changes to the developer`;
  }
  return null;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    if (!/^(Write|Edit|MultiEdit|Agent|Task|Bash)$/.test(data.tool_name || '')) return process.exit(0);
    if (!data.agent_type) return process.exit(0); // main session: the foreground gate + team lead cover it
    const role = String(data.agent_type).toLowerCase().split(/[:/]/).pop();
    const ti = data.tool_input || {};

    let rule = null;
    let fp = '';
    if (/^(Agent|Task)$/.test(data.tool_name)) {
      // ADR-21: delegated self-advancement — a subagent commissioning pipeline-role agents.
      const target = String(ti.subagent_type || '').toLowerCase().split(/[:/]/).pop();
      if (!PIPELINE_ROLES.has(target)) return process.exit(0); // research spawns are sanctioned
      fp = String(ti.subagent_type || '');
      rule = `subagent spawned a pipeline-role agent (${target}) — pipeline advancement belongs to the team lead alone (ADR-21)`;
    } else if (data.tool_name === 'Bash') {
      // ADR-18/20: pipeline agents never commit — the team lead owns commits. A subagent running a
      // state-changing git write is the #1 fabrication vector's commit leg. Best-effort EARLY-WARNING
      // layer only; the team lead's `git log` author check at every verify point is the GUARANTEED
      // retroactive catch (it unwinds any commit not authored by the team lead, however it was made).
      //
      // Matching: anchored-regex substring on the LOWERCASED command (guard.js house style at :137-138)
      // — NOT a prefix scan. A prefix scan misses `git status && git commit -m x` (prefix is `git status`)
      // and `bash -c "git commit …"` (prefix is `bash`); a missed write is a silently undetected breach.
      // The trailing (\s|$) is load-bearing: `\bcommit\b` alone matches INSIDE `git commit-graph` (the `-`
      // is a word boundary), so requiring whitespace-or-end after the verb is what excludes the
      // `git commit-graph` maintenance command while still matching `git add .`, `git add -A`, and chains.
      const c = String(ti.command || '').toLowerCase();
      if (!/\bgit\s+(commit|add|reset|push|stash|restore|switch)(\s|$)/.test(c)) return process.exit(0);
      fp = String(ti.command || '');
      rule = 'subagent ran a git write — pipeline agents never commit; the team lead owns commits (ADR-18, commit strategy ADR-20)';
    } else {
      fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
      if (!fp) return process.exit(0);
      rule = violation(role, fp);
      if (!rule) return process.exit(0);
    }

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, 'violations.log'),
      JSON.stringify({ ts: new Date().toISOString(), agent: role, tool: data.tool_name, path: fp, rule }) + '\n'
    );
    process.stdout.write(JSON.stringify({
      systemMessage: `Nexus boundary detector: ${role} ${data.tool_name} -> ${fp} (${rule}). Logged to .claude/audit/violations.log.`,
    }));
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
