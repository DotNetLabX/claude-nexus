// Phase 3: compose nexus-net agents = core agent body + inlined .NET/Vue stack conventions.
// File->file. Convention source of truth = build-src/conventions/ (copied from fokus, verified leak-free).
import { mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'D:/src/nexus';
const CORE_AGENTS = join(REPO, 'plugins', 'nexus', 'agents');
const DOT_AGENTS = join(REPO, 'plugins', 'nexus-net', 'agents');
const FOKUS_CONV = 'D:/src/fokus/docs/conventions';
const SRC_CONV = join(REPO, 'build-src', 'conventions');

// 0) seed convention source into the repo ONCE (decouple from fokus).
//    Do NOT overwrite — build-src/conventions/ is hand-de-leaked and is the source of truth.
import { existsSync as _exists } from 'node:fs';
mkdirSync(SRC_CONV, { recursive: true });
for (const f of ['coding-conventions.md', 'csharp.md', 'ef-core.md', 'vue.md', 'testing.md', 'project-rules.md']) {
  const dst = join(SRC_CONV, f);
  if (!_exists(dst)) cpSync(join(FOKUS_CONV, f), dst);
}

// demote every heading by 2 levels (# -> ###, ## -> ####, cap ######) so the file nests cleanly
function demote(name) {
  let t = readFileSync(join(SRC_CONV, name), 'utf8').replace(/\r\n/g, '\n').trim();
  t = t.replace(/^(#{1,4}) /gm, (_, h) => '#'.repeat(Math.min(h.length + 2, 6)) + ' ');
  return t.trim();
}

const FULL_FILES = ['coding-conventions.md', 'csharp.md', 'ef-core.md', 'vue.md', 'testing.md'];
const ARCH_FILES = ['project-rules.md', 'coding-conventions.md'];

const FULL_INTRO =
  '## .NET / Vue Stack Conventions\n\n' +
  'Always-on coding standards for this stack. Every change must follow them. Detailed build recipes live in the skills ' +
  '(create-feature, create-aggregate, cqrs-patterns, domain-patterns, persistence-patterns, vue-patterns, pinia-patterns, …); ' +
  'the rules below are the standards those recipes must satisfy. If the project ships its own `docs/conventions/`, treat those as overrides.\n\n';

const ARCH_INTRO =
  '## .NET / Vue Stack Conventions (planning)\n\n' +
  'Plan within this stack\'s structure and standards. Use the `system-design` skill for axis/tier decisions; detailed code patterns live in the stack skills. ' +
  'If the project ships its own `docs/conventions/` or `docs/architecture/`, treat those as overrides.\n\n';

const PROCESS_NOTE =
  '## Stack Context\n\n' +
  'This is a .NET 10 / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints + Vue 3 / Pinia / Tailwind project. ' +
  'Stack code-pattern skills are available (create-service, create-module, create-feature, create-aggregate, create-vue-feature, cqrs-patterns, vue-patterns, …). ' +
  'The code-touching agents (developer, reviewer, solo) carry the full coding standards inline; the architect carries structure + standards.\n';

const FULL = new Set(['developer', 'reviewer', 'solo']);
const PROCESS = new Set(['po', 'critic', 'learner', 'team-lead']);

function splitFrontmatter(md) {
  const m = md.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: md };
}

// architect: add system-design to the skills: frontmatter line
function addSystemDesign(fm) {
  return fm.replace(/^(skills:\s*)(.*)$/m, (line, key, val) =>
    /system-design/.test(val) ? line : `${key}${val.trim()}, system-design`);
}

mkdirSync(DOT_AGENTS, { recursive: true });
const report = [];
for (const file of readdirSync(CORE_AGENTS)) {
  const name = file.replace(/\.md$/, '');
  const md = readFileSync(join(CORE_AGENTS, file), 'utf8').replace(/\r\n/g, '\n');
  let { fm, body } = splitFrontmatter(md);
  body = body.trim();

  let section;
  if (name === 'architect') {
    fm = addSystemDesign(fm);
    section = ARCH_INTRO + ARCH_FILES.map(demote).join('\n\n');
  } else if (FULL.has(name)) {
    section = FULL_INTRO + FULL_FILES.map(demote).join('\n\n');
  } else {
    section = PROCESS_NOTE;
  }

  const out = `${fm}${body}\n\n---\n\n${section}\n`;
  writeFileSync(join(DOT_AGENTS, file), out, 'utf8');
  report.push(`${name}: ${out.split('\n').length} lines${name === 'architect' ? ' (+system-design)' : ''}`);
}

console.log('=== COMPOSE nexus-net agents ===');
report.forEach(r => console.log('  ' + r));
console.log('conventions copied to build-src/conventions/:', readdirSync(SRC_CONV).join(', '));
