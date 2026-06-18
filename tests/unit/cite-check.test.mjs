// cite-check.mjs — the deterministic cite-or-drop gate the research skill runs
// before persisting a research entry (plan Step 3, the paired enforcement for the Step-2
// prompt obligation). Keyed on the research-entry-schema claim grammar (Step 1).
// Born as TDD reds.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { pluginRoot, run, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const CHECK = join(pluginRoot('nexus'), 'skills', 'research', 'scripts', 'cite-check.mjs');
const check = (...args) => run(process.execPath, [CHECK, ...args]);

function entryFile(name, contents) {
  const p = join(makeSandbox('cite-check-'), name);
  writeFileSync(p, contents, { encoding: 'utf8' });
  return p;
}

const SOURCED = `# topic

## Does the v4 client stream?

**Verdict:** Yes.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** the v4 API
**Status:** current
**Reconfirm trigger:** v5 release
**Corroboration:** 1 source

## Verdict
Yes — the v4 client streams.

## Finding
- The v4 client exposes a streaming read API [1].

## Sources
[1] https://example.com/docs/v4/streaming
`;

test('a claim with an [n] source resolving to ## Sources passes (exit 0)', () => {
  const f = entryFile('sourced.md', SOURCED);
  const res = check(f);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test('a claim with no source and no [no source found] fails (exit 1)', () => {
  const f = entryFile('uncited.md', SOURCED.replace(
    '- The v4 client exposes a streaming read API [1].',
    '- The v4 client exposes a streaming read API.'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /no source/i);
});

test('an explicit [no source found] claim passes (exit 0)', () => {
  const f = entryFile('nosource.md', SOURCED.replace(
    '- The v4 client exposes a streaming read API [1].',
    '- No public benchmark covers the 10k-row case [no source found].'
  ));
  const res = check(f);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test('a bare placeholder ## Sources entry fails (exit 1)', () => {
  const f = entryFile('placeholder.md', SOURCED.replace(
    '[1] https://example.com/docs/v4/streaming',
    '[1] TODO'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /placeholder/i);
});

test('a high-stakes verdict with a single source fails (exit 1)', () => {
  const f = entryFile('highstakes-single.md', SOURCED.replace(
    '**Corroboration:** 1 source',
    '**Corroboration:** high-stakes; 1 source (no second source found)'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /high-stakes/i);
});

test('a high-stakes verdict with a corroborating second source passes (exit 0)', () => {
  const f = entryFile('highstakes-second.md', SOURCED
    .replace(
      '**Corroboration:** 1 source',
      '**Corroboration:** high-stakes; 2 sources — a second independent source agreed'
    )
    .replace(
      '[1] https://example.com/docs/v4/streaming',
      '[1] https://example.com/docs/v4/streaming\n[2] https://other.example.com/v4-streaming'
    ));
  const res = check(f);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test('no argument prints usage and exits 2', () => {
  const res = check();
  assert.equal(res.status, 2);
  assert.match(res.stderr + res.stdout, /usage/i);
});

// ── claims under ## Fix and ## Alternatives (the other two claim sections) ─────
// SOURCED only exercises ## Finding; the grammar applies equally to ## Fix and ## Alternatives.
// Add a sourced ## Fix + ## Alternatives block (cited-pass) and its uncited variants (fail).
const FIX_AND_ALTS = `# topic

## Should we adopt the v4 client?

**Verdict:** Yes.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** the v4 API
**Status:** current
**Reconfirm trigger:** v5 release
**Corroboration:** 1 source

## Verdict
Yes — adopt the v4 client.

## Finding
- The v4 client exposes a streaming read API [1].

## Fix
- Switch the reader to the v4 streaming API [1].

## Alternatives
- Staying on v3 loses streaming and is in maintenance mode [2].

## Sources
[1] https://example.com/docs/v4/streaming
[2] https://example.com/docs/v3/eol
`;

test('cited claims under ## Fix and ## Alternatives pass (exit 0)', () => {
  const f = entryFile('fix-alts.md', FIX_AND_ALTS);
  const res = check(f);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test('an uncited claim under ## Fix fails (exit 1)', () => {
  const f = entryFile('fix-uncited.md', FIX_AND_ALTS.replace(
    '- Switch the reader to the v4 streaming API [1].',
    '- Switch the reader to the v4 streaming API.'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /## Fix.*no source/i);
});

test('an uncited claim under ## Alternatives fails (exit 1)', () => {
  const f = entryFile('alts-uncited.md', FIX_AND_ALTS.replace(
    '- Staying on v3 loses streaming and is in maintenance mode [2].',
    '- Staying on v3 loses streaming and is in maintenance mode.'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /## Alternatives.*no source/i);
});

// ── prose (non-bullet) claim line under a claim section ───────────────────────
// The schema mandates claims-as-bullets; a non-bullet claim line under a claim section is
// malformed and must fail (it must NOT silently bypass the check).
test('a prose (non-bullet) claim line under ## Finding fails (exit 1)', () => {
  const f = entryFile('prose-claim.md', SOURCED.replace(
    '- The v4 client exposes a streaming read API [1].',
    'The v4 client exposes a streaming read API [1].'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /non-bullet|prose/i);
});

// ── multi-digit reference [10] resolves correctly ─────────────────────────────
test('a multi-digit reference [10] resolving to ## Sources passes (exit 0)', () => {
  const f = entryFile('multidigit.md', SOURCED
    .replace(
      '- The v4 client exposes a streaming read API [1].',
      '- The v4 client exposes a streaming read API [10].'
    )
    .replace(
      '[1] https://example.com/docs/v4/streaming',
      '[10] https://example.com/docs/v4/streaming'
    ));
  const res = check(f);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

// ── out-of-range reference resolving to no ## Sources entry ───────────────────
test('a claim citing [9] with no matching ## Sources entry fails (exit 1)', () => {
  const f = entryFile('out-of-range.md', SOURCED.replace(
    '- The v4 client exposes a streaming read API [1].',
    '- The v4 client exposes a streaming read API [9].'
  ));
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /\[9\].*no ## Sources entry/i);
});

// ── each placeholder variant TODO / TBD / [source] is rejected ────────────────
for (const placeholder of ['TODO', 'TBD', '[source]']) {
  test(`a "${placeholder}" placeholder ## Sources entry fails (exit 1)`, () => {
    const f = entryFile(`placeholder-${placeholder.replace(/\W/g, '')}.md`, SOURCED.replace(
      '[1] https://example.com/docs/v4/streaming',
      `[1] ${placeholder}`
    ));
    const res = check(f);
    assert.equal(res.status, 1, res.stdout);
    assert.match(res.stdout, /placeholder/i);
  });
}

// ── cross-block source-inheritance / corroboration (fix #2) ───────────────────
// A topic file accumulates blocks (supersede-don't-delete). Source resolution and the
// corroboration floor must be PER-BLOCK: an earlier block must not inherit a later block's
// [n], and every block's Corroboration must be checked — not just the first.

// Block 1 cites [2]; only block 2 declares a Sources [2]. With file-global resolution this
// FALSELY passes (block 1 inherits block 2's [2]); per-block it must FAIL.
const CROSS_BLOCK_SOURCE = `# topic

## First question?

**Verdict:** A.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** scope A
**Status:** superseded
**Reconfirm trigger:** trigger A
**Corroboration:** 1 source

## Verdict
A.

## Finding
- A claim that cites a source only the next block defines [2].

## Sources
[1] https://example.com/a

---

## Second question?

**Verdict:** B.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** scope B
**Status:** current
**Reconfirm trigger:** trigger B
**Corroboration:** 1 source

## Verdict
B.

## Finding
- A second-block claim [2].

## Sources
[1] https://example.com/b
[2] https://example.com/b2
`;

test('a claim resolving only to a LATER block\'s ## Sources entry fails (per-block, exit 1)', () => {
  const f = entryFile('cross-block-source.md', CROSS_BLOCK_SOURCE);
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /\[2\].*no ## Sources entry/i);
});

// Block 2 is high-stakes single-source; block 1 is a benign current verdict. With a global
// first-match-only corroboration check this FALSELY passes (only block 1's Corroboration is
// read); per-block it must FAIL on block 2.
const CROSS_BLOCK_CORROBORATION = `# topic

## First question?

**Verdict:** A.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** scope A
**Status:** superseded
**Reconfirm trigger:** trigger A
**Corroboration:** 1 source

## Verdict
A.

## Finding
- A claim [1].

## Sources
[1] https://example.com/a

---

## Second question?

**Verdict:** B.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** scope B
**Status:** current
**Reconfirm trigger:** trigger B
**Corroboration:** high-stakes; 1 source (no second source found)

## Verdict
B.

## Finding
- A high-stakes claim [1].

## Sources
[1] https://example.com/b
`;

test('a LATER block\'s high-stakes single-source verdict fails (per-block corroboration, exit 1)', () => {
  const f = entryFile('cross-block-corr.md', CROSS_BLOCK_CORROBORATION);
  const res = check(f);
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stdout, /high-stakes/i);
});

// Positive control: a clean two-block file (each block self-consistent) passes — proves the
// per-block split does not introduce false failures on the legitimate multi-block steady state.
const CLEAN_TWO_BLOCK = `# topic

## First question?

**Verdict:** A.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** scope A
**Status:** superseded
**Reconfirm trigger:** trigger A
**Corroboration:** 1 source

## Verdict
A.

## Finding
- A claim [1].

## Sources
[1] https://example.com/a

---

## Second question?

**Verdict:** B.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** scope B
**Status:** current
**Reconfirm trigger:** trigger B
**Corroboration:** high-stakes; 2 sources — a second independent source agreed

## Verdict
B.

## Finding
- A high-stakes claim [1].
- Another claim with a different source [2].

## Sources
[1] https://example.com/b
[2] https://example.com/b2
`;

test('a clean two-block file (supersede steady state) passes (exit 0)', () => {
  const f = entryFile('clean-two-block.md', CLEAN_TWO_BLOCK);
  const res = check(f);
  assert.equal(res.status, 0, res.stdout + res.stderr);
});

test.after(() => cleanupSandboxes());
