#!/usr/bin/env node
/**
 * Nexus PreToolUse prohibition gate (SYNCHRONOUS — can block).
 *
 * Two always-on prohibitions that prose alone did not carry (ADR-100 Decision 5: a decidable K1
 * never ships prose-only). One script, two gates, one posture: deny in the FOREGROUND with a
 * self-correcting reason; for a background subagent — where the platform drops a deny (ADR-13) —
 * log to .claude/audit/violations.log and exit 0.
 *
 *   (a) UNSCOPED STAGING (CL-150). `git add -A|--all|-u|--update`, a bare `.`/`*` pathspec, and
 *       `git commit -a|--all` stage whatever happens to be in the tree — another feature's in-flight
 *       work included. Only the step-commit helper refused these before; a coordinating session's own
 *       close commit was prose-only. Reach: any session whose active role is one of the eight known
 *       roles. A persona-less session is untouched, so the plugin never polices a user's ordinary git
 *       work in a consuming repo. A SUBAGENT's git write is deliberately NOT logged here — the
 *       boundary detector's git leg already appends a line for every one, and a second would
 *       double-count in the team lead's triage.
 *
 *   (b) APPROVAL SCOPE. "An approval is scoped to the facts you presented" reduced to the one thing
 *       a hook can see: the set of paths the ask named. The asking persona stamps them to
 *       .claude/.approval-scope; while that stamp is live (same session, younger than the 16 h
 *       personas TTL) a file edit outside the declared set is refused. The platform's scratch and
 *       memory folders (lib/is-code-file.js `isScratchPath`, `isMemoryPath`) are never scope: they lie
 *       outside the project, so no ask could name them, and refusing them would bar every approved run
 *       from its own scratch files and memories.
 *
 *       SHELL-SIDE WRITES ARE OUT OF SCOPE, by design and disclosed rather than half-enforced: a
 *       command's target paths are not reliably parseable, so `printf x > src/b.js` passes this gate.
 *       The measured failure was a file edit; the shell half stays written guidance.
 *
 * FAIL OPEN on every uncertainty — bad JSON, a missing session, an unresolvable role, an unparseable
 * or absent stamp, a missing file_path — so the gate can never wedge a run, including -p.
 *
 * LATENCY: this is a third synchronous PreToolUse hook on every edit and shell call, so the first act
 * is `needsInspection`, a pure decision made before any registry or stamp read.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole, KNOWN_ROLES } = require('./lib/resolve-role');
const { readSessionPersona } = require('./lib/read-session-persona');
const { isScratchPath, isMemoryPath } = require('./lib/is-code-file');

const STAMP_REL = path.join('.claude', '.approval-scope');
const TTL_MS = 16 * 60 * 60 * 1000; // the personas TTL — register-persona.js owns the number
const FILE_TOOLS = /^(Write|Edit|MultiEdit|NotebookEdit)$/;
const SHELL_TOOLS = /^(Bash|PowerShell)$/;

// Anchored on the git invocation and tolerant of interposed git GLOBAL flags (`git --no-pager add`),
// which match only flag-shaped tokens and never a subcommand — the badBash house style.
const GIT_VERB_RE = /\bgit\s+(?:-{1,2}[\w-]+(?:=\S+)?\s+)*(add|commit)\b([^&|;]*)/;

/**
 * Does this call need inspecting at all? Pure, exported, and called before anything touches disk.
 * True for a shell call naming a staging verb, true for a file tool while a stamp exists, else false.
 */
function needsInspection(data, stampExists) {
  const tool = String((data && data.tool_name) || '');
  const ti = (data && data.tool_input) || {};
  if (SHELL_TOOLS.test(tool)) return GIT_VERB_RE.test(String(ti.command || '').toLowerCase());
  if (FILE_TOOLS.test(tool)) return Boolean(stampExists);
  return false;
}

/** Short flag clusters expand: `-am` carries `a`. Long flags are compared whole. */
function flagChars(token) {
  return /^-[a-z]+$/.test(token) ? token.slice(1).split('') : [];
}

/**
 * The unscoped-staging form this command uses, or null. Returns the matched invocation so the deny
 * reason can quote what the author actually typed.
 */
function unscopedStaging(command) {
  const c = String(command || '').toLowerCase();
  const m = c.match(GIT_VERB_RE);
  if (!m) return null;
  const verb = m[1];
  const tokens = m[2].trim().split(/\s+/).filter(Boolean);
  const flags = tokens.filter((t) => t.startsWith('-'));
  const paths = tokens.filter((t) => !t.startsWith('-'));
  const shorts = flags.flatMap(flagChars);
  const has = (long, short) => flags.includes(long) || shorts.includes(short);

  if (verb === 'commit' && has('--all', 'a')) return m[0].trim();
  if (verb === 'add') {
    if (has('--all', 'a') || has('--update', 'u')) return m[0].trim();
    // A bare `.` or `*` is the same act spelled as a pathspec. `./docs/x.md` is a real path.
    if (paths.length > 0 && paths.every((p) => p === '.' || p === '*')) return m[0].trim();
  }
  return null;
}

/** Root-relative, forward slashes, case-folded on Windows. */
function relPath(fp, root) {
  const abs = path.isAbsolute(fp) ? fp : path.join(root, fp);
  const rel = path.relative(root, abs).split(path.sep).join('/');
  return process.platform === 'win32' ? rel.toLowerCase() : rel;
}

