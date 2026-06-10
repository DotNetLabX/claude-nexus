# F1-Widgets — Implementation Plan

Input: docs/specs/F1-Widgets/definition/spec.md

## Steps

### Step 1 — Widget list query + handler
Skill: None
Add `ListWidgetsQuery` (`page`, `pageSize`) and its handler reading from `IWidgetRepository`.
Defaults page=1, pageSize=25, cap pageSize at 100. Handler returns items plus `totalCount`.

### Step 2 — Endpoint
Skill: None
Add `GET /api/widgets` endpoint mapping query-string `page`/`pageSize` to `ListWidgetsQuery`
and returning `{items, totalCount, page, pageSize}`.

### Step 3 — Tests
Skill: None
Handler tests: default paging, max pageSize cap, empty repository. Endpoint test: 200 with
envelope shape.
