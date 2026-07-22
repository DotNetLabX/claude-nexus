# F12 — Workspace Self-Heal

**Feature Spec:** `docs/specs/F12-AnalyticsWorkspaceSelfHeal/definition/spec.md` (Status: Ready)
**Slug:** `F12-AnalyticsWorkspaceSelfHeal`
**Intent class:** Scoped (1 new skill + 1 agent edited + 1 sibling skill edited; single `nexus-analytics`
release). No consuming-app code — all agent/skill prose in the plugin.
**Release tier:** **MINOR** recommended (new `workspace-self-heal` skill = new capability, not a fix).
`bump-plugin.mjs` proposes PATCH by default; the **owner escalates** to MINOR at release (CLAUDE.md
release policy). Confirm at Step 4. `nexus-analytics` is at `0.5.0` → `0.6.0`.

## Context

The `nexus-analytics` data-analyst answers questions and (via F11's `fail-closed-intake`) persists a
per-user defaults record under `my-workspace/`. F12 makes the plugin keep that personal folder **healthy**
without ever touching version control: create its standard structure when missing (session start + again
before any workspace write), warn once per session when the repo's ignore protection is absent, and send
produced-file output there by default — while **never** editing the repository's ignore file or any tracked
file (an automated edit would leave every AM clone permanently dirty — the exact pull conflict this feature
prevents).

**Collision check (reading-protocol item 1):** grepped `workspace` / `self-heal` / `exports/` / `gitignore`
across `docs/proposals/`, `docs/specs/`, `docs/backlog.md`. Same-topic hits are exactly this spec, its
sibling specs (F11 `implementation.md`/`spec` create-if-missing note, F13 `spec.md` uses `prompts/`), the
parent proposal `2026-07-18-nexus-analytics-am-lane.md` (feature B), and the backlog row — no stale or
superseding same-name plan/proposal for F12. (The 70-odd other `workspace` hits are the common English word
in unrelated specs, not this feature.)

**Current-state anchors (grep-verified at plan time, 2026-07-22):**
- **No `hooks/` or `rules/` directory anywhere in `plugins/nexus-analytics/`** — the plugin has no
  session-start hook mechanism; every "session start" behavior is **agent prose** (drives the locus, D1).
- `agents/data-analyst.md` (86 lines) — sections `## Batched-Interview Intake`, `## Model-First Navigation`,
  `## Answer Contract`, `## Value-Claim Discipline`, `## Sibling Skills`, `## What You Know`,
  `## What You Never Do`. Preloads `semantic-model-query, data-investigation, answer-qa, fail-closed-intake`
  via `skills:` frontmatter. **Zero** hits for `my-workspace` / `exports` / `prompts` / `gitignore` — clean
  insertion point for a `## Workspace Self-Heal` section, a frontmatter skill, a sibling bullet, and a
  never-do bullet.
- `skills/answer-qa/SKILL.md` — `## The answer contract` is an enumerated **6-item** numbered list (grain,
  filters, date range, constructs, data caveats, applied defaults) opening "All six items are required
  whenever they apply"; `## Malformed answers` names items 1–4 + a separate defaults paragraph; the
  frontmatter `description` enumerates the obligations. Clean append point for a **7th conditional
  obligation** (produced-file path) — the same append pattern F11 used for obligation #6.
- `skills/fail-closed-intake/SKILL.md` — **already** owns `my-workspace/analyst-defaults.json` and "create
  the file and any missing parent folders on first persist" (`:82-84`), and its persistence boundary already
  says "never the repository's ignore file" (`:124-129`). F12 does **not** edit this file — the
  create-if-missing overlap is spec-sanctioned safe (spec Entities §Personal workspace; D2).
- **No `exports/` / `prompts/` folder logic, no ignore-detection, and no large-export gate anywhere in the
  plugin** (greenfield). The "large-export gate" the spec's BR5/AC6 reference is a **consuming-repo** rule,
  not a plugin artifact — F12 wires nothing against it; it only states in prose that the disk default never
  satisfies or bypasses such a rule.

## Scope

**In scope:** the new `workspace-self-heal` skill owning the heal check, the ignore-protection detection +
warn-once rule, the default-file-location rule, and heal-failure reporting; the data-analyst agent rewire
that runs the heal at session start and preloads the skill; the `answer-qa` 7th obligation (a produced
file's path is named in the answer); one `nexus-analytics` release (bump + regen command + twin).

**Explicitly out of scope:**
- **Committing the `my-workspace/` parent, README, and star-form ignore entries in a consuming repo** —
  a repo-owner action (already done in omnishelf-analytics; spec Out of Scope); the plugin only warns.
- **Any write to the repository's ignore file or any tracked file** — permanently excluded by BR3, not
  deferred. F12 never edits `.gitignore`.
- **The defaults record's content/migration/intake** — F11; it only *lives* here. F12 does **not** edit
  `fail-closed-intake` (D2).
- **Saved-prompt save/list/run behaviors** — F13; F12 only guarantees the `prompts/` folder exists.
- **The capture log** — F14, later and gated.
- **Backup / sync / sharing of workspace contents** — out of scope (spec).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | New skill `workspace-self-heal`; the folder contract (`exports/`, `prompts/`); the heal/backstop/detect-warn/default-location/heal-failure rules (BR1–BR7); sibling-skill shape to mirror | — (new plugin skill; born-compliant via skill-lint. No generative skill authors *this* prose — same posture as F11/F20) |
| 2 | (none) | — | no | `data-analyst.md` — add `workspace-self-heal` to `skills:`; new `## Workspace Self-Heal` conversation-start section; sibling + never-do bullets | — (agent-prose edit) |
| 3 | (none) | — | no | `answer-qa` 7th obligation (produced-file path); enumeration sweep (six→seven, description, malformed clause) | — (skill-prose edit) |
| 4 | release-plugin | Follow | no | nexus-analytics MINOR (owner-confirmed); `gen-commands nexus-analytics` (frontmatter changed); `gen-omni` after bump | |

Steps 1–3 are honestly `Skill: None` — plugin agent/skill **prose** with no generative pattern skill
(identical posture to F11-AnalyticsFailClosedIntake and F20-ProcessSkillQuickWins). `Skill: None` never
waives TDD; every step here is `TDD: no` because the diff is prose with **no executable behavior to
red-green** — the gates are the executed acceptance greps + the shipped skill-lint + `plugin validate`,
not a unit suite (F11/F20 precedent).

## Domain Model Changes

None (no consuming-app domain model — plugin agent/skill prose).

## Data Model Changes

None. F12 writes **no** persisted file of its own. It *creates folders* (`my-workspace/`, `.../exports/`,
`.../prompts/`) idempotently; the files that land inside them are owned by other features (F11's
`analyst-defaults.json`, F13's prompts, F14's log later) or are produced-export files the AM owns.

## Implementation Steps

### Step 1 — Author the new `workspace-self-heal` skill

`Satisfies: BR1, BR2, BR3, BR4, BR5, BR6, BR7` (Flows 1–4; AC-1…AC-8).

Create `plugins/nexus-analytics/skills/workspace-self-heal/SKILL.md`. This is the home for the workspace
contract and every heal/warn/default rule the agent and siblings don't already own. Mirror the shape and
length of the sibling skills `fail-closed-intake/SKILL.md` and `answer-qa/SKILL.md` (frontmatter + short
`##` sections + a `## What this skill does NOT do` + a `Consumed by:` line + a lessons-log pointer +
`## References`). Match the siblings' frontmatter fields (`name`, `description`, `user-invocable: true`);
the skill is born-compliant via the skill-lint gate (ADR-23) in this step's acceptance.

The skill must specify, as prose the analyst agent follows (describe the behavior + the contract; do
**not** write pseudo-code or a bash script-body):

- **The workspace contract** — the `my-workspace/` folder at repo root is each AM's own space; the standard
  structure the plugin guarantees is `my-workspace/exports/` (default landing place for produced files) and
  `my-workspace/prompts/` (home of saved prompts, behavior owned by F13). Co-residents that other features
  place here — F11's `analyst-defaults.json`, F13's prompts, F14's capture log later — are named so this
  skill is the single documented owner of the *structure*. Everything inside the workspace belongs to the
  AM.
- **The heal check (BR1, BR2, BR6, Flows 1–2)** — runs **at session start** and **again immediately before
  any write into the workspace**; creates only the missing standard folders (create-if-missing, idempotent —
  e.g. `mkdir -p`), so a workspace write never fails because a folder was missing, even one deleted
  mid-session. It **never** deletes, moves, renames, or overwrites anything in the workspace, and **never**
  creates or edits the workspace README (repo-owned, committed). **Quiet when healthy:** nothing missing →
  no output; folder creation → a single one-line note ("set up your my-workspace folder"). The overlap with
  F11 (which also create-if-missing the folders its record needs) is intentional and safe — whichever runs
  first wins, the other finds nothing to do.
- **Ignore-protection detection + warn-once (BR3, BR4, Flow 3)** — at session start, detect by **outcome**,
  never by the exact wording of the ignore entries: whether workspace contents are ignored (e.g.
  `git check-ignore -q` on a path under `my-workspace/`). The healthy protection outcome also has the README
  tracked (e.g. `git ls-files --error-unmatch my-workspace/README.md`), which the repo owner maintains —
  but the **warning fires specifically on the pull-conflict condition: workspace contents are NOT ignored**
  (D3). The README-tracked half is **not** an independent warn-trigger: a contents-ignored repo is
  pull-safe, so firing BR4's pull-conflict message there would be a *false warning* — exactly what the
  spec's "never falsely warned" / outcome-not-wording intent (Entities §Ignore protection) forbids, and the
  spec defines no second message. Warn **exactly once per session**, in AM-facing language: personal files
  in this folder can collide with `git pull`; ask the **repo owner** to add the ignore protection. No repeat
  on later questions in the same session; every new session warns again until fixed. A repo that achieves
  the ignored-contents outcome differently is never falsely warned; a **non-git repo** has no version
  control and no pull-conflict risk → skip the warning, still heal folders (D6). The plugin changes
  **nothing** in the repo — warning only; it never edits `.gitignore` or any tracked file, not to fix
  protection, not for any purpose.
- **Default file location (BR5, Flow 4)** — a file an export flow produces with **no** user-named disk
  location lands in `my-workspace/exports/`, and the shipped answer names the resulting path (the naming
  obligation is enforced by the sibling `answer-qa` skill, Step 3). A user-named location **always wins** —
  no forced redirect. State emphatically: this disk location is **not** an answer-delivery destination — it
  never satisfies any consuming-repo rule that requires one (in particular the large-export gate that
  demands a spreadsheet or narrower filters still fires exactly as before — the default can never bypass or
  be offered as a way past it), and it never changes what F11's intake resolves (where the answer is
  *delivered* — conversation or spreadsheet — is F11's, unchanged here). A consuming repo whose export flows
  produce no files simply never exercises this default.
- **Heal failure is reported, never silent (BR7)** — if a folder cannot be created (e.g. permissions), the
  plugin says so plainly and continues with whatever does not need that folder; a broken workspace never
  silently blocks an otherwise deliverable answer.

Then a `## What this skill does NOT do` section carrying the hard exclusions: never edit `.gitignore` or
any tracked file; never create or modify the workspace README; never delete, move, rename, or overwrite
workspace content it did not just write; not the defaults-record's content (F11); not saved-prompt behavior
(F13); not the capture log (F14); the exports folder is a disk location, **not** a delivery destination.

Acceptance (mechanisms):
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/workspace-self-heal`
  exits 0 (born-compliant, ADR-23).
- `grep -n` in the new SKILL.md finds: the `exports/` + `prompts/` standard structure; the "session start"
  **and** "before any write" heal timing (BR1); a create-if-missing / "never delete … move … overwrite"
  rule (BR2); the "never … `.gitignore`" / never-tracked-file rule (BR3); the "once per session" warning
  rule naming the pull-conflict risk **and** the repo owner (BR4); `my-workspace/exports/` as the default
  location **and** the "not a delivery destination" / "never bypass … large-export gate" clause (BR5); the
  "quiet when healthy" / one-line-note rule (BR6); the heal-failure "reports … continues" rule (BR7); the
  outcome-based detection (`check-ignore` / `ls-files`, "never the exact wording").

### Step 2 — Rewire the data-analyst agent to run the heal at session start + preload the skill

`Satisfies: BR1, BR3, BR4` (Flow 1, Flow 3 — the agent is what triggers the session-start heal and the
per-session warning).

`plugins/nexus-analytics/agents/data-analyst.md`:
- Add `workspace-self-heal` to the `skills:` frontmatter (preload — the heal runs at conversation start and
  before any workspace write, so it must be guaranteed-present like the other four).
- Add a new **`## Workspace Self-Heal`** section, placed as the first conversation-start behavior (before
  `## Batched-Interview Intake`): at the start of every conversation, run the `workspace-self-heal` skill —
  create any missing standard folders (one-line note only if something was created), and warn **once** if
  the repo lacks the workspace ignore protection; re-run the folder check before any write into the
  workspace; default produced-file output with no named location to `my-workspace/exports/`. Cite the skill
  as the owner of the mechanics rather than restating them.
- Add a `## Sibling Skills` bullet for `workspace-self-heal` (one-liner: keeps `my-workspace/` healthy —
  folder self-heal, the ignore-protection warning, the default export location).
- Add a `## What You Never Do` bullet: never edit `.gitignore` or any tracked file for a workspace purpose
  → instead: warn the AM to ask the repo owner (per `workspace-self-heal`).
- **Enumeration sweep (adjacent-surface staleness — the exact ripple F11 hit and fixed;
  `docs/specs/F11-AnalyticsFailClosedIntake/delivery/implementation.md:176-182`).** Two additions in this
  feature grow two hardcoded enumerations *in this same file* that go stale silently:
  - Adding `workspace-self-heal` as the **5th** `## Sibling Skills` entry makes `## What You Know`'s "The
    four sibling skills above — invoke them…" (`data-analyst.md:70`) factually wrong → update **four →
    five**.
  - Adding `answer-qa` obligation #7 (Step 3) makes the agent's own enumerations of the answer contract
    stale: the `## Answer Contract` body (`data-analyst.md:34-40`, lists items 1–6) and the frontmatter
    `description` (`data-analyst.md:3`, "…names grain, filters, date range, constructs, and every applied
    default") → add the produced-file-path obligation to **both**, matching Step 3's item-7 wording.
- Binding: the agent name `data-analyst` and its command route are unchanged.

Acceptance: `grep` the frontmatter `skills:` line includes `workspace-self-heal`; a `## Workspace Self-Heal`
heading exists and names the skill + the session-start heal + the warn-once; `## Sibling Skills` carries the
new one-liner; `## What You Never Do` carries the never-edit-`.gitignore`/tracked-file line; **`## What You
Know` reads "five sibling skills", not "four"**; the `## Answer Contract` body **and** the frontmatter
`description` both name the produced-file-path obligation. (The `value-briefing/SKILL.md` "default accuracy
flows" list is deliberately **not** extended — `workspace-self-heal` is workspace hygiene, not an accuracy
flow; see Plan Review.)

### Step 3 — Extend the `answer-qa` contract with the produced-file path (obligation #7)

`Satisfies: BR5, AC-5` (the "answer names the resulting path" half of Flow 4 — enforced at the final-answer
gate).

`plugins/nexus-analytics/skills/answer-qa/SKILL.md`:
- Append a **7th** item to `## The answer contract`: **Produced-file path** — when the flow produced a file
  (an export written to disk), the shipped answer names its full path; when the AM named no location the
  path is under `my-workspace/exports/` (the sibling `workspace-self-heal` skill owns *where* it lands, this
  contract owns that the answer *names* it). Conditional, like the others ("required whenever they apply") —
  a query that produces no file satisfies it vacuously.
- **Enumeration sweep** (adjacent-surface staleness): update the opening "All six items are required" →
  "All seven items"; add a produced-file clause to `## Malformed answers` (an answer that produced a file
  without naming its path is malformed — fix it before shipping); update the frontmatter `description`'s
  obligation enumeration to include the produced-file path so the description stays current.

Acceptance: `grep` the contract for a 7th numbered obligation naming the produced-file path and
`my-workspace/exports/`; `grep` for "seven" replacing "six" in the contract opener; `grep`
`## Malformed answers` for the produced-file-without-path clause; `grep` the frontmatter `description` for
the produced-file-path mention. Skill-lint on `answer-qa` stays green:
`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/answer-qa`
exits 0.

### Step 4 — Release: bump + regen + twin

`Satisfies:` dev-repo release machinery (ADR-9). **At-close obligation — not a per-step developer action:**
the bump is run **once, after all of Steps 1–3 land**, in the closing commit (CLAUDE.md: never bump
per-step). The implementing developer does **not** run this; it rides the fast-lane close (or the team
lead's commit).

Follow `release-plugin`. Because `data-analyst.md` frontmatter changed, run
`node scripts/gen-commands.mjs nexus-analytics` (regenerate the persona command). Tier: **nexus-analytics
MINOR** (`0.5.0 → 0.6.0`) — confirm with the owner (the bump tool proposes PATCH; the owner escalates for
the new capability). After the bump, run `node scripts/gen-omni.mjs` so the twin's versions ride along;
commit the omni twin in `../omni` with the mirrored subject per CLAUDE.md. Bump + CHANGELOG + regenerated
command ride in the **same** feature commit.

Acceptance: `plugins/nexus-analytics/.claude-plugin/plugin.json` `version` is `0.6.0` (MINOR);
`plugins/nexus-analytics/CHANGELOG.md` has the entry; `plugins/nexus-analytics/commands/data-analyst.md`
regenerated to match the new frontmatter (`skills:` line includes `workspace-self-heal`);
`claude plugin validate plugins/nexus-analytics --strict` clean.

## Cross-Service Changes

N/A — conversational/session behavior; no HTTP/gRPC/event surface (spec API Surface = N/A).

## Migration Notes

No database migration and no data migration. The only runtime "creation" is idempotent folder
`mkdir -p`, owned by the `workspace-self-heal` skill (Step 1); it is never destructive and needs no
rollback.

## Testing Strategy

Prose-only diff — no runtime code, so **no unit-test surface** (F11/F20 precedent). The gates are the
executed acceptance greps per step + the shipped skill-lint on the new skill dir and on `answer-qa` +
`claude plugin validate --strict`. Behavioral coverage of the 8 acceptance criteria is a **live
analyst-session concern in the consuming repo** (omnishelf-analytics) — the plugin ships the behavior; the
consumer exercises it (e.g. AC-1 fresh-clone folder creation, AC-3 one-warning-per-session, AC-4
byte-identical ignore file). Flag this in `implementation.md` so the done-check reads AC coverage as
consumer-side, not a missing plugin test. **AC-5/AC-6 are vacuous in the plugin today** — no shipped export
flow produces a file and there is no plugin-side large-export gate; the rules ship forward-looking (spec
AC-5 explicitly allows vacuous satisfaction).

## KB Impact

None. This edits plugin skill/agent prose, not a consuming project's `docs/kb/`.

## Decisions

| # | Decision | Why | Rejected alternative | Status |
|---|----------|-----|----------------------|--------|
| D1 | The heal/warn/default logic lives in a **new `workspace-self-heal` skill** preloaded onto data-analyst + a conversation-start agent section — **not a hook, not inline-only, not folded into `fail-closed-intake`** | The plugin ships **no** hook/rules mechanism, and "session" = the analyst conversation (a possible subagent spawn), not a main-session `SessionStart` a hook could catch; a skill matches F11's established delegation pattern and the allocation principle, and gives F13/F14 a single documented owner of the workspace contract | A `hooks/` SessionStart script (wrong trigger + net-new infra); inline agent prose only (no shared owner for F13/F14); extend `fail-closed-intake` (conflates intake with workspace hygiene) | decided |
| D2 | **Do not edit `fail-closed-intake`** — leave its own create-if-missing folder logic in place | The create-if-missing overlap is spec-sanctioned and safe (both idempotent, first-writer wins); editing a working skill for a cosmetic back-pointer adds two-surface-reconciliation risk for no behavior gain; `workspace-self-heal` documents itself as the structure owner, which is sufficient | Refactor F11's folder creation into the shared skill and have `fail-closed-intake` delegate — touches a shipped, working skill and widens the diff | decided |
| D3 | The once-per-session ignore-warning **fires on the pull-conflict condition — workspace contents are NOT ignored** — outcome-judged (not by literal ignore-file wording); the README-tracked half of the healthy outcome is detected but is **not** an independent warn-trigger | **Investigated** (parent proposal + spec cross-read, 2026-07-22, confidence HIGH): 7 signals frame the one warning as pull-conflict — spec Purpose, BR4's message, **AC-3 (the testable criterion names exactly "the pull-conflict risk")**, Flow-3.2, the proposal's Need ("AM files colliding with git pull") and its rationale ("the exact pull conflict B exists to prevent"), and the structural fact that clone-break is caused only by contents-not-ignored. A pull-conflict warning on a contents-ignored (pull-safe) repo would be a *false* warning — the Entities "never falsely warned / outcome-not-wording" clause forbids it | The strict conjunction trigger `NOT(contents ignored AND README tracked)` (critic HIGH-1) — it either false-warns about pull conflicts on a pull-safe README-only-broken repo, or invents a second warning message the spec never defines. **Residual, accepted + documented:** the README-only-broken case is deliberately un-warned (no pull-conflict; no spec-defined message) | decided |
| D4 | The "answer names the produced file's path" obligation goes into **`answer-qa` (item 7)**, while `workspace-self-heal` owns *where* the file lands | `answer-qa` is the single home of the final-answer contract and runs last, right before presenting — the correct gate for "the answer names X"; mirrors F11's obligation-#6 append exactly | State the naming rule only in `workspace-self-heal` — leaves the final-answer gate blind to it, splitting the answer contract across two skills | decided |
| D5 | Recommend **MINOR** release tier (`0.5.0 → 0.6.0`) | A new `workspace-self-heal` skill is a new capability, not a fix | PATCH (the tool default) — undersells a new capability; owner confirms at Step 4 | deferred (owner confirms) |
| D6 | A **non-git repo** heals folders but skips the ignore-protection warning entirely | No version control ⇒ no `git pull` ⇒ none of the pull-conflict risk the warning names; `git check-ignore` cannot run outside a repo anyway. Plan-authored inference — the spec assumes a git repo throughout (Purpose, Flow 3) and never names this case (critic MEDIUM) | Warn regardless — meaningless without version control, and the detection command errors outside a git repo | decided |

## Open Questions

None open. The one spec-interpretation ambiguity the critic surfaced (does the warning fire on the strict
`contents ignored AND README tracked` conjunction, or only on the pull-conflict condition?) is **resolved by
investigation** — D3, confidence HIGH, evidence in the Plan Review below. The MINOR tier (D5) is
owner-confirmed at Step 4.

## Plan Review

**Critic (code-grounded, Mode 2) — verdict REVISE → all findings folded or resolved-with-evidence.**

| Finding | Sev | Disposition |
|---------|-----|-------------|
| HIGH-1 — D3 narrows the ignore-detection below the spec's Entities "contents ignored AND README tracked"; resolved silently | HIGH | **Resolved with evidence, not silently** — investigated (parent proposal + spec, 2026-07-22): 7 signals (Purpose, BR4, AC-3-the-testable-criterion, Flow-3.2, proposal Need + rationale, the clone-break causal fact) frame the one warning as pull-conflict → warn on contents-not-ignored; the conjunction trigger would false-warn a pull-safe repo (forbidden by the Entities "never falsely warned" clause) or invent a second undefined message. D3 rewritten to make the narrowing explicit + evidenced; residual (README-only case un-warned) documented |
| HIGH-2(i) — adding a 5th preloaded skill + a 7th `answer-qa` obligation ripples stale enumerations in `data-analyst.md` (`:70` "four sibling skills", `:34-40` Answer Contract body, `:3` frontmatter description) — the exact ripple F11 hit and fixed | HIGH | **Fixed** — Step 2 now carries an explicit enumeration-sweep sub-bullet (four→five; produced-file-path added to the body **and** the frontmatter description) + acceptance greps for each |
| HIGH-2(ii) — `value-briefing/SKILL.md:18-19` "default accuracy flows" list should gain `workspace-self-heal` (F11 added `fail-closed-intake` there) | HIGH | **Dismissed with reason** — that list is titled "default **accuracy** flows"; `fail-closed-intake` belongs (it prevents confidently-wrong numbers — proposal gap D), but `workspace-self-heal` is **workspace hygiene**, orthogonal to the accuracy/value split `value-briefing` protects. Adding it would mislabel a hygiene skill as an accuracy flow; the sentence stays true without it (the `disable-model-invocation: true` flag, not the enumeration, is what actually prevents loading). Documented so the reviewer/omni-sync won't re-flag it |
| MEDIUM — non-git carve-out was folded silently into D3's justification | MED | **Fixed** — split into its own explicit row **D6** |
| LOW — anchors said "85 lines", file is 86 | LOW | Fixed — anchor corrected to 86 |
| Code-grounded confirmations (no hooks/rules dir; data-analyst sections + zero workspace refs; answer-qa genuine 6-item list; fail-closed-intake owns the record + persistence boundary; no large-export gate anywhere; all acceptance commands real; D1/D2/D4/D5 sound; `Skill:None`/`TDD:no` precedent real) | — | No change needed |

**BR3/AC-4 enforcement ceiling:** the critic confirmed the plan's disclosure is honest — a pure-prose
plugin has no runtime backstop for "never edit `.gitignore`"; the Testing-Strategy + Scope disclose that
rather than over-claiming enforcement. This is the ceiling for prose enforcement, disclosed not hidden.
