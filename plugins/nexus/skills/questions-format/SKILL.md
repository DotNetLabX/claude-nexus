---
name: questions-format
description: Format spec for docs/specs/{slug}/delivery/questions.md — one blocker per section and the To-field routing chain. Load when blocked, raising, or answering pipeline questions; its references/ folder holds the routine-questions catalogue every fixed owner ask is composed from, plus the plain-words list every ask is checked against.
---

# Questions File Format

Written by any agent when blocked or needing clarification. The recipient answers inline. All questions go in one file — `docs/specs/{slug}/delivery/questions.md`.

**Write first, message second.** Every agent must write its questions to the file before sending them as a message. The file is the log; the message is the notification.

**No section map — variable headings (ADR-22 Extended).** `questions.md` has **no fixed heading set** to document: its sections are runtime-numbered (`## Q1`, `## Q2`, …) and grow per blocker. A section read here targets by the **grep step alone** (`grep '^## Q'` for the live numbers), not a documented index. (`communication-log.md` is likewise excluded — it has one growing `## Messages` catch-all and no format skill to annotate; both rely on the grep step plus the size trigger.)

```
# {Feature Name} — Questions

## Q1: [Short title — on this surface the section title carries the ask's header]
**From:** [agent role]
**To:** [agent role, "PO", or "user" — see routing below]
**Status:** Open | Answered | Resolved
**Step:** [Plan step number and name, or "Phase 1 analysis" if pre-plan]
**File:** [File being worked on, if relevant]

**Context:** [at most three fact lines, one per line, the first saying why the question is asked —
or, for a routine question, its routine line `{catalogue name}, routine: {this run's facts}` and at
most one more fact line — or empty, which is the default]

