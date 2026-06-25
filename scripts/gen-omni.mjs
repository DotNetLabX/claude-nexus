// gen-omni.mjs — regenerate the `omni` marketplace from `nexus` (single source of truth).
//
// `nexus` is canonical; `omni` is the renamed twin. This mirrors nexus -> omni, token-swapping
// identifiers (Nexus->Omni, nexus->omni, DotNetLabX->omniaz) and PRESERVING omni's proprietary
// LICENSE + license footer. It refuses to write an omni README that still contains "MIT".
//
// Regenerates: plugins/omni (from plugins/nexus), plugins/omni-dotnet (from plugins/nexus-dotnet),
//   scripts/gen-commands.mjs, marketplace.json plugins array, top-level README.md (with overrides).
// Removes:    plugins/omni-net (no longer part of the model).
// Never touches: omni/LICENSE, omni/.git, marketplace name/owner/metadata.
//
// Run from the nexus repo:  node scripts/gen-omni.mjs [omniRepoPath] [--check]   (default: ../omni)
//   --check   verify-only (audit B6): regenerate in memory, diff against the omni tree, exit 1
//             listing any drift (missing / differing / extra files). Changes nothing. Run it after
//             every bump (release-plugin flow) so the twin can never silently diverge.
//
// Commit convention (in the ../omni repo): mirror the nexus change — type = nexus's commit type
//   (`feat`/`fix`/…, highest-impact wins when bundling releases), scope `(omni)`; body = the plugin
//   delta since the last `omni X.Y.Z` sync; footer `Generated from the nexus plugin (nexus {sha}).`
//   NOT a generic `chore: regenerate`. Full rule: CLAUDE.md "Generated artifacts".
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const pathArg = argv.find((a) => !a.startsWith('--'));

const NEXUS = join(dirname(fileURLToPath(import.meta.url)), '..');
const OMNI = pathArg || join(NEXUS, '..', 'omni');

if (!existsSync(join(OMNI, '.claude-plugin', 'marketplace.json'))) {
  console.error(`✗ omni repo not found at ${OMNI} (pass the path as arg 1)`);
  process.exit(1);
}

// Token swap. DotNetLabX is independent; "Nexus"/"nexus" are case-distinct so order is safe.
// "claude-nexus" -> "claude-omni" falls out of the nexus->omni rule.
const swap = (s) => s
  .replaceAll('DotNetLabX', 'omniaz')
  .replaceAll('Nexus', 'Omni')
  .replaceAll('nexus', 'omni');

const drift = [];
const rel = (p) => relative(OMNI, p).replace(/\\/g, '/');

// Write a generated file (apply) or compare it against the tree (--check).
function emit(dst, content) {
  if (!CHECK) {
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, content, 'utf8');
    return;
  }
  if (!existsSync(dst)) drift.push(`missing:  ${rel(dst)}`);
  else if (readFileSync(dst, 'utf8') !== content) drift.push(`differs:  ${rel(dst)}`);
}

// Remove a path (apply) or flag its presence as drift (--check).
function assertAbsent(p) {
  if (!CHECK) { rmSync(p, { recursive: true, force: true }); return; }
  if (existsSync(p)) drift.push(`obsolete: ${rel(p)} should not exist`);
}

// Mirror src -> dst, swapping file CONTENTS and path SEGMENTS (so nexus-dotnet -> omni-dotnet).
// In --check mode: compare every expected file AND flag extra files present in dst.
function mirrorDir(src, dst) {
  const expected = new Map();
  (function collect(s, d) {
    for (const entry of readdirSync(s)) {
      const sp = join(s, entry);
      const dp = join(d, swap(entry));
      if (statSync(sp).isDirectory()) collect(sp, dp);
      else expected.set(dp, swap(readFileSync(sp, 'utf8')));
    }
  })(src, dst);

  if (!CHECK) rmSync(dst, { recursive: true, force: true });
  for (const [dp, content] of expected) emit(dp, content);

  if (CHECK) {
    if (!existsSync(dst)) return; // every file already reported missing above
    (function sweep(d) {
      for (const entry of readdirSync(d)) {
        const dp = join(d, entry);
        if (statSync(dp).isDirectory()) sweep(dp);
        else if (!expected.has(dp)) drift.push(`extra:    ${rel(dp)}`);
      }
    })(dst);
  }
}

