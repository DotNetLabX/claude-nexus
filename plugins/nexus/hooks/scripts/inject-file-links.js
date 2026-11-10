#!/usr/bin/env node
/**
 * Nexus SessionStart hook: injects the FILE-LINKS envelope — the fourth session-start payload, beside
 * the rules kernel (inject-rules.js), the prohibitions (inject-prohibitions.js) and the reply form
 * (inject-reply-style.js). It fires on startup | clear | compact and never on resume, where the
 * transcript already carries the original delivery.
 *
 * WHAT IT CARRIES. rules/file-links/file-links.md — name a local file in a reply as a markdown link,
 * the file name over the file:/// URL of its absolute path — followed by one line giving this session's folder as a ready link
 * prefix, so the agent never forms the drive letter, the slashes or the percent-encoding itself.
 *
 * WHEN IT PRINTS. Only in a terminal session: CLAUDE_CODE_ENTRYPOINT exactly `cli`. An IDE or the
 * desktop app links `path:line` itself, and an unknown host is not assumed to be a terminal, so any
 * other value, or none, prints nothing. Only the main session gets it: spawned agents report to it,
 * and it names the files in its own reply; files any agent writes keep repo-relative paths.
 *
 * THE SETTING. `features.clickableFileLinks` in the project's .claude/nexus-agents.json — on unless
 * it is JSON `false`. A missing file, a missing key, any other value and unparseable JSON all print,
 * silently: a broken config must never cost a session its envelope, nor crash the hook. `replyStyle`
 * does not reach this envelope.
 *
 * TERMINALS. Tested: Windows Terminal (2026-11-01) — a bare file:/// URL opens on click, a drive path
 * or a repo-relative path does not. The markdown-link form is the owner's choice (2026-11-10). Not
 * tested: macOS Terminal.app, iTerm2, Linux terminals, the VS Code terminal; there the worst case is a
 * link that does not open.
 *
 * The content lives in rules/file-links/, a subdirectory the kernel's non-recursive enumeration never
 * reads. Its budget (700 chars) covers the content file and the folder line's label, and is gated by
 * its test, not by a tripwire here. The folder URL rides on top, uncapped: its length is the
 * checkout path's.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const contentFile = path.resolve(__dirname, '..', '..', 'rules', 'file-links', 'file-links.md');

function linksOff(projectDir) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(projectDir, '.claude', 'nexus-agents.json'), 'utf8'));
    return !!cfg && typeof cfg.features === 'object' && cfg.features !== null && cfg.features.clickableFileLinks === false;
  } catch {
    return false;
  }
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  if (process.env.CLAUDE_CODE_ENTRYPOINT !== 'cli') process.exit(0);

  let evt = {};
  try {
    evt = JSON.parse(input || '{}') || {};
    if (evt.source === 'resume') process.exit(0);
  } catch { evt = {}; /* unparseable stdin — fall through and inject (fail open) */ }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
  if (linksOff(projectDir)) process.exit(0);

  let body = '';
  try { body = fs.readFileSync(contentFile, 'utf8'); } catch { process.exit(0); }
  if (body.trim() === '') process.exit(0);

  let folder = pathToFileURL(path.resolve(projectDir)).href;
  if (!folder.endsWith('/')) folder += '/';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `${body}\nThis session's folder link: ${folder}\n`,
    },
  }));
  process.exit(0);
});