**Question:** [the question sentence, in the owner's words, ending in a question mark]

**Recommendation:** [the options, the recommended one first with `(Recommended)`, one option per line,
each with its consequence in at most two short sentences — one in a routine question — and
**without** the confidence clause]
**Confidence:** high | medium | low — [one-line why: the basis for the recommendation; this field is
the clause's sole home on this surface]
**Research offer:** [optional, and only where the `research` skill (`nexus-pro`) is in your skill list —
{named target} (~{rough cost}); present only when the asking agent judges this question boostable
per that skill's research protocol; this field is that offer's sole home on this surface, never
repeated inside Recommendation. After a research round runs, the asking agent rewrites this line to
`consumed ({ISO date}) — {one-line what the round found}` so a re-relay never re-renders it.]

### Answer
[Recipient fills this in, sets Status → Answered]
```

**Answer attribution (hard rule).** The Answer block records **who actually answered**. A `To: user`
question is answered only by the user's verbatim reply (relayed by the team lead). If work proceeds
on the Recommendation without a user reply (unattended mode, or the user explicitly delegated), the
Answer block reads `presumed (proceed-default), not user-confirmed — {recommendation}` — **never**
under a "user answered" attribution or an `Answers (user)` heading. A presumed default a later
interview can flip must be findable as presumed; a false "user answered" record once forced a plan
step to be rebuilt when the real interview reversed it. **That record carries the same parts the ask
would have carried** — the fact lines, or the routine line and at most one fact line, the question
sentence, the options with the recommended one first, and the confidence clause in its field — so the
human who audits it later reads the shape a live owner would have read:

```
## Q7: Action rows
**From:** solo
**To:** user
**Status:** Answered

**Context:** No rule yet decides which commitments get a row, and the table already holds 87 to 100 rows.

**Question:** Which commitments should get a row in the action table?

**Recommendation:** Due date or someone waiting (Recommended) — About a third fewer rows, and the rest stay in the notes.
Due date only — Undated commitments stay in the notes, even when someone waits on them.
Every owned commitment — No filter, so the table keeps about as many rows as today.
**Confidence:** medium — you have not yet given examples of what you call noise.

### Answer
presumed (proceed-default), not user-confirmed — due date or someone waiting
```

**Rules:**
- One question per section. Multiple blockers = multiple sections.
- Include enough context that the recipient can answer without reading the sender's work. That is an **agent-to-agent** rule; a `To: user` question's Context holds at most three fact lines, the first saying why the question is asked, and defaults to none, per the owner-question contract.
- If the answer changes the plan, architect updates the plan. Plan stays source of truth.
- Questions are numbered sequentially across the entire file (Q1, Q2, Q3...) regardless of sender.
- **To field routing:** Set `To: PO` for spec/product questions (the team lead routes through the PO escalation chain: PO answers from spec → user only if PO can't cite a section). Set `To: architect` for technical/plan questions from the developer. Set `To: user` only for pure preference questions with no spec or technical basis.
- **Every `To: user` question carries a Recommendation + Confidence.** **high** = clear basis (spec/ADR/existing pattern/evidence), safe to proceed if unanswered; **medium** = reasonable lean with a real trade-off; **low** = weak basis or toss-up — wants the human's call. The label tells the user which defaults to rubber-stamp and which need real thought. Agent-to-agent questions (`To: PO`/`architect`) still carry the Recommendation; the Confidence label matters most on user-facing ones.
- **A `To: user` question is shaped per the owner-question contract** (`research-before-asking.md` § The owner-question contract). Its Question field is the question sentence, and its Recommendation field states the options as consequences rather than as artifact references, with every internal ID glossed at first mention — the contract owns the obligations in full, plus the per-surface placement rules; this bullet is the pointer, not a copy of them. The Context field holds the fact lines, or a routine question's routine line and at most one fact line, or nothing at all (§ The owner-question contract, the surfaces paragraph).
- **Research offer (relayed path)** — where the `research` skill (`nexus-pro`) is in your skill list: the field is written **only by the asking agent** — boostability is the asker's own judgment (spec BR10), never the team lead's. The team lead renders it verbatim as the clickable research option and **never re-judges, re-prices, or researches on the asker's behalf**. A user click travels back as a normal message-handoff to the asking agent ("research requested on Q{n}"); the asking agent runs the round, updates the Recommendation and Confidence fields in the same Q section, rewrites `Research offer` to `consumed (...)`, and the team lead re-surfaces the boosted question.

## Anti-patterns

- **Asking without context (agent-to-agent).** The recipient should be able to answer without reading your work. If the question omits what you tried, what you found, and why it's ambiguous — the recipient will spend time re-investigating what you already know. The inverse binds a `To: user` question: there the default is no context at all, and a fact line the owner could have done without is cut.
- **Bundling unrelated questions.** Each Q section covers one blocker. If you have three unrelated questions, write Q1, Q2, Q3 as separate sections. Bundling forces the recipient to untangle them and makes it hard to mark individual questions Answered.
- **Agent-grade compression in an owner-facing question.** Writing a `To: user` question in the register you'd use for a teammate — internal numbering unglossed, options stated as artifact references ("rows-only extract per the amended intake row") — assumes the owner carries your artifact numbering. They don't, and the measured cost is a full round-trip on a blocking decision the owner could otherwise have ruled on immediately. Shape it per the owner-question contract (`research-before-asking.md` § The owner-question contract).
- **Wrong To: field.** Sending a spec/product question to the architect wastes a round-trip — the architect will route it to PO anyway. Sending a technical plan question to the user wastes their time on something the architect should decide. Use the routing rules above.

## References

- `references/standard-questions.md` — the routine-questions catalogue, single owner of every fixed
  question's wording, option set, recommendation rule, away line and long form.
  The contract's (§ Routine questions) points here.
- `references/ask-words.md` — the plugin words an owner ask may not use and the pointer phrases it
  may not use, in one document; the ask gate checks every ask against both.

## Consumers

| Agent | Role | Routing chain |
|-------|------|--------------|
| Team Lead | Reads questions.md to triage routing | Routes to PO (product), architect (technical), or user (preference); where the `research` skill (`nexus-pro`) is in your skill list, renders a `Research offer` field verbatim as the clickable research option and routes a click back to the asking agent; relays a mis-shaped `To: user` question unchanged but flags it and asks the writer to re-ask in plain English (team-lead.md) |
| Architect | Answers technical/plan questions | Updates plan if answer changes it, sets Status → Answered |
| PO | Answers spec/product questions | Cites spec section; escalates to user if no citation exists |
| Developer | Reads answers before resuming | Resumes from the first unanswered step |
