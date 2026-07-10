-- Probe class: date-coverage (Phase 2 / SR-16)
-- MIN/MAX per fact table -- doubles as the run's data-vintage stamp (BR9).
-- Params: {{schema}} {{table}} {{date_column}} {{timeout_seconds}} {{bound_predicate}}
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
SELECT
    MIN("{{date_column}}") AS min_date,
    MAX("{{date_column}}") AS max_date,
    COUNT(*)               AS row_count
FROM {{schema}}.{{table}}
WHERE {{bound_predicate}};
-- BODY END

ROLLBACK;
