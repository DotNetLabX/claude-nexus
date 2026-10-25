#!/usr/bin/env node
/**
 * Nexus spec source check — the command form of lib/spec-sources.js.
 *
 *   node spec-sources.js --spec {path} [--base {git ref}]
 *
 * Prints one JSON object, `{ ok, missing, pending }` — `ok` true or false, the other two lists of rule
 * ids — and exits 0 when clean, 1 when a rule is `missing` (no source marker, or a kind outside the six)
 * or `pending` (an `added` rule the owner has not kept), 2 when the spec cannot be read or no `--spec`
 * is given.
 *
 * The marker grammar's home is the spec template, skills/create-feature-spec/workflows/Template.md
 * § Business Rules. Two callers run the same check: pipeline-gate.js invariant (10) refuses a
 * foreground write that flips a spec to Ready, and this command is run by the PO, by the architect on
 * a technical definition, and by the team lead before it spawns the architect for the plan — the
 * gate never reaches a spawned PO or architect. Callers find it beside verify-run.js.
 *
 * `--base HEAD` reads the spec's committed version: where it reads Ready or Done, only rules whose
 * text is new or changed are checked. Fail-open edges: without `--base`, where the ref does not hold
 * the path, or where git cannot answer at all, every rule is checked — a command that is asked to
 * check never narrows itself on an uncertainty. Where git cannot answer, the object also carries
 * `base: "error"`, so the caller knows the base was not read.
 */
'use strict';
const fs = require('fs');
const { checkSpec, readCommitted } = require('./lib/spec-sources');

function out(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

const args = process.argv.slice(2);
const value = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

const spec = value('--spec');
if (!spec) out({ ok: false, missing: [], pending: [], error: 'usage: spec-sources.js --spec {path} [--base {git ref}]' }, 2);

let text;
try { text = fs.readFileSync(spec, 'utf8'); } catch {
  out({ ok: false, missing: [], pending: [], error: `cannot read ${spec}` }, 2);
}

const ref = value('--base');
const base = ref ? readCommitted(spec, ref, { timeoutMs: 10000 }) : null;
const { ok, missing, pending } = checkSpec(text, base && base.status === 'text' ? base.text : null);
out({ ok, missing, pending, ...(base && base.status === 'error' ? { base: 'error' } : {}) }, ok ? 0 : 1);
