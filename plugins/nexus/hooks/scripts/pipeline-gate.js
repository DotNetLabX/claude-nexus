#!/usr/bin/env node
/**
 * Nexus PreToolUse pipeline gate (SYNCHRONOUS — can block).
 *
 * Backstops the pipeline invariants that prose instructions alone failed to enforce
 * (a faithful agent can still violate them and believe it complied):
 *
 *   1) Two-phase spawn. While .claude/.pipeline-state ends in ":analyze", the active
 *      agent is in its analyze-and-stop phase. Writing plan.md (architect) or application
 *      source (developer) then means the analyze checkpoint was skipped — the single-spawn
 *      collapse. Blocked.
 *   2) Verdict integrity. A review.md written with an APPROVED verdict while it still lists
 *      an unresolved CRITICAL or HIGH finding is an invalid verdict. Blocked.
 *   3) State-file integrity. .claude/.pipeline-state is invariant (1)'s source of truth, yet it lives
 *      under .claude/ (guard.js treats that as writable) and is not a plan/source file — so nothing else
 *      stops a pipeline subagent from rewriting it. A subagent that flips its own ":analyze" to
 *      ":implement" would bypass (1) silently. Only the team lead owns phase transitions; a pipeline
 *      subagent writing the state file is blocked.
 *
 * Design rules (so it never wedges a run, including unattended -p):
 *   - Fail open on ANY uncertainty (bad JSON, missing state file, ambiguous content).
 *   - Deny reasons are self-correcting, so an unattended agent fixes itself with no human.
 *   - It only ever DENIES or stays silent; it never auto-approves.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Pipeline roles — gates who may write the phase-state file (invariant 3).
const PIPELINE_ROLES = new Set(['architect', 'developer', 'reviewer', 'po', 'critic', 'learner']);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }

  const tool = data.tool_name || '';
  const ti = data.tool_input || {};

  // Spawns (Task/Agent) are background by design (ADR-12); all non-edit tools pass —
  // this gate only guards edits.
  if (!/^(Write|Edit|MultiEdit)$/.test(tool)) return allow();

  const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
  if (!fp) return allow();

  // (3) State-file integrity: a pipeline subagent must never write .claude/.pipeline-state — invariant
  //     (1)'s own source of truth. Nothing else stops it (guard.js treats .claude/ as writable; it is not
  //     a plan/source file), so a subagent could flip its own analyze->implement and bypass (1). Only the
  //     team lead (or the main session) manages phase transitions. Attributed via data.agent_type.
  if (/(^|\/)\.claude\/\.pipeline-state$/.test(fp.toLowerCase())) {
    const writer = String(data.agent_type || '').toLowerCase().split(/[:/]/).pop();
    if (PIPELINE_ROLES.has(writer)) {
      return deny(
        `the ${writer} pipeline subagent is writing .claude/.pipeline-state — the two-phase gate's own ` +
        'state. Only the team lead advances phases; a subagent rewriting it would let it flip its own ' +
        'analyze->implement phase and bypass the collapse gate. Report your checkpoint and let the team ' +
        'lead transition the phase.'
      );
    }
  }

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

  // (1) Analyze-phase collapse: plan or source written during an analyze phase.
  if (phaseIsAnalyze(root)) {
    if (/\/plan\.md$/.test(fp)) {
      return deny(
        'plan.md written during an analyze phase. Phase 1 is analyze-and-stop: surface questions and let ' +
        'the team lead resume you for Phase 2 ("Write the plan") before writing the plan.'
      );
    }
    if (isCodeFile(fp)) {
      return deny(
        `source file written during an analyze phase (${fp}). Phase 1 is analyze-and-stop: report your ` +
        'findings and let the team lead resume you for Phase 2 ("Implement") before writing code.'
      );
    }
  }

  // (2) review.md verdict integrity: APPROVED while a CRITICAL/HIGH is still open.
  if (/\/review\.md$/.test(fp) && approvedWithOpenHighSev(writtenContent(tool, ti))) {
    return deny(
      'review.md marks APPROVED while an unresolved CRITICAL or HIGH finding is present. A CRITICAL/HIGH ' +
      'forces REQUEST CHANGES and a developer fix cycle — change the verdict, or only mark the finding ' +
      'resolved after the fix is verified.'
    );
  }

  return allow();
});

function writtenContent(tool, ti) {
  if (tool === 'Write') return String(ti.content || '');
  if (tool === 'Edit') return String(ti.new_string || '');
  if (tool === 'MultiEdit' && Array.isArray(ti.edits)) {
    return ti.edits.map(e => (e && e.new_string) || '').join('\n');
  }
  return '';
}

function phaseIsAnalyze(root) {
  try {
    const s = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim().toLowerCase();
    return /analyze\s*$/.test(s);
  } catch { return false; } // no state -> fail open
}

function isCodeFile(fp) {
  const p = String(fp).toLowerCase();
  if (/(^|\/)(docs|\.claude)\//.test(p)) return false;
  return /\.(cs|ts|tsx|js|jsx|mjs|cjs|vue|css|scss|sass|less|py|go|java|kt|rb|rs|php|c|h|cpp|hpp|cc|swift|sql|razor|cshtml)$/.test(p);
}

// Conservative heuristic: fires only on a clear APPROVED + unresolved-high pattern; else allows.
function approvedWithOpenHighSev(text) {
  if (!text) return false;
  const t = text.replace(/\r/g, '');
  const i = t.search(/\bAPPROVED\b/i);
  if (i < 0) return false;
  // not an approval if the verdict region says REQUEST CHANGES
  if (/\bREQUEST\s+CHANGES\b/i.test(t.slice(Math.max(0, i - 120), i + 120))) return false;

  const RESOLVED = /\b(resolved|fixed|dismissed|false alarm|false[- ]positive|not an issue|won'?t ?fix|deferred|n\/?a)\b/i;
  const LEGEND = /severity|meaning|must fix before merge|fix or file follow-up|code smell|^\s*\|/i;

  const lines = t.split('\n');
  for (let k = 0; k < lines.length; k++) {
    const ln = lines[k];
    if (!/\b(CRITICAL|HIGH)\b/.test(ln) || LEGEND.test(ln)) continue;
    // examine the finding line plus the next few lines for a resolution marker
    const window = lines.slice(k, k + 4).join(' ');
    if (!RESOLVED.test(window)) return true;
  }
  return false;
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus pipeline gate blocked: ${reason}`
    }
  }));
  process.exit(0);
}

function allow() { process.exit(0); }
