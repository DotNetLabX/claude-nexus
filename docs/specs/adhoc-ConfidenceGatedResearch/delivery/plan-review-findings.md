# Plan Review — adhoc-ConfidenceGatedResearch (code-grounded, reproduced)

**Reviewer:** independent code-grounded critic (reproduction of a lost critic verdict)
**Plan:** `docs/specs/adhoc-ConfidenceGatedResearch/delivery/plan.md`
**Method:** read the live source on disk; grepped the repo; verified every plan claim against file:line evidence. Did not trust the plan's own line refs.

**Verdict: GO-with-fixes** — blocking: F1, F2, F3, F4. Non-blocking: F5, F6, F7, F8.

---

## F1 — [HIGH / BLOCKING] Step 3 cites the wrong `plugin.json` path

**Claim under review:** Step 3 Files list (plan L96): "`plugins/nexus/plugin.json`".

**Evidence:** There is no file at `plugins/nexus/plugin.json`. The manifest lives at
`plugins/nexus/.claude-plugin/plugin.json` (verified: `Glob plugins/nexus/plugin.json` → no files;
`plugins/nexus/.claude-plugin/plugin.json` exists, current `"version": "1.8.1"`). The CLAUDE.md
and `release-plugin` skill abstract this away, but the plan states the path literally and it is wrong.

**Why it matters:** A developer/team-lead following the literal Files list edits or greps a
non-existent path. Minor in practice (the `release-plugin` skill + `bump-plugin.mjs` own the real
path), but it is a factual grounding error in a plan whose review mode was chosen *because* it edits
live files.

**Fix:** Change the Step 3 Files reference to `plugins/nexus/.claude-plugin/plugin.json` (or drop the
literal path and say "via the `release-plugin` skill", which already knows the location).

---

## F2 — [HIGH / BLOCKING] D1 is under-scoped: the plan routes the assumption clause into only po/architect/solo, but the confidence rule lives in 5 agents

**Claim under review:** Plan Step 2 (L82–93) propagates "the assumption clause + the
fact-shaped-unknown→research pointer" into po, architect, solo only — both D1 (assumption lowers
confidence) and D2 (fact-shaped unknown → research) land together in the same three files.

**Evidence (grep `without a confidence label`, all of `plugins/nexus/agents/`):**
- `po.md:102`, `architect.md:275`, `solo.md:33`, `developer.md:128`, `team-lead.md:26` — the
  confidence-label hard rule is duplicated into **all five** agents, each ending "See
  agents-workflow.md".
- The canonical rule is `agents-workflow.md:92` (the "All Agents" block).

