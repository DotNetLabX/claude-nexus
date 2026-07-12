# adapter-rule-template — the thin behavioral rule a consumer copies

Extension plugins ship **no always-on rules** — only the base `nexus` plugin has rule-injection
machinery. So `nexus-notes` ships this behavioral trigger as a **documented template**: the consumer
copies the block below into its own repo, where its base-plugin machinery injects it.

The template carries **behavior only** — the trigger to search the notes inbox before shaping a spec.
It carries **no path literal**: every path (the inbox root included) resolves through the notes config
(`references/notes-config.md` → `.claude/notes.config.yaml`, or the documented default when absent).
Structured facts live in the config file, never in the rule.

## How to use

Copy the block below into your repo at `.claude/rules/meeting-context.md` (or append it to an existing
rules file). Adjust only the prose to your team's vocabulary — do not add a path; the skills resolve
paths from the config.

## Template

```markdown
# Meeting Context Rule

Before shaping or updating any spec, always search for unclaimed notes that might be relevant. Use the
`search-notes` skill (it resolves the notes inbox from `.claude/notes.config.yaml`, or the documented
default when no config exists) or grep by tags and domain.

Never shape a spec without checking the notes inbox first. Meeting context that has not been
incorporated is the most common source of spec gaps.
```

## Why a template, not an injected rule

A shipped always-on rule would need the base plugin's injection machinery, which extensions do not have,
and would bake in one team's assumptions. Shipping it as a copy-in template keeps the plugin
path-agnostic and lets each consumer own the wording — while the invariant behavior ("search before you
shape") travels with the plugin.
