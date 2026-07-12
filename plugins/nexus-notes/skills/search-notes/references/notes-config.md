# notes-config — the per-source configuration contract (ADR-57)

Every `nexus-notes` skill resolves its paths through **one config file per consumer repo**. No skill
body hardcodes a consumer path; the config file is the single source of those facts. This reference is
the contract that file must satisfy, and the **only** place the no-config default inbox is normative.

## Location

The consumer repo places the file at:

```
.claude/notes.config.yaml
```

YAML was chosen because note frontmatter and the pipeline's own watermarks are already YAML — consumers
read it fluently (decision recorded in the plan's Decisions table).

## Schema

The file declares a list of **sources**. One entry per notes source; the set is open — a new source
kind is representable without a plugin change (BR 4).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `id` | string | yes | Stable identifier for this source (e.g. `meetings`, `slack`). |
| `kind` | enum (open) | yes | `meetings` \| `slack` \| … — future kinds (e.g. `teams`) are added here, no plugin change. |
| `staging` | path | yes | Where the producer fetch writes and extract reads (e.g. `transcripts/`, `slack-pulls/`). Consumer-side skills do not read this; it is here for the wave-2 producers. |
| `inbox` | path | yes | The notes inbox root — where extract writes and **search/claim read**. This is the path `search-notes` and `claim-notes` resolve against. |
| `registry` | path or `null` | yes | Source-specific registry reference (e.g. the Slack channel list); `null` when the source has none. |
| `enabled` | boolean | yes | Whether this source is active. Disabled sources are skipped by all skills. |

An optional top-level `models:` block overrides the model **tier** used by the pipeline's agents
(wave-2 producers). **Tier names only** — `opus` \| `sonnet` \| `haiku`. Never a pinned model version id
(BR 5).

## Example

```yaml
# .claude/notes.config.yaml — per-source configuration for the nexus-notes pipeline.
# One entry per notes source. An absent file falls back to the single documented default (below).

sources:
  - id: meetings                # stable identifier for this source
    kind: meetings              # open enum: meetings | slack | teams | ...
    staging: transcripts/       # producer fetch writes / extract reads
    inbox: ../omnishelf-pipeline/docs/meeting-notes/   # extract writes; search/claim read
    registry: null              # no source-specific registry
    enabled: true
  - id: slack
    kind: slack
    staging: slack-pulls/
    inbox: ../omnishelf-pipeline/docs/meeting-notes/
    registry: .claude/slack-channels.yaml
    enabled: false

# Optional — override the model tier for the wave-2 producer agents. Tier names only.
models:
  extractor: sonnet
  critic: opus
```

## The no-config default (normative)

When **no config file exists**, every `nexus-notes` skill resolves the notes inbox root to:

```
../omnishelf-pipeline/docs/meeting-notes/
```

This default exists solely to preserve today's consumers, which read that sibling path directly. It is
the one path literal the plugin states; any consumer with a different layout authors the config file
above and the default never applies. **This reference is the only normative statement of the default —**
skill bodies cite this file rather than restating the path.
