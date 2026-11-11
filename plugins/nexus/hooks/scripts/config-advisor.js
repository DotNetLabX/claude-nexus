#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit) config-time model advisory. Async, advice-only — it NEVER blocks and
 * never changes a setting.
 *
 * WHY AN ADVISORY AND NOT A GATE. The only warning wanted is while the user is *configuring* models:
 * check whether a producer and its checker resolve to the same family, and if so say so and suggest an
 * alternate. The user can always supersede, so no runtime model gate ships, and this is the whole
 * mechanism.
 *
 * MODEL-NEUTRAL BY CONSTRUCTION. Every model fact here comes from the model presets table
 * (`lib/model-presets.json`, read through `lib/model-presets.js`): the families, the default ranking,
 * the families never suggested under the preset in force, and which families can be a checker. A seat
 * resolves to the per-agent entry when the config has one — the value as the user wrote it, since this
 * advises on the file being configured — else to
 * the preset's model for the seat where the preset names one, else to the SHIPPED FRONTMATTER read at
 * runtime from this plugin's own `agents/{name}.md`, resolved PLUGIN-relative — never from the project
 * tree: `{project}/agents/` exists in no consuming repo, so a project-relative read would fail silent
 * forever with a green test sitting over it. A pair whose two seats both come from the preset is never
 * reported: the preset's reader-pair order already seats another family at spawn. A seat's value is
 * compared by the family it names (a full model id reads as its family), and a name outside the
 * table's families is its own family — kept, compared and suggested like any other. The job checks
 * below use the same list, since a job value must be one of the families — save `codex`:
 * usable at `doneCheck`, where a repo may name Codex as its done check, and at the helper jobs
 * (`discovery`, `audit`, `general`), where it may also be `{ "model": "codex", "effort": "{level}" }`;
 * at a miner key `codex` draws a line naming nexus-miner's mining job table, where Codex already leads
 * the jobs that only read; at every other job `codex` draws the same outside-the-families line, and it
 * is never listed as a family.
 * The miner pair is reported only where `minerJudge` equals `minerGenerator`: under the job table the
 * judge key sets a fallback, a different model by design.
 *
 * FAMILIES NEVER SUGGESTED, AND WHY THAT IS NOT A BREACH OF IT. `NEVER_SUGGESTED` and `NOT_A_CHECKER`
 * are not permitted-model lists and not judgments about what any seat is configured to — a user may still
 * set any seat to either. The preset in force names the families this advisory never suggests (a family
 * the preset does not seat on its own), and a family the table marks as no checker is in no pair.
 *
 * NO SECOND ADVISORY. On per-agent entries only the PAIRING is reported. A producer seat may name any
 * model — policing the value would re-impose exactly what the reversal freed. One exception is
 * the `jobs` and `codex` blocks: their keys and values are closed lists, so a typo there is worth one
 * line each. A further exception is the top-level `fullChecks` key, the path patterns the architect
 * reads to pick a plan's check level: a value that is not a list of non-blank strings draws one line.
 * A per-agent `effort` key draws one line too, saying what it does, never that it is wrong.
 *
 * `modelRanking` default is the table's ranking, best first. It feeds this advisory only — no checker is
 * picked from it — and it is an ORDERING default, never a list of permitted models.
 *
 * Fail silent on anything unparseable, on any path that is not the config itself, and where the presets
 * library cannot be loaded.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// From hooks/scripts/ up to the plugin root — the inject-rules.js pattern.
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');

let presets = null;
try { presets = require('./lib/model-presets'); } catch { presets = null; }
const DEFAULT_RANKING = presets ? [...presets.table().ranking] : [];
// Never a checker, so never a suggested checker model.
const NOT_A_CHECKER = presets ? presets.families().filter((f) => !f.checker).map((f) => f.name) : [];
const FAMILY_RE = presets ? presets.familyPattern() : /(?!)/;

