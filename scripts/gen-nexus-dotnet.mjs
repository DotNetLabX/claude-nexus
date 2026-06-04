// Build plugins/nexus-dotnet — a THIN stack extension of `nexus` (Read-Index model).
//
// Ships ONLY: the 29 .NET/Vue stack skills + the stack convention files (Read-Index
// scaffold source) + the project CLAUDE.md template + a thin plugin.json that declares
// `dependencies: ["nexus"]`. It ships NO agents/rules/commands/hooks — those come from
// the `nexus` core plugin it depends on (install nexus-dotnet ALONGSIDE nexus).
//
// Sources (already built + de-leaked in this repo): skills from plugins/nexus-net/skills,
// conventions from build-src/conventions, template from plugins/nexus-net/templates.
// Idempotent: wipes & rebuilds skills/ and conventions/. Touches no existing plugin.
//
// Run: node scripts/gen-nexus-dotnet.mjs
import { mkdirSync, cpSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const NET = join(REPO, 'plugins', 'nexus-net');
const SRC_CONV = join(REPO, 'build-src', 'conventions');
const OUT = join(REPO, 'plugins', 'nexus-dotnet');

// The 29 stack skills (authoritative list — mirrors scaffold-dotnet.mjs).
const STACK_SKILLS = [
  'add-pipeline-behavior', 'add-integration-event', 'create-aggregate', 'create-building-blocks-package',
  'create-domain-event-handler', 'create-feature', 'create-grpc-contract', 'create-module',
  'create-module-claude-md', 'create-service', 'create-service-claude-md', 'create-vue-feature',
  'analytics-computation-service', 'authorization-patterns', 'cqrs-patterns', 'domain-patterns',
  'error-handling', 'extract-endpoint-types', 'extract-feature-service', 'frontend-review',
  'persistence-patterns', 'pinia-patterns', 'redis-patterns', 'service-registration', 'tailwind-theme',
  'vue-component-architecture', 'vue-patterns', 'system-design', 'improve-architecture',
];

// 1) skills: the 29 stack skills only (the 9 process skills come from nexus core).
rmSync(join(OUT, 'skills'), { recursive: true, force: true });
mkdirSync(join(OUT, 'skills'), { recursive: true });
const copied = [], missing = [];
for (const s of STACK_SKILLS) {
  const src = join(NET, 'skills', s);
  if (!existsSync(src)) { missing.push(s); continue; }
  cpSync(src, join(OUT, 'skills', s), { recursive: true });
  copied.push(s);
}

// 2) conventions: Read-Index scaffold source (project copies these into docs/conventions/).
rmSync(join(OUT, 'conventions'), { recursive: true, force: true });
cpSync(SRC_CONV, join(OUT, 'conventions'), { recursive: true });

// 3) template: the .NET/Vue project CLAUDE.md starter.
mkdirSync(join(OUT, 'templates'), { recursive: true });
cpSync(join(NET, 'templates', 'CLAUDE.md'), join(OUT, 'templates', 'CLAUDE.md'));

// 4) thin plugin.json — no hooks/userConfig (the engine + security guard come from nexus).
const plugin = {
  name: 'nexus-dotnet',
  version: '0.1.0',
  description:
    'Nexus .NET (thin) — a stack extension for the `nexus` core pipeline. Ships the 29 .NET / ASP.NET Core / ' +
    'EF Core / CQRS / DDD / FastEndpoints + Vue / Pinia / Tailwind code-pattern skills plus the stack ' +
    'convention files (Read-Index model). Reuses nexus\'s agents, rules, commands, and security guard — ' +
    'install ALONGSIDE nexus, not instead of it.',
  author: { name: 'ldumit' },
  keywords: ['agents', 'pipeline', 'dotnet', 'csharp', 'ef-core', 'cqrs', 'ddd', 'fastendpoints', 'vue', 'pinia', 'tailwind', 'skills', 'extension'],
  dependencies: ['nexus'],
};
mkdirSync(join(OUT, '.claude-plugin'), { recursive: true });
writeFileSync(join(OUT, '.claude-plugin', 'plugin.json'), JSON.stringify(plugin, null, 2) + '\n');

// 5) README.
const README = `# nexus-dotnet

A **thin .NET / Vue stack extension** for the \`nexus\` core pipeline — the dependency-based alternative
to the self-contained \`nexus-net\` superset.

Unlike \`nexus-net\` (which inlines stack conventions into its own full copy of every agent), \`nexus-dotnet\`
ships **no agents, rules, commands, or hooks**. It depends on \`nexus\` for the entire engine and adds only:

| Component | Count | Notes |
|-----------|-------|-------|
| **Skills** | 29 | The .NET/Vue stack code-pattern skills (services, modules, aggregates, CQRS, EF, gRPC, Vue, Pinia, Tailwind, …). The 9 process skills come from \`nexus\`. |
| **Conventions** | 6 | \`csharp\`, \`ef-core\`, \`vue\`, \`testing\`, \`project-rules\`, \`coding-conventions\` — scaffold source for the Read-Index pattern. |
| **Template** | 1 | \`templates/CLAUDE.md\` — a .NET/Vue project starter. |

## Install (alongside nexus)

\`\`\`
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-dotnet@claude-nexus
\`\`\`

\`nexus-dotnet\` declares \`dependencies: ["nexus"]\`, so installing it **auto-installs \`nexus\`** — the
install output lists the dependency it pulled in. Then run \`/reload-plugins\` (or restart Claude Code) to
activate.

For the full lifecycle — update and remove — see the marketplace README's
[Install & lifecycle](../../README.md#install--lifecycle) section.

## Conventions — the Read-Index model

The stack conventions are **not** inlined into agents here. Instead they live as files the project reads:

1. Copy this plugin's \`conventions/\` into your project's \`docs/conventions/\`.
2. \`docs/conventions/coding-conventions.md\` is the index — it lists \`csharp.md\`, \`vue.md\`, \`ef-core.md\`, \`testing.md\`.
3. Code-touching agents read the index (and the files it lists) before writing or reviewing code.

> The core \`nexus\` agents (developer, reviewer, solo, architect) read \`docs/conventions/coding-conventions.md\`
> and the files it lists before writing or reviewing code — so once you place these conventions there, they are
> applied automatically. See \`omni-convention-loading-v2.md\` for the full design.

## When to use which

- **Generic / non-.NET project** → \`nexus\` alone.
- **.NET project, prefer one self-contained install** → \`nexus-net\` (superset; conventions inlined into agents).
- **.NET project, prefer the thin/dependency model** → \`nexus\` + \`nexus-dotnet\` (this plugin).
`;
writeFileSync(join(OUT, 'README.md'), README);

console.log(`=== nexus-dotnet built ===`);
console.log(`  skills: ${copied.length}/${STACK_SKILLS.length}`);
if (missing.length) console.log(`  MISSING: ${missing.join(', ')}`);
console.log(`  conventions + template + plugin.json + README written to plugins/nexus-dotnet/`);
