---
name: fail-closed-intake
description: Resolve the declared intake requirements for a question before any query runs — the model-then-profile-then-floor precedence, the per-measure must-specify union, the per-user defaults record with legacy migration, and the fail-closed gate that blocks a query while a mandatory input stays unresolved. Use before the data-analyst asks its batched clarification message or greenlights a query, so no input is silently assumed and every applied default is named.
user-invocable: true
---

# Fail-Closed Intake

## The declaration schema

The declaration is data the plugin reads, never knowledge the plugin ships — the plugin is
agnostic to which inputs a product requires. One normalized shape carries it, identical whether
the source is the semantic model (authoritative) or a consuming project's profile (the interim
bridge, see the sibling `mine-semantic-model` skill's
`skills/mine-semantic-model/references/project-profile.md`): one
`inputs` dictionary defines every declared input once, and both the question-level list and each
measure's mandatory-flag list reference those dictionary ids rather than redefining fields per
measure — this is what makes it one shape, not two divergent flavors.

```yaml
inputs:                                  # the declared-input dictionary -- every input's fields, defined once
  <input_id>:
    ask: "<question wording>"
    examples: ["<optional>"]
    policy: must_ask | documented_default | persistable_per_user_default
    default: { value: "<v>", wording: "<w>" }   # documented_default only; relative dates data-anchored (BR8)
    legacy_source: "<path>"              # persistable_per_user_default only, OPTIONAL -- where a legacy value migrates from (BR6)
question_level: [<input_id>, ...]        # inputs mandatory on EVERY question
measures:
  - name: <measure_name>
    must_specify: [<input_id>, ...]      # inputs mandatory ONLY when this measure is in the question
```

Every field of a declared input (`ask`, `examples`, `policy`, `default`, `legacy_source`) is
defined exactly once, inside `inputs`. `question_level` and every measure's `must_specify` only
ever reference those ids. `policy` is one of three values: `must_ask` (never defaulted — if the
question doesn't resolve it, it is asked), `documented_default` (a named default, always stated in
the shipped answer), or `persistable_per_user_default` (the user's first answer is saved and
reused across sessions, read back and confirmed, never re-asked). This skill ships no
product-specific input in this shape — no "chain", no "out_of_stock_rate" — only the neutral shape
above; a real product's inputs live in that product's own model or profile data.

## Precedence resolution

Precedence is resolved **per `id` and per measure**, never per whole layer. Three layers, in
order: (1) the semantic model, authoritative; (2) the consuming project's profile, the interim
bridge for whatever the model doesn't yet declare; (3) the plugin-native floor (below), the
backstop that always applies regardless of either layer. For a question-level input, the model's
entry for that id supersedes the profile's entry for the same id; a profile entry for an id the
model does not declare stays in force. For a measure, the model's `must_specify` classification for
that measure supersedes the profile's; the profile's flags for a measure the model has not
classified stay in force. Each bridge entry retires as its model counterpart lands, item by item —
there is no window where a previously-mandatory input stops being mandatory. Once every one of the
profile's interim entries is shadowed by a model-carried counterpart, flag the interim section's
now-safe removal to the repo owner as a note in the session — never an automatic edit to the
profile (see the sibling `mine-semantic-model` skill's
`skills/mine-semantic-model/references/project-profile.md` for where that interim section lives).

## Mandatory-set resolution

The mandatory set for a question is the union of `question_level` and the `must_specify` list of
every measure the question touches. A measure with no `must_specify` entries contributes nothing
beyond the question-level set; flags are additive, never a replacement for the question-level list.

## The fail-closed gate

No query runs while any mandatory input for the question is unresolved: not present in the
question's own wording, no persisted default on record, and no documented default whose policy
allows applying it. There is no run-anyway path and no fallback guess — a user who declines to
answer, or says to just run it, keeps the query blocked; restate which inputs are still needed and
stop there.

## One batch

Ask every still-missing mandatory input in **one message** — never a sequence of single questions —
and never ask the same input twice within one question's intake. This is what the `data-analyst`
agent's intake section delegates to this skill.

