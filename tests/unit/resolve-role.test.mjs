// resolve-role.js — the shared agent_type -> canonical-role resolver used by verify-gate and
// boundary-detector. Fixes the ~27x cross-repo bug (kg P1 + sr item 1) where a suffixed/auto-suffixed
// spawn name (developer-2, developer-f6) escaped `.split(/[:/]/).pop()` and broke both name-keyed hooks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pluginRoot } from '../helpers.mjs';

const require = createRequire(import.meta.url);
const { resolveRole, KNOWN_ROLES } = require(join(pluginRoot('nexus'), 'hooks', 'scripts', 'lib', 'resolve-role.js'));

test('exact base roles pass through unchanged (incl. the hyphenated team-lead)', () => {
  for (const r of KNOWN_ROLES) assert.equal(resolveRole(r), r);
});

test('a namespace prefix is stripped (nexus:developer -> developer)', () => {
  assert.equal(resolveRole('nexus:developer'), 'developer');
  assert.equal(resolveRole('plugins/nexus/reviewer'), 'reviewer');
});

test('an auto-suffixed re-spawn resolves to its base role (developer-2 -> developer)', () => {
  assert.equal(resolveRole('developer-2'), 'developer');
  assert.equal(resolveRole('reviewer-3'), 'reviewer');
});

test('a custom spawn-name suffix resolves to its base role (developer-f6 -> developer)', () => {
  assert.equal(resolveRole('developer-f6'), 'developer');
  assert.equal(resolveRole('architect-rrc'), 'architect');
  assert.equal(resolveRole('nexus:developer-f6'), 'developer');
});

test('LANDMINE: team-lead never collapses to team', () => {
  assert.equal(resolveRole('team-lead'), 'team-lead');
  assert.equal(resolveRole('team-lead-2'), 'team-lead');
  assert.equal(resolveRole('nexus:team-lead-donecheck'), 'team-lead');
  assert.notEqual(resolveRole('team-lead'), 'team');
});

test('a genuinely unknown role stays unknown (no false base-role match)', () => {
  assert.equal(resolveRole('some-future-role'), 'some-future-role');
  assert.equal(resolveRole('team'), 'team');
  assert.equal(resolveRole(''), '');
  assert.equal(resolveRole(undefined), '');
});
