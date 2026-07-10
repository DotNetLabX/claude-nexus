// Generates one persona command per agent file, for any plugin that ships an agents/ dir.
// Single source of truth = the agent .md; command = activation wrapper + inlined body.
// Run: node scripts/gen-commands.mjs [pluginName]   (default: nexus)
// Paths resolve relative to this file — location-independent.
//
// Frontmatter is INTENTIONALLY dropped (audit B4): agent `model`/`effort`/`skills` apply when the
// agent is SPAWNED (Task/Agent tool honors agent frontmatter); a persona command runs in the user's
// interactive session and must inherit THAT session's model — carrying `model:` into the command
// would silently switch the user's session. Per-agent consumer overrides happen at spawn time via
// `.claude/nexus-agents.json` (read by the team lead), not here.
//
// Agent set = readdirSync(AGENTS_DIR) (adhoc-AnalystExtension Step 1 — was a hard-coded 8-role MAP
// that crashed ENOENT on any plugin whose agents don't match that exact set). MAP now stays as an
// OVERRIDE table only: nexus's founding 8 agents are in it, and using it keeps their commands
// byte-identical (the binding regression contract, guarded by selfcheck's gen-commands drift
// check). An agent with no MAP entry (any plugin, including a future 9th nexus agent) gets its
// `proper`/`desc` DERIVED from its own doc — see deriveEntry().
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_NAME = process.argv[2] || 'nexus';
const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', PLUGIN_NAME);
const AGENTS_DIR = join(PLUGIN, 'agents');
const CMD_DIR = join(PLUGIN, 'commands');
if (!existsSync(AGENTS_DIR)) {
  // e.g. nexus-dotnet ships skills only — nothing to generate, and not an error (critic CRITICAL-1).
  console.log(`gen-commands: ${PLUGIN_NAME} has no agents/ dir — nothing to generate.`);
  process.exit(0);
}
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

// Flat single-line frontmatter parser — same shape tests/helpers.mjs uses (key: value lines
// between --- fences; no nesting, no multi-line values — matches how this repo's agent docs are
// actually authored).
function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return data;
}

// Derive { proper, desc } for an agent with no MAP entry. proper = the first H1 heading with a
// trailing " Agent" stripped ("# Data Analyst Agent" -> "Data Analyst"); desc = the frontmatter
// description's first sentence, in the same "Become the X — ..." shape the MAP entries use.
function deriveEntry(name, agentMd, data) {
  const h1 = agentMd.match(/^#\s+(.+)$/m);
  const proper = h1 ? h1[1].trim().replace(/\s+Agent$/i, '') : name;
  const description = data.description || '';
  const firstSentence = (description.split(/(?<=\.)\s/)[0] || description).trim();
  return { proper, desc: `Become the ${proper} — ${firstSentence}` };
}

const agentNames = readdirSync(AGENTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => basename(f, '.md'))
  .sort();

for (const name of agentNames) {
  const agentMd = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf8');
  const { proper, desc } = MAP[name] || deriveEntry(name, agentMd, parseFrontmatter(agentMd));
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
