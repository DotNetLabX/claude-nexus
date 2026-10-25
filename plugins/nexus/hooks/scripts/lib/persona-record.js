'use strict';
/**
 * The per-session persona registry, `.claude/.personas.json` under the hooks' root:
 *     { "<session_id>": { "agent", "plugin"?, "unattended"?, "transcript"?, "ts" }, ... }
 * written by register-persona.js, read and pruned by restore-agent.js. `agent` stays the bare role
 * name — other readers take that field alone.
 *
 * An entry lives while its session does: one with a transcript is pruned once that file is missing
 * or unchanged for 16 h, one without a transcript 16 h after its `ts`. A headless session sends one
 * prompt and then works for hours, so the age of its registration says nothing about whether it is
 * still running.
 *
 * Fail-soft by contract: an unreadable registry reads as empty, a failed write is dropped.
 */
const fs = require('fs');
const path = require('path');

const TTL_MS = 16 * 60 * 60 * 1000;

const registryFile = (root) => path.join(root, '.claude', '.personas.json');

function readRegistry(root) {
  try { return JSON.parse(fs.readFileSync(registryFile(root), 'utf8')) || {}; } catch { return {}; }
}

function isLive(entry, now = Date.now()) {
  if (!entry || typeof entry.ts !== 'number') return false;
  if (typeof entry.transcript === 'string' && entry.transcript) {
    try { return now - fs.statSync(entry.transcript).mtimeMs <= TTL_MS; } catch { return false; }
  }
  return now - entry.ts <= TTL_MS;
}

/** Drops every entry that is no longer live, in place; true when any was dropped. */
function prune(reg, now = Date.now()) {
  let changed = false;
  for (const k of Object.keys(reg)) if (!isLive(reg[k], now)) { delete reg[k]; changed = true; }
  return changed;
}

function writeRegistry(root, reg) {
  const file = registryFile(root);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(reg, null, 2));
    fs.renameSync(tmp, file);
  } catch { /* best-effort, never block */ }
}

module.exports = { TTL_MS, registryFile, readRegistry, isLive, prune, writeRegistry };
