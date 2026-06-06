# Plugin Authoring & Versioning — Proposal

Status: **Accepted, with one override.** Owner: ldumit. Date: 2026-06-06.

> **Decision update (post-review).** The skill, `bump-plugin.mjs`, the MAJOR-leaning policy, the
> 1.0.0 graduation, and the CI `--check` backstop were all adopted. **The §3/§6 recommendation to
> wire `release-plugin` into the shipped agents/skills (solo preload, team-lead commit protocol,
> improve-flow/improve-skills tails) was rejected.** It assumed the plugin is developed *through*
> nexus's own pipeline; in practice the plugin is edited directly in this repo, so that wiring would
> (a) be dead in consuming projects where the skill no-ops and (b) bloat every consumer's agent
> spawns. The trigger instead lives in the **dev-repo `CLAUDE.md`** (reaches the base session that
> actually edits the plugin) with **CI** as the guarantee. Nothing about releasing ships into
> consumer-facing agent behavior.

This proposal closes the gap noted in `docs/architecture/README.md` § "Known limitations / future work":
ADR-9 (Build & release) is **prose with no owner or automation**. The result was the trigger below.

---

## 1. Problem

A behavioral edit to `team-lead.md` and `architect.md` was committed (`9a6cfad`) **without** bumping
`plugins/nexus/.claude-plugin/plugin.json`. Because the Claude Code plugin cache is **version-keyed**
(platform constraint #3), `/plugin update` was a no-op and **no installed user ever saw the change**.
A follow-up commit (`06ddfe8`) bumped to `0.1.3` after the fact — but the content and the bump landed
in **two different commits**, which is exactly the failure mode: a content commit can ship with no bump.

What the user wants:

- A **tool that owns** plugin authoring + the version-bump **decision** — it evaluates the change and
  picks the semver tier itself, rather than asking the user "what bump?".
- The bump lands in the **same commit** as the content it describes.
- The release flow (gen scripts, validate, tag) runs as one owned procedure.
- **Not** primarily a git hook. A hook is, at most, an *optional* safety net the user would rather avoid.
- A semver policy that reflects reality: this plugin **defines agent behavior** and the cache is
  version-keyed, so **almost every change is behavior-affecting and must reach users** → **MAJOR-leaning**.

### Why this is a real evaluation, not a rubber stamp

If every change is "MAJOR," a tool is pointless — `printf` would do. The value is that the tool
**classifies the change type** (behavioral edit vs docs-only vs metadata) and the classification is
*falsifiable*: a docs-only or comment-only diff genuinely should **not** force users to re-pull. The
policy below makes MAJOR the default for the large behavior-bearing surface, and defines the narrow,
checkable set that is MINOR / PATCH / none.

---

## 2. CLI / Docs findings (cited)

Verified against `code.claude.com/docs` — `plugins-reference`, `discover-plugins`, `plugin-dependencies`
(fetched 2026-06-06). **ADR-9's CLI claims hold up.** Corrections and additions:

| ADR-9 / constraint claim | Docs verdict | Citation |
| --- | --- | --- |
| `claude plugin validate <plugin>` exists | **Confirmed.** Has `--strict` (warnings→errors, "Use it in CI"). Also `/plugin validate`. Validates `plugin.json`, skill/agent/command frontmatter, `hooks/hooks.json`. | plugins-reference § "Unrecognized fields", § "Debugging" |
| `claude plugin tag --push` exists | **Confirmed.** Creates a git release tag. Options: `--push`, `--dry-run`, `-f/--force`. **Run from inside the plugin folder.** | plugins-reference § "plugin tag"; plugin-dependencies § "Tag plugin releases" |
| Cache is version-keyed; `/plugin update` is a no-op unless `version` changed | **Confirmed, verbatim.** "If you set `version` in `plugin.json`, you must bump it every time you want users to receive changes. Pushing new commits alone is not enough." | plugins-reference § "Version management" |
| Version-keyed cache path | **Confirmed.** Marketplace plugins are copied to `~/.claude/plugins/cache`; "Each installed version is a separate directory." | plugins-reference § "Plugin caching and file resolution" |
| Built-in version-bump helper exists | **CORRECTION: no such thing.** There is **no `claude plugin bump`** or any increment command. Bumping = hand-editing `plugin.json`'s `version`. The tool we build *is* the missing piece. | plugins-reference § "CLI commands reference" (full command list: init, install, uninstall, prune, enable, disable, update, list, details, tag) |

### Findings ADR-9 does **not** currently capture (load-bearing — fold into the new owner)

1. **The version field is OPTIONAL, and "omit it" is a documented alternative.** Resolution order:
   `plugin.json version` → marketplace-entry `version` → **git commit SHA** → `unknown`. Omitting
   `version` makes *every commit* a new version (auto-update on each push). The docs explicitly frame
   this as the choice between **"Published plugins with stable release cycles"** (explicit version)
   vs **"Internal or team plugins under active development"** (commit-SHA).
   *Implication for §7 Open Questions:* Nexus has chosen explicit versions, which is the right call for
   a published marketplace — but it is the very choice that **creates** the bump obligation. The private
   `omni` twin could legitimately go commit-SHA and sidestep the whole problem (it is internal). Flagged.

2. **`claude plugin tag` does MORE than tag — it is a validator + consistency gate.** Per
   plugin-dependencies § "Tag plugin releases", before tagging it:
   - validates the plugin contents,
   - **checks that `plugin.json` and the marketplace entry agree on the version**,
   - requires a **clean working tree** under the plugin directory,
   - refuses if the tag already exists.
   Tag name convention: **`{plugin-name}--v{version}`** (e.g. `nexus--v1.0.0`, `nexus-dotnet--v0.2.0`).
   This is the canonical "validate" step — stronger than `claude plugin validate` alone — and it means
   **the bump must already be committed (clean tree) before tagging.** This *reorders* ADR-9's flow
   (see §5).

3. **Dependency version resolution is tag-driven and matters for `nexus-dotnet`.** `nexus-dotnet`
   declares `dependencies: ["nexus"]` as a **bare string** today → it tracks **whatever version the
   marketplace provides** (latest). Per plugin-dependencies, a bare dependency "depends on whatever
   version that plugin's marketplace provides." Version *constraints* (`{ "name": "nexus", "version":
   "^1.0" }`) resolve against `nexus--v*` git tags. **Today nexus has zero tags** (`git tag -l` is empty),
   so if `nexus-dotnet` ever adopted a constraint it would hit `no-matching-tag` and be disabled. Two
   consequences: (a) the tool must create the `{name}--v{version}` tags so constraints become *possible*;
   (b) whether `nexus-dotnet` should pin `nexus` is an Open Question (§7).

4. **`CHANGELOG.md` is the documented place for human-readable change history**, and the docs say to
   follow semver and "Document changes in a `CHANGELOG.md`." Nexus has **per-skill** CHANGELOGs but **no
   per-plugin** `CHANGELOG.md`. The tool should own a plugin-level changelog (see §5).

5. **`marketplace.json` can also carry a per-plugin `version`**, and "If also set in the marketplace
   entry, `plugin.json` wins." Nexus keeps versions only in `plugin.json` (marketplace entries are
   path-only) — correct and simplest. **Keep it that way**; `claude plugin tag`'s "agree on version"
   check is trivially satisfied when the marketplace entry omits `version`. (Confirm in §7.)

**Net:** ADR-9 is directionally correct but (a) overstates nothing that's false, (b) is missing the
tag-as-validator reordering, the optional-version escape hatch, the dependency-tag mechanics, and the
per-plugin changelog. The new owner should supersede ADR-9's prose with an executable procedure and
ADR-9 should be updated to point at it.

---

## 3. Recommendation — **a skill, owned by Solo (and the team's developer), not a new agent**

**Pick: build `release-plugin` as a core skill in `plugins/nexus/skills/release-plugin/`. Do NOT add a
"Plugin-Writer" agent.** Opinionated reasoning below.

### Why a skill, per ADR-2 / ADR-4

ADR-2's decision table is explicit: **"Reusable recipes / schemas → Skills"**; **"personas/roles →
agents."** Releasing a plugin is a **procedure** — a fixed, ordered recipe (classify → bump → gen →
validate → tag) with decision rules. It is the textbook case for a skill. The repo already encodes its
*authoring* procedures as skills (`improve-skills`, `create-architecture-doc`,
`create-implementation-plan`); a release procedure is the same shape and belongs in the same place.

### Why NOT a "Plugin-Writer" agent

A persona/agent is justified when there is a **distinct role with boundaries and a coordination
protocol** (the ADR-7 reason agents carry inlined protocol). "Plugin-Writer" has none of that:

- It would duplicate Solo's entire job — "small scoped fixes (1-3 files), discuss-then-implement" is
  *exactly* what editing an agent file + bumping a version is. A plugin edit is usually 1-3 files.
- A new agent adds always-on context cost (its description ships in every session's agent list) and a
  new persona command via `gen-commands.mjs` — for zero new capability over Solo + a skill.
- Agents can't be *preloaded into other agents*; skills can (`skills:` frontmatter, ADR-4). The release
  procedure needs to ride along with whoever edits plugin files — that's a preload, i.e. a skill.
- The classification logic (change-type → tier) is **deterministic enough to live in a script**, not a
  persona. An agent persona is the wrong container for "diff these paths, map to a tier."

### The shape: skill + a thin script it drives

`release-plugin` is a skill whose body is the §5 procedure, and which **shells out to one new script**,
`scripts/bump-plugin.mjs`, for the mechanical, falsifiable parts (detect changed plugins from
`git diff`, classify, write `plugin.json` + `CHANGELOG.md`). The skill owns judgment + orchestration;
the script owns the deterministic file edits and is independently testable/CI-runnable. This mirrors the
repo's existing split (skills that drive `gen-commands.mjs` / `gen-omni.mjs`).

### Who consumes it

- **Solo** — preload `release-plugin` via `solo.md` `skills:` frontmatter **only when the repo is the
  plugin repo**. Since the core must stay stack-agnostic (ADR-5), preload is acceptable but the skill
  must **no-op gracefully** when there's no `.claude-plugin/marketplace.json` (i.e., a consuming project,
  not the plugin repo). Solo is the default driver: most plugin edits are 1-3 files.
- **Developer + Team-Lead** — when a *pipeline* run touches plugin files (a larger refactor of agents
  or rules), the **team-lead's commit protocol** invokes `release-plugin` as the last step before the
  commit, so the bump is in the same commit. Name the skill in `team-lead.md`'s commit-protocol section
  (invoked by name, not preloaded — team-lead already carries `summary-format`; don't bloat it).
- **`improve-flow` / `improve-skills`** — these *already* edit agent/rule/skill files (the learner's
  promotion path). They should **end by invoking `release-plugin`** so a promoted lesson that rewrites
  an agent file can't ship without a bump. This directly prevents the trigger class.

### Tradeoffs

- A skill can be *skipped* by a model in a way a hook cannot (ADR-7's whole point). Mitigations: (1)
  preload onto Solo so it's in-context, (2) name it in the team-lead commit protocol and the
  improve-flow/improve-skills tails, (3) keep the **optional** safety-net hook of §6 available for the
  belt-and-suspenders user. We accept residual skip-risk because the user explicitly prefers no hook and
  ranks the friction of a mandatory hook above the residual risk.

---

## 4. Semver bump-classification policy

**Governing principle (user's lean, justified by the platform):** the plugin's payload is *agent
behavior* and the cache is *version-keyed*. Therefore the question the tool answers is **"must installed
users re-pull to get correct behavior?"** If yes → it's at least MINOR, and because almost everything
here changes behavior, the default is **MAJOR**. The only way to *not* bump is to prove the change
cannot alter any installed user's runtime behavior (docs/comments/internal-source-of-truth only).

### Decision table

Classification is **per changed plugin** (see §5 multi-plugin handling). "Behavior surface" = anything
that reaches a session: `agents/`, `rules/`, `hooks/`, `skills/`, `commands/` (generated, but shipped),
`.mcp.json`, `.lsp.json`, `settings.json`, and `plugin.json` fields other than `version`.

| Change type | Tier | Rationale |
| --- | --- | --- |
| Agent instruction / behavior change (`agents/*.md` body) | **MAJOR** | Redefines how an agent acts; every user must re-pull. The trigger case. |
| Rule change (`rules/*.md`) | **MAJOR** | Rules are injected every session (ADR-2); a changed guardrail must reach everyone. |
| Hook behavior change (`hooks/scripts/*.js`, `hooks.json`) | **MAJOR** | Changes what is enforced/blocked at runtime (ADR-7/8). Silent divergence is dangerous. |
| Security-guard change (`guard.js`, `pipeline-gate.js`, security_mode config) | **MAJOR** | Strongest case: a weakened or strengthened guard MUST propagate. Never less than MAJOR. |
| Artifact-format skill change (`*-format/SKILL.md`) | **MAJOR** | Machinery parses these shapes (ADR-4); producers and consumers must move together. |
| Command rename / removal (persona command, or a skill invocation name) | **MAJOR** | Breaking: existing `/x` invocations and cross-refs stop resolving. |
| Dependency change (add/remove/retarget `dependencies`, or change a version constraint) | **MAJOR** | Alters the install graph; can enable/disable other plugins. |
| New agent | **MAJOR** | New persona = new behavior surface + new command; treat as a release. (See 0.x note — could argue MINOR "additive"; user-lean says MAJOR.) |
| New skill (non-format) | **MINOR** | Purely additive capability; no existing behavior changes. Existing users keep working identically; they *gain* a recipe. This is the clearest legitimate MINOR. |
| Additive, non-breaking edit to an existing **non-format** skill (new optional section, clarified step, no changed contract) | **MINOR** | Additive recipe refinement, no machinery contract change. Judgment call — if it changes *what the skill makes the agent do*, escalate to MAJOR. |
| Metadata-only `plugin.json` change that affects discovery (description, keywords, displayName, userConfig defaults) | **MINOR** | Changes what users *see*/configure but not runtime behavior of existing installs. |
| Bug fix in a hook/script that restores intended behavior **without changing the intended contract** | **PATCH** | The rare true patch: e.g. `guard.js` was crashing on a malformed input and now fails-open correctly as designed. Behavior moves *toward* spec, contract unchanged. |
| Docs-only (`docs/**`, top-level `README.md`, `*/CHANGELOG.md`, code comments, this proposal) | **none** | Not shipped to sessions; no cache impact. `docs/` and `CHANGELOG.md` live in the repo, not the plugin payload. **No bump.** |
| Build-tooling-only (`scripts/*.mjs`) when output is unchanged | **none** | Generators are source-of-truth tooling, not plugin payload. If the generated `commands/` actually change, the *commands* trigger their own row (MAJOR). |

