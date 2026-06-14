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
 *
 * REMOVED — invariant (3), state-file integrity (blocking a pipeline subagent's write to
 * .claude/.pipeline-state): the only callers it could ATTRIBUTE (data.agent_type is present
 * solely on subagent tool calls) are background subagents, whose PreToolUse deny the platform
 * drops (ADR-13). There was no caller both attributable AND blockable — unreachable code.
 * State-file ownership ("team lead is the sole writer") is enforced by ADR-18 agent hard rules
 * + the team lead's verify-and-intervene, not by this gate.
 *
 * Scope honesty: this gate is effective for FOREGROUND writers only — the main session and
 * persona-command runs. Background pipeline subagents are governed by their own hard-stop
 * rules + team-lead checkpoints (ADR-13..15), not by this gate.
 *
 * Deliberate fail-open edges (do not "fix" without reading ADR-7's posture):
 *   - For Edit, only `new_string` is inspected — an Edit that flips a verdict line to APPROVED
 *     without touching the findings table is not caught (conservative by design).
 *   - Path matches require a directory separator before the filename (`/plan.md`, `/review.md`) —
 *     a bare relative filename in the project root is not matched.
 *
 * Design rules (so it never wedges a run, including unattended -p):
 *   - Fail open on ANY uncertainty (bad JSON, missing state file, ambiguous content).
 *   - Deny reasons are self-correcting, so an unattended agent fixes itself with no human.
 *   - It only ever DENIES or stays silent; it never auto-approves.
 */
'use strict';
const fs = require('fs');
const path = require('path');

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
  // Two clean-approval shapes carry the token without being a finding (review-format SKILL.md):
  //   - NEGATION: a line-initial "No …" summary ("No CRITICAL or HIGH findings.") states ABSENCE.
  //     Anchored to line-start (optional leading list/quote markers) so a `### [HIGH] No input
  //     validation on critical path` heading — where "no" is mid-heading, not the line's opener —
  //     is never pardoned. Bullets ("- No CRITICAL …") and blockquotes ("> No CRITICAL …") are
  //     still pardoned because they legitimately open with "no".
  //   - CONFIDENCE field: "**Confidence:** HIGH" is the reviewer's per-finding qualifier
  //     (review-format `**Confidence:**`), not a severity. Match the field, not token adjacency.
  const NEGATED = /^[\s>*_-]*no\b[^.]*\b(critical|high)\b/i;
  const CONFIDENCE_FIELD = /\bconfidence\b\s*[:*]/i;

  const lines = t.split('\n');
  for (let k = 0; k < lines.length; k++) {
    const ln = lines[k];
    if (!/\b(CRITICAL|HIGH)\b/.test(ln) || LEGEND.test(ln)) continue;
    if (NEGATED.test(ln) || CONFIDENCE_FIELD.test(ln)) continue;
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
