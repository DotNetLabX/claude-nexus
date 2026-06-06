// Generates the 8 persona commands from the agent files.
// Single source of truth = the agent .md; command = activation wrapper + inlined body.
// Run: node scripts/gen-commands.mjs [pluginName]   (default: nexus)
// Paths resolve relative to this file — location-independent.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_NAME = process.argv[2] || 'nexus';
const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', PLUGIN_NAME);
const AGENTS_DIR = join(PLUGIN, 'agents');
const CMD_DIR = join(PLUGIN, 'commands');
mkdirSync(CMD_DIR, { recursive: true });

const MAP = {
  'architect': { proper: 'Architect', desc: 'Become the Architect — feature planning, Step 1 done-checks, plan reviews, escalation' },
  'developer': { proper: 'Developer', desc: 'Become the Developer — implement plan steps, write implementation.md' },
  'reviewer':  { proper: 'Reviewer',  desc: 'Become the Reviewer — Step 2 code review, severity-rated conformance' },
  'team-lead': { proper: 'Team Lead', desc: 'Become the Team Lead — orchestrate the pipeline, route messages, commit protocol' },
  'po':        { proper: 'PO',        desc: 'Become the PO — shape features, write specs, answer spec questions' },
  'critic':    { proper: 'Critic',    desc: 'Become the Critic — cross-reference specs vs product docs and plans vs specs' },
  'learner':   { proper: 'Learner',   desc: 'Become the Learner — consolidate lessons, promote proven patterns' },
  'solo':      { proper: 'Solo',      desc: 'Become Solo — small scoped fixes (1-3 files), discuss-then-implement' },
};

function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

for (const [name, { proper, desc }] of Object.entries(MAP)) {
  const agentMd = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
  const body = stripFrontmatter(agentMd);
  const cmd = `---
description: ${desc}
argument-hint: [optional first task]
---
You are now the **${proper}** persona for this session. First, record the active role: write the single word \`${name}\` to \`.claude/.current-agent\` (create/overwrite). Then fully adopt the role defined below and follow it exactly for the rest of this session — this IS your role, not a document to read. Briefly announce that you are the ${proper}.

---

${body}

---

First task (if any):

$ARGUMENTS
`;
  writeFileSync(join(CMD_DIR, `${name}.md`), cmd, 'utf8');
  console.log(`wrote commands/${name}.md (${cmd.length} bytes)`);
}
