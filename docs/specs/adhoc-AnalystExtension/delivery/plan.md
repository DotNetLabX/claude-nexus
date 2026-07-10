# nexus-analytics — the Data-Analyst Domain Extension (v1 thin slice)

**Feature Spec:** `docs/specs/adhoc-AnalystExtension/definition/tech-spec.md` (technical branch;
tech-spec + ratified proposal `docs/proposals/nexus-data-extension-2026-07.md` are the binding
definition). Revised after critic NO-GO (see `delivery/review-critic.md` — C1 crash executed-proof,
H1 lint-coverage hole, H2 bump collision, M1–M4; all folded below).

## Context

Create `plugins/nexus-analytics/` — the estate's first DOMAIN extension (sixth plugin) and first
non-core plugin shipping an agent: one `data-analyst` persona + three method skills extracted from
two proven consumers (the `D:\omnishelf\analytics` workspace and KG), all model access mediated by
the P4 project profile. The slug ALSO carries the dev-tooling generalization this first-of-kind
consumer exposed: gen-commands and three lint suites hard-code the nexus(-dotnet) world and must
become marketplace-driven.

## Entry precondition (hard — critic M2, REVISED by the owner relocation decision)

`plugins/nexus/skills/mine-semantic-model/` EXISTS on disk as the UNTRACKED, done-check-verified
adhoc-MineSemanticModel build output (verify: `git status --short plugins/nexus/skills/mine-semantic-model`
shows `??`). If absent or already committed to core: STOP and report — the relocation step (2b)
depends on moving the untracked folder. Also snapshot `git status --short -- plugins/nexus/` at
build start: AC-7 is now judged as "no NEW core changes beyond this snapshot, and the snapshot
SHRINKS by exactly the relocated untracked folder."

## Scope

In scope: dev-tooling generalization (scripts/tests — NOT `plugins/**`), the new plugin package,
marketplace/gen-omni/README registration, the 0.1.0 initial release (no bump apply). Out of scope:
everything in the tech-spec's Out-of-scope list — most importantly ANY edit in `plugins/nexus/**`
(AC-7), the persona-restore machinery (known v1 gap, core-owned, forward-pointed), the analytics
repo's profile authoring, and the v2 lanes.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | **yes** | tooling targets + regression contract below | |
| 2 | (none) | — | no | scaffold files below | |
| 3 | (none) | — | no | agent doc content sources below | skill-authoring gap (3rd occurrence) — log to lessons.md |
| 4 | evaluate-skill | Follow (post-authoring gate, per SKILL.md ×3) | no | the three skills' content sources below | |
| 5 | (none) | — | no | 4 registration edits | |
| 6 | release-plugin | Follow (with the NEW-plugin carve-out below — no apply) | no | initial-release quirks below | |

**Disposition rules:** see plan-template. Step 1 is the one TDD `yes`: script/lint changes with
observable behavior (the tests ARE the tests).

## Domain Model Changes / Data Model Changes / Cross-Service Changes

None in this repo beyond dev tooling. The plugin defines no new consuming-repo artifacts — it
READS P4's `docs/semantic-model/profile.md`.

## Cross-repo read (binding note for Steps 3–4)

