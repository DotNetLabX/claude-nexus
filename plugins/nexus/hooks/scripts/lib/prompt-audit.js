'use strict';
/**
 * Pure helpers for the SessionStart prompt-audit tripwire (ADR-84).
 *
 * ADR-83's re-check of the default Claude Code prompt is operator-owed on a calendar; F58 makes
 * NOTICING event-driven by comparing the running CC version against the audit doc's pin. All I/O
 * (existsSync, readFileSync, `claude --version`) stays in inject-rules.js so everything decidable
 * is reachable by tests — the hook is fail-open glue, and glue is where tests cannot follow.
 *
 * Every function here returns null/false on input it cannot understand rather than throwing: a
 * silent no-op is the tripwire's DESIGNED failure mode (a nag that breaks rule injection would be
 * strictly worse than a missed nag).
 */

const SEMVERISH = /^\d+\.\d+\.\d+$/;

/**
 * The `Last-audited-cc: X.Y.Z` pin from the audit doc's Re-check protocol, or null.
 * Anchored to the start of a line on purpose: the same section explains the pin in running prose,
 * so an unanchored match would let the doc parse a pin out of its own explanation.
 */
function parsePin(auditDocText) {
  const m = String(auditDocText).match(/^Last-audited-cc: (\d+\.\d+\.\d+)/m);
  return m ? m[1] : null;
}

/**
 * The first X.Y.Z in `claude --version` output, or null. The banner shape is UNDOCUMENTED
 * (ADR-84) — today it is `2.1.225 (Claude Code)`, so scan for the pattern anywhere in the string
 * rather than assuming a position, and treat anything without one as "no version".
 */
function parseVersion(cliOutput) {
  const m = String(cliOutput).match(/\d+\.\d+\.\d+/);
  return m ? m[0] : null;
}

/**
 * True only when `running` is STRICTLY newer than `pinned`, compared numerically per segment
 * (a lexical compare reads 2.10.0 as older than 2.9.9). Equal versions and a pin ahead of the
 * running CLI both return false — the nag is a strictly-newer trigger, so a pin at or above the
 * running version silently disables it by design (ADR-84 Tradeoffs).
 */
function isNewer(running, pinned) {
  // Shape-check BOTH inputs before comparing: either can be null (an unparseable banner, a doc with
  // no pin), and a four-segment or lettered version would otherwise compare on its first three.
  if (!SEMVERISH.test(String(running)) || !SEMVERISH.test(String(pinned))) return false;
  const a = String(running).split('.').map(Number);
  const b = String(pinned).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false; // equal
}

/**
 * The context-block section the hook appends when the tripwire fires. Returned WITH its leading
 * blank lines and `--- … ---` banner so it matches the sibling sections and the hook stays a
 * one-line append. It is self-describing prose on purpose: the reader is whatever agent the
 * session starts, and no agent file teaches it this nag (ADR-84 / plan Decisions).
 */
function nagText(running, pinned, auditDocPath) {
  return (
    `\n\n--- prompt-audit tripwire (ADR-84) ---\n` +
    `Claude Code ${running} is newer than the audit pin (${pinned}).\n` +
    `Tell the user ${auditDocPath} § Re-check protocol is due; run it on request,\n` +
    `then set that doc's Last-audited-cc pin to ${running}.\n`
  );
}

module.exports = { parsePin, parseVersion, isNewer, nagText };
