# Implementation Plan — adhoc-NexusFleetView

**Slug:** adhoc-NexusFleetView
**Intent:** Scoped (additive observability surface for the nexus plugin)
**Definition:** ad-hoc technical feature — no `spec.md`; binding input is the ADR register + the
2026-06-16 design discussion (recovered) + the three answered questions in `questions.md`.
**Review mode:** critic (Mode 2 vs ADR register) + mandatory code-grounded reviewer pass.
**Release:** ships to consumers (runtime observability, like ADR-11) → **MINOR bump 1.12.0** + omni
twin regen (ADR-6/9). New skill needs **no** `gen-commands` (commands are agent-generated only).

## Summary

Add `/nexus:fleet` — a consolidated, on-invoke "visual representation of the running background
agents." It is the **aggregation layer** above the per-row `subagentStatusLine` that already ships
(`subagent-rows.js`, 1.11.0): a summary header (counts by run-state), one line per pipeline agent
(role · phase/step · tokens · elapsed · run-state), and a health footer.

**Load-bearing finding (drives the whole design):** the rich live fleet data — `tasks[]` with
`tokenCount`, `startTime`, `status`, role `type` — is delivered **only** to the `subagentStatusLine`
hook; the in-session `TaskList` tool returns just the task board (`{id, subject, status, owner,
blockedBy}`). So live data must be **captured from the statusline**, not queried on demand. Hence the
heartbeat (Step 1) is a prerequisite for the skill (Step 2), not an optional enrichment.

## Master-gate note (ADR-25)

This is **additive and a two-way door** (a new skill + a guarded, fail-open write on an existing
script; both removable with no migration). Per ADR-25 it does **not** warrant a tech-spec or new
multi-ADR extraction — it collapses to **one ADR** (Step 3) that references the existing observability
and write-path decisions (ADR-11, ADR-8, ADR-2). The critic runs Mode 2 against the **ADR register**,
not a spec.

## Data sources the skill joins (single-project, current session only)

| Source | Carries | Precondition |
|--------|---------|--------------|
| `.claude/audit/fleet-state.json` (new, Step 1) | live roster: role, run-state, tokens, elapsed | none — written whenever the statusline runs |
| `docs/specs/*/delivery/communication-log.md` (most recent header) | phase, cycle, review-mode, agentIds | a run exists |
| `.claude/audit/token-usage.jsonl` | depth: peak context, growth, tool-calls | `token_audit` on |
| `.claude/audit/violations.log` | health: boundary-event count | any breach logged |

Every join is **best-effort**: a missing source degrades to a one-line hint, never an error.

## Skill Mapping

| Step | Operation | Skill | TDD |
|------|-----------|-------|-----|
| 1 | Heartbeat: persist fleet state from the statusline | None (JS; pattern = the hooks' root-resolution) | yes |
| 2 | `/nexus:fleet` skill — SKILL.md + render helper | improve-skills (scaffold born-compliant) | yes |
| 3 | Record the decision as one ADR | None | no |
| 4 | Release — bump 1.12.0 + validate + twin | release-plugin | no |

---

## Step 1 — Heartbeat: persist the live fleet snapshot from the statusline

**File (modify):** `plugins/nexus/statusline/subagent-rows.js`

**Sub-step 1.0 — GATING capture spike (must pass before any write logic is written).** The whole
feature rests on one undocumented fact: that a `subagentStatusLine` process can resolve a **project
root** to write under. This is *not* the hook-event payload the other scripts use — those carry a
top-level `data.cwd`; the statusline contract documents only `tasks`, `columns`, and "base hook
fields", and lists `cwd` as a **per-task** field (`tasks[].cwd` = a subagent working dir, *not* the
project root). So: set `NEXUS_SUBAGENT_CAPTURE` on a live team run and inspect the captured payload +
process env. Determine which carries a usable project root — (a) `process.env.CLAUDE_PROJECT_DIR`, or
(b) a **top-level** `data.cwd`/`data.workspace` field. **If neither exists, STOP and escalate to the
architect** — do not ship a heartbeat that silently never writes (it would make `/nexus:fleet` read
"No active fleet" during a live run, defeating the feature). Also confirm `tokenCount`/`startTime`
presence on active rows. Record the confirmed field name(s) in `implementation.md`.

**Sub-step 1.1 — the guarded, fail-open write** (after the rows are built): write the normalized
snapshot to `<root>/.claude/audit/fleet-state.json`.

- **Root resolution:** `root = process.env.CLAUDE_PROJECT_DIR || <the top-level payload field 1.0
  confirmed>`. **Never** bare `process.cwd()` (ADR-8 stray-log), and **never** `tasks[].cwd` (a
  subagent dir → wrong audit location). No root → **skip the write**.
