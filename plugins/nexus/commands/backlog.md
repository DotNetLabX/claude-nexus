---
description: Show uncompleted features from the backlog as a compact status table
argument-hint: [all]
---
Read `docs/backlog.md` and list **only uncompleted** features as a compact table (the `status-table-format` rule):

| ID | Name | Status |

- **ID** — backlog item number. **Name** — short feature name. **Status** — current state (Spec Ready, In Progress, Parked, Done, etc.).

Show all features only if `$ARGUMENTS` contains "all". No prose or explanations unless asked.
