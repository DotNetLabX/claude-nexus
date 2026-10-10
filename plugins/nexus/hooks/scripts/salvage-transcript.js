#!/usr/bin/env node
/**
 * Nexus salvage-transcript — recover a background subagent's stranded deliverable from its
 * platform-written transcript. NOT a hook: a CLI the spawner (usually the team lead) runs as
 * recovery leg 3 of 4 (artifact -> TaskOutput -> THIS -> re-ask last; re-ask is the measured
 * worst option, 0/2 when stranding was studied on 2026-06-10).
 *
 * The platform appends every spawned subagent's full run — every message and tool call — to
 * a JSONL transcript it owns. It is written by the platform, not by the model: it cannot
 * strand, cannot be forgotten, and is verbatim by construction. Reading it is a SCRIPT's job,
 * never a model's — piping a 300KB transcript through an agent burns tokens for nothing
 * (this plugin optimizes feature production AND token consumption).
 *
 * Usage:
 *   node salvage-transcript.js --file <transcript>   # the spawn result's output_file / agent-{id}.jsonl
 *   node salvage-transcript.js <agentId>             # best-effort search of known transcript roots
 *   add --final to force the pre-1.5.0 selection (final substantive text, whatever its shape)
 *
 * Output: the stranded DELIVERABLE, verbatim, on stdout. Lifecycle stubs ("Ready when you
 * are.", "Standing by.", ".") are skipped from the tail; remaining substantive texts are then
 * walked from the end, stripping lifecycle closers (short prose — <400 chars of non-fenced text
 * — that announces completion/handoff/nothing-further, optionally followed by a fenced
 * Reviewed:/Plan: block). Two measured shapes: the F16 single-line verbose closer ("Holding
 * for the go-ahead…") and the RT-2 multi-line fenced closer ("Complete.\n\n```\nReviewed:
 * …\n```" — even when multiple closers pile up and one exceeds 400 total chars, the non-fenced
 * prose is always <400). The last non-closer is the deliverable. If all substantives are
 * closers the last is returned as best-effort. --final bypasses all closer-stripping: the final
 * substantive text, whatever its shape. If nothing substantive exists, the last text is printed
 * anyway with a warning on stderr. Exit codes: 0 recovered, 1 transcript not found/empty,
 * 2 usage.
 *
 * The transcript locations are an UNVERSIONED platform surface — both known layouts are
 * searched; pass --file (the path the spawn result prints) when in doubt.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

function usage() {
  process.stderr.write('usage: node salvage-transcript.js --file <transcript.jsonl> | <agentId>\n');
  process.exit(2);
}

const argv = process.argv.slice(2);
const finalMode = argv.includes('--final');
const args = argv.filter((a) => a !== '--final');
if (args.length === 0) usage();

let file = null;
if (args[0] === '--file') {
  file = args[1];
  if (!file) usage();
} else {
  file = findByAgentId(args[0]);
  if (!file) {
    process.stderr.write(`salvage-transcript: no transcript found for agent "${args[0]}" in known roots — pass --file <path> (the spawn result prints it as output_file).\n`);
    process.exit(1);
  }
}

let raw;
try {
  raw = fs.readFileSync(file, 'utf8');
} catch {
  process.stderr.write(`salvage-transcript: transcript not found or unreadable: ${file}\n`);
  process.exit(1);
}

// Collect every assistant text block, in order. Tolerant of shape drift: accept records where
// type === 'assistant' OR message.role === 'assistant'; content as array-of-blocks or string.
const texts = [];
for (const line of raw.split('\n')) {
  if (!line.trim()) continue;
  let rec;
  try { rec = JSON.parse(line); } catch { continue; }
  const msg = rec && rec.message;
  if (!msg) continue;
  if (rec.type !== 'assistant' && msg.role !== 'assistant') continue;
  if (typeof msg.content === 'string') {
    if (msg.content.trim()) texts.push(msg.content);
    continue;
  }
  if (Array.isArray(msg.content)) {
    const t = msg.content.filter((b) => b && b.type === 'text' && b.text).map((b) => b.text).join('\n\n');
    if (t.trim()) texts.push(t);
  }
}

if (texts.length === 0) {
  process.stderr.write(`salvage-transcript: no assistant text in ${file}\n`);
  process.exit(1);
}

// Lifecycle stubs (short single-liners — "Ready when you are.", "Standing by.", ".") are
// never the deliverable. Among the remaining substantive texts, trailing lifecycle closers are
// stripped from the end until a non-closer is reached — that last non-closer is the
// deliverable. A "closer" is a block whose non-fenced prose is <400 chars AND contains
// lifecycle language (complete/done/nothing further/delivered above/handing back/etc.),
// optionally followed by a fenced ```Reviewed:```/```Plan:``` trailer. Two shapes measured
// live: F16 (single-line verbose closer >=80 chars) and RT-2 (multi-line fenced closer, one
// can reach 420 total chars while the non-fenced prose stays <344 chars). If ALL substantives
// are closers, the last one is returned as best-effort (better than nothing). --final bypasses
// closer-stripping: the final substantive text, whatever its shape (pre-1.5.0 behavior).
const isStub = (t) => { const s = t.trim(); return s.length < 80 && !s.includes('\n'); };
// Strip one or more trailing fenced blocks (``` ... ```) to isolate the prose body.
const stripFences = (t) => t.replace(/(\n\s*```[\s\S]*?```\s*)+$/, '').trim();
// Lifecycle-closer keyword pattern — must match the de-fenced prose.
const CLOSER_RE = /\b(complete|completed|done|finished|no further action|nothing further|nothing to add|nothing remaining|handing back|standing by|ready when you are|delivered above|delivered in full|is already delivered|is complete|my work is|my review is|that message is the deliverable|no remaining|nothing else|no action needed|work is done|task is done|review is done)\b/i;
const isCloser = (t) => { const prose = stripFences(t.trim()); return prose.length < 400 && CLOSER_RE.test(prose); };
const substantive = texts.filter((t) => !isStub(t));
let pick = null;
if (substantive.length > 0) {
  if (finalMode) {
    pick = substantive[substantive.length - 1];
  } else {
    // Walk backwards, stripping closers; stop at the first non-closer (the deliverable).
    let tail = substantive.length - 1;
    while (tail > 0 && isCloser(substantive[tail])) tail--;
    pick = substantive[tail];
  }
}
if (pick === null) {
  process.stderr.write('salvage-transcript: WARNING — no substantive text found; printing the last (stub) message.\n');
  pick = texts[texts.length - 1];
}
process.stdout.write(pick.trim() + '\n');
process.exit(0);

// Best-effort agentId search across the layouts observed so far (both verified live):
//   {tmpdir}/claude/{project-slug}/{run-id}/tasks/{agentId}.output
//   ~/.claude/projects/{project-slug}/{session-id}/subagents/agent-{agentId}.jsonl
// Newest match wins. The slug is the absolute project path with separators/colons/dots -> '-'.
function findByAgentId(agentId) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const slug = projectDir.replace(/[:\\/.]/g, '-');
  const roots = [
    path.join(os.tmpdir(), 'claude', slug),
    path.join(os.homedir(), '.claude', 'projects', slug),
  ];
  const names = [`${agentId}.output`, `agent-${agentId}.jsonl`];
  const hits = [];
  for (const root of roots) {
    let sessions = [];
    try { sessions = fs.readdirSync(root); } catch { continue; }
    for (const session of sessions) {
      for (const sub of ['tasks', 'subagents', '']) {
        for (const name of names) {
          const candidate = path.join(root, session, sub, name);
          try { hits.push({ candidate, mtime: fs.statSync(candidate).mtimeMs }); } catch { /* miss */ }
        }
      }
    }
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.mtime - a.mtime);
  return hits[0].candidate;
}
