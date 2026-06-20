# Lessons — adhoc-SectionAddressableReads

## Architect Lessons

- **The feature dogfooded itself, and lost.** During the Mode-2 plan review, the critic re-read
  `spec.md` ×2 in one round — the `read-tracker` nudged it (visible in this run). That is a live first
  data point that the prose read-discipline rule alone is weak, exactly the decay the deferred
  size-nudge hook would catch. Keep it: it is the kind of evidence the ADR-22 promotion ratchet
  (fluid → lessons → prose → gate) needs before promoting the hook. Don't promote yet (one data point),
  but this is occurrence #1.
- **Load-bearing design insight: a shared rule does not reach a spawned subagent.** ADR-2 #2 (a subagent
  sees only its own agent file) means the section-targeting rule in `agents-workflow.md` reaches the
  *main session* but not a spawned critic/reviewer/architect/PO. The rule must be duplicated into each
  heavy-loader agent file (ADR-14). The agent-file step (Step 4) is therefore load-bearing, not cosmetic
  — the single most important thing to get right for AC3 to actually bite.
- **An AC that names examples is not naming the set.** First draft read AC3's "critic (and
  reviewer/architect)" as exhaustive and omitted the PO (critic F1). The real set is the spec's
  §Scope-3 *principle* — every artifact-loading subagent. Map an AC's parenthetical examples back to the
  governing principle before treating them as the complete list.
- **Done-check (2026-06-20): a plan-cited accept gate can itself be the defect — verify the gate, not
  just the output.** Step 7's accept named `claude plugin validate --strict`, which fails. The done-check
  discipline that paid off: independently reproduce the failure, then check *whose* failure it is —
  `git status` on the failing artifacts (all 4 clean/untouched) + grep the strict-run failure list for
  the *edited* skill names (zero hits). A gate that fails on inputs this change never touched is an
  environment defect, not a conformance gap. The corroborating move: cross-check against the **repo's
  authoritative** gate (`skill-lint.mjs` dogfood test, green) — the plan's own Skill Mapping already
  named that as the Step-3 gate, so it was the right tie-breaker. Lesson for plan-writing: when an accept
  line cites an *external CLI* gate (`claude plugin validate`) alongside a *repo-owned* gate
  (`skill-lint`), make the repo-owned one primary — the CLI quirk is now a known false-RED on this repo's
  long-description frontmatter.
- **A git-HEAD-diff selfcheck is a false-RED in any valid pre-commit tree.** `selfcheck`'s gen-commands
  drift check diffs the working tree against HEAD; with correctly-regenerated-but-uncommitted artifacts it
  must fail until the commit lands. The done-check ruling reduces to one deterministic command:
  `git diff --name-only HEAD -- commands/` returning *exactly* the intended set (here: architect/critic/po/reviewer,
  no others). When that holds, the RED is by-design and resolves on commit — PASS it, don't bounce it to
  the developer. Same shape will recur for any future "regen then diff-vs-HEAD" selfcheck.
- **`Deviated (valid reason)` is the right disposition for a pre-authored operator-owed measurement.** Step 6's
  AC4 absolute-drop is structurally uncapturable at build time (needs a live agent run + `token_audit` ON +
  reload). The plan pre-authored it as OPERATOR ACTION REQUIRED, so the done-check passes the *harness +
  baseline procedure + recorded commands* (all present and the unit test green) and surfaces the live delta
  as operator-owed — exactly the `create-implementation-plan` "operator-owed fallback" rule working as
  intended. The verdict stays binary (PASS); the open production gate is disclosed, not hidden.

## Developer Lessons

