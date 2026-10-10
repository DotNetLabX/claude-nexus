#!/usr/bin/env node
/**
 * Nexus PreToolUse owner-ask gate (SYNCHRONOUS — can block).
 *
 * The decidable half of the owner-question contract (`rules/on-demand/research-before-asking.md`
 * § The owner-question contract), enforced where the ask is composed instead of discovered a
 * round-trip later (ADR-100 Decision Rule 5: a decidable format contract never ships prose-only;
 * ADR-108 applies it to this contract, revised by ADR-109, by ADR-114 and again by ADR-120). The
 * text above the question takes one of two forms, by kind of question. An ordinary decision takes
 * the RELAXED FORM: up to three fact lines of one or two sentences each, the first saying why the
 * question is asked, then the question sentence alone on the last line. A catalogued question takes
 * the short form's STANDARD-QUESTION VARIANT: the routine line `{catalogue name}, routine: {this
 * run's facts}`, at most one more fact line, then the question sentence, one sentence per line.
 * Every line ends with a sentence end and runs at most 120 characters. Below the text sit two to
 * four options that answer it — the recommended one first, its label ending `(Recommended)`, its
 * description ending in the confidence clause — each description at most two sentences, one in a
 * routine ask.
 *
 * THE CHECK SET IS NOT THIS FILE'S TO EXTEND. F170 rule 13 names fourteen checks and declares the
 * set exhaustive; CHECK_NAMES and CHECK_ORDER are that list, in the letter order its refusals use.
 * The owner-away refusal below is not a fifteenth check: it refuses on the session's state, names
 * no check, and sits in neither list.
 *
 * POSTURE, mirroring prohibition-gate.js: deny in the FOREGROUND with a self-correcting reason that
 * names every failed check at once, so one rewrite fixes all; for a background subagent — where the
 * platform drops a deny (ADR-13) — log one `.claude/audit/violations.log` line and exit 0.
 *
 * OWNER AWAY: while the session carries an owner-away mark (read through lib/read-owner-away.js;
 * register-owner-away.js sets it when a persona writes `on` to a file named `.owner-away`, and
 * removes it on `off`), every FOREGROUND ask is denied with AWAY_REASON — write `off` and ask if the
 * owner is back, otherwise list the point and continue. No rewrite of the ask passes it. A spawned
 * agent is untouched by its session's mark.
 *
 * REACH: the session's persona, one of the eight KNOWN_ROLES. A persona-less session and a
 * non-Nexus helper spawn (`Explore`, `general-purpose`) are untouched — allowed, unlogged — so the
 * plugin never polices an ordinary session's questions in a consuming repo. The owner-away refusal
 * alone reaches further: a marked foreground session is refused whatever its persona, and with none.
 *
 * FAIL OPEN on every uncertainty — bad JSON, a missing or empty `tool_input.questions`, a missing
 * session, an unresolvable persona registry, an unreadable catalogue, an unreadable word list — so
 * the gate can never wedge a run. Fail-open is PER CHECK, not per question. The owner-away mark
 * fails open the same way — absent, empty, unreadable or another session's, it changes nothing —
 * but a session that IS marked is refused even with no questions to read.
 *
 * WHAT IT CANNOT SEE: only the payload, and only a request — never an answer. So the explain re-ask
 * (a free-text answer asking what a routine question means) is prose-only by construction, as are
 * the composing rules rule 13 names as not-checked: the why line and a routine ask's lack of one,
 * admission, the relaxed wording including semicolons, the reply test and an option label's
 * concreteness, the confidence clause's own line and a description's length in characters, one
 * decision per question, and which form a catalogued question is asked in.
 *
 * LATENCY: the first disk touch is one `stat` of the session's owner-away mark, made ahead of
 * `needsInspection` because the refusal must cover a call that filter would wave through.
 * `needsInspection` itself stays a pure decision, and nothing else touches disk ahead of it.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole, KNOWN_ROLES } = require('./lib/resolve-role');
const { readSessionPersona } = require('./lib/read-session-persona');
const { readOwnerAway } = require('./lib/read-owner-away');
const { readCatalogue, normalizeName } = require('./lib/standard-questions');
const { readAskWords, readProjectAllowance, matchListed } = require('./lib/ask-words');

const TOOL = 'AskUserQuestion';

// ── the shape ────────────────────────────────────────────────────────────────
// A SENTENCE TERMINATOR ends a sentence; a full stop inside a line does not. The lookahead is what
// separates them: a terminator is followed by the end of its line, or by whitespace and then the
// start of a new sentence (a capital, a digit, an opening quote). So `3.5` and `e.g. the` stay
// whole — neither has whitespace after the stop, or has a lower-case letter after it — while a
// line-ending `…100 rows.` splits exactly where a reader would split it.
// A closing quote after the stop still ends the line, so a sentence closing on a quoted clause
// ("the copy is dirty.") is one sentence, not a line missing its terminator.
const TERMINATOR_RE = /[.!?…](?=["'”’]*[ \t]*(?:\r?\n|$)|\s+["'“‘A-Z0-9])/g;
const ENDS_SENTENCE_RE = /[.!?…]["'”’]*$/;

// A LABEL OPENER is one or two alphabetic words, a colon and a space, at a line start — the shape
// every retired marker and field label had (`Choose: `, `Problem: `, `Cost: `). The words must
// be alphabetic with nothing between them but one space, which is exactly why a routine line is not
// one: the comma in `{name}, routine: ` is not a letter.
const LABEL_OPENER_RE = /^[A-Za-z]+(?: [A-Za-z]+)?: /;

// A bullet is a dash, star, plus, bullet char, or `1.` / `1)` opening a line with content after it.
// An en/em dash is deliberately NOT a marker: prose in this estate routinely opens a wrapped line
// with one, and counting those would deny a well-formed ask.
const BULLET_RE = /^\s*(?:[-*+•]|\d+[.)])\s+\S/;

// Emphasis, precision-first. `**` anywhere is a refusal (the contract names it). A single-asterisk
// or underscore PAIR counts only where both delimiters hug non-space on the inside, so two file
// globs on one line (`*.test.mjs … *.spec.mjs`) are not a pair — the second `*` follows a space.
// The underscore arm additionally requires word boundaries, so `snake_case_name` is not emphasis.
const EMPHASIS_RE =
  /\*\*|\*(?=\S)[^*\n]*?(?<=\S)\*|(?<![A-Za-z0-9])_(?=\S)[^_\n]*?(?<=\S)_(?![A-Za-z0-9])/;

const BRACKET_RE = /[()[\]{}]/;

// The confidence CLAUSE, end-anchored on the description it closes. The label's case and inner
// spacing are free (F106's relaxed posture: only a wrong ANSWER earns a refusal, a spelling mismatch
// is normalised), but the clause after the dash is required — a bare value states nothing about why.
// Em dash, en dash or hyphen. End-anchoring on the label, not on a substring search, is what keeps
// the description's own em dash from being read as the clause's.
const CONFIDENCE_RE = /Confidence:\s*(?:high|medium|low)\s*[—–-]\s*\S[^\n]*$/i;
const CONFIDENCE_ANYWHERE_RE = /Confidence:/i;

// The label the recommended option carries, in the shipped spelling and at the label's end. Check
// (i) admits this one literal bracket pair inside an option and nothing else, so accepting a variant
// here would only move the refusal to the bracket check with a less useful reason.
const RECOMMENDED_RE = /\(Recommended\)\s*$/;

// The routine line: a catalogued name, the word that marks the question as asked by rule in every
// run of its kind, then this run's own facts.
const ROUTINE_LINE_RE = /^(.+?), routine: \S/;
// The plural is the same word: `matchListed` folds a trailing `s` for every listed entry, and a ban
// that caught "routine" but not "routines" would differ from the word checks beside it.
const ROUTINE_WORD_RE = /(?<![A-Za-z0-9])routines?(?![A-Za-z0-9])/i;

// The tool's own schema caps the array at 4, so 3 is the binding bound.
const MAX_QUESTIONS = 3;

// Fixed, never measured per terminal: lines are written to about 100 characters, and 120 is the ceiling.
const MAX_LINE_LENGTH = 120;

// ── retained from F106, unchanged ────────────────────────────────────────────
// The id set is PRECISION-FIRST: a shipped gate's false alarm is the costly side, so only three
// families are flagged. Two independent bounds keep each narrow, and they are NOT the same bound:
// the word anchors on both ends (`F1000` does not match), and the prefix-length bound of 2–4
// letters, which is what actually exempts `PREFIX-12` and every 5+ letter prefix (`SPIKE-3`,
// `STORY-4`, `COVID-19`) — extending the allow-list below will never reach those.
// Deliberately NOT flagged: Q\d+, W\d+, P\d+, G\d+, D\d+ (Q4 is a quarter, 5G a network, W3C a body).
const PREFIXED_ID_RE = /\b([A-Z]{2,4})-\d+\b/g;   // FR-19, CL-150, ADR-100, BUG-15
const SLUG_ID_RE = /\bF\d{2,3}(?:-[A-Z][A-Za-z]+)?\b/g;   // F42, F42-SomeFeature
const LEDGER_ID_RE = /\bR-\d{4}-\d{2}-\d{2}-[A-Z]\d+\b/g; // R-2026-09-08-A1

// Well-known technical prefixes carved out of the first family — one place, extendable, and the
// place to add to when a real-world token turns out to read as an id (a version, a bus, a standard,
// a timezone, an instruction set).
const WELL_KNOWN_PREFIXES = new Set([
  'UTF', 'ISO', 'SHA', 'RFC', 'IEEE', 'HTTP', 'TLS', 'GPT', 'IPV',
  'MD', 'AES', 'RSA', 'CVE', 'PR', 'SQL', 'CSV',
  'USB', 'ARM', 'UTC', 'GMT', 'SOC', 'AVX', 'DDR', 'NIST', 'ES', 'EN', 'ANSI', 'IPV6',
]);

// A backtick span is the decidable proxy for "not bare". It does NOT discharge the one-phrase gloss
// obligation — that half stays prose, and the contract says so.
//
// A span is bounded to ONE LINE and closed by a tick run of its own width. Both bounds are
// load-bearing and were measured: an unterminated tick on one line used to re-pair with the opening
// tick of a real span further down, which swallowed a genuinely bare id (a false negative) AND
// re-exposed a correctly quoted one (a false positive) from a single stray character; and the
// double-tick idiom (``ADR-100``) used to match as two empty spans, leaving the id exposed. What
// remains, and is not decidable: a stray tick can still shift the pairing WITHIN its own line.
const BACKTICK_SPAN_RE = /(`+)[^`\n]*\1/g;

// ── the check set: rule 13 (a)–(n), exhaustive ───────────────────────────────
// Each key is one named check. CHECK_NAMES is the SHORT tag (the audit log's `rule` field, which
// the team lead greps); a check may carry per-call DETAIL, which rides the deny reason only.
const CHECK_NAMES = {
  lineCount: 'line count',
  lines: 'line set',
  recommended: '(Recommended) label',
  confidence: 'confidence clause',
  id: 'internal id',
  word: 'vocabulary word',
  pointer: 'pointer phrase',
  emphasis: 'markdown emphasis',
  bracket: 'bracket',
  cap: 'three questions per call',
  header: 'header',
  routine: 'routine line',
  length: 'line length',
  description: 'option description',
};
const CHECK_ORDER = [
  'lineCount', 'lines', 'recommended', 'confidence', 'id', 'word', 'pointer', 'emphasis',
  'bracket', 'cap', 'header', 'routine', 'length', 'description',
];

const REWORD_TAIL =
  'reword per the owner-question contract: an ordinary decision takes the relaxed form — up to three ' +
  'fact lines, the first saying why the question is asked, one or two sentences each, then the ' +
  'question sentence alone on the last line; a catalogued question takes the short form\'s ' +
  'standard-question variant — the routine line, at most one more fact line, then the question ' +
  'sentence, one sentence per line; every line ends with a sentence end and runs at most 120 ' +
  'characters, with no blank line, no bullet and no label; the options are the answers, the ' +
  'recommended one first with (Recommended) on its label and Confidence: high|medium|low — why at ' +
  'the end of its description, and an option\'s description is at most two sentences, one in a ' +
  'routine ask, the confidence clause not counted; plain words only — no word from the vocabulary ' +
  'list except a catalogue name on a ' +
  'routine line, and no pointer phrase; no bare internal id anywhere, and no markdown emphasis or ' +
  'bracket in the question text; at most three questions per call ' +
  '(research-before-asking § The owner-question contract; the word lists are ' +
  'skills/questions-format/references/ask-words.md and the catalogue is ' +
  'skills/questions-format/references/standard-questions.md).';

// A refusal on the SESSION'S STATE, not on a question's shape: no rewrite of the ask can pass it, so
// it names no check and takes no REWORD_TAIL. The order of its two instructions is the contract —
// clear-and-ask first, because a mark left set after the owner came back is the case the session can
// fix itself.
const AWAY_REASON =
  'the owner is away for this run, so no question is asked. If the run was declared in the owner\'s ' +
  'words and the owner has written since, the run has ended: write `off` to `.owner-away` in the ' +
  'session scratchpad, then ask again. Otherwise put the point on the list and continue — take the ' +
  'answer the open-point table gives, and let only the part that needs the owner wait ' +
  '(agents-workflow.md § Owner-away runs).';

/**
 * Does this call need inspecting at all? Pure and exported; in `main` only the owner-away mark's
 * `stat` comes ahead of it.
 * An empty or absent `questions` array is the fail-open case. The tool-name arm is defensive rather
 * than load-bearing — the matcher in `hooks.json` means the process does not start for another
 * tool — so it is the arm that still holds if that matcher is ever widened.
 */
