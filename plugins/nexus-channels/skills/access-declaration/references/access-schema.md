# access-schema — the `.claude/access.yaml` contract

The file a repo commits at `.claude/access.yaml` to declare, per corpus, what may ground an answer.
This is the normative contract: every key the reader knows, what each kind requires, how a corpus
resolves, what the session-start check verifies, how the version compare works, and the dialect the
reader accepts.

The reader knows **only** the keys below. Anything else is an error, never a pass-through — a typo and
a key from a newer schema look identical here, and ignoring both is how a repo comes to believe it
declared something it did not.

## Location

```
.claude/access.yaml
```

Repo root, committed. An uncommitted declaration resolves differently for each person.

### The drafted-from stamp

A declaration the guided setup drafted from a template carries, as its first line, a full-line comment
naming which version of that template it came from:

```
# drafted-from: sha256:0123456789abcdef
```

One line. `sha256:` followed by the first **16 lowercase hex characters** of a SHA-256 over the
template's content, normalized twice before hashing: any byte-order mark stripped, and line endings
brought to LF. Neither normalization is cosmetic — a checkout that rewrites line endings, or an
editor that adds a mark on save, must not change the stamp, or the repo it happened in is told to
refresh a declaration that is already current.

It is a **comment, not a key**: the reader ignores it exactly as it ignores every other full-line
comment, and it adds no field to the schema. The skill writes it as the declaration's first line; the
reader accepts it as any full-line comment, so a declaration that later grows a header above it keeps
working. A declaration **without** the stamp — hand-written, or written before the stamp existed — is
entirely valid, costs the session no search, and simply never receives the notice below.

Compute it with the same function the hook compares against, never with a general-purpose hashing
tool — an uppercase digest is not read back as a stamp at all, and one taken without the two
normalizations above will never match:

```
node -e "const {templateStamp}=require('{plugin root}/hooks/scripts/lib/access-declaration.js');console.log(templateStamp(require('fs').readFileSync(process.argv[1],'utf8')))" {path to the template}
```

**How a received template is found.** The search is the hook's, and it is deliberately shallow: a file
named exactly `access.template.yaml`, no more than four path segments from the repo root, skipping
dependency, build and tool directories and `.claude/` itself, with the shallowest match winning and
ties broken by name so two clones of one repo always answer the same. It runs in two places — for a
repo with **no declaration**, where the found path is named in the session-start setup line, and for a
declaration **carrying a stamp**, where a template hashing to anything else earns one line saying so.
A declaration with no stamp is never searched for at all, and pays nothing.

### Per-machine defaults

The same template file, prefilled and kept in the person's own Claude config directory, is what the
guided setup drafts from when this repo received no template of its own:

```
{the Claude config directory}/access.template.yaml
```

where the config directory is the value of `CLAUDE_CONFIG_DIR` when that variable is set, and
`~/.claude` otherwise. The same resolution decides which `settings.json` counts as the user layer in
the deny check below — one rule, so a person running a redirected profile is read correctly by both.

Its values are the person's and travel with the person, not with the repo. It is read by the **skill**,
in conversation, and never by the hook: the defaults inform an attended setup, they are not injected
into a session.

## Fields

