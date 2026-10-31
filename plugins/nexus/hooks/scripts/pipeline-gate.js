#!/usr/bin/env node
/**
 * Nexus PreToolUse pipeline gate (SYNCHRONOUS — can block).
 *
 * Backstops the pipeline invariants that prose instructions alone failed to enforce
 * (a faithful agent can still violate them and believe it complied):
 *
 *   1) Two-phase spawn. While .claude/.pipeline-state ends in ":analyze", the active
 *      agent is in its analyze-and-stop phase. Writing plan.md (architect) or application
 *      source (developer) then means the analyze checkpoint was skipped — the single-spawn
 *      collapse. Blocked.
 *   2) Verdict integrity. A review.md written with an APPROVED verdict while it still lists
 *      an unresolved CRITICAL or HIGH finding is an invalid verdict. Blocked.
 *   4) Full-suite evidence (F81, ADR-96). A summary.md's existence means "the pipeline completed".
 *      When the repo DECLARED a full suite (.claude/verify.json → roles.full), writing that file
 *      with no passing `role:"full"` record in the audit trail means the close gate's suite never
 *      ran. Blocked. Passing is lib/run-verdict.js's rule: a pass, or a run whose only failures are
 *      timed-out tests the change did not touch. The record must name the ROUND KEY — the slug taken from the summary.md path
 *      being written — as well as matching the round's token or session; an unsigned record
 *      discharges nothing. Numbered 4 because 3 is retired below and is never reused. Whatever the
 *      gear, a stale or red latest record can still discharge it on the close evidence
 *      (lib/gear-close.js): each failure re-run green by name, every later change covered by a green
 *      run. The deny names what is not covered; a record that cannot stand as evidence (cut, crashed,
 *      or with no file hashes) keeps its own cause, and under a gear names the evidence's. Before all of that,
 *      the newest slug-stamped complete record in this tree at its current content is judged, whatever its
 *      slug or session: content makes a record valid, so it discharges when it counts as passing, and
 *      another slug's red denies (`failing`) — this slug's later runs cannot repair it.
 *   5) Lessons evidence (F99, ADR-100 K5). "Write lessons before you close" was the one affirmative
 *      duty the always-on prohibitions envelope carried, and the W4 subagent probes measured it at
 *      0.000 — the prose was carrying nothing. The duty leaves the envelope and becomes observed:
 *      lessons-tracker.js records every lessons write, and a summary.md write with no record for
 *      this round is Blocked. BOUNDS, stated so the blast radius is not guessed at: only summary.md,
 *      only foreground, and — unlike (4) — **no opt-in**. (5) fires in every consuming repo because
 *      the owner ruled the duty gate-observed at every close, and the remedy is one write. Two
 *      further facts the deny reason carries: the round token changes at every phase transition, so
 *      by close the match is usually by session; and the record is written by an `async` PostToolUse
 *      hook, so a summary.md write issued in the same turn as the lessons write can race it — the
 *      deny is self-correcting on retry.
 *   6) Critic-record measurability (F139, ADR-106). A critic round whose record `derive-ruler.mjs
 *      metrics` cannot read is a round nobody can ever measure, and five days of ADR-106 measurement
 *      found exactly that: five of fifteen records unreadable, the tool never run, the corpus never
 *      grown. So a summary.md write is Blocked when the slug's delivery folder holds a CANONICAL
 *      `review-critic.md` that has adopted the round layout AND `metrics --slug` then fails on it.
 *      Three narrowings, each of them a close this check must NOT break: a feature that chose
 *      self-review has no such file; a feature whose only record is a sanctioned sibling
 *      (`review-critic-codex.md`) has one the calibration toolchain cannot address at all, which is
 *      a gap to close there rather than a close to break here; and a LEGACY record, written before
 *      the layout existed, is a historical fact rather than a defect — this invariant is about the
 *      NEXT record. The deny quotes the tool's own line, which already names the file, the line and
 *      the cause.
 *
 *      (6) is the FIRST check here to spawn a child process, and it needs NO fail-open exception:
 *      its deny is a POSITIVE signal (the tool read the record and refused it), so it denies only on
 *      `fail()`'s signature — THREE factors: exit 1, a line reading `derive-ruler: {message}`, and
 *      that line naming this record — and allows on every other shape. Each factor is load-bearing:
 *      `usage()` prints the same prefix but exits 2; `node {missing script}` exits 1 with a
 *      MODULE_NOT_FOUND stack trace; and a corrupt calibration corpus is read before this mode runs
 *      and reported with the same prefix and exit code, about a different file entirely. Drop any
 *      one and the check denies something that is itself failing rather than the record, handing an
 *      operator a remediation they cannot act on. And the narrowness itself is load-bearing:
 *      `execFileSync` throws on ANY non-zero
 *      exit, so the intended deny and a genuine spawn failure arrive in the same `catch`, and a bare
 *      `try { … } catch { allow }` would ship this gate as a permanent no-op — the exact "looked
 *      fine, measured nothing" failure it exists to end.
 *   7) Unruled registry rows (F161, ADR-115). Every `pending-triage` row in a touched unit's
 *      business-rule registry is ruled before a feature closes — the close procedure's rule, and this
 *      is its backstop. A summary.md write is Blocked while a registry under docs/business-rules/
 *      that git reports modified or untracked, AND whose text names this close's slug (the
 *      promotion's and each ruling's changelog entry name it, after the entry's date), holds a row
 *      whose `status:` field is `pending-triage` and that carries no `ruling:` field. Both keys are
 *      read only where the registry grammar puts a field — at a continuation line's start, a
 *      sub-bullet's or not, or after a ` · ` separator, never past an `anchor:` or a `why:` — so a key mentioned
 *      in a note, a free-text value or the rule sentence is prose: it neither discharges a row nor
 *      marks one. Rows open on the prefix the header's `Row-prefix:` declares (`BR` by default); a
 *      top-level bullet that opens none is not a row, and it ends the row above.
 *      The check is KEY-PRESENCE: the four ruling words are the close procedure's vocabulary, and
 *      parsing them here would give the grammar a second home. So a `deferred` ruling from an earlier
 *      close satisfies it; the close procedure re-rules that row, and this gate reads no dates.
 *      BOUNDS, so the blast radius is not guessed at: it sees only registries this close wrote — a
 *      touched unit's registry the close did not write is the close procedure's to cover; a dirty
 *      registry that does not name the slug is another session's work and allows; a unit with an
 *      `-attestation.md` sibling is a code-mined, attested set whose triage is the merge ceremony's,
 *      and allows. The git read runs in (4)'s tree — the registries are evidence the round wrote in
 *      its own working tree — bounded by a timeout, and every uncertainty allows (no git, not a
 *      repository, a timeout, an unreadable file, no `## Rules` section): the deny needs a positively
 *      parsed unruled row, never a bare `catch`. Two known allows follow from the field grammar above:
 *      a field bullet written at column 0 ends its row (every shipped example indents its fields), and
 *      a key glued to a `·` is not read — so a `status:` in either place is never seen and the row
 *      allows, while a `ruling:` there leaves the deny standing until it is re-written; the close
 *      procedure is the rule, this gate its backstop. Flat slugs only, as in (4) and (5). The deny
 *      names each file and row id and the tree it read.
 *   8) Fix-list follow-up (F221, ADR-144). A `## Step 2 — Fix list, cycle {N}` section whose follow-up
 *      line reads `due` while its rows hold no CRITICAL/HIGH (a contested range reaching HIGH counts),
 *      no missing or failed step and no skill slip is Blocked: such a round is never re-read
 *      (review-format § Fix list, ADR-131). Unlike (2), an edit is judged on the file as it will be
 *      after the edit, and only a section the write adds or changes is judged — a committed file with
 *      a past violation stays editable. The deny needs a positive parse: a follow-up line, at least one
 *      row, and every list or table line above the follow-up line read as a leveled row (a `[LEVEL]`
 *      bracket, or a table cell holding a bare level), a step or a slip; any other shape, a missing file or an absent `old_string` allows. Hand-up lists are
 *      outside it.
 *   9) Summary mode line (ADR-148). Every summary.md names the lane that built it, so a later
 *      reader can tell a team run from the architect's lane, and the level and definition it ran on. A
 *      `Write` of a docs/specs/{slug}/delivery/summary.md (a nested issue's included) whose content
 *      holds no line beginning `Mode: ` is Blocked; the deny names the summary-format grammar. Only a
 *      `Write` is judged: an `Edit` or `MultiEdit` carries part of the file, and every close writes the
 *      summary whole. It runs last among the summary invariants — (9) after (4)–(7) — so a write
 *      another one refuses keeps that refusal. Foreground writers only, as (4)–(7).
 *  10) Spec sources (ADR-161). Every business rule of a spec names its source, and a rule a writer or a
 *      reviewer added keeps the spec from Ready until the owner keeps it. A `Write`, `Edit` or
 *      `MultiEdit` of a docs/specs/{slug}/definition/spec.md (a nested issue's included) is Blocked
 *      when the file after the write has a status line reading Ready (`Status:` or `**Status:**` at a
 *      line's start, its value starting `Ready`, a suffix allowed), the file before it did not (a
 *      missing file reads not Ready), and lib/spec-sources.js reports a rule `missing` or `pending`.
 *      The base is the committed version (`git show HEAD:`), read with (7)'s bound: where it reads
 *      Ready or Done, only rules new or changed against it are judged, so an approved spec's old
 *      rules are never re-judged; a path HEAD does not hold has no base and every rule is judged. The
 *      deny names each rule id and its fix. Fail-open edges: an unreadable file, an `Edit` whose
 *      `old_string` is absent, a git read that cannot answer (no git, not a repository, no commit, a
 *      timeout, a committed path it cannot read) and a library error all allow.
 *      REACH: foreground writers only, as (4)–(9) — a spawned PO or architect is covered by the
 *      same check, spec-sources.js, which the team lead runs before it spawns the architect for
 *      the plan. Only spec.md: an epic, a bug or a tech-spec is not judged here.
 *
 * REMOVED — invariant (3), state-file integrity (blocking a pipeline subagent's write to
 * .claude/.pipeline-state): the only callers it could ATTRIBUTE (data.agent_id is present
 * solely on spawned agents' tool calls) are background subagents, whose PreToolUse deny the platform
 * drops (ADR-13). There was no caller both attributable AND blockable — unreachable code.
 * State-file ownership ("team lead is the sole writer") is enforced by ADR-18 agent hard rules
 * + the team lead's verify-and-intervene, not by this gate.
 *
 * Scope honesty: this gate is effective for FOREGROUND writers only — the main session and
 * persona-command runs. Background pipeline subagents are governed by their own hard-stop
 * rules + team-lead checkpoints (ADR-13..15), not by this gate.
 *
 * Deliberate fail-open edges (do not "fix" without reading ADR-7's posture):
 *   - For Edit, only `new_string` is inspected — an Edit that flips a verdict line to APPROVED
 *     without touching the findings table is not caught (conservative by design).
 *   - Path matches require a directory separator before the filename (`/plan.md`, `/review.md`) —
 *     a bare relative filename in the project root is not matched.
 *   - The verdict scan anchors POSITIVELY on a finding HEADING (`### [SEVERITY] …`, the review-format
 *     shape) — a CRITICAL/HIGH written outside that heading shape (e.g. severity-last, or in a plain
 *     paragraph) is not read as a finding. This is the deliberate inversion of the old token-blocklist
 *     (which kept false-blocking benign prose — a narrative "no CRITICAL or HIGH findings", a
 *     "critic HIGH-2" reference, the Confidence field — and corroded the artifact as reviewers
 *     contorted prose to dodge it; plugin-feedback nexus-1.13.0 item 1). The team lead's Verdict
 *     Validation + the reviewer's own Verdict Gate are the backstops for an off-format finding.
 *
 * Design rules (so it never wedges a run, including unattended -p):
 *   - Fail open on ANY uncertainty (bad JSON, missing state file, ambiguous content).
 *     ONE SANCTIONED EXCEPTION — invariant (4), ADR-96. For every other invariant a missing signal
 *     means the gate cannot tell whether a violation happened, so silence is the honest answer.
 *     For (4) the missing signal IS the violation: "no full-suite record exists" is precisely the
 *     state "the suite never ran", which is the only thing the invariant is for. Treating absence as
 *     uncertainty there would make the invariant unreachable in its main case. The exception is
 *     bounded three ways and does not generalize — it applies only to summary.md, only when the repo
 *     itself DECLARED roles.full (a repo that opted out is byte-unchanged), and only to foreground
 *     writers. Do not extend this reasoning to invariants (1) or (2).
 *   - Deny reasons are self-correcting, so an unattended agent fixes itself with no human.
 *   - It only ever DENIES or stays silent; it never auto-approves.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { isCodeFile } = require('./lib/is-code-file');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { treeHash, sameTree } = require('./lib/tree-hash');
const { closeGear, closeEvidence, labelsOnly } = require('./lib/gear-close');
const { countsAsPassing } = require('./lib/run-verdict');
const { isNonRegistry } = require('./lib/registry-stamp');
const { checkSpec, readCommitted, isReady } = require('./lib/spec-sources');
const { isSpawned } = require('./lib/is-spawned');

// The calibration script, addressed from this file. `hooks/` and `skills/` are siblings under the
// plugin root in the source repo AND under the version root of a consuming repo's version-keyed
// cache, so the two-up-then-down form resolves in both. Check (4)'s same-directory
// `path.join(__dirname, 'verify-run.js')` does not transfer.
const DERIVE_RULER = path.join(__dirname, '..', '..', 'skills', 'critic-calibration', 'scripts', 'derive-ruler.mjs');
// `findRecordFiles` walks the whole docs/specs tree per invocation and this hook runs in every
// consuming repo, so the spawn is bounded. Past the bound the check allows.
const METRICS_TIMEOUT_MS = 20000;
// Invariant (7)'s git read runs on every foreground summary.md write in every consuming repo, so it
// is bounded like (6)'s spawn. Past the bound the check allows.
const GIT_STATUS_TIMEOUT_MS = 5000;
const REGISTRY_ROOT = 'docs/business-rules';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }

  const tool = data.tool_name || '';
  const ti = data.tool_input || {};

  // Spawns (Task/Agent) are background by design (ADR-12); all non-edit tools pass —
  // this gate only guards edits.
  if (!/^(Write|Edit|MultiEdit)$/.test(tool)) return allow();

  const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
  if (!fp) return allow();

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

  // (1) Analyze-phase collapse: plan or source written during an analyze phase.
  if (phaseIsAnalyze(root)) {
    if (/\/plan\.md$/.test(fp)) {
      return deny(
        'plan.md written during an analyze phase. Phase 1 is analyze-and-stop: surface questions and let ' +
        'the team lead resume you for Phase 2 ("Write the plan") before writing the plan.'
      );
    }
    if (isCodeFile(fp, root)) {
      return deny(
        `source file written during an analyze phase (${fp}). Phase 1 is analyze-and-stop: report your ` +
        'findings and let the team lead resume you for Phase 2 ("Implement") before writing code.'
      );
    }
  }

  // (2) review.md verdict integrity: APPROVED while a CRITICAL/HIGH is still open.
  if (/\/review\.md$/.test(fp) && approvedWithOpenHighSev(writtenContent(tool, ti))) {
    return deny(
      'review.md marks APPROVED while an unresolved CRITICAL or HIGH finding is present. A CRITICAL/HIGH ' +
      'forces REQUEST CHANGES and a developer fix cycle — change the verdict, or only mark the finding ' +
      'resolved after the fix is verified.'
    );
  }

  // (8) Fix-list follow-up: a `due` follow-up line over a list that holds nothing that makes it due.
  if (/\/review\.md$/.test(fp) && dueFollowUpWithoutCause(root, fp, tool, ti)) {
    return deny(
      'the fix list\'s follow-up is due only for a CRITICAL/HIGH, a missing or failed step, or a skill slip — ' +
      'write `Follow-up review: none due`. Where the list does hold one of those in a form this check did not ' +
      'read, write it as a numbered `{n}. [HIGH] …` row.'
    );
  }

  // (10) Spec sources: a write that flips a spec to Ready with an unsourced or unkept rule.
  const specMatch = fp.match(/(?:^|\/)docs\/specs\/([^/]+(?:\/[^/]+)?)\/definition\/spec\.md$/);
  if (specMatch && !isSpawned(data)) {
    const reason = unsourcedSpecRules(root, fp, tool, ti, specMatch[1]);
    if (reason) return deny(reason);
  }

  // (4) Full-suite evidence: summary.md needs a passing role:"full" record for THIS round.
  // The declaration and the round token are read from the tree verify-run.js would MEASURE (F51's
  // session-matching redirect), not blindly from the session root. Reading them from different trees
  // makes the deny undischargeable: if the root declares roles.full and the worktree does not,
  // verify-run records `undeclared` forever while this gate keeps demanding a pass.
  const summaryMatch = fp.match(/(?:^|\/)docs\/specs\/([^/]+)\/delivery\/summary\.md$/);
  if (summaryMatch && !isSpawned(data)) {
    // The ROUND KEY is taken from the path being written, never from configuration: that path is the
    // one place that unambiguously names which feature this close belongs to.
    const slug = summaryMatch[1];
    const tree = resolveDeclaredTree(root, data.session_id);
    const denial = fullSuiteDeclared(tree) ? fullSuiteDenial(tree, root, data, slug) : null;
    if (denial) {
      const { cause, gear, files, foreign } = denial;
      const gloss = foreign
        ? `the newest record at this content is ${foreign}'s and did not pass; this feature's own complete run, the newer record, is the remedy`
        : EVIDENCE_CAUSES[cause]
          ? `${gear ? `under the ${gear} gear, ` : ''}${EVIDENCE_CAUSES[cause]}${files.length ? `: ${files.join(', ')}` : ''}`
          : DENY_CAUSES[cause];
      return deny(
        `summary.md needs a passing full-suite record for ${slug} (cause: ${cause} — ${gloss}). ` +
        'This repo declares .claude/verify.json → roles.full. Run:\n' +
        `  node "${path.join(__dirname, 'verify-run.js')}" --profile complete --slug ${slug}` +
        `${data.session_id ? ` --session ${data.session_id}` : ''}\n` +
        'then write summary.md. (A failing suite is a fix, not a re-run; a stale or wrong-tree record needs ' +
        'only the re-run; an undeclared role is recorded and disclosed, never a pass.)'
      );
    }
  }

  // (5) Lessons evidence: summary.md needs a lessons write on record for THIS round.
  // DELIBERATELY UNCONDITIONAL — there is NO opt-in key, unlike (4). The owner ruled the duty
  // gate-observed at every close, so (5) fires in every consuming repo, and the remedy is one write.
  // TOKEN HOME IS `root`, the one place (5) diverges from (4): (4) reads its token from the tree
  // verify-run would MEASURE, because its evidence is produced there; the lessons log is written by
  // an always-root-resolved PostToolUse hook, so its round key must be read from the same root.
  if (summaryMatch && !isSpawned(data) && !hasLessonsThisRound(root, data, summaryMatch[1])) {
    return deny(
      `summary.md needs a lessons write this round for ${summaryMatch[1]} — append your ` +
      `\`## {Role} Lessons\` to docs/specs/${summaryMatch[1]}/delivery/lessons.md (the lessons-format ` +
      'skill), then write summary.md. A `MultiEdit` append leaves no record — re-append with `Edit`. ' +
      'If you wrote lessons.md this turn, retry — the record lands asynchronously.'
    );
  }

  // (6) Critic-record measurability. Its own path match, because a NESTED issue closes at
  // docs/specs/{epic}/{issue}/delivery/summary.md and `metrics` addresses that record as
  // `{epic}/{issue}` — the addressing it already documents. For a flat slug the capture is
  // byte-identical to summaryMatch[1].
  const criticMatch = fp.match(/(?:^|\/)docs\/specs\/([^/]+(?:\/[^/]+)?)\/delivery\/summary\.md$/);
  if (criticMatch && !isSpawned(data)) {
    const reason = unmeasurableCriticRecord(root, criticMatch[1]);
    if (reason) return deny(reason);
  }

  // (7) Unruled registry rows, read in (4)'s tree. `lib/worktree-target.js` is the only which-tree
  // rule a hook may use, so the tree is never derived from the summary.md path.
  if (summaryMatch && !isSpawned(data)) {
    const reason = unruledRegistryRows(resolveDeclaredTree(root, data.session_id), summaryMatch[1]);
    if (reason) return deny(reason);
  }

  // (9) Summary mode line: a whole-file Write of summary.md carries a line beginning `Mode: `.
  if (criticMatch && !isSpawned(data) && tool === 'Write' && !/^Mode: /m.test(String(ti.content || ''))) {
    return deny(
      `summary.md for ${criticMatch[1]} has no mode line. Put one right under its title, in the ` +
      'summary-format grammar (its Producers paragraph): `Mode: team pipeline ({definition})` from the ' +
      'team lead, or `Mode: architect-led fast lane ({level}, {definition})` from the architect — ' +
      '{level} is light or full, {definition} is spec, bug, epic, ADR or plan only — then write summary.md again.'
    );
  }

  return allow();
});

/**
 * The deny reason for a write that flips a spec to Ready while a rule is unsourced or an added rule
 * unkept, or null to allow. Every uncertainty allows (header, invariant (10)).
 */
