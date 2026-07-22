# F32-ContractFormRegistryPilot (grammar half) — Lessons

## Developer Lessons

- **"Sibling weight" is logical/content weight, not physical line count.** The plan's critic-compressed
  `precondition:` bullet wraps to 3 physical lines while the `status` sibling is 2 — but the binding rule
  said "verbatim, do not re-expand." Copied as-is; "matches sibling weight" meant matches the plain
  2-line-class bullet format (a field name + one clause of qualification), not an identical line count.
  No re-wrapping or trimming was warranted.
- **Fast-lane omni-sync is a lane-close concern, not a per-agent one.** `release-plugin` step 5 (gen-omni)
  is coupled to a commit in the sibling `../omni` repo. Under an architect-led fast lane with "NO git
  writes / commit at lane close," the twin regen rides with the closure commit — running it mid-lane would
  either strand an uncommitted twin or force a forbidden git write. Deferred and documented as a deviation.
