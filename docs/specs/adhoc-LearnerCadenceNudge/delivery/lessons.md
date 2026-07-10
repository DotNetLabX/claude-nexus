# Lessons — adhoc-LearnerCadenceNudge

## Architect Lessons

- **Integration surfaces need their own verification pass — "the pattern exists" is not "adding a
  sibling is safe."** [adhoc-LearnerCadenceNudge] The definition verified the hooks.json wiring
  *shape* against the live file but missed all three integration facts a code-grounded critic
  found: the wiring lint forbids a duplicate `(event, matcher)` (so "add an entry like
  register-persona" was a red-CI instruction), the only proven output-delivery shape is the
  `systemMessage` JSON envelope (a raw stdout line would have shipped green and been inert — the
  AC was false-green because a substring grep matches both shapes), and the release step assumed a
  clean tree that actually held a sibling's uncommitted bump. **How to apply:** for any
  hook/wiring/release-touching spec, verify three surfaces explicitly: (1) what the LINTS assert
  about the config being extended, (2) what the DELIVERY convention of the sibling components
  actually is (read their output code, not just their input code), (3) what the WORKING TREE holds
  right now that the release step will collide with.
- **An AC must discriminate the failure it guards.** [adhoc-LearnerCadenceNudge] AC-4's "stdout
  contains the substring" passed for both the working envelope and the inert raw line — a
  verification that cannot distinguish delivered from undelivered verifies nothing about delivery.
  Same family as the vacuous-grep skeptic clause harvested into the mine-family core: check that
  the check CAN fail on the failure mode it exists for.
