# Metric layer runbook (C1)

The deterministic layer runs FIRST, executed by an agent running the commands below. Miners receive
the OUTPUT tables and are **forbidden** (stated in every stage prompt) from estimating any metric a
table provides. All tooling is free by contract: `git log`, Code Maat (GPLv3), lizard.

Evidence base for every figure and threshold here:
`docs/kb/research/repo-technical-evaluation-for-refactoring.md` (deep-research, 23/25 claims 3-vote
verified). Figures are cited, not re-derived.

## 0. Tool-availability preflight (run before anything else)

Verify the two external tools are runnable on this machine before the run starts:

```
java -version                          # Code Maat is a JVM jar — needs a JRE
java -jar {path}/code-maat.jar --help  # Code Maat itself resolves
lizard --version                       # pip install lizard
```

Record the result in the run report. Outcomes:

- **Both present** → full metric layer (churn, ownership, coupling, churn×complexity).
- **lizard absent** → the churn×complexity column is **dropped loudly**: the run report states
  `complexity signal DEGRADED: lizard unavailable — churn×complexity hotspots not computed`, and the
  ranking falls back to churn + ownership + coupling. Never a silent zero.
- **Code Maat absent (no JRE / no jar)** → compute revisions / coupling / ownership from the raw
  numstat log with the **git-only fallback** method in Section 3 (the "git-only fallback" paragraph),
  and state the degrade in the run report.

The preflight is a **precondition of the whole run** (plan Step 4): either both tools pass, or the
documented fallback is consciously accepted for this run and recorded in the report. Never proceed as
if a missing tool produced a zero.

**Windows note.** Code Maat expects UNIX (LF) line endings in the log it parses. On Windows, a
literally-followed `git log … > repo.log` in PowerShell/cmd can emit CRLF that Code Maat misreads —
generate the log via **Git Bash** (or otherwise ensure LF endings) before invoking Code Maat. Relevant
whenever the pilot/target repo is Windows-hosted.

## 1. Bot filter (mandatory FIRST step)

Bot commits can dominate churn — 73.9% of hotspot commits in one 91-repo corpus were bot-generated
(research §4). Exclude bot authors BEFORE any churn computation.

1. **List authors:** `git shortlog -sne --all`
2. **Mark the bots** (dependabot, renovate, `[bot]` accounts, autoroll / CI bots) into a per-repo
   config file, e.g. `.mine-verify-repo/bot-authors.txt`. This list is **per-repo** — never carried
   across repos (bot fingerprints differ; the pattern is repo-specific — metadata changes ran 95%
   bot, stepwise refactoring 100% human in the study).
3. **Exclude them** when generating every log below, with a Perl-regex negative lookahead on author:

```
git log --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' ...
```

Extend the alternation with the concrete bot identities found in step 1. The run report **logs how
many commits the filter excluded** (C1 / C6).

## 2. Hotspot log (MSR 2026 method)

The change-frequency signal comes from the documented MSR method — bot-filtered, same author
lookahead as Section 1:

```
git log -M -C --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' \
  --pretty=format:'commit %H %ct' --reverse -p
```

Count modifications per file over the bot-filtered history. This is the modification-count input to
the hotspot filter (Section 6).

## 3. Code Maat metrics

Generate the numstat log Code Maat reads (bot-filtered — same author lookahead as Section 1):

```
git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames \
  --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' > repo.log
```

**On Windows, run this in Git Bash** (or otherwise ensure the redirected file has LF line endings) —
Code Maat parses this log expecting UNIX line endings and can misread a CRLF-terminated file produced
by a native PowerShell/cmd redirect.

Then run each analysis (`-c git2` selects the log format above). The analysis names below are Code
Maat's documented CLI vocabulary (research source [9] — the Code Maat repo); the log-generation
command above is the one verified verbatim against the Code Maat README in the research pass:

```
java -jar code-maat.jar -l repo.log -c git2 -a revisions          # change frequency (churn count)
java -jar code-maat.jar -l repo.log -c git2 -a coupling           # change / temporal coupling
java -jar code-maat.jar -l repo.log -c git2 -a entity-ownership   # minor-contributor ownership
java -jar code-maat.jar -l repo.log -c git2 -a authors            # author / contributor counts
java -jar code-maat.jar -l repo.log -c git2 -a age                # code age
```

**git-only fallback** (Code Maat absent): from the same `repo.log`, compute revisions as the per-file
line count of numstat entries, coupling as files co-occurring in the same commit block, and ownership
as each author's share of a file's changed lines. Weaker but free; state the degrade in the report.

## 4. Complexity (lizard)

```
lizard {path} --csv > complexity.csv    # cyclomatic complexity (CCN) + NLOC per function
```

Aggregate to file level (sum or max CCN per file) to form the churn×complexity product with the
Section 2 modification counts.

## 5. Signals (validated lineage, strongest first)

| Signal | Source | Note |
|--------|--------|------|
| minor-contributor **ownership** | Bird et al. ESEC/FSE 2011 | strongest in strong-ownership repos; **weakens in open source** — degrade if the repo is community-owned |
| **relative churn** | Nagappan & Ball ICSE 2005 | normalized by size + temporal extent; **absolute churn is a poor predictor** — always normalize |
| **churn×complexity** | churn (Section 2/3) × lizard CCN (Section 4) | the hotspot core; dropped if lizard is absent |
| **change coupling** | Kirbas et al. 2017 | real but **secondary** — modest, variable correlation |

## 6. Hotspot filter

A file / area is a hotspot when **both** hold:

- modification count **> μ+3σ** (mean + 3 standard deviations of the repo's per-file change counts),
  **AND**
- **> 1 change/month** of project lifetime.

Either condition alone over-fires (research §4). **Calibrate μ and σ within-repo on every run** —
never carry thresholds across repos (cross-project model transfer is poor; Zimmermann et al. 2009).

## 7. Degrade honestly (report rule)

On a repo where a signal is uninformative — a single-maintainer repo carries no ownership signal, a
community repo weakens it, a missing tool drops complexity — the run report SAYS SO and the ranking
**drops that column**. Never a silent zero. Every degraded signal is a named line in the run report
(C6): the hotspot ranking must be honest about which signals it did and did not use.
