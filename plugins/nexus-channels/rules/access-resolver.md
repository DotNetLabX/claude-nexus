- **Source selection is configuration, never agent judgment.** Resolve each declared corpus's
  channel from the repo's `.claude/access.yaml` and the table below — safe defaults and compare
  fallbacks as stated — never from what a tool's description sounds like it offers, and never by a
  route of your own. A row that delegates its choice to a version
  compare is not an exception: the declaration still fixes the rule and the inputs, and what it asks
  of you is the comparison, not a judgment. The declaration governs how a declared corpus is reached,
  not which sources a question may use: an independent source it does not name (chat, the issue
  tracker, live data) stays usable unless its `deny` list forbids it. For what is running in the
  field, live data and operational records come before meeting summaries.
- **Absent file or absent key ⇒ the corpus kind's safe default**, never a guess: a private corpus is
  its local copy, a published corpus is its declared remote (or its local copy, disclosed as
  currency-unverified, when no remote is declared), a split corpus carries both arms and the skill
  that uses it picks per operation.
- **Never choose between two live channels by tool description.** If two channels could serve the
  same corpus, the declaration decides which one — directly, or by naming the compare or the
  operation that decides — and where it names none of those, the corpus is unresolved.
- **An unresolvable declared corpus ⇒ refuse to ground from it and say so.** Do not reach it by
  another route, and do not answer from memory of it; name what is unresolved and what would fix it.
  Independent sources may still answer.
- **A row whose channel reads `by compare` is decided by you, this session.** Its compare cell names
  the version tool to call, the key to read from that tool's answer, and the value to compare
  against. Equal ⇒ **use the local copy** (`tie`); different ⇒ **use the remote**, calling the tools
  in its remote cell for the content (`stale`). Run it once, at the first grounding of that corpus,
  not per answer. If the tool cannot be called — not available, refused, or its answer carries no
  such key — use the local copy and say the compare did not run. If the compare says `stale` but the
  remote cannot serve the content either, use the local copy, keep the `stale` outcome, and say the
  copy is behind. The version tool answers versions; never fetch content with it.
- **Every grounded answer names its channel, its version and its compare outcome**, on one line:
  `Grounded: {corpus} via {local copy, stamp {value} | remote {server}}; compare: {tie | stale — local {a}, remote {b} | not run — {reason} | not declared}.`
  Quote the stamp as its own cell shows it, drop it on a row that has none, and name the arm you used
  for a split corpus. A compare cell reading `—` alone is `not declared`; one reading `— ({reason})`
  is `not run — {reason}`. An independent source the declaration does not name takes
  `Grounded: {source} via {channel}, as of {date or version}; compare: not applicable.`
