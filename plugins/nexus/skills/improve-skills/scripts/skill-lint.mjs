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
//   E6  cited reference files exist — references/ and workflows/ (any shape), plus file-shaped
//       scripts/ and assets/ paths; resolved skill-relative OR at the .git-anchored repo root
//   E7  no XML-tag-shaped tokens in prose (use {placeholder}, never <placeholder>) — code blocks exempt
//   E8  no mojibake markers (U+FFFD, UTF-8-as-1252 sequences) — the bad-save signature
//   W1  description shorter than 40 chars — too vague for auto-invocation
//   W2  description longer than 1024 chars — bloats every auto-invocation scan
//   W3  SKILL.md body over 500 lines — suggest a progressive-disclosure references/ split
//   W4  a cited references/*.md that itself cites another references/ file (canon: one level deep)
// Errors exit 1; warnings alone exit 0; no arguments exits 2.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node skill-lint.mjs <skill-folder> [<skill-folder>...]');
  process.exit(2);
}

// Repo root = nearest ancestor of the skill folder that contains a `.git`. Deterministic from any
// invocation directory — never process.cwd(), which would make the exit code caller-cwd-dependent.
function findRepoRoot(startDir) {
  let cur = startDir;
  for (;;) {
    if (existsSync(join(cur, '.git'))) return cur;
    const parent = dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

// A cited path's last segment is file-shaped when it contains a dot (`scripts/x.mjs`); a
// directory-shaped path (`assets/icons/`) is anatomy description, not a file citation.
function isFileShaped(ref) {
  const last = ref.replace(/\/+$/, '').split('/').pop();
  return last.includes('.');
}

let failed = false;

for (const arg of args) {
  const dir = resolve(arg);
  const name = basename(dir);
  const repoRoot = findRepoRoot(dir);
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
      else if (data.description.length > 1024) warnings.push('description is overlong (>1024 chars) — every auto-invocation scan pays for it; move detail into the body');

      // W3 — a SKILL.md body (after the frontmatter block) over 500 lines should adopt progressive
      // disclosure. WARN, never ERROR: a long body can be justified, so the author decides.
      const body = text.slice(fm[0].length);
      const bodyLines = body.replace(/\r?\n$/, '').split(/\r?\n/).length;
      if (bodyLines > 500) {
        warnings.push(`SKILL.md body is ${bodyLines} lines (over 500) — split durable material into references/ for progressive disclosure, or record why the length is justified`);
      }
    }

    // E6 — cited files must exist somewhere real. A citation resolves if it exists skill-relative
    // (`join(dir, ref)`) OR at the repo root (nearest `.git` ancestor) — so a repo-level path like
    // `scripts/bump-plugin.mjs` in release-plugin's prose passes deterministically from any cwd.
    // Four folders are read (references/, workflows/, scripts/, assets/); the two new ones are
    // checked only when file-shaped so directory anatomy like `assets/icons/` is not flagged. The
    // lookbehind skips segments inside longer paths (`skills/other/references/x.md`, `src/assets/x`).
    const refs = new Set();
    for (const m of text.matchAll(/(?<![\w/])(?:references|workflows|scripts|assets)\/[\w.-][\w./-]*/g)) {
      refs.add(m[0].replace(/[.,;:]+$/, ''));
    }
    for (const ref of refs) {
      const folder = ref.split('/', 1)[0];
      // scripts/ and assets/ are checked only when file-shaped: a directory-shaped path there
      // (`assets/icons/`) is anatomy, not a file citation. references/ and workflows/ keep their
      // existing shape-agnostic check. A directory-shaped *fictional* cite escapes by design.
      if ((folder === 'scripts' || folder === 'assets') && !isFileShaped(ref)) continue;
      const found = existsSync(join(dir, ref)) || (repoRoot && existsSync(join(repoRoot, ref)));
      if (!found) errors.push(`dangling reference: ${ref} is cited in SKILL.md but not on disk`);
    }

    // W4 — a cited references/*.md that itself cites another references/ file is two levels deep.
    // Scope is references/-ONLY (never the widened four-folder regex): workflows/ and scripts/
    // chains inside a reference are legitimate. WARN naming the chain so the author can flatten it.
    for (const ref of refs) {
      if (!/^references\/[\w./-]+\.md$/.test(ref)) continue;
      const refPath = existsSync(join(dir, ref)) ? join(dir, ref)
        : (repoRoot && existsSync(join(repoRoot, ref)) ? join(repoRoot, ref) : null);
      if (!refPath) continue; // dangling — already reported by E6
      const nested = new Set();
      for (const m of readFileSync(refPath, 'utf8').matchAll(/(?<![\w/])references\/[\w.-][\w./-]*/g)) {
        nested.add(m[0].replace(/[.,;:]+$/, ''));
      }
      for (const n of nested) {
        warnings.push(`nested reference: ${ref} cites ${n} — canon keeps references one level deep from SKILL.md; inline it or flatten the chain`);
      }
    }

    // E7 — XML-tag-shaped tokens confuse loaders and models; placeholders are {curly}.
    // Prose only: fenced code blocks and inline code spans are legitimate tag/generic homes.
    const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    const tag = prose.match(/<\/?[A-Za-z][\w-]*(?:\s[^<>]*)?>/);
    if (tag) errors.push(`XML/angle-bracket token in prose (${tag[0]}) — use {placeholder} style; tags are only safe inside code blocks`);

    // E8 — mojibake signatures: the replacement char, or UTF-8 smart quotes read as cp1252.
    if (/�|â€/.test(text)) errors.push('mojibake marker found (bad-encoding save signature) — rewrite the file as clean UTF-8');
  }

  for (const e of errors) console.log(`ERROR ${name}: ${e}`);
  for (const w of warnings) console.log(`WARN  ${name}: ${w}`);
  if (!errors.length) console.log(`OK    ${name}${warnings.length ? ' (with warnings)' : ''}`);
  if (errors.length) failed = true;
}

process.exit(failed ? 1 : 0);