function needsInspection(data) {
  if (!data || String(data.tool_name || '') !== TOOL) return false;
  const questions = ((data.tool_input || {}).questions);
  return Array.isArray(questions) && questions.length > 0;
}

/** Every bare internal id in one owner-visible string, backtick spans removed first. */
function bareIds(text) {
  if (typeof text !== 'string' || text === '') return [];
  // Replaced with a SPACE, never '' — joining the sides would fabricate an id out of two halves
  // that were never one (`AD` + `R-100`).
  const clean = text.replace(BACKTICK_SPAN_RE, ' ');
  const hits = [];
  for (const re of [PREFIXED_ID_RE, SLUG_ID_RE, LEDGER_ID_RE]) re.lastIndex = 0; // a caller's .test() would otherwise skip a match
  for (const m of clean.matchAll(PREFIXED_ID_RE)) if (!WELL_KNOWN_PREFIXES.has(m[1])) hits.push(m[0]);
  for (const m of clean.matchAll(SLUG_ID_RE)) hits.push(m[0]);
  for (const m of clean.matchAll(LEDGER_ID_RE)) hits.push(m[0]);
  return hits;
}

/** Blank is whitespace-only — never a `||` default, which swallows '' and reads a blank as content. */
const isBlank = (line) => String(line).trim() === '';

