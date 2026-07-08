// Merge/triage front-end (adhoc-SddMergeGen, Step 4) — the SddLifecycle M1/M3 merge actor.
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/merge.workflow.js" }, { ...args }).
//
// WHAT IT DOES: loads both blind arms' already-mined rule sets (spec-rules.md + the code-arm class KB),
// crosswalks + triages them into the five delta buckets (harness/lib/merge-rules.mjs), updates the
// canonical rule registry (harness/lib/rules-registry.mjs — no-delete, changelog, provenance-mandatory),
// distills the registry into the hot-layer form + lints its token budget (harness/lib/kb-distill.mjs),
// and writes a self-contained run report. Actor skeleton mirrors harness/spec-cover-calc.workflow.js
// (the `_args` pattern, the Load→compute→Write phase shape).
//
// THE ACTORS (never collapse them — same design posture as the spec-cover front-ends):
//
//   ORCHESTRATOR (this JS, trusted, deterministic)
//     • passes PATHS to the agents (it has no fs access — agents do all I/O)
//     • computes the deterministic triage/registry/distill helpers (merge-rules.mjs, rules-registry.mjs,
//       kb-distill.mjs — INLINED VERBATIM below, the Workflow runtime can't import) — no agent
//       self-reports a bucket, a disposition, or a lint verdict
//     • fail-closed on the token-budget lint: an over-ceiling hot layer HALTS the run before any write
//
//   LOAD AGENTS (three, parallel-safe reads — each the sole reader of its own artifact)
//     • spec-rules reader: reads the spec arm's `spec-rules.md`, returns structured spec rules
//     • code-arm-KB reader: reads the code arm's class KB entry, returns structured code rules
//     • registry reader: reads the EXISTING canonical registry file (if any) and returns its RAW
//       content verbatim — the orchestrator parses it deterministically via `parseRegistry` (review
//       HIGH fix, cycle 1: the agent no longer reconstructs structured JSON from an instructed column
//       list, which is exactly how the read-side contract silently drifted from what `renderRegistry`
//       actually emits). Reports `exists: false` (empty content) on a first-ever run — never invents
//       prior rows.
//
//   WRITE AGENTS (three, one per artifact — the orchestrator never touches a filesystem)
//     • registry-write: writes the updated C1 registry markdown
//     • distillate-write: writes the hot-layer distillate (a reviewable artifact — see Notes)
//     • report-write: writes the self-contained run report
//
// CROSSWALK MAP PROVENANCE (rule-crosswalk.mjs, unchanged): the map is human-authored, POST-HOC, after
// inspecting both arms' actual output — it is NEVER computed by an agent in this run and is passed in
// via `_args.crosswalkMap` (already authored before this workflow launches). Composing it here (via the
// inlined `reconcileRuleSets`) is the reconciliation step, not the authoring step.
//
// RUNTIME CONTRACT (workflow-contract.test.mjs): no static import / fs / Date / Math.random; `meta` is a
// pure literal; agents do all I/O; `args` arrives JSON-STRINGIFIED (tool) or as an object (composition) —
// parse both. merge-rules.mjs + rules-registry.mjs + kb-distill.mjs (+ their rule-crosswalk.mjs
// dependency) are INLINED VERBATIM below — kept in sync via scripts/selfcheck.mjs's "spec-diff
// inline-copy sync" check (extended with this workflow's pairs).
//
// BUILD-ONLY PASS DOES NOT PROVE THE LIVE MERGE (plan Step 4 Accept): this file passing the offline
// contract guard proves the runtime shape only. The live merge run (real spec-rules.md + real code-arm
// KB, real crosswalk map, real registry write) is Step 9 — operator-owed by construction (needs the
// Workflow/agent-spawn surface + a consuming repo). See implementation.md's Step 9 runbook.

// meta MUST be the first statement, and a PURE LITERAL (no concat / interpolation — Workflow-runtime rule).
export const meta = {
  name: 'sdd-merge-triage',
  description:
    'SDD Merge/Generate (adhoc-SddMergeGen) Step 4: the M1/M3 merge actor. Loads both blind arms\' already-mined rule sets (spec-rules.md + the code-arm class KB), crosswalks + triages them into the five delta buckets (merge-rules.mjs), updates the canonical rule registry (rules-registry.mjs — no-delete, changelog, provenance-mandatory), distills to the hot layer + lints its token budget (kb-distill.mjs, fail-closed over ceiling), and writes a self-contained run report. The crosswalk map is human-authored post-hoc and passed in via args — never computed by an agent in this run (rule-crosswalk.mjs provenance). Build-only pass proves the runtime shape only; the live merge run is operator-owed (Step 9).',
  phases: [
    { title: 'Load', detail: 'three read agents: spec-rules.md, the code-arm class KB, and the existing registry (if any) — exists:false on a first run, never invented prior rows' },
    { title: 'Triage', detail: 'orchestrator composes the crosswalk (human-authored map, passed in) then triages into the five delta buckets' },
    { title: 'Registry', detail: 'orchestrator computes the M1/M3 disposition + changelog (no-delete, provenance-mandatory); a write agent persists the registry markdown' },
    { title: 'Distill', detail: 'orchestrator clusters the registry into hot-layer rows + lints the token budget; fail-closed HALT over ceiling, else a write agent persists the distillate' },
    { title: 'Report', detail: 'orchestrator writes the self-contained run report (bucket counts, registry deltas, lint result) nexus-side, git-ignored' },
  ],
}