// The pairing doctrine's producer -> checker pairs (ADR-93: the verifier/critic/judge of any
// judgment artifact). Every agent against every other would report collisions nobody acts on.
const PAIRS = [
  ['architect', 'critic'],
  ['po', 'critic'],
  ['learner', 'critic'],
  ['developer', 'reviewer'],
];

// The Claude model families the presets table knows, best first.
const FAMILIES = presets ? presets.families().map((f) => f.name) : [];
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const FAMILY_COUNT = COUNT_WORDS[FAMILIES.length] || String(FAMILIES.length);

const JOBS = [
  'discovery', 'audit', 'general', 'research', 'secondReader', 'doneCheck', 'conformanceReview',
  'minerGenerator', 'minerJudge', 'minerMechanical',
];
// The names the unknown-key line prints: the jobs this plugin itself reads. A name another plugin
// reads stays recognised above and is never listed to a user who did not ask for it.
const OWN_JOBS = ['discovery', 'audit', 'general', 'secondReader', 'doneCheck'];
const HELPER_JOBS = ['discovery', 'audit', 'general'];
const CODEX_JOB_KEYS = ['model', 'effort'];
const RESEARCH_TIERS = ['routine', 'highStakes'];
const CHECKER_JOBS = ['secondReader', 'doneCheck'];
const MINER_JOBS = ['minerGenerator', 'minerJudge', 'minerMechanical'];
const CODEX = 'codex';
const CODEX_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];

// The family a model value reads as: a family named as a whole word (a full model id, an alias with a
// suffix), else the value itself, so an unknown name stays its own family.
function family(value) {
  const v = String(value).trim().toLowerCase();
  const m = v.match(FAMILY_RE);
  return m ? m[1] : v;
}

/**
 * The model an agent resolves to, and where it came from: the config's entry ('repo'), else the preset's
 * model for the seat ('preset'), else the shipped frontmatter default ('agent file'). The empty string is
 * unresolved.
 */
function resolveSeat(agent, cfg, preset) {
  const entry = cfg && cfg[agent];
  if (entry && typeof entry.model === 'string' && entry.model.trim()) {
    return { model: entry.model.trim().toLowerCase(), from: 'repo' };
  }
  const seat = presets.seatFor(preset.name, { role: agent });
  if (seat) return { model: seat.model.toLowerCase(), from: 'preset' };
  try {
    const text = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = m ? m[1].match(/^model:\s*(\S+)\s*$/m) : null;
    return { model: fm ? fm[1].toLowerCase() : '', from: 'agent file' };
  } catch { return { model: '', from: 'agent file' }; }
}

const resolveModel = (agent, cfg, preset) => resolveSeat(agent, cfg, preset).model;

