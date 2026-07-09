// rules-registry.mjs — the M1/M3 registry writer lib (adhoc-SddMergeGen, Step 2).
//
// Writes/updates the per-repo canonical rule registry (SddLifecycle C1; Contract R1 default path
// `docs/business-rules/<area>/<unit>.md`) from Step 1's triage output (merge-rules.mjs). Binding invariants
// (borrowed from omnishelf kb-sync's registry machinery, cited in the proposal §C):
//   - every row carries `source:` provenance and `lastVerified`
//   - existing rows are NEVER deleted — disposition flips to retire/supersede, the record is kept
//   - every write appends a changelog entry
//   - a re-run against an UNCHANGED input pair is idempotent (no diff)
//
// Disposition (add | carried | re-open | supersede | retire) is computed HERE, not in Step 1's triage —
// it is keyed on PRIOR C2 registry state (the tech-spec's M3 reconciliation table), which the stateless
// triage lib has no access to. This lib is the one place that sees both the prior rows and the new
// triage, so it is the natural (and only correct) home for the M1/M3 disposition table:
//
//   | Prior registry row | New triage bucket                          | Disposition |
//   |---------------------|---------------------------------------------|-------------|
//   | absent               | any bucket                                   | add         |
//   | present               | same bucket, no evidence change              | carried     |
//   | present               | bucket/evidence changed, rule persists       | supersede   |
//   | present               | absent from the new triage entirely          | retire      |
//
// (`re-open` — new evidence contradicts a recorded verdict — needs the C2 attestation record's verdict
// line, which is out of scope for this arc — SddLifecycle C2/C3/C4 are deferred; see the plan's Scope.
// This lib implements the add/carried/supersede/retire quarter of the table that C1 alone can decide.)
//
// PURE — no fs, no LLM. The caller (an agent, per the method's no-filesystem-in-the-orchestrator rule)
// does the actual file read/write; this lib only computes the registry ROWS / changelog / rendered text.
//
// `renderRegistry` (row -> markdown) and `parseRegistry` (markdown -> row, its deterministic INVERSE)
// are a matched pair — `parseRegistry` exists so a REAL file round trip (render -> write -> read ->
// parse -> updateRegistry) recovers exactly the fields `evidenceKey` fingerprints, closing a review
// HIGH finding where the two sides had silently drifted (the writer omitted `bucket`/`state`/
// `evidencePair`/`tags`; the read-side agent prompt asked for columns the writer never emitted).

const REQUIRED_PROVENANCE_MSG = 'updateRegistry: `source` is required — every registry write must carry provenance (no anonymous rows).';

// ruleKey — the entry's identity, `ruleName ?? id` (the SAME fallback triageRuleSets/merge-rules.mjs
// use). Defined locally (not imported from merge-rules.mjs) so this lib stays self-contained for the
// verbatim inline into merge.workflow.js — where the inlined updateRegistry reuses the workflow's
// already-inlined merge-rules `ruleKey`, so no second copy is inlined. A code-only-precision entry
// carries only `id` (no ruleName); keying by ruleName alone silently dropped its row (item 1, HIGH).
function ruleKey(entry) {
  return (entry?.ruleName ?? entry?.id ?? '').trim();
}

function bucketOf(entry) {
  return entry?.bucket;
}

