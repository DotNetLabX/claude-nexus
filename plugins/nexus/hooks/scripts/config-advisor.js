#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit) config-time model advisory. Async, advice-only — it NEVER blocks and
 * never changes a setting.
 *
 * WHY AN ADVISORY AND NOT A GATE. The W4 probes measured the model-override rule below floor, and the
 * first ruling was a runtime deny at spawn time. The owner REVERSED that on 2026-09-07: the plugin is
 * not built for one repo, opus and sonnet are its shipped defaults, and the only warning wanted is
 * while the user is *configuring* models — check whether a producer and its checker resolve to the
 * same family, and if so say so and suggest an alternate. The user can always supersede. So no
 * runtime model gate ships, and this is the whole mechanism.
 *
 * MODEL-NEUTRAL BY CONSTRUCTION. A seat's family comes from the per-agent entry when the config has
 * one, else from the SHIPPED FRONTMATTER read at runtime from this plugin's own `agents/{name}.md`,
 * resolved PLUGIN-relative. Never from a hardcoded seat-to-model table, and never from the project tree:
 * `{project}/agents/` exists in no consuming repo, so a project-relative read would fail silent
 * forever with a green test sitting over it. The one closed list is `FAMILIES`, the four Claude model
 * families: a seat's value is compared by the family it names (`claude-opus-5-5` reads as `opus`),
 * and a name outside the four is its own family — kept, compared and suggested like any other. The
 * job checks below use the same list, since a job value must be one of the four.
 *
 * TWO NAMED FAMILIES NEVER SUGGESTED, AND WHY THAT IS NOT A BREACH OF IT. `NEVER_SUGGESTED` and
 * `NOT_A_CHECKER` are not permitted-model lists and not judgments about what any seat is configured to
 * — a user may still set any seat to either. The premium family is never suggested by this advisory:
 * its one automatic pick is the reader-pair list's unattended stand-in for Codex, made at spawn
 * (`agents-workflow.md` § Critic rounds), and `haiku` is in no pair, so the advisory suggests neither.
 *
 * NO SECOND ADVISORY. On per-agent entries only the PAIRING is reported. A producer seat may name any
 * model — policing the value would re-impose exactly what the reversal freed. The one exception is
 * the `jobs` and `codex` blocks: their keys and values are closed lists, so a typo there is worth one
 * line each. A per-agent `effort` key draws one line too, saying what it does, never that it is wrong.
 *
 * `modelRanking` default is `['fable', 'opus', 'sonnet']`, the ordering the prose already states
 * (`team-lead.md` § Pre-Flight, item 4b). It feeds this advisory only — no checker is picked from it —
 * and it is an ORDERING default, never a list of permitted models.
 *
 * Fail silent on anything unparseable, and on any path that is not the config itself.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// From hooks/scripts/ up to the plugin root — the inject-rules.js pattern.
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_RANKING = ['fable', 'opus', 'sonnet'];

// The premium family, never suggested as an alternate (see the header note above).
const NEVER_SUGGESTED = 'fable';
// Never a checker, so never a suggested checker model.
const NOT_A_CHECKER = 'haiku';

// The pairing doctrine's producer -> checker pairs (ADR-93: the verifier/critic/judge of any
// judgment artifact). Every agent against every other would report collisions nobody acts on.
const PAIRS = [
  ['architect', 'critic'],
  ['po', 'critic'],
  ['learner', 'critic'],
  ['developer', 'reviewer'],
];

// The four Claude model families, in the miner doctrine's tier order (best first).
const FAMILIES = ['fable', 'opus', 'sonnet', 'haiku'];

const JOBS = [
  'discovery', 'audit', 'research', 'panelPeer', 'secondReader', 'doneCheck', 'conformanceReview',
  'minerGenerator', 'minerJudge', 'minerMechanical',
];
// The names the unknown-key line prints: the jobs this plugin itself reads. A name another plugin
// reads stays recognised above and is never listed to a user who did not ask for it.
const OWN_JOBS = ['discovery', 'audit', 'secondReader', 'doneCheck'];
const RESEARCH_TIERS = ['routine', 'highStakes'];
const CHECKER_JOBS = ['secondReader', 'doneCheck'];
const PANEL_PEERS = ['fable', 'opus'];
const CODEX_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];

// The family a model value reads as: a family named as a whole word ('claude-opus-5-5', 'opus[1m]'),
// else the value itself, so an unknown name stays its own family.
function family(value) {
  const v = String(value).trim().toLowerCase();
  const m = v.match(/\b(fable|opus|sonnet|haiku)\b/);
  return m ? m[1] : v;
}