/** The family the preset in force runs its own done check on, or null where the architect's resolved model decides. */
function presetDoneCheckFamily(preset) {
  const seat = presets.seatFor(preset.name, { job: 'doneCheck' });
  return seat ? family(seat.model) : null;
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
// JSON form, so a value with a line break or a quote cannot split or blur its advisory line.
const show = (v) => JSON.stringify(v);
const PREFIX = 'nexus-agents.json:';

// A job value is checked exactly: only a bare family name is usable, because the spawn reads any
// other spelling as unset. Returns the family, or '' when the value is not one.
function exactFamily(v) {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return FAMILIES.includes(s) ? s : '';
}

const isCodex = (v) => typeof v === 'string' && v.trim().toLowerCase() === CODEX;

// The effort is matched exactly, as codex-job.js matches it before sending it.
function checkCodexJob(key, v) {
  if (!isCodex(v.model) || Object.keys(v).some((k) => !CODEX_JOB_KEYS.includes(k))) {
    return [`${PREFIX} jobs.${key} takes a family name, codex, or {"model": "codex", "effort": "{level}"} — the spawn reads it as unset.`];
  }
  if ('effort' in v && !CODEX_EFFORTS.includes(v.effort)) {
    return [`${PREFIX} jobs.${key}.effort is ${show(v.effort)}, outside the Codex levels (${CODEX_EFFORTS.join(', ')}) — the entry's effort is not sent.`];
  }
  return [];
}

function checkJobs(jobs, cfg, preset) {
  const out = [];
  const valueLine = (key, v) =>
    `${PREFIX} jobs.${key} is ${show(v)}, outside the ${FAMILY_COUNT} families (${FAMILIES.join(', ')}) — the spawn reads it as unset.`;
  for (const [key, v] of Object.entries(jobs)) {
    if (!JOBS.includes(key)) {
      out.push(`${PREFIX} jobs.${key} is not a job name, so nothing reads it (the job names: ${OWN_JOBS.join(', ')}).`); // [config-advisor BR-73]
      continue;
    }
    if (key === 'research') {
      if (typeof v === 'string') {
        if (!exactFamily(v)) out.push(valueLine(key, v));
      } else if (!isObject(v) || Object.keys(v).some((t) => !RESEARCH_TIERS.includes(t))) {
        out.push(`${PREFIX} jobs.research takes a family name or an object with ${RESEARCH_TIERS.join(' and ')} — the spawn reads it as unset.`);
      } else {
        for (const [tier, tv] of Object.entries(v)) if (!exactFamily(tv)) out.push(valueLine(`research.${tier}`, tv));
      }
      continue;
    }
    if (HELPER_JOBS.includes(key) && (isCodex(v) || isObject(v))) {
      if (isObject(v)) out.push(...checkCodexJob(key, v));
      continue;
    }
    if (key === 'doneCheck' && isCodex(v)) continue;
    if (MINER_JOBS.includes(key) && isCodex(v)) {
      out.push(`${PREFIX} jobs.${key} is ${show(v)} — Codex already leads the mining jobs that only read, by nexus-miner's ` +
        `mining job table (tools/stage-models.json); a miner key names a Claude family (${FAMILIES.join(', ')}) ` +
        `for the Claude jobs and fallbacks, so the spawn reads it as unset.`);
      continue;
    }
    const f = exactFamily(v);
    if (!f) { out.push(valueLine(key, v)); continue; }
    if (NOT_A_CHECKER.includes(f) && CHECKER_JOBS.includes(key)) {
      out.push(`${PREFIX} jobs.${key} is ${f}, which is not a checker — the spawn reads it as unset.`);
    } else if (key === 'doneCheck' && family(resolveModel('developer', cfg, preset)) === f && f !== presetDoneCheckFamily(preset)) {
      out.push(`${PREFIX} jobs.doneCheck is ${f}, the developer's family — the done check would grade work from its own family; your setting stands.`);
    }
  }
  const judge = exactFamily(jobs.minerJudge);
  const generator = exactFamily(jobs.minerGenerator);
  if (judge && generator && judge === generator) {
    out.push(`${PREFIX} jobs.minerJudge (${judge}) equals jobs.minerGenerator (${generator}) — a mining judge ` +
      `on its producer's model is no independent check (the key sets the judge fallbacks where Codex leads, and ` +
      `the judge itself in mine-from-spec); your setting stands.`);
  }
  return out;
}

function checkCodex(codex) {
  const out = [];
  if ('timeLimitMinutes' in codex) {
    const v = codex.timeLimitMinutes;
    // JSON.parse turns an overflowing literal such as 1e309 into Infinity.
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      out.push(`${PREFIX} codex.timeLimitMinutes is ${show(v)}, not a positive number of minutes.`);
    }
  }
  if ('effort' in codex && !CODEX_EFFORTS.includes(codex.effort)) {
    out.push(`${PREFIX} codex.effort is ${show(codex.effort)}, outside the Codex levels (${CODEX_EFFORTS.join(', ')}).`);
  }
  return out;
}

