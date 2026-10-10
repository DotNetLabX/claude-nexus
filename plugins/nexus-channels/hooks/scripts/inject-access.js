#!/usr/bin/env node
/**
 * The access-channels SessionStart envelope: the repo's declared channels, resolved, as a table the
 * agent reads before it grounds anything.
 *
 * TWO PAYLOADS, AND INSTALLING THE EXTENSION IS THE OPT-IN (owner ruling 2026-08-31). A repo that
 * committed a `.claude/access.yaml` gets the resolved table. A repo that installed this extension and
 * has not declared yet gets ONE LINE telling it how to declare — and how to opt out, which is
 * disabling this plugin for that project. The zero-cost promise is unchanged in substance and now
 * belongs where it always meant to: a repo with the extension NOT INSTALLED pays nothing, because
 * nothing of ours runs there. The line is a sentence, not an envelope: no header, no table frame, no
 * end marker around a repo that has nothing to show yet.
 *
 * A NOTICE A PERSON MUST ACT ON IS ADDRESSED TO THE AGENT AS WORK, NEVER WRITTEN AS A FACT ABOUT
 * THE REPO. `additionalContext` reaches the model and nothing else: the nudge shipped as a bare
 * statement of the repo's state, which an agent legitimately files as background it may act on
 * later — and measured twice in real sessions it was never spoken, so the person saw no
 * trace of onboarding that had in fact been delivered. Every line here that a PERSON has to act on —
 * both nudge variants and the refresh notice — therefore OPENS with `RELAY`, an instruction to speak
 * it in the first user-visible reply. What follows the instruction is the same person-facing
 * sentence as before, and the budget is the same: one line, once per session. Paraphrase is invited;
 * the QUOTED phrase inside each is not, because that phrase is what the person says back to start
 * the recipe. The table's rows, checks and findings get no such wrapper: they are the agent's
 * working data for resolving a channel, not a sentence anyone is meant to read aloud.
 *
 * PRESENT BUT BROKEN IS NOT ABSENT. A declaration that exists and fails to parse still emits — the
 * header, the rule, one line naming the line number and the fix, the marker. The failure class this
 * feature exists to prevent is the silent one (a line that stops being read and nobody notices), so
 * the broken case is the LOUDEST, never the quietest.
 *
 * OWN CAP, NOT A SHARE OF THE KERNEL'S. The platform caps each hook OUTPUT independently, so this
 * envelope's budget is its own — it takes nothing from core's kernel. But unlike core's, this
 * payload is DATA-DRIVEN: its length is a function of how many corpora a repo declares, which no
 * test in this repo can bound. Hence the overflow guard below, which core does not need — rather
 * than fail open on an oversize payload (core's posture, correct for a fixed payload), this one
 * drops TABLE ROWS from the tail so the rule, the findings and the marker always land. A silently
 * truncated payload that loses the rule would leave the agent with a table and no instruction for
 * reading it, which is worse than a table with fewer rows.
 *
 * TWO RENDERINGS, ONE REPORT. `--check` prints the same facts as plain text with an exit code, for
 * the skill's validate recipe and the live probe. It is the same load/resolve/check path — a second
 * implementation is how a validator starts disagreeing with the thing it validates. The one thing it
 * deliberately does not print is either line that INVITES A CONVERSATION — the setup nudge and the
 * refresh notice: the checker validates a file for whoever ran it, and an onboarding line in its
 * output is neither a finding nor something an exit code can express. Doubly so now that both open
 * with an instruction addressed to an agent — there is no agent in a validator's stdout to obey it.
 *
 * NOTHING HERE WRITES. The deny check reports a missing `permissions.deny` entry; it never edits a
 * settings file, in this repo or the user's home.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const access = require('./lib/access-declaration.js');

const pluginRoot = path.resolve(__dirname, '..', '..');
const RULE_FILE = path.join(pluginRoot, 'rules', 'access-resolver.md');

// The platform caps a hook's output — additionalContext included — at PLATFORM_CAP chars, PER HOOK
// OUTPUT: oversize is persisted to a file and replaced by a short preview, so it never reaches the
// model. Each hook is capped independently, so these are this envelope's own numbers and not a
// share of core's. Kept as top-level single-line consts because the budget test parses them out of
// this source rather than importing a script that writes to stdout on load.
const PLATFORM_CAP = 10000;
const WARN_AT = PLATFORM_CAP - 150;

const DECLARATION_REL = '.claude/access.yaml';
// The opening of every line a PERSON has to act on. One constant, prefixed to all three, so the
// obligation cannot reach one notice and miss another — the defect it fixes was exactly a notice
// that arrived without one. "Once" and "first reply" carry the budget into the instruction itself;
// "keeping the quoted phrase exactly" protects the sentence the person says back, which is the one
// part of a relay that a paraphrase must not touch.
const RELAY = 'Tell the user once, in your first reply, in your own words, keeping the quoted phrase exactly as written: ';
// The setup nudge: ONE line, for a repo that installed the extension and has not declared. Authored
// on one physical line each because the payload is the line — a wrapped source string would put a
// newline into the model's context and turn a one-line nudge into a two-line one.
const NUDGE = RELAY + 'This repo hasn\'t declared its knowledge channels yet — the file that tells me where answers should come from: the knowledge base, the semantic model for data questions, meeting notes — each from a local copy or a remote MCP server. Say "set up the knowledge channels" and I\'ll draft the declaration and ask you to confirm the two settings it needs. (Don\'t want channels in this repo? Disable the nexus-channels plugin for this project.)';
// "RECEIVED", never "prefilled": the walk matches on the filename alone, so it cannot know whether
// the copy still carries its placeholders — and a copy nobody has filled in yet is a live state. The
// guided setup asks about whatever placeholders survive, so this wording stays honest either way.
const nudgeWithTemplate = (rel) => RELAY + 'This repo hasn\'t declared its knowledge channels yet — the file that tells me where answers should come from: the knowledge base, the semantic model for data questions, meeting notes — and whether each is read from a local copy in the repo or a remote MCP server. A received access.template.yaml was found at ' + rel + ' — say "set up the knowledge channels" and I\'ll draft it from that and ask you to confirm the two settings it needs.';
const MARKER = 'END-OF-ACCESS marker: ACCESS-ENVELOPE-COMPLETE';
const CLOSING = 'Every grounded answer names its channel and version — and, for a declared corpus, its compare outcome or that no compare ran — on its `Grounded:` line.';

// ── rendering ────────────────────────────────────────────────────────────────

function readRule() {
  try {
    return fs.readFileSync(RULE_FILE, 'utf8').trim();
  } catch (e) {
    // Fail open on the rule file, not silent: the table is still worth having, but an agent must not
    // be left believing it received the instruction for reading it.
    return '- **Source selection is configuration, never agent judgment.** (The resolver rule file ' +
      'could not be read — resolve each declared corpus from the table below, and refuse to ground from an ' +
      'unresolved corpus.)';
  }
}

// Every cell goes through this. Declared values are the REPO's text, and a `|` in any of them — a
// path, a tool name, or a parser message quoting an offending value back — silently adds a column
// and hands the agent a malformed table for exactly the corpus that is already broken.
const cell = (s) => String(s).replace(/\|/g, '\\|');

const dash = (s) => (s === null || s === undefined || s === '' ? '—' : cell(s));

// A path that escapes the repo root is deliberately never stat'ed, so `exists` stays null — a third
// state beside present and missing. Keyed on `exists` alone, it fell through to the bare path and an
// unusable copy rendered exactly like an ordinary one, in the one cell an agent reads to decide
// whether the local arm is worth anything.
const OUTSIDE_ROOT = /outside the repo/i;
const isOutsideRoot = (arm) => arm.exists === null && OUTSIDE_ROOT.test(arm.reason);

function localCell(row) {
  if (!row.local) return '—';
  if (row.local.exists === false) return cell(row.local.path) + ' (missing)';
  if (row.local.exists === true) return cell(row.local.path) + ' (present)';
  if (isOutsideRoot(row.local)) return cell(row.local.path) + ' (outside repo)';
  return cell(row.local.path);
}

function remoteCell(row) {
  if (!row.remote || !row.remote.server) return '—';
  const tools = (row.remote.tools || []).map(cell).join(', ');
  const unusable = row.remote.status === 'unresolved'
    ? ' — unusable: ' + cell(row.remote.reason || 'unresolved')
    : '';
  return cell(row.remote.server) + (tools ? ' (' + tools + ')' : '') + unusable;
}

// The channel of a row that owes a version compare is not `remote` and not `local` — it is decided
// this session, by the agent, from the compare. Rendered as WORDS rather than the bare value so the
// cell reads as an instruction ("decide this by comparing") instead of a resolved destination.
function channelCell(row) {
  return row.channel === 'compare' ? 'by compare' : dash(row.channel);
}

// Everything the agent needs to run the compare, or the reason it cannot: the callable tool id, the
// key to read out of its answer, and the value to compare that against. The comparand is the BARE
// stamp — the stamp cell beside it carries the `{key}={value}` form the manifest was read with, and
// an agent comparing the tool's answer against THAT would find every copy stale. A corpus that
// declared no compare keys shows the same em dash every other empty cell does: it owes nothing.
function compareCell(row) {
  if (!row.compare) return '—';
  if (row.compare.status === 'owed') {
    return '`' + cell(row.compare.tool) + '` → ' + cell(row.compare.key) +
      ' vs ' + cell(row.compare.stamp);
  }
  return '— (' + cell(row.compare.reason || 'unavailable') + ')';
}

function statusCell(row) {
  if (row.status !== 'resolved') return 'unresolved: ' + dash(row.reason);
  return row.notes && row.notes.length ? 'resolved — ' + row.notes.map(cell).join('; ') : 'resolved';
}

function tableRow(row) {
  return '| ' + [
    cell(row.corpus),
    dash(row.kind),
    channelCell(row),
    localCell(row),
    dash(row.local && row.local.stamp),
    remoteCell(row),
    compareCell(row),
    statusCell(row),
  ].join(' | ') + ' |';
}

const TABLE_HEAD = [
  '| corpus | kind | channel | local copy | stamp | remote | compare | status |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
];

function findingLine(f) {
  const where = f.line ? ' (line ' + f.line + ')' : '';
  return '- `' + f.code + '`' + where + ' — ' + f.message;
}

// The checks section always says something. "No findings" is a fact the agent needs as much as a
// finding is: it is the difference between "the declaration is in force" and "the check did not run".
// The all-clear sentence is therefore gated on the ROWS as well as the findings — an all-clear
// printed underneath an `unresolved` row is worse than no checks section at all.
function checksSection(rows, findings) {
  const unresolved = rows.filter((r) => r.status !== 'resolved');
  const lines = findings.map(findingLine);
  if (lines.length) return lines;
  if (unresolved.length) {
    return unresolved.map((r) => `- \`unresolved\` — corpus "${r.corpus}": ${r.reason || 'no usable channel'}`);
  }
  // Both kinds of declared path are checked, so both are counted — claiming "all N paths exist"
  // while silently excluding every manifest path overstates what was verified.
  const paths = rows.filter((r) => r.local).length + rows.filter((r) => r.manifest && r.manifest.path).length;
  const denies = rows.reduce((n, r) => n + r.deny.length, 0);
  return ['- All ' + denies + ' declared deny entr' + (denies === 1 ? 'y is' : 'ies are') +
    ' present in a settings layer; all ' + paths + ' declared path' +
    (paths === 1 ? ' exists.' : 's exist.')];
}

/**
 * Assemble the envelope. Returns { text, dropped } — `dropped` is how many table rows the overflow
 * guard had to cut, which the caller reports on stderr.
 *
 * The guard cuts ROWS ONLY, from the tail, and never the rule, the checks or the marker: an agent
 * with a short table still knows how to read it and still sees what is broken, whereas an agent
 * whose payload was truncated by the platform at an arbitrary byte has a table and no instructions.
 */
