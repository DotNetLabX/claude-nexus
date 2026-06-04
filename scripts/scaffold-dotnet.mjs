// Phase 1: scaffold plugins/nexus-net as a self-contained SUPERSET of nexus-core.
// Copies engine (hooks) + rules + 9 core skills (from already-de-leaked nexus-core)
// + 29 stack skills (from fokus source). Agents/commands come in later phases.
import { mkdirSync, cpSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'D:/src/nexus';
const CORE = join(REPO, 'plugins', 'nexus');
const DOT = join(REPO, 'plugins', 'nexus-net');
const FOKUS_SKILLS = 'D:/src/fokus/.claude/skills';

const STACK_SKILLS = [
  'add-pipeline-behavior', 'add-integration-event', 'create-aggregate', 'create-building-blocks-package',
  'create-domain-event-handler', 'create-feature', 'create-grpc-contract', 'create-module',
  'create-module-claude-md', 'create-service', 'create-service-claude-md', 'create-vue-feature',
  'analytics-computation-service', 'authorization-patterns', 'cqrs-patterns', 'domain-patterns',
  'error-handling', 'extract-endpoint-types', 'extract-feature-service', 'frontend-review',
  'persistence-patterns', 'pinia-patterns', 'redis-patterns', 'service-registration', 'tailwind-theme',
  'vue-component-architecture', 'vue-patterns', 'system-design', 'improve-architecture',
];

mkdirSync(DOT, { recursive: true });

// 1) engine: copy hooks/ wholesale (scripts derive paths from __dirname → portable)
cpSync(join(CORE, 'hooks'), join(DOT, 'hooks'), { recursive: true });

// 2) rules: copy all 10 (stack-agnostic)
cpSync(join(CORE, 'rules'), join(DOT, 'rules'), { recursive: true });

// 3) skills: 9 core (from nexus-core, already de-leaked) + 29 stack (from fokus)
mkdirSync(join(DOT, 'skills'), { recursive: true });
cpSync(join(CORE, 'skills'), join(DOT, 'skills'), { recursive: true });   // 9 core
const copiedStack = [], missingStack = [];
for (const s of STACK_SKILLS) {
  const src = join(FOKUS_SKILLS, s);
  if (!existsSync(src)) { missingStack.push(s); continue; }
  cpSync(src, join(DOT, 'skills', s), { recursive: true });
  copiedStack.push(s);
}

// 4) plugin.json (NO dependencies — superset; same security_mode userConfig)
const pluginJson = {
  name: 'nexus-net',
  version: '0.1.0',
  description: 'Nexus .NET — full .NET / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints + Vue / Pinia / Tailwind stack plugin. Self-contained superset of nexus: same agents (stack conventions inlined), rules, commands, and engine, plus 29 stack code-pattern skills.',
  author: { name: 'ldumit' },
  keywords: ['agents', 'pipeline', 'dotnet', 'csharp', 'ef-core', 'cqrs', 'ddd', 'fastendpoints', 'vue', 'pinia', 'tailwind'],
  userConfig: {
    security_mode: {
      type: 'string',
      title: 'Security mode',
      description: 'Install posture: open (block catastrophic actions only — recommended) | hardened (strict, for teams/CI) | off (no guard).',
      default: 'open',
    },
  },
};
mkdirSync(join(DOT, '.claude-plugin'), { recursive: true });
writeFileSync(join(DOT, '.claude-plugin', 'plugin.json'), JSON.stringify(pluginJson, null, 2) + '\n', 'utf8');

// 5) register in marketplace.json
const mpPath = join(REPO, '.claude-plugin', 'marketplace.json');
const mp = JSON.parse(readFileSync(mpPath, 'utf8'));
if (!mp.plugins.some(p => p.name === 'nexus-net')) {
  mp.plugins.push({ name: 'nexus-net', source: './plugins/nexus-net' });
  writeFileSync(mpPath, JSON.stringify(mp, null, 2) + '\n', 'utf8');
}

// report
const skillCount = readdirSync(join(DOT, 'skills')).length;
console.log('=== SCAFFOLD nexus-net ===');
console.log('hooks copied:', readdirSync(join(DOT, 'hooks')).join(', '));
console.log('rules copied:', readdirSync(join(DOT, 'rules')).length);
console.log('stack skills copied:', copiedStack.length, '| missing:', missingStack.join(', ') || 'none');
console.log('TOTAL skills in nexus-net:', skillCount, '(expect 38 = 9 core + 29 stack)');
console.log('marketplace plugins:', mp.plugins.map(p => p.name).join(', '));