### What is MINOR / PATCH / none — the short version

- **MINOR:** purely additive and non-breaking — a new non-format skill, an additive skill section, or
  discovery metadata. The test: *can an existing install keep behaving identically and simply ignore the
  addition?* If yes → MINOR.
- **PATCH:** essentially never. Reserved for "fix that moves behavior toward the already-intended
  contract without changing the contract." If you can't state the unchanged contract in one sentence,
  it's MAJOR.
- **none (no bump):** the change provably never reaches a running session — `docs/**`, repo-level
  README, changelogs, comments, and generators whose output didn't change.

### Conflict resolution & escalation

- **Highest tier wins.** A diff touching `agents/` (MAJOR) and a new skill (MINOR) is **MAJOR**.
- **Ambiguity escalates, never de-escalates.** If the script can't prove a change is additive/none, it
  classifies **MAJOR** and says why. (Fail toward "users get the change.")
- **Security never de-escalates.** Any touch under the guard/pipeline-gate set is MAJOR floor.

### The 0.x question — resolve it now

Today: `nexus` = `0.1.3`, `nexus-dotnet` = `0.1.1`, marketplace metadata `0.1.0`. Under semver, `0.x` is
"anything may change"; MAJOR pre-1.0 conventionally bumps the **minor** (0.1→0.2). That **contradicts the
user's "MAJOR almost always"** intent and produces a confusing version line.