function unsourcedSpecRules(root, fp, tool, ti, slug) {
  try {
    const after = contentAfterWrite(root, fp, tool, ti);
    if (after === null || !isReady(after)) return null;
    const file = path.resolve(root, fp);
    const before = readLf(file);
    if (before !== null && isReady(before)) return null;
    const base = readCommitted(file, 'HEAD', { timeoutMs: GIT_STATUS_TIMEOUT_MS });
    if (base.status === 'error') return null;
    const { missing, pending } = checkSpec(after, base.status === 'text' ? base.text : null);
    if (!missing.length && !pending.length) return null;
    const found = [
      missing.length ? `no source: ${missing.join(', ')}` : '',
      pending.length ? `added, not kept by the owner: ${pending.join(', ')}` : '',
    ].filter(Boolean).join('; ');
    return `spec.md for ${slug} cannot go Ready while a business rule is unsourced (${found}). ` +
      'End each rule with its source marker, `*(Source: {kind} {reference})*`, the kind one of ticket, ' +
      'contract, owner, document, pattern or added (the spec template\'s Business Rules grammar); split a ' +
      'rule its source covers only in part, the rest written `added`; put the added rules to the owner as ' +
      'the catalogue\'s `spec additions` entry, marking each kept one `added — kept by owner {YYYY-MM-DD}` and ' +
      'moving each dropped one to Out of Scope — then mark the spec Ready.';
  } catch { return null; }
}