// =================================================================================================
// Inlined rule-crosswalk helpers (SOURCE OF TRUTH: harness/lib/rule-crosswalk.mjs, unit-tested in
// tests/unit/rule-crosswalk.test.mjs). Copied VERBATIM — the Workflow runtime can't import. The crosswalk
// MAP itself is human-authored, post-hoc (see file-header Notes) — this only APPLIES an already-authored
// map; it never authors one.
// =================================================================================================
function applyCrosswalk(rules, crosswalkMap) {
  const map = crosswalkMap ?? {};
  return (rules ?? []).map((r) => {
    const mapped = map[r?.id] ?? map[r?.ruleName];
    // A crosswalk value is either a canonical-name STRING (as today) or a {canonical, expect?, staleSpec?}
    // OBJECT carrying operator-declared metadata — resolve the canonical name from either shape. Defensive
    // fallback: an object missing `canonical` keeps the rule's existing ruleName rather than keying by
    // `undefined` (critic LOW-3).
    const canonical = (typeof mapped === 'string' ? mapped : mapped?.canonical) ?? r?.ruleName;
    return { ...r, ruleName: canonical };
  });
}

function crosswalkExpectations(crosswalkMap) {
  const map = crosswalkMap ?? {};
  const out = new Map();
  for (const value of Object.values(map)) {
    if (!value || typeof value === 'string' || value.canonical === undefined) continue;
    const decl = {};
    if (value.expect !== undefined) decl.expect = value.expect;
    if (value.staleSpec !== undefined) decl.staleSpec = value.staleSpec;
    // Only store a NON-EMPTY declaration: a metadata-less object (`{canonical:'X'}`, decl `{}`) must not
    // overwrite/clear a sibling alias's real declaration for the same canonical (Codex finding 2). An
    // absent entry and a stored-empty entry are indistinguishable to the consumer anyway — both fall
    // through to the boundary hint — so skipping the empty set is behavior-preserving.
    if (Object.keys(decl).length > 0) out.set(value.canonical, decl);
  }
  return out;
}

function reconcileRuleSets(r) {
  return {
    specRules: applyCrosswalk(r?.specRules, r?.crosswalkMap),
    codeRules: applyCrosswalk(r?.codeRules, r?.crosswalkMap),
  };
}

// =================================================================================================
// Inlined merge-rules helpers (SOURCE OF TRUTH: harness/lib/merge-rules.mjs, unit-tested in
// tests/unit/merge-rules.test.mjs). Copied VERBATIM. Calls the SIBLING inlined `reconcileRuleSets`
// above (no import — same-file scope resolves it, exactly like spec-cover-calc.workflow.js's inlined
// classifyRule calling its sibling inlined ruleKey).
// =================================================================================================
const DELTA_BUCKETS = [
  'overlap-confirmed',
  'spec-only-other-layer',
  'spec-only-divergent',
  'spec-only-unimplemented',
  'code-only-precision',
];

function ruleKey(r) {
  return (r?.ruleName ?? r?.id ?? '').trim();
}

function boundaryDiverges(specRule, codeRule) {
  const sb = specRule?.boundary;
  const cb = codeRule?.boundary;
  if (sb === undefined || cb === undefined) return false;
  return String(sb) !== String(cb);
}

function isStaleSpec(specRule, codeRule, specDate) {
  const srcDate = codeRule?.attributedSource?.date;
  const mineDate = specDate ?? specRule?.specDate;
  if (!srcDate || !mineDate) return false;
  return srcDate > mineDate; // ISO 8601 (YYYY-MM-DD) strings compare lexicographically = chronologically
}

