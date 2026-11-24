'use strict';
/**
 * The repo's full-suite switch: `features.fullSuite` in the session root's `.claude/nexus-agents.json`.
 *
 * On only at the JSON `true`. A missing file, section or key, a malformed file, or any other value — `"true"`,
 * `1` — reads off. Off, no pipeline stage starts or requires a complete run: the summary gate's check (4) asks
 * for none, close-run.js starts none and owes no full run after the merge, and a gear's run beside the
 * reviewers is not made. `main-run.js` stays runnable by hand either way.
 *
 * The root is CALLER-RESOLVED and passed in, as every `features.*` reader takes it.
 */
const fs = require('fs');
const path = require('path');

function fullSuiteOn(root) {
  if (!root) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8'));
    return !!cfg && typeof cfg.features === 'object' && cfg.features !== null && cfg.features.fullSuite === true;
  } catch {
    return false;
  }
}

module.exports = { fullSuiteOn };