/** How many sentences a string closes. The count, not the split — nothing downstream needs the parts. */
function terminators(text) {
  TERMINATOR_RE.lastIndex = 0;
  return (String(text).match(TERMINATOR_RE) || []).length;
}

// The length the reader sees: grapheme clusters, so a combining accent is not a second character.
// Code points where the runtime has no segmenter. Trailing whitespace — a carriage return included —
// is never counted.
let graphemes;
function visibleLength(line) {
  const shown = String(line).replace(/\s+$/, '');
  if (graphemes === undefined) {
    graphemes = typeof Intl === 'object' && typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;
  }
  return graphemes ? Array.from(graphemes.segment(shown)).length : [...shown].length;
}

/** The shipped lists with a consuming project's own allowance removed, or null when unreadable. */
function usableLists(lists) {
  if (!lists || !Array.isArray(lists.words) || !Array.isArray(lists.pointers)) return null;
  const allow = new Set((Array.isArray(lists.allow) ? lists.allow : []).map(canonicalWord));
  // Only the vocabulary carries an allowance: pointing at a fact instead of carrying it is never a
  // project's own plain English, so the pointer set has no per-project removal (spec rules 9, 10).
  return { words: lists.words.filter((w) => !allow.has(canonicalWord(w))), pointers: lists.pointers };
}

