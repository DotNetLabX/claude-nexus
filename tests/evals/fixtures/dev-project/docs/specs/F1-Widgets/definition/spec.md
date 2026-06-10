# F1-Widgets — Feature Spec

Status: Ready

## Summary

Cache the widget list so the dashboard loads fast.

## Requirements

- **R1 — Cached list.** `GET /api/widgets` serves from a cache with a 60s TTL.
- **R2 — Invalidation.** Any widget mutation invalidates the cache immediately.
