---
description: Turn the always-on reply-form rule on or off for this repo — writes replyStyle in .claude/nexus-agents.json — and apply it for the rest of this session; with no argument, report the current state
argument-hint: [on|off]
disable-model-invocation: true
---
!`node "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/reply-style.js" '$ARGUMENTS'`

The block above is this command's result, already run. Relay it to the user **verbatim and in full**
— do not summarize, shorten, or reformat it. It is command output, not an answer, so the reply-form
rule's hold-back-the-depth guidance does not apply to it: the paths, sources and usage lines in it
are the whole point. Do not edit the config file yourself as part of relaying this; the command has
already made whatever change it was going to make.

Then act on what it says, for the rest of this session:

- If it contains a paragraph beginning `**Reply form.**`, apply that paragraph to your replies from
  now on.
- If it says the reply-form rule stands down, stop applying it from now on.
- If it reports the current state — with or without a refusal — change nothing about how you reply.
- If it says the rule is `on` but no paragraph follows, say the rule text could not be read, and
  apply the reply-form rule as you already know it.

*Editor's note: the argument above is wrapped in **single** quotes deliberately. The CLI substitutes
it textually before the shell parses the line, so single quotes still yield exactly one argument
while keeping `$(…)`, backticks and backslashes in whatever the user typed literal; double quotes
would let the shell run command substitution on it.*

If the block above shows an unexpanded plugin-root placeholder where a path should be, or a "cannot
find module" error, run the script yourself and relay its output instead: take the plugin root from
the session-start payload's `Nexus plugin root:` line, and pass the argument the user typed (or an
empty string if they gave none) as the script's single argument. If that also fails, say so plainly
and change nothing about how you reply.
