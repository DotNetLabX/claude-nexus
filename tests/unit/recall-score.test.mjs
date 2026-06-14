// T2 — recall-score.mjs (harness Inc 1, Step 3): the deterministic recall-scoring helper.
//
// Design §3 (orchestrator-scores-only) + architect Q3 enforcement: the HELPER is a pure pairing fn
// + recall computation FROM A SUPPLIED VERDICT MAP. The semantic match verdict is a scoped LLM judge
// call made orchestrator-side at Step 4 — it is deliberately NOT exercised here. This suite uses a
// FIXTURE verdict map only, so the unit-tested contract is fully deterministic (no LLM in the test),
// and the golden TEXT used here is an inline fixture, never the real sequestered golden-set.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPairingPacket, computeRecall, parseGoldenSubset } from '../../harness/lib/recall-score.mjs';

// --- Fixtures -------------------------------------------------------------------------------------
// A tiny stand-in for the golden subset (id + substance). NOT the real golden set.
const GOLDEN = [
  { id: 'GOLD-16', rule: 'Bug classification = IssueType == "Bug", exact case-sensitive match' },
  { id: 'GOLD-17', rule: 'Multi-sprint bug ratio = ratio of totals, NOT average of per-sprint ratios' },
  { id: 'GOLD-18', rule: 'Bug-ratio alert: ratio >= threshold for N consecutive sprints; 0-completed-SP breaks the streak' },
];

// A stand-in for the Workflow's consensus output (id + statement).
const CONSENSUS = [
  { id: 'BR-1', statement: 'A ticket is a bug iff IssueType equals "Bug" with case-sensitive comparison' },
  { id: 'BR-2', statement: 'Bug ratio over sprints sums bug SP and completed SP then divides (ratio of totals)' },
  { id: 'BR-3', statement: 'The alert fires when the ratio meets the threshold across N recent consecutive sprints' },
  { id: 'BR-4', statement: 'A sprint with zero completed SP resets the consecutive-streak counter' },
  { id: 'BR-5', statement: 'Some unrelated rounding rule that matches no golden item' },
];

// --- buildPairingPacket: deterministic pairing for the semantic judge -----------------------------
test('buildPairingPacket pairs every golden rule with all consensus candidates inline', () => {
  const packet = buildPairingPacket(GOLDEN, CONSENSUS);
  assert.ok(Array.isArray(packet.pairs), 'packet exposes a pairs array');
  assert.equal(packet.pairs.length, GOLDEN.length, 'one pair entry per golden rule');

  const g16 = packet.pairs.find((p) => p.goldenId === 'GOLD-16');
  assert.ok(g16, 'GOLD-16 present in the packet');
  assert.equal(g16.goldenRule, GOLDEN[0].rule, 'golden substance carried inline (judge needs it)');
  // Deterministic pairing = every consensus candidate is offered to the judge per golden rule;
  // the SEMANTIC narrowing is the judge's job, not the helper's.
  assert.equal(g16.candidates.length, CONSENSUS.length, 'all consensus candidates offered to the judge');
  assert.deepEqual(
    g16.candidates.map((c) => c.id).sort(),
    CONSENSUS.map((c) => c.id).sort(),
    'candidates carry consensus ids',
  );
  assert.ok(
    g16.candidates.every((c) => typeof c.statement === 'string' && c.statement.length > 0),
    'each candidate carries its statement inline for the judge',
  );
});

test('buildPairingPacket with empty consensus returns pairs with empty candidates (no crash)', () => {
  const packet = buildPairingPacket(GOLDEN, []);
  assert.equal(packet.pairs.length, GOLDEN.length, 'still one pair entry per golden rule');
  assert.ok(
    packet.pairs.every((p) => Array.isArray(p.candidates) && p.candidates.length === 0),
    'each golden rule has an empty candidates array when consensus is empty',
  );
});