function buildEnvelope(state) {
  const header = 'Nexus — access channels, resolved from `' + DECLARATION_REL + '` at session start.';
  const rule = readRule();

  if (state.unreadable) {
    const f = state.findings[0] || {};
    const where = f.line ? 'line ' + f.line + ': ' : '';
    return {
      text: [
        header,
        '',
        rule,
        '',
        'The declaration is present but unreadable — ' + where + (f.message || 'the file could not be read') +
          '; every corpus is unresolved. Fix `' + DECLARATION_REL + '` before grounding from a declared corpus.',
      ].concat(state.refresh ? ['', state.refresh] : [], [
        '',
        CLOSING,
        '',
        MARKER,
      ]).join('\n'),
      dropped: 0,
    };
  }

  const allRows = state.rows.map(tableRow);
  const allChecks = checksSection(state.rows, state.findings);
  // The refresh notice rides the FIXED FRAME, beside the rule and the marker — it is not droppable.
  // It is one line, it appears only while a newer template is actually sitting in the repo, and the
  // guard below still has both data-driven lists to cut.
  const refresh = state.refresh ? ['', state.refresh] : [];
  const assemble = (rows, dropped, checks, checksDropped) => [
    header,
    '',
    rule,
    '',
    '**Declared corpora**',
    '',
  ].concat(TABLE_HEAD, rows,
    dropped ? ['', '+' + dropped + ' corpora not shown — run the check'] : [],
    ['', '**Checks**', ''], checks,
    checksDropped ? ['+' + checksDropped + ' further findings not shown — run the check'] : [],
    refresh,
    ['', CLOSING, '', MARKER]).join('\n');

  // BOTH lists are droppable. Rows go first — a finding names something actually broken, and is
  // worth more than the row of a corpus that is fine — but the findings list is data-driven too:
  // one line per finding, and a repo adopting the declaration starts with a deny gap on every
  // corpus. Trimming rows alone terminated at "no rows left" while still over the cap, at which
  // point the platform persists the whole payload to a file and the rule, the checks AND the
  // marker all fail to reach the model — the exact outcome the guard exists to prevent.
  let dropped = 0;
  let checksDropped = 0;
  const render = () => assemble(
    allRows.slice(0, allRows.length - dropped), dropped,
    allChecks.slice(0, allChecks.length - checksDropped), checksDropped
  );
  let text = render();
  while (text.length > WARN_AT && dropped < allRows.length) {
    dropped++;
    text = render();
  }
  // Keep at least one finding line: a Checks section trimmed to nothing reads as "no findings",
  // which is the one thing it must never say while findings exist.
  while (text.length > WARN_AT && checksDropped < allChecks.length - 1) {
    checksDropped++;
    text = render();
  }
  return { text, dropped, checksDropped, oversize: text.length > WARN_AT };
}