D1 is a *refinement of the confidence rule itself* ("a verdict resting on an unconfirmed assumption is
not High; the assumption is a research target, not a basis"). The confidence rule is universal — it is
in all 5 agents and in agents-workflow L92. D2 (a fact-shaped unknown routes to research) is the
piece Q2 deliberately scoped to po/architect/solo (developer OUT).

The plan's own Step 1 **does** put D1 on `agents-workflow.md` L92 (plan L59–62). But Step 1 edits only
the *canonical* rule text; per ADR-2 #2 a spawned subagent sees only its own file, and per ADR-14 the
hard rule is duplicated into each agent — so the L92 edit does **not** reach developer.md or
team-lead.md unless their inlined copies are also touched. The plan never updates the developer or
team-lead confidence line, so D1 (the exact Stryker correction — "a belief is not a basis") never
reaches the developer and team-lead surfaces that carry the rule.

This is the AP2 "half-landed under-scoping" the task names: D2's scoping (po/architect/solo) was
correctly applied, but D1 inherited that same narrow scope when it should be universal.

**Confirmation of the proposed fix:** The fix is correct and, with one addition, complete:
- Step 2 propagates **only D2** (fact-shaped-unknown→research pointer) into po/architect/solo. ✓
- D1 (assumption-lowers-confidence) rides the **L92 edit** so it is universal. ✓ **BUT** "rides L92"
  only reaches developer and team-lead **if their inlined confidence lines are also updated** — the
  agent copies are the ADR-14 backstop, and a subagent never sees L92. So the complete fix is:
  **Step 1 edits L92 AND the inlined confidence line in all 5 agents** (po/architect/solo/developer/
  team-lead) gets the assumption clause; Step 2's *additional* D2 pointer stays scoped to
  po/architect/solo. The plan as written does neither the developer nor the team-lead D1 edit.

**Do the developer/team-lead pointers exist so D1 reaches them by reference?** They carry "See
agents-workflow.md" (developer.md:128, team-lead.md:26 — verified), but a *pointer* is not the rule:
a spawned developer subagent cannot read agents-workflow.md (ADR-2 #2 — it sees only its own file).
ADR-14 exists precisely because the pointer is insufficient for a subagent. So "D1 reaches developer/
team-lead by the pointer" is **false** for the spawned case — the inlined copy must carry the clause.

**Fix:** Add to Step 1 (or a new sub-step): update the inlined confidence line in **all five** agent
files (po L102, architect L275, solo L33, **developer L128, team-lead L26**) with the assumption
clause. Keep Step 2's *D2 research pointer* scoped to po/architect/solo per Q2. State explicitly that
D1 is universal (rides the confidence rule) and D2 is scoped (rides the research branch).

---

## F3 — [HIGH / BLOCKING] The "I can research" duplication is broader than L93 ↔ research-before-asking — it is also inlined into po.md and architect.md; the plan's consolidation + acceptance criterion miss two of the four owners

**Claim under review:** Plan L16/L63/L71: research-before-asking.md is a "near-duplicate of L93",
and the consolidation collapses L93 to a pointer so the phrase lives in "one file, not two." Acceptance
(plan L78): `grep -n "I can research" plugins/nexus/rules/*.md` returns the phrase in one file.

**Evidence (grep `I can research` across `plugins/nexus/`):**
- `rules/agents-workflow.md:93` — the canonical offer
- `rules/research-before-asking.md:5` — the duplicate the plan targets
- `agents/architect.md:71` — **inlined verbatim** ("I can research {X} first — want me to, or do you
  already have a direction?")
- `agents/po.md:86` — **inlined verbatim** in the escalation step
- (plus the generated `commands/architect.md:71`, `commands/po.md:86`, and `CHANGELOG.md:64`)

So the offer phrase has **four** live owners, not two: two rules + two agents. The plan's AP3
"one-fact-two-owners" framing is itself under-counted — it is one-fact-**four**-owners.

**Two consequences:**
1. The acceptance grep is scoped to `rules/*.md` only, so it will pass (1 hit) while po.md and
   architect.md still carry the inlined offer — the duplication the plan claims to "resolve to one
   owner" is **not** resolved. The acceptance criterion gives a false green.
2. This is *not necessarily wrong by ADR-14/ADR-2*: the agent-inlined offer is the legitimate
   self-containment backstop (a spawned po/architect subagent can't read the rule). But the plan must
   **decide and state** whether po.md:86 / architect.md:71 are intentional ADR-14 backstops (keep,
   and they then need the same D2/depth-dial nuance if the rule's meaning changes) or accidental
   duplication (collapse to a pointer like the other agents do for the confidence rule). Leaving it
   undecided means the rule's new "third unknown-category / depth dial" semantics diverge from the
   two agent copies that still carry the *old* phrasing.

**Fix:**
- Correct the AP3 framing: 4 owners (agents-workflow L93, research-before-asking, po.md L86,
  architect.md L71).
- Decide the agent copies explicitly: per the established pattern (the confidence rule is inlined as
  a one-liner ending "See agents-workflow.md", not collapsed to a bare pointer), the po/architect
  research-offer lines should **stay** (ADR-14) but be reconciled to the rule's new meaning — i.e.
  Step 2's D2 edit to po/architect *is* the reconciliation, so the plan should note it is replacing/
  updating the existing inlined offer lines, not adding a new one.
- Fix the acceptance criterion: either grep `agents/ rules/` together and assert the agent copies are
  intentional one-liners with the pointer, or assert the rule is the single *topical owner* and the
  agent copies are backstops — not "one file."

---

## F4 — [MEDIUM→HIGH / BLOCKING] Consolidating L93 to a bare pointer risks the "All Agents" hard-rule block; L93 is itself a hard rule, not a soft offer

**Claim under review:** Plan L71: "**L93:** collapse to a one-line pointer to research-before-asking.md
instead of restating the offer."

**Evidence — what L83–L93 actually contain** (`agents-workflow.md`, the "## All Agents" block
starting L81):
- L83 instructions-from-team-lead-are-user-decisions
- L84 rules-go-in-files
- L85 **never-assume-past-an-open-question (hard rule)**
- L86 durable-artifact-is-primary (hard rule)
- L87 never-author-another-agent's-artifact (hard rule)
- L88 never-spawn-a-pipeline-role-agent (hard rule)
- L89 final-message-is-the-deliverable (hard rule)
- L90 placeholder-return-is-a-non-result
- L91 research-helper-dispatch-contract
- L92 **confidence-label (hard rule)** — the D1 target
- L93 **Offer research before a cold answer** — and it carries the load-bearing corollary
  "**(Codebase facts are never user questions — look them up.)**"

Two problems with "collapse L93 to a bare pointer":
1. **L93 is a hard behavioral rule in a hard-rule block, not a pointer candidate.** Every other line
   in this block (L85–L92) states its rule in full *and then* names its ADR/rule — none is a bare
   "see X.md" pointer, because per ADR-2 #2 a rule that lives only behind a pointer doesn't reach a
   spawned subagent (the rules file is injected at session start, but the All-Agents block IS the
   injected canonical copy — collapsing it to point at a *second* rules file just moves the text, it
   doesn't consolidate). Collapsing L93 to "see research-before-asking.md" demotes a hard rule to a
   cross-reference inside the very block whose purpose is to state hard rules in full.
2. **The "codebase facts are never user questions" corollary on L93 is load-bearing and is cited by
   agents.** architect.md:69 ("Never ask the user or developer about codebase facts you can look up")
   and po.md:98 ("Ask about codebase facts you can look up → research first") are the agent-level
   echoes of exactly this corollary. If L93 collapses to a pointer, this corollary moves into
   research-before-asking.md — which today is an 8-line "Research Offering Protocol" stub that says
   nothing about codebase-facts. The plan does rename/expand that file (Step 1), but must explicitly
   carry the corollary across or it is silently dropped from the canonical All-Agents block.

**Fix:** Do **not** collapse L93 to a bare pointer. Instead, the All-Agents block keeps a *full* hard
rule on L92 (confidence, + D1) and L93 (offer-research + the codebase-facts corollary), each ending
"See research-before-asking.md for the full Research & Confidence Protocol (depth dial, capture,
fact-shaped-unknown)." Move only the *expanded protocol* (depth dial, capture-before-surface, the
third unknown-category) into research-before-asking.md — that is the genuinely new, non-duplicative
material. This preserves the hard-rule block intact while still giving the protocol one topical owner.

---

## F5 — [LOW / non-blocking] Skill mapping is correct, with one clarification

**Claim under review:** Step 3 = "Follow release-plugin"; Steps 1–2 all-`None`; gen-commands for the
3 changed agents.

**Evidence:**
- `gen-commands.mjs` reads **only** `agents/` (verified: `AGENTS_DIR = join(PLUGIN, 'agents')`,
  iterates a MAP of agent names, embeds the full stripped agent body into `commands/{name}.md`). So:
  - A **rule-only** change (Step 1's agents-workflow.md / research-before-asking.md edits) needs **no**
    gen-commands — rules are not a gen-commands input. ✓ The plan correctly does not list gen-commands
    for Step 1.
  - The **agent** edits (Step 2, po/architect/solo) **do** need `gen-commands.mjs nexus` — confirmed
    the command body is the verbatim agent body. ✓
- **Caveat tied to F2:** if F2's fix is adopted (developer.md + team-lead.md also get the D1 clause),
  then gen-commands must regenerate **5** commands, not 3. The plan's "3 agents changed" becomes
  "5 agents changed." Update Step 3's gen-commands note accordingly.
- "Follow release-plugin" for Step 3 and all-`None` for a prose pass are both correct (the all-`None`
  exemption is real — verified in architect.md:238 and agents-workflow.md:126).

**Fix:** None to the mapping logic; sync the agent count (3→5) into Step 3 if F2 is adopted.

---

## F6 — [LOW / non-blocking] ADR conformance is sound; capture-as-convention and docs/kb/research are correctly treated as consumer-runtime, not shipped

**Claim under review:** Plan L70/L120–121 treat `docs/kb/research/{topic}.md` as a "consumer-project
runtime path, not a plugin KB entry," lazily created; capture is "a bare convention," flagged as a
future gate, not built.

**Evidence:**
- `docs/kb/` and `docs/kb/research/` do **not** exist in this repo (verified: `ls docs/kb` → absent).
  ADR-1 says consuming projects hold `docs/kb/` — the plugin repo does not ship one. So treating the
  path as a convention, not a shipped directory, is **ADR-1-correct**. ✓
- The allocation principle (architecture README §"allocation principle", and "Prose that knows it
  should become a gate says so inline") sanctions flagging capture as a future-gate candidate in prose
  without building the gate. ✓ The plan's "schema + recall are P2; this is a bare convention" matches.
- ADR-14 (rule duplicated into agent files as backstop) and ADR-9 (bump same commit) are correctly
  invoked. ADR-2 is the one the plan under-applies — see F2/F4 (pointer ≠ reaching a subagent).

**Fix:** None. Flagged as confirmation. One nuance: the plan should state the capture convention is
written to a path the **plugin never creates** — so the rule text must say "create the folder lazily
if absent" (it does, plan L70), and must not add `docs/kb/research/` to any plugin-shipped scaffold.

---

## F7 — [MEDIUM / non-blocking] team-lead.md DOES carry a confidence-relay rule the plan never considers (AP2 missed normative surface)

**Claim under review:** Task point 4 — does team-lead.md state it preserves/relays an agent's
confidence, and does that relay text need the assumption nuance?

**Evidence:** `team-lead.md:26` — "**Put a choice to the user without a confidence label** → … Preserve
an agent's confidence when relaying; add your own when you ask." And `agents-workflow.md:92` ends "The
team lead preserves an agent's confidence when relaying, and adds its own when it asks." So the team
lead is a **normative confidence surface** the plan's Step 2 scope (po/architect/solo) entirely omits.

**Why it matters:** D1 changes what a confidence label *means* (an unconfirmed assumption forces
below-High). If an agent now correctly emits a *below-High because of an unconfirmed assumption*
verdict, the team lead **relays** it to the user. The relay rule says "preserve confidence" — which is
already correct in spirit — but the team lead's own added-confidence (when *it* asks: review mode,
escalation, spec-review) is generated by the team lead from its own basis, and the D1 refinement ("a
belief is not a basis; an unconfirmed assumption lowers it") applies to the team-lead's self-generated
confidence too. The plan treats the team lead as out-of-scope, but it is the one agent that both
**relays** others' (now assumption-derived) confidence and **generates** its own.

**Fix:** Per F2, include team-lead.md in the D1 universal edit. At minimum, the team-lead confidence
line (L26) should note that a relayed below-High label may now be assumption-derived (don't silently
upgrade it), and the team lead's own confidence obeys the same "unconfirmed assumption is not a basis"
refinement. This is the AP2 missed-surface the task asked to catch.

---

## F8 — [LOW / non-blocking] Other surfaces stating the confidence-or-research rule the plan should be aware of

**Evidence (additional confidence/research surfaces not in the plan's edit set):**
- `architect.md:196` — the optional `Confidence:` field on **plan steps** (high/medium/low for pattern
  clarity). This is a *different* confidence axis (developer-facing pattern clarity, not user-facing
  recommendation) — correctly out of scope, but worth a one-line note in the plan so a future reader
  doesn't think it was missed.
- `architect.md:351` and `developer.md:210` — the Checkpoint Report Format's "confidence: {high|
  medium|low}" on action options. Same user-facing axis as L92 — these inherit the meaning from the
  rule, so D1 reaches them implicitly *if* the rule is the source. No edit needed, but confirms the
  rule-as-source design.
- `po.md:74–83` — the PO's `confidence: high | inferred | none` answer vocabulary is a **different
  enum** (spec-citation confidence), not the user-recommendation enum. Out of scope, correctly.

**Fix:** None required. Optionally add a one-line "surfaces intentionally not touched" note to the plan
so the divergence is documented, not accidental.

---

## Verdict

**GO-with-fixes.**

**Blocking (must fix before implementation):**
- **F1** — wrong plugin.json path (`.claude-plugin/` missing).
- **F2** — D1 under-scoped: developer.md L128 + team-lead.md L26 must receive the assumption clause
  (D1 is universal; a pointer does not reach a spawned subagent per ADR-2/ADR-14). Step 2's D2 pointer
  stays scoped to po/architect/solo per Q2.
- **F3** — the "I can research" duplication has 4 owners (agents-workflow L93, research-before-asking
  L5, po.md L86, architect.md L71); the acceptance grep scoped to `rules/*.md` gives a false green and
  the po/architect inlined copies are left unreconciled.
- **F4** — do not collapse L93 to a bare pointer; it is a hard rule in the hard-rule block and carries
  the load-bearing "codebase-facts-are-never-user-questions" corollary that two agents echo.

**Non-blocking (address or acknowledge):** F5 (sync 3→5 agent count for gen-commands), F6 (confirmation
— no change), F7 (team-lead is a missed normative surface — fold into F2), F8 (document untouched
surfaces).

The plan's core thesis (≈60% already ships; the novel delta is assumption-derived confidence + the
fact-shaped-unknown branch + depth dial + capture) is **correct and well-grounded**. The defects are
all scope-completeness and grounding-accuracy issues, not direction errors. The recurring root cause is
treating "edit the canonical rule" as sufficient when ADR-2 #2 + ADR-14 require the inlined agent
copies to be edited too — which the plan applies for D2 (3 agents) but drops for D1 (should be 5).
