#!/usr/bin/env node
/**
 * Nexus PreToolUse pipeline gate (SYNCHRONOUS — can block).
 *
 * Backstops the pipeline invariants that prose instructions alone failed to enforce
 * (a faithful agent can still violate them and believe it complied):
 *
 *   1) Two-phase spawn, persona-keyed — present⇒strict, absent⇒open.
 *
 *      When .pipeline-state IS present (team-lead wrote it — a pipeline is active):
 *        - developer source-write: allowed ONLY under "developer:implement". Any other
 *          token, including unrecognized values, denies (conservative). Rationale: source
 *          is the high-risk write; only the one explicit working token permits it.
 *        - architect plan.md write: denied under any token ending in ":analyze" (the
 *          collapse). Allowed under "architect:plan", absent, or any other token.
 *          Rationale: plan.md is lower-risk; only the analyze-collapse is blocked.
 *
 *      When .pipeline-state IS absent (file missing): fail open — solo / leaderless /
 *      unattended runs are never wedged. The team lead is always present when a pipeline
 *      is active and can always advance the token, so present⇒strict never deadlocks:
 *      the deny reason names the required token; the team lead writes it; the subagent
 *      (blocked by invariant 3 from writing it itself) is not asked to.
 *
 *      No cross-session deadlock: restore-agent.js clears .pipeline-state on SessionStart
 *      startup/clear, so a stale token from a prior closed session cannot block a new one.
 *
 *   2) Verdict integrity. A review.md written with an APPROVED verdict while it still lists
 *      an unresolved CRITICAL or HIGH finding is an invalid verdict. Blocked.
 *
 *   3) State-file integrity. .claude/.pipeline-state is invariant (1)'s source of truth, yet it
 *      lives under .claude/ (guard.js treats that as writable) and is not a plan/source file —
 *      so nothing else stops a pipeline subagent from rewriting it. A subagent that flips its
 *      own ":analyze" to ":implement" would bypass (1) silently. Only the team lead owns phase
 *      transitions; a pipeline subagent writing the state file is blocked.
 *
 *   4) Team-lead read-lane (H0). The team lead routes; it does not review. Prose said so and was
 *      ignored under load (a live run's team lead opened implementation.md and grep-read large
 *      stretches of plan.md — usurping the judging agent's role and inflating its own context).
 *      So the gate also sees Read/Grep: when the actor IS the main-session team lead, it may Read
 *      only communication-log.md / questions.md and run a STRUCTURALLY-BOUNDED Grep of
 *      review.md / codex-crosscheck.md (verdict scan); opening plan.md / implementation.md /
 *      lessons.md / plugins+src source is denied. The team lead is detected from the
 *      session-keyed registry (.personas.json[session_id].agent === 'team-lead') with NO subagent
 *      agent_type — NOT .current-agent (which no hook ever clears, so it goes stale and would
 *      false-positive-wedge the main session or no-op in a consumer). Absent/disagreeing signal ⇒
 *      allow (fail open). Only the main-session team lead is constrained; every other actor and a
 *      subagent posing via agent_type fast-paths to allow.
 *
 *   (dev-repo source coverage — H2b) The collapse gate (1) keys "source" on real-code extensions
 *      and excludes docs/ — correct for a CONSUMING project. But THIS plugin's pipeline source IS
 *      markdown (plugins/<name>/{agents,rules,skills,commands,hooks}/...), so a developer analyze-collapse
 *      wrote those straight through. When the project root is itself the nexus plugin dev repo —
 *      and ONLY then — a developer write under plugins/<name>/{agents,rules,skills,commands,hooks}/... is
 *      treated as a guarded source write too. The marker is deliberately narrow (root-anchored
 *      <root>/plugins/<name>/.claude-plugin/plugin.json with name ∈ {nexus,nexus-dotnet}) so a
 *      consumer monorepo that vendors or hosts a plugin never has its doc writes blocked.
 *
 * Design rules (so it never wedges a run, including unattended -p):
 *   - Fail open on ANY uncertainty (bad JSON, missing state file, ambiguous content).
 *   - Deny reasons are self-correcting: they tell the acting agent what to do next.
 *   - It only ever DENIES or stays silent; it never auto-approves.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Pipeline roles a subagent can claim — gates who may write the phase-state file (invariant 3).
const PIPELINE_ROLES = new Set(['architect', 'developer', 'reviewer', 'po', 'critic', 'learner']);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }

  const tool = data.tool_name || '';
  const ti = data.tool_input || {};

  // (4) Team-lead read-lane (H0). MUST run BEFORE the Write/Edit/MultiEdit early-return below —
  //     that line hard-allows every non-Write tool, so a Read/Grep branch placed after it is dead
  //     code. Only the MAIN-SESSION team lead is constrained; every other actor (and any subagent,
  //     which carries agent_type) fast-paths to allow() so the common case stays cheap.
  if (tool === 'Read' || tool === 'Grep') {
    if (!isMainSessionTeamLead(data)) return allow(); // fast-path: not the hub → not our concern
    return teamLeadReadLane(tool, ti);
  }

  // Pipeline spawns are intentionally background (ADR-12) — spawn mode is no longer gated here.
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
  const state = readPipelineState(root);

  // (1) Persona-keyed phase enforcement: present⇒strict, absent⇒open.
  if (state !== null) {
    const writer = String(data.agent_type || '').toLowerCase().split(/[:/]/).pop();

    // Developer source-write: allowed ONLY under the one explicit working token.
    // Any other present value — including unrecognized tokens — denies (conservative).
    // Exact-string match: state.trim() === 'developer:implement' (readPipelineState already trims).
    // H2b: in THIS plugin's dev repo, markdown under plugins/<name>/{agents,rules,skills,commands,hooks}
    // is real source too — count it (scoped to the nexus dev repo by the root-anchored marker so no
    // consuming project is affected).
    if (writer === 'developer' && (isCodeFile(fp) || isDevRepoPluginSource(fp, root))) {
      if (state !== 'developer:implement') {
        return deny(
          `developer source-write blocked: .pipeline-state is "${state}", not "developer:implement". ` +
          'Phase 1 is analyze-and-stop: report your findings and let the team lead advance ' +
          '.pipeline-state to "developer:implement" before writing code.'
        );
      }
      return allow(); // explicit working token — permit
    }

    // Architect plan.md write: blocked only under any token ending in ":analyze" (the collapse).
    // Suffix match (reuses the well-tested analyze-detection pattern): /analyze\s*$/.test(state).
    // Allowed under architect:plan, absent, or any other state — lower-risk than source.
    if (writer === 'architect' && /\/plan\.md$/.test(fp)) {
      if (/analyze\s*$/.test(state)) {
        return deny(
          `plan.md written during an analyze phase (.pipeline-state is "${state}"). Phase 1 is ` +
          'analyze-and-stop: surface questions and let the team lead resume you for Phase 2 ' +
          '("Write the plan") before writing the plan.'
        );
      }
      return allow();
    }

    // All other writes during a present state: allow (out of this invariant's scope).
  }

  // Absent state (state === null): fail open for source/plan writes — solo/leaderless/unattended.

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

/**
 * Returns the raw trimmed lowercase token, or null if the file is absent/unreadable/empty.
 * null = fail open (no active pipeline or state file cleared by restore-agent.js).
 */