| Key | Level | Type | Required | Meaning |
|---|---|---|---|---|
| `corpora` | top | block | yes | The only top-level key. Every declaration nests under it. |
| `{name}` | corpus | block | yes | A corpus name — letters, digits, hyphen, underscore. Unique within the file. |
| `kind` | corpus | `private` \| `published` \| `split` | yes | What the corpus *is*. No default. |
| `path` | corpus | repo-relative path | for `private` and `split` | The local copy. Optional for `published`. |
| `manifest` | corpus | block | no | The local copy's version stamp. `published` and `split` only. |
| `manifest.path` | manifest | repo-relative file | yes, once `manifest` is declared | The file carrying the stamp. |
| `manifest.commit_key` | manifest | key name | yes, once `manifest` is declared | The key whose value is the stamp. Read and shown on the row. |
| `manifest.hash_key` | manifest | key name | no | The key whose value is a map of file path to content hash. Validated as a non-empty string here; **read by the analytics extension's model-channel contract**, which uses it to verify one declared file against this manifest. This extension validates it and never acts on it. |
| `remote` | corpus | block | for `split` | Optional for `published`. **Forbidden for `private`.** |
| `remote.server` | remote | server name | yes, once `remote` is declared | The server that serves this corpus. |
| `remote.tools` | remote | list | yes, once `remote` is declared | The tools the agent may call for this corpus. May not be empty. |
| `remote.version_tool` | remote | tool name | no | The tool that answers the corpus's version at the source. Called by the **agent**, per the injected resolver rule — never by the hook. Requires `remote.version_key`. |
| `remote.version_key` | remote | dotted key path | with `version_tool` | Which value in that tool's answer is this corpus's version, e.g. `kb.gitCommit`. Object keys only, no array indexes — one version tool answers for a whole server, so the corpus that owns each value is declared, never guessed. |
| `remote.fetch_tool` | remote | tool name | no | The tool that fetches **one file** of this corpus at the source, by that file's bundle-relative path. Validated here; **read by the analytics extension's model-channel contract**, which calls it per file — never for a whole bundle. This extension validates it and never acts on it. Requires `remote.fetch_key`. |
| `remote.fetch_key` | remote | argument name | with `fetch_tool` | Which **argument** of that tool carries the file's bundle-relative path — letters, digits, hyphen and underscore. A single argument name: one tool names it `path`, another `rel_path`, so the corpus that owns the name declares it rather than leaving the caller to guess. Not a dotted path — that grammar belongs to `version_key`, which reads a value *out* of an answer, while this one names a value going *in*. |
| `deny` | corpus | list | no | Tools that must NOT be callable in this repo, as `mcp__{server}__{tool}`. |

`execution:` is **not** a key of this file. How a datasource is queried is a different contract with a
different owner; an `execution:` key here is rejected as an unknown top-level key, with its line.

## Resolution, per kind

| Kind | Resolves to | Requirements | Disclosure |
|---|---|---|---|
| `private` | **local** (`path`) | `path` required; `remote` forbidden | — |
| `published` | **by compare** — the local copy while it is current, else the remote — when the corpus declares a `path`, a `manifest`, a remote and both compare keys **and the check below finds all of them usable**; otherwise **remote** (`remote.server`) when a remote is declared; otherwise **local** (`path`) | at least one of `path` / `remote` | resolved locally: "no remote declared — local copy, currency unverified" |
| `split` | **both arms** — local (`path`) and remote (`remote.server`); the consuming skill picks per operation | both `path` and `remote` | — |

A corpus whose requirements are unmet is **unresolved**, with the reason. An unresolved corpus is not
a soft warning: the agent must refuse to ground from it and say so, rather than falling back to
whichever arm survived.

## The session-start check

Resolution above is static — what the declaration alone entitles each corpus to. The check then
applies the repo's real settings and files, and **re-resolves**: a check that unresolves an arm changes
that row's status, so the table never shows a `resolved` row beside a finding that says otherwise.

