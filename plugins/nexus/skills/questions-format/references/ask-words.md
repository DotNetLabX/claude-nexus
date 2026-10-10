# Plain words for an owner ask — the two lists

The owner ask says the plain thing. Two lists say what that rules out, and the ask gate
(`owner-ask-gate.js`) checks both.

**Vocabulary** holds the plugin's own words — the ones an agent uses to itself and the owner has to
translate. None of them appears in an ask's header, its question text, an option label or an option
description; the writer says the plain thing instead ("a second reader" for a checker seat, "the rule
for a matching model family" for the pairing rule). The one exception is the catalogue name on a
routine ask's first line: the names in `standard-questions.md` are the owner's handles for the
plugin's fixed questions, and are meant to be recognised rather than read.

**Pointer phrases** send the owner outside the ask for a fact instead of carrying it. An ask carries
its facts or does not need them: "rows repeat inside the section, which you ruled on 26 August"
carries the fact; "as per the earlier ruling" points at it.

The ban is **sense-blind** — the gate matches the token, not the meaning — so a word that is also
plain English in a software project (a git hook, a package registry, a checkout lane, a licence seat,
a URL slug) is never listed on its own, only inside a compound that is the plugin's. Role names
(reviewer, developer, architect, critic, learner, team lead, solo) are plain words for people and are
not listed.

Matching is case-insensitive and whole-word. Inside a compound, any run of whitespace or a single
hyphen joins the words, and a trailing `s` or `es` on the last word still matches.

**Who changes the lists.** The learner proposes a word for the vocabulary at consolidation when a
sighting shows the owner had to ask what it meant — this document ships with the plugin, so a
consuming project routes that proposal through its plugin-feedback file rather than editing here. A
word leaves the shipped lists only by the owner's ruling. A consuming project that reads one of the
**vocabulary** words as its own plain English allows it for itself, under `askWords.allow` in
`.claude/nexus-agents.json`, and is then not refused on it; the pointer phrases carry no such
allowance, because pointing at a fact instead of carrying it is never a project's own plain English:

```json
{ "askWords": { "allow": ["persona", "fast lane"] } }
```

## Vocabulary

- `fold`
- `merge table`
- `checker seat`
- `critic seat`
- `reviewer seat`
- `rules ledger`
- `coverage ledger`
- `pairing`
- `pairing check`
- `census`
- `rules estate`
- `prose estate`
- `baseline surface`
- `omni twin`
- `persona`
- `fast lane`
- `hand-back`
- `sighting`
- `model stamp`
- `done-check`
- `skeptic`
- `hidden oracle`
- `regen`
- `mine-from-spec`
- `mine family`

## Pointer phrases

- `as discussed`
- `as above`
- `as before`
- `as agreed`
- `as noted`
- `the earlier ruling`
- `the earlier decision`
- `the previous plan`
- `the previous ruling`
- `per the plan`
- `per the spec`
- `per the rule`
- `see the plan`
- `see the spec`
- `see the artifact`
- `in the artifact`
- `as the plan says`
- `as the spec says`
