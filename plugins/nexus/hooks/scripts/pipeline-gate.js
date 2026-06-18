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
 *   - The verdict scan anchors POSITIVELY on a finding HEADING (`### [SEVERITY] …`, the review-format
 *     shape) — a CRITICAL/HIGH written outside that heading shape (e.g. severity-last, or in a plain
 *     paragraph) is not read as a finding. This is the deliberate inversion of the old token-blocklist
 *     (which kept false-blocking benign prose — a narrative "no CRITICAL or HIGH findings", a
 *     "critic HIGH-2" reference, the Confidence field — and corroded the artifact as reviewers
 *     contorted prose to dodge it; plugin-feedback nexus-1.13.0 item 1). The team lead's Verdict
 *     Validation + the reviewer's own Verdict Gate are the backstops for an off-format finding.
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

// Conservative heuristic: fires only when an APPROVED verdict sits beside a finding HEADING
// (`### [SEVERITY] …`) for a CRITICAL/HIGH that carries no resolution marker; else allows.
//
// Anchored POSITIVELY on the finding heading — NOT on bare token adjacency. The old approach scanned
// every line for a `CRITICAL|HIGH` token and then tried to subtract benign shapes (line-initial
// negation, a Confidence field, legend/table rows) with an exemption blocklist; that list kept
// missing new benign shapes — a narrative "the reviewer found no CRITICAL or HIGH findings", a
// "critic HIGH-2" cross-reference, a legend row phrased outside the known tokens — and false-blocked
// clean APPROVED reviews (4 features; plugin-feedback nexus-1.13.0 item 1). review-format mandates
// that real findings are `### [SEVERITY] title` headings (File/Issue/Fix lines below), so a token
// that does NOT head such a heading is, by the format, not a finding: prose, a Confidence qualifier,
// a legend, a table row, or a section heading like "### Summary: no CRITICAL issues" never trips.
function approvedWithOpenHighSev(text) {
  if (!text) return false;
  const t = text.replace(/\r/g, '');
  const i = t.search(/\bAPPROVED\b/i);
  if (i < 0) return false;
  // not an approval if the verdict region says REQUEST CHANGES
  if (/\bREQUEST\s+CHANGES\b/i.test(t.slice(Math.max(0, i - 120), i + 120))) return false;

  const RESOLVED = /\b(resolved|fixed|dismissed|false alarm|false[- ]positive|not an issue|won'?t ?fix|deferred|n\/?a)\b/i;
  // A finding is a markdown heading whose title LEADS with the severity, optionally bracketed:
  // "### [HIGH] SQL injection", "### [CRITICAL] …", "### HIGH: …" (review-format `### [SEVERITY]`).
  // The leading anchor is what excludes "### Summary: no CRITICAL …" (severity not first → not a
  // finding) while still catching "### [HIGH] No input validation …" (severity first; the "no" is
  // mid-title, not a negation summary).
  const FINDING_HEADING = /^\s{0,3}#{2,6}\s+\[?\s*(critical|high)\b/i;

  const lines = t.split('\n');
  for (let k = 0; k < lines.length; k++) {
    if (!FINDING_HEADING.test(lines[k])) continue;
    // examine the finding heading plus the next few lines for a resolution marker
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