// ── the shared load path ─────────────────────────────────────────────────────

function gather(root) {
  const home = os.homedir();
  const out = access.load(root, { homedir: home });
  if (!out.present) return { present: false };
  // A FILE-level parse error means no corpus survived, and the table would be empty while the file
  // sits there looking declared — so that case renders as the unreadable line, not as a blank table.
  const fileErrors = out.findings.filter((f) => f.level === 'file');
  if (fileErrors.length) {
    return { present: true, unreadable: true, rows: [], findings: fileErrors, draftedFrom: out.draftedFrom };
  }
  return {
    present: true,
    unreadable: false,
    rows: out.rows,
    findings: out.findings,
    draftedFrom: out.draftedFrom,
  };
}

/**
 * The one line a declared repo gets when the template it was drafted from has since changed, or null.
 *
 * NO STAMP, NO WALK. A declaration nobody drafted from a template — every one written before this
 * line existed, and every hand-written one — returns here immediately: it pays no directory walk and
 * sees no notice. That is a deliberate narrowing, and the price of it is that such a repo is never
 * told about a newer template; the guided setup writes the stamp, so the next drafted declaration is.
 *
 * ONCE PER SESSION, while the stamps differ. Saying it once ever would need persisted state, and
 * nothing in this extension writes a file.
 */