function triageRuleSets({ specRules = [], codeRules = [], crosswalkMap = {}, targetLayer, specDate } = {}) {
  const { specRules: specR, codeRules: codeR } = reconcileRuleSets({ specRules, codeRules, crosswalkMap });
  // Operator-declared expectations from the crosswalk's object-valued entries (keyed by canonical name).
  // AUTHORITATIVE over the boundary hint below; empty when the crosswalk is all-string (today's behavior).
  const expectations = crosswalkExpectations(crosswalkMap);

  const buckets = {
    'overlap-confirmed': [],
    'spec-only-other-layer': [],
    'spec-only-divergent': [],
    'spec-only-unimplemented': [],
    'code-only-precision': [],
  };
  const specRepair = [];

  const codeByName = new Map();
  for (const c of codeR) {
    const key = ruleKey(c);
    if (!key) continue;
    if (!codeByName.has(key)) codeByName.set(key, []);
    codeByName.get(key).push(c);
  }
  const matchedCodeKeys = new Set();

  for (const s of specR) {
    if (s?.verdict === 'ambiguous') {
      specRepair.push({ ...s, reason: s.reason ?? s.ambiguousReason ?? 'ambiguous verdict — spec does not commit' });
      continue;
    }

    const key = ruleKey(s);
    const matches = key ? (codeByName.get(key) ?? []) : [];

    if (matches.length === 0) {
      if (targetLayer !== undefined && s?.layer !== undefined && s.layer !== targetLayer) {
        buckets['spec-only-other-layer'].push({ ...s, bucket: 'spec-only-other-layer' });
      } else {
        buckets['spec-only-unimplemented'].push({ ...s, bucket: 'spec-only-unimplemented' });
      }
      continue;
    }

    matchedCodeKeys.add(key);
    // Divergence decision: the operator-declared `expect` is AUTHORITATIVE — expect:'overlap' forces
    // overlap-confirmed and expect:'divergent' forces spec-only-divergent, regardless of boundaries.
    // With NO declaration, fall back to the boundary string-compare hint exactly as before (many-to-one
    // tolerant: agree if ANY matching code rule agrees on boundary).
    const decl = expectations.get(key);
    let agreeing;
    if (decl?.expect === 'overlap') agreeing = matches[0];
    else if (decl?.expect === 'divergent') agreeing = undefined;
    else agreeing = matches.find((c) => !boundaryDiverges(s, c));
    if (agreeing) {
      buckets['overlap-confirmed'].push({ ...s, bucket: 'overlap-confirmed', codeRule: agreeing });
    } else {
      const codeRule = matches[0];
      const entry = {
        ...s,
        bucket: 'spec-only-divergent',
        state: 'divergence-pending-triage',
        codeRule,
        evidencePair: {
          specCitation: s.citation ?? s.statement ?? s.ruleName,
          codeAttestation: codeRule.attestation ?? codeRule.lines ?? codeRule.id,
        },
      };
      // suspect-stale-spec fires on the operator-declared `staleSpec` flag OR the (dormant-but-valid)
      // date-based check — either signal tags the row.
      if (decl?.staleSpec === true || isStaleSpec(s, codeRule, specDate)) {
        entry.tags = [...(entry.tags ?? []), 'suspect-stale-spec'];
      }
      buckets['spec-only-divergent'].push(entry);
    }
  }

  for (const c of codeR) {
    const key = ruleKey(c);
    if (!key || matchedCodeKeys.has(key)) continue;
    buckets['code-only-precision'].push({ ...c, bucket: 'code-only-precision' });
  }

  return { buckets, specRepair };
}

// =================================================================================================
// Inlined rules-registry helpers (SOURCE OF TRUTH: harness/lib/rules-registry.mjs, unit-tested in
// tests/unit/rules-registry.test.mjs). Copied VERBATIM.
// =================================================================================================
const REQUIRED_PROVENANCE_MSG = 'updateRegistry: `source` is required — every registry write must carry provenance (no anonymous rows).';

function bucketOf(entry) {
  return entry?.bucket;
}

function evidenceKey(entry) {
  const parts = [entry?.bucket, entry?.layer, entry?.state];
  if (entry?.evidencePair) parts.push(entry.evidencePair.specCitation, entry.evidencePair.codeAttestation);
  if (entry?.tags) parts.push([...entry.tags].sort().join(','));
  return parts.map((p) => (p === undefined || p === null ? '' : String(p))).join('|');
}

function flattenTriage(triage) {
  const buckets = triage?.buckets ?? {};
  const out = [];
  for (const bucketName of Object.keys(buckets)) {
    for (const entry of buckets[bucketName] ?? []) {
      out.push({ ...entry, bucket: entry.bucket ?? bucketName });
    }
  }
  return out;
}

