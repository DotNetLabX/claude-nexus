'use strict';
/**
 * Shared application-source predicate for the three Nexus hooks (guard.js, pipeline-gate.js,
 * boundary-detector.js). Extracted from three drifted copies (RecipeEstateAudit, 2026-06-18) so
 * the enforcement boundary is defined once.
 *
 * "Code" = an application-source extension, OUTSIDE the doc/system areas. Markdown / JSON / YAML /
 * config are NOT code — pipeline roles legitimately write plan.md/review.md/specs/configs. `docs/`
 * and `.claude/` are doc/system areas and are never source, whatever the extension.
 *
 * Two deliberate decisions, both adopting guard.js's prior behavior as the canonical one (the other
 * two copies had drifted):
 *   - Backslash normalization: the path is normalized (`\` → `/`) BEFORE the area/extension test, so
 *     a Windows path (`src\Foo.cs`, `.claude\x.md`) is classified identically to its POSIX form. The
 *     two callers that previously normalized only at their call site now get it from the predicate;
 *     boundary-detector's predicate previously did NOT normalize at all.
 *   - Extension set is the UNION of the three prior copies. The only net effect is that pipeline-gate
 *     now treats `.sh`/`.ps1` as source (it omitted them); guard and boundary-detector already had them.
 */
function isCodeFile(fp) {
  const p = String(fp).replace(/\\/g, '/').toLowerCase();
  if (/(^|\/)(docs|\.claude)\//.test(p)) return false;
  return /\.(cs|ts|tsx|js|jsx|mjs|cjs|vue|css|scss|sass|less|py|go|java|kt|rb|rs|php|c|h|cpp|hpp|cc|swift|sql|sh|ps1|razor|cshtml)$/.test(p);
}

module.exports = { isCodeFile };
