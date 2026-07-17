-- Probe class: orphan-fk-fanout (Phase 2 / SR-15)
-- Verifies relationship cardinality and informs join-guards.
-- Params: {{schema}} {{child_table}} {{fk_column}} {{parent_table}} {{parent_key}}
--         {{timeout_seconds}} {{bound_predicate}}
--
-- Uses scalar subqueries (not a CROSS JOIN of two CTEs) so the query ALWAYS returns exactly one
-- summary row -- a CROSS JOIN against an empty fanout CTE silently drops the whole row when the
-- child scope has zero non-null FK values (caught live during the KG pilot's dry-run against the
-- empty local seed container). min/max/avg fanout are NULL, not a hidden zero row, when there is
-- no fanout data to compute from -- that is the honest signal, not a bug.
--
-- FIX-3 (review cycle 1): orphan_rate_pct is computed over NON-NULL FK rows only
-- (scoped_row_count), not over total_fk_rows (which includes NULL-FK rows that are neither
-- orphaned nor valid -- they simply have no FK to check). The prior version divided the orphan
-- count by total_fk_rows, under-reporting the rate for any nullable FK column (e.g.
-- analytics_reports.store_id/task_id are both nullable) whenever a meaningful share of rows carry
-- a NULL FK. total_fk_rows is kept as useful context (shows how many rows were in scope overall,
-- including NULLs); scoped_row_count is the new field exposing the real orphan-rate denominator.
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
WITH child_scope AS (
    SELECT "{{fk_column}}" AS fk_value
    FROM {{schema}}.{{child_table}}
    WHERE {{bound_predicate}}
),
non_null_scope AS (
    SELECT fk_value FROM child_scope WHERE fk_value IS NOT NULL
),
fanout AS (
    SELECT fk_value, COUNT(*) AS child_count
    FROM non_null_scope
    GROUP BY fk_value
)
SELECT
    (SELECT COUNT(*) FROM child_scope)      AS total_fk_rows,
    (SELECT COUNT(*) FROM non_null_scope)   AS scoped_row_count,
    (SELECT COUNT(*) FROM non_null_scope ns
        WHERE NOT EXISTS (
            SELECT 1 FROM {{schema}}.{{parent_table}} p
            WHERE p."{{parent_key}}" = ns.fk_value
        )
    ) AS orphan_count,
    ROUND(
        100.0 * (SELECT COUNT(*) FROM non_null_scope ns
            WHERE NOT EXISTS (
                SELECT 1 FROM {{schema}}.{{parent_table}} p
                WHERE p."{{parent_key}}" = ns.fk_value
            ))
        / NULLIF((SELECT COUNT(*) FROM non_null_scope), 0), 2
    ) AS orphan_rate_pct,
    (SELECT MIN(child_count) FROM fanout)          AS min_fanout,
    (SELECT MAX(child_count) FROM fanout)          AS max_fanout,
    (SELECT ROUND(AVG(child_count), 2) FROM fanout) AS avg_fanout;
-- BODY END

ROLLBACK;
