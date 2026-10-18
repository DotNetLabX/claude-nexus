---
description: Show the pipeline gears side by side, set this repo's gear (writes gear in .claude/nexus-agents.json), or set the gear for the next feature planned in this session only
argument-hint: "[set {gear} | next {gear}]"
disable-model-invocation: true
---
!`node "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/gear.js" '$ARGUMENTS'`

The block above is this command's result, already run, as one JSON object. Do not edit the config
file yourself as part of relaying it; the command has already made whatever change it was going to
make. Relay it as follows, adding nothing about gears the result does not say.

- **With no argument** it is the gear table (`gears`, `rows`). Show it as one table: a row per
  setting (`setting`), a column per gear in `gears` order, each cell the value's `text` where it has
  one, else its `value`. Head the column of the repo gear (`repoGear.name`) as the repo's gear;
  where `repoGear.state` is `unset`, say no gear is set and the pipeline asks every process question
  as before; where it is `missing`, say the repo names a gear that does not exist, so it runs as if no
  gear were set. Where `pendingSwitch` names a gear, say the next feature planned in this session
  runs at it, and the repo gear after that. Where a row carries `overridden`, mark that row's cells as
  replaced by the repo's own setting, giving its `value` and saying it comes from the repo's
  settings. Where row 10 carries `repo`, give it beside the row. End with the result's `note`, then
  the two ways to change gear: `/nexus:gear set {gear}` for the repo, `/nexus:gear next {gear}` for
  the next feature only. `off` keeps every question the pipeline asks today.
- **After `set`** it names the repo gear now written (`gear`) and the file (`path`): say the repo
  runs at that gear from its next plan, and that a feature whose plan has already started keeps its
  gear.
- **After `next`** it names the gear (`next`): say the next plan started in this session takes it,
  and the repo gear applies again after that feature closes.
- **With `create`, `change` or `show {name}`** — where the `custom-gears` skill (`nexus-pro`) is in
  your skill list, creating or changing a custom gear, and showing one beside its base gear, is that
  skill's: load it and follow it with the user's words, in place of relaying the result above.
  Otherwise creating a custom gear is not offered, and the result is relayed as below.
- **With `error`** it is a refusal: relay the error's text as it is — it names the fix — and change
  nothing.

*Editor's note: the argument above is wrapped in **single** quotes deliberately. The CLI substitutes
it textually before the shell parses the line, so single quotes still yield exactly one argument
while keeping `$(…)`, backticks and backslashes in whatever the user typed literal; the script
splits that one argument into words itself.*

If the block above shows an unexpanded plugin-root placeholder where a path should be, or a "cannot
find module" error, run the script yourself from the session's project folder and relay its output
instead: take the plugin root from the session-start payload's `Nexus plugin root:` line, and pass
the argument the user typed (or an empty string if they gave none) as the script's single argument.
If that also fails, say so plainly and change nothing.