function refreshNotice(root, draftedFrom) {
  if (!draftedFrom) return null;
  const rel = access.findReceivedTemplate(root);
  if (!rel) return null;
  let content;
  try {
    content = fs.readFileSync(path.join(root, rel), 'utf8');
  } catch (e) {
    return null; // an unreadable template is not something to nag a session about
  }
  if (access.templateStamp(content) === draftedFrom) return null;
  return RELAY + 'A received access.template.yaml at ' + rel + ' differs from the one this ' +
    'declaration was drafted from — say "refresh the knowledge channels" to fold it in.';
}

const resolveRoot = (evt) =>
  process.env.CLAUDE_PROJECT_DIR || (evt && evt.cwd) || process.cwd();

// ── `--check`: the same report, as plain text, with an exit code ──────────────

function runCheck(argv) {
  // The first argument that is not a FLAG — not merely "not `--check`", which made any other flag
  // the root: `--check --verbose` looked for a declaration inside a directory named `--verbose`,
  // found none, and reported "this repo declares no access channels" about a repo that does.
  const rootArg = argv.find((a) => a.indexOf('--') !== 0);
  const root = rootArg || resolveRoot(null);
  const state = gather(root);

  if (!state.present) {
    process.stdout.write('No `' + DECLARATION_REL + '` in ' + root + ' — this repo declares no access channels.\n');
    process.exit(2);
  }
  const { text } = buildEnvelope(state);
  process.stdout.write(text + '\n');
  const unresolved = state.rows.filter((r) => r.status !== 'resolved').length;
  // Findings AND unresolved corpora both mean "not clean": a corpus can be unresolved with no
  // finding beside it (a split that declared one arm), and exiting 0 there would tell a validate
  // recipe the declaration is in force when half of it is not.
  process.exit(state.findings.length || unresolved ? 1 : 0);
}