// --- computeRecall: recall from a SUPPLIED verdict map (no LLM) ------------------------------------
test('computeRecall reports 3/3 when the verdict map matches every golden id', () => {
  const verdictMap = {
    'GOLD-16': { matched: true, consensusId: 'BR-1' },
    'GOLD-17': { matched: true, consensusId: 'BR-2' },
    'GOLD-18': { matched: true, consensusId: 'BR-3' },
  };
  const res = computeRecall(GOLDEN, verdictMap);
  assert.equal(res.total, 3);
  assert.equal(res.matchedCount, 3);
  assert.equal(res.recall, 1, 'recall = matched/total = 3/3 = 1');
  assert.deepEqual(res.matched.sort(), ['GOLD-16', 'GOLD-17', 'GOLD-18']);
  assert.deepEqual(res.unmatched, [], 'nothing unmatched');
  assert.deepEqual(
    res.matchedPairs,
    [
      { goldenId: 'GOLD-16', consensusId: 'BR-1' },
      { goldenId: 'GOLD-17', consensusId: 'BR-2' },
      { goldenId: 'GOLD-18', consensusId: 'BR-3' },
    ],
    'matchedPairs carries the golden→consensus id mapping in golden-subset order',
  );
});

test('computeRecall reports partial recall and lists the misses', () => {
  const verdictMap = {
    'GOLD-16': { matched: true, consensusId: 'BR-1' },
    'GOLD-17': { matched: false },
    'GOLD-18': { matched: true, consensusId: 'BR-3' },
  };
  const res = computeRecall(GOLDEN, verdictMap);
  assert.equal(res.total, 3);
  assert.equal(res.matchedCount, 2);
  assert.equal(res.recall, 2 / 3);
  assert.deepEqual(res.unmatched, ['GOLD-17'], 'the miss is named');
});

test('computeRecall treats a golden id absent from the verdict map as unmatched (not a crash)', () => {
  // The judge only returned verdicts for two of the three golden ids.
  const verdictMap = {
    'GOLD-16': { matched: true, consensusId: 'BR-1' },
    'GOLD-18': { matched: true, consensusId: 'BR-3' },
  };
  const res = computeRecall(GOLDEN, verdictMap);
  assert.equal(res.total, 3, 'total is driven by the golden subset, not the verdict map');
  assert.equal(res.matchedCount, 2);
  assert.deepEqual(res.unmatched, ['GOLD-17'], 'a golden id with no verdict counts as a miss');
});

// --- parseGoldenSubset: extract requested ids from the golden-set.md table -------------------------
// Orchestrator-side ONLY (the helper reads golden text; a miner/verifier never does). Fixture text
// mirrors the real golden-set.md table SHAPE — it is not the real file.
const GOLDEN_MD = `# Golden Set — FROZEN

## The 20 rules

| ID | Rule | Intent attestation | Code attestation |
|----|------|--------------------|------------------|
| GOLD-15 | Zombie ticket = 3+ distinct sprint memberships | kb/carry-over.md | CarryOverCalculator.cs:428 |
| GOLD-16 | Bug classification = IssueType == "Bug", exact case-sensitive match; else feature | kb/ticket.md | BugRatioCalculator.cs:334 |
| GOLD-17 | Multi-sprint bug ratio = ratio of totals, NOT average of per-sprint ratios | kb/bug-ratio.md | BugRatioCalculator.cs:48-49 |
| GOLD-18 | Bug-ratio alert: ratio >= threshold for N consecutive sprints; 0-completed-SP breaks streak | kb/bug-ratio.md | BugRatioCalculator.cs:255-282 |
`;

test('parseGoldenSubset extracts exactly the requested ids with their rule substance', () => {
  const subset = parseGoldenSubset(GOLDEN_MD, ['GOLD-16', 'GOLD-17', 'GOLD-18']);
  assert.equal(subset.length, 3, 'only the requested ids, not all rows');
  assert.deepEqual(subset.map((r) => r.id), ['GOLD-16', 'GOLD-17', 'GOLD-18']);
  const g17 = subset.find((r) => r.id === 'GOLD-17');
  assert.match(g17.rule, /ratio of totals/, 'rule substance captured from the table cell');
  assert.ok(!subset.some((r) => r.id === 'GOLD-15'), 'unrequested rows excluded');
});

test('parseGoldenSubset throws if a requested golden id is missing (fail loud, never silently drop)', () => {
  assert.throws(
    () => parseGoldenSubset(GOLDEN_MD, ['GOLD-16', 'GOLD-99']),
    /GOLD-99/,
    'a missing id must surface — a silently dropped golden rule would inflate recall',
  );
});
