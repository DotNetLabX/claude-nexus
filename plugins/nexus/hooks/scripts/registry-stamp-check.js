#!/usr/bin/env node
/**
 * Nexus PostToolUse(Bash|PowerShell) registry re-stamp check. Async, observe-only, ADVISORY — never blocks
 * and never fails a call.
 *
 * Why this exists (F40): the BR registries under docs/business-rules/ are the program's durable
 * asset, but the registry guardrail only fires for edits made INSIDE the pipeline (developer.md /
 * solo.md). A hand edit to a registered unit made outside the pipeline — the main session, a
 * hotfix, a quick tweak — commits with the registry silently stale, and nothing sees it. This is
 * the backstop: it notices a commit that touched a registered unit but did NOT re-stamp that
 * unit's registry, and says so.
 *
 * Scope: the MAIN SESSION INCLUSIVELY — deliberately NO `agent_type` gate. The sibling
 * boundary-detector.js is subagent-only because main-session writes are already covered by the
 * foreground gate; here the opposite holds. Legitimate commits happen in the main session (ADR-18/20:
 * the team lead owns commits), so a subagent-only gate would blind this hook to its single most
 * likely trigger. Copying that precedent is the one thing this hook must not do.
 *
 * Input model: PostToolUse fires AFTER `git commit` returned, so the index already equals HEAD and
 * reading the staged set yields nothing. The commit that was just created is what matters, so the
 * file list comes from `git diff-tree --root --no-commit-id --name-only -r HEAD` (`--root` so a
 * repo's very first commit lists its files instead of printing nothing). A *failed* commit leaves
 * HEAD at the previous commit and can therefore produce one spurious advisory — accepted as
 * advisory-tolerable, since the output is a warning nobody is gated on.
 *
 * Matching (v1 heuristic, F40 Decision 5): registries are flat per-class (ADR-45), so a committed
 * file matches a registry when their basenames match, case-insensitively and ignoring extension
 * (`Hungarian.cs` matches `hungarian.md`). A wrong miss is advisory-only; a parsed unit-to-file
 * manifest is F41 material.
 *
 * THE CHECK ITSELF NOW LIVES IN lib/registry-stamp.js (F81 Step 8). This hook keys on a shell-tool
 * `git … commit`, and a commit made inside node — commit-step.js, the per-step helper — never passes
 * through that matcher, so the check would have gone dark for exactly the commits that strategy
 * creates. The helper runs the same function over the paths it is about to stage. Two callers, one
 * rule: do not re-inline it here. What stays this file's own is the INPUT MODEL above (a shell gate, a
 * post-commit `diff-tree` read) — the lib knows nothing about hooks or git.
 *
 * Zero footprint: no state files, nothing written anywhere — the advisory is a systemMessage and
 * nothing else. Fail silent on any error (mirrors boundary-detector / audit-logger).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { staleRegistries, advisoryMessage, REGISTRY_DIR } = require('./lib/registry-stamp');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    // Both shell tools — the group's matcher is `Bash|PowerShell` (F81 Step 14), and the command
    // regex below is tool-agnostic, so the gate must never advertise less coverage than the matcher.
    if (!/^(Bash|PowerShell)$/.test(data.tool_name || '')) return process.exit(0);

    // Anchored-regex substring on the lowercased command (guard.js / boundary-detector.js house
    // style) — NOT a prefix scan, so a chained `git status && git commit -m x` still triggers. The
    // trailing (\s|$) is load-bearing: `\bcommit\b` alone matches inside `git commit-graph`, which
    // is a maintenance command that creates no commit and must never trigger an advisory. The
    // flag-tolerant group lets global flags (`git --no-pager commit`) through.
    const command = String((data.tool_input || {}).command || '').toLowerCase();
    if (!/\bgit\s+(?:-{1,2}[\w-]+(?:=\S+)?\s+)*commit(\s|$)/.test(command)) return process.exit(0);

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    if (!fs.existsSync(path.join(root, ...REGISTRY_DIR))) return process.exit(0); // no registries here

    const res = spawnSync('git', ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
      cwd: root, encoding: 'utf8',
    });
    if (res.status !== 0 || !res.stdout) return process.exit(0); // no commit to read — fail open

    const committed = res.stdout.split('\n').map((l) => l.trim()).filter(Boolean);

    const stale = staleRegistries(root, committed);
    if (stale.length === 0) return process.exit(0);

    process.stdout.write(JSON.stringify({ systemMessage: advisoryMessage(stale) }));
  } catch { /* fail silent — advisory, never blocks */ }
  process.exit(0);
});