/**
 * Registries this close wrote that still hold a `pending-triage` row with no `ruling:` key. Returns
 * the deny reason, or null to allow.
 */
function unruledRegistryRows(tree, slug) {
  const rels = dirtyRegistryPaths(tree);
  if (!rels) return null;
  const namesSlug = new RegExp(`(?:^|[^\\w-])${slug.replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\${c}`)}(?![\\w-])`);
  const found = [];
  for (const rel of rels) {
    if (!rel.endsWith('.md') || isNonRegistry(rel)) continue;
    const file = path.join(tree, ...rel.split('/'));
    if (fs.existsSync(`${file.slice(0, -'.md'.length)}-attestation.md`)) continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    if (!namesSlug.test(text)) continue;
    for (const id of unruledRowIds(text)) found.push(`${rel} ${id}`);
  }
  if (!found.length) return null;
  return `summary.md for ${slug} — a registry this close wrote still holds an unruled pending-triage ` +
    `row (read in ${tree}):\n${found.map((f) => `  ${f}`).join('\n')}\n` +
    'Write a `ruling:` on each row — `code wrong`, `spec wrong or stale`, `accepted deviation` or ' +
    '`deferred` (the architect rules; the close gate\'s item 1) — then write summary.md. `deferred` is ' +
    'the ruling for a fix outside this feature and for an unattended run\'s open owner question, ' +
    'with the question on the row, a review-queue entry and a backlog row.';
}

/**
 * Registry paths (repo-relative, `docs/business-rules/…`) git reports modified or untracked in
 * `tree`, or null when git cannot answer — no git, not a repository, or past the bound.
 */
function dirtyRegistryPaths(tree) {
  let out;
  try {
    out = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=all',
      '--', REGISTRY_ROOT], {
      cwd: tree,
      timeout: GIT_STATUS_TIMEOUT_MS,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch { return null; }
  // Porcelain is positional: an entry's first two characters are its status, and a leading space is
  // one of them — so the output is split on NUL and never trimmed.
  const rels = [];
  const fields = out.split('\0');
  for (let i = 0; i < fields.length; i++) {
    const entry = fields[i];
    // A rename or copy entry is followed by a field holding its source path.
    if (/[RC]/.test(entry.slice(0, 2))) i++;
    const p = entry.slice(3);
    // Porcelain paths are repo-root-relative; from a project nested inside a larger repository they
    // carry that project's own prefix, which the tree path already contains.
    const at = p.indexOf(`${REGISTRY_ROOT}/`);
    if (at >= 0) rels.push(p.slice(at));
  }
  return rels;
}

/**
 * Ids of the rows under `## Rules` whose `status:` field is `pending-triage` and that carry no
 * `ruling:` field. Both are read by the registry grammar (mine-verify-cover/SKILL.md § The rule
 * registry), never as text anywhere in the row: a key mentioned in a note, a free-text value, a
 * wrapped line or the rule sentence is prose, and prose must neither discharge a row nor mark one.
 */