**Decision: graduate to 1.0.0 as the first act (see §6 Migration), then "MAJOR" literally means the
first integer.** After graduation: a MAJOR change `1.x.y → 2.0.0`, the next `→ 3.0.0`, etc. MINOR bumps
the middle (`2.0.0 → 2.1.0`), PATCH the last. **Implication, stated plainly:** because MAJOR is the
common case, the major number will climb **fast** — `nexus` could be at `12.0.0` within months. *That is
intended and fine* — the number is a cache key first and a marketing signal a distant second. The user
should accept a fast-moving major or explicitly opt into the 0.x-with-minor-as-major scheme (§7).

---

## 5. Release procedure (what the `release-plugin` skill + `bump-plugin.mjs` encode)

This **supersedes ADR-9's prose** and **reorders it** per finding #2 (tag requires a clean tree, so the
bump+commit must precede the tag). The skill drives these steps; `bump-plugin.mjs` performs 1–4.

```
0. PRECONDITION  Confirm we are in the plugin repo (.claude-plugin/marketplace.json present).
                 If not (a consuming project), the skill no-ops and says so. [stack-agnostic, ADR-5]

1. DETECT        Determine changed plugin(s) from the diff:
                 git diff --name-only HEAD  (staged+unstaged) and/or the working set.
                 Bucket each changed path under plugins/<name>/... -> {nexus, nexus-dotnet}.
                 Paths outside plugins/ (docs/, scripts/, README) are classified for "none/own-row".

2. CLASSIFY      For EACH changed plugin independently, map its changed paths through the §4 table.
                 Take the highest tier. Emit a one-line justification per plugin
                 ("nexus: MAJOR — agents/team-lead.md body changed"). This is the EVALUATION, printed
                 so the human/agent sees the reasoning, not a silent stamp.

3. BUMP          For each plugin needing a bump, edit plugins/<name>/.claude-plugin/plugin.json:
                 increment per tier from the CURRENT version (post-migration: MAJOR x.y.z->(x+1).0.0,
                 MINOR ->x.(y+1).0, PATCH ->x.y.(z+1)). Marketplace entries stay version-less (finding #5).

4. CHANGELOG     Append an entry to plugins/<name>/CHANGELOG.md (create if absent) under [Unreleased]
                 or a new version heading: the tier, the one-line justification, and the commit subject.
                 (Per-plugin changelog is new; per-skill changelogs are unaffected.)

5. REGENERATE    If any agents/*.md changed:  node scripts/gen-commands.mjs nexus   (and/or the twin)
                 [commands are generated from agents; a renamed/removed command is itself MAJOR, step 2]

6. SYNC TWIN     node scripts/gen-omni.mjs    [omni mirrors nexus incl. the bumped plugin.json +
                 CHANGELOG, because gen-omni token-swaps file CONTENTS — the bumped version rides along.
                 So omni's versions stay in lockstep with nexus automatically; NO separate omni bump.]
                 NOTE: if omni adopts commit-SHA versioning (§7), this step still works — version field
                 simply isn't consulted there.

7. VALIDATE      For each changed plugin:  claude plugin validate plugins/<name> --strict
                 (--strict in CI per docs; catches frontmatter/schema/dangling issues.)

8. SAME-COMMIT   Stage the content edits AND the bumped plugin.json AND CHANGELOG together and COMMIT
                 as ONE commit. This is the core invariant that fixes the trigger: bump never lands in a
                 separate commit. The skill refuses to hand back control with a staged content change and
                 an un-bumped plugin.json for the same plugin.

9. TAG (release) When the user/lead is ready to publish:  from inside plugins/<name>/,
                 claude plugin tag --push     [creates {name}--v{version}; requires clean tree -> step 8
                 must be committed first; also re-validates + checks plugin.json/marketplace agree.]
                 Run per changed plugin. This makes dependency-constraint resolution (finding #3) work.
```