| Check | What it verifies | Effect |
|---|---|---|
| Deny presence | Every `deny` entry appears in `permissions.deny` of the project settings, the project-local settings, or the user settings (the `settings.json` of the Claude config directory named under Location above) — verbatim or covered by a deny glob | Finding (`deny-gap`), disclosed in the envelope and on stderr. **No settings file is ever written.** |
| Contradiction | No declared `remote.tools` entry is itself denied in any layer | That corpus's **remote arm becomes unresolved** — the declaration named a channel the platform will refuse to call |
| Declared paths exist | `path` and `manifest.path` resolve against the repo root **and must stay inside it** | A missing `path` **unresolves the local arm** (a `published` corpus with a live remote stays resolved to it, noted "local copy missing"); a missing `manifest.path` is a finding only. A path resolving **outside** the repo is a corpus-level finding (`path-outside-root`) and is neither checked for existence nor read — the stamp read would otherwise put one line of any file on disk into every session's context |
| Version stamp | `manifest.commit_key` is read from `manifest.path` and shown on the row | A key that is not there is a finding ("stamp unreadable"), not an unresolution |
| Version tool denied | The declared `remote.version_tool` is not itself denied in any layer | Finding (`version-tool-denied`) and **no compare** — the corpus resolves exactly as it would without the compare keys: its remote, or its local copy if that arm is denied too. The remote **arm survives this deny**: only `remote.tools` entries govern whether the arm is callable |
| Compare pair | `version_tool` and `version_key` are declared together | One without the other is a finding (`compare-incomplete`) and no compare; the corpus resolves exactly as it would without either key |
| Fetch pair | `fetch_tool` and `fetch_key` are declared together | One without the other is a finding (`fetch-incomplete`) and the **pair is ignored** — half of it is not handed on as a usable input, because a tool with no argument name leaves the caller guessing which parameter takes the path. The corpus resolves exactly as it would without either key |
| Fetch tool denied | The declared `remote.fetch_tool` is not itself denied in any layer | Finding (`fetch-tool-denied`), and **the pair stops being a usable input** — no per-file fetch. The remote **arm survives this deny**, exactly as it does for a denied version tool: only `remote.tools` entries govern whether the arm is callable. Reported only over a fetch that could have run: not while the pair is incomplete (that has raised its own finding), and not on a corpus the declaration already left unresolved — a tool that was never going to be called earns no second finding |

**Where a usable pair ends up.** One case reaches a consuming extension and no other: a **complete**
pair, on a corpus that **resolved**, whose **remote arm** is usable, and whose fetch tool **no layer
denies** — carried on that row beside the corpus's server and tools. Each of the four failures takes
the pair off the row rather than leaving it to be acted on: half a pair is never carried, a denied
fetch tool removes it, an unresolved arm removes it, and an **unresolved corpus** removes it too —
including one the repo's real files unresolved, such as a `split` whose local copy has gone missing.
That last case is why the rule is about the corpus and not only its arm: a corpus the agent is told
to refuse to ground from must not still advertise a way to fetch its files. The pair is **not**
rendered into the session's channel table — it is an in-process value for a consuming extension, and
a consumer that reads the declaration file directly is reading a surface these checks do not police.

**Deny glob coverage.** A deny is effective from any layer and in any of the platform's documented
forms, so the check accepts all of them: the bare server prefix `mcp__{server}` (every tool of that
server), the per-server wildcard `mcp__{server}__*`, and the broad `mcp__*` and `*`. Verbatim-only
matching would report a false gap every session for a repo that denies by wildcard.

A settings layer that is not readable as JSON is a finding, never a crash — one broken settings file
must not cost a session its channel table.

## The version compare

A `published` corpus with a local copy has one question no static rule can answer: **is the copy
still current?** The declaration answers it by naming two things — the local copy's stamp
(`manifest.commit_key`, read at session start) and the source's version (`remote.version_tool` plus
`remote.version_key`, read at grounding time). When both sides are declared and both are usable, the
row's channel cell reads **`by compare`** and its compare cell names the tool, the key, and the bare
stamp value to compare the tool's answer against.

**The agent runs the compare, not the hook.** A hook has no client for a declared server and cannot
hold its sign-in, so this extension ships the compare's *inputs* and the *rule*; the session calls the
tool. The rule is injected at session start — it says to run the compare once, at the first grounding
of that corpus, to use the local copy when the two values are equal and the remote when they differ,
and to report the outcome on the answer's `Grounded:` line. That injected rule is the one place the
line's shape is defined; no other file redefines it.

| The compare | The table shows | The corpus resolves to |
|---|---|---|
| Owed — every input present | `by compare`, plus the tool id, the key, and the value to compare against | whichever side the compare picks, that session |
| Not declared — no `version_tool`, no `version_key` | `—` | the kind's own rule: a remote if declared, else the local copy, currency unverified |
| Unavailable — a kind other than `published`, no `manifest`, a missing or unreadable stamp, a missing or out-of-root copy, an uncallable remote arm, a denied version tool, or half a compare pair | `— ({the reason})` | the same as if the keys had never been declared |
| It ran, and the tool could not be called | nothing — this happens after session start | the local copy, and the answer says the compare did not run |

