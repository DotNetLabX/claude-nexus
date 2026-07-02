// independence-check.mjs — the per-run input-manifest tripwire (adhoc-SddCoverageLoop, Step 5).
//
// AC-1 (two mutually-blind runs) + AC-2 (spec source ≠ golden set) need a PRE-RUN, declarative proof that
// neither arm's agents can see: the sequestered SR golden set (post-hoc scoring only, never a run input), the
// Step-7 reconciliation crosswalk (applied outside both blind runs, never an arm input), or the OTHER arm's
// private oracle/output. Mirrors the golden-set placement+tripwire and the spec-cover single-reader placement.
//
// A "manifest" here is each arm's DECLARED set of private-input/output paths (its own oracle, its own runner
// result, its own report) — NOT the full transitive read-surface. Both arms legitimately read the SHARED
// production source class (SRC); that is not a blindness violation (neither arm's INTERPRETATION of it is
// influenced by the other's conclusions) and is deliberately excluded from manifest scope. What must never
// cross is: each arm's private oracle/output, the sequestered golden set, and the crosswalk.
//
// PURE — no fs, no LLM. FAILS CLOSED: any violation → pass:false, always. Never silently passes.

function normalizePath(p) {
  return String(p ?? '').replace(/\\/g, '/').toLowerCase();
}

/**
 * Check ONE manifest's paths against an explicit forbidden-path list. PURE.
 * @param {{paths?:string[], forbidden?:string[]}} r
 * @returns {{pass:boolean, violations:string[]}}
 */
export function checkManifest(r) {
  const paths = r?.paths ?? [];
  const forbiddenSet = new Set((r?.forbidden ?? []).map(normalizePath));
  const violations = paths.filter((p) => forbiddenSet.has(normalizePath(p)));
  return { pass: violations.length === 0, violations };
}

/**
 * Check BOTH arms' manifests together: (1) neither contains the sequestered golden set, (2) neither
 * contains the Step-7 reconciliation crosswalk, (3) the two manifests are DISJOINT (mutual blindness — an
 * arm never declares a path that is also in the other arm's manifest). FAILS CLOSED: any of the three
 * violation types makes `pass: false`.
 * @param {{
 *   specManifest: {arm?:string, paths?:string[]},
 *   codeManifest: {arm?:string, paths?:string[]},
 *   goldenSetPath?: string,
 *   crosswalkPath?: string,
 * }} r
 * @returns {{pass:boolean, violations:{arm:string, path:string, reason:string}[]}}
 */
export function checkIndependence(r) {
  const specPaths = r?.specManifest?.paths ?? [];
  const codePaths = r?.codeManifest?.paths ?? [];
  const sharedForbidden = [r?.goldenSetPath, r?.crosswalkPath].filter(Boolean);

  const specForbidden = checkManifest({ paths: specPaths, forbidden: sharedForbidden }).violations;
  const codeForbidden = checkManifest({ paths: codePaths, forbidden: sharedForbidden }).violations;

  const specSet = new Set(specPaths.map(normalizePath));
  const overlap = codePaths.filter((p) => specSet.has(normalizePath(p)));

  const violations = [
    ...specForbidden.map((p) => ({ arm: 'spec', path: p, reason: 'forbidden path (golden-set or crosswalk) present in the spec arm manifest' })),
    ...codeForbidden.map((p) => ({ arm: 'code', path: p, reason: 'forbidden path (golden-set or crosswalk) present in the code arm manifest' })),
    ...overlap.map((p) => ({ arm: 'both', path: p, reason: 'manifests are not disjoint — path appears in both arms (mutual-blindness violation)' })),
  ];

  return { pass: violations.length === 0, violations };
}
