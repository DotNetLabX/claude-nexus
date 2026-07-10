-- Probe class: cardinality (Phase 2 / SR-12)
-- Params: {{schema}} {{table}} {{column}} {{timeout_seconds}} {{bound_predicate}}
-- {{bound_predicate}} MUST be a real date-bound or report-IDs-first predicate for the three
-- >100M tables (analytics_report_items, analytics_report_product_stats,
-- analytics_report_client_subcategory_stats) -- the runner refuses a bare TRUE on those (BR12c).
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
SELECT
    COUNT(*)                                      AS row_count,
    COUNT(DISTINCT "{{column}}")                  AS distinct_count,
    COUNT(*) FILTER (WHERE "{{column}}" IS NULL)  AS null_count
FROM {{schema}}.{{table}}
WHERE {{bound_predicate}};
-- BODY END

ROLLBACK;