/**
 * Surfaces a stamp never covers. A coordinator's close edits are not "scope": the delivery folder of
 * the stamped slug, any lessons file, this plugin's own local state, and the closure surfaces.
 *
 * CASE IS FOLDED ON BOTH SIDES HERE, on every platform — deliberately, and unlike `inScope`.
 * `relPath` folds only on win32 because a case-sensitive filesystem genuinely distinguishes
 * `src/A.js` from `src/a.js`, and the DECLARED-SCOPE comparison must respect that. The literals
 * below are different in kind: they are well-known surfaces, and two of them carry capitals in
 * practice — every Nexus slug does, and the changelog is `CHANGELOG.md`. Folding only one side left
 * this function denying a slug's own delivery folder and the plugin's changelog on Linux, which is
 * to say denying the two surfaces it exists to protect. Folding widens an ALLOW list by casing
 * alone: it can never deny more than before.
 */
function alwaysAllowed(rel, slug) {
  const p = String(rel).toLowerCase();
  const base = p.split('/').pop();
  if (p.startsWith('.claude/')) return true;
  if (slug && p.startsWith(`docs/specs/${String(slug).toLowerCase()}/delivery/`)) return true;
  if (/^docs\/specs\/.+\/lessons\.md$/.test(p)) return true;
  if (p === 'docs/backlog.md' || p.startsWith('docs/programs/')) return true;
  return base === 'changelog.md' || base === 'plugin.json';
}

/**
 * Normalise a DECLARED entry, preserving its trailing slash. `path.relative` drops it, which would
 * silently demote a declared directory prefix to an exact-path entry — every file under it then
 * reads as out of scope while the stamp looks correct.
 */
function relDeclared(entry, root) {
  const isDir = /[\\/]$/.test(String(entry));
  const rel = relPath(entry, root);
  return isDir && rel && !rel.endsWith('/') ? `${rel}/` : rel;
}

function inScope(rel, declared) {
  return declared.some((d) => (d.endsWith('/') ? rel.startsWith(d) : rel === d));
}

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const stampPath = path.join(root, STAMP_REL);
  let stampExists = false;
  try { stampExists = fs.existsSync(stampPath); } catch { /* fail open */ }

  if (!needsInspection(data, stampExists)) return allow();

  const background = Boolean(data.agent_type);
  const role = resolveRole(data.agent_type || readSessionPersona(data.session_id, root) || 'main');
  const tool = String(data.tool_name || '');
  const ti = data.tool_input || {};

  // ── gate (a) ──────────────────────────────────────────────────────────────
  if (SHELL_TOOLS.test(tool)) {
    // Foreground only, and only for an active Nexus persona. A subagent's git write is the boundary
    // detector's line to write, not this gate's.
    if (background || !KNOWN_ROLES.has(role)) return allow();
    const matched = unscopedStaging(ti.command);
    if (!matched) return allow();
    return deny(
      `unscoped staging (\`${matched}\`). Stage this run's intended paths by name — ` +
      '`git add <path> …` — and verify the staged set with `git diff --cached --name-only` ' +
      'before committing (team-lead § Commit Protocol).'
    );
  }

  // ── gate (b) ──────────────────────────────────────────────────────────────
  const fp = String(ti.file_path || ti.path || ti.notebook_path || '');
  if (!fp || isScratchPath(fp, root) || isMemoryPath(fp, root, data.transcript_path)) return allow();

  let stamp;
  try { stamp = JSON.parse(fs.readFileSync(stampPath, 'utf8')); } catch { return allow(); }
  if (!stamp || !data.session_id || stamp.session_id !== data.session_id) return allow();
  const age = Date.now() - Date.parse(stamp.ts);
  if (!(age >= 0) || age > TTL_MS) return allow();

  const declared = (Array.isArray(stamp.paths) ? stamp.paths : []).map((p) => relDeclared(p, root));
  const rel = relPath(fp, root);
  if (alwaysAllowed(rel, stamp.slug) || inScope(rel, declared)) return allow();

  const n = declared.length;
  if (background) {
    const rule = `approval-scope: edit outside the stamped set (${n} paths, ${stamp.slug})`;
    logViolation(root, { agent: role, tool, path: rel, rule });
    process.stdout.write(JSON.stringify({
      systemMessage: `Nexus prohibition gate: ${role} ${tool} -> ${rel} (${rule}). Logged to .claude/audit/violations.log.`,
    }));
    return process.exit(0);
  }
  return deny(
    `\`${rel}\` is outside the approved scope (${n} paths stamped ${stamp.ts} for ${stamp.slug}). ` +
    'The approval covered the facts you presented — re-present the ask with the new fact, then ' +
    're-stamp `.claude/.approval-scope` (or delete it to proceed unscoped).'
  );
}

// Same record shape as the log's two existing writers (boundary-detector.js, read-tracker.js): the
// team lead greps this file, so a third writer inventing its own key names would fragment the triage.
function logViolation(root, row) {
  try {
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, 'violations.log'),
      JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'
    );
  } catch { /* observation must never wedge the call */ }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus prohibition gate blocked: ${reason}`,
    },
  }));
  process.exit(0);
}

function allow() { process.exit(0); }

module.exports = { needsInspection, unscopedStaging, alwaysAllowed, relPath };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => main(input));
}
