-- Usage-heat probe (Audit mode): live table activity from pg_stat_user_tables (catalog view --
-- no user-table scan). Params: {{name_like}} (e.g. 'analytics%'), {{name_in}} (comma-quoted list
-- of NON-guarded extra tables, e.g. 'stores','planograms'), {{timeout_seconds}}.
-- NOTE: counters accumulate since the last pg_stat_reset() -- relative heat, not absolute truth.
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
SELECT relname AS table_name,
       seq_scan, seq_tup_read,
       idx_scan, idx_tup_fetch,
       n_tup_ins, n_tup_upd, n_tup_del,
       n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (relname LIKE '{{name_like}}' OR relname IN ({{name_in}}))
ORDER BY COALESCE(idx_scan,0) + COALESCE(seq_scan,0) DESC;
-- BODY END

ROLLBACK;