function unruledRowIds(text) {
  // A registry checked out or edited under `core.autocrlf=true` carries CRLF, and the row opener's
  // `.` and `$` never match across a `\r` — every row would read as absent and the close would pass.
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^## Rules\s*$/.test(l));
  if (start < 0) return [];
  const prefix = declaredRowPrefix(lines);
  const opener = new RegExp(`^-[ \\t]+${prefix}-(\\d+[a-z]?):[ \\t]*(.*)$`);
  const ids = [];
  let row = null;
  const settle = () => {
    if (row && row.pending && !row.ruled) ids.push(row.id);
  };
  for (let k = start + 1; k < lines.length; k++) {
    const line = lines[k];
    if (/^## /.test(line)) break;
    if (/^-[ \t]/.test(line)) {
      // A top-level bullet is a rule; its fields go on the sub-bullets beneath it. One that opens no
      // row in the declared prefix is not a row, and nothing under it is read into the row above.
      settle();
      const m = opener.exec(line);
      row = m ? { id: `${prefix}-${m[1]}`, pending: false, ruled: false } : null;
    } else if (row) {
      readRowFields(line, row);
    }
  }
  settle();
  return ids;
}

/**
 * The row-id prefix the header declares — `Row-prefix: FL` or `**Row-prefix:** FL`, a backtick wrap
 * accepted, the first line above the first `##` heading — or `BR` when it declares none or an invalid
 * token (the registry grammar's own fallback).
 */
function declaredRowPrefix(lines) {
  for (const line of lines) {
    if (/^##/.test(line)) break;
    const m = /^(?:\*\*Row-prefix:\*\*|Row-prefix:)[ \t]*(\S*)/.exec(line);
    if (!m) continue;
    const token = m[1].replace(/^`(.*)`$/, (_, t) => t);
    return /^[A-Z]{1,8}$/.test(token) ? token : 'BR';
  }
  return 'BR';
}

/**
 * One continuation line of a row, read where the grammar puts a field: at the start of the line (a
 * sub-bullet's dash stripped) and after each ` · ` separator. `anchor:` and `why:` consume the rest of
 * their line; a repeated `status:` reads last-wins; `ruling:` counts by presence, whatever its value.
 */
function readRowFields(line, row) {
  for (const segment of line.replace(/^[ \t]*-[ \t]*/, '').split(/[ \t]+·[ \t]+/)) {
    const field = /^[ \t]*([A-Za-z_][\w-]*):[ \t]*(.*)$/.exec(segment);
    if (!field) continue;
    if (field[1] === 'anchor' || field[1] === 'why') break;
    if (field[1] === 'status') row.pending = /^pending-triage(?![\w-])/.test(field[2]);
    if (field[1] === 'ruling') row.ruled = true;
  }
}

/**
 * Is there a critic record for this slug that the calibration tool refuses to read?
 *
 * Returns the deny reason, or null to allow. Every uncertainty allows — see invariant (6) in the
 * header for why this one needs no fail-open exception, and why the deny condition is written as the
 * narrow shape it is rather than as a bare catch.
 */
function unmeasurableCriticRecord(root, slug) {
  // The CANONICAL name, and only it: `metrics` reads exactly this file, so arming on anything wider
  // makes the check's own two matchers disagree. A folder holding only a sanctioned SIBLING record
  // (`review-critic-codex.md`, `review-critic-second.md`) would then arm the check and be denied
  // with "no review record for slug" — blocking the Codex-critic lane the plugin itself mandates,
  // with a remediation the operator cannot act on. Those siblings are unreachable by the whole
  // calibration toolchain, which is a gap to close there, never a close to break here.
  const rel = ['docs', 'specs', ...slug.split('/'), 'delivery', 'review-critic.md'].join('/');
  const record = path.join(root, ...rel.split('/'));
  let text;
  try {
    text = fs.readFileSync(record, 'utf8');
  } catch { return null; } // no canonical record -> self-review, or nothing this tool can read
  // A LEGACY record — one written before the round layout existed — carries neither round table.
  // `metrics` refuses it, but refusing to measure a pre-contract record is not a defect in it: this
  // invariant is about the NEXT record, and denying every close whose record predates the contract
  // would turn a historical fact into a permanent block. Same adoption test the extractor uses.
  if (!/^### (Merge|Fold) — round \d/m.test(text)) return null;

  try {
    // `process.execPath` rather than a bare `node` (not guaranteed on PATH), and an argv array
    // rather than a shell string, so no quoting surface exists. `--repo` as well as `cwd`: the root
    // is the tree whose path this check just matched, and letting the tool re-derive it by walking
    // to the nearest `.git` resolves the OUTER repo for a project nested inside one.
    execFileSync(process.execPath, [DERIVE_RULER, 'metrics', '--slug', slug, '--repo', root], {
      cwd: root,
      timeout: METRICS_TIMEOUT_MS,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return null; // exit 0 -> the round is measurable
  } catch (e) {
    // DENY ONLY on `fail()`'s signature, and that signature is THREE factors: exit 1, a line reading
    // `derive-ruler: {message}`, and that line naming THIS record. Everything else is the check
    // failing rather than the record, and allows:
    //   - a timeout (`status` null, SIGTERM) or no `.status` at all;
    //   - `usage()`, which prints the same prefix but exits 2;
    //   - `node {missing script}`, which exits 1 with a MODULE_NOT_FOUND stack trace and no such
    //     line — status alone would hand an operator local absolute paths as their remediation;
    //   - a corrupt `corpus.jsonl`, which the tool reads BEFORE this mode runs and reports with the
    //     same prefix and exit code — a broken calibration corpus is not a broken critic record, and
    //     denying on it would blame the wrong file in a message carrying an absolute local path.
    // Every parse message this mode can raise opens with the record's own path, so requiring it is
    // exact rather than heuristic. The gate exists to catch an unreadable record, never to become a
    // new way for a close to break.
    const line = String((e && e.stderr) || '').split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('derive-ruler: ') && l.includes(rel));
    if (!e || e.status !== 1 || !line) return null;
    return `summary.md for ${slug} — its critic record ${rel} cannot be measured, so this round's ` +
      'figures can never be read and the next unreadable record stays invisible too. ' +
      'derive-ruler said:\n' +
      `  ${line}\n` +
      'Fix the record (that line names the file, the line and the cause), then write summary.md. ' +
      'Re-check with:\n' +
      `  node "${DERIVE_RULER}" metrics --slug ${slug}`;
  }
}

/**
 * Which run of a round does this record belong to? Shared by (4) and (5) so the two can never drift
 * apart on the question. Both comparisons are against a NON-EMPTY value: an empty token must not
 * match an empty token, or one unkeyed record would discharge every unkeyed close.
 */
function inThisRound(rec, token, session) {
  return (token !== '' && String(rec.token || '') === token)
    || (session !== '' && String(rec.session || '') === session);
}

/**
 * Is a lessons write on record for this slug and this round?
 *
 * A missing, empty or unparseable log yields no records and therefore denies — the same reasoning
 * (4) uses and for the same reason: "no record exists" IS the state the invariant is about, not
 * uncertainty about it. The record is written by an ASYNC PostToolUse hook, so a summary.md write
 * issued in the same turn as the lessons write can lose the race; the deny is self-correcting on
 * retry and says so.
 */
function hasLessonsThisRound(root, data, slug) {
  let token = '';
  try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }
  const session = String(data.session_id || '');

  let lines = [];
  try {
    lines = fs.readFileSync(path.join(root, '.claude', 'audit', 'lessons-writes.log'), 'utf8').split('\n');
  } catch { return false; }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let rec;
    try { rec = JSON.parse(trimmed); } catch { continue; } // per-line tolerance, as every reader here has
    if (!rec || String(rec.slug || '') !== slug) continue;
    if (inThisRound(rec, token, session)) return true;
  }
  return false;
}

/** Did the repo opt in? Only a DECLARED roles.full arms invariant (4); everything else fails open. */
function fullSuiteDeclared(tree) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8'));
    const full = cfg && cfg.roles && cfg.roles.full;
    return typeof full === 'string' && full.trim() !== '';
  } catch { return false; } // absent or malformed CONFIG -> not opted in -> fail open, as everywhere else
}