Steps 3–4 read from `D:\omnishelf\analytics\.claude\rules\` (`interview.md`, `query-patterns.md`,
`no-gold-tables.md`, `export-workflow.md`) and `.claude\skills\data-analyst\`. If cross-repo reads
are permission-denied: STOP the step and report `OPERATOR ACTION REQUIRED — copy the named files
into docs/specs/adhoc-AnalystExtension/definition/inputs/ and re-dispatch` (pre-authored fallback
→ `Deviated (valid reason)`). Read-only: this slug NEVER writes outside this repo (+ the gen-omni
twin regen in `../omni`).

## Implementation Steps

### Step 1 — Generalize the dev tooling (prerequisite; critic C1/H1)

All targets are dev-repo scripts/tests — no `plugins/**` shipped file changes.

1. `scripts/gen-commands.mjs` — replace the hard-coded 8-role `MAP`-driven agent set
   (gen-commands.mjs:26-35; executed-proof: `nexus-analytics` run dies ENOENT on `architect.md`)
   with: agent set = `readdirSync(AGENTS_DIR)` (`.md` files); per-agent `proper`/`desc` = the MAP
   entry when present (**MAP stays as an override table — byte-identity for the existing nexus
   commands is the binding regression contract**), else derived from the agent doc (first
   heading / frontmatter description).
2. `tests/lint/frontmatter.test.mjs` (skills pair-list :35, agents/commands nexus-only :18/:52),
   `tests/lint/wiring.test.mjs` test 4 (nexus surfaces only :86-90), `tests/lint/skill-refs.test.mjs`
   — discovery iterates `marketplace.plugins` (precedent: release.test.mjs:19). Guard each for
   plugins WITHOUT the relevant dir (no agents/, no hooks) — absence is legal, not a failure.
3. `scripts/selfcheck.mjs` gen-commands drift check — extend from nexus-only to every
   agent-bearing plugin (discovered, not listed).
4. **Pre-existing-violation protocol:** run the widened suites over the 5 existing plugins FIRST.
   Any violation surfaced in another plugin: record it in implementation.md AND add it to an
   explicit named skip-list in the test (with the plugin+file listed) — its fix rides that
   plugin's own next release. The skip-list may be empty; it may not be silent.

Acceptance: AC-8 half-executed now (`gen-commands.mjs nexus` byte-identical to HEAD — drift check
green; the `nexus-analytics` half runs after Step 2); AC-9 STRUCTURAL half executed
(`marketplace.plugins` grep ≥1 in each of the three test files; full suite green over CURRENT
5-plugin discovery; skip-list recorded or explicitly empty). **Timing (critic N1): the 6-plugin
greenness half of AC-9 lands at Step 5 via AC-6** — marketplace-driven discovery only sees the
sixth plugin once Step 5 registers it; the same applies to the new plugin's frontmatter linting
(critic N2 — AC-6 is the terminal gate).
Satisfies: AC-8 (nexus half), AC-9 (structural half; coverage half via AC-6 at Step 5)

### Step 2 — Scaffold the plugin

Create `plugins/nexus-analytics/`:
- `.claude-plugin/plugin.json` — `name: "nexus-analytics"`, `version: "0.1.0"`, description
  (data-analyst domain extension: analyst persona + semantic-model-first query method; requires
  nexus core), `author: { name: "ldumit" }`, keywords. Mirror `nexus-dotnet`'s plugin.json field
  set (read it — the extension precedent).
- `CHANGELOG.md` — `[0.1.0]` entry: "initial thin slice: data-analyst agent; mine-semantic-model
  (the fifth mine, relocated from core per owner decision); semantic-model-query,
  data-investigation, answer-qa skills". This entry IS the release record (Step 6 runs no bump
  apply).

**Step 2b — Relocate the fifth mine (owner decision 2026-07-10):** MOVE the untracked folder
`plugins/nexus/skills/mine-semantic-model/` → `plugins/nexus-analytics/skills/mine-semantic-model/`
(filesystem move — `Move-Item`/`mv`, preserving bytes; the folder was never committed). Then ONE
content edit class: re-word its four family pointer lines from the relative
`../mine-verify-cover/references/mine-family-core.md §X` form to the cross-plugin prose form —
"read nexus core's `mine-verify-cover` skill → its `mine-family-core.md` reference, §X (this
plugin requires nexus core)" — the `mine-verify-cover-dotnet` precedent (plain prose, no file
paths). Also amend, in CORE, `mine-family-core.md`'s family-table row and per-skill staging line
with a `(ships in nexus-analytics)` marker — these two small edits join the 3 already-dirty
registration edits riding a later core PATCH. Re-run the mine's own travelled AC battery at the
new path: KG-token scoping (profile + probes carve-outs), stack-anchor sweep (F38-in-SKILL.md
exception), BOM bytes, probe write-keyword grep — outputs into implementation.md.

Acceptance: AC-1 executed (file exists, name/version exact, CHANGELOG top entry `[0.1.0]`);
relocated folder present with ZERO byte drift outside the pointer-line edits (`git status` shows
the core copy gone); the travelled AC battery green at the new path; no remaining relative
`\.\./mine-verify-cover` reference inside the relocated skill; **the MineFamilyCore AC-3
single-copy battery re-run cross-plugin** — `capture the start|is the session that owns
spawning|carried unchanged from ADR-43|appends a changelog entry` each hit EXACTLY ONE shipped
file (`mine-family-core.md`) across `plugins/*/skills/**` (the P1 anti-drift contract must
survive the relocation; architect pre-verified 2026-07-10 that the built SKILL.md restates none).
Satisfies: AC-1 (+ the relocated mine's travelled battery + the P1 drift contract)

### Step 3 — Author the data-analyst agent + generate its command

Create `plugins/nexus-analytics/agents/data-analyst.md` (~50–70 lines, learner.md's register —
lean persona, not a manual). Content (sources: the analytics repo's `interview.md` +
`data-analyst` skill + the tech-spec's package table):
- Role: data analyst for consuming repos — answers business questions over the project's
  datasource THROUGH the semantic model, never by improvised SQL.
- **Batched-interview intake:** collect ALL missing run inputs in ONE message (tenant/chain, date
  range, output target…); persisted defaults are never re-asked. Stated generically — no
  Sheets/chain specifics.
- **Model-first navigation:** resolve through the profile's model (the resolution ladder) before
  any query; unknown column meaning → the data-investigation skill, never a guess.
- **Answer contract:** delegates to the answer-qa skill; every shipped answer names grain,
  applied filters, date range, constructs.
- Skill pointers to the three sibling skills by plain name (they live in THIS plugin). Author
  note: never write a literal `${CLAUDE_PLUGIN_ROOT}` in any md (release.test hygiene check now
  covers this plugin).
Then generate: `node scripts/gen-commands.mjs nexus-analytics` (works after Step 1; exits 0,
produces `commands/data-analyst.md`).

Acceptance: AC-2 executed (`one message` and `never re-asked` grep-hits in the agent doc; command
generated, same commit); AC-8 fully executed (the nexus-analytics half: exit 0 + file produced).
Satisfies: AC-2, AC-8 (nexus-analytics half)

### Step 4 — Author the three skills, then follow evaluate-skill on each

Create under `plugins/nexus-analytics/skills/`, each with frontmatter (`name`, `description`,
`user-invocable: true`; model-invocable — NO `disable-model-invocation`):

- `semantic-model-query/SKILL.md` — the **resolution ladder** (write that literal phrase — it is
  AC-3's structural signature) with the three arrow forms verbatim: `grain → table` (via the
  profile's construct map), `metric → column` (existence verified), `dimension → join` (via the
  model's relationships/join-guards); synonym matching case-insensitive; then the
  mandatory-obligation pre-query check (profile-declared mandatory filters — the
  bad-reports-excluded class; refuse forbidden aggregate shortcuts — the no-gold-tables class;
  honor the profile's large-table bound patterns). Names `docs/semantic-model/profile.md` and
  states BOTH flavors (JSON bundle | CSV trio) resolve through it. Sources: analytics
  `query-patterns.md`/`no-gold-tables.md` + KG validator obligations — extract the SHARED rule,
  cite neither repo by path.
- `data-investigation/SKILL.md` — unknown column/flag meaning → invoke the sibling
  **`mine-semantic-model`** skill (plain name — SAME plugin after Step 2b's relocation; never a
  cross-plugin file path) in its read-only investigation posture (profile's runner, BR1/BR12
  rails); model-changing findings route to the mine's proper modes. **Write the literal
  `docs/semantic-model/profile.md`** as the model locus (AC-4 greps the exact path in all three
  files — critic N3).
- `answer-qa/SKILL.md` — the answer contract as a checkable format: **grain** named; every
  mandatory **filter** named as applied; **date range** stated; constructs listed; a data-caveats
  line when the profile's model carries staleness info. An answer missing an obligation is
  **malformed** — fix before shipping (the words `grain`, `date range`, `malformed` are AC-3's
  contract signature). **Write the literal `docs/semantic-model/profile.md`** as the source of
  the mandatory-obligation list (AC-4 greps the exact path — critic N3).

Then **Follow evaluate-skill** on each of the three; fold findings before Step 5.

Acceptance: AC-3 executed (three folders; frontmatter valid under the Step-1-generalized lint;
`resolution ladder` + the three arrow forms in semantic-model-query; `nexus:mine-semantic-model`
present AND `\.\./\.\./nexus/` = 0 hits; answer-qa contract signature); AC-4 executed
(`docs/semantic-model/profile.md` in EACH of the three SKILL.mds; flavor sentence in
semantic-model-query; `omnishelf|fmcg_platform|knowledge-gateway` = 0 hits across the plugin);
evaluate-skill ×3 in `.claude/audit/skill-invocations.log`.
Satisfies: AC-3, AC-4

### Step 5 — Register the sixth plugin

Four edits (tech-spec §Repo machinery 1–4):
1. `.claude-plugin/marketplace.json` — append
   `{ "name": "nexus-analytics", "source": "./plugins/nexus-analytics" }`.
2. `scripts/gen-omni.mjs` — `mirrorPlugin('nexus-analytics', 'omni-analytics');` after the
   `nexus-php` call (~:102) AND `{ name: 'omni-analytics', source: './plugins/omni-analytics' }`
   in `wantPlugins` (~:114-120). (Critic-verified: the token swap already yields
   `omni-analytics` / `omni:mine-semantic-model` in twin content — no swap edits needed.)
3. Root `README.md` — one plugin-list line.
4. Run `node scripts/gen-omni.mjs`, then `--check` (pass), then the full suites +
   `node scripts/selfcheck.mjs` — the widened lint estate now actually covers plugin #6.

Acceptance: AC-5 executed (marketplace lists 6; both gen-omni edits; gen-omni + --check clean;
README line); AC-6 executed (lint+unit green under 6-plugin discovery; selfcheck 5/5, its drift
check now covering both agent-bearing plugins).
Satisfies: AC-5, AC-6

### Step 6 — Initial release (NO bump apply — critic H2)

Follow release-plugin EXCEPT its apply step, which is superseded for a brand-new plugin:
- **Hard instruction: do NOT run `bump-plugin.mjs` in apply (or accept a --dry-run proposal) for
  nexus-analytics.** Apply verifiably classifies the new files PATCH and bumps 0.1.0→0.1.1,
  breaking AC-1. The Step-2 scaffold (0.1.0 + `[0.1.0]` CHANGELOG) IS the initial release.
- Run `node scripts/bump-plugin.mjs --check` (critic-verified to accept the unbumped new plugin)
  and the AC-7 guard, REVISED for the shared dirty tree (owner-relocation era): compare
  `git status --short -- plugins/nexus/` against the entry-precondition snapshot — this slug's
  only permitted core delta is (a) the relocated untracked folder DISAPPEARING and (b) the two
  `(ships in nexus-analytics)` marker edits in mine-family-core.md (Step 2b). Anything else new →
  STOP and report.
- Sequencing against core siblings: NONE — this slug never bumps the core plugin.json, so a
  concurrent core release in flight (e.g. adhoc-ArchitectFastLane) does not gate this build. Do
  not stage or commit any core file; the family-registration edits ride a later core PATCH
  (operator-owned).
- **Closure pointer (operator-owed, not a developer step):** the `../omni` twin commit uses the
  mirrored message per CLAUDE.md — `feat(adhoc-AnalystExtension): sync nexus-analytics extension
  (omni-analytics 0.1.0)` with the provenance footer — never a generic regenerate.

Acceptance: AC-7 executed; `bump-plugin --check` pass recorded; CI `plugin-release-check` green
on the PR.
Satisfies: AC-7

## Migration Notes

Consuming repos: `/plugin install nexus-analytics` → the persona command
`/nexus-analytics:data-analyst` appears; skills fire from analyst conversation. **Known v1 gap
(critic M1, recorded in the tech-spec):** the persona does not survive a compact —
`restore-agent.js` is nexus-scoped; re-invoke the persona command after compaction. Forward
pointer: a nexus-core slug makes register/restore plugin-agnostic. First-consumer onboarding (the
analytics repo's profile file) is operator-owed in that repo, after this ships.

## Testing Strategy

Step 1 is behavior-tested by the estate itself (the generalized suites + byte-identity drift
check). The rest: the AC-1..AC-9 battery (each executed, outputs in implementation.md). Honest
coverage note (critic H1): before Step 1, only release.test.mjs sees plugin #6 — the plan's lint
claims are all post-generalization claims. Live validation = the first Account-Manager flow in
the analytics workspace — operator-owed, out of this slug.

## KB Impact

None.

## Decisions

Inherited from the tech-spec table (name; agent-in-extension; no file duplication; profile
mediation; 0.1.0 + own CHANGELOG; twin registration; onboarding out-of-slug; + the six
critic-fold rows: tooling-in-slug, MAP-as-override, skip-list protocol, no-apply release,
persona-restore gap accepted, sequencing precondition). Plan-level:
`None — no additional self-resolved calls met the disclosure bar`.

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2): **NO-GO → revised** — findings persisted to
`delivery/review-critic.md`, all folded: C1 (gen-commands crash, executed-proof) → Step 1 tooling
generalization with the MAP-as-override byte-identity contract + AC-8; H1 (frontmatter/wiring/
skill-refs hard-code the nexus pair; "marketplace-driven auto-coverage" was true only of
release.test) → Step 1 discovery generalization + AC-9 + the pre-existing-violation skip-list
protocol + honest Testing Strategy note; H2 (bump apply would ship 0.1.1) → Step 6 hard
no-apply instruction (--check verified to accept the scaffold); M1 (persona doesn't restore
post-compact) → known-gap record + forward pointer, not a fix here; M2 (sequencing un-gated) →
hard entry precondition + the H1 wiring generalization makes the cross-plugin reference
lint-real; M3 (vacuous ladder grep) → structural signatures (literal `resolution ladder` + three
arrow forms); M4 (answer-qa unverified; profile check on 1 of 3) → contract-signature greps +
AC-4 over all three. Critic verified TRUE (recorded): gen-omni swap clean for all new tokens (no
double-swap), `bump-plugin --check` accepts the unbumped scaffold, release.test auto-covers the
sixth plugin, edit anchors exact, virgin greps re-confirmed, proposal→spec fidelity intact.
**Re-review: GO** (same critic, fix-verification pass — addendum in `delivery/review-critic.md`).
Every fold verified closed, executed where executable (byte-identity premise: all 8 nexus agents
in MAP; precondition target correctly absent today; the three lint files genuinely lack
`marketplace.plugins`). Three LOW residuals (N1 AC-9 timing split, N2 frontmatter-lint timing,
N3 literal profile path in two bullets) folded post-GO. Plan approved for development —
dispatch gated on the entry precondition (MineSemanticModel shipped).
