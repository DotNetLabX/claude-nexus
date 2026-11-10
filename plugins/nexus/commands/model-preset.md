---
description: Show the model presets side by side and the one in force, or choose this Claude Code profile's preset (standard or fable) - add --repo to set it for this repo only
argument-hint: "[standard | fable | set {preset} [--repo]]"
disable-model-invocation: true
---
!`node "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/model-preset.js" '$ARGUMENTS'`

The block above is this command's result, already run, as one JSON object. Do not edit the profile
file or the config file yourself as part of relaying it; the command has already made whatever change
it was going to make. Relay it as follows, adding nothing about models the result does not say.

- **With no argument** it shows the presets. Say which preset is in force (`preset`) and where it
  comes from (`source`): `profile` is this Claude Code profile's choice, `repo` is this repo's own
  setting, and `unset` means nothing was chosen, so the standard preset runs. Then show `presets` as
  one table: a row per `runs` entry's `setting`, a column per preset in `presets` order, each cell its
  `value`, with the column of the preset in force marked. Where `ignored` lists entries, say each one
  is a repo setting this profile has not chosen, so it is not used here. End with the profile file
  (`profilePath`) and the two ways to change: `/nexus:model-preset {preset}` for every repo this
  profile opens, and `--repo` added for this repo only.
- **After a preset name or `set`** it names the preset written (`set`), where (`written`, the file
  `path`) and the preset now in force. Say that agents a session starts from now on run on it, and
  that a session the user opens themselves keeps the model they pick. Where `note` is present, relay
  it as it is.
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
