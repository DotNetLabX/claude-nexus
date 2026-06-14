# adhoc-GateNegationFix — implementation

**Scope:** P1 in `docs/plugin-feedback/nexus-1.8.2-2026-06-13.md`. Fix the pipeline-gate
false-positive DENY on two clean-APPROVED prose shapes. Solo lane (2 source files + mechanical bump).

**Status:** COMPLETE — not committed (owner owns the commit). Staged-ready.

## Fix approach chosen: Option (a) — targeted line-local exemptions

Kept the existing prose line-scan in `approvedWithOpenHighSev()` and added two `continue` skips
before the unresolved-window conclusion, mirroring the existing `LEGEND` skip.

**Rejected Option (b)** (scan only the findings table). Decisive fact, verified in
`plugins/nexus/skills/review-format/SKILL.md:81-85` and corroborated by the existing test comments
(`tests/unit/pipeline-gate.test.mjs:47-48`, `:77-84`): **real findings are `### [SEVERITY]` prose
headings with `**Issue:**`/`**Fix:**` prose lines — deliberately NOT table rows**, and the gate
already skips every `| ...` line. A table-only scan would scan a structure that never carries the
finding, so it would remove the false positives by also removing the *true* positive — silently
disabling the invariant the gate exists to enforce. Option (a) removes only the two known
false-positive shapes and leaves genuine `### [HIGH]` detection fully intact.

Confidence: high — the format spec + existing test model make (b) self-defeating; (a) is the
clear minimal-risk pick.

## Change

`plugins/nexus/hooks/scripts/pipeline-gate.js` → `approvedWithOpenHighSev()` (~:118-137). Two new
line-local exemptions, applied per scanned line right after the existing `LEGEND` skip:

- **NEGATION** — `const NEGATED = /\bno\b[^.]*\b(critical|high)\b/i;`
  Skips `No CRITICAL or HIGH findings.` (states absence). `[^.]*` keeps the `no` and the token in
  the same sentence, so a real `### [HIGH] …` heading followed by prose containing a later "no"
  is NOT pardoned.
- **CONFIDENCE field** — `const CONFIDENCE_FIELD = /\bconfidence\b\s*[:*]/i;`
  Skips `**Confidence:** HIGH` / `Confidence: HIGH` (the reviewer's per-finding format qualifier
  per review-format `**Confidence:**`, not a severity). Matches the field, not token adjacency.

The real invariant is unchanged: an `APPROVED` verdict beside a genuinely-unresolved
`### [CRITICAL|HIGH]` finding (no resolution marker in its 4-line window) still DENIES.

## Tests

Added 3 regression tests to `tests/unit/pipeline-gate.test.mjs` (matching the existing
`APPROVED_OPEN_HIGH` finding-block idiom):

1. negation line `No CRITICAL or HIGH findings.` → ALLOW
2. `**Confidence:** HIGH` on a resolved finding block → ALLOW
3. a real open `### [HIGH]` sitting beside both a negation line AND a Confidence field → still DENY
   (proves the line-local exemptions don't mask an adjacent true positive)

The pre-existing `APPROVED_OPEN_HIGH → DENY` and `APPROVED_RESOLVED_HIGH → ALLOW` tests are
unchanged and still green.

### Result

`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **133 tests, 132 pass, 1 fail.**
The single failure is the pre-declared, unrelated pre-existing `nexus-dotnet` frontmatter failure
(`plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md`: unknown frontmatter key
`disable-model-invocation`) — not chased per the brief. The `pipeline-gate.test.mjs` file alone:
**11 tests, 11 pass, 0 fail.**

## Version bump (release-plugin, PATCH)

- `plugins/nexus`: **1.8.2 → 1.8.3** (PATCH). Classified by `bump-plugin.mjs --dry-run` as
  "hook behavior/enforcement change"; no owner escalation (scoped fix within the gate's intent).
- `plugins/nexus/CHANGELOG.md`: stub replaced with a real `[1.8.3]` entry.
- `gen-omni.mjs` re-run; `gen-omni.mjs --check` → exit 0 (twin in sync). `gen-commands.mjs` not
  run — no `agents/*.md` changed. `claude plugin validate plugins/nexus --strict` → passed.

## Staged set (owner commits)

Staged (verified via `git diff --cached --name-only`):
- `plugins/nexus/hooks/scripts/pipeline-gate.js`
- `tests/unit/pipeline-gate.test.mjs`
- `plugins/nexus/.claude-plugin/plugin.json`
- `plugins/nexus/CHANGELOG.md`

**Left UNSTAGED on purpose** — the working tree was dirty at launch with foreign changes from
prior work (several `docs/specs/*/lessons.md`, `docs/plugin-feedback/nexus-1.8.2-2026-06-13.md`,
untracked `docs/proposals/mine-verify-pilot-method.md` and `docs/specs/adhoc-ResearchKB/`). Per the
T3 lesson, only the 4 fix files were staged; the foreign changes are untouched so the owner's commit
of this fix won't sweep them.
