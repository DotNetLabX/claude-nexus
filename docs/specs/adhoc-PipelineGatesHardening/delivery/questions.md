# Pipeline Gates Hardening — Questions

Phase-1 analysis (developer, 2026-06-13). The plan is exceptionally well-grounded — it
already passed a code-grounded critic REVISE cycle and was re-grounded file-by-file. I
re-verified every code claim against the on-disk tree; **all matched**. No blocking
ambiguity. The three items below are **observations** (already resolved by the plan's own
intent / verified facts), recorded for transparency, not open blockers.

## Q1: `boundary-detector.test.mjs` has 10 tests, not the "11" the plan cites
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 1 (and its acceptance)
**File:** `tests/unit/boundary-detector.test.mjs`

**Context:** Step 1's body and acceptance say "preserve all 11 existing tests, incl. `:76`."
I counted `test(` calls and ran the file: it has **exactly 10 tests, all passing** (not 11).
The load-bearing fact — the `detect(dir, 'critic', '', 'Bash')` no-log assertion at line 76
inside the `fail silent: malformed stdin and non-edit tools never log or fail` test — is real
and confirmed. HIGH-3's intent (preserve that Bash-no-git-verb zero-footprint no-op) is
unaffected by the miscount.

**Question:** Any reason to treat the "11" as meaningful, or is it a stale count?

**Recommendation:** Stale count. Implement to "preserve **all** existing tests (currently 10),
including the `:76` Bash-no-verb no-op" — the directive "preserve every existing test" is
unambiguous regardless of the number. No plan change needed; I'll note the corrected count in
implementation.md.
**Confidence:** high — counted `test(` occurrences and ran the suite (10/10 pass); the
`:76` assertion that HIGH-3 protects is verified present.

### Answer
Resolved by verified fact (proceed-default), not user-confirmed — preserve all 10 existing
boundary-detector tests including `:76`; the "11" is a stale count and carries no other meaning.

## Q2: Baseline is 116/117 green — one PRE-EXISTING unrelated failure in `nexus-dotnet`
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 1 (acceptance: "the full baseline stays green")

**Context:** Running the canonical invocation
`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` on the **unmodified** tree yields
**116 pass / 1 fail (117 total)**. The single failure is
`tests/lint/frontmatter.test.mjs:34` — `nexus-dotnet/skills/create-module-claude-md/SKILL.md`
declares an unknown frontmatter key `disable-model-invocation`. Confirmed pre-existing: the
file is unmodified in the working tree and the key was committed at `75ccd2b`
(`feat(adhoc-DotnetSkillSweep): … ship 1.1.0`, 2026-06-13 08:48) — it predates this plan
(written 2026-06-13 16:20) and lives in **`nexus-dotnet`**, outside this feature's `nexus`-only
scope. Per the "don't attribute pre-existing failures to the current feature" rule, this is
not mine to fix.

**Question:** Confirm the Step 1 acceptance "full baseline stays green" means "no NEW failures
introduced beyond this known pre-existing `nexus-dotnet` frontmatter failure" — i.e. I implement
to **116/117 unchanged + my 3 reds turning green**, not to a literal 117/117.

**Recommendation:** Yes — interpret "baseline stays green" as "no regression beyond the one
known pre-existing `nexus-dotnet` failure." The `disable-model-invocation` failure is out of
scope (different plugin, committed before this plan, untouched by any of Steps 1-9). I will (a)
document it in implementation.md so the reviewer/architect don't re-investigate, and (b) verify
my work introduces no new failure and turns the 3 reds green. I will **not** fix the
`nexus-dotnet` key unless you direct it (it's a separate concern — possibly owed to
`frontmatter.test.mjs`'s `SKILL_KEYS` allow-list, but that is a different feature's call).
**Confidence:** high — `git status`/`git show HEAD`/`git log` all confirm pre-existing &
unmodified & out-of-scope; the rule is explicit about not attributing it here.

### Answer
Resolved by verified fact (proceed-default), not user-confirmed — "baseline stays green" =
no regression beyond the one pre-existing `nexus-dotnet:create-module-claude-md` frontmatter
failure (committed `75ccd2b`, out of this feature's `nexus`-only scope). Document it; do not fix
it here; turn the 3 reds green with no new failures.

## Q3: Step 1 places reds directly in final tiers, not in `tests/red/` — confirm
**From:** developer
**To:** architect
**Status:** Resolved
**Step:** Step 1

**Context:** `tests/README.md:54-59` describes a `tests/red/` convention (reds that fail by
design, run `continue-on-error` in CI, **promoted** into `lint/`+`unit/` when the fix ships).
Step 1 instead writes the new reds **directly** into their final homes (`tests/unit/skill-tracker.test.mjs`
new; extend `tests/unit/boundary-detector.test.mjs`; add the structural lint to `tests/lint/`).
This is the right call when red→green land in **one** delivery (no CI window where a committed
red is failing), and it matches how `enforcement.test.mjs` describes itself ("Born as TDD reds
(tests/red/), promoted here when the package shipped"). But the plan never explicitly says "skip
`tests/red/`," so I'm confirming.

**Question:** Confirm the reds go straight into `unit/`+`lint/` (TDD within this single delivery),
not through a `tests/red/` staging step.

**Recommendation:** Straight into final tiers. Since all of Steps 1-9 ship in one pass, there is
no commit where a red is left failing — so the `tests/red/` staging (which exists to hold a red
across commits until its fix lands later) adds nothing here. I'll author the red, watch it fail
for the right reason (script/section absent), then land the fix in the same delivery so it's
green at commit time. This is exactly the final-tier-from-birth pattern the plan's Step 1 text
describes.
**Confidence:** high — `tests/red/` is for cross-commit staging; this is single-delivery TDD,
and the plan's own Step 1 file targets are the final tiers.

### Answer
Resolved by verified fact (proceed-default), not user-confirmed — reds land directly in
`tests/unit/` + `tests/lint/` (single-delivery red→green); no `tests/red/` staging step.