function updateRegistry({ existingRows = [], existingChangelog = [], triage, source, date } = {}) {
  if (!source) throw new Error(REQUIRED_PROVENANCE_MSG);

  const priorByName = new Map(existingRows.map((r) => [r.canonicalName, r]));
  const newEntries = flattenTriage(triage);
  const newByName = new Map(newEntries.map((e) => [ruleKey(e), e]));

  const rows = [];
  const changelog = [...existingChangelog];

  for (const entry of newEntries) {
    const name = ruleKey(entry);
    if (!name) continue;
    const prior = priorByName.get(name);
    const newKey = evidenceKey(entry);

    if (!prior) {
      const row = {
        canonicalName: name,
        layer: entry.layer,
        criticality: entry.criticality,
        arms: entry.codeRule ? 'both' : (bucketOf(entry) === 'code-only-precision' ? 'code' : 'spec'),
        bucket: entry.bucket,
        disposition: 'add',
        source,
        lastVerified: date,
        state: entry.state,
        evidencePair: entry.evidencePair,
        tags: entry.tags,
      };
      rows.push(row);
      changelog.push(`- ${date}: added ${name} (add) — source: ${source}`);
      continue;
    }

    const priorKey = evidenceKey(prior);
    if (priorKey === newKey && prior.bucket === entry.bucket) {
      rows.push({ ...prior, disposition: 'carried' });
      if (prior.disposition !== 'carried') {
        changelog.push(`- ${date}: carried ${name} (carried) — source: ${source}`);
      }
    } else {
      rows.push({
        ...prior,
        layer: entry.layer ?? prior.layer,
        criticality: entry.criticality ?? prior.criticality,
        bucket: entry.bucket,
        disposition: 'supersede',
        lastVerified: date,
        state: entry.state,
        evidencePair: entry.evidencePair,
        tags: entry.tags,
      });
      changelog.push(`- ${date}: superseded ${name} (supersede) — source: ${source}`);
    }
  }

  for (const prior of existingRows) {
    if (newByName.has(prior.canonicalName)) continue;
    if (prior.disposition === 'retire') {
      rows.push(prior);
      continue;
    }
    rows.push({ ...prior, disposition: 'retire', lastVerified: prior.lastVerified });
    changelog.push(`- ${date}: retired ${prior.canonicalName} (retire) — source: ${source}`);
  }

  return { rows, changelog };
}

function renderRegistry({ className, rows = [], changelog = [] }) {
  const header = `# Canonical Rule Registry — ${className}\n\n` +
    'One row per canonical rule (SddLifecycle C1). Deprecate-never-delete: a retired/superseded row is ' +
    'kept, never removed. `source:` and `last_verified` are mandatory on every row.\n';

  const tableHeader = '| Rule | Layer | Criticality | Arms | Bucket | Disposition | Source | Last Verified |\n' +
    '|------|-------|-------------|------|--------|-------------|--------|---------------|';
  const tableRows = rows.map((r) =>
    `| ${r.canonicalName} | ${r.layer ?? ''} | ${r.criticality ?? ''} | ${r.arms ?? ''} | ${r.bucket ?? ''} | ${r.disposition ?? ''} | ${r.source ?? ''} | ${r.lastVerified ?? ''} |`
  );

  const divergent = rows.filter((r) => r.state || r.evidencePair || (r.tags && r.tags.length));
  const divergenceSection = divergent.length
    ? '\n## Divergence detail\n\n' + divergent.map((r) => [
        `### ${r.canonicalName}`,
        r.state ? `- state: ${r.state}` : null,
        r.evidencePair?.specCitation !== undefined ? `- spec citation: ${r.evidencePair.specCitation}` : null,
        r.evidencePair?.codeAttestation !== undefined ? `- code attestation: ${r.evidencePair.codeAttestation}` : null,
        (r.tags && r.tags.length) ? `- tags: ${r.tags.join(', ')}` : null,
      ].filter(Boolean).join('\n')).join('\n\n') + '\n'
    : '';

  const changelogSection = `\n## Changelog\n\n${changelog.length ? changelog.join('\n') : '_None yet._'}\n`;

  return [header, tableHeader, ...tableRows, divergenceSection, changelogSection].filter((s) => s !== '').join('\n');
}