### Multi-plugin cases (explicit)

- **Only `nexus-dotnet/` changed** (e.g. a Vue skill edit): classify & bump **`nexus-dotnet` only**.
  `nexus` is untouched → no bump. Tag `nexus-dotnet--v{new}`.
- **Only `nexus/` changed** (the trigger — agent edit): bump **`nexus` only**. `nexus-dotnet` is
  untouched at the file level → no automatic bump. **But** see the dependency note below.
- **Both changed:** classify each independently; each gets its own tier and its own tag.
- **Dependency implication of a `nexus` MAJOR on `nexus-dotnet`:** *Today* `nexus-dotnet` depends on
  `nexus` as a **bare string** → it always tracks latest `nexus`, so a `nexus` bump reaches dotnet users
  with **no dotnet bump required**. This is convenient but unconstrained — a breaking `nexus` change
  could break `nexus-dotnet` silently. **The tool should WARN** when it bumps `nexus` MAJOR while
  `nexus-dotnet` declares a bare `nexus` dependency, surfacing the §7 question: do we want a constraint
  (`{ "name": "nexus", "version": "^N" }`) so dotnet pins to a tested major? If a constraint is adopted,
  then a `nexus` MAJOR that crosses the constraint **forces a `nexus-dotnet` bump too** (to widen the
  constraint), and the tool would classify that automatically (dependency-change row = MAJOR).

