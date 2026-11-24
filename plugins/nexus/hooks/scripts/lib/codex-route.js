'use strict';

/**
 * The route a Codex job outside the pipeline seats takes: `direct` (a read-only box) or `plugin`.
 *
 * THE SWITCH: the repo's `features.codexDirect` (`.claude/nexus-agents.json`) decides where it is a JSON boolean, so a
 * repo `false` keeps the plugin route whatever the profile says. Where the repo leaves it unset — no file, a file
 * that does not parse, no key, or a value that is not a boolean — the profile's top-level `codexDirect`
 * (lib/model-presets.js `readProfile`) decides, on only when it is JSON `true`. Every "off" answer carries SWITCH_OFF.
 *
 * TEST SEAM (lib/codex-entry.js `testSeam`): under the test runner the profile is read only where
 * NEXUS_CODEX_PROFILE_READ is `1`, so a test's sandbox repo never picks up the machine's own profile. A child
 * started without NODE_TEST_CONTEXT is no test to any seam, and reads the profile as a session does.
 */

const fs = require('fs');
const path = require('path');
const seatBox = require('./seat-box');
const { readProfile } = require('./model-presets');
const { testSeam } = require('./codex-entry');

const SWITCH_OFF = "codexDirect is off (the repo's features.codexDirect, else the profile's codexDirect)";
const BOM = String.fromCharCode(0xfeff);

function repoSwitch(root) {
  try {
    const text = fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8');
    return JSON.parse(text.startsWith(BOM) ? text.slice(1) : text)?.features?.codexDirect;
  } catch {
    return undefined;
  }
}

function profileSwitch(env) {
  if (env.NODE_TEST_CONTEXT && testSeam('NEXUS_CODEX_PROFILE_READ', env) !== '1') return false;
  return readProfile(env).codexDirect === true;
}

function codexRoute(root, env = process.env) {
  const repo = repoSwitch(root);
  const on = typeof repo === 'boolean' ? repo : profileSwitch(env);
  if (!on) return { route: 'plugin', why: SWITCH_OFF };
  const { unavailable } = seatBox.available({ env });
  return unavailable ? { route: 'plugin', why: unavailable } : { route: 'direct', why: null };
}

module.exports = { codexRoute, SWITCH_OFF };
