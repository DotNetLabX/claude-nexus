// T1 — platform-contract smoke test (value-extract B3). Pins the Claude Code platform
// STRINGS the nexus hooks are built on, so a silent platform rename (tool name, matcher
// token, or input field) is caught LOUDLY here instead of false-greening a gate. ADR-24
// flagged exactly this risk: Gate A "hangs on the platform tool_name for a skill being
// `Skill`" — a rename would silently false-green it.
//
// This is a DRIFT TRIPWIRE, not a behavior test. It cannot know the platform renamed a
// string — but the moment anyone edits a hook (or a CC upgrade forces an edit), a missing
// token fails here with a pointer to the assumption that broke. The unit suites
// (skill-tracker / boundary-detector / persona) prove the hooks ACT on these tokens; this
// proves the tokens the PLATFORM owns haven't drifted out from under them. Two halves of
// each contract are pinned: the matcher in hooks.json (what the platform matches tool_name
// against) AND the source's internal use of the same string — a half-rename fails one half.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot } from '../helpers.mjs';

const HOOKS = join(pluginRoot('nexus'), 'hooks');
const src = (name) => readFileSync(join(HOOKS, 'scripts', name), 'utf8');
const hooksJson = readFileSync(join(HOOKS, 'hooks.json'), 'utf8');

// Each entry is ONE platform-contract assumption the nexus hooks depend on. If Claude Code
// renames the string, update BOTH the hook AND the matching check here — deliberately, so
// the diff records that a platform surface moved.
const CONTRACT = [
  {
    assumption: "a skill invocation surfaces as tool_name === 'Skill' with tool_input.skill (skill-tracker → Gate A)",
    checks: [
      ["skill-tracker.js references the 'Skill' tool name", () => /'Skill'/.test(src('skill-tracker.js'))],
      ["skill-tracker.js reads the name from tool_input.skill", () => /\.skill\b/.test(src('skill-tracker.js'))],
      ["hooks.json wires skill-tracker under a PostToolUse(Skill) matcher", () => /"matcher":\s*"Skill"/.test(hooksJson)],
    ],
  },
  {
    assumption: "subagent spawns surface as tool_name Agent|Task carrying tool_input.subagent_type (boundary-detector → ADR-21)",
    checks: [
      ["boundary-detector.js matches the Agent|Task tool names", () => /Agent\|Task/.test(src('boundary-detector.js'))],
      ["boundary-detector.js reads the spawned role from subagent_type", () => /subagent_type/.test(src('boundary-detector.js'))],
      ["hooks.json wires boundary-detector under a matcher including Agent|Task", () => /"matcher":\s*"[^"]*\bAgent\|Task\b[^"]*"/.test(hooksJson)],
    ],
  },
  {
    assumption: "the persona registry is .claude/.personas.json, write-triggered by .claude/.current-agent (register/restore)",
    checks: [
      ["register-persona.js writes the registry .personas.json", () => /\.personas\.json/.test(src('register-persona.js'))],
      ["register-persona.js triggers off the .current-agent write", () => /\.current-agent/.test(src('register-persona.js'))],
      ["restore-agent.js reads the registry .personas.json", () => /\.personas\.json/.test(src('restore-agent.js'))],
    ],
  },
];

for (const { assumption, checks } of CONTRACT) {
  for (const [label, holds] of checks) {
    test(`platform contract: ${label}`, () => {
      assert.ok(
        holds(),
        `Platform-contract drift: "${assumption}" — ${label} no longer holds. ` +
          `If Claude Code renamed this string, update the hook AND this assumption together.`
      );
    });
  }
}
