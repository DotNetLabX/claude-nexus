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
