-- Probe class: value-distribution (Phase 2 / SR-14)
-- Low-cardinality columns ONLY (flags/enums) -- the "what does status = 9 mean" evidence.
-- Params: {{schema}} {{table}} {{column}} {{timeout_seconds}} {{bound_predicate}}
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
SELECT
    "{{column}}"                                        AS value,
    COUNT(*)                                             AS row_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2)   AS share_pct
FROM {{schema}}.{{table}}
WHERE {{bound_predicate}}
GROUP BY "{{column}}"
ORDER BY row_count DESC
LIMIT 50;
-- BODY END

ROLLBACK;
