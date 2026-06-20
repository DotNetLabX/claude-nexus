# Lessons — adhoc-DistillPrompt

## Architect Lessons

- **A handed input path that doesn't exist is a STOP-and-ask, not an invent-scope.** The task pointed at
  `docs/plugin-feedback/nexus-distill-prompt-skill-2026-06-19.md`, which didn't exist and was defined
  nowhere (backlog, proposals, transcripts all checked). Surfaced it and confirmed scope in two
  `AskUserQuestion` rounds (what it is → the transformation + invoker) before writing a line. Inventing a
  spec from a filename would have been the failure.

- **New shipped skill in the dev repo → ADR-1 carve-out, not the feedback channel.** `improve-skills`
  routes shipped-skill *fixes* to the portable feedback file, but its own SKILL.md (line 21) carves out
  the dev repo: author shipped skills **directly** in `plugins/nexus/skills/`. The born-compliant gate
  (skill-lint exit 0, ADR-23) + `selfcheck.mjs` is the done-condition; no spec, no command file, no
  registration (platform auto-discovers `skills/*/SKILL.md`).

- **AP5 applies to what a gate *enforces*, not just whether it exists.** The code-grounded critic caught
  me attributing the 40–1024 description bound to `frontmatter.test.mjs` as a hard-fail — it's a
  `skill-lint` **warning** (W1/W2); the test's only hard floor is ≥20. Lesson: when an acceptance line
  names a test/lint as the enforcer of a bound, **read the actual assertion** — distinguish a lint
  WARNING (exit 0) from a test ERROR (exit 1). Don't infer the threshold from the message the lint
  prints.

- **Code-grounded critic earned its keep on a plugin-source plan.** Every finding (HIGH + 2 MED + LOW)
  was something only file-reading surfaces — exactly the shared/external-artifact mandate. A doc-only
  pass would have green-lit the misattribution. Carry-forward: the **implementation Step-2 review must
  also be code-grounded** (read the real SKILL.md, run skill-lint/selfcheck), recorded in the plan.

- **"Use the whole harness" is a standing rule, not a per-plan reminder.** Owner's point (2026-06-20): a
  mature plugin's new-skill authoring should *always* run the full harness — domain-reference grounding +
  `proven-patterns` + the `evaluate-skill` job-fitness pass — not just form-lint. The fix is to wire it
  into `improve-skills`' New-Skill recipe (the cheapest non-decaying locus, allocation principle) so every
  future skill inherits it, plus a one-line ADR-23 amendment that authoring ends in the evaluate-skill
  *judgment* pass on top of the lint *form* gate. Don't hand-patch each plan — promote the convention.

- **(Done-check) For a shipped-skill plan, the done-check itself must be code-grounded — re-run the gates,
  don't trust the implementation.md report.** Same shared/external-artifact mandate the plan invoked for
  Step 2. I re-ran `skill-lint` (exit 0) and `selfcheck` (4/4 PASS) fresh rather than accepting the
  written claim, read the actual SKILL.md to confirm the AP3 consolidations and the lossless/never-invent
  rules are physically present, and **scoped the skill-invocations log to this run** (session + agent +
  `developer:implement` token) to verify every non-`None` mapping fired — the 6th `improve-skills` entry
  (07:12) is what corroborates the owner-directed active pass actually invoked, not just narrated. The
  log is the authoritative source; the `## Skills Used` table is the cross-check, and here they agreed.

- **(Done-check) An owner-directed extra pass mid-implementation is `Implemented`, not a deviation —
  provided it has both a log entry and a visible artifact.** Item B (the active improve-skills pass) was
  not in the 4-step plan, but it was an owner directive folded into the same release; the test for
  disposition is whether it left durable, verifiable evidence (log invocation + the consolidated SKILL.md
  + re-run green gates), which it did. A genuine `Deviated` is a *changed approach to a planned step*
  (Item A, the wiring-test fix); an *additional owner-sanctioned task* with evidence is just Implemented.

## Developer Lessons
- **Phase-1 analyze of this plan was a verify-everything-cheap pass.** Every named path/script/flag/key-set
  was independently confirmed against live source: the closed `SKILL_KEYS` set + ≥20 description floor
  (`frontmatter.test.mjs:13,43`), `skill-lint` E2/E7/W1-W2 semantics (`skill-lint.mjs:41-83` — W1/W2 are
  warnings, exit 0, confirming HIGH-1), `bump-plugin --minor` support (`bump-plugin.mjs:40`), `selfcheck`'s
  4 gating checks (`selfcheck.mjs:38-72`), and the exact `{name, description, user-invocable: true,
  disable-model-invocation: true}` frontmatter combo in `create-service-claude-md/SKILL.md` (the plan's
  "proven ×3" claim). A plan this well-grounded produced zero analyze-phase questions.
- **gen-omni writes to a SEPARATE repo, so it never dirties the tree selfcheck guards.** `gen-omni.mjs:30`
  targets `../omni` (a sibling working tree). selfcheck's `git diff`/`gen-omni --check` run against the
  *nexus* tree only, and `gen-omni --check` diffs in-memory regen vs the omni tree — so the plan's ordering
  (real `gen-omni` in Step 3 → selfcheck in Step 4 on a clean nexus tree) is internally consistent. The
  twin's commit is the owner's follow-up in `../omni`, not a developer step in this repo.
