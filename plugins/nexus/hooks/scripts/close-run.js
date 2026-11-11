#!/usr/bin/env node
/**
 * Nexus close-run: a feature's plain close sequence as one command, run from the main session's root.
 *
 *   node close-run.js before --slug <slug> --session <id> [--tree <path>] [--message-file <path>]
 *                            [--paths-file <path>] [--exclude <path>]... [--record-cmd "<command>"]
 *                            [--until <stage>] [--settled] [--restart]
 *   node close-run.js after  --slug <slug> --session <id> --message-file <path> [--tree <path>]
 *                            [--paths-file <path>] [--exclude <path>]... [--record-cmd "<command>"]
 *                            [--backlog-status "<text>"] [--merge] [--push] [--until <stage>] [--settled] [--restart]
 *
 * `before` runs the stages commits, commit, merge-in, release, tests, record; `after` runs record, backlog,
 * commit, merge, push. The stages, the staging rule, the saved progress and the exit codes are lib/close-run.js's.
 */
'use strict';
const { main } = require('./lib/close-run');

process.exitCode = main(process.argv.slice(2));
