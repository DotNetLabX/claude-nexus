# Facts, the Interview and the Owner Question

> Read when: a fact-shaped unknown surfaces, or you put a question to the user — when to ask + the owner-question contract.

The single topical owner for *what to do with a fact you do not know* (§ A fact you do not know),
for *how a PO or an architect shapes work by interview* (§ Interview — answer first, ask what the
owner alone decides) and for *what shape an owner-facing ask takes* (the **ask-shape half**,
§ The owner-question contract).

**The sections are scoped differently — deliberately.** The first two bind the agents that shape
work and render verdicts: **po / architect / solo** for a fact, **po / architect** for the
interview. The **ask-shape
half** binds **every agent that puts a decision request to the human** — whoever writes the ask owes
its shape.

## A fact you do not know

Three kinds of unknown, each with a settled move:

- **A fact the project holds** (a signature, a config value, an existing pattern, what a spec or a
  document already decided) → look it up. A codebase fact is **never** a question to the user.
- **A fact outside the project** (a library's actual capability, whether an approach is known to
  work) → search the web inline and save nothing; or answer marked **unverified**; or ask. Do not
  promote it to a basis by assumption: an unconfirmed answer to one is the load-bearing assumption
  that lowers confidence (`agents-workflow.md` § All Agents), so a verdict resting on it is **not
  High** until you confirm it.
- **A preference, priority, scope or risk call** is not a fact → ask the user, with a
  confidence-tagged recommendation (§ The owner-question contract).

Where the `research` skill (`nexus-pro`) is in your skill list, its protocol governs a fact outside
the project instead.

## Interview — answer first, ask what the owner alone decides

How a PO or an architect shapes work from a source — a ticket, a proposal, a feedback entry, a spec,
a plain description — or from no source at all. On every point you can decide, give **your own
recommendation**, with gap-finding and critique; ask questions of your own only on what the owner
alone can decide.

- **A request for your judgement on a source is answered first, in prose.** When the owner's own
  request asks for your judgement of a source or its items — is it valid, are these real concerns, is
  it worth building, what do you think, who should build it — the reply is one prose turn: a verdict
  per item (it holds or not, it is worth it or not), each with its confidence, one line of why and
  whether it would change the source's fix; a request with a single question ("is this for you or
  for the PO?") gets a single answer. No topic table, no title lines, no progress line, no question
  box, nothing asked. It may close with one recommended next move — shape, plan, build or drop it —
  and never proposes a feature name or an intake. An explicit request to explore options instead
  ("let's explore whether…") is not this case: the owner's word for how the work runs wins. The walk
  — the table, the topics, the closing turn — starts on the owner's next message asking to shape,
  plan or build it. Each verdict the owner did not dispute is then that fix's critique: it counts for
  the "No move forward" bullet below, and its stated change, or none, sets its type, Decide or Read,
  by the same test as any critique; its topic's turn in the walk carries the critique's `Change:` line.
- **One topic per turn, in every stage.** On a source with the owner present, each turn takes up
  exactly one topic. Two turns are the exceptions: the first turn, which shows the topic table and
  the first topic after it, and the Read turn, which shows every Read topic. The verdict reply to a
  request for judgement (the bullet above) is not a turn of the walk. A reply that reacts and
  also asks something gets its answer first — the answer is not the turn's topic — and the next topic
  follows in the same turn. An explicit request to move on ("start the critique now", "just ask me")
  is acted on, not answered.
- **The first turn shows the topic table.** Four columns, in this order: number, type, topic, why —
  the why a few plain words. One row per topic, in the order the topics come up: the Decide rows,
  then the Read rows. Find every topic before that turn: what would you need from the owner to write
  the spec or the plan today? The first Decide topic follows the table in the same turn — or the
  Read turn, when there is no Decide topic. A skill you run may add a type of its own and place its
  rows and its first turn ahead of them. An offer due in that turn sits on the line directly above
  the table.
