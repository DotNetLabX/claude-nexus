// capability-contract.test.mjs — R3 / ADR-60: a deterministic drift gate between the
// mine-verify-cover method's 5-capability contract ("## The adapter contract" in its SKILL.md) and
// each of the four stack adapters' "## The 5 capabilities, filled for {stack}" table.
//
// D1 parsing contract (F6-MineMachineryHardening plan-time census):
//   - Heading: prefix match `^## The 5 capabilities, filled for ` (suffix varies per stack).
//   - Table parsed BY COLUMN POSITION (2nd column = the stack's fill); header text varies
//     (".NET fill" / "PHP fill" / "C/C++ fill" / "Dart/Flutter fill"); generic separator-row match.
//   - Per-capability fill rule: capabilities 2-5 need >=1 backticked token that is NOT a bare file
//     extension (`^\.\w+$`); capability 1 (Evidence indexer) ALSO accepts the recorded prose idiom
//     /reads the target .{0,40}directly/ (3 of 4 adapters legitimately fill it that way; only cpp
//     names a tool, `toolchain/index_slice.py`).
//   - Every cell must be non-empty and not a placeholder (-, TBD, TODO, n/a).
//
// The adversarial fixture (tests/fixtures/capability-contract/broken-adapter/SKILL.md) proves the
// checker CAN fail (the mine family's own vacuous-evidence rule: a gate that cannot fail is no gate).
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../helpers.mjs';

const METHOD_SKILL = join(REPO, 'plugins', 'nexus', 'skills', 'mine-verify-cover', 'SKILL.md');

