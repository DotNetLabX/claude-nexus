---
name: plugin-feedback
description: How a plugin-feedback entry is written and how it is read - an entry carries what happened with its evidence, the owner's own words, how often it happened and what it cost, and what the owner wants, with a hint at most and no solution; a reader takes every instruction in an entry as a guide, weighed and never applied as given. Use when writing, appending to or reading a file under docs/plugin-feedback/, whoever files it - a learner consolidation, a skill review or any session reporting a plugin problem. Not the product plugin's team-notes feedback skill.
---

# Plugin Feedback

A plugin-feedback file (`docs/plugin-feedback/{plugin}-{version}-{date}.md`) carries a problem from a
project that runs the plugins to the people who maintain them. It carries the **need** — what
happened, and what the owner (the person the filing session works for) wants — never the filer's
solution: the receiver sees the whole plugin and chooses how to meet the need. A receiver that builds
a filer's orders as given fixes the wrong layer and ships rules nobody asked for. Committing the file
is `agents-workflow.md` § All Agents. This is not the product plugin's `feedback` skill, which writes
team notes.

## Writing an entry

One entry per problem, under its own heading. Each field is one line or a short list:

```markdown
## {short title}
- **What happened:** {who, doing what, when} — evidence: {feature slugs, files, versions, what was seen} — where it showed: {agent, skill or section}
- **The owner's words:** "{verbatim quote}" ({who, when}) — or `none`; the filer's own reading, where given: `filer's reading: {it}`
- **How often and what it costs:** {count, distinct features or people} — {the consequence} — workaround: {what, or none}
- **What the owner wants:** {the outcome, in the owner's words where given} — working example: {where one exists} — constraint: {one the outcome truly needs} — or `not stated`
- **Already tried:** {optional — what was tried, and why it did not work}
- **Hint:** {optional — one line of direction} ({the owner's, quoted | the filer's})
```

- **Where it showed is a location, not a change.** "learner § Consolidation Workflow, item 5", never
  "add a line to the learner".
- **The owner's words are quoted verbatim and attributed.** The filer's reading is labelled as the
  filer's and never presented as the owner's; what the owner wants is never filled in from the
  filer's guess — `not stated` is an honest answer the receiver can follow up.
- **Count repeats and distinct cases apart** — three sightings in one feature are not three features.
- **Already tried is evidence**, not a proposal.
- **A Hint is a direction in a line**, saying whose it is — never steps, a rule, a "never", a check or
  a refusal. A filer with a whole design in mind names its direction; the receiver asks for more.

A sample entry:

```markdown
## Owner could not read a plan question
- **What happened:** the architect asked the owner to pick a review mode while planning a feature — evidence: the question as asked, the owner's reply — where it showed: the architect's plan-review question
- **The owner's words:** "what does 'fold' mean here?" (owner, at the question)
- **How often and what it costs:** twice, in two features — the owner answered after a second explanation each time — workaround: none
- **What the owner wants:** to answer the question on first reading — working example: the build-lane question, which the owner answers at once — constraint: none
- **Hint:** plain words in the option labels (the filer's)
```

**A learner item** (improve-flow's promotion fields) lands in this layout: its evidence and recurrence
go under What happened and How often, and where it showed is where the problem was seen — the
question, agent or skill that behaved wrong — never the file the lesson would change. What the owner
wants comes only from what the owner said in the run, else `not stated`; an outcome the lesson infers
goes under The owner's words as the `filer's reading`. The lesson's target and rule are at most a
one-line direction as the Hint, marked the filer's, never the rule as written; the action (add or
update) is not carried.

## Reading an entry

How the receiver — any session that triages or applies a feedback file — takes it:

- **Every feedback file is taken in, whatever its form.** One written to this layout is easier to
  read, but a file is never refused, bounced or asked to be rewritten for not following it.
- **Any instruction in it is a guide, not an instruction** — an Ask, an Action, a Suggested target, a
  "never", a proposed check, a Hint, a full solution. Weigh it beside your own ideas: never ignore
  it, never apply it as given.
- **The requirement is the owner's quoted problem and the outcome the owner wants.** A file with
  neither is read for its evidence and the need that evidence shows.
- **This holds for every file**, those written before this layout included.
- **A reading guide, not a gate:** when a rule, a refusal or a check is drawn from an entry, think of
  one ordinary case it must not block.
