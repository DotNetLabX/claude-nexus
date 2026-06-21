# gh PR operations + AI-review projection capabilities

## What does `gh` support for opening a PR, posting an AI review, and merging — and can review.md findings be posted as inline PR comments?

**Verdict:** `gh pr create|review|merge` cover open/review/merge, but `gh pr review` posts only a **single overall review body** (approve/request-changes/comment) — there is **no native per-line inline comment** in `gh`; inline comments require `gh api POST /repos/{o}/{r}/pulls/{n}/reviews` with a `comments[]` array. The harness `/code-review --comment` already posts inline comments but **re-runs its own review** and needs an **existing** PR + GitHub remote + `gh` authed.
**Evidence tier:** read-docs
**As-of:** 2026-06-20
**Validity scope:** GitHub via `gh` CLI v2.x; the GitHub REST API `2022-11-28`; the bundled Claude Code `/code-review` skill as of CLI v2.1.147+
**Status:** current
**Reconfirm trigger:** a `gh` major release changing `pr review`/`pr merge` flags, GitHub adding native inline-comment support to `gh pr comment` (issue cli/cli#12396), or a Claude Code release changing `/code-review` flags
**Corroboration:** official `gh` manual (3 pages) + the GitHub REST API + the cli/cli issue tracker (#12396, #13358) and community discussion #143197 — multiple independent sources for the inline-comment limitation

## Verdict

- `gh` is sufficient to open a PR, post the existing review as a PR-level review, and merge — but **inline (file:line) comments are not a native `gh pr` capability**; they need the REST reviews API. The cheapest projection of the Nexus reviewer's `review.md` is therefore a **single PR review body**, not per-line comments.

## Finding

- `gh pr create` supports `--base`, `--head`, `--draft`, `--fill` (use commit info for title/body), `--title`, `--body`, `--body-file` (`-` = stdin), `--web`, `--reviewer`, `--label`; `--head` defaults to the **current branch** and supplying it skips the fork/push prompt [1].
- If the current branch is not yet pushed, `gh pr create` interactively prompts to push (or fork) — so a clean PR open assumes the branch was already pushed [1].
- `gh pr review` supports `--approve`/`-a`, `--request-changes`/`-r`, `--comment`/`-c`, with `--body`/`-b` or `--body-file`/`-F`; it posts a **single overall review body only — no per-line/inline/per-file diff comments** [2].
- `gh pr merge` supports `--merge`/`--squash`/`--rebase`, `--auto` (merge once required checks pass / via merge queue), `--delete-branch`, `--admin` (bypass requirements), `--subject`/`--body`; it defaults to the current branch's PR [3].
- Native inline PR review comments are an **open feature request** for `gh pr comment` (cli/cli#12396); the underlying REST API already supports them — it is a CLI-UX gap, not an API gap [4].
- The reliable way to post inline comments via `gh` today is `gh api --method POST /repos/{owner}/{repo}/pulls/{n}/reviews` with a JSON `comments[]` array (`{path, line, side, body}`) plus `commit_id` (HEAD SHA) and `event`; the direct `POST /pulls/{n}/comments` route is reported to return 422 in some cases [4][5].
- The Nexus reviewer's `review.md` finding block already carries `**File:** path:line` + `### [SEVERITY] title` for every CRITICAL/HIGH, so a CRITICAL/HIGH finding maps 1:1 onto a `comments[]` entry; MEDIUM/LOW and `## Open Questions` may omit `file:line` and would have to be posted in the review body, not inline [no source found].
- The harness `/code-review` (bundled CLI skill, v2.1.147+) reports bugs at an effort level (`low|medium|high|max|ultra`); `--comment` posts findings as **inline GitHub PR comments** via `gh`; it **comments on an existing PR, does not create one**; `ultra` runs a cloud multi-agent review requiring a claude.ai account; `--fix` applies findings to the working tree [no source found].

## Fix

- Default Nexus PR-tail projection = post `review.md` (Step-2 section) as **one PR review body** via `gh pr review --comment --body-file <file>` (or `gh pr comment`) — no `commit_id`/line-mapping machinery, works with vanilla `gh` [2].
- Reserve true inline comments for the **opt-in independent pass**: hand off to `/code-review --comment` / `/code-review ultra` (it owns the inline posting + a fresh review), rather than re-implementing the `gh api reviews` projection in v1 [4].
- Open the PR with `gh pr create --base <defaultBranch> --head <slug-branch> --fill` (+ `--draft` opt-in); requires the branch already pushed (the push gate's job) [1].

## Alternatives

- Project `review.md` to **inline** comments ourselves via `gh api .../reviews` with `comments[]` — richer, but adds commit_id resolution + file:line mapping + the MEDIUM/LOW-without-line edge; deferred past v1 [4][5].
- Third-party `gh` extension `agynio/gh-pr-review` adds inline support — rejected: an external dependency outside the thin gh-only seam [4].

## Caveat

- The current-branch push prompt means the tail is only clean if the branch is already on the remote — it depends on the (planned, not-yet-shipped) push gate [1].
- `/code-review ultra` needs a **claude.ai account** (not just an API key), so it is not always available in CI/unattended contexts [no source found].
- `gh` is **not** blocked by the Nexus `guard.js` hardened mode (which blocks `git push`/fetch/curl only) — `gh pr create/merge` pass through, so honoring hardened mode for the tail is a design decision, not an existing guarantee [no source found].

## Fallback

- If `gh` is absent/unauthed or the remote is not GitHub, the tail is unavailable → the pipeline closes at push exactly as today; no inline/PR step is attempted.

## Sources

[1] https://cli.github.com/manual/gh_pr_create
[2] https://cli.github.com/manual/gh_pr_review
[3] https://cli.github.com/manual/gh_pr_merge
[4] https://github.com/cli/cli/issues/12396
[5] https://github.com/orgs/community/discussions/143197

## Recommendation

- v1: default = project `review.md` as one PR review body (gh-only, no API); opt-in = `/code-review ultra` for an independent inline pass. If a future caller needs native inline projection of `review.md`, the next probe is the `gh api .../reviews` `comments[]` payload (commit_id + per-finding path/line).
