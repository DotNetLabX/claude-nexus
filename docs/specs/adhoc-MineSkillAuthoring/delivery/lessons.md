# Lessons — adhoc-MineSkillAuthoring

## Architect Lessons

- **Same-session oracle production is a structural fault, not a sequencing accident.** Pilot 2 followed the then-ratified Graduate-to-spec text ("its pilot pulls a Mine→Verify registry first") and mined the clusterize registry inside the consuming run — colliding with a concurrent canonical registry run (truth fork, contained at SDK `128aab9` + supersede + brief renumber) AND compromising the conformance gate's independence even absent the collision. The SDK architect's proposal amendment (HARD BLOCK: stage-0 precondition, never self-mine) is the correct supersession; folded into plan step 2 the same day. Lesson: when a method consumes a verified artifact as its oracle, the plan must require the oracle to be produced by a *separate* run — "the pilot pulls it first" hid a same-session shortcut.
- **A ratified proposal can be amended mid-planning by the consuming repo's architect; re-ground the affected plan step immediately** (revision-pass rule) rather than letting the critic catch the drift — the binding contract is the live proposal text, not the version read at plan start.