- **Atomic write:** write a temp file then `rename` over `fleet-state.json` — the skill may read it
  mid-render, and `rename` is atomic so a reader never sees a torn file (MEDIUM-1).
- **Drain on empty:** `tasks: []` with a resolvable root **writes an empty snapshot** (fleet drained),
  it does not skip — so a stale roster never lingers after a run ends.
- **Normalized shape:** `{ ts, columns, tasks: [ { id, role: detectRole(t)|null, tag, name,
  description, status, startTime, tokenCount, cwd } ] }`. Reuse the existing `detectRole`/`ROLES`.
- **Fail-open preserved:** the whole write is wrapped so any failure is swallowed and **row rendering
  is unaffected** — mirror the existing `NEXUS_SUBAGENT_CAPTURE` try/catch posture.
- **Amend the file header comment:** no longer a "pure transform — reads no plugin files"; document the
  guarded atomic write, the root chain, and the fail-open guarantee.

**Acceptance (extend the EXISTING suite `tests/unit/subagent-rows.test.mjs` via the
`runHook(SCRIPT, payload, { projectDir })` + `makeSandbox()` harness in `tests/helpers.mjs` — there is
no `plugins/nexus/tests/`; CI runs `tests/unit/*` + `tests/lint/*`):**
- `projectDir` = a sandbox + a populated payload → `fleet-state.json` lands at
  `<sandbox>/.claude/audit/fleet-state.json` with the normalized shape; a second run overwrites
  (latest-wins, no growth).
- Row stdout stays **byte-identical** to current behavior for the same input — the existing fail-open /
  detection tests stay green with the write present.
- `projectDir` omitted **and** no top-level cwd in the payload → **no file written**; malformed/empty
  **stdin** still `exit 0`, no throw, no write.
- `tasks: []` + sandbox root → an **empty** snapshot is written (drain), not skipped.

**Confidence: medium** — the write is a known pattern, but the root field is undocumented for this
payload; **Sub-step 1.0 is the gate that closes it** before any logic depends on it.
**Satisfies:** ADR-8 (audit write-path discipline), ADR-13 (the statusline is where background-agent
facts are observable).

## Step 2 — The `/nexus:fleet` skill

**Files (create):**
- `plugins/nexus/skills/fleet/SKILL.md` — frontmatter (`name: fleet`, a `description` that names the
  trigger and the `token_audit` depth precondition, matching the `consumption-report` style). It is a
  **user-invoked dashboard** (`/nexus:fleet`), so set the same invocation intent as
  `consumption-report` — user-triggered, not auto-invoked by the model (mirror its frontmatter; ADR-23
  treats this as a scaffold decision, not an afterthought). Body: when to use, the data-source table,
  the render invocation, and the degradation rules.
- `plugins/nexus/skills/fleet/scripts/render-fleet.mjs` — the join+render (a script, not inline
  `node -e`, because the 4-source join is testable and the future Vue dashboard reuses the same
  parser; `consumption-report` is the **data-access** pattern to follow for the `token-usage.jsonl`
  aggregation — **replicate** its consecutive-tuple dedup algorithm, same tuple key
  `[input,output,cache_read,cache_creation]`, and pin it with a test matching `consumption-report`'s
  output. That dedup lives inline in a `node -e` block, so it is copied not imported — flag extracting
  it to a shared `scripts/` module both consume as a follow-up).

**Behavior:** read the four sources in the table above, render the consolidated dashboard — a header
(`running N · idle M · elapsed`), one line per agent (`[tag] phase/step · tokens · ▶/⏸ elapsed ·
calls`), and a `health:` footer. Pull live roster + tokens + run-state from `fleet-state.json`;
phase/step/cycle from the newest `communication-log.md` header; depth columns from `token-usage.jsonl`;
the violation count from `violations.log`.

**Degradation (each a one-liner, never an error — pin each string as an imported constant so the test
and the reviewer agree on what passes):**
- no `fleet-state.json` **or malformed JSON** → "No active fleet — run a team (statusline populates
  this live)."
- `fleet-state.json` present but its `ts` exceeds a freshness threshold (e.g. 60s) → render the roster
  but label it **stale** ("last seen {age} ago"), not "running" — a snapshot from an ended run must not
  read as live.
- no `token_audit` log → render basic columns, append "(enable token_audit for depth)".
- no `communication-log.md` → omit phase/cycle columns.

**Acceptance:**
- Add a fixture set under `tests/fixtures/fleet/` (full-data `fleet-state.json` + `communication-log.md`
  + `token-usage.jsonl` + `violations.log`). Define the **exact ANSI-stripped expected output** for the
  full-data render and for each degradation path, and assert it **verbatim** — `questions.md` carries
  only a format sketch, so the fixture + expected-string pair is the pass/fail contract.
