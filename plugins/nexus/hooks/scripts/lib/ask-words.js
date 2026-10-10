'use strict';
/**
 * The two shipped word lists an owner ask is checked against — the plugin's own vocabulary and the
 * pointer phrases — read for the ask gate's word checks.
 *
 * The lists are a skill reference — `skills/questions-format/references/ask-words.md` — for the same
 * reason the catalogue is: the always-on kernel has no room for another auto-listed rule file, and a
 * document a skill owns is the estate's existing shape for a list the owner curates by hand. Only
 * the backticked bullet entries under the two H2 headings are parsed.
 *
 * FAIL OPEN: a missing, unreadable or entry-less file yields `null`, and the caller skips both word
 * checks rather than failing them — the same posture the catalogue reader takes.
 */
const fs = require('fs');
const path = require('path');

// hooks/scripts/lib -> hooks/scripts -> hooks -> nexus
const ASK_WORDS_PATH = path.join(
  __dirname, '..', '..', '..', 'skills', 'questions-format', 'references', 'ask-words.md'
);

const H2_RE = /^## (.+?)\s*$/;
const ENTRY_RE = /^- `([^`]+)`\s*$/;
const SECTIONS = { vocabulary: 'vocabulary', 'pointer phrases': 'pointers' };

/**
 * `{ vocabulary, pointers }` in the document's own order, or null when neither list can be read.
 * `file` is injectable so the fail-open arm can be proven against a path that does not exist.
 */
function readAskWords(file = ASK_WORDS_PATH) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const lists = { vocabulary: [], pointers: [] };
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = H2_RE.exec(line);
    if (heading) { current = SECTIONS[heading[1].trim().toLowerCase()] || null; continue; }
    if (!current) continue;
    const entry = ENTRY_RE.exec(line);
    if (entry) lists[current].push(entry[1].trim().toLowerCase());
  }
  return lists.vocabulary.length + lists.pointers.length > 0 ? lists : null;
}

/**
 * A consuming project's own allowance: the words it reads as its own plain English and is not
 * refused on. Lower-cased to match the shipped entries. Any read, parse or shape failure is an
 * empty allowance — a malformed config never turns into a gate that refuses nothing or everything.
 */
function readProjectAllowance(root) {
  try {
    const raw = fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8');
    const allow = ((JSON.parse(raw) || {}).askWords || {}).allow;
    if (!Array.isArray(allow)) return [];
    return allow.filter((w) => typeof w === 'string').map(canonical);
  } catch { return []; }
}

/**
 * One spelling per entry, so an allowance written `fast-lane` covers the list's `fast lane`. The
 * matcher treats whitespace and a hyphen alike inside a compound; comparing raw strings would make
 * the allowance stricter than the ban it is meant to lift, and silently.
 */
function canonical(word) {
  return String(word || '').trim().toLowerCase().split(/[\s-]+/).filter(Boolean).join(' ');
}

/**
 * One entry's matcher. The words of a compound are joined by any run of whitespace or a single
 * hyphen — an entry spelled `mine-from-spec` and a text saying "mine from spec" are the same
 * three words — and the last word may carry a plural `s` or `es`. Both ends anchor on a word
 * boundary, which is what keeps `folder` off the `fold` entry and `seat` off `checker seat`.
 */
function entryPattern(entry) {
  const words = String(entry).split(/[\s-]+/).filter(Boolean).map(escapeRe);
  if (words.length === 0) return null;
  words[words.length - 1] += '(?:es|s)?';
  // An underscore binds like a letter, never like a space: `persona_id` and `census_count` are
  // identifiers, not the words. The gate's emphasis check already blesses `snake_case_name` in an
  // ask, so a word check that refused the same token would contradict it.
  return new RegExp(`(?<![A-Za-z0-9_])${words.join('(?:\\s+|-)')}(?![A-Za-z0-9_])`, 'i');
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/**
 * The first entry of `words` that appears in `text`, or null. Scanning follows the list's own order,
 * so a refusal names the entry the document lists first among those that matched.
 */
function matchListed(text, words) {
  if (typeof text !== 'string' || text === '' || !Array.isArray(words)) return null;
  for (const entry of words) {
    const re = entryPattern(entry);
    if (re && re.test(text)) return entry;
  }
  return null;
}

module.exports = { readAskWords, readProjectAllowance, matchListed, ASK_WORDS_PATH };
