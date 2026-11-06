'use strict';
/**
 * Keeps the plugin's per-session state folders out of git, so no repository has to list them in its own
 * `.gitignore`: each line is appended to the repository's shared exclude file (`info/exclude` in its common
 * git folder, which every worktree reads) where it is missing. Appends only, never rewrites the file.
 *
 * The common folder is read from the checkout's own `.git` entry, with no git process: a folder is the
 * common folder; a file (a linked worktree, a submodule) names its git folder in `gitdir:`, relative to the
 * checkout or absolute, and that folder's `commondir`, where present, names the common one relative to it.
 * A checkout with no `.git` entry of its own, or one naming a folder that is not there, is left alone.
 *
 * Every failure is silent: this runs at every session start of every repository the plugin serves.
 */
const fs = require('fs');
const path = require('path');

const LOCAL_STATE = ['.claude/pipeline-state/', '.claude/approval-scope/'];

function commonGitDir(root) {
  const entry = path.join(root, '.git');
  const stat = fs.statSync(entry, { throwIfNoEntry: false });
  if (!stat) return null;
  if (stat.isDirectory()) return entry;
  const named = /^gitdir:\s*(.+?)\s*$/m.exec(fs.readFileSync(entry, 'utf8'));
  if (!named) return null;
  const gitDir = path.resolve(root, named[1]);
  let common = '';
  try { common = fs.readFileSync(path.join(gitDir, 'commondir'), 'utf8').trim(); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  return common ? path.resolve(gitDir, common) : gitDir;
}

// The lines it appended, `[]` where none was missing or nothing could be done.
function excludeLocalState(root, lines = LOCAL_STATE) {
  try {
    const common = commonGitDir(root);
    if (!common || !fs.statSync(common).isDirectory()) return [];
    const file = path.join(common, 'info', 'exclude');
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (err) { if (err.code !== 'ENOENT') return []; }
    const present = new Set(text.split(/\r?\n/).map((l) => l.trim()));
    const missing = lines.filter((l) => !present.has(l));
    if (!missing.length) return [];
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${text && !text.endsWith('\n') ? '\n' : ''}${missing.join('\n')}\n`);
    return missing;
  } catch {
    return [];
  }
}

module.exports = { excludeLocalState, LOCAL_STATE };