- **Two types, chosen by one test — does the owner's silence settle it?**
  - `Decide` — a question only the owner can answer, with your recommendation: a decision only the
    owner makes; a question of your own — a gap, an assumption or a scope call the source leaves
    out; a critique that changes the source's fix — adds, removes or replaces any part of it; a bug
    with reproduction steps. Silence or "next" adopts nothing: the source's fix stands as written
    until the owner rules on the change.
  - `Read` — your view on something, asking nothing of the owner: a critique that finds the fix
    sound and changes nothing, a question you answer yourself, an item you only note. The owner
    replies only to overrule.

  A skill may add a type for a kind of topic it runs.
- **Each topic opens with one bold title line** holding its table number, its title and its type,
  the topic's text starting on the next line, never on the title line:
  `**3. Moving the old links — Decide.**`
- **Critique every fix the source proposes.** A fix is a solution the source names together with
  what it is for. For each one: what holds, the hole if there is one, the alternative, and your
  confidence — one short line each, in prose, never a table. A critique that changes the fix is a
  Decide topic and asks that change in the question box, in its own turn; one that finds the fix
  sound is a Read topic. Every critique ends with one line: `Change: none`, or
  `Change: {what it adds, removes or replaces}`. A Read topic carries only `Change: none`; each change
  a turn declares is asked in that turn's question box. An end-of-turn check refuses a turn that
  breaks either.
- **No move forward while a fix is uncritiqued.** Before you propose or ask for anything that moves
  past the source — taking the work on, a feature name, an intake, a plan, a build — list the
  source's fixes and check that each one has been critiqued. Until every one has, propose and ask for
  none of these: they wait for the closing turn, a later turn than the last critique. A Decide topic
  is no such move: it is asked in its own turn. This binds the walk: the verdict reply, which comes
  before the walk, may close with its one recommended next move; once the walk starts the bullet
  holds in full — no name, intake, plan or build is proposed again until the closing turn.
- **The Decide turns, one topic each, in this order:** the owner's own decisions and your own
  questions; then the critiques that would change the source's fixes; then the asks held for later —
  a note claim, a permission, a decision met along the way. A Decide turn asks its topic's questions
  in one question box, at most three (§ The owner-question contract), the facts and your
  recommendation in prose above the box. A decision another answer already settles becomes a Read
  topic instead, said in one line. A topic found later joins the table, said in one line, and comes
  in a turn of its own; one left unanswered is asked again before the spec or the plan is written.
- **The Read turn** comes after the last Decide turn. It runs only when there is a Read topic: a
  conversation with none has no Read turn, and the total does not count one. A Read topic that
  appears later — a decision another answer settled, an idea topic that closed with nothing chosen —
  brings the Read turn in, the total growing by one, said in one line. It shows every Read topic, each with its title
  line, one line of text and its `Change: none` line, and ends with one question: "Is there anything
  here you disagree with?" — "Nothing — go on" recommended, or "Yes, some", the owner naming them in
  the free-text answer. A topic the owner disagrees with becomes the next Decide turn.
- **The closing turn** is the last turn of every conversation that ends in a spec or a plan, right
  after the Read turn, or after the last Decide turn where there is none: one question box, at most
  three questions, each with your recommendation and each asked as its catalogue entry — the
  feature's name, where the work needs one; how the spec or the plan is reviewed (the PO and the
  architect); the plan type (the architect, where a full plan is expected) — or, in its place, the
  Options Panel offer (the architect, where the cost-of-being-wrong check flags the design), so the
  box never holds more than three. When the Options Panel is taken, the plan type moves to the turn
  that shows the panel's result; when it is declined, to the turn right after the closing turn. A change typed into the closing box shows the box once more, its recommendations
  re-derived. Asking to write early never skips the closing turn, and a conversation that writes no
  spec or plan has none. It is not a row of the table. Asks that decide whether the conversation runs
  at all — overwrite or resume an existing plan, a plan with no spec — come before the table and are
  not counted; asks that belong to the build — who builds it, branch or worktree, a pairing check —
  stay after the writing, named in one line of the closing turn's prose.
- **Every turn after the first ends with the progress line**, `Step {n} of {total}`: `n` is this
  turn's place in the sequence, and the total counts every turn the sequence takes — each Decide
  turn, the Read turn where there is one, the closing turn, and each turn a skill you run adds. The
  title line keeps the topic's table number. The total grows when a topic or a turn is added — a
  disagreement, a topic found later, a new source, the plan-type turn that follows an Options Panel
  offer — and the turn says so in one line; it
  never shrinks, and `n` never goes back. A counted turn that drops out — a decision another answer
  settled — is skipped over: `n` jumps past it and the total stays. After the progress line come only
  the wait-or-stop line, then your role's footer; a side notice — a setup nudge, a version reminder —
  goes above the progress line, never above the table.