// 1) plugins
mirrorDir(join(NEXUS, 'plugins', 'nexus'), join(OMNI, 'plugins', 'omni'));
mirrorDir(join(NEXUS, 'plugins', 'nexus-dotnet'), join(OMNI, 'plugins', 'omni-dotnet'));
mirrorDir(join(NEXUS, 'plugins', 'nexus-flutter'), join(OMNI, 'plugins', 'omni-flutter'));
assertAbsent(join(OMNI, 'plugins', 'omni-net'));

// 2) scripts: only the command generator (token-swapped). Drop obsolete/source-only scripts.
emit(join(OMNI, 'scripts', 'gen-commands.mjs'),
  swap(readFileSync(join(NEXUS, 'scripts', 'gen-commands.mjs'), 'utf8')));
for (const f of ['compose-dotnet-agents.mjs', 'scaffold-dotnet.mjs', 'gen-nexus-dotnet.mjs', 'gen-omni.mjs', 'skill-classification.md'])
  assertAbsent(join(OMNI, 'scripts', f));

// 3) marketplace.json: regenerate plugins array; PRESERVE name/owner/metadata.
const mpPath = join(OMNI, '.claude-plugin', 'marketplace.json');
const mp = JSON.parse(readFileSync(mpPath, 'utf8'));
const wantPlugins = [
  { name: 'omni', source: './plugins/omni' },
  { name: 'omni-dotnet', source: './plugins/omni-dotnet' },
  { name: 'omni-flutter', source: './plugins/omni-flutter' },
];
if (CHECK) {
  if (JSON.stringify(mp.plugins) !== JSON.stringify(wantPlugins))
    drift.push('differs:  .claude-plugin/marketplace.json (plugins array)');
} else {
  mp.plugins = wantPlugins;
  writeFileSync(mpPath, JSON.stringify(mp, null, 2) + '\n');
}

// 4) top-level README: token-swap nexus README, then apply omni-specific (license/privacy) overrides.
let readme = swap(readFileSync(join(NEXUS, 'README.md'), 'utf8'));
const OVERRIDES = [
  ['> **Name alternatives considered:** Gravity, Blade — in case of a future rename.',
   '> **Internal tooling.** Private to the team — not for public distribution. See [LICENSE](LICENSE).'],
  ['[MIT](LICENSE)', 'Proprietary — see [LICENSE](LICENSE). All rights reserved.'],
  // The architecture & decision record is nexus-canonical (it describes both twins; not mirrored to omni).
  // Drop its README link in the twin so omni has no dangling docs/ reference.
  ['- [Architecture & Decision Record](docs/architecture/README.md) — why Omni is built the way it is: source of truth, dependency model, knowledge delivery, pipeline enforcement, build & release\n', ''],
];
for (const [from, to] of OVERRIDES) {
  if (!readme.includes(from)) console.warn(`⚠ override target not found (nexus README changed?): "${from.slice(0, 50)}…"`);
  readme = readme.replace(from, to);
}
if (/\bMIT\b/.test(readme)) {
  console.error('✗ REFUSING to write omni README: it still contains "MIT" (proprietary twin must not ship MIT).');
  process.exit(1);
}
emit(join(OMNI, 'README.md'), readme);

// ── report ──
if (CHECK) {
  if (drift.length) {
    console.error(`✗ omni twin has drifted from nexus (${drift.length} path(s)):`);
    for (const d of drift) console.error('  ' + d);
    console.error('\nRun `node scripts/gen-omni.mjs` to regenerate.');
    process.exit(1);
  }
  console.log('✓ omni twin is in sync with nexus.');
  process.exit(0);
}
console.log('=== omni regenerated from nexus ===');
console.log('  plugins: omni, omni-dotnet   (omni-net removed)');
console.log('  preserved: omni/LICENSE, marketplace name/owner');
console.log('  verify: node scripts/gen-omni.mjs --check');