function evidenceKey(entry) {
  // A coarse content fingerprint used to detect "did the evidence change" for the carried/supersede
  // split — restricted to fields the registry ROW SCHEMA actually persists (bucket/layer/state/
  // evidencePair/tags — the plan's Data Model Changes column list; `boundary` is deliberately NOT a
  // registry column). Originally this also fingerprinted `boundary`/`codeRule.boundary` — TRIAGE-ENTRY-
  // ONLY fields never carried onto a registry row. That was the root cause of a review HIGH finding: a
  // fingerprint computed from non-persisted fields can never recompute identically once a row has been
  // through a REAL render->file-write->file-read->parse round trip (the reconstructed row simply has no
  // `.boundary`/`.codeRule` to read), so every row falsely "superseded" itself on every re-run. Fixed by
  // fingerprinting only the fields `renderRegistry`/`parseRegistry` actually round-trip.
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

/**
 * Update the registry rows + changelog from Step 1's triage output.
 *
 * @param {{existingRows?:Array<object>, existingChangelog?:Array<string>, triage:{buckets:Record<string,Array<object>>, specRepair?:Array<object>},
 *   source:string, date:string}} opts
 * @returns {{rows:Array<object>, changelog:Array<string>}}
 */
export function updateRegistry({ existingRows = [], existingChangelog = [], triage, source, date } = {}) {
  if (!source) throw new Error(REQUIRED_PROVENANCE_MSG);

  const priorByName = new Map(existingRows.map((r) => [r.canonicalName, r]));
  const newEntries = flattenTriage(triage);
  const newByName = new Map(newEntries.map((e) => [ruleKey(e), e]));

  const rows = [];
  const changelog = [...existingChangelog];

  // 1) Walk the NEW triage entries — add or carried/supersede against a prior row.
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

  // 2) Walk PRIOR rows absent from the new triage entirely → retire (never delete).
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

/**
 * Render the registry rows + changelog as the C1 markdown shape (Contract R1 default path
 * `docs/business-rules/<area>/<unit>.md`). A pure string builder — the caller writes the result to disk.
 *
 * @param {{className:string, rows:Array<object>, changelog:Array<string>}} opts
 * @returns {string}
 */
export function renderRegistry({ className, rows = [], changelog = [] }) {
  const header = `# Canonical Rule Registry — ${className}\n\n` +
    'One row per canonical rule (SddLifecycle C1). Deprecate-never-delete: a retired/superseded row is ' +
    'kept, never removed. `source:` and `last_verified` are mandatory on every row.\n';

  const tableHeader = '| Rule | Layer | Criticality | Arms | Bucket | Disposition | Source | Last Verified |\n' +
    '|------|-------|-------------|------|--------|-------------|--------|---------------|';
  const tableRows = rows.map((r) =>
    `| ${r.canonicalName} | ${r.layer ?? ''} | ${r.criticality ?? ''} | ${r.arms ?? ''} | ${r.bucket ?? ''} | ${r.disposition ?? ''} | ${r.source ?? ''} | ${r.lastVerified ?? ''} |`
  );

  // Divergence detail — an indented per-row block for rows carrying the `divergence-pending-triage`
  // state, the evidence pair, and/or the `suspect-stale-spec` tag (spec-only-divergent rows). Kept OUT
  // of the main table so ordinary rows stay uncluttered (mirrors the Changelog section's append style).
  // `parseRegistry` below is the deterministic INVERSE — every field rendered here is recovered there.
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

/**
 * Parse a registry markdown document (as produced by `renderRegistry`) back into rows + changelog —
 * the deterministic INVERSE of `renderRegistry`. This is what makes a REAL registry round trip (render
 * -> file write -> file read -> parse -> `updateRegistry`) idempotent: every field `evidenceKey` reads
 * is both rendered here and recovered here, by construction. Replaces the earlier design where the
 * registry-read agent was instructed to reconstruct structured JSON from a column list that had
 * silently drifted from what the writer actually emitted (the review HIGH finding's root cause) — the
 * orchestrator now parses the agent's verbatim raw file content itself, deterministically, so the
 * read-side contract can never drift from the write-side contract again.
 *
 * PURE — no fs, no LLM. The caller (an agent) reads the raw file text; this function does the parsing.
 *
 * @param {string} markdown
 * @returns {{rows:Array<object>, changelog:Array<string>}}
 */
export function parseRegistry(markdown) {
  const text = markdown ?? '';
  const lines = text.split('\n');

  // ---- 1) The main table ----
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

  // ---- 2) The Divergence detail section (optional — only present when a row carries it) ----
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

  // ---- 3) The Changelog section ----
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