- Each degradation path produces its **pinned** line and a `0` exit.
- Depth columns appear **only** when the `token-usage.jsonl` fixture is present.
- The new skill passes `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs
  plugins/nexus/skills/fleet` (born-compliant: no BOM, valid frontmatter, `name` matches folder, cited
  `scripts/` files exist).
- Offline tests for `render-fleet.mjs` (under `tests/unit/`) cover the full-data render + each
  degradation path against the fixtures.

**Confidence: high** — `consumption-report` is a direct precedent for both the skill shape and the
log parsing.
**Satisfies:** ADR-11 (opt-in observability that ships to consumers), ADR-2 (skill delivery), ADR-4
(skill = the right carrier).

## Step 3 — Record the decision as one ADR

**File (modify):** `docs/architecture/README.md`

Add **ADR-33 — The fleet view: a consolidated observability skill over a statusline heartbeat.** One
screen, ADR shape (Context → Decision → Why → Tradeoffs → Rejected). Capture the load-bearing finding
(rich live data is push-only to the statusline; `TaskList` is the task board, not the agent panel),
the heartbeat-persistence decision, and single-project/best-effort-degradation scope. **Reference**
ADR-11/ADR-8/ADR-2 — do not restate them. Add the ADR to the Contents list.

**Acceptance:** ADR-33 present and listed in Contents, carrying a `Status:` banner consistent with
ADRs 30–32 (`Accepted — adhoc-NexusFleetView, 2026-06-16`); it references rather than restates the
prior ADRs; the rejected-alternatives note records "skill calls `TaskList`" (insufficient data) and
"Vue dashboard now" (deferred).
**Satisfies:** ADR-25 (two-way-door additive change collapses to one ADR), ADR-28 (decision recorded
as a durable one-decision ADR).

## Step 4 — Release

Run the **release-plugin** flow:
- `node scripts/bump-plugin.mjs --minor` → `plugin.json` **1.12.0** + `CHANGELOG.md` entry (new
  capability).
- `claude plugin validate plugins/nexus --strict` → clean.
- `node scripts/gen-omni.mjs` → twin regenerated with the new skill + statusline change + version.
- **No** `gen-commands` (no agent changed).

**Acceptance:** `plugin.json` = 1.12.0; CHANGELOG names the fleet view; `validate --strict` passes;
the omni twin contains `skills/fleet/` and the updated `subagent-rows.js`; the bump rides in the
**same commit** as the change (CLAUDE.md release discipline).
**Satisfies:** ADR-9 (owned release flow), ADR-6 (twin generated, not hand-mirrored).

---

## Plan Review

**Critic (Mode 2 vs ADR register), 2026-06-16 — Verdict: REVISE → all findings addressed.** The
critic confirmed the cross-reference matrix (every step maps to its cited ADRs) and the master-gate
call (additive two-way-door → one ADR), and raised 3 HIGH + 4 MEDIUM. Dispositions:

| Finding | Severity | Disposition |
|---------|----------|-------------|
| H1 — root-resolution borrows `data.cwd` from the *hook* contract, not the statusline payload; prose overstated certainty | HIGH | **Fixed.** Step 1.0 is now a **gating** capture spike with STOP-if-no-root; prose de-overstated; `tasks[].cwd` explicitly rejected as a root source. |
| H2 — Step 1 named a non-existent `plugins/nexus/tests/`; a real suite `tests/unit/subagent-rows.test.mjs` exists | HIGH | **Fixed.** Acceptance now extends the real suite via `runHook(..., {projectDir})` + `makeSandbox()`. Verified both files exist. |
| H3 — Step 2 render acceptance not pass/fail-checkable (no fixture/expected output) | HIGH | **Fixed.** Step 2 now requires `tests/fixtures/fleet/` + verbatim ANSI-stripped expected strings; degradation lines pinned as constants. |
| M1 — torn read / write churn on the heartbeat file | MEDIUM | **Fixed.** Atomic temp-then-`rename` in Step 1.1; malformed-file degradation added to Step 2. |
| M2 — "reuse dedup verbatim" overstates (it is an inline `node -e`, not importable) | MEDIUM | **Fixed.** Reworded to "replicate + pin with a matching test"; extraction flagged as follow-up. |
| M3 — ADR-33 status banner unspecified | MEDIUM | **Fixed.** Step 3 acceptance pins `Status: Accepted — adhoc-NexusFleetView, 2026-06-16`. |
| M4 — skill frontmatter invocation intent unrecorded | MEDIUM | **Fixed.** Step 2 sets user-invoked / no model-auto-invoke, mirroring `consumption-report`. |
| Edge — empty `tasks[]` drain; stale-snapshot labelling | — | **Fixed.** Drain-on-empty in Step 1.1; `ts`-age staleness label in Step 2 degradation. |

No CRITICAL; no open HIGH after revision. **Plan approved** (review passed, no open questions).
