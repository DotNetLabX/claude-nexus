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
// Run from the nexus repo:  node scripts/gen-omni.mjs [omniRepoPath]   (default: ../omni)
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const NEXUS = join(dirname(fileURLToPath(import.meta.url)), '..');
const OMNI = process.argv[2] || join(NEXUS, '..', 'omni');

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

// Recursively mirror src -> dst, swapping file CONTENTS and path SEGMENTS (so nexus-dotnet -> omni-dotnet).
function mirrorDir(src, dst) {
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dst, swap(entry));
    if (statSync(s).isDirectory()) mirrorDir(s, d);
    else writeFileSync(d, swap(readFileSync(s, 'utf8')), 'utf8');
  }
}

// 1) plugins
mirrorDir(join(NEXUS, 'plugins', 'nexus'), join(OMNI, 'plugins', 'omni'));
mirrorDir(join(NEXUS, 'plugins', 'nexus-dotnet'), join(OMNI, 'plugins', 'omni-dotnet'));
rmSync(join(OMNI, 'plugins', 'omni-net'), { recursive: true, force: true });

// 2) scripts: only the command generator (token-swapped). Drop obsolete/source-only scripts.
mkdirSync(join(OMNI, 'scripts'), { recursive: true });
writeFileSync(join(OMNI, 'scripts', 'gen-commands.mjs'),
  swap(readFileSync(join(NEXUS, 'scripts', 'gen-commands.mjs'), 'utf8')), 'utf8');
for (const f of ['compose-dotnet-agents.mjs', 'scaffold-dotnet.mjs', 'gen-nexus-dotnet.mjs', 'gen-omni.mjs', 'skill-classification.md'])
  rmSync(join(OMNI, 'scripts', f), { force: true });

// 3) marketplace.json: regenerate plugins array; PRESERVE name/owner/metadata.
const mpPath = join(OMNI, '.claude-plugin', 'marketplace.json');
const mp = JSON.parse(readFileSync(mpPath, 'utf8'));
mp.plugins = [
  { name: 'omni', source: './plugins/omni' },
  { name: 'omni-dotnet', source: './plugins/omni-dotnet' },
];
writeFileSync(mpPath, JSON.stringify(mp, null, 2) + '\n');

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
writeFileSync(join(OMNI, 'README.md'), readme, 'utf8');

console.log('=== omni regenerated from nexus ===');
console.log('  plugins: omni, omni-dotnet   (omni-net removed)');
console.log('  preserved: omni/LICENSE, marketplace name/owner');
console.log('  ⚠ run `node scripts/gen-commands.mjs omni` and `… omni-dotnet`? No — commands are mirrored as-is from nexus.');
