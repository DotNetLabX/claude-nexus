// T1 — wiring lints. The "dangling edge" check applied to the plugin's own wiring: hook
// registrations, the command↔agent bijection, env-var placeholders, and agent-name references.
// frontmatter.test.mjs already pins the forward edges (agent → command at :51, hook script exists
// at :64); these cover the directions it does NOT — orphan commands, duplicate matchers, env-var
// resolution, and agent-name mentions in prose — exactly the drift classes the VWH dive surfaced.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { listAgents, agentName, pluginRoot } from '../helpers.mjs';

// ── 1. No duplicate (event, matcher) hook registrations ──────────────────────
test('no two hook entries under the same event share a matcher', () => {
  // A duplicate (event, matcher) is a silent mis-wire: two scripts claim the same trigger and the
  // intent is ambiguous. Treat an absent matcher as "*" (the platform's match-all). Skip plugins
  // that ship no hooks.json — nexus-dotnet ships none (critic MED-1); absence is not a failure.
  let checkedAnyPlugin = false;
  for (const plugin of ['nexus', 'nexus-dotnet']) {
    const hooksFile = join(pluginRoot(plugin), 'hooks', 'hooks.json');
    if (!existsSync(hooksFile)) continue;
    checkedAnyPlugin = true;
    const cfg = JSON.parse(readFileSync(hooksFile, 'utf8'));
    for (const [event, entries] of Object.entries(cfg.hooks || {})) {
      const seen = new Set();
      for (const entry of entries) {
        const matcher = entry.matcher ?? '*';
        assert.ok(
          !seen.has(matcher),
          `${plugin}/hooks.json: event "${event}" has two entries with matcher "${matcher}" — duplicate registration`
        );
        seen.add(matcher);
      }
    }
  }
  assert.ok(checkedAnyPlugin, 'no plugin hooks.json was checked — wiring test is inert');
});

// ── 2. Every command traces to an agent (command → agent direction ONLY) ──────
// `commands/backlog.md` is hand-authored with no backing agent (DO-NOT-TOUCH carve-out).
const COMMAND_ORPHAN_ALLOWLIST = new Set(['backlog']);

test('every nexus command has a backing agent (backlog allowlisted)', () => {
  // The forward edge (agent → command exists) is frontmatter.test.mjs:51 — do NOT re-implement it
  // (critic MED-2). This is the reverse: a command whose agent was deleted (gen-commands does not
  // prune orphans, so regen+diff cannot catch it).
  const agents = new Set(listAgents('nexus').map(agentName));
  const cmdDir = join(pluginRoot('nexus'), 'commands');
  for (const file of readdirSync(cmdDir).filter((f) => f.endsWith('.md'))) {
    const name = file.replace(/\.md$/, '');
    if (COMMAND_ORPHAN_ALLOWLIST.has(name)) {
      assert.ok(!agents.has(name), `commands/${file} is allowlisted as hand-authored but agents/${name}.md now exists — drop it from the allowlist`);
      continue;
    }
    assert.ok(agents.has(name), `commands/${file} has no backing agents/${name}.md — orphan command (agent removed without deleting its command)`);
  }
});

// ── 3. Every ${user_config.X} placeholder resolves to a declared userConfig key ──
test('hooks.json ${user_config.*} placeholders resolve to declared plugin.json userConfig keys', () => {
  for (const plugin of ['nexus', 'nexus-dotnet']) {
    const hooksFile = join(pluginRoot(plugin), 'hooks', 'hooks.json');
    if (!existsSync(hooksFile)) continue;
    const hooksText = readFileSync(hooksFile, 'utf8');
    const manifest = JSON.parse(readFileSync(join(pluginRoot(plugin), '.claude-plugin', 'plugin.json'), 'utf8'));
    const declared = new Set(Object.keys(manifest.userConfig || {}));
    for (const m of hooksText.matchAll(/\$\{user_config\.([A-Za-z_][\w]*)\}/g)) {
      assert.ok(
        declared.has(m[1]),
        `${plugin}/hooks.json references \${user_config.${m[1]}} but plugin.json declares no such userConfig key`
      );
    }
  }
});

// ── 4. Every agent-name reference resolves to a shipped agent ─────────────────
// Platform subagent types that are NOT nexus agents — legal targets, extend deliberately.
const PLATFORM_SUBAGENT_TYPES = new Set(['Explore', 'general-purpose']);

test('subagent_type and nexus: agent references resolve to shipped agents', () => {
  const agents = new Set(listAgents('nexus').map(agentName));
  const surfaces = [];
  for (const dir of ['agents', 'rules', 'skills']) {
    const base = join(pluginRoot('nexus'), dir);
    if (!existsSync(base)) continue;
    walk(base, surfaces);
  }
  for (const file of surfaces) {
    const text = readFileSync(file, 'utf8');
    // subagent_type="X" and subagent_type: "X" (both forms appear in prose examples).
    for (const m of text.matchAll(/subagent_type\s*[=:]\s*["']([A-Za-z][\w-]*)["']/g)) {
      const name = m[1];
      assert.ok(
        agents.has(name) || PLATFORM_SUBAGENT_TYPES.has(name),
        `${file}: subagent_type "${name}" resolves to neither agents/${name}.md nor an allowlisted platform type`
      );
    }
    // /nexus:X and nexus:X persona/command references.
    for (const m of text.matchAll(/\/?nexus:([a-z][a-z0-9-]*)/g)) {
      const name = m[1];
      assert.ok(
        agents.has(name),
        `${file}: reference "nexus:${name}" resolves to no agents/${name}.md`
      );
    }
  }
});

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
}
