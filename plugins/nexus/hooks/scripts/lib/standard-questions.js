'use strict';
/**
 * The routine-questions catalogue, read for the ask gate's catalogued-name check.
 *
 * The catalogue is a skill reference — `skills/questions-format/references/standard-questions.md` —
 * because the always-on kernel has no room for another auto-listed rule file, and a document a skill
 * owns is the estate's existing shape for this. Its `### {name}` headings ARE the names a routine
 * ask's opening line cites; nothing else in the file is parsed.
 *
 * FAIL OPEN: a missing, unreadable or entry-less file yields `null`, and the caller skips the check
 * rather than failing it. A gate that refuses every routine ask because a file moved would be worse
 * than one that accepts an unknown name.
 */
const fs = require('fs');
const path = require('path');

// hooks/scripts/lib -> hooks/scripts -> hooks -> nexus
const CATALOGUE_PATH = path.join(
  __dirname, '..', '..', '..', 'skills', 'questions-format', 'references', 'standard-questions.md'
);

const H3_RE = /^### (.+)$/;

/** Lower-cased, whitespace-collapsed — the one normalisation both sides of the check use. */
function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * The catalogue's names as a Set, or null when the file cannot be read or holds no entry.
 * `file` is injectable so the fail-open arm can be proven against a path that does not exist.
 */
function readCatalogue(file = CATALOGUE_PATH) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const names = new Set();
  for (const line of text.split(/\r?\n/)) {
    const m = H3_RE.exec(line);
    if (m) names.add(normalizeName(m[1]));
  }
  return names.size > 0 ? names : null;
}

module.exports = { readCatalogue, normalizeName, CATALOGUE_PATH };
