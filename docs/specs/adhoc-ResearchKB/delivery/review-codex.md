## NO-GO
The skill and rule prose mostly match the plan, but `cite-check.mjs` misses required claim validation and mishandles multi-entry topic files.

| Severity | File | Issue |
| --- | --- | --- |
| BLOCKER | `plugins/nexus/skills/search-researches/scripts/cite-check.mjs` | Uncited prose claim lines under `## Finding` / `## Fix` / `## Alternatives` are skipped entirely because the validator only inspects trimmed `- ` bullets. |
| BLOCKER | `plugins/nexus/skills/search-researches/scripts/cite-check.mjs` | Validation is file-global instead of per Q&A block: sources from earlier blocks satisfy later claims, duplicate `[n]` ids are overwritten, and only the first `**Corroboration:**` line is checked. |
| MAJOR | `tests/unit/cite-check.test.mjs` | Coverage misses the blocker cases and several required grammar edges: uncited prose claim lines, multi-block topic files, cross-block source leakage / duplicate ids, multi-digit refs, out-of-range refs, `TBD`, `[source]`, and heading/blank-line skip behavior. |

## BLOCKER: Uncited prose claim lines are skipped
The spec requires every claim line under `## Finding`, `## Fix`, and `## Alternatives` to end with `[n]` or `[no source found]` (`docs/specs/adhoc-ResearchKB/delivery/plan.md:80-83`, `plugins/nexus/skills/research-entry-schema/SKILL.md:69-71`). The implementation narrows that to bullets only, so a plain sentence under `## Finding` currently exits `0`.

Offending lines:
`plugins/nexus/skills/search-researches/scripts/cite-check.mjs:67-70`
```js
const line = raw.trim();
// Only bullet/claim lines carry claims; blank lines and prose framing are skipped.
if (!line.startsWith('- ')) continue;
const claim = line.slice(2).trim();
```

## BLOCKER: Validation is not scoped per Q&A block
`search-researches` explicitly allows multiple Q&A blocks in one topic file (`plugins/nexus/skills/search-researches/SKILL.md:96-99`). `cite-check.mjs` flattens every `## Sources` section into one `Map` and reads only the first `**Corroboration:**` line in the file, so later blocks can pass with the wrong sources or with an unchecked high-stakes single-source verdict. I verified both failure modes with two-block fixtures: block 2 was allowed to cite `[1]` defined only in block 1, and block 2 `**Corroboration:** high-stakes; 1 source` also exited `0`.

Offending lines:
`plugins/nexus/skills/search-researches/scripts/cite-check.mjs:42-50`
```js
const sources = new Map(); // n -> the rest of the line (the link/path/placeholder)
...
const m = raw.match(/^\s*\[(\d+)\]\s*(.*)$/);
if (m) sources.set(m[1], m[2].trim());
```

`plugins/nexus/skills/search-researches/scripts/cite-check.mjs:78-79`
```js
} else if (!sources.has(ref[1])) {
  violations.push(`claim under ## ${section} cites [${ref[1]}] but no ## Sources entry [${ref[1]}] exists: "${claim}"`);
}
```

`plugins/nexus/skills/search-researches/scripts/cite-check.mjs:87-97`
```js
const corr = lines.find((l) => /^\*\*Corroboration:\*\*/.test(l.trim()));
...
if (highStakes && singleSource) {
  violations.push(`high-stakes verdict has a single source in Corroboration ("${val}") — record a second independent source`);
}
```

## MAJOR: Test coverage misses required grammar edges
The suite currently covers only seven cases (`tests/unit/cite-check.test.mjs:42-105`): one happy path, uncited bullet, `[no source found]`, `TODO`, high-stakes single-source, high-stakes second-source, and no-arg usage. That leaves the blocker behaviors above untested and also misses several explicit edge cases from the review brief.

Missing cases:
- Uncited prose claim lines under `## Finding` / `## Fix` / `## Alternatives`
- Multiple Q&A blocks in one topic file, including later-block high-stakes corroboration
- Cross-block source leakage and duplicate `[n]` ids being overwritten
- Multi-digit refs
- Out-of-range refs
- `TBD` and `[source]` placeholders
- Headings and blank lines being skipped intentionally
