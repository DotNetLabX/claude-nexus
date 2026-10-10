'use strict';
/**
 * Recognise a developer's mid-slice step checkpoint from a SubagentStop hand-back.
 *
 * A spawned developer hands back after every step with the exact line
 * `For team-lead: Step {n} done for {FeatureName}.` (developer.md § Your Message Handoffs). Both
 * SubagentStop hooks read it: verify-gate.js skips its commands there, handoff-tracker.js stamps
 * the step number on its handback record. One matcher, shared, so the two hooks can never disagree
 * about what a checkpoint is (the resolve-role precedent: a second copy is free to drift).
 *
 * The range's LAST hand-back is not a checkpoint: "ready for Step 1" (the plan's last
 * developer-built step) and "range complete" (a slice or declared developer's end) run the verify
 * set as always. Those two are matched case-insensitively and the step line case-sensitively, so
 * any doubt resolves to "not a checkpoint" — the gate then runs its commands, the fail-safe side.
 *
 * `{n}` is the plan's step id, so a lettered one (3a, 5b) matches too.
 *
 * Returns the step id as a string ("3", "5b"), or '' when the message is not a checkpoint.
 *
 * `isRangeEnd` answers the other half — is this the range's last hand-back? — for
 * handoff-tracker.js's per-developer state file, which sets the step to the range's last there.
 *
 * `handbackText` is what both hooks pass in: `last_assistant_message` plus, when the subagent
 * handed back through the platform's hand-back tool, that tool call's `message`. A developer that
 * reports through the tool puts `Step {n} done for …` in the tool's input, not in its final text,
 * so matching `last_assistant_message` alone missed every checkpoint (F166 run, 2026-09-29, 2.1.5):
 * the agents-list row stayed on the slice's first step and the verify gate took each checkpoint
 * for a full stop. The tool's message is read from the subagent's own transcript
 * (`agent_transcript_path`), last turn only — the scan walks back from the end and stops at the
 * turn's opening message, so an earlier turn's hand-back is never reused. Tail-read and bounded;
 * any failure returns `last_assistant_message` alone, the previous behaviour.
 */
const fs = require('fs');

const STEP_LINE = /\bStep (\d+[a-z]?) done for\b/;
const RANGE_END = /ready for Step 1|range complete/i;
const TAIL_BYTES = 1024 * 1024;

function stepCheckpoint(message) {
  const text = String(message || '');
  if (RANGE_END.test(text)) return '';
  const m = STEP_LINE.exec(text);
  return m ? m[1] : '';
}

function isRangeEnd(message) {
  return RANGE_END.test(String(message || ''));
}

function lastTurnHandback(transcriptPath) {
  if (!transcriptPath) return '';
  let fd;
  try {
    fd = fs.openSync(transcriptPath, 'r');
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    const lines = buf.toString('utf8').split('\n');
    if (len < size) lines.shift(); // the first line of a partial read is cut
    for (let i = lines.length - 1; i >= 0; i--) {
      let o;
      try { o = JSON.parse(lines[i]); } catch { continue; }
      const msg = o && o.message;
      if (!msg) continue;
      const content = msg.content;
      if (msg.role === 'user') {
        // A tool result belongs to the turn; any other user content opens it — stop there.
        const onlyResults = Array.isArray(content) && content.length > 0
          && content.every((b) => b && b.type === 'tool_result');
        if (!onlyResults) return '';
        continue;
      }
      if (msg.role !== 'assistant' || !Array.isArray(content)) continue;
      for (let j = content.length - 1; j >= 0; j--) {
        const b = content[j];
        if (b && b.type === 'tool_use' && /handback/i.test(String(b.name || ''))
          && b.input && typeof b.input.message === 'string') return b.input.message;
      }
    }
  } catch { /* fall back to the final text alone */ } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* ignore */ }
  }
  return '';
}

function handbackText(data) {
  const d = data || {};
  const last = String(d.last_assistant_message || '');
  const handback = lastTurnHandback(d.agent_transcript_path);
  return handback ? `${last}\n${handback}` : last;
}

module.exports = { stepCheckpoint, isRangeEnd, handbackText };