const DENY_CAUSES = {
  missing: 'no full-suite record for this round is in .claude/audit/verify-verdict.json',
  'wrong-tree': 'the latest record ran in another tree',
  stale: 'the source tree changed after the latest record',
  failing: 'the latest record for this tree state did not pass',
};

// The close evidence fell short; the files are named after the gloss, and the re-run still discharges.
const EVIDENCE_CAUSES = {
  'not-completed': 'the latest record was cut or crashed, or its failures cannot all be named, so it cannot stand for the close',
  unrepaired: 'no green, unfiltered run by name of the feature\'s slug stands for the content these hold now since the latest record failed them',
  uncovered: 'no green tied run holds these files at their current hash since the latest record',
};

/**
 * Why does the LATEST in-scope full-suite record not discharge this close? `{cause}` — plus `files`, and
 * the `gear` when one is set, when the close evidence fell short, or `foreign` (that record's slug) when
 * another feature's red at this content denies — or `null` when it does.
 *
 * Latest, not any. The audit file is append-only, so a run/fix/re-run cycle leaves several
 * full-suite records for one round; "any pass discharges" would let an early green shadow the red
 * that came after it, and close a feature whose suite is failing right now. The gate's question is
 * "is the suite green?", not "was it ever green?", so only the most recent in-scope record counts.
 *
 * TWO FACTORS, both required.
 *
 * (1) The ROUND KEY — `slug`, stamped by `verify-run --slug` and compared against the slug in the
 *     summary.md path being written. This is what makes the match round-scoped. Without it the
 *     session path alone was too loose: a session outlives a feature, so two features closed in one
 *     session could discharge each other (found in review, fixed by plan amendment). A record with
 *     no slug — a pre-amendment record, or a hand-written one — can never name its round, so it
 *     discharges nothing. Unsigned is not evidence.
 *
 * (2) The ROUND INSTANCE — token or session. The round token (.claude/.pipeline-state) is the primary
 *     key, but a repo that never writes one has an empty token, and a token that moved on after the
 *     suite ran would otherwise permanently wedge the only writer of summary.md. So the record's
 *     `session` is a second way to prove it belongs here. Both are exact comparisons against a
 *     NON-EMPTY value: an empty token must not match an empty token, or every unkeyed record in the
 *     log would discharge every unkeyed close.
 *
 * The two are ANDed, and neither is sufficient alone: the slug says which feature, the token/session
 * says which run of it. A correctly-slugged record from a stale round is still not this round's.
 *
 * THEN THREE FACTS ON THE LATEST (F147), checked in this order: it ran in THIS tree (`wrong-tree`
 * otherwise), at this tree's current source hash (`stale`), and it counts as passing (`failing`) — it
 * passed, or its only failures are timed-out tests the change did not touch (lib/run-verdict.js, the rule
 * the gear close and the campaign's closing check read too). A tree whose every change since the record is
 * a label label-tests.js wrote (lib/gear-close.js labelsOnly) is not stale. The order is the
 * remedy's: a red record from another tree or an earlier state needs a re-run, and reading it as
 * `failing` would send the closer into a fix loop for a failure the current tree may not have. Matching
 * the hash is what lets the close reuse a complete record still at this content (a gear's handover run, or
 * the record the newest-at-content rule below reads) instead of paying the suite twice. A `stale` or
 * `failing` record is then read once more, as close evidence (lib/gear-close.js `closeEvidence`).
 *
 * THE NEWEST RECORD AT THIS CONTENT FIRST. Before the two factors, the newest `full` record that names a
 * slug, ran in THIS tree and carries the current hash — any slug, any session — is judged as the latest
 * would be: passing discharges; this slug's red is read as close evidence; another slug's red denies
 * `failing`, because this slug's fast records carry `delta_base` from this slug's own complete record
 * (lib/gear-close.js `deltaSince`) and so can never repair it — its remedy is this slug's complete run,
 * which becomes the newer record. Judging the newest, never the newest PASS, keeps any older green from
 * hiding a newer red. A tree with no hash skips this, and with no record at the content the factors decide.
 *
 * A missing, empty or unparseable verdict file yields no records and therefore denies — that is
 * invariant (4)'s sanctioned exception, not an oversight (see the header).
 */
