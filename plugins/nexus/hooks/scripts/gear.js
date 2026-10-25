#!/usr/bin/env node
/**
 * Nexus gear: the command line over lib/gears.js.
 *
 *   node gear.js show
 *   node gear.js set <name>                      the repo gear, in .claude/nexus-agents.json
 *   node gear.js next <name>                     the next feature's gear, for this session only
 *   node gear.js begin --slug <s> [--campaign <name|off>]
 *   node gear.js fix --slug <s>                  prints the plan header line
 *   node gear.js close --slug <s>
 *   node gear.js value --setting <n> [--slug <s>] [--role <agent>] [--explicit <value>]
 *
 * Every call takes --root (default CLAUDE_PROJECT_DIR, else the working folder — run it from the
 * session root, as the Codex job helper is run), --tree (default the session's .worktree-target
 * line, else the root) and --session (default CLAUDE_CODE_SESSION_ID).
 *
 * Every call prints one JSON object. Exit 2 is a refused input, printed as `{error}` naming the fix;
 * exit 1 an unexpected failure. A single argument holding spaces is split, so a command file can pass
 * the user's whole argument line as one quoted word.
 */
'use strict';
const gears = require('./lib/gears');
const { resolveDeclaredTree } = require('./lib/worktree-target');

const SUBCOMMANDS = ['show', 'set', 'next', 'begin', 'fix', 'close', 'value'];

function parse(argv) {
  const words = argv.length === 1 && /\s/.test(argv[0]) ? argv[0].trim().split(/\s+/) : argv.filter((a) => a !== '');
  const positional = [];
  const flags = {};
  for (let i = 0; i < words.length; i++) {
    const a = words[i];
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const next = words[i + 1];
    if (next === undefined || next.startsWith('--')) flags[a.slice(2)] = true;
    else { flags[a.slice(2)] = next; i++; }
  }
  return { positional, flags };
}

function run(argv, env = process.env) {
  const { positional, flags } = parse(argv);
  const sub = positional[0] || 'show';
  if (!SUBCOMMANDS.includes(sub)) throw new gears.GearError(`unknown command "${sub}" — use one of: ${SUBCOMMANDS.join(', ')}`);
  const root = typeof flags.root === 'string' ? flags.root : env.CLAUDE_PROJECT_DIR || process.cwd();
  const session = typeof flags.session === 'string' ? flags.session : String(env.CLAUDE_CODE_SESSION_ID || '');
  const tree = typeof flags.tree === 'string' ? flags.tree : resolveDeclaredTree(root, session);
  const o = { root, tree, session, env };
  const needSlug = () => {
    if (typeof flags.slug !== 'string') throw new gears.GearError(`${sub} needs --slug <slug>`);
    return flags.slug;
  };
  const needName = () => {
    if (!positional[1]) throw new gears.GearError(`${sub} needs a gear name — one of the gears \`show\` lists`);
    return positional[1];
  };
  switch (sub) {
    case 'show': return gears.show(o);
    case 'set': return gears.setRepoGear({ ...o, name: needName() });
    case 'next': return gears.next({ ...o, name: needName() });
    case 'begin': return gears.begin({ ...o, slug: needSlug(), campaign: typeof flags.campaign === 'string' ? flags.campaign : undefined });
    case 'fix': return gears.fix({ ...o, slug: needSlug() });
    case 'close': return gears.close({ ...o, slug: needSlug() });
    default:
      if (flags.setting === undefined) throw new gears.GearError('value needs --setting <row number>');
      return gears.valueOf({
        ...o,
        setting: flags.setting,
        slug: typeof flags.slug === 'string' ? flags.slug : undefined,
        role: typeof flags.role === 'string' ? flags.role : undefined,
        explicit: typeof flags.explicit === 'string' ? flags.explicit : undefined,
      });
  }
}

if (require.main === module) {
  try {
    process.stdout.write(JSON.stringify(run(process.argv.slice(2))) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: String((e && e.message) || e) }) + '\n');
    process.exitCode = e instanceof gears.GearError ? 2 : 1;
  }
}

module.exports = { run, parse };