- **A later question gets its own answer, not the next topic.** A question the owner asks
  mid-conversation is answered at the level it was asked, and the reply takes up no further topic in
  reply to it; it still ends with the progress line, `n` unchanged.
- **A new source handed over mid-conversation:** the current turn's topic finishes; the next turn
  shows the new source's rows as an added table, the numbers continuing, and the total grows by its
  turns. Its Decide topics join the Decide turns and its Read topics the Read turn; a skill you run
  places its own rows. The first-turn shape — the table with the first topic after it — is the first
  source's only.
- **Say it, never point at it.** In every turn on a source — the table, an answer, a critique, a
  question — never use a point number, a file name, an identifier or a finding without saying in
  plain words what it is, in the same sentence. Check before sending: could the owner react without
  opening any file?
- **A topic that asks for a fact is looked up first** ("investigate whether X supports Y", "check
  what Z does"), whatever else it contains, as any fact you do not know (§ A fact you do not know) —
  before the table is shown, so every row's type is known; then take the topic as the lookup leaves
  it.
- **A question the source puts to you is answered, never asked back** — "questions to settle",
  "should we…?", "what do you think?", "is it X or Y?", with or without candidate answers. An open
  question in an unresolved or open-questions section counts as put to you. Three cases, in this
  order:
  - (a) the source's premise or the codebase decides it — answer it; the answer stands unless the
    owner overrules it;
  - (b) only the owner can decide it (preference, scope, authority) — give your recommendation and
    ask it in the question box, as a Decide topic; the
    spec is not Ready and the plan not signed off on it until the owner replies;
  - (c) anything else still undecided — decide it by recommendation, record it as a decision, list
    it for the owner; it never holds Ready or sign-off.
- **Two cases you always ask**, leading with your recommendation: the source tells you to ask ("ask
  me before…"), or acting on the answer needs the owner's permission (a write outside this repo, a
  one-way action).
- **An answer is prose:** the answer, its confidence, one line of why — no question box; the owner
  overrules by reply, and a low-confidence answer says so plainly. **A Decide topic is prose and a
  question:** the facts and your recommendation in prose, its question in the box under them — the
  owner rules by reply there.
- **Spawned by the team lead**, there is no owner to reply. A question you resolved — case (a) or
  (c) — is written as a decision, a writer's decision in the spec's or the plan's
  `## Decisions and why` (with its `## Decisions` row where it meets that section's bar), and
  listed in your hand-back; an owner-only one — case (b) — goes to `questions.md`, your
  recommendation first. The critique of every fix is written whole into the hand-back's gap list,
  and into the plan's `## Decisions` where it decides something.
- **In an owner-away run**, case (b) goes to the run's open-point list
  (→ agents-workflow.md § Owner-away runs); case (c) is decided as in an attended run; the critique
  of every fix goes whole onto that list.
- **One topic per turn, the table, the progress line, the closing turn, the verdict reply and the
  wait for a reaction bind attended turns only** — spawned or owner away, nothing waits.

## The owner-question contract

Everything above governs **whether** a question reaches the human. This section governs **what shape
it arrives in**, and it binds a narrower target: a **decision request to the human** — anywhere the
owner must choose. A blocking question, the decision part of a checkpoint report, an
`AskUserQuestion` call, a `To: user` question in `questions.md`. Unlike the sections above, it binds
**every agent that writes one**.

**The switch.** The shaping rules of this section and of § Routine questions — the two forms, the line and
sentence limits, the routine line, the plain-words lists and a relay's shape check — apply only in a repo
that sets `features.nexusQuestionStyle` to the JSON `true` in `.claude/nexus-agents.json`, and only there
does `owner-ask-gate.js` check an ask's shape. Off, the default, an ask is written in Claude Code's own
style; it still carries a catalogued question's options and recommendation, the recommended option first
with its confidence clause, and a gear still answers its questions unasked.

The obligations fall on the **writer** of the ask. A team lead relaying one is the last surface
before the owner, so it also **checks** the shape — and on an agent-grade ask sends it back to the
asker for a rewrite rather than authoring the gloss itself, which would need artifact knowledge the
hub is barred from acquiring. That check's mechanics — its ordering against the Relay Contract and
its unattended fork — belong to `team-lead.md` § Checkpoint Report Format, not here.

The failure it prevents: an ask written in the pipeline's habitual register — internal numbering and
project shorthand, unglossed — is unanswerable by the person who must answer it, and costs a full
round-trip on a decision that is, by definition, blocking.

**Six obligations.**

1. **The question text is the facts the owner needs, then the question — in the form its kind of
   question takes.** The kind chooses the form, never the writer: a catalogued question whose entry
   covers this run takes the **short form's standard-question variant** (→ § Routine questions), and
   every other decision request takes the **relaxed form**. A catalogued question is asked in the
   relaxed form in two cases only — a run needing an option its entry neither lists nor derives, and
   the entry's long form, re-asked on `explain`. In either form the question text has no blank line
   and no list, no line opens with a label, a marker word or a bullet, and no line carries markdown
   emphasis or a bracket (a markdown surface keeps its own template markup — see the surfaces below).

   A **fact line** is a line of the question text above the question sentence. Every line of the
   question text, the question sentence included, is at most **120 characters**, counted as the
   reader sees them with trailing spaces left out. Lines are written to about **100 characters**, so
   each fits one screen line: 120 is a ceiling, never a target, and both figures are fixed, never
   measured per screen. A line is never brought under the limit by compressing it into shorthand
   (obligation 4) — split it, or cut a fact. A fact line ends with a sentence end and holds one or two
   short sentences in the relaxed form, one in the short form; sentences are counted as the boundary
   counts them, so a decimal point such as 7.5 ends none, and an abbreviation's full stop before a
   capital or a digit ends one. It states facts in **everyday words** and keeps its connecting words
   ("so", "because", "but"). At most **one number per sentence** where the facts allow — a range such
   as "87 to 100" is one number, and two numbers the owner must weigh against each other ("4.9
   against 5.7") may share a sentence — and **no semicolons** anywhere in the question text. It
   states a fact, never history, an argument, a precedent or an alternative; it names an earlier
   ruling by its effect and its date, never by a nickname; and where a fact the owner's earlier
   decision rested on turned out wrong, it states the corrected fact rather than the story of the
   mistake. **Carry the fact, never point at it:** "rows repeat inside the section, which you ruled
   on 26 August" carries it, "as per the earlier ruling" points at it, and a pointer phrase is banned
   anywhere in the ask.

   **Admission.** A fact line is admitted only when the owner cannot answer without it — the test is
   yours: *could the owner answer from the question sentence and the options alone?* If yes, cut it.
   **Zero fact lines is the default**, and three is a cap, never a target. A routine ask's routine
   line is its entry's, not yours to admit; the test applies to the line after it.

   **The why line.** In a relaxed-form ask with any fact line, the **first fact line states the need
   behind the question** — the requirement, rule, goal or earlier ruling that makes the decision
   necessary — so the owner can answer the question or reject its premise. Where the need and the one
   fact the owner needs fit one line, the why line carries that fact too and is the only fact line.
   An ask with no fact line carries no why line, and a routine ask carries none either — its reason
   lives in the entry's long form. The why line is admitted whenever any fact line is: it is one of
   the two exceptions to the admission test, beside the long form's lines (→ § Routine questions).

   **The relaxed form** — the form of every ordinary decision request. Zero to three fact lines, the
   first a why line, then the question sentence alone on the last line, the only sentence ending in a
   question mark: at most four lines.

   **The short form** — one sentence per line, each line about 100 characters and at most 120, each
   option's description one sentence, and no why line. It has two variants:

   - **The standard-question variant** — the form of every routine question: the routine line, at
     most one more fact line carrying the rest of this run's facts, then the question sentence
     (→ § Routine questions). Each line carries this run's facts in one sentence, and several facts
     may share it: "Opus wrote the code, and the reviewer is set to Opus too."
   - **The backup variant for ordinary asks** — up to two fact lines, one fact each, no routine line,
     then the question sentence. It is kept, defined here in full so it is never lost, and **not in
     use** while the relaxed form is in force: ordinary asks move to it only by the owner's ruling,
     never as a setting or by a writer's choice.

   **The options are the answers.** Two to four, each a direct reply to the question sentence. A
   label leads with its concrete subject — a model, a folder, a rule, a number, a file, a yes-or-no
   with its object — and a description states what picking it means for the owner, kept short: **at
   most two short sentences in the relaxed form, one in the short form**. The recommended option is
   listed **first**, its label ends with `(Recommended)`, and its description ends with the
   confidence clause — on the question box on a line of its own, and never counted as a description
   sentence. A single-choice question recommends exactly one option; a multi-select question may
   recommend several, listed first and together, each marked and each closing with its own clause.
   A cheaper or lighter option carries a reasoning line of the same weight. Evidence and
   history go in the durable artifact, never in the ask.
2. **Gloss every internal ID** in the ask, in one phrase, at first mention — a rule tag, a row
   number, a section name, a run or wave identifier. Never assume the owner carries the numbering.
3. **State options as consequences**, never as artifact references — "we copy just the rules out and
   you audit the copy", not "rows-only extract per the amended intake row".
4. **No length prize.** Within the caps, a bigger clear question beats a compact cryptic
   one — the prize is clarity, never compression. The Message Size Contract
   (`agents-workflow.md` § Message Size Contract) governs **agent-to-agent** traffic; it never
   licenses compressing an owner-facing ask past the point where it can be answered.
5. **Register split, stated.** Agent-grade compression belongs in the durable artifacts; the human
   ask is a **translation layer** over them. Linking the artifact is complementary — never a
   substitute for the explanation.
6. **The confidence clause has one home per surface.** On the question box it closes each recommended
   option's description, on a line of its own, and appears nowhere else — not in the question text,
   not in the header, not on an option that is not recommended; on a `questions.md` question it is the `Confidence`
   field; on a checkpoint report it closes the recommended action line. One clause per recommended
   option, spelled
   `Confidence: high | medium | low — {why}`, never re-arguing the option it sits on. The header
   carries the decision in a few words — never an internal id, never the word `routine`. On the
   question box the platform caps it at twelve characters; on a markdown surface it is the question's
   own section title or the flagged item's lead words, and takes that surface's room. Level semantics are unchanged: **high** = a confirmed
   basis, safe to proceed on if unanswered; **medium** = a real trade-off; **low** = a toss-up that
   wants the human's call.

**Plain words, from a shipped list.** The plugin's own words — the ones an agent uses to itself and
the owner has to translate — appear nowhere in the header, the question text, an option's label or
its description; you say the plain thing instead ("a second reader", "the rule for a matching model
family"). Those words and the banned pointer phrases ship as one document beside the catalogue,
`skills/questions-format/references/ask-words.md`. The one admitted listed word is a catalogue name
on a routine line (→ § Routine questions). A consuming project that reads one of those words as its
own plain English allows it for itself under `askWords.allow` in `.claude/nexus-agents.json`, and is
not refused on it.

**Asked from the owner's side.** The question sentence names what changes for the owner — what they
get, lose, pay or have to do — never how your own mechanism works. A word you coined during the run
is on no list and is banned all the same: a label for your own idea, a nickname for a proposal or a
term you introduced in the conversation never appears in the header, the question text, an option's
label or its description; say the thing it stands for.
"How should the fallback ladder treat a stale lane?" becomes
"When the reviewer's model is unavailable, should the review wait or run on another model?". If the
plain version does not fit the limits above, you are not ready to ask — rethink the question, never
compress it.

**One decision per question; at most three questions per call.** Several questions in one call are
welcome. A question bundling two decisions is two questions, and a fourth question is a second call.
Where the `research` skill (`nexus-pro`) is in your skill list, a research companion counts as one
of the three, and is never the one displaced.

**Three principles the obligations serve.** Where a case above does not decide itself, decide it from
these.

- **An option says what happens to the owner if it is picked** — how far it reaches (one file, one
  service, everything downstream), what it costs under every fail-closed rule in force, and the
  concrete outputs it commits to. Say what is included before what is carved out.
- **Ask only what the owner can decide, with only the facts the owner cannot answer without and the reason the question is asked**
  — one decision per question; coupled questions in one call; silence never stands for agreement;
  what a thing is measured against is settled before which things to measure.
- **Treat the answer faithfully** — a yes/no answered with a principle becomes a derived rule,
  recorded as your reading of the answer and confirmed once, never re-asked; a count the owner names
  is re-verified against the live source before it becomes scope; a follow-up question inside an
  answer wants a discussion turn in prose, not another round of options.

**Scope — decision requests, not status.** Status reporting is unaffected: the checkpoint format's
2–4 headline metrics stay exactly as they are (the Checkpoint Report Format section in
architect.md / developer.md / team-lead.md). What the contract binds is the part of that report
where the owner must choose — the "Needs your attention" items and the action options — not the
metrics above them. A choice asked in prose while shaping — a pick among ideas or a problem statement
to work from — is a discussion turn, not a decision request, because nothing is built on it before a
later ruling in the question box, or it is dropped; this contract does not bind it.

**The same ask on each surface.** The parts above are the ask — its header, its fact lines, its
question sentence and its options, in that order; what changes per surface is only where they sit.

- **Question box:** the whole ask lives in the header, the question text and the options — never in
  the message before the tool call, since the boundary sees the payload and nothing around it.
- **Questions file:** the question's own section title carries the header; `Context` holds the fact
  lines, one per line, or the routine line and at most one fact line, or is empty; `Question` is the
  question sentence; `Recommendation` lists the options one per line, recommended first with
  `(Recommended)`, each with its consequence — at most two short sentences, one in a routine ask —
  and **without** the confidence clause; `Confidence` is the clause — its sole home on this surface;
  where the `research` skill (`nexus-pro`) is in your skill list, `Research offer` is the research
  option — its sole home too, never repeated inside `Recommendation`. The file's own template markup is untouched.
- **Checkpoint report:** the body above "Needs your attention" carries the fact lines, or the routine
  line and at most one fact line, one ask per decision; each flagged item opens with the header's few
  words and is a question sentence; each action option is a label and its consequence on one line,
  the recommended one first with `(Recommended)` and its confidence clause inline on that line,
  `Stop` last — a template element, never one of the ask's options, so it never counts toward the
  four. Every item and option stays one line.
  Never widen or restructure the report's block to fit the ask.
- **Prose fallback:** the questions-file lines in markdown.

On every surface the parts are the same, and each surface's template markup — its headings, field
names and list markers — is untouched; what a field holds follows this contract. An option's **label
leads with the concrete subject and its description states the consequence in at most two short
sentences, one in a routine ask**; within that, options state consequences (obligation 3) rather than
artifact references.

**Attended asks.** The obligations bind an ask that a human will actually read. An unattended run
puts no question to an owner, so the shaping duty has nothing to fire on there — but it does not
vanish: an agent proceeding on a recommended default still writes the `questions.md` Context,
Question and Recommendation fields, and those are read later by a human (the interview that reviews
a `presumed (proceed-default)` answer). **That record carries the same parts the ask would have
carried** — the fact lines, or the routine line and at most one fact line, the question sentence, the
options with the recommended one first, and the confidence clause in its field — so the human who
later audits it reads the same shape a live owner would have read.

**What the boundary checks, and what it cannot.** The decidable part is checked where the ask is
composed, by `owner-ask-gate.js`: refused outright in a foreground session, and **recorded rather
than refused in a spawned one**, where a refusal cannot reach the tool. The check set is exhaustive —
these fourteen and nothing else, each per question except (j), which is per call; a refusal on the
session's away mark is not one of them — it is a refusal on the session's state, and it names no check
(→ agents-workflow.md § Owner-away runs). A refusal names
**every** check that failed, so one rewrite fixes all, ordered as below so the one named first is the
one to fix first: (a) `line count` — at most four lines in an ordinary ask and three in a routine
ask, exactly one question mark, on the question sentence, which is the whole last line;
(b) `line set` — no blank line, every line ending with a sentence end, a fact line of at most two
sentences in an ordinary ask and one in a routine ask, and no line opening with a label, a marker
word or a bullet, a routine line's `{catalogue name}, routine:` opening excepted; (c) `(Recommended) label` on exactly one option, listed first — in a multi-select
question on one or more, listed first and together;
(d) `confidence clause`, well-formed at the end of each recommended option's description and nowhere else;
(e) `internal id` — in the question text, the header or an option; (f) `vocabulary word`;
(g) `pointer phrase`; (h) `markdown emphasis` in the question text; (i) `bracket` — none in the
question text, and in an option only the `(Recommended)` label; (j) `three questions per call`;
(k) `header` — not an internal id and not the word `routine`; (l) `routine line` — only with a
catalogued name, only as the first line, followed by at most one fact line, and the word nowhere else
in the ask; (m) `line length` — no line of the question text over 120 characters;
(n) `option description` — at most two sentences in an ordinary ask and one in a routine ask, each
recommended option's confidence clause not counted. To the boundary an ask is routine exactly when
its first line has the routine line's shape. A refused ask is rewritten in its own form — an ordinary
ask in the relaxed form, a routine ask in the standard-question variant — and sent again; every
resend meets the same boundary.

**Not checked, by decision**, each a composing rule living only in the prose above: the why line and
a routine ask's lack of one; admission (could the owner answer from the question and the options
alone?); the relaxed wording, semicolons included; the reply test (do the options answer the
question?), the concrete-first grammar of an option's label and the wording of its description; the
confidence clause's own line and a description's length in characters; one decision per question; which form a
catalogued question is asked in; the owner's side of the question sentence and the ban on a word
coined during the run; and where the recommendation came from. Two counts the
platform already enforces are not re-checked here either: the header's twelve characters and the two
to four options. The explain re-ask
(→ § Routine questions) is invisible to the boundary too — it sees requests, never answers. It fails
open on anything it cannot read, and a backtick span reads
there as not-bare, which does **not** discharge obligation 2's one-phrase gloss. So a spawned agent
gets no second chance from the boundary — the rest of this section is text, and yours to keep.

### Routine questions

Some decisions the plugin puts to the owner **by rule**, at a fixed point in every run of a kind,
with an option set fixed in shape — the entry either enumerates the maximal set with each option's
condition, or states how the set derives from configuration. Those are **routine questions**, asked
in the short form's standard-question variant:

```
{catalogue name}, routine: {this run's own facts, one sentence}
{the rest of this run's facts, one sentence — only where the routine line cannot hold them}
{the question sentence}
```

Then the entry's options, the recommended one per the entry's rule, each description one sentence.
The word `routine` is the whole signal that this question is asked by rule in every run of its kind,
and it appears nowhere else in the ask. A routine ask's context is the routine line and at most one
more fact line, and it carries **no why line** — the owner already knows why a routine question is
asked, and its reason lives in the entry's long form. Options whose condition does not hold this run
are left out. A run needing an option the entry neither lists nor derives is **not routine for that
run**: ask it as an ordinary ask, in the relaxed form. A novel product decision never qualifies,
whatever its frequency.

**The catalogue name is the one place a listed word may appear.** The names are the owner's handles
for the plugin's fixed questions and are meant to be recognised rather than read; every other part of
a routine ask obeys the word rules.

**The catalogue is the single owner.** `skills/questions-format/references/standard-questions.md`
holds one entry per routine question: its name, when-asked sentence, option set with each option's
consequence and condition, which option is recommended and under what condition, what its `This run`
field names — the facts the routine line carries and, only where one sentence cannot hold them, the
facts of its one fact line — the long form it returns, its away line (what an owner-away run does
in place of asking), and its surfaces. Every asking site **points
at its entry and restates none of it**; a reader new to the plugin reads the catalogue once. The list
is closed — a routine line is valid only with a name it holds, and an unknown name is refused like
any mis-shaped ask.

**When the owner asks what the question means.** An answer through the free-text path that is not one
of the offered options and asks for the question to be explained — the words `explain` or `?` alone
always count, and so does a sentence asking what the question is or means — makes you **re-ask the
same decision in the entry's long form**, which is the relaxed form: a why line saying why the plugin
asks, up to two more fact lines, then the same question sentence and the same options word for word,
labels and descriptions, with the same recommended option. The long form's lines are the other of
the two exceptions to the admission test, beside the why line — the owner has just seen the question
and asked for more — and the long form must say **something the short form did not**. A free-text
answer that names an option or a value is an answer, not a request to explain. The re-ask counts as
**no new round**, cycle or escalation. `explain` on an ordinary ask, or on a long form, is answered
as a discussion turn in prose — the facts and a recommendation — never as a re-shaped question; a
discussion turn is not a decision request, and this shape does not bind it. The boundary cannot help
here — it sees requests, never answers — so this rule is yours to keep.

### Six examples

The two forms as the owner accepted them, rendered in the question box: header, question text,
options, the confidence clause on a line of its own.

An ordinary decision that needs three fact lines — the why line first, then the two facts the owner
cannot answer without:

```
Limit record
The new feature wants every change to a limit recorded: who made it, when, and the old and new value.
Today a limit is changed in Azure. Only Azure's history shows who changed it, and when.
The person who owns the limits has no Azure account, so they can't change a limit or see that history.
How should the team set a limit and keep that record?
  ○ A settings table and a small page (Recommended) — The owner changes limits on the page, and the page records every change.
    Confidence: medium — the record is a firm rule, but the page is extra work for a small feature.
  ○ A command the operator runs — Every change is recorded with the operator's name. There is no page to build, but only the operator can change a limit.
  ○ Configuration only — The cheapest option. The only record stays in Azure, where the owner of the limits can't see it.
```

A question whose answer is a nod — the owner can answer from the question and the options, so there
is no fact line and no why line:

```
Status items
Should status sections drop their inline actions and keep them in the table only?
  ○ Table only (Recommended) — Status sections stay short, and every action is still in the table.
    Confidence: high — it only removes a repetition.
  ○ Keep both — Actions repeat inside the section, which you ruled on 26 August.
```

A decision that needs one fact — the need and the fact fit one line, so the why line carries the fact
and is the only fact line:

```
Action rows
No rule yet decides which commitments get a row, and the table already holds 87 to 100 rows.
Which commitments should get a row in the action table?
  ○ Due date or someone waiting (Recommended) — About a third fewer rows, and the rest stay in the notes.
    Confidence: medium — you have not yet given examples of what you call noise.
  ○ Due date only — Undated commitments stay in the notes, even when someone waits on them.
  ○ Every owned commitment — No filter, so the table keeps about as many rows as today.
```

A fact behind an earlier decision that turned out wrong — the why line names the ruling and what it
rested on, and the next line states the corrected fact, never the story of the mistake; an approval
whose facts changed is re-presented the same way:

```
Slow tests
Slow tests are skipped by default because on 12 September you ruled the nine-minute suite too slow.
Measured today, the full suite takes three minutes.
Should the full suite run by default again?
  ○ Run everything by default (Recommended) — Each run takes three minutes, and no slow test is skipped.
    Confidence: high — the reason for the skip is gone.
  ○ Keep skipping — Runs stay under a minute, and the slow tests run only at the end of a feature.
```

A routine question in the standard-question variant — the routine line, whose one sentence holds
this run's facts, then the entry's question sentence and its derived options (→ § Routine questions):

```
Who reviews
Reviewer pairing check, routine: Opus wrote the code, and the reviewer is set to Opus too.
Which model reviews this step?
  ○ Sonnet (Recommended) — A different model family, and the first reader named when Codex is not installed.
    Confidence: high — the rule for a matching model family names the first listed reader that did not write it.
  ○ Fable — A different model family and the strongest, at the highest cost.
  ○ Keep Opus — The same family as the writer, so the check is skipped for this run.
```

The same routine question after the owner answered `explain` — its long form, in the relaxed form,
with a why line the routine ask did not carry and the same options word for word:

```
Who reviews
A model that checks its own family's work tends to agree with it, so a blind spot in the code survives.
This time Opus wrote the code, and the reviewer is set to Opus too.
Which model reviews this step?
  ○ Sonnet (Recommended) — A different model family, and the first reader named when Codex is not installed.
    Confidence: high — the rule for a matching model family names the first listed reader that did not write it.
  ○ Fable — A different model family and the strongest, at the highest cost.
  ○ Keep Opus — The same family as the writer, so the check is skipped for this run.
```