## The per-user defaults record

Persisted answers for every `persistable_per_user_default` input live in one plugin-owned file:
`my-workspace/analyst-defaults.json`, a flat JSON map of input id to persisted value. Create the
file and any missing parent folders on first persist. A persisted default is read back and
confirmed inline on every later use — never re-asked — and the user can change it at any time by
saying so, which persists the change. A record that cannot be read is treated as absent: the
affected inputs are simply asked again and the record rewritten. Concurrent sessions resolve
last-writer-wins. A persisted default is a UX convenience only, never access control — it never
narrows what a user may query, it only pre-answers a question.

## Legacy migration

When an input's declared `policy` is `persistable_per_user_default`, its `legacy_source` field
names a path holding a value, and the defaults record does not yet carry that input, port the
legacy value into the defaults record and confirm it inline: "Using default {input}: {value} —
migrated from your previous setting." The legacy file is read, never written — retiring it is a
product-repo work item, outside this skill's scope.

## The plugin-native floor and destination

The **floor** — `grain` and `date_range` — is never carried in the declaration; it is a backstop
that always applies regardless of what the model or profile layers declare. `grain` is resolved
via the sibling `semantic-model-query` skill's resolution ladder, from the question's own wording —
it is never a user-interview item. When that ladder's `grain -> table` lookup resolves nothing,
that lookup-miss is itself the signal that grain cannot be established from the question; this
skill's ask, in that case, is a business-language clarification ("per store, or per SKU?"), never a
technical "what grain?" prompt — see the sibling `semantic-model-query` skill for the trigger this
ask fulfills. `date_range` is a genuine user-supplied input and follows the same fail-closed and
documented-default rules as any declared input.

Independent of the declaration, this skill also always resolves the **output destination**
(conversation, or a spreadsheet link plus tab) — a universal workflow input, not a data-semantics
one; a destination already given in the question's wording is not re-asked, a deliberate relaxation
from asking it every time. The floor and the destination together are the **only** plugin-native
intake items — the plugin ships no product-specific input.

## Data-anchored relative dates

When applying a `documented_default` that is a relative range ("last 30 days"), resolve it against
the data's latest available date, never today's real-world date. Hand the resolved, concrete range
to the shipped answer's "assumed:" line (the sibling `answer-qa` skill's answer contract) — this is
an obligation the intake boundary states explicitly, the same restatement treatment the sibling
`semantic-model-query` skill gives its own row-quality exclusions.

## The persistence boundary

The per-user defaults record is the ONLY file this skill ever writes — never version-controlled,
never the repository's ignore file, never the semantic model or profile. A failed persist
(permissions, disk) falls back to re-asking: defaults are UX-only, so a write failure never blocks
an answer, mirroring the unreadable-read-is-absent policy above.

## What this skill does NOT do

- Decide which measures flag which inputs — that's model content, owned by the semantic model's
  own lane; this skill reads the declaration, it never classifies it.
- Own the grain-resolution ladder itself — that's the sibling `semantic-model-query` skill; this
  skill only owns the ask that fires when the ladder's grain lookup misses.
- Check a shipped answer's presentation contract — that's the sibling `answer-qa` skill, run after
  this skill's gate has already let the query proceed.
- Write to the semantic model or the consuming project's profile — the only file this skill ever
  writes is the per-user defaults record.

**Consumed by:** the `data-analyst` agent, before any query and before its batched clarification
message is sent.

Discovered a defect in the declaration schema or the fail-closed gate while using this skill? Log
it — inside the SDD pipeline, append to that feature's `docs/specs/{slug}/delivery/lessons.md`
under `## Developer Lessons` or `## Skill Gaps`; running standalone, note it for the project's own
lessons flow. Never silently work around a gap.

## References

- `docs/semantic-model/profile.md` — the consuming project's committed model contract; may carry
  the interim-bridge intake declaration in this skill's shape (see
  `skills/mine-semantic-model/references/project-profile.md`'s intake-declaration section).
- `my-workspace/analyst-defaults.json` — the per-user defaults record this skill owns; created on
  first persist, never version-controlled.
