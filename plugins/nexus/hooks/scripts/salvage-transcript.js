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
 *
 * Output: the final SUBSTANTIVE assistant text, verbatim, on stdout. Lifecycle stubs
 * ("Ready when you are.", "Standing by.", ".") — the measured stranding shape — are skipped
 * from the tail. If nothing substantive exists, the last text is printed anyway with a
 * warning on stderr. Exit codes: 0 recovered, 1 transcript not found/empty, 2 usage.
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

const args = process.argv.slice(2);
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

// Final SUBSTANTIVE text: walk from the end, skipping lifecycle stubs (short single-liners —
// "Ready when you are.", "Standing by.", "."). Deliberately crude: a real deliverable is
// either long or multi-line; anything else is a stub not worth relaying.
const isStub = (t) => { const s = t.trim(); return s.length < 80 && !s.includes('\n'); };
let pick = null;
for (let i = texts.length - 1; i >= 0; i--) {
  if (!isStub(texts[i])) { pick = texts[i]; break; }
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