Three properties are deliberate. **Different means remote**, not "newer wins": a published copy is
never ahead of its source, so any difference means the copy is behind. **An owed compare is a healthy
declaration, not a defect** — `--check` exits 0 on it, and **unavailability is not itself a finding:
the cause is.** The exit code follows that cause, so a kind that never compares and a corpus that
keeps no stamp both check clean, while a missing copy, an unreadable stamp, a denied version tool or
half a declared pair each raise their own finding and exit 1. And **the two failure times resolve
differently on purpose**: a contradiction visible at session start leaves the corpus on the channel
it would have had without the keys at all, while a tool that fails at grounding time leaves the local
copy as the conservative answer — so the answer says the compare did not run, rather than implying
the copy was checked.

## Dialect

The reader is dependency-free, so it accepts **one canonical block-style shape** rather than a partial
YAML subset that would be misleading about what it supports. Everything outside the dialect is an
error naming its line.

- UTF-8; a byte-order mark is stripped; CRLF line endings are tolerated.
- **Two spaces per level, block style only.** `corpora:` at column 0, corpus names at 2, corpus keys
  at 4, `manifest` / `remote` children at 6.
- Full-line `#` comments and blank lines are ignored. An inline comment starts at a space followed by
  `#`; a `#` with no space before it is part of the value.
- Values may be single- or double-quoted.
- Lists are either inline — `[a, b]` — or block `- a` lines one level deeper.
- **Rejected outright:** a flow mapping (`{ ... }`), a tab anywhere, a missing `corpora:` root, a
  duplicate corpus name, an unknown top-level key. Each fails the **whole file** — every corpus
  unresolved — because the structure is no longer trustworthy.
- **Structural mangling fails the whole file too** — a stray `- item` under no list key, a line that
  is neither a mapping nor a list entry, a key indented under no corpus, an indent deeper than the
  dialect nests, a second `corpora:` root, and a `corpora:` root with nothing under it. Same reason:
  a file whose structure is broken has no trustworthy corpus boundaries, so every corpus is
  unresolved and the error names the line. A stray `- oops` under the last corpus costs the file, not
  one corpus.
- An unknown key at corpus, `manifest` or `remote` level, a corpus name that is not letters, digits,
  hyphen and underscore, an unreplaced `{placeholder}` left over from the template, or a value of the
  wrong shape (a list where a single value belongs) fails **only that corpus**. The rest parsed fine
  and still resolve.

## Examples

A repo with one corpus of each kind:

```yaml
# .claude/access.yaml — what may ground an answer, per corpus.
corpora:
  {handbook}:                        # exists only here
    kind: private
    path: {docs/handbook}

  {catalog}:                         # authoritative source elsewhere, local copy kept
    kind: published
    path: {docs/catalog}
    manifest:
      path: {docs/catalog/manifest.json}
      commit_key: {source_commit}
      hash_key: {content_hash}       # read by a consuming extension, not by this one
    remote:
      server: {catalog_server}
      tools: [{search}, {fetch}]
      version_tool: {version}        # the tool that answers this corpus's version at the source
      version_key: {kb.gitCommit}    # which value in its answer is this corpus's version
      fetch_tool: {get_file}         # fetches ONE file — a consuming extension calls it
      fetch_key: {rel_path}          # which argument of that tool takes the file's path

  {atlas}:                           # both arms real, the skill picks per operation
    kind: split
    path: {docs/atlas}
    remote:
      server: {atlas_server}
      tools:
        - {query}
        - {describe}
    deny: [mcp__{atlas_server}__{write}]
```

A minimal declaration — one published corpus reachable only remotely, with a write tool denied:

```yaml
corpora:
  {catalog}:
    kind: published
    remote:
      server: {catalog_server}
      tools: [{search}]
    deny: [mcp__{catalog_server}__{write}]
```

For that second example to check clean, the repo's `.claude/settings.json` must already carry the
matching deny — proposed to the owner, and added only on their confirmation:

```json
{ "permissions": { "deny": ["mcp__{catalog_server}__{write}"] } }
```
