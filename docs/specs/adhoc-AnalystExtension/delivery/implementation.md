# nexus-analytics — the Data-Analyst Domain Extension — Implementation

**Status:** COMPLETE — all 6 plan steps implemented, verified, and re-verified in a final
comprehensive pass (see the completion footer). Written incrementally per step throughout (not
held for the end). Concurrent-tree note: the sibling slug `adhoc-ArchitectFastLane` committed
mid-build (commit `7ef5d44`, nexus 1.30.0) — see `## Concurrent-Tree Notes` below. One documented,
attributed, out-of-scope baseline test failure persists throughout (not this slug's regression —
see Concurrent-Tree Notes and Carry-Over Findings).

## Entry Precondition — Verified

```
$ git status --short plugins/nexus/skills/mine-semantic-model
?? plugins/nexus/skills/mine-semantic-model/
```
PASS — untracked, as required. Re-verified after the concurrent session's commit landed (still `??`).

**Effective snapshot** (`git status --short -- plugins/nexus/`, re-taken after the concurrent
session's commit at 23:34:39 — see Concurrent-Tree Notes):
```
 M plugins/nexus/skills/mine-reference-model/SKILL.md
 M plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
 M plugins/nexus/skills/mine-verify-repo/SKILL.md
?? plugins/nexus/skills/mine-semantic-model/
```
This is the AC-7 comparison baseline: only the 3 already-dirty family-registration edits (OURS,
expected, made under adhoc-MineSemanticModel) + the untracked mine folder.

## Concurrent-Tree Notes

The originally-briefed dirty-file list (`plugin.json` 1.29.0, `CHANGELOG.md`, `agents/solo.md`,
`agents/team-lead.md`, `commands/solo.md`, `commands/team-lead.md`, `rules/agents-workflow.md`) no
longer matches the live tree: partway through this build the concurrent session (`adhoc-
ArchitectFastLane`) **committed** its work — `git log --oneline -1` → `7ef5d44
feat(adhoc-ArchitectFastLane): add architect-led fast lane (standalone mini-pipeline), release
nexus 1.30.0`. That commit also touched `agents/architect.md`, `commands/architect.md`, and
`skills/summary-format/SKILL.md` (the mystery dirty file from the initial snapshot — now
explained: it was that session's work, not a third, unattributed actor). None of this was staged,
reverted, or edited by this slug — verified read-only via `git log`/`git show`, per the hard rule
against touching concurrent-session files. The net effect **simplifies** the shared-tree situation:
`plugins/nexus/` is now dirty with only this slug's own 3 expected family-registration edits + the
untracked mine folder (see snapshot above).

**Side effect:** commit `7ef5d44` shipped a new line in `plugins/nexus/agents/architect.md` that
references `` `code-review` skill `` — no shipped plugin (any of the 6 in `marketplace.json`) ships
a skill named `code-review` (it is a built-in Claude Code skill, not a nexus-plugin artifact), so
`tests/lint/skill-refs.test.mjs`'s "in-body `` `name` skill `` references resolve to a shipped
skill" test fails **at HEAD**, independent of anything in this slug. Confirmed via
`git show HEAD:plugins/nexus/agents/architect.md | grep code-review` (present) vs the previous
commit (absent) — this is commit `7ef5d44`'s change, not mine. It reproduces **identically under
both the pre-Step-1 (narrow) and post-Step-1 (widened) skill-refs test** — i.e. Step 1's
marketplace-driven widening did not newly surface it (it was already failing before I touched
anything), so it is **not** added to the Step 1 skip-list (that mechanism is reserved for
violations the widening newly exposes in *other* plugins — see AC-9 below). `agents/architect.md`
is on this slug's explicit do-not-touch list, and even without that constraint, fixing a just-shipped
sibling slug's bug is out of this slug's scope. **Carried as a documented, standing baseline
exclusion for every "full suite green" claim in this file** — reported honestly as 508/509 (1
pre-existing, attributed, unrelated failure), never silently absorbed or claimed away.

## Per-Step Disposition

| Step | Description | Disposition |
|------|-------------|-------------|
| 1 | Generalize dev tooling (gen-commands + 3 lint suites + selfcheck) | **Implemented** — see below |
| 2 | Scaffold the plugin | **Implemented** — see below |
| 2b | Relocate the fifth mine | **Implemented** — see below |
| 3 | Author data-analyst agent + generate command | **Implemented** — see below |
| 4 | Author the three skills + evaluate-skill ×3 | **Implemented** — see below |
| 5 | Register the sixth plugin | **Implemented** — see below |
| 6 | Initial release (no bump apply) | **Implemented** — see below |

## Step 1 — Generalize the dev tooling

### 1. `scripts/gen-commands.mjs`

Replaced the hard-coded 8-role `MAP`-driven loop with: agent set = `readdirSync(AGENTS_DIR)`
(`.md` files, sorted). `MAP` stays as an **override table** — every one of nexus's 8 founding
agents has a MAP entry, so nexus's output is unaffected (byte-identity verified below). An agent
with no MAP entry (any plugin) gets `{ proper, desc }` **derived** from its own doc: `proper` = the
first H1 heading with a trailing `" Agent"` stripped; `desc` = `Become the ${proper} — ` + the
frontmatter description's first sentence — matching the MAP entries' own "Become the X — ..."
shape. A flat single-line frontmatter parser (identical shape to `tests/helpers.mjs`'s
`frontmatter()`) was added locally to `gen-commands.mjs` to read the description for derivation
(no shared import — the script has no dependency on the test harness, by design).

### 2. Lint discovery generalized to `marketplace.plugins`

- `tests/lint/frontmatter.test.mjs` — all 3 tests (agent frontmatter, skill frontmatter, command
  generation) now iterate `marketplace.plugins` instead of hard-coding `'nexus'` /
  `['nexus','nexus-dotnet']`. Each guards plugins missing the relevant dir (skip, not fail) and
  asserts at least one plugin WAS checked (test-is-inert guard). The nexus `>= 8 agents` sanity
  floor is preserved (scoped to the `plugin === 'nexus'` iteration).
- `tests/lint/wiring.test.mjs` test 4 — surface discovery (agents/rules/skills dirs to scan for
  `subagent_type`/`nexus:X` references) now iterates `marketplace.plugins`; the **resolution**
  target for `nexus:X` stays nexus's own agents/skills (unchanged semantics — `nexus:X` always
  means "the nexus plugin's X" regardless of which plugin's file mentions it).
- `tests/lint/skill-refs.test.mjs` — discovery generalized to `marketplace.plugins` for all 3
  tests. Test 1 (frontmatter `skills:` list) now resolves against the **same plugin's own** skill
  set (was nexus-only; a domain extension's agent lists its own sibling skills, same as nexus
  today). Tests 2/3 (in-body `` `name` skill `` and `` `{x}-format}` `` references) resolve against
  the **union of every plugin's** skills (was nexus ∪ nexus-dotnet hard-coded) — preserves the
  existing cross-plugin precedent (`mine-verify-cover-dotnet` referencing core's
  `mine-verify-cover`) and extends it to any plugin pair, including same-plugin references inside
  a new extension (`nexus-analytics`'s `data-investigation` → `mine-semantic-model`, both in the
  same plugin post-relocation).

### 3. `scripts/selfcheck.mjs` gen-commands drift check

Extended from a single hard-coded `plugins/nexus/commands` diff to a loop over every
`marketplace.plugins` entry whose `plugins/{name}/agents` dir exists (discovered, not listed).
Currently resolves to `['nexus']` alone (the only agent-bearing plugin among the 5 existing);
picks up `nexus-analytics` automatically once Step 3 creates its `agents/` dir — no further
selfcheck edit needed.

### 4. Pre-existing-violation protocol — run FIRST, before any plugin content changes

Ran the widened suites over the current **5**-plugin discovery (`nexus-analytics` does not exist
yet at this point in the build):

```
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
ℹ tests 509 / pass 508 / fail 1
```

Two distinct pre-existing issues surfaced, handled differently per their cause:

1. **`nexus-flutter/skills/figma-to-flutter/SKILL.md` — `argument-hint` frontmatter key.**
   Genuinely NEW-to-widening (test 2 of `frontmatter.test.mjs` never checked `nexus-flutter`
   before). **Named skip-list added** in `frontmatter.test.mjs`
   (`SKILL_FRONTMATTER_KEY_SKIPLIST`, keyed by repo-relative path, allowing exactly the
   `argument-hint` key for that one file) — every other check on that file (name/description/other
   keys) still runs. Its fix rides `nexus-flutter`'s own next release, never this slug's.
2. **`plugins/nexus/agents/architect.md` — `` `code-review` skill `` reference, no shipped skill
   by that name.** NOT new-to-widening (reproduces identically under the pre-Step-1 narrow test
   too — verified by re-running the original hard-coded nexus/nexus-dotnet resolution set before
   editing skill-refs.test.mjs; the string "code-review" is absent from every shipped plugin's
   skill set either way). Caused by the concurrent sibling commit `7ef5d44` (see Concurrent-Tree
   Notes) — not this slug's to fix (forbidden file; not my content). **Not added to the skip-list**
   (that mechanism is reserved for violations Step 1's widening newly exposes elsewhere); carried
   as a documented, standing, attributed baseline exclusion for the remainder of this build.

After the skip-list fix: `508/509` — the sole remaining failure is item 2 above (baseline,
attributed, out of scope).

**Skip-list (Step 1, explicit, non-empty):**
| Plugin | File | Violation | Why not fixed here |
|--------|------|-----------|---------------------|
| nexus-flutter | `skills/figma-to-flutter/SKILL.md` | frontmatter key `argument-hint` not in `SKILL_KEYS` | pre-existing at HEAD, first surfaced by this slug's marketplace-wide widening; fix rides nexus-flutter's own next release |

### AC-8 (nexus half) — executed

```
$ node scripts/gen-commands.mjs nexus
(regenerates commands/architect.md, critic.md, developer.md, learner.md, po.md, reviewer.md,
 solo.md, team-lead.md)
$ git status --short -- plugins/nexus/commands
(no output — zero drift)
```
PASS — `git diff -- plugins/nexus/commands` content is byte-identical before and after regen
(snapshot-compare methodology, same as selfcheck's own check). MAP-as-override byte-identity
contract holds: all 8 nexus agents have MAP entries, so none went through the derive path.

```
$ node scripts/gen-commands.mjs nexus-dotnet
gen-commands: nexus-dotnet has no agents/ dir — nothing to generate.
```
PASS — clean no-op preserved (critic CRITICAL-1 regression check).

### AC-9 (structural half) — executed

```
$ grep -c "marketplace.plugins" tests/lint/frontmatter.test.mjs tests/lint/wiring.test.mjs tests/lint/skill-refs.test.mjs
tests/lint/frontmatter.test.mjs:2
tests/lint/wiring.test.mjs:1
tests/lint/skill-refs.test.mjs:2
```
PASS — all three ≥ 1. Suite green over current 5-plugin discovery (508/509, 1 documented
attributed baseline exclusion — see above). Skip-list recorded, non-empty, named (table above).

(AC-9's coverage half — green over 6-plugin discovery — lands at Step 5 via AC-6, per the plan's
timing split (critic N1). AC-8's `nexus-analytics` half lands at Step 3.)

## Step 2 — Scaffold the plugin

Created `plugins/nexus-analytics/.claude-plugin/plugin.json` (name `nexus-analytics`, version
`0.1.0`, description, `author: { name: "ldumit" }`, keywords, `dependencies: ["nexus"]` — field set
mirrors `nexus-dotnet`'s plugin.json exactly, the extension precedent named in the plan) and
`plugins/nexus-analytics/CHANGELOG.md` (`# Changelog — nexus-analytics` header, matching the
majority convention among the 3 most-recently-created plugins — nexus-cpp/nexus-flutter/nexus-php
all use `# Changelog — {name}`; only the original nexus/nexus-dotnet pair uses the reverse order —
with a `[0.1.0] — 2026-07-10` entry naming all 5 shipped artifacts per the plan's required content).

### AC-1 — executed

```
$ cat plugins/nexus-analytics/.claude-plugin/plugin.json | grep -E '"name"|"version"'
  "name": "nexus-analytics",
  "version": "0.1.0",
$ head -5 plugins/nexus-analytics/CHANGELOG.md
# Changelog — nexus-analytics

All notable changes to the `nexus-analytics` plugin.

## [0.1.0] — 2026-07-10
```
PASS — file exists, name/version exact, CHANGELOG top entry is `[0.1.0]`.

## Step 2b — Relocate the fifth mine

**Move (byte-preserving).** `mv "plugins/nexus/skills/mine-semantic-model" "plugins/nexus-analytics/skills/mine-semantic-model"`
(plain filesystem move — the folder was untracked, so `git mv` does not apply; a plain `mv`/rename
does not touch file bytes). Verified byte-preservation via an md5sum manifest taken before the move
and re-checked (path-normalized) after:

```
$ find plugins/nexus/skills/mine-semantic-model -type f -exec md5sum {} \; | sort -k2 > pre.txt
$ mv plugins/nexus/skills/mine-semantic-model plugins/nexus-analytics/skills/mine-semantic-model
$ find plugins/nexus-analytics/skills/mine-semantic-model -type f -exec md5sum {} \; | sort -k2 > post.txt
$ diff pre.txt post.txt   (paths normalized for comparison)
(no output — CHECKSUMS IDENTICAL)
$ git status --short plugins/nexus/skills/mine-semantic-model
(no output — source gone)
```
PASS — byte-preserving move confirmed; core copy gone.

**Pointer re-wording (the one sanctioned content-edit class).** All 4 relative
`` `../mine-verify-cover/references/mine-family-core.md` §X `` lines in the relocated `SKILL.md`
(originally lines 224, 231, 241, 252) rewritten to the cross-plugin prose form — "read nexus core's
`` `mine-verify-cover` `` skill → its `` `mine-family-core.md` `` reference, §X (this plugin
requires nexus core)" — matching the `mine-verify-cover-dotnet` precedent's plain-prose,
no-file-path style (`` `mine-verify-cover` → "Fact tagging & test tiers" ``). No other content
changed in the relocated skill.

```
$ grep -c "mine-family-core" plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md
4
$ grep -rn "\.\./mine-verify-cover" plugins/nexus-analytics/skills/mine-semantic-model/
(no output)
```
PASS — 4 pointer lines present (reworded, none dropped), zero remaining relative cross-plugin
file paths.

**Core marker edits (the only sanctioned core content changes this slug makes).** Two
`(ships in nexus-analytics)` markers added in
`plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`: the family-table row
(`` | `mine-semantic-model` (ships in nexus-analytics) | one datasource area | ... ``) and the
per-skill staging bullet (`` - `mine-semantic-model` (ships in nexus-analytics) — phases run
sequentially... ``). Nothing else in the file touched — verified via `git diff`, whose only
additions beyond the 3 already-dirty adhoc-MineSemanticModel edits (OURS, expected, pre-existing
before this slug started) are exactly these 2 marker insertions.

### Travelled AC battery — re-run at the new path

```
$ grep -l "SET TRANSACTION READ ONLY" plugins/nexus-analytics/skills/mine-semantic-model/probes/*.sql | wc -l
7
$ grep -l "statement_timeout" plugins/nexus-analytics/skills/mine-semantic-model/probes/*.sql | wc -l
7
$ grep -inE '^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|GRANT)' plugins/nexus-analytics/skills/mine-semantic-model/probes/*.sql
(no output)
```
PASS (probe write-keyword grep) — all 7 files carry both BR1 markers; zero write-keyword hits.

```
$ grep -rlE 'laurentiu_read|kg_seed|kg_god_ro|seed/db/|omnishelf-docs|analytics_report|analytics_events|retail_chain_id|fmcg_platform' plugins/nexus-analytics/skills/mine-semantic-model/
plugins/nexus-analytics/skills/mine-semantic-model/probes/cardinality.sql
plugins/nexus-analytics/skills/mine-semantic-model/probes/orphan-fk-fanout.sql
plugins/nexus-analytics/skills/mine-semantic-model/references/project-profile.md
```
PASS with the same carve-out as the original build (KG-token scoping, profile + probes
carve-outs, per the plan's own wording) — identical 3-file result as the pre-relocation run
(`docs/specs/adhoc-MineSemanticModel/delivery/implementation.md` AC-6): `project-profile.md` is
the sole worked example (by design) and the same 2 probe files carry the same pre-existing
inline-comment tokens (`questions.md` Q1 in that slug — Step 1 there forbade editing the SQL; this
slug's Step 2b likewise makes no SQL edits, byte-for-byte carried forward).

```
$ grep -rnE '\.cs\b|\.ps1\b|\bdotnet\b|DataPool|QueryLoad|\bF[0-9]{2}\b' plugins/nexus-analytics/skills/mine-semantic-model --include=*.md --include=*.sql | grep -v "references/project-profile.md"
plugins/nexus-analytics/skills/mine-semantic-model/probes/orphan-fk-fanout.sql:8:...F52 Step 6 dry-run...
plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md:14:...feature `F38`...
plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md:15:...`F38` is the one feature-id...
```
PASS with the same sanctioned F38-in-SKILL.md exception + the same pre-existing F52 probe-comment
carve-out as the original build — identical result set, confirming the relocation introduced zero
drift beyond the 4 pointer-line rewrites.

```
$ for f in <every shipped file>; do head -c3 "$f" | od -An -tx1; done
SKILL.md: 2d 2d 2d          (---)
references/*.md: 23 20 4x   (# ...)
probes/*.sql: 2d 2d 20      (-- )
```
PASS — no file starts with `EF BB BF`; every shipped file confirmed BOM-free at the new path.

### P1 single-copy battery (MineFamilyCore AC-3 anti-drift contract) — re-run cross-plugin

```
$ for phrase in "capture the start" "is the session that owns spawning" "carried unchanged from ADR-43" "appends a changelog entry"; do
    grep -rl -- "$phrase" plugins/*/skills/; done
capture the start                        -> plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md   (1 hit)
is the session that owns spawning        -> plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md   (1 hit)
carried unchanged from ADR-43            -> plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md   (1 hit)
appends a changelog entry                -> plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md   (1 hit)
```
PASS — all 4 phrases hit EXACTLY ONE file (`mine-family-core.md`) across `plugins/*/skills/**`. The
relocated `SKILL.md`'s "Relationship to the mine family" section restates none of them (confirmed
by the same grep finding zero hits in `plugins/nexus-analytics/**`) — the P1 anti-drift contract
survives the relocation.

### Regression check — full suite re-run after relocation + marker edits

```
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
ℹ tests 509 / pass 508 / fail 1   (the same single documented baseline exclusion — no new failures)
```

## Step 3 — Author the data-analyst agent + generate its command

Created `plugins/nexus-analytics/agents/data-analyst.md` (60 lines — within the 50–70 target,
learner.md's lean register: role paragraph, 3 numbered-discipline sections, sibling-skill
pointers, What-You-Know, What-You-Never-Do; no Coordination Protocol section — this is a
consuming-repo domain persona, not an SDD pipeline role, so the slug/plan/cycle-cap machinery
doesn't apply). Frontmatter: `name: data-analyst`, a >=40-char `description`, `model: sonnet`,
`effort: xhigh` (matching solo.md's config — the closest existing precedent for a lean,
non-pipeline, interactive persona), `skills: semantic-model-query, data-investigation, answer-qa`.
Sources: the analytics repo's `.claude/rules/interview.md` (batched-ask, persist-then-never-reask
pattern), `query-patterns.md`/`no-gold-tables.md` (generalized into the sibling skills, not
duplicated here), and `.claude/skills/data-analyst/SKILL.md` (the model-first navigation +
answer-contract shape) — read cross-repo, cited by neither path in the shipped content (AC-4).

Content decisions:
- **Batched-interview intake** stated generically (date range, output destination, "any
  project-specific identifiers the profile declares") — no Sheets/chain specifics, per the plan's
  explicit instruction; the analytics repo's `interview.md` retail-chain/Sheets specifics are the
  SOURCE pattern, not something this shipped file names.
- **Sibling-skill pointers** by plain name only (`semantic-model-query`, `data-investigation`,
  `answer-qa`) — all three live in this same plugin.
- **No literal `${CLAUDE_PLUGIN_ROOT}`** anywhere in the file — verified by grep (0 hits) and will
  be re-verified by `release.test.mjs`'s hygiene check once Step 5 registers the plugin.

Then generated the command:
```
$ node scripts/gen-commands.mjs nexus-analytics
wrote commands/data-analyst.md (3326 bytes)
$ echo exit: $?
exit: 0
```
The gen-commands derive path exercised for the first time (no MAP entry for `data-analyst`):
`proper` derived from the H1 `# Data Analyst Agent` → `Data Analyst` (the trailing " Agent"
correctly stripped); `desc` derived from the frontmatter description's first sentence →
`Become the Data Analyst — Answer business questions over the project's live datasource through
the semantic model — never by improvised SQL.` Spot-checked the generated command: agent body
inlined under the activation wrapper, no `model:`/`effort:`/`skills:` leaked into the command
frontmatter (grep confirmed 0 hits — audit B4 preserved for the derive path, not just the MAP
path).

### AC-2 — executed

```
$ grep -n "one message" plugins/nexus-analytics/agents/data-analyst.md
3:description: ...in one message...
53:- Ask missing-input questions one at a time → instead: batch them all in one message.
$ grep -n "never re-asked" plugins/nexus-analytics/agents/data-analyst.md
20:persisted is **never re-asked**: read it back, confirm it, and move on.
```
PASS — both literals present in the body (not just frontmatter); `commands/data-analyst.md`
generated in this same working round.

### AC-8 (nexus-analytics half) — executed

```
$ node scripts/gen-commands.mjs nexus-analytics
wrote commands/data-analyst.md (3326 bytes)   [exit 0]
```
PASS — exits 0, produces `commands/data-analyst.md`. Combined with the Step 1 nexus-half result,
AC-8 is now fully executed.

### Regression check

```
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
ℹ tests 509 / pass 508 / fail 1   (same single documented baseline exclusion)
```
`nexus-analytics` is not yet marketplace-registered (Step 5), so its own frontmatter/skill-refs
coverage is not live yet — expected, per critic N2's timing note; no new failures either way.

## Step 4 — Author the three skills, then evaluate-skill ×3

Created `plugins/nexus-analytics/skills/{semantic-model-query,data-investigation,answer-qa}/SKILL.md`,
each with `name`, `description`, `user-invocable: true`, no `disable-model-invocation` (all three
remain model-invocable). Sources: the analytics repo's `.claude/rules/query-patterns.md` +
`no-gold-tables.md` (read cross-repo, cited by neither path) generalized into
`semantic-model-query`'s obligation classes; `.claude/skills/data-analyst/SKILL.md`'s Step 1
model-resolution shape generalized into the ladder; `interview.md`'s bad-reports rule generalized
into the shared obligation class. Extracted the SHARED rule each source independently proved (the
tech-spec's own framing: "both independently evolved the same guardrails ... proof the method is
real"), never the KG-specific or analytics-repo-specific mechanics.

- **`semantic-model-query`** — the resolution ladder (`grain → table`, `metric → column`,
  `dimension → join`, U+2192 arrows, case-insensitive synonym matching) + the mandatory-obligation
  pre-query check (bad-reports-excluded class, no-gold-tables class, large-table bound patterns) +
  both model flavors (JSON bundle, CSV trio) named explicitly.
- **`data-investigation`** — invokes the sibling `mine-semantic-model` skill by plain name (same
  plugin, post-relocation) in its read-only investigation posture, carrying BR1/BR12; routes
  confirmed model-changing findings to the mine's own governed run modes, never a silent inline
  patch.
- **`answer-qa`** — the 5-item answer contract (grain, filters-applied, date range, constructs,
  data-caveats) and the `malformed` verdict, including the inverted-claim case (stating a filter
  was applied when it wasn't).

### evaluate-skill ×3 — invoked, findings folded before Step 5

Invoked via the Skill tool once per skill (audit-log confirmation below). Findings docs:
`docs/skill-evals/2026-07-10-{semantic-model-query,data-investigation,answer-qa}.md`. All three
verdicts: **fix-then-accept** — every finding applied in this same pass, none deferred as a
carry-over:

| Skill | Findings | Applied |
|-------|----------|---------|
| semantic-model-query | F1 (Medium, Layer 1.5) missing scope fence; F2 (Low, Layer 4.1) no lessons-capture pointer; F3 (Low, Layer 2.2, observation only — not fixed, recorded as a future-hardening trigger) | F1, F2 applied |
| data-investigation | F1 (Low, Layer 1.5) adjacent skill named by concept not name; F2 (Low, Layer 4.1) no lessons-capture pointer | F1, F2 applied |
| answer-qa | F1 (Medium, Layer 1.5) missing scope fence; F2 (Low, Layer 4.1) no lessons-capture pointer | F1, F2 applied |

Each fix added a `## What this skill does NOT do` section (naming the other two sibling skills +
a `**Consumed by:** the \`data-analyst\` agent` line) and a one-line lessons-capture pointer
(matching the pattern already proven in the relocated `mine-semantic-model` skill). One
line-wrap defect caught and fixed during the pass: two of the new scope-fence bullets in
`semantic-model-query` split `` `name` `` and `skill` across a line break, which would have made
them invisible to `skill-refs.test.mjs`'s `` `name` skill `` lint pattern (regex requires the
literal substring on one line) — reflowed so the pattern matches and the cross-reference is
actually lint-checked, not just visually present.

Audit trail confirmation (this session, the 3 most recent `evaluate-skill` entries — an earlier
entry at `19:28:40.467Z` in the same session belongs to the prior `adhoc-MineSemanticModel` build,
already cited in that slug's own implementation.md):
```
$ grep evaluate-skill .claude/audit/skill-invocations.log | grep 133567f3 | tail -3
{"ts":"2026-07-10T20:55:11.577Z","agent":"developer","skill":"evaluate-skill","token":"done","session":"133567f3-..."}
{"ts":"2026-07-10T20:56:49.172Z","agent":"developer","skill":"evaluate-skill","token":"done","session":"133567f3-..."}
{"ts":"2026-07-10T20:56:51.662Z","agent":"developer","skill":"evaluate-skill","token":"done","session":"133567f3-..."}
```

### AC-3 — executed

```
$ grep -c "resolution ladder" plugins/nexus-analytics/skills/semantic-model-query/SKILL.md
4
$ grep -c "grain → table\|metric → column\|dimension → join" plugins/nexus-analytics/skills/semantic-model-query/SKILL.md
3
$ grep -n "mine-semantic-model" plugins/nexus-analytics/skills/data-investigation/SKILL.md | wc -l
4
$ grep -n "\.\./\.\./nexus/" plugins/nexus-analytics/skills/data-investigation/SKILL.md
(no output)
$ grep -c "grain" plugins/nexus-analytics/skills/answer-qa/SKILL.md
3
$ grep -c "date range" plugins/nexus-analytics/skills/answer-qa/SKILL.md
3
$ grep -c "malformed" plugins/nexus-analytics/skills/answer-qa/SKILL.md
3
```
PASS — three folders exist; `resolution ladder` literal phrase present + all 3 arrow forms present
in `semantic-model-query`; `mine-semantic-model` referenced by plain name in `data-investigation`,
zero `\.\./\.\./nexus/` cross-plugin file-path hits; `answer-qa`'s `grain`/`date range`/`malformed`
contract signature all ≥1. (Frontmatter validity under the Step-1-generalized lint is confirmed
structurally now via `skill-lint.mjs` — all three `OK`; full marketplace-driven lint coverage goes
live at Step 5 per critic N2's timing note, re-verified there.)

**Note on the plan's Step 4 acceptance text vs the tech-spec.** The plan's own Step 4
"Acceptance:" paragraph literally reads `` `nexus:mine-semantic-model` present ``, which conflicts
with (a) the SAME step's design bullet — "invoke the sibling `mine-semantic-model` skill (plain
name — SAME plugin now; never a cross-plugin file path)" — and (b) the tech-spec's own AC-3, which
never mentions a `nexus:` prefix at all ("references the RELOCATED sibling mine by plain name
(`mine-semantic-model`, same plugin...)"). Treated as a plan transcription artifact (likely
copy-paste bleed from `wiring.test.mjs`'s literal `nexus:X` regex) and implemented per the
tech-spec + the explicit "plain name" instruction repeated in this slug's own task brief. Grepped
BOTH readings: `mine-semantic-model` (plain, present, 4 hits) satisfies the tech-spec; a literal
`nexus:mine-semantic-model` string does NOT appear anywhere (0 hits) and was never written, since
doing so would contradict "never a cross-plugin file path" and the plain-name design decision.
Flagged in Carry-Over Findings for architect confirmation — not a blocking ambiguity given the
tech-spec + explicit brief instruction resolve it, but worth a plan-text cleanup.

### AC-4 — executed

```
$ grep -c "docs/semantic-model/profile.md" plugins/nexus-analytics/skills/semantic-model-query/SKILL.md plugins/nexus-analytics/skills/data-investigation/SKILL.md plugins/nexus-analytics/skills/answer-qa/SKILL.md
plugins/nexus-analytics/skills/semantic-model-query/SKILL.md:3
plugins/nexus-analytics/skills/data-investigation/SKILL.md:3
plugins/nexus-analytics/skills/answer-qa/SKILL.md:1
$ grep -n "JSON bundle\|CSV trio" plugins/nexus-analytics/skills/semantic-model-query/SKILL.md
27:may name either representation — a JSON bundle or a CSV trio (a grain-routing file, a
```
PASS — literal `docs/semantic-model/profile.md` in all three (≥1 each); `semantic-model-query`
states both flavors explicitly.

**Consumer-token grep — two readings, both executed and disclosed (same honesty pattern the
original `adhoc-MineSemanticModel` build used for its own analogous AC-6/AC-9 tension):**
```
$ grep -rniE "omnishelf|fmcg_platform|knowledge-gateway" plugins/nexus-analytics/skills/semantic-model-query/ plugins/nexus-analytics/skills/data-investigation/ plugins/nexus-analytics/skills/answer-qa/ plugins/nexus-analytics/agents/ plugins/nexus-analytics/commands/
(no output — 0 hits)

$ grep -rlniE "omnishelf|fmcg_platform|knowledge-gateway" plugins/nexus-analytics/
plugins/nexus-analytics/skills/mine-semantic-model/references/project-profile.md
```
**Narrow reading** (the three Step-4 skills + the agent + command — what AC-4's sentence is
grammatically about, "all three [SKILL.mds]"): **PASS, 0 hits.**
**Broad reading** (literally "across the plugin", including the relocated mine): **1 file hit**,
entirely inside `mine-semantic-model/references/project-profile.md` — the SAME file the original
`adhoc-MineSemanticModel` build's own AC-6 already sanctioned as "the sole worked example... KG
tokens exactly as designed" (verified byte-identical via the Step 2b checksum diff — this slug
introduced zero new tokens there). Treated as the SAME sanctioned exception traveling with the
relocated file, not a new violation this slug created. Recorded as a Carry-Over Finding for
architect adjudication rather than silently narrowed.

### Regression check

```
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
ℹ tests 509 / pass 508 / fail 1   (same single documented baseline exclusion — no new failures)
```

## Step 5 — Register the sixth plugin

Four edits per the plan (tech-spec §Repo machinery 1–4):

1. `.claude-plugin/marketplace.json` — appended `{ "name": "nexus-analytics", "source":
   "./plugins/nexus-analytics" }` as the 6th entry.
2. `scripts/gen-omni.mjs` — added `mirrorPlugin('nexus-analytics', 'omni-analytics');` immediately
   after the `nexus-php` call (line 102, as the plan named), and the matching
   `{ name: 'omni-analytics', source: './plugins/omni-analytics' }` entry in `wantPlugins`.
3. Root `README.md` — added a `nexus-analytics` row to the Plugins table (scope, skill count `4 (3
   method + 1 mined)`, install id, `dependencies: ["nexus"]` install note — matching the
   `nexus-dotnet` row's shape, the only other dependency-installed plugin in that table).
4. Ran `gen-omni.mjs`, `--check`, the full suites, and `selfcheck.mjs` — all below.

### AC-5 — executed

```
$ node scripts/gen-omni.mjs
=== omni regenerated from nexus ===
  plugins: omni, omni-dotnet, omni-flutter, omni-cpp, omni-php, omni-analytics   (omni-net removed)
  preserved: omni/LICENSE, marketplace name/owner
  verify: node scripts/gen-omni.mjs --check

$ node scripts/gen-omni.mjs --check
✓ omni twin is in sync with nexus.
[exit 0]
```
PASS — marketplace lists 6:
```
$ node -e "console.log(JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json')).plugins.map(p=>p.name))"
[
  'nexus',
  'nexus-dotnet',
  'nexus-flutter',
  'nexus-cpp',
  'nexus-php',
  'nexus-analytics'
]
```
(6 entries in the `plugins` array — `grep -c '"name"' .claude-plugin/marketplace.json` returns 8,
which double-counts the top-level `marketplace.name` and `owner.name` fields; the array-length
check above is the accurate one.) Both gen-omni edits present and exercised; `gen-omni` + `--check`
both clean; README line added.

Spot-checked the mirrored twin content for a clean token swap (no double-swap artifacts):
```
$ cat ../omni/plugins/omni-analytics/.claude-plugin/plugin.json | head -3
{
  "name": "omni-analytics",
  "version": "0.1.0",
$ grep -rli "omniomni\|omnimni\|nexusnexus" ../omni/plugins/omni-analytics/
(no output — clean)
```
Matches the critic's pre-verified prediction (review-critic.md: "gen-omni swap is CLEAN for the new
tokens... no double-swap").

**Deviation — a real regression caught and fixed, not silently absorbed.**
`tests/unit/gen-omni.test.mjs` runs `gen-omni.mjs` against a SYNTHETIC sandbox fixture (never the
real `../omni` tree) that hard-codes which stack/domain plugin directories it seeds — the same
shape of issue as critic C1, but in the unit-test fixture rather than the script itself. Adding
`mirrorPlugin('nexus-analytics', ...)` made the fixture's own `collect()` call ENOENT on a
`plugins/nexus-analytics` directory the fixture never created, and the first test's expected
`mp.plugins` array was still the 5-plugin list. Fixed by seeding a minimal
`plugins/nexus-analytics/skills/semantic-model-query/SKILL.md` fixture file (mirroring the exact
pattern already used for nexus-flutter/nexus-cpp/nexus-php: "seed them so collect() doesn't
ENOENT") and updating the expected array to include `omni-analytics`. This is this slug's OWN test
file for a script this slug edited — not another plugin's shipped file — so it's a normal part of
Step 5, not a skip-list candidate.

### AC-6 — executed (coverage half of AC-9 lands here too)

```
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
ℹ tests 510 / pass 509 / fail 1
```
510 tests now (509 + 1, the new gen-omni fixture test); the SAME single documented baseline
exclusion (`architect.md`/`code-review`, concurrent sibling commit `7ef5d44`) — no NEW failures.
Critically: **nexus-analytics's own agent/command/skills now pass the widened lint clean** —
confirms AC-9's coverage half (suite green over 6-plugin discovery) and AC-3's "frontmatter valid
under the Step-1-generalized lint" claim, both live for the first time.

```
$ node scripts/selfcheck.mjs
[FAIL] tests (lint + unit) — 1 failing
[PASS] gen-commands drift — nexus: in sync; nexus-analytics: in sync
[PASS] gen-omni --check — twin in sync
[PASS] bump-plugin --check — bump present (or no shipped change)
[PASS] spec-diff inline-copy sync — 7 lib/workflow pair(s) in sync
[INFO] salience report — informational — never fails the run

selfcheck: 4/5 passed (1 failing)
```
**4/5, one explained delta** — the sole FAIL is the same documented, attributed, out-of-scope
baseline exclusion (not this slug's regression). The `gen-commands drift` line now explicitly
reports on BOTH agent-bearing plugins (`nexus: in sync; nexus-analytics: in sync`) — the Step 1
generalization's discovery mechanism working as designed, picking up `nexus-analytics` with no
further selfcheck edit needed, exactly as predicted in the Step 1 write-up.

## Step 6 — Initial release (no bump apply)

Followed `release-plugin` EXCEPT its apply step, per the plan's explicit carve-out for a
brand-new plugin (the 0.1.0 scaffold + its own `[0.1.0]` CHANGELOG entry IS the release).

**Hard instruction honored: no apply, no `--minor`/`--major`, for `nexus-analytics`.** Ran only
`--check` (the plan's literal instruction) plus a read-only `--dry-run` diagnostic (changes
nothing on disk) to positively confirm the H2 hazard the plan guards against — its proposal was
NOT accepted or applied:

```
$ node scripts/bump-plugin.mjs --check
bump-plugin: no plugin behavior-surface changes detected — no bump needed.
[exit 0]
```
`--check` diffs `origin/main...HEAD` (or `HEAD~1` fallback) — since nothing in this slug is
committed yet, it correctly finds no *committed* plugin-surface delta to check, hence a trivial
pass. This is the plan's literally-instructed command and it exits 0 as required.

```
$ node scripts/bump-plugin.mjs --dry-run   [READ-ONLY — not accepted/applied]
bump-plugin (dry-run) — base HEAD:
  nexus: PATCH  1.30.0 -> 1.30.1
      - skill change (mine-reference-model)
      - skill change (mine-verify-cover)
      - skill change (mine-verify-repo)
  nexus-analytics: PATCH  0.1.0 -> 0.1.1
      - new plugin manifest
      - agent instruction/behavior change
      - shipped command changed
      - skill change (answer-qa)
      - skill change (data-investigation)
      - skill change (mine-semantic-model)
      - skill change (semantic-model-query)
[exit 0]
```
This **positively confirms H2**: apply-mode WOULD propose `nexus-analytics 0.1.0 -> 0.1.1`
(breaking AC-1) and, separately, `nexus 1.30.0 -> 1.30.1` for the 3 already-dirty core
family-registration files (explicitly out of this slug's scope — "Sequencing against core
siblings: NONE... Do not stage or commit any core file"). **Neither proposal was applied** — this
was a read-only diagnostic only, exactly as the plan's hard instruction requires.

### AC-7 — executed (revised, shared-dirty-tree form)

```
$ git status --short -- plugins/nexus/
 M plugins/nexus/skills/mine-reference-model/SKILL.md
 M plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
 M plugins/nexus/skills/mine-verify-repo/SKILL.md
```
Compared against the entry-precondition snapshot (recorded at build start, re-baselined after the
concurrent session's mid-build commit — see `## Concurrent-Tree Notes`):
```
 M plugins/nexus/skills/mine-reference-model/SKILL.md
 M plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
 M plugins/nexus/skills/mine-verify-repo/SKILL.md
?? plugins/nexus/skills/mine-semantic-model/
```
**The only delta: the untracked `mine-semantic-model/` folder is GONE** (relocated in Step 2b) —
exactly the one permitted change. Verified the marker edits are the ONLY content change inside
the already-dirty `mine-family-core.md` (not a new, additional core change):
```
$ grep -c "(ships in nexus-analytics)" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
2
```
And verified the OTHER two already-dirty sibling files (`mine-reference-model/SKILL.md`,
`mine-verify-repo/SKILL.md`) carry ZERO changes beyond what `adhoc-MineSemanticModel` already
made — `git diff` on both shows only the pre-existing "all four" -> "all five" edits documented in
that slug's own `implementation.md`, nothing added by this slug. **PASS** — no NEW core changes
beyond the snapshot; the snapshot shrank by exactly the relocated folder, as required.

`git diff --name-only -- plugins/nexus/` is NOT literally empty (the tech-spec's original AC-7
wording), because the revised entry precondition explicitly accepts the pre-existing 3-file dirty
state as a starting condition this slug inherits, not causes — the plan's own Step 6 text
supersedes the literal tech-spec wording with the snapshot-comparison form for exactly this
shared-tree scenario, and that revised form is what's executed and PASSED above.

### `bump-plugin --check` pass — recorded (see above, exit 0)

### CI `plugin-release-check` — local-equivalent replication (a developer never commits/opens a PR)

The developer role never commits (hard rule) or opens a PR, so the workflow's actual GitHub Actions
run cannot be observed from here. Replicated its two hard-gate jobs locally, which is the
strongest verification available pre-commit:
- **`version-bump-check` job** (`Check version bump` step) = `node scripts/bump-plugin.mjs --check
  --base {ref}` → same command verified above, exit 0.
- **`tests` job** (`T1 lint + T2 unit tests` step) = `node --test tests/lint/*.test.mjs
  tests/unit/*.test.mjs` → re-run fresh just now: `ℹ tests 510 / pass 509 / fail 1` (the one
  documented, attributed baseline exclusion — CI would show the same result if run against this
  exact tree, since it's the identical command).

**Carry-over discovery (read the workflow file itself, not just its name):** the `version-bump-
check` job's OWN second step, "Generated commands in sync (audit B5)", is hardcoded to `node
scripts/gen-commands.mjs nexus` only — it does NOT extend to `nexus-analytics` (or any other
agent-bearing plugin). Likewise the `plugin-validate` job hardcodes `claude plugin validate
plugins/nexus` + `plugins/nexus-dotnet` only — not the other 4 plugins, including the new one.
Neither `.github/workflows/plugin-release-check.yml` nor its hardcoded plugin lists were named
anywhere in the plan's Step 1 target list (`gen-commands.mjs`, the 3 lint test files,
`selfcheck.mjs`) or the tech-spec's "Repo machinery" enumeration — this is a genuine gap the
generalization didn't reach, discovered by reading the actual CI YAML rather than assuming its
name implies coverage (the same discipline the plan's own Testing Strategy section demands of
lint coverage claims). **Not fixed here** — out of the plan's explicit scope; recorded as a
Carry-Over Finding for architect disposition (a natural Step-1-adjacent follow-up, not blocking
this slug).

### Sequencing — confirmed none needed

This slug never bumps `plugins/nexus/.claude-plugin/plugin.json` or its `CHANGELOG.md` — verified
via `git status --short -- plugins/nexus/` above (neither file appears as modified by this slug).
A concurrent core release in flight does not gate this build, and none is in flight right now
(the earlier `adhoc-ArchitectFastLane` concurrency already resolved via its own commit `7ef5d44`
mid-build — see Concurrent-Tree Notes).

### Closure pointer (operator-owed, recorded not executed)

Per the plan and CLAUDE.md: the `../omni` twin commit, when made, uses
`feat(adhoc-AnalystExtension): sync nexus-analytics extension (omni-analytics 0.1.0)` with the
`Generated from the nexus plugin (nexus {sha}).` provenance footer — never a generic regenerate
message. **Not executed** — commits are the team lead's/operator's job, never the developer's
(hard rule); recorded here so the closing agent has the exact message ready.

## Files Created

- `plugins/nexus-analytics/.claude-plugin/plugin.json` — the 6th plugin's manifest (Step 2).
- `plugins/nexus-analytics/CHANGELOG.md` — `[0.1.0]` initial-release entry (Step 2).
- `plugins/nexus-analytics/agents/data-analyst.md` — the analyst persona (Step 3).
- `plugins/nexus-analytics/commands/data-analyst.md` — generated via `gen-commands.mjs` (Step 3).
- `plugins/nexus-analytics/skills/semantic-model-query/SKILL.md` — the resolution ladder + the
  mandatory pre-query obligation checks (Step 4).
- `plugins/nexus-analytics/skills/data-investigation/SKILL.md` — delegates to the sibling
  `mine-semantic-model` skill's read-only investigation posture (Step 4).
- `plugins/nexus-analytics/skills/answer-qa/SKILL.md` — the shipped-answer contract + `malformed`
  verdict (Step 4).
- `docs/skill-evals/2026-07-10-semantic-model-query.md`,
  `docs/skill-evals/2026-07-10-data-investigation.md`, `docs/skill-evals/2026-07-10-answer-qa.md`
  — the three `evaluate-skill` findings docs (Step 4).
- `docs/specs/adhoc-AnalystExtension/delivery/implementation.md` — this file.

## Files Relocated

- `plugins/nexus/skills/mine-semantic-model/**` → `plugins/nexus-analytics/skills/mine-semantic-model/**`
  (Step 2b) — byte-preserving filesystem move (checksum-verified before/after), the folder was
  never committed to core. Content edit: the 4 `` `../mine-verify-cover/references/mine-family-
  core.md` §X `` relative pointer lines in `SKILL.md` reworded to the cross-plugin prose form; no
  other content changed (verified via the travelled AC battery re-run at the new path, identical
  results to the original `adhoc-MineSemanticModel` build).

## Files Modified

- `.claude-plugin/marketplace.json` — appended the `nexus-analytics` entry, 6th plugin (Step 5).
- `README.md` — one new row in the Plugins table for `nexus-analytics` (Step 5).
- `scripts/gen-commands.mjs` — agent set generalized to `readdirSync(AGENTS_DIR)`; `MAP` kept as
  an override table; new `deriveEntry()` path for agents with no MAP entry (Step 1).
- `scripts/gen-omni.mjs` — added the `nexus-analytics` → `omni-analytics` `mirrorPlugin()` call and
  `wantPlugins` entry (Step 5).
- `scripts/selfcheck.mjs` — `gen-commands drift` check generalized from nexus-only to every
  agent-bearing plugin discovered via `marketplace.json` (Step 1).
- `tests/lint/frontmatter.test.mjs` — all 3 tests generalized to iterate `marketplace.plugins`;
  added the named `SKILL_FRONTMATTER_KEY_SKIPLIST` for the pre-existing `nexus-flutter` violation
  (Step 1).
- `tests/lint/wiring.test.mjs` — test 4's surface discovery generalized to `marketplace.plugins`
  (resolution target unchanged: `nexus:X` still means nexus's own agents/skills) (Step 1).
- `tests/lint/skill-refs.test.mjs` — all 3 tests generalized to `marketplace.plugins`; frontmatter
  `skills:` resolves same-plugin, in-body `` `name` skill `` and `` `{x}-format}` `` resolve
  any-plugin (Step 1).
- `tests/unit/gen-omni.test.mjs` — seeded a `nexus-analytics` fixture skill and updated the
  expected `mp.plugins` array so the sandbox test tracks the script's own new `mirrorPlugin()` call
  (Step 5 deviation — see below).
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — exactly 2
  `(ships in nexus-analytics)` marker insertions (the family-table row, the per-skill staging
  bullet); no other content touched (Step 2b). This file was ALREADY dirty at build start (3
  pre-existing edits from `adhoc-MineSemanticModel`, untouched by this slug beyond the 2 markers).

## Key Decisions

- **gen-commands derive-path design** (Step 1, not specified precisely by the plan beyond "derived
  from the agent doc"): `proper` = first H1 heading with a trailing `" Agent"` stripped; `desc` =
  `Become the {proper} — ` + the frontmatter description's first sentence, matching the MAP
  entries' own shape. Verified against the real `data-analyst.md` output — reads naturally.
- **README.md edit scoped to exactly one row**, per the plan's literal "one plugin-list line"
  instruction — did NOT attempt to fix the table's pre-existing staleness (its intro text says
  "ships as two plugins" and the table never grew rows for `nexus-cpp`/`nexus-flutter`/`nexus-php`,
  which predates this slug entirely). Flagged as a Carry-Over Finding, not silently expanded into.
- **CHANGELOG.md header form** — used `# Changelog — nexus-analytics` (the majority convention
  among the 3 most-recently-created plugins) rather than `# nexus-analytics — Changelog` (the
  original nexus/nexus-dotnet pair's older form, and also `bump-plugin.mjs`'s own auto-generated
  fallback title). Not lint-enforced either way; chose the more-recent precedent.
- **AC-4's "across the plugin" consumer-token grep** interpreted as scoped to the three Step-4
  skills + agent + command (the sentence's actual grammatical subject, "all three [SKILL.mds]"),
  not literally the whole plugin directory including the relocated mine's own already-sanctioned
  `project-profile.md` worked example. Both readings executed and disclosed (see Step 4's AC-4
  section); narrow reading PASSES clean, broad reading's one hit is the SAME sanctioned exception
  the original `adhoc-MineSemanticModel` build already carries. Flagged for architect confirmation.
- **The plan's Step 4 acceptance text's `` `nexus:mine-semantic-model` `` wording** treated as a
  transcription artifact, implemented per the tech-spec + the task brief's explicit "plain name"
  instruction instead (see Step 4's AC-3 section for the full reasoning).
- **The `code-review`/`architect.md` pre-existing failure was NOT added to the Step 1 skip-list**
  — it predates the widening (fails identically under the narrow, pre-Step-1 test), so the
  skip-list's stated purpose (violations *the widening* surfaces) doesn't fit; documented as a
  standing baseline exclusion instead, carried through every subsequent "suite green" claim in
  this file rather than silently absorbed.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: (none)`, `TDD: yes` — script/lint changes with observable behavior ARE the tests (the widened suite runs itself); no separate red-green cycle was authored beyond re-running the existing `gen-commands.test.mjs`/lint suites before and after, which already assert the exact behavior this step changes (byte-identity, no-agents no-op, per-plugin discovery) |
| 2 | None | plan: `Skill: (none)` — mechanical scaffold (plugin.json + CHANGELOG.md), `TDD: no` |
| 2b | None | plan: `Skill: (none)` — mechanical move + targeted pointer/marker edits, verified via the travelled + P1 grep batteries above, `TDD: no` |
| 3 | None | plan: `Skill: (none)` — agent-doc authoring (flagged as a skill-authoring gap in `lessons.md`, 3rd occurrence per the plan's own note); `gen-commands.mjs` invocation is a script run, not a Skill-tool invocation, `TDD: no` |
| 4 | `evaluate-skill` (×3 — one per skill; audit-log confirmed, timestamps in Step 4 section) | plan: `Skill: evaluate-skill — Follow (post-authoring gate, per SKILL.md ×3)`, `TDD: no`. All three findings docs written, all Medium/Low findings applied in this same pass (fix-then-accept ×3) |
| 5 | None | plan: `Skill: (none)` — mechanical registration edits (4 named artifacts), `TDD: no` |
| 6 | `release-plugin` (Follow, with the plan's explicit NEW-plugin no-apply carve-out) | plan: `Skill: release-plugin — Follow (with the NEW-plugin carve-out below — no apply)`, `TDD: no`. Invoked; followed its procedure through step 1 (classify via `--check`) and step 5 equivalent (`gen-omni.mjs` + `--check`, done in Step 5); explicitly did NOT run its step 3 (bump apply) for `nexus-analytics`, per the plan's hard instruction — this is the plan-sanctioned deviation from the skill's own default procedure, not a missed invocation |

## Deviations from Plan

1. **Step 1 skip-list is non-empty (1 entry)** — `nexus-flutter/skills/figma-to-flutter/SKILL.md`,
   documented in Step 1 and in the test file itself. Sanctioned by the plan's explicit protocol.
2. **A second pre-existing failure (skill-refs, `architect.md`/`code-review`) was found but is
   NOT in the skip-list** — it predates Step 1's widening (not newly surfaced), is caused by a
   concurrent sibling commit, and touches a do-not-touch file. Documented as a standing baseline
   exclusion instead (see Concurrent-Tree Notes and Step 1 §4). This is a considered deviation
   from a literal reading of "record it ... in a skip-list" — the skip-list mechanism's own stated
   purpose (violations *this widening* surfaces) doesn't fit a violation that was already failing
   under the *unwidened* test, so mechanically adding it there would misattribute it to this
   slug's tooling change. Flagged for architect review in Carry-Over Findings below.
3. **`tests/unit/gen-omni.test.mjs` was edited (Step 5), not named in the plan.** A legitimate
   consequence of the plan-mandated `gen-omni.mjs` edit — the synthetic sandbox fixture that test
   seeds hard-codes which plugin dirs `collect()` will scan, the same shape of issue C1 fixed for
   `gen-commands.mjs` itself. Fixed by seeding a `nexus-analytics` fixture skill and updating the
   expected `omni-analytics` entry, mirroring the exact pattern already used for
   nexus-flutter/cpp/php. This is this slug's own test file for a script this slug edited, not
   another plugin's shipped file — not a skip-list candidate, just an un-named-but-necessary edit.
4. **AC-7's literal tech-spec wording** (`git diff --name-only -- plugins/nexus/` is EMPTY) is
   not literally true — it isn't empty, because 3 pre-existing files stay dirty throughout (not
   caused by this slug). Executed the plan's OWN revised Step-6 form instead (snapshot comparison
   against the entry-precondition baseline) — the plan explicitly supersedes the tech-spec's
   literal wording for exactly this shared-tree scenario, and that revised form PASSES. Not a
   silent narrowing — both the literal tech-spec claim and the executed revised form are stated
   plainly in Step 6.
5. **`node scripts/bump-plugin.mjs --dry-run` was run once, read-only, as a diagnostic** — the
   plan's hard instruction is "do NOT run bump-plugin.mjs in apply (or accept a --dry-run
   proposal)"; interpreted as: apply is forbidden outright, and a dry-run's proposal must never be
   accepted/applied. Dry-run itself changes nothing on disk by design, and running it once
   positively confirmed the H2 hazard (0.1.0 → 0.1.1 proposed) the plan guards against, which is
   stronger evidence than asserting the hazard exists without checking. Its output was NOT
   accepted — no apply, no `--minor`/`--major`, ever run for `nexus-analytics`.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `architect.md` references `` `code-review` skill `` — no shipped skill by that name | Low (pre-existing, not this slug's regression) | architect | `git show HEAD:plugins/nexus/agents/architect.md \| grep code-review` present; absent in the prior commit; `skill-refs.test.mjs` fails on it under both the narrow and widened test | Not fixed here (do-not-touch file, caused by sibling commit `7ef5d44`). Likely needs either a shipped `code-review`-named nexus skill, an allowlist for known built-in Claude Code skill names in `skill-refs.test.mjs`, or a wording fix in `architect.md` — architect's call, out of this slug |
| AC-4's "across the plugin" consumer-token grep has 1 hit in the broad reading | Low | architect | `grep -rlniE "omnishelf\|fmcg_platform\|knowledge-gateway" plugins/nexus-analytics/` → `skills/mine-semantic-model/references/project-profile.md` only — the SAME file/exception the original `adhoc-MineSemanticModel` build's own AC-6 already sanctioned, byte-identical post-relocation (checksum-verified) | Needs architect confirmation that the narrow reading (the 3 Step-4 skills, which the AC-4 sentence is grammatically about) is the intended scope, or an explicit tech-spec amendment carving out the relocated mine's worked example the same way `project-profile.md` was already carved out of the mine's own AC-6 |
| Plan Step 4's acceptance text says `` `nexus:mine-semantic-model` present `` while the same step's design bullet and the tech-spec's AC-3 both say "plain name" | Low | architect | Plan text itself, `docs/specs/adhoc-AnalystExtension/delivery/plan.md` Step 4 | Likely a copy-paste artifact from `wiring.test.mjs`'s literal `nexus:X` regex; implemented per tech-spec + brief (plain name); a plan-text cleanup, not a re-implementation |
| README.md's Plugins table intro text ("ships as two plugins") and table rows are stale beyond this slug's edit — `nexus-cpp`/`nexus-flutter`/`nexus-php` never got rows | Low | architect/PO | `README.md` lines 35-43 — no `nexus-cpp`/`nexus-flutter`/`nexus-php` mentions anywhere in the file (grep 0 hits, checked before this slug's edit) | Pre-existing, not caused by this slug; this slug added exactly the one instructed `nexus-analytics` row and did not expand scope to backfill the other 3 missing rows or fix the "two plugins" text |
| `.github/workflows/plugin-release-check.yml`'s own "Generated commands in sync" step and `plugin-validate` job hardcode `nexus` (+ `nexus-dotnet` for validate) only — neither extends to the now-6-plugin marketplace, including the new agent-bearing `nexus-analytics` | Medium | architect | Read the workflow file directly (`.github/workflows/plugin-release-check.yml`); not named in the plan's Step 1 target list or the tech-spec's Repo-machinery enumeration | The same C1/H1 tooling-generalization class Step 1 fixed locally, but the CI YAML itself wasn't in scope for this slug; a natural Step-1-adjacent follow-up (script/lint discovery is now marketplace-driven, but the CI workflow that invokes those scripts for the drift/validate checks still hardcodes the old 2-plugin set) |

## KB Changes

None — this slug ships no `docs/kb/` entries (dev-repo skill estate; tech-spec confirms "None"
under KB Impact).

*Status: COMPLETE — developer, 2026-07-10.*
