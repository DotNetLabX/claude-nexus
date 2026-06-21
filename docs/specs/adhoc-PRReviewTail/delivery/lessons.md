# Lessons — adhoc-PRReviewTail

## Architect Lessons

- **A shipped prerequisite dissolves its blocker, but its facts go stale — re-ground before planning.** The
  tech-spec (2026-06-20) asserted "team-lead has no push step, no `autoPush`/`defaultBranch`." The push gate
  shipped overnight (1.16.2, `62e9d78`), so every one of those facts flipped. Re-reading the *actual* shipped
  surface (the `## Push gate` subsection, the 4b one-read capture, the canonical `## Branch Pre-Flight`
  rule) before planning is what let the tail attach correctly — to the real closure point, reusing the real
  `defaultBranch` resolution — instead of to the plan-era assumptions. The push gate even left an explicit
  seam ("merge-to-main is NOT part of closure… deferred to the PR-tail feature"); the tail slots into it.

- **Code-grounded critic earned its keep on a shared-source pass — but its catch was in the *justification*,
  not the steps.** The Mode-2 critic verified all 18 ACs and every live-source claim TRUE, and the
  implementation steps were clean. Its two MEDIUM findings were both in the architect-owned *Graduation*
  prose: (H1) I mis-cited ADR-34 as precedent for folding the README edit into the feature commit — ADR-34
  was actually a *separate* `docs` commit (`49a864f`); the precedent is genuinely mixed. (M1) The ADR
  register has **two** surfaces — an index line (`README.md:45–52`) and a `## ADR-N` body — and the
  tech-spec drafts only the body, so "extract verbatim" would have silently left the new ADRs out of the
  index. Lesson: when a pass edits a structured doc with multiple surfaces (index + body), "verbatim
  extraction" is incomplete by construction — name every surface in the plan.

- **`--comment` is the only PR-review event a PR author may submit on their own PR.** GitHub rejects
  `--approve`/`--request-changes` from the PR author, so projecting `review.md` must use `gh pr review
  --comment` with the verdict carried in the body. The research file listed the three events but not the
  self-PR restriction — the plan had to supply it. Worth a `Reconfirm trigger` note on the research entry.

- **A pipeline-role boundary: the tail can only *suggest* `/code-review ultra`, never run it** (user-triggered
  + billed). The plan states this explicitly so the developer doesn't write "team-lead runs /code-review."

- **Done-check on a shared-source prose pass scored cleanly because the plan front-loaded grep anchors.**
  Every step carried a grep-and-confirm acceptance line (Step 1 even gained one from the critic's advisory),
  so the done-check was a deterministic token-presence sweep over live source — not a read-and-judge of
  prose. Confirmed Steps 1–6 by grep on the two source files + the generated command, Step 7 by reading
  `plugin.json` version + the CHANGELOG entry + the scoped `release-plugin` log line. The two `selfcheck`
  sub-FAILs were correctly pre-classified as git-HEAD false-positives in both the plan and implementation.md,
  so they resolved in one line instead of an investigation. Token-scoping the log to `agent: developer` +
  `token: developer:implement` for the implement *session* (not by timestamp) is what disambiguated Step 7's
  invocation from the several other `release-plugin` entries that day across sibling sessions.

## Developer Lessons

- **Phase-1 analysis: every load-bearing live-source anchor in the plan verified TRUE.** Re-checked all
  six the critic cited and they hold: 4b one-read capture (`team-lead.md:205`), Push-gate subsection +
  "merge-to-main NOT at closure" note (`:355–359`), Unattended-Mode list with the `Branch guard (#1)`
  bullet (`:411`), the `## Branch Pre-Flight & Default-Branch Resolution` rule (`agents-workflow.md:34`,
  self-described "git-only and host-agnostic — no gh/PR coupling", so the host-adapter section is its
  clean companion), `review-format` projection shape (`## Step 2 — Code Review` + `## Verdict: APPROVED |
  REQUEST CHANGES | COMMENT`, SKILL.md:111/116), and `guard.js:138–144` blocking `git push` but not `gh`
  (so the prose-only hardened deferral is honest). Baseline `selfcheck.mjs` = 4/4 PASS, so any post-edit
  failure is attributable to this change, not pre-existing.

- **Plan Testing-Strategy cites the golden test at the wrong path** — `tests/lint/attended-unchanged.golden.test.mjs`;
  the file actually lives at `tests/unit/attended-unchanged.golden.test.mjs`. Non-blocking (it's a
  verification *reference*, not a numbered step, and the plan's point — the test exercises hook scripts +
  `hooks.json`, not agent/rule markdown, so it's an unaffected negative control — still holds). Noted so
  the reviewer doesn't re-investigate a "missing" test.

- **Phase-2 implementation: the two `selfcheck` FAILs are exactly the predicted pre-commit artifacts —
  do NOT bounce.** Post-edit `selfcheck.mjs` = 2/4: `tests (lint+unit)` PASS and `bump-plugin --check`
  PASS (the gates that validate the edits), but `gen-commands drift` FAIL (git-HEAD-based — Step 6 ran the
  regen, but it differs from HEAD until the team-lead commits; the push-gate lesson + MEMORY codify this)
  and `gen-omni --check` FAIL (omni twin drifted because plugin source changed — team-lead/owner
  follow-through per CLAUDE.md, explicitly out of developer scope; ADR-18). Both resolve at the team-lead
  commit / omni sync. The real additivity gate (lint+unit, 233/233) is green and the golden negative-control
  (5/5) confirms no hook surface moved — those are the developer's pass/fail signal, not selfcheck's 2/4.

- **ADR-30 additive discipline on a *replace-the-line* edit reads as a `±` diff pair, and that's correct.**
  Step 2 extends the 4b bullet by replacing the one line — the diff shows the old line removed + the new
  line added. The byte-unchanged guarantee is about the *enclosing structure*, not zero diff on the edited
  line: I verified the existing `defaultBranch`/`autoPush` capture and the "Same posture" sentence survive
  verbatim *inside* the new line, and that the genuinely-untouched anchors (the `**Push gate**` subsection +
  its "merge-to-main not at closure" bullet) produce **no** diff line at all. A `git diff HEAD | grep` for
  the protected tokens is the cheap confirmation that the *protected* prose didn't move while the *target*
  line legitimately changed.

## Reviewer Lessons

- **Front-loaded grep anchors make prose-pass reviews deterministic.** When every plan step carries explicit grep tokens as its acceptance criteria, the review becomes a mechanical token-sweep rather than read-and-judge prose evaluation. This pass verified all 7 steps in under one read per file. The plan's design choice to front-load grep anchors (including one the critic added during plan review) paid direct dividends in review speed and confidence.

- **Pre-classified false-positives save a review cycle.** The carry-over table in implementation.md correctly pre-classified both `selfcheck` FAILs as expected pre-commit artifacts. Without that pre-classification, a reviewer might flag them as HIGH and trigger a wasted fix cycle. The pattern: document known false-positives explicitly in the carry-over table, with evidence, so the reviewer can confirm rather than investigate.

- **For agent-doc passes, "fresh build evidence" means the test suite — not the agent prose.** The `attended-unchanged.golden.test.mjs` golden test is the correct negative-control evidence for prose-only passes: it proves no hook surface moved, which is the relevant regression vector. Running it fresh in this session (5/5 PASS, confirmed) gave genuine evidence without requiring live `gh` calls that v1 deliberately defers.
