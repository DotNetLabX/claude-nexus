#!/usr/bin/env node
/**
 * Nexus model preset: the command line over lib/model-presets.js, behind /nexus:model-preset.
 *
 *   node model-preset.js [show]                  the preset in force, its source, and what each preset runs
 *   node model-preset.js set <preset> [--repo]   the profile's preset; --repo writes this repo's instead
 *   node model-preset.js <preset> [--repo]       the same as set
 *
 * The profile is the Claude Code profile folder (CLAUDE_CONFIG_DIR, else ~/.claude); the repo is --root,
 * else CLAUDE_PROJECT_DIR, else the working folder. Agents read the preset in force with `show`.
 *
 * Every call prints one JSON object. Exit 2 is a refused input, printed as `{error}` naming the fix, and
 * nothing is written; exit 1 an unexpected failure. A single argument holding spaces is split, so the
 * command file can pass the user's whole argument line as one quoted word.
 */
'use strict';
const path = require('path');
const mp = require('./lib/model-presets');

class Refusal extends Error {}

function parse(argv) {
  const words = argv.length === 1 && /\s/.test(argv[0]) ? argv[0].trim().split(/\s+/) : argv.filter((a) => a !== '');
  const positional = [];
  const flags = {};
  for (let i = 0; i < words.length; i++) {
    const a = words[i];
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const next = words[i + 1];
    if (a === '--root' && next !== undefined) { flags.root = next; i++; } else flags[a.slice(2)] = true;
  }
  return { positional, flags };
}

function inForce(root, env) {
  const r = mp.resolvePreset({ root, env });
  return { preset: r.preset, source: r.source, ignored: r.ignored };
}

function show(root, env) {
  return {
    ...inForce(root, env),
    profilePath: mp.profileFile(env),
    repoPath: path.join(root, '.claude', 'nexus-agents.json'),
    presets: mp.presetNames().map((name) => ({ name, runs: mp.describeRows(name) })),
  };
}

function set(name, { repo }, root, env) {
  const preset = mp.presetName(name);
  if (!preset) throw new Refusal(`"${name}" is not a model preset — use one of: ${mp.presetNames().join(', ')}`);
  let written;
  try {
    written = repo ? mp.setRepoKey(root, 'modelPreset', preset) : mp.writeProfile({ modelPreset: preset }, env);
  } catch (e) {
    throw new Refusal(String((e && e.message) || e));
  }
  const now = inForce(root, env);
  const out = { set: preset, written: repo ? 'repo' : 'profile', path: written.path, ...now };
  if (now.preset !== preset) {
    out.note = now.ignored.some((i) => i.key === 'modelPreset')
      ? `this repo's ${preset} applies only where the profile chose ${preset} too — the profile runs ${now.preset}`
      : `this repo sets its own preset, ${now.preset}, which wins over the profile here`;
  }
  return out;
}

function run(argv, env = process.env) {
  const { positional, flags } = parse(argv);
  const root = typeof flags.root === 'string' ? flags.root : env.CLAUDE_PROJECT_DIR || process.cwd();
  const unknownFlag = Object.keys(flags).find((f) => f !== 'root' && f !== 'repo');
  if (unknownFlag) throw new Refusal(`unknown option --${unknownFlag} — the only option is --repo`);
  const [first, ...rest] = positional;
  if (!first || first === 'show') {
    if (rest.length || flags.repo) throw new Refusal('show takes no other words');
    return show(root, env);
  }
  const words = first === 'set' ? rest : positional;
  if (words.length !== 1) throw new Refusal(`set needs one preset name — one of: ${mp.presetNames().join(', ')}`);
  return set(words[0], { repo: flags.repo === true }, root, env);
}

if (require.main === module) {
  try {
    process.stdout.write(JSON.stringify(run(process.argv.slice(2))) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: String((e && e.message) || e) }) + '\n');
    process.exitCode = e instanceof Refusal ? 2 : 1;
  }
}

module.exports = { run };
