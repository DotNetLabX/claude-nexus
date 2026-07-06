// skill-lint.mjs (improve-skills' deterministic gate, ADR-23): a scaffolded or fixed
// skill must be born compliant — frontmatter valid, no BOM, no dangling references.
// Born as TDD reds. Evidence: docs/evidence/2026-06-11-omnishelf-job-fitness.md (H1-H3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { pluginRoot, run, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const LINT = join(pluginRoot('nexus'), 'skills', 'improve-skills', 'scripts', 'skill-lint.mjs');
const lint = (...args) => run(process.execPath, [LINT, ...args]);

function makeSkill(name, skillMd, extra = {}) {
  const dir = join(makeSandbox('skill-lint-'), name);
  mkdirSync(dir, { recursive: true });
  if (skillMd !== null) {
    writeFileSync(join(dir, 'SKILL.md'), skillMd, { encoding: 'utf8' });
  }
  for (const [rel, content] of Object.entries(extra)) {
    const p = join(dir, rel);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, content, { encoding: 'utf8' });
  }
  return dir;
}

const GOOD = `---
name: good-skill
description: Scaffolds the widget integration pattern for this project. Use when adding a new widget endpoint.
---

# Good Skill

## Steps

1. Read \`references/template.md\` and apply it.
`;

test('a compliant skill passes (exit 0)', () => {
  const dir = makeSkill('good-skill', GOOD, { 'references/template.md': '# T\n' });
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, /OK/);
});

test('a UTF-8 BOM is an error', () => {
  const dir = makeSkill('good-skill', '﻿' + GOOD, { 'references/template.md': '# T\n' });
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /BOM/i);
});

test('frontmatter name must match the folder name', () => {
  const dir = makeSkill('other-name', GOOD, { 'references/template.md': '# T\n' });
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /name/i);
});

test('a missing description is an error', () => {
  const md = `---\nname: no-desc\n---\n\n# No Desc\n`;
  const dir = makeSkill('no-desc', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /description/i);
});

test('missing frontmatter entirely is an error', () => {
  const dir = makeSkill('bare', '# Bare\n\nNo frontmatter at all.\n');
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /frontmatter/i);
});

test('a dangling relative reference is an error', () => {
  const md = `---\nname: dangler\ndescription: A skill whose SKILL.md cites a reference file that does not exist on disk.\n---\n\n# Dangler\n\nApply \`references/missing-template.md\` to the target.\n`;
  const dir = makeSkill('dangler', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /references\/missing-template\.md/);
});

test('a missing SKILL.md is an error', () => {
  const dir = makeSkill('empty-folder', null);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /SKILL\.md/);
});

test('a thin description warns but does not fail', () => {
  const md = `---\nname: thin\ndescription: Does things.\n---\n\n# Thin\n`;
  const dir = makeSkill('thin', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.match(res.stdout, /WARN/);
});

test('no arguments prints usage and exits 2', () => {
  const res = lint();
  assert.equal(res.status, 2);
  assert.match(res.stderr + res.stdout, /usage/i);
});

test('multiple folders: one bad folder fails the run, all are reported', () => {
  const good = makeSkill('good-skill', GOOD, { 'references/template.md': '# T\n' });
  const bad = makeSkill('no-desc', `---\nname: no-desc\n---\n\n# X\n`);
  const res = lint(good, bad);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /OK/);
  assert.match(res.stdout, /ERROR/);
});

test('an XML-tag-shaped token in prose is an error', () => {
  const md = `---\nname: tagger\ndescription: A skill that demonstrates the angle-bracket placeholder problem in its body prose.\n---\n\n# Tagger\n\nReplace <placeholder> with the real value.\n`;
  const dir = makeSkill('tagger', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /angle|XML/i);
});

