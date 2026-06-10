# F1-Widgets — Feature Spec

Status: Ready

## Summary

Expose the existing Widget aggregate through a read API for the dashboard.

## Requirements

- **R1 — List endpoint.** `GET /api/widgets` returns all widgets as `{id, name, status}`.
- **R2 — Paging.** The list endpoint accepts `page` and `pageSize` (default 1, 25; max pageSize 100)
  and returns `totalCount` in the response envelope.
- **R3 — Audit log.** Every request to the widgets API writes an audit entry
  (`timestamp, caller, endpoint, resultCount`) to the audit store. This is a compliance
  requirement — the feature cannot ship without it.

## Out of scope

- Widget mutation endpoints (create/update/delete).