/** The allowance and the list are compared on one spelling — `fast-lane` covers `fast lane`. */
const canonicalWord = (w) => String(w || '').trim().toLowerCase().split(/[\s-]+/).filter(Boolean).join(' ');

/** The shipped lists, read from disk with no project allowance — the default when none is passed. */
function shippedLists() {
  const shipped = readAskWords();
  return shipped ? { words: shipped.vocabulary, pointers: shipped.pointers, allow: [] } : null;
}

/**
 * The failed checks for one question, as `{key, text}` rows.
 *
 * FAIL OPEN PER CHECK, not per question: a check whose field is absent or not the shape this gate
 * can read is SKIPPED, never failed. The payload shape is pinned but not live-verified, so a field
 * that turns out to be named something else must cost nothing — the alternative is every ask in
 * every consuming repo denied on a check that was never evaluated.
 */
function checkQuestion(q, catalogue, lists) {
  const failed = [];
  if (!q || typeof q !== 'object') return failed;
  const add = (key, detail) =>
    failed.push({ key, text: detail ? `${CHECK_NAMES[key]} ${detail}` : CHECK_NAMES[key] });

  const options = Array.isArray(q.options) ? q.options : null;
  const readable = (options || []).filter((o) => o && typeof o === 'object' && typeof o.label === 'string');
  // A PARTIALLY readable array is as unreadable as a wholly unreadable one: with one element this
  // gate cannot parse, `(Recommended)` may be sitting on the element it cannot see, and refusing
  // then reports a check that was never evaluated. All or nothing, like the array's own type.
  const optionsLegible = options !== null && readable.length > 0 && readable.length === options.length;
  // Same rule one level down, for the field (d) reads: where NO option carries a string
  // `description`, that field is not the shape this gate reads and (d) is skipped, never failed.
  const described = readable.some((o) => typeof o.description === 'string');
  const words = usableLists(lists);

  const text = typeof q.question === 'string' ? q.question : null;
  let lines = [];
  let routineName = null;
  if (text !== null) {
    lines = text.split(/\r?\n/);
    while (lines.length > 0 && isBlank(lines[lines.length - 1])) lines.pop(); // a trailing newline is not a stray line
    const routine = ROUTINE_LINE_RE.exec(lines[0] === undefined ? '' : lines[0]);
    routineName = routine ? routine[1] : null;
    // The form is the one the writer declared: a routine line sets the routine limits whatever (l)
    // concludes about its name, so an unknown name is refused once, by (l), and never also measured
    // against the other form's limits.
    const lineCap = routineName !== null ? 3 : 4;
    const sentenceCap = routineName !== null ? 1 : 2;

    // (a) the line count: the form's cap on lines, one question mark, and it is the whole last line
    const marks = (text.match(/\?/g) || []).length;
    const last = lines.length > 0 ? lines[lines.length - 1].replace(/\s+$/, '') : '';
    if (lines.length > lineCap) add('lineCount', `— ${lines.length} lines where the limit is ${lineCap}`);
    else if (marks !== 1) add('lineCount', `— ${marks} question marks`);
    else if (!last.endsWith('?') || terminators(last) !== 1) {
      add('lineCount', '— the question sentence is not the whole last line');
    }

    // (b) the line set: fact lines and the question, each ending with a sentence end
    for (const [n, l] of lines.entries()) {
      if (isBlank(l)) { add('lines', `— line ${n + 1} is blank`); continue; }
      const trimmed = l.replace(/\s+$/, '');
      // The two faults are told apart because the rewrite differs: too many terminators means split
      // the line, none at the end means finish the sentence. One reason has to say which.
      const count = terminators(trimmed);
      if (n < lines.length - 1 && count > sentenceCap) {
        add('lines', `— line ${n + 1} carries ${count} sentences where the limit is ${sentenceCap}`);
      }
      if (!ENDS_SENTENCE_RE.test(trimmed)) add('lines', `— line ${n + 1} does not end with a sentence end`);
      if (BULLET_RE.test(l)) add('lines', `— line ${n + 1} opens with a bullet`);
      if (LABEL_OPENER_RE.test(l)) add('lines', `— line ${n + 1} opens with a label`);
    }

    // (h) no markdown emphasis, (i) no bracket — the question text only
    if (lines.some((l) => EMPHASIS_RE.test(l))) add('emphasis');
    if (lines.some((l) => BRACKET_RE.test(l))) add('bracket', 'in the question text');

    // (l) a routine line names a catalogued entry, and at most one fact line follows it
    if (routineName !== null) {
      if (catalogue && typeof catalogue.has === 'function' && !catalogue.has(normalizeName(routineName))) {
        add('routine', `"${normalizeName(routineName)}"`);
      }
      if (lines.length > 3) add('routine', '— a routine line is followed by at most one fact line');
      if (lines.length < 2) add('routine', '— a routine line is followed by the question sentence');
    }

    // (m) line length. The detail joins its parts without a comma, which the refusal's own list of
    // failed checks is split on.
    const overlong = lines
      .map((l, n) => ({ n: n + 1, length: visibleLength(l) }))
      .filter((l) => l.length > MAX_LINE_LENGTH);
    if (overlong.length > 0) {
      const runs = overlong.map((l, i) => `line ${l.n} runs ${l.length}${i === 0 ? ' characters' : ''}`);
      add('length', `— ${runs.join(' and ')} where the limit is ${MAX_LINE_LENGTH} — split the line into two or cut a fact`);
    }
  }

  // (c) EVERY question, not the call: an unlabelled second question is a question with no
  // recommendation — and the labelled one is the FIRST option, so the owner reads it first.
  //
  // Fail open per check: an array holding no option this gate can READ — plain strings, or an empty
  // array — is skipped, exactly as `options` under another name is. Only the array's TYPE was
  // checked before, so a payload whose options were strings failed a check never really evaluated.
  // (d) the clause belongs to ONE option's description, so a clause in the header or the question
  // text is wrong whatever the options look like — this half needs no readable option to decide.
  const boxElsewhere = [q.header, text];
  if (optionsLegible) {
    const flagged = options.filter((o) => RECOMMENDED_RE.test(String((o && o.label) || '')));
    if (flagged.length !== 1) add('recommended', `(${flagged.length} of 1)`);
    else if (flagged[0] !== options[0]) add('recommended', '— it is not listed first');
    // Checks (d) and (i) still need one option to read even when (c) just failed, so an ask that is
    // already wrong on the label gets its remaining reasons in the same refusal.
    const recommended = flagged.length === 1 ? flagged[0] : options[0];

    // (d) the confidence clause closes the recommended option's description, and sits nowhere else
    if (described) {
      const clause = typeof recommended.description === 'string' ? recommended.description : '';
      if (!CONFIDENCE_RE.test(clause.replace(/\s+$/, ''))) add('confidence');

      // (n) the description's sentences. Only the recommended description is cut, and at the
      // clause's LABEL rather than at a well-formed clause, so a malformed clause stays (d)'s refusal
      // alone. An unterminated remainder is a sentence: the catalogue's consequences carry no stop.
      const cap = routineName !== null ? 1 : 2;
      for (const [n, o] of readable.entries()) {
        if (typeof o.description !== 'string') continue;
        let body = o.description;
        if (o === recommended) {
          const at = body.search(/Confidence:(?![\s\S]*Confidence:)/i);
          if (at >= 0) body = body.slice(0, at);
        }
        body = body.trim();
        const count = terminators(body) + (body !== '' && !ENDS_SENTENCE_RE.test(body) ? 1 : 0);
        if (count > cap) add('description', `— option ${n + 1} carries ${count} sentences where the limit is ${cap}`);
      }
    }
    for (const o of readable) {
      boxElsewhere.push(o.label);
      if (o !== recommended) boxElsewhere.push(o.description);
    }

    // (i) inside an option, the one admitted bracket pair is the `(Recommended)` label
    for (const o of readable) {
      const label = o.label.replace(RECOMMENDED_RE, '');
      const description = typeof o.description === 'string' ? o.description : '';
      if (BRACKET_RE.test(label) || BRACKET_RE.test(description)) add('bracket', 'in an option');
    }
  }
  if (boxElsewhere.some((s) => typeof s === 'string' && CONFIDENCE_ANYWHERE_RE.test(s))) {
    add('confidence', '— it appears outside the recommended option\'s description');
  }

  // (e) Every surface the owner reads, the header included — it is owner-visible, so it is in.
  const surfaces = [text, q.header];
  for (const o of readable) surfaces.push(o.label, o.description);
  if (surfaces.some((s) => bareIds(s).length > 0)) add('id');

  // (f) and (g) the words. The catalogue name on a routine line is the one admitted listed word, so
  // that prefix is stripped from line 1 before the vocabulary scan — and only from it.
  if (words) {
    const scanned = lines.slice();
    if (routineName !== null) scanned[0] = scanned[0].slice(`${routineName}, routine: `.length);
    const wordSurfaces = [...scanned, q.header];
    for (const o of readable) wordSurfaces.push(o.label, o.description);
    const hit = firstHit(wordSurfaces, words.words);
    if (hit) add('word', `"${hit}"`);

    const pointerSurfaces = [...lines, q.header];
    for (const o of readable) pointerSurfaces.push(o.label, o.description);
    const phrase = firstHit(pointerSurfaces, words.pointers);
    if (phrase) add('pointer', `"${phrase}"`);
  }

  // (k) the header carries the decision in a few words — never an id, never the word that a routine
  // line is signalled by, which as a header would claim the whole ask is routine.
  if (typeof q.header === 'string') {
    const header = q.header.trim();
    if (bareIds(header).length > 0) add('header', '— it is an internal id');
    if (header.toLowerCase() === 'routine') add('header', '— it is the word routine');
  }

  // (l) `routine` marks a routine line and nothing else in the ask — including the rest of that
  // line, so only the `{name}, routine: ` prefix is exempt, never the run facts after it.
  const routineSurfaces = lines.slice();
  if (routineName !== null) {
    routineSurfaces[0] = routineSurfaces[0].slice(`${routineName}, routine: `.length);
  }
  for (const o of readable) routineSurfaces.push(o.label, o.description);
  if (routineSurfaces.some((s) => typeof s === 'string' && ROUTINE_WORD_RE.test(s))) {
    add('routine', '— the word routine appears outside a routine line');
  }

  return failed;
}