### Omni twin version sync (explicit)

`gen-omni.mjs` mirrors file **contents** (it token-swaps and writes every file). Since `plugin.json` and
`CHANGELOG.md` are ordinary files in `plugins/nexus/`, the **already-bumped** version is copied verbatim
into `plugins/omni/.claude-plugin/plugin.json`. So **omni's versions are kept in sync for free** by
running `gen-omni.mjs` *after* the bump (step 6 is after step 3). No omni-specific bump logic is needed.
The only caveat: `gen-omni` must run **after** the bump, which the procedure guarantees.

---

## 6. Integration & the hook stance

### Triggering — who/when

| Trigger | Mechanism | Notes |
| --- | --- | --- |
| Solo edits 1-3 plugin files | `release-plugin` **preloaded** onto `solo.md` (ADR-4 `skills:`), no-ops outside the plugin repo | The common path. Solo already "documents what changed" — now it also bumps. |
| Pipeline run edits plugin files | `team-lead.md` commit protocol **invokes `release-plugin` by name** as the final pre-commit step | Keeps team-lead lean (invoke, don't preload). |
| Learner promotes a lesson into an agent/rule/skill | `improve-flow` / `improve-skills` **end by invoking `release-plugin`** | Closes the exact trigger class (a promoted lesson rewrote `team-lead.md`). |
| Manual release | User runs `/nexus:solo` "release the plugin" or invokes the skill directly | Skill is also directly invocable. |

### Relationship to existing pieces

- **`improve-skills`** already maintains *per-skill* CHANGELOGs and updates `.claude/README.md` skill
  counts. `release-plugin` is the layer **above** it: per-*plugin* version + per-plugin CHANGELOG +
  validate + tag. They compose — `improve-skills` finishes a skill edit, then hands to `release-plugin`
  for the plugin-level bump. No overlap; document the handoff in both SKILL.md files.
- **`solo` / `developer`** gain a release capability without a new persona (see §3).
- **`gen-commands.mjs` / `gen-omni.mjs`** are unchanged; the skill orchestrates them.

### The hook question — recommendation: **optional, off by default; ship it but don't wire it**

The user prefers no hook, and ADR-7's logic *does* argue for a mechanical backstop ("a faithful agent
can still skip a skill"). We reconcile these:

- **Do NOT add a blocking PreToolUse/PreCommit hook to `hooks.json`.** Respect the user's preference;
  a hook that blocks commits would fight the same-commit workflow and annoy on every docs edit.
- **DO ship an optional, opt-in check** as `scripts/check-bump.mjs` (a `--check` mode of
  `bump-plugin.mjs`): given a staged diff, exit non-zero if a plugin's behavior surface changed but its
  `plugin.json version` did not. This is **CI-shaped**, not a session hook — it slots into the
  recommended GitHub Actions gate (the same one the architecture doc already wants for
  `claude plugin validate`). CI is the right place for a backstop: it never adds session latency, never
  blocks an interactive edit, and catches the trigger on PR.
- **A `pipeline-gate`-style local hook is explicitly NOT recommended** here. `pipeline-gate.js` guards
  *pipeline invariants during a run*; version-bump is a *release-time* concern, not a per-tool-call one,
  so a PreToolUse hook is the wrong granularity (it would fire on every Write). The CI check is the
  correct backstop tier.

**Stance summary:** the skill is the owner; CI `--check` is the optional safety net; no session hook.
This honors "tooling that decides and applies the bump, not a hook," with a net that lives in CI where
the user won't feel it.

---

## 7. Migration — fix the current `0.1.3` situation

Current state: `nexus` `0.1.3`, `nexus-dotnet` `0.1.1`, marketplace metadata `0.1.0`, **no git tags**.

Recommended one-time migration (a single PR/commit, done by Solo invoking the new skill once it exists,
or by hand):

1. **Graduate to 1.0.0.** Set `plugins/nexus/.claude-plugin/plugin.json` → `1.0.0` and
   `plugins/nexus-dotnet/.claude-plugin/plugin.json` → `1.0.0`. Rationale: the plugins are real,
   installed, and the version line should start clean before the MAJOR-leaning policy compounds 0.1.x
   noise. (Alternative if the user rejects fast-climbing majors: stay 0.x and make MAJOR=minor-bump —
   Open Question below.)
2. **Backfill CHANGELOGs.** Create `plugins/nexus/CHANGELOG.md` and `plugins/nexus-dotnet/CHANGELOG.md`
   with a `## [1.0.0]` entry summarizing the current state (reconstruct from git log — same style the
   per-skill CHANGELOGs already use).
3. **Create the first tags.** From each plugin dir: `claude plugin tag --push` → `nexus--v1.0.0`,
   `nexus-dotnet--v1.0.0`. This is also the **first validation** of the whole tag flow and makes future
   dependency constraints resolvable (finding #3).
4. **Decide the marketplace-metadata version.** Either bump `marketplace.json` metadata to `1.0.0` for
   tidiness or leave it (it is marketplace-catalog metadata, not a plugin cache key — `plugin.json`
   wins). Recommend bump to `1.0.0` for human consistency; it has no functional effect.
5. **Land the tooling.** Add `scripts/bump-plugin.mjs` + `scripts/check-bump.mjs` and
   `plugins/nexus/skills/release-plugin/SKILL.md`; preload onto `solo.md`; reference from
   `team-lead.md` commit protocol and from `improve-flow` / `improve-skills` tails; run
   `gen-commands.mjs` (solo unchanged → no command change) and `gen-omni.mjs`.
6. **Update ADR-9.** Replace its prose flow with the §5 procedure and a pointer to `release-plugin`;
   note the tag-after-commit reordering and the per-plugin CHANGELOG. Move the §2 corrections into the
   "Platform constraints" / ADR-9 text.

After migration, the trigger commit's mistake is structurally impossible from the owned path: any future
agent-file edit routed through Solo / team-lead / the learner will classify MAJOR and bump in the same
commit, and CI `--check` catches anything that bypasses the skill.

---

## 8. Open Questions for the User

1. **0.x vs 1.0.0 graduation.** Approve graduating both plugins to `1.0.0` now (recommended), accepting
   that the major number will climb quickly under the MAJOR-lean? Or keep `0.x` and redefine "MAJOR" as
   a **minor** bump (0.1→0.2→0.3…) to keep the integer stable longer? (The latter keeps a calmer number
   but muddies "MAJOR means major.")
2. **Should `nexus-dotnet` pin `nexus` with a version constraint** (`{ "name": "nexus", "version":
   "^1" }`) instead of the current bare string? Pinning prevents a breaking `nexus` release from silently
   reaching dotnet users, at the cost of requiring a `nexus-dotnet` bump to adopt each new `nexus` major.
   Bare-string is convenient but unconstrained. (The tool will WARN either way; this sets the default.)
3. **Should `omni` (private twin) switch to commit-SHA versioning** (omit `version`) since the docs
   frame that as the right model for "internal/active-development" plugins? It would eliminate omni's
   bump obligation entirely. If yes, the skill should skip the bump for omni and `gen-omni` is unaffected.
   (Recommended: yes for omni, no for the public nexus.)
4. **New agent = MAJOR or MINOR?** §4 calls a new agent MAJOR (new behavior surface + command) per the
   user-lean, but a purist would call a purely additive agent MINOR. Confirm MAJOR.
5. **CI gate adoption.** Approve adding the GitHub Actions workflow (already wanted by the architecture
   doc for `claude plugin validate`) and wiring `check-bump.mjs --check` into it as the optional
   backstop? This is the only "net" we propose; confirm it's acceptable given the "prefer no hook" stance
   (it is CI, not a session hook).
6. **Marketplace-metadata version.** Bump `marketplace.json` `metadata.version` in lockstep for human
   tidiness, or leave it static (functionally irrelevant)?
7. **Tag push permissions.** `claude plugin tag --push` pushes git tags to the remote. Confirm the
   release driver (Solo/lead) is allowed to push tags, or should tagging be a human-only final step the
   skill stops short of (bump+commit owned by tooling, `tag --push` left to the user)?