function readPipelineState(root) {
  try {
    const s = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim().toLowerCase();
    return s || null; // treat empty file as absent
  } catch { return null; } // absent → fail open
}

function isCodeFile(fp) {
  const p = String(fp).toLowerCase();
  if (/(^|\/)(docs|\.claude)\//.test(p)) return false;
  return /\.(cs|ts|tsx|js|jsx|mjs|cjs|vue|css|scss|sass|less|py|go|java|kt|rb|rs|php|c|h|cpp|hpp|cc|swift|sql|razor|cshtml)$/.test(p);
}

/**
 * H2b — dev-repo plugin-source check. In THIS plugin's own dev repo the pipeline source IS markdown,
 * so a developer write under plugins/<name>/{agents,rules,skills,commands,hooks}/** must count as a
 * guarded source write for the collapse gate. Scoped narrowly so NO consuming project is affected:
 * armed ONLY when the root-anchored marker <root>/plugins/<name>/.claude-plugin/plugin.json exists AND
 * its "name" is nexus/nexus-dotnet (MINOR-3 — a vendored/nested plugin in a consumer monorepo also has
 * a plugins/<name>/.claude-plugin/plugin.json, but it is NOT at the project root and/or not named nexus).
 * The <name> in the write path and in the marker must be the SAME plugin dir.
 */
function isDevRepoPluginSource(fp, root) {
  const p = String(fp).replace(/\\/g, '/');
  // Match the plugin dir name and require a guarded subfolder. Anchor so a stray "plugins/" deeper in
  // a path (e.g. .../node_modules/x/plugins/...) does not match: the segment must be at path start or
  // directly under the project root.
  const m = p.match(/(?:^|\/)plugins\/([^/]+)\/(agents|rules|skills|commands|hooks)\//);
  if (!m) return false;
  const name = m[1];
  // Marker must resolve at the PROJECT ROOT (not the matched path, which could be vendored/nested).
  const marker = path.join(root, 'plugins', name, '.claude-plugin', 'plugin.json');
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(marker, 'utf8')); } catch { return false; }
  return pkg && (pkg.name === 'nexus' || pkg.name === 'nexus-dotnet');
}

