'use strict';
/**
 * A fix round's block in implementation.md and its class-check line, read the one way: by the fix-record check
 * (fix-record-gate.js) at a developer's stop, and by any script that checks a fix round after the fact.
 *
 * The block runs from the round's `## {round}` heading — the last one, where the heading repeats — to the next
 * `## ` heading; `Fix Round 1` never matches `## Fix Round 10`. CRLF files read the same. The class-check line is
 * `**Class checked:**` with text after it, bare or as a list item.
 */
const CLASS_LINE = /^\s*(?:[-*]\s+)?\*\*Class checked:\*\*\s*\S/;

/** The round's block as lines, or null when it has none. */
function roundBlock(text, round) {
  const lines = String(text).split(/\r?\n/);
  const heading = new RegExp(`^## ${round}(?!\\d)`);
  let start = -1;
  for (let i = 0; i < lines.length; i++) if (heading.test(lines[i])) start = i;
  if (start < 0) return null;
  const block = [];
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) block.push(lines[i]);
  return block;
}

const hasClassLine = (block) => Array.isArray(block) && block.some((l) => CLASS_LINE.test(l));

module.exports = { roundBlock, hasClassLine };
