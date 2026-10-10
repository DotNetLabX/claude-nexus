'use strict';
/**
 * Shared path predicates for the Nexus hooks. `isCodeFile` is the application-source predicate of
 * guard.js, pipeline-gate.js and boundary-detector.js; `isScratchPath` is also read by guard.js and
 * prohibition-gate.js. Extracted from three drifted copies (RecipeEstateAudit, 2026-06-18) so the
 * enforcement boundary is defined once.
 *
 * "Code" = an application-source extension, OUTSIDE the doc/system areas. Markdown / JSON / YAML /
 * config are NOT code — pipeline roles legitimately write plan.md/review.md/specs/configs. `docs/`
 * and `.claude/` are doc/system areas and are never source, whatever the extension.
 *
 * Two deliberate decisions, both adopting guard.js's prior behavior as the canonical one (the other
 * two copies had drifted):
 *   - Backslash normalization: the path is normalized (`\` → `/`) BEFORE the area/extension test, so
 *     a Windows path (`src\Foo.cs`, `.claude\x.md`) is classified identically to its POSIX form. The
 *     two callers that previously normalized only at their call site now get it from the predicate;
 *     boundary-detector's predicate previously did NOT normalize at all.
 *   - Extension set is the UNION of the three prior copies. The only net effect is that pipeline-gate
 *     now treats `.sh`/`.ps1` as source (it omitted them); guard and boundary-detector already had them.
 *
 * Scratch paths (BUG-19). The session scratch folder the platform hands every agent lives under
 * `{CLAUDE_CODE_TMPDIR or os.tmpdir()}/claude/`, which the platform realpaths (Claude Code 2.1.274),
 * outside the project, and a script there is neither source nor a write the hooks police. The
 * exemption is that folder only — never "anything outside the project", because side-by-side worktrees
 * sit outside the project too and hold real feature source — and it needs the resolved root, so a
 * project that itself lives under that folder keeps its source classified. If the platform moves the
 * folder, every check goes back to firing: the safe direction.
 *
 * Memory paths (BUG-21). Auto memory lives at `{config dir}/projects/{project}/memory/`, a sibling of
 * the session transcript folder, so the payload's `transcript_path` locates it whatever the profile.
 * Any project's folder under that `projects/` counts: a session launched inside a worktree keeps its
 * transcripts in its own project folder while the memory folder is the repo's. A relocated
 * `autoMemoryDirectory` is not recognised and stays policed.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

// Case is kept: these predicates open exemptions, and a fold would admit a differently-cased sibling on
// a case-sensitive filesystem. A case mismatch only keeps a check firing. The drive letter alone is
// normalised, because Windows reports it in either case.
function normAbs(p) {
  return path.resolve(String(p)).replace(/\\/g, '/').replace(/^[a-z]:/, (d) => d.toUpperCase());
}

// The configured spelling and the resolved one: the platform realpaths its temp root, so the same folder
// can arrive either way (a macOS TMPDIR under /var resolves through /private).
function spellings(p) {
  const out = [normAbs(p)];
  try { out.push(normAbs(fs.realpathSync.native(p))); } catch { /* absent: the configured spelling only */ }
  return out;
}

function within(abs, dir) {
  return abs === dir || abs.startsWith(dir.endsWith('/') ? dir : `${dir}/`);
}

function outsideRoot(abs, root) {
  return !spellings(root).some((r) => within(abs, r));
}

function absPath(fp, root) {
  const raw = String(fp || '');
  return raw && root && path.isAbsolute(raw) ? normAbs(raw) : null;
}

function isScratchPath(fp, root) {
  const abs = absPath(fp, root);
  if (!abs) return false;
  const tempRoot = path.join(process.env.CLAUDE_CODE_TMPDIR || os.tmpdir(), 'claude');
  return spellings(tempRoot).some((t) => within(abs, t)) && outsideRoot(abs, root);
}

function isMemoryPath(fp, root, transcriptPath) {
  const abs = absPath(fp, root);
  const transcript = String(transcriptPath || '');
  if (!abs || !path.isAbsolute(transcript)) return false;
  const projects = normAbs(path.dirname(path.dirname(path.resolve(transcript))));
  if (path.posix.basename(projects) !== 'projects' || !within(abs, projects)) return false;
  const segments = abs.slice(projects.length + 1).split('/');
  return segments.length >= 3 && segments[0] !== '' && segments[1] === 'memory' && outsideRoot(abs, root);
}

function isCodeFile(fp, root) {
  if (isScratchPath(fp, root)) return false;
  const p = String(fp).replace(/\\/g, '/').toLowerCase();
  if (/(^|\/)(docs|\.claude)\//.test(p)) return false;
  return /\.(cs|ts|tsx|js|jsx|mjs|cjs|vue|css|scss|sass|less|py|go|java|kt|rb|rs|php|c|h|cpp|hpp|cc|swift|sql|sh|ps1|razor|cshtml)$/.test(p);
}

module.exports = { isCodeFile, isScratchPath, isMemoryPath };
