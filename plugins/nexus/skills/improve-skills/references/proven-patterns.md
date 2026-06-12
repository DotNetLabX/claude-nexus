# Proven Patterns & Anti-Patterns (evidence-backed)

The evidence layer for skill design: mechanisms that demonstrably earned their keep in
long-running consumer projects, and machinery that was specified but measurably dead.
Consulted by `improve-skills` on every fix and every new build; `evaluate-skill`'s rubric
(Layer 2) checks against the anti-patterns. Provenance: an Omnishelf five-skill job-fitness
round (2026-06-11, four independent evaluators) + the knowledge-gateway skills audit
(2026-06-12); distillations live in the plugin repo under `docs/evidence/`.

Each pattern: the mechanism → why it's proven → when NOT to use it.

## Patterns that earned their keep

**P1 — Deterministic post-condition scripts, not prose rules.** A rule that matters gets a
script that runs in the *producing* phase, every pass — never parked behind an optional
review step. Proven: a recurring output defect survived two rounds of prose-rule fixes and
was only stopped by a verification script; prose rules drift exactly when sessions degrade
(compaction, model fallback). Skip for genuinely one-off judgments; script anything that
will be checked more than twice.

**P2 — Receipt/state-first writing at every phase boundary.** Write the durable record
(receipt, state file, staging entry) *before* continuing; treat it as the deliverable.
Proven: enabled full reconstruction after mid-run compaction, resume after a subagent death,
and disk-verification of an empty-ack subagent's real work. Skip for light conversational
skills with one artifact and no batch mode.

**P3 — Checkpoint-as-preview.** The staged draft *is* the preview; rejecting at the
checkpoint *is* the dry run — one mechanism, two uses, no separate `--dry-run` flag. Use
wherever a staging area exists; never add a checkpoint solely to get a preview (see AP7).

**P4 — Preserve-on-write + count-regression guard.** A skill that rewrites a file others
enrich must merge, never replace — and lint that entry counts didn't shrink. Hollowing-out
is the catastrophic failure for a file agents read fully. Needed wherever a generated file
accumulates manual edits.

**P5 — Confidence = min(mechanical ceiling, model judgment), re-derived by the
orchestrator.** Never trust a subagent's self-score; tie named caps to evidence classes, and
have the orchestrator recompute rather than accept. For any skill that scores its own output.

**P6 — Two-axis quality: per-claim correctness ≠ completeness.** "Each claim is right" and
"nothing was missed" fail independently — instrument both; never let high per-claim
confidence convert into a false all-clear on coverage. Proven: a coverage self-check found
real omissions that per-claim verification was structurally blind to.

**P7 — Carry-over confirm-or-refute.** Observations made while drafting are queued in one
file and explicitly confirmed or refuted in a later phase — the cheapest honesty loop
available (measured: dozens of findings dispositioned for the cost of one file).

**P8 — Bidirectional coverage matrix with dispositions.** When artifact B must cover
artifact A, the check is a two-way matrix where every A-item gets an explicit disposition
(covered / deferred-with-carry-line / n-a) — and the self-check FEEDS the independent
reviewer, never replaces it.

**P9 — Empirically-validated tool playbooks.** Encode *measured* external-tool behavior
(ceilings, traps, exact parameter names), dated, with the validation artifact kept. Never
encode an external-system claim without live verification or a citation — a confidently
wrong "the API can't do X" claim survived until someone tested it.

**P10 — Changelog-with-lessons → versioned evolution.** Heavy skills keep an append-only
changelog whose lessons feed the next version — and the loop only counts when a version
actually ships.

**P11 — `update` mode must emit what the revision cycle actually consumes.** Having an
update mode is not enough: name the *consumer* of a revision and produce their artifact.
Proven failure: an update mode existed but didn't emit the delta record the downstream
cycle needed — users ran *around* the skill and convention violations shipped unchecked.

## Anti-patterns (never build these)

**AP1 — Dead-letter enforcement.** A gate, cap, or "refuses to X" rule with no executor
that runs every pass. Measured harm: a promotion gate with 0% adoption whose validator
never ran — and *no consumer noticed*; a quality gate parked behind an optional step that
recorded zero data across 79 runs. **Rule: every MUST names who or what executes it on
every run — or it is deleted from the spec.**

**AP2 — Half-landed fixes.** Fixing a rule where it was reported while sister surfaces keep
the old rule. Measured harm: a reworded convention landed in the template while the skill
kept the old cap — the old behavior recurred *the same day* the lesson was captured.
**Rule: a fix sweeps every normative surface — convention, skill, template, and standing
generated artifacts a future run re-reads — in one pass.** (Same loss class as nexus ADR-19.)

**AP3 — Restated rules with no single-source owner.** "Reinforcement" copies drift
independently — measured: a declared-intentional redundancy produced examples contradicting
the hard rules two screens away. **Rule: one fact, one owner; every other location
references it.** (Where duplication is genuinely required — e.g. background subagents that
see only their own card — pin the copies with a mechanical convergence check so editing one
side alone fails.)

**AP4 — Hardcoded inventories.** Enumerated file lists where the real set grows — the
high-leverage newcomers become invisible to lint, indexing, and staleness checks.
**Rule: glob + classify; never enumerate what the filesystem can list.**

**AP5 — Fictional infrastructure.** Paths, tools, or destinations that don't exist on the
machine. Measured: half a skill's learning loop pointed at an inbox directory that never
existed. **Rule: at authoring time, verify every named path/tool exists; a fictional
destination is worse than none because it reads as wired.**

**AP6 — No finalize path on a multi-phase producer.** Persist ceremony welded to full
completion, so a stall strands everything. Measured: a producer sat half-done for three
weeks, unconsumable downstream, while its completed phases were demonstrably usable.
**Rule: any multi-phase producer ships a "finalize what exists" entry point.**

**AP7 — Checkpoints that gate nothing.** Interactive gates where the human has never
changed anything just add stall points (one run died waiting at exactly such a gate).
**Rule: a checkpoint earns its stop only where corrections have actually happened (scope,
naming, pre-persist review); merge the rest.**
