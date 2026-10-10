#!/usr/bin/env node
/**
 * Nexus PostToolUse(Read|Bash|PowerShell) read-tracker. Async, observe-only — never blocks
 * (PostToolUse cannot block, and this must never wedge a run).
 *
 * Why this exists (ADR-22): the read-once-per-round discipline is prose in every agent file,
 * and prose measurably fails over long runs (F16: the architect re-read its own plan.md ×35,
 * ~2.5MB through context). A PreToolUse deny would wedge legitimate reads and is dropped for
 * background subagents anyway (ADR-13) — so the only honest mechanism is rule + nudge +
 * deterministic detection, the same shape boundary-detector.js uses for spawns:
 *   - 2nd same-round read of a file  -> corrective systemMessage (best-effort; whether it
 *     reaches a background subagent's context is unverified — Probe P1 proved PostToolUse
 *     fires there, not that hook output is delivered)
 *   - 3rd+ same-round read           -> one line in .claude/audit/violations.log, which the
 *     team lead triages at every checkpoint (guaranteed detection layer)
 *
 * Round boundary: the content of .claude/.pipeline-state OR the session id changing — the
 * team lead rewrites the token at every spawn/resume, so a token change IS a new round.
 * Within a round, a per-file decay is the fallback boundary: a repeat read counts only within
 * DECAY_MS (30 min) of the previous read of the same file, otherwise the count resets — this
 * bounds a token-less, hours-long session that never rolls its round (ADR-61 part 4: a solo
 * session re-read plan.md x6 across ~12 hours as one "round") while keeping the F16 tight-loop
 * catch intact.
 *
 * TWO BLIND SPOTS CLOSED (F81 Step 14) — each let a re-read escape the count entirely:
 *   - THE SHELL. A file read through `cat`/`head`/`Get-Content` spends exactly the context a
 *     `Read` spends, and this environment steers reads through the shell by policy. So `Bash`
 *     and `PowerShell` payloads are parsed for read-shaped commands and counted on the SAME key
 *     a `Read` of that path would use — one count per distinct path per command.
 *   - IDENTICAL SLICES. For the `Read` TOOL, chunked reads over DISTINCT ranges stay one logical
 *     read (the sanctioned section-targeting pattern), but re-fetching the SAME (file, offset,
 *     limit) is a plain repeat and now counts — keyed `agent|file#offset-limit`, so distinct ranges
 *     never collide. The range exemption is `Read`-ONLY: a shell range (`sed -n '1,40p'`,
 *     `Get-Content -TotalCount`) is counted as a read of the WHOLE file, because the range would
 *     have to be parsed back out of half a dozen flag dialects to be trusted. Consequence, stated
 *     plainly rather than hidden: section-targeting one file through several shell ranges DOES
 *     accumulate a count and can reach the violations tier. Section-target with `Read`
 *     offset/limit, which is the sanctioned pattern the rule text already points at.
 *
 * Shell parsing is deliberately conservative: it under-counts rather than misattributes. A
 * segment carrying a write redirect (`>`/`>>`) or `sed -i` is a WRITE, not a read, and is
 * dropped whole. Known limits, both fail toward silence: a `|` or `;` inside a quoted argument
 * splits the command early, and a read verb reached through a variable or an alias is invisible.
 *
 * State: .claude/audit/read-tracker.json — { session, token, counts: { "agent|file": [n, lastTs] } }.
 * A deliberate exception to boundary-detector's zero-footprint posture (counting across
 * calls needs state); reset on every round change, and per file on decay. A count value that is
 * not the [n, lastTs] shape (e.g. a bare number from a pre-decay state file) is treated as absent
 * and reset, never destructured blindly. Fail silent on any error.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// A repeat read counts only within this window of the previous read of the same file; outside it,
// the count resets. Bounds a token-less, hours-long session that never rolls its round (ADR-61
// part 4) without weakening the F16 tight-loop catch.
const DECAY_MS = 30 * 60 * 1000; // 30 minutes

// The tools whose payloads are inspected. `PowerShell` is this environment's second shell tool;
// its input field is assumed to be `command`, same as Bash (unverified — see the plan's probe).
const TRACKED_TOOLS = /^(Read|Bash|PowerShell)$/;
// Command words that read a file to stdout. `gc`/`type` are the PowerShell/cmd spellings.
const READ_VERBS = /^(cat|head|tail|sed|awk|less|more|type|get-content|gc)$/;
// Verbs whose FIRST non-option operand is a script/program, not a file (`sed -n '1,40p' a.md`).
const SCRIPT_FIRST = /^(sed|awk)$/;
// A count/offset operand (`head -n 5 a.md`, `tail -n +100 a.md`) is never a path.
const NUMERIC = /^[+-]?\d+$/;

// Split a shell word list, honouring single and double quotes so a quoted script operand
// (`'1,40p'`, `'{print $1}'`) survives as ONE token.
function tokenize(segment) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(segment)) !== null) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  return out;
}

// File operands of ONE command segment, or [] when the segment is not a read.
function segmentPaths(segment, tool) {
  // A redirect makes the segment a write; an in-place edit is a write too. Neither is a read.
  if (/[<>]/.test(segment)) return [];
  const tokens = tokenize(segment);
  if (!tokens.length) return [];
  // The verb is the leading word, path-stripped (`/usr/bin/cat` -> `cat`) and case-folded.
  const verb = String(tokens[0]).replace(/\\/g, '/').split('/').pop().toLowerCase();
  if (!READ_VERBS.test(verb)) return [];
  // `type` reads a file only in cmd/PowerShell. In a POSIX shell it is the builtin that resolves a
  // COMMAND name, so `type node` would otherwise be counted as repeat reads of a file named `node`.
  if (verb === 'type' && tool !== 'PowerShell') return [];
  // Both spellings of sed's in-place flag. The short-form pattern cannot match a long option — it
  // needs letters-then-`i` right after a single dash — so `--expression` is not mistaken for it.
  if (verb === 'sed' && tokens.some((t) => /^-[a-z]*i/i.test(t) || /^--in-place(=|$)/i.test(t))) return [];

  const paths = [];
  let scriptPending = SCRIPT_FIRST.test(verb);
  for (const raw of tokens.slice(1)) {
    const t = String(raw);
    if (t.startsWith('-')) continue;            // an option flag, and a named param's own token
    if (t.startsWith('+')) continue;            // a pager directive (`less +G`, `more +/pattern`)
    if (NUMERIC.test(t)) continue;              // a count/offset operand, never a path
    if (scriptPending) { scriptPending = false; continue; } // sed/awk program text
    if (/[$=*?]/.test(t)) continue;             // a variable, assignment, or unexpanded glob
    // A surviving quote means the split landed INSIDE a quoted argument, so this fragment is not a
    // real path. Dropping it keeps that known limit failing toward silence instead of inventing a
    // path — `cat 'a;b.md'` would otherwise bank a file called `'a`.
    if (/['"]/.test(t)) continue;
    // A PowerShell path list (`-Path a.md,b.md`) is one token naming several files.
    for (const part of t.split(',')) if (part) paths.push(part);
  }
  return paths;
}

// Distinct file operands across a whole command — one count per path, however many times a single
// command names it. Paths are RESOLVED against the project root: a shell operand is usually relative
// (`cat docs/a.md`) while the Read tool's file_path is absolute, so without resolving them one file
// would hold two or three independent counters and never reach a nudge — precisely the blind spot
// this parsing exists to close. It also stops `cat README.md` in two different trees from colliding.
function shellPaths(command, tool, root) {
  const seen = new Map();
  for (const segment of String(command).split(/&&|\|\||[|;\n]/)) {
    for (const p of segmentPaths(segment, tool)) {
      let fp;
      try { fp = path.resolve(root, p).replace(/\\/g, '/'); } catch { continue; }
      if (!seen.has(fp.toLowerCase())) seen.set(fp.toLowerCase(), fp);
    }
  }
  return [...seen.values()];
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const tool = String(data.tool_name || '');
    if (!TRACKED_TOOLS.test(tool)) return process.exit(0);

    const ti = data.tool_input || {};
    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

    // Every path this one tool call read, as { fp, slice } — `slice` is '' for a whole-file read
    // and `#offset-limit` for a chunked one, so distinct ranges of one file never share a key
    // (each stays at n=1) while an identical range repeat lands on the same key and counts.
    let targets;
    if (tool === 'Read') {
      const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
      if (!fp) return process.exit(0);
      const chunked = ti.offset !== undefined || ti.limit !== undefined;
      // An absent, null or empty offset/limit all mean "this end is unbounded" and must produce the
      // SAME key — a caller that sometimes sends `offset: null` and sometimes omits it would
      // otherwise get two counters for one slice, and no repeat would ever be detected.
      const part = (v) => (v === undefined || v === null || v === '' ? '' : String(v));
      targets = [{ fp, slice: chunked ? `#${part(ti.offset)}-${part(ti.limit)}` : '' }];
    } else {
      targets = shellPaths(ti.command || '', tool, root).map((fp) => ({ fp, slice: '' }));
    }
    if (!targets.length) return process.exit(0);

    const agent = data.agent_type
      ? String(data.agent_type).toLowerCase().split(/[:/]/).pop()
      : 'main';
    const session = String(data.session_id || '');

    const auditDir = path.join(root, '.claude', 'audit');
    const stateFile = path.join(auditDir, 'read-tracker.json');

    let token = '';
    try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

    let state = null;
    try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* fresh */ }
    if (!state || state.session !== session || state.token !== token) {
      state = { session, token, counts: {} }; // new round — every count resets
    }

    const now = Date.now();
    // Per-file round decay: a repeat read counts only within DECAY_MS of the PREVIOUS read of the
    // same file. lastTs is refreshed on every read below (counted OR reset), so the window slides
    // — measured from the previous read, not fixed from the first (else a >30-min tight loop would
    // escape once its total span exceeded the window). A value that is not the [n, lastTs] shape
    // (a bare number from a pre-decay state file, a foreign value) is treated as absent and reset
    // — never destructured blindly, which would throw into the fail-silent catch.
    const counted = [];
    for (const { fp, slice } of targets) {
      const key = `${agent}|${fp.toLowerCase()}${slice}`;
      const prev = state.counts[key];
      const live = Array.isArray(prev) && typeof prev[0] === 'number' && typeof prev[1] === 'number'
        && (now - prev[1]) <= DECAY_MS;
      const n = live ? prev[0] + 1 : 1;
      state.counts[key] = [n, now];
      counted.push({ fp, n });
    }

    fs.mkdirSync(auditDir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state));

    // Persistence above is unconditional — the count is durable even for a silent first read.
    const repeats = counted.filter((c) => c.n >= 2);
    if (!repeats.length) return process.exit(0);

    for (const { fp, n } of repeats.filter((c) => c.n >= 3)) {
      fs.appendFileSync(
        path.join(auditDir, 'violations.log'),
        JSON.stringify({
          ts: new Date().toISOString(), agent, tool, path: fp,
          rule: `same-round re-read x${n} — read each file once per round (ADR-22, agents-workflow Read Discipline)`,
        }) + '\n'
      );
    }
    // One combined message however many paths one command re-read. The single-path form is
    // byte-identical to the pre-F81 wording — BR-7 (golden) pins it verbatim, and widening the
    // tracker's INPUT is no reason to change its OUTPUT contract.
    process.stdout.write(JSON.stringify({
      systemMessage:
        repeats.map(({ fp, n }) => `Nexus read-tracker: ${agent} re-read ${fp} (x${n} this round).`).join(' ') +
        ' Read each file once per round — ' +
        'it is already in your context; work from it. Re-read only after a compaction or an external change ' +
        '(agents-workflow Read Discipline).',
    }));
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