function fullSuiteDenial(tree, root, data, slug) {
  let token = '';
  try { token = fs.readFileSync(path.join(tree, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }
  const session = String(data.session_id || '');

  let lines = [];
  try {
    // The audit file stays the RESOLVED ROOT's even when the declaration came from a redirected
    // tree — verify-run.js makes the same measure-there/write-here split, so one log home holds
    // every record and the token-scoped queries keep working.
    lines = fs.readFileSync(path.join(root, '.claude', 'audit', 'verify-verdict.json'), 'utf8').split('\n');
  } catch { return { cause: 'missing' }; }

  // The hash factor fails open on one condition only: a tree git cannot list has no hash, so the factor
  // is skipped whole — a record without `tree_hash` included — while the tree and verdict still bind.
  const hash = treeHash(tree);
  const records = [];
  let latest = null;
  let index = -1;
  let atContent = -1;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let rec;
    try { rec = JSON.parse(trimmed); } catch { continue; } // per-line tolerance, as every reader of this file has
    if (rec) records.push(rec);
    if (!rec || rec.role !== 'full') continue;
    if (hash !== null && rec.slug && rec.tree_hash === hash && sameTree(rec.tree, tree)) atContent = records.length - 1;
    // Factor 1: the round key. An absent or empty slug fails here — never compared as '' === '',
    // which would make every unsigned record match every close.
    if (!rec.slug || String(rec.slug) !== slug) continue;
    // Factor 2: which run of that round. Both comparisons are against a NON-EMPTY value — an empty
    // token must not match an empty token, or one unscoped record would discharge every close.
    if (!inThisRound(rec, token, session)) continue; // out of scope for the own-record path, in either direction; the newest-at-content read above takes any session
    latest = rec; // append-only: the last in-scope record wins
    index = records.length - 1;
  }
  if (atContent >= 0) {
    const newest = records[atContent];
    if (countsAsPassing(newest)) return null;
    if (String(newest.slug) !== slug) return { cause: 'failing', foreign: String(newest.slug) };
    return evidenceDenial('failing', { records, index: atContent, tree, root, slug });
  }
  if (!latest) return { cause: 'missing' };
  if (!sameTree(latest.tree, tree)) return { cause: 'wrong-tree' };
  let cause = null;
  if (hash !== null && latest.tree_hash !== hash && !labelsOnly({ records, index, tree })) cause = 'stale';
  else if (!countsAsPassing(latest)) cause = 'failing';
  if (!cause) return null;
  return evidenceDenial(cause, { records, index, tree, root, slug });
}

/** A `stale` or `failing` complete record read once more, as close evidence: `null` when it stands. */
function evidenceDenial(cause, { records, index, tree, root, slug }) {
  const evidence = closeEvidence({ records, index, tree, slug });
  if (evidence.ok) return null;
  const gear = closeGear(slug, { tree, root });
  if (!gear && evidence.cause === 'not-completed') return { cause };
  return { cause: evidence.cause, gear, files: evidence.files };
}

function writtenContent(tool, ti) {
  if (tool === 'Write') return String(ti.content || '');
  if (tool === 'Edit') return String(ti.new_string || '');
  if (tool === 'MultiEdit' && Array.isArray(ti.edits)) {
    return ti.edits.map(e => (e && e.new_string) || '').join('\n');
  }
  return '';
}

function phaseIsAnalyze(root) {
  try {
    const s = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim().toLowerCase();
    return /analyze\s*$/.test(s);
  } catch { return false; } // no state -> fail open
}

// Conservative heuristic: fires only when an APPROVED verdict sits beside a finding HEADING
// (`### [SEVERITY] …`) for a CRITICAL/HIGH that carries no resolution marker; else allows.
//
// Anchored POSITIVELY on the finding heading — NOT on bare token adjacency. The old approach scanned
// every line for a `CRITICAL|HIGH` token and then tried to subtract benign shapes (line-initial
// negation, a Confidence field, legend/table rows) with an exemption blocklist; that list kept
// missing new benign shapes — a narrative "the reviewer found no CRITICAL or HIGH findings", a
// "critic HIGH-2" cross-reference, a legend row phrased outside the known tokens — and false-blocked
// clean APPROVED reviews (4 features; plugin-feedback nexus-1.13.0 item 1). review-format mandates
// that real findings are `### [SEVERITY] title` headings (File/Issue/Fix lines below), so a token
// that does NOT head such a heading is, by the format, not a finding: prose, a Confidence qualifier,
// a legend, a table row, or a section heading like "### Summary: no CRITICAL issues" never trips.
function approvedWithOpenHighSev(text) {
  if (!text) return false;
  const t = text.replace(/\r/g, '');
  const i = t.search(/\bAPPROVED\b/i);
  if (i < 0) return false;
  // not an approval if the verdict region says REQUEST CHANGES
  if (/\bREQUEST\s+CHANGES\b/i.test(t.slice(Math.max(0, i - 120), i + 120))) return false;

  const RESOLVED = /\b(resolved|fixed|dismissed|false alarm|false[- ]positive|not an issue|won'?t ?fix|deferred|n\/?a)\b/i;
  // A finding is a markdown heading whose title LEADS with the severity, optionally bracketed:
  // "### [HIGH] SQL injection", "### [CRITICAL] …", "### HIGH: …" (review-format `### [SEVERITY]`).
  // The leading anchor is what excludes "### Summary: no CRITICAL …" (severity not first → not a
  // finding) while still catching "### [HIGH] No input validation …" (severity first; the "no" is
  // mid-title, not a negation summary).
  const FINDING_HEADING = /^\s{0,3}#{2,6}\s+\[?\s*(critical|high)\b/i;

  const lines = t.split('\n');
  for (let k = 0; k < lines.length; k++) {
    if (!FINDING_HEADING.test(lines[k])) continue;
    // examine the finding heading plus the next few lines for a resolution marker
    const window = lines.slice(k, k + 4).join(' ');
    if (!RESOLVED.test(window)) return true;
  }
  return false;
}

const FOLLOW_UP = /\bFollow-up(?: review)?:/;
const FIX_LIST_HEADING = /^## Step 2 — Fix list, cycle \d+\s*$/;

function dueFollowUpWithoutCause(root, fp, tool, ti) {
  const after = contentAfterWrite(root, fp, tool, ti);
  if (after === null) return false;
  const prior = fixListSections(readLf(path.resolve(root, fp)) || '');
  for (const [key, section] of fixListSections(after)) {
    if (prior.get(key) === section) continue;
    if (dueWithoutCause(section)) return true;
  }
  return false;
}

function readLf(file) {
  try { return fs.readFileSync(file, 'utf8').replace(/\r/g, ''); } catch { return null; }
}

// The file as it will read after this write. An edit whose `old_string` is absent would fail at the
// tool, so it allows; the function form of `replace` keeps `$&` and its kin literal.
function contentAfterWrite(root, fp, tool, ti) {
  const lf = (s) => String(s == null ? '' : s).replace(/\r/g, '');
  if (tool === 'Write') return lf(ti.content);
  const edits = tool === 'Edit' ? [ti] : (Array.isArray(ti.edits) ? ti.edits : null);
  let text = readLf(path.resolve(root, fp));
  if (!edits || text === null) return null;
  for (const e of edits) {
    const oldS = lf(e && e.old_string);
    const newS = lf(e && e.new_string);
    if (!oldS || !text.includes(oldS)) return null;
    text = e.replace_all ? text.split(oldS).join(newS) : text.replace(oldS, () => newS);
  }
  return text;
}

// `## Step 2 — Fix list, cycle {N}` sections, keyed by heading and occurrence; a section ends at the
// next `## ` heading.
function fixListSections(text) {
  const out = new Map();
  const seen = new Map();
  let key = null;
  let buf = [];
  const flush = () => { if (key) out.set(key, buf.join('\n')); };
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) {
      flush();
      key = null;
      buf = [];
      if (FIX_LIST_HEADING.test(line)) {
        const h = line.trim();
        seen.set(h, (seen.get(h) || 0) + 1);
        key = `${h}#${seen.get(h)}`;
      }
    }
    if (key) buf.push(line);
  }
  flush();
  return out;
}