/**
 * H0 — is the actor the MAIN-SESSION team lead? Detected from the session-keyed persona registry
 * (.personas.json[session_id].agent === 'team-lead'), which restore-agent.js prunes (16h TTL) and
 * clears on exit — NOT .current-agent (which no hook ever clears, would go stale, and would
 * false-positive-wedge the main session or no-op in a consumer; MAJOR-1). A subagent carries
 * agent_type, so it can never pose as the main-session team lead. Absent/disagreeing signal ⇒ false
 * (fail open, ADR-7) — never wedge an unattended or non-team-lead session.
 */
function isMainSessionTeamLead(data) {
  if (data.agent_type) return false; // a subagent — cannot be the main-session hub
  const sid = data.session_id;
  if (!sid) return false; // no session identity → cannot confirm → fail open
  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  let reg;
  try { reg = JSON.parse(fs.readFileSync(path.join(root, '.claude', '.personas.json'), 'utf8')); } catch { return false; }
  const e = reg && reg[sid];
  return !!(e && e.agent === 'team-lead');
}

/**
 * H0 — the team lead's enforced read-lane. Mirrors team-lead.md's Read Discipline table EXACTLY
 * (MINOR-4): allow Read of communication-log.md + questions.md; allow a STRUCTURALLY-BOUNDED Grep of
 * review.md / codex-crosscheck.md (verdict scan) only; deny opening plan.md / implementation.md /
 * lessons.md and any plugins/ + src/ source. Default for any other team-lead Read/Grep is deny —
 * the lane is enumerated, not open. (git diff --stat is a Bash call, not Read/Grep — unaffected.)
 */
function teamLeadReadLane(tool, ti) {
  const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
  const base = fp.split('/').pop() || '';
  const lower = fp.toLowerCase();

  const DENIED_ARTIFACTS = /^(plan|implementation|lessons)\.md$/;
  const isSource = /(^|\/)(plugins|src)\//.test(lower);

  if (tool === 'Read') {
    if (base === 'communication-log.md' || base === 'questions.md' || base === 'backlog.md') return allow();
    if (DENIED_ARTIFACTS.test(base) || isSource) return denyReadLane(base || fp);
    // Anything else the team lead tries to Read is outside the router lane → deny (enumerated lane).
    return denyReadLane(base || fp);
  }

  // tool === 'Grep'. Allow ONLY a bounded verdict scan of review.md / codex-crosscheck.md.
  const VERDICT_FILES = base === 'review.md' || base === 'codex-crosscheck.md';
  if (VERDICT_FILES && grepIsBounded(ti)) return allow();
  return denyReadLane(base || fp || 'that file');
}

/**
 * A Grep is "structurally bounded" (verdict-scan only, not a disguised full read; MINOR-1) when it
 * returns paths/counts (no body), OR its context window is small (-C/-A/-B ≤ 3) with no head_limit:0
 * (head_limit:0 = unlimited). output_mode defaults to files_with_matches when unset → bounded.
 */
function grepIsBounded(ti) {
  const mode = ti.output_mode || 'files_with_matches';
  if (mode === 'files_with_matches' || mode === 'count') return true;
  // content mode: bounded only if context flags are small and output is not unlimited.
  if (ti.head_limit === 0) return false;
  const ctx = Math.max(
    Number(ti['-C'] || 0), Number(ti['-A'] || 0), Number(ti['-B'] || 0), Number(ti.context || 0)
  );
  return ctx <= 3;
}

function denyReadLane(what) {
  return deny(
    `the team lead is reading "${what}" — you route, you don't read. The plan is the critic's lane, ` +
    'implementation/lessons the developer\'s, review the reviewer\'s. Forward this to the architect ' +
    '(done-check) or reviewer, or resume the owning agent by agentId. You may Read only ' +
    'communication-log.md / questions.md and grep review.md / codex-crosscheck.md for the verdict.'
  );
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
