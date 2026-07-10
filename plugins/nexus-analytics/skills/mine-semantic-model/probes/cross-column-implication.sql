-- Probe class: cross-column-implication (Phase 2 / SR-17)
-- e.g. is_valid vs deleted_at vs ignore_in_analytics consistency.
-- Params: {{schema}} {{table}} {{column_a}} {{column_b}} {{timeout_seconds}} {{bound_predicate}}
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
SELECT
    "{{column_a}}" AS value_a,
    "{{column_b}}" AS value_b,
    COUNT(*)        AS row_count
FROM {{schema}}.{{table}}
WHERE {{bound_predicate}}
GROUP BY "{{column_a}}", "{{column_b}}"
ORDER BY row_count DESC
LIMIT 50;
-- BODY END

ROLLBACK;