// An empty array is a deliberate "none", so it counts as a list.
const isPatternList = (v) => Array.isArray(v) && v.every((p) => typeof p === 'string' && /\S/.test(p));

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    if (!presets) return process.exit(0);
    const data = JSON.parse(input || '{}');
    if (!/^(Write|Edit)$/.test(data.tool_name || '')) return process.exit(0);

    const ti = data.tool_input || {};
    const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
    if (!/(^|\/)\.claude\/nexus-agents\.json$/.test(fp)) return process.exit(0);

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const abs = path.isAbsolute(fp) ? fp : path.join(root, fp);
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    const preset = { name: presets.resolvePreset({ config: cfg, env: process.env }).preset };
    const NEVER_SUGGESTED = presets.neverSuggested(preset.name);
    const neverText = NEVER_SUGGESTED.join(', ');
    const notCheckerText = NOT_A_CHECKER.join(', ');

    const ranking = Array.isArray(cfg.modelRanking) && cfg.modelRanking.length
      ? cfg.modelRanking.map((r) => String(r).toLowerCase())
      : DEFAULT_RANKING;

    const out = [];
    for (const [producer, checker] of PAIRS) {
      const ps = resolveSeat(producer, cfg, preset);
      const cs = resolveSeat(checker, cfg, preset);
      const pm = ps.model;
      const cm = cs.model;
      if (!pm || !cm || family(pm) !== family(cm)) continue;
      if (ps.from === 'preset' && cs.from === 'preset') continue;
      const pf = family(pm);
      // The LAST eligible entry — the cheapest. A suggestion only: the reader-pair list picks every
      // checker at spawn and never reads the ranking (`agents-workflow.md` § Critic rounds).
      const eligible = ranking.filter((r) => {
        const f = family(r);
        return f !== '' && f !== pf && !NEVER_SUGGESTED.includes(f) && !NOT_A_CHECKER.includes(f);
      });
      const alternate = eligible.length ? eligible[eligible.length - 1] : '';
      out.push(alternate
        ? `nexus-agents.json: ${checker} and ${producer} both resolve to ${pf} — at spawn time the ` +
          `reader-pair list puts a main reader from another family in the seat. Suggested from modelRanking ` +
          `(${ranking.join(' > ')} order): to make it explicit set ${checker} to ${alternate}; or keep it — ` +
          `your setting stands and the seat substitutes.`
        // Nothing to suggest, so no empty slot reaches the user. The seat still pairs: the list's last
        // two pairs always leave a main reader outside the author's family.
        : `nexus-agents.json: ${checker} and ${producer} both resolve to ${pf}, and the ` +
          `${ranking.join(' > ')} order leaves no eligible alternate once ${pf}, ${neverText} and ` +
          `${notCheckerText} are removed (${neverText} is never suggested — it stays the user's ` +
          `choice — and ${notCheckerText} is not a checker). The seat still pairs: at spawn time the ` +
          `reader-pair list puts a main reader from another family in the seat. For a suggestion here, ` +
          `add another family to modelRanking.`
      );
    }
    if (isObject(cfg.jobs)) out.push(...checkJobs(cfg.jobs, cfg, preset));
    if (isObject(cfg.codex)) out.push(...checkCodex(cfg.codex));
    // `in` throws on a scalar config, which would silence the collision lines already gathered.
    if (isObject(cfg) && 'fullChecks' in cfg && !isPatternList(cfg.fullChecks)) {
      out.push(`${PREFIX} fullChecks is ${show(cfg.fullChecks)}, not a list of path patterns — the architect reads it as unset.`);
    }
    const perAgentEffort = Object.entries(cfg)
      .some(([key, v]) => !['jobs', 'codex', 'fullChecks'].includes(key) && isObject(v) && 'effort' in v);
    if (perAgentEffort) {
      out.push(`${PREFIX} a per-agent effort value is a line in the dispatch prompt only — it is never ` +
        `passed as the Agent tool's per-spawn effort; an agent's baseline effort is its agent file's ` +
        `effort, or at the critic and reviewer seats the effort-by-model table's value; an explicit ` +
        `per-spawn effort takes precedence.`);
    }
    if (out.length) process.stdout.write(JSON.stringify({ systemMessage: out.join('\n') }));
  } catch { /* fail silent — advice must never wedge a config edit */ }
  process.exit(0);
});
