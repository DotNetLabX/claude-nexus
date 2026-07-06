NO-GO — Steps 1–3 re-run cleanly on the live files, but Step 4 does not pass exactly as written because the acceptance names a nonexistent manifest path; there is also a minor cross-artifact gap in the architect done-check's missing predate exemption.

## Findings

| Severity | File | Issue |
|---|---|---|
| MAJOR | `docs/specs/adhoc-ArchitectDecisionDisclosure/delivery/plan.md:111`; `plugins/nexus/.claude-plugin/plugin.json:3` | Step 4's acceptance is not rerunnable as written. The plan says at `plan.md:111`: ``**Accept:** `plugins/nexus/plugin.json` version = 1.25.0``. The live manifest I read is `plugins/nexus/.claude-plugin/plugin.json:3`: `"version": "1.25.0",` and `plugins/nexus/plugin.json` does not exist in this repo. The implementation has the version bump, but the acceptance path fails literally. |
| MINOR | `plugins/nexus/agents/architect.md:275`; `plugins/nexus/skills/create-implementation-plan/references/plan-template.md:83`; `plugins/nexus/agents/critic.md:49` | The architect done-check omits the explicit predate exemption that the template and critic both carry. The template says at `plan-template.md:83`: `Additive: plans predating this section are not retro-flagged.` The critic says at `critic.md:49`: `plans that **predate** the section are exempt`. The architect done-check at `architect.md:275` says to flag any missing/silent `## Decisions` section on `the plan`, with no matching exemption. That is not a contradiction for newly-authored plans, but it is a compatibility gap for historical-plan checks. |

## Per-Step Acceptance Re-Run

- Step 1: PASS. I re-ran the stated checks on `plugins/nexus/skills/create-implementation-plan/references/plan-template.md`. `rg -c '^## Decisions$'` returned `1`; the section-map line at `plan-template.md:5` contains `` `## KB Impact`, `## Decisions`, `## Open Questions` `` in order; the explicit-empty sentence appears at `plan-template.md:83`: `None — no self-resolved calls met the disclosure bar`.
- Step 2: PASS. In `plugins/nexus/agents/architect.md`, `rg -n 'Decisions taken:'` hit `architect.md:218` inside the step-13 auto-approve message; `rg -n 'plan-hygiene'` hit `architect.md:275` in the Done Check section; `rg -n '## Decisions'` hit `architect.md:247` in the Plan Writing Rules bullet.
- Step 3: PASS. In `plugins/nexus/agents/critic.md`, `rg -n 'Decisions'` returned the checklist line at `critic.md:49`, and that one line includes all required tokens: `## Decisions`, `MEDIUM`, and `predate`.
- Step 4: FAIL as written, PASS on the actual live manifest/changelog surfaces. The live version bump is present at `plugins/nexus/.claude-plugin/plugin.json:3`: `"version": "1.25.0",` and the changelog entry is present at `plugins/nexus/CHANGELOG.md:4-5`: `## [1.25.0] — 2026-07-06` / `Architect Decision Disclosure: plans now carry a \`## Decisions\` section ... architect emits a \`Decisions taken: N\` metric ... critic flags ... a MEDIUM plan-hygiene finding.` But the acceptance text in `plan.md:111` points to `plugins/nexus/plugin.json`, which is not the live manifest path.

Non-grep Step 4 note: `git diff --cached --stat` cleanly shows the 7 staged nexus files together, and `claude plugin validate plugins/nexus --strict` passed in this workspace. `git diff --stat HEAD` is noisier because the repo also has unrelated dirty files outside this change.

## Cross-Artifact Consistency

### Live quotes

- `plugins/nexus/skills/create-implementation-plan/references/plan-template.md:82-83` — `## Decisions` / `One row per judgment call the architect resolved alone — **decision · one-line why · rejected alternative · status (`decided` | `deferred`)** ... write exactly: `None — no self-resolved calls met the disclosure bar`. Additive: plans predating this section are not retro-flagged.`
- `plugins/nexus/agents/architect.md:218` — `"For developer: Plan approved for {FeatureName} ({N} steps, Decisions taken: {M} — see ## Decisions). Begin implementation."`
- `plugins/nexus/agents/architect.md:247` — `Every plan carries the `## Decisions` section ... gets a row (decision · why · rejected alternative · status `decided | deferred`) ... write the explicit `None — no self-resolved calls met the disclosure bar` sentence.`
- `plugins/nexus/agents/architect.md:275` — `confirm the `## Decisions` section exists and is non-silent — a row set, or the explicit `None — no self-resolved calls met the disclosure bar` sentence.`
- `plugins/nexus/agents/critic.md:49` — `` `## Decisions` section present and non-silent ... `None — no self-resolved calls met the disclosure bar` ... is a **MEDIUM** finding ... plans that **predate** the section are exempt ``

### Comparison

- Heading `## Decisions`: consistent where relevant. The template defines it as the actual section heading; architect and critic refer to that exact heading text verbatim.
- Decision-row schema: compatible, not byte-identical. The template says `decision · one-line why · rejected alternative · status (`decided` | `deferred`)`; architect says `decision · why · rejected alternative · status `decided | deferred``. I see no field-name contradiction; the only drift is that architect drops `one-line`, which narrows style less but does not change the schema.
- Explicit empty form: consistent. All three files use the same sentence `None — no self-resolved calls met the disclosure bar`.
- Metric label: consistent where relevant. The architect carries `Decisions taken: {M}` at `architect.md:218`, which is compatible with the plan's binding label `Decisions taken: N` at `plan.md:30`. The template and critic do not define a metric surface.
- Critic severity: consistent. The critic ties this check to `**MEDIUM**` exactly at `critic.md:49`, matching the binding clause in `plan.md:30`.
- Internal contradiction check: no contradiction on heading text, fallback text, metric label, or critic severity. The only compatibility gap I found is the architect done-check's missing explicit predate exemption, called out above as MINOR.