function parseRegistry(markdown) {
  const text = markdown ?? '';
  const lines = text.split('\n');

  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (/^\|\s*Rule\s*\|/.test(line)) { inTable = true; continue; }
    if (!inTable) continue;
    if (/^\|[\s|-]+\|$/.test(line)) continue;
    if (!line.trim().startsWith('|')) { inTable = false; continue; }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const [canonicalName, layer, criticality, arms, bucket, disposition, source, lastVerified] = cells;
    if (!canonicalName) continue;
    rows.push({
      canonicalName,
      layer: layer || undefined,
      criticality: criticality || undefined,
      arms: arms || undefined,
      bucket: bucket || undefined,
      disposition: disposition || undefined,
      source: source || undefined,
      lastVerified: lastVerified || undefined,
    });
  }

  const rowByName = new Map(rows.map((r) => [r.canonicalName, r]));
  const divMatch = text.match(/## Divergence detail\n\n([\s\S]*?)(?=\n## |$)/);
  if (divMatch) {
    const blocks = divMatch[1].split(/(?=^### )/m).map((b) => b.trim()).filter(Boolean);
    for (const block of blocks) {
      const blockLines = block.split('\n');
      const name = blockLines[0].replace(/^###\s*/, '').trim();
      const row = rowByName.get(name);
      if (!row) continue;
      for (const l of blockLines.slice(1)) {
        const stateM = l.match(/^-\s*state:\s*(.*)$/);
        const citeM = l.match(/^-\s*spec citation:\s*(.*)$/);
        const attM = l.match(/^-\s*code attestation:\s*(.*)$/);
        const tagsM = l.match(/^-\s*tags:\s*(.*)$/);
        if (stateM) row.state = stateM[1].trim();
        if (citeM) { row.evidencePair = row.evidencePair ?? {}; row.evidencePair.specCitation = citeM[1].trim(); }
        if (attM) { row.evidencePair = row.evidencePair ?? {}; row.evidencePair.codeAttestation = attM[1].trim(); }
        if (tagsM) row.tags = tagsM[1].split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
  }

  const changelog = [];
  const clMatch = text.match(/## Changelog\n\n([\s\S]*)$/);
  if (clMatch) {
    for (const l of clMatch[1].split('\n')) {
      const t = l.trim();
      if (t.startsWith('- ')) changelog.push(t);
    }
  }

  return { rows, changelog };
}

// =================================================================================================
// Inlined kb-distill helpers (SOURCE OF TRUTH: harness/lib/kb-distill.mjs, unit-tested in
// tests/unit/kb-distill.test.mjs). Copied VERBATIM.
// =================================================================================================
const CHARS_PER_TOKEN = 4;
const DEFAULT_TOKEN_CEILING = 2000;

function clusterKey(row) {
  // Cluster = symbol + layer. When NO symbol is present (no stage emits one today), fall back to
  // LAYER-ONLY — never to canonicalName, which made every rule its own cluster (degenerate 1-rule-per-
  // line distillate). Layer-only collapses symbol-less rows to one cluster per layer.
  const symbol = row?.symbol;
  const layer = row?.layer ?? '';
  return symbol ? `${symbol}|${layer}` : `${layer}`;
}

function estimateTokens(text) {
  return Math.ceil((text ?? '').length / CHARS_PER_TOKEN);
}

function distillRegistry({ className, rows = [], ledgerPath } = {}) {
  const clusters = new Map();
  for (const row of rows) {
    const key = clusterKey(row);
    const existing = clusters.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      // Drop the `?? row.canonicalName` pseudo-symbol — a symbol-less cluster carries NO symbol, so the
      // renderer never prints an arbitrary rule name as its label (critic LOW-4).
      clusters.set(key, { symbol: row?.symbol, layer: row?.layer, count: 1 });
    }
  }

  const hotRows = [];
  for (const { symbol, layer, count } of clusters.values()) {
    const layerLabel = layer ?? 'unlayered';
    const countLabel = `${count} rule${count !== 1 ? 's' : ''}`;
    // ONE LINE ONLY — no embedded newline, no full rule statement/body (Slice-1b / Slice-3 invariants).
    // Symbol-present: "- <symbol> [<layer>]: N rules — see <ledger>". Symbol-absent: a LAYER-ONLY line
    // "- [<layer>]: N rules — see <ledger>" — never a rule name as a pseudo-symbol label (LOW-4).
    const line = symbol
      ? `- ${symbol} [${layerLabel}]: ${countLabel} — see ${ledgerPath}`
      : `- [${layerLabel}]: ${countLabel} — see ${ledgerPath}`;
    hotRows.push({ cluster: symbol, layer, ruleCount: count, pointer: ledgerPath, line });
  }

  const renderedDistillate = [
    `## ${className} — hot-layer distillate`,
    '',
    ...hotRows.map((r) => r.line),
  ].join('\n');

  return { hotRows, renderedDistillate };
}

function lintTokenBudget({ hotText = '', ceiling = DEFAULT_TOKEN_CEILING } = {}) {
  const estimatedTokens = estimateTokens(hotText);
  return { pass: estimatedTokens <= ceiling, estimatedTokens, ceiling };
}

// =================================================================================================
// Target + contract paths (parameterized via args; defaults = sprint-rituals / BugRatioAnalyzer, the
// same pilot target as spec-cover-calc.workflow.js). args arrive two ways: Workflow TOOL → JSON STRING
// (parse it); workflow() composition → OBJECT (as-is).
// =================================================================================================
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const SR = 'D:\\src\\sprint-rituals'
const NEXUS = 'D:\\src\\claude-plugins\\nexus'
// Model for every agent. Default Sonnet (owner directive — matches every other harness front-end); override via _args.model.
const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'BugRatioAnalyzer'

// Load artifacts — the two blind arms' already-mined output (this workflow runs AFTER both arms, never
// alongside them — AC-1 blindness is preserved by construction, this is the merge stage, not a miner).
const SPEC_RULES_PATH = _args.specRulesPath ?? `${NEXUS}\\docs\\specs\\adhoc-SddCoverageLoop\\delivery\\spec-rules-bugratio.md`
const CODE_ARM_KB_PATH = _args.codeArmKbPath ?? `${SR}\\docs\\kb\\bug-ratio.md`

// The registry lives in the CONSUMING repo beside its KB (OD-L5 default path).
const REGISTRY_PATH = _args.registryPath ?? `${SR}\\docs\\kb\\golden\\${TARGET_CLASS}.md`

// The hot-layer distillate is written as a STANDALONE reviewable artifact (nexus-side, git-ignored) by
// default — NOT auto-spliced into the consuming repo's docs/kb/index.md. Splicing a generated block into
// a hand-maintained index is exactly the kind of destructive edit this harness avoids; the operator folds
// the reviewed distillate in by hand (or via a future dedicated splice helper). Override via
// _args.distillatePath to point directly at a consuming repo's docs/kb/index.md for a live run.
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const DISTILLATE_PATH = _args.distillatePath ?? `${RUNS_DIR}\\merge-${TARGET_CLASS}-hot-distillate.md`
const REPORT_PATH = _args.reportPath ?? `${RUNS_DIR}\\merge-${TARGET_CLASS}.md`

// The crosswalk map — human-authored POST-HOC (rule-crosswalk.mjs provenance), passed in already-built.
const CROSSWALK_MAP = _args.crosswalkMap ?? {}
const TARGET_LAYER = _args.targetLayer ?? undefined
const SPEC_DATE = _args.specDate ?? undefined
const TOKEN_CEILING = _args.tokenCeiling ?? DEFAULT_TOKEN_CEILING
const RUN_DATE = _args.runDate ?? null

// MARGINAL accounting — budget.spent() is the SHARED session pool, not this run's cost.
const RUN_START_SPENT = budget.spent()
const runSpent = () => budget.spent() - RUN_START_SPENT

// =================================================================================================
// Schemas
// =================================================================================================
const RULE_ARRAY_SCHEMA_ITEM = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    ruleName: { type: 'string' },
    statement: { type: 'string' },
    citation: { type: 'string' },
    boundary: { type: 'string' },
    layer: { type: 'string' },            // domain-calc | api | ui | settings
    criticality: { type: 'string' },      // golden | core | edge
    symbol: { type: 'string' },
    verdict: { type: 'string' },          // spec arm only: verified | ambiguous
    reason: { type: 'string' },           // spec arm only: the skeptic's ambiguous reason
    attestation: { type: 'string' },      // code arm: file:line
    lines: { type: 'string' },
    specDate: { type: 'string' },
    attributedSource: { type: 'object', properties: { name: { type: 'string' }, date: { type: 'string' } } },
  },
  required: ['id'],
}
const SPEC_RULES_SCHEMA = { type: 'object', properties: { rules: { type: 'array', items: RULE_ARRAY_SCHEMA_ITEM } }, required: ['rules'] }
const CODE_RULES_SCHEMA = { type: 'object', properties: { rules: { type: 'array', items: RULE_ARRAY_SCHEMA_ITEM } }, required: ['rules'] }

// The registry-read agent returns the RAW file content verbatim — the orchestrator parses it
// deterministically via parseRegistry (the review HIGH fix, cycle 1). Asking the agent to reconstruct
// structured JSON per an instructed column list is exactly how the read-side contract silently drifted
// from what renderRegistry actually emitted; a verbatim read + a real INVERSE parser cannot drift.
const REGISTRY_READ_SCHEMA = {
  type: 'object',
  properties: {
    exists: { type: 'boolean' },
    content: { type: 'string' },
  },
  required: ['exists', 'content'],
}

const WRITE_CONFIRM_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
const DATE_SCHEMA = { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] }

// =================================================================================================
// Phase: date stamp (workflows can't call Date — an agent stamps it; or _args.runDate short-circuits).
// =================================================================================================
let today = RUN_DATE
if (!today) {
  const dateResult = await agent('Output ONLY today\'s date as YYYY-MM-DD, nothing else, in your schema response.', { label: 'date-stamp', phase: 'Load', schema: DATE_SCHEMA, model: MODEL })
  today = dateResult?.date ?? 'unknown-date'
}

// =================================================================================================
// Phase: Load — three read agents. Each is the sole reader of its own artifact.
// =================================================================================================
phase('Load')
log(`Load: reading the spec arm (${SPEC_RULES_PATH}), the code arm (${CODE_ARM_KB_PATH}), and the existing registry (${REGISTRY_PATH}).`)

const specReadPrompt = `You are the SPEC-RULES READER agent. Read this spec-arm rule set file:
  ${SPEC_RULES_PATH}
Return every rule as structured JSON: { id, ruleName, statement, citation, boundary?, layer?, criticality?, verdict ("verified"|"ambiguous"), reason? (present only when verdict is "ambiguous"), specDate? }. Read ONLY this file.`
const specResult = await agent(specReadPrompt, { label: 'spec-rules-read', phase: 'Load', schema: SPEC_RULES_SCHEMA, model: MODEL })
const specRules = specResult?.rules ?? []

const codeReadPrompt = `You are the CODE-ARM-KB READER agent. Read this code-arm verified rule KB entry:
  ${CODE_ARM_KB_PATH}
Return every rule as structured JSON: { id, statement, boundary?, layer? (domain-calc|api|ui|settings — the mine-verify-cover consolidate-stage fact, if the entry carries it), criticality? (golden|core|edge, if the entry carries it), symbol?, attestation? (the "file:line" or lines column), attributedSource? ({name,date} when the rule is attributed to a settings/feature source) }. Read ONLY this file.`
const codeResult = await agent(codeReadPrompt, { label: 'code-arm-kb-read', phase: 'Load', schema: CODE_RULES_SCHEMA, model: MODEL })
const codeRules = codeResult?.rules ?? []

const registryReadPrompt = `You are the REGISTRY READER agent. Check whether this canonical rule registry file exists:
  ${REGISTRY_PATH}
If it exists, return its COMPLETE RAW file content verbatim as "content" — do not summarize, reformat, or extract fields; the orchestrator parses the content itself. If it does NOT exist yet (first-ever run for this class), return { "exists": false, "content": "" } — never invent prior rows.`
const registryResult = await agent(registryReadPrompt, { label: 'registry-read', phase: 'Load', schema: REGISTRY_READ_SCHEMA, model: MODEL })
const registryParsed = registryResult?.exists ? parseRegistry(registryResult?.content ?? '') : { rows: [], changelog: [] }
const existingRows = registryParsed.rows
const existingChangelog = registryParsed.changelog
log(`Load: ${specRules.length} spec rule(s), ${codeRules.length} code rule(s), registry ${registryResult?.exists ? `existing (${existingRows.length} row(s))` : 'first run (none yet)'}.`)

// =================================================================================================
// Phase: Triage — orchestrator composes the crosswalk (human-authored map, passed in via args) then
// triages into the five delta buckets. PURE — no agent self-reports a bucket.
// =================================================================================================
phase('Triage')
const { buckets, specRepair } = triageRuleSets({ specRules, codeRules, crosswalkMap: CROSSWALK_MAP, targetLayer: TARGET_LAYER, specDate: SPEC_DATE })
const bucketCounts = Object.fromEntries(DELTA_BUCKETS.map((b) => [b, buckets[b].length]))
log(`Triage: ${DELTA_BUCKETS.map((b) => `${b}=${bucketCounts[b]}`).join(', ')}; specRepair=${specRepair.length}.`)

// =================================================================================================
// Phase: Registry — orchestrator computes the M1/M3 disposition + changelog, then a write agent
// persists the registry markdown. PURE compute; I/O is the write agent's job.
// =================================================================================================
phase('Registry')
const { rows: registryRows, changelog } = updateRegistry({ existingRows, existingChangelog, triage: { buckets, specRepair }, source: `${TARGET_CLASS} merge run (${today})`, date: today })
const registryMarkdown = renderRegistry({ className: TARGET_CLASS, rows: registryRows, changelog })
const dispositionCounts = registryRows.reduce((acc, r) => { acc[r.disposition] = (acc[r.disposition] ?? 0) + 1; return acc }, {})
log(`Registry: ${registryRows.length} row(s) — ${Object.entries(dispositionCounts).map(([d, n]) => `${d}=${n}`).join(', ') || 'none'}.`)

await agent(`You are the REGISTRY-WRITE agent. Write EXACTLY this content to ${REGISTRY_PATH} — no changes, no reformatting (create the file and any missing parent directories if it does not exist yet).\n\nCONTENT:\n${registryMarkdown}\n\nWrite the file now using the Write tool. Return { "written": true } when done.`, { label: 'registry-write', phase: 'Registry', schema: WRITE_CONFIRM_SCHEMA, model: MODEL })

// =================================================================================================
// Phase: Distill — orchestrator clusters the registry into hot-layer rows + lints the token budget.
// FAIL-CLOSED: an over-ceiling hot layer HALTS the run before any distillate write (the sync must not
// silently bloat the always-loaded context).
// =================================================================================================
phase('Distill')
const { hotRows, renderedDistillate } = distillRegistry({ className: TARGET_CLASS, rows: registryRows, ledgerPath: REGISTRY_PATH })
const lint = lintTokenBudget({ hotText: renderedDistillate, ceiling: TOKEN_CEILING })
log(`Distill: ${hotRows.length} hot-layer cluster row(s); token lint ${lint.pass ? 'PASS' : 'FAIL'} (${lint.estimatedTokens}/${lint.ceiling}).`)

if (!lint.pass) {
  log(`HALT: hot-layer token budget exceeded (${lint.estimatedTokens} > ${lint.ceiling}) — distillate NOT written. Never silently bloat the always-loaded context.`)
  return {
    stopped: 'token-budget-exceeded',
    bucketCounts,
    specRepairCount: specRepair.length,
    registryRows: registryRows.length,
    dispositionCounts,
    lint,
    outputTokensThisTurn: budget.spent(),
  }
}

await agent(`You are the DISTILLATE-WRITE agent. Write EXACTLY this content to ${DISTILLATE_PATH} — no changes, no reformatting (create the file and any missing parent directories if it does not exist yet).\n\nCONTENT:\n${renderedDistillate}\n\nWrite the file now using the Write tool. Return { "written": true } when done.`, { label: 'distillate-write', phase: 'Distill', schema: WRITE_CONFIRM_SCHEMA, model: MODEL })

// =================================================================================================
// Phase: Report — orchestrator writes the self-contained run report nexus-side, git-ignored.
// =================================================================================================
phase('Report')
const bucketSection = DELTA_BUCKETS.map((b) => `- **${b}**: ${bucketCounts[b]}`).join('\n')
const specRepairSection = specRepair.length
  ? specRepair.map((r) => `- **${r.ruleName ?? r.id}** — ${r.reason}`).join('\n')
  : '_None._'

const reportContent = `# Merge/triage run — ${TARGET_CLASS} (${today})

**Front-end:** \`harness/merge.workflow.js\` (adhoc-SddMergeGen Step 4 — the M1/M3 merge actor)
**Spec arm:** \`${SPEC_RULES_PATH}\`
**Code arm:** \`${CODE_ARM_KB_PATH}\`
**Registry:** \`${REGISTRY_PATH}\`
**Distillate:** \`${DISTILLATE_PATH}\` (standalone reviewable artifact — fold into the consuming repo's docs/kb/index.md by hand)
**Model:** ${MODEL} (every agent; default Sonnet)
**Run cost (marginal):** ${runSpent().toLocaleString()} output tokens — THIS run only.

## The five delta buckets

${bucketSection}

## spec-repair (ambiguous — excluded from the buckets, never silently dropped)

${specRepairSection}

## Registry deltas

${Object.entries(dispositionCounts).map(([d, n]) => `- **${d}**: ${n}`).join('\n') || '_No registry rows._'}

## Hot-layer token-budget lint

${lint.pass ? 'PASS' : 'FAIL'} — ${lint.estimatedTokens} / ${lint.ceiling} estimated tokens.

## Notes

- Build-only pass proves the runtime shape (offline contract guard), never the live merge — the live run
  (real artifacts, a real human-authored crosswalk map, a real registry write) is operator-owed (Step 9).
- The crosswalk map is human-authored POST-HOC and passed in via args — never computed by an agent in
  this run (rule-crosswalk.mjs provenance, AC-1 blindness preserved).
- This report was written automatically by the orchestrator (git-ignored, nexus-side).
`

await agent(`You are the REPORT-WRITE agent. Write EXACTLY this content to ${REPORT_PATH} — no changes, no reformatting.\n\nCONTENT:\n${reportContent}\n\nWrite the file now using the Write tool. Return { "written": true } when done.`, { label: 'report-write', phase: 'Report', schema: WRITE_CONFIRM_SCHEMA, model: MODEL })
log(`Report written: ${REPORT_PATH}`)

// =================================================================================================
// RETURN
// =================================================================================================
log(`Merge done: ${DELTA_BUCKETS.map((b) => `${b}=${bucketCounts[b]}`).join(', ')}; registry ${registryRows.length} row(s); hot-layer lint ${lint.pass ? 'PASS' : 'FAIL'}.`)
return {
  variant: 'sdd-merge-triage',
  target: { class: TARGET_CLASS },
  bucketCounts,
  specRepairCount: specRepair.length,
  registryRows: registryRows.length,
  dispositionCounts,
  lint,
  registryPath: REGISTRY_PATH,
  distillatePath: DISTILLATE_PATH,
  reportPath: REPORT_PATH,
  outputTokensThisTurn: budget.spent(),
}
