// evidence-gate.test.mjs — F7 S1.3: the registry-write structural evidence predicate (TDD, ADR-60).
//
// ADR-60 adversarial must-fail: a gate that never rejects proves nothing. This suite drives the three
// binding rejection modes with must-fail fixtures — (a) claim-echo REJECTED, (b) empty/whitespace
// REJECTED, (c) a genuine re-execution excerpt PASSES — plus the mechanical-heuristic boundary.
import test from 'node:test';
import assert from 'node:assert/strict';
import { structuralEvidenceOk } from '../../plugins/nexus/skills/mine-verify-cover/tools/evidence-gate.mjs';
// The dev-repo shim must resolve to the SAME predicate (import-path parity).
import { structuralEvidenceOk as viaShim } from '../../harness/lib/evidence-gate.mjs';

const CLAIM = 'BR11: a zero-SP sprint resets the developer streak to zero';

// --- (a) claim-echo REJECTED (ADR-60 must-fail) --------------------------------------------------
test('(a) claim-echo REJECTED — evidence that merely restates the claim', () => {
  const echo = 'a zero-SP sprint resets the developer streak to zero'; // the claim, reworded/trimmed, no re-exec
  const res = structuralEvidenceOk(echo, CLAIM);
  assert.equal(res.pass, false, 'a claim-echo must never verify');
  assert.equal(res.reason, 'claim-echo');
});

test('(a2) evidence IDENTICAL to the claim is a claim-echo', () => {
  const res = structuralEvidenceOk(CLAIM, CLAIM);
  assert.equal(res.pass, false);
  assert.equal(res.reason, 'claim-echo');
});

// --- (b) empty / whitespace REJECTED (ADR-60 must-fail) ------------------------------------------
test('(b) empty and whitespace-only evidence REJECTED', () => {
  for (const bad of [undefined, null, '', '   ', '\n\t ']) {
    const res = structuralEvidenceOk(bad, CLAIM);
    assert.equal(res.pass, false, `evidence ${JSON.stringify(bad)} must be rejected`);
    assert.equal(res.reason, 'empty');
  }
});

// --- (c) a genuine re-execution excerpt PASSES --------------------------------------------------
test('(c) a genuine re-execution excerpt PASSES', () => {
  const good = 'L268 `if (completedSp == 0) break;` — ran the BR11 slice, streak output stayed 3 (not reset)';
  const res = structuralEvidenceOk(good, CLAIM);
  assert.equal(res.pass, true, 'evidence with a line ref + quoted output + a comparison marker verifies');
  assert.equal(res.reason, 'ok');
  assert.equal(res.detail.hasLineRef, true);
});

test('(c2) evidence with an output marker but no line ref still PASSES (re-exec artifact present)', () => {
  const res = structuralEvidenceOk('ran the slice — the guard returns 0 when completedSp is 0', CLAIM);
  assert.equal(res.pass, true);
  assert.equal(res.reason, 'ok');
});

// --- no-reexecution-content REJECTED (the third binding mode) ------------------------------------
test('no-reexecution-content REJECTED — plausible prose with no line ref and no output artifact', () => {
  const res = structuralEvidenceOk('the developer streak is handled correctly by the analyzer', CLAIM);
  assert.equal(res.pass, false);
  assert.equal(res.reason, 'no-reexecution-content');
});

test('the toy "ok" evidence is rejected as no-reexecution-content', () => {
  const res = structuralEvidenceOk('ok', CLAIM);
  assert.equal(res.pass, false);
  assert.equal(res.reason, 'no-reexecution-content');
});

// --- claim omitted: only empty + no-reexecution apply (echo check skipped) -----------------------
test('with no claim supplied, a re-exec excerpt still PASSES and the echo check is skipped', () => {
  assert.equal(structuralEvidenceOk('L42 => returned 0m', '').pass, true);
  assert.equal(structuralEvidenceOk('', '').reason, 'empty');
  assert.equal(structuralEvidenceOk('plain prose no markers', '').reason, 'no-reexecution-content');
});

// --- shim parity ---------------------------------------------------------------------------------
test('the dev-repo shim re-exports the identical predicate', () => {
  const good = 'L100 `x == y` output true';
  assert.deepEqual(viaShim(good, CLAIM), structuralEvidenceOk(good, CLAIM));
  assert.equal(viaShim('', CLAIM).reason, 'empty');
});

// --- kb-write chokepoint: gateRuleEvidence strips ungated evidence before serialization ----------
import { gateRuleEvidence } from '../../harness/lib/kb-write.mjs';

test('gateRuleEvidence (KB seam) strips echo/empty/no-reexec evidence, keeps genuine, is non-destructive otherwise', () => {
  const rules = [
    { id: 'R1', statement: 'a zero-SP sprint resets the streak', evidence: 'a zero-SP sprint resets the streak' }, // echo
    { id: 'R2', statement: 'the divide guard', evidence: 'ok' }, // no-reexec
    { id: 'R3', statement: 'ratio math', evidence: 'L145 `return bugSp/total` output 0.5 for 2/4' }, // genuine
    { id: 'R4', statement: 'transcribed', kind: 'transcribed' }, // no evidence at all
  ];
  const { gatedRules, dropped } = gateRuleEvidence(rules);
  assert.deepEqual(dropped.map((d) => `${d.id}:${d.reason}`), ['R1:claim-echo', 'R2:no-reexecution-content']);
  assert.equal(gatedRules.find((r) => r.id === 'R1').evidence, undefined, 'echo evidence stripped');
  assert.equal(gatedRules.find((r) => r.id === 'R3').evidence, 'L145 `return bugSp/total` output 0.5 for 2/4', 'genuine kept');
  assert.equal(gatedRules.find((r) => r.id === 'R3').statement, 'ratio math', 'the rest of the rule is untouched');
  assert.equal(gatedRules.find((r) => r.id === 'R4').kind, 'transcribed', 'evidence-less rule passes through unchanged');
});

// --- registry chokepoint: gateRegistryEvidence surfaces (never rewrites) failing code attestations ---
import { gateRegistryEvidence } from '../../harness/lib/rules-registry.mjs';

test('gateRegistryEvidence (C1 writer) SURFACES rows whose codeAttestation fails, skips spec-only rows', () => {
  const rows = [
    { canonicalName: 'GoodRow', evidencePair: { specCitation: 'spec says >0', codeAttestation: 'BugRatioAnalyzer.cs:42 returns 0m' } },
    { canonicalName: 'BadRow', evidencePair: { specCitation: 'spec says X', codeAttestation: 'y' } }, // no re-exec
    { canonicalName: 'SpecOnly', evidencePair: { specCitation: 'spec only' } }, // no code attestation → skipped
    { canonicalName: 'Plain' }, // no evidence pair → skipped
  ];
  const { findings } = gateRegistryEvidence(rows);
  assert.deepEqual(findings, [{ canonicalName: 'BadRow', reason: 'no-reexecution-content' }],
    'only the row with a structurally-invalid code attestation is surfaced; rows are never mutated');
});