/** The first entry of `listed` found on any of these surfaces, in surface order then list order. */
function firstHit(surfaces, listed) {
  for (const s of surfaces) {
    const hit = matchListed(typeof s === 'string' ? s : '', listed);
    if (hit) return hit;
  }
  return null;
}

/**
 * The whole call's verdict, or null when it passes. Every failed check is reported together with
 * the FIRST failing question's header, so the author rewrites once rather than per round-trip.
 *
 * `checks` is the short tag (the audit log's `rule`); `detail` is the same set with per-call
 * specifics (the line that failed, the listed word, the unknown catalogue name) and rides the reason.
 */
function evaluate(questions, catalogue, lists) {
  const cat = catalogue === undefined ? readCatalogue() : catalogue;
  const words = lists === undefined ? shippedLists() : lists;
  const rows = questions.map((q) => ({
    header: String((q && q.header) || ''),
    failed: checkQuestion(q, cat, words),
  }));
  const all = rows.flatMap((r) => r.failed);
  if (questions.length > MAX_QUESTIONS) all.push({ key: 'cap', text: CHECK_NAMES.cap });
  if (all.length === 0) return null;

  const ordered = all.slice().sort((a, b) => CHECK_ORDER.indexOf(a.key) - CHECK_ORDER.indexOf(b.key));
  const join = (pick) => {
    const seen = new Set();
    return ordered.map(pick).filter((s) => (seen.has(s) ? false : seen.add(s))).join(', ');
  };
  const first = rows.find((r) => r.failed.length > 0);
  return {
    header: first ? first.header : String((questions[0] && questions[0].header) || ''),
    checks: join((f) => CHECK_NAMES[f.key]),
    detail: join((f) => f.text),
  };
}

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }
  if (!data || typeof data !== 'object') return allow();

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const background = Boolean(data.agent_type);

  // Ahead of `needsInspection` and of the role: a marked session is refused with no persona
  // registered and with no questions to read.
  if (String(data.tool_name || '') === TOOL && !background && readOwnerAway(data.session_id, root)) {
    return deny(AWAY_REASON);
  }
  if (!needsInspection(data)) return allow();

  const role = resolveRole(data.agent_type || readSessionPersona(data.session_id, root) || 'main');
  if (!KNOWN_ROLES.has(role)) return allow();

  const shipped = readAskWords();
  const lists = shipped
    ? { words: shipped.vocabulary, pointers: shipped.pointers, allow: readProjectAllowance(root) }
    : null;
  const verdict = evaluate(data.tool_input.questions, readCatalogue(), lists);
  if (!verdict) return allow();

  const reason = `${verdict.header ? `${verdict.header}: ` : ''}${verdict.detail} — ${REWORD_TAIL}`;

  if (background) {
    // `rule` stays the SHORT tag the log's four writers and the team lead's triage share; `reason`
    // is the sibling key carrying exactly what the foreground refusal would have said, so the
    // record and the refusal are the same text. `systemMessage` interpolates `rule`, never
    // `reason` — a spawned run must not pay the tail in context.
    const rule = `owner-ask: ${verdict.checks}`;
    logViolation(root, { agent: role, tool: TOOL, path: verdict.header, rule, reason });
    process.stdout.write(JSON.stringify({
      systemMessage: `Nexus owner-ask gate: ${role} ${TOOL} -> ${verdict.header} (${rule}). Logged to .claude/audit/violations.log.`,
    }));
    return process.exit(0);
  }
  return deny(reason);
}

// Same record shape as the log's existing writers (boundary-detector.js, read-tracker.js,
// prohibition-gate.js): the team lead greps this file, so a fourth writer inventing its own key
// names would fragment the triage.
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
      permissionDecisionReason: `Nexus owner-ask gate blocked: ${reason}`,
    },
  }));
  process.exit(0);
}

function allow() { process.exit(0); }

module.exports = {
  needsInspection, bareIds, checkQuestion, evaluate,
  PREFIXED_ID_RE, SLUG_ID_RE, LEDGER_ID_RE, WELL_KNOWN_PREFIXES,
  CHECK_NAMES, CHECK_ORDER, REWORD_TAIL, AWAY_REASON,
};

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => main(input));
}