test('angle-bracket tokens inside fenced code blocks are allowed', () => {
  const md = `---\nname: coder\ndescription: A skill whose fenced code examples legitimately contain generic type parameters and tags.\n---\n\n# Coder\n\n\`\`\`csharp\nList<string> items = Build<MyType>();\n\`\`\`\n\nAnd inline \`Dictionary<int, string>\` is fine too.\n`;
  const dir = makeSkill('coder', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
});

test('mojibake markers are an error', () => {
  const md = `---\nname: mojibake\ndescription: A skill whose body carries the classic UTF-8-read-as-1252 smart-quote sequence from a bad save.\n---\n\n# Mojibake\n\nThe userâ€™s data is loaded first.\n`;
  const dir = makeSkill('mojibake', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /mojibake/i);
});

test('an overlong description warns but does not fail', () => {
  const md = `---\nname: longdesc\ndescription: ${'This sentence pads the description well past the cap. '.repeat(25)}\n---\n\n# Long\n`;
  const dir = makeSkill('longdesc', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.match(res.stdout, /WARN/);
});

test('a repo-level path containing references/ is not treated as skill-relative', () => {
  const md = `---\nname: pathy\ndescription: A skill citing another skill's reference file by its full repo path, which must not be checked locally.\n---\n\n# Pathy\n\nSee \`plugins/nexus/skills/other/references/elsewhere.md\` for the source.\n`;
  const dir = makeSkill('pathy', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
});

// E6 widened (adhoc-UtilitySkillsHardening): scripts/ and assets/ file-shaped citations
// are checked; a citation passes if it resolves skill-relative OR at the .git-anchored repo root.
test('a dangling file-shaped scripts/ citation is an error', () => {
  const md = `---\nname: scripter\ndescription: A skill citing a bundled post-condition script that does not exist on disk anywhere, which must error.\n---\n\n# Scripter\n\nRun \`scripts/does-not-exist-xyz.mjs\` as the post-condition check.\n`;
  const dir = makeSkill('scripter', md);
  const res = lint(dir);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /scripts\/does-not-exist-xyz\.mjs/);
});

test('a file-shaped scripts/ citation resolving at the .git-anchored repo root passes', () => {
  const md = `---\nname: rooted\ndescription: A skill citing a repo-root script that exists at the nearest .git ancestor, resolved via the repo-root fallback rather than skill-relative.\n---\n\n# Rooted\n\nThe engine lives in \`scripts/tool.mjs\` at the repo root.\n`;
  const dir = makeSkill('rooted', md, { '../.git/HEAD': 'ref: refs/heads/main\n', '../scripts/tool.mjs': '// tool\n' });
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.match(res.stdout, /OK/);
});

test('a directory-shaped assets/ citation is anatomy, not a file cite — no error', () => {
  const md = `---\nname: flutterish\ndescription: A skill describing where to place a custom SVG asset using a directory-shaped path that is anatomy, not a file citation to check.\n---\n\n# Flutterish\n\nAdd the asset under \`assets/icons/\`, then wire an AppPaths const.\n`;
  const dir = makeSkill('flutterish', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
});

test('a slash-preceded file-shaped assets/ citation (even inside a code block) is skipped by the lookbehind', () => {
  // Carry-forward pin (tailwind-theme:16): E6 scans the FULL text incl. code blocks, so the
  // (?<![\w/]) lookbehind — not the file-shaped filter — is what keeps a `/`-preceded cite safe.
  const md = `---\nname: themey\ndescription: A skill whose body shows a CSS import path in a fenced code block; its assets segment is slash-preceded so the lookbehind skips it.\n---\n\n# Themey\n\n\`\`\`css\n/* client/src/assets/main.css */\n@import "tailwindcss";\n\`\`\`\n`;
  const dir = makeSkill('themey', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
});

test('a placeholder-prefixed {folder}/scripts/ citation is skipped by the lookbehind', () => {
  const md = `---\nname: placeholdery\ndescription: A skill citing its own bundled script through a placeholder-prefixed path whose scripts segment is slash-preceded and thus skipped.\n---\n\n# Placeholdery\n\nRun \`node {skill folder}/scripts/tool.mjs\` as the deterministic gate.\n`;
  const dir = makeSkill('placeholdery', md);
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
});

// W3 body-size (adhoc-UtilitySkillsHardening): a SKILL.md body over 500 lines WARNs (never errors).
const bodyOf = (n) => Array.from({ length: n }, (_, i) => `Body line ${i}`).join('\n');
const withBody = (name, n) => `---\nname: ${name}\ndescription: A skill with a deliberately sized body used to exercise the progressive-disclosure body-size warning threshold.\n---\n${bodyOf(n)}\n`;

test('a SKILL.md body over 500 lines warns but does not fail', () => {
  const dir = makeSkill('bigbody', withBody('bigbody', 501));
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.match(res.stdout, /WARN/);
  assert.match(res.stdout, /500/);
});

test('a SKILL.md body of exactly 500 lines does not warn', () => {
  const dir = makeSkill('okbody', withBody('okbody', 500));
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.doesNotMatch(res.stdout, /WARN/);
});

// W4 nested references (adhoc-UtilitySkillsHardening): a cited references/*.md that itself cites
// another references/ file is two levels deep — WARN naming the chain (references-only scope).
test('a cited reference that cites another references/ file warns (naming the chain)', () => {
  const md = `---\nname: nesting\ndescription: A skill whose cited reference file itself cites a second reference file, which the nested-reference canon warning must flag by chain.\n---\n\n# Nesting\n\nApply \`references/parent.md\` to the target.\n`;
  const dir = makeSkill('nesting', md, {
    'references/parent.md': '# Parent\n\nSee also `references/child.md` for the deeper detail.\n',
    'references/child.md': '# Child\n',
  });
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.match(res.stdout, /WARN/);
  assert.match(res.stdout, /references\/parent\.md/);
  assert.match(res.stdout, /references\/child\.md/);
});

test('a cited reference that cites workflows/ or scripts/ does not trip W4 (references-only scope)', () => {
  const md = `---\nname: noscope\ndescription: A skill whose cited reference file cites workflows and scripts paths, which the references-only W4 scope must deliberately not flag.\n---\n\n# Noscope\n\nApply \`references/guide.md\` to the target.\n`;
  const dir = makeSkill('noscope', md, {
    'references/guide.md': '# Guide\n\nRun `scripts/tool.mjs` and read `workflows/Template.md` next.\n',
  });
  const res = lint(dir);
  assert.equal(res.status, 0, res.stdout);
  assert.doesNotMatch(res.stdout, /nested reference/);
});

// Dogfood: every shipped nexus skill must pass its own lint.
test('all shipped nexus skills are lint-clean', () => {
  const skillsDir = join(pluginRoot('nexus'), 'skills');
  const dirs = readdirSync(skillsDir)
    .map((d) => join(skillsDir, d))
    .filter((d) => existsSync(join(d, 'SKILL.md')));
  const res = lint(...dirs);
  assert.equal(res.status, 0, res.stdout);
});

test.after(() => cleanupSandboxes());