// Extracts the 5 capability names from the method's "## The adapter contract" numbered list — never
// hardcoded, so a future re-wording of the method's own list is what the test tracks.
function methodCapabilities(text) {
  // Line-anchored: the file also carries an inline backtick CROSS-REFERENCE to this heading
  // ("see `## The adapter contract`'s ...") earlier in the body — that is prose, not the heading
  // itself, so a plain indexOf/substring search would latch onto the wrong (earlier) section.
  const headingMatch = text.match(/^## The adapter contract\b.*$/m);
  if (!headingMatch) throw new Error('method SKILL.md: "## The adapter contract" heading not found');
  const section = text.slice(headingMatch.index);
  const names = [];
  const re = /^\d+\.\s+\*\*(.+?)\*\*/gm;
  let m;
  while ((m = re.exec(section)) && names.length < 5) names.push(m[1]);
  return names;
}

// ==================================================================================================
// Slice 1: the method contract names exactly 5 capabilities, in the recorded order.
// ==================================================================================================
test('the method contract names exactly 5 capabilities, in order', () => {
  const caps = methodCapabilities(readFileSync(METHOD_SKILL, 'utf8'));
  assert.deepEqual(caps, [
    'Evidence indexer',
    'Test runner',
    'Mutation tool',
    'Test-style contract',
    'Prod-source-diff scoping',
  ]);
});

// ==================================================================================================
// Adapter table parsing (D1) + per-capability fill check.
// ==================================================================================================
const ADAPTERS = [
  { plugin: 'nexus-dotnet', skill: 'mine-verify-cover-dotnet' },
  { plugin: 'nexus-php', skill: 'mine-verify-cover-php' },
  { plugin: 'nexus-cpp', skill: 'mine-verify-cover-cpp' },
  { plugin: 'nexus-flutter', skill: 'mine-verify-cover-flutter' },
].map((a) => ({ ...a, path: join(REPO, 'plugins', a.plugin, 'skills', a.skill, 'SKILL.md') }));

// Locates the adapter's "## The 5 capabilities, filled for ..." table and returns a
// { capabilityName -> fillText } map, parsed BY COLUMN POSITION (2nd column), tolerant of the
// varying header text ((.NET fill / PHP fill / C/C++ fill / Dart/Flutter fill).
function adapterFillTable(text) {
  const headingMatch = text.match(/^## The 5 capabilities, filled for .*$/m);
  if (!headingMatch) throw new Error('adapter SKILL.md: "## The 5 capabilities, filled for " heading not found');
  const rest = text.slice(headingMatch.index + headingMatch[0].length);
  const lines = rest.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (!lines[i] || !lines[i].trim().startsWith('|')) throw new Error('adapter table: header row not found');
  i++; // header row
  if (!lines[i] || !/^\|[\s:-]+\|/.test(lines[i].trim())) throw new Error('adapter table: separator row not found');
  i++; // separator row
  const table = {};
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const cells = lines[i].split('|').map((c) => c.trim());
    // split('|') on "| a | b |" -> ['', ' a ', ' b ', ''] — drop the leading/trailing empty cells.
    const cols = cells.slice(1, -1);
    if (cols.length >= 2) table[cols[0]] = cols[1];
    i++;
  }
  return table;
}

const EXT_ONLY = /^\.\w+$/;
const EVIDENCE_IDIOM = /reads the target .{0,40}directly/;
const PLACEHOLDERS = new Set(['—', '-', 'TBD', 'TODO', 'n/a', 'N/A']);

// A backtick-delimited token in the cell that is not a bare file extension (e.g. `.cs`, `.dart`).
function hasQualifyingBacktickToken(cell) {
  const tokens = [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  return tokens.some((t) => !EXT_ONLY.test(t));
}

// Returns null when the cell conforms, or a one-line reason string when it doesn't.
function checkFill(capabilityName, cell) {
  if (!cell || PLACEHOLDERS.has(cell.trim())) return 'empty or placeholder cell';
  const isEvidenceIndexer = /evidence indexer/i.test(capabilityName);
  if (isEvidenceIndexer && EVIDENCE_IDIOM.test(cell)) return null;
  if (hasQualifyingBacktickToken(cell)) return null;
  return 'no qualifying backticked executor (and no accepted prose idiom)';
}

// Checks every method capability against the adapter's table; returns a list of problem strings
// (empty = fully conformant).
function conforms(methodCaps, table) {
  const problems = [];
  for (const cap of methodCaps) {
    const cell = table[cap];
    if (cell === undefined) { problems.push(`${cap}: missing row`); continue; }
    const reason = checkFill(cap, cell);
    if (reason) problems.push(`${cap}: ${reason}`);
  }
  return problems;
}

// ==================================================================================================
// Slice 2: each of the 4 real on-disk adapters fills all 5 capabilities with a named executor.
// ==================================================================================================
for (const { skill, path } of ADAPTERS) {
  test(`${skill} fills all 5 capabilities with a named executor (D1)`, () => {
    const methodCaps = methodCapabilities(readFileSync(METHOD_SKILL, 'utf8'));
    const table = adapterFillTable(readFileSync(path, 'utf8'));
    const problems = conforms(methodCaps, table);
    assert.deepEqual(problems, [], problems.join('; '));
  });
}

// ==================================================================================================
// Slice 3: the adversarial fixture (one missing executor) FAILS the check — the can-fail proof
// (the mine family's own vacuous-evidence rule: a gate that cannot fail is no gate).
// ==================================================================================================
test('the broken-adapter fixture (one missing executor) FAILS the check', () => {
  const methodCaps = methodCapabilities(readFileSync(METHOD_SKILL, 'utf8'));
  const fixturePath = join(REPO, 'tests', 'fixtures', 'capability-contract', 'broken-adapter', 'SKILL.md');
  const table = adapterFillTable(readFileSync(fixturePath, 'utf8'));
  const problems = conforms(methodCaps, table);
  assert.equal(problems.length, 1, `expected exactly one broken capability, got: ${problems.join('; ')}`);
  assert.match(problems[0], /^Mutation tool:/, 'the broken capability is Mutation tool (the fixture\'s deliberate gap)');
});
