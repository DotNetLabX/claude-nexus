# Changelog — nexus-notes

All notable changes to the `nexus-notes` plugin.

## [0.1.0] — 2026-07-12

Initial release — wave 1 (consumer surface). The meeting-notes pipeline's consumer half, shipped as
a versioned extension plugin instead of the per-repo copies with hardcoded sibling paths that are
documented to drift.

- **`search-notes` skill** — read-only search/rank of the unclaimed-notes inbox by domain, tags,
  type, category, date, keyword, confidence, status, completeness, and meeting. Resolves the inbox
  root from the per-source notes config (`.claude/notes.config.yaml`), falling back to one documented
  default when no config exists. Never moves, edits, or claims a note.
- **`claim-notes` skill** — confirmation-gated claim: present matches → user confirms → move the
  selected notes into `docs/specs/{slug}/definition/notes/` → stamp `claimed_by`/`claimed_at`
  frontmatter. Never claims without an explicit in-session confirmation.
- **Shared references** (`search-notes/references/`): `notes-config.md` (the ADR-57 per-source config
  contract plus the documented no-config default inbox), `note-schemas.md` (the consumer
  note-frontmatter field-set contract both skills cite), and `adapter-rule-template.md` (the thin
  behavioral rule a consumer copies into its own `.claude/rules/`).
- Extension plugin — requires `nexus` core installed (`dependencies: ["nexus"]`, ADR-3/ADR-56); ships
  no always-on rules and defines no new consuming-repo artifacts of its own beyond the config file the
  consumer authors.