// Denies only on a positive parse: a due follow-up line, at least one row above it, every list or
// table line above it recognised, and no row that makes the follow-up due.
function dueWithoutCause(section) {
  const lines = section.split('\n').slice(1);
  const at = lines.findIndex((l) => FOLLOW_UP.test(l));
  if (at < 0) return false;
  const rest = lines[at].slice(lines[at].search(FOLLOW_UP)).replace(FOLLOW_UP, '').replace(/^[*\s]+/, '');
  if (!/^due\b/i.test(rest)) return false;
  const TABLE_RULE = /^\s*\|[\s:|-]+\|?\s*$/;
  let rows = 0;
  for (let k = 0; k < at; k++) {
    const line = lines[k];
    let content = null;
    if (/^\s*\|/.test(line)) {
      if (TABLE_RULE.test(line) || (k + 1 < at && TABLE_RULE.test(lines[k + 1]))) continue;
      content = line;
    } else {
      const item = /^\s*(?:\d+[.)]|[-*+])\s+(.*)$/.exec(line);
      if (item) content = item[1];
    }
    if (content === null) continue;
    const kind = fixRowKind(content);
    if (kind === null || kind === 'qualifies') return false;
    rows++;
  }
  return rows > 0;
}

// 'qualifies' — a CRITICAL/HIGH level (or a contested range reaching one), a missing or failed step, a
// skill slip; 'row' — any other level, or a test slip; null — a shape this check does not read. Each
// cause is read on its own, so a level in the row never hides a slip or a step beside it.
function fixRowKind(text) {
  const t = text.replace(/\*\*/g, '');
  const severe = (l) => l === 'CRITICAL' || l === 'HIGH';
  const levels = rowLevels(t);
  if (levels.some(({ level, range }) => severe(level) || (range && (severe(range[1]) || severe(range[2]))))) return 'qualifies';
  if (/\bstep\s+\d+[a-z]?\s*[—–-]+\s*(?:missing|failed)\b/i.test(t) || /\bskill slip\b/i.test(t)) return 'qualifies';
  if (levels.length || /\btest slips?\b/i.test(t)) return 'row';
  return null;
}

// The leftmost `[LEVEL…]` bracket, and in a table row every cell holding a bare level, with any
// contested range beside it.
function rowLevels(t) {
  const contested = (s) => /contested\s+([A-Z]+)\s*\/\s*([A-Z]+)/.exec(s || '');
  const out = [];
  const bracket = /\[\s*(CRITICAL|HIGH|MEDIUM|LOW)\b([^\]]*)\]/.exec(t);
  if (bracket) out.push({ level: bracket[1], range: contested(bracket[2]) });
  if (/^\s*\|/.test(t)) {
    for (const cell of t.split('|')) {
      const bare = /^\s*(CRITICAL|HIGH|MEDIUM|LOW)(?:\s*\((.*)\))?\s*$/.exec(cell);
      if (bare) out.push({ level: bare[1], range: contested(bare[2]) });
    }
  }
  return out;
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus pipeline gate blocked: ${reason}`
    }
  }));
  process.exit(0);
}

function allow() { process.exit(0); }