- **Phase-1 analysis (2026-06-20): plan verified clean, one path shorthand to expand in Phase 2.**
  All 7 steps' referenced files/line-ranges confirmed accurate against live source (ADR-22 @603–616,
  Read Discipline @108–118, kb-navigation step-4 @8, critic `## Tool Usage` @156, reviewer
  `## Before Reviewing` @15, architect `## Read Discipline` @104, all 5 format skills + plan-template
  present, fixture present). The only correction: Step 3's accept-line writes `node scripts/skill-lint.mjs`,
  but the script ships **inside the skill folder** (ADR-23) — the real, repo-consistent invocation is
  `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs <skill-dir>` (cf.
  `adhoc-BuildFlowFormalization`). Apply that path in Phase 2; not a blocker.
- **Phase-2 implementation (2026-06-20): all 7 steps clean; skill-lint path shorthand confirmed.** Used
  `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs <dir>` per the Phase-1 note — exits 0
  on all 6 edited folders. The plan's `node scripts/skill-lint.mjs` is indeed shorthand (no such repo-root
  script exists).
- **`claude plugin validate --strict` is broken estate-wide on this repo's frontmatter style.** Step 7's
  accept line names it, but it exits 1 on `boy-scout`/`diagnose`/`evaluate-skill`/`improve-skills` (all
  untouched by this slice) with a `YAML frontmatter failed to parse` error. The repo's flat single-line
  frontmatter (the style `tests/helpers.mjs` `frontmatter()` and `skill-lint.mjs` both parse fine) trips
  the CLI's stricter YAML parser. **The project's real form gate is `skill-lint.mjs` (ADR-23), not
  `claude plugin validate`** — the dogfood test lints every shipped skill and is green. When a plan cites
  `claude plugin validate --strict` as an accept gate, treat a failure on untouched skills as a
  pre-existing CLI issue and lean on `skill-lint` + the test suite. (Candidate follow-up: either fix the
  repo frontmatter to satisfy strict YAML, or drop `--strict` from accept lines in favor of `skill-lint`.)
- **`selfcheck.mjs` gen-commands drift check is structurally RED pre-commit.** `selfcheck` step 2 runs
  `gen-commands.mjs` then `git diff --exit-code -- commands/` against HEAD. In a valid pre-commit working
  tree with regenerated commands, HEAD = old commands, so `git diff` exits 1. The check is designed to
  catch *forgotten* regen; it also fires on *intended-but-uncommitted* regen. Pattern: confirm
  `git diff --name-only HEAD -- commands/` shows only the intended agents, then hand off — the selfcheck
  will green on the commit. Do not re-regen trying to satisfy it before commit.
- **The repo's testable-script pattern = pure-core export + `import.meta.url`-guarded CLI.** `render-fleet.mjs`
  (exports `renderFleet`, test imports it) is the template for any `scripts/` tool that needs a unit test.
  Followed it for `measure-read-cost.mjs`. Worth noting in a convention doc if scripts proliferate.

## Reviewer Lessons

- **Plan enumeration of section headings can be off-by-one without being a code defect.** The plan Step 3 listed 6 headings for `implementation-format` but the skill template has 7 (`## KB Changes` was present but omitted from the plan's enumeration). The implementation correctly documented 7. When a plan lists specific heading names, verify against the live file — a one-item omission in a plan enumeration is a design-imprecision, not an implementation error.
- **Dev-tool CLI arg parsing: dangling flags are LOW, not silent correctness hazards.** `--agent` / `--since` at end of argv without a value sets `opts.agent = undefined`, which silently skips the filter. Flagged as LOW (dev-tool; not shipped; operator context), not HIGH, because the result is unfiltered output, not corrupted data. The fix is a simple post-loop guard.
- **Confirming the fixture numerically before trusting test assertions pays off.** Reading the raw fixture (6 rows; cc totals 2000+2000+1000+4000+2000+1000=12000; cr totals 0+0+500+0+1000+0=1500) let me confirm the assertions in the test file without running a calculator separately. For audit/parsing tests, this is the fastest path to high-confidence approval.

## Skill Gaps

- None. The work is rule/skill/agent-prose editing (`Skill: None` steps) + one `release-plugin` follow +
  the ADR-23 `skill-lint` form gate; no missing pattern skill surfaced.
