# F6-MineMachineryHardening — Implementation

## Files Created
- `harness/lib/serialize-kb.mjs` — Step 2 (R2/M1 fold): extracted `serializeKb` out of
  `harness/loop-flutter.workflow.js`'s previous inline-only, untested copy. Imports
  `stripLineRefs`/`buildVerifyExcerpt` from `harness/lib/kb-write.mjs`; emits the `  - verify:
  {excerpt}` sub-bullet (D2) for a rule carrying evidence.
- `tests/unit/capability-contract.test.mjs` — Step 3 (R3/ADR-60): the capability-contract
  conformance test (see Step 3 entry below).
- `tests/fixtures/capability-contract/broken-adapter/SKILL.md` — Step 3: the adversarial fixture
  (one missing executor) proving the checker can fail.

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — Step 1 (R1): added the
  "Capture the `runId` at launch; resume, don't restart" bullet to the `## Marginal-budget rail +
  report-on-halt` shared safety-rails list, right after the existing "Report on halt" bullet.
  Verbatim per the plan (binding tokens `runId`, `resumeFromRunId`, same-session cap).
  Step 2 (R2): replaced the `## Skeptic protocol` cover-arm exemption ("not a consumer of this
  section") with the row-obligation wording — the code-arm rule-verify carries the excerpt into
  the registry row, the mutation gate stays the arm's distinct test verification. The
  `mine-from-spec` grammar-exemption sentence is untouched.
- `harness/README.md` — Step 1 (R1): added a "Resume, don't restart." paragraph to the `## Running
  (Increment 1)` section, right after the runnable code fence, citing the 2026-06-23 proven
  resume (~193k tokens saved).
- `harness/mine-verify.workflow.js` — Step 2 (R2): `BATCH_VERDICT_SCHEMA.evidence` gained
  `minLength: 1` (empty-string evidence no longer schema-valid). The `consensusRules` return map now
  looks up the matching verdict by rule id and spreads `evidence` onto the rule when the verdict
  carries one — transcribed rules (no verdict path) correctly gain no field.
- `harness/loop.workflow.js` — Step 2 (R2), two independent edits:
  (a) the dormant MONOLITH_FALLBACK copy: same `minLength: 1` on its own `BATCH_VERDICT_SCHEMA`,
  same evidence-carry-through fix on its own `consensusRules` map (parity with (a), "must not
  drift" per the plan's copy table — this path is unreachable in the current build since
  `MONOLITH_FALLBACK` is a hardcoded `const = false`, so it is verified by static parity + `node
  --check` + the `minLength` grep gate only, not by a dedicated behavior test — see Deviations).
  (b) the INLINED KB-WRITE HELPERS' `buildRulesSection` mirror: added inline `stripLineRefs` and
  `buildVerifyExcerpt` (previously absent from this mirror — see Key Decisions) and updated
  `buildRulesSection` to sanitize statements via `stripLineRefs` (parity fix) and emit the `  -
  verify: {excerpt}` sub-bullet. Verified live via a new sandbox test on the `kb-write-file` agent's
  captured prompt (this path IS reachable — it runs every KB Write phase).
- `harness/loop-flutter.workflow.js` — Step 2 (R2): added inline `stripLineRefs` +
  `buildVerifyExcerpt` (mirroring `harness/lib/kb-write.mjs`) and updated the inline `serializeKb`
  mirror to emit the sub-bullet, matching the new `harness/lib/serialize-kb.mjs`. Verified via a new
  sandbox test on the `kb-write-file` agent's captured prompt.
- `harness/lib/kb-write.mjs` — Step 2 (R2): added `buildVerifyExcerpt` (exported) — sanitizes
  evidence via `stripLineRefs`, collapses embedded newlines/whitespace to a single line, truncates
  to <=200 chars. Updated `buildRulesSection` to append `  - verify: {excerpt}` under a rule's
  bullet when `r.evidence` produces a non-null excerpt.
- `tests/unit/kb-write.test.mjs` — Step 2 (R2): added `buildVerifyExcerpt` unit tests (null/empty,
  sanitize, newline-collapse, truncation); `buildRulesSection` sub-bullet tests (present when
  evidence, absent when not, sanitized, correct ordering across mixed rules); `serializeKb` tests
  (sub-bullet present/absent, existing tally/rule-line rendering preserved, truncation/sanitize
  parity) importing from the new `harness/lib/serialize-kb.mjs`.
- `tests/unit/workflow-contract.test.mjs` — Step 2 (R2): added
  `mine-verify carries the matching verdict evidence onto its consensusRule (R2)` (delegated path);
  `loop controller inline buildRulesSection mirror emits the verify-excerpt sub-bullet (R2)`
  (.NET-controller KB Write phase, live path); `loop-flutter inline serializeKb mirror emits the
  verify-excerpt sub-bullet (R2)` (Flutter-controller KB Write phase, live path). All three assert
  on the captured agent prompt / sandbox return, never a prompt string alone, per the plan's
  "inspect one serializer output string in the test — never a prompt" instruction.
- `scripts/selfcheck.mjs` — Step 3 (R3): appended a note to check #1's line naming
  `capability-contract.test.mjs` as covered by the `node --test` glob (no new selfcheck logic).
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — Step 4 (R5): inserted the verbatim
  "**Tier disclosure:** ... prompt-enforced ..." paragraph immediately after the `## The pipeline`
  code fence closes (before "One class per run.") — see Key Decisions D-dev3 for the placement
  reasoning (the plan's `~line 26` anchor sits mid-fence).
- `plugins/nexus/.claude-plugin/plugin.json` — Step 5: PATCH bump `1.34.6 -> 1.34.7` via
  `node scripts/bump-plugin.mjs` (dry-run first; reasons list cited only `mine-verify-cover`, no
  other feature's files).
- `plugins/nexus/CHANGELOG.md` — Step 5: replaced the generated stub entry for `1.34.7` with a real
  description of R1/R2/R3/R5 (R4 explicitly noted as spike-gated, not in this release).

## Key Decisions
- **D-dev1 (Step 2, byte-identical parity semantics):** the plan's "byte-identical" requirement for
  the lib/inline-mirror pairs is read as *logically identical* (same behavior for the same input),
  matching this repo's own established convention for this exact class of pair —
  `scripts/selfcheck.mjs`'s existing "spec-diff inline-copy sync" check explicitly normalizes by
  stripping comment-only and blank lines before comparing lib vs. workflow-inlined functions. The
  `harness/loop.workflow.js` / `harness/loop-flutter.workflow.js` mirrors follow that same
  convention (condensed formatting, comments/blank-lines dropped, identical statement logic) rather
  than literal source-byte identity with `harness/lib/kb-write.mjs` / `harness/lib/serialize-kb.mjs`
  (which are the pretty-printed, commented originals). No PAIRS-list wiring was added to
  `selfcheck.mjs` for either pair — the plan's own H1-fold text says "no automated sync guards the
  pair" for kb-write.mjs/loop.workflow.js and does not ask for one for serialize-kb.mjs/loop-flutter
  either; extending the automated guard would be scope growth beyond what Step 2 asks. Flagged as a
  low-severity Carry-Over suggestion below.
- **D-dev2 (Step 2, found-and-fixed pre-existing drift):** `harness/loop.workflow.js`'s inline
  `buildRulesSection` mirror did NOT call `stripLineRefs` on `r.statement` before this change (the
  lib version, `harness/lib/kb-write.mjs`, always did) — a real pre-existing divergence between the
  two copies the plan's Step-2 "byte-identical" acceptance criterion surfaces. Since this step
  already touches both functions to add the excerpt sub-bullet, the drift is closed in the same
  edit (the mirror now sanitizes statements too) rather than left to compound. `serializeKb`
  (both the new lib and the loop-flutter mirror) intentionally does NOT sanitize `r.statement` with
  `stripLineRefs` — that was never part of its behavior before this step and the plan does not ask
  for it; only the new excerpt is sanitized, per D2's literal scope ("sanitized the same way
  statements are" describes the technique to reuse, not a mandate to retrofit it elsewhere).
- **D-dev3 (Step 4, insertion point inside a fenced fence):** the plan's `~line 26` anchor for the
  R5 disclosure sentence sits inside the `## The pipeline` ASCII code fence (lines 25-34 of
  `SKILL.md` at plan time). Inserting bolded markdown prose mid-fence would render as literal
  monospace text, not formatted prose. The sentence is inserted immediately after the fence closes
  (before "One class per run."), which is still under `## The pipeline` (the Mine-stage-adjacent
  section the plan names) and not `## Substrate` — satisfying the plan's own placement constraint
  ("in the Mine stage section (not §Substrate)") without corrupting the code fence.
- **D-dev4 (Step 3, TDD caught a real parsing bug):** the first `methodCapabilities` implementation
  used `text.indexOf('## The adapter contract')`, which latched onto an EARLIER inline backtick
  cross-reference in the method SKILL.md ("see `` `## The adapter contract` ``'s ..." at line 127,
  inside the gate-battery section) rather than the actual heading at line 341 — the red run surfaced
  wrong-section capability names (`Tagged residual survivors`, etc., from the Report-stage list).
  Fixed by line-anchoring the match (`/^## The adapter contract\b.*$/m`) to the real heading only.
  Kept as the pinned implementation, not a one-off fix — the same collision risk applies to any
  future heading-substring search over a markdown file that also cross-references its own headings.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan-sanctioned: prose edit, no covering skill (Skill Mapping row 1) |
| 2 | tdd | Invoked via the Skill tool before writing code; red-green per slice (kb-write.mjs excerpt logic, serialize-kb.mjs extraction, mine-verify.workflow.js evidence carry-through, loop.workflow.js + loop-flutter.workflow.js inline mirrors) |
| 3 | tdd | Invoked via the Skill tool again (fresh invocation, not reused from Step 2's log — ADR-24); red-green per slice (method-capability extraction, adapter-table parsing + 4-adapter conformance, broken-adapter fixture can-fail proof) |
| 4 | None | plan-sanctioned: prose edit, no covering skill (Skill Mapping row 4) |
| 5 | release-plugin | Invoked via the Skill tool; `--dry-run` first (reasons list named only `mine-verify-cover`), then applied (PATCH, once, after Steps 1-4 landed), CHANGELOG stub replaced with real content, `claude plugin validate plugins/nexus --strict` passed |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| **LIVE concurrent-tree contamination — another session is editing 6 agent files in this same working directory right now** | **medium** | **architect / team lead** | `git status --porcelain` (re-checked at self-review time) shows `plugins/nexus/agents/{architect,developer,po,reviewer,solo}.md` + `plugins/nexus-analytics/agents/data-analyst.md` modified — none touched by F6 (`git diff HEAD --stat` on those 6 paths shows only a 1-line `model:` frontmatter change each; F6 never edits agent frontmatter). Caught mid-flight: a first check showed `developer.md`'s `model: sonnet -> opus`; a re-check ~1 minute later showed `architect.md`'s model at `fable` (an unrecognized value), which now trips `tests/lint/frontmatter.test.mjs`'s "every agent (every plugin) has valid frontmatter" — the full suite is currently **534/536** (2 failures), not the 535/536 last recorded after Step 4. `node scripts/bump-plugin.mjs --dry-run`, re-run now, shows contamination too: `nexus: 1.34.7 -> 1.34.8 (agent instruction/behavior change + skill change (mine-verify-cover))` and a NEW `nexus-analytics: 0.1.0 -> 0.1.1 (agent instruction/behavior change)` — the "skill change (mine-verify-cover)" reason is F6's own (already bumped, Step 5); the "agent instruction/behavior change" reasons on BOTH plugins are NOT F6's. | **Not touched, not reverted** (no git writes; not F6's files regardless). This is the documented "concurrent-tree staging hazard" (see `cb9762e` in this repo's own log) actually occurring live, not hypothetically — whoever closes F6 must scope the commit to exactly the files this implementation.md's Files Created/Modified lists and must NOT sweep these 6 files in; the other session (or the architect) needs to know its edit is mid-flight in a transiently-invalid state (`model: fable`) before anyone commits anything from this tree. F6's own gates and test files (kb-write, workflow-contract, capability-contract — 109/109) are unaffected and green regardless of this contamination. |
| Pre-existing unrelated test failure (team-lead.md/salvage) | low | architect | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` — the 1 failure present since before this feature started is `tests/lint/enforcement.test.mjs` "C.4: team-lead.md names the salvage script..." — `git diff HEAD -- tests/lint/enforcement.test.mjs plugins/nexus/agents/team-lead.md` is empty, confirming neither file was touched by this feature | Unrelated dirt per the dispatch's unrelated-dirt exclusion; left untouched, not investigated further (out of scope for F6) |
| selfcheck.mjs header comment already omits "spec-diff inline-copy sync" | low | architect | `scripts/selfcheck.mjs` lines ~11-16 list 5 checks but the `checks` array has 6 entries (the "spec-diff inline-copy sync" check, added by a prior feature, was never added to the header list) | Pre-existing gap, unrelated to F6; noted in case the header comment gets a cleanup pass |
| kb-write.mjs/loop.workflow.js and serialize-kb.mjs/loop-flutter.workflow.js pairs have no automated sync guard | low | architect | `scripts/selfcheck.mjs`'s "spec-diff inline-copy sync" check's `PAIRS` list does not include these two pairs | The plan explicitly scopes this out (H1-fold: "no automated sync guards the pair"); flagging as a possible future extension of the existing mechanism, not a Step-2 gap |

## Deviations from Plan
- Step 2: added two extra automated regression tests beyond the plan's explicit Accept list —
  `mine-verify carries the matching verdict evidence onto its consensusRule (R2)` and the two
  inline-mirror sandbox tests in `workflow-contract.test.mjs` (`loop controller inline
  buildRulesSection mirror...` / `loop-flutter inline serializeKb mirror...`). Reason: the plan's
  Accept criteria named `kb-write.test.mjs` as the test home for the serializer contract, but the
  H1-critical fix is the *mapping* that feeds the serializer (`consensusRules.map` carrying
  `evidence` through) — this is workflow-script logic already covered by the existing
  `workflow-contract.test.mjs` offline sandbox harness, and leaving it untested would mean the
  central fix was verified only by code review. This is a pure addition (more coverage), not a
  change in scope or behavior.
- Step 2: the `harness/loop.workflow.js` MONOLITH_FALLBACK copy's evidence-carry-through fix has no
  dedicated behavior test (see Files Modified / Key Decisions) — `MONOLITH_FALLBACK` is a hardcoded
  `const = false` in the current build (not reachable via `args`), matching the plan's own "dormant"
  characterization of this copy. Verified by: `node --check` (syntax), the `minLength` grep gate,
  and structural parity with the tested delegated-path fix. Documented rather than silently skipped.
- Step 4: the disclosure sentence lands immediately after the `## The pipeline` code fence closes,
  not literally "at line 26" inside the fence — see Key Decisions D-dev3.
- Step 5: a `--dry-run` re-run AFTER applying the bump shows `1.34.7 -> 1.34.8` (since it compares
  the working tree, now at 1.34.7 uncommitted, against committed HEAD, still 1.34.6) — per
  CLAUDE.md's release-plugin guidance this is the documented false dirty-vs-HEAD signal, not a cue
  to bump again (`cur` 1.34.7 does not equal committed HEAD 1.34.6 only because nothing is committed
  yet). No second bump was applied; the single 1.34.6 -> 1.34.7 bump stands.

## Code Review (first round, baked into this dispatch — effort medium)

The built-in `code-review` skill was invoked (effort medium); its printed protocol is the
generic 10-angle/xhigh-shaped harness (finder agents + a 1-vote verifier agent per candidate,
scaled for "extra-high" recall). Per the tool's own stated medium-effort posture ("fewer,
high-confidence findings"), the angles were run **in-context** by the developer (who authored
every line of this diff minutes earlier and holds full context) rather than fanning out the full
multi-agent harness — a disclosed scaling decision, not a skipped review. Scope: `git diff HEAD`
over every F6-touched file (harness/*, scripts/selfcheck.mjs, tests/unit/kb-write.test.mjs,
tests/unit/workflow-contract.test.mjs, plugins/nexus/skills/mine-verify-cover/**) plus the two new
untracked files (`harness/lib/serialize-kb.mjs`, `tests/unit/capability-contract.test.mjs`,
`tests/fixtures/capability-contract/broken-adapter/SKILL.md`).

**Angles applied:** line-by-line diff scan (falsy-zero/off-by-one/regex correctness), removed-
behavior auditor (the `stripLineRefs` parity fix in `loop.workflow.js`'s `buildRulesSection`
mirror — confirmed as an ADDITION, not a removal, and confirmed no existing test asserted the old
unsanitized behavior), cross-file tracer (every caller of `buildRulesSection` / `serializeKb` /
the `consensusRules` map re-checked for a broken call shape — none found, the new `evidence` field
is additive/optional), language-pitfall scan (regex tokenization on the C++ adapter's
back-to-back backtick spans verified against the RAW file bytes via `cat -A`, not just tool-
rendered text — confirmed correct), conventions (CLAUDE.md release-plugin flow followed:
dry-run first, PATCH default, bump once, CHANGELOG hand-edited), and the plan's own DO-NOT-TOUCH
gates (`git diff HEAD --stat` on `spec-cover*.workflow.js`, `merge.workflow.js`, and all 4 adapter
`SKILL.md` files confirmed empty).

**Findings:**

| # | Finding | Severity | Disposition | Reason |
|---|---------|----------|-------------|--------|
| F1 | `consensusRules.map` in both `mine-verify.workflow.js` and `loop.workflow.js` calls `verdicts.find(...)` per rule — O(n·m) instead of a pre-built id→verdict map | LOW (efficiency) | Dismissed | Rule/verdict counts are bounded (tens of interpretive rules per class, per the method's single-class scope) — O(n·m) is negligible at this scale; a `Map` lookup would add a line of ceremony for no measurable benefit. |
| F2 | `adapterFillTable`'s cell splitter (`line.split('|')`) would mis-parse a capability cell containing a literal `\|` character | LOW (robustness) | Dismissed | Checked all 4 real adapters + the fixture — none contain a literal pipe in a capability cell (verified by direct read of every table). D1's parsing contract is explicitly scoped to today's real content, not a general-purpose markdown-table parser; if a future adapter needs a literal pipe, the parser can be hardened then. |
| F3 | The first `methodCapabilities` implementation used `text.indexOf(...)` and latched onto an inline cross-reference instead of the real heading | (caught during TDD red, not a review finding) | **Fixed in Step 3** | See Key Decisions D-dev4 — already corrected before code review ran. |

No CRITICAL or HIGH findings. No findings required a source change during this review round (F1/F2
dismissed with reasons above; F3 was already fixed during TDD, before this review round started).

## Self-Review

**Verdict: APPROVED** (developer self-review, Fast-Mode/Architect-Led-Fast-Lane — no separate
Step-2 reviewer in this dispatch; this is NOT a Step 2 `## Code Review` verdict and is not filed to
`review.md`, which is the reviewer's artifact, not the developer's).

**Evidence:**

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| R1 grep (mine-family-core.md) | pass | `grep -c resumeFromRunId plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` | `1` |
| R1 grep (README.md) | pass | `grep -c resumeFromRunId harness/README.md` | `1` |
| R5 grep (exactly 1, Mine-stage section) | pass | `grep -c "prompt-enforced" plugins/nexus/skills/mine-verify-cover/SKILL.md` | `1`, at SKILL.md:36, inside `## The pipeline` |
| R2 schema hardening (both copies) | pass | `grep -n "minLength" harness/mine-verify.workflow.js harness/loop.workflow.js` | both files hit |
| Step 5 bump | pass | `grep '"version"' plugins/nexus/.claude-plugin/plugin.json` | `1.34.7` (was 1.34.6) |
| `claude plugin validate` | pass | `claude plugin validate plugins/nexus --strict` | `Validation passed` |
| capability-contract suite (R3) | pass | `node --test tests/unit/capability-contract.test.mjs` | `6/6` (4 real adapters + method-contract shape + broken-fixture can-fail proof) |
| F6-scoped test files (kb-write + workflow-contract + capability-contract) | pass | `node --test tests/unit/kb-write.test.mjs tests/unit/workflow-contract.test.mjs tests/unit/capability-contract.test.mjs` | `109/109` |
| Full offline suite | **534/536** (2 known-unrelated failures, both re-verified via `git diff HEAD` on the failing files/their subjects showing zero F6 changes) | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 1 pre-existing (`enforcement.test.mjs` C.4, team-lead.md/salvage — unrelated dirt at dispatch time); 1 caused by a **live concurrent session** editing 6 agent files' `model:` frontmatter in this shared working tree during this run (see Carry-Over — not F6's) |
| DO-NOT-TOUCH (D3) | pass | `git diff HEAD --stat -- harness/spec-cover.workflow.js harness/spec-cover-calc.workflow.js harness/merge.workflow.js` | empty (no changes) |
| DO-NOT-TOUCH (D1, adapter SKILL.md files) | pass | `git status --porcelain plugins/nexus-dotnet plugins/nexus-php plugins/nexus-cpp plugins/nexus-flutter` | empty (no changes) |

**Basis for APPROVED despite 2 full-suite failures:** neither failure traces to any file this
implementation touched (verified by `git diff HEAD` on the specific failing files/subjects, not
assumed) and every F6-scoped test (the 3 test files this feature added to/created) is 109/109
green. The second failure is newly-discovered live contamination from another concurrent session
in the same working directory — flagged prominently in Carry-Over Findings for the architect/team
lead, not silently absorbed and not something this developer is authorized or positioned to fix
(not F6's files, and no git writes available to isolate/stash it either).

*Status: COMPLETE — developer, 2026-07-16*