/** The model an agent resolves to: the config's entry, else the shipped frontmatter default. */
function resolveModel(agent, cfg) {
  const entry = cfg && cfg[agent];
  if (entry && typeof entry.model === 'string' && entry.model.trim()) return entry.model.trim().toLowerCase();
  try {
    const text = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = m ? m[1].match(/^model:\s*(\S+)\s*$/m) : null;
    return fm ? fm[1].toLowerCase() : '';
  } catch { return ''; }
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

function checkJobs(jobs, cfg) {
  const out = [];
  const valueLine = (key, v) =>
    `${PREFIX} jobs.${key} is ${show(v)}, outside the four families (${FAMILIES.join(', ')}) — the spawn reads it as unset.`;
  for (const [key, v] of Object.entries(jobs)) {
    if (!JOBS.includes(key)) {
      out.push(`${PREFIX} jobs.${key} is not a job name, so nothing reads it (the job names: ${OWN_JOBS.join(', ')}).`); // [config-advisor BR-60]
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
    const f = exactFamily(v);
    if (!f) { out.push(valueLine(key, v)); continue; }
    if (f === NOT_A_CHECKER && CHECKER_JOBS.includes(key)) {
      out.push(`${PREFIX} jobs.${key} is ${f}, which is not a checker — the spawn reads it as unset.`);
    } else if (key === 'panelPeer' && !PANEL_PEERS.includes(f)) {
      out.push(`${PREFIX} jobs.panelPeer is ${f}; the panel peer takes ${PANEL_PEERS.join(' or ')} only — the spawn reads it as unset.`);
    } else if (key === 'doneCheck' && family(resolveModel('developer', cfg)) === f) {
      out.push(`${PREFIX} jobs.doneCheck is ${f}, the developer's family — the done check would grade work from its own family; your setting stands.`);
    }
  }
  // FAMILIES is in tier order, best first: a higher index is a lower tier.
  const judge = exactFamily(jobs.minerJudge);
  const generator = exactFamily(jobs.minerGenerator);
  if (judge && generator && FAMILIES.indexOf(judge) >= FAMILIES.indexOf(generator)) {
    out.push(`${PREFIX} jobs.minerJudge (${judge}) is at or below jobs.minerGenerator (${generator}) — ` +
      `verification never runs below generation on a same-model pair; your setting stands.`);
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

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    if (!/^(Write|Edit)$/.test(data.tool_name || '')) return process.exit(0);

    const ti = data.tool_input || {};
    const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
    if (!/(^|\/)\.claude\/nexus-agents\.json$/.test(fp)) return process.exit(0);

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const abs = path.isAbsolute(fp) ? fp : path.join(root, fp);
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));

    const ranking = Array.isArray(cfg.modelRanking) && cfg.modelRanking.length
      ? cfg.modelRanking.map((r) => String(r).toLowerCase())
      : DEFAULT_RANKING;

    const out = [];
    for (const [producer, checker] of PAIRS) {
      const pm = resolveModel(producer, cfg);
      const cm = resolveModel(checker, cfg);
      if (!pm || !cm || family(pm) !== family(cm)) continue;
      const pf = family(pm);
      // The LAST eligible entry — the cheapest. A suggestion only: the reader-pair list picks every
      // checker at spawn and never reads the ranking (`agents-workflow.md` § Critic rounds).
      const eligible = ranking.filter((r) => {
        const f = family(r);
        return f !== '' && f !== pf && f !== NEVER_SUGGESTED && f !== NOT_A_CHECKER;
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
          `${ranking.join(' > ')} order leaves no eligible alternate once ${pf}, ${NEVER_SUGGESTED} and ` +
          `${NOT_A_CHECKER} are removed (${NEVER_SUGGESTED} is never suggested — it stays the user's ` +
          `choice — and ${NOT_A_CHECKER} is not a checker). The seat still pairs: at spawn time the ` +
          `reader-pair list puts a main reader from another family in the seat. For a suggestion here, ` +
          `add another family to modelRanking.`
      );
    }
    if (isObject(cfg.jobs)) out.push(...checkJobs(cfg.jobs, cfg));
    if (isObject(cfg.codex)) out.push(...checkCodex(cfg.codex));
    const perAgentEffort = Object.entries(cfg)
      .some(([key, v]) => key !== 'jobs' && key !== 'codex' && isObject(v) && 'effort' in v);
    if (perAgentEffort) {
      out.push(`${PREFIX} a per-agent effort value is a line in the dispatch prompt only — the Agent tool ` +
        `takes no effort, and an agent's reasoning effort comes from the agent's frontmatter.`);
    }
    if (out.length) process.stdout.write(JSON.stringify({ systemMessage: out.join('\n') }));
  } catch { /* fail silent — advice must never wedge a config edit */ }
  process.exit(0);
});