// ── the hook path ────────────────────────────────────────────────────────────

// One shape for both payloads — the table and the nudge ride the same envelope, so a change to the
// hook-output contract can never reach one of them and miss the other.
function inject(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
  }));
  process.exit(0);
}

function emit(evt) {
  const root = resolveRoot(evt);
  const state = gather(root);
  if (!state.present) {
    // INSTALLED IS THE OPT-IN (owner ruling 2026-08-31). A repo carrying this extension and no
    // declaration is a repo mid-onboarding, so it gets the one line that tells it how to finish —
    // and how to opt out, which is disabling the plugin for this project rather than any marker
    // file of ours.
    //
    // NOT ON A COMPACTION, though. SessionStart also fires on `compact`, which is the SAME
    // conversation continuing — one that has already been told, possibly twice. `clear` starts a
    // fresh conversation and correctly nudges again; `resume` is skipped for the whole hook, at the
    // stdin handler at the foot of this file. The TABLE is the opposite case and keeps its compact
    // re-emit: a compaction is precisely when it gets lost.
    if (evt && evt.source === 'compact') process.exit(0);
    const template = access.findReceivedTemplate(root);
    inject(template ? nudgeWithTemplate(template) : NUDGE);
    return; // `inject` exits; the return keeps this branch terminal on its own terms
  }

  state.refresh = refreshNotice(root, state.draftedFrom);

  const { text, dropped, checksDropped, oversize } = buildEnvelope(state);
  if (dropped || checksDropped) {
    process.stderr.write(
      'nexus-channels inject-access: trimmed ' + dropped + ' of ' + state.rows.length + ' corpora row(s)' +
      (checksDropped ? ' and ' + checksDropped + ' finding line(s)' : '') +
      ' against the ' + WARN_AT + '-char tripwire (platform hook-output cap is ' + PLATFORM_CAP +
      '). Run the check for the full report.\n'
    );
  }
  if (oversize) {
    // Nothing left to trim and still over. Say so plainly — the platform persists an oversize hook
    // output to a file and substitutes a short preview, so this envelope did NOT reach the model and
    // stderr is the only place that can say it.
    process.stderr.write(
      'nexus-channels inject-access: the envelope is ' + text.length + ' chars after trimming ' +
      'everything trimmable, still over the ' + WARN_AT + '-char tripwire (cap ' + PLATFORM_CAP +
      '). An oversize hook output is persisted to a file and replaced by a preview, so it may not ' +
      'reach the model. Reduce the declaration or fix the findings.\n'
    );
  }
  if (state.findings.length) {
    process.stderr.write(
      'nexus-channels inject-access: ' + state.findings.length + ' finding(s) in `' + DECLARATION_REL +
      '` — see the Checks section of the session envelope.\n'
    );
  }
  inject(text);
}

if (process.argv.includes('--check')) {
  runCheck(process.argv.slice(2));
} else {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => {
    let evt = {};
    try {
      evt = JSON.parse(input || '{}');
    } catch (e) {
      evt = {}; // unparseable event — fall through and inject (fail open), as core's emitters do
    }
    // On resume the transcript is reloaded with the original injection, so re-emitting would
    // duplicate the envelope. Core's three do the same.
    if (evt && evt.source === 'resume') process.exit(0);
    emit(evt);
  });
}
