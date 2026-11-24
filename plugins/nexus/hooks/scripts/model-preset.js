#!/usr/bin/env node
/**
 * Nexus model preset: the command line over lib/model-presets.js, behind /nexus:model-preset.
 *
 *   node model-preset.js [show]                  the preset in force, its source, the repo values it ignores, the
 *                                                roles' Codex seat settings, and what each preset runs
 *   node model-preset.js set <preset> [--repo]   the profile's preset; --repo writes this repo's instead
 *   node model-preset.js <preset> [--repo]       the same as set
 *   node model-preset.js readers --job {job} --author {model}[,{model}] --codex available|absent
 *       [--dropped {family}[,{family}]] [--pick {model}[,{model}]] [--count 1|2|3] [--no-author-fill] [--json]
 *
 * The profile is the Claude Code profile folder (CLAUDE_CONFIG_DIR, else ~/.claude); the repo is --root,
 * else CLAUDE_PROJECT_DIR, else the working folder. Agents read the preset in force with `show`.
 *
 * `readers` prints the slots or, with `--json`, one JSON object like the other commands. Exit 2 is
 * a refused input, printed as `{error}` naming the fix, and
 * nothing is written; exit 1 an unexpected failure. A single argument holding spaces is split, so the
 * command file can pass the user's whole argument line as one quoted word.
 */
'use strict';
const path = require('path');
const mp = require('./lib/model-presets');

class Refusal extends Error {}
const VALUE_FLAGS = new Set(['root', 'job', 'author', 'codex', 'dropped', 'pick', 'count']);
const READER_FLAGS = new Set(['root', 'job', 'author', 'codex', 'dropped', 'pick', 'count', 'no-author-fill', 'json']);

function parse(argv) {
  const words = argv.length === 1 && /\s/.test(argv[0]) ? argv[0].trim().split(/\s+/) : argv.filter((a) => a !== '');
  const positional = [];
  const flags = {};
  for (let i = 0; i < words.length; i++) {
    const a = words[i];
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const flag = a.slice(2);
    if (!VALUE_FLAGS.has(flag)) { flags[flag] = true; continue; }
    const next = words[++i];
    if (!next || next.startsWith('--')) throw new Refusal(`--${flag} needs a value`);
    flags[flag] = flag === 'dropped' && flags[flag] ? `${flags[flag]},${next}` : next;
  }
  return { positional, flags };
}

function inForce(root, env) {
  const r = mp.resolvePreset({ root, env });
  return { preset: r.preset, source: r.source, ignored: r.ignored };
}

function show(root, env) {
  const r = mp.resolvePreset({ root, env });
  return {
    preset: r.preset,
    source: r.source,
    ignored: r.ignored,
    seats: r.seats,
    profilePath: mp.profileFile(env),
    repoPath: path.join(root, '.claude', 'nexus-agents.json'),
    presets: mp.presetNames().map((name) => ({ name, runs: mp.describeRows(name) })),
  };
}

const commaList = (value) => value ? value.split(',').map((word) => word.trim()).filter(Boolean) : [];

function readers(root, env, flags) {
  const resolved = mp.resolvePreset({ root, env });
  if (!flags.job || !Object.hasOwn(mp.table().presets.speed.lists, flags.job)) throw new Refusal('--job needs a known reader job');
  if (!['available', 'absent'].includes(flags.codex)) throw new Refusal('--codex needs available or absent');
  if (flags.count && !['1', '2', '3'].includes(flags.count)) throw new Refusal('--count needs 1, 2 or 3');
  const authors = commaList(flags.author);
  if (!authors.length) throw new Refusal('--author needs one or more models');
  return mp.readersFor(resolved, flags.job, {
    ...mp.codexAccount(env),
    authors,
    codex: flags.codex,
    dropped: commaList(flags.dropped),
    pick: commaList(flags.pick),
    count: Number(flags.count || 2),
    authorFill: !flags['no-author-fill'],
  });
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

function runParsed({ positional, flags }, env) {
  const root = typeof flags.root === 'string' ? flags.root : env.CLAUDE_PROJECT_DIR || process.cwd();
  const [first, ...rest] = positional;
  const unknownFlag = Object.keys(flags).find((f) => first === 'readers' ? !READER_FLAGS.has(f) : f !== 'root' && f !== 'repo');
  if (unknownFlag) throw new Refusal(`unknown option --${unknownFlag}`);
  if (first === 'readers') {
    if (rest.length) throw new Refusal('readers takes only options');
    return readers(root, env, flags);
  }
  if (!first || first === 'show') {
    if (rest.length || flags.repo) throw new Refusal('show takes no other words');
    return show(root, env);
  }
  const words = first === 'set' ? rest : positional;
  if (words.length !== 1) throw new Refusal(`set needs one preset name — one of: ${mp.presetNames().join(', ')}`);
  return set(words[0], { repo: flags.repo === true }, root, env);
}

const run = (argv, env = process.env) => runParsed(parse(argv), env);

if (require.main === module) {
  try {
    const input = parse(process.argv.slice(2));
    const out = runParsed(input, process.env);
    if (input.positional[0] === 'readers' && !input.flags.json) {
      for (const slot of out.slots) process.stdout.write(`${slot.model}${slot.effort ? ` at ${slot.effort}` : ''}\n`);
      if (!out.slots.length) process.stdout.write('No reader available\n');
      if (out.authorLeads) process.stdout.write('An author leads\n');
    } else process.stdout.write(JSON.stringify(out) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: String((e && e.message) || e) }) + '\n');
    process.exitCode = e instanceof Refusal ? 2 : 1;
  }
}

module.exports = { run };