- **(Phase 2) A skill's own `/nexus:{name}` description string trips the agent-reference wiring lint.**
  `tests/lint/wiring.test.mjs` resolved every `nexus:X` mention to a shipped *agent* only — a pre-skill-
  invocation assumption. A new `user-invocable` skill that documents its own `/nexus:{name}` invocation in
  the description (the correct, load-bearing form) fails it. The plan's Step-4 acceptance named
  `frontmatter.test.mjs` + selfcheck but didn't foresee that `selfcheck` runs *all* `tests/lint/*.test.mjs`
  including this one. Root-cause fix: widen the resolver to agent-OR-skill (skill name = folder name, same
  derivation `frontmatter.test.mjs` uses). This is a latent gap that bites the **first** user-invocable
  skill whose name has no matching agent — `nexus:fleet` only escaped because it lives in a `.mjs` the
  `.md`-only `walk` never scanned. Carry-forward below as an improvement proposal.
- **(Phase 2) `claude plugin validate --strict` is stricter than the repo's own CI gates — and is NOT the
  plan's terminal gate.** It threw YAML-parse errors on 4 pre-existing skills (em-dash/colon-bearing
  descriptions) while `frontmatter.test.mjs` + `selfcheck` (the authoritative gates) accept them. When a
  release-skill procedure step (`claude plugin validate`) disagrees with the plan's named gate, the plan's
  gate governs the acceptance — but document the divergence so the reviewer doesn't chase it. Attribution
  was confirmed with read-only git (`git cat-file -e HEAD:…`, `git status`), never a checkout/stash.
- **(Phase 2, owner-directed) An "active improve-skills pass" means hunt AP-violations against the
  catalog, not re-run evaluate-skill.** A consolidating pass that defaults to "no change" is the easy
  failure mode (the prior Step-2 pass did exactly that, legitimately — its only finding was a keep-as-is
  LOW). To make a pass *genuine*, anchor it to a specific `proven-patterns` axis and sweep for it: I keyed
  on **AP3 (one fact, one owner)** and found three concrete single-owner violations (the same fact stated
  in full in 2+ places). The tell for an AP3 fix: a rule's *full statement* (not a thesis pointer or a
  scope echo) appears in more than one section — pick the structurally-correct owner, demote the rest to
  references. A consolidating pass must come out **shorter or flat**, never additive — if a "fix" adds
  prose, it's patching, not consolidating (AP2/AP3 spirit).
- **(Phase 2) Editing a shipped SKILL.md re-triggers the twin-sync gate even with no version bump.**
  `gen-omni --check` is part of `selfcheck`, and the twin mirrors `plugins/**` — so any SKILL.md body edit
  (even one riding an existing uncommitted bump) must be followed by `node scripts/gen-omni.mjs` or
  selfcheck's `gen-omni --check` fails. The bump itself does NOT need re-running: `bump-plugin --check`
  passes on the already-present 1.15.0 entry. Sequence for a no-bump SKILL.md edit: edit → gen-omni →
  skill-lint → selfcheck.

## Improvement Proposals
- **P-1 (promote): new-skill authoring runs the full harness by default.** Amend `improve-skills` "For New
  Skills" to chain `evaluate-skill` (job-fitness) + a domain-reference grounding step after authoring, and
  amend ADR-23 to record that the deterministic *form* gate (lint) is now paired with a standard
  *judgment* gate (evaluate-skill) for new skills. Routed as its own scoped pass (`adhoc-SkillAuthoringHarness`).
- *(The AP5 "enforces vs exists" nuance is already covered by create-implementation-plan's mechanism-aware
  acceptance rule — confirming data point, not a new gap.)*

### Improvement Proposal (wiring lint did not know skills are invocable)
**Target:** `tests/lint/wiring.test.mjs` (applied this round) + optionally `create-implementation-plan`'s
acceptance-gate guidance.
**Change:** Applied — the `/nexus:X` resolver now accepts a shipped agent **or** a shipped skill. Two
follow-on candidates a reviewer/architect may weigh: (1) extend the wiring `walk` to also scan skill
`scripts/*.mjs` (would have caught/validated `nexus:fleet`); (2) add a one-line note to
`create-implementation-plan` that a new `user-invocable` skill's Step-4 acceptance should list
`selfcheck` *whole* (it runs all `tests/lint/*`), not just `frontmatter.test.mjs` — so the next plan
foresees the full lint surface.
**Evidence:** adhoc-DistillPrompt Step 4 — `selfcheck` 3/4→4/4 only after the resolver fix; the failure
was invisible to the plan because it named a narrower gate than `selfcheck` actually runs.
**Priority:** medium (bites every future user-invocable skill whose name has no matching agent).

## Reviewer Lessons

- **For a prose-recipe skill, "fresh evidence" is code-grounded execution, not re-reading the implementation.md.** The deliverable is a SKILL.md, not runnable code — but the gates are still executable (`skill-lint`, `selfcheck`, `node --test`). Running all three fresh (rather than trusting the implementation's claims) is the correct read-discipline for this artifact type: the outputs are machine-checkable and the developer can misreport them.
- **Carry-over findings need two determinations: attribution and scope.** For both carry-overs here, the review required (a) confirming the 4 pre-existing skills are genuinely unmodified this round (git status evidence) and (b) confirming the `nexus:fleet .mjs` reference is structurally unreachable by the existing `walk` (code-read). A bare "out of scope" without evidence is not a disposition.
- **The wiring resolver fix pattern (agent-or-skill) is the correct generalization.** The platform's auto-discovery means any `user-invocable` skill whose name does not match an agent would have failed the prior resolver. The fix is minimal and precise: it adds `skills.has(name)` as an alternative without changing the agent path. Scope is right: test file, not shipped plugin source, so no bump needed.
