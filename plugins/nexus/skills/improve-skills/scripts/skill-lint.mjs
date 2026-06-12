#!/usr/bin/env node
// skill-lint.mjs — the deterministic gate for the improve-skills meta-loop (ADR-23).
//
// Usage: node skill-lint.mjs <skill-folder> [<skill-folder>...]
//
// A skill the meta-loop writes must be BORN COMPLIANT — a defect in a skill propagates
// into every run that follows it. Checks per folder:
//   E1  SKILL.md exists
//   E2  no BOM (UTF-8 or UTF-16) — shell-redirection saves on Windows break frontmatter parsing
//   E3  frontmatter block present (--- fenced)
//   E4  frontmatter name: present and equal to the folder name
//   E5  frontmatter description: present
//   E6  relative reference files cited in the body (references/, workflows/) exist on disk
//   W1  description shorter than 40 chars — too vague for auto-invocation
// Errors exit 1; warnings alone exit 0; no arguments exits 2.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node skill-lint.mjs <skill-folder> [<skill-folder>...]');
  process.exit(2);
}

let failed = false;

for (const arg of args) {
  const dir = resolve(arg);
  const name = basename(dir);
  const errors = [];
  const warnings = [];
  const skillPath = join(dir, 'SKILL.md');

  if (!existsSync(skillPath)) {
    errors.push('SKILL.md not found');
  } else {
    const buf = readFileSync(skillPath);
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      errors.push('SKILL.md starts with a UTF-8 BOM — rewrite as UTF-8 without BOM (use the Write tool, never shell redirection)');
    } else if (buf.length >= 2 && ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff))) {
      errors.push('SKILL.md has a UTF-16 BOM — rewrite as UTF-8 without BOM (use the Write tool, never shell redirection)');
    }

    const text = buf.toString('utf8').replace(/^﻿/, '');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (!fm) {
      errors.push('no frontmatter block (--- fenced) at the top of SKILL.md');
    } else {
      const data = {};
      for (const line of fm[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (kv) data[kv[1]] = kv[2].trim();
      }
      if (!data.name) errors.push('frontmatter has no name:');
      else if (data.name !== name) errors.push(`frontmatter name "${data.name}" does not match the folder name "${name}"`);
      if (!data.description) errors.push('frontmatter has no description:');
      else if (data.description.length < 40) warnings.push('description is thin (<40 chars) — say what the skill does AND when to use it, or auto-invocation will miss it');
    }

    // E6 — files the body cites relative to the skill folder must exist. Scoped to the
    // folders a skill legitimately ships (references/, workflows/) so repo-level paths
    // like `scripts/bump-plugin.mjs` in prose don't false-positive.
    const refs = new Set();
    for (const m of text.matchAll(/\b(?:references|workflows)\/[\w.-][\w./-]*/g)) {
      refs.add(m[0].replace(/[.,;:]+$/, ''));
    }
    for (const ref of refs) {
      if (!existsSync(join(dir, ref))) errors.push(`dangling reference: ${ref} is cited in SKILL.md but not on disk`);
    }
  }

  for (const e of errors) console.log(`ERROR ${name}: ${e}`);
  for (const w of warnings) console.log(`WARN  ${name}: ${w}`);
  if (!errors.length) console.log(`OK    ${name}${warnings.length ? ' (with warnings)' : ''}`);
  if (errors.length) failed = true;
}

process.exit(failed ? 1 : 0);
