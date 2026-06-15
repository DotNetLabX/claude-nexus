#!/usr/bin/env node
// cite-check.mjs — the deterministic cite-or-drop gate for a research-pool entry.
//
// Usage: node cite-check.mjs <entry.md>
//
// The post-generation enforcement layer for the search-researches skill (plan Step 3): a
// prompt instruction to "cite every claim" is a request; this check is the enforcement that
// runs before an entry is persisted. Keyed on the research-entry-schema claim grammar (Step 1):
//   - Every claim line under ## Finding / ## Fix / ## Alternatives ends with an inline [n]
//     reference resolving to a ## Sources entry, OR the literal token [no source found].
//   - Claim sections carry claims as bullets only — a non-bullet (prose) claim line there is
//     malformed and fails.
//   - ## Sources entries are linked URLs/paths, never a bare placeholder (TODO / TBD / [source]).
//   - A high-stakes verdict whose Corroboration shows a single source fails.
//
// A topic file accumulates many entry blocks (supersede-don't-delete keeps superseded blocks —
// multi-block is the steady state per research-entry-schema). The block delimiter is the
// per-entry `## {Question answered}` heading: every entry opens with its question heading +
// metadata block, then the fixed 8-part body. So source-resolution AND the corroboration floor
// are scoped PER-BLOCK — a later block's `[1]` must not satisfy an earlier block's `[1]`, and
// every block's Corroboration is checked (not just the first).
// Exit 0 = clean; exit 1 = one or more violations (printed); exit 2 = bad usage.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('usage: node cite-check.mjs <entry.md>');
  process.exit(2);
}

const file = resolve(args[0]);
if (!existsSync(file)) {
  console.error(`cite-check: file not found: ${file}`);
  process.exit(2);
}

const text = readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);

// The three sections that carry cited claims.
const CLAIM_SECTIONS = new Set(['Finding', 'Fix', 'Alternatives']);
// The fixed 8-part body section names (research-entry-schema). A `## ` heading whose title is
// NOT one of these is a `## {Question answered}` heading — i.e. the start of a new entry block.
const BODY_SECTIONS = new Set([
  'Verdict', 'Finding', 'Fix', 'Alternatives', 'Caveat', 'Fallback', 'Sources', 'Recommendation',
]);

const violations = [];

// Section headings the grammar cares about. A "## X" line opens section X; the next "## " re-evaluates.
function sectionOf(heading) {
  const m = heading.match(/^##\s+(.+?)\s*$/);
  return m ? m[1] : null;
}

// ── pass 1: split the file into per-entry blocks ──────────────────────────────
// A block boundary is a `## ` heading that is NOT a body-section name (it is the question
// heading). Each block carries its own line range; any preamble before the first question
// heading (e.g. the leading `# {topic}` title) is not a block and is ignored.
const blocks = []; // { startLine, lines: [{ raw, lineNo }] }
{
  let current = null;
  lines.forEach((raw, idx) => {
    if (/^##\s+/.test(raw) && !BODY_SECTIONS.has(sectionOf(raw))) {
      // new question heading → open a new block
      current = { startLine: idx + 1, lines: [] };
      blocks.push(current);
    }
    if (current) current.lines.push({ raw, lineNo: idx + 1 });
  });
}

// A ## Sources entry must be a real linked URL/path — never a bare placeholder.
const PLACEHOLDER = /^(TODO|TBD|\[source\])\.?$/i;

for (const block of blocks) {
  // ── per-block pass A: collect this block's ## Sources [n] ids and target text ──
  const sources = new Map(); // n -> the rest of the line (the link/path/placeholder)
  {
    let inSources = false;
    for (const { raw } of block.lines) {
      if (/^##\s+/.test(raw)) { inSources = sectionOf(raw) === 'Sources'; continue; }
      if (!inSources) continue;
      const m = raw.match(/^\s*\[(\d+)\]\s*(.*)$/);
      if (m) sources.set(m[1], m[2].trim());
    }
  }

  // placeholder check, scoped to this block's sources
  for (const [n, target] of sources) {
    if (!target || PLACEHOLDER.test(target)) {
      violations.push(`## Sources entry [${n}] is a bare placeholder ("${target || '(empty)'}") — link a real URL or path`);
    }
  }

  // ── per-block pass B: every claim line under a claim section is cited ──────────
  {
    let section = null;
    for (const { raw } of block.lines) {
      if (/^##\s+/.test(raw)) { section = sectionOf(raw); continue; }
      if (!section || !CLAIM_SECTIONS.has(section)) continue;
      const line = raw.trim();
      if (!line) continue; // blank lines are framing, not claims

      // The schema mandates claims-as-bullets under a claim section. A non-blank, non-bullet
      // line here is a malformed prose claim — reject it rather than skip it (the bypass bug).
      if (!line.startsWith('- ')) {
        violations.push(`non-bullet (prose) line under ## ${section} — claims must be bullets: "${line}"`);
        continue;
      }
      const claim = line.slice(2).trim();
      if (!claim) continue;

      // The citation may be followed by sentence-final punctuation ("... API [1]." or "[1],").
      if (/\[no source found\][.,;:)\s]*$/.test(claim)) continue; // honest no-source escape hatch
      const ref = claim.match(/\[(\d+)\][.,;:)\s]*$/);
      if (!ref) {
        violations.push(`claim under ## ${section} has no source and no [no source found]: "${claim}"`);
      } else if (!sources.has(ref[1])) {
        violations.push(`claim under ## ${section} cites [${ref[1]}] but no ## Sources entry [${ref[1]}] exists in this block: "${claim}"`);
      }
    }
  }

  // ── per-block pass C: high-stakes verdict needs a second independent source ────
  // High-stakes is declared in this block's Corroboration metadata field; a single-source
  // value fails. Every block is checked (filter-per-block, not the first match file-wide).
  {
    const corrLine = block.lines.find(({ raw }) => /^\*\*Corroboration:\*\*/.test(raw.trim()));
    if (corrLine) {
      const val = corrLine.raw.replace(/^\s*\*\*Corroboration:\*\*/, '').trim();
      const highStakes = /high-stakes/i.test(val);
      // a "second independent source agreed" phrasing, or a count >= 2, satisfies the floor
      const secondAgreed = /second\s+(independent\s+)?source\s+agreed/i.test(val);
      const countMatch = val.match(/(\d+)\s*source/i);
      const count = countMatch ? parseInt(countMatch[1], 10) : null;
      const singleSource = (count !== null && count < 2) && !secondAgreed;
      if (highStakes && singleSource) {
        violations.push(`high-stakes verdict has a single source in Corroboration ("${val}") — record a second independent source`);
      }
    }
  }
}

if (violations.length) {
  for (const v of violations) console.log(`CITE-FAIL ${v}`);
  process.exit(1);
}
console.log(`OK ${file} — every claim cited`);
process.exit(0);
