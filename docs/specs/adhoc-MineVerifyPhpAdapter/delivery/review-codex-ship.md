# Codex Ship Review — `nexus-php`

## Findings

1. `LOW` — `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/implementation.md:278`
   The Steps 8-9 verification transcript records `node skill-lint.mjs plugins/nexus-php/.../mine-verify-cover-php -> OK`, but there is no repo-root `skill-lint.mjs`. The only in-tree script is `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs`. Rerunning the documented command verbatim fails with `MODULE_NOT_FOUND`, so this verification step is not reproducible as written.

2. `LOW` — `scripts/gen-omni.mjs:156`
   The success banner is stale after the PHP wiring change. The script now mirrors `omni-flutter`, `omni-cpp`, and `omni-php` too, but the final log line still says `plugins: omni, omni-dotnet   (omni-net removed)`. Generation behavior is correct; the post-run operator signal is not.

## Verdict

`GO`

I did not find a blocking correctness issue in the shipped `nexus-php` surface.

## Cross-check Notes

- `git diff --name-only HEAD` confirmed the tracked ship delta, and `git status --short` confirmed that `plugins/nexus-php/` is present as untracked new content rather than missing from the review scope.
- `plugins/nexus-php/.claude-plugin/plugin.json` is `0.1.0` with `dependencies: ["nexus"]`; `plugins/nexus/.claude-plugin/plugin.json` is bumped to `1.25.1`. Both pass `claude plugin validate --strict`.
- The critical `mine-verify-cover-php` SKILL surface matches the live sources of truth I checked:
  - `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/probe-report.md`
  - `D:/omnishelf/fmcg_platform/docs/specs/adhoc-MineVerifyPhpAdapter/delivery/mvc-report.md`
  - `harness/cover-php.workflow.js`
- In particular, the shipped SKILL uses the probe-observed Infection map, including `killedByStaticAnalysis -> Killed`, `syntaxErrors -> CompileError`, and the `total - ignored - skipped` anti-fake-green cross-check; I found no drift in the command/version/path/JSON-key surface the ship depends on.
- I mechanically compared the PHP gate-battery block against `harness/cover.workflow.js`. Outside the sanctioned PHP disable-regex constant/comment and its single `charPin` reference, the body is identical.
- I could not independently rerun the Node unit files in this sandbox because `node --test ...` fails here with `spawn EPERM`, so the previously recorded green test counts remain unconfirmed in this environment.
