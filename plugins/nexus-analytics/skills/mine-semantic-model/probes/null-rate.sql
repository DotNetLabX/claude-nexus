-- Probe class: null-rate (Phase 2 / SR-13)
-- Params: {{schema}} {{table}} {{column}} {{timeout_seconds}} {{bound_predicate}}
-- Separate from cardinality.sql for BR9 report-section traceability, even though the raw
-- null_count is also visible there -- this probe reports the rate explicitly.
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
SELECT
    COUNT(*)                                                              AS row_count,
    COUNT(*) FILTER (WHERE "{{column}}" IS NULL)                          AS null_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE "{{column}}" IS NULL)
        / NULLIF(COUNT(*), 0), 2)                                         AS null_rate_pct
FROM {{schema}}.{{table}}
WHERE {{bound_predicate}};
-- BODY END

ROLLBACK;
